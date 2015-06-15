'use strict';
/**
 *
 * @module cell-editors\base
 *
 */
(function() {

    var noop = function() {};

    Polymer({ /* jshint ignore:line */

        /**
         * @property {boolean} isEditing - am I currently editing
         * @instance
         */
        isEditing: false,

        /**
         * @property {rectangle.point} editorPoint - the point that I am editing at right now
         * @instance
         */
        editorPoint: null,

        /**
         * @property {boolean} checkEditorPositionFlag - if true, check that the editor is in the right location
         * @instance
         */
        checkEditorPositionFlag: false,

        /**
         * @property {HTMLElement} input - my main input control
         * @instance
         */
        input: null,

        /**
         * @property {string} alias - my look up name
         * @instance
         */
        alias: 'base',

        /**
         * @property {fin-hypergrid} grid - my instance of hypergrid
         * @instance
         */
        grid: null,

        /**
         * @property {type} initialValue - the value before editing
         * @instance
         */
        initialValue: null,


        /**
         * @function
         * @instance
         * @description
         polymer lifecycle event
         */
        ready: function() {
            this.readyInit();
        },

        /**
         * @function
         * @instance
         * @description
         the function to override for initialization
         */
        readyInit: function() {

        },

        /**
         * @function
         * @instance
         * @description
         return the behavior (model)
         *
         * #### returns: [fin-hypergrid-behavior-base](module-behaviors_base.html)
         */
        getBehavior: function() {
            return this.grid.getBehavior();
        },

        /**
         * @function
         * @instance
         * @description
         This function is a callback from the fin-hypergrid.   It is called after each paint of the canvas.
         *
         */
        gridRenderedNotification: function() {
            this.checkEditor();
        },

        /**
         * @function
         * @instance
         * @description
        scroll values have changed, we've been notified
         */
        scrollValueChangedNotification: function() {
            this.setCheckEditorPositionFlag();
        },

        /**
        * @function
        * @instance
        * @description
        turn on checkEditorPositionFlag boolean field
        */
        setCheckEditorPositionFlag: function() {
            this.checkEditorPositionFlag = true;
        },

        /**
        * @function
        * @instance
        * @description
        begin editing at location point
        * @param {rectangle.point} point - the location to start editing at
        */
        beginEditAt: function(point) {
            this.setEditorPoint(point);
            var model = this.getBehavior();
            var value = model._getValue(point.x, point.y);
            var proceed = this.grid.fireBeforeCellEdit(point, value);
            if (!proceed) {
                //we were cancelled
                return;
            }
            this.initialValue = value;
            this.setEditorValue(value);
            this.isEditing = true;
            this.setCheckEditorPositionFlag();
            this.checkEditor();
        },

        /**
        * @function
        * @instance
        * @description
        put value into our editor
        * @param {object} value - whatever value we want to edit
        */
        setEditorValue: function(value) {
            noop(value);
        },

        /**
        * @function
        * @instance
        * @description
        returns the point at which we are currently editing
        * #### returns: rectangle.point
        */
        getEditorPoint: function() {
            return this.editorPoint;
        },

        /**
        * @function
        * @instance
        * @description
        set the current editor location
        * @param {rectangle.point} point - the data location of the current editor
        */
        setEditorPoint: function(point) {
            this.editorPoint = point;
        },

        /**
        * @function
        * @instance
        * @description
        display the editor
        */
        showEditor: function() {},

        /**
        * @function
        * @instance
        * @description
        hide the editor
        */
        hideEditor: function() {},

        /**
        * @function
        * @instance
        * @description
        stop editing
        */
        stopEditing: function() {
            if (!this.isEditing) {
                return;
            }
            this.saveEditorValue();
            this.isEditing = false;
            this.hideEditor();
        },

        /**
        * @function
        * @instance
        * @description
        save the new value into the behavior(model)
        */
        saveEditorValue: function() {
            var point = this.getEditorPoint();
            var value = this.getEditorValue();
            if (value === this.initialValue) {
                return; //data didn't change do nothing
            }
            this.getBehavior()._setValue(point.x, point.y, value);
            this.grid.fireAfterCellEdit(point, this.initialValue, value);
        },

        /**
        * @function
        * @instance
        * @description
        return the current editor's value
        * #### returns: Object
        */
        getEditorValue: function() {

        },

        /**
        * @function
        * @instance
        * @description
        request focus for my input control
        */
        takeFocus: function() {

        },

        /**
        * @function
        * @instance
        * @description
        move the editor to the current editor point
        */
        moveEditor: function() {
            var model = this.getBehavior();
            var numFixedColumns = model.getFixedColumnCount();
            var numFixedRows = model.getFixedRowCount();
            var vScroll = this.grid.getVScrollValue();
            var hScroll = this.grid.getHScrollValue();
            var editorPoint = this.getEditorPoint();
            var x = editorPoint.x + numFixedColumns - hScroll;
            var y = editorPoint.y + numFixedRows - vScroll;
            var eb = this.grid.getBoundsOfCell(this.rectangles.point.create(x, y));
            var db = this.grid.getDataBounds();
            var cellBounds = eb.intersect(db);
            this.setBounds(cellBounds);
            this.takeFocus();
        },

        /**
        * @function
        * @instance
        * @description
        set the bounds of my input control
        * @param {rectangle} rectangle - the bounds to move to
        */
        setBounds: function(rectangle) {
            noop(rectangle);
        },

        /**
        * @function
        * @instance
        * @description
        check that the editor is in the correct location, and is showing/hidden appropriately
        */
        checkEditor: function() {
            if (!this.checkEditorPositionFlag) {
                return;
            } else {
                this.checkEditorPositionFlag = false;
            }
            if (!this.isEditing) {
                return;
            }
            var editorPoint = this.getEditorPoint();
            if (this.grid.isDataVisible(editorPoint.x, editorPoint.y)) {
                this.moveEditor();
                this.showEditor();
            } else {
                this.hideEditor();
            }
        }

    });

})(); /* jshint ignore:line */
