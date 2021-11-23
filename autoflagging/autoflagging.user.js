// ==UserScript==
// @name        Autoflagging Information & More
// @namespace   https://github.com/Charcoal-SE/
// @description AIM adds display of autoflagging, deletion, and feedback information to SmokeDetector report messages in chat rooms.
// @author      Glorfindel
// @author      J F
// @contributor angussidney
// @contributor ArtOfCode
// @contributor Cerbrus
// @contributor Makyen
// @version     0.28
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging/autoflagging.meta.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging/autoflagging.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @include     /^https?://chat\.stackexchange\.com/(?:rooms/)(?:11|27|95|201|388|468|511|2165|3877|8089|11540|22462|24938|34620|35068|38932|46061|47869|56223|58631|59281|61165|65945|84778|96491|106445|109836|109841|129590)(?:[&/].*$|$)/
// @include     /^https?://chat\.meta\.stackexchange\.com/(?:rooms/)(?:89|1037|1181)(?:[&/].*$|$)/
// @include     /^https?://chat\.stackoverflow\.com/(?:rooms/)(?:41570|90230|111347|126195|167826|170175|202954)(?:[&/].*$|$)/
// @require     https://cdn.jsdelivr.net/gh/joewalnes/reconnecting-websocket@5c66a7b0e436815c25b79c5579c6be16a6fd76d2/reconnecting-websocket.js
// @require     https://cdn.jsdelivr.net/gh/Charcoal-SE/userscripts/vendor/debug.min.js
// @require     https://cdn.jsdelivr.net/gh/Charcoal-SE/userscripts/emoji/emoji.js
// @grant       none
// ==/UserScript==

/* global autoflagging, ReconnectingWebSocket, unsafeWindow, CHAT, $, Notifier, jQuery */ // eslint-disable-line no-redeclare

// To enable/disable trace information, type autoflagging.trace(true) or
// autoflagging.trace(false), respectively, in your browser's console.

(function () {
  "use strict";

  const MINUTE_IN_MILLISECONDS = 60 * 1000;
  const HOUR_IN_MILLISECONDS = 60 * MINUTE_IN_MILLISECONDS;
  const HOURS_2_IN_MILLISECONDS = 2 * HOUR_IN_MILLISECONDS;
  const MAX_AGE_QUEUED_SOCKET_MESSAGE_DECORATE = HOURS_2_IN_MILLISECONDS;
  const SOCKET_MESSAGE_DECORATE_QUEUE_EXPIRE_INTERVAL = 10 * MINUTE_IN_MILLISECONDS;

  const isConversation = /^\/rooms\/\d+\/conversation\/.+$/.test(window.location.pathname);
  const isChat = !isConversation && /^\/rooms\/\d+\/[^/]*$/.test(window.location.pathname);

  function doWhenRoomReadyIfMainChat(toCall) {
    // This should probably change to looking at window.location.
    if (!isChat) {
      return;
    }
    if (typeof CHAT === "object" && CHAT && CHAT.Hub && CHAT.Hub.roomReady && typeof CHAT.Hub.roomReady.add === "function") {
      if (CHAT.Hub.roomReady.fired()) {
        // The room is ready now.
        toCall();
      } else {
        CHAT.Hub.roomReady.add(toCall);
      }
    }
  }

  const createDebug = typeof unsafeWindow === "undefined" ? window.debug : unsafeWindow.debug || window.debug;
  const debug = createDebug("aim");
  debug.decorate = createDebug("aim:decorate");
  debug.ws = createDebug("aim:ws");
  debug.queue = createDebug("aim:queue");
  debug("started");

  // Inject CSS
  $(document.head).append(`<style type="text/css" id="AIM-autoflagging-main-css">
.ai-information:not(.inline) {
  position: absolute;
  right: 4px;
  bottom: 0;
  /* This 'inherit' makes sure the autoflagging information
  is readable *over* the chat message itself, but uses the default background
  of the chatroom messages. There used to be a background: inherit for
  .messages, but it did not appear to have a beneficial effect and it caused
  the theme in dark-transparent rooms (The Restaurant at the End of the Universe)
  to be messed up.*/
  background: inherit;
}
.reply-parent .ai-information:not(.inline) {
  background: silver;
}
.ai-information {
  font-size: 11px;
  -webkit-user-select:none;-moz-user-select:none;-ms-user-select none;user-select:none;
  cursor: default;
  padding-left: 0.25em;
  padding-right: 1px;
}
.ai-spinner {
  height: 1.5em;
}
.ai-information > * > *, .ai-feedback-info {
  margin: 0 0.25em;
}
.ai-information > :last-child > :last-child {
  margin-right: 0;
}
.ai-deleted, .ai-flag-count.ai-not-autoflagged {
  transition: opacity 0.4s;
}
.ai-deleted:not(:hover), .ai-flag-count.ai-not-autoflagged {
  opacity: 0.5;
}
.ai-deleted {
    max-height: 1.5em;
    overflow: hidden;
    transition: all 0.5s ease;
}
.ai-deleted:hover {
    max-height: 3em;
}
.ai-flag-count {
  color: inherit;
  text-decoration: none !important;
}
.ai-flag-count::after {
  content: " ⚑";
}
.ai-flag-count.ai-not-autoflagged::after {
  content: "⚑";
}

.ai-feedback-info-tpu {
  color: #3c763d;
}
.ai-feedback-info-fp {
  color: #a94442;
}
.ai-feedback-info-naa {
  color: #825325;
}
.ai-feedback-info-ignore {
  color: #ff4442;
}

.ai-feedback-info-tpu::after {
  content: " ✓";
}
.ai-feedback-info-fp::after {
  content: " ✗";
}
.ai-feedback-info-naa::after {
  content: " \\1F4A9";
}
.ai-feedback-info-ignore::after {
  content: " \\1f6AB";
}

.no-emoji .ai-feedback-info-naa::after {
  content: " " url(https://charcoal-se.org/userscripts/emoji/naa.png)
}

@media
(-webkit-min-device-pixel-ratio: 2),
(min-resolution: 192dpi) {
  .no-emoji .ai-feedback-info-naa::after {
    content: " " url(https://charcoal-se.org/userscripts/emoji/naa-2x.png)
  }
}

.mob #chat .monologue .message {
  /* fix messages collapsing to the bottom of the monlogue */
  position: relative;
}

    </style>
  `);

  let doWhenReady = $(document).ready;
  if (typeof CHAT === "object" && CHAT && CHAT.Hub && CHAT.Hub.roomReady && typeof CHAT.Hub.roomReady.add === "function" && !CHAT.Hub.roomReady.fired()) {
    doWhenReady = CHAT.Hub.roomReady.add;
  }
  doWhenReady(() => {
    function getEffectiveBackgroundColor(element, defaultColor) {
      element = element instanceof jQuery ? element : $(element);
      defaultColor = defaultColor ? defaultColor : "rgb(255,255,255)";
      let testEl = element.first();
      const colors = [];
      do {
        try {
          const current = testEl.css("background-color").replace(/\s+/g, "").toLowerCase();
          if (current && current !== "transparent" && current !== "rgba(0,0,0,0)") {
            colors.push(current);
          }
          if (current.indexOf("rgb(") === 0) {
            // There's a color without transparency.
            break;
          }
        } catch (err) {
          // This should always get pushed if we make it up to the document element.
          colors.push(defaultColor);
        }
        testEl = testEl.parent();
      } while (testEl.length);
      return "rgb(" + colors.reduceRight((sum, color) => {
        color = color.replace(/rgba?\((.*)\)/, "$1").split(/,/g);
        if (color.length < 4) {
          // rgb, not rgba
          return color;
        }
        if (color.length !== 4 || sum.length !== 3) {
          throw new Error("Something went wrong getting the effective color");
        }
        for (let index = 0; index < 3; index++) {
          const start = Number(sum[index]);
          const end = Number(color[index]);
          const distance = Number(color[3]);
          sum[index] = start + ((end - start) * distance);
        }
        return sum;
      }, []).join(", ") + ")";
    }
    const backgroundColor = getEffectiveBackgroundColor($(".monologue:not(.mine) .messages"));
    const rgbAverage = backgroundColor.replace(/rgba?\((.*)\)/, "$1").split(/,/g).reduce((sum, value) => (Number(value) + sum), 0) / 3;
    // Add the CSS to adjust the colors used when there's a dark background.
    $(document.head).append(`
      <style type="text/css" id="AIM-autoflagging-dark-mode">
        .monologue:not(.mine) .message:not(.reply-parent):not(.reply-child):not(.highlight) .ai-information {
          background-color: ${backgroundColor};
        }
        ${(rgbAverage > 128 ? "" : `
        .ai-feedback-info-tpu {
          color: #82f883;
        }
        .ai-feedback-info-fp {
          color: #ff4442;
        }
        .ai-feedback-info-naa {
          color: #ba8b6d;
        }
        .ai-feedback-info-ignore {
          color: #ff4442;
        }
        `)}
      </style>
    `);
  });

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
  autoflagging.baseURL = autoflagging.apiURL + "/posts/urls?filter=HFHNHJFMGNKNFFFIGGOJLNNOFGNMILLJ&key=" + autoflagging.key;
  autoflagging.selector = ".user-" + autoflagging.smokeyID + " .message ";
  // autoflagging.messageRegex is used both to detect the HTML of SD messages which are to be decorated and parse the SE URL out of the SD report.
  // https://regex101.com/r/tnUyUI/1
  // Group 1: URL for SE post (This is the only group that is currently used.)
  // Group 2: SE post title
  // Group 3: SE user's user ID
  // Group 4: SE username
  // Group 5: SE site
  autoflagging.messageRegex = /\[ <a[^>]+>SmokeDetector<\/a>(?: \| <a[^>]+>MS<\/a>)?.*?<a href="([^"]+)">(.+?)<\/a>.* by (?:<a href="[^"]+\/u(?:sers)?\/(\d+)(?:\/[^"]*)?">(.+?)<\/a>|a deleted user) on <code>([^<]+)/;
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

    // Temporarily disabled following https://chat.stackexchange.com/transcript/message/44456641#44456641
    // autoflagging.getAllReasons($message, data);
  };

  /*!
   * Extend a report message's reasons when the message was cropped.
   */
  /* Temporarily disabled following https://chat.stackexchange.com/transcript/message/44456641#44456641
  autoflagging.getAllReasons = function ($message, data) {
    if (autoflagging.hasMoreRegex.test($message.html())) {
      $.get(
        "https://metasmoke.erwaysoftware.com/api/v2.0/post/" + data.id + "/reasons?per_page=30",
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
          autoflagging.notify("AIM: Failed to load MS reason data (1):", xhr);
          debug("Failed to load reasons:", xhr);
        });
    }
  };
  */

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
      .attr("title", data.flagged ? "Flagged by " + data.users.map(function (user) {
        return user.username || user.user_name;
      }).join(", ") : "Not Autoflagged");
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
    // Don't show multiple feedbacks by the same user. New feedbacks override old feedbacks.
    //   Unfortunately, MS only sends the user_name with WebScocket feedbacks, which makes
    //   this incorrect if there is an actual duplicate username.
    //   In addition, it is possible, under some conditions, for MS to have more than one
    //   feedback from the same user, which this will hide.
    const currentUsername = data.user_name;
    Object.keys(allFeedbacks).forEach(function (feedbackType) {
      if (Array.isArray(allFeedbacks[feedbackType])) {
        allFeedbacks[feedbackType] = allFeedbacks[feedbackType].filter(function (testFeedback) {
          return testFeedback.user_name !== currentUsername;
        });
        if (allFeedbacks[feedbackType].length === 0) {
          delete allFeedbacks[feedbackType];
        }
      }
    });
    allFeedbacks[data.feedback_type] = (allFeedbacks[data.feedback_type] || []).concat(data);
    $feedback.data("feedbacks", allFeedbacks);

    var simpleFeedbacks = {
      k: {},
      f: {},
      n: {},
      i: {}
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
        } else if (type.indexOf("ignore") !== -1) {
          simpleFeedbacks.i[type] = users;
        }
      }
    }

    // Update feedback DOM element
    $feedback.empty();
    autoflagging.decorate.feedback.addFeedback(simpleFeedbacks.k, $feedback, "tpu-");
    autoflagging.decorate.feedback.addFeedback(simpleFeedbacks.f, $feedback, "fp-");
    autoflagging.decorate.feedback.addFeedback(simpleFeedbacks.n, $feedback, "naa-");
    autoflagging.decorate.feedback.addFeedback(simpleFeedbacks.i, $feedback, "ignore-");
  };

  /*!
   * Adds feedback of one type (tpu-, naa-, fp-, ignore-) to a feedback DOM element.
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
   * If there are more than 100 URLs requested, then the list of URLs is broken into chunks of 100 max and
   * the API is called on each chunk.
   * It will use the results to decorate the Smokey reports which are already on the page.
   */
  autoflagging.callAPI = function (urls) {
    debug("Call API");
    if (!Array.isArray(urls)) {
      return;
    }
    // chunkArray is from SOCVR's Archiver; copied by Makyen
    function chunkArray(array, chunkSize) {
      // Chop a single array into an array of arrays. Each new array contains chunkSize number of
      //   elements, except the last one.
      var chunkedArray = [];
      var startIndex = 0;
      while (array.length > startIndex) {
        chunkedArray.push(array.slice(startIndex, startIndex + chunkSize));
        startIndex += chunkSize;
      }
      return chunkedArray;
    }
    // Split the array into chunks that are a max of 100 URLs each and call the API.
    // There isn't a specified number that is a maximum for the API, but there appear to be
    //   problems when requesting a large number of URLs.
    const chunkedArray = chunkArray(urls, 100);
    chunkedArray.forEach(chunk => autoflagging.callAPIChunk(chunk.join(",")));
  };

  /*!
   * Calls the API to get information about multiple posts at once, considering the paging system of the API.
   * It will use the results to decorate the Smokey reports which are already on the page.
   */
  autoflagging.callAPIChunk = function (urls, page = 1) {
    debug("Call APIChunk");
    if (!urls) {
      return;
    }
    var autoflagData = {};
    // After changes to MS, requesting max 100 URLs appears to be working well.
    var url = autoflagging.baseURL + "&page=" + page + "&per_page=100&urls=" + urls;
    debug("URL:", url);
    $.get(url, function (data) {
      // Group information by link
      for (var i = 0; i < data.items.length; i++) {
        const link = data.items[i].link;
        if (autoflagData[link] && autoflagData[link].id > data.items[i].id) {
          // If there's more than one MS post for this URL, then we want to use the
          //   most recent one. This is a stopgap rather than re-writing this to
          //   use the MS post info which is closest in time to the SD report.
          // Normally, the most recent MS post is listed first.
          continue;
        }
        autoflagData[link] = data.items[i];
      }

      // Loop over all Smokey reports and decorate them
      $(autoflagging.selector).each(function () {
        var $element = $(this);
        var postURL = autoflagging.getPostURL(this);
        var postData = autoflagData[postURL];
        if (typeof postData === "undefined") {
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
            autoflagging.notify("AIM: Failed to load MS flag data:", xhr);
          });
        } else {
          // No autoflags
          autoflagging.decorateMessage($element, {autoflagged: {flagged: false, users: []}});
        }

        // Get feedback
        url = autoflagging.apiURL + "/feedbacks/post/" + postData.id + "?filter=HNKJJKGNHOHLNOKINNGOOIHJNLHLOJOHIOFFLJIJJHLNNF&key=" + autoflagging.key + "&per_page=20";
        debug("URL:", url);
        $.get(url, function (feedbackData) {
          autoflagging.decorateMessage($element, {feedbacks: feedbackData.items});
        }).fail(function (xhr) {
          autoflagging.notify("AIM: Failed to load MS feedback data:", xhr);
        });

        // Get weight
        url = autoflagging.apiURL + "/posts/" + postData.id + "/reasons?key=" + autoflagging.key + "&per_page=30";
        debug("URL:", url);
        $.get(url, function (reasonsData) {
          var totalWeight = 0;
          for (var i = 0; i < reasonsData.items.length; i++) {
            totalWeight += reasonsData.items[i].weight;
          }
          autoflagging.decorateMessage($element, {reason_weight: totalWeight});
        }).fail(function (xhr) {
          autoflagging.notify("AIM: Failed to load MS reason data:", xhr);
        });
      });

      if (data.has_more) {
        // There are more items on the next 'page'
        autoflagging.callAPIChunk(urls, ++page);
      }
    }).fail(function (xhr) {
      autoflagging.notify("AIM: Failed to load MS post data:", xhr);
    });
  };

  /*!
   * Returns the post URL in a Smokey report message (if there is any).
   */
  autoflagging.getPostURL = function (selector) {
    var matches = autoflagging.messageRegex.exec($(selector).html());
    return matches && matches[1];
  };

  // Wait for the chat messages to be loaded.
  var chat = $("#chat");

  /*!
   * Handle the chat room being ready when on a main chat page.
   */
  autoflagging.handleChatRoomReady = function () {
    if (chat.html().length !== 0) {
      // Chat messages loaded
      autoflagging.markupAllReportsInChat();
    }
  };

  /*!
   * Add AIM markup to all messages in the DOM.
   */
  autoflagging.markupAllReportsInChat = function () {
    // Find all Smokey reports (they are characterized by having an MS link) and extract the post URLs from them
    var urls = [];
    $(autoflagging.selector).filter(function () {
      const eachSelected = $(this);
      // Clean out any empty AI infos
      eachSelected.find(".ai-information").each(function () {
        const eachAiInfo = $(this);
        if (eachAiInfo.children().length === 0) {
          // There's no content in the AI info. Something went wrong elsewhere, so we just remove it.
          eachAiInfo.remove();
        }
      });
      // Clean out AI Info from any messages without exactly 2 AI Infos: Something is wrong, and we should redo adding AI Info.
      const aiInfo = eachSelected.find(".ai-information");
      if (aiInfo.length !== 2) {
        aiInfo.remove();
        return true;
      } // else
      return false;
    }).each(function () {
      const url = autoflagging.getPostURL(this);
      if (typeof url === "string" && url) {
        autoflagging.addSpinnerToMessage($(this));
        urls.push(url);
      }
    });

    // MS API call
    autoflagging.callAPI(urls);

    $(".message:has(.ai-information)").addClass("ai-message");
  };

  if (chat.length > 0) {
    doWhenRoomReadyIfMainChat(autoflagging.handleChatRoomReady);
  }

  // Add autoflagging information to older messages as they are loaded
  $(document).ajaxComplete(function (event, jqXHR, ajaxSettings) {
    // By the time this gets called, the messages are in the DOM.
    if (/chats\/\d+\/events/i.test(ajaxSettings.url)) {
      // The URL for fetching more messages is:
      //  /chats/11540/events?before=[previous oldest message]&mode=Messages&msgCount=100
      autoflagging.markupAllReportsInChat();
    }
  });

  // Listen to MS events
  autoflagging.msgQueue = [];
  autoflagging.decorateOrQueueBySelector = function (selector, data, receivedTime) {
    // If we get a jQuery 'this' value, then we are checking only a single message (i.e. no need to do a DOM walk).
    // This is optimized such that in subsequent runs through the queue we are only looking for links in the content
    //   part of new messages. Thus, while 'selector' can be anything the first time through, it will only be tested
    //   against links in the new message.
    //   We even pre-filter those links, such that we only look at links that match
    //     .filter('a:not([href^="//git.io/"]):not([href^="//m.erwaysoftware.com/"]):not([href*="/users/"])');
    //   That's sufficient for what we currently are looking for, but it's intensionally limited, such that
    //   we do only a small amount of work for each queue entry.
    receivedTime = receivedTime || Date.now();
    debug.decorate("Attempting to decorate \"" + selector + "\" with", data, "message:", $(selector).parents(".message"));
    let messages;
    if (this && this.length > 0) {
      messages = this.filter(selector).parents(".message");
    } else {
      // Full search of the DOM. This is only done on the first check of this.
      messages = $(selector).parents(".message");
    }
    const messagesWithAIInfo = messages.filter(function () {
      return $(this).find(".ai-spinner, .ai-information.ai-loaded").length > 0;
    });
    if (messagesWithAIInfo.length > 0) {
      // There's at least one message with AI info or a spinner.
      messagesWithAIInfo.each(function () {
        const thisMessage = $(this);
        autoflagging.decorateMessage(thisMessage, data);
      });
    } else if (isChat && Date.now() < (receivedTime + MAX_AGE_QUEUED_SOCKET_MESSAGE_DECORATE)) {
      // We only have a queue for received MS WebSocket data in main chat pages and only keep things in the queue for 2 hours, which
      //   is about double the longest delay we've seen SD have. Note: we've significantly improved things since then, so even that's
      //   unlikely.
      //   If we didn't expire things, then we'd just continuously build up a deeper and deeper queue.
      // MS is faster than chat; add the decorate operation to the queue
      debug.queue("Queueing", selector);
      // This could result in data from an earlier run overwriting later data, if later run is also in the queue
      //   and the apprporiate SD message appears between this run and that next run.
      autoflagging.msgQueue.push([selector, data, receivedTime]);
    }
  };
  autoflagging.expireMSGQueue = function () {
    const now = Date.now();
    autoflagging.msgQueue = autoflagging.msgQueue.filter(([selector, data, receivedTime]) => now < (receivedTime + MAX_AGE_QUEUED_SOCKET_MESSAGE_DECORATE)); // eslint-disable-line no-unused-vars
  };

  autoflagging.setupMSWebSocket = function () {
    if (autoflagging.socket) {
      // Don't set up the WebSocket more tha once.
      return;
    }
    // Expire old queue entries every 10 minutes.
    setInterval(autoflagging.expireMSGQueue, SOCKET_MESSAGE_DECORATE_QUEUE_EXPIRE_INTERVAL);

    autoflagging.socket = new ReconnectingWebSocket("wss://metasmoke.erwaysoftware.com/cable");
    autoflagging.socket.onmessage = function (message) {
      // Parse message
      var jsonData = JSON.parse(message.data);
      switch (jsonData.type) {
        case "confirm_subscription":
        case "ping":
        case "welcome":
        case "statistic":
          break;
        default: {
          // Analyze socket message
          debug.ws("got message", jsonData.message);
          var flagLog = jsonData.message.flag_log;
          var deletionLog = jsonData.message.deletion_log;
          var feedback = jsonData.message.feedback;
          var notFlagged = jsonData.message.not_flagged;
          if (typeof flagLog !== "undefined") {
            // Autoflagging information
            debug.ws(flagLog.user, "autoflagged", flagLog.post);
            let selector = autoflagging.selector + "a[href^='" + flagLog.post.link + "']";
            autoflagging.decorateOrQueueBySelector(selector, flagLog.post);
          } else if (typeof deletionLog !== "undefined") {
            // Deletion log
            debug.ws("deleted:", deletionLog);
            let selector = autoflagging.selector + "a[href^='" + deletionLog.post_link + "']";
            $(selector).parents(".content").addClass("ai-deleted");
          } else if (typeof feedback !== "undefined") {
            // Feedback
            debug.ws(feedback.user, "posted", feedback.symbol, "on", feedback.post_link, feedback); // feedback_type
            let selector = autoflagging.selector + "a[href^='" + feedback.post_link + "']";
            autoflagging.decorateOrQueueBySelector(selector, {
              feedbacks: [feedback]
            });
          } else if (typeof notFlagged !== "undefined") {
            // Not flagged
            debug.ws(notFlagged.post, "not flagged");
            let selector = autoflagging.selector + "a[href^='" + notFlagged.post.link + "']";
            autoflagging.decorateOrQueueBySelector(selector, notFlagged.post);
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
  };

  autoflagging.setupMSWebSocket();

  autoflagging.processSocketMessageDecorateQueue = function (newMessageSelector) {
    // Attempt to apply each decorate from a WebSocket message.
    // If we are passed a newMessageSelector, then we are only checking a single message for all queue entries.
    let singleMessageContentLinks = null;
    if (typeof newMessageSelector === "string") {
      singleMessageContentLinks = $(newMessageSelector).find(".content a").filter("a:not([href^='//git.io/']):not([href^='//m.erwaysoftware.com/']):not([href*='/users/'])");
    }
    const queueWhenMessagePosted = autoflagging.msgQueue;
    autoflagging.msgQueue = [];
    // The entire existing queue needs to be handled in one context in order to maintain consistent order.
    setTimeout(function () {
      const currentQueue = autoflagging.msgQueue;
      autoflagging.msgQueue = [];
      queueWhenMessagePosted.forEach(function (queueEntry) {
        debug.queue("Resolving queue:", queueEntry);
        autoflagging.decorateOrQueueBySelector.apply(singleMessageContentLinks, queueEntry);
      });
      // Make sure anything that's been put back on the queue is prior to anything that's been put on the queue later.
      //   This assumes that any changes to the queue are made synchronously.
      autoflagging.msgQueue = autoflagging.msgQueue.concat(currentQueue);
    }, 100);
  };

  function aimChatListener(chatEvent) {
    if (chatEvent.event_type === 1 && chatEvent.user_id === autoflagging.smokeyID) {
      if (!autoflagging.messageRegex.test(chatEvent.content)) {
        return;
      }
      // Do this after the message has been added to the DOM.
      setTimeout(() => {
        // Show spinner
        const newMessageSelector = `#message-${chatEvent.message_id}`;
        autoflagging.addSpinnerToMessage($(newMessageSelector));
        // Sometimes, autoflagging information arrives before the chat message.
        // The code below makes sure the queued decorations are executed.
        autoflagging.processSocketMessageDecorateQueue(newMessageSelector);
      }, 25);
    }
  }

  if (typeof CHAT === "object" && CHAT && typeof CHAT.addEventHandlerHook === "function") {
    CHAT.addEventHandlerHook(aimChatListener);
  }
})();
