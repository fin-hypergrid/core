/* eslint-env browser */

'use strict';

var Tabz = require('tabz');
var popMenu = require('pop-menu');
var automat = require('automat');

var Curtain = require('../lib/Curtain');
var CellEditor = require('./CellEditor');
var markup = require('../html/templates.html');
var copyInput = require('../lib/copy-input');

var tabProperties = {
    tableQB: {
        isTableFilter: true
    },
    tableSQL: {
        isTableFilter: true,
        language: 'SQL'
    },
    columnsQB: {
        isColumnFilter: true
    },
    columnsSQL: {
        isColumnFilter: true,
        language: 'SQL'
    },
    columnsCQL: {
        isColumnFilter: true,
        language: 'CQL'
    }
};

/**
 * @constructor
 */
var Filter = CellEditor.extend('Filter', {

    initialize: function() {
        //this.on(filter, 'onInitialize');
    },

    beginEditAt: function(editorPoint) {
        var curtain, el, tabz,
            filter = this.filter = this.grid.behavior.getGlobalFilter();

        if (this.on(filter, 'onShow')) {
            // create the dialog backdrop and insert the template
            curtain = this.curtain = new Curtain(markup.filterTrees);
            el = curtain.el;

            // initialize the folder tabs
            tabz = this.tabz = new Tabz({
                root: el,
                onEnable: renderFolder.bind(this),
                onDisable: saveFolder.bind(this)
            });

            // wire-ups
            el.addEventListener('click', links.bind(this));

            this.newColumnSelector = el.querySelector('#add-column-filter-subexpression');
            this.newColumnSelector.onmousedown = onNewColumnFilterMouseDown.bind(this);
            this.newColumnSelector.onchange = onNewColumnFilterChange.bind(this);

            // put the two subtrees in the two panels
            tabz.folder('#tableQB').appendChild(filter.tableFilter.el);
            tabz.folder('#columnsQB').appendChild(filter.columnFilters.el);

            // copy the SQL more-info block from the table to the columns tab
            var columnSqlEl = tabz.folder('#columnsSQL'),
                tableSqlEl = tabz.folder('#tableSQL');
            columnSqlEl.insertBefore(tableSqlEl.firstElementChild.cloneNode(true), columnSqlEl.firstChild);

            // add it to the DOM
            curtain.append();
            this.newColumnSelector.selectedIndex = 0;
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
            saveFolder.call(this);
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

function links(evt) { // to be called with filter object as syntax
    var a = evt.target;
    if (a.tagName === 'A') {
        if (a.classList.contains('more-info')) {

            // find all more-info links and their adjacent blocks (blocks always follow links)
            var els = this.curtain.el.querySelectorAll('.more-info');

            // hide all more-info blocks except the one following this link (unless it's already visible in which case hide it too).
            for (var i = 0; i < els.length; ++i) {
                var el = els[i];
                if (el.tagName === 'A') {
                    var found = el === a;
                    el.classList[found ? 'toggle' : 'remove']('hide-info');
                    el = els[i + 1];
                    el.style.display = found && el.style.display !== 'block' ? 'block' : 'none';
                }
            }
            //evt.stopPropagation();
            evt.preventDefault();
        } else if (a.classList.contains('filter-copy')) {
            var isCopyAll = (a.innerHTML !== '');
            if (isCopyAll) {
                while (a.tagName !== 'SECTION') { a = a.parentElement; }
                a = a.querySelector(copyInput.selectorTextControls);
                copyInput(a, this.filter.columnFilters.getState({ syntax: 'SQL' }));
            } else {
                copyInput(a.parentElement.querySelector(copyInput.selectorTextControls));
            }
        } else if (a.classList.contains('hypergrid-curtain-close')) {
            this.stopEditing();
        }
    }
}

function invalid(subtree) {
    var isColumnFilters = subtree === this.filter.columnFilters,
        tabQueryBuilder = this.tabz.folder(isColumnFilters ? '#columnQB' : '#tableQB'),
        tab = this.tabz.enabledTab(tabQueryBuilder.parentElement),
        isQueryBuilder = tab === tabQueryBuilder,
        error = subtree.invalid({ alert: true, focus: isQueryBuilder });

    // If there was a validation error, make sure we're focused on the appropriate control.
    if (error) {
        if (!isQueryBuilder) {
            if (isColumnFilters) {
                // We're in SQL or CQL tab so find text box that goes with this subexpression and focus on it instead of QB control.
                var folder = this.tabz.folder(tab),
                    errantQueryBuilderControlEl = error.node.el,
                    errantColumnName = errantQueryBuilderControlEl.parentElement.querySelector('input').value,
                    errantColumnInputControl = folder.querySelector('[name="' + errantColumnName + '"]');

                decorateTextbox(errantColumnInputControl, error);
            }
        }
    }

    return error;
}

function decorateTextbox(ctrl, error) {
    ctrl.classList.toggle('filter-tree-error', !!error);
    ctrl.previousElementSibling.innerHTML = error || '';
    ctrl.focus();
}

function onNewColumnFilterMouseDown(evt) { // to be called with filter object as syntax
    var error = invalid(this.filter.columnFilters);

    // If there was a validation error, make sure we're focused on the appropriate control.
    if (error) {
        evt.preventDefault(); // do not drop down
    } else {
        // (re)build the drop-down contents, with same prompt, but excluding columns with active filter subexpressions
        var prompt = this.newColumnSelector[0].text.replace('…', ''), // use original but w/o ellipsis as .build() appends one
            blacklist = this.filter.columnFilters.children.map(function(columnFilter) {
                return columnFilter.children.length && columnFilter.children[0].column;
            }),
            options = {
                prompt: prompt,
                blacklist: blacklist
            };

        popMenu.build(this.newColumnSelector, this.filter.root.schema, options);
    }

}

function onNewColumnFilterChange(evt) {
    var ctrl = evt.target,
        tabColumnQB = this.tabz.folder('#tableQB'),
        tab = this.tabz.enabledTab(tabColumnQB.parentElement),
        isQueryBuilder = tab === tabColumnQB,
        tabProps = tabProperties[tab.id];

    this.filter.columnFilters.add({
        state: {
            type: 'columnFilter',
            children: [ { column: ctrl.value } ]
        },
        focus: isQueryBuilder
    });

    if (tabProps.isColumnFilter && tabProps.lanugage) {
        renderFolder.call(this, tab);
    }

    ctrl.selectedIndex = 0;
}

function renderFolder(tab) { // to be called with filter object as syntax
    var tabProps = tabProperties[tab.id],
        queryLanguage = tabProps.language;

    if (queryLanguage) {
        var globalFilter = this.filter,
            folder = this.tabz.folder(tab);

        if (tabProps.isTableFilter) {

            folder.querySelector('textarea').value = globalFilter.tableFilter.getState({ syntax: 'SQL' });

        } else { // column filter

            var columnFilters = globalFilter.columnFilters.children,
                el = folder.lastElementChild,
                msgEl = el.querySelector('span'),
                listEl = el.querySelector('ol'),
                copyAllLink = el.querySelector('a:first-of-type');

            msgEl.innerHTML = activeFiltersMessage(columnFilters.length);
            listEl.innerHTML = '';

            // for each column filter subtree, append an <li>...</li> element containing:
            // column title, "(copy)" link, and editable text input box containing the subexpression
            columnFilters.forEach(function(filter) {
                var conditional = filter.children[0],
                    item = conditional.schema[0],
                    name = conditional.column,
                    alias = item.alias || name,
                    expression = filter.getState({ syntax: queryLanguage }),
                    isNull = expression === '(NULL IS NULL)' || expression === '',
                    content = isNull ? '' : expression,
                    className = isNull ? 'filter-tree-error' : '',
                    li = automat.firstChild(markup[queryLanguage], alias, name, content, className);

                listEl.appendChild(li);
            });

            folder.onkeyup = onKeyUp.bind(this, queryLanguage);

            if (copyAllLink) {
                // if there's a "(copy all)" link, hide it if only 0 or 1 subexpressions
                copyAllLink.style.display = columnFilters.length > 1 ? 'block' : 'none';
            }
        }

    }
}

//var RETURN_KEY = 0x0d, ESCAPE_KEY = 0x1b;
/**
 * Event is triggered only for "language" tabs (tabs with text boxes for language syntax).
 * @this Filter
 * @param {string} queryLanguage
 * @param {KeyboardEvent} evt
 */
function onKeyUp(queryLanguage, evt) {
    var ctrl = evt.target;
        //folder = evt.currentTarget,
        //tab = tabz.tab(folder),
        //tabProps = tabProperties[tab.id],
        //isQueryBuilder = !tabProps.language;

    // Only handle if key was pressed inside a text box.
    if (ctrl.classList.contains('filter-text-box')) {
        //switch (evt.keyCode) {
        //    case ESCAPE_KEY:
        //        ctrl.value = oldArg;
        //    case RETURN_KEY: // eslint-disable-line no-fallthrough
        //        ctrl.blur();
        //        break;
        //    default:
        var options = { syntax: queryLanguage, alert: true };
        var error = this.filter.setColumnFilterState(ctrl.name, ctrl.value, options);

        decorateTextbox(ctrl, error);
        //}
    }
}


/**
 * Set filter object state to match the state of the user controls contained in this UI tab folder.
 *
 * This is called when switching tabs (so the tab you switch to reflects user changes); and on curtain up" (dialog exit).
 *
 * This pertains only to SQL/CQL "language" tabs; the user controls in the "query builder" tabs are bound directly to the filter object.
 */
function saveFolder() {
    //if (queryLanguage === 'CQL') {
    //    var activeColumnFilters = this.columnFilters.children.reduce(function(hash, columnFilter) {
    //        hash[columnFilter.children[0].column] = columnFilter;
    //        return hash;
    //    }, {});
    //
    //    popMenu.walk(this.filter.schema, function(column) {
    //        var cell = document.querySelector('input[name=' + column.name + ']');
    //        if (cell) {
    //            var columnFilter = activeColumnFilters[column.name];
    //            cell.value = columnFilter && !columnFilter.invalid()
    //                ? columnFilter.getState({ syntax: 'CQL' })
    //                : '';
    //        }
    //    });
    //}
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
