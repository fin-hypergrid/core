'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 */
var Filters = Feature.extend('Filters', {

    handleDoubleClick: function(grid, event) {
        console.log('dbl');
        if (grid.isFilterRow(event.gridCell.y)) {
            grid.onEditorActivate(event);
        } else {
            Feature.prototype.handleDoubleClick.apply(this, arguments);
        }
    },

    handleTap: function(grid, event) {
        console.log('tap');
        if (grid.isFilterRow(event.gridCell.y)) {
            grid.onEditorActivate(event);
        } else {
            Feature.prototype.handleTap.apply(this, arguments);
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
    }

});

module.exports = Filters;
