/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

// This feature is responsible for column drag and drop reordering.
// This object is a mess and desperately needs a complete rewrite.....

var Feature = require('./Feature.js');

var noop = function() {};

var columnAnimationTime = 150;
var dragger;
var draggerCTX;
var floatColumn;
var floatColumnCTX;

var ColumnMoving = Feature.extend({

    alias: 'ColumnMoving',

    /**
     * @property {Array} floaterAnimationQueue - queue up the animations that need to play so they are done synchronously
     * @instance
     */
    floaterAnimationQueue: [],

    /**
     * @property {boolean} columnDragAutoScrollingRight - am I currently auto scrolling right
     * @instance
     */
    columnDragAutoScrollingRight: false,

    /**
     * @property {boolean} columnDragAutoScrollingLeft  - am I currently auto scrolling left
     * @instance
     */
    columnDragAutoScrollingLeft: false,

    /**
     * @property {boolean} dragArmed - is the drag mechanism currently enabled(armed)
     * @instance
     */
    dragArmed: false,

    /**
     * @property {boolean} dragging - am I dragging right now
     * @instance
     */
    dragging: false,

    /**
     * @property {number} dragCol - return the column index of the currently dragged column
     * @instance
     */
    dragCol: -1,

    /**
     * @property {number} dragOffset - an offset to position the dragged item from the cursor
     * @instance
     */
    dragOffset: 0,

    /**
     * @function
     * @instance
     * @desc give me an opportunity to initialize stuff on the grid
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     */
    initializeOn: function(grid) {
        this.isFloatingNow = false;
        this.initializeAnimationSupport(grid);
        if (this.next) {
            this.next.initializeOn(grid);
        }
    },

    /**
     * @function
     * @instance
     * @desc initialize animation support on the grid
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     */
    initializeAnimationSupport: function(grid) {
        noop(grid);
        if (!dragger) {
            dragger = document.createElement('canvas');
            dragger.setAttribute('width', '0px');
            dragger.setAttribute('height', '0px');

            document.body.appendChild(dragger);
            draggerCTX = dragger.getContext('2d');
        }
        if (!floatColumn) {
            floatColumn = document.createElement('canvas');
            floatColumn.setAttribute('width', '0px');
            floatColumn.setAttribute('height', '0px');

            document.body.appendChild(floatColumn);
            floatColumnCTX = floatColumn.getContext('2d');
        }

    },

    getCanDragCursorName: function() {
        return '-webkit-grab';
    },

    getDraggingCursorName: function() {
        return '-webkit-grabbing';
    },

    /**
     * @function
     * @instance
     * @desc handle this event
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {

        var gridCell = event.gridCell;
        var x;
        //var y;

        var distance = Math.abs(event.primitiveEvent.detail.dragstart.x - event.primitiveEvent.detail.mouse.x);

        if (distance < 10) {
            if (this.next) {
                this.next.handleMouseDrag(grid, event);
            }
            return;
        }

        if (this.isHeaderRow(grid, event) && this.dragArmed && !this.dragging) {
            this.dragging = true;
            this.dragCol = gridCell.x;
            this.dragOffset = event.mousePoint.x;
            this.detachChain();
            x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
            //y = event.primitiveEvent.detail.mouse.y;
            this.createDragColumn(grid, x, this.dragCol);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }

        if (this.dragging) {
            x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
            //y = event.primitiveEvent.detail.mouse.y;
            this.dragColumn(grid, x);
        }
    },

    /**
     * @function
     * @instance
     * @desc handle this event
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (grid.getBehavior().isColumnReorderable()) {
            if (this.isHeaderRow(grid, event) && event.gridCell.x !== -1) {
                this.dragArmed = true;
                this.cursor = this.getDraggingCursorName();
                grid.clearSelections();
            }
        }
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @function
     * @instance
     * @desc handle this event
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        //var col = event.gridCell.x;
        if (this.dragging) {
            this.cursor = null;
            //delay here to give other events a chance to be dropped
            var self = this;
            this.endDragColumn(grid);
            setTimeout(function() {
                self.attachChain();
            }, 200);
        }
        this.dragCol = -1;
        this.dragging = false;
        this.dragArmed = false;
        this.cursor = null;
        grid.repaint();

        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }

    },

    /**
     * @function
     * @instance
     * @desc handle this event
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {

        if (!this.dragging && event.mousePoint.y < 5 && event.viewPoint.y === 0) {
            this.cursor = this.getCanDragCursorName();
        } else {
            this.cursor = null;
        }

        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }

        if (this.isHeaderRow(grid, event) && this.dragging) {
            this.cursor = this.getDraggingCursorName(); //move';
        }
    },

    /**
     * @function
     * @instance
     * @desc this is the main event handler that manages the dragging of the column
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {boolean} draggedToTheRight - are we moving to the right
     */
    floatColumnTo: function(grid, draggedToTheRight) {
        this.floatingNow = true;

        var renderer = grid.getRenderer();
        var colEdges = renderer.getColumnEdges();
        //var behavior = grid.getBehavior();
        var scrollLeft = grid.getHScrollValue();
        var floaterIndex = grid.renderOverridesCache.floater.columnIndex;
        var draggerIndex = grid.renderOverridesCache.dragger.columnIndex;
        var hdpiratio = grid.renderOverridesCache.dragger.hdpiratio;

        var draggerStartX;
        var floaterStartX;
        var fixedColumnCount = grid.getFixedColumnCount();
        var draggerWidth = grid.getColumnWidth(draggerIndex);
        var floaterWidth = grid.getColumnWidth(floaterIndex);

        var max = grid.getVisibleColumnsCount();

        var doffset = 0;
        var foffset = 0;

        if (draggerIndex >= fixedColumnCount) {
            doffset = scrollLeft;
        }
        if (floaterIndex >= fixedColumnCount) {
            foffset = scrollLeft;
        }

        if (draggedToTheRight) {
            draggerStartX = colEdges[Math.min(max, draggerIndex - doffset)];
            floaterStartX = colEdges[Math.min(max, floaterIndex - foffset)];

            grid.renderOverridesCache.dragger.startX = (draggerStartX + floaterWidth) * hdpiratio;
            grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;

        } else {
            floaterStartX = colEdges[Math.min(max, floaterIndex - foffset)];
            draggerStartX = floaterStartX + draggerWidth;

            grid.renderOverridesCache.dragger.startX = floaterStartX * hdpiratio;
            grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;
        }
        grid.swapColumns(draggerIndex, floaterIndex);
        grid.renderOverridesCache.dragger.columnIndex = floaterIndex;
        grid.renderOverridesCache.floater.columnIndex = draggerIndex;


        this.floaterAnimationQueue.unshift(this.doColumnMoveAnimation(grid, floaterStartX, draggerStartX));

        this.doFloaterAnimation(grid);

    },

    /**
     * @function
     * @instance
     * @desc manifest the column drag and drop animation
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {number} floaterStartX - the x start coordinate of the column underneath that floats behind the dragged column
     * @param {number} draggerStartX - the x start coordinate of the dragged column
     */
    doColumnMoveAnimation: function(grid, floaterStartX, draggerStartX) {
        var self = this;
        return function() {
            var d = floatColumn;
            d.style.display = 'inline';
            self.setCrossBrowserProperty(d, 'transform', 'translate(' + floaterStartX + 'px, ' + 0 + 'px)');

            //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';
            //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';

            requestAnimationFrame(function() {
                self.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + columnAnimationTime + 'ms ease');
                self.setCrossBrowserProperty(d, 'transform', 'translate(' + draggerStartX + 'px, ' + -2 + 'px)');
            });
            grid.repaint();
            //need to change this to key frames

            setTimeout(function() {
                self.setCrossBrowserProperty(d, 'transition', '');
                grid.renderOverridesCache.floater = null;
                grid.repaint();
                self.doFloaterAnimation(grid);
                requestAnimationFrame(function() {
                    d.style.display = 'none';
                    self.isFloatingNow = false;
                });
            }, columnAnimationTime + 50);
        };
    },

    /**
     * @function
     * @instance
     * @desc manifest the floater animation
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     */
    doFloaterAnimation: function(grid) {
        if (this.floaterAnimationQueue.length === 0) {
            this.floatingNow = false;
            grid.repaint();
            return;
        }
        var animation = this.floaterAnimationQueue.pop();
        animation();
    },

    /**
     * @function
     * @instance
     * @desc create the float column at columnIndex underneath the dragged column
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {number} columnIndex - the index of the column that will be floating
     */
    createFloatColumn: function(grid, columnIndex) {

        var fixedColumnCount = grid.getFixedColumnCount();
        var scrollLeft = grid.getHScrollValue();

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

        var renderer = grid.getRenderer();
        var columnEdges = renderer.getColumnEdges();

        var columnWidth = grid.getColumnWidth(columnIndex);
        var colHeight = grid.div.clientHeight;
        var d = floatColumn;
        var style = d.style;
        var location = grid.div.getBoundingClientRect();

        style.top = (location.top - 2) + 'px';
        style.left = location.left + 'px';
        style.position = 'fixed';

        var hdpiRatio = grid.getHiDPI(floatColumnCTX);

        d.setAttribute('width', Math.round(columnWidth * hdpiRatio) + 'px');
        d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');
        style.boxShadow = '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';
        style.width = columnWidth + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
        style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';
        style.borderTop = '1px solid ' + renderer.resolveProperty('lineColor');
        style.backgroundColor = renderer.resolveProperty('backgroundColor');

        var startX = columnEdges[columnIndex - scrollLeft];
        startX = startX * hdpiRatio;

        floatColumnCTX.scale(hdpiRatio, hdpiRatio);

        grid.renderOverridesCache.floater = {
            columnIndex: columnIndex,
            ctx: floatColumnCTX,
            startX: startX,
            width: columnWidth,
            height: colHeight,
            hdpiratio: hdpiRatio
        };

        style.zIndex = '4';
        this.setCrossBrowserProperty(d, 'transform', 'translate(' + startX + 'px, ' + -2 + 'px)');
        style.cursor = this.getDraggingCursorName();
        grid.repaint();
    },

    /**
     * @function
     * @instance
     * @desc utility function for setting cross browser css properties
     * @param {HTMLElement} element - descripton
     * @param {string} property - the property
     * @param {string} value - the value to assign
     */
    setCrossBrowserProperty: function(element, property, value) {
        var uProperty = property[0].toUpperCase() + property.substr(1);
        this.setProp(element, 'webkit' + uProperty, value);
        this.setProp(element, 'Moz' + uProperty, value);
        this.setProp(element, 'ms' + uProperty, value);
        this.setProp(element, 'O' + uProperty, value);
        this.setProp(element, property, value);
    },

    /**
     * @function
     * @instance
     * @desc utility function for setting properties on HTMLElements
     * @param {HTMLElement} element - descripton
     * @param {string} property - the property
     * @param {string} value - the value to assign
     */
    setProp: function(element, property, value) {
        if (property in element.style) {
            element.style[property] = value;
        }
    },

    /**
     * @function
     * @instance
     * @desc create the dragged column at columnIndex above the floated column
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {number} x - the start position
     * @param {number} columnIndex - the index of the column that will be floating
     */
    createDragColumn: function(grid, x, columnIndex) {

        var fixedColumnCount = grid.getFixedColumnCount();
        var scrollLeft = grid.getHScrollValue();

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

        var renderer = grid.getRenderer();
        var columnEdges = renderer.getColumnEdges();
        var hdpiRatio = grid.getHiDPI(draggerCTX);
        var columnWidth = grid.getColumnWidth(columnIndex);
        var colHeight = grid.div.clientHeight;
        var d = dragger;
        var location = grid.div.getBoundingClientRect();
        var style = d.style;

        style.top = location.top + 'px';
        style.left = location.left + 'px';
        style.position = 'fixed';
        style.opacity = 0.85;
        style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
        //style.zIndex = 100;
        style.borderTop = '1px solid ' + renderer.resolveProperty('lineColor');
        style.backgroundColor = grid.renderer.resolveProperty('backgroundColor');

        d.setAttribute('width', Math.round(columnWidth * hdpiRatio) + 'px');
        d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');

        style.width = columnWidth + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
        style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';

        var startX = columnEdges[columnIndex - scrollLeft];
        startX = startX * hdpiRatio;

        draggerCTX.scale(hdpiRatio, hdpiRatio);

        grid.renderOverridesCache.dragger = {
            columnIndex: columnIndex,
            ctx: draggerCTX,
            startX: startX,
            width: columnWidth,
            height: colHeight,
            hdpiratio: hdpiRatio
        };

        this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, -5px)');
        style.zIndex = '5';
        style.cursor = this.getDraggingCursorName();
        grid.repaint();
    },

    /**
     * @function
     * @instance
     * @desc this function is the main dragging logic
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {number} x - the start position
     */
    dragColumn: function(grid, x) {

        //TODO: this function is overly complex, refactor this in to something more reasonable
        var self = this;
        //var renderer = grid.getRenderer();
        //var columnEdges = renderer.getColumnEdges();

        var autoScrollingNow = this.columnDragAutoScrollingRight || this.columnDragAutoScrollingLeft;

        var hdpiRatio = grid.getHiDPI(draggerCTX);

        var dragColumnIndex = grid.renderOverridesCache.dragger.columnIndex;
        var columnWidth = grid.renderOverridesCache.dragger.width;

        var minX = 0; //grid.getFixedColumnsWidth();
        var maxX = grid.renderer.getFinalVisableColumnBoundry() - columnWidth;
        x = Math.min(x, maxX + 15);
        x = Math.max(minX - 15, x);

        //am I at my lower bound
        var atMin = x < minX && dragColumnIndex !== 0;

        //am I at my upper bound
        var atMax = x > maxX;

        var d = dragger;

        this.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + 0 + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');

        this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, ' + -10 + 'px)');
        requestAnimationFrame(function() {
            d.style.display = 'inline';
        });

        var overCol = grid.renderer.getColumnFromPixelX(x + (d.width / 2 / hdpiRatio));

        if (atMin) {
            overCol = 0;
        }

        if (atMax) {
            overCol = grid.getColumnCount() - 1;
        }

        var doAFloat = dragColumnIndex > overCol;
        doAFloat = doAFloat || (overCol - dragColumnIndex >= 1);

        if (doAFloat && !atMax && !autoScrollingNow) {
            var draggedToTheRight = dragColumnIndex < overCol;
            // if (draggedToTheRight) {
            //     overCol = overCol - 1;
            // }
            if (this.isFloatingNow) {
                return;
            }

            this.isFloatingNow = true;
            this.createFloatColumn(grid, overCol);
            this.floatColumnTo(grid, draggedToTheRight);
        } else {

            if (x < minX - 10) {
                this.checkAutoScrollToLeft(grid, x);
            }
            if (x > minX - 10) {
                this.columnDragAutoScrollingLeft = false;
            }
            //lets check for autoscroll to right if were up against it
            if (atMax || x > maxX + 10) {
                this.checkAutoScrollToRight(grid, x);
                return;
            }
            if (x < maxX + 10) {
                this.columnDragAutoScrollingRight = false;
            }
        }
    },

    /**
     * @function
     * @instance
     * @desc autoscroll to the right if necessary
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {number} x - the start position
     */
    checkAutoScrollToRight: function(grid, x) {
        if (this.columnDragAutoScrollingRight) {
            return;
        }
        this.columnDragAutoScrollingRight = true;
        this._checkAutoScrollToRight(grid, x);
    },

    _checkAutoScrollToRight: function(grid, x) {
        if (!this.columnDragAutoScrollingRight) {
            return;
        }
        var scrollLeft = grid.getHScrollValue();
        if (!grid.dragging || scrollLeft > (grid.sbHScrollConfig.rangeStop - 2)) {
            return;
        }
        var draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
        grid.scrollBy(1, 0);
        var newIndex = draggedIndex + 1;
        console.log(newIndex, draggedIndex);
        grid.swapColumns(newIndex, draggedIndex);
        grid.renderOverridesCache.dragger.columnIndex = newIndex;

        setTimeout(this._checkAutoScrollToRight.bind(this, grid, x), 250);
    },

    /**
     * @function
     * @instance
     * @desc autoscroll to the left if necessary
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {number} x - the start position
     */
    checkAutoScrollToLeft: function(grid, x) {
        if (this.columnDragAutoScrollingLeft) {
            return;
        }
        this.columnDragAutoScrollingLeft = true;
        this._checkAutoScrollToLeft(grid, x);
    },

    _checkAutoScrollToLeft: function(grid, x) {
        if (!this.columnDragAutoScrollingLeft) {
            return;
        }

        var scrollLeft = grid.getHScrollValue();
        if (!grid.dragging || scrollLeft < 1) {
            return;
        }
        var draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
        grid.swapColumns(draggedIndex + scrollLeft, draggedIndex + scrollLeft - 1);
        grid.scrollBy(-1, 0);
        setTimeout(this._checkAutoScrollToLeft.bind(this, grid, x), 250);
    },

    /**
     * @function
     * @instance
     * @desc a column drag has completed, update data and cleanup
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     */
    endDragColumn: function(grid) {

        var fixedColumnCount = grid.getFixedColumnCount();
        var scrollLeft = grid.getHScrollValue();

        var columnIndex = grid.renderOverridesCache.dragger.columnIndex;

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

        var renderer = grid.getRenderer();
        var columnEdges = renderer.getColumnEdges();
        var self = this;
        var startX = columnEdges[columnIndex - scrollLeft];
        var d = dragger;

        self.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + columnAnimationTime + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');
        self.setCrossBrowserProperty(d, 'transform', 'translate(' + startX + 'px, ' + -1 + 'px)');
        d.style.boxShadow = '0px 0px 0px #888888';

        setTimeout(function() {
            grid.renderOverridesCache.dragger = null;
            grid.repaint();
            requestAnimationFrame(function() {
                d.style.display = 'none';
                grid.endDragColumnNotification();
            });
        }, columnAnimationTime + 50);

    },

    /**
     * @function
     * @instance
     * @desc handle this event down the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    isHeaderRow: function(grid, event) {
        var gridCell = event.viewPoint;
        var isFixed = gridCell.y === 0;
        return isFixed;
    }

});

module.exports = ColumnMoving;
