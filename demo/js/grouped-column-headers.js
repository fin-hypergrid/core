/* eslint-env browser */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid;
    grid = new Hypergrid('div#example', { data: window.unitedStates });
    grid.setState({
        rowHeights: { 0: 60 },
        // columnAutosizing: false
    });

    var headers = {
        name: 'State',
        code: 'Postal Code',
        capital: 'Capital',
        city: 'Largest City',
        founded: 'Statehood',
        population: 'Population',
        areaTotalMi: 'Area\nTotal\nmiles',
        areaTotalKm: 'Area\nTotal\nkm',
        areaLandMi: 'Area\nLand\nmiles',
        areaLandKm: 'Area\nLand\nkm',
        areaWaterMi: 'Area\nWater\nmiles',
        areaWaterKm: 'Area\nWater\nkm',
        reps: 'House Seats'
    };

    grid.behavior.allColumns.forEach(function(column) {
        column.header = headers[column.name];
    });

    var groups;
    var SimpleCell = Object.getPrototypeOf(grid.cellRenderers.get('simplecell')).constructor;
    var DoubleCell = SimpleCell.extend({
        paint: function(gc, config) {
            if (config.y == 0 && config.x >= 0) {
                var GREY = '#909090',
                    values = config.value.split('\n'),
                    groupCount = values.length - 1,
                    group;

                if (!groupCount || config.x === 0) {
                    groups = [];
                }

                if (groupCount) {
                    var bounds = config.bounds,
                        boundsLeft = bounds.x,
                        boundsTop = bounds.y,
                        boundsWidth = bounds.width,
                        boundsHeight = bounds.height,
                        height = boundsHeight / values.length,
                        isColumnHovered = config.isColumnHovered,
                        isSelected = config.isSelected,
                        font = config.font,
                        color = config.color;

                    bounds.height = height;

                    for (var g = 0; g < groupCount; g++, boundsTop += height) {
                        if (!groups[g] || values[g] !== groups[g].value) {
                            group = groups[g] = groups[g] || {};
                            group.value = values[g];
                            group.left = boundsLeft;
                            group.width = boundsWidth;
                        } else {
                            group = groups[g];
                            group.width += boundsWidth;
                        }

                        bounds.x = group.left;
                        bounds.y = boundsTop;
                        bounds.width = group.width;
                        config.value = group.value;

                        config.isColumnHovered = config.isSelected = false;
                        config.font = 'bold ' + font;
                        config.color = GREY;

                        SimpleCell.prototype.paint.call(this, gc, config);

                        var w = groupCount - g;
                        gc.beginPath();
                        gc.strokeStyle = GREY;
                        gc.lineWidth = w;
                        gc.moveTo(bounds.x + 3, bounds.y + height - w);
                        gc.lineTo(bounds.x + bounds.width - 2, bounds.y + height - w);
                        gc.stroke();
                        gc.closePath();
                    }

                    bounds.x = boundsLeft;
                    bounds.y = boundsTop;
                    bounds.width = boundsWidth;
                    config.value = values[g];

                    config.isColumnHovered = isColumnHovered;
                    config.isSelected = isSelected;
                    config.font = font;
                    config.color = color
                }
            }
            SimpleCell.prototype.paint.call(this, gc, config);
        }
    });
    var doubleCell = new DoubleCell;

    grid.behavior.dataModel.getCell = function(config, rendererName) {
        return doubleCell; //grid.cellRenderers.get(rendererName);
    };


};
