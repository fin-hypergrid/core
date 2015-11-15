'use strict';

var DataNodeGroup = require('./DataNodeGroup');

var DataNodeTree = DataNodeGroup.extend({

    initialize: function(key) { // eslint-disable-line no-unused-vars
        this.height = 0;
        this.expanded = true;
    },

    prune: function() {
        this.children = this.children.values;
        this.children.forEach(function(child) {
            child.prune(0);
        });
    },

    buildView: function(aggregator) {
        this.children.forEach(function(child) {
            child.buildView(aggregator);
        });
    },

    computeHeight: function() {
        var height = 1;

        this.children.forEach(function(child) {
            height = height + child.computeHeight();
        });

        return (this.height = height);
    }

});

module.exports = DataNodeTree;