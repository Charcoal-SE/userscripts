// ==UserScript==
// @name          Unofficial Stack Exchange gas mask
// @description   A mission-critical tool when exploring the deepest depths of Stack Exchange.
// @description   Automatically hides images from new users. 
// @run-at        document-start
// @grant         none
// @include       http://*stackexchange.com/*
// @include       http://*stackoverflow.com/*
// @include       http://*mathoverflow.com/*
// @include       http://*serverfault.com/*
// @include       http://*superuser.com/*
// @include       http://*stackapps.com/*
// @include       http://*askubuntu.com/*
// @require       //ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// @version       1.0
// ==/UserScript==

if(~location.search.indexOf("smokeypost=true")){
  var style = document.createElement("style");
  style.textContent = ".post-text img:not(.gasmask-treated){visibility:hidden}";
  document.head.append(style);

  var timer = setInterval(function(){
    var newImgs = document.querySelectorAll(".post-text img:not(.gasmask-treated)");
    [].forEach.call(newImgs, function(img){
      var origSrc = img.src;
      img.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Gas_mask.svg/200px-Gas_mask.svg.png"
      img.addEventListener("click", function handler(event){
        img.src = origSrc;
        img.removeEventListener("click", handler);
        event.preventDefault();
      })
      img.classList.add("gasmask-treated");
    });
  }, 100);
}
