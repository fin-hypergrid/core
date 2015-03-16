'use strict';

(function() {

    var noop = function() {};
    var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    Polymer({ /* jslint ignore:line */

        ready: function() {
            this.readyInit();
        },

        tableState: {},
        columnProperties: {},
        grid: null,
        editorTypes: ['choice', 'textfield', 'color', 'slider', 'spinner', 'date'],
        featureChain: null,

        clearObjectProperties: function(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    delete obj[prop];
                }
            }
        },

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

            this.values = {}; //for overriding with edit values;
            this.initColumnIndexes();
        },
        resolveProperty: function(key) {
            return this.grid.resolveProperty(key);
        },
        getState: function() {
            return this.tableState;
        },

        setState: function(state) {
            for (var key in state) {
                if (state.hasOwnProperty(key)) {
                    this.tableState[key] = state[key];
                }
            }
        },

        initColumnIndexes: function() {
            var columnCount = this.getColumnCount();
            var fixedColumnCount = this.getFixedColumnCount();
            var i;

            for (i = 0; i < columnCount; i++) {
                this.tableState.columnIndexes[i] = i;
            }

            for (i = 0; i < fixedColumnCount; i++) {
                this.tableState.fixedColumnIndexes[i] = i;
            }

        },

        swapColumns: function(src, tar) {
            var tmp = this.tableState.columnIndexes[src];
            this.tableState.columnIndexes[src] = this.tableState.columnIndexes[tar];
            this.tableState.columnIndexes[tar] = tmp;
        },

        translateColumnIndex: function(x) {
            return this.tableState.columnIndexes[x];
        },

        setNextFeature: function(nextFeature) {
            if (this.featureChain) {
                this.featureChain.setNext(nextFeature);
            } else {
                this.featureChain = nextFeature;
            }
        },

        installOn: function(grid) {
            grid.setBehavior(this);
            this.initializeFeatureChain(grid);
        },

        initializeFeatureChain: function(grid) {
            this.setNextFeature(document.createElement('fin-hypergrid-feature-overlay'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-resizing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-row-resizing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-selection'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-moving'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-thumbwheel-scrolling'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-editing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-sorting'));
            this.featureChain.initializeOn(grid);
        },

        getCellProvider: function() {
            return this.cellProvider;
        },

        setGrid: function(finGrid) {
            this.grid = finGrid;
        },

        getGrid: function() {
            return this.grid;
        },

        //override this function on your GridBehavior to have custom cell renderering
        //<br>see [QGridBehavior.createCellProvider()](QGridBehavior.html) for an example
        createCellProvider: function() {
            var provider = document.createElement('fin-hypergrid-cell-provider');
            return provider;
        },

        getTopLeftValue: function( /* x, y */ ) {
            return '';
        },

        //provide the data at the x,y coordinate in the grid
        //<br>this function should be overridden by you
        getValue: function(x, y) {
            x = this.translateColumnIndex(x);
            var override = this.values['p_' + x + '_' + y];
            if (override) {
                return override;
            }
            return x + ', ' + a[y % 26];
        },

        //set the data at the x, y
        //<br>this function should be overridden by you
        setValue: function(x, y, value) {
            x = this.translateColumnIndex(x);
            this.values['p_' + x + '_' + y] = value;
        },

        //fixed rows are the static rows at the top of the grid that don't scroll up or down
        //<br>they can be arbitary width by height in size
        //<br>here we just return an excel-ish base-26 alpha value
        getFixedRowValue: function(x /*, y*/ ) {
            x = this.translateColumnIndex(x);
            return this.getHeader(x);
        },

        //the untranslated value
        getHeader: function(x /*, y*/ ) {
            return this.alphaFor(x);
        },
        //fixed columns are the static columns at the left of the grid that don't scroll up or down
        //<br>they can be arbitary width by height in size
        //<br>here we just return an excel-ish base-26 alpha value
        getFixedColumnValue: function(x, y) {
            //x = this.fixedtranslateColumnIndex(x);
            return y + 1;
        },

        //can be dynamic if your data set changes size
        getRowCount: function() {
            //jeepers batman a quadrillion rows!
            return 1000000000000000;
        },

        //can be dynamic if your data set changes size
        getColumnCount: function() {
            return 300 - this.tableState.hiddenColumns.length;
        },

        //can be dynamic for supporting "floating" fixed rows
        //<br>floating rows are rows that become fixed if you
        //<br>scroll past them
        getFixedRowCount: function() {
            return 1;
        },

        //can be dynamic for supporting "floating" fixed columns
        //<br>floating columns are columns that become fixed if you
        //<br>scroll past them
        getFixedColumnCount: function() {
            return 1;
        },

        //pixel height of the fixed rows area
        getFixedRowsHeight: function() {
            var count = this.getFixedRowCount();
            var total = 0;
            for (var i = 0; i < count; i++) {
                total = total + this.getFixedRowHeight(i);
            }
            return total;
        },

        //the height of the specific fixed row
        getFixedRowHeight: function(rowNum) {
            if (this.tableState.fixedRowHeights) {
                var override = this.tableState.fixedRowHeights[rowNum];
                if (override) {
                    return override;
                }
            }
            return this.resolveProperty('defaultFixedRowHeight');
        },

        setFixedRowHeight: function(rowNum, height) {
            //console.log(rowNum + ' ' + height);
            this.tableState.fixedRowHeights[rowNum] = Math.max(5, height);
            this.changed();
        },

        //can be dynamic if we wish to allow users to resize
        //<br>or driven by data, etc...
        getRowHeight: function(rowNum) {
            if (this.tableState.rowHeights) {
                var override = this.tableState.rowHeights[rowNum];
                if (override) {
                    return override;
                }
            }
            return this.resolveProperty('defaultRowHeight');
        },

        setRowHeight: function(rowNum, height) {
            this.tableState.rowHeights[rowNum] = Math.max(5, height);
            this.changed();
        },

        //the potential maximum height of the fixed row area
        //<br>TODO: move this logic into the OFGrid itself
        //<br>there should only be getFixedRows, and getMaxFixedRows
        getFixedRowsMaxHeight: function() {
            var height = this.getFixedRowsHeight();
            return height;
        },

        //pixel width of the fixed columns area
        getFixedColumnsWidth: function() {
            var count = this.getFixedColumnCount();
            var total = 0;
            for (var i = 0; i < count; i++) {
                total = total + this.getFixedColumnWidth(i);
            }
            return total;
        },
        setFixedColumnWidth: function(colNumber, width) {
            this.tableState.fixedColumnWidths[colNumber] = Math.max(5, width);
            this.changed();
        },
        //the potential maximum width of the fixed col area
        //<br>TODO: move this logic into the OFGrid itself
        //<br>there should only be getFixedColumns, and getMaxFixedColumns
        getFixedColumnsMaxWidth: function() {
            var width = this.getFixedColumnsWidth();
            return width;
        },

        //the width of the specific fixed col
        getFixedColumnWidth: function(colNumber) {
            var override = this.tableState.fixedColumnWidths[colNumber];
            if (override) {
                return override;
            }
            return this.resolveProperty('defaultFixedColumnWidth');
        },

        //can be dynamic if we wish to allow users to resize
        //<br>or driven by data, etc...
        //<br>this implementation is driven by modulo
        //<br>TODO: move this example into InMemoryGridBehavior
        getColumnWidth: function(colNumber) {
            colNumber = this.tableState.columnIndexes[colNumber];
            var override = this.tableState.columnWidths[colNumber];
            if (override) {
                return override;
            }
            return this.resolveProperty('defaultColumnWidth');
        },

        setColumnWidth: function(colNumber, width) {
            colNumber = this.tableState.columnIndexes[colNumber];
            this.tableState.columnWidths[colNumber] = Math.max(5, width);
            this.changed();
        },

        //this is set by OFGrid on scroll
        //<br>this allows for fast scrolling through rows of very large external data sets
        //<br>this is ignored by in memory GridBehaviors
        setScrollPositionY: function(y) {
            this.scrollPositionY = y;
            this.changed();
        },

        //this is set by OFGrid on scroll
        //<br>this allows for fast scrolling through columns of very large external data sets
        //<br>this is ignored by in memory GridBehaviors
        setScrollPositionX: function(x) {
            this.scrollPositionX = x;
            this.changed();
        },

        //the number of viewable columns we just rendered
        //<br>set by OFGrid on every repaint
        setRenderedWidth: function(width) {
            this.renderedWidth = width;
        },

        //the number of viewable rows we just rendered
        //<br>set by OFGrid on every repaint
        setRenderedHeight: function(height) {
            this.renderedHeight = height;
        },

        //answers the default col alignment for the main data area of the grid
        //<br>TODO:provide uniform mechanism for the fixed areas like this
        getColumnAlignment: function( /* x */ ) {
            return 'center';
        },

        //answers the default alignment for the topleft area of the grid
        //<br>TODO:provide uniform mechanism for the fixed areas like this
        getTopLeftAlignment: function( /* x, y */ ) {
            return 'center';
        },
        //answers the default col alignment for the fixed column data area of the grid
        //<br>TODO:provide uniform mechanism for the fixed areas like this
        getFixedColumnAlignment: function( /* x */ ) {
            return this.resolveProperty('fixedColumnAlign');
        },


        //answers the default row alignment for the fixed row data area of the grid
        //<br>TODO:provide uniform mechanism for the fixed areas like this
        getFixedRowAlignment: function( /* x, y */ ) {
            return this.resolveProperty('fixedRowAlign');
        },
        //this is called by OFGrid when top left area is clicked
        //<br>see DefaultGridBehavior.delegateClick() below
        //<br>this is where we can hook in external data manipulation
        topLeftClicked: function(grid, mouse) {
            console.log('top Left clicked: ' + mouse.gridCell.x, mouse);
        },
        //this is called by OFGrid when a fixed row cell is clicked
        //<br>see DefaultGridBehavior.delegateClick() below
        //<br>this is where we can hook in external data manipulation such as linking,
        //<br>drilling down on rows, etc...
        fixedRowClicked: function(grid, mouse) {
            console.log('fixed row clicked: ' + mouse.gridCell.x, mouse);
        },

        //this is called by OFGrid when a fixed col cell is clicked
        //<br>see DefaultGridBehavior.delegateClick() below
        //<br>this is where we can hook in external data manipulation such as sorting,
        //<br>hiding/showing columns, etc...
        fixedColumnClicked: function(grid, mouse) {
            console.log('fixed col clicked: ' + mouse.gridCell.y, mouse);
        },

        setCursor: function(grid) {
            grid.beCursor('default');
            this.featureChain.setCursor(grid);
        },

        onMouseMove: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseMove(grid, event);
                this.setCursor(grid);
            }
        },
        //this is called by OFGrid when a fixed cell is clicked
        onTap: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleTap(grid, event);
                this.setCursor(grid);
            }
        },

        onWheelMoved: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleWheelMoved(grid, event);
                this.setCursor(grid);
            }
        },

        onMouseUp: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseUp(grid, event);
                this.setCursor(grid);
            }
        },

        onMouseDrag: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseDrag(grid, event);
                this.setCursor(grid);
            }
        },

        onKeyDown: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleKeyDown(grid, event);
                this.setCursor(grid);
            }
        },

        onKeyUp: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleKeyUp(grid, event);
                this.setCursor(grid);
            }
        },

        onDoubleClick: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleDoubleClick(grid, event);
                this.setCursor(grid);
            }
        },

        onHoldPulse: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleHoldPulse(grid, event);
                this.setCursor(grid);
            }
        },

        handleMouseDown: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseDown(grid, event);
                this.setCursor(grid);
            }
        },

        getCellEditorAt: function(x, y) {
            noop(y);
            x = this.translateColumnIndex(x);
            var cellEditor = this.grid.resolveCellEditor('textfield');
            return cellEditor;
        },

        changed: function() {},

        //this is done through the dnd tool for now...
        isColumnReorderable: function() {
            return true;
        },

        alphaFor: function(i) {
            // Name the column headers in A, .., AA, AB, AC, .., AZ format
            // quotient/remainder
            //var quo = Math.floor(col/27);
            var quo = Math.floor((i) / 26);
            var rem = (i) % 26;
            var code = '';
            if (quo > 0) {
                code += String.fromCharCode('A'.charCodeAt(0) + quo - 1);
            }
            code += String.fromCharCode('A'.charCodeAt(0) + rem);
            return code;
        },

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
        getDNDColumnLabels: function() {
            //assumes there is one row....
            var columnCount = this.getColumnCount();
            var labels = new Array(columnCount);
            for (var i = 0; i < columnCount; i++) {
                var id = this.tableState.columnIndexes[i];
                labels[i] = {
                    id: id,
                    label: this.getHeader(id)
                };
            }
            return labels;
        },
        setDNDColumnLabels: function(list) {
            //assumes there is one row....
            var columnCount = list.length;
            var indexes = new Array(columnCount);
            for (var i = 0; i < columnCount; i++) {
                indexes[i] = list[i].id;
            }
            this.tableState.columnIndexes = indexes;
            this.changed();
        },
        getDNDHiddenColumnLabels: function() {
            var indexes = this.tableState.hiddenColumns;
            var labels = new Array(indexes.length);
            for (var i = 0; i < labels.length; i++) {
                var id = indexes[i];
                labels[i] = {
                    id: id,
                    label: this.getHeader(id)
                };
            }
            return labels;
        },
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
        closeEditor: function(div) {
            noop(div);
            var lists = div.lists;
            this.setDNDColumnLabels(lists.visible);
            this.setDNDHiddenColumnLabels(lists.hidden);
            return true;
        },
        endDragColumnNotification: function() {
            return true;
        },
        beColumnStyle: function(style) {
            style.top = '5%';
            style.position = 'absolute';
            style.width = '50%';
            style.height = '90%';
            style.whiteSpace = 'nowrap';
        },

    });

})(); /* jslint ignore:line */
