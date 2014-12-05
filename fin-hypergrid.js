/* globals document, alert */

'use strict';

(function() {

    Polymer({ /* jslint ignore:line */

        /**                                                             .
         * behavior is a property of fin-hypergrid
         *
         * @property behavior
         * @type fin-hypergrid-behavior
         */
        behavior: null,

        /**                                                             .
         * mouseDown is a property of fin-hypergrid
         *
         * @property mouseDown
         * @type boolean
         */
        mouseDown: null,

        /**                                                             .
         * dragExtent is a property of fin-hypergrid
         *
         * @property dragExtent
         * @type fin-rectangle.point
         */
        dragExtent: null,

        /**                                                             .
         * scrollingNow is a property of fin-hypergrid
         *
         * @property scrollingNow
         * @type boolean
         */
        scrollingNow: false,

        /**                                                             .
         * currentDrag is a property of fin-hypergrid
         *
         * @property currentDrag
         * @type fin-rectangle.point
         */
        currentDrag: null,

        /**                                                             .
         * lastDragCell is a property of fin-hypergrid
         *
         * @property lastDragCell
         * @type Object
         */
        lastDragCell: null,

        /**                                                             .
         * vScrollValue is a property of fin-hypergrid
         *
         * @property vScrollValue
         * @type Number
         */
        vScrollValue: 0,

        /**                                                             .
         * hScrollValue is a property of fin-hypergrid
         *
         * @property hScrollValue
         * @type Number
         */
        hScrollValue: 0,

        /**                                                             .
         * rectangles is a property of fin-hypergrid
         *
         * @property rectangles
         * @type fin-rectange
         */
        rectangles: null,

        /**                                                             .
         * constants is a property of fin-hypergrid
         *
         * @property constants
         * @type fin-hypergrid-constants
         */
        constants: null,

        /**                                                             .
         * selectionModel is a property of fin-hypergrid
         *
         * @property selectionModel
         * @type fin-hypergrid-selection-model
         */
        selectionModel: null,

        /**                                                             .
         * currentCellEditor is a property of fin-hypergrid
         *
         * @property currentCellEditor
         * @type fin-hypergrid-cell-editor
         */
        currentCellEditor: null,

        /**                                                             .
         * sbMouseIsDown is a property of fin-hypergrid
         *
         * @property sbMouseIsDown
         * @type boolean
         */
        sbMouseIsDown: false,

        /**                                                             .
         * sbHScroller is a property of fin-hypergrid
         *
         * @property sbHScroller
         * @type fin-vampire-bar
         */
        sbHScroller: null,

        /**                                                             .
         * sbVScroller is a property of fin-hypergrid
         *
         * @property sbVScroller
         * @type fin-vampire-bar
         */
        sbVScroller: null,

        /**                                                             .
         * sbHScrollConfig is a property of fin-hypergrid
         *
         * @property sbHScrollConfig
         * @type Object
         */
        sbHScrollConfig: {
            step: 1,
            page: 40,
            rangeStart: 0,
            rangeStop: 0
        },

        /**                                                             .
         * sbVScrollConfig is a property of fin-hypergrid
         *
         * @property sbVScrollConfig
         * @type Object
         */
        sbVScrollConfig: {
            step: 1,
            page: 40,
            rangeStart: 0,
            rangeStop: 0
        },

        /**                                                             .
         * sbLastAutoScroll is a property of fin-hypergrid
         *
         * @property sbLastAutoScroll
         * @type Number
         */
        sbLastAutoScroll: 0,

        /**                                                             .
         * sbAutoScrollStartTime is a property of fin-hypergrid
         *
         * @property sbAutoScrollStartTime
         * @type Number
         */
        sbAutoScrollStartTime: 0,

        /**                                                             .
         * sbPreviousVScrollValue is a property of fin-hypergrid
         *
         * @property sbPreviousVScrollValue
         * @type Number
         */
        sbPreviousVScrollValue: null,

        /**                                                             .
         * sbPreviousHScrollValue is a property of fin-hypergrid
         *
         * @property sbPreviousHScrollValue
         * @type Number
         */
        sbPreviousHScrollValue: null,

        /**                                                             .
         * sbHValueHolder is a property of fin-hypergrid
         *
         * @property sbHValueHolder
         * @type Object
         */

        sbHValueHolder: {},

        /**                                                             .
         * sbVValueHolder is a property of fin-hypergrid
         *
         * @property sbVValueHolder
         * @type Object
         */
        sbVValueHolder: {},

        /**                                                             .
         * cellEditors is a property of fin-hypergrid
         *
         * @property cellEditors
         * @type Object
         */
        cellEditors: {},

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
            this.pluginsDo(function(each) {
                if (each.installOn) {
                    each.installOn(self);
                }
            });

            // var children = this.children;
            // console.log(children);

            this.mouseDown = this.rectangles.point.create(-1, -1);
            this.dragExtent = this.rectangles.point.create(0, 0);

            this.initCanvas();
            this.initRenderer();
            this.initScrollbars();

            //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
            document.body.addEventListener('copy', function(evt) {
                self.checkClipboardCopy(evt);
            });
            this.resized();

        },

        pluginsDo: function(func) {
            var userPlugins = this.children.array();
            var pluginsTag = this.shadowRoot.querySelector('fin-plugins');

            var plugins = userPlugins;
            if (pluginsTag) {
                var systemPlugins = pluginsTag.children.array();
                plugins = systemPlugins.concat(plugins);
            }

            for (var i = 0; i < plugins.length; i++) {
                var plugin = plugins[i];
                func(plugin);
            }
        },

        getBehavior: function() {
            return this.behavior;
        },

        //The CellProvider is accessed through Hypergrid because Hypergrid is the mediator and should have ultimate control on where it comes from.  The default is to delegate through the PluggableGridBehavior object.
        getCellProvider: function() {
            var provider = this.getBehavior().getCellProvider();
            return provider;
        },

        //This function is a callback from the HypergridRenderer sub-component.   It is called after each paint of the canvas.
        gridRenderedNotification: function() {
            this.updateRenderedSizes();
            this.pluginsDo(function(each) {
                if (each.gridRenderedNotification) {
                    each.gridRenderedNotification();
                }
            });
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

        stopEditing: function() {
            if (this.currentCellEditor) {
                this.currentCellEditor.stopEditing();
                this.currentCellEditor = null;
            }
        },

        registerCellEditor: function(alias, cellEditor) {
            this.cellEditors[alias] = cellEditor;
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
        editAt: function(cellEditorAlias, coordinates) {

            var cellEditor = this.cellEditors[cellEditorAlias];
            if (!cellEditor) {
                console.error('there is no cellEditor of type ' + cellEditorAlias);
                return;
            }
            this.currentCellEditor = cellEditor;

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


            var editPoint = this.rectangles.point.create(x, y);
            this.setMouseDown(editPoint);
            this.setDragExtent(this.rectangles.point.create(0, 0));
            cellEditor.beginEditAt(editPoint);
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
            var max = this.sbVScrollConfig.rangeStop;
            var oldValue = this.getVScrollValue();
            var newValue = Math.min(max, Math.max(0, oldValue + offsetY));
            if (newValue === oldValue) {
                return;
            }
            this.setVScrollValue(newValue);
        },

        scrollHBy: function(offsetX) {
            var max = this.sbHScrollConfig.rangeStop;
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
        count: 0,
        setVScrollValue: function(y) {
            this.count = this.count + 1;
            var self = this;
            this.getBehavior().setScrollPositionY(y);
            this.vScrollValue = y;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                self.sbVRangeAdapter.subjectChanged();
            });
        },

        getVScrollValue: function() {
            return this.vScrollValue;
        },

        setHScrollValue: function(x) {
            var self = this;
            this.getBehavior().setScrollPositionX(x);
            this.hScrollValue = x;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                self.sbHRangeAdapter.subjectChanged();
            });
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

        editorTakeFocus: function() {
            if (this.currentCellEditor) {
                return this.currentCellEditor.takeFocus();
            }
        },

        isEditing: function() {
            if (this.currentCellEditor) {
                return this.currentCellEditor.isEditing;
            }
            return false;
        },

        initScrollbars: function() {

            var self = this;
            var canvas = this.getCanvas();

            var scrollbars = this.shadowRoot.querySelectorAll('fin-vampire-bar');
            this.sbHScroller = scrollbars[0];
            this.sbVScroller = scrollbars[1];

            this.addEventListener('mousedown', function() {
                this.sbMouseIsDown = true;
            });

            document.addEventListener('mouseup', function(e) {
                if (!this.sbMouseIsDown) {
                    return;
                }
                self.sbMouseIsDown = false;
                var origin = canvas.getOrigin();
                var point = self.rectangles.point.create(e.x - origin.x, e.y - origin.y);
                if (!canvas.bounds.contains(point)) {
                    //it's a mouseup on the scrollbars we need to retake focus
                    self.takeFocus();
                }
            });

            this.sbHValueHolder = {
                changed: false,
                getValue: function() {
                    return self.getHScrollValue();
                },
                setValue: function(v) {
                    self.setHScrollValue(v);
                }
            };

            this.sbVValueHolder = {
                changed: false,
                getValue: function() {
                    return self.getVScrollValue();
                },
                setValue: function(v) {
                    self.setVScrollValue(v);
                }
            };

            this.sbHRangeAdapter = this.sbHScroller.createRangeAdapter(this.sbHValueHolder, this.sbHScrollConfig);
            this.sbVRangeAdapter = this.sbHScroller.createRangeAdapter(this.sbVValueHolder, this.sbVScrollConfig);

            this.sbHScroller.setRangeAdapter(this.sbHRangeAdapter);
            this.sbVScroller.setRangeAdapter(this.sbVRangeAdapter);

        },
        //provide a way to notify scrollbars that the underlying data has changed
        //the real solution is to use an aspect adapter here

        scrollValueChangedNotification: function() {

            if (this.hScrollValue === this.sbPreviousHScrollValue && this.vScrollValue === this.sbPreviousVScrollValue) {
                return;
            }

            this.sbHValueHolder.changed = !this.sbHValueHolder.changed;
            this.sbVValueHolder.changed = !this.sbVValueHolder.changed;

            this.sbPreviousHScrollValue = this.hScrollValue;
            this.sbPreviousVScrollValue = this.vScrollValue;

            if (this.currentCellEditor) {
                this.currentCellEditor.scrollValueChangedNotification();
            }
        },

        setAutoScrollStartTime: function() {
            this.sbAutoScrollStartTime = Date.now();
        },

        pingAutoScroll: function() {
            var now = Date.now();
            if (now - this.sbLastAutoScroll > 500) {
                this.setAutoScrollStartTime();
            }
            this.sbLastAutoScroll = Date.now();
        },

        getAutoScrollDuration: function() {
            if (Date.now() - this.sbLastAutoScroll > 500) {
                return 0;
            }
            return Date.now() - this.sbAutoScrollStartTime;
        },

        setValue: function(x, y, value) {
            this.getBehavior().setValue(x, y, value);
            this.repaint();
        },
        synchronizeScrollingBoundries: function() {

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

            this.sbVScrollConfig.rangeStop = behavior.getRowCount() - lastPageRowCount;

            this.sbHScrollConfig.rangeStop = behavior.getColCount() - lastPageColCount;

            this.sbVScroller.tickle();
            this.sbHScroller.tickle();
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
