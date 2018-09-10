function CurvyTabsPager(container, tabBar, pagesPath, toc) {
    var tut = this;
    var m = document.cookie.match(/\btutorial=(\d+)/);

    tut.num = m ? Number(m[1]) : 1;

    this.container = container;
    this.tabBar = tabBar;
    this.path = pagesPath;
    this.toc = toc;

    this.tabBar.paint();

    if (!document.head.querySelector('style#injected-stylesheet-curvy-tabs-pager')) {
        var el = document.createElement('style');
        el.id = 'injected-stylesheet-curvy-tabs-pager';
        el.innerHTML = '\
.page-number {\n\
    display: inline-block;\n\
    width: 2em;\n\
    text-align: center;\n\
}\n\
.page-slider {\n\
    margin-left: .5em;\n\
    width: 50px\n\
}\n\
.page-button {\n\
    color: #d8d8d8;\n\
    user-select: none;\n\
    cursor: pointer;\n\
    border: 1px solid transparent;\n\
    border-radius: 5px;\n\
    padding: 3px 5px 1px 5px;\n\
}\n\
.page-button-enabled-prev, .page-button-enabled-next {\n\
    color: black;\n\
}\n\
.page-button-enabled:hover, .page-button-enabled:active {\n\
    border: 1px solid grey;\n\
}\n\
.page-button-enabled-prev:active {\n\
    padding-left: 3px;\n\
    padding-right: 7px;\n\
}\n\
.page-button-enabled-next:active {\n\
    padding-left: 7px;\n\
    padding-right: 3px;\n\
}';
        document.head.insertBefore(el, document.head.firstElementChild);
    }

    container.innerHTML += '\n\
      <span class="page-button page-button-enabled" title="Click to go to previous page (or press left-arrow key)">&#x25c0;</span>\n\
      Page <input class="page-slider" type="range" min="1" max="3" value="1">\n\
      <b class="page-number"></b>\n\
      of <b class="page-number"></b>\n\
      <span class="page-button page-button-enabled" title="Click to go to next page (or press right-arrow key)">&#x25ba;</span>\n\
    ';

    var numberEls = container.querySelectorAll('.page-number');
    var buttonEls = container.querySelectorAll('.page-button');
    tut.sliderEl = container.querySelector('.page-slider');

    (tut.goPrevEl = buttonEls[0]).onclick = function() { tut.page(tut.num - 1); };
    tut.sliderEl.oninput = function() { tut.page(this.value); };
    tut.sliderEl.onchange = tut.sliderEl.oninput; // for IE 11 range control which doesn't dispatch `input` events
    tut.numEl = numberEls[0];
    (tut.maxEl = numberEls[1]).innerText = this.sliderEl.max = tut.toc.length;
    (tut.goNextEl = buttonEls[1]).onclick = function() { tut.page(tut.num + 1); };

    tut.page(tut.num);

    document.addEventListener('keydown', function(e) {
        var el = document.activeElement;
        var editingText = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' && el.type === 'text';

        if (!editingText ) {
            switch (e.key) {
                case 'ArrowLeft': if (tut.num > 1) {
                    tut.page(--tut.num);
                }
                break;
                case 'ArrowRight': if (tut.num < tut.toc.length) {
                    tut.page(++tut.num);
                }
                break;
            }
        }
    });
};

CurvyTabsPager.forwardEvents = function(childWindowDocument) {
    childWindowDocument.addEventListener('keydown', function(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
                document.dispatchEvent(new KeyboardEvent('keydown', { key: e.key }));
        }
    });
};

CurvyTabsPager.prototype.page = function(n, path) {
    n = Number(n);

    if (path === undefined) {
        path = this.path;
    }

    if (1 > n || n > this.toc.length) {
        return;
    }

    this.tabBar.select('Tutorial');

    this.num = n;

    // save page number in a cookie for next visit or reload
    var d = new Date;
    d.setYear(d.getFullYear() + 1);
    document.cookie = 'tutorial=' + this.num + '; expires=' + d.toUTCString();

    // page transition
    this.tabBar.container.querySelector('iframe').contentWindow.location.href = path + this.toc[this.num - 1];

    // adjust page panel
    this.numEl.innerText = this.sliderEl.value = this.num;

    // hide the prev button on next page
    this.goPrevEl.classList.toggle('page-button-enabled-prev', this.num !== 1);

    // hide the next button on last page
    this.goNextEl.classList.toggle('page-button-enabled-next', this.num !== this.toc.length);
};

module.exports = CurvyTabsPager;
