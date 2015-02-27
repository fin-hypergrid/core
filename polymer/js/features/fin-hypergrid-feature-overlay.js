(function() {

    'use strict';

    var noop = function() {};

    var ANIMATION_TIME = 200;
    var ACTIVATION = {
        ALT: 'blah',
        ESC: 'blah'
    };
    Polymer({ /* jshint ignore:line */
        handleKeyUp: function(grid, event) {
            var key = event.detail.char;
            if (ACTIVATION[key]) {
                this.toggleColumnPicker(grid);
            }
        },
        toggleColumnPicker: function(grid) {
            if (this.isColumnPickerOpen(grid)) {
                this.closeColumnPicker(grid);
            } else {
                this.openColumnPicker(grid);
            }
        },
        isColumnPickerOpen: function(grid) {
            noop(grid);
            return this.overlay.style.display !== 'none';
        },
        openColumnPicker: function(grid) {
            if (this.isColumnPickerOpen()) {
                return;
            }
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
                    if (e.altKey || e.keyCode === 27) {
                        e.preventDefault();
                        self.closeColumnPicker(grid);
                    }
                };
            }

            requestAnimationFrame(function() {
                self.overlay.style.opacity = 0.95;
                document.addEventListener('keydown', self._closer, false);
                self.overlay.focus();
            });
        },
        closeColumnPicker: function(grid) {
            if (!this.isColumnPickerOpen()) {
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
        initializeOn: function(grid) {
            this.initializeOverlaySurface(grid);
            if (this.next) {
                this.next.initializeOn(grid);
            }
        },
        initializeOverlaySurface: function(grid) {
            this.overlay = document.createElement('div');
            this.overlay.setAttribute('tabindex', 0);
            this.overlay.style.outline = 'none';
            this.overlay.style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
            this.overlay.style.position = 'absolute';
            this.overlay.style.display = 'none';
            this.overlay.style.transition = 'opacity ' + ANIMATION_TIME + 'ms ease-in';
            this.overlay.stylACTIVATION = 0;
            grid.appendChild(this.overlay);
            //document.body.appendChild(this.overlay);
        },

    });

})(); /* jshint ignore:line */
