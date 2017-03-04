// ==UserScript==
// @name        Flag Instantly, Rapidly, Effortlessly
// @namespace   https://github.com/Charcoal-SE/
// @description FIRE adds a button to SmokeDetector reports that allows you to provide feedback & flag, all from chat.
// @author      Cerbrus
// @attribution Michiel Dommerholt (https://github.com/Cerbrus)
// @version     0.2.0
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.stackexchange.com/rooms/11540/charcoal-hq
// @match       *://chat.stackoverflow.com/rooms/41570/so-close-vote-reviewers
// @match       *://chat.meta.stackexchange.com/rooms/89/tavern-on-the-meta
// @grant       none
// ==/UserScript==
/* global fire, toastr, CHAT */
/* eslint-disable camelcase */

(function () {
  "use strict";

  (function (scope) { // Init
    var useEmoji = hasEmojiSupport();
    var smokeDetectorId = { // this is Smokey's user ID for each supported domain
      "chat.stackexchange.com": 120914,
      "chat.stackoverflow.com": 3735529,
      "chat.meta.stackexchange.com": 266345,
    }[location.host];       // From which, we need the current host's ID

    scope.fire = {
      buttonText: useEmoji ? "🔥" : "Fire",
      buttonClass: useEmoji ? "fire-button" : "fire-button fire-plain",
      api: {
        ms: {
          key: "55c3b1f85a2db5922700c36b49583ce1a047aabc4cf5f06ba5ba5eff217faca6", // this script's MetaSmoke API key
          url: "https://metasmoke.erwaysoftware.com/api/"
        },
        se: {
          key: "NDllMffmzoX8A6RPHEPVXQ((", // this script's Stack Exchange API key
          url: "https://api.stackexchange.com/2.2/"
        }
      },
      buttonKeyCodes: [],
      isOpen: false,
      smokeDetectorId: smokeDetectorId,
      SDMessageSelector: ".user-" + smokeDetectorId + " .message "
    };

    initLocalStorage({
      blur: true
    });

    getCurrentUser();
    loadStackExchangeSites();
    injectExternalScripts();
    showFireOnExistingMessages();
    registerAnchorHover();
    registerOpenLastReportKey();
    CHAT.addEventHandlerHook(chatListener);
  })(window);

  // Loads MetaSmoke data for a specified post url
  function getDataForUrl(reportedUrl, callback) {
    var ms = fire.api.ms;
    var url = ms.url + "posts/urls?key=" + ms.key + "&page=1&urls=" + reportedUrl;
    $.get(url, function (data) {
      if (data && data.items) {
        callback(data.items[0]);
      }
    });
  }

  // Loads a report's data when you hover over the FIRE button.
  function loadDataForReport(openAfterLoad) {
    var $this = $(this);
    var url = $this.data("url");

    getDataForUrl(url, function (data) {
      data.is_answer = data.link.indexOf("/a/") >= 0;
      data.site = data.link.split(".com")[0].replace(/\.stackexchange|\/+/g, "");
      data.disable_feedback = data.feedbacks.some(function (f) { // Feedback has been sent already
        return f.user_name === fire.chatUser.name;
      });

      $this.data("report", data);

      if (openAfterLoad === true) {
        $this.click();
      }
    });
  }

  // Loads a list of all Stack Exchange Sites.
  function loadStackExchangeSites() {
    var now = new Date().valueOf();
    var sites = fire.sites;

    // If there are no sites or the site data is a day old
    if (!sites || sites.storedAt < (now - 604800000)) { // 604800000 ms is 7 days (7 * 24 * 60 * 60 * 1000)
      sites = {};                                       // Clear the site data
    }

    if (!sites.storedAt) { // If the site data is empy
      var se = fire.api.se;
      var url = se.url + "sites?key=" + se.key + "&filter=!Fn4IB7S7Yq2UJF5Bh48LrjSpTc&pagesize=10000";

      $.get(url, function (response) {
        for (var i = 0; i < response.items.length; i++) {
          var item = response.items[i];
          sites[item.api_site_parameter] = item;
        }

        sites.storedAt = now; // Set the storage timestamp
        fire.sites = sites;   // Store the site list
      });
    }
  }

  // Gets a MetaSmoke write token
  function getWriteToken(callback) {
    var afterGetToken = callback;
    writeTokenPopup(function (metaSmokeCode) {
      $.ajax({
        url: "https://metasmoke.erwaysoftware.com/oauth/token?key=" + fire.api.ms.key + "&code=" + metaSmokeCode,
        method: "GET"
      }).done(function (data) {
        fire.setData("metasmokeWriteToken", data.token);
        toastr.success("Successfully obtained MetaSmoke write token!");

        if (afterGetToken) {
          afterGetToken();
        }
      }).error(function (jqXHR) {
        if (jqXHR.status === 404) {
          toastr.error("Metasmoke could not find a write token - did you authorize the app?");
        } else {
          toastr.error("An unknown error occurred during OAuth with metasmoke.");
        }
      });
    });
  }

  // Chat message event listener. If SmokeDetector reports another post, decorate the message
  function chatListener(e) {
    if (e.event_type === 1 && e.user_id === fire.smokeDetectorId) {
      setTimeout(function () {
        var message = $("#message-" + e.message_id);
        decorateMessage(message);
      });
    }
  }

  // Adds the "FIRE" button to the passed message
  function decorateMessage(message) {
    var m = $(message);
    if (m.find(".fire-button").length === 0) {
      var reportLink = m.find(".content a[href^='//m.erwaysoftware']");
      if (reportLink.length > 0) { // This is a report
        var reportedUrl = reportLink.attr("href").split("url=").pop();
        var fireButton = element("span", fire.buttonClass, {
          text: fire.buttonText,
          click: openReportPopup
        })
        .data("url", reportedUrl);

        reportLink
          .after(fireButton)
          .after(" | ");
      }
    }
  }

  // Decorate messages that exist on page load
  function decorateExistingMessages(timeout) {
    setTimeout(function () {
      var chat = $("#chat");
      chat.on("DOMSubtreeModified", function () {
        if (chat.html().length !== 0) {
          // Chat messages loaded
          chat.off("DOMSubtreeModified");

          $(fire.SDMessageSelector).each(function () {
            decorateMessage(this);
          });
        }
      });
    }, timeout);
  }

  // Adds the "FIRE" button to all existing messages and registers an event listener to do so after "load older messages" is clicked
  function showFireOnExistingMessages() {
    $("#getmore, #getmore-mine")
      .click(function () {
        decorateExistingMessages(500);
      });

    decorateExistingMessages(0);

    // Load report data on fire button hover
    $("body").on("mouseenter", ".fire-button", loadDataForReport);
  }

  // Handle keypress events for the popup
  function keyboardShortcuts(e) {
    if (e.keyCode === 66) {     // [B] key: Toggle blur
      e.preventDefault();
      var data = fire.userData;
      data.blur = !data.blur;
      $("#container").toggleClass("fire-blur", data.blur);
      fire.userData = data;
    } else if (e.keyCode === 13 || e.keyCode === 32) { // [Enter] key or spacebar
      e.preventDefault();
      $(".fire-popup-header a.button.focus")
        .fadeOut(100)           // Flash to indicate which button was selected.
        .fadeIn(100, function () {
          $(this).click();
        });
    } else if (fire.buttonKeyCodes.indexOf(e.keyCode) >= 0) {
      e.preventDefault();

      $(".fire-popup-header a.button")
        .removeClass("focus")
        .trigger("mouseleave");

      var $button = $(".fire-popup-header a[fire-key=" + e.keyCode + "]");
      var button = $button[0];

      if (button) {
        if (e.keyCode === 27) { // [Esc] key
          $button.click();
        } else if (e.keyCode === 53) { // [5]: Open the report on the site
          window.open(button.href);
        } else {                // [1-4] keys for feedback buttons
          var pos = button.getBoundingClientRect();
          $button
            .addClass("focus")
            .trigger("mouseenter")
            .trigger($.Event("mousemove", { // eslint-disable-line new-cap
              clientX: pos.right - (button.offsetWidth + 20),
              clientY: pos.top + 20
            }));
        }
      }
    }
  }

  // Open a popup to enter the write token
  function writeTokenPopup(callback) {
    var w = (window.innerWidth - $("#sidebar").width()) / 2;

    var popup = element("div", "fire-popup")
      .css({top: "5%", left: w - 300});

    var top = element("p", "fire-popup-header", {
      html: "FIRE requires a metasmoke write token to submit feedback.<br />" +
        "Once you've authenticated FIRE with metasmoke, you'll be given a code.<br />" +
        "Please enter it here:"
    });

    var input = element("input", "fire-popup-input", {
      type: "text",
      maxlength: "7",
      placeholder: "Enter code here"
    });

    var requestButton = element("a", "button", {
      text: "Request Token",
      click: function () {
        window.open("https://metasmoke.erwaysoftware.com/oauth/request?key=" + fire.api.ms.key, "_blank");
      }
    });

    var saveButton = element("a", "button", {
      text: "Save",
      click: function () {
        var value = input.val();
        if (value && value.length === 7) {
          closePopup();
          callback(value);
        }
      }
    });

    element("div", "fire-popup-modal")
      .appendTo("body")
      .click(closePopup);

    popup
      .append(top)
      .append(requestButton)
      .append(input)
      .append(saveButton)
      .hide()
      .appendTo("body")
      .fadeIn("fast");

    $("#container").toggleClass("fire-blur", fire.userData.blur);

    $(document).keydown(keyboardShortcuts);
  }

  // Build a popup and show it.
  function openReportPopup() {
    if (fire.isOpen) {
      return; // Don't open the popup twice.
    }

    var that = this;

    if (!fire.userData.metasmokeWriteToken) {
      getWriteToken(function () {
        openReportPopup.call(that); // Open the popup later
      });
      return;
    }

    fire.isOpen = true;

    var $that = $(that);
    var w = (window.innerWidth - $("#sidebar").width()) / 2;
    var d = $that.data("report");
    var site = fire.sites[d.site];

    var popup = element("div", "fire-popup")
      .css({top: "5%", left: w - 300});

    var openOnSiteButton = element("a", "fire-site-logo", {
      text: site ? site.name : d.site,
      href: d.link,
      target: "_blank",
      css: {"background-image": "url(//cdn.sstatic.net/Sites/" + d.site + "/img/apple-touch-icon.png)"},
      "fire-key": 53,
      "fire-tooltip": "Show on site"
    });

    var closeButton = element("a", "button fire-close-button", {
      text: "Close",
      click: closePopup,
      "fire-key": 27 // escape key code
    });

    var top = element("p", "fire-popup-header")
      .append(createFeedbackButton(d, 49, "tpu-", "tpu-", "True positive"))
      .append(createFeedbackButton(d, 50, "tp-", "tp-", "Vandalism"))
      .append(createFeedbackButton(d, 51, "naa-", "naa-", "Not an Answer / VLQ"))
      .append(createFeedbackButton(d, 52, "fp-", "fp-", "False Positive"))
      .append(openOnSiteButton)
      .append(closeButton);

    var body = element("div", "fire-popup-body")
      .append($("<h2 />", {text: "Question Title: "})
        .append($("<em />", {text: d.title}))
      )
      .append($("<hr />"))
      .append($("<h3 />", {text: (d.is_answer ? "Answer" : "Question") + ":"}))
      .append($("<br />"))
      .append($("<div />")
        .append(d.body.replace(/<script/g, "&lt;script"))
      );

    body.find("pre code").each(function () {
      this.innerHTML = this.innerHTML
        .replace(/>/g, "&gt;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
    });

    element("div", "fire-popup-modal")
      .appendTo("body")
      .click(closePopup);

    popup
      .append(top)
      .append(body)
      .hide()
      .appendTo("body")
      .fadeIn("fast");

    $("#container").toggleClass("fire-blur", fire.userData.blur);

    expandLinksOnHover();

    $(document).keydown(keyboardShortcuts);
    $(document).on("click", ".fire-popup-body pre", function () {
      $(this).toggleClass("fire-expanded");
    });
  }

  // Close the popup
  function closePopup() {
    $(".fire-popup, .fire-popup-modal")
      .fadeOut("fast", function () {
        $(this).remove();
      });

    $(document).off("keydown", keyboardShortcuts);

    $("#container").removeClass("fire-blur");

    fire.isOpen = false;
  }

  // Provide feedback / flag
  function feedback(data, verdict) {
    var ms = fire.api.ms;
    var token = fire.userData.metasmokeWriteToken;

    postMetaSmokeFeedback(data, verdict, ms, token);
    postMetaSmokeSpamFlag(data, verdict, ms, token);
    closePopup();
  }

  // Flag the post as spam
  function postMetaSmokeSpamFlag(data, verdict, ms, token) {
    if (verdict === "tpu-") { // && !hasAlreadyFlagged
      $.ajax({
        type: "POST",
        url: ms.url + "w/post/" + data.id + "/spam_flag",
        data: {key: ms.key, token: token}
      }).done(function (response) {
        toastr.success("Successfully flagged post as spam.");

        if (response.backoff) { // We've got a backoff. deal with it.
          toastr.info("Backoff received");
          console.info(data, response);
        }
      }).error(function (jqXHR) {
        toastr.error("Something went wrong while attempting to submit a spam flag");
        console.error(data, jqXHR);
        // will give you a 409 response with error_name, error_code and error_message parameters if the user isn't write-authenticated;
        // will give you a 500 with status: 'failed' and a message if the spam flag fails;
      });
    }
  }

  // Submit MS feedback
  function postMetaSmokeFeedback(data, verdict, ms, token) {
    $.ajax({
      type: "POST",
      url: ms.url + "w/post/" + data.id + "/feedback",
      data: {type: verdict, key: ms.key, token: token}
    }).done(function () {
      toastr.success("Fed back \"<em>" + verdict + "\"</em> to metasmoke.");
    }).error(function (jqXHR) {
      if (jqXHR.status === 401) {
        toastr.error("Can't send feedback to metasmoke - not authenticated.");
      } else {
        toastr.error("An error occurred sending post feedback to metasmoke.");
        console.error("An error occurred sending post feedback to metasmoke.", jqXHR);
      }
    });
  }

  // Create a feedback button for the top of the popup
  function createFeedbackButton(data, keyCode, text, verdict, tooltip) { // eslint-disable-line max-params
    var count;
    var hasSubmittedFeedback;

    if (data.feedbacks) { // Has feedback
      count = data.feedbacks.filter(function (f) {
        return f.feedback_type === verdict;
      }).length;
      hasSubmittedFeedback = data.feedbacks.some(function (f) {
        return f.feedback_type === verdict &&
          f.user_name === fire.chatUser.name;
      });
    }

    var suffix = count ? " (" + count + ")" : "";
    var cssClass = hasSubmittedFeedback ? " fire-submitted" : "";

    return element("a", "button fire-feedback-button fire-" + verdict + cssClass, {
      text: text + suffix,
      click: function () {
        if (!data.disable_feedback) {
          feedback(data, verdict);
        }
      },
      disabled: data.disable_feedback,
      "fire-key": keyCode,
      "fire-tooltip": tooltip
    });
  }

  // Wrapper to create a new element with a specified class.
  function element(tagName, cssClass, options) {
    options = options || {};
    options.class = cssClass;

    if (options["fire-key"]) {
      fire.buttonKeyCodes.push(options["fire-key"]);
    }

    return $("<" + tagName + "/>", options);
  }

  // Detect Emoji support in this browser
  function hasEmojiSupport() {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var smiley = String.fromCodePoint(0x1F604); // :smile: String.fromCharCode(55357) + String.fromCharCode(56835)

    ctx.textBaseline = "top";
    ctx.font = "32px Arial";
    ctx.fillText(smiley, 0, 0);
    return ctx.getImageData(16, 16, 1, 1).data[0] !== 0;
  }

  // Inject FIRE stylesheet and Toastr library
  function injectExternalScripts() {
    injectCSS("//charcoal-se.org/userscripts/fire/fire.css");

    if (typeof toastr === "undefined") {
      // toastr is a Javascript library for non-blocking notifications.
      var path = "//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/";
      injectCSS(path + "toastr.min.css");
      $.getScript(path + "/toastr.min.js").then(toastrOptions);
    }
  }

  // Inject the specified stylesheet
  function injectCSS(path) {
    var css = window.document.createElement("link");
    css.rel = "stylesheet";
    css.href = path;
    document.head.appendChild(css);
  }

  // Set toastr options
  function toastrOptions() {
    toastr.options = {
      closeButton: true,
      progressBar: true,
      positionClass: "toast-top-right",
      preventDuplicates: true,
      extendedTimeOut: "500",
    };
  }

  // Register the "tooltip" hover for anchor elements
  function registerAnchorHover() {
    var anchorSelector = "a[fire-tooltip]";
    $("body")
      .on("mouseenter", anchorSelector, function () {
        $(".fire-tooltip").remove();
        var that = $(this);
        that.after(element("span", "fire-tooltip", {
          text: that.attr("fire-tooltip")
        }));
      }).on("mousemove", anchorSelector, function (e) {
        $(".fire-tooltip").css({
          left: e.clientX + 20,
          top: e.clientY + 5
        });
      })
      .on("mouseleave", anchorSelector, function () {
        $(".fire-tooltip").remove();
      });
  }

  // Expands anchor elements in the report's body on hover, to show the href.
  function expandLinksOnHover() {
    $(".fire-popup-body a")
      .each(function () {
        $(this).attr("fire-tooltip", this.href);
      });
  }

  // Open the last report on [Ctrl]+[Space]
  function registerOpenLastReportKey() {
    $(document).on("keydown", function (e) {
      if (e.keyCode === 32 && e.ctrlKey) {
        var button = $(".fire-button").last();
        if (button && button.length > 0) {
          loadDataForReport.call(button, true);
        }
      }
    });
  }

  // Adds a property on `fire` that's stored in `localStorage`
  function registerForLocalStorage(key, localStorageKey) {
    Object.defineProperty(fire, key, {
      get: function () {
        return JSON.parse(localStorage.getItem(localStorageKey));
      },
      set: function (value) {
        localStorage.setItem(localStorageKey, JSON.stringify(value));
      }
    });
  }

  // Initializes localStorage
  function initLocalStorage(defaultStorage) {
    registerForLocalStorage("userData", "fire-user-data");
    registerForLocalStorage("sites", "fire-sites");

    fire.setData = function (key, value) {
      var data = fire.userData;
      data[key] = value;
      fire.userData = data;
    };
    fire.clearData = function (key) {
      var data = fire.userData;
      delete data[key];
      fire.userData = data;
    };

    if (fire.userData === null) {
      fire.userData = defaultStorage;
    }
  }

  // Gets the currently logged-in user.
  function getCurrentUser() {
    setTimeout(function () { // This code was too fast for FireFox
      CHAT.RoomUsers
        .get(CHAT.CURRENT_USER_ID)
        .done(function (user) {
          fire.chatUser = user;
        });
    });
  }
})();
