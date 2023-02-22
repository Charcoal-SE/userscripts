// ==UserScript==
// @name         SIM - SmokeDetector Info for Moderators
// @namespace    https://charcoal-se.org/
// @version      0.7.0
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
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
//
// @connect      chat.stackexchange.com
//
// @require      https://github.com/SO-Close-Vote-Reviewers/UserScripts/raw/master/gm4-polyfill.js
// @require      https://cdn.jsdelivr.net/gh/makyen/extension-and-userscript-utilities@94cbac04cb446d35dd025974a7575b25b9e134ca/executeInPage.js
//
// @updateURL    https://github.com/Charcoal-SE/userscripts/raw/master/sim/sim.user.js
// @downloadURL  https://github.com/Charcoal-SE/userscripts/raw/master/sim/sim.user.js
// ==/UserScript==

/* globals StackExchange, $, makyenUtilities, unsafeWindow, GM */ // eslint-disable-line no-redeclare

(() => {
  const msAPIKey = '5a70b21ec1dd577d6ce36d129df3b0262b7cec2cd82478bbd8abdc532d709216';
  const isNato = window.location.pathname === '/tools/new-answers-old-questions';

  // Copied from SOCVR's Request Generator by Makyen, the original author.
  // Message number, just a number used to start, which is not
  // guaranteed to be unique (i.e. it could have collisions with other
  // in-page/userscript uses).
  // This would probably be better as just straight CSS, rather than an Object.
  const executeInPage = makyenUtilities.executeInPage;
  var notifyInt = Date.now();
  const notifyCSS = {
    success: {
      'background-color': 'green',
    },
    info: {
      'background-color': '#0095ff',
    },
    error: {
      'background-color': 'red',
      'font-weight': 'bold',
    },
  };

  const notify = (message_, time_, notifyCss_) => {
    // Display a SE notification for a number of milliseconds (optional).
    time_ = (typeof time_ === 'number') ? time_ : 0;

    function inPageNotify(messageId, message, time, notifyCss) {
      // Function executed in the page context to use SE.notify to display the
      //   notification.
      if (typeof unsafeWindow !== 'undefined') {
        // Prevent this running when not in the page context.
        return;
      }
      var div = $('#notify-' + messageId);
      if (div.length) {
        // The notification already exists. Close it.
        StackExchange.notify.close(messageId);
      }
      $('#cvrq-notify-css-' + messageId).remove();
      if (typeof notifyCss === 'object' && notifyCss) {
        $(document.documentElement).append('<style id="#cvrq-notify-css-' + messageId + '" type="text/css">\n#notify-container #notify-' + messageId + ' {\n'
          + Object.keys(notifyCss).reduce((text, key) => (text + key + ':' + notifyCss[key] + ';\n'), '') + '\n}\n</style>');
      }
      StackExchange.ready(function () {
        function waitUtilVisible() {
          return new Promise(resolve => {
            function visibilityListener() {
              if (!document.hidden) {
                $(window).off('visibilitychange', visibilityListener);
                resolve();
              } // Else
            }
            $(window).on('visibilitychange', visibilityListener);
            visibilityListener();
          });
        }
        // If something goes wrong, fallback to alert().
        try {
          StackExchange.notify.show(message, messageId);
        } catch (_) {
          console.log('Notification:', message);
          alert('Notification: ' + message); // eslint-disable-line no-alert
        }
        if (time) {
          waitUtilVisible().then(() => {
            setTimeout(function () {
              StackExchange.notify.close(messageId);
              $('#cvrq-notify-css-' + messageId).remove();
              $('#cvrg-inPageNotify-' + messageId).remove();
            }, time);
          });
        } else {
          $('#cvrg-inPageNotify-' + messageId).remove();
        }
      });
    }
    executeInPage(inPageNotify, true, 'cvrg-inPageNotify-' + notifyInt, notifyInt++, message_, time_, notifyCss_);
    return notifyInt - 1;
  };

  /* The postMessageToCharcoalHQ function was largely copied from SOCVR's Request Generator, which is under an MIT license. */
  const postMessageToCharcoalHQ = (message, successNoticeText = "Mesage sent.", delayToRemoveSuccessNotice = 3000) => {
    return new Promise((resolve, reject) => {
      function handleError(errorMessage, error) {
        const seeConsole = '<br/>See the console for more details.';
        console.error(errorMessage, error);
        alert(`${errorMessage}\n\n${message}\n\n${seeConsole}`); // eslint-disable-line no-alert
        reject();
      }

      GM.xmlHttpRequest({
        method: 'GET',
        url: 'https://chat.stackexchange.com/rooms/11540/charcoal-hq',
        onload: function (response) {
          var matches = response.responseText.match(/hidden" value="([\dabcdef]{32})/);
          var fkey = matches ? matches[1] : '';
          if (!fkey) {
            handleError('responseText did not contain fkey. Is the room URL valid?', response);
          } // Else
          GM.xmlHttpRequest({
            method: 'POST',
            url: 'https://chat.stackexchange.com/chats/11540/messages/new',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: 'text=' + encodeURIComponent(message) + '&fkey=' + fkey,
            onload: function (newMessageResponse) {
              if (newMessageResponse.status === 200) {
                notify(successNoticeText, delayToRemoveSuccessNotice, notifyCSS.success);
                resolve();
              } else {
                const responseText = newMessageResponse.responseText;
                const shownResponseText = responseText.length < 100 ? ' ' + responseText : '';
                handleError('Failed sending chat message.' + shownResponseText, newMessageResponse);
              }
            },
            onerror: function (error) {
              handleError('Got an error when sending chat message.', error);
            },
          });
        },
        onerror: function (response) {
          handleError('Failed to retrieve fkey from chat. (Error Code: ' + response.status + ')', response);
        },
      });
    });
  };

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
    return $e.find('.js-post-menu:not(.preview-options) > .d-flex').map(function () {
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
    const posts = $('.question, .answer');
    /* Temporarily removed due to NATOEnhancements and this needing work
    if (posts.length === 0 && isNato) {
      $('body.tools-page #mainbar > table.default-view-post-table > tbody > tr').addClass('answer');
      posts = $('.question, .answer');
    }
    */
    posts.each((i, e) => {
      const $e = $(e);

      // Get the element which contains the menu
      const postMenu = getPostMenu($e);
      /* Temporarily removed due to NATOEnhancements and this needing work
      if (postMenu.length === 0 && isNato) {
        $e.find('> td:last-of-type').append($('<div class="post-menu simFakePostMenu"></div>'));
        postMenu = getPostMenu($e);
      }
      */
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
        const type = $e.hasClass('question') ? 'questions' : 'a';
        const apiParam = getCurrentSiteAPIParam();
        const msUri = `https://metasmoke.erwaysoftware.com/api/v2.0/posts/uid/${apiParam}/${id}?key=${msAPIKey}`;
        const $this = $(this);
        $this.append(`<div class="flex--item"><a href="https://metasmoke.erwaysoftware.com/posts/by-url?url=//${location.host}/${type}/${id}" class="sim-get-info" data-request="${msUri}">Smokey</button></div>`);
        /* Temporarily removed due to NATOEnhancements and this needing work
        if (isNato) {
          // Clean up if we are in NATO Enhancements
          $this.closest('body.tools-page #mainbar > table.default-view-post-table > tbody > tr.answer .question').closest('tr.answer').removeClass('answer');
        }
        */
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
    contentSpace.append(`<div class="d-flex"><div class="flex--item5 sim--left-content"></div><div class="flex--item7 sim--right-content"></div></div>`);

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
    } else if (postData.postIsDeleted) {
      // Post not caught, but is deleted
      contentSpace.append(`<p>Undelete this post to enable reporting it to SmokeDetector.</p>`);
    } else {
      // Post not caught, and is not deleted
      contentSpace.append(`
      <div class="s-prose sim-report-post-div">
        <h4>Report post<span style="font-weight: normal;font-size: 80%;"> (will post a <code>!!/report</code> message from you in <a href="https://chat.stackexchange.com/rooms/11540/charcoal-hq">Charcoal HQ</a>)</span>:</h4>
        <div class="sim-report-post-indented-div" style="padding-left:15px;">
          Reason (optional):<br/>
          <input type="text" class="sim-optional-report-reason" spellcheck="true" style="width:100%;"><br/>
          <button style="float:right;" class="sim-report-post-button">Report post</button>
        </div>
      </div>`)
        .find('.sim-report-post-button')
        .on('click', () => {
          let reason = contentSpace.find('.sim-optional-report-reason').val().trim();
          if (reason) {
            reason = reason.replace(/^"(.*)"$/, "$1").replaceAll('"', "'");
            reason = ` "${reason}"`;
          } else {
            reason = '';
          }
          const message = `!!/report ${postData.postUrl}${reason}`;
          contentSpace.find('.sim-report-post-button, .sim-optional-report-reason').disable();
          const successMessage = `Message sent. Please wait a few seconds for SmokeDetector to fetch the ${postData.postIsAnswer ? 'answer' : 'question'}'s data.`;
          postMessageToCharcoalHQ(message, successMessage, 5000).then(() => {
            contentSpace.find('.sim-report-post-indented-div').append(`<br/>${successMessage}`);
          });
        });
    }
    StackExchange.helpers.showModal(modal);
  };

  const getInfo = async ev => {
    if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) {
      return;
    }

    ev.preventDefault();

    const $tgt = $(ev.target);
    $tgt.addSpinner();
    const postId = getPostId($tgt);
    const post = $tgt.closest('.answer, .question');
    const postIsAnswer = post.is('.answer');
    const postIsDeleted = post.is('.deleted-answer');
    const postUrl = `${window.location.origin}/${postIsAnswer ? 'a' : 'q'}/${postId}`;

    const uri = $tgt.data('request');
    const resp = await fetch(uri);
    const json = await resp.json();

    const postData = {postId, postIsAnswer, postUrl, postIsDeleted};
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

  if (isNato) {
    const rows = $('body.tools-page #mainbar > table.default-view-post-table > tbody > tr');
    rows.each(function () {
      const $this = $(this);
      $this.addClass('answer');
      const answerId = $('.answer-hyperlink', $this).first().attr('href').replace(/^.*#(\d+)$/, '$1');
      $this.attr('data-answerid', answerId);
      const lastCellWithoutPostMenu = $this.children('td:last-of-type').filter(function () {
        return !$(this).find('.post-menu, .js-post-menu').length;
      });
      lastCellWithoutPostMenu
        .append($('<div class="js-post-menu pt2 simFakePostMenu"><div class="d-flex gs8 s-anchors s-anchors__muted fw-wrap"></div></div>')) // The .js-post-menu should be given a data-post-id attribute with the current post number.
        .find('.js-post-menu')
        .attr('data-post-id', answerId);
    });
  }
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
