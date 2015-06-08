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
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
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

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        postMessage: function(message) {
            this.worker.postMessage(message);
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
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
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
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
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
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
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        clearData: function() {
            this.block.rows = [];
            this.changed();
        },

        //rows is a field in our data payload from Q that tells us the total number of rows available in the Q process data source
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getRowCount: function() {
            return this.block.rows;
        },

        //Virtual column scrolling is not necessary with this GridBehavior because we only hold a small amount of vertical data in memory and most tables in Q are timeseries financial data meaning the are very tall and skinny.  We know all the columns from the first page from Q.
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getColumnCount: function() {
            return this.block.headers.length;
        },

        //This is overridden from DefaultGridBehavior.   This value is set on us by the OFGrid component on user scrolling.
        //<br>TODO: refactor: don't store this value in an local member, store it in the message ONLY.
        //<br>TODO: refactor: num should be dynamic
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
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
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
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
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getFields: function() {
            return this.block.fields;
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getHeader: function(x) {
            return this.block.headers[x];
        },
        //for now just return the row number.  the simple protocol we talk with q assumes the first column is the real row index. so it is offset in all data access
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getFixedColumnValue: function(x, y) {
            return y;
        },

        //let Q decide if this instance is sortable or not
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getCanSort: function() {
            var canSort = this.block.features.sorting === true;
            return canSort;
        },

        //first ask q if this is a sortable instance, then send a message to Q to sort our data set
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
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
                    start: this.scrollPositionY,
                    num: 60
                }
            };
            this.postMessage(message);
        },

        //delegate column alignment through the map at the top based on the column type
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getColumnAlignment: function( /* x */ ) {
            return 'center';
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getFixedColumnCount: function() {
            return 1;
        },

    });
})();
