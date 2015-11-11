/* globals fin */
/*jshint  bitwise: false */
'use strict';
/**
 *
 * @module behaviors\json
 *
 */

(function() {

    var noop = function() {};

    var dataModels = fin.hypergrid.dataModels;

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
                var properties = column.getProperties();
                properties.field = fields[i];
                properties.header = header;
            }
        },

        getDefaultDataModel: function() {
            var model = new dataModels.JSON();
            var wrapper = new this.DataModelDecorator(this.getGrid(), model);
            wrapper.setComponent(model);
            return wrapper;
        },

        /**
        * @function
        * @instance
        * @description
        set the header labels
        * @param {Array} headerLabels - an array of strings
        */
        setHeaders: function(headerLabels) {
            this.getDataModel().setHeaders(headerLabels);
        },

        /**
        * @function
        * @instance
        * @description
        returns the array of header labels
        * #### returns: Array
        */
        getHeaders: function() {
            return this.getDataModel().getHeaders();
        },

        /**
        * @function
        * @instance
        * @description
        setter for the fields array
        * @param {Array} fieldNames - an array of strings of the field names
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
        * @description
        getter for the field names
        * #### returns: Array
        */
        getFields: function() {
            return this.getDataModel().getFields();
        },

        /**
        * @function
        * @instance
        * @description
        setter for the data field
        * @param {Array} arrayOfUniformObjects - an array of uniform objects, each being a row in the grid
        */
        setData: function(arrayOfUniformObjects) {
            this.getDataModel().setData(arrayOfUniformObjects);
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
        * @description
        getter for the data field
        */
        getData: function() {
            return this.getDataModel().getData();
        },


        /**
        * @function
        * @instance
        * @description
        setter for the totals field
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
            this.getDataModel().setColumns(columnDefinitions);
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

            addStylesheetToHead('dnd');

            var container = document.createElement('div'),
                groups = { models: this.getGroups(), title: 'Groups' },
                availableGroups = { models: this.getAvailableGroups(), title: 'Available Groups' },
                hidden = { models: this.getHiddenColumns(), title: 'Hidden Ccolumns' },
                visible = { models: this.getVisibleColumns(), title: 'Visible Columns'},
                listSets = [
                    new window.fin.hypergrid.ListDragon([groups, availableGroups]),
                    new window.fin.hypergrid.ListDragon([hidden, visible])
                ];

            listSets.forEach(function(listSet) {
                listSet.modelLists.forEach(function(list) {
                    container.appendChild(list.container);
                });
            });
/*
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
*/
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
        },

    });

    function addStylesheetToHead(name) {
        var sheet = addStylesheetToHead.sheets[name];
        if (sheet) {
            delete addStylesheetToHead.sheets[name];

            var elt = document.createElement('style'),
                head = document.head || document.getElementsByTagName('head')[0];

            elt.type = 'text/css';

            sheet = sheet.join('\n');

            if (elt.styleSheet) {
                elt.styleSheet.cssText = sheet;
            } else {
                elt.appendChild(document.createTextNode(sheet));
            }

            head.appendChild(elt);
        }
    }
    addStylesheetToHead.sheets = {
        'dnd': [
            'div.dragon-list, li.dragon-pop {',
            '    font-family: Roboto, sans-serif;',
            '    text-transform: capitalize; }',
            'div.dragon-list {',
            '    position: absolute;',
            '    top: 4%;',
            '    left: 4%;',
            '    height: 92%;',
            '    width: 20%; }',
            'div.dragon-list:nth-child(2) {',
            '    left: 28%; }',
            'div.dragon-list:nth-child(3) {',
            '    left: 52%; }',
            'div.dragon-list:nth-child(4) {',
            '    left: 76%; }',
            'div.dragon-list > div, div.dragon-list > ul > li, li.dragon-pop {',
            '    line-height: 46px; }',
            'div.dragon-list > ul {',
            '    top: 46px; }',
            'div.dragon-list > ul > li:not(:last-child)::before, li.dragon-pop::before {',
            '    content: \'\\2b24\';', // BLACK LARGE CIRCLE
            '    color: #b6b6b6;',
            '    font-size: 30px;',
            '    margin: 8px 14px 8px 8px; }',
            'li.dragon-pop {',
            '    opacity:.8; }'
        ]
    };

})(); /* jslint ignore:line */
