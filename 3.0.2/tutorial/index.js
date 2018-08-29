function Tutorial(tabContainer, pagesPath, maxPages) {
    this.container = tabContainer;
    this.path = pagesPath;
    this.maxPages = maxPages;

    this.tabBar = new CurvyTabs(tabContainer);
    this.tabBar.paint();

    this.initPagingControls();
}

Tutorial.prototype = {
    constructor: Tutorial,

    initPagingControls: function() {
        var m = document.cookie.match(/\btutorial=(\d+)/);
        this.pageNum = m ? Number(m[1]) : 1;

        document.getElementById('page-max').innerText = document.getElementById('page-control').max = this.maxPages;

        this.page(this.pageNum, 0);

        document.getElementById('page-control').oninput = function() { this.page(Number(this.value)); }.bind(this);
        document.getElementById('page-prev').onclick = function() { this.page(this.pageNum - 1); }.bind(this);
        document.getElementById('page-next').onclick = function() { this.page(this.pageNum + 1); }.bind(this);

        document.addEventListener('keydown', function(e) {
            var el = document.activeElement;
            var editingText = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' && el.type === 'text';
            var isTutorial = !editingText && this.tabBar.selected.getAttribute('name') === 'Tutorial';
            if (isTutorial) {
                switch (e.key) {
                    case 'ArrowLeft': if (this.pageNum > 1) { this.page(--this.pageNum); } break;
                    case 'ArrowRight': if (this.pageNum < this.maxPages) { this.page(++this.pageNum); } break;
                }
            }
        }.bind(this));
    },

    page: function(n) {
        if (1 > n || n > this.maxPages) {
            return;
        }

        this.tabBar.select('Tutorial');

        this.pageNum = n;

        // save page number in a cookie for next visit or reload
        var d = new Date;
        d.setYear(d.getFullYear() + 1);
        document.cookie = 'src=' + this.pageNum + '; expires=' + d.toUTCString();

        // page transition
        this.container.querySelector('iframe').contentWindow.location.href = this.path + this.pageNum + '.html';

        // adjust page panel
        document.getElementById('page-number').innerText = document.getElementById('page-control').value = this.pageNum;

        var classList = document.getElementById('page-prev').classList;
        var method = this.pageNum === 1 ? 'remove' : 'add';
        classList[method]('page-button-enabled'); classList[method]('page-button-enabled-prev');

        classList = document.getElementById('page-next').classList;
        method = this.pageNum === this.maxPages ? 'remove' : 'add';
        classList[method]('page-button-enabled'); classList[method]('page-button-enabled-next');
    }
};
