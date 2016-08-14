// ==UserScript==
// @name        Flag Dialog Smokey Controls
// @desc        Adds Smokey status of a post and feedback options to flag dialogs.
// @author      ArtOfCode
// @version     0.2.7
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
// ==/UserScript==

(function() {
    'use strict';

    var userscript = function($) {
        window.fdsc = {};
        fdsc.metasmokeKey = "070f26ebb71c5e6cfca7893fe1139460cf23f30d686566f5707a4acfd50c";

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
                                var tps = data.filter(function(el) { return el.feedback_type.indexOf('t') === 0; }).length;
                                var fps = data.filter(function(el) { return el.feedback_type.indexOf('f') === 0; }).length;
                                $(".popup-actions").prepend("<div style='float:left'><strong>Smokey report: <span style='color:darkgreen'>" + tps + " tp</span>, <span style='color:red'>" + fps + " fp</span></strong></div>");
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

                    if (feedbackType) {
                        $.ajax({
                            'type': 'POST',
                            'url': 'https://metasmoke.erwaysoftware.com/api/w/post/' + postId + '/feedback',
                            'xhrFields': {
                                'withCredentials': true
                            },
                            'data': {
                                'type': feedbackType,
                                'key': fdsc.metasmokeKey
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
                            StackExchange.helpers.showErrorMessage($(".topbar"), "An error occurred sending post feedback to metasmoke.", {
                                'position': 'toast',
                                'transient': true,
                                'transientTimeout': 10000
                            });
                            console.log(jqXHR.status, jqXHR.responseText);
                        });
                    }

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
