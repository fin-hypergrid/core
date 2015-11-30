'use strict';

var DataNodeBase = require('./DataNodeBase');

module.exports = (function() {

    function DataNodeLeaf(key) {
        DataNodeBase.call(this, key);
    }

    DataNodeLeaf.prototype = Object.create(DataNodeBase.prototype);

    DataNodeLeaf.prototype.prune = function(depth) {
        this.depth = depth;
        this.data[0] = this.computeDepthString();
    };

    DataNodeLeaf.prototype.computeHeight = function() {
        return 1;
    };

    DataNodeLeaf.prototype.getAllRowIndexes = function() {
        return this.rowIndexes;
    };

    DataNodeLeaf.prototype.computeAggregates = function(aggregator) {
        this.applyAggregates(aggregator);
    };

    DataNodeLeaf.prototype.buildView = function(aggregator) {
        aggregator.view.push(this);
    };

    return DataNodeLeaf;

})();