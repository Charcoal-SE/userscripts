# 🔥 FIRE!

This is still a "work in progress".  
As of this moment, the userscript does post flags _and_ MS feedback.
---
# Features
- Open a popup for any SmokeDetector report by clicking the "Fire" or "🔥" button in the report.
- SmokeDetector's _last_ report can be opened in a popup using <kbd>Ctrl</kbd>+<kbd>Space</kbd>
- The popup will contain:
  - The reported post's contents.
  - 4 feedback buttons. (<kbd>1</kbd> - <kbd>4</kbd>, followed by <kbd>Space</kbd> or <kbd>Enter</kbd>)
  - A header for the post's site
    - Clicking this header will open the reported post on the site. (<kbd>5</kbd>)
  - A "Close" button (<kbd>Esc</kbd>)
- When you submit `tpu-` feedback, the post will _also_ be flagged as "spam" on the SE network.
  - Provided you [have authorized MetaSmoke](https://metasmoke.erwaysoftware.com/authentication/status) to cast flags from your account.
- The popup modal's blur can be toggled with <kbd>B</kbd>

---
# TODO:
* ___Implement MS feedback error handling___
* ___Handle write token request errors___
  * Handle expired / invalid write tokens.
* Disable / Highlight feedback buttons depending on (earlier) submitted feedback / flags.
* Detect if a user has flagged the post already

Basically, now you can _"KILL IT WITH FIRE"_

<!--
http://stackapps.com/apps/oauth/view/9136
-->
