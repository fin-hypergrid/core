'use strict';
//QGridBehavior is a datasource based on an external Q data source.
//<br>See [kx.com](http://www.kx.com)
//<br>Two example scripts are provided in the root of this project, bigtable.q and sorttable.q
//<br>bigtable.q simulates an unsortable 100MM row table, and sorttable.q provides a true randomly generated 1MM row table sortable on any column.
//<br>Run either of these scripts with this GridBehavior.

(function() {
    var root = this;

    var DefaultGridBehavior = root.fin.wc.hypergrid.DefaultGridBehavior;
    var DefaultCellProvider = root.fin.wc.hypergrid.DefaultCellProvider;

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
    var typeRendererMap = {
        J: 'sparklineCellRenderer',
        j: 'simpleCellRenderer',
        s: 'simpleCellRenderer',
        t: 'simpleCellRenderer',
        f: 'simpleCellRenderer',
        d: 'simpleCellRenderer'
    };

    //sort states are also the visual queues in the column headers
    //* '' no sort
    //* ^ sort ascending
    //* v sort descending
    //* |^| sort absolute value ascending
    //* |v| sort absolute value descending
    function QGridBehavior(url) {
        DefaultGridBehavior.call(this);
        this.sorted = {};
        this.sortStates = ['', ' ^', ' v', ' |^|', ' |v|'];
        this.ws = null;
        this.url = url || 'ws://localhost:5000/';
        this.connect();
        this.scrollTop = 0;
        this.scrolled = false;
        this.block = {
            data: [],
            headers: [],
            rows: 0
        };
    }

    var proto = QGridBehavior.prototype = Object.create(DefaultGridBehavior.prototype);

    proto.constructor = QGridBehavior;

    //this is a good example of overriding the default cellprovider
    //<br>in this case config.x is how we specify a column through its index
    proto.createCellProvider = function() {
        var provider = new DefaultCellProvider();
        var self = this;
        provider.getCell = function(config) {
            var x = config.x;
            var renderer = provider.cellCache[typeRendererMap[self.block.headers[x + 1][1]]];
            if (x === 11) {
                renderer = provider.cellCache.sliderCellRenderer;
            } else if (x === 13) {
                renderer = provider.cellCache.sparkbarCellRenderer;
            }
            renderer.config = config;
            return renderer;
        };
        return provider;
    };

    //for now we use the hacky override implementation to save data, in the future we'll have a more elaborate protocol with Q to do real validation and setting of data.
    //<br>take note of the usage of the scrollTop value in translating our in-memory data page
    proto.getValue = function(x, y) {
        var override = this.values['p_' + (x + 1) + '_' + y];
        if (override) {
            return override;
        }

        var normalized = Math.floor(y - this.scrollTop);
        if (this.block && normalized < this.block.data.length) {
            return this.block.data[normalized][x + 1];
        } else {
            return '';
        }
    };

    //empty out our page of local data, this function is used when we lose connectivity
    //<br>this function is primarily used as a visual queue so the user doesn't see stale data
    proto.clearData = function() {
        this.block.rows = [];
        this.changed();
    };

    //rows is a field in our data payload from Q that tells us the total number of rows available in the Q process data source
    proto.getRowCount = function() {
        return this.block.rows;
    };

    //Virtual column scrolling is not necessary with this GridBehavior because we only hold a small amount of vertical data in memory and most tables in Q are timeseries financial data meaning the are very tall and skinny.  We know all the columns from the first page from Q.
    proto.getColCount = function() {
        return this.block.headers.length - 1;
    };

    //This is overridden from DefaultGridBehavior.   This value is set on us by the OFGrid component on user scrolling.
    //<br>TODO: refactor: don't store this value in an local member, store it in the message ONLY.
    //<br>TODO: refactor: num should be dynamic
    proto.setScrollTop = function(y) {
        this.scrollTop = y;
        this.ws.send(JSON.stringify({
            cmd: 'fetch',
            data: {
                start: this.scrollTop,
                num: 60
            }
        }));
    };

    //return the column names, they are available to us as meta data in the most recent page Q sent us.
    proto.getFixedRowValue = function(x) {
        if (!this.sorted[x + 1]) {
            this.sorted[x + 1] = 0;
        }
        var sortIndicator = this.sortStates[this.sorted[x + 1]];
        return this.block.headers[x + 1][0] + sortIndicator;
    };

    //for now just return the row number.  the simple protocol we talk with q assumes the first column is the real row index. so it is offset in all data access
    proto.getFixedColValue = function(x, y) {
        return this.getValue(-1, y);
    };

    //let Q decide if this instance is sortable or not
    proto.getCanSort = function() {
        var canSort = this.block.features.sorting === true;
        return canSort;
    };

    //on a header click do a sort!
    proto.fixedRowClicked = function(grid, mouse) {
        this.toggleSort(this.scrollLeft + mouse.cell.x - this.getFixedColCount());
    };

    //first ask q if this is a sortable instance, then send a message to Q to sort our data set
    proto.toggleSort = function(colIndex) {
        if (!this.getCanSort()) {
            return;
        }
        colIndex++;
        var current = this.sorted[colIndex];
        var stateCount = this.sortStates.length;
        this.sorted = {}; //clear out other sorted for now, well add multicolumn sort later
        this.sorted[colIndex] = (current + 1) % stateCount;
        var state = this.sortStates[this.sorted[colIndex]];
        var message = {
            cmd: 'sort',
            data: {
                sort: current === (stateCount - 1) ? '' : this.block.headers[colIndex][0],
                asc: state.indexOf('^') > 0,
                abs: state.indexOf('|') > 0,
                start: this.scrollTop,
                num: 60
            }
        };
        this.ws.send(JSON.stringify(message));
    };

    //delegate column alignment through the map at the top based on the column type
    proto.getColAlignment = function(x) {
        var alignment = typeAlignmentMap[this.block.headers[x + 1][1]];
        return alignment;
    };

    //for now use the cheesy local set data for storing user edits
    proto.setValue = function(x, y, value) {
        this.values['p_' + (x + 1) + '_' + y] = value;
    };

    //websocket connection to Q.  try and do a reconnect after 2 seconds if we fail
    proto.connect = function() {
        var d;
        var oldSize;
        var self = this;
        if ('WebSocket' in window) {
            this.ws = new WebSocket(this.url);
            console.log('connecting...');
            this.ws.onopen = function() {
                console.log('connected');
                self.ws.send(JSON.stringify({
                    cmd: 'fetch',
                    data: {
                        start: this.scrollTop || 0,
                        num: 60
                    }
                }));
            };
            this.ws.onclose = function() {
                self.clearData();
                console.log('disconnected from ' + this.url + ', trying to reconnect in a moment...');
                setTimeout(function() {
                    self.connect();
                }, 2000);
            };
            this.ws.onmessage = function(e) {
                d = JSON.parse(e.data);
                oldSize = self.block.rows;

                self.block = d;

                if (d.rows !== oldSize) {
                    self.sizeChanged();
                }

                self.changed();
            };
            this.ws.onerror = function(e) {
                self.clearData();
                console.error('problem with connection to q at ' + this.url + ', trying again in a moment...', e.data);
                setTimeout(function() {
                    self.connect();
                }, 2000);
            };
        } else {
            console.error('WebSockets not supported on your browser.');
        }
    };

    root.fin = root.fin || {};
    root.fin.wc = root.fin.wc || {};
    root.fin.wc.hypergrid = root.fin.wc.hypergrid || {};
    root.fin.wc.hypergrid.QGridBehavior = QGridBehavior;

}).call(this); /* jslint ignore:line */
