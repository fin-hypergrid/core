/* global numeral*/
'use strict';
//fin-hypergrid-behavior-qtree is a datasource based on an external Q data source with tree-centric analytic capilities
//<br>See [kx.com](http://www.kx.com)
//<br>Two example scripts are provided in the root of this project, bigtable.q and sorttable.q
//<br>bigtable.q simulates an unsortable 100MM row table, and sorttable.q provides a true randomly generated 1MM row table sortable on any column.
//<br>Run either of these scripts with this GridBehavior.

(function() {

    var noop = function() {};
    var logMessages = true;
    var hierarchyColumn = 'g_';

    //keys mapping Q datatypes to aligment and renderers are setup here.
    //<br>see [q datatypes](http://code.kx.com/wiki/Reference/Datatypes) for more.

    var typeAlignmentMap = {
        j: 'right',
        s: 'left',
        t: 'center',
        f: 'right',
        i: 'right',
        e: 'right',
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

    var icommify = function(v) {
        if (v) {
            return numeral(v).format('0,0');
        } else if (v === 0) {
            return '0';
        } else {
            return '';
        }
    };

    var fcommify = function(v) {
        if (v) {
            return numeral(v).format('0,0.00');
        } else if (v === 0) {
            return '0.00';
        } else {
            return '';
        }
    };

    var typeFormatMap = {
        J: function(v) {
            return v;
        },
        j: icommify,
        s: function(v) {
            return v;
        },
        t: function(v) {
            return v;
        },
        e: fcommify,
        i: icommify,
        f: fcommify,
        d: function(v) {
            return v;
        }
    };

    //this will map will ultimately be user editable and persisted
    //it maps an alias from the Q data world to behavior, formatting and look and feel
    var propertiesMap = {
        columns: {
            TEST: {
                formatter: fcommify,
                alignment: 'right',
                modifyConfig: function(cell) {
                    noop(cell);
                }
            },
            USD: {
                formatter: fcommify,
                alignment: 'right',
                modifyConfig: function(cell) {
                    cell.config.fgColor = '#1C4A16'; //'#53FF07'; //green
                    if (cell.config.value < 0) {
                        cell.config.fgColor = '#C13527'; //'#FF1515'; //red
                    }
                }
            },
            VOL: {
                formatter: function(v) {
                    if (v) {
                        var result = numeral(v).format('0.000a');
                        return result;
                    } else {
                        return v;
                    }
                },
                alignment: 'right',
                modifyConfig: function(cell) {
                    cell.config.fgColor = '#669203'; //'#53FF07'; //green
                    if (cell.config.value < 0) {
                        cell.config.fgColor = '#C13527'; //'#FF1515'; //red
                    }
                }
            }
        }
    };


    //sort states are also the visual queues in the column headers
    //* '' no sort
    //* ↑ sort ascending
    //* ↓ sort descending
    //* ⤒ sort absolute value ascending
    //* ⤓ sort absolute value descending;
    // \u25be

    var sortMap = {
        a: '-up',
        d: '-down',
        A: '-abs-up',
        D: '-abs-down',
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
                O: {
                    columns: {}
                },
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
            var columns = propertiesMap.columns;
            provider.getCell = function(config) {
                var cell = provider.cellCache.simpleCellRenderer;
                cell.config = config;
                var colId = self.block.F[config.x];
                var type = self.block.Q[colId];
                var colProps;
                var colPropertyAlias = self.block.O.columns[colId];
                if (colPropertyAlias) {
                    colProps = columns[colPropertyAlias];
                    colProps.modifyConfig(cell);
                }
                var formatter = colProps ? colProps.formatter : typeFormatMap[type] || function(v) {
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
                    config.value = config.value[0];
                    return provider.getCell(config);
                }
                config.value = config.value || '';
                return label;
            };

            provider.getTopLeftCell = function(config) {
                var empty = provider.cellCache.emptyCellRenderer;
                var label = provider.cellCache.simpleCellRenderer;
                label.config = config;
                if (config.y === 0) {
                    return label;
                } else {
                    return empty;
                }
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
            //var sortIndicator = this.getSortIndicator(hierarchyColumn);
            // var clone = this.block.G.slice(0);
            // if (clone.length === 0) {
            //     return clone;
            // }
            //var hValue = this.block.Z[0].g_[0];
            var clone = [this.getImage('up-rectangle'), 'Hierarchy', this.getSortIndicator(hierarchyColumn)];
            //clone[0] = clone[0] + ' ' + sortIndicator;
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
            return Math.max(0, this.block.N - 1);
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
            this.sendMessage({
                id: this.getNextMessageId(),
                fn: 'get',
                start: startY,
                end: stopY
            });
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
                var clickIndicator = this.getClickIndicator(colId);
                return [clickIndicator, colId, sortIndicator];
            }
            var total = this.block.Z[0][colId];
            return total;
        },

        getClickIndicator: function(colId) {
            noop(colId);
            return this.getImage('down-rectangle');
        },

        getSortIndicator: function(colId) {
            var sortIndex = this.block.S.cols.indexOf(colId);
            if (sortIndex < 0) {
                return this.getImage('sortable');
            }
            var sortState = this.block.S.sorts[sortIndex];
            var symbol = (sortIndex + 1) + sortMap[sortState];
            var state = this.getImage(symbol);
            return state;
        },

        //hierarchyColumn is the text of the hierarchy column.
        // l_ is the level of the row of the table.
        // e_ tells you whether the row is a leaf or a node.
        // o_ tells you whether the row is open, if it's a node
        // n_ is a list of nodes
        // so:
        // indenthierarchyColumni] l_[i] spaces.
        // if e_[i]=1 then row i is a leaf. otherwise it's a node.
        // if row i is a node, then if o_[i]=0 then row i is closed (prefix with a +) else it's open (prefix with a -)

        getFixedColumnValue: function(x, y) {
            var indentPixels = 10;
            var blob = this.block.Z[1];
            var transY = Math.max(0, y - this.scrollPositionY);
            var data = blob.g_[transY];
            var level = blob.l_[transY];
            var indent = 5 + indentPixels + (level - 1) * indentPixels;
            var icon = '';
            if (!blob.e_[transY] && (level !== this.block.G.length)) {
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

            this.sendMessage(msg);

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
            var colProps;
            var colPropertyAlias = this.block.O.columns[colId];
            if (colPropertyAlias) {
                colProps = propertiesMap.columns[colPropertyAlias];
            }
            var alignment = colProps ? colProps.alignment : typeAlignmentMap[type];
            return alignment;
        },

        getColumnId: function(x) {
            var headers = this.block.F;
            var col = headers[x];
            return col;
        },

        getFixedColumnAlignment: function( /* x */ ) {
            return 'left';
        },

        //hierarchy area clicked on lets sort there
        topLeftClicked: function(grid, mouse) {
            var colId = hierarchyColumn;
            var colWidth = this.getFixedColumnWidth(0);
            var mousePoint = mouse.mousePoint.x;
            if (mousePoint < (colWidth / 2)) {
                var colClick = {
                    id: this.getNextMessageId(),
                    fn: 'col',
                    col: colId
                };
                this.sendMessage(colClick);
            } else {
                this._toggleSort(colId);
            }
        },
        fixedColumnClicked: function(grid, mouse) {
            var rowNum = mouse.gridCell.y - this.scrollPositionY;
            var rows = this.block.Z[1].n_[rowNum];
            if (rows.length === this.block.G.length) {
                //this is a leaf, don't send anything
                return;
            }
            var rowClick = {
                id: this.getNextMessageId(),
                fn: 'row',
                row: rows
            };
            this.sendMessage(rowClick);
        },

        fixedRowClicked: function(grid, mouse) {
            var colId = this.getColumnId(mouse.gridCell.x);
            var colWidth = this.getColumnWidth(mouse.gridCell.x);
            var mousePoint = mouse.mousePoint.x;
            if (mousePoint < (colWidth / 2)) {
                var colClick = {
                    id: this.getNextMessageId(),
                    fn: 'col',
                    col: colId
                };
                this.sendMessage(colClick);
            } else {
                this.toggleSort(mouse.gridCell.x);
            }
        },

        cellClicked: function(cell, event) {
            var rowNum = cell.y - this.scrollPositionY;
            var rows = this.block.Z[1].n_[rowNum];
            var colId = this.getColumnId(cell.x);
            var colClick = {
                id: this.getNextMessageId(),
                fn: 'cell',
                col: colId,
                row: rows
            };
            this.sendMessage(colClick);
            this.grid.fireCellClickEvent(cell, event);
        },

        sendMessage: function(message) {
            if (logMessages) {
                console.dir('out-' + Date.now(), message);
            }
            this.ws.send(JSON.stringify(message));
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

            this.sendMessage(changeCols);
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
                var transX = this.translateColumnIndex(i);
                visible[i] = this.getColumnId(transX);
            }
            var msgId = this.getNextMessageId(function(message) {
                //ignore any predecessor column swap results if a new one has been posted
                var colCount = self.getColumnCount();
                var widths = [];
                for (var i = 0; i < colCount; i++) {
                    widths[i] = self._getColumnWidth(i);
                }
                self.initColumnIndexes();
                for (i = 0; i < colCount; i++) {
                    widths[i] = self._setColumnWidth(i, widths[i]);
                }
                self.handleMessage(message);
            });
            var changeCols = {
                id: msgId,
                fn: 'groups',
                groups: this.block.G,
                visible: visible
            };

            this.sendMessage(changeCols);
            return true;
        },

        handleMessage: function(d) {
            //insure certain things exist
            if (d.O && !d.O.columns) {
                d.O.columns = {};
            }

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

                    self.sendMessage({
                        id: self.getNextMessageId(),
                        fn: 'get',
                        start: startY,
                        end: stopY
                    });
                };
                this.ws.onclose = function() {

                    console.log('disconnected from ' + this.url + ', trying to reconnect in a moment...');

                };
                this.ws.onmessage = function(e) {
                    d = JSON.parse(e.data);
                    if (logMessages) {
                        console.log('in-' + Date.now(), d);
                    }
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
            style.height = '99%';
            style.whiteSpace = 'nowrap';
        },

        highlightCellOnHover: function(isColumnHovered, isRowHovered) {
            return isRowHovered;
        },

        getCellEditorAt: function(x, y) {
            noop(x, y);
            return null;
        },

        getFixedColumnCount: function() {
            return 1;
        },

    });

})(); /* jslint ignore:line */
