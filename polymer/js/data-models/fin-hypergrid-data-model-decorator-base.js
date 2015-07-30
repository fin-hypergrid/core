'use strict';

(function() {

    Polymer('fin-hypergrid-data-model-decorator-base', { /* jshint ignore:line  */

        component: null,

        setComponent: function(newComponent) {
            this.component = newComponent;
        },

        getComponent: function() {
            return this.component;
        },

        getValue: function(x, y) {
            return this.getComponent().getValue(x, y);
        },

        setValue: function(x, y, value) {
            this.getComponent().setValue(x, y, value);
        },

        getColumnCount: function() {
            return this.getComponent().getColumnCount();
        },

        getRowCount: function() {
            return this.getComponent().getRowCount();
        },

        getCellRenderer: function(config, x, y, untranslatedX, untranslatedY) {
            return this.getComponent().getCellRenderer(config, x, y, untranslatedX, untranslatedY);
        },

        getRowHeight: function(y) {
            return this.getComponent().getRowHeight(y);
        },

        getColumnEdge: function(x, renderer) {
            return this.getComponent().getColumnEdge(x, renderer);
        },

        getColumnWidth: function(x) {
            return this.getComponent().getColumnWidth(x);
        },

        setColumnWidth: function(x, width) {
            this.getComponent().setColumnWidth(x, width);
        },

        setGrid: function(newGrid) {
            this.grid = newGrid;
            this.getComponent().setGrid(newGrid);
        },

        toggleSort: function(x) {
            this.getComponent().toggleSort(x);
        },

        getCellEditorAt: function(x, y) {
            return this.getComponent().getCellEditorAt(x, y);
        },

        getColumnProperties: function(columnIndex) {
            return this.getComponent().getColumnProperties(columnIndex);
        },

        setColumnProperties: function(columnIndex, properties) {
            this.getComponent().setColumnProperties(columnIndex, properties);
        },

        checkColumnAutosizing: function(minWidths) {
            return this.getComponent().checkColumnAutosizing(minWidths);
        }

    });

})();
