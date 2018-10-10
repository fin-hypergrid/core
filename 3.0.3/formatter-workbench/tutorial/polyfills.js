'use strict';

(function() {
    // IE 11 missing .find
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
    if (!Array.prototype.find) {
        Array.prototype.find = function (predicate) { // eslint-disable-line no-extend-native
            if (this === null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }

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

    // IE 11 missing CustomEvent constructor
    if ( typeof window.CustomEvent !== "function" ) {
        window.CustomEvent = function(event, params) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        };
        window.CustomEvent.prototype = window.Event.prototype;
    }

    // IE 11 does not support 2nd param `force` of `classList.toggle`
    if (window.DOMTokenList.prototype.toggle.toString().indexOf('key') < 0) {
        window.DOMTokenList.prototype.toggle = function(key, force) {
            if (arguments.length < 2) {
                toggle.call(this, key);
            } else switch (force) {
                case true:
                    this.add(key);
                    break;
                case false:
                    this.remove(key);
                    break;
            }
        };
    }
})();