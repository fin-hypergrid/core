/* eslint-env browser */

'use strict';

var _ = require('object-iterators');
var Base = require('extend-me').Base;

var Column = require('./Column');
var images = require('./images');
var CellProvider = require('../CellProvider');

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
 * @constructor
 * @desc This is the base class for creating behaviors.  a behavior can be thought of as a model++.
it contains all code/data that's necessary for easily implementing a virtual data source and it's manipulation/analytics
 */
var Behavior = Base.extend('Behavior', {

    /**
     * @desc this is the callback for the plugin pattern of nested tags
     * @param {Hypergrid} grid
     * @memberOf Behavior.prototype
     */
    initialize: function(grid) { //formerly installOn
        grid.setBehavior(this);
        this.initializeFeatureChain(grid);

        this.getDataModel();
        this.cellProvider = this.createCellProvider();
        this.renderedColumnCount = 30;
        this.renderedRowCount = 60;
        this.dataUpdates = {}; //for overriding with edit values;
    },

    /**
     * @desc create the feature chain - this is the [chain of responsibility](http://c2.com/cgi/wiki?ChainOfResponsibilityPattern) pattern.
     * @param {Hypergrid} grid
     * @memberOf Behavior.prototype
     */
    initializeFeatureChain: function(grid) {
        var self = this;
        this.features.forEach(function(FeatureConstructor) {
            self.setNextFeature(new FeatureConstructor);
        });

        this.featureChain.initializeOn(grid);
    },

    features: [], // in case implementing class has no features TODO: Will this ever happen?

    /**
     * memento for the user configured visual properties of the table
     * @type {object}
     * @memberOf Behavior.prototype
     */
    tableState: null,

    /**
     * @type {Hypergrid}
     * @memberOf Behavior.prototype
     */
    grid: null,

    /**
     * list of default cell editor names
     * @type {string[]}
     * @memberOf Behavior.prototype
     */
    editorTypes: ['choice', 'textfield', 'color', 'slider', 'spinner', 'date'],

    /**
     * controller chain of command
     * @type {object}
     * @memberOf Behavior.prototype
     */
    featureChain: null,

    dataModel: null,
    baseModel: null,

    scrollPositionX: 0,
    scrollPositionY: 0,

    featureMap: {},
    allColumns: [],
    columns: [],

    reset: function() {

        this.cellProvider = this.createCellProvider();
        this.renderedColumnCount = 30;
        this.renderedRowCount = 60;
        this.dataUpdates = {}; //for overriding with edit values;
        this.clearColumns();
        this.clearState();
        this.getDataModel().reset();
        this.createColumns();
    },

    clearColumns: function() {
        this.columns = [];
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
        return this.getColumn(x).label;
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

    getDataModel: function() {
        if (this.dataModel === null) {
            var dataModel = this.getDefaultDataModel();
            this.setDataModel(dataModel);
        }
        return this.dataModel;
    },

    getCellRenderer: function(config, x, y) {
        return this.getColumn(x).getCellRenderer(config, y);
    },

    setDataModel: function(newDataModel) {
        this.dataModel = newDataModel;
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
        this.clearObjectProperties(copy.columnProperties, true);
        return copy;
    },
    /**
     * @memberOf Behavior.prototype
     * @desc clear all table state
     */
    clearState: function() {
        this.tableState = null;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {object} Newly created default empty tablestate.
     */
    getDefaultState: function() {
        var tableProperties = this.getGrid()._getProperties();
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
        this.setColumnOrder(memento.columnIndexes);
        _(state).extendOwn(memento);
        this.setAllColumnProperties(colProperties);
        memento.columnProperties = colProperties;
        //memento.columnProperties = colProperties;

        // this.getDataModel().setState(memento);
        // var self = this;
        // requestAnimationFrame(function() {
        //     self.applySorts();
        //     self.changed();
        //     self.stateChanged();
        // });

        //just to be close/ it's easier on the eyes
        this.setColumnWidth(-1, 24.193359375);
        this.getDataModel().applyState();
    },

    setAllColumnProperties: function(properties) {
        properties = properties || [];
        for (var i = 0; i < properties.length; i++) {
            var current = this.getPrivateState().columnProperties[i];
            this.clearObjectProperties(current, false);
            _(current).extendOwn(properties[i]);
        }
    },

    setColumnOrder: function(indexes) {
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
        this.getDataModel().cellClicked(cell, event);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc A specific cell was le double-clicked; you've been notified.
     * @param {Point} cell - point of cell coordinates
     * @param {Object} event - all event information
     */
    cellDoubleClicked: function(cell, event) {

    },

    /**
     * @memberOf Behavior.prototype
     * @desc add nextFeature to me If I don't have a next node, otherwise pass it along
     * @param {Feature}
     */
    setNextFeature: function(nextFeature) {
        this.featureMap[nextFeature.alias] = nextFeature;
        if (this.featureChain) {
            this.featureChain.setNext(nextFeature);
        } else {
            this.featureChain = nextFeature;
        }
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
    setGrid: function(finGrid) {
        this.grid = finGrid;
        this.getDataModel().setGrid(finGrid);
        this.clearColumns();
    },

    /**
     * @memberOf Behavior.prototype
     * @returns: {Hypergrid} The hypergrid to which this behavior is attached.
     * @param {type} varname - descripton
     */
    getGrid: function() {
        return this.grid;
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
        if (!column) {
            return undefined;
        }
        return column.getValue(y);
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
        if (!column) {
            return;
        }
        return column.setValue(y, value);
    },

    getDataValue: function(x, y) {
        return this.getDataModel().getValue(x, y);
    },

    setDataValue: function(x, y, value) {
        this.getDataModel().setValue(x, y, value);
    },
    /**
     * @memberOf Behavior.prototype
     * @desc First checks to see if something was overridden.
     * @return {*} The value at x,y for the top left section of the hypergrid.
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     */
    getCellProperties: function(x, y) {
        var col = this.getColumn(x);
        return col.getCellProperties(y);
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
        return this.getDataModel().getRowCount();
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
        return total;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The height in pixels of a specific row in the hypergrid.
     * @param {number} rowNum - row index of interest
     */
    getRowHeight: function(rowNum) {
        var tableState = this.getPrivateState();
        if (tableState.rowHeights) {
            var override = tableState.rowHeights[rowNum];
            if (override) {
                return override;
            }
        }
        return this.getDefaultRowHeight();
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
        if (this.getGrid().isShowRowNumbers()) {
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
        var width = this.getFixedColumnsWidth();
        return width;
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
     * @param {Object} event - the event details
     */
    toggleColumnPicker: function() {
        var dialog = this.grid.dialog;
        var self = this;
        if (dialog.isOpen()) {
            dialog.close();
            dialog.clear();
        } else {
            this.buildColumnPicker(dialog.overlay);
            dialog.onClose = function() {
                self.updateFromColumnPicker(dialog.overlay);
            };
            dialog.open();
        }
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
            return {
                isNull: true
            };
        }
        var properties = col.getProperties(); //TODO: returns `null` on Hypergrid.reset();
        if (!properties) {
            return {
                isNull: true
            };
        }
        return properties;
    },
    setColumnProperties: function(columnIndex, properties) {
        var columnProperties = this.getColumnProperties(columnIndex);
        _(columnProperties).extendOwn(properties);
        this.changed();
    },

    /**
     * @memberOf Behavior.prototype
     * @return {string} The field at `colIndex`.
     * @param {number} colIndex - the column index of interest
     */
    getField: function(colIndex) {
        if (colIndex === -1) {
            return 'tree';
        }
        var col = this.getColumn(colIndex);
        return col.getField();
    },
    /**
     * @memberOf Behavior.prototype
     * @return {string} The column heading at `colIndex'.
     * @param {number} colIndex - the column index of interest
     */
    getHeader: function(colIndex) {
        if (colIndex === -1) {
            return 'Tree';
        }
        var col = this.getColumn(colIndex);
        return col.getHeader();
    },
    /**
     * @memberOf Behavior.prototype
     * @desc this is called by the column editor post closing; rebuild the column order indexes
     * @param {Array} list - list of column objects from the column editor
     */
    setColumnDescriptors: function(lists) {
        //assumes there is one row....
        var visible = lists.visible;
        var tableState = this.getPrivateState();

        var columnCount = visible.length;
        var indexes = [];
        var i;
        for (i = 0; i < columnCount; i++) {
            indexes.push(visible[i].id);
        }
        tableState.columnIndexes = indexes;
        this.changed();
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
        var tableState = this.getPrivateState();
        return tableState.fixedColumnCount || 0;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc set the number of fixed columns
     * @param {number} numberOfFixedColumns - the integer count of how many columns to be fixed
     */
    setFixedColumnCount: function(numberOfFixedColumns) {
        var tableState = this.getPrivateState();
        tableState.fixedColumnCount = numberOfFixedColumns;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {integer} The number of fixed rows.
     */
    getFixedRowCount: function() {
        if (!this.tableState) {
            return 0;
        }
        var usersSize = this.tableState.fixedRowCount || 0;
        var headers = this.getGrid().getHeaderRowCount();
        var total = usersSize + headers;
        return total;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc set the number of rows that are fixed
     * @param {number} numberOfFixedRows - the count of rows to be set fixed
     */
    setFixedRowCount: function(numberOfFixedRows) {
        this.tableState.fixedRowCount = numberOfFixedRows;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The number of fixed rows.
     */
    getHeaderRowCount: function() {
        var grid = this.getGrid();
        var header = grid.isShowHeaderRow() ? 1 : 0;
        var filter = grid.isShowFilterRow() ? 1 : 0;
        var totals = this.getTopTotals().length;
        var count = header + filter + totals;
        return count;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc set the number of rows that are fixed
     * @param {number} numberOfFixedRows - the count of rows to be set fixed
     */
    setHeaderRowCount: function(numberOfHeaderRows) {
        this.tableState.headerRowCount = numberOfHeaderRows;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The number of fixed rows.
     */
    getHeaderColumnCount: function() {
        var grid = this.getGrid();
        var count = grid.resolveProperty('headerColumnCount');
        return count;
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
     * @desc build and open the editor within the container div argument
     * @return {boolean} `false` prevents editor from opening
     * @param {HTMLDivElement} div - the containing div element
     */
    buildColumnPicker: function(div) {
        var container = document.createElement('div');

        var hidden = document.createElement('fin-hypergrid-dnd-list');
        var visible = document.createElement('fin-hypergrid-dnd-list');

        container.appendChild(hidden);
        container.appendChild(visible);

        this.beColumnStyle(hidden.style);
        hidden.title = 'hidden columns';
        hidden.list = this.getHiddenColumnDescriptors();

        this.beColumnStyle(visible.style);
        visible.style.left = '50%';
        visible.title = 'visible columns';
        visible.list = this.getColumnDescriptors();

        div.lists = {
            hidden: hidden.list,
            visible: visible.list
        };
        div.appendChild(container);
        return true;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc the editor is requesting close; deal with the edits
     * @return `true`
     * @param {HTMLDivElement} div - the containing div element
     */
    updateFromColumnPicker: function(div) {
        var lists = div.lists;
        this.setColumnDescriptors(lists);
        return true;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc a dnd column has just been dropped, we've been notified
     */
    endDragColumnNotification: function() {},

    /**
     * @memberOf Behavior.prototype
     * @desc bind column editor appropriate css values to arg style
     * @param {HTMLStyleElement} style - the style object to enhance
     */
    beColumnStyle: function(style) {
        style.top = '5%';
        style.position = 'absolute';
        style.width = '50%';
        style.height = '100%';
        style.whiteSpace = 'nowrap';
    },

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
     * @return {string} - The column alignment at column `x`, which is one of `'left'`, `'center'` , or `'right'`.
     * @param {number} x - the column index of interest
     */
    getColumnAlignment: function(x) {
        return 'center';
    },

    /**
     * @memberOf Behavior.prototype
     * @desc quietly set the scroll position in the horizontal dimension
     * @param {number} x - the position in pixels
     */
    setScrollPositionX: function(x) {
        this.scrollPositionX = x;
    },

    getScrollPositionX: function() {
        return this.scrollPositionX;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc quietly set the scroll position in the horizontal dimension
     * @param {number} y - the position in pixels
     */
    setScrollPositionY: function(y) {
        this.scrollPositionY = y;
    },

    getScrollPositionY: function() {
        return this.scrollPositionY;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {cellEditor} Cell editor for coordinate `x,y`.
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     */
    _getCellEditorAt: function(x, y) {
        var grid = this.getGrid();
        var column = this.getColumn(x);
        var type = grid.isFilterRow(y) ? column.getFilterType() : column.getType();
        var editor = grid.resolveCellEditor(type);
        return editor;
    },

    getCellEditorAt: function(x, y) {
        var grid = this.getGrid();
        if (grid.isFilterRow(y)) {
            return grid.cellEditors.textfield;
        }
        var editor = this.getDataModel().getCellEditorAt(x, y);
        return editor;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc fixed row has been clicked, you've been notified
     * @param {Hypergrid} grid
     * @param {Object} mouse - event details
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
     * @return {HTMLImageElement}
     * @param {string} key - an image alias
     */
    getImage: function(key) {
        return images[key];
    },

    /**
     * @memberOf Behavior.prototype
     * @desc set the image for a specific alias
     * @param {string} key - an image alias
     * @param {HTMLImageElement} image - the image to cache
     */
    setImage: function(key, image) {
        images[key] = image;
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
        return this.getDataModel().getColumnEdge(c, renderer);
    },

    setTotalsValue: function(x, y, value) {
        this.getGrid().setTotalsValueNotification(x, y, value);
    },

    /**
     * @memberOf Behavior.prototype
     * @return {object} The object at y index.
     * @param {number} y - the row index of interest
     */
    getRow: function(y) {
        return this.getDataModel().getRow(y);
    },

    convertViewPointToDataPoint: function(viewPoint) {
        var newX = this.getColumn(viewPoint.x).index;
        var newPoint = this.getGrid().newPoint(newX, viewPoint.y);
        return newPoint;
    },

    setGroups: function(arrayOfColumnIndexes) {
        this.getDataModel().setGroups(arrayOfColumnIndexes);
        this.createColumns();
        this.changed();
    },

    setAggregates: function(mapOfKeysToFunctions) {
        var self = this;
        this.getDataModel().setAggregates(mapOfKeysToFunctions);
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
        return this.getDataModel().getComputedRow(y);
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
        if (this.getGrid().isRowNumberAutosizing()) {
            this.allColumns[-1].checkColumnAutosizing(true);
        }
    },

    setGlobalFilter: function(string) {
        this.getDataModel().setGlobalFilter(string);
    },

    getSelectedRows: function() {
        return this.getGrid().getSelectionModel().getSelectedRows();
    },

    getSelectedColumns: function() {
        return this.getGrid().getSelectionModel().getSelectedColumns();
    },

    getSelections: function() {
        return this.getGrid().getSelectionModel().getSelections();
    }

});

module.exports = Behavior;
