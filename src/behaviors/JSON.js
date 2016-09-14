'use strict';

var Behavior = require('./Behavior');
var DataModelJSON = require('../dataModels/JSON');
var features = require('../features');

/**
 * @name behaviors.JSON
 * @desc > Same parameters as {@link behaviors.Behavior#initialize|initialize}, which is called by this constructor.
 * @constructor
 * @extends Behavior
 */
var JSON = Behavior.extend('behaviors.JSON', {

    /**
     * @summary Constructor logic, called _after_{@link Behavior#initialize|Behavior.initialize()}.
     * @desc This method will be called upon instantiation of this class or of any class that extends from this class.
     * > All `initialize()` methods in the inheritance chain are called, in turn, each with the same parameters that were passed to the constructor, beginning with that of the most "senior" class through that of the class of the new instance.
     *
     * @memberOf behaviors.JSON.prototype
     */
    initialize: function(grid, options) {
        this.setData(options);

        if (options.pipeline) {
            this.setPipeline(options.pipeline);
        }
    },

    features: [
        features.CellSelection,
        features.KeyPaging,
        features.ColumnPicker,
        features.ColumnResizing,
        features.RowResizing,
        features.Filters,
        features.RowSelection,
        features.ColumnSelection,
        features.ColumnMoving,
        features.ColumnSorting,
        features.CellClick,
        features.CellEditing,
        features.OnHover
    ],

    createColumns: function() {
        var dataModel = this.dataModel;
        var columnCount = dataModel.getColumnCount();
        var headers = dataModel.getHeaders();
        var fields = dataModel.getFields();
        var calculators = dataModel.getCalculators();
        var REGEX_CAMEL_CASE = /([^_A-Z])([A-Z]+)/g;
        this.clearColumns();
        for (var index = 0; index < columnCount; index++) {
            var header = headers[index];
            var calculator = calculators[index];
            var column = this.addColumn({
                index: index,
                header: header,
                calculator: calculator
            });
            this.columnEnum[column.name.replace(REGEX_CAMEL_CASE, '$1_$2').toUpperCase()] = index;
            var properties = column.getProperties();
            properties.field = fields[index];
            properties.header = header;
            properties.complexFilter = null;
            if (calculator) {
                properties.calculator = calculator;
            }
        }
    },

    getNewDataModel: function() {
        return new DataModelJSON(this.grid);
    },

    /**
     * @memberOf behaviors.JSON.prototype
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
     * @memberOf behaviors.JSON.prototype
     * @description Set the fields array.
     * @param {string[]} fieldNames - The field names.
     */
    setFields: function(fieldNames) {
        //were defining the columns based on field names....
        //we must rebuild the column definitions
        this.dataModel.setFields(fieldNames);
        this.createColumns();
    },

    /**
     * @see {@link dataModels.JSON#setPipeline}
     * @param {object} [DataSources] - New pipeline description. _(See {@link dataModels.JSON#setPipeline}.)_
     * @param {object} [options] - Takes first argument position when `DataSources` omitted. _(See {@link dataModels.JSON#setPipeline}.)_
     * @param {boolean} [options.apply=true] Apply data transformations to the new data.
     * @memberOf behaviors.JSON.prototype
     */
    setPipeline: function(DataSources, options) {
        if (!Array.isArray(DataSources)) {
            options = DataSources;
            DataSources = undefined;
        }

        this.dataModel.setPipeline(DataSources, options);

        if (!options || options.apply === undefined || options.apply) {
            this.applyAnalytics();
        }
    },

    /**
     * Pop pipeline stack.
     * @see {@link dataModels.JSON#unstashPipeline}
     * @param {string} [whichStash]
     * @param {object} [options] - Takes first argument position when `DataSources` omitted.
     * @param {boolean} [options.apply=true] Apply data transformations to the new data.
     */
    unstashPipeline: function(stash, options) {
        if (typeof stash === 'object') {
            options = stash;
            stash = undefined;
        }

        this.dataModel.unstashPipeline(stash);

        if (!options || options.apply === undefined || options.apply) {
            this.applyAnalytics();
        }
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the data field.
     * @param {function|object[]} [dataRows=options.data] - Array of uniform data row objects or function returning same.
     * @param {object} [options] - Takes first argument position when `dataRows` omitted.
     * @param {function|object} [options.data] - Array of uniform data row objects or function returning same.
     * Passed as 1st param to {@link dataModel.JSON#setData}. If falsy, method aborted.
     * @param {function|object} [options.fields] - Array of field names or function returning same.
     * Passed as 2nd param to {@link dataModel.JSON#setData}.
     * @param {function|object} [options.calculators] - Array of calculators or function returning same.
     * Passed as 3rd param to {@link dataModel.JSON#setData}.
     * @param {boolean} [options.apply=true] Apply data transformations to the new data.
     */
    setData: function(dataRows, options) {
        if (!(Array.isArray(dataRows) || typeof dataRows === 'function')) {
            options = dataRows;
            dataRows = options && options.data;
        }

        dataRows = this.unwrap(dataRows);

        if (dataRows === undefined)  {
            return;
        }

        if (!Array.isArray(dataRows)) {
            throw 'Data is not an array';
        }

        options = options || {};

        var self = this,
            grid = this.grid;

        this.dataModel.setData(
            dataRows,
            this.unwrap(options.fields),
            this.unwrap(options.calculators)
        );

        this.createColumns();

        if (grid.cellEditor) {
            grid.cellEditor.cancelEditing();
        }

        if (grid.isColumnAutosizing()) {
            setTimeout(function() {
                self.autosizeAllColumns();
            }, 100);
            grid.allowEvents(dataRows.length);
        } else {
            setTimeout(function() {
                self.getColumn(-1).checkColumnAutosizing(true);
                grid.allowEvents(dataRows.length);
            });
        }

        if (options.apply === undefined || options.apply) {
            this.applyAnalytics();
        }
    },

    /**
     * @summary Set the top totals.
     * @memberOf behaviors.JSON.p rototype
     * @param {Array<Array>} totalRows - array of rows (arrays) of totals
     */
    setTopTotals: function(totalRows) {
        this.dataModel.setTopTotals(totalRows);
    },

    /**
     * @summary Get the top totals.
     * @memberOf behaviors.JSON.prototype
     * @returns {Array<Array>}
     */
    getTopTotals: function() {
        return this.dataModel.getTopTotals();
    },

    /**
     * @summary Set the bottom totals.
     * @memberOf behaviors.JSON.prototype
     * @param {Array<Array>} totalRows - array of rows (arrays) of totals
     */
    setBottomTotals: function(totalRows) {
        this.dataModel.setBottomTotals(totalRows);
    },

    /**
     * @summary Get the bottom totals.
     * @memberOf behaviors.JSON.prototype
     * @returns {Array<Array>}
     */
    getBottomTotals: function() {
        return this.dataModel.getBottomTotals();
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Build the fields and headers from the supplied column definitions.
     * ```javascript
     * myJsonBehavior.setColumns([
     *     { header: 'Stock Name', name: 'short_description' },
     *     { header: 'Status', name: 'trading_phase' },
     *     { header: 'Reference Price', name: 'reference_price' }
     * ]);
     * ```
     * @param {Array} columnDefinitions - an array of objects with fields 'title', and 'field'
     */
    setColumns: function(columnDefinitions) {
        this.dataModel.setColumns(columnDefinitions); // TODO: this method is missing
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Enhance the double-click event just before it's broadcast to listeners.
     * @param {Point} event
     */
    enhanceDoubleClickEvent: function(event) {
        event.row = this.getRow(event.gridCell.y);
    },

    //Not being used. Should be repurposed??
    setDataProvider: function(dataProvider) {
        this.dataModel.setDataProvider(dataProvider);
    },

    hasHierarchyColumn: function() {
        return this.dataModel.hasHierarchyColumn();
    },

    getHiddenColumns: function() {
        return this.dataModel.getHiddenColumns();
    },

    getActiveColumns: function() {
        return this.dataModel.getActiveColumns();
    },
    getVisibleColumns: function() {
        return this.deprecated('getVisibleColumns()', 'getActiveColumns()', '1.0.6', arguments);
    },

    getSelectedRows: function() {
        var offset = -this.grid.getHeaderRowCount();
        var selections = this.grid.selectionModel.getSelectedRows();
        var result = selections.map(function(each) {
            return each + offset;
        });
        return result;
    },

    getSelectedColumns: function() {
        return this.grid.selectionModel.getSelectedColumns();
    },

    getSelections: function() {
        return this.grid.selectionModel.getSelections();
    },

    getSortedColumnIndexes: function(){
      return this.dataModel.getSortedColumnIndexes();
    }
});

module.exports = JSON;
