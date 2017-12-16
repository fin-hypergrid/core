'use strict';

var HypergridError = require('../lib/error');

var SILENT = exports.SILENT = null; // signals data source to fail silently instead of calling a fallback
var WARNING = exports.WARNING = undefined; // signals data source to generate a fallback function that issues a one-time warning

var template = {
    // Required methods (throw error)
    getSchema: unimplementedError('getSchema'),
    setData: unimplementedError('setData'),
    getValue: unimplementedError('getValue'),
    getRowCount: unimplementedError('getRowCount'),

    // Optional methods (fallbacks provided)
    getColumnCount: getColumnCount,
    getRow: getRow,
    getData: getData,
    getDataIndex: getDataIndex, // supports persisting row selections across data transformations
    getRowMetadata: getRowMetadata, // supports row and cell props
    setRowMetadata: setRowMetadata, // supports row and cell props

    // Discretionary methods with warnings (fail with one-time console warning)
    setSchema: WARNING, // called by Hypergrid only if you specify a schema on new or setData
    setValue: WARNING, // called by Hypergrid only if you edit a cell

    // Discretionary methods without warnings (fail silently)
    apply: SILENT,
    isDrillDown: SILENT,
    isDrillDownCol: SILENT,

    // Custom methods (fail with one-time console warning)

    // following methods may be set as follows with an interfaceExtenderCollection:
    // * by Hypergrid at instantiation time via the `interface` option
    // * by application or plugins after instantiation by calling `dataModel.dataSource.add(interfaceAdditions)`

    // click: null,
    // getGrandTotals: null,
    // revealRow: null,
    // isLeafNode: null,
    // viewMakesSense: null
};

/**
 * @summary Get data source interface with fallbacks.
 * @desc All fallback methods are bound to `dataModel`,
 * used by actual fallback implementations,
 * unused by `unimplementedError` and `unsupportedWarning`.
 * @this {dataModels.JSON}
 * @param {object[]} [metadata] - Meta data array (or hash) get/setRowMetadata fallbacks to use. If omitted a new array is used.
 * @param {interfaceExtenderCollection} [extensions]
 * @returns {object} A hash representing the data source interface, _i.e.,_
 * the methods supported by the data source with fallbacks for optional methods (called when unimplemented by the data source):
 * * Fallbacks for required methods throw an error.
 * * Fallbacks for optional methods are generic. (A native implementation is usually preferred.)
 * * Fallbacks for discretionary methods issue a warning in the console on first invocation.
 * * Fallbacks for custom methods fail silently.
 */
exports.create = function(metadata, extensions) {
    // following collection utilized by get/setRowMetadata fallbacks
    this.metadata = metadata || [];

    // clone an interface template and mix in extensions
    var result = Object.assign({}, template, extensions);

    // bind all fallback functions to dataModel
    Object.keys(result).forEach(function(methodName) {
        if (typeof result[methodName] === 'function') {
            result[methodName] = result[methodName].bind(this);
        }
    }, this);

    return result;
};


// standard fallbacks

function getColumnCount() {
    return this.dataSource.getSchema().length;
}

function getRow(y) {
    return this.rowAccessor.$$getRow(y);
}

function getData(metaDataColumnName) {
    var dataSource = this.dataSource,
        count = dataSource.getRowCount(),
        rows = new Array(count),
        includeMetadata = !!arguments.length;
    for (var y = 0; y < count; y++) {
        rows[y] = Object.assign({}, dataSource.getRow(y));
        if (includeMetadata){
            rows[y][metaDataColumnName] = this.getRowMetadata(y);
        }
    }
    return rows;
}

function getDataIndex(y) {
    return y;
}

/**
 * Get metadata, a hash of cell properties objects.
 * Each cell that has properties (and only such cells) have a properties object herein, keyed by column schema name.
 * @param {number} y
 * @param {object} [newMetadata] - Sets row metadata to `newMetadata` if given.
 * @returns {undefined|object} Metadata object if found; else `newMetadata` if given; else `undefined`.
 */
function getRowMetadata(y, newMetadata) {
    return this.metadata[y] || newMetadata && (this.metadata[y] = newMetadata);
}

/**
 * Set or clear metadata.
 * @param {number} y
 * @param {object} [metadata] - Hash of grid properties objects.
 * Each cell that has properties (and only such cells) have a properties object herein, keyed by column schema name.
 * If omitted, deletes properties object.
 * @returns {object|undefined} Returns `metadata`.
 */
function setRowMetadata(y, metadata) {
    if (metadata) {
        this.metadata[y] = metadata;
    } else {
        delete this.metadata[y];
    }
    return metadata;
}

function unimplementedError(methodName) {
    return function() {
        throw new HypergridError('Expected data source to implement method `' + methodName + '()`.');
    };
}
