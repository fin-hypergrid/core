'use strict';

var Registry = require('../lib/Registry');


var warnedBaseClass;

/**
 * @classdesc Registry of cell renderer singletons.
 * @constructor
 */
var CellRenderers = Registry.extend('CellRenderers', {

    BaseClass: require('./CellRenderer'), // abstract base class

    initialize: function() {
        // preregister the standard cell renderers
        this.add(require('./Button'));
        this.add(require('./SimpleCell'));
        this.add(require('./SliderCell'));
        this.add(require('./SparkBar'));
        this.add(require('./LastSelection'));
        this.add(require('./SparkLine'));
        this.add(require('./ErrorCell'));
        this.add(require('./Tag'));
        this.add(require('./TreeCell'));
        this.add('emptycell', this.BaseClass); // remove this when deprecation below retired
    },

    // for better performance, instantiate at add time rather than render time.
    add: function(name, Constructor) {
        if (arguments.length === 1) {
            Constructor = name;
            return Registry.prototype.add.call(this, new Constructor);
        } else {
            return Registry.prototype.add.call(this, name, new Constructor);
        }
    },

    get: function(name) {
        if (name.map) {
            return name.map(function(name) {
                return Registry.prototype.get.call(this, name);
            }, this);
        }

        var cellRenderer = Registry.prototype.get.call(this, name);
        if (cellRenderer === this.items.emptycell) {
            if (!warnedBaseClass) {
                console.warn('grid.cellRenderers.get("' + name + '").constructor has been deprecated as of v2.1.0 in favor of grid.cellRenderers.BaseClass property. (Will be removed in a future release.)');
                warnedBaseClass = true;
            }
            this.BaseClass.constructor = this.BaseClass;
        }
        return cellRenderer;
    }

});

module.exports = new CellRenderers;
