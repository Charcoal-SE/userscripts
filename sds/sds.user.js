// ==UserScript==
// @name        SmokeDetector Status
// @namespace   https://github.com/Charcoal-SE/
// @description Show the status of all SmokeDetector instances
// @author      J F
// @version     0.0.4
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/sds/sds.meta.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/sds/sds.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.stackexchange.com/rooms/11540/charcoal-hq*
// @match       *://chat.stackoverflow.com/rooms/41570/so-close-vote-reviewers*
// @match       *://chat.meta.stackexchange.com/rooms/89/tavern-on-the-meta*
// @match       *://chat.stackexchange.com/rooms/56223/the-spam-blot*
// @require     https://charcoal-se.org/userscripts/vendor/actioncable.js
// @require     https://charcoal-se.org/userscripts/vendor/debug.js
// @grant       none
// ==/UserScript==
/* global unsafeWindow */

(function () {
  const createDebug = typeof unsafeWindow === "undefined" ? window.debug : unsafeWindow.debug || window.debug;
  const debug = createDebug("sds");
  debug.ping = createDebug("sds:ping");
  // Inject CSS
  const css = window.document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://charcoal-se.org/userscripts/sds/sds.css";
  document.head.appendChild(css);

  const apiKey = "05f3eb1fb4edd821e32299f5b2e65f78bc53ed4fa0415b034d0e84b4e273329e";

  $.get("https://metasmoke.erwaysoftware.com/api/smoke_detectors?key=" + apiKey, data => {
    data.items.forEach(smokey => {
      addData(smokey, getDot(smokey));
    });
  });

  const ActionCable = window.actioncable;
  const cable = ActionCable.createConsumer("wss://metasmoke.erwaysoftware.com/cable");
  const $pings = $("<span />").addClass("pings-container");
  $("#roomname,#rooms-dropdown").after($pings);
  cable.subscriptions.create("PingsChannel", {
    received({smokey}) {
      debug.ping(smokey);
      const $dot = getDot(smokey);
      const $ping = $dot.find(".ping");
      $ping.removeClass("ping-pulse");
      requestAnimationFrame(() => $ping.addClass("ping-pulse"));
      addData(smokey, $dot);
      updatePing($dot);
    }
  });
  setInterval(() => {
    $(".pings-container .smokey").each(function () {
      updatePing($(this));
    });
  }, 1000);

  function getDot(smokey) {
    let $dot = $pings.children(".smokey-" + smokey.id);
    if ($dot.length === 0) {
      $dot = $("<span />").addClass("smokey smokey-" + smokey.id);
      $dot.append($("<span />").addClass("ping"));
      $dot.appendTo($pings);
    }
    return $dot;
  }
  function addData(smokey, $dot) {
    $dot.attr("data-location", smokey.location);
    $dot.attr("data-last-ping", smokey.last_ping);
    $dot.toggleClass("smokey-standby", smokey.is_standby);
  }

  const colorClasses = "green/yellow/red/dead".split("/").map(color => `smokey-${color}`);
  function updatePing($dot) {
    let diff = Number(new Date()) - new Date($dot.attr("data-last-ping"));
    diff /= 1000;
    const color = (function () {
      switch (true) {
        case diff < 90:
          return "smokey-green";
        case diff < 180:
          return "smokey-yellow";
        case diff < 60 * 60:
          return "smokey-red";
        default:
          return "smokey-dead";
      }
    })();
    const toRemove = colorClasses.slice();
    toRemove.splice(colorClasses.indexOf(color), 1);
    $dot.removeClass(toRemove.join(" "));
    $dot.addClass(color);
    $dot.attr("data-tooltip", $dot.attr("data-location") + " • " + prettyDate($dot.attr("data-last-ping"), true));
  }

  function prettyDate(date, formatShortDates) {
    // https://dev.stackoverflow.com/content/js/realtime-se.js
    if (typeof date == "string") {
      // if (date == null || date.length !== 20) {
      //   return;
      // }
      // // firefox requires ISO 8601 formated dates
      // date = date.substr(0, 10) + "T" + date.substr(11, 10);
      date = new Date(date);
    }

    const diff = (((new Date()).getTime() - date.getTime()) / 1000);
    const dayDiff = Math.floor(diff / 86400);

    if (isNaN(dayDiff) || dayDiff < 0 || dayDiff >= 31) {
      return;
    }

    switch (true) {
      case diff < 1: // used to be 2
        return "just now";
      case diff < 90:// used to be 60
        return (formatShortDates ?
          n => n.seconds + "s ago" :
          n => n.seconds === 1 ? n.seconds + " sec ago" : n.seconds + " secs ago"
        )({
          seconds: Math.floor(diff)
        });
      // case diff < 120:
      //   return formatShortDates ? "1m ago" : "1 min ago"
      case diff < 3600:
        return (formatShortDates ?
          n => n.minutes + "m ago" :
          n => n.minutes === 1 ? n.minutes + " min ago" : n.minutes + " mins ago"
        )({
          minutes: Math.floor(diff / 60)
        });
      // case diff < 7200:
      //   return formatShortDates ? "1h ago" : "1 hour ago"
      case diff < 86400:
        return (formatShortDates ?
          n => n.hours + "h ago" :
          n => n.hours === 1 ? n.hours + " hour ago" : n.hours + " hours ago"
        )({
          hours: Math.floor(diff / 3600)
        });
      default:
        return "> 1 day ago";
    }
  }
})();
