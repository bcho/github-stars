// ==UserScript==
// @name        GitHub Stars
// @namespace   https://github.com/larrydarrelc/github-stars
// @version     0.0.1
// @description Manage your github starred projects like a boss
//
// @match       https://github.com/stars*
// @match       https://github.com/*
// ==/UserScript==

/*global $*/

(function () {

    // Helper Setup
    // ------------

    // Local storage keys' prefix.
    var PREFIX = 'gs-';

    // Templating settings.
    var TEMPLATE = {
        interpolate: /<%=([\w ]+)%>/g
    };

    var ADD_COMMENTS_BOX = '' +
        '<h2 class="facebox-header">Add comments</h2>' +
        '<p><textarea id="add-comments-inp" class="input-block"><%= comments %></textarea></p>' +
        '<button type="submit" id="add-comments-btn" class="button button-block">Save</button>' +
        '<button class="facebox-close">' +
            '<span class="octicon octicon-remove-close"></span>' +
        '</button>';


    // Utilities
    // ---------

    // k-v based comments service (using localStorage)
    var Comments = {
        realName: function (name) {
            return PREFIX + name;
        },

        get: function (projectName) {
            projectName = Comments.realName(projectName);
            return localStorage[projectName] || '';
        },

        set: function (projectName, comments) {
            projectName = Comments.realName(projectName);
            localStorage[projectName] = comments;
        }
    };

    // a not so fast templating helper
    var tmpl = function (markup, data) {
        var pattern = TEMPLATE.interpolate,
            key;

        while ((key = pattern.exec(markup)) !== null) {
            markup = markup.replace(key[0], data[key[1].trim()]);
        }

        return markup;
    };


    // Components Setup
    // ----------------

    var addComments = function (projectName) {
        $.facebox(tmpl(ADD_COMMENTS_BOX, {
            comments: Comments.get(projectName)
        }));

        var addBtn = document.querySelector('#add-comments-btn'),
            commentsInp = document.querySelector('#add-comments-inp');

        addBtn.addEventListener('click', function () {
            var comments = commentsInp.value;

            if (!comments) return;

            Comments.set(projectName, comments);
            $(document).trigger('close.facebox');
        });
    };


    // Page Manipuliation
    // ------------------

    var isStarsPage = function (path) {
        return path === 'stars';
    };

    var isProjectPage = function (path) {
        return path.split('/').length === 2;
    };

    var starsPage = function () {
        var starred_repos = document.querySelectorAll('.repo_list li'),
            curRepo, curRepoName, curRepoComments,
            i;

        // TODO loops function oops?
        var curried = function (name) {
            return function () {
                addComments(name);
            };
        };

        for (i = 0;i < starred_repos.length;i++) {
            curRepo = starred_repos[i];
            curRepoName = curRepo.querySelector('h3 a').innerText;

            // bind the :star: buttons
            curRepo
                .querySelector('.unstarred')
                .addEventListener('click', curried(curRepoName));

            // inject comments
            curRepoComments = Comments.get(curRepoName);
            if (curRepoComments) {
                curRepo.appendChild($('<p>' + curRepoComments + '</p>')[0]);
            }
        }
    };

    var projectPage = function (projectName) {
        // bind the :star: button
        document
            .querySelector('.unstarred')
            .addEventListener('click', function () {
                addComments(projectName);
            });
    };


    // Helper Initialization
    // ---------------------

    var kick = function () {
        var path = location.pathname.substring(1);

        // faking a route
        if (isStarsPage(path)) {
            starsPage();
        } else if (isProjectPage(path)) {
            projectPage(path);
        } else {
            console.log('reaching ', path);
        }
    };

    kick();
})();
