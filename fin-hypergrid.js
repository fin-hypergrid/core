'use strict';

(function() {
    var root = this;
    Polymer('fin-hypergrid', { /* jshint ignore:line  */
        ready: function() {
            root.fin.wc.hypergrid.Hypergrid(this);
        }
    });
}).call(this);
