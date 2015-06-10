'use strict';
/**
 *
 * @module features\overlay
 *
 */
(function() {

    var noop = function() {};

    var ANIMATION_TIME = 200;

    Polymer({ /* jshint ignore:line */

        /**
         * @property {boolean} openEditor - is the editor open
         * @instance
         */
        openEditor: false,

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleKeyUp: function(grid, event) {
            var key = event.detail.char.toLowerCase();
            var keys = grid.resolveProperty('editorActivationKeys');
            if (keys.indexOf(key) > -1) {
                this.toggleColumnPicker(grid);
            }
        },

        /**
        * @function
        * @instance
        * @description
        toggle the column picker on/off
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        toggleColumnPicker: function(grid) {
            if (this.isColumnPickerOpen(grid)) {
                this.closeColumnPicker(grid);
            } else {
                this.openColumnPicker(grid);
            }
        },

        /**
        * @function
        * @instance
        * @description
        returns true if the column picker is open
        * #### returns: boolean
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        isColumnPickerOpen: function(grid) {
            noop(grid);
            return this.overlay.style.display !== 'none';
        },

        /**
        * @function
        * @instance
        * @description
        open the column picker
        * #### returns: type
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        openColumnPicker: function(grid) {
            if (this.isColumnPickerOpen()) {
                return;
            }
            this.openEditor = true;
            if (grid.getBehavior().openEditor(this.overlay) === false) {
                return;
            }

            var self = this;
            this.overlay.style.backgroundColor = grid.resolveProperty('backgroundColor');

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
                    var key = self.getCharFor(grid, e.keyCode).toLowerCase();
                    var keys = grid.resolveProperty('editorActivationKeys');
                    if (keys.indexOf(key) > -1 || e.keyCode === 27) {
                        e.preventDefault();
                        self.closeColumnPicker(grid);
                    }
                };
            }

            grid.setFocusable(false);
            requestAnimationFrame(function() {
                self.overlay.style.opacity = 0.95;
                document.addEventListener('keydown', self._closer, false);
                self.overlay.focus();
            });
        },

        /**
        * @function
        * @instance
        * @description
        close the column picker
        * #### returns: type
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        closeColumnPicker: function(grid) {
            grid.setFocusable(true);

            if (!this.isColumnPickerOpen()) {
                return;
            }
            if (this.openEditor) {
                this.openEditor = false;
            } else {
                return;
            }
            if (grid.getBehavior().closeEditor(this.overlay) === false) {
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
                grid.takeFocus();
            }, ANIMATION_TIME);
        },

        /**
        * @function
        * @instance
        * @description
        initialize myself into the grid
        * #### returns: type
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        initializeOn: function(grid) {
            this.initializeOverlaySurface(grid);
            if (this.next) {
                this.next.initializeOn(grid);
            }
        },

        /**
        * @function
        * @instance
        * @description
        initialize the overlay surface into the grid
        * #### returns: type
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        initializeOverlaySurface: function(grid) {
            this.overlay = document.createElement('div');
            this.overlay.setAttribute('tabindex', 0);
            this.overlay.style.outline = 'none';
            this.overlay.style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
            this.overlay.style.position = 'absolute';
            this.overlay.style.display = 'none';
            this.overlay.style.transition = 'opacity ' + ANIMATION_TIME + 'ms ease-in';
            this.overlay.style.opacity = 0;
            grid.appendChild(this.overlay);
            //document.body.appendChild(this.overlay);
        },

        /**
        * @function
        * @instance
        * @description
        get a human readable description of the key pressed from it's integer representation
        * #### returns: string
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {integer} integer - the integer we want the char for
        */
        getCharFor: function(grid, integer) {
            var charMap = grid.getCanvas().getCharMap();
            return charMap[integer][0];
        }
    });

})(); /* jshint ignore:line */
