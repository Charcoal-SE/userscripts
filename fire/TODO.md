# TODO:
* ___Re-structure document___
  * Wrap similar functions in objects, like `popups.openSettings()`
* Load data through metapi.js for cross-script storage;
* Improve MS feedback error handling.
  * Respect passed "Backoff" params
* Handle write token request errors
* Detect if a user has flagged the post already:
  * Detect flags not sent through MS
* "Open last report that needs action" keyboard shortcut.
* Improve popup creation:
  * Popups are basically hard-coded. Load (external?) HTML?

Basically, now you can _"KILL IT WITH FIRE"_

## Notes

metapi is sort of vaguely beta-ready, if you want to modify (or fork) your scripts to test it.  
The following in your userscript header should make sure metapi is loaded:  
`// @require https://cdn.rawgit.com/Charcoal-SE/userscripts/7b3131f41ef3408cc0e605c29e725e6e65af8e85/metapi.js`  
[Documentation for metapi](https://github.com/Charcoal-SE/userscripts/wiki/metapi-API-documentation).

<!--- http://stackapps.com/apps/oauth/view/9136 --->
<!---
"🚩"
"🗳️"
"💣"
"🏷️"
"🛡️"
--->
