'use strict';

var Base = require('./../lib/Base');

/** @constructor
 * @desc Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 * See {@link CellProvider#initialize|initialize} which is called by the constructor.
 */
var CellProvider = Base.extend('CellProvider', {

    /**
     * @summary Constructor logic
     * @desc This method will be called upon instantiation of this class or of any class that extends from this class.
     * > All `initialize()` methods in the inheritance chain are called, in turn, each with the same parameters that were passed to the constructor, beginning with that of the most "senior" class through that of the class of the new instance.
     * @memberOf CellProvider.prototype
     */
    initialize: function(grid) {
        this.cellCache = {};
        this.initializeCells();
        this.grid = grid;
    },

    /**
     * @desc replace this function in on your instance of cellProvider
     * @returns cell
     * @param {object} config - an object with everything you might need for renderering a cell
     * @memberOf CellProvider.prototype
     */
    getCell: function(config) {
        var cell = this.cellCache.simpleCellRenderer;
        cell.config = config;
        return cell;
    },

    /**
     * @desc replace this function in on your instance of cellProvider
     * @returns cell
     * @param {object} config - an object with everything you might need for renderering a cell
     * @memberOf CellProvider.prototype
     */
    getColumnHeaderCell: function(config) {
        var cell = this.cellCache.simpleCellRenderer;
        cell.config = config;
        return cell;
    },

    /**
     * @desc replace this function in on your instance of cellProvider
     * @returns cell
     * @param {object} config - an object with everything you might need for renderering a cell
     * @memberOf CellProvider.prototype
     */
    getRowHeaderCell: function(config) {
        var cell = this.cellCache.simpleCellRenderer;
        cell.config = config;
        return cell;
    },

    /**
     * @summary The default cell rendering function for a button cell.
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.x - the x screen coordinate of my origin
     * @param {number} config.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     * @memberOf CellProvider.prototype
     */
    paintButton: function(gc, config) {
        var val = config.value;
        var c = config.x;
        var r = config.y;
        var bounds = config.bounds;
        var x = bounds.x + 2;
        var y = bounds.y + 2;
        var width = bounds.width - 3;
        var height = bounds.height - 3;
        var radius = height / 2;
        var arcGradient = gc.createLinearGradient(x, y, x, y + height);
        if (config.mouseDown) {
            arcGradient.addColorStop(0, '#B5CBED');
            arcGradient.addColorStop(1, '#4d74ea');
        } else {
            arcGradient.addColorStop(0, '#ffffff');
            arcGradient.addColorStop(1, '#aaaaaa');
        }
        gc.fillStyle = arcGradient;
        gc.strokeStyle = '#000000';
        roundRect(gc, x, y, width, height, radius, arcGradient, true);

        var ox = (width - config.getTextWidth(gc, val)) / 2;
        var oy = (height - config.getTextHeight(gc.font).descent) / 2;

        if (gc.textBaseline !== 'middle') {
            gc.textBaseline = 'middle';
        }

        gc.fillStyle = '#000000';

        config.backgroundColor = 'rgba(0,0,0,0)';
        gc.fillText(val, x + ox, y + oy);

        //identify that we are a button
        config.buttonCells[c + ',' + r] = true;
    },

    /**
     * @summary The default cell rendering function for rendering a vanilla cell.
     * @desc Great care has been taken in crafting this function as it needs to perform extremely fast. Reads on the gc object are expensive but not quite as expensive as writes to it. We do our best to avoid writes, then avoid reads. Clipping bounds are not set here as this is also an expensive operation. Instead, we truncate overflowing text and content by filling a rectangle with background color column by column instead of cell by cell.  This column by column fill happens higher up on the stack in a calling function from fin-hypergrid-renderer.  Take note we do not do cell by cell border renderering as that is expensive.  Instead we render many fewer gridlines after all cells are rendered.
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     * @memberOf CellProvider.prototype
     */
    defaultCellPaint: function(gc, config) {
        var val = config.value,
            x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height,
            wrapHeaders = config.headerTextWrapping,
            leftPadding = 2, //TODO: fix this
            isHeader = config.y === 0;

        var leftIcon, rightIcon, centerIcon, ixoffset, iyoffset, font;

        // setting gc properties are expensive, let's not do it needlessly

        if (val && val.constructor === Array) {
            leftIcon = val[0];
            rightIcon = val[2];
            val = val[1];
            if (val && typeof val === 'object') {
                if (val.constructor.name === 'HTMLImageElement') { // must be an image
                    centerIcon = val;
                    val = null;
                }
            }
            if (leftIcon && leftIcon.nodeName !== 'IMG') {
                leftIcon = null;
            }
            if (rightIcon && rightIcon.nodeName !== 'IMG') {
                rightIcon = null;
            }
            if (centerIcon && centerIcon.nodeName !== 'IMG') {
                centerIcon = null;
            }
        }

        val = valOrFunc(val, config);
        val = config.formatValue(val);

        font = config.isSelected ? config.foregroundSelectionFont : config.font;

        if (gc.font !== font) {
            gc.font = font;
        }
        if (gc.textAlign !== 'left') {
            gc.textAlign = 'left';
        }
        if (gc.textBaseline !== 'middle') {
            gc.textBaseline = 'middle';
        }

        // fill background only if our bgColor is populated or we are a selected cell
        var backgroundColor, hover, hoverColor, selectColor,
            colors = [];

        if (config.isCellHovered && config.hoverCellHighlight.enabled) {
            hoverColor = config.hoverCellHighlight.backgroundColor;
        } else if (config.isRowHovered && (hover = config.hoverRowHighlight).enabled) {
            hoverColor = config.isGridColumn || !hover.header || hover.header.backgroundColor === undefined ? hover.backgroundColor : hover.header.backgroundColor;
        } else if (config.isColumnHovered && (hover = config.hoverColumnHighlight).enabled) {
            hoverColor = config.isGridRow || !hover.header || hover.header.backgroundColor === undefined ? hover.backgroundColor : hover.header.backgroundColor;
        }
        if (alpha(hoverColor) < 1) {
            if (config.isSelected) {
                selectColor = valOrFunc(config.backgroundSelectionColor, config);
            }
            if (alpha(selectColor) < 1) {
                backgroundColor = valOrFunc(config.backgroundColor, config);
                if (alpha(backgroundColor) > 0) {
                    colors.push(backgroundColor);
                }
            }
            if (selectColor !== undefined) {
                colors.push(selectColor);
            }
        }
        if (hoverColor !== undefined) {
            colors.push(hoverColor);
        }
        layerColors(gc, colors, x, y, width, height);

        // draw text
        var theColor = valOrFunc(config.isSelected ? config.foregroundSelectionColor : config.color, config);
        if (gc.fillStyle !== theColor) {
            gc.fillStyle = theColor;
            gc.strokeStyle = theColor;
        }

        if (isHeader && wrapHeaders) {
            this.renderMultiLineText(gc, config, val);
        } else {
            this.renderSingleLineText(gc, config, val);
        }

        var iconWidth = 0;
        if (leftIcon) {
            iyoffset = Math.round((height - leftIcon.height) / 2);
            gc.drawImage(leftIcon, x + leftPadding, y + iyoffset);
            iconWidth = Math.max(leftIcon.width + 2);
        }
        if (rightIcon && width > 1.75 * height) {
            iyoffset = Math.round((height - rightIcon.height) / 2);
            var rightX = x + width - rightIcon.width;
            if (backgroundColor !== undefined) {
                layerColors(gc, colors, rightX, y, rightIcon.width, height);
            } else {
                gc.clearRect(rightX, y, rightIcon.width, height);
            }
            gc.drawImage(rightIcon, rightX, y + iyoffset);
            iconWidth = Math.max(rightIcon.width + 2);
        }
        if (centerIcon) {
            iyoffset = Math.round((height - centerIcon.height) / 2);
            ixoffset = Math.round((width - centerIcon.width) / 2);
            gc.drawImage(centerIcon, x + width - ixoffset - centerIcon.width, y + iyoffset);
            iconWidth = Math.max(centerIcon.width + 2);
        }
        if (config.cellBorderThickness) {
            gc.beginPath();
            gc.rect(x, y, width, height);
            gc.lineWidth = config.cellBorderThickness;
            gc.strokeStyle = config.cellBorderStyle;

            // animate the dashed line a bit here for fun

            gc.stroke();
            gc.closePath();
        }
        config.minWidth = config.minWidth + 2 * (iconWidth);
    },

    /**
     * @summary Renders multiline text
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     * @memberOf CellProvider.prototype
     */
    renderMultiLineText: function(gc, config, val) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;
        var lines = fitText(gc, config, val, width);
        if (lines.length === 1) {
            return this.renderSingleLineText(gc, config, squeeze(val));
        }

        var colHEdgeOffset = config.cellPadding,
            halignOffset = 0,
            valignOffset = config.voffset,
            halign = config.halign,
            textHeight = config.getTextHeight(config.font).height;

        switch (halign) {
            case 'right':
                halignOffset = width - colHEdgeOffset;
                break;
            case 'center':
                halignOffset = width / 2;
                break;
            case 'left':
                halignOffset = colHEdgeOffset;
                break;
        }

        var hMin = 0, vMin = Math.ceil(textHeight / 2);

        valignOffset += Math.ceil((height - (lines.length - 1) * textHeight) / 2);

        halignOffset = Math.max(hMin, halignOffset);
        valignOffset = Math.max(vMin, valignOffset);

        gc.save(); // define a clipping region for cell
        gc.rect(x, y, width, height);
        gc.clip();

        gc.textAlign = halign;

        for (var i = 0; i < lines.length; i++) {
            gc.fillText(lines[i], x + halignOffset, y + valignOffset + (i * textHeight));
        }

        gc.restore(); // discard clipping region
    },

    /**
     * @summary Renders single line text.
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     * @memberOf CellProvider.prototype
     */
    renderSingleLineText: function(gc, config, val) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;
        var colHEdgeOffset = config.cellPadding,
            halignOffset = 0,
            valignOffset = config.voffset,
            halign = config.halign,
            isCellHovered = config.isCellHovered,
            isLink = config.link;

        var fontMetrics = config.getTextHeight(config.font);
        var textWidth = config.getTextWidth(gc, val);

        //we must set this in order to compute the minimum width
        //for column autosizing purposes
        config.minWidth = textWidth + (2 * colHEdgeOffset);

        switch (halign) {
            case 'right':
                //textWidth = config.getTextWidth(gc, config.value);
                halignOffset = width - colHEdgeOffset - textWidth;
                break;
            case 'center':
                //textWidth = config.getTextWidth(gc, config.value);
                halignOffset = (width - textWidth) / 2;
                break;
            case 'left':
                halignOffset = colHEdgeOffset;
                break;
        }

        halignOffset = Math.max(0, halignOffset);
        valignOffset = valignOffset + Math.ceil(height / 2);

        if (val !== null) {
            gc.fillText(val, x + halignOffset, y + valignOffset);
        }

        if (isCellHovered) {
            gc.beginPath();
            if (isLink) {
                underline(config, gc, val, x + halignOffset, y + valignOffset + Math.floor(fontMetrics.height / 2), 1);
                gc.stroke();
            }
            gc.closePath();
        }
        if (config.strikeThrough === true) {
            gc.beginPath();
            strikeThrough(config, gc, val, x + halignOffset, y + valignOffset + Math.floor(fontMetrics.height / 2), 1);
            gc.stroke();
            gc.closePath();
        }
    },

    /**
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     * @memberOf CellProvider.prototype
     * @desc Emerson's paint function for a slider button. currently the user cannot interact with it
     */
    paintSlider: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;
        gc.strokeStyle = 'white';
        var val = this.config.value;
        var radius = height / 2;
        var offset = width * val;
        var bgColor = this.config.isSelected ? this.config.bgSelColor : '#333333';
        var btnGradient = gc.createLinearGradient(x, y, x, y + height);
        btnGradient.addColorStop(0, bgColor);
        btnGradient.addColorStop(1, '#666666');
        var arcGradient = gc.createLinearGradient(x, y, x, y + height);
        arcGradient.addColorStop(0, '#aaaaaa');
        arcGradient.addColorStop(1, '#777777');
        gc.fillStyle = btnGradient;
        roundRect(gc, x, y, width, height, radius, btnGradient);
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
    },


    /**
     * @desc A rendering of the last Selection Model
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     * @memberOf CellProvider.prototype
     */
    paintLastSelection: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        var focusLineStep =  [
            [5, 5],
            [0, 1, 5, 4],
            [0, 2, 5, 3],
            [0, 3, 5, 2],
            [0, 4, 5, 1],
            [0, 5, 5, 0],
            [1, 5, 4, 0],
            [2, 5, 3, 0],
            [3, 5, 2, 0],
            [4, 5, 1, 0]
        ];
        gc.rect(x, y, width, height);
        gc.fillStyle = this.grid.resolveProperty('selectionRegionOverlayColor');
        gc.fill();
        gc.lineWidth = 1;
        gc.strokeStyle = this.grid.resolveProperty('selectionRegionOutlineColor');

        // animate the dashed line a bit here for fun

        gc.stroke();

        gc.rect(x, y, width, height);

        gc.strokeStyle = 'white';

        //animate the dashed line a bit here for fun
        gc.setLineDash(focusLineStep[Math.floor(10 * (Date.now() / 300 % 1)) % focusLineStep.length]);

        gc.stroke();
    },

    /**
     * @desc A simple implementation of a sparkline, because it's a barchart we've changed the name ;).
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     * @memberOf CellProvider.prototype
     */
    paintSparkbar: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        gc.beginPath();
        var val = this.config.value;
        if (!val || !val.length) {
            return;
        }
        var count = val.length;
        var eWidth = width / count;
        var fgColor = this.config.isSelected ? this.config.fgSelColor : this.config.fgColor;
        if (this.config.bgColor || this.config.isSelected) {
            gc.fillStyle = this.config.isSelected ? this.config.bgSelColor : this.config.bgColor;
            gc.fillRect(x, y, width, height);
        }
        gc.fillStyle = fgColor;
        for (var i = 0; i < val.length; i++) {
            var barheight = val[i] / 110 * height;
            gc.fillRect(x + 5, y + height - barheight, eWidth * 0.6666, barheight);
            x = x + eWidth;
        }
        gc.closePath();
        this.config.minWidth = count * 10;

    },

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
     * @memberOf CellProvider.prototype
     */
    renderCellError: function(gc, config, message) {
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
        //gc.strokeStyle = gc.createPattern(images.caution, 'repeat');
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
    },

    /**
     * @desc A simple implementation of a sparkline.  see [Edward Tufte sparkline](http://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR)
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     * @memberOf CellProvider.prototype
     */
    paintSparkline: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        gc.beginPath();
        var val = this.config.value;
        if (!val || !val.length) {
            return;
        }
        var count = val.length;
        var eWidth = width / count;

        var fgColor = this.config.isSelected ? this.config.fgSelColor : this.config.fgColor;
        if (this.config.bgColor || this.config.isSelected) {
            gc.fillStyle = this.config.isSelected ? this.config.bgSelColor : this.config.bgColor;
            gc.fillRect(x, y, width, height);
        }
        gc.strokeStyle = fgColor;
        gc.fillStyle = fgColor;
        gc.beginPath();
        var prev;
        for (var i = 0; i < val.length; i++) {
            var barheight = val[i] / 110 * height;
            if (!prev) {
                prev = barheight;
            }
            gc.lineTo(x + 5, y + height - barheight);
            gc.arc(x + 5, y + height - barheight, 1, 0, 2 * Math.PI, false);
            x = x + eWidth;
        }
        this.config.minWidth = count * 10;
        gc.stroke();
        gc.closePath();
    },

    /**
     * @desc A simple implementation of a tree cell renderer for use mainly with the qtree.
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     * @memberOf CellProvider.prototype
     */
    treeCellRenderer: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        var val = this.config.value.data;
        var indent = this.config.value.indent;
        var icon = this.config.value.icon;

        //fill background only if our bgColor is populated or we are a selected cell
        if (this.config.bgColor || this.config.isSelected) {
            gc.fillStyle = this.config.isSelected ? this.config.bgSelColor : this.config.bgColor;
            gc.fillRect(x, y, width, height);
        }

        if (!val || !val.length) {
            return;
        }
        var valignOffset = Math.ceil(height / 2);

        gc.fillStyle = this.config.isSelected ? this.config.fgSelColor : this.config.fgColor;
        gc.fillText(icon + val, x + indent, y + valignOffset);

        var textWidth = this.config.getTextWidth(gc, icon + val);
        var minWidth = x + indent + textWidth + 10;
        this.config.minWidth = minWidth;
    },

    /**
     * @desc An empty implementation of a cell renderer, see [the null object pattern](http://c2.com/cgi/wiki?NullObject).
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     * @memberOf CellProvider.prototype
     */
    emptyCellRenderer: function(gc, config) {},

    /**
     * @memberOf CellProvider.prototype
     * @private
     */
    initializeCells: function() {
        var self = this;
        this.cellCache.simpleCellRenderer = {
            paint: this.defaultCellPaint,
            renderSingleLineText: this.renderSingleLineText,
            renderMultiLineText: this.renderMultiLineText
        };
        this.cellCache.cellErrorRenderer = {
            paint: this.renderCellError
        };
        this.cellCache.sliderCellRenderer = {
            paint: this.paintSlider
        };
        this.cellCache.sparkbarCellRenderer = {
            paint: this.paintSparkbar
        };
        this.cellCache.sparklineCellRenderer = {
            paint: this.paintSparkline
        };
        this.cellCache.treeCellRenderer = {
            paint: this.treeCellRenderer
        };
        this.cellCache.emptyCellRenderer = {
            paint: this.emptyCellRenderer
        };
        this.cellCache.buttonRenderer = {
            paint: this.paintButton,
            //defaultCellPaint: this.defaultCellPaint
        };
        this.cellCache.linkCellRenderer = {
            paint: function(gc, config) {
                self.config = this.config;
                //todo: needs config.link ??
                self.defaultCellPaint(gc, config);
            }
        };
    }
});

function layerColors(gc, colors, x, y, width, height) {
    colors.forEach(function(color) {
        gc.fillStyle = color;
        gc.fillRect(x, y, width, height);
    });
}

function valOrFunc(vf, config) {
    var result = (typeof vf)[0] === 'f' ? vf(config) : vf;
    return result || result === 0 ? result : '';
}

function underline(config, gc, text, x, y, thickness) {
    var width = config.getTextWidth(gc, text);

    switch (gc.textAlign) {
        case 'center':
            x -= (width / 2);
            break;
        case 'right':
            x -= width;
            break;
    }

    //gc.beginPath();
    gc.lineWidth = thickness;
    gc.moveTo(x + 0.5, y + 0.5);
    gc.lineTo(x + width + 0.5, y + 0.5);
}

function strikeThrough(config, gc, text, x, y, thickness) {
    var fontMetrics = config.getTextHeight(config.font);
    var width = config.getTextWidth(gc, text);
    y = y - (fontMetrics.height * 0.4);

    switch (gc.textAlign) {
        case 'center':
            x -= (width / 2);
            break;
        case 'right':
            x -= width;
            break;
    }

    //gc.beginPath();
    gc.lineWidth = thickness;
    gc.moveTo(x + 0.5, y + 0.5);
    gc.lineTo(x + width + 0.5, y + 0.5);
}

function findLines(gc, config, words, width) {

    if (words.length === 1) {
        return words;
    }

    // starting with just the first word…
    var stillFits, line = [words.shift()];
    while (
        // so lone as line still fits within current column…
    (stillFits = config.getTextWidth(gc, line.join(' ')) < width)
        // …AND there are more words available…
    && words.length
        ) {
        // …add another word to end of line and retest
        line.push(words.shift());
    }

    if (
        !stillFits // if line is now too long…
        && line.length > 1 // …AND is multiple words…
    ) {
        words.unshift(line.pop()); // …back off by (i.e., remove) one word
    }

    line = [line.join(' ')];

    if (words.length) { // if there's anything left…
        line = line.concat(findLines(gc, config, words, width)); // …break it up as well
    }

    return line;
}

function fitText(gc, config, string, width) {
    return findLines(gc, config, squeeze(string).split(' '), width);
}

// trim string; then reduce all runs of multiple spaces to a single space
function squeeze(string) {
    return (string + '').trim().replace(/\s\s+/g, ' ');
}

function roundRect(gc, x, y, width, height, radius, fill, stroke) {

    if (!stroke) {
        stroke = true;
    }
    if (!radius) {
        radius = 5;
    }
    gc.beginPath();
    gc.moveTo(x + radius, y);
    gc.lineTo(x + width - radius, y);
    gc.quadraticCurveTo(x + width, y, x + width, y + radius);
    gc.lineTo(x + width, y + height - radius);
    gc.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    gc.lineTo(x + radius, y + height);
    gc.quadraticCurveTo(x, y + height, x, y + height - radius);
    gc.lineTo(x, y + radius);
    gc.quadraticCurveTo(x, y, x + radius, y);
    gc.closePath();
    if (stroke) {
        gc.stroke();
    }
    if (fill) {
        gc.fill();
    }
    gc.closePath();
}

function alpha(cssColorSpec) {
    if (cssColorSpec === undefined) {
        // undefined so not visible; treat as transparent
        return 0;
    }

    var matches = cssColorSpec.match(alpha.regex);

    if (matches === null) {
        // an opaque color (a color spec with no alpha channel)
        return 1;
    }

    var A = matches[4];

    if (A === undefined) {
        // cssColorSpec must have been 'transparent'
        return 0;
    }

    return Number(A);
}

alpha.regex = /^(transparent|((RGB|HSL)A\(.*,\s*([\d\.]+)\)))$/i;

module.exports = CellProvider;
