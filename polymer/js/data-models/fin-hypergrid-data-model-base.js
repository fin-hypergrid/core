'use strict';

(function() {

    var noop = function() {};

    Polymer('fin-hypergrid-data-model-base', { /* jshint ignore:line  */

        grid: null,

        getValue: function(x, y) {
            return x + ', ' + y;
        },

        setValue: function(x, y, value) {
            console.log('setting (' + x + ', ' + y + ') = ' + value);
        },

        getColumnCount: function() {
            return 20;
        },

        getCellProperties: function( /* x, y */ ) {
            return null;
        },

        setCellProperties: function(x, y, value) {
            console.log('setting (' + x + ', ' + y + ') = ' + value);
        },

        getRowCount: function() {
            return 1000;
        },

        setGrid: function(newGrid) {
            this.grid = newGrid;
        },

        getGrid: function() {
            return this.grid;
        },

        getState: function() {
            return this.getGrid().getState();
        },

        getBehavior: function() {
            return this.getGrid().getBehavior();
        },

        getCellProvider: function() {
            return this.getGrid().getCellProvider();
        },

        getImage: function(alias) {
            return this.getBehavior().getImage(alias);
        },

        changed: function() {
            this.getBehavior().changed();
        },

        initColumnIndexes: function(state) {
            this.getBehavior().initColumnIndexes(state);
        },

        toggleSort: function(x, keys) {
            console.log('toggle column ' + x, keys);
        },

        getCellEditorAt: function(x, y) {
            noop(x, y);
            var cellEditor = this.getGrid().resolveCellEditor('textfield');
            return cellEditor;
        },

        getRow: function(y) {
            noop(y);
            return null;
        },

        isShowRowNumbers: function() {
            return this.getGrid().isShowRowNumbers();
        },

        getScrollPositionY: function() {
            return this.getBehavior().getScrollPositionY();
        },
        hasHierarchyColumn: function() {
            return false;
        },
        getColumnProperties: function(x) {
            //access directly because we want it ordered
            return this.getBehavior().allColumns[x];
        }
    });

})();
