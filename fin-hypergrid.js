'use strict';

(function() {
    var root = this;
    Polymer('fin-hypergrid', { /* jshint ignore:line  */
        ready: function() {
            root.fin.wc.hypergrid.Hypergrid(this);
            //this.setBehavior(new root.fin.wc.hypergrid.DefaultGridBehavior());
            this.setBehavior(new root.fin.wc.hypergrid.InMemoryGridBehavior());
            //this.setBehavior(new root.fin.wc.hypergrid.QGridBehavior('ws://' + location.hostname + ':5000/'));
        }
    });
}).call(this);
