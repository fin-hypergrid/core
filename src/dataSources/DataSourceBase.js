'use strict';

DataSourceBase.extend = require('extend-me');

function DataSourceBase() {}

DataSourceBase.prototype = {
    constructor: DataSourceBase.prototype.constructor,

    replaceIndent: '_',

    isNullObject: true,

    getProperty: function getProperty(propName) {
        if (propName in this) {
            return this[propName];
        }

        if (this.dataSource) {
            return getProperty.call(this.dataSource, propName);
        }
    },
    getDataIndex: function(y) {
        return 0;
    },
    getRow: function() {
        return null;
    },
    findRow: function(columnName, value) {
        if (this.dataSource) {
            return this.dataSource.findRow.apply(this.dataSource, arguments);
        }
    },
    revealRow: function() {
        if (this.dataSource) {
            return this.dataSource.revealRow.apply(this.dataSource, arguments);
        }
    },
    getValue: function(x, y){
        return 0;
    },
    setValue: function(x, y, value){},
    getRowCount: function() {
        return 0;
    },
    getColumnCount: function() {
        return 0;
    },
    getFields: function() {
        return [];
    },
    getHeaders: function() {
        if (this.dataSource) {
            return this.dataSource.getHeaders.apply(this.dataSource, arguments);
        }
    },
    getCalculators: function(){
        return [];
    },
    getDefaultHeaders: function(){
        return [];
    },
    setFields: function(arr) {},
    setHeaders: function(arr) {},
    getGrandTotals: function(row){
        return [];
        //row: Ideally this should be set and get bottom/top totals
        //Currently this function is just sending the same for both in aggregations
    },
    setData: function(arr) {},
    click: function() {
        if (this.dataSource) {
            return this.dataSource.click.apply(this.dataSource, arguments);
        }
    },
    apply: function() {},
    viewMakesSense: function() {
        return false;
    },

    /**
     * Get new object with name and index given the name or the index.
     * @param {string|number} [column] - Column name or index.
     * @param {string} [defaultName] - Name to use when column is omitted or undefined. May be omitted when column is definitely defined.
     * @returns {{name: string, index: number}}
     */
    getColumnInfo: function(column, defaultName) {
        var name, index;
        if (column === undefined) {
            column = defaultName;
        }
        if (typeof column === 'number') {
            name = this.getFields()[index = column];
        } else {
            index = this.getFields().indexOf(name = column);
        }
        if (name && index >= 0) {
            return {
                name: name,
                index: index
            };
        }
    },

    fixIndentForTableDisplay: function(string) {
        var count = string.search(/\S/);
        var end = string.substring(count);
        var result = Array(count + 1).join(this.replaceIndent) + end;
        return result;
    },

    dump: function(max) {
        max = Math.min(this.getRowCount(), max || Math.max(100, this.getRowCount()));
        var data = [];
        var fields = this.getHeaders();
        var cCount = this.getColumnCount();
        var viewMakesSense = this.viewMakesSense;
        for (var r = 0; r < max; r++) {
            var row = {};
            for (var c = 0; c < cCount; c++) {
                var val = this.getValue(c, r);
                if (c === 0 && viewMakesSense) {
                    val = this.fixIndentForTableDisplay(val);
                }
                row[fields[c]] = val;
            }
            data[r] = row;
        }
        console.table(data);
    }
};

module.exports = DataSourceBase;
