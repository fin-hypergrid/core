'use strict';

var CellRenderer = require('./CellRenderer');

var WHITESPACE = /\s\s+/g;

/**
 * @constructor
 * @extends CellRenderer
 */
var SimpleCell = CellRenderer.extend('SimpleCell', {

    /**
     * @summary The default cell rendering function for rendering a vanilla cell.
     * @desc Great care has been taken in crafting this function as it needs to perform extremely fast. Reads on the gc object are expensive but not quite as expensive as writes to it. We do our best to avoid writes, then avoid reads. Clipping bounds are not set here as this is also an expensive operation. Instead, we truncate overflowing text and content by filling a rectangle with background color column by column instead of cell by cell.  This column by column fill happens higher up on the stack in a calling function from fin-hypergrid-renderer.  Take note we do not do cell by cell border rendering as that is expensive.  Instead we render many fewer gridlines after all cells are rendered.
     * @implements paintFunction
     * @memberOf SimpleCell.prototype
     */
    paint: function(gc, config) {
        var val = config.value,
            bounds = config.bounds,
            x = bounds.x,
            y = bounds.y,
            width = bounds.width,
            height = bounds.height,
            iconPadding = config.iconPadding,
            valWidth = 0,
            ixoffset, iyoffset,
            leftIcon, rightIcon, centerIcon,
            leftPadding, rightPadding,
            foundationColor;

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
            if (rightIcon && (rightIcon.nodeName !== 'IMG' || width < 1.75 * height)) {
                rightIcon = null;
            }
            if (centerIcon && centerIcon.nodeName !== 'IMG') {
                centerIcon = null;
            }
        }

        // fill background only if our bgColor is populated or we are a selected cell
        var hover, hoverColor, selectColor, inheritsBackgroundColor,
            colors = [];

        if (config.isCellHovered && config.hoverCellHighlight.enabled) {
            hoverColor = config.hoverCellHighlight.backgroundColor;
        } else if (config.isRowHovered && (hover = config.hoverRowHighlight).enabled) {
            hoverColor = config.isDataColumn || !hover.header || hover.header.backgroundColor === undefined ? hover.backgroundColor : hover.header.backgroundColor;
        } else if (config.isColumnHovered && (hover = config.hoverColumnHighlight).enabled) {
            hoverColor = config.isDataRow || !hover.header || hover.header.backgroundColor === undefined ? hover.backgroundColor : hover.header.backgroundColor;
        }
        if (gc.alpha(hoverColor) < 1) {
            if (config.isSelected) {
                selectColor = config.backgroundSelectionColor;
            }

            if (gc.alpha(selectColor) < 1) {
                inheritsBackgroundColor = (config.backgroundColor === config.prefillColor);
                if (!inheritsBackgroundColor) {
                    foundationColor = true;
                    colors.push(config.backgroundColor);
                }
            }

            if (selectColor !== undefined) {
                colors.push(selectColor);
            }
        }
        if (hoverColor !== undefined) {
            colors.push(hoverColor);
        }
        layerColors(gc, colors, x, y, width, height, foundationColor);

        if (leftIcon) {
            // Measure & draw left icon
            iyoffset = Math.round((height - leftIcon.height) / 2);
            gc.drawImage(leftIcon, x + iconPadding, y + iyoffset);
            leftPadding = iconPadding + leftIcon.width + iconPadding;
        } else {
            leftPadding = config.cellPadding;
        }

        if (rightIcon) {
            // Measure right icon
            rightPadding = iconPadding + rightIcon.width + iconPadding;
        } else {
            rightPadding = config.cellPadding;
        }

        if (centerIcon) {
            // Measure & draw center icon
            iyoffset = Math.round((height - centerIcon.height) / 2);
            ixoffset = Math.round((width - centerIcon.width) / 2);
            gc.drawImage(centerIcon, x + width - ixoffset - centerIcon.width, y + iyoffset);
            valWidth = iconPadding + centerIcon.width + iconPadding;
        }

        if (val) {
            val = config.exec(val);

            // Note: vf == 0 is fastest equivalent of vf === 0 || vf === false which excludes NaN, null, undefined
            val = val || val == 0 ? val : ''; // eslint-disable-line eqeqeq

            val = config.formatValue(val, config);

            gc.cache.font = config.isSelected ? config.foregroundSelectionFont : config.font;
            gc.cache.textAlign = 'left';
            gc.textBaseline = 'middle';

            // draw text
            gc.cache.fillStyle = gc.cache.strokeStyle = config.isSelected
                ? config.foregroundSelectionColor
                : config.color;

            valWidth = config.isHeaderRow && config.headerTextWrapping
                ? renderMultiLineText(gc, config, val, leftPadding, rightPadding)
                : renderSingleLineText(gc, config, val, leftPadding, rightPadding);
        }

        if (rightIcon) {
            // Draw right icon on top of text that may have flowed under where it will be
            iyoffset = Math.round((height - rightIcon.height) / 2);
            var rightX = x + width - (rightIcon.width + iconPadding);
            if (inheritsBackgroundColor) {
                foundationColor = true;
                colors.unshift(config.backgroundColor);
            }
            layerColors(gc, colors, rightX, y, rightPadding, height, foundationColor);
            gc.drawImage(rightIcon, rightX, y + iyoffset);
        }

        if (config.cellBorderThickness) {
            gc.beginPath();
            gc.rect(x, y, width, height);
            gc.cache.lineWidth = config.cellBorderThickness;
            gc.cache.strokeStyle = config.cellBorderStyle;
            gc.stroke();
            gc.closePath();
        }

        config.minWidth = leftPadding + valWidth + rightPadding;
    }
});

/**
 * @summary Renders single line text.
 * @param {CanvasRenderingContext2D} gc
 * @param {object} config
 * @param {Rectangle} config.bounds - The clipping rect of the cell to be rendered.
 * @param {*} val - The text to render in the cell.
 * @memberOf SimpleCell.prototype
 */
function renderMultiLineText(gc, config, val, leftPadding, rightPadding) {
    var x = config.bounds.x,
        y = config.bounds.y,
        width = config.bounds.width,
        height = config.bounds.height,
        cleanVal = (val + '').trim().replace(WHITESPACE, ' '), // trim and squeeze whitespace
        lines = findLines(gc, config, cleanVal.split(' '), width);

    if (lines.length === 1) {
        return renderSingleLineText(gc, config, cleanVal, leftPadding, rightPadding);
    }

    var halignOffset = leftPadding,
        valignOffset = config.voffset,
        halign = config.halign,
        textHeight = gc.getTextHeight(config.font).height;

    switch (halign) {
        case 'right':
            halignOffset = width - rightPadding;
            break;
        case 'center':
            halignOffset = width / 2;
            break;
    }

    var hMin = 0, vMin = Math.ceil(textHeight / 2);

    valignOffset += Math.ceil((height - (lines.length - 1) * textHeight) / 2);

    halignOffset = Math.max(hMin, halignOffset);
    valignOffset = Math.max(vMin, valignOffset);

    gc.cache.save(); // define a clipping region for cell
    gc.beginPath();
    gc.rect(x, y, width, height);
    gc.clip();

    gc.cache.textAlign = halign;

    for (var i = 0; i < lines.length; i++) {
        gc.fillText(lines[i], x + halignOffset, y + valignOffset + (i * textHeight));
    }

    gc.cache.restore(); // discard clipping region

    return width;
}

/**
 * @summary Renders single line text.
 * @param {CanvasRenderingContext2D} gc
 * @param {object} config
 * @param {Rectangle} config.bounds - The clipping rect of the cell to be rendered.
 * @param {*} val - The text to render in the cell.
 * @memberOf SimpleCell.prototype
 */
function renderSingleLineText(gc, config, val, leftPadding, rightPadding) {
    var x = config.bounds.x,
        y = config.bounds.y,
        width = config.bounds.width,
        height = config.bounds.height,
        halignOffset = leftPadding,
        valignOffset = config.voffset,
        halign = config.halign,
        isCellHovered = config.isCellHovered,
        isLink = config.link,
        fontMetrics = gc.getTextHeight(config.font),
        minWidth,
        metrics;

    if (config.columnAutosizing) {
        metrics = gc.getTextWidthTruncated(val, width);
        minWidth = metrics.width;
        val = metrics.string || val;
        switch (halign) {
            case 'right':
                halignOffset = width - rightPadding - metrics.width;
                break;
            case 'center':
                halignOffset = (width - metrics.width) / 2;
                break;
        }
    } else {
        metrics = gc.getTextWidthTruncated(val, width, true);
        minWidth = 0;
        if (metrics.string) {
            val = metrics.string;
        } else {
            switch (halign) {
                case 'right':
                    halignOffset = width - rightPadding - metrics.width;
                    break;
                case 'center':
                    halignOffset = (width - metrics.width) / 2;
                    break;
            }
        }
    }

    halignOffset = Math.max(leftPadding, halignOffset);
    valignOffset += Math.ceil(height / 2);

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

    return minWidth;
}

function findLines(gc, config, words, width) {

    if (words.length === 1) {
        return words;
    }

    // starting with just the first word…
    var stillFits, line = [words.shift()];
    while (
        // so lone as line still fits within current column…
    (stillFits = gc.getTextWidth(line.join(' ')) < width)
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

function strikeThrough(config, gc, text, x, y, thickness) {
    var fontMetrics = gc.getTextHeight(config.font);
    var width = gc.getTextWidth(text);
    y -= fontMetrics.height * 0.4;

    switch (gc.cache.textAlign) {
        case 'center':
            x -= width / 2;
            break;
        case 'right':
            x -= width;
            break;
    }

    //gc.beginPath();
    gc.cache.lineWidth = thickness;
    gc.moveTo(x + 0.5, y + 0.5);
    gc.lineTo(x + width + 0.5, y + 0.5);
}

function underline(config, gc, text, x, y, thickness) {
    var width = gc.getTextWidth(text);

    switch (gc.cache.textAlign) {
        case 'center':
            x -= width / 2;
            break;
        case 'right':
            x -= width;
            break;
    }

    //gc.beginPath();
    gc.cache.lineWidth = thickness;
    gc.moveTo(x + 0.5, y + 0.5);
    gc.lineTo(x + width + 0.5, y + 0.5);
}

function layerColors(gc, colors, x, y, width, height, foundationColor) {
    colors.forEach(function(color, i) {
        if (foundationColor && !i) {
            gc.clearFill(x, y, width, height, color);
        } else {
            gc.cache.fillStyle = color;
            gc.fillRect(x, y, width, height);
        }
    });
}

module.exports = SimpleCell;
