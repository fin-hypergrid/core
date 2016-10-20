'use strict';

var totalsToolkit = {
    preinstall: function(Hypergrid) {
        Hypergrid.mixIn(require('./mix-ins/grid'));

        var Behavior = Hypergrid.constructor.behaviors.Behavior;
        Behavior.prototype.mixIn(require('./mix-ins/behavior'));
    }
};

module.exports = totalsToolkit;
