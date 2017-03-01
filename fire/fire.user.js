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
/* global autoflagging */

(function () {
  "use strict";

  var wip = true;
  var branch = "master";

  if (wip) {
    // This userscript is still work in progress. It's probably broken, useless or otherwise dangerous.
    branch = "FIRE";
  }

  if (!autoflagging) {
    console.error("FIRE dependency missing: The AIM userscript isn't loaded.");
    console.warn("AIM GitHub url: https://github.com/Charcoal-SE/userscripts/blob/master/autoflagging.user.js");
    console.warn("AIM Download url: https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging.user.js");
    return;
  }

  // Inject CSS
  var css = window.document.createElement("link");
  css.rel = "stylesheet";
  css.href = "//raw.githubusercontent.com/Charcoal-SE/userscripts/" + branch + "/fire/fire.css";
  document.head.appendChild(css);

  function closePopup() {
    $(".ai-fire-popup").fadeOut("fast", function () {
      $(this).remove();
    });
  }

  function closePopupOnEsc(e) {
    if (e.keyCode === 27) { // escape key
      closePopup();
      $(document).off("keyup", closePopupOnEsc);
    }
  }

  function openPopup(data) {
    var w = window.innerWidth / 2;
    var h = window.innerHeight / 2;
    var d = data;

    var popup = $("<div />", {class: "ai-fire-popup"})
      .css({top: window.pageYOffset + h - 400, left: w - 600});

    var tpuButton = $("<a />", {
      class: "button",
      text: "tpu-",
      click: function () {
        feedback(d, "tpu-");
      }
    });
    var fpButton = $("<a />", {
      class: "button",
      text: "fp",
      click: function () {
        feedback(d, "fp");
      }
    });
    var closeButton = $("<a />", {
      class: "button ai-fire-close-button",
      text: "Close",
      click: closePopup
    })
    .css(css["ai-fire-popup-header a.button"]);

    var top = $("<p/>", {class: "ai-fire-popup-header"})
      .append(tpuButton)
      .append(fpButton)
      .append(closeButton);

    var body = $("<div/>", {class: "ai-fire-popup-body"})
      .append($("<h3 />", {text: d.title}))
      .append($("<hr />"))
      .append(d.body);

    popup
      .append(top)
      .append(body)
      .hide()
      .appendTo("body")
      .fadeIn("fast");

    $(document).keyup(closePopupOnEsc);
  }

  function feedback(data, verdict) {
    // if (data.autoflagged && data.autoflagged.flagged) {
    //   // Only allow actual flagging if this has been flagged already.
    // }
    console.log(data, verdict);
    closePopup();
  }

  autoflagging.decorate.fire = function ($fire, data) {
    if ($fire.find(".ai-fire-button").length === 0) {
      var fireButton = $("<span/>", {
        class: "ai-fire-button",
        css: css["ai-fire-button"],
        text: "🛠️",
        click: function () {
          openPopup(data);
        }
      });

      $fire.prepend(fireButton);
    }
  };
  autoflagging.decorate.fire.location = "after";
})();
