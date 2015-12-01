'use strict';

var ListDragon = require('list-dragon');

var Behavior = require('./Behavior');
var DataModelDecorator = require('./DataModelDecorator');
var DataModelJSON = require('../dataModels/JSON');
var features = require('../features/index');
var addStylesheet = require('../stylesheets');
var aggregations = require('hyper-analytics').util.aggregations;
//var aggregations = require('../local_node_modules/newanalytics').util.aggregations;
//var aggregations = require('../local_node_modules/finanalytics').aggregations;

/**
 * @name behaviors.JSON
 * @desc > Same parameters as {@link behaviors.JSON#initialize|initialize}, which is called by this constructor.
 * @constructor
 */
var JSON = Behavior.extend('behaviors.JSON', {

    /**
     * @summary Constructor logic, called _after_{@link Behavior#initialize|Behavior.initialize()}.
     * @desc This method will be called upon instantiation of this class or of any class that extends from this class.
     * > All `initialize()` methods in the inheritance chain are called, in turn, each with the same parameters that were passed to the constructor, beginning with that of the most "senior" class through that of the class of the new instance.
     *
     * @param grid - the hypergrid
     * @param {object[]} dataRows - array of uniform data objects
     * @memberOf behaviors.JSON.prototype
     */
    initialize: function(grid, dataRows) {
        this.setData(dataRows);
    },

    features: [
        features.CellSelection,
        features.KeyPaging,
        features.Overlay,
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
        var dataModel = this.getDataModel();
        var columnCount = dataModel.getColumnCount();
        var headers = dataModel.getHeaders();
        var fields = dataModel.getFields();
        this.clearColumns();
        for (var i = 0; i < columnCount; i++) {
            var header = headers[i];
            var column = this.addColumn(i, header);
            var properties = column.getProperties();
            properties.field = fields[i];
            properties.header = header;
        }
    },

    getDefaultDataModel: function() {
        var model = new DataModelJSON();
        var wrapper = new DataModelDecorator(this.getGrid(), model);
        wrapper.setComponent(model);
        return wrapper;
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the header labels.
     * @param {string[]} headerLabels - The header labels.
     */
    setHeaders: function(headerLabels) {
        this.getDataModel().setHeaders(headerLabels);
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @desc * @returns {string[]} The header labels.
     */
    getHeaders: function() {
        return this.getDataModel().getHeaders();
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the fields array.
     * @param {string[]} fieldNames - The field names.
     */
    setFields: function(fieldNames) {
        //were defining the columns based on field names....
        //we must rebuild the column definitions
        this.getDataModel().setFields(fieldNames);
        this.createColumns();
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Get the field names.
     * @returns {string[]}
     */
    getFields: function() {
        return this.getDataModel().getFields();
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the data field.
     * @param {object[]} objects - An array of uniform objects, each being a row in the grid.
     */
    setData: function(dataRows) {
        this.getDataModel().setData(dataRows);
        this.createColumns();
        var self = this;
        if (this.getGrid().isColumnAutosizing()) {
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
     * @memberOf behaviors.JSON.prototype
     * @description Get the data field.
     */
    getData: function() {
        return this.getDataModel().getData();
    },

    getCellEditorAt: function(x, y) {
        var grid = this.getGrid();
        if (grid.isFilterRow(y)) {
            return grid.cellEditors.textfield;
        }
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the totals field.
     * @param {array} nestedArray - array2D of totals data
     */
    setTopTotals: function(nestedArray) {
        this.getDataModel().setTopTotals(nestedArray);
    },

    getTopTotals: function() {
        return this.getDataModel().getTopTotals();
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Build the fields and headers from the supplied column definitions.
     * ```javascript
     * myJsonBehavior.setColumns([
     *     { title: 'Stock Name', field: 'short_description' },
     *     { title: 'Status', field: 'trading_phase' },
     *     { title: 'Reference Price', field: 'reference_price' }
     * ]);
     * ```
     * @param {Array} columnDefinitions - an array of objects with fields 'title', and 'field'
     */
    setColumns: function(columnDefinitions) {
        this.getDataModel().setColumns(columnDefinitions);
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
        this.getDataModel().setDataProvider(dataProvider);
    },

    hasHierarchyColumn: function() {
        return this.getDataModel().hasHierarchyColumn();
    },

    getColumnAlignment: function(x) {
        if (x === 0 && this.hasHierarchyColumn()) {
            return 'left';
        } else {
            return 'center';
        }
    },

    getRowSelectionMatrix: function(selectedRows) {
        return this.getDataModel().getRowSelectionMatrix(selectedRows);
    },

    getColumnSelectionMatrix: function(selectedColumns) {
        return this.getDataModel().getColumnSelectionMatrix(selectedColumns);
    },

    getSelectionMatrix: function(selections) {
        return this.getDataModel().getSelectionMatrix(selections);
    },

    getRowSelection: function() {
        var selectedRows = this.getSelectedRows();
        return this.getDataModel().getRowSelection(selectedRows);
    },

    getColumnSelection: function() {
        var selectedColumns = this.getSelectedColumns();
        return this.getDataModel().getColumnSelection(selectedColumns);
    },

    getSelection: function() {
        var selections = this.getSelections();
        return this.getDataModel().getSelection(selections);
    },

    openEditor: function(div) {
        if (!this.isColumnReorderable()) {
            return false;
        }

        addStylesheet('dnd', null);

        var groups = { models: this.getGroups(), title: 'Groups' },
            availableGroups = { models: this.getAvailableGroups(), title: 'Available Groups' },
            hiddenColumns = { models: this.getHiddenColumns(), title: 'Hidden Ccolumns' },
            visibleColumns = { models: this.getVisibleColumns(), title: 'Visible Columns'},
            groupLists = new ListDragon([groups, availableGroups]),
            columnLists = new ListDragon([hiddenColumns, visibleColumns]),
            listSets = [groupLists, columnLists];

        listSets.forEach(function(listSet) {
            listSet.modelLists.forEach(function(list) {
                div.appendChild(list.container);
            });
        });

        //attach for later retrieval
        div.lists = {
            group: groups.models,
            availableGroups: availableGroups.models,
            hidden: hiddenColumns.models,
            visible: visibleColumns.models
        };

        return true;
    },
    getGroups: function() {
        return this.getDataModel().getGroups();
    },
    getAvailableGroups: function() {
        return this.getDataModel().getAvailableGroups();
    },
    getHiddenColumns: function() {
        return this.getDataModel().getHiddenColumns();
    },
    getVisibleColumns: function() {
        return this.getDataModel().getVisibleColumns();
    },
    setColumnDescriptors: function(lists) {
        //assumes there is one row....
        var tree = this.columns[0];
        this.columns.length = 0;
        if (tree && tree.label === 'Tree') {
            this.columns.push(tree);
        }
        for (var i = 0; i < lists.visible.length; i++) {
            this.columns.push(lists.visible[i]);
        }

        var groupBys = lists.group.map(function(e) {
            return e.id;
        });
        this.getDataModel().setGroups(groupBys);

        this.changed();
    },

    getSelectedRows: function() {
        var offset = -this.getGrid().getHeaderRowCount();
        var selections = this.getGrid().getSelectionModel().getSelectedRows();
        var result = selections.map(function(each) {
            return each + offset;
        });
        return result;
    },

    getSelectedColumns: function() {
        return this.getGrid().getSelectionModel().getSelectedColumns();
    },

    getSelections: function() {
        return this.getGrid().getSelectionModel().getSelections();
    }

});

module.exports = JSON;
