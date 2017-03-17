/* eslint-disable camelcase */ // Don't throw warnings for names like `error_name`.

window.metapi = {};

(function () {
  "use strict";

  var sockets = {};

  var api_field_mappings = {};
  $.ajax({
    type: 'GET',
    url: 'https://metasmoke.erwaysoftware.com/api/filter_fields'
  })
  .done(function (data) {
    api_field_mappings = data;
  })
  .error(function (jqXhr) {
    api_field_mappings = null;
    console.error("Failed to fetch API field mappings from MS API:", jqXhr);
  });

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

  metapi.Filter = function (required_fields) {
    function createFilter() {
      var bits = new Array(Object.keys(api_field_mappings).length);
      bits.fill(0);

      for (var i = 0; i < required_fields.length; i++) {
        var index = api_field_mappings[required_fields[i]];
        bits[index] = 1;
        console.log(index, bits);
      }

      var unsafeFilter = "";
      while (bits.length) {
        var nextByte = bits.splice(0, 8).join("");
        var charCode = parseInt(nextByte.toString(), 2);
        unsafeFilter += String.fromCharCode(charCode);
        console.log(nextByte, charCode, unsafeFilter);
      }

      return encodeURIComponent(unsafeFilter);
    }

    if (api_field_mappings === {} || api_field_mappings === null) {
      return {
        success: false,
        error_name: 'missing_data',
        error_message: 'API field mappings are not available - refer to earlier error messages or call again shortly.',
        error_code: 410
      };
    }

    return {
      success: true,
      filter: createFilter(),
      included_fields: required_fields,
      api_field_mappings: api_field_mappings
    };
  };

  metapi.WebSocket = function (address, onOpen) {
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

    if (onOpen && typeof onOpen === "function") {
      conn.onopen = onOpen;
    }

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

    var overwrite = options.hasOwnProperty("forceReload") && delete options["forceReload"];

    var optionString = "";
    var optionNames = Object.keys(options);
    for (var i = 0; i < optionNames.length; i++) {
      optionString += "&" + optionNames[i] + "=" + options[optionNames[i]];
    }

    var cached = metapi.postCache.get(ident);
    if (cached && !overwrite) {
      return new metapi.Response(true, cached);
    }

    var fetchUrl = "";
    if (typeof ident === "string") {
      fetchUrl = "https://metasmoke.erwaysoftware.com/api/posts/urls?urls=" + ident + "&key=" + key + optionString;
    }
    else if (typeof ident === "number") {
      fetchUrl = "https://metasmoke.erwaysoftware.com/api/posts/" + ident + "?key=" + key + optionString;
    }

    $.ajax({
      type: "GET",
      url: fetchUrl
    })
    .done(function (data) {
      var items = data.items;
      if (items.length > 0 && items[0]) {
        metapi.postCache.add(ident, items[0]);
        callback(new metapi.Response(true, items[0]));
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
      sockets[key] = new metapi.WebSocket("wss://metasmoke.erwaysoftware.com/cable", function () {
        this.send(JSON.stringify({
          identifier: JSON.stringify({
            channel: "ApiChannel",
            key: key
          }),
          command: "subscribe"
        }));
      });
    }
    sock = sockets[key];

    sock.addCallback(messageCallback);
  };
})();
