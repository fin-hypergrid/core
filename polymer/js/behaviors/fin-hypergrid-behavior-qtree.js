'use strict';
//fin-hypergrid-behavior-qtree is a datasource based on an external Q data source with tree-centric analytic capilities
//<br>See [kx.com](http://www.kx.com)
//<br>Two example scripts are provided in the root of this project, bigtable.q and sorttable.q
//<br>bigtable.q simulates an unsortable 100MM row table, and sorttable.q provides a true randomly generated 1MM row table sortable on any column.
//<br>Run either of these scripts with this GridBehavior.

(function() {

    var noop = function() {};

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

    var typeFormatMap = {
        J: function(v) {
            return v;
        },
        j: function(v) {
            return v;
        },
        s: function(v) {
            return v;
        },
        t: function(v) {
            return v;
        },
        f: function(v) {
            return v.toFixed(4);
        },
        d: function(v) {
            return v;
        }
    };

    //sort states are also the visual queues in the column headers
    //* '' no sort
    //* ^ sort ascending
    //* v sort descending
    //* |^| sort absolute value ascending
    //* |v| sort absolute value descending;
    // \u25be
    var sortMap = {
        a: '\u2191',
        d: '\u2193',
        A: '\u2912',
        D: '\u2913'
    };

    var sortStates = {
        n: 'a',
        a: 'd',
        d: 'A',
        A: 'D',
    };

    Polymer({ /* jslint ignore:line */

        ready: function() {
            this.block = {
                N: 0,
                F: [],
                G: [],
                S: {
                    cols: [],
                    rows: []
                },
                Z: [{
                    g_: ['']
                }]
            };
            this.readyInit();
            this.sorted = {};
            this.ws = null;
            this.reconnect();
            this.msgCounter = Date.now();
            this.msgResponsesActions = {};

        },
        getFixedRowCount: function() {
            return 2;
        },

        //override this function on your GridBehavior to have custom cell renderering
        //<br>see [QGridBehavior.createCellProvider()](QGridBehavior.html) for an example
        createCellProvider: function() {
            var self = this;
            var provider = document.createElement('fin-hypergrid-cell-provider');
            provider.getCell = function(config) {
                var cell = provider.cellCache.simpleCellRenderer;
                var colId = self.block.F[config.x];
                var type = self.block.Q[colId];
                var formatter = typeFormatMap[type] || function(v) {
                    return v;
                };
                config.value = formatter(config.value);
                return cell;
            };
            provider.getFixedColumnCell = function(config) {
                var cell = provider.cellCache.treeCellRenderer;
                cell.config = config;
                return cell;
            };
            provider.getFixedRowCell = function(config) {
                var label = provider.cellCache.simpleCellRenderer;
                label.config = config;
                if (config.y === 1) {
                    //config.font = config.properties.font;
                    config.fgColor = config.fgSelColor = config.properties.color;
                    config.bgColor = config.bgSelColor = config.properties.backgroundColor2;
                    var colId = self.block.F[config.x];
                    var type = self.block.Q[colId];
                    var formatter = typeFormatMap[type] || function(v) {
                        return v;
                    };
                    if (config.value) {
                        config.value = formatter(config.value[0]);
                    }
                }
                config.value = config.value || '';
                return label;
            };
            var topLeftPainter = {
                paint: function(gc, x, y, width, height) {
                    //we know we are 1/2 height x 2 rows
                    //so offset height
                    var val = this.config.value;
                    gc.font = this.config.font;
                    gc.fillStyle = this.config.properties.topLeftColor;
                    gc.textAlign = 'left';
                    gc.textBaseline = 'middle';

                    //approxiamte line height is a 'W'
                    var size = gc.measureText('W');
                    var textHeight = size.width * 1.6;
                    var hoffset = Math.ceil(textHeight / 2.1);

                    if (val) {
                        for (var i = 0; i < val.length; i++) {
                            gc.fillText(val[i], 4, hoffset + (i * textHeight));
                        }
                    }
                    gc.strokeStyle = this.config.properties.lineColor;
                    gc.moveTo(0, height - 0.5);
                    gc.lineTo(width + 0, height - 0.5);
                    gc.moveTo(0, height + 0.5);
                    gc.lineTo(width + 0, height + 0.5);
                    gc.stroke();
                }
            };
            provider.getTopLeftCell = function(config) {
                var label = provider.cellCache.emptyCellRenderer;
                label.config = config;
                if (config.y === 0) {
                    topLeftPainter.config = config;
                    return topLeftPainter;
                }
                return label;
            };
            return provider;
        },

        connectTo: function(newUrl) {
            noop(newUrl);
            // this.setAttribute('url', newUrl);
            // this.reconnect();
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

        getTopLeftValue: function( /* x, y */ ) {
            var sortIndicator = this.getSortIndicator('h_');
            // var clone = this.block.G.slice(0);
            // if (clone.length === 0) {
            //     return clone;
            // }
            var hValue = this.block.Z[0].g_[0];
            var clone = ['Hierarchy', '\u25be ' + hValue];
            clone[0] = clone[0] + ' ' + sortIndicator;
            return clone;
        },

        //for now we use the hacky override implementation to save data, in the future we'll have a more elaborate protocol with Q to do real validation and setting of data.
        //<br>take note of the usage of the scrollPositionY value in translating our in-memory data page
        getValue: function(x, y) {
            var col = this.getColumnId(x);
            var normalized = Math.floor(y - this.scrollPositionY);
            if (this.block && col) {
                var val = this.block.Z[1][col][normalized];
                if (val || val === 0) {
                    return val;
                }
            }
            return '';
        },

        //empty out our page of local data, this function is used when we lose connectivity
        //<br>this function is primarily used as a visual queue so the user doesn't see stale data
        clearData: function() {
            this.block.rows = [];
            this.changed();
        },

        //rows is a field in our data payload from Q that tells us the total number of rows available in the Q process data source
        getRowCount: function() {
            return this.block.N - 1;
        },

        //Virtual column scrolling is not necessary with this GridBehavior because we only hold a small amount of vertical data in memory and most tables in Q are timeseries financial data meaning the are very tall and skinny.  We know all the columns from the first page from Q.
        getColumnCount: function() {
            return this.block.F.length;
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
            var startY = this.scrollPositionY || 0;
            var stopY = startY + 60;
            this.ws.send(JSON.stringify({
                id: this.getNextMessageId(),
                fn: 'get',
                start: startY,
                end: stopY
            }));
        },

        isConnected: function() {
            if (!this.ws) {
                return false;
            }
            return this.ws.readyState === this.ws.OPEN;
        },

        //return the column names, they are available to us as meta data in the most recent page Q sent us.
        getFixedRowValue: function(x, y) {
            var colId = this.getColumnId(x);
            if (y < 1) {
                var sortIndicator = this.getSortIndicator(colId);
                return colId + ' ' + sortIndicator;
            }
            var total = this.block.Z[0][colId];
            return total;
        },

        getSortIndicator: function(colId) {
            var sortIndex = this.block.S.cols.indexOf(colId);
            if (sortIndex < 0) {
                return '';
            }
            var sortState = this.block.S.sorts[sortIndex];
            var symbol = sortMap[sortState];
            var state = symbol + ' ' + (sortIndex + 1);
            return state;
        },
        // h_ is the text of the hierarchy column.
        // l_ is the level of the row of the table.
        // e_ tells you whether the row is a leaf or a node.
        // o_ tells you whether the row is open, if it's a node
        // n_ is a list of nodes
        // so:
        // indent h_[i] l_[i] spaces.
        // if e_[i]=1 then row i is a leaf. otherwise it's a node.
        // if row i is a node, then if o_[i]=0 then row i is closed (prefix with a +) else it's open (prefix with a -)

        getFixedColumnValue: function(x, y) {
            var indentPixels = 10;
            var blob = this.block.Z[1];
            var transY = Math.max(0, y - this.scrollPositionY);
            var data = blob.g_[transY];
            var indent = 5 + indentPixels + (blob.l_[transY] - 1) * indentPixels;
            var icon = '';
            if (!blob.e_[transY]) {
                icon = blob.o_[transY] ? '\u25be ' : '\u25b8 ';
            }
            return {
                data: data,
                indent: indent,
                icon: icon
            };
        },

        //let Q decide if this instance is sortable or not
        getCanSort: function() {
            return true;
        },

        //on a header click do a sort!
        fixedRowClicked: function(grid, mouse) {
            this.toggleSort(this.scrollPositionX + mouse.gridCell.x - this.getFixedColumnCount());
        },

        //hierarchy area clicked on lets sort there
        topLeftClicked: function(grid, mouse) {
            noop(grid, mouse);
            this._toggleSort('h_');
        },
        //first ask q if this is a sortable instance, then send a message to Q to sort our data set
        toggleSort: function(columnIndex) {
            var colId = this.getColumnId(columnIndex);
            this._toggleSort(colId);
        },
        _toggleSort: function(colId) {
            if (!this.getCanSort()) {
                return;
            }
            var sortBlob = this.block.S;
            var sortIndex = sortBlob.cols.indexOf(colId);

            //lets get the current state or 'n' if it doesn't exist yet
            var currentState = sortBlob.sorts[sortIndex] || 'n';

            //lets set to the next state or undefined
            var newState = sortStates[currentState];

            //remove this column from it's current order position
            if (sortIndex > -1) {
                sortBlob.cols.splice(sortIndex, 1);
                sortBlob.sorts.splice(sortIndex, 1);
            }

            //push to the front the new state
            if (newState) {
                sortBlob.cols.unshift(colId);
                sortBlob.sorts.unshift(newState);
            }

            //ony 3 nested sorts allowed for now
            sortBlob.cols.length = sortBlob.sorts.length = Math.min(3, sortBlob.cols.length);

            //lets tell Q now
            var msg = {
                id: this.getNextMessageId(),
                fn: 'sorts',
                cols: sortBlob.cols,
                sorts: sortBlob.sorts
            };

            this.ws.send(JSON.stringify(msg));

        },
        getFixedRowAlignment: function(x, y) {
            if (y > 0) {
                return this.getColumnAlignment(x);
            }
            return this.resolveProperty('fixedRowAlign');
        },
        //delegate column alignment through the map at the top based on the column type
        getColumnAlignment: function(x) {
            var colId = this.getColumnId(x);
            var type = this.block.Q[colId];
            var alignment = typeAlignmentMap[type];
            return alignment;
        },
        getColumnId: function(x) {
            var headers = this.block.F;
            x = this.translateColumnIndex(x);
            var col = headers[x];
            return col;
        },
        getFixedColumnAlignment: function( /* x */ ) {
            return 'left';
        },

        //for now use the cheesy local set data for storing user edits
        setValue: function(x, y, value) {
            x = this.translateColumnIndex(x);
            this.values['p_' + (x + 1) + '_' + y] = value;
        },

        fixedColumnClicked: function(grid, mouse) {
            var rowNum = mouse.gridCell.y - this.getFixedRowCount();
            var nodes = this.block.Z[1].n_[rowNum];
            var nodeClick = {
                id: this.getNextMessageId(),
                fn: 'node',
                node: nodes
            };
            this.ws.send(JSON.stringify(nodeClick));
        },
        openEditor: function(div) {
            var self = this;
            var container = document.createElement('div');

            var group = document.createElement('fin-hypergrid-dnd-list');
            var hidden = document.createElement('fin-hypergrid-dnd-list');
            var visible = document.createElement('fin-hypergrid-dnd-list');

            container.appendChild(group);
            container.appendChild(hidden);
            container.appendChild(visible);

            this.beColumnStyle(group.style);
            group.style.left = '0%';
            group.title = 'groups';
            group.list = this.block.G.slice(0);
            //can't remove the last item
            group.canDragItem = function(list, item, index, e) {
                noop(item, index, e);
                return list.length > 1;
            };
            //only allow dropping of H fields
            group.canDropItem = function(sourceList, myList, sourceIndex, item, e) {
                noop(sourceList, myList, sourceIndex, e);
                return self.block.H.indexOf(item) > -1;
            };

            this.beColumnStyle(hidden.style);
            hidden.style.left = '33.3333%';
            hidden.title = 'hidden columns';
            hidden.list = this.block.I.slice(0);

            this.beColumnStyle(visible.style);
            visible.style.left = '66.6666%';
            visible.title = 'visible columns';
            visible.list = this.block.F.slice(0);
            //can't remove the last item
            visible.canDragItem = function(list, item, index, e) {
                noop(item, index, e);
                return list.length > 1;
            };

            //attach for later retrieval
            div.lists = {
                group: group.list,
                hidden: hidden.list,
                visible: visible.list
            };

            div.appendChild(container);
            return true;
        },
        closeEditor: function(div) {
            var lists = div.lists;
            var changeCols = {
                id: this.getNextMessageId(),
                fn: 'groups',
                groups: lists.group,
                visible: lists.visible
            };
            this.ws.send(JSON.stringify(changeCols));
            return true;
        },

        //this is done through the dnd tool for now...
        //we can fix this to work both ways later
        isColumnReorderable: function() {
            return true;
        },
        getNextMessageId: function(onResponseDo) {
            var id = 'js_' + this.msgCounter++;
            if (onResponseDo) {
                this.msgResponsesActions[id] = onResponseDo;
            }
            return id;
        },
        endDragColumnNotification: function() {
            var self = this;

            var visible = this.block.F.slice(0);
            for (var i = 0; i < visible.length; i++) {
                visible[i] = this.getColumnId(i);
            }
            var msgId = this.getNextMessageId(function(message) {
                //ignore any predecessor column swap results if a new one has been posted
                self.initColumnIndexes();
                self.handleMessage(message);
            });
            var changeCols = {
                id: msgId,
                fn: 'groups',
                groups: this.block.G,
                visible: visible
            };
            this.ws.send(JSON.stringify(changeCols));
            return true;
        },
        handleMessage: function(d) {
            this.block = d;

            if (!this.tableState.columnIndexes || this.tableState.columnIndexes.length === 0) {
                this.initColumnIndexes();
            }
            this.changed();
        },
        //websocket connection to Q.  try and do a reconnect after 2 seconds if we fail
        connect: function() {
            var d = {};
            var self = this;
            if ('WebSocket' in window) {
                try {
                    this.ws = new WebSocket(this.url);
                } catch (e) {
                    console.log('could not connect to ' + this.url + ', trying to reconnect in a moment...');
                    return;
                }
                console.log('connecting...');
                this.ws.onopen = function() {
                    self.setFixedColumnWidth(0, 160);
                    var startY = this.scrollPositionY || 0;
                    var stopY = startY + 60;
                    self.ws.send(JSON.stringify({
                        id: self.getNextMessageId(),
                        fn: 'get',
                        start: startY,
                        end: stopY
                    }));
                };
                this.ws.onclose = function() {

                    console.log('disconnected from ' + this.url + ', trying to reconnect in a moment...');

                };
                this.ws.onmessage = function(e) {
                    d = JSON.parse(e.data);
                    var msgId = d.id;
                    var action = self.msgResponsesActions[msgId];
                    if (action) {
                        action(d);
                        self.msgResponsesActions[msgId] = undefined;
                    } else {
                        self.handleMessage(d);
                    }

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
        },
        beColumnStyle: function(style) {
            style.top = '5%';
            style.position = 'absolute';
            style.width = '33.3333%';
            style.height = '90%';
            style.whiteSpace = 'nowrap';
        }

    });

})(); /* jslint ignore:line */
