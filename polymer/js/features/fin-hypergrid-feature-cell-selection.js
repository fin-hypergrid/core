'use strict';
/**
 *
 * @module features\cell-selection
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * currentDrag is the pixel location of the mouse pointer during a drag operation
         *
         * @property currentDrag
         * @type fin-rectangle.point
         */
        currentDrag: null,

        /**
         * lastDragCell is the cell coordinates of the where the mouse pointer is
         * during a drag operation
         *
         * @property lastDragCell
         * @type Object
         */
        lastDragCell: null,

        /**
         * sbLastAuto is a millisecond value representing the previous time an autoscroll started
         *
         * @property sbLastAuto
         * @type Number
         */
        sbLastAuto: 0,

        /**
         * sbAutoStart is a millisecond value representing the time the current autoscroll started
         *
         * @property sbAutoStart
         * @type Number
         */
        sbAutoStart: 0,

        rectangles: {},


        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        createdInit: function() {

            this.rectangles = document.createElement('fin-rectangle');

        },


        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleMouseUp: function(grid, event) {
            this.dragging = false;
            if (this.next) {
                this.next.handleMouseUp(grid, event);
            }
        },


        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleMouseDown: function(grid, event) {
            var gridCell = event.gridCell;
            if (gridCell.y < grid.getFixedRowCount()) {
                grid.clearSelections();
                this.dragging = false;
                if (this.next) {
                    this.next.handleMouseDown(grid, event);
                }
                return;
            } else if (gridCell.x < grid.getFixedColumnCount()) {
                grid.clearSelections();
                this.dragging = false;
                return;
            } else {
                var primEvent = event.primitiveEvent;
                var keys = primEvent.detail.keys;
                this.dragging = true;
                this.extendSelection(grid, gridCell, keys);
            }
        },


        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleMouseDrag: function(grid, event) {
            var mouseDown = grid.getMouseDown();
            if (!this.dragging) {
                if (this.next) {
                    this.next.handleMouseDrag(grid, event);
                }
            }
            if (mouseDown.x < 0 || mouseDown.y < 0) {
                //we are in the fixed area don't initiate a drag
                return;
            }
            var gridCell = event.gridCell;
            var primEvent = event.primitiveEvent;
            this.currentDrag = primEvent.detail.mouse;
            this.lastDragCell = gridCell;
            this.checkDragScroll(grid, this.currentDrag);
            this.handleMouseDragCellSelection(grid, gridCell, primEvent.detail.keys);
        },


        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleKeyDown: function(grid, event) {
            var command = 'handle' + event.detail.char;
            if (this[command]) {
                this[command].call(this, grid, event.detail);
            }
        },

        /**
         *                                                                      .
         *                                                                      .
         * Handle a mousedrag selection
         *
         * @method handleMouseDragCellSelection(mouse)
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleMouseDragCellSelection: function(grid, mouse /* ,keys */ ) {

            var scrollTop = grid.getVScrollValue();
            var scrollLeft = grid.getHScrollValue();

            var numFixedColumns = grid.getFixedColumnCount();
            var numFixedRows = grid.getFixedRowCount();

            var x = mouse.x - numFixedColumns;
            var y = mouse.y - numFixedRows;

            x = Math.max(0, x);
            y = Math.max(0, y);

            var previousDragExtent = grid.getDragExtent();
            var mouseDown = grid.getMouseDown();

            var newX = x + scrollLeft - mouseDown.x;
            var newY = y + scrollTop - mouseDown.y;

            if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
                return;
            }

            grid.clearMostRecentSelection();

            grid.select(mouseDown.x, mouseDown.y, newX, newY);

            var newDragExtent = this.rectangles.point.create(newX, newY);
            grid.setDragExtent(newDragExtent);

            grid.repaint();
        },

        /**
         *                                                                      .
         *                                                                      .
         * this checks while were dragging if we go outside the visible bounds,
         * if so, kick off the external autoscroll check function (above)
         *
         * @method checkDragScroll(event)
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        checkDragScroll: function(grid, mouse) {
            if (!grid.resolveProperty('scrollingEnabled')) {
                return;
            }
            var b = grid.getDataBounds();
            var inside = b.contains(mouse);
            if (inside) {
                if (grid.isScrollingNow()) {
                    grid.setScrollingNow(false);
                }
            } else if (!grid.isScrollingNow()) {
                grid.setScrollingNow(true);
                this.scrollDrag(grid);
            }
        },

        /**
         *                                                                      .
         *                                                                      .
         * this function makes sure that while we are dragging outside of
         * the grid visible bounds, we srcroll accordingly
         *
         * @method scrollDrag()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        scrollDrag: function(grid) {
            if (!grid.isScrollingNow()) {
                return;
            }
            var b = grid.getDataBounds();
            var xOffset = 0;
            var yOffset = 0;
            if (this.currentDrag.x < b.origin.x) {
                xOffset = -1;
            }
            if (this.currentDrag.x > b.origin.x + b.extent.x) {
                xOffset = 1;
            }
            if (this.currentDrag.y < b.origin.y) {
                yOffset = -1;
            }
            if (this.currentDrag.y > b.origin.y + b.extent.y) {
                yOffset = 1;
            }

            grid.scrollBy(xOffset, yOffset);
            this.handleMouseDragCellSelection(grid, this.lastDragCell, []); // update the selection
            grid.repaint();

            setTimeout(this.scrollDrag.bind(this, grid), 25);
        },

        /**
         *                                                                      .
         *                                                                      .
         * extend a selection or create one if there isnt yet
         *
         * @method extendSelection(mouse,keys)
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        extendSelection: function(grid, gridCell, keys) {
            var hasCTRL = keys.indexOf('CTRL') !== -1;
            var hasSHIFT = keys.indexOf('SHIFT') !== -1;
            var scrollTop = grid.getVScrollValue();
            var scrollLeft = grid.getHScrollValue();

            var numFixedColumns = grid.getFixedColumnCount();
            var numFixedRows = grid.getFixedRowCount();

            var mousePoint = grid.getMouseDown();
            var x = gridCell.x - numFixedColumns + scrollLeft;
            var y = gridCell.y - numFixedRows + scrollTop;

            //were outside of the grid do nothing
            if (x < 0 || y < 0) {
                return;
            }

            //we have repeated a click in the same spot deslect the value from last time
            if (x === mousePoint.x && y === mousePoint.y) {
                grid.clearMostRecentSelection();
                grid.popMouseDown();
                grid.repaint();
                return;
            }

            if (!hasCTRL && !hasSHIFT) {
                grid.clearSelections();
            }

            if (hasSHIFT) {
                grid.clearMostRecentSelection();
                grid.select(mousePoint.x, mousePoint.y, x - mousePoint.x, y - mousePoint.y);
                grid.setDragExtent(this.rectangles.point.create(x - mousePoint.x, y - mousePoint.y));
            } else {
                grid.select(x, y, 0, 0);
                grid.setMouseDown(this.rectangles.point.create(x, y));
                grid.setDragExtent(this.rectangles.point.create(0, 0));
            }
            grid.repaint();
        },

        /**
         *                                                                      .
         *                                                                      .
         * handle the shift down arrow key event
         *
         * @method handleDOWNSHIFT()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleDOWNSHIFT: function(grid) {
            var count = this.getAutoScrollAcceleration();
            this.moveShiftSelect(grid, 0, count);
        },

        /**
         *                                                                      .
         *                                                                      .
         * handle the shift up arrow key event
         *
         * @method handleUPSHIFT()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleUPSHIFT: function(grid) {
            var count = this.getAutoScrollAcceleration();
            this.moveShiftSelect(grid, 0, -count);
        },

        /**
         *                                                                      .
         *                                                                      .
         * handle the shift left arrow key event
         *
         * @method handleLEFTSHIFT()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleLEFTSHIFT: function(grid) {
            this.moveShiftSelect(grid, -1, 0);
        },

        /**
         *                                                                      .
         *                                                                      .
         * handle the shift right arrow key event
         *
         * @method handleRIGHTSHIFT()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleRIGHTSHIFT: function(grid) {
            this.moveShiftSelect(grid, 1, 0);
        },

        /**
         *                                                                      .
         *                                                                      .
         * handle the down arrow key event
         *
         * @method handleDOWN()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleDOWN: function(grid) {
            var count = this.getAutoScrollAcceleration();
            this.moveSingleSelect(grid, 0, count);
        },

        /**
         *                                                                      .
         *                                                                      .
         * handle the up arrow key event
         *
         * @method handleUP()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleUP: function(grid) {
            var count = this.getAutoScrollAcceleration();
            this.moveSingleSelect(grid, 0, -count);
        },

        /**
         *                                                                      .
         *                                                                      .
         * handle the left arrow key event
         *
         * @method handleLEFT()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleLEFT: function(grid) {
            this.moveSingleSelect(grid, -1, 0);
        },

        /**
         *                                                                      .
         *                                                                      .
         * handle the right arrow key event
         *
         * @method handleRIGHT()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleRIGHT: function(grid) {
            this.moveSingleSelect(grid, 1, 0);
        },

        /**
         *                                                                      .
         *                                                                      .
         * If we are holding down the same navigation key, accelerate the increment we scroll
         *
         * @method getAutoScrollAcceleration()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getAutoScrollAcceleration: function() {
            var count = 1;
            var elapsed = this.getAutoScrollDuration() / 2000;
            count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
            return count;
        },

        /**
         *                                                                      .
         *                                                                      .
         * set the start time when we initiated an auto scroll
         *
         * @method setAutoScrollStartTime()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        setAutoScrollStartTime: function() {
            this.sbAutoStart = Date.now();
        },

        /**
         *                                                                      .
         *                                                                      .
         * update the autoscroll start time if we haven't autoscrolled within the last 500ms
         * otherwise update the current autoscroll time
         *
         * @method pingAutoScroll()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        pingAutoScroll: function() {
            var now = Date.now();
            if (now - this.sbLastAuto > 500) {
                this.setAutoScrollStartTime();
            }
            this.sbLastAuto = Date.now();
        },

        /**
         *                                                                      .
         *                                                                      .
         * answer how long we have been auto scrolling
         *
         * @method getAutoScrollDuration()
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getAutoScrollDuration: function() {
            if (Date.now() - this.sbLastAuto > 500) {
                return 0;
            }
            return Date.now() - this.sbAutoStart;
        },

        /**
         *                                                                      .
         *                                                                      .
         * Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
         *
         * @method moveShiftSelect(grid, offsetX,offsetY)
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        moveShiftSelect: function(grid, offsetX, offsetY) {

            var maxColumns = grid.getColumnCount() - 1;
            var maxRows = grid.getRowCount() - 1;

            var maxViewableColumns = grid.getViewableColumns() - 1;
            var maxViewableRows = grid.getViewableRows() - 1;

            if (!grid.resolveProperty('scrollingEnabled')) {
                maxColumns = Math.min(maxColumns, maxViewableColumns);
                maxRows = Math.min(maxRows, maxViewableRows);
            }

            var origin = grid.getMouseDown();
            var extent = grid.getDragExtent();

            var newX = extent.x + offsetX;
            var newY = extent.y + offsetY;

            newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));
            newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

            grid.clearMostRecentSelection();
            grid.select(origin.x, origin.y, newX, newY);

            grid.setDragExtent(this.rectangles.point.create(newX, newY));

            if (grid.insureModelColIsViewable(newX + origin.x, offsetX)) {
                this.pingAutoScroll();
            }
            if (grid.insureModelRowIsViewable(newY + origin.y, offsetY)) {
                this.pingAutoScroll();
            }

            grid.repaint();

        },

        /**
         *                                                                      .
         *                                                                      .
         * Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
         *
         * @method moveSingleSelect(offsetX,offsetY)
         */

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        moveSingleSelect: function(grid, offsetX, offsetY) {

            var maxColumns = grid.getColumnCount() - 1;
            var maxRows = grid.getRowCount() - 1;

            var maxViewableColumns = grid.getViewableColumns() - 1;
            var maxViewableRows = grid.getViewableRows() - 1;

            if (!grid.resolveProperty('scrollingEnabled')) {
                maxColumns = Math.min(maxColumns, maxViewableColumns);
                maxRows = Math.min(maxRows, maxViewableRows);
            }

            var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());

            var newX = mouseCorner.x + offsetX;
            var newY = mouseCorner.y + offsetY;

            newX = Math.min(maxColumns, Math.max(0, newX));
            newY = Math.min(maxRows, Math.max(0, newY));

            grid.clearSelections();
            grid.select(newX, newY, 0, 0);
            grid.setMouseDown(this.rectangles.point.create(newX, newY));
            grid.setDragExtent(this.rectangles.point.create(0, 0));

            if (grid.insureModelColIsViewable(newX, offsetX)) {
                this.pingAutoScroll();
            }
            if (grid.insureModelRowIsViewable(newY, offsetY)) {
                this.pingAutoScroll();
            }

            grid.repaint();

        }


    });
})(); /* jshint ignore:line */
