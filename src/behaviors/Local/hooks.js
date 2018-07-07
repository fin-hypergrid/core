'use strict';

/**
 * @module hooks
 */


/**
 * Custom implementations can return with a call to the default implementation:
 * ```js
 * var getCell = require('fin-hypergrid/src/behaviors/dataModel/hooks').getCell;
 * function myCustomGetCell(config, rendererName) {
 *     // custom logic here that mutates config and/or renderName
 *     return getCell(config, rendererName);
 * }
 * ```
 * Alternatively, copy in the default implementation body (a one-liner):
 * ```js
 * function myCustomGetCell(config, rendererName) {
 *     // custom logic here that mutates config and/or renderName
 *     return config.grid.cellRenderers.get(rendererName);
 * }
 * ```
 * To set the default implementation for all new grid instances, override this function in place:
 * ```js
 * var hooks = require('fin-hypergrid/src/behaviors/dataModel/hooks');
 * hooks.getCell = myCustomDefaultGetCell;
 * ```
 * @this {DataModel}
 * @memberOf module:hooks
 */
exports.getCell = function(config, rendererName) {
    return config.grid.cellRenderers.get(rendererName);
};


/**
 * Custom implementations can return with a call to the default implementation:
 * ```js
 * var getCellEditorAt = require('fin-hypergrid/src/behaviors/dataModel/hooks').getCellEditorAt;
 * function myCustomGetCellEditorAt(columnIndex, rowIndex, editorName, cellEvent) {
 *     // custom logic here, may mutate config and/or renderName
 *     return getCellEditorAt(columnIndex, rowIndex, editorName, cellEvent);
 * }
 * ```
 * Alternatively, copy in the default implementation body (a one-liner):
 * ```js
 * function myCustomGetCellEditorAt(columnIndex, rowIndex, editorName, cellEvent) {
 *     // custom logic here, may mutate editorName
 *     return cellEvent.grid.cellEditors.create(editorName, cellEvent);
 * }
 * ```
 * To set the default implementation for all new grid instances, override this function in place:
 * ```js
 * var hooks = require('fin-hypergrid/src/behaviors/dataModel/hooks');
 * hooks.getCellEditorAt = myCustomDefaultGetCellEditorAt;
 * ```
 * @this {DataModel}
 * @memberOf module:hooks
 */
exports.getCellEditorAt = function(columnIndex, rowIndex, editorName, cellEvent) {
    return cellEvent.grid.cellEditors.create(editorName, cellEvent);
};
