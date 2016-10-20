// ==UserScript==
// @name        Flag Dialog Smokey Controls
// @namespace   https://github.com/Charcoal-SE/
// @description Adds Smokey status of a post and feedback options to flag dialogs.
// @author      ArtOfCode
// @contributor angussidney
// @contributor rene
// @attribution TinyGiant
// @version     1.3.1
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
// @require     https://cdn.rawgit.com/ofirdagan/cross-domain-local-storage/d779a81a6383475a1bf88595a98b10a8bd5bb4ae/dist/scripts/xdLocalStorage.min.js
// ==/UserScript==

/*global StackExchange, console, fdsc, $, xdLocalStorage, GM_xmlhttpRequest, confirm */
/*jslint indent: 4, maxerr: 50, browser: true, plusplus: true,  vars: true */

(function () {
    'use strict';

    var userscript = function ($) {
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
        fdsc.constructUrl = function (postContainer) {
            var base = "//" + location.host + "/";
            if ($(postContainer).hasClass("answer")) {
                return base + "a/" + $(postContainer).data("answerid");
            } else if ($(postContainer).hasClass("question")) {
                return base + "questions/"  + $(postContainer).data("questionid");
            } else {
                return "";
            }
        };

        /*!
         * Given a blurb and a callback method, will prompt the user for input using an SE native prompt and the
         * text of the blurb. The callback will be invoked once the input is submitted, and the first parameter
         * will contain the submitted data.
         */
        fdsc.input = function (blurb, callback) {
            function loaded() {
                $("#fdsc-popup-submit").on("click", function () {
                    StackExchange.helpers.closePopups('#fdsc-popup-prompt');
                    callback($("#fdsc-popup-input").val());
                    $("#fdsc-popup-submit").off("click");
                });
            }

            $("body").loadPopup({
                'lightbox': false,
                'target': $("body"),
                'html': '<div class="popup fdsc-popup" id="#fdsc-popup-prompt"><p>' + blurb + '</p><input type="text" id="fdsc-popup-input" /><br/><button id="fdsc-popup-submit">OK</button></div>',
                'loaded': loaded
            });
        };

        fdsc.confirm = function (blurb, callback) {
            function loaded() {
                $("#fdsc-popup-ok").on("click", function () {
                    StackExchange.helpers.closePopups('#fdsc-popup-confirm');
                    callback(true);
                    $("#fdsc-popup-ok").off("click");
                });
                $("#fdsc-popup-cnl").on("click", function () {
                    StackExchange.helpers.closePopups('#fdsc-popup-confirm');
                    callback(false);
                    $("#fdsc-popup-cnl").off("click");
                });
            }

            $("body").loadPopup({
                'lightbox': false,
                'target': $("body"),
                'html': '<div class="popup fdsc-popup" id="fdsc-popup-confirm"><p>' + blurb + '</p><button style="margin:5px;" id="fdsc-popup-ok">OK</button><button style="margin:5px;" id="fdsc-popup-cnl">Cancel</button></div>',
                'loaded': loaded
            });
        };

        /*!
         * The token that allows us to perform write operations using the metasmoke API. Obtained via MicrOAuth.
         * `localStorage` call is left in for backwards compatibility. It's overwritten later.
         */
        fdsc.msWriteToken = localStorage.getItem("fdsc_msWriteToken");

        /*!
         * Obtains a write token and stores it both in `fdsc.msWriteToken` and `xdLocalStorage['fdsc_msWriteToken']`.
         * _May_ cause problems with popup blockers, because the window opening isn't triggered by a click... we'll
         * have to see how much of a problem that is.
         */
        fdsc.getWriteToken = function (afterFlag, callback) {
            console.log("getWriteToken");
            var w = window.open("https://metasmoke.erwaysoftware.com/oauth/request?key=" + fdsc.metasmokeKey, "_blank");

            function getInput() {
                fdsc.input("Once you've authenticated FDSC with metasmoke, you'll be given a code; enter it here.", function (code) {
                    console.log("input callback: " + code);
                    $.ajax({
                        'url': 'https://metasmoke.erwaysoftware.com/oauth/token?key=' + fdsc.metasmokeKey + '&code=' + code,
                        'method': 'GET'
                    }).done(function (data) {
                        fdsc.msWriteToken = data['token'];
                        xdLocalStorage.setItem("fdsc_msWriteToken", data['token'], function () {
                            callback();
                        });
                    }).error(function (jqXHR, textStatus, errorThrown) {
                        if (jqXHR.status === 404) {
                            StackExchange.helpers.showErrorMessage($(".topbar"), "metasmoke could not find a write token - did you authorize the app?", {
                                'position': 'toast',
                                'transient': true,
                                'transientTimeout': 10000
                            });
                        } else {
                            StackExchange.helpers.showErrorMessage($(".topbar"), "An unknown error occurred during OAuth with metasmoke.", {
                                'position': 'toast',
                                'transient': true,
                                'transientTimeout': 10000
                            });
                            console.log(jqXHR.status, jqXHR.responseText);
                        }
                    });
                });
            }

            if (afterFlag) {
                $(document).on("DOMNodeRemoved", function (ev) {
                    if ($(ev.target).attr("id") === "popup-flag-post") {
                        getInput();
                        $(document).off("DOMNodeRemoved");
                    }
                });
            } else {
                getInput();
            }
        };

        /*!
         * Given a Smokey-recognized feedback type, sends that feedback to metasmoke via the API. Requires a valid
         * API key and write token; if you don't have these before this is called, get hold of them. A write token
         * can be obtained using `fdsc.getWriteToken()`.
         */
        fdsc.sendFeedback = function (feedbackType, postId) {
            console.log("sendFeedback");
            console.log("fdsc.msWriteToken: ", fdsc.msWriteToken);
            var token;
            if (typeof (fdsc.msWriteToken) === "object") {
                token = fdsc.msWriteToken['value'];
            } else {
                token = fdsc.msWriteToken;
            }

            $.ajax({
                'type': 'POST',
                'url': 'https://metasmoke.erwaysoftware.com/api/w/post/' + postId + '/feedback',
                'data': {
                    'type': feedbackType,
                    'key': fdsc.metasmokeKey,
                    'token': token
                }
            }).done(function (data) {
                StackExchange.helpers.showSuccessMessage($(".topbar"), "Fed back " + feedbackType + " to metasmoke.", {
                    'position': 'toast',
                    'transient': true,
                    'transientTimeout': 10000
                });
                console.log(data);
            }).error(function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 401) {
                    StackExchange.helpers.showErrorMessage($(".topbar"), "Can't send feedback to metasmoke - not authenticated.", {
                        'position': 'toast',
                        'transient': true,
                        'transientTimeout': 10000
                    });
                    console.error("fdsc.sendFeedback was called without having a valid write token");
                    fdsc.confirm("Write token invalid. Attempt re-authentication?", function (result) {
                        if (result) {
                            fdsc.getWriteToken(false, function () {
                                fdsc.sendFeedback(feedbackType, postId);
                            });
                        }
                    });
                } else {
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
         * Given the URL to a post not yet reported by Smokey, reports that post via the metasmoke API. Requires a valid
         * API key and write token; if you don't have these before this is called, get hold of them. A write token
         * can be obtained using `fdsc.getWriteToken()`.
         */
        fdsc.reportPost = function (postUrl) {
            console.log("reportPost");
            console.log("fdsc.msWriteToken: ", fdsc.msWriteToken);
            var token;
            if (typeof (fdsc.msWriteToken) === "object") {
                token = fdsc.msWriteToken['value'];
            } else {
                token = fdsc.msWriteToken;
            }

            $.ajax({
                'type': 'POST',
                'url': 'https://metasmoke.erwaysoftware.com/api/w/post/report',
                'data': {
                    'post_link': postUrl,
                    'key': fdsc.metasmokeKey,
                    'token': token
                }
            }).done(function (data) {
                StackExchange.helpers.showSuccessMessage($(".topbar"), "Reported post to metasmoke.", {
                    'position': 'toast',
                    'transient': true,
                    'transientTimeout': 10000
                });
                console.log(data);
            }).error(function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 401) {
                    StackExchange.helpers.showErrorMessage($(".topbar"), "Can't report post to metasmoke - not authenticated.", {
                        'position': 'toast',
                        'transient': true,
                        'transientTimeout': 10000
                    });
                    console.error("fdsc.reportPost was called without having a valid write token");
                    fdsc.confirm("Write token invalid. Attempt re-authentication?", function (result) {
                        if (result) {
                            fdsc.getWriteToken(false, function () {
                                fdsc.sendFeedback(feedbackType, postId);
                            });
                        }
                    });
                } else {
                    StackExchange.helpers.showErrorMessage($(".topbar"), "An error occurred while reporting the post to metasmoke.", {
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
        xdLocalStorage.init({
            'iframeUrl': 'https://metasmoke.erwaysoftware.com/xdom_storage.html',
            'initCallback': function () {
                xdLocalStorage.getItem("fdsc_msWriteToken", function (data) {
                    fdsc.msWriteToken = data['value'];
                    console.log("fdsc.msWriteToken: ", data['value']);
                });

                $(".flag-post-link").on("click", function (clickEvent) {
                    $(document).on("DOMNodeInserted", function (nodeEvent) {
                        if ($(nodeEvent.target).hasClass("popup") && $(nodeEvent.target).attr("id") === "popup-flag-post") {
                            var container = $(clickEvent.target).parents(".question, .answer").first();
                            $.ajax({
                                'type': 'GET',
                                'url': 'https://metasmoke.erwaysoftware.com/api/posts/url',
                                'data': {
                                    'url': fdsc.constructUrl(container),
                                    'key': fdsc.metasmokeKey
                                }
                            }).done(function (data) {
                                if (data.length > 0 && data[0].id) {
                                    fdsc.currentPostId = data[0].id;
                                    fdsc.postFound = true;
                                    $.ajax({
                                        'type': 'GET',
                                        'url': 'https://metasmoke.erwaysoftware.com/api/post/' + fdsc.currentPostIdpostId + '/feedback',
                                        'data': {
                                            'key': fdsc.metasmokeKey
                                        }
                                    }).done(function (data) {
                                        // We use the first char of feedback to identify its type because that's what metasmoke does.
                                        var tps = data.filter(function (el) { return el.feedback_type.indexOf('t') === 0; }).length;
                                        var fps = data.filter(function (el) { return el.feedback_type.indexOf('f') === 0; }).length;
                                        var naa = data.filter(function (el) { return el.feedback_type.indexOf('n') === 0; }).length;
                                        if (tps === 0) {
                                            $(".popup-actions").prepend("<div style='float:left' id='smokey-report'><strong>Smokey report: <span style='color:darkgreen'>" + tps + " tp</span>, <span style='color:red'>" + fps + " fp</span>, <span style='color:#7c5500'>" + naa + " naa</span></strong> - <a href='#' id='feedback-fp' style='color:rgba(255,0,0,0.5);' onMouseOver='this.style.color=\"rgba(255,0,0,1)\"' onMouseOut='this.style.color=\"rgba(255,0,0,0.5)\"'>false positive?</a></div>");
                                        } else {
                                            // If someone else has already marked as tp, you should mark it as fp in chat where you can discuss with others.
                                            // Hence, do not display the false positive button
                                            $(".popup-actions").prepend("<div style='float:left' id='smokey-report'><strong>Smokey report: <span style='color:darkgreen'>" + tps + " tp</span>, <span style='color:red'>" + fps + " fp</span>, <span style='color:#7c5500'>" + naa + " naa</span></strong></div>");
                                        }
                                        // On click of the false positive button
                                        $("#feedback-fp").on("click", function (ev) {
                                            console.log("Reporting as false positive");
                                            ev.preventDefault();
                                            if (!fdsc.msWriteToken || fdsc.msWriteToken === "null") {
                                                fdsc.getWriteToken(false, function () {
                                                    fdsc.sendFeedback("fp-", fdsc.currentPostId);
                                                });
                                            } else {
                                                fdsc.sendFeedback("fp-", fdsc.currentPostId);
                                            }
                                            StackExchange.helpers.closePopups('#popup-flag-post');
                                            $("#feedback-fp").off("click");
                                        });
                                    }).error(function (jqXHR, textStatus, errorThrown) {
                                        StackExchange.helpers.showErrorMessage($(".topbar"), "An error occurred fetching post feedback from metasmoke.", {
                                            'position': 'toast',
                                            'transient': true,
                                            'transientTimeout': 10000
                                        });
                                        console.log(jqXHR.status, jqXHR.responseText);
                                    });
                                } else {
                                    fdsc.postFound = false;
                                }
                            }).error(function (jqXHR, textStatus, errorThrown) {
                                StackExchange.helpers.showMessage($(".topbar"), "An error occurred fetching post ID from metasmoke - has the post been reported by Smokey?", {
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

                        $(".popup-submit").on("click", function (ev) {
                            var selected = $("input[name=top-form]").filter(":checked");
                            var feedbackType;
                            if (selected.val() === "PostSpam" || selected.val() === "PostOffensive") {
                                feedbackType = "tpu-";
                            } else if (selected.val() === "AnswerNotAnAnswer") {
                                feedbackType = "naa-";
                            }

                            if (feedbackType && fdsc.currentPostId) {
                                // because it looks like xdls returns null as a string for some reason
                                if (!fdsc.msWriteToken || fdsc.msWriteToken === 'null') {
                                    fdsc.getWriteToken(true, function () {
                                        fdsc.sendFeedback(feedbackType, fdsc.currentPostId);
                                    });
                                } else {
                                    fdsc.sendFeedback(feedbackType, fdsc.currentPostId);
                                } else if (feedbackType === "tpu-" && fdsc.postFound === false) {
                                    fdsc.reportPost(fdsc.constructUrl(container)); // container variable defined on line 299
                                }
                            }

                            // Likewise, remove this handler when it's finished to avoid multiple fires.
                            $(".popup-submit").off("click");
                        });
                    });
                });
            }
        });
    };

    /*!
     * This is here because since we're injecting the userscript into the page, we also need to inject
     * any libraries we need.
     */
    var sourceEl = document.createElement("script");
    sourceEl.type = "application/javascript";
    sourceEl.src = "https://cdn.rawgit.com/ofirdagan/cross-domain-local-storage/d779a81a6383475a1bf88595a98b10a8bd5bb4ae/dist/scripts/xdLocalStorage.min.js";
    sourceEl.onload = function () {
        var el = document.createElement("script");
        el.type = "application/javascript";
        el.text = "(" + userscript + ")(jQuery);";
        document.body.appendChild(el);
    };
    document.body.appendChild(sourceEl);
})();
