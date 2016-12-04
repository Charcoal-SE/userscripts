// ==UserScript==
// @name          Unofficial Stack Exchange gas mask
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
// @version       1.2
// ==/UserScript==

if(true || location.search.indexOf("smokeypost=true") !== -1){
  console.log("gas mask engaging");
  var style = document.createElement("style");
  style.textContent = ".post-text img:not(.gasmask-treated){visibility:hidden}";
  document.head.append(style);

  var timer = setInterval(function(){
    if(document.readyState === "complete") clearInterval(timer);
    var newImgs = document.querySelectorAll(".post-text img:not(.gasmask-treated)");
    [].forEach.call(newImgs, function(img){
      var origSrc = img.src;
      img.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Gas_mask.svg/200px-Gas_mask.svg.png";
      img.addEventListener("click", function handler(event){
        img.src = origSrc;
        img.removeEventListener("click", handler);
        event.preventDefault();
      });
      setTimeout(function(){
        img.classList.add("gasmask-treated");
      }, 1000);
    });
  }, 100);
}
