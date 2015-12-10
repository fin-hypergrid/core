/* eslint-env browser */

'use strict';

var Base = require('extend-me').Base;


var ANIMATION_TIME = 200;

/** @constructor
 * @desc Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 * See {@link TableDialog#initialize|initialize} which is called by the constructor.
 */
var TableDialog = Base.extend('TableDialog', {

    initialize: function(grid) {
        this.grid = grid;
        this.initializeOverlaySurface();
    },

    /**
     * @memberOf Overlay.prototype
     * @desc returns true if the overlay is open
     * @returns {boolean}
     * @param {Hypergrid} grid
     */
    isOpen: function() {
        return this.overlay.style.display !== 'none';
    },

    /**
     * @memberOf Overlay.prototype
     * @desc open the overlay
     * #### returns: type
     * @param {Hypergrid} grid
     */
    open: function() {
        if (this.isOpen()) {
            return;
        }

        var self = this;
        this.overlay.style.backgroundColor = this.grid.resolveProperty('backgroundColor');

        this.overlay.style.top = '0%';
        this.overlay.style.right = '0%';
        this.overlay.style.bottom = '0%';
        this.overlay.style.left = '0%';

        this.overlay.style.marginTop = '15px';
        this.overlay.style.marginRight = '35px';
        this.overlay.style.marginBottom = '35px';
        this.overlay.style.marginLeft = '15px';

        self.overlay.style.display = '';


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
            self.overlay.style.opacity = 0.95;
            document.addEventListener('keydown', self._closer, false);
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

        if (!this.isOpen()) {
            return;
        }

        document.removeEventListener('keydown', this._closer, false);

        var self = this;

        requestAnimationFrame(function() {
            self.overlay.style.opacity = 0;
        });

        setTimeout(function() {
            self.overlay.innerHTML = '';
            self.overlay.style.display = 'none';
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
        this.overlay.style.display = 'none';
        this.overlay.style.transition = 'opacity ' + ANIMATION_TIME + 'ms ease-in';
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
    }
});

module.exports = TableDialog;
