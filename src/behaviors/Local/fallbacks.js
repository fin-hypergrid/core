'use strict';

/**
 * @module fallbacks
 *
 * @desc {@link Behavior#resetDataModel resetDataModel()} inserts each of these catcher methods into the new data model when not otherwise implemented, which allows Hypergrid to indiscriminately call these otherwise missing methods on the data model without fear of the call failing.
 */
module.exports = {
    /** @implements DataModel#apply */
    apply: function() {},

    /** @implements DataModel#isTree */
    isTree: function() {
        return false;
    },

    /** @implements DataModel#isTreeCol */
    isTreeCol: function(columnIndex) {
        return false;
    },

    /** @implements DataModel#toggleRow */
    toggleRow: function(rowIndex, columnIndex, expand) {},

    /** @implements DataModel#getColumnCount */
    getColumnCount: function() {
        return this.getSchema().length;
    },

    /** @implements DataModel#getRow */
    getRow: function(y) {
        this.$rowProxy$.$y$ = y;
        return this.$rowProxy$;
    },

    /** @implements DataModel#getData */
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

    setSchema: function(schema) {
        console.warn('dataModel.setSchema(schema) called but no implementation. Schema not updated.');
    },

    /** @implements DataModel#getRowIndex */
    getRowIndex: function(y) {
        return y;
    },

    /** @implements DataModel#getRowMetadata */
    getRowMetadata: function(y, prototype) {
        return this.metadata[y] || prototype !== undefined && (this.metadata[y] = Object.create(prototype));
    },

    /** @implements DataModel#getMetadataStore */
    getMetadataStore: function() {
        return this.metadata;
    },

    /** @implements DataModel#setRowMetadata */
    setRowMetadata: function(y, metadata) {
        if (metadata) {
            this.metadata[y] = metadata;
        } else {
            delete this.metadata[y];
        }
        return metadata;
    },

    /** @implements DataModel#setMetadataStore */
    setMetadataStore: function(newMetadataStore) {
        this.metadata = newMetadataStore || [];
    }
};
