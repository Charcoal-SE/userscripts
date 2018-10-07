// ==UserScript==
// @name        🔥 FIRE: Feedback Instantly, Rapidly, Effortlessly
// @namespace   https://github.com/Charcoal-SE/
// @description FIRE adds a button to SmokeDetector reports that allows you to provide feedback & flag, all from chat.
// @author      Cerbrus
// @attribution Michiel Dommerholt (https://github.com/Cerbrus)
// @version     1.0.30
// @icon        https://raw.githubusercontent.com/Ranks/emojione-assets/master/png/32/1f525.png
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.meta.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.meta.stackexchange.com/rooms/89/tavern-on-the-meta*
// @match       *://chat.meta.stackexchange.com/rooms/1037/*
// @match       *://chat.meta.stackexchange.com/rooms/1181/the-fire-department*
// @match       *://chat.stackexchange.com/rooms/11/*
// @match       *://chat.stackexchange.com/rooms/95/*
// @match       *://chat.stackexchange.com/rooms/201/*
// @match       *://chat.stackexchange.com/rooms/388/*
// @match       *://chat.stackexchange.com/rooms/468/*
// @match       *://chat.stackexchange.com/rooms/511/*
// @match       *://chat.stackexchange.com/rooms/2165/*
// @match       *://chat.stackexchange.com/rooms/3877/*
// @match       *://chat.stackexchange.com/rooms/8089/*
// @match       *://chat.stackexchange.com/rooms/11540/charcoal-hq*
// @match       *://chat.stackexchange.com/rooms/22462/*
// @match       *://chat.stackexchange.com/rooms/24938/*
// @match       *://chat.stackexchange.com/rooms/34620/*
// @match       *://chat.stackexchange.com/rooms/35068/*
// @match       *://chat.stackexchange.com/rooms/38932/*
// @match       *://chat.stackexchange.com/rooms/47869/*
// @match       *://chat.stackexchange.com/rooms/56223/the-spam-blot*
// @match       *://chat.stackexchange.com/rooms/59281/*
// @match       *://chat.stackexchange.com/rooms/61165/*
// @match       *://chat.stackexchange.com/rooms/65945/*
// @match       *://chat.stackoverflow.com/rooms/41570/so-close-vote-reviewers*
// @match       *://chat.stackoverflow.com/rooms/90230/*
// @match       *://chat.stackoverflow.com/rooms/111347/sobotics*
// @match       *://chat.stackoverflow.com/rooms/126195/*
// @match       *://chat.stackoverflow.com/rooms/167826/*
// @match       *://chat.stackoverflow.com/rooms/170175/*
// @grant       none
// ==/UserScript==

/**
 * anonymous function - IIFE to prevent accidental pollution of the global scope..
 */
(() => {
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
       * The userscript's api urls and keys
       *
       * @public
       * @memberof module:fire
       */
      api: {
        ms: {
          key: '55c3b1f85a2db5922700c36b49583ce1a047aabc4cf5f06ba5ba5eff217faca6', // This script's MetaSmoke API key
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
      SDMessageSelector: `.user-${smokeDetectorId} .message `,
      openOnSiteCodes: keyCodesToArray(['6', 'o', numpad('6', constants)]),
      openOnMSCodes: keyCodesToArray(['7', 'm', numpad('7', constants)]),
      buttonKeyCodes: [],
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
   * getDataForUrl - Loads MetaSmoke data for a specified post url.
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
      flags.users.some(({username}) => username === fire.chatUser.name);
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
        // May need to handle the posibility that there will be multiple pages
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
   * @param {object}  data          A MetaSmoke report
   * @param {boolean} openAfterLoad Open the report popup after load?
   * @param {object}  $this         The clicked FIRE report button
   * @param {boolean} skipLoadPost  skip loading additional data fot the post?
   */
  function parseDataForReport(data, openAfterLoad, $this, skipLoadPost) {
    data.is_answer = data.link.includes('/a/');
    data.site = parseSiteUrl(data.link);
    data.is_deleted = data.deleted_at !== null;
    data.message_id = parseInt($this.closest('.message')[0].id.split('-')[1], 10);

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

    if (!sites.storedAt) { // If the site data is empy
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
   * @param {object} report The MetaSmoke report.
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

          if (typeof autoflagging !== 'undefined') { // eslint-disable-line no-undef
            $(`#message-${report.message_id} .content`).addClass('ai-deleted');

            // The post is deleted, but MetaSmoke doesn't know it yet.
            if (fire.userData.metasmokeWriteToken)
              metapi.deletedPost(report.id, fire.api.ms.key, fire.userData.metasmokeWriteToken, $.noop);
          }

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
   * @param {object} report The MetaSmoke report.
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
   * @param {object} report The MetaSmoke report.
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
   * @param {number} page     The page that's been loaed.
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
   * @param   {function} config.call    The jquery AJAX call to use.
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
   * getWriteToken - Gets a MetaSmoke write token.
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
          toastr.success('Successfully obtained MetaSmoke write token!');
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
    if (event_type === 1 && user_id === fire.smokeDetectorId) {
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

        const fireButton = _('span', 'fire-button', {
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
   * keyboardShortcuts - Handle keypress events for the popup.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} e the jQuery keyboard event
   */
  function keyboardShortcuts(e) {
    const c = fire.constants;
    if (e.altKey || e.ctrlKey || e.metaKey)
      // Do nothing if any of the Alt, Ctrl, or Meta keys are pressed (opening the popup with Ctrl-Space is handled elsewhere).
      // This prevents conflicts with browser-based shortcuts (e.g. Ctrl-F being used as FP).
      return;
    if (e.keyCode === c.keys.enter || e.keyCode === c.keys.space) {
      e.preventDefault();

      const selector = '.fire-popup-header a.button.focus';
      $(selector)
        .fadeOut(c.buttonFade)           // Flash to indicate which button was selected.
        .fadeIn(c.buttonFade, () => $(selector).click());
    } else {
      if (!fire.settingsAreOpen && e.keyCode < c.keys.F1) // Allow interaction with settings popup.
        e.preventDefault(); // Prevent keys from entering the chat input while the popup is open
      if (fire.buttonKeyCodes.includes(e.keyCode) && !fire.settingsAreOpen) {
        $('.fire-popup-header a.button')
          .removeClass('focus')
          .trigger('mouseleave');

        const $button = $(`.fire-popup-header a[fire-key~=${e.keyCode}]:not([disabled])`);
        const button = $button[0]; // eslint-disable-line prefer-destructuring

        if (button) {
          if (e.keyCode === c.keys.esc) { // [Esc] key
            $button.click();
          } else if (fire.openOnSiteCodes.includes(e.keyCode) || fire.openOnMSCodes.includes(e.keyCode)) { // Open the report on the site
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
          const $button = $(`a[fire-key~=${e.keyCode}]:not([disabled])`);
          if ($button[0])
            $button.click();
        }
      } else if (fire.settingsAreOpen && e.keyCode === c.keys.esc) {
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
     * Open the "Request authorization" MetaSmoke page.
     *
     * @private
     */
    requestToken: () => {
      window.open(`https://metasmoke.erwaysoftware.com/oauth/request?key=${fire.api.ms.key}`, '_blank');
    },
    /**
     * Request a token from the MetaSmoke code.
     *
     * @private
     *
     * @param {object} input      The input DOM node that contains the code.
     * @param {function} callback The callback that receives the MetaSmoke code.
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
   * @param {function} callback The action to perform after getting a write token / chosing read-only mode.
   */
  function writeTokenPopup(callback) {
    const input = _('input', 'fire-popup-input', {
      type: 'text',
      maxlength: '8',
      placeholder: 'Enter code here'
    });

    _('div', 'fire-popup-modal')
      .appendTo('body')
      .click(closePopup);

    _('div', 'fire-popup')
      .css({top: '5%', left: getPopupLeft()})
      .append(
        _('div', 'fire-popup-header')
          .append(_('p', {
            html: 'FIRE requires a MetaSmoke write token to submit feedback.<br />' +
                  'This requires that your MetaSmoke account has the "Reviewer" role. <br />' +
                  'Once you\'ve authenticated FIRE with MetaSmoke, you\'ll be given a code.<br />'
          }))
          .append(button('Request Token', clickHandlers.requestToken))
          .append(input)
          .append(button('Save', () => clickHandlers.saveToken(input, callback)))
          .append(br())
          .append(br())
          .append(_('p', {
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
      getWriteToken(() => openReportPopup.call(that)); // Open the popup later
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

    const openOnSiteButton = _('a', 'fire-site-logo', {
      html: site ? site.name : d.site,
      href: d.link,
      target: '_blank',
      css: {'background-image': `url(${siteIcon})`},
      'fire-key': fire.openOnSiteCodes,
      'fire-tooltip': 'Show on site'
    });

    const openOnMSButton = _('a', 'button fire-metasmoke-button', {
      text: 'MS',
      href: `http://m.erwaysoftware.com/posts/by-url?url=${d.link}`,
      target: '_blank',
      'fire-key': fire.openOnMSCodes,
      'fire-tooltip': 'Open on MetaSmoke'
    });

    const top = _('p', 'fire-popup-header')
      .append(createCloseButton(closePopup))
      .append(openOnMSButton)
      .append(openOnSiteButton)
      .append(br());

    if (!fire.userData.readOnly) {
      top
        .append(createFeedbackButton(d, ['1', 'k', numpad('1')], 'spam', 'tpu-', 'True positive'))
        .append(createFeedbackButton(d, ['2', 'r', numpad('2')], 'rude', 'rude', 'Rude / Abusive'))
        .append(createFeedbackButton(d, ['3', 'v', numpad('3')], 'tp-', 'tp-', 'Vandalism'))
        .append(createFeedbackButton(d, ['4', 'n', numpad('4')], 'naa-', 'naa-', 'Not an Answer / VLQ'))
        .append(createFeedbackButton(d, ['5', 'f', numpad('5')], 'fp-', 'fp-', 'False Positive'))
        .append(br());
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

    const reportBody = $('<div/>')
      .text(d.body) // Escape everything.
      .html()       // Get the escaped HTML, unescape whitelisted tags.
      .replace(/&lt;(\/?([abpsu]|[hb]r|[uo]l|li|h\d|code|pre|strong|em|img).*?)&gt;/gi, '<$1>')
      .replace(/<(\/ ?)?(script|style|link)/gi, '&lt;$1$2')
      .replace(/(script|style|link)>/gi, '$1&gt;');

    const userName = `${d.username}<span class="fire-user-reputation"></span>`;

    const body = _('div', 'fire-popup-body')
      .append(
        _('div', {
          'fire-tooltip': emojiOrImage('clipboard')
            .append(` - The reported post is a${suffix} ${postType.toLowerCase()}.\n\n${d.why}`)
            .html()
        })
        .append(_('h2', 'fire-post-title')
          .append(_('em', {html: title}))
        )
        .append(_('hr'))
        .append(
          _('div', 'fire-report-info')
          .append(_('h3', 'fire-type', {text: `${postType}:`}))
          .append(
            _('span', 'fire-username', {html: userName, title: 'Username'})
              .append(emojiOrImage('user'))
          )
        )
      )
      .append(_('div', `fire-reported-post${d.is_deleted ? ' fire-deleted' : ''}`)
        .append(reportBody)
      );

    _('div', 'fire-popup-modal')
      .appendTo('body')
      .click(closePopup);

    const versionLink = _('a', 'fire-version-link', {
      text: fire.metaData.version,
      href: `${fire.metaData.downloadURL}?${new Date().getTime()}`,
      target: '_self',
      title: 'Update'
    });

    const settingsButton = _('a', 'fire-settings-button', {
      html: emojiOrImage('gear'),
      click: openSettingsPopup,
      'fire-key': keyCodesToArray('s'),
      'fire-tooltip': 'FIRE Configuration'
    });

    _('div', `fire-popup${fire.userData.readOnly ? ' fire-readonly' : ''}`)
      .css({top: '5%', left: getPopupLeft()})
      .append(top)
      .append(body)
      .append(settingsButton)
      .append(versionLink)
      .hide()
      .appendTo('body')
      .fadeIn('fast');

    hideReportImages();

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
  }

  /**
   * hideReportImages - Hides images in a report.
   */
  function hideReportImages() {
    if (fire.userData.hideImages) {
      $('.fire-reported-post img').each((i, element) => {
        const img = $(element);
        img.data('src', element.src);
        img.one('click', e => {
          img.attr('src', img.data('src'));
          e.preventDefault();
        });
        element.src = 'http://placehold.it/550x100//ffffff?text=Click+to+show+image.';
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

    const popup = _('div', 'fire-popup', {id: 'fire-settings'})
      .css({top: '5%', left: getPopupLeft()});

    const top = _('p', 'fire-popup-header')
      .append(
        _('h2')
          .append(emojiOrImage('fire', true))
          .append(' FIRE settings.'))
      .append(createCloseButton(closePopup));

    const toastDurationElements = _('div')
      .append(
        _('span', {text: 'Notification popup duration:'})
          .append(br())
          .append(_('input', {
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
    const positionSelect = _('select', 'fire-position-select', {change: toastrPositionChangeHandler});

    for (const val of toastrClasses) {
      positionSelect.append(
        _('option', {
          value: val,
          text: val.replace(/-/g, ' '),
          selected: val === selected
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
      requestStackExchangeTokenButton = _('p', 'fire-request-write-token')
        .append(br())
        .append(_('h3', {text: 'Stack Exchange write token:'}))
        .append(_('p', {
          html:
            'Authorize FIRE with your Stack Exchange account.<br />' +
            'This allows FIRE to load additional data for reported posts.'
        }))
        .append(button('Authorize FIRE with Stack Exchange', requestStackExchangeToken));
    }

    const positionSelector = _('div')
      .append(br())
      .append(
        _('span', {text: 'Notification popup position:'})
          .append(br())
          .append(positionSelect)
        );

    const container = _('div')
      .append(
        _('div', 'fire-settings-section fire-settings-left')
          .append(createSettingsCheckBox('blur', fire.userData.blur, blurOptionClickHandler,
            'Enable blur on popup background.',
            'Popup blur:'
          ))
          .append(br())
          .append(createSettingsCheckBox('flag', fire.userData.flag, flagOptionClickHandler,
            'Also submit "Spam" flag with "tpu-" feedback.',
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
        _('div', 'fire-settings-section fire-settings-right')
          .append(_('h3', {text: 'Notifications:'}))
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

      delete fire.settingsAreOpen;
    } else {
      const selector = '.fire-popup, .fire-popup-modal';
      $(selector)
        .fadeOut('fast', () => $(selector).remove());

      $(document)
        .off('keydown', keyboardShortcuts)
        .off('click', '.fire-popup-body pre');

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
   * postMetaSmokeFeedback - Submit MetaSmoke feedback.
   *
   * @private
   * @memberof module:fire
   *
   * @param {object} data    The report data.
   * @param {string} verdict The chosen verdict.
   * @param {object} button  The clicked button.
   */
  function postMetaSmokeFeedback(data, verdict, button) {
    if (!fire.sendingFeedback && !$(button).attr('disabled')) {
      fire.sendingFeedback = true;

      const {ms} = fire.api;
      const token = fire.userData.metasmokeWriteToken;
      if (data.has_sent_feedback) {
        const message = span('You have already sent feedback to MetaSmoke for this report.');
        if (verdict === 'tpu-') {
          postMetaSmokeSpamFlag(data, ms, token, message.after('<br /><br />'));
        } else {
          toastr.info(message);
          closePopup();
        }
      } else {
        let msVerdict = verdict;
        if (verdict === 'rude') {
          msVerdict = 'tpu-';
          toastr.info('"Rude / Abusive" flagging isn\'t implemented yet.<br />' +
            'If you wish to flag this as well, please select "tpu-"');
        }

        $.ajax({
          type: 'POST',
          url: `${ms.urlV1}w/post/${data.id}/feedback`, // V2.0 appears broken at this time. Using V1.
          data: {type: msVerdict, key: ms.key, token}
        })
        .done(() => {
          const message = span(`Sent feedback "<em>${verdict}"</em> to metasmoke.`);
          if (verdict === 'tpu-' && fire.userData.flag) {
            postMetaSmokeSpamFlag(data, ms, token, message.after('<br /><br />'));
          } else {
            toastr.success(message);
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
            toastr.error('An error occurred sending post feedback to metasmoke.');
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
   * postMetaSmokeSpamFlag - Flag the post as spam.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {object} data            The report data.
   * @param   {object} api             API configuration object, containing:
   * @param   {string} api.url         The API url.
   * @param   {string} api.key         The API key.
   * @param   {string} token           The MetaSmoke write token.
   * @param   {object} feedbackSuccess A jQuery DOM node containing the feedback success message.
   * @returns {undefined}              returns undefined to break out of the function.
   */
  function postMetaSmokeSpamFlag(data, {url, key}, token, feedbackSuccess) {
    /* TODO: fix this
    let site = fire.sites[data.site];
    if (!site.account) {
      toastr.info(feedbackSuccess.after(span("You don't have an account on this site, so you can't cast a spam flag.")));
      debugger;
      window.open(site.site_url + "/users/join");
    } else if (site.account.reputation < 15) {
      toastr.info(feedbackSuccess.after(span("You don't have enough reputation on this site to cast a spam flag.")));
    } else */
    if (data.has_auto_flagged) {
      toastr.info(feedbackSuccess.after(span('You already autoflagged this post as spam.')));
    } else if (data.has_manual_flagged) {
      toastr.info(feedbackSuccess.after(span('You already flagged this post as spam.')));
    } else if (data.is_deleted) {
      toastr.info(feedbackSuccess.after(span('The reported post can\'t be flagged: It is already deleted.')));
    } else {
      $.ajax({
        type: 'POST',
        url: `${url}posts/${data.id}/flag`,
        data: {key, token}
      })
      .done(response => {
        toastr.success(feedbackSuccess.after(span('Successfully flagged the post as "spam".')));
        closePopup();

        if (response.backoff) {
          // We've got a backoff. Deal with it...
          // Yea, this isn't implemented yet. probably gonna set a timer for the backoff and
          // Re-execute any pending requests that were submitted during that time, afterwards.
          debugger; // eslint-disable-line no-debugger
          toastr.info('Backoff received');
          fire.info('Backoff received', data, response);
        }
      })
      .error(jqXHR => {
        toastr.success('Sent feedback <em>"tpu-"</em> to metasmoke.'); // We came from a "feedback" success handler.

        if (jqXHR.status === fire.constants.http.conflict) {
          // https://metasmoke.erwaysoftware.com/authentication/status
          // Will give you a 409 response with error_name, error_code and error_message parameters if the user isn't write-authenticated;
          toastr.error(
            'FIRE requires your MetaSmoke account to be write-authenticated with Stack Exchange in order to submit spam flags.<br />' +
            'Your MetaSmoke account doesn\'t appear to be write-authenticated.<br />' +
            'Please open <em><a href="https://metasmoke.erwaysoftware.com/authentication/status" target="_blank">this page</a></em> to authenticate with Stack Exchange.',
            null,
            {timeOut: 0, extendedTimeOut: 1000, progressBar: true});
          fire.error('Not write-authenticated', data, jqXHR);
        } else {
          if (jqXHR.responseText) {
            let response;
            try {
              response = JSON.parse(jqXHR.responseText);
            } catch (err) {
              response = {message: jqXHR.responseText};
            }

            if (response.message === 'Spam flag option not present') {
              toastr.info('This post could not be flagged.<br />' +
                'It is probably deleted already.');
              closePopup();
              return;
            }
          }

          // Will give you a 500 with status: 'failed' and a message if the spam flag fails;
          toastr.error('Something went wrong while attempting to submit a spam flag');
          fire.error('Something went wrong while attempting to submit a spam flag', data, jqXHR);
          fire.sendingFeedback = false;
        }
      });
      return;
    }
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
   * @param {number|string} num The value to get the keyCode for.
   * @param {object} constants An optional reference to FIRE's constants, for when `fire` is not yet declared.
   *
   * @returns {number} the keypad keyCode for the passed number.
   */
  function numpad(num, constants) {
    return String(num).charCodeAt(0) + (constants || fire.constants).numpadOffset;
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
   * @param   {string}                verdict  This button's MetaSmoke verdict
   * @param   {string}                tooltip  The tooltip to display for this button.
   * @returns {object}                         The constructed feedback button.
   */
  function createFeedbackButton(data, keyCodes, text, verdict, tooltip) {
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

    return _('a', `button fire-feedback-button fire-${verdict}${cssClass}`, {
      text: text + suffix,
      click: ({currentTarget}) => {
        if (!data.has_sent_feedback ||
          (fire.userData.flag && !(data.has_flagged || data.is_deleted)) // eslint-disable-line no-extra-parens
        ) {
          postMetaSmokeFeedback(data, verdict, currentTarget);
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
    return _('a', 'button fire-close-button', {
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
    const checkBox = _('input', {
      id: `checkbox_${id}`,
      type: 'checkbox',
      checked: value,
      click: handler
    });

    const label = _('label', {
      for: `checkbox_${id}`,
      text: labelText
    });

    return _('div')
      .append(_('h3', {text: headerText}))
      .append(checkBox)
      .append(label);
  }

  /**
   * _ - Wrapper to create a new element with a specified class.
   *
   * @private
   * @memberof module:fire
   *
   * @param   {string} tagName    The tag to create.
   * @param   {string} [cssClass] The tag's css class. Optional. If this is an object, this is assumed to be `options`.
   * @param   {object} [options]  The options to use for the created element.
   * @returns {object}            A jQuery DOM node.
   */
  function _(tagName, cssClass, options) {
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
    return _('br');
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
    return _('span', {html: contents});
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
    return _('a', 'button', {
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

    const emojiImage = _('img', `fire-emoji${large ? '-large' : ''}`, {
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

    // Toastr is a Javascript library for non-blocking notifications.
    injectScript(typeof toastr, '//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js', loadToastrCss, initializeToastr);
    injectScript(typeof metapi, '//charcoal-se.org/userscripts/metapi/metapi.js', registerWebSocket);

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
   * @param {string}   name       The global name to check against before injecting the script. Exapme: (`typeof myInjectedGlobal`)
   * @param {string}   path       The script's path.
   * @param {function} [callback] An optional "success" callback.
   * @param {function} [always]   An optional "always" callback.
   */
  function injectScript(name, path, callback, always) {
    if (name === 'undefined') {
      $.ajaxSetup({cache: true});
      $.getScript(`${path}?fire=${fire.metaData.version}`)
        .done(callback || $.noop)
        .done(() => fire.log('Script loaded: ', path))
        .fail(() => fire.error('Script failed to load: ', path))
        .always(always || $.noop)
        .always(() => $.ajaxSetup({cache: false}));
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
    $(document).on('keydown', ({keyCode, ctrlKey}) => {
      if (keyCode === fire.constants.keys.space && ctrlKey) {
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
          _('span', 'fire-tooltip', {html: element.attr('fire-tooltip')})
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
   * registerWebSocket - Register a websocket listener.
   *
   * @private
   * @memberof module:fire
   */
  function registerWebSocket() {
    metapi.watchSocket(fire.api.ms.key, socketOnMessage);
    fire.log('Websocket initialized.');
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
      set: value => localStorage.setItem(localStorageKey, JSON.stringify(value))
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
    const chat = $('#chat');

    chat.one('DOMSubtreeModified', () => {
      // We need another timeout here, because the first modification occurs before
      // the new (old) chat messages are loaded.
      setTimeout(() => {
        if (chat.html().length === 0) { // Too soon
          setTimeout(decorateExistingMessages, timeout, timeout);
        } else { // Chat messages have loaded
          $(fire.SDMessageSelector).each((i, element) => decorateMessage(element));

          fire.log('Decorated existing messages.');

          /*
          TODO: Load Stack Exchange data for each report
          updateReportCache();
          */
        }
      }, timeout);
    });
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
   */
  function getCurrentChatUser() {
    setTimeout(() => { // This code was too fast for FireFox
      CHAT.RoomUsers
        .get(CHAT.CURRENT_USER_ID)
        .done(user => {
          fire.chatUser = user;

          fire.log('Current user found.');
        });
    }, fire.constants.loadUserDelay); // Maybe this is enough?
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
    /**
     * @memberof module:fire
     */
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
      emoji: {fire: '🔥', user: '👤', gear: '⚙️', pencil: '✏️️', smile: '😄', clipboard: '📋', flag: '🏳️', autoflag: '🏴'},
      emojiSize: 16,
      siteDataCacheTime: 604800000, // 604800000 ms is 7 days (7 * 24 * 60 * 60 * 1000)
      hex: 16,
      metaSmokeCodeLength: 8,
      numpadOffset: 48,
      buttonFade: 100,
      loadAllMessagesDelay: 500,
      loadUserDelay: 500,
      tooltipOffset: 20,
      tooltipOffsetSmall: 5,
      halfPopupWidth: 300,
      minPopupLeft: 10
    };
  }
})();

/**
 * This is a callback that is passed a single report's data.
 *
 * @callback singleReportCallback
 * @param {object} reportData The data for the loaded report.
 */
