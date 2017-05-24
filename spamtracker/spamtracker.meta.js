// ==UserScript==
// @name         Spamtracker
// @version      1.0
// @description  Rewrite of the spamtracker project, this userscript will notify you using sound and a notification if a new spam post has been posted in any smoke detector supported rooms
// @author       Ferrybig
// @match        *://chat.meta.stackexchange.com/*
// @match        *://chat.stackexchange.com/*
// @match        *://chat.stackoverflow.com/*
// @run-at       document-end
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/spamtracker/spamtracker.meta.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/spamtracker/spamtracker.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @require      https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js#sha512=1ac1502c5a6774e6e7d3c77dd90d863f745371cd936d8a1620ab1c4a21173ffccfd327e435395df6658779ea87baad3b5ff84bf195110c7bc3187112ee820917
// @resource     DataTablesCSS https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css#sha256=f99d6b61adf2b3939d64d51c9391bb941bdbf00d773ab630bdff9df0f7c46874
// @resource     DataTablesSortAsc https://cdn.datatables.net/1.10.13/images/sort_asc.png#sha256=595704c3f3cf4cb65c7d9c8508a99e7480e150095473faed31a07c21b13389b8
// @resource     DataTablesSortDesc https://cdn.datatables.net/1.10.13/images/sort_desc.png#sha256=d08ed0e21f187dd309030d465224da8085119a15a17d616ba0e477bb50c6f10d
// @resource     DataTablesSortBoth https://cdn.datatables.net/1.10.13/images/sort_both.png#sha256=3e016c23ae51417382b640ae2d19eb48047532c37ad53894bd185586559ccffb
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @require      https://wzrd.in/standalone/debug@%5E2.6.6
// ==/UserScript==
