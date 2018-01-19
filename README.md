# Userscripts [![Travis](https://img.shields.io/travis/Charcoal-SE/userscripts.svg)](https://travis-ci.org/Charcoal-SE/userscripts)

A selection of useful userscripts for the regulars of [Charcoal HQ](http://chat.stackexchange.com/rooms/11540/charcoal-hq).


## Quick download links

 - [Flag Dialog Smokey Controls (FDSC)](https://github.com/Charcoal-SE/Userscripts/raw/master/fdsc/fdsc.user.js) ([Instructions](https://github.com/Charcoal-SE/Userscripts/wiki/FDSC))
 - [Dark Theme for metasmoke](https://github.com/Charcoal-SE/Userscripts/blob/master/ms-dark-theme/ms_dark_theme.user.js)
 - [Hide topbar ads](https://github.com/Charcoal-SE/Userscripts/raw/master/hideads/hideads.user.js)
 - [Autoflagging information for Charcoal HQ (AIM)](https://github.com/Charcoal-SE/Userscripts/raw/master/autoflagging/autoflagging.user.js)
 - [Feedback Instantly, Rapidly, Effortlessly (FIRE)](https://github.com/Charcoal-SE/Userscripts/raw/master/fire/fire.user.js)
 - [Automatically Enable Keyboard Shortcuts (AEKS)](https://github.com/Charcoal-SE/Userscripts/raw/master/aeks/aeks.user.js) ([Info](https://github.com/Charcoal-SE/userscripts/wiki/AEKS))
 - [Spam Tracker](https://github.com/Charcoal-SE/userscripts/blob/master/spamtracker/spamtracker.user.js)

Other obselete/discontinued scripts are avaliable for download by clicking the 'Raw' button on their source code.

## License

Licensed under either of

 * Apache License, Version 2.0, ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
 * MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any
additional terms or conditions.

There is a script in package.json that can be run with `npm run get-meta <file>`.
This script will generate <script>.meta.js files containing only the script’s
metadata, so the whole script doesn't have to be downloaded to check for updates.
Example use:
```js
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.meta.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js
```
