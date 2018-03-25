// ==UserScript==
// @name        Smokey Pings After Message (SPAM)
// @description Play the ping sound if Smokey has a message at the bottom of the SOCVR chat.
// @author      Henders
// @attribution Andy Henderson (https://github.com/SulphurDioxide)
// @version     0.1.1
// @match       *://chat.stackexchange.com/rooms/11540/charcoal-hq*
// @match       *://chat.stackoverflow.com/rooms/41570/so-close-vote-reviewers*
// @match       *://chat.meta.stackexchange.com/rooms/89/tavern-on-the-meta*
// @grant       none
// ==/UserScript==

// Set the constant by passing in an object and then selecting which key to use based on the current host:
const smokeyID = {
  "chat.stackexchange.com": 120914,
  "chat.stackoverflow.com": 3735529,
  "chat.meta.stackexchange.com": 266345,
}[window.location.host];

// If there is no sound set, set the default one:
if (localStorage.getItem("SPAM-settings") == null) {
  // Set the default value:
  var defaultSpamSettings = {
    notificationSound: "default",
  };

  localStorage.setItem("SPAM-settings", JSON.stringify(defaultSpamSettings));
}

/*
  One day this will be selectable so you can choose which ID you want notifying about.

  For example, this could equally ping you for FireAlarm, Queen etc...
*/
var userID = smokeyID;

// These are the settings for which reports to ping about:
var pingReportsOnly = true;

// Regex for matching reports:
var reportRegex = /\[ <a[^>]+>SmokeDetector<\/a> \| <a[^>]+>MS<\/a> ] /;

$(document).ready(function () {
  // Add our function to the CHAT event handler:
  CHAT.addEventHandlerHook(chatMessageRecieved);

  // Add the SPAM link to change the settings:
  $("#sidebar-menu").append("| <a id='spamOptions' href='#' onclick='return false'>SPAM</a>");
  $("head").append("<style> .spamSettings { position: fixed; z-index: 50; padding: 10px; border: 1px solid #aaa; width: 200px; font-size: 11px; color: #444; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; background: rgba(255,255,255,0.95); filter: alpha(opacity=95); -webkit-box-shadow: 0 1px 15px #9c9c9c; -moz-box-shadow: 0 1px 15px #9c9c9c; box-shadow: 0 1px 15px #9c9c9c; overflow: hidden; } </style>");

  $("#jplayer").append("<audio id='jp_audio_clavinova' preload='metadata' src='https://adhenderson.co.uk/sounds/clavinova.mp3'></audio><audio id='jp_audio_vibraphone' preload='metadata' src='https://adhenderson.co.uk/sounds/vibraphone.mp3'></audio><audio id='jp_audio_piano' preload='metadata' src='https://adhenderson.co.uk/sounds/piano.mp3'></audio>");

  $("#spamOptions").click(function () {
    toggleSpamOptions();
  });
});
/*
  This function is called when a new chat event fires.
    - Check that the event is of type 1 (message posted)
    - Check the message is from userID specified
*/
function chatMessageRecieved({event_type, user_id, content}) {
  // First, check the event_type is 1 (message posted):
  if (event_type !== 1) {
  // It isn't a 'message posted' event:
    return false;
  }

  // Check the user_id the one we expect it to be:
  if (userID === user_id) {
    // This is the id we were looking for (in most cases Smokey):
    // Is reports only true?
    if (pingReportsOnly) {
      // Only pinging for reports, attempt to match the report:
      var matchResult = content.match(reportRegex);

      if (matchResult === null) {
        // No match for regex, return false:
        return false;
      }
    }
    // Play the ping sound:
    playSpamSound();
  }
}

/*
    This function shows / hides the spam settings menu.
*/
function toggleSpamOptions() {
  var spamOptionsMenu = "<div id='spamOptionsMenu' class='spamSettings'><div style='position: absolute; right: 10px;'><a id='closeSpamOptions' href='#' onclick='return false;'>Close</a></div><h2>Spam Options</h2><strong>Notification Sound</strong>:<div><select id='spamSoundSelect'><option id='defaultOption' class='SPAM-option' value='default'>Default</option><option id='pianoOption' class='SPAM-option' value='piano'>Piano</option><option id='clavinovaOption' class='SPAM-option' value='clavinova'>Clavinova</option><option id='vibraphoneOption' class='SPAM-option' value='vibraphone'>Vibraphone</option></select></div> </div>";

  if ($("#spamOptionsMenu").length < 1) {
    $("#spamOptions").after(spamOptionsMenu);

    var storedSound = JSON.parse(localStorage.getItem("SPAM-settings")).notificationSound;
    $("#" + storedSound + "Option").attr("selected", true);

    $("#closeSpamOptions").click(function () {
      toggleSpamOptions();
    });
    $("#spamSoundSelect").change(function () {
      playSpamSound(this.value);
      setSpamSound(this.value);
    });
  } else {
    // Get rid of the menu if it already exists:
    $("#spamOptionsMenu").remove();
  }
}

function setSpamSound(sound) {
  // Current stored settings:
  var currentStoredSettings = JSON.parse(localStorage.getItem("SPAM-settings"));

  currentStoredSettings.notificationSound = sound;

  localStorage.setItem("SPAM-settings", JSON.stringify(currentStoredSettings));

  $(".SPAM-option").attr("selected", false);
  $("#" + sound + "Option").attr("selected", true);
}

function playSpamSound(sound) {
  const soundMap = {
    default: "jp_audio_0",
    clavinova: "jp_audio_clavinova",
    piano: "jp_audio_piano",
    vibraphone: "jp_audio_vibraphone",
  };

  if (typeof sound == "undefined") {
    // Play the stored sound:
    var storedSound = JSON.parse(localStorage.getItem("SPAM-settings")).notificationSound;

    $("#" + soundMap[storedSound])[0].play();
  } else {
    // Play the sound specified:
    $("#" + soundMap[sound])[0].play();
  }
}
