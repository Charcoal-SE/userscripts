// ==UserScript==
// @name        Flag Instantly, Rapidly, Effortlessly
// @namespace   https://github.com/Charcoal-SE/
// @description FIRE adds a button to SmokeDetector reports that allows you to provide feedback & flag, all from chat.
// @author      Cerbrus
// @attribution Michiel Dommerholt (https://github.com/Cerbrus)
// @version     0.9.6
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fire/fire.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.stackexchange.com/rooms/11540/charcoal-hq*
// @match       *://chat.stackoverflow.com/rooms/41570/so-close-vote-reviewers*
// @match       *://chat.meta.stackexchange.com/rooms/89/tavern-on-the-meta*
// @require     https://charcoal-se.org/userscripts/metapi/metapi.js
// @grant       none
// ==/UserScript==

(() => {
  (scope => { // Init
    const hOP = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);

    const smokeDetectorId = { // This is Smokey's user ID for each supported domain
      'chat.stackexchange.com': 120914,
      'chat.stackoverflow.com': 3735529,
      'chat.meta.stackexchange.com': 266345
    }[location.host];       // From which, we need the current host's ID

    scope.fire = {
      metaData: GM_info.script || GM_info['Flag Instantly, Rapidly, Effortlessly'],
      api: {
        ms: {
          key: '55c3b1f85a2db5922700c36b49583ce1a047aabc4cf5f06ba5ba5eff217faca6', // This script's MetaSmoke API key
          url: 'https://metasmoke.erwaysoftware.com/api/'
        },
        se: {
          key: 'NDllMffmzoX8A6RPHEPVXQ((', // This script's Stack Exchange API key
          url: 'https://api.stackexchange.com/2.2/',
          clientId: 9136
        }
      },
      smokeDetectorId,
      SDMessageSelector: `.user-${smokeDetectorId} .message `,
      openOnSiteCodes: keyCodesToArray(['6', 'o']),
      openOnMSCodes: keyCodesToArray(['7', 'm']),
      buttonKeyCodes: [],
      reportCache: {},
      openReportPopupForMessage,
      decorateMessage
    };

    const defaultLocalStorage = {
      blur: true,
      flag: true,
      debug: false,
      toastrPosition: 'top-right',
      toastrDuration: 2500,
      readOnly: false,
      version: fire.metaData.version
    };

    setFireConstants();
    registerLoggingFunctions();
    hasEmojiSupport();
    initLocalStorage(hOP, defaultLocalStorage);
    getCurrentChatUser();
    loadStackExchangeSites();
    injectExternalScripts();
    registerWebSocket();
    showFireOnExistingMessages();
    registerAnchorHover();
    registerOpenLastReportKey();
    CHAT.addEventHandlerHook(chatListener);

    checkHashForWriteToken();
  })(window);

  // Request a Stack Exchange Write token for this app.
  function requestStackExchangeToken() {
    const url = `https://stackexchange.com/oauth/dialog?client_id=${fire.api.se.clientId}&scope=${encodeURIComponent('no_expiry')}&redirect_uri=${encodeURIComponent(location.href)}`;

    // Register the focus event to check if the write token was successfully obtained
    $(window).on('focus', checkWriteTokenSuccess);

    window.open(url);
  }

  // Check the url hash to see if a write token has been obtained. If so, parse it.
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

  // Check if the write token was successfully obtained
  function checkWriteTokenSuccess() {
    if (fire.userData.stackexchangeWriteToken) {
      toastr.success('Successfully obtained Stack Exchange write token!');
      $('.fire-popup .fire-request-write-token').remove();
      $(window).off('focus', checkWriteTokenSuccess);
    }
  }

  // Loads MetaSmoke data for a specified post url
  function getDataForUrl(reportedUrl, callback) {
    const {ms} = fire.api;
    const url = `${ms.url}posts/urls?key=${ms.key}&page=1&urls=${reportedUrl}`;
    $.get(url, data => {
      if (data && data.items)
        callback(data.items[0]);
    });
  }

  // Checks if the list of users on this flag report contains the current user.
  function listHasCurrentUser(flags) {
    return flags &&
      flags.users.some(({username}) => username === fire.chatUser.name);
  }

  // Loads a report's data when you hover over the FIRE button.
  function loadDataForReport(openAfterLoad) {
    const $this = $(this);
    const url = $this.data('url');

    if (!fire.reportCache[url])
      getDataForUrl(url, data => parseDataForReport(data, openAfterLoad, $this));
    else if (openAfterLoad === true)
      $this.click();
  }

  // Loads all MS data on the page;
  function updateReportCache() { // eslint-disable-line no-unused-vars
    const urls = $('.fire-button')
      .map((index, element) => $(element).data('url'))
      .toArray()
      .filter(url => !fire.reportCache[url]) // Only get un-cached reports
      .join(encodeURIComponent(';'));

    const {ms} = fire.api;
    const url = `${ms.url}posts/urls?key=${ms.key}&page=1&urls=${urls}`;
    $.get(url, response => {
      fire.log('Report cache updated:', response);
      if (response && response.items) {
        for (const item of response.items)
          parseDataForReport(item, false, null, true);
      }
    });
  }

  // Parse a report's loaded data
  function parseDataForReport(data, openAfterLoad, $this, skipLoadPost) {
    data.is_answer = data.link.includes('/a/');
    data.site = parseSiteUrl(data.link);
    data.is_deleted = data.deleted_at !== null;

    data.has_auto_flagged = listHasCurrentUser(data.autoflagged) && data.autoflagged.flagged;
    data.has_manual_flagged = listHasCurrentUser(data.manual_flags);
    data.has_flagged = data.has_auto_flagged || data.has_manual_flagged;

    data.has_sent_feedback = data.feedbacks.some( // Feedback has been sent already
      ({user_name}) => user_name === fire.chatUser.name
    );

    const match = data.link.match(/\d+/);
    if (match && match[0])
      [data.post_id] = match;

    fire.reportCache[data.link] = data; // Store the data

    fire.log('Loaded report data', data);

    if (!skipLoadPost)
      loadPost(data);

    if (openAfterLoad === true)
      $this.click();
  }

  // Parse a site url into a api parameter
  function parseSiteUrl(url) {
    return url.split('.com')[0]
      .replace(/\.stackexchange|(https?:)?\/+/g, '');
  }

  // Loads a list of all Stack Exchange Sites.
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

  // Loads a post
  function loadPost(report) {
    const parameters = {site: report.site};

    getSE(
      `posts/${report.post_id}`,
      parameters,
      response => {
        if (response.items && response.items.length > 0) {
          report.se = report.se || {};
          [report.se.post] = response.items;
          loadPostFlagStatus(report);
          loadPostRevisions(report);
        } else {
          report.is_deleted = true;
          $('.fire-reported-post').addClass('fire-deleted');

          if (report.has_sent_feedback)
            $('a.fire-feedback-button:not([disabled])').attr('disabled', true);
        }

        fire.log('Loaded a post', response);
      });
  }

  // Loads a post's revision history
  function loadPostRevisions(report) {
    const parameters = {site: report.site};

    getSE(
      `posts/${report.post_id}/revisions`,
      parameters,
      response => {
        if (response && response.items) {
          report.se.revisions = response.items;
          report.revision_count = response.items.length;

          if (report.revision_count)
            showEditedIcon();

          fire.log('Loaded a post\'s revision status', response);
        }
      });
  }

  // Render a "Edited" icon
  function showEditedIcon() {
    const h2 = $('.fire-popup-body > h2');
    if (!h2.data('has-edit-icon')) {
      $('.fire-popup-body > h2')
        .prepend(
          emojiOrImage('pencil')
            .attr('fire-tooltip', 'This post has been edited.')
            .after(' ')
        )
        .data('has-edit-icon', true);
    }
  }

  // Loads a post's flagging status
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
        report.has_flagged = response.items && response.items.some(({has_flagged, title}) => !has_flagged && title === 'spam');

        fire.log('Loaded a post\'s flag status', response);
      });
  }

  // Loads the current SE user and what sites they're registered at.
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

  // Parse the user response.
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

  // Get call on the Stack Exchange API
  function getSE(method, parameters, success, error, always) {
    stackExchangeAjaxCall(method, parameters, {
      call: $.get,
      success,
      error,
      always
    });
  }

  /*
  // post call on the Stack Exchange API
  function postSE(method, parameters, success, error, always) {
   stackExchangeAjaxCall(method, parameters, {
     call: $.post
     success,
     error,
     always
   });
  }
  */

  // AJAX call on the Stack Exchange API
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

  // Gets a MetaSmoke write token
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
        toastr.info('FIRE is not in read-only mode.');
        closePopup();

        if (afterGetToken)
          afterGetToken();
      }
    });
  }

  // Chat message event listener. If SmokeDetector reports another post, decorate the message
  function chatListener({event_type, user_id, message_id}) {
    if (event_type === 1 && user_id === fire.smokeDetectorId) {
      setTimeout(() => {
        const message = $(`#message-${message_id}`);
        decorateMessage(message);
      });
    }
  }

  // Adds the "FIRE" button to the passed message
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
        if (urlOnReportLink)
          reportedUrl = reportLink[0].href.split('url=').pop();
        else
          reportedUrl = reportLink.nextAll('a')[0].href.replace(/https?:/, '');

        if (reportedUrl.startsWith('//github.com') ||
          reportedUrl.includes('erwaysoftware.com') ||
          reportedUrl.includes('/users/'))
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

  // Filter a jQuery list on the element text.
  function filterOnContents($object, text) {
    return $object.filter((i, element) => $(element).text() === text);
  }

  // Set the toastr class
  function toastrPositionChangeHandler() {
    const value = $(this).val();

    const data = fire.userData;
    data.toastrPosition = value;
    toastr.options.positionClass = `toast-${value}`;

    $('#toast-container').remove();
    toastr.info('Notification position updated.');
    fire.userData = data;
  }

  // Update the toastr duration
  function toastrDurationHandler() {
    const value = $(this).val();

    const data = fire.userData;
    data.toastrDuration = value;
    toastr.options.timeOut = value;

    $('#toast-container').remove();
    fire.userData = data;
  }

  // Set the "Blur" option
  function blurOptionClickHandler() {
    boolOptionClickHandler(this, 'Blur', 'blur', () => {
      $('#container').toggleClass('fire-blur', fire.userData.blur);
    });
  }

  // Set the "Flag" option
  function flagOptionClickHandler() {
    boolOptionClickHandler(this, 'Flagging on "tpu-" feedback', 'flag');
  }

  // Set the "Debug" option
  function debugOptionClickHandler() {
    boolOptionClickHandler(this, 'Debug mode', 'debug');
  }

  // Set a bool option
  function boolOptionClickHandler(element, message, key, callback) {
    const value = $(element).is(':checked');

    const data = fire.userData;
    data[key] = value;
    toastr.info(`${message} ${value ? 'en' : 'dis'}abled.`);
    fire.userData = data;

    if (callback)
      callback();
  }

  // Handle keypress events for the popup
  function keyboardShortcuts(e) {
    const c = fire.constants;
    if (e.keyCode === c.keys.enter || e.keyCode === c.keys.space) {
      e.preventDefault();

      const selector = '.fire-popup-header a.button.focus';
      $(selector)
        .fadeOut(c.buttonFade)           // Flash to indicate which button was selected.
        .fadeIn(c.buttonFade, () => $(selector).click());
    } else if (fire.buttonKeyCodes.includes(e.keyCode) && !fire.settingsAreOpen) {
      e.preventDefault();

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

  // Opens a report popup for a specific message
  function openReportPopupForMessage(message) {
    loadDataForReport.call(
      $(message).find('.fire-button'),
      true
    );
  }

  const clickHandlers = {
    requestToken: () => window.open(`https://metasmoke.erwaysoftware.com/oauth/request?key=${fire.api.ms.key}`, '_blank'),
    saveToken: (input, callback) => {
      const value = input.val();
      if (value && value.length === fire.constants.metaSmokeCodeLength)
        callback(value);
    },
    disableReadonly: () => {
      closePopup();
      closePopup();
      getWriteToken();
    }
  };

  // Open a popup to enter the write token
  function writeTokenPopup(callback) {
    const w = (window.innerWidth - $('#sidebar').width()) / 2;
    const input = _('input', 'fire-popup-input', {
      type: 'text',
      maxlength: '7',
      placeholder: 'Enter code here'
    });

    _('div', 'fire-popup-modal')
      .appendTo('body')
      .click(closePopup);

    _('div', 'fire-popup')
      .css({top: '5%', left: w - fire.constants.halfPopupWidth})
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

  // Build a popup and show it.
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

    const w = (window.innerWidth - $('#sidebar').width()) / 2;
    const site = fire.sites[d.site];
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
        .append(createFeedbackButton(d, ['1', 'k'], 'spam', 'tpu-', 'True positive'))
        .append(createFeedbackButton(d, ['2', 'r'], 'rude', 'rude', 'Rude / Abusive'))
        .append(createFeedbackButton(d, ['3', 'v'], 'tp-', 'tp-', 'Vandalism'))
        .append(createFeedbackButton(d, ['4', 'n'], 'naa-', 'naa-', 'Not an Answer / VLQ'))
        .append(createFeedbackButton(d, ['5', 'f'], 'fp-', 'fp-', 'False Positive'))
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

    let title;

    if (d.has_auto_flagged) {
      title = emojiOrImage('autoflag')
        .attr('fire-tooltip', 'You have auto-flagged this post.')
        .append(` ${d.title}`);
    } else if (d.has_flagged) {
      title = emojiOrImage('flag')
        .attr('fire-tooltip', 'You have flagged this post.')
        .append(` ${d.title}`);
    } else {
      title = d.title; // eslint-disable-line prefer-destructuring
    }

    const body = _('div', 'fire-popup-body')
      .append(_('h2')
        .append(_('em', {html: title}))
      )
      .append(_('hr'))
      .append(
        _('div', 'fire-report-info', {
          'fire-tooltip': emojiOrImage('clipboard')
            .append(` - The reported post is a${suffix} ${postType.toLowerCase()}.\nReason weight: ${d.reason_weight}\n\n${d.why}`)
            .html()
        })
        .append(_('h3', 'fire-type', {text: `${postType}:`}))
        .append(
          _('span', 'fire-username', {text: `${d.username} `, title: 'Username'})
            .append(emojiOrImage('user'))
        )
      )
      .append(_('div', `fire-reported-post${d.is_deleted ? ' fire-deleted' : ''}`)
        .append(d.body.replace(/<script/g, '&lt;script'))
      );

    body.find('pre code').each(() => {
      this.innerHTML = this.innerHTML
        .replace(/>/g, '&gt;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
    });

    _('div', 'fire-popup-modal')
      .appendTo('body')
      .click(closePopup);

    const settingsButton = _('a', 'fire-settings-button', {
      html: emojiOrImage('gear'),
      click: openSettingsPopup,
      'fire-key': keyCodesToArray('s'),
      'fire-tooltip': 'FIRE Configuration'
    });

    _('div', `fire-popup${fire.userData.readOnly ? ' fire-readonly' : ''}`)
      .css({top: '5%', left: w - fire.constants.halfPopupWidth})
      .append(top)
      .append(body)
      .append(settingsButton)
      .hide()
      .appendTo('body')
      .fadeIn('fast');

    if (d.revision_count)
      showEditedIcon();

    $('#container').toggleClass('fire-blur', fire.userData.blur);

    expandLinksOnHover();

    $(document).keydown(keyboardShortcuts);
    $(document).on(
      'click',
      '.fire-popup-body pre',
      ({currentTarget}) => $(currentTarget).toggleClass('fire-expanded')
    );
  }

  // Opens a popup to change fire's settings
  function openSettingsPopup() {
    if (fire.settingsAreOpen)
      return; // Don't open the settings twice.

    fire.settingsAreOpen = true;

    const w = (window.innerWidth - $('#sidebar').width()) / 2;
    const popup = _('div', 'fire-popup', {id: 'fire-settings'})
      .css({top: '5%', left: w - fire.constants.halfPopupWidth});

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
          .append(createSettingscheckBox('blur', fire.userData.blur, blurOptionClickHandler,
            'Enable blur on popup background.',
            'Popup blur:'
          ))
          .append(br())
          .append(createSettingscheckBox('flag', fire.userData.flag, flagOptionClickHandler,
            'Also submit "Spam" flag with "tpu-" feedback.',
            'Flag on feedback:')
          )
          .append(br())
          .append(createSettingscheckBox('debug', fire.userData.debug, debugOptionClickHandler,
            'Enable FIRE logging in developer console.',
            'Debug mode:')
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

  // Close the popup
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

      $(document).off('keydown', keyboardShortcuts);

      $('#container').removeClass('fire-blur');

      const previous = fire.isOpen;
      delete fire.isOpen;

      return previous; // Return the previously closed popup's button so it can be re-opened
    }

    return null;
  }

  // Submit MS feedback
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
          url: `${ms.url}w/post/${data.id}/feedback`,
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

  // Flag the post as spam
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
        url: `${url}w/post/${data.id}/spam_flag`,
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
            const response = JSON.parse(jqXHR.responseText);

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

  // Structure the keyCodes Array.
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

  // Create a feedback button for the top of the popup
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

  // Create a button to close a popup
  function createCloseButton(clickHandler) {
    return _('a', 'button fire-close-button', {
      text: 'Close',
      title: 'Close this popup',
      click: clickHandler,
      'fire-tooltip': 'Close popup',
      'fire-key': keyCodesToArray(fire.constants.keys.esc) // Escape key code,
    });
  }

  // Creates a input[type=checkbox] for the settings
  function createSettingscheckBox(id, value, handler, labelText, headerText) {
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

  // Wrapper to create a new element with a specified class.
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

  // Create a linebreak
  function br() {
    return _('br');
  }

  // Create a `<span>` with the specified contents.
  function span(contents) {
    return _('span', {html: contents});
  }

  // Create a button
  function button(text, clickHandler) {
    return _('a', 'button', {
      text,
      click: clickHandler
    });
  }

  // Detect Emoji support in this browser
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

  // Returns the emoji if it's supported. Otherwise, return a fallback image.
  function emojiOrImage(emoji, large) {
    emoji = fire.constants.emoji[emoji] || emoji;

    if (fire.useEmoji)
      return span(emoji);

    const url = 'https://raw.githubusercontent.com/Ranks/emojione/master/assets/png/';
    const hex = emoji.codePointAt(0).toString(fire.constants.hex);

    const emojiImage = _('img', `fire-emoji${large ? '-large' : ''}`, {
      src: `${url + hex}.png`,
      alt: emoji
    });

    return span(emojiImage);
  }

  // Inject FIRE stylesheet and Toastr library
  function injectExternalScripts() {
    injectCSS('//charcoal-se.org/userscripts/fire/fire.css');

    // Toastr is a Javascript library for non-blocking notifications.
    injectScript(typeof toastr, '//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js', loadToastrCss, initializeToastr);

    fire.log('Injected scripts and stylesheets.');
  }

  // Inject the specified stylesheet
  function injectCSS(path) {
    const css = window.document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${path}?fire=${fire.metaData.version}`;
    document.head.appendChild(css);
  }

  // Inject the specified script
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

  // Load toastr css
  function loadToastrCss() {
    injectCSS('//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css');
  }

  // Set toastr options
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
  }

  // Open the last report on [Ctrl]+[Space]
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

  // Register the "tooltip" hover for anchor elements
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

  // Register a websocket listener
  function registerWebSocket() {
    metapi.watchSocket(fire.api.ms.key, socketOnMessage);
    fire.log('Websocket initialized.');
  }

  // Adds a property on `fire` that's stored in `localStorage`
  function registerForLocalStorage(object, key, localStorageKey) {
    Object.defineProperty(object, key, {
      get: () => JSON.parse(localStorage.getItem(localStorageKey)),
      set: value => localStorage.setItem(localStorageKey, JSON.stringify(value))
    });
  }

  // Registers logging functions on `fire`
  function registerLoggingFunctions() {
    fire.log = getLogger('log');
    fire.info = getLogger('info');
    fire.warn = getLogger('warn');
    fire.error = getLogger('error');
  }

  // Adds the "FIRE" button to all existing messages and registers an event listener to do so after "load older messages" is clicked
  function showFireOnExistingMessages() {
    $('#getmore, #getmore-mine')
      .click(() => decorateExistingMessages(fire.constants.loadAllMessagesDelay));

    decorateExistingMessages(0);

    // Load report data on fire button hover
    $('body').on('mouseenter', '.fire-button', loadDataForReport);

    fire.log('Registered loadDataForReport');
  }

  // Decorate messages that exist on page load
  function decorateExistingMessages(timeout) {
    setTimeout(() => {
      const chat = $('#chat');
      chat.on('DOMSubtreeModified', () => {
        if (chat.html().length !== 0) { // Chat messages have loaded
          chat.off('DOMSubtreeModified');
          $(fire.SDMessageSelector).each((...args) => decorateMessage(args[1]));

          fire.log('Decorated existing messages.');

          /*
          TODO: Load SE data for each report
          updateReportCache();
          */
        }
      });
    }, timeout);
  }

  // Gets a log wrapper for the specified console function.
  function getLogger(fn) {
    return (...args) => {
      if ((fire.userData || localStorage['fire-user-data']).debug) {
        const logPrefix = `${fire.useEmoji ? `${fire.constants.emoji.fire} ` : ''}FIRE `;
        args.unshift(`${logPrefix + fn}:`);
        console[fn](...args); // eslint-disable-line no-console
      }
    };
  }

  // Handle socket messages
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

  // Expands anchor elements in the report's body on hover, to show the href.
  function expandLinksOnHover() {
    $('.fire-popup-body a').each((i, element) =>
      $(element).attr('fire-tooltip', element)
    );
  }

  // Initializes localStorage
  function initLocalStorage(hOP, defaultStorage) {
    registerForLocalStorage(fire, 'userData', 'fire-user-data');
    registerForLocalStorage(fire, 'userSites', 'fire-user-sites');
    registerForLocalStorage(fire, 'sites', 'fire-sites');

    if (fire.userData.debug)
      fire.info('Debug mode enabled.');

    if (fire.userData === null)
      fire.userData = defaultStorage;

    const data = fire.userData;
    for (const key in defaultStorage) {
      if (hOP(defaultStorage, key) && !hOP(data, key))
        data[key] = defaultStorage[key];
    }
    fire.userData = data;

    fire.log('Initialized localStorage.');
  }

  // Sets a value on `fire.userData`, stored in `localStorage`
  function setValue(key, value) {
    const data = fire.userData;
    data[key] = value;
    fire.userData = data;
  }

  // Removes a value from `fire.userData`, stored in `localStorage`
  function clearValue(key) {
    const data = fire.userData;
    delete data[key];
    fire.userData = data;
  }

  // Gets the currently logged-in user.
  function getCurrentChatUser() {
    setTimeout(() => { // This code was too fast for FireFox
      CHAT.RoomUsers
        .get(CHAT.CURRENT_USER_ID)
        .done(user => {
          fire.chatUser = user;

          fire.log('Current user found.');
        });
    });
  }

  // Sets constants
  function setFireConstants() {
    fire.constants = {
      keys: {
        enter: 13,
        esc: 27,
        space: 32
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
      metaSmokeCodeLength: 7,
      buttonFade: 100,
      loadAllMessagesDelay: 500,
      tooltipOffset: 20,
      tooltipOffsetSmall: 5,
      halfPopupWidth: 300
    };
  }
})();
