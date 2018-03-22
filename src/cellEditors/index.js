'use strict';

var Registry = require('../lib/Registry');


var warnedBaseClass;

/**
 * @classdesc Registry of cell editor constructors.
 * @constructor
 */
var CellEditors = Registry.extend('CellEditors', {

    BaseClass: require('./CellEditor'), // abstract base class

    initialize: function() {
        // preregister the standard cell editors
        this.add(require('./Color'));
        this.add(require('./Date'));
        this.add(require('./Number'));
        this.add(require('./Slider'));
        this.add(require('./Spinner'));
        this.add(require('./Textfield'));
    },

    get: function(name) {
        if (name && name.toLowerCase() === 'celleditor') {
            if (!warnedBaseClass) {
                console.warn('grid.cellEditors.get("' + name + '") method call has been deprecated as of v2.1.0 in favor of grid.cellEditors.BaseClass property. (Will be removed in a future release.)');
                warnedBaseClass = true;
            }
            return this.BaseClass;
        }
        try {
            var CellEditor = Registry.prototype.get.call(this, name);
        } catch (err) {
            // fail silently
        }
        return CellEditor;
    }

});

module.exports = new CellEditors;
