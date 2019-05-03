'use strict';

window.onload = getSmart.bind(null, {
    FilterCellTray: 'FilterCellTray.js',
    currencies: 'currencies.json'
}, function(files) {
    var test = function(cur) { return cur.major; };

    var originalItems = files.currencies.filter(function(cur) {
        return cur.visible = test(cur);
    }).sort(function(a, b) {
        return a.symbol < b.symbol ? -1 : 1;
    });

    var box = document.querySelector('.filter-cell-box');
    var rect = box.getBoundingClientRect();
    var left = rect.left + 21;
    var top = rect.bottom - 1;
    var input = box.querySelector('input');

    var SEARCH = 'Search';
    input.value = SEARCH;

    var keyMap = {
        value: 'symbol', // item.value returned in 'changed' event (CSV)
        text: 'symbol', // item.text displayed in item list and pill
        tooltip: 'name', // item.tooltip displayed in tooltip
        group: 'region' // item.group displayed in group list
    };

    var options = { keyMap: keyMap };
    var tray = new files.FilterCellTray(left, top, originalItems, options);
    var el = tray.el;

    el.addEventListener('click', clickStop);
    el.addEventListener('transitionend', function() {
        if (trayIsUp()) {
            tray.el.style.visibility = 'hidden';
        }
    });
    el.addEventListener('filter-cell-changed', function(e) {
        // if (input.value !== SEARCH) {
        //     input.value = '';
        //     searchKeyPress();
        //     input.value = SEARCH;
        // }
        console.log(e.detail);
    });

    // trayDown();

    document.querySelector('.filter-cell-box > div').addEventListener('click', function() {
        if (trayIsUp()) {
            searchKeyPress(tray.groupOption, true);
        } else {
            trayUp();
        }
    });

    input.addEventListener('keydown', function(e) {
        switch (e.key) {
            case 'Escape':
            case 'Enter':
            case 'Tab':
                trayUp();
                input.blur();
                break;
        }
    });
    input.addEventListener('keyup', inputKeyPress);
    input.addEventListener('focus', function(e) {
        if (input.value === SEARCH) {
            input.value = '';
        }
        inputKeyPress();
    });
    input.addEventListener('blur', function(e) {
        if (!input.value.trim().length) {
            input.value = SEARCH;
        }
    });

    box.addEventListener('click', clickStop);
    document.addEventListener('click', trayUp);

    function inputKeyPress() {
        var groupOption = tray.groupOption;
        searchKeyPress(1, false); // groupOption=1 is temporary
        tray.groupOption = groupOption;
    }
    function searchKeyPress(groupOption, showSelectAll) {
        var value = input.value;
        var searching = !(value === '' || value === SEARCH);
        var searchArg = value.toUpperCase();
        var filteredItems = originalItems;

        if (searching) {
            filteredItems = filteredItems.filter(function(item) {
                return item.symbol.toUpperCase().indexOf(searchArg) >= 0;
            });
        }

        trayDown();
        tray.reset(filteredItems, groupOption, showSelectAll);

        var d = document.createElement('div');
        tray.el.querySelectorAll('div.filter-cell-tray > div:last-child > div > div.filter-cell-item > span').forEach(function(el) {
            d.innerHTML = el.innerHTML; // work around: in some browsers, for unknown reasons...
            var t = d.textContent; // ...the simpler and more reasonable `t = el.textContent` resulted in empty string

            if (searching) {
                var i = t.toUpperCase().indexOf(searchArg);
                t = t.substr(0, i) +
                    '<span class="filter-cell-hilite">' +
                    t.substr(i, searchArg.length) +
                    '</span>' +
                    t.substr(i + searchArg.length);
            }

            el.innerHTML = t;
        });
    }

    function trayIsUp() {
        return window.getComputedStyle(tray.el).height === '0px';
    }

    function trayUp() {
        input.value = SEARCH;
        tray.el.style.height = 0;
    }
    function trayDown() {
        tray.el.style.visibility = 'visible';
        tray.el.style.height = '280px';
    }


    function clickStop(e) {
        e.stopPropagation(); // consume the click (so document-level click handler doesn't get it)
    }

});