/* eslint-env browser */

'use strict';

var grid;

window.onload = function() {
    var DELIMITER = '|',
        GREY = '#909090';

    // New header definitions.
    // The idea here is that group headers are repeated for each column participating in the group.
    // This example has three levels of headers.
    var headers = {
        areaTotalMi: 'Area|Total|miles', // The highest order group header is 'Area'
        areaTotalKm: 'Area|Total|km', // The nested group header is 'Total'

        areaLandMi: 'Area|Land|miles',
        areaLandKm: 'Area|Land|km',

        areaWaterMi: 'Area|Water|miles',
        areaWaterKm: 'Area|Water|km',

        // The rest are not necessary; we only need the grouped ones
        name: 'State',
        code: 'Postal Code',
        capital: 'Capital',
        city: 'Largest City',
        founded: 'Statehood',
        population: 'Population',
        reps: 'House Seats'
    };

    // Get the maximum number of levels from the header strings
    var levels = Object.keys(headers).reduce(function(max, key) {
        return Math.max(headers[key].split(DELIMITER).length, max);
    }, 0);

    // Create the grid and insert into the DOM
    grid = new fin.Hypergrid('div#example', { data: window.unitedStates });

    // Increase the height of header row, making it evenly divisible by the number of header levels
    grid.setState({
        rowHeights: { 0: levels * 20 },
        // columnAutosizing: false
    });

    // Reset the headers
    grid.behavior.allColumns.forEach(function(column) {
        column.header = headers[column.name];
    });

    // Inform the data model of our delimiter; it will place sort triangles on low-order header
    grid.behavior.dataModel.groupHeaderDelimiter = DELIMITER;

    // Get the cell renderer. This code assumes sall the grouped columns are using the same renderer.
    // If using npm/broswerify, this could be require('fin-hypergrid/cellRenderers/SimpleCell') instead.
    var SimpleCell = Object.getPrototypeOf(grid.cellRenderers.get('simplecell')).constructor;

    var groups; // Declared here (in closure) so persists from column to column

    // Extend the renderer and override it's `paint` method
    var DoubleCell = SimpleCell.extend({
        paint: function(gc, config) {
            if (config.y == 0 && config.x >= 0) { // if a header cell...
                var values = config.value.split(DELIMITER), // each group header including column header
                    groupCount = values.length - 1, // group header levels above column header
                    group;

                if (groupCount === 0 || config.x === 0) { // no group headers OR first column
                    groups = []; // start out with no groups defined
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
                            // Level has changed so reset left position (group[g] is in closure so persists between calls)
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
                        config.color = GREY;

                        // Render the higher-order group labels
                        SimpleCell.prototype.paint.call(this, gc, config);

                        // draw bottom border (alternative: make background a blend from light at top to dark at bottom)
                        var thickness = groupCount - g; // high-order group gets thickest border
                        gc.beginPath();
                        gc.strokeStyle = GREY;
                        gc.lineWidth = thickness;
                        gc.moveTo(bounds.x + 3, bounds.y + bounds.height - thickness);
                        gc.lineTo(bounds.x + bounds.width - 2, bounds.y + bounds.height - thickness);
                        gc.stroke();
                        gc.closePath();
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
                    config.color = color
                }
            }

            // Render the low-order column header
            SimpleCell.prototype.paint.call(this, gc, config);
        }
    });

    // Create a new singleton instance of our cell renderer
    var doubleCell = new DoubleCell;

    // Force all columns to use this renderer
    grid.behavior.dataModel.getCell = function(config, rendererName) {
        return doubleCell;
    };
};
