window.metapi = {};

metapi.Cache = function() {
    var store = {};

    return {
        add: function(k, v, options) {
            options = options || {};

            if (!store[k] || options.overwrite === true) {
                store[k] = v;
            }
            else {
                throw new ReferenceError("Cache key already exists and overwrite is disabled.");
            }
        },

        get: function(k) {
            return store[k];
        },

        delete: function(k) {
            delete store[k];
        }
    };
};

metapi.Response = function(success, data) {
    if (!success) {
        return {
            success: success,
            error_name: data['error_name'],
            error_code: data['error_code'],
            error_message: data['error_message']
        };
    }
    else {
        return {
            success: success,
            data: data
        };
    }
};

metapi.postCache = new metapi.Cache();

metapi.getPost = function(ident, key, options, callback) {
    options = options || {};

    var optionString = "";
    var optionNames = Object.keys(options);
    for (var i = 0; i < optionNames.length; i++) {
        optionString += "&" + optionNames[i] + "=" + options[optionNames[i]];
    }

    var cached = metapi.postCache.get(ident);
    if (cached) {
        return new metapi.Response(true, cached);
    }

    if (typeof(ident) === "string") {
        // Assume ident is a post URL; fetch using posts-by-urls.
        $.ajax({
            'type': 'GET',
            'url': 'https://metasmoke.erwaysoftware.com/api/posts/urls?urls=' + ident + '&key=' + key + optionString
        }).done(function(data) {
            var items = data['items'];
            if (items.length > 0 && items[0]) {
                metapi.postCache.add(ident, items[0]);
                callback(new metapi.Response(true, items[0]));
            }
            callback(new metapi.Response(false,
                     {'error_name': 'no_item',
                      'error_code': 404,
                      'error_message': 'No items were returned or the requested item was null.'}));
        }).error(function(jqXhr, textStatus, errorThrown) {
            callback(new metapi.Response(false, jqXhr.responseText));
        });
    }
    else if (typeof(ident) === "number") {
        // Assume ident is a post ID; fetch using posts.
        $.ajax({
            'type': 'GET',
            'url': 'https://metasmoke.erwaysoftware.com/api/posts/' + ident + '?key=' + key + optionString
        }).done(function(data) {
            var items = data['items'];
            if (items.length > 0 && items[0]) {
                metapi.postCache.add(ident, items[0]);
                callback(new metapi.Response(true, items[0]));
            }
            callback(new metapi.Response(false,
                     {'error_name': 'no_item',
                      'error_code': 404,
                      'error_message': 'No items were returned or the requested item was null.'}));
        }).error(function(jqXhr, textStatus, errorThrown) {
            callback(new metapi.Response(false, jqXhr.responseText));
        });
    }
    else {
        throw new TypeError("Unsupported post identifier type.");
    }
};
