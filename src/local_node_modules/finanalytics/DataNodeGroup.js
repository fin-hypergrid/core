'use strict';

var Map = require('./util/Mappy');
var DataNodeBase = require('./DataNodeBase');

var expandedMap = {
    true: '\u25be', // '▾'
    false: '\u25b8' // '▸'
};

var DataNodeGroup = DataNodeBase.extend({

    extendable: true,

    initialize: function(key) { // eslint-disable-line no-unused-vars
        this.children = new Map();
    },

    prune: function(depth) {
        this.depth = depth;
        this.children = this.children.values; // TODO: why?
        this.children.forEach(function(child) {
            child.prune(depth + 1);
        });
        this.data[0] = this.computeDepthString();
    },

    computeDepthString: function() {
        return Array(this.depth + 1).join(this.INDENT) +
            expandedMap[this.expanded] + ' ' +
            this.label;
    },

    getIndex: function() {
        if (this.index.length === 0) {
            this.index = this.computeIndex();
        }
        return this.index;
    },

    computeIndex: function() { // TODO: formerly computerAllRowIndexes
        var result = [];
        result.append = append;
        this.children.forEach(function(child) {
            result.append(child.getIndex());
        });
        return result;
    },

    toggleExpansionState: function(aggregator) { /* aggregator */
        this.expanded = !this.expanded;
        this.data[0] = this.computeDepthString();
        if (this.expanded) {
            this.computeAggregates(aggregator);
        }
    },

    computeAggregates: function(aggregator) {
        this.super.computeAggregates.call(aggregator);
        if (this.expanded) {
            this.children.forEach(function(child) {
                child.computeAggregates(aggregator);
            });
        }
    },

    buildView: function(aggregator) {
        aggregator.view.push(this);
        if (this.expanded) {
            this.children.forEach(function(child) {
                child.buildView(aggregator);
            });
        }
    },

    computeHeight: function() {
        var height = 1;

        if (this.expanded) {
            this.children.forEach(function(child) {
                height = height + child.computeHeight();
            });
        }

        return (this.height = height);
    }

});

/**
 * @summary Array mixin to append another array to end of `this` one.
 * @desc Appends in place, unlike `this.concat()` which creates a new array.
 * Uses less memory than concat, important when `appendix` is huge.
 * > CAUTION: Mutates `this` array!
 * @param {Array} appendix
 * @returns {Array} Reference to `this` (for convenience)
 */
function append(appendix) {
    this.splice.bind(this, this.length, 0).apply(this, appendix);
    return this;
}

module.exports = DataNodeGroup;