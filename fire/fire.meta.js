// ==UserScript==
// @name        🔥 FIRE: Feedback Instantly, Rapidly, Effortlessly
// @namespace   https://github.com/Charcoal-SE/
// @description FIRE adds a button to SmokeDetector reports that allows you to provide feedback & flag, all from chat.
// @author      Cerbrus
// @contributor Makyen
// @attribution Michiel Dommerholt (https://github.com/Cerbrus)
// @version     1.4.1
// @icon        https://raw.githubusercontent.com/Ranks/emojione-assets/master/png/32/1f525.png
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.meta.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.stackexchange.com/transcript/*
// @match       *://chat.meta.stackexchange.com/transcript/*
// @match       *://chat.stackoverflow.com/transcript/*
// @match       *://chat.stackexchange.com/users/120914/*
// @match       *://chat.stackexchange.com/users/120914?*
// @match       *://chat.stackoverflow.com/users/3735529/*
// @match       *://chat.stackoverflow.com/users/3735529?*
// @match       *://chat.meta.stackexchange.com/users/266345/*
// @match       *://chat.meta.stackexchange.com/users/266345?*
// @match       *://chat.stackexchange.com/users/478536/*
// @match       *://chat.stackexchange.com/users/478536?*
// @match       *://chat.stackoverflow.com/users/14262788/*
// @match       *://chat.stackoverflow.com/users/14262788?*
// @match       *://chat.meta.stackexchange.com/users/848503/*
// @match       *://chat.meta.stackexchange.com/users/848503?*
// @include     /^https?://chat\.stackexchange\.com/(?:rooms/|search.*[?&]room=)(?:11|27|95|201|388|468|511|2165|3877|8089|11540|22462|24938|34620|35068|38932|46061|47869|56223|58631|59281|61165|65945|84778|96491|106445|109836|109841|129590)(?:[&/].*$|$)/
// @include     /^https?://chat\.meta\.stackexchange\.com/(?:rooms/|search.*[?&]room=)(?:89|1037|1181)(?:[&/].*$|$)/
// @include     /^https?://chat\.stackoverflow\.com/(?:rooms/|search.*[?&]room=)(?:41570|90230|111347|126195|167826|170175|202954)(?:[&/].*$|$)/
// @require     https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js
// @require     https://cdn.jsdelivr.net/gh/joewalnes/reconnecting-websocket@5c66a7b0e436815c25b79c5579c6be16a6fd76d2/reconnecting-websocket.js
// @grant       none
