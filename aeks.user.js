// ==UserScript==
// @name        Automatically Enable Keyboard Shortcuts
// @namespace   https://github.com/Charcoal-SE/
// @description Automatically enable keyboard shortcuts for any SE site you're on. This may require a reload for the setting to take effect.
// @author      Cerbrus
// @attribution Michiel Dommerholt (https://github.com/Cerbrus)
// @version     1.1
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/aeks.user.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/aeks.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://*.stackexchange.com/*
// @match       *://*.stackoverflow.com/*
// @match       *://*.superuser.com/*
// @match       *://*.serverfault.com/*
// @match       *://*.askubuntu.com/*
// @match       *://*.stackapps.com/*
// @match       *://*.mathoverflow.net/*
// @exclude     *://chat.stackexchange.com/*
// @exclude     *://chat.meta.stackexchange.com/*
// @exclude     *://chat.stackoverflow.com/*
// @exclude     *://blog.stackoverflow.com/*
// @exclude     *://*.area51.stackexchange.com/*
// @grant       none
// ==/UserScript==

(function () {
  "use strict";

  var userscript = function ($) {
    function log(message) {
      if (console && console.log) {
        console.log(message);
      }
    }

    var userLink = $(".my-profile, .profile-me").attr("href");

    // AEKS has already ran on this site, or the user doesn't have an account here.
    if (!userLink || localStorage.aeksFinished) {
      log("AEKS cancelled: User has no account or AEKS already finished on this site.");
      return;
    }

    var params = [
      {name: "fkey", value: localStorage["se:fkey"].split(",")[0]},
      {name: "key", value: "85"},     // 85 is the id for the keyboard shortcuts setting.
      {name: "value", value: "true"}, // Enable that setting
      {name: "forUserId", value: userLink.match(/\d+/)[0]}
    ];

    $.post(
      "/users/save-preference",
      params,
      function () {
        localStorage.aeksFinished = true;
        log("AEKS finished on this site.");
      }
    );
  };

  var aeksScript = document.createElement("script");
  aeksScript.type = "application/javascript";
  aeksScript.text = "(" + userscript + ")(jQuery);";
  document.body.appendChild(aeksScript);
})();
