/*jshint  bitwise: false */
'use strict';
/**
 *
 * @module behaviors\json
 *
 */

(function() {

    Polymer({ /* jslint ignore:line */

        createColumns: function() {
            var dataModel = this.getDataModel();
            var columnCount = dataModel.getColumnCount();
            var headers = dataModel.getHeaders();
            var fields = dataModel.getFields();
            this.clearColumns();
            for (var i = 0; i < columnCount; i++) {
                var header = headers[i];
                var column = this.addColumn(i, header);
                var properties = column.properties;
                properties.field = fields[i];
                properties.header = header;
            }
        },

        getDefaultDataModel: function() {
            var model = document.createElement('fin-hypergrid-data-model-json');
            this.baseModel = model;
            return model;
        },

        /**
        * @function
        * @instance
        * @description
        set the header labels
        * @param {Array} headerLabels - an array of strings
        */
        setHeaders: function(headerLabels) {
            this.getBaseModel().setHeaders(headerLabels);
        },

        /**
        * @function
        * @instance
        * @description
        returns the array of header labels
        * #### returns: Array
        */
        getHeaders: function() {
            return this.getBaseModel().getHeaders();
        },

        /**
        * @function
        * @instance
        * @description
        setter for the fields array
        * @param {Array} fieldNames - an array of strings of the field names
        */
        setFields: function(fieldNames) {
            this.getDataModel().setFields(fieldNames);
        },

        /**
        * @function
        * @instance
        * @description
        getter for the field names
        * #### returns: Array
        */
        getFields: function() {
            return this.getBaseModel().getFields();
        },

        /**
        * @function
        * @instance
        * @description
        setter for the data field
        * @param {Array} arrayOfUniformObjects - an array of uniform objects, each being a row in the grid
        */
        setData: function(arrayOfUniformObjects) {
            this.getBaseModel().setData(arrayOfUniformObjects);
            this.createColumns();
        },

        /**
        * @function
        * @instance
        * @description
        getter for the data field
        */
        getData: function() {
            return this.getBaseModel().getData();
        },


        /**
        * @function
        * @instance
        * @description
        setter for the totals field
        * @param {array} nestedArray - array2D of totals data
        */
        setTopTotals: function(nestedArray) {
            this.getBaseModel().setTopTotals(nestedArray);
        },

        getTopTotals: function() {
            return this.getBaseModel().getTopTotals();
        },

        /**
        * @function
        * @instance
        * @description
        build the fields and headers from the supplied column definitions

    myJsonBehavior.setColumns([
      { title: 'Stock Name', field: 'short_description' },
      { title: 'Status', field: 'trading_phase' },
      { title: 'Reference Price', field: 'reference_price' }
    ]);

        * @param {Array} columnDefinitions - an array of objects with fields 'title', and 'field'
        */
        setColumns: function(columnDefinitions) {
            this.getBaseModel().setColumns(columnDefinitions);
        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        cellPrePaintNotification: function(cell) {
            var row = this.getRow(cell.config.y);
            var columnId = this.getHeader(cell.config.x);
            cell.config.row = row;
            cell.config.columnId = columnId;
        },

        /**
         * @function
         * @instance
         * @description
         this function enhance the double click event just before it's broadcast to listeners
         * @param {Object} event - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        enhanceDoubleClickEvent: function(event) {
            event.row = this.getRow(event.gridCell.y);
        },

        setDataProvider: function(dataProvider) {
            this.getBaseModel().setDataProvider(dataProvider);
        },

        hasHierarchyColumn: function() {
            return this.getBaseModel().hasHierarchyColumn();
        },

        getColumnAlignment: function(x) {
            if (x === 0 && this.hasHierarchyColumn()) {
                return 'left';
            } else {
                return 'center';
            }
        },
        getRowContextFunction: function(y) {
            return this.getDataModel().getRowContextFunction(y);
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

            this.beColumnStyle(availableGroups.style);
            availableGroups.style.left = '25%';
            availableGroups.style.width = '24%';
            availableGroups.title = 'Available Groups';
            availableGroups.list = this.getAvailableGroups();

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

            this.beColumnStyle(visible.style);
            visible.style.left = '75%';
            visible.style.width = '24%';
            visible.title = 'visible columns';
            visible.list = this.getVisibleColumns();
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
            return this.getBaseModel().getGroups();
        },
        getAvailableGroups: function() {
            return this.getBaseModel().getAvailableGroups();
        },
        getHiddenColumns: function() {
            return this.getBaseModel().getHiddenColumns();
        },
        getVisibleColumns: function() {
            return this.getBaseModel().getVisibleColumns();
        },
        setColumnDescriptors: function(lists) {
            //assumes there is one row....
            var visible = lists.visible;
            var group = lists.group;
            var tableState = this.getState();

            var columnCount = visible.length;
            var indexes = [];
            var i;
            for (i = 0; i < columnCount; i++) {
                indexes.push(visible[i].id);
            }
            tableState.columnIndexes = indexes;

            var groupBys = group.map(function(e) {
                return e.id;
            });

            this.setGroups(groupBys);

            this.changed();
        },


    });

})(); /* jslint ignore:line */
