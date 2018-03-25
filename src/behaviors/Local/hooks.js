'use strict';


/**
 * Custom implementations should return with a call to the default implementation:
 * ```js
 * var getCell = require('fin-hypergrid/src/behaviors/dataModel').getCell;
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
 * @implements {dataModelAPI#getCell}
 * @memberOf module:dataModel
 */
exports.getCell = function(config, rendererName) {
    return config.grid.cellRenderers.get(rendererName);
};


/**
 * Custom implementations should return with a call to the default implementation:
 * ```js
 * var getCellEditorAt = require('fin-hypergrid/src/behaviors/dataModel').getCellEditorAt;
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
 * @implements {dataModelAPI#getCellEditorAt}
 * @memberOf module:dataModel
 */
exports.getCellEditorAt = function(columnIndex, rowIndex, editorName, cellEvent) {
    return cellEvent.grid.cellEditors.create(editorName, cellEvent);
};
