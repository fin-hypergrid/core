'use strict';

var Feature = require('./Feature.js');
var CellEditor = require('../cellEditors/CellEditor');

/**
 * @constructor
 * @extends Feature
 */
var CellEditing = Feature.extend('CellEditing', {

    /**
     * @memberOf CellEditing.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleDoubleClick: function(grid, event) {
        var isDoubleClickEditorActivation = grid.resolveProperty('editOnDoubleClick');
        if (this.checkActivateEditor(grid, event, isDoubleClickEditorActivation)) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    handleClick: function(grid, event) {
        var isDoubleClickEditorActivation = grid.resolveProperty('editOnDoubleClick');
        if (this.checkActivateEditor(grid, event, !isDoubleClickEditorActivation)) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleClick(grid, event);
        }
    },

    checkActivateEditor: function(grid, event, isDoubleClickEditorActivation) {
        var headerRowCount = grid.behavior.getHeaderRowCount();
        var headerColumnCount = grid.behavior.getHeaderColumnCount();
        var gridCell = event.gridCell;
        var isFilterRow = grid.isFilterRow(gridCell.y);

        return isDoubleClickEditorActivation &&
            gridCell.x >= headerColumnCount &&
            (isFilterRow || gridCell.y >= headerRowCount);
    },

    /**
     * @desc Handle this event down the feature chain of responsibility.
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @memberOf KeyPaging.prototype
     */
    handleKeyDown: function(grid, event) {
        var char, isVisibleChar, isDeleteChar, currentCell, editor;

        if (
            grid.resolveProperty('editOnKeydown') &&
            !grid.cellEditor &&
            (
                (char = event.detail.char) === 'F2' ||
                (isVisibleChar = char.length === 1 && !(event.detail.meta || event.detail.ctrl)) ||
                (isDeleteChar = char === 'DELETE' || char === 'BACKSPACE')
            )
        ) {
            currentCell = grid.selectionModel.getLastSelection();
            if (currentCell) {
                var pseudoEvent = { gridCell: currentCell.origin };
                editor = grid.onEditorActivate(pseudoEvent);
                if (editor instanceof CellEditor) {
                    if (isVisibleChar) {
                        editor.input.value = char;
                    } else if (isDeleteChar) {
                        editor.setEditorValue('');
                    }
                    event.detail.primitiveEvent.preventDefault();
                }
            }
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    }

});

module.exports = CellEditing;
