// ==UserScript==
// @name        Flag Dialog Smokey Controls
// @namespace   https://github.com/Charcoal-SE/
// @description Adds Smokey status of a post and feedback options to flag dialogs.
// @author      ArtOfCode
// @contributor angussidney
// @contributor rene
// @contributor J F
// @contributor Glorfindel
// @attribution Brock Adams (https://github.com/BrockA)
// @version     1.16
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fdsc/fdsc.meta.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/fdsc/fdsc.user.js
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
// @exclude     *://*.area51.stackexchange.com/*
// @require     https://cdn.rawgit.com/ofirdagan/cross-domain-local-storage/d779a81a6383475a1bf88595a98b10a8bd5bb4ae/dist/scripts/xdLocalStorage.min.js
// @require     https://charcoal-se.org/userscripts/vendor/debug.min.js
// @grant       none
// ==/UserScript==

/* global fdsc, $, xdLocalStorage, confirm, unsafeWindow */
/* eslint-disable max-nested-callbacks */

(function () {
  "use strict";
  const createDebug = typeof unsafeWindow === "undefined" ? window.debug : unsafeWindow.debug || window.debug;
  const debug = createDebug("fdsc");

  const userscript = function ($) {
    window.fdsc = {};
    fdsc.metasmokeKey = "070f26ebb71c5e6cfca7893fe1139460cf23f30d686566f5707a4acfd50c";
    fdsc.ready = false;

    /*!
    * Given a DOM element containing the post in question, will construct the URL to that post in the form
    * required by metasmoke. For questions and answers, respectively:
    *
    *     //stackoverflow.com/questions/12345
    *     //stackoverflow.com/a/12345
    *
    */
    fdsc.constructUrl = function (postContainer) {
      const base = "//" + location.host + "/";
      if ($(postContainer).hasClass("answer")) {
        return base + "a/" + $(postContainer).data("answerid");
      }
      if ($(postContainer).hasClass("question")) {
        return base + "questions/" + $(postContainer).data("questionid");
      }
      return "";
    };

    /*!
    * Given a blurb and a callback method, will prompt the user for input using an SE native prompt and the
    * text of the blurb. The callback will be invoked once the input is submitted, and the first parameter
    * will contain the submitted data.
    */
    fdsc.input = function (blurb, callback) {
      function loaded() {
        $("#fdsc-popup-submit").on("click", () => {
          StackExchange.helpers.closePopups("#fdsc-popup-prompt");
          callback($("#fdsc-popup-input").val());
          $("#fdsc-popup-submit").off("click");
        });
      }

      $("body").loadPopup({
        lightbox: false,
        target: $("body"),
        html: "<div class='popup fdsc-popup' id='fdsc-popup-prompt'><p>" + blurb + "</p><input type='text' id='fdsc-popup-input' /><br/><button id='fdsc-popup-submit'>OK</button></div>",
        loaded
      });
    };

    fdsc.confirm = function (blurb, callback) {
      function loaded() {
        $("#fdsc-popup-ok").on("click", () => {
          StackExchange.helpers.closePopups("#fdsc-popup-confirm");
          callback(true);
          $("#fdsc-popup-ok").off("click");
        });
        $("#fdsc-popup-cnl").on("click", () => {
          StackExchange.helpers.closePopups("#fdsc-popup-confirm");
          callback(false);
          $("#fdsc-popup-cnl").off("click");
        });
      }

      $("body").loadPopup({
        lightbox: false,
        target: $("body"),
        html: "<div class='popup fdsc-popup' id='fdsc-popup-confirm'><p>" + blurb + "</p><button style='margin:5px;' id='fdsc-popup-ok'>OK</button><button style='margin:5px;' id='fdsc-popup-cnl'>Cancel</button></div>",
        loaded
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
      debug("entering getWriteToken");
      window.open("https://metasmoke.erwaysoftware.com/oauth/request?key=" + fdsc.metasmokeKey, "_blank");

      function getInput() {
        fdsc.input("Once you've authenticated FDSC with metasmoke, you'll be given a code; enter it here.", code => {
          debug("input callback: " + code);
          $.ajax({
            url: "https://metasmoke.erwaysoftware.com/oauth/token?key=" + fdsc.metasmokeKey + "&code=" + code,
            method: "GET"
          }).done(data => {
            fdsc.msWriteToken = data.token;
            xdLocalStorage.setItem("fdsc_msWriteToken", data.token, () => {
              callback();
            });
          }).error(jqXHR => {
            if (jqXHR.status === 404) {
              StackExchange.helpers.showErrorMessage($(".topbar"), "metasmoke could not find a write token - did you authorize the app?", {
                position: "toast",
                transient: true,
                transientTimeout: 10000
              });
            } else {
              StackExchange.helpers.showErrorMessage($(".topbar"), "An unknown error occurred during OAuth with metasmoke.", {
                position: "toast",
                transient: true,
                transientTimeout: 10000
              });
              debug("getting write token failed", jqXHR);
            }
          });
        });
      }

      if (afterFlag) {
        $(document).on("DOMNodeRemoved", ev => {
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
      debug("entering sendFeedback");
      debug("write token:", fdsc.msWriteToken);
      let token;
      if (typeof (fdsc.msWriteToken) === "object") {
        token = fdsc.msWriteToken.value;
      } else {
        token = fdsc.msWriteToken;
      }

      $.ajax({
        type: "POST",
        url: "https://metasmoke.erwaysoftware.com/api/v2.0/feedbacks/post/" + postId + "/create",
        data: {
          type: feedbackType,
          key: fdsc.metasmokeKey,
          token
        }
      }).done(data => {
        StackExchange.helpers.showSuccessMessage($(".topbar"), "Fed back " + feedbackType + " to metasmoke.", {
          position: "toast",
          transient: true,
          transientTimeout: 10000
        });
        debug("feedback sent:", data);
        $(window.event.target).attr("data-fdsc-ms-id", null);
        fdsc.postFound = null;
      }).error(jqXHR => {
        if (jqXHR.status === 401) {
          StackExchange.helpers.showErrorMessage($(".topbar"), "Can't send feedback to metasmoke - not authenticated.", {
            position: "toast",
            transient: true,
            transientTimeout: 10000
          });
          console.error("fdsc.sendFeedback was called without having a valid write token");
          fdsc.confirm("Write token invalid. Attempt re-authentication?", result => {
            if (result) {
              fdsc.getWriteToken(false, () => {
                fdsc.sendFeedback(feedbackType, postId);
              });
            }
          });
        } else {
          StackExchange.helpers.showErrorMessage($(".topbar"), "An error occurred sending post feedback to metasmoke.", {
            position: "toast",
            transient: true,
            transientTimeout: 10000
          });
          debug("feedback failed:", jqXHR);
        }
        $(window.event.target).attr("data-fdsc-ms-id", null);
        fdsc.postFound = null;
      });
    };

    /*!
    * Given the URL to a post not yet reported by Smokey, reports that post via the metasmoke API. Requires a valid
    * API key and write token; if you don't have these before this is called, get hold of them. A write token
    * can be obtained using `fdsc.getWriteToken()`.
    */
    fdsc.reportPost = function (postUrl) {
      if (StackExchange.options.user.isModerator) {
        return;
      }
      debug("entering reportPost");
      debug("write token:", fdsc.msWriteToken);
      let token;
      if (typeof (fdsc.msWriteToken) === "object") {
        token = fdsc.msWriteToken.value;
      } else {
        token = fdsc.msWriteToken;
      }

      $.ajax({
        type: "POST",
        url: "https://metasmoke.erwaysoftware.com/api/v2.0/posts/report",
        data: {
          post_link: postUrl, // eslint-disable-line camelcase
          key: fdsc.metasmokeKey,
          token
        }
      }).done(data => {
        StackExchange.helpers.showSuccessMessage($(".topbar"), "Reported post to metasmoke.", {
          position: "toast",
          transient: true,
          transientTimeout: 10000
        });
        debug("post reported", data);
      }).error(jqXHR => {
        if (jqXHR.status === 401) {
          StackExchange.helpers.showErrorMessage($(".topbar"), "Can't report post to metasmoke - not authenticated.", {
            position: "toast",
            transient: true,
            transientTimeout: 10000
          });
          console.error("fdsc.reportPost was called without having a valid write token");
          fdsc.confirm("Write token invalid. Attempt re-authentication?", result => {
            if (result) {
              fdsc.getWriteToken(false, () => {
                fdsc.reportPost(postUrl);
              });
            }
          });
        } else {
          StackExchange.helpers.showErrorMessage($(".topbar"), "An error occurred while reporting the post to metasmoke.", {
            position: "toast",
            transient: true,
            transientTimeout: 10000
          });
          debug("report failed:", jqXHR);
        }
      });
    };

    /*!
    * Well this is a mess.
    */
    xdLocalStorage.init({
      iframeUrl: "https://metasmoke.erwaysoftware.com/xdom_storage.html",
      initCallback() {
        xdLocalStorage.getItem("fdsc_msWriteToken", data => {
          fdsc.msWriteToken = data.value;
          debug("write token", data.value);
        });

        $(".flag-post-link").on("click", clickEvent => {
          $(document).on("DOMNodeInserted", nodeEvent => {
            let container;
            if ($(nodeEvent.target).hasClass("popup") && $(nodeEvent.target).attr("id") === "popup-flag-post") {
              container = $(clickEvent.target).parents(".question, .answer").first();
              fdsc.ajaxPromise = $.ajax({
                type: "GET",
                url: "https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls",
                data: {
                  urls: fdsc.constructUrl(container),
                  filter: "HFHNHJFMGNKNFFFIGGOJLNNOFGNMILLJ",
                  key: fdsc.metasmokeKey
                }
              }).done(data_ => {
                data_ = data_.items;

                function registerFeedbackButton(buttonSelector, feedback, logMessage) {
                  $(buttonSelector).on("click", ev => {
                    debug("feedback clicked:", logMessage);
                    ev.preventDefault();
                    if (!fdsc.msWriteToken || fdsc.msWriteToken === "null") {
                      fdsc.getWriteToken(true, () => {
                        fdsc.sendFeedback(feedback, $(nodeEvent.target).attr("data-fdsc-ms-id"));
                      });
                    } else {
                      fdsc.sendFeedback(feedback, $(nodeEvent.target).attr("data-fdsc-ms-id"));
                    }
                    StackExchange.helpers.closePopups("#popup-flag-post");
                    $(buttonSelector).off("click");
                  });
                }

                if (data_.length > 0 && data_[0].id) {
                  $(nodeEvent.target).attr("data-fdsc-ms-id", data_[0].id);
                  fdsc.postFound = true;
                  const isAutoflagged = data_[0].autoflagged.flagged === true;
                  const isFlagged = $(".popup .already-flagged").length > 0;
                  if (isAutoflagged) {
                    fdsc.autoflagged = "autoflagged";
                  } else {
                    fdsc.autoflagged = "not autoflagged";
                  }

                  // Retrieve feedback
                  $.get("https://metasmoke.erwaysoftware.com/api/v2.0/feedbacks/post/" + data_[0].id +
                        "?key=" + fdsc.metasmokeKey, data => {
                    console.log(data);
                    // Determine # of feedbacks for each type
                    let tps = 0;
                    let fps = 0;
                    let naa = 0;
                    for (let i = 0; i < data.items.length; i++) {
                      switch (data.items[0].feedback_type.charAt(0)) {
                        case "t":
                          tps++;
                          break;
                        case "f":
                          fps++;
                          break;
                        case "n":
                          naa++;
                          break;
                        default:
                          break;
                      }
                    }

                    const fpButtonStyle = "style='color:rgba(255,0,0,0.5);' onMouseOver='this.style.color=\"rgba(255,0,0,1)\"' onMouseOut='this.style.color=\"rgba(255,0,0,0.5)\"'";
                    const tpButtonStyle = "style='color:rgba(0,100,0,0.5);' onMouseOver='this.style.color=\"rgba(0,100,0,1)\"' onMouseOut='this.style.color=\"rgba(0,100,0,0.5)\"'";
                    let status = "<div style='float:left' id='smokey-report'><strong>Smokey report: <span style='color:darkgreen'>" + tps + " tp</span>, <span style='color:red'>" + fps + " fp</span>, <span style='color:#7c5500'>" + naa + " naa</span>, " + fdsc.autoflagged + "</strong>";
                    let writeTokenButton = false;

                    if (!fdsc.msWriteToken || fdsc.msWriteToken === "null") {
                      status += " - <a href='#' id='get-write-token'>get write token</a></div>";
                      writeTokenButton = true;
                    }

                    if (isFlagged || isAutoflagged) {
                      status += " - <a href='#' id='autoflag-tp' " + tpButtonStyle + ">tpu-</a></div>";
                    }

                    if (tps === 0) {
                      status += " - <a href='#' id='feedback-fp' " + fpButtonStyle + ">false positive?</a></div>";
                    } else {
                      // If someone else has already marked as tp, you should mark it as fp in chat where you can discuss with others.
                      // Hence, do not display the false positive button
                      status += "</div>";
                    }
                    $(".popup-actions").prepend(status);
                    // On click of the false positive button
                    registerFeedbackButton("#feedback-fp", "fp-", "Reporting as false positive");
                    // On click of the confirm autoflag
                    registerFeedbackButton("#autoflag-tp", "tpu-", "Reporting as true positive");

                    if (writeTokenButton) {
                      $("#get-write-token").on("click", ev => {
                        ev.preventDefault();
                        fdsc.getWriteToken(false, () => {
                          debug("click event", clickEvent);

                          $(".popup-close a").click();
                          $(clickEvent.currentTarget).click();
                        }); // Add a "Get write token" link.
                      });
                    }
                  });
                } else {
                  fdsc.postFound = false;
                }
              }).error(jqXHR => {
                StackExchange.helpers.showMessage($(".topbar"), "An error occurred fetching post from metasmoke - has the post been reported by Smokey?", {
                  position: "toast",
                  transient: true,
                  transientTimeout: 10000,
                  type: "warning"
                });
                console.error(jqXHR.status, jqXHR.responseText);
              });

              // We should remove the DOMNodeInserted handler when we're done with it to avoid multiple fires of
              // the same handler caused by re-adding it each time you click the flag link.
              $(document).off("DOMNodeInserted");
            }

            $(".popup-submit").on("click", () => {
              const selected = $("input[name=top-form]").filter(":checked");
              let feedbackType;
              if (selected.val() === "PostSpam" || selected.val() === "PostOffensive") {
                feedbackType = "tpu-";
              } else if (selected.val() === "AnswerNotAnAnswer") {
                feedbackType = "naa-";
              }

              fdsc.ajaxPromise.then(() => {
                if (feedbackType && $(nodeEvent.target).attr("data-fdsc-ms-id")) {
                  // Because it looks like xdls returns null as a string for some reason
                  if (!fdsc.msWriteToken || fdsc.msWriteToken === "null") {
                    fdsc.getWriteToken(true, () => {
                      fdsc.sendFeedback(feedbackType, $(nodeEvent.target).attr("data-fdsc-ms-id"));
                    });
                  } else {
                    fdsc.sendFeedback(feedbackType, $(nodeEvent.target).attr("data-fdsc-ms-id"));
                  }
                } else if (feedbackType === "tpu-" && fdsc.postFound === false) {
                  if (!fdsc.msWriteToken || fdsc.msWriteToken === "null") {
                    fdsc.getWriteToken(true, () => {
                      fdsc.reportPost(fdsc.constructUrl(fdsc.container)); // Container variable defined on line 299
                    });
                  } else {
                    fdsc.reportPost(fdsc.constructUrl(fdsc.container));
                  }
                }
              });

              // Likewise, remove this handler when it's finished to avoid multiple fires.
              $(".popup-submit").off("click");
            });
          });
        });
        $(".popup-close").on("click", () => {
          fdsc.postFound = null;
        });

        $(document).trigger("fdsc:ready");
        fdsc.ready = true;
      }
    });
  };

  /*!
  * This is here because since we're injecting the userscript into the page, we also need to inject
  * any libraries we need.
  */
  const sourceEl = document.createElement("script");
  sourceEl.type = "application/javascript";
  sourceEl.id = "fdsc-script";
  sourceEl.addEventListener("load", () => {
    const el = document.createElement("script");
    el.type = "application/javascript";
    el.text = "(" + userscript + ")(jQuery);";
    document.body.appendChild(el);
  });
  sourceEl.src = "https://cdn.rawgit.com/ofirdagan/cross-domain-local-storage/d779a81a6383475a1bf88595a98b10a8bd5bb4ae/dist/scripts/xdLocalStorage.min.js";
  document.body.appendChild(sourceEl);
})();
