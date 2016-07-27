/* eslint-env browser */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid;
    grid = new Hypergrid('div#example', { data: window.unitedStates });
    grid.setState({
        rowHeights: { 0: 40 }
    });

    var headers = {
        name: 'State',
        code: 'Postal Code',
        capital: 'Capital',
        city: 'Largest City',
        founded: 'Statehood',
        population: 'Population',
        areaTotalMi: 'Area\nTotal (mi)',
        areaTotalKm: 'Area\nTotal (km)',
        areaLandMi: 'Area\nLand (mi)',
        areaLandKm: 'Area\nLand (km)',
        areaWaterMi: 'Area\nWater (mi)',
        areaWaterKm: 'Area\nWater (km)',
        reps: 'House Seats'
    };

    grid.behavior.allColumns.forEach(function(column) {
        column.header = headers[column.name];
    });

    var first, left, width;
    var SimpleCell = Object.getPrototypeOf(grid.cellRenderers.get('simplecell')).constructor;
    var DoubleCell = SimpleCell.extend({
        paint: function(gc, config) {
            if (config.y == 0) {
                if (config.x === -1) {
                    first = true;
                } else if (config.x >= 0) {
                    var values = config.value.split('\n');
                    if (values.length > 1) {
                        var boundsLeft = config.bounds.x,
                            boundsWidth = config.bounds.width;
                        if (first) {
                            left = boundsLeft;
                            width = boundsWidth;
                            first = false;
                        } else {
                            config.bounds.width = width += boundsWidth;
                            config.bounds.x = left;
                        }
                        config.bounds.height = 20;
                        config.value = values[0];
                        SimpleCell.prototype.paint.call(this, gc, config);
                        config.bounds.width = boundsWidth;
                        config.bounds.x = boundsLeft;
                        config.bounds.y = 20;
                        config.value = values[1];
                    }
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
