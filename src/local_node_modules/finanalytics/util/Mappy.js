'use strict';

function Mappy() {
    this.keys = [];
    this.data = {};
    this.values = [];
}

Mappy.prototype = {

    constructor: Mappy.prototype.constructor, // preserve constructor

    set: function(key, value) {
        var hashCode = hash(key);
        if (!(hashCode in this.data)) {
            this.keys.push(key);
            this.values.push(value);
        }
        this.data[hashCode] = value;
    },

    get: function(key) {
        var hashCode = hash(key);
        return this.data[hashCode];
    },

    getIfAbsent: function(key, ifAbsentFunc) {
        var value = this.get(key);
        if (value === undefined) {
            value = ifAbsentFunc(key, this);
        }
        return value;
    },

    size: function() {
        return this.keys.length;
    },

    clear: function() {
        this.keys.length = 0;
        // TODO: Is there a reason why this.values is not being truncated here as well?
        this.data = {};
    },

    delete: function(key) {
        var hashCode = hash(key);
        if (this.data[hashCode] !== undefined) {
            var index = betterIndexOf(this.keys, key);
            this.keys.splice(index, 1);
            this.values.splice(index, 1);
            delete this.data[hashCode];
        }
    },

    forEach: function(func) {
        var keys = this.keys,
            self = this;
        keys.forEach(function(key) {
            var value = self.get(key);
            func(value, key, self);
        });
    },

    map: function(func) {
        var keys = this.keys,
            newMap = new Mappy(),
            self = this;
        keys.forEach(function(key) {
            var value = self.get(key),
                transformed = func(value, key, self);
            newMap.set(key, transformed);
        });
        return newMap;
    },

    copy: function() {
        var keys = this.keys,
            newMap = new Mappy(),
            self = this;
        keys.forEach(function(key) {
            var value = self.get(key);
            newMap.set(key, value);
        });
        return newMap;
    }

};

var OID_PREFIX = '.~.#%_'; //this should be something we never will see at the beginning of a string
var counter = 0;

function hash(key) {
    var typeOf = typeof key;

    switch (typeOf) {
        case 'number':
        case 'string':
        case 'boolean':
        case 'symbol':
            return OID_PREFIX + typeOf + '_' + key;

        case 'undefined':
            return OID_PREFIX + 'undefined';

        case 'object':
            // TODO: what about handling null (special case of object)?
        case 'function':
            return (key.___finhash = key.___finhash || OID_PREFIX + counter++); // eslint-disable-line
    }
}

// Object.is polyfill, courtesy of @WebReflection
var is = Object.is || function(a, b) {
    return a === b ? a !== 0 || 1 / a == 1 / b : a != a && b != b; // eslint-disable-line
};

// More reliable indexOf, courtesy of @WebReflection
function betterIndexOf(arr, value) {
    if (value != value || value === 0) { // eslint-disable-line
        for (var i = arr.length; i-- && !is(arr[i], value);) { // eslint-disable-line
        }
    } else {
        i = [].indexOf.call(arr, value);
    }
    return i;
}

module.exports = Mappy;