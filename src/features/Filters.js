'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 */
var Filters = Feature.extend('Filters', {

    handleDoubleClick: function(grid, event) {
        if (event.isFilterCell) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    handleClick: function(grid, event) {
        if (event.isFilterCell) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleClick(grid, event);
        }
    }

});

module.exports = Filters;
