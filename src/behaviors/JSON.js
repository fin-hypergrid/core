/* eslint-env browser */

'use strict';

var Behavior = require('./Behavior');
var DataModelDecorator = require('./DataModelDecorator');
var DataModelJSON = require('../dataModels/JSON');
var features = require('../features/index');

var JSON = Behavior.extend({

    //initalize: function(grid, component) {},

    features: [
        features.KeyPaging,
        features.Overlay,
        features.ColumnResizing,
        features.RowResizing,
        features.Filters,
        features.RowSelection,
        features.ColumnSelection,
        features.CellSelection,
        features.ColumnMoving,
        features.ColumnSorting,
        features.CellEditing,
        features.CellClick,
        features.OnHover
    ],

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
     * @function
     * @instance
     * @description Set the header labels.
     * @param {string[]} headerLabels - The header labels.
     */
    setHeaders: function(headerLabels) {
        this.getDataModel().setHeaders(headerLabels);
    },

    /**
     * @function
     * @instance
     * @desc * @returns {string[]} The header labels.
     */
    getHeaders: function() {
        return this.getDataModel().getHeaders();
    },

    /**
     * @function
     * @instance
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
     * @function
     * @instance
     * @description Get the field names.
     * @returns {string[]}
     */
    getFields: function() {
        return this.getDataModel().getFields();
    },

    /**
     * @function
     * @instance
     * @description Set the data field.
     * @param {object[]} objects - An array of uniform objects, each being a row in the grid.
     */
    setData: function(objects) {
        this.getDataModel().setData(objects);
        this.createColumns();
        var self = this;
        if (this.getGrid().isColumnAutosizing()) {
            setTimeout(function() {
                self.autosizeAllColumns();
            }, 100);
        } else {
            this.changed();
        }
    },

    /**
     * @function
     * @instance
     * @description Get the data field.
     */
    getData: function() {
        return this.getDataModel().getData();
    },


    /**
     * @function
     * @instance
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
     * @function
     * @instance
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
     * @function
     * @instance
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
        var container = document.createElement('div');

        var group = document.createElement('fin-hypergrid-dnd-list');
        var availableGroups = document.createElement('fin-hypergrid-dnd-list');
        var hidden = document.createElement('fin-hypergrid-dnd-list');
        var visible = document.createElement('fin-hypergrid-dnd-list');

        container.appendChild(group);
        container.appendChild(availableGroups);
        container.appendChild(hidden);
        container.appendChild(visible);

        this.beColumnStyle(group.style);
        group.style.left = '0%';
        group.style.width = '24%';
        group.title = 'groups';
        group.list = this.getGroups();
        group.canDropItem = function(sourceList, myList, sourceIndex, item, e) {
            noop(sourceList, myList, sourceIndex, e);
            return sourceList === group.list || sourceList === availableGroups.list;
        };

        this.beColumnStyle(availableGroups.style);
        availableGroups.style.left = '25%';
        availableGroups.style.width = '24%';
        availableGroups.title = 'Available Groups';
        availableGroups.list = this.getAvailableGroups();
        availableGroups.canDropItem = function(sourceList, myList, sourceIndex, item, e) {
            noop(sourceList, myList, sourceIndex, e);
            return sourceList === group.list || sourceList === availableGroups.list;
        };

        //can't remove the last item
        // group.canDragItem = function(list, item, index, e) {
        //     noop(item, index, e);
        //     if (self.block.ungrouped) {
        //         return true;
        //     } else {
        //         return list.length > 1;
        //     }
        // };
        //only allow dropping of H fields
        // group.canDropItem = function(sourceList, myList, sourceIndex, item, e) {
        //     noop(sourceList, myList, sourceIndex, e);
        //     return self.block.groupable.indexOf(item) > -1;
        // };

        this.beColumnStyle(hidden.style);
        hidden.style.left = '50%';
        hidden.style.width = '24%';
        hidden.title = 'hidden columns';
        hidden.list = this.getHiddenColumns();
        hidden.canDropItem = function(sourceList, myList, sourceIndex, item, e) {
            noop(sourceList, myList, sourceIndex, e);
            return sourceList === hidden.list || sourceList === visible.list;
        };

        this.beColumnStyle(visible.style);
        visible.style.left = '75%';
        visible.style.width = '24%';
        visible.title = 'visible columns';
        visible.list = this.getVisibleColumns();
        visible.canDropItem = function(sourceList, myList, sourceIndex, item, e) {
            noop(sourceList, myList, sourceIndex, e);
            return sourceList === hidden.list || sourceList === visible.list;
        };

        //can't remove the last item
        // visible.canDragItem = function(list, item, index, e) {
        //     noop(item, index, e);
        //     return list.length > 1;
        // };

        //attach for later retrieval
        div.lists = {
            group: group.list,
            availableGroups: availableGroups.list,
            hidden: hidden.list,
            visible: visible.list
        };

        div.appendChild(container);
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

function noop() {}

module.exports = JSON;
