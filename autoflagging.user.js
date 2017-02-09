// ==UserScript==
// @name        Autoflagging Information & More
// @namespace   https://github.com/Charcoal-SE/
// @description Adds autoflagging information to Charcoal HQ
// @author      Glorfindel
// @contributor angussidney
// @contributor J F
// @version     0.6
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
	link.href = 'data:text/css, .ai-information:not(.inline) { float: right; margin-right: 3px; position: relative; top: 1px } .ai-information { font-size: 11px; -webkit-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none; cursor: default; } .ai-spinner { height: 1.5em; } .ai-deleted { transition: opacity 0.4s; } .ai-deleted:not(:hover) { opacity: 0.5; }';
	document.getElementsByTagName("head")[0].appendChild(link);

	// Constants
	window.autoflagging = {};
	autoflagging.smokeyID = "120914"; // this is Smokey's user ID
	autoflagging.key = "d897aa9f315174f081309cef13dfd7caa4ddfec1c2f8641204506636751392a4"; // this script's MetaSmoke API key
	autoflagging.baseURL = "https://metasmoke.erwaysoftware.com/api/posts/urls?key=" + autoflagging.key;
	autoflagging.prefix = "//m.erwaysoftware.com/posts/by-url?url=";
	autoflagging.selector = ".user-" + autoflagging.smokeyID + " .message a[href^='" + autoflagging.prefix + "']";
	// MS links can appear in other Smokey messages too (like feedback on an old post, or conflicted feedback).
	// Fortunately, those are direct links like https://metasmoke.erwaysoftware.com/post/56004 and won't be found by this selector.

	// Error handling
	autoflagging.notify = Notifier().notify;

	// TODO: Sometimes, Smokey reports don't contain an MS link (because of the chat message limit length).
	// We either need to find a work-around, e.g. by using the direct link in the chat message,
	// or wait until this feature request is implemented: https://github.com/Charcoal-SE/SmokeDetector/issues/488

	/*!
	 * Decorates a jQuery DOM element with autoflagging information from the data.
	 *
	 * The parameter 'data' is supposed to have a boolean property 'flagged', and a property 'users' with user information.
	 */
	autoflagging.decorate = function (element, data) {
		// Remove previous information (like a spinner)
		element.find(".ai-information").remove();

		// Determine if you (i.e. the current user) autoflagged this post.
		var site = "";
		switch (location.hostname) {
			case "chat.stackexchange.com":
				site = "stackexchange";
				break;
			case "chat.meta.stackexchange.com":
				site = "meta_stackexchange";
				break;
			case "chat.stackoverflow.com":
				site = "stackoverflow";
				break;
			default:
				console.error("Invalid site for autoflagging: " + location.hostname);
				break;
		}
		var youFlagged = data.users.filter(function (user) {
			return user[site + "_chat_id"] === CHAT.CURRENT_USER_ID;
		}).length == 1;

		// Construct HTML to add to chat message
		var html = "<span class=\"ai-information\">&nbsp;";
		// if (data.count_tp) {
		//   html += data.count_tp.toLocaleString() + " ✓, "
		// }
		// if (data.count_naa) {
		//   html += data.count_naa.toLocaleString() + " 💩, "
		// }
		// if (data.count_fp) {
		//   html += data.count_fp.toLocaleString() + " ✗, "
		// }
		if (data.flagged) {
			if (youFlagged) {
				html += "<strong class=\"you-flagged\">You autoflagged.</strong> ";
			}
			html += data.users.length + " ⚑";
		} else {
			html += "<span style=\"opacity: 0.5\" title=\"Not autoflagged\">⚑</span>";
		}
		html = html.replace(/, $/, "");
		html += " </span>";
		element.append(html);
		element.parents(".message").find(".meta .ai-information").remove();
		element.parents(".message").find(".meta").append(
			$(html).addClass("inline").attr("title", data.users.map(function (user) { return user.username }).join(", "))
		);
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
    if (page == null) {
      page = 1;
    }
		var autoflagData = {};
		var url = autoflagging.baseURL + "&page=" + page + "&urls=" + urls;
		//console.log("URL: " + url);
		$.get(url, function(data) {
			// Group information by link
			for (var i = 0; i < data.items.length; i++) {
				autoflagData[data.items[i].link] = data.items[i];
			}

			// Loop over all Smokey reports and decorate them
			$(autoflagging.selector).each(function() {
				var postURL = $(this).attr('href').substring(autoflagging.prefix.length);
				// TODO: show flag weight - first, the API needs to be changed
				if (typeof autoflagData[postURL] == 'undefined')
					return;
				autoflagging.decorate($(this).parent(), autoflagData[postURL].autoflagged);
			});

			if (data.has_more) {
				// There are more items on the next 'page'
				autoflagging.callAPI(urls, ++page);
			}
		}).fail(function(error) {
			autoflagging.notify('Failed to load data: ' + error);
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
			autoflagging.callAPI(urls);
		}
	});
  $("#getmore, #getmore-mine").click(function () {
    setTimeout(function () {
      var urls = "";
			$(autoflagging.selector).filter(function () {
        return !$(this).parents('.message').find('.ai-information').length
      }).each(function() {
				if (urls != "") { urls += "%3B"; }
				urls += $(this).attr('href').substring(autoflagging.prefix.length);
				// Show spinner
				autoflagging.addSpinner($(this).parent());
			});
      // MS API call
			autoflagging.callAPI(urls);
    }, 1000)
  })

	// Listen to MS events
	autoflagging.socket = new WebSocket("wss://metasmoke.erwaysoftware.com/cable");
	autoflagging.socket.onmessage = function(message) {
		// Parse message
		var jsonData = JSON.parse(message.data);
		switch (jsonData.type) {
		case "confirm_subscription":
		case "ping":
		case "welcome":
			break;
		default:
			// Analyze socket message
			var flagLog = jsonData.message.flag_log;
			var deletionLog = jsonData.message.deletion_log;
			var feedback = jsonData.message.feedback;
			if (typeof flagLog != 'undefined') {
				// Autoflagging information
				//console.log(flagLog.user_name + ' autoflagged ' + flagLog.post_link);
				var selector = ".user-" + autoflagging.smokeyID + " .message a[href^='" + autoflagging.prefix + flagLog.post_link + "']";
				var data = {};
				data.flagged = true;
				data.names = [flagLog.user_name];
				data.users = [flagLog.user];
				console.log("Decorating from socket");
				// TODO: this is going to overwrite previous autoflags when we start flagging multiple times
				autoflagging.decorate($(selector).parent(), data);
			} else if (typeof deletionLog != 'undefined') {
				// Deletion log
				//console.log(deletionLog.post_link + ' deleted');
				var selector = ".user-" + autoflagging.smokeyID + " .message a[href^='" + autoflagging.prefix + deletionLog.post_link + "']";
				$(selector).parents('.message').toggleClass('ai-deleted');
			} else if (typeof feedback != 'undefined') {
				// Feedback
				// TODO: show realtime feedback
				//console.log(feedback.user_name + ' posted ' + feedback.symbol + ' on ' + feedback.post_link); // feedback_type
			}
			break;
		}
	};
	autoflagging.socket.onopen = function() {
		// Send authentication
		autoflagging.socket.send('{"identifier": "{\\"channel\\":\\"ApiChannel\\",\\"key\\":\\"' + autoflagging.key + '\\"}", "command": "subscribe"}');
	};

	/* TODO: the spinner is still nice to display
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
					}).fail(function(error) {
						autoflagging.notify('Failed to load data: ' + error);
					});
				}, 5000);
			}, 500);
		}
	});
	*/
})();
