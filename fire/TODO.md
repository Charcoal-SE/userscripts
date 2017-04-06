# TODO:
* ___Bug: FIRE doesn't open the report after getting a MS write token.___
* ___Don't render images in the report (setting)___
* Re-structure document
  * Wrap similar functions in objects, like `popups.openSettings()`
* Add "Rude/Abusive" button:
  * Implement SE "rude" feedback.
* Cast "NAA" flag fro "NAA" feedback.
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

# version history

- 0.9.22 - Added support for keypad keys.
- 0.9.21 - Added logic to mark a deleted post as deleted on metapi.
- 0.9.20 - Added the "The Spam Blot" chatroom.
- 0.9.19 - Compatibility: Add fire to the global scope, but don't override it if it already exists.
- 0.9.18 - Bugfix: Edited icon was shown twice, hasFlagged icon was shown when you hadn't flagged.
- 0.9.17 - Bugfix: Edited icon wasn't shown.
- 0.9.16 - Bugfix: Default storage before reading from it.
- 0.9.15 - Bugfix: Fire has no local data on first install.
- 0.9.14 - Adds the "ai-deleted" class to reports that have been deleted, but haven't been marked as such, yet.
- 0.9.13 - Extended "why" tooltip hoverable area to include question title.

## Notes

[Documentation for metapi](https://github.com/Charcoal-SE/userscripts/wiki/metapi-API-documentation).  
[EmojiPedia](http://emojipedia.org/f)

<!--- http://stackapps.com/apps/oauth/view/9136 --->
<!--- "🗳️" "💣" "🏷️" "🛡️" --->
<!---
I've just updated [FIRE](https://github.com/Charcoal-SE/userscripts/tree/master/fire) to [`version`](https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js)!
--->
