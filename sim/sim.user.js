// ==UserScript==
// @name         SIM - SmokeDetector Info for Moderators
// @namespace    https://charcoal-se.org/
// @version      0.6.1
// @description  Dig up information about how SmokeDetector handled a post.
// @author       ArtOfCode
// @contributor  Makyen
//
// @match       *://*.stackexchange.com/*
// @match       *://*.stackoverflow.com/*
// @match       *://*.superuser.com/*
// @match       *://*.serverfault.com/*
// @match       *://*.askubuntu.com/*
// @match       *://*.stackapps.com/*
// @match       *://*.mathoverflow.net/*
//
// @exclude     *://stackexchange.com/*
// @exclude     *://api.*
// @exclude     *://blog.*
// @exclude     *://chat.*
// @exclude     *://data.*
// @exclude     *://*.area51.stackexchange.com*
// @exclude     *://stackoverflow.com/advertising*
// @exclude     *://stackoverflow.com/jobs*
// @exclude     *://stackoverflow.com/talent*
// @exclude     *://stackoverflow.com/teams*
// @exclude     *://stackoverflow.com/c/*
// @exclude     *://*/revisions/*
// @exclude     *://*/posts/*/revisions
// @exclude     */tour
//
// @grant        none
// @updateURL    https://github.com/Charcoal-SE/userscripts/raw/master/sim/sim.user.js
// @downloadURL  https://github.com/Charcoal-SE/userscripts/raw/master/sim/sim.user.js
// ==/UserScript==

/* globals StackExchange, $ */

(() => {
  const msAPIKey = '5a70b21ec1dd577d6ce36d129df3b0262b7cec2cd82478bbd8abdc532d709216';
  const isNato = window.location.pathname === '/tools/new-answers-old-questions';

  const getCurrentSiteAPIParam = () => {
    const regex = /((?:(?:es|ja|pt|ru)\.)?(?:meta\.)?(?:(?:(?:math|stack)overflow|askubuntu|superuser|serverfault)|\w+)(?:\.meta)?)\.(?:stackexchange\.com|com|net)/g;
    const exceptions = {
      'meta.stackoverflow': 'meta.stackoverflow',
      'meta.superuser': 'meta.superuser',
      'meta.serverfault': 'meta.serverfault',
      'meta.askubuntu': 'meta.askubuntu',
      mathoverflow: 'mathoverflow.net',
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

    return null;
  };

  const getPostMenu = $e => {
    return $e.find('.post-menu:not(.preview-options)').map(function () {
      // SE has used a .post-menu-container within the .post-menu. It was there for a while and then removed.
      //   It's not clear if it will come back. This is just playing it safe in case SE puts it back in.
      const container = $(this).children('.post-menu-container');
      if (container.length > 0) {
        return container;
      }
      return this;
    });
  };

  const getPostId = e => {
    const $e = $(e);
    let post = $e;
    if (!post.is('.question, .answer')) {
      post = $e.closest('.answer, .question');
    }
    let id = post.data('questionid') || post.data('answerid');
    if (!id) {
      // If we are passed a .post-menu, then get the child that is the js-share-link, as it's definitely associated with the post.
      let link = $e.children('.js-share-link');
      if (link.length === 0) {
        link = post.find('.answer-hyperlink, .question-hyperlink');
      }
      if (link.length === 0) {
        link = $e.find('.js-share-link');
      }
      if (link.length === 0) {
        return null;
      }
      const href = link.attr('href');
      const endNumberMatch = href.match(/#(\d+)$/);
      if (endNumberMatch) {
        id = endNumberMatch[1];
      } else {
        const firstNumberMatch = href.match(/(\d+)/);
        id = firstNumberMatch && firstNumberMatch[1];
      }
    }
    return id;
  };

  const attachToPosts = () => {
    let posts = $('.question, .answer');
    if (posts.length === 0 && isNato) {
      $('body.tools-page #mainbar > table.default-view-post-table > tbody > tr').addClass('answer');
      posts = $('.question, .answer');
    }
    posts.each((i, e) => {
      const $e = $(e);

      // Get the element which contains the menu
      let postMenu = getPostMenu($e);
      if (postMenu.length === 0 && isNato) {
        $e.find('> td:last-of-type').append($('<div class="post-menu simFakePostMenu"></div>'));
        postMenu = getPostMenu($e);
      }
      postMenu.filter(function () {
        // Don't re-add the smokey button if it's already there.
        return !$(this).find('.sim-get-info').length;
      // Add the smokey button to the remaining post menus.
      }).each(function () {
        // We construct the msUri in here, because there are some cases where there can be a .question within a .question.
        const id = getPostId(this);
        if (!id) {
          return;
        }
        const apiParam = getCurrentSiteAPIParam();
        const msUri = `https://metasmoke.erwaysoftware.com/api/v2.0/posts/uid/${apiParam}/${id}?key=${msAPIKey}`;
        const $this = $(this);
        $this.append(`<span class="lsep">|</span><a href="#" class="sim-get-info" data-request="${msUri}">smokey</a>`);
        if (isNato) {
          // Clean up if we are in NATO Enhancements
          $this.closest('body.tools-page #mainbar > table.default-view-post-table > tbody > tr.answer .question').closest('tr.answer').removeClass('answer');
        }
      });
    });
  };

  const stacksModal = $(`
    <aside class="js-modal-overlay js-modal-close" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="s-modal--dialog js-modal-dialog w80 wmx8" role="document">
        <h2 class="s-modal--header sim--modal-header"></h2>
        <div class="s-modal--body sim--modal-content"></div>
        <a class="s-modal--close s-btn s-btn__muted js-modal-close" href="#" aria-label="Close">&times;</a>
      </div>
    </aside>`);

  const displayDialog = postData => {
    const modal = stacksModal.clone();
    const contentSpace = modal.find('.sim--modal-content');
    contentSpace.append(`<div class="grid grid__fl1"><div class="grid--cell5 sim--left-content"></div><div class="grid--cell7 sim--right-content"></div></div>`);

    const header = modal.find('.sim--modal-header');
    header.text(postData.caught ? postData.feedback : 'Not Caught');

    if (postData.caught) {
      contentSpace.prepend(`<p><a class="s-link" href="${postData.metasmokeURI}">View this post on metasmoke</a></p>`);

      const autoflags = contentSpace.find('.sim--left-content');
      autoflags.append(`<h3>Autoflags</h3>`);
      autoflags.append(`<p>This post was <strong>${postData.autoflagged ? '' : 'not '} autoflagged</strong>.</p>`);
      if (postData.autoflagged) {
        autoflags.append(`<p>Flags from the following users were used:</p>`);
        const users = $(`<ul></ul>`);
        postData.autoflaggers.forEach(af => {
          users.append(`<li><a class="s-link" href="https://chat.stackexchange.com/users/${af.stackexchange_chat_id}">${af.username}</a></li>`);
        });
        autoflags.append(users);
      }

      const manuals = contentSpace.find('.sim--right-content');
      manuals.append(`<h3>Manual Flags</h3>`);
      manuals.append(`<p>There were ${postData.manual_flags.length} additional flags cast manually on this post through Charcoal systems.</p>`);
      if (postData.manual_flags.length > 0) {
        manuals.append(`<p>The following users cast manual flags:</p>`);
        const users = $(`<ul></ul>`);
        postData.manual_flags.forEach(af => {
          users.append(`<li><a class="s-link" href="https://chat.stackexchange.com/users/${af.stackexchange_chat_id}">${af.username}</a></li>`);
        });
        manuals.append(users);
      }
    }

    StackExchange.helpers.showModal(modal);
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
      const uniques = [...(new Set(feedbacks.map(f => f.feedback_type.charAt(0))))];
      let fbType;
      if (uniques.length === 0) {
        fbType = 'No Feedback';
      }
      else if (uniques.length === 1) {
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

  attachToPosts();
  $(document).ready(() => {
    attachToPosts();
    $(document)
      .on('click', '.sim-get-info', getInfo)
      // Most, but not all, cases where the button needs to be re-added happen after an AJAX call.
      .ajaxComplete(() => {
        attachToPosts();
        // Some AJAX fetches need a delayed call.
        setTimeout(attachToPosts, 55);
      });
    // There are some corner cases where adding the button needs to be done after SE is ready.
    StackExchange.ready(() => {
      attachToPosts();
      // Some pages (e.g. NATO) just take a long time to be ready.
      setTimeout(attachToPosts, 5000);
    });
  });
})();
