// ==UserScript==
// @name        🔥 FIRE: Feedback Instantly, Rapidly, Effortlessly
// @namespace   https://github.com/Charcoal-SE/
// @description FIRE adds a button to SmokeDetector reports that allows you to provide feedback & flag, all from chat.
// @author      Cerbrus
// @contributor Makyen
// @attribution Michiel Dommerholt (https://github.com/Cerbrus)
// @version     1.3.0
// @icon        https://raw.githubusercontent.com/Ranks/emojione-assets/master/png/32/1f525.png
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.meta.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.stackexchange.com/transcript/*
// @match       *://chat.meta.stackexchange.com/transcript/*
// @match       *://chat.stackoverflow.com/transcript/*
// @match       *://chat.stackexchange.com/users/120914/*
// @match       *://chat.stackexchange.com/users/120914?*
// @match       *://chat.stackoverflow.com/users/3735529/*
// @match       *://chat.stackoverflow.com/users/3735529?*
// @match       *://chat.meta.stackexchange.com/users/266345/*
// @match       *://chat.meta.stackexchange.com/users/266345?*
// @match       *://chat.stackexchange.com/users/478536/*
// @match       *://chat.stackexchange.com/users/478536?*
// @match       *://chat.stackoverflow.com/users/14262788/*
// @match       *://chat.stackoverflow.com/users/14262788?*
// @match       *://chat.meta.stackexchange.com/users/848503/*
// @match       *://chat.meta.stackexchange.com/users/848503?*
// @include     /^https?://chat\.stackexchange\.com/(?:rooms/|search.*[?&]room=)(?:11|27|95|201|388|468|511|2165|3877|8089|11540|22462|24938|34620|35068|38932|46061|47869|56223|58631|59281|61165|65945|84778|96491|106445|109836|109841)(?:[&/].*$|$)/
// @include     /^https?://chat\.meta\.stackexchange\.com/(?:rooms/|search.*[?&]room=)(?:89|1037|1181)(?:[&/].*$|$)/
// @include     /^https?://chat\.stackoverflow\.com/(?:rooms/|search.*[?&]room=)(?:41570|90230|111347|126195|167826|170175|202954)(?:[&/].*$|$)/
// @require     https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js
// @require     https://cdn.jsdelivr.net/gh/joewalnes/reconnecting-websocket@5c66a7b0e436815c25b79c5579c6be16a6fd76d2/reconnecting-websocket.js
// @grant       none
// ==/UserScript==
/* globals CHAT, GM_info, toastr, $, jQuery, ReconnectingWebSocket, autoflagging */ // eslint-disable-line no-redeclare
/* eslint "curly": ["error", "multi-or-nest", "consistent"] */
/* eslint-disable no-multi-spaces */

/**
 * anonymous function - IIFE to prevent accidental pollution of the global scope..
 */
(() => {
  'use strict';
  let fire;

  /**
   * anonymous function - Initialize FIRE.
   *
   * @param {object} scope The scope to register FIRE on. Usually, `window`.
   */
  (scope => { // Init
    const hOP = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);

    const smokeDetectorId = { // This is Smokey's user ID for each supported domain
      'chat.stackexchange.com': 120914,
      'chat.stackoverflow.com': 3735529,
      'chat.meta.stackexchange.com': 266345
    }[location.host];       // From which, we need the current host's ID

    const metasmokeId = { // Same as above, but for the metasmoke account
      'chat.stackexchange.com': 478536,
      'chat.stackoverflow.com': 14262788,
      'chat.meta.stackexchange.com': 848503
    }[location.host];

    const constants = getFireConstants();

    /**
     * FIRE's global object.
     *
     * @global
     * @module fire
     */
    fire = {
      /**
       * The userscript's metadata
       *
       * @public
       * @memberof module:fire
       */
      metaData: GM_info.script || GM_info['Feedback Instantly, Rapidly, Effortlessly'],
      /**
       * The userscript's API URLs and keys
       *
       * @public
       * @memberof module:fire
       */
      api: {
        ms: {
          key: '55c3b1f85a2db5922700c36b49583ce1a047aabc4cf5f06ba5ba5eff217faca6', // This script's metasmoke API key
          url: 'https://metasmoke.erwaysoftware.com/api/v2.0/',
          urlV1: 'https://metasmoke.erwaysoftware.com/api/'
        },
        se: {
          key: 'NDllMffmzoX8A6RPHEPVXQ((', // This script's Stack Exchange API key
          url: 'https://api.stackexchange.com/2.2/',
          clientId: 9136
        }
      },
      constants,
      smokeDetectorId,
      metasmokeId,
      SDMessageSelector: `.user-${smokeDetectorId} .message, .user-${metasmokeId} .message `,
      openOnSiteCodes: keyCodesToArray(['7', 'o', numpad('7', constants)]),
      openOnMSCodes: keyCodesToArray(['8', 'm', numpad('8', constants)]),
      buttonKeyCodes: [],
      webSocket: null,
      reportCache: {},
      openReportPopupForMessage,
      decorateMessage
    };

    /**
     * Add fire to the global scope, but don't override it if it already exists.
     */
    if (!hOP(scope, 'fire'))
      scope.fire = fire;
    scope.fireNoConflict = fire;

    /**
     * Default settings to use in `localStorage`.
     */
    const defaultLocalStorage = {
      blur: true,
      flag: true,
      debug: false,
      hideImages: true,
      toastrPosition: 'top-right',
      toastrDuration: 2500,
      readOnly: false,
      version: fire.metaData.version
    };

    registerLoggingFunctions();
    hasEmojiSupport();
    initLocalStorage(hOP, defaultLocalStorage);
    getCurrentChatUser();
    loadStackExchangeSites();
    injectExternalScripts();
    showFireOnExistingMessages();
    registerAnchorHover();
    registerOpenLastReportKey();
    if (CHAT && CHAT.addEventHandlerHook)
      CHAT.addEventHandlerHook(chatListener);

    checkHashForWriteToken();
  })(window);

  /**
   * requestStackExchangeToken - Request a Stack Exchange Write token for this app.
   *
   * @private
   * @memberof module:fire
   */
  function requestStackExchangeToken() {
    const url = `https://stackexchange.com/oauth/dialog?client_id=${fire.api.se.clientId}&scope=${encodeURIComponent('no_expiry')}&redirect_uri=${encodeURIComponent(location.href)}`;

    // Register the focus event to check if the write token was successfully obtained
    $(window).on('focus', checkWriteTokenSuccess);

    window.open(url);
  }

  /**
   * checkHashForWriteToken - Check the url hash to see if a write token has been obtained. If so, parse it.
   *
   * @private
   * @memberof module:fire
   */
  function checkHashForWriteToken() {
    if (location.hash && location.hash.length > 0) {
      const result = location.hash.match(/#+access_token=(.+)/);
      if (result) {
        setValue('stackexchangeWriteToken', result[1]);
        window.close();
      }
      // Clear hash
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }

  /**
   * checkWriteTokenSuccess - Check if the write token was successfully obtained.
   *
   * @private
   * @memberof module:fire
   */
  function checkWriteTokenSuccess() {
    if (fire.userData.stackexchangeWriteToken) {
      toastr.success('Successfully obtained Stack Exchange write token!');
      $('.fire-popup .fire-request-write-token').remove();
      $(window).off('focus', checkWriteTokenSuccess);
    }
  }

  /**
   * getDataForUrl - Loads metasmoke data for a specified post url.
   *
   * @private
   * @memberof module:fire
   *
   * @param {string}               reportedUrl The url that's been reported.
   * @param {singleReportCallback} callback    An action to perform after the report is loaded.
   */
  function getDataForUrl(reportedUrl, callback) {
    const {ms} = fire.api;
    const url = `${ms.url}posts/urls?key=${ms.key}&filter=HFHNHJFMGNKNFFFIGGOJLNNOFGNMILLJ&page=1&urls=${reportedUrl}`;
    $.get(url)
      .done(data => {
        if (data && data.items) {
          if (data.items.length <= 0) {
            toastr.info(`No metasmoke reports found for url:<br />${reportedUrl}`);
            return;
          }
          const feedbacksUrl = `${ms.url}feedbacks/post/${data.items[0].id}?key=${ms.key}&filter=HNKJJKGNHOHLNOKINNGOOIHJNLHLOJOHIOFFLJIJJHLNNF&page=1`;
          $.get(feedbacksUrl).done(feedbacks => {
            data.items[0].feedbacks = feedbacks.items;
            callback(data.items[0]);
          });
        }
      })
      .fail(
        () => toastr.error(
          'This report could not be loaded.',
          null,
          {preventDuplicates: true}
        )
      );
  }

  /**
   * listHasCurrentUser - Checks if the list of users on this flag report contains the current user.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {object} flags A report's (auto-)flags, where it's `users` array has to be checked.
   * @returns {boolean}      `true` if the current user is found in the flag list.
   */
  function listHasCurrentUser(flags) {
    return flags && Array.isArray(flags.users) &&
      fire.chatUser && flags.users.some(({username}) => username === fire.chatUser.name);
  }

  /**
   * loadDataForReport - Loads a report's data when you hover over the FIRE button.
   *
   * @private
   * @memberof module:fire
   *
   * @param {boolean} openAfterLoad Open the report popup after load?
   */
  function loadDataForReport(openAfterLoad) {
    const $this = $(this);
    const url = $this.data('url');

    if (!fire.reportCache[url])
      getDataForUrl(url, data => parseDataForReport(data, openAfterLoad, $this));
    else if (openAfterLoad === true)
      $this.click();
  }

  /**
   * updateReportCache - Loads all MS data on the page.
   *
   * @private
   * @memberof module:fire
   */
  function updateReportCache() { // eslint-disable-line no-unused-vars
    const urls = $('.fire-button')
      .map((index, element) => $(element).data('url'))
      .toArray()
      .filter(url => !fire.reportCache[url]) // Only get un-cached reports
      .join(',');

    const {ms} = fire.api;
    const url = `${ms.url}posts/urls?key=${ms.key}&filter=HFHNHJFMGNKNFFFIGGOJLNNOFGNMILLJ&page=1&urls=${urls}`;
    $.get(url, response => {
      fire.log('Report cache updated:', response);
      if (response && response.items) {
        if (response.items.length <= 0)
          toastr.info('No metasmoke reports found.');
        const itemsById = {};
        for (const item of response.items)
          itemsById[item.id] = item;
        // May need to handle the possibility that there will be multiple pages
        const feedbacksUrl = `${ms.url}feedbacks/post/${Object.keys(itemsById).join(',')}?key=${ms.key}&filter=HNKJJKGNHOHLNOKINNGOOIHJNLHLOJOHIOFFLJIJJHLNNF`;
        $.get(feedbacksUrl).done(feedbacks => {
          // Add the feedbacks to each main item.
          for (const feedback of feedbacks.items)
            itemsById[feedback.id] = feedback;
          for (const item of response.items)
            parseDataForReport(item, false, null, true);
        });
      }
    });
  }

  /**
   * parseDataForReport - Parse a report's loaded data.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object}  data          A metasmoke report
   * @param {boolean} openAfterLoad Open the report popup after load?
   * @param {object}  $this         The clicked FIRE report button
   * @param {boolean} skipLoadPost  skip loading additional data for the post?
   */
  function parseDataForReport(data, openAfterLoad, $this, skipLoadPost) {
    data.is_answer = data.link.includes('/a/');
    data.site = parseSiteUrl(data.link);
    data.is_deleted = data.deleted_at !== null;
    data.message_id = Number.parseInt($this.closest('.message')[0].id.split('-')[1], 10);

    data.has_auto_flagged = listHasCurrentUser(data.autoflagged) && data.autoflagged.flagged;
    data.has_manual_flagged = listHasCurrentUser(data.manual_flags);
    data.has_flagged = data.has_auto_flagged || data.has_manual_flagged;

    if (Array.isArray(data.feedbacks)) { // Has feedback
      data.has_sent_feedback = data.feedbacks.some( // Feedback has been sent already
        ({user_name}) => user_name === fire.chatUser.name
      );
    } else {
      data.has_sent_feedback = false;
    }

    const match = data.link.match(/.*\/(\d+)/);
    if (match && match[1])
      [, data.post_id] = match;

    fire.reportCache[data.link] = data; // Store the data

    fire.log('Loaded report data', data);

    if (!skipLoadPost)
      loadPost(data);

    if (openAfterLoad === true)
      $this.click();
  }

  /**
   * parseSiteUrl - Parse a site url into a api parameter.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {string} url A report's Stack Exchange link
   * @returns {string}     The Stack Exchange API name for the report's site.
   */
  function parseSiteUrl(url) {
    return url.split(/\.com|\.net/)[0]
      .replace(/\.stackexchange|(https?:)?\/+/g, '');
  }

  /**
   * loadStackExchangeSites - Loads a list of all Stack Exchange Sites.
   *
   * @private
   * @memberof module:fire
   */
  function loadStackExchangeSites() {
    const now = new Date().valueOf();
    const hasUpdated = fire.metaData.version === fire.userData.version;
    let {sites} = fire;

    // If there are no sites or the site data is over 7 days
    if (hasUpdated || !sites || sites.storedAt < now - fire.constants.siteDataCacheTime) {
      sites = {}; // Clear the site data
      delete localStorage['fire-sites'];
      delete localStorage['fire-user-sites'];
    }

    if (!sites.storedAt) { // If the site data is empty
      const parameters = {
        filter: '!Fn4IB7S7Yq2UJF5Bh48LrjSpTc',
        pagesize: 10000
      };

      getSE(
        'sites',
        parameters,
        ({items}) => {
          for (const item of items)
            sites[item.api_site_parameter] = item;

          sites.storedAt = now; // Set the storage timestamp
          fire.sites = sites;   // Store the site list

          loadCurrentSEUser();

          fire.log('Loaded Stack Exchange sites');
        });
    }
  }

  /**
   * loadPost - Loads additional information for a post, from the Stack exchange API.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} report The metasmoke report.
   */
  function loadPost(report) {
    const parameters = {site: report.site};

    getSE(
      `posts/${report.post_id}`,
      parameters,
      response => {
        if (response.items && response.items.length > 0) {
          report.se = report.se || {};
          [report.se.post] = response.items;
          showReputation(report.se.post.owner.reputation);
          loadPostFlagStatus(report);
          loadPostRevisions(report);
        } else {
          report.is_deleted = true;
          $('.fire-reported-post').addClass('fire-deleted');

          if (typeof autoflagging !== 'undefined')
            $(`#message-${report.message_id} .content`).addClass('ai-deleted');

          if (report.has_sent_feedback)
            $('a.fire-feedback-button:not([disabled])').attr('disabled', true);
        }

        fire.log('Loaded a post', response);
      });
  }

  /**
   * loadPostRevisions - Loads a post's revision history from the Stack Exchange API.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} report The metasmoke report.
   */
  function loadPostRevisions(report) {
    const parameters = {site: report.site};

    getSE(
      `posts/${report.post_id}/revisions`,
      parameters,
      response => {
        if (response && response.items) {
          report.se.revisions = response.items;
          report.revision_count = response.items.length;

          if (report.revision_count > 1)
            showEditedIcon();

          fire.log('Loaded a post\'s revision status', response);
        }
      });
  }

  /**
   * showEditedIcon - Render a "Edited" icon on a opened report popup.
   *
   * @private
   * @memberof module:fire
   */
  function showEditedIcon() {
    const title = $('.fire-post-title');
    if (!title.data('has-edit-icon')) {
      title
        .prepend(
          emojiOrImage('pencil')
            .attr('fire-tooltip', 'This post has been edited.')
            .after(' ')
        )
        .data('has-edit-icon', true);
    }
  }

  /**
   * showReputation - Shows a user's reputation in the report.
   *
   * @private
   * @memberof module:fire
   *
   * @param {number} reputation The user's reputation.
   */
  function showReputation(reputation) {
    const rep = $('.fire-user-reputation');

    rep.text(` (${reputation}) `);

    if (reputation !== 1)
      rep.addClass('fire-has-rep');
  }

  /**
   * loadPostFlagStatus - Loads a post's flagging status from the Stack Exchange API.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} report The metasmoke report.
   */
  function loadPostFlagStatus(report) {
    const parameters = {
      site: report.site,
      filter: '!-.Lt3GZC8aYs',
      auth: true
    };

    const type = report.is_answer ? 'answers' : 'questions';

    getSE(
      `${type}/${report.post_id}/flags/options`,
      parameters,
      response => {
        report.se.available_flags = response.items;
        report.has_flagged = response.items && response.items.some(
          ({has_flagged, title}) => has_flagged && title === 'spam'
        );

        fire.log('Loaded a post\'s flag status', response);
      });
  }

  /**
   * loadPostFlagStatus - Loads the current Stack Exchange user and what sites they're registered at from the Stack Exchange API.
   *
   * @private
   * @memberof module:fire
   *
   * @param {number} [page=1] the page to load.
   */
  function loadCurrentSEUser(page = 1) {
    const parameters = {
      page,
      pagesize: 100,
      filter: '!-rT(axL(',
      auth: true
    };

    getSE(
      'me/associated',
      parameters,
      response => parseUserResponse(response, page)
    );
  }

  /**
   * parseUserResponse - Parse the user response.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} response the Stack Exchange `user` response.
   * @param {number} page     The page that's been loaded.
   */
  function parseUserResponse(response, page) {
    fire.log(`Loaded the current user, page ${page}:`, response);
    if (page === 1)
      fire.userSites = [];

    fire.userSites = fire.userSites.concat(response.items);

    if (response.has_more) {
      loadCurrentSEUser(page + 1);
    } else {
      const accounts = fire.userSites;
      const {sites} = fire;

      accounts.forEach(site => {
        site.apiName = parseSiteUrl(site.site_url);

        if (sites[site.apiName])
          sites[site.apiName].account = site;
      });

      fire.userSites = accounts;
      fire.sites = sites;
      fire.log('Loaded all sites for the current user:', fire.userSites);
    }
  }

  /**
   * getSE - `GET` call on the Stack Exchange API.
   *
   * @private
   * @memberof module:fire
   *
   * @param {string}   method     The Stack Exchange api method.
   * @param {object}   parameters The parameters to be passed to the Stack Exchange api.
   * @param {function} success    The `success` callback.
   * @param {function} error      The `error` callback.
   * @param {function} always     The `always` callback.
   */
  function getSE(method, parameters, success, error, always) {
    stackExchangeAjaxCall(method, parameters, {
      call: $.get,
      success,
      error,
      always
    });
  }

  /**
   * getSE - `POST` call on the Stack Exchange API.
   *
   * @private
   * @memberof module:fire
   *
   * @param  {string}   method     The Stack Exchange api method.
   * @param  {object}   parameters The parameters to be passed to the Stack Exchange api.
   * @param  {function} success    The `success` callback.
   * @param  {function} error      The `error` callback.
   * @param  {function} always     The `always` callback.
   */
  /*
  function postSE(method, parameters, success, error, always) {
   stackExchangeAjaxCall(method, parameters, {
     call: $.post
     success,
     error,
     always
   });
  }
  */

  /**
   * stackExchangeAjaxCall - Perform an AJAX call on the Stack Exchange API.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {string}   method         The Stack Exchange api method.
   * @param   {object}   parameters     The parameters to be passed to the Stack Exchange api.
   * @param   {object}   config         The AJAX call configuration object, containing:
   * @param   {function} config.call    The jQuery AJAX call to use.
   * @param   {function} config.success The `success` callback.
   * @param   {function} config.error   The `error` callback.
   * @param   {function} config.always  The `always` callback.
   * @returns {jqXHR}                   The jqXHR Promise.
   */
  function stackExchangeAjaxCall(method, parameters, {call, success, error, always}) {
    const {se} = fire.api;
    const type = call === $.get ? 'get' : 'post';

    parameters = parameters || {};

    parameters.key = se.key;

    if (fire.userData.stackexchangeWriteToken) {
      parameters.access_token = fire.userData.stackexchangeWriteToken;
      delete parameters.auth;
    } else if (parameters.auth) {
      fire.warn(`Auth is required for this API call, but was not available.\n"${type}": ${method}`);
      return null;
    }

    const ajaxCall = call(se.url + method, parameters);

    if (success)
      ajaxCall.done(success);

    if (error)
      ajaxCall.fail(error);
    else
      ajaxCall.fail(jqXHR => fire.error('Error performing this AJAX call!', jqXHR));

    if (always)
      ajaxCall.always(always);

    return ajaxCall;
  }

  /**
   * getWriteToken - Gets a metasmoke write token.
   *
   * @private
   * @memberof module:fire
   *
   * @param  {function} [callback] A optional function to run after the write token was obtained.
   */
  function getWriteToken(callback) {
    setValue('readOnly', false);
    const afterGetToken = callback;

    writeTokenPopup(metaSmokeCode => {
      if (metaSmokeCode && metaSmokeCode.length === fire.constants.metaSmokeCodeLength) {
        $.ajax({
          url: `https://metasmoke.erwaysoftware.com/oauth/token?key=${fire.api.ms.key}&code=${metaSmokeCode}`,
          method: 'GET'
        })
          .done(({token}) => {
            setValue('metasmokeWriteToken', token);
            toastr.success('Successfully obtained metasmoke write token!');
            closePopup();

            if (afterGetToken)
              afterGetToken();
          })
          .error(({status}) => {
            if (status === fire.constants.http.notFound)
              toastr.error('Metasmoke could not find a write token - did you authorize the app?');
            else
              toastr.error('An unknown error occurred during OAuth with metasmoke.');
          });
      } else {
        setValue('readOnly', true);
        toastr.info('FIRE is now in read-only mode.');
        closePopup();

        if (afterGetToken)
          afterGetToken();
      }
    });
  }

  /**
   * chatListener - Chat message event listener.
   * If SmokeDetector reports another post, decorate the message.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} message            The received message, containing:
   * @param {number} message.event_type The message type
   * @param {number} message.user_id    The message's userID
   * @param {number} message.message_id The message ID
   */
  function chatListener({event_type, user_id, message_id}) {
    if (event_type === 1 && (user_id === fire.smokeDetectorId || user_id === fire.metasmokeId)) {
      setTimeout(() => {
        const message = $(`#message-${message_id}`);
        decorateMessage(message);
      });
    }
  }

  /**
   * decorateMessage - Adds the "FIRE" button to the passed message.
   *
   * @public
   * @memberof module:fire
   *
   * @param {object} message The message DOM node the button should be added to.
   */
  function decorateMessage(message) {
    const m = $(message);
    if (m.find('.fire-button').length === 0) {
      const anchors = m.find('.content a');

      let reportLink = filterOnContents(anchors, 'MS');
      let urlOnReportLink = true;

      if (reportLink.length === 0) {
        reportLink = filterOnContents(anchors, 'SmokeDetector');
        urlOnReportLink = false;
      }

      if (reportLink.length > 0) { // This is a report
        let reportedUrl;
        let isReportedUrlValid = false;

        if (urlOnReportLink) {
          reportedUrl = reportLink[0].href.split('url=')[1]; // eslint-disable-line prefer-destructuring
          isReportedUrlValid = Boolean(reportedUrl);
        }
        if ((!urlOnReportLink || !isReportedUrlValid) && reportLink.nextAll('a')[0]) {
          reportedUrl = reportLink.nextAll('a')[0].href.replace(/https?:/, '');
          isReportedUrlValid = !(reportedUrl.startsWith('//github.com') ||
            reportedUrl.includes('erwaysoftware.com') || // Don't show FIRE button on feedback.
            reportedUrl.includes('/users/') ||
            reportedUrl.includes('charcoal-se.org'));
        }

        if (!isReportedUrlValid)
          return;

        const fireButton = newEl('span', 'fire-button', {
          html: emojiOrImage('fire'),
          click: openReportPopup
        })
          .data('url', reportedUrl);

        reportLink
          .after(fireButton)
          .after(' | ');
      }
    }
  }

  /**
   * filterOnContents - Filter a jQuery list on the element text.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {object} $object A jQuery list of DOM elements
   * @param   {string} text    The text the element should contain.
   * @returns {object}         The filtered list
   */
  function filterOnContents($object, text) {
    return $object.filter((i, element) => $(element).text() === text);
  }

  /**
   * toastrPositionChangeHandler - Set the toastr position class.
   *
   * @private
   * @memberof module:fire
   */
  function toastrPositionChangeHandler() {
    const value = $(this).val();

    const data = fire.userData;
    data.toastrPosition = value;
    toastr.options.positionClass = `toast-${value}`;

    $('#toast-container').remove();
    toastr.info('Notification position updated.');
    fire.userData = data;
  }

  /**
   * toastrDurationHandler - Update the toastr popup duration.
   *
   * @private
   * @memberof module:fire
   */
  function toastrDurationHandler() {
    const value = $(this).val();

    const data = fire.userData;
    data.toastrDuration = value;
    toastr.options.timeOut = value;

    $('#toast-container').remove();
    fire.userData = data;
  }

  /**
   * blurOptionClickHandler - Set the "Blur" option for the popup modal.
   *
   * @private
   * @memberof module:fire
   */
  function blurOptionClickHandler() {
    boolOptionClickHandler(this, 'Blur', 'blur', () => {
      $('#container').toggleClass('fire-blur', fire.userData.blur);
    });
  }

  /**
   * flagOptionClickHandler - Set the "Flag" option for "tpu-" feedback.
   *
   * @private
   * @memberof module:fire
   */
  function flagOptionClickHandler() {
    boolOptionClickHandler(this, 'Flagging on "tpu-" feedback', 'flag');
  }

  /**
   * debugOptionClickHandler - Set the "Debug" option to show logs in the dev console.
   *
   * @private
   * @memberof module:fire
   */
  function debugOptionClickHandler() {
    boolOptionClickHandler(this, 'Debug mode', 'debug');
  }

  /**
   * imageOptionClickHandler - Set the "HideImages" option to hide or show images in reports.
   *
   * @private
   * @memberof module:fire
   */
  function imageOptionClickHandler() {
    boolOptionClickHandler(this, 'Hiding images on reports', 'hideImages');
  }

  /**
   * boolOptionClickHandler - Set a boolean option after a setting checkbox was clicked.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object}   element    The `input[type=checkbox]`` DOM node that was clicked.
   * @param {string}   message    The message to show.
   * @param {string}   key        The setting key to save.
   * @param {function} [callback] A optional callback.
   */
  function boolOptionClickHandler(element, message, key, callback) {
    const value = $(element).is(':checked');

    const data = fire.userData;
    data[key] = value;
    toastr.info(`${message} ${value ? 'en' : 'dis'}abled.`);
    fire.userData = data;

    if (callback)
      callback();
  }

  /**
   * stopPropagationIfTargetBody - If the target of the event is the body, then stop propagation.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} event     An event
   */
  function stopPropagationIfTargetBody(event) {
    if (event.target === document.body)
      event.stopPropagation();
  }

  /**
   * keyboardShortcuts - Handle keypress events for the popup.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} event the jQuery keyboard event
   */
  function keyboardShortcuts(event) {
    const c = fire.constants;
    if (event.altKey || event.ctrlKey || event.metaKey)
      // Do nothing if any of the Alt, Ctrl, or Meta keys are pressed (opening the popup with Ctrl-Space is handled elsewhere).
      // This prevents conflicts with browser-based shortcuts (e.g. Ctrl-F being used as FP).
      return;
    if (event.keyCode === c.keys.enter || event.keyCode === c.keys.space) {
      event.preventDefault();

      const selector = '.fire-popup-header a.button.focus';
      $(selector)
        .fadeOut(c.buttonFade)           // Flash to indicate which button was selected.
        .fadeIn(c.buttonFade, () => $(selector).click());
    } else {
      if (!fire.settingsAreOpen && event.keyCode < c.keys.F1) // Allow interaction with settings popup.
        event.preventDefault(); // Prevent keys from entering the chat input while the popup is open
      if (fire.buttonKeyCodes.includes(event.keyCode) && !fire.settingsAreOpen) {
        $('.fire-popup-header a.button')
          .removeClass('focus')
          .trigger('mouseleave');

        const $button = $(`.fire-popup-header a[fire-key~=${event.keyCode}]:not([disabled])`);
        const button = $button[0]; // eslint-disable-line prefer-destructuring

        if (button) {
          if (event.keyCode === c.keys.esc) { // [Esc] key
            $button.click();
          } else if (fire.openOnSiteCodes.includes(event.keyCode) || fire.openOnMSCodes.includes(event.keyCode)) { // Open the report on the site
            window.open(button.href);
          } else {                // [1-5] keys for feedback buttons
            const pos = button.getBoundingClientRect();
            $button
              .addClass('focus')
              .trigger('mouseenter')
              .trigger($.Event('mousemove', { // eslint-disable-line new-cap
                clientX: pos.right - (button.offsetWidth + c.tooltipOffset),
                clientY: pos.top + c.tooltipOffset
              }));
          }
        } else {
          const $button = $(`a[fire-key~=${event.keyCode}]:not([disabled])`);
          if ($button[0])
            $button.click();
        }
      } else if (fire.settingsAreOpen && event.keyCode === c.keys.esc) {
        closePopup();
      }
    }
  }

  /**
   * openReportPopupForMessage - Opens a report popup for a specific message.
   *
   * @public
   * @memberof module:fire
   *
   * @param {object} message The message DOM node the report should be opened for.
   */
  function openReportPopupForMessage(message) {
    loadDataForReport.call(
      $(message).find('.fire-button'),
      true
    );
  }

  /**
   * Click handlers for the settings window.
   *
   * @private
   * @memberof module:fire
   */
  const clickHandlers = {
    /**
     * Open the "Request authorization" metasmoke page.
     *
     * @private
     */
    requestToken: () => {
      window.open(`https://metasmoke.erwaysoftware.com/oauth/request?key=${fire.api.ms.key}`, '_blank');
    },
    /**
     * Request a token from the metasmoke code.
     *
     * @private
     *
     * @param {object} input      The input DOM node that contains the code.
     * @param {function} callback The callback that receives the metasmoke code.
     */
    saveToken: (input, callback) => {
      const value = input.val();
      if (value && value.length === fire.constants.metaSmokeCodeLength)
        callback(value);

      closePopup();
    },
    /**
     * Close all popup windows and open the "Request write token" popup.
     *
     * @private
     */
    disableReadonly: () => {
      closePopup();
      closePopup();
      getWriteToken();
    }
  };

  /**
   * writeTokenPopup - Open a popup to enter the write token.
   *
   * @private
   * @memberof module:fire
   *
   * @param {function} callback The action to perform after getting a write token / choosing read-only mode.
   */
  function writeTokenPopup(callback) {
    const input = newEl('input', 'fire-popup-input', {
      type: 'text',
      maxlength: '8',
      placeholder: 'Enter code here'
    });

    newEl('div', 'fire-popup-modal')
      .appendTo('body')
      .click(closePopup);

    newEl('div', 'fire-popup')
      .css({top: '5%', left: getPopupLeft()})
      .append(
        newEl('div', 'fire-popup-header')
          .append(newEl('p', {
            html: 'FIRE requires a metasmoke write token to submit feedback.<br />' +
                  'This requires that your metasmoke account has the "Reviewer" role. <br />' +
                  'Once you\'ve authenticated FIRE with metasmoke, you\'ll be given a code.<br />'
          }))
          .append(button('Request Token', clickHandlers.requestToken))
          .append(input)
          .append(button('Save', () => clickHandlers.saveToken(input, callback)))
          .append(br())
          .append(br())
          .append(newEl('p', {
            html: 'Alternatively, if you\'re not a "Reviewer", you can run FIRE in read-only mode by disabling feedback.<br />' +
                  'You will still be able to view reports.'
          }))
          .append(button('Disable feedback', callback))
      )
      .hide()
      .appendTo('body')
      .fadeIn('fast');

    $('#container').toggleClass('fire-blur', fire.userData.blur);

    $(document).keydown(keyboardShortcuts);
  }

  /**
   * toHTMLEntitiesBetweenTags - Convert HTML tags to  &lt;tag text&gt; that are within the start and end of a specified tag.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {string}            toChange                The complete text to make changes within.
   * @param   {string}            tagText                 The type of tag within which to make changes (e.g. "code")
   * @param   {RegExp}            whiteListedTagsRegex    Falsey or a RegExp that is used to match tags which should be whitelisted inside the changed area.
   *
   * @returns {string}                                    The changed text
   */
  function toHTMLEntitiesBetweenTags(toChange, tagText, whiteListedTagsRegex) {
    let codeLevel = 0;
    const tagRegex = new RegExp(`(</?${tagText}>)`, 'g');
    const tagSplit = (toChange || '').split(tagRegex);
    const tagBegin = `<${tagText}>`;
    const tagEnd = `</${tagText}>`;
    return tagSplit.reduce((text, split) => {
      if (split === tagBegin) {
        codeLevel++;
        if (codeLevel === 1) return text + split;
      } else if (split === tagEnd) {
        codeLevel--;
      }
      if (codeLevel > 0) {
        split = split.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (whiteListedTagsRegex) {
          whiteListedTagsRegex.lastIndex = 0;
          split = split.replace(whiteListedTagsRegex, '<$1>');
        }
      }
      return text + split;
    }, '');
  }

  // Many of the attributes permitted here are not permitted in Markdown for SE, but are delivered by SE in the HTML for the post body.
  //   SE adds the additional attributes.
  // For <a>, 'rel' is not permitted in Markdown, but is in SE's HTML.
  const whitelistedTags = {
    withAttributes: {
      blockquote: ['class'], // 'data-spoiler'], // data-spoiler is used on SE sites, but isn't in the HTML delevered by SE.
      div: ['class', 'data-lang', 'data-hide', 'data-console', 'data-babel'],
      ol: ['start'],
      pre: ['class'],
      span: ['class', 'dir'],
    },
    specialCases: {
      a: {
        general: ['title', 'rel', 'alt'],
        specificValues: {
          class: ['post-tag'], // example post with tags: https://chat.stackexchange.com/transcript/11540?m=54674140#54674140
          // rel probably has a limited set of values, but that really hasn't been explored, yet.
          // rel: ['tag'], // example post with tags: https://chat.stackexchange.com/transcript/11540?m=54674140#54674140
        },
        // href must be relative, protocol-relative, http, or https.
        // For <a>, SE only permits a limited subset of "href" values, so we can be more specific on these.
        regexText: {href: '(?:https?:)?//?[^" ]*'},
      },
      img: {
        ordered: ['src', 'width', 'height', 'alt', 'title'],
        isOptionallySelfClosing: true,
      },
      table: {specificValues: {class: ['s-table']}}, // example post with table: https://chat.stackoverflow.com/transcript/41570?m=51575339#51575339
      td: {specificValues: {style: ['text-align: right;', 'text-align: left;', 'text-align: center;']}}, // example post with td: https://chat.stackoverflow.com/transcript/41570?m=51575339#51575339
      th: {specificValues: {style: ['text-align: right;', 'text-align: left;', 'text-align: center;']}}, // example post with th: https://chat.stackoverflow.com/transcript/41570?m=51575339#51575339
    },
    optionallySelfClosingTagsWithNoAttributes: {
      br: [],
      hr: [],
    },
    withNoAttributes: {
      b: [],
      code: [],
      dd: [],
      del: [],
      dl: [],
      dt: [],
      em: [],
      h1: [],
      h2: [],
      h3: [],
      i: [],
      kbd: [],
      li: [],
      p: [],
      s: [],
      strike: [],
      strong: [],
      sub: [],
      sup: [],
      tbody: [],
      thead: [],
      tr: [],
      ul: [],
    },
  };
  const whitelistedAttributesByTagType = Object.assign({},
    whitelistedTags.optionallySelfClosingTagsWithNoAttributes,
    whitelistedTags.withNoAttributes,
    whitelistedTags.withAttributes,
    whitelistedTags.specialCases);

  /*
    sortJqueryByDepth is modified from an answer to "jQuery traversing order - depth first" : https://stackoverflow.com/a/5756066
    Copytight 2011-04-22 16:27:08Z by alexl: https://stackoverflow.com/users/72562/alexl
    licenesed under CC BY-SA 3.0
  */

  /**
   * sortJqueryByDepth - Sort the elements in a jQuery Object by depth, deepest first.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {jQuery}          input   The elements to sort
   *
   * @returns {jQuery}                  New jQuery Object with the deepest elements first.
   */
  function sortJqueryByDepth(input) {
    const allElements = input.map(function () {
      return {length: $(this).parents().length, element: this};
    }).get();
    allElements.sort((a, b) => a.length - b.length);
    return $(allElements.map(({element}) => element));
  }

  /**
   * convertChildElementsWithNonWhitelistedAttributesToText - In place, convert to text all decendents of a container which have non-whitelisted attributes.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {jQuery}          container   The elements and their decendants to check.
   *
   */
  function convertChildElementsWithNonWhitelistedAttributesToText(container) {
    // Get all elements within a <div>
    // Given that we might change some of the elements into text, this will allow us to get them again, if that occurs.
    // This no longer assumes that the current location in the DOM of the elements in the input does not need to be maintained (i.e. they will be moved).
    container = container instanceof jQuery ? container : $(container);

    /**
     * convertElements - In place, one pass of converting to text the decendents of a container which have non-whitelisted attributes.
     *
     * @private
     * @memberof module:fire
     *
     * @param   {jQuery}          elementsIn   The elements and their decendants to check.
     *
     * @returns {boolean}                      Flag indicating if any changes were made.
     */
    function convertElements(elementsIn) {
      let didChange = false;
      elementsIn.each(function () {
        const attrList = [...this.attributes].map((attrNode) => attrNode.name.toLowerCase());
        const nodeType = this.nodeName.toLowerCase();
        const nodeTypeAttrList = whitelistedAttributesByTagType[nodeType];
        let shouldReplaceThis = false;
        if (!Array.isArray(nodeTypeAttrList) && typeof nodeTypeAttrList === 'object' && nodeTypeAttrList !== null) {
          // This is a special case tag.
          // Remove attributes which can have general values.
          const nonGeneralAttrs = attrList.filter((attr) => !Array.isArray(nodeTypeAttrList.general) || !nodeTypeAttrList.general.includes(attr));
          // Remove any which are specific values, where the value matches one which is permitted.
          const nonSpecificAttrs = nonGeneralAttrs.filter((attr) => !nodeTypeAttrList.specificValues || !Array.isArray(nodeTypeAttrList.specificValues[attr]) || !nodeTypeAttrList.specificValues[attr].includes(this.attributes[attr].nodeValue));
          const remainingAttrs = nonSpecificAttrs.filter((attr) => !nodeTypeAttrList.regexText || typeof nodeTypeAttrList.regexText[attr] !== 'string' || !(new RegExp(`^${nodeTypeAttrList.regexText[attr]}$`)).test(this.attributes[attr].nodeValue));
          const remainingUnorderedAttrs = remainingAttrs.filter((attr) => !Array.isArray(nodeTypeAttrList.ordered) || !nodeTypeAttrList.ordered.includes(attr));
          const remainingOrderedAttrs = remainingAttrs.filter((attr) => Array.isArray(nodeTypeAttrList.ordered) && nodeTypeAttrList.ordered.includes(attr));
          let foundIndex = -1;
          const areOrderedAttrsInOrder = remainingOrderedAttrs.every((attr) => {
            const newFoundIndex = nodeTypeAttrList.ordered.indexOf(attr);
            const newFoundIndexIsHigher = foundIndex < newFoundIndex;
            foundIndex = newFoundIndex;
            return newFoundIndexIsHigher;
          });
          shouldReplaceThis = Boolean(remainingUnorderedAttrs.length) || !areOrderedAttrsInOrder;
        } else if (!Array.isArray(nodeTypeAttrList) || !attrList.every((attr) => nodeTypeAttrList.includes(attr))) {
          // This isn't a valid tag
          shouldReplaceThis = true;
        }
        if (shouldReplaceThis) {
          const newOuterHTML = this.outerHTML.replace('<', '&lt;').replace(/<(\/[a-z\d]+>)$/, '&lt;$1');
          this.outerHTML = newOuterHTML;
          didChange = true;
        }
      });
      return didChange;
    }
    let allChildren;
    // Repeatedly do the conversion, until nothing is changed.
    // This can still end up with the HTML parsed incorrectly, but shouldn't have any elements which are
    // not whitelisted, or which are whitelisted element that have attributes which are not whitelisted.
    do {
      // Get all the elements again, and re-run the conversion.
      allChildren = sortJqueryByDepth(container.find('*'));
    } while (convertElements(allChildren));
  }

  const whiteListedSETagsRegex = (function () {
    // https://regex101.com/r/90UJ2K/1
    // https://regex101.com/r/9I7r9O/1
    /* eslint-disable no-useless-escape */
    const selfClosingBasicTagsRegexText = `(?:${Object.keys(whitelistedTags.optionallySelfClosingTagsWithNoAttributes).join('|')})\\s*/?`;
    const basicTagsRegexText = `\/?(?:${Object.keys(whitelistedTags.withNoAttributes).join('|')})\\s*`;
    const complexTagsClosingRegexText = `\/(?:${Object.keys(whitelistedTags.withAttributes).join('|')})\\s*`;
    const complexTagsRegexText = `(?:${Object.entries(whitelistedTags.withAttributes)
      .map(([tag, attrs]) => `(?:${tag}\\b(?: +(?:${attrs.join('|')})="[^"<>]*")*)`) // syntax highlihting fodder: "
      .join('|')})\\s*`;
    const specialCaseTagsClosingRegexText = `\/(?:${Object.keys(whitelistedTags.specialCases).join('|')})\\s*`;
    /* eslint-enable no-useless-escape */
    const specialCaseTagsRegexText = `(?:${Object.entries(whitelistedTags.specialCases).map(([tag, obj]) => {
      const unordered = [];
      if (Array.isArray(obj.general)) {
        unordered.push(`(?:${(obj.general || []).join('|')})="[^"<>]*"`); // syntax highlihting fodder: "
      }
      if (obj.specificValues) {
        unordered.push(Object.entries(obj.specificValues)
          .map(([specificValueAttr, values]) => `${specificValueAttr}="(?:${values.join('|')})"`)
          .join('|'));
      }
      if (obj.regexText) {
        unordered.push(Object.entries(obj.regexText)
          .map(([regexTextAttr, regexText]) => `${regexTextAttr}="${regexText}"`)
          .join('|'));
      }
      let unorderedRegexText = '';
      if (unordered.length > 0) {
        unorderedRegexText = `(?:(?: +(?:${unordered.join('|')}))*)`;
      }
      let allAttrs = unorderedRegexText;
      let orderedRegexText = '';
      if (obj.ordered) {
        orderedRegexText = `(?:(?: +${obj.ordered.join(`="[^"<>]*")?${unorderedRegexText}(?: +`)}="[^"<>]*")?)`;
        allAttrs = unorderedRegexText + orderedRegexText + unorderedRegexText;
      }
      const attrRegexText = `(?:${tag}\\b${allAttrs}\\s*${obj.isOptionallySelfClosing ? '/?' : ''})`;
      return attrRegexText;
    })
      .join('|')})`;
    const fullRegexText = `&lt;(${[
      selfClosingBasicTagsRegexText,
      basicTagsRegexText,
      complexTagsClosingRegexText,
      complexTagsRegexText,
      specialCaseTagsClosingRegexText,
      specialCaseTagsRegexText,
    ].join('|')})&gt;`;
    return new RegExp(fullRegexText, 'gi');
  })();
  /* The whitelisted RegExp is currently:
    Brief test: https://regex101.com/r/csDeBt/1/
    RegExp:
    &lt;((?:br|hr)\s*\/?|\/?(?:b|code|dd|del|dl|dt|em|h1|h2|h3|i|kbd|li|p|s|strike|strong|sub|sup|ul)\s*|\/(?:blockquote|div|ol|pre|span)\s*|(?:(?:blockquote\b(?: +(?:class)="[^"<>]*")*)|(?:div\b(?: +(?:class|data-lang|data-hide|data-console|data-babel)="[^"<>]*")*)|(?:ol\b(?: +(?:start)="[^"<>]*")*)|(?:pre\b(?: +(?:class)="[^"<>]*")*)|(?:span\b(?: +(?:class|dir)="[^"<>]*")*))\s*|\/(?:a)\s*|(?:(?:a\b(?: +(?:(?:(?:href|title|rel|alt)="[^"<>]*")|class="(?:post-tag)"))*))\s*|(?:(?:img\b(?: +(?:src|width|height|alt|title)="[^"<>]*")*)\s*\/?))&gt;
    2021-02-10:
      &lt;((?:br|hr)\s*\/?|\/?(?:b|code|dd|del|dl|dt|em|h1|h2|h3|i|kbd|li|p|s|strike|strong|sub|sup|tbody|thead|tr|ul)\s*|\/(?:blockquote|div|ol|pre|span)\s*|(?:(?:blockquote\b(?: +(?:class)="[^"<>]*")*)|(?:div\b(?: +(?:class|data-lang|data-hide|data-console|data-babel)="[^"<>]*")*)|(?:ol\b(?: +(?:start)="[^"<>]*")*)|(?:pre\b(?: +(?:class)="[^"<>]*")*)|(?:span\b(?: +(?:class|dir)="[^"<>]*")*))\s*|\/(?:a|img|table|td|th)\s*|(?:(?:a\b(?:(?: +(?:(?:title|rel|alt)="[^"<>]*"|class="(?:post-tag)"|href="(?:https?:)?\/\/?[^" ]*"))*)\s*)|(?:img\b(?:(?: +src="[^"<>]*")?(?: +width="[^"<>]*")?(?: +height="[^"<>]*")?(?: +alt="[^"<>]*")?(?: +title="[^"<>]*")?)\s*\/?)|(?:table\b(?:(?: +(?:class="(?:s-table)"))*)\s*)|(?:td\b(?:(?: +(?:style="(?:text-align: right;|text-align: left;|text-align: center;)"))*)\s*)|(?:th\b(?:(?: +(?:style="(?:text-align: right;|text-align: left;|text-align: center;)"))*)\s*)))&gt;
  */

  /**
   * generatePostBodyDivFromText - Generate a <div> containing the HTML for a post body from HTML text.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {string}          htmlText         The text to change into HTML.
   * @param   {falseyTruthy}    isTrusted        Truthy if the text supplied is from SE (i.e. it's trusted / not pre-processed by SD).
   *
   * @returns {jQuery}                           <div> containing the body HTML.
   */
  function generatePostBodyDivFromHtmlText(htmlText, isTrusted) {
    // Just having the whitelisted tags active is good, but results in the possibility that we've enabled
    //   a tag within <code>.
    // div and pre can have class and other attributes for snippets.

    // SE normally provides HTML with <code> sections having <, >, and & (???) replaced by their HTML entities. The .body we get from MS has all HTML entities
    //   throughout the text (not just in <code> and <blockquotes>) replaced with their Unicode characters
    //   This is done to facilitate regex matching within the post, particularly within <code>.
    //   With what SD has done to the text it's not, necessarily, possible to
    //   recover back to the actual content (e.g. what happens with Markdown like `<code>`: SE would send "<code>&lt;code&gt;</code>", but that gets converted
    //   to "<code><code></code>" by SD/MS. In addition, it's possible there were originally other pieces of text which were HTML entities that are now
    //   Unicode characters which are incorrectly enterpreted as valid HTML tags, etc.
    //   So, ultimately, the conversion from the body stored on MS to HTML text which we do here is, at best, an approximation. However, it's considerably
    //   better than not trying to perform that conversion at all.
    /*
      `<code>` foobar `</code>`
      produces
      <code>&lt;code&gt;</code> foobar <code>&lt;/code&gt;</code>
      processed:
      <code><code></code> foobar <code></code></code>

      `<code></code> foobar <code></code>`
      produces
      <code>&lt;code&gt;&lt;/code&gt; foobar &lt;code&gt;&lt;/code&gt;</code>
      processed:
      <code><code></code> foobar <code></code></code>

          */
    // What we have in the MS provided body is that the <code> sections have had all of the &gt;, &lt; and ? &amp; ? changed to actual characters, rather than the
    //   HTML entities, which is what SE provides. So, in order to display it (or compare it to what SE provides), we need to convert all of those back to the
    //   HTML entities. If we don't, then what's displayed could be incorrect.
    // At this point, it's reasonably consistently formatted HTML, due to being processed from Markdown by SE.
    // On deleted posts where the MS data isn't available, d.body could be undefined.

    const parser = new DOMParser();
    let processedBody = htmlText;
    if (!isTrusted) {
      // If we are converting HTML text received from SE, then we don't need to handle the HTML
      //   entities having been converted to Unicode characters. We can just use the HTML text directly.
      whiteListedSETagsRegex.lastIndex = 0;
      const bodyOnlyWhitelist = $('<div/>')
        .text(htmlText || '') // Escape everything. NOTE: Everything should be unescaped comming from SD/MS, but properly formatted if it's from SE.
        .html() // Get the escaped HTML, unescape whitelisted tags.
        .replace(whiteListedSETagsRegex, '<$1>');
      processedBody = toHTMLEntitiesBetweenTags(bodyOnlyWhitelist, 'code');
      processedBody = toHTMLEntitiesBetweenTags(processedBody, 'blockquote', whiteListedSETagsRegex);
    }
    // At this point, if we just pass the HTML to jQuery, then the images are fetched, which might look suspicious if network traffic is being monitored
    //   (e.g. in a work environment) and the image is NSFW. Still need to avoid that.
    // ProcessedBody may be malformed, so we don't wrap it in a div in HTML text.
    const bodyAsDOM = parser.parseFromString(processedBody, 'text/html');
    // The body here will often have multiple child nodes. We want everything wrapped in a div, so:
    const newDiv = bodyAsDOM.createElement('div');
    newDiv.append(...bodyAsDOM.body.childNodes);
    bodyAsDOM.body.append(newDiv);
    if (!isTrusted) {
      convertChildElementsWithNonWhitelistedAttributesToText(bodyAsDOM.body.firstChild);
    }
    // Change all the image src prior to inserting into main document DOM or letting jQuery see it.
    // Not doing that here would result in the browser making fetches for each image's URL, which
    // could be bad for NSFW images in some situations (e.g. someone using this from work).
    // We could do this in the HTML text, but we want a DOM anyway, and it's easier to do it as DOM.
    bodyAsDOM.body.querySelectorAll('img').forEach((image) => {
      image.dataset.src = image.src;
      image.src = 'https://placehold.it/550x100//ffffff?text=Click+to+show+image.';
    });
    return $(bodyAsDOM.body.firstChild);
  }

  /**
   * openReportPopup - Build a report popup and show it.
   *
   * @private
   * @memberof module:fire
   */
  function openReportPopup() {
    if (fire.isOpen && $('.fire-popup').length > 0)
      return; // Don't open the popup twice.

    const that = this;

    if (!fire.userData.metasmokeWriteToken && !fire.userData.readOnly) {
      getWriteToken(() => {
        // Open the popup for the FIRE button clicked after getting the token.
        closePopup(); // Call this a second time.
        setTimeout(() => openReportPopup.call(that), fire.constants.loadAllMessagesDelay);
      });
      return;
    }

    fire.isOpen = that;

    const $that = $(that);
    const url = $that.data('url');
    let d;

    if (url && fire.reportCache[url] && !fire.reportCache[url].isExpired) {
      d = fire.reportCache[url];
    } else {
      loadDataForReport.call(that, true); // No data, so load it.
      return;
    }

    const site = fire.sites[d.site] || fire.sites[`${d.site}.net`];
    const siteIcon = site ? site.icon_url : `//cdn.sstatic.net/Sites/${d.site}/img/apple-touch-icon.png`;

    const openOnSiteButton = newEl('a', 'fire-site-logo', {
      html: site ? site.name : d.site,
      href: d.link,
      target: '_blank',
      css: {'background-image': `url(${siteIcon})`},
      'fire-key': fire.openOnSiteCodes,
      'fire-tooltip': 'Show on site'
    });

    const openOnMSButton = newEl('a', 'button fire-metasmoke-button', {
      text: 'MS',
      href: `https://m.erwaysoftware.com/posts/by-url?url=${d.link}`,
      target: '_blank',
      'fire-key': fire.openOnMSCodes,
      'fire-tooltip': 'Open on metasmoke'
    });

    const top = newEl('p', 'fire-popup-header')
      .append(createCloseButton(closePopup))
      .append(openOnMSButton)
      .append(openOnSiteButton)
      .append(br());

    if (!fire.userData.readOnly) {
      const buttonContainer = newEl('div', 'fire-popup-feedbackButtonContainer');
      top.append(buttonContainer);
      /* eslint-disable no-multi-spaces */
      buttonContainer
        // Buttons that raise a flag and send feedback.
        .append(createFeedbackButton(d, ['1', 'k', numpad('1')], 'spam', 'tpu-', 'spam', 'True positive, blacklist user & spam flag (add user to blacklist)'))
        .append(createFeedbackButton(d, ['2', 'r', numpad('2')], 'rude', 'tpu-', 'rude', 'Rude / Abusive, blacklist user & rude flag'))
        // Buttons that only send feedback.
        .append('<span style="float:left;padding:4px 5px 0px 15px;" title="The following don\'t raise a flag, they only submit feedback to metasmoke.">No flag:</span>')
        .append(createFeedbackButton(d, ['3', 'T', numpad('3')], 'tpu-', 'tpu-', '',     'True positive & blacklist user; Don\'t raise a flag.'))
        .append(createFeedbackButton(d, ['4', 'v', numpad('4')], 'tp-',  'tp-',  '',     'tp- (e.g. Vandalism; single case of undisclosed affiliation); Don\'t add user to blacklist. Don\'t raise a flag.'))
        .append(createFeedbackButton(d, ['5', 'n', numpad('5')], 'naa-', 'naa-', '',     'Not an Answer / VLQ; Don\'t raise a flag.'))
        .append(createFeedbackButton(d, ['6', 'f', numpad('6')], 'fp-',  'fp-',  '',     'False Positive'));
      /* eslint-enable no-multi-spaces */
    }

    let postType;
    let suffix;

    if (d.is_answer) {
      postType = 'Answer';
      suffix = 'n';
    } else {
      postType = 'Question';
      suffix = '';
    }

    const reportTitle = $('<div/>')
      .text(d.title) // Escape everything.
      .html();       // Get the escaped HTML

    let title;

    if (d.has_auto_flagged) {
      title = emojiOrImage('autoflag')
        .attr('fire-tooltip', 'You have auto-flagged this post.')
        .append(` ${reportTitle}`);
    } else if (d.has_flagged) {
      title = emojiOrImage('flag')
        .attr('fire-tooltip', 'You have flagged this post.')
        .append(` ${reportTitle}`);
    } else {
      title = reportTitle; // eslint-disable-line prefer-destructuring
    }

    const reportBody = generatePostBodyDivFromHtmlText(d.body, false);
    // Convert relative URLs to point to the URL on the source site.
    // SE uses these for tags and some site-specific functionality (e.g. circuit simulation on Electronics)
    const [, siteHref] = (d.link || '').match(/^((?:https?:)?\/\/(?:[a-z\d-]+\.)+[a-z\d-]+\/)/i) || ['', ''];
    // A couple of reports which had this problem:
    //   https://chat.stackexchange.com/transcript/11540?m=55601336#55601336  (links at bottom)
    //   https://chat.stackexchange.com/transcript/11540?m=54674140#54674140  (tags)
    reportBody.find('a').each(function () {
      const $this = $(this);
      let href = $this.attr('href');
      if (!/^(?:[a-z]+:)?\/\//.test(href)) {
        // It's not a fully qualified or protocol-relative link.
        if (href.startsWith('/')) {
          // The path is absolute
          if (siteHref.endsWith('/')) {
            href = href.replace('/', '');
          }
          this.href = siteHref + href;
        } else {
          // It's relative to the question (really shouldn't see any of these)
          if (!siteHref.endsWith('/')) {
            href = `/${href}`;
          }
          this.href = d.link + href;
        }
      }
    });
    reportBody.find('blockquote.spoiler')
      .attr('data-spoiler', 'Reveal spoiler')
      .one('click', function () {
        $(this).addClass('is-visible');
      });

    const userName = `${d.username}<span class="fire-user-reputation"></span>`;

    const body = newEl('div', 'fire-popup-body')
      .append(
        newEl('div', {
          'fire-tooltip': emojiOrImage('clipboard')
            .append(` - The reported post is a${suffix} ${postType.toLowerCase()}.\n\n${d.why}`)
            .html()
        })
          .append(newEl('h2', 'fire-post-title')
            .append(newEl('em', {html: title}))
          )
          .append(newEl('hr'))
          .append(
            newEl('div', 'fire-report-info')
              .append(newEl('h3', 'fire-type', {text: `${postType}:`}))
              .append(
                newEl('span', 'fire-username', {html: userName, title: 'Username'})
                  .append(emojiOrImage('user'))
              )
          )
      )
      .append(newEl('div', `fire-reported-post${d.is_deleted ? ' fire-deleted' : ''}`)
        .append(reportBody)
      );

    newEl('div', 'fire-popup-modal')
      .appendTo('body')
      .click(closePopup);

    const versionLink = newEl('a', 'fire-version-link', {
      text: fire.metaData.version,
      href: `${fire.metaData.downloadURL}?${new Date().getTime()}`,
      target: '_self',
      title: 'Update'
    });

    const settingsButton = newEl('a', 'fire-settings-button', {
      html: emojiOrImage('gear'),
      click: openSettingsPopup,
      'fire-key': keyCodesToArray('s'),
      'fire-tooltip': 'FIRE Configuration'
    });

    newEl('div', `fire-popup${fire.userData.readOnly ? ' fire-readonly' : ''}`)
      .css({top: '5%', left: getPopupLeft()})
      .append(top)
      .append(body)
      .append(settingsButton)
      .append(versionLink)
      .hide()
      .appendTo('body')
      .fadeIn('fast');

    handleReportImages();

    if (d.revision_count > 1)
      showEditedIcon();

    $('#container').toggleClass('fire-blur', fire.userData.blur);

    expandLinksOnHover();

    if (d.se && d.se.post)
      showReputation(d.se.post.owner.reputation);

    $(document)
      .keydown(keyboardShortcuts)
      .on(
        'click',
        '.fire-popup-body pre',
        ({currentTarget}) => $(currentTarget).toggleClass('fire-expanded')
      );
    document.addEventListener('keypress', stopPropagationIfTargetBody, true);
  }

  /**
   * handleReportImages - Handle images in a report. Either show them immediately, or add a click listener to show them.
   *
   * @private
   * @memberof module:fire
   *
   */
  function handleReportImages() {
    if (fire.userData.hideImages) {
      $('.fire-reported-post img').each((i, element) => {
        const img = $(element);
        img.one('click', (event) => {
          img.attr('src', img.data('src'));
          event.preventDefault();
        });
      });
    } else {
      // Restore the original image src attribute.
      $('.fire-reported-post img').each((i, element) => {
        element.src = $(element).data('src');
      });
    }
  }

  /**
   * openSettingsPopup - Opens a popup to change fire's settings.
   *
   * @private
   * @memberof module:fire
   */
  function openSettingsPopup() {
    if (fire.settingsAreOpen)
      return; // Don't open the settings twice.

    fire.settingsAreOpen = true;

    const popup = newEl('div', 'fire-popup', {id: 'fire-settings'})
      .css({top: '5%', left: getPopupLeft()});

    const top = newEl('p', 'fire-popup-header')
      .append(
        newEl('h2')
          .append(emojiOrImage('fire', true))
          .append(' FIRE settings.'))
      .append(createCloseButton(closePopup));

    const toastDurationElements = newEl('div')
      .append(
        newEl('span', {text: 'Notification popup duration:'})
          .append(br())
          .append(newEl('input', {
            id: 'toastr_duration',
            type: 'number',
            value: fire.userData.toastrDuration,
            change: toastrDurationHandler,
            blur: () => toastr.info('Notification duration updated')
          }))
          .append(' ms')
      );

    const toastrClasses = ['top-right', 'bottom-right', 'bottom-left', 'top-left', 'top-full-width', 'bottom-full-width', 'top-center', 'bottom-center'];
    const selected = fire.userData.toastrPosition;
    const positionSelect = newEl('select', 'fire-position-select', {change: toastrPositionChangeHandler});

    for (const value of toastrClasses) {
      positionSelect.append(
        newEl('option', {
          value,
          text: value.replace(/-/g, ' '),
          selected: value === selected
        })
      );
    }

    let disableReadonlyButton = $();
    if (fire.userData.readOnly) {
      disableReadonlyButton = br().after(
        button('Disable read-only mode', clickHandlers.disableReadonly)
      );
    }

    let requestStackExchangeTokenButton = $();

    if (!fire.userData.stackexchangeWriteToken) {
      requestStackExchangeTokenButton = newEl('p', 'fire-request-write-token')
        .append(br())
        .append(newEl('h3', {text: 'Stack Exchange write token:'}))
        .append(newEl('p', {
          html:
            'Authorize FIRE with your Stack Exchange account.<br />' +
            'This allows FIRE to load additional data for reported posts.'
        }))
        .append(button('Authorize FIRE with Stack Exchange', requestStackExchangeToken));
    }

    const positionSelector = newEl('div')
      .append(br())
      .append(
        newEl('span', {text: 'Notification popup position:'})
          .append(br())
          .append(positionSelect)
      );

    const container = newEl('div')
      .append(
        newEl('div', 'fire-settings-section fire-settings-left')
          .append(createSettingsCheckBox('blur', fire.userData.blur, blurOptionClickHandler,
            'Enable blur on popup background.',
            'Popup blur:'
          ))
          .append(br())
          .append(createSettingsCheckBox('flag', fire.userData.flag, flagOptionClickHandler,
            'Also submit "spam" and "rude" flags with those buttons.',
            'Flag on feedback:')
          )
          .append(br())
          .append(createSettingsCheckBox('debug', fire.userData.debug, debugOptionClickHandler,
            'Enable FIRE logging in developer console.',
            'Debug mode:')
          )
          .append(br())
          .append(createSettingsCheckBox('hideImages', fire.userData.hideImages, imageOptionClickHandler,
            'Hide images in reported messages.',
            'Hiding images on reports:')
          )
          .append(disableReadonlyButton)
      )
      .append(
        newEl('div', 'fire-settings-section fire-settings-right')
          .append(newEl('h3', {text: 'Notifications:'}))
          .append(toastDurationElements)
          .append(positionSelector)
          .append(requestStackExchangeTokenButton)
      );

    popup
      .append(top)
      .append(container)
      .hide()
      .appendTo('body')
      .fadeIn('fast');
  }

  /**
   * closePopup - Close the popup.
   *
   * @private
   * @memberof module:fire
   *
   * @returns {object} The previously closed popup's button (if any) so it can be re-opened.
   */
  function closePopup() {
    fire.sendingFeedback = false;
    if (fire.settingsAreOpen) {
      const selector = '.fire-popup#fire-settings';
      $(selector)
        .fadeOut('fast', () => $(selector).remove());

      if (!fire.isOpen)
        $('#container').removeClass('fire-blur');
      delete fire.settingsAreOpen;
    } else {
      const selector = '.fire-popup, .fire-popup-modal';
      $(selector)
        .fadeOut('fast', () => $(selector).remove());

      $(document)
        .off('keydown', keyboardShortcuts)
        .off('click', '.fire-popup-body pre');
      document.removeEventListener('keypress', stopPropagationIfTargetBody, true);

      $('#container').removeClass('fire-blur');

      const previous = fire.isOpen;
      delete fire.isOpen;

      return previous;
    }

    return null;
  }

  /**
   * getPopupLeft - Gets the `left` position for the popup.
   *
   * @private
   * @memberof module:fire
   *
   * @returns {number} The `left` position for the popup.
   */
  function getPopupLeft() {
    const w = (window.innerWidth - $('#sidebar').width()) / 2;
    return Math.max(fire.constants.minPopupLeft, w - fire.constants.halfPopupWidth);
  }

  /**
   * getJqXHRmessage - Gets the response message from two locations in a jqXHR Object from a request to MS.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {object}    jqXHR     The jqXHR Object from a MS or SE AJAX call.
   * @returns {object}              Data from jqXHR.responseText
   */
  function getJqXHRmessage(jqXHR) {
    try {
      return JSON.parse(jqXHR.responseText);
    } catch (error) { // eslint-disable-line no-unused-vars, unicorn/catch-error-name
      return {message: (jqXHR || {responseText: ''}).responseText};
    }
  }

  /**
   * postMetaSmokeFeedbackAndFlag - Submit metasmoke feedback and flag, if appropriate.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} data     The report data.
   * @param {string} verdict  The chosen verdict.
   * @param {string} flagType The chosen flag type.
   */
  function postMetaSmokeFeedbackAndFlag(data, verdict, flagType) {
    if (!fire.sendingFeedback) {
      fire.sendingFeedback = true;

      const {ms} = fire.api;
      const token = fire.userData.metasmokeWriteToken;
      if (data.has_sent_feedback) {
        const info = span('You have already sent feedback to metasmoke for this report.');
        if (fire.userData.flag && flagType) {
          postMetaSmokeFlag(data, flagType, {info});
        } else {
          toastr.info(info);
          closePopup();
        }
      } else {
        $.ajax({
          type: 'POST',
          url: `${ms.urlV1}w/post/${data.id}/feedback`, // V2.0 appears broken at this time. Using V1.
          data: {type: verdict, key: ms.key, token}
        })
          .done(() => {
            const success = span(`Sent feedback "<em>${verdict}</em>" to metasmoke.`);
            if (fire.userData.flag && flagType) {
              postMetaSmokeFlag(data, flagType, {success});
            } else {
              toastr.success(success);
              closePopup();
            }
          })
          .error(jqXHR => {
            if (jqXHR.status === fire.constants.http.unauthorized) {
              toastr.error('Can\'t send feedback to metasmoke - not authenticated.');

              clearValue('metasmokeWriteToken');
              const previous = closePopup();

              getWriteToken(() => openReportPopup.call(previous)); // Open the popup later
            } else {
              const error = span(`An error occurred sending post feedback "<em>${verdict}</em>" to metasmoke.`);
              if (fire.userData.flag && flagType) {
              // Even if we got a non-auth-needed error for the feedback, we still try to flag.
                postMetaSmokeFlag(data, flagType, {error});
              } else {
                toastr.error(error);
              }
              fire.error('An error occurred sending post feedback to metasmoke.', jqXHR);
            }
          })
          .always(() => {
            fire.sendingFeedback = false;
          });
      }
    }
  }

  /**
   * toastrFeedbackResult - Display a toastr message from the feedback result.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {object} feedbackResult   An Object with 'success', 'info', 'warning', or 'error' properties that can be sent to the toastr method of that name.
   */
  function toastrFeedbackResult(feedbackResult) {
    Object.entries(feedbackResult).forEach(([key, value]) => {
      if (value && typeof value === 'object' && value.length > 0) toastr[key](value);
    });
  }

  /**
   * postMetaSmokeFlag - Flag the post as spam.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {object} data             The report data.
   * @param   {string} flagType         The chosen type of flag ('spam' || 'rude' || 'abusive'). 'spam' is default.
   * @param   {object} feedbackResult   An Object with 'success', 'info', 'warning', or 'error' properties that can be sent to the toastr method of that name.
   * @returns {undefined}               returns undefined to break out of the function.
   */
  function postMetaSmokeFlag(data, flagType, feedbackResult) {
    const {url, key} = fire.api.ms;
    const token = fire.userData.metasmokeWriteToken;
    flagType = flagType ? flagType : 'spam'; // Default
    const normalizedFlagType = flagType === 'rude' ? 'abusive' : flagType; // rude is a synonym for abusive, which is what MS understands.
    const permittedFlagTypes = ['spam', 'abusive'];
    /* eslint-disable no-warning-comments */
    /* TODO: fix this // eslint-disable-line no-warning-comments
    let site = fire.sites[data.site];
    if (!site.account) {
      toastr.info(feedbackSuccess.after(span("You don't have an account on this site, so you can't cast a spam flag.")));
      debugger;
      window.open(site.site_url + "/users/join");
    } else if (site.account.reputation < 15) {
      toastr.info(feedbackSuccess.after(span("You don't have enough reputation on this site to cast a spam flag.")));
    } else */
    /* eslint-enable no-warning-comments */
    if (data.has_auto_flagged) {
      toastr.info(span('You already autoflagged this post as spam.'));
    } else if (data.has_manual_flagged) {
      toastr.info(span('You already manually flagged this post.'));
    } else if (data.is_deleted) {
      toastr.info(span('The reported post can\'t be flagged: It is already deleted.'));
    } else if (permittedFlagTypes.indexOf(normalizedFlagType) === -1) {
      toastr.error(span('MS does not support that flag type.'));
    } else {
      $.ajax({
        type: 'POST',
        url: `${url}posts/${data.id}/flag`,
        data: {
          key,
          token,
          flag_type: normalizedFlagType
        }
      })
        .done(response => {
          if (response.backoff) {
          // We've got a backoff. Deal with it...
          // Yea, this isn't implemented yet. probably gonna set a timer for the backoff and
          // Re-execute any pending requests that were submitted during that time, afterwards.
            debugger; // eslint-disable-line no-debugger
            toastr.info('Backoff received');
            fire.info('Backoff received', data, response);
          }
          toastr.success(span(`Successfully flagged the post as "${flagType}".`));
          toastrFeedbackResult(feedbackResult);
          closePopup();
        })
        .error(jqXHR => {
          if (jqXHR.status === fire.constants.http.conflict) {
          // https://metasmoke.erwaysoftware.com/authentication/status
          // Will give you a 409 response with error_name, error_code and error_message parameters if the user isn't write-authenticated;
            toastr.error(
              'FIRE requires your metasmoke account to be write-authenticated with Stack Exchange in order to submit spam flags.<br />' +
            'Your metasmoke account doesn\'t appear to be write-authenticated.<br />' +
            'Please open <em><a href="https://metasmoke.erwaysoftware.com/authentication/status" target="_blank">this page</a></em> to authenticate with Stack Exchange.',
              null,
              {timeOut: 0, extendedTimeOut: 1000, progressBar: true});
            fire.error('Not write-authenticated on MS', data, jqXHR);
          } else {
            if (jqXHR.responseText) {
              const response = getJqXHRmessage(jqXHR);
              const knownResponses = {
                'Flag option not present': 'This post could not be flagged.<br/>It\'s probably already deleted.',
                'No account on this site.': 'This post could not be flagged.<br/>You don\'t have an account on that site.',
                'You have already flagged this post for moderator attention': 'This post could not be flagged.<br/>You have already flagged this post for moderator attention.'
              };
              const flagInfo = knownResponses[response];
              if (flagInfo) {
                toastr.info(flagInfo);
                toastrFeedbackResult(feedbackResult);
                closePopup();
                return;
              }
            }

            // Will give you a 500 with status: 'failed' and a message if the spam flag fails;
            toastr.error(`Something went wrong while attempting to submit a ${flagType} flag`);
            fire.error(`Something went wrong while attempting to submit a ${flagType} flag`, data, jqXHR);
            toastrFeedbackResult(feedbackResult);
            fire.sendingFeedback = false;
          // This path does not close the popup.
          }
        });
      return; // The last else does not fall through.
    }
    toastrFeedbackResult(feedbackResult);
    closePopup();
  }

  /**
   * keyCodesToArray - Structure the keyCodes Array.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {(number|string|array)} keyCodes An number, string, or array of numbers or strings containing keys or keycodes.
   * @returns {array.number}                   An array of keyCodes mapped from the input chars / keyCodes.
   */
  function keyCodesToArray(keyCodes) {
    if (!Array.isArray(keyCodes))
      keyCodes = [keyCodes];

    keyCodes.forEach((value, i) => {
      keyCodes[i] =
        typeof value === 'number' ?
          value :
          value.toUpperCase().charCodeAt(0);
    });

    return keyCodes;
  }

  /**
   * numpad - Get the numpad keyCode for the passed number.
   *
   * @param {number|string}   numberKey   The value to get the keyCode for.
   * @param {object}          constants   An optional reference to FIRE's constants, for when `fire` is not yet declared.
   *
   * @returns {number} the keypad keyCode for the passed number.
   */
  function numpad(numberKey, constants) {
    return String(numberKey).charCodeAt(0) + (constants || fire.constants).numpadOffset;
  }

  /**
   * createFeedbackButton - Create a feedback button for the top of the popup.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {object}                data     the report data.
   * @param   {(number|string|array)} keyCodes The keyCodes to use for this button.
   * @param   {string}                text     The text to display for this button.
   * @param   {string}                verdict  This button's metasmoke verdict
   * @param   {string}                flagType This button's flag type
   * @param   {string}                tooltip  The tooltip to display for this button.
   * @returns {object}                         The constructed feedback button.
   */
  function createFeedbackButton(data, keyCodes, text, verdict, flagType, tooltip) { // eslint-disable-line max-params
    let count;
    let hasSubmittedFeedback;
    let disabled = false;

    if (!data.is_answer)
      disabled = verdict === 'naa-';

    if (data.feedbacks) { // Has feedback
      count = data.feedbacks.filter(
        ({feedback_type}) => feedback_type === verdict
      ).length;
      hasSubmittedFeedback = data.feedbacks.some(
        ({feedback_type, user_name}) => feedback_type === verdict && user_name === fire.chatUser.name
      );
    }

    const suffix = count ? ` (${count})` : '';
    const cssClass = hasSubmittedFeedback ? ' fire-submitted' : '';

    return newEl('a', `button fire-feedback-button fire-${verdict}${cssClass}`, {
      text: text + suffix,
      click: ({currentTarget}) => {
        const $currentTarget = $(currentTarget);
        if ($currentTarget.attr('disabled')) {
          // Do nothing.
          return;
        }
        if (!data.has_sent_feedback ||
          (fire.userData.flag && !(data.has_flagged || data.is_deleted)) // eslint-disable-line no-extra-parens
        ) {
          postMetaSmokeFeedbackAndFlag(data, verdict, flagType);
        } else {
          let performedAction;
          if (data.has_flagged)
            performedAction = 'flagged';
          else if (data.is_deleted)
            performedAction = 'deleted';

          toastr.info(
            `You have already sent feedback for this reported post.<br />The post has already been ${performedAction}.`,
            null,
            {preventDuplicates: true}
          );
        }
      },
      disabled: disabled || (data.has_sent_feedback && (data.has_flagged || data.is_deleted || !fire.userData.flag)), // eslint-disable-line no-extra-parens
      'fire-key': keyCodesToArray(keyCodes),
      'fire-tooltip': tooltip + suffix
    });
  }

  /**
   * createCloseButton - Create a button to close a popup.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {function} clickHandler The button's `click` handler.
   * @returns {object}                The constructed "close" button.
   */
  function createCloseButton(clickHandler) {
    return newEl('a', 'button fire-close-button', {
      text: 'Close',
      title: 'Close this popup',
      click: clickHandler,
      'fire-tooltip': 'Close popup',
      'fire-key': keyCodesToArray(fire.constants.keys.esc) // Escape key code,
    });
  }

  /**
   * createSettingsCheckBox - Creates a input[type=checkbox] for the settings.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {string}   id         The option's name.
   * @param   {boolean}  value      The option's current value.
   * @param   {function} handler    The option's click handler.
   * @param   {string}   labelText  The text to show next to the checkbox.
   * @param   {string}   headerText The header to show above the checkbox.
   * @returns {object}              The constructed settings checkbox.
   */
  function createSettingsCheckBox(id, value, handler, labelText, headerText) {
    const checkBox = newEl('input', {
      id: `checkbox_${id}`,
      type: 'checkbox',
      checked: value,
      click: handler
    });

    const label = newEl('label', {
      for: `checkbox_${id}`,
      text: labelText
    });

    return newEl('div')
      .append(newEl('h3', {text: headerText}))
      .append(checkBox)
      .append(label);
  }

  /**
   * newEl - Wrapper to create a new element with a specified class.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {string} tagName    The tag to create.
   * @param   {string} [cssClass] The tag's css class. Optional. If this is an object, this is assumed to be `options`.
   * @param   {object} [options]  The options to use for the created element.
   *
   * @returns {object}            A jQuery DOM node.
   */
  function newEl(tagName, cssClass, options) {
    if (typeof cssClass === 'object') {
      options = cssClass;
      cssClass = undefined;
    }

    options = options || {};
    options.class = cssClass;

    if (options['fire-key']) {
      fire.buttonKeyCodes = fire.buttonKeyCodes.concat(options['fire-key']);
      options['fire-key'] = options['fire-key'].join(' ');
    }

    return $(`<${tagName}/>`, options);
  }

  /**
   * br - Create a linebreak.
   *
   * @private
   * @memberof module:fire
   *
   * @returns {object} A jQuery `<br />` DOM node.
   */
  function br() {
    return newEl('br');
  }

  /**
   * span - Create a `<span>` with the specified contents.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {object} contents A jQuery DOM node to use insert into the span.
   * @returns {object}          A jQuery `<span>` DOM node with the specified contents.
   */
  function span(contents) {
    return newEl('span', {html: contents});
  }

  /**
   * button - Create a button.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {string}   text         The button's text
   * @param   {function} clickHandler The button's click handler.
   * @returns {object}                A jQuery `<button>` DOM node.
   */
  function button(text, clickHandler) {
    return newEl('a', 'button', {
      text,
      click: clickHandler
    });
  }

  /**
   * hasEmojiSupport - Detect Emoji support in this browser.
   *
   * @private
   * @memberof module:fire
   */
  function hasEmojiSupport() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const smiley = fire.constants.emoji.smile; // :smile: String.fromCharCode(55357) + String.fromCharCode(56835)

    ctx.textBaseline = 'top';
    ctx.font = '32px Arial';
    ctx.fillText(smiley, 0, 0);

    fire.useEmoji = ctx.getImageData(fire.constants.emojiSize, fire.constants.emojiSize, 1, 1).data[0] !== 0;

    fire.log('Emoji support detected:', fire.useEmoji);
  }

  /**
   * emojiOrImage - Returns the emoji if it's supported. Otherwise, return a fallback image.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {string}  emoji         The emoji to render
   * @param   {boolean} [large=false] Make it large?
   * @returns {object}                A jQuery `<span>` DOM node with the specified emoji as string or image.
   */
  function emojiOrImage(emoji, large) {
    emoji = fire.constants.emoji[emoji] || emoji;

    if (fire.useEmoji)
      return span(emoji);

    const url = 'https://raw.githubusercontent.com/Ranks/emojione-assets/master/png/32/';
    const hex = emoji.codePointAt(0).toString(fire.constants.hex);

    const emojiImage = newEl('img', `fire-emoji${large ? '-large' : ''}`, {
      src: `${url + hex}.png`,
      alt: emoji
    });

    return span(emojiImage);
  }

  /**
   * injectExternalScripts - Inject FIRE stylesheet and Toastr library.
   *
   * @private
   * @memberof module:fire
   */
  function injectExternalScripts() {
    injectCSS('//charcoal-se.org/userscripts/fire/fire.css');

    // Toastr is a JavaScript library for non-blocking notifications.
    injectScript(typeof toastr === 'undefined', '//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js', null, () => {
      loadToastrCss();
      initializeToastr();
    });
    injectScript(typeof ReconnectingWebSocket === 'undefined', '//cdn.jsdelivr.net/gh/joewalnes/reconnecting-websocket@5c66a7b0e436815c25b79c5579c6be16a6fd76d2/reconnecting-websocket.js', null, registerWebSocket);

    fire.log('Injected scripts and stylesheets.');
  }

  /**
   * injectCSS - Inject the specified stylesheet.
   *
   * @private
   * @memberof module:fire
   *
   * @param {string} path The path to the CSS file.
   */
  function injectCSS(path) {
    const css = window.document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${path}?fire=${fire.metaData.version}`;
    document.head.appendChild(css);
  }

  /**
   * injectScript - Inject the specified script.
   *
   * @private
   * @memberof module:fire
   *
   * @param {falsy/truthy}   load       If truthy, this function loads the script. Falsy indicates it's already loaded.
   * @param {string}         path       The script's path.
   * @param {function}       [callback] An optional "success" callback.
   * @param {function}       [always]   An optional "always" callback.
   */
  function injectScript(load, path, callback, always) {
    if (load) {
      $.ajaxSetup({cache: true});
      $.getScript(`${path}?fire=${fire.metaData.version}`)
        .done(callback || $.noop)
        .done(() => fire.log('Script loaded: ', path))
        .fail(() => fire.error('Script failed to load: ', path))
        .always(always || $.noop)
        .always(() => $.ajaxSetup({cache: false}));
    } else if (typeof always === 'function') {
      always();
    }
  }

  /**
   * loadToastrCss - Load toastr css.
   *
   * @private
   * @memberof module:fire
   */
  function loadToastrCss() {
    injectCSS('//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css');
  }

  /**
   * initializeToastr - Set toastr options.
   *
   * @private
   * @memberof module:fire
   */
  function initializeToastr() {
    toastr.options = {
      closeButton: true,
      progressBar: true,
      positionClass: `toast-${fire.userData.toastrPosition}`,
      preventDuplicates: false, // If we send feedback twice, show 2 notifications, even if they're duplicates.
      timeOut: fire.userData.toastrDuration,
      hideDuration: 250,
      extendedTimeOut: 500
    };

    fire.log('Toastr included, notification options set.');

    const map = {
      info: 'info',
      success: 'log',
      warning: 'warn',
      error: 'error'
    };

    toastr.subscribe(toast => {
      if (toast.state === 'visible')
        (fire[map[toast.map.type]] || fire.log)(toast.map.message);
    });
  }

  /**
   * registerOpenLastReportKey - Open the last report on [Ctrl]+[Space].
   *
   * @private
   * @memberof module:fire
   */
  function registerOpenLastReportKey() {
    $(document).on('keydown', ({keyCode, ctrlKey, altKey, metaKey, shiftKey}) => {
      if (keyCode === fire.constants.keys.space && ctrlKey && !altKey && !metaKey && !shiftKey) {
        const button = $('.fire-button').last(); // .content:not(.ai-deleted)
        if (button && button.length > 0)
          loadDataForReport.call(button, true);
      }
    });

    fire.log('Registered "Open last report" key.');
  }

  /**
   * registerAnchorHover - Register the "tooltip" hover for anchor elements.
   *
   * @private
   * @memberof module:fire
   */
  function registerAnchorHover() {
    const selector = '[fire-tooltip]';
    $('body')
      .on('mouseenter', selector, ({currentTarget}) => {
        $('.fire-tooltip').remove();
        const element = $(currentTarget);
        element.after(
          newEl('span', 'fire-tooltip', {html: element.attr('fire-tooltip')})
        );
      })
      .on('mousemove', selector, ({clientX, clientY}) => {
        $('.fire-tooltip').css({
          left: clientX + fire.constants.tooltipOffset,
          top: clientY + fire.constants.tooltipOffsetSmall
        });
      })
      .on('mouseleave', selector,
        () => $('.fire-tooltip').remove()
      );

    fire.log('Registered anchor hover tooltip.');
  }

  /**
   * registerWebSocket - Register a WebSocket listener.
   *
   * @private
   * @memberof module:fire
   */
  function registerWebSocket() {
    if (fire.webSocket) {
      // Close any existing WebSocket.
      fire.webSocket.close();
    }
    fire.webSocket = new ReconnectingWebSocket('wss://metasmoke.erwaysoftware.com/cable', null, {automaticOpen: false});
    fire.webSocket.addEventListener('message', socketOnMessage);
    fire.webSocket.addEventListener('open', () => {
      fire.webSocket.send(JSON.stringify({
        identifier: JSON.stringify({
          channel: 'ApiChannel',
          key: fire.api.ms.key
        }),
        command: 'subscribe'
      }));
    });
    // Wait 3s to open the WebSocket, due to potential disruption while the page loads.
    setTimeout(() => {
      fire.webSocket.open();
      fire.log('WebSocket initialized.');
    }, fire.constants.webSocketInitialOpenDelay);
  }

  /**
   * registerForLocalStorage - Adds a property on `fire` that's stored in `localStorage`.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} object          The object to register the property on.
   * @param {string} key             The key to use on the object.
   * @param {string} localStorageKey The key to use in `localStorage`.
   */
  function registerForLocalStorage(object, key, localStorageKey) {
    Object.defineProperty(object, key, {
      get: () => JSON.parse(localStorage.getItem(localStorageKey)),
      set: value => {
        localStorage.setItem(localStorageKey, JSON.stringify(value));
      }
    });
  }

  /**
   * registerLoggingFunctions - Registers logging functions on `fire`.
   *
   * @private
   * @memberof module:fire
   */
  function registerLoggingFunctions() {
    fire.log = getLogger('log');
    fire.info = getLogger('info');
    fire.warn = getLogger('warn');
    fire.error = getLogger('error');
  }

  /**
   * showFireOnExistingMessages - Adds the "FIRE" button to all existing messages and registers an event listener to do so after "load older messages" is clicked.
   *
   * @private
   * @memberof module:fire
   */
  function showFireOnExistingMessages() {
    $('#getmore, #getmore-mine')
      .click(() => decorateExistingMessages(fire.constants.loadAllMessagesDelay));

    decorateExistingMessages(0);

    // Load report data on fire button hover
    $('body').on('mouseenter', '.fire-button', loadDataForReport);

    fire.log('Registered `loadDataForReport` and `decorateExistingMessages`');
  }

  /**
   * decorateExistingMessages - Decorate messages that exist on page load.
   *
   * @private
   * @memberof module:fire
   *
   * @param {number} timeout The time to wait before trying to decorate the messages.
   */
  function decorateExistingMessages(timeout) {
    const chat = $(/^\/(?:search|users)/.test(window.location.pathname) ? '#content' : '#chat,#transcript');

    chat.one('DOMSubtreeModified', () => {
      // We need another timeout here, because the first modification occurs before
      // the new (old) chat messages are loaded.
      setTimeout(() => {
        if (chat.html().length === 0) { // Too soon
          setTimeout(decorateExistingMessages, timeout, timeout);
        } else { // Chat messages have loaded
          $(fire.SDMessageSelector).each((i, element) => decorateMessage(element));

          fire.log('Decorated existing messages.');

          /* eslint-disable no-warning-comments */
          /*
          TODO: Load Stack Exchange data for each report
          updateReportCache();
          */
          /* eslint-enable no-warning-comments */
        }
      }, timeout);
    });
    $(fire.SDMessageSelector).each((i, element) => decorateMessage(element));
  }

  /**
   * getLogger - Gets a log wrapper for the specified console function.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {function} fn the console function to wrap in a `debug` condition.
   * @returns {function}    A fire-wrapped console function.
   */
  function getLogger(fn) {
    return (...args) => {
      if ((fire.userData || localStorage['fire-user-data'] || {}).debug) {
        const logPrefix = `${fire.useEmoji ? `${fire.constants.emoji.fire} ` : ''}FIRE `;
        args.unshift(`${logPrefix + fn}:`);
        console[fn](...args); // eslint-disable-line no-console
      }
    };
  }

  /**
   * socketOnMessage - Handle socket messages.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} message The socket message.
   */
  function socketOnMessage(message) {
    const data = JSON.parse(message.data);

    switch (data.type) {
      case 'confirm_subscription':
      case 'ping':
      case 'welcome':
        break;
      default: {
        const info = data.message;
        let url;

        if (info.flag_log) {            // Autoflagging information
          url = info.flag_log.post.link;
        } else if (info.deletion_log) { // Deletion log
          url = info.deletion_log.post_link;
        } else if (info.feedback) {     // Feedback
          url = info.feedback.post_link;
        } else if (info.not_flagged) {  // Not flagged
          url = info.not_flagged.post.link;
        } else {
          fire.log('Socket message: ', info);
        }

        delete fire.reportCache[url]; // Remove this url from the cache, if it's in there.
        break;
      }
    }
  }

  /**
   * expandLinksOnHover - Expands anchor elements in the report's body on hover, to show the href.
   *
   * @private
   * @memberof module:fire
   */
  function expandLinksOnHover() {
    $('.fire-popup-body a').each((i, element) =>
      $(element).attr('fire-tooltip', element)
    );
  }

  /**
   * initLocalStorage - Initializes `localStorage`.
   *
   * @private
   * @memberof module:fire
   *
   * @param {function} hOP            `Object.hasOwnProperty` bound securely.
   * @param {objects}  defaultStorage localStorage's default settings.
   */
  function initLocalStorage(hOP, defaultStorage) {
    registerForLocalStorage(fire, 'userData', 'fire-user-data');
    registerForLocalStorage(fire, 'userSites', 'fire-user-sites');
    registerForLocalStorage(fire, 'sites', 'fire-sites');
    registerForLocalStorage(fire, 'savedChatUser', 'fire-saved-chat-user');

    if (fire.userData === null)
      fire.userData = defaultStorage;

    if (fire.userData.debug)
      fire.info('Debug mode enabled.');

    const data = fire.userData;
    for (const key in defaultStorage) {
      if (hOP(defaultStorage, key) && !hOP(data, key))
        data[key] = defaultStorage[key];
    }
    fire.userData = data;

    fire.log('Initialized localStorage.');
  }

  /**
   * setValue - Sets a value on `fire.userData`, stored in `localStorage`.
   *
   * @private
   * @memberof module:fire
   *
   * @param {string} key   the `localStorage` key.
   * @param {object} value the value to set.
   */
  function setValue(key, value) {
    const data = fire.userData;
    data[key] = value;
    fire.userData = data;
  }

  /**
   * clearValue - Removes a value from `fire.userData`, stored in `localStorage`
   *
   * @private
   * @memberof module:fire
   *
   * @param {string} key the `localStorage` key.
   */
  function clearValue(key) {
    const data = fire.userData;
    delete data[key];
    fire.userData = data;
  }

  /**
   * getCurrentChatUser - Gets the currently logged-in user.
   *
   * @private
   * @memberof module:fire
   *
   * @param {number}  count          The number of attempts already made. Initial calls to this function usually do not provide this parameter.
   */
  function getCurrentChatUser(count) {
    // This will loop until it successfully gets the user from CHAT, unless it's not available, then a stored version is used.
    //   It's tried immediately, then the next nine attempts are at intervals defined by fire.constants.loadUserDelay.
    //   All attempts after that are at 10 times that delay. Currently, that's 9 at 500ms, then 5s intervals.
    count = count ? count + 1 : 1;
    const multiplier = count > fire.constants.loadUserDelayApplyMultiplierCount ? fire.constants.loadUserDelayMultiplier : 1;
    if (CHAT && CHAT.RoomUsers && typeof CHAT.RoomUsers.get === 'function' && CHAT.CURRENT_USER_ID) {
      // Under some conditions, this code is too fast to run immediately (e.g. the page is slow, SE is slow, browser is slow).
      CHAT.RoomUsers
        .get(CHAT.CURRENT_USER_ID)
        .done(user => {
          fire.chatUser = user;
          fire.savedChatUser = user;
          fire.log('Current user found.');
        })
        .always(() => {
          if (!fire.chatUser)
            setTimeout(getCurrentChatUser, multiplier * fire.constants.loadUserDelay, count);
        });
      return;
    } // else
    if ((multiplier > 1 || (count > 1 && CHAT && CHAT.RoomUsers)) && fire.savedChatUser && fire.savedChatUser.name) { // eslint-disable-line no-extra-parens
      fire.chatUser = Object.assign({}, fire.savedChatUser);
      return;
    }
    setTimeout(getCurrentChatUser, multiplier * fire.constants.loadUserDelay, count);
  }

  /**
   * getFireConstants - Gets constants to be used in `fire`.
   *
   * @private
   * @memberof module:fire
   *
   * @returns {object} FIRE's constants
   */
  function getFireConstants() {
    return {
      keys: {
        enter: 13,
        esc: 27,
        space: 32,
        F1: 112
      },
      http: {
        unauthorized: 401,
        notFound: 404,
        conflict: 409
      },
      emoji: {
        /* eslint-disable no-magic-numbers */
        fire: String.fromCodePoint(0x1F525),
        user: String.fromCodePoint(0x1F464),
        gear: String.fromCodePoint(0x2699) + String.fromCodePoint(0xFE0F),
        pencil: String.fromCodePoint(0x270F) + String.fromCodePoint(0xFE0F), // This produces the expected multi-color version.
        smile: String.fromCodePoint(0x1F604),
        clipboard: String.fromCodePoint(0x1F4CB),
        flag: String.fromCodePoint(0x1F3F3) + String.fromCodePoint(0xFE0F),
        autoflag: String.fromCodePoint(0x1F3F4)
        /* eslint-enable no-magic-numbers */
      },
      emojiSize: 16,
      siteDataCacheTime: 604800000, // 604800000 ms is 7 days (7 * 24 * 60 * 60 * 1000)
      hex: 16,
      metaSmokeCodeLength: 8,
      numpadOffset: 48,
      buttonFade: 100,
      loadAllMessagesDelay: 500,
      loadUserDelay: 500,
      loadUserDelayMultiplier: 5,
      loadUserDelayApplyMultiplierCount: 11,
      tooltipOffset: 20,
      tooltipOffsetSmall: 5,
      halfPopupWidth: 300,
      minPopupLeft: 10,
      webSocketInitialOpenDelay: 3000
    };
  }
})();
