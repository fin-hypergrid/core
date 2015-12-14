/* eslint-env browser */

'use strict';

var Base = require('extend-me').Base;


var ANIMATION_TIME = 500;

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

        this.overlay.style.top = '0%';
        this.overlay.style.right = '0%';
        this.overlay.style.bottom = '0%';
        this.overlay.style.left = '0%';

        self.overlay.style.webkitTransition = '';

        this.overlay.style.marginTop = '15px';
        this.overlay.style.marginRight = '35px';
        this.overlay.style.marginBottom = '35px';
        this.overlay.style.marginLeft = '15px';
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
        this.overlay.style.backgroundColor = this.grid.resolveProperty('backgroundColor');

        var bounds = this.grid.div.getBoundingClientRect();

        self.overlay.style.webkitTransition = '';

        this.overlay.style.top = '0%';
        this.overlay.style.right = '0%';
        this.overlay.style.bottom = '0%';
        this.overlay.style.left = '0%';

        var t = rect.y + 'px';
        var r = (bounds.width - (rect.x + rect.width)) + 'px';
        var b = (bounds.height - (rect.y + rect.height)) + 'px';
        var l = rect.x + 'px';

        this.overlay.style.marginTop = t;
        this.overlay.style.marginRight = r;
        this.overlay.style.marginBottom = b;
        this.overlay.style.marginLeft = l;

        this.overlay.style.zIndex = 100;
        this.overlay.style.opacity = 1;

        this.closeTransition = function() {

            self.overlay.style.marginTop = t;
            self.overlay.style.marginRight = r;
            self.overlay.style.marginBottom = b;
            self.overlay.style.marginLeft = l;

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
                    self.overlay.style.webkitTransition = 'margin-top ' + ANIMATION_TIME + 'ms ease-in, margin-right ' + ANIMATION_TIME + 'ms ease-in, margin-bottom ' + ANIMATION_TIME + 'ms ease-in, margin-left ' + ANIMATION_TIME + 'ms ease-in';
                    self.overlay.style.marginTop = '15px';
                    self.overlay.style.marginRight = '35px';
                    self.overlay.style.marginBottom = '35px';
                    self.overlay.style.marginLeft = '15px';
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
        this.overlay.style.outline = 'none';
        this.overlay.style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
        this.overlay.style.position = 'absolute';

        this.overlay.style.marginTop = '0px';
        this.overlay.style.marginRight = '0px';
        this.overlay.style.marginBottom = '0px';
        this.overlay.style.marginLeft = '0px';
        this.overlay.style.overflow = 'hidden';

        //this.overlay.style.display = 'none';

        //this.overlay.style.webkitTransition = 'margin-top ' + ANIMATION_TIME + 'ms ease-in, margin-right ' + ANIMATION_TIME + 'ms ease-in, margin-bottom ' + ANIMATION_TIME + 'ms ease-in, margin-left ' + ANIMATION_TIME + 'ms ease-in';

        this.overlay.style.opacity = 0;
        this.overlay.style.zIndex = 10;
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
