'use strict';

var DataSourceSorter = require('./DataSourceSorter');
var DataNodeTree = require('./DataNodeTree');
var DataNodeGroup = require('./DataNodeGroup');
var DataNodeLeaf = require('./DataNodeLeaf');

module.exports = (function() {

    var headerify = function(string) {
        var pieces = string.replace(/[_-]/g, ' ').replace(/[A-Z]/g, ' $&').split(' ').map(function(s) {
            return (s.charAt(0).toUpperCase() + s.slice(1)).trim();
        });
        pieces = pieces.filter(function(e) {
            return e.length !== 0;
        });
        return pieces.join(' ').trim();
    };

    //?[t,c,b,a]
    // t is a dataSource,
    // a is a dicitionary of aggregates,  columnName:function
    // b is a dicitionary of groupbys, columnName:sourceColumnName
    // c is a list of constraints,

    function DataSourceAggregator(dataSource) {
        this.tree = new DataNodeTree('Totals');
        this.indexes = [];
        this.dataSource = dataSource;
        this.aggregates = [];
        this.headers = [];
        this.groupBys = [];
        this.view = [];
        this.sorterInstance = {};
        this.presortGroups = true;
        this.lastAggregate = {};
        this.setAggregates({});
    }

    DataSourceAggregator.prototype.isNullObject = false;

    DataSourceAggregator.prototype.setAggregates = function(aggregations) {
        this.lastAggregate = aggregations;
        var props = [];
        var i;
        this.clearAggregations();
        this.headers.length = 0;

        for (var key in aggregations) {
            props.push([key, aggregations[key]]);
        }

        // if (props.length === 0) {
        //     var fields = [].concat(this.dataSource.getFields());
        //     for (i = 0; i < fields.length; i++) {
        //         props.push([fields[i], Aggregations.first(i)]); /* jshint ignore:line */
        //     }
        // }
        if (this.hasGroups()) {
            this.headers.push('Tree');
        }

        for (i = 0; i < props.length; i++) {
            var agg = props[i];
            this.addAggregate(agg[0], agg[1]);
        }
    };

    DataSourceAggregator.prototype.addAggregate = function(label, func) {
        this.headers.push(headerify(label));
        this.aggregates.push(func);
    };

    DataSourceAggregator.prototype.setGroupBys = function(columnIndexArray) {
        this.groupBys.length = 0;
        for (var i = 0; i < columnIndexArray.length; i++) {
            this.groupBys.push(columnIndexArray[i]);
        }
        this.setAggregates(this.lastAggregate);
    };

    DataSourceAggregator.prototype.addGroupBy = function(index) {
        this.groupBys.push(index);
    };

    DataSourceAggregator.prototype.hasGroups = function() {
        return this.groupBys.length > 0;
    };

    DataSourceAggregator.prototype.hasAggregates = function() {
        return this.aggregates.length > 0;
    };

    DataSourceAggregator.prototype.apply = function() {
        this.buildGroupTree();
    };

    DataSourceAggregator.prototype.clearGroups = function() {
        this.groupBys.length = 0;
    };

    DataSourceAggregator.prototype.clearAggregations = function() {
        this.aggregates.length = 0;
        this.headers.length = 0;
    };

    DataSourceAggregator.prototype.buildGroupTree = function() {
        var c, r, g, value, createFunc;
        var createBranch = function(key, map) {
            value = new DataNodeGroup(key);
            map.set(key, value);
            return value;
        };
        var createLeaf = function(key, map) {
            value = new DataNodeLeaf(key);
            map.set(key, value);
            return value;
        };
        var groupBys = this.groupBys;
        var source = this.dataSource;
        var rowCount = source.getRowCount();

        // lets sort our data first....
        if (this.presortGroups) {
            for (c = 0; c < groupBys.length; c++) {
                g = groupBys[groupBys.length - c - 1];
                source = new DataSourceSorter(source);
                source.sortOn(g);
            }
        }

        var tree = this.tree = new DataNodeTree('Totals');
        var path = tree;
        var leafDepth = groupBys.length - 1;
        for (r = 0; r < rowCount; r++) {
            for (c = 0; c < groupBys.length; c++) {
                g = groupBys[c];
                value = source.getValue(g, r);

                //test that I'm not a leaf
                createFunc = (c === leafDepth) ? createLeaf : createBranch;
                path = path.children.getIfAbsent(value, createFunc);
            }
            path.rowIndexes.push(r);
            path = tree;
        }
        this.sorterInstance = new DataSourceSorter(source);
        tree.prune();
        this.tree.computeAggregates(this);
        this.buildView();
    };

    DataSourceAggregator.prototype.buildView = function() {
        this.view.length = 0;
        this.tree.computeHeight();
        this.tree.buildView(this);
    };

    DataSourceAggregator.prototype.viewMakesSense = function() {
        return this.hasAggregates();
    };

    DataSourceAggregator.prototype.getValue = function(x, y) {
        if (!this.viewMakesSense()) {
            return this.dataSource.getValue(x, y);
        }
        var row = this.view[y];
        if (!row) {
            return null;
        }
        return row.getValue(x);
    };

    DataSourceAggregator.prototype.setValue = function(x, y, value) {
        if (!this.viewMakesSense()) {
            return this.dataSource.setValue(x, y, value);
        }
    };

    DataSourceAggregator.prototype.getColumnCount = function() {
        if (!this.viewMakesSense()) {
            return this.dataSource.getColumnCount();
        }
        var colCount = this.getHeaders().length;
        return colCount;
    };

    DataSourceAggregator.prototype.getRowCount = function() {
        if (!this.viewMakesSense()) {
            return this.dataSource.getRowCount();
        }
        return this.view.length; //header column
    };

    DataSourceAggregator.prototype.click = function(y) {
        var group = this.view[y];
        group.toggleExpansionState(this);
        this.buildView();
    };

    DataSourceAggregator.prototype.getHeaders = function() {
        if (!this.viewMakesSense()) {
            return this.dataSource.getHeaders();
        }
        return this.headers;
    };

    DataSourceAggregator.prototype.setHeaders = function(headers) {
        this.dataSource.setHeaders(headers);
    };

    DataSourceAggregator.prototype.getFields = function() {
        return this.dataSource.getFields();
    };

    DataSourceAggregator.prototype.setFields = function(fields) {
        return this.dataSource.setFields(fields);
    };

    DataSourceAggregator.prototype.getGrandTotals = function() {
        var view = this.tree;
        return [view.data];
    };

    DataSourceAggregator.prototype.getRow = function(y) {

        if (!this.viewMakesSense()) {
            return this.dataSource.getRow(y);
        }

        var rollups = this.view[y];
        if (!rollups) {
            return this.tree;
        }

        return rollups;
    };

    DataSourceAggregator.prototype.setData = function(arrayOfUniformObjects) {
        this.dataSource.setData(arrayOfUniformObjects);
        this.apply();
    };

    return DataSourceAggregator;

})();