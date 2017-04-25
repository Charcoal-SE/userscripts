// ==UserScript==
// @name         SpamtrackerReboot
// @version      0.9
// @description  Rewrite of the spamtracker project, this userscript will notify you using sound and a notification if a new spam post has been posted in any smoke detector supported rooms
// @author       Ferrybig
// @match        *://chat.meta.stackexchange.com/*
// @match        *://chat.stackexchange.com/*
// @match        *://chat.stackoverflow.com/*
// @run-at       document-end
// @require      https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js#sha512=1ac1502c5a6774e6e7d3c77dd90d863f745371cd936d8a1620ab1c4a21173ffccfd327e435395df6658779ea87baad3b5ff84bf195110c7bc3187112ee820917
// @resource     DataTablesCSS https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css#sha256=f99d6b61adf2b3939d64d51c9391bb941bdbf00d773ab630bdff9df0f7c46874
// @resource     DataTablesSortAsc https://cdn.datatables.net/1.10.13/images/sort_asc.png#sha256=595704c3f3cf4cb65c7d9c8508a99e7480e150095473faed31a07c21b13389b8
// @resource     DataTablesSortDesc https://cdn.datatables.net/1.10.13/images/sort_desc.png#sha256=d08ed0e21f187dd309030d465224da8085119a15a17d616ba0e477bb50c6f10d
// @resource     DataTablesSortBoth https://cdn.datatables.net/1.10.13/images/sort_both.png#sha256=3e016c23ae51417382b640ae2d19eb48047532c37ad53894bd185586559ccffb
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// ==/UserScript==
/* global GM_info, Notification, GM_setValue, GM_getValue, unsafeWindow, GM_getResourceText, GM_getResourceURL */

unsafeWindow.Spamtracker = (function(target, siterooms, window) {
    'use strict';
    // Defaults
    const defaultSounds = {
        metastackexchange: '//cdn-chat.sstatic.net/chat/meta2.mp3',
        stackexchange: '//cdn-chat.sstatic.net/chat/se.mp3',
        stackoverflow: '//cdn-chat.sstatic.net/chat/so.mp3',
        serverfault: '//cdn-chat.sstatic.net/chat/sf.mp3',
        superuser: '//cdn-chat.sstatic.net/chat/su.mp3',
        askubuntu: '//cdn-chat.sstatic.net/chat/ubuntu.mp3'
    };
    const css =
        '.spamtracker-popup-bg {' +
        '  position: fixed;' +
        '  width: 100%;' +
        '  height: 100%;' +
        '  top: 0;' +
        '  left: 0;' +
        '  background-color: rgba(0, 0, 0, 0.5);' +
        '  z-index: 100;' +
        '  text-align: center;' +
        '}' +
        '.spamtracker-popup-bg.hidden {' +
        '  display: none;' +
        '}' +
        '.spamtracker-popup-bg:before {' +
        "  content:''; " +
        '  display:inline-block; ' +
        '  height:100%; ' +
        '  vertical-align:middle;' +
        '}' +
        '.spamtracker-popup {' +
        '  width: 800px;' +
        '  display: inline-block;' +
        '  background: white;' +
        '  padding: 20px;' +
        '  border-radius: 10px;' +
        '  vertical-align: middle;' +
        '  box-shadow: 0 0 20px 2px rgba(0, 0, 0, 0.5);' +
        '}' +
        '.spamtracker-header {' +
        '  border-top-left-radius: 10px;' +
        '  border-top-right-radius: 10px;' +
        '  background-color: gray;' +
        '  margin: -20px -20px 1rem;' +
        '  padding: 10px;' +
        '  font-size: 3em;' +
        '}' +
        '.spamtracker-header-btn {' +
        '  width: 10rem;' +
        '}' +
        '.spamtracker-header-btn-close {' +
        '  width: 4rem;' +
        '  float: right;' +
        '}' +
        '.spamtracker-header-btn-bar {' +
        '}' +
        '.spamtracker-tab {' +
        '}' +
        '.spamtracker-table {' +
        '  width: 100%;' +
        '}';

    // Settings
    let useSound = true;
    let userSounds = {};
    let enabled = true;
    let defaultSound = 'metastackexchange';
    let perSiteSounds = {};
    let maxNotifications = 2;
    let debugLevel = 0;

    // Metadata
    let metaData = GM_info.script || GM_info.SpamtrackerReboot;

    // Caches
    const sound = {};
    const sitename = siterooms ? siterooms.href.split('host=')[1] : undefined;
    let callback;
    let lastMessageObserverTarget;
    let lastMessageObserver;
    let seSites = { sites: [], lastUpdate: 0 };
    /**
     * List of open web notification
     */
    const notifications = {};
    const notificationsQueue = [];

    // DOM stuff
    let domSpamtracker;
    let domGuiHolder;
    let domGui;
    let domTabSound;
    let domTabSites;

    /**
     * Loads this userscript
     */
    const init = function() {
        loadSeSites();
        loadSettings();
        registerObserver();
        restoreCallback();
        preloadSoundList(false);
        createDOMNodesForGui();
        info('Started!');
    };

    const loadSeSites = function() {
        seSites = getConfigOption('sites', seSites, true) || seSites;
        const ONE_MONTH = 28 * 24 * 60 * 60 * 1000; /* ms */
        if (
            seSites.sites.length === 0 ||
            new Date() - seSites.lastUpdate > ONE_MONTH
        ) {
            const xhttp = new XMLHttpRequest();
            info('Requesting api.stackexchange.com/2.2/sites');
            xhttp.onreadystatechange = () => {
                if (xhttp.readyState === 4 && xhttp.status === 200) {
                    seSites.sites = sortByKey(
                        JSON.parse(xhttp.responseText).items,
                        'name'
                    );
                    seSites.lastUpdate = new Date();
                    setConfigOption('sites', seSites, true);
                }
            };
            xhttp.open(
                'GET',
                'https://api.stackexchange.com/2.2/sites?pagesize=10000&filter=Q-ks*xGqUVcTlzkJZ',
                true
            );
            xhttp.send();
        }
    };

    const loadSettings = function() {
        userSounds = getConfigOption('sounds', userSounds, true);
        perSiteSounds = getConfigOption('sounds-per-site', perSiteSounds, true);
        enabled = getConfigOption('enabled', true, false);
        debugLevel = getConfigOption('debug', debugLevel, false, false);
        defaultSound = getConfigOption('defaultsound', defaultSound, true);
    };

    const prepareSound = function(url) {
        if (url) {
            if (!sound[url]) {
                sound[url] = new Audio(url);
                sound[url].addEventListener('error', cause => {
                    error('Failed to load: ', url);
                });
            }
            return true;
        }
        return false;
    };

    const preloadSoundList = function(loadAll) {
        if (loadAll) {
            for (let key in userSounds) {
                if (!userSounds.hasOwnProperty(key)) continue;
                prepareSound(userSounds[key]);
            }
            for (let key in defaultSounds) {
                if (!defaultSounds.hasOwnProperty(key)) continue;
                prepareSound(defaultSounds[key]);
            }
        } else {
            for (let i in perSiteSounds) {
                if (!perSiteSounds.hasOwnProperty(i)) continue;
                const soundName = perSiteSounds[i];
                const soundUrl =
                    userSounds[soundName] || defaultSounds[soundName];
                prepareSound(soundUrl);
            }
            const soundUrl =
                userSounds[defaultSound] || defaultSounds[defaultSound];
            prepareSound(soundUrl);
        }
    };

    const logPrepare = function(level, type) {
        return (...message) => {
            if (level <= debugLevel) {
                message.unshift('[SpamtrackerReboot][' + type + ']');
                console.log.apply(console.log, message);
            }
        };
    };

    const error = logPrepare(0, 'error');
    const warn = logPrepare(1, 'warn');
    const info = logPrepare(2, 'info');
    const debug = logPrepare(3, 'debug');

    const makeElement = function(type, classes = [], text = '') {
        const elm = document.createElement(type);
        if (classes.constructor === Array) {
            for (var i = 0; i < classes.length; i++) {
                elm.classList.add(classes[i]);
            }
        } else {
            elm.className = classes;
        }
        if (text) elm.textContent = text;
        return elm;
    };

    const makeText = function(text) {
        return document.createTextNode(text);
    };

    const makeButton = function(text, classes, click, type) {
        const elm = makeElement(type || 'button', classes, text);
        if (text && typeof text === 'function') {
            elm.textContent = text();
            elm.onclick = evt => {
                click(evt);
                elm.textContent = text();
            };
        } else {
            elm.onclick = click;
        }
        return elm;
    };

    const getKnownSoundNames = function() {
        const keys = [];
        for (let key in defaultSounds) {
            if (!defaultSounds.hasOwnProperty(key)) continue;
            if (userSounds[key]) continue;
            keys.push(key);
        }
        for (let key in userSounds) {
            if (!userSounds.hasOwnProperty(key)) continue;
            keys.push(key);
        }
        return keys;
    };

    const verifySoundName = function(name, keys = undefined) {
        if (!keys) keys = getKnownSoundNames();
        if (keys.indexOf(name) === -1) {
            if (keys.indexOf(defaultSound) === -1) {
                console.log(
                    'Default sound updated, because previous one was missing'
                );
                defaultSound = Object.keys(defaultSounds)[0];
            }
            name = defaultSound;
        }
        return name;
    };

    const makeSoundSelectBox = function(site) {
        const container = makeElement('span');
        const soundSelect = makeElement('select');
        const soundTest = makeElement('a', [], '►');
        const keys = getKnownSoundNames();
        let selectedSound = userSounds[site];
        for (let i = site ? -1 : 0; i < keys.length; i++) {
            const name = i === -1 ? 'default' : keys[i];
            const value = i === -1 ? '' : keys[i];
            const option = makeElement('option', [], name);
            option.value = value;
            if (name === selectedSound) {
                option.selected = true;
            }
            soundSelect.append(option);
        }
        soundSelect.addEventListener('change', () => {
            if (site) {
                if (soundSelect.value === '') {
                    delete perSiteSounds[site];
                } else {
                    perSiteSounds[site] = soundSelect.value;
                }
                setConfigOption('sounds-per-site', perSiteSounds, true);
            } else {
                defaultSound = soundSelect.value;
                setConfigOption('defaultsound', defaultSound, true);
            }
        });
        soundTest.href = 'javascript:void(0)';
        soundTest.addEventListener('click', () =>
            playSoundFile(soundSelect.value)
        );

        container.append(soundSelect);
        container.append(soundTest);
        return container;
    };

    const createDOMSelectionListForSite = function(
        site,
        friendlyName,
        iconUrl
    ) {
        preloadSoundList(true);
        const icon = makeElement('img');

        const iconCell = makeElement('td');
        const siteNameCell = makeElement('td', [], friendlyName);
        const soundCell = makeElement('td');

        const row = makeElement('tr');

        icon.src = iconUrl;
        icon.height = 16;

        soundCell.append(makeSoundSelectBox(site));

        iconCell.append(icon);

        row.append(iconCell);
        row.append(siteNameCell);
        row.append(soundCell);

        return row;
    };

    const createDOMSelectionListForAllSites = function() {
        if (domTabSites) return;
        debug('Creating sound tab');
        const domTable = makeElement('table', [
            'spamtracker-table',
            'display',
            'compact'
        ]);
        const domTableHead = makeElement('thead');
        const domTableHeadRow = makeElement('tr');
        const domTableHeadCellIcon = makeElement('th');
        const domTableHeadCellName = makeElement('th', [], 'Name');
        const domTableHeadCellSound = makeElement('th', [], 'Sound');
        domTableHeadRow.append(domTableHeadCellIcon);
        domTableHeadRow.append(domTableHeadCellName);
        domTableHeadRow.append(domTableHeadCellSound);
        domTableHead.append(domTableHeadRow);
        const domTableBody = makeElement('tbody');
        for (let i = 0; i < seSites.sites.length; i++) {
            if (seSites.sites[i].site_url.includes('.meta.')) {
                continue;
            }
            domTableBody.append(
                createDOMSelectionListForSite(
                    seSites.sites[i].site_url.replace('https://', ''),
                    seSites.sites[i].name,
                    seSites.sites[i].favicon_url
                )
            );
        }
        domTable.append(domTableHead);
        domTable.append(domTableBody);
        domTabSites = makeElement('div', [
            'spamtracker-tab-sound',
            'spamtracker-tab'
        ]);
        domTabSites.append(domTable);
        domGui.append(domTabSites);

        // The following is the only JQuery code inside this file...
        if ($) {
            $(domTable).DataTable({
                aoColumns: [null, null, { bSearchable: false }],
                scrollY: '60vh',
                scrollCollapse: true,
                paging: false
            });
        }
    };

    const createDOMNodesForGui = function() {
        // CSS
        addStyleString(
            GM_getResourceText('DataTablesCSS')
                .replace(
                    '../images/sort_asc.png',
                    GM_getResourceURL('DataTablesSortAsc')
                )
                .replace(
                    '../images/sort_desc.png',
                    GM_getResourceURL('DataTablesSortDesc')
                )
                .replace(
                    '../images/sort_both.png',
                    GM_getResourceURL('DataTablesSortBoth')
                )
        );
        addStyleString(css);

        // Footerbar
        const insertRef = document.getElementById('footer-legal');
        const separator = makeText(' | ');
        insertRef.insertBefore(separator, insertRef.firstChild);

        domSpamtracker = makeButton(
            'spamtracker: ' + (enabled ? 'on' : 'off'),
            [],
            () => {
                domGuiHolder.classList.remove('hidden');
                createDOMSelectionListForAllSites();
            },
            'a'
        );
        domSpamtracker.href = 'javascript:void(0)';
        insertRef.insertBefore(domSpamtracker, insertRef.firstChild);

        // Main gui
        const domClose = makeButton(
            'Close',
            'button spamtracker-header-btn-close',
            function() {
                domGuiHolder.classList.add('hidden');
            }
        );

        const domHeader = makeElement(
            'h2',
            'spamtracker-header',
            'Spamtracker'
        );
        domHeader.append(domClose);

        const domEnableDisable = makeButton(
            () => (!enabled ? 'Enable Spamtracker' : 'Disable Spamtracker'),
            'button spamtracker-header-btn',
            () => {
                enabled = !enabled;
                setConfigOption('enabled', enabled, false);
                domSpamtracker.textContent =
                    'spamtracker: ' + (enabled ? 'on' : 'off');
            }
        );
        const domDefaultSound = makeElement('span', '', ' | Default sound: ');
        domDefaultSound.append(makeSoundSelectBox());

        const domBtnBar = makeElement('div', 'spamtracker-header-btn-bar');
        domBtnBar.append(domEnableDisable);
        domBtnBar.append(domDefaultSound);

        domGui = makeElement('div', 'spamtracker-popup');
        domGui.append(domHeader);
        domGui.append(domBtnBar);

        domGuiHolder = makeElement('div', 'spamtracker-popup-bg hidden');
        domGuiHolder.append(domGui);

        document.body.append(domGuiHolder);
    };

    const addStyleString = function(str) {
        const node = makeElement('style');
        node.innerHTML = str;
        document.head.appendChild(node);
    };
    const addStyleUrl = function(str) {
        const node = makeElement('link');
        node.rel = 'stylesheet';
        node.href = str;
        document.head.appendChild(node);
    };

    /**
     * Restores the callback to the orginal function
     */
    const restoreCallback = function() {
        callback = msg => {
            if (window.fire && window.fire.openReportPopupForMessage) {
                window.focus();
                window.fire.openReportPopupForMessage(msg.elm);
            } else {
                window.open(msg.url);
            }
        };
    };

    /**
     * Useful for other scripts to interact with clicking on notifications
     */
    const setCallback = function(newCallback) {
        callback = newCallback;
    };

    /**
     * Plays the sound effect
     */
    const playSound = function({ site }) {
        if (useSound) {
            const siteSound = perSiteSounds[site];
            debug('Playing song ' + siteSound + ' for site ' + site);
            playSoundFile(siteSound);
        }
    };

    const playSoundFile = function(soundName) {
        const soundUrl =
            defaultSounds[soundName] ||
            userSounds[soundName] ||
            defaultSounds[defaultSound];
        if (!sound[soundUrl]) {
            warn(
                'Sound ' +
                    soundUrl +
                    ' was not ready when we needed it, coming from ' +
                    soundName
            );
            if (!prepareSound(soundUrl)) {
                return false;
            }
        }
        sound[soundUrl].play();
        return true;
    };

    /**
     * Creates a notification for a post
     */
    const notifyMe = function(msg) {
        if (!enabled) {
            return;
        }
        debug('Notify user about: ', msg);
        playSound(msg);
        const notification = new Notification(msg.title, {
            body: msg.message,
            icon: '//i.stack.imgur.com/WyV1l.png?s=128&g=1'
        });
        notification.onshow = () => {
            if (notification.closed) notification.close();
            msg.timeout = window.setTimeout(
                () => dismissNotification(msg.id),
                15000
            );
        };
        notification.onclick = () => {
            callback(msg);
            dismissNotification(msg.id);
        };
        notifications[msg.id] = notification;
        notificationsQueue.push(msg.id);

        if (notificationsQueue.length > maxNotifications) {
            dismissNotification(notificationsQueue.shift());
        }
    };

    /**
     * Close notification by id
     */
    const dismissNotification = function(id) {
        if (notifications[id]) {
            notifications[id].closed = true;
            notifications[id].close();
            delete notifications[id];
        }
    };

    /**
     * Progress a message in chat by element
     */
    const processChatMessage = function(message) {
        //console.log("Chat message!" + message.children[1].innerHTML);
        if (!message || !message.children[1]) {
            return false;
        }
        const smoke = /\/\/(goo.gl\/eLDYqh|Charcoal-SE\/SmokeDetector)/i;
        const sePostRegex = /\/\/[a-z]*.stackexchange.com|stackoverflow.com|superuser.com|serverfault.com|askubuntu.com|stackapps.com|mathoverflow.net/i;
        const content = message.children[1].innerHTML;
        const textContent = message.children[1].textContent;

        if (!smoke.test(content) || !sePostRegex.test(content)) {
            return false;
        }
        //console.log("Match!");
        const ch = message.children[1].children;
        const msg = {};
        msg.site = false;
        msg.qId = false;

        // Loop through all A tags, in search of a link to a stackexchange site, update information in `msg` with the last SE link
        for (var i = ch.length - 1; i >= 0; i--) {
            if (ch[i].tagName !== 'A') {
                continue;
            }
            const hash = ch[i].href.split('#');
            const path = ch[i].href.split('/');
            if (path[3] === 'questions' && hash.length > 1) {
                msg.site = path[2];
                msg.qId = hash[1];
            } else if (/^[qa]/.test(path[3])) {
                msg.site = path[2];
                msg.qId = path[4];
            }
        }
        if (!msg.site || !msg.qId) {
            return false;
        }
        const parts = textContent.indexOf(': ');
        if (parts < 0) {
            return false;
        }
        const prefixStart = textContent.indexOf('] ');
        msg.id = message.id;
        msg.reason = textContent.substring(prefixStart + 2, parts).split(', ');
        msg.title = '[ SmokeDetector ] \n' + msg.reason.join('\n');
        msg.message = textContent.substring(parts + 1);
        msg.url = '//' + msg.site + '/q/' + msg.qId;
        msg.elm = message;
        notifyMe(msg);
        return true;
    };

    const setDebugLevel = function(level) {
        debugLevel = level - 0;
        setConfigOption('debug', debugLevel, false);
    };

    /**
     * Register an observer on the .messages element
     */
    const registerMessageObserver = function(elm) {
        if (elm === lastMessageObserverTarget) {
            return;
        }

        lastMessageObserverTarget = elm;
        if (lastMessageObserver !== undefined) {
            lastMessageObserver.disconnect();
        }
        const children = elm.getElementsByClassName('message');
        if (children.length) {
            processChatMessage(children[children.length - 1]);
        }
        lastMessageObserver = new MutationObserver(() =>
            processChatMessage(children[children.length - 1])
        );
        lastMessageObserver.observe(elm, { childList: true });
    };

    /**
     * Register an observer on the .monolog.user-container.user-{*}  element
     */
    const registerMonologObserver = function(elm) {
        const children = elm.getElementsByClassName('messages');
        if (children.length) {
            registerMessageObserver(children[children.length - 1]);
        } else {
            const observer = new MutationObserver(() => {
                registerMessageObserver(children[children.length - 1]);
                observer.disconnect();
            });
            observer.observe(elm, { childList: true });
        }
    };

    /**
     * Register an observer on the #chat element
     */
    const registerObserver = function() {
        Notification.requestPermission();
        const children = target.getElementsByClassName('monologue');
        if (children.length) {
            registerMonologObserver(children[children.length - 1]);
        }
        const observer = new MutationObserver(() =>
            registerMonologObserver(children[children.length - 1])
        );
        observer.observe(target, { childList: true });
    };

    const sortByKey = function(array, key) {
        return array.sort((a, b) => {
            var x = a[key];
            var y = b[key];
            return x < y ? -1 : x > y ? 1 : 0;
        });
    };

    const getConfigOption = function(
        key,
        defaultValue,
        global = true,
        saveDefault = true
    ) {
        const storageKey = (!global ? sitename + '-' : '') + key;
        let value;
        if (GM_setValue && GM_getValue) {
            value = GM_getValue(storageKey);
        }
        if (value === undefined) {
            value = window.localStorage.getItem(
                metaData.name + '-' + storageKey
            );
        }
        const data = JSON.parse(value);
        if (data === null) {
            if (saveDefault) setConfigOption(key, defaultValue, global);
            return defaultValue;
        }
        return data;
    };

    const setConfigOption = function(key, value, global) {
        const storageKey = (!global ? sitename + '-' : '') + key;
        const data = JSON.stringify(value);
        if (GM_setValue && GM_getValue) {
            GM_setValue(storageKey, data);
        }
        window.localStorage.setItem(metaData.name + '-' + storageKey, data);
    };

    init();

    const self = {
        setCallback: setCallback,
        restoreCallback: restoreCallback,
        processChatMessage: processChatMessage,
        setDebugLevel: setDebugLevel
    };
    return self;
})(
    document.getElementById('chat'),
    document.getElementById('siterooms'),
    unsafeWindow
);
