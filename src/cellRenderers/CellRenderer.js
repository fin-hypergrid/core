'use strict';

/** @typedef {object} CellRenderer#renderConfig
 *
 * This is the renderer config object, which is:
 * 1. First passed to a {@link DataModel#getCell getCell} method implementation, which may override (most of) its values before returning.
 * 2. Then passed to the specified cell renderers' {@link CellRenderer#paint paint} function for rendering.
 *
 * #### Standard Properties
 *
 * On each render of every visible cell, this a fresh instance of an object created from (whose prototype is) a properties object as defined by layer-props.js. It therefore has all the standard properties defined in {@link module:defaults}.
 *
 * #### Additional Properties
 *
 * In addition, the config object has the following additional properties.
 *
 * Properties marked **_read-only_** may in fact be writable, but should be considered **off limits** to overriding. Do not attempt to change these properties inside a {@link DataModel#getCell getCell} method override.
 *
 * Properties marked **_write-only_** are to be defined the cell renderer for use by the caller (the grid renderer).
 *
 * @property {boolean} config.allRowsSelected
 *
 * @property {BoundingRect} config.bounds - Bounding rect of the cell or subcell to be rendered.
 *
 * @property {object} [config.clickRect] - **_Write-only._** The Cell renderer may return in this property a subrect in the cell's local coordinates that represents a click region. If defined by the cell renderer, the CellClick feature will ignore clicks outside the click region. If not defined by the cell renderer, the entire cell is clickable.
 *
 * @property {dataCellCoords} config.dataCell - **_Read-only._** Data coordinates of the cell.
 *
 * @property {dataRowObject} config.dataRow - Access to other column values in the same row.
 *
 * @property {function} config.formatValue - _For cell renderer use only. Not available in `getCell` override._ The cell's value formatter function (based on the formatter name in `config.format`, as possibly mutated by `getCell`).
 *
 * @property {gridCellCoords} config.gridCell - **_Read-only._** Grid coordinates of the cell.
 *
 * @property {string} config.halign - The cell's horizontal alignment property, as interpreted by it's cell renderer.
 *
 * @property {boolean} config.isCellHovered -
 *
 * @property {boolean} config.isCellSelected -
 *
 * @property {boolean} config.isColumnHovered -
 *
 * @property {boolean} config.isColumnSelected -
 *
 * @property {boolean} config.isDataColumn -
 *
 * @property {boolean} config.isDataRow -
 *
 * @property {boolean} config.isFilterRow -
 *
 * @property {boolean} config.isHandleColumn -
 *
 * @property {boolean} config.isHeaderRow -
 *
 * @property {boolean} config.isInCurrentSelectionRectangle -
 *
 * @property {boolean} config.isRowHovered -
 *
 * @property {boolean} config.isRowSelected -
 *
 * @property {boolean} config.isSelected -
 *
 * @property {boolean} config.isTreeColumn -
 *
 * @property {boolean} config.isUserDataArea -
 *
 * @property {number} config.minWidth - **_Write-only._** The Cell renderer should return the pixel width of the rendered contents in this property.
 *
 * @property {boolean} config.mouseDown - The last mousedown event occurred over this cell and the mouse is still down. Note, however, that the mouse may no longer be hovering over this cell when it has been dragged away.
 *
 * @property {} [config.prefillColor] - **_Write-only._** This is the color _already painted_ by the grid renderer behind the cell to be rendered. If the cell's specified background color is the same, renderer may (and should!) skip painting it. If `undefined`, this signals a "partial render"; cell renderers that support partial rendering can use `config.snapshot` to determine whether or not to rerender the cell.
 *
 * @property {object} [config.snapshot] - **_Write-only._** Supports _partial render._ In support of the {@link Renderer#paintCellsAsNeeded by-cells} "partial" grid renderer, cell renderers can save the essential render parameters in this property so that on subsequent calls, when the parameters are the same, cell renderers can skip the actual rendering. Only when the parameters have changed is the cell rendered and this property reset (with the new parameters). This object would typically include at the very least the (formatted) `value`, plus additional properties as needed to fully describe the appearance of the render, such as color, _etc._ This property is undefined the first time a cell is rendered by the `by-cells` grid renderer. See also the {@link DataModel#configObject}'s `prefillColor` property.
 *
 * @property config.value - Value to be rendered.
 *
 * The renderer has available to it the `.formatValue()` function for formatting the value. The function comes from the localizer named in the `.format` property. If there is no localizer with that name, the function defaults to the `string` localizer's formatter (which simply invokes the value's `toString()` method).
 *
 * Typically a Local primitive value, values can be any type, including objects and arrays. The specified cell renderer is expected to know how to determine the value's type and render it.
 */

var Base = require('../Base');

/** @constructor
 * @desc Instances of `CellRenderer` are used to render the 2D graphics context within the bound of a cell.
 *
 * Extend this base class to implement your own cell renderer.
 *
 * @tutorial cell-renderer
 */
var CellRenderer = Base.extend('CellRenderer', {
    /**
     * @desc An empty implementation of a cell renderer, see [the null object pattern](http://c2.com/cgi/wiki?NullObject).
     *
     * @this {CellEditor}
     *
     * @param {CanvasRenderingContext2D} gc
     *
     * @param {CellRenderer#renderConfig} config
     *
     * @returns {number} Preferred pixel width of content. The content may or may not be rendered at that width depending on whether or not `config.bounds` was respected and whether or not the grid renderer is using clipping. (Clipping is generally not used due to poor performance.)
     *
     * @memberOf CellRenderer.prototype
     */
    paint: function(gc, config) {},

    /**
     * @desc A simple implementation of rounding a cell.
     * @param {CanvasRenderingContext2D} gc
     * @param {number} x - the x grid coordinate of my origin
     * @param {number} y - the y grid coordinate of my origin
     * @param {number} width - the width I'm allowed to draw within
     * @param {number} height - the height I'm allowed to draw within
     * @param {number} radius
     * @param {number} fill
     * @param {number} stroke
     * @memberOf CellRenderer.prototype
     */
    roundRect: function(gc, x, y, width, height, radius, fill, stroke) {

        if (!stroke) {
            stroke = true;
        }
        if (!radius) {
            radius = 5;
        }
        gc.beginPath();
        gc.moveTo(x + radius, y);
        gc.lineTo(x + width - radius, y);
        gc.quadraticCurveTo(x + width, y, x + width, y + radius);
        gc.lineTo(x + width, y + height - radius);
        gc.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        gc.lineTo(x + radius, y + height);
        gc.quadraticCurveTo(x, y + height, x, y + height - radius);
        gc.lineTo(x, y + radius);
        gc.quadraticCurveTo(x, y, x + radius, y);
        gc.closePath();
        if (stroke) {
            gc.stroke();
        }
        if (fill) {
            gc.fill();
        }
        gc.closePath();
    }
});

module.exports = CellRenderer;
