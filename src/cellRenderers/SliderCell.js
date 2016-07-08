'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @extends CellRenderer
 */
var Slider = CellRenderer.extend('Slider', {

    /**
     * @param {CanvasGraphicsContext} gc
     * @param {object} config
     * @param {Rectangle} config.bounds - The bounding rect of the cell to be rendered.
     * @param config.x - The cell column position
     * @param config.y - The cell row position
     * @memberOf Slider.prototype
     * @desc Emerson's paint function for a slider button. currently the user cannot interact with it
     */
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;
        gc.strokeStyle = 'white';
        var val = this.config.value;
        var radius = height / 2;
        var offset = width * val;
        var bgColor = this.config.isSelected ? this.config.backgroundColor : '#333333';
        var btnGradient = gc.createLinearGradient(x, y, x, y + height);
        btnGradient.addColorStop(0, bgColor);
        btnGradient.addColorStop(1, '#666666');
        var arcGradient = gc.createLinearGradient(x, y, x, y + height);
        arcGradient.addColorStop(0, '#aaaaaa');
        arcGradient.addColorStop(1, '#777777');
        gc.fillStyle = btnGradient;
        this.roundRect(gc, x, y, width, height, radius, btnGradient);
        if (val < 1.0) {
            gc.fillStyle = arcGradient;
        } else {
            gc.fillStyle = '#eeeeee';
        }
        gc.beginPath();
        gc.arc(x + Math.max(offset - radius, radius), y + radius, radius, 0, 2 * Math.PI);
        gc.fill();
        gc.closePath();
        this.config.minWidth = 100;
    }
});

module.exports = Slider;
