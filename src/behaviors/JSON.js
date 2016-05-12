'use strict';

var Local = require('./Local');
var DataModelJSON = require('../dataModels/JSON');
var features = require('../features');
var aggregations = require('../Shared.js').analytics.util.aggregations;

/**
 * @name behaviors.JSON
 * @desc > Same parameters as {@link behaviors.Behavior#initialize|initialize}, which is called by this constructor.
 * @constructor
 */
var JSON = Local.extend('behaviors.JSON', {

    /**
     * @summary Constructor logic, called _after_{@link Behavior#initialize|Behavior.initialize()}.
     * @desc This method will be called upon instantiation of this class or of any class that extends from this class.
     * > All `initialize()` methods in the inheritance chain are called, in turn, each with the same parameters that were passed to the constructor, beginning with that of the most "senior" class through that of the class of the new instance.
     *
     * @param grid - the hypergrid
     * @param {undefined|function|menuItem[]} schema - Already consumed by Behavior's {@link Behavior#initialize|initialize}.
     * @param {object[]} dataRows - May be:
     * * An array of congruent raw data objects
     * * A function returning same
     * @memberOf behaviors.JSON.prototype
     */
    initialize: function(grid, schema, dataRows) {
        this.setData(dataRows);
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
        features.CellEditing,
        features.CellClick,
        features.OnHover
    ],

    aggregations: aggregations,

    createColumns: function() {
        var dataModel = this.dataModel;
        var columnCount = dataModel.getColumnCount();
        var headers = dataModel.getHeaders();
        var fields = dataModel.getFields();
        this.clearColumns();
        for (var index = 0; index < columnCount; index++) {
            var header = headers[index];
            var column = this.addColumn({ index: index, header: header });
            var properties = column.getProperties();
            properties.field = fields[index];
            properties.header = header;
            properties.complexFilter = null;
        }
    },

    getNewDataModel: function() {
        return new DataModelJSON(this.grid);
    },

    applyAnalytics: function() {
        this.dataModel.applyAnalytics();
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the header labels.
     * @param {string[]} headerLabels - The header labels.
     */
    setHeaders: function(headerLabels) {
        this.dataModel.setHeaders(headerLabels);
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @desc * @returns {string[]} The header labels.
     */
    getHeaders: function() {
        return this.dataModel.getHeaders();
    },
    /**
     * @memberOf behaviors.JSON.prototype
     * @return {string} The field at `colIndex`.
     * @param {number} colIndex - the absolute column index of interest
     */
    getColumnName: function(colIndex) {
        return this.getColumn(colIndex).name;
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
     * @description Get the field names.
     * @returns {string[]}
     */
    getFields: function() {
        return this.dataModel.getFields();
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the data field.
     * @param {object[]} objects - An array of uniform objects, each being a row in the grid.
     * @param {FilterTree} [filter]
     */
    setData: function(dataRows, filter) {
        this.dataModel.setData(dataRows);
        this.createColumns();

        this.setGlobalFilter(this.getNewFilter());

        var self = this;
        if (this.grid.isColumnAutosizing()) {
            setTimeout(function() {
                self.autosizeAllColumns();
            }, 100);
            self.changed();
        } else {
            setTimeout(function() {
                self.allColumns[-1].checkColumnAutosizing(true);
                self.changed();
            });
        }
    },

    /**
     * @summary Set the top totals.
     * @memberOf behaviors.JSON.prototype
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

    setDataProvider: function(dataProvider) {
        this.dataModel.setDataProvider(dataProvider);
    },

    hasHierarchyColumn: function() {
        return this.dataModel.hasHierarchyColumn();
    },

    getColumnAlignment: function(x) {
        if (x === 0 && this.hasHierarchyColumn()) {
            return 'left';
        } else {
            return 'center';
        }
    },


    getRowSelectionMatrix: function(selectedRows) {
        return this.dataModel.getRowSelectionMatrix(selectedRows);
    },

    getColumnSelectionMatrix: function(selectedColumns) {
        return this.dataModel.getColumnSelectionMatrix(selectedColumns);
    },

    getSelectionMatrix: function(selections) {
        return this.dataModel.getSelectionMatrix(selections);
    },

    getRowSelection: function() {
        var selectedRows = this.getSelectedRows();
        return this.dataModel.getRowSelection(selectedRows);
    },

    getColumnSelection: function() {
        var selectedColumns = this.getSelectedColumns();
        return this.dataModel.getColumnSelection(selectedColumns);
    },

    getSelection: function() {
        var selections = this.getSelections();
        return this.dataModel.getSelection(selections);
    },

    getGroups: function() {
        return this.dataModel.getGroups();
    },
    getAvailableGroups: function() {
        return this.dataModel.getAvailableGroups();
    },
    getHiddenColumns: function() {
        return this.dataModel.getHiddenColumns();
    },
    getVisibleColumns: function() {
        return this.dataModel.getVisibleColumns();
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
