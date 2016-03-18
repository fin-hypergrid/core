/* eslint-env browser */

'use strict';

var Tabz = require('tabz');
var popMenu = require('pop-menu');
var automat = require('automat');

var Curtain = require('../lib/Curtain');
var CellEditor = require('./CellEditor');
var markup = require('../html/templates.html');

var TAB_COLUMN_FITLERS_SQL = 'tabColumnFiltersSql',
    TAB_COLUMN_FILTERS_CQL = 'tabColumnFiltersCql';

/**
 * @constructor
 */
var Filter = CellEditor.extend('Filter', {

    initialize: function() {
        //this.on(filter, 'onInitialize');
    },

    beginEditAt: function(editorPoint) {
        var curtain, el, tabz, newColumnSelector,
            filter = this.filter = this.grid.behavior.getGlobalFilter();

        if (this.on(filter, 'onShow')) {
            // create the dialog backdrop and insert the template
            curtain = this.curtain = new Curtain(markup.filterTrees);
            el = curtain.el;

            // initialize the folder tabs
            tabz = this.tabz = new Tabz({
                root: el,
                onEnable: renderFolder
            });

            // wire-ups
            el.addEventListener('click', moreinfo.bind(this));

            el.querySelector('.hypergrid-curtain-close-button').onclick = this.stopEditing.bind(this);

            newColumnSelector = this.newColumnSelector = el.querySelector('#add-column-filter-subexpression');
            newColumnSelector.onmousedown = addColumnFilter.bind(this);

            window.addEventListener('keyup', function(evt) {
                this.hideEditor();
            });

            // put the two subtrees in the two panels
            tabz.folder('#tabTableFilterQueryBuilder').appendChild(filter.tableFilter.el);
            tabz.folder('#tabColumnFiltersQueryBuilder').appendChild(filter.columnFilters.el);

            // add it to the DOM
            curtain.append();
            newColumnSelector.selectedIndex = 0;
        }
    },

    hideEditor: function() {
        if (this.curtain.el) {
            this.curtain.remove();
            delete this.curtain;
            this.on('onHide');
        }
    },

    stopEditing: function() {
        if (this.on('onOk')) {
            var behavior = this.grid.behavior;
            this.hideEditor();
            behavior.applyAnalytics();
            behavior.changed();
        }
    },

    /**
     *
     * @param methodName
     * @returns {boolean} `true` if no handler to call _or_ called handler successfully falsy (success).
     */
    on: function(methodName) {
        var method = this.filter[methodName],
            abort;

        if (method) {
            var remainingArgs = Array.prototype.slice.call(arguments, 1);
            abort = method.apply(this.filter, remainingArgs);
        }

        return !abort;
    }

});

//function forEachEl(selector, iteratee, context) {
//    return Array.prototype.forEach.call((context || document).querySelectorAll(selector), iteratee);
//}

function moreinfo(evt) {
    var el = evt.target;
    if (el.tagName === 'A' && el.classList.contains('more-info')) {
        var els = Array.prototype.slice.call(this.curtain.el.querySelectorAll('.more-info'));
        var i = els.indexOf(el);
        if (i >= 0) {
            el = els[i + 1];
            el.style.display = window.getComputedStyle(el).display === 'none' ? 'block' : 'none';
            evt.stopPropagation();
        }
        evt.preventDefault();
    }
}

function addColumnFilter(evt) {
    var tabz = this.tabz,
        qbId = 'tabColumnFiltersQueryBuilder',
        tabQueryBuilder = tabz.folder('#' + qbId),
        tabPanel = tabQueryBuilder.parentElement,
        tab = tabz.enabledTab(tabPanel),
        folder = tabz.folder(tab),
        visQueryBuilder = tab === tabQueryBuilder,
        columnFilters = this.filter.columnFilters,
        error = columnFilters.invalid({ focus: visQueryBuilder });

    if (error) {
        if (!visQueryBuilder) {
            // We're in either the SQL tab or the Syntax tab.
            // Figure out which text box control to focus on.
            var errantQueryBuilderControlEl = error.node.el,
                errantColumnName = errantQueryBuilderControlEl.parentElement.querySelector('input').value,
                errantColumnInputControl = folder.querySelector('[name="' + errantColumnName + '"]');

            errantColumnInputControl.classList.add('filter-tree-error');
            errantColumnInputControl.focus();
        }
        evt.preventDefault(); // do not drop down
        return;
    }

    var menu = columnFilters.root.schema,
        blacklist = columnFilters.children.map(function(columnFilter) {
            return columnFilter.children.length && columnFilter.children[0].column;
        }),
        options = {
            prompt: this.newColumnSelector[0].text.replace('…', ''),
            blacklist: blacklist
        };

    popMenu.build(this.newColumnSelector, menu, options);

    this.newColumnSelector.onchange = function() {
        columnFilters.add({
            state: {
                type: 'columnFilter',
                children: [ { column: this.value } ]
            },
            focus: visQueryBuilder
        });

        if (tab.id === TAB_COLUMN_FITLERS_SQL || tab.id === TAB_COLUMN_FILTERS_CQL) {
            renderFolder(tab, folder);
        }

        this.selectedIndex = 0;
    };
}

function renderFolder(tab, folder) {
    var queryLanguage = (
        tab.id === TAB_COLUMN_FITLERS_SQL && 'SQL' ||
        tab.id === TAB_COLUMN_FILTERS_CQL && 'CQL'
    );

    if (queryLanguage) {
        var filters = this.filter.columnFilters.children,
            el = folder.lastElementChild,
            msgEl = el.querySelector('span'),
            listEl = el.querySelector('ol'),
            copyAllButtonEl = el.querySelector('button:first-of-type');

        msgEl.innerHTML = activeFiltersMessage(filters.length);
        listEl.innerHTML = '';

        filters.forEach(function(filter) {
            var conditional = filter.children[0],
                formattedColumnName = popMenu.formatItem(conditional.schema[0]),
                columnName = conditional.column,
                expression = filter.getState({ syntax: queryLanguage }),
                isNull = expression === '(NULL IS NULL)' || expression === '',
                content = isNull ? '' : expression,
                className = isNull ? 'filter-tree-error' : '',
                li = automat.first(markup[queryLanguage], formattedColumnName, columnName, content, className);

            listEl.appendChild(li);
        });

        if (copyAllButtonEl) {
            copyAllButtonEl.style.display = filters.length > 1 ? 'block' : 'none';
        }
    } else if (tab.id === 'tabTableFilterSql') {
        folder.querySelector('textarea').value = this.filter.tableFilter.getState({ syntax: 'SQL' });
    }
}

function activeFiltersMessage(n) {
    var result;

    switch (n) {
        case 0:
            result = 'There are no active column filters.';
            break;
        case 1:
            result = 'There is 1 active column filter:';
            break;
        default:
            result = 'There are ' + n + ' active column filters:';
    }

    return result;
}


module.exports = Filter;
