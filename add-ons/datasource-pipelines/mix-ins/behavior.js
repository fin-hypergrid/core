'use strict';

/* globals fin */

var cellEventFactory = fin.Hypergrid.require('fin-hypergrid/src/lib/cellEventFactory');

module.exports = {

    initialize: function(grid, options) {
        this.setData(options);
        if (options.pipeline) {
            this.setPipeline(options.pipeline);
        }
    },

    /**
     * @see {@link dataModels.JSON#setPipeline}
     * @param {object} [DataSources] - New pipeline description. _(See {@link dataModels.JSON#setPipeline}.)_
     * @param {object} [options] - Takes first argument position when `DataSources` omitted. _(See {@link dataModels.JSON#setPipeline}.)_
     * @param {boolean} [options.apply=true] Apply data transformations to the new data.
     * @memberOf behaviors.JSON.prototype
     */
    setPipeline: function(DataSources, options) {
        this.dataModel.setPipeline.apply(this.dataModel, arguments);

        if (!Array.isArray(DataSources)) {
            options = DataSources;
        }

        if (!options || options.apply === undefined || options.apply) {
            this.reindex();
        }
    },

    /**
     * Pop pipeline stack.
     * @see {@link dataModels.JSON#unstashPipeline}
     * @param {string} [whichStash]
     * @param {object} [options] - Takes first argument position when `DataSources` omitted.
     * @param {boolean} [options.apply=true] Apply data transformations to the new data.
     * @memberOf behaviors.JSON.prototype
     */
    unstashPipeline: function(stash, options) {
        if (typeof stash === 'object') {
            options = stash;
            stash = undefined;
        }

        this.dataModel.unstashPipeline(stash);

        if (!options || options.apply === undefined || options.apply) {
            this.reindex();
        }
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the data field.
     * @param {function|object[]} [dataRows=options.data] - Array of uniform data row objects or function returning same.
     * @param {object} [options] - Takes first argument position when `dataRows` omitted.
     * @param {function|object} [options.data] - Array of uniform data row objects or function returning same.
     * Passed as 1st param to {@link dataModel.JSON#setData}. If falsy, method aborted.
     * @param {function|object} [options.fields] - Array of field names or function returning same.
     * Passed as 2nd param to {@link dataModel.JSON#setData}.
     * @param {function|object} [options.calculators] - Array of calculators or function returning same.
     * Passed as 3rd param to {@link dataModel.JSON#setData}.
     * @param {boolean} [options.apply=true] Apply data transformations to the new data.
     */
    setData: function(dataRows, options) {
        if (!(Array.isArray(dataRows) || typeof dataRows === 'function')) {
            options = dataRows;
            dataRows = options && options.data;
        }

        dataRows = this.unwrap(dataRows);

        if (dataRows === undefined) {
            return;
        }

        if (!Array.isArray(dataRows)) {
            throw 'Expected data to be an array (of data row objects).';
        }

        options = options || {};

        var grid = this.grid,
            schema = this.unwrap(options.schema), // *always* define a new schema on reset
            schemaChanged = schema || !this.subgrids.lookup.data.schema.length, // schema will change if a new schema was provided OR data model has an empty schema now, which triggers schema generation on setData below
            reindex = options.apply === undefined || options.apply; // defaults to true

        // Inform interested data models of data.
        this.subgrids.forEach(function(dataModel) {
            if (dataModel.setData && !dataModel.hasOwnData) {
                dataModel.setData(dataRows, schema);
            }
        });

        if (grid.cellEditor) {
            grid.cellEditor.cancelEditing();
        }

        if (reindex) {
            this.reindex();
        }

        if (schemaChanged) {
            this.createColumns();
        }

        grid.allowEvents(this.dataModel.getRowCount() > 0);
    },

    /**
     * @param {object} [options]
     * @param {object} [options.pipeline] - Consumed by {@link dataModels.JSON#reset}.
     *
     * If omitted, previously established pipeline is reused.
     * @param {object} [options.controllers] - Consumed by {@link dataModels.JSON#reset}.
     *
     * If omitted, previously established controllers list is reused.
     * @memberOf Behavior#
     */
    reset: function(options) {
        if (this.dataModel) {
            options = options || {};
            this.dataModel.reset({
                pipeline: options.pipeline,
                controllers: options.controllers
            });
        } else {
            /**
             * @type {dataModelAPI}
             * @memberOf Behavior#
             */
            this.dataModel = this.getNewDataModel(options);

            // recreate `CellEvent` class so it can set up its internal `grid`, `behavior`, and `dataModel` convenience properties
            this.CellEvent = cellEventFactory(this.grid);
        }

        this.scrollPositionX = this.scrollPositionY = 0;

        this.clearColumns();
        this.createColumns();

        /**
         * Ordered list of subgrids to render.
         * @type {subgridSpec[]}
         * @memberOf Hypergrid#
         */
        this.subgrids = options.subgrids || this.subgrids || this.defaultSubgridSpecs;
    },
    /**
     * @memberOf Behavior#
     */
    reindex: reindex,
    applyAnalytics: reindex,

    /**
     * @summary Get the given data controller.
     * @param {string} type
     * @returns {undefined|*} The data controller; or `undefined` if data controller unknown to data model.
     * @memberOf Behavior#
     */
    getController: function(type) {
        return this.dataModel.getController(type);
    },

    /**
     * @summary Set the given data controller(s).
     * @desc Triggers a shape change.
     * @param {string} typeOrHashOfTypes - One of:
     * * **object** - Hash of multiple data controllers, by type.
     * * **string** - Type of the single data controller given in `controller`.
     * @param {dataControlInterface} [controller] - Only required when 'hash' is a string; omit when `hash` is an object.
     * @returns {object} - Hash of all results, by type. Each member will be:
     * * The given data controller for that type when defined.
     * * A new "null" data controller, generated by the data model when the given data controller for that type was `undefined`.
     * * `undefined` - The data controller was unknown to the data model..
     * @memberOf Behavior#
     */
    setController: function(typeOrHashOfTypes, controller) {
        var results = this.dataModel.setController(typeOrHashOfTypes, controller);
        this.changed();
        return results;
    },

    prop: function(type, columnIndex, keyOrHash, value) {
        var result = this.dataModel.prop.apply(this.dataModel, arguments);
        if (result === undefined) {
            this.changed();
        }
        return result;
    },

    get charMap() {
        return this.dataModel.charMap;
    },

    getUnfilteredValue: function(x, y) {
        var column = this.getActiveColumn(x);
        return column && column.getUnfilteredValue(y);
    },

    getIndexedData: function() {
        this.dataModel.getIndexedData();
    }
};

function reindex() {
    this.dataModel.reindex();
    this.shapeChanged();
}

