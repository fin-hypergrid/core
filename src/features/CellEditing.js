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

    /**
     * @memberOf CellEditing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleClick: function(grid, event) {
        edit.call(this, grid, event);
    },

    /**
     * @memberOf CellEditing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleDoubleClick: function(grid, event) {
        edit.call(this, grid, event, true);
    },

    /**
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @memberOf KeyPaging.prototype
     */
    handleKeyDown: function(grid, event) {
        var char = event.detail.char,
            cellEvent = grid.getGridCellFromLastSelection(),
            isEditable = cellEvent && cellEvent.properties.editOnKeydown && !grid.cellEditor,
            isVisibleChar = char.length === 1 && !(event.detail.meta || event.detail.ctrl),
            isSpaceChar = char === KEYS.SPACE,
            isDeleteChar = char === KEYS.DELETE || char === KEYS.BACKSPACE,
            isEditChar = char === KEYS.F2,
            isValidChar = isVisibleChar || isSpaceChar || isDeleteChar || isEditChar,
            editor;

        if (isEditable && isValidChar) {
            editor = grid.onEditorActivate(cellEvent);

            if (editor instanceof CellEditor) {
                if (isSpaceChar) {
                    editor.input.value = ' ';
                } else if (isVisibleChar) {
                    editor.input.value = char;
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

function edit(grid, event, onDoubleClick) {
    if (
        event.isDataCell &&
        !(event.getCellProperty('editOnDoubleClick') ^ onDoubleClick) // both same (true or falsy)?
    ) {
        grid.onEditorActivate(event);
    }

    if (this.next) {
        this.next[onDoubleClick ? 'handleDoubleClick' : 'handleClick'](grid, event);
    }
}

module.exports = CellEditing;
