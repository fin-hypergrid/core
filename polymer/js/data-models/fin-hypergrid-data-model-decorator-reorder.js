'use strict';

(function() {

    var noop = function() {};

    Polymer('fin-hypergrid-data-model-decorator-reorder', { /* jshint ignore:line  */

        getCellRenderer: function(config, x, y, untranslatedX, untranslatedY) {
            var translatedX = this.translateColumnIndex(x);
            var translatedY = y;
            return this.getComponent().getCellRenderer(config, translatedX, translatedY, x, y);
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
            var columnProperties = this.getColumnProperties(x);
            var width = columnProperties.width;
            return width;
        },

        setColumnWidth: function(x, width) {
            var columnProperties = this.getColumnProperties(x);
            columnProperties.width = width;
            this.changed();
        },

        getColumnEdge: function(x, renderer) {
            x = this.translateColumnIndex(x);
            return renderer.columnEdges[x];
        },

        getColumnAlignment: function(x) {
            var columnProperties = this.getColumnProperties(x);
            var alignment = columnProperties.alignment;
            return alignment
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

        toggleSort: function(x) {
            x = this.translateColumnIndex(x);
            this.getComponent().toggleSort(x);
        },

        getColumnProperties: function(x) {
            x = this.translateColumnIndex(x);
            return this.getComponent().getColumnProperties(x);
        },

        setColumnProperties: function(x, properties) {
            x = this.translateColumnIndex(x);
            this.getComponent().setColumnProperties(x, properties);
        },

        checkColumnAutosizing: function(minWidths) {
            var self = this;
            var tableState = this.getState();
            var repaint = false;
            var a, b, c, d = 0;
            for (c = 0; c < minWidths.length; c++) {
                var ti = this.translateColumnIndex(c);
                var properties = tableState.columnProperties[ti];
                a = properties.width;
                b = minWidths[c];
                d = properties.columnAutosized;
                if (a !== b || !d) {
                    properties.width = !d ? b : Math.max(a, b);
                    properties.columnAutosized = true;
                    repaint = true;
                }
            }
        }

    });

})();
