'use strict';

var SummarySubgrid = require('./js/SummarySubgrid');

var totalsToolkit = {
    preinstall: function(HypergridPrototype, BehaviorPrototype) {

        HypergridPrototype.mixIn(require('./mix-ins/grid'));
        BehaviorPrototype.mixIn(require('./mix-ins/behavior'));

        if (!BehaviorPrototype.dataModels.SummarySubgrid) {

            // Register in case a subgrid list is included in state object
            BehaviorPrototype.dataModels.SummarySubgrid = SummarySubgrid;

            // Add to default subgrid list in case no subgrid list is included in state object
            var specs = BehaviorPrototype.defaultSubgridSpecs;
            specs.splice(specs.indexOf('data'), 0, [SummarySubgrid, { name: 'topTotals' }]);
            specs.splice(specs.indexOf('data') + 1, 0, [SummarySubgrid, { name: 'bottomTotals' }]);

        }

    }
};

module.exports = totalsToolkit;
