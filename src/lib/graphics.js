/* eslint-env browser */

'use strict';

function clearFill(x, y, width, height, color) {
    var a = alpha(color);
    if (a < 1) {
        // If background is translucent, we must clear the rect before the fillRect
        // below to prevent mixing with previous frame's render of this cell.
        this.clearRect(x, y, width, height);
    }
    if (a > 0) {
        this.cache.fillStyle = color;
        this.fillRect(x, y, width, height);
    }
}

var ALPHA_REGEX = /^(transparent|((RGB|HSL)A\(.*,\s*([\d\.]+)\)))$/i;
// Tried using an `alphaCache` here but it didn't make a measurable difference.
function alpha(cssColorSpec) {
    var matches, result;

    if (!cssColorSpec) {
        // undefined so not visible; treat as transparent
        result = 0;
    } else if ((matches = cssColorSpec.match(ALPHA_REGEX)) === null) {
        // an opaque color (a color spec with no alpha channel)
        result = 1;
    } else if (matches[4] === undefined) {
        // cssColorSpec must have been 'transparent'
        result = 0;
    } else {
        result = Number(matches[4]);
    }

    return result;
}

var fontMetrics = {};

/**
 * Accumulates width of string in pixels, character by character, by chaching character widths and reusing those values when previously cached.
 *
 * NOTE: There is a minor measuring error when taking the sum of the pixel widths of individual characters that make up a string vs. the pixel width of the string taken as a whole. This is possibly due to kerning or rounding. The error is typically about 0.1%.
 * @memberOf module:defaults
 * @param {CanvasRenderingContext2D} gc
 * @param {string} string - Text to measure.
 * @returns {nubmer} Width of string in pixels.
 */
function getTextWidth(string) {
    var metrics = fontMetrics[this.cache.font] = fontMetrics[this.cache.font] || {};
    string += '';
    for (var i = 0, sum = 0, len = string.length; i < len; ++i) {
        var c = string[i];
        sum += metrics[c] = metrics[c] || this.measureText(c).width;
    }
    return sum;
}

/**
 * Similar to `getTextWidth` except:
 * 1. Aborts accumulating when sum exceeds given `width`.
 * 2. Returns an object containing both the truncated string and the sum (rather than a number primitive containing the sum alone).
 * @param {CanvasRenderingContext2D} gc
 * @param {string} string - Text to measure.
 * @param {number} width - Width of target cell; overflow point.
 * @param {boolean} [abort=false] - Abort measuring upon overflow. Returned `width` sum will reflect truncated string rather than untruncated string. Note that returned `string` is truncated in either case.
 * @returns {{string:string,width:number}}
 * * `object.string` - `undefined` if it fits; truncated version of provided `string` if it does not.
 * * `object.width` - Width of provided `string` if it fits; width of truncated string if it does not.
 */
function getTextWidthTruncated(string, width, abort) {
    var metrics = fontMetrics[this.cache.font] = fontMetrics[this.cache.font] || {},
        truncString;
    string += ''; // convert to string
    width -= 1; // fudge for less than *or* more-or-less equal
    for (var i = 0, sum = 0, len = string.length; i < len; ++i) {
        var char = string[i];
        var charWidth = metrics[char] = metrics[char] || this.measureText(char).width;
        sum += charWidth;
        if (!truncString && sum > width) {
            if (this.truncPartialChar) {
                sum -= charWidth;
                truncString = string.substr(0, i);
            } else if (++i < string.length) {
                truncString = string.substr(0, i);
            }
            if (abort) { break; }
        }
    }
    return {
        string: truncString,
        width: sum
    };
}

var fontData = {};

/**
 * @memberOf module:defaults
 * @param font
 * @returns {*}
 */
function getTextHeight(font) {
    var result = fontData[font];

    if (!result) {
        result = {};

        var text = document.createElement('span');
        text.textContent = 'Hg';
        text.style.font = font;

        var block = document.createElement('div');
        block.style.display = 'inline-block';
        block.style.width = '1px';
        block.style.height = '0px';

        var div = document.createElement('div');
        div.appendChild(text);
        div.appendChild(block);

        div.style.position = 'absolute';
        document.body.appendChild(div);

        try {

            block.style.verticalAlign = 'baseline';

            var blockRect = block.getBoundingClientRect();
            var textRect = text.getBoundingClientRect();

            result.ascent = blockRect.top - textRect.top;

            block.style.verticalAlign = 'bottom';
            result.height = blockRect.top - textRect.top;

            result.descent = result.height - result.ascent;

        } finally {
            document.body.removeChild(div);
        }
        if (result.height !== 0) {
            fontData[font] = result;
        }
    }

    return result;
}

module.exports = {
    clearFill: clearFill,
    alpha: alpha,
    getTextWidth: getTextWidth,
    getTextWidthTruncated: getTextWidthTruncated,
    getTextHeight: getTextHeight
};
