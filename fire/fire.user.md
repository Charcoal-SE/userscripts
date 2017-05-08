<a name="module_fire"></a>

## fire
FIRE's global object.


* [fire](#module_fire)
    * [`.metaData`](#module_fire.metaData)
    * [`.api`](#module_fire.api)
    * [`.clickHandlers`](#module_fire.clickHandlers) ℗
        * [`.requestToken()`](#module_fire.clickHandlers.requestToken) ℗
        * [`.saveToken(input, callback)`](#module_fire.clickHandlers.saveToken) ℗
        * [`.disableReadonly()`](#module_fire.clickHandlers.disableReadonly) ℗
    * [`.requestStackExchangeToken()`](#module_fire.requestStackExchangeToken) ℗
    * [`.checkHashForWriteToken()`](#module_fire.checkHashForWriteToken) ℗
    * [`.checkWriteTokenSuccess()`](#module_fire.checkWriteTokenSuccess) ℗
    * [`.getDataForUrl(reportedUrl, callback)`](#module_fire.getDataForUrl) ℗
    * [`.listHasCurrentUser(flags)`](#module_fire.listHasCurrentUser) ⇒ <code>boolean</code> ℗
    * [`.loadDataForReport(openAfterLoad)`](#module_fire.loadDataForReport) ℗
    * [`.updateReportCache()`](#module_fire.updateReportCache) ℗
    * [`.parseDataForReport(data, openAfterLoad, $this, skipLoadPost)`](#module_fire.parseDataForReport) ℗
    * [`.parseSiteUrl(url)`](#module_fire.parseSiteUrl) ⇒ <code>string</code> ℗
    * [`.loadStackExchangeSites()`](#module_fire.loadStackExchangeSites) ℗
    * [`.loadPost(report)`](#module_fire.loadPost) ℗
    * [`.loadPostRevisions(report)`](#module_fire.loadPostRevisions) ℗
    * [`.showEditedIcon()`](#module_fire.showEditedIcon) ℗
    * [`.loadPostFlagStatus(report)`](#module_fire.loadPostFlagStatus) ℗
    * [`.loadCurrentSEUser([page])`](#module_fire.loadCurrentSEUser) ℗
    * [`.parseUserResponse(response, page)`](#module_fire.parseUserResponse) ℗
    * [`.getSE(method, parameters, success, error, always)`](#module_fire.getSE) ℗
    * [`.stackExchangeAjaxCall(method, parameters, config)`](#module_fire.stackExchangeAjaxCall) ⇒ <code>jqXHR</code> ℗
    * [`.getWriteToken([callback])`](#module_fire.getWriteToken) ℗
    * [`.chatListener(message)`](#module_fire.chatListener) ℗
    * [`.decorateMessage(message)`](#module_fire.decorateMessage)
    * [`.filterOnContents($object, text)`](#module_fire.filterOnContents) ⇒ <code>object</code> ℗
    * [`.toastrPositionChangeHandler()`](#module_fire.toastrPositionChangeHandler) ℗
    * [`.toastrDurationHandler()`](#module_fire.toastrDurationHandler) ℗
    * [`.blurOptionClickHandler()`](#module_fire.blurOptionClickHandler) ℗
    * [`.flagOptionClickHandler()`](#module_fire.flagOptionClickHandler) ℗
    * [`.debugOptionClickHandler()`](#module_fire.debugOptionClickHandler) ℗
    * [`.imageOptionClickHandler()`](#module_fire.imageOptionClickHandler) ℗
    * [`.boolOptionClickHandler(element, message, key, [callback])`](#module_fire.boolOptionClickHandler) ℗
    * [`.keyboardShortcuts(e)`](#module_fire.keyboardShortcuts) ℗
    * [`.openReportPopupForMessage(message)`](#module_fire.openReportPopupForMessage)
    * [`.writeTokenPopup(callback)`](#module_fire.writeTokenPopup) ℗
    * [`.openReportPopup()`](#module_fire.openReportPopup) ℗
    * [`.openSettingsPopup()`](#module_fire.openSettingsPopup) ℗
    * [`.closePopup()`](#module_fire.closePopup) ⇒ <code>object</code> ℗
    * [`.getPopupLeft()`](#module_fire.getPopupLeft) ⇒ <code>number</code> ℗
    * [`.postMetaSmokeFeedback(data, verdict, button)`](#module_fire.postMetaSmokeFeedback) ℗
    * [`.postMetaSmokeSpamFlag(data, api, token, feedbackSuccess)`](#module_fire.postMetaSmokeSpamFlag) ⇒ <code>undefined</code> ℗
    * [`.keyCodesToArray(keyCodes)`](#module_fire.keyCodesToArray) ⇒ <code>array.number</code> ℗
    * [`.createFeedbackButton(data, keyCodes, text, verdict, tooltip)`](#module_fire.createFeedbackButton) ⇒ <code>object</code> ℗
    * [`.createCloseButton(clickHandler)`](#module_fire.createCloseButton) ⇒ <code>object</code> ℗
    * [`.createSettingsCheckBox(id, value, handler, labelText, headerText)`](#module_fire.createSettingsCheckBox) ⇒ <code>object</code> ℗
    * [`._(tagName, [cssClass], [options])`](#module_fire._) ⇒ <code>object</code> ℗
    * [`.br()`](#module_fire.br) ⇒ <code>object</code> ℗
    * [`.span(contents)`](#module_fire.span) ⇒ <code>object</code> ℗
    * [`.button(text, clickHandler)`](#module_fire.button) ⇒ <code>object</code> ℗
    * [`.hasEmojiSupport()`](#module_fire.hasEmojiSupport) ℗
    * [`.emojiOrImage(emoji, [large])`](#module_fire.emojiOrImage) ⇒ <code>object</code> ℗
    * [`.injectExternalScripts()`](#module_fire.injectExternalScripts) ℗
    * [`.injectCSS(path)`](#module_fire.injectCSS) ℗
    * [`.injectScript(name, path, [callback], [always])`](#module_fire.injectScript) ℗
    * [`.loadToastrCss()`](#module_fire.loadToastrCss) ℗
    * [`.initializeToastr()`](#module_fire.initializeToastr) ℗
    * [`.registerOpenLastReportKey()`](#module_fire.registerOpenLastReportKey) ℗
    * [`.registerAnchorHover()`](#module_fire.registerAnchorHover) ℗
    * [`.registerWebSocket()`](#module_fire.registerWebSocket) ℗
    * [`.registerForLocalStorage(object, key, localStorageKey)`](#module_fire.registerForLocalStorage) ℗
    * [`.registerLoggingFunctions()`](#module_fire.registerLoggingFunctions) ℗
    * [`.showFireOnExistingMessages()`](#module_fire.showFireOnExistingMessages) ℗
    * [`.decorateExistingMessages(timeout)`](#module_fire.decorateExistingMessages) ℗
    * [`.getLogger(fn)`](#module_fire.getLogger) ⇒ <code>function</code> ℗
    * [`.socketOnMessage(message)`](#module_fire.socketOnMessage) ℗
    * [`.expandLinksOnHover()`](#module_fire.expandLinksOnHover) ℗
    * [`.initLocalStorage(hOP, defaultStorage)`](#module_fire.initLocalStorage) ℗
    * [`.setValue(key, value)`](#module_fire.setValue) ℗
    * [`.clearValue(key)`](#module_fire.clearValue) ℗
    * [`.getCurrentChatUser()`](#module_fire.getCurrentChatUser) ℗
    * [`.getFireConstants()`](#module_fire.getFireConstants) ⇒ <code>object</code> ℗
    * [`~singleReportCallback`](#module_fire..singleReportCallback) : <code>function</code>


---

<a name="module_fire.metaData"></a>

### `fire.metaData`
The userscript's metadata

**Kind**: static property of <code>[fire](#module_fire)</code>  
**Access**: public  

---

<a name="module_fire.api"></a>

### `fire.api`
The userscript's api urls and keys

**Kind**: static property of <code>[fire](#module_fire)</code>  
**Access**: public  

---

<a name="module_fire.clickHandlers"></a>

### `fire.clickHandlers` ℗
Click handlers for the settings window.

**Kind**: static constant of <code>[fire](#module_fire)</code>  
**Access**: private  

* [`.clickHandlers`](#module_fire.clickHandlers) ℗
    * [`.requestToken()`](#module_fire.clickHandlers.requestToken) ℗
    * [`.saveToken(input, callback)`](#module_fire.clickHandlers.saveToken) ℗
    * [`.disableReadonly()`](#module_fire.clickHandlers.disableReadonly) ℗


---

<a name="module_fire.clickHandlers.requestToken"></a>

#### `clickHandlers.requestToken()` ℗
Open the "Request authorization" MetaSmoke page.

**Kind**: static method of <code>[clickHandlers](#module_fire.clickHandlers)</code>  
**Access**: private  

---

<a name="module_fire.clickHandlers.saveToken"></a>

#### `clickHandlers.saveToken(input, callback)` ℗
Request a token from the MetaSmoke code.

**Kind**: static method of <code>[clickHandlers](#module_fire.clickHandlers)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>object</code> | The input DOM node that contains the code. |
| callback | <code>function</code> | The callback that receives the MetaSmoke code. |


---

<a name="module_fire.clickHandlers.disableReadonly"></a>

#### `clickHandlers.disableReadonly()` ℗
Close all popup windows and open the "Request write token" popup.

**Kind**: static method of <code>[clickHandlers](#module_fire.clickHandlers)</code>  
**Access**: private  

---

<a name="module_fire.requestStackExchangeToken"></a>

### `fire.requestStackExchangeToken()` ℗
requestStackExchangeToken - Request a Stack Exchange Write token for this app.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.checkHashForWriteToken"></a>

### `fire.checkHashForWriteToken()` ℗
checkHashForWriteToken - Check the url hash to see if a write token has been obtained. If so, parse it.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.checkWriteTokenSuccess"></a>

### `fire.checkWriteTokenSuccess()` ℗
checkWriteTokenSuccess - Check if the write token was successfully obtained.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.getDataForUrl"></a>

### `fire.getDataForUrl(reportedUrl, callback)` ℗
getDataForUrl - Loads MetaSmoke data for a specified post url.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| reportedUrl | <code>string</code> | The url that's been reported. |
| callback | <code>singleReportCallback</code> | An action to perform after the report is loaded. |


---

<a name="module_fire.listHasCurrentUser"></a>

### `fire.listHasCurrentUser(flags)` ⇒ <code>boolean</code> ℗
listHasCurrentUser - Checks if the list of users on this flag report contains the current user.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>boolean</code> - `true` if the current user is found in the flag list.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| flags | <code>object</code> | A report's (auto-)flags, where it's `users` array has to be checked. |


---

<a name="module_fire.loadDataForReport"></a>

### `fire.loadDataForReport(openAfterLoad)` ℗
loadDataForReport - Loads a report's data when you hover over the FIRE button.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| openAfterLoad | <code>boolean</code> | Open the report popup after load? |


---

<a name="module_fire.updateReportCache"></a>

### `fire.updateReportCache()` ℗
updateReportCache - Loads all MS data on the page.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.parseDataForReport"></a>

### `fire.parseDataForReport(data, openAfterLoad, $this, skipLoadPost)` ℗
parseDataForReport - Parse a report's loaded data.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | A MetaSmoke report |
| openAfterLoad | <code>boolean</code> | Open the report popup after load? |
| $this | <code>object</code> | The clicked FIRE report button |
| skipLoadPost | <code>boolean</code> | skip loading additional data fot the post? |


---

<a name="module_fire.parseSiteUrl"></a>

### `fire.parseSiteUrl(url)` ⇒ <code>string</code> ℗
parseSiteUrl - Parse a site url into a api parameter.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>string</code> - The Stack Exchange API name for the report's site.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | A report's Stack Exchange link |


---

<a name="module_fire.loadStackExchangeSites"></a>

### `fire.loadStackExchangeSites()` ℗
loadStackExchangeSites - Loads a list of all Stack Exchange Sites.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.loadPost"></a>

### `fire.loadPost(report)` ℗
loadPost - Loads additional information for a post, from the Stack exchange API.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| report | <code>object</code> | The MetaSmoke report. |


---

<a name="module_fire.loadPostRevisions"></a>

### `fire.loadPostRevisions(report)` ℗
loadPostRevisions - Loads a post's revision history from the Stack Exchange API.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| report | <code>object</code> | The MetaSmoke report. |


---

<a name="module_fire.showEditedIcon"></a>

### `fire.showEditedIcon()` ℗
showEditedIcon - Render a "Edited" icon on a opened report popup.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.loadPostFlagStatus"></a>

### `fire.loadPostFlagStatus(report)` ℗
loadPostFlagStatus - Loads a post's flagging status from the Stack Exchange API.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| report | <code>object</code> | The MetaSmoke report. |


---

<a name="module_fire.loadCurrentSEUser"></a>

### `fire.loadCurrentSEUser([page])` ℗
loadPostFlagStatus - Loads the current Stack Exchange user and what sites they're registered at from the Stack Exchange API.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [page] | <code>number</code> | <code>1</code> | the page to load. |


---

<a name="module_fire.parseUserResponse"></a>

### `fire.parseUserResponse(response, page)` ℗
parseUserResponse - Parse the user response.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| response | <code>object</code> | the Stack Exchange `user` response. |
| page | <code>number</code> | The page that's been loaed. |


---

<a name="module_fire.getSE"></a>

### `fire.getSE(method, parameters, success, error, always)` ℗
getSE - `GET` call on the Stack Exchange API.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | The Stack Exchange api method. |
| parameters | <code>object</code> | The parameters to be passed to the Stack Exchange api. |
| success | <code>function</code> | The `success` callback. |
| error | <code>function</code> | The `error` callback. |
| always | <code>function</code> | The `always` callback. |


---

<a name="module_fire.stackExchangeAjaxCall"></a>

### `fire.stackExchangeAjaxCall(method, parameters, config)` ⇒ <code>jqXHR</code> ℗
stackExchangeAjaxCall - Perform an AJAX call on the Stack Exchange API.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>jqXHR</code> - The jqXHR Promise.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | The Stack Exchange api method. |
| parameters | <code>object</code> | The parameters to be passed to the Stack Exchange api. |
| config | <code>object</code> | The AJAX call configuration object, containing: |
| config.call | <code>function</code> | The jquery AJAX call to use. |
| config.success | <code>function</code> | The `success` callback. |
| config.error | <code>function</code> | The `error` callback. |
| config.always | <code>function</code> | The `always` callback. |


---

<a name="module_fire.getWriteToken"></a>

### `fire.getWriteToken([callback])` ℗
getWriteToken - Gets a MetaSmoke write token.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | A optional function to run after the write token was obtained. |


---

<a name="module_fire.chatListener"></a>

### `fire.chatListener(message)` ℗
chatListener - Chat message event listener.If SmokeDetector reports another post, decorate the message.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>object</code> | The received message, containing: |
| message.event_type | <code>number</code> | The message type |
| message.user_id | <code>number</code> | The message's userID |
| message.message_id | <code>number</code> | The message ID |


---

<a name="module_fire.decorateMessage"></a>

### `fire.decorateMessage(message)`
decorateMessage - Adds the "FIRE" button to the passed message.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>object</code> | The message DOM node the button should be added to. |


---

<a name="module_fire.filterOnContents"></a>

### `fire.filterOnContents($object, text)` ⇒ <code>object</code> ℗
filterOnContents - Filter a jQuery list on the element text.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>object</code> - The filtered list  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| $object | <code>object</code> | A jQuery list of DOM elements |
| text | <code>string</code> | The text the element should contain. |


---

<a name="module_fire.toastrPositionChangeHandler"></a>

### `fire.toastrPositionChangeHandler()` ℗
toastrPositionChangeHandler - Set the toastr position class.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.toastrDurationHandler"></a>

### `fire.toastrDurationHandler()` ℗
toastrDurationHandler - Update the toastr popup duration.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.blurOptionClickHandler"></a>

### `fire.blurOptionClickHandler()` ℗
blurOptionClickHandler - Set the "Blur" option for the popup modal.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.flagOptionClickHandler"></a>

### `fire.flagOptionClickHandler()` ℗
flagOptionClickHandler - Set the "Flag" option for "tpu-" feedback.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.debugOptionClickHandler"></a>

### `fire.debugOptionClickHandler()` ℗
debugOptionClickHandler - Set the "Debug" option to show logs in the dev console.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.imageOptionClickHandler"></a>

### `fire.imageOptionClickHandler()` ℗
imageOptionClickHandler - Set the "HideImages" option to hide or show images in reports.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.boolOptionClickHandler"></a>

### `fire.boolOptionClickHandler(element, message, key, [callback])` ℗
boolOptionClickHandler - Set a boolean option after a setting checkbox was clicked.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| element | <code>object</code> | The `input[type=checkbox]`` DOM node that was clicked. |
| message | <code>string</code> | The message to show. |
| key | <code>string</code> | The setting key to save. |
| [callback] | <code>function</code> | A optional callback. |


---

<a name="module_fire.keyboardShortcuts"></a>

### `fire.keyboardShortcuts(e)` ℗
keyboardShortcuts - Handle keypress events for the popup.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| e | <code>object</code> | the jQuery keyboard event |


---

<a name="module_fire.openReportPopupForMessage"></a>

### `fire.openReportPopupForMessage(message)`
openReportPopupForMessage - Opens a report popup for a specific message.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>object</code> | The message DOM node the report should be opened for. |


---

<a name="module_fire.writeTokenPopup"></a>

### `fire.writeTokenPopup(callback)` ℗
writeTokenPopup - Open a popup to enter the write token.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | The action to perform after getting a write token / chosing read-only mode. |


---

<a name="module_fire.openReportPopup"></a>

### `fire.openReportPopup()` ℗
openReportPopup - Build a report popup and show it.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.openSettingsPopup"></a>

### `fire.openSettingsPopup()` ℗
openSettingsPopup - Opens a popup to change fire's settings.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.closePopup"></a>

### `fire.closePopup()` ⇒ <code>object</code> ℗
closePopup - Close the popup.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>object</code> - The previously closed popup's button (if any) so it can be re-opened.  
**Access**: private  

---

<a name="module_fire.getPopupLeft"></a>

### `fire.getPopupLeft()` ⇒ <code>number</code> ℗
getPopupLeft - Gets the `left` position for the popup.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>number</code> - The `left` position for the popup.  
**Access**: private  

---

<a name="module_fire.postMetaSmokeFeedback"></a>

### `fire.postMetaSmokeFeedback(data, verdict, button)` ℗
postMetaSmokeFeedback - Submit MetaSmoke feedback.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | The report data. |
| verdict | <code>string</code> | The chosen verdict. |
| button | <code>object</code> | The clicked button. |


---

<a name="module_fire.postMetaSmokeSpamFlag"></a>

### `fire.postMetaSmokeSpamFlag(data, api, token, feedbackSuccess)` ⇒ <code>undefined</code> ℗
postMetaSmokeSpamFlag - Flag the post as spam.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>undefined</code> - returns undefined to break out of the function.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | The report data. |
| api | <code>object</code> | API configuration object, containing: |
| api.url | <code>string</code> | The API url. |
| api.key | <code>string</code> | The API key. |
| token | <code>string</code> | The MetaSmoke write token. |
| feedbackSuccess | <code>object</code> | A jQuery DOM node containing the feedback success message. |


---

<a name="module_fire.keyCodesToArray"></a>

### `fire.keyCodesToArray(keyCodes)` ⇒ <code>array.number</code> ℗
keyCodesToArray - Structure the keyCodes Array.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>array.number</code> - An array of keyCodes mapped from the input chars / keyCodes.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| keyCodes | <code>number</code> &#124; <code>string</code> &#124; <code>array</code> | An number, string, or array of numbers or strings containing keys or keycodes. |


---

<a name="module_fire.createFeedbackButton"></a>

### `fire.createFeedbackButton(data, keyCodes, text, verdict, tooltip)` ⇒ <code>object</code> ℗
createFeedbackButton - Create a feedback button for the top of the popup.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>object</code> - The constructed feedback button.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | the report data. |
| keyCodes | <code>number</code> &#124; <code>string</code> &#124; <code>array</code> | The keyCodes to use for this button. |
| text | <code>string</code> | The text to display for this button. |
| verdict | <code>string</code> | This button's MetaSmoke verdict |
| tooltip | <code>string</code> | The tooltip to display for this button. |


---

<a name="module_fire.createCloseButton"></a>

### `fire.createCloseButton(clickHandler)` ⇒ <code>object</code> ℗
createCloseButton - Create a button to close a popup.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>object</code> - The constructed "close" button.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| clickHandler | <code>function</code> | The button's `click` handler. |


---

<a name="module_fire.createSettingsCheckBox"></a>

### `fire.createSettingsCheckBox(id, value, handler, labelText, headerText)` ⇒ <code>object</code> ℗
createSettingsCheckBox - Creates a input[type=checkbox] for the settings.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>object</code> - The constructed settings checkbox.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | The option's name. |
| value | <code>boolean</code> | The option's current value. |
| handler | <code>function</code> | The option's click handler. |
| labelText | <code>string</code> | The text to show next to the checkbox. |
| headerText | <code>string</code> | The header to show above the checkbox. |


---

<a name="module_fire._"></a>

### `fire._(tagName, [cssClass], [options])` ⇒ <code>object</code> ℗
_ - Wrapper to create a new element with a specified class.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>object</code> - A jQuery DOM node.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| tagName | <code>string</code> | The tag to create. |
| [cssClass] | <code>string</code> | The tag's css class. Optional. If this is an object, this is assumed to be `options`. |
| [options] | <code>object</code> | The options to use for the created element. |


---

<a name="module_fire.br"></a>

### `fire.br()` ⇒ <code>object</code> ℗
br - Create a linebreak.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>object</code> - A jQuery `<br />` DOM node.  
**Access**: private  

---

<a name="module_fire.span"></a>

### `fire.span(contents)` ⇒ <code>object</code> ℗
span - Create a `<span>` with the specified contents.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>object</code> - A jQuery `<span>` DOM node with the specified contents.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| contents | <code>object</code> | A jQuery DOM node to use insert into the span. |


---

<a name="module_fire.button"></a>

### `fire.button(text, clickHandler)` ⇒ <code>object</code> ℗
button - Create a button.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>object</code> - A jQuery `<button>` DOM node.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | The button's text |
| clickHandler | <code>function</code> | The button's click handler. |


---

<a name="module_fire.hasEmojiSupport"></a>

### `fire.hasEmojiSupport()` ℗
hasEmojiSupport - Detect Emoji support in this browser.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.emojiOrImage"></a>

### `fire.emojiOrImage(emoji, [large])` ⇒ <code>object</code> ℗
emojiOrImage - Returns the emoji if it's supported. Otherwise, return a fallback image.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>object</code> - A jQuery `<span>` DOM node with the specified emoji as string or image.  
**Access**: private  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| emoji | <code>string</code> |  | The emoji to render |
| [large] | <code>boolean</code> | <code>false</code> | Make it large? |


---

<a name="module_fire.injectExternalScripts"></a>

### `fire.injectExternalScripts()` ℗
injectExternalScripts - Inject FIRE stylesheet and Toastr library.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.injectCSS"></a>

### `fire.injectCSS(path)` ℗
injectCSS - Inject the specified stylesheet.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The path to the CSS file. |


---

<a name="module_fire.injectScript"></a>

### `fire.injectScript(name, path, [callback], [always])` ℗
injectScript - Inject the specified script.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The global name to check against before injecting the script. Exapme: (`typeof myInjectedGlobal`) |
| path | <code>string</code> | The script's path. |
| [callback] | <code>function</code> | An optional "success" callback. |
| [always] | <code>function</code> | An optional "always" callback. |


---

<a name="module_fire.loadToastrCss"></a>

### `fire.loadToastrCss()` ℗
loadToastrCss - Load toastr css.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.initializeToastr"></a>

### `fire.initializeToastr()` ℗
initializeToastr - Set toastr options.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.registerOpenLastReportKey"></a>

### `fire.registerOpenLastReportKey()` ℗
registerOpenLastReportKey - Open the last report on [Ctrl]+[Space].

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.registerAnchorHover"></a>

### `fire.registerAnchorHover()` ℗
registerAnchorHover - Register the "tooltip" hover for anchor elements.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.registerWebSocket"></a>

### `fire.registerWebSocket()` ℗
registerWebSocket - Register a websocket listener.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.registerForLocalStorage"></a>

### `fire.registerForLocalStorage(object, key, localStorageKey)` ℗
registerForLocalStorage - Adds a property on `fire` that's stored in `localStorage`.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>object</code> | The object to register the property on. |
| key | <code>string</code> | The key to use on the object. |
| localStorageKey | <code>string</code> | The key to use in `localStorage`. |


---

<a name="module_fire.registerLoggingFunctions"></a>

### `fire.registerLoggingFunctions()` ℗
registerLoggingFunctions - Registers logging functions on `fire`.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.showFireOnExistingMessages"></a>

### `fire.showFireOnExistingMessages()` ℗
showFireOnExistingMessages - Adds the "FIRE" button to all existing messages and registers an event listener to do so after "load older messages" is clicked.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.decorateExistingMessages"></a>

### `fire.decorateExistingMessages(timeout)` ℗
decorateExistingMessages - Decorate messages that exist on page load.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| timeout | <code>number</code> | The time to wait before trying to decorate the messages. |


---

<a name="module_fire.getLogger"></a>

### `fire.getLogger(fn)` ⇒ <code>function</code> ℗
getLogger - Gets a log wrapper for the specified console function.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>function</code> - A fire-wrapped console function.  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | the console function to wrap in a `debug` condition. |


---

<a name="module_fire.socketOnMessage"></a>

### `fire.socketOnMessage(message)` ℗
socketOnMessage - Handle socket messages.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>object</code> | The socket message. |


---

<a name="module_fire.expandLinksOnHover"></a>

### `fire.expandLinksOnHover()` ℗
expandLinksOnHover - Expands anchor elements in the report's body on hover, to show the href.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.initLocalStorage"></a>

### `fire.initLocalStorage(hOP, defaultStorage)` ℗
initLocalStorage - Initializes `localStorage`.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| hOP | <code>function</code> | `Object.hasOwnProperty` bound securely. |
| defaultStorage | <code>objects</code> | localStorage's default settings. |


---

<a name="module_fire.setValue"></a>

### `fire.setValue(key, value)` ℗
setValue - Sets a value on `fire.userData`, stored in `localStorage`.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | the `localStorage` key. |
| value | <code>object</code> | the value to set. |


---

<a name="module_fire.clearValue"></a>

### `fire.clearValue(key)` ℗
clearValue - Removes a value from `fire.userData`, stored in `localStorage`

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | the `localStorage` key. |


---

<a name="module_fire.getCurrentChatUser"></a>

### `fire.getCurrentChatUser()` ℗
getCurrentChatUser - Gets the currently logged-in user.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Access**: private  

---

<a name="module_fire.getFireConstants"></a>

### `fire.getFireConstants()` ⇒ <code>object</code> ℗
getFireConstants - Gets constants to be used in `fire`.

**Kind**: static method of <code>[fire](#module_fire)</code>  
**Returns**: <code>object</code> - FIRE's constants  
**Access**: private  

---

<a name="module_fire..singleReportCallback"></a>

### `fire~singleReportCallback` : <code>function</code>
This is a callback that is passed a single report's data.

**Kind**: inner typedef of <code>[fire](#module_fire)</code>  

| Param | Type | Description |
| --- | --- | --- |
| reportData | <code>object</code> | The data for the loaded report. |


---

