/* eslint-env browser */

/**
 * @module localization
 */

'use strict';

/**
 * @summary Create a number localizer.
 * @implements localizerInterface
 * @desc Create an object conforming to the {@link localizerInterface} for numbers, using {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat|Intl.NumberFormat}.
 * @param [locale='en-US'] - Passed to the `Intl.NumberFormat` constructor.
 * @param [options] - Passed to `Intl.NumberFormat`.
 * @param [options.acceptStandardDigits=false] - Accept standard digits and decimal point interchangeably with localized digits and decimal point. (This option is interpreted here; it is not used by `Intl.NumberFormat`.)
 * @constructor
 * @tutorial localization
 */
function NumberFormatter(locale, options) {
    if (typeof locale === 'object') {
        options = locale;
        locale = undefined;
    }

    options = options || {};

    /** @summary Locale passed to constructor.
     * @type {string}
     */
    this.locale = locale || 'en-US';

    /** @summary Transform a number primitive into human-friendly string representation.
     * @method
     */
    this.format = new Intl.NumberFormat(this.locale, options).format;

    var mapperOptions = { useGrouping: false, style: 'decimal' },
        mapper = new Intl.NumberFormat(this.locale, mapperOptions).format;

    this.demapper = demap.bind(this);

    /**
     * @summary A string containing the valid characters.
     * @type {string}
     * @private
     * @desc Localized digits and decimal point. Will also include standardized digits and decimal point if `options.acceptStandardDigits` is truthy.
     *
     * For internal use by the {@link NumberFormatter#standardize|standardize} method.
     */
    this.map = mapper(10123456789.5).substr(1, 11); // localized '0123456789.'

    if (options.acceptStandardDigits) {
        this.map += '0123456789.';  // standard '0123456789.'
    }

    /** @summary A regex that tests `true` on first invalid character.
     * @type {RegExp}
     * @private
     * @desc Valid characters include:
     *
     * * Localized digits
     * * Localized decimal point
     * * Standard digits (when `options.acceptStandardDigits` is truthy)
     * * Standard decimal point (when `options.acceptStandardDigits` is truthy)
     * * Cosmetic characters added by formatter as per `options` (for human-friendly readability).
     *
     * Any characters outside this set are considered invalid.
     *
     * Set by the constructor; consumed by the {@link module:localization~NumberFormatter#isValid|isValid} method.
     *
     * Testing a string against this pattern yields `true` if at least one invalid character or `false` if all characters are valid.
     */
    this.invalids = new RegExp(
        '[^' +
        this.format(123467890.5) +
        (options.acceptStandardDigits ? '0123456789.' : '') +
        ']'
    );

    consumeOptions.call(this, options);
}

NumberFormatter.prototype = {
    constructor: NumberFormatter.prototype.constructor,

    /** @summary Tests for valid characters.
     * @desc Tests a localized string representation of a number that it consists entirely of valid characters.
     *
     * The number may be unformatted or it may be formatted with any of the permitted formatting characters, as implied by the constructor's `options` (passed to `Intl.NumberFormat`). Any other characters are considered invalid.
     *
     * However, standard digits and the standard decimal point are considered valid if the value of `options.acceptStandardDigits` as provided to the constructor was truthy. (Of course, these are always valid for locales that use them.)
     *
     * Use this method to:
     * 1. Filter out invalid characters on a `onkeydown` event; or
     * 2. Test an edited string prior to calling the {@link module:localization~NumberFormatter#standardize|standardize}.
     *
     * NOTE: This method does not check grammatical syntax; it only checks for invalid characters.
     *
     * @param number
     * @returns {boolean} Contains only valid characters.
     */
    isValid: function(number) {
        return !this.invalids.test(number);
    },

    expectation:
        'Expected a number with optional commas (thousands grouping separator), optional decimal point, and an optional fractional part.\n\n' +
        'Note that the comma separators are part of the format and will always be displayed for values > 999. However, although saved in its entirety, the formatted representation never includes the decimal point or the fractional part, rounding instead to the nearest integer.',

    /**
     * This method will:
     * * Convert localized digits and decimal point characters to standard digits and decimal point characters.
     * * "Clean" the string by ignoring all other characters.
     * * Coerce the string to a number primitive.
     *
     * Since all other characters are simply ignored, it is not necessary to call {@link module:localization~NumberFormatter#isValid|isValid} first; this method will succeed regardless. However, doing so will give you the opportunity to alert the user if you want to be strict and never accept strings with any invalid characters in them.
     * @param {string} formattedLocalizedNumber - May or may not be formatted.
     * @returns {number} Number primitive.
     */
    parse: function(formattedLocalizedNumber) {
        return Number(
            formattedLocalizedNumber.split('').map(this.demapper).join('')
        );
    }
};

function demap(c) {
    var d = this.map.indexOf(c) % 11;
    return d < 0 ? '' : d < 10 ? d : '.';
}

/**
 * @implements localizerInterface
 * @param [locale='en-US'] - Passed to {@link Intl.NumberFormat|https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat}
 * @param [options] - Passed to `Intl.NumberFormat`.
 * @constructor
 */
function DateFormatter(locale, options) {
    if (typeof locale === 'object') {
        options = locale;
        locale = undefined;
    }

    options = options || {};

    /** @summary Locale passed to constructor.
     * @type {string}
     */
    this.locale = locale || 'en-US';

    /** @summary Transform a date object into human-friendly string representation.
     * @method
     */
    this.format = new Intl.DateTimeFormat(this.locale, options).format;

    // Get digits because may be chinese or "real Arabic" numerals.
    var testOptions = { useGrouping: false, style: 'decimal' },
        localizeNumber = new Intl.NumberFormat(this.locale, testOptions).format,
        localizedDigits = this.localizedDigits = localizeNumber(10123456789).substr(1, 10); // all localized digits in numerical order

    this.digitLocalizer = localizeDigit.bind(this);
    this.digitStandardizer = standardizeDigit.bind(this);

    // Localize a test date with the default numeric parts to find out the resulting order of these parts.
    var yy = 1987,
        mm = 12,
        dd = 30,
        h = 4,
        m = 56,
        YY = this.transformNumber(this.digitLocalizer, yy),
        MM = this.transformNumber(this.digitLocalizer, mm),
        DD = this.transformNumber(this.digitLocalizer, dd),
        testDate = new Date(yy, mm - 1, dd, h, m),
        localizeDate = new Intl.DateTimeFormat(locale).format,
        localizedDate = localizeDate(testDate), // all localized digits + localized punctuation
        localizedNumberPattern = this.localizedNumberPattern = new RegExp('[' + localizedDigits + ']+', 'g'),
        parts = localizedDate.match(localizedNumberPattern);

    this.partsMap = {
        yy: parts.indexOf(YY),
        mm: parts.indexOf(MM),
        dd: parts.indexOf(DD)
    };

    /** @summary A regex that tests `true` on firstL invalid character.
     * @type {RegExp}
     * @private
     * @desc Valid characters include:
     *
     * * Localized digits
     * * Standard digits (when `options.acceptStandardDigits` is truthy)
     * * Localized punctuation to delimit date parts
     *
     * Any characters outside this set are considered invalid. Note that this only currently implemented when all three date parts are numeric
     *
     * Set by the constructor; consumed by the {@link NumberFormatter#valid|valid} method.
     *
     * Testing a string against this pattern yields `true` if at least one invalid character or `false` if all characters are valid.
     */
    this.invalids = new RegExp(
        '[^' +
        localizedDate +
        (options.acceptStandardDigits ? '0123456789' : '') +
        ']'
    );

    consumeOptions.call(this, options);
}

DateFormatter.prototype = {
    constructor: DateFormatter.prototype.constructor,

    /** @summary Tests for valid characters.
     * @desc Tests a localized string representation of a number that it consists entirely of valid characters.
     *
     * The date is assumed to contain localized digits and punctuation as would be returned by `Intl.DateFormat` with the given `locale` and `options`. Any other characters are considered invalid.
     *
     * However, standard digits and the standard decimal point are also considered valid if the value of `options.acceptStandardDigits` as provided to the constructor was truthy. (Of course, these are always valid for locales that use them.)
     *
     * Use this method to:
     * 1. Filter out invalid characters on a `onkeydown` event; or
     * 2. Test an edited string prior to calling the {@link module:localization~DateFormatter#standardize|standardize}.
     *
     * NOTE: The current implementation only supports date formats using all numerics (which is the default for `Intl.DateFormat`).
     *
     * NOTE: This method does not check grammatical syntax; it only checks for invalid characters.
     *
     * @param number
     * @returns {boolean} Contains only valid characters.
     */
    isValid: function(number) {
        return !this.invalids.test(number);
    },

    /**
     * This method will:
     * * Convert localized date to Date object.
     * * "Clean" the string by ignoring all other characters.
     * * Coerce the string to a number primitive.
     *
     * Since all other characters are simply ignored, it is not necessary to call {@link module:localization~DateFormatter#isValid|isValid} first; this method will succeed regardless. However, doing so will give you the opportunity to alert the user if you want to be strict and never accept strings with any invalid characters in them.
     * @param {string} localizedDate
     * @returns {null|Date} Will be `null` if mal-formed date string.
     */
    parse: function(localizedDate) {
        var date,
            parts = localizedDate.match(this.localizedNumberPattern);

        if (parts && parts.length === 3) {
            var y = this.transformNumber(this.digitStandardizer, parts[this.partsMap.yy]),
                m = this.transformNumber(this.digitStandardizer, parts[this.partsMap.mm]) - 1,
                d = this.transformNumber(this.digitStandardizer, parts[this.partsMap.dd]);

            date = new Date(y, m, d);
        } else {
            date = null;
        }

        return date;
    },

    /**
     * Transform a number to or from a string representation with localized digits.
     * @param {function} digitTransformer - A function bound to `this`.
     * @param {number} number
     * @returns {string}
     * @private
     */
    transformNumber: function(digitTransformer, number) {
        return number.toString().split('').map(digitTransformer).join('');
    }
};

function consumeOptions(options) {
    if (typeof options.isValid === 'function') {
        this.isValid = options.isValid;
    }

    if (options.expectation) {
        this.expectation = options.expectation;
    }
}

function localizeDigit(d) {
    return this.localizedDigits[d];
}

function standardizeDigit(c) {
    var d = this.localizedDigits.indexOf(c);
    if (d < 0) { d = ''; }
    return d;
}

/**
 * @summary Hash of objects conforming to the {@link localizerInterface}.
 * @desc Expandable with additional members.
 * @type {object}
 * @memberOf module:localization
 */
var localizers = {

    number: new NumberFormatter(),

    date: new DateFormatter(),

    chromeDate: { // Special localizer for use by Chrome's date input control.
        format: function(date) {
            if (date != null) {
                if (typeof date !== 'object') {
                    date = new Date(date);
                }

                var yy = date.getFullYear(),
                    m = date.getMonth() + 1, mm = m < 10 ? '0' + m : m,
                    d = date.getDate(), dd = d < 10 ? '0' + d : d;

                date = yy + '-' + mm + '-' + dd;
            } else {
                date = null;
            }
            return date;
        },
        parse: function(str) {
            var date,
                parts = str.split('-');
            if (parts && parts.length === 3) {
                date = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
                date = null;
            }
            return date;
        }
    },

    null: {
        format: function(value) {
            return value + '';
        },
        parse: function(str) {
            return str + '';
        }
    }

};

localizers.int = localizers.float = localizers.number;

/**
 * @param {string} localizerName
 * @param {localizerInterface} localizer
 * @memberOf module:localization
 */
function set(localizerName, localizer) {
    if (
        typeof localizer !== 'object' ||
        typeof localizer.format !== 'function' ||
        typeof localizer.parse !== 'function' ||
        localizer.isValid && typeof localizer.isValid !== 'function'
    ) {
        throw 'Expected localizer object to conform to interface.';
    }

    localizers[localizerName] = localizer;
}

/**
 *
 * @param localizerName
 * @returns {localizerInterface}
 * @memberOf module:localization
 */
function get(localizerName) {
    return localizers[localizerName] || localizers.null;
}

module.exports = {
    localizers: localizers,
    set: set,
    get: get,

    /**
     * @see The {@link module:localization~NumberFormatter|NumberFormatter} class
     * @memberOf module:localization
     */
    NumberFormatter: NumberFormatter,

    /**
     * @see The {@link module:localization~DateFormatter|DateFormatter} class
     * @memberOf module:localization
     */
    DateFormatter: DateFormatter
};
