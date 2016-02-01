'use strict';

function nn(number) {
    return (number < 10 ? '-0' : '-') + number;
}

module.exports = {
    date: function(value) {
        return value instanceof Date
            ? value.getFullYear() + nn(value.getMonth() + 1) + nn(value.getDate())
            : value + '';
    },
    default: function(value) {
        return value + '';
    }
};
