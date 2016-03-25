/* eslint-env browser */

'use strict';

var automat = require('automat');

var Base = require('../lib/Base');
var markup = require('../html/markup.html');
var images = require('../../images');

/**
 * @constructor
 */
var Curtain = Base.extend('Curtain', {

    /**
     * @param {CellEditor} [context] - Cell editor object possibly containing `stopEditing` and `beginSettings` methods for the close box and settings gear icons and `onclick` for custom handling.
     * @param {string|function|Node|Node[]} nodes
     * @param {...*} [replacements] - Replacement values for numbered format patterns.
     */
    initialize: function(context, nodes, replacements/*...*/) {
        var contextOmitted = typeof context !== 'object' || context instanceof Node;

        if (contextOmitted) {
            nodes = context;
            context = null;
        }

        // create the backdrop; it is absolute-positioned and stretched
        this.el = automat.firstChild(markup.curtain);

        // add background image
        this.el.style.backgroundImage = 'url(\'' + images.wavey.src + '\')';

        // everything is behind the close box control
        var referenceElement = this.el.lastElementChild;

        if (typeof nodes === 'string' || typeof nodes === 'function') {
            replacements = Array.prototype.slice.call(arguments, contextOmitted ? 1 : 2);
            var args = [nodes, this.el, referenceElement].concat(replacements);
            automat.append.apply(null, args);
        } else if (nodes instanceof Node) {
            this.el.insertBefore(nodes, referenceElement);
        } else if (nodes.length && nodes[0] instanceof Node) {
            for (var i = 0; i < nodes.length; ++i) {
                this.el.insertBefore(nodes[i], referenceElement);
            }
        } else {
            throw new this.HypergridError('Unexpected dialog content.');
        }

        this.el.addEventListener('click', onclick.bind(context));
    },

    /**
     *
     * @param {HTMLElement} [container]  - If undefined, curtain is appended to body.
     *
     * If defined, curtain is appended to container. When container is not body, it will be:
     * # made visible before append (it should initially be hidden)
     * # made hidden after remove
     */
    append: function(container) {
        var el = this.el;

        container = container || document.querySelector('body');

        if (container.tagName !== 'BODY') {
            container.style.visibility = 'visible';
        }

        // insert the new curtain markup into the DOM
        container.appendChild(el);

        // schedule it for a fade-in transition
        setTimeout(function() { el.classList.add('hypergrid-curtain-visible'); });

        // when transition ends, hide all the hypergrids behind it to prevent any key/mouse events from getting to them
        // todo: pause all hypergrids so they don't spin uselessly
        el.addEventListener('transitionend', this.hideStageBound = hideStage.bind(this));
    },

    remove: function() {
        var el = this.el;

        // unhide all the hypergrids behind the curtain
        this.stageVisible('visible');

        // start fade-out of curtain revealing grids behind it
        el.classList.remove('hypergrid-curtain-visible');

        // at end of fade out, remove curtain from the DOM
        el.addEventListener('transitionend', this.removeCurtainBound = removeCurtain.bind(this));
    },

    stageSelector: 'canvas.hypergrid',
    stageVisible: function(visibility) {
        forEachEl(this.stageSelector, function(el) {
            el.style.visibility = visibility;
        });
    }
});

function removeCurtain(evt) {
    var el = this.el,
        container = el.parentElement;

    if (container.tagName !== 'BODY') {
        container.style.visibility = 'hidden';
    }
    el.remove();
    el.removeEventListener('transitionend', this.removeCurtainBound);
}

function hideStage(evt) {
    this.stageVisible('hidden');
    this.el.removeEventListener('transitionend', this.hideStageBound);
}

function onclick(evt) {
    if (this) {
        if (evt.target.classList.contains('hypergrid-curtain-close')) {
            evt.preventDefault(); // ignore href
            if (this.stopEditing) { this.stopEditing(); }

        } else if (evt.target.classList.contains('hypergrid-curtain-settings')) {
            evt.preventDefault(); // ignore href
            if (this.beginSettings) { this.beginSettings(); }

        } else if (this.onclick) {
            var handled = !this.onclick.call(this, evt);
            if (handled && evt.target.tagName === 'A') {
                evt.preventDefault(); // ignore href of handled event
            }
        }
    }

    evt.stopPropagation(); // the click stops here, handled or not
}


function forEachEl(selector, iteratee, context) {
    return Array.prototype.forEach.call((context || document).querySelectorAll(selector), iteratee);
}

module.exports = Curtain;
