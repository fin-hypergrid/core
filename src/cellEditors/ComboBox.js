// ComboBox.js - A combo-box is a combination of a text-box and a drop-down.
// User may type into it and/or select an item from the drop-down (by clicking on the triangle at the right).

/* eslint-env browser */

'use strict';

var onTransitionEnd = require('../lib/queueless');
var prototype = require('./Simple').prototype;
var elfor = require('../lib/elfor');

var Textfield = require('./Textfield');

var popMenu = require('pop-menu'); //temp

/*********************************/
/* eslint-disable no-unused-vars */
/*********************************/

var TOGGLE_MODE_PREFIX = 'toggle-mode-';

var modes = {
    operators: {
        label: 'Conjunctions',
        selector: 'optgroup:not([class])' // all optgroups with no value for class attribute
    },

    distinctValues: {
        label: 'Distinct Values',
        selector: 'optgroup.submenu-distinctValues',
        appendOptions: function(optgroup) {
            // get the distinct column values and sort them
            var distinct = {},
                d = [],
                columnName = this.columnName;

            this.grid.behavior.getFilteredData().forEach(function(dataRow) {
                var val = dataRow[columnName];
                distinct[val] = (distinct[val] || 0) + 1;
            });

            for (var key in distinct) {
                d.push(key);
            }

            d.sort().forEach(function(val) {
                var option = new Option(val + ' (' + distinct[val] + ')', val);
                optgroup.appendChild(option);
            });

            return d.length;
        }
    },

    columnNames: {
        label: 'Column Names',
        selector: 'optgroup.submenu-columnNames',
        appendOptions: function(optgroup) {
            var columns = this.grid.behavior.columns,
                x = this.editorPoint.x;
            columns.forEach(function(column, index) {
                if (index !== x) {
                    var name = column.getField(),
                        option = new Option(name);
                    option.title = '[' + name + ']\r"' + column.getHeader() + '"';
                    optgroup.appendChild(option);
                }
            });
            return columns.length;
        }
    }
};


/**
 * @constructor
 */
var ComboBox = Textfield.extend('ComboBox', {

    template: function() {
/*
    <div class="hypergrid-input" title="">
        <input>
        <span title="Click for options"></span>
        <div>
            <div>
                <span class="toggle-mode-operators" title="Toggle operators"></span>
                <span class="toggle-mode-distinctValues" title="Toggle distinct values"></span>
                <span class="toggle-mode-columnNames" title="Toggle column names"></span>
            </div>
            <select size="12"></select>
        </div>
    </div>
*/
    },

    /**
     * A combo box is a text box that also has a drop-down containing options. THe drop-down consists of an actual drop-down list (a `<select>` list) and a _control area_ containing buttons.
     *
     * The select list consists of the following sets of drop-down items:
     * * `operators` (icon *&lt;*) The particular selection of operators for this column. Comes from the filter tree.
     * * `distinctValues` (icon *#*) List of distinct column values. Calculated from inspection of column values on _and_ on icon click.
     * * `columnNames` (icon *T*) List other column names. Calculated from inspection of column values on _and_ on icon click.
     *
     * The control area reflects the `modes` array (above). It is modeled by a 'menuModes` object, a hash with boolean properties representing the state of each of the sets of menu items outlined above. Missing properties are falsy by implication. The state semantics are:
     *   * `1` or `true` means adds CSS class `active` to icon _and_ shows set's items in drop-down.
     *   * `0` or `false` means removes (CSS class `active` from icon _and_ hides set's items in drop-down.
     *
     * *Persisting changes:* The only change this UI supports (besides the filter text itself) is the menu mode states, which are expected to be "sticky." That is, they are "persisted" (written back) to the filter. However, there is a problem: When the column filter is blank it doesn't actually exist yet in the filter, so there is nowhere to save it. The solution is to read the `menuModes` hash _from_ the filter tree but don't modify it until end of editing. Reading it from the filter tree picks up previous setting if there was an extant column filter or the default if there was not. But then, rather than modifying this structure (because it might be the default and we don't want to overwrite that), we hang a proxy copy off the behavior's column object for this column. This will persist it for the duration of the app session. At end of editing, if and only if there is now a column filter (text is not blank), we copy it to the column filter's subtree node in the filter tree.
     */
    showEditor: function() {
        var filter = this.grid.getGlobalFilter(),
            column = this.column = this.grid.behavior.columns[this.editorPoint.x],
            columnName = this.columnName = column.getField(),
            modeNames = Object.keys(modes),
            self = this;

        // look in the filter, under column filters, for a column filter for this column
        var columnFilters = this.grid.getGlobalFilter().columnFilters,
            columnFilterSubtree = columnFilters.children.find(function(subtree) {
                return subtree.children[0].column === columnName;
            });

        // get the column filter's `operators` list
        var columnSchema = filter.schema.findItem(columnName), // as column filter may not yet exist, refer to it's schema
            opMenu = columnSchema && ( // schema should exist
                columnSchema.opMenu || // pull operator list from column schema if it has one; IF it doesn't...
                columnSchema.type &&  // BUT it has a type...
                filter.typeOpMenu && // AND the filter has a defined type-operator map...
                filter.typeOpMenu[columnSchema.type] // THEN use the operator list for the column's type if there is one
            ) || // if both of above strategies fail...
                filter.treeOpMenu; // use the default operator list (which itself defaults to `Conditionals.defaultOpMenu`)

        // get the column filter's `menuModes` object -- contains the states of the drop-down option icons
        var menuModesSource =
            column.menuModes || // (1) use proxy from last time (editing ended without a column filter to put in the filter tree)
            columnFilterSubtree && columnFilterSubtree.menuModes || // (2) use column filter's `menuModes` WHEN available
            columnSchema && columnSchema.menuModes || // ELSE (3) use column schema's `menuModes` when defined
            columnFilters.menuModes; // ELSE (4) use the filter default (which itself defaults to operators ON, others OFF; see definition at top of CustomFilter.js)

        var menuModes = this.menuModes = column.menuModes = {};

        // build the proxy
        modeNames.forEach(function(modeName) {
            if (modeName in menuModesSource) {
                menuModes[modeName] = menuModesSource[modeName];
            }
        });

        // override the template's empty drop-down with a new one built from opMenu (the column's operator list)
        var olddrop = this.dropdown,
            dropdown = this.dropdown = popMenu.build(olddrop, opMenu, {
                //group: function(groupName) { return FilterTree.Conditionals.groups[groupName]; },
                prompt: null
            });

        // locate the mode icon container element
        var modesContainer = this.options.querySelector('.toggle-mode-operators').parentElement;

        // set the initial state of the mode toggles

        modeNames.forEach(function(modeName) {
            // create and label a new optgroup
            var optgroup = document.createElement('optgroup');
            optgroup.label = modes[modeName].label;

            // wire-ups
            modesContainer.addEventListener('click', onModeIconClick.bind(self));

            // build the optgroup
            if (modeName === 'operators') {
                // Miscellaneous operator optgroups come along with the menu build above and vary per column.
                // This list of conjunctions is an extra and is for all columns. All operator optgroups are classless.
                optgroup.appendChild(new Option('and', ' and '));
                optgroup.appendChild(new Option('or', ' or '));
                optgroup.appendChild(new Option('nor', ' nor '));
            } else {
                optgroup.className = 'submenu-' + modeName;
            }

            dropdown.add(optgroup);

            var className = '.' + TOGGLE_MODE_PREFIX + modeName,
                ctrl = modesContainer.querySelector(className),
                modeState = menuModes[modeName];

            setModeIconAndOptgroup.call(self, ctrl, modeName, modeState);
        });

        dropdown.size = olddrop.size;
        this.el.replaceChild(dropdown, olddrop);

        prototype.showEditor.call(this);
    },

    /**
     * Write the `menuModes` proxy to the filter tree's column filter subtree node.
     * We look up the node again here because it might be new; or may have been deleted & recreated during editing.
     */
    hideEditor: function() {
        // look in the filter, under column filters, for a column filter for this column
        var columnFilters = this.grid.getGlobalFilter().columnFilters,
            columnName = this.columnName,
            columnFilterSubtree = columnFilters.children.find(function(subtree) {
                return subtree.children[0].column === columnName;
            });

        if (columnFilterSubtree) {
            columnFilterSubtree.menuModes = this.column.menuModes;
            delete this.column.menuModes;
        }

        prototype.hideEditor.call(this);
    },

    initialize: function() {
        var el = this.el;

        this.input = el.querySelector('input');
        this.dropper = el.querySelector('span');
        this.options = el.querySelector('div');
        this.dropdown = this.options.querySelector('select');

        this.transit = onTransitionEnd(this.options, 'options', this);

        // wire-ups
        this.dropper.addEventListener('mousedown', toggleDropDown.bind(this));
        this.dropdown.addEventListener('mousewheel', function(e) { e.stopPropagation(); });
        this.dropdown.addEventListener('change', insertText.bind(this));
        el.onblur = null; // void this one, set by super's initialize
    },

    /* following moved to bottom of file because extend-me does not properly accept getters yet :(

    get input() {
        return this.el.firstElementChild;
    },

    */

    keyup: function(e) {
        if (e) {
            prototype.keyup.call(this, e);

            if (this.grid.isFilterRow(this.getEditorPoint().y)) {
                setTimeout(keyup.bind(this));
            }
        }
    }
});

function keyup() {
    this.saveEditorValue();
    this._moveEditor();
}

var stateToActionMap = {
    hidden: slideDown,
    visible: slideUp
};

function onModeIconClick(e) {
    var ctrl = e.target;

    // extract the mode name from the toggle control's class name
    var modeClassName = Array.prototype.find.call(ctrl.classList, function(className) {
            return className.indexOf(TOGGLE_MODE_PREFIX) === 0;
        }),
        modeName = modeClassName.substr(TOGGLE_MODE_PREFIX.length);

    // toggle mode in the filter
    var modeState = this.menuModes[modeName] ^= 1;

    setModeIconAndOptgroup.call(this, ctrl, modeName, modeState);
}

function setModeIconAndOptgroup(ctrl, name, state) {
    var mode = modes[name],
        displayMode = state ? null : 'none';

    // set icon state (color)
    ctrl.classList.toggle('active', !!state);

    // empty the optgroup if hiding; rebuild it if showing
    if (mode.appendOptions) {
        var optgroup = this.dropdown.querySelector(mode.selector);

        if (state) { // rebuild it
            // show progress cursor for (at least) 1/3 second
            var style = this.el.style;
            style.cursor = 'progress';
            setTimeout(function() { style.cursor = null; }, 333);

            var sum = mode.appendOptions.call(this, optgroup);

            // update sum
            optgroup.label = optgroup.label.replace(/ \(\d+\)$/, ''); // remove old sum
            optgroup.label += ' (' + sum + ')';
        } else { // empty it
            while (optgroup.firstElementChild) {
                optgroup.firstElementChild.remove();
            }
        }
    }

    // set optgroup state (hide/show)
    elfor.each(
        mode.selector,
        function(el) { el.style.display = displayMode; },
        this.dropdown
    );

    // TODO: Reset the width of this.options to the natural width of this.dropdown. To do this, we need to remove the latter's "width: 100%" from the CSS and then set an explicity this.options.style.width based on the computed with of this.dropdown. (There will be issues with this if we try to do it before it is in the DOM.)
}

function toggleDropDown() {
    var transitionInProgress = this.transit();

    if (!transitionInProgress) {
        var state = window.getComputedStyle(this.dropdown).visibility;
        stateToActionMap[state].call(this);
    }
}

function slideDown() {
    // preserve the text box's current text selection, which is about to be lost
    this.selectionStart = this.input.selectionStart;
    this.selectionEnd = this.input.selectionEnd;

    // clean up the select list from last usage
    this.dropdown.style.selectedIndex = -1; // be kind (remove previous selection)
    this.dropdown.style.scrollTop = 0; // rewind

    // show the drop-down slide down effect
    this.options.style.visibility = 'visible';
    var dropDownHeight = this.dropdown.size * 15;
    this.options.style.height = 2 + 15 + dropDownHeight + 2 + 'px'; // starts the slide down effect

    // while in drop-down, listen for clicks in text box which means abprt
    this.input.addEventListener('mousedown', this.slideUpBound = slideUp.bind(this));

    // schedule the transition flag
    this.transit(null);
}

function slideUp() {
    // stop listening to input clicks
    this.input.removeEventListener('mousedown', this.slideUpBound);

    // start the slide up effect
    this.options.style.height = 0;

    // schedule the hide to occur after the slide up effect
    this.transit(function(el) {
        el.style.visibility = 'hidden';
    });
}

function insertText(e) {
    // insert the text at the insertion point or over the selected text
    this.input.focus();
    this.input.setRangeText(this.dropdown.value, this.selectionStart, this.selectionEnd, 'end');

    // close the drop-down
    toggleDropDown.call(this);
}


module.exports = ComboBox;
