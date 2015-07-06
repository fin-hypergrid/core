'use strict';
/**
 *
 * @module behaviors\web-worker
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

            var self = this;

            this.block = {
                data: [],
                headers: [],
                rows: 0
            };

            this.sortStates = [' ', ' \u2191', ' \u2193'];

            this.worker = new Worker('js/json-web-worker.js');

            this.worker.onmessage = function(e) {
                self.block = e.data;
                self.changed();
            };
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
                fixedColumnIndexes: [],
                hiddenColumns: [],

                columnWidths: [],
                fixedColumnWidths: [],
                fixedColumnAutosized: [],

                rowHeights: {},
                fixedRowHeights: {},
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
        send a message to the web worker
        * @param {type} message - a json object message
        */
        postMessage: function(message) {
            this.worker.postMessage(message);
        },

        /**
        * @function
        * @instance
        * @description
        push data to the web worker
        * @param {Array} jsonData - the array of object data
        */
        setData: function(jsonData) {
            this.postMessage({
                cmd: 'setData',
                data: jsonData
            });
            this.initialize();
        },

        /**
        * @function
        * @instance
        * @description
        initialize myself and the web worker
        */
        initialize: function() {
            //this.initColumnIndexes();
            this.changed();
            this.postMessage({
                cmd: 'fetchTableData',
                data: {
                    start: this.getScrollPositionY() || 0,
                    num: 60
                }
            });
        },

        /**
         * @function
         * @instance
         * @description
         return the data value at coordinates x,y.  this is the main "model" function that allows for virtualization
         * #### returns: Object
         * @param {integer} x - the x coordinate
         * @param {integer} y - the y coordinate
         */
        getValue: function(x, y) {
            var override = this.dataUpdates['p_' + x + '_' + y];
            if (override) {
                return override;
            }

            var fields = this.getFields();
            return this.block.data[y - this.getScrollPositionY()][fields[x]];
        },

        /**
        * @function
        * @instance
        * @description
        empty out our page of local data, this function is used when we lose connectivity.  this function is primarily used as a visual queue so the user doesn't see stale data
        */
        clearData: function() {
            this.block.rows = [];
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         return the number of rows
         * #### returns: integer
         */
        getRowCount: function() {
            return this.block.rows;
        },

        /**
         * @function
         * @instance
         * @description
         return the total number of columns
         * #### returns: integer
         */
        getColumnCount: function() {
            return this.block.headers.length;
        },

        /**
         * @function
         * @instance
         * @description
         quietly set the scroll position in the horizontal dimension
         * #### returns: type
         * @param {integer} y - the position in pixels
         */
        setScrollPositionY: function(y) {
            if (this.scrollPositionY === y) {
                return;
            }
            this.scrollPositionY = y;
            this.postMessage({
                cmd: 'fetchTableData',
                data: {
                    start: this.getScrollPositionY(),
                    num: 60
                }
            });
        },

        /**
         * @function
         * @instance
         * @description
         return the data value at point x,y in the fixed row area
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getFixedRowValue: function(x) {
            if (!this.tableState.sorted[x]) {
                this.tableState.sorted[x] = 0;
            }
            var sortIndicator = this.sortStates[this.tableState.sorted[x]];
            return this.block.headers[x] + sortIndicator;
        },

        /**
        * @function
        * @instance
        * @description
        getter for the field names
        * #### returns: Array
        */
        getFields: function() {
            return this.block.fields;
        },

        /**
        * @function
        * @instance
        * @description
        return a specific header at column index x
        * #### returns: string
        * @param {integer} x - the column index of interest
        */
        getHeader: function(x) {
            return this.block.headers[x];
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
            return y;
        },

        /**
        * @function
        * @instance
        * @description
        returns true if we support sorting
        * #### returns: boolean
        */
        getCanSort: function() {
            var canSort = this.block.features.sorting === true;
            return canSort;
        },

        /**
         * @function
         * @instance
         * @description
         toggle the sort at columnIndex to it's next state
         * @param {integer} columnIndex - the column index of interest
         */
        toggleSort: function(columnIndex) {
            if (!this.getCanSort()) {
                return;
            }
            this.grid.clearSelections();
            var current = this.tableState.sorted[columnIndex];
            var stateCount = this.sortStates.length;
            this.tableState.sorted = {}; //clear out other sorted for now, well add multicolumn sort later
            this.tableState.sorted[columnIndex] = (current + 1) % stateCount;
            var state = this.tableState.sorted[columnIndex];
            var message = {
                cmd: 'sortTable',
                data: {
                    table: 'trade',
                    sortIndex: current === (stateCount - 1) ? -1 : columnIndex,
                    state: state,
                    //abs: state.indexOf('|') > 0,
                    start: this.getScrollPositionY(),
                    num: 60
                }
            };
            this.postMessage(message);
        },

        /**
         * @function
         * @instance
         * @description
         return the column alignment at column x
         * #### returns: string ['left','center','right']
         * @param {integer} x - the column index of interest
         */
        getColumnAlignment: function( /* x */ ) {
            return 'center';
        },

        /**
         * @function
         * @instance
         * @description
         return the number of fixed columns
         * #### returns: integer
         */
        getFixedColumnCount: function() {
            return 1;
        },

    });
})();
