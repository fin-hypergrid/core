// ComboBox.js - A combo-box is a combination of a text-box and a drop-down.
// User may type into it and/or select an item from the drop-down (by clicking on the triangle at the right).

/* eslint-env browser */

'use strict';

var onTransitionEnd = require('../lib/queueless');
var prototype = require('./Simple').prototype;
var Textfield = require('./Textfield');

var popMenu = require('pop-menu'); //temp

/*********************************/
/* eslint-disable no-unused-vars */
/*********************************/

var DISTINCT_VALUES = 'Distinct values';
var TOGGLE_MODE_PREFIX = 'toggle-mode-';

/**
 * @constructor
 */
var ComboBox = Textfield.extend('ComboBox', {

    template: function() {
/*
    <div class="hypergrid-input">
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

    updateElement: function(element) {
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

        var optgroup = document.createElement('optgroup'),
            option = new Option('Click to load', 'load');

        optgroup.label = 'Conjunctions';
        ['and', 'or', 'nor'].forEach(function(op) {
            optgroup.appendChild(new Option(op, ' ' + op + ' '));
        });
        dropdown.add(optgroup);

        optgroup = document.createElement('optgroup');
        optgroup.label = DISTINCT_VALUES;
        option.innerHTML += '&hellip;';
        optgroup.appendChild(option);
        dropdown.add(optgroup);

        dropdown.size = olddrop.size;

        // for menuModes object, refer to the column filter node when it exists yet; else the parent node
        var menuModes = this.menuModes = (columnFilterSubtree || columnFilters).menuModes;

        // set the initial state of the mode toggles
        this.modesContainer = this.options.querySelector('div');
        for (var modeName in menuModes) {
            if (menuModes[modeName]) {
                var className = '.' + TOGGLE_MODE_PREFIX + modeName;
                this.modesContainer.querySelector(className).classList.add('active');
            }
        }

        // wire-ups
        this.modesContainer.addEventListener('click', toggleModes.bind(this));

        element.replaceChild(dropdown, olddrop);
    },

    initializeInput: function(element) {
        this.textbox = element.querySelector('input');
        this.dropper = element.querySelector('span');
        this.options = element.querySelector('div');
        this.dropdown = this.options.querySelector('select');

        if (this.updateElement) {
            this.updateElement.call(this, element);
        }

        this.transit = onTransitionEnd(this.options, 'options', this);

        // wire-ups
        this.dropper.addEventListener('mousedown', toggleDropDown.bind(this));
        this.dropdown.addEventListener('change', insertText.bind(this));

        // default wire-ups for text box
        prototype.initializeInput.call(this, element);
        element.onblur = null; // but not this one
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

Object.defineProperty(ComboBox.prototype, 'input', {
    get: function input() {
        return this.el.firstElementChild;
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

function toggleModes(e) {
    var ctrl = e.target;

    // extract the mode name from the toggle control's class name
    var modeName = Array.prototype.find.call(ctrl.className, function(className) {
        return className.substr(0, TOGGLE_MODE_PREFIX.length) === TOGGLE_MODE_PREFIX;
    });

    // toggle mode in the filter
    var modeState = this.menuModes[modeName] ^= 1;

    // color me toggled
    ctrl.classList.toggle('active', modeState);
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
    this.selectionStart = this.textbox.selectionStart;
    this.selectionEnd = this.textbox.selectionEnd;

    // clean up the select list from last usage
    this.dropdown.style.selectedIndex = -1; // be kind (remove previous selection)
    this.dropdown.style.scrollTop = 0; // rewind

    // show the drop-down slide down effect
    this.options.style.visibility = 'visible';
    var dropDownHeight = this.dropdown.size * 15;
    this.options.style.height = 2 + 15 + dropDownHeight + 2 + 'px'; // starts the slide down effect

    // while in drop-down, listen for clicks in text box which means abprt
    this.textbox.addEventListener('mousedown', this.slideUpBound = slideUp.bind(this));

    // schedule the transition flag
    this.transit(null);
}

function slideUp() {
    // stop listening to textbox clicks
    this.textbox.removeEventListener('mousedown', this.slideUpBound);

    // start the slide up effect
    this.options.style.height = 0;

    // schedule the hide to occur after the slide up effect
    this.transit(function(el) {
        el.style.visibility = 'hidden';
    });
}

function insertText(e) {
    var dd = this.dropdown, ds = dd.style;

    if (dd.value === 'load') {
        // make sure we show progress cursor for at least 1/3 second
        ds.cursor = 'progress';
        setTimeout(function() { ds.cursor = null; }, 333);

        // find the "distinct values" option group
        var optGroup = dd.querySelector('optgroup[label="' + DISTINCT_VALUES + '"]');

        // remove the "click to load" option
        optGroup.firstElementChild.remove();

        // get the distinct column values and sort them
        var distinct = {}, d = [], columnName = this.columnName;
        this.grid.behavior.getFilteredData().forEach(function(dataRow) {
            var val = dataRow[columnName];
            distinct[val] = (distinct[val] || 0) + 1;
        });
        for (var key in distinct) {
            d.push(key);
        }
        d.sort().forEach(function(val) {
            optGroup.appendChild(new Option(val + ' (' + distinct[val] + ')', val));
        });

        // scroll down 6 lines so optgroup label moves to top
        dd.scrollTop += 6 / dd.size * dd.getBoundingClientRect().height;
    } else {
        // insert the text at the insertion point or over the selected text
        this.textbox.focus();
        this.textbox.setRangeText(dd.value, this.selectionStart, this.selectionEnd, 'end');

        // close the drop-down
        toggleDropDown.call(this);
    }
}


module.exports = ComboBox;
