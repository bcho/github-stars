// ==UserScript==
// @name        GitHub Stars
// @namespace   https://github.com/larrydarrelc/github-stars
// @version     0.0.1
// @description Manage your github starred projects like a boss.
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

    // Add comments box markup.
    var ADD_COMMENTS_BOX = '' +
        '<h2 class="facebox-header">Add comments</h2>' +
        '<p><textarea id="add-comments-inp" class="input-block" placeholder="Add some comments">' +
            '<%= comments %>' +
        '</textarea></p>' +
        '<button type="submit" id="add-comments-btn" class="button button-block">Save</button>' +
        '<button class="facebox-close">' +
            '<span class="octicon octicon-remove-close"></span>' +
        '</button>';

    // Edit comments button markup.
    var EDIT_COMMENTS_BTN = '' +
        '<li>' +
            '<div>' +
                '<a href="#" class="minibutton with-count upwards unstarred" title="Edit comments">' +
                    '<span class="octicon octicon-heart"></span><span class="text">Comments</span>' +
                '</a>' +
                '<a class="social-count unstarred">+</a>' +
            '</div>' +
        '</li>';

    // Comments fuzzy match threshold
    var MATCH_THRESHOLD = 0.4;

    // Comments fuzzy match shortest length, used for improving performance
    var MATCH_LENGTH = 2;


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

    // Compare two string and get a score for similarity.
    // Original code from https://github.com/joshaven/string_score
    // TODO test cases
    var cmp = function (a, b) {
        if (a === b) return 1;
        if (b === "") return 0;

        var runningScore = 0, charScore, finalScore,
            aString = a.toLowerCase(), aLength = a.length,
            bString = b.toLowerCase(), bLength = b.length,
            idxOf, startAt = 0,
            fuzzies = 1;

        for (var i = 0;i < bLength;i++) {
            idxOf = aString.indexOf(bString[i], startAt);

            if (idxOf === -1) {
                return 0;
            } else if (startAt === idxOf) {
                charScore = 0.7;
            } else {
                charScore = 0.1;
                if (a[idxOf - 1] === ' ') charScore += 0.8;
            }

            if (a[idxOf] === b[i]) charScore += 0.1;

            runningScore += charScore;
            startAt = idxOf + 1;
        }

        finalScore = 0.5 * (runningScore / aLength + runningScore / bLength) / fuzzies;

        if (aString[0] === bString[0] && finalScore < 0.85) finalScore += 0.15;

        return finalScore;
    };


    // Components Setup
    // ----------------

    var addComments = function (projectName) {
        var originalComments = Comments.get(projectName);

        $.facebox(tmpl(ADD_COMMENTS_BOX, {
            comments: originalComments
        }));

        var addBtn = document.querySelector('#add-comments-btn'),
            commentsInp = document.querySelector('#add-comments-inp');

        addBtn.addEventListener('click', function () {
            var comments = commentsInp.value;

            if (comments != originalComments) {
                Comments.set(projectName, comments);
            }

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
            starred_repos_count = starred_repos.length,
            repos = [], curRepo,
            ele, name;

        // TODO loops function oops?
        var curried = function (name) {
            return function () {
                addComments(name);
            };
        };

        for (var i = 0;i < starred_repos_count;i++) {
            ele = starred_repos[i];
            name = ele.querySelector('h3 a').innerText;
            curRepo = {
                ele: ele,
                name: name,
                comments: Comments.get(name)
            };
            repos.push(curRepo);

            // bind the :star: buttons
            curRepo.ele
                .querySelector('.unstarred')
                .addEventListener('click', curried(curRepo.name));

            // inject comments
            if (curRepo.comments) {
                curRepo.ele.appendChild($('<p>' + curRepo.comments + '</p>')[0]);
            }
        }

        // bind search box
        var q = document.querySelector('input#star-repo-search');
        
        // TODO performance check
        q.addEventListener('keyup', function () {
            var needle = q.value;

            if (needle.length === 0) {
                repos.forEach(function (repo) {
                    repo.ele.classList.remove('hidden');
                })
            }

            if (needle.length < MATCH_LENGTH) return;

            // compare project name and comments
            var cmpRepo = function (repo) {
                return ([repo.name, repo.comments].filter(function (a) {
                    return (cmp(a, needle) >= MATCH_THRESHOLD);
                }).length > 0);
            };

            repos.forEach(function (repo) {
                if (cmpRepo(repo)) {
                    repo.ele.classList.remove('hidden');
                } else {
                    repo.ele.classList.add('hidden');
                }
            });
        });
    };

    var projectPage = function (projectName) {
        // inject edit comments box
        document
            .querySelector('.pagehead-actions')
            .appendChild($(EDIT_COMMENTS_BTN)[0]);

        // bind the :star: buttons
        var btn = document.querySelectorAll('.unstarred'),
            l = btn.length,
            e;
        for (var i = 0;i < l;i++) {
            e = btn[i];
            e.addEventListener('click', function () {
                addComments(projectName);
            })
        }
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
