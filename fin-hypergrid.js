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

    Polymer({ /* jslint ignore:line */

        behavior: null,
        /**                                                             .
         * behavior is a property of fin-hypergrid
         *
         * @property behavior
         * @type Object
         */
        mouseDown: null,
        dragExtent: null,
        scrollingNow: false,
        currentDrag: null,
        lastDragCell: null,
        vScrollValue: 0,
        hScrollValue: 0,
        rectangles: null,
        constants: null,
        selectionModel: null,
        oncontextmenu: null,

        domReady: function() {
            var self = this;

            //prevent the default context menu for appearing
            this.oncontextmenu = function(event) {
                event.preventDefault();
                return false;
            };

            this.rectangles = document.createElement('fin-rectangle');
            this.constants = document.createElement('fin-hypergrid-constants').values;
            this.selectionModel = document.createElement('fin-hypergrid-selection-model');
            //this.selectionModel.setGrid(this);

            //setup the model
            var plugins = this.children;

            for (var i = 0; i < plugins.length; i++) {
                var plugin = plugins[i];
                if (plugin.installOn) {
                    plugin.installOn(this);
                }
            }
            // var children = this.children;
            // console.log(children);

            this.mouseDown = this.rectangles.point.create(-1, -1);
            this.dragExtent = this.rectangles.point.create(0, 0);

            this.initCanvas();
            this.initRenderer();
            this.initScrollbars();
            this.initCellEditor();

            //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
            document.body.addEventListener('copy', function(evt) {
                self.checkClipboardCopy(evt);
            });
            this.resized();

        },

        getBehavior: function() {
            return this.behavior;
        },

        //The CellProvider is accessed through Hypergrid because Hypergrid is the mediator and should have ultimate control on where it comes from.  The default is to delegate through the PluggableGridBehavior object.
        getCellProvider: function() {
            var provider = this.getBehavior().getCellProvider();
            return provider;
        },

        //Currently the only CellEditor is an input field.  The structure is in place for handling the CellEditor during focus change and grid scrolling.
        //TODO:Generalize the cell editing functionality to delegate through the behvior objects and then through the cell editors.  Add more general CellEditor types/drop down/button/calendar/spinner/etc...
        initCellEditor: function() {
            var self = this;
            var isEditing = false;
            var editorPoint = this.rectangles.point.create(0, 0);
            var checkEditorPositionFlag = false;

            // var inputTemplate = document.createElement('input');
            // inputTemplate.setAttribute('id', 'editor');
            // shadowRoot.appendChild(inputTemplate);

            var input = this.shadowRoot.querySelector('#editor');


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
                this.setDragExtent(this.rectangles.point.create(0, 0));
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
                var eb = self.getBoundsOfCell(this.rectangles.point.create(x, y));
                var db = self.getDataBounds();
                var cellBounds = eb.intersect(db);
                var translation = 'translate(' + (cellBounds.origin.x - 2) + 'px,' + (cellBounds.origin.y - 2) + 'px)';
                input.style.webkitTransform = translation;
                input.style.MozTransform = translation;
                input.style.msTransform = translation;
                input.style.OTransform = translation;

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
        },

        //This function is a callback from the HypergridRenderer sub-component.   It is called after each paint of the canvas.
        gridRenderedNotification: function() {
            this.updateRenderedSizes();
            this.checkEditor();
        },

        //Notify the PluggableGridBehavior how many rows and columns we just rendered.
        updateRenderedSizes: function() {
            var behavior = this.getBehavior();

            //add one to each of these values as we want also to include
            //the cols and rows that are partially visible
            behavior.setRenderedWidth(this.getViewableCols() + 1);
            behavior.setRenderedHeight(this.getViewableRows() + 1);
        },

        //If we have focus, copy our current selection data to the system clipboard.
        checkClipboardCopy: function(evt) {
            if (!this.hasFocus()) {
                return;
            }
            evt.preventDefault();
            var csvData = this.getSelectionAsTSV();
            evt.clipboardData.setData('text/plain', csvData);
        },

        hasSelections: function() {
            if (!this.getSelectionModel) {
                return; // were not fully initialized yet
            }
            return this.getSelectionModel().hasSelections();
        },

        //Return a tab seperated value string from the selection and our data.
        getSelectionAsTSV: function() {
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
        },

        //Answer if we currently have focus
        hasFocus: function() {
            return this.getCanvas().hasFocus();
        },

        //Clear all the selections out
        clearSelections: function() {
            this.getSelectionModel().clear();
        },

        //Clear just the most recent selection
        clearMostRecentSelection: function() {
            this.getSelectionModel().clearMostRecentSelection();
        },

        //Select a specific region by origin and extent
        select: function(ox, oy, ex, ey) {
            this.getSelectionModel().select(ox, oy, ex, ey);
        },

        //Answer if a specific point is selected
        isSelected: function(x, y) {
            return this.getSelectionModel().isSelected(x, y);
        },

        //Answer if a specific col is selected anywhere in the entire table
        isFixedRowCellSelected: function(col) {
            var selectionModel = this.getSelectionModel();
            var isSelected = selectionModel.isFixedRowCellSelected(col);
            return isSelected;
        },

        //Answer if a specific row is selected anywhere in the entire table
        isFixedColCellSelected: function(row) {
            var selectionModel = this.getSelectionModel();
            var isSelected = selectionModel.isFixedColCellSelected(row);
            return isSelected;
        },

        getSelectionModel: function() {
            return this.selectionModel;
        },

        getMouseDown: function() {
            return this.mouseDown;
        },

        setMouseDown: function(point) {
            this.mouseDown = point;
        },

        getDragExtent: function() {
            return this.dragExtent;
        },

        setDragExtent: function(point) {
            this.dragExtent = point;
        },

        //Set the PluggableBehavior object for this grid control.  This can be done dynamically and is how you configure the self.
        setBehavior: function(behavior) {

            this.behavior = behavior;
            behavior.setGrid(this);

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

            //this.detachRenderer();
            if (this.behavior) {
                //this.attachRenderer();
            }
        },

        behaviorShapeChanged: function() {
            this.synchronizeScrollingBoundries();
        },

        repaint: function() {
            this.getCanvas().repaint();
        },

        //Initialize the [OFCanvas](https://github.com/stevewirts/ofcanvas) component.
        initCanvas: function() {

            var self = this;
            var domCanvas = this.shadowRoot.querySelector('fin-canvas');

            domCanvas.setAttribute('fps', this.constants.repaintIntervalRate || 15);

            this.shadowRoot.appendChild(domCanvas);

            this.canvas = this.shadowRoot.querySelector('fin-canvas');

            this.canvas.style.position = 'absolute';
            this.canvas.style.top = 0;
            this.canvas.style.right = 0;
            //leave room for the vertical scrollbar
            this.canvas.style.marginRight = '15px';
            this.canvas.style.bottom = 0;
            //leave room for the horizontal scrollbar
            this.canvas.style.marginBottom = '15px';
            this.canvas.style.left = 0;

            this.canvas.resizeNotification = function() {
                self.resized();
            };

            this.canvas.addEventListener('fin-mousedown', function(e) {
                self.stopEditing();
                var mouse = e.detail.mouse;
                var cell = self.getCellFromMousePoint(mouse).cell;
                self.mouseDownHandler(cell, e.detail.keys);
            });

            this.canvas.addEventListener('fin-mouseup', function() {
                if (self.scrollingNow) {
                    self.scrollingNow = false;
                }
            });


            this.canvas.addEventListener('fin-drag', function(e) {
                var mouse = e.detail.mouse;
                var cell = self.getCellFromMousePoint(mouse).cell;
                self.currentDrag = mouse;
                self.lastDragCell = cell;
                self.checkDragScroll(e, cell);
                self.mouseDragHandler(cell, e.detail.keys);
            });

            this.canvas.addEventListener('fin-mouseup', function() {
                self.scrollingNow = false;
            });

            this.canvas.addEventListener('fin-keydown', function(e) {
                self.keydown(e);
            });

            this.canvas.addEventListener('fin-click', function(e) {
                var mouse = e.detail.mouse;
                var cell = self.getCellFromMousePoint(mouse);
                self.click(cell);
            });

            this.canvas.addEventListener('fin-dblclick', function(e) {
                var mouse = e.detail.mouse;
                var cell = self.getCellFromMousePoint(mouse);
                self.doubleclick(cell);
            });
        },

        scrollDrag: function() {
            if (!this.scrollingNow) {
                return;
            }
            var b = this.getDataBounds();
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

            this.scrollBy(xOffset, yOffset);
            this.mouseDragHandler(this.lastDragCell, []); // update the selection
            this.repaint();

            setTimeout(this.scrollDrag.bind(this), 25);
        },

        checkDragScroll: function(e) {
            var mouse = e.detail.mouse;
            var b = this.getDataBounds();
            var inside = b.contains(mouse);
            if (inside) {
                if (this.scrollingNow) {
                    this.scrollingNow = false;
                }
            } else if (!this.scrollingNow) {
                this.scrollingNow = true;
                this.scrollDrag();
            }
        },

        getDataBounds: function() {
            var behavior = this.getBehavior();
            var b = this.canvas.bounds;

            var x = behavior.getFixedColsWidth() + 2;
            var y = behavior.getFixedRowsHeight() + 2;

            var result = this.rectangles.rectangle.create(x, y, b.origin.x + b.extent.x - x, b.origin.y + b.extent.y - y);
            return result;
        },

        getCanvas: function() {
            return this.canvas;
        },
        //Delegate the click event to the PluggableBehavior.  We don't want to assume anything about what that may mean if anything.
        click: function(mouse) {
            var behavior = this.getBehavior();
            behavior.delegateClick(this, mouse);
        },

        //Delegate the doubleclick event to the PluggableBehavior.  We don't want to assume anything about what that may mean if anything.
        doubleclick: function(mouse) {
            var behavior = this.getBehavior();
            behavior.delegateDoubleClick(this, mouse);
        },

        //Currently this is called by default from the PluggableBehavior, this piece needs to be reworked to re-delegate back through the PluggableBehavior to let it decide how to edit the cell.
        editAt: function(coordinates) {

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
            this.beginEditAt(this.rectangles.point.create(x, y));
        },

        //Generate a function name and call it on self.  This should also be delegated through PluggableBehavior keeping the default implementation here though.
        keydown: function(e) {
            var command = 'handle' + e.detail.char;
            if (this[command]) {
                this[command].call(this, e.detail);
            }
        },

        //If we are holding down the same navigation key, accelerate the increment we scroll
        getAutoScrollAcceleration: function() {
            var count = 1;
            var elapsed = this.getAutoScrollDuration() / 2000;
            count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
            return count;
        },

        handleDOWNSHIFT: function() {
            var count = this.getAutoScrollAcceleration();
            this.moveShiftSelect(0, count);
        },

        handleUPSHIFT: function() {
            var count = this.getAutoScrollAcceleration();
            this.moveShiftSelect(0, -count);
        },

        handleLEFTSHIFT: function() {
            this.moveShiftSelect(-1, 0);
        },

        handleRIGHTSHIFT: function() {
            this.moveShiftSelect(1, 0);
        },

        handleDOWN: function() {
            var count = this.getAutoScrollAcceleration();
            this.moveSingleSelect(0, count);
        },

        handleUP: function() {
            var count = this.getAutoScrollAcceleration();
            this.moveSingleSelect(0, -count);
        },

        handleLEFT: function() {
            this.moveSingleSelect(-1, 0);
        },

        handleRIGHT: function() {
            this.moveSingleSelect(1, 0);
        },

        //Answer if a specific col is fully visible
        isDataColVisible: function(c) {
            var isVisible = this.getRenderer().isColVisible(c);
            return isVisible;
        },

        //Answer if a specific row is fully visible
        isDataRowVisible: function(r) {
            var isVisible = this.getRenderer().isRowVisible(r);
            return isVisible;
        },

        //Answer if a specific cell (col,row) fully is visible
        isDataVisible: function(c, r) {
            var isVisible = this.isDataRowVisible(r) && this.isDataColVisible(c);
            return isVisible;
        },

        //Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
        moveShiftSelect: function(offsetX, offsetY) {
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

            this.setDragExtent(this.rectangles.point.create(newX, newY));

            this.insureModelColIsViewable(newX + origin.x, offsetX);
            this.insureModelRowIsViewable(newY + origin.y, offsetY);
            this.repaint();

        },

        //Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
        moveSingleSelect: function(offsetX, offsetY) {
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
            this.setMouseDown(this.rectangles.point.create(newX, newY));
            this.setDragExtent(this.rectangles.point.create(0, 0));

            this.insureModelColIsViewable(newX, offsetX);
            this.insureModelRowIsViewable(newY, offsetY);

            this.repaint();

        },

        //Offset indicates the direction we are moving
        insureModelColIsViewable: function(c, offsetX) {
            //-1 because we want only fully visible cols, don't include partially
            //viewable columns
            var viewableCols = this.getViewableCols() - 1;
            if (!this.isDataColVisible(c)) {
                //the scroll position is the leftmost column
                var newSX = offsetX < 0 ? c : c - viewableCols;
                this.setHScrollValue(newSX);
                this.pingAutoScroll();
            }
        },

        //Offset indicates the direction we are moving
        insureModelRowIsViewable: function(r, offsetY) {
            //-1 because we want only fully visible rows, don't include partially
            //viewable rows
            var viewableRows = this.getViewableRows() - 1;
            if (!this.isDataRowVisible(r)) {
                //the scroll position is the topmost row
                var newSY = offsetY < 0 ? r : r - viewableRows;
                this.setVScrollValue(newSY);
                this.pingAutoScroll();
            }
        },

        scrollBy: function(offsetX, offsetY) {
            this.scrollHBy(offsetX);
            this.scrollVBy(offsetY);
        },

        scrollVBy: function(offsetY) {
            var max = this.getScrollConfigs().vertical.rangeStop;
            var oldValue = this.getVScrollValue();
            var newValue = Math.min(max, Math.max(0, oldValue + offsetY));
            if (newValue === oldValue) {
                return;
            }
            this.setVScrollValue(newValue);
        },

        scrollHBy: function(offsetX) {
            var max = this.getScrollConfigs().horizontal.rangeStop;
            var oldValue = this.getHScrollValue();
            var newValue = Math.min(max, Math.max(0, oldValue + offsetX));
            if (newValue === oldValue) {
                return;
            }
            this.setHScrollValue(newValue);
        },

        //Handle a mousedrag selection
        mouseDragHandler: function(mouse /* ,keys */ ) {

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

            var newDragExtent = this.rectangles.point.create(newX, newY);
            this.setDragExtent(newDragExtent);

            this.repaint();
        },

        //Handle a mousedown event
        mouseDownHandler: function(mouse, keys) {

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
                this.setDragExtent(this.rectangles.point.create(x + scrollLeft - mousePoint.x, y + scrollTop - mousePoint.y));
            } else {
                this.select(x + scrollLeft, y + scrollTop, 0, 0);
                this.setMouseDown(this.rectangles.point.create(x + scrollLeft, y + scrollTop));
                this.setDragExtent(this.rectangles.point.create(0, 0));
            }
            this.repaint();
        },

        //Answer which data cell is under a pixel value mouse point
        getCellFromMousePoint: function(mouse) {
            var cell = this.getRenderer().getCellFromMousePoint(mouse);
            return cell;
        },

        //Answer pixel based bounds rectangle given a data cell point
        getBoundsOfCell: function(cell) {
            var bounds = this.getRenderer().getBoundsOfCell(cell);
            return bounds;
        },

        //This is called by the OFCanvas when a resize occurs
        resized: function() {
            this.synchronizeScrollingBoundries();
        },

        setVScrollValue: function(y) {
            this.getBehavior().setScrollPositionY(y);
            this.vScrollValue = y;
            this.scrollValueChangedNotification();
        },

        getVScrollValue: function() {
            return this.vScrollValue;
        },

        setHScrollValue: function(x) {
            this.getBehavior().setScrollPositionX(x);
            this.hScrollValue = x;
            this.scrollValueChangedNotification();
        },

        getHScrollValue: function() {
            return this.hScrollValue;
        },

        takeFocus: function() {
            if (this.isEditing()) {
                this.editorTakeFocus();
            }
            this.getCanvas().takeFocus();
        },

        //Initialize the scrollbars.
        //<br>TODO:This should be refactored into its own file.
        initScrollbars: function() {

            var self = this;
            var canvas = this.getCanvas();

            var scrollbars = this.shadowRoot.querySelectorAll('fin-vampire-bar');
            this.hscroller = scrollbars[0];

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
                var point = self.rectangles.point.create(e.x - origin.x, e.y - origin.y);
                if (!canvas.bounds.contains(point)) {
                    //it's a mouseup on the scrollbars we need to retake focus
                    self.takeFocus();
                }
            });

            this.vscroller = scrollbars[1];
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

            this.hscroller.setRangeAdapter(this.hscroller.createRangeAdapter(hValueHolder, hScrollConfig));

            this.scrollConfigs = {
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

            this.vscroller.setRangeAdapter(this.hscroller.createRangeAdapter(vValueHolder, vScrollConfig));

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
                return this.scrollConfigs;
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
            this.synchronizeScrollingBoundries = function() {

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

                this.vscroller.tickle();
                this.hscroller.tickle();
            };

        },

        //Answers the number of viewable rows, including any partially viewable rows.
        getViewableRows: function() {
            return this.getRenderer().getViewableRows();
        },

        //Answers the number of viewable cols, including any partially viewable cols.
        getViewableCols: function() {
            return this.getRenderer().getViewableCols();
        },

        //Initialize the GridRenderering sub-component.
        initRenderer: function() {

            this.renderer = this.shadowRoot.querySelector('fin-hypergrid-renderer');
            this.renderer.setGrid(this);
            // var props = {
            //     top: [0, 0],
            //     right: [1, 0],
            //     bottom: [1, 0],
            //     left: [0, 0]
            // };
            // this.renderer.setLayoutProperties(props);

        },
        getRenderer: function() {
            return this.renderer;
        },

        //Initialize the various pieces of the self.

    });

})(); /* jslint ignore:line */
