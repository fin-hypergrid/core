'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
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

    handleTap: function(grid, event) {
        var isDoubleClickEditorActivation = grid.resolveProperty('editOnDoubleClick');
        if (this.checkActivateEditor(grid, event, !isDoubleClickEditorActivation)) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleTap(grid, event);
        }
    },

    /**
     * @memberOf CellEditing.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleHoldPulse: function(grid, event) {
        var isDoubleClickEditorActivation = grid.resolveProperty('editOnDoubleClick');
        if (this.checkActivateEditor(grid, event, !isDoubleClickEditorActivation)) {
           grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleHoldPulse(grid, event);
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
    }

});

module.exports = CellEditing;
