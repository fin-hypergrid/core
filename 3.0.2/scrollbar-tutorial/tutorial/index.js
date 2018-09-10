'use strict';

document.addEventListener('keydown', function(e) {
    switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
            window.top.document.dispatchEvent(new KeyboardEvent('keydown', { key: e.key }));
    }
});

document.addEventListener('scroll', setScrollWarning);

window.onload = function() {
    setScrollWarning();
    setTabLinks();
    setTitleAttribs();

    if (!window.top.tabBar) {
        return;
    }

    var snippets = document.getElementsByClassName('snippet'),
        hasSnippets = snippets.length > 0,
        tabBar = window.top.tutorial.tabBar,
        snippetTabName = 'Code Snippets';

    tabBar.toggle(snippetTabName, hasSnippets);

    if (hasSnippets) {
        window.top.snippetOnLoad = function() {
            var body = this.document.body;
            Array.prototype.slice.call(snippets).forEach(function (el) {
                body.appendChild(el);
            });
        };
        tabBar.getTab(snippetTabName).querySelector('iframe').contentWindow.location.reload();
    }
};

function setScrollWarning() {
    var i = window.scrollY + window.innerHeight - document.body.scrollHeight;
    window.top.document.getElementById('scroll-warning').style.opacity = i < -100 ? 1 : i > 0 ? 0 : -i / 100;
}

function setTabLinks() {
    document.querySelectorAll('a.tab').forEach(function (el) {
        el.href = 'javascript:void(0)';
        el.onclick = tab;
    });
}

function tab() {
    [window.top.tabBar, window.top.tutorial.tabBar].find(function(tabBar) {
        var contentEl = tabBar.contents.querySelector('[name="' + this.innerText + '"]');
        if (contentEl) {
            tabBar.selected = contentEl;
        }
        return contentEl;
    }, this);
}

function setTitleAttribs() {
    document.querySelectorAll('a[target=doc]').forEach(function (el) {
        el.title = 'Click to open the API documentation for "' + el.innerText + '" in another window.';
    });
    document.querySelectorAll('a[target=mdn]').forEach(function (el) {
        el.title = 'Click to open the Mozilla Developer Network page for "' + el.innerText + '" in another window.';
    });
}