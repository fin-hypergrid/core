'use strict';

var dataModels = require('../dataModels');

/** @typedef subgridConstructorRef
 * @summary Type definition.
 * @desc One of:
 * * **`function` type** - Assumed to already be a data model constructor.
 * * **`string` type** - The name of a data model "class" (constructor) registered in the {@link src/dataModels} namespace. Used to look up the constructor in the namespace.
 */

/** @typedef subgridSpec
 * @summary Type definition.
 * @desc One of:
 * * **`object` type** _(except when an array)_ - Assumed to be a reference to an already-instantiated data model. Used as is.
 * * **`'data'` special value** - Set to the data subgrid (_i.e.,_ the behavior's already-instantiated data model).
 * * **{@link subgridConstructorRef}** _(see)_ - The constructor ref is resolved and called with the `new` keyword + a reference to the grid as the sole parameter.
 * * **`Array` object** — Accommodates data model constructor arguments. The constructor ref is resolved and called with the `new` keyword + a reference to the grid as the first parameter + the remaining elements as additional parameters. (If you don't have remaining elements, don't give an array here; just provide a simple `subgridConstructorRef` instead.) The array should have two or more elements:
 *   * The first element is a {@link subgridConstructorRef}.
 *   * Remaining elements are used as additional parameters to the constructor.
 */

module.exports = {
    /**
     * An array where each element represents a subgrid to be rendered in the hypergrid.
     *
     * The list should always include at least one "data" subgrid, typically {@link Behavior#dataModel|dataModel}.
     * It may also include zero or more other types of subgrids such as header, filter, and summary subgrids.
     *
     * This object also sports a dictionary of subgrids in `lookup` property where each dictionary key is one of:
     * * **`subgrid.name`** (for those that have a defined name, which is presumed to be unique)
     * * **`subgrid.type`** (not unique, so if you plan on having multiple, name them!)
     * * **`'data'`** for the (one and only) data subgrid when unnamed (note that data subgrids have no `type`)
     *
     * The setter:
     * * "Enlivens" any constructors (see {@link Behavior~createSubgrid|createSubgrid} for details).
     * * Reconstructs the dictionary.
     * * Calls {@link Behavior#shapeChanged|shapeChanged()}.
     *
     * @param {subgridSpec[]} subgridSpecs
     *
     * @type {dataModelAPI[]}
     *
     * @memberOf Behavior#
     */
    set subgrids(subgridSpecs) {
        var subgrids = this._subgrids = [];

        subgrids.lookup = {};

        subgridSpecs.forEach(function(spec) {
            if (spec) {
                subgrids.push(this.createSubgrid(spec));
            }
        }, this);

        this.shapeChanged();
    },
    get subgrids() {
        return this._subgrids;
    },

    /**
     * @summary Maps a `subgridSpec` to a data model.
     * @desc The spec may describe either an existing data model, or a constructor for a new data model.
     * @param {subgridSpec} spec
     * @returns {dataModelAPI} A data model.
     * @memberOf Behavior#
     */
    createSubgrid: function(spec, args) {
        var subgrid, Constructor, variableArgArray;

        if (spec === 'data') {
            subgrid = this.dataModel;
        } else if (spec instanceof Array && spec.length) {
            Constructor = derefSubgridRef.call(this, spec[0]);
            variableArgArray = spec.slice(1);
            subgrid = this.createApply(Constructor, variableArgArray, this.grid);
        } else if (typeof spec === 'object') {
            subgrid = spec;
        } else {
            Constructor = derefSubgridRef.call(this, spec);
            variableArgArray = Array.prototype.slice.call(arguments, 1);
            subgrid = this.createApply(Constructor, variableArgArray, this.grid);
        }

        // undefined type is data
        subgrid.type = subgrid.type || 'data';

        // make dictionary lookup entry
        var key = subgrid.name || subgrid.type;
        this._subgrids.lookup[key] = this._subgrids.lookup[key] || subgrid; // only save first with this key

        // make isType boolean
        subgrid['is' + subgrid.type[0].toUpperCase() + subgrid.type.substr(1)] = true;

        return subgrid;
    },

    /**
     * @summary Gets the number of "header rows".
     * @desc Defined as the sum of all rows of all subgrids before the (first) data subgrid.
     * @memberOf behaviors.JSON.prototype
     */
    getHeaderRowCount: function() {
        var result = 0;

        this.subgrids.find(function(subgrid) {
            if (subgrid.isData) {
                return true; // stop
            }
            result += subgrid.getRowCount();
        });

        return result;
    }
};

/**
 * @summary Resolves a subgrid constructor reference.
 * @desc The ref is resolved to a data model constructor.
 * @this {Behavior}
 * @param {subgridConstructorRef} ref
 * @returns {DataModel} A data model constructor.
 * @memberOf Behavior~
 */
function derefSubgridRef(ref) {
    var Constructor;
    switch (typeof ref) {
        case 'string':
            Constructor = dataModels[ref];
            break;
        case 'function':
            Constructor = ref;
            break;
        default:
            throw new this.HypergridError('Expected subgrid ref to be registered name or constructor, but found ' + typeof ref + '.');
    }
    return Constructor;
}
