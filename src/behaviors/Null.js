'use strict';

var Behavior = require('./Behavior');

var noop = function() {},
    n00p = function() { return 0; };

/**
 * @constructor
 */
var Null = Behavior.extend('Null', {

    //initalize: function(grid, component) {},

    setScrollPositionY: noop,
    setScrollPositionX: noop,
    getActiveColumnCount: n00p,
    getFixedColumnCount: n00p,
    getFixedColumnsWidth: n00p,
    getFixedColumnsMaxWidth: n00p,
    setRenderedWidth: n00p,
    getRowCount: n00p,
    getFixedRowCount: n00p,
    getFixedRowsHeight: n00p,
    getFixedRowsMaxHeight: n00p,
    setRenderedHeight: n00p,
    getCellProvider: noop,
    click: noop,
    doubleClick: noop
});

module.exports = Null;
