/* eslint-env browser */

'use strict';

var Tabz = require('tabz');
var popMenu = require('pop-menu');
var automat = require('automat');

var Dialog = require('./Dialog');
var markup = require('../../html');
var copyInput = require('../lib/DOM/copy-input');

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
 * @extends Dialog
 */
var ManageFilters = Dialog.extend('ManageFilters', {

    /**
     * @param {Hypergrid} grid
     * @param {object} [options] - May include `Dialog` options.
     * @param {HTMLElement} [options.container=document.body]
     */
    initialize: function(grid, options) {
        this.filter = grid.filter;

        this.append(markup.filterTrees);

        // initialize the folder tabs
        var tabz = this.tabz = new Tabz({
            root: this.el,
            onEnable: renderFolder.bind(this),
            onDisable: saveFolders.bind(this, null) // null options
        });

        // wire-up the New Column drop-down
        var newColumnDropDown = this.el.querySelector('#add-column-filter-subexpression');
        newColumnDropDown.onmousedown = onNewColumnMouseDown.bind(this);
        newColumnDropDown.onchange = onNewColumnChange.bind(this);

        // put the two subtrees in the two panels
        tabz.folder('#tableQB').appendChild(this.filter.tableFilter.el);
        tabz.folder('#columnsQB').appendChild(this.filter.columnFilters.el);

        // copy the SQL more-info block from the table to the columns tab
        var columnSqlEl = tabz.folder('#columnsSQL');
        var moreSqlInfo = tabz.folder('#tableSQL').firstElementChild.cloneNode(true);
        columnSqlEl.insertBefore(moreSqlInfo, columnSqlEl.firstChild);

        // add it to the DOM
        this.open(options.container);

        // following needed for unclear reasons to get drop-down to display correctly
        newColumnDropDown.selectedIndex = 0;
    },

    onClose: function() {
        return saveFolders.call(this);
    },

    onClosed: function() {
        var behavior = this.grid.behavior;
        behavior.applyAnalytics();
        behavior.changed();
    },

    /**
     * Custom click handlers; called by curtain.onclick in context
     * @param evt
     * @returns {boolean}
     */
    onClick: function(evt) { // to be called with filter object as syntax
        var ctrl = evt.target;

        if (ctrl.classList.contains('more-info')) {
            // find all more-info links and their adjacent blocks (blocks always follow links)
            var els = this.el.querySelectorAll('.more-info');

            // hide all more-info blocks except the one following this link (unless it's already visible in which case hide it too).
            for (var i = 0; i < els.length; ++i) {
                var el = els[i];
                if (el.tagName === 'A') {
                    var found = el === ctrl;
                    el.classList[found ? 'toggle' : 'remove']('hide-info');
                    el = els[i + 1];
                    el.style.display = found && el.style.display !== 'block' ? 'block' : 'none';
                }
            }

        } else if (ctrl.classList.contains('filter-copy')) {
            var isCopyAll = ctrl.childNodes.length; // contains "All"
            if (isCopyAll) {
                ctrl = this.tabz.folder(ctrl).querySelector(copyInput.selectorTextControls);
                copyInput(ctrl, this.filter.columnFilters.getState({ syntax: 'SQL' }));
            } else {
                copyInput(ctrl.parentElement.querySelector(copyInput.selectorTextControls));
            }

        } else {
            return true; // means unhandled
        }
    }
});

/**
 * @param options
 * @param tab
 * @param folder
 * @param [panel] Panel to save (from tab click). If omitted, save both panels (from onclose).
 * @returns {boolean|undefined|string}
 */
function saveFolders(options, tab, folder, panel) {
    return (
        (!panel || panel.id === 'tableFilterPanel') && saveFolder.call(this, this.filter.tableFilter, options) ||
        (!panel || panel.id === 'columnFiltersPanel') && saveFolder.call(this, this.filter.columnFilters, options)
    );
}

/**
 * @this Filter
 * @param {DefaultFilter} subtree
 * @param {object} [options={alert:true,focus:true}] - Side effects as per `FilterTree.prototype.invalid`'s `options`' parameter.
 * @returns {undefined|string} - Validation error text; falsy means valid (no error).
 */
function saveFolder(subtree, options) { // to be called with filter object as syntax
    var isColumnFilters = subtree === this.filter.columnFilters,
        tabQueryBuilder = this.tabz.tab(isColumnFilters ? '#columnsQB' : '#tableQB'),
        tab = this.tabz.enabledTab(tabQueryBuilder),
        folder = this.tabz.folder(tab),
        isQueryBuilder = tab === tabQueryBuilder,
        defaultedOptions = options || {
            alert: true,
            focus: true
        },
        enhancedOptions = {
            alert: defaultedOptions.alert,
            focus: defaultedOptions.focus && isQueryBuilder
        },
        error, ctrl;

    if (isColumnFilters || isQueryBuilder) {
        error = subtree.invalid(enhancedOptions);
    } else { // table filter SQL tab
        ctrl = folder.querySelector('textarea');
        error = this.filter.setTableFilterState(ctrl.value, options);
    }

    if (error && !isQueryBuilder) {
        // If there was a validation error, move the focus from the query builder control to the text box control.
        if (isColumnFilters) {
            // We're in SQL or CQL tab so find text box that goes with this subexpression and focus on it instead of QB control.
            var errantColumnName = error.node.el.parentElement.querySelector('input').value;
            ctrl = folder.querySelector('[name="' + errantColumnName + '"]');
        }
    }

    if (ctrl) {
        decorateFilterInput(ctrl, error);
    }

    return error;
}

function decorateFilterInput(ctrl, error) {
    ctrl.classList.toggle('filter-tree-error', !!error);

    ctrl.focus();

    // find the nearby warning element
    var warningEl;
    do {
        ctrl = ctrl.parentElement;
        warningEl = ctrl.querySelector('.filter-tree-warn');
    } while (!warningEl);

    // show or hide the error
    warningEl.innerHTML = error.message || error || '';
}

function onNewColumnMouseDown(evt) { // to be called with filter object as syntax
    if (saveFolder.call(this, this.filter.columnFilters)) {
        evt.preventDefault(); // do not drop down
    } else {
        // (re)build the drop-down contents, with same prompt, but excluding columns with active filter subexpressions
        var ctrl = evt.target,
            prompt = ctrl.options[0].text.replace('…', ''), // use original but w/o ellipsis as .build() appends one
            blacklist = this.filter.columnFilters.children.map(function(columnFilter) {
                return columnFilter.children.length && columnFilter.children[0].column;
            }),
            options = {
                prompt: prompt,
                blacklist: blacklist
            };

        popMenu.build(ctrl, this.filter.root.schema, options);
    }
}

function onNewColumnChange(evt) {
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

    // remove all but the prompt option (first child)
    ctrl.selectedIndex = 0;
    while (ctrl.lastChild !== ctrl.firstChild) {
        ctrl.removeChild(ctrl.lastChild);
    }
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

            folder.onkeyup = setColumnFilterState.bind(this, queryLanguage);

            if (copyAllLink) {
                // if there's a "(copy all)" link, hide it if only 0 or 1 subexpressions
                copyAllLink.style.display = columnFilters.length > 1 ? 'block' : 'none';
            }
        }

    }
}

//var RETURN_KEY = 0x0d, ESCAPE_KEY = 0x1b;
/**
 * Called from key-up events from `#columnSQL` and `#columnCQL` tabs.
 * @this Filter
 * @param {string} queryLanguage
 * @param {KeyboardEvent} evt
 */
function setColumnFilterState(queryLanguage, evt) {
    var ctrl = evt.target;

    // Only handle if key was pressed inside a text box.
    if (ctrl.classList.contains('filter-text-box')) {
        //switch (evt.keyCode) {
        //    case ESCAPE_KEY:
        //        ctrl.value = oldArg;
        //    case RETURN_KEY: // eslint-disable-line no-fallthrough
        //        ctrl.blur();
        //        break;
        //    default:
        var error,
            options = { syntax: queryLanguage, alert: true };

        try {
            error = this.filter.setColumnFilterState(ctrl.name, ctrl.value, options);
        } catch (err) {
            error = err;
        }

        decorateFilterInput(ctrl, error);
        //}
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


module.exports = ManageFilters;
