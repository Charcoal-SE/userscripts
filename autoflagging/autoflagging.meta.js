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
// @version     0.29
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
