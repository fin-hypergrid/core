/* eslint-env browser */

/** @module effects */

/** @typedef {function} effectFunction
 * @desc Element to perform transitions upon is `options.el` if defined or `this.el`.
 * @param {object} [options]
 * @param {HTMLElement} [options.el=this.el]
 * @param {function} [options.callback] Function to call at conclusion of transitions.
 * @param {string} [options.duration='0.065s'] - Duration of each transition.
 * @param {object} [options.styles=defaultGlowerStyles] - Hash of CSS styles and values to transition. (For {@link effects~glower|glower} only.
 */

'use strict';

/**
 * Shake element back and fourth a few times as if to say, "Nope!"
 * @type {effectFunction}
 * @memberOf module:effects
 */
exports.shaker = function(options) {
    options = options || {};
    var context = this,
        el = options.el || context.el,
        duration = options.duration || '0.065s',
        computedStyle = window.getComputedStyle(el),
        transitions = computedStyle.transition.split(','),
        position = computedStyle.position,
        x = parseInt(computedStyle.left),
        dx = -3,
        shakes = 6;

    transitions.push('left ' + duration);
    el.style.transition = transitions.join(',');
    el.addEventListener('transitionend', shaker);
    shaker();
    function shaker(event) {
        if (!event || event.propertyName === 'left') {
            el.style.left = x + dx + 'px';
            if (!shakes--) {
                el.removeEventListener('transitionend', shaker);
                transitions.pop();
                el.style.transition = transitions.join(',');
                el.style.position = position;
                if (options.callback) {
                    options.callback.call(context, options);
                }
            }
            dx = shakes ? -dx : 0;
        }
    }
};

var defaultGlowerStyles = {
    'background-color': 'yellow',
    'box-shadow': '0 0 10px red'
};

/**
 * Transition styles on element for a moment and revert as if to say, "Whoa!."
 * @type {effectFunction}
 * @memberOf module:effects
 */
exports.glower = function(options) {
    options = options || {};
    var context = this,
        el = options.el || context.el,
        duration = options.duration || '0.25s',
        styles = options.styles || defaultGlowerStyles,
        values = styles.length,
        computedStyle = window.getComputedStyle(el),
        styleWas = {},
        transition = computedStyle.transition,
        transitions = transition.split(',');

    Object.keys(styles).forEach(function(style) {
        styleWas[style] = {
            style: computedStyle[style],
            undo: true
        };
        transitions.push(style + ' ' + duration);
    });

    el.style.transition = transitions.join(',');
    el.addEventListener('transitionend', glower);
    Object.keys(styles).forEach(function(style) {
        el.style[style] = styles[style];
    });

    function glower(event) {
        var was = styleWas[event.propertyName];
        if (was.undo) {
            el.style[event.propertyName] = was.style;
            was.undo = false;
        } else if (!--values) {
            el.removeEventListener('transitionend', glower);
            el.style.transition = transition;
            if (options.callback) {
                options.callback.call(context, options);
            }
        }
    }
};
