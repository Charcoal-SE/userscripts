(function (scope) {
  "use strict";
  scope.emojiSupportChecker = true;

  try {
    // Detect Emoji support in this browser
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var smiley = String.fromCodePoint(0x1F604); // :smile: String.fromCharCode(55357) + String.fromCharCode(56835)

    ctx.textBaseline = "top";
    ctx.font = "32px Arial";
    ctx.fillText(smiley, 0, 0);
    scope.hasEmojiSupport = ctx.getImageData(16, 16, 1, 1).data[0] !== 0;
  } catch (err) {
    scope.hasEmojiSupport = false;
  }

  if (!scope.hasEmojiSupport) {
    var css = window.document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://charcoal-se.org/userscripts/emoji/emojifont.css";
    document.head.appendChild(css);

    $("html").toggleClass("no-emoji", true);
  }
})(window);
