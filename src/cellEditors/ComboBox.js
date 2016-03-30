// ComboBox.js - A combo-box is a combination of a text-box and a drop-down.
// User may type into it and/or select an item from the drop-down (by clicking on the triangle at the right).

/* eslint-env browser */

'use strict';

var onTransitionEnd = require('../lib/queueless');
var Simple = require('./Simple');
var Textfield = require('./Textfield');

/**
 * @constructor
 */
var ComboBox = Textfield.extend('ComboBox', {

    template: function() {
/*
    <div class="hypergrid-input">
        <input id="editor">
        <div></div>
        <select size="8"></select>
    </div>
*/
    },

    initializeInput: function(element) {
        var children = element.children,
            input = children[0],
            icon = children[1],
            menu = children[2],
            ms = menu.style,
            transit = onTransitionEnd(menu, 'menu', this);

        icon.addEventListener('mousedown', function(e) {
            e.preventDefault(); // avoid the default mousedown on grid that removes the editor!

            if (transit()) {
                return; // don't interrupt a transition in progress
            }

            if (window.getComputedStyle(menu).visibility === 'hidden') {
                ms.visibility = 'visible';
                ms.height = '124px';
                transit(null);
            } else {
                ms.height = 0;
                transit(function() {
                    ms.visibility = 'hidden';
                });
            }
        });

        Simple.prototype.initializeInput.call(this, input);
    },

    getInputControl: function() {
        return this.getInput().firstElementChild;
    },

    keyup: function(e) {
        if (e) {
            Simple.prototype.keyup.call(this, e);

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

module.exports = ComboBox;
