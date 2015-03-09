(function() {

    'use strict';

    var noop = function() {};

    var columnAnimationTime = 150;
    var dragger;
    var draggerCTX;
    var floatColumn;
    var floatColumnCTX;

    Polymer({ /* jshint ignore:line */

        floaterAnimationQueue: [],
        columnDragAutoScrollingRight: false,
        columnDragAutoScrollingLeft: false,
        dragArmed: false,
        dragging: false,
        dragCol: -1,
        dragOffset: 0,

        initializeOn: function(grid) {
            this.isFloatingNow = false;
            this.initializeAnimationSupport(grid);
            if (this.next) {
                this.next.initializeOn(grid);
            }
        },

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

        handleMouseDrag: function(grid, event) {

            var gridCell = event.gridCell;
            var x, y;

            if (this.isFixedColumn(grid, event)) {
                return; //no rearranging fixed columns
            }

            if (this.isFixedRow(grid, event) && this.dragArmed && !this.dragging) {
                this.dragging = true;
                this.dragCol = gridCell.x - grid.getFixedColumnCount();
                this.dragOffset = event.mousePoint.x;
                this.detachChain();
                x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
                y = event.primitiveEvent.detail.mouse.y;
                this.createDragColumn(grid, x, this.dragCol);
            } else if (this.next) {
                this.next.handleMouseDrag(grid, event);
            }
            if (this.dragging) {
                x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
                y = event.primitiveEvent.detail.mouse.y;
                this.dragColumn(grid, x);
            }
        },

        handleMouseDown: function(grid, event) {
            if (grid.getBehavior().isColumnReorderable()) {
                if (this.isFixedRow(grid, event)) {
                    this.dragArmed = true;
                }
            }
            if (this.next) {
                this.next.handleMouseDown(grid, event);
            }
        },

        handleMouseUp: function(grid, event) {
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
            grid.repaint();
            if (this.next) {
                this.next.handleMouseUp(grid, event);
            }

        },

        handleMouseMove: function(grid, event) {

            this.cursor = null;
            if (this.next) {
                this.next.handleMouseMove(grid, event);
            }
            if (this.isFixedRow(grid, event) && this.dragging) {
                this.cursor = 'none'; //move';
            }

        },

        //do the animation and swap the columns
        //we need a better name
        floatColumnTo: function(grid, draggedToTheRight) {
            this.floatingNow = true;
            var scrollLeft = grid.getHScrollValue();
            var floaterIndex = grid.renderOverridesCache.floater.columnIndex;
            var draggerIndex = grid.renderOverridesCache.dragger.columnIndex;
            var hdpiratio = grid.renderOverridesCache.dragger.hdpiratio;

            var numFixedColumns = grid.getFixedColumnCount();
            var draggerStartX;
            var floaterStartX;
            var draggerWidth = grid.getColumnWidth(draggerIndex + scrollLeft);
            var floaterWidth = grid.getColumnWidth(floaterIndex + scrollLeft);
            var max = grid.renderer.renderedColumnWidths.length - 1;
            if (draggedToTheRight) {
                draggerStartX = grid.renderer.renderedColumnWidths[Math.min(max, draggerIndex + numFixedColumns)];
                floaterStartX = draggerStartX + floaterWidth;

                grid.renderOverridesCache.dragger.startX = floaterStartX * hdpiratio;
                grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;

                floaterStartX = draggerStartX + draggerWidth;
            } else {
                floaterStartX = grid.renderer.renderedColumnWidths[Math.min(max, floaterIndex + numFixedColumns)];
                draggerStartX = floaterStartX + draggerWidth;

                grid.renderOverridesCache.dragger.startX = floaterStartX * hdpiratio;
                grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;
            }
            grid.getBehavior().swapColumns(draggerIndex + scrollLeft, floaterIndex + scrollLeft);
            grid.renderOverridesCache.dragger.columnIndex = floaterIndex;
            grid.renderOverridesCache.floater.columnIndex = draggerIndex;


            this.floaterAnimationQueue.unshift(this.doColumnMoveAnimation(grid, floaterStartX, draggerStartX));

            this.doFloaterAnimation(grid);

        },
        doColumnMoveAnimation: function(grid, floaterStartX, draggerStartX) {
            var self = this;
            return function() {
                var d = floatColumn;
                d.style.display = 'inline';
                self.setCrossBrowserProperty(d, 'transform', 'translate(' + floaterStartX + 'px, ' + 0 + 'px)');

                //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';
                //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';

                window.requestAnimationFrame(function() {
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

        doFloaterAnimation: function(grid) {
            if (this.floaterAnimationQueue.length === 0) {
                this.floatingNow = false;
                grid.repaint();
                return;
            }
            var animation = this.floaterAnimationQueue.pop();
            animation();
        },

        createFloatColumn: function(grid, columnIndex) {
            var scrollLeft = grid.getHScrollValue();
            var numFixedColumns = grid.getFixedColumnCount();
            var columnWidth = columnIndex < 0 ? grid.getFixedColumnWidth(numFixedColumns + columnIndex + scrollLeft) : grid.getColumnWidth(columnIndex + scrollLeft);
            var colHeight = grid.clientHeight;
            var d = floatColumn;
            var style = d.style;
            var location = grid.getBoundingClientRect();

            style.top = (location.top - 2) + 'px';
            style.left = location.left + 'px';
            style.position = 'fixed';

            var hdpiRatio = grid.getHiDPI(floatColumnCTX);

            d.setAttribute('width', Math.round(columnWidth * hdpiRatio) + 'px');
            d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');
            style.boxShadow = '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';
            style.width = columnWidth + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
            style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';
            style.borderTop = '1px solid ' + grid.renderer.resolveProperty('lineColor');
            style.backgroundColor = grid.renderer.resolveProperty('backgroundColor');

            var startX = grid.renderer.renderedColumnWidths[columnIndex + numFixedColumns];
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
            style.cursor = 'none';
            grid.repaint();
        },
        setCrossBrowserProperty: function(element, property, value) {
            var uProperty = property[0].toUpperCase() + property.substr(1);
            this.setProp(element, 'webkit' + uProperty, value);
            this.setProp(element, 'Moz' + uProperty, value);
            this.setProp(element, 'ms' + uProperty, value);
            this.setProp(element, 'O' + uProperty, value);
            this.setProp(element, property, value);
        },
        setProp: function(element, property, value) {
            if (property in element.style) {
                element.style[property] = value;
            }
        },
        createDragColumn: function(grid, x, columnIndex) {
            var scrollLeft = grid.getHScrollValue();
            var numFixedColumns = grid.getFixedColumnCount();
            var hdpiRatio = grid.getHiDPI(draggerCTX);

            var columnWidth = columnIndex < 0 ? grid.getFixedColumnWidth(numFixedColumns + columnIndex + scrollLeft) : grid.getColumnWidth(columnIndex + scrollLeft);
            var colHeight = grid.clientHeight;
            var d = dragger;

            var location = grid.getBoundingClientRect();
            var style = d.style;
            console.log(location.top);
            style.top = location.top + 'px';
            style.left = location.left + 'px';
            style.position = 'fixed';
            style.opacity = 0.85;
            style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
            //style.zIndex = 100;
            style.borderTop = '1px solid ' + grid.renderer.resolveProperty('lineColor');
            style.backgroundColor = grid.renderer.resolveProperty('backgroundColor');

            d.setAttribute('width', Math.round(columnWidth * hdpiRatio) + 'px');
            d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');

            style.width = columnWidth + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
            style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';

            var startX = grid.renderer.renderedColumnWidths[columnIndex + numFixedColumns];
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
            style.cursor = 'none';
            grid.repaint();

        },

        dragColumn: function(grid, x) {

            //TODO: this function is overly complex, refactor this in to something more reasonable
            var self = this;

            var autoScrollingNow = this.columnDragAutoScrollingRight || this.columnDragAutoScrollingLeft;

            var hdpiRatio = grid.getHiDPI(draggerCTX);

            var dragColumnIndex = grid.renderOverridesCache.dragger.columnIndex;
            var columnWidth = grid.renderOverridesCache.dragger.width;
            var minX = grid.getFixedColumnsWidth();
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
                overCol = grid.renderer.renderedColumns[grid.renderer.renderedColumns.length - 1];
            }

            var doAFloat = dragColumnIndex > overCol;
            doAFloat = doAFloat || (overCol - dragColumnIndex > 1);

            if (doAFloat && !atMax && !autoScrollingNow) {
                var draggedToTheRight = dragColumnIndex < overCol;
                if (draggedToTheRight) {
                    overCol = overCol - 1;
                }
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
            var behavior = grid.getBehavior();
            var scrollLeft = grid.getHScrollValue();
            if (!grid.dragging || scrollLeft > (grid.sbHScrlCfg.rangeStop - 2)) {
                return;
            }
            var draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
            grid.scrollBy(1, 0);
            var newIndex = draggedIndex + scrollLeft + 1;
            behavior.swapColumns(newIndex, draggedIndex + scrollLeft);

            setTimeout(this._checkAutoScrollToRight.bind(this, grid, x), 250);
        },

        findNewPositionOnScrollRight: function(dragIndex) {
            noop(dragIndex);
            //we need to compute the new index of dragIndex if it's assumed to be on the far right and we scroll one cell to the right
            var scrollLeft = this.getHScrollValue();
            var behavior = this.getBehavior();
            //var dragWidth = behavior.getColumnWidth(dragIndex + scrollLeft);
            var bounds = this.canvas.getBounds();

            //lets add the drag width in so we don't have to ignore it in the loop
            var viewWidth = bounds.width() - behavior.getFixedColumnsWidth();
            var max = behavior.getColumnCount();
            for (var c = 0; c < max; c++) {
                var eachColumnWidth = behavior.getColumnWidth(scrollLeft + c);
                viewWidth = viewWidth - eachColumnWidth;
                if (viewWidth < 0) {
                    return c - 2;
                }
            }
            return max - 1;
        },

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
            var behavior = grid.getBehavior();
            var scrollLeft = grid.getHScrollValue();
            if (!grid.dragging || scrollLeft < 1) {
                return;
            }
            var draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
            behavior.swapColumns(draggedIndex + scrollLeft, draggedIndex + scrollLeft - 1);
            grid.scrollBy(-1, 0);
            setTimeout(this._checkAutoScrollToLeft.bind(this, grid, x), 250);
        },

        endDragColumn: function(grid) {
            var self = this;
            var numFixedColumns = grid.getFixedColumnCount();
            var columnIndex = grid.renderOverridesCache.dragger.columnIndex;
            var startX = grid.renderer.renderedColumnWidths[columnIndex + numFixedColumns];
            var d = dragger;

            self.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + columnAnimationTime + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');
            self.setCrossBrowserProperty(d, 'transform', 'translate(' + startX + 'px, ' + -1 + 'px)');
            d.style.boxShadow = '0px 0px 0px #888888';

            setTimeout(function() {
                grid.renderOverridesCache.dragger = null;
                grid.repaint();
                requestAnimationFrame(function() {
                    d.style.display = 'none';
                    grid.getBehavior().endDragColumnNotification();
                });
            }, columnAnimationTime + 50);

        }

    });

})(); /* jshint ignore:line */
