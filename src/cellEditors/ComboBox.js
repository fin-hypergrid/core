// ComboBox.js - A combo-box is a cobmination of a textbox and a drop-down.
// User may type into it and/or select an item from the drop-down (by clicking on the triangle at the right).

'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var ComboBox = Simple.extend('ComboBox', {

    template: function() {
        /*
            <input id="editor">
        */
    },

    initializeInput: function(input) {
        Simple.prototype.initializeInput.call(this, input);

        input.style.borderRight = null;
    },

    setBounds: function(cellBounds) {
        var input = this.getInput();

        Simple.prototype.setBounds.call(this, cellBounds);

        input.style.width = cellBounds.width - 22 + 'px';
    },

    selectAll: function() {
        this.input.setSelectionRange(0, this.input.value.length);
    },

    specialKeyups: {
        0x09: 'stopEditing', // tab
        0x0d: 'stopEditing', // return/enter
        0x1b: 'cancelEditing' // escape
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
