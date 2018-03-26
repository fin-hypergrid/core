'use strict';

/**
 * @module fallbacks
 *
 * @desc {@link Behavior#resetDataModel resetDataModel()} inserts each of these catcher methods into the new data model when not otherwise implemented, which allows Hypergrid to indiscriminately call these otherwise missing methods on the data model without fear of the call failing.
 */
module.exports = {
    /** @implements dataModelAPI#apply */
    apply: function() {},

    /** @implements dataModelAPI#isDrillDown */
    isDrillDown: function() { return false; },

    /** @implements dataModelAPI#click */
    click: function() { return false; },

    /** @implements dataModelAPI#getColumnCount */
    getColumnCount: function() {
        return this.getSchema().length;
    },

    /** @implements dataModelAPI#getRow */
    getRow: function(y) {
        this.dataRowProxy.$y$ = y;
        return this.dataRowProxy;
    },

    /** @implements dataModelAPI#getData */
    getData: function(metadataFieldName) {
        var y, Y = this.getRowCount(),
            row, rows = new Array(Y),
            metadata;

        for (y = 0; y < Y; y++) {
            row = this.getRow(y);
            if (row) {
                rows[y] = Object.assign({}, row);
                if (metadataFieldName) {
                    metadata = this.getRowMetadata(y);
                    if (metadata) {
                        rows[y][metadataFieldName] = metadata;
                    }
                }
            }
        }

        return rows;
    },

    setData: function(data) {
        // fail silently because Local.js::setData currently calls this for every subgrid
    },

    setValue: function(x, y, value) {
        console.warn('dataModel.setValue(' + x + ', ' + y + ', "' + value + '") called but no implementation. Data not saved.');
    },

    /** @implements dataModelAPI#getRowIndex */
    getRowIndex: function(y) {
        return y;
    },

    /** @implements dataModelAPI#getRowMetadata */
    getRowMetadata: function(y, prototype) {
        return this.metadata[y] || prototype !== undefined && (this.metadata[y] = Object.create(prototype));
    },

    /** @implements dataModelAPI#getMetadataStore */
    getMetadataStore: function() {
        return this.metadata;
    },

    /** @implements dataModelAPI#setRowMetadata */
    setRowMetadata: function(y, metadata) {
        if (metadata) {
            this.metadata[y] = metadata;
        } else {
            delete this.metadata[y];
        }
        return metadata;
    },

    /** @implements dataModelAPI#setMetadataStore */
    setMetadataStore: function(newMetadataStore) {
        this.metadata = newMetadataStore || [];
    }
};
