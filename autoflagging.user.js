// ==UserScript==
// @name        Autoflagging Information & More
// @namespace   https://github.com/Charcoal-SE/
// @description AIM adds autoflagging information and post deletion information to Charcoal HQ.
// @author      Glorfindel
// @author      J F
// @contributor angussidney
// @contributor ArtOfCode
// @contributor Cerbrus
// @version     0.12
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging.user.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.stackexchange.com/rooms/11540/charcoal-hq
// @match       *://chat.stackoverflow.com/rooms/41570/so-close-vote-reviewers
// @match       *://chat.meta.stackexchange.com/rooms/89/tavern-on-the-meta
// @grant       none
// ==/UserScript==
/* global autoflagging */

// To enable/disable trace information, type autoflagging.trace(true) resp.
// autoflagging.trace(false) in your browser's console.

(function () {
  "use strict";
  // console.log("Autoflagging Information started.");

  // Inject CSS
  var css = window.document.createElement("link");
  css.rel = "stylesheet";
  css.href = "//charcoal-se.org/userscripts/autoflagging.css";
  document.head.appendChild(css);

  // Constants
  var hOP = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);
  window.autoflagging = {};
  autoflagging.traceKey = "autoflagging-trace";
  autoflagging.trace = function (enable) {
    // Enable/disable trace
    if (enable) {
      console.log("Autoflagging trace enabled.");
      window.localStorage.setItem(autoflagging.traceKey, "true");
    } else {
      console.log("Autoflagging trace disabled.");
      window.localStorage.removeItem(autoflagging.traceKey);
    }
    return enable;
  };
  autoflagging.log = function (object) {
    // Trace enabled?
    if (window.localStorage.getItem(autoflagging.traceKey) !== "true") {
      return;
    }
    console.log("Time: " + new Date().toISOString().substring(11, 23));
    console.log(object);
  };
  autoflagging.smokeyIds = { // this is Smokey's user ID for each supported domain
    "chat.stackexchange.com": 120914,
    "chat.stackoverflow.com": 3735529,
    "chat.meta.stackexchange.com": 266345,
  };
  autoflagging.smokeyID = autoflagging.smokeyIds[location.host];
  autoflagging.key = "d897aa9f315174f081309cef13dfd7caa4ddfec1c2f8641204506636751392a4"; // this script's MetaSmoke API key
  autoflagging.baseURL = "https://metasmoke.erwaysoftware.com/api/posts/urls?key=" + autoflagging.key;
  autoflagging.selector = ".user-" + autoflagging.smokeyID + " .message ";
  autoflagging.messageRegex = /\[ <a[^>]+>SmokeDetector<\/a>(?: \| <a[^>]+>MS<\/a>)? [^\]]+?] ([^:]+):(?: post \d+ out of \d+\):)? <a href="([^"]+)">(.+?)<\/a> by (?:<a href="[^"]+\/u\/(\d+)">(.+?)<\/a>|a deleted user) on <code>([^<]+)<\/code>/;
  // MS links can appear in other Smokey messages too (like feedback on an old post, or conflicted feedback).
  // Fortunately, those are direct links like https://metasmoke.erwaysoftware.com/post/56004 and won't be found by this selector.

  // Error handling
  autoflagging.notify = Notifier().notify; // eslint-disable-line new-cap

  /*!
   * Decorates a jQuery DOM element with autoflagging information from the data.
   *
   * The parameter 'data' is supposed to have a boolean property 'flagged', and a property 'users' with user information.
   * `element` is a message (i.e. has the message class)
   */
  autoflagging.decorateMessage = function (message, data) {
    autoflagging.decorate(message.children(".ai-information"), data);
    autoflagging.decorate(message.find(".meta .ai-information"), data);
  };

  autoflagging.decorate = function (element, data) {
    element.find(".ai-spinner").remove();
    element.addClass("ai-loaded");

    // Insert reason weight
    if (typeof data.reason_weight != "undefined") {
      element.siblings(".content").contents().each(function (index, node) {
        // Text node?
        if (node.nodeType !== 3) {
          return;
        }
        // Text node with reasons (but no weight added yet)?
        // I'd like to test it with this regex: ^ ].*(?>!\)): $
        // but it doesn't compile in JS.
        var text = node.textContent;
        if (!text.startsWith(" ]") || !text.endsWith(": ") || text.endsWith("): ")) {
          return;
        }
        // Insert weight
        node.textContent = text.substr(0, text.length - 2) +
          " (" + data.reason_weight + "): ";
      });
    }

    var names = {
      before: "prepend",
      after: "append"
    };

    Object.keys(autoflagging.decorate).forEach(function (key) {
      var f = autoflagging.decorate[key];
      if (element.find(".ai-" + key).length === 0) {
        element[names[f.location]]($("<" + (f.el || "span") + "/>").addClass("ai-" + key));
      }
      if (!f.key) {
        f(element.find(".ai-" + key), data);
      } else if (hOP(data, f.key)) {
        f(element.find(".ai-" + key), data[f.key], data);
      }
    });
  };

  /*!
   * “Spec” for methods of autoflagging.decorate:
   * Takes an element to update.
   * data is from the API.
   * Properties:
   * * location [required] ("before" | "after") Where to add the element if it
   *   doesn’t exist
   * * key [optional] The key that must be present on the data. The value of
   *   this key is passed as the second parameter.
   * * el [optional] the name of the element to create.
   */
  autoflagging.decorate.autoflag = function ($autoflag, data, allData) {
    // Determine if you (i.e. the current user) autoflagged this post.
    var site = "";
    switch (location.hostname) {
      case "chat.stackexchange.com":
        site = "stackexchange";
        break;
      case "chat.meta.stackexchange.com":
        site = "meta_stackexchange";
        break;
      case "chat.stackoverflow.com":
        site = "stackoverflow";
        break;
      default:
        console.error("Invalid site for autoflagging: " + location.hostname);
        break;
    }
    data.youFlagged = data.users.filter(function (user) {
      return user[site + "_chat_id"] === CHAT.CURRENT_USER_ID;
    }).length === 1;

    if ($autoflag.find(".ai-you-flagged").length === 0) {
      $autoflag.prepend($("<strong/>").text("You autoflagged.").addClass("ai-you-flagged"));
    }
    if ($autoflag.find(".ai-flag-count").length === 0) {
      $autoflag.append($("<a/>").addClass("ai-flag-count"));
    }

    if ($autoflag.data("users")) {
      data.users = $autoflag.data("users").concat(data.users);
      var uniqUsers = {};
      data.users.forEach(function (user) {
        uniqUsers[user.stackexchange_chat_id] = user;
      });
      data.users = Object.keys(uniqUsers).map(function (key) {
        return uniqUsers[key];
      });
    }
    $autoflag.data("users", data.users);

    if (allData.id && data.users.length > 0) {
      $autoflag.find(".ai-flag-count").attr("href", "https://metasmoke.erwaysoftware.com/post/" + allData.id + "/flag_logs");
    }

    $autoflag.find(".ai-you-flagged").toggle(data.flagged && data.youFlagged);
    $autoflag.find(".ai-flag-count")
             .text(data.flagged ? String(data.users.length) : "")
             .toggleClass("ai-not-autoflagged", !data.flagged)
             .attr("title", data.flagged ?
               "Flagged by " + data.users.map(function (user) {
                 return user.username || user.user_name;
               }).join(", ") :
               "Not Autoflagged");
    $autoflag.data("users", data.users);
  };

  autoflagging.decorate.autoflag.location = "after";
  autoflagging.decorate.autoflag.key = "autoflagged";

  autoflagging.decorate.feedback = function ($feedback, data) {
    data.forEach(function (item) {
      autoflagging.decorate.feedback._each($feedback, item);
    });
  };
  autoflagging.decorate.feedback.location = "before";
  autoflagging.decorate.feedback.key = "feedbacks";

  autoflagging.decorate.feedback._each = function ($feedback, data) {
    var allFeedbacks = $feedback.data("feedbacks") || {};
    allFeedbacks[data.feedback_type] = (allFeedbacks[data.feedback_type] || []).concat(data);
    $feedback.data("feedbacks", allFeedbacks);

    var simpleFeedbacks = {
      k: {},
      f: {},
      n: {}
    };
    for (var type in allFeedbacks) {
      if (hOP(allFeedbacks, type) && allFeedbacks[type] instanceof Array) {
        var users = allFeedbacks[type].map(function (user) {
          return user.user_name;
        });

        if (type.indexOf("t") !== -1) {
          simpleFeedbacks.k[type] = users;
        } else if (type.indexOf("f") !== -1) {
          simpleFeedbacks.f[type] = users;
        } else if (type.indexOf("naa") !== -1) {
          simpleFeedbacks.n[type] = users;
        }
      }
    }

    $feedback.empty();
    autoflagging.decorate.feedback.addFeedback(simpleFeedbacks.k, $feedback, "tpu-");
    autoflagging.decorate.feedback.addFeedback(simpleFeedbacks.f, $feedback, "fp-");
    autoflagging.decorate.feedback.addFeedback(simpleFeedbacks.n, $feedback, "naa-");
  };

  autoflagging.decorate.feedback.addFeedback = function (items, $el, defaultKey) {
    var count = Object.keys(items)
                      .map(function (key) {
                        return items[key].length;
                      })
                      .reduce(function (a, b) {
                        return a + b;
                      }, 0);
    if (count) {
      var title = (items[defaultKey] || []).join(", ");
      var titles = Object.keys(items)
                         .map(function (key) {
                           if (key === defaultKey) {
                             return undefined;
                           }
                           return key + ": " + items[key].join(", ");
                         });
      titles.unshift(title);
      titles = titles.filter(function (x) {
        return x;
      });
      $el.append($("<span/>").addClass("ai-feedback-info").addClass("ai-feedback-info-" + defaultKey.replace(/-$/, "")).text(count).attr("title", titles.join("; ")));
    }
  };

  /*!
   * Decorates a jQuery DOM element with a spinner.
   */
  autoflagging.addSpinner = function (element, inline) {
    element.append("<span class=\"ai-information" + (inline ? " inline" : "") + "\">" +
      "<img class=\"ai-spinner\" src=\"//i.stack.imgur.com/icRVf.gif\" title=\"Loading autoflagging information ...\" />" +
      "</span>");
    if (element.parent().children(":first-child").hasClass("timestamp") && element.is(":nth-child(2)")) {
      // don’t overlap the timestamp
      element.css({
        minHeight: "3em"
      });
    }
  };

  autoflagging.addSpinnerToMessage = function (element) {
    autoflagging.addSpinner(element);
    autoflagging.addSpinner(element.find(".meta"), true);
  };

  /*!
   * Calls the API to get information about multiple posts at once, considering the paging system of the API.
   * It will use the results to decorate the Smokey reports which are already on the page.
   */
  autoflagging.callAPI = function (urls, page) {
    autoflagging.log("Call API");
    if (page == null) {
      page = 1;
    }
    var autoflagData = {};
    var url = autoflagging.baseURL + "&page=" + page + "&urls=" + urls;
    autoflagging.log("URL: " + url);
    $.get(url, function (data) {
      // Group information by link
      for (var i = 0; i < data.items.length; i++) {
        autoflagData[data.items[i].link] = data.items[i];
      }

      // Loop over all Smokey reports and decorate them
      $(autoflagging.selector).each(function () {
        var postURL = autoflagging.getPostURL(this);
        if (typeof autoflagData[postURL] == "undefined") {
          return;
        }
        autoflagging.decorateMessage($(this), autoflagData[postURL]);
        // Post deleted?
        if (autoflagData[postURL].deleted_at != null) {
          $(this).find(".content").toggleClass("ai-deleted");
        }
      });

      if (data.has_more) {
        // There are more items on the next 'page'
        autoflagging.callAPI(urls, ++page);
      }
    }).fail(function (xhr) {
      autoflagging.notify("Failed to load data: " + xhr.statusText);
    });
  };

  autoflagging.getPostURL = function (message) {
    var matches = autoflagging.messageRegex.exec($(message).html());
    return matches && matches[2];
  };

  // Wait for the chat messages to be loaded.
  var chat = $("#chat");
  chat.on("DOMSubtreeModified", function () {
    if (chat.html().length !== 0) {
      // Chat messages loaded
      chat.off("DOMSubtreeModified");

      // Find all Smokey reports (they are characterized by having an MS link) and extract the post URLs from them
      var urls = "";
      $(autoflagging.selector).each(function () {
        var url = autoflagging.getPostURL(this);
        // Show spinner
        if (url !== null) {
          if (urls !== "") {
            urls += "%3B";
          }
          autoflagging.addSpinnerToMessage($(this));
          urls += url;
        }
      });

      // MS API call
      autoflagging.callAPI(urls);

      $(".message:has(.ai-information)").addClass("ai-message");
    }
  });

  // Add autoflagging information to older messages as they are loaded
  $("#getmore, #getmore-mine").click(function () {
    $(this).one("DOMSubtreeModified", function () {
      // We need another timeout here, because the first modification occurs before
      // the new (old) chat messages are loaded.
      setTimeout(function () {
        var urls = "";
        $(autoflagging.selector).filter(function () {
          return !$(this).find(".ai-information").length;
        }).each(function () {
          var url = autoflagging.getPostURL(this);
          if (url !== null) {
            if (urls !== "") {
              urls += "%3B";
            }
            autoflagging.addSpinnerToMessage($(this));
            urls += url;
          }
        });
        // MS API call
        autoflagging.callAPI(urls);
      }, 500);
    });
  });

  // Listen to MS events
  autoflagging.msgQueue = [];
  autoflagging.socket = new WebSocket("wss://metasmoke.erwaysoftware.com/cable");
  autoflagging.socket.onmessage = function (message) {
    function decorate(selector, data) {
      (function _deco() {
        if ($(selector).parents(".message").find(".ai-spinner, .ai-information.ai-loaded").length > 0) {
          autoflagging.decorateMessage($(selector).parents(".message"), data);
        } else {
          // MS is faster than chat; add the decorate operation to the queue
          autoflagging.msgQueue.push(_deco);
        }
      })();
    }

    // Parse message
    var jsonData = JSON.parse(message.data);
    switch (jsonData.type) {
      case "confirm_subscription":
      case "ping":
      case "welcome":
        break;
      default: {
        // Analyze socket message
        autoflagging.log(jsonData.message);
        var flagLog = jsonData.message.flag_log;
        var deletionLog = jsonData.message.deletion_log;
        var feedback = jsonData.message.feedback;
        var notFlagged = jsonData.message.not_flagged;
        if (typeof flagLog != "undefined") {
          // Autoflagging information
          autoflagging.log(flagLog.user_name + " autoflagged " + flagLog.post.link);
          let selector = autoflagging.selector + "a[href^='" + flagLog.post.link + "']";
          decorate(selector, flagLog.post);
        } else if (typeof deletionLog != "undefined") {
          // Deletion log
          autoflagging.log(deletionLog.post_link + " deleted");
          let selector = autoflagging.selector + "a[href^='" + deletionLog.post_link + "']";
          $(selector).parents(".content").addClass("ai-deleted");
        } else if (typeof feedback != "undefined") {
          // Feedback
          autoflagging.log(feedback.user_name + " posted " + feedback.symbol + " on " + feedback.post_link, feedback); // feedback_type
          let selector = autoflagging.selector + "a[href^='" + feedback.post_link + "']";
          decorate(selector, {
            feedbacks: [feedback]
          });
        } else if (typeof notFlagged != "undefined") {
          let selector = autoflagging.selector + "a[href^='" + notFlagged.post.link + "']";
          decorate(selector, notFlagged.post);
        }
        break;
      }
    }
  };

  autoflagging.socket.onopen = function () {
    // Send authentication
    autoflagging.socket.send(JSON.stringify({
      identifier: JSON.stringify({
        channel: "ApiChannel",
        key: autoflagging.key
      }),
      command: "subscribe"
    }));
  };

  // Sometimes, autoflagging information arrives before the chat message.
  // The code below makes sure the queued decorations are executed.
  CHAT.addEventHandlerHook(function (e) {
    if (e.event_type === 1 && e.user_id === autoflagging.smokeyID) {
      var self = this;
      var q = autoflagging.msgQueue;
      autoflagging.msgQueue = [];
      var args = arguments;
      q.forEach(function (f) {
        setTimeout(function () {
          f.apply(self, args);
        });
      });
      setTimeout(function () {
        var matches = autoflagging.messageRegex.exec($("#message-" + e.message_id + " .content").html());
        if (!matches) {
          return;
        }
        // Show spinner
        autoflagging.addSpinnerToMessage($("#message-" + e.message_id));
      }, 1000);
    }
  });
})();
