'use strict';
/**
 *
 * @module features\base
 * @desc instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

function CellProvider() {
    this.cellCache = {};
    this.initializeCells();
}

CellProvider.prototype = {}; // TODO: What purpose does this serve?

/**
 * @function
 * @description replace this function in on your instance of cellProvider
 * @returns cell
 * @param {object} config - an object with everything you might need for renderering a cell
 * @instance
 */
CellProvider.prototype.getCell = function(config) {
    var cell = this.cellCache.simpleCellRenderer;
    cell.config = config;
    return cell;
};

/**
 * @function
 * @description replace this function in on your instance of cellProvider
 * @returns cell
 * @param {object} config - an object with everything you might need for renderering a cell
 * @instance
 */
CellProvider.prototype.getColumnHeaderCell = function(config) {
    var cell = this.cellCache.simpleCellRenderer;
    cell.config = config;
    return cell;
};

/**
 * @function
 * @description replace this function in on your instance of cellProvider
 * @returns cell
 * @param {object} config - an object with everything you might need for renderering a cell
 * @instance
 */
CellProvider.prototype.getRowHeaderCell = function(config) {
    var cell = this.cellCache.simpleCellRenderer;
    cell.config = config;
    return cell;
};

CellProvider.prototype.paintButton = function(gc, config) {
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
};

/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {number} x - the x screen coordinate of my origin
 * @param {number} y - the y screen coordinate of my origin
 * @param {number} width - the width I'm allowed to draw within
 * @param {number} height - the height I'm allowed to draw within
 * @param {boolean} isLink - is this a hyperlink cell
 * @instance
 * @description
This is the default cell rendering function for rendering a vanilla cell. Great care was taken in crafting this function as it needs to perform extremely fast. Reads on the gc object are expensive but not quite as expensive as writes to it. We do our best to avoid writes, then avoid reads. Clipping bounds are not set here as this is also an expensive operation. Instead, we truncate overflowing text and content by filling a rectangle with background color column by column instead of cell by cell.  This column by column fill happens higher up on the stack in a calling function from fin-hypergrid-renderer.  Take note we do not do cell by cell border renderering as that is expensive.  Instead we render many fewer gridlines after all cells are rendered.
*/
CellProvider.prototype.defaultCellPaint = function(gc, config) {
    var val = config.value,
        x = config.bounds.x,
        y = config.bounds.y,
        width = config.bounds.width,
        height = config.bounds.height,
        wrapHeaders = config.headerTextWrapping,
        leftPadding = 2, //TODO: fix this
        isHeader = config.y === 0;

    var leftIcon, rightIcon, centerIcon, ixoffset, iyoffset;

    //setting gc properties are expensive, lets not do it unnecessarily

    if (val && val.constructor === Array) {
        leftIcon = val[0];
        rightIcon = val[2];
        val = val[1];
        if (typeof val === 'object') { // must be an image
            centerIcon = val;
            val = null;
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

    val = valueOrFunctionExecute(config, val);

    if (gc.font !== config.font) {
        gc.font = config.font;
    }
    if (gc.textAlign !== 'left') {
        gc.textAlign = 'left';
    }
    if (gc.textBaseline !== 'middle') {
        gc.textBaseline = 'middle';
    }


    //fill background only if our bgColor is populated or we are a selected cell
    if (config.backgroundColor || config.isSelected) {
        gc.fillStyle = valueOrFunctionExecute(config, config.isSelected ? config.backgroundSelectionColor : config.backgroundColor);
        gc.fillRect(x, y, width, height);
    }

    //draw text
    var theColor = valueOrFunctionExecute(config, config.isSelected ? config.foregroundSelectionColor : config.color);
    if (gc.fillStyle !== theColor) {
        gc.fillStyle = theColor;
        gc.strokeStyle = theColor;
    }

    if (isHeader && wrapHeaders) {
        this.renderMultiLineText(x, y, height, width, gc, config, val);
    } else {
        this.renderSingleLineText(x, y, height, width, gc, config, val);
    }

    if (config.isInCurrentSelectionRectangle) {
        gc.fillStyle = 'rgba(0, 0, 0, 0.2)';
        gc.fillRect(x, y, width, height);
    }
    var iconWidth = 0;
    if (leftIcon) {
        iyoffset = Math.round((height - leftIcon.height) / 2);
        gc.drawImage(leftIcon, x + leftPadding, y + iyoffset);
        iconWidth = Math.max(leftIcon.width + 2);
    }
    if (rightIcon) {
        iyoffset = Math.round((height - rightIcon.height) / 2);
        ixoffset = 0; //Math.round((halignOffset - rightIcon.width) / 2);
        gc.drawImage(rightIcon, x + width - ixoffset - rightIcon.width, y + iyoffset);
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
};

CellProvider.prototype.renderMultiLineText = function(x, y, height, width, gc, config, val) {
    var lines = fitText(gc, config, val, width);
    if (lines.length === 1) {
        return this.renderSingleLineText.apply(this, arguments);
    }

    var colHEdgeOffset = config.cellPadding,
        halignOffset = 0,
        valignOffset = config.voffset,
        halign = config.halign,
        //textWidth = config.getTextWidth(gc, val),
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
    gc.moveTo(x, y);
    gc.lineTo(x + width, y);
    gc.lineTo(x + width, y + height);
    gc.lineTo(x, y + height);
    gc.lineTo(x, y);
    gc.closePath();
    gc.clip();

    gc.textAlign = halign;

    for (var i = 0; i < lines.length; i++) {
        gc.fillText(lines[i], x + halignOffset, y + valignOffset + (i * textHeight));
    }

    gc.restore(); // discard clipping region
};

CellProvider.prototype.renderSingleLineText = function(x, y, height, width, gc, config, val) {
    val = squeeze(val);

    var colHEdgeOffset = config.cellPadding,
        halignOffset = 0,
        valignOffset = config.voffset,
        halign = config.halign,
        isColumnHovered = config.isColumnHovered,
        isRowHovered = config.isRowHovered,
        isLink = isLink || false;

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

    if (isColumnHovered && isRowHovered) {
        gc.beginPath();
        if (isLink) {
            underline(config, gc, val, x + halignOffset, y + valignOffset + Math.floor(fontMetrics.height / 2), 1);
            gc.stroke();
        }
        gc.closePath();
    }
};

/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {number} x - the x screen coordinate of my origin
 * @param {number} y - the y screen coordinate of my origin
 * @param {number} width - the width I'm allowed to draw within
 * @param {number} height - the height I'm allowed to draw within
 * @param {boolean} isLink - is this a hyperlink cell
 * @instance
 * @description emersons paint function for a slider button. currently the user cannot interact with it
 */
CellProvider.prototype.paintSlider = function(gc, x, y, width, height) {
    // gc.strokeStyle = 'white';
    // var val = this.config.value;
    // var radius = height / 2;
    // var offset = width * val;
    // var bgColor = this.config.isSelected ? this.config.bgSelColor : '#333333';
    // var btnGradient = gc.createLinearGradient(x, y, x, y + height);
    // btnGradient.addColorStop(0, bgColor);
    // btnGradient.addColorStop(1, '#666666');
    // var arcGradient = gc.createLinearGradient(x, y, x, y + height);
    // arcGradient.addColorStop(0, '#aaaaaa');
    // arcGradient.addColorStop(1, '#777777');
    // gc.fillStyle = btnGradient;
    // roundRect(gc, x, y, width, height, radius, btnGradient);
    // if (val < 1.0) {
    //     gc.fillStyle = arcGradient;
    // } else {
    //     gc.fillStyle = '#eeeeee';
    // }
    // gc.beginPath();
    // gc.arc(x + Math.max(offset - radius, radius), y + radius, radius, 0, 2 * Math.PI);
    // gc.fill();
    // gc.closePath();
    // this.config.minWidth = 100;
};

/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {number} x - the x screen coordinate of my origin
 * @param {number} y - the y screen coordinate of my origin
 * @param {number} width - the width I'm allowed to draw within
 * @param {number} height - the height I'm allowed to draw within
 * @param {boolean} isLink - is this a hyperlink cell
 * @instance
 * @desc simple implementation of a sparkline.  see [Edward Tufte sparkline](http://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR)
 */
CellProvider.prototype.paintSparkbar = function(gc, x, y, width, height) {
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

};


/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {number} x - the x screen coordinate of my origin
 * @param {number} y - the y screen coordinate of my origin
 * @param {number} width - the width I'm allowed to draw within
 * @param {number} height - the height I'm allowed to draw within
 * @param {boolean} isLink - is this a hyperlink cell
 * @instance
 * @description
simple implementation of a sparkline, because it's a barchart we've changed the name ;).  see [Edward Tufte sparkline](http://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR)
*/
CellProvider.prototype.paintSparkline = function(gc, x, y, width, height) {
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
};

/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {number} x - the x screen coordinate of my origin
 * @param {number} y - the y screen coordinate of my origin
 * @param {number} width - the width I'm allowed to draw within
 * @param {number} height - the height I'm allowed to draw within
 * @param {boolean} isLink - is this a hyperlink cell
 * @instance
 * @desc this is a simple implementation of a tree cell renderer for use mainly with the qtree
 */
CellProvider.prototype.treeCellRenderer = function(gc, x, y, width, height) {
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
};

/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {number} x - the x screen coordinate of my origin
 * @param {number} y - the y screen coordinate of my origin
 * @param {number} width - the width I'm allowed to draw within
 * @param {number} height - the height I'm allowed to draw within
 * @instance
 * @param {boolean} isLink - is this a hyperlink cell
 * @desc this is an empty implementation of a cell renderer, see [the null object pattern](http://c2.com/cgi/wiki?NullObject)
 */
CellProvider.prototype.emptyCellRenderer = function(gc, x, y, width, height) {};

/**
 * @function
 * @instance
 * @private
 */
CellProvider.prototype.initializeCells = function() {
    var self = this;
    this.cellCache.simpleCellRenderer = {
        paint: this.defaultCellPaint,
        renderSingleLineText: this.renderSingleLineText,
        renderMultiLineText: this.renderMultiLineText
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
        paint: function(gc, x, y, width, height) {
            self.config = this.config;
            self.defaultCellPaint(gc, x, y, width, height, true);
        },
    };
};


function valueOrFunctionExecute(config, valueOrFunction) {
    var isFunction = (((typeof valueOrFunction)[0]) === 'f');
    var result = isFunction ? valueOrFunction(config) : valueOrFunction;
    if (!result && result !== 0) {
        return '';
    }
    return result;
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
    return string.toString().trim().replace(/\s\s+/g, ' ');
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

module.exports = CellProvider;
