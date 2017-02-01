/* eslint-env browser */

'use strict';

var automat = require('automat');
var markup = require('../html');

var Base = window.fin.Hypergrid.Base; // try require('fin-hypergrid/src/Base') when externalized

/**
 * Creates and services a DOM element used as a cntainer for a dialog. The standard `markup.dialog` is simply a div with a _control panel_ containing a close box and a settings gear icon.
 *
 * You can supply an alternative dialog template. The interface is:
 * * Class name `hypergrid-dialog`.
 * * At least one child element. Content will be inserted before this first child.
 * * Typically contains a close-box element with class name `hypergrid-dialog-close` and possibly other controls with class name `hypergrid-dialog-xxxx` (where _xxxx_ is a unique name for your control).
 *
 * @constructor
 */
var Dialog = Base.extend('Dialog', {

    /**
     * Creates a basic dialog box in `this.el`.
     * @param {Hypergrid} grid
     * @param {object} [options]
     * @param {string|function} [options.dialogTemplate] - An alternate dialog template. The last child element must be the "control panel."
     * @param {boolean} [options.settings=true] - Control box has settings icon. (Settings icon must be included in template. This option removes it. That is, if explicitly `false` _and_ there is a settings control, remove it.)
     * @param {string|boolean} [options.backgroundImage=images.dialog.src] - A URI for a background image. If explicitly `false`, background image is suppressed.
     * @param {function} [terminate]
     */
    initialize: function(grid, options) {
        options = options || {};

        this.grid = grid;

        // create the backdrop; it is absolute-positioned and stretched
        this.el = automat.firstChild(options.dialogTemplate || markup.dialog, options.dialogReplacements);

        this.originalFirstChild = this.el.firstElementChild;

        if (options.settings === false) {
            var settings = this.el.querySelector('.hypergrid-dialog-settings');
            if (settings) {
                settings.remove();
            }
        }

        // set alternative background image
        if (options.backgroundImage === false) {
            this.el.style.backgroundImage = null;
        } else if (options.backgroundImage) {
            this.el.style.backgroundImage = 'url(\'' + options.backgroundImage + '\')';
        }

        // listen for clicks
        this.el.addEventListener('click', onClick.bind(this));

        if (options.terminate) {
            this.terminate = options.terminate;
        }
    },

    /**
     * @summary Adds DOM `Node`s to dialog.
     * @desc Input can be nodes or a template from which to create nodes. The nodes are inserted into the dialog's DOM (`this.el`), right before the "control panel."
     * @param {string|function|Node|Node[]} nodes - See `automat`.
     * @param {...*} [replacements] - See `automat`.
     */
    append: function(nodes, replacements/*...*/) {
        if (typeof nodes === 'string' || typeof nodes === 'function') {
            var args = Array.prototype.slice.call(arguments);
            args.splice(1, 0, this.el, this.originalFirstChild);
            automat.append.apply(null, args);

        } else if ('length' in nodes) {
            for (var i = 0; i < nodes.length; ++i) {
                this.el.insertBefore(nodes[i], this.originalFirstChild);
            }

        } else {
            this.el.insertBefore(nodes, this.originalFirstChild);
        }
    },

    /**
     * Insert dialog into DOM.
     *
     * @param {HTMLElement} [container] - If undefined, dialog is appended to body.
     *
     * If defined, dialog is appended to container. When container is not body, it will be:
     * 0. made visible before append (it should initially be hidden)
     * 0. made hidden after remove
     */
    open: function(container) {
        var error;

        if (!(this.opened || this.opening || this.closed || this.closing)) {
            error = this.onOpen();

            if (!error) {
                var el = this.el;

                this.opening = true;

                container = container || document.querySelector('body');

                if (container.tagName !== 'BODY') {
                    container.style.visibility = 'visible';
                }

                // insert the new dialog markup into the DOM
                container.appendChild(el);

                // schedule it for a show transition
                setTimeout(function() { el.classList.add('hypergrid-dialog-visible'); }, 50);

                // at end of show transition, hide all the hypergrids behind it to prevent any key/mouse events from getting to them
                // todo: pause all hypergrids so they don't spin uselessly
                el.addEventListener('transitionend', this.hideAppBound = hideApp.bind(this));
            }
        }

        return error;
    },

    /**
     * Remove dialog from DOM.
     */
    close: function() {
        var error;

        if (this.opened && !(this.closed || this.closing)) {
            error = this.onClose();

            if (!error) {
                this.closing = true;

                // unhide all the hypergrids behind the dialog
                this.appVisible('visible');

                // start a hide transition of dialog revealing grids behind it
                this.el.classList.remove('hypergrid-dialog-visible');

                // at end of hide transition, remove dialog from the DOM
                this.el.addEventListener('transitionend', this.removeDialogBound = removeDialog.bind(this));
            }
        }

        return error;
    },

    appSelector: 'canvas.hypergrid',
    appVisible: function(visibility) {
        Array.prototype.forEach.call(document.querySelectorAll(this.appSelector), function(el) {
            el.style.visibility = visibility;
        });
    },

    onOpen: nullPattern,
    onOpened: nullPattern,
    onClose: nullPattern,
    onClosed: nullPattern,
    terminate: nullPattern
});

function nullPattern() {}

function removeDialog(evt) {
    if (evt.target === this.el && evt.propertyName === 'opacity') {
        this.el.removeEventListener('transitionend', this.removeDialogBound);

        if (this.el.parentElement.tagName !== 'BODY') {
            this.el.parentElement.style.visibility = 'hidden';
        }
        this.el.remove();
        delete this.el;

        this.onClosed();
        this.terminate();
        this.closing = false;
        this.closed = true;
    }
}

function hideApp(evt) {
    if (evt.target === this.el && evt.propertyName === 'opacity') {
        this.el.removeEventListener('transitionend', this.hideAppBound);

        this.appVisible('hidden');
        this.onOpened();
        this.opening = false;
        this.opened = true;
    }
}

function onClick(evt) {
    if (this) {
        if (evt.target.classList.contains('hypergrid-dialog-close')) {
            evt.preventDefault(); // ignore href
            this.close();

        } else if (evt.target.classList.contains('hypergrid-dialog-settings')) {
            evt.preventDefault(); // ignore href
            if (this.settings) { this.settings(); }

        } else if (this.onClick && !this.onClick.call(this, evt) && evt.target.tagName === 'A') {
            evt.preventDefault(); // ignore href of handled event
        }
    }

    evt.stopPropagation(); // the click stops here, handled or not
}

module.exports = Dialog;
