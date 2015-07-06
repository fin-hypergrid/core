'use strict';
/**
 *
 * @module behaviors\q
 * @description
 fin-hypergrid-behavior-q is a datasource based on an external Q data source.
<br>See [kx.com](http://www.kx.com)
<br>Two example scripts are provided in the root of this project, bigtable.q and sorttable.q
<br>bigtable.q simulates an unsortable 100MM row table, and sorttable.q provides a true randomly generated 1MM row table sortable on any column.
<br>Run either of these scripts with this behavior.

 *
 */

(function() {

    //keys mapping Q datatypes to aligment and renderers are setup here.
    //<br>see [q datatypes](http://code.kx.com/wiki/Reference/Datatypes) for more.

    var typeAlignmentMap = {
        j: 'right',
        s: 'left',
        t: 'center',
        f: 'right',
        d: 'center'
    };

    //there are 4 default cell renderer types to choose from at the moment
    //<br>simpleCellRenderer, sliderCellRenderer, sparkbarCellRenderer, sparklineCellRenderer
    // var typeRendererMap = {
    //     J: 'sparklineCellRenderer',
    //     j: 'simpleCellRenderer',
    //     s: 'simpleCellRenderer',
    //     t: 'simpleCellRenderer',
    //     f: 'simpleCellRenderer',
    //     d: 'simpleCellRenderer'
    // };

    //sort states are also the visual queues in the column headers
    //* '' no sort
    //* ^ sort ascending
    //* v sort descending
    //* |^| sort absolute value ascending
    //* |v| sort absolute value descending

    Polymer({ /* jslint ignore:line */

        /**
         * @function
         * @instance
         * @description
         polymer lifecycle event
         */
        ready: function() {
            this.block = {
                data: [],
                headers: [],
                rows: 0
            };
            this.readyInit();
            this.sorted = {};
            this.sortStates = ['', ' ^', ' v', ' |^|', ' |v|'];
            this.ws = null;
            this.reconnect();
        },

        /**
        * @function
        * @instance
        * @description
        polymer callback
        * @param {string} attrName - the attribute name
        * @param {string} oldVal - the old value
        * @param {string} newVal - the new value
        */
        attributeChanged: function(attrName, oldVal, newVal) {
            console.log(attrName, 'old: ' + oldVal, 'new:', newVal);
            if (attrName === 'url') {
                this.reconnect();
            }
            if (attrName === 'table') {
                //force a refresh of the data
                this.setScrollPositionY(0);
            }
        },

        /**
        * @function
        * @instance
        * @description
        connect to q at newUrl
        * @param {string} newUrl - the url of the q server
        */
        connectTo: function(newUrl) {
            this.setAttribute('url', newUrl);
            this.reconnect();
        },

        /**
        * @function
        * @instance
        * @description
        try reconnecting
        */
        reconnect: function() {
            this.url = this.getAttribute('url');
            if (!this.url) {
                return;
            }
            this.connect();
            this.setScrollPositionY(0);
            this.scrolled = false;
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

            var normalized = Math.floor(y - this.getScrollPositionY());
            if (this.block && normalized < this.block.data.length) {
                return this.block.data[normalized][x + 1];
            } else {
                return '';
            }
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
            return Math.max(0, this.block.headers.length - 1);
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
            if (!this.isConnected()) {
                return;
            }
            var tableName = this.getAttribute('table');
            if (!tableName) {
                console.log('you must provide a table attribute for the q behavior');
                return;
            }
            this.ws.send(JSON.stringify({
                cmd: 'fetchTableData',
                data: {
                    table: tableName,
                    start: this.getScrollPositionY(),
                    num: 60
                }
            }));
        },

        /**
        * @function
        * @instance
        * @description
        return true if we are connected to q
        * #### returns: boolean
        */
        isConnected: function() {
            if (!this.ws) {
                return false;
            }
            return this.ws.readyState === this.ws.OPEN;
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
            if (!this.sorted[x + 1]) {
                this.sorted[x + 1] = 0;
            }
            var sortIndicator = this.sortStates[this.sorted[x + 1]];
            return this.block.headers[x + 1][0] + sortIndicator;
        },

        /**
         * @function
         * @instance
         * @description
         return the column heading at colIndex
         * #### returns: string
         * @param {integer} colIndex - the column index of interest
         */
        getHeader: function(x) {
            return this.block.headers[x + 1][0];
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
            columnIndex++;
            var current = this.sorted[columnIndex];
            var stateCount = this.sortStates.length;
            this.sorted = {}; //clear out other sorted for now, well add multicolumn sort later
            this.sorted[columnIndex] = (current + 1) % stateCount;
            var state = this.sortStates[this.sorted[columnIndex]];
            var message = {
                cmd: 'sortTable',
                data: {
                    table: this.getAttribute('table') || 'trade',
                    sort: current === (stateCount - 1) ? '' : this.block.headers[columnIndex][0],
                    asc: state.indexOf('^') > 0,
                    abs: state.indexOf('|') > 0,
                    start: this.getScrollPositionY(),
                    num: 60
                }
            };
            this.ws.send(JSON.stringify(message));
        },

        /**
         * @function
         * @instance
         * @description
         return the column alignment at column x
         * #### returns: string ['left','center','right']
         * @param {integer} x - the column index of interest
         */
        getColumnAlignment: function(x) {
            var alignment = typeAlignmentMap[this.block.headers[x + 1][1]];
            return alignment;
        },

        /**
        * @function
        * @instance
        * @description
        connect to q at newUrl
        */
        connect: function() {
            var d;
            var oldSize;
            var self = this;
            var tableName = this.getAttribute('table');
            if (!tableName) {
                console.log('you must provide a table attribute for the q behavior');
                return;
            }
            if ('WebSocket' in window) {
                try {
                    this.ws = new WebSocket(this.url);
                } catch (e) {
                    console.log('could not connect to ' + this.url + ', trying to reconnect in a moment...');
                    return;
                }
                console.log('connecting...');
                this.ws.onopen = function() {
                    console.log('connected');
                    self.ws.send(JSON.stringify({
                        cmd: 'fetchTableData',
                        data: {
                            table: tableName,
                            start: self.getScrollPositionY() || 0,
                            num: 60
                        }
                    }));
                };
                this.ws.onclose = function() {
                    self.clearData();
                    console.log('disconnected from ' + this.url + ', trying to reconnect in a moment...');
                    setTimeout(function() {
                        //    self.connect();
                    }, 2000);
                };
                this.ws.onmessage = function(e) {
                    d = JSON.parse(e.data);
                    oldSize = self.block.rows;

                    self.block = d;

                    if (d.rows !== oldSize) {
                        if (self.changed) {
                            self.changed();
                        }
                    }
                    self.changed();
                };
                this.ws.onerror = function(e) {
                    self.clearData();
                    console.error('problem with connection to q at ' + this.url + ', trying again in a moment...', e.data);
                    setTimeout(function() {
                        //     self.connect();
                    }, 2000);
                };
            } else {
                console.error('WebSockets not supported on your browser.');
            }
        }

    });

})(); /* jslint ignore:line */
