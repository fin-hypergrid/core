'use strict';

(function() {

    Polymer({ /* jslint ignore:line */
        ready: function() {

            this.readyInit();

            var self = this;

            this.block = {
                data: [],
                headers: [],
                rows: 0
            };

            this.tableState.sorted = [];
            this.sortStates = [' ', ' \u2191', ' \u2193'];

            this.worker = new Worker('js/json-web-worker.js');

            this.worker.onmessage = function(e) {
                self.block = e.data;
                self.changed();
            };
        },

        postMessage: function(message) {
            this.worker.postMessage(message);
        },

        setData: function(jsonData) {
            this.postMessage({
                cmd: 'setData',
                data: jsonData
            });
            this.initialize();
        },

        initialize: function() {
            this.initColumnIndexes();
            this.changed();
            this.postMessage({
                cmd: 'fetchTableData',
                data: {
                    start: this.scrollPositionY || 0,
                    num: 60
                }
            });
        },

        //for now we use the hacky override implementation to save data, in the future we'll have a more elaborate protocol with Q to do real validation and setting of data.
        //<br>take note of the usage of the scrollPositionY value in translating our in-memory data page
        getValue: function(x, y) {
            var override = this.dataUpdates['p_' + x + '_' + y];
            if (override) {
                return override;
            }

            var fields = this.getFields();
            return this.block.data[y - this.scrollPositionY][fields[x]];
        },

        //empty out our page of local data, this function is used when we lose connectivity
        //<br>this function is primarily used as a visual queue so the user doesn't see stale data
        clearData: function() {
            this.block.rows = [];
            this.changed();
        },

        //rows is a field in our data payload from Q that tells us the total number of rows available in the Q process data source
        getRowCount: function() {
            return this.block.rows;
        },

        //Virtual column scrolling is not necessary with this GridBehavior because we only hold a small amount of vertical data in memory and most tables in Q are timeseries financial data meaning the are very tall and skinny.  We know all the columns from the first page from Q.
        getColumnCount: function() {
            return this.block.headers.length;
        },

        //This is overridden from DefaultGridBehavior.   This value is set on us by the OFGrid component on user scrolling.
        //<br>TODO: refactor: don't store this value in an local member, store it in the message ONLY.
        //<br>TODO: refactor: num should be dynamic
        setScrollPositionY: function(y) {
            if (this.scrollPositionY === y) {
                return;
            }
            this.scrollPositionY = y;
            this.postMessage({
                cmd: 'fetchTableData',
                data: {
                    start: this.scrollPositionY,
                    num: 60
                }
            });
        },

        //return the column names, they are available to us as meta data in the most recent page Q sent us.
        getFixedRowValue: function(x) {
            if (!this.tableState.sorted[x]) {
                this.tableState.sorted[x] = 0;
            }
            var sortIndicator = this.sortStates[this.tableState.sorted[x]];
            return this.block.headers[x] + sortIndicator;
        },

        getFields: function() {
            return this.block.fields;
        },

        getHeader: function(x) {
            return this.block.headers[x];
        },
        //for now just return the row number.  the simple protocol we talk with q assumes the first column is the real row index. so it is offset in all data access
        getFixedColumnValue: function(x, y) {
            return y;
        },

        //let Q decide if this instance is sortable or not
        getCanSort: function() {
            var canSort = this.block.features.sorting === true;
            return canSort;
        },

        //first ask q if this is a sortable instance, then send a message to Q to sort our data set
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
                    start: this.scrollPositionY,
                    num: 60
                }
            };
            this.postMessage(message);
        },

        //delegate column alignment through the map at the top based on the column type
        getColumnAlignment: function( /* x */ ) {
            return 'center';
        },

        getFixedColumnCount: function() {
            return 1;
        },

    });
})();
