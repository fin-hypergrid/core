/* eslint-env browser */
'use strict';

var _ = require('object-iterators');
var Base = require('../lib/Base');

var Column = require('./Column');
var dialogs = require('../dialogs');
var CellProvider = require('../lib/CellProvider');
var ColumnSchemaFactory = require('../filter/ColumnSchemaFactory');
var DefaultFilter = require('../filter/DefaultFilter');

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

var isNull = {
    isNull: true
};

/**
 * @constructor
 * @abstract
 * @desc A sort of "model++." It contains all code/data that's necessary for easily implementing a virtual data source and its manipulation/analytics.
 *
 */
var Behavior = Base.extend('Behavior', {

    /**
     * @desc this is the callback for the plugin pattern of nested tags
     * @param {Hypergrid} grid
     * @memberOf Behavior.prototype
     */
    initialize: function(grid) {

        /**
         * @type {Hypergrid}
         * @memberOf Behavior.prototype
         */
        this.grid = grid;

        /**
         * @type {DataModel}
         * @memberOf Behavior.prototype
         */
        this.dataModel = this.getDefaultDataModel();

        grid.setBehavior(this);

        this.reset();

        this.initializeFeatureChain(grid);
    },

    /**
     * @desc create the feature chain - this is the [chain of responsibility](http://c2.com/cgi/wiki?ChainOfResponsibilityPattern) pattern.
     * @param {Hypergrid} grid
     * @memberOf Behavior.prototype
     */
    initializeFeatureChain: function(grid) {
        var self = this;

        /**
         * @summary Hash of feature class names.
         * @desc Built here but otherwise not in use.
         * @type {object}
         * @memberOf Behavior.prototype
         */
        this.featureMap = {};

        this.features.forEach(function(FeatureConstructor) {
            var newFeature = new FeatureConstructor;
            self.featureMap[newFeature.$$CLASS_NAME] = newFeature;
            if (self.featureChain) {
                self.featureChain.setNext(newFeature);
            } else {
                /**
                 * @summary Controller chain of command.
                 * @desc Each feature is linked to the next feature.
                 * @type {Feature}
                 * @memberOf Behavior.prototype
                 */
                self.featureChain = newFeature;
            }
        });
        if (this.featureChain) {
            this.featureChain.initializeOn(grid);
        }
    },

    features: [], // override in implementing class unless no features

    reset: function() {
        this.cellProvider = this.createCellProvider();
        this.renderedColumnCount = 30;
        this.renderedRowCount = 60;
        this.dataUpdates = {}; //for overriding with edit values;
        this.scrollPositionX = this.scrollPositionY = 0;
        this.clearColumns();
        this.clearState();
        this.dataModel.reset();
        this.createColumns();
    },

    clearColumns: function() {
        /**
         * @type {Column[]}
         * @memberOf Behavior.prototype
         */
        this.columns = [];

        /**
         * @type {Column[]}
         * @memberOf Behavior.prototype
         */
        this.allColumns = [];

        this.columns[-1] = this.newColumn(-1, '');
        this.columns[-2] = this.newColumn(-2, 'Tree');
        this.allColumns[-1] = this.columns[-1];
        this.allColumns[-2] = this.columns[-2];
    },

    getColumn: function(x) {
        return this.columns[x];
    },

    getColumnId: function(x) {
        return this.getColumn(x).getHeader();
    },

    newColumn: function(index, label) {
        var properties = this.createColumnProperties();
        this.getPrivateState().columnProperties[index] = properties;
        return new Column(this, index, label);
    },

    addColumn: function(index, label) {
        var column = this.newColumn(index, label);
        this.columns.push(column);
        this.allColumns.push(column);
        return column;
    },

    createColumns: function() {
        //concrete implementation here
    },

    createColumnProperties: function() {
        var tableState = this.getPrivateState();
        var properties = Object.create(tableState);

        properties.rowNumbersProperties = Object.create(properties, {
            foregroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.columnHeaderForegroundSelectionColor;
                },
                set: function(value) {
                    this.columnHeaderForegroundSelectionColor = value;
                }
            },
            backgroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.columnHeaderBackgroundSelectionColor;
                },
                set: function(value) {
                    this.columnHeaderBackgroundSelectionColor = value;
                }
            }
        });

        properties.rowHeader = Object.create(properties, {
            font: {
                configurable: true,
                get: function() {
                    return this.rowHeaderFont;
                },
                set: function(value) {
                    this.rowHeaderFont = value;
                }
            },
            color: {
                configurable: true,
                get: function() {
                    return this.rowHeaderColor;
                },
                set: function(value) {
                    this.rowHeaderColor = value;
                }
            },
            backgroundColor: {
                configurable: true,
                get: function() {
                    return this.rowHeaderBackgroundColor;
                },
                set: function(value) {
                    this.rowHeaderBackgroundColor = value;
                }
            },
            foregroundSelectionFont: {
                configurable: true,
                get: function() {
                    return this.rowHeaderForegroundSelectionFont;
                },
                set: function(value) {
                    this.rowHeaderForegroundSelectionFont = value;
                }
            },
            foregroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.rowHeaderForegroundSelectionColor;
                },
                set: function(value) {
                    this.rowHeaderForegroundSelectionColor = value;
                }
            },
            backgroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.rowHeaderBackgroundSelectionColor;
                },
                set: function(value) {
                    this.rowHeaderBackgroundSelectionColor = value;
                }
            }
        });

        properties.columnHeader = Object.create(properties, {
            format: {
                value: 'default'
            },
            font: {
                configurable: true,
                get: function() {
                    return this.columnHeaderFont;
                },
                set: function(value) {
                    this.columnHeaderFont = value;
                }
            },
            color: {
                configurable: true,
                get: function() {
                    return this.columnHeaderColor;
                },
                set: function(value) {
                    this.columnHeaderColor = value;
                }
            },
            backgroundColor: {
                configurable: true,
                get: function() {
                    return this.columnHeaderBackgroundColor;
                },
                set: function(value) {
                    this.columnHeaderBackgroundColor = value;
                }
            },
            foregroundSelectionFont: {
                configurable: true,
                get: function() {
                    return this.columnHeaderForegroundSelectionFont;
                },
                set: function(value) {
                    this.columnHeaderForegroundSelectionFont = value;
                }
            },
            foregroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.columnHeaderForegroundSelectionColor;
                },
                set: function(value) {
                    this.columnHeaderForegroundSelectionColor = value;
                }
            },
            backgroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.columnHeaderBackgroundSelectionColor;
                },
                set: function(value) {
                    this.columnHeaderBackgroundSelectionColor = value;
                }
            }
        });

        properties.columnHeaderColumnSelection = Object.create(properties.columnHeader, {
            foregroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.columnHeaderForegroundColumnSelectionColor;
                },
                set: function(value) {
                    this.columnHeaderForegroundColumnSelectionColor = value;
                }
            },
            backgroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.columnHeaderBackgroundColumnSelectionColor;
                },
                set: function(value) {
                    this.columnHeaderBackgroundColumnSelectionColor = value;
                }
            }
        });

        properties.rowHeaderRowSelection = Object.create(properties.rowHeader, {
            foregroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.rowHeaderForegroundRowSelectionColor;
                },
                set: function(value) {
                    this.rowHeaderForegroundRowSelectionColor = value;
                }
            },
            backgroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.rowHeaderBackgroundRowSelectionColor;
                },
                set: function(value) {
                    this.rowHeaderBackgroundRowSelectionColor = value;
                }
            }
        });

        properties.filterProperties = Object.create(properties, {
            font: {
                configurable: true,
                get: function() {
                    return this.filterFont;
                },
                set: function(value) {
                    this.filterFont = value;
                }
            },
            color: {
                configurable: true,
                get: function() {
                    return this.filterColor;
                },
                set: function(value) {
                    this.filterColor = value;
                }
            },
            backgroundColor: {
                configurable: true,
                get: function() {
                    return this.filterBackgroundColor;
                },
                set: function(value) {
                    this.filterBackgroundColor = value;
                }
            },
            foregroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.filterForegroundSelectionColor;
                },
                set: function(value) {
                    this.filterForegroundSelectionColor = value;
                }
            },
            backgroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.filterBackgroundSelectionColor;
                },
                set: function(value) {
                    this.filterBackgroundSelectionColor = value;
                }
            },
            cellBorderStyle: {
                configurable: true,
                get: function() {
                    return this.filterCellBorderStyle;
                },
                set: function(value) {
                    this.filterCellBorderStyle = value;
                }
            },
            cellBorderThickness: {
                configurable: true,
                get: function() {
                    return this.filterCellBorderThickness;
                },
                set: function(value) {
                    this.filterCellBorderThickness = value;
                }
            }
        });

        properties.treeColumnProperties = Object.create(properties, {
            font: {
                configurable: true,
                get: function() {
                    return this.treeColumnFont;
                },
                set: function(value) {
                    this.treeColumnFont = value;
                }
            },
            color: {
                configurable: true,
                get: function() {
                    return this.treeColumnColor;
                },
                set: function(value) {
                    this.treeColumnColor = value;
                }
            },
            backgroundColor: {
                configurable: true,
                get: function() {
                    return this.treeColumnBackgroundColor;
                },
                set: function(value) {
                    this.treeColumnBackgroundColor = value;
                }
            },
            foregroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.treeColumnForegroundSelectionColor;
                },
                set: function(value) {
                    this.treeColumnForegroundSelectionColor = value;
                }
            },
            backgroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.treeColumnBackgroundSelectionColor;
                },
                set: function(value) {
                    this.treeColumnBackgroundSelectionColor = value;
                }
            }
        });

        properties.treeColumnPropertiesColumnSelection = Object.create(properties.treeColumnProperties, {
            foregroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.treeColumnForegroundColumnSelectionColor;
                },
                set: function(value) {
                    this.treeColumnForegroundColumnSelectionColor = value;
                }
            },
            backgroundSelectionColor: {
                configurable: true,
                get: function() {
                    return this.treeColumnBackgroundColumnSelectionColor;
                },
                set: function(value) {
                    this.treeColumnBackgroundColumnSelectionColor = value;
                }
            }
        });

        return properties;
    },

    getColumnWidth: function(x) {
        var col = this.getColumn(x);
        if (!col) {
            return this.resolveProperty('defaultColumnWidth');
        }
        var width = col.getWidth();
        return width;
    },

    setColumnWidth: function(x, width) {
        this.getColumn(x).setWidth(width);
        this.stateChanged();
    },

    /** @deprecated Use `.dataModel` property instead.
     * @memberOf Behavior.prototype
     * @returns {Hypergrid} The hypergrid to which this behavior is attached.
     */
    getDataModel: function() {
        return this.deprecated('dataModel', { since: '0.2.1' });
    },

    getCellRenderer: function(config, x, y) {
        return this.getColumn(x).getCellRenderer(config, y);
    },

    applyAnalytics: function() {
        this.dataModel.applyAnalytics();
    },

    /**
     * @memberOf Behavior.prototype
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

    /**
     * @memberOf Behavior.prototype
     * @desc getter for a [Memento](http://c2.com/cgi/wiki?MementoPattern) Object
     * @returns {object}
     */
    getPrivateState: function() {
        if (!this.tableState) {
            this.tableState = this.getDefaultState();
        }
        return this.tableState;
    },

    //this is effectively a clone, with certain things removed....
    getState: function() {
        var copy = JSON.parse(JSON.stringify(this.getPrivateState()));
        this.clearObjectProperties(copy.columnProperties, false);
        return copy;
    },
    /**
     * @memberOf Behavior.prototype
     * @desc clear all table state
     */
    clearState: function() {
        /**
         * memento for the user configured visual properties of the table
         * @type {object}
         * @memberOf Behavior.prototype
         */
        this.tableState = null;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {object} Newly created default empty tablestate.
     */
    getDefaultState: function() {
        var tableProperties = this.grid._getProperties();
        var state = Object.create(tableProperties);

        _(state).extendOwn({
            rowHeights: {},
            cellProperties: {},
            columnProperties: []
        });

        return state;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Restore this table to a previous state.
     * See the [memento pattern](http://c2.com/cgi/wiki?MementoPattern).
     * @param {Object} memento - an encapsulated representation of table state
     */
    setState: function(memento) {

        //we don't want to clobber the column properties completely
        if (!memento.columnIndexes) {
            var fields = this.getFields();
            memento.columnIndexes = [];
            for (var i = 0; i < fields.length; i++) {
                memento.columnIndexes[i] = i;
            }
        }
        var colProperties = memento.columnProperties;
        delete memento.columnProperties;
        this.tableState = null;
        var state = this.getPrivateState();
        this.createColumns();
        this._setColumnOrder(memento.columnIndexes);
        _(state).extendOwn(memento);
        this.setAllColumnProperties(colProperties);
        memento.columnProperties = colProperties;
        //memento.columnProperties = colProperties;

        // this.dataModel.setState(memento);
        // var self = this;
        // requestAnimationFrame(function() {
        //     self.applySorts();
        //     self.changed();
        //     self.stateChanged();
        // });

        //just to be close/ it's easier on the eyes
        this.setColumnWidth(-1, 24.193359375);
        this.dataModel.applyState();
    },

    setAllColumnProperties: function(properties) {
        properties = properties || [];
        for (var i = 0; i < properties.length; i++) {
            var current = this.getPrivateState().columnProperties[i];
            this.clearObjectProperties(current, false);
            _(current).extendOwn(properties[i]);
        }
    },

    _setColumnOrder: function(indexes) {
        if (!Array.isArray(indexes)){
            return;
        }
        if (!indexes) {
            this.columns.length = 0;
            return;
        }
        this.columns.length = indexes.length;
        for (var i = 0; i < indexes.length; i++) {
            this.columns[i] = this.allColumns[indexes[i]];
        }
    },

    applySorts: function() {
        //if I have sorts, apply them now//
    },

    /**
     * @memberOf Behavior.prototype
     * @desc fetch the value for a property key
     * @returns {*} The value of the given property.
     * @param {string} key - a property name
     */
    resolveProperty: function(key) {
        return this.grid.resolveProperty(key);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc A specific cell was clicked; you've been notified.
     * @param {Point} cell - point of cell coordinates
     * @param {Object} event - all event information
     */
    cellClicked: function(cell, event) {
        this.dataModel.cellClicked(cell, event);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc A specific cell was le double-clicked; you've been notified.
     * @param {Point} cell - point of cell coordinates
     * @param {Object} event - all event information
     */
    cellDoubleClicked: function(cell, event) {

    },

    lookupFeature: function(key) {
        return this.featureMap[key];
    },

    /**
     * @memberOf Behavior.prototype
     * @desc getter for the cell provider
     * @return {CellProvider}
     */
    getCellProvider: function() {
        return this.cellProvider;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc setter for the hypergrid
     * @param {Hypergrid} grid
     */
    setGrid: function(grid) {
    },

    /** @deprecated Use `.grid` property instead.
     * @memberOf Behavior.prototype
     * @returns {Hypergrid} The hypergrid to which this behavior is attached.
     * @param {type} varname - descripton
     */
    getGrid: function() {
        return this.deprecated('grid', { since: '0.2' });
    },

    /**
     * @memberOf Behavior.prototype
     * @desc You can override this function and substitute your own cell provider.
     * @return {CellProvider}
     */
    createCellProvider: function() {
        return new CellProvider();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc First check to see if something was overridden.
     * @return {*} The value at `x,y` for the top left section of the hypergrid.
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     */
    getValue: function(x, y) {
        var column = this.getColumn(x);
        return column && column.getValue(y);
    },

    getUnfilteredValue: function(x, y) {
        var column = this.getColumn(x);
        return column && column.getUnfilteredValue(y);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc update the data at point x, y with value
     * @return The data.
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     * @param {Object} value - the value to use
     */
    setValue: function(x, y, value) {
        var column = this.getColumn(x);
        return column && column.setValue(y, value);
    },

    getDataValue: function(x, y) {
        return this.dataModel.getValue(x, y);
    },

    setDataValue: function(x, y, value) {
        this.dataModel.setValue(x, y, value);
    },
    /**
     * @memberOf Behavior.prototype
     * @desc First checks to see if something was overridden.
     * @return {*} The value at x,y for the top left section of the hypergrid.
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     */
    getCellProperties: function(x, y) {
        return this.getColumn(x).getCellProperties(y);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc update the data at point x, y with value
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     * @param {Object} value - the value to use
     */
    setCellProperties: function(x, y, value) {
        var col = this.getColumn(x);
        if (col) {
            col.setCellProperties(y, value);
        }
    },
    /**
     * @memberOf Behavior.prototype
     * @return {number} The number of rows in the hypergrid.
     */
    getRowCount: function() {
        return this.dataModel.getRowCount();
    },

    getUnfilteredRowCount: function() {
        return this.dataModel.getUnfilteredRowCount();
    },
    /**
     * @memberOf Behavior.prototype
     * @return {number} The height in pixels of the fixed rows area  of the hypergrid.
     */
    getFixedRowsHeight: function() {
        var count = this.getFixedRowCount();
        var total = 0;
        for (var i = 0; i < count; i++) {
            total = total + this.getRowHeight(i);
        }
        //var footerHeight = this.getDefaultRowHeight();
        //total = total + (footerHeight * this.getFooterRowCount());
        return total;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The height in pixels of a specific row in the hypergrid.
     * @param {number} rowNum - row index of interest
     */
    getRowHeight: function(rowNum) {
        var rowHeights = this.getPrivateState().rowHeights;
        return rowHeights && rowHeights[rowNum] || this.getDefaultRowHeight();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc The value is lazily initialized and comes from the properties mechanism for '`defaultRowHeight`', which should be ~20px.
     * @returns {number} The row height in pixels.
     */
    getDefaultRowHeight: function() {
        if (!this.defaultRowHeight) {
            this.defaultRowHeight = this.resolveProperty('defaultRowHeight');
        }
        return this.defaultRowHeight;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc set the pixel height of a specific row
     * @param {number} rowNum - the row index of interest
     * @param {number} height - pixel height
     */
    setRowHeight: function(rowNum, height) {
        var tableState = this.getPrivateState();
        tableState.rowHeights[rowNum] = Math.max(5, height);
        this.stateChanged();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc This will allow 'floating' fixed rows.
     * @return {number} The maximum height of the fixed rows area in the hypergrid.
     */
    getFixedRowsMaxHeight: function() {
        return this.getFixedRowsHeight();
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The width of the fixed column area in the hypergrid.
     */
    getFixedColumnsWidth: function() {
        var count = this.getFixedColumnCount();
        var total = 0;
        if (this.grid.isShowRowNumbers()) {
            total = this.getColumnWidth(-1);
        }
        for (var i = 0; i < count; i++) {
            total = total + this.getColumnWidth(i);
        }
        return total;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc This exists to support "floating" columns.
     * @return {number} The total width of the fixed columns area.
     */
    getFixedColumnsMaxWidth: function() {
        return this.getFixedColumnsWidth();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Set the scroll position in vertical dimension and notify listeners.
     * @param {number} y - the new y value
     */
    _setScrollPositionY: function(y) {
        this.setScrollPositionY(y);
        this.changed();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Set the scroll position in horizontal dimension and notify listeners.
     * @param {number} x - the new x value
     */
    _setScrollPositionX: function(x) {
        this.setScrollPositionX(x);
        this.changed();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Set the number of columns just rendered, including partially rendered columns.
     * @param {number} count - how many columns were just rendered
     */
    setRenderedColumnCount: function(count) {
        this.renderedColumnCount = count;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Set the number of rows just rendered, including partially rendered rows.
     * @param {number} count - how many rows were just rendered
     */
    setRenderedRowCount: function(count) {
        this.renderedRowCount = count;
    },


    /**
     * @memberOf Behavior.prototype
     * @desc The fixed row area has been clicked, massage the details and call the real function.
     * @param {Hypergrid} grid
     * @param {Object} mouse - event details
     */
    _fixedRowClicked: function(grid, mouse) {
        var x = this.translateColumnIndex(this.getScrollPositionX() + mouse.gridCell.x - this.getFixedColumnCount());
        var translatedPoint = this.grid.newPoint(x, mouse.gridCell.y);
        mouse.gridCell = translatedPoint;
        this.fixedRowClicked(grid, mouse);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc The fixed column area has been clicked, massage the details and call the real function.
     * @param {Hypergrid} grid
     * @param {Object} mouse - event details
     */
    _fixedColumnClicked: function(grid, mouse) {
        var translatedPoint = this.grid.newPoint(mouse.gridCell.x, this.getScrollPositionY() + mouse.gridCell.y - this.getFixedRowCount());
        mouse.gridCell = translatedPoint;
        this.fixedColumnClicked(grid, mouse);
    },

    moveSingleSelect: function(grid, x, y) {
        if (this.featureChain) {
            this.featureChain.moveSingleSelect(grid, x, y);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate setting the cursor up the feature chain of responsibility
     * @param {Hypergrid} grid
     */
    setCursor: function(grid) {
        grid.updateCursor();
        this.featureChain.setCursor(grid);
    },

    /**
     * @memberOf Behavior.prototype
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
     * @memberOf Behavior.prototype
     * @desc delegate handling tap to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onTap: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleTap(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling tap to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onContextMenu: function(grid, event) {
        var proceed = grid.fireSyntheticContextMenuEvent(event);
        if (proceed && this.featureChain) {
            this.featureChain.handleContextMenu(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
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
     * @memberOf Behavior.prototype
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
     * @memberOf Behavior.prototype
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
     * @memberOf Behavior.prototype
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
     * @memberOf Behavior.prototype
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
     * @memberOf Behavior.prototype
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
     * @memberOf Behavior.prototype
     * @desc delegate handling hold pulse to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onHoldPulse: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleHoldPulse(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling double click to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {string[]} [options] - Forwarded to dialog constructor.
     */
    openDialog: function(dialogName, options) {
        return new dialogs[dialogName](this.grid, options);
    },

    /**
     * @memberOf Behavior.prototype
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
     * @memberOf Behavior.prototype
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
     * @memberOf Behavior.prototype
     * @desc this function is replaced by the grid on initialization and serves as the callback
     */
    changed: function() {},

    /**
     * @memberOf Behavior.prototype
     * @desc this function is replaced by the grid on initialization and serves as the callback
     */
    shapeChanged: function() {},

    /**
     * @memberOf Behavior.prototype
     * @return {boolean} Can re-order columns.
     */
    isColumnReorderable: function() {
        return true;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {Object} The properties for a specific column. These are used if no cell properties are specified.
     * @param {index} columnIndex - the column index of interest
     */
    getColumnProperties: function(columnIndex) {
        var col = this.columns[columnIndex];
        if (!col) {
            return isNull;
        }
        var properties = col.getProperties(); //TODO: returns `null` on Hypergrid.prototype.reset();
        if (!properties) {
            return isNull;
        }
        return properties;
    },

    setColumnProperties: function(columnIndex, properties) {
        var columnProperties = this.allColumns[columnIndex].getProperties();
        _(columnProperties).extendOwn(properties);
        this.changed();
    },

    /**
     * @memberOf Behavior.prototype
     * @return {string} The field at `colIndex`.
     * @param {number} colIndex - the column index of interest
     */
    getField: function(colIndex) {
        return colIndex === -1 ? 'tree' : this.getColumn(colIndex).getField();
    },

    /**
     * @memberOf Behavior.prototype
     * @return {string} The column heading at `colIndex'.
     * @param {number} colIndex - the column index of interest
     */
    getHeader: function(colIndex) {
        return colIndex === -1 ? 'Tree' : this.getColumn(colIndex).getHeader();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Rebuild the column order indexes
     * @param {Array} columnIndexes - list of column indexes
     */
    setColumnIndexes: function(columnIndexes) {
        var tableState = this.getPrivateState();
        this._setColumnOrder(columnIndexes);
        tableState.columnIndexes = columnIndexes;
        this.changed();
        this.grid.fireSyntheticOnColumnsChangedEvent();
    },

    /**
     * @memberOf Behavior.prototype
     * @return {string[]} All the currently hidden column header labels.
     */
    getHiddenColumnDescriptors: function() {
        var tableState = this.getPrivateState();
        var indexes = tableState.columnIndexes;
        var labels = [];
        var columnCount = this.getColumnCount();
        for (var i = 0; i < columnCount; i++) {
            if (indexes.indexOf(i) === -1) {
                labels.push({
                    id: i,
                    label: this.getHeader(i),
                    field: this.getField(i)
                });
            }
        }
        return labels;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc hide columns that are specified by their indexes
     * @param {Array} arrayOfIndexes - an array of column indexes to hide
     */
    hideColumns: function(arrayOfIndexes) {
        var tableState = this.getPrivateState();
        var order = tableState.columnIndexes;
        for (var i = 0; i < arrayOfIndexes.length; i++) {
            var each = arrayOfIndexes[i];
            if (order.indexOf(each) !== -1) {
                order.splice(order.indexOf(each), 1);
            }
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @return {integer} The number of fixed columns.
     */
    getFixedColumnCount: function() {
        return this.getPrivateState().fixedColumnCount || 0;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc set the number of fixed columns
     * @param {number} n - the integer count of how many columns to be fixed
     */
    setFixedColumnCount: function(n) {
        this.getPrivateState().fixedColumnCount = n;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {integer} The number of fixed rows.
     */
    getFixedRowCount: function() {
        if (!this.tableState) {
            return 0;
        }
        var headers = this.grid.getHeaderRowCount();
        var usersSize = this.tableState.fixedRowCount || 0;
        return headers + usersSize;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Set the number of fixed rows, which includes (top to bottom order):
     * 1. The header rows
     *    1. The header labels row (optional)
     *    2. The filter row (optional)
     *    3. The top total rows (0 or more)
     * 2. The non-scrolling rows (externally called "the fixed rows")
     *
     * @returns {number} Sum of the above or 0 if none of the above are in use.
     *
     * @param {number} n - The number of rows.
     */
    setFixedRowCount: function(n) {
        this.tableState.fixedRowCount = n;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The number of header rows.
     * A portion of the number returned by {@link Behavior#getFixedRowCount()|getFixedRowCount()}.
     * (The remaining _fixed rows_ are the _top totals_ rows.)
     */
    getHeaderRowCount: function() {
        var header = this.grid.isShowHeaderRow() ? 1 : 0;
        var filter = this.grid.isShowFilterRow() ? 1 : 0;
        var totals = this.getTopTotals().length;
        return header + filter + totals;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The number of footer rows, consisting entirely of 0 or more _bottom totals_ rows.
     */
    getFooterRowCount: function() {
        return this.getBottomTotals().length;
    },

    getTopTotals: function() {
        return this.dataModel.getTopTotals();
    },
    /**
     * @memberOf Behavior.prototype
     * @summary Set the number of header rows.
     * @param {number} n - The number of _fixed rows_ to reserve as header rows.
     * (The remaining _fixed rows_ are the _top totals_ rows.)
     */
    setHeaderRowCount: function(n) {
        this.tableState.headerRowCount = n;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The number of fixed rows.
     */
    getHeaderColumnCount: function() {
        return this.grid.resolveProperty('headerColumnCount');
    },

    /**
     * @memberOf Behavior.prototype
     * @param {number} The number of fixed rows.
     */
    setHeaderColumnCount: function(numberOfHeaderColumns) {
        this.tableState.headerColumnCount = numberOfHeaderColumns;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc a dnd column has just been dropped, we've been notified
     */
    endDragColumnNotification: function() {},

    /**
     * @memberOf Behavior.prototype
     * @return {null} the cursor at a specific x,y coordinate
     * @param {number} x - the x coordinate
     * @param {number} y - the y coordinate
     */
    getCursorAt: function(x, y) {
        return null;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The total number of columns.
     */
    getColumnCount: function() {
        return this.columns.length;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {string} The column alignment at column `x`: `'left'`, `'center'` , or `'right'`
     * @param {number} x - The column index of interest.
     */
    getColumnAlignment: function(x) {
        return 'center';
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Quietly set the horizontal scroll position.
     * @param {number} x - The new position in pixels.
     */
    setScrollPositionX: function(x) {
        /**
         * @memberOf Behavior.prototype
         * @type {number}
         */
        this.scrollPositionX = x;
    },

    getScrollPositionX: function() {
        return this.scrollPositionX;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Quietly set the vertical scroll position.
     * @param {number} y - The new position in pixels.
     */
    setScrollPositionY: function(y) {
        /**
         * @memberOf Behavior.prototype
         * @type {number}
         */
        this.scrollPositionY = y;
    },

    getScrollPositionY: function() {
        return this.scrollPositionY;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {cellEditor} The cell editor for the cell at cell coordinates `x,y`
     * @param {number} x - The horizontal cell coordinate.
     * @param {number} y - The vertical cell coordinate.
     * @param {boolean} isDblClick - When called from `onEditorActivate`, indicates if event was a double-click. This allows different editors for single- vs. double-click
     */
    getCellEditorAt: function(x, y) {
        return this.grid.isFilterRow(y)
            ? this.grid.createCellEditor('filterbox')
            : this.getColumn(x).getCellEditorAt(y);
    },

    /**
     * @memberOf Behavior.prototype
     * @param {number} x - The column index.
     * @param {string[]} keys
     */
    toggleSort: function(x, keys) {
        this.getColumn(x).toggleSort(keys);
    },

    /**
     * @memberOf Behavior.prototype
     * @return {boolean} `true` if we should highlight on hover
     * @param {boolean} isColumnHovered - the column is hovered or not
     * @param {boolean} isRowHovered - the row is hovered or not
     */
    highlightCellOnHover: function(isColumnHovered, isRowHovered) {
        return isColumnHovered && isRowHovered;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc this function is a hook and is called just before the painting of a cell occurs
     * @param {window.fin.rectangular.Point} cell
     */
    cellPropertiesPrePaintNotification: function(cellProperties) {
        var row = this.getRow(cellProperties.y);
        var columnId = this.getHeader(cellProperties.x);
        cellProperties.row = row;
        cellProperties.columnId = columnId;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc this function is a hook and is called just before the painting of a fixed row cell occurs
     * @param {window.fin.rectangular.Point} cell
     */
    cellFixedRowPrePaintNotification: function(cell) {

    },

    /**
     * @memberOf Behavior.prototype
     * @desc this function is a hook and is called just before the painting of a fixed column cell occurs
     * @param {window.fin.rectangular.Point} cell
     */
    cellFixedColumnPrePaintNotification: function(cell) {

    },

    /**
     * @memberOf Behavior.prototype
     * @desc this function is a hook and is called just before the painting of a top left cell occurs
     * @param {window.fin.rectangular.Point} cell
     */
    cellTopLeftPrePaintNotification: function(cell) {

    },

    /**
     * @memberOf Behavior.prototype
     * @desc this function enhance the double click event just before it's broadcast to listeners
     * @param {Object} event - event to enhance
     */
    enhanceDoubleClickEvent: function(event) {},

    /**
     * @memberOf Behavior.prototype
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

    getColumnEdge: function(c, renderer) {
        return this.dataModel.getColumnEdge(c, renderer);
    },

    /**
     * @memberOf Behavior.prototype
     * @param {number} x - column index
     * @param {number} y - totals row index local to the totals area
     * @param value
     * @param {string[]} [areas=['top', 'bottom']] - may include `'top'` and/or `'bottom'`
     */
    setTotalsValue: function(x, y, value, areas) {
        this.grid.setTotalsValueNotification(x, y, value, areas);
    },

    /**
     * @memberOf Behavior.prototype
     * @return {object} The object at y index.
     * @param {number} y - the row index of interest
     */
    getRow: function(y) {
        return this.dataModel.getRow(y);
    },

    convertViewPointToDataPoint: function(viewPoint) {
        var newX = this.getColumn(viewPoint.x).index;
        var newPoint = this.grid.newPoint(newX, viewPoint.y);
        return newPoint;
    },

    setGroups: function(arrayOfColumnIndexes) {
        this.dataModel.setGroups(arrayOfColumnIndexes);
        this.createColumns();
        this.changed();
    },

    setAggregates: function(mapOfKeysToFunctions) {
        var self = this;
        this.dataModel.setAggregates(mapOfKeysToFunctions);
        this.createColumns();
        setTimeout(function() {
            self.changed();
        }, 100);
    },

    hasHierarchyColumn: function() {
        return false;
    },

    getRowContextFunction: function(selectedRows) {
        return function() {
            return null;
        };
    },

    getSelectionMatrixFunction: function(selectedRows) {
        return function() {
            return null;
        };
    },

    getFieldName: function(index) {
        return this.getFields()[index];
    },

    getColumnIndex: function(fieldName) {
        return this.getFields().indexOf(fieldName);
    },

    getComputedRow: function(y) {
        return this.dataModel.getComputedRow(y);
    },

    autosizeAllColumns: function() {
        this.checkColumnAutosizing(true);
        this.changed();
    },

    checkColumnAutosizing: function(force) {
        force = force === true;
        this.autoSizeRowNumberColumn();
        this.allColumns[-2].checkColumnAutosizing(force);
        this.allColumns.forEach(function(column) {
            column.checkColumnAutosizing(force);
        });
    },

    autoSizeRowNumberColumn: function() {
        if (this.grid.isRowNumberAutosizing()) {
            this.allColumns[-1].checkColumnAutosizing(true);
        }
    },

    getNewFilter: function(options) {
        var newFilter;
        if (this.columns.length) {
            options = options || {};
            if (!options.schema) {
                var factory = new ColumnSchemaFactory(this.columns);
                options.schema = factory.schema;
            }
            options.caseSensitiveColumnNames = this.grid.resolveProperty('filterCaseSensitiveColumnNames');
            options.resolveAliases = this.grid.resolveProperty('filterResolveAliases');
            options.defaultColumnFilterOperator = this.grid.resolveProperty('filterDefaultColumnFilterOperator');
            newFilter = new DefaultFilter(options);
        }
        return newFilter;
    },

    /**
     * @summary Get a reference to the filter attached to the Hypergrid.
     * @returns {FilterTree}
     * @memberOf Behavior.prototype
     */
    getGlobalFilter: function() {
        return this.dataModel.getGlobalFilter();
    },

    /**
     * @summary Attach/detach a filter to a Hypergrid.
     * @param {FilterTree} [filter] - The filter object. If undefined, any attached filter is removed, turning filtering OFF.
     * @memberOf Behavior.prototype
     */
    setGlobalFilter: function(filter) {
        this.dataModel.setGlobalFilter(filter);
    },

    /**
     * @summary Set the case sensitivity of filter tests against data.
     * @desc Case sensitivity pertains to string compares only. This includes untyped columns, columns typed as strings, typed columns containing data that cannot be coerced to type or when the filter expression operand cannot be coerced.
     *
     * NOTE: This is a shared property and affects all grid managed by this instance of the app.
     * @param {boolean} isSensitive
     * @memberOf Behavior.prototype
     */
    setGlobalFilterCaseSensitivity: function(isSensitive) {
        this.dataModel.setGlobalFilterCaseSensitivity(isSensitive);
    },

    /**
     * @param {number|string} columnIndexOrName - The _column filter_ to set.
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @param {boolean} [options.syntax='CQL'] - The syntax to use to describe the filter state. Note that `getFilter`'s default syntax, `'CQL'`, differs from the other get state methods.
     * @returns {FilterTreeStateObject}
     * @memberOf Behavior.prototype
     */
    getFilter: function(columnIndexOrName, options) {
        return this.dataModel.getFilter(columnIndexOrName, options);
    },

    /**
     * @summary Set a particular column filter's state.
     * @desc After setting the new filter state, reapplies the filter to the data source.
     * @param {number|string} columnIndexOrName - The _column filter_ to set.
     * @param {string|object} [state] - A filter tree object or a JSON, SQL, or CQL subexpression string that describes the a new state for the named column filter. The existing column filter subexpression is replaced with a new node based on this state. If it does not exist, the new subexpression is added to the column filters subtree (`filter.columnFilters`).
     *
     * If undefined, removes the entire column filter subexpression from the column filters subtree.
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @param {string} [options.syntax='CQL'] - The syntax to use to describe the filter state. Note that `setFilter`'s default syntax, `'CQL'`, differs from the other get state methods.
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf Behavior.prototype
     */
    setFilter: function(columnIndexOrName, state, options) {
        this.dataModel.setFilter(columnIndexOrName, state, options);
    },

    /**
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf Behavior.prototype
     */
    getFilters: function(options) {
        return this.dataModel.getFilters(options);
    },

    /**
     * @param {FilterTreeStateObject} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf Behavior.prototype
     */
    setFilters: function(state, options) {
        this.dataModel.setFilters(state, options);
    },

    /**
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf Behavior.prototype
     */
    getTableFilter: function(options) {
        return this.dataModel.getTableFilter(options);
    },

    /**
     * @param {FilterTreeStateObject} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf Behavior.prototype
     */
    setTableFilter: function(state, options) {
        this.dataModel.setTableFilter(state, options);
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

    getData: function() {
        return this.dataModel.getData();
    },

    getFilteredData: function() {
        return this.dataModel.getFilteredData();
    },
});

module.exports = Behavior;
