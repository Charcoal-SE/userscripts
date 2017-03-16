// ==UserScript==
// @name         Dark themed metasmoke
// @description  Enables the dark theme in production mode on metasmoke
// @author       ArtOfCode
// @version      0.1.0
// @match        *://metasmoke.erwaysoftware.com/*
// @match        *://metasmoke.charcoal-se.org/*
// @grant        none
// ==/UserScript==

/* globals csslib */

window.csslib = {
  createSheet: function () {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    return style.sheet;
  },

  addRule: function (sheet, selector, index, rules) {
    var ruleString = "";
    var ruleKeys = Object.keys(rules);
    for (var i = 0; i < ruleKeys.length; i++) {
      ruleString += ruleKeys[i] + ":" + rules[ruleKeys[i]] + " !important;";
    }

    if ("insertRule" in sheet) {
      sheet.insertRule(selector + "{" + ruleString + "}", index);
    } else if ("addRule" in sheet) {
      sheet.addRule(selector, ruleString, index);
    }
  }
};

var userscript = function ($) {
  $("nav").addClass("navbar-inverse");

  var sheet = csslib.createSheet();

  csslib.addRule(sheet, "body", 0, {
    color: "#ccc",
    background: "#333"
  });

  csslib.addRule(sheet, ".col-md-10 a:not(.btn), .col-md-10 a:not(.btn):visited", 0, {
    color: "#63a0d4"
  });
  csslib.addRule(sheet, ".col-md-10 a:not(.btn):hover, .col-md-10 a:not(.btn):active", 0, {
    color: "#337ab7"
  });

  csslib.addRule(sheet, ".table-striped > tbody > tr:nth-of-type(2n+1)", 0, {
    background: "#393939"
  });

  csslib.addRule(sheet, ".footer", 0, {
    background: "#383838"
  });

  csslib.addRule(sheet, "ul.dropdown-menu", 0, {
    background: "#333"
  });

  csslib.addRule(sheet, ".dropdown-menu > li > a", 0, {
    color: "#ccc",
    background: "#333"
  });
  csslib.addRule(sheet, ".dropdown-menu > li > a:hover", 0, {
    color: "#ccc",
    background: "#1a1a1a"
  });

  csslib.addRule(sheet, "pre", 0, {
    background: "#3c3c3c",
    color: "#ccc"
  });

  csslib.addRule(sheet, ".report-reasons", 0, {
    background: "#293300"
  });
};

var el = document.createElement("script");
el.type = "application/javascript";
el.text = "(" + userscript + ")(jQuery);";
document.body.appendChild(el);
