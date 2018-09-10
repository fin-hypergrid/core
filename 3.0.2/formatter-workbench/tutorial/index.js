'use strict';

window.addEventListener('load', function() {
    setScrollWarning();
    setTabLinks();
    setTitleAttribs();

    if (!window.top.tabBar) {
        return;
    }

    querySelectorEach('.svg-reset', function(el) {
        el.innerHTML = '<svg viewBox="0 0 32 32" version="1.1" width="18" height="18"><path d="M 15.5 2.09375 L 14.09375 3.5 L 16.59375 6.03125 C 16.394531 6.019531 16.203125 6 16 6 C 10.5 6 6 10.5 6 16 C 6 17.5 6.304688 18.894531 6.90625 20.09375 L 8.40625 18.59375 C 8.207031 17.792969 8 16.898438 8 16 C 8 11.601563 11.601563 8 16 8 C 16.175781 8 16.359375 8.019531 16.53125 8.03125 L 14.09375 10.5 L 15.5 11.90625 L 19.71875 7.71875 L 20.40625 7 L 19.71875 6.28125 Z M 25.09375 11.90625 L 23.59375 13.40625 C 23.894531 14.207031 24 15.101563 24 16 C 24 20.398438 20.398438 24 16 24 C 15.824219 24 15.640625 23.980469 15.46875 23.96875 L 17.90625 21.5 L 16.5 20.09375 L 12.28125 24.28125 L 11.59375 25 L 12.28125 25.71875 L 16.5 29.90625 L 17.90625 28.5 L 15.40625 25.96875 C 15.601563 25.980469 15.804688 26 16 26 C 21.5 26 26 21.5 26 16 C 26 14.5 25.695313 13.105469 25.09375 11.90625 Z "></path></svg>';
    });

    window.top.CurvyTabsPager.forwardEvents(document);

    document.addEventListener('scroll', setScrollWarning);

    // Hide all conditional tabs
    window.top.tutorial.tabBar.reset();

    // Copy content from curvy-tabs-conditional elements to each conditional tab
    Array.prototype.forEach.call(document.getElementsByClassName('curvy-tab-conditional'), function(coTabEl) {
        var tabBar = window.top.tutorial.tabBar,
            coTabName = coTabEl.dataset.tabName;

        tabBar.show(coTabName);

        window.top.snippetOnLoad = function() {
            this.document.body.appendChild(coTabEl);
            coTabEl.classList.remove('curvy-tab-conditional');
        };

        tabBar.getTab(coTabName).querySelector('iframe').contentWindow.location.reload();
    });

    function setScrollWarning() {
        var i = window.scrollY + window.innerHeight - document.body.scrollHeight;
        window.top.document.getElementById('scroll-warning').style.opacity = i < -100 ? 1 : i > 0 ? 0 : -i / 100;
    }

    function setTabLinks() {
        querySelectorEach('span.tab', function(el) {
            el.href = 'javascript:void(0)';
            el.onclick = goToTab;
            el.style.backgroundColor = findTab.call(el).content.style.backgroundColor;
            el.title = 'Shortcut: Click here to select the ' + el.innerText + ' tab.';
        });
    }

    function goToTab() {
        var tab = findTab.call(this);
        if (tab.content) {
            tab.bar.selected = tab.content;
        }
    }

    function findTab() {
        var result = {};
        [window.top.tabBar, window.top.tutorial.tabBar].find(function(tabBar) {
            return (result.content = (result.bar = tabBar).contents.querySelector('[name="' + this.innerText + '"]'));
        }, this);
        if (!result.bar) {
            throw new ReferenceError('No such tab "' + this.innerText + '" on either tab bar!');
        }
        return result;
    }

    function setTitleAttribs() {
        querySelectorEach('a[target=doc]', function (el) {
            el.title = 'Click to open the API documentation for "' + el.innerText + '" in another window.';
        });
        querySelectorEach('a[target=mdn]', function (el) {
            el.title = 'Click to open the Mozilla Developer Network page for "' + el.innerText + '" in another window.';
        });
    }

    function querySelectorEach(selector, iterator, context) {
        var els = document.querySelectorAll(selector);
        if (els.forEach) {
            els.forEach(iterator, context);
        } else {
            Array.prototype.forEach.call(els, iterator, context);
        }
    }

});