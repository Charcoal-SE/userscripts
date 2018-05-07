// ==UserScript==
// @name         SIM - SmokeDetector Info for Moderators
// @namespace    https://charcoal-se.org/
// @version      0.0.1
// @description  Dig up information about how SmokeDetector handled a post.
// @author       ArtOfCode
// @match       *://*.stackexchange.com/*
// @match       *://*.stackoverflow.com/*
// @match       *://*.superuser.com/*
// @match       *://*.serverfault.com/*
// @match       *://*.askubuntu.com/*
// @match       *://*.stackapps.com/*
// @match       *://*.mathoverflow.net/*
// @exclude     *://chat.stackexchange.com/*
// @exclude     *://chat.meta.stackexchange.com/*
// @exclude     *://chat.stackoverflow.com/*
// @exclude     *://blog.stackoverflow.com/*
// @exclude     *://*.area51.stackexchange.com/*
// @grant        none
// @updateURL    https://github.com/Charcoal-SE/userscripts/raw/master/sim/sim.user.js
// @downloadURL  https://github.com/Charcoal-SE/userscripts/raw/master/sim/sim.user.js
// ==/UserScript==

(() => {
    const msAPIKey = '5a70b21ec1dd577d6ce36d129df3b0262b7cec2cd82478bbd8abdc532d709216';

    const addCSS = () => {
        const css = document.createElement('style');
        document.head.appendChild(css);
        css.sheet.insertRule(`.sim-popup {
          min-width: 50em;
          margin: 1em;
        }`, 0);
        css.sheet.insertRule(`.sim-popup > div:first-of-type {
          float: left;
          width: 45%;
          border-top: 1px solid #ddd;
          padding-top: 0.5em;
        }`, 0);
        css.sheet.insertRule(`.sim-popup > div:last-of-type {
          float: right;
          width: 45%;
          border-top: 1px solid #ddd;
          padding-top: 0.5em;
        }`, 0);
    };

    const getCurrentSiteAPIParam = () => {
        const regex = /((?:meta\.)?(?:(?:(?:math|stack)overflow|askubuntu|superuser|serverfault)|\w+)(?:\.meta)?)\.(?:stackexchange\.com|com|net)/g;
        const exceptions = {
            'meta.stackoverflow': 'meta.stackoverflow',
            'meta.superuser': 'meta.superuser',
            'meta.serverfault': 'meta.serverfault',
            'meta.askubuntu': 'meta.askubuntu',
            'mathoverflow': 'mathoverflow.net',
            'meta.mathoverflow': 'meta.mathoverflow.net',
            'meta.stackexchange': 'meta'
        };
        const match = regex.exec(location.hostname);
        if (match && exceptions[match[1]]) {
            return exceptions[match[1]];
        }
        else if (match) {
            return match[1];
        }
        else {
            return null;
        }
    };

    const attachToPosts = () => {
        $('.question, .answer').each((i, e) => {
            const id = $(e).data(`${$(e).hasClass('question') ? 'question' : 'answer'}id`);
            const apiParam = getCurrentSiteAPIParam();
            const msUri = `https://metasmoke.erwaysoftware.com/api/v2.0/posts/uid/${apiParam}/${id}?key=${msAPIKey}`;

            $(e).find('.post-menu').append(`<span class="lsep">|</span><a href="#" class="sim-get-info" data-request="${msUri}">smokey</a>`);
        });
    };

    const displayDialog = (postData) => {
        const container = $(`<div class="popup sim-popup"></div>`);
        container.append(`<h2>This post was <strong>${!postData.caught ? 'not ' : ''}caught</strong> by SmokeDetector</h2>`);
        if (postData.caught) {
            container.append(`<p>It was classified as <strong>${postData.feedback}</strong> by Charcoal volunteers.</p>`);

            const autoflags = $(`<div></div>`);
            autoflags.append(`<h2>Autoflags</h2>`);
            autoflags.append(`<p>This post was <strong>${!postData.autoflagged ? 'not ' : ''} autoflagged</strong>.</p>`);
            if (postData.autoflagged) {
                autoflags.append(`<p>Flags from the following users were used:</p>`);
                const users = $(`<ul></ul>`);
                postData.autoflaggers.forEach(af => {
                    users.append(`<li><a href="https://chat.stackexchange.com/users/${af.stackexchange_chat_id}">${af.username}</a></li>`);
                });
                autoflags.append(users);
            }
            container.append(autoflags);

            const manuals = $(`<div></div>`);
            manuals.append(`<h2>Manual Flags</h2>`);
            manuals.append(`<p>There were ${postData.manual_flags.length} additional flags cast manually on this post through Charcoal systems.</p>`);
            if (postData.manual_flags.length > 0) {
                manuals.append(`<p>The following users cast manual flags:</p>`);
                const users = $(`<ul></ul>`);
                postData.manual_flags.forEach(af => {
                    users.append(`<li><a href="https://chat.stackexchange.com/users/${af.stackexchange_chat_id}">${af.username}</a></li>`);
                });
                manuals.append(users);
            }
            container.append(manuals);
        }

        $('body').loadPopup({
            lightbox: false,
            target: $('body'),
            html: container.outerHTML()
        });
    };

    const getInfo = async ev => {
        ev.preventDefault();

        const $tgt = $(ev.target);
        $tgt.addSpinner();

        const uri = $tgt.data('request');
        const resp = await fetch(uri);
        const json = await resp.json();

        const postData = {};
        if (json && json.items && json.items.length >= 1) {
            postData.caught = true;
            postData.metasmokeURI = `https://metasmoke.erwaysoftware.com/post/${json.items[0].id}`;

            const flagsUri = `https://metasmoke.erwaysoftware.com/api/v2.0/posts/${json.items[0].id}/flags?key=${msAPIKey}`;
            const flagsResp = await fetch(flagsUri);
            const flagsJson = await flagsResp.json();

            postData.autoflagged = flagsJson.items[0].autoflagged.flagged;
            postData.autoflaggers = flagsJson.items[0].autoflagged.users;

            postData.manual_flags = flagsJson.items[0].manual_flags.users;

            const feedbacksUri = `https://metasmoke.erwaysoftware.com/api/v2.0/feedbacks/post/${json.items[0].id}?key=${msAPIKey}`;
            const feedbacksResp = await fetch(feedbacksUri);
            const feedbacksJson = await feedbacksResp.json();

            const feedbacks = feedbacksJson.items;
            const uniques = [...(new Set(feedbacks.map(f => f.feedback_type)))];
            let fbType;
            if (uniques.length === 1) {
                fbType = feedbacks[0].feedback_type;
            }
            else {
                fbType = 'Conflicted';
            }

            if (fbType.charAt(0) === 't') {
                fbType = 'True Positive (spam)';
            }
            else if (fbType.charAt(0) === 'f') {
                fbType = 'False Positive (not spam)';
            }
            else if (fbType.charAt(0) === 'n') {
                fbType = 'Not An Answer';
            }
            postData.feedback = fbType;
        }
        else {
            postData.caught = false;
        }

        $tgt.removeSpinner();
        displayDialog(postData);
    };

    $(document).ready(() => {
        addCSS();
        attachToPosts();
        $('.sim-get-info').on('click', getInfo);
    });
})();
