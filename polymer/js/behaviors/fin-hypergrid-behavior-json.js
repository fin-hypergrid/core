/*jshint  bitwise: false */
'use strict';
/**
 *
 * @module behaviors\json
 *
 */

(function() {

    Polymer({ /* jslint ignore:line */

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
        return a specific header at column index x
        * #### returns: string
        * @param {integer} x - the column index of interest
        */
        getHeader: function(x, y) {
            return this.getBaseModel().getHeader(x, y);
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
         return the field at colIndex
         * #### returns: string
         * @param {integer} colIndex - the column index of interest
         */
        getField: function(colIndex) {
            return this.getBaseModel().getField(colIndex);
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
        setTotals: function(nestedArray) {
            this.getBaseModel().setTotals(nestedArray);
        },

        getTotals: function() {
            return this.getBaseModel().getTotals();
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
        }

    });

})(); /* jslint ignore:line */
