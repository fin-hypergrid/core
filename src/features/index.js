'use strict';

var Registry = require('../lib/Registry');


/**
 * @classdesc Registry of feature constructors.
 * @param {boolean} [privateRegistry=false] - This instance will use a private registry.
 * @constructor
 */
var Features = Registry.extend('Features', {

    BaseClass: require('./Feature'), // abstract base class

    items: {}, // shared feature registry (when !options.private)

    initialize: function(options) {
        // preregister the standard cell renderers
        if (options && options.private || !this.items.cellclick) {
            this.add(require('./CellClick'));
            this.add(require('./CellEditing'));
            this.add(require('./CellSelection'));
            this.add(require('./ColumnMoving'));
            this.add(require('./ColumnResizing'));
            this.add(require('./ColumnSelection'));
            this.add(require('./ColumnSorting'));
            this.add(require('./Filters'));
            this.add(require('./KeyPaging'));
            this.add(require('./OnHover'));
            // this.add(require('./RowResizing'));
            this.add(require('./RowSelection'));
            this.add(require('./ThumbwheelScrolling'));
        }
    }

});

Features.add = Registry.prototype.add.bind(Features);


// Following shared props provided solely in support of build file usage, e.g., `fin.Hypergrid.features.yada`,
// and are not meant to be used elsewhere.

Features.Feature = require('./Feature'); // abstract base class
Features.CellClick = require('./CellClick');
Features.CellEditing = require('./CellEditing');
Features.CellSelection = require('./CellSelection');
Features.ColumnMoving = require('./ColumnMoving');
Features.ColumnResizing = require('./ColumnResizing');
Features.ColumnSelection = require('./ColumnSelection');
Features.ColumnSorting = require('./ColumnSorting');
Features.Filters = require('./Filters');
Features.KeyPaging = require('./KeyPaging');
Features.OnHover = require('./OnHover');
// Features.RowResizing = require('./RowResizing');
Features.RowSelection = require('./RowSelection');
Features.ThumbwheelScrolling = require('./ThumbwheelScrolling');


module.exports = Features;
