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
         * @property {type} varname - description
         * @instance
         */
        isEditing: false,

        /**
         * @property {type} varname - description
         * @instance
         */
        editorPoint: null,

        /**
         * @property {type} varname - description
         * @instance
         */
        checkEditorPositionFlag: false,

        /**
         * @property {type} varname - description
         * @instance
         */
        input: null,

        /**
         * @property {type} varname - description
         * @instance
         */
        alias: 'base',

        /**
         * @property {type} varname - description
         * @instance
         */
        grid: null,

        /**
         * @property {type} varname - description
         * @instance
         */
        initialValue: null,


        //Currently the only CellEditor is an input field.  The structure is in place for handling the CellEditor during focus change and grid scrolling.
        //TODO:Generalize the cell editing functionality to delegate through the behvior objects and then through the cell editors.  Add more general CellEditor types/drop down/button/calendar/spinner/etc...
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        ready: function() {
            this.readyInit();
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        readyInit: function() {

        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getBehavior: function() {
            return this.grid.getBehavior();
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        gridRenderedNotification: function() {
            this.checkEditor();
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        scrollValueChangedNotification: function() {
            this.setCheckEditorPositionFlag();
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        setCheckEditorPositionFlag: function() {
            this.checkEditorPositionFlag = true;
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
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
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        setEditorValue: function(value) {
            noop(value);
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getEditorPoint: function() {
            return this.editorPoint;
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        setEditorPoint: function(point) {
            this.editorPoint = point;
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        showEditor: function() {},

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        hideEditor: function() {},

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
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
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        saveEditorValue: function() {
            var point = this.getEditorPoint();
            var value = this.getEditorValue();
            this.getBehavior()._setValue(point.x, point.y, value);
            this.grid.fireAfterCellEdit(point, this.initialValue, value);
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

        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
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
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        setBounds: function(rectangle) {
            noop(rectangle);
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
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
