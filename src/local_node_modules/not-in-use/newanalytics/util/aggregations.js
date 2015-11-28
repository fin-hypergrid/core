'use strict';

function count(group) {
    return group.getRowCount();
}

function sum(columnIndex, group) {
    var r = group.getRowCount(),
        n = 0;

    while (r--) {
        n += group.getValue(columnIndex, r);
    }

    return n;
}

function minmax(columnIndex, method, n, group) {
    var r = group.getRowCount();

    while (r--) {
        n = method(n, group.getValue(columnIndex, r));
    }

    return n;
}

function avg(columnIndex, group) {
    return sum(columnIndex, group) / group.getRowCount();
}

function first(columnIndex, group) {
    return group.getValue(columnIndex, 0);
}

function last(columnIndex, group) {
    return group.getValue(columnIndex, group.getRowCount() - 1);
}

function stddev(columnIndex, group) {
    var rows = group.getRowCount(),
        mean = avg(columnIndex, group);

    for (var dev, r = rows, variance = 0; r--; variance += dev * dev) {
        dev = group.getValue(columnIndex, r) - mean;
    }

    return Math.sqrt(variance / rows);
}

module.exports = {
    count: function(columnIndex) {
        return count;
    },
    sum: function(columnIndex) {
        return sum.bind(this, columnIndex);
    },
    min: function(columnIndex) {
        return minmax.bind(this, columnIndex, Math.min, Infinity);
    },
    max: function(columnIndex) {
        return minmax.bind(this, columnIndex, Math.max, -Infinity);
    },
    avg: function(columnIndex) {
        return avg.bind(this, columnIndex);
    },
    first: function(columnIndex) {
        return first.bind(this, columnIndex);
    },
    last: function(columnIndex) {
        return last.bind(this, columnIndex);
    },
    stddev: function(columnIndex) {
        return stddev.bind(this, columnIndex);
    }
};