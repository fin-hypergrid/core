'use strict';

(function() {

    var noop = function() {};

    Polymer('fin-hypergrid-behavior-base', { /* jslint ignore:line */

        tableState: {},
        columnProperties: {},
        grid: null,
        editorTypes: ['choice', 'textfield', 'color', 'slider', 'spinner', 'date'],
        featureChain: null,
        fixedColumnCount: 0,

        clearObjectProperties: function(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    delete obj[prop];
                }
            }
        },

        ready: function() {
            this.readyInit();
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

            this.dataUpdates = {}; //for overriding with edit values;
            //this.initColumnIndexes();
            this.fixedColumnCount = 0;
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
            var columnCount = this._getColumnCount();
            var fixedColumnCount = this.getFixedColumnCount();
            var i;
            for (i = 0; i < columnCount; i++) {
                this.tableState.columnIndexes[i] = i;
            }
            for (i = 0; i < fixedColumnCount; i++) {
                this.tableState.fixedColumnIndexes[i] = i;
            }
        },

        insureColumnIndexesAreInitialized: function() {
            this.swapColumns(0, 0);
        },

        swapColumns: function(src, tar) {
            var indexes = this.tableState.columnIndexes;
            if (indexes.length === 0) {
                this.initColumnIndexes();
                indexes = this.tableState.columnIndexes;
            }
            var tmp = indexes[src + this.fixedColumnCount];
            indexes[src + this.fixedColumnCount] = indexes[tar + this.fixedColumnCount];
            indexes[tar + this.fixedColumnCount] = tmp;
        },

        translateColumnIndex: function(x) {
            var indexes = this.tableState.columnIndexes;
            if (indexes.length === 0) {
                return x;
            }
            return indexes[x + this.fixedColumnCount];
        },

        unTranslateColumnIndex: function(x) {
            return this.tableState.columnIndexes.indexOf(x);
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
            this.setNextFeature(document.createElement('fin-hypergrid-feature-key-paging'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-click'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-overlay'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-resizing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-row-resizing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-selection'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-moving'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-thumbwheel-scrolling'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-editing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-sorting'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-on-hover'));

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
        _getValue: function(x, y) {
            x = this.translateColumnIndex(x);
            var override = this.dataUpdates['p_' + x + '_' + y];
            if (override) {
                return override;
            }
            return this.getValue(x, y);
        },

        //set the data at the x, y
        //<br>this function should be overridden by you
        _setValue: function(x, y, value) {
            x = this.translateColumnIndex(x);
            this.setValue(x, y, value);
        },

        //fixed rows are the static rows at the top of the grid that don't scroll up or down
        //<br>they can be arbitary width by height in size
        //<br>here we just return an excel-ish base-26 alpha value
        _getFixedRowValue: function(x, y) {
            x = this.translateColumnIndex(x);
            return this.getFixedRowValue(x, y);
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
        _getColumnCount: function() {
            return this.getColumnCount() - this.tableState.hiddenColumns.length - this.fixedColumnCount;
        },

        //can be dynamic for supporting "floating" fixed rows
        //<br>floating rows are rows that become fixed if you
        //<br>scroll past them
        getFixedRowCount: function() {
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
            return this.getDefaultRowHeight();
        },

        //lets cache this as it's expensive to keep looking it up;
        getDefaultRowHeight: function() {
            if (!this.defaultRowHeight) {
                this.defaultRowHeight = this.resolveProperty('defaultRowHeight');
            }
            return this.defaultRowHeight;
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
        _getColumnWidth: function(x) {
            x = this.translateColumnIndex(x);
            return this.getColumnWidth(x);
        },

        _setColumnWidth: function(x, width) {
            x = this.translateColumnIndex(x);
            this.setColumnWidth(x, width);
            this.changed();
        },

        //this is set by OFGrid on scroll
        //<br>this allows for fast scrolling through rows of very large external data sets
        //<br>this is ignored by in memory GridBehaviors
        _setScrollPositionY: function(y) {
            this.setScrollPositionY(y);
            this.changed();
        },

        //this is set by OFGrid on scroll
        //<br>this allows for fast scrolling through columns of very large external data sets
        //<br>this is ignored by in memory GridBehaviors
        _setScrollPositionX: function(x) {
            this.setScrollPositionX(x);
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
        _getColumnAlignment: function(x) {
            x = this.translateColumnIndex(x);
            return this.getColumnAlignment(x);
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
        _getFixedRowAlignment: function(x, y) {
            x = this.translateColumnIndex(x);
            return this.getFixedRowAlignment(x, y);
        },

        //this is called by OFGrid when top left area is clicked
        //<br>see DefaultGridBehavior.delegateClick() below
        //<br>this is where we can hook in external data manipulation
        topLeftClicked: function(grid, mouse) {
            if (mouse.gridCell.x < this.fixedColumnCount) {
                this.fixedRowClicked(grid, mouse);
            } else {
                console.log('top Left clicked: ' + mouse.gridCell.x, mouse);
            }
        },
        //this is called by OFGrid when a fixed row cell is clicked
        //<br>see DefaultGridBehavior.delegateClick() below
        //<br>this is where we can hook in external data manipulation such as linking,
        //<br>drilling down on rows, etc...
        _fixedRowClicked: function(grid, mouse) {
            var x = this.translateColumnIndex(mouse.gridCell.x - this.getFixedColumnCount());
            var translatedPoint = this.grid.rectangles.point.create(this.scrollPositionX + x, mouse.gridCell.y);
            mouse.gridCell = translatedPoint;
            this.fixedRowClicked(grid, mouse);
        },

        //this is called by OFGrid when a fixed col cell is clicked
        //<br>see DefaultGridBehavior.delegateClick() below
        //<br>this is where we can hook in external data manipulation such as sorting,
        //<br>hiding/showing columns, etc...
        _fixedColumnClicked: function(grid, mouse) {
            var translatedPoint = this.grid.rectangles.point.create(mouse.gridCell.x, this.scrollPositionY + mouse.gridCell.y - this.getFixedRowCount());
            mouse.gridCell = translatedPoint;
            this.fixedColumnClicked(grid, mouse);
        },

        setCursor: function(grid) {
            grid.setDefaultCursor();
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

        handleMouseExit: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseExit(grid, event);
                this.setCursor(grid);
            }
        },

        _getCellEditorAt: function(x, y) {
            noop(y);
            x = this.translateColumnIndex(x);
            return this.getCellEditorAt(x);
        },

        changed: function() {},

        //this is done through the dnd tool for now...
        isColumnReorderable: function() {
            return true;
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
            this.insureColumnIndexesAreInitialized();
            var columnCount = this.tableState.columnIndexes.length;
            var labels = [];
            for (var i = 0; i < columnCount; i++) {
                var id = this.tableState.columnIndexes[i];
                if (id >= this.fixedColumnCount) {
                    labels.push({
                        id: id,
                        label: this.getFixedRowValue(id, 0)
                    });
                }
            }
            return labels;
        },

        setDNDColumnLabels: function(list) {
            //assumes there is one row....
            var columnCount = list.length;
            var indexes = [];
            var i;
            for (i = 0; i < this.fixedColumnCount; i++) {
                indexes.push(i);
            }
            for (i = 0; i < columnCount; i++) {
                indexes.push(list[i].id);
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
                    label: this.getFixedRowValue(id, 0)
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

        hideColumns: function(arrayOfIndexes) {
            var indexes = this.tableState.hiddenColumns;
            var order = this.tableState.columnIndexes;
            for (var i = 0; i < arrayOfIndexes.length; i++) {
                var each = arrayOfIndexes[i];
                if (indexes.indexOf(each) === -1) {
                    indexes.push(each);
                    order.splice(order.indexOf(each), 1);
                }
            }
        },

        getFixedColumnCount: function() {
            return this.fixedColumnCount;
        },

        setFixedColumnCount: function(numberOfFixedColumns) {
            this.fixedColumnCount = numberOfFixedColumns;
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
            style.height = '99%';
            style.whiteSpace = 'nowrap';
        },
        getCursorAt: function( /* x, y */ ) {
            return null;
        },

        //****************************************************
        //functions to override

        getValue: function(x, y) {
            return x + ', ' + y;
        },

        setValue: function(x, y, value) {
            this.dataUpdates['p_' + x + '_' + y] = value;
        },
        getColumnCount: function() {
            return 300;
        },

        getColumnWidth: function(x) {
            var override = this.tableState.columnWidths[x];
            if (override) {
                return override;
            }
            return this.resolveProperty('defaultColumnWidth');
        },

        setColumnWidth: function(x, width) {
            this.tableState.columnWidths[x] = Math.max(5, width);
        },

        getColumnAlignment: function( /* x */ ) {
            return 'center';
        },

        setScrollPositionX: function(x) {
            this.scrollPositionX = x;
        },

        setScrollPositionY: function(y) {
            this.scrollPositionY = y;
        },
        getFixedRowAlignment: function(x, y) {
            noop(x, y);
            return this.resolveProperty('fixedRowAlign');
        },

        getFixedRowValue: function(x /*, y*/ ) {
            return x;
        },

        getCellEditorAt: function(x, y) {
            noop(x, y);
            var cellEditor = this.grid.resolveCellEditor('textfield');
            return cellEditor;
        },

        //on a header click do a sort!
        fixedRowClicked: function(grid, mouse) {
            this.toggleSort(mouse.gridCell.x);
        },

        toggleSort: function(colIndex) {
            console.log('toggleSort(' + colIndex + ')');
        },

        fixedColumnClicked: function(grid, mouse) {
            console.log('fixedColumnClicked(' + mouse.gridCell.x + ', ' + mouse.gridCell.y + ')');
        },

        highlightCellOnHover: function(isColumnHovered, isRowHovered) {
            return isColumnHovered && isRowHovered;
        }

    });

})();
