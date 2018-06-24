(function(scope) {
  "use strict";
  scope.emojiSupportChecker = true;

  try {
    // Detect Emoji support in this browser
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const smiley = String.fromCodePoint(0x1f604); // :smile: String.fromCharCode(55357) + String.fromCharCode(56835)

    ctx.textBaseline = "top";
    ctx.font = "32px Arial";
    ctx.fillText(smiley, 0, 0);
    scope.hasEmojiSupport = ctx.getImageData(16, 16, 1, 1).data[0] !== 0;
  } catch (err) {
    scope.hasEmojiSupport = false;
  }

  if (!scope.hasEmojiSupport) {
    const css = window.document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://charcoal-se.org/userscripts/emoji/emojifont.css";
    document.head.appendChild(css);

    $("html").toggleClass("no-emoji", true);
  }

  // Returns the emoji if it's supported. Otherwise, return a fallback image.
  // usage: `emojiOrImage("🔥", "emoji-class-name", true)`
  // Returns a jQuery-wrapped text node or a jQuery-wrapped image.
  scope.emojiOrImage = function(emoji, cssClass, large) {
    if (scope.hasEmojiSupport) {
      return $(document.createTextNode(emoji));
    }

    const url =
      "https://raw.githubusercontent.com/Ranks/emojione/master/assets/png/";
    const hex = emoji.codePointAt(0).toString(16);

    const emojiImage = $("<img/>", {
      class: cssClass + (large ? "-large" : ""),
      src: url + hex + ".png",
      alt: emoji,
    });

    return emojiImage;
  };
})(window);
