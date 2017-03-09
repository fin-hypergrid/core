'use strict';

var DataModel = require('./DataModel');
var getFieldNames = require('../lib/fields').getFieldNames;

/**
 * @name dataModels.JSON
 * @constructor
 * @extends DataModel
 */
var JSON = DataModel.extend('dataModels.JSON', {

    initialize: function(grid, options) {
        this.reset(options);
    },
    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    get DataSourceOrigin() {
        return this.deprecated('.DataSourceOrigin', '', '1.4.0', 'No Longer Supported');
    },
    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    get pipelineSchemaStash() {
        return this.deprecated('.pipelineSchemaStash', '', '1.4.0', 'No Longer Supported');
    },

    /**
     * @param {object} [options]
     * @memberOf dataModels.JSON.prototype
     */
    reset: function(options) {
        options = options || {};
        this._schema = setInternalColSchema.call(this, []);
        this.setData(options.data, options.schema);
    },

    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    get  defaultPipelineSchema() {
        return this.deprecated('. defaultPipelineSchema', '', '1.4.0', 'No Longer Supported');
    },

    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    clearSelectedData: function() {
        var key = 'clearSelectedData()',
            warned = this.$$DEPRECATION_WARNED = this.$$DEPRECATION_WARNED || {};
        if (!(key in warned)) {
            warned[key] = 0;
            console.warn(key + ' has been deprecated as of v1.2.23. This function no longer has any meaning; calls should be removed.');
        }
    },

    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    getDataSource: function() {
        return this.deprecated('getDataSource()', 'dataSource', '1.0.7');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    getData: function() {
        return this.data;
    },

    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    getFilteredData: function() {
        return this.deprecated('getFilteredData()', 'getIndexedData()', '1.2.0', arguments, 'No Longer Supported');
    },
    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    getIndexedData: function() {
        return this.deprecated('getIndexedData()', '', '1.4.0', 'No Longer Supported');
    },

    /**
     * @param {number} x - Data column coordinate.
     * @param {number} y - Data row coordinate.
     * @memberOf dataModels.JSON.prototype
     */
    getValue: function(x, y) {
        var row = this.getRow(y);
        if (!row) {
            return null;
        }
        return row[this.schema[x].name];
    },
    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    getDataIndex: function(y) {
        return this.deprecated('getDataIndex()', '', '1.4.0', 'No Longer Supported');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} x - Data column coordinate.
     * @param {number} r - Grid row coordinate.
     * @param value
     */
    setValue: function(x, r, value) {
        this.getRow(r)[this.schema[x].name] = value;
    },

    /**
     * @deprecated As of v1.1.0, use `this.grid.behavior.getColumnProperties(x)` instead.
     * @memberOf dataModels.JSON.prototype
     * @param {number} x - Data column coordinate.
     * @returns {*}
     */
    getColumnProperties: function(x) {
        //access directly because we want it ordered
        return this.deprecated('getColumnProperties(x)', 'grid.behavior.getColumnProperties(x)', '1.2.0', arguments);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getColumnCount: function() {
        var offset = this.grid.behavior.hasTreeColumn() ? -1 : 0;
        return this.dataSource.getColumnCount() + offset;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getRowCount: function() {
        return this.data.length;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getHeaders: function() {
        return getSchemaPropArr.call(this, 'header', 'getHeaders');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {string[]} headers
     */
    setHeaders: function(headers) {
        if (!(Array.isArray(headers) && headers.length === this.schema.length)) {
            throw new Error('Expected argument to be an array with correct length.');
        }
        headers.forEach(function(header, i) {
            this.schema[i].header = header;
        }, this);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {string[]} fields
     */
    setFields: function(fields) {
        if (!(Array.isArray(fields) && fields.length === this.schema.length)) {
            throw new Error('Expected argument to be an array with correct length.');
        }
        fields.forEach(function(field, i) {
            this.schema[i].field = field;
        }, this);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getFields: function() {
        return getSchemaPropArr.call(this, 'name', 'getFields');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getCalculators: function() {
        return getSchemaPropArr.call(this, 'calculator', 'getCalculators');
    },

    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    applyAnalytics: function() {
        return this.deprecated('applyAnalytics', '', '1.4.0', arguments, 'No longer supported');
    },

    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    reindex: function(options) {
        return this.deprecated('reindex', '', '1.4.0', arguments, 'No longer supported');
    },

    /** @typedef {object} columnSchemaObject
     * @property {string} name - The required column name.
     * @property {string} [header] - An override for derived header
     * @property {function} [calculator] - A function for a computed column. Undefined for normal data columns.
     * @property {string} [type] - Used for sorting when and only when comparator not given.
     */

    /**
     * @param {object[]} [data=[]] - Array of uniform objects containing the grid data.
     * @param {columnSchemaObject[]} [schema=[]]
     * @memberOf dataModels.JSON.prototype
     */
    setData: function(data, schema) {
        /**
         * @summary The array of uniform data objects.
         * @name schema
         * @type {columnSchemaObject[]}
         * @memberOf dataModels.JSON.prototype
         */
        this.data = data || [];

        if (schema) {
            this.setSchema(schema);
        } else if (this.data.length && !this.schema.length) {
            this.setSchema([]);
        }
    },

    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    setPipeline: function() {
        return this.deprecated('setPipeline', '', '1.4.0', arguments, 'No longer supported');
    },
    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    findDataSourceByType: function() {
        return this.deprecated('findDataSourceByType', '', '1.4.0', arguments, 'No longer supported');
    },
    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    getPipelineSchemaStash: function() {
        return this.deprecated('getPipelineSchemaStash', '', '1.4.0', arguments, 'No longer supported');
    },

    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    unstashPipeline: function() {
        return this.deprecated('unstashPipeline', '', '1.4.0', arguments, 'No longer supported');
    },

    /**
     * @deprecated
     * @param {number} [newLength=0]
     * @memberOf dataModels.JSON.prototype
     */
    truncatePipeline: function(newLength) {
        return this.deprecated('truncatePipeline(newLength)', 'setPipeline()', '1.2.0', arguments, 'Build a local pipeline (array of data source constructors) and pass it to setPipeline.');
    },

    isTree: function() {
        return this.dataSource.isDrillDown();
    },

    isTreeCol: function(event) {
        return this.dataSource.isDrillDownCol(event);
    },

    /**
     * @deprecated As pf v1.1.0, use `this.grid.behavior.setTopTotals()` instead.
     * @summary Set the top total row(s).
     * @param {dataRowObject[]} totalRows - Array of 0 or more rows containing summary data. Omit to set to empty array.
     * @memberOf dataModels.JSON.prototype
     */
    setTopTotals: function(totalRows) {
        return this.deprecated('setTopTotals(rows)', 'grid.behavior.setTopTotals(rows)', '1.1.0', arguments);
    },

    /**
     * @deprecated As pf v1.1.0, use `this.grid.behavior.getTopTotals()` instead.
     * @summary Get the top total row(s).
     * @returns {dataRowObject[]}
     * @memberOf dataModels.JSON.prototype
     */
    getTopTotals: function() {
        return this.deprecated('getTopTotals(rows)', 'grid.behavior.getTopTotals(rows)', '1.1.0', arguments);
    },

    /**
     * @deprecated
     * @summary Set the bottom total row(s).
     * @param {dataRowObject[]} totalRows - Array of 0 or more rows containing summary data. Omit to set to empty array.
     * @memberOf dataModels.JSON.prototype
     */
    setBottomTotals: function(totalRows) {
        return this.deprecated('setBottomTotals(rows)', 'grid.behavior.setBottomTotals(rows)', '1.1.0', arguments);
    },

    /**
     * @summary Get the bottom total row(s).
     * @deprecated As pf v1.1.0, use `this.grid.behavior.getBottomTotals()` instead.
     * @returns {dataRowObject[]}
     * @memberOf dataModels.JSON.prototype
     */
    getBottomTotals: function() {
        return this.deprecated('getBottomTotals()', 'grid.behavior.getBottomTotals()', '1.1.0');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {Column[]}
     */
    getActiveColumns: function() {
        return this.deprecated('getActiveColumns()', 'grid.behavior.getActiveColumns()', '1.2.14', arguments);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @deprecated As of v1.0.6, use `this.getActiveColumns` instead.
     * @returns {Column[]}
     */
    getVisibleColumns: function() {
        return this.deprecated('getVisibleColumns()', 'getActiveColumns()', '1.0.6', arguments);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @deprecated
     * @returns {object[]}
     */
    getHiddenColumns: function() {
        return this.deprecated('getHiddenColumns()', 'grid.behavior.getHiddenColumns()', '1.2.14', arguments);
    },

    hasHierarchyColumn: function() {
        return this.deprecated('hasHierarchyColumn()', '', 'v1.3.3');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param index
     * @param returnAsString
     * @desc Provides the unicode character used to denote visually if a column is a sorted state
     * @returns {*}
     */
    getSortImageForColumn: function(columnIndex) {
        //Not implemented
    },

    /**
     * @param cell
     * @param event
     * @return {boolean} Clicked in a drill-down column.
     * @memberOf dataModels.JSON.prototype
     */
    cellClicked: function(event) {
        if (arguments.length === 2) {
            return this.deprecated('cellClicked(cell, event)', 'cellClicked(event)', '1.2.0', arguments);
        }
        return this.toggleRow(event.dataCell.y, undefined, event);
    },

    /**
     * @summary Toggle the drill-down control of a the specified row.
     * @desc Operates only on the following rows:
     * * Expandable rows - Rows with a drill-down control.
     * * Revealed rows - Rows not hidden inside of collapsed drill-downs.
     * @param y - Revealed row number. (This is not the row ID.)
     * @param {boolean} [expand] - One of:
     * * `true` - Expand row.
     * * `false` - Collapse row.
     * * `undefined` (or omitted) - Toggle state of row.
     * @param event
     * @returns {boolean|undefined} Changed. Specifically, one of:
     * * `undefined` row had no drill-down control
     * * `true` drill-down changed
     * * `false` drill-down unchanged (was already in requested state)
     * @memberOf dataModels.JSON.prototype
     */
    toggleRow: function(y, expand, event) {
       //To Be Implemented
    },

    /**
     * @param {number} r - Data row coordinate.
     * @returns {object|undefined} Returns data row object or `undefined` if a header row.
     * @memberOf dataModels.JSON.prototype
     */
    getRow: function(r) {
        return this.data[r];
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @deprecated
     */
    getController: function(type) {
        return this.deprecated('getController()', '', '1.4.0', arguments, 'Not Supported');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @deprecated
     */
    setController: function(typeOrHashOfTypes, controller) {
        return this.deprecated('setController()', '', '1.4.0', arguments, 'Not Supported');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @deprecated
     */
    prop: function(type, columnIndex, propNameOrPropHash, value) {
        return this.deprecated('prop()', '', '1.4.0', arguments, 'Not Supported');
    },

    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    applyState: function() {
        return this.deprecated('applyState()', '', '1.4.0', arguments, 'No longer supported');
    },

    getUnfilteredValue: function(x, y) {
        return this.deprecated('getUnfilteredValue(x, y)', '', '1.2.0', arguments, 'No longer supported');
    },

    getUnfilteredRowCount: function() {
        return this.deprecated('getUnfilteredValue(x, y)', '', '1.2.0', arguments, 'No longer supported');
    },

    /**
     * @summary Add a new data row to the grid.
     * @desc If data source pipeline in use, to see the new row in the grid, you must eventually call:
     * ```javascript
     * this.grid.behavior.reindex();
     * this.grid.behaviorChanged();
     * ```
     * @param {object} newDataRow
     * @returns {object} The new row object.
     * @memberOf dataModels.JSON.prototype
     */
    addRow: function(newDataRow) {
        this.getData().push(newDataRow);
        return newDataRow;
    },

    get schema() { return this._schema;},

    set schema(schema) {
        schema = setInternalColSchema.call(this, schema);
        this._schema = schema;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    getSchema:  function(){
        return this._schema;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {columnSchemaObject[]}
     */
    setSchema: function(schema){
        if (!schema.length) {
            var fields = getFieldNames(this.data[0]);

            schema = Array(fields.length);

            for (var i = 0; i < fields.length; i++) {
                schema[i] = { name: fields[i] };
            }
        }
        schema = setInternalColSchema.call(this, schema);
        /**
         * @summary The array of column schema objects.
         * @name schema
         * @type {columnSchemaObject[]}
         * @memberOf dataModels.JSON.prototype
         */
        this._schema = schema;
    }

});

// LOCAL METHODS -- to be called with `.call(this`

function setInternalColSchema(schema) {
    if (!schema[this.grid.behavior.treeColumnIndex]) {
        schema[this.grid.behavior.treeColumnIndex] = {name: 'Tree', header: 'Tree'}; //Tree Column
    }
    if (!schema[this.grid.behavior.rowColumnIndex]) {
        schema[this.grid.behavior.rowColumnIndex] = {name: '', header: ''}; //Row Handle Column
    }
    return schema;
}
/**
 * @private
 * @param {string} propName
 * @this DataModel#
 * @returns {Array}
 * @memberOf dataModels.JSON~
 */
function getSchemaPropArr(propName, deprecatedMethodName) {
    this.deprecated(deprecatedMethodName, deprecatedMethodName + '() has been deprecated as of v1.2.0 and will be removed in a future release. Constructs like ' + deprecatedMethodName + '()[i] should be changed to schema[i]. (This deprecated method now returns a new array derived from schema.)');
    return this.schema.map(function(columnSchema) {
        return columnSchema[propName];
    }, this);
}

module.exports = JSON;
