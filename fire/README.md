# 🔥 FIRE!

This is still a "work in progress".  
As of this moment, the userscript does post flags _and_ MS feedback.

---

# Features
- Open a popup for any SmokeDetector report by clicking the "Fire" or "🔥" button in the report.
- SmokeDetector's _last_ report can be opened in a popup using <kbd>Ctrl</kbd>+<kbd>Space</kbd>
- The popup will contain:
  - The reported post's contents.
    - All links in a post will show their target url when you hover your mouse over them.
    - Code blocks in the post can be expanded by clicking on them.
  - 4 feedback buttons.
    - [tpu-], [tp-], [naa-], [fp-], for Spam, vandalism, NAA/VLQ, false postitive.
    - These can be selected with <kbd>1</kbd>-<kbd>4</kbd>, then "clicked" by pressing <kbd>Space</kbd> or <kbd>Enter</kbd>
    - The buttons can contain a number. This indicates how many users have sent that type of feedback.
    - If the buttons are faded out, you've already sent feedback for this report, so you can't send feedback again.
  - A header for the post's site
    - Clicking this header or pressing <kbd>5</kbd> will open the reported post on the site.
  - A "Close" button.
- When you submit `tpu-` feedback, the post will _also_ be flagged as "spam" on the SE network.
  - Provided you [have authorized MetaSmoke](https://metasmoke.erwaysoftware.com/authentication/status) to cast flags from your account.
- The popup modal's blur can be toggled with <kbd>B</kbd>
- The popup be closed by pressing <kbd>Esc</kbd> or by clicking outside of the popup.

## Examples

When SmokeDetector reports a post, these steps can be taken:

To flag it as spam / send _"True positive"_ feedback:

1. <kbd>Ctrl</kbd>+<kbd>Space</kbd> - Open the last report,
2. <kbd>1</kbd> - Select _"True positive"_,
3. <kbd>Space</kbd> or <kbd>Enter</kbd> - Submit.

To send _"False positive"_ feedback:

1. <kbd>Ctrl</kbd>+<kbd>Space</kbd> - Open the last report,
2. <kbd>5</kbd> - Select _"False positive"_,
3. <kbd>Space</kbd> or <kbd>Enter</kbd> - Submit.

To open the reported post on it's site:

1. <kbd>Ctrl</kbd>+<kbd>Space</kbd> - Open the last report,
2. <kbd>6</kbd> - Open the post.

# Authorize FIRE with Stack Exchange

1. Open the settings window.
2. Click "Authorize" button.
3. A new window opens where you "accept"
4. That window redirects to this chat with an access token in the url hash.
5. Fire sees the hash, saves your token, then closes the new window.
6. You go back to the old window, it detects a token, and shows you a "success" message.

# Version History

|1.0    ||
| ---   |---
|1.0.18 |Bugfix: FireFox still has issues loading the current user.
|1.0.17 |Bugfix: Escape style tags in posts.
|1.0.16 |Bugfix: Escape script tags in posts.
|1.0.15 |Bugfix: Escape HTML in report titles.
|1.0.14 |Bugfix: Ignore case on whitelisted tags.
|1.0.13 |Fixing "Decorate existing messages" for FireFox
|1.0.12 |Reducing the max size of a rendered image.
|1.0.11 |Bugfix: `decorateExistingMessages` timing.
|1.0.10 |Bugfix: got incorrect post ID for reports where the url contains a number.
|1.0.9  |Add SoBotics room.
|1.0.8  |Log toastr messages to the console.
|1.0.7  |Show "loading" error notification if FIRE fails to load a MS report.
|1.0.6  |Fixing incorrect escaping of HTML: Whitelisted some tags.
|1.0.5  |Fixing incorrect escaping of HTML / code blocks. Adding user's rep.
|1.0.4  |Fix `left` positioning of the FIRE popup to be within the left boundary of the screen.
|1.0.3  |Fix edit icon appearing in post.
|1.0.2  |Properly escape HTML in inline code.
|1.0.1  |Prevent link highlight shadow from overlapping preceding lines.
|1.0.0  |Removed "markdown" option, made links more obvious.

|0.9    ||
| ---   |---
|0.9.28 |Option to show markdown instead of rendered post.
|0.9.27 |Bugfix: Don't show FIRE icon on !!/help messages.
|0.9.26 |EmojiOne's paths changed.
|0.9.25 |Bugfix: don't open image url when showing the original image.
|0.9.24 |Fire now hides images in reported posts, by default.
|0.9.23 |Added version to the popup footer, with update link.
|0.9.22 |Added support for keypad keys.
|0.9.21 |Added logic to mark a deleted post as deleted on metapi.
|0.9.20 |Added the "The Spam Blot" chatroom.
|0.9.19 |Compatibility: Add fire to the global scope, but don't override it if it already exists.
|0.9.18 |Bugfix: Edited icon was shown twice, hasFlagged icon was shown when you hadn't flagged.
|0.9.17 |Bugfix: Edited icon wasn't shown.
|0.9.16 |Bugfix: Default storage before reading from it.
|0.9.15 |Bugfix: Fire has no local data on first install.
|0.9.14 |Adds the "ai-deleted" class to reports that have been deleted, but haven't been marked as such, yet.
|0.9.13 |Extended "why" tooltip hoverable area to include question title.
|0.9.12 |Bugfix: New posts always have 1 revision.
|0.9.11 |Bugfix: .net fallback.
|0.9.10 |Added JSDoc.
|0.9.9  |"No metasmoke reports found" error message.
|0.9.8  |Bugfix: don't use `this` in ES6.
|0.9.7  |Revert metapi for websocket in FIRE.
|0.9.6  |Fixing overriding metapi.
|0.9.2-5|Emoji compatibility, Render reported post as deleted, flag status on report, updating lint rules, constants.
|0.9.1  |Fixing some ES6 modification bugs.
|0.9.0  |ES6.

|0.8    ||
| ---   |---
|0.8.1  |Show "tpu-" instead of "rude".
|0.8.0  |Reworked script / CSS injection.

|0.7    ||
| ---   |---
|0.7.16 |Added "debug mode" toggle in settings.
|0.7.15 |Bugfix: Max-height due to moved buttons.
|0.7.14 |Clear sites cache on FIRE version change.
|0.7.13 |Title narrower.
|0.7.12 |Keyboard shortcuts.
|0.7.11 |Keyboard shortcuts.
|0.7.10 |Disable account check: doesn't work.
|0.7.9  |Bugfix: broken anchor hovers.
|0.7.8  |Keyboard shortcuts, "rude" feedback button.
|0.7.7  |Account check.
|0.7.6  |Bugfix: Edit icon wasn't rendered correctly.
|0.7.5  |Bugfix: ClosePopup selectors.
|0.7.4  |Allow hash in page url.
|0.7.3  |Bugfix: Arrow functions -> parameters.
|0.7.2  |Prefer arrow functions.
|0.7.1  |Extended SE integration: Load post revision / deletion status.
|0.7.0  |Implemented SE API.

|0.6    ||
| ---   |---
|0.6.7  |CSS tweaks.
|0.6.6  |Allow for longer reason fields.
|0.6.5  |CSS tweaks.
|0.6.4  |Missing semicolon.
|0.6.3  |Prettify report reason.
|0.6.2  |Add MS reason to report popup.
|0.6.1  |Add MS reason to report popup.
|0.6.0  |Added "read-only" mode.

|0.5    ||
| ---   |---
|0.5.9  |Reduce code duplication, better match for report message.
|0.5.8  |Removing title "new reports" count: Conflicts with chat's title changes.
|0.5.7  |Adding title "new reports" count.
|0.5.6  |Exposed method to open a report for a message
|0.5.5  |Rollback: Timestamp check didn't work.
|0.5.4  |Added logging functions.
|0.5.3  |Don't show on "tpu-" feedback.
|0.5.2  |Refactor steps.
|0.5.1  |Changed header emoji size.
|0.5.0  |Added "Flag on tpu- feedback" option.

|0.4    ||
| ---   |---
|0.4.14 |Don't show FIRE button on "SD start-up" messages.
|0.4.13 |Don't rely on link contents
|0.4.12 |Bugfix: Fire is broken when there is no MS link
|0.4.11 |Get FIRE metadata from the userscript's metadata block.
|0.4.10 |GUI tweaks.
|0.4.9  |Usability, maintainability.
|0.4.8  |Refactor, added username to report.
|0.4.7  |Fixed some openPopup issues.
|0.4.6  |Debounced feedback.
|0.4.5  |Make the title a little less obnoxious.
|0.4.4  |Bugfix: FIRE couldn't open.
|0.4.3  |Bugfixes.
|0.4.2  |Fixing emoji bug.
|0.4.1  |Removing debugger statement.
|0.4.0  |Reworked report data loading with cache.

|0.3    ||
| ---   |---
|0.3.12 |Large emoji option.
|0.3.11 |Emoji fall-back.
|0.3.10 |Don't use EmojiOne for FIRE.
|0.3.9  |Adding Emoji library, error fixes.
|0.3.8  |<kbd>Esc</kbd> key to close settings.
|0.3.7  |Caching.
|0.3.6  |Animate settings button.
|0.3.5  |Button transitions.
|0.3.4  |Naming: notifications.
|0.3.3  |Replace notification radios with dropdown.
|0.3.2  |CSS loading test.  
|0.3.1  |Load CSS based on FIRE version.
|0.3.0  |Added FIRE settings page.

|0.2    ||
| ---   |---
|0.2.6  |Button hover same colour as button.
|0.2.5  |Feedback / Flagging improvements.
|0.2.4  |Pre-flagging checks.
|0.2.3  |Cleaning up some functions.
|0.2.2  |Feedback modifications.
|0.2.1  |Feedback bugfixes.
|0.2.0  |Added Feedback.

|0.1    ||
| ---   |---
|0.1.0  |Initial setup: FIRE popup / Report message listener.
