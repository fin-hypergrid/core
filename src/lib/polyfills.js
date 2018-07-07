'use strict';


/* IMPORTANT NOTE:
 * If any of the modules listed below is removed from Hypergrid, the polyfill(s) they define must be added here!!!
 *
 * 1. object-iterators defines Array.prototype.find
 */


/* eslint-disable no-extend-native */

// https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Math/sign#Polyfill
// (Safari now supports Math.sign but IE still does not as of v11.)
Math.sign = Math.sign = function(x) {
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
        return x;
    }
    return x > 0 ? 1 : -1;
};

// Lite version of: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex#Polyfill
if (typeof Array.prototype.findIndex !== 'function') {
    Array.prototype.findIndex = function(predicate) {
        var context = arguments[1];
        for (var i = 0, len = this.length; i < len; i++) {
            if (predicate.call(context, this[i], i, this)) {
                return i;
            }
        }
        return -1;
    };
}

// Simpler version of: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/fill#Polyfill
if (typeof Array.prototype.fill !== 'function') {
    Array.prototype.fill = function(value, start, end) {
        start = start === undefined ? 0 : start < 0 ? this.length + start : start;
        end = end === undefined ? this.length : end < 0 ? this.length + end : end;
        for (var i = start || 0; i < end; ++i) {
            this[i] = value;
        }
        return this;
    };
}

// Lite version of: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source != null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        target[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return target;
    };
}

if (typeof Object.getOwnPropertyDescriptors !== 'function') {
    Object.getOwnPropertyDescriptors = function(object) {
        return Object.getOwnPropertyNames(object).reduce(function(descriptors, key) {
            descriptors[key] = Object.getOwnPropertyDescriptor(object, key);
            return descriptors;
        }, {});
    };
}
