'use strict';

/**
 * Behavior.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {
    /**
     * @summary The total height of the "fixed rows."
     * @desc The total height of all (non-scrollable) rows preceding the (scrollable) data subgrid.
     * @memberOf Behavior#
     * @return {number} The height in pixels of the fixed rows area of the hypergrid, the total height of:
     * 1. All rows of all subgrids preceding the data subgrid.
     * 2. The first `fixedRowCount` rows of the data subgrid.
     */
    getFixedRowsHeight: function() {
        var subgrid, isData, r, R,
            subgrids = this.subgrids,
            height = 0,
            gridProps = this.grid.properties,
            contentBox = gridProps.boxSizing !== 'border-box',
            gridLinesHWidth = gridProps.gridLinesHWidth;

        for (var i = 0; i < subgrids.length && !isData; ++i) {
            subgrid = subgrids[i];
            isData = subgrid.isData;
            R = isData ? gridProps.fixedRowCount : subgrid.getRowCount();
            for (r = 0; r < R; ++r) {
                height += this.getRowHeight(r, subgrid);
                if (contentBox) {
                    height += gridLinesHWidth;
                }
            }
            // add in fixed rule thickness excess
            if (isData && gridProps.fixedLinesHWidth) {
                height += gridProps.fixedLinesHWidth - gridLinesHWidth;
            }
        }

        return height;
    },

    /**
     * @memberOf Behavior#
     * @param {number|CellEvent} yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param {boolean} [prototype] - Prototype for a new properties object when one does not already exist. If you don't define this and one does not already exist, this call will return `undefined`.
     * Typical defined value is `null`, which creates a plain object with no prototype, or `Object.prototype` for a more "natural" object.
     * _(Required when 3rd param provided.)_
     * @param {DataModel} [dataModel=this.dataModel] - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     * @returns {object|undefined} The row properties object which will be one of:
     * * object - existing row properties object or new row properties object created from `prototype`; else
     * * `false` - row found but no existing row properties object and `prototype` was not defined; else
     * * `undefined` - no such row
     */
    getRowProperties: function(yOrCellEvent, prototype, dataModel) {
        if (typeof yOrCellEvent === 'object') {
            dataModel = yOrCellEvent.subgrid;
            yOrCellEvent = yOrCellEvent.dataCell.y;
        }

        var metadata = (dataModel || this.dataModel).getRowMetadata(yOrCellEvent, prototype === undefined ? undefined : null);
        return metadata && (metadata.__ROW || prototype !== undefined && (metadata.__ROW = Object.create(prototype)));
    },

    /**
     * Reset the row properties in its entirety to the given row properties object.
     * @memberOf Behavior#
     * @param {number|CellEvent} yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param {object|undefined} properties - The new row properties object. If `undefined`, this call is a no-op.
     * @param {DataModel} [dataModel=this.dataModel] - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    setRowProperties: function(yOrCellEvent, properties, dataModel) {
        if (!properties) {
            return;
        }

        if (typeof yOrCellEvent === 'object') {
            dataModel = yOrCellEvent.subgrid;
            yOrCellEvent = yOrCellEvent.dataCell.y;
        }

        var metadata = (dataModel || this.dataModel).getRowMetadata(yOrCellEvent, null);
        if (metadata) {
            metadata.__ROW = Object.create(this.rowPropertiesPrototype);
            this.addRowProperties(yOrCellEvent, properties, dataModel, metadata.__ROW);
            this.stateChanged();
        }
    },

    /**
     * Sets a single row property on a specific individual row.
     * @memberOf Behavior#
     * @param {number|CellEvent} yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param {string} key - The property name.
     * @param value - The new property value.
     * @param {DataModel} [dataModel=this.dataModel] - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    setRowProperty: function(yOrCellEvent, key, value, dataModel) {
        var rowProps;
        var isHeight = (key === 'height');

        if (value !== undefined) {
            rowProps = this.getRowProperties(yOrCellEvent, this.rowPropertiesPrototype, dataModel);
            rowProps[key] = value;
        } else {
            // only try to undefine key if row props object exists; no point in creating it just to delete a non-existant key
            rowProps = this.getRowProperties(yOrCellEvent, undefined, dataModel);
            if (rowProps) {
                delete rowProps[isHeight ? '_height' : key];
            }
        }

        if (isHeight) {
            this.shapeChanged();
        } else {
            this.stateChanged();
        }
    },

    /**
     * Add all the properties in the given row properties object to the row properties.
     * @memberOf Behavior#
     * @param {number|CellEvent} yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param {object|undefined} properties - An object containing new property values(s) to assign to the row properties. If `undefined`, this call is a no-op.
     * @param {DataModel} [dataModel=this.dataModel] - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    addRowProperties: function(yOrCellEvent, properties, dataModel, rowProps) {
        if (!properties) {
            return;
        }

        var isHeight, hasHeight;

        rowProps = rowProps || this.getRowProperties(yOrCellEvent, this.rowPropertiesPrototype, dataModel);

        if (rowProps) {
            Object.keys(properties).forEach(function(key) {
                var value = properties[key];
                if (value !== undefined) {
                    rowProps[key] = value;
                } else {
                    isHeight = key === 'height';
                    delete rowProps[isHeight ? '_height' : key];
                    hasHeight = hasHeight || isHeight;
                }
            });

            if (hasHeight) {
                this.shapeChanged();
            } else {
                this.stateChanged();
            }
        }
    },

    /**
     * @memberOf Behavior#
     * @param {number} yOrCellEvent - Data row index local to `dataModel`.
     * @param {DataModel} [dataModel=this.dataModel]
     * @returns {number} The row height in pixels.
     */
    getRowHeight: function(yOrCellEvent, dataModel) {
        var rowProps = this.getRowProperties(yOrCellEvent, undefined, dataModel);
        return rowProps && rowProps.height || this.grid.properties.defaultRowHeight;
    },

    /**
     * @memberOf Behavior#
     * @desc set the pixel height of a specific row
     * @param {number} yOrCellEvent - Data row index local to dataModel.
     * @param {number} height - pixel height
     * @param {DataModel} [dataModel=this.dataModel]
     */
    setRowHeight: function(yOrCellEvent, height, dataModel) {
        this.setRowProperty(yOrCellEvent, 'height', height, dataModel);
    }
};


exports.rowPropertiesPrototypeDescriptors = {
    height: {
        enumerable: true,
        get: function() {
            return this._height || this.defaultRowHeight;
        },
        set: function(height) {
            height = Math.max(5, Math.ceil(height));
            if (isNaN(height)) {
                height = undefined;
            }
            if (height !== this._height) {
                if (!height) {
                    delete this._height;
                } else {
                    // Define `_height` as non-enumerable so won't be included in output of saveState.
                    // (Instead the `height` getter is explicitly invoked and the result is included.)
                    Object.defineProperty(this, '_height', { value: height, configurable: true });
                }
                this.grid.behaviorStateChanged();
            }
        }
    }
};
