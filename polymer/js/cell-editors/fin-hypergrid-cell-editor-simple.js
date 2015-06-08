'use strict';
/**
 *
 * @module cell-editors\simple
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @property {type} varname - description
         * @instance
         */
        alias: 'simple',

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
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

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getEditorValue: function() {
            var value = this.input.value;
            return value;
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        setEditorValue: function(value) {
            this.input.value = value + '';
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        showEditor: function() {
            this.input.style.display = 'inline';
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        hideEditor: function() {
            this.input.style.display = 'none';
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        takeFocus: function() {
            var self = this;
            setTimeout(function() {
                self.input.focus();
                self.selectAll();
            }, 300);
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        selectAll: function() {

        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        originOffset: function() {
            return [-2, -2];
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
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
