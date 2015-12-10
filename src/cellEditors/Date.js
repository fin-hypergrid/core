/* eslint-env browser */

'use strict';

var Simple = require('./Simple');

var parseDate = function(input) {
  var parts = input.match(/(\d+)/g);
  // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
  return new window.Date(parts[0], parts[1] - 1, parts[2]); // months are 0-based
};

var leadingZeroIfNecessary = function(number) {
    return number < 10 ? '0' + number : number + '';
};
/**
 * @constructor
 */
var Date = Simple.extend('Date', {

    /**
     * my lookup alias
     * @type {string}
     * @memberOf Date.prototype
     */
    alias: 'date',

    template: function() {
        /*
            <input id="editor" type="date">
        */
    },

    setEditorValue: function(value) {
        if (value && value.constructor.name === 'Date') {
            value = value.getFullYear() + '-' + leadingZeroIfNecessary(value.getMonth() + 1) + '-' + leadingZeroIfNecessary(value.getDay());
        }
        this.getInput().value = value + '';
    },

    getEditorValue: function() {
        var value = this.getInput().value;
        value = parseDate(value);
        return value;
    },

});

module.exports = Date;
