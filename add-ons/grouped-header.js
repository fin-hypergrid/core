/* eslint-env browser */

// NOTE: gulpfile.js's 'add-ons' task copies this file, altering the final line, to /demo/build/add-ons/, along with a minified version. Both files are eventually deployed to http://openfin.github.io/fin-hypergrid/add-ons/.

'use strict';

var prototypeAdditions = {
    /**
     * @summary This cell renderer's paint function.
     * @desc This function renders a grouped column header when both of the following are true:
     * * Cell is a header cell.
     * * Column's header string contains the `delimiter` string.
     * @type {function}
     * @memberOf groupedHeader.mixInTo~GroupedHeader.prototype
     */
    paint: paintHeaderGroups,

    // Remaining members are exclusive to `GroupedHeader` (not overrides)

    /**
     * @summary Group header delimiter.
     * @desc String used within header strings to concatenate group label(s), always ending with actual header.
     * @type {string}
     * @default '|' (vertical bar)
     * @memberOf groupedHeader.mixInTo~GroupedHeader.prototype
     */
    delimiter: '|',

    /**
     * @summary Group label color.
     * @type {string}
     * @default 'rgb(144, 144, 144)'
     * @memberOf groupedHeader.mixInTo~GroupedHeader.prototype
     */
    groupColor: 'rgb(144, 144, 144)',

    /**
     * @summary Reference to the current background renderer for this grid's grouped column labels.
     * @type {function}
     * @default {@link groupedHeader.drawProportionalBottomBorder}
     * @memberOf groupedHeader.mixInTo~GroupedHeader.prototype
     */
    paintBackground: drawProportionalBottomBorder,

    /**
     * @summary List of gradient stops that define the gradient.
     * @desc See {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient/addColorStop|addColorStop} for more info.
     * @type {gradientStop[]}
     * @default [ [0, 'rgba(144, 144, 144, 0)'], [1, 'rgba(144, 144, 144, .35)'] ]
     * @memberOf groupedHeader.mixInTo~GroupedHeader.prototype
     */
    gradientStops: [
        [0, 'rgba(144, 144, 144, 0)'],
        [1, 'rgba(144, 144, 144, .35)']
    ]
};

/**
 * @summary Mix in the code necessary to support grouped column headers.
 * @desc Performs the following mix ins:
 * 1. Creates a new renderer and adds it to the grid.
 * 2. Sets the data model's {@link dataModel#groupHeaderDelimiter|groupHeaderDelimiter} property, which tells the data model to prepend the up and down sort arrows to the actual column header part of the header string rather than the start of the header string (which is the highest-order group label).
 * @function
 * @param {Hypergrid} grid - Your instantiated grid object.
 * @param {object} options - Overrides for the {@link groupedHeader.mixInTo~GroupedHeader|GroupedHeader} cell renderer's _own_ members.
 * @memberOf groupedHeader
 */
function mixInTo(grid, options) {

    var SimpleCell = Object.getPrototypeOf(grid.cellRenderers.get('SimpleCell')).constructor;

    /**
     * @extends SimpleCell
     * @constructor
     */
    var GroupedHeader = SimpleCell.extend('GroupedHeader', prototypeAdditions);

    // 1. Create a special cell renderer to be used for the grouped header cells.
    var renderer = grid.cellRenderers.add(GroupedHeader);

    // 2. Set instance variables from `options` object, overriding values in above prototype
    if (options) {
        for (var key in Object.keys(options)) {
            if (options.hasOwnProperty(options)) {
                renderer[key] = options[key];
            }
        }
    }

    // 2. Extend the behavior's `setHeaders` method.
    grid.behavior.setHeaders = this.setHeaders; // This override calls the superclass's implementation

    // 3. Set the datamodel's `groupHeaderDelimiter` property
    grid.behavior.dataModel.groupHeaderDelimiter = renderer.delimiter;
}

/**
 * @summary Set the headers _and_ set the header row height.
 * @desc Convenience function to:
 * 1. Call the underlying {@link behaviors/JSON#setHeaders|setHeaders} method.
 * 2. Set the header row height based on the maximum group depth.
 * @this {Behavior}
 * @param {string[]|object} headers - The header labels. One of:
 * * _If an array:_ Must contain all headers in column order.
 * * _If a hash:_ May contain any headers, keyed by field name, in any order.
 * @memberOf groupedHeader
 */
function setHeaders(headers) {
    var delimiter = this.grid.cellRenderers.get('GroupedHeader').delimiter;

    // Call the original implementation to set the headers
    Object.getPrototypeOf(this).setHeaders.call(this, headers);

    // Discover the deepest group level from all the header strings
    var levels = this.allColumns.reduce(function(max, column) {
        return Math.max(column.header.split(delimiter).length, max);
    }, 0);

    // Increase the height of header row to accommodate all the deepest group header level
    this.grid.setState({
        rowHeights: {
            0: levels * 4 / 3 * this.grid.behavior.getDefaultRowHeight()
        }
    });
}

/**
 * @this {GroupHeader}
 * @param {CanvasRenderingContext2D} gc
 * @param {object} config
 * @memberOf groupedHeader
 */
function paintHeaderGroups(gc, config) {
    var paint = this.super.paint;

    if (config.y === 0 && config.x >= 0) { // if a header cell...
        var values = config.value.split(this.delimiter), // each group header including column header
            groupCount = values.length - 1; // group header levels above column header

        if (groupCount === 0 || config.x === 0) { // no group headers OR first column
            this.groups = []; // start out with no groups defined
        }

        if (groupCount) { // has group headers
            var group,
                groups = this.groups,
                bounds = config.bounds,

                // save bounds for final column header render
                boundsLeft = bounds.x,
                boundsWidth = bounds.width,

                // save cosmetic properties for final column header render
                isColumnHovered = config.isColumnHovered,
                isSelected = config.isSelected,
                font = config.font,
                color = config.color,
                backgroundColor = config.backgroundColor;

            // height of each level is the same, 1/levels of total height
            bounds.height /= values.length;

            for (var g = 0, y = bounds.y; g < groupCount; g++, y += bounds.height) {
                if (!groups[g] || values[g] !== groups[g].value) {
                    // Level has changed so reset left position (group[g] as on the renderer and persists between calls)
                    group = groups[g] = groups[g] || {};
                    group.value = values[g];
                    group.left = boundsLeft;
                    group.width = boundsWidth;
                } else {
                    // Continuation of same group level, so just repaint but with increased width
                    group = groups[g];
                    group.width += boundsWidth;
                }

                bounds.x = group.left;
                bounds.y = y;
                bounds.width = group.width;

                // Paint the group header background
                gc.fillStyle = backgroundColor;
                gc.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

                // Decorate the group header background
                this.groupIndex = g;
                this.groupCount = groupCount;
                this.paintBackground(gc, config);

                // Suppress hover and selection effects for group headers
                config.isColumnHovered = config.isSelected = false;

                // Make group headers bold & grey
                config.value = group.value;
                config.font = 'bold ' + font;
                config.color = this.groupColor;
                config.backgroundColor = 'transparent';

                // Paint the group header foreground
                paint.call(this, gc, config);
            }

            // Restore `config` for final `paint` call below for the "actual" header:

            // Restore bounds for final column header render.
            // Note that `y` and `height` have been altered from their original values.
            bounds.x = boundsLeft;
            bounds.y = y;
            bounds.width = boundsWidth;
            config.value = values[g]; // low-order header

            // Restore cosmetic values for hover & selection.
            config.isColumnHovered = isColumnHovered;
            config.isSelected = isSelected;

            // Restore font & color which were set to bold grey above for group headers.
            config.font = font;
            config.color = color;
            config.backgroundColor = backgroundColor;
        }
    }

    // Render the actual column header
    paint.call(this, gc, config);
}


/**
 * @summary Draw underscore under group label.
 * @desc Supply a reference to this function in the `paintBackground` option in your {@link groupedHeader.mixInTo} call. This function is not called directly.
 * @this {GroupHeader}
 * @param {CanvasRenderingContext2D} gc
 * @param {object} config - The `paint` method's `config` object.
 * @memberOf groupedHeader
 */
function drawProportionalBottomBorder(gc, config) {
    var bounds = config.bounds,
        thickness = this.groupCount - this.groupIndex; // high-order group gets thickest border

    gc.beginPath();
    gc.strokeStyle = this.groupColor;
    gc.lineWidth = thickness;
    gc.moveTo(bounds.x + 3, bounds.y + bounds.height - thickness);
    gc.lineTo(bounds.x + bounds.width - 2, bounds.y + bounds.height - thickness);
    gc.stroke();
    gc.closePath();
}

/**
 * @summary Draw vertical gradient behind group label.
 * @desc Supply a reference to this function in the `paintBackground` option in your {@link groupedHeader.mixInTo} call. This function is not called directly.
 * @this {GroupHeader}
 * @param {CanvasRenderingContext2D} gc
 * @param {object} config - The `paint` method's `config` object.
 * @memberOf groupedHeader
 */
function drawLinearGradient(gc, config) {
    var bounds = config.bounds,
        grad = gc.createLinearGradient(bounds.x, bounds.y, bounds.x, bounds.y + bounds.height);

    this.gradientStops.forEach(function(stop) {
        grad.addColorStop.apply(grad, stop);
    });

    gc.fillStyle = grad;
    gc.fillRect(bounds.x + 2, bounds.y, bounds.width - 3, bounds.height);
}

/** @typedef gradientStop
 * @type {Array}
 * @desc Consists of two elements:
 * 1. Element `[0]` (number): Stop position ranging from `0.0` (start of gradient) to `1.0` (end of gradient).
 * 2. Element `[1]` (string): CSS color spec in a string, one of:
 *  * color name
 *  * #nnnnnn
 *  * rgb(r,g,b)
 *  * rgba(r,g,b,a)
 *
 *  Applied to the graphic context's {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient/addColorStop|addColorStop} method.
 */

/**
 * Group headers are implemented by rendering each header with it's group(s) above it, all in the one header cell. This multi-line header has the highest-order group's label on the top, with each lower-order group's label on successive lines below it, ending with the actual column header. The conceit of this algorithm is that each group level is rendered in successive columns stretched across all the columns thus far rendered.
 *
 * Column grouping is specified by resetting the all headers involved to a list consisting of the labels of the common group header(s) and ending with the actual column header. For example, to strecth a group label "Age" above columns 4 and 5:
 *
 * ```javascript
 * grid.behavior.getActiveColumn[3].header = "Age|Years";
 * grid.behavior.getActiveColumn[4].header = "Age|Months";
 * ```
 *
 * It is usually convenient to use the behavior's `setHeaders` method. This mix-in actually extends that method to make it slightly more useful: In addition to setting the headers as usual, it also increases the header row height to accommodate the deepest group label. (You don't have to use this method; you can simply reset the headers as above and set the row height yourself.)
 *
 * ### API access
 *
 * If you're using browserify with the *npm* module:
 * ```javascript
 * var groupedHeader = require('fin-hypergrid/add-ons/grouped-header');
 * ```
 *
 * If you're using the script file on the CDN:
 * ```html
 * <script src="openfin.github.io/fin-hypergrid/build/fin-hypergrid.min.js"></script>
 * <script src="openfin.github.io/fin-hypergrid/build/add-ons/grouped-header.min.js"></script>
 * ```
 * ```javascript
 * var groupedHeader = fin.hypergrid.groupedHeader;
 * ```
 *
 * ### Usage
 *
 *  This example specifies that the two named columns are under a group labeled "Name":
 * ```javascript
 * var grid = new fin.Hypergrid(...);
 * groupedHeader.mixInTo(grid, options);
 * grid.behavior.setHeaders({
 *     firstName: 'Name|First',
 *     lastName: 'Name|Last'
 * });
 * ```
 *
 * You can nest headers to any level. The example above is only one level deep. The live {@link http://openfin.github.io/fin-hypergrid/grouped-header.html|demo} demonstrates a nested header (one additional level).
 *
 * This API uses its own extension of the {@link SimpleCell} cell renderer which does the stretched partial cell renders explained above. It also calls a background paint function to fill the area behind the group labels. This API comes with two such background paint functions, described below. These are both exposed so you can specify one over the other. You can also specify a reference to a custom function.
 *
 * ### Background paint functions
 *
 * #### {@link groupedHeader.drawProportionalBottomBorder|drawProportionalBottomBorder}
 * This is the default background paint function. It paints a bottom border under the group header whose thickness is in proportion to the order (level) of the group:
 *
 * ![Bottom Border Background](https://github.com/openfin/fin-hypergrid/raw/master/images/jsdoc/grouped-header/bottom-border.png)
 *
 * The lowest-order group has a 1-pixel thick border; borders grow progressively thicker with each superior group; the highest-order group has the thickest border.
 *
 * #### {@link groupedHeader.drawLinearGradient|drawLinearGradient}
 * This paints a background that transitions color from top to bottom:
 *
 * ![Linear Gradient Background](https://github.com/openfin/fin-hypergrid/raw/master/images/jsdoc/grouped-header/gradient.png)
 *
 * ### Options
 *
 * Options are supplied to the {@link groupedHeader.mixInTo|mixInTo} call and apply to the entire grid so that all column groups in a grid share the same appearance. Most options (with the exception of `delimiter`) are for the use of the {@link groupedHeader.mixInTo~GroupedHeader|GroupedHeader} cell renderer.
 *
 * #### `paintBackground` option
 *
 * To override the default background paint function, pass a reference in the `backgroundPaint` option:
 * ```javascript
 * fin.Hypergrid.groupedHeader.mixInTo(grid, {
 *    paintBackground: groupedHeader.drawLinearGradient
 * });
 * ```
 *
 * #### `gradientStops` option
 *
 * Gradients blend between a series of colors filling the area behind the group label from top to bottom. Each color may include an opacity level.
 *
 * The gradient illustrated above is the default. It uses the default header label color to fill the background, transitioning from top alpha=0% to bottom alpha=35%.
 *
 * You can however specify your own {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient/addColorStop|gradient stops}:
 *
 * ```javascript
 * fin.Hypergrid.groupedHeader.mixInTo(grid, {
 *    paintBackground: fin.Hypergrid.groupedHeader.drawLinearGradient,
 *    gradientStops: [
 *        [0, 'rgba(255, 255, 0, 0)'],
 *        [1, 'rgba(255, 255, 0, .5)']
 *    ],
 *    groupColor: 'red'
 *});
 * ```
 *
 * The gradient shown above fills the background, transitioning from top (0) in yellow (`255, 255, 0`) with alpha=0% (`0`) to bottom (`1`) with alpha=50% (`.5`):
 *
 * ![Linear Gradient Background (Yellow)](https://github.com/openfin/fin-hypergrid/raw/master/images/jsdoc/grouped-header/gradient-yellow.png)
 *
 * #### `groupColor` option
 *
 * The example above also illustrates setting the `groupColor` option which specifies the font color for the group labels, in this case red (yuck! but it's just an example).
 *
 * #### `delimiter` option
 *
 * Allows you to change the delimiter in the header strings from the default vertical bar character (`'|'`) to something else.
 *
 * @mixin
 */
var groupedHeader = {
    mixInTo: mixInTo,
    setHeaders: setHeaders,
    drawProportionalBottomBorder: drawProportionalBottomBorder,
    drawLinearGradient: drawLinearGradient
};

module.exports = groupedHeader;
