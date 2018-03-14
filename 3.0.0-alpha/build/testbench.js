(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var numRows = 10000;

var firstNames = ['', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Boy', 'Liam', 'Noah', 'Ethan', 'Mason', 'Logan', 'Moe', 'Larry', 'Curly', 'Shemp', 'Groucho', 'Harpo', 'Chico', 'Zeppo', 'Stanley', 'Hardy'];
var lastNames = ['', 'Wirts', 'Oneil', 'Smith', 'Barbarosa', 'Soprano', 'Gotti', 'Columbo', 'Luciano', 'Doerre', 'DePena'];
var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
var days = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];
var states = ['', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

var randomFunc = Math.random;
//var randomFunc = rnd;

var rnd = function (max) {
    return Math.floor(randomFunc() * max);
}

var randomPerson = function() {
    var firstName = Math.round((firstNames.length - 1) * randomFunc());
    //var lastName = 'a' + randomFunc() + 'b';
    var lastName = Math.round((lastNames.length - 1) * randomFunc());
    var pets = Math.round(10 * randomFunc());
    var height = 50 + Math.round(40 * randomFunc());
    var birthyear = 1900 + Math.round(randomFunc() * 114);
    var birthmonth = Math.round(randomFunc() * 11);
    var birthday = Math.round(randomFunc() * 29);
    var birthTime = Math.round(randomFunc() * 60 * 24);
    var birthstate = Math.round(randomFunc() * (states.length - 1));
    var residencestate = Math.round(randomFunc() * (states.length - 1));
    var travel = randomFunc() * 1000;
    var income = randomFunc() * 100000;
    var employed = Math.round(randomFunc());

    //Use this to test Sparkline or Sparkbar
    var sparkData =  (function () {
        var barRandomOffsets = [];
        //for (var i = 0; i < 20; i++) {
        //    barRandomOffsets.push([]);

        for (var r = 0; r < 10; r++) {
            barRandomOffsets.push(10 - rnd(20));
        }
        //}
        return barRandomOffsets
    })()
    var sliderData = Math.round(randomFunc() * 11);
    var person = {
        last_name: lastNames[lastName], //jshint ignore:line
        first_name: firstNames[firstName], //jshint ignore:line
        total_number_of_pets_owned: pets,
        height: height,
        birthDate: new Date(birthyear + '-' + months[birthmonth] + '-' + days[birthday]),
        birthTime: birthTime,
        birthState: states[birthstate],
        residenceState: states[residencestate],
        employed: employed === 1,
        income: income,
        travel: travel,
        squareOfIncome: 0,

        one_last_name: lastNames[lastName], //jshint ignore:line
        one_first_name: firstNames[firstName], //jshint ignore:line
        one_pets: pets,
        one_height: height,
        one_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
        one_birthState: states[birthstate],
        one_birthTime: birthTime,
        one_residenceState: states[residencestate],
        one_employed: employed === 1,
        one_income: income,
        one_travel: travel,
        one_squareOfIncome: 0,

        two_last_name: lastNames[lastName], //jshint ignore:line
        two_first_name: firstNames[firstName], //jshint ignore:line
        two_pets: pets,
        two_height: height,
        two_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
        two_birthState: states[birthstate],
        two_birthTime: birthTime,
        two_residenceState: states[residencestate],
        two_employed: employed === 1,
        two_income: income,
        two_travel: travel,
        two_squareOfIncome: 0,

        three_last_name: lastNames[lastName], //jshint ignore:line
        three_first_name: firstNames[firstName], //jshint ignore:line
        three_pets: pets,
        three_height: height,
        three_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
        three_birthState: states[birthstate],
        three_birthTime: birthTime,
        three_residenceState: states[residencestate],
        three_employed: employed === 1,
        three_income: income,
        three_travel: travel,
        three_squareOfIncome: 0,

        four_last_name: lastNames[lastName], //jshint ignore:line
        four_first_name: firstNames[firstName], //jshint ignore:line
        four_pets: pets,
        four_height: height,
        four_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
        four_birthState: states[birthstate],
        four_birthTime: birthTime,
        four_residenceState: states[residencestate],
        four_employed: employed === 1,
        four_income: income,
        four_travel: travel,
        four_squareOfIncome: 0,

        five_last_name: lastNames[lastName], //jshint ignore:line
        five_first_name: firstNames[firstName], //jshint ignore:line
        five_pets: pets,
        five_height: height,
        five_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
        five_birthState: states[birthstate],
        five_birthTime: birthTime,
        five_residenceState: states[residencestate],
        five_employed: employed === 1,
        five_income: income,
        five_travel: travel,
        five_squareOfIncome: 0,

        six_last_name: lastNames[lastName], //jshint ignore:line
        six_first_name: firstNames[firstName], //jshint ignore:line
        six_pets: pets,
        six_height: height,
        six_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
        six_birthState: states[birthstate],
        six_birthTime: birthTime,
        six_residenceState: states[residencestate],
        six_employed: employed === 1,
        six_income: income,
        six_travel: travel,
        six_squareOfIncome: 0,

        seven_last_name: lastNames[lastName], //jshint ignore:line
        seven_first_name: firstNames[firstName], //jshint ignore:line
        seven_pets: pets,
        seven_height: height,
        seven_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
        seven_birthState: states[birthstate],
        seven_birthTime: birthTime,
        seven_residenceState: states[residencestate],
        seven_employed: employed === 1,
        seven_income: income,
        seven_travel: travel,
        seven_squareOfIncome: 0,

        eight_last_name: lastNames[lastName], //jshint ignore:line
        eight_first_name: firstNames[firstName], //jshint ignore:line
        eight_pets: pets,
        eight_height: height,
        eight_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
        eight_birthState: states[birthstate],
        eight_birthTime: birthTime,
        eight_residenceState: states[residencestate],
        eight_employed: employed === 1,
        eight_income: income,
        eight_travel: travel,
        eight_squareOfIncome: 0,
    };
    person.squareOfIncome = function() {
        return Math.sqrt(person.income);
    }
    return person;
};

var data = exports.people2 = [];
for (var i = 0; i < numRows; i++) {
    data.push(randomPerson());
}

data = exports.people1 = [];
for (var i = 0; i < numRows/2; i++) {
    data.push(randomPerson());
}

exports.states = states;
exports.firstNames = firstNames;
exports.lastNames = lastNames;

},{}],2:[function(require,module,exports){
'use strict';

var catalog = require('object-catalog');
var find = require('match-point');
var Greylist = require('greylist');


var isDOM = (
    typeof window === 'object' &&
    Object.prototype.toString.call(window) === '[object Window]' &&
    typeof window.Node === 'function'
);

var isDomNode = isDOM ? function(obj) { return obj instanceof window.Node } : function() {};


/**
 * @summary Search an object's code for pattern matches.
 * @desc Searches all code in the visible execution context using the provided regex pattern, returning the entire pattern match.
 *
 * If capture groups are specified in the pattern, returns the last capture group match, unless `options.captureGroup` is defined, in which case returns the group with that index where `0` means the entire pattern, _etc._ (per `String.prototype.match`).
 *
 * @param {string|RegExp} pattern - Search argument.
 * Don't use global flag on RegExp; it's unnecessary and suppresses submatches of capture groups.
 *
 * @param [options]
 * @param {number} [options.captureGroup] - Iff defined, index of a specific capture group to return for each match.
 * @param {boolean} [options.recurse] - Equivalent to setting both `recurseOwn` and `recurseAncestors`.
 * @param {boolean} [options.recurseOwn] - Recurse own subobjects.
 * @param {boolean} [options.recurseAncestors] - Recurse subobjects of objects of the entire prototype chain.
 * @param {object} [options.greylist] - https://github.com/joneit/greylist
 * @param [options.greylist.white] - If given, only listed matches are included in the results.
 * @param [options.greylist.black] - If given, listed matches are excluded from the results.
 *
 * @param {object} [options.catalog] - https://github.com/joneit/object-catalog
 * @param {boolean} [options.catalog.own] - Only search own object; otherwise search own + entire prototype chain.
 * @param {object} [options.catalog.greylist] - https://github.com/joneit/greylist
 * @param [options.catalog.greylist.white] - If given, only listed members are cataloged.
 * @param [options.catalog.greylist.black] - If given, listed members are *not* cataloged.
 *
 * @returns {string[]} Pattern matches.
 */
function match(pattern, options, byGreylist, matches, scanned) {
    var topLevelCall = !matches;

    if (topLevelCall) {
        // this is the top-level (non-recursed) call so intialize:
        var greylist = new Greylist(options && options.greylist);
        byGreylist = greylist.test.bind(greylist);
        options = options || {};
        matches = [];
        scanned = [];
    }

    var root = this;
    var members = catalog.call(root, options.catalog);

    scanned.push(root);

    Object.keys(members).forEach(function (key) {
        var obj = members[key];
        var descriptor = Object.getOwnPropertyDescriptor(obj, key);

        if (descriptor.value === match) {
            return; // don't catalog self when found to have been mixed in
        }

        Object.keys(descriptor).forEach(function (propName) {
            var hits, prop = descriptor[propName];

            if (typeof prop === 'function') {
                // propName must be `get` or `set` or `value`
                hits = find(prop.toString(), pattern, options.captureGroup).filter(byGreylist);
                hits.forEach(function(hit) { matches.push(hit); });
            } else if (
                (options.recurse || options.recurseOwn && obj === root || options.recurseChain && obj !== root) &&
                typeof prop === 'object' &&
                !isDomNode(prop) && // don't search DOM objects
                scanned.indexOf(prop) < 0 // don't recurse on objects already scanned
            ) {
                // propName must be `value`
                match.call(prop, pattern, options, byGreylist, matches, scanned);
            }
        });
    });

    if (topLevelCall) {
        matches.sort();
    }

    return matches;
}

module.exports = match;
},{"greylist":5,"match-point":6,"object-catalog":7}],3:[function(require,module,exports){
'use strict';

function logEventObject(e) {
    this.log(e.type, '::', e);
}

function logDetail(e) {
    this.log(e.type, '::', e.detail);
}

function logScroll(e) {
    this.log(e.type, '::', e.detail.value);
}

function logCell(e) {
    var gCell = e.detail.gridCell;
    var dCell = e.detail.dataCell;
    this.log(e.type, '::',
        'grid-cell:', { x: gCell.x, y: gCell.y },
        'data-cell:', { x: dCell.x, y: dCell.y });
}

function logSelection(e) {
    this.log(e.type, '::', e.detail.rows, e.detail.columns, e.detail.selections);
}

function logRow(e) {
    var rowContext = e.detail.primitiveEvent.dataRow;
    this.log(e.type, '::', 'row-context:', rowContext);
}

module.exports = {
    'fin-cell-enter': logCell,
    'fin-click': logCell,
    'fin-double-click': logRow,
    'fin-selection-changed': logSelection,
    'fin-context-menu': logCell,

    'fin-scroll-x': logScroll,
    'fin-scroll-y': logScroll,

    'fin-row-selection-changed': logDetail,
    'fin-column-selection-changed': logDetail,
    'fin-editor-data-change': logDetail,
    'fin-editor-keyup': logDetail,
    'fin-editor-keypress': logDetail,
    'fin-editor-keydown': logDetail,
    'fin-groups-changed': logDetail,

    'fin-filter-applied': logEventObject,
    'fin-request-cell-edit': logEventObject,
    'fin-before-cell-edit': logEventObject,
    'fin-after-cell-edit': logEventObject
};

},{}],4:[function(require,module,exports){
'use strict';

var StarLog = require('starlog');

var eventLoggerPlugin = {

    start: function(options)
    {
        if (options && this.starlog) {
            this.starlog.stop(); // stop the old one before redefining it with new options object
        }

        if (!this.starlog || options) {
            options = Object.assign({}, options);

            // search grid object for "Event('yada-yada'" or "Event.call(this, 'yada-yada'"
            options.select = options.select || this;
            options.pattern = options.pattern || /Event(\.call\(this, |\()'(fin-[a-z-]+)'/;
            options.targets = options.targets || this.canvas.canvas;

            // mix options.listenerDictionary on top of some custom listeners
            options.listenerDictionary = Object.assign({}, require('./custom-listeners'), options.listenerDictionary);

            // mix fin-tick on top of options.match.greylist.black
            var black = ['fin-tick'];
            options.match = options.match || {};
            options.match.greylist = options.match.greylist || {};
            options.match.greylist.black = options.match.greylist.black ? black.concat(options.match.greylist.black) : black;

            this.starlog = new StarLog(options);
        }

        this.starlog.start();
    },

    stop: function() {
        this.starlog.stop();
    }

};

// Non-enumerable methods are not themselves installed:
Object.defineProperties(eventLoggerPlugin, {
    preinstall: {
        value: function(HypergridPrototype, BehaviorPrototype, methodPrefix) {
            install.call(this, HypergridPrototype, methodPrefix);
        }
    },

    install: {
        value: function(grid, methodPrefix) {
            install.call(this, grid, methodPrefix);
        }
    }
});

function install(target, methodPrefix) {
    if (methodPrefix === undefined) {
        methodPrefix = 'log';
    }
    Object.keys(this).forEach(function (key) {
        target[prefix(methodPrefix, key)] = this[key];
    }, this);
}

function prefix(prefix, name) {
    var capitalize = prefix.length && prefix[prefix.length - 1] !== '_';
    if (capitalize) {
        name = name.substr(0, 1).toUpperCase() + name.substr(1);
    }
    return prefix + name;
}

module.exports = eventLoggerPlugin;

},{"./custom-listeners":3,"starlog":8}],5:[function(require,module,exports){
'use strict';

/** Creates an object with a `test` method from optional whitelist and/or blacklist
 * @constructor
 * @param {object} [options] - If neither `white` nor `black` are given, all strings pass `test`.
 * @param [options.white] - If given, only listed strings pass `test`.
 * @param [options.black] - If given, listed strings fail `test`.
 */
function GreyList(options) {
    this.white = getFlatArrayOfRegexAndOrString(options && options.white);
    this.black = getFlatArrayOfRegexAndOrString(options && options.black);
}

GreyList.prototype.test = function(string) {
    this.string = string; // for match() use
    return (
        !(this.white && !this.white.some(match, this)) &&
        !(this.black && this.black.some(match, this))
    );
};

function match(pattern) {
    return typeof pattern.test === 'function'
        ? pattern.test(this.string) // typically a regex but could be anything that implements `test`
        : this.string === pattern + ''; // convert pattern to string even for edge cases
}

function getFlatArrayOfRegexAndOrString(array, flat) {
    if (!flat) {
        // this is the top-level (non-recursed) call so intialize:

        // `undefined` passes through without being converted to an array
        if (array === undefined) {
            return;
        }

        // arrayify given scalar string, regex, or object
        if (!Array.isArray(array)) {
            array = [array];
        }

        // initialize flat
        flat = [];
    }

    array.forEach(function (item) {
        // make sure all elements are either string or RegExp
        switch (Object.prototype.toString.call(item)) {
            case '[object String]':
            case '[object RegExp]':
                flat.push(item);
                break;
            case '[object Object]':
                // recurse on complex item (when an object or array)
                if (!Array.isArray(item)) {
                    // convert object into an array (of it's enumerable keys, but only when not undefined)
                    item = Object.keys(item).filter(function (key) { return item[key] !== undefined; });
                }
                getFlatArrayOfRegexAndOrString(item, flat);
                break;
            default:
                flat.push(item + ''); // convert to string
        }
    });

    return flat;
}

module.exports = GreyList;
},{}],6:[function(require,module,exports){
'use strict';

/**
 * @summary Find all pattern matches, return specified capture group for each.
 * @returns {string[]} An array containing all the pattern matches found in `string`.
 * The entire pattern match is returned unless the pattern contains one or more subgroups in which case the portion of the pattern matched by the last subgroup is returned unless `captureGroup` is defined.
 * @param {string} string
 * @param {RegExp} regex - Don't use global flag; it's unnecessary and suppresses submatches of capture groups.
 * @param {number} [captureGroup] - Iff defined, index of a specific capture group to return.
 */
module.exports = function(string, regex, captureGroup) {
    var matches = [];

    for (var match, i = 0; (match = string.substr(i).match(regex)); i += match.index + match[0].length) {
        matches.push(match[captureGroup === undefined ? match.length - 1 : captureGroup]);
    }

    return matches;
};

},{}],7:[function(require,module,exports){
'use strict';

var Greylist = require('greylist');

/** @summary Catalog the execution context object.
 * @returns {object} An object containing a member for each member of the execution context object
 * visible in the prototype chain (back to but not including Object), per whitelist and blacklist.
 * Each member's value is the object in the prototype chain where found.
 * @param [options]
 * @param {boolean} [options.own] - Restrict search for event type strings to own methods rather than entire prototype chain.
 * @param [options.greylist]
 * @param [options.greylist.white] - If given, only listed members are cataloged.
 * @param [options.greylist.black] - If given, listed members are *not* cataloged.
 */
module.exports = function objectCatalog(options) {
    options = options || {};

    var obj,
        catalog = Object.create(null), // KISS no prototype needed
        walkPrototypeChain = !options.own,
        greylist = new Greylist(options.greylist);

    for (obj = this; obj && obj !== Object.prototype; obj = walkPrototypeChain && Object.getPrototypeOf(obj)) {
        Object.getOwnPropertyNames(obj).forEach(function(key) {
            if (
                !(key in catalog) && // not shadowed by a member of a descendant object
                greylist.test(key) &&
                Object.getOwnPropertyDescriptor(obj, key).value !== objectCatalog
            ) {
                catalog[key] = obj;
            }
        });
    }

    return catalog;
};
},{"greylist":5}],8:[function(require,module,exports){
'use strict';

var match = require('code-match');

/** @typedef {object} starlogger
 * @desc An event listener for logging purposes, paired with the target(s) to listen to.
 * Each member of a logger object has the event string as its key and an object as its value.
 * @property {function} listener - A handler that logs the event.
 * @property {object|object[]} targets - A target or list of targets to attach the listener to.
 */

/** @typedef {object|object[]} eventTargets
 * Event target object(s) that implement `addEventListener` and `removeEventListener`,
 * typically a DOM node, but by no means limited to such.
 */

/** @typedef {string} eventType */

/** @typedef {object} starlogOptions
 *
 * @desc Must define `loggers`, `events`, or `pattern` and `select`; else error is thrown.
 *
 * @param {Object.<eventType, starlogger>} [loggers] - Logger dictionary.
 * @param {string[]} [events] - List of event strings from which to build a logger dictionary.
 * @param {object|object[]} [select] - Object or list of objects in which to search with `pattern`.
 * @param {RegExp} [pattern] - Event string pattern to search for in all visible getters, setters, and methods.
 * The results of the search are used to build a logger dictionary.
 * Example: `/'(fin-[a-z-]+)'/` means find all strings like `'fin-*'`, returning only the part inside the quotes.
 * See the README for additional examples.
 *
 * @param {function} [log] - Override {@link Starlog#log}.
 * @param {function} [listener] - Override {@link Starlog#listener}.
 * @param {object} [targets] - Override {@link Starlog#targets}.
 *
 * @param {Object.<eventType, function>} [listenerDictionary={}] - Custom listeners to override default listener.
 * @param {Object.<eventType, eventTargets>} [targetsDictionary={}] - Custom event target object(s) to override default targets.
 *
 * @param {object} [match] - https://github.com/joneit/code-match
 * @param {number} [match.captureGroup] - Iff defined, index of a specific capture group to return for each match.
 * @param {object} [match.greylist] - https://github.com/joneit/greylist
 * @param [match.greylist.white] - If given, only listed matches are included in the results.
 * @param [match.greylist.black] - If given, listed matches are excluded from the results.
 *
 * @param {object} [match.catalog] - https://github.com/joneit/object-catalog
 * @param {boolean} [match.catalog.own] - Only search own methods for event strings; otherwise entire prototype chain.
 * @param {object} [match.catalog.greylist] - https://github.com/joneit/greylist
 * @param [match.catalog.greylist.white] - If given, only listed members are cataloged.
 * @param [match.catalog.greylist.black] - If given, listed members are *not* cataloged.
 */

/**
 * @constructor
 * @summary Instance a logger.
 * @desc Consumes `options`, creating a dictionary of event strings in `this.events`.
 *
 * Sources for loggers:
 * * If `options.loggers` dictionary object is defined, deep clone it and make sure all members are logger objects, defaulting any missing members.
 * * Else if `options.events` (list of event strings) is defined, create an object with those keys, listeners, and targets.
 * * Else if `options.pattern` is defined, code found in the execution context object is searched for event strings that match it (per `options.match`).
 *
 * Events specified with `options.events` and `options.pattern` log using the default listener and event targets:
 * * `StarLog.prototype.listener`, unless overridden, just calls `this.log()` with the event string, which is sufficient for casual usage.
 * Override it by defining `options.listener` or directly by reassigning to `StarLog.prototype.listener` before instantiation.
 * * `StarLog.prototype.targets`, unless overridden, is `window.document` (when available),
 * which is only really useful if the event is dispatched directly to (or is allowed to bubble up to) `document`.
 * Override it by defining `options.targets` or directly by reassigning to `StarLog.prototype.targets` before instantiation.
 *
 * Events specified with `options.loggers` can each specify their own listener and/or targets, but if not specified, they too will also use the above defaults.
 *
 * @param {starlogOptions} [options]
 */
function StarLog(options) {
    options = options || {};

    // Override prototype definitions if and only if supplied in options
    ['log', 'targets', 'listener'].forEach(function(key) {
        if (options[key]) { this[key] = options[key]; }
    }, this);

    var defaultTarget = options.targets || this.targets,
        defaultListener = options.listener || this.listener,
        listenerDictionary = options.listenerDictionary || {},
        targetsDictionary = options.targetsDictionary || {},
        loggers = options.loggers,
        eventStrings;

    if (loggers) {
        eventStrings = Object.keys(loggers);
    } else if (options.events) {
        loggers = {};
        eventStrings = options.events;
    } else if (options.pattern && options.select) {
        loggers = {};
        eventStrings = arrayify(options.select).reduce(function(matches, object) {
            match.call(object, options.pattern, options.match).forEach(function (match) {
                if (matches.indexOf(match) < 0) {
                    matches.push(match);
                }
            });
            return matches;
        }, []);
    } else {
        throw new Error('Expected `options.loggers`, `options.events`, or `options.pattern` and `options.select` to be defined.');
    }

    var starlog = this;

    /**
     * Dictionary of event strings with listener and target(s).
     * @type {Object.<eventType, starlogger>}
     */
    this.events = eventStrings.reduce(function(clone, eventString) {
        var logger = Object.assign({}, loggers[eventString]); // clone each logger

        // bind the listener to starlog for `this.log` access to Starlog#log from within listener
        logger.listener = (logger.listener || listenerDictionary[eventString] || defaultListener).bind(starlog);
        logger.targets = arrayify(logger.targets || targetsDictionary[eventString] || defaultTarget);

        clone[eventString] = logger;

        return clone;
    }, {});
}

StarLog.prototype = {
    constructor: StarLog.prototype.constructor,

    /**
     * @type {function}
     * @default console.log.bind(console)
     */
    log: console.log.bind(console),

    /**
     * @type {function}
     * @default function(e) { this.log(e.type); };
     */
    listener: function(e) {
        this.log(e.type);
    },

    /**
     * @type {object}
     * @default window.document
     */
    targets: typeof window === 'object' && window.document,

    /**
     * @method Starlog#start
     * @summary Start logging events.
     * @desc Add new event listeners for logging purposes.
     * Old event listeners, if any, are removed first, before adding new ones.
     */
    start: function () {
        this.stop();
        eventListener(this.events, 'add');
    },

    /**
     * @method Starlog#stop
     * @summary Stop logging events.
     * @desc Event listeners are removed from targets and deleted.
     */
    stop: function () {
        eventListener(this.events, 'remove');
    }
};

function eventListener(dictionary, methodPrefix) {
    if (!dictionary) {
        return;
    }

    var method = methodPrefix + 'EventListener';

    Object.keys(dictionary).forEach(function(eventType) {
        var eventLogger = dictionary[eventType];
        eventLogger.targets.forEach(function(target) {
            target[method](eventType, eventLogger.listener);
        });
    });
}

function arrayify(x) {
    return Array.isArray(x) ? x : [x];
}

module.exports = StarLog;
},{"code-match":2}],9:[function(require,module,exports){
/* eslint-env browser */

'use strict';

module.exports = function() {

    var demo = this,
        grid = demo.grid,
        schema = grid.behavior.schema,
        CellEditor = grid.cellEditors.BaseClass,
        Textfield = grid.cellEditors.get('textfield'),
        ColorText = Textfield.extend('colorText', {
            template: '<input type="text" lang="{{locale}}" style="color:{{textColor}}">'
        });

    grid.cellEditors.add(ColorText);

    var Time = Textfield.extend('Time', {
        template: [
            '<div class="hypergrid-textfield" style="text-align:right;">',
            '    <input type="text" lang="{{locale}}" style="background-color:transparent; width:75%; text-align:right; border:0; padding:0; outline:0; font-size:inherit; font-weight:inherit;' +
            '{{style}}">',
            '    <span>AM</span>',
            '</div>'
        ].join('\n'),

        initialize: function() {
            this.input = this.el.querySelector('input');
            this.meridian = this.el.querySelector('span');

            // Flip AM/PM on any click
            this.el.onclick = function() {
                this.meridian.textContent = this.meridian.textContent === 'AM' ? 'PM' : 'AM';
            }.bind(this);
            this.input.onclick = function(e) {
                e.stopPropagation(); // ignore clicks in the text field
            };
            this.input.onfocus = function(e) {
                var target = e.target;
                this.el.style.outline = this.outline = this.outline || window.getComputedStyle(target).outline;
                target.style.outline = 0;
            }.bind(this);
            this.input.onblur = function(e) {
                this.el.style.outline = 0;
            }.bind(this);
        },

        setEditorValue: function(value) {
            CellEditor.prototype.setEditorValue.call(this, value);
            var parts = this.input.value.split(' ');
            this.input.value = parts[0];
            this.meridian.textContent = parts[1];
        },

        getEditorValue: function(value) {
            value = CellEditor.prototype.getEditorValue.call(this, value);
            if (this.meridian.textContent === 'PM') {
                value += demo.NOON;
            }
            return value;
        }
    });

    grid.cellEditors.add(Time);

    // Used by the cellProvider.
    // `null` means column's data cells are not editable.
    var editorTypes = [
        null,
        'textfield',
        'textfield',
        'textfield',
        null,
        'time',
        'choice',
        'choice',
        'choice',
        'textfield',
        'textfield',
        'textfield'
    ];

    // Override to assign the the cell editors.
    grid.behavior.dataModel.getCellEditorAt = function(x, y, declaredEditorName, cellEvent) {
        var editorName = declaredEditorName || editorTypes[x % editorTypes.length];

        switch (x) {
            case schema.birthState.index:
                cellEvent.textColor = 'red';
                break;
        }

        var cellEditor = grid.cellEditors.create(editorName, cellEvent);

        if (cellEditor) {
            switch (x) {
                case schema.employed.index:
                    cellEditor = null;
                    break;

                case schema.totalNumberOfPetsOwned.index:
                    cellEditor.input.setAttribute('min', 0);
                    cellEditor.input.setAttribute('max', 10);
                    cellEditor.input.setAttribute('step', 0.01);
                    break;
            }
        }

        return cellEditor;
    };
};

},{}],10:[function(require,module,exports){
/* eslint-env browser */

'use strict';

module.exports = function() {

    var demo = this,
        grid = demo.grid,
        schema = grid.behavior.schema;

    //GET CELL
    //all formatting and rendering per cell can be overridden in here
    grid.behavior.dataModel.getCell = function(config, rendererName) {
        if (config.isUserDataArea) {
            var n, hex, travel,
                colIndex = config.dataCell.x,
                rowIndex = config.dataCell.y;

            if (demo.styleRowsFromData) {
                n = grid.behavior.getColumn(schema.totalNumberOfPetsOwned.index).getValue(rowIndex);
                hex = (155 + 10 * (n % 11)).toString(16);
                config.backgroundColor = '#' + hex + hex + hex;
            }

            switch (colIndex) {
                case schema.lastName.index:
                    config.color = config.value != null && (config.value + '')[0] === 'S' ? 'red' : '#191919';
                    config.link = true;
                    break;

                case schema.income.index:
                    travel = 60;
                    break;

                case schema.travel.index:
                    travel = 105;
                    break;
            }

            if (travel) {
                travel += Math.round(config.value * 150 / 100000);
                config.backgroundColor = '#00' + travel.toString(16) + '00';
                config.color = '#FFFFFF';
            }

            //Testing
            if (colIndex === schema.totalNumberOfPetsOwned.index) {
                /*
                 * Be sure to adjust the data set to the appropriate type and shape in widedata.js
                 */

                //return simpleCell; //WORKS
                //return emptyCell; //WORKS
                //return buttonCell; //WORKS
                //return errorCell; //WORKS: Noted that any error in this function steals the main thread by recursion
                //return sparkLineCell; // WORKS
                //return sparkBarCell; //WORKS
                //return sliderCell; //WORKS
                //return treeCell; //Need to figure out data shape to test


                /*
                 * Test of Customized Renderer
                 */
                // if (starry){
                //     config.domain = 5; // default is 100
                //     config.sizeFactor =  0.65; // default is 0.65; size of stars as fraction of height of cell
                //     config.darkenFactor = 0.75; // default is 0.75; star stroke color as fraction of star fill color
                //     config.color = 'gold'; // default is 'gold'; star fill color
                //     config.fgColor =  'grey'; // default is 'transparent' (not rendered); text color
                //     config.fgSelColor = 'yellow'; // default is 'transparent' (not rendered); text selection color
                //     config.bgColor = '#404040'; // default is 'transparent' (not rendered); background color
                //     config.bgSelColor = 'grey'; // default is 'transparent' (not rendered); background selection color
                //     config.shadowColor = 'transparent'; // default is 'transparent'
                //     return starry;
                // }
            }
        }

        return grid.cellRenderers.get(rendererName);
    };

    //END OF GET CELL


    // CUSTOM CELL RENDERER

    var REGEXP_CSS_HEX6 = /^#(..)(..)(..)$/,
        REGEXP_CSS_RGB = /^rgba\((\d+),(\d+),(\d+),\d+\)$/;

    function paintSparkRating(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height,
            options = config.value,
            domain = options.domain || config.domain || 100,
            sizeFactor = options.sizeFactor || config.sizeFactor || 0.65,
            darkenFactor = options.darkenFactor || config.darkenFactor || 0.75,
            color = options.color || config.color || 'gold',
            stroke = this.stroke = color === this.color ? this.stroke : getDarkenedColor(gc, this.color = color, darkenFactor),
            // bgColor = config.isSelected ? (options.bgSelColor || config.bgSelColor) : (options.bgColor || config.bgColor),
            fgColor = config.isSelected ? (options.fgSelColor || config.fgSelColor) : (options.fgColor || config.fgColor),
            shadowColor = options.shadowColor || config.shadowColor || 'transparent',
            // font = options.font || config.font || '11px verdana',
            middle = height / 2,
            diameter = sizeFactor * height,
            outerRadius = sizeFactor * middle,
            val = Number(options.val),
            points = this.points;

        if (!points) {
            var innerRadius = 3 / 7 * outerRadius;
            points = this.points = [];
            for (var i = 5, pi = Math.PI / 2, incr = Math.PI / 5; i; --i, pi += incr) {
                points.push({
                    x: outerRadius * Math.cos(pi),
                    y: middle - outerRadius * Math.sin(pi)
                });
                pi += incr;
                points.push({
                    x: innerRadius * Math.cos(pi),
                    y: middle - innerRadius * Math.sin(pi)
                });
            }
            points.push(points[0]); // close the path
        }

        gc.cache.shadowColor = 'transparent';

        gc.cache.lineJoin = 'round';
        gc.beginPath();
        for (var j = 5, sx = x + 5 + outerRadius; j; --j, sx += diameter) {
            points.forEach(function(point, index) { // eslint-disable-line
                gc[index ? 'lineTo' : 'moveTo'](sx + point.x, y + point.y); // eslint-disable-line
            }); // eslint-disable-line
        }
        gc.closePath();

        val = val / domain * 5;

        gc.cache.fillStyle = color;
        gc.save();
        gc.clip();
        gc.fillRect(x + 5, y,
            (Math.floor(val) + 0.25 + val % 1 * 0.5) * diameter, // adjust width to skip over star outlines and just meter their interiors
            height);
        gc.restore(); // remove clipping region

        gc.cache.strokeStyle = stroke;
        gc.cache.lineWidth = 1;
        gc.stroke();

        if (fgColor && fgColor !== 'transparent') {
            gc.cache.fillStyle = fgColor;
            gc.cache.font = '11px verdana';
            gc.cache.textAlign = 'right';
            gc.cache.textBaseline = 'middle';
            gc.cache.shadowColor = shadowColor;
            gc.cache.shadowOffsetX = gc.cache.shadowOffsetY = 1;
            gc.fillText(val.toFixed(1), x + width + 10, y + height / 2);
        }
    }

    function getDarkenedColor(gc, color, factor) {
        var rgba = getRGBA(gc, color);
        return 'rgba(' + Math.round(factor * rgba[0]) + ',' + Math.round(factor * rgba[1]) + ',' + Math.round(factor * rgba[2]) + ',' + (rgba[3] || 1) + ')';
    }

    function getRGBA(gc, colorSpec) {
        // Normalize variety of CSS color spec syntaxes to one of two
        gc.cache.fillStyle = colorSpec;

        var rgba = colorSpec.match(REGEXP_CSS_HEX6);
        if (rgba) {
            rgba.shift(); // remove whole match
            rgba.forEach(function(val, index) {
                rgba[index] = parseInt(val, 16);
            });
        } else {
            rgba = colorSpec.match(REGEXP_CSS_RGB);
            if (!rgba) {
                throw 'Unexpected format getting CanvasRenderingContext2D.fillStyle';
            }
            rgba.shift(); // remove whole match
        }

        return rgba;
    }


    //Extend HyperGrid's base Renderer
    var sparkStarRatingRenderer = grid.cellRenderers.BaseClass.extend({
        paint: paintSparkRating
    });

    //Register your renderer
    grid.cellRenderers.add('Starry', sparkStarRatingRenderer);

    // END OF CUSTOM CELL RENDERER
    return grid;
};

},{}],11:[function(require,module,exports){
/* eslint-env browser */
/* eslint-disable no-alert */

'use strict';

// Some DOM support functions...
// Besides the canvas, this test harness only has a handful of buttons and checkboxes.
// The following functions service these controls.

module.exports = function() {

    var demo = this,
        grid = demo.grid;

        // make buttons div absolute so buttons width of 100% doesn't stretch to width of dashboard
    var ctrlGroups = document.getElementById('ctrl-groups'),
        dashboard = document.getElementById('dashboard'),
        buttons = document.getElementById('buttons');

    ctrlGroups.style.top = ctrlGroups.getBoundingClientRect().top + 'px';
    //buttons.style.position = 'absolute';
    dashboard.style.display = 'none';

    function toggleRowStylingMethod() {
        demo.styleRowsFromData = !demo.styleRowsFromData;
        grid.repaint();
    }

    // List of properties to show as checkboxes in this demo's "dashboard"
    var toggleProps = [
        {
            label: 'Row styling',
            ctrls: [
                {name: '(Global setting)', label: 'base on data', setter: toggleRowStylingMethod}
            ]
        },
        {
            label: 'Column header rows',
            ctrls: [
                {name: 'showHeaderRow', label: 'header'}, // default "setter" is `setProp`
            ]
        },
        {
            label: 'Hover highlights',
            ctrls: [
                {name: 'hoverCellHighlight.enabled', label: 'cell'},
                {name: 'hoverRowHighlight.enabled', label: 'row'},
                {name: 'hoverColumnHighlight.enabled', label: 'column'}
            ]
        },
        {
            label: 'Link style',
            ctrls: [
                {name: 'linkOnHover', label: 'on hover'},
                {name: 'linkColor', type: 'text', label: 'color'},
                {name: 'linkColorOnHover', label: 'color on hover'}
            ]
        }, {
            label: 'Cell editing',
            ctrls: [
                {name: 'editable'},
                {name: 'editOnDoubleClick', label: 'requires double-click'},
                {name: 'editOnKeydown', label: 'type to edit'}
            ]
        }, {
            label: 'Selection',
            ctrls: [
                {
                    name: 'checkboxOnlyRowSelections', label: 'by row handles only', setter: setSelectionProp,
                    tooltip: 'Note that when this property is active, autoSelectRows will not work.'
                },
                {name: 'singleRowSelectionMode', label: 'one row at a time', setter: setSelectionProp},
                {
                    name: '!multipleSelections',
                    label: 'one cell region at a time',
                    setter: setSelectionProp,
                    checked: true
                },
                {
                    name: 'autoSelectRows', label: 'auto-select rows', setter: setSelectionProp,
                    tooltip: 'Notes:\n' +
                    '1. Requires that checkboxOnlyRowSelections be set to false (so checking this box automatically unchecks that one).\n' +
                    '2. Set singleRowSelectionMode to false to allow auto-select of multiple rows.'
                },
                {name: 'autoSelectColumns', label: 'auto-select columns', setter: setSelectionProp}
            ]
        }
    ];


    toggleProps.forEach(function(prop) {
        addToggle(prop);
    });


    [
        {
            label: 'Toggle Empty Data',
            onclick: demo.toggleEmptyData
        },
        {
            label: 'Set Data', onclick: function() {
            demo.resetData();
            }
        },
        {
            label: 'Set Data 1 (5000 rows)', onclick: function() {
            demo.setData(demo.data.people1);
            }
        },
        {
            label: 'Set Data 2 (10000 rows)', onclick: function() {
            demo.setData(demo.data.people2);
            }
        },
        {
            label: 'Reset Grid',
            onclick: demo.reset
        }
    ].forEach(function(item) {
        var button = document.createElement('button');
        button.innerHTML = item.label;
        button.onclick = item.onclick;
        if (item.title) {
            button.title = item.title;
        }
        buttons.appendChild(button);
    });


    function addToggle(ctrlGroup) {
        var input, label,
            container = document.createElement('div');

        container.className = 'ctrl-group';

        if (ctrlGroup.label) {
            label = document.createElement('div');
            label.className = 'twister';
            label.innerHTML = ctrlGroup.label;
            container.appendChild(label);
        }

        var choices = document.createElement('div');
        choices.className = 'choices';
        container.appendChild(choices);

        ctrlGroup.ctrls.forEach(function(ctrl) {
            if (!ctrl) {
                return;
            }

            var referenceElement,
                type = ctrl.type || 'checkbox',
                tooltip = 'Property name: ' + ctrl.name;

            if (ctrl.tooltip) {
                tooltip += '\n\n' + ctrl.tooltip;
            }

            input = document.createElement('input');
            input.type = type;
            input.id = ctrl.name;
            input.name = ctrlGroup.label;

            switch (type) {
                case 'text':
                    input.value = ctrl.value || getProperty(ctrl.name) || '';
                    input.style.width = '25px';
                    input.style.marginLeft = '4px';
                    input.style.marginRight = '4px';
                    referenceElement = input; // label goes after input
                    break;
                case 'checkbox':
                case 'radio':
                    input.checked = 'checked' in ctrl
                        ? ctrl.checked
                        : getProperty(ctrl.name);
                    referenceElement = null; // label goes before input
                    break;
            }

            input.onchange = function(event) {
                handleRadioClick.call(this, ctrl.setter || setProp, event);
            };

            label = document.createElement('label');
            label.title = tooltip;
            label.appendChild(input);
            label.insertBefore(
                document.createTextNode(' ' + (ctrl.label || ctrl.name)),
                referenceElement
            );

            choices.appendChild(label);

            if (ctrl.name === 'treeview') {
                label.onmousedown = input.onmousedown = function(event) {
                    if (!input.checked && grid.behavior.dataModel.data !== demo.treeData) {
                        alert('Load tree data first ("Set Data 3" button).');
                        event.preventDefault();
                    }
                };
            }
        });

        ctrlGroups.appendChild(container);
    }

    // reset dashboard checkboxes and radio buttons to match current values of grid properties
    Object.getPrototypeOf(demo).resetDashboard = function() {
        toggleProps.forEach(function(prop) {
            prop.ctrls.forEach(function(ctrl) {
                if (ctrl) {
                    switch (ctrl.setter) {
                        case setSelectionProp:
                        case setProp:
                        case undefined:
                            switch (ctrl.type) {
                                case 'radio':
                                case 'checkbox':
                                case undefined:
                                    var id = ctrl.name,
                                        polarity = (id[0] === '!');
                                    document.getElementById(id).checked = getProperty(id) ^ polarity;
                            }
                    }
                }
            });
        });
    };

    function getProperty(key) {
        var keys = key.split('.');
        var prop = grid.properties;

        while (keys.length) {
            prop = prop[keys.shift()];
        }

        return prop;
    }

    document.getElementById('tab-dashboard').addEventListener('click', function(event) {
        if (dashboard.style.display === 'none') {
            dashboard.style.display = 'block';
            grid.div.style.transition = 'margin-left .75s';
            grid.div.style.marginLeft = Math.max(180, dashboard.getBoundingClientRect().right + 8) + 'px';
        } else {
            setTimeout(function() {
                dashboard.style.display = 'none';
            }, 800);
            grid.div.style.marginLeft = '30px';
        }
    });

    var fpsTimer, secs, frames;
    document.getElementById('tab-fps').addEventListener('click', function(event) {
        var el = this, st = el.style;
        if ((grid.properties.enableContinuousRepaint ^= true)) {
            st.backgroundColor = '#666';
            st.textAlign = 'left';
            secs = frames = 0;
            code();
            fpsTimer = setInterval(code, 1000);
        } else {
            clearInterval(fpsTimer);
            st.backgroundColor = st.textAlign = null;
            el.innerHTML = 'FPS';
        }
        function code() {
            var fps = grid.canvas.currentFPS,
                bars = Array(Math.round(fps) + 1).join('I'),
                subrange, span;

            // first span holds the 30 background bars
            el.innerHTML = '';
            el.appendChild(document.createElement('span'));

            // 2nd span holds the numeric
            span = document.createElement('span');

            if (secs) {
                frames += fps;
                span.innerHTML = fps.toFixed(1);
                span.title = secs + '-second average = ' + (frames / secs).toFixed(1);
            }
            secs += 1;

            el.appendChild(span);

            // 0 to 4 color range bar subsets: 1..10:red, 11:20:yellow, 21:30:green
            while ((subrange = bars.substr(0, 12)).length) {
                span = document.createElement('span');
                span.innerHTML = subrange;
                el.appendChild(span);
                bars = bars.substr(12);
            }
        }
    });

    var height;
    document.getElementById('tab-grow-shrink').addEventListener('click', function(event) {
        var label;
        if (!height) {
            height = window.getComputedStyle(grid.div).height;
            grid.div.style.transition = 'height 1.5s linear';
            grid.div.style.height = window.innerHeight + 'px';
            label = 'Shrink';
        } else {
            grid.div.style.height = height;
            height = undefined;
            label = 'Grow';
        }
        this.innerHTML += ' ...';
        setTimeout(function() {
            this.innerHTML = label;
        }.bind(this), 1500);
    });

    document.getElementById('dashboard').addEventListener('click', function(event) {
        var ctrl = event.target;
        if (ctrl.classList.contains('twister')) {
            ctrl.nextElementSibling.style.display = ctrl.classList.toggle('open') ? 'block' : 'none';
            grid.div.style.marginLeft = Math.max(180, event.currentTarget.getBoundingClientRect().right + 8) + 'px';
        }
    });


    var radioGroup = {};

    function handleRadioClick(handler, event) {
        if (this.type === 'radio') {
            var lastRadio = radioGroup[this.name];
            if (lastRadio) {
                lastRadio.handler.call(lastRadio.ctrl);
            }
            radioGroup[this.name] = {ctrl: this, handler: handler};
        }
        handler.call(this, event);
    }

    function setProp() { // standard checkbox click handler
        var prop = grid.properties;
        var id = this.id;
        if (id[0] === '!') {
            if (this.type !== 'checkbox') {
                throw 'Expected inverse operator (!) on checkbox dashboard controls only but found on ' + this.type + '.';
            }
            id = id.substr(1);
            var inverse = true;
        }
        var keys = id.split('.');

        while (keys.length > 1) {
            prop = prop[keys.shift()];
        }

        switch (this.type) {
            case 'text':
                prop[keys.shift()] = this.value;
                break;
            case 'checkbox':
                prop[keys.shift()] = inverse ? !this.checked : this.checked;
                break;
        }

        grid.takeFocus();
        grid.behaviorChanged();
        grid.repaint();
    }

    function setSelectionProp() { // alternate checkbox click handler
        var ctrl;

        grid.selectionModel.clear();

        setProp.call(this);

        if (this.checked) {
            if (
                this.id === 'checkboxOnlyRowSelections' &&
                (ctrl = document.getElementById('autoSelectRows')).checked
            ) {
                alert('Note that autoSelectRows is ineffectual when checkboxOnlyRowSelections is on.');
            } else if (this.id === 'autoSelectRows') {
                if (
                    (ctrl = document.getElementById('checkboxOnlyRowSelections')).checked &&
                    confirm('Note that autoSelectRows is ineffectual when checkboxOnlyRowSelections is on.\n\nTurn off checkboxOnlyRowSelections?')
                ) {
                    ctrl.checked = false;
                    setProp.call(ctrl);
                }

                if (
                    (ctrl = document.getElementById('singleRowSelectionMode')).checked &&
                    confirm('Note that auto-selecting a range of rows by selecting a range of cells (with click + drag or shift + click) is not possible with singleRowSelectionMode is on.\n\nTurn off singleRowSelectionMode?')
                ) {
                    ctrl.checked = false;
                    setProp.call(ctrl);
                }
            }
        }
    }
};

},{}],12:[function(require,module,exports){
'use strict';

module.exports = function() {

    var demo = this,
        grid = demo.grid;

    grid.addEventListener('fin-button-pressed', function(e) {
        var cellEvent = e.detail;
        cellEvent.value = !cellEvent.value;
    });

    grid.addEventListener('fin-cell-enter', function(e) {
        var cellEvent = e.detail;

        //how to set the tooltip....
        grid.setAttribute('title', 'event name: "fin-cell-enter"\n' +
            'gridCell: { x: ' + cellEvent.gridCell.x + ', y: ' + cellEvent.gridCell.y + ' }\n' +
            'dataCell: { x: ' + cellEvent.dataCell.x + ', y: ' + cellEvent.dataCell.y + ' }\n' +
            'subgrid type: "' + cellEvent.subgrid.type + '"\n' +
            'subgrid name: ' + (cellEvent.subgrid.name ? '"' + cellEvent.subgrid.name + '"' : 'undefined')
        );
    });

    grid.addEventListener('fin-set-totals-value', function(e) {
        var detail = e.detail,
            areas = detail.areas || ['top', 'bottom'];

        areas.forEach(function(area) {
            var methodName = 'get' + area[0].toUpperCase() + area.substr(1) + 'Totals',
                totalsRow = grid.behavior.dataModel[methodName]();

            totalsRow[detail.y][detail.x] = detail.value;
        });

        grid.repaint();
    });

    /**
     * @summary Listen for certain key presses from grid or cell editor.
     * @desc NOTE: fincanvas's internal char map yields mixed case while fin-editor-key* events do not.
     * @return {boolean} Not handled.
     */
    function handleCursorKey(e) {
        var detail = e.detail,
            key = String.fromCharCode(detail.key).toUpperCase(),
            result = false; // means event handled herein

        if (detail.ctrl) {
            if (detail.shift) {
                switch (key) {
                    case '0': if (grid.stopEditing()) { grid.selectToViewportCell(0, 0); } break;
                    case '9': if (grid.stopEditing()) { grid.selectToFinalCell(); } break;
                    case '8': if (grid.stopEditing()) { grid.selectToFinalCellOfCurrentRow(); } break;
                    case '7': if (grid.stopEditing()) { grid.selectToFirstCellOfCurrentRow(); } break;
                    default: result = true;
                }
            } else {
                switch (key) {
                    case '0': if (grid.stopEditing()) { grid.selectViewportCell(0, 0); } break;
                    case '9': if (grid.stopEditing()) { grid.selectFinalCell(); } break;
                    case '8': if (grid.stopEditing()) { grid.selectFinalCellOfCurrentRow(); } break;
                    case '7': if (grid.stopEditing()) { grid.selectFirstCellOfCurrentRow(); } break;
                    default: result = true;
                }
            }
        }

        return result;
    }

    grid.addEventListener('fin-keydown', handleCursorKey);

    grid.addEventListener('fin-editor-keydown', function(e) {
        // var detail = e.detail,
        //     ke = detail.keyEvent;
        //
        // // more detail, please
        // detail.primitiveEvent = ke;
        // detail.key = ke.keyCode;
        // detail.shift = ke.shiftKey;
        //
        // handleCursorKey(e);
    });

    grid.addEventListener('fin-selection-changed', function(e) {

        if (e.detail.selections.length === 0) {
            console.log('no selections');
            return;
        }

        // to get the selected rows uncomment the below.....
        // console.log(grid.getRowSelectionMatrix());
        // console.log(grid.getRowSelection());

    });

    grid.addEventListener('fin-row-selection-changed', function(e) {
        var detail = e.detail;
        // Move cell selection with row selection
        var rows = detail.rows,
            selections = detail.selections;
        if (
            grid.properties.singleRowSelectionMode && // let's only attempt this when in this mode
            !grid.properties.multipleSelections && // and only when in single selection mode
            rows.length && // user just selected a row (must be single row due to mode we're in)
            selections.length  // there was a cell region selected (must be the only one)
        ) {
            var rect = grid.selectionModel.getLastSelection(), // the only cell selection
                x = rect.left,
                y = rows[0], // we know there's only 1 row selected
                width = rect.right - x,
                height = 0, // collapse the new region to occupy a single row
                fireSelectionChangedEvent = false;

            grid.selectionModel.select(x, y, width, height, fireSelectionChangedEvent);
            grid.repaint();
        }

        if (rows.length === 0) {
            console.log('no rows selected');
            return;
        }
        //we have a function call to create the selection matrix because
        //we don't want to create alot of needless garbage if the user
        //is just navigating around
        console.log(grid.getRowSelectionMatrix());
        console.log(grid.getRowSelection());
    });

    grid.addEventListener('fin-column-selection-changed', function(e) {
        if (e.detail.columns.length === 0) {
            console.log('no rows selected');
            return;
        }
        //we have a function call to create the selection matrix because
        //we don't want to create alot of needless garbage if the user
        //is just navigating around
        console.log(grid.getColumnSelectionMatrix());
        console.log(grid.getColumnSelection());
    });

    //uncomment to cancel editor popping up:
    // grid.addEventListener('fin-request-cell-edit', function(e) { e.preventDefault(); });

    //uncomment to cancel updating the model with the new data:
    // grid.addEventListener('fin-before-cell-edit', function(e) { e.preventDefault(); });
};

},{}],13:[function(require,module,exports){
/* eslint-env browser */

'use strict';

module.exports = function() {

    var demo = this,
        grid = demo.grid;

    var footInchPattern = /^\s*((((\d+)')?\s*((\d+)")?)|\d+)\s*$/;

    var footInchLocalizer = {
        format: function(value) {
            if (value != null) {
                var feet = Math.floor(value / 12);
                value = (feet ? feet + '\'' : '') + ' ' + (value % 12) + '"';
            } else {
                value = null;
            }
            return value;
        },
        parse: function(str) {
            var inches, feet,
                parts = str.match(footInchPattern);
            if (parts) {
                feet = parts[4];
                inches = parts[6];
                if (feet === undefined && inches === undefined) {
                    inches = Number(parts[1]);
                } else {
                    feet = Number(feet || 0);
                    inches = Number(inches || 0);
                    inches = 12 * feet + inches;
                }
            } else {
                inches = 0;
            }
            return inches;
        }
    };

    grid.localization.add('foot', footInchLocalizer);

    grid.localization.add('singdate', new grid.localization.DateFormatter('zh-SG'));

    grid.localization.add('pounds', new grid.localization.NumberFormatter('en-US', {
        style: 'currency',
        currency: 'USD'
    }));

    grid.localization.add('francs', new grid.localization.NumberFormatter('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }));

    grid.localization.add({
        name: 'hhmm', // alternative to having to hame localizer in `grid.localization.add`

        // returns formatted string from number
        format: function(mins) {
            var hh = Math.floor(mins / 60) % 12 || 12, // modulo 12 hrs with 0 becoming 12
                mm = (mins % 60 + 100 + '').substr(1, 2),
                AmPm = mins < demo.NOON ? 'AM' : 'PM';
            return hh + ':' + mm + ' ' + AmPm;
        },

        invalid: function(hhmm) {
            return !/^(0?[1-9]|1[0-2]):[0-5]\d$/.test(hhmm); // 12:59 max
        },

        // returns number from formatted string
        parse: function(hhmm) {
            var parts = hhmm.match(/^(\d+):(\d{2})$/);
            return Number(parts[1]) * 60 + Number(parts[2]);
        }
    });

    return grid;

};

},{}],14:[function(require,module,exports){
/* eslint-env browser */

'use strict';

window.onload = function() {
    window.demo = new Demo;
};

var Hypergrid = fin.Hypergrid;

function Demo() {
    var version = document.getElementById('version'),
        titleElement = document.querySelector('title');

    version.innerText = Hypergrid.prototype.version;
    titleElement.innerText = version.parentElement.innerText;

    var gridOptions = {
        // Because v3 defaults to use datasaur-local (which is still included in the build),
        // specifying it here is still optional, but may be required for v4.
        // Uncomment one of the following 2 lines to specify ("bring your own") data source:

        // dataModel: new (Hypergrid.require('datasaur-local'))(data.people1, getSchema(data.people1)),
        // DataModel: Hypergrid.require('datasaur-local'),

        data: this.data.people1,
        margin: { bottom: '17px', right: '17px' },
        plugins: this.plugins,
        // schema: myCustomSchema,
        state: { color: 'orange' }
    };

    var grid = new Hypergrid('div#hypergrid-example', gridOptions);

    Object.defineProperties(window, {
        grid: { get: function() { return grid; } },
        g: { get: function() { return grid; } },
        b: { get: function() { return grid.behavior; } },
        m: { get: function() { return grid.behavior.dataModel; } }
    });

    this.grid = grid;

    console.log('schema', grid.behavior.schema);

    this.initCellRenderers();
    this.initFormatters();
    this.initCellEditors();
    this.initEvents();
    this.initDashboard();
    this.initState();
}

Demo.prototype = {
    data: require('../demo/data/widedata'),
    initCellRenderers: require('./cellrenderers'),
    initFormatters: require('./formatters'),
    initCellEditors: require('./celleditors'),
    initEvents: require('./events'),
    initDashboard: require('./dashboard'),
    initState: require('./setState'),

    plugins: require('fin-hypergrid-event-logger'),

    reset: function() {
        this.grid.reset();
        this.initEvents();
    },

    setData: function(data, options) {
        options = !data.length ? undefined : options || {
            schema: getSchema(data)
        };
        this.grid.setData(data, options);
    },

    toggleEmptyData: function toggleEmptyData() {
        var behavior = this.grid.behavior;

        if (!this.oldData) {
            this.oldData = {
                data: behavior.dataModel.data,
                schema: behavior.schema,
                activeColumns: behavior.getActiveColumns().map(function(column) { return column.index; })
            };
            //important to set top totals first
            setData([]);
        } else {
            //important to set top totals first
            this.setData(this.oldData.data, this.oldData.schema);
            behavior.setColumnIndexes(this.oldData.activeColumns);
            delete this.oldData;
        }
    },

    resetData: function() {
        this.setData(this.data.people1);
        this.initState();
    },

    set vent(start) {
        if (start) {
            this.grid.logStart();
        } else {
            this.grid.logStop();
        }
    }
};

},{"../demo/data/widedata":1,"./celleditors":9,"./cellrenderers":10,"./dashboard":11,"./events":12,"./formatters":13,"./setState":15,"fin-hypergrid-event-logger":4}],15:[function(require,module,exports){
'use strict';

module.exports = function() {

    var demo = this,
        grid = demo.grid,
        schema = grid.behavior.schema,
        greenland = { color: '#116611', backgroundColor: '#e8ffe8', font: 'italic small garamond' };

    var state = {
        columnIndexes: [
            schema.lastName.index,
            schema.totalNumberOfPetsOwned.index,
            schema.height.index,
            schema.birthDate.index,
            schema.birthTime.index,
            schema.birthState.index,
            // schema.residenceState.index,
            schema.employed.index,
            // schema.firstName.index,
            schema.income.index,
            schema.travel.index,
            // schema.squareOfIncome.index
        ],

        noDataMessage: 'No Data to Display',
        backgroundColor: 'white',
        font: 'normal small garamond',
        rowStripes: [
            undefined,
            undefined,
            undefined,
            greenland,
            greenland,
            greenland
        ],

        fixedColumnCount: 1,
        fixedRowCount: 4,

        columnAutosizing: false,
        headerTextWrapping: true,

        halign: 'left',
        renderFalsy: true,

        scrollbarHoverOff: 'visible',
        scrollbarHoverOver: 'visible',
        columnHeaderBackgroundColor: 'pink',

        checkboxOnlyRowSelections: true,

        autoSelectRows: true,

        calculators: {
            Add10: add10.toString()
        },

        columns: {
            height: {
                halign: 'right',
                format: 'foot'
            },

            /* eslint-disable camelcase */
            last_name: {
                columnHeaderBackgroundColor: '#142B6F', //dark blue
                columnHeaderColor: 'white',
                columnHeaderHalign: 'left',
                rightIcon: 'down-rectangle',
                link: true
            },

            first_name: {

            },

            total_number_of_pets_owned: {
                halign: 'center',
                format: 'number',
                calculator: 'Add10',
                color: 'green'
            },

            birthDate: {
                format: 'singdate',
                rightIcon: 'calendar',
                //strikeThrough: true
            },

            birthTime: {
                halign: 'right',
                editor: 'time',
                format: 'hhmm'
            },

            birthState: {
                editor: 'colortext',
                rightIcon: 'down-rectangle'
            },

            residenceState: {
                rightIcon: 'down-rectangle'
            },

            employed: {
                halign: 'right',
                renderer: 'button',
                backgroundColor: 'white'
            },

            income: {
                halign: 'right',
                format: 'pounds'
            },

            travel: {
                halign: 'right',
                format: 'francs'
            }
        },

        /* Following `rows` and `cells` examples shows how to set row and cell properties declaratively,
         * useful for static grids when cell coordinates are known ahead of time.
         *
         * (There are as well several equivalent programmatic methods for setting cells props, such as
         * `cell.setProperty`,
         * `cell.setProperties`,
         * `behavior.setCellProperty`,
         * `behavior.setCellProperties`,
         * _etc._)
         *
         * Caveat: For dynamic grid data, when cell coordinates are *not* known at start up (when state is
         * usually applied), loading row and cell properties _with the data_ (as metadata) has advantages
         * and is, preferred especially for frequently changing rows and cells. In this paradigm, row and
         * cell properties are omitted here and the state object only loads grid and column properties.
         * (Metadata is supported in the data source when it implements `getRowMetaData` and `setRowMetaData`.)
         */
        rows: {
            header: { // subgrid key
                0: { // row index
                    // row properties
                    height: 40 // (height is the only supported row property at the current time)
                }
            }
        },
        cells: { // cell properties
            data: { // subgrid key
                16: { // row index
                    height: { // column name
                        // cell properties:
                        font: '10pt Tahoma',
                        color: 'lightblue',
                        backgroundColor: 'red',
                        halign: 'left'
                    }
                }
            }
        }
    };

    grid.setState(state);

    grid.takeFocus();

    demo.resetDashboard();
};

function add10(dataRow, columnName, subrow) {
    var val = dataRow[columnName];
    if (val.constructor === Array) { val = val[subrow]; }
    return val + 10;
}

},{}]},{},[14])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImRlbW8vZGF0YS93aWRlZGF0YS5qcyIsIm5vZGVfbW9kdWxlcy9jb2RlLW1hdGNoL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Zpbi1oeXBlcmdyaWQtZXZlbnQtbG9nZ2VyL2N1c3RvbS1saXN0ZW5lcnMuanMiLCJub2RlX21vZHVsZXMvZmluLWh5cGVyZ3JpZC1ldmVudC1sb2dnZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ3JleWxpc3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbWF0Y2gtcG9pbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWNhdGFsb2cvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3RhcmxvZy9pbmRleC5qcyIsInRlc3RiZW5jaC9jZWxsZWRpdG9ycy5qcyIsInRlc3RiZW5jaC9jZWxscmVuZGVyZXJzLmpzIiwidGVzdGJlbmNoL2Rhc2hib2FyZC5qcyIsInRlc3RiZW5jaC9ldmVudHMuanMiLCJ0ZXN0YmVuY2gvZm9ybWF0dGVycy5qcyIsInRlc3RiZW5jaC9pbmRleC5qcyIsInRlc3RiZW5jaC9zZXRTdGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbnVtUm93cyA9IDEwMDAwO1xuXG52YXIgZmlyc3ROYW1lcyA9IFsnJywgJ09saXZpYScsICdTb3BoaWEnLCAnQXZhJywgJ0lzYWJlbGxhJywgJ0JveScsICdMaWFtJywgJ05vYWgnLCAnRXRoYW4nLCAnTWFzb24nLCAnTG9nYW4nLCAnTW9lJywgJ0xhcnJ5JywgJ0N1cmx5JywgJ1NoZW1wJywgJ0dyb3VjaG8nLCAnSGFycG8nLCAnQ2hpY28nLCAnWmVwcG8nLCAnU3RhbmxleScsICdIYXJkeSddO1xudmFyIGxhc3ROYW1lcyA9IFsnJywgJ1dpcnRzJywgJ09uZWlsJywgJ1NtaXRoJywgJ0JhcmJhcm9zYScsICdTb3ByYW5vJywgJ0dvdHRpJywgJ0NvbHVtYm8nLCAnTHVjaWFubycsICdEb2VycmUnLCAnRGVQZW5hJ107XG52YXIgbW9udGhzID0gWycwMScsICcwMicsICcwMycsICcwNCcsICcwNScsICcwNicsICcwNycsICcwOCcsICcwOScsICcxMCcsICcxMScsICcxMiddO1xudmFyIGRheXMgPSBbJzAxJywgJzAyJywgJzAzJywgJzA0JywgJzA1JywgJzA2JywgJzA3JywgJzA4JywgJzA5JywgJzEwJywgJzExJywgJzEyJywgJzEzJywgJzE0JywgJzE1JywgJzE2JywgJzE3JywgJzE4JywgJzE5JywgJzIwJywgJzIxJywgJzIyJywgJzIzJywgJzI0JywgJzI1JywgJzI2JywgJzI3JywgJzI4JywgJzI5JywgJzMwJ107XG52YXIgc3RhdGVzID0gWycnLCAnQWxhYmFtYScsICdBbGFza2EnLCAnQXJpem9uYScsICdBcmthbnNhcycsICdDYWxpZm9ybmlhJywgJ0NvbG9yYWRvJywgJ0Nvbm5lY3RpY3V0JywgJ0RlbGF3YXJlJywgJ0Zsb3JpZGEnLCAnR2VvcmdpYScsICdIYXdhaWknLCAnSWRhaG8nLCAnSWxsaW5vaXMnLCAnSW5kaWFuYScsICdJb3dhJywgJ0thbnNhcycsICdLZW50dWNreScsICdMb3Vpc2lhbmEnLCAnTWFpbmUnLCAnTWFyeWxhbmQnLCAnTWFzc2FjaHVzZXR0cycsICdNaWNoaWdhbicsICdNaW5uZXNvdGEnLCAnTWlzc2lzc2lwcGknLCAnTWlzc291cmknLCAnTW9udGFuYScsICdOZWJyYXNrYScsICdOZXZhZGEnLCAnTmV3IEhhbXBzaGlyZScsICdOZXcgSmVyc2V5JywgJ05ldyBNZXhpY28nLCAnTmV3IFlvcmsnLCAnTm9ydGggQ2Fyb2xpbmEnLCAnTm9ydGggRGFrb3RhJywgJ09oaW8nLCAnT2tsYWhvbWEnLCAnT3JlZ29uJywgJ1Blbm5zeWx2YW5pYScsICdSaG9kZSBJc2xhbmQnLCAnU291dGggQ2Fyb2xpbmEnLCAnU291dGggRGFrb3RhJywgJ1Rlbm5lc3NlZScsICdUZXhhcycsICdVdGFoJywgJ1Zlcm1vbnQnLCAnVmlyZ2luaWEnLCAnV2FzaGluZ3RvbicsICdXZXN0IFZpcmdpbmlhJywgJ1dpc2NvbnNpbicsICdXeW9taW5nJ107XG5cbnZhciByYW5kb21GdW5jID0gTWF0aC5yYW5kb207XG4vL3ZhciByYW5kb21GdW5jID0gcm5kO1xuXG52YXIgcm5kID0gZnVuY3Rpb24gKG1heCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbUZ1bmMoKSAqIG1heCk7XG59XG5cbnZhciByYW5kb21QZXJzb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZmlyc3ROYW1lID0gTWF0aC5yb3VuZCgoZmlyc3ROYW1lcy5sZW5ndGggLSAxKSAqIHJhbmRvbUZ1bmMoKSk7XG4gICAgLy92YXIgbGFzdE5hbWUgPSAnYScgKyByYW5kb21GdW5jKCkgKyAnYic7XG4gICAgdmFyIGxhc3ROYW1lID0gTWF0aC5yb3VuZCgobGFzdE5hbWVzLmxlbmd0aCAtIDEpICogcmFuZG9tRnVuYygpKTtcbiAgICB2YXIgcGV0cyA9IE1hdGgucm91bmQoMTAgKiByYW5kb21GdW5jKCkpO1xuICAgIHZhciBoZWlnaHQgPSA1MCArIE1hdGgucm91bmQoNDAgKiByYW5kb21GdW5jKCkpO1xuICAgIHZhciBiaXJ0aHllYXIgPSAxOTAwICsgTWF0aC5yb3VuZChyYW5kb21GdW5jKCkgKiAxMTQpO1xuICAgIHZhciBiaXJ0aG1vbnRoID0gTWF0aC5yb3VuZChyYW5kb21GdW5jKCkgKiAxMSk7XG4gICAgdmFyIGJpcnRoZGF5ID0gTWF0aC5yb3VuZChyYW5kb21GdW5jKCkgKiAyOSk7XG4gICAgdmFyIGJpcnRoVGltZSA9IE1hdGgucm91bmQocmFuZG9tRnVuYygpICogNjAgKiAyNCk7XG4gICAgdmFyIGJpcnRoc3RhdGUgPSBNYXRoLnJvdW5kKHJhbmRvbUZ1bmMoKSAqIChzdGF0ZXMubGVuZ3RoIC0gMSkpO1xuICAgIHZhciByZXNpZGVuY2VzdGF0ZSA9IE1hdGgucm91bmQocmFuZG9tRnVuYygpICogKHN0YXRlcy5sZW5ndGggLSAxKSk7XG4gICAgdmFyIHRyYXZlbCA9IHJhbmRvbUZ1bmMoKSAqIDEwMDA7XG4gICAgdmFyIGluY29tZSA9IHJhbmRvbUZ1bmMoKSAqIDEwMDAwMDtcbiAgICB2YXIgZW1wbG95ZWQgPSBNYXRoLnJvdW5kKHJhbmRvbUZ1bmMoKSk7XG5cbiAgICAvL1VzZSB0aGlzIHRvIHRlc3QgU3BhcmtsaW5lIG9yIFNwYXJrYmFyXG4gICAgdmFyIHNwYXJrRGF0YSA9ICAoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYmFyUmFuZG9tT2Zmc2V0cyA9IFtdO1xuICAgICAgICAvL2ZvciAodmFyIGkgPSAwOyBpIDwgMjA7IGkrKykge1xuICAgICAgICAvLyAgICBiYXJSYW5kb21PZmZzZXRzLnB1c2goW10pO1xuXG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgMTA7IHIrKykge1xuICAgICAgICAgICAgYmFyUmFuZG9tT2Zmc2V0cy5wdXNoKDEwIC0gcm5kKDIwKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy99XG4gICAgICAgIHJldHVybiBiYXJSYW5kb21PZmZzZXRzXG4gICAgfSkoKVxuICAgIHZhciBzbGlkZXJEYXRhID0gTWF0aC5yb3VuZChyYW5kb21GdW5jKCkgKiAxMSk7XG4gICAgdmFyIHBlcnNvbiA9IHtcbiAgICAgICAgbGFzdF9uYW1lOiBsYXN0TmFtZXNbbGFzdE5hbWVdLCAvL2pzaGludCBpZ25vcmU6bGluZVxuICAgICAgICBmaXJzdF9uYW1lOiBmaXJzdE5hbWVzW2ZpcnN0TmFtZV0sIC8vanNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgIHRvdGFsX251bWJlcl9vZl9wZXRzX293bmVkOiBwZXRzLFxuICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgYmlydGhEYXRlOiBuZXcgRGF0ZShiaXJ0aHllYXIgKyAnLScgKyBtb250aHNbYmlydGhtb250aF0gKyAnLScgKyBkYXlzW2JpcnRoZGF5XSksXG4gICAgICAgIGJpcnRoVGltZTogYmlydGhUaW1lLFxuICAgICAgICBiaXJ0aFN0YXRlOiBzdGF0ZXNbYmlydGhzdGF0ZV0sXG4gICAgICAgIHJlc2lkZW5jZVN0YXRlOiBzdGF0ZXNbcmVzaWRlbmNlc3RhdGVdLFxuICAgICAgICBlbXBsb3llZDogZW1wbG95ZWQgPT09IDEsXG4gICAgICAgIGluY29tZTogaW5jb21lLFxuICAgICAgICB0cmF2ZWw6IHRyYXZlbCxcbiAgICAgICAgc3F1YXJlT2ZJbmNvbWU6IDAsXG5cbiAgICAgICAgb25lX2xhc3RfbmFtZTogbGFzdE5hbWVzW2xhc3ROYW1lXSwgLy9qc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgb25lX2ZpcnN0X25hbWU6IGZpcnN0TmFtZXNbZmlyc3ROYW1lXSwgLy9qc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgb25lX3BldHM6IHBldHMsXG4gICAgICAgIG9uZV9oZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgb25lX2JpcnRoRGF0ZTogYmlydGh5ZWFyICsgJy0nICsgbW9udGhzW2JpcnRobW9udGhdICsgJy0nICsgZGF5c1tiaXJ0aGRheV0sXG4gICAgICAgIG9uZV9iaXJ0aFN0YXRlOiBzdGF0ZXNbYmlydGhzdGF0ZV0sXG4gICAgICAgIG9uZV9iaXJ0aFRpbWU6IGJpcnRoVGltZSxcbiAgICAgICAgb25lX3Jlc2lkZW5jZVN0YXRlOiBzdGF0ZXNbcmVzaWRlbmNlc3RhdGVdLFxuICAgICAgICBvbmVfZW1wbG95ZWQ6IGVtcGxveWVkID09PSAxLFxuICAgICAgICBvbmVfaW5jb21lOiBpbmNvbWUsXG4gICAgICAgIG9uZV90cmF2ZWw6IHRyYXZlbCxcbiAgICAgICAgb25lX3NxdWFyZU9mSW5jb21lOiAwLFxuXG4gICAgICAgIHR3b19sYXN0X25hbWU6IGxhc3ROYW1lc1tsYXN0TmFtZV0sIC8vanNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgIHR3b19maXJzdF9uYW1lOiBmaXJzdE5hbWVzW2ZpcnN0TmFtZV0sIC8vanNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgIHR3b19wZXRzOiBwZXRzLFxuICAgICAgICB0d29faGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgIHR3b19iaXJ0aERhdGU6IGJpcnRoeWVhciArICctJyArIG1vbnRoc1tiaXJ0aG1vbnRoXSArICctJyArIGRheXNbYmlydGhkYXldLFxuICAgICAgICB0d29fYmlydGhTdGF0ZTogc3RhdGVzW2JpcnRoc3RhdGVdLFxuICAgICAgICB0d29fYmlydGhUaW1lOiBiaXJ0aFRpbWUsXG4gICAgICAgIHR3b19yZXNpZGVuY2VTdGF0ZTogc3RhdGVzW3Jlc2lkZW5jZXN0YXRlXSxcbiAgICAgICAgdHdvX2VtcGxveWVkOiBlbXBsb3llZCA9PT0gMSxcbiAgICAgICAgdHdvX2luY29tZTogaW5jb21lLFxuICAgICAgICB0d29fdHJhdmVsOiB0cmF2ZWwsXG4gICAgICAgIHR3b19zcXVhcmVPZkluY29tZTogMCxcblxuICAgICAgICB0aHJlZV9sYXN0X25hbWU6IGxhc3ROYW1lc1tsYXN0TmFtZV0sIC8vanNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgIHRocmVlX2ZpcnN0X25hbWU6IGZpcnN0TmFtZXNbZmlyc3ROYW1lXSwgLy9qc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgdGhyZWVfcGV0czogcGV0cyxcbiAgICAgICAgdGhyZWVfaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgIHRocmVlX2JpcnRoRGF0ZTogYmlydGh5ZWFyICsgJy0nICsgbW9udGhzW2JpcnRobW9udGhdICsgJy0nICsgZGF5c1tiaXJ0aGRheV0sXG4gICAgICAgIHRocmVlX2JpcnRoU3RhdGU6IHN0YXRlc1tiaXJ0aHN0YXRlXSxcbiAgICAgICAgdGhyZWVfYmlydGhUaW1lOiBiaXJ0aFRpbWUsXG4gICAgICAgIHRocmVlX3Jlc2lkZW5jZVN0YXRlOiBzdGF0ZXNbcmVzaWRlbmNlc3RhdGVdLFxuICAgICAgICB0aHJlZV9lbXBsb3llZDogZW1wbG95ZWQgPT09IDEsXG4gICAgICAgIHRocmVlX2luY29tZTogaW5jb21lLFxuICAgICAgICB0aHJlZV90cmF2ZWw6IHRyYXZlbCxcbiAgICAgICAgdGhyZWVfc3F1YXJlT2ZJbmNvbWU6IDAsXG5cbiAgICAgICAgZm91cl9sYXN0X25hbWU6IGxhc3ROYW1lc1tsYXN0TmFtZV0sIC8vanNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgIGZvdXJfZmlyc3RfbmFtZTogZmlyc3ROYW1lc1tmaXJzdE5hbWVdLCAvL2pzaGludCBpZ25vcmU6bGluZVxuICAgICAgICBmb3VyX3BldHM6IHBldHMsXG4gICAgICAgIGZvdXJfaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgIGZvdXJfYmlydGhEYXRlOiBiaXJ0aHllYXIgKyAnLScgKyBtb250aHNbYmlydGhtb250aF0gKyAnLScgKyBkYXlzW2JpcnRoZGF5XSxcbiAgICAgICAgZm91cl9iaXJ0aFN0YXRlOiBzdGF0ZXNbYmlydGhzdGF0ZV0sXG4gICAgICAgIGZvdXJfYmlydGhUaW1lOiBiaXJ0aFRpbWUsXG4gICAgICAgIGZvdXJfcmVzaWRlbmNlU3RhdGU6IHN0YXRlc1tyZXNpZGVuY2VzdGF0ZV0sXG4gICAgICAgIGZvdXJfZW1wbG95ZWQ6IGVtcGxveWVkID09PSAxLFxuICAgICAgICBmb3VyX2luY29tZTogaW5jb21lLFxuICAgICAgICBmb3VyX3RyYXZlbDogdHJhdmVsLFxuICAgICAgICBmb3VyX3NxdWFyZU9mSW5jb21lOiAwLFxuXG4gICAgICAgIGZpdmVfbGFzdF9uYW1lOiBsYXN0TmFtZXNbbGFzdE5hbWVdLCAvL2pzaGludCBpZ25vcmU6bGluZVxuICAgICAgICBmaXZlX2ZpcnN0X25hbWU6IGZpcnN0TmFtZXNbZmlyc3ROYW1lXSwgLy9qc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgZml2ZV9wZXRzOiBwZXRzLFxuICAgICAgICBmaXZlX2hlaWdodDogaGVpZ2h0LFxuICAgICAgICBmaXZlX2JpcnRoRGF0ZTogYmlydGh5ZWFyICsgJy0nICsgbW9udGhzW2JpcnRobW9udGhdICsgJy0nICsgZGF5c1tiaXJ0aGRheV0sXG4gICAgICAgIGZpdmVfYmlydGhTdGF0ZTogc3RhdGVzW2JpcnRoc3RhdGVdLFxuICAgICAgICBmaXZlX2JpcnRoVGltZTogYmlydGhUaW1lLFxuICAgICAgICBmaXZlX3Jlc2lkZW5jZVN0YXRlOiBzdGF0ZXNbcmVzaWRlbmNlc3RhdGVdLFxuICAgICAgICBmaXZlX2VtcGxveWVkOiBlbXBsb3llZCA9PT0gMSxcbiAgICAgICAgZml2ZV9pbmNvbWU6IGluY29tZSxcbiAgICAgICAgZml2ZV90cmF2ZWw6IHRyYXZlbCxcbiAgICAgICAgZml2ZV9zcXVhcmVPZkluY29tZTogMCxcblxuICAgICAgICBzaXhfbGFzdF9uYW1lOiBsYXN0TmFtZXNbbGFzdE5hbWVdLCAvL2pzaGludCBpZ25vcmU6bGluZVxuICAgICAgICBzaXhfZmlyc3RfbmFtZTogZmlyc3ROYW1lc1tmaXJzdE5hbWVdLCAvL2pzaGludCBpZ25vcmU6bGluZVxuICAgICAgICBzaXhfcGV0czogcGV0cyxcbiAgICAgICAgc2l4X2hlaWdodDogaGVpZ2h0LFxuICAgICAgICBzaXhfYmlydGhEYXRlOiBiaXJ0aHllYXIgKyAnLScgKyBtb250aHNbYmlydGhtb250aF0gKyAnLScgKyBkYXlzW2JpcnRoZGF5XSxcbiAgICAgICAgc2l4X2JpcnRoU3RhdGU6IHN0YXRlc1tiaXJ0aHN0YXRlXSxcbiAgICAgICAgc2l4X2JpcnRoVGltZTogYmlydGhUaW1lLFxuICAgICAgICBzaXhfcmVzaWRlbmNlU3RhdGU6IHN0YXRlc1tyZXNpZGVuY2VzdGF0ZV0sXG4gICAgICAgIHNpeF9lbXBsb3llZDogZW1wbG95ZWQgPT09IDEsXG4gICAgICAgIHNpeF9pbmNvbWU6IGluY29tZSxcbiAgICAgICAgc2l4X3RyYXZlbDogdHJhdmVsLFxuICAgICAgICBzaXhfc3F1YXJlT2ZJbmNvbWU6IDAsXG5cbiAgICAgICAgc2V2ZW5fbGFzdF9uYW1lOiBsYXN0TmFtZXNbbGFzdE5hbWVdLCAvL2pzaGludCBpZ25vcmU6bGluZVxuICAgICAgICBzZXZlbl9maXJzdF9uYW1lOiBmaXJzdE5hbWVzW2ZpcnN0TmFtZV0sIC8vanNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgIHNldmVuX3BldHM6IHBldHMsXG4gICAgICAgIHNldmVuX2hlaWdodDogaGVpZ2h0LFxuICAgICAgICBzZXZlbl9iaXJ0aERhdGU6IGJpcnRoeWVhciArICctJyArIG1vbnRoc1tiaXJ0aG1vbnRoXSArICctJyArIGRheXNbYmlydGhkYXldLFxuICAgICAgICBzZXZlbl9iaXJ0aFN0YXRlOiBzdGF0ZXNbYmlydGhzdGF0ZV0sXG4gICAgICAgIHNldmVuX2JpcnRoVGltZTogYmlydGhUaW1lLFxuICAgICAgICBzZXZlbl9yZXNpZGVuY2VTdGF0ZTogc3RhdGVzW3Jlc2lkZW5jZXN0YXRlXSxcbiAgICAgICAgc2V2ZW5fZW1wbG95ZWQ6IGVtcGxveWVkID09PSAxLFxuICAgICAgICBzZXZlbl9pbmNvbWU6IGluY29tZSxcbiAgICAgICAgc2V2ZW5fdHJhdmVsOiB0cmF2ZWwsXG4gICAgICAgIHNldmVuX3NxdWFyZU9mSW5jb21lOiAwLFxuXG4gICAgICAgIGVpZ2h0X2xhc3RfbmFtZTogbGFzdE5hbWVzW2xhc3ROYW1lXSwgLy9qc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgZWlnaHRfZmlyc3RfbmFtZTogZmlyc3ROYW1lc1tmaXJzdE5hbWVdLCAvL2pzaGludCBpZ25vcmU6bGluZVxuICAgICAgICBlaWdodF9wZXRzOiBwZXRzLFxuICAgICAgICBlaWdodF9oZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgZWlnaHRfYmlydGhEYXRlOiBiaXJ0aHllYXIgKyAnLScgKyBtb250aHNbYmlydGhtb250aF0gKyAnLScgKyBkYXlzW2JpcnRoZGF5XSxcbiAgICAgICAgZWlnaHRfYmlydGhTdGF0ZTogc3RhdGVzW2JpcnRoc3RhdGVdLFxuICAgICAgICBlaWdodF9iaXJ0aFRpbWU6IGJpcnRoVGltZSxcbiAgICAgICAgZWlnaHRfcmVzaWRlbmNlU3RhdGU6IHN0YXRlc1tyZXNpZGVuY2VzdGF0ZV0sXG4gICAgICAgIGVpZ2h0X2VtcGxveWVkOiBlbXBsb3llZCA9PT0gMSxcbiAgICAgICAgZWlnaHRfaW5jb21lOiBpbmNvbWUsXG4gICAgICAgIGVpZ2h0X3RyYXZlbDogdHJhdmVsLFxuICAgICAgICBlaWdodF9zcXVhcmVPZkluY29tZTogMCxcbiAgICB9O1xuICAgIHBlcnNvbi5zcXVhcmVPZkluY29tZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHBlcnNvbi5pbmNvbWUpO1xuICAgIH1cbiAgICByZXR1cm4gcGVyc29uO1xufTtcblxudmFyIGRhdGEgPSBleHBvcnRzLnBlb3BsZTIgPSBbXTtcbmZvciAodmFyIGkgPSAwOyBpIDwgbnVtUm93czsgaSsrKSB7XG4gICAgZGF0YS5wdXNoKHJhbmRvbVBlcnNvbigpKTtcbn1cblxuZGF0YSA9IGV4cG9ydHMucGVvcGxlMSA9IFtdO1xuZm9yICh2YXIgaSA9IDA7IGkgPCBudW1Sb3dzLzI7IGkrKykge1xuICAgIGRhdGEucHVzaChyYW5kb21QZXJzb24oKSk7XG59XG5cbmV4cG9ydHMuc3RhdGVzID0gc3RhdGVzO1xuZXhwb3J0cy5maXJzdE5hbWVzID0gZmlyc3ROYW1lcztcbmV4cG9ydHMubGFzdE5hbWVzID0gbGFzdE5hbWVzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2F0YWxvZyA9IHJlcXVpcmUoJ29iamVjdC1jYXRhbG9nJyk7XG52YXIgZmluZCA9IHJlcXVpcmUoJ21hdGNoLXBvaW50Jyk7XG52YXIgR3JleWxpc3QgPSByZXF1aXJlKCdncmV5bGlzdCcpO1xuXG5cbnZhciBpc0RPTSA9IChcbiAgICB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyAmJlxuICAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh3aW5kb3cpID09PSAnW29iamVjdCBXaW5kb3ddJyAmJlxuICAgIHR5cGVvZiB3aW5kb3cuTm9kZSA9PT0gJ2Z1bmN0aW9uJ1xuKTtcblxudmFyIGlzRG9tTm9kZSA9IGlzRE9NID8gZnVuY3Rpb24ob2JqKSB7IHJldHVybiBvYmogaW5zdGFuY2VvZiB3aW5kb3cuTm9kZSB9IDogZnVuY3Rpb24oKSB7fTtcblxuXG4vKipcbiAqIEBzdW1tYXJ5IFNlYXJjaCBhbiBvYmplY3QncyBjb2RlIGZvciBwYXR0ZXJuIG1hdGNoZXMuXG4gKiBAZGVzYyBTZWFyY2hlcyBhbGwgY29kZSBpbiB0aGUgdmlzaWJsZSBleGVjdXRpb24gY29udGV4dCB1c2luZyB0aGUgcHJvdmlkZWQgcmVnZXggcGF0dGVybiwgcmV0dXJuaW5nIHRoZSBlbnRpcmUgcGF0dGVybiBtYXRjaC5cbiAqXG4gKiBJZiBjYXB0dXJlIGdyb3VwcyBhcmUgc3BlY2lmaWVkIGluIHRoZSBwYXR0ZXJuLCByZXR1cm5zIHRoZSBsYXN0IGNhcHR1cmUgZ3JvdXAgbWF0Y2gsIHVubGVzcyBgb3B0aW9ucy5jYXB0dXJlR3JvdXBgIGlzIGRlZmluZWQsIGluIHdoaWNoIGNhc2UgcmV0dXJucyB0aGUgZ3JvdXAgd2l0aCB0aGF0IGluZGV4IHdoZXJlIGAwYCBtZWFucyB0aGUgZW50aXJlIHBhdHRlcm4sIF9ldGMuXyAocGVyIGBTdHJpbmcucHJvdG90eXBlLm1hdGNoYCkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfSBwYXR0ZXJuIC0gU2VhcmNoIGFyZ3VtZW50LlxuICogRG9uJ3QgdXNlIGdsb2JhbCBmbGFnIG9uIFJlZ0V4cDsgaXQncyB1bm5lY2Vzc2FyeSBhbmQgc3VwcHJlc3NlcyBzdWJtYXRjaGVzIG9mIGNhcHR1cmUgZ3JvdXBzLlxuICpcbiAqIEBwYXJhbSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5jYXB0dXJlR3JvdXBdIC0gSWZmIGRlZmluZWQsIGluZGV4IG9mIGEgc3BlY2lmaWMgY2FwdHVyZSBncm91cCB0byByZXR1cm4gZm9yIGVhY2ggbWF0Y2guXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJlY3Vyc2VdIC0gRXF1aXZhbGVudCB0byBzZXR0aW5nIGJvdGggYHJlY3Vyc2VPd25gIGFuZCBgcmVjdXJzZUFuY2VzdG9yc2AuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJlY3Vyc2VPd25dIC0gUmVjdXJzZSBvd24gc3Vib2JqZWN0cy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmVjdXJzZUFuY2VzdG9yc10gLSBSZWN1cnNlIHN1Ym9iamVjdHMgb2Ygb2JqZWN0cyBvZiB0aGUgZW50aXJlIHByb3RvdHlwZSBjaGFpbi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5ncmV5bGlzdF0gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L2dyZXlsaXN0XG4gKiBAcGFyYW0gW29wdGlvbnMuZ3JleWxpc3Qud2hpdGVdIC0gSWYgZ2l2ZW4sIG9ubHkgbGlzdGVkIG1hdGNoZXMgYXJlIGluY2x1ZGVkIGluIHRoZSByZXN1bHRzLlxuICogQHBhcmFtIFtvcHRpb25zLmdyZXlsaXN0LmJsYWNrXSAtIElmIGdpdmVuLCBsaXN0ZWQgbWF0Y2hlcyBhcmUgZXhjbHVkZWQgZnJvbSB0aGUgcmVzdWx0cy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuY2F0YWxvZ10gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L29iamVjdC1jYXRhbG9nXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNhdGFsb2cub3duXSAtIE9ubHkgc2VhcmNoIG93biBvYmplY3Q7IG90aGVyd2lzZSBzZWFyY2ggb3duICsgZW50aXJlIHByb3RvdHlwZSBjaGFpbi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5jYXRhbG9nLmdyZXlsaXN0XSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvZ3JleWxpc3RcbiAqIEBwYXJhbSBbb3B0aW9ucy5jYXRhbG9nLmdyZXlsaXN0LndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBtZW1iZXJzIGFyZSBjYXRhbG9nZWQuXG4gKiBAcGFyYW0gW29wdGlvbnMuY2F0YWxvZy5ncmV5bGlzdC5ibGFja10gLSBJZiBnaXZlbiwgbGlzdGVkIG1lbWJlcnMgYXJlICpub3QqIGNhdGFsb2dlZC5cbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nW119IFBhdHRlcm4gbWF0Y2hlcy5cbiAqL1xuZnVuY3Rpb24gbWF0Y2gocGF0dGVybiwgb3B0aW9ucywgYnlHcmV5bGlzdCwgbWF0Y2hlcywgc2Nhbm5lZCkge1xuICAgIHZhciB0b3BMZXZlbENhbGwgPSAhbWF0Y2hlcztcblxuICAgIGlmICh0b3BMZXZlbENhbGwpIHtcbiAgICAgICAgLy8gdGhpcyBpcyB0aGUgdG9wLWxldmVsIChub24tcmVjdXJzZWQpIGNhbGwgc28gaW50aWFsaXplOlxuICAgICAgICB2YXIgZ3JleWxpc3QgPSBuZXcgR3JleWxpc3Qob3B0aW9ucyAmJiBvcHRpb25zLmdyZXlsaXN0KTtcbiAgICAgICAgYnlHcmV5bGlzdCA9IGdyZXlsaXN0LnRlc3QuYmluZChncmV5bGlzdCk7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBtYXRjaGVzID0gW107XG4gICAgICAgIHNjYW5uZWQgPSBbXTtcbiAgICB9XG5cbiAgICB2YXIgcm9vdCA9IHRoaXM7XG4gICAgdmFyIG1lbWJlcnMgPSBjYXRhbG9nLmNhbGwocm9vdCwgb3B0aW9ucy5jYXRhbG9nKTtcblxuICAgIHNjYW5uZWQucHVzaChyb290KTtcblxuICAgIE9iamVjdC5rZXlzKG1lbWJlcnMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB2YXIgb2JqID0gbWVtYmVyc1trZXldO1xuICAgICAgICB2YXIgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpO1xuXG4gICAgICAgIGlmIChkZXNjcmlwdG9yLnZhbHVlID09PSBtYXRjaCkge1xuICAgICAgICAgICAgcmV0dXJuOyAvLyBkb24ndCBjYXRhbG9nIHNlbGYgd2hlbiBmb3VuZCB0byBoYXZlIGJlZW4gbWl4ZWQgaW5cbiAgICAgICAgfVxuXG4gICAgICAgIE9iamVjdC5rZXlzKGRlc2NyaXB0b3IpLmZvckVhY2goZnVuY3Rpb24gKHByb3BOYW1lKSB7XG4gICAgICAgICAgICB2YXIgaGl0cywgcHJvcCA9IGRlc2NyaXB0b3JbcHJvcE5hbWVdO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHByb3AgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9wTmFtZSBtdXN0IGJlIGBnZXRgIG9yIGBzZXRgIG9yIGB2YWx1ZWBcbiAgICAgICAgICAgICAgICBoaXRzID0gZmluZChwcm9wLnRvU3RyaW5nKCksIHBhdHRlcm4sIG9wdGlvbnMuY2FwdHVyZUdyb3VwKS5maWx0ZXIoYnlHcmV5bGlzdCk7XG4gICAgICAgICAgICAgICAgaGl0cy5mb3JFYWNoKGZ1bmN0aW9uKGhpdCkgeyBtYXRjaGVzLnB1c2goaGl0KTsgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgIChvcHRpb25zLnJlY3Vyc2UgfHwgb3B0aW9ucy5yZWN1cnNlT3duICYmIG9iaiA9PT0gcm9vdCB8fCBvcHRpb25zLnJlY3Vyc2VDaGFpbiAmJiBvYmogIT09IHJvb3QpICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIHByb3AgPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICAgICAgIWlzRG9tTm9kZShwcm9wKSAmJiAvLyBkb24ndCBzZWFyY2ggRE9NIG9iamVjdHNcbiAgICAgICAgICAgICAgICBzY2FubmVkLmluZGV4T2YocHJvcCkgPCAwIC8vIGRvbid0IHJlY3Vyc2Ugb24gb2JqZWN0cyBhbHJlYWR5IHNjYW5uZWRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIC8vIHByb3BOYW1lIG11c3QgYmUgYHZhbHVlYFxuICAgICAgICAgICAgICAgIG1hdGNoLmNhbGwocHJvcCwgcGF0dGVybiwgb3B0aW9ucywgYnlHcmV5bGlzdCwgbWF0Y2hlcywgc2Nhbm5lZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaWYgKHRvcExldmVsQ2FsbCkge1xuICAgICAgICBtYXRjaGVzLnNvcnQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hlcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtYXRjaDsiLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGxvZ0V2ZW50T2JqZWN0KGUpIHtcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsIGUpO1xufVxuXG5mdW5jdGlvbiBsb2dEZXRhaWwoZSkge1xuICAgIHRoaXMubG9nKGUudHlwZSwgJzo6JywgZS5kZXRhaWwpO1xufVxuXG5mdW5jdGlvbiBsb2dTY3JvbGwoZSkge1xuICAgIHRoaXMubG9nKGUudHlwZSwgJzo6JywgZS5kZXRhaWwudmFsdWUpO1xufVxuXG5mdW5jdGlvbiBsb2dDZWxsKGUpIHtcbiAgICB2YXIgZ0NlbGwgPSBlLmRldGFpbC5ncmlkQ2VsbDtcbiAgICB2YXIgZENlbGwgPSBlLmRldGFpbC5kYXRhQ2VsbDtcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsXG4gICAgICAgICdncmlkLWNlbGw6JywgeyB4OiBnQ2VsbC54LCB5OiBnQ2VsbC55IH0sXG4gICAgICAgICdkYXRhLWNlbGw6JywgeyB4OiBkQ2VsbC54LCB5OiBkQ2VsbC55IH0pO1xufVxuXG5mdW5jdGlvbiBsb2dTZWxlY3Rpb24oZSkge1xuICAgIHRoaXMubG9nKGUudHlwZSwgJzo6JywgZS5kZXRhaWwucm93cywgZS5kZXRhaWwuY29sdW1ucywgZS5kZXRhaWwuc2VsZWN0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIGxvZ1JvdyhlKSB7XG4gICAgdmFyIHJvd0NvbnRleHQgPSBlLmRldGFpbC5wcmltaXRpdmVFdmVudC5kYXRhUm93O1xuICAgIHRoaXMubG9nKGUudHlwZSwgJzo6JywgJ3Jvdy1jb250ZXh0OicsIHJvd0NvbnRleHQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnZmluLWNlbGwtZW50ZXInOiBsb2dDZWxsLFxuICAgICdmaW4tY2xpY2snOiBsb2dDZWxsLFxuICAgICdmaW4tZG91YmxlLWNsaWNrJzogbG9nUm93LFxuICAgICdmaW4tc2VsZWN0aW9uLWNoYW5nZWQnOiBsb2dTZWxlY3Rpb24sXG4gICAgJ2Zpbi1jb250ZXh0LW1lbnUnOiBsb2dDZWxsLFxuXG4gICAgJ2Zpbi1zY3JvbGwteCc6IGxvZ1Njcm9sbCxcbiAgICAnZmluLXNjcm9sbC15JzogbG9nU2Nyb2xsLFxuXG4gICAgJ2Zpbi1yb3ctc2VsZWN0aW9uLWNoYW5nZWQnOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1jb2x1bW4tc2VsZWN0aW9uLWNoYW5nZWQnOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1lZGl0b3ItZGF0YS1jaGFuZ2UnOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1lZGl0b3Ita2V5dXAnOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1lZGl0b3Ita2V5cHJlc3MnOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1lZGl0b3Ita2V5ZG93bic6IGxvZ0RldGFpbCxcbiAgICAnZmluLWdyb3Vwcy1jaGFuZ2VkJzogbG9nRGV0YWlsLFxuXG4gICAgJ2Zpbi1maWx0ZXItYXBwbGllZCc6IGxvZ0V2ZW50T2JqZWN0LFxuICAgICdmaW4tcmVxdWVzdC1jZWxsLWVkaXQnOiBsb2dFdmVudE9iamVjdCxcbiAgICAnZmluLWJlZm9yZS1jZWxsLWVkaXQnOiBsb2dFdmVudE9iamVjdCxcbiAgICAnZmluLWFmdGVyLWNlbGwtZWRpdCc6IGxvZ0V2ZW50T2JqZWN0XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgU3RhckxvZyA9IHJlcXVpcmUoJ3N0YXJsb2cnKTtcblxudmFyIGV2ZW50TG9nZ2VyUGx1Z2luID0ge1xuXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKG9wdGlvbnMpXG4gICAge1xuICAgICAgICBpZiAob3B0aW9ucyAmJiB0aGlzLnN0YXJsb2cpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcmxvZy5zdG9wKCk7IC8vIHN0b3AgdGhlIG9sZCBvbmUgYmVmb3JlIHJlZGVmaW5pbmcgaXQgd2l0aCBuZXcgb3B0aW9ucyBvYmplY3RcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5zdGFybG9nIHx8IG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKTtcblxuICAgICAgICAgICAgLy8gc2VhcmNoIGdyaWQgb2JqZWN0IGZvciBcIkV2ZW50KCd5YWRhLXlhZGEnXCIgb3IgXCJFdmVudC5jYWxsKHRoaXMsICd5YWRhLXlhZGEnXCJcbiAgICAgICAgICAgIG9wdGlvbnMuc2VsZWN0ID0gb3B0aW9ucy5zZWxlY3QgfHwgdGhpcztcbiAgICAgICAgICAgIG9wdGlvbnMucGF0dGVybiA9IG9wdGlvbnMucGF0dGVybiB8fCAvRXZlbnQoXFwuY2FsbFxcKHRoaXMsIHxcXCgpJyhmaW4tW2Etei1dKyknLztcbiAgICAgICAgICAgIG9wdGlvbnMudGFyZ2V0cyA9IG9wdGlvbnMudGFyZ2V0cyB8fCB0aGlzLmNhbnZhcy5jYW52YXM7XG5cbiAgICAgICAgICAgIC8vIG1peCBvcHRpb25zLmxpc3RlbmVyRGljdGlvbmFyeSBvbiB0b3Agb2Ygc29tZSBjdXN0b20gbGlzdGVuZXJzXG4gICAgICAgICAgICBvcHRpb25zLmxpc3RlbmVyRGljdGlvbmFyeSA9IE9iamVjdC5hc3NpZ24oe30sIHJlcXVpcmUoJy4vY3VzdG9tLWxpc3RlbmVycycpLCBvcHRpb25zLmxpc3RlbmVyRGljdGlvbmFyeSk7XG5cbiAgICAgICAgICAgIC8vIG1peCBmaW4tdGljayBvbiB0b3Agb2Ygb3B0aW9ucy5tYXRjaC5ncmV5bGlzdC5ibGFja1xuICAgICAgICAgICAgdmFyIGJsYWNrID0gWydmaW4tdGljayddO1xuICAgICAgICAgICAgb3B0aW9ucy5tYXRjaCA9IG9wdGlvbnMubWF0Y2ggfHwge307XG4gICAgICAgICAgICBvcHRpb25zLm1hdGNoLmdyZXlsaXN0ID0gb3B0aW9ucy5tYXRjaC5ncmV5bGlzdCB8fCB7fTtcbiAgICAgICAgICAgIG9wdGlvbnMubWF0Y2guZ3JleWxpc3QuYmxhY2sgPSBvcHRpb25zLm1hdGNoLmdyZXlsaXN0LmJsYWNrID8gYmxhY2suY29uY2F0KG9wdGlvbnMubWF0Y2guZ3JleWxpc3QuYmxhY2spIDogYmxhY2s7XG5cbiAgICAgICAgICAgIHRoaXMuc3RhcmxvZyA9IG5ldyBTdGFyTG9nKG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGFybG9nLnN0YXJ0KCk7XG4gICAgfSxcblxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnN0YXJsb2cuc3RvcCgpO1xuICAgIH1cblxufTtcblxuLy8gTm9uLWVudW1lcmFibGUgbWV0aG9kcyBhcmUgbm90IHRoZW1zZWx2ZXMgaW5zdGFsbGVkOlxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZXZlbnRMb2dnZXJQbHVnaW4sIHtcbiAgICBwcmVpbnN0YWxsOiB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbihIeXBlcmdyaWRQcm90b3R5cGUsIEJlaGF2aW9yUHJvdG90eXBlLCBtZXRob2RQcmVmaXgpIHtcbiAgICAgICAgICAgIGluc3RhbGwuY2FsbCh0aGlzLCBIeXBlcmdyaWRQcm90b3R5cGUsIG1ldGhvZFByZWZpeCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5zdGFsbDoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24oZ3JpZCwgbWV0aG9kUHJlZml4KSB7XG4gICAgICAgICAgICBpbnN0YWxsLmNhbGwodGhpcywgZ3JpZCwgbWV0aG9kUHJlZml4KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiBpbnN0YWxsKHRhcmdldCwgbWV0aG9kUHJlZml4KSB7XG4gICAgaWYgKG1ldGhvZFByZWZpeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG1ldGhvZFByZWZpeCA9ICdsb2cnO1xuICAgIH1cbiAgICBPYmplY3Qua2V5cyh0aGlzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdGFyZ2V0W3ByZWZpeChtZXRob2RQcmVmaXgsIGtleSldID0gdGhpc1trZXldO1xuICAgIH0sIHRoaXMpO1xufVxuXG5mdW5jdGlvbiBwcmVmaXgocHJlZml4LCBuYW1lKSB7XG4gICAgdmFyIGNhcGl0YWxpemUgPSBwcmVmaXgubGVuZ3RoICYmIHByZWZpeFtwcmVmaXgubGVuZ3RoIC0gMV0gIT09ICdfJztcbiAgICBpZiAoY2FwaXRhbGl6ZSkge1xuICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMCwgMSkudG9VcHBlckNhc2UoKSArIG5hbWUuc3Vic3RyKDEpO1xuICAgIH1cbiAgICByZXR1cm4gcHJlZml4ICsgbmFtZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBldmVudExvZ2dlclBsdWdpbjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqIENyZWF0ZXMgYW4gb2JqZWN0IHdpdGggYSBgdGVzdGAgbWV0aG9kIGZyb20gb3B0aW9uYWwgd2hpdGVsaXN0IGFuZC9vciBibGFja2xpc3RcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIElmIG5laXRoZXIgYHdoaXRlYCBub3IgYGJsYWNrYCBhcmUgZ2l2ZW4sIGFsbCBzdHJpbmdzIHBhc3MgYHRlc3RgLlxuICogQHBhcmFtIFtvcHRpb25zLndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBzdHJpbmdzIHBhc3MgYHRlc3RgLlxuICogQHBhcmFtIFtvcHRpb25zLmJsYWNrXSAtIElmIGdpdmVuLCBsaXN0ZWQgc3RyaW5ncyBmYWlsIGB0ZXN0YC5cbiAqL1xuZnVuY3Rpb24gR3JleUxpc3Qob3B0aW9ucykge1xuICAgIHRoaXMud2hpdGUgPSBnZXRGbGF0QXJyYXlPZlJlZ2V4QW5kT3JTdHJpbmcob3B0aW9ucyAmJiBvcHRpb25zLndoaXRlKTtcbiAgICB0aGlzLmJsYWNrID0gZ2V0RmxhdEFycmF5T2ZSZWdleEFuZE9yU3RyaW5nKG9wdGlvbnMgJiYgb3B0aW9ucy5ibGFjayk7XG59XG5cbkdyZXlMaXN0LnByb3RvdHlwZS50ZXN0ID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7IC8vIGZvciBtYXRjaCgpIHVzZVxuICAgIHJldHVybiAoXG4gICAgICAgICEodGhpcy53aGl0ZSAmJiAhdGhpcy53aGl0ZS5zb21lKG1hdGNoLCB0aGlzKSkgJiZcbiAgICAgICAgISh0aGlzLmJsYWNrICYmIHRoaXMuYmxhY2suc29tZShtYXRjaCwgdGhpcykpXG4gICAgKTtcbn07XG5cbmZ1bmN0aW9uIG1hdGNoKHBhdHRlcm4pIHtcbiAgICByZXR1cm4gdHlwZW9mIHBhdHRlcm4udGVzdCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICA/IHBhdHRlcm4udGVzdCh0aGlzLnN0cmluZykgLy8gdHlwaWNhbGx5IGEgcmVnZXggYnV0IGNvdWxkIGJlIGFueXRoaW5nIHRoYXQgaW1wbGVtZW50cyBgdGVzdGBcbiAgICAgICAgOiB0aGlzLnN0cmluZyA9PT0gcGF0dGVybiArICcnOyAvLyBjb252ZXJ0IHBhdHRlcm4gdG8gc3RyaW5nIGV2ZW4gZm9yIGVkZ2UgY2FzZXNcbn1cblxuZnVuY3Rpb24gZ2V0RmxhdEFycmF5T2ZSZWdleEFuZE9yU3RyaW5nKGFycmF5LCBmbGF0KSB7XG4gICAgaWYgKCFmbGF0KSB7XG4gICAgICAgIC8vIHRoaXMgaXMgdGhlIHRvcC1sZXZlbCAobm9uLXJlY3Vyc2VkKSBjYWxsIHNvIGludGlhbGl6ZTpcblxuICAgICAgICAvLyBgdW5kZWZpbmVkYCBwYXNzZXMgdGhyb3VnaCB3aXRob3V0IGJlaW5nIGNvbnZlcnRlZCB0byBhbiBhcnJheVxuICAgICAgICBpZiAoYXJyYXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYXJyYXlpZnkgZ2l2ZW4gc2NhbGFyIHN0cmluZywgcmVnZXgsIG9yIG9iamVjdFxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XG4gICAgICAgICAgICBhcnJheSA9IFthcnJheV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbml0aWFsaXplIGZsYXRcbiAgICAgICAgZmxhdCA9IFtdO1xuICAgIH1cblxuICAgIGFycmF5LmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgLy8gbWFrZSBzdXJlIGFsbCBlbGVtZW50cyBhcmUgZWl0aGVyIHN0cmluZyBvciBSZWdFeHBcbiAgICAgICAgc3dpdGNoIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaXRlbSkpIHtcbiAgICAgICAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgICAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOlxuICAgICAgICAgICAgICAgIGZsYXQucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ1tvYmplY3QgT2JqZWN0XSc6XG4gICAgICAgICAgICAgICAgLy8gcmVjdXJzZSBvbiBjb21wbGV4IGl0ZW0gKHdoZW4gYW4gb2JqZWN0IG9yIGFycmF5KVxuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb252ZXJ0IG9iamVjdCBpbnRvIGFuIGFycmF5IChvZiBpdCdzIGVudW1lcmFibGUga2V5cywgYnV0IG9ubHkgd2hlbiBub3QgdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgICBpdGVtID0gT2JqZWN0LmtleXMoaXRlbSkuZmlsdGVyKGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuIGl0ZW1ba2V5XSAhPT0gdW5kZWZpbmVkOyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZ2V0RmxhdEFycmF5T2ZSZWdleEFuZE9yU3RyaW5nKGl0ZW0sIGZsYXQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBmbGF0LnB1c2goaXRlbSArICcnKTsgLy8gY29udmVydCB0byBzdHJpbmdcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZsYXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3JleUxpc3Q7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBzdW1tYXJ5IEZpbmQgYWxsIHBhdHRlcm4gbWF0Y2hlcywgcmV0dXJuIHNwZWNpZmllZCBjYXB0dXJlIGdyb3VwIGZvciBlYWNoLlxuICogQHJldHVybnMge3N0cmluZ1tdfSBBbiBhcnJheSBjb250YWluaW5nIGFsbCB0aGUgcGF0dGVybiBtYXRjaGVzIGZvdW5kIGluIGBzdHJpbmdgLlxuICogVGhlIGVudGlyZSBwYXR0ZXJuIG1hdGNoIGlzIHJldHVybmVkIHVubGVzcyB0aGUgcGF0dGVybiBjb250YWlucyBvbmUgb3IgbW9yZSBzdWJncm91cHMgaW4gd2hpY2ggY2FzZSB0aGUgcG9ydGlvbiBvZiB0aGUgcGF0dGVybiBtYXRjaGVkIGJ5IHRoZSBsYXN0IHN1Ymdyb3VwIGlzIHJldHVybmVkIHVubGVzcyBgY2FwdHVyZUdyb3VwYCBpcyBkZWZpbmVkLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZ1xuICogQHBhcmFtIHtSZWdFeHB9IHJlZ2V4IC0gRG9uJ3QgdXNlIGdsb2JhbCBmbGFnOyBpdCdzIHVubmVjZXNzYXJ5IGFuZCBzdXBwcmVzc2VzIHN1Ym1hdGNoZXMgb2YgY2FwdHVyZSBncm91cHMuXG4gKiBAcGFyYW0ge251bWJlcn0gW2NhcHR1cmVHcm91cF0gLSBJZmYgZGVmaW5lZCwgaW5kZXggb2YgYSBzcGVjaWZpYyBjYXB0dXJlIGdyb3VwIHRvIHJldHVybi5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHJpbmcsIHJlZ2V4LCBjYXB0dXJlR3JvdXApIHtcbiAgICB2YXIgbWF0Y2hlcyA9IFtdO1xuXG4gICAgZm9yICh2YXIgbWF0Y2gsIGkgPSAwOyAobWF0Y2ggPSBzdHJpbmcuc3Vic3RyKGkpLm1hdGNoKHJlZ2V4KSk7IGkgKz0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG1hdGNoW2NhcHR1cmVHcm91cCA9PT0gdW5kZWZpbmVkID8gbWF0Y2gubGVuZ3RoIC0gMSA6IGNhcHR1cmVHcm91cF0pO1xuICAgIH1cblxuICAgIHJldHVybiBtYXRjaGVzO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEdyZXlsaXN0ID0gcmVxdWlyZSgnZ3JleWxpc3QnKTtcblxuLyoqIEBzdW1tYXJ5IENhdGFsb2cgdGhlIGV4ZWN1dGlvbiBjb250ZXh0IG9iamVjdC5cbiAqIEByZXR1cm5zIHtvYmplY3R9IEFuIG9iamVjdCBjb250YWluaW5nIGEgbWVtYmVyIGZvciBlYWNoIG1lbWJlciBvZiB0aGUgZXhlY3V0aW9uIGNvbnRleHQgb2JqZWN0XG4gKiB2aXNpYmxlIGluIHRoZSBwcm90b3R5cGUgY2hhaW4gKGJhY2sgdG8gYnV0IG5vdCBpbmNsdWRpbmcgT2JqZWN0KSwgcGVyIHdoaXRlbGlzdCBhbmQgYmxhY2tsaXN0LlxuICogRWFjaCBtZW1iZXIncyB2YWx1ZSBpcyB0aGUgb2JqZWN0IGluIHRoZSBwcm90b3R5cGUgY2hhaW4gd2hlcmUgZm91bmQuXG4gKiBAcGFyYW0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm93bl0gLSBSZXN0cmljdCBzZWFyY2ggZm9yIGV2ZW50IHR5cGUgc3RyaW5ncyB0byBvd24gbWV0aG9kcyByYXRoZXIgdGhhbiBlbnRpcmUgcHJvdG90eXBlIGNoYWluLlxuICogQHBhcmFtIFtvcHRpb25zLmdyZXlsaXN0XVxuICogQHBhcmFtIFtvcHRpb25zLmdyZXlsaXN0LndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBtZW1iZXJzIGFyZSBjYXRhbG9nZWQuXG4gKiBAcGFyYW0gW29wdGlvbnMuZ3JleWxpc3QuYmxhY2tdIC0gSWYgZ2l2ZW4sIGxpc3RlZCBtZW1iZXJzIGFyZSAqbm90KiBjYXRhbG9nZWQuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gb2JqZWN0Q2F0YWxvZyhvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICB2YXIgb2JqLFxuICAgICAgICBjYXRhbG9nID0gT2JqZWN0LmNyZWF0ZShudWxsKSwgLy8gS0lTUyBubyBwcm90b3R5cGUgbmVlZGVkXG4gICAgICAgIHdhbGtQcm90b3R5cGVDaGFpbiA9ICFvcHRpb25zLm93bixcbiAgICAgICAgZ3JleWxpc3QgPSBuZXcgR3JleWxpc3Qob3B0aW9ucy5ncmV5bGlzdCk7XG5cbiAgICBmb3IgKG9iaiA9IHRoaXM7IG9iaiAmJiBvYmogIT09IE9iamVjdC5wcm90b3R5cGU7IG9iaiA9IHdhbGtQcm90b3R5cGVDaGFpbiAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKSkge1xuICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgIShrZXkgaW4gY2F0YWxvZykgJiYgLy8gbm90IHNoYWRvd2VkIGJ5IGEgbWVtYmVyIG9mIGEgZGVzY2VuZGFudCBvYmplY3RcbiAgICAgICAgICAgICAgICBncmV5bGlzdC50ZXN0KGtleSkgJiZcbiAgICAgICAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwga2V5KS52YWx1ZSAhPT0gb2JqZWN0Q2F0YWxvZ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgY2F0YWxvZ1trZXldID0gb2JqO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2F0YWxvZztcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbWF0Y2ggPSByZXF1aXJlKCdjb2RlLW1hdGNoJyk7XG5cbi8qKiBAdHlwZWRlZiB7b2JqZWN0fSBzdGFybG9nZ2VyXG4gKiBAZGVzYyBBbiBldmVudCBsaXN0ZW5lciBmb3IgbG9nZ2luZyBwdXJwb3NlcywgcGFpcmVkIHdpdGggdGhlIHRhcmdldChzKSB0byBsaXN0ZW4gdG8uXG4gKiBFYWNoIG1lbWJlciBvZiBhIGxvZ2dlciBvYmplY3QgaGFzIHRoZSBldmVudCBzdHJpbmcgYXMgaXRzIGtleSBhbmQgYW4gb2JqZWN0IGFzIGl0cyB2YWx1ZS5cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IGxpc3RlbmVyIC0gQSBoYW5kbGVyIHRoYXQgbG9ncyB0aGUgZXZlbnQuXG4gKiBAcHJvcGVydHkge29iamVjdHxvYmplY3RbXX0gdGFyZ2V0cyAtIEEgdGFyZ2V0IG9yIGxpc3Qgb2YgdGFyZ2V0cyB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuICovXG5cbi8qKiBAdHlwZWRlZiB7b2JqZWN0fG9iamVjdFtdfSBldmVudFRhcmdldHNcbiAqIEV2ZW50IHRhcmdldCBvYmplY3QocykgdGhhdCBpbXBsZW1lbnQgYGFkZEV2ZW50TGlzdGVuZXJgIGFuZCBgcmVtb3ZlRXZlbnRMaXN0ZW5lcmAsXG4gKiB0eXBpY2FsbHkgYSBET00gbm9kZSwgYnV0IGJ5IG5vIG1lYW5zIGxpbWl0ZWQgdG8gc3VjaC5cbiAqL1xuXG4vKiogQHR5cGVkZWYge3N0cmluZ30gZXZlbnRUeXBlICovXG5cbi8qKiBAdHlwZWRlZiB7b2JqZWN0fSBzdGFybG9nT3B0aW9uc1xuICpcbiAqIEBkZXNjIE11c3QgZGVmaW5lIGBsb2dnZXJzYCwgYGV2ZW50c2AsIG9yIGBwYXR0ZXJuYCBhbmQgYHNlbGVjdGA7IGVsc2UgZXJyb3IgaXMgdGhyb3duLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0LjxldmVudFR5cGUsIHN0YXJsb2dnZXI+fSBbbG9nZ2Vyc10gLSBMb2dnZXIgZGljdGlvbmFyeS5cbiAqIEBwYXJhbSB7c3RyaW5nW119IFtldmVudHNdIC0gTGlzdCBvZiBldmVudCBzdHJpbmdzIGZyb20gd2hpY2ggdG8gYnVpbGQgYSBsb2dnZXIgZGljdGlvbmFyeS5cbiAqIEBwYXJhbSB7b2JqZWN0fG9iamVjdFtdfSBbc2VsZWN0XSAtIE9iamVjdCBvciBsaXN0IG9mIG9iamVjdHMgaW4gd2hpY2ggdG8gc2VhcmNoIHdpdGggYHBhdHRlcm5gLlxuICogQHBhcmFtIHtSZWdFeHB9IFtwYXR0ZXJuXSAtIEV2ZW50IHN0cmluZyBwYXR0ZXJuIHRvIHNlYXJjaCBmb3IgaW4gYWxsIHZpc2libGUgZ2V0dGVycywgc2V0dGVycywgYW5kIG1ldGhvZHMuXG4gKiBUaGUgcmVzdWx0cyBvZiB0aGUgc2VhcmNoIGFyZSB1c2VkIHRvIGJ1aWxkIGEgbG9nZ2VyIGRpY3Rpb25hcnkuXG4gKiBFeGFtcGxlOiBgLycoZmluLVthLXotXSspJy9gIG1lYW5zIGZpbmQgYWxsIHN0cmluZ3MgbGlrZSBgJ2Zpbi0qJ2AsIHJldHVybmluZyBvbmx5IHRoZSBwYXJ0IGluc2lkZSB0aGUgcXVvdGVzLlxuICogU2VlIHRoZSBSRUFETUUgZm9yIGFkZGl0aW9uYWwgZXhhbXBsZXMuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2xvZ10gLSBPdmVycmlkZSB7QGxpbmsgU3RhcmxvZyNsb2d9LlxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2xpc3RlbmVyXSAtIE92ZXJyaWRlIHtAbGluayBTdGFybG9nI2xpc3RlbmVyfS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbdGFyZ2V0c10gLSBPdmVycmlkZSB7QGxpbmsgU3RhcmxvZyN0YXJnZXRzfS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdC48ZXZlbnRUeXBlLCBmdW5jdGlvbj59IFtsaXN0ZW5lckRpY3Rpb25hcnk9e31dIC0gQ3VzdG9tIGxpc3RlbmVycyB0byBvdmVycmlkZSBkZWZhdWx0IGxpc3RlbmVyLlxuICogQHBhcmFtIHtPYmplY3QuPGV2ZW50VHlwZSwgZXZlbnRUYXJnZXRzPn0gW3RhcmdldHNEaWN0aW9uYXJ5PXt9XSAtIEN1c3RvbSBldmVudCB0YXJnZXQgb2JqZWN0KHMpIHRvIG92ZXJyaWRlIGRlZmF1bHQgdGFyZ2V0cy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gW21hdGNoXSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvY29kZS1tYXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IFttYXRjaC5jYXB0dXJlR3JvdXBdIC0gSWZmIGRlZmluZWQsIGluZGV4IG9mIGEgc3BlY2lmaWMgY2FwdHVyZSBncm91cCB0byByZXR1cm4gZm9yIGVhY2ggbWF0Y2guXG4gKiBAcGFyYW0ge29iamVjdH0gW21hdGNoLmdyZXlsaXN0XSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvZ3JleWxpc3RcbiAqIEBwYXJhbSBbbWF0Y2guZ3JleWxpc3Qud2hpdGVdIC0gSWYgZ2l2ZW4sIG9ubHkgbGlzdGVkIG1hdGNoZXMgYXJlIGluY2x1ZGVkIGluIHRoZSByZXN1bHRzLlxuICogQHBhcmFtIFttYXRjaC5ncmV5bGlzdC5ibGFja10gLSBJZiBnaXZlbiwgbGlzdGVkIG1hdGNoZXMgYXJlIGV4Y2x1ZGVkIGZyb20gdGhlIHJlc3VsdHMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IFttYXRjaC5jYXRhbG9nXSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvb2JqZWN0LWNhdGFsb2dcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW21hdGNoLmNhdGFsb2cub3duXSAtIE9ubHkgc2VhcmNoIG93biBtZXRob2RzIGZvciBldmVudCBzdHJpbmdzOyBvdGhlcndpc2UgZW50aXJlIHByb3RvdHlwZSBjaGFpbi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbbWF0Y2guY2F0YWxvZy5ncmV5bGlzdF0gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L2dyZXlsaXN0XG4gKiBAcGFyYW0gW21hdGNoLmNhdGFsb2cuZ3JleWxpc3Qud2hpdGVdIC0gSWYgZ2l2ZW4sIG9ubHkgbGlzdGVkIG1lbWJlcnMgYXJlIGNhdGFsb2dlZC5cbiAqIEBwYXJhbSBbbWF0Y2guY2F0YWxvZy5ncmV5bGlzdC5ibGFja10gLSBJZiBnaXZlbiwgbGlzdGVkIG1lbWJlcnMgYXJlICpub3QqIGNhdGFsb2dlZC5cbiAqL1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQHN1bW1hcnkgSW5zdGFuY2UgYSBsb2dnZXIuXG4gKiBAZGVzYyBDb25zdW1lcyBgb3B0aW9uc2AsIGNyZWF0aW5nIGEgZGljdGlvbmFyeSBvZiBldmVudCBzdHJpbmdzIGluIGB0aGlzLmV2ZW50c2AuXG4gKlxuICogU291cmNlcyBmb3IgbG9nZ2VyczpcbiAqICogSWYgYG9wdGlvbnMubG9nZ2Vyc2AgZGljdGlvbmFyeSBvYmplY3QgaXMgZGVmaW5lZCwgZGVlcCBjbG9uZSBpdCBhbmQgbWFrZSBzdXJlIGFsbCBtZW1iZXJzIGFyZSBsb2dnZXIgb2JqZWN0cywgZGVmYXVsdGluZyBhbnkgbWlzc2luZyBtZW1iZXJzLlxuICogKiBFbHNlIGlmIGBvcHRpb25zLmV2ZW50c2AgKGxpc3Qgb2YgZXZlbnQgc3RyaW5ncykgaXMgZGVmaW5lZCwgY3JlYXRlIGFuIG9iamVjdCB3aXRoIHRob3NlIGtleXMsIGxpc3RlbmVycywgYW5kIHRhcmdldHMuXG4gKiAqIEVsc2UgaWYgYG9wdGlvbnMucGF0dGVybmAgaXMgZGVmaW5lZCwgY29kZSBmb3VuZCBpbiB0aGUgZXhlY3V0aW9uIGNvbnRleHQgb2JqZWN0IGlzIHNlYXJjaGVkIGZvciBldmVudCBzdHJpbmdzIHRoYXQgbWF0Y2ggaXQgKHBlciBgb3B0aW9ucy5tYXRjaGApLlxuICpcbiAqIEV2ZW50cyBzcGVjaWZpZWQgd2l0aCBgb3B0aW9ucy5ldmVudHNgIGFuZCBgb3B0aW9ucy5wYXR0ZXJuYCBsb2cgdXNpbmcgdGhlIGRlZmF1bHQgbGlzdGVuZXIgYW5kIGV2ZW50IHRhcmdldHM6XG4gKiAqIGBTdGFyTG9nLnByb3RvdHlwZS5saXN0ZW5lcmAsIHVubGVzcyBvdmVycmlkZGVuLCBqdXN0IGNhbGxzIGB0aGlzLmxvZygpYCB3aXRoIHRoZSBldmVudCBzdHJpbmcsIHdoaWNoIGlzIHN1ZmZpY2llbnQgZm9yIGNhc3VhbCB1c2FnZS5cbiAqIE92ZXJyaWRlIGl0IGJ5IGRlZmluaW5nIGBvcHRpb25zLmxpc3RlbmVyYCBvciBkaXJlY3RseSBieSByZWFzc2lnbmluZyB0byBgU3RhckxvZy5wcm90b3R5cGUubGlzdGVuZXJgIGJlZm9yZSBpbnN0YW50aWF0aW9uLlxuICogKiBgU3RhckxvZy5wcm90b3R5cGUudGFyZ2V0c2AsIHVubGVzcyBvdmVycmlkZGVuLCBpcyBgd2luZG93LmRvY3VtZW50YCAod2hlbiBhdmFpbGFibGUpLFxuICogd2hpY2ggaXMgb25seSByZWFsbHkgdXNlZnVsIGlmIHRoZSBldmVudCBpcyBkaXNwYXRjaGVkIGRpcmVjdGx5IHRvIChvciBpcyBhbGxvd2VkIHRvIGJ1YmJsZSB1cCB0bykgYGRvY3VtZW50YC5cbiAqIE92ZXJyaWRlIGl0IGJ5IGRlZmluaW5nIGBvcHRpb25zLnRhcmdldHNgIG9yIGRpcmVjdGx5IGJ5IHJlYXNzaWduaW5nIHRvIGBTdGFyTG9nLnByb3RvdHlwZS50YXJnZXRzYCBiZWZvcmUgaW5zdGFudGlhdGlvbi5cbiAqXG4gKiBFdmVudHMgc3BlY2lmaWVkIHdpdGggYG9wdGlvbnMubG9nZ2Vyc2AgY2FuIGVhY2ggc3BlY2lmeSB0aGVpciBvd24gbGlzdGVuZXIgYW5kL29yIHRhcmdldHMsIGJ1dCBpZiBub3Qgc3BlY2lmaWVkLCB0aGV5IHRvbyB3aWxsIGFsc28gdXNlIHRoZSBhYm92ZSBkZWZhdWx0cy5cbiAqXG4gKiBAcGFyYW0ge3N0YXJsb2dPcHRpb25zfSBbb3B0aW9uc11cbiAqL1xuZnVuY3Rpb24gU3RhckxvZyhvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBPdmVycmlkZSBwcm90b3R5cGUgZGVmaW5pdGlvbnMgaWYgYW5kIG9ubHkgaWYgc3VwcGxpZWQgaW4gb3B0aW9uc1xuICAgIFsnbG9nJywgJ3RhcmdldHMnLCAnbGlzdGVuZXInXS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBpZiAob3B0aW9uc1trZXldKSB7IHRoaXNba2V5XSA9IG9wdGlvbnNba2V5XTsgfVxuICAgIH0sIHRoaXMpO1xuXG4gICAgdmFyIGRlZmF1bHRUYXJnZXQgPSBvcHRpb25zLnRhcmdldHMgfHwgdGhpcy50YXJnZXRzLFxuICAgICAgICBkZWZhdWx0TGlzdGVuZXIgPSBvcHRpb25zLmxpc3RlbmVyIHx8IHRoaXMubGlzdGVuZXIsXG4gICAgICAgIGxpc3RlbmVyRGljdGlvbmFyeSA9IG9wdGlvbnMubGlzdGVuZXJEaWN0aW9uYXJ5IHx8IHt9LFxuICAgICAgICB0YXJnZXRzRGljdGlvbmFyeSA9IG9wdGlvbnMudGFyZ2V0c0RpY3Rpb25hcnkgfHwge30sXG4gICAgICAgIGxvZ2dlcnMgPSBvcHRpb25zLmxvZ2dlcnMsXG4gICAgICAgIGV2ZW50U3RyaW5ncztcblxuICAgIGlmIChsb2dnZXJzKSB7XG4gICAgICAgIGV2ZW50U3RyaW5ncyA9IE9iamVjdC5rZXlzKGxvZ2dlcnMpO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5ldmVudHMpIHtcbiAgICAgICAgbG9nZ2VycyA9IHt9O1xuICAgICAgICBldmVudFN0cmluZ3MgPSBvcHRpb25zLmV2ZW50cztcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMucGF0dGVybiAmJiBvcHRpb25zLnNlbGVjdCkge1xuICAgICAgICBsb2dnZXJzID0ge307XG4gICAgICAgIGV2ZW50U3RyaW5ncyA9IGFycmF5aWZ5KG9wdGlvbnMuc2VsZWN0KS5yZWR1Y2UoZnVuY3Rpb24obWF0Y2hlcywgb2JqZWN0KSB7XG4gICAgICAgICAgICBtYXRjaC5jYWxsKG9iamVjdCwgb3B0aW9ucy5wYXR0ZXJuLCBvcHRpb25zLm1hdGNoKS5mb3JFYWNoKGZ1bmN0aW9uIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzLmluZGV4T2YobWF0Y2gpIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzLnB1c2gobWF0Y2gpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXM7XG4gICAgICAgIH0sIFtdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIGBvcHRpb25zLmxvZ2dlcnNgLCBgb3B0aW9ucy5ldmVudHNgLCBvciBgb3B0aW9ucy5wYXR0ZXJuYCBhbmQgYG9wdGlvbnMuc2VsZWN0YCB0byBiZSBkZWZpbmVkLicpO1xuICAgIH1cblxuICAgIHZhciBzdGFybG9nID0gdGhpcztcblxuICAgIC8qKlxuICAgICAqIERpY3Rpb25hcnkgb2YgZXZlbnQgc3RyaW5ncyB3aXRoIGxpc3RlbmVyIGFuZCB0YXJnZXQocykuXG4gICAgICogQHR5cGUge09iamVjdC48ZXZlbnRUeXBlLCBzdGFybG9nZ2VyPn1cbiAgICAgKi9cbiAgICB0aGlzLmV2ZW50cyA9IGV2ZW50U3RyaW5ncy5yZWR1Y2UoZnVuY3Rpb24oY2xvbmUsIGV2ZW50U3RyaW5nKSB7XG4gICAgICAgIHZhciBsb2dnZXIgPSBPYmplY3QuYXNzaWduKHt9LCBsb2dnZXJzW2V2ZW50U3RyaW5nXSk7IC8vIGNsb25lIGVhY2ggbG9nZ2VyXG5cbiAgICAgICAgLy8gYmluZCB0aGUgbGlzdGVuZXIgdG8gc3RhcmxvZyBmb3IgYHRoaXMubG9nYCBhY2Nlc3MgdG8gU3RhcmxvZyNsb2cgZnJvbSB3aXRoaW4gbGlzdGVuZXJcbiAgICAgICAgbG9nZ2VyLmxpc3RlbmVyID0gKGxvZ2dlci5saXN0ZW5lciB8fCBsaXN0ZW5lckRpY3Rpb25hcnlbZXZlbnRTdHJpbmddIHx8IGRlZmF1bHRMaXN0ZW5lcikuYmluZChzdGFybG9nKTtcbiAgICAgICAgbG9nZ2VyLnRhcmdldHMgPSBhcnJheWlmeShsb2dnZXIudGFyZ2V0cyB8fCB0YXJnZXRzRGljdGlvbmFyeVtldmVudFN0cmluZ10gfHwgZGVmYXVsdFRhcmdldCk7XG5cbiAgICAgICAgY2xvbmVbZXZlbnRTdHJpbmddID0gbG9nZ2VyO1xuXG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9LCB7fSk7XG59XG5cblN0YXJMb2cucHJvdG90eXBlID0ge1xuICAgIGNvbnN0cnVjdG9yOiBTdGFyTG9nLnByb3RvdHlwZS5jb25zdHJ1Y3RvcixcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpXG4gICAgICovXG4gICAgbG9nOiBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAqIEBkZWZhdWx0IGZ1bmN0aW9uKGUpIHsgdGhpcy5sb2coZS50eXBlKTsgfTtcbiAgICAgKi9cbiAgICBsaXN0ZW5lcjogZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLmxvZyhlLnR5cGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAqIEBkZWZhdWx0IHdpbmRvdy5kb2N1bWVudFxuICAgICAqL1xuICAgIHRhcmdldHM6IHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnICYmIHdpbmRvdy5kb2N1bWVudCxcblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgU3RhcmxvZyNzdGFydFxuICAgICAqIEBzdW1tYXJ5IFN0YXJ0IGxvZ2dpbmcgZXZlbnRzLlxuICAgICAqIEBkZXNjIEFkZCBuZXcgZXZlbnQgbGlzdGVuZXJzIGZvciBsb2dnaW5nIHB1cnBvc2VzLlxuICAgICAqIE9sZCBldmVudCBsaXN0ZW5lcnMsIGlmIGFueSwgYXJlIHJlbW92ZWQgZmlyc3QsIGJlZm9yZSBhZGRpbmcgbmV3IG9uZXMuXG4gICAgICovXG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIGV2ZW50TGlzdGVuZXIodGhpcy5ldmVudHMsICdhZGQnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCBTdGFybG9nI3N0b3BcbiAgICAgKiBAc3VtbWFyeSBTdG9wIGxvZ2dpbmcgZXZlbnRzLlxuICAgICAqIEBkZXNjIEV2ZW50IGxpc3RlbmVycyBhcmUgcmVtb3ZlZCBmcm9tIHRhcmdldHMgYW5kIGRlbGV0ZWQuXG4gICAgICovXG4gICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICBldmVudExpc3RlbmVyKHRoaXMuZXZlbnRzLCAncmVtb3ZlJyk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gZXZlbnRMaXN0ZW5lcihkaWN0aW9uYXJ5LCBtZXRob2RQcmVmaXgpIHtcbiAgICBpZiAoIWRpY3Rpb25hcnkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBtZXRob2QgPSBtZXRob2RQcmVmaXggKyAnRXZlbnRMaXN0ZW5lcic7XG5cbiAgICBPYmplY3Qua2V5cyhkaWN0aW9uYXJ5KS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50VHlwZSkge1xuICAgICAgICB2YXIgZXZlbnRMb2dnZXIgPSBkaWN0aW9uYXJ5W2V2ZW50VHlwZV07XG4gICAgICAgIGV2ZW50TG9nZ2VyLnRhcmdldHMuZm9yRWFjaChmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgICAgIHRhcmdldFttZXRob2RdKGV2ZW50VHlwZSwgZXZlbnRMb2dnZXIubGlzdGVuZXIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYXJyYXlpZnkoeCkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHgpID8geCA6IFt4XTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGFyTG9nOyIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgZGVtbyA9IHRoaXMsXG4gICAgICAgIGdyaWQgPSBkZW1vLmdyaWQsXG4gICAgICAgIHNjaGVtYSA9IGdyaWQuYmVoYXZpb3Iuc2NoZW1hLFxuICAgICAgICBDZWxsRWRpdG9yID0gZ3JpZC5jZWxsRWRpdG9ycy5CYXNlQ2xhc3MsXG4gICAgICAgIFRleHRmaWVsZCA9IGdyaWQuY2VsbEVkaXRvcnMuZ2V0KCd0ZXh0ZmllbGQnKSxcbiAgICAgICAgQ29sb3JUZXh0ID0gVGV4dGZpZWxkLmV4dGVuZCgnY29sb3JUZXh0Jywge1xuICAgICAgICAgICAgdGVtcGxhdGU6ICc8aW5wdXQgdHlwZT1cInRleHRcIiBsYW5nPVwie3tsb2NhbGV9fVwiIHN0eWxlPVwiY29sb3I6e3t0ZXh0Q29sb3J9fVwiPidcbiAgICAgICAgfSk7XG5cbiAgICBncmlkLmNlbGxFZGl0b3JzLmFkZChDb2xvclRleHQpO1xuXG4gICAgdmFyIFRpbWUgPSBUZXh0ZmllbGQuZXh0ZW5kKCdUaW1lJywge1xuICAgICAgICB0ZW1wbGF0ZTogW1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJoeXBlcmdyaWQtdGV4dGZpZWxkXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0O1wiPicsXG4gICAgICAgICAgICAnICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGxhbmc9XCJ7e2xvY2FsZX19XCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50OyB3aWR0aDo3NSU7IHRleHQtYWxpZ246cmlnaHQ7IGJvcmRlcjowOyBwYWRkaW5nOjA7IG91dGxpbmU6MDsgZm9udC1zaXplOmluaGVyaXQ7IGZvbnQtd2VpZ2h0OmluaGVyaXQ7JyArXG4gICAgICAgICAgICAne3tzdHlsZX19XCI+JyxcbiAgICAgICAgICAgICcgICAgPHNwYW4+QU08L3NwYW4+JyxcbiAgICAgICAgICAgICc8L2Rpdj4nXG4gICAgICAgIF0uam9pbignXFxuJyksXG5cbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0ID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xuICAgICAgICAgICAgdGhpcy5tZXJpZGlhbiA9IHRoaXMuZWwucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuXG4gICAgICAgICAgICAvLyBGbGlwIEFNL1BNIG9uIGFueSBjbGlja1xuICAgICAgICAgICAgdGhpcy5lbC5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tZXJpZGlhbi50ZXh0Q29udGVudCA9IHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQgPT09ICdBTScgPyAnUE0nIDogJ0FNJztcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpOyAvLyBpZ25vcmUgY2xpY2tzIGluIHRoZSB0ZXh0IGZpZWxkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5vbmZvY3VzID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgICAgICAgICB0aGlzLmVsLnN0eWxlLm91dGxpbmUgPSB0aGlzLm91dGxpbmUgPSB0aGlzLm91dGxpbmUgfHwgd2luZG93LmdldENvbXB1dGVkU3R5bGUodGFyZ2V0KS5vdXRsaW5lO1xuICAgICAgICAgICAgICAgIHRhcmdldC5zdHlsZS5vdXRsaW5lID0gMDtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQub25ibHVyID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwuc3R5bGUub3V0bGluZSA9IDA7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0RWRpdG9yVmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBDZWxsRWRpdG9yLnByb3RvdHlwZS5zZXRFZGl0b3JWYWx1ZS5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHRoaXMuaW5wdXQudmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQudmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgICAgICAgIHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQgPSBwYXJ0c1sxXTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRFZGl0b3JWYWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHZhbHVlID0gQ2VsbEVkaXRvci5wcm90b3R5cGUuZ2V0RWRpdG9yVmFsdWUuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICBpZiAodGhpcy5tZXJpZGlhbi50ZXh0Q29udGVudCA9PT0gJ1BNJykge1xuICAgICAgICAgICAgICAgIHZhbHVlICs9IGRlbW8uTk9PTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZ3JpZC5jZWxsRWRpdG9ycy5hZGQoVGltZSk7XG5cbiAgICAvLyBVc2VkIGJ5IHRoZSBjZWxsUHJvdmlkZXIuXG4gICAgLy8gYG51bGxgIG1lYW5zIGNvbHVtbidzIGRhdGEgY2VsbHMgYXJlIG5vdCBlZGl0YWJsZS5cbiAgICB2YXIgZWRpdG9yVHlwZXMgPSBbXG4gICAgICAgIG51bGwsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgJ3RleHRmaWVsZCcsXG4gICAgICAgIG51bGwsXG4gICAgICAgICd0aW1lJyxcbiAgICAgICAgJ2Nob2ljZScsXG4gICAgICAgICdjaG9pY2UnLFxuICAgICAgICAnY2hvaWNlJyxcbiAgICAgICAgJ3RleHRmaWVsZCcsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICAndGV4dGZpZWxkJ1xuICAgIF07XG5cbiAgICAvLyBPdmVycmlkZSB0byBhc3NpZ24gdGhlIHRoZSBjZWxsIGVkaXRvcnMuXG4gICAgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuZ2V0Q2VsbEVkaXRvckF0ID0gZnVuY3Rpb24oeCwgeSwgZGVjbGFyZWRFZGl0b3JOYW1lLCBjZWxsRXZlbnQpIHtcbiAgICAgICAgdmFyIGVkaXRvck5hbWUgPSBkZWNsYXJlZEVkaXRvck5hbWUgfHwgZWRpdG9yVHlwZXNbeCAlIGVkaXRvclR5cGVzLmxlbmd0aF07XG5cbiAgICAgICAgc3dpdGNoICh4KSB7XG4gICAgICAgICAgICBjYXNlIHNjaGVtYS5iaXJ0aFN0YXRlLmluZGV4OlxuICAgICAgICAgICAgICAgIGNlbGxFdmVudC50ZXh0Q29sb3IgPSAncmVkJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjZWxsRWRpdG9yID0gZ3JpZC5jZWxsRWRpdG9ycy5jcmVhdGUoZWRpdG9yTmFtZSwgY2VsbEV2ZW50KTtcblxuICAgICAgICBpZiAoY2VsbEVkaXRvcikge1xuICAgICAgICAgICAgc3dpdGNoICh4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBzY2hlbWEuZW1wbG95ZWQuaW5kZXg6XG4gICAgICAgICAgICAgICAgICAgIGNlbGxFZGl0b3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2Ugc2NoZW1hLnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQuaW5kZXg6XG4gICAgICAgICAgICAgICAgICAgIGNlbGxFZGl0b3IuaW5wdXQuc2V0QXR0cmlidXRlKCdtaW4nLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgY2VsbEVkaXRvci5pbnB1dC5zZXRBdHRyaWJ1dGUoJ21heCcsIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgY2VsbEVkaXRvci5pbnB1dC5zZXRBdHRyaWJ1dGUoJ3N0ZXAnLCAwLjAxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2VsbEVkaXRvcjtcbiAgICB9O1xufTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgZGVtbyA9IHRoaXMsXG4gICAgICAgIGdyaWQgPSBkZW1vLmdyaWQsXG4gICAgICAgIHNjaGVtYSA9IGdyaWQuYmVoYXZpb3Iuc2NoZW1hO1xuXG4gICAgLy9HRVQgQ0VMTFxuICAgIC8vYWxsIGZvcm1hdHRpbmcgYW5kIHJlbmRlcmluZyBwZXIgY2VsbCBjYW4gYmUgb3ZlcnJpZGRlbiBpbiBoZXJlXG4gICAgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuZ2V0Q2VsbCA9IGZ1bmN0aW9uKGNvbmZpZywgcmVuZGVyZXJOYW1lKSB7XG4gICAgICAgIGlmIChjb25maWcuaXNVc2VyRGF0YUFyZWEpIHtcbiAgICAgICAgICAgIHZhciBuLCBoZXgsIHRyYXZlbCxcbiAgICAgICAgICAgICAgICBjb2xJbmRleCA9IGNvbmZpZy5kYXRhQ2VsbC54LFxuICAgICAgICAgICAgICAgIHJvd0luZGV4ID0gY29uZmlnLmRhdGFDZWxsLnk7XG5cbiAgICAgICAgICAgIGlmIChkZW1vLnN0eWxlUm93c0Zyb21EYXRhKSB7XG4gICAgICAgICAgICAgICAgbiA9IGdyaWQuYmVoYXZpb3IuZ2V0Q29sdW1uKHNjaGVtYS50b3RhbE51bWJlck9mUGV0c093bmVkLmluZGV4KS5nZXRWYWx1ZShyb3dJbmRleCk7XG4gICAgICAgICAgICAgICAgaGV4ID0gKDE1NSArIDEwICogKG4gJSAxMSkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICBjb25maWcuYmFja2dyb3VuZENvbG9yID0gJyMnICsgaGV4ICsgaGV4ICsgaGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzd2l0Y2ggKGNvbEluZGV4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBzY2hlbWEubGFzdE5hbWUuaW5kZXg6XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5jb2xvciA9IGNvbmZpZy52YWx1ZSAhPSBudWxsICYmIChjb25maWcudmFsdWUgKyAnJylbMF0gPT09ICdTJyA/ICdyZWQnIDogJyMxOTE5MTknO1xuICAgICAgICAgICAgICAgICAgICBjb25maWcubGluayA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBzY2hlbWEuaW5jb21lLmluZGV4OlxuICAgICAgICAgICAgICAgICAgICB0cmF2ZWwgPSA2MDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIHNjaGVtYS50cmF2ZWwuaW5kZXg6XG4gICAgICAgICAgICAgICAgICAgIHRyYXZlbCA9IDEwNTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0cmF2ZWwpIHtcbiAgICAgICAgICAgICAgICB0cmF2ZWwgKz0gTWF0aC5yb3VuZChjb25maWcudmFsdWUgKiAxNTAgLyAxMDAwMDApO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IgPSAnIzAwJyArIHRyYXZlbC50b1N0cmluZygxNikgKyAnMDAnO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5jb2xvciA9ICcjRkZGRkZGJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9UZXN0aW5nXG4gICAgICAgICAgICBpZiAoY29sSW5kZXggPT09IHNjaGVtYS50b3RhbE51bWJlck9mUGV0c093bmVkLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBCZSBzdXJlIHRvIGFkanVzdCB0aGUgZGF0YSBzZXQgdG8gdGhlIGFwcHJvcHJpYXRlIHR5cGUgYW5kIHNoYXBlIGluIHdpZGVkYXRhLmpzXG4gICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICAvL3JldHVybiBzaW1wbGVDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gZW1wdHlDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gYnV0dG9uQ2VsbDsgLy9XT1JLU1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuIGVycm9yQ2VsbDsgLy9XT1JLUzogTm90ZWQgdGhhdCBhbnkgZXJyb3IgaW4gdGhpcyBmdW5jdGlvbiBzdGVhbHMgdGhlIG1haW4gdGhyZWFkIGJ5IHJlY3Vyc2lvblxuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHNwYXJrTGluZUNlbGw7IC8vIFdPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gc3BhcmtCYXJDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gc2xpZGVyQ2VsbDsgLy9XT1JLU1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHRyZWVDZWxsOyAvL05lZWQgdG8gZmlndXJlIG91dCBkYXRhIHNoYXBlIHRvIHRlc3RcblxuXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBUZXN0IG9mIEN1c3RvbWl6ZWQgUmVuZGVyZXJcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAvLyBpZiAoc3RhcnJ5KXtcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmRvbWFpbiA9IDU7IC8vIGRlZmF1bHQgaXMgMTAwXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5zaXplRmFjdG9yID0gIDAuNjU7IC8vIGRlZmF1bHQgaXMgMC42NTsgc2l6ZSBvZiBzdGFycyBhcyBmcmFjdGlvbiBvZiBoZWlnaHQgb2YgY2VsbFxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuZGFya2VuRmFjdG9yID0gMC43NTsgLy8gZGVmYXVsdCBpcyAwLjc1OyBzdGFyIHN0cm9rZSBjb2xvciBhcyBmcmFjdGlvbiBvZiBzdGFyIGZpbGwgY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmNvbG9yID0gJ2dvbGQnOyAvLyBkZWZhdWx0IGlzICdnb2xkJzsgc3RhciBmaWxsIGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5mZ0NvbG9yID0gICdncmV5JzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyB0ZXh0IGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5mZ1NlbENvbG9yID0gJ3llbGxvdyc7IC8vIGRlZmF1bHQgaXMgJ3RyYW5zcGFyZW50JyAobm90IHJlbmRlcmVkKTsgdGV4dCBzZWxlY3Rpb24gY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmJnQ29sb3IgPSAnIzQwNDA0MCc7IC8vIGRlZmF1bHQgaXMgJ3RyYW5zcGFyZW50JyAobm90IHJlbmRlcmVkKTsgYmFja2dyb3VuZCBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuYmdTZWxDb2xvciA9ICdncmV5JzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyBiYWNrZ3JvdW5kIHNlbGVjdGlvbiBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuc2hhZG93Q29sb3IgPSAndHJhbnNwYXJlbnQnOyAvLyBkZWZhdWx0IGlzICd0cmFuc3BhcmVudCdcbiAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIHN0YXJyeTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ3JpZC5jZWxsUmVuZGVyZXJzLmdldChyZW5kZXJlck5hbWUpO1xuICAgIH07XG5cbiAgICAvL0VORCBPRiBHRVQgQ0VMTFxuXG5cbiAgICAvLyBDVVNUT00gQ0VMTCBSRU5ERVJFUlxuXG4gICAgdmFyIFJFR0VYUF9DU1NfSEVYNiA9IC9eIyguLikoLi4pKC4uKSQvLFxuICAgICAgICBSRUdFWFBfQ1NTX1JHQiA9IC9ecmdiYVxcKChcXGQrKSwoXFxkKyksKFxcZCspLFxcZCtcXCkkLztcblxuICAgIGZ1bmN0aW9uIHBhaW50U3BhcmtSYXRpbmcoZ2MsIGNvbmZpZykge1xuICAgICAgICB2YXIgeCA9IGNvbmZpZy5ib3VuZHMueCxcbiAgICAgICAgICAgIHkgPSBjb25maWcuYm91bmRzLnksXG4gICAgICAgICAgICB3aWR0aCA9IGNvbmZpZy5ib3VuZHMud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQgPSBjb25maWcuYm91bmRzLmhlaWdodCxcbiAgICAgICAgICAgIG9wdGlvbnMgPSBjb25maWcudmFsdWUsXG4gICAgICAgICAgICBkb21haW4gPSBvcHRpb25zLmRvbWFpbiB8fCBjb25maWcuZG9tYWluIHx8IDEwMCxcbiAgICAgICAgICAgIHNpemVGYWN0b3IgPSBvcHRpb25zLnNpemVGYWN0b3IgfHwgY29uZmlnLnNpemVGYWN0b3IgfHwgMC42NSxcbiAgICAgICAgICAgIGRhcmtlbkZhY3RvciA9IG9wdGlvbnMuZGFya2VuRmFjdG9yIHx8IGNvbmZpZy5kYXJrZW5GYWN0b3IgfHwgMC43NSxcbiAgICAgICAgICAgIGNvbG9yID0gb3B0aW9ucy5jb2xvciB8fCBjb25maWcuY29sb3IgfHwgJ2dvbGQnLFxuICAgICAgICAgICAgc3Ryb2tlID0gdGhpcy5zdHJva2UgPSBjb2xvciA9PT0gdGhpcy5jb2xvciA/IHRoaXMuc3Ryb2tlIDogZ2V0RGFya2VuZWRDb2xvcihnYywgdGhpcy5jb2xvciA9IGNvbG9yLCBkYXJrZW5GYWN0b3IpLFxuICAgICAgICAgICAgLy8gYmdDb2xvciA9IGNvbmZpZy5pc1NlbGVjdGVkID8gKG9wdGlvbnMuYmdTZWxDb2xvciB8fCBjb25maWcuYmdTZWxDb2xvcikgOiAob3B0aW9ucy5iZ0NvbG9yIHx8IGNvbmZpZy5iZ0NvbG9yKSxcbiAgICAgICAgICAgIGZnQ29sb3IgPSBjb25maWcuaXNTZWxlY3RlZCA/IChvcHRpb25zLmZnU2VsQ29sb3IgfHwgY29uZmlnLmZnU2VsQ29sb3IpIDogKG9wdGlvbnMuZmdDb2xvciB8fCBjb25maWcuZmdDb2xvciksXG4gICAgICAgICAgICBzaGFkb3dDb2xvciA9IG9wdGlvbnMuc2hhZG93Q29sb3IgfHwgY29uZmlnLnNoYWRvd0NvbG9yIHx8ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAvLyBmb250ID0gb3B0aW9ucy5mb250IHx8IGNvbmZpZy5mb250IHx8ICcxMXB4IHZlcmRhbmEnLFxuICAgICAgICAgICAgbWlkZGxlID0gaGVpZ2h0IC8gMixcbiAgICAgICAgICAgIGRpYW1ldGVyID0gc2l6ZUZhY3RvciAqIGhlaWdodCxcbiAgICAgICAgICAgIG91dGVyUmFkaXVzID0gc2l6ZUZhY3RvciAqIG1pZGRsZSxcbiAgICAgICAgICAgIHZhbCA9IE51bWJlcihvcHRpb25zLnZhbCksXG4gICAgICAgICAgICBwb2ludHMgPSB0aGlzLnBvaW50cztcblxuICAgICAgICBpZiAoIXBvaW50cykge1xuICAgICAgICAgICAgdmFyIGlubmVyUmFkaXVzID0gMyAvIDcgKiBvdXRlclJhZGl1cztcbiAgICAgICAgICAgIHBvaW50cyA9IHRoaXMucG9pbnRzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gNSwgcGkgPSBNYXRoLlBJIC8gMiwgaW5jciA9IE1hdGguUEkgLyA1OyBpOyAtLWksIHBpICs9IGluY3IpIHtcbiAgICAgICAgICAgICAgICBwb2ludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHg6IG91dGVyUmFkaXVzICogTWF0aC5jb3MocGkpLFxuICAgICAgICAgICAgICAgICAgICB5OiBtaWRkbGUgLSBvdXRlclJhZGl1cyAqIE1hdGguc2luKHBpKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHBpICs9IGluY3I7XG4gICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiBpbm5lclJhZGl1cyAqIE1hdGguY29zKHBpKSxcbiAgICAgICAgICAgICAgICAgICAgeTogbWlkZGxlIC0gaW5uZXJSYWRpdXMgKiBNYXRoLnNpbihwaSlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvaW50cy5wdXNoKHBvaW50c1swXSk7IC8vIGNsb3NlIHRoZSBwYXRoXG4gICAgICAgIH1cblxuICAgICAgICBnYy5jYWNoZS5zaGFkb3dDb2xvciA9ICd0cmFuc3BhcmVudCc7XG5cbiAgICAgICAgZ2MuY2FjaGUubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgICBnYy5iZWdpblBhdGgoKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDUsIHN4ID0geCArIDUgKyBvdXRlclJhZGl1czsgajsgLS1qLCBzeCArPSBkaWFtZXRlcikge1xuICAgICAgICAgICAgcG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocG9pbnQsIGluZGV4KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgICAgICBnY1tpbmRleCA/ICdsaW5lVG8nIDogJ21vdmVUbyddKHN4ICsgcG9pbnQueCwgeSArIHBvaW50LnkpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICB9KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICB9XG4gICAgICAgIGdjLmNsb3NlUGF0aCgpO1xuXG4gICAgICAgIHZhbCA9IHZhbCAvIGRvbWFpbiAqIDU7XG5cbiAgICAgICAgZ2MuY2FjaGUuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgICAgIGdjLnNhdmUoKTtcbiAgICAgICAgZ2MuY2xpcCgpO1xuICAgICAgICBnYy5maWxsUmVjdCh4ICsgNSwgeSxcbiAgICAgICAgICAgIChNYXRoLmZsb29yKHZhbCkgKyAwLjI1ICsgdmFsICUgMSAqIDAuNSkgKiBkaWFtZXRlciwgLy8gYWRqdXN0IHdpZHRoIHRvIHNraXAgb3ZlciBzdGFyIG91dGxpbmVzIGFuZCBqdXN0IG1ldGVyIHRoZWlyIGludGVyaW9yc1xuICAgICAgICAgICAgaGVpZ2h0KTtcbiAgICAgICAgZ2MucmVzdG9yZSgpOyAvLyByZW1vdmUgY2xpcHBpbmcgcmVnaW9uXG5cbiAgICAgICAgZ2MuY2FjaGUuc3Ryb2tlU3R5bGUgPSBzdHJva2U7XG4gICAgICAgIGdjLmNhY2hlLmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIGdjLnN0cm9rZSgpO1xuXG4gICAgICAgIGlmIChmZ0NvbG9yICYmIGZnQ29sb3IgIT09ICd0cmFuc3BhcmVudCcpIHtcbiAgICAgICAgICAgIGdjLmNhY2hlLmZpbGxTdHlsZSA9IGZnQ29sb3I7XG4gICAgICAgICAgICBnYy5jYWNoZS5mb250ID0gJzExcHggdmVyZGFuYSc7XG4gICAgICAgICAgICBnYy5jYWNoZS50ZXh0QWxpZ24gPSAncmlnaHQnO1xuICAgICAgICAgICAgZ2MuY2FjaGUudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XG4gICAgICAgICAgICBnYy5jYWNoZS5zaGFkb3dDb2xvciA9IHNoYWRvd0NvbG9yO1xuICAgICAgICAgICAgZ2MuY2FjaGUuc2hhZG93T2Zmc2V0WCA9IGdjLmNhY2hlLnNoYWRvd09mZnNldFkgPSAxO1xuICAgICAgICAgICAgZ2MuZmlsbFRleHQodmFsLnRvRml4ZWQoMSksIHggKyB3aWR0aCArIDEwLCB5ICsgaGVpZ2h0IC8gMik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXREYXJrZW5lZENvbG9yKGdjLCBjb2xvciwgZmFjdG9yKSB7XG4gICAgICAgIHZhciByZ2JhID0gZ2V0UkdCQShnYywgY29sb3IpO1xuICAgICAgICByZXR1cm4gJ3JnYmEoJyArIE1hdGgucm91bmQoZmFjdG9yICogcmdiYVswXSkgKyAnLCcgKyBNYXRoLnJvdW5kKGZhY3RvciAqIHJnYmFbMV0pICsgJywnICsgTWF0aC5yb3VuZChmYWN0b3IgKiByZ2JhWzJdKSArICcsJyArIChyZ2JhWzNdIHx8IDEpICsgJyknO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFJHQkEoZ2MsIGNvbG9yU3BlYykge1xuICAgICAgICAvLyBOb3JtYWxpemUgdmFyaWV0eSBvZiBDU1MgY29sb3Igc3BlYyBzeW50YXhlcyB0byBvbmUgb2YgdHdvXG4gICAgICAgIGdjLmNhY2hlLmZpbGxTdHlsZSA9IGNvbG9yU3BlYztcblxuICAgICAgICB2YXIgcmdiYSA9IGNvbG9yU3BlYy5tYXRjaChSRUdFWFBfQ1NTX0hFWDYpO1xuICAgICAgICBpZiAocmdiYSkge1xuICAgICAgICAgICAgcmdiYS5zaGlmdCgpOyAvLyByZW1vdmUgd2hvbGUgbWF0Y2hcbiAgICAgICAgICAgIHJnYmEuZm9yRWFjaChmdW5jdGlvbih2YWwsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmdiYVtpbmRleF0gPSBwYXJzZUludCh2YWwsIDE2KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmdiYSA9IGNvbG9yU3BlYy5tYXRjaChSRUdFWFBfQ1NTX1JHQik7XG4gICAgICAgICAgICBpZiAoIXJnYmEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnVW5leHBlY3RlZCBmb3JtYXQgZ2V0dGluZyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQuZmlsbFN0eWxlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJnYmEuc2hpZnQoKTsgLy8gcmVtb3ZlIHdob2xlIG1hdGNoXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmdiYTtcbiAgICB9XG5cblxuICAgIC8vRXh0ZW5kIEh5cGVyR3JpZCdzIGJhc2UgUmVuZGVyZXJcbiAgICB2YXIgc3BhcmtTdGFyUmF0aW5nUmVuZGVyZXIgPSBncmlkLmNlbGxSZW5kZXJlcnMuQmFzZUNsYXNzLmV4dGVuZCh7XG4gICAgICAgIHBhaW50OiBwYWludFNwYXJrUmF0aW5nXG4gICAgfSk7XG5cbiAgICAvL1JlZ2lzdGVyIHlvdXIgcmVuZGVyZXJcbiAgICBncmlkLmNlbGxSZW5kZXJlcnMuYWRkKCdTdGFycnknLCBzcGFya1N0YXJSYXRpbmdSZW5kZXJlcik7XG5cbiAgICAvLyBFTkQgT0YgQ1VTVE9NIENFTEwgUkVOREVSRVJcbiAgICByZXR1cm4gZ3JpZDtcbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLWFsZXJ0ICovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gU29tZSBET00gc3VwcG9ydCBmdW5jdGlvbnMuLi5cbi8vIEJlc2lkZXMgdGhlIGNhbnZhcywgdGhpcyB0ZXN0IGhhcm5lc3Mgb25seSBoYXMgYSBoYW5kZnVsIG9mIGJ1dHRvbnMgYW5kIGNoZWNrYm94ZXMuXG4vLyBUaGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBzZXJ2aWNlIHRoZXNlIGNvbnRyb2xzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGRlbW8gPSB0aGlzLFxuICAgICAgICBncmlkID0gZGVtby5ncmlkO1xuXG4gICAgICAgIC8vIG1ha2UgYnV0dG9ucyBkaXYgYWJzb2x1dGUgc28gYnV0dG9ucyB3aWR0aCBvZiAxMDAlIGRvZXNuJ3Qgc3RyZXRjaCB0byB3aWR0aCBvZiBkYXNoYm9hcmRcbiAgICB2YXIgY3RybEdyb3VwcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdHJsLWdyb3VwcycpLFxuICAgICAgICBkYXNoYm9hcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGFzaGJvYXJkJyksXG4gICAgICAgIGJ1dHRvbnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnV0dG9ucycpO1xuXG4gICAgY3RybEdyb3Vwcy5zdHlsZS50b3AgPSBjdHJsR3JvdXBzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICdweCc7XG4gICAgLy9idXR0b25zLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBkYXNoYm9hcmQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIGZ1bmN0aW9uIHRvZ2dsZVJvd1N0eWxpbmdNZXRob2QoKSB7XG4gICAgICAgIGRlbW8uc3R5bGVSb3dzRnJvbURhdGEgPSAhZGVtby5zdHlsZVJvd3NGcm9tRGF0YTtcbiAgICAgICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgfVxuXG4gICAgLy8gTGlzdCBvZiBwcm9wZXJ0aWVzIHRvIHNob3cgYXMgY2hlY2tib3hlcyBpbiB0aGlzIGRlbW8ncyBcImRhc2hib2FyZFwiXG4gICAgdmFyIHRvZ2dsZVByb3BzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ1JvdyBzdHlsaW5nJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge25hbWU6ICcoR2xvYmFsIHNldHRpbmcpJywgbGFiZWw6ICdiYXNlIG9uIGRhdGEnLCBzZXR0ZXI6IHRvZ2dsZVJvd1N0eWxpbmdNZXRob2R9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnQ29sdW1uIGhlYWRlciByb3dzJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge25hbWU6ICdzaG93SGVhZGVyUm93JywgbGFiZWw6ICdoZWFkZXInfSwgLy8gZGVmYXVsdCBcInNldHRlclwiIGlzIGBzZXRQcm9wYFxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ0hvdmVyIGhpZ2hsaWdodHMnLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2hvdmVyQ2VsbEhpZ2hsaWdodC5lbmFibGVkJywgbGFiZWw6ICdjZWxsJ30sXG4gICAgICAgICAgICAgICAge25hbWU6ICdob3ZlclJvd0hpZ2hsaWdodC5lbmFibGVkJywgbGFiZWw6ICdyb3cnfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2hvdmVyQ29sdW1uSGlnaGxpZ2h0LmVuYWJsZWQnLCBsYWJlbDogJ2NvbHVtbid9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnTGluayBzdHlsZScsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnbGlua09uSG92ZXInLCBsYWJlbDogJ29uIGhvdmVyJ30sXG4gICAgICAgICAgICAgICAge25hbWU6ICdsaW5rQ29sb3InLCB0eXBlOiAndGV4dCcsIGxhYmVsOiAnY29sb3InfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2xpbmtDb2xvck9uSG92ZXInLCBsYWJlbDogJ2NvbG9yIG9uIGhvdmVyJ31cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbGFiZWw6ICdDZWxsIGVkaXRpbmcnLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2VkaXRhYmxlJ30sXG4gICAgICAgICAgICAgICAge25hbWU6ICdlZGl0T25Eb3VibGVDbGljaycsIGxhYmVsOiAncmVxdWlyZXMgZG91YmxlLWNsaWNrJ30sXG4gICAgICAgICAgICAgICAge25hbWU6ICdlZGl0T25LZXlkb3duJywgbGFiZWw6ICd0eXBlIHRvIGVkaXQnfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBsYWJlbDogJ1NlbGVjdGlvbicsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2NoZWNrYm94T25seVJvd1NlbGVjdGlvbnMnLCBsYWJlbDogJ2J5IHJvdyBoYW5kbGVzIG9ubHknLCBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3AsXG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXA6ICdOb3RlIHRoYXQgd2hlbiB0aGlzIHByb3BlcnR5IGlzIGFjdGl2ZSwgYXV0b1NlbGVjdFJvd3Mgd2lsbCBub3Qgd29yay4nXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ3NpbmdsZVJvd1NlbGVjdGlvbk1vZGUnLCBsYWJlbDogJ29uZSByb3cgYXQgYSB0aW1lJywgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICchbXVsdGlwbGVTZWxlY3Rpb25zJyxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdvbmUgY2VsbCByZWdpb24gYXQgYSB0aW1lJyxcbiAgICAgICAgICAgICAgICAgICAgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wLFxuICAgICAgICAgICAgICAgICAgICBjaGVja2VkOiB0cnVlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdhdXRvU2VsZWN0Um93cycsIGxhYmVsOiAnYXV0by1zZWxlY3Qgcm93cycsIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcCxcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcDogJ05vdGVzOlxcbicgK1xuICAgICAgICAgICAgICAgICAgICAnMS4gUmVxdWlyZXMgdGhhdCBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zIGJlIHNldCB0byBmYWxzZSAoc28gY2hlY2tpbmcgdGhpcyBib3ggYXV0b21hdGljYWxseSB1bmNoZWNrcyB0aGF0IG9uZSkuXFxuJyArXG4gICAgICAgICAgICAgICAgICAgICcyLiBTZXQgc2luZ2xlUm93U2VsZWN0aW9uTW9kZSB0byBmYWxzZSB0byBhbGxvdyBhdXRvLXNlbGVjdCBvZiBtdWx0aXBsZSByb3dzLidcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnYXV0b1NlbGVjdENvbHVtbnMnLCBsYWJlbDogJ2F1dG8tc2VsZWN0IGNvbHVtbnMnLCBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3B9XG4gICAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICBdO1xuXG5cbiAgICB0b2dnbGVQcm9wcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgICAgYWRkVG9nZ2xlKHByb3ApO1xuICAgIH0pO1xuXG5cbiAgICBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnVG9nZ2xlIEVtcHR5IERhdGEnLFxuICAgICAgICAgICAgb25jbGljazogZGVtby50b2dnbGVFbXB0eURhdGFcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdTZXQgRGF0YScsIG9uY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGVtby5yZXNldERhdGEoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdTZXQgRGF0YSAxICg1MDAwIHJvd3MpJywgb25jbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZW1vLnNldERhdGEoZGVtby5kYXRhLnBlb3BsZTEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ1NldCBEYXRhIDIgKDEwMDAwIHJvd3MpJywgb25jbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZW1vLnNldERhdGEoZGVtby5kYXRhLnBlb3BsZTIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ1Jlc2V0IEdyaWQnLFxuICAgICAgICAgICAgb25jbGljazogZGVtby5yZXNldFxuICAgICAgICB9XG4gICAgXS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgICBidXR0b24uaW5uZXJIVE1MID0gaXRlbS5sYWJlbDtcbiAgICAgICAgYnV0dG9uLm9uY2xpY2sgPSBpdGVtLm9uY2xpY2s7XG4gICAgICAgIGlmIChpdGVtLnRpdGxlKSB7XG4gICAgICAgICAgICBidXR0b24udGl0bGUgPSBpdGVtLnRpdGxlO1xuICAgICAgICB9XG4gICAgICAgIGJ1dHRvbnMuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgICB9KTtcblxuXG4gICAgZnVuY3Rpb24gYWRkVG9nZ2xlKGN0cmxHcm91cCkge1xuICAgICAgICB2YXIgaW5wdXQsIGxhYmVsLFxuICAgICAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9ICdjdHJsLWdyb3VwJztcblxuICAgICAgICBpZiAoY3RybEdyb3VwLmxhYmVsKSB7XG4gICAgICAgICAgICBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgbGFiZWwuY2xhc3NOYW1lID0gJ3R3aXN0ZXInO1xuICAgICAgICAgICAgbGFiZWwuaW5uZXJIVE1MID0gY3RybEdyb3VwLmxhYmVsO1xuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaG9pY2VzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGNob2ljZXMuY2xhc3NOYW1lID0gJ2Nob2ljZXMnO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2hvaWNlcyk7XG5cbiAgICAgICAgY3RybEdyb3VwLmN0cmxzLmZvckVhY2goZnVuY3Rpb24oY3RybCkge1xuICAgICAgICAgICAgaWYgKCFjdHJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmVmZXJlbmNlRWxlbWVudCxcbiAgICAgICAgICAgICAgICB0eXBlID0gY3RybC50eXBlIHx8ICdjaGVja2JveCcsXG4gICAgICAgICAgICAgICAgdG9vbHRpcCA9ICdQcm9wZXJ0eSBuYW1lOiAnICsgY3RybC5uYW1lO1xuXG4gICAgICAgICAgICBpZiAoY3RybC50b29sdGlwKSB7XG4gICAgICAgICAgICAgICAgdG9vbHRpcCArPSAnXFxuXFxuJyArIGN0cmwudG9vbHRpcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgaW5wdXQudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICBpbnB1dC5pZCA9IGN0cmwubmFtZTtcbiAgICAgICAgICAgIGlucHV0Lm5hbWUgPSBjdHJsR3JvdXAubGFiZWw7XG5cbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9IGN0cmwudmFsdWUgfHwgZ2V0UHJvcGVydHkoY3RybC5uYW1lKSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUud2lkdGggPSAnMjVweCc7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnN0eWxlLm1hcmdpbkxlZnQgPSAnNHB4JztcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUubWFyZ2luUmlnaHQgPSAnNHB4JztcbiAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlRWxlbWVudCA9IGlucHV0OyAvLyBsYWJlbCBnb2VzIGFmdGVyIGlucHV0XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgICAgICAgICBjYXNlICdyYWRpbyc6XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LmNoZWNrZWQgPSAnY2hlY2tlZCcgaW4gY3RybFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBjdHJsLmNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIDogZ2V0UHJvcGVydHkoY3RybC5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlRWxlbWVudCA9IG51bGw7IC8vIGxhYmVsIGdvZXMgYmVmb3JlIGlucHV0XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dC5vbmNoYW5nZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlUmFkaW9DbGljay5jYWxsKHRoaXMsIGN0cmwuc2V0dGVyIHx8IHNldFByb3AsIGV2ZW50KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICAgICAgICAgIGxhYmVsLnRpdGxlID0gdG9vbHRpcDtcbiAgICAgICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIGxhYmVsLmluc2VydEJlZm9yZShcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnICcgKyAoY3RybC5sYWJlbCB8fCBjdHJsLm5hbWUpKSxcbiAgICAgICAgICAgICAgICByZWZlcmVuY2VFbGVtZW50XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjaG9pY2VzLmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICAgICAgICAgICAgaWYgKGN0cmwubmFtZSA9PT0gJ3RyZWV2aWV3Jykge1xuICAgICAgICAgICAgICAgIGxhYmVsLm9ubW91c2Vkb3duID0gaW5wdXQub25tb3VzZWRvd24gPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlucHV0LmNoZWNrZWQgJiYgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuZGF0YSAhPT0gZGVtby50cmVlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0xvYWQgdHJlZSBkYXRhIGZpcnN0IChcIlNldCBEYXRhIDNcIiBidXR0b24pLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGN0cmxHcm91cHMuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICB9XG5cbiAgICAvLyByZXNldCBkYXNoYm9hcmQgY2hlY2tib3hlcyBhbmQgcmFkaW8gYnV0dG9ucyB0byBtYXRjaCBjdXJyZW50IHZhbHVlcyBvZiBncmlkIHByb3BlcnRpZXNcbiAgICBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZGVtbykucmVzZXREYXNoYm9hcmQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdG9nZ2xlUHJvcHMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgICAgICBwcm9wLmN0cmxzLmZvckVhY2goZnVuY3Rpb24oY3RybCkge1xuICAgICAgICAgICAgICAgIGlmIChjdHJsKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY3RybC5zZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2Ugc2V0U2VsZWN0aW9uUHJvcDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2Ugc2V0UHJvcDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY3RybC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3JhZGlvJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY2hlY2tib3gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZCA9IGN0cmwubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2xhcml0eSA9IChpZFswXSA9PT0gJyEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKS5jaGVja2VkID0gZ2V0UHJvcGVydHkoaWQpIF4gcG9sYXJpdHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBnZXRQcm9wZXJ0eShrZXkpIHtcbiAgICAgICAgdmFyIGtleXMgPSBrZXkuc3BsaXQoJy4nKTtcbiAgICAgICAgdmFyIHByb3AgPSBncmlkLnByb3BlcnRpZXM7XG5cbiAgICAgICAgd2hpbGUgKGtleXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBwcm9wID0gcHJvcFtrZXlzLnNoaWZ0KCldO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgfVxuXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi1kYXNoYm9hcmQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChkYXNoYm9hcmQuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKSB7XG4gICAgICAgICAgICBkYXNoYm9hcmQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS50cmFuc2l0aW9uID0gJ21hcmdpbi1sZWZ0IC43NXMnO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUubWFyZ2luTGVmdCA9IE1hdGgubWF4KDE4MCwgZGFzaGJvYXJkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0ICsgOCkgKyAncHgnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBkYXNoYm9hcmQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIH0sIDgwMCk7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS5tYXJnaW5MZWZ0ID0gJzMwcHgnO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgZnBzVGltZXIsIHNlY3MsIGZyYW1lcztcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFiLWZwcycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGVsID0gdGhpcywgc3QgPSBlbC5zdHlsZTtcbiAgICAgICAgaWYgKChncmlkLnByb3BlcnRpZXMuZW5hYmxlQ29udGludW91c1JlcGFpbnQgXj0gdHJ1ZSkpIHtcbiAgICAgICAgICAgIHN0LmJhY2tncm91bmRDb2xvciA9ICcjNjY2JztcbiAgICAgICAgICAgIHN0LnRleHRBbGlnbiA9ICdsZWZ0JztcbiAgICAgICAgICAgIHNlY3MgPSBmcmFtZXMgPSAwO1xuICAgICAgICAgICAgY29kZSgpO1xuICAgICAgICAgICAgZnBzVGltZXIgPSBzZXRJbnRlcnZhbChjb2RlLCAxMDAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoZnBzVGltZXIpO1xuICAgICAgICAgICAgc3QuYmFja2dyb3VuZENvbG9yID0gc3QudGV4dEFsaWduID0gbnVsbDtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9ICdGUFMnO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGNvZGUoKSB7XG4gICAgICAgICAgICB2YXIgZnBzID0gZ3JpZC5jYW52YXMuY3VycmVudEZQUyxcbiAgICAgICAgICAgICAgICBiYXJzID0gQXJyYXkoTWF0aC5yb3VuZChmcHMpICsgMSkuam9pbignSScpLFxuICAgICAgICAgICAgICAgIHN1YnJhbmdlLCBzcGFuO1xuXG4gICAgICAgICAgICAvLyBmaXJzdCBzcGFuIGhvbGRzIHRoZSAzMCBiYWNrZ3JvdW5kIGJhcnNcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpKTtcblxuICAgICAgICAgICAgLy8gMm5kIHNwYW4gaG9sZHMgdGhlIG51bWVyaWNcbiAgICAgICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cbiAgICAgICAgICAgIGlmIChzZWNzKSB7XG4gICAgICAgICAgICAgICAgZnJhbWVzICs9IGZwcztcbiAgICAgICAgICAgICAgICBzcGFuLmlubmVySFRNTCA9IGZwcy50b0ZpeGVkKDEpO1xuICAgICAgICAgICAgICAgIHNwYW4udGl0bGUgPSBzZWNzICsgJy1zZWNvbmQgYXZlcmFnZSA9ICcgKyAoZnJhbWVzIC8gc2VjcykudG9GaXhlZCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlY3MgKz0gMTtcblxuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbik7XG5cbiAgICAgICAgICAgIC8vIDAgdG8gNCBjb2xvciByYW5nZSBiYXIgc3Vic2V0czogMS4uMTA6cmVkLCAxMToyMDp5ZWxsb3csIDIxOjMwOmdyZWVuXG4gICAgICAgICAgICB3aGlsZSAoKHN1YnJhbmdlID0gYmFycy5zdWJzdHIoMCwgMTIpKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgICAgIHNwYW4uaW5uZXJIVE1MID0gc3VicmFuZ2U7XG4gICAgICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICAgICAgICAgICAgYmFycyA9IGJhcnMuc3Vic3RyKDEyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGhlaWdodDtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFiLWdyb3ctc2hyaW5rJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgbGFiZWw7XG4gICAgICAgIGlmICghaGVpZ2h0KSB7XG4gICAgICAgICAgICBoZWlnaHQgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShncmlkLmRpdikuaGVpZ2h0O1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUudHJhbnNpdGlvbiA9ICdoZWlnaHQgMS41cyBsaW5lYXInO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgIGxhYmVsID0gJ1Nocmluayc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICBoZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsYWJlbCA9ICdHcm93JztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlubmVySFRNTCArPSAnIC4uLic7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmlubmVySFRNTCA9IGxhYmVsO1xuICAgICAgICB9LmJpbmQodGhpcyksIDE1MDApO1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Rhc2hib2FyZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGN0cmwgPSBldmVudC50YXJnZXQ7XG4gICAgICAgIGlmIChjdHJsLmNsYXNzTGlzdC5jb250YWlucygndHdpc3RlcicpKSB7XG4gICAgICAgICAgICBjdHJsLm5leHRFbGVtZW50U2libGluZy5zdHlsZS5kaXNwbGF5ID0gY3RybC5jbGFzc0xpc3QudG9nZ2xlKCdvcGVuJykgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUubWFyZ2luTGVmdCA9IE1hdGgubWF4KDE4MCwgZXZlbnQuY3VycmVudFRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5yaWdodCArIDgpICsgJ3B4JztcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICB2YXIgcmFkaW9Hcm91cCA9IHt9O1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlUmFkaW9DbGljayhoYW5kbGVyLCBldmVudCkge1xuICAgICAgICBpZiAodGhpcy50eXBlID09PSAncmFkaW8nKSB7XG4gICAgICAgICAgICB2YXIgbGFzdFJhZGlvID0gcmFkaW9Hcm91cFt0aGlzLm5hbWVdO1xuICAgICAgICAgICAgaWYgKGxhc3RSYWRpbykge1xuICAgICAgICAgICAgICAgIGxhc3RSYWRpby5oYW5kbGVyLmNhbGwobGFzdFJhZGlvLmN0cmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmFkaW9Hcm91cFt0aGlzLm5hbWVdID0ge2N0cmw6IHRoaXMsIGhhbmRsZXI6IGhhbmRsZXJ9O1xuICAgICAgICB9XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0UHJvcCgpIHsgLy8gc3RhbmRhcmQgY2hlY2tib3ggY2xpY2sgaGFuZGxlclxuICAgICAgICB2YXIgcHJvcCA9IGdyaWQucHJvcGVydGllcztcbiAgICAgICAgdmFyIGlkID0gdGhpcy5pZDtcbiAgICAgICAgaWYgKGlkWzBdID09PSAnIScpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgIT09ICdjaGVja2JveCcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnRXhwZWN0ZWQgaW52ZXJzZSBvcGVyYXRvciAoISkgb24gY2hlY2tib3ggZGFzaGJvYXJkIGNvbnRyb2xzIG9ubHkgYnV0IGZvdW5kIG9uICcgKyB0aGlzLnR5cGUgKyAnLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZCA9IGlkLnN1YnN0cigxKTtcbiAgICAgICAgICAgIHZhciBpbnZlcnNlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIga2V5cyA9IGlkLnNwbGl0KCcuJyk7XG5cbiAgICAgICAgd2hpbGUgKGtleXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcHJvcCA9IHByb3Bba2V5cy5zaGlmdCgpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgICAgICBwcm9wW2tleXMuc2hpZnQoKV0gPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY2hlY2tib3gnOlxuICAgICAgICAgICAgICAgIHByb3Bba2V5cy5zaGlmdCgpXSA9IGludmVyc2UgPyAhdGhpcy5jaGVja2VkIDogdGhpcy5jaGVja2VkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JpZC50YWtlRm9jdXMoKTtcbiAgICAgICAgZ3JpZC5iZWhhdmlvckNoYW5nZWQoKTtcbiAgICAgICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0U2VsZWN0aW9uUHJvcCgpIHsgLy8gYWx0ZXJuYXRlIGNoZWNrYm94IGNsaWNrIGhhbmRsZXJcbiAgICAgICAgdmFyIGN0cmw7XG5cbiAgICAgICAgZ3JpZC5zZWxlY3Rpb25Nb2RlbC5jbGVhcigpO1xuXG4gICAgICAgIHNldFByb3AuY2FsbCh0aGlzKTtcblxuICAgICAgICBpZiAodGhpcy5jaGVja2VkKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgdGhpcy5pZCA9PT0gJ2NoZWNrYm94T25seVJvd1NlbGVjdGlvbnMnICYmXG4gICAgICAgICAgICAgICAgKGN0cmwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0b1NlbGVjdFJvd3MnKSkuY2hlY2tlZFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ05vdGUgdGhhdCBhdXRvU2VsZWN0Um93cyBpcyBpbmVmZmVjdHVhbCB3aGVuIGNoZWNrYm94T25seVJvd1NlbGVjdGlvbnMgaXMgb24uJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaWQgPT09ICdhdXRvU2VsZWN0Um93cycpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIChjdHJsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoZWNrYm94T25seVJvd1NlbGVjdGlvbnMnKSkuY2hlY2tlZCAmJlxuICAgICAgICAgICAgICAgICAgICBjb25maXJtKCdOb3RlIHRoYXQgYXV0b1NlbGVjdFJvd3MgaXMgaW5lZmZlY3R1YWwgd2hlbiBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zIGlzIG9uLlxcblxcblR1cm4gb2ZmIGNoZWNrYm94T25seVJvd1NlbGVjdGlvbnM/JylcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHNldFByb3AuY2FsbChjdHJsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIChjdHJsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpbmdsZVJvd1NlbGVjdGlvbk1vZGUnKSkuY2hlY2tlZCAmJlxuICAgICAgICAgICAgICAgICAgICBjb25maXJtKCdOb3RlIHRoYXQgYXV0by1zZWxlY3RpbmcgYSByYW5nZSBvZiByb3dzIGJ5IHNlbGVjdGluZyBhIHJhbmdlIG9mIGNlbGxzICh3aXRoIGNsaWNrICsgZHJhZyBvciBzaGlmdCArIGNsaWNrKSBpcyBub3QgcG9zc2libGUgd2l0aCBzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlIGlzIG9uLlxcblxcblR1cm4gb2ZmIHNpbmdsZVJvd1NlbGVjdGlvbk1vZGU/JylcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHNldFByb3AuY2FsbChjdHJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGRlbW8gPSB0aGlzLFxuICAgICAgICBncmlkID0gZGVtby5ncmlkO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tYnV0dG9uLXByZXNzZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBjZWxsRXZlbnQgPSBlLmRldGFpbDtcbiAgICAgICAgY2VsbEV2ZW50LnZhbHVlID0gIWNlbGxFdmVudC52YWx1ZTtcbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWNlbGwtZW50ZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBjZWxsRXZlbnQgPSBlLmRldGFpbDtcblxuICAgICAgICAvL2hvdyB0byBzZXQgdGhlIHRvb2x0aXAuLi4uXG4gICAgICAgIGdyaWQuc2V0QXR0cmlidXRlKCd0aXRsZScsICdldmVudCBuYW1lOiBcImZpbi1jZWxsLWVudGVyXCJcXG4nICtcbiAgICAgICAgICAgICdncmlkQ2VsbDogeyB4OiAnICsgY2VsbEV2ZW50LmdyaWRDZWxsLnggKyAnLCB5OiAnICsgY2VsbEV2ZW50LmdyaWRDZWxsLnkgKyAnIH1cXG4nICtcbiAgICAgICAgICAgICdkYXRhQ2VsbDogeyB4OiAnICsgY2VsbEV2ZW50LmRhdGFDZWxsLnggKyAnLCB5OiAnICsgY2VsbEV2ZW50LmRhdGFDZWxsLnkgKyAnIH1cXG4nICtcbiAgICAgICAgICAgICdzdWJncmlkIHR5cGU6IFwiJyArIGNlbGxFdmVudC5zdWJncmlkLnR5cGUgKyAnXCJcXG4nICtcbiAgICAgICAgICAgICdzdWJncmlkIG5hbWU6ICcgKyAoY2VsbEV2ZW50LnN1YmdyaWQubmFtZSA/ICdcIicgKyBjZWxsRXZlbnQuc3ViZ3JpZC5uYW1lICsgJ1wiJyA6ICd1bmRlZmluZWQnKVxuICAgICAgICApO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tc2V0LXRvdGFscy12YWx1ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGRldGFpbCA9IGUuZGV0YWlsLFxuICAgICAgICAgICAgYXJlYXMgPSBkZXRhaWwuYXJlYXMgfHwgWyd0b3AnLCAnYm90dG9tJ107XG5cbiAgICAgICAgYXJlYXMuZm9yRWFjaChmdW5jdGlvbihhcmVhKSB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kTmFtZSA9ICdnZXQnICsgYXJlYVswXS50b1VwcGVyQ2FzZSgpICsgYXJlYS5zdWJzdHIoMSkgKyAnVG90YWxzJyxcbiAgICAgICAgICAgICAgICB0b3RhbHNSb3cgPSBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbFttZXRob2ROYW1lXSgpO1xuXG4gICAgICAgICAgICB0b3RhbHNSb3dbZGV0YWlsLnldW2RldGFpbC54XSA9IGRldGFpbC52YWx1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBMaXN0ZW4gZm9yIGNlcnRhaW4ga2V5IHByZXNzZXMgZnJvbSBncmlkIG9yIGNlbGwgZWRpdG9yLlxuICAgICAqIEBkZXNjIE5PVEU6IGZpbmNhbnZhcydzIGludGVybmFsIGNoYXIgbWFwIHlpZWxkcyBtaXhlZCBjYXNlIHdoaWxlIGZpbi1lZGl0b3Ita2V5KiBldmVudHMgZG8gbm90LlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IE5vdCBoYW5kbGVkLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGhhbmRsZUN1cnNvcktleShlKSB7XG4gICAgICAgIHZhciBkZXRhaWwgPSBlLmRldGFpbCxcbiAgICAgICAgICAgIGtleSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZGV0YWlsLmtleSkudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlOyAvLyBtZWFucyBldmVudCBoYW5kbGVkIGhlcmVpblxuXG4gICAgICAgIGlmIChkZXRhaWwuY3RybCkge1xuICAgICAgICAgICAgaWYgKGRldGFpbC5zaGlmdCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzAnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0VG9WaWV3cG9ydENlbGwoMCwgMCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzknOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0VG9GaW5hbENlbGwoKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnOCc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RUb0ZpbmFsQ2VsbE9mQ3VycmVudFJvdygpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc3JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFRvRmlyc3RDZWxsT2ZDdXJyZW50Um93KCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICcwJzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFZpZXdwb3J0Q2VsbCgwLCAwKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnOSc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RGaW5hbENlbGwoKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnOCc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RGaW5hbENlbGxPZkN1cnJlbnRSb3coKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnNyc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RGaXJzdENlbGxPZkN1cnJlbnRSb3coKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWtleWRvd24nLCBoYW5kbGVDdXJzb3JLZXkpO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tZWRpdG9yLWtleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIHZhciBkZXRhaWwgPSBlLmRldGFpbCxcbiAgICAgICAgLy8gICAgIGtlID0gZGV0YWlsLmtleUV2ZW50O1xuICAgICAgICAvL1xuICAgICAgICAvLyAvLyBtb3JlIGRldGFpbCwgcGxlYXNlXG4gICAgICAgIC8vIGRldGFpbC5wcmltaXRpdmVFdmVudCA9IGtlO1xuICAgICAgICAvLyBkZXRhaWwua2V5ID0ga2Uua2V5Q29kZTtcbiAgICAgICAgLy8gZGV0YWlsLnNoaWZ0ID0ga2Uuc2hpZnRLZXk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGhhbmRsZUN1cnNvcktleShlKTtcbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLXNlbGVjdGlvbi1jaGFuZ2VkJywgZnVuY3Rpb24oZSkge1xuXG4gICAgICAgIGlmIChlLmRldGFpbC5zZWxlY3Rpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIHNlbGVjdGlvbnMnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRvIGdldCB0aGUgc2VsZWN0ZWQgcm93cyB1bmNvbW1lbnQgdGhlIGJlbG93Li4uLi5cbiAgICAgICAgLy8gY29uc29sZS5sb2coZ3JpZC5nZXRSb3dTZWxlY3Rpb25NYXRyaXgoKSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGdyaWQuZ2V0Um93U2VsZWN0aW9uKCkpO1xuXG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1yb3ctc2VsZWN0aW9uLWNoYW5nZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBkZXRhaWwgPSBlLmRldGFpbDtcbiAgICAgICAgLy8gTW92ZSBjZWxsIHNlbGVjdGlvbiB3aXRoIHJvdyBzZWxlY3Rpb25cbiAgICAgICAgdmFyIHJvd3MgPSBkZXRhaWwucm93cyxcbiAgICAgICAgICAgIHNlbGVjdGlvbnMgPSBkZXRhaWwuc2VsZWN0aW9ucztcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgZ3JpZC5wcm9wZXJ0aWVzLnNpbmdsZVJvd1NlbGVjdGlvbk1vZGUgJiYgLy8gbGV0J3Mgb25seSBhdHRlbXB0IHRoaXMgd2hlbiBpbiB0aGlzIG1vZGVcbiAgICAgICAgICAgICFncmlkLnByb3BlcnRpZXMubXVsdGlwbGVTZWxlY3Rpb25zICYmIC8vIGFuZCBvbmx5IHdoZW4gaW4gc2luZ2xlIHNlbGVjdGlvbiBtb2RlXG4gICAgICAgICAgICByb3dzLmxlbmd0aCAmJiAvLyB1c2VyIGp1c3Qgc2VsZWN0ZWQgYSByb3cgKG11c3QgYmUgc2luZ2xlIHJvdyBkdWUgdG8gbW9kZSB3ZSdyZSBpbilcbiAgICAgICAgICAgIHNlbGVjdGlvbnMubGVuZ3RoICAvLyB0aGVyZSB3YXMgYSBjZWxsIHJlZ2lvbiBzZWxlY3RlZCAobXVzdCBiZSB0aGUgb25seSBvbmUpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdmFyIHJlY3QgPSBncmlkLnNlbGVjdGlvbk1vZGVsLmdldExhc3RTZWxlY3Rpb24oKSwgLy8gdGhlIG9ubHkgY2VsbCBzZWxlY3Rpb25cbiAgICAgICAgICAgICAgICB4ID0gcmVjdC5sZWZ0LFxuICAgICAgICAgICAgICAgIHkgPSByb3dzWzBdLCAvLyB3ZSBrbm93IHRoZXJlJ3Mgb25seSAxIHJvdyBzZWxlY3RlZFxuICAgICAgICAgICAgICAgIHdpZHRoID0gcmVjdC5yaWdodCAtIHgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gMCwgLy8gY29sbGFwc2UgdGhlIG5ldyByZWdpb24gdG8gb2NjdXB5IGEgc2luZ2xlIHJvd1xuICAgICAgICAgICAgICAgIGZpcmVTZWxlY3Rpb25DaGFuZ2VkRXZlbnQgPSBmYWxzZTtcblxuICAgICAgICAgICAgZ3JpZC5zZWxlY3Rpb25Nb2RlbC5zZWxlY3QoeCwgeSwgd2lkdGgsIGhlaWdodCwgZmlyZVNlbGVjdGlvbkNoYW5nZWRFdmVudCk7XG4gICAgICAgICAgICBncmlkLnJlcGFpbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb3dzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIHJvd3Mgc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvL3dlIGhhdmUgYSBmdW5jdGlvbiBjYWxsIHRvIGNyZWF0ZSB0aGUgc2VsZWN0aW9uIG1hdHJpeCBiZWNhdXNlXG4gICAgICAgIC8vd2UgZG9uJ3Qgd2FudCB0byBjcmVhdGUgYWxvdCBvZiBuZWVkbGVzcyBnYXJiYWdlIGlmIHRoZSB1c2VyXG4gICAgICAgIC8vaXMganVzdCBuYXZpZ2F0aW5nIGFyb3VuZFxuICAgICAgICBjb25zb2xlLmxvZyhncmlkLmdldFJvd1NlbGVjdGlvbk1hdHJpeCgpKTtcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZC5nZXRSb3dTZWxlY3Rpb24oKSk7XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1jb2x1bW4tc2VsZWN0aW9uLWNoYW5nZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChlLmRldGFpbC5jb2x1bW5zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIHJvd3Mgc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvL3dlIGhhdmUgYSBmdW5jdGlvbiBjYWxsIHRvIGNyZWF0ZSB0aGUgc2VsZWN0aW9uIG1hdHJpeCBiZWNhdXNlXG4gICAgICAgIC8vd2UgZG9uJ3Qgd2FudCB0byBjcmVhdGUgYWxvdCBvZiBuZWVkbGVzcyBnYXJiYWdlIGlmIHRoZSB1c2VyXG4gICAgICAgIC8vaXMganVzdCBuYXZpZ2F0aW5nIGFyb3VuZFxuICAgICAgICBjb25zb2xlLmxvZyhncmlkLmdldENvbHVtblNlbGVjdGlvbk1hdHJpeCgpKTtcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZC5nZXRDb2x1bW5TZWxlY3Rpb24oKSk7XG4gICAgfSk7XG5cbiAgICAvL3VuY29tbWVudCB0byBjYW5jZWwgZWRpdG9yIHBvcHBpbmcgdXA6XG4gICAgLy8gZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tcmVxdWVzdC1jZWxsLWVkaXQnLCBmdW5jdGlvbihlKSB7IGUucHJldmVudERlZmF1bHQoKTsgfSk7XG5cbiAgICAvL3VuY29tbWVudCB0byBjYW5jZWwgdXBkYXRpbmcgdGhlIG1vZGVsIHdpdGggdGhlIG5ldyBkYXRhOlxuICAgIC8vIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWJlZm9yZS1jZWxsLWVkaXQnLCBmdW5jdGlvbihlKSB7IGUucHJldmVudERlZmF1bHQoKTsgfSk7XG59O1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuICAgIHZhciBkZW1vID0gdGhpcyxcbiAgICAgICAgZ3JpZCA9IGRlbW8uZ3JpZDtcblxuICAgIHZhciBmb290SW5jaFBhdHRlcm4gPSAvXlxccyooKCgoXFxkKyknKT9cXHMqKChcXGQrKVwiKT8pfFxcZCspXFxzKiQvO1xuXG4gICAgdmFyIGZvb3RJbmNoTG9jYWxpemVyID0ge1xuICAgICAgICBmb3JtYXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHZhciBmZWV0ID0gTWF0aC5mbG9vcih2YWx1ZSAvIDEyKTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IChmZWV0ID8gZmVldCArICdcXCcnIDogJycpICsgJyAnICsgKHZhbHVlICUgMTIpICsgJ1wiJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBwYXJzZTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgICAgICB2YXIgaW5jaGVzLCBmZWV0LFxuICAgICAgICAgICAgICAgIHBhcnRzID0gc3RyLm1hdGNoKGZvb3RJbmNoUGF0dGVybik7XG4gICAgICAgICAgICBpZiAocGFydHMpIHtcbiAgICAgICAgICAgICAgICBmZWV0ID0gcGFydHNbNF07XG4gICAgICAgICAgICAgICAgaW5jaGVzID0gcGFydHNbNl07XG4gICAgICAgICAgICAgICAgaWYgKGZlZXQgPT09IHVuZGVmaW5lZCAmJiBpbmNoZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBpbmNoZXMgPSBOdW1iZXIocGFydHNbMV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZlZXQgPSBOdW1iZXIoZmVldCB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaW5jaGVzID0gTnVtYmVyKGluY2hlcyB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaW5jaGVzID0gMTIgKiBmZWV0ICsgaW5jaGVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5jaGVzID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbmNoZXM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKCdmb290JywgZm9vdEluY2hMb2NhbGl6ZXIpO1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKCdzaW5nZGF0ZScsIG5ldyBncmlkLmxvY2FsaXphdGlvbi5EYXRlRm9ybWF0dGVyKCd6aC1TRycpKTtcblxuICAgIGdyaWQubG9jYWxpemF0aW9uLmFkZCgncG91bmRzJywgbmV3IGdyaWQubG9jYWxpemF0aW9uLk51bWJlckZvcm1hdHRlcignZW4tVVMnLCB7XG4gICAgICAgIHN0eWxlOiAnY3VycmVuY3knLFxuICAgICAgICBjdXJyZW5jeTogJ1VTRCdcbiAgICB9KSk7XG5cbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoJ2ZyYW5jcycsIG5ldyBncmlkLmxvY2FsaXphdGlvbi5OdW1iZXJGb3JtYXR0ZXIoJ2ZyLUZSJywge1xuICAgICAgICBzdHlsZTogJ2N1cnJlbmN5JyxcbiAgICAgICAgY3VycmVuY3k6ICdFVVInXG4gICAgfSkpO1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKHtcbiAgICAgICAgbmFtZTogJ2hobW0nLCAvLyBhbHRlcm5hdGl2ZSB0byBoYXZpbmcgdG8gaGFtZSBsb2NhbGl6ZXIgaW4gYGdyaWQubG9jYWxpemF0aW9uLmFkZGBcblxuICAgICAgICAvLyByZXR1cm5zIGZvcm1hdHRlZCBzdHJpbmcgZnJvbSBudW1iZXJcbiAgICAgICAgZm9ybWF0OiBmdW5jdGlvbihtaW5zKSB7XG4gICAgICAgICAgICB2YXIgaGggPSBNYXRoLmZsb29yKG1pbnMgLyA2MCkgJSAxMiB8fCAxMiwgLy8gbW9kdWxvIDEyIGhycyB3aXRoIDAgYmVjb21pbmcgMTJcbiAgICAgICAgICAgICAgICBtbSA9IChtaW5zICUgNjAgKyAxMDAgKyAnJykuc3Vic3RyKDEsIDIpLFxuICAgICAgICAgICAgICAgIEFtUG0gPSBtaW5zIDwgZGVtby5OT09OID8gJ0FNJyA6ICdQTSc7XG4gICAgICAgICAgICByZXR1cm4gaGggKyAnOicgKyBtbSArICcgJyArIEFtUG07XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52YWxpZDogZnVuY3Rpb24oaGhtbSkge1xuICAgICAgICAgICAgcmV0dXJuICEvXigwP1sxLTldfDFbMC0yXSk6WzAtNV1cXGQkLy50ZXN0KGhobW0pOyAvLyAxMjo1OSBtYXhcbiAgICAgICAgfSxcblxuICAgICAgICAvLyByZXR1cm5zIG51bWJlciBmcm9tIGZvcm1hdHRlZCBzdHJpbmdcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKGhobW0pIHtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IGhobW0ubWF0Y2goL14oXFxkKyk6KFxcZHsyfSkkLyk7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyKHBhcnRzWzFdKSAqIDYwICsgTnVtYmVyKHBhcnRzWzJdKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGdyaWQ7XG5cbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgd2luZG93LmRlbW8gPSBuZXcgRGVtbztcbn07XG5cbnZhciBIeXBlcmdyaWQgPSBmaW4uSHlwZXJncmlkO1xuXG5mdW5jdGlvbiBEZW1vKCkge1xuICAgIHZhciB2ZXJzaW9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZlcnNpb24nKSxcbiAgICAgICAgdGl0bGVFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcigndGl0bGUnKTtcblxuICAgIHZlcnNpb24uaW5uZXJUZXh0ID0gSHlwZXJncmlkLnByb3RvdHlwZS52ZXJzaW9uO1xuICAgIHRpdGxlRWxlbWVudC5pbm5lclRleHQgPSB2ZXJzaW9uLnBhcmVudEVsZW1lbnQuaW5uZXJUZXh0O1xuXG4gICAgdmFyIGdyaWRPcHRpb25zID0ge1xuICAgICAgICAvLyBCZWNhdXNlIHYzIGRlZmF1bHRzIHRvIHVzZSBkYXRhc2F1ci1sb2NhbCAod2hpY2ggaXMgc3RpbGwgaW5jbHVkZWQgaW4gdGhlIGJ1aWxkKSxcbiAgICAgICAgLy8gc3BlY2lmeWluZyBpdCBoZXJlIGlzIHN0aWxsIG9wdGlvbmFsLCBidXQgbWF5IGJlIHJlcXVpcmVkIGZvciB2NC5cbiAgICAgICAgLy8gVW5jb21tZW50IG9uZSBvZiB0aGUgZm9sbG93aW5nIDIgbGluZXMgdG8gc3BlY2lmeSAoXCJicmluZyB5b3VyIG93blwiKSBkYXRhIHNvdXJjZTpcblxuICAgICAgICAvLyBkYXRhTW9kZWw6IG5ldyAoSHlwZXJncmlkLnJlcXVpcmUoJ2RhdGFzYXVyLWxvY2FsJykpKGRhdGEucGVvcGxlMSwgZ2V0U2NoZW1hKGRhdGEucGVvcGxlMSkpLFxuICAgICAgICAvLyBEYXRhTW9kZWw6IEh5cGVyZ3JpZC5yZXF1aXJlKCdkYXRhc2F1ci1sb2NhbCcpLFxuXG4gICAgICAgIGRhdGE6IHRoaXMuZGF0YS5wZW9wbGUxLFxuICAgICAgICBtYXJnaW46IHsgYm90dG9tOiAnMTdweCcsIHJpZ2h0OiAnMTdweCcgfSxcbiAgICAgICAgcGx1Z2luczogdGhpcy5wbHVnaW5zLFxuICAgICAgICAvLyBzY2hlbWE6IG15Q3VzdG9tU2NoZW1hLFxuICAgICAgICBzdGF0ZTogeyBjb2xvcjogJ29yYW5nZScgfVxuICAgIH07XG5cbiAgICB2YXIgZ3JpZCA9IG5ldyBIeXBlcmdyaWQoJ2RpdiNoeXBlcmdyaWQtZXhhbXBsZScsIGdyaWRPcHRpb25zKTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHdpbmRvdywge1xuICAgICAgICBncmlkOiB7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBncmlkOyB9IH0sXG4gICAgICAgIGc6IHsgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIGdyaWQ7IH0gfSxcbiAgICAgICAgYjogeyBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gZ3JpZC5iZWhhdmlvcjsgfSB9LFxuICAgICAgICBtOiB7IGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbDsgfSB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmdyaWQgPSBncmlkO1xuXG4gICAgY29uc29sZS5sb2coJ3NjaGVtYScsIGdyaWQuYmVoYXZpb3Iuc2NoZW1hKTtcblxuICAgIHRoaXMuaW5pdENlbGxSZW5kZXJlcnMoKTtcbiAgICB0aGlzLmluaXRGb3JtYXR0ZXJzKCk7XG4gICAgdGhpcy5pbml0Q2VsbEVkaXRvcnMoKTtcbiAgICB0aGlzLmluaXRFdmVudHMoKTtcbiAgICB0aGlzLmluaXREYXNoYm9hcmQoKTtcbiAgICB0aGlzLmluaXRTdGF0ZSgpO1xufVxuXG5EZW1vLnByb3RvdHlwZSA9IHtcbiAgICBkYXRhOiByZXF1aXJlKCcuLi9kZW1vL2RhdGEvd2lkZWRhdGEnKSxcbiAgICBpbml0Q2VsbFJlbmRlcmVyczogcmVxdWlyZSgnLi9jZWxscmVuZGVyZXJzJyksXG4gICAgaW5pdEZvcm1hdHRlcnM6IHJlcXVpcmUoJy4vZm9ybWF0dGVycycpLFxuICAgIGluaXRDZWxsRWRpdG9yczogcmVxdWlyZSgnLi9jZWxsZWRpdG9ycycpLFxuICAgIGluaXRFdmVudHM6IHJlcXVpcmUoJy4vZXZlbnRzJyksXG4gICAgaW5pdERhc2hib2FyZDogcmVxdWlyZSgnLi9kYXNoYm9hcmQnKSxcbiAgICBpbml0U3RhdGU6IHJlcXVpcmUoJy4vc2V0U3RhdGUnKSxcblxuICAgIHBsdWdpbnM6IHJlcXVpcmUoJ2Zpbi1oeXBlcmdyaWQtZXZlbnQtbG9nZ2VyJyksXG5cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZ3JpZC5yZXNldCgpO1xuICAgICAgICB0aGlzLmluaXRFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgc2V0RGF0YTogZnVuY3Rpb24oZGF0YSwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gIWRhdGEubGVuZ3RoID8gdW5kZWZpbmVkIDogb3B0aW9ucyB8fCB7XG4gICAgICAgICAgICBzY2hlbWE6IGdldFNjaGVtYShkYXRhKVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdyaWQuc2V0RGF0YShkYXRhLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlRW1wdHlEYXRhOiBmdW5jdGlvbiB0b2dnbGVFbXB0eURhdGEoKSB7XG4gICAgICAgIHZhciBiZWhhdmlvciA9IHRoaXMuZ3JpZC5iZWhhdmlvcjtcblxuICAgICAgICBpZiAoIXRoaXMub2xkRGF0YSkge1xuICAgICAgICAgICAgdGhpcy5vbGREYXRhID0ge1xuICAgICAgICAgICAgICAgIGRhdGE6IGJlaGF2aW9yLmRhdGFNb2RlbC5kYXRhLFxuICAgICAgICAgICAgICAgIHNjaGVtYTogYmVoYXZpb3Iuc2NoZW1hLFxuICAgICAgICAgICAgICAgIGFjdGl2ZUNvbHVtbnM6IGJlaGF2aW9yLmdldEFjdGl2ZUNvbHVtbnMoKS5tYXAoZnVuY3Rpb24oY29sdW1uKSB7IHJldHVybiBjb2x1bW4uaW5kZXg7IH0pXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy9pbXBvcnRhbnQgdG8gc2V0IHRvcCB0b3RhbHMgZmlyc3RcbiAgICAgICAgICAgIHNldERhdGEoW10pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9pbXBvcnRhbnQgdG8gc2V0IHRvcCB0b3RhbHMgZmlyc3RcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YSh0aGlzLm9sZERhdGEuZGF0YSwgdGhpcy5vbGREYXRhLnNjaGVtYSk7XG4gICAgICAgICAgICBiZWhhdmlvci5zZXRDb2x1bW5JbmRleGVzKHRoaXMub2xkRGF0YS5hY3RpdmVDb2x1bW5zKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9sZERhdGE7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXREYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXREYXRhKHRoaXMuZGF0YS5wZW9wbGUxKTtcbiAgICAgICAgdGhpcy5pbml0U3RhdGUoKTtcbiAgICB9LFxuXG4gICAgc2V0IHZlbnQoc3RhcnQpIHtcbiAgICAgICAgaWYgKHN0YXJ0KSB7XG4gICAgICAgICAgICB0aGlzLmdyaWQubG9nU3RhcnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZC5sb2dTdG9wKCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGRlbW8gPSB0aGlzLFxuICAgICAgICBncmlkID0gZGVtby5ncmlkLFxuICAgICAgICBzY2hlbWEgPSBncmlkLmJlaGF2aW9yLnNjaGVtYSxcbiAgICAgICAgZ3JlZW5sYW5kID0geyBjb2xvcjogJyMxMTY2MTEnLCBiYWNrZ3JvdW5kQ29sb3I6ICcjZThmZmU4JywgZm9udDogJ2l0YWxpYyBzbWFsbCBnYXJhbW9uZCcgfTtcblxuICAgIHZhciBzdGF0ZSA9IHtcbiAgICAgICAgY29sdW1uSW5kZXhlczogW1xuICAgICAgICAgICAgc2NoZW1hLmxhc3ROYW1lLmluZGV4LFxuICAgICAgICAgICAgc2NoZW1hLnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQuaW5kZXgsXG4gICAgICAgICAgICBzY2hlbWEuaGVpZ2h0LmluZGV4LFxuICAgICAgICAgICAgc2NoZW1hLmJpcnRoRGF0ZS5pbmRleCxcbiAgICAgICAgICAgIHNjaGVtYS5iaXJ0aFRpbWUuaW5kZXgsXG4gICAgICAgICAgICBzY2hlbWEuYmlydGhTdGF0ZS5pbmRleCxcbiAgICAgICAgICAgIC8vIHNjaGVtYS5yZXNpZGVuY2VTdGF0ZS5pbmRleCxcbiAgICAgICAgICAgIHNjaGVtYS5lbXBsb3llZC5pbmRleCxcbiAgICAgICAgICAgIC8vIHNjaGVtYS5maXJzdE5hbWUuaW5kZXgsXG4gICAgICAgICAgICBzY2hlbWEuaW5jb21lLmluZGV4LFxuICAgICAgICAgICAgc2NoZW1hLnRyYXZlbC5pbmRleCxcbiAgICAgICAgICAgIC8vIHNjaGVtYS5zcXVhcmVPZkluY29tZS5pbmRleFxuICAgICAgICBdLFxuXG4gICAgICAgIG5vRGF0YU1lc3NhZ2U6ICdObyBEYXRhIHRvIERpc3BsYXknLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd3aGl0ZScsXG4gICAgICAgIGZvbnQ6ICdub3JtYWwgc21hbGwgZ2FyYW1vbmQnLFxuICAgICAgICByb3dTdHJpcGVzOiBbXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICBncmVlbmxhbmQsXG4gICAgICAgICAgICBncmVlbmxhbmQsXG4gICAgICAgICAgICBncmVlbmxhbmRcbiAgICAgICAgXSxcblxuICAgICAgICBmaXhlZENvbHVtbkNvdW50OiAxLFxuICAgICAgICBmaXhlZFJvd0NvdW50OiA0LFxuXG4gICAgICAgIGNvbHVtbkF1dG9zaXppbmc6IGZhbHNlLFxuICAgICAgICBoZWFkZXJUZXh0V3JhcHBpbmc6IHRydWUsXG5cbiAgICAgICAgaGFsaWduOiAnbGVmdCcsXG4gICAgICAgIHJlbmRlckZhbHN5OiB0cnVlLFxuXG4gICAgICAgIHNjcm9sbGJhckhvdmVyT2ZmOiAndmlzaWJsZScsXG4gICAgICAgIHNjcm9sbGJhckhvdmVyT3ZlcjogJ3Zpc2libGUnLFxuICAgICAgICBjb2x1bW5IZWFkZXJCYWNrZ3JvdW5kQ29sb3I6ICdwaW5rJyxcblxuICAgICAgICBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zOiB0cnVlLFxuXG4gICAgICAgIGF1dG9TZWxlY3RSb3dzOiB0cnVlLFxuXG4gICAgICAgIGNhbGN1bGF0b3JzOiB7XG4gICAgICAgICAgICBBZGQxMDogYWRkMTAudG9TdHJpbmcoKVxuICAgICAgICB9LFxuXG4gICAgICAgIGNvbHVtbnM6IHtcbiAgICAgICAgICAgIGhlaWdodDoge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdmb290J1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG4gICAgICAgICAgICBsYXN0X25hbWU6IHtcbiAgICAgICAgICAgICAgICBjb2x1bW5IZWFkZXJCYWNrZ3JvdW5kQ29sb3I6ICcjMTQyQjZGJywgLy9kYXJrIGJsdWVcbiAgICAgICAgICAgICAgICBjb2x1bW5IZWFkZXJDb2xvcjogJ3doaXRlJyxcbiAgICAgICAgICAgICAgICBjb2x1bW5IZWFkZXJIYWxpZ246ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICByaWdodEljb246ICdkb3duLXJlY3RhbmdsZScsXG4gICAgICAgICAgICAgICAgbGluazogdHJ1ZVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZmlyc3RfbmFtZToge1xuXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB0b3RhbF9udW1iZXJfb2ZfcGV0c19vd25lZDoge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICBjYWxjdWxhdG9yOiAnQWRkMTAnLFxuICAgICAgICAgICAgICAgIGNvbG9yOiAnZ3JlZW4nXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBiaXJ0aERhdGU6IHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdzaW5nZGF0ZScsXG4gICAgICAgICAgICAgICAgcmlnaHRJY29uOiAnY2FsZW5kYXInLFxuICAgICAgICAgICAgICAgIC8vc3RyaWtlVGhyb3VnaDogdHJ1ZVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYmlydGhUaW1lOiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgICAgIGVkaXRvcjogJ3RpbWUnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ2hobW0nXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBiaXJ0aFN0YXRlOiB7XG4gICAgICAgICAgICAgICAgZWRpdG9yOiAnY29sb3J0ZXh0JyxcbiAgICAgICAgICAgICAgICByaWdodEljb246ICdkb3duLXJlY3RhbmdsZSdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlc2lkZW5jZVN0YXRlOiB7XG4gICAgICAgICAgICAgICAgcmlnaHRJY29uOiAnZG93bi1yZWN0YW5nbGUnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBlbXBsb3llZDoge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICByZW5kZXJlcjogJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnd2hpdGUnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBpbmNvbWU6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAncG91bmRzJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdHJhdmVsOiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ2ZyYW5jcydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKiBGb2xsb3dpbmcgYHJvd3NgIGFuZCBgY2VsbHNgIGV4YW1wbGVzIHNob3dzIGhvdyB0byBzZXQgcm93IGFuZCBjZWxsIHByb3BlcnRpZXMgZGVjbGFyYXRpdmVseSxcbiAgICAgICAgICogdXNlZnVsIGZvciBzdGF0aWMgZ3JpZHMgd2hlbiBjZWxsIGNvb3JkaW5hdGVzIGFyZSBrbm93biBhaGVhZCBvZiB0aW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiAoVGhlcmUgYXJlIGFzIHdlbGwgc2V2ZXJhbCBlcXVpdmFsZW50IHByb2dyYW1tYXRpYyBtZXRob2RzIGZvciBzZXR0aW5nIGNlbGxzIHByb3BzLCBzdWNoIGFzXG4gICAgICAgICAqIGBjZWxsLnNldFByb3BlcnR5YCxcbiAgICAgICAgICogYGNlbGwuc2V0UHJvcGVydGllc2AsXG4gICAgICAgICAqIGBiZWhhdmlvci5zZXRDZWxsUHJvcGVydHlgLFxuICAgICAgICAgKiBgYmVoYXZpb3Iuc2V0Q2VsbFByb3BlcnRpZXNgLFxuICAgICAgICAgKiBfZXRjLl8pXG4gICAgICAgICAqXG4gICAgICAgICAqIENhdmVhdDogRm9yIGR5bmFtaWMgZ3JpZCBkYXRhLCB3aGVuIGNlbGwgY29vcmRpbmF0ZXMgYXJlICpub3QqIGtub3duIGF0IHN0YXJ0IHVwICh3aGVuIHN0YXRlIGlzXG4gICAgICAgICAqIHVzdWFsbHkgYXBwbGllZCksIGxvYWRpbmcgcm93IGFuZCBjZWxsIHByb3BlcnRpZXMgX3dpdGggdGhlIGRhdGFfIChhcyBtZXRhZGF0YSkgaGFzIGFkdmFudGFnZXNcbiAgICAgICAgICogYW5kIGlzLCBwcmVmZXJyZWQgZXNwZWNpYWxseSBmb3IgZnJlcXVlbnRseSBjaGFuZ2luZyByb3dzIGFuZCBjZWxscy4gSW4gdGhpcyBwYXJhZGlnbSwgcm93IGFuZFxuICAgICAgICAgKiBjZWxsIHByb3BlcnRpZXMgYXJlIG9taXR0ZWQgaGVyZSBhbmQgdGhlIHN0YXRlIG9iamVjdCBvbmx5IGxvYWRzIGdyaWQgYW5kIGNvbHVtbiBwcm9wZXJ0aWVzLlxuICAgICAgICAgKiAoTWV0YWRhdGEgaXMgc3VwcG9ydGVkIGluIHRoZSBkYXRhIHNvdXJjZSB3aGVuIGl0IGltcGxlbWVudHMgYGdldFJvd01ldGFEYXRhYCBhbmQgYHNldFJvd01ldGFEYXRhYC4pXG4gICAgICAgICAqL1xuICAgICAgICByb3dzOiB7XG4gICAgICAgICAgICBoZWFkZXI6IHsgLy8gc3ViZ3JpZCBrZXlcbiAgICAgICAgICAgICAgICAwOiB7IC8vIHJvdyBpbmRleFxuICAgICAgICAgICAgICAgICAgICAvLyByb3cgcHJvcGVydGllc1xuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDQwIC8vIChoZWlnaHQgaXMgdGhlIG9ubHkgc3VwcG9ydGVkIHJvdyBwcm9wZXJ0eSBhdCB0aGUgY3VycmVudCB0aW1lKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2VsbHM6IHsgLy8gY2VsbCBwcm9wZXJ0aWVzXG4gICAgICAgICAgICBkYXRhOiB7IC8vIHN1YmdyaWQga2V5XG4gICAgICAgICAgICAgICAgMTY6IHsgLy8gcm93IGluZGV4XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogeyAvLyBjb2x1bW4gbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2VsbCBwcm9wZXJ0aWVzOlxuICAgICAgICAgICAgICAgICAgICAgICAgZm9udDogJzEwcHQgVGFob21hJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnbGlnaHRibHVlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBoYWxpZ246ICdsZWZ0J1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdyaWQuc2V0U3RhdGUoc3RhdGUpO1xuXG4gICAgZ3JpZC50YWtlRm9jdXMoKTtcblxuICAgIGRlbW8ucmVzZXREYXNoYm9hcmQoKTtcbn07XG5cbmZ1bmN0aW9uIGFkZDEwKGRhdGFSb3csIGNvbHVtbk5hbWUsIHN1YnJvdykge1xuICAgIHZhciB2YWwgPSBkYXRhUm93W2NvbHVtbk5hbWVdO1xuICAgIGlmICh2YWwuY29uc3RydWN0b3IgPT09IEFycmF5KSB7IHZhbCA9IHZhbFtzdWJyb3ddOyB9XG4gICAgcmV0dXJuIHZhbCArIDEwO1xufVxuIl19
