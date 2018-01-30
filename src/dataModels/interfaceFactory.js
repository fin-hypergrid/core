'use strict';

var template = {
    // Required methods (throw error)
    getSchema: unimplementedError,
    getValue: unimplementedError,
    getRowCount: unimplementedError,

    // Optional methods (fallbacks provided)
    getColumnCount: getColumnCount,
    getRow: getRow,
    getData: getData,
    getDataIndex: getDataIndex, // supports persisting row selections across data transformations
    getRowMetadata: getRowMetadata, // supports row and cell props
    setRowMetadata: setRowMetadata, // supports row and cell props
    getMetadata: getMetadata, // supports row and cell props
    setMetadata: setMetadata, // supports row and cell props

    // Discretionary methods with warnings (fail with one-time console warning)
    setData: unsupportedWarning,
    setSchema: unsupportedWarning, // called by Hypergrid only if you specify a schema on new or setData
    setValue: unsupportedWarning, // called by Hypergrid only if you edit a cell

    // Discretionary methods without warnings (fail silently)
    apply: failSilently,
    isDrillDown: failSilently,
    isDrillDownCol: failSilently,

    // Custom methods (fail with one-time console warning)

    // following methods may be set as follows using an interfaceExtenderCollection:
    // * by Hypergrid at instantiation time via the `interfaceAdditions` option
    // * by application or plugins after instantiation by calling `dataModel.dataSource.permit(interfaceAdditions)`

    // click: -Infinity,
    // getGrandTotals: -Infinity,
    // revealRow: -Infinity,
    // isLeafNode: -Infinity,
    // viewMakesSense: -Infinity
};

/**
 * @function makeInterface
 * @memberOf DataModel#
 * @summary Get data source interface with fallbacks.
 * @desc All fallback methods are bound to `dataModel` for fallback implementations.
 * @this {dataModels.JSON}
 * @param {object} [options]
 * @param {object[]|object} [options.metadataStore=[]] - Meta-data store for get/setRowMetadata fallbacks. Could be a hash instead of an array if array would be too large.
 * @param {object} [options.interfaceAdditions] - Additional interface requirements beyond those defined in `template`.
 * @returns {object} A hash representing the data source interface, _i.e.,_
 * the methods supported by the data source with fallbacks for optional methods (called when unimplemented by the data source):
 * * Fallbacks for required methods throw an error.
 * * Fallbacks for optional methods are generic. (A native implementation is usually preferred.)
 * * Fallbacks for discretionary methods issue a warning in the console on first invocation.
 * * Fallbacks for custom methods fail silently.
 */
function makeInterface(options) {
    // following collection utilized by get/setRowMetadata fallbacks
    this.metadata = options && options.metadataStore || [];

    var result = {
        triggerHypergridEvent: this.trigger
    };

    // mix in template and extensions
    Object.assign(result, template, options && options.interfaceAdditions);

    // bind all fallbacks to `this` (dataModel)
    Object.keys(result).forEach(function(key) {
        result[key] = result[key].bind(this);
    }, this);

    return result;
}

// general fallbacks

// fallback function that fails silently instead of issuing a warning or throwing an error
function failSilently() {}

// fallback function that issues a one-time warning
var warned = {};
function unsupportedWarning(methodName, returnValue) {
    if (!warned[methodName]) {
        console.warn('Data source does not support `' + methodName + '()`.');
        warned[methodName] = true;
    }
    return returnValue;
}

// fallback function that throws an error
function unimplementedError(methodName) {
    throw new (this.dataSource.DataSourceError || Error)('Expected data source to implement method `' + methodName + '()`.');
}

// explicit fallbacks

function getColumnCount() {
    return this.schema.length;
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
 * @param {object} [newMetadata] - If metadata not found sets metadata to `newMetadata` if given.
 * @returns {undefined|object} Metadata object if found; else `newMetadata` if given; else `undefined`.
 */
function getRowMetadata(y, newMetadata) {
    return this.metadata[y] || newMetadata && (this.metadata[y] = newMetadata);
}
function getMetadata() {
    return this.metadata;
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
function setMetadata(metadata) {
    this.metadata = metadata;
}

module.exports = {
    makeInterface: makeInterface,
    unimplementedError: unimplementedError,
    unsupportedWarning: unsupportedWarning,
    failSilently: failSilently
};
