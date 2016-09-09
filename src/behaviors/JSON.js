'use strict';

var Behavior = require('./Behavior');
var DataModelJSON = require('../dataModels/JSON');
var ColumnSchemaFactory = require('../filter/ColumnSchemaFactory');
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
    initialize: function() {},

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
     * @memberOf behaviors.JSON.prototype
     * @param {object} [pipelines] - _(See {@link dataModels.JSON#setPipeline}.)_
     */
    setPipeline: function(pipelines) {
        this.dataModel.setPipeline(pipelines);
        //Only do this once. Code is temporary until filtering is externalized
        this.setGlobalFilter(this.getNewFilter());
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the data field.
     * @param {function|object[]} [dataRows] - Array of uniform objects containing the grid data. If omitted, the previous data source will be re-used.
     * @param {object} [options]
     * @param {function|object} [options.fields] - Array of field names. Passed as 2nd param to `this.dataModel.setData`. If omitted (along with `dataSource`), the previous fields array will be re-used.
     * @param {function|object} [options.schema=deriveSchema] - Used in filter instantiation.
     */
    setData: function(dataRows, options) {
        options = options || {};
        var self = this,
            grid = this.grid,
            fields = options && options.fields,
            calculators = options && options.calculators;

        fields = typeof fields === 'function' ? fields() : fields;
        calculators = typeof calculators === 'function' ? calculators() : calculators;
        dataRows = typeof dataRows === 'function' ? dataRows() : dataRows;
        dataRows = Array.isArray(dataRows) ? dataRows : options.data;
        this.dataModel.setData(dataRows, fields, calculators);
        this.createColumns();

        this.schema = options && options.schema || deriveSchema;


        if (grid.cellEditor) {
            grid.cellEditor.cancelEditing();
        }

        dataRows = dataRows || this.dataModel.source.data;

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
    },

    sortChanged: function(hiddenColumns){
        var dirty = removeHiddenColumns(
            this.getSortedColumnIndexes(),
            (hiddenColumns || this.getHiddenColumns())
        );
        if (dirty){
            this.applyAnalytics();
        }
    }

});


function deriveSchema() {
    return new ColumnSchemaFactory(this.columns).schema;
}


//Logic to moved to adapter layer outside of Hypergrid Core
function removeHiddenColumns(oldSorted, hiddenColumns){
    var dirty = false;
    oldSorted.forEach(function(i) {
        var j = 0,
            colIndex;
        while (j < hiddenColumns.length) {
            colIndex = hiddenColumns[j].index + 1; //hack to get around 0 index
            if (colIndex === i) {
                hiddenColumns[j].unSort();
                dirty = true;
                break;
            }
            j++;
        }
    });
    return dirty;
}

module.exports = JSON;
