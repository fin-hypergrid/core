'use strict';

var CellEditor = require('./CellEditor.js');

/**
 * @constructor
 */
var Simple = CellEditor.extend('Simple', {

    /**
     * my lookup alias
     * @type {string}
     * @memberOf Simple.prototype
     */
    alias: 'simple',

    /**
     * @memberOf Simple.prototype
     */
    initialize: function() {
        this.editorPoint = {
            x: 0,
            y: 0
        };
    },

    /**
     * @memberOf Simple.prototype
     * @desc  the function to override for initialization
     */
    initializeInput: function(input) {
        var self = this;
        input.addEventListener('keyup', function(e) {
            if (e && (e.keyCode === 13 || e.keyCode === 27 || e.keyCode === 8)) {
                e.preventDefault();
                if (e.keyCode === 8) {
                    self.clearStopEditing();
                } else if (e.keyCode === 27) {
                    self.cancelEditing();
                } else {
                    self.stopEditing();
                }
                self.getGrid().repaint();
                self.getGrid().takeFocus();
            }
            self.getGrid().fireSyntheticEditorKeyUpEvent(self, e);
        });
        input.addEventListener('keydown', function(e) {
            self.getGrid().fireSyntheticEditorKeyDownEvent(self, e);
        });
        input.addEventListener('keypress', function(e) {
            console.log('keypress', e.keyCode);
            self.getGrid().fireSyntheticEditorKeyPressEvent(self, e);
        });
        // input.addEventListener('focusout', function() {
        //     self.stopEditing();
        // });
        // input.addEventListener('blur', function() {
        //     self.stopEditing();
        // });
        input.style.position = 'absolute';
        input.style.display = 'none';
        input.style.border = 'solid 2px black';
        input.style.outline = 0;
        input.style.padding = 0;
        input.style.zIndex = 1000;
        input.style.fontSize = '8pt';
        input.style.boxShadow = 'white 0px 0px 1px 1px';
    },

    /**
     * @memberOf Simple.prototype
     * @returns {object} the current editor's value
     */
    getEditorValue: function() {
        var value = this.getInput().value;
        return value;
    },

    /**
     * @memberOf Simple.prototype
     * @desc save the new value into the behavior(model)
     */
    setEditorValue: function(value) {
        this.getInput().value = value + '';
    },

    clearStopEditing: function() {
        this.setEditorValue('');
        this.stopEditing();
    },

    cancelEditing: function() {
        if (!this.isEditing) {
            return;
        }
        this.getInput().value = null;
        this.isEditing = false;
        this.hideEditor();
    },

    /**
     * @memberOf Simple.prototype
     * @desc display the editor
     */
    showEditor: function() {
        this.getInput().style.display = 'inline';
    },

    /**
     * @memberOf Simple.prototype
     * @desc hide the editor
     */
    hideEditor: function() {
        this.getInput().style.display = 'none';
    },

    /**
     * @memberOf Simple.prototype
     * @desc request focus for my input control
     */
    takeFocus: function() {
        var self = this;
        setTimeout(function() {
            self.input.focus();
            self.selectAll();
        }, 300);
    },

    /**
     * @memberOf Simple.prototype
     * @desc select everything
     */
    selectAll: function() {

    },

    /**
     * @memberOf Simple.prototype
     * @desc how much should I offset my bounds from 0,0
     */
    originOffset: function() {
        return [0, 0];
    },

    /**
     * @memberOf Simple.prototype
     * @desc set the bounds of my input control
     * @param {rectangle} rectangle - the bounds to move to
     */
    setBounds: function(cellBounds) {
        var originOffset = this.originOffset();
        var translation = 'translate('
            + (cellBounds.x - 1 + originOffset[0]) + 'px,'
            + (cellBounds.y - 1 + originOffset[1]) + 'px)';

        this.getInput().style.webkitTransform = translation;
        this.getInput().style.MozTransform = translation;
        this.getInput().style.msTransform = translation;
        this.getInput().style.OTransform = translation;

        // this.getInput().style.left = cellBounds.x + originOffset[0] + 'px';
        // this.getInput().style.top = cellBounds.y + originOffset[1] + 'px';

        this.getInput().style.width = (cellBounds.width + 2) + 'px';
        this.getInput().style.height = (cellBounds.height + 2) + 'px';
        //var xOffset = this.grid.canvas.getBoundingClientRect().left;
    }

});

module.exports = Simple;
