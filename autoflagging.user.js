// ==UserScript==
// @name        Autoflagging Information
// @namespace   https://github.com/Charcoal-SE/
// @description Adds autoflagging information to Charcoal HQ
// @author      Glorfindel
// @contributor angussidney
// @version     0.3
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging.user.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/autoflagging.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://chat.stackexchange.com/rooms/11540/charcoal-hq
// @grant       none
// ==/UserScript==

(function () {
	'use strict';
	//console.log("Autoflagging Information started.");

	// Inject CSS
	var link = window.document.createElement('link');
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = 'data:text/css, .ai-information { position: absolute; bottom: 1px; right: 3px; } .ai-flag, .ai-spinner { height: 1.5em; }';
	document.getElementsByTagName("head")[0].appendChild(link);

	// Constants
	window.autoflagging = {};
	autoflagging.smokeyID = "120914"; // this is Smokey's user ID
	autoflagging.key = "d897aa9f315174f081309cef13dfd7caa4ddfec1c2f8641204506636751392a4"; // this script's MetaSmoke API key
	autoflagging.baseURL = "https://metasmoke.erwaysoftware.com/api/posts/urls?key=" + autoflagging.key;
	autoflagging.prefix = "//m.erwaysoftware.com/posts/by-url?url=";
	autoflagging.selector = ".user-" + autoflagging.smokeyID + " .message a[href^='" + autoflagging.prefix + "']";
	// MS links can appear in other Smokey messages too (like feedback on an old post, or conflicted feedback).
	// Fortunately, those are direct links like https://metasmoke.erwaysoftware.com/post/56004

	// TODO: Sometimes, Smokey reports don't contain an MS link (because of the chat message limit length).
	// We either need to find a work-around, e.g. by using the direct link in the chat message,
	// or wait until this feature request is implemented: https://github.com/Charcoal-SE/SmokeDetector/issues/488

	/*!
	 * Decorates a jQuery DOM element with autoflagging information from the data.
	 *
	 * The parameter 'data' is supposed to have a boolean property 'flagged', and a property 'names' that will be displayed.
	 */
	autoflagging.decorate = function (element, data) {
		// Remove previous information (like a spinner)
		element.find(".ai-information").remove();

		var html = "<span class=\"ai-information\">";
		if (data.flagged) {
			// TODO: ensure that this is nicely displayed when more than one flag is cast
			html += data.names + " <img class=\"ai-flag\" src=\"//i.stack.imgur.com/CpHts.png\" title=\"This post has been autoflagged\"/>";
		} else {
			html += "<img class=\"ai-flag\" src=\"//i.stack.imgur.com/djVc2.png\" title=\"This post has not been autoflagged\"/>";
		}
		html += "</span>";
		element.append(html);
		element.parents(".message").on("mouseenter", function () {
			var $meta = $(this).find(".meta")
			$(this).find(".ai-information").css("margin-right", $meta.width() + +$meta.css("padding-left").slice(0, -2))
		}).on("mouseleave", function () {
			$(this).find(".ai-information").css("margin-right", 0)
		});
	};

	/*!
	 * Decorates a jQuery DOM element with a spinner.
	 */
	autoflagging.addSpinner = function (element) {
		element.append("<span class=\"ai-information\">" +
			"<img class=\"ai-spinner\" src=\"//i.stack.imgur.com/icRVf.gif\" title=\"Loading autoflagging information ...\" />" +
			"</span>");
	};

	/*!
	 * Calls the API to get information about multiple posts at once, considering the paging system of the API.
	 * It will use the results to decorate the Smokey reports which are already on the page.
	 */
	autoflagging.callAPI = function (urls, page) {
		//console.log("Call API");
		// TODO: error handling
		var autoflagData = {};
		var url = autoflagging.baseURL + "&page=" + page + "&urls=" + urls;
		//console.log("URL: " + url);
		$.get(url, function(data) {
			// Group information by link
			for (var i = 0; i < data.items.length; i++) {
				autoflagData[data.items[i].link] = data.items[i].autoflagged;
			}

			// Loop over all Smokey reports and decorate them
			$(autoflagging.selector).each(function() {
				var postURL = $(this).attr('href').substring(autoflagging.prefix.length);
				// TODO: show flag weight - first, the API needs to be changed
				if (typeof autoflagData[postURL] == 'undefined')
					return;
				autoflagging.decorate($(this).parent(), autoflagData[postURL]);
			});

			if (data.has_more) {
				// There are more items on the next 'page'
				autoflagging.callAPI(urls, ++page);
			}
		});
	};

	// Wait for the chat messages to be loaded.
	var chat = $("#chat");
	chat.bind("DOMSubtreeModified", function() {
		if (chat.html().length != 0) {
			// Chat messages loaded
			chat.unbind("DOMSubtreeModified");

			// Find all Smokey reports (they are characterized by having an MS link) and extract the post URLs from them
			var urls = "";
			$(autoflagging.selector).each(function() {
				if (urls != "") { urls += "%3B"; }
				urls += $(this).attr('href').substring(autoflagging.prefix.length);
				// Show spinner
				autoflagging.addSpinner($(this).parent());
			});

			// MS API call
			autoflagging.callAPI(urls, 1);
		}
	});

	// Subscribe to chat events
	CHAT.addEventHandlerHook(function(e, n, s) {
		if (e.event_type == 1 && e.user_id == autoflagging.smokeyID) {
			//console.log("Smokey message " + e.message_id);
			// New message posted by Smokey - note that the corresponding <div> element isn't created yet.
			// Therefore, we wait a little while.
			setTimeout(function() {
				// Find MS link - if it doesn't exist, we don't need to do anything
				var anchors = $("#message-" + e.message_id).find("a[href^='" + autoflagging.prefix + "']");
				if (anchors.length == 0)
					return;

				// Show spinner
				var anchor = $(anchors[0]);
				autoflagging.addSpinner(anchor.parent());
				// Wait a couple of seconds for autoflagging to complete
				setTimeout(function() {
					// MS API call
					var url = autoflagging.baseURL + "&urls=" + anchor.attr('href').substring(autoflagging.prefix.length);
					//console.log("URL: " + url);
					$.get(url, function(data) {
						// Decorate report
						autoflagging.decorate(anchor.parent(), data.items[0].autoflagged);
					});
					// TODO: error handling; if the call fails (because autoflagging hasn't completed), try again after waiting a little while
				}, 5000);
			}, 500);
		}
	});
})();
