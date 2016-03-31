'use strict';

// todo: publish this to npm!
// called it "queueless" because it does not attempt to implement a full-blown transitions queue. These few lines give you the info you need most often: Is the transition still going? When does it end? Do this when it ends, please....

/**
 * Sets up an event listener to wait for the end of the transition and then executes the given code.
 *
 * Even without a call back, this is useful because it also maintains a unique flag (derived from `name`). Check this flag by giving `null` as 3rd parameter to ignore user interactions that would otherwise start a new transition.
 *
 * @param {HTMLElement} element
 *
 * @param {string} name
 *
 * @param {null|function|object} [callback] - One of the following modes:
 * * If omitted, simply returns state of the transition (`true` means active; `false` means inactive). (This is a utility call; it does not set up the event listener.)
 * * If an object, resets the state flag and returns a new function, itself but bound to this object as context, and `element` and `name` as first two parameters. For this mode only, the context is this 3rd parameter; for all other modes, the context is `this`. (This is a utility call; it does not set up the event listener.)
 * * If a function: Sets up the event listener; when it fires the callback is called in context.
 * * Otherwise (e.g., `null`): Sets up the event listener merely to track the transition's state (i.e., there will be no callback).
 *
 * @returns {boolean|function} Returns a boolean or a function, respectively, for the first two options listed above for the `callback` paremeter.
 */
function onTransitionEnd(element, name, callback) {
    var context = this,
        mode = typeof callback,
        flagName = name + 'Transitioning';

    switch (mode) {
        case 'undefined':
            return context[flagName];
        case 'object':
            if (callback !== null) { // oh my, `null` is lexically an object
                context = callback;
                context[flagName] = false;
                return onTransitionEnd.bind(context, element, name);
            }
        default: // eslint-disable-line no-fallthrough
            context[flagName] = true;

            element.addEventListener('transitionend', function done() {
                element.removeEventListener('transitionend', done);
                if (mode === 'function') {
                    callback.call(context, element);
                }
                context[flagName] = false;
            });
    }
}

module.exports = onTransitionEnd;
