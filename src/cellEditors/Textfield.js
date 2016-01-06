'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Textfield = Simple.extend('Textfield', {

    /**
     * my lookup alias
     * @type {string}
     * @memberOf Textfield.prototype
     */
    alias: 'textfield',

    template: function() {
        /*
            <input id="editor">
        */
    },

    selectAll: function() {
        this.input.setSelectionRange(0, this.input.value.length);
    },

    initializeInput: function(input) {
        var self = this;
        input.addEventListener('keyup', function(e) {
            if (e && (e.keyCode === 13 || e.keyCode === 27)) {
                e.preventDefault();
                if (e.keyCode === 27) {
                    self.cancelEditing();
                } else {
                    self.stopEditing();
                }
                self.getGrid().repaint();
                self.getGrid().takeFocus();
            }
            if (self.getGrid().isFilterRow(self.getEditorPoint().y)) {
                setTimeout(function() {
                    self.saveEditorValue();
                    self._moveEditor();
                });
            }
            self.getGrid().fireSyntheticEditorKeyUpEvent(self, e);
        });
        input.addEventListener('keydown', function(e) {
            self.getGrid().fireSyntheticEditorKeyDownEvent(self, e);
        });
        input.addEventListener('keypress', function(e) {
            self.getGrid().fireSyntheticEditorKeyPressEvent(self, e);
        });
        input.onblur = function(e) {
            self.cancelEditing();
        };
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
        //input.style.fontSize = '8pt';
        input.style.boxShadow = 'white 0px 0px 1px 1px';
    },
});

module.exports = Textfield;
