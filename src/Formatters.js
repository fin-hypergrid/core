'use strict';

var leadingZeroIfNecessary = function(number) {
    return number < 10 ? '0' + number : number + '';
};

module.exports = {
    date: function(value) {
        var dateString = value.getFullYear() + '-' + leadingZeroIfNecessary(value.getMonth() + 1) + '-' + leadingZeroIfNecessary(value.getDay());
        return dateString;
    },
    default: function(value) {
        return value + '';
    }
};
