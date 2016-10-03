// ==UserScript==
// @name         CHQ Spam Reporter
// @namespace    https://github.com/Charcoal-SE
// @version      1.2.1
// @description  Allows you to report a spam/abusive post to Charcoal HQ from the post page
// @author       @TinyGiant, @angussidney
// @updateURL   https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/spam_reporter.user.js
// @downloadURL https://raw.githubusercontent.com/Charcoal-SE/Userscripts/master/spam_reporter.user.js
// @supportURL  https://github.com/Charcoal-SE/Userscripts/issues
// @include      /^https?:\/\/\w*.?(stackexchange.com|stackoverflow.com|serverfault.com|superuser.com|askubuntu.com|stackapps.com|mathoverflow.net)\/q(uestions)?\/\d+/
// @grant        GM_xmlhttpRequest
// ==/UserScript==
/* jshint -W097 */

// Original script written by @TinyGiant (https://github.com/Tiny-Giant/)
// Original source: https://git.io/vPt8S
// Permission to redistribute: http://chat.stackoverflow.com/transcript/message/33107648#33107648

(function(){
    'use strict';
    alert('spam_reporter.user.js has been deprecated. All functionality can now be found in fdsc.user.js. Please uninstall this script to prevent this message.')

    var notify = (function(){
        var count = 0, timeout;
        return function(m,t) {
            console.log(m,t);
            if($('#notify-' + count).length) {
                clearTimeout(timeout);
                StackExchange.notify.close(count);
            }
            StackExchange.notify.show(m,++count);
            if(t) timeout = setTimeout(StackExchange.notify.close.bind(null,count), t);
        };
    })();

    var engage = function(scope) {

        if (!scope) {
            return false;
        }

        var room = 46145; //testing, 11540; // Charcoal HQ

        var postLink = scope.querySelector('.short-link').href;

        var reportSent = function(response) {
            console.log(response);

            if (response.status !== 200) {
                notify('Error sending request: ' + resp.responseText);
                return false;
            }

            notify('Spam report sent.',1000);
        };

        var sendReport = function(response) {
            console.log(response);

            if (response.status !== 200) {
                notify('Failed sending report, check the console for more information.');
                return false;
            }

            var fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];

            if (!fkey) {
                notify('Failed retrieving key, is the room URL valid?');
                return false;
            }

            var reportStr = '!!/report ' + postLink;

            var options = {
                method: 'POST',
                url: 'http://chat.stackexchange.com/chats/' + room + '/messages/new',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: 'text=' + encodeURIComponent(reportStr) + '&fkey=' + fkey,
                onload: reportSent
            };

            GM_xmlhttpRequest(options);
        };


        var report = function(e) {
            e.preventDefault();

            if(!confirm('Do you really want to report this post?')) {
                return false;
            }

            var options = {
                method: 'GET',
                url: 'http://chat.stackexchange.com/rooms/' + room,
                onload: sendReport
            };

            GM_xmlhttpRequest(options);
        };

        var sep = document.createElement('span');
        sep.className = 'lsep';
        sep.textContent = '|';
        scope.insertBefore(sep, scope.getElementsByClassName('lsep')[0]);

        var link = document.createElement('a');
        link.href = '#';
        link.textContent = 'report';
        link.title = 'report this post as spam/abusive to Charcoal HQ';
        link.addEventListener('click', report, false);
        scope.insertBefore(link, scope.getElementsByClassName('lsep')[1]);
    };

    var menus = document.querySelectorAll('.post-menu');

    for(var i in Object.keys(menus)) engage(menus[i]);

    $(document).ajaxComplete(function(){
        var url = arguments[2].url;
        if (/^\/posts\/ajax-load-realtime\//.test(url)) engage(/\d+/.exec(url)[0]);
    });
})();
