'use strict';

(function() {

    var noop = function() {};

    Polymer('fin-hypergrid-data-model-decorator-reorder', { /* jshint ignore:line  */

        getCellRenderer: function(config, x, y, untranslatedX, untranslatedY) {
            return this.getComponent().getCellRenderer(config, x, y, untranslatedX, untranslatedY);
        },

        translateColumnIndex: function(x) {
            var tableState = this.getState();
            var indexes = tableState.columnIndexes;
            if (indexes.length === 0) {
                return x;
            }
            return indexes[x];
        },

        unTranslateColumnIndex: function(x) {
            var tableState = this.getState();
            return tableState.columnIndexes.indexOf(x);
        },

        getValue: function(x, y) {
            x = this.translateColumnIndex(x);
            return this.getComponent().getValue(x, y);
        },

        setValue: function(x, y, value) {
            x = this.translateColumnIndex(x);
            this.getComponent().setValue(x, y, value);
        },

        getColumnWidth: function(x) {
            x = this.translateColumnIndex(x);
            var tableState = this.getState();
            return tableState.columnWidths[x];
        },

        setColumnWidth: function(x, width) {
            x = this.translateColumnIndex(x);
            var tableState = this.getState();
            tableState.columnWidths[x] = width;
            this.changed();
        },

        getColumnEdge: function(x, renderer) {
            x = this.translateColumnIndex(x);
            return renderer.columnEdges[x];
        },

        getColumnAlignment: function(x) {
            x = this.translateColumnIndex(x);
            return this.getComponent().getColumnAlignment(x);
        },

        getCellEditorAt: function(x, y) {
            noop(y);
            x = this.translateColumnIndex(x);
            return this.getComponent().getCellEditorAt(x);
        },

        getColumnId: function(x) {
            x = this.translateColumnIndex(x);
            var col = this.getComponent().getColumnId(x, 0);
            return col;
        },

        getCursorAt: function(x /*, y */ ) {
            x = this.translateColumnIndex(x);
            var cursor = this.getComponent().getCursorAt(x, 0);
            return cursor;
        },

    });

})();
