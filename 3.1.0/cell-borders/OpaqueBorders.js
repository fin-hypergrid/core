'use strict';

window.addEventListener('load', function() {

    var cellRenderersRegistry = fin.Hypergrid.require('fin-hypergrid/src/cellRenderers');

    var OpaqueBorders = cellRenderersRegistry.BaseClass.extend('OpaqueBorders', {
        paint: function (gc, config) {
            var bounds = config.bounds, x = bounds.x, y = bounds.y, w = bounds.width, h = bounds.height;
            var border = config.border;
            var color;

            if (!border) {
                return;
            }

            gc.save();
            gc.translate(-.5, .5); // paint "sharp" lines on pixels instead of "blury" lines between pixels
            gc.cache.lineWidth = 1;

            if ((color = border.top)) {
                gc.beginPath();
                gc.moveTo(x, y);
                gc.lineTo(x + w, y);
                gc.cache.strokeStyle = color;
                gc.stroke();
            }

            if ((color = border.right)) {
                gc.beginPath();
                gc.moveTo(x + w, y);
                gc.lineTo(x + w, y + h);
                gc.cache.strokeStyle = color;
                gc.stroke();
            }

            if ((color = border.bottom)) {
                gc.beginPath();
                gc.moveTo(x, y + h);
                gc.lineTo(x + w, y + h);
                gc.cache.strokeStyle = color;
                gc.stroke();
            }

            if ((color = border.left)) {
                gc.beginPath();
                gc.moveTo(x, y);
                gc.lineTo(x, y + h);
                gc.cache.strokeStyle = color;
                gc.stroke();
            }

            gc.restore();
        }
    });

    cellRenderersRegistry.add(OpaqueBorders);

});
