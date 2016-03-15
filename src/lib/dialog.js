/* eslint-env browser */

'use strict';

var automat = require('automat');

var Base = require('../lib/Base');
var markup = require('../html/templates.html');

/**
 * @constructor
 */
var Dialog = Base.extend('Dialog', {

    /**
     * @param {string|function|Node|Node[]} nodes
     */
    initialize: function(nodes) {
        // create the backdrop; it is absolute-positioned and stretched
        this.el = automat.firstChild(markup.dialog);

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
    },

    append: function(container) {
        (container || document.querySelector('body')).appendChild(this.el);
    }
});

module.exports = Dialog;
