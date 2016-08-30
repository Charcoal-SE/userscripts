// ==UserScript==
// @name        Flag Dialog Smokey Controls
// @desc        Adds Smokey status of a post and feedback options to flag dialogs.
// @author      ArtOfCode
// @version     0.7.1
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fdsc.user.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fdsc.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @match       *://*.stackexchange.com/*
// @match       *://*.stackoverflow.com/*
// @match       *://*.superuser.com/*
// @match       *://*.serverfault.com/*
// @match       *://*.askubuntu.com/*
// @match       *://*.stackapps.com/*
// @match       *://*.mathoverflow.net/*
// @exclude     *://chat.stackexchange.com/*
// @exclude     *://chat.meta.stackexchange.com/*
// @exclude     *://chat.stackoverflow.com/*
// @exclude     *://blog.stackoverflow.com/*
// ==/UserScript==

(function() {
    'use strict';

    var userscript = function($) {
        window.fdsc = {};
        fdsc.metasmokeKey = "070f26ebb71c5e6cfca7893fe1139460cf23f30d686566f5707a4acfd50c";

        /*!
         * Given a DOM element containing the post in question, will construct the URL to that post in the form
         * required by metasmoke. For questions and answers, respectively:
         *
         *     //stackoverflow.com/questions/12345
         *     //stackoverflow.com/a/12345
         *
         */
        fdsc.constructUrl = function(postContainer) {
            var base = "//" + location.host + "/";
            if ($(postContainer).hasClass("answer")) {
                return base + "a/" + $(postContainer).data("answerid");
            }
            else if ($(postContainer).hasClass("question")) {
                return base + "questions/"  + $(postContainer).data("questionid");
            }
            else {
                return "";
            }
        };
        
        /*!
         * The token that allows us to perform write operations using the metasmoke API. Obtained via MicrOAuth.
         */
        fdsc.msWriteToken = localStorage.getItem("fdsc_msWriteToken");
        
        /*!
         * Obtains a write token and stores it both in `fdsc.msWriteToken` and `localStorage['fdsc_msWriteToken']`.
         * _May_ cause problems with popup blockers, because the window opening isn't triggered by a click... we'll
         * have to see how much of a problem that is.
         */
        fdsc.getWriteToken = function() {
			console.log("getWriteToken");
            var w = window.open("https://metasmoke.erwaysoftware.com/oauth/request?key=" + fdsc.metasmokeKey, "_blank");
            setTimeout(function() {
				var code = window.prompt("Once you've authorized FDSC with metasmoke, you'll be given a code. Enter that here:", "");
				$.ajax({
					'url': 'https://metasmoke.erwaysoftware.com/oauth/token?key=' + fdsc.metasmokeKey + '&code=' + code,
					'method': 'GET'
				})
				.done(function(data) {
					fdsc.msWriteToken = data['token'];
					localStorage.setItem("fdsc_msWriteToken", data['token']);
				})
				.error(function(jqXHR, textStatus, errorThrown) {
					if (jqXHR.status == 404) {
						StackExchange.helpers.showErrorMessage($(".topbar"), "metasmoke could not find a write token - did you authorize the app?", {
							'position': 'toast',
							'transient': true,
							'transientTimeout': 10000
						});
					}
					else {
						StackExchange.helpers.showErrorMessage($(".topbar"), "An unknown error occurred during OAuth with metasmoke.", {
							'position': 'toast',
							'transient': true,
							'transientTimeout': 10000
						});
						console.log(jqXHR.status, jqXHR.responseText);
					}
				});
			}, 1000);
        };
        
        /*!
         * Given a Smokey-recognized feedback type, sends that feedback to metasmoke via the API. Requires a valid
         * API key and write token; if you don't have these before this is called, get hold of them. A write token
         * can be obtained using `fdsc.getWriteToken()`.
         */
        fdsc.sendFeedback = function(feedbackType, postId) {
			console.log("sendFeedback");
            $.ajax({
                'type': 'POST',
                'url': 'https://metasmoke.erwaysoftware.com/api/w/post/' + postId + '/feedback',
                'data': {
                    'type': feedbackType,
                    'key': fdsc.metasmokeKey,
                    'token': fdsc.msWriteToken
                }
            })
            .done(function(data) {
                StackExchange.helpers.showSuccessMessage($(".topbar"), "Fed back " + feedbackType + " to metasmoke.", {
                    'position': 'toast',
                    'transient': true,
                    'transientTimeout': 10000
                });
                console.log(data);
            })
            .error(function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.status == 401) {
                    fdsc.getWriteToken();
                    fdsc.sendFeedback(feedbackType, postId);
                }
                else {
                    StackExchange.helpers.showErrorMessage($(".topbar"), "An error occurred sending post feedback to metasmoke.", {
                        'position': 'toast',
                        'transient': true,
                        'transientTimeout': 10000
                    });
                    console.log(jqXHR.status, jqXHR.responseText);
                }
            });
        };

        /*!
         * Well this is a mess.
         */
        $(".flag-post-link").on("click", function(clickEvent) {
            $(document).on("DOMNodeInserted", function(nodeEvent) {
                var postId;
                if ($(nodeEvent.target).hasClass("popup") && $(nodeEvent.target).attr("id") == "popup-flag-post") {
                    var container = $(clickEvent.target).parents(".question, .answer").first();
                    $.ajax({
                        'type': 'GET',
                        'url': 'https://metasmoke.erwaysoftware.com/api/posts/url',
                        'data': {
                            'url': fdsc.constructUrl(container),
                            'key': fdsc.metasmokeKey
                        }
                    })
                    .done(function(data) {
                        if (data.length > 0 && data[0].id) {
                            postId = data[0].id;
                            $.ajax({
                                'type': 'GET',
                                'url': 'https://metasmoke.erwaysoftware.com/api/post/' + postId + '/feedback',
                                'data': {
                                    'key': fdsc.metasmokeKey
                                }
                            })
                            .done(function(data) {
                                // We use the first char of feedback to identify its type because that's what metasmoke does.
                                var tps = data.filter(function(el) { return el.feedback_type.indexOf('t') === 0; }).length;
                                var fps = data.filter(function(el) { return el.feedback_type.indexOf('f') === 0; }).length;
                                $(".popup-actions").prepend("<div style='float:left' id='smokey-report'><strong>Smokey report: <span style='color:darkgreen'>" + tps + " tp</span>, <span style='color:red'>" + fps + " fp</span></strong></div>");
                            })
                            .error(function(jqXHR, textStatus, errorThrown) {
                                StackExchange.helpers.showErrorMessage($(".topbar"), "An error occurred fetching post feedback from metasmoke.", {
                                    'position': 'toast',
                                    'transient': true,
                                    'transientTimeout': 10000
                                });
                                console.log(jqXHR.status, jqXHR.responseText);
                            });
                        }
                    })
                    .error(function(jqXHR, textStatus, errorThrown) {
                        StackExchange.helpers.showrMessage($(".topbar"), "An error occurred fetching post ID from metasmoke - has the post been reported by Smokey?", {
                            'position': 'toast',
                            'transient': true,
                            'transientTimeout': 10000,
                            'type': 'warning'
                        });
                        console.error(jqXHR.status, jqXHR.responseText);
                    });

                    // We should remove the DOMNodeInserted handler when we're done with it to avoid multiple fires of
                    // the same handler caused by re-adding it each time you click the flag link.
                    $(document).off("DOMNodeInserted");
                }

                $(".popup-submit").on("click", function(ev) {
                    var selected = $("input[name=top-form]").filter(":checked");
                    var feedbackType;
                    if (selected.val() == "PostSpam" || selected.val() == "PostOffensive") {
                        feedbackType = "tpu-";
                    }
                    else if (selected.val() == "AnswerNotAnAnswer") {
                        feedbackType = "naa-";
                    }

                    if (feedbackType && $('#smokey-report').length > 0) {
                        if (!fdsc.msWriteToken) {
                            fdsc.getWriteToken();
                        }
                        fdsc.sendFeedback(feedbackType, postId);
                    }

                    // Likewise, remove this handler when it's finished to avoid multiple fires.
                    $(".popup-submit").off("click");
                });
            });
        });
    };

    var el = document.createElement("script");
    el.type = "application/javascript";
    el.text = "(" + userscript + ")(jQuery);";
    document.body.appendChild(el);
})();
