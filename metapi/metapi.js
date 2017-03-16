/**
 * metapi
 * Client-side library for interacting with the MS API.
 *
 * Author:  ArtOfCode
 * Version: 0.3.3-beta
 */

/* globals metapi */
/* eslint-disable camelcase */ // Don't throw warnings for names like `error_name`.

window.metapi = {};

(function () {
  "use strict";

  var sockets = {};

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

    var overwrite = options.hasOwnProperty("forceReload") && delete options["forceReload"];

    var optionString = "";
    var optionNames = Object.keys(options);
    for (var i = 0; i < optionNames.length; i++) {
      optionString += "&" + optionNames[i] + "=" + options[optionNames[i]];
    }

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

    var ids = toLoad.join(encodeURIComponent(";"));
    var fetchUrl = "";
    if (typeof toLoad[0] === "string") {
      fetchUrl = "https://metasmoke.erwaysoftware.com/api/posts/urls?urls=" + ids + "&key=" + key + optionString;
    }
    else if (typeof toLoad[0] === "number") {
      fetchUrl = "https://metasmoke.erwaysoftware.com/api/posts/" + ids + "?key=" + key + optionString;
    }

    $.ajax({
      type: "GET",
      url: fetchUrl
    })
    .done(function (data) {
      var items = data.items;
      if (items.length > 0) {
        for (var k = 0; k < items.length; k++) {
          metapi.postCache.add(items[k].link, items[k], {overwrite: true}); // Overwrite: "urls to be loaded" aren't cached.
          response.push(new metapi.Response(true, items[k]));
        }
        callback(new metapi.Response(true, response));
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
      url: "https://metasmoke.erwaysoftware.com/api/w/post/" + id + "spam_flag?key=" + key + "&token=" + token
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
      /* eslint-disable no-useless-escape */
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
