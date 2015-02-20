'use strict';

(function() {

    Polymer({ /* jshint ignore:line */
        alias: 'simple',

        readyInit: function() {
            var self = this;
            this.rectangles = document.createElement('fin-rectangle');
            this.editorPoint = this.rectangles.point.create(0, 0);
            this.input = this.shadowRoot.querySelector('#editor');
            this.input.addEventListener('keypress', function(e) {
                if (e && e.keyCode === 13) {
                    e.preventDefault();
                    self.stopEditing();
                    self.grid.repaint();
                    self.grid.takeFocus();
                }
            });
            this.input.style.position = 'absolute';
            this.input.style.display = 'none';
            this.input.style.border = 'solid 2px black';
            this.input.style.outline = 0;
            this.input.style.padding = 0;
            this.input.style.zIndex = 1000;
        },

        getEditorValue: function() {
            var value = this.input.value;
            return value;
        },

        setEditorValue: function(value) {
            this.input.value = value + '';
        },

        showEditor: function() {
            this.input.style.display = 'inline';
        },

        hideEditor: function() {
            this.input.style.display = 'none';
        },

        takeFocus: function() {
            var self = this;
            setTimeout(function() {
                self.input.focus();
                self.selectAll();
            }, 300);
        },

        selectAll: function() {

        },

        originOffset: function() {
            return [-2, -2];
        },

        setBounds: function(cellBounds) {
            var originOffset = this.originOffset();
            var translation = 'translate(' + (cellBounds.origin.x + originOffset[0]) + 'px,' + (cellBounds.origin.y + originOffset[1]) + 'px)';
            this.input.style.webkitTransform = translation;
            this.input.style.MozTransform = translation;
            this.input.style.msTransform = translation;
            this.input.style.OTransform = translation;

            this.input.style.width = cellBounds.extent.x + 'px';
            this.input.style.height = cellBounds.extent.y + 'px';
        }

    });

})(); /* jshint ignore:line */
