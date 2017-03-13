'use strict';

/* globals fin */

var DataModel = fin.Hypergrid.require('fin-hypergrid/src/dataModels/DataModel');

var DataSourceOrigin = require('../DataSourceOrigin');

/** @typedef {object} dataSourcePipelineObject
 * @property {string} type - A "DataSourceOrigin" style constructor name.
 * @property {*} [options] - When defined, passed as 2nd argument to constructor.
 * @property {string} [parent] - Defines a branch off the main sequence.
 */

module.exports = {

    initialize: function(grid, options) {
        /**
         * @summary Hash of controllers.
         * @desc Keyed by data source type.
         * Data controller are only accepted by data sources that have a defined `type` property.
         * @see {@link dataControlInterface}
         * @type {object}
         * @memberOf dataModels.JSON.prototype
         */
        this.controllers = {};

        this.charMap = new CharMap(this);

        this.reset(options);
    },

    /**
     * Override to use a different origin.
     * @type(DataSourceBase}
     * @memberOf dataModels.JSON.prototype
     */
    DataSourceOrigin: DataSourceOrigin,

    /**
     * @type {dataSourcePipelineObject[][]}
     * @summary Pipeline stash push-down list.
     * @desc The pipeline stash may be shared or instanced. This is the shared stash. An instance may override this with an instance stash variable (of the same name). See {@link dataModels.JSON#getPipelineSchemaStash}.
     * @memberOf dataModels.JSON.prototype
     */
    pipelineSchemaStash: [],

    /**
     * @param {object} [options]
     * @param {object} [options.pipeline] - Consumed by {@link dataModels.JSON#setPipeline}.
     * If omitted, previously established pipeline is reused.
     * @param {object} [options.controllers] - Consumed by {@link dataModels.JSON#setPipeline}.
     * If omitted, previously established controllers.
     * @memberOf dataModels.JSON.prototype
     */
    reset: function(options) {
        delete this.pipelineSchemaStash; // remove existing "own" version if any

        options = options || {};
        this.source = new this.DataSourceOrigin(
            options.data,
            options.schema,
            this.grid.behavior.treeColumnIndex,
            this.grid.behavior.rowColumnIndex
        );

        this.setPipeline({
            pipeline: options.pipeline,
            controllers: options.controllers
        });
    },

    /**
     * Application developer should override to set up a default pipeline.
     * @type {pipelineSchema}
     * @memberOf dataModels.JSON.prototype
     */
    defaultPipelineSchema: [],

    getData: function() {
        return this.source.data;
    },

    getIndexedData: function() {
        var ds = this.dataSource;
        var count = ds.getRowCount();
        var result = new Array(count);
        for (var y = 0; y < count; y++) {
            result[y] = ds.getRow(y);
        }
        return result;
    },

    /**
     * @param {number} x - Data column coordinate.
     * @param {number} y - Data row coordinate.
     * @memberOf dataModels.JSON.prototype
     */
    getValue: function(x, y) {
        return this.dataSource.getValue(x, y);
    },

    /**
     * @param {number} y - Data row coordinate.
     * @returns {nunber} Row index in raw data array after dereferencing all data source indexing.
     * @memberOf dataModels.JSON.prototype
     */
    getDataIndex: function(y) {
        return this.dataSource.getDataIndex(y);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} x - Data column coordinate.
     * @param {number} r - Grid row coordinate.
     * @param value
     */
    setValue: function(x, r, value) {
        this.dataSource.setValue(x, r, value);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getColumnCount: function() {
        var offset = this.hasHierarchyColumn() ? -1 : 0;
        return this.dataSource.getColumnCount() + offset;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getRowCount: function() {
        return this.dataSource.getRowCount();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getHeaders: function() {
        return getSchemaPropArr.call(this, 'header', 'getHeaders');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {string[]} headers
     */
    setHeaders: function(headers) {
        this.dataSource.setHeaders(headers);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {string[]} fields
     */
    setFields: function(fields) {
        this.dataSource.setFields(fields);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getFields: function() {
        return getSchemaPropArr.call(this, 'name', 'getFields');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getCalculators: function() {
        return getSchemaPropArr.call(this, 'calculator', 'getCalculators');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    reindex: reindex,

    applyAnalytics: reindex,

    /**
     * @summary Set or reset grid data.
     * See {@link DataSourceOrigin#setData} for details.
     * @memberOf dataModels.JSON.prototype
     */
    setData: function(dataSource, schema) {
        this.source.setData(dataSource, schema);
    },

    /** @typedef {DataSourceBase[]} pipelineSchema
     * @summary Describes a new pipeline.
     * @desc Consists of an ordered list of data source constructors, descendants of `DataSourceBase`.
     * May contain `undefined` elements, which are ignored.
     */

    /**
     * @summary Instantiates the data source pipeline.
     * @desc Each new pipe is created from the list of supplied constructors, each taking a reference to the previous data source in the pipeline.
     *
     * A reference to each new pipe is added to `this.sources` dataModel using the pipe's derived name.
     *
     * Will clear out any filtering and sorting state.
     *
     * The last pipe is assigned the synonym `this.dataSource`.
     * @param {pipelineSchema} [DataSources] - New pipeline description. If not given, uses the default {@link dataModels.JSON#DataSources|this.defaultPipelineSchema}.
     * @param {object} [options] - Takes first argument position when `DataSources` omitted.
     * @param {string} [options.stash] - See {@link dataModels.JSON#getPipelineSchemaStash}. If given, saves the currently defined pipeline onto the indicated stash stack and then resets it with the given `DataSources`.
     * @memberOf dataModels.JSON.prototype
     */
    setPipeline: function(DataSources, options) {
        if (!Array.isArray(DataSources)) {
            options = DataSources;
            DataSources = options.pipeline;
        }

        options = options || {};

        if (DataSources) {
            DataSources = DataSources.slice();
        } else if (this.DataSources) {
            DataSources = this.DataSources;
        } else {
            DataSources = this.defaultPipelineSchema.slice();
        }

        this.DataSources = DataSources;

        var pipeline = [],
            dataSource = this.source;
        if (DataSources.length) {
            if (options.stash) {
                this.getPipelineSchemaStash(options.stash).push(DataSources);
            }

            DataSources.forEach(function(DataSource) {
                if (DataSource) {
                    dataSource = new DataSource(dataSource);
                    pipeline.push(dataSource);
                }
            }, this);
        }
        this.dataSource = dataSource;

        /**
         * @summary Currently defined pipeline.
         * @desc Each instance has its own pipeline.
         * (Pipelines cannot be shared because they contain indexes specific to the data in the grid.)
         * @name pipeline
         * @type {dataSourcePipelineObject[]}
         * @memberOf dataModels.JSON.prototype
         */
        this.pipeline = pipeline;

        this.setController(options.controllers || this.controllers); // set the new or previously set data controller(s) on the new pipeline
    },

    /**
     * Find the last data source in the pipeline of specified type.
     * @param {string} type
     * @returns {DataSourceBase}
     * @memberOf dataModels.JSON.prototype
     */
    findDataSourceByType: function(type) {
        var dataSource;
        for (var i = this.pipeline.length - 1; i >= 0; i--) {
            dataSource = this.pipeline[i];
            if (dataSource.type === type) {
                return dataSource;
            }
        }
    },

    /**
     * @summary The pipeline stash currently in use (either shared or instance).
     * @desc Instance stash is created here when requested and instance doesn't yet have its "own" version.
     * @param {string} [whichStash='default'] - One of:
     * * `'shared'` - Use shared stash.
     * * `'own'' or `'instance'` - Use instance stash, creating it if it does not exist.
     * * `'default'` - Use instance stash if previously created; otherwise use shared stash.
     * @returns The pipeline stash push-down list.
     * @memberOf dataModels.JSON.prototype
     */
    getPipelineSchemaStash: function(whichStash) {
        var stash;
        switch (whichStash) {

            case 'shared':
                stash = DataModel.prototype.stash;
                break;

            case 'own':
            case 'instance':
                if (!this.hasOwnProperty('pipelineSchemaStash')) {
                    this.pipelineSchemaStash = [];
                }
            // disable eslint no-fallthrough
            case 'default':
            case undefined:
                stash = this.pipelineSchemaStash;
                break;

        }
        return stash;
    },

    /**
     * Pops the last stashed pipeline off the stash stack, making it the currently defined pipeline.
     * @param {string} [whichStash] - See {@link dataModels.JSON#getPipelineSchemaStash}.
     * @memberOf dataModels.JSON.prototype
     */
    unstashPipeline: function(whichStash) {
        var pipelineSchemaStash = this.getPipelineSchemaStash(whichStash);
        if (pipelineSchemaStash.length) {
            this.setPipeline(pipelineSchemaStash.pop());
        }
    },

    /**
     * @deprecated
     * @param {number} [newLength=0]
     * @memberOf dataModels.JSON.prototype
     */
    truncatePipeline: function(newLength) {
        return this.deprecated('truncatePipeline(newLength)', 'setPipeline()', '1.2.0', arguments, 'Build a local pipeline (array of data source constructors) and pass it to setPipeline.');
    },

    isDrillDown: function() {
        return this.dataSource.isDrillDown();
    },

    isDrillDownCol: function(event) {
        return this.dataSource.isDrillDownCol(event);
    },


    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {boolean}
     */
    hasHierarchyColumn: function() {
        return this.isDrillDown() && this.grid.properties.showTreeColumn;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param index
     * @param returnAsString
     * @desc Provides the unicode character used to denote visually if a column is a sorted state
     * @returns {*}
     */
    getSortImageForColumn: function(columnIndex) {
        //Not implemented
    },

    /**
     * @summary Toggle the drill-down control of a the specified row.
     * @desc Operates only on the following rows:
     * * Expandable rows - Rows with a drill-down control.
     * * Revealed rows - Rows not hidden inside of collapsed drill-downs.
     * @param y - Revealed row number. (This is not the row ID.)
     * @param {boolean} [expand] - One of:
     * * `true` - Expand row.
     * * `false` - Collapse row.
     * * `undefined` (or omitted) - Toggle state of row.
     * @param event
     * @returns {boolean|undefined} Changed. Specifically, one of:
     * * `undefined` row had no drill-down control
     * * `true` drill-down changed
     * * `false` drill-down unchanged (was already in requested state)
     * @memberOf dataModels.JSON.prototype
     */
    toggleRow: function(y, expand, event) {
        //TODO: fire a row toggle event
        var changed;
        if (this.isDrillDownCol(event)) {
            changed = this.dataSource.click(y, expand);
            if (changed) {
                this.reindex({rowClick: true});
                this.grid.behavior.changed();
            }
        }
        return changed;
    },

    /**
     * @param {number} r - Data row coordinate.
     * @returns {object|undefined} Returns data row object or `undefined` if a header row.
     * @memberOf dataModels.JSON.prototype
     */
    getRow: function(r) {
        return this.dataSource.getRow(r);
    },

    /**
     * @summary Get the given data controller.
     * @param {string} type
     * @returns {undefined|*} The data controller; or `undefined` if data controller unknown to data model.
     * @memberOf dataModels.JSON#
     */
    getController: function(type) {
        return this.controllers[type]; // alternatively: this.dataSource.getController(type)
    },

    /**
     * @summary Set the given data controller(s).
     * @param {string} typeOrHashOfTypes - One of:
     * * **object** - Hash of multiple data controllers, by type.
     * * **string** - Type of the single data controller given in `controller`.
     * @param {dataControlInterface} [controller] - Only required when 'hash' is a string; omit when `hash` is an object.
     * @returns {object} - Hash of all results, by type. Each member will be:
     * * The given data controller for that type when defined.
     * * A new "null" data controller, generated by the data model when the given data controller for that type was `undefined`.
     * * `undefined` - The data controller was unknown to the data model.
     * @memberOf dataModels.JSON#
     */
    setController: function(typeOrHashOfTypes, controller) {
        var dataSource = this.dataSource,
            controllers = this.controllers,
            result, results = {},
            atLeastOneAccepted,
            hash;

        if (typeof typeOrHashOfTypes === 'string') {
            var type = typeOrHashOfTypes;
            hash = {};
            hash[type] = controller;
        } else {
            hash = typeOrHashOfTypes;
        }

        Object.keys(hash).forEach(function(type) {
            result = dataSource.setController(type, hash[type]);
            atLeastOneAccepted = atLeastOneAccepted || result;
            results[type] = result;
        });

        // add in the results to the active list including rejections
        Object.assign(controllers, results);

        // prune rejections from the active list
        Object.keys(controllers).forEach(function(type) {
            if (!controllers[type]) {
                delete controllers[type];
            }
        });

        if (atLeastOneAccepted) {
            this.reindex();
        }

        return results;
    },

    /**
     * @summary Digests `(columnIndex, propName, value)` and calls specified data controllers `properties()` method.
     * @desc Digests the three parameters `(columnIndex, propName, value)` detailed below, creating a single {@link dataControlInterface} object with which it then calls the `properties` method of the data controller specified by `type`.
     *
     * This method is overloaded in the jQuery style: You can both set a data controller prop (when value give) and a get a data controller prop (when value omitted); or you can give a hash in place of the property name to set several properties at once. Whichever way you use it, you can in addition specify a column index for column-specific properties.
     *
     * @param {null|string} type - The controller type from which to get or to which to set the given property value(s). `null` in a setter operation applies the value(s) to all data controllers; `null` has questionable usefulness in a getter operation.
     *
     * @param {number} [columnIndex] - If given, this is a property on a specific column. If omitted, this is a property on the whole data controller properties object.
     *
     * @param {string|object} propNameOrPropHash - _If `columnIndex` is omitted, this arg takes its place._
     *
     * One of these types:
     * * **string** - Property name. The name of the explicit property to either get or (if `value` also given) set on the properties object.
     * * **object** - Hash of properties to set on the properties object.
     *
     * @param [value] - _If `columnIndex` is omitted, this arg takes its place._
     *
     * One of:
     * * If omitted when `propNameOrPropHash` is a string, this is the "getter" action:
     * Return the value from the properties object of the key in `property`.
     * * Provided when `propNameOrPropHash` is a string, this is the "setter" action:
     * Copy this value to properties object using the key in `property`.
     * * When `propNameOrPropHash` is a hash and `value` is given: Unexpected; throws an error.
     *
     * @returns {propObject}
     *
     * @memberOf dataModels.JSON#
     */
    prop: function(type, columnIndex, propNameOrPropHash, value) {
        var result, invalid,
            properties = {},
            argCount = arguments.length,
            controllers = this.controllers,
            types = (type !== null) ? [type] : Object.keys(controllers);

        controllers = types
            .map(function(type) { return controllers[type]; })
            .filter(function(controller) { return controller; });

        if (controllers.length) {
            if (typeof columnIndex === 'number') {
                argCount--;
            } else {
                value = propNameOrPropHash;
                propNameOrPropHash = columnIndex;
                columnIndex = undefined;
            }

            switch (argCount) {

                case 2: // getter propName name or setter hash
                    if (typeof propNameOrPropHash === 'object') {
                        properties = propNameOrPropHash; // prop is object
                    } else {
                        properties.GETTER = propNameOrPropHash; // prop is name
                    }
                    break;

                case 3: // setter for value
                    if (typeof propNameOrPropHash === 'string') {
                        properties[propNameOrPropHash] = value; // prop is name
                    } else {
                        invalid = true;
                    }
                    break;

                default: // too few or too many args
                    invalid = true;

            }

            if (invalid) {
                throw 'Invalid overload.';
            }

            if (columnIndex !== undefined) {
                // non-enumerable propName:
                Object.defineProperty(properties, 'COLUMN', {
                    value: {
                        index: columnIndex,
                        name: this.schema[columnIndex].name
                    }
                });
            }

            // Use the prepared propObject to get or set the properties on the controller
            controllers.forEach(function(controller) {
                result = controller.properties(properties);
            });
        }

        return result;
    },

    /**
     * @summary Add a new data row to the grid.
     * @desc If data source pipeline in use, to see the new row in the grid, you must eventually call:
     * ```javascript
     * this.grid.behavior.reindex();
     * this.grid.behaviorChanged();
     * ```
     * @param {object} newDataRow
     * @returns {object} The new row object.
     * @memberOf dataModels.JSON.prototype
     */
    addRow: function(newDataRow) {
        this.getData().push(newDataRow);
        return newDataRow;
    },

    get schema() { return this.dataSource.schema; },

    set schema(schema) {
        this.dataSource.setSchema(schema);
    }
};

function reindex(options) {
    var selectedRowSourceIndexes = getUnderlyingIndexesOfSelectedRows.call(this);

    this.pipeline.forEach(function(dataSource) {
        if (dataSource) {
            if (dataSource.apply) {
                dataSource.apply(options);
            }
        }
    });

    reselectRowsByUnderlyingIndexes.call(this, selectedRowSourceIndexes);
}


function CharMap(dataModel) {
    this.dataModel = dataModel;
}
CharMap.prototype = {
    mixIn: require('overrider').mixIn,

    get OPEN() { return this.dataModel.dataSource.drillDownCharMap.OPEN; },
    set OPEN(s) { this.dataModel.dataSource.drillDownCharMap.OPEN = s; },

    get CLOSE() { return this.dataModel.dataSource.drillDownCharMap.CLOSE; },
    set CLOSE(s) { this.dataModel.dataSource.drillDownCharMap.CLOSE = s; },
};

/**
 * Re-establish grid row selections based on underlying data row indexes saved by `getSelectedDataRowsBackingSelectedGridRows` which should be called first.
 * @private
 * @this {dataModels.JSON}
 * @memberOf dataModels.JSON~
 */
function reselectRowsByUnderlyingIndexes(sourceIndexes) {
    var i, r,
        rowCount = this.getRowCount(),
        selectedRowCount = sourceIndexes.length,
        rowIndexes = [],
        selectionModel = this.grid.selectionModel;

    selectionModel.clearRowSelection();

    if (this.grid.properties.checkboxOnlyRowSelections) {
        for (r = 0; selectedRowCount && r < rowCount; ++r) {
            i = sourceIndexes.indexOf(this.dataSource.getDataIndex(r));
            if (i >= 0) {
                rowIndexes.push(r);
                delete sourceIndexes[i]; // might make indexOf increasingly faster as deleted elements are not enumerable
                selectedRowCount--; // count down so we can bail early if all found
            }
        }

        rowIndexes.forEach(function(rowIndex) {
            selectionModel.selectRow(rowIndex);
        });
    }

    return rowIndexes.length;
}

/**
 * Save underlying data row indexes backing current grid row selections.
 * This call should be paired with a subsequent call to `reselectGridRowsBackedBySelectedDataRows`.
 * @private
 * @this {dataModels.JSON}
 * @memberOf dataModels.JSON~
 */
function getUnderlyingIndexesOfSelectedRows() {
    var sourceIndexes = [],
        dataSource = this.dataSource;

    if (this.grid.properties.checkboxOnlyRowSelections) {
        this.grid.getSelectedRows().forEach(function(selectedRowIndex) {
            sourceIndexes.push(dataSource.getDataIndex(selectedRowIndex));
        });
    }

    return sourceIndexes;
}


/**
 * @private
 * @param {string} propName
 * @this DataSourceOrigin#
 * @returns {Array}
 * @memberOf dataModels.JSON~
 */
function getSchemaPropArr(propName, deprecatedMethodName) {
    this.deprecated(deprecatedMethodName, deprecatedMethodName + '() has been deprecated as of v1.2.0 and will be removed in a future release. Constructs like ' + deprecatedMethodName + '()[i] should be changed to schema[i]. (This deprecated method now returns a new array derived from schema.)');
    return this.schema.map(function(columnSchema) {
        return columnSchema[propName];
    }, this);
}
