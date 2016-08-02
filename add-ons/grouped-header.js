'use strict';

var groupedHeader = {

    mixInTo: function ColumnGrouper(grid, options) {
        options = options || {};

        // 1. Create a special cell renderer to be used for the grouped header cells.
        var SimpleCell = Object.getPrototypeOf(grid.cellRenderers.get('SimpleCell')).constructor,
            GroupedHeader = SimpleCell.extend('GroupedHeader', {
                paint: this.paintHeaderGroups,
                delimiter: '|',
                groupColor: 'rgb(144, 144, 144)',
                paintBackground: this.drawProportionalBottomBorder,
                gradientStops: [
                    [0, 'rgba(144, 144, 144, 0)'],
                    [1, 'rgba(144, 144, 144, .35)']
                ]
            }),
            rendererSingleton = grid.cellRenderers.add(GroupedHeader);

        rendererSingleton.groups = [];

        if (options.delimiter) {
            rendererSingleton.delimiter = grid.behavior.dataModel.groupHeaderDelimiter = options.delimiter;
        }

        if (options.groupColor) {
            rendererSingleton.groupColor = options.groupColor;
        }

        if (options.paintBackground) {
            rendererSingleton.paintBackground = options.paintBackground;
            if (options.paintBackground === this.drawLinearGradient && options.gradientStops) {
                this.gradientStops = options.gradientStops;
            }
        }

        // 2. Add a `setHeaders` method to the behavior.
        grid.behavior.setHeaders = this.setHeaders;
    },

    setHeaders: function(headers) {
        var delimiter = this.grid.cellRenderers.get('GroupedHeader').delimiter;

        Object.getPrototypeOf(this).setHeaders.call(this, headers); // see behavior/JSON.js:setHeaders for more info

        // Discover the deepest group level from all the header strings
        var levels = this.allColumns.reduce(function(max, column) {
            return Math.max(column.header.split(delimiter).length, max);
        }, 0);

        // Increase the height of header row to accommodate all group header levels
        this.grid.setState({
            rowHeights: {
                0: levels * 4 / 3 * this.grid.behavior.getDefaultRowHeight()
            }
        });
    },

    /**
     * @this {GroupHeader}
     * @param gc
     * @param config
     */
    paintHeaderGroups: function(gc, config) {
        var paint = this.super.paint;

        if (config.y === 0 && config.x >= 0) { // if a header cell...
            var groups = this.groups,
                values = config.value.split(this.delimiter), // each group header including column header
                groupCount = values.length - 1, // group header levels above column header
                group;

            if (groupCount === 0 || config.x === 0) { // no group headers OR first column
                groups.length = 0; // start out with no groups defined
            }

            if (groupCount) { // has group headers
                var bounds = config.bounds,

                    // save bounds for final column header render
                    boundsLeft = bounds.x,
                    boundsWidth = bounds.width,

                    // save cosmetic properties for final column header render
                    isColumnHovered = config.isColumnHovered,
                    isSelected = config.isSelected,
                    font = config.font,
                    color = config.color;

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
                    config.value = group.value;

                    // Suppress hover and selection effects for group headers
                    config.isColumnHovered = config.isSelected = false;

                    // Make group headers bold & grey
                    config.font = 'bold ' + font;
                    config.color = this.groupColor;

                    // Render the higher-order group labels
                    paint.call(this, gc, config);

                    // draw a border of some kind
                    this.bounds = bounds;
                    this.groupIndex = g;
                    this.groupCount = groupCount;
                    this.paintBackground(gc);
                }

                // restore bounds for final column header render (although y and height have been altered)
                bounds.x = boundsLeft;
                bounds.y = y;
                bounds.width = boundsWidth;
                config.value = values[g]; // low-order header

                // restore cosmetic values for hover and selection
                config.isColumnHovered = isColumnHovered;
                config.isSelected = isSelected;

                // restore font and color which were set to bold grey above for group headers
                config.font = font;
                config.color = color;
            }
        }

        // Render the low-order column header
        paint.call(this, gc, config);
    },

    drawProportionalBottomBorder: function(gc) {
        var bounds = this.bounds;
        var thickness = this.groupCount - this.groupIndex; // high-order group gets thickest border
        gc.beginPath();
        gc.strokeStyle = this.groupColor;
        gc.lineWidth = thickness;
        gc.moveTo(bounds.x + 3, bounds.y + bounds.height - thickness);
        gc.lineTo(bounds.x + bounds.width - 2, bounds.y + bounds.height - thickness);
        gc.stroke();
        gc.closePath();
    },

    drawLinearGradient: function(gc) {
        var bounds = this.bounds;
        var grad = gc.createLinearGradient(bounds.x, bounds.y, bounds.x, bounds.y + bounds.height - 1);
        this.gradientStops.forEach(function(stop) {
            grad.addColorStop.apply(grad, stop);
        });
        gc.fillStyle = grad;
        gc.fillRect(bounds.x + 2, bounds.y, bounds.width - 3, bounds.height);

    }

};

module.exports = groupedHeader;
