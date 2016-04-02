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
            var columns = this.grid.behavior.columns;
            columns.forEach(function(column) {
                var name = column.getField(),
                    option = new Option(name);
                option.title = '[' + name + ']\r"' + column.getHeader() + '"';
                optgroup.appendChild(option);
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
            <select size="8"></select>
        </div>
    </div>
*/
    },

    updateElement: function() {
        var filter = this.grid.getGlobalFilter(),
            columnName = this.columnName = this.grid.behavior.columns[this.editorPoint.x].getField();

        // look in the filter, under column filters, for a column filter for this column
        var columnFilters = this.grid.getGlobalFilter().columnFilters,
            columnFilterSubtree = columnFilters.children.find(function(subtree) {
                return subtree.children[0].column === columnName;
            });

        // the column filter may not exist yet, so we pull its operator list from the root instead
        var column = filter.schema.findItem(columnName),
            opMenu = column && column.opMenu ||
                column && column.type && filter.typeOpMenu && filter.typeOpMenu[column.type] ||
                filter.treeOpMenu;

        // override the template's empty drop-down with a new one built from opMenu (the column's operator list)
        var olddrop = this.dropdown,
            dropdown = this.dropdown = popMenu.build(olddrop, opMenu, {
                //group: function(groupName) { return FilterTree.Conditionals.groups[groupName]; },
                prompt: null
            });

        // for menuModes object, refer to the column filter node when it exists yet; else the parent node
        var menuModes = this.menuModes = (columnFilterSubtree || columnFilters).menuModes;

        // locate the mode icon container element
        var modesContainer = this.options.querySelector('.toggle-mode-operators').parentElement;

        // set the initial state of the mode toggles

        for (var modeName in modes) {
            // create and label a new optgroup
            var optgroup = document.createElement('optgroup');
            optgroup.label = modes[modeName].label;

            // wire-ups
            modesContainer.addEventListener('click', onModeIconClick.bind(this));

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

            setModeIconAndOptgroup.call(this, ctrl, modeName, modeState);
        }

        dropdown.size = olddrop.size;
        this.el.replaceChild(dropdown, olddrop);
    },

    intializeEl: function() {
        var el = this.el;

        this.input = el.querySelector('input');
        this.dropper = el.querySelector('span');
        this.options = el.querySelector('div');
        this.dropdown = this.options.querySelector('select');

        if (this.updateElement) {
            this.updateElement.call(this, el);
        }

        this.transit = onTransitionEnd(this.options, 'options', this);

        // wire-ups
        this.dropper.addEventListener('mousedown', toggleDropDown.bind(this));
        this.dropdown.addEventListener('change', insertText.bind(this));

        // default wire-ups for text box
        prototype.intializeEl.call(this, el);
        el.onblur = null; // but not this one
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
