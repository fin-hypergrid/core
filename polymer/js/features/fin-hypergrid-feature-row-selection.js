'use strict';

(function() {

    Polymer('fin-hypergrid-feature-row-selection', { /* jshint ignore:line  */

        /**
         * @property {fin-rectangle.point} currentDrag - currentDrag is the pixel location of the mouse pointer during a drag operation
         * @instance
         */
        currentDrag: null,

        /**
         * @property {Object} lastDragCell - lastDragCell is the cell coordinates of the where the mouse pointer is during a drag operation
         * @instance
         */
        lastDragCell: null,

        /**
         * @property {Number} sbLastAuto - sbLastAuto is a millisecond value representing the previous time an autoscroll started
         * @instance
         */
        sbLastAuto: 0,

        /**
         * @property {Number} sbAutoStart - sbAutoStart is a millisecond value representing the time the current autoscroll started
         * @instance
         */
        sbAutoStart: 0,

        /**
         * @property {fin-rectangle.point} rectangles - the util rectangles factory [fin-rectangles](https://github.com/stevewirts/fin-rectangle)
         * @instance
         */
        rectangles: {},

        /**
         * @function
         * @instance
         * @description
         the function to override for initialization
         */
        createdInit: function() {

            this.rectangles = document.createElement('fin-rectangle');

        },

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleMouseUp: function(grid, event) {
            if (this.dragging) {
                this.dragging = false;
                grid.fireSyntheticRowSelectionChangedEvent();
            }
            if (this.next) {
                this.next.handleMouseUp(grid, event);
            }
        },

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleMouseDown: function(grid, event) {

            var isRightClick = event.primitiveEvent.detail.isRightClick;
            var cell = event.gridCell;
            var viewCell = event.viewPoint;
            var dx = cell.x;
            var dy = cell.y;


            var isHeader = grid.isShowRowNumbers() && dx < 0;

            if (!grid.isRowSelection() || isRightClick || !isHeader) {
                if (this.next) {
                    this.next.handleMouseDown(grid, event);
                }
            } else {

                var numFixedRows = grid.getFixedRowCount();

                //if we are in the fixed area do not apply the scroll values
                //check both x and y values independently
                if (viewCell.y < numFixedRows) {
                    dy = viewCell.y;
                }

                var dCell = grid.rectangles.point.create(0, dy);

                var primEvent = event.primitiveEvent;
                var keys = primEvent.detail.keys;
                this.dragging = true;
                this.extendSelection(grid, dCell, keys);
            }
        },

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleMouseDrag: function(grid, event) {
            var isRightClick = event.primitiveEvent.detail.isRightClick;

            if (!grid.isRowSelection() || isRightClick || !this.dragging) {
                if (this.next) {
                    this.next.handleMouseDrag(grid, event);
                }
            } else {

                var numFixedRows = grid.getFixedRowCount();

                var cell = event.gridCell;
                var viewCell = event.viewPoint;
                //var dx = cell.x;
                var dy = cell.y;

                //if we are in the fixed area do not apply the scroll values
                //check both x and y values independently
                if (viewCell.y < numFixedRows) {
                    dy = viewCell.y;
                }

                var dCell = grid.rectangles.point.create(0, dy);

                var primEvent = event.primitiveEvent;
                this.currentDrag = primEvent.detail.mouse;
                this.lastDragCell = dCell;

                this.checkDragScroll(grid, this.currentDrag);
                this.handleMouseDragCellSelection(grid, dCell, primEvent.detail.keys);
            }
        },

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleKeyDown: function(grid, event) {
            if (grid.getLastSelectionType() !== 'row') {
                if (this.next) {
                    this.next.handleKeyDown(grid, event);
                }
                return;
            }
            var command = 'handle' + event.detail.char;
            if (this[command]) {
                this[command].call(this, grid, event.detail);
            }
        },

        /**
        * @function
        * @instance
        * @description
        Handle a mousedrag selection
        * #### returns: type
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {Object} mouse - the event details
        * @param {Array} keys - array of the keys that are currently pressed down
        */
        handleMouseDragCellSelection: function(grid, gridCell /* ,keys */ ) {

            //var behavior = grid.getBehavior();
            var y = gridCell.y;
            //            var previousDragExtent = grid.getDragExtent();
            var mouseDown = grid.getMouseDown();

            var newY = y - mouseDown.y;
            //var newY = y - mouseDown.y;

            // if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
            //     return;
            // }

            grid.clearMostRecentRowSelection();

            grid.selectRow(mouseDown.y, y);
            grid.setDragExtent(this.rectangles.point.create(0, newY));

            grid.repaint();
        },

        /**
        * @function
        * @instance
        * @description
        this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {Object} mouse - the event details
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
        * @function
        * @instance
        * @description
        this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        scrollDrag: function(grid) {

            if (!grid.isScrollingNow()) {
                return;
            }

            var lastDragCell = this.lastDragCell;
            var b = grid.getDataBounds();
            var xOffset = 0;
            var yOffset = 0;

            var numFixedColumns = grid.getFixedColumnCount();
            var numFixedRows = grid.getFixedRowCount();

            var dragEndInFixedAreaX = lastDragCell.x < numFixedColumns;
            var dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

            if (this.currentDrag.y < b.origin.y) {
                yOffset = -1;
            }

            if (this.currentDrag.y > b.origin.y + b.extent.y) {
                yOffset = 1;
            }

            var dragCellOffsetX = xOffset;
            var dragCellOffsetY = yOffset;

            if (dragEndInFixedAreaX) {
                dragCellOffsetX = 0;
            }

            if (dragEndInFixedAreaY) {
                dragCellOffsetY = 0;
            }

            this.lastDragCell = lastDragCell.plusXY(dragCellOffsetX, dragCellOffsetY);
            grid.scrollBy(xOffset, yOffset);
            this.handleMouseDragCellSelection(grid, lastDragCell, []); // update the selection
            grid.repaint();
            setTimeout(this.scrollDrag.bind(this, grid), 25);
        },

        /**
        * @function
        * @instance
        * @description
        extend a selection or create one if there isnt yet
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {Object} gridCell - the event details
        * @param {Array} keys - array of the keys that are currently pressed down
        */
        extendSelection: function(grid, gridCell, keys) {
            grid.stopEditing();
            //var hasCTRL = keys.indexOf('CTRL') !== -1;
            var hasSHIFT = keys.indexOf('SHIFT') !== -1;

            // var scrollTop = grid.getVScrollValue();
            // var scrollLeft = grid.getHScrollValue();

            // var numFixedColumns = 0;//grid.getFixedColumnCount();
            // var numFixedRows = 0;//grid.getFixedRowCount();

            var mousePoint = grid.getMouseDown();
            var x = gridCell.x; // - numFixedColumns + scrollLeft;
            var y = gridCell.y; // - numFixedRows + scrollTop;

            //were outside of the grid do nothing
            if (x < 0 || y < 0) {
                return;
            }

            //we have repeated a click in the same spot deslect the value from last time
            // if (mousePoint && x === mousePoint.x && y === mousePoint.y) {
            //     grid.clearSelections();
            //     grid.popMouseDown();
            //     grid.repaint();
            //     return;
            // }

            // if (!hasCTRL && !hasSHIFT) {
            //     grid.clearSelections();
            // }

            if (hasSHIFT) {
                grid.clearMostRecentRowSelection();
                grid.selectRow(y, mousePoint.y);
                grid.setDragExtent(this.rectangles.point.create(0, y - mousePoint.y));
            } else {
                grid.toggleSelectRow(y, keys);
                grid.setMouseDown(this.rectangles.point.create(x, y));
                grid.setDragExtent(this.rectangles.point.create(0, 0));
            }
            grid.repaint();
        },


        /**
        * @function
        * @instance
        * @description
         handle this event
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        handleDOWNSHIFT: function(grid) {
            this.moveShiftSelect(grid, 1);
        },

        /**
        * @function
        * @instance
        * @description
         handle this event
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleUPSHIFT: function(grid) {
            this.moveShiftSelect(grid, -1);
        },

        /**
        * @function
        * @instance
        * @description
         handle this event
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleLEFTSHIFT: function( /* grid */ ) {},

        /**
        * @function
        * @instance
        * @description
         handle this event
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleRIGHTSHIFT: function( /* grid */ ) {},

        /**
        * @function
        * @instance
        * @description
         handle this event
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleDOWN: function(grid) {
            this.moveSingleSelect(grid, 1);
        },

        /**
        * @function
        * @instance
        * @description
         handle this event
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleUP: function(grid) {
            this.moveSingleSelect(grid, -1);
        },

        /**
        * @function
        * @instance
        * @description
         handle this event
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleLEFT: function( /* grid */ ) {},

        /**
        * @function
        * @instance
        * @description
         handle this event
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleRIGHT: function(grid) {

            var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());
            var maxColumns = grid.getColumnCount() - 1;

            var newX = grid.getHeaderColumnCount() + grid.getHScrollValue();
            var newY = mouseCorner.y;

            newX = Math.min(maxColumns, newX);

            grid.clearSelections();
            grid.select(newX, newY, 0, 0);
            grid.setMouseDown(this.rectangles.point.create(newX, newY));
            grid.setDragExtent(this.rectangles.point.create(0, 0));

            grid.repaint();
        },

        /**
        * @function
        * @instance
        * @description
        If we are holding down the same navigation key, accelerate the increment we scroll
        * #### returns: integer
        */
        getAutoScrollAcceleration: function() {
            var count = 1;
            var elapsed = this.getAutoScrollDuration() / 2000;
            count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
            return count;
        },

        /**
        * @function
        * @instance
        * @description
        set the start time to right now when we initiate an auto scroll
        */
        setAutoScrollStartTime: function() {
            this.sbAutoStart = Date.now();
        },

        /**
        * @function
        * @instance
        * @description
        update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
        */
        pingAutoScroll: function() {
            var now = Date.now();
            if (now - this.sbLastAuto > 500) {
                this.setAutoScrollStartTime();
            }
            this.sbLastAuto = Date.now();
        },

        /**
        * @function
        * @instance
        * @description
        answer how long we have been auto scrolling
        * #### returns: integer
        */
        getAutoScrollDuration: function() {
            if (Date.now() - this.sbLastAuto > 500) {
                return 0;
            }
            return Date.now() - this.sbAutoStart;
        },

        /**
        * @function
        * @instance
        * @description
        Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
        */
        moveShiftSelect: function(grid, offsetY) {

            var maxRows = grid.getRowCount() - 1;

            var maxViewableRows = grid.getVisibleRows() - 1;

            if (!grid.resolveProperty('scrollingEnabled')) {
                maxRows = Math.min(maxRows, maxViewableRows);
            }

            var origin = grid.getMouseDown();
            var extent = grid.getDragExtent();

            var newY = extent.y + offsetY;
            //var newY = grid.getRowCount();

            newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

            grid.clearMostRecentRowSelection();
            grid.selectRow(origin.y, origin.y + newY);

            grid.setDragExtent(this.rectangles.point.create(0, newY));

            if (grid.insureModelRowIsVisible(newY + origin.y, offsetY)) {
                this.pingAutoScroll();
            }

            grid.fireSyntheticRowSelectionChangedEvent();
            grid.repaint();

        },

        /**
        * @function
        * @instance
        * @description
        Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
        */
        moveSingleSelect: function(grid, offsetY) {

            var maxRows = grid.getRowCount() - 1;

            var maxViewableRows = grid.getVisibleRowsCount() - 1;

            if (!grid.resolveProperty('scrollingEnabled')) {
                maxRows = Math.min(maxRows, maxViewableRows);
            }

            var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());

            var newY = mouseCorner.y + offsetY;
            //var newY = grid.getRowCount();

            newY = Math.min(maxRows, Math.max(0, newY));

            grid.clearSelections();
            grid.selectRow(newY);
            grid.setMouseDown(this.rectangles.point.create(0, newY));
            grid.setDragExtent(this.rectangles.point.create(0, 0));

            if (grid.insureModelRowIsVisible(newY, offsetY)) {
                this.pingAutoScroll();
            }

            grid.fireSyntheticRowSelectionChangedEvent();
            grid.repaint();

        }


    });


})();
