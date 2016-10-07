// ==UserScript==
// @name         Dark themed metasmoke
// @description  Enables the dark theme in production mode on metasmoke
// @author       ArtOfCode
// @version      0.1.0
// @match        *://metasmoke.erwaysoftware.com/*
// @grant        none
// ==/UserScript==

var userscript = function($) {
  $("nav").addClass("navbar-inverse");
};

var el = document.createElement("script");
el.type = "application/javascript";
el.text = "(" + userscript + ")(jQuery);";
document.body.appendChild(el);
