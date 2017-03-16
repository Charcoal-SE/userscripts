/* eslint-disable camelcase */ // Don't throw warnings for names like `error_name`.

window.metapi = {};

(function () {
  "use strict";

  var sockets = {};

  var api_field_mappings = {};

  metapi.debugMode = false;

  metapi.debug = function (obj) {
    if (metapi.debugMode) {
      console.log(obj);
    }
  };

  metapi.Cache = function () {
    var store = {};

    return {
      add: function (k, v, options) {
        options = options || {};

        if (!store[k] || options.overwrite === true) {
          store[k] = v;
        } else {
          throw new ReferenceError("Cache key already exists and overwrite is disabled.");
        }
      },

      get: function (k) {
        return store[k];
      },

      delete: function (k) {
        delete store[k];
      }
    };
  };

  metapi.Response = function (success, data) {
    if (!success) {
      return {
        success: success,
        error_name: data["error_name"],
        error_code: data["error_code"],
        error_message: data["error_message"]
      };
    }

    return {
      success: success,
      data: data
    };
  };

  metapi.Filter = function (required_fields, key, callback) {
    function createFilter() {
      var bits = new Array(Object.keys(api_field_mappings).length);
      bits.fill(0);

      for (var i = 0; i < required_fields.length; i++) {
        var index = api_field_mappings[i];
        bits[index] = 1;
      }

      var unsafeFilter = "";
      while (bits.length) {
        var nextByte = bits.splice(0, 8).join("");
        var charCode = parseInt(nextByte.toString(), 2);
        unsafeFilter += String.fromCharCode(charCode);
      }

      return encodeURIComponent(unsafeFilter);
    }

    if (api_field_mappings === {}) {
      $.ajax({
        type: 'GET',
        url: 'https://metasmoke.erwaysoftware.com/api/filter_fields?key=' + key
      })
      .done(function (data) {
        api_field_mappings = data;
        var filter = createFilter();

        callback(true, {
          filter: filter,
          api_fields: api_field_mappings,
          included_fields: required_fields
        });
      })
      .error(function (jqXhr) {
        callback(false, jqXhr.responseText);
      });
    }
    else {
      var filter = createFilter();
      callback(true, {
        filter: filter,
        api_fields: api_field_mappings,
        included_fields: required_fields
      });
    }
  };

  metapi.WebSocket = function (address) {
    var callbacks = [];

    var getCallbacks = function () {
      return callbacks;
    };

    var addCallback = function (callback) {
      callbacks.push(callback);
    };

    var removeCallback = function (callback) {
      callbacks.pop(callback);
    };

    var conn = new WebSocket(address);
    conn.onmessage = function (data) {
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](data);
      }
    };

    return {
      _conn: conn,
      getCallbacks: getCallbacks,
      addCallback: addCallback,
      removeCallback: removeCallback,
      send: function (data) {
        conn.send(data);
      }
    };
  };

  metapi.postCache = new metapi.Cache();

  metapi.getPost = function (ident, key, options, callback) {
    options = options || {};
    options.key = key;
    options.page = options.page || 1;

    var overwrite = options.hasOwnProperty("forceReload") && options["forceReload"];
    delete options["forceReload"];

    if (!(ident instanceof Array)) {
      ident = [ident];
    }

    // Filter duplicates
    ident = ident.sort().filter(function (item, pos, ary) {
      return !pos || item !== ary[pos - 1];
    });

    var response = [];
    var toLoad = [];

    for (var j = 0; j < ident.length; j++) {
      var cached = metapi.postCache.get(ident[j]);
      if (cached && !overwrite) {
        response.push(new metapi.Response(true, cached));
      } else {
        toLoad.push(ident[j]);
      }
    }

    if (toLoad.length === 0) {
      callback(new metapi.Response(true, response));
    } else {
      var fetchUrl = "https://metasmoke.erwaysoftware.com/api/posts/";
      var type = "GET";
      var isNumeric;

      if (typeof toLoad[0] === "string") {
        fetchUrl += "urls";
        options.urls = toLoad.join(";");
        type = "POST";
        isNumeric = false;
      }
      else if (typeof toLoad[0] === "number") {
        fetchUrl += toLoad.join(encodeURIComponent(";"));
        isNumeric = true;
      }

      $.ajax({
        url: fetchUrl,
        type: type,
        data: options
      })
      .done(function (data) {
        var items = data.items;
        if (items && items.length > 0) {
          for (var k = 0; k < items.length; k++) {
            // TODO: Properly map the response to the input ids
            var cacheValue = isNumeric ? items[k].id : items[k].link;
            metapi.postCache.add(cacheValue, items[k], {overwrite: true}); // Overwrite: "urls to be loaded" aren't cached.
            response.push(items[k]);
          }

          if (data.has_more) {
            options.forceReload = overwrite;
            options.page++;
            metapi.getPost(ident, key, options, function (nextPage) {
              callback(new metapi.Response(true, response.concat(nextPage.data)));
            });
          } else {
            callback(new metapi.Response(true, response));
          }
        } else {
          callback(new metapi.Response(false, {
            error_name: "no_item",
            error_code: 404,
            error_message: "No items were returned or the requested item was null."
          }));
        }
      }).error(function (jqXhr) {
        callback(new metapi.Response(false, jqXhr.responseText));
      });
    }
  };

  metapi.swapCodeForToken = function (code, key, callback) {
    $.ajax({
      type: "GET",
      url: "https://metasmoke.erwaysoftware.com/oauth/token?code=" + code + "&key=" + key
    }).done(function (data) {
      callback(new metapi.Response(true, data));
    }).error(function (jqXhr) {
      callback(new metapi.Response(false, jqXhr.responseText));
    });
  };

  metapi.sendFeedback = function (id, feedback, key, token, callback) {
    $.ajax({
      type: "POST",
      url: "https://metasmoke.erwaysoftware.com/api/w/post/" + id + "/feedback?type=" + feedback + "&key=" + key + "&token=" + token
    }).done(function (data) {
      callback(new metapi.Response(true, data.items));
    }).error(function (jqXhr) {
      callback(new metapi.Response(false, jqXhr.responseText));
    });
  };

  metapi.reportPost = function (url, key, token, callback) {
    $.ajax({
      type: "POST",
      url: "https://metasmoke.erwaysoftware.com/api/w/post/report?post_link=" + url + "&key=" + key + "&token=" + token
    }).done(function () {
      callback(new metapi.Response(true, {}));
    }).error(function () {
      callback(new metapi.Response(false, {error_name: "crap", error_code: 911, error_message: "Something has gone very wrong."}));
    });
  };

  metapi.spamFlagPost = function (id, key, token, callback) {
    $.ajax({
      type: "POST",
      url: "https://metasmoke.erwaysoftware.com/api/w/post/" + id + "/spam_flag?key=" + key + "&token=" + token
    }).done(function (data) {
      callback(new metapi.Response(true, {backoff: data.backoff}));
    }).error(function (jqXhr) {
      if (jqXhr.status === 409) {
        callback(new metapi.Response(false, jqXhr.responseText));
      } else if (jqXhr.status === 500) {
        callback(new metapi.Response(false, {
          error_name: "flag_failed",
          error_code: 500,
          error_message: jqXhr.responseText.message
        }));
      }
    });
  };

  metapi.watchSocket = function (key, messageCallback) {
    var sock;
    if (!sockets.hasOwnProperty(key)) {
      sockets[key] = new metapi.WebSocket("wss://metasmoke.erwaysoftware.com/cable");
    }
    sock = sockets[key];

    sock._conn.onopen = function () {
      sock.send(JSON.stringify({
        identifier: JSON.stringify({
          channel: "ApiChannel",
          key: key
        }),
        command: "subscribe"
      }));
    };

    sock.addCallback(messageCallback);
  };
})();

metapi.getPost(
  [
    "//superuser.com/questions/1189186",
    "//stackoverflow.com/questions/42825995",
    "//stackoverflow.com/a/42826028",
    "//askubuntu.com/questions/893545",
    "//tex.stackexchange.com/a/358714",
    "//tex.stackexchange.com/a/358713",
    "//graphicdesign.stackexchange.com/questions/86886",
    "//gaming.stackexchange.com/questions/303249",
    "//stackoverflow.com/a/42826194",
    "//law.stackexchange.com/questions/17756",
    "//apple.stackexchange.com/questions/276457",
    "//askubuntu.com/questions/893552",
    "//superuser.com/questions/1189191",
    "//apple.stackexchange.com/questions/276461",
    "//graphicdesign.stackexchange.com/questions/86887",
    "//stackoverflow.com/a/42826604",
    "//drupal.stackexchange.com/questions/231452",
    "//ai.stackexchange.com/a/3000",
    "//graphicdesign.stackexchange.com/questions/86888",
    "//meta.stackexchange.com/questions/292425",
    "//codegolf.stackexchange.com/questions/113019",
    "//askubuntu.com/questions/893563",
    "//security.stackexchange.com/questions/154021",
    "//graphicdesign.stackexchange.com/questions/86889",
    "//apple.stackexchange.com/questions/276465",
    "//arduino.stackexchange.com/questions/35870",
    "//superuser.com/questions/1189195",
    "//drupal.stackexchange.com/questions/231455",
    "//graphicdesign.stackexchange.com/questions/86890",
    "//drupal.stackexchange.com/questions/231456",
    "//apple.stackexchange.com/questions/276468",
    "//apple.stackexchange.com/questions/276470",
    "//bitcoin.stackexchange.com/questions/52165",
    "//travel.stackexchange.com/a/89928"
  ],
  "55c3b1f85a2db5922700c36b49583ce1a047aabc4cf5f06ba5ba5eff217faca6", // (FIRE MS api key, for debugging purposes)
  null,
  function () {
    console.log(arguments);
  }
);
