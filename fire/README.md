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
2. <kbd>1</kbd> - Select _"False positive"_,
3. <kbd>Space</kbd> or <kbd>Enter</kbd> - Submit.

To open the reported post on it's site:

1. <kbd>Ctrl</kbd>+<kbd>Space</kbd> - Open the last report,
2. <kbd>5</kbd> - Open the post.
