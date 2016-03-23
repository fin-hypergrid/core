/* eslint-env browser */

'use strict';

var automat = require('automat');

var Base = require('../lib/Base');
var markup = require('../html/templates.html');
var images = require('../../images');

/**
 * @constructor
 */
var Curtain = Base.extend('Curtain', {

    /**
     * @param {string|function|Node|Node[]} nodes
     * @param {CellEditor} [context] - Cell editor object possibly containing `stopEditing` and `beginSettings` methods for the close box and settings gear icons and `onclick` for custom handling.
     */
    initialize: function(nodes, context, clickHandler) {
        // create the backdrop; it is absolute-positioned and stretched
        this.el = automat.firstChild(markup.curtain);

        // add background image
        this.el.style.backgroundImage = 'url(\'' + images.wavey.src + '\')';

        // everything is behind the close box control
        var referenceElement = this.el.lastElementChild;

        if (typeof nodes === 'string' || typeof nodes === 'function') {
            var args = [referenceElement, this.el];
            args = args.concat(Array.prototype.slice.call(arguments));
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

    append: function(container) {
        var el = this.el;

        // insert the new curtain markup into the DOM
        (container || document.querySelector('body')).appendChild(el);

        // schedule it for a fade-in transition
        setTimeout(function() { el.classList.add('hypergrid-curtain-visible'); });

        // when transition ends, hide all the hypergrids behind it to prevent any key/mouse events from getting to them
        // todo: pause all hypergrids so they don't spin uselessly
        el.addEventListener('transitionend', function self(evt) {
            visAllHypergrids(false);
            el.removeEventListener('transitionend', self);
        });
    },

    remove: function() {
        var el = this.el;

        // unhide all the hypergrids behind the curtain
        visAllHypergrids(true);

        // start fade-out of curtain revealing grids behind it
        el.classList.remove('hypergrid-curtain-visible');

        // at end of fade out, remove curtain from the DOM
        el.addEventListener('transitionend', function self(evt) {
            el.remove();
            el.removeEventListener('transitionend', self);
        });
    }
});

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

var visibility = {
    true: 'visible',
    false: 'hidden'
};

function visAllHypergrids(visible) {
    forEachEl('canvas.hypergrid', function(canvas) {
        canvas.style.visibility = visibility[visible];
    });
}

module.exports = Curtain;
