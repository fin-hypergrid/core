'use strict';
//fin-hypergrid-behavior-q is a datasource based on an external Q data source.
//<br>See [kx.com](http://www.kx.com)
//<br>Two example scripts are provided in the root of this project, bigtable.q and sorttable.q
//<br>bigtable.q simulates an unsortable 100MM row table, and sorttable.q provides a true randomly generated 1MM row table sortable on any column.
//<br>Run either of these scripts with this GridBehavior.

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
        connectTo: function(newUrl) {
            this.setAttribute('url', newUrl);
            this.reconnect();
        },

        reconnect: function() {
            this.url = this.getAttribute('url');
            if (!this.url) {
                return;
            }
            this.connect();
            this.scrollPositionY = 0;
            this.scrolled = false;
        },

        //for now we use the hacky override implementation to save data, in the future we'll have a more elaborate protocol with Q to do real validation and setting of data.
        //<br>take note of the usage of the scrollPositionY value in translating our in-memory data page
        getValue: function(x, y) {
            x = this.translateColumnIndex(x);
            var override = this.values['p_' + (x + 1) + '_' + y];
            if (override) {
                return override;
            }

            var normalized = Math.floor(y - this.scrollPositionY);
            if (this.block && normalized < this.block.data.length) {
                return this.block.data[normalized][x + 1];
            } else {
                return '';
            }
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
            return this.block.headers.length - 1 - this.tableState.hiddenColumns.length;
        },

        //This is overridden from DefaultGridBehavior.   This value is set on us by the OFGrid component on user scrolling.
        //<br>TODO: refactor: don't store this value in an local member, store it in the message ONLY.
        //<br>TODO: refactor: num should be dynamic
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
                    start: this.scrollPositionY,
                    num: 60
                }
            }));
        },

        isConnected: function() {
            if (!this.ws) {
                return false;
            }
            return this.ws.readyState === this.ws.OPEN;
        },

        //return the column names, they are available to us as meta data in the most recent page Q sent us.
        getFixedRowValue: function(x) {
            x = this.translateColumnIndex(x);
            if (!this.sorted[x + 1]) {
                this.sorted[x + 1] = 0;
            }
            var sortIndicator = this.sortStates[this.sorted[x + 1]];
            return this.block.headers[x + 1][0] + sortIndicator;
        },

        getHeader: function(x) {
            return this.block.headers[x + 1][0];
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

        //on a header click do a sort!
        fixedRowClicked: function(grid, mouse) {
            this.toggleSort(this.scrollPositionX + mouse.gridCell.x - this.getFixedColumnCount());
        },

        //first ask q if this is a sortable instance, then send a message to Q to sort our data set
        toggleSort: function(columnIndex) {
            columnIndex = this.translateColumnIndex(columnIndex);
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
                    table: 'trade',
                    sort: current === (stateCount - 1) ? '' : this.block.headers[columnIndex][0],
                    asc: state.indexOf('^') > 0,
                    abs: state.indexOf('|') > 0,
                    start: this.scrollPositionY,
                    num: 60
                }
            };
            this.ws.send(JSON.stringify(message));
        },

        //delegate column alignment through the map at the top based on the column type
        getColumnAlignment: function(x) {
            x = this.translateColumnIndex(x);
            var alignment = typeAlignmentMap[this.block.headers[x + 1][1]];
            return alignment;
        },

        //for now use the cheesy local set data for storing user edits
        setValue: function(x, y, value) {
            x = this.translateColumnIndex(x);
            this.values['p_' + (x + 1) + '_' + y] = value;
        },

        //websocket connection to Q.  try and do a reconnect after 2 seconds if we fail
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
                            start: this.scrollPositionY || 0,
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
                        if (self.sizeChanged) {
                            self.sizeChanged();
                        }
                    }
                    if (!self.columnIndexes || self.columnIndexes.length === 0) {
                        self.initColumnIndexes();
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
