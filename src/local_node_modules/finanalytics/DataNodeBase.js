'use strict';

var extend = require('./util/extend');

function DataNodeBase(key) {
    this.initialize(key);
}

DataNodeBase.extend = extend;

DataNodeBase.prototype = {

    constructor: DataNodeBase.prototype.constructor, // preserve constructor

    isNullObject: false,

    INDENT: '   ', // 3 spaces

    initialize: function(key) {
        this.label = key;
        this.data = ['']; // TODO: Why is this first element needed?
        this.index = []; // TODO: formerly rowIndex
        this.hasChildren = false; // TODO: Where/how is this used?
        this.depth = 0;
        this.height = 1;
        this.expanded = false;
    },

    getValue: function(x) {
        return this.data[x];
    },

    prune: function(depth) {
        this.depth = depth;
        this.data[0] = this.computeDepthString();
    },

    computeDepthString: function() {
        return Array(this.depth + 1).join(this.INDENT) + '  ' + this.label;
    },

    computeHeight: function() {
        return 1;
    },

    getIndex: function() { // TODO: formerly getAllRowIndexes
        return this.index;
    },

    computeAggregates: function(aggregator) {
        var index = this.getIndex();

        if (index.length) {
            var groupsOffset = Number(aggregator.hasGroups());

            // redimension the data
            var data = this.data;
            data.length = groupsOffset + aggregator.aggregates.length;

            var sorter = aggregator.sorterInstance;
            sorter.index = index;

            aggregator.aggregates.forEach(function(aggregate, i) {
                data[groupsOffset + i] = aggregate(sorter);
            });
        }
    },

    buildView: function(aggregator) {
        aggregator.addView(this);
    },

    toggleExpansionState: function() { /* aggregator */
        //do nothing by default
    }

};

//DataNodeBase.prototype.applyAggregates = DataNodeBase.prototype.computeAggregates;

module.exports = DataNodeBase;