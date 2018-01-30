'use strict';

var Registry = require('../lib/Registry');


var warnedBaseClass;

/**
 * @classdesc Registry of cell editor constructors.
 * @param {Hypergrid} options.grid
 * @param {boolean} [options.private=false] - This instance will use a private registry.
 * @constructor
 */
var CellEditors = Registry.extend('CellEditors', {

    BaseClass: require('./CellEditor'), // abstract base class

    items: {}, // shared cell editor registry (when !options.private)

    initialize: function(options) {
        // preregister the standard cell editors
        if (options && options.private || !this.items.celleditor) {
            this.add(require('./Color'));
            this.add(require('./Date'));
            this.add(require('./Number'));
            this.add(require('./Slider'));
            this.add(require('./Spinner'));
            this.add(require('./Textfield'));
        }
    },

    construct: function(Constructor, options) {
        return new Constructor(this.options.grid, options);
    },

    get: function(name) {
        if (name && name.toLowerCase() === 'celleditor') {
            if (!warnedBaseClass) {
                console.warn('grid.cellEditors.get("' + name + '") method call has been deprecated as of v2.1.0 in favor of grid.cellEditors.BaseClass property. (Will be removed in a future release.)');
                warnedBaseClass = true;
            }
            return this.BaseClass;
        }
        return this.super.get.call(this, name);
    }

});

CellEditors.add = Registry.prototype.add.bind(CellEditors);

module.exports = CellEditors;
