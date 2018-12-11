// ==UserScript==
// @name        MS Review Keyboard Shortcuts
// @description Adds keyboard shortcuts to the review queues on metasmoke.
// @author      ArtOfCode
// @version     0.2.2
// @namespace   charcoal-se.org
// @match       https://metasmoke.erwaysoftware.com/review/*
// @updateURL   https://github.com/Charcoal-SE/userscripts/raw/master/review-keyboard-shortcuts/review-shortcuts.user.js
// @downloadURL https://github.com/Charcoal-SE/userscripts/raw/master/review-keyboard-shortcuts/review-shortcuts.user.js
// ==/UserScript==

$(document).ready(() => {
  const queueSpecificActions = {
    'untagged-domains': {
      t: () => {
        $('select').first().selectpicker('toggle');
      }
    },

    'posts': { // eslint-disable-line quote-props
      k: () => {
        $('.review-submit-link[data-response="tp"]').click();
      },

      v: () => {
        $('.review-submit-link[data-response="tp"]').click();
      }
    }
  };

  const setupDataAttributes = ev => {
    const $tgt = $(ev.target);
    $tgt.attr('data-response', /response=(.*)/.exec($tgt.attr('href'))[1])
        .attr('data-shortcut', $tgt.data('response').charAt(0).toLowerCase());
  };

  $('.review-submit-link').each((i, e) => setupDataAttributes({target: e}));
  $(document).on('DOMNodeInserted', ev => {
    if ($(ev.target).hasClass('review-submit-link')) {
      setupDataAttributes(ev);
    }

    const found = $(ev.target).find('.review-submit-link');
    if (found.length > 0) {
      found.each((i, e) => {
        if ($(e).attr('data-response') && $(e).attr('data-shortcut')) {
          return;
        }

        setupDataAttributes({target: e});
      });
    }
  });

  $(document).on('keydown', ev => {
    const key = ev.key.toLowerCase();
    const response = $(`.review-submit-link[data-shortcut="${key}"]`);
    if (response.length > 0) {
      response.first().click();
      return;
    }

    const queue = /\/review\/([^\/]+)/.exec(location.pathname)[1]; // eslint-disable-line no-useless-escape
    if (queueSpecificActions[queue] && queueSpecificActions[queue][key]) {
      queueSpecificActions[queue][key](ev);
      return;
    }
  });

  $(document).on('keydown', 'input', ev => {
    ev.stopPropagation();
  });
});

