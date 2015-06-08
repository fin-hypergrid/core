'use strict';
/**
 *
 * @module behaviors\base
 *
 */
(function() {

    var noop = function() {};

    var imageCache = {};

    var imgData = [
        ['1-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAFFJREFUKFNjQAL/oTTD////CWJkgFMjEAgD8Q4gLkMSgwOsGoGgDCQExcRrRFJImo1ICqmnEUSiYJgkMgYCrDYia8TQBFVIJ6cCAXJ0QDGDDQD67OYX9wdp0wAAAABJRU5ErkJggg=='],
        ['1-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAExJREFUKFPtjYEJACAIBN2hdZqr2dqu3tB8C5qghzPxlAQZJ4iWJ9E8DpACOmh7ZkLLwoWDNPJxSMONSwa5fzSBJy8z/9B6RpfVZaRO2oo/zJVRDvIAAAAASUVORK5CYII='],
        ['1-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGtJREFUKFOtjoEJgDAQA6uiC7iOc3U2t3sT6Uu+XxDBwFliEtoisnYWM3vFtQG6mWZQ2sEJqvy7tQC6FUzdqLaMpCH1OB1KcXgjBZ8HDhSHEuCIZeW/IcRvwEMFyjey7HjQA317KsvMIuW4AFTUEgvs+3wkAAAAAElFTkSuQmCC'],
        ['1-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAFBJREFUKFPtjdsNQCEIQ93BdZzL2dwOjw9CuV93AEmOJbYNxcw2DHL2P5wHcdR0mAoDuvxFyXHzBrp4UZQAEoUvTL4oBpLDyiveXVnh5WVKm6iPR8RbHxLhAAAAAElFTkSuQmCC'],

        ['2-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAH5JREFUKFOVkAsNgDAMROcBBxjAAEJwgAMcYGGmsIAGLJS7piE3FjJ2yRvpxus+SWLxTWbWRFOJyAgyuDgNDjD9EWewAzZgvElTVCJshLJfXED3jjwu77pG7UKBCvHTAPgwWeY8Kn5KLN4i81SyyOOdgHfzqMixQBb9FWvSdgNN871AHwblVAAAAABJRU5ErkJggg=='],
        ['2-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJVJREFUKFN9kAEVgzAMRPEwBzOAgQnBwRzgYBZqCgtowAL7l6VtILB77zc01yttB7SfQRr+0j8uAugJBTb5sMBoni/QYNSQ91/wAW0g2Sbu9VAlhisubcSUeTCscYdrgt8fg0HJgQrScXXXt82DQckBgR6ghymtF0zKMSBQC2nS+mEBJYV0vBV0N1PzwiJKCtorZob5Cy2RFvXFQAKlAAAAAElFTkSuQmCC'],
        ['2-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJtJREFUKFOFkAsNAjEQRAsXMIADDJwBhOAABzjAwpnCAhqwUN4s2zJQCJO8bGa3018x1ayl1vqXpi3IrWVsuIcF7mrDFWYPTiC3gZUFD3ABbSDFJh6UumtBJ6WNsB/BtugbqSM8T7QBZQw0kK6rt57C24AyBgTagT5msV687Y02zAU9JNP7OfwV0vVuoLeF+swWUV6h7MUvjpTzA6fM6SVV2CbgAAAAAElFTkSuQmCC'],
        ['2-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAIxJREFUKFOVkFsRgDAMBOsBBxjAAEJwgAMcYAFTWEADFspe+iDQH8jMcrSX6yvEGA0KSf9fSB+k8DBD6GGDUx7sMGTvDhVccIQVtIDKFjHPNSH3bm9yaSGG/4MT/N5Rx9VdZxs7A2kDgupAD7PVOWciz4CgakiDOu8akCak4x2gu1lVzzUhTdBesSUsF/uHHu110bZRAAAAAElFTkSuQmCC'],

        ['3-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJVJREFUKFONkQENhDAMRecBB2cAAyhAwTnAAQ6wgAa8nIXTcBbGf6NduiyEe8ljadlfOkiBbGvKOT8a6YLiJXf5oy2/8v1PcJKb5ABYJS+8LnTBqMFBFGOpjKfgIBl7t7pyGxQ+InecPcizMYZ8kzFLGnXUGLwLOTS5a6XuCqFFMib3A2p+Tfmq7GgMQU4+vC8/Vy+lEzGdowwHiWM2AAAAAElFTkSuQmCC'],
        ['3-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJtJREFUKFOFkQERwjAMResBBzOAgSmYAhzgAAdYmAa8YAENWID3SgM5soN/95om6e+lW0OPb5DLTz6bDQOaYIW7fbjBoffGAZdOmEZ9hjN4gTqBjZ6/TUE2B0NeZLLPDUI1BGgHjr32PDUI1SAoRvSNS6+lJqGaJGkBC/9H3ZDFOR8gFNMRHNP3KXN/zZQPEYrRr3ixN7i+aq09ARE7/LLO8L26AAAAAElFTkSuQmCC'],
        ['3-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAKdJREFUKFN1kQERwjAMRQscGMDBDGBgCqYABzjAARamAS9YQAMWyn8hodlt/Xfv0p80uXQrSdXjX7XWLqGTwO3NNQ1iFh9B/S2uufEgcEexI+EaxUMwAN0F98Kb2hjXxmoMwlzMuVRfviMjnQVrz+ZTQWHdAFKsyBsny6WiwroJkiZBwlblsKDTFCI5RrHXdBOsyfsQnl8z5EsKrclzfMUnNef1y5XyBYgdtwl+Lm+LAAAAAElFTkSuQmCC'],
        ['3-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAJpJREFUKFONkQsRwjAQBeMBBzWAgSqoAhzgAAdYqAa8YAENWAi7+cAx6UDfzPaae32ZS5pyzgVEqe97qA9K58tMaYIVnnrwgFPzPqFOCM5wBTdQF9CY4u7vwBZNbuTiGA3KGOigAzj2WtbBoIwBQX1Ez7iUXjApY0iCFrDxf9QN2ZzjB5QhdAbH9HzKtb/m960ib/Gm17jXXkov3zEEuQ7h10oAAAAASUVORK5CYII='],

        ['up-rectangle', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAAHklEQVQYV2PAAv5DaZwApACGsQJkBVgVYlMAxQwMABOrD/GvP+EWAAAAAElFTkSuQmCC'],
        ['down-rectangle', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAABpJREFUGFdjgIL/eDAKIKgABggqgAE0BQwMAPTlD/Fpi0JfAAAAAElFTkSuQmCC'],
        ['rectangle-spacer', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAA1JREFUGFdjGHSAgQEAAJQAAY8LvLEAAAAASUVORK5CYII='],

        ['sortable', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAAxSURBVChTY8AD/kNpkgBIEwwTDZA1Ea0ZmyYYHmQAmxNhmCAgSxMMkKUJBvBoYmAAAJCXH+FU1T8+AAAAAElFTkSuQmCC'],
        ['up-arrow', 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAKCAYAAAB8OZQwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAA9SURBVBhXbYvRCgAgCAOtqP//Y9tElw8NDrcDzd0DBCd7iSL3E0IvGOpf2fKXeZUFKDcYFMwBlDNWS76bXUM5P9In5AzyAAAAAElFTkSuQmCC'],
        ['down-arrow', 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAKCAYAAAB8OZQwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAA+SURBVBhXhYvRCgAgCAOtqP//4+WWhtBDB1duqBUQ/2W5LLtSMFyW020skuecwOGj6QzfkuExt1LlcqICgG3S7z/SL/jVpgAAAABJRU5ErkJggg==']
    ];

    (function() {
        var each, img;
        for (var i = 0; i < imgData.length; i++) {
            each = imgData[i];
            img = new Image();
            img.src = 'data:image/png;base64,' + each[1];
            imageCache[each[0]] = img;
        }
    })();

    Polymer('fin-hypergrid-behavior-base', { /* jslint ignore:line */
        /**
         * @property {object} tableState - memento for the user configured visual properties of the table
         */
        tableState: {},
        /**
         * @property {object} columnProperties - a hook to put fgcolor, bgcolor, font for a column if no cell properties are available
         */
        columnProperties: {},
        /**
         * @property {fin-hypergrid} grid - my instance of hypergrid
         */
        grid: null,
        /**
         * @property {array} editorTypes - list of default cell editor names
         */
        editorTypes: ['choice', 'textfield', 'color', 'slider', 'spinner', 'date'],
        /**
         * @property {object} featureChain - controller chain of command
         */
        featureChain: null,
        /**
         * @property {integer} fixedColumnCount - the number of fixed columns
         */
        fixedColumnCount: 0,
        /**
         * @property {integer} fixedRowCount - the number of fixed rows
         */
        fixedRowCount: 1,
        /**
         * @property {array} columnAutosized - boolean vector of which columns have been autosized
         */
        columnAutosized: [],
        /**
         * @property {array} fixedColumnAutosized - boolean vector of which fixed columns have been autosized
         */
        fixedColumnAutosized: [],

        /**
         * @function
         */
        clearObjectProperties: function(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    delete obj[prop];
                }
            }
        },

        /**
         * @function
         */
        ready: function() {
            this.readyInit();
        },

        /**
         * @function
         */
        readyInit: function() {
            this.cellProvider = this.createCellProvider();
            this.scrollPositionX = 0;
            this.scrollPositionY = 0;
            this.renderedWidth = 30;
            this.renderedHeight = 60;
            this.tableState = {
                columnIndexes: [],
                fixedColumnIndexes: [],
                hiddenColumns: [],

                columnWidths: [],
                fixedColumnWidths: [],

                rowHeights: {},
                fixedRowHeights: {},
            };

            this.dataUpdates = {}; //for overriding with edit values;
            //this.initColumnIndexes();
            this.fixedColumnCount = 0;
            this.columnAutosized = [];
            this.fixedColumnAutosized = [];
        },

        /**
         * @function
         */
        resolveProperty: function(key) {
            return this.grid.resolveProperty(key);
        },

        /**
         * @function
         */
        getState: function() {
            return this.tableState;
        },

        /**
         * @function
         */
        setState: function(state) {
            for (var key in state) {
                if (state.hasOwnProperty(key)) {
                    this.tableState[key] = state[key];
                }
            }
        },

        /**
         * @function
         */
        cellClicked: function(cell, event) {
            this.grid.fireCellClickEvent(cell, event);
        },

        /**
         * @function
         */
        initColumnIndexes: function() {
            var columnCount = this._getColumnCount();
            var fixedColumnCount = this.getFixedColumnCount();
            var i;
            for (i = 0; i < columnCount; i++) {
                this.tableState.columnIndexes[i] = i;
            }
            for (i = 0; i < fixedColumnCount; i++) {
                this.tableState.fixedColumnIndexes[i] = i;
            }
        },

        /**
         * @function
         */
        insureColumnIndexesAreInitialized: function() {
            this.swapColumns(0, 0);
        },

        /**
         * @function
         */
        swapColumns: function(src, tar) {
            var indexes = this.tableState.columnIndexes;
            if (indexes.length === 0) {
                this.initColumnIndexes();
                indexes = this.tableState.columnIndexes;
            }
            var tmp = indexes[src + this.fixedColumnCount];
            indexes[src + this.fixedColumnCount] = indexes[tar + this.fixedColumnCount];
            indexes[tar + this.fixedColumnCount] = tmp;
        },

        /**
         * @function
         */
        translateColumnIndex: function(x) {
            var indexes = this.tableState.columnIndexes;
            if (indexes.length === 0) {
                return x;
            }
            return indexes[x + this.fixedColumnCount];
        },

        /**
         * @function
         */
        unTranslateColumnIndex: function(x) {
            return this.tableState.columnIndexes.indexOf(x);
        },

        /**
         * @function
         */
        setNextFeature: function(nextFeature) {
            if (this.featureChain) {
                this.featureChain.setNext(nextFeature);
            } else {
                this.featureChain = nextFeature;
            }
        },

        /**
         * @function
         */
        installOn: function(grid) {
            grid.setBehavior(this);
            this.initializeFeatureChain(grid);
        },

        /**
         * @function
         */
        initializeFeatureChain: function(grid) {
            this.setNextFeature(document.createElement('fin-hypergrid-feature-key-paging'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-click'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-overlay'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-resizing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-row-resizing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-selection'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-moving'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-thumbwheel-scrolling'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-editing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-sorting'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-on-hover'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-autosizing'));

            this.featureChain.initializeOn(grid);
        },

        /**
         * @function
         */
        getCellProvider: function() {
            return this.cellProvider;
        },

        /**
         * @function
         */
        setGrid: function(finGrid) {
            this.grid = finGrid;
        },

        /**
         * @function
         */
        getGrid: function() {
            return this.grid;
        },

        /**
         * @function
         */
        createCellProvider: function() {
            var provider = document.createElement('fin-hypergrid-cell-provider');
            return provider;
        },

        /**
         * @function
         */
        getTopLeftValue: function( /* x, y */ ) {
            return '';
        },

        /**
         * @function
         */
        _getValue: function(x, y) {
            x = this.translateColumnIndex(x);
            var override = this.dataUpdates['p_' + x + '_' + y];
            if (override) {
                return override;
            }
            return this.getValue(x, y);
        },

        /**
         * @function
         */
        _setValue: function(x, y, value) {
            x = this.translateColumnIndex(x);
            this.setValue(x, y, value);
        },

        /**
         * @function
         */
        _getFixedRowValue: function(x, y) {
            x = this.translateColumnIndex(x);
            return this.getFixedRowValue(x, y);
        },

        /**
         * @function
         */
        getFixedColumnValue: function(x, y) {
            //x = this.fixedtranslateColumnIndex(x);
            return y + 1;
        },

        /**
         * @function
         */
        getRowCount: function() {
            //jeepers batman a quadrillion rows!
            return 1000000000000000;
        },

        /**
         * @function
         */
        _getColumnCount: function() {
            return this.getColumnCount() - this.tableState.hiddenColumns.length - this.fixedColumnCount;
        },

        /**
         * @function
         */
        getFixedRowsHeight: function() {
            var count = this.getFixedRowCount();
            var total = 0;
            for (var i = 0; i < count; i++) {
                total = total + this.getFixedRowHeight(i);
            }
            return total;
        },

        /**
         * @function
         */
        getFixedRowHeight: function(rowNum) {
            if (this.tableState.fixedRowHeights) {
                var override = this.tableState.fixedRowHeights[rowNum];
                if (override) {
                    return override;
                }
            }
            return this.resolveProperty('defaultFixedRowHeight');
        },

        /**
         * @function
         */
        setFixedRowHeight: function(rowNum, height) {
            //console.log(rowNum + ' ' + height);
            this.tableState.fixedRowHeights[rowNum] = Math.max(5, height);
            this.changed();
        },

        /**
         * @function
         */
        getRowHeight: function(rowNum) {
            if (this.tableState.rowHeights) {
                var override = this.tableState.rowHeights[rowNum];
                if (override) {
                    return override;
                }
            }
            return this.getDefaultRowHeight();
        },

        /**
         * @function
         */
        getDefaultRowHeight: function() {
            if (!this.defaultRowHeight) {
                this.defaultRowHeight = this.resolveProperty('defaultRowHeight');
            }
            return this.defaultRowHeight;
        },

        /**
         * @function
         */
        setRowHeight: function(rowNum, height) {
            this.tableState.rowHeights[rowNum] = Math.max(5, height);
            this.changed();
        },

        /**
         * @function
         */
        getFixedRowsMaxHeight: function() {
            var height = this.getFixedRowsHeight();
            return height;
        },

        /**
         * @function
         */
        getFixedColumnsWidth: function() {
            var count = this.getFixedColumnCount();
            var total = 0;
            for (var i = 0; i < count; i++) {
                total = total + this.getFixedColumnWidth(i);
            }
            return total;
        },

        /**
         * @function
         */
        setFixedColumnWidth: function(colNumber, width) {
            this.tableState.fixedColumnWidths[colNumber] = Math.max(5, width);
            this.changed();
        },

        /**
         * @function
         */
        getFixedColumnsMaxWidth: function() {
            var width = this.getFixedColumnsWidth();
            return width;
        },

        /**
         * @function
         */
        getFixedColumnWidth: function(colNumber) {
            var override = this.tableState.fixedColumnWidths[colNumber];
            if (override) {
                return override;
            }
            return this.resolveProperty('defaultFixedColumnWidth');
        },

        /**
         * @function
         */
        _getColumnWidth: function(x) {
            x = this.translateColumnIndex(x);
            return this.getColumnWidth(x);
        },

        /**
         * @function
         */
        _setColumnWidth: function(x, width) {
            x = this.translateColumnIndex(x);
            this.setColumnWidth(x, width);
            this.changed();
        },

        /**
         * @function
         */
        _setScrollPositionY: function(y) {
            this.setScrollPositionY(y);
            this.changed();
        },

        /**
         * @function
         */
        _setScrollPositionX: function(x) {
            this.setScrollPositionX(x);
            this.changed();
        },

        /**
         * @function
         */
        setRenderedWidth: function(width) {
            this.renderedWidth = width;
        },

        /**
         * @function
         */
        setRenderedHeight: function(height) {
            this.renderedHeight = height;
        },

        /**
         * @function
         */
        _getColumnAlignment: function(x) {
            x = this.translateColumnIndex(x);
            return this.getColumnAlignment(x);
        },

        /**
         * @function
         */
        getTopLeftAlignment: function( /* x, y */ ) {
            return 'center';
        },

        /**
         * @function
         */
        getFixedColumnAlignment: function( /* x */ ) {
            return this.resolveProperty('fixedColumnAlign');
        },

        /**
         * @function
         */
        _getFixedRowAlignment: function(x, y) {
            x = this.translateColumnIndex(x);
            return this.getFixedRowAlignment(x, y);
        },

        /**
         * @function
         */
        topLeftClicked: function(grid, mouse) {
            if (mouse.gridCell.x < this.fixedColumnCount) {
                this.fixedRowClicked(grid, mouse);
            } else {
                console.log('top Left clicked: ' + mouse.gridCell.x, mouse);
            }
        },

        /**
         * @function
         */
        _fixedRowClicked: function(grid, mouse) {
            var x = this.translateColumnIndex(mouse.gridCell.x - this.getFixedColumnCount());
            var translatedPoint = this.grid.rectangles.point.create(this.scrollPositionX + x, mouse.gridCell.y);
            mouse.gridCell = translatedPoint;
            this.fixedRowClicked(grid, mouse);
        },

        /**
         * @function
         */
        _fixedColumnClicked: function(grid, mouse) {
            var translatedPoint = this.grid.rectangles.point.create(mouse.gridCell.x, this.scrollPositionY + mouse.gridCell.y - this.getFixedRowCount());
            mouse.gridCell = translatedPoint;
            this.fixedColumnClicked(grid, mouse);
        },

        /**
         * @function
         */
        setCursor: function(grid) {
            grid.updateCursor();
            this.featureChain.setCursor(grid);
        },

        /**
         * @function
         */
        onMouseMove: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseMove(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         */
        onTap: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleTap(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         */
        onWheelMoved: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleWheelMoved(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         */
        onMouseUp: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseUp(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         */
        onMouseDrag: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseDrag(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         */
        onKeyDown: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleKeyDown(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         */
        onKeyUp: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleKeyUp(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         */
        onDoubleClick: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleDoubleClick(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         */
        onHoldPulse: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleHoldPulse(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         */
        handleMouseDown: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseDown(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         */
        handleMouseExit: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseExit(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         */
        _getCellEditorAt: function(x, y) {
            noop(y);
            x = this.translateColumnIndex(x);
            return this.getCellEditorAt(x);
        },

        /**
         * @function
         */
        changed: function() {},

        /**
         * @function
         */
        shapeChanged: function() {},

        /**
         * @function
         */
        isColumnReorderable: function() {
            return true;
        },

        /**
         * @function
         */
        getColumnProperties: function(columnIndex) {
            noop(columnIndex);
            //if no cell properties are supplied these properties are used
            //this probably should be moved into it's own object
            // this.clearObjectProperties(this.columnProperties);
            // if (columnIndex === 4) {
            //     this.columnProperties.bgColor = 'maroon';
            //     this.columnProperties.fgColor = 'white';
            // }
            return this.columnProperties;
        },

        /**
         * @function
         */
        getDNDColumnLabels: function() {
            //assumes there is one row....
            this.insureColumnIndexesAreInitialized();
            var columnCount = this.tableState.columnIndexes.length;
            var labels = [];
            for (var i = 0; i < columnCount; i++) {
                var id = this.tableState.columnIndexes[i];
                if (id >= this.fixedColumnCount) {
                    labels.push({
                        id: id,
                        label: this.getHeader(id)
                    });
                }
            }
            return labels;
        },

        /**
         * @function
         */
        getHeader: function(colIndex) {
            return this.getFixedRowValue(colIndex, 0);
        },

        /**
         * @function
         */
        setDNDColumnLabels: function(list) {
            //assumes there is one row....
            var columnCount = list.length;
            var indexes = [];
            var i;
            for (i = 0; i < this.fixedColumnCount; i++) {
                indexes.push(i);
            }
            for (i = 0; i < columnCount; i++) {
                indexes.push(list[i].id);
            }
            this.tableState.columnIndexes = indexes;
            this.changed();
        },

        /**
         * @function
         */
        getDNDHiddenColumnLabels: function() {
            var indexes = this.tableState.hiddenColumns;
            var labels = new Array(indexes.length);
            for (var i = 0; i < labels.length; i++) {
                var id = indexes[i];
                labels[i] = {
                    id: id,
                    label: this.getFixedRowValue(id, 0)
                };
            }
            return labels;
        },

        /**
         * @function
         */
        setDNDHiddenColumnLabels: function(list) {
            //assumes there is one row....
            var columnCount = list.length;
            var indexes = new Array(columnCount);
            for (var i = 0; i < columnCount; i++) {
                indexes[i] = list[i].id;
            }
            this.tableState.hiddenColumns = indexes;
            this.changed();
        },

        /**
         * @function
         */
        hideColumns: function(arrayOfIndexes) {
            var indexes = this.tableState.hiddenColumns;
            var order = this.tableState.columnIndexes;
            for (var i = 0; i < arrayOfIndexes.length; i++) {
                var each = arrayOfIndexes[i];
                if (indexes.indexOf(each) === -1) {
                    indexes.push(each);
                    order.splice(order.indexOf(each), 1);
                }
            }
        },

        /**
         * @function
         */
        getFixedColumnCount: function() {
            return this.fixedColumnCount;
        },

        /**
         * @function
         */
        setFixedColumnCount: function(numberOfFixedColumns) {
            this.fixedColumnCount = numberOfFixedColumns;
        },

        /**
         * @function
         */
        getFixedRowCount: function() {
            return this.fixedRowCount;
        },

        /**
         * @function
         */
        setFixedRowCount: function(numberOfFixedRows) {
            this.fixedRowCount = numberOfFixedRows;
        },

        /**
         * @function
         */
        openEditor: function(div) {
            var container = document.createElement('div');

            var hidden = document.createElement('fin-hypergrid-dnd-list');
            var visible = document.createElement('fin-hypergrid-dnd-list');

            container.appendChild(hidden);
            container.appendChild(visible);

            this.beColumnStyle(hidden.style);
            hidden.title = 'hidden columns';
            hidden.list = this.getDNDHiddenColumnLabels();

            this.beColumnStyle(visible.style);
            visible.style.left = '50%';
            visible.title = 'visible columns';
            visible.list = this.getDNDColumnLabels();

            div.lists = {
                hidden: hidden.list,
                visible: visible.list
            };
            div.appendChild(container);
            return true;
        },

        /**
         * @function
         */
        closeEditor: function(div) {
            noop(div);
            var lists = div.lists;
            this.setDNDColumnLabels(lists.visible);
            this.setDNDHiddenColumnLabels(lists.hidden);
            return true;
        },

        /**
         * @function
         */
        endDragColumnNotification: function() {
            return true;
        },

        /**
         * @function
         */
        beColumnStyle: function(style) {
            style.top = '5%';
            style.position = 'absolute';
            style.width = '50%';
            style.height = '99%';
            style.whiteSpace = 'nowrap';
        },

        /**
         * @function
         */
        getCursorAt: function( /* x, y */ ) {
            return null;
        },

        /**
         * @function
         */
        getValue: function(x, y) {
            return x + ', ' + y;
        },

        /**
         * @function
         */
        setValue: function(x, y, value) {
            this.dataUpdates['p_' + x + '_' + y] = value;
        },

        /**
         * @function
         */
        getColumnCount: function() {
            return 300;
        },

        /**
         * @function
         */
        getColumnWidth: function(x) {
            var override = this.tableState.columnWidths[x];
            if (override) {
                return override;
            }
            return this.resolveProperty('defaultColumnWidth');
        },

        /**
         * @function
         */
        setColumnWidth: function(x, width) {
            this.tableState.columnWidths[x] = Math.max(5, width);
        },

        /**
         * @function
         */
        getColumnAlignment: function( /* x */ ) {
            return 'center';
        },

        /**
         * @function
         */
        setScrollPositionX: function(x) {
            this.scrollPositionX = x;
        },

        /**
         * @function
         */
        setScrollPositionY: function(y) {
            this.scrollPositionY = y;
        },

        /**
         * @function
         */
        getFixedRowAlignment: function(x, y) {
            noop(x, y);
            return this.resolveProperty('fixedRowAlign');
        },

        /**
         * @function
         */
        getFixedRowValue: function(x /*, y*/ ) {
            return x;
        },

        /**
         * @function
         */
        getCellEditorAt: function(x, y) {
            noop(x, y);
            var cellEditor = this.grid.resolveCellEditor('textfield');
            return cellEditor;
        },

        /**
         * @function
         */
        fixedRowClicked: function(grid, mouse) {
            this.toggleSort(mouse.gridCell.x);
        },

        /**
         * @function
         */
        toggleSort: function(colIndex) {
            console.log('toggleSort(' + colIndex + ')');
        },

        /**
         * @function
         */
        fixedColumnClicked: function(grid, mouse) {
            console.log('fixedColumnClicked(' + mouse.gridCell.x + ', ' + mouse.gridCell.y + ')');
        },

        /**
         * @function
         */
        highlightCellOnHover: function(isColumnHovered, isRowHovered) {
            return isColumnHovered && isRowHovered;
        },

        /**
         * @function
         */
        getColumnId: function(x) {
            x = this.translateColumnIndex(x);
            var col = this.getFixedRowValue(x, 0);
            return col;
        },

        /**
         * @function
         */
        getImage: function(key) {
            var image = imageCache[key];
            return image;
        },


        /**
         * @function
         */
        setImage: function(key, image) {
            imageCache[key] = image;
        },

        /**
         * @function
         */
        checkColumnAutosizing: function(fixedWidths, widths) {
            var self = this;
            var myFixed = this.tableState.fixedColumnWidths;
            var myWidths = this.tableState.columnWidths;
            var repaint = false;
            var a, b, c, d = 0;
            for (c = 0; c < fixedWidths.length; c++) {
                a = myFixed[c];
                b = fixedWidths[c];
                d = this.fixedColumnAutosized[c];
                if (a !== b || !d) {
                    myFixed[c] = !d ? b : Math.max(a, b);
                    this.fixedColumnAutosized[c] = true;
                    repaint = true;
                }
            }
            for (c = 0; c < widths.length; c++) {
                var ti = this.translateColumnIndex(c);
                a = myWidths[ti];
                b = widths[c];
                d = this.columnAutosized[c];
                if (a !== b || !d) {
                    myWidths[ti] = !d ? b : Math.max(a, b);
                    this.columnAutosized[c] = true;
                    repaint = true;
                }
            }
            if (repaint) {
                setTimeout(function() {
                    self.shapeChanged();
                });
            }
        },

        cellPrePaintNotification: function( /* cell */ ) {

        },

        cellFixedRowPrePaintNotification: function( /* cell */ ) {

        },

        cellFixedColumnPrePaintNotification: function( /* cell */ ) {

        },

        cellTopLeftPrePaintNotification: function( /* cell */ ) {

        }


    });
})();
