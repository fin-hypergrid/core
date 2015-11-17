'use strict';

var Behavior = require('./Behavior');

var noop = function() {};

var Null = Behavior.extend({

    //initalize: function(grid, component) {},

    setScrollPositionY: noop,
    setScrollPositionX: noop,
    getColumnCount: function() {
        return 0;
    },
    getFixedColumnCount: function() {
        return 0;
    },
    getFixedColumnsWidth: function() {
        return 0;
    },
    getFixedColumnsMaxWidth: function() {
        return 0;
    },
    setRenderedWidth: function() {
        return 0;
    },
    getRowCount: function() {
        return 0;
    },
    getFixedRowCount: function() {
        return 0;
    },
    getFixedRowsHeight: function() {
        return 0;
    },
    getFixedRowsMaxHeight: function() {
        return 0;
    },
    setRenderedHeight: function() {
        return 0;
    },
    getCellProvider: noop,
    click: noop,
    doubleClick: noop
});

module.exports = Null;