/* eslint-env browser */

'use strict';

var Base = require('./Base');


var ANIMATION_TIME = 500,
    TRANSITION = ANIMATION_TIME + 'ms ease-in';

/** @constructor
 * @desc Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 * See {@link TableDialog#initialize|initialize} which is called by the constructor.
 */
var TableDialog = Base.extend('TableDialog', {

    initialize: function(grid) {
        this.grid = grid;
        this.initializeOverlaySurface();
        this.openNow = false;
    },

    /**
     * @memberOf Overlay.prototype
     * @desc returns true if the overlay is open
     * @returns {boolean}
     * @param {Hypergrid} grid
     */
    isOpen: function() {
        return this.openNow;
    },

    open: function() {
        if (this.isOpen()) {
            return;
        }

        this.openNow = true;
        var self = this;
        this.overlay.style.backgroundColor = this.grid.resolveProperty('backgroundColor');

        this.overlay.style.top = this.overlay.style.bottom = this.overlay.style.right = this.overlay.style.left = 0;

        self.overlay.style.webkitTransition = '';

        this.overlay.style.margin = '15px 35px 35px 15px';
        this.overlay.style.opacity = 0;
        this.overlay.style.zIndex = 100;

        this.closeTransition = function() {
            this.overlay.style.opacity = 0;
        };

        if (!this._closer) {
            this._closer = function(e) {
                var key = self.getCharFor(e.keyCode).toLowerCase();
                var keys = self.grid.resolveProperty('editorActivationKeys');
                if (keys.indexOf(key) > -1 || e.keyCode === 27) {
                    e.preventDefault();
                    self.close();
                }
            };
        }
        requestAnimationFrame(function() {
            self.overlay.style.webkitTransition = 'opacity ' + ANIMATION_TIME + 'ms ease-in';
            requestAnimationFrame(function() {
                document.addEventListener('keydown', self._closer, false);
                self.overlay.style.opacity = 0.95;
            });
        });

        setTimeout(function() {
            self.overlay.focus();
        }, 100);
    },
    /**
     * @memberOf Overlay.prototype
     * @desc open the overlay
     * #### returns: type
     * @param {Hypergrid} grid
     */
    openFrom: function(rect) {
        if (this.isOpen()) {
            return;
        }
        this.openNow = true;
        var self = this;
        var style = this.overlay.style;
        style.backgroundColor = this.grid.resolveProperty('backgroundColor');

        var bounds = this.grid.div.getBoundingClientRect(),
            margins = rect.y + 'px ' +
                (bounds.width - (rect.x + rect.width)) + 'px ' +
                (bounds.height - (rect.y + rect.height)) + 'px ' +
                rect.x + 'px';

        style.webkitTransition = '';

        style.top = style.right = style.bottom = style.left = 0;

        style.margin = margins;
        style.zIndex = 100;
        style.opacity = 1;

        this.closeTransition = function() {
            style.margin = margins;
        };

        if (!this._closer) {
            this._closer = function(e) {
                var key = self.getCharFor(e.keyCode).toLowerCase();
                var keys = self.grid.resolveProperty('editorActivationKeys');
                if (keys.indexOf(key) > -1 || e.keyCode === 27) {
                    e.preventDefault();
                    self.close();
                }
            };
        }

        //grid.setFocusable(false);
        requestAnimationFrame(function() {
            document.addEventListener('keydown', self._closer, false);
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    style.webkitTransition = 'margin-top ' + TRANSITION + ', margin-right ' + TRANSITION + ', margin-bottom ' + TRANSITION + ', margin-left ' + TRANSITION;
                    style.margin = '15px 35px 35px 15px';
                });
            });
        });
        setTimeout(function() {
            self.overlay.focus();
        }, 100);
    },

    /**
     * @memberOf Overlay.prototype
     * @desc close the overlay
     * @param {Hypergrid} grid
     */
    close: function() {
        //grid.setFocusable(true);
        this.openNow = false;
        document.removeEventListener('keydown', this._closer, false);

        var self = this;

        requestAnimationFrame(function() {
            self.closeTransition();
        });

        setTimeout(function() {
            self.clear();
            self.overlay.style.zIndex = -1000;
            if (self.onClose) {
                self.onClose();
                self.onClose = undefined;
            }
            self.grid.takeFocus();
        }, ANIMATION_TIME);
    },

    /**
     * @memberOf Overlay.prototype
     * @desc initialize the overlay surface into the grid
     * #### returns: type
     * @param {Hypergrid} grid
     */
    initializeOverlaySurface: function() {
        this.overlay = document.createElement('div');
        this.overlay.setAttribute('tabindex', 0);
        this.overlay.addEventListener('wheel', function(evt) { evt.stopPropagation(); });

        var style = this.overlay.style;
        style.outline = 'none';
        style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
        style.position = 'absolute';

        style.margin = 0;
        style.overflow = 'hidden';

        //style.display = 'none';

        //style.webkitTransition = 'margin-top ' + TRANSITION + ', margin-right ' + TRANSITION + ', margin-bottom ' + TRANSITION + ', margin-left ' + TRANSITION;

        style.opacity = 0;
        style.zIndex = 10;
        this.grid.div.appendChild(this.overlay);
        //document.body.appendChild(this.overlay);
    },

    /**
     * @memberOf Overlay.prototype
     * @desc get a human readable description of the key pressed from it's integer representation
     * @returns {string}
     * @param {Hypergrid} grid
     * @param {number} integer - the integer we want the char for
     */
    getCharFor: function(integer) {
        var charMap = this.grid.getCanvas().getCharMap();
        return charMap[integer][0];
    },

    clear: function() {
        this.overlay.innerHTML = '';
    },

    querySelector: function(selector) {
        var elements = this.overlay.querySelector(selector);
        return elements;
    },

    getAnimationTime: function() {
        return ANIMATION_TIME;
    }
});

module.exports = TableDialog;
