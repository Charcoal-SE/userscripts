// ==UserScript==
// @name          Unofficial Stack Exchange gas mask
// @namespace     https://github.com/Charcoal-SE/
// @author        Jan Dvorak
// @description   A mission-critical tool when exploring the deepest depths of Stack Exchange.
// @description   Automatically hides images from new users.
// @run-at        document-start
// @grant         none
// @include       *://*stackexchange.com/*
// @include       *://*stackoverflow.com/*
// @include       *://*mathoverflow.com/*
// @include       *://*serverfault.com/*
// @include       *://*superuser.com/*
// @include       *://*stackapps.com/*
// @include       *://*askubuntu.com/*
// @exclude       *://*stackoverflow.com/c/*
// @version       1.3
// ==/UserScript==

var style = document.createElement("style");
style.textContent = ".post-text img:not(.gasmask-treated){visibility:hidden}" +
                    ".post-text img{cursor:pointer}";
document.head.appendChild(style);

var timer = setInterval(function () {
  if (document.readyState === "complete") {
    clearInterval(timer);
  }
  var newImgs = document.querySelectorAll(".post-text img:not(.gasmask-treating)");
  [].forEach.call(newImgs, function (img) {
    var post = img;
    while (!post.classList.contains("postcell") && !post.classList.contains("answercell")) {
      post = post.parentElement;
    }
    var repElem = post.querySelector(".post-signature:last-child .reputation-score");
    if (repElem.textContent === "1") {
      var origSrc = img.src;
      img.src = "https://upload.wikimedia.org/wikipedia/commons/5/57/Gas_mask.svg";
      img.width = 200;
      img.addEventListener("click", function handler(event) {
        img.src = origSrc;
        img.removeEventListener("click", handler);
        event.preventDefault();
      });
      img.classList.add("gasmask-treating");
      setTimeout(function () {
        img.classList.add("gasmask-treated");
      }, 1000);
    } else {
      img.classList.add("gasmask-treating", "gasmask-treated");
    }
  });
}, 100);
