'use strict';

/*globals fin window*/

// Create the `datasaur` namespace and the `datasaur.base` object for use by data sources included via <script> tags:
(window.datasaur = window.datasaur || {}).base = require('fin-hypergrid-data-source-base');

var DataSourcePipelines = {
    preinstall: function(HypergridPrototype, BehaviorPrototype) {
        HypergridPrototype.mixIn(require('./mix-ins/grid'));
        fin.Hypergrid.behaviors.JSON.prototype.mixIn(require('./mix-ins/behavior'));
        fin.Hypergrid.dataModels.JSON.prototype.mixIn(require('./mix-ins/dataModel'));
        fin.Hypergrid.behaviors.Column.prototype.mixIn(require('./mix-ins/column'));
    }
};

module.exports = DataSourcePipelines;
