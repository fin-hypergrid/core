'use strict';

/**
 * @name logEvents
 * @summary Logs events.
 * @desc Adds new event listeners to log events.
 * Old event listeners are removed first, before adding new ones.
 * @param {function} logger - called with event string when event triggered
 * @param {string[]} [whitelist] - if given, only listed event types are logged
 * @param {string[]} [blacklist] - if given, listed event types are not logged
 */
module.exports = function(logger, whitelist, blacklist) {
    var listeners = this.logEventListeners = this.logEventListeners || {};
    var target = this.canvas;

    Object.keys(listeners).forEach(function(key) {
        target.removeEventListener(key, listeners[key]);
        delete listeners[key];
    });

    if (logger === null) {
        return;
    }

    logger = logger || console.log;

    // add listeners from dictionary included in whitelist and excluded from blacklist
    var eventTypes = this.eventTypes; // hash of event strings (keys irrelevent)
    Object.keys(eventTypes)
        .map(function(key) {
            return eventTypes[key];
        })
        .filter(function(key) {
            return !whitelist || whitelist.includes(key);
        })
        .filter(function(key) {
            return !blacklist || !blacklist.includes(key);
        })
        .forEach(function(eventType) {
            var listener = listeners[eventType] = function(e) {
                logger(e.type);
            };
            target.addEventListener(eventType, listener);
        });
};
