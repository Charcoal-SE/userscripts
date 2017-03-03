// ==UserScript==
// @name        Flag Instantly, Rapidly, Effortlessly
// @namespace   https://github.com/Charcoal-SE/
// @description FIRE adds a button to SmokeDetector reports that allows you to provide feedback & flag, all from chat.
// @author      Cerbrus
// @attribution Michiel Dommerholt (https://github.com/Cerbrus)
// @version     0.0.1
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.stackexchange.com/rooms/11540/charcoal-hq
// @match       *://chat.stackoverflow.com/rooms/41570/so-close-vote-reviewers
// @match       *://chat.meta.stackexchange.com/rooms/89/tavern-on-the-meta
// @grant       none
// ==/UserScript==
/* global fire, CHAT */

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
      metasmokeKey: "55c3b1f85a2db5922700c36b49583ce1a047aabc4cf5f06ba5ba5eff217faca6", // this script's MetaSmoke API key
      metasmokeUrl: "https://metasmoke.erwaysoftware.com/api/",
      buttonKeyCodes: [],
      isOpen: false,
      smokeDetectorId: smokeDetectorId,
      SDMessageSelector: ".user-" + smokeDetectorId + " .message "
    };

    initLocalStorage({
      blur: true
    });

    injectCSS();
    registerAnchorHover();
    showFireOnExistingMessages();
    CHAT.addEventHandlerHook(chatListener);
  })(window);

  function getDataForUrl(reportedUrl, callback) {
    var url = fire.metasmokeUrl + "posts/urls?key=" + fire.metasmokeKey + "&page=1&urls=" + reportedUrl;
    $.get(url, function (data) {
      if (data && data.items) {
        callback(data.items[0]);
      }
    });
  }

  // getReportInfo(59354);
  // function getReportInfo(ids, page) {
  //   // var autoflagData = {};
  //   var url = fire.metasmokeUrl + "posts/" + ids + "?key=" + fire.metasmokeKey;// + "&page=" + page || 1;
  // }

  // Loads a report's data when you hover over the FIRE button.
  function loadDataForReport() {
    var $this = $(this);
    var url = $this.data("url");

    getDataForUrl(url, function (data) {
      data.is_answer = data.link.indexOf("/a/") >= 0; // eslint-disable-line camelcase
      data.site = data.link.split(".com")[0].replace(/\.stackexchange|\/+/g, "");
      $this.data("report", data);
    });
  }

  function getWriteToken(afterFlag, callback) {
    console.log("getWriteToken");
    window.open("https://metasmoke.erwaysoftware.com/oauth/request?key=" + fire.metasmokeKey, "_blank");

    writeTokenPopup(function (metaSmokeCode) {
      $.ajax({
        url: "https://metasmoke.erwaysoftware.com/oauth/token?key=" + fire.metasmokeKey + "&code=" + metaSmokeCode,
        method: "GET"
      }).done(function (data) {
        fire.msWriteToken = data.token;
        fire.setData("metasmokeWriteToken", data.token);
      }).error(function (jqXHR) {
        if (jqXHR.status === 404) {
          StackExchange.helpers.showErrorMessage($(".topbar"), "Metasmoke could not find a write token - did you authorize the app?", {
            position: "toast",
            transient: true,
            transientTimeout: 10000
          });
        } else {
          StackExchange.helpers.showErrorMessage($(".topbar"), "An unknown error occurred during OAuth with metasmoke.", {
            position: "toast",
            transient: true,
            transientTimeout: 10000
          });
          console.log(jqXHR.status, jqXHR.responseText);
        }
      });

      if (callback) {
        callback();
      }
    });
  }

  // Chat message event listener
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
        var fireButton = element("span", "fire-button", {
          text: fire.buttonText,
          click: openPopup
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

      var $button = $(".fire-popup-header a.button[fire-key=" + e.keyCode + "]");
      var button = $button[0];

      if (button) {
        if (e.keyCode === 27) { // [Esc] key
          $button.click();
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
      html: "Once you've authenticated FIRE with metasmoke, you'll be given a code.<br />Please enter it here:"
    });

    var input = element("input", "fire-popup-input", {type: "text"});
    var saveButton = element("a", "button", {
      text: "Save",
      click: function () {
        callback(input.val());
        closePopup();
      }
    });

    element("div", "fire-popup-modal")
      .appendTo("body")
      .click(closePopup);

    popup
      .append(top)
      .append(input)
      .append(saveButton)
      .hide()
      .appendTo("body")
      .fadeIn("fast");

    $("#container").toggleClass("fire-blur", fire.userData.blur);

    $(document).keydown(keyboardShortcuts);
  }

  // Build a popup and show it.
  function openPopup() {
    if (fire.isOpen) {
      return; // Don't open the popup twice.
    }

    var that = this;

    if (!fire.userData.metasmokeWriteToken) {
      getWriteToken(function () {
        openPopup.call(that); // Open the popup later
      });

      return;
    }

    fire.isOpen = true;

    var $this = $(that);
    var w = (window.innerWidth - $("#sidebar").width()) / 2;
    var d = $this.data("report");

    var popup = element("div", "fire-popup")
      .css({top: "5%", left: w - 300});

    var closeButton = element("a", "button fire-close-button", {
      text: "Close",
      click: closePopup,
      "fire-key": 27 // escape key code
    });
    fire.buttonKeyCodes.push(27);

    var top = element("p", "fire-popup-header")
      .append(createFeedbackButton(d, 49, "tpu-", "tpu-", "True positive"))
      .append(createFeedbackButton(d, 50, "tp-", "tp-", "Vandalism"))
      .append(createFeedbackButton(d, 51, "fp-", "fp-", "False Positive"))
      .append(createFeedbackButton(d, 52, "naa-", "naa-", "Not an Answer / VLQ"))
      .append(element("span", "fire-site-logo", {
        text: d.site,
        css: {"background-image": "url(//cdn.sstatic.net/Sites/" + d.site + "/img/apple-touch-icon.png)"}
      }))
      .append(closeButton);

    var body = element("div", "fire-popup-body")
      .append($("<h2 />", {text: "Question Title: "})
        .append($("<em />", {text: d.title}))
      )
      .append($("<hr />"))
      .append($("<h3 />", {text: (d.is_answer ? "Answer" : "Question") + ":"}))
      .append($("<br />"))
      .append($("<div />")
        .append(d.body)
      );

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
    // if (data.autoflagged && data.autoflagged.flagged) {
    //   // Only allow actual flagging if this has been flagged already.
    // }
    console.log(data, verdict);
    closePopup();
  }

  // Create a feedback button for the top of the popup
  function createFeedbackButton(data, keyCode, text, verdict, tooltip) { // eslint-disable-line max-params
    fire.buttonKeyCodes.push(keyCode);
    return element("a", "button fire-feedback-button", {
      text: text,
      click: function () {
        feedback(data, verdict);
      },
      "fire-key": keyCode,
      "fire-tooltip": tooltip
    });
  }

  // Wrapper to create a new element with a specified class.
  function element(tagName, cssClass, options) {
    options = options || {};
    options.class = cssClass;
    return $("<" + tagName + "/>", options);
  }

  // Expands anchor elements in the report's body on hover, to show the href.
  function expandLinksOnHover() {
    $(".fire-popup-body a")
      .each(function () {
        $(this).attr("fire-tooltip", this.href);
      });
  }

  // Register the "tooltip" hover for anchor elements
  function registerAnchorHover() {
    var anchorSelector = "a[fire-tooltip]";
    $("body")
      .on("mouseenter", anchorSelector, function () {
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

  // Detect Emoji support in this browser
  function hasEmojiSupport() {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var smiley = String.fromCodePoint(0x1F604); // :smile: String.fromCharCode(55357) + String.fromCharCode(56835)

    ctx.textBaseline = "top";
    ctx.font = "32px Arial";
    ctx.fillText(smiley, 0, 0);
    return ctx.getImageData(16, 16, 1, 1).data !== 0;
  }

  // Handle CSS injection
  function injectCSS() {
    var css = window.document.createElement("link");
    css.rel = "stylesheet";
    css.href = "//charcoal-se.org/userscripts/fire/fire.css"; // "cdn.rawgit.com/Charcoal-SE/userscripts/master/fire/fire.css"
    document.head.appendChild(css);
  }

  // Initializes localStorage
  function initLocalStorage(defaultStorage) {
    Object.defineProperty(fire, "userData", {
      get: function () {
        return JSON.parse(localStorage.getItem("fire-user-data"));
      },
      set: function (value) {
        localStorage.setItem("fire-user-data", JSON.stringify(value));
      }
    });

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
})();
