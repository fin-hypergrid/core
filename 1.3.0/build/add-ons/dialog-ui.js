(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

exports['list-dragon-addendum'] = [
'div.dragon-list, li.dragon-pop {',
'	font-family: Roboto, sans-serif;',
'	text-transform: capitalize; }',
'div.dragon-list {',
'	position: absolute;',
'	top: 4%;',
'	left: 4%;',
'	height: 92%;',
'	width: 20%; }',
'div.dragon-list:nth-child(2) { left: 28%; }',
'div.dragon-list:nth-child(3) { left: 52%; }',
'div.dragon-list:nth-child(4) { left: 76%; }',
'div.dragon-list > div, div.dragon-list > ul > li, li.dragon-pop { line-height: 46px; }',
'div.dragon-list > ul { top: 46px; }',
'div.dragon-list > ul > li:not(:last-child)::before, li.dragon-pop::before {',
'	content: \'\\2b24\';',
'	color: #b6b6b6;',
'	font-size: 30px;',
'	margin: 8px 14px 8px 8px; }',
'li.dragon-pop { opacity:.8; }'
].join('\n');

},{}],2:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var ListDragon = require('list-dragon');
var injectCSS = require('inject-stylesheet-template').bind(require('../css'));

var Dialog = require('./Dialog');

/**
 * @constructor
 * @extends Dialog
 */
var ColumnPicker = Dialog.extend('ColumnPicker', {
    /**
     * @param {Hypergrid} grid
     * @param {object} [options] - May include `Dialog` options.
     */
    initialize: function(grid, options) {
        var behavior = grid.behavior;

        this.grid = grid;

        if (behavior.isColumnReorderable()) {
            // parse & add the drag-and-drop stylesheet addendum
            var stylesheetAddendum = injectCSS('list-dragon-addendum');

            // grab the group lists from the behavior
            if (behavior.setGroups) {
                this.selectedGroups = {
                    title: 'Groups',
                    models: behavior.getGroups()
                };

                this.availableGroups = {
                    title: 'Available Groups',
                    models: behavior.getAvailableGroups()
                };

                var groupPicker = new ListDragon([
                    this.selectedGroups,
                    this.availableGroups
                ]);

                // add the drag-and-drop sets to the dialog
                this.append(groupPicker.modelLists[0].container);
                this.append(groupPicker.modelLists[1].container);
            }

            // grab the column lists from the behavior
            this.inactiveColumns = {
                title: 'Inactive Columns',
                models: behavior.getHiddenColumns().sort(compareByName)
            };

            this.activeColumns = {
                title: 'Active Columns',
                models: grid.getActiveColumns()
            };

            this.sortOnHiddenColumns = this.wasSortOnHiddenColumns = true;

            var columnPicker = new ListDragon([
                this.inactiveColumns,
                this.activeColumns
            ], {
                // add the list-dragon-base stylesheet right before the addendum
                cssStylesheetReferenceElement: stylesheetAddendum,
                // these models have a header property as their labels
                label: '{header}'
            });

            // add the drag-and-drop sets to the dialog
            this.append(columnPicker.modelLists[0].container);
            this.append(columnPicker.modelLists[1].container);

            //Listen to the visible column changes
            columnPicker.modelLists[1].element.addEventListener('listchanged', function(e){
                grid.fireSyntheticOnColumnsChangedEvent();
            });

            this.sortOnHiddenColumns = this.grid.properties.sortOnHiddenColumns;
        } else {
            var div = document.createElement('div');
            div.style.textAlign = 'center';
            div.style.marginTop = '2em';
            div.innerHTML = 'The selection of visible columns in the grid may not be changed.';
            this.append(div);
        }

        // Add checkbox to control panel for sorting on hidden fields
        var label = document.createElement('label');
        label.innerHTML = '<input type="checkbox"> Allow sorting on hidden columns';
        label.style.fontWeight = 'normal';
        label.style.marginRight = '2em';

        var checkbox = label.querySelector('input');
        checkbox.checked = this.sortOnHiddenColumns;
        checkbox.addEventListener('click', function(e){
            self.sortOnHiddenColumns = checkbox.checked;
            e.stopPropagation();
        });

        var panel = this.el.querySelector('.hypergrid-dialog-control-panel');
        panel.insertBefore(label, panel.firstChild);

        // add the dialog to the DOM
        this.open(options.container);
    },

    onClosed: function() {
        var behavior = this.grid.behavior,
            columns = behavior.getActiveColumns();

        if (this.activeColumns) {
            var tree = columns[0];

            // TODO: breaking encapsulation; should be using setters and getters on the behavior
            columns.length = 0;
            if (tree && tree.label === 'Tree') {
                columns.push(tree);
            }
            this.activeColumns.models.forEach(function(column) {
                columns.push(column);
            });

            if (this.sortOnHiddenColumns !== this.wasSortOnHiddenColumns) {
                behavior.sortChanged(this.inactiveColumns.models);
            }

            behavior.changed();
        }

        if (this.selectedGroups){
            var groupBys = this.selectedGroups.models.map(function(e) {
                return e.id;
            });
            behavior.setGroups(groupBys);
        }

        this.grid.takeFocus();
        this.grid.allowEvents(true);
    }
});

function compareByName(a, b) {
    a = a.header.toString().toUpperCase();
    b = b.header.toString().toUpperCase();
    return a < b ? -1 : a > b ? +1 : 0;
}


module.exports = ColumnPicker;

},{"../css":1,"./Dialog":3,"inject-stylesheet-template":14,"list-dragon":15}],3:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var automat = require('automat');
var markup = require('../html');

var Base = window.fin.Hypergrid.Base; // try require('fin-hypergrid/src/Base') when externalized

/**
 * Creates and services a DOM element used as a cntainer for a dialog. The standard `markup.dialog` is simply a div with a _control panel_ containing a close box and a settings gear icon.
 *
 * You can supply an alternative dialog template. The interface is:
 * * Class name `hypergrid-dialog`.
 * * At least one child element. Content will be inserted before this first child.
 * * Typically contains a close-box element with class name `hypergrid-dialog-close` and possibly other controls with class name `hypergrid-dialog-xxxx` (where _xxxx_ is a unique name for your control).
 *
 * @constructor
 */
var Dialog = Base.extend('Dialog', {

    /**
     * Creates a basic dialog box in `this.el`.
     * @param {Hypergrid} grid
     * @param {object} [options]
     * @param {string|function} [options.dialogTemplate] - An alternate dialog template. The last child element must be the "control panel."
     * @param {boolean} [options.settings=true] - Control box has settings icon. (Settings icon must be included in template. This option removes it. That is, if explicitly `false` _and_ there is a settings control, remove it.)
     * @param {string|boolean} [options.backgroundImage=images.dialog.src] - A URI for a background image. If explicitly `false`, background image is suppressed.
     * @param {function} [terminate]
     */
    initialize: function(grid, options) {
        options = options || {};

        this.grid = grid;

        // create the backdrop; it is absolute-positioned and stretched
        this.el = automat.firstChild(options.dialogTemplate || markup.dialog, options.dialogReplacements);

        this.originalFirstChild = this.el.firstElementChild;

        if (options.settings === false) {
            var settings = this.el.querySelector('.hypergrid-dialog-settings');
            if (settings) {
                settings.remove();
            }
        }

        // set alternative background image
        if (options.backgroundImage === false) {
            this.el.style.backgroundImage = null;
        } else if (options.backgroundImage) {
            this.el.style.backgroundImage = 'url(\'' + options.backgroundImage + '\')';
        }

        // listen for clicks
        this.el.addEventListener('click', onClick.bind(this));

        if (options.terminate) {
            this.terminate = options.terminate;
        }
    },

    /**
     * @summary Adds DOM `Node`s to dialog.
     * @desc Input can be nodes or a template from which to create nodes. The nodes are inserted into the dialog's DOM (`this.el`), right before the "control panel."
     * @param {string|function|Node|Node[]} nodes - See `automat`.
     * @param {...*} [replacements] - See `automat`.
     */
    append: function(nodes, replacements/*...*/) {
        if (typeof nodes === 'string' || typeof nodes === 'function') {
            var args = Array.prototype.slice.call(arguments);
            args.splice(1, 0, this.el, this.originalFirstChild);
            automat.append.apply(null, args);

        } else if ('length' in nodes) {
            for (var i = 0; i < nodes.length; ++i) {
                this.el.insertBefore(nodes[i], this.originalFirstChild);
            }

        } else {
            this.el.insertBefore(nodes, this.originalFirstChild);
        }
    },

    /**
     * Insert dialog into DOM.
     *
     * @param {HTMLElement} [container] - If undefined, dialog is appended to body.
     *
     * If defined, dialog is appended to container. When container is not body, it will be:
     * 0. made visible before append (it should initially be hidden)
     * 0. made hidden after remove
     */
    open: function(container) {
        var error;

        if (!(this.opened || this.opening || this.closed || this.closing)) {
            error = this.onOpen();

            if (!error) {
                var el = this.el;

                this.opening = true;

                container = container || document.querySelector('body');

                if (container.tagName !== 'BODY') {
                    container.style.visibility = 'visible';
                }

                // insert the new dialog markup into the DOM
                container.appendChild(el);

                // schedule it for a show transition
                setTimeout(function() { el.classList.add('hypergrid-dialog-visible'); }, 50);

                // at end of show transition, hide all the hypergrids behind it to prevent any key/mouse events from getting to them
                // todo: pause all hypergrids so they don't spin uselessly
                el.addEventListener('transitionend', this.hideAppBound = hideApp.bind(this));
            }
        }

        return error;
    },

    /**
     * Remove dialog from DOM.
     */
    close: function() {
        var error;

        if (this.opened && !(this.closed || this.closing)) {
            error = this.onClose();

            if (!error) {
                this.closing = true;

                // unhide all the hypergrids behind the dialog
                this.appVisible('visible');

                // start a hide transition of dialog revealing grids behind it
                this.el.classList.remove('hypergrid-dialog-visible');

                // at end of hide transition, remove dialog from the DOM
                this.el.addEventListener('transitionend', this.removeDialogBound = removeDialog.bind(this));
            }
        }

        return error;
    },

    appSelector: 'canvas.hypergrid',
    appVisible: function(visibility) {
        Array.prototype.forEach.call(document.querySelectorAll(this.appSelector), function(el) {
            el.style.visibility = visibility;
        });
    },

    onOpen: nullPattern,
    onOpened: nullPattern,
    onClose: nullPattern,
    onClosed: nullPattern,
    terminate: nullPattern
});

function nullPattern() {}

function removeDialog(evt) {
    if (evt.target === this.el && evt.propertyName === 'opacity') {
        this.el.removeEventListener('transitionend', this.removeDialogBound);

        if (this.el.parentElement.tagName !== 'BODY') {
            this.el.parentElement.style.visibility = 'hidden';
        }
        this.el.remove();
        delete this.el;

        this.onClosed();
        this.terminate();
        this.closing = false;
        this.closed = true;
    }
}

function hideApp(evt) {
    if (evt.target === this.el && evt.propertyName === 'opacity') {
        this.el.removeEventListener('transitionend', this.hideAppBound);

        this.appVisible('hidden');
        this.onOpened();
        this.opening = false;
        this.opened = true;
    }
}

function onClick(evt) {
    if (this) {
        if (evt.target.classList.contains('hypergrid-dialog-close')) {
            evt.preventDefault(); // ignore href
            this.close();

        } else if (evt.target.classList.contains('hypergrid-dialog-settings')) {
            evt.preventDefault(); // ignore href
            if (this.settings) { this.settings(); }

        } else if (this.onClick && !this.onClick.call(this, evt) && evt.target.tagName === 'A') {
            evt.preventDefault(); // ignore href of handled event
        }
    }

    evt.stopPropagation(); // the click stops here, handled or not
}

module.exports = Dialog;

},{"../html":8,"automat":12}],4:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var Tabz = require('tabz');
var popMenu = require('pop-menu');
var automat = require('automat');

var Dialog = require('./Dialog');
var markup = require('../html');
var copyInput = require('./copy-input');

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
        this.grid.takeFocus();
        this.grid.allowEvents(true);
        behavior.reindex();
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

},{"../html":8,"./Dialog":3,"./copy-input":5,"automat":12,"pop-menu":18,"tabz":19}],5:[function(require,module,exports){
/* eslint-env browser */

'use strict';

/**
 *
 * @param {HTMLElement} [containingEl=document]
 * @param {string} [prefix='']
 * @param {string} [separator='']
 * @param {string} [suffix='']
 * @param {function} [transformer=multiLineTrim] - Function to transform each input control's text value.
 */
function copyAll(containingEl, prefix, separator, suffix, transformer) {
    var texts = [], lastTextEl, text;

    Array.prototype.forEach.call((containingEl || document).querySelectorAll(copyAll.selector), function(textEl) {
        text = (transformer || multiLineTrim)(textEl.value);
        if (text) { texts.push(text); }
        lastTextEl = textEl;
    });

    if (lastTextEl) {
        copy(lastTextEl, (prefix || '') + texts.join(separator || '') + (suffix || ''));
    }
}

/**
 * 1. Trim the text in the given input element
 * 2. select it
 * 3. copy it to the clipboard
 * 4. deselect it
 * 5. return it
 * @param {HTMLElement|HTMLTextAreaElement} el
 * @param {string} [text=el.value] - Text to copy.
 * @returns {undefined|string} Trimmed text in element or undefined if unable to copy.
 */
function copy(el, text) {
    var result, textWas;

    if (text) {
        textWas = el.value;
        el.value = text;
    } else {
        text = el.value;
    }

    el.value = multiLineTrim(text);

    try {
        el.select();
        result = document.execCommand('copy');
    } catch (err) {
        result = false;
    } finally {
        if (textWas !== undefined) {
            el.value = textWas;
        }
        el.blur();
    }
    return result;
}

function multiLineTrim(s) {
    return s.replace(/^\s*(.*?)\s*$/, '$1');
}

copy.all = copyAll;
copy.multiLineTrim = multiLineTrim;
copy.selectorTextControls = 'input:not([type]), input[type=text], textarea';

module.exports = copy;

},{}],6:[function(require,module,exports){
'use strict';

module.exports.ColumnPicker = require('./ColumnPicker');
module.exports.ManageFilters = require('./ManageFilters');

},{"./ColumnPicker":2,"./ManageFilters":4}],7:[function(require,module,exports){
'use strict';

var overrider = require('overrider');

/**
 * @param {Hypergrid} grid
 * @param {object} [targets] - Hash of mixin targets. These are typically prototype objects. If not given or any targets are missing, defaults to current grid's various prototypes.
 * @constructor
 */
function DialogUI(grid, targets) {
    this.grid = grid;
    targets = targets || {};

    var Hypergrid = this.grid.constructor;
    Hypergrid.defaults.mixIn(require('./mix-ins/defaults'));

    mixInTo('Hypergrid', grid, require('./mix-ins/grid'));
    mixInTo('Behavior', grid.behavior, require('./mix-ins/behavior'));

    grid.addInternalEventListener('fin-keyup', function(e) {
        var charPressed = e.detail.char;
        grid.properties.editorActivationKeys.find(function(activationKey) {
            var isActivationKey = charPressed === activationKey.toUpperCase();
            if (isActivationKey) {
                grid.toggleDialog('ColumnPicker');
            }
            return isActivationKey;
        });
    });

    function mixInTo(target, instance, mixin) {
        var object = targets[target];
        var prototype = object && object.prototype || Object.getPrototypeOf(instance);

        overrider(prototype, mixin);
    }
}

DialogUI.prototype.$$CLASS_NAME = 'DialogUI';

window.fin.Hypergrid.DialogUI = DialogUI;

},{"./mix-ins/behavior":9,"./mix-ins/defaults":10,"./mix-ins/grid":11,"overrider":17}],8:[function(require,module,exports){
'use strict';

exports.CQL = [
'<li>',
'	<label title="${1}">',
'		<a type="button" class="filter-copy"></a>',
'		<div class="filter-tree-remove-button" title="delete conditional"></div>',
'		<strong>%{0}:</strong>',
'		<input name="${1}" class="filter-text-box ${3}" value="%{2}">',
'	</label>',
'	<div class="filter-tree-warn"></div>',
'</li>'
].join('\n');

exports.SQL = [
'<li>',
'	<label title="${1}">',
'		<a type="button" class="filter-copy"></a>',
'		<div class="filter-tree-remove-button" title="delete conditional"></div>',
'		<strong>%{0}:</strong>',
'		<textarea name="${1}" rows="1" class="filter-text-box ${3}">%{2}</textarea>',
'	</label>',
'	<div class="filter-tree-warn"></div>',
'</li>'
].join('\n');

exports.dialog = [
'<div id="hypergrid-dialog">',
'',
'	<style>',
'		#hypergrid-dialog {',
'			position: absolute;',
'			top: 0;',
'			left: 0;',
'			bottom: 0;',
'			right: 0;',
'			background-color: white;',
'			background-image: url(data:png;base64,iVBORw0KGgoAAAANSUhEUgAAAH4AAAAUCAMAAAB8knmGAAAAXVBMVEXn4tfm4dfn4tjn49no5Nrp5dzp5Nvm4dbi3NDg2s3o5Nvl4NTh287k39Pp5dvh3M/j3dHk39Tl4NXg287k3tPi3dHh3NDm4tfj3tLh28/o49ro49ng2s7l4dbl4Nb6VbEyAAAC1ElEQVR4AXVV0YKDKAwE4AAVK6SwC9bt/3/mnYJ2tF7ewMEJyWRgjHMuhFT/nEMb261hxbrqh23hRomYhxLrYfXATTm6DTv060q0vxh9+b+SYj3Muj3c5IORAFMBEtD0rKgoAHIJLWLlfpIG8qAAIk3wk9tJKz2E84GrHUvbVhLbyvw0iA2/6ota/Qbbvv+YbUekbUV6R/Dg3YWN+ZyzT/a8X6KpBLpW3cta2FCOLFMkLuZe97PgFJM7joaG9bUHlVyZWM63tGllZp+yzIwipGFJQwJ5rqgX2e7/w9KrwuYMAtBkgTbS73z0r9JD9IJyy2GJEjSQD9kJwiIeTSNxyC9Dz2VcGiKT6IHplr7VynbA+UpVA+bxQYi/kNPknJtSDn9CfebBNPSrZdK0r+6ImE8p5RzDm4szgFtIQNqme3ZkcBsP1rRvJZBbfr6c4O8Qc04pgfJrY5rs4dJ5hhZ0z9z6+x0vys8Oyj5nKEMTP8oLBw+7OAh9TkCdJ8/5Nno4dt6d506dybUYbhTDmFjtxwxjTvjVDhITiJVNoe5LyoGIQk4Ftd+QEcnlYPF+KY+DWc1WgPSqJeXjXxPpT9uXoBqGx6m7jylyvRvm8hGApuNAyWis98rXYvevZVSguzgfw8kGf3aR4gd2DNUcQX1qXHavvLFrpv6L/nt/d+9RXV8OFDCFEAhHBt+qSr6/FN+37JVS7BC9zwOXj6/JW04JLB7m984v/HIiX77m7iH5kL1198ov8OI0ziX01b32Fo9c3VHzce9xdcs+LC0TeHPKRfmulOLcZfTyW2ICz6Dr5Fl4F41o1q1nYeAts6buhieSy3e+kqzM7PP885AtfB0FJOCoUZnUQSyllAU3kmk4ckAuRqC2OXAh1b3ylaBj9Ka3PidQQxJcBEtGrWRncv2ejrEjVCnSX9tYOuBk07YI4J6MYppcBU0pEgOvDtv+xCCTrtwL5l87wVO3O/g5GQAAAABJRU5ErkJggg==);',
'			font: 10pt sans-serif;',
'			opacity: 0;',
'			transition: opacity 1s;',
'			box-shadow: rgba(0, 0, 0, 0.298039) 0px 19px 38px, rgba(0, 0, 0, 0.219608) 0px 15px 12px;',
'		}',
'		#hypergrid-dialog.hypergrid-dialog-visible {',
'			opacity: 1;',
'			transition: opacity 1s;',
'		}',
'',
'		#hypergrid-dialog .hypergrid-dialog-control-panel {',
'			position: absolute;',
'			top: 0px;',
'			right: 12px;',
'		}',
'		#hypergrid-dialog .hypergrid-dialog-control-panel a {',
'			color: #999;',
'			font-size: 33px;',
'			transition: text-shadow .35s, color .35s;',
'			text-decoration: none;',
'		}',
'		#hypergrid-dialog .hypergrid-dialog-close:after {',
'			content: \'\\D7\';',
'		}',
'		#hypergrid-dialog .hypergrid-dialog-settings:after {',
'			font-family: Apple Symbols;',
'			content: \'\\2699\';',
'		}',
'		#hypergrid-dialog .hypergrid-dialog-control-panel a:hover {',
'			color: black;',
'			text-shadow: 0 0 6px #337ab7;',
'			transition: text-shadow .35s, color .35s;',
'		}',
'		#hypergrid-dialog .hypergrid-dialog-control-panel a:active {',
'			color: #d00;',
'			transition: color 0s;',
'		}',
'	</style>',
'',
'	<span class="hypergrid-dialog-control-panel">',
'		<a class="hypergrid-dialog-settings" title="(There are no settings for Manage Filters at this time.)"></a>',
'		<a class="hypergrid-dialog-close"></a>',
'	</span>',
'',
'</div>'
].join('\n');

exports.filterTrees = [
'<style>',
'	#hypergrid-dialog > div {',
'		position: absolute;',
'		top: 0;',
'		left: 0;',
'		bottom: 0;',
'		right: 0;',
'	}',
'	#hypergrid-dialog > div:first-of-type {',
'		padding: 1em 1em 1em 0.5em;',
'		margin-left: 50%;',
'	}',
'	#hypergrid-dialog > div:last-of-type {',
'		padding: 1em 0.5em 1em 1em;',
'		margin-right: 50%;',
'	}',
'	#hypergrid-dialog > div > p:first-child {',
'		margin-top: 0;',
'	}',
'	#hypergrid-dialog > div > p > span:first-child {',
'		font-size: larger;',
'		letter-spacing: 2px;',
'		font-weight: bold;',
'		color: #666;',
'		margin-right: 1em;',
'	}',
'	#hypergrid-dialog input, #hypergrid-dialog textarea {',
'		outline: 0;',
'		line-height: initial;',
'	}',
'',
'	.tabz { z-index: 0 }',
'	.tabz > p:first-child, .tabz > section > p:first-child, .tabz > section > div > p:first-child { margin-top: 0 }',
'',
'	#hypergrid-dialog a.more-info { font-size: smaller; }',
'	#hypergrid-dialog a.more-info::after { content: \'(more info)\'; }',
'	#hypergrid-dialog a.more-info.hide-info { color: red; }',
'	#hypergrid-dialog a.more-info.hide-info::after { content: \'(hide info)\'; }',
'	#hypergrid-dialog div.more-info {',
'		border: 1px tan solid;',
'		border-radius: 8px;',
'		padding: 0 8px .2em;',
'		display: none;',
'		background-color: ivory;',
'		box-shadow: 3px 3px 5px #707070;',
'		margin-bottom: 1em;',
'	}',
'	#hypergrid-dialog div.more-info > p { margin: .5em 0; }',
'',
'	#hypergrid-dialog .tabz ul {',
'		padding-left: 1.5em;',
'		list-style-type: circle;',
'		font-weight: bold;',
'	}',
'	#hypergrid-dialog .tabz ul > li > ul {',
'		list-style-type: disc;',
'		font-weight: normal;',
'	}',
'	#hypergrid-dialog .tabz li {',
'		margin: .3em 0;',
'	}',
'	#hypergrid-dialog .tabz li > code {',
'		background: #e0e0e0;',
'		margin: 0 .1em;',
'		padding: 0 5px;',
'		border-radius: 4px;',
'	}',
'',
'	#hypergrid-dialog .tabz > section.filter-expression-syntax > div:last-child ol {',
'		padding-left: 1.6em;',
'	}',
'	#hypergrid-dialog .tabz > section.filter-expression-syntax > div:last-child ol > li > label {',
'		width: 100%;',
'		font-weight: normal;',
'		display: inline;',
'	}',
'	#hypergrid-dialog .tabz .filter-tree-warn {',
'		color: darkred;',
'		font-size: smaller;',
'		font-style: italic;',
'		line-height: initial;',
'	}',
'	#hypergrid-dialog .tabz > section.filter-expression-syntax > textarea,',
'	#hypergrid-dialog .tabz > section.filter-expression-syntax > div:last-child textarea,',
'	#hypergrid-dialog .tabz > section.filter-expression-syntax > div:last-child input {',
'		display: block;',
'		position: relative;',
'		min-width: 100%;',
'		max-width: 100%;',
'		box-sizing: border-box;',
'		border: 1px solid black;',
'		padding: .4em .7em;',
'		font-family: monospace;',
'		font-size: 9pt;',
'		margin-top: 3px;',
'	}',
'	#hypergrid-dialog .tabz > section.filter-expression-syntax > textarea {',
'		height: 96%;',
'	}',
'	#hypergrid-dialog .tabz a.filter-copy {',
'		display: block;',
'		float: right;',
'		font-size: smaller;',
'	}',
'	#hypergrid-dialog .tabz a.filter-copy:before {',
'		content: \'(copy\';',
'	}',
'	#hypergrid-dialog .tabz a.filter-copy:after {',
'		content: \')\';',
'	}',
'	#hypergrid-dialog .tabz a.filter-copy:active {',
'		color: red;',
'	}',
'</style>',
'',
'<div>',
'	<select id="add-column-filter-subexpression" style="float:right; margin-left:1em; margin-right:4em;">',
'		<option value="">New column filter&hellip;</option>',
'	</select>',
'',
'	<p>',
'		<span>Column Filters</span>',
'		<a class="more-info"></a>',
'	</p>',
'	<div class="more-info">',
'		<p>The table filter can be viewed in the Query Builder or as SQL WHERE clause syntax. Both interfaces manipulate the same underlying filter data structure.</p>',
'		<p>All column filters are AND&rsquo;d together. Each grid row is first qualified by the table filter and then successively qualified by each column filter subexpression.</p>',
'	</div>',
'',
'	<div class="tabz" id="columnFiltersPanel">',
'',
'		<header id="columnsQB" class="default-tab">',
'			Query Builder',
'		</header>',
'',
'		<section>',
'		</section>',
'',
'		<header id="columnsSQL" class="tabz-bg2">',
'			SQL',
'		</header>',
'',
'		<section class="filter-expression-syntax tabz-bg2">',
'			<div>',
'				<p>',
'					<span></span>',
'					<a type="button" class="filter-copy" title="The state of the column filters subtree expressed in SQL syntax (all the column filter subexpressions shown below AND&rsquo;d together).">',
'						all</a>',
'				</p>',
'				<ol></ol>',
'			</div>',
'		</section>',
'',
'		<header id="columnsCQL" class="tabz-bg1">',
'			CQL',
'		</header>',
'',
'		<section class="filter-expression-syntax tabz-bg1">',
'			<p>',
'				<em>',
'					<small>Column filter cells accept a simplified, compact, and intuitive syntax, which is however not as flexible or concise as SQL syntax or using the Query Builder.</small>',
'					<a class="more-info"></a>',
'				</em>',
'			</p>',
'			<div class="more-info">',
'				<ul>',
'					<li>',
'						Simple expressions',
'						<ul>',
'							<li>All simple expressions take the form <i>operator literal</i> or <i>operator identifier</i>. The (left side) column is always implied and is the same for all simple expressions in a compound expression. This is because column filters are always tied to a known column.</li>',
'',
'							<li>If the operator is an equals sign (=), it may be omitted.</li>',
'',
'							<li>Besides operators, no other punctuation is permitted, meaning that no quotation marks and no parentheses.</li>',
'',
'							<li>If a literal exactly matches a column name or alias, the operand is not taken literally and instead refers to the value in that column. (There are properties to control what constitutes such a match: Column name, alias, or either; and the case-sensitivity of the match.)</li>',
'',
'							<li>As literals are unquoted, any operator symbol or operator word (including logical operators for compound expressions) terminates a literal.</li>',
'',
'							<li>An important corollary to the above features is that operators may not appear in literals.</li>',
'						</ul>',
'					</li>',
'',
'					<li>',
'						Compound expressions',
'						<ul>',
'							<li>Compound expressions are formed by connecting simple expressions with the logical operators <code>AND</code>, <code>OR</code>, <code>NOR</code>, or <code>NAND</code> ("not and").</li>',
'',
'							<li>However, all logical operators used in a compound column filter expression must be homogeneous. You may not mix the above logical operators in a single column. (If you need to do this, create a table filter expression instead.)</li>',
'						</ul>',
'					</li>',
'',
'					<li>',
'						Hidden logic',
'						<ul>',
'							<li>If the column is also referenced in a table filter expression (on the left side of a simple expression), the column filter is flagged in its grid cell with a special star character. This is just a flag; it is not part of the syntax. <span style="color:red; font-style:italic">Not yet implemented.</span></li>',
'						</ul>',
'					</li>',
'				</ul>',
'			</div>',
'',
'			<div>',
'				<p><span></span></p>',
'				<ol></ol>',
'			</div>',
'		</section>',
'	</div>',
'</div>',
'',
'<div>',
'	<p>',
'		<span>Table Filter</span>',
'		<a class="more-info"></a>',
'	</p>',
'	<div class="more-info">',
'		<p>The table filter can be viewed in the Query Builder or as SQL WHERE clause syntax. Both interfaces manipulate the same underlying filter data structure.</p>',
'		<p>',
'			These filter subexpressions are both required (<code>AND</code>&rsquo;d together), resulting in a subset of <em>qualified rows</em> which have passed through both filters.',
'			It\'s called a <dfn>tree</dfn> because it contains both <dfn>branches</dfn> and <dfn>leaves</dfn>.',
'			The leaves represent <dfn>conditional expressions</dfn> (or simply <dfn>conditionals</dfn>).',
'			The branches, also known as <dfn>subtrees</dfn>, contain leaves and/or other branches and represent subexpressions that group conditionals together.',
'			Grouped conditionals are evaluated together, before conditionals outside the group.',
'		</p>',
'	</div>',
'',
'	<div class="tabz" id="tableFilterPanel">',
'		<header id="tableQB">',
'			Query Builder',
'		</header>',
'',
'		<section>',
'		</section>',
'',
'		<header id="tableSQL" class="tabz-bg2">',
'			SQL',
'		</header>',
'',
'		<section class="filter-expression-syntax tabz-bg2">',
'			<div>',
'				<p>',
'					SQL WHERE clause syntax with certain restrictions.',
'					<a class="more-info"></a>',
'				</p>',
'				<div class="more-info">',
'					<ul>',
'						<li>',
'							Simple expressions',
'							<ul>',
'								<li>All simple expressions must be of the form <i>column operator literal</i> or <i>column operator identifier</i>. That is, the left side must refer to a column (may not be a literal); whereas the right side may be either.</li>',
'',
'								<li>Column names may be quoted with the currently set quote characters (typically double-quotes). If unquoted, they must consist of classic identifier syntax (alphanumerics and underscore, but not beginning with a numeral).</li>',
'',
'								<li>All literals must be quoted strings (using single quotes). (In a future release we expect to support unquoted numeric syntax for columns explicitly typed as numeric.)</li>',
'							</ul>',
'						</li>',
'',
'						<li>',
'							Compound expressions',
'							<ul>',
'								<li>Compound expressions are formed by connecting simple expressions with the logical operators <code>AND</code> or <code>OR</code>.</li>',
'',
'								<li>However, all logical operators at each level in a complex expression (each parenthesized subexpression) must be homogeneous, <i>i.e.,</i> either <code>AND</code> or <code>OR</code> but not a mixture of the two. In other words, there is no implicit operator precedence; grouping of expressions must always be explicitly stated with parentheses.</li>',
'',
'								<li>The unary logical operator <code>NOT</code> is supoorted before parentheses only. While the Query Builder and the Column Filter allow they syntax <code>&hellip; NOT <i>operator</i> &hellip;</code> (where <code><i>operator</i></code> is <code>IN</code>, <code>LIKE</code>, <i>etc.</i>), these must be expressed here with parenthethes: <code>NOT (&hellip; <i>operator</i> &hellip;)</code>.</li>',
'',
'								<li>While the Query Builder and Column Filter syntax support the pseudo-operators <code>NOR</code> and <code>NAND</code>, in SQL these must be expressed as <code>NOT (&hellip; OR &hellip;)</code> and <code>NOT (&hellip; AND &hellip;)</code>, respectively.</li>',
'',
'								<li>The Query Builder and Column Filter syntax also support the pseudo-operators <code>BEGINS abc</code>, <code>ENDS xyz</code>, and <code>CONTAINS def</code>. These are expressed in SQL by <code>LIKE \'abc%\'</code>, <code>LIKE \'%xyz\'</code>, and <code>LIKE \'%def%\'</code>, respectively.</li>',
'							</ul>',
'						</li>',
'					</ul>',
'				</div>',
'			</div>',
'			<div class="filter-tree-warn"></div>',
'			<textarea></textarea>',
'		</section>',
'',
'	</div>',
'</div>'
].join('\n');

},{}],9:[function(require,module,exports){
'use strict';
var dialogs = require('../dialogs');

module.exports = {
    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling double click to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {string[]} [options] - Forwarded to dialog constructor.
     */
    openDialog: function(dialogName, options) {
        return new dialogs[dialogName](this.grid, options);
    }
};


},{"../dialogs":6}],10:[function(require,module,exports){
'use strict';

exports.editorActivationKeys = ['alt', 'esc'];

},{}],11:[function(require,module,exports){
'use strict';

var _ = require('object-iterators'); // fyi: installs the Array.prototype.find polyfill, as needed

module.exports = {

    /**
     * @summary Sticky hash of dialog options objects.
     * @desc Each key is a dialog name; the value is the options object for that dialog.
     * The default dialog options object has the key `'undefined'`, which is undefined by default; it is set by calling `setDialogOptions` with no `dialogName` parameter.
     * @private
     */
    dialogOptions: {},

    /**
     * @summary Set and/or return a specific dialog options object *or* a default dialog options object.
     *
     * @desc If `options` defined:
     * * If `dialogName` defined: Save the specific dialog's options object.
     * * If `dialogName` undefined: Save the default dialog options object.
     *
     * If `options` is _not_ defined, no new dialog options object will be saved; but a previously saved preset will be returned (after mixing in the default preset if there is one).
     *
     * The default dialog options object is used in two ways:
     * * when a dialog has no options object
     * * as a mix-in base when a dialog does have an options object
     *
     * @param {string} [dialogName] If undefined, `options` defines the default dialog options object.
     *
     * @param {object} [options] If defined, preset the named dialog options object or the default dialog options object if name is undefined.
     *
     * @returns {object} One of:
     * * When `options` undefined, first of:
     *   * previous preset
     *   * default preset
     *   * empty object
     * * When `options` defined, first of:
     *   * mix-in: default preset members + `options` members
     *   * `options` verbatim when default preset undefined
     */
    setDialogOptions: function(dialogName, options) {
        if (typeof dialogName === 'object') {
            options = dialogName;
            dialogName = undefined;
        }
        var defaultOptions = this.dialogOptions.undefined;
        options = options || dialogName && this.dialogOptions[dialogName];
        if (options) {
            this.dialogOptions[dialogName] = options;
            if (defaultOptions) {
                options = _({}).extend(defaultOptions, options); // make a mix-in
            }
        } else {
            options = defaultOptions || {};
        }
        return options;
    },

    /**
     * Options objects are remembered for subsequent use. Alternatively, they can be preset by calling {@link Hypergrid#setDialogOptions|setDialogOptions}.
     * @param {string} dialogName
     * @param {object} [options] - If omitted, use the options object previously given here (or to {@link Hypergrid#setDialogOptions|setDialogOptions}), if any. In any case, the resultant options object, if any, is mixed into the default options object, if there is one.
     */
    openDialog: function(dialogName, options) {
        this.stopEditing();
        options = this.setDialogOptions(dialogName, options);
        options.terminate = function() { // when about-to-be-opened dialog is eventually closed
            delete this.dialog;
        }.bind(this);
        this.dialog = this.behavior.openDialog(dialogName, options);
        this.allowEvents(false);
    },

    // although you can have multiple dialogs open at the same time, the following enforces one at a time (for now)
    toggleDialog: function(newDialogName, options) {
        var dialog = this.dialog,
            oldDialogName = dialog && dialog.$$CLASS_NAME;
        if (!dialog || !this.dialog.close() && oldDialogName !== newDialogName) {
            if (!dialog) {
                // open new dialog now
                this.openDialog(newDialogName, options);
            } else {
                // open new dialog when already-opened dialog finishes closing due to .closeDialog() above
                dialog.terminate = this.openDialog.bind(this, newDialogName, options);
                this.allowEvents(true);
                this.takeFocus();
            }
        }
    }

};

},{"object-iterators":16}],12:[function(require,module,exports){
/* eslint-env browser */

'use strict';

/** @module automat */

var ENCODERS = /%\{(\d+)\}/g; // double $$ to encode

var REPLACERS = /\$\{(.*?)\}/g; // single $ to replace


/**
 * @summary String formatter.
 *
 * @desc String substitution is performed on numbered _replacer_ patterns like `${n}` or _encoder_ patterns like `%{n}` where n is the zero-based `arguments` index. So `${0}` would be replaced with the first argument following `text`.
 *
 * Encoders are just like replacers except the argument is HTML-encoded before being used.
 *
 * To change the format patterns, assign new `RegExp` patterns to `automat.encoders` and `automat.replacers`.
 *
 * @param {string|function} template - A template to be formatted as described above. Overloads:
 * * A string primitive containing the template.
 * * A function to be called with `this` as the calling context. The template is the value returned from this call.
 *
 * @param {...*} [replacements] - Replacement values for numbered format patterns.
 *
 * @return {string} The formatted text.
 *
 * @memberOf module:automat
 */
function automat(template, replacements/*...*/) {
    var hasReplacements = arguments.length > 1;

    // if `template` is a function, convert it to text
    if (typeof template === 'function') {
        template = template.call(this); // non-template function: call it with context and use return value
    }

    if (hasReplacements) {
        var args = arguments;
        template = template.replace(automat.replacersRegex, function(match, key) {
            key -= -1; // convert to number and increment
            return args.length > key ? args[key] : '';
        });

        template = template.replace(automat.encodersRegex, function(match, key) {
            key -= -1; // convert to number and increment
            if (args.length > key) {
                var htmlEncoderNode = document.createElement('DIV');
                htmlEncoderNode.textContent = args[key];
                return htmlEncoderNode.innerHTML;
            } else {
                return '';
            }
        });
    }

    return template;
}

/**
 * @summary Replace contents of `el` with `Nodes` generated from formatted template.
 *
 * @param {string|function} template - See `template` parameter of {@link automat}.
 *
 * @param {HTMLElement} [el] - Node in which to return markup generated from template. If omitted, a new `<div>...</div>` element will be created and returned.
 *
 * @param {...*} [replacements] - Replacement values for numbered format patterns.
 *
 * @return {HTMLElement} The `el` provided or a new `<div>...</div>` element, its `innerHTML` set to the formatted text.
 *
 * @memberOf module:automat
 */
function replace(template, el, replacements/*...*/) {
    var elOmitted = typeof el !== 'object',
        args = Array.prototype.slice.call(arguments, 1);

    if (elOmitted) {
        el = document.createElement('DIV');
        args.unshift(template);
    } else {
        args[0] = template;
    }

    el.innerHTML = automat.apply(null, args);

    return el;
}

/**
 * @summary Append or insert `Node`s generated from formatted template into given `el`.
 *
 * @param {string|function} template - See `template` parameter of {@link automat}.
 *
 * @param {HTMLElement} el
 *
 * @param {Node} [referenceNode=null] Inserts before this element within `el` or at end of `el` if `null`.
 *
 * @param {...*} [replacements] - Replacement values for numbered format patterns.
 *
 * @returns {Node[]} Array of the generated nodes (this is an actual Array instance; not an Array-like object).
 *
 * @memberOf module:automat
 */
function append(template, el, referenceNode, replacements/*...*/) {
    var replacementsStartAt = 3,
        referenceNodeOmitted = typeof referenceNode !== 'object';  // replacements are never objects

    if (referenceNodeOmitted) {
        referenceNode = null;
        replacementsStartAt = 2;
    }

    replacements = Array.prototype.slice.call(arguments, replacementsStartAt);
    var result = [],
        div = replace.apply(null, [template].concat(replacements));

    while (div.childNodes.length) {
        result.push(div.firstChild);
        el.insertBefore(div.firstChild, referenceNode); // removes child from div
    }

    return result;
}

/**
 * Use this convenience wrapper to return the first child node described in `template`.
 *
 * @param {string|function} template - If a function, extract template from comment within.
 *
 * @returns {HTMLElement} The first `Node` in your template.
 *
 * @memberOf module:automat
 */
function firstChild(template, replacements/*...*/) {
    return replace.apply(null, arguments).firstChild;
}

/**
 * Use this convenience wrapper to return the first child element described in `template`.
 *
 * @param {string|function} template - If a function, extract template from comment within.
 *
 * @returns {HTMLElement} The first `HTMLElement` in your template.
 *
 * @memberOf module:automat
 */
function firstElement(template, replacements/*...*/) {
    return replace.apply(null, arguments).firstElementChild;
}

/**
 * @summary Finds string substitution lexemes that require HTML encoding.
 * @desc Modify to suit.
 * @default %{n}
 * @type {RegExp}
 * @memberOf module:automat
 */
automat.encodersRegex = ENCODERS;

/**
 * @summary Finds string substitution lexemes.
 * @desc Modify to suit.
 * @default ${n}
 * @type {RegExp}
 * @memberOf module:automat
 */
automat.replacersRegex = REPLACERS;

automat.format = automat; // if you find using just `automat()` confusing
automat.replace = replace;
automat.append = append;
automat.firstChild = firstChild;
automat.firstElement = firstElement;

module.exports = automat;

},{}],13:[function(require,module,exports){
'use strict';

/* eslint-env browser */

/** @namespace cssInjector */

/**
 * @summary Insert base stylesheet into DOM
 *
 * @desc Creates a new `<style>...</style>` element from the named text string(s) and inserts it but only if it does not already exist in the specified container as per `referenceElement`.
 *
 * > Caveat: If stylesheet is for use in a shadow DOM, you must specify a local `referenceElement`.
 *
 * @returns A reference to the newly created `<style>...</style>` element.
 *
 * @param {string|string[]} cssRules
 * @param {string} [ID]
 * @param {undefined|null|Element|string} [referenceElement] - Container for insertion. Overloads:
 * * `undefined` type (or omitted): injects stylesheet at top of `<head>...</head>` element
 * * `null` value: injects stylesheet at bottom of `<head>...</head>` element
 * * `Element` type: injects stylesheet immediately before given element, wherever it is found.
 * * `string` type: injects stylesheet immediately before given first element found that matches the given css selector.
 *
 * @memberOf cssInjector
 */
function cssInjector(cssRules, ID, referenceElement) {
    if (typeof referenceElement === 'string') {
        referenceElement = document.querySelector(referenceElement);
        if (!referenceElement) {
            throw 'Cannot find reference element for CSS injection.';
        }
    } else if (referenceElement && !(referenceElement instanceof Element)) {
        throw 'Given value not a reference element.';
    }

    var container = referenceElement && referenceElement.parentNode || document.head || document.getElementsByTagName('head')[0];

    if (ID) {
        ID = cssInjector.idPrefix + ID;

        if (container.querySelector('#' + ID)) {
            return; // stylesheet already in DOM
        }
    }

    var style = document.createElement('style');
    style.type = 'text/css';
    if (ID) {
        style.id = ID;
    }
    if (cssRules instanceof Array) {
        cssRules = cssRules.join('\n');
    }
    cssRules = '\n' + cssRules + '\n';
    if (style.styleSheet) {
        style.styleSheet.cssText = cssRules;
    } else {
        style.appendChild(document.createTextNode(cssRules));
    }

    if (referenceElement === undefined) {
        referenceElement = container.firstChild;
    }

    container.insertBefore(style, referenceElement);

    return style;
}

/**
 * @summary Optional prefix for `<style>` tag IDs.
 * @desc Defaults to `'injected-stylesheet-'`.
 * @type {string}
 * @memberOf cssInjector
 */
cssInjector.idPrefix = 'injected-stylesheet-';

// Interface
module.exports = cssInjector;

},{}],14:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var automat = require('automat');

/**
 * @summary Injects the named stylesheet into `<head>`.
 * @desc Stylesheets are inserted consecutively at end of `<head>` unless `before === true` (or omitted and `injectStylesheetTemplate.before` truthy) in which case they are inserted consecutively before first stylesheet found in `<head>` (if any) at load time.
 *
 * The calling context (`this`) is a stylesheet registry.
 * If `this` is undefined, the global stylesheet registry (css/index.js) is used.
 * @this {object}
 * @param {boolean} [before=injectStylesheetTemplate.before] - Add stylesheet before intially loaded stylesheets.
 *
 * _If omitted:_
 * 1. `id` is promoted to first argument position
 * 2. `injectStylesheetTemplate.before` is `true` by default
 * @param {string} id - The name of the style sheet in `this`, a stylesheet "registry" (hash of stylesheets).
 * @returns {Element|*}
 */
function injectStylesheetTemplate(before, id) {
    var optionalArgsStartAt, stylesheet, head, refNode, css, args,
        prefix = injectStylesheetTemplate.prefix;

    if (typeof before === 'boolean') {
        optionalArgsStartAt = 2;
    } else {
        id = before;
        before = injectStylesheetTemplate.before;
        optionalArgsStartAt = 1;
    }

    stylesheet = document.getElementById(prefix + id);

    if (!stylesheet) {
        head = document.querySelector('head');

        if (before) {
            // note position of first stylesheet
            refNode = Array.prototype.slice.call(head.children).find(function(child) {
                var id = child.getAttribute('id');
                return child.tagName === 'STYLE' && (!id || id.indexOf(prefix) !== prefix) ||
                    child.tagName === 'LINK' && child.getAttribute('rel') === 'stylesheet';
            });
        }

        css = this[id];

        if (!css) {
            throw 'Expected to find member `' + id + '` in calling context.';
        }

        args = [
            '<style>\n' + css + '\n</style>\n',
            head,
            refNode || null // explicitly null per https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore
        ];

        if (arguments.length > 1) {
            args = args.concat(Array.prototype.slice.call(arguments, optionalArgsStartAt));
        }

        stylesheet = automat.append.apply(null, args)[0];
        stylesheet.id = prefix + id;
    }

    return stylesheet;
}

injectStylesheetTemplate.before = true;
injectStylesheetTemplate.prefix = 'injected-stylesheet-';

module.exports = injectStylesheetTemplate;

},{"automat":12}],15:[function(require,module,exports){
// list-dragon node module
// https://github.com/joneit/list-dragon

/* eslint-env node, browser */

'use strict';

var cssInjector = require('css-injector');
var format = require('templex');

var REVERT_TO_STYLESHEET_VALUE = null;  // null removes the style

var transform, timer, scrollVelocity, cssListDragon;

/* inject:css */
cssListDragon = 'div.dragon-list{position:relative;background-color:#fff}div.dragon-list>div,div.dragon-list>ul{position:absolute;left:0;right:0}div.dragon-list>div{text-align:center;background-color:#00796b;color:#fff;box-shadow:0 3px 6px rgba(0,0,0,.16),0 3px 6px rgba(0,0,0,.23);overflow:hidden;white-space:nowrap}div.dragon-list>ul{overflow-y:auto;bottom:0;margin:0;padding:0;box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24)}div.dragon-list>ul>li,li.dragon-pop{white-space:nowrap;list-style-type:none;border:0 solid #f4f4f4;border-bottom:1px solid #e0e0e0;cursor:move;transition:border-top-width .2s}div.dragon-list>ul>li:last-child{height:0;border-bottom:none}li.dragon-pop{position:fixed;background-color:#fff;border:1px solid #e0e0e0;left:0;top:0;overflow-x:hidden;box-shadow:rgba(0,0,0,.188235) 0 10px 20px,rgba(0,0,0,.227451) 0 6px 6px}';
/* endinject */

/**
 * @constructor ListDragon
 *
 * @desc This object services a set of item lists that allow dragging and dropping items within and between lists in a set.
 *
 * Two strategies are supported:
 *
 * 1. Supply your own HTML markup and let the API build the item models for you.
 *    To use this strategy, script your HTML and provide one of these:
 *    * an array of all the list item (`<li>`) tags
 *    * a CSS selector that points to all the list item tags
 * 2. Supply your own item models and let the API build the HTML markup for you.
 *    To use this strategy, provide an array of model lists.
 *
 * The new ListDragon object's `modelLists` property references the array of model lists the API constructed for you in strategy #1 or the array of model lists you supplied for strategy #2.
 *
 * After the user performs a successful drag-and-drop operation, the position of the model references within the `modelLists` array is rearranged. (The models themselves are the original objects as supplied in the model lists; they are not rebuilt or altered in any way. Just the references to them are moved around.)
 *
 * @param {string|Element[]|modelListType[]} selectorOrModelLists - You must supply one of the items in **bold** below:
 *
 * 1. _For strategy #1 above (API creates models from supplied elements):_ All the list item (`<li>`) DOM elements of all the lists you want the new object to manage, as either:
 *    1. **A CSS selector;** _or_
 *    2. **An array of DOM elements**
 * 2. _For strategy #2 above (API creates elements from supplied models):_ **An array of model lists,** each of which is in one of the following forms:
 *    1. An array of item models (with various option properties hanging off of it); _and/or_
 *    2. A {@link modelListType} object with those same various option properties including the required `models` property containing that same array of item models.
 *
 * In either case (2.1 or 2.2), each element of such arrays of item models may take the form of:
 * * A string primitive; _or_
 * * A {@link itemModelType} object with a various option properties including the required `label` property containing a string primitive.
 *
 * Regarding these string primitives, each is either:
 * * A string to be displayed in the list item; _or_
 * * A format string with other property values merged in, the result of which is to be displayed in the list item.
 *
 * @param {object} [options={}] - You may supply "global" template variables here, representing the "outer scope," after first searching each model and then each model list.
 * @param {undefined|null|Element|string} [cssStylesheetReferenceElement] - Determines where to insert the stylesheet. (This is the only formal option.) Passed to css-injector, the overloads are (from css-injector docs):
 * * `undefined` type (or omitted): injects stylesheet at top of `<head>...</head>` element
 * * `null` value: injects stylesheet at bottom of `<head>...</head>` element
 * * `Element` type: injects stylesheet immediately before given element, wherever it is found.
 * * `string` type: injects stylesheet immediately before given first element found that matches the given css selector.
 */
function ListDragon(selectorOrModelLists, options) {

    if (!(this instanceof ListDragon)) {
        throw error('Not called with "new" keyword.');
    }

    var self = this, modelLists, items;

    options = options || {};

    if (typeof selectorOrModelLists === 'string') {
        items = toArray(document.querySelectorAll(selectorOrModelLists));
        modelLists = createModelListsFromListElements(items);
    } else if (selectorOrModelLists[0] instanceof Element) {
        items = toArray(selectorOrModelLists);
        modelLists = createModelListsFromListElements(items);
    } else {
        // param is array of model lists
        // build new <ul> element(s) for each list and put in `.modelLists`;
        // fill `.items` array with <li> elements from these new <ul> elements
        items = [];
        modelLists = createListElementsFromModelLists(selectorOrModelLists, options);
        modelLists.forEach(function (list) {
            items = items.concat(toArray(list.element.querySelectorAll('li')));
        });
    }

    // grab wheel events and don't let 'em bubble
    modelLists.forEach(function (modelList) {
        modelList.element.addEventListener('wheel', captureEvent);
    });

    items.forEach(function (itemElement, index) {
        var item = (itemElement !== itemElement.parentElement.lastElementChild)
            ? self.addEvt(itemElement, 'mousedown', itemElement, true)
            : { element: itemElement };

        /* `item.model` not currently needed so commented out here.
         * (Originally used for rebuilding modelLists for final
         * reporting, modelLists are now spliced on every successful
         * drag-and-drop operation so they're always up to date.)

         var origin = this.itemCoordinates(itemElement);
         item.model = this.modelLists[origin.list].models[origin.item];

         */

        items[index] = item;
    });

    transform = 'transform' in items[0].element.style
        ? 'transform' // Chrome 45 and Firefox 40
        : '-webkit-transform'; // Safari 8

    // set up the new object
    this.modelLists = modelLists;
    this.items = items;
    this.bindings = {};
    this.callback = {};

    cssInjector(cssListDragon, 'list-dragon-base', options.cssStylesheetReferenceElement);

}

ListDragon.prototype = {

    addEvt: function (target, type, listener, doNotBind) {
        var binding = {
            handler: handlers[type].bind(target, this),
            element: listener || window
        };

        if (!doNotBind) {
            this.bindings[type] = binding;
        }

        binding.element.addEventListener(type, binding.handler);

        return binding;
    },

    removeEvt: function (type) {
        var binding = this.bindings[type];
        delete this.bindings[type];
        binding.element.removeEventListener(type, binding.handler);
    },

    removeAllEventListeners: function () {
        // remove drag & drop events (mousemove, mouseup, and transitionend)
        for (var type in this.bindings) {
            var binding = this.bindings[type];
            binding.element.removeEventListener(type, binding.handler);
        }
        // remove the mousedown events from all list items
        this.items.forEach(function (item) {
            if (item.handler) {
                item.element.removeEventListener('mousedown', item.handler);
            }
        });
        // wheel events on the list elements
        this.modelLists.forEach(function (modelList) {
            modelList.element.removeEventListener('wheel', captureEvent);
        });
    },

    pointInListRects: function (point) {
        return this.modelLists.find(function (modelList) {
            var rect = modelList.element.getBoundingClientRect();

            rect = {
                left:   window.scrollX + rect.left,
                top:    window.scrollY + rect.top,
                right:  window.scrollX + rect.right,
                bottom: window.scrollY + rect.bottom,
                width:  rect.width,
                height: rect.height
            };

            modelList.rect = rect;

            if (pointInRect(point, rect)) {
                modelList.rect = rect;
                return true; // found
            } else {
                return false;
            }
        });
    },

    pointInItemRects: function (point, except1, except2) {
        return this.items.find(function (item) {
            var element = item.element;
            return (
                element !== except1 &&
                element !== except2 &&
                pointInRect(point, item.rect)
            );
        });
    },

    // get positions of all list items in page coords (normalized for window and list scrolling)
    getAllItemBoundingRects: function () {
        var modelLists = this.modelLists, height;
        this.items.forEach(function (item) {
            var itemElement = item.element,
                listElement = itemElement.parentElement,
                list = modelLists.find(function (list) { return list.element === listElement; });

            if (
                // omitted: default to true
                list.isDropTarget === undefined ||

                // function: use return value
                typeof list.isDropTarget === 'function' && list.isDropTarget() ||

                // otherwise: use truthiness of given value
                list.isDropTarget
            ) {
                var rect = itemElement.getBoundingClientRect(),
                    bottom = rect.bottom;

                if (itemElement === listElement.lastElementChild) {
                    bottom = listElement.getBoundingClientRect().bottom;
                    if (bottom < rect.top) {
                        bottom = rect.top + (height || 50);
                    }
                } else {
                    height = rect.height;
                }

                rect = {
                    left:   window.scrollX + rect.left,
                    right:  window.scrollX + rect.right,
                    top:    window.scrollY + rect.top    + listElement.scrollTop,
                    bottom: window.scrollY + bottom + listElement.scrollTop
                };

                item.rect = rect;
            }
        });
    },

    reinsert: function (target) {
        var style = target.style;
        style.width = style[transform] = style.transition = REVERT_TO_STYLESHEET_VALUE;

        target.classList.remove('dragon-pop');

        this.drop.style.transitionDuration = '0s';
        this.drop.style.borderTopWidth = REVERT_TO_STYLESHEET_VALUE;
        this.drop.parentElement.insertBefore(target, this.drop);

        delete this.drop;
    },

    // return an object { item: <item index within list>, list: <list index within list of lists> }
    itemCoordinates: function (item) {
        var listElement = item.parentElement,
            coords = { item: 0 };

        while ((item = item.previousElementSibling)) {
            ++coords.item;
        }

        this.modelLists.find(function (list, index) {
            coords.list = index;
            return list.element === listElement; // stop when we find the one we belong to
        });

        return coords;
    }

};

var handlers = {
    mousedown: function (dragon, evt) {

        evt.stopPropagation();
        evt.preventDefault();  //prevents user selection of rendered nodes during drag

        if (dragon.drop) {
            return;
        }

        var rect = this.getBoundingClientRect();

        dragon.rect = rect = {
            left:   Math.round(rect.left - 1),
            top:    Math.round(rect.top - 1),
            right:  Math.round(rect.right),
            bottom: Math.round(rect.bottom),
            width:  Math.round(rect.width),
            height: Math.round(rect.height)
        };

        dragon.pin = {
            x: window.scrollX + evt.clientX,
            y: window.scrollY + evt.clientY
        };

        dragon.origin = dragon.itemCoordinates(this);

        if (dragon.callback.grabbed) {
            dragon.callback.grabbed.call(this, dragon);
        }

        dragon.getAllItemBoundingRects();

        dragon.drop = this.nextElementSibling;
        dragon.drop.style.transitionDuration = '0s';
        dragon.drop.style.borderTopWidth = rect.height + 'px';

        this.style.width = rect.width + 'px';
        this.style.transitionDuration = '0s';
        this.style[transform] = translate(
            rect.left - window.scrollX,
            rect.top  - window.scrollY
        );
        this.classList.add('dragon-pop');
        this.style.zIndex = window.getComputedStyle(dragon.modelLists[0].container.parentElement).zIndex;

        if (!dragon.container) {
            // walk back to closest shadow root OR body tag OR root tag
            var container = this;
            while (container.parentNode) {
                container = container.parentNode;
                if (
                    typeof ShadowRoot !== 'undefined' && container instanceof ShadowRoot ||
                    container.tagName === 'BODY'
                ){
                    break;
                }
            }
            dragon.container = container;
        }

        dragon.container.appendChild(this);

        rect.left   += window.scrollX;
        rect.top    += window.scrollY;
        rect.right  += window.scrollX;
        rect.bottom += window.scrollY;

        dragon.addEvt(this, 'mousemove');
        dragon.addEvt(this, 'mouseup');
    },

    mousemove: function (dragon, evt) {
        dragon.drop.style.transition = REVERT_TO_STYLESHEET_VALUE;

        var hoverList = dragon.pointInListRects({ x: evt.clientX, y: evt.clientY }) || dragon.mostRecentHoverList;

        if (hoverList) {
            var dx = evt.clientX - dragon.pin.x,
                dy = evt.clientY - dragon.pin.y;

            dragon.mostRecentHoverList = hoverList;

            var maxScrollY = hoverList.element.scrollHeight - hoverList.rect.height,
                y = evt.clientY + window.scrollY,
                magnitude;

            if (maxScrollY > 0) {
                // list is scrollable (is taller than rect)
                if (hoverList.element.scrollTop > 0 && (magnitude = y - (hoverList.rect.top + 5)) < 0) {
                    // mouse near or above top and list is not scrolled to top yet
                    resetAutoScrollTimer(magnitude, 0, hoverList.element);
                } else if (hoverList.element.scrollTop < maxScrollY && (magnitude = y - (hoverList.rect.bottom - 1 - 5)) > 0) {
                    // mouse near or below bottom and list not scrolled to bottom yet
                    resetAutoScrollTimer(magnitude, maxScrollY, hoverList.element);
                } else {
                    // mouse inside
                    resetAutoScrollTimer();
                }
            }

            var other = dragon.pointInItemRects({
                x: evt.clientX,
                y: dragon.rect.bottom + window.scrollY + dy + hoverList.element.scrollTop
            }, this, dragon.drop);

            this.style[transform] = translate(
                dragon.rect.left - window.scrollX + dx,
                dragon.rect.top - window.scrollY + dy
            );

            if (other) {
                var element = other.element;
                element.style.transition = REVERT_TO_STYLESHEET_VALUE;
                element.style.borderTopWidth = dragon.drop.style.borderTopWidth;
                dragon.drop.style.borderTopWidth = null;
                dragon.drop = element;
            }
        }
    },

    mouseup: function (dragon, evt) {
        resetAutoScrollTimer();
        dragon.removeEvt('mousemove');
        dragon.removeEvt('mouseup');

        evt.stopPropagation();

        var newRect = this.getBoundingClientRect();

        if (
            window.scrollX + newRect.left === dragon.rect.left &&
            window.scrollY + newRect.top === dragon.rect.top
        ) {
            dragon.reinsert(this);
        } else {
            var dropRect = dragon.drop.getBoundingClientRect();

            dragon.addEvt(this, 'transitionend', this);
            this.style.transitionDuration = REVERT_TO_STYLESHEET_VALUE; //reverts to 200ms
            this.style.transitionProperty = transform;
            this.style[transform] = translate(
                dropRect.left - window.scrollX,
                dropRect.top - window.scrollY
            );
        }
    },

    transitionend: function (dragon, evt) {
        if (evt.propertyName === transform) {
            dragon.removeEvt('transitionend');
            dragon.reinsert(this);

            this.style.transitionProperty = REVERT_TO_STYLESHEET_VALUE; //reverts to border-top-width

            var originList = dragon.modelLists[dragon.origin.list];
            var model = originList.splice(dragon.origin.item, 1)[0];
            var destination = dragon.itemCoordinates(this);
            var destinationList = dragon.modelLists[destination.list];
            var interListDrop = originList !== destinationList;
            var listChanged = interListDrop || dragon.origin.item !== destination.item;
            destinationList.splice(destination.item, 0, model);

            if (listChanged) {
                originList.element.dispatchEvent(new CustomEvent('listchanged'));
                if (interListDrop) {
                    destinationList.element.dispatchEvent(new CustomEvent('listchanged'));
                }
            }

            if (dragon.callback.dropped) {
                dragon.callback.dropped.call(this, dragon);
            }
        }
    }
};

function resetAutoScrollTimer(magnitude, limit, element) {
    if (!magnitude) {
        clearInterval(timer);
        scrollVelocity = 0;
    } else {
        var changeDirection =
            scrollVelocity  <  0 && magnitude  >= 0 ||
            scrollVelocity === 0 && magnitude !== 0 ||
            scrollVelocity  >  0 && magnitude  <= 0;
        scrollVelocity = magnitude > 0 ? Math.min(50, magnitude) : Math.max(-50, magnitude);
        if (changeDirection) {
            clearInterval(timer);
            timer = setInterval(function (limit) {
                var scrollTop = element.scrollTop + scrollVelocity;
                if (scrollVelocity < 0 && scrollTop < limit || scrollVelocity > 0 && scrollTop > limit) {
                    element.scrollTop = limit;
                    clearInterval(timer);
                } else {
                    element.scrollTop = scrollTop;
                }
            }, 125);
        }
    }
}

function toArray(arrayLikeObject) {
    return Array.prototype.slice.call(arrayLikeObject);
}

function pointInRect(point, rect) {
    return rect.top <= point.y && point.y <= rect.bottom
        && rect.left <= point.x && point.x <= rect.right;
}

function translate(left, top) {
    return 'translate('
        + Math.floor(left + window.scrollX) + 'px,'
        + Math.floor(top + window.scrollY) + 'px)';
}

function htmlEncode(string) {
    var textNode = document.createTextNode(string);

    return document
        .createElement('a')
        .appendChild(textNode)
        .parentNode
        .innerHTML;
}

/**
 * Creates `<ul>...</ul>` elements and inserts them into an `element` property on each model.
 * @param {object} modelLists
 * @returns `modelLists`
 */
function createListElementsFromModelLists(modelLists, options) {
    var templateLabel = options.label || '{label}';

    modelLists.forEach(function (modelList, listIndex) {
        var listLabel = modelList.label || templateLabel,
            listHtmlEncode = modelList.htmlEncode !== undefined && modelList.htmlEncode || options.htmlEncode,
            container = document.createElement('div'),
            listElement = document.createElement('ul');

        if (modelList.models) {
            Object.keys(modelList).forEach(function (key) {
                if (key !== 'models') {
                    modelList.models[key] = modelList[key];
                }
            });
            modelLists[listIndex] = modelList = modelList.models;
        } else if (modelList instanceof Array) {
            modelList.models = modelList; // point to self
        } else {
            throw error('List [{1}] not an array of models (with or without additional properties) OR ' +
                'an object (with a `models` property containing an array of models).', listIndex);
        }

        modelList.forEach(function (model) {
            var modelLabel = model.label || listLabel,
                modelHtmlEncode = model.htmlEncode !== undefined && model.htmlEncode || listHtmlEncode,
                modelObject = typeof model === 'object' ? model : { label: model},
                label = format.call([modelObject, modelList, options], modelLabel),
                itemElement = document.createElement('li');

            itemElement.innerHTML = modelHtmlEncode ? htmlEncode(label) : label;

            listElement.appendChild(itemElement);
        });

        // append the final "fencepost" item -- drop target at bottom of list after all items
        var itemElement = document.createElement('li');
        itemElement.innerHTML = '&nbsp;';
        listElement.appendChild(itemElement);

        // append header to container
        if (modelList.title) {
            var header = document.createElement('div');
            header.innerHTML = listHtmlEncode ? htmlEncode(modelList.title) : modelList.title;
            container.appendChild(header);
        }

        container.appendChild(listElement);
        container.className = modelList.cssClassNames || options.cssClassNames || 'dragon-list';
        modelList.element = listElement;
        modelList.container = container;
    });

    return modelLists;
}

/**
 * Create a `.modelLists` array with these <li> elements' parent <ul> elements
 * @param {Element[]} listItemElements
 * @returns {Array}
 */
function createModelListsFromListElements(listItemElements) {
    var modelLists = [];

    listItemElements.forEach(function (itemElement) {
        var listElement = itemElement.parentElement,
            container = listElement.parentElement,
            models = [];
        if (!modelLists.find(function (list) { return list.element === listElement; })) {
            toArray(listElement.querySelectorAll('li')).forEach(function (itemElement) {
                if (itemElement !== listElement.lastElementChild) {
                    models.push(itemElement.innerHTML);
                }
            });
            models.element = listElement;
            models.container = container;
            modelLists.push(models);
        }
    });

    return modelLists;
}

function captureEvent(evt) {
    evt.stopPropagation();
}

function error() {
    return 'list-dragon: ' + format.apply(this, Array.prototype.slice.call(arguments));
}

// this interface consists solely of the prototypal object constructor
module.exports = ListDragon;

},{"css-injector":13,"templex":20}],16:[function(require,module,exports){
/* object-iterators.js - Mini Underscore library
 * by Jonathan Eiten
 *
 * The methods below operate on objects (but not arrays) similarly
 * to Underscore (http://underscorejs.org/#collections).
 *
 * For more information:
 * https://github.com/joneit/object-iterators
 */

'use strict';

/**
 * @constructor
 * @summary Wrap an object for one method call.
 * @Desc Note that the `new` keyword is not necessary.
 * @param {object|null|undefined} object - `null` or `undefined` is treated as an empty plain object.
 * @return {Wrapper} The wrapped object.
 */
function Wrapper(object) {
    if (object instanceof Wrapper) {
        return object;
    }
    if (!(this instanceof Wrapper)) {
        return new Wrapper(object);
    }
    this.originalValue = object;
    this.o = object || {};
}

/**
 * @name Wrapper.chain
 * @summary Wrap an object for a chain of method calls.
 * @Desc Calls the constructor `Wrapper()` and modifies the wrapper for chaining.
 * @param {object} object
 * @return {Wrapper} The wrapped object.
 */
Wrapper.chain = function (object) {
    var wrapped = Wrapper(object); // eslint-disable-line new-cap
    wrapped.chaining = true;
    return wrapped;
};

Wrapper.prototype = {
    /**
     * Unwrap an object wrapped with {@link Wrapper.chain|Wrapper.chain()}.
     * @return {object|null|undefined} The value originally wrapped by the constructor.
     * @memberOf Wrapper.prototype
     */
    value: function () {
        return this.originalValue;
    },

    /**
     * @desc Mimics Underscore's [each](http://underscorejs.org/#each) method: Iterate over the members of the wrapped object, calling `iteratee()` with each.
     * @param {function} iteratee - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function is undefined; an `.each` loop cannot be broken out of (use {@link Wrapper#find|.find} instead).
     * @param {object} [context] - If given, `iteratee` is bound to this object. In other words, this object becomes the `this` value in the calls to `iteratee`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {Wrapper} The wrapped object for chaining.
     * @memberOf Wrapper.prototype
     */
    each: function (iteratee, context) {
        var o = this.o;
        Object.keys(o).forEach(function (key) {
            iteratee.call(this, o[key], key, o);
        }, context || o);
        return this;
    },

    /**
     * @desc Mimics Underscore's [find](http://underscorejs.org/#find) method: Look through each member of the wrapped object, returning the first one that passes a truth test (`predicate`), or `undefined` if no value passes the test. The function returns the value of the first acceptable member, and doesn't necessarily traverse the entire object.
     * @param {function} predicate - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function should be truthy if the member passes the test and falsy otherwise.
     * @param {object} [context] - If given, `predicate` is bound to this object. In other words, this object becomes the `this` value in the calls to `predicate`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} The found property's value, or undefined if not found.
     * @memberOf Wrapper.prototype
     */
    find: function (predicate, context) {
        var o = this.o;
        var result;
        if (o) {
            result = Object.keys(o).find(function (key) {
                return predicate.call(this, o[key], key, o);
            }, context || o);
            if (result !== undefined) {
                result = o[result];
            }
        }
        return result;
    },

    /**
     * @desc Mimics Underscore's [filter](http://underscorejs.org/#filter) method: Look through each member of the wrapped object, returning the values of all members that pass a truth test (`predicate`), or empty array if no value passes the test. The function always traverses the entire object.
     * @param {function} predicate - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function should be truthy if the member passes the test and falsy otherwise.
     * @param {object} [context] - If given, `predicate` is bound to this object. In other words, this object becomes the `this` value in the calls to `predicate`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} An array containing the filtered values.
     * @memberOf Wrapper.prototype
     */
    filter: function (predicate, context) {
        var o = this.o;
        var result = [];
        if (o) {
            Object.keys(o).forEach(function (key) {
                if (predicate.call(this, o[key], key, o)) {
                    result.push(o[key]);
                }
            }, context || o);
        }
        return result;
    },

    /**
     * @desc Mimics Underscore's [map](http://underscorejs.org/#map) method: Produces a new array of values by mapping each value in list through a transformation function (`iteratee`). The function always traverses the entire object.
     * @param {function} iteratee - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function is concatenated to the end of the new array.
     * @param {object} [context] - If given, `iteratee` is bound to this object. In other words, this object becomes the `this` value in the calls to `predicate`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} An array containing the filtered values.
     * @memberOf Wrapper.prototype
     */
    map: function (iteratee, context) {
        var o = this.o;
        var result = [];
        if (o) {
            Object.keys(o).forEach(function (key) {
                result.push(iteratee.call(this, o[key], key, o));
            }, context || o);
        }
        return result;
    },

    /**
     * @desc Mimics Underscore's [reduce](http://underscorejs.org/#reduce) method: Boil down the values of all the members of the wrapped object into a single value. `memo` is the initial state of the reduction, and each successive step of it should be returned by `iteratee()`.
     * @param {function} iteratee - For each member of the wrapped object, this function is called with four arguments: `(memo, value, key, object)`. The return value of this function becomes the new value of `memo` for the next iteration.
     * @param {*} [memo] - If no memo is passed to the initial invocation of reduce, the iteratee is not invoked on the first element of the list. The first element is instead passed as the memo in the invocation of the iteratee on the next element in the list.
     * @param {object} [context] - If given, `iteratee` is bound to this object. In other words, this object becomes the `this` value in the calls to `iteratee`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} The value of `memo` "reduced" as per `iteratee`.
     * @memberOf Wrapper.prototype
     */
    reduce: function (iteratee, memo, context) {
        var o = this.o;
        if (o) {
            Object.keys(o).forEach(function (key, idx) {
                memo = (!idx && memo === undefined) ? o[key] : iteratee(memo, o[key], key, o);
            }, context || o);
        }
        return memo;
    },

    /**
     * @desc Mimics Underscore's [extend](http://underscorejs.org/#extend) method: Copy all of the properties in each of the `source` object parameter(s) over to the (wrapped) destination object (thus mutating it). It's in-order, so the properties of the last `source` object will override properties with the same name in previous arguments or in the destination object.
     * > This method copies own members as well as members inherited from prototype chain.
     * @param {...object|null|undefined} source - Values of `null` or `undefined` are treated as empty plain objects.
     * @return {Wrapper|object} The wrapped destination object if chaining is in effect; otherwise the unwrapped destination object.
     * @memberOf Wrapper.prototype
     */
    extend: function (source) {
        var o = this.o;
        Array.prototype.slice.call(arguments).forEach(function (object) {
            if (object) {
                for (var key in object) {
                    o[key] = object[key];
                }
            }
        });
        return this.chaining ? this : o;
    },

    /**
     * @desc Mimics Underscore's [extendOwn](http://underscorejs.org/#extendOwn) method: Like {@link Wrapper#extend|extend}, but only copies its "own" properties over to the destination object.
     * @param {...object|null|undefined} source - Values of `null` or `undefined` are treated as empty plain objects.
     * @return {Wrapper|object} The wrapped destination object if chaining is in effect; otherwise the unwrapped destination object.
     * @memberOf Wrapper.prototype
     */
    extendOwn: function (source) {
        var o = this.o;
        Array.prototype.slice.call(arguments).forEach(function (object) {
            Wrapper(object).each(function (val, key) { // eslint-disable-line new-cap
                o[key] = val;
            });
        });
        return this.chaining ? this : o;
    }
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) { // eslint-disable-line no-extend-native
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

module.exports = Wrapper;

},{}],17:[function(require,module,exports){
'use strict';

/** @module overrider */

/**
 * Mixes members of all `sources` into `target`, handling getters and setters properly.
 *
 * Any number of `sources` objects may be given and each is copied in turn.
 *
 * @example
 * var overrider = require('overrider');
 * var target = { a: 1 }, source1 = { b: 2 }, source2 = { c: 3 };
 * target === overrider(target, source1, source2); // true
 * // target object now has a, b, and c; source objects untouched
 *
 * @param {object} object - The target object to receive sources.
 * @param {...object} [sources] - Object(s) containing members to copy to `target`. (Omitting is a no-op.)
 * @returns {object} The target object (`target`)
 */
function overrider(target, sources) { // eslint-disable-line no-unused-vars
    for (var i = 1; i < arguments.length; ++i) {
        mixIn.call(target, arguments[i]);
    }

    return target;
}

/**
 * Mix `this` members into `target`.
 *
 * @example
 * // A. Simple usage (using .call):
 * var mixInTo = require('overrider').mixInTo;
 * var target = { a: 1 }, source = { b: 2 };
 * target === overrider.mixInTo.call(source, target); // true
 * // target object now has both a and b; source object untouched
 *
 * @example
 * // B. Semantic usage (when the source hosts the method):
 * var mixInTo = require('overrider').mixInTo;
 * var target = { a: 1 }, source = { b: 2, mixInTo: mixInTo };
 * target === source.mixInTo(target); // true
 * // target object now has both a and b; source object untouched
 *
 * @this {object} Target.
 * @param target
 * @returns {object} The target object (`target`)
 * @memberOf module:overrider
 */
function mixInTo(target) {
    var descriptor;
    for (var key in this) {
        if ((descriptor = Object.getOwnPropertyDescriptor(this, key))) {
            Object.defineProperty(target, key, descriptor);
        }
    }
    return target;
}

/**
 * Mix `source` members into `this`.
 *
 * @example
 * // A. Simple usage (using .call):
 * var mixIn = require('overrider').mixIn;
 * var target = { a: 1 }, source = { b: 2 };
 * target === overrider.mixIn.call(target, source) // true
 * // target object now has both a and b; source object untouched
 *
 * @example
 * // B. Semantic usage (when the target hosts the method):
 * var mixIn = require('overrider').mixIn;
 * var target = { a: 1, mixIn: mixIn }, source = { b: 2 };
 * target === target.mixIn(source) // true
 * // target now has both a and b (and mixIn); source untouched
 *
 * @param source
 * @returns {object} The target object (`this`)
 * @memberOf overrider
 * @memberOf module:overrider
 */
function mixIn(source) {
    var descriptor;
    for (var key in source) {
        if ((descriptor = Object.getOwnPropertyDescriptor(source, key))) {
            Object.defineProperty(this, key, descriptor);
        }
    }
    return this;
}

overrider.mixInTo = mixInTo;
overrider.mixIn = mixIn;

module.exports = overrider;

},{}],18:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var REGEXP_INDIRECTION = /^(\w+)\((\w+)\)$/;  // finds complete pattern a(b) where both a and b are regex "words"

/** @typedef {object} valueItem
 * You should supply both `name` and `alias` but you could omit one or the other and whichever you provide will be used for both.
 * > If you only give the `name` property, you might as well just give a string for {@link menuItem} rather than this object.
 * @property {string} [name=alias] - Value of `value` attribute of `<option>...</option>` element.
 * @property {string} [alias=name] - Text of `<option>...</option>` element.
 * @property {string} [type] One of the keys of `this.converters`. If not one of these (including `undefined`), field values will be tested with a string comparison.
 * @property {boolean} [hidden=false]
 */

/** @typedef {object|menuItem[]} submenuItem
 * @summary Hierarchical array of select list items.
 * @desc Data structure representing the list of `<option>...</option>` and `<optgroup>...</optgroup>` elements that make up a `<select>...</select>` element.
 *
 * > Alternate form: Instead of an object with a `menu` property containing an array, may itself be that array. Both forms have the optional `label` property.
 * @property {string} [label] - Defaults to a generated string of the form "Group n[.m]..." where each decimal position represents a level of the optgroup hierarchy.
 * @property {menuItem[]} submenu
 */

/** @typedef {string|valueItem|submenuItem} menuItem
 * May be one of three possible types that specify either an `<option>....</option>` element or an `<optgroup>....</optgroup>` element as follows:
 * * If a `string`, specifies the text of an `<option>....</option>` element with no `value` attribute. (In the absence of a `value` attribute, the `value` property of the element defaults to the text.)
 * * If shaped like a {@link valueItem} object, specifies both the text and value of an `<option....</option>` element.
 * * If shaped like a {@link submenuItem} object (or its alternate array form), specifies an `<optgroup>....</optgroup>` element.
 */

/**
 * @summary Builds a new menu pre-populated with items and groups.
 * @desc This function creates a new pop-up menu (a.k.a. "drop-down"). This is a `<select>...</select>` element, pre-populated with items (`<option>...</option>` elements) and groups (`<optgroup>...</optgroup>` elements).
 * > Bonus: This function also builds `input type=text` elements.
 * > NOTE: This function generates OPTGROUP elements for subtrees. However, note that HTML5 specifies that OPTGROUP elemnents made not nest! This function generates the markup for them but they are not rendered by most browsers, or not completely. Therefore, for now, do not specify more than one level subtrees. Future versions of HTML may support it. I also plan to add here options to avoid OPTGROUPS entirely either by indenting option text, or by creating alternate DOM nodes using `<li>` instead of `<select>`, or both.
 * @memberOf popMenu
 *
 * @param {Element|string} el - Must be one of (case-sensitive):
 * * text box - an `HTMLInputElement` to use an existing element or `'INPUT'` to create a new one
 * * drop-down - an `HTMLSelectElement` to use an existing element or `'SELECT'` to create a new one
 * * submenu - an `HTMLOptGroupElement` to use an existing element or `'OPTGROUP'` to create a new one (meant for internal use only)
 *
 * @param {menuItem[]} [menu] - Hierarchical list of strings to add as `<option>...</option>` or `<optgroup>....</optgroup>` elements. Omitting creates a text box.
 *
 * @param {null|string} [options.prompt=''] - Adds an initial `<option>...</option>` element to the drop-down with this value in parentheses as its `text`; and empty string as its `value`. Default is empty string, which creates a blank prompt; `null` suppresses prompt altogether.
 *
 * @param {boolean} [options.sort] - Whether to alpha sort or not. If truthy, sorts each optgroup on its `label`; and each select option on its text (its `alias` if given; or its `name` if not).
 *
 * @param {string[]} [options.blacklist] - Optional list of menu item names to be ignored.
 *
 * @param {number[]} [options.breadcrumbs] - List of option group section numbers (root is section 0). (For internal use.)
 *
 * @param {boolean} [options.append=false] - When `el` is an existing `<select>` Element, giving truthy value adds the new children without first removing existing children.
 *
 * @returns {Element} Either a `<select>` or `<optgroup>` element.
 */
function build(el, menu, options) {
    options = options || {};

    var prompt = options.prompt,
        blacklist = options.blacklist,
        sort = options.sort,
        breadcrumbs = options.breadcrumbs || [],
        path = breadcrumbs.length ? breadcrumbs.join('.') + '.' : '',
        subtreeName = popMenu.subtree,
        groupIndex = 0,
        tagName;

    if (el instanceof Element) {
        tagName = el.tagName;
        if (!options.append) {
            el.innerHTML = ''; // remove all <option> and <optgroup> elements
        }
    } else {
        tagName = el;
        el = document.createElement(tagName);
    }

    if (menu) {
        var add, newOption;
        if (tagName === 'SELECT') {
            add = el.add;
            if (prompt) {
                newOption = new Option(prompt, '');
                newOption.innerHTML += '&hellip;';
                el.add(newOption);
            } else if (prompt !== null) {
                el.add(new Option());
            }
        } else {
            add = el.appendChild;
            el.label = prompt;
        }

        if (sort) {
            menu = menu.slice().sort(itemComparator); // sorted clone
        }

        menu.forEach(function(item) {
            // if item is of form a(b) and there is an function a in options, then item = options.a(b)
            if (options && typeof item === 'string') {
                var indirection = item.match(REGEXP_INDIRECTION);
                if (indirection) {
                    var a = indirection[1],
                        b = indirection[2],
                        f = options[a];
                    if (typeof f === 'function') {
                        item = f(b);
                    } else {
                        throw 'build: Expected options.' + a + ' to be a function.';
                    }
                }
            }

            var subtree = item[subtreeName] || item;
            if (subtree instanceof Array) {

                var groupOptions = {
                    breadcrumbs: breadcrumbs.concat(++groupIndex),
                    prompt: item.label || 'Group ' + path + groupIndex,
                    options: sort,
                    blacklist: blacklist
                };

                var optgroup = build('OPTGROUP', subtree, groupOptions);

                if (optgroup.childElementCount) {
                    el.appendChild(optgroup);
                }

            } else if (typeof item !== 'object') {

                if (!(blacklist && blacklist.indexOf(item) >= 0)) {
                    add.call(el, new Option(item));
                }

            } else if (!item.hidden) {

                var name = item.name || item.alias;
                if (!(blacklist && blacklist.indexOf(name) >= 0)) {
                    add.call(el, new Option(
                        item.alias || item.name,
                        name
                    ));
                }

            }
        });
    } else {
        el.type = 'text';
    }

    return el;
}

function itemComparator(a, b) {
    a = a.alias || a.name || a.label || a;
    b = b.alias || b.name || b.label || b;
    return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * @summary Recursively searches the context array of `menuItem`s for a named `item`.
 * @memberOf popMenu
 * @this Array
 * @param {object} [options]
 * @param {string} [options.keys=[popMenu.defaultKey]] - Properties to search each menuItem when it is an object.
 * @param {boolean} [options.caseSensitive=false] - Ignore case while searching.
 * @param {string} value - Value to search for.
 * @returns {undefined|menuItem} The found item or `undefined` if not found.
 */
function lookup(options, value) {
    if (arguments.length === 1) {
        value = options;
        options = undefined;
    }

    var shallow, deep, item, prop,
        keys = options && options.keys || [popMenu.defaultKey],
        caseSensitive = options && options.caseSensitive;

    value = toString(value, caseSensitive);

    shallow = this.find(function(item) {
        var subtree = item[popMenu.subtree] || item;

        if (subtree instanceof Array) {
            return (deep = lookup.call(subtree, options, value));
        }

        if (typeof item !== 'object') {
            return toString(item, caseSensitive) === value;
        } else {
            for (var i = 0; i < keys.length; ++i) {
                prop = item[keys[i]];
                if (prop && toString(prop, caseSensitive) === value) {
                    return true;
                }
            }
        }
    });

    item = deep || shallow;

    return item && (item.name ? item : { name: item });
}

function toString(s, caseSensitive) {
    var result = '';
    if (s) {
        result += s; // convert s to string
        if (!caseSensitive) {
            result = result.toUpperCase();
        }
    }
    return result;
}

/**
 * @summary Recursively walks the context array of `menuItem`s and calls `iteratee` on each item therein.
 * @desc `iteratee` is called with each item (terminal node) in the menu tree and a flat 0-based index. Recurses on member with name of `popMenu.subtree`.
 *
 * The node will always be a {@link valueItem} object; when a `string`, it is boxed for you.
 *
 * @memberOf popMenu
 *
 * @this Array
 *
 * @param {function} iteratee - For each item in the menu, `iteratee` is called with:
 * * the `valueItem` (if the item is a primative string, it is wrapped up for you)
 * * a 0-based `ordinal`
 *
 * The `iteratee` return value can be used to replace the item, as follows:
 * * `undefined` - do nothing
 * * `null` - splice out the item; resulting empty submenus are also spliced out (see note)
 * * anything else - replace the item with this value; if value is a subtree (i.e., an array) `iteratee` will then be called to walk it as well (see note)
 *
 * > Note: Returning anything (other than `undefined`) from `iteratee` will (deeply) mutate the original `menu` so you may want to copy it first (deeply, including all levels of array nesting but not the terminal node objects).
 *
 * @returns {number} Number of items (terminal nodes) in the menu tree.
 */
function walk(iteratee) {
    var menu = this,
        ordinal = 0,
        subtreeName = popMenu.subtree,
        i, item, subtree, newVal;

    for (i = menu.length - 1; i >= 0; --i) {
        item = menu[i];
        subtree = item[subtreeName] || item;

        if (!(subtree instanceof Array)) {
            subtree = undefined;
        }

        if (!subtree) {
            newVal = iteratee(item.name ? item : { name: item }, ordinal);
            ordinal += 1;

            if (newVal !== undefined) {
                if (newVal === null) {
                    menu.splice(i, 1);
                    ordinal -= 1;
                } else {
                    menu[i] = item = newVal;
                    subtree = item[subtreeName] || item;
                    if (!(subtree instanceof Array)) {
                        subtree = undefined;
                    }
                }
            }
        }

        if (subtree) {
            ordinal += walk.call(subtree, iteratee);
            if (subtree.length === 0) {
                menu.splice(i, 1);
                ordinal -= 1;
            }
        }
    }

    return ordinal;
}

/**
 * @summary Format item name with it's alias when available.
 * @memberOf popMenu
 * @param {string|valueItem} item
 * @returns {string} The formatted name and alias.
 */
function formatItem(item) {
    var result = item.name || item;
    if (item.alias) {
        result = '"' + item.alias + '" (' + result + ')';
    }
    return result;
}


function isGroupProxy(s) {
    return REGEXP_INDIRECTION.test(s);
}

/**
 * @namespace
 */
var popMenu = {
    build: build,
    walk: walk,
    lookup: lookup,
    formatItem: formatItem,
    isGroupProxy: isGroupProxy,
    subtree: 'submenu',
    defaultKey: 'name'
};

module.exports = popMenu;

},{}],19:[function(require,module,exports){
// tabz node module
// https://github.com/joneit/tabz

/* eslint-env node, browser */

'use strict';

var cssInjector = require('css-injector');

/**
 * Register/deregister click handler on all tab collections.
 * @param {Element} [options.root=document] - Where to look for tab panels (`.tabz` elements) containing tabs and folders.
 * @param {boolean} [options.unhook=false] - Remove event listener from tab panels (`.tabz` elements).
 * @param {Element} [options.referenceElement] - Passed to cssInjector's insertBefore() call.
 * @param {string} [options.defaultTabSelector='.default-tab'] - .classname or #id of the tab to select by default
 * @param {object} [options.onEnable] - Handler implementation. See {@link Tabz#onEnable|onEnable}.
 * @param {object} [options.onDisable] - Handler implementation. See {@link Tabz#onDisable|onEnable}.
 * @param {object} [options.onEnabled] - Handler implementation. See {@link Tabz#onEnabled|onEnable}.
 * @param {object} [options.onDisabled] - Handler implementation. See {@link Tabz#onDisabled|onEnable}.
 * @constructor
 */
function Tabz(options) {
    var i, el;

    options = options || {};
    var root = options.root || document,
        unhook = options.unhook,
        referenceElement = options.referenceElement,
        defaultTabSelector = options.defaultTabSelector || '.default-tab';

    if (!unhook) {
        var css;
        /* inject:css */
        css = '.tabz{position:relative;visibility:hidden;height:100%}.tabz>header{position:relative;display:inline-block;background-color:#fff;margin-left:1em;padding:5px .6em;border:1px solid #666;border-bottom-color:transparent;border-radius:6px 6px 0 0;cursor:default;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none}.tabz>header+section{position:absolute;display:none;background-color:#fff;margin-top:-1px;padding:8px;border:1px solid #666;border-radius:6px;left:0;right:0;bottom:0;top:0;z-index:0}.tabz>header+section.tabz-enable{z-index:1}.tabz>header.tabz-enable{z-index:2}.tabz-bg0{background-color:#eee!important}.tabz-bg1{background-color:#eef!important}.tabz-bg2{background-color:#efe!important}.tabz-bg3{background-color:#eff!important}.tabz-bg4{background-color:#fee!important}.tabz-bg5{background-color:#fef!important}.tabz-bg6{background-color:#ffe!important}';
        /* endinject */

        if (!referenceElement) {
            // find first <link> or <style> in <head>
            var headStuff = document.querySelector('head').children;
            for (i = 0; !referenceElement && i < headStuff.length; ++i) {
                el = headStuff[i];
                if (el.tagName === 'STYLE' || el.tagName === 'LINK' && el.rel === 'stylesheet') {
                    referenceElement = el;
                }
            }
        }
        cssInjector(css, 'tabz-css-base', referenceElement);

        for (var key in options) {
            if (this[key] === noop) {
                this[key] = options[key];
            }
        }

        /**
         * @summary The context of this tab object.
         * @desc The context may encompass any number of tab panels (`.tabz` elements).
         * @type {HTMLDocumen|HTMLElement}
         */
        this.root = root;

        // enable first tab on each tab panel (`.tabz` element)
        forEachEl('.tabz>header:first-of-type,.tabz>section:first-of-type', function(el) {
            el.classList.add('tabz-enable');
        }, root);

        // enable default tab and all its parents (must be a tab)
        this.tabTo(root.querySelector('.tabz > header' + defaultTabSelector));

        setTimeout(function() {
            forEachEl('.tabz > section', function(el) {

                // Step 1: A bug in older versions of Chrome (like v40) that inserted a break at mark-up location of an absolute positioned block. The work-around is to hide those blocks until after first render; then show them. I don't know why this works but it does. Seems to be durable.
                el.style.display = 'block';

                // Step 2: Adjust absolute top of each rendered folder to the bottom of its tab
                el.style.top = el.previousElementSibling.getBoundingClientRect().bottom - el.parentElement.getBoundingClientRect().top + 'px';

            }, root);
        }, 0);
    }

    var method = unhook ? 'removeEventListener' : 'addEventListener';
    var boundClickHandler = onclick.bind(this);
    forEachEl('.tabz', function(tabBar) {
        tabBar.style.visibility = 'visible';
        tabBar[method]('click', boundClickHandler);
    }, root);
}

function onclick(evt) {
    click.call(this, evt.currentTarget, evt.target);
}

/**
 * @summary Selects the given tab.
 * @desc If it is a nested tab, also reveals all its ancestor tabs.
 * @param {string|HTMLElement} [el] - May be one of:
 * * `HTMLElement`
 *   * `<header>` - tab element
 *   * `<section>` - folder element
 * * `string` - CSS selector to one of the above
 * * falsy - fails silently
 * @memberOf Tabz.prototype
 */
Tabz.prototype.tabTo = function(el) {
    while ((el = this.tab(el))) {
        click.call(this, el.parentElement, el);
        el = el.parentElement.parentElement; // loop to click on each containing tab...
    }
};

/**
 * Current selected tab.
 * @param {HTMLElement|number} el - An element that is (or is within) the tab panel (`.tabz` element) to look in.
 * @returns {undefined|HTMLElement} Returns tab (`<header>`) element.  Returns `undefined` if `el` is neither of the above or an out of range index.
 */
Tabz.prototype.enabledTab = function(el) {
    el = this.panel(el);
    return el && el.querySelector(':scope>header.tabz-enable');
};

/**
 * @summary Get tab element.
 * @desc Get tab element if given tab or folder element; or an element within such; or find tab.
 * @param {string|Element} [el] - May be one of:
 * * a tab (a `<header>` element)
 * * a folder (a `<section>` element)
 * * an element within one of the above
 * * `string` - CSS selector to one of the above, searching within the root or document
 * @returns {null|Element} tab (`<header>...</header>`) element or `null` if not found
 * @memberOf Tabz.prototype
 */
Tabz.prototype.tab = function(el) {
    el = lookForEl.call(this, el);
    return !(el instanceof HTMLElement) ? null : el.tagName === 'HEADER' ? el : el.tagName === 'SECTION' ? el.previousElementSibling : null;
};

/**
 * @summary Get folder element.
 * @desc Get folder element if given tab or folder element; or an element within such; or find folder.
 * @param {string|Element} [el] - May be one of:
 * * a tab (a `<header>` element)
 * * a folder (a `<section>` element)
 * * an element within one of the above
 * * `string` - CSS selector to one of the above, searching within the root or document
 * @returns {null|Element} tab (`<header>...</header>`) element or `null` if not found
 * @memberOf Tabz.prototype
 */
Tabz.prototype.folder = function(el) {
    el = lookForEl.call(this, el);
    return !(el instanceof HTMLElement) ? null : el.tagName === 'SECTION' ? el : el.tagName === 'HEADER' ? el.nextElementSibling : null;
};

/**
 * @summary Get tab panel element.
 * @desc Get panel element if given tab panel element; or an element within a tab panel; or find tab panel.
 * @param {string|Element} [el] - May be one of:
 * * a tab panel (an `HTMLElement` with class `tabz`)
 * * an element within a tab panel
 * * `string` - CSS selector to one a tab panel, searching within the root or document
 * @returns {null|Element} tab panel element or `null` if not found
 * @memberOf Tabz.prototype
 */
Tabz.prototype.panel = function(el) {
    while (el && !el.classList.contains('tabz')) {
        el = el.parentElement;
    }
    return !(el instanceof HTMLElement) ? null : el.classList.contains('tabz') ? el : null;
};

function lookForEl(el) {
    if (el instanceof Element) {
        while (el && el.tagName !== 'HEADER' && el.tagName !== 'SECTION') {
            el = el.parentElement;
        }
    } else {
        el = this.root.querySelector(el);
    }
    return el;
}

/** Enables the tab/folder pair of the clicked tab.
 * Disables all the other pairs in this scope which will include the previously enabled pair.
 * @private
 * @this Tabz
 * @param {Element} div - The tab panel (`.tabz` element) that's handling the click event.
 * @param {Element} target - The element that received the click.
 * @returns {undefined|Element} The `<header>` element (tab) the was clicked; or `undefined` when click was not within a tab.
 */
function click(div, target) {
    var newTab, oldTab;

    forEachEl(':scope>header:not(.tabz-enable)', function(tab) { // todo: use a .find() polyfill here
        if (tab.contains(target)) {
            newTab = tab;
        }
    }, div);

    if (newTab) {
        oldTab = this.enabledTab(div);
        toggleTab.call(this, oldTab, false);
        toggleTab.call(this, newTab, true);
    }

    return newTab;
}

/**
 * @private
 * @this Tabz
 * @param {Element} tab - The `<header>` element of the tab to enable or disable.
 * @param {boolean} enable - Enable (vs. disable) the tab.
 */
function toggleTab(tab, enable) {
    if (tab) {
        var folder = this.folder(tab),
            method = enable ? 'onEnable' : 'onDisable';

        this[method].call(this, tab, folder);

        tab.classList.toggle('tabz-enable', enable);
        folder.classList.toggle('tabz-enable', enable);

        method += 'd';
        this[method].call(this, tab, folder);
    }
}

/**
 * @typedef tabEvent
 * @type {function}
 * @param {tabEventObject}
 */

/**
 * @typedef tabEventObject
 * @property {Tabz} tabz - The tab object issuing the callback.
 * @property {Element} target - The tab (`<header>` element).
 */

/**
 * Called before a previously disabled tab is enabled.
 * @type {tabEvent}
 * @abstract
 * @memberOf Tabz.prototype
 */
Tabz.prototype.onEnable = noop;

/**
 * Called before a previously enabled tab is disabled by another tab being enabled.
 * @type {tabEvent}
 * @abstract
 * @memberOf Tabz.prototype
 */
Tabz.prototype.onDisable = noop;

/**
 * Called after a previously disabled tab is enabled.
 * @type {tabEvent}
 * @abstract
 * @memberOf Tabz.prototype
 */
Tabz.prototype.onEnabled = noop;

/**
 * Called after a previously enabled tab is disabled by another tab being enabled.
 * @type {tabEvent}
 * @abstract
 * @memberOf Tabz.prototype
 */
Tabz.prototype.onDisabled = noop;

function noop() {} // null pattern

function forEachEl(selector, iteratee, context) {
    return Array.prototype.forEach.call((context || document).querySelectorAll(selector), iteratee);
}


module.exports = Tabz;

},{"css-injector":13}],20:[function(require,module,exports){
// templex node module
// https://github.com/joneit/templex

/* eslint-env node */

/**
 * Merges values of execution context properties named in template by {prop1},
 * {prop2}, etc., or any javascript expression incorporating such prop names.
 * The context always includes the global object. In addition you can specify a single
 * context or an array of contexts to search (in the order given) before finally
 * searching the global context.
 *
 * Merge expressions consisting of simple numeric terms, such as {0}, {1}, etc., deref
 * the first context given, which is assumed to be an array. As a convenience feature,
 * if additional args are given after `template`, `arguments` is unshifted onto the context
 * array, thus making first additional arg available as {1}, second as {2}, etc., as in
 * `templex('Hello, {1}!', 'World')`. ({0} is the template so consider this to be 1-based.)
 *
 * If you prefer something other than braces, redefine `templex.regexp`.
 *
 * See tests for examples.
 *
 * @param {string} template
 * @param {...string} [args]
 */
function templex(template) {
    var contexts = this instanceof Array ? this : [this];
    if (arguments.length > 1) { contexts.unshift(arguments); }
    return template.replace(templex.regexp, templex.merger.bind(contexts));
}

templex.regexp = /\{(.*?)\}/g;

templex.with = function (i, s) {
    return 'with(this[' + i + ']){' + s + '}';
};

templex.cache = [];

templex.deref = function (key) {
    if (!(this.length in templex.cache)) {
        var code = 'return eval(expr)';

        for (var i = 0; i < this.length; ++i) {
            code = templex.with(i, code);
        }

        templex.cache[this.length] = eval('(function(expr){' + code + '})'); // eslint-disable-line no-eval
    }
    return templex.cache[this.length].call(this, key);
};

templex.merger = function (match, key) {
    // Advanced features: Context can be a list of contexts which are searched in order.
    var replacement;

    try {
        replacement = isNaN(key) ? templex.deref.call(this, key) : this[0][key];
    } catch (e) {
        replacement = '{' + key + '}';
    }

    return replacement;
};

// this interface consists solely of the templex function (and it's properties)
module.exports = templex;

},{}]},{},[7])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9hZGQtb25zL2RpYWxvZy11aS9jc3MvaW5kZXguanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9hZGQtb25zL2RpYWxvZy11aS9kaWFsb2dzL0NvbHVtblBpY2tlci5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL2FkZC1vbnMvZGlhbG9nLXVpL2RpYWxvZ3MvRGlhbG9nLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvYWRkLW9ucy9kaWFsb2ctdWkvZGlhbG9ncy9NYW5hZ2VGaWx0ZXJzLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvYWRkLW9ucy9kaWFsb2ctdWkvZGlhbG9ncy9jb3B5LWlucHV0LmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvYWRkLW9ucy9kaWFsb2ctdWkvZGlhbG9ncy9pbmRleC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL2FkZC1vbnMvZGlhbG9nLXVpL2Zha2VfMzhiYmNiMS5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL2FkZC1vbnMvZGlhbG9nLXVpL2h0bWwvaW5kZXguanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9hZGQtb25zL2RpYWxvZy11aS9taXgtaW5zL2JlaGF2aW9yLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvYWRkLW9ucy9kaWFsb2ctdWkvbWl4LWlucy9kZWZhdWx0cy5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL2FkZC1vbnMvZGlhbG9nLXVpL21peC1pbnMvZ3JpZC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9hdXRvbWF0L2luZGV4LmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL2Nzcy1pbmplY3Rvci9pbmRleC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9pbmplY3Qtc3R5bGVzaGVldC10ZW1wbGF0ZS9pbmRleC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9saXN0LWRyYWdvbi9pbmRleC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9vYmplY3QtaXRlcmF0b3JzL2luZGV4LmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL292ZXJyaWRlci9pbmRleC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9wb3AtbWVudS9pbmRleC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy90YWJ6L2luZGV4LmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL3RlbXBsZXgvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0c1snbGlzdC1kcmFnb24tYWRkZW5kdW0nXSA9IFtcbidkaXYuZHJhZ29uLWxpc3QsIGxpLmRyYWdvbi1wb3AgeycsXG4nXHRmb250LWZhbWlseTogUm9ib3RvLCBzYW5zLXNlcmlmOycsXG4nXHR0ZXh0LXRyYW5zZm9ybTogY2FwaXRhbGl6ZTsgfScsXG4nZGl2LmRyYWdvbi1saXN0IHsnLFxuJ1x0cG9zaXRpb246IGFic29sdXRlOycsXG4nXHR0b3A6IDQlOycsXG4nXHRsZWZ0OiA0JTsnLFxuJ1x0aGVpZ2h0OiA5MiU7JyxcbidcdHdpZHRoOiAyMCU7IH0nLFxuJ2Rpdi5kcmFnb24tbGlzdDpudGgtY2hpbGQoMikgeyBsZWZ0OiAyOCU7IH0nLFxuJ2Rpdi5kcmFnb24tbGlzdDpudGgtY2hpbGQoMykgeyBsZWZ0OiA1MiU7IH0nLFxuJ2Rpdi5kcmFnb24tbGlzdDpudGgtY2hpbGQoNCkgeyBsZWZ0OiA3NiU7IH0nLFxuJ2Rpdi5kcmFnb24tbGlzdCA+IGRpdiwgZGl2LmRyYWdvbi1saXN0ID4gdWwgPiBsaSwgbGkuZHJhZ29uLXBvcCB7IGxpbmUtaGVpZ2h0OiA0NnB4OyB9JyxcbidkaXYuZHJhZ29uLWxpc3QgPiB1bCB7IHRvcDogNDZweDsgfScsXG4nZGl2LmRyYWdvbi1saXN0ID4gdWwgPiBsaTpub3QoOmxhc3QtY2hpbGQpOjpiZWZvcmUsIGxpLmRyYWdvbi1wb3A6OmJlZm9yZSB7JyxcbidcdGNvbnRlbnQ6IFxcJ1xcXFwyYjI0XFwnOycsXG4nXHRjb2xvcjogI2I2YjZiNjsnLFxuJ1x0Zm9udC1zaXplOiAzMHB4OycsXG4nXHRtYXJnaW46IDhweCAxNHB4IDhweCA4cHg7IH0nLFxuJ2xpLmRyYWdvbi1wb3AgeyBvcGFjaXR5Oi44OyB9J1xuXS5qb2luKCdcXG4nKTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBMaXN0RHJhZ29uID0gcmVxdWlyZSgnbGlzdC1kcmFnb24nKTtcbnZhciBpbmplY3RDU1MgPSByZXF1aXJlKCdpbmplY3Qtc3R5bGVzaGVldC10ZW1wbGF0ZScpLmJpbmQocmVxdWlyZSgnLi4vY3NzJykpO1xuXG52YXIgRGlhbG9nID0gcmVxdWlyZSgnLi9EaWFsb2cnKTtcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIERpYWxvZ1xuICovXG52YXIgQ29sdW1uUGlja2VyID0gRGlhbG9nLmV4dGVuZCgnQ29sdW1uUGlja2VyJywge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7SHlwZXJncmlkfSBncmlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIE1heSBpbmNsdWRlIGBEaWFsb2dgIG9wdGlvbnMuXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oZ3JpZCwgb3B0aW9ucykge1xuICAgICAgICB2YXIgYmVoYXZpb3IgPSBncmlkLmJlaGF2aW9yO1xuXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XG5cbiAgICAgICAgaWYgKGJlaGF2aW9yLmlzQ29sdW1uUmVvcmRlcmFibGUoKSkge1xuICAgICAgICAgICAgLy8gcGFyc2UgJiBhZGQgdGhlIGRyYWctYW5kLWRyb3Agc3R5bGVzaGVldCBhZGRlbmR1bVxuICAgICAgICAgICAgdmFyIHN0eWxlc2hlZXRBZGRlbmR1bSA9IGluamVjdENTUygnbGlzdC1kcmFnb24tYWRkZW5kdW0nKTtcblxuICAgICAgICAgICAgLy8gZ3JhYiB0aGUgZ3JvdXAgbGlzdHMgZnJvbSB0aGUgYmVoYXZpb3JcbiAgICAgICAgICAgIGlmIChiZWhhdmlvci5zZXRHcm91cHMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkR3JvdXBzID0ge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ0dyb3VwcycsXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsczogYmVoYXZpb3IuZ2V0R3JvdXBzKClcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5hdmFpbGFibGVHcm91cHMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnQXZhaWxhYmxlIEdyb3VwcycsXG4gICAgICAgICAgICAgICAgICAgIG1vZGVsczogYmVoYXZpb3IuZ2V0QXZhaWxhYmxlR3JvdXBzKClcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwUGlja2VyID0gbmV3IExpc3REcmFnb24oW1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkR3JvdXBzLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmF2YWlsYWJsZUdyb3Vwc1xuICAgICAgICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgICAgICAgLy8gYWRkIHRoZSBkcmFnLWFuZC1kcm9wIHNldHMgdG8gdGhlIGRpYWxvZ1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kKGdyb3VwUGlja2VyLm1vZGVsTGlzdHNbMF0uY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZChncm91cFBpY2tlci5tb2RlbExpc3RzWzFdLmNvbnRhaW5lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGdyYWIgdGhlIGNvbHVtbiBsaXN0cyBmcm9tIHRoZSBiZWhhdmlvclxuICAgICAgICAgICAgdGhpcy5pbmFjdGl2ZUNvbHVtbnMgPSB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdJbmFjdGl2ZSBDb2x1bW5zJyxcbiAgICAgICAgICAgICAgICBtb2RlbHM6IGJlaGF2aW9yLmdldEhpZGRlbkNvbHVtbnMoKS5zb3J0KGNvbXBhcmVCeU5hbWUpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbHVtbnMgPSB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdBY3RpdmUgQ29sdW1ucycsXG4gICAgICAgICAgICAgICAgbW9kZWxzOiBncmlkLmdldEFjdGl2ZUNvbHVtbnMoKVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5zb3J0T25IaWRkZW5Db2x1bW5zID0gdGhpcy53YXNTb3J0T25IaWRkZW5Db2x1bW5zID0gdHJ1ZTtcblxuICAgICAgICAgICAgdmFyIGNvbHVtblBpY2tlciA9IG5ldyBMaXN0RHJhZ29uKFtcbiAgICAgICAgICAgICAgICB0aGlzLmluYWN0aXZlQ29sdW1ucyxcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbHVtbnNcbiAgICAgICAgICAgIF0sIHtcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIGxpc3QtZHJhZ29uLWJhc2Ugc3R5bGVzaGVldCByaWdodCBiZWZvcmUgdGhlIGFkZGVuZHVtXG4gICAgICAgICAgICAgICAgY3NzU3R5bGVzaGVldFJlZmVyZW5jZUVsZW1lbnQ6IHN0eWxlc2hlZXRBZGRlbmR1bSxcbiAgICAgICAgICAgICAgICAvLyB0aGVzZSBtb2RlbHMgaGF2ZSBhIGhlYWRlciBwcm9wZXJ0eSBhcyB0aGVpciBsYWJlbHNcbiAgICAgICAgICAgICAgICBsYWJlbDogJ3toZWFkZXJ9J1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIGFkZCB0aGUgZHJhZy1hbmQtZHJvcCBzZXRzIHRvIHRoZSBkaWFsb2dcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kKGNvbHVtblBpY2tlci5tb2RlbExpc3RzWzBdLmNvbnRhaW5lcik7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZChjb2x1bW5QaWNrZXIubW9kZWxMaXN0c1sxXS5jb250YWluZXIpO1xuXG4gICAgICAgICAgICAvL0xpc3RlbiB0byB0aGUgdmlzaWJsZSBjb2x1bW4gY2hhbmdlc1xuICAgICAgICAgICAgY29sdW1uUGlja2VyLm1vZGVsTGlzdHNbMV0uZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdsaXN0Y2hhbmdlZCcsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIGdyaWQuZmlyZVN5bnRoZXRpY09uQ29sdW1uc0NoYW5nZWRFdmVudCgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuc29ydE9uSGlkZGVuQ29sdW1ucyA9IHRoaXMuZ3JpZC5wcm9wZXJ0aWVzLnNvcnRPbkhpZGRlbkNvbHVtbnM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBkaXYuc3R5bGUudGV4dEFsaWduID0gJ2NlbnRlcic7XG4gICAgICAgICAgICBkaXYuc3R5bGUubWFyZ2luVG9wID0gJzJlbSc7XG4gICAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gJ1RoZSBzZWxlY3Rpb24gb2YgdmlzaWJsZSBjb2x1bW5zIGluIHRoZSBncmlkIG1heSBub3QgYmUgY2hhbmdlZC4nO1xuICAgICAgICAgICAgdGhpcy5hcHBlbmQoZGl2KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBjaGVja2JveCB0byBjb250cm9sIHBhbmVsIGZvciBzb3J0aW5nIG9uIGhpZGRlbiBmaWVsZHNcbiAgICAgICAgdmFyIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICAgICAgbGFiZWwuaW5uZXJIVE1MID0gJzxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIj4gQWxsb3cgc29ydGluZyBvbiBoaWRkZW4gY29sdW1ucyc7XG4gICAgICAgIGxhYmVsLnN0eWxlLmZvbnRXZWlnaHQgPSAnbm9ybWFsJztcbiAgICAgICAgbGFiZWwuc3R5bGUubWFyZ2luUmlnaHQgPSAnMmVtJztcblxuICAgICAgICB2YXIgY2hlY2tib3ggPSBsYWJlbC5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xuICAgICAgICBjaGVja2JveC5jaGVja2VkID0gdGhpcy5zb3J0T25IaWRkZW5Db2x1bW5zO1xuICAgICAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgc2VsZi5zb3J0T25IaWRkZW5Db2x1bW5zID0gY2hlY2tib3guY2hlY2tlZDtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBwYW5lbCA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLmh5cGVyZ3JpZC1kaWFsb2ctY29udHJvbC1wYW5lbCcpO1xuICAgICAgICBwYW5lbC5pbnNlcnRCZWZvcmUobGFiZWwsIHBhbmVsLmZpcnN0Q2hpbGQpO1xuXG4gICAgICAgIC8vIGFkZCB0aGUgZGlhbG9nIHRvIHRoZSBET01cbiAgICAgICAgdGhpcy5vcGVuKG9wdGlvbnMuY29udGFpbmVyKTtcbiAgICB9LFxuXG4gICAgb25DbG9zZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYmVoYXZpb3IgPSB0aGlzLmdyaWQuYmVoYXZpb3IsXG4gICAgICAgICAgICBjb2x1bW5zID0gYmVoYXZpb3IuZ2V0QWN0aXZlQ29sdW1ucygpO1xuXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZUNvbHVtbnMpIHtcbiAgICAgICAgICAgIHZhciB0cmVlID0gY29sdW1uc1swXTtcblxuICAgICAgICAgICAgLy8gVE9ETzogYnJlYWtpbmcgZW5jYXBzdWxhdGlvbjsgc2hvdWxkIGJlIHVzaW5nIHNldHRlcnMgYW5kIGdldHRlcnMgb24gdGhlIGJlaGF2aW9yXG4gICAgICAgICAgICBjb2x1bW5zLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBpZiAodHJlZSAmJiB0cmVlLmxhYmVsID09PSAnVHJlZScpIHtcbiAgICAgICAgICAgICAgICBjb2x1bW5zLnB1c2godHJlZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbHVtbnMubW9kZWxzLmZvckVhY2goZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgICAgICAgICAgICAgY29sdW1ucy5wdXNoKGNvbHVtbik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc29ydE9uSGlkZGVuQ29sdW1ucyAhPT0gdGhpcy53YXNTb3J0T25IaWRkZW5Db2x1bW5zKSB7XG4gICAgICAgICAgICAgICAgYmVoYXZpb3Iuc29ydENoYW5nZWQodGhpcy5pbmFjdGl2ZUNvbHVtbnMubW9kZWxzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYmVoYXZpb3IuY2hhbmdlZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRHcm91cHMpe1xuICAgICAgICAgICAgdmFyIGdyb3VwQnlzID0gdGhpcy5zZWxlY3RlZEdyb3Vwcy5tb2RlbHMubWFwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZS5pZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYmVoYXZpb3Iuc2V0R3JvdXBzKGdyb3VwQnlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ3JpZC50YWtlRm9jdXMoKTtcbiAgICAgICAgdGhpcy5ncmlkLmFsbG93RXZlbnRzKHRydWUpO1xuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiBjb21wYXJlQnlOYW1lKGEsIGIpIHtcbiAgICBhID0gYS5oZWFkZXIudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpO1xuICAgIGIgPSBiLmhlYWRlci50b1N0cmluZygpLnRvVXBwZXJDYXNlKCk7XG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/ICsxIDogMDtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbHVtblBpY2tlcjtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBhdXRvbWF0ID0gcmVxdWlyZSgnYXV0b21hdCcpO1xudmFyIG1hcmt1cCA9IHJlcXVpcmUoJy4uL2h0bWwnKTtcblxudmFyIEJhc2UgPSB3aW5kb3cuZmluLkh5cGVyZ3JpZC5CYXNlOyAvLyB0cnkgcmVxdWlyZSgnZmluLWh5cGVyZ3JpZC9zcmMvQmFzZScpIHdoZW4gZXh0ZXJuYWxpemVkXG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgc2VydmljZXMgYSBET00gZWxlbWVudCB1c2VkIGFzIGEgY250YWluZXIgZm9yIGEgZGlhbG9nLiBUaGUgc3RhbmRhcmQgYG1hcmt1cC5kaWFsb2dgIGlzIHNpbXBseSBhIGRpdiB3aXRoIGEgX2NvbnRyb2wgcGFuZWxfIGNvbnRhaW5pbmcgYSBjbG9zZSBib3ggYW5kIGEgc2V0dGluZ3MgZ2VhciBpY29uLlxuICpcbiAqIFlvdSBjYW4gc3VwcGx5IGFuIGFsdGVybmF0aXZlIGRpYWxvZyB0ZW1wbGF0ZS4gVGhlIGludGVyZmFjZSBpczpcbiAqICogQ2xhc3MgbmFtZSBgaHlwZXJncmlkLWRpYWxvZ2AuXG4gKiAqIEF0IGxlYXN0IG9uZSBjaGlsZCBlbGVtZW50LiBDb250ZW50IHdpbGwgYmUgaW5zZXJ0ZWQgYmVmb3JlIHRoaXMgZmlyc3QgY2hpbGQuXG4gKiAqIFR5cGljYWxseSBjb250YWlucyBhIGNsb3NlLWJveCBlbGVtZW50IHdpdGggY2xhc3MgbmFtZSBgaHlwZXJncmlkLWRpYWxvZy1jbG9zZWAgYW5kIHBvc3NpYmx5IG90aGVyIGNvbnRyb2xzIHdpdGggY2xhc3MgbmFtZSBgaHlwZXJncmlkLWRpYWxvZy14eHh4YCAod2hlcmUgX3h4eHhfIGlzIGEgdW5pcXVlIG5hbWUgZm9yIHlvdXIgY29udHJvbCkuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBEaWFsb2cgPSBCYXNlLmV4dGVuZCgnRGlhbG9nJywge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGJhc2ljIGRpYWxvZyBib3ggaW4gYHRoaXMuZWxgLlxuICAgICAqIEBwYXJhbSB7SHlwZXJncmlkfSBncmlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfGZ1bmN0aW9ufSBbb3B0aW9ucy5kaWFsb2dUZW1wbGF0ZV0gLSBBbiBhbHRlcm5hdGUgZGlhbG9nIHRlbXBsYXRlLiBUaGUgbGFzdCBjaGlsZCBlbGVtZW50IG11c3QgYmUgdGhlIFwiY29udHJvbCBwYW5lbC5cIlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuc2V0dGluZ3M9dHJ1ZV0gLSBDb250cm9sIGJveCBoYXMgc2V0dGluZ3MgaWNvbi4gKFNldHRpbmdzIGljb24gbXVzdCBiZSBpbmNsdWRlZCBpbiB0ZW1wbGF0ZS4gVGhpcyBvcHRpb24gcmVtb3ZlcyBpdC4gVGhhdCBpcywgaWYgZXhwbGljaXRseSBgZmFsc2VgIF9hbmRfIHRoZXJlIGlzIGEgc2V0dGluZ3MgY29udHJvbCwgcmVtb3ZlIGl0LilcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xib29sZWFufSBbb3B0aW9ucy5iYWNrZ3JvdW5kSW1hZ2U9aW1hZ2VzLmRpYWxvZy5zcmNdIC0gQSBVUkkgZm9yIGEgYmFja2dyb3VuZCBpbWFnZS4gSWYgZXhwbGljaXRseSBgZmFsc2VgLCBiYWNrZ3JvdW5kIGltYWdlIGlzIHN1cHByZXNzZWQuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW3Rlcm1pbmF0ZV1cbiAgICAgKi9cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihncmlkLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XG5cbiAgICAgICAgLy8gY3JlYXRlIHRoZSBiYWNrZHJvcDsgaXQgaXMgYWJzb2x1dGUtcG9zaXRpb25lZCBhbmQgc3RyZXRjaGVkXG4gICAgICAgIHRoaXMuZWwgPSBhdXRvbWF0LmZpcnN0Q2hpbGQob3B0aW9ucy5kaWFsb2dUZW1wbGF0ZSB8fCBtYXJrdXAuZGlhbG9nLCBvcHRpb25zLmRpYWxvZ1JlcGxhY2VtZW50cyk7XG5cbiAgICAgICAgdGhpcy5vcmlnaW5hbEZpcnN0Q2hpbGQgPSB0aGlzLmVsLmZpcnN0RWxlbWVudENoaWxkO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnNldHRpbmdzID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcuaHlwZXJncmlkLWRpYWxvZy1zZXR0aW5ncycpO1xuICAgICAgICAgICAgaWYgKHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZXQgYWx0ZXJuYXRpdmUgYmFja2dyb3VuZCBpbWFnZVxuICAgICAgICBpZiAob3B0aW9ucy5iYWNrZ3JvdW5kSW1hZ2UgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLmVsLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5iYWNrZ3JvdW5kSW1hZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuZWwuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gJ3VybChcXCcnICsgb3B0aW9ucy5iYWNrZ3JvdW5kSW1hZ2UgKyAnXFwnKSc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBsaXN0ZW4gZm9yIGNsaWNrc1xuICAgICAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb25DbGljay5iaW5kKHRoaXMpKTtcblxuICAgICAgICBpZiAob3B0aW9ucy50ZXJtaW5hdGUpIHtcbiAgICAgICAgICAgIHRoaXMudGVybWluYXRlID0gb3B0aW9ucy50ZXJtaW5hdGU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgQWRkcyBET00gYE5vZGVgcyB0byBkaWFsb2cuXG4gICAgICogQGRlc2MgSW5wdXQgY2FuIGJlIG5vZGVzIG9yIGEgdGVtcGxhdGUgZnJvbSB3aGljaCB0byBjcmVhdGUgbm9kZXMuIFRoZSBub2RlcyBhcmUgaW5zZXJ0ZWQgaW50byB0aGUgZGlhbG9nJ3MgRE9NIChgdGhpcy5lbGApLCByaWdodCBiZWZvcmUgdGhlIFwiY29udHJvbCBwYW5lbC5cIlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfGZ1bmN0aW9ufE5vZGV8Tm9kZVtdfSBub2RlcyAtIFNlZSBgYXV0b21hdGAuXG4gICAgICogQHBhcmFtIHsuLi4qfSBbcmVwbGFjZW1lbnRzXSAtIFNlZSBgYXV0b21hdGAuXG4gICAgICovXG4gICAgYXBwZW5kOiBmdW5jdGlvbihub2RlcywgcmVwbGFjZW1lbnRzLyouLi4qLykge1xuICAgICAgICBpZiAodHlwZW9mIG5vZGVzID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygbm9kZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGFyZ3Muc3BsaWNlKDEsIDAsIHRoaXMuZWwsIHRoaXMub3JpZ2luYWxGaXJzdENoaWxkKTtcbiAgICAgICAgICAgIGF1dG9tYXQuYXBwZW5kLmFwcGx5KG51bGwsIGFyZ3MpO1xuXG4gICAgICAgIH0gZWxzZSBpZiAoJ2xlbmd0aCcgaW4gbm9kZXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsLmluc2VydEJlZm9yZShub2Rlc1tpXSwgdGhpcy5vcmlnaW5hbEZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVsLmluc2VydEJlZm9yZShub2RlcywgdGhpcy5vcmlnaW5hbEZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluc2VydCBkaWFsb2cgaW50byBET00uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBbY29udGFpbmVyXSAtIElmIHVuZGVmaW5lZCwgZGlhbG9nIGlzIGFwcGVuZGVkIHRvIGJvZHkuXG4gICAgICpcbiAgICAgKiBJZiBkZWZpbmVkLCBkaWFsb2cgaXMgYXBwZW5kZWQgdG8gY29udGFpbmVyLiBXaGVuIGNvbnRhaW5lciBpcyBub3QgYm9keSwgaXQgd2lsbCBiZTpcbiAgICAgKiAwLiBtYWRlIHZpc2libGUgYmVmb3JlIGFwcGVuZCAoaXQgc2hvdWxkIGluaXRpYWxseSBiZSBoaWRkZW4pXG4gICAgICogMC4gbWFkZSBoaWRkZW4gYWZ0ZXIgcmVtb3ZlXG4gICAgICovXG4gICAgb3BlbjogZnVuY3Rpb24oY29udGFpbmVyKSB7XG4gICAgICAgIHZhciBlcnJvcjtcblxuICAgICAgICBpZiAoISh0aGlzLm9wZW5lZCB8fCB0aGlzLm9wZW5pbmcgfHwgdGhpcy5jbG9zZWQgfHwgdGhpcy5jbG9zaW5nKSkge1xuICAgICAgICAgICAgZXJyb3IgPSB0aGlzLm9uT3BlbigpO1xuXG4gICAgICAgICAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsID0gdGhpcy5lbDtcblxuICAgICAgICAgICAgICAgIHRoaXMub3BlbmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lci50YWdOYW1lICE9PSAnQk9EWScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gaW5zZXJ0IHRoZSBuZXcgZGlhbG9nIG1hcmt1cCBpbnRvIHRoZSBET01cbiAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xuXG4gICAgICAgICAgICAgICAgLy8gc2NoZWR1bGUgaXQgZm9yIGEgc2hvdyB0cmFuc2l0aW9uXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgZWwuY2xhc3NMaXN0LmFkZCgnaHlwZXJncmlkLWRpYWxvZy12aXNpYmxlJyk7IH0sIDUwKTtcblxuICAgICAgICAgICAgICAgIC8vIGF0IGVuZCBvZiBzaG93IHRyYW5zaXRpb24sIGhpZGUgYWxsIHRoZSBoeXBlcmdyaWRzIGJlaGluZCBpdCB0byBwcmV2ZW50IGFueSBrZXkvbW91c2UgZXZlbnRzIGZyb20gZ2V0dGluZyB0byB0aGVtXG4gICAgICAgICAgICAgICAgLy8gdG9kbzogcGF1c2UgYWxsIGh5cGVyZ3JpZHMgc28gdGhleSBkb24ndCBzcGluIHVzZWxlc3NseVxuICAgICAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCB0aGlzLmhpZGVBcHBCb3VuZCA9IGhpZGVBcHAuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBkaWFsb2cgZnJvbSBET00uXG4gICAgICovXG4gICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXJyb3I7XG5cbiAgICAgICAgaWYgKHRoaXMub3BlbmVkICYmICEodGhpcy5jbG9zZWQgfHwgdGhpcy5jbG9zaW5nKSkge1xuICAgICAgICAgICAgZXJyb3IgPSB0aGlzLm9uQ2xvc2UoKTtcblxuICAgICAgICAgICAgaWYgKCFlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2luZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAvLyB1bmhpZGUgYWxsIHRoZSBoeXBlcmdyaWRzIGJlaGluZCB0aGUgZGlhbG9nXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBWaXNpYmxlKCd2aXNpYmxlJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBzdGFydCBhIGhpZGUgdHJhbnNpdGlvbiBvZiBkaWFsb2cgcmV2ZWFsaW5nIGdyaWRzIGJlaGluZCBpdFxuICAgICAgICAgICAgICAgIHRoaXMuZWwuY2xhc3NMaXN0LnJlbW92ZSgnaHlwZXJncmlkLWRpYWxvZy12aXNpYmxlJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBhdCBlbmQgb2YgaGlkZSB0cmFuc2l0aW9uLCByZW1vdmUgZGlhbG9nIGZyb20gdGhlIERPTVxuICAgICAgICAgICAgICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIHRoaXMucmVtb3ZlRGlhbG9nQm91bmQgPSByZW1vdmVEaWFsb2cuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgfSxcblxuICAgIGFwcFNlbGVjdG9yOiAnY2FudmFzLmh5cGVyZ3JpZCcsXG4gICAgYXBwVmlzaWJsZTogZnVuY3Rpb24odmlzaWJpbGl0eSkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5hcHBTZWxlY3RvciksIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICBlbC5zdHlsZS52aXNpYmlsaXR5ID0gdmlzaWJpbGl0eTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uT3BlbjogbnVsbFBhdHRlcm4sXG4gICAgb25PcGVuZWQ6IG51bGxQYXR0ZXJuLFxuICAgIG9uQ2xvc2U6IG51bGxQYXR0ZXJuLFxuICAgIG9uQ2xvc2VkOiBudWxsUGF0dGVybixcbiAgICB0ZXJtaW5hdGU6IG51bGxQYXR0ZXJuXG59KTtcblxuZnVuY3Rpb24gbnVsbFBhdHRlcm4oKSB7fVxuXG5mdW5jdGlvbiByZW1vdmVEaWFsb2coZXZ0KSB7XG4gICAgaWYgKGV2dC50YXJnZXQgPT09IHRoaXMuZWwgJiYgZXZ0LnByb3BlcnR5TmFtZSA9PT0gJ29wYWNpdHknKSB7XG4gICAgICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIHRoaXMucmVtb3ZlRGlhbG9nQm91bmQpO1xuXG4gICAgICAgIGlmICh0aGlzLmVsLnBhcmVudEVsZW1lbnQudGFnTmFtZSAhPT0gJ0JPRFknKSB7XG4gICAgICAgICAgICB0aGlzLmVsLnBhcmVudEVsZW1lbnQuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWwucmVtb3ZlKCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmVsO1xuXG4gICAgICAgIHRoaXMub25DbG9zZWQoKTtcbiAgICAgICAgdGhpcy50ZXJtaW5hdGUoKTtcbiAgICAgICAgdGhpcy5jbG9zaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZGVBcHAoZXZ0KSB7XG4gICAgaWYgKGV2dC50YXJnZXQgPT09IHRoaXMuZWwgJiYgZXZ0LnByb3BlcnR5TmFtZSA9PT0gJ29wYWNpdHknKSB7XG4gICAgICAgIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIHRoaXMuaGlkZUFwcEJvdW5kKTtcblxuICAgICAgICB0aGlzLmFwcFZpc2libGUoJ2hpZGRlbicpO1xuICAgICAgICB0aGlzLm9uT3BlbmVkKCk7XG4gICAgICAgIHRoaXMub3BlbmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9wZW5lZCA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBvbkNsaWNrKGV2dCkge1xuICAgIGlmICh0aGlzKSB7XG4gICAgICAgIGlmIChldnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnaHlwZXJncmlkLWRpYWxvZy1jbG9zZScpKSB7XG4gICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTsgLy8gaWdub3JlIGhyZWZcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcblxuICAgICAgICB9IGVsc2UgaWYgKGV2dC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdoeXBlcmdyaWQtZGlhbG9nLXNldHRpbmdzJykpIHtcbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpOyAvLyBpZ25vcmUgaHJlZlxuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MpIHsgdGhpcy5zZXR0aW5ncygpOyB9XG5cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm9uQ2xpY2sgJiYgIXRoaXMub25DbGljay5jYWxsKHRoaXMsIGV2dCkgJiYgZXZ0LnRhcmdldC50YWdOYW1lID09PSAnQScpIHtcbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpOyAvLyBpZ25vcmUgaHJlZiBvZiBoYW5kbGVkIGV2ZW50XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7IC8vIHRoZSBjbGljayBzdG9wcyBoZXJlLCBoYW5kbGVkIG9yIG5vdFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERpYWxvZztcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBUYWJ6ID0gcmVxdWlyZSgndGFieicpO1xudmFyIHBvcE1lbnUgPSByZXF1aXJlKCdwb3AtbWVudScpO1xudmFyIGF1dG9tYXQgPSByZXF1aXJlKCdhdXRvbWF0Jyk7XG5cbnZhciBEaWFsb2cgPSByZXF1aXJlKCcuL0RpYWxvZycpO1xudmFyIG1hcmt1cCA9IHJlcXVpcmUoJy4uL2h0bWwnKTtcbnZhciBjb3B5SW5wdXQgPSByZXF1aXJlKCcuL2NvcHktaW5wdXQnKTtcblxudmFyIHRhYlByb3BlcnRpZXMgPSB7XG4gICAgdGFibGVRQjoge1xuICAgICAgICBpc1RhYmxlRmlsdGVyOiB0cnVlXG4gICAgfSxcbiAgICB0YWJsZVNRTDoge1xuICAgICAgICBpc1RhYmxlRmlsdGVyOiB0cnVlLFxuICAgICAgICBsYW5ndWFnZTogJ1NRTCdcbiAgICB9LFxuICAgIGNvbHVtbnNRQjoge1xuICAgICAgICBpc0NvbHVtbkZpbHRlcjogdHJ1ZVxuICAgIH0sXG4gICAgY29sdW1uc1NRTDoge1xuICAgICAgICBpc0NvbHVtbkZpbHRlcjogdHJ1ZSxcbiAgICAgICAgbGFuZ3VhZ2U6ICdTUUwnXG4gICAgfSxcbiAgICBjb2x1bW5zQ1FMOiB7XG4gICAgICAgIGlzQ29sdW1uRmlsdGVyOiB0cnVlLFxuICAgICAgICBsYW5ndWFnZTogJ0NRTCdcbiAgICB9XG59O1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgRGlhbG9nXG4gKi9cbnZhciBNYW5hZ2VGaWx0ZXJzID0gRGlhbG9nLmV4dGVuZCgnTWFuYWdlRmlsdGVycycsIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7SHlwZXJncmlkfSBncmlkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIE1heSBpbmNsdWRlIGBEaWFsb2dgIG9wdGlvbnMuXG4gICAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gW29wdGlvbnMuY29udGFpbmVyPWRvY3VtZW50LmJvZHldXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oZ3JpZCwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmZpbHRlciA9IGdyaWQuZmlsdGVyO1xuXG4gICAgICAgIHRoaXMuYXBwZW5kKG1hcmt1cC5maWx0ZXJUcmVlcyk7XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSB0aGUgZm9sZGVyIHRhYnNcbiAgICAgICAgdmFyIHRhYnogPSB0aGlzLnRhYnogPSBuZXcgVGFieih7XG4gICAgICAgICAgICByb290OiB0aGlzLmVsLFxuICAgICAgICAgICAgb25FbmFibGU6IHJlbmRlckZvbGRlci5iaW5kKHRoaXMpLFxuICAgICAgICAgICAgb25EaXNhYmxlOiBzYXZlRm9sZGVycy5iaW5kKHRoaXMsIG51bGwpIC8vIG51bGwgb3B0aW9uc1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyB3aXJlLXVwIHRoZSBOZXcgQ29sdW1uIGRyb3AtZG93blxuICAgICAgICB2YXIgbmV3Q29sdW1uRHJvcERvd24gPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJyNhZGQtY29sdW1uLWZpbHRlci1zdWJleHByZXNzaW9uJyk7XG4gICAgICAgIG5ld0NvbHVtbkRyb3BEb3duLm9ubW91c2Vkb3duID0gb25OZXdDb2x1bW5Nb3VzZURvd24uYmluZCh0aGlzKTtcbiAgICAgICAgbmV3Q29sdW1uRHJvcERvd24ub25jaGFuZ2UgPSBvbk5ld0NvbHVtbkNoYW5nZS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIC8vIHB1dCB0aGUgdHdvIHN1YnRyZWVzIGluIHRoZSB0d28gcGFuZWxzXG4gICAgICAgIHRhYnouZm9sZGVyKCcjdGFibGVRQicpLmFwcGVuZENoaWxkKHRoaXMuZmlsdGVyLnRhYmxlRmlsdGVyLmVsKTtcbiAgICAgICAgdGFiei5mb2xkZXIoJyNjb2x1bW5zUUInKS5hcHBlbmRDaGlsZCh0aGlzLmZpbHRlci5jb2x1bW5GaWx0ZXJzLmVsKTtcblxuICAgICAgICAvLyBjb3B5IHRoZSBTUUwgbW9yZS1pbmZvIGJsb2NrIGZyb20gdGhlIHRhYmxlIHRvIHRoZSBjb2x1bW5zIHRhYlxuICAgICAgICB2YXIgY29sdW1uU3FsRWwgPSB0YWJ6LmZvbGRlcignI2NvbHVtbnNTUUwnKTtcbiAgICAgICAgdmFyIG1vcmVTcWxJbmZvID0gdGFiei5mb2xkZXIoJyN0YWJsZVNRTCcpLmZpcnN0RWxlbWVudENoaWxkLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgY29sdW1uU3FsRWwuaW5zZXJ0QmVmb3JlKG1vcmVTcWxJbmZvLCBjb2x1bW5TcWxFbC5maXJzdENoaWxkKTtcblxuICAgICAgICAvLyBhZGQgaXQgdG8gdGhlIERPTVxuICAgICAgICB0aGlzLm9wZW4ob3B0aW9ucy5jb250YWluZXIpO1xuXG4gICAgICAgIC8vIGZvbGxvd2luZyBuZWVkZWQgZm9yIHVuY2xlYXIgcmVhc29ucyB0byBnZXQgZHJvcC1kb3duIHRvIGRpc3BsYXkgY29ycmVjdGx5XG4gICAgICAgIG5ld0NvbHVtbkRyb3BEb3duLnNlbGVjdGVkSW5kZXggPSAwO1xuICAgIH0sXG5cbiAgICBvbkNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNhdmVGb2xkZXJzLmNhbGwodGhpcyk7XG4gICAgfSxcblxuICAgIG9uQ2xvc2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJlaGF2aW9yID0gdGhpcy5ncmlkLmJlaGF2aW9yO1xuICAgICAgICB0aGlzLmdyaWQudGFrZUZvY3VzKCk7XG4gICAgICAgIHRoaXMuZ3JpZC5hbGxvd0V2ZW50cyh0cnVlKTtcbiAgICAgICAgYmVoYXZpb3IucmVpbmRleCgpO1xuICAgICAgICBiZWhhdmlvci5jaGFuZ2VkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBjbGljayBoYW5kbGVyczsgY2FsbGVkIGJ5IGN1cnRhaW4ub25jbGljayBpbiBjb250ZXh0XG4gICAgICogQHBhcmFtIGV2dFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIG9uQ2xpY2s6IGZ1bmN0aW9uKGV2dCkgeyAvLyB0byBiZSBjYWxsZWQgd2l0aCBmaWx0ZXIgb2JqZWN0IGFzIHN5bnRheFxuICAgICAgICB2YXIgY3RybCA9IGV2dC50YXJnZXQ7XG5cbiAgICAgICAgaWYgKGN0cmwuY2xhc3NMaXN0LmNvbnRhaW5zKCdtb3JlLWluZm8nKSkge1xuICAgICAgICAgICAgLy8gZmluZCBhbGwgbW9yZS1pbmZvIGxpbmtzIGFuZCB0aGVpciBhZGphY2VudCBibG9ja3MgKGJsb2NrcyBhbHdheXMgZm9sbG93IGxpbmtzKVxuICAgICAgICAgICAgdmFyIGVscyA9IHRoaXMuZWwucXVlcnlTZWxlY3RvckFsbCgnLm1vcmUtaW5mbycpO1xuXG4gICAgICAgICAgICAvLyBoaWRlIGFsbCBtb3JlLWluZm8gYmxvY2tzIGV4Y2VwdCB0aGUgb25lIGZvbGxvd2luZyB0aGlzIGxpbmsgKHVubGVzcyBpdCdzIGFscmVhZHkgdmlzaWJsZSBpbiB3aGljaCBjYXNlIGhpZGUgaXQgdG9vKS5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsID0gZWxzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChlbC50YWdOYW1lID09PSAnQScpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvdW5kID0gZWwgPT09IGN0cmw7XG4gICAgICAgICAgICAgICAgICAgIGVsLmNsYXNzTGlzdFtmb3VuZCA/ICd0b2dnbGUnIDogJ3JlbW92ZSddKCdoaWRlLWluZm8nKTtcbiAgICAgICAgICAgICAgICAgICAgZWwgPSBlbHNbaSArIDFdO1xuICAgICAgICAgICAgICAgICAgICBlbC5zdHlsZS5kaXNwbGF5ID0gZm91bmQgJiYgZWwuc3R5bGUuZGlzcGxheSAhPT0gJ2Jsb2NrJyA/ICdibG9jaycgOiAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSBpZiAoY3RybC5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbHRlci1jb3B5JykpIHtcbiAgICAgICAgICAgIHZhciBpc0NvcHlBbGwgPSBjdHJsLmNoaWxkTm9kZXMubGVuZ3RoOyAvLyBjb250YWlucyBcIkFsbFwiXG4gICAgICAgICAgICBpZiAoaXNDb3B5QWxsKSB7XG4gICAgICAgICAgICAgICAgY3RybCA9IHRoaXMudGFiei5mb2xkZXIoY3RybCkucXVlcnlTZWxlY3Rvcihjb3B5SW5wdXQuc2VsZWN0b3JUZXh0Q29udHJvbHMpO1xuICAgICAgICAgICAgICAgIGNvcHlJbnB1dChjdHJsLCB0aGlzLmZpbHRlci5jb2x1bW5GaWx0ZXJzLmdldFN0YXRlKHsgc3ludGF4OiAnU1FMJyB9KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvcHlJbnB1dChjdHJsLnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcihjb3B5SW5wdXQuc2VsZWN0b3JUZXh0Q29udHJvbHMpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIG1lYW5zIHVuaGFuZGxlZFxuICAgICAgICB9XG4gICAgfVxufSk7XG5cbi8qKlxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEBwYXJhbSB0YWJcbiAqIEBwYXJhbSBmb2xkZXJcbiAqIEBwYXJhbSBbcGFuZWxdIFBhbmVsIHRvIHNhdmUgKGZyb20gdGFiIGNsaWNrKS4gSWYgb21pdHRlZCwgc2F2ZSBib3RoIHBhbmVscyAoZnJvbSBvbmNsb3NlKS5cbiAqIEByZXR1cm5zIHtib29sZWFufHVuZGVmaW5lZHxzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHNhdmVGb2xkZXJzKG9wdGlvbnMsIHRhYiwgZm9sZGVyLCBwYW5lbCkge1xuICAgIHJldHVybiAoXG4gICAgICAgICghcGFuZWwgfHwgcGFuZWwuaWQgPT09ICd0YWJsZUZpbHRlclBhbmVsJykgJiYgc2F2ZUZvbGRlci5jYWxsKHRoaXMsIHRoaXMuZmlsdGVyLnRhYmxlRmlsdGVyLCBvcHRpb25zKSB8fFxuICAgICAgICAoIXBhbmVsIHx8IHBhbmVsLmlkID09PSAnY29sdW1uRmlsdGVyc1BhbmVsJykgJiYgc2F2ZUZvbGRlci5jYWxsKHRoaXMsIHRoaXMuZmlsdGVyLmNvbHVtbkZpbHRlcnMsIG9wdGlvbnMpXG4gICAgKTtcbn1cblxuLyoqXG4gKiBAdGhpcyBGaWx0ZXJcbiAqIEBwYXJhbSB7RGVmYXVsdEZpbHRlcn0gc3VidHJlZVxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zPXthbGVydDp0cnVlLGZvY3VzOnRydWV9XSAtIFNpZGUgZWZmZWN0cyBhcyBwZXIgYEZpbHRlclRyZWUucHJvdG90eXBlLmludmFsaWRgJ3MgYG9wdGlvbnNgJyBwYXJhbWV0ZXIuXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfHN0cmluZ30gLSBWYWxpZGF0aW9uIGVycm9yIHRleHQ7IGZhbHN5IG1lYW5zIHZhbGlkIChubyBlcnJvcikuXG4gKi9cbmZ1bmN0aW9uIHNhdmVGb2xkZXIoc3VidHJlZSwgb3B0aW9ucykgeyAvLyB0byBiZSBjYWxsZWQgd2l0aCBmaWx0ZXIgb2JqZWN0IGFzIHN5bnRheFxuICAgIHZhciBpc0NvbHVtbkZpbHRlcnMgPSBzdWJ0cmVlID09PSB0aGlzLmZpbHRlci5jb2x1bW5GaWx0ZXJzLFxuICAgICAgICB0YWJRdWVyeUJ1aWxkZXIgPSB0aGlzLnRhYnoudGFiKGlzQ29sdW1uRmlsdGVycyA/ICcjY29sdW1uc1FCJyA6ICcjdGFibGVRQicpLFxuICAgICAgICB0YWIgPSB0aGlzLnRhYnouZW5hYmxlZFRhYih0YWJRdWVyeUJ1aWxkZXIpLFxuICAgICAgICBmb2xkZXIgPSB0aGlzLnRhYnouZm9sZGVyKHRhYiksXG4gICAgICAgIGlzUXVlcnlCdWlsZGVyID0gdGFiID09PSB0YWJRdWVyeUJ1aWxkZXIsXG4gICAgICAgIGRlZmF1bHRlZE9wdGlvbnMgPSBvcHRpb25zIHx8IHtcbiAgICAgICAgICAgIGFsZXJ0OiB0cnVlLFxuICAgICAgICAgICAgZm9jdXM6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgZW5oYW5jZWRPcHRpb25zID0ge1xuICAgICAgICAgICAgYWxlcnQ6IGRlZmF1bHRlZE9wdGlvbnMuYWxlcnQsXG4gICAgICAgICAgICBmb2N1czogZGVmYXVsdGVkT3B0aW9ucy5mb2N1cyAmJiBpc1F1ZXJ5QnVpbGRlclxuICAgICAgICB9LFxuICAgICAgICBlcnJvciwgY3RybDtcblxuICAgIGlmIChpc0NvbHVtbkZpbHRlcnMgfHwgaXNRdWVyeUJ1aWxkZXIpIHtcbiAgICAgICAgZXJyb3IgPSBzdWJ0cmVlLmludmFsaWQoZW5oYW5jZWRPcHRpb25zKTtcbiAgICB9IGVsc2UgeyAvLyB0YWJsZSBmaWx0ZXIgU1FMIHRhYlxuICAgICAgICBjdHJsID0gZm9sZGVyLnF1ZXJ5U2VsZWN0b3IoJ3RleHRhcmVhJyk7XG4gICAgICAgIGVycm9yID0gdGhpcy5maWx0ZXIuc2V0VGFibGVGaWx0ZXJTdGF0ZShjdHJsLnZhbHVlLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBpZiAoZXJyb3IgJiYgIWlzUXVlcnlCdWlsZGVyKSB7XG4gICAgICAgIC8vIElmIHRoZXJlIHdhcyBhIHZhbGlkYXRpb24gZXJyb3IsIG1vdmUgdGhlIGZvY3VzIGZyb20gdGhlIHF1ZXJ5IGJ1aWxkZXIgY29udHJvbCB0byB0aGUgdGV4dCBib3ggY29udHJvbC5cbiAgICAgICAgaWYgKGlzQ29sdW1uRmlsdGVycykge1xuICAgICAgICAgICAgLy8gV2UncmUgaW4gU1FMIG9yIENRTCB0YWIgc28gZmluZCB0ZXh0IGJveCB0aGF0IGdvZXMgd2l0aCB0aGlzIHN1YmV4cHJlc3Npb24gYW5kIGZvY3VzIG9uIGl0IGluc3RlYWQgb2YgUUIgY29udHJvbC5cbiAgICAgICAgICAgIHZhciBlcnJhbnRDb2x1bW5OYW1lID0gZXJyb3Iubm9kZS5lbC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JykudmFsdWU7XG4gICAgICAgICAgICBjdHJsID0gZm9sZGVyLnF1ZXJ5U2VsZWN0b3IoJ1tuYW1lPVwiJyArIGVycmFudENvbHVtbk5hbWUgKyAnXCJdJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY3RybCkge1xuICAgICAgICBkZWNvcmF0ZUZpbHRlcklucHV0KGN0cmwsIGVycm9yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXJyb3I7XG59XG5cbmZ1bmN0aW9uIGRlY29yYXRlRmlsdGVySW5wdXQoY3RybCwgZXJyb3IpIHtcbiAgICBjdHJsLmNsYXNzTGlzdC50b2dnbGUoJ2ZpbHRlci10cmVlLWVycm9yJywgISFlcnJvcik7XG5cbiAgICBjdHJsLmZvY3VzKCk7XG5cbiAgICAvLyBmaW5kIHRoZSBuZWFyYnkgd2FybmluZyBlbGVtZW50XG4gICAgdmFyIHdhcm5pbmdFbDtcbiAgICBkbyB7XG4gICAgICAgIGN0cmwgPSBjdHJsLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIHdhcm5pbmdFbCA9IGN0cmwucXVlcnlTZWxlY3RvcignLmZpbHRlci10cmVlLXdhcm4nKTtcbiAgICB9IHdoaWxlICghd2FybmluZ0VsKTtcblxuICAgIC8vIHNob3cgb3IgaGlkZSB0aGUgZXJyb3JcbiAgICB3YXJuaW5nRWwuaW5uZXJIVE1MID0gZXJyb3IubWVzc2FnZSB8fCBlcnJvciB8fCAnJztcbn1cblxuZnVuY3Rpb24gb25OZXdDb2x1bW5Nb3VzZURvd24oZXZ0KSB7IC8vIHRvIGJlIGNhbGxlZCB3aXRoIGZpbHRlciBvYmplY3QgYXMgc3ludGF4XG4gICAgaWYgKHNhdmVGb2xkZXIuY2FsbCh0aGlzLCB0aGlzLmZpbHRlci5jb2x1bW5GaWx0ZXJzKSkge1xuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTsgLy8gZG8gbm90IGRyb3AgZG93blxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIChyZSlidWlsZCB0aGUgZHJvcC1kb3duIGNvbnRlbnRzLCB3aXRoIHNhbWUgcHJvbXB0LCBidXQgZXhjbHVkaW5nIGNvbHVtbnMgd2l0aCBhY3RpdmUgZmlsdGVyIHN1YmV4cHJlc3Npb25zXG4gICAgICAgIHZhciBjdHJsID0gZXZ0LnRhcmdldCxcbiAgICAgICAgICAgIHByb21wdCA9IGN0cmwub3B0aW9uc1swXS50ZXh0LnJlcGxhY2UoJ+KApicsICcnKSwgLy8gdXNlIG9yaWdpbmFsIGJ1dCB3L28gZWxsaXBzaXMgYXMgLmJ1aWxkKCkgYXBwZW5kcyBvbmVcbiAgICAgICAgICAgIGJsYWNrbGlzdCA9IHRoaXMuZmlsdGVyLmNvbHVtbkZpbHRlcnMuY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGNvbHVtbkZpbHRlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2x1bW5GaWx0ZXIuY2hpbGRyZW4ubGVuZ3RoICYmIGNvbHVtbkZpbHRlci5jaGlsZHJlblswXS5jb2x1bW47XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgcHJvbXB0OiBwcm9tcHQsXG4gICAgICAgICAgICAgICAgYmxhY2tsaXN0OiBibGFja2xpc3RcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgcG9wTWVudS5idWlsZChjdHJsLCB0aGlzLmZpbHRlci5yb290LnNjaGVtYSwgb3B0aW9ucyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBvbk5ld0NvbHVtbkNoYW5nZShldnQpIHtcbiAgICB2YXIgY3RybCA9IGV2dC50YXJnZXQsXG4gICAgICAgIHRhYkNvbHVtblFCID0gdGhpcy50YWJ6LmZvbGRlcignI3RhYmxlUUInKSxcbiAgICAgICAgdGFiID0gdGhpcy50YWJ6LmVuYWJsZWRUYWIodGFiQ29sdW1uUUIucGFyZW50RWxlbWVudCksXG4gICAgICAgIGlzUXVlcnlCdWlsZGVyID0gdGFiID09PSB0YWJDb2x1bW5RQixcbiAgICAgICAgdGFiUHJvcHMgPSB0YWJQcm9wZXJ0aWVzW3RhYi5pZF07XG5cbiAgICB0aGlzLmZpbHRlci5jb2x1bW5GaWx0ZXJzLmFkZCh7XG4gICAgICAgIHN0YXRlOiB7XG4gICAgICAgICAgICB0eXBlOiAnY29sdW1uRmlsdGVyJyxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbIHsgY29sdW1uOiBjdHJsLnZhbHVlIH0gXVxuICAgICAgICB9LFxuICAgICAgICBmb2N1czogaXNRdWVyeUJ1aWxkZXJcbiAgICB9KTtcblxuICAgIGlmICh0YWJQcm9wcy5pc0NvbHVtbkZpbHRlciAmJiB0YWJQcm9wcy5sYW51Z2FnZSkge1xuICAgICAgICByZW5kZXJGb2xkZXIuY2FsbCh0aGlzLCB0YWIpO1xuICAgIH1cblxuICAgIC8vIHJlbW92ZSBhbGwgYnV0IHRoZSBwcm9tcHQgb3B0aW9uIChmaXJzdCBjaGlsZClcbiAgICBjdHJsLnNlbGVjdGVkSW5kZXggPSAwO1xuICAgIHdoaWxlIChjdHJsLmxhc3RDaGlsZCAhPT0gY3RybC5maXJzdENoaWxkKSB7XG4gICAgICAgIGN0cmwucmVtb3ZlQ2hpbGQoY3RybC5sYXN0Q2hpbGQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyRm9sZGVyKHRhYikgeyAvLyB0byBiZSBjYWxsZWQgd2l0aCBmaWx0ZXIgb2JqZWN0IGFzIHN5bnRheFxuICAgIHZhciB0YWJQcm9wcyA9IHRhYlByb3BlcnRpZXNbdGFiLmlkXSxcbiAgICAgICAgcXVlcnlMYW5ndWFnZSA9IHRhYlByb3BzLmxhbmd1YWdlO1xuXG4gICAgaWYgKHF1ZXJ5TGFuZ3VhZ2UpIHtcbiAgICAgICAgdmFyIGdsb2JhbEZpbHRlciA9IHRoaXMuZmlsdGVyLFxuICAgICAgICAgICAgZm9sZGVyID0gdGhpcy50YWJ6LmZvbGRlcih0YWIpO1xuXG4gICAgICAgIGlmICh0YWJQcm9wcy5pc1RhYmxlRmlsdGVyKSB7XG5cbiAgICAgICAgICAgIGZvbGRlci5xdWVyeVNlbGVjdG9yKCd0ZXh0YXJlYScpLnZhbHVlID0gZ2xvYmFsRmlsdGVyLnRhYmxlRmlsdGVyLmdldFN0YXRlKHsgc3ludGF4OiAnU1FMJyB9KTtcblxuICAgICAgICB9IGVsc2UgeyAvLyBjb2x1bW4gZmlsdGVyXG5cbiAgICAgICAgICAgIHZhciBjb2x1bW5GaWx0ZXJzID0gZ2xvYmFsRmlsdGVyLmNvbHVtbkZpbHRlcnMuY2hpbGRyZW4sXG4gICAgICAgICAgICAgICAgZWwgPSBmb2xkZXIubGFzdEVsZW1lbnRDaGlsZCxcbiAgICAgICAgICAgICAgICBtc2dFbCA9IGVsLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKSxcbiAgICAgICAgICAgICAgICBsaXN0RWwgPSBlbC5xdWVyeVNlbGVjdG9yKCdvbCcpLFxuICAgICAgICAgICAgICAgIGNvcHlBbGxMaW5rID0gZWwucXVlcnlTZWxlY3RvcignYTpmaXJzdC1vZi10eXBlJyk7XG5cbiAgICAgICAgICAgIG1zZ0VsLmlubmVySFRNTCA9IGFjdGl2ZUZpbHRlcnNNZXNzYWdlKGNvbHVtbkZpbHRlcnMubGVuZ3RoKTtcbiAgICAgICAgICAgIGxpc3RFbC5pbm5lckhUTUwgPSAnJztcblxuICAgICAgICAgICAgLy8gZm9yIGVhY2ggY29sdW1uIGZpbHRlciBzdWJ0cmVlLCBhcHBlbmQgYW4gPGxpPi4uLjwvbGk+IGVsZW1lbnQgY29udGFpbmluZzpcbiAgICAgICAgICAgIC8vIGNvbHVtbiB0aXRsZSwgXCIoY29weSlcIiBsaW5rLCBhbmQgZWRpdGFibGUgdGV4dCBpbnB1dCBib3ggY29udGFpbmluZyB0aGUgc3ViZXhwcmVzc2lvblxuICAgICAgICAgICAgY29sdW1uRmlsdGVycy5mb3JFYWNoKGZ1bmN0aW9uKGZpbHRlcikge1xuICAgICAgICAgICAgICAgIHZhciBjb25kaXRpb25hbCA9IGZpbHRlci5jaGlsZHJlblswXSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGNvbmRpdGlvbmFsLnNjaGVtYVswXSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGNvbmRpdGlvbmFsLmNvbHVtbixcbiAgICAgICAgICAgICAgICAgICAgYWxpYXMgPSBpdGVtLmFsaWFzIHx8IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGV4cHJlc3Npb24gPSBmaWx0ZXIuZ2V0U3RhdGUoeyBzeW50YXg6IHF1ZXJ5TGFuZ3VhZ2UgfSksXG4gICAgICAgICAgICAgICAgICAgIGlzTnVsbCA9IGV4cHJlc3Npb24gPT09ICcoTlVMTCBJUyBOVUxMKScgfHwgZXhwcmVzc2lvbiA9PT0gJycsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBpc051bGwgPyAnJyA6IGV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IGlzTnVsbCA/ICdmaWx0ZXItdHJlZS1lcnJvcicgOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgbGkgPSBhdXRvbWF0LmZpcnN0Q2hpbGQobWFya3VwW3F1ZXJ5TGFuZ3VhZ2VdLCBhbGlhcywgbmFtZSwgY29udGVudCwgY2xhc3NOYW1lKTtcblxuICAgICAgICAgICAgICAgIGxpc3RFbC5hcHBlbmRDaGlsZChsaSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZm9sZGVyLm9ua2V5dXAgPSBzZXRDb2x1bW5GaWx0ZXJTdGF0ZS5iaW5kKHRoaXMsIHF1ZXJ5TGFuZ3VhZ2UpO1xuXG4gICAgICAgICAgICBpZiAoY29weUFsbExpbmspIHtcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSdzIGEgXCIoY29weSBhbGwpXCIgbGluaywgaGlkZSBpdCBpZiBvbmx5IDAgb3IgMSBzdWJleHByZXNzaW9uc1xuICAgICAgICAgICAgICAgIGNvcHlBbGxMaW5rLnN0eWxlLmRpc3BsYXkgPSBjb2x1bW5GaWx0ZXJzLmxlbmd0aCA+IDEgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG59XG5cbi8vdmFyIFJFVFVSTl9LRVkgPSAweDBkLCBFU0NBUEVfS0VZID0gMHgxYjtcbi8qKlxuICogQ2FsbGVkIGZyb20ga2V5LXVwIGV2ZW50cyBmcm9tIGAjY29sdW1uU1FMYCBhbmQgYCNjb2x1bW5DUUxgIHRhYnMuXG4gKiBAdGhpcyBGaWx0ZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeUxhbmd1YWdlXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2dFxuICovXG5mdW5jdGlvbiBzZXRDb2x1bW5GaWx0ZXJTdGF0ZShxdWVyeUxhbmd1YWdlLCBldnQpIHtcbiAgICB2YXIgY3RybCA9IGV2dC50YXJnZXQ7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBpZiBrZXkgd2FzIHByZXNzZWQgaW5zaWRlIGEgdGV4dCBib3guXG4gICAgaWYgKGN0cmwuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaWx0ZXItdGV4dC1ib3gnKSkge1xuICAgICAgICAvL3N3aXRjaCAoZXZ0LmtleUNvZGUpIHtcbiAgICAgICAgLy8gICAgY2FzZSBFU0NBUEVfS0VZOlxuICAgICAgICAvLyAgICAgICAgY3RybC52YWx1ZSA9IG9sZEFyZztcbiAgICAgICAgLy8gICAgY2FzZSBSRVRVUk5fS0VZOiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWZhbGx0aHJvdWdoXG4gICAgICAgIC8vICAgICAgICBjdHJsLmJsdXIoKTtcbiAgICAgICAgLy8gICAgICAgIGJyZWFrO1xuICAgICAgICAvLyAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgZXJyb3IsXG4gICAgICAgICAgICBvcHRpb25zID0geyBzeW50YXg6IHF1ZXJ5TGFuZ3VhZ2UsIGFsZXJ0OiB0cnVlIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGVycm9yID0gdGhpcy5maWx0ZXIuc2V0Q29sdW1uRmlsdGVyU3RhdGUoY3RybC5uYW1lLCBjdHJsLnZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBlcnJvciA9IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlY29yYXRlRmlsdGVySW5wdXQoY3RybCwgZXJyb3IpO1xuICAgICAgICAvL31cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFjdGl2ZUZpbHRlcnNNZXNzYWdlKG4pIHtcbiAgICB2YXIgcmVzdWx0O1xuXG4gICAgc3dpdGNoIChuKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIHJlc3VsdCA9ICdUaGVyZSBhcmUgbm8gYWN0aXZlIGNvbHVtbiBmaWx0ZXJzLic7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmVzdWx0ID0gJ1RoZXJlIGlzIDEgYWN0aXZlIGNvbHVtbiBmaWx0ZXI6JztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmVzdWx0ID0gJ1RoZXJlIGFyZSAnICsgbiArICcgYWN0aXZlIGNvbHVtbiBmaWx0ZXJzOic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hbmFnZUZpbHRlcnM7XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBbY29udGFpbmluZ0VsPWRvY3VtZW50XVxuICogQHBhcmFtIHtzdHJpbmd9IFtwcmVmaXg9JyddXG4gKiBAcGFyYW0ge3N0cmluZ30gW3NlcGFyYXRvcj0nJ11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbc3VmZml4PScnXVxuICogQHBhcmFtIHtmdW5jdGlvbn0gW3RyYW5zZm9ybWVyPW11bHRpTGluZVRyaW1dIC0gRnVuY3Rpb24gdG8gdHJhbnNmb3JtIGVhY2ggaW5wdXQgY29udHJvbCdzIHRleHQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGNvcHlBbGwoY29udGFpbmluZ0VsLCBwcmVmaXgsIHNlcGFyYXRvciwgc3VmZml4LCB0cmFuc2Zvcm1lcikge1xuICAgIHZhciB0ZXh0cyA9IFtdLCBsYXN0VGV4dEVsLCB0ZXh0O1xuXG4gICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCgoY29udGFpbmluZ0VsIHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKGNvcHlBbGwuc2VsZWN0b3IpLCBmdW5jdGlvbih0ZXh0RWwpIHtcbiAgICAgICAgdGV4dCA9ICh0cmFuc2Zvcm1lciB8fCBtdWx0aUxpbmVUcmltKSh0ZXh0RWwudmFsdWUpO1xuICAgICAgICBpZiAodGV4dCkgeyB0ZXh0cy5wdXNoKHRleHQpOyB9XG4gICAgICAgIGxhc3RUZXh0RWwgPSB0ZXh0RWw7XG4gICAgfSk7XG5cbiAgICBpZiAobGFzdFRleHRFbCkge1xuICAgICAgICBjb3B5KGxhc3RUZXh0RWwsIChwcmVmaXggfHwgJycpICsgdGV4dHMuam9pbihzZXBhcmF0b3IgfHwgJycpICsgKHN1ZmZpeCB8fCAnJykpO1xuICAgIH1cbn1cblxuLyoqXG4gKiAxLiBUcmltIHRoZSB0ZXh0IGluIHRoZSBnaXZlbiBpbnB1dCBlbGVtZW50XG4gKiAyLiBzZWxlY3QgaXRcbiAqIDMuIGNvcHkgaXQgdG8gdGhlIGNsaXBib2FyZFxuICogNC4gZGVzZWxlY3QgaXRcbiAqIDUuIHJldHVybiBpdFxuICogQHBhcmFtIHtIVE1MRWxlbWVudHxIVE1MVGV4dEFyZWFFbGVtZW50fSBlbFxuICogQHBhcmFtIHtzdHJpbmd9IFt0ZXh0PWVsLnZhbHVlXSAtIFRleHQgdG8gY29weS5cbiAqIEByZXR1cm5zIHt1bmRlZmluZWR8c3RyaW5nfSBUcmltbWVkIHRleHQgaW4gZWxlbWVudCBvciB1bmRlZmluZWQgaWYgdW5hYmxlIHRvIGNvcHkuXG4gKi9cbmZ1bmN0aW9uIGNvcHkoZWwsIHRleHQpIHtcbiAgICB2YXIgcmVzdWx0LCB0ZXh0V2FzO1xuXG4gICAgaWYgKHRleHQpIHtcbiAgICAgICAgdGV4dFdhcyA9IGVsLnZhbHVlO1xuICAgICAgICBlbC52YWx1ZSA9IHRleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGV4dCA9IGVsLnZhbHVlO1xuICAgIH1cblxuICAgIGVsLnZhbHVlID0gbXVsdGlMaW5lVHJpbSh0ZXh0KTtcblxuICAgIHRyeSB7XG4gICAgICAgIGVsLnNlbGVjdCgpO1xuICAgICAgICByZXN1bHQgPSBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICBpZiAodGV4dFdhcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbC52YWx1ZSA9IHRleHRXYXM7XG4gICAgICAgIH1cbiAgICAgICAgZWwuYmx1cigpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBtdWx0aUxpbmVUcmltKHMpIHtcbiAgICByZXR1cm4gcy5yZXBsYWNlKC9eXFxzKiguKj8pXFxzKiQvLCAnJDEnKTtcbn1cblxuY29weS5hbGwgPSBjb3B5QWxsO1xuY29weS5tdWx0aUxpbmVUcmltID0gbXVsdGlMaW5lVHJpbTtcbmNvcHkuc2VsZWN0b3JUZXh0Q29udHJvbHMgPSAnaW5wdXQ6bm90KFt0eXBlXSksIGlucHV0W3R5cGU9dGV4dF0sIHRleHRhcmVhJztcblxubW9kdWxlLmV4cG9ydHMgPSBjb3B5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cy5Db2x1bW5QaWNrZXIgPSByZXF1aXJlKCcuL0NvbHVtblBpY2tlcicpO1xubW9kdWxlLmV4cG9ydHMuTWFuYWdlRmlsdGVycyA9IHJlcXVpcmUoJy4vTWFuYWdlRmlsdGVycycpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb3ZlcnJpZGVyID0gcmVxdWlyZSgnb3ZlcnJpZGVyJyk7XG5cbi8qKlxuICogQHBhcmFtIHtIeXBlcmdyaWR9IGdyaWRcbiAqIEBwYXJhbSB7b2JqZWN0fSBbdGFyZ2V0c10gLSBIYXNoIG9mIG1peGluIHRhcmdldHMuIFRoZXNlIGFyZSB0eXBpY2FsbHkgcHJvdG90eXBlIG9iamVjdHMuIElmIG5vdCBnaXZlbiBvciBhbnkgdGFyZ2V0cyBhcmUgbWlzc2luZywgZGVmYXVsdHMgdG8gY3VycmVudCBncmlkJ3MgdmFyaW91cyBwcm90b3R5cGVzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIERpYWxvZ1VJKGdyaWQsIHRhcmdldHMpIHtcbiAgICB0aGlzLmdyaWQgPSBncmlkO1xuICAgIHRhcmdldHMgPSB0YXJnZXRzIHx8IHt9O1xuXG4gICAgdmFyIEh5cGVyZ3JpZCA9IHRoaXMuZ3JpZC5jb25zdHJ1Y3RvcjtcbiAgICBIeXBlcmdyaWQuZGVmYXVsdHMubWl4SW4ocmVxdWlyZSgnLi9taXgtaW5zL2RlZmF1bHRzJykpO1xuXG4gICAgbWl4SW5UbygnSHlwZXJncmlkJywgZ3JpZCwgcmVxdWlyZSgnLi9taXgtaW5zL2dyaWQnKSk7XG4gICAgbWl4SW5UbygnQmVoYXZpb3InLCBncmlkLmJlaGF2aW9yLCByZXF1aXJlKCcuL21peC1pbnMvYmVoYXZpb3InKSk7XG5cbiAgICBncmlkLmFkZEludGVybmFsRXZlbnRMaXN0ZW5lcignZmluLWtleXVwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgY2hhclByZXNzZWQgPSBlLmRldGFpbC5jaGFyO1xuICAgICAgICBncmlkLnByb3BlcnRpZXMuZWRpdG9yQWN0aXZhdGlvbktleXMuZmluZChmdW5jdGlvbihhY3RpdmF0aW9uS2V5KSB7XG4gICAgICAgICAgICB2YXIgaXNBY3RpdmF0aW9uS2V5ID0gY2hhclByZXNzZWQgPT09IGFjdGl2YXRpb25LZXkudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIGlmIChpc0FjdGl2YXRpb25LZXkpIHtcbiAgICAgICAgICAgICAgICBncmlkLnRvZ2dsZURpYWxvZygnQ29sdW1uUGlja2VyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaXNBY3RpdmF0aW9uS2V5O1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIG1peEluVG8odGFyZ2V0LCBpbnN0YW5jZSwgbWl4aW4pIHtcbiAgICAgICAgdmFyIG9iamVjdCA9IHRhcmdldHNbdGFyZ2V0XTtcbiAgICAgICAgdmFyIHByb3RvdHlwZSA9IG9iamVjdCAmJiBvYmplY3QucHJvdG90eXBlIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihpbnN0YW5jZSk7XG5cbiAgICAgICAgb3ZlcnJpZGVyKHByb3RvdHlwZSwgbWl4aW4pO1xuICAgIH1cbn1cblxuRGlhbG9nVUkucHJvdG90eXBlLiQkQ0xBU1NfTkFNRSA9ICdEaWFsb2dVSSc7XG5cbm1vZHVsZS5leHBvcnRzID0gRGlhbG9nVUk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuQ1FMID0gW1xuJzxsaT4nLFxuJ1x0PGxhYmVsIHRpdGxlPVwiJHsxfVwiPicsXG4nXHRcdDxhIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImZpbHRlci1jb3B5XCI+PC9hPicsXG4nXHRcdDxkaXYgY2xhc3M9XCJmaWx0ZXItdHJlZS1yZW1vdmUtYnV0dG9uXCIgdGl0bGU9XCJkZWxldGUgY29uZGl0aW9uYWxcIj48L2Rpdj4nLFxuJ1x0XHQ8c3Ryb25nPiV7MH06PC9zdHJvbmc+JyxcbidcdFx0PGlucHV0IG5hbWU9XCIkezF9XCIgY2xhc3M9XCJmaWx0ZXItdGV4dC1ib3ggJHszfVwiIHZhbHVlPVwiJXsyfVwiPicsXG4nXHQ8L2xhYmVsPicsXG4nXHQ8ZGl2IGNsYXNzPVwiZmlsdGVyLXRyZWUtd2FyblwiPjwvZGl2PicsXG4nPC9saT4nXG5dLmpvaW4oJ1xcbicpO1xuXG5leHBvcnRzLlNRTCA9IFtcbic8bGk+JyxcbidcdDxsYWJlbCB0aXRsZT1cIiR7MX1cIj4nLFxuJ1x0XHQ8YSB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJmaWx0ZXItY29weVwiPjwvYT4nLFxuJ1x0XHQ8ZGl2IGNsYXNzPVwiZmlsdGVyLXRyZWUtcmVtb3ZlLWJ1dHRvblwiIHRpdGxlPVwiZGVsZXRlIGNvbmRpdGlvbmFsXCI+PC9kaXY+JyxcbidcdFx0PHN0cm9uZz4lezB9Ojwvc3Ryb25nPicsXG4nXHRcdDx0ZXh0YXJlYSBuYW1lPVwiJHsxfVwiIHJvd3M9XCIxXCIgY2xhc3M9XCJmaWx0ZXItdGV4dC1ib3ggJHszfVwiPiV7Mn08L3RleHRhcmVhPicsXG4nXHQ8L2xhYmVsPicsXG4nXHQ8ZGl2IGNsYXNzPVwiZmlsdGVyLXRyZWUtd2FyblwiPjwvZGl2PicsXG4nPC9saT4nXG5dLmpvaW4oJ1xcbicpO1xuXG5leHBvcnRzLmRpYWxvZyA9IFtcbic8ZGl2IGlkPVwiaHlwZXJncmlkLWRpYWxvZ1wiPicsXG4nJyxcbidcdDxzdHlsZT4nLFxuJ1x0XHQjaHlwZXJncmlkLWRpYWxvZyB7JyxcbidcdFx0XHRwb3NpdGlvbjogYWJzb2x1dGU7JyxcbidcdFx0XHR0b3A6IDA7JyxcbidcdFx0XHRsZWZ0OiAwOycsXG4nXHRcdFx0Ym90dG9tOiAwOycsXG4nXHRcdFx0cmlnaHQ6IDA7JyxcbidcdFx0XHRiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTsnLFxuJ1x0XHRcdGJhY2tncm91bmQtaW1hZ2U6IHVybChkYXRhOnBuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUg0QUFBQVVDQU1BQUFCOGtubUdBQUFBWFZCTVZFWG40dGZtNGRmbjR0am40OW5vNU5ycDVkenA1TnZtNGRiaTNORGcyczNvNU52bDROVGgyODdrMzlQcDVkdmgzTS9qM2RIazM5VGw0TlhnMjg3azN0UGkzZEhoM05EbTR0ZmozdExoMjgvbzQ5cm80OW5nMnM3bDRkYmw0TmI2VmJFeUFBQUMxRWxFUVZSNEFYVlYwWUtES0F3RTRBQVZLNlN3QzlidC8zL21uWUoydEY3ZXdNRUp5V1JnakhNdWhGVC9uRU1iMjYxaHhicnFoMjNoUm9tWWh4THJZZlhBVFRtNkRUdjA2MHEwdnhoOStiK1NZajNNdWozYzVJT1JBRk1CRXREMHJLZ29BSElKTFdMbGZwSUc4cUFBSWszd2s5dEpLejJFODRHckhVdmJWaExieXZ3MGlBMi82b3RhL1FiYnZ2K1liVWVrYlVWNlIvRGczWVdOK1p5elQvYThYNktwQkxwVzNjdGEyRkNPTEZNa0x1WmU5N1BnRkpNN2pvYUc5YlVIbFZ5WldNNjN0R2xsWnAreXpJd2lwR0ZKUXdKNXJxZ1gyZTcvdzlLcnd1WU1BdEJrZ1RiUzczejByOUpEOUlKeXkyR0pFalNRRDlrSndpSWVUU054eUM5RHoyVmNHaUtUNklIcGxyN1Z5bmJBK1VwVkErYnhRWWkva05Qa25KdFNEbjlDZmViQk5QU3JaZEswcis2SW1FOHA1UnpEbTRzemdGdElRTnFtZTNaa2NCc1AxclJ2SlpCYmZyNmM0TzhRYzA0cGdmSnJZNXJzNGRKNWhoWjB6OXo2K3gwdnlzOE95ajVuS0VNVFA4b0xCdys3T0FoOVRrQ2RKOC81Tm5vNGR0NmQ1MDZkeWJVWWJoVERtRmp0eHd4alR2alZEaElUaUpWTm9lNUx5b0dJUWs0RnRkK1FFY25sWVBGK0tZK0RXYzFXZ1BTcUplWGpYeFBwVDl1WG9CcUd4Nm03anlseXZSdm04aEdBcHVOQXlXaXM5OHJYWXZldlpWU2d1emdmdzhrR2YzYVI0Z2QyRE5VY1FYMXFYSGF2dkxGcnB2NkwvbnQvZCs5UlhWOE9GRENGRUFoSEJ0K3FTcjYvRk4rMzdKVlM3QkM5endPWGo2L0pXMDRKTEI3bTk4NHYvSElpWDc3bTdpSDVrTDExOThvdjhPSTB6aVgwMWIzMkZvOWMzVkh6Y2U5eGRjcytMQzBUZUhQS1JmbXVsT0xjWmZUeVcySUN6NkRyNUZsNEY0MW8xcTFuWWVBdHM2YnVoaWVTeTNlK2txek03UFA4ODVBdGZCMEZKT0NvVVpuVVFTeWxsQVUza21rNGNrQXVScUMyT1hBaDFiM3lsYUJqOUthM1BpZFFReEpjQkV0R3JXUm5jdjJlanJFalZDblNYOXRZT3VCazA3WUk0SjZNWXBwY0JVMHBFZ092RHR2K3hDQ1RydHdMNWw4N3dWTzNPL2c1R1FBQUFBQkpSVTVFcmtKZ2dnPT0pOycsXG4nXHRcdFx0Zm9udDogMTBwdCBzYW5zLXNlcmlmOycsXG4nXHRcdFx0b3BhY2l0eTogMDsnLFxuJ1x0XHRcdHRyYW5zaXRpb246IG9wYWNpdHkgMXM7JyxcbidcdFx0XHRib3gtc2hhZG93OiByZ2JhKDAsIDAsIDAsIDAuMjk4MDM5KSAwcHggMTlweCAzOHB4LCByZ2JhKDAsIDAsIDAsIDAuMjE5NjA4KSAwcHggMTVweCAxMnB4OycsXG4nXHRcdH0nLFxuJ1x0XHQjaHlwZXJncmlkLWRpYWxvZy5oeXBlcmdyaWQtZGlhbG9nLXZpc2libGUgeycsXG4nXHRcdFx0b3BhY2l0eTogMTsnLFxuJ1x0XHRcdHRyYW5zaXRpb246IG9wYWNpdHkgMXM7JyxcbidcdFx0fScsXG4nJyxcbidcdFx0I2h5cGVyZ3JpZC1kaWFsb2cgLmh5cGVyZ3JpZC1kaWFsb2ctY29udHJvbC1wYW5lbCB7JyxcbidcdFx0XHRwb3NpdGlvbjogYWJzb2x1dGU7JyxcbidcdFx0XHR0b3A6IDBweDsnLFxuJ1x0XHRcdHJpZ2h0OiAxMnB4OycsXG4nXHRcdH0nLFxuJ1x0XHQjaHlwZXJncmlkLWRpYWxvZyAuaHlwZXJncmlkLWRpYWxvZy1jb250cm9sLXBhbmVsIGEgeycsXG4nXHRcdFx0Y29sb3I6ICM5OTk7JyxcbidcdFx0XHRmb250LXNpemU6IDMzcHg7JyxcbidcdFx0XHR0cmFuc2l0aW9uOiB0ZXh0LXNoYWRvdyAuMzVzLCBjb2xvciAuMzVzOycsXG4nXHRcdFx0dGV4dC1kZWNvcmF0aW9uOiBub25lOycsXG4nXHRcdH0nLFxuJ1x0XHQjaHlwZXJncmlkLWRpYWxvZyAuaHlwZXJncmlkLWRpYWxvZy1jbG9zZTphZnRlciB7JyxcbidcdFx0XHRjb250ZW50OiBcXCdcXFxcRDdcXCc7JyxcbidcdFx0fScsXG4nXHRcdCNoeXBlcmdyaWQtZGlhbG9nIC5oeXBlcmdyaWQtZGlhbG9nLXNldHRpbmdzOmFmdGVyIHsnLFxuJ1x0XHRcdGZvbnQtZmFtaWx5OiBBcHBsZSBTeW1ib2xzOycsXG4nXHRcdFx0Y29udGVudDogXFwnXFxcXDI2OTlcXCc7JyxcbidcdFx0fScsXG4nXHRcdCNoeXBlcmdyaWQtZGlhbG9nIC5oeXBlcmdyaWQtZGlhbG9nLWNvbnRyb2wtcGFuZWwgYTpob3ZlciB7JyxcbidcdFx0XHRjb2xvcjogYmxhY2s7JyxcbidcdFx0XHR0ZXh0LXNoYWRvdzogMCAwIDZweCAjMzM3YWI3OycsXG4nXHRcdFx0dHJhbnNpdGlvbjogdGV4dC1zaGFkb3cgLjM1cywgY29sb3IgLjM1czsnLFxuJ1x0XHR9JyxcbidcdFx0I2h5cGVyZ3JpZC1kaWFsb2cgLmh5cGVyZ3JpZC1kaWFsb2ctY29udHJvbC1wYW5lbCBhOmFjdGl2ZSB7JyxcbidcdFx0XHRjb2xvcjogI2QwMDsnLFxuJ1x0XHRcdHRyYW5zaXRpb246IGNvbG9yIDBzOycsXG4nXHRcdH0nLFxuJ1x0PC9zdHlsZT4nLFxuJycsXG4nXHQ8c3BhbiBjbGFzcz1cImh5cGVyZ3JpZC1kaWFsb2ctY29udHJvbC1wYW5lbFwiPicsXG4nXHRcdDxhIGNsYXNzPVwiaHlwZXJncmlkLWRpYWxvZy1zZXR0aW5nc1wiIHRpdGxlPVwiKFRoZXJlIGFyZSBubyBzZXR0aW5ncyBmb3IgTWFuYWdlIEZpbHRlcnMgYXQgdGhpcyB0aW1lLilcIj48L2E+JyxcbidcdFx0PGEgY2xhc3M9XCJoeXBlcmdyaWQtZGlhbG9nLWNsb3NlXCI+PC9hPicsXG4nXHQ8L3NwYW4+JyxcbicnLFxuJzwvZGl2Pidcbl0uam9pbignXFxuJyk7XG5cbmV4cG9ydHMuZmlsdGVyVHJlZXMgPSBbXG4nPHN0eWxlPicsXG4nXHQjaHlwZXJncmlkLWRpYWxvZyA+IGRpdiB7JyxcbidcdFx0cG9zaXRpb246IGFic29sdXRlOycsXG4nXHRcdHRvcDogMDsnLFxuJ1x0XHRsZWZ0OiAwOycsXG4nXHRcdGJvdHRvbTogMDsnLFxuJ1x0XHRyaWdodDogMDsnLFxuJ1x0fScsXG4nXHQjaHlwZXJncmlkLWRpYWxvZyA+IGRpdjpmaXJzdC1vZi10eXBlIHsnLFxuJ1x0XHRwYWRkaW5nOiAxZW0gMWVtIDFlbSAwLjVlbTsnLFxuJ1x0XHRtYXJnaW4tbGVmdDogNTAlOycsXG4nXHR9JyxcbidcdCNoeXBlcmdyaWQtZGlhbG9nID4gZGl2Omxhc3Qtb2YtdHlwZSB7JyxcbidcdFx0cGFkZGluZzogMWVtIDAuNWVtIDFlbSAxZW07JyxcbidcdFx0bWFyZ2luLXJpZ2h0OiA1MCU7JyxcbidcdH0nLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgPiBkaXYgPiBwOmZpcnN0LWNoaWxkIHsnLFxuJ1x0XHRtYXJnaW4tdG9wOiAwOycsXG4nXHR9JyxcbidcdCNoeXBlcmdyaWQtZGlhbG9nID4gZGl2ID4gcCA+IHNwYW46Zmlyc3QtY2hpbGQgeycsXG4nXHRcdGZvbnQtc2l6ZTogbGFyZ2VyOycsXG4nXHRcdGxldHRlci1zcGFjaW5nOiAycHg7JyxcbidcdFx0Zm9udC13ZWlnaHQ6IGJvbGQ7JyxcbidcdFx0Y29sb3I6ICM2NjY7JyxcbidcdFx0bWFyZ2luLXJpZ2h0OiAxZW07JyxcbidcdH0nLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgaW5wdXQsICNoeXBlcmdyaWQtZGlhbG9nIHRleHRhcmVhIHsnLFxuJ1x0XHRvdXRsaW5lOiAwOycsXG4nXHRcdGxpbmUtaGVpZ2h0OiBpbml0aWFsOycsXG4nXHR9JyxcbicnLFxuJ1x0LnRhYnogeyB6LWluZGV4OiAwIH0nLFxuJ1x0LnRhYnogPiBwOmZpcnN0LWNoaWxkLCAudGFieiA+IHNlY3Rpb24gPiBwOmZpcnN0LWNoaWxkLCAudGFieiA+IHNlY3Rpb24gPiBkaXYgPiBwOmZpcnN0LWNoaWxkIHsgbWFyZ2luLXRvcDogMCB9JyxcbicnLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgYS5tb3JlLWluZm8geyBmb250LXNpemU6IHNtYWxsZXI7IH0nLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgYS5tb3JlLWluZm86OmFmdGVyIHsgY29udGVudDogXFwnKG1vcmUgaW5mbylcXCc7IH0nLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgYS5tb3JlLWluZm8uaGlkZS1pbmZvIHsgY29sb3I6IHJlZDsgfScsXG4nXHQjaHlwZXJncmlkLWRpYWxvZyBhLm1vcmUtaW5mby5oaWRlLWluZm86OmFmdGVyIHsgY29udGVudDogXFwnKGhpZGUgaW5mbylcXCc7IH0nLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgZGl2Lm1vcmUtaW5mbyB7JyxcbidcdFx0Ym9yZGVyOiAxcHggdGFuIHNvbGlkOycsXG4nXHRcdGJvcmRlci1yYWRpdXM6IDhweDsnLFxuJ1x0XHRwYWRkaW5nOiAwIDhweCAuMmVtOycsXG4nXHRcdGRpc3BsYXk6IG5vbmU7JyxcbidcdFx0YmFja2dyb3VuZC1jb2xvcjogaXZvcnk7JyxcbidcdFx0Ym94LXNoYWRvdzogM3B4IDNweCA1cHggIzcwNzA3MDsnLFxuJ1x0XHRtYXJnaW4tYm90dG9tOiAxZW07JyxcbidcdH0nLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgZGl2Lm1vcmUtaW5mbyA+IHAgeyBtYXJnaW46IC41ZW0gMDsgfScsXG4nJyxcbidcdCNoeXBlcmdyaWQtZGlhbG9nIC50YWJ6IHVsIHsnLFxuJ1x0XHRwYWRkaW5nLWxlZnQ6IDEuNWVtOycsXG4nXHRcdGxpc3Qtc3R5bGUtdHlwZTogY2lyY2xlOycsXG4nXHRcdGZvbnQtd2VpZ2h0OiBib2xkOycsXG4nXHR9JyxcbidcdCNoeXBlcmdyaWQtZGlhbG9nIC50YWJ6IHVsID4gbGkgPiB1bCB7JyxcbidcdFx0bGlzdC1zdHlsZS10eXBlOiBkaXNjOycsXG4nXHRcdGZvbnQtd2VpZ2h0OiBub3JtYWw7JyxcbidcdH0nLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgLnRhYnogbGkgeycsXG4nXHRcdG1hcmdpbjogLjNlbSAwOycsXG4nXHR9JyxcbidcdCNoeXBlcmdyaWQtZGlhbG9nIC50YWJ6IGxpID4gY29kZSB7JyxcbidcdFx0YmFja2dyb3VuZDogI2UwZTBlMDsnLFxuJ1x0XHRtYXJnaW46IDAgLjFlbTsnLFxuJ1x0XHRwYWRkaW5nOiAwIDVweDsnLFxuJ1x0XHRib3JkZXItcmFkaXVzOiA0cHg7JyxcbidcdH0nLFxuJycsXG4nXHQjaHlwZXJncmlkLWRpYWxvZyAudGFieiA+IHNlY3Rpb24uZmlsdGVyLWV4cHJlc3Npb24tc3ludGF4ID4gZGl2Omxhc3QtY2hpbGQgb2wgeycsXG4nXHRcdHBhZGRpbmctbGVmdDogMS42ZW07JyxcbidcdH0nLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgLnRhYnogPiBzZWN0aW9uLmZpbHRlci1leHByZXNzaW9uLXN5bnRheCA+IGRpdjpsYXN0LWNoaWxkIG9sID4gbGkgPiBsYWJlbCB7JyxcbidcdFx0d2lkdGg6IDEwMCU7JyxcbidcdFx0Zm9udC13ZWlnaHQ6IG5vcm1hbDsnLFxuJ1x0XHRkaXNwbGF5OiBpbmxpbmU7JyxcbidcdH0nLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgLnRhYnogLmZpbHRlci10cmVlLXdhcm4geycsXG4nXHRcdGNvbG9yOiBkYXJrcmVkOycsXG4nXHRcdGZvbnQtc2l6ZTogc21hbGxlcjsnLFxuJ1x0XHRmb250LXN0eWxlOiBpdGFsaWM7JyxcbidcdFx0bGluZS1oZWlnaHQ6IGluaXRpYWw7JyxcbidcdH0nLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgLnRhYnogPiBzZWN0aW9uLmZpbHRlci1leHByZXNzaW9uLXN5bnRheCA+IHRleHRhcmVhLCcsXG4nXHQjaHlwZXJncmlkLWRpYWxvZyAudGFieiA+IHNlY3Rpb24uZmlsdGVyLWV4cHJlc3Npb24tc3ludGF4ID4gZGl2Omxhc3QtY2hpbGQgdGV4dGFyZWEsJyxcbidcdCNoeXBlcmdyaWQtZGlhbG9nIC50YWJ6ID4gc2VjdGlvbi5maWx0ZXItZXhwcmVzc2lvbi1zeW50YXggPiBkaXY6bGFzdC1jaGlsZCBpbnB1dCB7JyxcbidcdFx0ZGlzcGxheTogYmxvY2s7JyxcbidcdFx0cG9zaXRpb246IHJlbGF0aXZlOycsXG4nXHRcdG1pbi13aWR0aDogMTAwJTsnLFxuJ1x0XHRtYXgtd2lkdGg6IDEwMCU7JyxcbidcdFx0Ym94LXNpemluZzogYm9yZGVyLWJveDsnLFxuJ1x0XHRib3JkZXI6IDFweCBzb2xpZCBibGFjazsnLFxuJ1x0XHRwYWRkaW5nOiAuNGVtIC43ZW07JyxcbidcdFx0Zm9udC1mYW1pbHk6IG1vbm9zcGFjZTsnLFxuJ1x0XHRmb250LXNpemU6IDlwdDsnLFxuJ1x0XHRtYXJnaW4tdG9wOiAzcHg7JyxcbidcdH0nLFxuJ1x0I2h5cGVyZ3JpZC1kaWFsb2cgLnRhYnogPiBzZWN0aW9uLmZpbHRlci1leHByZXNzaW9uLXN5bnRheCA+IHRleHRhcmVhIHsnLFxuJ1x0XHRoZWlnaHQ6IDk2JTsnLFxuJ1x0fScsXG4nXHQjaHlwZXJncmlkLWRpYWxvZyAudGFieiBhLmZpbHRlci1jb3B5IHsnLFxuJ1x0XHRkaXNwbGF5OiBibG9jazsnLFxuJ1x0XHRmbG9hdDogcmlnaHQ7JyxcbidcdFx0Zm9udC1zaXplOiBzbWFsbGVyOycsXG4nXHR9JyxcbidcdCNoeXBlcmdyaWQtZGlhbG9nIC50YWJ6IGEuZmlsdGVyLWNvcHk6YmVmb3JlIHsnLFxuJ1x0XHRjb250ZW50OiBcXCcoY29weVxcJzsnLFxuJ1x0fScsXG4nXHQjaHlwZXJncmlkLWRpYWxvZyAudGFieiBhLmZpbHRlci1jb3B5OmFmdGVyIHsnLFxuJ1x0XHRjb250ZW50OiBcXCcpXFwnOycsXG4nXHR9JyxcbidcdCNoeXBlcmdyaWQtZGlhbG9nIC50YWJ6IGEuZmlsdGVyLWNvcHk6YWN0aXZlIHsnLFxuJ1x0XHRjb2xvcjogcmVkOycsXG4nXHR9Jyxcbic8L3N0eWxlPicsXG4nJyxcbic8ZGl2PicsXG4nXHQ8c2VsZWN0IGlkPVwiYWRkLWNvbHVtbi1maWx0ZXItc3ViZXhwcmVzc2lvblwiIHN0eWxlPVwiZmxvYXQ6cmlnaHQ7IG1hcmdpbi1sZWZ0OjFlbTsgbWFyZ2luLXJpZ2h0OjRlbTtcIj4nLFxuJ1x0XHQ8b3B0aW9uIHZhbHVlPVwiXCI+TmV3IGNvbHVtbiBmaWx0ZXImaGVsbGlwOzwvb3B0aW9uPicsXG4nXHQ8L3NlbGVjdD4nLFxuJycsXG4nXHQ8cD4nLFxuJ1x0XHQ8c3Bhbj5Db2x1bW4gRmlsdGVyczwvc3Bhbj4nLFxuJ1x0XHQ8YSBjbGFzcz1cIm1vcmUtaW5mb1wiPjwvYT4nLFxuJ1x0PC9wPicsXG4nXHQ8ZGl2IGNsYXNzPVwibW9yZS1pbmZvXCI+JyxcbidcdFx0PHA+VGhlIHRhYmxlIGZpbHRlciBjYW4gYmUgdmlld2VkIGluIHRoZSBRdWVyeSBCdWlsZGVyIG9yIGFzIFNRTCBXSEVSRSBjbGF1c2Ugc3ludGF4LiBCb3RoIGludGVyZmFjZXMgbWFuaXB1bGF0ZSB0aGUgc2FtZSB1bmRlcmx5aW5nIGZpbHRlciBkYXRhIHN0cnVjdHVyZS48L3A+JyxcbidcdFx0PHA+QWxsIGNvbHVtbiBmaWx0ZXJzIGFyZSBBTkQmcnNxdW87ZCB0b2dldGhlci4gRWFjaCBncmlkIHJvdyBpcyBmaXJzdCBxdWFsaWZpZWQgYnkgdGhlIHRhYmxlIGZpbHRlciBhbmQgdGhlbiBzdWNjZXNzaXZlbHkgcXVhbGlmaWVkIGJ5IGVhY2ggY29sdW1uIGZpbHRlciBzdWJleHByZXNzaW9uLjwvcD4nLFxuJ1x0PC9kaXY+JyxcbicnLFxuJ1x0PGRpdiBjbGFzcz1cInRhYnpcIiBpZD1cImNvbHVtbkZpbHRlcnNQYW5lbFwiPicsXG4nJyxcbidcdFx0PGhlYWRlciBpZD1cImNvbHVtbnNRQlwiIGNsYXNzPVwiZGVmYXVsdC10YWJcIj4nLFxuJ1x0XHRcdFF1ZXJ5IEJ1aWxkZXInLFxuJ1x0XHQ8L2hlYWRlcj4nLFxuJycsXG4nXHRcdDxzZWN0aW9uPicsXG4nXHRcdDwvc2VjdGlvbj4nLFxuJycsXG4nXHRcdDxoZWFkZXIgaWQ9XCJjb2x1bW5zU1FMXCIgY2xhc3M9XCJ0YWJ6LWJnMlwiPicsXG4nXHRcdFx0U1FMJyxcbidcdFx0PC9oZWFkZXI+JyxcbicnLFxuJ1x0XHQ8c2VjdGlvbiBjbGFzcz1cImZpbHRlci1leHByZXNzaW9uLXN5bnRheCB0YWJ6LWJnMlwiPicsXG4nXHRcdFx0PGRpdj4nLFxuJ1x0XHRcdFx0PHA+JyxcbidcdFx0XHRcdFx0PHNwYW4+PC9zcGFuPicsXG4nXHRcdFx0XHRcdDxhIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImZpbHRlci1jb3B5XCIgdGl0bGU9XCJUaGUgc3RhdGUgb2YgdGhlIGNvbHVtbiBmaWx0ZXJzIHN1YnRyZWUgZXhwcmVzc2VkIGluIFNRTCBzeW50YXggKGFsbCB0aGUgY29sdW1uIGZpbHRlciBzdWJleHByZXNzaW9ucyBzaG93biBiZWxvdyBBTkQmcnNxdW87ZCB0b2dldGhlcikuXCI+JyxcbidcdFx0XHRcdFx0XHRhbGw8L2E+JyxcbidcdFx0XHRcdDwvcD4nLFxuJ1x0XHRcdFx0PG9sPjwvb2w+JyxcbidcdFx0XHQ8L2Rpdj4nLFxuJ1x0XHQ8L3NlY3Rpb24+JyxcbicnLFxuJ1x0XHQ8aGVhZGVyIGlkPVwiY29sdW1uc0NRTFwiIGNsYXNzPVwidGFiei1iZzFcIj4nLFxuJ1x0XHRcdENRTCcsXG4nXHRcdDwvaGVhZGVyPicsXG4nJyxcbidcdFx0PHNlY3Rpb24gY2xhc3M9XCJmaWx0ZXItZXhwcmVzc2lvbi1zeW50YXggdGFiei1iZzFcIj4nLFxuJ1x0XHRcdDxwPicsXG4nXHRcdFx0XHQ8ZW0+JyxcbidcdFx0XHRcdFx0PHNtYWxsPkNvbHVtbiBmaWx0ZXIgY2VsbHMgYWNjZXB0IGEgc2ltcGxpZmllZCwgY29tcGFjdCwgYW5kIGludHVpdGl2ZSBzeW50YXgsIHdoaWNoIGlzIGhvd2V2ZXIgbm90IGFzIGZsZXhpYmxlIG9yIGNvbmNpc2UgYXMgU1FMIHN5bnRheCBvciB1c2luZyB0aGUgUXVlcnkgQnVpbGRlci48L3NtYWxsPicsXG4nXHRcdFx0XHRcdDxhIGNsYXNzPVwibW9yZS1pbmZvXCI+PC9hPicsXG4nXHRcdFx0XHQ8L2VtPicsXG4nXHRcdFx0PC9wPicsXG4nXHRcdFx0PGRpdiBjbGFzcz1cIm1vcmUtaW5mb1wiPicsXG4nXHRcdFx0XHQ8dWw+JyxcbidcdFx0XHRcdFx0PGxpPicsXG4nXHRcdFx0XHRcdFx0U2ltcGxlIGV4cHJlc3Npb25zJyxcbidcdFx0XHRcdFx0XHQ8dWw+JyxcbidcdFx0XHRcdFx0XHRcdDxsaT5BbGwgc2ltcGxlIGV4cHJlc3Npb25zIHRha2UgdGhlIGZvcm0gPGk+b3BlcmF0b3IgbGl0ZXJhbDwvaT4gb3IgPGk+b3BlcmF0b3IgaWRlbnRpZmllcjwvaT4uIFRoZSAobGVmdCBzaWRlKSBjb2x1bW4gaXMgYWx3YXlzIGltcGxpZWQgYW5kIGlzIHRoZSBzYW1lIGZvciBhbGwgc2ltcGxlIGV4cHJlc3Npb25zIGluIGEgY29tcG91bmQgZXhwcmVzc2lvbi4gVGhpcyBpcyBiZWNhdXNlIGNvbHVtbiBmaWx0ZXJzIGFyZSBhbHdheXMgdGllZCB0byBhIGtub3duIGNvbHVtbi48L2xpPicsXG4nJyxcbidcdFx0XHRcdFx0XHRcdDxsaT5JZiB0aGUgb3BlcmF0b3IgaXMgYW4gZXF1YWxzIHNpZ24gKD0pLCBpdCBtYXkgYmUgb21pdHRlZC48L2xpPicsXG4nJyxcbidcdFx0XHRcdFx0XHRcdDxsaT5CZXNpZGVzIG9wZXJhdG9ycywgbm8gb3RoZXIgcHVuY3R1YXRpb24gaXMgcGVybWl0dGVkLCBtZWFuaW5nIHRoYXQgbm8gcXVvdGF0aW9uIG1hcmtzIGFuZCBubyBwYXJlbnRoZXNlcy48L2xpPicsXG4nJyxcbidcdFx0XHRcdFx0XHRcdDxsaT5JZiBhIGxpdGVyYWwgZXhhY3RseSBtYXRjaGVzIGEgY29sdW1uIG5hbWUgb3IgYWxpYXMsIHRoZSBvcGVyYW5kIGlzIG5vdCB0YWtlbiBsaXRlcmFsbHkgYW5kIGluc3RlYWQgcmVmZXJzIHRvIHRoZSB2YWx1ZSBpbiB0aGF0IGNvbHVtbi4gKFRoZXJlIGFyZSBwcm9wZXJ0aWVzIHRvIGNvbnRyb2wgd2hhdCBjb25zdGl0dXRlcyBzdWNoIGEgbWF0Y2g6IENvbHVtbiBuYW1lLCBhbGlhcywgb3IgZWl0aGVyOyBhbmQgdGhlIGNhc2Utc2Vuc2l0aXZpdHkgb2YgdGhlIG1hdGNoLik8L2xpPicsXG4nJyxcbidcdFx0XHRcdFx0XHRcdDxsaT5BcyBsaXRlcmFscyBhcmUgdW5xdW90ZWQsIGFueSBvcGVyYXRvciBzeW1ib2wgb3Igb3BlcmF0b3Igd29yZCAoaW5jbHVkaW5nIGxvZ2ljYWwgb3BlcmF0b3JzIGZvciBjb21wb3VuZCBleHByZXNzaW9ucykgdGVybWluYXRlcyBhIGxpdGVyYWwuPC9saT4nLFxuJycsXG4nXHRcdFx0XHRcdFx0XHQ8bGk+QW4gaW1wb3J0YW50IGNvcm9sbGFyeSB0byB0aGUgYWJvdmUgZmVhdHVyZXMgaXMgdGhhdCBvcGVyYXRvcnMgbWF5IG5vdCBhcHBlYXIgaW4gbGl0ZXJhbHMuPC9saT4nLFxuJ1x0XHRcdFx0XHRcdDwvdWw+JyxcbidcdFx0XHRcdFx0PC9saT4nLFxuJycsXG4nXHRcdFx0XHRcdDxsaT4nLFxuJ1x0XHRcdFx0XHRcdENvbXBvdW5kIGV4cHJlc3Npb25zJyxcbidcdFx0XHRcdFx0XHQ8dWw+JyxcbidcdFx0XHRcdFx0XHRcdDxsaT5Db21wb3VuZCBleHByZXNzaW9ucyBhcmUgZm9ybWVkIGJ5IGNvbm5lY3Rpbmcgc2ltcGxlIGV4cHJlc3Npb25zIHdpdGggdGhlIGxvZ2ljYWwgb3BlcmF0b3JzIDxjb2RlPkFORDwvY29kZT4sIDxjb2RlPk9SPC9jb2RlPiwgPGNvZGU+Tk9SPC9jb2RlPiwgb3IgPGNvZGU+TkFORDwvY29kZT4gKFwibm90IGFuZFwiKS48L2xpPicsXG4nJyxcbidcdFx0XHRcdFx0XHRcdDxsaT5Ib3dldmVyLCBhbGwgbG9naWNhbCBvcGVyYXRvcnMgdXNlZCBpbiBhIGNvbXBvdW5kIGNvbHVtbiBmaWx0ZXIgZXhwcmVzc2lvbiBtdXN0IGJlIGhvbW9nZW5lb3VzLiBZb3UgbWF5IG5vdCBtaXggdGhlIGFib3ZlIGxvZ2ljYWwgb3BlcmF0b3JzIGluIGEgc2luZ2xlIGNvbHVtbi4gKElmIHlvdSBuZWVkIHRvIGRvIHRoaXMsIGNyZWF0ZSBhIHRhYmxlIGZpbHRlciBleHByZXNzaW9uIGluc3RlYWQuKTwvbGk+JyxcbidcdFx0XHRcdFx0XHQ8L3VsPicsXG4nXHRcdFx0XHRcdDwvbGk+JyxcbicnLFxuJ1x0XHRcdFx0XHQ8bGk+JyxcbidcdFx0XHRcdFx0XHRIaWRkZW4gbG9naWMnLFxuJ1x0XHRcdFx0XHRcdDx1bD4nLFxuJ1x0XHRcdFx0XHRcdFx0PGxpPklmIHRoZSBjb2x1bW4gaXMgYWxzbyByZWZlcmVuY2VkIGluIGEgdGFibGUgZmlsdGVyIGV4cHJlc3Npb24gKG9uIHRoZSBsZWZ0IHNpZGUgb2YgYSBzaW1wbGUgZXhwcmVzc2lvbiksIHRoZSBjb2x1bW4gZmlsdGVyIGlzIGZsYWdnZWQgaW4gaXRzIGdyaWQgY2VsbCB3aXRoIGEgc3BlY2lhbCBzdGFyIGNoYXJhY3Rlci4gVGhpcyBpcyBqdXN0IGEgZmxhZzsgaXQgaXMgbm90IHBhcnQgb2YgdGhlIHN5bnRheC4gPHNwYW4gc3R5bGU9XCJjb2xvcjpyZWQ7IGZvbnQtc3R5bGU6aXRhbGljXCI+Tm90IHlldCBpbXBsZW1lbnRlZC48L3NwYW4+PC9saT4nLFxuJ1x0XHRcdFx0XHRcdDwvdWw+JyxcbidcdFx0XHRcdFx0PC9saT4nLFxuJ1x0XHRcdFx0PC91bD4nLFxuJ1x0XHRcdDwvZGl2PicsXG4nJyxcbidcdFx0XHQ8ZGl2PicsXG4nXHRcdFx0XHQ8cD48c3Bhbj48L3NwYW4+PC9wPicsXG4nXHRcdFx0XHQ8b2w+PC9vbD4nLFxuJ1x0XHRcdDwvZGl2PicsXG4nXHRcdDwvc2VjdGlvbj4nLFxuJ1x0PC9kaXY+Jyxcbic8L2Rpdj4nLFxuJycsXG4nPGRpdj4nLFxuJ1x0PHA+JyxcbidcdFx0PHNwYW4+VGFibGUgRmlsdGVyPC9zcGFuPicsXG4nXHRcdDxhIGNsYXNzPVwibW9yZS1pbmZvXCI+PC9hPicsXG4nXHQ8L3A+JyxcbidcdDxkaXYgY2xhc3M9XCJtb3JlLWluZm9cIj4nLFxuJ1x0XHQ8cD5UaGUgdGFibGUgZmlsdGVyIGNhbiBiZSB2aWV3ZWQgaW4gdGhlIFF1ZXJ5IEJ1aWxkZXIgb3IgYXMgU1FMIFdIRVJFIGNsYXVzZSBzeW50YXguIEJvdGggaW50ZXJmYWNlcyBtYW5pcHVsYXRlIHRoZSBzYW1lIHVuZGVybHlpbmcgZmlsdGVyIGRhdGEgc3RydWN0dXJlLjwvcD4nLFxuJ1x0XHQ8cD4nLFxuJ1x0XHRcdFRoZXNlIGZpbHRlciBzdWJleHByZXNzaW9ucyBhcmUgYm90aCByZXF1aXJlZCAoPGNvZGU+QU5EPC9jb2RlPiZyc3F1bztkIHRvZ2V0aGVyKSwgcmVzdWx0aW5nIGluIGEgc3Vic2V0IG9mIDxlbT5xdWFsaWZpZWQgcm93czwvZW0+IHdoaWNoIGhhdmUgcGFzc2VkIHRocm91Z2ggYm90aCBmaWx0ZXJzLicsXG4nXHRcdFx0SXRcXCdzIGNhbGxlZCBhIDxkZm4+dHJlZTwvZGZuPiBiZWNhdXNlIGl0IGNvbnRhaW5zIGJvdGggPGRmbj5icmFuY2hlczwvZGZuPiBhbmQgPGRmbj5sZWF2ZXM8L2Rmbj4uJyxcbidcdFx0XHRUaGUgbGVhdmVzIHJlcHJlc2VudCA8ZGZuPmNvbmRpdGlvbmFsIGV4cHJlc3Npb25zPC9kZm4+IChvciBzaW1wbHkgPGRmbj5jb25kaXRpb25hbHM8L2Rmbj4pLicsXG4nXHRcdFx0VGhlIGJyYW5jaGVzLCBhbHNvIGtub3duIGFzIDxkZm4+c3VidHJlZXM8L2Rmbj4sIGNvbnRhaW4gbGVhdmVzIGFuZC9vciBvdGhlciBicmFuY2hlcyBhbmQgcmVwcmVzZW50IHN1YmV4cHJlc3Npb25zIHRoYXQgZ3JvdXAgY29uZGl0aW9uYWxzIHRvZ2V0aGVyLicsXG4nXHRcdFx0R3JvdXBlZCBjb25kaXRpb25hbHMgYXJlIGV2YWx1YXRlZCB0b2dldGhlciwgYmVmb3JlIGNvbmRpdGlvbmFscyBvdXRzaWRlIHRoZSBncm91cC4nLFxuJ1x0XHQ8L3A+JyxcbidcdDwvZGl2PicsXG4nJyxcbidcdDxkaXYgY2xhc3M9XCJ0YWJ6XCIgaWQ9XCJ0YWJsZUZpbHRlclBhbmVsXCI+JyxcbidcdFx0PGhlYWRlciBpZD1cInRhYmxlUUJcIj4nLFxuJ1x0XHRcdFF1ZXJ5IEJ1aWxkZXInLFxuJ1x0XHQ8L2hlYWRlcj4nLFxuJycsXG4nXHRcdDxzZWN0aW9uPicsXG4nXHRcdDwvc2VjdGlvbj4nLFxuJycsXG4nXHRcdDxoZWFkZXIgaWQ9XCJ0YWJsZVNRTFwiIGNsYXNzPVwidGFiei1iZzJcIj4nLFxuJ1x0XHRcdFNRTCcsXG4nXHRcdDwvaGVhZGVyPicsXG4nJyxcbidcdFx0PHNlY3Rpb24gY2xhc3M9XCJmaWx0ZXItZXhwcmVzc2lvbi1zeW50YXggdGFiei1iZzJcIj4nLFxuJ1x0XHRcdDxkaXY+JyxcbidcdFx0XHRcdDxwPicsXG4nXHRcdFx0XHRcdFNRTCBXSEVSRSBjbGF1c2Ugc3ludGF4IHdpdGggY2VydGFpbiByZXN0cmljdGlvbnMuJyxcbidcdFx0XHRcdFx0PGEgY2xhc3M9XCJtb3JlLWluZm9cIj48L2E+JyxcbidcdFx0XHRcdDwvcD4nLFxuJ1x0XHRcdFx0PGRpdiBjbGFzcz1cIm1vcmUtaW5mb1wiPicsXG4nXHRcdFx0XHRcdDx1bD4nLFxuJ1x0XHRcdFx0XHRcdDxsaT4nLFxuJ1x0XHRcdFx0XHRcdFx0U2ltcGxlIGV4cHJlc3Npb25zJyxcbidcdFx0XHRcdFx0XHRcdDx1bD4nLFxuJ1x0XHRcdFx0XHRcdFx0XHQ8bGk+QWxsIHNpbXBsZSBleHByZXNzaW9ucyBtdXN0IGJlIG9mIHRoZSBmb3JtIDxpPmNvbHVtbiBvcGVyYXRvciBsaXRlcmFsPC9pPiBvciA8aT5jb2x1bW4gb3BlcmF0b3IgaWRlbnRpZmllcjwvaT4uIFRoYXQgaXMsIHRoZSBsZWZ0IHNpZGUgbXVzdCByZWZlciB0byBhIGNvbHVtbiAobWF5IG5vdCBiZSBhIGxpdGVyYWwpOyB3aGVyZWFzIHRoZSByaWdodCBzaWRlIG1heSBiZSBlaXRoZXIuPC9saT4nLFxuJycsXG4nXHRcdFx0XHRcdFx0XHRcdDxsaT5Db2x1bW4gbmFtZXMgbWF5IGJlIHF1b3RlZCB3aXRoIHRoZSBjdXJyZW50bHkgc2V0IHF1b3RlIGNoYXJhY3RlcnMgKHR5cGljYWxseSBkb3VibGUtcXVvdGVzKS4gSWYgdW5xdW90ZWQsIHRoZXkgbXVzdCBjb25zaXN0IG9mIGNsYXNzaWMgaWRlbnRpZmllciBzeW50YXggKGFscGhhbnVtZXJpY3MgYW5kIHVuZGVyc2NvcmUsIGJ1dCBub3QgYmVnaW5uaW5nIHdpdGggYSBudW1lcmFsKS48L2xpPicsXG4nJyxcbidcdFx0XHRcdFx0XHRcdFx0PGxpPkFsbCBsaXRlcmFscyBtdXN0IGJlIHF1b3RlZCBzdHJpbmdzICh1c2luZyBzaW5nbGUgcXVvdGVzKS4gKEluIGEgZnV0dXJlIHJlbGVhc2Ugd2UgZXhwZWN0IHRvIHN1cHBvcnQgdW5xdW90ZWQgbnVtZXJpYyBzeW50YXggZm9yIGNvbHVtbnMgZXhwbGljaXRseSB0eXBlZCBhcyBudW1lcmljLik8L2xpPicsXG4nXHRcdFx0XHRcdFx0XHQ8L3VsPicsXG4nXHRcdFx0XHRcdFx0PC9saT4nLFxuJycsXG4nXHRcdFx0XHRcdFx0PGxpPicsXG4nXHRcdFx0XHRcdFx0XHRDb21wb3VuZCBleHByZXNzaW9ucycsXG4nXHRcdFx0XHRcdFx0XHQ8dWw+JyxcbidcdFx0XHRcdFx0XHRcdFx0PGxpPkNvbXBvdW5kIGV4cHJlc3Npb25zIGFyZSBmb3JtZWQgYnkgY29ubmVjdGluZyBzaW1wbGUgZXhwcmVzc2lvbnMgd2l0aCB0aGUgbG9naWNhbCBvcGVyYXRvcnMgPGNvZGU+QU5EPC9jb2RlPiBvciA8Y29kZT5PUjwvY29kZT4uPC9saT4nLFxuJycsXG4nXHRcdFx0XHRcdFx0XHRcdDxsaT5Ib3dldmVyLCBhbGwgbG9naWNhbCBvcGVyYXRvcnMgYXQgZWFjaCBsZXZlbCBpbiBhIGNvbXBsZXggZXhwcmVzc2lvbiAoZWFjaCBwYXJlbnRoZXNpemVkIHN1YmV4cHJlc3Npb24pIG11c3QgYmUgaG9tb2dlbmVvdXMsIDxpPmkuZS4sPC9pPiBlaXRoZXIgPGNvZGU+QU5EPC9jb2RlPiBvciA8Y29kZT5PUjwvY29kZT4gYnV0IG5vdCBhIG1peHR1cmUgb2YgdGhlIHR3by4gSW4gb3RoZXIgd29yZHMsIHRoZXJlIGlzIG5vIGltcGxpY2l0IG9wZXJhdG9yIHByZWNlZGVuY2U7IGdyb3VwaW5nIG9mIGV4cHJlc3Npb25zIG11c3QgYWx3YXlzIGJlIGV4cGxpY2l0bHkgc3RhdGVkIHdpdGggcGFyZW50aGVzZXMuPC9saT4nLFxuJycsXG4nXHRcdFx0XHRcdFx0XHRcdDxsaT5UaGUgdW5hcnkgbG9naWNhbCBvcGVyYXRvciA8Y29kZT5OT1Q8L2NvZGU+IGlzIHN1cG9vcnRlZCBiZWZvcmUgcGFyZW50aGVzZXMgb25seS4gV2hpbGUgdGhlIFF1ZXJ5IEJ1aWxkZXIgYW5kIHRoZSBDb2x1bW4gRmlsdGVyIGFsbG93IHRoZXkgc3ludGF4IDxjb2RlPiZoZWxsaXA7IE5PVCA8aT5vcGVyYXRvcjwvaT4gJmhlbGxpcDs8L2NvZGU+ICh3aGVyZSA8Y29kZT48aT5vcGVyYXRvcjwvaT48L2NvZGU+IGlzIDxjb2RlPklOPC9jb2RlPiwgPGNvZGU+TElLRTwvY29kZT4sIDxpPmV0Yy48L2k+KSwgdGhlc2UgbXVzdCBiZSBleHByZXNzZWQgaGVyZSB3aXRoIHBhcmVudGhldGhlczogPGNvZGU+Tk9UICgmaGVsbGlwOyA8aT5vcGVyYXRvcjwvaT4gJmhlbGxpcDspPC9jb2RlPi48L2xpPicsXG4nJyxcbidcdFx0XHRcdFx0XHRcdFx0PGxpPldoaWxlIHRoZSBRdWVyeSBCdWlsZGVyIGFuZCBDb2x1bW4gRmlsdGVyIHN5bnRheCBzdXBwb3J0IHRoZSBwc2V1ZG8tb3BlcmF0b3JzIDxjb2RlPk5PUjwvY29kZT4gYW5kIDxjb2RlPk5BTkQ8L2NvZGU+LCBpbiBTUUwgdGhlc2UgbXVzdCBiZSBleHByZXNzZWQgYXMgPGNvZGU+Tk9UICgmaGVsbGlwOyBPUiAmaGVsbGlwOyk8L2NvZGU+IGFuZCA8Y29kZT5OT1QgKCZoZWxsaXA7IEFORCAmaGVsbGlwOyk8L2NvZGU+LCByZXNwZWN0aXZlbHkuPC9saT4nLFxuJycsXG4nXHRcdFx0XHRcdFx0XHRcdDxsaT5UaGUgUXVlcnkgQnVpbGRlciBhbmQgQ29sdW1uIEZpbHRlciBzeW50YXggYWxzbyBzdXBwb3J0IHRoZSBwc2V1ZG8tb3BlcmF0b3JzIDxjb2RlPkJFR0lOUyBhYmM8L2NvZGU+LCA8Y29kZT5FTkRTIHh5ejwvY29kZT4sIGFuZCA8Y29kZT5DT05UQUlOUyBkZWY8L2NvZGU+LiBUaGVzZSBhcmUgZXhwcmVzc2VkIGluIFNRTCBieSA8Y29kZT5MSUtFIFxcJ2FiYyVcXCc8L2NvZGU+LCA8Y29kZT5MSUtFIFxcJyV4eXpcXCc8L2NvZGU+LCBhbmQgPGNvZGU+TElLRSBcXCclZGVmJVxcJzwvY29kZT4sIHJlc3BlY3RpdmVseS48L2xpPicsXG4nXHRcdFx0XHRcdFx0XHQ8L3VsPicsXG4nXHRcdFx0XHRcdFx0PC9saT4nLFxuJ1x0XHRcdFx0XHQ8L3VsPicsXG4nXHRcdFx0XHQ8L2Rpdj4nLFxuJ1x0XHRcdDwvZGl2PicsXG4nXHRcdFx0PGRpdiBjbGFzcz1cImZpbHRlci10cmVlLXdhcm5cIj48L2Rpdj4nLFxuJ1x0XHRcdDx0ZXh0YXJlYT48L3RleHRhcmVhPicsXG4nXHRcdDwvc2VjdGlvbj4nLFxuJycsXG4nXHQ8L2Rpdj4nLFxuJzwvZGl2Pidcbl0uam9pbignXFxuJyk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgZGlhbG9ncyA9IHJlcXVpcmUoJy4uL2RpYWxvZ3MnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLyoqXG4gICAgICogQG1lbWJlck9mIEJlaGF2aW9yLnByb3RvdHlwZVxuICAgICAqIEBkZXNjIGRlbGVnYXRlIGhhbmRsaW5nIGRvdWJsZSBjbGljayB0byB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICAgICAqIEBwYXJhbSB7SHlwZXJncmlkfSBncmlkXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gW29wdGlvbnNdIC0gRm9yd2FyZGVkIHRvIGRpYWxvZyBjb25zdHJ1Y3Rvci5cbiAgICAgKi9cbiAgICBvcGVuRGlhbG9nOiBmdW5jdGlvbihkaWFsb2dOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBuZXcgZGlhbG9nc1tkaWFsb2dOYW1lXSh0aGlzLmdyaWQsIG9wdGlvbnMpO1xuICAgIH1cbn07XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5lZGl0b3JBY3RpdmF0aW9uS2V5cyA9IFsnYWx0JywgJ2VzYyddO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ29iamVjdC1pdGVyYXRvcnMnKTsgLy8gZnlpOiBpbnN0YWxscyB0aGUgQXJyYXkucHJvdG90eXBlLmZpbmQgcG9seWZpbGwsIGFzIG5lZWRlZFxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IFN0aWNreSBoYXNoIG9mIGRpYWxvZyBvcHRpb25zIG9iamVjdHMuXG4gICAgICogQGRlc2MgRWFjaCBrZXkgaXMgYSBkaWFsb2cgbmFtZTsgdGhlIHZhbHVlIGlzIHRoZSBvcHRpb25zIG9iamVjdCBmb3IgdGhhdCBkaWFsb2cuXG4gICAgICogVGhlIGRlZmF1bHQgZGlhbG9nIG9wdGlvbnMgb2JqZWN0IGhhcyB0aGUga2V5IGAndW5kZWZpbmVkJ2AsIHdoaWNoIGlzIHVuZGVmaW5lZCBieSBkZWZhdWx0OyBpdCBpcyBzZXQgYnkgY2FsbGluZyBgc2V0RGlhbG9nT3B0aW9uc2Agd2l0aCBubyBgZGlhbG9nTmFtZWAgcGFyYW1ldGVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZGlhbG9nT3B0aW9uczoge30sXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBTZXQgYW5kL29yIHJldHVybiBhIHNwZWNpZmljIGRpYWxvZyBvcHRpb25zIG9iamVjdCAqb3IqIGEgZGVmYXVsdCBkaWFsb2cgb3B0aW9ucyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAZGVzYyBJZiBgb3B0aW9uc2AgZGVmaW5lZDpcbiAgICAgKiAqIElmIGBkaWFsb2dOYW1lYCBkZWZpbmVkOiBTYXZlIHRoZSBzcGVjaWZpYyBkaWFsb2cncyBvcHRpb25zIG9iamVjdC5cbiAgICAgKiAqIElmIGBkaWFsb2dOYW1lYCB1bmRlZmluZWQ6IFNhdmUgdGhlIGRlZmF1bHQgZGlhbG9nIG9wdGlvbnMgb2JqZWN0LlxuICAgICAqXG4gICAgICogSWYgYG9wdGlvbnNgIGlzIF9ub3RfIGRlZmluZWQsIG5vIG5ldyBkaWFsb2cgb3B0aW9ucyBvYmplY3Qgd2lsbCBiZSBzYXZlZDsgYnV0IGEgcHJldmlvdXNseSBzYXZlZCBwcmVzZXQgd2lsbCBiZSByZXR1cm5lZCAoYWZ0ZXIgbWl4aW5nIGluIHRoZSBkZWZhdWx0IHByZXNldCBpZiB0aGVyZSBpcyBvbmUpLlxuICAgICAqXG4gICAgICogVGhlIGRlZmF1bHQgZGlhbG9nIG9wdGlvbnMgb2JqZWN0IGlzIHVzZWQgaW4gdHdvIHdheXM6XG4gICAgICogKiB3aGVuIGEgZGlhbG9nIGhhcyBubyBvcHRpb25zIG9iamVjdFxuICAgICAqICogYXMgYSBtaXgtaW4gYmFzZSB3aGVuIGEgZGlhbG9nIGRvZXMgaGF2ZSBhbiBvcHRpb25zIG9iamVjdFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtkaWFsb2dOYW1lXSBJZiB1bmRlZmluZWQsIGBvcHRpb25zYCBkZWZpbmVzIHRoZSBkZWZhdWx0IGRpYWxvZyBvcHRpb25zIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gSWYgZGVmaW5lZCwgcHJlc2V0IHRoZSBuYW1lZCBkaWFsb2cgb3B0aW9ucyBvYmplY3Qgb3IgdGhlIGRlZmF1bHQgZGlhbG9nIG9wdGlvbnMgb2JqZWN0IGlmIG5hbWUgaXMgdW5kZWZpbmVkLlxuICAgICAqXG4gICAgICogQHJldHVybnMge29iamVjdH0gT25lIG9mOlxuICAgICAqICogV2hlbiBgb3B0aW9uc2AgdW5kZWZpbmVkLCBmaXJzdCBvZjpcbiAgICAgKiAgICogcHJldmlvdXMgcHJlc2V0XG4gICAgICogICAqIGRlZmF1bHQgcHJlc2V0XG4gICAgICogICAqIGVtcHR5IG9iamVjdFxuICAgICAqICogV2hlbiBgb3B0aW9uc2AgZGVmaW5lZCwgZmlyc3Qgb2Y6XG4gICAgICogICAqIG1peC1pbjogZGVmYXVsdCBwcmVzZXQgbWVtYmVycyArIGBvcHRpb25zYCBtZW1iZXJzXG4gICAgICogICAqIGBvcHRpb25zYCB2ZXJiYXRpbSB3aGVuIGRlZmF1bHQgcHJlc2V0IHVuZGVmaW5lZFxuICAgICAqL1xuICAgIHNldERpYWxvZ09wdGlvbnM6IGZ1bmN0aW9uKGRpYWxvZ05hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkaWFsb2dOYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IGRpYWxvZ05hbWU7XG4gICAgICAgICAgICBkaWFsb2dOYW1lID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkZWZhdWx0T3B0aW9ucyA9IHRoaXMuZGlhbG9nT3B0aW9ucy51bmRlZmluZWQ7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IGRpYWxvZ05hbWUgJiYgdGhpcy5kaWFsb2dPcHRpb25zW2RpYWxvZ05hbWVdO1xuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5kaWFsb2dPcHRpb25zW2RpYWxvZ05hbWVdID0gb3B0aW9ucztcbiAgICAgICAgICAgIGlmIChkZWZhdWx0T3B0aW9ucykge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBfKHt9KS5leHRlbmQoZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpOyAvLyBtYWtlIGEgbWl4LWluXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcHRpb25zID0gZGVmYXVsdE9wdGlvbnMgfHwge307XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE9wdGlvbnMgb2JqZWN0cyBhcmUgcmVtZW1iZXJlZCBmb3Igc3Vic2VxdWVudCB1c2UuIEFsdGVybmF0aXZlbHksIHRoZXkgY2FuIGJlIHByZXNldCBieSBjYWxsaW5nIHtAbGluayBIeXBlcmdyaWQjc2V0RGlhbG9nT3B0aW9uc3xzZXREaWFsb2dPcHRpb25zfS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGlhbG9nTmFtZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBJZiBvbWl0dGVkLCB1c2UgdGhlIG9wdGlvbnMgb2JqZWN0IHByZXZpb3VzbHkgZ2l2ZW4gaGVyZSAob3IgdG8ge0BsaW5rIEh5cGVyZ3JpZCNzZXREaWFsb2dPcHRpb25zfHNldERpYWxvZ09wdGlvbnN9KSwgaWYgYW55LiBJbiBhbnkgY2FzZSwgdGhlIHJlc3VsdGFudCBvcHRpb25zIG9iamVjdCwgaWYgYW55LCBpcyBtaXhlZCBpbnRvIHRoZSBkZWZhdWx0IG9wdGlvbnMgb2JqZWN0LCBpZiB0aGVyZSBpcyBvbmUuXG4gICAgICovXG4gICAgb3BlbkRpYWxvZzogZnVuY3Rpb24oZGlhbG9nTmFtZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnN0b3BFZGl0aW5nKCk7XG4gICAgICAgIG9wdGlvbnMgPSB0aGlzLnNldERpYWxvZ09wdGlvbnMoZGlhbG9nTmFtZSwgb3B0aW9ucyk7XG4gICAgICAgIG9wdGlvbnMudGVybWluYXRlID0gZnVuY3Rpb24oKSB7IC8vIHdoZW4gYWJvdXQtdG8tYmUtb3BlbmVkIGRpYWxvZyBpcyBldmVudHVhbGx5IGNsb3NlZFxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZGlhbG9nO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuZGlhbG9nID0gdGhpcy5iZWhhdmlvci5vcGVuRGlhbG9nKGRpYWxvZ05hbWUsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmFsbG93RXZlbnRzKGZhbHNlKTtcbiAgICB9LFxuXG4gICAgLy8gYWx0aG91Z2ggeW91IGNhbiBoYXZlIG11bHRpcGxlIGRpYWxvZ3Mgb3BlbiBhdCB0aGUgc2FtZSB0aW1lLCB0aGUgZm9sbG93aW5nIGVuZm9yY2VzIG9uZSBhdCBhIHRpbWUgKGZvciBub3cpXG4gICAgdG9nZ2xlRGlhbG9nOiBmdW5jdGlvbihuZXdEaWFsb2dOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBkaWFsb2cgPSB0aGlzLmRpYWxvZyxcbiAgICAgICAgICAgIG9sZERpYWxvZ05hbWUgPSBkaWFsb2cgJiYgZGlhbG9nLiQkQ0xBU1NfTkFNRTtcbiAgICAgICAgaWYgKCFkaWFsb2cgfHwgIXRoaXMuZGlhbG9nLmNsb3NlKCkgJiYgb2xkRGlhbG9nTmFtZSAhPT0gbmV3RGlhbG9nTmFtZSkge1xuICAgICAgICAgICAgaWYgKCFkaWFsb2cpIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIG5ldyBkaWFsb2cgbm93XG4gICAgICAgICAgICAgICAgdGhpcy5vcGVuRGlhbG9nKG5ld0RpYWxvZ05hbWUsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBvcGVuIG5ldyBkaWFsb2cgd2hlbiBhbHJlYWR5LW9wZW5lZCBkaWFsb2cgZmluaXNoZXMgY2xvc2luZyBkdWUgdG8gLmNsb3NlRGlhbG9nKCkgYWJvdmVcbiAgICAgICAgICAgICAgICBkaWFsb2cudGVybWluYXRlID0gdGhpcy5vcGVuRGlhbG9nLmJpbmQodGhpcywgbmV3RGlhbG9nTmFtZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5hbGxvd0V2ZW50cyh0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRha2VGb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59O1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqIEBtb2R1bGUgYXV0b21hdCAqL1xuXG52YXIgRU5DT0RFUlMgPSAvJVxceyhcXGQrKVxcfS9nOyAvLyBkb3VibGUgJCQgdG8gZW5jb2RlXG5cbnZhciBSRVBMQUNFUlMgPSAvXFwkXFx7KC4qPylcXH0vZzsgLy8gc2luZ2xlICQgdG8gcmVwbGFjZVxuXG5cbi8qKlxuICogQHN1bW1hcnkgU3RyaW5nIGZvcm1hdHRlci5cbiAqXG4gKiBAZGVzYyBTdHJpbmcgc3Vic3RpdHV0aW9uIGlzIHBlcmZvcm1lZCBvbiBudW1iZXJlZCBfcmVwbGFjZXJfIHBhdHRlcm5zIGxpa2UgYCR7bn1gIG9yIF9lbmNvZGVyXyBwYXR0ZXJucyBsaWtlIGAle259YCB3aGVyZSBuIGlzIHRoZSB6ZXJvLWJhc2VkIGBhcmd1bWVudHNgIGluZGV4LiBTbyBgJHswfWAgd291bGQgYmUgcmVwbGFjZWQgd2l0aCB0aGUgZmlyc3QgYXJndW1lbnQgZm9sbG93aW5nIGB0ZXh0YC5cbiAqXG4gKiBFbmNvZGVycyBhcmUganVzdCBsaWtlIHJlcGxhY2VycyBleGNlcHQgdGhlIGFyZ3VtZW50IGlzIEhUTUwtZW5jb2RlZCBiZWZvcmUgYmVpbmcgdXNlZC5cbiAqXG4gKiBUbyBjaGFuZ2UgdGhlIGZvcm1hdCBwYXR0ZXJucywgYXNzaWduIG5ldyBgUmVnRXhwYCBwYXR0ZXJucyB0byBgYXV0b21hdC5lbmNvZGVyc2AgYW5kIGBhdXRvbWF0LnJlcGxhY2Vyc2AuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8ZnVuY3Rpb259IHRlbXBsYXRlIC0gQSB0ZW1wbGF0ZSB0byBiZSBmb3JtYXR0ZWQgYXMgZGVzY3JpYmVkIGFib3ZlLiBPdmVybG9hZHM6XG4gKiAqIEEgc3RyaW5nIHByaW1pdGl2ZSBjb250YWluaW5nIHRoZSB0ZW1wbGF0ZS5cbiAqICogQSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2l0aCBgdGhpc2AgYXMgdGhlIGNhbGxpbmcgY29udGV4dC4gVGhlIHRlbXBsYXRlIGlzIHRoZSB2YWx1ZSByZXR1cm5lZCBmcm9tIHRoaXMgY2FsbC5cbiAqXG4gKiBAcGFyYW0gey4uLip9IFtyZXBsYWNlbWVudHNdIC0gUmVwbGFjZW1lbnQgdmFsdWVzIGZvciBudW1iZXJlZCBmb3JtYXQgcGF0dGVybnMuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgZm9ybWF0dGVkIHRleHQuXG4gKlxuICogQG1lbWJlck9mIG1vZHVsZTphdXRvbWF0XG4gKi9cbmZ1bmN0aW9uIGF1dG9tYXQodGVtcGxhdGUsIHJlcGxhY2VtZW50cy8qLi4uKi8pIHtcbiAgICB2YXIgaGFzUmVwbGFjZW1lbnRzID0gYXJndW1lbnRzLmxlbmd0aCA+IDE7XG5cbiAgICAvLyBpZiBgdGVtcGxhdGVgIGlzIGEgZnVuY3Rpb24sIGNvbnZlcnQgaXQgdG8gdGV4dFxuICAgIGlmICh0eXBlb2YgdGVtcGxhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5jYWxsKHRoaXMpOyAvLyBub24tdGVtcGxhdGUgZnVuY3Rpb246IGNhbGwgaXQgd2l0aCBjb250ZXh0IGFuZCB1c2UgcmV0dXJuIHZhbHVlXG4gICAgfVxuXG4gICAgaWYgKGhhc1JlcGxhY2VtZW50cykge1xuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5yZXBsYWNlKGF1dG9tYXQucmVwbGFjZXJzUmVnZXgsIGZ1bmN0aW9uKG1hdGNoLCBrZXkpIHtcbiAgICAgICAgICAgIGtleSAtPSAtMTsgLy8gY29udmVydCB0byBudW1iZXIgYW5kIGluY3JlbWVudFxuICAgICAgICAgICAgcmV0dXJuIGFyZ3MubGVuZ3RoID4ga2V5ID8gYXJnc1trZXldIDogJyc7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlbXBsYXRlID0gdGVtcGxhdGUucmVwbGFjZShhdXRvbWF0LmVuY29kZXJzUmVnZXgsIGZ1bmN0aW9uKG1hdGNoLCBrZXkpIHtcbiAgICAgICAgICAgIGtleSAtPSAtMTsgLy8gY29udmVydCB0byBudW1iZXIgYW5kIGluY3JlbWVudFxuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID4ga2V5KSB7XG4gICAgICAgICAgICAgICAgdmFyIGh0bWxFbmNvZGVyTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0RJVicpO1xuICAgICAgICAgICAgICAgIGh0bWxFbmNvZGVyTm9kZS50ZXh0Q29udGVudCA9IGFyZ3Nba2V5XTtcbiAgICAgICAgICAgICAgICByZXR1cm4gaHRtbEVuY29kZXJOb2RlLmlubmVySFRNTDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGVtcGxhdGU7XG59XG5cbi8qKlxuICogQHN1bW1hcnkgUmVwbGFjZSBjb250ZW50cyBvZiBgZWxgIHdpdGggYE5vZGVzYCBnZW5lcmF0ZWQgZnJvbSBmb3JtYXR0ZWQgdGVtcGxhdGUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8ZnVuY3Rpb259IHRlbXBsYXRlIC0gU2VlIGB0ZW1wbGF0ZWAgcGFyYW1ldGVyIG9mIHtAbGluayBhdXRvbWF0fS5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBbZWxdIC0gTm9kZSBpbiB3aGljaCB0byByZXR1cm4gbWFya3VwIGdlbmVyYXRlZCBmcm9tIHRlbXBsYXRlLiBJZiBvbWl0dGVkLCBhIG5ldyBgPGRpdj4uLi48L2Rpdj5gIGVsZW1lbnQgd2lsbCBiZSBjcmVhdGVkIGFuZCByZXR1cm5lZC5cbiAqXG4gKiBAcGFyYW0gey4uLip9IFtyZXBsYWNlbWVudHNdIC0gUmVwbGFjZW1lbnQgdmFsdWVzIGZvciBudW1iZXJlZCBmb3JtYXQgcGF0dGVybnMuXG4gKlxuICogQHJldHVybiB7SFRNTEVsZW1lbnR9IFRoZSBgZWxgIHByb3ZpZGVkIG9yIGEgbmV3IGA8ZGl2Pi4uLjwvZGl2PmAgZWxlbWVudCwgaXRzIGBpbm5lckhUTUxgIHNldCB0byB0aGUgZm9ybWF0dGVkIHRleHQuXG4gKlxuICogQG1lbWJlck9mIG1vZHVsZTphdXRvbWF0XG4gKi9cbmZ1bmN0aW9uIHJlcGxhY2UodGVtcGxhdGUsIGVsLCByZXBsYWNlbWVudHMvKi4uLiovKSB7XG4gICAgdmFyIGVsT21pdHRlZCA9IHR5cGVvZiBlbCAhPT0gJ29iamVjdCcsXG4gICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgaWYgKGVsT21pdHRlZCkge1xuICAgICAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0RJVicpO1xuICAgICAgICBhcmdzLnVuc2hpZnQodGVtcGxhdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFyZ3NbMF0gPSB0ZW1wbGF0ZTtcbiAgICB9XG5cbiAgICBlbC5pbm5lckhUTUwgPSBhdXRvbWF0LmFwcGx5KG51bGwsIGFyZ3MpO1xuXG4gICAgcmV0dXJuIGVsO1xufVxuXG4vKipcbiAqIEBzdW1tYXJ5IEFwcGVuZCBvciBpbnNlcnQgYE5vZGVgcyBnZW5lcmF0ZWQgZnJvbSBmb3JtYXR0ZWQgdGVtcGxhdGUgaW50byBnaXZlbiBgZWxgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfGZ1bmN0aW9ufSB0ZW1wbGF0ZSAtIFNlZSBgdGVtcGxhdGVgIHBhcmFtZXRlciBvZiB7QGxpbmsgYXV0b21hdH0uXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxcbiAqXG4gKiBAcGFyYW0ge05vZGV9IFtyZWZlcmVuY2VOb2RlPW51bGxdIEluc2VydHMgYmVmb3JlIHRoaXMgZWxlbWVudCB3aXRoaW4gYGVsYCBvciBhdCBlbmQgb2YgYGVsYCBpZiBgbnVsbGAuXG4gKlxuICogQHBhcmFtIHsuLi4qfSBbcmVwbGFjZW1lbnRzXSAtIFJlcGxhY2VtZW50IHZhbHVlcyBmb3IgbnVtYmVyZWQgZm9ybWF0IHBhdHRlcm5zLlxuICpcbiAqIEByZXR1cm5zIHtOb2RlW119IEFycmF5IG9mIHRoZSBnZW5lcmF0ZWQgbm9kZXMgKHRoaXMgaXMgYW4gYWN0dWFsIEFycmF5IGluc3RhbmNlOyBub3QgYW4gQXJyYXktbGlrZSBvYmplY3QpLlxuICpcbiAqIEBtZW1iZXJPZiBtb2R1bGU6YXV0b21hdFxuICovXG5mdW5jdGlvbiBhcHBlbmQodGVtcGxhdGUsIGVsLCByZWZlcmVuY2VOb2RlLCByZXBsYWNlbWVudHMvKi4uLiovKSB7XG4gICAgdmFyIHJlcGxhY2VtZW50c1N0YXJ0QXQgPSAzLFxuICAgICAgICByZWZlcmVuY2VOb2RlT21pdHRlZCA9IHR5cGVvZiByZWZlcmVuY2VOb2RlICE9PSAnb2JqZWN0JzsgIC8vIHJlcGxhY2VtZW50cyBhcmUgbmV2ZXIgb2JqZWN0c1xuXG4gICAgaWYgKHJlZmVyZW5jZU5vZGVPbWl0dGVkKSB7XG4gICAgICAgIHJlZmVyZW5jZU5vZGUgPSBudWxsO1xuICAgICAgICByZXBsYWNlbWVudHNTdGFydEF0ID0gMjtcbiAgICB9XG5cbiAgICByZXBsYWNlbWVudHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIHJlcGxhY2VtZW50c1N0YXJ0QXQpO1xuICAgIHZhciByZXN1bHQgPSBbXSxcbiAgICAgICAgZGl2ID0gcmVwbGFjZS5hcHBseShudWxsLCBbdGVtcGxhdGVdLmNvbmNhdChyZXBsYWNlbWVudHMpKTtcblxuICAgIHdoaWxlIChkaXYuY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goZGl2LmZpcnN0Q2hpbGQpO1xuICAgICAgICBlbC5pbnNlcnRCZWZvcmUoZGl2LmZpcnN0Q2hpbGQsIHJlZmVyZW5jZU5vZGUpOyAvLyByZW1vdmVzIGNoaWxkIGZyb20gZGl2XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBVc2UgdGhpcyBjb252ZW5pZW5jZSB3cmFwcGVyIHRvIHJldHVybiB0aGUgZmlyc3QgY2hpbGQgbm9kZSBkZXNjcmliZWQgaW4gYHRlbXBsYXRlYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xmdW5jdGlvbn0gdGVtcGxhdGUgLSBJZiBhIGZ1bmN0aW9uLCBleHRyYWN0IHRlbXBsYXRlIGZyb20gY29tbWVudCB3aXRoaW4uXG4gKlxuICogQHJldHVybnMge0hUTUxFbGVtZW50fSBUaGUgZmlyc3QgYE5vZGVgIGluIHlvdXIgdGVtcGxhdGUuXG4gKlxuICogQG1lbWJlck9mIG1vZHVsZTphdXRvbWF0XG4gKi9cbmZ1bmN0aW9uIGZpcnN0Q2hpbGQodGVtcGxhdGUsIHJlcGxhY2VtZW50cy8qLi4uKi8pIHtcbiAgICByZXR1cm4gcmVwbGFjZS5hcHBseShudWxsLCBhcmd1bWVudHMpLmZpcnN0Q2hpbGQ7XG59XG5cbi8qKlxuICogVXNlIHRoaXMgY29udmVuaWVuY2Ugd3JhcHBlciB0byByZXR1cm4gdGhlIGZpcnN0IGNoaWxkIGVsZW1lbnQgZGVzY3JpYmVkIGluIGB0ZW1wbGF0ZWAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8ZnVuY3Rpb259IHRlbXBsYXRlIC0gSWYgYSBmdW5jdGlvbiwgZXh0cmFjdCB0ZW1wbGF0ZSBmcm9tIGNvbW1lbnQgd2l0aGluLlxuICpcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gVGhlIGZpcnN0IGBIVE1MRWxlbWVudGAgaW4geW91ciB0ZW1wbGF0ZS5cbiAqXG4gKiBAbWVtYmVyT2YgbW9kdWxlOmF1dG9tYXRcbiAqL1xuZnVuY3Rpb24gZmlyc3RFbGVtZW50KHRlbXBsYXRlLCByZXBsYWNlbWVudHMvKi4uLiovKSB7XG4gICAgcmV0dXJuIHJlcGxhY2UuYXBwbHkobnVsbCwgYXJndW1lbnRzKS5maXJzdEVsZW1lbnRDaGlsZDtcbn1cblxuLyoqXG4gKiBAc3VtbWFyeSBGaW5kcyBzdHJpbmcgc3Vic3RpdHV0aW9uIGxleGVtZXMgdGhhdCByZXF1aXJlIEhUTUwgZW5jb2RpbmcuXG4gKiBAZGVzYyBNb2RpZnkgdG8gc3VpdC5cbiAqIEBkZWZhdWx0ICV7bn1cbiAqIEB0eXBlIHtSZWdFeHB9XG4gKiBAbWVtYmVyT2YgbW9kdWxlOmF1dG9tYXRcbiAqL1xuYXV0b21hdC5lbmNvZGVyc1JlZ2V4ID0gRU5DT0RFUlM7XG5cbi8qKlxuICogQHN1bW1hcnkgRmluZHMgc3RyaW5nIHN1YnN0aXR1dGlvbiBsZXhlbWVzLlxuICogQGRlc2MgTW9kaWZ5IHRvIHN1aXQuXG4gKiBAZGVmYXVsdCAke259XG4gKiBAdHlwZSB7UmVnRXhwfVxuICogQG1lbWJlck9mIG1vZHVsZTphdXRvbWF0XG4gKi9cbmF1dG9tYXQucmVwbGFjZXJzUmVnZXggPSBSRVBMQUNFUlM7XG5cbmF1dG9tYXQuZm9ybWF0ID0gYXV0b21hdDsgLy8gaWYgeW91IGZpbmQgdXNpbmcganVzdCBgYXV0b21hdCgpYCBjb25mdXNpbmdcbmF1dG9tYXQucmVwbGFjZSA9IHJlcGxhY2U7XG5hdXRvbWF0LmFwcGVuZCA9IGFwcGVuZDtcbmF1dG9tYXQuZmlyc3RDaGlsZCA9IGZpcnN0Q2hpbGQ7XG5hdXRvbWF0LmZpcnN0RWxlbWVudCA9IGZpcnN0RWxlbWVudDtcblxubW9kdWxlLmV4cG9ydHMgPSBhdXRvbWF0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuLyoqIEBuYW1lc3BhY2UgY3NzSW5qZWN0b3IgKi9cblxuLyoqXG4gKiBAc3VtbWFyeSBJbnNlcnQgYmFzZSBzdHlsZXNoZWV0IGludG8gRE9NXG4gKlxuICogQGRlc2MgQ3JlYXRlcyBhIG5ldyBgPHN0eWxlPi4uLjwvc3R5bGU+YCBlbGVtZW50IGZyb20gdGhlIG5hbWVkIHRleHQgc3RyaW5nKHMpIGFuZCBpbnNlcnRzIGl0IGJ1dCBvbmx5IGlmIGl0IGRvZXMgbm90IGFscmVhZHkgZXhpc3QgaW4gdGhlIHNwZWNpZmllZCBjb250YWluZXIgYXMgcGVyIGByZWZlcmVuY2VFbGVtZW50YC5cbiAqXG4gKiA+IENhdmVhdDogSWYgc3R5bGVzaGVldCBpcyBmb3IgdXNlIGluIGEgc2hhZG93IERPTSwgeW91IG11c3Qgc3BlY2lmeSBhIGxvY2FsIGByZWZlcmVuY2VFbGVtZW50YC5cbiAqXG4gKiBAcmV0dXJucyBBIHJlZmVyZW5jZSB0byB0aGUgbmV3bHkgY3JlYXRlZCBgPHN0eWxlPi4uLjwvc3R5bGU+YCBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBjc3NSdWxlc1xuICogQHBhcmFtIHtzdHJpbmd9IFtJRF1cbiAqIEBwYXJhbSB7dW5kZWZpbmVkfG51bGx8RWxlbWVudHxzdHJpbmd9IFtyZWZlcmVuY2VFbGVtZW50XSAtIENvbnRhaW5lciBmb3IgaW5zZXJ0aW9uLiBPdmVybG9hZHM6XG4gKiAqIGB1bmRlZmluZWRgIHR5cGUgKG9yIG9taXR0ZWQpOiBpbmplY3RzIHN0eWxlc2hlZXQgYXQgdG9wIG9mIGA8aGVhZD4uLi48L2hlYWQ+YCBlbGVtZW50XG4gKiAqIGBudWxsYCB2YWx1ZTogaW5qZWN0cyBzdHlsZXNoZWV0IGF0IGJvdHRvbSBvZiBgPGhlYWQ+Li4uPC9oZWFkPmAgZWxlbWVudFxuICogKiBgRWxlbWVudGAgdHlwZTogaW5qZWN0cyBzdHlsZXNoZWV0IGltbWVkaWF0ZWx5IGJlZm9yZSBnaXZlbiBlbGVtZW50LCB3aGVyZXZlciBpdCBpcyBmb3VuZC5cbiAqICogYHN0cmluZ2AgdHlwZTogaW5qZWN0cyBzdHlsZXNoZWV0IGltbWVkaWF0ZWx5IGJlZm9yZSBnaXZlbiBmaXJzdCBlbGVtZW50IGZvdW5kIHRoYXQgbWF0Y2hlcyB0aGUgZ2l2ZW4gY3NzIHNlbGVjdG9yLlxuICpcbiAqIEBtZW1iZXJPZiBjc3NJbmplY3RvclxuICovXG5mdW5jdGlvbiBjc3NJbmplY3Rvcihjc3NSdWxlcywgSUQsIHJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgICBpZiAodHlwZW9mIHJlZmVyZW5jZUVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJlZmVyZW5jZUVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHJlZmVyZW5jZUVsZW1lbnQpO1xuICAgICAgICBpZiAoIXJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRocm93ICdDYW5ub3QgZmluZCByZWZlcmVuY2UgZWxlbWVudCBmb3IgQ1NTIGluamVjdGlvbi4nO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChyZWZlcmVuY2VFbGVtZW50ICYmICEocmVmZXJlbmNlRWxlbWVudCBpbnN0YW5jZW9mIEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93ICdHaXZlbiB2YWx1ZSBub3QgYSByZWZlcmVuY2UgZWxlbWVudC4nO1xuICAgIH1cblxuICAgIHZhciBjb250YWluZXIgPSByZWZlcmVuY2VFbGVtZW50ICYmIHJlZmVyZW5jZUVsZW1lbnQucGFyZW50Tm9kZSB8fCBkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG5cbiAgICBpZiAoSUQpIHtcbiAgICAgICAgSUQgPSBjc3NJbmplY3Rvci5pZFByZWZpeCArIElEO1xuXG4gICAgICAgIGlmIChjb250YWluZXIucXVlcnlTZWxlY3RvcignIycgKyBJRCkpIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gc3R5bGVzaGVldCBhbHJlYWR5IGluIERPTVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcbiAgICBpZiAoSUQpIHtcbiAgICAgICAgc3R5bGUuaWQgPSBJRDtcbiAgICB9XG4gICAgaWYgKGNzc1J1bGVzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgY3NzUnVsZXMgPSBjc3NSdWxlcy5qb2luKCdcXG4nKTtcbiAgICB9XG4gICAgY3NzUnVsZXMgPSAnXFxuJyArIGNzc1J1bGVzICsgJ1xcbic7XG4gICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzUnVsZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzUnVsZXMpKTtcbiAgICB9XG5cbiAgICBpZiAocmVmZXJlbmNlRWxlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlZmVyZW5jZUVsZW1lbnQgPSBjb250YWluZXIuZmlyc3RDaGlsZDtcbiAgICB9XG5cbiAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKHN0eWxlLCByZWZlcmVuY2VFbGVtZW50KTtcblxuICAgIHJldHVybiBzdHlsZTtcbn1cblxuLyoqXG4gKiBAc3VtbWFyeSBPcHRpb25hbCBwcmVmaXggZm9yIGA8c3R5bGU+YCB0YWcgSURzLlxuICogQGRlc2MgRGVmYXVsdHMgdG8gYCdpbmplY3RlZC1zdHlsZXNoZWV0LSdgLlxuICogQHR5cGUge3N0cmluZ31cbiAqIEBtZW1iZXJPZiBjc3NJbmplY3RvclxuICovXG5jc3NJbmplY3Rvci5pZFByZWZpeCA9ICdpbmplY3RlZC1zdHlsZXNoZWV0LSc7XG5cbi8vIEludGVyZmFjZVxubW9kdWxlLmV4cG9ydHMgPSBjc3NJbmplY3RvcjtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBhdXRvbWF0ID0gcmVxdWlyZSgnYXV0b21hdCcpO1xuXG4vKipcbiAqIEBzdW1tYXJ5IEluamVjdHMgdGhlIG5hbWVkIHN0eWxlc2hlZXQgaW50byBgPGhlYWQ+YC5cbiAqIEBkZXNjIFN0eWxlc2hlZXRzIGFyZSBpbnNlcnRlZCBjb25zZWN1dGl2ZWx5IGF0IGVuZCBvZiBgPGhlYWQ+YCB1bmxlc3MgYGJlZm9yZSA9PT0gdHJ1ZWAgKG9yIG9taXR0ZWQgYW5kIGBpbmplY3RTdHlsZXNoZWV0VGVtcGxhdGUuYmVmb3JlYCB0cnV0aHkpIGluIHdoaWNoIGNhc2UgdGhleSBhcmUgaW5zZXJ0ZWQgY29uc2VjdXRpdmVseSBiZWZvcmUgZmlyc3Qgc3R5bGVzaGVldCBmb3VuZCBpbiBgPGhlYWQ+YCAoaWYgYW55KSBhdCBsb2FkIHRpbWUuXG4gKlxuICogVGhlIGNhbGxpbmcgY29udGV4dCAoYHRoaXNgKSBpcyBhIHN0eWxlc2hlZXQgcmVnaXN0cnkuXG4gKiBJZiBgdGhpc2AgaXMgdW5kZWZpbmVkLCB0aGUgZ2xvYmFsIHN0eWxlc2hlZXQgcmVnaXN0cnkgKGNzcy9pbmRleC5qcykgaXMgdXNlZC5cbiAqIEB0aGlzIHtvYmplY3R9XG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtiZWZvcmU9aW5qZWN0U3R5bGVzaGVldFRlbXBsYXRlLmJlZm9yZV0gLSBBZGQgc3R5bGVzaGVldCBiZWZvcmUgaW50aWFsbHkgbG9hZGVkIHN0eWxlc2hlZXRzLlxuICpcbiAqIF9JZiBvbWl0dGVkOl9cbiAqIDEuIGBpZGAgaXMgcHJvbW90ZWQgdG8gZmlyc3QgYXJndW1lbnQgcG9zaXRpb25cbiAqIDIuIGBpbmplY3RTdHlsZXNoZWV0VGVtcGxhdGUuYmVmb3JlYCBpcyBgdHJ1ZWAgYnkgZGVmYXVsdFxuICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gVGhlIG5hbWUgb2YgdGhlIHN0eWxlIHNoZWV0IGluIGB0aGlzYCwgYSBzdHlsZXNoZWV0IFwicmVnaXN0cnlcIiAoaGFzaCBvZiBzdHlsZXNoZWV0cykuXG4gKiBAcmV0dXJucyB7RWxlbWVudHwqfVxuICovXG5mdW5jdGlvbiBpbmplY3RTdHlsZXNoZWV0VGVtcGxhdGUoYmVmb3JlLCBpZCkge1xuICAgIHZhciBvcHRpb25hbEFyZ3NTdGFydEF0LCBzdHlsZXNoZWV0LCBoZWFkLCByZWZOb2RlLCBjc3MsIGFyZ3MsXG4gICAgICAgIHByZWZpeCA9IGluamVjdFN0eWxlc2hlZXRUZW1wbGF0ZS5wcmVmaXg7XG5cbiAgICBpZiAodHlwZW9mIGJlZm9yZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIG9wdGlvbmFsQXJnc1N0YXJ0QXQgPSAyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlkID0gYmVmb3JlO1xuICAgICAgICBiZWZvcmUgPSBpbmplY3RTdHlsZXNoZWV0VGVtcGxhdGUuYmVmb3JlO1xuICAgICAgICBvcHRpb25hbEFyZ3NTdGFydEF0ID0gMTtcbiAgICB9XG5cbiAgICBzdHlsZXNoZWV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocHJlZml4ICsgaWQpO1xuXG4gICAgaWYgKCFzdHlsZXNoZWV0KSB7XG4gICAgICAgIGhlYWQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdoZWFkJyk7XG5cbiAgICAgICAgaWYgKGJlZm9yZSkge1xuICAgICAgICAgICAgLy8gbm90ZSBwb3NpdGlvbiBvZiBmaXJzdCBzdHlsZXNoZWV0XG4gICAgICAgICAgICByZWZOb2RlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaGVhZC5jaGlsZHJlbikuZmluZChmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICAgICAgICAgIHZhciBpZCA9IGNoaWxkLmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGQudGFnTmFtZSA9PT0gJ1NUWUxFJyAmJiAoIWlkIHx8IGlkLmluZGV4T2YocHJlZml4KSAhPT0gcHJlZml4KSB8fFxuICAgICAgICAgICAgICAgICAgICBjaGlsZC50YWdOYW1lID09PSAnTElOSycgJiYgY2hpbGQuZ2V0QXR0cmlidXRlKCdyZWwnKSA9PT0gJ3N0eWxlc2hlZXQnO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjc3MgPSB0aGlzW2lkXTtcblxuICAgICAgICBpZiAoIWNzcykge1xuICAgICAgICAgICAgdGhyb3cgJ0V4cGVjdGVkIHRvIGZpbmQgbWVtYmVyIGAnICsgaWQgKyAnYCBpbiBjYWxsaW5nIGNvbnRleHQuJztcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ3MgPSBbXG4gICAgICAgICAgICAnPHN0eWxlPlxcbicgKyBjc3MgKyAnXFxuPC9zdHlsZT5cXG4nLFxuICAgICAgICAgICAgaGVhZCxcbiAgICAgICAgICAgIHJlZk5vZGUgfHwgbnVsbCAvLyBleHBsaWNpdGx5IG51bGwgcGVyIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlL2luc2VydEJlZm9yZVxuICAgICAgICBdO1xuXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgYXJncyA9IGFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgb3B0aW9uYWxBcmdzU3RhcnRBdCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3R5bGVzaGVldCA9IGF1dG9tYXQuYXBwZW5kLmFwcGx5KG51bGwsIGFyZ3MpWzBdO1xuICAgICAgICBzdHlsZXNoZWV0LmlkID0gcHJlZml4ICsgaWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0eWxlc2hlZXQ7XG59XG5cbmluamVjdFN0eWxlc2hlZXRUZW1wbGF0ZS5iZWZvcmUgPSB0cnVlO1xuaW5qZWN0U3R5bGVzaGVldFRlbXBsYXRlLnByZWZpeCA9ICdpbmplY3RlZC1zdHlsZXNoZWV0LSc7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5qZWN0U3R5bGVzaGVldFRlbXBsYXRlO1xuIiwiLy8gbGlzdC1kcmFnb24gbm9kZSBtb2R1bGVcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvbGlzdC1kcmFnb25cblxuLyogZXNsaW50LWVudiBub2RlLCBicm93c2VyICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGNzc0luamVjdG9yID0gcmVxdWlyZSgnY3NzLWluamVjdG9yJyk7XG52YXIgZm9ybWF0ID0gcmVxdWlyZSgndGVtcGxleCcpO1xuXG52YXIgUkVWRVJUX1RPX1NUWUxFU0hFRVRfVkFMVUUgPSBudWxsOyAgLy8gbnVsbCByZW1vdmVzIHRoZSBzdHlsZVxuXG52YXIgdHJhbnNmb3JtLCB0aW1lciwgc2Nyb2xsVmVsb2NpdHksIGNzc0xpc3REcmFnb247XG5cbi8qIGluamVjdDpjc3MgKi9cbmNzc0xpc3REcmFnb24gPSAnZGl2LmRyYWdvbi1saXN0e3Bvc2l0aW9uOnJlbGF0aXZlO2JhY2tncm91bmQtY29sb3I6I2ZmZn1kaXYuZHJhZ29uLWxpc3Q+ZGl2LGRpdi5kcmFnb24tbGlzdD51bHtwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjA7cmlnaHQ6MH1kaXYuZHJhZ29uLWxpc3Q+ZGl2e3RleHQtYWxpZ246Y2VudGVyO2JhY2tncm91bmQtY29sb3I6IzAwNzk2Yjtjb2xvcjojZmZmO2JveC1zaGFkb3c6MCAzcHggNnB4IHJnYmEoMCwwLDAsLjE2KSwwIDNweCA2cHggcmdiYSgwLDAsMCwuMjMpO292ZXJmbG93OmhpZGRlbjt3aGl0ZS1zcGFjZTpub3dyYXB9ZGl2LmRyYWdvbi1saXN0PnVse292ZXJmbG93LXk6YXV0bztib3R0b206MDttYXJnaW46MDtwYWRkaW5nOjA7Ym94LXNoYWRvdzowIDFweCAzcHggcmdiYSgwLDAsMCwuMTIpLDAgMXB4IDJweCByZ2JhKDAsMCwwLC4yNCl9ZGl2LmRyYWdvbi1saXN0PnVsPmxpLGxpLmRyYWdvbi1wb3B7d2hpdGUtc3BhY2U6bm93cmFwO2xpc3Qtc3R5bGUtdHlwZTpub25lO2JvcmRlcjowIHNvbGlkICNmNGY0ZjQ7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2UwZTBlMDtjdXJzb3I6bW92ZTt0cmFuc2l0aW9uOmJvcmRlci10b3Atd2lkdGggLjJzfWRpdi5kcmFnb24tbGlzdD51bD5saTpsYXN0LWNoaWxke2hlaWdodDowO2JvcmRlci1ib3R0b206bm9uZX1saS5kcmFnb24tcG9we3Bvc2l0aW9uOmZpeGVkO2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXI6MXB4IHNvbGlkICNlMGUwZTA7bGVmdDowO3RvcDowO292ZXJmbG93LXg6aGlkZGVuO2JveC1zaGFkb3c6cmdiYSgwLDAsMCwuMTg4MjM1KSAwIDEwcHggMjBweCxyZ2JhKDAsMCwwLC4yMjc0NTEpIDAgNnB4IDZweH0nO1xuLyogZW5kaW5qZWN0ICovXG5cbi8qKlxuICogQGNvbnN0cnVjdG9yIExpc3REcmFnb25cbiAqXG4gKiBAZGVzYyBUaGlzIG9iamVjdCBzZXJ2aWNlcyBhIHNldCBvZiBpdGVtIGxpc3RzIHRoYXQgYWxsb3cgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nIGl0ZW1zIHdpdGhpbiBhbmQgYmV0d2VlbiBsaXN0cyBpbiBhIHNldC5cbiAqXG4gKiBUd28gc3RyYXRlZ2llcyBhcmUgc3VwcG9ydGVkOlxuICpcbiAqIDEuIFN1cHBseSB5b3VyIG93biBIVE1MIG1hcmt1cCBhbmQgbGV0IHRoZSBBUEkgYnVpbGQgdGhlIGl0ZW0gbW9kZWxzIGZvciB5b3UuXG4gKiAgICBUbyB1c2UgdGhpcyBzdHJhdGVneSwgc2NyaXB0IHlvdXIgSFRNTCBhbmQgcHJvdmlkZSBvbmUgb2YgdGhlc2U6XG4gKiAgICAqIGFuIGFycmF5IG9mIGFsbCB0aGUgbGlzdCBpdGVtIChgPGxpPmApIHRhZ3NcbiAqICAgICogYSBDU1Mgc2VsZWN0b3IgdGhhdCBwb2ludHMgdG8gYWxsIHRoZSBsaXN0IGl0ZW0gdGFnc1xuICogMi4gU3VwcGx5IHlvdXIgb3duIGl0ZW0gbW9kZWxzIGFuZCBsZXQgdGhlIEFQSSBidWlsZCB0aGUgSFRNTCBtYXJrdXAgZm9yIHlvdS5cbiAqICAgIFRvIHVzZSB0aGlzIHN0cmF0ZWd5LCBwcm92aWRlIGFuIGFycmF5IG9mIG1vZGVsIGxpc3RzLlxuICpcbiAqIFRoZSBuZXcgTGlzdERyYWdvbiBvYmplY3QncyBgbW9kZWxMaXN0c2AgcHJvcGVydHkgcmVmZXJlbmNlcyB0aGUgYXJyYXkgb2YgbW9kZWwgbGlzdHMgdGhlIEFQSSBjb25zdHJ1Y3RlZCBmb3IgeW91IGluIHN0cmF0ZWd5ICMxIG9yIHRoZSBhcnJheSBvZiBtb2RlbCBsaXN0cyB5b3Ugc3VwcGxpZWQgZm9yIHN0cmF0ZWd5ICMyLlxuICpcbiAqIEFmdGVyIHRoZSB1c2VyIHBlcmZvcm1zIGEgc3VjY2Vzc2Z1bCBkcmFnLWFuZC1kcm9wIG9wZXJhdGlvbiwgdGhlIHBvc2l0aW9uIG9mIHRoZSBtb2RlbCByZWZlcmVuY2VzIHdpdGhpbiB0aGUgYG1vZGVsTGlzdHNgIGFycmF5IGlzIHJlYXJyYW5nZWQuIChUaGUgbW9kZWxzIHRoZW1zZWx2ZXMgYXJlIHRoZSBvcmlnaW5hbCBvYmplY3RzIGFzIHN1cHBsaWVkIGluIHRoZSBtb2RlbCBsaXN0czsgdGhleSBhcmUgbm90IHJlYnVpbHQgb3IgYWx0ZXJlZCBpbiBhbnkgd2F5LiBKdXN0IHRoZSByZWZlcmVuY2VzIHRvIHRoZW0gYXJlIG1vdmVkIGFyb3VuZC4pXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudFtdfG1vZGVsTGlzdFR5cGVbXX0gc2VsZWN0b3JPck1vZGVsTGlzdHMgLSBZb3UgbXVzdCBzdXBwbHkgb25lIG9mIHRoZSBpdGVtcyBpbiAqKmJvbGQqKiBiZWxvdzpcbiAqXG4gKiAxLiBfRm9yIHN0cmF0ZWd5ICMxIGFib3ZlIChBUEkgY3JlYXRlcyBtb2RlbHMgZnJvbSBzdXBwbGllZCBlbGVtZW50cyk6XyBBbGwgdGhlIGxpc3QgaXRlbSAoYDxsaT5gKSBET00gZWxlbWVudHMgb2YgYWxsIHRoZSBsaXN0cyB5b3Ugd2FudCB0aGUgbmV3IG9iamVjdCB0byBtYW5hZ2UsIGFzIGVpdGhlcjpcbiAqICAgIDEuICoqQSBDU1Mgc2VsZWN0b3I7KiogX29yX1xuICogICAgMi4gKipBbiBhcnJheSBvZiBET00gZWxlbWVudHMqKlxuICogMi4gX0ZvciBzdHJhdGVneSAjMiBhYm92ZSAoQVBJIGNyZWF0ZXMgZWxlbWVudHMgZnJvbSBzdXBwbGllZCBtb2RlbHMpOl8gKipBbiBhcnJheSBvZiBtb2RlbCBsaXN0cywqKiBlYWNoIG9mIHdoaWNoIGlzIGluIG9uZSBvZiB0aGUgZm9sbG93aW5nIGZvcm1zOlxuICogICAgMS4gQW4gYXJyYXkgb2YgaXRlbSBtb2RlbHMgKHdpdGggdmFyaW91cyBvcHRpb24gcHJvcGVydGllcyBoYW5naW5nIG9mZiBvZiBpdCk7IF9hbmQvb3JfXG4gKiAgICAyLiBBIHtAbGluayBtb2RlbExpc3RUeXBlfSBvYmplY3Qgd2l0aCB0aG9zZSBzYW1lIHZhcmlvdXMgb3B0aW9uIHByb3BlcnRpZXMgaW5jbHVkaW5nIHRoZSByZXF1aXJlZCBgbW9kZWxzYCBwcm9wZXJ0eSBjb250YWluaW5nIHRoYXQgc2FtZSBhcnJheSBvZiBpdGVtIG1vZGVscy5cbiAqXG4gKiBJbiBlaXRoZXIgY2FzZSAoMi4xIG9yIDIuMiksIGVhY2ggZWxlbWVudCBvZiBzdWNoIGFycmF5cyBvZiBpdGVtIG1vZGVscyBtYXkgdGFrZSB0aGUgZm9ybSBvZjpcbiAqICogQSBzdHJpbmcgcHJpbWl0aXZlOyBfb3JfXG4gKiAqIEEge0BsaW5rIGl0ZW1Nb2RlbFR5cGV9IG9iamVjdCB3aXRoIGEgdmFyaW91cyBvcHRpb24gcHJvcGVydGllcyBpbmNsdWRpbmcgdGhlIHJlcXVpcmVkIGBsYWJlbGAgcHJvcGVydHkgY29udGFpbmluZyBhIHN0cmluZyBwcmltaXRpdmUuXG4gKlxuICogUmVnYXJkaW5nIHRoZXNlIHN0cmluZyBwcmltaXRpdmVzLCBlYWNoIGlzIGVpdGhlcjpcbiAqICogQSBzdHJpbmcgdG8gYmUgZGlzcGxheWVkIGluIHRoZSBsaXN0IGl0ZW07IF9vcl9cbiAqICogQSBmb3JtYXQgc3RyaW5nIHdpdGggb3RoZXIgcHJvcGVydHkgdmFsdWVzIG1lcmdlZCBpbiwgdGhlIHJlc3VsdCBvZiB3aGljaCBpcyB0byBiZSBkaXNwbGF5ZWQgaW4gdGhlIGxpc3QgaXRlbS5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnM9e31dIC0gWW91IG1heSBzdXBwbHkgXCJnbG9iYWxcIiB0ZW1wbGF0ZSB2YXJpYWJsZXMgaGVyZSwgcmVwcmVzZW50aW5nIHRoZSBcIm91dGVyIHNjb3BlLFwiIGFmdGVyIGZpcnN0IHNlYXJjaGluZyBlYWNoIG1vZGVsIGFuZCB0aGVuIGVhY2ggbW9kZWwgbGlzdC5cbiAqIEBwYXJhbSB7dW5kZWZpbmVkfG51bGx8RWxlbWVudHxzdHJpbmd9IFtjc3NTdHlsZXNoZWV0UmVmZXJlbmNlRWxlbWVudF0gLSBEZXRlcm1pbmVzIHdoZXJlIHRvIGluc2VydCB0aGUgc3R5bGVzaGVldC4gKFRoaXMgaXMgdGhlIG9ubHkgZm9ybWFsIG9wdGlvbi4pIFBhc3NlZCB0byBjc3MtaW5qZWN0b3IsIHRoZSBvdmVybG9hZHMgYXJlIChmcm9tIGNzcy1pbmplY3RvciBkb2NzKTpcbiAqICogYHVuZGVmaW5lZGAgdHlwZSAob3Igb21pdHRlZCk6IGluamVjdHMgc3R5bGVzaGVldCBhdCB0b3Agb2YgYDxoZWFkPi4uLjwvaGVhZD5gIGVsZW1lbnRcbiAqICogYG51bGxgIHZhbHVlOiBpbmplY3RzIHN0eWxlc2hlZXQgYXQgYm90dG9tIG9mIGA8aGVhZD4uLi48L2hlYWQ+YCBlbGVtZW50XG4gKiAqIGBFbGVtZW50YCB0eXBlOiBpbmplY3RzIHN0eWxlc2hlZXQgaW1tZWRpYXRlbHkgYmVmb3JlIGdpdmVuIGVsZW1lbnQsIHdoZXJldmVyIGl0IGlzIGZvdW5kLlxuICogKiBgc3RyaW5nYCB0eXBlOiBpbmplY3RzIHN0eWxlc2hlZXQgaW1tZWRpYXRlbHkgYmVmb3JlIGdpdmVuIGZpcnN0IGVsZW1lbnQgZm91bmQgdGhhdCBtYXRjaGVzIHRoZSBnaXZlbiBjc3Mgc2VsZWN0b3IuXG4gKi9cbmZ1bmN0aW9uIExpc3REcmFnb24oc2VsZWN0b3JPck1vZGVsTGlzdHMsIG9wdGlvbnMpIHtcblxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBMaXN0RHJhZ29uKSkge1xuICAgICAgICB0aHJvdyBlcnJvcignTm90IGNhbGxlZCB3aXRoIFwibmV3XCIga2V5d29yZC4nKTtcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXMsIG1vZGVsTGlzdHMsIGl0ZW1zO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAodHlwZW9mIHNlbGVjdG9yT3JNb2RlbExpc3RzID09PSAnc3RyaW5nJykge1xuICAgICAgICBpdGVtcyA9IHRvQXJyYXkoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvck9yTW9kZWxMaXN0cykpO1xuICAgICAgICBtb2RlbExpc3RzID0gY3JlYXRlTW9kZWxMaXN0c0Zyb21MaXN0RWxlbWVudHMoaXRlbXMpO1xuICAgIH0gZWxzZSBpZiAoc2VsZWN0b3JPck1vZGVsTGlzdHNbMF0gaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgIGl0ZW1zID0gdG9BcnJheShzZWxlY3Rvck9yTW9kZWxMaXN0cyk7XG4gICAgICAgIG1vZGVsTGlzdHMgPSBjcmVhdGVNb2RlbExpc3RzRnJvbUxpc3RFbGVtZW50cyhpdGVtcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gcGFyYW0gaXMgYXJyYXkgb2YgbW9kZWwgbGlzdHNcbiAgICAgICAgLy8gYnVpbGQgbmV3IDx1bD4gZWxlbWVudChzKSBmb3IgZWFjaCBsaXN0IGFuZCBwdXQgaW4gYC5tb2RlbExpc3RzYDtcbiAgICAgICAgLy8gZmlsbCBgLml0ZW1zYCBhcnJheSB3aXRoIDxsaT4gZWxlbWVudHMgZnJvbSB0aGVzZSBuZXcgPHVsPiBlbGVtZW50c1xuICAgICAgICBpdGVtcyA9IFtdO1xuICAgICAgICBtb2RlbExpc3RzID0gY3JlYXRlTGlzdEVsZW1lbnRzRnJvbU1vZGVsTGlzdHMoc2VsZWN0b3JPck1vZGVsTGlzdHMsIG9wdGlvbnMpO1xuICAgICAgICBtb2RlbExpc3RzLmZvckVhY2goZnVuY3Rpb24gKGxpc3QpIHtcbiAgICAgICAgICAgIGl0ZW1zID0gaXRlbXMuY29uY2F0KHRvQXJyYXkobGlzdC5lbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpJykpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gZ3JhYiB3aGVlbCBldmVudHMgYW5kIGRvbid0IGxldCAnZW0gYnViYmxlXG4gICAgbW9kZWxMaXN0cy5mb3JFYWNoKGZ1bmN0aW9uIChtb2RlbExpc3QpIHtcbiAgICAgICAgbW9kZWxMaXN0LmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBjYXB0dXJlRXZlbnQpO1xuICAgIH0pO1xuXG4gICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbUVsZW1lbnQsIGluZGV4KSB7XG4gICAgICAgIHZhciBpdGVtID0gKGl0ZW1FbGVtZW50ICE9PSBpdGVtRWxlbWVudC5wYXJlbnRFbGVtZW50Lmxhc3RFbGVtZW50Q2hpbGQpXG4gICAgICAgICAgICA/IHNlbGYuYWRkRXZ0KGl0ZW1FbGVtZW50LCAnbW91c2Vkb3duJywgaXRlbUVsZW1lbnQsIHRydWUpXG4gICAgICAgICAgICA6IHsgZWxlbWVudDogaXRlbUVsZW1lbnQgfTtcblxuICAgICAgICAvKiBgaXRlbS5tb2RlbGAgbm90IGN1cnJlbnRseSBuZWVkZWQgc28gY29tbWVudGVkIG91dCBoZXJlLlxuICAgICAgICAgKiAoT3JpZ2luYWxseSB1c2VkIGZvciByZWJ1aWxkaW5nIG1vZGVsTGlzdHMgZm9yIGZpbmFsXG4gICAgICAgICAqIHJlcG9ydGluZywgbW9kZWxMaXN0cyBhcmUgbm93IHNwbGljZWQgb24gZXZlcnkgc3VjY2Vzc2Z1bFxuICAgICAgICAgKiBkcmFnLWFuZC1kcm9wIG9wZXJhdGlvbiBzbyB0aGV5J3JlIGFsd2F5cyB1cCB0byBkYXRlLilcblxuICAgICAgICAgdmFyIG9yaWdpbiA9IHRoaXMuaXRlbUNvb3JkaW5hdGVzKGl0ZW1FbGVtZW50KTtcbiAgICAgICAgIGl0ZW0ubW9kZWwgPSB0aGlzLm1vZGVsTGlzdHNbb3JpZ2luLmxpc3RdLm1vZGVsc1tvcmlnaW4uaXRlbV07XG5cbiAgICAgICAgICovXG5cbiAgICAgICAgaXRlbXNbaW5kZXhdID0gaXRlbTtcbiAgICB9KTtcblxuICAgIHRyYW5zZm9ybSA9ICd0cmFuc2Zvcm0nIGluIGl0ZW1zWzBdLmVsZW1lbnQuc3R5bGVcbiAgICAgICAgPyAndHJhbnNmb3JtJyAvLyBDaHJvbWUgNDUgYW5kIEZpcmVmb3ggNDBcbiAgICAgICAgOiAnLXdlYmtpdC10cmFuc2Zvcm0nOyAvLyBTYWZhcmkgOFxuXG4gICAgLy8gc2V0IHVwIHRoZSBuZXcgb2JqZWN0XG4gICAgdGhpcy5tb2RlbExpc3RzID0gbW9kZWxMaXN0cztcbiAgICB0aGlzLml0ZW1zID0gaXRlbXM7XG4gICAgdGhpcy5iaW5kaW5ncyA9IHt9O1xuICAgIHRoaXMuY2FsbGJhY2sgPSB7fTtcblxuICAgIGNzc0luamVjdG9yKGNzc0xpc3REcmFnb24sICdsaXN0LWRyYWdvbi1iYXNlJywgb3B0aW9ucy5jc3NTdHlsZXNoZWV0UmVmZXJlbmNlRWxlbWVudCk7XG5cbn1cblxuTGlzdERyYWdvbi5wcm90b3R5cGUgPSB7XG5cbiAgICBhZGRFdnQ6IGZ1bmN0aW9uICh0YXJnZXQsIHR5cGUsIGxpc3RlbmVyLCBkb05vdEJpbmQpIHtcbiAgICAgICAgdmFyIGJpbmRpbmcgPSB7XG4gICAgICAgICAgICBoYW5kbGVyOiBoYW5kbGVyc1t0eXBlXS5iaW5kKHRhcmdldCwgdGhpcyksXG4gICAgICAgICAgICBlbGVtZW50OiBsaXN0ZW5lciB8fCB3aW5kb3dcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWRvTm90QmluZCkge1xuICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1t0eXBlXSA9IGJpbmRpbmc7XG4gICAgICAgIH1cblxuICAgICAgICBiaW5kaW5nLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBiaW5kaW5nLmhhbmRsZXIpO1xuXG4gICAgICAgIHJldHVybiBiaW5kaW5nO1xuICAgIH0sXG5cbiAgICByZW1vdmVFdnQ6IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgIHZhciBiaW5kaW5nID0gdGhpcy5iaW5kaW5nc1t0eXBlXTtcbiAgICAgICAgZGVsZXRlIHRoaXMuYmluZGluZ3NbdHlwZV07XG4gICAgICAgIGJpbmRpbmcuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGJpbmRpbmcuaGFuZGxlcik7XG4gICAgfSxcblxuICAgIHJlbW92ZUFsbEV2ZW50TGlzdGVuZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIHJlbW92ZSBkcmFnICYgZHJvcCBldmVudHMgKG1vdXNlbW92ZSwgbW91c2V1cCwgYW5kIHRyYW5zaXRpb25lbmQpXG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy5iaW5kaW5ncykge1xuICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSB0aGlzLmJpbmRpbmdzW3R5cGVdO1xuICAgICAgICAgICAgYmluZGluZy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgYmluZGluZy5oYW5kbGVyKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZW1vdmUgdGhlIG1vdXNlZG93biBldmVudHMgZnJvbSBhbGwgbGlzdCBpdGVtc1xuICAgICAgICB0aGlzLml0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIGlmIChpdGVtLmhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBpdGVtLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaXRlbS5oYW5kbGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHdoZWVsIGV2ZW50cyBvbiB0aGUgbGlzdCBlbGVtZW50c1xuICAgICAgICB0aGlzLm1vZGVsTGlzdHMuZm9yRWFjaChmdW5jdGlvbiAobW9kZWxMaXN0KSB7XG4gICAgICAgICAgICBtb2RlbExpc3QuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd3aGVlbCcsIGNhcHR1cmVFdmVudCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBwb2ludEluTGlzdFJlY3RzOiBmdW5jdGlvbiAocG9pbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWxMaXN0cy5maW5kKGZ1bmN0aW9uIChtb2RlbExpc3QpIHtcbiAgICAgICAgICAgIHZhciByZWN0ID0gbW9kZWxMaXN0LmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgICAgIHJlY3QgPSB7XG4gICAgICAgICAgICAgICAgbGVmdDogICB3aW5kb3cuc2Nyb2xsWCArIHJlY3QubGVmdCxcbiAgICAgICAgICAgICAgICB0b3A6ICAgIHdpbmRvdy5zY3JvbGxZICsgcmVjdC50b3AsXG4gICAgICAgICAgICAgICAgcmlnaHQ6ICB3aW5kb3cuc2Nyb2xsWCArIHJlY3QucmlnaHQsXG4gICAgICAgICAgICAgICAgYm90dG9tOiB3aW5kb3cuc2Nyb2xsWSArIHJlY3QuYm90dG9tLFxuICAgICAgICAgICAgICAgIHdpZHRoOiAgcmVjdC53aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHJlY3QuaGVpZ2h0XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBtb2RlbExpc3QucmVjdCA9IHJlY3Q7XG5cbiAgICAgICAgICAgIGlmIChwb2ludEluUmVjdChwb2ludCwgcmVjdCkpIHtcbiAgICAgICAgICAgICAgICBtb2RlbExpc3QucmVjdCA9IHJlY3Q7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIGZvdW5kXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHBvaW50SW5JdGVtUmVjdHM6IGZ1bmN0aW9uIChwb2ludCwgZXhjZXB0MSwgZXhjZXB0Mikge1xuICAgICAgICByZXR1cm4gdGhpcy5pdGVtcy5maW5kKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGl0ZW0uZWxlbWVudDtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgZWxlbWVudCAhPT0gZXhjZXB0MSAmJlxuICAgICAgICAgICAgICAgIGVsZW1lbnQgIT09IGV4Y2VwdDIgJiZcbiAgICAgICAgICAgICAgICBwb2ludEluUmVjdChwb2ludCwgaXRlbS5yZWN0KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIGdldCBwb3NpdGlvbnMgb2YgYWxsIGxpc3QgaXRlbXMgaW4gcGFnZSBjb29yZHMgKG5vcm1hbGl6ZWQgZm9yIHdpbmRvdyBhbmQgbGlzdCBzY3JvbGxpbmcpXG4gICAgZ2V0QWxsSXRlbUJvdW5kaW5nUmVjdHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1vZGVsTGlzdHMgPSB0aGlzLm1vZGVsTGlzdHMsIGhlaWdodDtcbiAgICAgICAgdGhpcy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICB2YXIgaXRlbUVsZW1lbnQgPSBpdGVtLmVsZW1lbnQsXG4gICAgICAgICAgICAgICAgbGlzdEVsZW1lbnQgPSBpdGVtRWxlbWVudC5wYXJlbnRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGxpc3QgPSBtb2RlbExpc3RzLmZpbmQoZnVuY3Rpb24gKGxpc3QpIHsgcmV0dXJuIGxpc3QuZWxlbWVudCA9PT0gbGlzdEVsZW1lbnQ7IH0pO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgLy8gb21pdHRlZDogZGVmYXVsdCB0byB0cnVlXG4gICAgICAgICAgICAgICAgbGlzdC5pc0Ryb3BUYXJnZXQgPT09IHVuZGVmaW5lZCB8fFxuXG4gICAgICAgICAgICAgICAgLy8gZnVuY3Rpb246IHVzZSByZXR1cm4gdmFsdWVcbiAgICAgICAgICAgICAgICB0eXBlb2YgbGlzdC5pc0Ryb3BUYXJnZXQgPT09ICdmdW5jdGlvbicgJiYgbGlzdC5pc0Ryb3BUYXJnZXQoKSB8fFxuXG4gICAgICAgICAgICAgICAgLy8gb3RoZXJ3aXNlOiB1c2UgdHJ1dGhpbmVzcyBvZiBnaXZlbiB2YWx1ZVxuICAgICAgICAgICAgICAgIGxpc3QuaXNEcm9wVGFyZ2V0XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVjdCA9IGl0ZW1FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgICAgICAgICAgICAgICBib3R0b20gPSByZWN0LmJvdHRvbTtcblxuICAgICAgICAgICAgICAgIGlmIChpdGVtRWxlbWVudCA9PT0gbGlzdEVsZW1lbnQubGFzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICBib3R0b20gPSBsaXN0RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5ib3R0b207XG4gICAgICAgICAgICAgICAgICAgIGlmIChib3R0b20gPCByZWN0LnRvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tID0gcmVjdC50b3AgKyAoaGVpZ2h0IHx8IDUwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IHJlY3QuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6ICAgd2luZG93LnNjcm9sbFggKyByZWN0LmxlZnQsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAgd2luZG93LnNjcm9sbFggKyByZWN0LnJpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB0b3A6ICAgIHdpbmRvdy5zY3JvbGxZICsgcmVjdC50b3AgICAgKyBsaXN0RWxlbWVudC5zY3JvbGxUb3AsXG4gICAgICAgICAgICAgICAgICAgIGJvdHRvbTogd2luZG93LnNjcm9sbFkgKyBib3R0b20gKyBsaXN0RWxlbWVudC5zY3JvbGxUb3BcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaXRlbS5yZWN0ID0gcmVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHJlaW5zZXJ0OiBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIHZhciBzdHlsZSA9IHRhcmdldC5zdHlsZTtcbiAgICAgICAgc3R5bGUud2lkdGggPSBzdHlsZVt0cmFuc2Zvcm1dID0gc3R5bGUudHJhbnNpdGlvbiA9IFJFVkVSVF9UT19TVFlMRVNIRUVUX1ZBTFVFO1xuXG4gICAgICAgIHRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnb24tcG9wJyk7XG5cbiAgICAgICAgdGhpcy5kcm9wLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9ICcwcyc7XG4gICAgICAgIHRoaXMuZHJvcC5zdHlsZS5ib3JkZXJUb3BXaWR0aCA9IFJFVkVSVF9UT19TVFlMRVNIRUVUX1ZBTFVFO1xuICAgICAgICB0aGlzLmRyb3AucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUodGFyZ2V0LCB0aGlzLmRyb3ApO1xuXG4gICAgICAgIGRlbGV0ZSB0aGlzLmRyb3A7XG4gICAgfSxcblxuICAgIC8vIHJldHVybiBhbiBvYmplY3QgeyBpdGVtOiA8aXRlbSBpbmRleCB3aXRoaW4gbGlzdD4sIGxpc3Q6IDxsaXN0IGluZGV4IHdpdGhpbiBsaXN0IG9mIGxpc3RzPiB9XG4gICAgaXRlbUNvb3JkaW5hdGVzOiBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICB2YXIgbGlzdEVsZW1lbnQgPSBpdGVtLnBhcmVudEVsZW1lbnQsXG4gICAgICAgICAgICBjb29yZHMgPSB7IGl0ZW06IDAgfTtcblxuICAgICAgICB3aGlsZSAoKGl0ZW0gPSBpdGVtLnByZXZpb3VzRWxlbWVudFNpYmxpbmcpKSB7XG4gICAgICAgICAgICArK2Nvb3Jkcy5pdGVtO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tb2RlbExpc3RzLmZpbmQoZnVuY3Rpb24gKGxpc3QsIGluZGV4KSB7XG4gICAgICAgICAgICBjb29yZHMubGlzdCA9IGluZGV4O1xuICAgICAgICAgICAgcmV0dXJuIGxpc3QuZWxlbWVudCA9PT0gbGlzdEVsZW1lbnQ7IC8vIHN0b3Agd2hlbiB3ZSBmaW5kIHRoZSBvbmUgd2UgYmVsb25nIHRvXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBjb29yZHM7XG4gICAgfVxuXG59O1xuXG52YXIgaGFuZGxlcnMgPSB7XG4gICAgbW91c2Vkb3duOiBmdW5jdGlvbiAoZHJhZ29uLCBldnQpIHtcblxuICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpOyAgLy9wcmV2ZW50cyB1c2VyIHNlbGVjdGlvbiBvZiByZW5kZXJlZCBub2RlcyBkdXJpbmcgZHJhZ1xuXG4gICAgICAgIGlmIChkcmFnb24uZHJvcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlY3QgPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgIGRyYWdvbi5yZWN0ID0gcmVjdCA9IHtcbiAgICAgICAgICAgIGxlZnQ6ICAgTWF0aC5yb3VuZChyZWN0LmxlZnQgLSAxKSxcbiAgICAgICAgICAgIHRvcDogICAgTWF0aC5yb3VuZChyZWN0LnRvcCAtIDEpLFxuICAgICAgICAgICAgcmlnaHQ6ICBNYXRoLnJvdW5kKHJlY3QucmlnaHQpLFxuICAgICAgICAgICAgYm90dG9tOiBNYXRoLnJvdW5kKHJlY3QuYm90dG9tKSxcbiAgICAgICAgICAgIHdpZHRoOiAgTWF0aC5yb3VuZChyZWN0LndpZHRoKSxcbiAgICAgICAgICAgIGhlaWdodDogTWF0aC5yb3VuZChyZWN0LmhlaWdodClcbiAgICAgICAgfTtcblxuICAgICAgICBkcmFnb24ucGluID0ge1xuICAgICAgICAgICAgeDogd2luZG93LnNjcm9sbFggKyBldnQuY2xpZW50WCxcbiAgICAgICAgICAgIHk6IHdpbmRvdy5zY3JvbGxZICsgZXZ0LmNsaWVudFlcbiAgICAgICAgfTtcblxuICAgICAgICBkcmFnb24ub3JpZ2luID0gZHJhZ29uLml0ZW1Db29yZGluYXRlcyh0aGlzKTtcblxuICAgICAgICBpZiAoZHJhZ29uLmNhbGxiYWNrLmdyYWJiZWQpIHtcbiAgICAgICAgICAgIGRyYWdvbi5jYWxsYmFjay5ncmFiYmVkLmNhbGwodGhpcywgZHJhZ29uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRyYWdvbi5nZXRBbGxJdGVtQm91bmRpbmdSZWN0cygpO1xuXG4gICAgICAgIGRyYWdvbi5kcm9wID0gdGhpcy5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgICAgIGRyYWdvbi5kcm9wLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9ICcwcyc7XG4gICAgICAgIGRyYWdvbi5kcm9wLnN0eWxlLmJvcmRlclRvcFdpZHRoID0gcmVjdC5oZWlnaHQgKyAncHgnO1xuXG4gICAgICAgIHRoaXMuc3R5bGUud2lkdGggPSByZWN0LndpZHRoICsgJ3B4JztcbiAgICAgICAgdGhpcy5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAnMHMnO1xuICAgICAgICB0aGlzLnN0eWxlW3RyYW5zZm9ybV0gPSB0cmFuc2xhdGUoXG4gICAgICAgICAgICByZWN0LmxlZnQgLSB3aW5kb3cuc2Nyb2xsWCxcbiAgICAgICAgICAgIHJlY3QudG9wICAtIHdpbmRvdy5zY3JvbGxZXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnZHJhZ29uLXBvcCcpO1xuICAgICAgICB0aGlzLnN0eWxlLnpJbmRleCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRyYWdvbi5tb2RlbExpc3RzWzBdLmNvbnRhaW5lci5wYXJlbnRFbGVtZW50KS56SW5kZXg7XG5cbiAgICAgICAgaWYgKCFkcmFnb24uY29udGFpbmVyKSB7XG4gICAgICAgICAgICAvLyB3YWxrIGJhY2sgdG8gY2xvc2VzdCBzaGFkb3cgcm9vdCBPUiBib2R5IHRhZyBPUiByb290IHRhZ1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXM7XG4gICAgICAgICAgICB3aGlsZSAoY29udGFpbmVyLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXIgPSBjb250YWluZXIucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiBTaGFkb3dSb290ICE9PSAndW5kZWZpbmVkJyAmJiBjb250YWluZXIgaW5zdGFuY2VvZiBTaGFkb3dSb290IHx8XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci50YWdOYW1lID09PSAnQk9EWSdcbiAgICAgICAgICAgICAgICApe1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkcmFnb24uY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICB9XG5cbiAgICAgICAgZHJhZ29uLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzKTtcblxuICAgICAgICByZWN0LmxlZnQgICArPSB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgcmVjdC50b3AgICAgKz0gd2luZG93LnNjcm9sbFk7XG4gICAgICAgIHJlY3QucmlnaHQgICs9IHdpbmRvdy5zY3JvbGxYO1xuICAgICAgICByZWN0LmJvdHRvbSArPSB3aW5kb3cuc2Nyb2xsWTtcblxuICAgICAgICBkcmFnb24uYWRkRXZ0KHRoaXMsICdtb3VzZW1vdmUnKTtcbiAgICAgICAgZHJhZ29uLmFkZEV2dCh0aGlzLCAnbW91c2V1cCcpO1xuICAgIH0sXG5cbiAgICBtb3VzZW1vdmU6IGZ1bmN0aW9uIChkcmFnb24sIGV2dCkge1xuICAgICAgICBkcmFnb24uZHJvcC5zdHlsZS50cmFuc2l0aW9uID0gUkVWRVJUX1RPX1NUWUxFU0hFRVRfVkFMVUU7XG5cbiAgICAgICAgdmFyIGhvdmVyTGlzdCA9IGRyYWdvbi5wb2ludEluTGlzdFJlY3RzKHsgeDogZXZ0LmNsaWVudFgsIHk6IGV2dC5jbGllbnRZIH0pIHx8IGRyYWdvbi5tb3N0UmVjZW50SG92ZXJMaXN0O1xuXG4gICAgICAgIGlmIChob3Zlckxpc3QpIHtcbiAgICAgICAgICAgIHZhciBkeCA9IGV2dC5jbGllbnRYIC0gZHJhZ29uLnBpbi54LFxuICAgICAgICAgICAgICAgIGR5ID0gZXZ0LmNsaWVudFkgLSBkcmFnb24ucGluLnk7XG5cbiAgICAgICAgICAgIGRyYWdvbi5tb3N0UmVjZW50SG92ZXJMaXN0ID0gaG92ZXJMaXN0O1xuXG4gICAgICAgICAgICB2YXIgbWF4U2Nyb2xsWSA9IGhvdmVyTGlzdC5lbGVtZW50LnNjcm9sbEhlaWdodCAtIGhvdmVyTGlzdC5yZWN0LmhlaWdodCxcbiAgICAgICAgICAgICAgICB5ID0gZXZ0LmNsaWVudFkgKyB3aW5kb3cuc2Nyb2xsWSxcbiAgICAgICAgICAgICAgICBtYWduaXR1ZGU7XG5cbiAgICAgICAgICAgIGlmIChtYXhTY3JvbGxZID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIGxpc3QgaXMgc2Nyb2xsYWJsZSAoaXMgdGFsbGVyIHRoYW4gcmVjdClcbiAgICAgICAgICAgICAgICBpZiAoaG92ZXJMaXN0LmVsZW1lbnQuc2Nyb2xsVG9wID4gMCAmJiAobWFnbml0dWRlID0geSAtIChob3Zlckxpc3QucmVjdC50b3AgKyA1KSkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1vdXNlIG5lYXIgb3IgYWJvdmUgdG9wIGFuZCBsaXN0IGlzIG5vdCBzY3JvbGxlZCB0byB0b3AgeWV0XG4gICAgICAgICAgICAgICAgICAgIHJlc2V0QXV0b1Njcm9sbFRpbWVyKG1hZ25pdHVkZSwgMCwgaG92ZXJMaXN0LmVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaG92ZXJMaXN0LmVsZW1lbnQuc2Nyb2xsVG9wIDwgbWF4U2Nyb2xsWSAmJiAobWFnbml0dWRlID0geSAtIChob3Zlckxpc3QucmVjdC5ib3R0b20gLSAxIC0gNSkpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBtb3VzZSBuZWFyIG9yIGJlbG93IGJvdHRvbSBhbmQgbGlzdCBub3Qgc2Nyb2xsZWQgdG8gYm90dG9tIHlldFxuICAgICAgICAgICAgICAgICAgICByZXNldEF1dG9TY3JvbGxUaW1lcihtYWduaXR1ZGUsIG1heFNjcm9sbFksIGhvdmVyTGlzdC5lbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBtb3VzZSBpbnNpZGVcbiAgICAgICAgICAgICAgICAgICAgcmVzZXRBdXRvU2Nyb2xsVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBvdGhlciA9IGRyYWdvbi5wb2ludEluSXRlbVJlY3RzKHtcbiAgICAgICAgICAgICAgICB4OiBldnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICB5OiBkcmFnb24ucmVjdC5ib3R0b20gKyB3aW5kb3cuc2Nyb2xsWSArIGR5ICsgaG92ZXJMaXN0LmVsZW1lbnQuc2Nyb2xsVG9wXG4gICAgICAgICAgICB9LCB0aGlzLCBkcmFnb24uZHJvcCk7XG5cbiAgICAgICAgICAgIHRoaXMuc3R5bGVbdHJhbnNmb3JtXSA9IHRyYW5zbGF0ZShcbiAgICAgICAgICAgICAgICBkcmFnb24ucmVjdC5sZWZ0IC0gd2luZG93LnNjcm9sbFggKyBkeCxcbiAgICAgICAgICAgICAgICBkcmFnb24ucmVjdC50b3AgLSB3aW5kb3cuc2Nyb2xsWSArIGR5XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpZiAob3RoZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudCA9IG90aGVyLmVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS50cmFuc2l0aW9uID0gUkVWRVJUX1RPX1NUWUxFU0hFRVRfVkFMVUU7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5ib3JkZXJUb3BXaWR0aCA9IGRyYWdvbi5kcm9wLnN0eWxlLmJvcmRlclRvcFdpZHRoO1xuICAgICAgICAgICAgICAgIGRyYWdvbi5kcm9wLnN0eWxlLmJvcmRlclRvcFdpZHRoID0gbnVsbDtcbiAgICAgICAgICAgICAgICBkcmFnb24uZHJvcCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbW91c2V1cDogZnVuY3Rpb24gKGRyYWdvbiwgZXZ0KSB7XG4gICAgICAgIHJlc2V0QXV0b1Njcm9sbFRpbWVyKCk7XG4gICAgICAgIGRyYWdvbi5yZW1vdmVFdnQoJ21vdXNlbW92ZScpO1xuICAgICAgICBkcmFnb24ucmVtb3ZlRXZ0KCdtb3VzZXVwJyk7XG5cbiAgICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgIHZhciBuZXdSZWN0ID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICB3aW5kb3cuc2Nyb2xsWCArIG5ld1JlY3QubGVmdCA9PT0gZHJhZ29uLnJlY3QubGVmdCAmJlxuICAgICAgICAgICAgd2luZG93LnNjcm9sbFkgKyBuZXdSZWN0LnRvcCA9PT0gZHJhZ29uLnJlY3QudG9wXG4gICAgICAgICkge1xuICAgICAgICAgICAgZHJhZ29uLnJlaW5zZXJ0KHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGRyb3BSZWN0ID0gZHJhZ29uLmRyb3AuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgICAgIGRyYWdvbi5hZGRFdnQodGhpcywgJ3RyYW5zaXRpb25lbmQnLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuc3R5bGUudHJhbnNpdGlvbkR1cmF0aW9uID0gUkVWRVJUX1RPX1NUWUxFU0hFRVRfVkFMVUU7IC8vcmV2ZXJ0cyB0byAyMDBtc1xuICAgICAgICAgICAgdGhpcy5zdHlsZS50cmFuc2l0aW9uUHJvcGVydHkgPSB0cmFuc2Zvcm07XG4gICAgICAgICAgICB0aGlzLnN0eWxlW3RyYW5zZm9ybV0gPSB0cmFuc2xhdGUoXG4gICAgICAgICAgICAgICAgZHJvcFJlY3QubGVmdCAtIHdpbmRvdy5zY3JvbGxYLFxuICAgICAgICAgICAgICAgIGRyb3BSZWN0LnRvcCAtIHdpbmRvdy5zY3JvbGxZXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHRyYW5zaXRpb25lbmQ6IGZ1bmN0aW9uIChkcmFnb24sIGV2dCkge1xuICAgICAgICBpZiAoZXZ0LnByb3BlcnR5TmFtZSA9PT0gdHJhbnNmb3JtKSB7XG4gICAgICAgICAgICBkcmFnb24ucmVtb3ZlRXZ0KCd0cmFuc2l0aW9uZW5kJyk7XG4gICAgICAgICAgICBkcmFnb24ucmVpbnNlcnQodGhpcyk7XG5cbiAgICAgICAgICAgIHRoaXMuc3R5bGUudHJhbnNpdGlvblByb3BlcnR5ID0gUkVWRVJUX1RPX1NUWUxFU0hFRVRfVkFMVUU7IC8vcmV2ZXJ0cyB0byBib3JkZXItdG9wLXdpZHRoXG5cbiAgICAgICAgICAgIHZhciBvcmlnaW5MaXN0ID0gZHJhZ29uLm1vZGVsTGlzdHNbZHJhZ29uLm9yaWdpbi5saXN0XTtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IG9yaWdpbkxpc3Quc3BsaWNlKGRyYWdvbi5vcmlnaW4uaXRlbSwgMSlbMF07XG4gICAgICAgICAgICB2YXIgZGVzdGluYXRpb24gPSBkcmFnb24uaXRlbUNvb3JkaW5hdGVzKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGRlc3RpbmF0aW9uTGlzdCA9IGRyYWdvbi5tb2RlbExpc3RzW2Rlc3RpbmF0aW9uLmxpc3RdO1xuICAgICAgICAgICAgdmFyIGludGVyTGlzdERyb3AgPSBvcmlnaW5MaXN0ICE9PSBkZXN0aW5hdGlvbkxpc3Q7XG4gICAgICAgICAgICB2YXIgbGlzdENoYW5nZWQgPSBpbnRlckxpc3REcm9wIHx8IGRyYWdvbi5vcmlnaW4uaXRlbSAhPT0gZGVzdGluYXRpb24uaXRlbTtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uTGlzdC5zcGxpY2UoZGVzdGluYXRpb24uaXRlbSwgMCwgbW9kZWwpO1xuXG4gICAgICAgICAgICBpZiAobGlzdENoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICBvcmlnaW5MaXN0LmVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ2xpc3RjaGFuZ2VkJykpO1xuICAgICAgICAgICAgICAgIGlmIChpbnRlckxpc3REcm9wKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uTGlzdC5lbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdsaXN0Y2hhbmdlZCcpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkcmFnb24uY2FsbGJhY2suZHJvcHBlZCkge1xuICAgICAgICAgICAgICAgIGRyYWdvbi5jYWxsYmFjay5kcm9wcGVkLmNhbGwodGhpcywgZHJhZ29uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHJlc2V0QXV0b1Njcm9sbFRpbWVyKG1hZ25pdHVkZSwgbGltaXQsIGVsZW1lbnQpIHtcbiAgICBpZiAoIW1hZ25pdHVkZSkge1xuICAgICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgICAgc2Nyb2xsVmVsb2NpdHkgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBjaGFuZ2VEaXJlY3Rpb24gPVxuICAgICAgICAgICAgc2Nyb2xsVmVsb2NpdHkgIDwgIDAgJiYgbWFnbml0dWRlICA+PSAwIHx8XG4gICAgICAgICAgICBzY3JvbGxWZWxvY2l0eSA9PT0gMCAmJiBtYWduaXR1ZGUgIT09IDAgfHxcbiAgICAgICAgICAgIHNjcm9sbFZlbG9jaXR5ICA+ICAwICYmIG1hZ25pdHVkZSAgPD0gMDtcbiAgICAgICAgc2Nyb2xsVmVsb2NpdHkgPSBtYWduaXR1ZGUgPiAwID8gTWF0aC5taW4oNTAsIG1hZ25pdHVkZSkgOiBNYXRoLm1heCgtNTAsIG1hZ25pdHVkZSk7XG4gICAgICAgIGlmIChjaGFuZ2VEaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgICAgICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAobGltaXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3AgKyBzY3JvbGxWZWxvY2l0eTtcbiAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsVmVsb2NpdHkgPCAwICYmIHNjcm9sbFRvcCA8IGxpbWl0IHx8IHNjcm9sbFZlbG9jaXR5ID4gMCAmJiBzY3JvbGxUb3AgPiBsaW1pdCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNjcm9sbFRvcCA9IGxpbWl0O1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNjcm9sbFRvcCA9IHNjcm9sbFRvcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMjUpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0b0FycmF5KGFycmF5TGlrZU9iamVjdCkge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcnJheUxpa2VPYmplY3QpO1xufVxuXG5mdW5jdGlvbiBwb2ludEluUmVjdChwb2ludCwgcmVjdCkge1xuICAgIHJldHVybiByZWN0LnRvcCA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gcmVjdC5ib3R0b21cbiAgICAgICAgJiYgcmVjdC5sZWZ0IDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSByZWN0LnJpZ2h0O1xufVxuXG5mdW5jdGlvbiB0cmFuc2xhdGUobGVmdCwgdG9wKSB7XG4gICAgcmV0dXJuICd0cmFuc2xhdGUoJ1xuICAgICAgICArIE1hdGguZmxvb3IobGVmdCArIHdpbmRvdy5zY3JvbGxYKSArICdweCwnXG4gICAgICAgICsgTWF0aC5mbG9vcih0b3AgKyB3aW5kb3cuc2Nyb2xsWSkgKyAncHgpJztcbn1cblxuZnVuY3Rpb24gaHRtbEVuY29kZShzdHJpbmcpIHtcbiAgICB2YXIgdGV4dE5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShzdHJpbmcpO1xuXG4gICAgcmV0dXJuIGRvY3VtZW50XG4gICAgICAgIC5jcmVhdGVFbGVtZW50KCdhJylcbiAgICAgICAgLmFwcGVuZENoaWxkKHRleHROb2RlKVxuICAgICAgICAucGFyZW50Tm9kZVxuICAgICAgICAuaW5uZXJIVE1MO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYDx1bD4uLi48L3VsPmAgZWxlbWVudHMgYW5kIGluc2VydHMgdGhlbSBpbnRvIGFuIGBlbGVtZW50YCBwcm9wZXJ0eSBvbiBlYWNoIG1vZGVsLlxuICogQHBhcmFtIHtvYmplY3R9IG1vZGVsTGlzdHNcbiAqIEByZXR1cm5zIGBtb2RlbExpc3RzYFxuICovXG5mdW5jdGlvbiBjcmVhdGVMaXN0RWxlbWVudHNGcm9tTW9kZWxMaXN0cyhtb2RlbExpc3RzLCBvcHRpb25zKSB7XG4gICAgdmFyIHRlbXBsYXRlTGFiZWwgPSBvcHRpb25zLmxhYmVsIHx8ICd7bGFiZWx9JztcblxuICAgIG1vZGVsTGlzdHMuZm9yRWFjaChmdW5jdGlvbiAobW9kZWxMaXN0LCBsaXN0SW5kZXgpIHtcbiAgICAgICAgdmFyIGxpc3RMYWJlbCA9IG1vZGVsTGlzdC5sYWJlbCB8fCB0ZW1wbGF0ZUxhYmVsLFxuICAgICAgICAgICAgbGlzdEh0bWxFbmNvZGUgPSBtb2RlbExpc3QuaHRtbEVuY29kZSAhPT0gdW5kZWZpbmVkICYmIG1vZGVsTGlzdC5odG1sRW5jb2RlIHx8IG9wdGlvbnMuaHRtbEVuY29kZSxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICAgICAgbGlzdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuXG4gICAgICAgIGlmIChtb2RlbExpc3QubW9kZWxzKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhtb2RlbExpc3QpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgIGlmIChrZXkgIT09ICdtb2RlbHMnKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVsTGlzdC5tb2RlbHNba2V5XSA9IG1vZGVsTGlzdFtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbW9kZWxMaXN0c1tsaXN0SW5kZXhdID0gbW9kZWxMaXN0ID0gbW9kZWxMaXN0Lm1vZGVscztcbiAgICAgICAgfSBlbHNlIGlmIChtb2RlbExpc3QgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgbW9kZWxMaXN0Lm1vZGVscyA9IG1vZGVsTGlzdDsgLy8gcG9pbnQgdG8gc2VsZlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3IoJ0xpc3QgW3sxfV0gbm90IGFuIGFycmF5IG9mIG1vZGVscyAod2l0aCBvciB3aXRob3V0IGFkZGl0aW9uYWwgcHJvcGVydGllcykgT1IgJyArXG4gICAgICAgICAgICAgICAgJ2FuIG9iamVjdCAod2l0aCBhIGBtb2RlbHNgIHByb3BlcnR5IGNvbnRhaW5pbmcgYW4gYXJyYXkgb2YgbW9kZWxzKS4nLCBsaXN0SW5kZXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbW9kZWxMaXN0LmZvckVhY2goZnVuY3Rpb24gKG1vZGVsKSB7XG4gICAgICAgICAgICB2YXIgbW9kZWxMYWJlbCA9IG1vZGVsLmxhYmVsIHx8IGxpc3RMYWJlbCxcbiAgICAgICAgICAgICAgICBtb2RlbEh0bWxFbmNvZGUgPSBtb2RlbC5odG1sRW5jb2RlICE9PSB1bmRlZmluZWQgJiYgbW9kZWwuaHRtbEVuY29kZSB8fCBsaXN0SHRtbEVuY29kZSxcbiAgICAgICAgICAgICAgICBtb2RlbE9iamVjdCA9IHR5cGVvZiBtb2RlbCA9PT0gJ29iamVjdCcgPyBtb2RlbCA6IHsgbGFiZWw6IG1vZGVsfSxcbiAgICAgICAgICAgICAgICBsYWJlbCA9IGZvcm1hdC5jYWxsKFttb2RlbE9iamVjdCwgbW9kZWxMaXN0LCBvcHRpb25zXSwgbW9kZWxMYWJlbCksXG4gICAgICAgICAgICAgICAgaXRlbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgICAgICAgICBpdGVtRWxlbWVudC5pbm5lckhUTUwgPSBtb2RlbEh0bWxFbmNvZGUgPyBodG1sRW5jb2RlKGxhYmVsKSA6IGxhYmVsO1xuXG4gICAgICAgICAgICBsaXN0RWxlbWVudC5hcHBlbmRDaGlsZChpdGVtRWxlbWVudCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGFwcGVuZCB0aGUgZmluYWwgXCJmZW5jZXBvc3RcIiBpdGVtIC0tIGRyb3AgdGFyZ2V0IGF0IGJvdHRvbSBvZiBsaXN0IGFmdGVyIGFsbCBpdGVtc1xuICAgICAgICB2YXIgaXRlbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICBpdGVtRWxlbWVudC5pbm5lckhUTUwgPSAnJm5ic3A7JztcbiAgICAgICAgbGlzdEVsZW1lbnQuYXBwZW5kQ2hpbGQoaXRlbUVsZW1lbnQpO1xuXG4gICAgICAgIC8vIGFwcGVuZCBoZWFkZXIgdG8gY29udGFpbmVyXG4gICAgICAgIGlmIChtb2RlbExpc3QudGl0bGUpIHtcbiAgICAgICAgICAgIHZhciBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIGhlYWRlci5pbm5lckhUTUwgPSBsaXN0SHRtbEVuY29kZSA/IGh0bWxFbmNvZGUobW9kZWxMaXN0LnRpdGxlKSA6IG1vZGVsTGlzdC50aXRsZTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChoZWFkZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGxpc3RFbGVtZW50KTtcbiAgICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9IG1vZGVsTGlzdC5jc3NDbGFzc05hbWVzIHx8IG9wdGlvbnMuY3NzQ2xhc3NOYW1lcyB8fCAnZHJhZ29uLWxpc3QnO1xuICAgICAgICBtb2RlbExpc3QuZWxlbWVudCA9IGxpc3RFbGVtZW50O1xuICAgICAgICBtb2RlbExpc3QuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1vZGVsTGlzdHM7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgYC5tb2RlbExpc3RzYCBhcnJheSB3aXRoIHRoZXNlIDxsaT4gZWxlbWVudHMnIHBhcmVudCA8dWw+IGVsZW1lbnRzXG4gKiBAcGFyYW0ge0VsZW1lbnRbXX0gbGlzdEl0ZW1FbGVtZW50c1xuICogQHJldHVybnMge0FycmF5fVxuICovXG5mdW5jdGlvbiBjcmVhdGVNb2RlbExpc3RzRnJvbUxpc3RFbGVtZW50cyhsaXN0SXRlbUVsZW1lbnRzKSB7XG4gICAgdmFyIG1vZGVsTGlzdHMgPSBbXTtcblxuICAgIGxpc3RJdGVtRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbUVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGxpc3RFbGVtZW50ID0gaXRlbUVsZW1lbnQucGFyZW50RWxlbWVudCxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IGxpc3RFbGVtZW50LnBhcmVudEVsZW1lbnQsXG4gICAgICAgICAgICBtb2RlbHMgPSBbXTtcbiAgICAgICAgaWYgKCFtb2RlbExpc3RzLmZpbmQoZnVuY3Rpb24gKGxpc3QpIHsgcmV0dXJuIGxpc3QuZWxlbWVudCA9PT0gbGlzdEVsZW1lbnQ7IH0pKSB7XG4gICAgICAgICAgICB0b0FycmF5KGxpc3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpJykpLmZvckVhY2goZnVuY3Rpb24gKGl0ZW1FbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1FbGVtZW50ICE9PSBsaXN0RWxlbWVudC5sYXN0RWxlbWVudENoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVscy5wdXNoKGl0ZW1FbGVtZW50LmlubmVySFRNTCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBtb2RlbHMuZWxlbWVudCA9IGxpc3RFbGVtZW50O1xuICAgICAgICAgICAgbW9kZWxzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgIG1vZGVsTGlzdHMucHVzaChtb2RlbHMpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbW9kZWxMaXN0cztcbn1cblxuZnVuY3Rpb24gY2FwdHVyZUV2ZW50KGV2dCkge1xuICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbn1cblxuZnVuY3Rpb24gZXJyb3IoKSB7XG4gICAgcmV0dXJuICdsaXN0LWRyYWdvbjogJyArIGZvcm1hdC5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcbn1cblxuLy8gdGhpcyBpbnRlcmZhY2UgY29uc2lzdHMgc29sZWx5IG9mIHRoZSBwcm90b3R5cGFsIG9iamVjdCBjb25zdHJ1Y3RvclxubW9kdWxlLmV4cG9ydHMgPSBMaXN0RHJhZ29uO1xuIiwiLyogb2JqZWN0LWl0ZXJhdG9ycy5qcyAtIE1pbmkgVW5kZXJzY29yZSBsaWJyYXJ5XG4gKiBieSBKb25hdGhhbiBFaXRlblxuICpcbiAqIFRoZSBtZXRob2RzIGJlbG93IG9wZXJhdGUgb24gb2JqZWN0cyAoYnV0IG5vdCBhcnJheXMpIHNpbWlsYXJseVxuICogdG8gVW5kZXJzY29yZSAoaHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvI2NvbGxlY3Rpb25zKS5cbiAqXG4gKiBGb3IgbW9yZSBpbmZvcm1hdGlvbjpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvb2JqZWN0LWl0ZXJhdG9yc1xuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBzdW1tYXJ5IFdyYXAgYW4gb2JqZWN0IGZvciBvbmUgbWV0aG9kIGNhbGwuXG4gKiBARGVzYyBOb3RlIHRoYXQgdGhlIGBuZXdgIGtleXdvcmQgaXMgbm90IG5lY2Vzc2FyeS5cbiAqIEBwYXJhbSB7b2JqZWN0fG51bGx8dW5kZWZpbmVkfSBvYmplY3QgLSBgbnVsbGAgb3IgYHVuZGVmaW5lZGAgaXMgdHJlYXRlZCBhcyBhbiBlbXB0eSBwbGFpbiBvYmplY3QuXG4gKiBAcmV0dXJuIHtXcmFwcGVyfSBUaGUgd3JhcHBlZCBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIFdyYXBwZXIob2JqZWN0KSB7XG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFdyYXBwZXIpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdyYXBwZXIpKSB7XG4gICAgICAgIHJldHVybiBuZXcgV3JhcHBlcihvYmplY3QpO1xuICAgIH1cbiAgICB0aGlzLm9yaWdpbmFsVmFsdWUgPSBvYmplY3Q7XG4gICAgdGhpcy5vID0gb2JqZWN0IHx8IHt9O1xufVxuXG4vKipcbiAqIEBuYW1lIFdyYXBwZXIuY2hhaW5cbiAqIEBzdW1tYXJ5IFdyYXAgYW4gb2JqZWN0IGZvciBhIGNoYWluIG9mIG1ldGhvZCBjYWxscy5cbiAqIEBEZXNjIENhbGxzIHRoZSBjb25zdHJ1Y3RvciBgV3JhcHBlcigpYCBhbmQgbW9kaWZpZXMgdGhlIHdyYXBwZXIgZm9yIGNoYWluaW5nLlxuICogQHBhcmFtIHtvYmplY3R9IG9iamVjdFxuICogQHJldHVybiB7V3JhcHBlcn0gVGhlIHdyYXBwZWQgb2JqZWN0LlxuICovXG5XcmFwcGVyLmNoYWluID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciB3cmFwcGVkID0gV3JhcHBlcihvYmplY3QpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5ldy1jYXBcbiAgICB3cmFwcGVkLmNoYWluaW5nID0gdHJ1ZTtcbiAgICByZXR1cm4gd3JhcHBlZDtcbn07XG5cbldyYXBwZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIFVud3JhcCBhbiBvYmplY3Qgd3JhcHBlZCB3aXRoIHtAbGluayBXcmFwcGVyLmNoYWlufFdyYXBwZXIuY2hhaW4oKX0uXG4gICAgICogQHJldHVybiB7b2JqZWN0fG51bGx8dW5kZWZpbmVkfSBUaGUgdmFsdWUgb3JpZ2luYWxseSB3cmFwcGVkIGJ5IHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgKiBAbWVtYmVyT2YgV3JhcHBlci5wcm90b3R5cGVcbiAgICAgKi9cbiAgICB2YWx1ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcmlnaW5hbFZhbHVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBNaW1pY3MgVW5kZXJzY29yZSdzIFtlYWNoXShodHRwOi8vdW5kZXJzY29yZWpzLm9yZy8jZWFjaCkgbWV0aG9kOiBJdGVyYXRlIG92ZXIgdGhlIG1lbWJlcnMgb2YgdGhlIHdyYXBwZWQgb2JqZWN0LCBjYWxsaW5nIGBpdGVyYXRlZSgpYCB3aXRoIGVhY2guXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gaXRlcmF0ZWUgLSBGb3IgZWFjaCBtZW1iZXIgb2YgdGhlIHdyYXBwZWQgb2JqZWN0LCB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIHRocmVlIGFyZ3VtZW50czogYCh2YWx1ZSwga2V5LCBvYmplY3QpYC4gVGhlIHJldHVybiB2YWx1ZSBvZiB0aGlzIGZ1bmN0aW9uIGlzIHVuZGVmaW5lZDsgYW4gYC5lYWNoYCBsb29wIGNhbm5vdCBiZSBicm9rZW4gb3V0IG9mICh1c2Uge0BsaW5rIFdyYXBwZXIjZmluZHwuZmluZH0gaW5zdGVhZCkuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIElmIGdpdmVuLCBgaXRlcmF0ZWVgIGlzIGJvdW5kIHRvIHRoaXMgb2JqZWN0LiBJbiBvdGhlciB3b3JkcywgdGhpcyBvYmplY3QgYmVjb21lcyB0aGUgYHRoaXNgIHZhbHVlIGluIHRoZSBjYWxscyB0byBgaXRlcmF0ZWVgLiAoT3RoZXJ3aXNlLCB0aGUgYHRoaXNgIHZhbHVlIHdpbGwgYmUgdGhlIHVud3JhcHBlZCBvYmplY3QuKVxuICAgICAqIEByZXR1cm4ge1dyYXBwZXJ9IFRoZSB3cmFwcGVkIG9iamVjdCBmb3IgY2hhaW5pbmcuXG4gICAgICogQG1lbWJlck9mIFdyYXBwZXIucHJvdG90eXBlXG4gICAgICovXG4gICAgZWFjaDogZnVuY3Rpb24gKGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgICAgIHZhciBvID0gdGhpcy5vO1xuICAgICAgICBPYmplY3Qua2V5cyhvKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGl0ZXJhdGVlLmNhbGwodGhpcywgb1trZXldLCBrZXksIG8pO1xuICAgICAgICB9LCBjb250ZXh0IHx8IG8pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGRlc2MgTWltaWNzIFVuZGVyc2NvcmUncyBbZmluZF0oaHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvI2ZpbmQpIG1ldGhvZDogTG9vayB0aHJvdWdoIGVhY2ggbWVtYmVyIG9mIHRoZSB3cmFwcGVkIG9iamVjdCwgcmV0dXJuaW5nIHRoZSBmaXJzdCBvbmUgdGhhdCBwYXNzZXMgYSB0cnV0aCB0ZXN0IChgcHJlZGljYXRlYCksIG9yIGB1bmRlZmluZWRgIGlmIG5vIHZhbHVlIHBhc3NlcyB0aGUgdGVzdC4gVGhlIGZ1bmN0aW9uIHJldHVybnMgdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBhY2NlcHRhYmxlIG1lbWJlciwgYW5kIGRvZXNuJ3QgbmVjZXNzYXJpbHkgdHJhdmVyc2UgdGhlIGVudGlyZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcHJlZGljYXRlIC0gRm9yIGVhY2ggbWVtYmVyIG9mIHRoZSB3cmFwcGVkIG9iamVjdCwgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM6IGAodmFsdWUsIGtleSwgb2JqZWN0KWAuIFRoZSByZXR1cm4gdmFsdWUgb2YgdGhpcyBmdW5jdGlvbiBzaG91bGQgYmUgdHJ1dGh5IGlmIHRoZSBtZW1iZXIgcGFzc2VzIHRoZSB0ZXN0IGFuZCBmYWxzeSBvdGhlcndpc2UuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIElmIGdpdmVuLCBgcHJlZGljYXRlYCBpcyBib3VuZCB0byB0aGlzIG9iamVjdC4gSW4gb3RoZXIgd29yZHMsIHRoaXMgb2JqZWN0IGJlY29tZXMgdGhlIGB0aGlzYCB2YWx1ZSBpbiB0aGUgY2FsbHMgdG8gYHByZWRpY2F0ZWAuIChPdGhlcndpc2UsIHRoZSBgdGhpc2AgdmFsdWUgd2lsbCBiZSB0aGUgdW53cmFwcGVkIG9iamVjdC4pXG4gICAgICogQHJldHVybiB7Kn0gVGhlIGZvdW5kIHByb3BlcnR5J3MgdmFsdWUsIG9yIHVuZGVmaW5lZCBpZiBub3QgZm91bmQuXG4gICAgICogQG1lbWJlck9mIFdyYXBwZXIucHJvdG90eXBlXG4gICAgICovXG4gICAgZmluZDogZnVuY3Rpb24gKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgICB2YXIgbyA9IHRoaXMubztcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgaWYgKG8pIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IE9iamVjdC5rZXlzKG8pLmZpbmQoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVkaWNhdGUuY2FsbCh0aGlzLCBvW2tleV0sIGtleSwgbyk7XG4gICAgICAgICAgICB9LCBjb250ZXh0IHx8IG8pO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gb1tyZXN1bHRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBkZXNjIE1pbWljcyBVbmRlcnNjb3JlJ3MgW2ZpbHRlcl0oaHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvI2ZpbHRlcikgbWV0aG9kOiBMb29rIHRocm91Z2ggZWFjaCBtZW1iZXIgb2YgdGhlIHdyYXBwZWQgb2JqZWN0LCByZXR1cm5pbmcgdGhlIHZhbHVlcyBvZiBhbGwgbWVtYmVycyB0aGF0IHBhc3MgYSB0cnV0aCB0ZXN0IChgcHJlZGljYXRlYCksIG9yIGVtcHR5IGFycmF5IGlmIG5vIHZhbHVlIHBhc3NlcyB0aGUgdGVzdC4gVGhlIGZ1bmN0aW9uIGFsd2F5cyB0cmF2ZXJzZXMgdGhlIGVudGlyZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcHJlZGljYXRlIC0gRm9yIGVhY2ggbWVtYmVyIG9mIHRoZSB3cmFwcGVkIG9iamVjdCwgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM6IGAodmFsdWUsIGtleSwgb2JqZWN0KWAuIFRoZSByZXR1cm4gdmFsdWUgb2YgdGhpcyBmdW5jdGlvbiBzaG91bGQgYmUgdHJ1dGh5IGlmIHRoZSBtZW1iZXIgcGFzc2VzIHRoZSB0ZXN0IGFuZCBmYWxzeSBvdGhlcndpc2UuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIElmIGdpdmVuLCBgcHJlZGljYXRlYCBpcyBib3VuZCB0byB0aGlzIG9iamVjdC4gSW4gb3RoZXIgd29yZHMsIHRoaXMgb2JqZWN0IGJlY29tZXMgdGhlIGB0aGlzYCB2YWx1ZSBpbiB0aGUgY2FsbHMgdG8gYHByZWRpY2F0ZWAuIChPdGhlcndpc2UsIHRoZSBgdGhpc2AgdmFsdWUgd2lsbCBiZSB0aGUgdW53cmFwcGVkIG9iamVjdC4pXG4gICAgICogQHJldHVybiB7Kn0gQW4gYXJyYXkgY29udGFpbmluZyB0aGUgZmlsdGVyZWQgdmFsdWVzLlxuICAgICAqIEBtZW1iZXJPZiBXcmFwcGVyLnByb3RvdHlwZVxuICAgICAqL1xuICAgIGZpbHRlcjogZnVuY3Rpb24gKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgICB2YXIgbyA9IHRoaXMubztcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICBpZiAobykge1xuICAgICAgICAgICAgT2JqZWN0LmtleXMobykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZWRpY2F0ZS5jYWxsKHRoaXMsIG9ba2V5XSwga2V5LCBvKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChvW2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGNvbnRleHQgfHwgbyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGRlc2MgTWltaWNzIFVuZGVyc2NvcmUncyBbbWFwXShodHRwOi8vdW5kZXJzY29yZWpzLm9yZy8jbWFwKSBtZXRob2Q6IFByb2R1Y2VzIGEgbmV3IGFycmF5IG9mIHZhbHVlcyBieSBtYXBwaW5nIGVhY2ggdmFsdWUgaW4gbGlzdCB0aHJvdWdoIGEgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb24gKGBpdGVyYXRlZWApLiBUaGUgZnVuY3Rpb24gYWx3YXlzIHRyYXZlcnNlcyB0aGUgZW50aXJlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBpdGVyYXRlZSAtIEZvciBlYWNoIG1lbWJlciBvZiB0aGUgd3JhcHBlZCBvYmplY3QsIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggdGhyZWUgYXJndW1lbnRzOiBgKHZhbHVlLCBrZXksIG9iamVjdClgLiBUaGUgcmV0dXJuIHZhbHVlIG9mIHRoaXMgZnVuY3Rpb24gaXMgY29uY2F0ZW5hdGVkIHRvIHRoZSBlbmQgb2YgdGhlIG5ldyBhcnJheS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gSWYgZ2l2ZW4sIGBpdGVyYXRlZWAgaXMgYm91bmQgdG8gdGhpcyBvYmplY3QuIEluIG90aGVyIHdvcmRzLCB0aGlzIG9iamVjdCBiZWNvbWVzIHRoZSBgdGhpc2AgdmFsdWUgaW4gdGhlIGNhbGxzIHRvIGBwcmVkaWNhdGVgLiAoT3RoZXJ3aXNlLCB0aGUgYHRoaXNgIHZhbHVlIHdpbGwgYmUgdGhlIHVud3JhcHBlZCBvYmplY3QuKVxuICAgICAqIEByZXR1cm4geyp9IEFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIGZpbHRlcmVkIHZhbHVlcy5cbiAgICAgKiBAbWVtYmVyT2YgV3JhcHBlci5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBtYXA6IGZ1bmN0aW9uIChpdGVyYXRlZSwgY29udGV4dCkge1xuICAgICAgICB2YXIgbyA9IHRoaXMubztcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICBpZiAobykge1xuICAgICAgICAgICAgT2JqZWN0LmtleXMobykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaXRlcmF0ZWUuY2FsbCh0aGlzLCBvW2tleV0sIGtleSwgbykpO1xuICAgICAgICAgICAgfSwgY29udGV4dCB8fCBvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBNaW1pY3MgVW5kZXJzY29yZSdzIFtyZWR1Y2VdKGh0dHA6Ly91bmRlcnNjb3JlanMub3JnLyNyZWR1Y2UpIG1ldGhvZDogQm9pbCBkb3duIHRoZSB2YWx1ZXMgb2YgYWxsIHRoZSBtZW1iZXJzIG9mIHRoZSB3cmFwcGVkIG9iamVjdCBpbnRvIGEgc2luZ2xlIHZhbHVlLiBgbWVtb2AgaXMgdGhlIGluaXRpYWwgc3RhdGUgb2YgdGhlIHJlZHVjdGlvbiwgYW5kIGVhY2ggc3VjY2Vzc2l2ZSBzdGVwIG9mIGl0IHNob3VsZCBiZSByZXR1cm5lZCBieSBgaXRlcmF0ZWUoKWAuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gaXRlcmF0ZWUgLSBGb3IgZWFjaCBtZW1iZXIgb2YgdGhlIHdyYXBwZWQgb2JqZWN0LCB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGZvdXIgYXJndW1lbnRzOiBgKG1lbW8sIHZhbHVlLCBrZXksIG9iamVjdClgLiBUaGUgcmV0dXJuIHZhbHVlIG9mIHRoaXMgZnVuY3Rpb24gYmVjb21lcyB0aGUgbmV3IHZhbHVlIG9mIGBtZW1vYCBmb3IgdGhlIG5leHQgaXRlcmF0aW9uLlxuICAgICAqIEBwYXJhbSB7Kn0gW21lbW9dIC0gSWYgbm8gbWVtbyBpcyBwYXNzZWQgdG8gdGhlIGluaXRpYWwgaW52b2NhdGlvbiBvZiByZWR1Y2UsIHRoZSBpdGVyYXRlZSBpcyBub3QgaW52b2tlZCBvbiB0aGUgZmlyc3QgZWxlbWVudCBvZiB0aGUgbGlzdC4gVGhlIGZpcnN0IGVsZW1lbnQgaXMgaW5zdGVhZCBwYXNzZWQgYXMgdGhlIG1lbW8gaW4gdGhlIGludm9jYXRpb24gb2YgdGhlIGl0ZXJhdGVlIG9uIHRoZSBuZXh0IGVsZW1lbnQgaW4gdGhlIGxpc3QuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtjb250ZXh0XSAtIElmIGdpdmVuLCBgaXRlcmF0ZWVgIGlzIGJvdW5kIHRvIHRoaXMgb2JqZWN0LiBJbiBvdGhlciB3b3JkcywgdGhpcyBvYmplY3QgYmVjb21lcyB0aGUgYHRoaXNgIHZhbHVlIGluIHRoZSBjYWxscyB0byBgaXRlcmF0ZWVgLiAoT3RoZXJ3aXNlLCB0aGUgYHRoaXNgIHZhbHVlIHdpbGwgYmUgdGhlIHVud3JhcHBlZCBvYmplY3QuKVxuICAgICAqIEByZXR1cm4geyp9IFRoZSB2YWx1ZSBvZiBgbWVtb2AgXCJyZWR1Y2VkXCIgYXMgcGVyIGBpdGVyYXRlZWAuXG4gICAgICogQG1lbWJlck9mIFdyYXBwZXIucHJvdG90eXBlXG4gICAgICovXG4gICAgcmVkdWNlOiBmdW5jdGlvbiAoaXRlcmF0ZWUsIG1lbW8sIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIG8gPSB0aGlzLm87XG4gICAgICAgIGlmIChvKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhvKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXksIGlkeCkge1xuICAgICAgICAgICAgICAgIG1lbW8gPSAoIWlkeCAmJiBtZW1vID09PSB1bmRlZmluZWQpID8gb1trZXldIDogaXRlcmF0ZWUobWVtbywgb1trZXldLCBrZXksIG8pO1xuICAgICAgICAgICAgfSwgY29udGV4dCB8fCBvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWVtbztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGRlc2MgTWltaWNzIFVuZGVyc2NvcmUncyBbZXh0ZW5kXShodHRwOi8vdW5kZXJzY29yZWpzLm9yZy8jZXh0ZW5kKSBtZXRob2Q6IENvcHkgYWxsIG9mIHRoZSBwcm9wZXJ0aWVzIGluIGVhY2ggb2YgdGhlIGBzb3VyY2VgIG9iamVjdCBwYXJhbWV0ZXIocykgb3ZlciB0byB0aGUgKHdyYXBwZWQpIGRlc3RpbmF0aW9uIG9iamVjdCAodGh1cyBtdXRhdGluZyBpdCkuIEl0J3MgaW4tb3JkZXIsIHNvIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBsYXN0IGBzb3VyY2VgIG9iamVjdCB3aWxsIG92ZXJyaWRlIHByb3BlcnRpZXMgd2l0aCB0aGUgc2FtZSBuYW1lIGluIHByZXZpb3VzIGFyZ3VtZW50cyBvciBpbiB0aGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAqID4gVGhpcyBtZXRob2QgY29waWVzIG93biBtZW1iZXJzIGFzIHdlbGwgYXMgbWVtYmVycyBpbmhlcml0ZWQgZnJvbSBwcm90b3R5cGUgY2hhaW4uXG4gICAgICogQHBhcmFtIHsuLi5vYmplY3R8bnVsbHx1bmRlZmluZWR9IHNvdXJjZSAtIFZhbHVlcyBvZiBgbnVsbGAgb3IgYHVuZGVmaW5lZGAgYXJlIHRyZWF0ZWQgYXMgZW1wdHkgcGxhaW4gb2JqZWN0cy5cbiAgICAgKiBAcmV0dXJuIHtXcmFwcGVyfG9iamVjdH0gVGhlIHdyYXBwZWQgZGVzdGluYXRpb24gb2JqZWN0IGlmIGNoYWluaW5nIGlzIGluIGVmZmVjdDsgb3RoZXJ3aXNlIHRoZSB1bndyYXBwZWQgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAqIEBtZW1iZXJPZiBXcmFwcGVyLnByb3RvdHlwZVxuICAgICAqL1xuICAgIGV4dGVuZDogZnVuY3Rpb24gKHNvdXJjZSkge1xuICAgICAgICB2YXIgbyA9IHRoaXMubztcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgICAgIGlmIChvYmplY3QpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9ba2V5XSA9IG9iamVjdFtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmNoYWluaW5nID8gdGhpcyA6IG87XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBkZXNjIE1pbWljcyBVbmRlcnNjb3JlJ3MgW2V4dGVuZE93bl0oaHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvI2V4dGVuZE93bikgbWV0aG9kOiBMaWtlIHtAbGluayBXcmFwcGVyI2V4dGVuZHxleHRlbmR9LCBidXQgb25seSBjb3BpZXMgaXRzIFwib3duXCIgcHJvcGVydGllcyBvdmVyIHRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAgICogQHBhcmFtIHsuLi5vYmplY3R8bnVsbHx1bmRlZmluZWR9IHNvdXJjZSAtIFZhbHVlcyBvZiBgbnVsbGAgb3IgYHVuZGVmaW5lZGAgYXJlIHRyZWF0ZWQgYXMgZW1wdHkgcGxhaW4gb2JqZWN0cy5cbiAgICAgKiBAcmV0dXJuIHtXcmFwcGVyfG9iamVjdH0gVGhlIHdyYXBwZWQgZGVzdGluYXRpb24gb2JqZWN0IGlmIGNoYWluaW5nIGlzIGluIGVmZmVjdDsgb3RoZXJ3aXNlIHRoZSB1bndyYXBwZWQgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgICAqIEBtZW1iZXJPZiBXcmFwcGVyLnByb3RvdHlwZVxuICAgICAqL1xuICAgIGV4dGVuZE93bjogZnVuY3Rpb24gKHNvdXJjZSkge1xuICAgICAgICB2YXIgbyA9IHRoaXMubztcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgICAgIFdyYXBwZXIob2JqZWN0KS5lYWNoKGZ1bmN0aW9uICh2YWwsIGtleSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5ldy1jYXBcbiAgICAgICAgICAgICAgICBvW2tleV0gPSB2YWw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmNoYWluaW5nID8gdGhpcyA6IG87XG4gICAgfVxufTtcblxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZmluZFxuaWYgKCFBcnJheS5wcm90b3R5cGUuZmluZCkge1xuICAgIEFycmF5LnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24gKHByZWRpY2F0ZSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWV4dGVuZC1uYXRpdmVcbiAgICAgICAgaWYgKHRoaXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FycmF5LnByb3RvdHlwZS5maW5kIGNhbGxlZCBvbiBudWxsIG9yIHVuZGVmaW5lZCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgcHJlZGljYXRlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdwcmVkaWNhdGUgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxpc3QgPSBPYmplY3QodGhpcyk7XG4gICAgICAgIHZhciBsZW5ndGggPSBsaXN0Lmxlbmd0aCA+Pj4gMDtcbiAgICAgICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG4gICAgICAgIHZhciB2YWx1ZTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlLmNhbGwodGhpc0FyZywgdmFsdWUsIGksIGxpc3QpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXcmFwcGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiogQG1vZHVsZSBvdmVycmlkZXIgKi9cblxuLyoqXG4gKiBNaXhlcyBtZW1iZXJzIG9mIGFsbCBgc291cmNlc2AgaW50byBgdGFyZ2V0YCwgaGFuZGxpbmcgZ2V0dGVycyBhbmQgc2V0dGVycyBwcm9wZXJseS5cbiAqXG4gKiBBbnkgbnVtYmVyIG9mIGBzb3VyY2VzYCBvYmplY3RzIG1heSBiZSBnaXZlbiBhbmQgZWFjaCBpcyBjb3BpZWQgaW4gdHVybi5cbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIG92ZXJyaWRlciA9IHJlcXVpcmUoJ292ZXJyaWRlcicpO1xuICogdmFyIHRhcmdldCA9IHsgYTogMSB9LCBzb3VyY2UxID0geyBiOiAyIH0sIHNvdXJjZTIgPSB7IGM6IDMgfTtcbiAqIHRhcmdldCA9PT0gb3ZlcnJpZGVyKHRhcmdldCwgc291cmNlMSwgc291cmNlMik7IC8vIHRydWVcbiAqIC8vIHRhcmdldCBvYmplY3Qgbm93IGhhcyBhLCBiLCBhbmQgYzsgc291cmNlIG9iamVjdHMgdW50b3VjaGVkXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9iamVjdCAtIFRoZSB0YXJnZXQgb2JqZWN0IHRvIHJlY2VpdmUgc291cmNlcy5cbiAqIEBwYXJhbSB7Li4ub2JqZWN0fSBbc291cmNlc10gLSBPYmplY3QocykgY29udGFpbmluZyBtZW1iZXJzIHRvIGNvcHkgdG8gYHRhcmdldGAuIChPbWl0dGluZyBpcyBhIG5vLW9wLilcbiAqIEByZXR1cm5zIHtvYmplY3R9IFRoZSB0YXJnZXQgb2JqZWN0IChgdGFyZ2V0YClcbiAqL1xuZnVuY3Rpb24gb3ZlcnJpZGVyKHRhcmdldCwgc291cmNlcykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgbWl4SW4uY2FsbCh0YXJnZXQsIGFyZ3VtZW50c1tpXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldDtcbn1cblxuLyoqXG4gKiBNaXggYHRoaXNgIG1lbWJlcnMgaW50byBgdGFyZ2V0YC5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gQS4gU2ltcGxlIHVzYWdlICh1c2luZyAuY2FsbCk6XG4gKiB2YXIgbWl4SW5UbyA9IHJlcXVpcmUoJ292ZXJyaWRlcicpLm1peEluVG87XG4gKiB2YXIgdGFyZ2V0ID0geyBhOiAxIH0sIHNvdXJjZSA9IHsgYjogMiB9O1xuICogdGFyZ2V0ID09PSBvdmVycmlkZXIubWl4SW5Uby5jYWxsKHNvdXJjZSwgdGFyZ2V0KTsgLy8gdHJ1ZVxuICogLy8gdGFyZ2V0IG9iamVjdCBub3cgaGFzIGJvdGggYSBhbmQgYjsgc291cmNlIG9iamVjdCB1bnRvdWNoZWRcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gQi4gU2VtYW50aWMgdXNhZ2UgKHdoZW4gdGhlIHNvdXJjZSBob3N0cyB0aGUgbWV0aG9kKTpcbiAqIHZhciBtaXhJblRvID0gcmVxdWlyZSgnb3ZlcnJpZGVyJykubWl4SW5UbztcbiAqIHZhciB0YXJnZXQgPSB7IGE6IDEgfSwgc291cmNlID0geyBiOiAyLCBtaXhJblRvOiBtaXhJblRvIH07XG4gKiB0YXJnZXQgPT09IHNvdXJjZS5taXhJblRvKHRhcmdldCk7IC8vIHRydWVcbiAqIC8vIHRhcmdldCBvYmplY3Qgbm93IGhhcyBib3RoIGEgYW5kIGI7IHNvdXJjZSBvYmplY3QgdW50b3VjaGVkXG4gKlxuICogQHRoaXMge29iamVjdH0gVGFyZ2V0LlxuICogQHBhcmFtIHRhcmdldFxuICogQHJldHVybnMge29iamVjdH0gVGhlIHRhcmdldCBvYmplY3QgKGB0YXJnZXRgKVxuICogQG1lbWJlck9mIG1vZHVsZTpvdmVycmlkZXJcbiAqL1xuZnVuY3Rpb24gbWl4SW5Ubyh0YXJnZXQpIHtcbiAgICB2YXIgZGVzY3JpcHRvcjtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcykge1xuICAgICAgICBpZiAoKGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRoaXMsIGtleSkpKSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIGRlc2NyaXB0b3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5cbi8qKlxuICogTWl4IGBzb3VyY2VgIG1lbWJlcnMgaW50byBgdGhpc2AuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIEEuIFNpbXBsZSB1c2FnZSAodXNpbmcgLmNhbGwpOlxuICogdmFyIG1peEluID0gcmVxdWlyZSgnb3ZlcnJpZGVyJykubWl4SW47XG4gKiB2YXIgdGFyZ2V0ID0geyBhOiAxIH0sIHNvdXJjZSA9IHsgYjogMiB9O1xuICogdGFyZ2V0ID09PSBvdmVycmlkZXIubWl4SW4uY2FsbCh0YXJnZXQsIHNvdXJjZSkgLy8gdHJ1ZVxuICogLy8gdGFyZ2V0IG9iamVjdCBub3cgaGFzIGJvdGggYSBhbmQgYjsgc291cmNlIG9iamVjdCB1bnRvdWNoZWRcbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gQi4gU2VtYW50aWMgdXNhZ2UgKHdoZW4gdGhlIHRhcmdldCBob3N0cyB0aGUgbWV0aG9kKTpcbiAqIHZhciBtaXhJbiA9IHJlcXVpcmUoJ292ZXJyaWRlcicpLm1peEluO1xuICogdmFyIHRhcmdldCA9IHsgYTogMSwgbWl4SW46IG1peEluIH0sIHNvdXJjZSA9IHsgYjogMiB9O1xuICogdGFyZ2V0ID09PSB0YXJnZXQubWl4SW4oc291cmNlKSAvLyB0cnVlXG4gKiAvLyB0YXJnZXQgbm93IGhhcyBib3RoIGEgYW5kIGIgKGFuZCBtaXhJbik7IHNvdXJjZSB1bnRvdWNoZWRcbiAqXG4gKiBAcGFyYW0gc291cmNlXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBUaGUgdGFyZ2V0IG9iamVjdCAoYHRoaXNgKVxuICogQG1lbWJlck9mIG92ZXJyaWRlclxuICogQG1lbWJlck9mIG1vZHVsZTpvdmVycmlkZXJcbiAqL1xuZnVuY3Rpb24gbWl4SW4oc291cmNlKSB7XG4gICAgdmFyIGRlc2NyaXB0b3I7XG4gICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgICBpZiAoKGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNvdXJjZSwga2V5KSkpIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBrZXksIGRlc2NyaXB0b3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufVxuXG5vdmVycmlkZXIubWl4SW5UbyA9IG1peEluVG87XG5vdmVycmlkZXIubWl4SW4gPSBtaXhJbjtcblxubW9kdWxlLmV4cG9ydHMgPSBvdmVycmlkZXI7XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUkVHRVhQX0lORElSRUNUSU9OID0gL14oXFx3KylcXCgoXFx3KylcXCkkLzsgIC8vIGZpbmRzIGNvbXBsZXRlIHBhdHRlcm4gYShiKSB3aGVyZSBib3RoIGEgYW5kIGIgYXJlIHJlZ2V4IFwid29yZHNcIlxuXG4vKiogQHR5cGVkZWYge29iamVjdH0gdmFsdWVJdGVtXG4gKiBZb3Ugc2hvdWxkIHN1cHBseSBib3RoIGBuYW1lYCBhbmQgYGFsaWFzYCBidXQgeW91IGNvdWxkIG9taXQgb25lIG9yIHRoZSBvdGhlciBhbmQgd2hpY2hldmVyIHlvdSBwcm92aWRlIHdpbGwgYmUgdXNlZCBmb3IgYm90aC5cbiAqID4gSWYgeW91IG9ubHkgZ2l2ZSB0aGUgYG5hbWVgIHByb3BlcnR5LCB5b3UgbWlnaHQgYXMgd2VsbCBqdXN0IGdpdmUgYSBzdHJpbmcgZm9yIHtAbGluayBtZW51SXRlbX0gcmF0aGVyIHRoYW4gdGhpcyBvYmplY3QuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW25hbWU9YWxpYXNdIC0gVmFsdWUgb2YgYHZhbHVlYCBhdHRyaWJ1dGUgb2YgYDxvcHRpb24+Li4uPC9vcHRpb24+YCBlbGVtZW50LlxuICogQHByb3BlcnR5IHtzdHJpbmd9IFthbGlhcz1uYW1lXSAtIFRleHQgb2YgYDxvcHRpb24+Li4uPC9vcHRpb24+YCBlbGVtZW50LlxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0eXBlXSBPbmUgb2YgdGhlIGtleXMgb2YgYHRoaXMuY29udmVydGVyc2AuIElmIG5vdCBvbmUgb2YgdGhlc2UgKGluY2x1ZGluZyBgdW5kZWZpbmVkYCksIGZpZWxkIHZhbHVlcyB3aWxsIGJlIHRlc3RlZCB3aXRoIGEgc3RyaW5nIGNvbXBhcmlzb24uXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtoaWRkZW49ZmFsc2VdXG4gKi9cblxuLyoqIEB0eXBlZGVmIHtvYmplY3R8bWVudUl0ZW1bXX0gc3VibWVudUl0ZW1cbiAqIEBzdW1tYXJ5IEhpZXJhcmNoaWNhbCBhcnJheSBvZiBzZWxlY3QgbGlzdCBpdGVtcy5cbiAqIEBkZXNjIERhdGEgc3RydWN0dXJlIHJlcHJlc2VudGluZyB0aGUgbGlzdCBvZiBgPG9wdGlvbj4uLi48L29wdGlvbj5gIGFuZCBgPG9wdGdyb3VwPi4uLjwvb3B0Z3JvdXA+YCBlbGVtZW50cyB0aGF0IG1ha2UgdXAgYSBgPHNlbGVjdD4uLi48L3NlbGVjdD5gIGVsZW1lbnQuXG4gKlxuICogPiBBbHRlcm5hdGUgZm9ybTogSW5zdGVhZCBvZiBhbiBvYmplY3Qgd2l0aCBhIGBtZW51YCBwcm9wZXJ0eSBjb250YWluaW5nIGFuIGFycmF5LCBtYXkgaXRzZWxmIGJlIHRoYXQgYXJyYXkuIEJvdGggZm9ybXMgaGF2ZSB0aGUgb3B0aW9uYWwgYGxhYmVsYCBwcm9wZXJ0eS5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbGFiZWxdIC0gRGVmYXVsdHMgdG8gYSBnZW5lcmF0ZWQgc3RyaW5nIG9mIHRoZSBmb3JtIFwiR3JvdXAgblsubV0uLi5cIiB3aGVyZSBlYWNoIGRlY2ltYWwgcG9zaXRpb24gcmVwcmVzZW50cyBhIGxldmVsIG9mIHRoZSBvcHRncm91cCBoaWVyYXJjaHkuXG4gKiBAcHJvcGVydHkge21lbnVJdGVtW119IHN1Ym1lbnVcbiAqL1xuXG4vKiogQHR5cGVkZWYge3N0cmluZ3x2YWx1ZUl0ZW18c3VibWVudUl0ZW19IG1lbnVJdGVtXG4gKiBNYXkgYmUgb25lIG9mIHRocmVlIHBvc3NpYmxlIHR5cGVzIHRoYXQgc3BlY2lmeSBlaXRoZXIgYW4gYDxvcHRpb24+Li4uLjwvb3B0aW9uPmAgZWxlbWVudCBvciBhbiBgPG9wdGdyb3VwPi4uLi48L29wdGdyb3VwPmAgZWxlbWVudCBhcyBmb2xsb3dzOlxuICogKiBJZiBhIGBzdHJpbmdgLCBzcGVjaWZpZXMgdGhlIHRleHQgb2YgYW4gYDxvcHRpb24+Li4uLjwvb3B0aW9uPmAgZWxlbWVudCB3aXRoIG5vIGB2YWx1ZWAgYXR0cmlidXRlLiAoSW4gdGhlIGFic2VuY2Ugb2YgYSBgdmFsdWVgIGF0dHJpYnV0ZSwgdGhlIGB2YWx1ZWAgcHJvcGVydHkgb2YgdGhlIGVsZW1lbnQgZGVmYXVsdHMgdG8gdGhlIHRleHQuKVxuICogKiBJZiBzaGFwZWQgbGlrZSBhIHtAbGluayB2YWx1ZUl0ZW19IG9iamVjdCwgc3BlY2lmaWVzIGJvdGggdGhlIHRleHQgYW5kIHZhbHVlIG9mIGFuIGA8b3B0aW9uLi4uLjwvb3B0aW9uPmAgZWxlbWVudC5cbiAqICogSWYgc2hhcGVkIGxpa2UgYSB7QGxpbmsgc3VibWVudUl0ZW19IG9iamVjdCAob3IgaXRzIGFsdGVybmF0ZSBhcnJheSBmb3JtKSwgc3BlY2lmaWVzIGFuIGA8b3B0Z3JvdXA+Li4uLjwvb3B0Z3JvdXA+YCBlbGVtZW50LlxuICovXG5cbi8qKlxuICogQHN1bW1hcnkgQnVpbGRzIGEgbmV3IG1lbnUgcHJlLXBvcHVsYXRlZCB3aXRoIGl0ZW1zIGFuZCBncm91cHMuXG4gKiBAZGVzYyBUaGlzIGZ1bmN0aW9uIGNyZWF0ZXMgYSBuZXcgcG9wLXVwIG1lbnUgKGEuay5hLiBcImRyb3AtZG93blwiKS4gVGhpcyBpcyBhIGA8c2VsZWN0Pi4uLjwvc2VsZWN0PmAgZWxlbWVudCwgcHJlLXBvcHVsYXRlZCB3aXRoIGl0ZW1zIChgPG9wdGlvbj4uLi48L29wdGlvbj5gIGVsZW1lbnRzKSBhbmQgZ3JvdXBzIChgPG9wdGdyb3VwPi4uLjwvb3B0Z3JvdXA+YCBlbGVtZW50cykuXG4gKiA+IEJvbnVzOiBUaGlzIGZ1bmN0aW9uIGFsc28gYnVpbGRzIGBpbnB1dCB0eXBlPXRleHRgIGVsZW1lbnRzLlxuICogPiBOT1RFOiBUaGlzIGZ1bmN0aW9uIGdlbmVyYXRlcyBPUFRHUk9VUCBlbGVtZW50cyBmb3Igc3VidHJlZXMuIEhvd2V2ZXIsIG5vdGUgdGhhdCBIVE1MNSBzcGVjaWZpZXMgdGhhdCBPUFRHUk9VUCBlbGVtbmVudHMgbWFkZSBub3QgbmVzdCEgVGhpcyBmdW5jdGlvbiBnZW5lcmF0ZXMgdGhlIG1hcmt1cCBmb3IgdGhlbSBidXQgdGhleSBhcmUgbm90IHJlbmRlcmVkIGJ5IG1vc3QgYnJvd3NlcnMsIG9yIG5vdCBjb21wbGV0ZWx5LiBUaGVyZWZvcmUsIGZvciBub3csIGRvIG5vdCBzcGVjaWZ5IG1vcmUgdGhhbiBvbmUgbGV2ZWwgc3VidHJlZXMuIEZ1dHVyZSB2ZXJzaW9ucyBvZiBIVE1MIG1heSBzdXBwb3J0IGl0LiBJIGFsc28gcGxhbiB0byBhZGQgaGVyZSBvcHRpb25zIHRvIGF2b2lkIE9QVEdST1VQUyBlbnRpcmVseSBlaXRoZXIgYnkgaW5kZW50aW5nIG9wdGlvbiB0ZXh0LCBvciBieSBjcmVhdGluZyBhbHRlcm5hdGUgRE9NIG5vZGVzIHVzaW5nIGA8bGk+YCBpbnN0ZWFkIG9mIGA8c2VsZWN0PmAsIG9yIGJvdGguXG4gKiBAbWVtYmVyT2YgcG9wTWVudVxuICpcbiAqIEBwYXJhbSB7RWxlbWVudHxzdHJpbmd9IGVsIC0gTXVzdCBiZSBvbmUgb2YgKGNhc2Utc2Vuc2l0aXZlKTpcbiAqICogdGV4dCBib3ggLSBhbiBgSFRNTElucHV0RWxlbWVudGAgdG8gdXNlIGFuIGV4aXN0aW5nIGVsZW1lbnQgb3IgYCdJTlBVVCdgIHRvIGNyZWF0ZSBhIG5ldyBvbmVcbiAqICogZHJvcC1kb3duIC0gYW4gYEhUTUxTZWxlY3RFbGVtZW50YCB0byB1c2UgYW4gZXhpc3RpbmcgZWxlbWVudCBvciBgJ1NFTEVDVCdgIHRvIGNyZWF0ZSBhIG5ldyBvbmVcbiAqICogc3VibWVudSAtIGFuIGBIVE1MT3B0R3JvdXBFbGVtZW50YCB0byB1c2UgYW4gZXhpc3RpbmcgZWxlbWVudCBvciBgJ09QVEdST1VQJ2AgdG8gY3JlYXRlIGEgbmV3IG9uZSAobWVhbnQgZm9yIGludGVybmFsIHVzZSBvbmx5KVxuICpcbiAqIEBwYXJhbSB7bWVudUl0ZW1bXX0gW21lbnVdIC0gSGllcmFyY2hpY2FsIGxpc3Qgb2Ygc3RyaW5ncyB0byBhZGQgYXMgYDxvcHRpb24+Li4uPC9vcHRpb24+YCBvciBgPG9wdGdyb3VwPi4uLi48L29wdGdyb3VwPmAgZWxlbWVudHMuIE9taXR0aW5nIGNyZWF0ZXMgYSB0ZXh0IGJveC5cbiAqXG4gKiBAcGFyYW0ge251bGx8c3RyaW5nfSBbb3B0aW9ucy5wcm9tcHQ9JyddIC0gQWRkcyBhbiBpbml0aWFsIGA8b3B0aW9uPi4uLjwvb3B0aW9uPmAgZWxlbWVudCB0byB0aGUgZHJvcC1kb3duIHdpdGggdGhpcyB2YWx1ZSBpbiBwYXJlbnRoZXNlcyBhcyBpdHMgYHRleHRgOyBhbmQgZW1wdHkgc3RyaW5nIGFzIGl0cyBgdmFsdWVgLiBEZWZhdWx0IGlzIGVtcHR5IHN0cmluZywgd2hpY2ggY3JlYXRlcyBhIGJsYW5rIHByb21wdDsgYG51bGxgIHN1cHByZXNzZXMgcHJvbXB0IGFsdG9nZXRoZXIuXG4gKlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5zb3J0XSAtIFdoZXRoZXIgdG8gYWxwaGEgc29ydCBvciBub3QuIElmIHRydXRoeSwgc29ydHMgZWFjaCBvcHRncm91cCBvbiBpdHMgYGxhYmVsYDsgYW5kIGVhY2ggc2VsZWN0IG9wdGlvbiBvbiBpdHMgdGV4dCAoaXRzIGBhbGlhc2AgaWYgZ2l2ZW47IG9yIGl0cyBgbmFtZWAgaWYgbm90KS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBbb3B0aW9ucy5ibGFja2xpc3RdIC0gT3B0aW9uYWwgbGlzdCBvZiBtZW51IGl0ZW0gbmFtZXMgdG8gYmUgaWdub3JlZC5cbiAqXG4gKiBAcGFyYW0ge251bWJlcltdfSBbb3B0aW9ucy5icmVhZGNydW1ic10gLSBMaXN0IG9mIG9wdGlvbiBncm91cCBzZWN0aW9uIG51bWJlcnMgKHJvb3QgaXMgc2VjdGlvbiAwKS4gKEZvciBpbnRlcm5hbCB1c2UuKVxuICpcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuYXBwZW5kPWZhbHNlXSAtIFdoZW4gYGVsYCBpcyBhbiBleGlzdGluZyBgPHNlbGVjdD5gIEVsZW1lbnQsIGdpdmluZyB0cnV0aHkgdmFsdWUgYWRkcyB0aGUgbmV3IGNoaWxkcmVuIHdpdGhvdXQgZmlyc3QgcmVtb3ZpbmcgZXhpc3RpbmcgY2hpbGRyZW4uXG4gKlxuICogQHJldHVybnMge0VsZW1lbnR9IEVpdGhlciBhIGA8c2VsZWN0PmAgb3IgYDxvcHRncm91cD5gIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkKGVsLCBtZW51LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICB2YXIgcHJvbXB0ID0gb3B0aW9ucy5wcm9tcHQsXG4gICAgICAgIGJsYWNrbGlzdCA9IG9wdGlvbnMuYmxhY2tsaXN0LFxuICAgICAgICBzb3J0ID0gb3B0aW9ucy5zb3J0LFxuICAgICAgICBicmVhZGNydW1icyA9IG9wdGlvbnMuYnJlYWRjcnVtYnMgfHwgW10sXG4gICAgICAgIHBhdGggPSBicmVhZGNydW1icy5sZW5ndGggPyBicmVhZGNydW1icy5qb2luKCcuJykgKyAnLicgOiAnJyxcbiAgICAgICAgc3VidHJlZU5hbWUgPSBwb3BNZW51LnN1YnRyZWUsXG4gICAgICAgIGdyb3VwSW5kZXggPSAwLFxuICAgICAgICB0YWdOYW1lO1xuXG4gICAgaWYgKGVsIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICB0YWdOYW1lID0gZWwudGFnTmFtZTtcbiAgICAgICAgaWYgKCFvcHRpb25zLmFwcGVuZCkge1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gJyc7IC8vIHJlbW92ZSBhbGwgPG9wdGlvbj4gYW5kIDxvcHRncm91cD4gZWxlbWVudHNcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRhZ05hbWUgPSBlbDtcbiAgICAgICAgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICAgIH1cblxuICAgIGlmIChtZW51KSB7XG4gICAgICAgIHZhciBhZGQsIG5ld09wdGlvbjtcbiAgICAgICAgaWYgKHRhZ05hbWUgPT09ICdTRUxFQ1QnKSB7XG4gICAgICAgICAgICBhZGQgPSBlbC5hZGQ7XG4gICAgICAgICAgICBpZiAocHJvbXB0KSB7XG4gICAgICAgICAgICAgICAgbmV3T3B0aW9uID0gbmV3IE9wdGlvbihwcm9tcHQsICcnKTtcbiAgICAgICAgICAgICAgICBuZXdPcHRpb24uaW5uZXJIVE1MICs9ICcmaGVsbGlwOyc7XG4gICAgICAgICAgICAgICAgZWwuYWRkKG5ld09wdGlvbik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb21wdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGVsLmFkZChuZXcgT3B0aW9uKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWRkID0gZWwuYXBwZW5kQ2hpbGQ7XG4gICAgICAgICAgICBlbC5sYWJlbCA9IHByb21wdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzb3J0KSB7XG4gICAgICAgICAgICBtZW51ID0gbWVudS5zbGljZSgpLnNvcnQoaXRlbUNvbXBhcmF0b3IpOyAvLyBzb3J0ZWQgY2xvbmVcbiAgICAgICAgfVxuXG4gICAgICAgIG1lbnUuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAvLyBpZiBpdGVtIGlzIG9mIGZvcm0gYShiKSBhbmQgdGhlcmUgaXMgYW4gZnVuY3Rpb24gYSBpbiBvcHRpb25zLCB0aGVuIGl0ZW0gPSBvcHRpb25zLmEoYilcbiAgICAgICAgICAgIGlmIChvcHRpb25zICYmIHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHZhciBpbmRpcmVjdGlvbiA9IGl0ZW0ubWF0Y2goUkVHRVhQX0lORElSRUNUSU9OKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGEgPSBpbmRpcmVjdGlvblsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGIgPSBpbmRpcmVjdGlvblsyXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGYgPSBvcHRpb25zW2FdO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGYgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBmKGIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ2J1aWxkOiBFeHBlY3RlZCBvcHRpb25zLicgKyBhICsgJyB0byBiZSBhIGZ1bmN0aW9uLic7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzdWJ0cmVlID0gaXRlbVtzdWJ0cmVlTmFtZV0gfHwgaXRlbTtcbiAgICAgICAgICAgIGlmIChzdWJ0cmVlIGluc3RhbmNlb2YgQXJyYXkpIHtcblxuICAgICAgICAgICAgICAgIHZhciBncm91cE9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFkY3J1bWJzOiBicmVhZGNydW1icy5jb25jYXQoKytncm91cEluZGV4KSxcbiAgICAgICAgICAgICAgICAgICAgcHJvbXB0OiBpdGVtLmxhYmVsIHx8ICdHcm91cCAnICsgcGF0aCArIGdyb3VwSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHNvcnQsXG4gICAgICAgICAgICAgICAgICAgIGJsYWNrbGlzdDogYmxhY2tsaXN0XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHZhciBvcHRncm91cCA9IGJ1aWxkKCdPUFRHUk9VUCcsIHN1YnRyZWUsIGdyb3VwT3B0aW9ucyk7XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0Z3JvdXAuY2hpbGRFbGVtZW50Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQob3B0Z3JvdXApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaXRlbSAhPT0gJ29iamVjdCcpIHtcblxuICAgICAgICAgICAgICAgIGlmICghKGJsYWNrbGlzdCAmJiBibGFja2xpc3QuaW5kZXhPZihpdGVtKSA+PSAwKSkge1xuICAgICAgICAgICAgICAgICAgICBhZGQuY2FsbChlbCwgbmV3IE9wdGlvbihpdGVtKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFpdGVtLmhpZGRlbikge1xuXG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBpdGVtLm5hbWUgfHwgaXRlbS5hbGlhcztcbiAgICAgICAgICAgICAgICBpZiAoIShibGFja2xpc3QgJiYgYmxhY2tsaXN0LmluZGV4T2YobmFtZSkgPj0gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkLmNhbGwoZWwsIG5ldyBPcHRpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmFsaWFzIHx8IGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLnR5cGUgPSAndGV4dCc7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsO1xufVxuXG5mdW5jdGlvbiBpdGVtQ29tcGFyYXRvcihhLCBiKSB7XG4gICAgYSA9IGEuYWxpYXMgfHwgYS5uYW1lIHx8IGEubGFiZWwgfHwgYTtcbiAgICBiID0gYi5hbGlhcyB8fCBiLm5hbWUgfHwgYi5sYWJlbCB8fCBiO1xuICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbn1cblxuLyoqXG4gKiBAc3VtbWFyeSBSZWN1cnNpdmVseSBzZWFyY2hlcyB0aGUgY29udGV4dCBhcnJheSBvZiBgbWVudUl0ZW1gcyBmb3IgYSBuYW1lZCBgaXRlbWAuXG4gKiBAbWVtYmVyT2YgcG9wTWVudVxuICogQHRoaXMgQXJyYXlcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5rZXlzPVtwb3BNZW51LmRlZmF1bHRLZXldXSAtIFByb3BlcnRpZXMgdG8gc2VhcmNoIGVhY2ggbWVudUl0ZW0gd2hlbiBpdCBpcyBhbiBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNhc2VTZW5zaXRpdmU9ZmFsc2VdIC0gSWdub3JlIGNhc2Ugd2hpbGUgc2VhcmNoaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gVmFsdWUgdG8gc2VhcmNoIGZvci5cbiAqIEByZXR1cm5zIHt1bmRlZmluZWR8bWVudUl0ZW19IFRoZSBmb3VuZCBpdGVtIG9yIGB1bmRlZmluZWRgIGlmIG5vdCBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gbG9va3VwKG9wdGlvbnMsIHZhbHVlKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdmFsdWUgPSBvcHRpb25zO1xuICAgICAgICBvcHRpb25zID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHZhciBzaGFsbG93LCBkZWVwLCBpdGVtLCBwcm9wLFxuICAgICAgICBrZXlzID0gb3B0aW9ucyAmJiBvcHRpb25zLmtleXMgfHwgW3BvcE1lbnUuZGVmYXVsdEtleV0sXG4gICAgICAgIGNhc2VTZW5zaXRpdmUgPSBvcHRpb25zICYmIG9wdGlvbnMuY2FzZVNlbnNpdGl2ZTtcblxuICAgIHZhbHVlID0gdG9TdHJpbmcodmFsdWUsIGNhc2VTZW5zaXRpdmUpO1xuXG4gICAgc2hhbGxvdyA9IHRoaXMuZmluZChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHZhciBzdWJ0cmVlID0gaXRlbVtwb3BNZW51LnN1YnRyZWVdIHx8IGl0ZW07XG5cbiAgICAgICAgaWYgKHN1YnRyZWUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuIChkZWVwID0gbG9va3VwLmNhbGwoc3VidHJlZSwgb3B0aW9ucywgdmFsdWUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgaXRlbSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0b1N0cmluZyhpdGVtLCBjYXNlU2Vuc2l0aXZlKSA9PT0gdmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBwcm9wID0gaXRlbVtrZXlzW2ldXTtcbiAgICAgICAgICAgICAgICBpZiAocHJvcCAmJiB0b1N0cmluZyhwcm9wLCBjYXNlU2Vuc2l0aXZlKSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpdGVtID0gZGVlcCB8fCBzaGFsbG93O1xuXG4gICAgcmV0dXJuIGl0ZW0gJiYgKGl0ZW0ubmFtZSA/IGl0ZW0gOiB7IG5hbWU6IGl0ZW0gfSk7XG59XG5cbmZ1bmN0aW9uIHRvU3RyaW5nKHMsIGNhc2VTZW5zaXRpdmUpIHtcbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgaWYgKHMpIHtcbiAgICAgICAgcmVzdWx0ICs9IHM7IC8vIGNvbnZlcnQgcyB0byBzdHJpbmdcbiAgICAgICAgaWYgKCFjYXNlU2Vuc2l0aXZlKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQudG9VcHBlckNhc2UoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIEBzdW1tYXJ5IFJlY3Vyc2l2ZWx5IHdhbGtzIHRoZSBjb250ZXh0IGFycmF5IG9mIGBtZW51SXRlbWBzIGFuZCBjYWxscyBgaXRlcmF0ZWVgIG9uIGVhY2ggaXRlbSB0aGVyZWluLlxuICogQGRlc2MgYGl0ZXJhdGVlYCBpcyBjYWxsZWQgd2l0aCBlYWNoIGl0ZW0gKHRlcm1pbmFsIG5vZGUpIGluIHRoZSBtZW51IHRyZWUgYW5kIGEgZmxhdCAwLWJhc2VkIGluZGV4LiBSZWN1cnNlcyBvbiBtZW1iZXIgd2l0aCBuYW1lIG9mIGBwb3BNZW51LnN1YnRyZWVgLlxuICpcbiAqIFRoZSBub2RlIHdpbGwgYWx3YXlzIGJlIGEge0BsaW5rIHZhbHVlSXRlbX0gb2JqZWN0OyB3aGVuIGEgYHN0cmluZ2AsIGl0IGlzIGJveGVkIGZvciB5b3UuXG4gKlxuICogQG1lbWJlck9mIHBvcE1lbnVcbiAqXG4gKiBAdGhpcyBBcnJheVxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGl0ZXJhdGVlIC0gRm9yIGVhY2ggaXRlbSBpbiB0aGUgbWVudSwgYGl0ZXJhdGVlYCBpcyBjYWxsZWQgd2l0aDpcbiAqICogdGhlIGB2YWx1ZUl0ZW1gIChpZiB0aGUgaXRlbSBpcyBhIHByaW1hdGl2ZSBzdHJpbmcsIGl0IGlzIHdyYXBwZWQgdXAgZm9yIHlvdSlcbiAqICogYSAwLWJhc2VkIGBvcmRpbmFsYFxuICpcbiAqIFRoZSBgaXRlcmF0ZWVgIHJldHVybiB2YWx1ZSBjYW4gYmUgdXNlZCB0byByZXBsYWNlIHRoZSBpdGVtLCBhcyBmb2xsb3dzOlxuICogKiBgdW5kZWZpbmVkYCAtIGRvIG5vdGhpbmdcbiAqICogYG51bGxgIC0gc3BsaWNlIG91dCB0aGUgaXRlbTsgcmVzdWx0aW5nIGVtcHR5IHN1Ym1lbnVzIGFyZSBhbHNvIHNwbGljZWQgb3V0IChzZWUgbm90ZSlcbiAqICogYW55dGhpbmcgZWxzZSAtIHJlcGxhY2UgdGhlIGl0ZW0gd2l0aCB0aGlzIHZhbHVlOyBpZiB2YWx1ZSBpcyBhIHN1YnRyZWUgKGkuZS4sIGFuIGFycmF5KSBgaXRlcmF0ZWVgIHdpbGwgdGhlbiBiZSBjYWxsZWQgdG8gd2FsayBpdCBhcyB3ZWxsIChzZWUgbm90ZSlcbiAqXG4gKiA+IE5vdGU6IFJldHVybmluZyBhbnl0aGluZyAob3RoZXIgdGhhbiBgdW5kZWZpbmVkYCkgZnJvbSBgaXRlcmF0ZWVgIHdpbGwgKGRlZXBseSkgbXV0YXRlIHRoZSBvcmlnaW5hbCBgbWVudWAgc28geW91IG1heSB3YW50IHRvIGNvcHkgaXQgZmlyc3QgKGRlZXBseSwgaW5jbHVkaW5nIGFsbCBsZXZlbHMgb2YgYXJyYXkgbmVzdGluZyBidXQgbm90IHRoZSB0ZXJtaW5hbCBub2RlIG9iamVjdHMpLlxuICpcbiAqIEByZXR1cm5zIHtudW1iZXJ9IE51bWJlciBvZiBpdGVtcyAodGVybWluYWwgbm9kZXMpIGluIHRoZSBtZW51IHRyZWUuXG4gKi9cbmZ1bmN0aW9uIHdhbGsoaXRlcmF0ZWUpIHtcbiAgICB2YXIgbWVudSA9IHRoaXMsXG4gICAgICAgIG9yZGluYWwgPSAwLFxuICAgICAgICBzdWJ0cmVlTmFtZSA9IHBvcE1lbnUuc3VidHJlZSxcbiAgICAgICAgaSwgaXRlbSwgc3VidHJlZSwgbmV3VmFsO1xuXG4gICAgZm9yIChpID0gbWVudS5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICBpdGVtID0gbWVudVtpXTtcbiAgICAgICAgc3VidHJlZSA9IGl0ZW1bc3VidHJlZU5hbWVdIHx8IGl0ZW07XG5cbiAgICAgICAgaWYgKCEoc3VidHJlZSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgc3VidHJlZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc3VidHJlZSkge1xuICAgICAgICAgICAgbmV3VmFsID0gaXRlcmF0ZWUoaXRlbS5uYW1lID8gaXRlbSA6IHsgbmFtZTogaXRlbSB9LCBvcmRpbmFsKTtcbiAgICAgICAgICAgIG9yZGluYWwgKz0gMTtcblxuICAgICAgICAgICAgaWYgKG5ld1ZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5ld1ZhbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBtZW51LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgb3JkaW5hbCAtPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1lbnVbaV0gPSBpdGVtID0gbmV3VmFsO1xuICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlID0gaXRlbVtzdWJ0cmVlTmFtZV0gfHwgaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoc3VidHJlZSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VidHJlZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdWJ0cmVlKSB7XG4gICAgICAgICAgICBvcmRpbmFsICs9IHdhbGsuY2FsbChzdWJ0cmVlLCBpdGVyYXRlZSk7XG4gICAgICAgICAgICBpZiAoc3VidHJlZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBtZW51LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBvcmRpbmFsIC09IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb3JkaW5hbDtcbn1cblxuLyoqXG4gKiBAc3VtbWFyeSBGb3JtYXQgaXRlbSBuYW1lIHdpdGggaXQncyBhbGlhcyB3aGVuIGF2YWlsYWJsZS5cbiAqIEBtZW1iZXJPZiBwb3BNZW51XG4gKiBAcGFyYW0ge3N0cmluZ3x2YWx1ZUl0ZW19IGl0ZW1cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFRoZSBmb3JtYXR0ZWQgbmFtZSBhbmQgYWxpYXMuXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdEl0ZW0oaXRlbSkge1xuICAgIHZhciByZXN1bHQgPSBpdGVtLm5hbWUgfHwgaXRlbTtcbiAgICBpZiAoaXRlbS5hbGlhcykge1xuICAgICAgICByZXN1bHQgPSAnXCInICsgaXRlbS5hbGlhcyArICdcIiAoJyArIHJlc3VsdCArICcpJztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5mdW5jdGlvbiBpc0dyb3VwUHJveHkocykge1xuICAgIHJldHVybiBSRUdFWFBfSU5ESVJFQ1RJT04udGVzdChzKTtcbn1cblxuLyoqXG4gKiBAbmFtZXNwYWNlXG4gKi9cbnZhciBwb3BNZW51ID0ge1xuICAgIGJ1aWxkOiBidWlsZCxcbiAgICB3YWxrOiB3YWxrLFxuICAgIGxvb2t1cDogbG9va3VwLFxuICAgIGZvcm1hdEl0ZW06IGZvcm1hdEl0ZW0sXG4gICAgaXNHcm91cFByb3h5OiBpc0dyb3VwUHJveHksXG4gICAgc3VidHJlZTogJ3N1Ym1lbnUnLFxuICAgIGRlZmF1bHRLZXk6ICduYW1lJ1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBwb3BNZW51O1xuIiwiLy8gdGFieiBub2RlIG1vZHVsZVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC90YWJ6XG5cbi8qIGVzbGludC1lbnYgbm9kZSwgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjc3NJbmplY3RvciA9IHJlcXVpcmUoJ2Nzcy1pbmplY3RvcicpO1xuXG4vKipcbiAqIFJlZ2lzdGVyL2RlcmVnaXN0ZXIgY2xpY2sgaGFuZGxlciBvbiBhbGwgdGFiIGNvbGxlY3Rpb25zLlxuICogQHBhcmFtIHtFbGVtZW50fSBbb3B0aW9ucy5yb290PWRvY3VtZW50XSAtIFdoZXJlIHRvIGxvb2sgZm9yIHRhYiBwYW5lbHMgKGAudGFiemAgZWxlbWVudHMpIGNvbnRhaW5pbmcgdGFicyBhbmQgZm9sZGVycy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudW5ob29rPWZhbHNlXSAtIFJlbW92ZSBldmVudCBsaXN0ZW5lciBmcm9tIHRhYiBwYW5lbHMgKGAudGFiemAgZWxlbWVudHMpLlxuICogQHBhcmFtIHtFbGVtZW50fSBbb3B0aW9ucy5yZWZlcmVuY2VFbGVtZW50XSAtIFBhc3NlZCB0byBjc3NJbmplY3RvcidzIGluc2VydEJlZm9yZSgpIGNhbGwuXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGVmYXVsdFRhYlNlbGVjdG9yPScuZGVmYXVsdC10YWInXSAtIC5jbGFzc25hbWUgb3IgI2lkIG9mIHRoZSB0YWIgdG8gc2VsZWN0IGJ5IGRlZmF1bHRcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5vbkVuYWJsZV0gLSBIYW5kbGVyIGltcGxlbWVudGF0aW9uLiBTZWUge0BsaW5rIFRhYnojb25FbmFibGV8b25FbmFibGV9LlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLm9uRGlzYWJsZV0gLSBIYW5kbGVyIGltcGxlbWVudGF0aW9uLiBTZWUge0BsaW5rIFRhYnojb25EaXNhYmxlfG9uRW5hYmxlfS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5vbkVuYWJsZWRdIC0gSGFuZGxlciBpbXBsZW1lbnRhdGlvbi4gU2VlIHtAbGluayBUYWJ6I29uRW5hYmxlZHxvbkVuYWJsZX0uXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMub25EaXNhYmxlZF0gLSBIYW5kbGVyIGltcGxlbWVudGF0aW9uLiBTZWUge0BsaW5rIFRhYnojb25EaXNhYmxlZHxvbkVuYWJsZX0uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGFieihvcHRpb25zKSB7XG4gICAgdmFyIGksIGVsO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIHJvb3QgPSBvcHRpb25zLnJvb3QgfHwgZG9jdW1lbnQsXG4gICAgICAgIHVuaG9vayA9IG9wdGlvbnMudW5ob29rLFxuICAgICAgICByZWZlcmVuY2VFbGVtZW50ID0gb3B0aW9ucy5yZWZlcmVuY2VFbGVtZW50LFxuICAgICAgICBkZWZhdWx0VGFiU2VsZWN0b3IgPSBvcHRpb25zLmRlZmF1bHRUYWJTZWxlY3RvciB8fCAnLmRlZmF1bHQtdGFiJztcblxuICAgIGlmICghdW5ob29rKSB7XG4gICAgICAgIHZhciBjc3M7XG4gICAgICAgIC8qIGluamVjdDpjc3MgKi9cbiAgICAgICAgY3NzID0gJy50YWJ6e3Bvc2l0aW9uOnJlbGF0aXZlO3Zpc2liaWxpdHk6aGlkZGVuO2hlaWdodDoxMDAlfS50YWJ6PmhlYWRlcntwb3NpdGlvbjpyZWxhdGl2ZTtkaXNwbGF5OmlubGluZS1ibG9jaztiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7bWFyZ2luLWxlZnQ6MWVtO3BhZGRpbmc6NXB4IC42ZW07Ym9yZGVyOjFweCBzb2xpZCAjNjY2O2JvcmRlci1ib3R0b20tY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLXJhZGl1czo2cHggNnB4IDAgMDtjdXJzb3I6ZGVmYXVsdDt1c2VyLXNlbGVjdDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmV9LnRhYno+aGVhZGVyK3NlY3Rpb257cG9zaXRpb246YWJzb2x1dGU7ZGlzcGxheTpub25lO2JhY2tncm91bmQtY29sb3I6I2ZmZjttYXJnaW4tdG9wOi0xcHg7cGFkZGluZzo4cHg7Ym9yZGVyOjFweCBzb2xpZCAjNjY2O2JvcmRlci1yYWRpdXM6NnB4O2xlZnQ6MDtyaWdodDowO2JvdHRvbTowO3RvcDowO3otaW5kZXg6MH0udGFiej5oZWFkZXIrc2VjdGlvbi50YWJ6LWVuYWJsZXt6LWluZGV4OjF9LnRhYno+aGVhZGVyLnRhYnotZW5hYmxle3otaW5kZXg6Mn0udGFiei1iZzB7YmFja2dyb3VuZC1jb2xvcjojZWVlIWltcG9ydGFudH0udGFiei1iZzF7YmFja2dyb3VuZC1jb2xvcjojZWVmIWltcG9ydGFudH0udGFiei1iZzJ7YmFja2dyb3VuZC1jb2xvcjojZWZlIWltcG9ydGFudH0udGFiei1iZzN7YmFja2dyb3VuZC1jb2xvcjojZWZmIWltcG9ydGFudH0udGFiei1iZzR7YmFja2dyb3VuZC1jb2xvcjojZmVlIWltcG9ydGFudH0udGFiei1iZzV7YmFja2dyb3VuZC1jb2xvcjojZmVmIWltcG9ydGFudH0udGFiei1iZzZ7YmFja2dyb3VuZC1jb2xvcjojZmZlIWltcG9ydGFudH0nO1xuICAgICAgICAvKiBlbmRpbmplY3QgKi9cblxuICAgICAgICBpZiAoIXJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIC8vIGZpbmQgZmlyc3QgPGxpbms+IG9yIDxzdHlsZT4gaW4gPGhlYWQ+XG4gICAgICAgICAgICB2YXIgaGVhZFN0dWZmID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaGVhZCcpLmNoaWxkcmVuO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgIXJlZmVyZW5jZUVsZW1lbnQgJiYgaSA8IGhlYWRTdHVmZi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGVsID0gaGVhZFN0dWZmW2ldO1xuICAgICAgICAgICAgICAgIGlmIChlbC50YWdOYW1lID09PSAnU1RZTEUnIHx8IGVsLnRhZ05hbWUgPT09ICdMSU5LJyAmJiBlbC5yZWwgPT09ICdzdHlsZXNoZWV0Jykge1xuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VFbGVtZW50ID0gZWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNzc0luamVjdG9yKGNzcywgJ3RhYnotY3NzLWJhc2UnLCByZWZlcmVuY2VFbGVtZW50KTtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKHRoaXNba2V5XSA9PT0gbm9vcCkge1xuICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAc3VtbWFyeSBUaGUgY29udGV4dCBvZiB0aGlzIHRhYiBvYmplY3QuXG4gICAgICAgICAqIEBkZXNjIFRoZSBjb250ZXh0IG1heSBlbmNvbXBhc3MgYW55IG51bWJlciBvZiB0YWIgcGFuZWxzIChgLnRhYnpgIGVsZW1lbnRzKS5cbiAgICAgICAgICogQHR5cGUge0hUTUxEb2N1bWVufEhUTUxFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yb290ID0gcm9vdDtcblxuICAgICAgICAvLyBlbmFibGUgZmlyc3QgdGFiIG9uIGVhY2ggdGFiIHBhbmVsIChgLnRhYnpgIGVsZW1lbnQpXG4gICAgICAgIGZvckVhY2hFbCgnLnRhYno+aGVhZGVyOmZpcnN0LW9mLXR5cGUsLnRhYno+c2VjdGlvbjpmaXJzdC1vZi10eXBlJywgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ3RhYnotZW5hYmxlJyk7XG4gICAgICAgIH0sIHJvb3QpO1xuXG4gICAgICAgIC8vIGVuYWJsZSBkZWZhdWx0IHRhYiBhbmQgYWxsIGl0cyBwYXJlbnRzIChtdXN0IGJlIGEgdGFiKVxuICAgICAgICB0aGlzLnRhYlRvKHJvb3QucXVlcnlTZWxlY3RvcignLnRhYnogPiBoZWFkZXInICsgZGVmYXVsdFRhYlNlbGVjdG9yKSk7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZvckVhY2hFbCgnLnRhYnogPiBzZWN0aW9uJywgZnVuY3Rpb24oZWwpIHtcblxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgMTogQSBidWcgaW4gb2xkZXIgdmVyc2lvbnMgb2YgQ2hyb21lIChsaWtlIHY0MCkgdGhhdCBpbnNlcnRlZCBhIGJyZWFrIGF0IG1hcmstdXAgbG9jYXRpb24gb2YgYW4gYWJzb2x1dGUgcG9zaXRpb25lZCBibG9jay4gVGhlIHdvcmstYXJvdW5kIGlzIHRvIGhpZGUgdGhvc2UgYmxvY2tzIHVudGlsIGFmdGVyIGZpcnN0IHJlbmRlcjsgdGhlbiBzaG93IHRoZW0uIEkgZG9uJ3Qga25vdyB3aHkgdGhpcyB3b3JrcyBidXQgaXQgZG9lcy4gU2VlbXMgdG8gYmUgZHVyYWJsZS5cbiAgICAgICAgICAgICAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgMjogQWRqdXN0IGFic29sdXRlIHRvcCBvZiBlYWNoIHJlbmRlcmVkIGZvbGRlciB0byB0aGUgYm90dG9tIG9mIGl0cyB0YWJcbiAgICAgICAgICAgICAgICBlbC5zdHlsZS50b3AgPSBlbC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbSAtIGVsLnBhcmVudEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgJ3B4JztcblxuICAgICAgICAgICAgfSwgcm9vdCk7XG4gICAgICAgIH0sIDApO1xuICAgIH1cblxuICAgIHZhciBtZXRob2QgPSB1bmhvb2sgPyAncmVtb3ZlRXZlbnRMaXN0ZW5lcicgOiAnYWRkRXZlbnRMaXN0ZW5lcic7XG4gICAgdmFyIGJvdW5kQ2xpY2tIYW5kbGVyID0gb25jbGljay5iaW5kKHRoaXMpO1xuICAgIGZvckVhY2hFbCgnLnRhYnonLCBmdW5jdGlvbih0YWJCYXIpIHtcbiAgICAgICAgdGFiQmFyLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICAgIHRhYkJhclttZXRob2RdKCdjbGljaycsIGJvdW5kQ2xpY2tIYW5kbGVyKTtcbiAgICB9LCByb290KTtcbn1cblxuZnVuY3Rpb24gb25jbGljayhldnQpIHtcbiAgICBjbGljay5jYWxsKHRoaXMsIGV2dC5jdXJyZW50VGFyZ2V0LCBldnQudGFyZ2V0KTtcbn1cblxuLyoqXG4gKiBAc3VtbWFyeSBTZWxlY3RzIHRoZSBnaXZlbiB0YWIuXG4gKiBAZGVzYyBJZiBpdCBpcyBhIG5lc3RlZCB0YWIsIGFsc28gcmV2ZWFscyBhbGwgaXRzIGFuY2VzdG9yIHRhYnMuXG4gKiBAcGFyYW0ge3N0cmluZ3xIVE1MRWxlbWVudH0gW2VsXSAtIE1heSBiZSBvbmUgb2Y6XG4gKiAqIGBIVE1MRWxlbWVudGBcbiAqICAgKiBgPGhlYWRlcj5gIC0gdGFiIGVsZW1lbnRcbiAqICAgKiBgPHNlY3Rpb24+YCAtIGZvbGRlciBlbGVtZW50XG4gKiAqIGBzdHJpbmdgIC0gQ1NTIHNlbGVjdG9yIHRvIG9uZSBvZiB0aGUgYWJvdmVcbiAqICogZmFsc3kgLSBmYWlscyBzaWxlbnRseVxuICogQG1lbWJlck9mIFRhYnoucHJvdG90eXBlXG4gKi9cblRhYnoucHJvdG90eXBlLnRhYlRvID0gZnVuY3Rpb24oZWwpIHtcbiAgICB3aGlsZSAoKGVsID0gdGhpcy50YWIoZWwpKSkge1xuICAgICAgICBjbGljay5jYWxsKHRoaXMsIGVsLnBhcmVudEVsZW1lbnQsIGVsKTtcbiAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7IC8vIGxvb3AgdG8gY2xpY2sgb24gZWFjaCBjb250YWluaW5nIHRhYi4uLlxuICAgIH1cbn07XG5cbi8qKlxuICogQ3VycmVudCBzZWxlY3RlZCB0YWIuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fG51bWJlcn0gZWwgLSBBbiBlbGVtZW50IHRoYXQgaXMgKG9yIGlzIHdpdGhpbikgdGhlIHRhYiBwYW5lbCAoYC50YWJ6YCBlbGVtZW50KSB0byBsb29rIGluLlxuICogQHJldHVybnMge3VuZGVmaW5lZHxIVE1MRWxlbWVudH0gUmV0dXJucyB0YWIgKGA8aGVhZGVyPmApIGVsZW1lbnQuICBSZXR1cm5zIGB1bmRlZmluZWRgIGlmIGBlbGAgaXMgbmVpdGhlciBvZiB0aGUgYWJvdmUgb3IgYW4gb3V0IG9mIHJhbmdlIGluZGV4LlxuICovXG5UYWJ6LnByb3RvdHlwZS5lbmFibGVkVGFiID0gZnVuY3Rpb24oZWwpIHtcbiAgICBlbCA9IHRoaXMucGFuZWwoZWwpO1xuICAgIHJldHVybiBlbCAmJiBlbC5xdWVyeVNlbGVjdG9yKCc6c2NvcGU+aGVhZGVyLnRhYnotZW5hYmxlJyk7XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IEdldCB0YWIgZWxlbWVudC5cbiAqIEBkZXNjIEdldCB0YWIgZWxlbWVudCBpZiBnaXZlbiB0YWIgb3IgZm9sZGVyIGVsZW1lbnQ7IG9yIGFuIGVsZW1lbnQgd2l0aGluIHN1Y2g7IG9yIGZpbmQgdGFiLlxuICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gW2VsXSAtIE1heSBiZSBvbmUgb2Y6XG4gKiAqIGEgdGFiIChhIGA8aGVhZGVyPmAgZWxlbWVudClcbiAqICogYSBmb2xkZXIgKGEgYDxzZWN0aW9uPmAgZWxlbWVudClcbiAqICogYW4gZWxlbWVudCB3aXRoaW4gb25lIG9mIHRoZSBhYm92ZVxuICogKiBgc3RyaW5nYCAtIENTUyBzZWxlY3RvciB0byBvbmUgb2YgdGhlIGFib3ZlLCBzZWFyY2hpbmcgd2l0aGluIHRoZSByb290IG9yIGRvY3VtZW50XG4gKiBAcmV0dXJucyB7bnVsbHxFbGVtZW50fSB0YWIgKGA8aGVhZGVyPi4uLjwvaGVhZGVyPmApIGVsZW1lbnQgb3IgYG51bGxgIGlmIG5vdCBmb3VuZFxuICogQG1lbWJlck9mIFRhYnoucHJvdG90eXBlXG4gKi9cblRhYnoucHJvdG90eXBlLnRhYiA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwgPSBsb29rRm9yRWwuY2FsbCh0aGlzLCBlbCk7XG4gICAgcmV0dXJuICEoZWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgPyBudWxsIDogZWwudGFnTmFtZSA9PT0gJ0hFQURFUicgPyBlbCA6IGVsLnRhZ05hbWUgPT09ICdTRUNUSU9OJyA/IGVsLnByZXZpb3VzRWxlbWVudFNpYmxpbmcgOiBudWxsO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBHZXQgZm9sZGVyIGVsZW1lbnQuXG4gKiBAZGVzYyBHZXQgZm9sZGVyIGVsZW1lbnQgaWYgZ2l2ZW4gdGFiIG9yIGZvbGRlciBlbGVtZW50OyBvciBhbiBlbGVtZW50IHdpdGhpbiBzdWNoOyBvciBmaW5kIGZvbGRlci5cbiAqIEBwYXJhbSB7c3RyaW5nfEVsZW1lbnR9IFtlbF0gLSBNYXkgYmUgb25lIG9mOlxuICogKiBhIHRhYiAoYSBgPGhlYWRlcj5gIGVsZW1lbnQpXG4gKiAqIGEgZm9sZGVyIChhIGA8c2VjdGlvbj5gIGVsZW1lbnQpXG4gKiAqIGFuIGVsZW1lbnQgd2l0aGluIG9uZSBvZiB0aGUgYWJvdmVcbiAqICogYHN0cmluZ2AgLSBDU1Mgc2VsZWN0b3IgdG8gb25lIG9mIHRoZSBhYm92ZSwgc2VhcmNoaW5nIHdpdGhpbiB0aGUgcm9vdCBvciBkb2N1bWVudFxuICogQHJldHVybnMge251bGx8RWxlbWVudH0gdGFiIChgPGhlYWRlcj4uLi48L2hlYWRlcj5gKSBlbGVtZW50IG9yIGBudWxsYCBpZiBub3QgZm91bmRcbiAqIEBtZW1iZXJPZiBUYWJ6LnByb3RvdHlwZVxuICovXG5UYWJ6LnByb3RvdHlwZS5mb2xkZXIgPSBmdW5jdGlvbihlbCkge1xuICAgIGVsID0gbG9va0ZvckVsLmNhbGwodGhpcywgZWwpO1xuICAgIHJldHVybiAhKGVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpID8gbnVsbCA6IGVsLnRhZ05hbWUgPT09ICdTRUNUSU9OJyA/IGVsIDogZWwudGFnTmFtZSA9PT0gJ0hFQURFUicgPyBlbC5uZXh0RWxlbWVudFNpYmxpbmcgOiBudWxsO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBHZXQgdGFiIHBhbmVsIGVsZW1lbnQuXG4gKiBAZGVzYyBHZXQgcGFuZWwgZWxlbWVudCBpZiBnaXZlbiB0YWIgcGFuZWwgZWxlbWVudDsgb3IgYW4gZWxlbWVudCB3aXRoaW4gYSB0YWIgcGFuZWw7IG9yIGZpbmQgdGFiIHBhbmVsLlxuICogQHBhcmFtIHtzdHJpbmd8RWxlbWVudH0gW2VsXSAtIE1heSBiZSBvbmUgb2Y6XG4gKiAqIGEgdGFiIHBhbmVsIChhbiBgSFRNTEVsZW1lbnRgIHdpdGggY2xhc3MgYHRhYnpgKVxuICogKiBhbiBlbGVtZW50IHdpdGhpbiBhIHRhYiBwYW5lbFxuICogKiBgc3RyaW5nYCAtIENTUyBzZWxlY3RvciB0byBvbmUgYSB0YWIgcGFuZWwsIHNlYXJjaGluZyB3aXRoaW4gdGhlIHJvb3Qgb3IgZG9jdW1lbnRcbiAqIEByZXR1cm5zIHtudWxsfEVsZW1lbnR9IHRhYiBwYW5lbCBlbGVtZW50IG9yIGBudWxsYCBpZiBub3QgZm91bmRcbiAqIEBtZW1iZXJPZiBUYWJ6LnByb3RvdHlwZVxuICovXG5UYWJ6LnByb3RvdHlwZS5wYW5lbCA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgd2hpbGUgKGVsICYmICFlbC5jbGFzc0xpc3QuY29udGFpbnMoJ3RhYnonKSkge1xuICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiAhKGVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpID8gbnVsbCA6IGVsLmNsYXNzTGlzdC5jb250YWlucygndGFieicpID8gZWwgOiBudWxsO1xufTtcblxuZnVuY3Rpb24gbG9va0ZvckVsKGVsKSB7XG4gICAgaWYgKGVsIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICB3aGlsZSAoZWwgJiYgZWwudGFnTmFtZSAhPT0gJ0hFQURFUicgJiYgZWwudGFnTmFtZSAhPT0gJ1NFQ1RJT04nKSB7XG4gICAgICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBlbCA9IHRoaXMucm9vdC5xdWVyeVNlbGVjdG9yKGVsKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xufVxuXG4vKiogRW5hYmxlcyB0aGUgdGFiL2ZvbGRlciBwYWlyIG9mIHRoZSBjbGlja2VkIHRhYi5cbiAqIERpc2FibGVzIGFsbCB0aGUgb3RoZXIgcGFpcnMgaW4gdGhpcyBzY29wZSB3aGljaCB3aWxsIGluY2x1ZGUgdGhlIHByZXZpb3VzbHkgZW5hYmxlZCBwYWlyLlxuICogQHByaXZhdGVcbiAqIEB0aGlzIFRhYnpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZGl2IC0gVGhlIHRhYiBwYW5lbCAoYC50YWJ6YCBlbGVtZW50KSB0aGF0J3MgaGFuZGxpbmcgdGhlIGNsaWNrIGV2ZW50LlxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgLSBUaGUgZWxlbWVudCB0aGF0IHJlY2VpdmVkIHRoZSBjbGljay5cbiAqIEByZXR1cm5zIHt1bmRlZmluZWR8RWxlbWVudH0gVGhlIGA8aGVhZGVyPmAgZWxlbWVudCAodGFiKSB0aGUgd2FzIGNsaWNrZWQ7IG9yIGB1bmRlZmluZWRgIHdoZW4gY2xpY2sgd2FzIG5vdCB3aXRoaW4gYSB0YWIuXG4gKi9cbmZ1bmN0aW9uIGNsaWNrKGRpdiwgdGFyZ2V0KSB7XG4gICAgdmFyIG5ld1RhYiwgb2xkVGFiO1xuXG4gICAgZm9yRWFjaEVsKCc6c2NvcGU+aGVhZGVyOm5vdCgudGFiei1lbmFibGUpJywgZnVuY3Rpb24odGFiKSB7IC8vIHRvZG86IHVzZSBhIC5maW5kKCkgcG9seWZpbGwgaGVyZVxuICAgICAgICBpZiAodGFiLmNvbnRhaW5zKHRhcmdldCkpIHtcbiAgICAgICAgICAgIG5ld1RhYiA9IHRhYjtcbiAgICAgICAgfVxuICAgIH0sIGRpdik7XG5cbiAgICBpZiAobmV3VGFiKSB7XG4gICAgICAgIG9sZFRhYiA9IHRoaXMuZW5hYmxlZFRhYihkaXYpO1xuICAgICAgICB0b2dnbGVUYWIuY2FsbCh0aGlzLCBvbGRUYWIsIGZhbHNlKTtcbiAgICAgICAgdG9nZ2xlVGFiLmNhbGwodGhpcywgbmV3VGFiLCB0cnVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3VGFiO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAdGhpcyBUYWJ6XG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhYiAtIFRoZSBgPGhlYWRlcj5gIGVsZW1lbnQgb2YgdGhlIHRhYiB0byBlbmFibGUgb3IgZGlzYWJsZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZW5hYmxlIC0gRW5hYmxlICh2cy4gZGlzYWJsZSkgdGhlIHRhYi5cbiAqL1xuZnVuY3Rpb24gdG9nZ2xlVGFiKHRhYiwgZW5hYmxlKSB7XG4gICAgaWYgKHRhYikge1xuICAgICAgICB2YXIgZm9sZGVyID0gdGhpcy5mb2xkZXIodGFiKSxcbiAgICAgICAgICAgIG1ldGhvZCA9IGVuYWJsZSA/ICdvbkVuYWJsZScgOiAnb25EaXNhYmxlJztcblxuICAgICAgICB0aGlzW21ldGhvZF0uY2FsbCh0aGlzLCB0YWIsIGZvbGRlcik7XG5cbiAgICAgICAgdGFiLmNsYXNzTGlzdC50b2dnbGUoJ3RhYnotZW5hYmxlJywgZW5hYmxlKTtcbiAgICAgICAgZm9sZGVyLmNsYXNzTGlzdC50b2dnbGUoJ3RhYnotZW5hYmxlJywgZW5hYmxlKTtcblxuICAgICAgICBtZXRob2QgKz0gJ2QnO1xuICAgICAgICB0aGlzW21ldGhvZF0uY2FsbCh0aGlzLCB0YWIsIGZvbGRlcik7XG4gICAgfVxufVxuXG4vKipcbiAqIEB0eXBlZGVmIHRhYkV2ZW50XG4gKiBAdHlwZSB7ZnVuY3Rpb259XG4gKiBAcGFyYW0ge3RhYkV2ZW50T2JqZWN0fVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYgdGFiRXZlbnRPYmplY3RcbiAqIEBwcm9wZXJ0eSB7VGFien0gdGFieiAtIFRoZSB0YWIgb2JqZWN0IGlzc3VpbmcgdGhlIGNhbGxiYWNrLlxuICogQHByb3BlcnR5IHtFbGVtZW50fSB0YXJnZXQgLSBUaGUgdGFiIChgPGhlYWRlcj5gIGVsZW1lbnQpLlxuICovXG5cbi8qKlxuICogQ2FsbGVkIGJlZm9yZSBhIHByZXZpb3VzbHkgZGlzYWJsZWQgdGFiIGlzIGVuYWJsZWQuXG4gKiBAdHlwZSB7dGFiRXZlbnR9XG4gKiBAYWJzdHJhY3RcbiAqIEBtZW1iZXJPZiBUYWJ6LnByb3RvdHlwZVxuICovXG5UYWJ6LnByb3RvdHlwZS5vbkVuYWJsZSA9IG5vb3A7XG5cbi8qKlxuICogQ2FsbGVkIGJlZm9yZSBhIHByZXZpb3VzbHkgZW5hYmxlZCB0YWIgaXMgZGlzYWJsZWQgYnkgYW5vdGhlciB0YWIgYmVpbmcgZW5hYmxlZC5cbiAqIEB0eXBlIHt0YWJFdmVudH1cbiAqIEBhYnN0cmFjdFxuICogQG1lbWJlck9mIFRhYnoucHJvdG90eXBlXG4gKi9cblRhYnoucHJvdG90eXBlLm9uRGlzYWJsZSA9IG5vb3A7XG5cbi8qKlxuICogQ2FsbGVkIGFmdGVyIGEgcHJldmlvdXNseSBkaXNhYmxlZCB0YWIgaXMgZW5hYmxlZC5cbiAqIEB0eXBlIHt0YWJFdmVudH1cbiAqIEBhYnN0cmFjdFxuICogQG1lbWJlck9mIFRhYnoucHJvdG90eXBlXG4gKi9cblRhYnoucHJvdG90eXBlLm9uRW5hYmxlZCA9IG5vb3A7XG5cbi8qKlxuICogQ2FsbGVkIGFmdGVyIGEgcHJldmlvdXNseSBlbmFibGVkIHRhYiBpcyBkaXNhYmxlZCBieSBhbm90aGVyIHRhYiBiZWluZyBlbmFibGVkLlxuICogQHR5cGUge3RhYkV2ZW50fVxuICogQGFic3RyYWN0XG4gKiBAbWVtYmVyT2YgVGFiei5wcm90b3R5cGVcbiAqL1xuVGFiei5wcm90b3R5cGUub25EaXNhYmxlZCA9IG5vb3A7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fSAvLyBudWxsIHBhdHRlcm5cblxuZnVuY3Rpb24gZm9yRWFjaEVsKHNlbGVjdG9yLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKChjb250ZXh0IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSwgaXRlcmF0ZWUpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gVGFiejtcbiIsIi8vIHRlbXBsZXggbm9kZSBtb2R1bGVcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvdGVtcGxleFxuXG4vKiBlc2xpbnQtZW52IG5vZGUgKi9cblxuLyoqXG4gKiBNZXJnZXMgdmFsdWVzIG9mIGV4ZWN1dGlvbiBjb250ZXh0IHByb3BlcnRpZXMgbmFtZWQgaW4gdGVtcGxhdGUgYnkge3Byb3AxfSxcbiAqIHtwcm9wMn0sIGV0Yy4sIG9yIGFueSBqYXZhc2NyaXB0IGV4cHJlc3Npb24gaW5jb3Jwb3JhdGluZyBzdWNoIHByb3AgbmFtZXMuXG4gKiBUaGUgY29udGV4dCBhbHdheXMgaW5jbHVkZXMgdGhlIGdsb2JhbCBvYmplY3QuIEluIGFkZGl0aW9uIHlvdSBjYW4gc3BlY2lmeSBhIHNpbmdsZVxuICogY29udGV4dCBvciBhbiBhcnJheSBvZiBjb250ZXh0cyB0byBzZWFyY2ggKGluIHRoZSBvcmRlciBnaXZlbikgYmVmb3JlIGZpbmFsbHlcbiAqIHNlYXJjaGluZyB0aGUgZ2xvYmFsIGNvbnRleHQuXG4gKlxuICogTWVyZ2UgZXhwcmVzc2lvbnMgY29uc2lzdGluZyBvZiBzaW1wbGUgbnVtZXJpYyB0ZXJtcywgc3VjaCBhcyB7MH0sIHsxfSwgZXRjLiwgZGVyZWZcbiAqIHRoZSBmaXJzdCBjb250ZXh0IGdpdmVuLCB3aGljaCBpcyBhc3N1bWVkIHRvIGJlIGFuIGFycmF5LiBBcyBhIGNvbnZlbmllbmNlIGZlYXR1cmUsXG4gKiBpZiBhZGRpdGlvbmFsIGFyZ3MgYXJlIGdpdmVuIGFmdGVyIGB0ZW1wbGF0ZWAsIGBhcmd1bWVudHNgIGlzIHVuc2hpZnRlZCBvbnRvIHRoZSBjb250ZXh0XG4gKiBhcnJheSwgdGh1cyBtYWtpbmcgZmlyc3QgYWRkaXRpb25hbCBhcmcgYXZhaWxhYmxlIGFzIHsxfSwgc2Vjb25kIGFzIHsyfSwgZXRjLiwgYXMgaW5cbiAqIGB0ZW1wbGV4KCdIZWxsbywgezF9IScsICdXb3JsZCcpYC4gKHswfSBpcyB0aGUgdGVtcGxhdGUgc28gY29uc2lkZXIgdGhpcyB0byBiZSAxLWJhc2VkLilcbiAqXG4gKiBJZiB5b3UgcHJlZmVyIHNvbWV0aGluZyBvdGhlciB0aGFuIGJyYWNlcywgcmVkZWZpbmUgYHRlbXBsZXgucmVnZXhwYC5cbiAqXG4gKiBTZWUgdGVzdHMgZm9yIGV4YW1wbGVzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZW1wbGF0ZVxuICogQHBhcmFtIHsuLi5zdHJpbmd9IFthcmdzXVxuICovXG5mdW5jdGlvbiB0ZW1wbGV4KHRlbXBsYXRlKSB7XG4gICAgdmFyIGNvbnRleHRzID0gdGhpcyBpbnN0YW5jZW9mIEFycmF5ID8gdGhpcyA6IFt0aGlzXTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHsgY29udGV4dHMudW5zaGlmdChhcmd1bWVudHMpOyB9XG4gICAgcmV0dXJuIHRlbXBsYXRlLnJlcGxhY2UodGVtcGxleC5yZWdleHAsIHRlbXBsZXgubWVyZ2VyLmJpbmQoY29udGV4dHMpKTtcbn1cblxudGVtcGxleC5yZWdleHAgPSAvXFx7KC4qPylcXH0vZztcblxudGVtcGxleC53aXRoID0gZnVuY3Rpb24gKGksIHMpIHtcbiAgICByZXR1cm4gJ3dpdGgodGhpc1snICsgaSArICddKXsnICsgcyArICd9Jztcbn07XG5cbnRlbXBsZXguY2FjaGUgPSBbXTtcblxudGVtcGxleC5kZXJlZiA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAoISh0aGlzLmxlbmd0aCBpbiB0ZW1wbGV4LmNhY2hlKSkge1xuICAgICAgICB2YXIgY29kZSA9ICdyZXR1cm4gZXZhbChleHByKSc7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBjb2RlID0gdGVtcGxleC53aXRoKGksIGNvZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGVtcGxleC5jYWNoZVt0aGlzLmxlbmd0aF0gPSBldmFsKCcoZnVuY3Rpb24oZXhwcil7JyArIGNvZGUgKyAnfSknKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1ldmFsXG4gICAgfVxuICAgIHJldHVybiB0ZW1wbGV4LmNhY2hlW3RoaXMubGVuZ3RoXS5jYWxsKHRoaXMsIGtleSk7XG59O1xuXG50ZW1wbGV4Lm1lcmdlciA9IGZ1bmN0aW9uIChtYXRjaCwga2V5KSB7XG4gICAgLy8gQWR2YW5jZWQgZmVhdHVyZXM6IENvbnRleHQgY2FuIGJlIGEgbGlzdCBvZiBjb250ZXh0cyB3aGljaCBhcmUgc2VhcmNoZWQgaW4gb3JkZXIuXG4gICAgdmFyIHJlcGxhY2VtZW50O1xuXG4gICAgdHJ5IHtcbiAgICAgICAgcmVwbGFjZW1lbnQgPSBpc05hTihrZXkpID8gdGVtcGxleC5kZXJlZi5jYWxsKHRoaXMsIGtleSkgOiB0aGlzWzBdW2tleV07XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXBsYWNlbWVudCA9ICd7JyArIGtleSArICd9JztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVwbGFjZW1lbnQ7XG59O1xuXG4vLyB0aGlzIGludGVyZmFjZSBjb25zaXN0cyBzb2xlbHkgb2YgdGhlIHRlbXBsZXggZnVuY3Rpb24gKGFuZCBpdCdzIHByb3BlcnRpZXMpXG5tb2R1bGUuZXhwb3J0cyA9IHRlbXBsZXg7XG4iXX0=
