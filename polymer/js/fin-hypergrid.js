/* global alert */
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

            topLeftFont: '12px Tahoma, Geneva, sans-serif',
            topLeftColor: 'rgb(25, 25, 25)',
            topLeftBackgroundColor: 'rgb(223, 227, 232)',
            topLeftFGSelColor: 'rgb(25, 25, 25)',
            topLeftBGSelColor: 'rgb(255, 220, 97)',

            fixedColumnFont: '12px Tahoma, Geneva, sans-serif',
            fixedColumnColor: 'rgb(25, 25, 25)',
            fixedColumnBackgroundColor: 'rgb(223, 227, 232)',
            fixedColumnFGSelColor: 'rgb(25, 25, 25)',
            fixedColumnBGSelColor: 'rgb(255, 220, 97)',

            fixedRowFont: '12px Tahoma, Geneva, sans-serif',
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
            gridLinesH: true,
            gridLinesV: true,

            defaultRowHeight: 20,
            defaultFixedRowHeight: 20,
            defaultColumnWidth: 100,
            defaultFixedColumnWidth: 100,

            //for immediate painting, set these values to 0, true respectively
            repaintIntervalRate: 4,
            repaintImmediately: false,

            //enable or disable double buffering
            useBitBlit: false,

            useHiDPI: true,
            editorActivationKeys: ['alt', 'esc'],
            columnAutosizing: true,
            readOnly: false

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
        if (polymerTheme.fixedRowBGSelColor === 'rgba(0, 0, 0, 0)' ||
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

            //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
            document.body.addEventListener('copy', function(evt) {
                self.checkClipboardCopy(evt);
            });
            this.resized();
            this.fire('load');
            this.isScrollButtonClick = false;

            setInterval(function() {
                self.checkRepaint();
            }, 16);

        },

        initializeCellEditor: function(cellEditorName) {
            initializeCellEditor(cellEditorName);
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
            var fixedX = this.getFixedColumnCount();
            var fixedY = this.getFixedRowCount();
            var newPoint = rectangles.point.create(point.x - fixedX, point.y - fixedY);
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
        addProperties: function(properties) {
            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    this.lnfProperties[key] = properties[key];
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
        },

        /**
         * @function
         * @description
         answer the state object for remembering our state, see the [memento pattern](http://en.wikipedia.org/wiki/Memento_pattern)
         * #### returns: object
         * @instance
         */
        getState: function() {
            var state = this.getBehavior().getState();
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
            this.getBehavior().setState(state);
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

            this.repaintFlag = false;
        },

        /**
         * @function
         * @instance
         * @description
         the grid has just been rendered, make sure the column widths are optimal
         *
         */
        checkColumnAutosizing: function() {
            if (this.resolveProperty('columnAutosizing') === false) {
                return;
            }
            var renderer = this.getRenderer();
            var fixedColSizes = renderer.renderedFixedColumnMinWidths;
            var colSizes = renderer.renderedColumnMinWidths;
            this.getBehavior().checkColumnAutosizing(fixedColSizes, colSizes);
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
            behavior.setRenderedColumnCount(this.getViewableColumns() + 1);
            behavior.setRenderedRowCount(this.getViewableRows() + 1);
        },

        /**
         * @function
         * @instance
         * @description
         Empty out the textWidthCache
         *
         * @param {event} event - the copy system event
         */
        resetTextWidthCache: function() {
            this.getRenderer().resetTextWidthCache();
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
                    var data = behavior._getValue(x, y);
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
        isFixedRowCellSelected: function(col) {
            var selectionModel = this.getSelectionModel();
            var isSelected = selectionModel.isFixedRowCellSelected(col);
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
        isFixedColumnCellSelected: function(row) {
            var selectionModel = this.getSelectionModel();
            var isSelected = selectionModel.isFixedColumnCellSelected(row);
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
        },

        /**
         * @function
         * @instance
         * @description
         I've been notified that the behavior has changed
         *
         */
        behaviorChanged: function() {
            if (this.numColumns !== this.behavior._getColumnCount() || this.numRows !== this.behavior.getRowCount()) {
                this.numColumns = this.behavior._getColumnCount();
                this.numRows = this.behavior.getRowCount();
                this.behaviorShapeChanged();
            }
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
            return this.lnfProperties[key];
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

        checkRepaint: function() {
            if (this.repaintFlag) {
                var now = this.resolveProperty('repaintImmediately');
                var canvas = this.getCanvas();
                if (canvas) {
                    if (now === true) {
                        canvas.paintNow();
                    } else {
                        canvas.repaint();
                    }
                }
            }
        },
        /**
         * @function
         * @instance
         * @description
         tickle the repaint flag on the canvas, if ```repaintImmediately``` is true, paint immediately
         *
         */
        repaint: function() {
            this.repaintFlag = true;
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
                self.stopEditing();
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseDown(mouseEvent);
            });

            //
            // this.addFinEventListener('fin-canvas-click', function(e) {
            //     if (self.resolveProperty('readOnly')) {
            //         return;
            //     }
            //     self.stopEditing();
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
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateMouseUp(mouseEvent);
            });

            this.addFinEventListener('fin-canvas-tap', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
                self.stopEditing();
                var mouse = e.detail.mouse;
                var tapEvent = self.getGridCellFromMousePoint(mouse);
                tapEvent.primitiveEvent = e;
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

            this.addFinEventListener('fin-canvas-holdpulse', function(e) {
                if (self.resolveProperty('readOnly')) {
                    return;
                }
                var mouse = e.detail.mouse;
                var mouseEvent = self.getGridCellFromMousePoint(mouse);
                mouseEvent.primitiveEvent = e;
                self.delegateHoldPulse(mouseEvent);
            });

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

            this.canvas.removeAttribute('tabindex');

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
            var behavior = this.getBehavior();
            var b = this.canvas.bounds;

            var x = behavior.getFixedColumnsWidth() + 2;
            var y = behavior.getFixedRowsHeight() + 2;

            var result = rectangles.rectangle.create(x, y, b.origin.x + b.extent.x - x - colDNDHackWidth, b.origin.y + b.extent.y - y);
            return result;
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
        insureModelColIsViewable: function(colIndex, offsetX) {
            //-1 because we want only fully visible columns, don't include partially
            //viewable columns
            var viewableColumns = this.getViewableColumns() - 1;
            if (!this.isColumnVisible(colIndex)) {
                //the scroll position is the leftmost column
                var newSX = offsetX < 0 ? colIndex : colIndex - viewableColumns;
                this.setHScrollValue(newSX);
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
        insureModelRowIsViewable: function(rowIndex, offsetY) {
            //-1 because we want only fully visible rows, don't include partially
            //viewable rows
            var viewableRows = this.getViewableRows() - 1;
            if (!this.isDataRowVisible(rowIndex)) {
                //the scroll position is the topmost row
                var newSY = offsetY < 0 ? rowIndex : rowIndex - viewableRows;
                this.setVScrollValue(newSY);
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
            var max = this.sbVScrollConfig.rangeStop;
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
            var max = this.sbHScrollConfig.rangeStop;
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
            var bounds = this.getRenderer().getBoundsOfCell(cell);
            return bounds;
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

            var behavior = this.getBehavior();
            var hovered = this.getHoverCell();
            var sy = this.getVScrollValue();
            var x = hovered.x;
            if (hovered.x > -1) {
                x = behavior.translateColumnIndex(hovered.x + this.getHScrollValue());
            }
            if (hovered.y < 0) {
                sy = 0;
            }
            hovered = rectangles.point.create(x, hovered.y + sy);
            this.getBehavior().cellClicked(hovered, event);
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
        fireSyntheticOnCellEnterEvent: function(mouseEvent) {
            var detail = {
                gridCell: this.rectangles.point.create(mouseEvent.x + this.getHScrollValue(), mouseEvent.y + this.getVScrollValue()),
                time: Date.now(),
                grid: this
            };
            var clickEvent = new CustomEvent('fin-cell-enter', {
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
        fireSyntheticOnCellExitEvent: function(mouseEvent) {
            var detail = {
                gridCell: this.rectangles.point.create(mouseEvent.x + this.getHScrollValue(), mouseEvent.y + this.getVScrollValue()),
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
            var fixedColCount = this.getFixedColumnCount();
            var fixedRowCount = this.getFixedRowCount();
            var x = cell.x < fixedColCount ? cell.x - fixedColCount : cell.x + this.getHScrollValue() - fixedColCount;
            var y = cell.y < fixedRowCount ? cell.y - fixedRowCount : cell.y + this.getVScrollValue() - fixedRowCount;
            var detail = {
                gridCell: this.rectangles.point.create(x, y),
                mousePoint: mouseEvent.mousePoint,
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
            var fixedColCount = this.getFixedColumnCount();
            var fixedRowCount = this.getFixedRowCount();
            var x = cell.x < fixedColCount ? cell.x - fixedColCount : cell.x + this.getHScrollValue() - fixedColCount;
            var y = cell.y < fixedRowCount ? cell.y - fixedRowCount : cell.y + this.getVScrollValue() - fixedRowCount;
            var detail = {
                gridCell: this.rectangles.point.create(x, y),
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
         * @function
         * @instance
         * @description
        set the vertical scroll value
         *
         * @param {integer} newValue - the new value
         */
        setVScrollValue: function(y) {
            var max = this.sbVScrollConfig.rangeStop;
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
                self.sbVRangeAdapter.subjectChanged();
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
            var max = this.sbHScrollConfig.rangeStop;
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
                self.sbHRangeAdapter.subjectChanged();
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
                this.editorTakeFocus();
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

            this.sbHScrollConfig = {
                step: 1,
                page: 40,
                rangeStart: 0,
                rangeStop: 0

            };

            this.sbVScrollConfig = {
                step: 1,
                page: 40,
                rangeStart: 0,
                rangeStop: 0
            };

            this.sbHRangeAdapter = this.sbHScroller.createRangeAdapter(this.sbHValueHolder, this.sbHScrollConfig);
            this.sbVRangeAdapter = this.sbHScroller.createRangeAdapter(this.sbVValueHolder, this.sbVScrollConfig);

            this.sbHScroller.setRangeAdapter(this.sbHRangeAdapter);
            this.sbVScroller.setRangeAdapter(this.sbVRangeAdapter);

        },

        /**
         * @function
         * @instance
         * @description
        scroll values have changed, we've been notified *
         */
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
            return this.getBehavior()._getValue(x, y);
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
            this.getBehavior()._setValue(x, y, value);
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

            var behavior = this.getBehavior();
            if (!behavior) {
                return;
            }
            var numColumns = behavior._getColumnCount();
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
                var eachWidth = behavior._getColumnWidth(numColumns - lastPageColumnCount - 1);
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

            this.sbVScrollConfig.rangeStop = behavior.getRowCount() - lastPageRowCount;

            this.sbHScrollConfig.rangeStop = behavior._getColumnCount() - lastPageColumnCount;

            this.setVScrollValue(Math.min(this.getVScrollValue(), this.sbVScrollConfig.rangeStop));
            this.setHScrollValue(Math.min(this.getHScrollValue(), this.sbHScrollConfig.rangeStop));

            this.repaint();
            //this.sbVScroller.tickle();
            //this.sbHScroller.tickle();
        },

        /**
         * @function
         * @instance
         * @description
        Answers the number of viewable rows, including any partially viewable rows.
         *
         * #### returns: integer
         */
        getViewableRows: function() {
            return this.getRenderer().getViewableRows();
        },

        /**
         * @function
         * @instance
         * @description
        Answers the number of viewable columns, including any partially viewable columns.
         *
         * #### returns: integer
         */
        getViewableColumns: function() {
            return this.getRenderer().getViewableColumns();
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
            return this.getBehavior()._getColumnWidth(columnIndex);
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
            this.getBehavior()._setColumnWidth(columnIndex, columnWidth);
        },

        /**
         * @function
         * @instance
         * @description
        return the width of a specific fixed column
         *
         * #### returns: integer
         * @param {integer} columnIndex - the untranslated fixed column index
         */
        getFixedColumnWidth: function(columnIndex) {
            return this.getBehavior().getFixedColumnWidth(columnIndex);
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
        set the column width at a specific fixed column index
         *
         * @param {integer} columnIndex - the untranslated column index
         * @param {integer} columnWidth - the width in pixels
         */
        setFixedColumnWidth: function(columnIndex, columnWidth) {
            this.getBehavior().setFixedColumnWidth(columnIndex, columnWidth);
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
       return the height of a specific fixed row
         *
         * #### returns: integer
         * @param {integer} rowIndex - the untranslated fixed row index
         */
        getFixedRowHeight: function(rowIndex) {
            return this.getBehavior().getFixedRowHeight(rowIndex);
        },

        /**
         * @function
         * @instance
         * @description
       set the row height at a specific fixed for index
         *
         * @param {integer} rowIndex - the untranslated row index
         * @param {integer} rowHeight - the height in pixels
         */
        setFixedRowHeight: function(rowIndex, rowHeight) {
            this.getBehavior().setFixedRowHeight(rowIndex, rowHeight);
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
            return this.getBehavior()._getColumnCount();
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
        fixedRowClicked: function(mouse) {
            this.getBehavior()._fixedRowClicked(this, mouse);
        },

        /**
         * @function
         * @instance
         * @description
        a fixed column cell has been clicked; delegate to the behavior
         *
         * @param {mouse} mouse - the event details
         */
        fixedColumnClicked: function(mouse) {
            this.getBehavior()._fixedColumnClicked(this, mouse);
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
            var editor = this.getCellEditorAt(x, y);
            if (editor) {
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
            return this.getBehavior()._getCellEditorAt(x, y);
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
            var behavior = this.getBehavior();
            var cursor = behavior.getCursorAt(-1, -1);
            var hoverCell = this.getHoverCell();
            if (hoverCell && hoverCell.x > -1 && hoverCell.y > -1) {
                var x = hoverCell.x + this.getHScrollValue();
                x = behavior.translateColumnIndex(x);
                cursor = behavior.getCursorAt(x, hoverCell.y + this.getVScrollValue());
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
            var rowCount = renderer.getViewableRows();
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
        synthesize and dispatch a fin-selection-changed event
         *
         */
        selectionChanged: function() {
            var event = new CustomEvent('fin-selection-changed', {
                detail: {
                    time: Date.now()
                }
            });
            this.canvas.dispatchEvent(event);
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

        /**
         * @function
         * @instance
         * @description
        synthesize and fire a fin-before-cell-edit event
         *
         * @param {rectangle.point} cell - the x,y coordinates
         * @param {Object} value - the current value
         */
        fireBeforeCellEdit: function(cell, value) {
            var clickEvent = new CustomEvent('fin-before-cell-edit', {
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
        return our [fin-hypergrid-renderer](module-._renderer.html) sub-component.
         *
         * @param {rectangle.point} cell - the x,y coordinates
         * @param {Object} oldValue - the old value
         * @param {Object} newValue - the new value
         */
        fireAfterCellEdit: function(cell, oldValue, newValue) {
            var clickEvent = new CustomEvent('fin-after-cell-edit', {
                detail: {
                    newValue: newValue,
                    oldValue: oldValue,
                    gridCell: cell,
                    time: Date.now()
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
            var width, currentWidth;
            if (colIndex < 0) {
                var numFixedCols = this.getFixedColumnCount();
                colIndex = colIndex + numFixedCols;
                currentWidth = this.getFixedColumnWidth(colIndex);
                width = this.getRenderer().renderedFixedColumnMinWidths[colIndex];
                this.setFixedColumnWidth(colIndex, Math.max(width, currentWidth));
            } else {
                width = this.getRenderer().renderedColumnMinWidths[colIndex];
                this.setColumnWidth(colIndex, width);
            }
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
        getVisibleColumns: function() {
            return this.getRenderer().getVisibleColumns();
        },

        /**
         * @function
         * @instance
         * @description
        return the number of rows that were just rendered
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
    });

})(); /* jslint ignore:line */
