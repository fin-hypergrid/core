'use strict';

var _ = require('object-iterators');

var DataSourceSorter = require('./DataSourceSorter');
var DataNodeTree = require('./DataNodeTree');
var DataNodeGroup = require('./DataNodeGroup');
var DataNodeLeaf = require('./DataNodeLeaf');
var headerify = require('./util/headerify');

//?[t,c,b,a]
// t is a dataSource,
// a is a dictionary of aggregates,  columnName:function
// b is a dictionary of groupbys, columnName:sourceColumnName
// c is a list of constraints,

function DataSourceAggregator(dataSource) {
    this.dataSource = dataSource;
    this.tree = new DataNodeTree('Totals');
    this.index = [];
    this.aggregates = [];
    this.headers = [];
    this.groupBys = [];
    this.view = [];
    this.sorterInstance = {};
    this.presortGroups = true;
    this.lastAggregate = {};
    this.setAggregates({});
}

DataSourceAggregator.prototype = {
    constructor: DataSourceAggregator.prototype.constructor, // preserve constructor

    isNullObject: false,

    setAggregates: function(aggregations) {
        this.lastAggregate = aggregations;
        this.clearAggregations();
        this.headers.length = 0;

        if (this.hasGroups()) {
            this.headers.push('Tree');
        }

        var self = this;
        _(aggregations).each(function(aggregation, key) {
            self.addAggregate(key, aggregation);
        });
    },

    addAggregate: function(label, func) {
        this.headers.push(headerify(label));
        this.aggregates.push(func);
    },

    setGroupBys: function(columnIndexArray) {
        var groupBys = this.groupBys;
        groupBys.length = 0;
        columnIndexArray.forEach(function(columnIndex) {
            groupBys.push(columnIndex);
        });
        this.setAggregates(this.lastAggregate);
    },

    addGroupBy: function(index) {
        this.groupBys.push(index);
    },

    hasGroups: function() {
        return !!this.groupBys.length;
    },

    hasAggregates: function() {
        return !!this.aggregates.length;
    },

    apply: function() {
        this.buildGroupTree();
    },

    clearGroups: function() {
        this.groupBys.length = 0;
    },

    clearAggregations: function() {
        this.aggregates.length = 0;
        this.headers.length = 0;
    },

    buildGroupTree: function() {
        var groupBys = this.groupBys,
            leafDepth = groupBys.length - 1,
            source = this.dataSource,
            rowCount = source.getRowCount(),
            tree = this.tree = new DataNodeTree('Totals');

        // first sort data
        if (this.presortGroups) {
            groupBys.reverse().forEach(function(groupBy) {
                source = new DataSourceSorter(source);
                source.sortOn(groupBy);
            });
        }

        for (var r = 0; r < rowCount; r++) {
            var path = tree;

            groupBys.forEach(function(g, c) { // eslint-disable-line no-loop-func
                var key = source.getValue(g, r),
                    terminalNode = (c === leafDepth),
                    Constructor = terminalNode ? DataNodeLeaf : DataNodeGroup,
                    ifAbsentFunc = createNode.bind(this, Constructor);
                path = path.children.getIfAbsent(key, ifAbsentFunc);
            });

            path.index.push(r);
        }

        this.sorterInstance = new DataSourceSorter(source);
        tree.prune();
        tree.computeAggregates(this);
        this.buildView();
    },

    addView: function(dataNode) {
        this.view.push(dataNode);
    },

    buildView: function() {
        this.view.length = 0;
        this.tree.computeHeight();
        this.tree.buildView(this);
    },

    viewMakesSense: function() {
        return this.hasAggregates();
    },

    getValue: function(x, y) {
        if (!this.viewMakesSense()) {
            return this.dataSource.getValue(x, y);
        }
        var row = this.view[y];
        if (!row) {
            return null;
        }
        return row.getValue(x); // TODO: what kind of object is row... ? should it be unfiltred?
    },

    setValue: function(x, y, value) {
        if (!this.viewMakesSense()) {
            return this.dataSource.setValue(x, y, value);
        }
    },

    getColumnCount: function() {
        if (!this.viewMakesSense()) {
            return this.dataSource.getColumnCount();
        }
        return this.getHeaders().length;
    },

    getRowCount: function() {
        if (!this.viewMakesSense()) {
            return this.dataSource.getRowCount();
        }
        return this.view.length; //header column
    },

    click: function(y) {
        var group = this.view[y];
        group.toggleExpansionState(this);
        this.buildView();
    },

    getHeaders: function() {
        if (!this.viewMakesSense()) {
            return this.dataSource.getHeaders();
        }
        return this.headers; // TODO: Views override dataSource headers with their own headers?
    },

    setHeaders: function(headers) {
        this.dataSource.setHeaders(headers);
    },

    getFields: function() {
        return this.dataSource.getFields();
    },

    setFields: function(fields) {
        return this.dataSource.setFields(fields);
    },

    getGrandTotals: function() {
        var view = this.tree;
        return [view.data];
    },

    getRow: function(y) {
        if (!this.viewMakesSense()) {
            return this.dataSource.getRow(y);
        }

        var rollups = this.view[y];

        return rollups ? rollups : this.tree;
    },

    setData: function(arrayOfUniformObjects) {
        this.dataSource.setData(arrayOfUniformObjects);
        this.apply();
    }
};

function createNode(DataNodeConstructor, key, map) {
    var value = new DataNodeConstructor(key);
    map.set(key, value);
    return value;
}

module.exports = DataSourceAggregator;