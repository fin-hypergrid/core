// ComboBox.js - A combo-box is a combination of a text-box and a drop-down.
// User may type into it and/or select an item from the drop-down (by clicking on the triangle at the right).
// The drop-down has sections which are toggled from a control area between the text-box and the drop-down.

/* eslint-env browser */

'use strict';

var Textfield = require('./Textfield');
var prototype = require('./CellEditor').prototype;
var Queueless = require('../lib/queueless');
var elfor = require('../lib/elfor');

/*********************************/
/* eslint-disable no-unused-vars */
/*********************************/

var TOGGLE_MODE_PREFIX = 'toggle-mode-';

var stateToActionMap = {
    hidden: slideDown,
    visible: slideUp
};

/**
 * A combo box is a text box that also has a drop-down containing options. The drop-down consists of an actual drop-down list (a `<select>` list) plus a _control area_ above it containing toggles. The toggles control the visibility of the various "mode lists."
 *
 * Functions well in Chrome, Safari, Firefox, and Internet Explorer.
 * @constructor
 */
var ComboBox = Textfield.extend('ComboBox', {

    initialize: function() {
        var el = this.el;

        this.input = el.querySelector('input');
        this.dropper = el.querySelector('span');
        this.options = el.querySelector('div');
        this.controls = this.options.querySelector('div');
        this.dropdown = this.options.querySelector('select');

        this.controllable = this.modes.length > 1;

        // set up a transition end controller
        this.optionsTransition = new Queueless(this.options, this);

        // wire-ups
        this.dropper.addEventListener('mousedown', this.toggleDropDown.bind(this));
        this.dropdown.addEventListener('mousewheel', function(e) { e.stopPropagation(); });
        this.dropdown.addEventListener('change', this.insertText.bind(this));
        el.onblur = null; // void this one, set by super's initialize
    },

    template: [
'<div class="hypergrid-input" title="">',
'    <input type="text" lang="{{locale}}" style="{{style}}">',
'    <span title="Click for options"></span>',
'    <div>',
'        <div></div>',
'        <select size="12" lang="{{locale}}"></select>',
'    </div>',
'</div>'
    ].join('\n'),

    beginEditAt: function(point) {
        this.column = this.grid.behavior.columns[point.x];
        this.menuModesSource = this.column.menuModes || { distinctValues: true };
        prototype.beginEditAt.call(this, point);
    },

    modes: [
        {
            name: 'distinctValues',
            appendOptions: function(optgroup) {
                // get the distinct column values and sort them
                var distinct = {},
                    d = [],
                    columnName = this.column.name,
                    formatter = this.column.getFormatter();

                this.grid.behavior.getData().forEach(function(dataRow) {
                    var val = formatter(dataRow[columnName]);
                    distinct[val] = (distinct[val] || 0) + 1;
                });

                for (var key in distinct) {
                    d.push(key);
                }

                while (optgroup.firstElementChild) {
                    optgroup.firstElementChild.remove();
                }

                d.sort().forEach(function(val) {
                    var option = new Option(val + ' (' + distinct[val] + ')', val);
                    optgroup.appendChild(option);
                });

                return d.length;
            }
        }
    ],

    showEditor: function() {
        var menuModesSource = this.menuModesSource,
            menuModes = this.menuModes = {};

        // build the proxy
        this.modes.forEach(function(mode) {
            var modeName = mode.name;
            if (modeName in menuModesSource) {
                menuModes[modeName] = menuModesSource[modeName];
            }
        });

        // wire-ups
        if (this.controllable) {
            this.controls.addEventListener('click', onModeIconClick.bind(this));
        }

        // set the initial state of the mode toggles
        this.modes.forEach(function(mode) {
            // create a toggle
            var toggle = document.createElement('span');
            if (this.controllable) {
                toggle.className = TOGGLE_MODE_PREFIX + mode.name;
                toggle.title = 'Toggle ' + (mode.label || mode.name).toLowerCase();
                toggle.textContent = mode.symbol;
            }
            this.controls.appendChild(toggle);

            // create and label a new optgroup
            if (mode.selector) {
                var optgroup = document.createElement('optgroup');
                optgroup.label = mode.label;
                optgroup.className = 'submenu-' + mode.name;
                optgroup.style.backgroundColor = mode.backgroundColor;
                this.dropdown.add(optgroup);
            }

            setModeIconAndOptgroup.call(this, toggle, mode.name, menuModes[mode.name]);
        }.bind(this));

        prototype.showEditor.call(this);
    },

    hideEditor: function() {
        // this is where you would persist this.menuModes
        prototype.hideEditor.call(this);
    },

    toggleDropDown: function() {
        if (!this.optionsTransition.transitioning) {
            var state = window.getComputedStyle(this.dropdown).visibility;
            stateToActionMap[state].call(this);
        }
    },

    insertText: function(e) {
        // replace the input text with the drop-down text
        this.input.focus();
        this.input.value = this.dropdown.value;
        this.input.setSelectionRange(0, this.input.value.length);

        // close the drop-down
        this.toggleDropDown();
    }
});

function onModeIconClick(e) {
    var ctrl = e.target;

    if (ctrl.tagName === 'SPAN') {
        // extra ct the mode name from the toggle control's class name
        var modeClassName = Array.prototype.find.call(ctrl.classList, function(className) {
                return className.indexOf(TOGGLE_MODE_PREFIX) === 0;
            }),
            modeName = modeClassName.substr(TOGGLE_MODE_PREFIX.length);

        // toggle mode in the filter
        var modeState = this.menuModes[modeName] ^= 1;

        setModeIconAndOptgroup.call(this, ctrl, modeName, modeState);
    }
}

function setModeIconAndOptgroup(ctrl, name, state) {
    var style, optgroup, sum, display,
        mode = this.modes.find(function(mode) { return mode.name === name; }); // eslint-disable-line no-shadow

    // set icon state (color)
    ctrl.classList.toggle('active', !!state);

    // empty the optgroup if hiding; rebuild it if showing
    if (state) { // rebuild it
        // show progress cursor for (at least) 1/3 second
        style = this.el.style;
        style.cursor = 'progress';
        setTimeout(function() { style.cursor = null; }, 333);

        if (mode.selector) {
            optgroup = this.dropdown.querySelector(mode.selector);
            sum = mode.appendOptions.call(this, optgroup);

            // update sum
            optgroup.label = optgroup.label.replace(/ \(\d+\)$/, ''); // remove old sum
            optgroup.label += ' (' + sum + ')';
        } else {
            sum = mode.appendOptions.call(this, this.dropdown);
            if (!this.controllable) {
                ctrl.textContent = sum + ' values';
            }
        }

        display = null;
    } else {
        display = 'none';
    }

    // hide/show the group
    elfor.each(
        mode.selector || ':scope>option,:scope>optgroup:not([class])',
        function iteratee(el) { el.style.display = display; },
        this.dropdown
    );

    // TODO: Reset the width of this.options to the natural width of this.dropdown. To do this, we need to remove the latter's "width: 100%" from the CSS and then set an explicit this.options.style.width based on the computed width of this.dropdown. This is complicated by the fact that it cannot be done before it is in the DOM.
}

function slideDown() {
    // preserve the text box's current text selection, which is about to be lost
    this.selectionStart = this.input.selectionStart;
    this.selectionEnd = this.input.selectionEnd;

    // clean up the select list from last usage
    this.dropdown.selectedIndex = -1; // be kind (remove previous selection)
    this.dropdown.style.scrollTop = 0; // rewind

    // show the drop-down slide down effect
    this.options.style.visibility = 'visible';
    var dropDownHeight = this.dropdown.size * 15;
    this.options.style.height = 2 + 15 + dropDownHeight + 2 + 'px'; // starts the slide down effect

    // while in drop-down, listen for clicks in text box which means abprt
    this.input.addEventListener('mousedown', this.slideUpBound = slideUp.bind(this));

    // wait for transition to end
    this.optionsTransition.begin();
}

function slideUp() {
    // stop listening to input clicks
    this.input.removeEventListener('mousedown', this.slideUpBound);

    // start the slide up effect
    this.options.style.height = 0;

    // schedule the hide to occur after the slide up effect
    this.optionsTransition.begin(function(event) {
        this.style.visibility = 'hidden';
    });
}


module.exports = ComboBox;
