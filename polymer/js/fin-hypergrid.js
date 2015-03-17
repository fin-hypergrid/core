/* globals document, alert, Polymer */

'use strict';

(function() {

    var rectangles;
    var globalCellEditors = {};
    var propertiesInitialized = false;

    var noop = function() {};

    var initializeBasicCellEditors = function() {

        initializeCellEditor('fin-hypergrid-cell-editor-textfield');
        initializeCellEditor('fin-hypergrid-cell-editor-choice');
        initializeCellEditor('fin-hypergrid-cell-editor-color');
        initializeCellEditor('fin-hypergrid-cell-editor-date');
        initializeCellEditor('fin-hypergrid-cell-editor-slider');
        initializeCellEditor('fin-hypergrid-cell-editor-spinner');
    };

    var initializeCellEditor = function(name) {
        var cellEditor = document.createElement(name);
        globalCellEditors[cellEditor.alias] = cellEditor;
    };

    var defaultProperties = function() {
        var properties = {
            //these are for the theme
            font: '13px Tahoma, Geneva, sans-serif',
            color: 'rgb(25, 25, 25)',
            backgroundColor: 'rgb(241, 241, 241)',
            foregroundSelColor: 'rgb(25, 25, 25)',
            backgroundSelColor: 'rgb(183, 219, 255)',

            topLeftFont: '14px Tahoma, Geneva, sans-serif',
            topLeftColor: 'rgb(25, 25, 25)',
            topLeftBackgroundColor: 'rgb(223, 227, 232)',
            topLeftFGSelColor: 'rgb(25, 25, 25)',
            topLeftBGSelColor: 'rgb(255, 220, 97)',

            fixedColumnFont: '14px Tahoma, Geneva, sans-serif',
            fixedColumnColor: 'rgb(25, 25, 25)',
            fixedColumnBackgroundColor: 'rgb(223, 227, 232)',
            fixedColumnFGSelColor: 'rgb(25, 25, 25)',
            fixedColumnBGSelColor: 'rgb(255, 220, 97)',

            fixedRowFont: '14px Tahoma, Geneva, sans-serif',
            fixedRowColor: 'rgb(25, 25, 25)',
            fixedRowBackgroundColor: 'rgb(223, 227, 232)',
            fixedRowFGSelColor: 'rgb(25, 25, 25)',
            fixedRowBGSelColor: 'rgb(255, 220, 97)',

            backgroundColor2: 'rgb(201, 201, 201)',
            lineColor: 'rgb(199, 199, 199)',
            voffset: 0,
            scrollbarHoverOver: 'visible',
            scrollbarHoverOff: 'hidden',
            scrollingEnabled: true,

            //these used to be in the constants element
            fixedRowAlign: 'center',
            fixedColAlign: 'center',
            cellPadding: 5,
            repaintIntervalRate: 15,
            gridLinesH: true,
            gridLinesV: true,

            defaultRowHeight: 20,
            defaultFixedRowHeight: 20,
            defaultColumnWidth: 100,
            defaultFixedColumnWidth: 100
        };
        return properties;
    };

    var buildPolymerTheme = function() {
        clearObjectProperties(polymerTheme);
        var pb = document.createElement('paper-button');

        pb.style.display = 'none';
        pb.setAttribute('disabled', true);
        document.body.appendChild(pb);
        var p = window.getComputedStyle(pb);

        var section = document.createElement('section');
        section.style.display = 'none';
        section.setAttribute('hero', true);
        document.body.appendChild(section);

        var h = window.getComputedStyle(document.querySelector('html'));
        var hb = window.getComputedStyle(document.querySelector('html, body'));
        var s = window.getComputedStyle(section);

        polymerTheme.fixedRowBackgroundColor = p.color;
        polymerTheme.fixedColumnBackgroundColor = p.color;
        polymerTheme.topLeftBackgroundColor = p.color;
        polymerTheme.lineColor = p.backgroundColor;

        polymerTheme.backgroundColor2 = hb.backgroundColor;

        polymerTheme.color = h.color;
        polymerTheme.fontFamily = h.fontFamily;
        polymerTheme.backgroundColor = s.backgroundColor;

        pb.setAttribute('disabled', false);
        pb.setAttribute('secondary', true);
        pb.setAttribute('raised', true);
        p = window.getComputedStyle(pb);

        polymerTheme.fixedRowColor = p.color;
        polymerTheme.fixedColumnColor = p.color;
        polymerTheme.topLeftColor = p.color;


        polymerTheme.backgroundSelColor = p.backgroundColor;
        polymerTheme.foregroundSelColor = p.color;

        pb.setAttribute('secondary', false);
        pb.setAttribute('warning', true);

        polymerTheme.fixedRowFGSelColor = p.color;
        polymerTheme.fixedRowBGSelColor = p.backgroundColor;
        polymerTheme.fixedColumnFGSelColor = p.color;
        polymerTheme.fixedColumnBGSelColor = p.backgroundColor;

        //check if there is actually a theme loaded if not, clear out all bogus values
        //from my cache
        if (polymerTheme.fixedRowBGSelColor === 'rgba(0, 0, 0, 0)') {
            clearObjectProperties(polymerTheme);
        }

        document.body.removeChild(pb);
        document.body.removeChild(section);
    };

    var clearObjectProperties = function(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                delete obj[prop];
            }
        }
    };

    var defaults, polymerTheme, globalProperties;

    (function() {
        defaults = defaultProperties();
        polymerTheme = Object.create(defaults);
        globalProperties = Object.create(polymerTheme);
    })();

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
            getColumnCount: noop,
            getFixedColumnCount: noop,
            getFixedColumnsWidth: noop,
            getFixedColumnsMaxWidth: noop,
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

        isWebkit: true,

        /**
         * mouseDown is the location of an initial mousedown click, either for editing
         * a cell or for dragging a selection
         *
         * @property mouseDown
         * @type point
         */
        mouseDown: [],

        /**
         * dragExtent is the extent from the mousedown point during a drag operation
         *
         * @property dragExtent
         * @type fin-rectangle.point
         */

        dragExtent: null,

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

        /**
         * dragColumn is index of the currently dragged column
         *
         * @property dragColumn
         * @type integer
         */

        renderOverridesCache: {},

        isScrollButtonClick: false,

        domReady: function() {

            if (!propertiesInitialized) {
                propertiesInitialized = true;
                buildPolymerTheme();
                initializeBasicCellEditors();
            }

            var self = this;
            rectangles = rectangles || document.createElement('fin-rectangle');

            this.rectangles = rectangles;

            this.lnfProperties = Object.create(globalProperties);

            this.isWebkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1;
            this.selectionModel = document.createElement('fin-hypergrid-selection-model');
            this.cellEditors = Object.create(globalCellEditors);
            this.renderOverridesCache = {};

            //prevent the default context menu for appearing
            this.oncontextmenu = function(event) {
                event.preventDefault();
                return false;
            };


            this.clearMouseDown();
            this.dragExtent = rectangles.point.create(0, 0);

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
            this.fire('load');
            this.isScrollButtonClick = false;
        },
        addGlobalProperties: function(props) {
            //we check for existence to avoid race condition in initialization
            if (!globalProperties) {
                var self = this;
                setTimeout(function() {
                    self.addGlobalProperties(props);
                }, 10);
            } else {
                this._addGlobalProperties(props);
            }

        },
        _addGlobalProperties: function(props) {
            for (var key in props) {
                if (props.hasOwnProperty(key)) {
                    globalProperties[key] = props[key];
                }
            }
        },
        addProperties: function(props) {
            for (var key in props) {
                if (props.hasOwnProperty(key)) {
                    this.lnfProperties[key] = props[key];
                }
            }
        },

        /**
         *                                                                      .
         *                                                                      .
         * answer the state object for remembering our state (memento pattern)
         *
         * @method setState()
         */
        getState: function() {
            var state = this.getBehavior().getState();
            return state;
        },

        /**
         *                                                                      .
         *                                                                      .
         * set the state object to return to a specific user configuration
         *
         * @method setState()
         */
        setState: function(state) {
            this.getBehavior().setState(state);
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
            this.mouseDown = [rectangles.point.create(-1, -1)];
            this.dragExtent = null;
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
         * return the extent point of the current drag selection rectangle
         *
         * @method getDragExtent()
         */
        getDragExtent: function() {
            return this.dragExtent;
        },

        /**
         *                                                                      .
         *                                                                      .
         * set the extent point of the current drag selection operation
         *
         * @method setDragExtent(point)
         */
        setDragExtent: function(point) {
            this.dragExtent = point;
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
            if (this.cellEdtr) {
                this.cellEdtr.gridRenderedNotification();
            }
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
            //the columns and rows that are partially visible
            behavior.setRenderedWidth(this.getViewableColumns() + 1);
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
            this.clearMouseDown();
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
         * @method isFixedRowCellSelected(columnIndex)
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
         * @method isFixedColumnCellSelected(rowIndex)
         */
        isFixedColumnCellSelected: function(row) {
            var selectionModel = this.getSelectionModel();
            var isSelected = selectionModel.isFixedColumnCellSelected(row);
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

            var numColumns = this.behavior.getColumnCount();
            var numRows = this.behavior.getRowCount();

            this.behavior.changed = function() {
                if (numColumns !== self.behavior.getColumnCount() || numRows !== self.behavior.getRowCount()) {
                    numColumns = self.behavior.getColumnCount();
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
         * @method getBounds()
         */
        getBounds: function() {
            var canvas = this.getCanvas();
            if (canvas) {
                return canvas.getBounds();
            } else {
                return null;
            }
        },

        /**
         *                                                                      .
         *                                                                      .
         * return the value of a lnf property
         *
         * @method resolveProperty()
         */
        resolveProperty: function(key) {
            return this.lnfProperties[key];
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
            var canvas = this.getCanvas();
            if (canvas) {
                canvas.repaint();
            }
        },

        /**
         *                                                                      .
         *                                                                      .
         * answer if we are in HiDPI mode, means having an attribute as such
         *
         * @method isHiDPI()
         */
        isHiDPI: function() {
            return this.getAttribute('hidpi') !== null;
        },

        /**
         *                                                                      .
         *                                                                      .
         * initialize our drawing surface
         *
         * @method initCanvas()
         */
        initCanvas: function() {

            var self = this;
            var interval = this.resolveProperty('repaintIntervalRate');
            this.canvas = this.shadowRoot.querySelector('fin-canvas');
            this.canvas.setAttribute('fps', interval || 15);

            //this.shadowRoot.appendChild(domCanvas);

            //this.canvas = this.shadowRoot.querySelector('fin-canvas');

            //proxy the hidpi attribute through to the canvas
            this.canvas.isHiDPI = function() {
                return self.isHiDPI();
            };

            this.canvas.style.position = 'absolute';
            this.canvas.style.top = 0;
            this.canvas.style.right = '-200px';
            //leave room for the vertical scrollbar
            //this.canvas.style.marginRight = '15px';
            this.canvas.style.bottom = 0;
            //leave room for the horizontal scrollbar
            //this.canvas.style.marginBottom = '15px';
            this.canvas.style.left = 0;

            this.canvas.resizeNotification = function() {
                self.resized();
            };

            this.addFinEventListener('fin-mousemove', function(e) {
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseMove(mouseEvent);
            });

            this.addFinEventListener('fin-mousedown', function(e) {
                self.stopEditing();
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseDown(mouseEvent);
            });

            this.addFinEventListener('fin-mouseup', function(e) {
                self.dragging = false;
                if (self.isScrollingNow()) {
                    self.setScrollingNow(false);
                }
                if (self.columnDragAutoScrolling) {
                    self.columnDragAutoScrolling = false;
                }
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseUp(mouseEvent);
            });

            this.addFinEventListener('fin-tap', function(e) {
                var mouse = e.detail.mouse;
                var tapEvent = self.getGridCellFromMousePoint(mouse);
                tapEvent.primitiveEvent = e;
                self.delegateTap(tapEvent);
            });

            this.addFinEventListener('fin-drag', function(e) {
                self.dragging = true;
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseDrag(mouseEvent);
            });

            this.addFinEventListener('fin-keydown', function(e) {
                self.delegateKeyDown(e);
            });

            this.addFinEventListener('fin-keyup', function(e) {
                self.delegateKeyUp(e);
            });

            this.addFinEventListener('fin-track', function(e) {
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

            this.addFinEventListener('fin-holdpulse', function(e) {
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateHoldPulse(mouseEvent);
            });

            this.addFinEventListener('fin-dblclick', function(e) {
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateDoubleClick(mouseEvent);
            });

            this.addFinEventListener('fin-wheelmoved', function(e) {
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e.detail.primitiveEvent;
                self.delegateWheelMoved(mouseEvent);
            });
        },

        addFinEventListener: function(eventName, callback) {
            this.canvas.addEventListener(eventName, callback);
        },

        setScrollingNow: function(isItNow) {
            this.scrollingNow = isItNow;
        },

        isScrollingNow: function() {
            return this.scrollingNow;
        },

        /**
         *                                                                      .
         *                                                                      .
         * answer if the mouseEvent coordinates are over a column divider
         *
         * @method overColumnDivider(mouseEvent)
         */
        overColumnDivider: function(mouseEvent) {
            var x = mouseEvent.primitiveEvent.detail.mouse.x;
            var whichCol = this.getRenderer().overColumnDivider(x);
            return whichCol;
        },

        /**
         *                                                                      .
         *                                                                      .
         * answer if the mouseEvent coordinates are over a column divider
         *
         * @method overRowDivider(mouseEvent)
         */
        overRowDivider: function(mouseEvent) {
            var y = mouseEvent.primitiveEvent.detail.mouse.y;
            var which = this.getRenderer().overRowDivider(y);
            return which;
        },

        // /**
        //  *                                                                      .
        //  *                                                                      .
        //  * turn on the column resize cursor
        //  *
        //  * @method beColumnResizeCursor()
        //  */
        // beColumnResizeCursor: function() {
        //     this.style.cursor = 'col-resize';
        // },

        // *
        //  *                                                                      .
        //  *                                                                      .
        //  * turn on the column resize cursor
        //  *
        //  * @method bePointerCursor()

        // bePointerCursor: function() {
        //     this.style.cursor = 'pointer';
        // },

        // /**
        //  *                                                                      .
        //  *                                                                      .
        //  * turn on the column resize cursor
        //  *
        //  * @method beMoveCursor()
        //  */

        // beMoveCursor: function() {
        //     this.style.cursor = 'move';
        // },

        beCursor: function(cursorName) {
            this.style.cursor = cursorName;
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
         * Generate a function name and call it on self.  This should also be delegated through PluggableBehavior keeping the default implementation here though.
         *
         * @method keydown(event)
         */
        delegateKeyUp: function(e) {
            var behavior = this.getBehavior();
            behavior.onKeyUp(this, e);
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
         * get the pixel coordinates of just the center 'main" data area
         *
         * @method getDataBounds()
         */
        getDataBounds: function() {
            var colDNDHackWidth = 200; //this was a hack to help with column dnd, need to factor this into a shared variable
            var behavior = this.getBehavior();
            var b = this.canvas.bounds;

            var x = behavior.getFixedColumnsWidth() + 2;
            var y = behavior.getFixedRowsHeight() + 2;

            var result = rectangles.rectangle.create(x, y, b.origin.x + b.extent.x - x - colDNDHackWidth, b.origin.y + b.extent.y - y);
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

            this.cellEdtr = cellEditor;

            var cell = coordinates.gridCell;
            var behavior = this.getBehavior();
            var scrollTop = this.getVScrollValue();
            var scrollLeft = this.getHScrollValue();

            var numFixedColumns = behavior.getFixedColumnCount();
            var numFixedRows = behavior.getFixedRowCount();

            var x = cell.x - numFixedColumns + scrollLeft;
            var y = cell.y - numFixedRows + scrollTop;

            if (x < 0 || y < 0) {
                return;
            }

            var editPoint = rectangles.point.create(x, y);
            this.setMouseDown(editPoint);
            this.setDragExtent(rectangles.point.create(0, 0));

            this.shadowRoot.appendChild(cellEditor);
            cellEditor.grid = this;
            cellEditor.beginEditAt(editPoint);
        },

        /**
         *                                                                      .
         *                                                                      .
         * Answer if a specific col is fully visible
         *
         * @method isDataColVisible(columnIndex)
         */
        isDataColVisible: function(columnIndex) {
            var isVisible = this.getRenderer().isColVisible(columnIndex);
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
         * @method isDataVisible(columnIndex,rowIndex)
         */
        isDataVisible: function(columnIndex, rowIndex) {
            var isVisible = this.isDataRowVisible(rowIndex) && this.isDataColVisible(columnIndex);
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
            //-1 because we want only fully visible columns, don't include partially
            //viewable columns
            var viewableColumns = this.getViewableColumns() - 1;
            if (!this.isDataColVisible(c)) {
                //the scroll position is the leftmost column
                var newSX = offsetX < 0 ? c : c - viewableColumns;
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
         * synthesize and fire a scroll event
         *
         * @method fireScrollEvent(y)
         */
        fireScrollEvent: function(type, oldValue, newValue) {
            var event = new CustomEvent(type, {
                detail: {
                    oldValue: oldValue,
                    value: newValue,
                    time: Date.now()
                }
            });
            this.dispatchEvent(event);

            //make the scrollbars show up
            var self = this;
            self.lastScrollTime = Date.now();
            var hoverClassOver = self.resolveProperty('scrollbarHoverOver');
            var hoverClassOff = self.resolveProperty('scrollbarHoverOff');
            if (!self.resolveProperty('scrollingEnabled')) {
                hoverClassOver = 'hidden';
                hoverClassOff = 'hidden';
            }
            if (type === 'fin-scroll-x') {
                self.sbHScroller.classList.remove(hoverClassOff);
                self.sbHScroller.classList.add(hoverClassOver);
                setTimeout(function() {
                    if (!self.sbMouseIsDown && !self.scrollBarHasMouse && Date.now() - self.lastScrollTime > 100) {
                        self.sbHScroller.classList.remove(hoverClassOver);
                        self.sbHScroller.classList.add(hoverClassOff);
                    }
                }, 700);
            } else {
                self.sbVScroller.classList.remove(hoverClassOff);
                self.sbVScroller.classList.add(hoverClassOver);
                setTimeout(function() {
                    if (!self.sbMouseIsDown && !self.scrollBarHasMouse && Date.now() - self.lastScrollTime > 100) {
                        self.sbVScroller.classList.remove(hoverClassOver);
                        self.sbVScroller.classList.add(hoverClassOff);
                    }
                }, 700);
            }
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
            var oldY = this.vScrlValue;
            this.vScrlValue = y;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                self.sbVRangeAdapter.subjectChanged();
                self.fireScrollEvent('fin-scroll-y', oldY, y);
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
            var oldX = this.hScrlValue;
            this.hScrlValue = x;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                self.sbHRangeAdapter.subjectChanged();
                self.fireScrollEvent('fin-scroll-x', oldX, x);
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

            var scrollbars = this.shadowRoot.querySelectorAll('fin-vampire-bar');
            this.sbHScroller = scrollbars[0];
            this.sbVScroller = scrollbars[1];

            this.sbHScroller.onUpClick = function() {
                self.scrollHBy(1);
                self.isScrollButtonClick = true;
            };

            this.sbHScroller.onDownClick = function() {
                self.scrollHBy(-1);
                self.isScrollButtonClick = true;
            };

            this.sbHScroller.onUpHold = function(event) {
                event.preventTap();
                self.scrollHBy(1);
                self.isScrollButtonClick = true;
            };

            this.sbHScroller.onDownHold = function(event) {
                event.preventTap();
                self.scrollHBy(-1);
                self.isScrollButtonClick = true;
            };

            this.sbHScroller.onmouseover = function(event) {
                noop(event);
                self.isScrollButtonClick = false;
                var hoverClassOver = self.resolveProperty('scrollbarHoverOver');
                var hoverClassOff = self.resolveProperty('scrollbarHoverOff');
                if (!self.resolveProperty('scrollingEnabled')) {
                    hoverClassOver = 'hidden';
                    hoverClassOff = 'hidden';
                }
                self.sbHScroller.classList.remove(hoverClassOff);
                self.sbHScroller.classList.add(hoverClassOver);
            };

            this.sbHScroller.onmouseout = function(event) {
                noop(event);
                if (self.sbMouseIsDown) {
                    return;
                } else {
                    var hoverClassOver = self.resolveProperty('scrollbarHoverOver');
                    var hoverClassOff = self.resolveProperty('scrollbarHoverOff');
                    if (!self.resolveProperty('scrollingEnabled')) {
                        hoverClassOver = 'hidden';
                        hoverClassOff = 'hidden';
                    }
                    self.sbHScroller.classList.remove(hoverClassOver);
                    self.sbHScroller.classList.add(hoverClassOff);
                }
            };


            this.sbVScroller.onmouseover = function(event) {
                noop(event);
                self.isScrollButtonClick = false;
                var hoverClassOver = self.resolveProperty('scrollbarHoverOver');
                var hoverClassOff = self.resolveProperty('scrollbarHoverOff');
                if (!self.resolveProperty('scrollingEnabled')) {
                    hoverClassOver = 'hidden';
                    hoverClassOff = 'hidden';
                }
                self.sbVScroller.classList.remove(hoverClassOff);
                self.sbVScroller.classList.add(hoverClassOver);
            };

            this.sbVScroller.onmouseout = function(event) {
                noop(event);
                if (self.sbMouseIsDown) {
                    return;
                } else {
                    var hoverClassOver = self.resolveProperty('scrollbarHoverOver');
                    var hoverClassOff = self.resolveProperty('scrollbarHoverOff');
                    if (!self.resolveProperty('scrollingEnabled')) {
                        hoverClassOver = 'hidden';
                        hoverClassOff = 'hidden';
                    }
                    self.sbVScroller.classList.remove(hoverClassOver);
                    self.sbVScroller.classList.add(hoverClassOff);
                }
            };

            this.addEventListener('mousedown', function() {
                self.sbMouseIsDown = true;
            });


            this.sbVScroller.onUpClick = function() {
                self.scrollVBy(-1);
                self.isScrollButtonClick = true;
            };

            this.sbVScroller.onDownClick = function() {
                self.scrollVBy(1);
                self.isScrollButtonClick = true;
            };

            this.sbVScroller.onUpHold = function(event) {
                event.preventTap();
                self.scrollVBy(-1);
                self.isScrollButtonClick = true;
            };

            this.sbVScroller.onDownHold = function(event) {
                event.preventTap();
                self.scrollVBy(1);
                self.isScrollButtonClick = true;
            };

            this.addEventListener('mousedown', function() {
                self.sbMouseIsDown = true;
            });

            document.addEventListener('mouseup', function(e) {
                noop(e);
                if (!self.sbMouseIsDown) {
                    return;
                }
                self.sbMouseIsDown = false;
                self.takeFocus();
                var x = e.x || e.clientX;
                var y = e.y || e.clientY;
                var elementAt = self.shadowRoot.elementFromPoint(x, y);
                self.scrollBarHasMouse = (elementAt === self.sbVScroller || elementAt === self.sbHScroller);
                if (!self.scrollBarHasMouse) {
                    var hoverClassOver = self.resolveProperty('scrollbarHoverOver');
                    var hoverClassOff = self.resolveProperty('scrollbarHoverOff');
                    if (!self.resolveProperty('scrollingEnabled')) {
                        hoverClassOver = 'hidden';
                        hoverClassOff = 'hidden';
                    }
                    self.sbVScroller.classList.remove(hoverClassOver);
                    self.sbHScroller.classList.remove(hoverClassOver);
                    self.sbVScroller.classList.add(hoverClassOff);
                    self.sbHScroller.classList.add(hoverClassOff);
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
            var numColumns = behavior.getColumnCount();
            var numRows = behavior.getRowCount();
            var bounds = this.getBounds();
            if (!bounds) {
                return;
            }
            var scrollableHeight = bounds.height() - behavior.getFixedRowsHeight();
            var scrollableWidth = bounds.width() - behavior.getFixedColumnsMaxWidth() - 200;

            var lastPageColumnCount = 0;
            var columnsWidth = 0;
            for (; lastPageColumnCount < numColumns; lastPageColumnCount++) {
                var eachWidth = behavior.getColumnWidth(numColumns - lastPageColumnCount - 1);
                columnsWidth = columnsWidth + eachWidth;
                if (columnsWidth > scrollableWidth) {
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

            this.sbHScrlCfg.rangeStop = behavior.getColumnCount() - lastPageColumnCount;

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
         * Answers the number of viewable columns, including any partially viewable columns.
         *
         * @method getViewableColumns()
         */
        getViewableColumns: function() {
            return this.getRenderer().getViewableColumns();
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

        getColumnWidth: function(columnIndex) {
            return this.getBehavior().getColumnWidth(columnIndex);
        },

        setColumnWidth: function(columnIndex, columnWidth) {
            this.getBehavior().setColumnWidth(columnIndex, columnWidth);
        },

        getFixedColumnWidth: function(columnIndex) {
            return this.getBehavior().getFixedColumnWidth(columnIndex);
        },

        getFixedColumnsWidth: function() {
            return this.getBehavior().getFixedColumnsWidth();
        },

        setFixedColumnWidth: function(columnIndex, columnWidth) {
            this.getBehavior().setFixedColumnWidth(columnIndex, columnWidth);
        },

        getRowHeight: function(index) {
            return this.getBehavior().getRowHeight(index);
        },

        setRowHeight: function(index, height) {
            this.getBehavior().setRowHeight(index, height);
        },

        getFixedRowHeight: function(index) {
            return this.getBehavior().getFixedRowHeight(index);
        },

        setFixedRowHeight: function(index, height) {
            this.getBehavior().setFixedRowHeight(index, height);
        },

        getFixedRowsHeight: function() {
            return this.getBehavior().getFixedRowsHeight();
        },

        getColumnCount: function() {
            return this.getBehavior().getColumnCount();
        },

        getRowCount: function() {
            return this.getBehavior().getRowCount();
        },

        getFixedColumnCount: function() {
            return this.getBehavior().getFixedColumnCount();
        },

        getFixedRowCount: function() {
            return this.getBehavior().getFixedRowCount();
        },

        topLeftClicked: function(mouse) {
            this.getBehavior().topLeftClicked(this, mouse);
        },

        fixedRowClicked: function(mouse) {
            this.getBehavior().fixedRowClicked(this, mouse);
        },

        fixedColumnClicked: function(mouse) {
            this.getBehavior().fixedColumnClicked(this, mouse);
        },

        activateEditor: function(event) {
            var gridCell = event.gridCell;
            var mX = this.getHScrollValue() + gridCell.x - 1;
            var mY = this.getVScrollValue() + gridCell.y - 1;

            var editor = this.getCellEditorAt(mX, mY);
            this.editAt(editor, event);
        },

        getCellEditorAt: function(x, y) {
            return this.getBehavior().getCellEditorAt(x, y);
        },

        toggleHiDPI: function() {
            if (this.canvas.isHiDPI()) {
                this.removeAttribute('hidpi');
            } else {
                this.setAttribute('hidpi', null);
            }
            this.canvas.resize();
        },

        getHiDPI: function(ctx) {
            if (window.devicePixelRatio && this.canvas.isHiDPI()) {
                var devicePixelRatio = window.devicePixelRatio || 1;
                var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                    ctx.mozBackingStorePixelRatio ||
                    ctx.msBackingStorePixelRatio ||
                    ctx.oBackingStorePixelRatio ||
                    ctx.backingStorePixelRatio || 1;

                var ratio = devicePixelRatio / backingStoreRatio;
                return ratio;
            } else {
                return 1;
            }
        },
        getLeftSideSize: function(index) {
            return this.renderer.getLeftSideSize(index);
        },
        getTopSideSize: function(index) {
            return this.renderer.getTopSideSize(index);
        },
        resolveCellEditor: function(name) {
            return this.cellEditors[name];
        }

    });

})(); /* jslint ignore:line */
