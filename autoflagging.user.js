// ==UserScript==
// @name        Autoflagging Information
// @namespace   https://github.com/Charcoal-SE/
// @description Adds autoflagging information to Charcoal HQ
// @author      Glorfindel
// @version     0.1
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging.user.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.stackexchange.com/rooms/11540/charcoal-hq
// @grant		none
// ==/UserScript==

/*global StackExchange, console, fdsc, $, xdLocalStorage, GM_xmlhttpRequest, confirm */
// TODO: check what this does (copied from FDSC)
// TODO: documentation

(function () {
    'use strict';

	// TODO: put 'global' variables into a single object
	//console.log("Autoflagging Information started.");
	var smokeyID = "120914"; // this is Smokey's user ID
	var key = "d897aa9f315174f081309cef13dfd7caa4ddfec1c2f8641204506636751392a4"; // this script's MetaSmoke API key
	var baseURL = "https://metasmoke.erwaysoftware.com/api/posts/urls?key=" + key + "&urls=";
	var first = true;
	var prefix = "//m.erwaysoftware.com/posts/by-url?url=";
	// TODO: MS links can appear in other Smokey messages too (like feedback on an old post, or conflicted feedback); filter them out
	// TODO: Sometimes, Smokey reports don't contain an MS link (because of the chat message limit length); find a work-around, e.g. by using the direct link in the chat message
	var selector = ".user-" + smokeyID + " .message a[href^='" + prefix + "']";
	// TODO: the chat messages are loaded asynchronously; this makes timing a bit difficult. This definitely needs some rework.
	setTimeout(function() {
		var url = baseURL;
		$(selector).each(function() {
			if (first) { first = false; } else { url += "%3B"; }
			url += $(this).attr('href').substring(prefix.length);
		});
		//console.log("URL: " + url);
		// TODO: find out why the oldest reports don't get decorated

		var autoflagData = {};
		// TODO: error handling
		$.get(url, function(data) {
			for (var i = 0; i < data.items.length; i++) {
				autoflagData[data.items[i].link] = data.items[i].autoflagged;
			}
			$(selector).each(function() {
				var postURL = $(this).attr('href').substring(prefix.length);
				if (typeof autoflagData[postURL] == 'undefined' || !autoflagData[postURL].flagged)
					return;
				// TODO: formatting, e.g. using the same autoflag icon as MS
				$(this).parent().append("<div style='text-align: right; font-style: italic;'>Autoflagged using flags of: " + autoflagData[postURL].names + "</div>");
			});
		});
	}, 5000);

	CHAT.addEventHandlerHook(function(e, n, s) {
		if (e.event_type == 1 && e.user_id == smokeyID) {
			//console.log("Smokey message " + e.message_id);
			// Wait a couple of seconds for autoflagging to complete
			setTimeout(function() {
				$("#message-" + e.message_id).find("a[href^='" + prefix + "']").each(function() {
					// TODO: show spinner to indicate waiting/loading
					var url = baseURL + $(this).attr('href').substring(prefix.length);
					//console.log("URL: " + url);

					var self = $(this);
					// TODO: refactor with initial API call
					// TODO: if the call fails (because autoflagging hasn't completed), try again after waiting a little while
					$.get(url, function(data) {
						if (data.items[0].autoflagged.flagged) {
							self.parent().append("<div style='text-align: right; font-style: italic;'>Autoflagged using flags of: " + data.items[0].autoflagged.names + "</div>");
						}
					});
				});
			}, 5000);
		}
	});
})();
