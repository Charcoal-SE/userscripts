// ==UserScript==
// @name        Autoflagging Information & More
// @namespace   https://github.com/Charcoal-SE/
// @description AIM adds autoflagging information and post deletion information to Charcoal HQ.
// @author      Glorfindel
// @author      J F
// @contributor angussidney
// @version     0.7
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging.user.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.stackexchange.com/rooms/11540/charcoal-hq
// @grant       none
// ==/UserScript==

(function () {
  'use strict';
  //console.log("Autoflagging Information started.");

  // Inject CSS
  var link = window.document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = 'data:text/css,' + [
    '.ai-information:not(.inline) {',
      'position: absolute',
      'right: 3px',
      'bottom: 0',
    '}',
    '.ai-information {',
      'font-size: 11px',
      '-webkit-user-select:none;-moz-user-select:none;-ms-user-select none;user-select:none',
      'cursor: default',
      'padding-left: 0.25em',
      'padding-right: 1px',
    '}',
    '.ai-spinner {',
      'height: 1.5em',
    '}',
    '.ai-information > * > * {',
      'margin: 0 0.25em',
    '}',
    '.ai-information > * > :last-child {',
      'margin-right: 0',
    '}',
    '.ai-deleted, .ai-flag-count.ai-not-autoflagged {',
      'transition: opacity 0.4s',
    '}',
    '.ai-deleted:not(:hover), .ai-flag-count.ai-not-autoflagged {',
      'opacity: 0.5',
    '}',
    '.ai-flag-count::after {',
      'content: " \\2691"',
    '}'
  ].join('; ').replace(/([\{\}]);/g, "$1");
  document.getElementsByTagName("head")[0].appendChild(link);

  // Constants
  window.autoflagging = {};
  autoflagging.smokeyID = "120914"; // this is Smokey's user ID
  autoflagging.key = "d897aa9f315174f081309cef13dfd7caa4ddfec1c2f8641204506636751392a4"; // this script's MetaSmoke API key
  autoflagging.baseURL = "https://metasmoke.erwaysoftware.com/api/posts/urls?key=" + autoflagging.key;
  autoflagging.prefix = "//m.erwaysoftware.com/posts/by-url?url=";
  autoflagging.selector = ".user-" + autoflagging.smokeyID + " .message a[href^='" + autoflagging.prefix + "']";
  // MS links can appear in other Smokey messages too (like feedback on an old post, or conflicted feedback).
  // Fortunately, those are direct links like https://metasmoke.erwaysoftware.com/post/56004 and won't be found by this selector.

  // Error handling
  autoflagging.notify = Notifier().notify;

  // TODO: Sometimes, Smokey reports don't contain an MS link (because of the chat message limit length).
  // We either need to find a work-around, e.g. by using the direct link in the chat message,
  // or wait until this feature request is implemented: https://github.com/Charcoal-SE/SmokeDetector/issues/488

  /*!
   * Decorates a jQuery DOM element with autoflagging information from the data.
   *
   * The parameter 'data' is supposed to have a boolean property 'flagged', and a property 'users' with user information.
   * `element` is a message (i.e. has the message class)
   */
  autoflagging.decorateMessage = function (message, data) {
    autoflagging.decorate(message.children(".ai-information"), data)
    autoflagging.decorate(message.find(".meta .ai-information"), data)
  }
  autoflagging.decorate = function (element, data) {
    element.find(".ai-spinner").remove();

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
    }).length == 1;

    var names = {
      before: "prepend",
      after: "append"
    }

    Object.keys(autoflagging.decorate).forEach(function (key) {
      var f = autoflagging.decorate[key]
      if (!element.find(".ai-" + key).length) {
        element[names[f.location]]($("<" + (f.el || "span") + "/>").addClass("ai-" + key))
      }
      autoflagging.decorate[key](element.find(".ai-" + key), data)
    })

  };
  /* “Spec” for methods of autoflagging.decorate:
   * Takes an element to update.
   * data is from the API.
   * Properties:
   * * location [required] ("before" | "after") Where to add the element if it
   *   doesn’t exist
   * * el [optional] the name of the element to create.
  **/

  autoflagging.decorate.autoflag = function ($autoflag, data) {
    if (!$autoflag.find(".ai-you-flagged").length) {
      $autoflag.prepend($("<strong/>").text("You autoflagged.").addClass("ai-you-flagged"));
    }
    if (!$autoflag.find(".ai-flag-count").length) {
      $autoflag.append($("<span/>").addClass("ai-flag-count"));
    }
    $autoflag.find(".ai-you-flagged").toggle(data.flagged && data.youFlagged);
    $autoflag.find(".ai-flag-count")
             .text(data.flagged ? "" + data.users.length : "")
             .toggleClass("ai-not-autoflagged", !data.flagged)
             .attr("title", data.flagged
               ? "Flagged by " + data.users.map(function (user) { return user.username }).join(", ")
               : "Not Autoflagged");
  };
  autoflagging.decorate.autoflag.location = "after"

  /*!
   * Decorates a jQuery DOM element with a spinner.
   */
  autoflagging.addSpinner = function (element, inline) {
    element.append("<span class=\"ai-information" + (inline ? " inline" : "") + "\">" +
      "<img class=\"ai-spinner\" src=\"//i.stack.imgur.com/icRVf.gif\" title=\"Loading autoflagging information ...\" />" +
      "</span>");
  };
  autoflagging.addSpinnerToMessage = function (element) {
    autoflagging.addSpinner(element)
    autoflagging.addSpinner(element.find(".meta"), true)
  }

  /*!
   * Calls the API to get information about multiple posts at once, considering the paging system of the API.
   * It will use the results to decorate the Smokey reports which are already on the page.
   */
  autoflagging.callAPI = function (urls, page) {
    //console.log("Call API");
    if (page == null) {
      page = 1;
    }
    var autoflagData = {};
    var url = autoflagging.baseURL + "&page=" + page + "&urls=" + urls;
    //console.log("URL: " + url);
    $.get(url, function(data) {
      // Group information by link
      for (var i = 0; i < data.items.length; i++) {
        autoflagData[data.items[i].link] = data.items[i];
      }

      // Loop over all Smokey reports and decorate them
      $(autoflagging.selector).each(function() {
        var postURL = $(this).attr('href').substring(autoflagging.prefix.length);
        // TODO: show flag weight - first, the API needs to be changed
        if (typeof autoflagData[postURL] == 'undefined')
          return;
        autoflagging.decorateMessage($(this).parents(".message"), autoflagData[postURL].autoflagged);
        // Post deleted?
        if (autoflagData[postURL].deleted_at != null) {
          $(this).parents('.content').toggleClass('ai-deleted');
        }
      });

      if (data.has_more) {
        // There are more items on the next 'page'
        autoflagging.callAPI(urls, ++page);
      }
    }).fail(function(error) {
      autoflagging.notify('Failed to load data: ' + error);
    });
  };

  // Wait for the chat messages to be loaded.
  var chat = $("#chat");
  chat.on("DOMSubtreeModified", function() {
    if (chat.html().length != 0) {
      // Chat messages loaded
      chat.off("DOMSubtreeModified");

      // Find all Smokey reports (they are characterized by having an MS link) and extract the post URLs from them
      var urls = "";
      $(autoflagging.selector).each(function() {
        if (urls != "") { urls += "%3B"; }
        urls += $(this).attr('href').substring(autoflagging.prefix.length);
        // Show spinner
        autoflagging.addSpinnerToMessage($(this).parents('.message'));
      });

      // MS API call
      autoflagging.callAPI(urls);
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
          return !$(this).parents('.message').find('.ai-information').length
        }).each(function() {
          if (urls != "") { urls += "%3B"; }
          urls += $(this).attr('href').substring(autoflagging.prefix.length);
          // Show spinner
          autoflagging.addSpinnerToMessage($(this).parents('.message'));
        });
        // MS API call
        autoflagging.callAPI(urls);
      }, 500);
    })
  })

  // Listen to MS events
  autoflagging.msgQueue = []
  autoflagging.socket = new WebSocket("wss://metasmoke.erwaysoftware.com/cable");
  autoflagging.socket.onmessage = function(message) {
    // Parse message
    var jsonData = JSON.parse(message.data);
    switch (jsonData.type) {
    case "confirm_subscription":
    case "ping":
    case "welcome":
      break;
    default:
      // Analyze socket message
      var flagLog = jsonData.message.flag_log;
      var deletionLog = jsonData.message.deletion_log;
      var feedback = jsonData.message.feedback;
      if (typeof flagLog != 'undefined') {
        // Autoflagging information
        //console.log(flagLog.user_name + ' autoflagged ' + flagLog.post_link);
        var selector = ".user-" + autoflagging.smokeyID + " .message a[href^='" + autoflagging.prefix + flagLog.post_link + "']";
        var data = {};
        data.flagged = true;
        data.names = [flagLog.user_name];
        data.users = [flagLog.user];
        // TODO: this is going to overwrite previous autoflags when we start flagging multiple times
        var decorate = function () {
          if ($(selector).length) {
            decorate();
          } else {
            // MS is faster than chat; add the decorate operation to the queue
            autoflagging.msgQueue.push(decorate);
          }
          autoflagging.decorateMessage($(selector).parent(), data);
        };
        decorate();
      } else if (typeof deletionLog != 'undefined') {
        // Deletion log
        //console.log(deletionLog.post_link + ' deleted');
        var selector = ".user-" + autoflagging.smokeyID + " .message a[href^='" + autoflagging.prefix + deletionLog.post_link + "']";
        $(selector).parents('.content').toggleClass('ai-deleted');
      } else if (typeof feedback != 'undefined') {
        // Feedback
        //console.log(feedback.user_name + ' posted ' + feedback.symbol + ' on ' + feedback.post_link); // feedback_type
        // TODO: show realtime feedback
      }
      break;
    }
  };
  autoflagging.socket.onopen = function() {
    // Send authentication
    autoflagging.socket.send('{"identifier": "{\\"channel\\":\\"ApiChannel\\",\\"key\\":\\"' + autoflagging.key + '\\"}", "command": "subscribe"}');
  };

  // Sometimes, autoflagging information arrives before the chat message.
  // The code below makes sure the queued decorations are executed.
  CHAT.addEventHandlerHook(function (e) {
    if (e.event_type == 1 && e.user_id == autoflagging.smokeyID) {
      var self = this;
      var q = autoflagging.msgQueue;
      autoflagging.msgQueue = [];
      q.forEach(function (f) {
        setTimeout(function () {
          f.apply(self, arguments);
        })
      })
    }
  })

  // TODO: the code below is obsolete thanks to the MS websocket. However, the spinner can
  // still be displayed for new chat messages. Also, we need a realtime update for posts
  // which *aren't* autoflagged.
  /*
  // Subscribe to chat events
  CHAT.addEventHandlerHook(function(e, n, s) {
    if (e.event_type == 1 && e.user_id == autoflagging.smokeyID) {
      //console.log("Smokey message " + e.message_id);
      // New message posted by Smokey - note that the corresponding <div> element isn't created yet.
      // Therefore, we wait a little while.
      setTimeout(function() {
        // Find MS link - if it doesn't exist, we don't need to do anything
        var anchors = $("#message-" + e.message_id).find("a[href^='" + autoflagging.prefix + "']");
        if (anchors.length == 0)
          return;

        // Show spinner
        var anchor = $(anchors[0]);
        autoflagging.addSpinnerToMessage(anchor.parent());
        // Wait a couple of seconds for autoflagging to complete
        setTimeout(function() {
          // MS API call
          var url = autoflagging.baseURL + "&urls=" + anchor.attr('href').substring(autoflagging.prefix.length);
          //console.log("URL: " + url);
          $.get(url, function(data) {
            // Decorate report
            autoflagging.decorateMessage(anchor.parent(), data.items[0].autoflagged);
          }).fail(function(error) {
            autoflagging.notify('Failed to load data: ' + error);
          });
        }, 5000);
      }, 500);
    }
  });
  */
})();
