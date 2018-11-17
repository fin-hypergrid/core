/* globals CustomEvent */

'use strict';

var details = [
    'gridCell',
    'dataCell',
    'mousePoint',
    'gridPoint',
    'clientPoint',
    'pagePoint',
    'keys',
    'row'
];

/**
 * @this {Hypergrid}
 * @param {string} eventName
 * @param {boolean} [cancelable=false] - Event implements `preventDefault()`. Must be boolean if given.
 * _If omitted, `event` and `primitiveEvent` are promoted to 2nd and 3rd argument positions, respecitvely._
 * @param {object} event
 * @param {CellEvent|MouseEvent|KeyboardEvent|object} [primitiveEvent]
 * @returns {undefined|boolean}
 */
module.exports = function(eventName, cancelable, event, primitiveEvent) {
    var detail;

    if (!this.canvas) {
        return;
    }

    if (typeof cancelable !== 'boolean') {
        primitiveEvent = event; // propmote primitiveEvent to 3rd position
        event = cancelable; // promote event to 2nd position
        cancelable = false; // default when omitted
    }

    if (!event) {
        event = {};
    } else if (event instanceof CustomEvent) {
        event = Object({}, event);
    }

    if (!event.type) {
        event.type = eventName;
    }

    if (!event.detail) {
        event = { detail: event };
    }

    detail = event.detail;

    if (!detail.grid) { // CellEvent objects already have a (read-only) `grid` prop
        detail.grid = this;
    }

    detail.time = Date.now();

    if (primitiveEvent) {
        if (!detail.primitiveEvent) {
            detail.primitiveEvent = primitiveEvent;
        }
        details.forEach(function(key) {
            if (key in primitiveEvent && !(key in detail)) {
                detail[key] = primitiveEvent[key];
            }
        });
        if ('dataRow' in primitiveEvent) {
            // reference (without invoking) cellEvent's `dataRow` getter when available
            Object.defineProperty(detail, 'row', { get: function() { return primitiveEvent.dataRow; } });
        }
    }

    event.cancelable = cancelable;

    return this.canvas.dispatchEvent(new CustomEvent(eventName, event));
};
