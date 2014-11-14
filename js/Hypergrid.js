//The OpenFin Hypergrid is a high performant canvas based general grid control.  It is implemented as a HTML5 web-component. [see web-components](http://www.w3.org/TR/components-intro/).
// * The Hypergrid is dependent on several other OpenFin projects
//  * of-canvas: a wrapper to provid a simpler interface to the HTML5 canvas component
//  * rectangles: a small library providing Point and Rectangle objects
//  * shadow-bar: a web-component based general scroll bar control

//### Pluggable Grid Behaviors
//The Hypergrid design makes no assumptions about the data you wish to view which allows for external data sources and external manipulation and analytics.  Manipulations such as sorting, aggregation, and grouping can be achieved using best of breed high-performant real time tools designed for such purposes. All the code that impacts these operations has been factored into an Object called [PluggableGridBehavior](DefaultGridBehavior.html).  A PluggableGridBehavior can be thought of as a traditional tablemodel but with a little more responsibility.  There are Three example PluggableGridBehaviors provided, the base or DefaultGridBehavior, a QGridBehavior, and an InMemoryGridBehavior.

/* globals document, alert */

'use strict';

(function() {
    var root = this;
    var shadowbars = {
        RangeAdapter: function() {
            return {

            };
        }
    };
    var HypergridRenderer = root.fin.wc.hypergrid.HypergridRenderer;
    var DefaultSelectionModel = root.fin.wc.hypergrid.DefaultSelectionModel;

    var initInstance = function(self) {

        var rectangles = document.createElement('fin-rectangle');
        var constants = root.fin.wc.hypergrid.constants;


        self.behavior = null;
        //prevent the default context menu for appearing
        self.oncontextmenu = function(event) {
            event.preventDefault();
            return false;
        };



        self.getBehavior = function() {
            return this.behavior;
        };

        //The CellProvider is accessed through Hypergrid because Hypergrid is the mediator and should have ultimate control on where it comes from.  The default is to delegate through the PluggableGridBehavior object.
        self.getCellProvider = function() {
            var provider = this.getBehavior().getCellProvider();
            return provider;
        };

        //Currently the only CellEditor is an input field.  The structure is in place for handling the CellEditor during focus change and grid scrolling.
        //TODO:Generalize the cell editing functionality to delegate through the behvior objects and then through the cell editors.  Add more general CellEditor types/drop down/button/calendar/spinner/etc...
        self.initCellEditor = function() {
            var self = this;
            var shadowRoot = this.getShadowRoot();
            var isEditing = false;
            var editorPoint = new rectangles.create.Point(0, 0);
            var checkEditorPositionFlag = false;

            var inputTemplate = document.createElement('input');
            inputTemplate.setAttribute('id', 'editor');
            shadowRoot.appendChild(inputTemplate);

            var input = shadowRoot.querySelector('#editor');

            input.style.position = 'absolute';
            input.style.display = 'none';
            input.style.border = 'solid 2px black';
            input.style.outline = 0;
            input.style.padding = 0;
            input.addEventListener('keypress', function(e) {
                if (e && e.keyCode === 13) {
                    e.preventDefault();
                    self.stopEditing();
                    self.repaint();
                    self.takeFocus();
                }
            });

            this.setCheckEditorPositionFlag = function() {
                checkEditorPositionFlag = true;
            };

            this.beginEditAt = function(point) {
                this.setMouseDown(point);
                this.setDragExtent(new rectangles.create.Point(0, 0));
                var model = this.getBehavior();
                this.setEditorPoint(point);
                var value = model.getValue(point.x, point.y);
                input.value = value + '';
                isEditing = true;
                self.setCheckEditorPositionFlag();
                this.checkEditor();
            };

            this.getEditorPoint = function() {
                return editorPoint;
            };

            this.setEditorPoint = function(point) {
                editorPoint = point;
            };

            this.showEditor = function() {
                input.style.display = 'inline';
            };

            this.hideEditor = function() {
                input.style.display = 'none';
            };

            this.isEditing = function() {
                return isEditing;
            };

            this.stopEditing = function() {
                if (!isEditing) {
                    return;
                }
                this.saveEditorValue();
                isEditing = false;
                this.hideEditor();
            };

            this.saveEditorValue = function() {
                var point = this.getEditorPoint();
                var value = this.getEditorValue();
                this.getBehavior().setValue(point.x, point.y, value);
            };

            this.getEditorValue = function() {
                var value = input.value;
                return value;
            };

            this.editorTakeFocus = function() {
                setTimeout(function() {
                    input.focus();
                    input.setSelectionRange(0, input.value.length);
                }, 500);
            };

            this.moveEditor = function() {
                var model = this.getBehavior();
                var numFixedCols = model.getFixedColCount();
                var numFixedRows = model.getFixedRowCount();
                var vScroll = self.getVScrollValue();
                var hScroll = self.getHScrollValue();
                var editorPoint = this.getEditorPoint();
                var x = editorPoint.x + numFixedCols - hScroll;
                var y = editorPoint.y + numFixedRows - vScroll;
                var eb = self.getBoundsOfCell(new rectangles.create.Point(x, y));
                var db = self.getDataBounds();
                var cellBounds = eb.intersect(db);
                var translation = 'translate(' + (cellBounds.origin.x - 2) + 'px,' + (cellBounds.origin.y - 2) + 'px)';
                input.style.webkitTransform = translation;
                input.style.MozTransform = translation;
                input.style.msTransform = translation;
                input.style.OTransform = translation;
                input.style.transform = translation;

                input.style.width = cellBounds.extent.x + 'px';
                input.style.height = cellBounds.extent.y + 'px';
                this.editorTakeFocus();
            };

            this.checkEditor = function() {
                if (!checkEditorPositionFlag) {
                    return;
                } else {
                    checkEditorPositionFlag = false;
                }
                if (!this.isEditing()) {
                    return;
                }
                var editorPoint = this.getEditorPoint();
                if (this.isDataVisible(editorPoint.x, editorPoint.y)) {
                    this.moveEditor();
                    this.showEditor();
                } else {
                    this.hideEditor();
                }
            };
        };

        //This function is a callback from the HypergridRenderer sub-component.   It is called after each paint of the canvas.
        self.gridRenderedNotification = function() {
            this.updateRenderedSizes();
            this.checkEditor();
        };

        //Notify the PluggableGridBehavior how many rows and columns we just rendered.
        self.updateRenderedSizes = function() {
            var behavior = this.getBehavior();

            //add one to each of these values as we want also to include
            //the cols and rows that are partially visible
            behavior.setRenderedWidth(this.getViewableCols() + 1);
            behavior.setRenderedHeight(this.getViewableRows() + 1);
        };

        //If we have focus, copy our current selection data to the system clipboard.
        self.checkClipboardCopy = function(evt) {
            if (!this.hasFocus()) {
                return;
            }
            evt.preventDefault();
            var csvData = this.getSelectionAsTSV();
            evt.clipboardData.setData('text/plain', csvData);
        };

        self.hasSelections = function() {
            if (!this.getSelectionModel) {
                return; // were not fully initialized yet
            }
            return this.getSelectionModel().hasSelections();
        };

        //Return a tab seperated value string from the selection and our data.
        self.getSelectionAsTSV = function() {
            //only use the data from the last selection
            var selectionModel = this.getSelectionModel();
            var selections = selectionModel.getSelections();
            if (selections.length === 0) {
                return;
            }
            var last = selections[selections.length - 1];
            var area = last.area();
            //disallow if selection is too big
            if (area > 10000) {
                alert('selection size is too big to copy to the paste buffer');
                return '';
            }
            var behavior = this.getBehavior();
            var collector = [];
            var xstart = last.origin.x;
            var xstop = last.origin.x + last.extent.x + 1;
            var ystart = last.origin.y;
            var ystop = last.origin.y + last.extent.y + 1;
            for (var y = ystart; y < ystop; y++) {
                for (var x = xstart; x < xstop; x++) {
                    var data = behavior.getValue(x, y);
                    collector.push(data);
                    if (x !== xstop - 1) {
                        collector.push('\t');
                    }
                }
                if (y !== ystop - 1) {
                    collector.push('\n');
                }
            }
            var text = collector.join('');
            return text;
        };

        //Answer if we currently have focus
        self.hasFocus = function() {
            return this.getCanvas().hasFocus();
        };

        //Clear all the selections out
        self.clearSelections = function() {
            this.getSelectionModel().clear();
        };

        //Clear just the most recent selection
        self.clearMostRecentSelection = function() {
            this.getSelectionModel().clearMostRecentSelection();
        };

        //Select a specific region by origin and extent
        self.select = function(ox, oy, ex, ey) {
            this.getSelectionModel().select(ox, oy, ex, ey);
        };

        //Answer if a specific point is selected
        self.isSelected = function(x, y) {
            return this.getSelectionModel().isSelected(x, y);
        };

        //Answer if a specific col is selected anywhere in the entire table
        self.isFixedRowCellSelected = function(col) {
            var selectionModel = this.getSelectionModel();
            var isSelected = selectionModel.isFixedRowCellSelected(col);
            return isSelected;
        };

        //Answer if a specific row is selected anywhere in the entire table
        self.isFixedColCellSelected = function(row) {
            var selectionModel = this.getSelectionModel();
            var isSelected = selectionModel.isFixedColCellSelected(row);
            return isSelected;
        };

        //Initialize our selectionmodel
        self.initSelectionModel = function() {

            var mouseDown = new rectangles.create.Point(-1, -1);
            var dragExtent = new rectangles.create.Point(0, 0);
            var selectionModel = new DefaultSelectionModel(this);

            this.getSelectionModel = function() {
                return selectionModel;
            };

            this.getMouseDown = function() {
                return mouseDown;
            };

            this.setMouseDown = function(point) {
                mouseDown = point;
            };

            this.getDragExtent = function() {
                return dragExtent;
            };

            this.setDragExtent = function(point) {
                dragExtent = point;
            };

        };

        //Set the PluggableBehavior object for this grid control.  This can be done dynamically and is how you configure the self.
        self.setBehavior = function(behavior) {

            var self = this;

            var numCols = behavior.getColCount();
            var numRows = behavior.getRowCount();

            behavior.changed = function() {
                if (numCols !== behavior.getColCount() || numRows !== behavior.getRowCount()) {
                    numCols = behavior.getColCount();
                    numRows = behavior.getRowCount();
                    self.behaviorShapeChanged();
                }
                self.repaint();
            };

            behavior.sizeChanged = function() {
                self.repaint();
            };

            this.getBehavior = function() {
                return behavior;
            };

            this.detachRenderer();
            if (behavior) {
                this.attachRenderer();
            }
        };

        self.behaviorShapeChanged = function() {
            this.syncronizeScrollingBoundries();
        };

        self.repaint = function() {
            this.getCanvas().repaint();
        };

        self.initShadowRoot = function() {
            this.getShadowRoot = function() {
                return this.shadowRoot;
            };
        };

        //Initialize the [OFCanvas](https://github.com/stevewirts/ofcanvas) component.
        self.initCanvas = function() {

            var self = this;
            var shadowRoot = this.getShadowRoot();
            var domCanvas = shadowRoot.querySelector('fin-canvas');

            domCanvas.setAttribute('fps', constants.repaintIntervalRate || 15);

            shadowRoot.appendChild(domCanvas);

            var canvas = shadowRoot.querySelector('fin-canvas');

            canvas.style.position = 'absolute';
            canvas.style.top = 0;
            canvas.style.right = 0;
            //leave room for the vertical scrollbar
            canvas.style.marginRight = '15px';
            canvas.style.bottom = 0;
            //leave room for the horizontal scrollbar
            canvas.style.marginBottom = '15px';
            canvas.style.left = 0;

            canvas.resizeNotification = function() {
                self.resized();
            };

            this.getCanvas = function() {
                return canvas;
            };

            canvas.addEventListener('of-mousedown', function(e) {
                self.stopEditing();
                var mouse = e.detail.mouse;
                var cell = self.getCellFromMousePoint(mouse).cell;
                self.mouseDown(cell, e.detail.keys);
            });

            var scrollingNow = false;
            var currentDrag = null;
            var lastDragCell = null;

            var scrollDrag = function() {
                if (!scrollingNow) {
                    return;
                }
                var b = self.getDataBounds();
                var xOffset = 0;
                var yOffset = 0;
                if (currentDrag.x < b.origin.x) {
                    xOffset = -1;
                }
                if (currentDrag.x > b.origin.x + b.extent.x) {
                    xOffset = 1;
                }
                if (currentDrag.y < b.origin.y) {
                    yOffset = -1;
                }
                if (currentDrag.y > b.origin.y + b.extent.y) {
                    yOffset = 1;
                }

                self.scrollBy(xOffset, yOffset);
                self.drag(lastDragCell, []); // update the selection
                self.repaint();

                setTimeout(scrollDrag, 25);
            };

            canvas.addEventListener('of-mouseup', function() {
                if (scrollingNow) {
                    scrollingNow = false;
                }
            });

            var checkDragScroll = function(e) {
                var mouse = e.detail.mouse;
                var b = self.getDataBounds();
                var inside = b.contains(mouse);
                if (inside) {
                    if (scrollingNow) {
                        scrollingNow = false;
                    }
                } else if (!scrollingNow) {
                    scrollingNow = true;
                    scrollDrag();
                }
            };

            self.getDataBounds = function() {
                var behavior = self.getBehavior();
                var b = canvas.bounds;

                var x = behavior.getFixedColsWidth() + 2;
                var y = behavior.getFixedRowsHeight() + 2;

                var result = new rectangles.create.Rectangle(x, y, b.origin.x + b.extent.x - x, b.origin.y + b.extent.y - y);
                return result;
            };

            canvas.addEventListener('of-drag', function(e) {
                var mouse = e.detail.mouse;
                var cell = self.getCellFromMousePoint(mouse).cell;
                currentDrag = mouse;
                lastDragCell = cell;
                checkDragScroll(e, cell);
                self.drag(cell, e.detail.keys);
            });

            canvas.addEventListener('of-mouseup', function() {
                scrollingNow = false;
            });

            canvas.addEventListener('of-keydown', function(e) {
                self.keydown(e);
            });

            canvas.addEventListener('of-click', function(e) {
                var mouse = e.detail.mouse;
                var cell = self.getCellFromMousePoint(mouse);
                self.click(cell);
            });

            canvas.addEventListener('of-dblclick', function(e) {
                var mouse = e.detail.mouse;
                var cell = self.getCellFromMousePoint(mouse);
                self.doubleclick(cell);
            });

        };

        //Delegate the click event to the PluggableBehavior.  We don't want to assume anything about what that may mean if anything.
        self.click = function(mouse) {
            var behavior = this.getBehavior();
            behavior.delegateClick(this, mouse);
        };

        //Delegate the doubleclick event to the PluggableBehavior.  We don't want to assume anything about what that may mean if anything.
        self.doubleclick = function(mouse) {
            var behavior = this.getBehavior();
            behavior.delegateDoubleClick(this, mouse);
        };

        //Currently this is called by default from the PluggableBehavior, this piece needs to be reworked to re-delegate back through the PluggableBehavior to let it decide how to edit the cell.
        self.editAt = function(coordinates) {

            var cell = coordinates.cell;
            var behavior = this.getBehavior();
            var scrollTop = this.getVScrollValue();
            var scrollLeft = this.getHScrollValue();

            var numFixedCols = behavior.getFixedColCount();
            var numFixedRows = behavior.getFixedRowCount();

            var x = cell.x - numFixedCols + scrollLeft;
            var y = cell.y - numFixedRows + scrollTop;

            if (x < 0 || y < 0) {
                return;
            }
            this.beginEditAt(new rectangles.create.Point(x, y));
        };

        //Generate a function name and call it on self.  This should also be delegated through PluggableBehavior keeping the default implementation here though.
        self.keydown = function(e) {
            var command = 'handle' + e.detail.char;
            if (this[command]) {
                this[command].call(this, e.detail);
            }
        };

        //If we are holding down the same navigation key, accelerate the increment we scroll
        self.getAutoScrollAcceleration = function() {
            var count = 1;
            var elapsed = this.getAutoScrollDuration() / 2000;
            count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
            return count;
        };

        self.handleDOWNSHIFT = function() {
            var count = this.getAutoScrollAcceleration();
            this.moveShiftSelect(0, count);
        };

        self.handleUPSHIFT = function() {
            var count = this.getAutoScrollAcceleration();
            this.moveShiftSelect(0, -count);
        };

        self.handleLEFTSHIFT = function() {
            this.moveShiftSelect(-1, 0);
        };

        self.handleRIGHTSHIFT = function() {
            this.moveShiftSelect(1, 0);
        };

        self.handleDOWN = function() {
            var count = this.getAutoScrollAcceleration();
            this.moveSingleSelect(0, count);
        };

        self.handleUP = function() {
            var count = this.getAutoScrollAcceleration();
            this.moveSingleSelect(0, -count);
        };

        self.handleLEFT = function() {
            this.moveSingleSelect(-1, 0);
        };

        self.handleRIGHT = function() {
            this.moveSingleSelect(1, 0);
        };

        //Answer if a specific col is fully visible
        self.isDataColVisible = function(c) {
            var isVisible = this.getRenderer().isColVisible(c);
            return isVisible;
        };

        //Answer if a specific row is fully visible
        self.isDataRowVisible = function(r) {
            var isVisible = this.getRenderer().isRowVisible(r);
            return isVisible;
        };

        //Answer if a specific cell (col,row) fully is visible
        self.isDataVisible = function(c, r) {
            var isVisible = this.isDataRowVisible(r) && this.isDataColVisible(c);
            return isVisible;
        };

        //Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
        self.moveShiftSelect = function(offsetX, offsetY) {
            var behavior = this.getBehavior();

            var maxCols = behavior.getColCount() - 1;
            var maxRows = behavior.getRowCount() - 1;

            var origin = this.getMouseDown();
            var extent = this.getDragExtent();

            var newX = extent.x + offsetX;
            var newY = extent.y + offsetY;

            newX = Math.min(maxCols - origin.x, Math.max(-origin.x, newX));
            newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

            this.clearMostRecentSelection();
            this.select(origin.x, origin.y, newX, newY);

            this.setDragExtent(new rectangles.create.Point(newX, newY));

            this.insureModelColIsViewable(newX + origin.x, offsetX);
            this.insureModelRowIsViewable(newY + origin.y, offsetY);
            this.repaint();

        };

        //Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
        self.moveSingleSelect = function(offsetX, offsetY) {
            var behavior = this.getBehavior();

            var maxCols = behavior.getColCount() - 1;
            var maxRows = behavior.getRowCount() - 1;

            var mouseCorner = this.getMouseDown().plus(this.getDragExtent());

            var newX = mouseCorner.x + offsetX;
            var newY = mouseCorner.y + offsetY;

            newX = Math.min(maxCols, Math.max(0, newX));
            newY = Math.min(maxRows, Math.max(0, newY));

            this.clearSelections();
            this.select(newX, newY, 0, 0);
            this.setMouseDown(new rectangles.create.Point(newX, newY));
            this.setDragExtent(new rectangles.create.Point(0, 0));

            this.insureModelColIsViewable(newX, offsetX);
            this.insureModelRowIsViewable(newY, offsetY);

            this.repaint();

        };

        //Offset indicates the direction we are moving
        self.insureModelColIsViewable = function(c, offsetX) {
            //-1 because we want only fully visible cols, don't include partially
            //viewable columns
            var viewableCols = this.getViewableCols() - 1;
            if (!this.isDataColVisible(c)) {
                //the scroll position is the leftmost column
                var newSX = offsetX < 0 ? c : c - viewableCols;
                this.setHScrollValue(newSX);
                this.pingAutoScroll();
            }
        };

        //Offset indicates the direction we are moving
        self.insureModelRowIsViewable = function(r, offsetY) {
            //-1 because we want only fully visible rows, don't include partially
            //viewable rows
            var viewableRows = this.getViewableRows() - 1;
            if (!this.isDataRowVisible(r)) {
                //the scroll position is the topmost row
                var newSY = offsetY < 0 ? r : r - viewableRows;
                this.setVScrollValue(newSY);
                this.pingAutoScroll();
            }

        };

        self.scrollBy = function(offsetX, offsetY) {
            this.scrollHBy(offsetX);
            this.scrollVBy(offsetY);
        };

        self.scrollVBy = function(offsetY) {
            var max = this.getScrollConfigs().vertical.rangeStop;
            var oldValue = this.getVScrollValue();
            var newValue = Math.min(max, Math.max(0, oldValue + offsetY));
            if (newValue === oldValue) {
                return;
            }
            this.setVScrollValue(newValue);
        };

        self.scrollHBy = function(offsetX) {
            var max = this.getScrollConfigs().horizontal.rangeStop;
            var oldValue = this.getHScrollValue();
            var newValue = Math.min(max, Math.max(0, oldValue + offsetX));
            if (newValue === oldValue) {
                return;
            }
            this.setHScrollValue(newValue);
        };

        //Handle a mousedrag selection
        self.drag = function(mouse /* ,keys */ ) {

            var behavior = this.getBehavior();

            var scrollTop = this.getVScrollValue();
            var scrollLeft = this.getHScrollValue();

            var numFixedCols = behavior.getFixedColCount();
            var numFixedRows = behavior.getFixedRowCount();

            var x = mouse.x - numFixedCols;
            var y = mouse.y - numFixedRows;

            x = Math.max(0, x);
            y = Math.max(0, y);

            var previousDragExtent = this.getDragExtent();
            var mouseDown = this.getMouseDown();

            var newX = x + scrollLeft - mouseDown.x;
            var newY = y + scrollTop - mouseDown.y;

            if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
                return;
            }

            this.clearMostRecentSelection();

            this.select(mouseDown.x, mouseDown.y, newX, newY);

            var newDragExtent = new rectangles.create.Point(newX, newY);
            this.setDragExtent(newDragExtent);

            this.repaint();
        };

        //Handle a mousedown event
        self.mouseDown = function(mouse, keys) {

            var behavior = this.getBehavior();
            var hasCTRL = keys.indexOf('CTRL') !== -1;
            var hasSHIFT = keys.indexOf('SHIFT') !== -1;
            var scrollTop = this.getVScrollValue();
            var scrollLeft = this.getHScrollValue();

            var numFixedCols = behavior.getFixedColCount();
            var numFixedRows = behavior.getFixedRowCount();

            var mousePoint = this.getMouseDown();
            var x = mouse.x - numFixedCols;
            var y = mouse.y - numFixedRows;

            if (x < 0 || y < 0) {
                return;
            }

            if (!hasCTRL && !hasSHIFT) {
                this.clearSelections();
            }

            if (hasSHIFT) {
                this.clearMostRecentSelection();
                this.select(mousePoint.x, mousePoint.y, x + scrollLeft - mousePoint.x, y + scrollTop - mousePoint.y);
                this.setDragExtent(new rectangles.create.Point(x + scrollLeft - mousePoint.x, y + scrollTop - mousePoint.y));
            } else {
                this.select(x + scrollLeft, y + scrollTop, 0, 0);
                this.setMouseDown(new rectangles.create.Point(x + scrollLeft, y + scrollTop));
                this.setDragExtent(new rectangles.create.Point(0, 0));
            }
            this.repaint();
        };

        //Answer which data cell is under a pixel value mouse point
        self.getCellFromMousePoint = function(mouse) {
            var cell = this.getRenderer().getCellFromMousePoint(mouse);
            return cell;
        };

        //Answer pixel based bounds rectangle given a data cell point
        self.getBoundsOfCell = function(cell) {
            var bounds = this.getRenderer().getBoundsOfCell(cell);
            return bounds;
        };

        //Create a [shadow-bar](https://github.com/datamadic/shadow-bar) scrollbar instance
        var createScrollbar = function(isHorizontal) {
            var scroller = document.createElement('scroll-bar');
            scroller.style.position = 'absolute';
            scroller.style.top = 0;
            scroller.style.right = 0;
            scroller.style.bottom = 0;
            scroller.style.left = 0;
            scroller.style.marginTop = 0;
            scroller.style.marginLeft = 0;
            scroller.style.marginBottom = '15px';
            scroller.style.marginRight = '15px';

            if (isHorizontal) {
                scroller.setAttribute('horizontal', true);
                scroller.style.top = '100%';
                scroller.style.marginTop = '-15px';
            } else {
                scroller.style.left = '100%';
                scroller.style.marginLeft = '-15px';
            }

            scroller.setRangeAdapter = function() {};
            scroller.tickle = function() {};
            return scroller;
        };

        //This is called by the OFCanvas when a resize occurs
        self.resized = function() {
            this.syncronizeScrollingBoundries();
        };

        self.setVScrollValue = function(y) {
            this.getBehavior().setScrollTop(y);
            this.vScrollValue = y;
            this.scrollValueChangedNotification();
        };

        self.getVScrollValue = function() {
            return this.vScrollValue;
        };

        self.setHScrollValue = function(x) {
            this.getBehavior().setScrollLeft(x);
            this.hScrollValue = x;
            this.scrollValueChangedNotification();
        };

        self.getHScrollValue = function() {
            return this.hScrollValue;
        };

        self.takeFocus = function() {
            if (this.isEditing()) {
                this.editorTakeFocus();
            }
            this.getCanvas().takeFocus();
        };

        //Initialize the scrollbars.
        //<br>TODO:This should be refactored into its own file.
        self.initScrollbars = function() {


            this.vScrollValue = 0;
            this.hScrollValue = 0;

            var self = this;
            var shadowRoot = this.getShadowRoot();
            var canvas = this.getCanvas();

            shadowRoot.appendChild(createScrollbar(true));
            shadowRoot.appendChild(createScrollbar(false));

            var scrollbars = shadowRoot.querySelectorAll('scroll-bar');
            var hscroller = scrollbars[0];

            var mouseIsDown = false;
            this.addEventListener('mousedown', function() {
                mouseIsDown = true;
            });

            document.addEventListener('mouseup', function(e) {
                if (!mouseIsDown) {
                    return;
                }
                mouseIsDown = false;
                var origin = canvas.getOrigin();
                var point = new rectangles.create.Point(e.x - origin.x, e.y - origin.y);
                if (!canvas.bounds.contains(point)) {
                    //it's a mouseup on the scrollbars we need to retake focus
                    self.takeFocus();
                }
            });

            var vscroller = scrollbars[1];
            var hScrollConfig = {
                step: 1,
                page: 40,
                rangeStart: 0,
                rangeStop: 0
            };
            var vScrollConfig = {
                step: 1,
                page: 40,
                rangeStart: 0,
                rangeStop: 0
            };

            var hValueHolder = {
                changed: false,
                getValue: function() {
                    return self.getHScrollValue();
                },
                setValue: function(v) {
                    return self.setHScrollValue(v);
                },
            };

            hscroller.setRangeAdapter(new shadowbars.RangeAdapter(hValueHolder, hScrollConfig));

            var scrollConfigs = {
                vertical: vScrollConfig,
                horizontal: hScrollConfig
            };

            var vValueHolder = {
                getValue: function() {
                    return self.getVScrollValue();
                },
                setValue: function(v) {
                    return self.setVScrollValue(v);
                },
            };

            vscroller.setRangeAdapter(new shadowbars.RangeAdapter(vValueHolder, vScrollConfig));

            //provide a way to notify scrollbars that the underlying data has changed
            //the real solution is to use an aspect adapter here
            var previousVScrollValue = null;
            var previousHScrollValue = null;
            this.scrollValueChangedNotification = function() {

                if (this.hScrollValue === previousHScrollValue && this.vScrollValue === previousVScrollValue) {
                    return;
                }

                hValueHolder.changed = !hValueHolder.changed;
                vValueHolder.changed = !vValueHolder.changed;

                previousHScrollValue = this.hScrollValue;
                previousVScrollValue = this.vScrollValue;

                self.setCheckEditorPositionFlag();
            };

            this.getScrollConfigs = function() {
                return scrollConfigs;
            };

            var lastAutoScroll = 0;
            var autoScrollStartTime = 0;

            var setAutoScrollStartTime = function() {
                autoScrollStartTime = Date.now();
            };

            this.pingAutoScroll = function() {
                var now = Date.now();
                if (now - lastAutoScroll > 500) {
                    setAutoScrollStartTime();
                }
                lastAutoScroll = Date.now();
            };

            this.getAutoScrollDuration = function() {
                if (Date.now() - lastAutoScroll > 500) {
                    return 0;
                }
                return Date.now() - autoScrollStartTime;
            };
            this.setValue = function(x, y, value) {
                this.getBehavior().setValue(x, y, value);
                this.repaint();
            };
            this.syncronizeScrollingBoundries = function() {

                var behavior = this.getBehavior();
                if (!behavior) {
                    return;
                }
                var numCols = behavior.getColCount();
                var numRows = behavior.getRowCount();
                var bounds = this.getCanvas().getBounds();
                var scrollableHeight = bounds.height() - behavior.getFixedRowsHeight();
                var scrollableWidth = bounds.width() - behavior.getFixedColsMaxWidth();

                var lastPageColCount = 0;
                var colsWidth = 0;
                for (; lastPageColCount < numCols; lastPageColCount++) {
                    var eachWidth = behavior.getColWidth(numCols - lastPageColCount - 1);
                    colsWidth = colsWidth + eachWidth;
                    if (colsWidth > scrollableWidth) {
                        break;
                    }
                }

                var lastPageRowCount = 0;
                var rowsHeight = 0;
                for (; lastPageRowCount < numRows; lastPageRowCount++) {
                    var eachHeight = behavior.getRowHeight(numRows - lastPageRowCount - 1);
                    rowsHeight = rowsHeight + eachHeight;
                    if (rowsHeight > scrollableHeight) {
                        break;
                    }
                }

                vScrollConfig.rangeStop = behavior.getRowCount() - lastPageRowCount;

                hScrollConfig.rangeStop = behavior.getColCount() - lastPageColCount;

                vscroller.tickle();
                hscroller.tickle();
            };

        };

        //Answers the number of viewable rows, including any partially viewable rows.
        self.getViewableRows = function() {
            return this.getRenderer().getViewableRows();
        };

        //Answers the number of viewable cols, including any partially viewable cols.
        self.getViewableCols = function() {
            return this.getRenderer().getViewableCols();
        };

        //Initialize the GridRenderering sub-component.
        self.initGridRenderer = function() {

            var canvas = this.getCanvas();
            var renderer = new HypergridRenderer(this);
            var props = {
                top: [0, 0],
                right: [1, 0],
                bottom: [1, 0],
                left: [0, 0]
            };
            renderer.setLayoutProperties(props);

            this.getRenderer = function() {
                return renderer;
            };
            this.attachRenderer = function() {
                canvas.addComponent(renderer);
            };
            this.detachRenderer = function() {
                canvas.clearComponents();
            };
        };

        //Initialize the various pieces of the self.
        self.initSelectionModel();
        self.initShadowRoot();
        self.initCanvas();
        self.initGridRenderer();
        self.initScrollbars();
        self.initCellEditor();

        self.style.webkitUserSelect = 'none';
        /* Chrome all / Safari all */
        self.style.MozUserSelect = 'none';
        /* Firefox all */
        self.style.msUserSelect = 'none';
        /* IE 10+ */
        /* No support for these yet, use at own risk */
        self.style.oUserSelect = 'none';
        self.style.userSelect = 'none';

        //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
        document.body.addEventListener('copy', function(evt) {
            self.checkClipboardCopy(evt);
        });
        self.resized();
    };

    root.fin = root.fin || {};
    root.fin.wc = root.fin.wc || {};
    root.fin.wc.hypergrid = root.fin.wc.hypergrid || {};
    root.fin.wc.hypergrid.Hypergrid = initInstance;

}).call(this); /* jslint ignore:line */
