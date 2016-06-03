'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 */
var ErrorCell = CellRenderer.extend('ErrorCell', {

    /**
     * @summary Writes error message into cell.
     *
     * @desc This function is guaranteed to be called as follows:
     *
     * ```javascript
     * gc.save();
     * gc.beginPath();
     * gc.rect(x, y, width, height);
     * gc.clip();
     * behavior.getCellProvider().renderCellError(gc, message, x, y, width, height);
     * gc.restore();
     * ```
     *
     * Before doing anything else, this function should clear the cell by setting `gc.fillStyle` and calling `gc.fill()`.
     *
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     */
    paint: function(gc, config, message) {
        //var images = require('../../images/index');
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        // clear the cell
        // (this makes use of the rect path defined by the caller)
        gc.fillStyle = '#FFD500';
        gc.fill();
        // render cell border
        //gc.strokeStyle = gc.createPattern(images.caution, 'repeat'); // Causes Error
        gc.lineWidth = 5;
        gc.beginPath();
        gc.moveTo(x, y); // caution: do not use rect() here because Chrome does not clip its stroke properly
        gc.lineTo(x + width, y);
        gc.lineTo(x + width, y + height);
        gc.lineTo(x, y + height);
        gc.lineTo(x, y);
        gc.stroke();
        // adjust clip region to prevent text from rendering over right border should it overflow
        gc.beginPath();
        gc.rect(x, y, width - 2, height);
        gc.clip();
        // render message text
        gc.fillStyle = '#A00';
        gc.textAlign = 'start';
        gc.textBaseline = 'middle';
        gc.font = 'bold 6pt "arial narrow", verdana, geneva';
        gc.fillText(message, x + 4, y + height / 2 + 0.5);
    }
});

module.exports = ErrorCell;
