'use strict';

var Registry = require('../lib/Registry');


var deprecated = {
    emptycell: undefined,
    EmptyCell: undefined
};


/**
 * @classdesc Registry of cell renderer singletons.
 * @param {boolean} [privateRegistry=false] - This instance will use a private registry.
 * @constructor
 */
var CellRenderers = Registry.extend('CellRenderers', {

    BaseClass: require('./CellRenderer'), // abstract base class

    items: {}, // shared cell renderer registry (when !options.private)

    singletons: true,

    initialize: function(options) {
        // preregister the standard cell renderers
        if (options && options.private || !this.items.simplecell) {
            this.add(require('./Button'));
            this.add(require('./SimpleCell'));
            this.add(require('./SliderCell'));
            this.add(require('./SparkBar'));
            this.add(require('./LastSelection'));
            this.add(require('./SparkLine'));
            this.add(require('./ErrorCell'));
            this.add(require('./TreeCell'));
        }
    },

    get: function(name) {
        if (name in deprecated) {
            if (!deprecated.warned) {
                console.warn('grid.cellRenderers.get("' + name + '").constructor has been deprecated as of v2.1.0 in favor of grid.cellRenderers.BaseClass property. (Will be removed in a future release.)');
                deprecated.warned = true;
            }
            this.BaseClass.constructor = this.BaseClass;
            return this.BaseClass;
        }
        return this.super.get.call(this, name);
    }

});

module.exports = CellRenderers;
