'use strict';

(function() {

    var noop = function() {};

    var merge = function(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    };

    Polymer('fin-hypergrid-data-model-decorator-reorder', { /* jshint ignore:line  */

        getCellRenderer: function(config, x, y /*, untranslatedX, untranslatedY */ ) {
            var translatedX = this.translateColumnIndex(x);
            var translatedY = y;
            return this.getComponent().getCellRenderer(config, translatedX, translatedY, x, y);
        },

        translateColumnIndex: function(x) {
            if (x === -1) {
                return -1;
            }
            if (this.hasHierarchyColumn()) {
                if (x === 0) {
                    return -2;
                }
                x = x - 1;
            }
            var tableState = this.getState();
            var indexes = tableState.columnIndexes;
            if (!indexes || indexes.length === 0) {
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

        getCellProperties: function(x, y) {
            x = this.translateColumnIndex(x);
            return this.getComponent().getCellProperties(x, y);
        },

        setCellProperties: function(x, y, value) {
            x = this.translateColumnIndex(x);
            this.getComponent().setCellProperties(x, y, value);
        },

        getColumnWidth: function(x) {
            var columnProperties = this.getColumnProperties(x);
            var width = columnProperties.width;
            return width;
        },

        setColumnWidth: function(x, width) {
            var columnProperties = this.getColumnProperties(x);
            columnProperties.width = Math.max(5, width);
            this.changed();
        },

        getColumnEdge: function(x, renderer) {
            x = this.translateColumnIndex(x);
            return renderer.columnEdges[x];
        },

        getColumnAlignment: function(x) {
            var columnProperties = this.getColumnProperties(x);
            var alignment = columnProperties.alignment;
            return alignment;
        },

        getCellEditorAt: function(x, y) {
            noop(y);
            x = this.translateColumnIndex(x);
            return this.getComponent().getCellEditorAt(x, y);
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

        toggleSort: function(x, keys) {
            x = this.translateColumnIndex(x);
            this.getComponent().toggleSort(x, keys);
        },

        getColumnProperties: function(x) {
            x = this.translateColumnIndex(x);
            return this.getComponent().getColumnProperties(x);
        },

        setColumnProperties: function(x, properties) {
            x = this.translateColumnIndex(x);
            this.getComponent().setColumnProperties(x, properties);
        },
        autosizeAllColumns: function() {
            var minWidths = this.getGrid().getRenderer().renderedColumnMinWidths;
            this.checkColumnAutosizing(minWidths, true);
            this.changed();
        },
        checkColumnAutosizing: function(minWidths, force) {
            force = force === true;
            var grid = this.getGrid();
            var tableState = this.getState();
            var a, b, c, d = 0;
            var loopSize = minWidths.length;
            var loopStart = 0;

            if (grid.isShowRowNumbers()) {
                loopStart--;
            }

            for (c = loopStart; c < loopSize; c++) {
                var ti = this.translateColumnIndex(c);
                var properties = tableState.columnProperties[ti];
                if (properties) {
                    a = properties.width;
                    b = minWidths[c];
                    d = properties.columnAutosized && !force;
                    if (a !== b || !d) {
                        properties.width = !d ? b : Math.max(a, b);
                        properties.columnAutosized = true;
                    }
                }
            }
        },

        setState: function(memento) {
            //we need to re-attach our column and row properties
            var colProperties = memento.columnProperties;
            if (colProperties) {
                for (var i = 0; i < colProperties.length; i++) {
                    var each = colProperties[i];
                    delete each.columnHeader;
                    delete each.rowHeader;
                    var meEach = this.getColumnProperties(i);
                    merge(meEach, each);
                }
            }
            this.getState().cellProperties = {};
        },

        convertViewPointToDataPoint: function(viewPoint) {
            var x = this.translateColumnIndex(viewPoint.x);
            var y = viewPoint.y;
            var grid = this.getGrid();
            var result = grid.rectangles.point.create(x, y);
            return result;
        },

        convertDataPointToViewPoint: function(dataPoint) {
            var x = this.unTranslateColumnIndex(dataPoint.x);
            var y = dataPoint.y;
            var grid = this.getGrid();
            var result = grid.rectangles.point.create(x, y);
            return result;
        },


    });

})();
