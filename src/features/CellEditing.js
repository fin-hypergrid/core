'use strict';

var Feature = require('./Feature');
var CellEditor = require('../cellEditors/CellEditor');

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
    handleDoubleClick: function(grid, event) {
        if (
            grid.properties.editOnDoubleClick &&
            event.detail.isDataCell
        ) {
            grid.onEditorActivate(event.detail);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    handleClick: function(grid, event) {
        if (
            !grid.properties.editOnDoubleClick &&
            event.detail.isDataCell
        ) {
            grid.onEditorActivate(event.detail);
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
        var char, isVisibleChar, isDeleteChar, editor, cellEvent;

        if (
            (cellEvent = grid.getGridCellFromLastSelection()) &&
            cellEvent.properties.editOnKeydown &&
            !grid.cellEditor &&
            (
                (char = event.detail.char) === 'F2' ||
                (isVisibleChar = char.length === 1 && !(event.detail.meta || event.detail.ctrl)) ||
                (isDeleteChar = char === 'DELETE' || char === 'BACKSPACE')
            )
        ) {
            editor = grid.onEditorActivate(cellEvent);

            if (editor instanceof CellEditor) {
                if (isVisibleChar) {
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

module.exports = CellEditing;
