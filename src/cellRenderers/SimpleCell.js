'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @extends CellRenderer
 */
var SimpleCell = CellRenderer.extend('SimpleCell', {

    /**
     * @summary The default cell rendering function for rendering a vanilla cell.
     * @desc Great care has been taken in crafting this function as it needs to perform extremely fast. Reads on the gc object are expensive but not quite as expensive as writes to it. We do our best to avoid writes, then avoid reads. Clipping bounds are not set here as this is also an expensive operation. Instead, we truncate overflowing text and content by filling a rectangle with background color column by column instead of cell by cell.  This column by column fill happens higher up on the stack in a calling function from fin-hypergrid-renderer.  Take note we do not do cell by cell border renderering as that is expensive.  Instead we render many fewer gridlines after all cells are rendered.
     * @param {CanvasGraphicsContext} gc
     * @param {object} config
     * @param {Rectangle} config.bounds - The clipping rect of the cell to be rendered.
     * @param {number} config.x - the "translated" index into the `behavior.allColumns` array
     * @param {number} config.normalizedY - the vertical grid coordinate normalized to first data row
     * @param {number} config.untranslatedX - the horizontal grid coordinate measured from first data column
     * @param {number} config.y - the vertical grid coordinate measured from top header row
     * @memberOf SimpleCell.prototype
     */
    paint: function(gc, config) {
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
     * @summary Renders single line text.
     * @param {CanvasGraphicsContext} gc
     * @param {object} config
     * @param {Rectangle} config.bounds - The clipping rect of the cell to be rendered.
     * @param {*} val - The text to render in the cell.
     * @memberOf SimpleCell.prototype
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
        gc.beginPath();
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
     * @param {object} config
     * @param {Rectangle} config.bounds - The clipping rect of the cell to be rendered.
     * @param {*} val - The text to render in the cell.
     * @memberOf SimpleCell.prototype
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
    }
});


function fitText(gc, config, string, width) {
    return findLines(gc, config, squeeze(string).split(' '), width);
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

// trim string; then reduce all runs of multiple spaces to a single space
function squeeze(string) {
    return (string + '').trim().replace(/\s\s+/g, ' ');
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

function layerColors(gc, colors, x, y, width, height) {
    colors.forEach(function(color) {
        gc.fillStyle = color;
        gc.fillRect(x, y, width, height);
    });
}

function valOrFunc(vf, config) {
    var result = config.isGridColumn && config.isGridRow && (typeof vf)[0] === 'f'
        ? vf(config.dataRow, config.columnName, config.x)
        : vf;
    return result || result === 0 || result === false ? result : '';
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

module.exports = SimpleCell;
