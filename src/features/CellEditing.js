'use strict';

var Feature = require('./Feature');
var CellEditor = require('../cellEditors/CellEditor');

var KEYS = {
    RETURN: 'RETURN',
    RETURNSHIFT: 'RETURNSHIFT',
    DELETE: 'DELETE',
    BACKSPACE: 'BACKSPACE',
    SPACE: 'SPACE',
    F2: 'F2'
};

/**
 * @constructor
 * @extends Feature
 */
var CellEditing = Feature.extend('CellEditing', {

    isVisibleChar: function(char, event) {
        return !!(
            (char.length === 1) && !(event.detail.meta || event.detail.ctrl)
        );
    },

    isSpaceChar: function(char, event) {
        return char === KEYS.SPACE;
    },

    isDeleteChar: function(char, event) {
        return (char === KEYS.DELETE || char === KEYS.BACKSPACE);
    },

    isEditChar: function(char, event) {
        return (char === KEYS.F2 || char === KEYS.RETURN || char === KEYS.RETURNSHIFT);
    },

    /**
     * @memberOf CellEditing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleDoubleClick: function(grid, event) {
        if (
            grid.properties.editOnDoubleClick &&
            event.isDataCell
        ) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    handleClick: function(grid, event) {
        if (
            !grid.properties.editOnDoubleClick &&
            event.isDataCell
        ) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleClick(grid, event);
        }
    },

    /**
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @memberOf KeyPaging.prototype
     */
    handleKeyDown: function(grid, event) {
        var char = event.detail.char,
            isVisibleChar = this.isVisibleChar(char, event),
            isSpaceChar = this.isSpaceChar(char, event),
            isDeleteChar = this.isDeleteChar(char, event),
            isEditChar = this.isEditChar(char, event),
            isValidChar = !!(isVisibleChar || isSpaceChar || isDeleteChar || isEditChar),
            cellEvent = grid.getGridCellFromLastSelection(),
            isEditable = (cellEvent && cellEvent.properties.editOnKeydown && !grid.cellEditor),
            editor;

        if (isEditable && isValidChar) {
            editor = grid.onEditorActivate(cellEvent);

            if (editor instanceof CellEditor) {
                if (isVisibleChar || isSpaceChar) {
                    editor.input.value = isSpaceChar ? ' ' : char;
                } else if (isDeleteChar) {
                    editor.setEditorValue('');
                }
                event.detail.primitiveEvent.preventDefault();
            }
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    }

});

module.exports = CellEditing;
