// ==UserScript==
// @name         SIM - SmokeDetector Info for Moderators
// @namespace    https://charcoal-se.org/
// @version      0.8.0
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
// @require      https://cdn.jsdelivr.net/gh/joewalnes/reconnecting-websocket@5c66a7b0e436815c25b79c5579c6be16a6fd76d2/reconnecting-websocket.js
//
// @updateURL    https://github.com/Charcoal-SE/userscripts/raw/master/sim/sim.user.js
// @downloadURL  https://github.com/Charcoal-SE/userscripts/raw/master/sim/sim.user.js
// ==/UserScript==

/* globals StackExchange, $, jQuery, makyenUtilities, unsafeWindow, GM, ReconnectingWebSocket */ // eslint-disable-line no-redeclare

(() => {
  function getSeApiSiteParamFromDomain(hostname) {
    /*
     * This works for all sites when using the main domain for the site. It doesn't work for all the aliases for the sites.
     * Handling URLs which use site aliases is not needed here, as we're getting URLs from a live page, which will already have been
     * redirected to the main domain.
     * See https://api.stackexchange.com/docs/sites#pagesize=1000&filter=!-*khQZ0uAf1l&run=true
     * and run: JSON.parse($('.result').text()).items.forEach(({site_url, api_site_parameter}) => {const calcParam = new URL(site_url).hostname.split('.com')[0].replace(/\.stackexchange/g, ''); if (calcParam !== api_site_parameter) {console.log('calcParam:', calcParam, ':: api param:', api_site_parameter, ':: url:', site_url)}});
     */
    if (/askubuntu\.com|mathoverflow\.net|serverfault\.com|stackapps\.com|stackexchange\.com|stackoverflow\.com|superuser\.com/i.test(hostname)) {
      return hostname
        .split('.com')[0]
        .replace(/\.stackexchange/g, '');
    } // Else
    return null;
  }

  /* The function getSeApiSiteParamAndPostIdOrRevisionIdFromUrl was copied from the OpenAI Detector
   * (https://github.com/Glorfindel83/SE-Userscripts/blob/master/openai-detector/openai-detector.user.js)
   * by the original author of that part of the code, Makyen. */
  function getSeApiSiteParamAndPostIdOrRevisionIdFromUrl(url, getRevision = false) {
    /*
     *  URLs containing post IDs:
     *    https://stackoverflow.com/questions/1/where-oh-where-did-the-joel-data-go
     *      1 is probably a question, but could be an answer
     *    https://stackoverflow.com/q/1/3773011
     *      1 is probably a question, but could be an answer
     *    https://stackoverflow.com/a/3/3773011
     *      3 is probably an answer, but could be a question
     *    https://stackoverflow.com/questions/1/where-oh-where-did-the-joel-data-go/3#3
     *      Want 3, as it's the most specific. Likely an answer, but could be a question.
     *    https://stackoverflow.com/posts/70051410/edit/0af09605-ecb7-455c-9624-7139983ee35a
     *      Could be either a question or answer
     *    https://stackoverflow.com/posts/70051410/redact/0af09605-ecb7-455c-9624-7139983ee35a
     *      Could be either a question or answer
     *    https://stackoverflow.com/posts/1/timeline?filter=WithVoteSummaries
     *      Could be either a question or answer
     *    https://stackoverflow.com/posts/1/edit
     *      Could be either a question or answer
     *    and several others
     *
     *  URLs containing revision IDs:
     *    https://stackoverflow.com/revisions/0af09605-ecb7-455c-9624-7139983ee35a/view-source
     *    https://stackoverflow.com/posts/70051410/edit/0af09605-ecb7-455c-9624-7139983ee35a
     *    https://stackoverflow.com/posts/70051410/redact/0af09605-ecb7-455c-9624-7139983ee35a
     */
    const urlObj = new URL(url, window.location.href);
    const [, postType, postQuestionAnswerOrRevisionId, linkTypeOrTitle, altRevisionId] = urlObj.pathname.split('/');
    let returnId = null;
    if ((getRevision && /^(?:[\da-z]+-){4}[\da-z]+$/.test(postQuestionAnswerOrRevisionId) && linkTypeOrTitle === 'view-source')) {
      returnId = postQuestionAnswerOrRevisionId;
    } else if ((getRevision && /^(?:[\da-z]+-){4}[\da-z]+$/.test(altRevisionId) && (linkTypeOrTitle === 'edit' || linkTypeOrTitle === 'redact'))) {
      returnId = altRevisionId;
    } else if (!getRevision && /^\d+$/.test(postQuestionAnswerOrRevisionId)) {
      let postId = null;
      if (['posts', 'q', 'questions', 'a'].includes(postType)) {
        const answerId = (urlObj.hash.match(/^#(\d+)$/) || [null, null])[1];
        if (['q', 'questions'].includes(postType) && answerId) {
          // Using a hash to indicate the answer at the end of either a /posts/<id>/<something> URL or an /a/ URL isn't valid.
          postId = answerId;
        } else {
          postId = postQuestionAnswerOrRevisionId;
        }
      } // Else
      returnId = postId;
    } // Else
    if (returnId) {
      const seApiSiteParam = getSeApiSiteParamFromDomain(urlObj.hostname);
      if (seApiSiteParam) {
        return [seApiSiteParam, returnId];
      } // Else
    } // Else
    return [null, null];
  }

  /* The code for posting delete/undelete/spam/R/A/etc. actions is an evolving set which Makyen
   * is using in multiple scripts, which will be put into an external "require" file, but is here
   * for now. */
  function numbersAreNotPositive() {
    return [...arguments].every(num => {
      const type = typeof num;
      return !((type === "number" || type === 'string') ? Number(num) > 0 : false);
    });
  }

  function getFkey() {
    /* This should probably try to get the SE Object fkey value and global fkey from the page context,
     * rather than only using those if we're already in the page context.. */
    let globalFkey = typeof fkey === 'string' ? fkey : null; // eslint-disable-line no-undef
    if (typeof fkey === 'function') { // eslint-disable-line no-undef
      const fromFKeyFunction = fkey(); // eslint-disable-line no-undef
      if (typeof fromFKeyFunction === 'string') {
        globalFkey = fromFKeyFunction;
      }
      if (typeof fromFKeyFunction === 'object' && typeof fromFKeyFunction.fkey === 'string') {
        // In some cases, there's an fkey() function which returns an Object with an fkey key.
        globalFkey = fromFKeyFunction.fkey;
      }
    }
    const seOptionsFkey = typeof StackExchange === 'object' && typeof StackExchange.options === 'object' && typeof StackExchange.options.user === 'object' ? StackExchange.options.user.fkey : null;
    return globalFkey || seOptionsFkey || document.querySelector('input[name="fkey"]').value;
  }

  function postToUrlWithFkey(url, data = {}, thisFkey = null) {
    data.fkey = data.fkey || thisFkey || getFkey();
    return new Promise((resolve, reject) => {
      $.post({
        url,
        data,
      })
        .done(resolve)
        .fail(reject);
    });
  }

  // Delete individual post
  function deletePost(pid, thisFkey) {
    return numbersAreNotPositive(pid) ? Promise.reject() : postToUrlWithFkey(`/posts/${pid}/vote/10`, {}, thisFkey);
  }

  // Undelete individual post
  function undeletePost(pid, thisFkey) {
    return numbersAreNotPositive(pid) ? Promise.reject() : postToUrlWithFkey(`/posts/${pid}/vote/11`, {}, thisFkey);
  }

  // Spam flag individual post
  function spamFlagPost(pid, thisFkey) {
    return numbersAreNotPositive(pid) ? Promise.reject() : postToUrlWithFkey(`/flags/posts/${pid}/add/PostSpam`, {
      otherText: null,
      overrideWarning: true,
    }, thisFkey);
  }

  // R/A flag individual post
  function rudeFlagPost(pid, thisFkey) {
    return numbersAreNotPositive(pid) ? Promise.reject() : postToUrlWithFkey(`/flags/posts/${pid}/add/PostOffensive`, {
      otherText: null,
      overrideWarning: true,
    }, thisFkey);
  }

  // Unlock individual post
  function unlockPost(pid, thisFkey) {
    return numbersAreNotPositive(pid) ? Promise.reject() : postToUrlWithFkey(`/admin/posts/${pid}/unlock`, {'mod-actions': 'unlock'}, thisFkey);
  }

  const msAPIKey = '5a70b21ec1dd577d6ce36d129df3b0262b7cec2cd82478bbd8abdc532d709216';
  const isNato = window.location.pathname === '/tools/new-answers-old-questions';
  const webSocketPostCreationCallbacks = {};
  const reportedPosts = new Set();
  const reportedPostsInMs = new Set();

  /* The notify code is copied from SOCVR's Request Generator by Makyen, the original author.
   * Message number, is just a number used to start, which is not guaranteed to be unique
   * (i.e. it could have collisions with other in-page/userscript uses).
   * This would probably be better as just straight CSS, rather than an Object. */
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
                notify(successNoticeText, delayToRemoveSuccessNotice, notifyCSS.info);
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

  const addSpinnerToModalHeader = () => {
    const header = $('.sim--modal-header');
    if (header.find('.s-spinner').length === 0) {
      header.append('<div class="s-spinner d-inline-block" role="alert" aria-busy="true" style="vertical-align: middle; margin-left: 5px; height: 1em; width: 1em;"></div>');
    }
  };

  const removeSimSpinners = () => {
    $('.sim--modal-header').closest('.js-modal-dialog').find('.s-spinner').remove();
  };

  const disableAllSimModalButtons = () => {
    $('.sim--modal-header').closest('.js-modal-dialog').find('button').disable();
  };

  const closeModal = () => {
    $('.js-modal-close').click();
  };

  const getPostForPostId = postId => {
    return $(`.question[data-questionid="${postId}"],.answer[data-answerid="${postId}"]`);
  };

  const clickSmokeyButtonForPostOrPostId = postOrPostId => {
    const post = postOrPostId instanceof jQuery ? postOrPostId : getPostForPostId(postOrPostId);
    post.find('.sim-get-info').click();
  };

  const reloadPostAndClickSmokeyButton = outerPostId => {
    function inPageReloadPostAndClickSmokeyButton(postId) {
      StackExchange.ready(() => {
        StackExchange.realtime.reloadPosts([postId])
          .then(() => {
            setTimeout(() => {
              const post = $(`.question[data-questionid="${postId}"],.answer[data-answerid="${postId}"]`);
              post.prev('.realtime-post-deleted-notification').remove();
              post[0].style.opacity = null;
              post.find('.sim-get-info').click();
            }, 100);
          });
      });
    }
    executeInPage(inPageReloadPostAndClickSmokeyButton, false, `sim-reload-and-click-${outerPostId}`, outerPostId);
  };

  let msWebSocket = null;

  const getWebSocketPostCreationCallbackKey = (siteParam, postId) => {
    return `${siteParam}/${postId}`;
  };

  // The initial part of the WebSocket code was copied from AIM, which is under an MIT license. It has been modified.
  const setupMSWebSocket = function () {
    if (msWebSocket) {
      // Don't set up the WebSocket more tha once.
      return;
    }
    msWebSocket = new ReconnectingWebSocket("wss://metasmoke.erwaysoftware.com/cable");
    msWebSocket.addEventListener('message', event => {
      // Parse event data
      const jsonData = JSON.parse(event.data);
      switch (jsonData.type) {
        case "confirm_subscription":
        case "ping": // Pings are every 3 seconds.
        case "welcome":
        case "statistic":
          break;
        default: {
          const message = jsonData.message;
          if (typeof jsonData.type === 'undefined' && message.event_class === 'Post' && message.event_type === 'create') {
            const postObj = message.object;
            const [siteParam, postId] = getSeApiSiteParamAndPostIdOrRevisionIdFromUrl(postObj.link);
            webSocketPostCreationCallbacks?.[getWebSocketPostCreationCallbackKey(siteParam, postId)]?.callback(postObj);
          }
        }
      }
    });
    msWebSocket.addEventListener('open', () => {
      // Send authentication
      msWebSocket.send(JSON.stringify({
        identifier: JSON.stringify({
          channel: "ApiChannel",
          key: '5a70b21ec1dd577d6ce36d129df3b0262b7cec2cd82478bbd8abdc532d709216',
          events: 'posts#create',
        }),
        command: "subscribe"
      }));
    });
  };

  const watchForMSPostForPostUrl = function (url, callback) {
    const [siteParam, postId] = getSeApiSiteParamAndPostIdOrRevisionIdFromUrl(url);
    addWebSocketPostCreationCallbackAndSetupWebSocket(siteParam, postId, callback);
  };

  const stopWatchingForMSPostForPostUrl = function (url) {
    const [siteParam, postId] = getSeApiSiteParamAndPostIdOrRevisionIdFromUrl(url);
    removeWebSocketPostCreationCallbackAndCloseWebSocketIfNoCallbacks(siteParam, postId);
  };

  const addWebSocketPostCreationCallbackAndSetupWebSocket = function (siteParam, postId, callback) {
    webSocketPostCreationCallbacks[getWebSocketPostCreationCallbackKey(siteParam, postId)] = {callback};
    setupMSWebSocket();
  };

  const removeWebSocketPostCreationCallbackAndCloseWebSocketIfNoCallbacks = function (siteParam, postId) {
    delete webSocketPostCreationCallbacks[getWebSocketPostCreationCallbackKey(siteParam, postId)];
    if (Object.keys(webSocketPostCreationCallbacks).length === 0) {
      closeMSWebSocket();
    }
  };

  const closeMSWebSocket = function () {
    if (msWebSocket) {
      msWebSocket.close();
    }
    msWebSocket = null;
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
        const msUri = `https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls/?key=${msAPIKey}&filter=&urls=//${window.location.hostname}/${type}/${id}`;
        const $this = $(this);
        $this.append(`<div class="flex--item"><a href="https://metasmoke.erwaysoftware.com/posts/by-url?url=//${location.host}/${type}/${id}" class="sim-get-info" data-request="${msUri}">Smokey</a></div>`);
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

  const reportPostAndIndicateProgress = (contentSpace, postData) => {
    return new Promise((resolve, reject) => {
      let reason = contentSpace.find('.sim-optional-report-reason').val().trim();
      if (reason) {
        reason = reason.replace(/^"(.*)"$/, "$1").replaceAll('"', "'");
        reason = ` "${reason}"`;
      } else {
        reason = '';
      }
      const message = `!!/report ${postData.postUrl}${reason}`;
      const postTypeText = postData.postIsAnswer ? 'answer' : 'question';
      watchForMSPostForPostUrl(postData.postUrl, () => {
        reportedPostsInMs.add(postData.postId);
        stopWatchingForMSPostForPostUrl(postData.postUrl);
        const msHasReportMessage = `MS has received the report for this ${postTypeText}.`;
        contentSpace.find('.sim-waiting-for-MS-report-creation .s-spinner').remove();
        const indentedDiv = contentSpace.find('.sim-report-post-indented-div');
        indentedDiv.append(`<br/><b>${msHasReportMessage}</b>`);
        notify(msHasReportMessage, 20000, notifyCSS.success);
        // This delay is because SD doesn't detect the deletion of the post if we immediately re-delete.
        // It would be better to modify SD to be faster about watching for deletion, but, for now, we add
        // 3 seconds of delay here.
        indentedDiv.append(`<br/>Delaying for a few seconds to let SmokeDetector be able to detect the deletion.`);
        setTimeout(() => {
          indentedDiv.append(`<br/><b>ALL DONE!</b>`);
          resolve();
        }, 3000);
      });
      contentSpace.find('.sim-report-post-button, .sim-optional-report-reason').disable();
      const successMessage = `Message sent. Please wait a few seconds for SmokeDetector to fetch the ${postTypeText}'s data.`;
      postMessageToCharcoalHQ(message, successMessage, 5000).then(() => {
        reportedPosts.add(postData.postId);
        contentSpace
          .find('.sim-report-post-indented-div')
          .append(`<br/>${successMessage}`)
          .append(`<div class="sim-waiting-for-MS-report-creation" title="This is a longer wait then necessary, but it's the first thing we will be able to detect that indicates it's definitely done.">Waiting for the report to be sent to MS.<div class="s-spinner d-inline-block" role="alert" aria-busy="true" style="vertical-align: middle; margin-left: 5px; height: 1.6em; width: 1.6em;"></div></div>`);
      }, reject);
    });
  };

  const displayDialog = postData => {
    function alertError(postId) {
      alert(`There was an error. Please check the state of post ID: ${postId} at ${window.location.origin}/q/${postId}, which may be a question or answer. The browser console may have more information.`); // eslint-disable-line no-alert
    }

    function createButton(text, className, reloadPostAfter, onClick) {
      return $(`<button style="float:right;clear:both;margin-top:5px;" class="${className}">${text}</button>`)
        .on('click', () => {
          disableAllSimModalButtons();
          addSpinnerToModalHeader();
          onClick()
            .then(removeSimSpinners)
            .then(() => {
              if (reloadPostAfter) {
                setTimeout(() => {
                  closeModal();
                  reloadPostAndClickSmokeyButton(postData.postId);
                }, reloadPostAfter);
              } else {
                closeModal();
                clickSmokeyButtonForPostOrPostId(postData.postId);
              }
            })
            .catch(error => {
              let foundAnError = false; // We want to log all the included Errors
              if (!(error instanceof Error)) {
                // We do both a console.log() and a console.error() in case the argument is something other than an Error.
                // In some browsers, it's easier to see what that data is when using consol.log() rather than console.error().
                console.log('Button Promise .catch() argument:', error);
                if (typeof error === 'object' && error !== null) {
                  // We do want to iterate over each value here, but we also want to know if an Error was found.
                  Object.values(error).forEach(value => {
                    if (value instanceof Error) {
                      console.error(new Error('Operation requested by button click failed', {cause: value}));
                      foundAnError = true;
                    }
                  });
                }
              }
              if (!foundAnError) {
                console.error(new Error('Operation requested by button click failed', {cause: error}));
              }
              alertError(postData.postId);
              removeSimSpinners();
            });
        });
    }

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
    } else {
      // Post not caught
      const isModerator = $('.s-topbar .js-mod-inbox-button').length > 0;
      let heading = 'Report post';
      let buttons = $();
      const reportPostButton = createButton('Report post', 'sim-report-post-button', false, () => reportPostAndIndicateProgress(contentSpace, postData));
      if (postData.postIsDeleted) {
        const post = $(`.question[data-questionid="${postData.postId}"],.answer[data-answerid="${postData.postId}"]`);
        if ($(document.body).is('.question-page') && post.is('.answer') && post.closest('#mainbar').children('.question').is('.deleted-answer')) {
          contentSpace.append(`<p>In order to report this answer to SmokeDetector, both the question and this answer would first need to be undeleted.</p>`);
        } else {
          contentSpace.append(`<p>In order to report this to SmokeDetector, it would first need to be undeleted.</p>`);
          if (isModerator) {
            heading = 'Undelete, and Report post (optionally unlock and re-delete)';
            buttons = buttons.add(createButton('Unlock, undelete, report post, and re-delete as spam', 'sim-unlock-undelete-report-post-spam-button', 200, () => unlockPost(postData.postId)
              .then(() => undeletePost(postData.postId))
              .then(() => reportPostAndIndicateProgress(contentSpace, postData))
              .then(() => spamFlagPost(postData.postId))));
            buttons = buttons.add(createButton('Unlock, undelete, report post, and re-delete as R/A', 'sim-unlock-undelete-report-post-rude-button', 200, () => unlockPost(postData.postId)
              .then(() => undeletePost(postData.postId))
              .then(() => reportPostAndIndicateProgress(contentSpace, postData))
              .then(() => rudeFlagPost(postData.postId))));
            buttons = buttons.add(createButton('Undelete, report post, and re-delete', 'sim-undelete-report-post-delete-button', 200, () => undeletePost(postData.postId)
              .then(() => reportPostAndIndicateProgress(contentSpace, postData))
              .then(() => deletePost(postData.postId))));
            buttons = buttons.add(createButton('Undelete and report post', 'sim-undelete-report-post-button', 200, () => undeletePost(postData.postId)
              .then(() => reportPostAndIndicateProgress(contentSpace, postData))));
          }
        }
      } else {
        buttons = buttons.add(reportPostButton);
      }
      if (!postData.postIsDeleted || isModerator) {
        const indentedDiv = contentSpace.append(`
      <div class="s-prose sim-report-post-div">
          <h4>${heading}:</br><span style="font-weight: normal;font-size: 80%;"> (will post a <code>!!/report</code> message from you in <a href="https://chat.stackexchange.com/rooms/11540/charcoal-hq">Charcoal HQ</a>)</span></h4>
        <div class="sim-report-post-indented-div" style="padding-left:15px;">
          Reason (optional):<br/>
          <input type="text" class="sim-optional-report-reason" spellcheck="true" style="width:100%;"><br/>
        </div>
      </div>`)
          .find('.sim-report-post-indented-div');
        buttons.each(function () {
          indentedDiv
            .append(this);
        });
        indentedDiv
          .append('<br style="clear:both"/>');
      }
    }
    if (reportedPostsInMs.has(postData.postId)) {
      contentSpace.prepend('<p class="sim--you-reported"><b>You reported this post to SmokeDetector.</b> The new record in metasmoke is:</p>');
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
    let abort = false;

    const logError = error => {
      console.log('error:', error);
      console.error(error);
      alert('An error occured getting data from metasmoke. The console may have more information.'); // eslint-disable-line no-alert
      $tgt.removeSpinner();
      abort = true;
    };

    const json = await fetch(uri).then(response => {
      if (!response.ok) {
        throw response;
      }
      return response.json();
    }).catch(logError);
    if (abort) {
      return;
    }

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
    if (!StackExchange || typeof StackExchange.ready !== 'function') {
      // If the StackExchange Object doesn't exist or StackExchange.ready isn't a function, then this is a page we shouldn't be running on.
      console.error('SIM is running on a page which does\'t have the StackExchange Object, or StackExchange.ready isn\'t a function. It doesn\'t work on such pages.');
      return;
    }
    attachToPosts();
    $(document)
      .on('click', '.sim-get-info', getInfo)
      // Most, but not all, cases where the button needs to be re-added happen after an AJAX call.
      .ajaxComplete(() => {
        attachToPosts();
        // Some AJAX fetches need a delayed call.
        setTimeout(attachToPosts, 55);
        // This is a substitute for actually detecting when reloadPosts is complete, which uses a 150ms animation.
        setTimeout(attachToPosts, 175);
      });
    // There are some corner cases where adding the button needs to be done after SE is ready.
    StackExchange.ready(() => {
      attachToPosts();
      // Some pages (e.g. NATO) just take a long time to be ready.
      setTimeout(attachToPosts, 5000);
    });
  });
})();
