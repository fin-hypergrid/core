/* globals document, alert */

'use strict';

(function() {

    var noop = function() {};

    Polymer({ /* jslint ignore:line */

        /**
         * behavior is a property of fin-hypergrid
         *
         * @property behavior
         * @type fin-hypergrid-behavior
         */
        behavior: {
            setScrollPositionY: noop,
            setScrollPositionX: noop,
            getColCount: noop,
            getFixedColCount: noop,
            getFixedColsWidth: noop,
            getFixedColsMaxWidth: noop,
            setRenderedWidth: noop,
            getRowCount: noop,
            getFixedRowCount: noop,
            getFixedRowsHeight: noop,
            getFixedRowsMaxHeight: noop,
            setRenderedHeight: noop,
            getCellProvider: noop,
            click: noop,
            doubleClick: noop
        },

        /**
         * mouseDown is the location of an initial mousedown click, either for editing
         * a cell or for dragging a selection
         *
         * @property mouseDown
         * @type point
         */
        mouseDown: [],

        /**
         * vScrlValue is a float value between 0.0 - 1.0 of the y scrollposition
         *
         * @property vScrlValue
         * @type Number
         */
        vScrlValue: 0,

        /**
         * hScrlValue is a float value between 0.0 - 1.0 of the x scrollposition
         *
         * @property hScrlValue
         * @type Number
         */
        hScrlValue: 0,

        /**
         * rectangles is a polymer element instance of [fin-rectange](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         *
         * @property rectangles
         * @type fin-rectange
         */
        rectangles: null,

        /**
         * constants holds a [fin-constants](index.html#fin-hypergrid-constants) polymer-element singleton of constant values
         *
         * @property constants
         * @type fin-hypergrid-constants
         */
        constants: null,

        /**
         * selectionModel is a [fin-hypergrid-selection-model](index.html#fin-hypergrid-selection-model) instance
         *
         * @property selectionModel
         * @type fin-hypergrid-selection-model
         */
        selectionModel: null,

        /**
         * cellEdtr is the current instance of [fin-hypergrid-cell-editor](index.html#fin-hypergrid-cell-editor-base)
         *
         * @property cellEdtr
         * @type fin-hypergrid-cell-editor
         */
        cellEdtr: null,

        /**
         * sbMouseIsDown is true if the mouse button is currently down on the scrollbar, this is
         * used to refocus the hypergrid canvas after a scrollbar scroll
         *
         * @property sbMouseIsDown
         * @type boolean
         */
        sbMouseIsDown: false,

        /**
         * sbHScroller is an instance of [fin-vampire-bar](http://datamadic.github.io/fin-vampire-bar/components/fin-vampire-bar/)
         *
         * @property sbHScroller
         * @type fin-vampire-bar
         */
        sbHScroller: null,

        /**
         * sbVScroller is an instance of [fin-vampire-bar](http://datamadic.github.io/fin-vampire-bar/components/fin-vampire-bar/)
         *
         * @property sbVScroller
         * @type fin-vampire-bar
         */
        sbVScroller: null,

        /**
         * sbHScrlCfg is a config object allow us to dynamically reconfigure the scrollbars,
         * it's properties include rangeStart, rangeStop, step, and page
         *
         * @property sbHScrlCfg
         * @type Object
         */
        sbHScrlCfg: {},

        /**
         * sbVScrlCfg is a config object allow us to dynamically reconfigure the scrollbars,
         * it's properties include rangeStart, rangeStop, step, and page
         *
         * @property sbVScrlCfg
         * @type Object
         */
        sbVScrlCfg: {},

        /**
         * sbPrevVScrlVal is the previous value of sbVScrlVal
         *
         * @property sbPrevVScrlVal
         * @type Number
         */
        sbPrevVScrlVal: null,

        /**
         * sbPrevHScrlVal is dthe previous value of SbHScrlVal
         *
         * @property sbPrevHScrlVal
         * @type Number
         */
        sbPrevHScrlVal: null,

        /**
         * sbHValueHolder the listenable scroll model we share with the Horizontal scrollbar
         *
         * @property sbHValueHolder
         * @type Object
         */

        sbHValueHolder: {},

        /**
         * sbVValueHolder the listenable scroll model we share with the vertical scrollbar
         *
         * @property sbVValueHolder
         * @type Object
         */
        sbVValueHolder: {},

        /**
         * cellEditors is the cache of singleton cellEditors
         *
         * @property cellEditors
         * @type Object
         */
        cellEditors: null,

        domReady: function() {
            var self = this;

            this.rectangles = document.createElement('fin-rectangle');
            this.constants = document.createElement('fin-hypergrid-constants').values;
            this.selectionModel = document.createElement('fin-hypergrid-selection-model');

            this.cellEditors = {};

            //prevent the default context menu for appearing
            this.oncontextmenu = function(event) {
                event.preventDefault();
                return false;
            };


            this.clearMouseDown();
            //this.selectionModel.setGrid(this);

            //install any plugins
            this.pluginsDo(function(each) {
                if (each.installOn) {
                    each.installOn(self);
                }
            });


            //initialize our various pieces
            this.initCanvas();
            this.initRenderer();
            this.initScrollbars();

            //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
            document.body.addEventListener('copy', function(evt) {
                self.checkClipboardCopy(evt);
            });
            this.resized();

        },

        /**
         *                                                                      .
         *                                                                      .
         * answer the initial mouse position on a mouse down event for cell editing or a drag operation
         *
         * @method getMouseDown()
         */
        getMouseDown: function() {
            var last = this.mouseDown.length - 1;
            if (last < 0) {
                return null;
            }
            return this.mouseDown[last];
        },

        /**
         *                                                                      .
         *                                                                      .
         * remove the last item from the mouse down stack
         *
         * @method popMouseDown()
         */
        popMouseDown: function() {
            if (this.mouseDown.length === 0) {
                return;
            }
            this.mouseDown.length = this.mouseDown.length - 1;
        },

        /**
         *                                                                      .
         *                                                                      .
         * empty out the mouse down stack
         *
         * @method clearMouseDown()
         */
        clearMouseDown: function() {
            this.mouseDown = [this.rectangles.point.create(-1, -1)];
        },

        /**
         *                                                                      .
         *                                                                      .
         * set the mouse point that initated a cell edit or drag operation
         *
         * @method setMouseDown(point)
         */
        setMouseDown: function(point) {
            this.mouseDown.push(point);
        },

        /**
         *                                                                      .
         *                                                                      .
         * iterate over the plugins invoking the passed in function with each
         *
         * @method pluginsDo(function)
         */
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

        /**
         *                                                                      .
         *                                                                      .
         * The CellProvider is accessed through Hypergrid because Hypergrid is the mediator and should have ultimate control on where it comes from.  The default is to delegate through the PluggableGridBehavior object.
         *
         * @method getCellProvider()
         */
        getCellProvider: function() {
            var provider = this.getBehavior().getCellProvider();
            return provider;
        },

        /**
         *                                                                      .
         *                                                                      .
         * This function is a callback from the HypergridRenderer sub-component.   It is called after each paint of the canvas.
         *
         * @method gridRenderedNotification()
         */
        gridRenderedNotification: function() {
            this.updateRenderedSizes();
            this.pluginsDo(function(each) {
                if (each.gridRenderedNotification) {
                    each.gridRenderedNotification();
                }
            });
        },

        /**
         *                                                                      .
         *                                                                      .
         * Notify the GridBehavior how many rows and columns we just rendered.
         *
         * @method updateRenderedSizes()
         */
        updateRenderedSizes: function() {
            var behavior = this.getBehavior();
            //add one to each of these values as we want also to include
            //the cols and rows that are partially visible
            behavior.setRenderedWidth(this.getViewableCols() + 1);
            behavior.setRenderedHeight(this.getViewableRows() + 1);
        },

        /**
         *                                                                      .
         *                                                                      .
         * If we have focus, copy our current selection data to the system clipboard.
         *
         * @method checkClipboardCopy(event)
         */
        checkClipboardCopy: function(evt) {
            if (!this.hasFocus()) {
                return;
            }
            evt.preventDefault();
            var csvData = this.getSelectionAsTSV();
            evt.clipboardData.setData('text/plain', csvData);
        },

        /**
         *                                                                      .
         *                                                                      .
         * return true if we have any selections
         *
         * @method hasSelections()
         */
        hasSelections: function() {
            if (!this.getSelectionModel) {
                return; // were not fully initialized yet
            }
            return this.getSelectionModel().hasSelections();
        },

        /**
         *                                                                      .
         *                                                                      .
         * Return a tab seperated value string from the selection and our data.
         *
         * @method getSelectionAsTSV()
         */
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

        /**
         *                                                                      .
         *                                                                      .
         * Answer if we currently have focus
         *
         * @method hasFocus()
         */
        hasFocus: function() {
            return this.getCanvas().hasFocus();
        },

        /**
         *                                                                      .
         *                                                                      .
         * Clear all the selections out
         *
         * @method clearSelections()
         */
        clearSelections: function() {
            this.getSelectionModel().clear();
            //this.clearMouseDown();
        },

        /**
         *                                                                      .
         *                                                                      .
         * Clear just the most recent selection
         *
         * @method clearMostRecentSelection()
         */
        clearMostRecentSelection: function() {
            this.getSelectionModel().clearMostRecentSelection();
        },

        /**
         *                                                                      .
         *                                                                      .
         * Select a specific region by origin and extent
         *
         * @method select(ox,oy,ex,ey)
         */
        select: function(ox, oy, ex, ey) {
            if (ox < 0 || oy < 0) {
                //we don't select negative area
                //also this means there is no origin mouse down for a selection rect
                return;
            }
            this.getSelectionModel().select(ox, oy, ex, ey);
        },

        /**
         *                                                                      .
         *                                                                      .
         * Answer if a specific point is selected
         *
         * @method isSelected(x,y)
         */
        isSelected: function(x, y) {
            return this.getSelectionModel().isSelected(x, y);
        },

        /**
         *                                                                      .
         *                                                                      .
         * Answer if a specific col is selected anywhere in the entire table
         *
         * @method isFixedRowCellSelected(colIndex)
         */
        isFixedRowCellSelected: function(col) {
            var selectionModel = this.getSelectionModel();
            var isSelected = selectionModel.isFixedRowCellSelected(col);
            return isSelected;
        },

        /**
         *                                                                      .
         *                                                                      .
         * Answer if a specific row is selected anywhere in the entire table
         *
         * @method isFixedColCellSelected(rowIndex)
         */
        isFixedColCellSelected: function(row) {
            var selectionModel = this.getSelectionModel();
            var isSelected = selectionModel.isFixedColCellSelected(row);
            return isSelected;
        },

        /**
         *                                                                      .
         *                                                                      .
         * return the selection model
         *
         * @method getSelectionModel()
         */
        getSelectionModel: function() {
            return this.selectionModel;
        },

        /**
         *                                                                      .
         *                                                                      .
         * return the behavior (model)
         *
         * @method getBehavior()
         */
        getBehavior: function() {
            return this.behavior;
        },

        /**
         *                                                                      .
         *                                                                      .
         * Set the PluggableBehavior (model) object for this grid control.  This can be done dynamically.
         *
         * @method setBehavior(newBehavior)
         */
        setBehavior: function(newBehavior) {

            this.behavior = newBehavior;
            this.behavior.setGrid(this);

            var self = this;

            var numCols = this.behavior.getColCount();
            var numRows = this.behavior.getRowCount();

            this.behavior.changed = function() {
                if (numCols !== self.behavior.getColCount() || numRows !== self.behavior.getRowCount()) {
                    numCols = self.behavior.getColCount();
                    numRows = self.behavior.getRowCount();
                    self.behaviorShapeChanged();
                }
                self.repaint();
            };

            this.behavior.sizeChanged = function() {
                self.repaint();
            };

            //this.detachRenderer();
            if (this.behavior) {
                //this.attachRenderer();
            }
        },

        /**
         *                                                                      .
         *                                                                      .
         * the dimensions of the grid data have changed, you've been notified
         *
         * @method behaviorShapeChanged()
         */
        behaviorShapeChanged: function() {
            this.synchronizeScrollingBoundries();
        },

        /**
         *                                                                      .
         *                                                                      .
         * tickle the repaint flag on the canvas
         *
         * @method repaint()
         */
        repaint: function() {
            this.getCanvas().repaint();
        },

        /**
         *                                                                      .
         *                                                                      .
         * initialize our drawing surface
         *
         * @method initCanvas()
         */
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

            this.canvas.addEventListener('fin-mousemove', function(e) {
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseMove(mouseEvent);
            });

            this.canvas.addEventListener('fin-mousedown', function(e) {
                self.stopEditing();
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseDown(mouseEvent);
            });

            this.canvas.addEventListener('fin-mouseup', function(e) {
                self.dragging = false;
                if (self.scrollingNow) {
                    self.scrollingNow = false;
                }
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseUp(mouseEvent);
            });

            this.canvas.addEventListener('fin-tap', function(e) {
                var mouse = e.detail.mouse;
                var tapEvent = self.getGridCellFromMousePoint(mouse);
                tapEvent.primitiveEvent = e;
                self.delegateTap(tapEvent);
            });

            this.canvas.addEventListener('fin-drag', function(e) {
                self.dragging = true;
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseDrag(mouseEvent);
            });

            this.canvas.addEventListener('fin-keydown', function(e) {
                self.delegateKeyDown(e);
            });

            // this.canvas.addEventListener('fin-trackstart', function(e) {
            //     var mouse = e.detail.mouse;
            //     var cell = self.getGridCellFromMousePoint(mouse);
            //     self.click(cell, e);
            // });
            this.canvas.addEventListener('fin-track', function(e) {
                if (self.dragging) {
                    return;
                }
                var primEvent = e.detail.primitiveEvent;
                if (Math.abs(primEvent.dy) > Math.abs(primEvent.dx)) {
                    if (primEvent.yDirection > 0) {
                        self.scrollVBy(-2);
                    } else if (primEvent.yDirection < -0) {
                        self.scrollVBy(2);
                    }
                } else {
                    if (primEvent.xDirection > 0) {
                        self.scrollHBy(-1);
                    } else if (primEvent.xDirection < -0) {
                        self.scrollHBy(1);
                    }
                }
            });

            this.canvas.addEventListener('fin-holdpulse', function(e) {
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateDoubleClick(mouseEvent);
            });

            this.canvas.addEventListener('fin-dblclick', function(e) {
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateHoldPulse(mouseEvent);
            });

            this.canvas.addEventListener('fin-wheelmoved', function(e) {
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e.detail.primitiveEvent;
                self.delegateWheelMoved(mouseEvent);
            });
        },

        /**
         *                                                                      .
         *                                                                      .
         * anser if the mouseEvent coordinates are over a column divider
         *
         * @method isOverColumnDivider(mouseEvent)
         */
        isOverColumnDivider: function(mouseEvent) {
            var x = mouseEvent.mousePoint.x;
            var isIt = this.getRenderer().isOverColumnDivider(x);
            return isIt;
        },

        /**
         *                                                                      .
         *                                                                      .
         * turn on the column resize cursor
         *
         * @method beColumnResizeCursor()
         */
        beColumnResizeCursor: function() {
            this.style.cursor = 'col-resize';
        },

        /**
         *                                                                      .
         *                                                                      .
         * turn on the column resize cursor
         *
         * @method beColumnResizeCursor()
         */
        beDefaultCursor: function() {
            this.style.cursor = 'default';
        },

        delegateWheelMoved: function(event) {
            var behavior = this.getBehavior();
            behavior.onWheelMoved(this, event);
        },

        /**
         *                                                                      .
         *                                                                      .
         * delegate MouseMove to the behavior (model)
         *
         * @method delegateMouseMove(mouseDetails)
         */
        delegateMouseMove: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onMouseMove(this, mouseDetails);
        },

        /**
         *                                                                      .
         *                                                                      .
         * delegate mousedown to the behavior (model)
         *
         * @method delegateMouseDown(mouseDetails)
         */
        delegateMouseDown: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.handleMouseDown(this, mouseDetails);
        },

        /**
         *                                                                      .
         *                                                                      .
         * delegate mouseup to the behavior (model)
         *
         * @method delegateMouseUp(mouseDetails)
         */
        delegateMouseUp: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onMouseUp(this, mouseDetails);
        },

        /**
         *                                                                      .
         *                                                                      .
         * delegate tap to the behavior (model)
         *
         * @method delegateTap(mouseDetails)
         */
        delegateTap: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onTap(this, mouseDetails);
        },

        /**
         *                                                                      .
         *                                                                      .
         * delegate mouseDrag to the behavior (model)
         *
         * @method delegateMouseDrag(mouseDetails)
         */
        delegateMouseDrag: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onMouseDrag(this, mouseDetails);
        },

        /**
         *                                                                      .
         *                                                                      .
         * we've been doubleclicked on, delegate through the behavior (model)
         *
         * @method delegateDoubleClick(mouseDetails)
         */
        //Delegate the doubleclick event to the PluggableBehavior.  We don't want to assume anything about what that may mean if anything.
        delegateDoubleClick: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onDoubleClick(this, mouseDetails);
        },

        /**
         *                                                                      .
         *                                                                      .
         * delegate holdpulse through the behavior (model)
         *
         * @method delegateDoubleClick(mouseDetails)
         */
        //Delegate the doubleclick event to the PluggableBehavior.  We don't want to assume anything about what that may mean if anything.
        delegateHoldPulse: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onHoldPulse(this, mouseDetails);
        },

        /**
         *                                                                      .
         *                                                                      .
         * Generate a function name and call it on self.  This should also be delegated through PluggableBehavior keeping the default implementation here though.
         *
         * @method keydown(event)
         */
        delegateKeyDown: function(e) {
            var behavior = this.getBehavior();
            behavior.onKeyDown(this, e);
        },

        /**
         *                                                                      .
         *                                                                      .
         * shut down the current cell editor
         *
         * @method stopEditing()
         */
        stopEditing: function() {
            if (this.cellEdtr) {
                this.cellEdtr.stopEditing();
                this.cellEdtr = null;
            }
        },


        /**
         *                                                                      .
         *                                                                      .
         * register a cell editor, this is typically called from within a cell-editors installOn method, when it is being intialized as a plugin.
         *
         * @method registerCellEditor(alias,cellEditor)
         */
        registerCellEditor: function(alias, cellEditor) {
            this.cellEditors[alias] = cellEditor;
        },

        /**
         *                                                                      .
         *                                                                      .
         * get the pixel coordinates of just the center "main" data area
         *
         * @method getDataBounds()
         */
        getDataBounds: function() {
            var behavior = this.getBehavior();
            var b = this.canvas.bounds;

            var x = behavior.getFixedColsWidth() + 2;
            var y = behavior.getFixedRowsHeight() + 2;

            var result = this.rectangles.rectangle.create(x, y, b.origin.x + b.extent.x - x, b.origin.y + b.extent.y - y);
            return result;
        },

        /**
         *                                                                      .
         *                                                                      .
         * return our [fin-canvas](http://stevewirts.github.io/fin-canvas/components/fin-canvas/) instance
         *
         * @method getCanvas()
         */
        getCanvas: function() {
            return this.canvas;
        },

        /**
         *                                                                      .
         *                                                                      .
         * open a specific cell-editor at the provided model coordinates
         *
         * @method editAt(cellEditor,coordinates)
         */
        //Currently this is called by default from the PluggableBehavior, this piece needs to be reworked to re-delegate back through the PluggableBehavior to let it decide how to edit the cell.
        editAt: function(cellEditor, coordinates) {

            if (1 === 1) {
                return;
            }

            this.cellEdtr = cellEditor;

            var cell = coordinates.gridCell;
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

        /**
         *                                                                      .
         *                                                                      .
         * Answer if a specific col is fully visible
         *
         * @method isDataColVisible(colIndex)
         */
        isDataColVisible: function(colIndex) {
            var isVisible = this.getRenderer().isColVisible(colIndex);
            return isVisible;
        },

        /**
         *                                                                      .
         *                                                                      .
         * Answer if a specific row is fully visible
         *
         * @method isDataRowVisible(rowIndex)
         */
        isDataRowVisible: function(rowIndex) {
            var isVisible = this.getRenderer().isRowVisible(rowIndex);
            return isVisible;
        },

        /**
         *                                                                      .
         *                                                                      .
         * Answer if a specific cell (col,row) fully is visible
         *
         * @method isDataVisible(colIndex,rowIndex)
         */
        isDataVisible: function(colIndex, rowIndex) {
            var isVisible = this.isDataRowVisible(rowIndex) && this.isDataColVisible(colIndex);
            return isVisible;
        },

        /**
         *                                                                      .
         *                                                                      .
         * Offset indicates the direction we are moving
         *
         * @method insureModelColIsViewable(c,offsetX)
         */
        insureModelColIsViewable: function(c, offsetX) {
            //-1 because we want only fully visible cols, don't include partially
            //viewable columns
            var viewableCols = this.getViewableCols() - 1;
            if (!this.isDataColVisible(c)) {
                //the scroll position is the leftmost column
                var newSX = offsetX < 0 ? c : c - viewableCols;
                this.setHScrollValue(newSX);
                return true;
            }
            return false;
        },

        /**
         *                                                                      .
         *                                                                      .
         * Offset indicates the direction we are moving
         *
         * @method insureModelRowIsViewable(r,offsetY)
         */
        insureModelRowIsViewable: function(r, offsetY) {
            //-1 because we want only fully visible rows, don't include partially
            //viewable rows
            var viewableRows = this.getViewableRows() - 1;
            if (!this.isDataRowVisible(r)) {
                //the scroll position is the topmost row
                var newSY = offsetY < 0 ? r : r - viewableRows;
                this.setVScrollValue(newSY);
                return true;
            }
            return false;
        },

        /**
         *                                                                      .
         *                                                                      .
         * scroll horizontal and vertically by the provided offsets
         *
         * @method scrollBy(offsetX,offsetY)
         */
        scrollBy: function(offsetX, offsetY) {
            this.scrollHBy(offsetX);
            this.scrollVBy(offsetY);
        },

        /**
         *                                                                      .
         *                                                                      .
         * scroll verticallly by the provided offset
         *
         * @method scrollVBy(offsetY)
         */
        scrollVBy: function(offsetY) {
            var max = this.sbVScrlCfg.rangeStop;
            var oldValue = this.getVScrollValue();
            var newValue = Math.min(max, Math.max(0, oldValue + offsetY));
            if (newValue === oldValue) {
                return;
            }
            this.setVScrollValue(newValue);
        },

        /**
         *                                                                      .
         *                                                                      .
         * scroll horizontally by the provided offset
         *
         * @method scrollHBy(offsetX)
         */
        scrollHBy: function(offsetX) {
            var max = this.sbHScrlCfg.rangeStop;
            var oldValue = this.getHScrollValue();
            var newValue = Math.min(max, Math.max(0, oldValue + offsetX));
            if (newValue === oldValue) {
                return;
            }
            this.setHScrollValue(newValue);
        },

        /**
         *                                                                      .
         *                                                                      .
         * Answer which data cell is under a pixel value mouse point
         *
         * @method getGridCellFromMousePoint(mouse)
         */
        getGridCellFromMousePoint: function(mouse) {
            var cell = this.getRenderer().getGridCellFromMousePoint(mouse);
            return cell;
        },

        /**
         *                                                                      .
         *                                                                      .
         * Answer pixel based bounds rectangle given a data cell point
         *
         * @method getBoundsOfCell(cell)
         */
        getBoundsOfCell: function(cell) {
            var bounds = this.getRenderer().getBoundsOfCell(cell);
            return bounds;
        },

        /**
         *                                                                      .
         *                                                                      .
         * This is called by the fin-canvas when a resize occurs
         *
         * @method resized()
         */
        resized: function() {
            this.synchronizeScrollingBoundries();
        },

        /**
         *                                                                      .
         *                                                                      .
         * set the vertical scroll value
         *
         * @method setVScrollValue(y)
         */
        setVScrollValue: function(y) {
            var self = this;
            this.getBehavior().setScrollPositionY(y);
            this.vScrlValue = y;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                self.sbVRangeAdapter.subjectChanged();
            });
        },

        /**
         *                                                                      .
         *                                                                      .
         * return the vertical scroll value
         *
         * @method getVScrollValue()
         */
        getVScrollValue: function() {
            return this.vScrlValue;
        },

        /**
         *                                                                      .
         *                                                                      .
         * set the horizontal scroll value
         *
         * @method setHScrollValue(x)
         */
        setHScrollValue: function(x) {
            var self = this;
            this.getBehavior().setScrollPositionX(x);
            this.hScrlValue = x;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                self.sbHRangeAdapter.subjectChanged();
            });
        },

        /**
         *                                                                      .
         *                                                                      .
         * return the horizontal scroll value
         *
         * @method getHScrollValue()
         */
        getHScrollValue: function() {
            return this.hScrlValue;
        },

        /**
         *                                                                      .
         *                                                                      .
         * request input focus
         *
         * @method takeFocus()
         */
        takeFocus: function() {
            if (this.isEditing()) {
                this.editorTakeFocus();
            }
            this.getCanvas().takeFocus();
        },

        /**
         *                                                                      .
         *                                                                      .
         * request focus for our cell editor
         *
         * @method editorTakeFocus()
         */
        editorTakeFocus: function() {
            if (this.cellEdtr) {
                return this.cellEdtr.takeFocus();
            }
        },

        /**
         *                                                                      .
         *                                                                      .
         * answer if we have an active cell editor currently
         *
         * @method isEditing()
         */
        isEditing: function() {
            if (this.cellEdtr) {
                return this.cellEdtr.isEditing;
            }
            return false;
        },

        /**
         *                                                                      .
         *                                                                      .
         * initialize the scroll bars
         *
         * @method initScrollbars()
         */
        initScrollbars: function() {

            var self = this;
            var canvas = this.getCanvas();

            var scrollbars = this.shadowRoot.querySelectorAll('fin-vampire-bar');
            this.sbHScroller = scrollbars[0];
            this.sbVScroller = scrollbars[1];

            this.sbHScroller.onUpClick = function() {
                self.scrollHBy(1);
            };

            this.sbHScroller.onDownClick = function() {
                self.scrollHBy(-1);
            };

            this.sbHScroller.onUpHold = function(event) {
                event.preventTap();
                self.scrollHBy(1);
            };

            this.sbHScroller.onDownHold = function(event) {
                event.preventTap();
                self.scrollHBy(-1);
            };

            this.addEventListener('mousedown', function() {
                self.sbMouseIsDown = true;
            });


            this.sbVScroller.onUpClick = function() {
                self.scrollVBy(-1);
            };

            this.sbVScroller.onDownClick = function() {
                self.scrollVBy(1);
            };

            this.sbVScroller.onUpHold = function(event) {
                event.preventTap();
                self.scrollVBy(-1);
            };

            this.sbVScroller.onDownHold = function(event) {
                event.preventTap();
                self.scrollVBy(1);
            };

            this.addEventListener('mousedown', function() {
                self.sbMouseIsDown = true;
            });

            document.addEventListener('mouseup', function(e) {
                if (!self.sbMouseIsDown) {
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

            this.sbHScrlCfg = {
                step: 1,
                page: 40,
                rangeStart: 0,
                rangeStop: 0

            };

            this.sbVScrlCfg = {
                step: 1,
                page: 40,
                rangeStart: 0,
                rangeStop: 0
            };

            this.sbHRangeAdapter = this.sbHScroller.createRangeAdapter(this.sbHValueHolder, this.sbHScrlCfg);
            this.sbVRangeAdapter = this.sbHScroller.createRangeAdapter(this.sbVValueHolder, this.sbVScrlCfg);

            this.sbHScroller.setRangeAdapter(this.sbHRangeAdapter);
            this.sbVScroller.setRangeAdapter(this.sbVRangeAdapter);

        },

        /**
         *                                                                      .
         *                                                                      .
         * provide a way to notify scrollbars that the underlying data has changed
         * the real solution is to use an aspect adapter here
         *
         * @method scrollValueChangedNotification()
         */
        scrollValueChangedNotification: function() {

            if (this.hScrlValue === this.sbPrevHScrlVal && this.vScrlValue === this.sbPrevVScrlVal) {
                return;
            }

            this.sbHValueHolder.changed = !this.sbHValueHolder.changed;
            this.sbVValueHolder.changed = !this.sbVValueHolder.changed;

            this.sbPrevHScrlVal = this.hScrlValue;
            this.sbPrevVScrlVal = this.vScrlValue;

            if (this.cellEdtr) {
                this.cellEdtr.scrollValueChangedNotification();
            }
        },

        /**
         *                                                                      .
         *                                                                      .
         * set a data value into the behavior (model) at a specific point
         *
         * @method setValue(x,y,value)
         */
        setValue: function(x, y, value) {
            this.getBehavior().setValue(x, y, value);
            this.repaint();
        },

        /**
         *                                                                      .
         *                                                                      .
         * the data dimensions have changed, or our pixel boundries have changed,
         * adjust scrollbar properties as necessary
         *
         * @method synchronizeScrollingBoundries()
         */
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

            this.sbVScrlCfg.rangeStop = behavior.getRowCount() - lastPageRowCount;

            this.sbHScrlCfg.rangeStop = behavior.getColCount() - lastPageColCount;

            this.sbVScroller.tickle();
            this.sbHScroller.tickle();
        },


        /**
         *                                                                      .
         *                                                                      .
         * Answers the number of viewable rows, including any partially viewable rows.
         *
         * @method getViewableRows()
         */
        getViewableRows: function() {
            return this.getRenderer().getViewableRows();
        },


        /**
         *                                                                      .
         *                                                                      .
         * Answers the number of viewable cols, including any partially viewable cols.
         *
         * @method getViewableCols()
         */
        getViewableCols: function() {
            return this.getRenderer().getViewableCols();
        },


        /**
         *                                                                      .
         *                                                                      .
         * Initialize the GridRenderering sub-component.
         *
         * @method initRenderer()
         */
        initRenderer: function() {

            this.renderer = this.shadowRoot.querySelector('fin-hypergrid-renderer');
            this.renderer.setGrid(this);

        },

        /**
         *                                                                      .
         *                                                                      .
         * return our [fin-hypergrid-renderer](index.html#fin-hypergrid-renderer)
         *
         * @method getRenderer()
         */
        getRenderer: function() {
            return this.renderer;
        },

        //Initialize the various pieces of the self.

    });

})(); /* jslint ignore:line */
