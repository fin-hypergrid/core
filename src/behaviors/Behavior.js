/* eslint-env browser */

'use strict';

var _ = require('object-iterators');

var extend = require('../local_node_modules/extend/index');
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
 * @desc This is the base class for creating behaviors.  a behavior can be thought of as a model++.
it contains all code/data that's necessary for easily implementing a virtual data source and it's manipulation/analytics
 */

function Behavior(grid) {
    // nothing to do here
}

Behavior.extend = extend;

Behavior.prototype = {

    constructor: Behavior.prototype.constructor,

    /**
     * @function
     * @instance
     * @desc this is the callback for the plugin pattern of nested tags
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
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
     * @function
     * @instance
     * @desc create the feature chain - this is the [chain of responsibility](http://c2.com/cgi/wiki?ChainOfResponsibilityPattern) pattern.
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     */
    initializeFeatureChain: function(grid) {
        var self = this;
        this.features.forEach(function(FeatureConstructor) {
            self.setNextFeature(new FeatureConstructor);
        });

        this.featureChain.initializeOn(grid);
    },

    features: [], // in case implementing class has no features (will this ever happen)

    /**
     * @property {object} tableState - memento for the user configured visual properties of the table
     * @instance
     */
    tableState: null,

    /**
     * @property {fin-hypergrid} grid - my instance of hypergrid
     * @instance
     */
    grid: null,

    /**
     * @property {array} editorTypes - list of default cell editor names
     * @instance
     */
    editorTypes: ['choice', 'textfield', 'color', 'slider', 'spinner', 'date'],

    /**
     * @property {object} featureChain - controller chain of command
     * @instance
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
     * @function
     * @instance
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
     * @function
     * @instance
     * @desc getter for a [Memento](http://c2.com/cgi/wiki?MementoPattern) Object
     * #### returns: Object
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
     * @function
     * @instance
     * @desc clear all table state
     */
    clearState: function() {
        this.tableState = null;
    },

    /**
     * @function
     * @instance
     * @desc create a default empty tablestate
     * #### returns: Object
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
     * @function
     * @instance
     * @desc return this table to a previous state. see the [memento pattern](http://c2.com/cgi/wiki?MementoPattern)
     * @param {Object} memento - an encapulated representation of table state
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
     * @function
     * @instance
     * @desc fetch the value for a property key
     * #### returns: Object
     * @param {string} key - a property name
     */
    resolveProperty: function(key) {
        return this.grid.resolveProperty(key);
    },

    /**
     * @function
     * @instance
     * @desc a specific cell was clicked, you've been notified
     * @param {Point} cell - point of cell coordinates
     * @param {Object} event - all event information
     */
    cellClicked: function(cell, event) {
        this.getDataModel().cellClicked(cell, event);
    },

    /**
     * @function
     * @instance
     * @desc a specific cell was le doubclicked, you've been notified
     * @param {Point} cell - point of cell coordinates
     * @param {Object} event - all event information
     */
    cellDoubleClicked: function(cell, event) {

    },

    /**
     * @function
     * @instance
     * @desc add nextFeature to me If I don't have a next node, otherwise pass it along
     * @param {fin-hypergrid-feature-base} nextFeature - [fin-hypergrid-feature-base](module-features_base.html)
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
     * @function
     * @instance
     * @desc getter for the cell provider
     * #### returns: [fin-hypergrid-cell-provider](module-._cell-provider.html)
     */
    getCellProvider: function() {
        return this.cellProvider;
    },

    /**
     * @function
     * @instance
     * @desc setter for the hypergrid
     * @param {fin-hypergrid} finGrid - [fin-hypergrid](module-._fin-hypergrid.html)
     */
    setGrid: function(finGrid) {
        this.grid = finGrid;
        this.getDataModel().setGrid(finGrid);
        this.clearColumns();
    },

    /**
     * @function
     * @instance
     * @desc getter for the hypergrid
     * #### returns: [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {type} varname - descripton
     */
    getGrid: function() {
        return this.grid;
    },

    /**
     * @function
     * @instance
     * @desc you can override this function and substitute your own cell provider
     * #### returns: [fin-hypergrid-cell-provider](module-._cell-provider.html)
     */
    createCellProvider: function() {
        var provider = new CellProvider();
        return provider;
    },

    /**
     * @function
     * @instance
     * @desc return the value at x,y for the top left section of the hypergrid, first check to see if something was overridden
     * #### returns: Object
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     */
    getValue: function(x, y) {
        var column = this.getColumn(x);
        if (!column) {
            return undefined;
        }
        var result = column.getValue(y);
        return result;
    },

    /**
     * @function
     * @instance
     * @desc update the data at point x, y with value
     * #### returns: type
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     * @param {Object} value - the value to use
     */
    setValue: function(x, y, value) {
        var column = this.getColumn(x);
        if (!column) {
            return;
        }
        var result = column.setValue(y, value);
        return result;
    },

    getDataValue: function(x, y) {
        return this.getDataModel().getValue(x, y);
    },

    setDataValue: function(x, y, value) {
        this.getDataModel().setValue(x, y, value);
    },
    /**
     * @function
     * @instance
     * @desc return the value at x,y for the top left section of the hypergrid, first check to see if something was overridden
     * #### returns: Object
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     */
    getCellProperties: function(x, y) {
        var col = this.getColumn(x);
        return col.getCellProperties(y);
    },

    /**
     * @function
     * @instance
     * @desc update the data at point x, y with value
     * #### returns: type
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
     * @function
     * @instance
     * @desc return the number of rows
     * #### returns: integer
     */
    getRowCount: function() {
        return this.getDataModel().getRowCount();
    },

    /**
     * @function
     * @instance
     * @desc return the height in pixels of the fixed rows area
     * #### returns: integer
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
     * @function
     * @instance
     * @desc get height in pixels of a specific row
     * #### returns: integer
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
     * @function
     * @instance
     * @desc returns a lazily initialized value from the properties mechanism for 'defaultRowHeight', should be ~20px
     * #### returns: integer
     */
    getDefaultRowHeight: function() {
        if (!this.defaultRowHeight) {
            this.defaultRowHeight = this.resolveProperty('defaultRowHeight');
        }
        return this.defaultRowHeight;
    },

    /**
     * @function
     * @instance
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
     * @function
     * @instance
     * @desc return the potential maximum height of the fixed rows areas, this will allow 'floating' fixed rows
     * #### returns: integer
     */
    getFixedRowsMaxHeight: function() {
        var height = this.getFixedRowsHeight();
        return height;
    },

    /**
     * @function
     * @instance
     * @desc return the width of the fixed column area
     * #### returns: integer
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
     * @function
     * @instance
     * @desc return the potential total width of the fixed columns area; this exists to support 'floating' columns
     * #### returns: integer
     */
    getFixedColumnsMaxWidth: function() {
        var width = this.getFixedColumnsWidth();
        return width;
    },

    /**
     * @function
     * @instance
     * @desc set the scroll position in vertical dimension and notifiy listeners
     * @param {number} y - the new y value
     */
    _setScrollPositionY: function(y) {
        this.setScrollPositionY(y);
        this.changed();
    },

    /**
     * @function
     * @instance
     * @desc set the scroll position in horizontal dimension and notifiy listeners
     * @param {number} x - the new x value
     */
    _setScrollPositionX: function(x) {
        this.setScrollPositionX(x);
        this.changed();
    },

    /**
     * @function
     * @instance
     * @desc set the number of columns just rendered, includes partially rendered columns
     * @param {number} count - how many columns were just rendered
     */
    setRenderedColumnCount: function(count) {
        this.renderedColumnCount = count;
    },

    /**
     * @function
     * @instance
     * @desc set the number of rows just rendered, includes partially rendered rows
     * @param {number} count - how many rows were just rendered
     */
    setRenderedRowCount: function(count) {
        this.renderedRowCount = count;
    },


    /**
     * @function
     * @instance
     * @desc the fixed row area has been clicked, massage the details and call the real function
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} mouse - event details
     */
    _fixedRowClicked: function(grid, mouse) {
        var x = this.translateColumnIndex(this.getScrollPositionX() + mouse.gridCell.x - this.getFixedColumnCount());
        var translatedPoint = this.grid.newPoint(x, mouse.gridCell.y);
        mouse.gridCell = translatedPoint;
        this.fixedRowClicked(grid, mouse);
    },

    /**
     * @function
     * @instance
     * @desc the fixed column area has been clicked, massage the details and call the real function
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
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
     * @function
     * @instance
     * @desc delegate setting the cursor up the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     */
    setCursor: function(grid) {
        grid.updateCursor();
        this.featureChain.setCursor(grid);
    },

    /**
     * @function
     * @instance
     * @desc delegate handling mouse move to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    onMouseMove: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseMove(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc delegate handling tap to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    onTap: function(grid, event) {

        //global row selection
        if (event.gridCell.x === -1 && event.gridCell.y === 0) {
            grid.toggleSelectAllRows();
        }

        if (this.featureChain) {
            this.featureChain.handleTap(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc delegate handling tap to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
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
     * @function
     * @instance
     * @desc delegate handling wheel moved to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    onWheelMoved: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleWheelMoved(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc delegate handling mouse up to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    onMouseUp: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseUp(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc delegate handling mouse drag to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    onMouseDrag: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseDrag(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc delegate handling key down to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    onKeyDown: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleKeyDown(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc delegate handling key up to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    onKeyUp: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleKeyUp(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc delegate handling double click to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    onDoubleClick: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleDoubleClick(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc delegate handling hold pulse to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    onHoldPulse: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleHoldPulse(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc delegate handling double click to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    toggleColumnPicker: function() {
        if (this.featureChain) {
            this.featureChain.toggleColumnPicker(this.getGrid());
        }
    },

    /**
     * @function
     * @instance
     * @desc delegate handling mouse down to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseDown(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleMouseExit: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseExit(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc this function is replaced by the grid on initialization and serves as the callback
     */
    changed: function() {},

    /**
     * @function
     * @instance
     * @desc this function is replaced by the grid on initialization and serves as the callback
     */
    shapeChanged: function() {},

    /**
     * @function
     * @instance
     * @desc return true if we can re-order columns
     * #### returns: boolean
     */
    isColumnReorderable: function() {
        return true;
    },

    /**
     * @function
     * @instance
     * @desc return the properties for a specific column, these are used if no cell properties are specified
     * #### returns: Object
     * @param {index} columnIndex - the column index of interest
     */
    getColumnProperties: function(columnIndex) {
        var col = this.columns[columnIndex];
        if (!col) {
            return {
                isNull: true
            };
        }
        var properties = col.getProperties(); //TODO: fix this this returns null on Hypergrid.reset();
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
     * @function
     * @instance
     * @desc returns the list of labels to use for the column picker
     * #### returns: Array of strings
     */
    getColumnDescriptors: function() {
        //assumes there is one row....
        this.insureColumnIndexesAreInitialized();
        var tableState = this.getPrivateState();
        var columnCount = tableState.columnIndexes.length;
        var labels = [];
        for (var i = 0; i < columnCount; i++) {
            var id = tableState.columnIndexes[i];
            labels.push({
                id: id,
                label: this.getHeader(id),
                field: this.getField(id)
            });
        }
        return labels;
    },

    /**
     * @function
     * @instance
     * @desc return the field at colIndex
     * #### returns: string
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
     * @function
     * @instance
     * @desc return the column heading at colIndex
     * #### returns: string
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
     * @function
     * @instance
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
     * @function
     * @instance
     * @desc return an Array of strings of the column header labels that are currently hidden
     * #### returns: Array of strings
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
     * @function
     * @instance
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
     * @function
     * @instance
     * @desc return the number of fixed columns
     * #### returns: integer
     */
    getFixedColumnCount: function() {
        var tableState = this.getPrivateState();
        return tableState.fixedColumnCount || 0;
    },

    /**
     * @function
     * @instance
     * @desc set the number of fixed columns
     * @param {number} numberOfFixedColumns - the integer count of how many columns to be fixed
     */
    setFixedColumnCount: function(numberOfFixedColumns) {
        var tableState = this.getPrivateState();
        tableState.fixedColumnCount = numberOfFixedColumns;
    },

    /**
     * @function
     * @instance
     * @desc return the count of fixed rows
     * #### returns: integer
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
     * @function
     * @instance
     * @desc set the number of rows that are fixed
     * @param {number} numberOfFixedRows - the count of rows to be set fixed
     */
    setFixedRowCount: function(numberOfFixedRows) {
        this.tableState.fixedRowCount = numberOfFixedRows;
    },

    /**
     * @function
     * @instance
     * @desc return the count of fixed rows
     * #### returns: integer
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
     * @function
     * @instance
     * @desc set the number of rows that are fixed
     * @param {number} numberOfFixedRows - the count of rows to be set fixed
     */
    setHeaderRowCount: function(numberOfHeaderRows) {
        this.tableState.headerRowCount = numberOfHeaderRows;
    },

    /**
     * @function
     * @instance
     * @desc return the count of fixed rows
     * #### returns: integer
     */
    getHeaderColumnCount: function() {
        var grid = this.getGrid();
        var count = grid.resolveProperty('headerColumnCount');
        return count;
    },

    /**
     * @function
     * @instance
     * @desc set the number of rows that are fixed
     * @param {number} numberOfFixedRows - the count of rows to be set fixed
     */
    setHeaderColumnCount: function(numberOfHeaderColumns) {
        this.tableState.headerColumnCount = numberOfHeaderColumns;
    },
    /**
     * @function
     * @instance
     * @desc build and open the editor within the container div argument, this function should return false if we don't want the editor to open
     * #### returns: boolean
     * @param {HTMLDivElement} div - the containing div element
     */
    openEditor: function(div) {
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
     * @function
     * @instance
     * @desc the editor is requesting close return true or false, and deal with the edits
     * @param {HTMLDivElement} div - the containing div element
     */
    closeEditor: function(div) {
        noop(div);
        var lists = div.lists;
        this.setColumnDescriptors(lists);
        return true;
    },

    /**
     * @function
     * @instance
     * @desc a dnd column has just been dropped, we've been notified
     */
    endDragColumnNotification: function() {},

    /**
     * @function
     * @instance
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
     * @function
     * @instance
     * @desc return the cursor at a specific x,y coordinate
     * #### returns: string
     * @param {number} x - the x coordinate
     * @param {number} y - the y coordinate
     */
    getCursorAt: function(x, y) {
        return null;
    },

    /**
     * @function
     * @instance
     * @desc return the total number of columns
     * #### returns: integer
     */
    getColumnCount: function() {
        return this.columns.length;
    },

    /**
     * @function
     * @instance
     * @desc return the column alignment at column x
     * #### returns: string ['left','center','right']
     * @param {number} x - the column index of interest
     */
    getColumnAlignment: function(x) {
        return 'center';
    },

    /**
     * @function
     * @instance
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
     * @function
     * @instance
     * @desc quietly set the scroll position in the horizontal dimension
     * #### returns: type
     * @param {number} y - the position in pixels
     */
    setScrollPositionY: function(y) {
        this.scrollPositionY = y;
    },

    getScrollPositionY: function() {
        return this.scrollPositionY;
    },

    /**
     * @function
     * @instance
     * @desc return the cell editor for coordinate x,y
     * #### returns: [fin-hypergrid-cell-editor-base](module-cell-editors_base.html)
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     */
    getCellEditorAt: function(x, y) {
        return this.getColumn(x).getCellEditorAt(x, y);
    },

    /**
     * @function
     * @instance
     * @desc fixed row has been clicked, you've been notified
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} mouse - event details
     */
    toggleSort: function(x, keys) {
        this.getColumn(x).toggleSort(keys);
    },

    /**
     * @function
     * @instance
     * @desc returns true if we should highlight on hover
     * #### returns: boolean
     * @param {boolean} isColumnHovered - the column is hovered or not
     * @param {boolean} isRowHovered - the row is hovered or not
     */
    highlightCellOnHover: function(isColumnHovered, isRowHovered) {
        return isColumnHovered && isRowHovered;
    },

    /**
     * @function
     * @instance
     * @desc return the columnId/label/fixedRowValue at x
     * #### returns: string
     * @param {number} x - the view translated x index
     */
    getColumnId: function(x) {
        var col = this.getFixedRowValue(x, 0);
        return col;
    },

    /**
     * @function
     * @instance
     * @desc return an HTMLImageElement given it's alias
     * #### returns: HTMLImageElement
     * @param {string} key - an image alias
     */
    getImage: function(key) {
        return images[key];
    },

    /**
     * @function
     * @instance
     * @desc set the image for a specific alias
     * @param {string} key - an image alias
     * @param {HTMLImageElement} image - the image to cache
     */
    setImage: function(key, image) {
        images[key] = image;
    },

    /**
     * @function
     * @instance
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
     * @function
     * @instance
     * @desc this function is a hook and is called just before the painting of a fixed row cell occurs
     * @param {window.fin.rectangular.Point} cell
     */
    cellFixedRowPrePaintNotification: function(cell) {

    },

    /**
     * @function
     * @instance
     * @desc this function is a hook and is called just before the painting of a fixed column cell occurs
     * @param {window.fin.rectangular.Point} cell
     */
    cellFixedColumnPrePaintNotification: function(cell) {

    },

    /**
     * @function
     * @instance
     * @desc this function is a hook and is called just before the painting of a top left cell occurs
     * @param {window.fin.rectangular.Point} cell
     */
    cellTopLeftPrePaintNotification: function(cell) {

    },

    /**
     * @function
     * @instance
     * @desc this function enhance the double click event just before it's broadcast to listeners
     * @param {Object} event - event to enhance
     */
    enhanceDoubleClickEvent: function(event) {},

    /**
     * @function
     * @instance
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
     * @function
     * @instance
     * @returns {object} The object at y index.
     * @param {number} y - the row index of interest
     */
    getRow: function(y) {
        return this.getDataModel().getRow(y);
    },

    convertViewPointToDataPoint: function(viewPoint) {
        var newX = this.getColumn(viewPoint.x);
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
        this.allColumns[-2].checkColumnAutosizing(force);
        this.allColumns.forEach(function(column) {
            column.checkColumnAutosizing(force);
        });
    },

    autoSizeRowNumberColumn: function() {
        this.allColumns[-1].checkColumnAutosizing(true);
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

};

function noop() {}

module.exports = Behavior;
