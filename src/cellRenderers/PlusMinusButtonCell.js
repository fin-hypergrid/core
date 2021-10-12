
var CellRenderer = require('./CellRenderer');
var Rectangle = require('rectangular').Rectangle;
import { renderMultiLineText, renderSingleLineText, layerColors } from './SimpleCell';

/**
 * @typedef {any} SimpleCellType TODO
 */

var WHITESPACE = /\s\s+/g;

/**
 * @constructor
 * @summary This class is a copy of SimpleCell render with extra implementation on supporting two buttons on the same cell
 * @desc Great care has been taken in crafting this function as it needs to perform extremely fast.
 *
 * Use `gc.cache` instead which we have implemented to cache the graphics context properties. Reads on the graphics context (`gc`) properties are expensive but not quite as expensive as writes. On read of a `gc.cache` prop, the actual `gc` prop is read into the cache once and from then on only the cache is referenced for that property. On write, the actual prop is only written to when the new value differs from the cached value.
 *
 * Clipping bounds are not set here as this is also an expensive operation. Instead, we employ a number of strategies to truncate overflowing text and content.
 *
 * @extends CellRenderer
 */
// @ts-ignore TODO - use classes
var PlusMinusButtonCell = CellRenderer.extend('PlusMinusButtonCell', {
    paint: function(gc, config) {
        var val = config.value,
            bounds = config.bounds,
            x = bounds.x,
            y = bounds.y,
            width = bounds.width,
            height = bounds.height,
            iconPadding = config.iconPadding,
            partialRender = config.prefillColor === undefined, // signifies abort before rendering if same
            snapshot = config.snapshot,
            same = snapshot && partialRender,
            valWidth = 0,
            textColor, textFont,
            ixoffset, iyoffset,
            leftIcon, rightIcon, centerIcon,
            leftIconId, rightIconId,
            leftPadding, rightPadding,
            hover, hoverColor, selectColor, foundationColor, inheritsBackgroundColor,
            c, colors;

        // setting gc properties are expensive, let's not do it needlessly

        if (val && val.constructor === Array) {
            leftIcon = val[0];
            rightIcon = val[2];
            leftIconId = leftIcon?.id
            rightIconId = rightIcon?.id
            val = config.exec(val[1]);
            if (val && val.naturalWidth !== undefined) { // must be an image (much faster than instanceof HTMLImageElement)
                centerIcon = val;
                val = null;
            }
        }

        // Note: vf == 0 is fastest equivalent of vf === 0 || vf === false which excludes NaN, null, undefined
        var renderValue = val || config.renderFalsy && val == 0; // eslint-disable-line eqeqeq

        if (renderValue) {
            val = config.formatValue(val, config);

            textFont = config.isSelected ? config.foregroundSelectionFont : config.font;

            textColor = gc.cache.strokeStyle = config.isSelected
                ? config.foregroundSelectionColor
                : config.color;
        } else {
            val = '';
        }

        same = same &&
            val === snapshot.value &&
            textFont === snapshot.textFont &&
            textColor === snapshot.textColor;

        // fill background only if our bgColor is populated or we are a selected cell
        colors = [];
        c = 0;
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
                    same = same &&  foundationColor === snapshot.foundationColor &&
                        config.backgroundColor === snapshot.colors[c++];
                }
            }

            if (selectColor !== undefined) {
                colors.push(selectColor);
                same = same && selectColor === snapshot.colors[c++];
            }
        }
        if (hoverColor !== undefined) {
            colors.push(hoverColor);
            same = same && hoverColor === snapshot.colors[c++];
        }

        // VC-5714 instead of comparing the entire image object, we use id to check if the images has been updated.
        same = same &&
            leftIconId === snapshot.leftIconId &&
            rightIconId === snapshot.rightIconId

        if (same && c === snapshot.colors.length) {
            // VC-5714 incase nothing changed we still need to get the click rect from the last snapshot
            config.leftClickRect = config.snapshot?.leftClickRect
            config.rightClickRect = config.snapshot?.rightClickRect
            return;
        }

        // return a snapshot to save in cellEvent for future comparisons by partial renderer
        config.snapshot = {
            value: val,
            textColor: textColor,
            textFont: textFont,
            foundationColor: foundationColor,
            colors: colors,
            leftIconId: leftIconId,
            rightIconId: rightIconId
        };

        layerColors(gc, colors, x, y, width, height, foundationColor);

        // Measure left and right icons, needed for rendering and for return value (min width)
        leftPadding = leftIcon ? iconPadding + leftIcon.width + iconPadding : config.cellPadding;
        rightPadding = rightIcon ? iconPadding + rightIcon.width + iconPadding : config.cellPadding;

        if (renderValue) {
            // draw text
            gc.cache.fillStyle = textColor;
            gc.cache.font = textFont;
            valWidth = config.isHeaderRow && config.headerTextWrapping
                ? renderMultiLineText(gc, config, val, leftPadding, rightPadding)
                : renderSingleLineText(gc, config, val, leftPadding, rightPadding);
        }

        if (leftIcon) {
            // Draw left icon
            iyoffset = Math.round((height - leftIcon.height) / 2);
            gc.drawImage(leftIcon, x + iconPadding, y + iyoffset, leftIcon.width, leftIcon.height); // see [SIZE NOTE]!
            config.leftClickRect = new Rectangle(iconPadding, config.appendHeightToClickRect ? y + iyoffset: iyoffset, leftIcon.width, leftIcon.height);
            config.snapshot.leftClickRect = config.leftClickRect
        }

        if (rightIcon) {
            // Repaint background before painting right icon, because text may have flowed under where it will be.
            // This is a work-around to clipping which is too expensive to perform here.
            ixoffset = width - (rightIcon.width + iconPadding);
            var rightX = x + ixoffset;
            if (inheritsBackgroundColor) {
                foundationColor = true;
                colors.unshift(config.backgroundColor);
            }
            layerColors(gc, colors, rightX, y, rightPadding, height, foundationColor);

            // Draw right icon
            iyoffset = Math.round((height - rightIcon.height) / 2);
            gc.drawImage(rightIcon, rightX, y + iyoffset, rightIcon.width, rightIcon.height); // see [SIZE NOTE]!
            config.rightClickRect =  new Rectangle(ixoffset, config.appendHeightToClickRect ? y + iyoffset: iyoffset, rightIcon.width, rightIcon.height);
            config.snapshot.rightClickRect = config.rightClickRect
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

module.exports = PlusMinusButtonCell;
