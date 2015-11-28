'use strict';

var DataNodeBase = require('./DataNodeBase');

var DataNodeLeaf = DataNodeBase.extend('DataNodeLeaf', {

    prune: function(depth) {
        this.depth = depth;
        this.data[0] = this.computeDepthString();
    },

    getIndex: function() {
        return this.index;
    },

    buildView: function(aggregator) {
        aggregator.addView(this);
    },

    computeHeight: function() {
        return 1;
    }

});

module.exports = DataNodeLeaf;