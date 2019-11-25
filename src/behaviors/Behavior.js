'use strict';

var Point = require('rectangular').Point;

var Base = require('../Base');
var Column = require('./Column');
var cellEventFactory = require('../lib/cellEventFactory');
var fields = require('../lib/fields');
var featureRegistry = require('../features');
var ArrayDecorator = require('synonomous');
var assignOrDelete = require('../lib/assignOrDelete');
var dispatchGridEvent = require('../lib/dispatchGridEvent');


var noExportProperties = [
    'columnHeader',
    'columnHeaderColumnSelection',
    'filterProperties',
    'rowHeader',
    'rowHeaderRowSelection',
    'rowNumbersProperties',
    'treeColumnProperties',
    'treeColumnPropertiesColumnSelection',
];

/**
 * @mixes cellProperties.behaviorMixin
 * @mixes rowProperties.mixin
 * @mixes subgrids.mixin
 * @mixes dataModel.mixin
 * @constructor
 * @desc A controller for the data model.
 * > This constructor (actually `initialize`) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 * @param {Hypergrid} grid
 * @param {object} [options] - _(Passed to {@link Behavior#reset reset})._
 * @param {DataModel} [options.dataModel] - _Per {@link Behavior#reset reset}._
 * @param {object} [options.metadata] - _Per {@link Behavior#reset reset}._
 * @param {function} [options.DataModel=require('datasaur-local')] - _Per {@link Behavior#reset reset}._
 * @param {function|object[]} [options.data] - _Per {@link Behavior#setData setData}._
 * @param {function|menuItem[]} [options.schema] - _Per {@link Behavior#setData setData}._
 * @param {subgridSpec[]} [options.subgrids=this.grid.properties.subgrids] - _Per {@link Behavior#setData setData}._
 * @param {boolean} [options.apply=true] - _Per {@link Behavior#setData setData}._
 * @abstract
 */
var Behavior = Base.extend('Behavior', {

    initialize: function(grid, options) {
        /**
         * @type {Hypergrid}
         * @memberOf Behavior#
         */
        this.grid = grid;

        this.initializeFeatureChain();

        this.grid.behavior = this;
        this.reset(options);
    },

    /**
     * @desc Create the feature chain - this is the [chain of responsibility](http://c2.com/cgi/wiki?ChainOfResponsibilityPattern) pattern.
     * @param {Hypergrid} [grid] Unnecesary legacy parameter. May be omitted.
     * @memberOf Behavior#
     */
    initializeFeatureChain: function(grid) {
        var constructors;

        /**
         * @summary Controller chain of command.
         * @desc Each feature is linked to the next feature.
         * @type {Feature}
         * @memberOf Behavior#
         */
        this.featureChain = undefined;

        /**
         * @summary Hash of instantiated features by class names.
         * @desc Built here but otherwise not in use.
         * @type {object}
         * @memberOf Behavior#
         */
        this.featureMap = {};

        this.featureRegistry = this.featureRegistry || featureRegistry;

        if (this.grid.properties.features) {
            var getFeatureConstructor = this.featureRegistry.get.bind(this.featureRegistry);
            constructors = this.grid.properties.features.map(getFeatureConstructor);
        } else if (this.features) {
            constructors = this.features;
            warnBehaviorFeaturesDeprecation.call(this);
        }

        constructors.forEach(function(FeatureConstructor, i) {
            var feature = new FeatureConstructor;

            this.featureMap[feature.$$CLASS_NAME] = feature;

            if (i) {
                this.featureChain.setNext(feature);
            } else {
                this.featureChain = feature;
            }
        }, this);

        if (this.featureChain) {
            this.featureChain.initializeOn(this.grid);
        }
    },

    features: [], // override in implementing class; or provide feature names in grid.properties.features; else no features

    /**
     * Reset the behavior.
     * @param {object} [options] - _Same as constructor's `options`._<br>
     * _Passed to {@link Behavior#resetDataModel resetDataModel} and {@link Behavior#setData setData} (both of which see)._
     * @memberOf Behavior#
     */
    reset: function(options) {
        var dataModelChanged = this.resetDataModel(options);

        if (dataModelChanged) {
            // recreate `CellEvent` class so it can update its cached `grid`, `behavior`, and `dataModel` properties
            this.CellEvent = cellEventFactory(this.grid);
        }

        this.scrollPositionX = this.scrollPositionY = 0;

        this.rowPropertiesPrototype = Object.create(this.grid.properties,
            require('./rowProperties').rowPropertiesPrototypeDescriptors);

        this.clearColumns();
        this.createColumns();

        /**
         * Ordered list of subgrids to render.
         * @type {subgridSpec[]}
         * @memberOf Hypergrid#
         */
        this.subgrids = options && options.subgrids ||
            !dataModelChanged && this.subgrids ||
            this.grid.properties.subgrids;

        this.setData(options);
    },

    /**
     * @memberOf Local#
     * @description Set the header labels.
     * @param {string[]|object} headers - The header labels. One of:
     * * _If an array:_ Must contain all headers in column order.
     * * _If a hash:_ May contain any headers, keyed by field name, in any order.
     */
    setHeaders: function(headers) {
        if (headers instanceof Array) {
            // Reset all headers
            var allColumns = this.allColumns;
            headers.forEach(function(header, index) {
                allColumns[index].header = header; // setter updates header in both column and data source objects
            });
        } else if (typeof headers === 'object') {
            // Adjust just the headers in the hash
            this.allColumns.forEach(function(column) {
                if (headers[column.name]) {
                    column.header = headers[column.name];
                }
            });
        }
    },

    /**
     * @summary Set grid data.
     * @desc Fails silently if `dataRows` and `options.data` are both undefined.
     *
     * @param {function|object[]} [dataRows=options.data] - Array of uniform data row objects or function returning same.
     *
     * @param {object} [options] - _(Promoted to first argument position when `dataRows` omitted.)_
     *
     * @param {function|object[]} [options.data] - The data when `dataRows` undefined.
     *
     * @param {function|menuItem[]} [options.schema] - May be:
     * * A schema array
     * * A function returning same. Called at filter reset time with behavior as context.
     * * Omit to allow the data model to generate a basic schema from its data.
     *
     * @param {boolean} [options.apply=true] Apply data transformations to the new data.
     *
     * @memberOf Behavior#
     */
    setData: function(dataRows, options) {
        if (!(Array.isArray(dataRows) || typeof dataRows === 'function')) {
            options = dataRows;
            dataRows = options && options.data;
        }

        dataRows = this.unwrap(dataRows);

        if (dataRows === undefined) {
            return;
        }

        if (!Array.isArray(dataRows)) {
            throw 'Expected data to be an array (of data row objects).';
        }

        options = options || {};

        var schema = this.unwrap(options.schema);

        // Inform interested data models of data.
        this.subgrids.forEach(function(dataModel) {
            dataModel.setData(dataRows, schema);
        });

        if (this.grid.cellEditor) {
            this.grid.cellEditor.cancelEditing();
        }

        if (options.apply || options.apply === undefined) { // default is `true`
            this.reindex();
        }

        this.grid.allowEvents(this.getRowCount());
    },

    get renderedColumnCount() {
        return this.grid.renderer.visibleColumns.length;
    },

    get renderedRowCount() {
        return this.grid.renderer.visibleRows.length;
    },

    get leftMostColIndex() {
        return this.grid.properties.showRowNumbers ? this.rowColumnIndex : (this.hasTreeColumn() ? this.treeColumnIndex : 0);
    },

    clearColumns: function() {
        var schema = this.schema,
            tc = this.treeColumnIndex,
            rc = this.rowColumnIndex;

        this.columnsCreated = false;

        schema[tc] = schema[tc] || {};
        schema[tc].index = tc;
        if (schema[tc].name === undefined) { schema[tc].name = this.treeColumnNameDefault; }
        if (schema[tc].header === undefined) { schema[tc].header = this.treeColumnHeaderDefault; }

        schema[rc] = schema[rc] || {};
        schema[rc].index = rc;
        if (schema[rc].name === undefined) { schema[rc].name = this.rowColumnNameDefault; }
        if (schema[rc].header === undefined) { schema[rc].header = ''; }

        /**
         * @type {Column[]}
         * @memberOf Behavior#
         */
        this.columns = this.grid.decorateColumnArray();

        /**
         * @type {Column[]}
         * @memberOf Behavior#
         */
        this.allColumns = this.grid.decorateColumnArray();

        this.allColumns[tc] = this.columns[tc] = this.newColumn(schema[tc]);
        this.allColumns[rc] = this.columns[rc] = this.newColumn(schema[rc]);

        this.columns[tc].properties.propClassLayers = this.columns[rc].properties.propClassLayers = this.grid.properties.propClassLayersMap.NO_ROWS;

        // Signal the renderer to size the now-reset handle column before next render
        this.grid.renderer.resetRowHeaderColumnWidth();
    },

    getActiveColumn: function(x) {
        return this.columns[x];
    },

    /**
     * The "grid index" of an active column given a "data index" (number), column name (string), or column object
     * @param {Column|number} columnOrIndex
     * @returns {undefined|number} The grid index of the column or undefined if column not in grid.
     * @memberOf Hypergrid#
     */
    getActiveColumnIndex: function(columnOrIndexOrName) {
        var value = columnOrIndexOrName instanceof Column ? columnOrIndexOrName.index : columnOrIndexOrName,
            key = typeof index === 'number' ? 'index' : 'name';

        return this.columns.findIndex(function(column) { return column[key] === value; });
    },

    getColumn: function(x) {
        return this.allColumns[x];
    },

    newColumn: function(options) {
        return new Column(this, options);
    },

    addColumn: function(options) {
        var column = this.newColumn(options),
            arrayDecorator = new ArrayDecorator,
            synonyms = arrayDecorator.getSynonyms(column.name);

        this.columns.push(column);
        arrayDecorator.decorateObject(this.columns, synonyms, column);

        this.allColumns.push(column);
        arrayDecorator.decorateObject(this.allColumns, synonyms, column);

        return column;
    },

    createColumns: function(realImplementation) {
        var schema = this.dataModel.getSchema();

        fields.normalizeSchema(schema);
        fields.decorateSchema(schema);
        fields.decorateColumnSchema(schema, this.grid.properties.headerify);

        this.createDataRowProxy();

        this.clearColumns();

        if (realImplementation) {
            realImplementation.call(this);
        }

        this.columnsCreated = true;

        this.changed();

        dispatchGridEvent.call(this.grid, 'fin-hypergrid-columns-created');
    },

    createDataRowProxy: function() {
        // concrete implementation here if behavior doesn't implement its own getRow()
    },

    getColumnWidth: function(x) {
        var column = (x !== this.treeColumnIndex || this.hasTreeColumn()) && this.getActiveColumn(x);
        return column ? column.getWidth() : 0;
    },

    /**
     * @param {Column|number} columnOrIndex - The column or active column index.
     * @param width
     * @memberOf Hypergrid#
     */
    setColumnWidth: function(columnOrIndex, width) {
        var column = columnOrIndex >= -2 ? // relation operator tests for number (index) vs column (object)
            this.getActiveColumn(columnOrIndex) : columnOrIndex;
        column.setWidth(width);
        this.stateChanged();
    },

    /**
     * @memberOf Behavior#
     */
    reindex: function() {
        this.dataModel.reindex();
    },

    /**
     * @memberOf Behavior#
     * @desc utility function to empty an object of its members
     * @param {object} obj - the object to empty
     * @param {boolean} [exportProps]
     * * `undefined` (omitted) - delete *all* properties
     * * **falsy** - delete *only* the export properties
     * * **truthy** - delete all properties *except* the export properties
     */
    clearObjectProperties: function(obj, exportProps) {
        for (var key in obj) {
            if (
                obj.hasOwnProperty(key) && (
                    exportProps === undefined ||
                    !exportProps && noExportProperties.indexOf(key) >= 0 ||
                    exportProps && noExportProperties.indexOf(key) < 0
                )
            ) {
                delete obj[key];
            }
        }
    },

    //this is effectively a clone, with certain things removed....
    getState: function() {
        var copy = JSON.parse(JSON.stringify(this.grid.properties));
        this.clearObjectProperties(copy.columnProperties, false);
        return copy;
    },
    /**
     * @memberOf Behavior#
     * @desc clear all table state
     */
    clearState: function() {
        this.grid.clearState();
        this.createColumns();
    },

    /**
     * @memberOf Behavior#
     * @desc Restore this table to a previous state.
     * See the [memento pattern](http://c2.com/cgi/wiki?MementoPattern).
     * @param {Object} properties - assignable grid properties
     */
    setState: function(properties) {
        this.addState(properties, true);
    },

    /**
     * @memberOf Behavior#
     * @param {Object} properties - assignable grid properties
     * @param {boolean} [settingState] - Clear properties object before assignments.
     */
    addState: function(properties, settingState) {
        if (settingState) {
            this.clearState();
        }

        var gridProps = this.grid.properties;

        gridProps.settingState = settingState;
        assignOrDelete(gridProps, properties);
        delete gridProps.settingState;

        this.reindex();
    },

    /**
     * @summary Sets properties for active columns.
     * @desc Sets multiple columns' properties from elements of given array or collection. Keys may be column indexes or column names. The properties collection is cleared first. Falsy elements are ignored.
     * @param {object[]|undefined} columnsHash - If undefined, this call is a no-op.
     */
    setAllColumnProperties: function(columnsHash) {
        this.addAllColumnProperties(columnsHash, true);
    },

    /**
     * @summary Adds properties for multiple columns.
     * @desc Adds . The properties collection is optionally cleared first. Falsy elements are ignored.
     * @param {object[]|undefined} columnsHash - If undefined, this call is a no-op.
     * @param {boolean} [settingState] - Clear columns' properties objects before copying properties.
     */
    addAllColumnProperties: function(columnsHash, settingState) {
        if (!columnsHash) {
            return;
        }

        var columns = this.grid.behavior.getColumns();

        Object.keys(columnsHash).forEach(function(key) {
            var column = columns[key];
            if (column) {
                column.addProperties(columnsHash[key], settingState);
            }
        });
    },

    setColumnOrder: function(columnIndexes) {
        if (Array.isArray(columnIndexes)){
            var columns = this.columns,
                allColumns = this.allColumns,
                arrayDecorator = new ArrayDecorator;

            // avoid recreating the `columns` array object to keep refs valid; just empty it
            columns.length = 0;
            var tc = this.treeColumnIndex.toString(), rc = this.rowColumnIndex.toString();
            Object.keys(columns).forEach(function(key) {
                switch (key) {
                    case tc:
                    case rc:
                        break;
                    default:
                        delete columns[key];
                }
            });

            columnIndexes.forEach(function(index) {
                columns.push(allColumns[index]);
            });

            arrayDecorator.decorateArray(columns);
        }
    },

    setColumnOrderByName: function(columnNames) {
        if (Array.isArray(columnNames)) {
            var allColumns = this.allColumns;
            this.setColumnOrder(columnNames.map(function(name) { return allColumns[name].index; }));
        }
    },

    /**
     * @memberOf Behavior#
     * @desc Rebuild the column order indexes
     * @param {Array} columnIndexes - list of column indexes
     * @param {Boolean} [silent=false] - whether to trigger column changed event
     */
    setColumnIndexes: function(columnIndexes, silent) {
        this.grid.properties.columnIndexes = columnIndexes;
        if (!silent) {
            this.grid.fireSyntheticOnColumnsChangedEvent();
        }
    },

    /**
     * @summary Show inactive column(s) or move active column(s).
     *
     * @desc Adds one or several columns to the "active" column list.
     *
     * @param {boolean} [isActiveColumnIndexes=false] - Which list `columnIndexes` refers to:
     * * `true` - The active column list. This can only move columns around within the active column list; it cannot add inactive columns (because it can only refer to columns in the active column list).
     * * `false` - The full column list (as per column schema array). This inserts columns from the "inactive" column list, moving columns that are already active.
     *
     * @param {number|number[]} columnIndexes - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * _This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param {number} [referenceIndex=this.columns.length] - Insertion point, _i.e.,_ the element to insert before. A negative values skips the reinsert. Default is to insert new columns at end of active column list.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param {boolean} [allowDuplicateColumns=false] - Unless true, already visible columns are removed first.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted + one position when `referenceIndex` omitted._
     *
     * @memberOf Behavior#
     */
    showColumns: function(isActiveColumnIndexes, columnIndexes, referenceIndex, allowDuplicateColumns) {
        // Promote args when isActiveColumnIndexes omitted
        if (typeof isActiveColumnIndexes === 'number' || Array.isArray(isActiveColumnIndexes)) {
            allowDuplicateColumns = referenceIndex;
            referenceIndex = columnIndexes;
            columnIndexes = isActiveColumnIndexes;
            isActiveColumnIndexes = false;
        }

        var activeColumns = this.columns,
            sourceColumnList = isActiveColumnIndexes ? activeColumns : this.allColumns;

        // Nest scalar index
        if (typeof columnIndexes === 'number') {
            columnIndexes = [columnIndexes];
        }

        var newColumns = columnIndexes
            .map(function(index) { return sourceColumnList[index]; }) // Look up columns using provided indexes
            .filter(function(column) { return column; }); // Remove any undefined columns

        // Default insertion point is end (i.e., before (last+1)th element)
        if (typeof referenceIndex !== 'number') {
            allowDuplicateColumns = referenceIndex; // assume reference index was omitted when not a number
            referenceIndex = activeColumns.length;
        }

        // Remove already visible columns and adjust insertion point
        if (!allowDuplicateColumns) {
            newColumns.forEach(function(column) {
                var i = activeColumns.indexOf(column);
                if (i >= 0) {
                    activeColumns.splice(i, 1);
                    if (referenceIndex > i) {
                        --referenceIndex;
                    }
                }
            });
        }

        // Insert the new columns at the insertion point
        if (referenceIndex >= 0) {
            activeColumns.splice.apply(activeColumns, [referenceIndex, 0].concat(newColumns));
        }

        this.grid.properties.columnIndexes = activeColumns.map(function(column) { return column.index; });
    },

    /**
     * @summary Hide active column(s).
     * @desc Removes one or several columns from the "active" column list.
     * @param {boolean} [isActiveColumnIndexes=false] - Which list `columnIndexes` refers to:
     * * `true` - The active column list.
     * * `false` - The full column list (as per column schema array).
     * @param {number|number[]} columnIndexes - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * _This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted._
     * @memberOf Behavior#
     */
    hideColumns: function(isActiveColumnIndexes, columnIndexes) {
        var args = Array.prototype.slice.call(arguments); // Convert to array so we can add an argument (element)
        args.push(-1); // Remove only; do not reinsert.
        this.showColumns.apply(this, args);
    },

    /**
     * @memberOf Behavior#
     * @desc fetch the value for a property key
     * @returns {*} The value of the given property.
     * @param {string} key - a property name
     */
    resolveProperty: function(key) {
        // todo: remove when we remove the deprecated grid.resolveProperty
        return this.grid.resolveProperty(key);
    },

    lookupFeature: function(key) {
        return this.featureMap[key];
    },

    /**
     * @memberOf Behavior#
     * @return {number} The width of the fixed column area in the hypergrid.
     */
    getFixedColumnsWidth: function() {
        var count = this.getFixedColumnCount(),
            columnWidth,
            total = 0,
            i = this.leftMostColIndex,
            gridProps = this.grid.properties,
            contentBox = gridProps.boxSizing !== 'border-box',
            gridLinesVWidth = gridProps.gridLinesVWidth;

        for (; i < count; i++) {
            columnWidth = this.getColumnWidth(i);
            if (columnWidth) {
                total += columnWidth;
                if (contentBox) {
                    total += gridLinesVWidth;
                }
            }
        }

        // add in fixed rule thickness excess
        if (gridProps.fixedLinesVWidth) {
            total += gridProps.fixedLinesHWidth - gridLinesVWidth;
        }

        return total;
    },

    /**
     * @memberOf Behavior#
     * @desc This exists to support "floating" columns.
     * @return {number} The total width of the fixed columns area.
     */
    getFixedColumnsMaxWidth: function() {
        return this.getFixedColumnsWidth();
    },

    /**
     * @memberOf Behavior#
     * @desc delegate setting the cursor up the feature chain of responsibility
     * @param {Hypergrid} grid
     */
    setCursor: function(grid) {
        grid.updateCursor();
        this.featureChain.setCursor(grid);
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse move to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onMouseMove: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseMove(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling tap to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onClick: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleClick(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling tap to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onContextMenu: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleContextMenu(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling wheel moved to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onWheelMoved: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleWheelMoved(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse up to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onMouseUp: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseUp(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse drag to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onMouseDrag: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseDrag(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling key down to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onKeyDown: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleKeyDown(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling key up to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onKeyUp: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleKeyUp(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling double click to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onDoubleClick: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleDoubleClick(grid, event);
            this.setCursor(grid);
        }
    },
    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse down to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseDown(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseExit: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseExit(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc Delegate handling touchstart to the feature chain of responsibility.
     * @param {Hypergrid} grid The grid instance.
     * @param {Object} event - The event details.
     */
    onTouchStart: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleTouchStart(grid, event);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc Delegate handling touchmove to the feature chain of responsibility.
     * @param {Hypergrid} grid The grid instance.
     * @param {Object} event - The event details.
     */
    onTouchMove: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleTouchMove(grid, event);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc Delegate handling touchend to the feature chain of responsibility.
     * @param {Hypergrid} grid The grid instance.
     * @param {Object} event - The event details.
     */
    onTouchEnd: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleTouchEnd(grid, event);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc I've been notified that the behavior has changed.
     */
    changed: function() { this.grid.behaviorChanged(); },

    /**
     * @memberOf Behavior#
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    shapeChanged: function() { this.grid.behaviorShapeChanged(); },

    /**
     * @memberOf Behavior#
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    stateChanged: function() { this.grid.behaviorStateChanged(); },

    /**
     * @memberOf Behavior#
     * @return {boolean} Can re-order columns.
     */
    isColumnReorderable: function() {
        return this.deprecated('isColumnReorderable()', 'grid.properties.columnsReorderable', '2.1.3');
    },

    /**
     * @param {index} x - Data x coordinate.
     * @return {Object} The properties for a specific column.
     * @memberOf Behavior#
     */
    getColumnProperties: function(x) {
        var column = (x !== this.treeColumnIndex || this.hasTreeColumn()) && this.getColumn(x);
        return column && column.properties;
    },

    /**
     * @param {index} x - Data x coordinate.
     * @return {Object} The properties for a specific column.
     * @memberOf Behavior#
     */
    setColumnProperties: function(x, properties) {
        var column = this.getColumn(x);
        if (!column) {
            throw 'Expected column.';
        }
        var result = Object.assign(column.properties, properties);
        this.changed();
        return result;
    },

    /**
     * Clears all cell properties of given column or of all columns.
     * @param {number} [x] - Omit for all columns.
     * @memberOf Behavior#
     */
    clearAllCellProperties: function(x) {
        var X;

        if (x === undefined) {
            x = 0;
            X = this.columns.length;
        } else {
            X = x + 1;
        }

        for (; x < X; x++) {
            var column = this.getColumn(x);
            if (column) {
                column.clearAllCellProperties();
            }
        }
    },

    /**
     * @memberOf Behavior#
     * @return {string[]} All the currently hidden column header labels.
     */
    getHiddenColumnDescriptors: function() {
        var tableState = this.grid.properties;
        var indexes = tableState.columnIndexes;
        var labels = [];
        var columnCount = this.getActiveColumnCount();
        for (var i = 0; i < columnCount; i++) {
            if (indexes.indexOf(i) === -1) {
                var column = this.getActiveColumn(i);
                labels.push({
                    id: i,
                    header: column.header,
                    field: column.name
                });
            }
        }
        return labels;
    },

    /**
     * @memberOf Behavior#
     * @return {number} The number of fixed columns.
     */
    getFixedColumnCount: function() {
        return this.grid.properties.fixedColumnCount;
    },

    /**
     * @memberOf Behavior#
     * @desc set the number of fixed columns
     * @param {number} n - the integer count of how many columns to be fixed
     */
    setFixedColumnCount: function(n) {
        this.grid.properties.fixedColumnCount = n;
    },

    /**
     * @summary The number of "fixed rows."
     * @desc The number of (non-scrollable) rows preceding the (scrollable) data subgrid.
     * @memberOf Behavior#
     * @return {number} The sum of:
     * 1. All rows of all subgrids preceding the data subgrid.
     * 2. The first `fixedRowCount` rows of the data subgrid.
     */
    getFixedRowCount: function() {
        return (
            this.getHeaderRowCount() +
            this.grid.properties.fixedRowCount
        );
    },

    /**
     * @memberOf Behavior#
     * @desc Set the number of fixed rows, which includes (top to bottom order):
     * 1. The header rows
     *    1. The header labels row (optional)
     *    2. The filter row (optional)
     *    3. The top total rows (0 or more)
     * 2. The non-scrolling rows (externally called "the fixed rows")
     *
     * @returns {number} Sum of the above or 0 if none of the above are in use.
     *
     * @param {number} The number of rows.
     */
    setFixedRowCount: function(n) {
        this.grid.properties.fixedRowCount = n;
    },

    /**
     * @memberOf Behavior#
     * @desc a dnd column has just been dropped, we've been notified
     */
    endDragColumnNotification: function() {},

    /**
     * @memberOf Behavior#
     * @return {null} the cursor at a specific x,y coordinate
     * @param {number} x - the x coordinate
     * @param {number} y - the y coordinate
     */
    getCursorAt: function(x, y) {
        return null;
    },

    /**
     * Number of _visible_ columns.
     * @memberOf Behavior#
     * @return {number} The total number of columns.
     */
    getActiveColumnCount: function() {
        return this.columns.length;
    },

    /**
     * @summary Column alignment of given grid column.
     * @desc One of:
     * * `'left'`
     * * `'center'`
     * * `'right'`
     *
     * Cascades to grid.
     * @memberOf Behavior#
     * @desc Quietly set the horizontal scroll position.
     * @param {number} x - The new position in pixels.
     */
    setScrollPositionX: function(x) {
        /**
         * @memberOf Behavior#
         * @type {number}
         */
        this.scrollPositionX = x;
    },

    getScrollPositionX: function() {
        return this.scrollPositionX;
    },

    /**
     * @memberOf Behavior#
     * @desc Quietly set the vertical scroll position.
     * @param {number} y - The new position in pixels.
     */
    setScrollPositionY: function(y) {
        /**
         * @memberOf Behavior#
         * @type {number}
         */
        this.scrollPositionY = y;
    },

    getScrollPositionY: function() {
        return this.scrollPositionY;
    },

    /**
     * @memberOf Behavior#
     * @return {cellEditor} The cell editor for the cell at the given coordinates.
     * @param {CellEvent} editPoint - The grid cell coordinates.
     */
    getCellEditorAt: function(event) {
        return event.isDataColumn && event.column.getCellEditorAt(event);
    },

    /**
     * @memberOf Behavior#
     * @return {boolean} `true` if we should highlight on hover
     * @param {boolean} isColumnHovered - the column is hovered or not
     * @param {boolean} isRowHovered - the row is hovered or not
     */
    highlightCellOnHover: function(isColumnHovered, isRowHovered) {
        return isColumnHovered && isRowHovered;
    },

    /**
     * @memberOf Behavior#
     * @desc this function is a hook and is called just before the painting of a cell occurs
     * @param {Point} cell
     */
    set cellPropertiesPrePaintNotification(cell) {
        throw new this.HypergridError('cellPropertiesPrePaintNotification has been deprecated as of v3.0.0. Code to inspect or mutate the render config object should be moved to the getCell hook.');
    },

    /**
     * @memberOf Behavior#
     * @desc swap src and tar columns
     * @param {number} src - column index
     * @param {number} tar - column index
     */
    swapColumns: function(source, target) {
        var columns = this.columns;
        var tmp = columns[source];
        columns[source] = columns[target];
        columns[target] = tmp;
        this.changed();
    },

    convertViewPointToDataPoint: function(unscrolled) {
        return new Point(
            this.getActiveColumn(unscrolled.x).index,
            unscrolled.y
        );
    },

    hasTreeColumn: function(columnIndex) {
        return false;
    },

    getSelectionMatrixFunction: function(selectedRows) {
        return function() {
            return null;
        };
    },

    getRowHeaderColumn: function() {
        return this.allColumns[this.rowColumnIndex];
    },

    getTreeColumn: function() {
        return this.allColumns[this.treeColumnIndex];
    },

    autosizeAllColumns: function() {
        this.checkColumnAutosizing(true);
        this.changed();
    },

    checkColumnAutosizing: function(force) {
        var autoSized = this.autoSizeRowNumberColumn(force) || this.autoSizeTreeColumn(force);

        this.allColumns.findWithNeg(function(column) {
            autoSized = column.checkColumnAutosizing(force) || autoSized;
        });

        return autoSized;
    },

    autoSizeRowNumberColumn: function(force) {
        if (this.grid.properties.showRowNumbers && this.grid.properties.rowNumberAutosizing) {
            return this.getRowHeaderColumn().checkColumnAutosizing(force);
        }
    },

    autoSizeTreeColumn: function(force) {
        if (this.grid.properties.showTreeColumn && this.grid.properties.treeColumnAutosizing) {
            return this.getTreeColumn().checkColumnAutosizing(force);
        }
    },

    getColumns: function() {
        return this.allColumns;
    },

    getActiveColumns: function() {
        return this.columns;
    },

    getHiddenColumns: function() {
        var visible = this.columns;
        var all = this.allColumns;
        var hidden = [];
        for (var i = 0; i < all.length; i++) {
            if (visible.indexOf(all[i]) === -1) {
                hidden.push(all[i]);
            }
        }
        hidden.sort(function(a, b) {
            return a.header < b.header;
        });
        return hidden;
    },

    getSelectedRows: function() {
        return this.grid.selectionModel.getSelectedRows();
    },

    getSelectedColumns: function() {
        return this.grid.selectionModel.getSelectedColumns();
    },

    getSelections: function() {
        return this.grid.selectionModel.getSelections();
    },

    getIndexedData: function() {
        return this.deprecated('getIndexedData()', 'getData()', '3.0.0');
    }
});


// tree and row number column defaults; define indexes as immutable (i.e., !writable)
Object.defineProperties(Behavior.prototype, {
    treeColumnIndex: { value: -1 },
    treeColumnNameDefault: { value: 'Tree', writable: true },
    treeColumnHeaderDefault: { value: 'Tree', writable: true },

    rowColumnIndex: { value: -2 },
    rowColumnNameDefault: { value: 'RowHeader', writable: true }
});


function warnBehaviorFeaturesDeprecation() {
    var featureNames = [], unregisteredFeatures = [], n = 0;

    this.features.forEach(function(FeatureConstructor) {
        var className = FeatureConstructor.prototype.$$CLASS_NAME || FeatureConstructor.name,
            featureName = className || 'feature' + n++;

        // build list of feature names
        featureNames.push(featureName);

        // build list of unregistered features
        if (!this.featureRegistry.get(featureName, true)) {
            var constructorName = FeatureConstructor.name || FeatureConstructor.prototype.$$CLASS_NAME || 'FeatureConstructor' + n,
                params = [];
            if (!className) {
                params.push('\'' + featureName + '\'');
            }
            params.push(constructorName);
            unregisteredFeatures.push(params.join(', '));
        }
    }, this);

    if (featureNames.length) {
        var sampleCode = 'Hypergrid.defaults.features = [\n' + join('\t\'', featureNames, '\',\n') + '];';

        if (unregisteredFeatures.length) {
            sampleCode += '\n\nThe following custom features are unregistered and will need to be registered prior to behavior instantiation:\n\n' +
                join('Features.add(', unregisteredFeatures, ');\n');
        }

        if (n) {
            sampleCode += '\n\n(You should provide meaningful names for your custom features rather than the generated names above.)';
        }

        console.warn('`grid.behavior.features` (array of feature constructors) has been deprecated as of version 2.1.0 in favor of `grid.properties.features` (array of feature names). Remove `features` array from your behavior and add `features` property to your grid state object (or Hypergrid.defaults), e.g.:\n\n' + sampleCode);
    }
}

function join(prefix, array, suffix) {
    return prefix + array.join(suffix + prefix) + suffix;
}


// synonyms

/**
 * Synonym of {@link Behavior#reindex}.
 * @name applyAnalytics
 * @deprecated
 * @memberOf Behavior#
 */
Behavior.prototype.applyAnalytics = Behavior.prototype.reindex;


// mix-ins
Behavior.prototype.mixIn(require('./rowProperties').mixin);
Behavior.prototype.mixIn(require('./gridCellProperties').mixin);
Behavior.prototype.mixIn(require('./dataModel').mixin);
Behavior.prototype.mixIn(require('./subgrids').mixin);


module.exports = Behavior;
