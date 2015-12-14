'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 */
var Filters = Feature.extend('Filters', {

    alias: 'Filters',

    handleDoubleClick: function(grid, event) {
        var isDoubleClickEditorActivation = grid.resolveProperty('editOnDoubleClick');
        if (this.checkActivateEditor(grid, event, isDoubleClickEditorActivation)) {
            grid._activateEditor(event);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    handleTap: function(grid, event) {
        var isDoubleClickEditorActivation = grid.resolveProperty('editOnDoubleClick');
        if (this.checkActivateEditor(grid, event, !isDoubleClickEditorActivation)) {
            grid._activateEditor(event);
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
           grid._activateEditor(event);
        } else if (this.next) {
            this.next.handleHoldPulse(grid, event);
        }
    },

    checkActivateEditor: function(grid, event, isDoubleClickEditorActivation) {
        var isFilterRow = grid.isFilterRow(event.gridCell.y);
        var activateEditor = isDoubleClickEditorActivation && isFilterRow;
        return activateEditor;
    }

});

module.exports = Filters;
