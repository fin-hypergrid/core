'use strict';

var images = require('../images');

/**
 * @summary Writes error message into cell.
 *
 * @desc This funciton is guaranteed to be called as follows:
 *
 * ```javascript
 * gc.save();
 * gc.beginPath();
 * gc.rect(x, y, width, height);
 * gc.clip();
 * renderCellError(gc, message, x, y, width, height);
 * gc.restore();
 * ```
 *
 * Before doing anything else, this function should clear the cell by setting `gc.fillStyle` and calling `gc.fill()`.
 *
 * @param {CanvasRenderingContext2D} gc
 * @param {string} message
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
function renderCellError(gc, message, x, y, width, height) {

    // clear the cell
    // (this makes use of the rect path defined by the caller)
    gc.fillStyle = '#FFD500';
    gc.fill();

    // render cell border
    gc.strokeStyle = gc.createPattern(images.caution, 'repeat');
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

module.exports = renderCellError;
