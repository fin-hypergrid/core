'use strict';

window.addEventListener('load', function() {

    var cellRenderersRegistry = fin.Hypergrid.require('fin-hypergrid/src/cellRenderers');

    var Borders = cellRenderersRegistry.BaseClass.extend('Borders', {
        paint: function (gc, config) {
            var bounds = config.bounds, x = bounds.x, y = bounds.y, w = bounds.width, h = bounds.height;
            var color;

            gc.save();
            gc.translate(-.5, .5); // paint "sharp" lines on pixels instead of "blury" lines between pixels
            gc.cache.lineWidth = 1;

            color = config.borderTop;
            if (color) {
                gc.beginPath();
                gc.moveTo(x, y);
                gc.lineTo(x + w, y);
                gc.cache.strokeStyle = color;
                gc.stroke();
            }

            color = config.borderRight;
            if (color) {
                gc.beginPath();
                gc.moveTo(x + w, y);
                gc.lineTo(x + w, y + h);
                gc.cache.strokeStyle = color;
                gc.stroke();
            }

            color = config.borderBottom;
            if (color) {
                gc.beginPath();
                gc.moveTo(x, y + h);
                gc.lineTo(x + w, y + h);
                gc.cache.strokeStyle = color;
                gc.stroke();
            }

            color = config.borderLeft;
            if (color) {
                gc.beginPath();
                gc.moveTo(x, y);
                gc.lineTo(x, y + h);
                gc.cache.strokeStyle = color;
                gc.stroke();
            }

            gc.restore();
        }
    });

    cellRenderersRegistry.add(Borders);

});
