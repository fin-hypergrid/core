'use strict';

var _ = require('object-iterators');

var dispatchEvent = require('../events.js').dispatchEvent;
var enrichSchema = require('./schema').enrich;

var eventStringsByHandlerName = {
    fireSyntheticDataSchemaChangedEvent: 'fin-canvas-data-schema-changed',
    fireSyntheticDataChangedEvent: 'fin-canvas-data-changed',
    fireSyntheticDataShapeChangedEvent: 'fin-canvas-data-shape-changed',
    fireSyntheticDataPrereindexEvent: 'fin-canvas-data-prereindex',
    fireSyntheticDataPostreindexEvent: 'fin-canvas-data-postreindex'
};

/**
 * Hypergrid/index.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-data-schema-changed` event.
     * @see {@link dataModelAPI#event:data-schema-changed data-schema-changed}
     */
    fireSyntheticDataSchemaChangedEvent: function(event) {
        enrichSchema.call(this.behavior.dataModel, event && event.schema);
        return dispatchEvent.call(this, 'fin-data-schema-changed', event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-data-changed` event.
     * @see {@link dataModelAPI#event:data-changed data-changed}
     */
    fireSyntheticDataChangedEvent: function(event) {
        this.repaint();
        return dispatchEvent.call(this, 'fin-data-changed', event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-data-shape-changed` event.
     * @see {@link dataModelAPI#event:data-shape-changed data-shape-changed}
     */
    fireSyntheticDataShapeChangedEvent: function(event) {
        this.behaviorShapeChanged();
        return dispatchEvent.call(this, 'fin-data-shape-changed', event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-data-preindex` event.
     * @see {@link dataModelAPI#event:data-prereindex data-prereindex}
     */
    fireSyntheticDataPrereindexEvent: function(event) {
        this.selectedRowSourceIndexes = getUnderlyingIndexesOfSelectedRows.call(this);
        return dispatchEvent.call(this, 'fin-data-prereindex', event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-data-postindex` event.
     * @see {@link dataModelAPI#event:data-postreindex data-postreindex}
     */
    fireSyntheticDataPostreindexEvent: function(event) {
        if (this.selectedRowSourceIndexes) {
            if (this.selectedRowSourceIndexes.length) {
                reselectRowsByUnderlyingIndexes.call(this, this.selectedRowSourceIndexes);
            }
            delete this.selectedRowSourceIndexes;
        }
        return dispatchEvent.call(this, 'fin-data-postreindex', event) &&
            this.fireSyntheticDataShapeChangedEvent(event);
    },

    delegateDataModelEvents: function() {
        var grid = this;

        _(eventStringsByHandlerName).each(function(eventString, handlerName) {
            grid.addInternalEventListener(eventString, function(event) {
                grid[handlerName](event || {});
            });
        });
    }

};


/**
 * Save underlying data row indexes backing current grid row selections.
 * This call should be paired with a subsequent call to `reselectGridRowsBackedBySelectedDataRows`.
 * @private
 * @this {Behavior}
 */
function getUnderlyingIndexesOfSelectedRows() {
    var sourceIndexes = [],
        dataModel = this.dataModel;

    if (this.properties.checkboxOnlyRowSelections) {
        this.getSelectedRows().forEach(function(selectedRowIndex) {
            sourceIndexes.push(dataModel.getRowIndex(selectedRowIndex));
        });
    }

    return sourceIndexes;
}

/**
 * Re-establish grid row selections based on underlying data row indexes saved by `getSelectedDataRowsBackingSelectedGridRows` which should be called first.
 * @private
 * @this {Behavior}
 */
function reselectRowsByUnderlyingIndexes(sourceIndexes) {
    var i, r,
        dataModel = this.dataModel,
        rowCount = dataModel.getRowCount(),
        selectedRowCount = sourceIndexes.length,
        rowIndexes = [],
        selectionModel = this.selectionModel;

    selectionModel.clearRowSelection();

    if (this.properties.checkboxOnlyRowSelections) {
        for (r = 0; selectedRowCount && r < rowCount; ++r) {
            i = sourceIndexes.indexOf(dataModel.getRowIndex(r));
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
