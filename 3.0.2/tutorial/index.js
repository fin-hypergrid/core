function Tutorial(tabContainer, pagesPath, toc) {
    this.container = tabContainer;
    this.path = pagesPath;
    this.toc = toc;

    this.tabBar = new CurvyTabs(tabContainer);
    this.tabBar.paint();

    this.initPagingControls();
}

Tutorial.prototype = {
    constructor: Tutorial,

    initPagingControls: function() {
        var m = document.cookie.match(/\btutorial=(\d+)/);
        var tut = this;
        tut.pageNum = m ? Number(m[1]) : 1;

        document.getElementById('page-max').innerText = document.getElementById('page-control').max = tut.toc.length;

        tut.page(tut.pageNum);

        document.getElementById('page-control').oninput = function() { tut.page(this.value); };
        document.getElementById('page-prev').onclick = function() { tut.page(tut.pageNum - 1); };
        document.getElementById('page-next').onclick = function() { tut.page(tut.pageNum + 1); };

        document.addEventListener('keydown', function(e) {
            var el = document.activeElement;
            var editingText = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' && el.type === 'text';
            var isTutorial = !editingText && tut.tabBar.selected.getAttribute('name') === 'Tutorial';
            if (isTutorial) {
                switch (e.key) {
                    case 'ArrowLeft': if (tut.pageNum > 1) { tut.page(--tut.pageNum); } break;
                    case 'ArrowRight': if (tut.pageNum < tut.toc.length) { tut.page(++tut.pageNum); } break;
                }
            }
        });
    },

    page: function(n, path) {
        n = Number(n);

        if (path === undefined) {
            path = this.path;
        }

        if (1 > n || n > this.toc.length) {
            return;
        }

        this.tabBar.select('Tutorial');

        this.pageNum = n;

        // save page number in a cookie for next visit or reload
        var d = new Date;
        d.setYear(d.getFullYear() + 1);
        document.cookie = 'tutorial=' + this.pageNum + '; expires=' + d.toUTCString();

        // page transition
        this.container.querySelector('iframe').contentWindow.location.href = path + this.toc[this.pageNum - 1];

        // adjust page panel
        document.getElementById('page-number').innerText = document.getElementById('page-control').value = this.pageNum;

        // hide the prev button on next page
        document.getElementById('page-prev').classList.toggle('page-button-enabled-prev', this.pageNum !== 1);

        // hide the next button on last page
        document.getElementById('page-next').classList.toggle('page-button-enabled-next', this.pageNum !== this.toc.length);
    }
};
