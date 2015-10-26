/* global alert, SimpleLRU, FinBar */

'use strict';

/**
 * @module .\fin-hypergrid
 * @description
 This is the main polymer web-component of the hypergrid project, you create an "instance" of the hypergrid by
 1. programmatically
 ```
 var myInstance = document.createElement('fin-hypergrid');
 ```
 2. or directly in the html
 ```
 <fin-hypergrid></fin-hypergrid>
 ```
 */

(function() {
    var rectangles;
    var globalCellEditors = {};
    var propertiesInitialized = false;

    var noop = function() {};

    var initializeBasicCellEditors = function() {

        initializeCellEditor('fin-hypergrid-cell-editor-textfield');
        initializeCellEditor('fin-hypergrid-cell-editor-choice');
        initializeCellEditor('fin-hypergrid-cell-editor-combo');
        initializeCellEditor('fin-hypergrid-cell-editor-color');
        initializeCellEditor('fin-hypergrid-cell-editor-date');
        initializeCellEditor('fin-hypergrid-cell-editor-slider');
        initializeCellEditor('fin-hypergrid-cell-editor-spinner');
    };

    var initializeCellEditor = function(name) {
        var cellEditor = document.createElement(name);
        globalCellEditors[cellEditor.alias] = cellEditor;
    };
    /**
     *
     * @property {object} fontData - the cached font heights
     */
    var fontData = {};

    /**
     *
     * @property {SimpleLRU} textWidthCache - a LRU cache of 10000 of text widths
     */
    var textWidthCache = new SimpleLRU(2000);


    var getTextWidth = function(gc, string) {
        if (string === null || string === undefined) {
            return 0;
        }
        string = string + '';
        if (string.length === 0) {
            return 0;
        }
        var key = gc.font + string;
        var width = textWidthCache.get(key);
        if (!width) {
            width = gc.measureText(string).width;
            textWidthCache.set(key, width);
        }
        return width;
    };

    var getTextHeight = function(font) {

        var result = fontData[font];
        if (result) {
            return result;
        }
        result = {};
        var text = document.createElement('span');
        text.textContent = 'Hg';
        text.style.font = font;

        var block = document.createElement('div');
        block.style.display = 'inline-block';
        block.style.width = '1px';
        block.style.height = '0px';

        var div = document.createElement('div');
        div.appendChild(text);
        div.appendChild(block);

        div.style.position = 'absolute';
        document.body.appendChild(div);

        try {

            block.style.verticalAlign = 'baseline';

            var blockRect = block.getBoundingClientRect();
            var textRect = text.getBoundingClientRect();

            result.ascent = blockRect.top - textRect.top;

            block.style.verticalAlign = 'bottom';
            result.height = blockRect.top - textRect.top;

            result.descent = result.height - result.ascent;

        } finally {
            document.body.removeChild(div);
        }
        if (result.height !== 0) {
            fontData[font] = result;
        }
        return result;
    };

    var defaultProperties = function() {
        var properties = {
            //these are for the theme
            font: '13px Tahoma, Geneva, sans-serif',
            color: 'rgb(25, 25, 25)',
            backgroundColor: 'rgb(241, 241, 241)',
            foregroundSelectionColor: 'rgb(25, 25, 25)',
            backgroundSelectionColor: 'rgb(183, 219, 255)',

            columnHeaderFont: '12px Tahoma, Geneva, sans-serif',
            columnHeaderColor: 'rgb(25, 25, 25)',
            columnHeaderBackgroundColor: 'rgb(223, 227, 232)',
            columnHeaderForegroundSelectionColor: 'rgb(25, 25, 25)',
            columnHeaderBackgroundSelectionColor: 'rgb(255, 220, 97)',
            columnHeaderForegroundColumnSelectionColor: 'rgb(25, 25, 25)',
            columnHeaderBackgroundColumnSelectionColor: 'rgb(255, 180, 0)',

            rowHeaderFont: '12px Tahoma, Geneva, sans-serif',
            rowHeaderColor: 'rgb(25, 25, 25)',
            rowHeaderBackgroundColor: 'rgb(223, 227, 232)',
            rowHeaderForegroundSelectionColor: 'rgb(25, 25, 25)',
            rowHeaderBackgroundSelectionColor: 'rgb(255, 220, 97)',
            rowHeaderForegroundRowSelectionColor: 'rgb(25, 25, 25)',
            rowHeaderBackgroundRowSelectionColor: 'rgb(255, 180, 0)',

            filterFont: '12px Tahoma, Geneva, sans-serif',
            filterColor: 'rgb(25, 25, 25)',
            filterBackgroundColor: 'white',
            filterForegroundSelectionColor: 'rgb(25, 25, 25)',
            filterBackgroundSelectionColor: 'rgb(255, 220, 97)',

            treeColumnFont: '12px Tahoma, Geneva, sans-serif',
            treeColumnColor: 'rgb(25, 25, 25)',
            treeColumnBackgroundColor: 'rgb(223, 227, 232)',
            treeColumnForegroundSelectionColor: 'rgb(25, 25, 25)',
            treeColumnBackgroundSelectionColor: 'rgb(255, 220, 97)',
            treeColumnForegroundColumnSelectionColor: 'rgb(25, 25, 25)',
            treeColumnBackgroundColumnSelectionColor: 'rgb(255, 180, 0)',

            backgroundColor2: 'rgb(201, 201, 201)',
            voffset: 0,
            scrollbarHoverOver: 'visible',
            scrollbarHoverOff: 'hidden',
            scrollingEnabled: true,
            vScrollbarClassPrefix: 'fin-sb-user',
            hScrollbarClassPrefix: 'fin-sb-user',

            //these used to be in the constants element
            fixedRowAlign: 'center',
            fixedColAlign: 'center',
            cellPadding: 5,
            gridLinesH: true,
            gridLinesV: true,
            lineColor: 'rgb(199, 199, 199)',
            lineWidth: 0.4,

            defaultRowHeight: 15,
            defaultColumnWidth: 100,

            //for immediate painting, set these values to 0, true respectively
            repaintIntervalRate: 4,
            repaintImmediately: false,

            //enable or disable double buffering
            useBitBlit: false,

            useHiDPI: true,
            editorActivationKeys: ['alt', 'esc'],
            columnAutosizing: false,
            readOnly: false,

            //inhertied by cell renderers
            getTextWidth: getTextWidth,
            getTextHeight: getTextHeight,

            fixedColumnCount: 0,
            fixedRowCount: 0,
            headerColumnCount: 0,

            showRowNumbers: true,
            showHeaderRow: true,
            showFilterRow: true,

            cellSelection: true,
            columnSelection: true,
            rowSelection: true,

            columnAutosizing: true,
            rowResize: false

        };
        return properties;
    };

    var normalizeRect = function(rect) {
        var o = rect.origin;
        var c = rect.corner;

        var ox = Math.min(o.x, c.x);
        var oy = Math.min(o.y, c.y);

        var cx = Math.max(o.x, c.x);
        var cy = Math.max(o.y, c.y);

        var result = rectangles.rectangle.create(ox, oy, cx - ox, cy - oy);

        return result;
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

        polymerTheme.columnHeaderBackgroundColor = p.color;
        polymerTheme.rowHeaderBackgroundColor = p.color;
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

        polymerTheme.columnHeaderColor = p.color;
        polymerTheme.rowHeaderColor = p.color;
        polymerTheme.topLeftColor = p.color;


        polymerTheme.backgroundSelectionColor = p.backgroundColor;
        polymerTheme.foregroundSelectionColor = p.color;

        pb.setAttribute('secondary', false);
        pb.setAttribute('warning', true);

        polymerTheme.columnHeaderForegroundSelectionColor = p.color;
        polymerTheme.columnHeaderBackgroundSelectionColor = p.backgroundColor;
        polymerTheme.rowHeaderForegroundSelectionColor = p.color;
        polymerTheme.fixedColumnBackgroundSelectionColor = p.backgroundColor;

        //check if there is actually a theme loaded if not, clear out all bogus values
        //from my cache
        if (polymerTheme.columnHeaderBackgroundSelectionColor === 'rgba(0, 0, 0, 0)' ||
            polymerTheme.lineColor === 'transparent') {
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

    var valueOrFunctionExecute = function(valueOrFunction) {
        var isFunction = (((typeof valueOrFunction)[0]) === 'f');
        var result = isFunction ? valueOrFunction() : valueOrFunction;
        if (!result && result !== 0) {
            return '';
        }
        return result;
    };

    var defaults, polymerTheme, globalProperties;

    (function() {
        defaults = defaultProperties();
        polymerTheme = Object.create(defaults);
        globalProperties = Object.create(polymerTheme);
    })();

    Polymer({ /* jslint ignore:line */

        /**
         *
         * @property {object} behavior - a null object behavior serves as a place holder
         * @instance
         */
        behavior: {
            setScrollPositionY: noop,
            setScrollPositionX: noop,
            getColumnCount: function() {
                return 0;
            },
            getFixedColumnCount: function() {
                return 0;
            },
            getFixedColumnsWidth: function() {
                return 0;
            },
            getFixedColumnsMaxWidth: function() {
                return 0;
            },
            setRenderedWidth: function() {
                return 0;
            },
            getRowCount: function() {
                return 0;
            },
            getFixedRowCount: function() {
                return 0;
            },
            getFixedRowsHeight: function() {
                return 0;
            },
            getFixedRowsMaxHeight: function() {
                return 0;
            },
            setRenderedHeight: function() {
                return 0;
            },
            getCellProvider: noop,
            click: noop,
            doubleClick: noop
        },

        /**
         *
         * @property {boolean} isWebkit - cached result of if we are running in webkit
         * @instance
         */
        isWebkit: true,

        /**
         *
         * @property {fin-rectangle.point} mouseDown - mouseDown is the location of an initial mousedown click, either for editing a cell or for dragging a selection. see [fin-rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         * @instance
         */
        mouseDown: [],

        /**
         *
         * @property {fin-rectangle.point} dragExtent - the extent from the mousedown point during a drag operation. see [fin-rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         * @instance
         */

        dragExtent: null,

        /**
         * vScrollValue is
         *
         * @property {number} vScrollValue - a float value between 0.0 - 1.0 of the y scrollposition
         * @instance
         */
        vScrollValue: 0,

        /**
         *
         * @property {number} hScrollValue - a float value between 0.0 - 1.0 of the y scrollposition
         * @instance
         */
        hScrollValue: 0,

        /**
         *
         * @property {fin-rectange} rectangles - a polymer element instance of [fin-rectange](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         * @instance
         */
        rectangles: null,

        /**
         *
         * @property {fin-hypergrid-selection-model} selectionModel - a [fin-hypergrid-selection-model](module-._selection-model.html) instance
         * @instance
         */
        selectionModel: null,

        /**
         *
         * @property {fin-hypergrid-cell-editor} cellEditor - the current instance of [fin-hypergrid-cell-editor](module-cell-editors_base.html)
         * @instance
         */
        cellEditor: null,

        /**
         *
         * @property {boolean} sbMouseIsDown - true if the mouse button is currently down on the scrollbar, this is used to refocus the hypergrid canvas after a scrollbar scroll
         * @instance
         */
        sbMouseIsDown: false,

        /**
         *
         * @property {fin-vampire-bar} sbHScroller - an instance of [fin-vampire-bar](http://datamadic.github.io/fin-vampire-bar/components/fin-vampire-bar/)
         * @instance
         */
        sbHScroller: null,

        /**
         *
         * @property {fin-vampire-bar} sbVScroller - an instance of [fin-vampire-bar](http://datamadic.github.io/fin-vampire-bar/components/fin-vampire-bar/)
         * @instance
         */
        sbVScroller: null,

        /**
         *
         * @property {object} sbHScrollConfig - a config object allow us to dynamically reconfigure the scrollbars, it's properties include rangeStart, rangeStop, step, and page
         * @instance
         */
        sbHScrollConfig: {},

        /**
         *
         * @property {object} sbVScrollConfig - a config object to allow us to dynamically reconfigure the scrollbars, it's properties include rangeStart, rangeStop, step, and page
         * @instance
         */
        sbVScrollConfig: {},

        /**
         *
         * @property {integer} sbPrevVScrollValue - the previous value of sbVScrollVal
         * @instance
         */
        sbPrevVScrollValue: null,

        /**
         *
         * @property {integer} sbPrevHScrollValue - the previous value of sbHScrollValue
         * @instance
         */
        sbPrevHScrollValue: null,

        /**
         *
         * @property {object} sbHValueHolder - the listenable scroll model we share with the horizontal scrollbar
         * @instance
         */

        sbHValueHolder: {},

        /**
         *
         * @property {object} sbVValueHolder - the listenable scroll model we share with the vertical scrollbar
         * @instance
         */
        sbVValueHolder: {},

        /**
         * cellEditors is
         *
         * @property {object} cellEditors - the cache of singleton cellEditors
         * @instance
         */
        cellEditors: null,

        /**
         *
         * @property {object} renderOverridesCache - is the short term memory of what column I might be dragging around
         * @instance
         */

        renderOverridesCache: {},

        /**
         *
         * @property {fin-rectangle.point} hoverCell - the current hovered cell
         * @instance
         */
        hoverCell: null,


        /**
         *
         * @property {boolean} isScrollButtonClick - was the scroll button was clicked
         * @instance
         */
        isScrollButtonClick: false,


        scrollingNow: false,

        lastEdgeSelection: null,

        /**
         * @function
         * @private
         * @instance
         */
        domReady: function() {

            if (!propertiesInitialized) {
                propertiesInitialized = true;
                buildPolymerTheme();
                initializeBasicCellEditors();
            }

            this.lastEdgeSelection = [0, 0];

            var self = this;
            rectangles = rectangles || document.createElement('fin-rectangle');

            this.rectangles = rectangles;

            this.lnfProperties = Object.create(globalProperties);

            this.isWebkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1;
            this.selectionModel = document.createElement('fin-hypergrid-selection-model');
            this.selectionModel.getGrid = function() {
                return self;
            };
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

            this.numRows = 0;
            this.numColumns = 0;
            //initialize our various pieces
            this.initCanvas();
            this.initRenderer();
            this.initScrollbars();

            this.checkScrollbarVisibility();
            //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
            document.body.addEventListener('copy', function(evt) {
                self.checkClipboardCopy(evt);
            });
            this.resized();
            this.fire('load');
            this.isScrollButtonClick = false;

            this.computeCellsBounds();
        },

        /**
         * @function
         * @instance
         * @description
        clear out the LRU cache of text widths
         *
         */
        resetTextWidthCache: function() {
            textWidthCache = new SimpleLRU(10000);
        },

        getProperties: function() {
            return this.getPrivateState();
        },

        _getProperties: function() {
            return this.lnfProperties;
        },

        computeCellsBounds: function() {
            this.getRenderer().computeCellsBounds();
        },

        initializeCellEditor: function(cellEditorName) {
            initializeCellEditor(cellEditorName);
        },

        toggleColumnPicker: function() {
            this.getBehavior().toggleColumnPicker();
        },

        /**
         * @function
         * @instance
         * @description
         answers if (x,y) is currently where the pointer is hovering
         * #### returns: boolean
         * @param {integer} x - the x cell coordinate
         * @param {integer} y - the y cell coordinate
         */
        isHovered: function(x, y) {
            var p = this.getHoverCell();
            if (!p) {
                return false;
            }
            return p.x === x && p.y === y;
        },

        /**
         * @function
         * @instance
         * @description
         answers if the pointer is hovering over the column x
         * #### returns: boolean
         * @param {integer} x - the x cell coordinate
         */
        isColumnHovered: function(x) {
            var p = this.getHoverCell();
            if (!p) {
                return false;
            }
            return p.x === x;
        },

        isRowResizeable: function() {
            return this.resolveProperty('rowResize');
        },

        /**
         * @function
         * @instance
         * @description
         answers if the pointer is hovering over the row y
         * #### returns: boolean
         * @param {integer} y - the y cell coordinate
         */
        isRowHovered: function(y) {
            var p = this.getHoverCell();
            if (!p) {
                return false;
            }
            return p.y === y;
        },

        /**
         * @function
         * @instance
         * @description
         answers the cell of where the cursor is hovering
         * #### returns: fin-rectangle.point
         */
        getHoverCell: function() {
            return this.hoverCell;
        },


        /**
         * @function
         * @instance
         * @description
         set the cell of where the cursor is hovering
         * @param {fin-rectangle.point} point - an instance of [fin-rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        setHoverCell: function(point) {
            var me = this.hoverCell;
            var newPoint = rectangles.point.create(point.x, point.y);
            if (me && me.equals(newPoint)) {
                return;
            }
            this.hoverCell = newPoint;
            this.fireSyntheticOnCellEnterEvent(newPoint);
            this.repaint();
        },

        /**
         * @function
         * @description
         ammend properties for all hypergrids in this process
         * @param {object} properties - an object of various key value pairs
         * @instance
         */
        addGlobalProperties: function(properties) {
            //we check for existence to avoid race condition in initialization
            if (!globalProperties) {
                var self = this;
                setTimeout(function() {
                    self.addGlobalProperties(properties);
                }, 10);
            } else {
                this._addGlobalProperties(properties);
            }

        },

        /**
         * @function
         * @description
         ammend properties for all hypergrids in this process
         * @param {object} properties - an object of various key value pairs
         * @instance
         * @private
         */
        _addGlobalProperties: function(properties) {
            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    globalProperties[key] = properties[key];
                }
            }
        },

        /**
         * @function
         * @description
         ammend properties for this hypergrid only
         * @param {object} properties - an object of various key value pairs
         * @instance
         */
        addProperties: function(moreProperties) {
            var properties = this.getProperties();
            for (var key in moreProperties) {
                if (moreProperties.hasOwnProperty(key)) {
                    properties[key] = moreProperties[key];
                }
            }
            this.refreshProperties();
        },

        /**
         * @function
         * @description
         utility function to push out properties if we change them
         * @param {object} properties - an object of various key value pairs
         * @instance
         */

        refreshProperties: function() {
            var interval = this.resolveProperty('repaintIntervalRate');
            var useBitBlit = this.resolveProperty('useBitBlit');
            this.canvas = this.shadowRoot.querySelector('fin-canvas');
            interval = interval === undefined ? 15 : interval;
            console.log('refresh rate = ' + interval);
            this.canvas.setAttribute('fps', interval);
            this.canvas.setAttribute('bitblit', useBitBlit === true);
            this.checkScrollbarVisibility();
            this.getBehavior().defaultRowHeight = null;
            if (this.isColumnAutosizing()) {
                this.getBehavior().autosizeAllColumns();
            }
        },

        /**
         * @function
         * @description
         answer the state object for remembering our state, see the [memento pattern](http://en.wikipedia.org/wiki/Memento_pattern)
         * #### returns: object
         * @instance
         */
        getPrivateState: function() {
            var state = this.getBehavior().getPrivateState();
            return state;
        },

        /**
         * @function
         * @instance
         * @description
         set the state object to return to a specific user configuration
         * @param {object} state - a memento object, see the [memento pattern](http://en.wikipedia.org/wiki/Memento_pattern)
         */
        setState: function(state) {
            var self = this;
            this.getBehavior().setState(state);
            setTimeout(function() {
                self.behaviorChanged();
                self.synchronizeScrollingBoundries();
            }, 100);
        },

        /**
         * @function
         * @instance
         * @description
         answer the initial mouse position on a mouse down event for cell editing or a drag operation
         * #### returns: object
         * @instance
         */
        getMouseDown: function() {
            var last = this.mouseDown.length - 1;
            if (last < 0) {
                return null;
            }
            return this.mouseDown[last];
        },

        /**
         * @function
         * @instance
         * @description
         remove the last item from the mouse down stack
         *
         */
        popMouseDown: function() {
            if (this.mouseDown.length === 0) {
                return;
            }
            this.mouseDown.length = this.mouseDown.length - 1;

        },

        /**
         * @function
         * @instance
         * @description
         empty out the mouse down stack
         *
         */
        clearMouseDown: function() {
            this.mouseDown = [rectangles.point.create(-1, -1)];
            this.dragExtent = null;
        },

        /**
         * @function
         * @instance
         * @description
         set the mouse point that initated a cell edit or drag operation
         *
         * @param {fin-rectangle.point} point - a [fin-rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/) object
         */
        setMouseDown: function(point) {
            this.mouseDown.push(point);
        },

        /**
         * @function
         * @instance
         * @description
         return the extent point of the current drag selection rectangle
         *
         * #### returns: [fin-rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        getDragExtent: function() {
            return this.dragExtent;
        },

        /**
         * @function
         * @instance
         * @descriptionset the extent point of the current drag selection operation
         *
         * @param {fin-rectangle.point}
         */
        setDragExtent: function(point) {
            this.dragExtent = point;
        },

        /**
         * @function
         * @instance
         * @description
         iterate over the plugins invoking the passed in function with each
         *
         * @param {function} func - the function to invoke on all the plugins
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
         * @function
         * @instance
         * @description
         The CellProvider is accessed through Hypergrid because Hypergrid is the mediator and should have ultimate control on where it comes from.  The default is to delegate through the behavior object.
         *
         * #### returns: [fin-hypergrid-cell-provider](module-._cell-provider.html)
         */
        getCellProvider: function() {
            var provider = this.getBehavior().getCellProvider();
            return provider;
        },

        /**
         * @function
         * @instance
         * @description
         This function is a callback from the HypergridRenderer sub-component.   It is called after each paint of the canvas.
         *
         */
        gridRenderedNotification: function() {
            this.updateRenderedSizes();
            if (this.cellEditor) {
                this.cellEditor.gridRenderedNotification();
            }
            this.checkColumnAutosizing();
            this.fireSyntheticGridRenderedEvent();
        },

        /**
         * @function
         * @instance
         * @description
         the grid has just been rendered, make sure the column widths are optimal
         *
         */
        checkColumnAutosizing: function() {
            var behavior = this.getBehavior();
            behavior.autoSizeRowNumberColumn();
            if (this.isColumnAutosizing()) {
                behavior.checkColumnAutosizing(false);
            }
        },
        /**
         * @function
         * @instance
         * @description
          Notify the GridBehavior how many rows and columns we just rendered.
         *
         */
        updateRenderedSizes: function() {
            var behavior = this.getBehavior();
            //add one to each of these values as we want also to include
            //the columns and rows that are partially visible
            behavior.setRenderedColumnCount(this.getVisibleColumns() + 1);
            behavior.setRenderedRowCount(this.getVisibleRows() + 1);
        },

        /**
         * @function
         * @instance
         * @description
         If we have focus, copy our current selection data to the system clipboard.
         *
         * @param {event} event - the copy system event
         */
        checkClipboardCopy: function(event) {
            if (!this.hasFocus()) {
                return;
            }
            event.preventDefault();
            var csvData = this.getSelectionAsTSV();
            event.clipboardData.setData('text/plain', csvData);
        },

        /**
         * @function
         * @instance
         * @description
         answers true if we have any selections
         *
         * #### returns: boolean
         */
        hasSelections: function() {
            if (!this.getSelectionModel) {
                return; // were not fully initialized yet
            }
            return this.getSelectionModel().hasSelections();
        },

        /**
         * @function
         * @instance
         * @description
         answers a tab seperated value string from the selection and our data.
         *
         * #### returns: string
         */
        getSelectionAsTSV: function() {
            var sm = this.getSelectionModel();
            if (sm.hasSelections()) {
                var selections = this.getSelectionMatrix();
                selections = selections[selections.length - 1];
                return this.getMatrixSelectionAsTSV(selections);
            } else if (sm.hasRowSelections()) {
                return this.getMatrixSelectionAsTSV(this.getRowSelectionMatrix());
            } else if (sm.hasColumnSelections()) {
                return this.getMatrixSelectionAsTSV(this.getColumnSelectionMatrix());
            }
        },

        getMatrixSelectionAsTSV: function(selections) {
            //only use the data from the last selection
            if (selections.length === 0) {
                return;
            }
            var width = selections.length;
            var height = selections[0].length;
            var area = width * height;
            //disallow if selection is too big
            if (area > 20000) {
                alert('selection size is too big to copy to the paste buffer');
                return '';
            }
            var collector = [];
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var data = selections[x][y];
                    collector.push(data);
                    if (x !== width - 1) {
                        collector.push('\t');
                    }
                }
                if (y !== height - 1) {
                    collector.push('\n');
                }
            }
            var text = collector.join('');
            return text;
        },

        /**
         * @function
         * @instance
         * @description
         Answer if we currently have focus
         *
         * #### returns: boolean
         */
        hasFocus: function() {
            return this.getCanvas().hasFocus();
        },

        /**
         * @function
         * @instance
         * @description
         Clear all the selections out
         *
         */
        clearSelections: function() {
            this.getSelectionModel().clear();
            this.clearMouseDown();
        },

        /**
         * @function
         * @instance
         * @description
         Clear just the most recent selection
         *
         */
        clearMostRecentSelection: function() {
            this.getSelectionModel().clearMostRecentSelection();
        },

        /**
         * @function
         * @instance
         * @description
         Clear just the most recent column selection
         *
         */
        clearMostRecentColumnSelection: function() {
            this.getSelectionModel().clearMostRecentColumnSelection();
        },

        /**
         * @function
         * @instance
         * @description
         Clear just the most recent column selection
         *
         */
        clearMostRecentRowSelection: function() {
            this.getSelectionModel().clearMostRecentRowSelection();
        },

        /**
         * @function
         * @instance
         * @description
         Select a specific region by origin and extent
         *
         * @param {integer} ox - origin x
         * @param {integer} oy - origin y
         * @param {integer} ex - extent x
         * @param {integer} ex - extent y
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
         * @function
         * @instance
         * @description
         Answer if a specific point is selected
         * #### returns: boolean
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        isSelected: function(x, y) {
            return this.getSelectionModel().isSelected(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         Answer if a specific col is selected anywhere in the entire table
         * #### returns: boolean
         * @param {integer} col - column index
         */
        isCellSelectedInRow: function(col) {
            var selectionModel = this.getSelectionModel();
            var isSelected = selectionModel.isCellSelectedInRow(col);
            return isSelected;
        },

        /**
         * @function
         * @instance
         * @description
         Answer if a specific row is selected anywhere in the entire table
         * #### returns: boolean
         * @param {integer} row - row index
         */
        isCellSelectedInColumn: function(row) {
            var selectionModel = this.getSelectionModel();
            var isSelected = selectionModel.isCellSelectedInColumn(row);
            return isSelected;
        },

        /**
         * @function
         * @instance
         * @description
         answers the selection model
         *
         * #### return: [fin-hypergrid-selection-model](module-._selection-model.html)
         */
        getSelectionModel: function() {
            return this.selectionModel;
        },

        /**
         * @function
         * @instance
         * @description
         return the behavior (model)
         *
         * #### returns: [fin-hypergrid-behavior-base](module-behaviors_base.html)
         */
        getBehavior: function() {
            return this.behavior;
        },

        /**
         * @function
         * @instance
         * @description
         Set the Behavior (model) object for this grid control.  This can be done dynamically.
         *
         * @param {fin-hypergrid-behavior-base} newBehavior - see [fin-hypergrid-behavior-base](module-behaviors_base.html)
         */
        setBehavior: function(newBehavior) {

            this.behavior = newBehavior;
            this.behavior.setGrid(this);

            this.behavior.changed = this.behaviorChanged.bind(this);
            this.behavior.shapeChanged = this.behaviorShapeChanged.bind(this);
            this.behavior.stateChanged = this.behaviorStateChanged.bind(this);
        },

        /**
         * @function
         * @instance
         * @description
         I've been notified that the behavior has changed
         *
         */
        behaviorChanged: function() {
            if (this.numColumns !== this.getColumnCount() || this.numRows !== this.getRowCount()) {
                this.numColumns = this.getColumnCount();
                this.numRows = this.getRowCount();
                this.behaviorShapeChanged();
            }
            this.computeCellsBounds();
            this.repaint();
        },

        /**
         * @function
         * @instance
         * @description
         answers my bounds as [fin-rectangle](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         *
         * #### returns: [fin-rectangle](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
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
         * @function
         * @instance
         * @description
         return the value of a lnf property
         *
         * #### returns: string
         * @param {string} key - a look and feel key
         */
        resolveProperty: function(key) {
            return this.getProperties()[key];
        },

        /**
         * @function
         * @instance
         * @description
         the dimensions of the grid data have changed, you've been notified
         *
         */
        behaviorShapeChanged: function() {
            this.synchronizeScrollingBoundries();
        },

        /**
         * @function
         * @instance
         * @description
         the dimensions of the grid data have changed, you've been notified
         *
         */
        behaviorStateChanged: function() {
            this.getRenderer().computeCellsBounds();
            this.repaint();
        },

        repaint: function() {
            var now = this.resolveProperty('repaintImmediately');
            var canvas = this.getCanvas();
            if (canvas) {
                if (now === true) {
                    canvas.paintNow();
                } else {
                    canvas.repaint();
                }
            }
        },

        /**
         * @function
         * @instance
         * @description
         paint immediatelly in this microtask
         *
         */
        paintNow: function() {
            var canvas = this.getCanvas();
            canvas.paintNow();
        },

        /**
         * @function
         * @instance
         * @description
         answer if we are in HiDPI mode, means having an attribute as such
         *
         * #### returns: boolean
         */
        isHiDPI: function() {
            return this.resolveProperty('useHiDPI') !== false;
        },

        /**
         * @function
         * @instance
         * @description
         initialize our drawing surface
         *
         * @private
         */
        initCanvas: function() {

            var self = this;
            var interval = this.resolveProperty('repaintIntervalRate');
            var useBitBlit = this.resolveProperty('useBitBlit');
            this.canvas = this.shadowRoot.querySelector('fin-canvas');
            interval = interval === undefined ? 15 : interval;
            this.canvas.setAttribute('fps', interval);
            this.canvas.setAttribute('bitblit', useBitBlit === true);

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

            this.addFinEventListener('fin-canvas-mousemove', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseMove(mouseEvent);
            });

            this.addFinEventListener('fin-canvas-mousedown', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
                //self.stopEditing();
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.keys = e.detail.keys;
                mouseEvent.primitiveEvent = e;
                self.mouseDownState = mouseEvent;
                self.delegateMouseDown(mouseEvent);
                self.fireSyntheticMouseDownEvent(mouseEvent);
                self.repaint();
            });


            // this.addFinEventListener('fin-canvas-click', function(e) {
            //     if (self.resolveProperty('readOnly')) {
            //         return;
            //     }
            //     //self.stopEditing();
            //     var mouse = e.detail.mouse;
            //     var mouseEvent = self.getGridCellFromMousePoint(mouse);
            //     mouseEvent.primitiveEvent = e;
            //     self.fireSyntheticClickEvent(mouseEvent);
            // });

            this.addFinEventListener('fin-canvas-mouseup', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
                self.dragging = false;
                if (self.isScrollingNow()) {
                    self.setScrollingNow(false);
                }
                if (self.columnDragAutoScrolling) {
                    self.columnDragAutoScrolling = false;
                }
                //self.stopEditing();
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseUp(mouseEvent);
                if (self.mouseDownState) {
                    self.fireSyntheticButtonPressedEvent(self.mouseDownState.gridCell);
                }
                self.mouseDownState = null;
                self.fireSyntheticMouseUpEvent(mouseEvent);
            });

            this.addFinEventListener('fin-canvas-tap', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
                //self.stopEditing();
                var mouse = e.detail.mouse;
                var tapEvent = self.getGridCellFromMousePoint(mouse);
                tapEvent.primitiveEvent = e;
                tapEvent.keys = e.detail.keys;
                self.fireSyntheticClickEvent(tapEvent);
                self.delegateTap(tapEvent);
            });

            this.addFinEventListener('fin-canvas-drag', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
                self.dragging = true;
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseDrag(mouseEvent);
            });

            this.addFinEventListener('fin-canvas-keydown', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
                self.fireSyntheticKeydownEvent(e);
                self.delegateKeyDown(e);
            });

            this.addFinEventListener('fin-canvas-keyup', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
                self.fireSyntheticKeyupEvent(e);
                self.delegateKeyUp(e);
            });

            this.addFinEventListener('fin-canvas-track', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
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

            // this.addFinEventListener('fin-canvas-holdpulse', function(e) {
            //     console.log('holdpulse');
            //     if (self.resolveProperty('readOnly')) {
            //         return;
            //     }
            //     var mouse = e.detail.mouse;
            //     var mouseEvent = self.getGridCellFromMousePoint(mouse);
            //     mouseEvent.primitiveEvent = e;
            //     self.delegateHoldPulse(mouseEvent);
            // });

            this.addFinEventListener('fin-canvas-dblclick', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.fireSyntheticDoubleClickEvent(mouseEvent, e);
                self.delegateDoubleClick(mouseEvent);
            });

            this.addFinEventListener('fin-canvas-wheelmoved', function(e) {
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e.detail.primitiveEvent;
                self.delegateWheelMoved(mouseEvent);
            });

            this.addFinEventListener('fin-canvas-mouseout', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e.detail.primitiveEvent;
                self.delegateMouseExit(mouseEvent);
            });


            this.addFinEventListener('fin-canvas-context-menu', function(e) {
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e.detail.primitiveEvent;
                self.delegateContextMenu(mouseEvent);
            });

            this.canvas.removeAttribute('tabindex');

        },

        convertViewPointToDataPoint: function(viewPoint) {
            return this.getBehavior().convertViewPointToDataPoint(viewPoint);
        },

        convertDataPointToViewPoint: function(dataPoint) {
            return this.getBehavior().convertDataPointToViewPoint(dataPoint);
        },
        /**
         * @function
         * @instance
         * @description
         add an event listener to me
         * @param {string} eventName - the type of event we are interested in
         * @param {function} callback - the event handler
         */
        addFinEventListener: function(eventName, callback) {
            this.canvas.addEventListener(eventName, callback);
        },

        /**
         * @function
         * @instance
         * @description
         setter for scrollingNow field
         * @param {boolean} isItNow - the type of event we are interested in
         */
        setScrollingNow: function(isItNow) {
            this.scrollingNow = isItNow;
        },

        /**
         * @function
         * @instance
         * @description
         getter for scrollingNow field
         * #### returns: boolean
         */
        isScrollingNow: function() {
            return this.scrollingNow;
        },

        /**
         * @function
         * @instance
         * @description
        answer the index of the column divider that the mouseEvent coordinates are over
         * #### returns: integer
         * @param {MouseEvent} mouseEvent - the event to interogate
         */
        overColumnDivider: function(mouseEvent) {
            var x = mouseEvent.primitiveEvent.detail.mouse.x;
            var whichCol = this.getRenderer().overColumnDivider(x);
            return whichCol;
        },

        /**
         * @function
         * @instance
         * @description
        answer the index of the row divider that the mouseEvent coordinates are over
         * #### returns: integer
         * @param {MouseEvent} mouseEvent - the event to interogate
         */
        overRowDivider: function(mouseEvent) {
            var y = mouseEvent.primitiveEvent.detail.mouse.y;
            var which = this.getRenderer().overRowDivider(y);
            return which;
        },

        /**
         * @function
         * @instance
         * @description
        switch the cursor for the grid
         * @param {string} cursorName - a well know cursor name, see [cursor names](http://www.javascripter.net/faq/stylesc.htm)
         */
        beCursor: function(cursorName) {
            this.style.cursor = cursorName;
        },

        /**
         * @function
         * @instance
         * @description
        delegate the wheel moved event to the behavior
         * @param {Event} event - the pertinent event
         */
        delegateWheelMoved: function(event) {
            var behavior = this.getBehavior();
            behavior.onWheelMoved(this, event);
        },

        /**
         * @function
         * @instance
         * @description
        delegate MouseExit to the behavior (model)
         *
         * @param {Event} event - the pertinent event
         */
        delegateMouseExit: function(event) {
            var behavior = this.getBehavior();
            behavior.handleMouseExit(this, event);
        },

        /**
         * @function
         * @instance
         * @description
        delegate MouseExit to the behavior (model)
         *
         * @param {Event} event - the pertinent event
         */
        delegateContextMenu: function(event) {
            var behavior = this.getBehavior();
            behavior.onContextMenu(this, event);
        },

        /**
         * @function
         * @instance
         * @description
        delegate MouseMove to the behavior (model)
         *
         * @param {mouseDetails} mouseDetails - an enriched mouse event from fin-canvas
         */
        delegateMouseMove: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onMouseMove(this, mouseDetails);
        },

        /**
         * @function
         * @instance
         * @description
        delegate mousedown to the behavior (model)
         *
         * @param {mouseDetails} mouseDetails - an enriched mouse event from fin-canvas
         */
        delegateMouseDown: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.handleMouseDown(this, mouseDetails);
        },

        /**
         * @function
         * @instance
         * @description
        delegate mouseup to the behavior (model)
         *
         * @param {mouseDetails} mouseDetails - an enriched mouse event from fin-canvas
         */
        delegateMouseUp: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onMouseUp(this, mouseDetails);
        },

        /**
         * @function
         * @instance
         * @description
        delegate tap to the behavior (model)
         *
         * @param {mouseDetails} mouseDetails - an enriched mouse event from fin-canvas
         */
        delegateTap: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onTap(this, mouseDetails);
        },

        /**
         * @function
         * @instance
         * @description
        delegate mouseDrag to the behavior (model)
         *
         * @param {mouseDetails} mouseDetails - an enriched mouse event from fin-canvas
         */
        delegateMouseDrag: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onMouseDrag(this, mouseDetails);
        },

        /**
         * @function
         * @instance
         * @description
        we've been doubleclicked on, delegate through the behavior (model)
         *
         * @param {mouseDetails} mouseDetails - an enriched mouse event from fin-canvas
         */
        delegateDoubleClick: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onDoubleClick(this, mouseDetails);
        },

        /**
         * @function
         * @instance
         * @description
        delegate holdpulse through the behavior (model)
         *
         * @param {mouseDetails} mouseDetails - an enriched mouse event from fin-canvas
         */
        delegateHoldPulse: function(mouseDetails) {
            var behavior = this.getBehavior();
            behavior.onHoldPulse(this, mouseDetails);
        },

        /**
         * @function
         * @instance
         * @description
        Generate a function name and call it on self.  This should also be delegated through Behavior keeping the default implementation here though.
         *
         * @param {event} event - the pertinent event
         */
        delegateKeyDown: function(event) {
            var behavior = this.getBehavior();
            behavior.onKeyDown(this, event);
        },

        /**
         * @function
         * @instance
         * @description
        Generate a function name and call it on self.  This should also be delegated through Behavior keeping the default implementation here though.
         *
         * @param {event} event - the pertinent event
         */
        delegateKeyUp: function(event) {
            var behavior = this.getBehavior();
            behavior.onKeyUp(this, event);
        },

        /**
         * @function
         * @instance
         * @description
        shut down the current cell editor
         *
         */
        stopEditing: function() {
            if (this.cellEditor) {
                if (this.cellEditor.stopEditing) {
                    this.cellEditor.stopEditing();
                }
                this.cellEditor = null;
            }
        },

        /**
         * @function
         * @instance
         * @description
        register a cell editor, this is typically called from within a cell-editors installOn method, when it is being intialized as a plugin.
         *
         * @param {string} alias - the name/id of the cell editor
         * @param {fin-hypergrid-cell-editor-base} cellEditor - see [fin-hypergrid-cell-editor-base](module-cell-editors_base.html)
         */
        registerCellEditor: function(alias, cellEditor) {
            this.cellEditors[alias] = cellEditor;
        },

        /**
         * @function
         * @instance
         * @description
        get the pixel coordinates of just the center 'main" data area
         *
         * #### returns: [fin-rectangle.rectangle](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        getDataBounds: function() {
            var colDNDHackWidth = 200; //this was a hack to help with column dnd, need to factor this into a shared variable
            //var behavior = this.getBehavior();
            var b = this.canvas.bounds;

            //var x = this.getRowNumbersWidth();
            // var y = behavior.getFixedRowsHeight() + 2;

            var result = rectangles.rectangle.create(0, 0, b.origin.x + b.extent.x - colDNDHackWidth, b.origin.y + b.extent.y);
            return result;
        },

        getRowNumbersWidth: function() {
            if (this.isShowRowNumbers()) {
                return this.getRenderer().getRowNumbersWidth();
            } else {
                return 0;
            }
        },

        /**
         * @function
         * @instance
         * @description
        return our [fin-canvas](http://stevewirts.github.io/fin-canvas/components/fin-canvas/) instance
         *
         * #### returns: [fin-canvas](http://stevewirts.github.io/fin-canvas/components/fin-canvas/)
         */
        getCanvas: function() {
            return this.canvas;
        },

        /**
         * @function
         * @instance
         * @description
        open a specific cell-editor at the provided model coordinates
         *
         * @param {string} cellEditor - the specific cell editor to use
         * @param {fin-rectangle.point} coordinates - what cell to edit at
         */
        editAt: function(cellEditor, coordinates) {

            this.cellEditor = cellEditor;

            var cell = coordinates.gridCell;

            var x = cell.x;
            var y = cell.y;

            if (x < 0 || y < 0) {
                return;
            }

            var editPoint = rectangles.point.create(x, y);
            this.setMouseDown(editPoint);
            this.setDragExtent(rectangles.point.create(0, 0));

            if (!cellEditor.isAdded) {
                cellEditor.isAdded = true;
                this.shadowRoot.appendChild(cellEditor);
            }
            cellEditor.grid = this;
            cellEditor.beginEditAt(editPoint);
        },

        /**
         * @function
         * @instance
         * @description
        Answer if a specific col is fully visible
         *
         * #### returns: boolean
         * @param {integer} columnIndex - the column index in question
         */
        isColumnVisible: function(columnIndex) {
            var isVisible = this.getRenderer().isColumnVisible(columnIndex);
            return isVisible;
        },

        /**
         * @function
         * @instance
         * @description
        Answer if a specific row is fully visible
         *
         * #### returns: boolean
         * @param {integer} rowIndex - the row index in question
         */
        isDataRowVisible: function(rowIndex) {
            var isVisible = this.getRenderer().isRowVisible(rowIndex);
            return isVisible;
        },

        /**
         * @function
         * @instance
         * @description
        Answer if a specific cell (col,row) fully is visible
         *
         * #### returns: boolean
         * @param {integer} columnIndex - the column index in question
         * @param {integer} rowIndex - the row index in question
         */
        isDataVisible: function(columnIndex, rowIndex) {
            var isVisible = this.isDataRowVisible(rowIndex) && this.isColumnVisible(columnIndex);
            return isVisible;
        },

        /**
         * @function
         * @instance
         * @description
        scroll in the offsetX direction if column index c is not visible
         *
         * @param {integer} colIndex - the column index in question
         * @param {integer} offsetX - the direction and magnitude to scroll if we need to
         */
        insureModelColIsVisible: function(colIndex, offsetX) {
            //-1 because we want only fully visible columns, don't include partially
            //visible columns
            var maxCols = this.getColumnCount() - 1;
            var indexToCheck = colIndex;

            if (offsetX > 0) {
                indexToCheck++;
            }

            if (!this.isColumnVisible(indexToCheck) || colIndex === maxCols) {
                //the scroll position is the leftmost column {
                this.scrollBy(offsetX, 0);
                return true;
            }
            return false;
        },

        /**
         * @function
         * @instance
         * @description
        scroll in the offsetY direction if column index c is not visible
         *
         * @param {integer} rowIndex - the column index in question
         * @param {integer} offsetX - the direction and magnitude to scroll if we need to
         */
        insureModelRowIsVisible: function(rowIndex, offsetY) {
            //-1 because we want only fully visible rows, don't include partially
            //viewable rows
            var maxRows = this.getRowCount() - 1;
            var indexToCheck = rowIndex;

            if (offsetY > 0) {
                indexToCheck++;
            }

            if (!this.isDataRowVisible(indexToCheck) || rowIndex === maxRows) {
                //the scroll position is the topmost row
                this.scrollBy(0, offsetY);
                return true;
            }
            return false;
        },

        /**
         * @function
         * @instance
         * @description
        scroll horizontal and vertically by the provided offsets
         *
         * @param {integer} offsetX - scroll in the x direction this much
         * @param {integer} offsetY - scroll in the y direction this much
         */
        scrollBy: function(offsetX, offsetY) {
            this.scrollHBy(offsetX);
            this.scrollVBy(offsetY);
        },

        /**
         * @function
         * @instance
         * @description
        scroll verticallly by the provided offset
         *
         * @param {integer} offsetY - scroll in the y direction this much
         */
        scrollVBy: function(offsetY) {
            var max = this.sbVScroller.range.max;
            var oldValue = this.getVScrollValue();
            var newValue = Math.min(max, Math.max(0, oldValue + offsetY));
            if (newValue === oldValue) {
                return;
            }
            this.setVScrollValue(newValue);
        },

        /**
         * @function
         * @instance
         * @description
        scroll horizontally by the provided offset
         *
         * @param {integer} offsetX - scroll in the x direction this much
         */
        scrollHBy: function(offsetX) {
            var max = this.sbHScroller.range.max;
            var oldValue = this.getHScrollValue();
            var newValue = Math.min(max, Math.max(0, oldValue + offsetX));
            if (newValue === oldValue) {
                return;
            }
            this.setHScrollValue(newValue);
        },

        /**
         * @function
         * @instance
         * @description
        Answer which data cell is under a pixel value mouse point
         * #### returns: [fin-rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         * @param {mousePoint} mouse - the mouse point to interogate
         */

        getGridCellFromMousePoint: function(mouse) {
            var cell = this.getRenderer().getGridCellFromMousePoint(mouse);
            return cell;
        },

        /**
         * @function
         * @description
        Answer pixel based bounds rectangle given a data cell point
        * #### returns: [fin-rectangle.rectangle](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         * @param {fin-rectangle.point} cell - the mouse point, see [fin-rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         * @instance

         */
        getBoundsOfCell: function(cell) {
            var b = this.getRenderer().getBoundsOfCell(cell);

            //we need to convert this to a proper rectangle
            var newBounds = rectangles.rectangle.create(b.x, b.y, b.width, b.height);
            return newBounds;
        },

        /**
         * @function
         * @instance
         * @description
        This is called by the fin-canvas when a resize occurs
         *
         */
        resized: function() {
            this.synchronizeScrollingBoundries();
        },

        /**
         * @function
         * @instance
         * @description
        A click event occured, determine the cell and delegate to the behavior (model)
         * @param {MouseEvent} event - the mouse event to interogate
         *
         */
        cellClicked: function(event) {
            var cell = event.gridCell;
            var colCount = this.getColumnCount();
            var rowCount = this.getRowCount();

            //click occured in background area
            if (cell.x > colCount || cell.y > rowCount) {
                return;
            }

            //var behavior = this.getBehavior();
            var hovered = this.getHoverCell();
            var sy = this.getVScrollValue();
            var x = hovered.x;
            // if (hovered.x > -1) {
            //     x = behavior.translateColumnIndex(hovered.x + this.getHScrollValue());
            // }
            if (hovered.y < 0) {
                sy = 0;
            }
            hovered = rectangles.point.create(x, hovered.y + sy);
            this.getBehavior().cellClicked(hovered, event);
        },

        setTotalsValueNotification: function(x, y, value) {
            this.fireSyntheticSetTotalsValue(x, y, value);
        },

        fireSyntheticSetTotalsValue: function(x, y, value) {
            var clickEvent = new CustomEvent('fin-set-totals-value', {
                detail: {
                    x: x,
                    y: y,
                    value: value
                }
            });
            this.canvas.dispatchEvent(clickEvent);
        },

        fireSyntheticEditorKeyUpEvent: function(inputControl, keyEvent) {
            var clickEvent = new CustomEvent('fin-editor-key-up', {
                detail: {
                    input: inputControl,
                    keyEvent: keyEvent
                },

            });
            this.canvas.dispatchEvent(clickEvent);
        },

        fireSyntheticEditorKeyDownEvent: function(inputControl, keyEvent) {
            var clickEvent = new CustomEvent('fin-editor-key-down', {
                detail: {
                    input: inputControl,
                    keyEvent: keyEvent
                },

            });
            this.canvas.dispatchEvent(clickEvent);
        },

        fireSyntheticEditorKeyPressEvent: function(inputControl, keyEvent) {
            var clickEvent = new CustomEvent('fin-editor-key-press', {
                detail: {
                    input: inputControl,
                    keyEvent: keyEvent
                },

            });
            this.canvas.dispatchEvent(clickEvent);
        },

        fireSyntheticEditorDataChangeEvent: function(inputControl, oldValue, newValue) {
            var clickEvent = new CustomEvent('fin-editor-data-change', {
                detail: {
                    input: inputControl,
                    oldValue: oldValue,
                    newValue: newValue
                },
                cancelable: true
            });
            return this.canvas.dispatchEvent(clickEvent);
        },

        /**
         * @function
         * @instance
         * @description
        Synthesize and fire a fin-keydown event
         * @param {keyEvent} event - the canvas event
         *
         */
        fireSyntheticRowSelectionChangedEvent: function() {
            var selectionEvent = new CustomEvent('fin-row-selection-changed', {
                detail: {
                    rows: this.getSelectedRows(),
                    columns: this.getSelectedColumns(),
                    selections: this.getSelectionModel().getSelections(),
                }
            });
            this.canvas.dispatchEvent(selectionEvent);
        },

        fireSyntheticColumnSelectionChangedEvent: function() {
            var selectionEvent = new CustomEvent('fin-column-selection-changed', {
                detail: {
                    rows: this.getSelectedRows(),
                    columns: this.getSelectedColumns(),
                    selections: this.getSelectionModel().getSelections()
                }
            });
            this.canvas.dispatchEvent(selectionEvent);
        },
        /**
         * @function
         * @instance
         * @description
        synthesize and dispatch a fin-selection-changed event
         *
         */
        selectionChanged: function() {
            var selectedRows = this.getSelectedRows();
            var selectionEvent = new CustomEvent('fin-selection-changed', {
                detail: {
                    rows: selectedRows,
                    columns: this.getSelectedColumns(),
                    selections: this.getSelectionModel().getSelections(),
                }
            });
            this.canvas.dispatchEvent(selectionEvent);
        },


        getRowSelection: function(selectedRows) {
            var selectedRows = this.getSelectedRows();
            var numCols = this.getColumnCount();
            var result = {};
            for (var c = 0; c < numCols; c++) {
                var column = new Array(selectedRows.length);
                result[this.getField(c)] = column;
                for (var r = 0; r < selectedRows.length; r++) {
                    var rowIndex = selectedRows[r];
                    column[r] = valueOrFunctionExecute(this.getValue(c, rowIndex));
                }
            }
            return result;
        },
        getRowSelectionMatrix: function(selectedRows) {
            var selectedRows = this.getSelectedRows();
            var numCols = this.getColumnCount();
            var result = new Array(numCols);
            for (var c = 0; c < numCols; c++) {
                result[c] = new Array(selectedRows.length);
                for (var r = 0; r < selectedRows.length; r++) {
                    var rowIndex = selectedRows[r];
                    result[c][r] = valueOrFunctionExecute(this.getValue(c, rowIndex));
                }
            }
            return result;
        },

        getColumnSelectionMatrix: function(selectedColumns) {
            var selectedColumns = this.getSelectedColumns();
            var numRows = this.getRowCount();
            var result = new Array(selectedColumns.length);
            for (var c = 0; c < selectedColumns.length; c++) {
                result[c] = new Array(numRows);
                var colIndex = selectedColumns[c];
                for (var r = 0; r < numRows; r++) {
                    result[c][r] = valueOrFunctionExecute(this.getValue(colIndex, r));
                }
            }
            return result;
        },

        getColumnSelection: function(selectedColumns) {
            var selectedColumns = this.getSelectedColumns();
            var result = {};
            var rowCount = this.getRowCount();
            for (var c = 0; c < selectedColumns.length; c++) {
                var column = new Array(rowCount);
                var columnIndex = selectedColumns[c];
                result[this.getField(columnIndex)] = column;
                for (var r = 0; r < rowCount; r++) {
                    column[r] = valueOrFunctionExecute(this.getValue(columnIndex, r));
                }
            }
            return result;
        },

        getSelection: function() {
            var selections = this.getSelections();
            var result = new Array(selections.length);
            for (var i = 0; i < selections.length; i++) {
                var rect = selections[i];
                result[i] = this._getSelection(rect);
            }
            return result;
        },

        _getSelection: function(rect) {
            rect = normalizeRect(rect);
            var colCount = rect.extent.x + 1;
            var rowCount = rect.extent.y + 1;
            var ox = rect.origin.x;
            var oy = rect.origin.y;
            var result = {};
            var r;
            for (var c = 0; c < colCount; c++) {
                var column = new Array(rowCount);
                result[this.getField(c + ox)] = column;
                for (r = 0; r < rowCount; r++) {
                    column[r] = valueOrFunctionExecute(this.getValue(ox + c, oy + r));
                }
            }
            return result;
        },

        getSelectionMatrix: function() {
            var selections = this.getSelections();
            var result = new Array(selections.length);
            for (var i = 0; i < selections.length; i++) {
                var rect = selections[i];
                result[i] = this._getSelectionMatrix(rect);
            }
            return result;
        },

        _getSelectionMatrix: function(rect) {
            rect = normalizeRect(rect);
            var colCount = rect.extent.x + 1;
            var rowCount = rect.extent.y + 1;
            var ox = rect.origin.x;
            var oy = rect.origin.y;
            var result = [];
            for (var c = 0; c < colCount; c++) {
                var column = new Array(rowCount);
                result[c] = column;
                for (var r = 0; r < rowCount; r++) {
                    column[r] = valueOrFunctionExecute(this.getValue(ox + c, oy + r));
                }
            }
            return result;
        },
        /**
         * @function
         * @instance
         * @description
        Synthesize and fire a fin-context-menu event
         * @param {keyEvent} event - the canvas event
         *
         */
        fireSyntheticContextMenuEvent: function(e) {
            e.gridCell = this.convertViewPointToDataPoint(e.gridCell);
            var event = new CustomEvent('fin-context-menu', {
                detail: {
                    gridCell: e.gridCell,
                    mousePoint: e.mousePoint,
                    viewPoint: e.viewPoint,
                    primitiveEvent: e.primitiveEvent,
                    rows: this.getSelectedRows(),
                    columns: this.getSelectedColumns(),
                    selections: this.getSelectionModel().getSelections()
                }
            });
            this.canvas.dispatchEvent(event);
        },

        fireSyntheticMouseUpEvent: function(e) {
            var event = new CustomEvent('fin-mouseup', {
                detail: {
                    gridCell: e.gridCell,
                    mousePoint: e.mousePoint,
                    viewPoint: e.viewPoint,
                    primitiveEvent: e.primitiveEvent,
                    rows: this.getSelectedRows(),
                    columns: this.getSelectedColumns(),
                    selections: this.getSelectionModel().getSelections()
                }
            });
            this.canvas.dispatchEvent(event);
        },

        fireSyntheticMouseDownEvent: function(e) {
            var event = new CustomEvent('fin-mousedown', {
                detail: {
                    gridCell: e.gridCell,
                    mousePoint: e.mousePoint,
                    viewPoint: e.viewPoint,
                    primitiveEvent: e.primitiveEvent,
                    rows: this.getSelectedRows(),
                    columns: this.getSelectedColumns(),
                    selections: this.getSelectionModel().getSelections()
                }
            });
            this.canvas.dispatchEvent(event);
        },

        isViewableButton: function(c, r) {
            return this.getRenderer().isViewableButton(c, r);
        },

        fireSyntheticButtonPressedEvent: function(gridCell) {
            if (!this.isViewableButton(gridCell.x, gridCell.y)) {
                return;
            }
            var event = new CustomEvent('fin-button-pressed', {
                detail: {
                    gridCell: gridCell
                }
            });
            this.canvas.dispatchEvent(event);
        },

        /**
         * @function
         * @instance
         * @description
        Synthesize and fire a fin-keydown event
         * @param {keyEvent} event - the canvas event
         *
         */
        fireSyntheticKeydownEvent: function(keyEvent) {
            var clickEvent = new CustomEvent('fin-keydown', {
                detail: keyEvent.detail
            });
            this.canvas.dispatchEvent(clickEvent);
        },

        /**
         * @function
         * @instance
         * @description
        Synthesize and fire a fin-keyup event
         * @param {keyEvent} event - the canvas event
         *
         */
        fireSyntheticKeyupEvent: function(keyEvent) {
            var clickEvent = new CustomEvent('fin-keyup', {
                detail: keyEvent.detail
            });
            this.canvas.dispatchEvent(clickEvent);
        },

        /**
         * @function
         * @instance
         * @description
        Synthesize and fire a fin-cell-enter event
         * @param {fin-rectangle.point} cell - the cell that the click occured in
         * @param {MouseEvent} event - the system mouse event
         *
         */
        fireSyntheticOnCellEnterEvent: function(cell) {
            var detail = {
                gridCell: cell,
                time: Date.now(),
                grid: this
            };
            var clickEvent = new CustomEvent('fin-cell-enter', {
                detail: detail
            });
            this.canvas.dispatchEvent(clickEvent);
        },

        fireSyntheticGroupsChangedEvent: function(groups) {
            var detail = {
                groups: groups,
                time: Date.now(),
                grid: this
            };
            var clickEvent = new CustomEvent('fin-groups-changed', {
                detail: detail
            });
            this.canvas.dispatchEvent(clickEvent);
        },

        /**
         * @function
         * @instance
         * @description
        Synthesize and fire a fin-cell-enter event
         * @param {fin-rectangle.point} cell - the cell that the click occured in
         * @param {MouseEvent} event - the system mouse event
         *
         */
        fireSyntheticOnCellExitEvent: function(cell) {
            var detail = {
                gridCell: cell,
                time: Date.now(),
                grid: this
            };
            var clickEvent = new CustomEvent('fin-cell-exit', {
                detail: detail
            });
            this.canvas.dispatchEvent(clickEvent);
        },

        /**
         * @function
         * @instance
         * @description
        Synthesize and fire a fin-cell-click event
         * @param {fin-rectangle.point} cell - the cell that the click occured in
         * @param {MouseEvent} event - the system mouse event
         *
         */
        fireSyntheticClickEvent: function(mouseEvent) {
            var cell = mouseEvent.gridCell;
            var detail = {
                gridCell: cell,
                mousePoint: mouseEvent.mousePoint,
                keys: mouseEvent.keys,
                primitiveEvent: mouseEvent,
                time: Date.now(),
                grid: this
            };
            this.getBehavior().enhanceDoubleClickEvent(detail);
            var clickEvent = new CustomEvent('fin-click', {
                detail: detail
            });
            this.canvas.dispatchEvent(clickEvent);
        },

        /**
         * @function
         * @instance
         * @description
        Synthesize and fire a fin-cell-click event
         * @param {fin-rectangle.point} cell - the cell that the click occured in
         * @param {MouseEvent} event - the system mouse event
         *
         */
        fireSyntheticDoubleClickEvent: function(mouseEvent) {
            var cell = mouseEvent.gridCell;
            var behavior = this.getBehavior();
            var detail = {
                gridCell: cell,
                mousePoint: mouseEvent.mousePoint,
                time: Date.now(),
                grid: this
            };
            behavior.enhanceDoubleClickEvent(mouseEvent);
            var clickEvent = new CustomEvent('fin-double-click', {
                detail: detail
            });
            behavior.cellDoubleClicked(cell, mouseEvent);
            this.canvas.dispatchEvent(clickEvent);
        },

        /**
         * @function
         * @instance
         * @description
        synthesize and fire a rendered event
         *
         */
        fireSyntheticGridRenderedEvent: function() {
            var event = new CustomEvent('fin-grid-rendered', {
                detail: {
                    source: this,
                    time: Date.now()
                }
            });
            this.canvas.dispatchEvent(event);
        },

        /**
         * @function
         * @instance
         * @description
        synthesize and fire a scroll event
         *
         * @param {string} type - fin-scroll-x or fin-scroll-y
         * @param {integer} oldValue - the old value
         * @param {integer} newValue - the new value
         */
        fireScrollEvent: function(type, oldValue, newValue) {
            var event = new CustomEvent(type, {
                detail: {
                    oldValue: oldValue,
                    value: newValue,
                    time: Date.now()
                }
            });
            this.canvas.dispatchEvent(event);

        },

        /**
         * @function
         * @instance
         * @description
        set the vertical scroll value
         *
         * @param {integer} newValue - the new value
         */
        setVScrollValue: function(y) {
            y = Math.round(y);
            var max = this.sbVScroller.range.max;
            y = Math.min(max, Math.max(0, y));
            var self = this;
            if (y === this.vScrollValue) {
                return;
            }
            this.getBehavior()._setScrollPositionY(y);
            var oldY = this.vScrollValue;
            this.vScrollValue = y;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                // self.sbVRangeAdapter.subjectChanged();
                self.fireScrollEvent('fin-scroll-y', oldY, y);
            });
        },

        /**
         * @function
         * @instance
         * @description
        return the vertical scroll value
         *
         * #### returns: integer
         */
        getVScrollValue: function() {
            return this.vScrollValue;
        },

        /**
         * @function
         * @instance
         * @description
        set the horizontal scroll value
         *
         * @param {integer} newValue - the new value
         */
        setHScrollValue: function(x) {
            x = Math.round(x);
            var max = this.sbHScroller.range.max;
            x = Math.min(max, Math.max(0, x));
            var self = this;
            if (x === this.hScrollValue) {
                return;
            }
            this.getBehavior()._setScrollPositionX(x);
            var oldX = this.hScrollValue;
            this.hScrollValue = x;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                //self.sbHRangeAdapter.subjectChanged();
                self.fireScrollEvent('fin-scroll-x', oldX, x);
            });
        },

        /**
         * @function
         * @instance
         * @description
        return the vertical scroll value
         *
         * #### returns: integer
         */
        getHScrollValue: function() {
            return this.hScrollValue;
        },

        /**
         * @function
         * @instance
         * @description
        request input focus
         *
         */
        takeFocus: function() {
            if (this.isEditing()) {
                this.stopEditing();
            } else {
                this.getCanvas().takeFocus();
            }
        },

        /**
         * @function
         * @instance
         * @description
        request focus for our cell editor
         *
         */
        editorTakeFocus: function() {
            if (this.cellEditor) {
                return this.cellEditor.takeFocus();
            }
        },

        /**
         * @function
         * @instance
         * @description
        answer if we have an active cell editor currently
         *
         * #### returns: boolean
         */
        isEditing: function() {
            if (this.cellEditor) {
                return this.cellEditor.isEditing;
            }
            return false;
        },

        /**
         * @function
         * @instance
         * @description
        initialize the scroll bars
         *
         */
        initScrollbars: function() {

            var self = this;

            var scrollbarHolder = this.shadowRoot.querySelector('#scrollbars');

            var horzBar = new FinBar({
                orientation: 'horizontal',
                barStyles: {
                    trailing: 11
                },
                onchange: function(idx) {
                    self.setHScrollValue(idx);
                },
                cssStylesheetReferenceElement: scrollbarHolder,
                container: this.canvas
            });

            var vertBar = new FinBar({
                orientation: 'vertical',
                barStyles: {
                    trailing: 11
                },
                onchange: function(idx) {
                    self.setVScrollValue(idx);
                },
                paging: {
                    up: function() {
                        return self.pageUp();
                    },
                    down: function() {
                        return self.pageDown();
                    },
                },
                container: this.canvas
            });

            this.sbHScroller = horzBar;
            this.sbVScroller = vertBar;

            this.sbHScroller.classPrefix = this.resolveProperty('hScrollbarClassPrefix');
            this.sbVScroller.classPrefix = this.resolveProperty('vScrollbarClassPrefix');

            scrollbarHolder.appendChild(horzBar.bar);
            scrollbarHolder.appendChild(vertBar.bar);

            horzBar.resize();
            vertBar.resize();

        },

        /**
         * @function
         * @instance
         * @description
        scroll values have changed, we've been notified *
         */
        setVScrollbarValues: function(max) {
            this.sbVScroller.range = {
                min: 0,
                max: max
            };
        },

        setHScrollbarValues: function(max) {
            this.sbHScroller.range = {
                min: 0,
                max: max
            };
        },

        scrollValueChangedNotification: function() {

            if (this.hScrollValue === this.sbPrevHScrollValue && this.vScrollValue === this.sbPrevVScrollValue) {
                return;
            }

            this.sbHValueHolder.changed = !this.sbHValueHolder.changed;
            this.sbVValueHolder.changed = !this.sbVValueHolder.changed;

            this.sbPrevHScrollValue = this.hScrollValue;
            this.sbPrevVScrollValue = this.vScrollValue;

            if (this.cellEditor) {
                this.cellEditor.scrollValueChangedNotification();
            }

            this.computeCellsBounds();
        },

        /**
         * @function
         * @instance
         * @description
        get a data value from the behavior (model) at a specific point
         *
         * @param {integer} x
         * @param {integer} y
         * returns: anything
         */
        getValue: function(x, y) {
            return this.getBehavior().getValue(x, y);
        },

        /**
         * @function
         * @instance
         * @description
        set a data value into the behavior (model) at a specific point
         *
         * @param {integer} x
         * @param {integer} y
         * @param {anything} value
         */
        setValue: function(x, y, value) {
            this.getBehavior().setValue(x, y, value);
        },

        getColumnAlignment: function(c) {
            return this.getBehavior().getColumnAlignment(c);
        },

        /**
         * @function
         * @instance
         * @description
        the data dimensions have changed, or our pixel boundries have changed,
         * adjust scrollbar properties as necessary
         *
         */
        synchronizeScrollingBoundries: function() {
            //327/664
            var behavior = this.getBehavior();

            var numFixedColumns = this.getFixedColumnCount();
            var numFixedRows = this.getFixedRowCount();

            var numColumns = this.getColumnCount();
            var numRows = this.getRowCount();

            var bounds = this.getBounds();
            if (!bounds) {
                return;
            }
            var scrollableHeight = bounds.height() - behavior.getFixedRowsMaxHeight() - 15; //5px padding at bottom and right side
            var scrollableWidth = (bounds.width() - 200) - behavior.getFixedColumnsMaxWidth() - 15;

            var lastPageColumnCount = 0;
            var columnsWidth = 0;
            for (; lastPageColumnCount < numColumns; lastPageColumnCount++) {
                var eachWidth = this.getColumnWidth(numColumns - lastPageColumnCount - 1);
                columnsWidth = columnsWidth + eachWidth;
                if (columnsWidth > scrollableWidth) {
                    break;
                }
            }

            var lastPageRowCount = 0;
            var rowsHeight = 0;
            for (; lastPageRowCount < numRows; lastPageRowCount++) {
                var eachHeight = this.getRowHeight(numRows - lastPageRowCount - 1);
                rowsHeight = rowsHeight + eachHeight;
                if (rowsHeight > scrollableHeight) {
                    break;
                }
            }

            var hMax = Math.max(0, numColumns - numFixedColumns - lastPageColumnCount);
            this.setHScrollbarValues(hMax);

            var vMax = Math.max(0, numRows - numFixedRows - lastPageRowCount);
            this.setVScrollbarValues(vMax);

            this.setHScrollValue(Math.min(this.getHScrollValue(), hMax));
            this.setVScrollValue(Math.min(this.getVScrollValue(), vMax));

            this.computeCellsBounds();
            this.repaint();

            this.sbHScroller.resize();
            this.sbVScroller.resize();

        },

        /**
         * @function
         * @instance
         * @description
        Answers the number of viewable rows, including any partially viewable rows.
         *
         * #### returns: integer
         */
        getVisibleRows: function() {
            return this.getRenderer().getVisibleRows();
        },

        /**
         * @function
         * @instance
         * @description
        Answers the number of viewable columns, including any partially viewable columns.
         *
         * #### returns: integer
         */
        getVisibleColumns: function() {
            return this.getRenderer().getVisibleColumns();
        },

        /**
         * @function
         * @instance
         * @description
        Initialize the [fin-hypergrid-renderer](module-._renderer.html) sub-component.
         *
         * @method initRenderer()
         */
        initRenderer: function() {

            this.renderer = this.shadowRoot.querySelector('fin-hypergrid-renderer');
            this.renderer.setGrid(this);

        },

        /**
         * @function
         * @instance
         * @description
        return our [fin-hypergrid-renderer](module-._renderer.html) sub-component.
         *
         * #### returns: [fin-hypergrid-renderer](module-._renderer.html) sub-component.
         */
        getRenderer: function() {
            return this.renderer;
        },

        /**
         * @function
         * @instance
         * @description
        return the width of a specific column
         *
         * #### returns: integer
         * @param {integer} columnIndex - the untranslated column index
         */
        getColumnWidth: function(columnIndex) {
            return this.getBehavior().getColumnWidth(columnIndex);
        },

        /**
         * @function
         * @instance
         * @description
        set the column width at a specific column index
         *
         * @param {integer} columnIndex - the untranslated column index
         * @param {integer} columnWidth - the width in pixels
         */
        setColumnWidth: function(columnIndex, columnWidth) {
            this.getBehavior().setColumnWidth(columnIndex, columnWidth);
        },

        getColumnEdge: function(c) {
            return this.getBehavior().getColumnEdge(c, this.getRenderer());
        },

        /**
         * @function
         * @instance
         * @description
        return the total width of all the fixed columns
         *
         * #### returns: integer
         */
        getFixedColumnsWidth: function() {
            return this.getBehavior().getFixedColumnsWidth();
        },

        /**
         * @function
         * @instance
         * @description
       return the height of a specific row
         *
         * #### returns: integer
         * @param {integer} rowIndex - the untranslated fixed column index
         */
        getRowHeight: function(rowIndex) {
            return this.getBehavior().getRowHeight(rowIndex);
        },

        /**
         * @function
         * @instance
         * @description
        set the row height at a specific row index
         *
         * @param {integer} rowIndex - the row index
         * @param {integer} rowHeight - the width in pixels
         */
        setRowHeight: function(rowIndex, rowHeight) {
            this.getBehavior().setRowHeight(rowIndex, rowHeight);
        },

        /**
         * @function
         * @instance
         * @description
        return the total fixed rows height
         *
         */
        getFixedRowsHeight: function() {
            return this.getBehavior().getFixedRowsHeight();
        },

        /**
         * @function
         * @instance
         * @description
        return the number of columns
         *
         * #### returns: integer
         */
        getColumnCount: function() {
            return this.getBehavior().getColumnCount();
        },

        /**
         * @function
         * @instance
         * @description
        return the number of rows
         *
         * #### returns: integer
         */
        getRowCount: function() {
            return this.getBehavior().getRowCount();
        },

        /**
         * @function
         * @instance
         * @description
        return the number of fixed columns
         *
         * #### returns: integer
         */
        getFixedColumnCount: function() {
            return this.getBehavior().getFixedColumnCount();
        },

        /**
         * @function
         * @instance
         * @description
        return the number of fixed rows
         *
         * #### returns: integer
         */
        getFixedRowCount: function() {
            return this.getBehavior().getFixedRowCount();
        },

        /**
         * @function
         * @instance
         * @description
        the top left area has been clicked on; delegate to the behavior
         *
         * @param {mouse} mouse - the event details
         */
        topLeftClicked: function(mouse) {
            this.getBehavior().topLeftClicked(this, mouse);
        },

        /**
         * @function
         * @instance
         * @description
        a fixed row has been clicked; delegate to the behavior
         *
         * @param {mouse} mouse - the event details
         */
        rowHeaderClicked: function(mouse) {
            this.getBehavior().rowHeaderClicked(this, mouse);
        },

        /**
         * @function
         * @instance
         * @description
        a fixed column cell has been clicked; delegate to the behavior
         *
         * @param {mouse} mouse - the event details
         */
        columnHeaderClicked: function(mouse) {
            this.getBehavior().columnHeaderClicked(this, mouse);
        },

        /**
         * @function
         * @instance
         * @description
         an edit event has occured; activate the editor
         *
         * @param {event} event - the event details
         */
        _activateEditor: function(event) {
            var gridCell = event.gridCell;
            this.activateEditor(gridCell.x, gridCell.y);
        },

        /**
         * @function
         * @instance
         * @description
         activate the editor at x, y
         *
         * @param {x} x - the x coordinate
         * @param {y} y - the y coordinate
         */
        activateEditor: function(x, y) {
            if (!this.isEditable() && !this.isFilterRow(y)) {
                return;
            }
            var editor = this.getCellEditorAt(x, y);
            if (!editor) {
                return;
            }
            var point = editor.editorPoint;
            if (editor) {
                if (point.x === x && point.y === y && editor.isEditing) {
                    return; //we're already open at this location
                } else if (this.isEditing()) {
                    this.stopEditing(); //other editor is open, close it first
                }
                event.gridCell = {
                    x: x,
                    y: y
                };
                this.editAt(editor, event);
            }
        },

        /**
         * @function
         * @instance
         * @description
        return the cell editor at a specific point; delegate to the behavior
         *
         * @param {x} x - the x coordinate
         * @param {y} y - the y coordinate
         */
        getCellEditorAt: function(x, y) {
            return this.getBehavior().getCellEditorAt(x, y);
        },

        /**
         * @function
         * @instance
         * @description
        toggle HiDPI support; HiDPI support is now on by default.  There used to be a bug in chrome that caused severe slow down on bit blit of large images, so this HiDPI needed to be optional.
         *
         */
        toggleHiDPI: function() {
            if (this.canvas.isHiDPI()) {
                this.removeAttribute('hidpi');
            } else {
                this.setAttribute('hidpi', null);
            }
            this.canvas.resize();
        },

        /**
         * @function
         * @instance
         * @description
        get the HiDPI ratio
         *
         * #### returns: float
         */
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

        /**
         * @function
         * @instance
         * @description
        return the recently rendered width of column at colIndex
         *
         * #### returns: integer
         *
         * @param {integer} colIndex - the column index
         */
        getRenderedWidth: function(colIndex) {
            return this.renderer.getRenderedWidth(colIndex);
        },

        /**
         * @function
         * @instance
         * @description
        return the recently rendered height of a row at rowIndex
         *
         * #### returns: integer
         *
         * @param {integer} rowIndex - the row index
         */
        getRenderedHeight: function(rowIndex) {
            return this.renderer.getRenderedHeight(rowIndex);
        },

        /**
         * @function
         * @instance
         * @description
        return the cell editor at alias "name"
         *
         * #### returns: [fin-hypergrid-cell-editor](module-cell-editors_base.html) sub-component.
         * @param
         */
        resolveCellEditor: function(name) {
            return this.cellEditors[name];
        },

        /**
         * @function
         * @instance
         * @description
        update the cursor under the hover cell
         *
         */
        updateCursor: function() {
            var translate = this.getBehavior();
            var cursor = translate.getCursorAt(-1, -1);
            var hoverCell = this.getHoverCell();
            if (hoverCell && hoverCell.x > -1 && hoverCell.y > -1) {
                var x = hoverCell.x + this.getHScrollValue();
                cursor = translate.getCursorAt(x, hoverCell.y + this.getVScrollValue());
            }
            this.beCursor(cursor);
        },

        /**
         * @function
         * @instance
         * @description
        repaint only a specific cell at coordinate x, y
         *
         * @param {x} x - the x coordinate
         * @param {y} y - the y coordinate
         */
        repaintCell: function(x, y) {
            this.getRenderer().repaintCell(x, y);
        },

        /**
         * @function
         * @instance
         * @description
        return true if the user is currently dragging a column to reorder it
         *
         * #### returns: boolean
         */
        isDraggingColumn: function() {
            if (this.renderOverridesCache.dragger) {
                return true;
            } else {
                return false;
            }
        },

        /**
         * @function
         * @instance
         * @description
        scroll up one full page
         *
         */
        pageUp: function() {
            var rowNum = this.getRenderer().getPageUpRow();
            this.setVScrollValue(rowNum);
            return rowNum;
        },

        /**
         * @function
         * @instance
         * @description
        scroll down one full page
         *
         * #### returns: [fin-hypergrid-renderer](module-._renderer.html) sub-component.
         */
        pageDown: function() {
            var rowNum = this.getRenderer().getPageDownRow();
            this.setVScrollValue(rowNum);
            return rowNum;
        },

        /**
         * @function
         * @instance
         * @description
        nyi
         *
         */
        pageLeft: function() {
            console.log('page left');
        },

        /**
         * @function
         * @instance
         * @description
        nyi
         *
         */
        pageRight: function() {
            console.log('page right');
        },

        /**
         * @function
         * @instance
         * @description
        return a array of objects with the values that were just rendered
         *
         * #### returns: Array.
         */
        getRenderedData: function() {
            // assumes one row of headers
            var behavior = this.getBehavior();
            var renderer = this.getRenderer();
            var colCount = this.getColumnCount();
            var rowCount = renderer.getVisibleRows();
            var headers = [];
            var result = [];
            var r, c;
            for (c = 0; c < colCount; c++) {
                headers[c] = behavior.getColumnId(c, 0);
            }
            for (r = 0; r < rowCount; r++) {
                var row = {};
                row.hierarchy = behavior.getFixedColumnValue(0, r);
                for (c = 0; c < colCount; c++) {
                    var field = headers[c];
                    row[field] = behavior.getValue(c, r);
                }
                result[r] = row;
            }
            return result;
        },

        /**
         * @function
         * @instance
         * @description
        return an object that represets the currently selection row
         *
         * #### returns: Object
         */
        getSelectedRow: function() {
            var sels = this.getSelectionModel().getSelections();
            if (sels.length < 1) {
                return;
            }
            var behavior = this.getBehavior();
            var colCount = this.getColumnCount();
            var headers = [];
            var topRow = sels[0].origin.y;
            var c;
            for (c = 0; c < colCount; c++) {
                headers[c] = behavior.getColumnId(c, 0);
            }
            var row = {};
            row.hierarchy = behavior.getFixedColumnValue(0, topRow);
            for (c = 0; c < colCount; c++) {
                var field = headers[c];
                row[field] = behavior.getValue(c, topRow);
            }
            return row;
        },

        fireRequestCellEdit: function(cell, value) {
            var clickEvent = new CustomEvent('fin-request-cell-edit', {
                cancelable: true,
                detail: {
                    value: value,
                    gridCell: cell,
                    time: Date.now()
                }
            });
            var proceed = this.canvas.dispatchEvent(clickEvent);
            return proceed; //I wasn't cancelled
        },
        /**
         * @function
         * @instance
         * @description
        synthesize and fire a fin-before-cell-edit event
         *
         * @param {rectangle.point} cell - the x,y coordinates
         * @param {Object} value - the current value
         */
        fireBeforeCellEdit: function(cell, oldValue, newValue, control) {
            var clickEvent = new CustomEvent('fin-before-cell-edit', {
                cancelable: true,
                detail: {
                    oldValue: oldValue,
                    newValue: newValue,
                    gridCell: cell,
                    time: Date.now(),
                    input: control
                }
            });
            var proceed = this.canvas.dispatchEvent(clickEvent);
            return proceed; //I wasn't cancelled
        },

        /**
         * @function
         * @instance
         * @description
        return our [fin-hypergrid-renderer](module-._renderer.html) sub-component.
         *
         * @param {rectangle.point} cell - the x,y coordinates
         * @param {Object} oldValue - the old value
         * @param {Object} newValue - the new value
         */
        fireAfterCellEdit: function(cell, oldValue, newValue, control) {
            var clickEvent = new CustomEvent('fin-after-cell-edit', {
                detail: {
                    newValue: newValue,
                    oldValue: oldValue,
                    gridCell: cell,
                    time: Date.now(),
                    input: control
                }
            });
            this.canvas.dispatchEvent(clickEvent);
        },

        /**
         * @function
         * @instance
         * @description
        autosize the column at colIndex for best fit
         *
         * @param {integer} colIndex - the column index to modify at
         *
         */
        autosizeColumn: function(colIndex) {
            var column = this.getBehavior().getColumn(colIndex);
            column.checkColumnAutosizing(true);
        },

        /**
         * @function
         * @instance
         * @description
        enable/disable if this component can be focusable
         *
         * @param {boolean} boolean - true/false
         */
        setFocusable: function(boolean) {
            this.getCanvas().setFocusable(boolean);
        },

        /**
         * @function
         * @instance
         * @description
        return the number of columns that were just rendered
         *
         * #### returns: integer
         */
        getVisibleColumnsCount: function() {
            return this.getRenderer().getVisibleColumnsCount();
        },

        /**
         * @function
         * @instance
         * @description
        return the number of rows that were just rendered
         *
         * #### returns: integer
         */
        getVisibleRowsCount: function() {
            return this.getRenderer().getVisibleRowsCount();
        },

        /**
         * @function
         * @instance
         * @description
        update the size of the grid
         *
         * #### returns: integer
         */
        updateSize: function() {
            this.canvas.checksize();
        },


        /**
         * @function
         * @instance
         * @description
        stop the global repainting flag thread
         *
         */
        stopPaintThread: function() {
            this.canvas.stopPaintThread();
        },

        /**
         * @function
         * @instance
         * @description
        stop the global resize check flag thread
         *
         */
        stopResizeThread: function() {
            this.canvas.stopResizeThread();
        },

        /**
         * @function
         * @instance
         * @description
        restart the global resize check flag thread
         *
         */
        restartResizeThread: function() {
            this.canvas.restartResizeThread();
        },

        /**
         * @function
         * @instance
         * @description
        restart the global repainting check flag thread
         *
         */
        restartPaintThread: function() {
            this.canvas.restartPaintThread();
        },

        swapColumns: function(source, target) {
            this.getBehavior().swapColumns(source, target);
        },

        endDragColumnNotification: function() {
            this.getBehavior().endDragColumnNotification();
        },

        getFixedColumnsMaxWidth: function() {
            return this.getBehavior().getFixedColumnsMaxWidth();
        },

        isMouseDownInHeaderArea: function() {
            var numHeaderColumns = this.getHeaderColumnCount();
            var numHeaderRows = this.getHeaderRowCount();
            var mouseDown = this.getMouseDown();
            return mouseDown.x < numHeaderColumns || mouseDown.y < numHeaderRows;
        },

        _getBoundsOfCell: function(x, y) {
            var bounds = this.getRenderer()._getBoundsOfCell(x, y);
            return bounds;
        },

        getColumnProperties: function(columnIndex) {
            var properties = this.getBehavior().getColumnProperties(columnIndex);
            return properties;
        },

        setColumnProperties: function(columnIndex, properties) {
            this.getBehavior().setColumnProperties(columnIndex, properties);
        },

        moveSingleSelect: function(x, y) {
            this.getBehavior().moveSingleSelect(this, x, y);
        },

        selectCell: function(x, y) {
            this.getSelectionModel().clear();
            this.getSelectionModel().select(x, y, 0, 0);
        },

        getHeaderColumnCount: function() {
            return this.getBehavior().getHeaderColumnCount();
        },

        toggleSort: function(x, keys) {
            this.stopEditing();
            var behavior = this.getBehavior();
            behavior.toggleSort(x, keys);
            if (this.isColumnAutosizing()) {
                behavior.autosizeAllColumns();
            }
        },

        toggleSelectColumn: function(x, keys) {
            keys = keys || [];
            var model = this.getSelectionModel();
            var alreadySelected = model.isColumnSelected(x);
            var hasCTRL = keys.indexOf('CTRL') > -1;
            var hasSHIFT = keys.indexOf('SHIFT') > -1;
            if (!hasCTRL && !hasSHIFT) {
                model.clear();
                if (!alreadySelected) {
                    model.selectColumn(x);
                }
            } else {
                if (hasCTRL) {
                    if (alreadySelected) {
                        model.deselectColumn(x);
                    } else {
                        model.selectColumn(x);
                    }
                }
                if (hasSHIFT) {
                    model.clear();
                    model.selectColumn(this.lastEdgeSelection[0], x);
                }
            }
            if (!alreadySelected && !hasSHIFT) {
                this.lastEdgeSelection[0] = x;
            }
            this.repaint();
            this.fireSyntheticColumnSelectionChangedEvent();
        },

        toggleSelectRow: function(y, keys) {

            //we can select the totals rows if they exist,
            //but not rows above that
            var selectionEdge = this.getFilterRowIndex() + 1;
            if (y < selectionEdge) {
                return;
            }

            keys = keys || [];
            var model = this.getSelectionModel();
            var alreadySelected = model.isRowSelected(y);
            var hasCTRL = keys.indexOf('CTRL') > -1;
            var hasSHIFT = keys.indexOf('SHIFT') > -1;

            if (!hasCTRL && !hasSHIFT) {
                model.clear();
                if (!alreadySelected) {
                    model.selectRow(y);
                }
            } else {
                if (hasCTRL) {
                    if (alreadySelected) {
                        model.deselectRow(y);
                    } else {
                        model.selectRow(y);
                    }
                }
                if (hasSHIFT) {
                    model.clear();
                    model.selectRow(this.lastEdgeSelection[1], y);
                }
            }
            if (!alreadySelected && !hasSHIFT) {
                this.lastEdgeSelection[1] = y;
            }
            this.repaint();
        },


        isShowRowNumbers: function() {
            return this.resolveProperty('showRowNumbers');
        },
        isEditable: function() {
            return this.resolveProperty('editable') === true;
        },
        isShowFilterRow: function() {
            return this.resolveProperty('showFilterRow');
        },
        isShowHeaderRow: function() {
            return this.resolveProperty('showHeaderRow');
        },
        getHeaderRowCount: function() {
            return this.getBehavior().getHeaderRowCount();
        },
        isFilterRow: function(y) {
            return y === this.getFilterRowIndex();
        },
        getFilterRowIndex: function() {
            if (!this.isShowFilterRow()) {
                return -1;
            }
            if (this.isShowHeaderRow()) {
                return 1;
            } else {
                return 0;
            }
        },
        setGroups: function(arrayOfColumnIndexes) {
            this.getBehavior().setGroups(arrayOfColumnIndexes);
        },
        filterClicked: function(event) {
            this.activateEditor(event.gridCell.x, event.gridCell.y);
        },
        hasHierarchyColumn: function() {
            return this.getBehavior().hasHierarchyColumn();
        },
        isHierarchyColumn: function(x) {
            if (!this.hasHierarchyColumn()) {
                return false;
            }
            return x === 0;
        },
        checkScrollbarVisibility: function() {
            // var hoverClassOver = this.resolveProperty('scrollbarHoverOver');
            // var hoverClassOff = this.resolveProperty('scrollbarHoverOff');

            // if (hoverClassOff === 'visible') {
            //     this.sbHScroller.classList.remove(hoverClassOver);
            //     this.sbVScroller.classList.remove(hoverClassOff);
            //     this.sbHScroller.classList.add('visible');
            //     this.sbVScroller.classList.add('visible');
            // }
        },
        isColumnOrRowSelected: function() {
            return this.getSelectionModel().isColumnOrRowSelected();
        },
        selectColumn: function(x1, x2) {
            this.getSelectionModel().selectColumn(x1, x2);
        },
        selectRow: function(y1, y2) {
            y2 = y2 || y1;
            var min = Math.min(y1, y2);
            var max = Math.max(y1, y2);
            var selectionEdge = this.getFilterRowIndex() + 1;
            if (min < selectionEdge) {
                return;
            }
            this.getSelectionModel().selectRow(min, max);
        },
        isRowSelected: function(r) {
            return this.getSelectionModel().isRowSelected(r);
        },
        isColumnSelected: function(c) {
            return this.getSelectionModel().isColumnSelected(c);
        },
        lookupFeature: function(key) {
            return this.getBehavior().lookupFeature(key);
        },
        getRow: function(y) {
            return this.getBehavior().getRow(y);
        },
        getFieldName: function(index) {
            return this.getBehavior().getFieldName(index);
        },

        getColumnIndex: function(fieldName) {
            return this.getBehavior().getColumnIndex(fieldName);
        },
        isCellSelection: function() {
            return this.resolveProperty('cellSelection') === true;
        },
        isRowSelection: function() {
            return this.resolveProperty('rowSelection') === true;
        },
        isColumnSelection: function() {
            return this.resolveProperty('columnSelection') === true;
        },
        getComputedRow: function(y) {
            return this.getBehavior().getComputedRow(y);
        },
        isColumnAutosizing: function() {
            return this.resolveProperty('columnAutosizing') === true;
        },
        setGlobalFilter: function(string) {
            this.getBehavior().setGlobalFilter(string);
        },
        selectRowsFromCells: function() {
            this.getSelectionModel().selectRowsFromCells();
        },
        selectColumnsFromCells: function() {
            this.getSelectionModel().selectColumnsFromCells();
        },
        getSelectedRows: function() {
            return this.getBehavior().getSelectedRows();
        },
        getSelectedColumns: function() {
            return this.getBehavior().getSelectedColumns();
        },
        getSelections: function() {
            return this.getBehavior().getSelections();
        },
        getLastSelectionType: function() {
            return this.getSelectionModel().getLastSelectionType();
        },
        isCellSelected: function(x, y) {
            return this.getSelectionModel().isCellSelected(x, y);
        },
        isInCurrentSelectionRectangle: function(x, y) {
            return this.getSelectionModel().isInCurrentSelectionRectangle(x, y);
        },
        selectAllRows: function() {
            this.getSelectionModel().selectAllRows();
        },
        areAllRowsSelected: function() {
            return this.getSelectionModel().areAllRowsSelected();
        },
        toggleSelectAllRows: function() {
            if (this.areAllRowsSelected()) {
                this.getSelectionModel().clear();
            } else {
                this.selectAllRows();
            }
            this.repaint();
        },
        getField: function(x) {
            return this.getBehavior().getField(x);
        }
    });

})(); /* jslint ignore:line */
