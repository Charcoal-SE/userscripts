// ==UserScript==
// @name        Flag Dialog Smokey Controls
// @description Adds Smokey status of a post and feedback options to flag dialogs.
// @author      ArtOfCode
// @version     0.14.1
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
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @grant       GM_xmlhttpRequest
// ==/UserScript==

/*global StackExchange, console, reporter, fdsc, $, xdLocalStorage, GM_xmlhttpRequest, confirm */
/*jslint indent: 4, maxerr: 50, browser: true, plusplus: true,  vars: true */

(function () {
    'use strict';
    var reporter = {},
        fdsc = {};

    fdsc.metasmokeKey = "070f26ebb71c5e6cfca7893fe1139460cf23f30d686566f5707a4acfd50c";

    /*!
     * Given a DOM element containing the post in question, will construct the URL to that post in the form
     * required by metasmoke. For questions and answers, respectively:
     *
     *     //stackoverflow.com/questions/12345
     *     //stackoverflow.com/a/12345
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
     * Spam reporter code (modified and inserted by angussidney)
     * Original script written by @TinyGiant (https://github.com/Tiny-Giant/)
     * Original source: https://git.io/vPt8S
     * Permission to redistribute: http://chat.stackoverflow.com/transcript/message/33107648#33107648
     */
    reporter.room = 46145; //testing, 11540; // Charcoal HQ

    reporter.reportSent = function (response) {
        console.log(response);

        if (response.status !== 200) {
            StackExchange.helpers.showErrorMessage($(".topbar"), "Error sending request: " + response.responseText, {
                'position': 'toast',
                'transient': true,
                'transientTimeout': 10000
            });
            return false;
        }

        StackExchange.helpers.showSuccessMessage($(".topbar"), 'Spam report sent.', {
            'position': 'toast',
            'transient': true,
            'transientTimeout': 10000
        });
    };

    reporter.sendReport = function (response) {
        console.log(response);

        if (response.status !== 200) {
            StackExchange.helpers.showErrorMessage($(".topbar"), "Failed sending report, check the console for more information." + response.responseText, {
                'position': 'toast',
                'transient': true,
                'transientTimeout': 10000
            });
            return false;
        }

        var fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];

        if (!fkey) {
            StackExchange.helpers.showErrorMessage($(".topbar"), "Failed retrieving key, is the room URL valid?" + response.responseText, {
                'position': 'toast',
                'transient': true,
                'transientTimeout': 10000
            });
            return false;
        }

        var reportStr = '!!/report ' + reporter.postLink;

        var options = {
            method: 'POST',
            url: 'http://chat.stackexchange.com/chats/' + reporter.room + '/messages/new',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: 'text=' + encodeURIComponent(reportStr) + '&fkey=' + fkey,
            onload: reporter.reportSent
        };
        GM_xmlhttpRequest(options);
    };

    reporter.report = function () {
        if (confirm('Do you really want to report this post as spam/offensive?')) {
            var options = {
                method: 'GET',
                url: 'http://chat.stackexchange.com/rooms/' + reporter.room,
                onload: reporter.sendReport
            };
            GM_xmlhttpRequest(options);
        }
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
                        }).done(function (data) {
                            if (data.length > 0 && data[0].id) {
                                postId = data[0].id;
                                $.ajax({
                                    'type': 'GET',
                                    'url': 'https://metasmoke.erwaysoftware.com/api/post/' + postId + '/feedback',
                                    'data': {
                                        'key': fdsc.metasmokeKey
                                    }
                                }).done(function (data) {
                                    // We use the first char of feedback to identify its type because that's what metasmoke does.
                                    var tps = data.filter(function (el) { return el.feedback_type.indexOf('t') === 0; }).length;
                                    var fps = data.filter(function (el) { return el.feedback_type.indexOf('f') === 0; }).length;
                                    var naa = data.filter(function (el) { return el.feedback_type.indexOf('n') === 0; }).length;
                                    $(".popup-actions").prepend("<div style='float:left' id='smokey-report'><strong>Smokey report: <span style='color:darkgreen'>" + tps + " tp</span>, <span style='color:red'>" + fps + " fp</span>, <span style='color:#7c5500'>" + naa + " naa</span></strong></div>");
                                }).error(function (jqXHR, textStatus, errorThrown) {
                                    StackExchange.helpers.showErrorMessage($(".topbar"), "An error occurred fetching post feedback from metasmoke.", {
                                        'position': 'toast',
                                        'transient': true,
                                        'transientTimeout': 10000
                                    });
                                    console.log(jqXHR.status, jqXHR.responseText);
                                });
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

                    // use this for testing
                    $(".popup-submit").parent().append($('<a href="#">test</a>').
                    // un comment this when testing is over
                    //$(".popup-submit").
                      on("click", function (ev) {
                        ev.preventDefault(); // !!!!!!!!!!!!!!! remove when testing is over, otherwise you might not be actually flagging
                        var selected = $("input[name=top-form]").filter(":checked");
                        var feedbackType;
                        if (selected.val() == "PostSpam" || selected.val() == "PostOffensive") {
                            feedbackType = "tpu-";
                        } else if (selected.val() === "AnswerNotAnAnswer") {
                            feedbackType = "naa-";
                        }

                        if (feedbackType && $('#smokey-report').length > 0) {
                            // because it looks like xdls returns null as a string for some reason
                            if (!fdsc.msWriteToken || fdsc.msWriteToken === 'null') {
                                fdsc.getWriteToken(true, function() {
                                    fdsc.sendFeedback(feedbackType, postId);
                                });
                            }
                            else {
                                fdsc.sendFeedback(feedbackType, postId);
                            }
                        } else if (feedbackType === "tpu-") {
                            reporter.postLink = fdsc.constructUrl(container); // <-- that may just work
                            reporter.report()
                        }

                        // Likewise, remove this handler when it's finished to avoid multiple fires.
                        $(".popup-submit").off("click");
                    })
                    ) // !!!!!!!!!!!!!!!!! comment  this line after test
                    ;
                });
            });
        }
    });
})();
