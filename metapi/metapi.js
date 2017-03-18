/* eslint-disable camelcase */ // Don't throw warnings for names like `error_name`.

window.metapi = {};

(function () {
  "use strict";

  // Private: Dictionary of API keys to metapi.WebSockets
  var sockets = {};

  // Private: Dictionary of MS database field names to bitstring indexes
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

  // Public: Enable debug mode by setting this to true. Calls to metapi.debug will log output.
  metapi.debugMode = false;

  /**
   * If debug mode is enabled, print a message to the console.
   *
   * @param obj a message or object to print to the console
   */
  metapi.debug = function (obj) {
    if (metapi.debugMode) {
      console.log(obj);
    }
  };

  /**
   * A simple key-value cache.
   */
  metapi.Cache = function () {
    var store = {};

    return {
      /**
       * Add a key-value pair to the cache. The only currently supported option is 'overwrite', which dictates
       * whether or not an existing key should be overwritten.
       *
       * @param  k        the cache key under which to store the value
       * @param  v        the value to store
       * @param  options  a dictionary of options
       * @throws ReferenceError if the key already exists and overwrite is disabled
       */
      add: function (k, v, options) {
        options = options || {};

        if (!store[k] || options.overwrite === true) {
          store[k] = v;
        } else {
          throw new ReferenceError("Cache key already exists and overwrite is disabled.");
        }
      },

      /**
       * Finds and returns the value of a cache key.
       *
       * @param k  the cache key to look up
       * @returns  the value stored under the specified cache key
       */
      get: function (k) {
        return store[k];
      },

      /**
       * Removes a value from the cache.
       *
       * @param k  the cache key to remove
       */
      delete: function (k) {
        delete store[k];
      }
    };
  };

  /**
   * Internal class representing an API response from metasmoke.
   *
   * @param success  a boolean indicating the status of the API requested
   * @param data     an object containing data returned from the request, or error description fields if the request
   *                 failed.
   */
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

  /**
   * Wrapper around a metasmoke API filter.
   *
   * @param required_fields  an array of fully-qualified database field (FQDF) names that are required in the response
   *                         to metasmoke API queries using this filter.
   */
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

      /**
       * The filter string itself. This string can be passed as the filter query string parameter to a metasmoke API
       * request.
       */
      filter: createFilter(),

      /**
       * Equivalent to the original required_fields list: an array of fields that are included in this filter.
       */
      included_fields: required_fields,

      /**
       * Equivalent to the internal api_field_mappings dictionary. This maps FQDF names to bitstring indexes, and can
       * be used by applications to create their own filters.
       */
      api_field_mappings: api_field_mappings
    };
  };

  /**
   * Wrapper around the native WebSocket class, providing functionality for multiple callbacks for a single event.
   *
   * @param address  the address of the websocket to connect to
   * @param onOpen   a callback function for the websocket's open event
   */
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
      /**
       * The underlying native WebSocket connection object.
       */
      _conn: conn,

      /**
       * Retrieves an arrary of existing callbacks for the message event.
       *
       * @returns an array of functions, each of which is a message callback
       */
      getCallbacks: getCallbacks,

      /**
       * Appends a message callback function to the callbacks list.
       *
       * @param callback  a function with optional data parameter, used as a callback to the message event
       */
      addCallback: addCallback,

      /**
       * Given a reference to a callback function, removes that function from the message callbacks list.
       *
       * @param callback  a reference to a callback function already in the socket's message callbacks list
       */
      removeCallback: removeCallback,

      /**
       * Sends a message through the websocket.
       *
       * @param data  an object containing data to be sent down the websocket connection
       */
      send: function (data) {
        conn.send(data);
      }
    };
  };

  /**
   * A metapi.Cache instance used to cache posts returned from the metasmoke API.
   */
  metapi.postCache = new metapi.Cache();

  /**
   * Retrieves a post from the metasmoke API.
   *
   * @param ident     a string URL or numeric ID representing the post to fetch
   * @param key       a string containing the requester's MS API key
   * @param options   a dictionary of options that will be sent as query string parameters to the API
   * @param callback  a callback function that accepts a metapi.Response as a single parameter
   */
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
      if (cached && options.page === 1 && !overwrite) {
        response.push(cached);
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
      var requiredFilter;

      if (typeof toLoad[0] === "string") {
        fetchUrl += "urls";
        options.urls = toLoad.join(";");
        type = "POST";
        isNumeric = false;
        requiredFilter = "posts.link";
      }
      else if (typeof toLoad[0] === "number") {
        fetchUrl += toLoad.join(encodeURIComponent(";"));
        isNumeric = true;
        requiredFilter = "posts.id";
      }

      var f = options.filter;
      if (f && (!f.included_fields || f.included_fields.indexOf(requiredFilter) === -1)) {
        callback(new metapi.Response(false, {
          error_name: "bad_request",
          error_code: 400,
          error_message: "An invalid filter is passed in the options."
        }));
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

  /**
   * Given a metasmoke MicrOAuth code, exchanges that code for an API write token.
   *
   * @param code      the 7-hex-digit code provided to the app by a user
   * @param key       the requester's MS API key
   * @param callback  a callback function accepting a metapi.Response as a single parameter
   */
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

  /**
   * Sends a single feedback to the metasmoke API.
   *
   * @param id        the numeric of the post to feed back on
   * @param feedback  a string containing the type of feedback to send (i.e. "tpu-" or "fp-")
   * @param key       the requester's MS API key
   * @param token     a valid MS API write token for the user sending the feedback
   * @param callback  a callback function accepting a metapi.Response as a single parameter
   */
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

  /**
   * Reports a post to Smokey via the metasmoke API.
   *
   * @param url       a string containing the URL to the post to be reported
   * @param key       the requester's MS API key
   * @param token     a valid MS API write token for the user reporting the post
   * @param callback  a callback function accepting a metapi.Response as a single parameter
   */
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

  /**
   * Casts a spam flag on a post via the metasmoke API. This also creates a FlagLog record on metasmoke, to track
   * flags being cast via the API.
   *
   * @param id        the numeric MS ID of the post to cast a flag on
   * @param key       the requester's MS API key
   * @param token     a valid MS API write token for the user casting the flag
   * @param callback  a callback function accepting a metapi.Response as a single parameter
   */
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

  /**
   * Connects to the metasmoke API websocket and passes messages back to the caller via a callback.
   *
   * @param key              the requester's MS API key
   * @param messageCallback  a callback function accepting a single data parameter containing a message received on the
   *                         websocket
   */
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
