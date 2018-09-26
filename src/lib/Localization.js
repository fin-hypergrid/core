/* eslint-env browser */

/**
 * @module localization
 */

'use strict';

var Base = require('../Base');


/**
 * @param {string} defaultLocale
 * @param {string} [locale=defaultlocale]
 * @param {object} [options]
 * @constructor
 */
var Formatter = Base.extend({
    initialize: function(defaultLocale, locale, options) {
        if (typeof locale === 'object') {
            options = locale;
            locale = defaultLocale;
        }

        this.locale = locale;

        if (options) {
            if (typeof options.invalid === 'function') {
                this.invalid = options.invalid;
            }

            if (options.expectation) {
                this.expectation = options.expectation;
            }
        }
    }
});


// Safari has no Intl implementation
if (!window.Intl) {
    window.Intl = {
        NumberFormat: function(locale, options) {
            var digits = '0123456789';
            this.format = function(n) {
                var s = n.toString();
                if (!options || options.useGrouping === undefined || options.useGrouping) {
                    var dp = s.indexOf('.');
                    if (dp < 0) {
                        dp = s.length;
                    }
                    while ((dp -= 3) > 0 && digits.indexOf(s[dp - 1]) >= 0) {
                        s = s.substr(0, dp) + ',' + s.substr(dp);
                    }
                }
                return s;
            };
        },
        DateTimeFormat: function(locale, options) {
            this.format = function(date) {
                if (date != null) {
                    if (typeof date !== 'object') {
                        date = new Date(date);
                    }
                    date = date.getMonth() + 1 + '-' + date.getDate() + '-' + date.getFullYear();
                } else {
                    date = null;
                }
                return date;
            };
        }
    };
}


/**
 * @summary Create a number localizer.
 * @implements localizerInterface
 * @desc Create an object conforming to {@link localizerInterface} for numbers, using {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat `Intl.NumberFormat`}.
 * @param {string} defaultLocale
 * @param {string} [locale=defaultLocale] - Passed to the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat `Intl.NumberFormat`} constructor.
 * @param {object} [options] - Passed to the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat `Intl.NumberFormat`} constructor.
 * @param {boolean} [options.acceptStandardDigits=false] - Accept standard digits and decimal point interchangeably with localized digits and decimal point. (This option is interpreted here; it is not used by {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat `Intl.NumberFormat`}.)
 * @constructor
 * @extends Formatter
 * @tutorial localization
 */
var NumberFormatter = Formatter.extend('NumberFormatter', {
    initialize: function(defaultLocale, locale, options) {
        if (typeof locale === 'object') {
            options = locale;
        }

        options = options || {};

        this.format = new Intl.NumberFormat(this.locale, options).format;

        var mapperOptions = { useGrouping: false },
            mapper = new Intl.NumberFormat(this.locale, mapperOptions).format;

        this.demapper = demap.bind(this);

        /**
         * @summary A string containing the valid characters.
         * @desc Contains all localized digits + localized decimal point.
         * If we're accepting standard digits, will also contain all the standard digits + standard decimal point (if different than localized versions).
         * @type {string}
         * @private
         * @desc Localized digits and decimal point. Will also include standardized digits and decimal point if `options.acceptStandardDigits` is truthy.
         *
         * For internal use by the {@link NumberFormatter#parse|parse} method.
         * @memberOf NumberFormatter.prototype
         */
        this.map = mapper(10123456789.5).substr(1, 11); // localized '0123456789.'

        if (options.acceptStandardDigits && this.map !== '0123456789.') {
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
         * Set by the constructor; consumed by the {@link module:localization~NumberFormatter#invalid|invalid} method.
         *
         * Testing a string against this pattern yields `true` if at least one invalid character or `false` if all characters are valid.
         * @memberOf NumberFormatter.prototype
         */
        this.invalids = new RegExp(
            '[^' +
            this.format(11111).replace(this.map[1], '') + // thousands separator if in use
            this.map + // digits + decimal point
            ']'
        );
    },

    /** @summary Tests for invalid characters.
     * @desc Tests a localized string representation of a number that it contains any invalid characters.
     *
     * The number may be unformatted or it may be formatted with any of the permitted formatting characters, as implied by the constructor's `options` (passed to `Intl.NumberFormat`). Any other characters are considered invalid.
     *
     * However, standard digits and the standard decimal point are considered valid if the value of `options.acceptStandardDigits` as provided to the constructor was truthy. (Of course, these are always valid for locales that use them.)
     *
     * Use this method to:
     * 1. Filter out invalid characters on a `onkeydown` event; or
     * 2. Test an edited string prior to calling the {@link module:localization~NumberFormatter#parse|parse}.
     *
     * NOTE: This method does not check grammatical syntax; it only checks for invalid characters.
     *
     * @param number
     * @returns {boolean|string} Falsy means valid which in this case means contains only valid characters.
     * @memberOf NumberFormatter.prototype
     */
    invalid: function(number) {
        return this.invalids.test(number);
    },

    expectation:
        'Expected a number with optional commas (thousands grouping separator), optional decimal point, and an optional fractional part.\n' +
        'Comma separators are part of the format and will always be displayed for values >= 1000.\n' +
        'Edited values are always saved in their entirety even though the formatted value is rounded to the specified number of decimal places.',

    /**
     * This method will:
     * * Convert localized digits and decimal point characters to standard digits and decimal point characters.
     * * "Clean" the string by ignoring all other characters.
     * * Coerce the string to a number primitive.
     * @param {string} formattedLocalizedNumber - May or may not be formatted.
     * @returns {number} Number primitive.
     * @throws {string} Invalid number.
     * @memberOf NumberFormatter.prototype
     */
    parse: function(formattedLocalizedNumber) {
        var number = Number(
            formattedLocalizedNumber.split('').map(this.demapper).join('')
        );

        if (isNaN(number)) {
            throw 'Invalid Number';
        }

        return number;
    }
});

function demap(c) {
    var d = this.map.indexOf(c) % 11;
    return d < 0 ? '' : d < 10 ? d : '.';
}

/**
 * @implements localizerInterface
 * @param {string} defaultLocale
 * @param {string} [locale=defaultlocale] - Passed to the {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat `Intl.DateFormat`} constructor.
 * @param {object} [options] - Passed to the {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat `Intl.DateFormat`} constructor.
 * @constructor
 * @extends Formatter
 */
var DateFormatter = Formatter.extend('DateFormatter', {
    initialize: function(defaultLocale, locale, options) {
        if (typeof locale === 'object') {
            options = locale;
        }

        options = options || {};

        /** @summary Transform a date object into human-friendly string representation.
         * @method
         */
        this.format = new Intl.DateTimeFormat(this.locale, options).format;

        // Get digits because may be chinese or "real Arabic" numerals.
        var testOptions = { useGrouping: false, style: 'decimal' },
            localizeNumber = new Intl.NumberFormat(this.locale, testOptions).format,
            localizedDigits = this.localizedDigits = localizeNumber(10123456789).substr(1, 10); // all localized digits in numerical order

        this.digitFormatter = formatDigit.bind(this);
        this.digitParser = parseDigit.bind(this);

        // Localize a test date with the default numeric parts to find out the resulting order of these parts.
        var yy = 1987,
            mm = 12,
            dd = 30,
            YY = this.transformNumber(this.digitFormatter, yy),
            MM = this.transformNumber(this.digitFormatter, mm),
            DD = this.transformNumber(this.digitFormatter, dd),
            testDate = new Date(yy, mm - 1, dd),
            localizeDate = new Intl.DateTimeFormat(this.locale).format,
            localizedDate = localizeDate(testDate), // all localized digits + localized punctuation
            missingDigits = new Intl.NumberFormat(this.locale).format(456),
            localizedNumberPattern = this.localizedNumberPattern = new RegExp('[' + localizedDigits + ']+', 'g'),
            parts = localizedDate.match(localizedNumberPattern);

        this.partsMap = {
            yy: parts.indexOf(YY),
            mm: parts.indexOf(MM),
            dd: parts.indexOf(DD)
        };

        if (options.acceptStandardDigits) {
            missingDigits += '1234567890';
        }

        /** @summary A regex that tests `true` on first invalid character.
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
         * @memberOf DateFormatter.prototype
         */
        this.invalids = new RegExp(
            '[^' +
            localizedDate.replace(/-/g, '\\-') +
            missingDigits +
            ']'
        );
    },

    /** @summary Tests for invalid characters.
     * @desc Tests a localized string representation of a number that it contains any invalid characters.
     *
     * The date is assumed to contain localized digits and punctuation as would be returned by `Intl.DateFormat` with the given `locale` and `options`. Any other characters are considered invalid.
     *
     * However, standard digits and the standard decimal point are also considered valid if the value of `options.acceptStandardDigits` as provided to the constructor was truthy. (Of course, these are always valid for locales that use them.)
     *
     * Use this method to:
     * 1. Filter out invalid characters on a `onkeydown` event; or
     * 2. Test an edited string prior to calling the {@link module:localization~DateFormatter#parse|parse}.
     *
     * NOTE: The current implementation only supports date formats using all numerics (which is the default for `Intl.DateFormat`).
     *
     * NOTE: This method does not check grammatical syntax; it only checks for invalid characters.
     *
     * @param number
     * @returns {boolean} Contains only valid characters.
     * @memberOf DateFormatter.prototype
     */
    invalid: function(number) {
        return this.invalids.test(number);
    },

    /**
     * This method will:
     * * Convert localized date to Date object.
     * * "Clean" the string by ignoring all other characters.
     * * Coerce the string to a number primitive.
     * @param {string} localizedDate
     * @returns {Date}
     * @throws {string} Invalid date.
     * @memberOf DateFormatter.prototype
     */
    parse: function(localizedDate) {
        var date,
            parts = localizedDate.match(this.localizedNumberPattern);

        if (parts && parts.length === 3) {
            var y = this.transformNumber(this.digitParser, parts[this.partsMap.yy]),
                m = this.transformNumber(this.digitParser, parts[this.partsMap.mm]) - 1,
                d = this.transformNumber(this.digitParser, parts[this.partsMap.dd]);

            date = new Date(y, m, d);
        } else {
            throw 'Invalid Date';
        }

        return date;
    },

    /**
     * Transform a number to or from a string representation with localized digits.
     * @param {function} digitTransformer - A function bound to `this`.
     * @param {number} number
     * @returns {string}
     * @private
     * @memberOf DateFormatter.prototype
     */
    transformNumber: function(digitTransformer, number) {
        return number.toString().split('').map(digitTransformer).join('');
    }
});

function formatDigit(d) {
    return this.localizedDigits[d];
}

function parseDigit(c) {
    var d = this.localizedDigits.indexOf(c);
    if (d < 0) { d = ''; }
    return d;
}

/**
 * All members are localizers (conform to {@link localizerInterface}) with exception of `get`, `set`, and localizer constructors which are named (by convention) ending in "Formmatter".
 *
 * The application developer is free to add localizers and localizer factory methods. See the {@link Localization#construct|construct} convenience method which may be helpful in this regard.
 * @param locale
 * @param {object} [numberOptions]
 * @param {object} [dateOptions]
 * @constructor
 */
function Localization(locale, numberOptions, dateOptions) {
    this.locale = locale;

    /**
     * @name number
     * @see The {@link NumberFormatter|NumberFormatter} class
     * @memberOf Localization.prototype
     */
    this.int = this.float = this.construct('number', NumberFormatter, numberOptions);

    /**
     * @see The {@link DateFormatter|DateFormatter} class
     * @memberOf Localization.prototype
     */
    this.construct('date', DateFormatter, dateOptions);
}

Localization.prototype = {
    constructor: Localization.prototype.constructor,
    $$CLASS_NAME: 'Localization',

    /** @summary Creates a localizer from a localizer factory object using the default locale.
     * @desc Performs the following actions:
     * 1. Binds `Constructor` to `locale`.
     * 2. Adds the newly bound constructor to this object (for future reference) with the key "NameFormatter" (where "Name" is the localizer name, all lower case but with an initial capital).
     * 3. Uses the newly bound constructor to create a new localized localizer with the provided options.
     * 4. Adds new localizer to this object via {@link Localization#add|add}.
     *
     * @param {string} localizerName
     * @param {Constructor
     * @param {object} {factoryOptions}
     * @returns {localizerInterface} The new localizer.
     */
    construct: function(localizerName, Constructor, factoryOptions) {
        var constructorName = localizerName[0].toUpperCase() + localizerName.substr(1).toLowerCase() + 'Formatter',
            BoundConstructor = Constructor.bind(null, this.locale),
            localizer = new BoundConstructor(factoryOptions);

        this[constructorName] = BoundConstructor;

        return this.add(localizerName, localizer);
    },

    /** @summary Register a localizer.
     * @desc Checks the provided localizer that it conforms to {@link localizerInterface}
     * and adds it to the object using localizerName all lower case as the key.
     * @param {string} name
     * @param {localizerInterface} localizer
     * @memberOf Localization.prototype
     * @returns {localizerInterface} The provided localizer.
     */
    add: function(name, localizer) {
        if (typeof name === 'object') {
            localizer = name;
            name = undefined;
        }

        if (
            typeof localizer !== 'object' ||
            typeof localizer.format !== 'function' ||
            typeof localizer.parse !== 'function' ||
            localizer.invalid && typeof localizer.invalid !== 'function' ||
            localizer.expectation && typeof localizer.expectation !== 'string'
        ) {
            throw 'Expected localizer object to conform to interface.';
        }

        name = name || localizer.name;
        name = name && name.toLowerCase();
        this[name] = localizer;

        return localizer;
    },

    /**
     *
     * @param localizerName
     * @returns {localizerInterface}
     * @memberOf Localization.prototype
     */
    get: function(name) {
        return this[name && name.toLowerCase()] || this.string;
    },

    ///  ///  ///  ///  ///    LOCALIZERS    ///  ///  ///  ///  ///

    // Special localizer for use by Chrome's date input control.
    chromeDate: {
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
            return value;
        },
        parse: function(str) {
            return str;
        }
    },

    string: {
        format: function(value) {
            return value + '';
        },
        parse: function(str) {
            return str + '';
        }
    }
};

module.exports = Localization;
