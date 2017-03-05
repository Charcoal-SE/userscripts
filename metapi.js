/**
 * metapi
 * Client-side library for interacting with the MS API.
 *
 * Author:  ArtOfCode
 * Version: 0.2.2-beta
 */

/* globals metapi */

window.metapi = {};

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

metapi.postCache = new metapi.Cache();

metapi.getPost = function (ident, key, options, callback) {
  options = options || {};

  var optionString = "";
  var optionNames = Object.keys(options);
  for (var i = 0; i < optionNames.length; i++) {
    optionString += "&" + optionNames[i] + "=" + options[optionNames[i]];
  }

  var cached = metapi.postCache.get(ident);
  if (cached) {
    metapi.debug("Post exists in cache; returning.");
    return new metapi.Response(true, cached);
  }

  if (typeof (ident) === "string") {
    metapi.debug("ident is a string; fetching using posts-by-urls.");

    // Assume ident is a post URL; fetch using posts-by-urls.
    $.ajax({
      type: "GET",
      url: "https://metasmoke.erwaysoftware.com/api/posts/urls?urls=" + ident + "&key=" + key + optionString
    }).done(function (data) {
      var items = data.items;
      if (items.length > 0 && items[0]) {
        metapi.postCache.add(ident, items[0]);
        callback(new metapi.Response(true, items[0]));
      } else {
        callback(new metapi.Response(false,
          {
            error_name: "no_item",
            error_code: 404,
            error_message: "No items were returned or the requested item was null."
          }));
      }
    }).error(function (jqXhr) {
      callback(new metapi.Response(false, jqXhr.responseText));
    });
  } else if (typeof (ident) === "number") {
    metapi.debug("ident is a number; fetching using posts-by-id.");

    // Assume ident is a post ID; fetch using posts.
    $.ajax({
      type: "GET",
      url: "https://metasmoke.erwaysoftware.com/api/posts/" + ident + "?key=" + key + optionString
    }).done(function (data) {
      metapi.debug("Fetch done");
      var items = data.items;
      if (items.length > 0 && items[0]) {
        metapi.postCache.add(ident, items[0]);
        callback(new metapi.Response(true, items[0]));
      } else {
        callback(new metapi.Response(false,
          {
            error_name: "no_item",
            error_code: 404,
            error_message: "No items were returned or the requested item was null."
          }));
      }
    }).error(function (jqXhr) {
      metapi.debug("Fetch failed");
      callback(new metapi.Response(false, jqXhr.responseText));
    });
  } else {
    throw new TypeError("Unsupported post identifier type.");
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
    url: "https://metasmoke.erwaysoftware.com/api/w/post/" + id + "spam_flag?key=" + key + "&token=" + token
  }).done(function (data) {
    callback(new metapi.Response(true, {backoff: data.backoff}));
  }).error(function (jqXhr) {
    if (jqXhr.status === 409) {
      callback(new metapi.Response(false, jqXhr.responseText));
    } else if (jqXhr.status === 500) {
      callback(new metapi.Response(false,
        {
          error_name: "flag_failed",
          error_code: 500,
          error_message: jqXhr.responseText.message
        }));
    }
  });
};
