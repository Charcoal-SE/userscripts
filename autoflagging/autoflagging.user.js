// ==UserScript==
// @name        Autoflagging Information & More
// @namespace   https://github.com/Charcoal-SE/
// @description AIM adds autoflagging, deletion and feedback information to Charcoal HQ.
// @author      Glorfindel
// @author      J F
// @contributor angussidney
// @contributor ArtOfCode
// @contributor Cerbrus
// @version     0.20
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging/autoflagging.meta.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging/autoflagging.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.stackexchange.com/rooms/11540/charcoal-hq*
// @match       *://chat.stackoverflow.com/rooms/41570/so-close-vote-reviewers*
// @match       *://chat.meta.stackexchange.com/rooms/89/tavern-on-the-meta*
// @match       *://chat.stackexchange.com/rooms/56223/the-spam-blot*
// @match       *://chat.stackoverflow.com/rooms/111347/sobotics*
// @match       *://chat.stackexchange.com/rooms/201/ask-ubuntu-general-room*
// @match       *://chat.stackexchange.com/rooms/3877/raiders-of-the-lost-downboat*
// @require     https://cdn.rawgit.com/joewalnes/reconnecting-websocket/fd7c819bb15eeee3452c17e317c0a3664c442965/reconnecting-websocket.min.js
// @require     https://charcoal-se.org/userscripts/vendor/debug.min.js
// @grant       none
// ==/UserScript==

/* global autoflagging, ReconnectingWebSocket, unsafeWindow */

// To enable/disable trace information, type autoflagging.trace(true) or
// autoflagging.trace(false), respectively, in your browser's console.

(function () {
  "use strict";
  const createDebug = typeof unsafeWindow === "undefined" ? window.debug : unsafeWindow.debug || window.debug;
  const debug = createDebug("aim");
  debug.decorate = createDebug("aim:decorate");
  debug.ws = createDebug("aim:ws");
  debug.queue = createDebug("aim:queue");
  debug("started");

  // Inject CSS
  var css = window.document.createElement("link");
  css.rel = "stylesheet";
  css.href = "//charcoal-se.org/userscripts/autoflagging/autoflagging.css";
  document.head.appendChild(css);

  // Load the Emoji support script
  if (!window.emojiSupportChecker) {
    $.ajaxSetup({cache: true});
    $.getScript("//charcoal-se.org/userscripts/emoji/emoji.js");
    $.ajaxSetup({cache: false});
  }

  // Constants
  var hOP = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);
  window.autoflagging = {};
  autoflagging.smokeyIds = { // this is Smokey's user ID for each supported domain
    "chat.stackexchange.com": 120914,
    "chat.stackoverflow.com": 3735529,
    "chat.meta.stackexchange.com": 266345,
  };
  autoflagging.smokeyID = autoflagging.smokeyIds[location.host];
  autoflagging.key = "d897aa9f315174f081309cef13dfd7caa4ddfec1c2f8641204506636751392a4"; // this script's MetaSmoke API key
  autoflagging.apiURL = "https://metasmoke.erwaysoftware.com/api/v2.0";
  autoflagging.baseURL = autoflagging.apiURL + "/posts/urls?filter=GMNHLIKKJKKGMKJFMJIMGHNHJILFOL&key=" + autoflagging.key;
  autoflagging.selector = ".user-" + autoflagging.smokeyID + " .message ";
  autoflagging.messageRegex = /\[ <a[^>]+>SmokeDetector<\/a>(?: \| <a[^>]+>MS<\/a>)? [^\]]+?] ([^:]+):(?: post \d+ out of \d+\):)? <a href="([^"]+)">(.+?)<\/a> by (?:<a href="[^"]+\/u(sers)?\/(\d+)">(.+?)<\/a>|a deleted user) on <code>([^<]+)<\/code>/;
  autoflagging.hasMoreRegex = /\+\d+ more \(\d+\)/;
  autoflagging.hasNotificationRegex = /^ \(@.*\)$/;

  // Error handling
  autoflagging.notify = Notifier().notify; // eslint-disable-line new-cap

  /*!
   * Decorates a message DOM element with information from the API or websocket.
   * It will add the information both to the message itself
   * and to the 'meta'-element shown on hovering over the message.
   *
   * The parameter 'data' is supposed to have an optional property 'flagged' with flagging information, and an optional property 'users' with user information.
   * `element` is a message (i.e. has the .message class)
   */
  autoflagging.decorateMessage = function ($message, data) {
    debug.decorate(data, $message);

    autoflagging.decorate($message.children(".ai-information"), data);
    autoflagging.decorate($message.find(".meta .ai-information"), data);

    // Remove @ notifications
    var lastTextNode = $message.find(".content").get(0).lastChild;
    if (autoflagging.hasNotificationRegex.test(lastTextNode.nodeValue)) {
      lastTextNode.parentNode.removeChild(lastTextNode);
    }

    autoflagging.getAllReasons($message, data);
  };

  /*!
   * Extend a report message's reasons when the message was cropped.
   */
  autoflagging.getAllReasons = function ($message, data) {
    if (autoflagging.hasMoreRegex.test($message.html())) {
      $.get(
        "https://metasmoke.erwaysoftware.com/api/v2.0/post/" + data.id + "/reasons",
        {key: autoflagging.key},
        function (response) {
          if (response && response.items) {
            // The textnode containing "] <Reasons> +X more (weight)"
            var textNode = $message
              .find(".content")
              .contents()
              .filter(function () {
                return this.nodeType === 3 &&
                  autoflagging.hasMoreRegex.test($(this).text());
              });

            var reasons = response.items.map(function (reason) {
              return reason.reason_name;
            });

            var fullReason = textNode
              .text()
              .replace(/[^\]]+ \(/, " " + reasons.join(", ") + " (");

            // Replace the textnode with the new text.
            textNode.replaceWith(fullReason);
          }
        })
        .fail(function (xhr) {
          debug("Failed to load reasons:", xhr);
        });
    }
  };

  /*!
   * Adds the AIM information to the provided element.
   * Don't call this method directly, use decorateMessage instead.
   */
  autoflagging.decorate = function ($element, data) {
    // Remove spinner
    $element.find(".ai-spinner").remove();
    $element.addClass("ai-loaded");

    var names = {
      before: "prepend",
      after: "append"
    };

    // The decorate operation consists currently of two parts:
    // - autoflag
    // - feedback
    Object.keys(autoflagging.decorate).forEach(function (key) {
      var f = autoflagging.decorate[key];
      if ($element.find(".ai-" + key).length === 0) {
        $element[names[f.location]]($("<" + (f.el || "span") + "/>").addClass("ai-" + key));
      }
      if (!f.key) {
        f($element.find(".ai-" + key), data);
      } else if (hOP(data, f.key)) {
        f($element.find(".ai-" + key), data[f.key], data);
      }
    });
  };

  /*
   * Specification for methods of autoflagging.decorate:
   *
   * - 1) [required] a DOM element to update
   * - 2) [required] data from the API or websocket, usually only the parts
   *      which is relevant
   * - 3) [optional] complete post data
   *
   * It is best to make the method “idempotent,” meaning that it will display
   * the same thing when called repeatedly with the same parameters.
   *
   * Properties:
   * - location [required] ("before" | "after") Where to add the element if it
   *   doesn’t exist
   * - key [optional] The key that must be present on the data. The value of
   *   this key is passed as the second parameter.
   * - el [optional] the name of the element to create.
   */

  /*!
   * Adds autoflag information to an autoflag DOM element.
   */
  autoflagging.decorate.autoflag = function ($autoflag, data, post) {
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

    if (post.id && data.users.length > 0) {
      $autoflag.find(".ai-flag-count").attr("href", "https://metasmoke.erwaysoftware.com/post/" + post.id + "/flag_logs");
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
  autoflagging.decorate.autoflag.key = "autoflagged";
  autoflagging.decorate.autoflag.location = "after";

  /*!
   * Adds reason weight to message
   */
  autoflagging.decorate.weight = function ($weight, weight) {
    $weight.text(" • " + weight).attr("title", "Reason Weight");
  };
  autoflagging.decorate.weight.key = "reason_weight";
  autoflagging.decorate.weight.location = "after";

  /*!
   * Adds feedback information to a feedback DOM element.
   */
  autoflagging.decorate.feedback = function ($feedback, data) {
    data.forEach(function (item) {
      autoflagging.decorate.feedback._each($feedback, item);
    });
  };
  autoflagging.decorate.feedback.key = "feedbacks";
  autoflagging.decorate.feedback.location = "before";

  /*!
   * Adds feedback information to a feedback DOM element.
   */
  autoflagging.decorate.feedback._each = function ($feedback, data) {
    // Group feedback by type
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

    // Update feedback DOM element
    $feedback.empty();
    autoflagging.decorate.feedback.addFeedback(simpleFeedbacks.k, $feedback, "tpu-");
    autoflagging.decorate.feedback.addFeedback(simpleFeedbacks.f, $feedback, "fp-");
    autoflagging.decorate.feedback.addFeedback(simpleFeedbacks.n, $feedback, "naa-");
  };

  /*!
   * Adds feedback of one type (tpu-, naa-, fp-) to a feedback DOM element.
   */
  autoflagging.decorate.feedback.addFeedback = function (items, $feedback, defaultKey) {
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
                           if (key.replace(/-$/, "") === defaultKey.replace(/-$/, "")) {
                             return undefined;
                           }
                           return key + ": " + items[key].join(", ");
                         });
      titles.unshift(title);
      titles = titles.filter(function (x) {
        return x;
      });
      $feedback.append(
        $("<span/>").addClass("ai-feedback-info")
          .addClass("ai-feedback-info-" + defaultKey.replace(/-$/, ""))
          .text(count).attr("title", titles.join("; "))
      );
    }
  };

  /*!
   * Decorates a message DOM element with a spinner. It will add it both to the
   * message itself and to the 'meta'-element shown on hovering over the message.
   */
  autoflagging.addSpinnerToMessage = function ($message) {
    debug("add spinner to", $message);
    autoflagging.addSpinner($message);
    autoflagging.addSpinner($message.find(".meta"), true);
  };

  /*!
   * Decorates a DOM element with a spinner. Don't call this method directly,
   * use addSpinnerToMessage instead.
   */
  autoflagging.addSpinner = function ($element, inline) {
    $element.append("<span class=\"ai-information" + (inline ? " inline" : "") + "\">" +
      "<img class=\"ai-spinner\" src=\"//i.stack.imgur.com/icRVf.gif\" title=\"Loading autoflagging information ...\" />" +
      "</span>");
    if ($element.parent().children(":first-child").hasClass("timestamp") && $element.is(":nth-child(2)")) {
      // don’t overlap the timestamp
      $element.css({
        clear: "both"
      });
    }
  };

  /*!
   * Calls the API to get information about multiple posts at once, considering the paging system of the API.
   * It will use the results to decorate the Smokey reports which are already on the page.
   */
  autoflagging.callAPI = function (urls, page) {
    debug("Call API");
    if (page == null) {
      page = 1;
    }
    var autoflagData = {};
    var url = autoflagging.baseURL + "&page=" + page + "&urls=" + urls;
    debug("URL:", url);
    $.get(url, function (data) {
      // Group information by link
      for (var i = 0; i < data.items.length; i++) {
        autoflagData[data.items[i].link] = data.items[i];
      }

      // Loop over all Smokey reports and decorate them
      $(autoflagging.selector).each(function () {
        var $element = $(this);
        var postURL = autoflagging.getPostURL(this);
        var postData = autoflagData[postURL];
        if (typeof postData == "undefined") {
          return;
        }
        // Post deleted?
        if (postData.deleted_at != null) {
          $(this).find(".content").toggleClass("ai-deleted");
        }

        if (postData.autoflagged === true) {
          // Get flagging data
          url = autoflagging.apiURL + "/posts/" + postData.id + "/flags?key=" + autoflagging.key;
          debug("URL:", url);
          $.get(url, function (flaggingData) {
            autoflagging.decorateMessage($element, flaggingData.items[0]);
          }).fail(function (xhr) {
            autoflagging.notify("Failed to load data:", xhr);
          });
        } else {
          // No autoflags
          autoflagging.decorateMessage($element, {autoflagged: {flagged: false, users: []}});
        }

        // Get feedback
        url = autoflagging.apiURL + "/feedbacks/post/" + postData.id + "?filter=HOHLOMHNFMIFMGJJHNMIHLKLIFHIHNKFOMJJMLKOOHOL&key=" + autoflagging.key;
        debug("URL:", url);
        $.get(url, function (feedbackData) {
          autoflagging.decorateMessage($element, {feedbacks: feedbackData.items});
        }).fail(function (xhr) {
          autoflagging.notify("Failed to load data:", xhr);
        });

        // Get weight
        url = autoflagging.apiURL + "/posts/" + postData.id + "/reasons?key=" + autoflagging.key;
        debug("URL:", url);
        $.get(url, function (reasonsData) {
          var totalWeight = 0;
          for (var i = 0; i < reasonsData.items.length; i++) {
            totalWeight += reasonsData.items[i].weight;
          }
          autoflagging.decorateMessage($element, {reason_weight: totalWeight});
        }).fail(function (xhr) {
          autoflagging.notify("Failed to load data:", xhr);
        });
      });

      if (data.has_more) {
        // There are more items on the next 'page'
        autoflagging.callAPI(urls, ++page);
      }
    }).fail(function (xhr) {
      autoflagging.notify("Failed to load data:", xhr);
    });
  };

  /*!
   * Returns the post URL in a Smokey report message (if there is any).
   */
  autoflagging.getPostURL = function (selector) {
    var matches = autoflagging.messageRegex.exec($(selector).html());
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
            urls += ",";
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
              urls += ",";
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
  autoflagging.socket = new ReconnectingWebSocket("wss://metasmoke.erwaysoftware.com/cable");
  autoflagging.socket.onmessage = function (message) {
    function decorate(selector, data) {
      (function _deco() {
        debug.decorate("Attempting to decorate \"" + selector + "\" with", data, "message:", $(selector).parents(".message"));
        if ($(selector).parents(".message").find(".ai-spinner, .ai-information.ai-loaded").length > 0) {
          autoflagging.decorateMessage($(selector).parents(".message"), data);
        } else {
          // MS is faster than chat; add the decorate operation to the queue
          debug.queue("Queueing", selector);
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
        debug.ws("got message", jsonData.message);
        var flagLog = jsonData.message.flag_log;
        var deletionLog = jsonData.message.deletion_log;
        var feedback = jsonData.message.feedback;
        var notFlagged = jsonData.message.not_flagged;
        if (typeof flagLog != "undefined") {
          // Autoflagging information
          debug.ws(flagLog.user, "autoflagged", flagLog.post);
          let selector = autoflagging.selector + "a[href^='" + flagLog.post.link + "']";
          decorate(selector, flagLog.post);
        } else if (typeof deletionLog != "undefined") {
          // Deletion log
          debug.ws("deleted:", deletionLog);
          let selector = autoflagging.selector + "a[href^='" + deletionLog.post_link + "']";
          $(selector).parents(".content").addClass("ai-deleted");
        } else if (typeof feedback != "undefined") {
          // Feedback
          debug.ws(feedback.user, "posted", feedback.symbol, "on", feedback.post_link, feedback); // feedback_type
          let selector = autoflagging.selector + "a[href^='" + feedback.post_link + "']";
          decorate(selector, {
            feedbacks: [feedback]
          });
        } else if (typeof notFlagged != "undefined") {
          // Not flagged
          debug.ws(notFlagged.post, "not flagged");
          let selector = autoflagging.selector + "a[href^='" + notFlagged.post.link + "']";
          decorate(selector, notFlagged.post);
        }
        break;
      }
    }
  };

  autoflagging.socket.onopen = function () {
    debug.ws("WebSocket opened.");
    // Send authentication
    autoflagging.socket.send(JSON.stringify({
      identifier: JSON.stringify({
        channel: "ApiChannel",
        key: autoflagging.key
      }),
      command: "subscribe"
    }));
  };
  autoflagging.socket.onclose = function (close) {
    debug.ws("WebSocket closed:", close);
  };

  // Sometimes, autoflagging information arrives before the chat message.
  // The code below makes sure the queued decorations are executed.
  CHAT.addEventHandlerHook(function (e) {
    if (e.event_type === 1 && e.user_id === autoflagging.smokeyID) {
      var self = this;
      setTimeout(function () {
        var matches = autoflagging.messageRegex.exec($("#message-" + e.message_id + " .content").html());
        if (!matches) {
          return;
        }

        // Resolve queue
        var q = autoflagging.msgQueue;
        autoflagging.msgQueue = [];
        var args = arguments;
        q.forEach(function (f) {
          setTimeout(function () {
            debug.queue("Resolving queue:", f, args);
            f.apply(self, args);
          }, 100);
        });

        // Show spinner
        autoflagging.addSpinnerToMessage($("#message-" + e.message_id));
      }, 100);
    }
  });
})();
