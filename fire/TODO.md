# TODO:
* ___Bug: FIRE doesn't open the report after getting a MS write token.___
* ___Bug: If you’re typing a message, then [k] the spam, hitting [return] sends the message instead of the feedback.___
* Add `.fire-done` class to FIRE buttons for which the reported post was deleted / flagged, and feedback was sent. &diams;
* Re-structure document
  * Wrap similar functions in objects, like `popups.openSettings()`
* Add "Rude/Abusive" button:
  * Implement SE "rude" feedback.
* Load data through metapi.js for cross-script storage. &diams;
* Improve MS feedback error handling.
  * Respect passed "Backoff" params. &diams;
* "Open last report that needs action" keyboard shortcut. &diams;
* Handle write token request errors.
* Improve popup creation:
  * Load (external?) HTML?
  * Use template (HTML) strings?
  * Popup class that accepts body as parameter.
* Extend / wrap toastr functions to also log to console if debug.
* Ask for confirmation if I click "spam" or "rude" on a post which has been edited.

Points marked with &diams; are related to the "loading" rewrite.

Basically, now you can _"KILL IT WITH FIRE"_

## Notes

[Documentation for metapi](https://github.com/Charcoal-SE/userscripts/wiki/metapi-API-documentation).  
[EmojiPedia](http://emojipedia.org/f)

<!--- http://stackapps.com/apps/oauth/view/9136 --->
<!--- "🗳️" "💣" "🏷️" "🛡️" --->
<!---
🔥 I've just updated [FIRE](https://github.com/Charcoal-SE/userscripts/tree/master/fire) to [`version`](https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js)!
--->
