/*jshint  bitwise: false */
'use strict';
/**
 *
 * @module behaviors\json
 *
 */

(function() {

    Polymer({ /* jslint ignore:line */


        /**
        * @function
        * @instance
        * @description
        polymer lifecycle event
        */
        ready: function() {
            this.readyInit();
            this.sortStates = [undefined, 'up-arrow', 'down-arrow'];
        },
        /**
         * @function
         * @instance
         * @description
         create a default empty tablestate
         * #### returns: Object
         */
        getDefaultState: function() {
            return {
                columnIndexes: [],
                hiddenColumns: [],

                columnWidths: [],

                rowHeights: {},
                columnProperties: [],
                columnAutosized: [],

                sorted: [],

                fixedColumnCount: 1,
                fixedRowCount: 1
            };
        },

        /**
         * @function
         * @instance
         * @description
         you can override this function and substitute your own cell provider
         * #### returns: [fin-hypergrid-cell-provider](module-._cell-provider.html)
         */
        createCellProvider: function() {
            var tableState = this.getState();
            var provider = document.createElement('fin-hypergrid-cell-provider');
            provider.getTopLeftCell = function(config) {
                var empty = this.cellCache.emptyCellRenderer;
                var render = this.cellCache.simpleCellRenderer;
                empty.config = config;
                render.config = config;
                if (tableState.fixedColumnCount > 0) {
                    return render;
                } else {
                    return empty;
                }
            };
            return provider;
        },

        /**
         * @function
         * @instance
         * @description
         return the alignment at x,y of the top left area
         * #### returns: string ['left','center','right']
         * @param {integer} x - the x coordinate
         * @param {integer} x - the y coordinate
         */
        getTopLeftAlignment: function(x, y) {
            return this.getFixedRowAlignment(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         return the view translated alignment at x,y in the fixed row area
         * #### returns: string ['left','center','right']
         * @param {integer} x - the fixed column index of interest
         * @param {integer} y - the fixed row index of interest
         */
        getFixedRowAlignment: function(x, y) {
            if (y === 0) {
                return 'center';
            }
            var cell = this.cellProvider.getCell({
                x: x,
                y: y
            });
            return cell.config.halign;
        },

        /**
         * @function
         * @instance
         * @description
         return the alignment at x for the fixed column area
         * #### returns: string ['left','center','right']
         * @param {integer} x - the fixed column index of interest
         */
        getFixedColumnAlignment: function(x, y) {
            var cell = this.cellProvider.getCell({
                x: x,
                y: y
            });
            return cell.config.halign;
        },

        /**
         * @function
         * @instance
         * @description
         return the value at x,y for the top left section of the hypergrid
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getTopLeftValue: function(x, y) {
            return this.getFixedRowValue(x, y);
        },

        /**
        * @function
        * @instance
        * @description
        set the header labels
        * @param {Array} headerLabels - an array of strings
        */
        setHeaders: function(headerLabels) {
            this.getBaseModel().setHeaders(headerLabels);
        },

        /**
        * @function
        * @instance
        * @description
        returns the array of header labels
        * #### returns: Array
        */
        getHeaders: function() {
            return this.getBaseModel().getHeaders();
        },

        /**
        * @function
        * @instance
        * @description
        return a specific header at column index x
        * #### returns: string
        * @param {integer} x - the column index of interest
        */
        getHeader: function(x, y) {
            return this.getBaseModel().getHeader(x, y);
        },


        /**
        * @function
        * @instance
        * @description
        setter for the fields array
        * @param {Array} fieldNames - an array of strings of the field names
        */
        setFields: function(fieldNames) {
            this.getBaseModel().setFields(fieldNames);
        },

        /**
        * @function
        * @instance
        * @description
        getter for the field names
        * #### returns: Array
        */
        getFields: function() {
            return this.getBaseModel().getFields();
        },

        /**
         * @function
         * @instance
         * @description
         return the field at colIndex
         * #### returns: string
         * @param {integer} colIndex - the column index of interest
         */
        getField: function(colIndex) {
            return this.getBaseModel().getField(colIndex);
        },

        /**
        * @function
        * @instance
        * @description
        setter for the data field
        * @param {Array} arrayOfUniformObjects - an array of uniform objects, each being a row in the grid
        */
        setData: function(arrayOfUniformObjects) {
            this.getBaseModel().setData(arrayOfUniformObjects);
            this.dataModified();
        },

        /**
        * @function
        * @instance
        * @description
        getter for the data field
        */
        getData: function() {
            return this.getBaseModel().getData();
        },


        /**
        * @function
        * @instance
        * @description
        we've been notified the data has changed in some way, reinitialize our various meta data
        */
        dataModified: function() {
            this.initDataIndexes();
            //this.applySorts();
            this.changed();
        },

        /**
        * @function
        * @instance
        * @description
        setter for the totals field
        * @param {array} nestedArray - array2D of totals data
        */
        setTotals: function(nestedArray) {
            this.getBaseModel().setTotals(nestedArray);
            this.changed();
        },

        /**
        * @function
        * @instance
        * @description
        build the fields and headers from the supplied column definitions

    myJsonBehavior.setColumns([
      { title: 'Stock Name', field: 'short_description' },
      { title: 'Status', field: 'trading_phase' },
      { title: 'Reference Price', field: 'reference_price' }
    ]);

        * @param {Array} columnDefinitions - an array of objects with fields 'title', and 'field'
        */
        setColumns: function(columnDefinitions) {
            var fields = new Array(columnDefinitions.length);
            var headers = new Array(columnDefinitions.length);
            for (var i = 0; i < columnDefinitions.length; i++) {
                var each = columnDefinitions[i];
                fields[i] = each.field;
                headers[i] = each.title;
            }
            this.setFields(fields);
            this.setHeaders(headers);
        },

        /**
        * @function
        * @instance
        * @description
        rip through the user data and ammend it with indexes
        */
        initDataIndexes: function() {
            this.getBaseModel().initDataIndexes();
        },

        /**
         * @function
         * @instance
         * @description
         return the value at x,y for the fixed row area
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getFixedColumnValue: function(x, y) {
            //x = this.fixedtranslateColumnIndex(x);
            return this.getValue(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         return the data value at point x,y
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getFixedRowValue: function(x, y) {
            if (y === 0) {
                var tableState = this.getState();
                var headers = this.getHeaders();
                var sortIndex = tableState.sorted[x] || 0;
                return [undefined, headers[x], this.getImage(this.sortStates[sortIndex])];
            } else {
                return this.totals[y - 1][x];
            }
        },

        /**
        * @function
        * @instance
        * @description
        return this table to a previous state. see the [memento pattern](http://c2.com/cgi/wiki?MementoPattern)
        * @param {Object} memento - an encapulated representation of table state
        */
        setState: function(memento) {
            var tableState = this.getState();
            for (var key in memento) {
                if (memento.hasOwnProperty(key)) {
                    tableState[key] = memento[key];
                }
            }
            this.applySorts();
            this.changed();
        },

        /**
        * @function
        * @instance
        * @description
        return the object at y index
        * #### returns: Object
        * @param {integer} y - the row index of interest
        */
        getRow: function(y) {
            return this.getBaseModel().getRow(y);
        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        cellPrePaintNotification: function(cell) {
            var row = this.getRow(cell.config.y);
            var columnId = this.getHeader(cell.config.x);
            cell.config.row = row;
            cell.config.columnId = columnId;
        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a fixed column cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
        */
        cellFixedColumnPrePaintNotification: function(cell) {
            var row = this.getRow(cell.config.y);
            var columnId = this.getHeader(cell.config.x);
            cell.config.row = row;
            cell.config.columnId = columnId;
        },

        /**
         * @function
         * @instance
         * @description
         this function enhance the double click event just before it's broadcast to listeners
         * @param {Object} event - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        enhanceDoubleClickEvent: function(event) {
            event.row = this.getRow(event.gridCell.y);
        },

        /**
         * @function
         * @instance
         * @description
         fixed row has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        fixedRowClicked: function(grid, mouse) {
            if (mouse.gridCell.y > 0) {
                return; // don't allow clicking in the non-top header cell
            }
            this.toggleSort(mouse.gridCell.x);
        },


        getDefaultDataModel: function() {
            var model = document.createElement('fin-hypergrid-data-model-json');
            this.baseModel = model;
            return model;
        },

    });

})(); /* jslint ignore:line */
