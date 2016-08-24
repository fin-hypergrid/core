'use strict';

var Base = require('../lib/Base');

var Null = Base.extend('Null', {
    isNullObject: function() {
        return true;
    },
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
        return null;
    },
    revealRow: function() {},
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
        return [];
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
    click: function() {},
    apply: function() {},
    viewMakesSense: function() {
        return false;
    }
});

module.exports = Null;
