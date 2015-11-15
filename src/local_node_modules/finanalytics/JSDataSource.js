'use strict';

module.exports = (function() {

    var headerify = function(string) {
        var pieces = string.replace(/[_-]/g, ' ').replace(/[A-Z]/g, ' $&').split(' ').map(function(s) {
            return s.charAt(0).toUpperCase() + s.slice(1);
        });
        return pieces.join(' ');
    };

    var computeFieldNames = function(object) {
        if (!object) {
            return [];
        }
        var fields = [].concat(Object.getOwnPropertyNames(object).filter(function(e) {
            return e.substr(0, 2) !== '__';
        }));
        return fields;
    };

    function JSDataSource(data, fields) {
        this.fields = fields || computeFieldNames(data[0]);
        this.headers = [];
        this.data = data;
    }

    JSDataSource.prototype.isNullObject = false;

    JSDataSource.prototype.getValue = function(x, y) {
        var row = this.data[y];
        if (!row) {
            return null;
        }
        var value = row[this.fields[x]];
        return value;
    };

    JSDataSource.prototype.getRow = function(y) {

        return this.data[y];
    };

    JSDataSource.prototype.setValue = function(x, y, value) {

        this.data[y][this.fields[x]] = value;
    };

    JSDataSource.prototype.getColumnCount = function() {

        return this.getFields().length;
    };

    JSDataSource.prototype.getRowCount = function() {

        return this.data.length;
    };

    JSDataSource.prototype.getFields = function() {

        return this.fields;
    };

    JSDataSource.prototype.getHeaders = function() {
        if (!this.headers || this.headers.length === 0) {
            this.headers = this.getDefaultHeaders().map(function(each) {
                return headerify(each);
            });
        }
        return this.headers;
    };

    JSDataSource.prototype.getDefaultHeaders = function() {

        return this.getFields();
    };

    JSDataSource.prototype.setFields = function(fields) {

        this.fields = fields;
    };

    JSDataSource.prototype.setHeaders = function(headers) {

        this.headers = headers;
    };

    JSDataSource.prototype.getGrandTotals = function() {
        //nothing here
        return;
    };

    JSDataSource.prototype.setData = function(arrayOfUniformObjects) {
        this.data = arrayOfUniformObjects;
    };

    return JSDataSource;

})();