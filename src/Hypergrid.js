/* eslint-env browser */

'use strict';

var extend = require('extend-me');
var deprecated = require('./lib/deprecated');
extend.debug = true;

var FinBar = require('finbars');
var Canvas = require('fincanvas');
var Point = require('rectangular').Point;
var Rectangle = require('rectangular').Rectangle;
var _ = require('object-iterators');

var defaults = require('./defaults');
var cellEditors = require('./cellEditors');
var Renderer = require('./lib/Renderer');
var SelectionModel = require('./lib/SelectionModel');
var css = require('./css');
var Formatters = require('./lib/Formatters');

var themeInitialized = false,
    polymerTheme = Object.create(defaults),
    globalProperties = Object.create(polymerTheme);

/**
 * @constructor
 * @param {string|Element} div - CSS selector or Element
 * @param {object} options - Required (despite its name) because you must provide a behavior one way or another.
 * @param {string} [options.getBehavior] - A function(grid) that returns a new behavior object. Provide this or provide `options.data` (with or without `options.Behavior`)
 * @param {object[]} [options.data] - An array of congruent raw data objects. Provide this (with or without `options.Behavior`) or provide `options.getBehavior`.
 * @param {Behavior} [options.Behavior=JSON] - A grid behavior (descendant of Behavior "class"). Will be used if `getBehavior` omitted, in which case `options.data` (which has no default) *must* also be provided.
 * @param {object} [options.margin] - optional canvas margins
 * @param {string} [options.margin.top=0]
 * @param {string} [options.margin.right='-200px']
 * @param {string} [options.margin.bottom=0]
 * @param {string} [options.margin.left=0]
 */
function Hypergrid(div, options) {
    var self = this;

    this.div = (typeof div === 'string') ? document.querySelector(div) : div;

    css.inject('grid');

    this.lastEdgeSelection = [0, 0];

    this.lnfProperties = Object.create(globalProperties);

    this.isWebkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1;
    this.selectionModel = new SelectionModel(this);
    this.makeCellEditors();
    this.renderOverridesCache = {};

    this.behavior = options.getBehavior
        ? options.getBehavior(this)
        : new (options.Behavior || Hypergrid.behaviors.JSON)(this, options.data);

    //prevent the default context menu for appearing
    this.div.oncontextmenu = function(event) {
        event.preventDefault();
        return false;
    };

    this.clearMouseDown();
    this.dragExtent = new Point(0, 0);
    this.numRows = 0;
    this.numColumns = 0;

    //install any plugins
    this.pluginsDo(function(each) {
        if (each.installOn) {
            each.installOn(self);
        }
    });

    var margin = options.margin || {};
    margin.top = margin.top || 0;
    margin.right = margin.right || '-200px';
    margin.bottom = margin.bottom || 0;
    margin.left = margin.left || 0;

    //initialize our various pieces
    if (!themeInitialized) {
        themeInitialized = true;
        buildPolymerTheme();
    }
    this.initRenderer();
    this.initCanvas(margin);
    this.initScrollbars();

    //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
    document.body.addEventListener('copy', function(evt) {
        self.checkClipboardCopy(evt);
    });
    this.getCanvas().resize();
}

Hypergrid.prototype = {
    constructor: Hypergrid.prototype.constructor,

    deprecated: deprecated,

    /**
     *
     * A null object behavior serves as a place holder.
     * @type {object}
     * @memberOf Hypergrid.prototype
     */
    behavior: null,

    /**
     * Cached resulan}
     * @memberOf Hypergrid.prototype
     */
    isWebkit: true,

    /**
     * The pixel location of an initial mousedown click, either for editing a cell or for dragging a selection.
     * @type {Point}
     * @memberOf Hypergrid.prototype
     */
    mouseDown: [],

    /**
     * The extent from the mousedown point during a drag operation.
     * @type {Point}
     * @memberOf Hypergrid.prototype
     */

    dragExtent: null,

    /**
     * A float value between 0.0 - 1.0 of the vertical scroll position.
     * @type {number}
     * @memberOf Hypergrid.prototype
     */
    vScrollValue: 0,

    /**
     * A float value between 0.0 - 1.0 of the horizontal scroll position.
     * @type {number}
     * @memberOf Hypergrid.prototype
     */
    hScrollValue: 0,

    /**
     * @property {window.fin.rectangular} rectangular - Namespace for Point and Rectangle "classes" (constructors).
     * @memberOf Hypergrid.prototype
     */
    rectangular: null,

    /**
     * @property {fin-hypergrid-selection-model} selectionModel - A [fin-hypergrid-selection-model](module-._selection-model.html) instance.
     * @memberOf Hypergrid.prototype
     */
    selectionModel: null,

    /**
     * @property {fin-hypergrid-cell-editor} cellEditor - The current instance of [fin-hypergrid-cell-editor](module-cell-editors_base.html).
     * @memberOf Hypergrid.prototype
     */
    cellEditor: null,

    /**
     * @property {fin-vampire-bar} sbHScroller - An instance of [fin-vampire-bar](http://datamadic.github.io/fin-vampire-bar/components/fin-vampire-bar/).
     * @memberOf Hypergrid.prototype
     */
    sbHScroller: null,

    /**
     * @property {fin-vampire-bar} sbVScroller - An instance of [fin-vampire-bar](http://datamadic.github.io/fin-vampire-bar/components/fin-vampire-bar/).
     * @memberOf Hypergrid.prototype
     */
    sbVScroller: null,

    /**
     * The previous value of sbVScrollVal.
     * @type {number}
     * @memberOf Hypergrid.prototype
     */
    sbPrevVScrollValue: null,

    /**
     * The previous value of sbHScrollValue.
     * @type {number}
     * @memberOf Hypergrid.prototype
     */
    sbPrevHScrollValue: null,

    /**
     * The cache of singleton cellEditors.
     * @type {object}
     * @memberOf Hypergrid.prototype
     */
    cellEditors: null,

    /**
     * is the short term memory of what column I might be dragging around
     * @type {object}
     * @memberOf Hypergrid.prototype
     */

    renderOverridesCache: {},

    /**
     * The pixel location of the current hovered cell.
     * @type {Point}
     * @memberOf Hypergrid.prototype
     */
    hoverCell: null,

    scrollingNow: false,

    lastEdgeSelection: null,

    /**
     * @memberOf Hypergrid.prototype
    clear out the LRU cache of text widths
     */
    setAttribute: function(attribute, value) {
        this.div.setAttribute(attribute, value);
    },

    /**
     * @memberOf Hypergrid.prototype
    clear out all state and data of the grid
     */
    reset: function() {
        this.lastEdgeSelection = [0, 0];
        this.lnfProperties = Object.create(globalProperties);
        this.selectionModel = new SelectionModel(this);
        this.makeCellEditors();
        this.renderOverridesCache = {};
        this.clearMouseDown();
        this.dragExtent = new Point(0, 0);

        this.numRows = 0;
        this.numColumns = 0;

        this.vScrollValue = 0;
        this.hScrollValue = 0;

        this.cellEditor = null;

        this.sbPrevVScrollValue = null;
        this.sbPrevHScrollValue = null;

        this.hoverCell = null;
        this.scrollingNow = false;
        this.lastEdgeSelection = [0, 0];

        this.behavior.reset();
        this.getRenderer().reset();
        this.getCanvas().resize();
        this.behaviorChanged();
    },

    //resetTextWidthCache: function() {
    //    textWidthCache = new LRUCache(2000);
    //},

    getProperties: function() {
        return this.getPrivateState();
    },

    _getProperties: function() {
        return this.lnfProperties;
    },

    computeCellsBounds: function() {
        var renderer = this.getRenderer();
        if (renderer) {
            renderer.computeCellsBounds();
        }
    },

    toggleColumnPicker: function() {
        this.behavior.toggleColumnPicker();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} The pointer is over the given cell.
     * @param {number} x - The x cell coordinate.
     * @param {number} y - The y cell coordinate.
     */
    isHovered: function(x, y) {
        var p = this.getHoverCell();
        return p && p.x === x && p.y === y;
    },

    registerFormatter: function(name, func) {
        Formatters[name] = func;
    },

    getFormatter: function(type) {
        var formatter = Formatters[type];
        if (formatter) {
            return formatter;
        }
        return Formatters.default;
    },

    formatValue: function(type, value) {
        var formatter = this.getFormatter(type);
        return formatter(value);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns boolean} The pointer is hovering over the given column.
     * @param {number} x - The horizontal cell coordinate.
     */
    isColumnHovered: function(x) {
        var p = this.getHoverCell();
        return p && p.x === x;
    },

    isRowResizeable: function() {
        return this.resolveProperty('rowResize');
    },

    isCheckboxOnlyRowSelections: function() {
        return this.resolveProperty('checkboxOnlyRowSelections');
    },

    /**
     *
     * @memberOf Hypergrid.prototype
     * @returns {boolean} The pointer is hovering over the row `y`.
     * @param {number} y - The vertical cell coordinate.
     */
    isRowHovered: function(y) {
        var p = this.getHoverCell();
        return p && p.y === y;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {Point} The cell over which the cursor is hovering.
     */
    getHoverCell: function() {
        return this.hoverCell;
    },


    /**
     * @memberOf Hypergrid.prototype
     * @desc Set the cell under the cursor.
     * @param {Point} point
     */
    setHoverCell: function(point) {
        var me = this.hoverCell;
        var newPoint = new Point(point.x, point.y);
        if (me && me.equals(newPoint)) {
            return;
        }
        this.hoverCell = newPoint;
        this.fireSyntheticOnCellEnterEvent(newPoint);
        this.repaint();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Ammend properties for all hypergrids in this process.
     * @param {object} properties - A simple properties hash.
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
     * @memberOf Hypergrid.prototype
     * @desc Ammend properties for all hypergrids in this process.
     * @param {object} properties - A simple properties hash.
     * @private
     */
    _addGlobalProperties: function(properties) {
        _(properties).each(function(property, key) {
            globalProperties[key] = property;
        });
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Utility function to push out properties if we change them.
     * @param {object} properties - An object of various key value pairs.
     */

    refreshProperties: function() {
        // this.canvas = this.shadowRoot.querySelector('fin-canvas');
        //this.canvas = new Canvas(this.divCanvas, this.renderer); //TODO: Do we really need to be recreating it here?
        this.renderer.computeCellsBounds();
        this.checkScrollbarVisibility();
        this.behavior.defaultRowHeight = null;
        if (this.isColumnAutosizing()) {
            this.behavior.autosizeAllColumns();
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Ammend properties for this hypergrid only.
     * @param {object} moreProperties - A simple properties hash.
     */
    addProperties: function(moreProperties) {
        var properties = this.getProperties();
        addDeepProperties(properties, moreProperties);
        this.refreshProperties();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {object} The state object for remembering our state.
     * @see [Memento pattern](http://en.wikipedia.org/wiki/Memento_pattern)
     */
    getPrivateState: function() {
        return this.behavior.getPrivateState();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Set the state object to return to the given user configuration.
     * @param {object} state - A memento object.
     * @see [Memento pattern](http://en.wikipedia.org/wiki/Memento_pattern)
     */
    setState: function(state) {
        var self = this;
        this.behavior.setState(state);
        setTimeout(function() {
            self.behaviorChanged();
            self.synchronizeScrollingBoundries();
        }, 100);
    },

    getState: function() {
        return this.behavior.getState();
    },
    /**
     * @memberOf Hypergrid.prototype
     * @returns {object} The initial mouse position on a mouse down event for cell editing or a drag operation.
     * @memberOf Hypergrid.prototype
     */
    getMouseDown: function() {
        var last = this.mouseDown.length - 1;
        if (last < 0) {
            return null;
        }
        return this.mouseDown[last];
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Remove the last item from the mouse down stack.
     */
    popMouseDown: function() {
        if (this.mouseDown.length !== 0) {
            this.mouseDown.length = this.mouseDown.length - 1;
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Empty out the mouse down stack.
     */
    clearMouseDown: function() {
        this.mouseDown = [new Point(-1, -1)];
        this.dragExtent = null;
    },

    /**
     * @memberOf Hypergrid.prototype
     set the mouse point that initated a cell edit or drag operation
     *
     * @param {Point} point
     */
    setMouseDown: function(point) {
        this.mouseDown.push(point);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {Point} The extent point of the current drag selection rectangle.
     */
    getDragExtent: function() {
        return this.dragExtent;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Sets the extent point of the current drag selection operation.
     * @param {Point} point
     */
    setDragExtent: function(point) {
        this.dragExtent = point;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Iterate over the plugins invoking the given function with each.
     * @todo We need a new plugin mechanism!
     * @param {function} func - The function to invoke on all the plugins.
     */
    pluginsDo: function(func) {
        //TODO: We need a new plugin mechanism!
        //var userPlugins = this.children.array();
        //var pluginsTag = this.shadowRoot.querySelector('fin-plugins');
        //
        //var plugins = userPlugins;
        //if (pluginsTag) {
        //    var systemPlugins = pluginsTag.children.array();
        //    plugins = systemPlugins.concat(plugins);
        //}
        //
        //plugins.forEach(function(plugin) {
        //    func(plugin);
        //});
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc The CellProvider is accessed through Hypergrid because Hypergrid is the mediator and should have ultimate control on where it comes from. The default is to delegate through the behavior object.
     * @returns {fin-hypergrid-cell-provider}
     */
    getCellProvider: function() {
        var provider = this.behavior.getCellProvider();
        return provider;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc This function is a callback from the HypergridRenderer sub-component. It is called after each paint of the canvas.
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
     * @memberOf Hypergrid.prototype
     * @desc The grid has just been rendered, make sure the column widths are optimal.
     */
    checkColumnAutosizing: function() {
        var behavior = this.behavior;
        behavior.autoSizeRowNumberColumn();
        if (this.isColumnAutosizing()) {
            behavior.checkColumnAutosizing(false);
        }
    },
    /**
     * @memberOf Hypergrid.prototype
     * @desc Notify the GridBehavior how many rows and columns we just rendered.
     */
    updateRenderedSizes: function() {
        //add one to each of these values as we want also to include
        //the columns and rows that are partially visible
        this.behavior.setRenderedColumnCount(this.getVisibleColumns() + 1);
        this.behavior.setRenderedRowCount(this.getVisibleRows() + 1);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Conditionally copy to clipboard.
     * @desc If we have focus, copy our current selection data to the system clipboard.
     * @param {event} event - The copy system event.
     */
    checkClipboardCopy: function(event) {
        if (this.hasFocus()) {
            event.preventDefault();
            var csvData = this.getSelectionAsTSV();
            event.clipboardData.setData('text/plain', csvData);
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} We have any selections.
     */
    hasSelections: function() {
        if (!this.getSelectionModel) {
            return; // were not fully initialized yet
        }
        return this.selectionModel.hasSelections();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {string} Tab separated value string from the selection and our data.
     */
    getSelectionAsTSV: function() {
        var sm = this.selectionModel;
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
        var result = '';

        //only use the data from the last selection
        if (selections.length) {
            var width = selections.length,
                height = selections[0].length,
                area = width * height,
                lastCol = width - 1,
                //Whitespace will only be added on non-singular rows, selections
                whiteSpaceDelimiterForRow = (height > 1 ? '\n' : '');

            //disallow if selection is too big
            if (area > 20000) {
                alert('selection size is too big to copy to the paste buffer'); // eslint-disable-line no-alert
                return '';
            }

            for (var h = 0; h < height; h++) {
                for (var w = 0; w < width; w++) {
                    result += selections[w][h] + (w < lastCol ? '\t' : whiteSpaceDelimiterForRow);
                }
            }
        }

        return result;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} We have focus.
     */
    hasFocus: function() {
        return this.getCanvas().hasFocus();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Clear all the selections.
     */
    clearSelections: function() {
        var dontClearRows = this.isCheckboxOnlyRowSelections();
        this.selectionModel.clear(dontClearRows);
        this.clearMouseDown();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Clear the most recent selection.
     */
    clearMostRecentSelection: function() {
        var dontClearRows = this.isCheckboxOnlyRowSelections();
        this.selectionModel.clearMostRecentSelection(dontClearRows);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Clear the most recent column selection.
     */
    clearMostRecentColumnSelection: function() {
        this.selectionModel.clearMostRecentColumnSelection();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Clear the most recent row selection.
     */
    clearMostRecentRowSelection: function() {
        //this.selectionModel.clearMostRecentRowSelection(); // commented off as per GRID-112
    },

    clearRowSelection: function() {
        this.selectionModel.clearRowSelection();
        this.behavior.dataModel.clearSelectedData();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Select given region.
     * @param {number} ox - origin x
     * @param {number} oy - origin y
     * @param {number} ex - extent x
     * @param {number} ex - extent y
     */
    select: function(ox, oy, ex, ey) {
        if (ox < 0 || oy < 0) {
            //we don't select negative area
            //also this means there is no origin mouse down for a selection rect
            return;
        }
        this.selectionModel.select(ox, oy, ex, ey);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} Given point is selected.
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     */
    isSelected: function(x, y) {
        return this.selectionModel.isSelected(x, y);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} The given column is selected anywhere in the entire table.
     * @param {number} col - The column index.
     */
    isCellSelectedInRow: function(col) {
        var selectionModel = this.selectionModel;
        var isSelected = selectionModel.isCellSelectedInRow(col);
        return isSelected;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} The given row is selected anywhere in the entire table.
     * @param {number} row - The row index.
     */
    isCellSelectedInColumn: function(row) {
        var selectionModel = this.selectionModel;
        var isSelected = selectionModel.isCellSelectedInColumn(row);
        return isSelected;
    },

    /** @deprecated Use `.selectionModel` property instead.
     * @memberOf Hypergrid.prototype
     * @returns {SelectionModel} The selection model.
     */
    getSelectionModel: function() {
        return this.deprecated('selectionModel', { since: '0.2' });
    },

    /** @deprecated Use `.behavior` property instead.
     * @memberOf Hypergrid.prototype
     * @returns {Behavior} The behavior (model).
     */
    getBehavior: function() {
        return this.deprecated('behavior', { since: '0.2' });
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Set the Behavior (model) object for this grid control.
     * @desc This can be done dynamically.
     * @param {Behavior} behavior - The behavior (model).
     */
    setBehavior: function(behavior) {
        behavior.changed = this.behaviorChanged.bind(this);
        behavior.shapeChanged = this.behaviorShapeChanged.bind(this);
        behavior.stateChanged = this.behaviorStateChanged.bind(this);
        this.behavior = behavior;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc I've been notified that the behavior has changed.
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
     * @memberOf Hypergrid.prototype
     * @returns {Rectangle} My bounds.
     */
    getBounds: function() {
        var renderer = this.getRenderer();
        return renderer && renderer.getBounds();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {string} The value of a lnf property.
     * @param {string} key - A look-and-feel key.
     */
    resolveProperty: function(key) {
        var keys = key.split('.');
        var prop = this.getProperties();
        while (keys.length) { prop = prop[keys.shift()]; }
        return prop;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    behaviorShapeChanged: function() {
        this.synchronizeScrollingBoundries();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc The dimensions of the grid data have changed. You've been notified.
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
     * @memberOf Hypergrid.prototype
     * @desc Paint immediately in this microtask.
     */
    paintNow: function() {
        var canvas = this.getCanvas();
        canvas.paintNow();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} In HiDPI mode (has an attribute as such).
     */
    useHiDPI: function() {
        return this.resolveProperty('useHiDPI') !== false;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Initialize drawing surface.
     * @private
     */
    initCanvas: function(margin) {

        var self = this;

        var divCanvas = this.divCanvas = document.createElement('div');
        this.div.appendChild(divCanvas);
        this.canvas = new Canvas(divCanvas, this.renderer);
        this.canvas.canvas.classList.add('hypergrid');

        var style = divCanvas.style;
        style.position = 'absolute';
        style.top = margin.top;
        style.right = margin.right;
        style.bottom = margin.bottom;
        style.left = margin.left;

        this.canvas.resizeNotification = function() {
            self.resized();
        };

        this.addEventListener('fin-canvas-mousemove', function(e) {
            if (self.resolveProperty('readOnly')) {
                return;
            }
            var mouse = e.detail.mouse;
            var mouseEvent = self.getGridCellFromMousePoint(mouse);
            mouseEvent.primitiveEvent = e;
            self.delegateMouseMove(mouseEvent);
        });

        this.addEventListener('fin-canvas-mousedown', function(e) {
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

        // this.addEventListener('fin-canvas-click', function(e) {
        //     if (self.resolveProperty('readOnly')) {
        //         return;
        //     }
        //     //self.stopEditing();
        //     var mouse = e.detail.mouse;
        //     var mouseEvent = self.getGridCellFromMousePoint(mouse);
        //     mouseEvent.primitiveEvent = e;
        //     self.fireSyntheticClickEvent(mouseEvent);
        // });

        this.addEventListener('fin-canvas-mouseup', function(e) {
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
                self.fireSyntheticButtonPressedEvent(self.mouseDownState);
            }
            self.mouseDownState = null;
            self.fireSyntheticMouseUpEvent(mouseEvent);
        });

        this.addEventListener('fin-canvas-dblclick', function(e) {
            if (self.resolveProperty('readOnly')) {
                return;
            }
            var mouse = e.detail.mouse;
            var mouseEvent = self.getGridCellFromMousePoint(mouse);
            mouseEvent.primitiveEvent = e;
            self.fireSyntheticDoubleClickEvent(mouseEvent, e);
            self.delegateDoubleClick(mouseEvent);
        });

        this.addEventListener('fin-canvas-tap', function(e) {
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

        this.addEventListener('fin-canvas-drag', function(e) {
            if (self.resolveProperty('readOnly')) {
                return;
            }
            self.dragging = true;
            var mouse = e.detail.mouse;
            var mouseEvent = self.getGridCellFromMousePoint(mouse);
            mouseEvent.primitiveEvent = e;
            self.delegateMouseDrag(mouseEvent);
        });

        this.addEventListener('fin-canvas-keydown', function(e) {
            if (self.resolveProperty('readOnly')) {
                return;
            }
            self.fireSyntheticKeydownEvent(e);
            self.delegateKeyDown(e);
        });

        this.addEventListener('fin-canvas-keyup', function(e) {
            if (self.resolveProperty('readOnly')) {
                return;
            }
            self.fireSyntheticKeyupEvent(e);
            self.delegateKeyUp(e);
        });

        this.addEventListener('fin-canvas-track', function(e) {
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

        // this.addEventListener('fin-canvas-holdpulse', function(e) {
        //     console.log('holdpulse');
        //     if (self.resolveProperty('readOnly')) {
        //         return;
        //     }
        //     var mouse = e.detail.mouse;
        //     var mouseEvent = self.getGridCellFromMousePoint(mouse);
        //     mouseEvent.primitiveEvent = e;
        //     self.delegateHoldPulse(mouseEvent);
        // });

        this.addEventListener('fin-canvas-wheelmoved', function(e) {
            var mouse = e.detail.mouse;
            var mouseEvent = self.getGridCellFromMousePoint(mouse);
            mouseEvent.primitiveEvent = e.detail.primitiveEvent;
            self.delegateWheelMoved(mouseEvent);
        });

        this.addEventListener('fin-canvas-mouseout', function(e) {
            if (self.resolveProperty('readOnly')) {
                return;
            }
            var mouse = e.detail.mouse;
            var mouseEvent = self.getGridCellFromMousePoint(mouse);
            mouseEvent.primitiveEvent = e.detail.primitiveEvent;
            self.delegateMouseExit(mouseEvent);
        });

        this.addEventListener('fin-canvas-context-menu', function(e) {
            var mouse = e.detail.mouse;
            var mouseEvent = self.getGridCellFromMousePoint(mouse);
            mouseEvent.primitiveEvent = e.detail.primitiveEvent;
            self.delegateContextMenu(mouseEvent);
        });

        this.div.removeAttribute('tabindex');

    },

    convertViewPointToDataPoint: function(viewPoint) {
        return this.behavior.convertViewPointToDataPoint(viewPoint);
    },

    convertDataPointToViewPoint: function(dataPoint) {
        return this.behavior.convertDataPointToViewPoint(dataPoint);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Add an event listener to me.
     * @param {string} eventName - The type of event we are interested in.
     * @param {function} callback - The event handler.
     */
    addEventListener: function(eventName, callback) {
        this.canvas.addEventListener(eventName, callback);
    },

    addFinEventListener: function(eventName, callback) {
        console.warn('.addFinEventListener() method is deprecated as of v0.2. Use .addEventListener() instead. (Will be removed in a future release.)');
        this.addEventListener(eventName, callback);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Set for `scrollingNow` field.
     * @param {boolean} isItNow - The type of event we are interested in.
     */
    setScrollingNow: function(isItNow) {
        this.scrollingNow = isItNow;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} The `scrollingNow` field.
     */
    isScrollingNow: function() {
        return this.scrollingNow;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The index of the column divider under the mouse coordinates.
     * @param {MouseEvent} mouseEvent - The event to interogate.
     */
    overColumnDivider: function(mouseEvent) {
        var x = mouseEvent.primitiveEvent.detail.mouse.x;
        var whichCol = this.getRenderer().overColumnDivider(x);
        return whichCol;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The index of the row divider under the mouse coordinates.
     * @param {MouseEvent} mouseEvent - The event to interogate.
     */
    overRowDivider: function(mouseEvent) {
        var y = mouseEvent.primitiveEvent.detail.mouse.y;
        var which = this.getRenderer().overRowDivider(y);
        return which;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Switch the cursor for the grid.
     * @param {string} cursorName - A well know cursor name.
     * @see [cursor names](http://www.javascripter.net/faq/stylesc.htm)
     */
    beCursor: function(cursorName) {
        if (!cursorName) {
            cursorName = 'default';
        }
        this.div.style.cursor = cursorName;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Delegate the wheel moved event to the behavior.
     * @param {Event} event - The pertinent event.
     */
    delegateWheelMoved: function(event) {
        this.behavior.onWheelMoved(this, event);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Delegate MouseExit to the behavior (model).
     * @param {Event} event - The pertinent event.
     */
    delegateMouseExit: function(event) {
        this.behavior.handleMouseExit(this, event);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Delegate MouseExit to the behavior (model).
     * @param {Event} event - The pertinent event.
     */
    delegateContextMenu: function(event) {
       this. behavior.onContextMenu(this, event);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Delegate MouseMove to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseMove: function(mouseDetails) {
        this.behavior.onMouseMove(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Delegate mousedown to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseDown: function(mouseDetails) {
        this.behavior.handleMouseDown(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Delegate mouseup to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseUp: function(mouseDetails) {
        this.behavior.onMouseUp(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Delegate tap to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateTap: function(mouseDetails) {
        this.behavior.onTap(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Delegate mouseDrag to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseDrag: function(mouseDetails) {
        this.behavior.onMouseDrag(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc We've been doubleclicked on. Delegate through the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateDoubleClick: function(mouseDetails) {
        this.behavior.onDoubleClick(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Delegate holdpulse through the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateHoldPulse: function(mouseDetails) {
        this.behavior.onHoldPulse(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Generate a function name and call it on self.
     * @desc This should also be delegated through Behavior keeping the default implementation here though.
     * @param {event} event - The pertinent event.
     */
    delegateKeyDown: function(event) {
        this.behavior.onKeyDown(this, event);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Generate a function name and call it on self.
     * @desc This should also be delegated through Behavior keeping the default implementation here though.
     * @param {event} event - The pertinent event.
     */
    delegateKeyUp: function(event) {
        this.behavior.onKeyUp(this, event);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Shut down the current cell editor.
     */
    stopEditing: function() {
        if (this.cellEditor && this.isEditing()) {
            if (this.cellEditor.stopEditing) {
                this.cellEditor.stopEditing();
            }
            this.cellEditor = null;
        }
    },

    makeCellEditors: function() {
        var self = this;

        this.cellEditors = {};

        _(cellEditors).each(function(CellEditor) {
            if (!CellEditor.abstract) {
                self.registerCellEditor(CellEditor);
            }
        });

        this.cellEditors.int = this.cellEditors.float = this.cellEditors.spinner;

        // TODO: Commenting off the following which seem pointless
        //this.cellEditors.date = this.cellEditors.date;
        //this.cellEditors.string = this.cellEditors.extfield;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Register a cell editor.
     * @desc Creates a new instance of the provided cell editor and adds it to the `cellEditors` hash using the class name (converted to all lower case).
     *
     * You can use this method to register an additional cell editor of your own creation.
     *
     * > All native cell editors have already been "preregistered" for you (by `makeCellEditors`).
     *
     * @param {CellEditor.prototype.constructor} CellEditorConstructor - A constructor created with `CellEditor.extend(alias, {...})` where:
     * * `CellEditor` base class could also be some other class extended therefrom.
     * * `alias` parameter, usually optional (see {@link https://www.npmjs.com/package/extend-me}), is in this case required because the class name it specifies is needed below to derive the hash key (property name) for this entry in `this.cellEditors`.
     *
     * @returns {CellEditor} The newly instantiated `CellEditor` object.
     */
    registerCellEditor: function(CellEditorConstructor) {
        var grid = this,
            newCellEditor = new CellEditorConstructor(grid),
            key = newCellEditor.$$CLASS_NAME.toLowerCase();

        this.cellEditors[key] = newCellEditor;

        return newCellEditor;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {Rectangle} The pixel coordinates of just the center 'main" data area.
     */
    getDataBounds: function() {
        var colDNDHackWidth = 200; //this was a hack to help with column dnd, need to factor this into a shared variable
        var b = this.canvas.bounds;

        //var x = this.getRowNumbersWidth();
        // var y = behavior.getFixedRowsHeight() + 2;

        var result = new Rectangle(0, 0, b.origin.x + b.extent.x - colDNDHackWidth, b.origin.y + b.extent.y);
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
     * @memberOf Hypergrid.prototype
     * @returns {Canvas} Our fin-canvas instance.
     */
    getCanvas: function() {
        return this.canvas;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Open the given cell-editor at the provided model coordinates.
     * @param {string} cellEditor - The specific cell editor to use.
     * @param {Point} coordinates - The pixel locaiton of the cell to edit at.
     */
    editAt: function(cellEditor, editPoint) {

        this.cellEditor = cellEditor;

        if (editPoint.x >= 0 && editPoint.y >= 0) {
            this.setMouseDown(editPoint);
            this.setDragExtent(new Point(0, 0));
            cellEditor.beginEditAt(editPoint);
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} The given column is fully visible.
     * @param {number} columnIndex - The column index in question.
     * @return {boolan} Visible.
     */
    isColumnVisible: function(columnIndex) {
        return this.getRenderer().isColumnVisible(columnIndex);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} The given row is fully visible.
     * @param {number} rowIndex - The row index in question.
     * @return {boolan} Visible.
     */
    isDataRowVisible: function(rowIndex) {
        return this.getRenderer().isRowVisible(rowIndex);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} The given cell is fully is visible.
     * @param {number} columnIndex - The column index in question.
     * @param {number} rowIndex - The row index in question.
     * @return {boolean} Data is visible.
     */
    isDataVisible: function(columnIndex, rowIndex) {
        return this.isDataRowVisible(rowIndex) && this.isColumnVisible(columnIndex);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Scroll in the `offsetX` direction if column index `colIndex` is not visible.
     * @param {number} colIndex - The column index in question.
     * @param {number} offsetX - The direction and magnitude to scroll if we need to.
     * @return {boolean} Column is visible.
     */
    insureModelColIsVisible: function(colIndex, offsetX) {
        var maxCols = this.getColumnCount() - 1, // -1 excludes partially visible columns
            indexToCheck = colIndex + (offsetX > 0),
            visible = !this.isColumnVisible(indexToCheck) || colIndex === maxCols;

        if (visible) {
            //the scroll position is the leftmost column
            this.scrollBy(offsetX, 0);
        }

        return visible;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Scroll in the `offsetY` direction if column index c is not visible.
     * @param {number} rowIndex - The column index in question.
     * @param {number} offsetX - The direction and magnitude to scroll if we need to.
     * @return {boolean} Row is visible.
     */
    insureModelRowIsVisible: function(rowIndex, offsetY) {
        var maxRows = this.getRowCount() - 1, // -1 excludes partially visible rows
            indexToCheck = rowIndex + (offsetY > 0),
            visible = !this.isDataRowVisible(indexToCheck) || rowIndex === maxRows;

        if (visible) {
            //the scroll position is the topmost row
            this.scrollBy(0, offsetY);
        }

        return visible;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Scroll horizontal and vertically by the provided offsets.
     * @param {number} offsetX - Scroll in the x direction this much.
     * @param {number} offsetY - Scroll in the y direction this much.
     */
    scrollBy: function(offsetX, offsetY) {
        this.scrollHBy(offsetX);
        this.scrollVBy(offsetY);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Scroll vertically by the provided offset.
     * @param {number} offsetY - Scroll in the y direction this much.
     */
    scrollVBy: function(offsetY) {
        var max = this.sbVScroller.range.max;
        var oldValue = this.getVScrollValue();
        var newValue = Math.min(max, Math.max(0, oldValue + offsetY));
        if (newValue !== oldValue) {
            this.setVScrollValue(newValue);
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Scroll horizontally by the provided offset.
     * @param {number} offsetX - Scroll in the x direction this much.
     */
    scrollHBy: function(offsetX) {
        var max = this.sbHScroller.range.max;
        var oldValue = this.getHScrollValue();
        var newValue = Math.min(max, Math.max(0, oldValue + offsetX));
        if (newValue !== oldValue) {
            this.setHScrollValue(newValue);
        }
    },

    scrollToMakeVisible: function(c, r) {
        var leftColumn = this.renderer.getScrollLeft(),
            topRow = this.renderer.getScrollTop(),
            delta,
            numOfGridCtrlCols = 2, //TODO: Get rid of ALL magic and hardcoded numbers.
            numofGridCtrlRows = 3,
            adjustmentForPartiallyVisCols = -1;

        if (
            // target is off to left; negative delta scrolls left
            (delta = c - (leftColumn + this.renderer.getFixedColumnCount())) < 0 ||

            // target is off to right; positive delta scrolls right
            (delta = c - (leftColumn + this.getVisibleColumnsCount() - numOfGridCtrlCols + adjustmentForPartiallyVisCols)) > 0
        ) {
            this.sbHScroller.index += delta;
        }

        if (
            // target is above top; negative delta scrolls up
            (delta = r - (topRow + this.renderer.getFixedRowCount())) < 0 ||

            // target is below bottom; positive delta scrolls down
            (delta = r - (topRow + this.renderer.rowEdges.length - numofGridCtrlRows)) > 0
        ) {
            this.sbVScroller.index += delta;
        }
    },

    selectCellAndScrollToMakeVisible: function(c, r) {
        this.selectCell(c, r);
        this.scrollToMakeVisible(c, r);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Answer which data cell is under a pixel value mouse point.
     * @param {mousePoint} mouse - The mouse point to interrogate.
     */

    getGridCellFromMousePoint: function(mouse) {
        var cell = this.getRenderer().getGridCellFromMousePoint(mouse);
        return cell;
    },

    /**
     * @returns {Rectangle} The pixel based bounds rectangle given a data cell point.
     * @param {Point} cell - The pixel location of the mouse.
     * @memberOf Hypergrid.prototype
     */
    getBoundsOfCell: function(cell) {
        var b = this.getRenderer().getBoundsOfCell(cell);

        //we need to convert this to a proper rectangle
        var newBounds = new Rectangle(b.x, b.y, b.width, b.height);
        return newBounds;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc This is called by the fin-canvas when a resize occurs.
     */
    resized: function() {
        this.synchronizeScrollingBoundries();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary A click event occured.
     * @desc Determine the cell and delegate to the behavior (model).
     * @param {MouseEvent} event - The mouse event to interrogate.
     */
    cellClicked: function(event) {
        var cell = event.gridCell;

        //click occurred in background area
        if (
            cell.x <= this.getColumnCount() &&
            cell.y <= this.getRowCount()
        ) {
            var hovered = this.getHoverCell(),
                x = hovered.x,
                y = hovered.y;

            // if (x >= 0) {
            //     x = behavior.translateColumnIndex(x + this.getHScrollValue());
            // }

            if (y >= 0) {
                y += this.getVScrollValue();
            }

            this.behavior.cellClicked(new Point(x, y), event);
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @param {number} x - column index
     * @param {number} y - totals row index local to the totals area
     * @param value
     * @param {string[]} [areas=['top', 'bottom']] - may include `'top'` and/or `'bottom'`
     */
    setTotalsValueNotification: function(x, y, value, areas) {
        this.fireSyntheticSetTotalsValue(x, y, value, areas);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @param {number} x - column index
     * @param {number} y - totals row index local to the totals area
     * @param value
     * @param {string[]} [areas=['top', 'bottom']] - may include `'top'` and/or `'bottom'`
     */
    fireSyntheticSetTotalsValue: function(x, y, value, areas) {
        var clickEvent = new CustomEvent('fin-set-totals-value', {
            detail: {
                x: x,
                y: y,
                value: value,
                areas: areas
            }
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    fireSyntheticEditorKeyUpEvent: function(inputControl, keyEvent) {
        var clickEvent = new CustomEvent('fin-editor-keyup', {
            detail: {
                input: inputControl,
                keyEvent: keyEvent
            }
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    fireSyntheticEditorKeyDownEvent: function(inputControl, keyEvent) {
        var clickEvent = new CustomEvent('fin-editor-keydown', {
            detail: {
                input: inputControl,
                keyEvent: keyEvent
            }
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    fireSyntheticEditorKeyPressEvent: function(inputControl, keyEvent) {
        var clickEvent = new CustomEvent('fin-editor-keypress', {
            detail: {
                input: inputControl,
                keyEvent: keyEvent
            }
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
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and fire a `fin-row-selection-changed` event.
     */
    fireSyntheticRowSelectionChangedEvent: function() {
        var selectionEvent = new CustomEvent('fin-row-selection-changed', {
            detail: {
                rows: this.getSelectedRows(),
                columns: this.getSelectedColumns(),
                selections: this.selectionModel.getSelections(),
            }
        });
        this.canvas.dispatchEvent(selectionEvent);
    },

    fireSyntheticColumnSelectionChangedEvent: function() {
        var selectionEvent = new CustomEvent('fin-column-selection-changed', {
            detail: {
                rows: this.getSelectedRows(),
                columns: this.getSelectedColumns(),
                selections: this.selectionModel.getSelections()
            }
        });
        this.canvas.dispatchEvent(selectionEvent);
    },
    /**
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and dispatch a `fin-selection-changed` event.
     */
    selectionChanged: function() {
        var selectedRows = this.getSelectedRows();
        var selectionEvent = new CustomEvent('fin-selection-changed', {
            detail: {
                rows: selectedRows,
                columns: this.getSelectedColumns(),
                selections: this.selectionModel.getSelections(),
            }
        });
        this.canvas.dispatchEvent(selectionEvent);
    },


    getRowSelection: function() {
        var c, column, self = this,
            selectedRowIndexes = this.selectionModel.getSelectedRows(),
            numCols = this.getColumnCount(),
            result = {};

        function setValue(selectedRowIndex, r) {
            column[r] = valOrFunc(self.getValue(c, selectedRowIndex));
        }

        for (c = 0; c < numCols; c++) {
            column = new Array(selectedRowIndexes.length);
            result[this.getField(c)] = column;
            selectedRowIndexes.forEach(setValue);
        }

        return result;
    },

    getRowSelectionMatrix: function() {
        var c, self = this,
            selectedRowIndexes = this.selectionModel.getSelectedRows(),
            numCols = this.getColumnCount(),
            result = new Array(numCols);

        function getValue(selectedRowIndex, r) {
            result[c][r] = valOrFunc(self.getValue(c, selectedRowIndex));
        }

        for (c = 0; c < numCols; c++) {
            result[c] = new Array(selectedRowIndexes.length);
            selectedRowIndexes.forEach(getValue);
        }

        return result;
    },

    getColumnSelectionMatrix: function() {
        var selectedColumnIndexes = this.getSelectedColumns();
        var numRows = this.getRowCount();
        var result = new Array(selectedColumnIndexes.length);
        var self = this;
        selectedColumnIndexes.forEach(function(selectedColumnIndex, c) {
            result[c] = new Array(numRows);
            for (var r = 0; r < numRows; r++) {
                result[c][r] = valOrFunc(self.getValue(selectedColumnIndex, r));
            }
        });
        return result;
    },

    getColumnSelection: function() {
        var selectedColumnIndexes = this.getSelectedColumns();
        var result = {};
        var rowCount = this.getRowCount();
        var self = this;
        selectedColumnIndexes.forEach(function(selectedColumnIndex) {
            var column = new Array(rowCount);
            result[self.getField(selectedColumnIndex)] = column;
            for (var r = 0; r < rowCount; r++) {
                column[r] = valOrFunc(self.getValue(selectedColumnIndex, r));
            }
        });
        return result;
    },

    getSelection: function() {
        var self = this;
        var selections = this.getSelections();
        var result = new Array(selections.length);
        selections.forEach(function(selectionRect, i) {
            result[i] = self._getSelection(selectionRect);
        });
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
                column[r] = valOrFunc(this.getValue(ox + c, oy + r));
            }
        }
        return result;
    },

    getSelectionMatrix: function() {
        var self = this;
        var selections = this.getSelections();
        var result = new Array(selections.length);
        selections.forEach(function(selectionRect, i) {
            result[i] = self._getSelectionMatrix(selectionRect);
        });
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
                column[r] = valOrFunc(this.getValue(ox + c, oy + r));
            }
        }
        return result;
    },
    /**
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and fire a `fin-context-menu` event
     * @param {keyEvent} event - The canvas event.
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
                selections: this.selectionModel.getSelections()
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
                selections: this.selectionModel.getSelections()
            }
        });
        this.canvas.dispatchEvent(event);
    },

    fireSyntheticMouseDownEvent: function(e) {
        this.stopEditing();
        var event = new CustomEvent('fin-mousedown', {
            detail: {
                gridCell: e.gridCell,
                mousePoint: e.mousePoint,
                viewPoint: e.viewPoint,
                primitiveEvent: e.primitiveEvent,
                rows: this.getSelectedRows(),
                columns: this.getSelectedColumns(),
                selections: this.selectionModel.getSelections()
            }
        });
        this.canvas.dispatchEvent(event);
    },

    isViewableButton: function(c, r) {
        return this.getRenderer().isViewableButton(c, r);
    },

    fireSyntheticButtonPressedEvent: function(evt) {
        var dataCell = evt.dataCell;
        var gridCell = evt.gridCell;
        if (this.isViewableButton(dataCell.x, dataCell.y)) {
            var event = new CustomEvent('fin-button-pressed', {
                detail: {
                    gridCell: gridCell
                }
            });
            this.canvas.dispatchEvent(event);
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and fire a `fin-keydown` event.
     * @param {keyEvent} event - The canvas event.
     */
    fireSyntheticKeydownEvent: function(keyEvent) {
        var clickEvent = new CustomEvent('fin-keydown', {
            detail: keyEvent.detail
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and fire a `fin-keyup` event.
     * @param {keyEvent} event - The canvas event.
     */
    fireSyntheticKeyupEvent: function(keyEvent) {
        var clickEvent = new CustomEvent('fin-keyup', {
            detail: keyEvent.detail
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    fireSyntheticFilterAppliedEvent: function(details) {
        var event = new CustomEvent('fin-filter-applied', {
            detail: details
        });
        if (this.canvas) {
            this.canvas.dispatchEvent(event);
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and fire a `fin-cell-enter` event
     * @param {Point} cell - The pixel location of the cell in which the click event occurred.
     * @param {MouseEvent} event - The system mouse event.
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
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and fire a `fin-cell-exit` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} event - The system mouse event.
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
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and fire a `fin-cell-click` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} event - The system mouse event.
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
        this.behavior.enhanceDoubleClickEvent(detail);
        var clickEvent = new CustomEvent('fin-click', {
            detail: detail
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and fire a `fin-double-click` event.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticDoubleClickEvent: function(mouseEvent) {
        this.stopEditing();
        var cell = mouseEvent.gridCell;
        var detail = {
            gridCell: cell,
            mousePoint: mouseEvent.mousePoint,
            time: Date.now(),
            grid: this
        };
        this.behavior.enhanceDoubleClickEvent(mouseEvent);
        var clickEvent = new CustomEvent('fin-double-click', {
            detail: detail
        });
        this.behavior.cellDoubleClicked(cell, mouseEvent);
        this.canvas.dispatchEvent(clickEvent);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and fire a rendered event.
     */
    fireSyntheticGridRenderedEvent: function() {
        var event = new CustomEvent('fin-grid-rendered', {
            detail: {
                source: this,
                time: Date.now()
            }
        });
        if (this.canvas) {
            this.canvas.dispatchEvent(event);
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and fire a scroll event.
     * @param {string} type - Should be either `fin-scroll-x` or `fin-scroll-y`.
     * @param {number} oldValue - The old scroll value.
     * @param {number} newValue - The new scroll value.
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
     * @memberOf Hypergrid.prototype
     * @desc Set the vertical scroll value.
     * @param {number} newValue - The new scroll value.
     */
    setVScrollValue: function(y) {
        var self = this;
        y = Math.min(this.sbVScroller.range.max, Math.max(0, Math.round(y)));
        if (y !== this.vScrollValue) {
            this.behavior._setScrollPositionY(y);
            var oldY = this.vScrollValue;
            this.vScrollValue = y;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                // self.sbVRangeAdapter.subjectChanged();
                self.fireScrollEvent('fin-scroll-y', oldY, y);
            });
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @return {number} The vertical scroll value.
     */
    getVScrollValue: function() {
        return this.vScrollValue;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Set the horizontal scroll value.
     * @param {number} newValue - The new scroll value.
     */
    setHScrollValue: function(x) {
        var self = this;
        x = Math.min(this.sbHScroller.range.max, Math.max(0, Math.round(x)));
        if (x !== this.hScrollValue) {
            this.behavior._setScrollPositionX(x);
            var oldX = this.hScrollValue;
            this.hScrollValue = x;
            this.scrollValueChangedNotification();
            setTimeout(function() {
                //self.sbHRangeAdapter.subjectChanged();
                self.fireScrollEvent('fin-scroll-x', oldX, x);
                //self.synchronizeScrollingBoundries(); // todo: Commented off to prevent the grid from bouncing back, but there may be repurcussions...
            });
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns The vertical scroll value.
     */
    getHScrollValue: function() {
        return this.hScrollValue;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Request input focus.
     */
    takeFocus: function() {
        if (this.isEditing()) {
            this.stopEditing();
        } else {
            this.getCanvas().takeFocus();
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Request focus for our cell editor.
     */
    editorTakeFocus: function() {
        if (this.cellEditor) {
            return this.cellEditor.takeFocus();
        }
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} We have a currently active cell editor.
     */
    isEditing: function() {
        return this.cellEditor && this.cellEditor.isEditing;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Initialize the scroll bars.
     */
    initScrollbars: function() {

        var self = this;

        var horzBar = new FinBar({
            orientation: 'horizontal',
            onchange: self.setHScrollValue.bind(self),
            cssStylesheetReferenceElement: this.div
        });

        var vertBar = new FinBar({
            orientation: 'vertical',
            onchange: self.setVScrollValue.bind(self),
            paging: {
                up: self.pageUp.bind(self),
                down: self.pageDown.bind(self)
            }
        });

        this.sbHScroller = horzBar;
        this.sbVScroller = vertBar;

        var hPrefix = this.resolveProperty('hScrollbarClassPrefix');
        var vPrefix = this.resolveProperty('vScrollbarClassPrefix');

        if (hPrefix && hPrefix !== '') {
            this.sbHScroller.classPrefix = hPrefix;
        }

        if (vPrefix && vPrefix !== '') {
            this.sbVScroller.classPrefix = vPrefix;
        }

        this.div.appendChild(horzBar.bar);
        this.div.appendChild(vertBar.bar);

        this.resizeScrollbars();

    },

    resizeScrollbars: function() {
        this.sbHScroller.shortenBy(this.sbVScroller).resize();
        //this.sbVScroller.shortenBy(this.sbHScroller);
        this.sbVScroller.resize();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Scroll values have changed, we've been notified.
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

        this.sbPrevHScrollValue = this.hScrollValue;
        this.sbPrevVScrollValue = this.vScrollValue;

        if (this.cellEditor) {
            this.cellEditor.scrollValueChangedNotification();
        }

        this.computeCellsBounds();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Get data value at given cell.
     * @desc Delegates to the behavior.
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     * @param {*} value
     */
    getValue: function(x, y) {
        return this.behavior.getValue(x, y);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Set a data value into the behavior (model) at the given point
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     */
    setValue: function(x, y, value) {
        this.behavior.setValue(x, y, value);
    },

    getColumnAlignment: function(c) {
        return this.behavior.getColumnAlignment(c);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc The data dimensions have changed, or our pixel boundries have changed.
     * Adjust the scrollbar properties as necessary.
     */
    synchronizeScrollingBoundries: function() {
        var numFixedColumns = this.getFixedColumnCount();
        var numFixedRows = this.getFixedRowCount();

        var numColumns = this.getColumnCount();
        var numRows = this.getRowCount();

        var bounds = this.getBounds();
        if (!bounds) {
            return;
        }
        var scrollableHeight = bounds.height - this.behavior.getFixedRowsMaxHeight() - 15; //5px padding at bottom and right side
        var scrollableWidth = (bounds.width - 200) - this.behavior.getFixedColumnsMaxWidth() - 15;

        var lastPageColumnCount = 0;
        var columnsWidth = 0;
        for (; lastPageColumnCount < numColumns; lastPageColumnCount++) {
            var eachWidth = this.getColumnWidth(numColumns - lastPageColumnCount - 1);
            columnsWidth += eachWidth;
            if (columnsWidth > scrollableWidth) {
                break;
            }
        }

        var lastPageRowCount = 0;
        var rowsHeight = 0;
        for (; lastPageRowCount < numRows; lastPageRowCount++) {
            var eachHeight = this.getRowHeight(numRows - lastPageRowCount - 1);
            rowsHeight += eachHeight;
            if (rowsHeight > scrollableHeight) {
                break;
            }
        }

        var hMax = Math.max(0, numColumns - numFixedColumns - lastPageColumnCount);
        this.setHScrollbarValues(hMax);

        var vMax = 1 + Math.max(0, numRows - numFixedRows - lastPageRowCount);
        this.setVScrollbarValues(vMax);

        this.setHScrollValue(Math.min(this.getHScrollValue(), hMax));
        this.setVScrollValue(Math.min(this.getVScrollValue(), vMax));

        //this.getCanvas().resize();
        this.computeCellsBounds();
        this.repaint();

        this.resizeScrollbars();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Note that "viewable rows" includes any partially viewable rows.
     * @returns {number} The number of viewable rows.
     */
    getVisibleRows: function() {
        return this.getRenderer().getVisibleRows();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Note that "viewable columns" includes any partially viewable columns.
     * @returns {number} The number of viewable columns.
     */
    getVisibleColumns: function() {
        return this.getRenderer().getVisibleColumns();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Initialize the renderer sub-component.
     */
    initRenderer: function() {
        this.renderer = new Renderer(this);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {Renderer} sub-component
     */
    getRenderer: function() {
        return this.renderer;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The width of the given column.
     * @param {number} columnIndex - The untranslated column index.
     */
    getColumnWidth: function(columnIndex) {
        return this.behavior.getColumnWidth(columnIndex);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Set the width of the given column.
     * @param {number} columnIndex - The untranslated column index.
     * @param {number} columnWidth - The width in pixels.
     */
    setColumnWidth: function(columnIndex, columnWidth) {
        this.stopEditing();
        this.behavior.setColumnWidth(columnIndex, columnWidth);
    },

    getColumnEdge: function(c) {
        return this.behavior.getColumnEdge(c, this.getRenderer());
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The total width of all the fixed columns.
     */
    getFixedColumnsWidth: function() {
        return this.behavior.getFixedColumnsWidth();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The height of the given row
     * @param {number} rowIndex - The untranslated fixed column index.
     */
    getRowHeight: function(rowIndex) {
        return this.behavior.getRowHeight(rowIndex);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Set the height of the given row.
     * @param {number} rowIndex - The row index.
     * @param {number} rowHeight - The width in pixels.
     */
    setRowHeight: function(rowIndex, rowHeight) {
        this.stopEditing();
        this.behavior.setRowHeight(rowIndex, rowHeight);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The total fixed rows height
     */
    getFixedRowsHeight: function() {
        return this.behavior.getFixedRowsHeight();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The number of columns.
     */
    getColumnCount: function() {
        return this.behavior.getColumnCount();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The number of fixed rows.
     */
    getRowCount: function() {
        return this.behavior.getRowCount();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The number of unfiltered rows.
     */
    getUnfilteredRowCount: function() {
        return this.behavior.getUnfilteredRowCount();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The number of fixed columns.
     */
    getFixedColumnCount: function() {
        return this.behavior.getFixedColumnCount();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns The number of fixed rows.
     */
    getFixedRowCount: function() {
        return this.behavior.getFixedRowCount();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary The top left area has been clicked on
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    topLeftClicked: function(mouse) {
        this.behavior.topLeftClicked(this, mouse);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary A fixed row has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    rowHeaderClicked: function(mouse) {
        this.behavior.rowHeaderClicked(this, mouse);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary A fixed column has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    columnHeaderClicked: function(mouse) {
        this.behavior.columnHeaderClicked(this, mouse);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc An edit event has occurred. Activate the editor at the given coordinates.
     * @param {number} event.gridCell.x - The horizontal coordinate.
     * @param {number} event.gridCell.y - The vertical coordinate.
     * @param {boolean} [event.primitiveEvent.type]
     * @returns {undefined|CellEditor} The editor object or `undefined` if no editor or editor already open.
     */
    onEditorActivate: function(event) {
        var point = event.gridCell;

        if (this.isEditable() || this.isFilterRow(point.y)) {
            var primEvent = event.primitiveEvent,
                isDblClick = primEvent && primEvent.type === 'fin-canvas-dblclick',
                editor = this.getCellEditorAt(point.x, point.y, isDblClick),
                editorPoint = editor.getEditorPoint(),
                sameCell = point.equals(editorPoint),
                editorAlreadyOpen = sameCell && editor.isEditing;

            if (editorAlreadyOpen) {
                editor = undefined;
            } else {
                if (this.isEditing()) {
                    this.stopEditing(); //other editor is open, close it first
                }
                this.editAt(editor, point);
            }
        }

        return editor;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Get the cell editor.
     * @desc Delegates to the behavior.
     * @returns The cell editor at the given coordinates.
     * @param {x} x - The horizontal coordinate.
     * @param {y} y - The vertical coordinate.
     * @param {boolean} isDblClick - When called from `onEditorActivate`, indicates if event was a double-click.
     */
    getCellEditorAt: function(x, y, isDblClick) {
        return this.behavior._getCellEditorAt(x, y, isDblClick);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @summary Toggle HiDPI support.
     * @desc HiDPI support is now *on* by default.
     * > There used to be a bug in Chrome that caused severe slow down on bit blit of large images, so this HiDPI needed to be optional.
     */
    toggleHiDPI: function() {
        if (this.useHiDPI()) {
            this.removeAttribute('hidpi');
        } else {
            this.setAttribute('hidpi', null);
        }
        this.canvas.resize();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} Te HiDPI ratio.
     */
    getHiDPI: function(ctx) {
        if (window.devicePixelRatio && this.useHiDPI()) {
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
     * @memberOf Hypergrid.prototype
     * @returns {number} The width of the given (recently rendered) column.
     * @param {number} colIndex - The column index.
     */
    getRenderedWidth: function(colIndex) {
        return this.renderer.getRenderedWidth(colIndex);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The height of the given (recently rendered) row.
     * @param {number} rowIndex - Tthe row index.
     */
    getRenderedHeight: function(rowIndex) {
        return this.renderer.getRenderedHeight(rowIndex);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {CellEditor} The cell editor at alias "name" (a sub-component).
     * @param {string} name
     */
    resolveCellEditor: function(name) {
        return this.cellEditors[name];
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Update the cursor under the hover cell.
     */
    updateCursor: function() {
        var cursor = this.behavior.getCursorAt(-1, -1);
        var hoverCell = this.getHoverCell();
        if (
            hoverCell &&
            hoverCell.x > -1 &&
            hoverCell.y > -1
        ) {
            var x = hoverCell.x + this.getHScrollValue();
            cursor = this.behavior.getCursorAt(x, hoverCell.y + this.getVScrollValue());
        }
        this.beCursor(cursor);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Repaint the given cell.
     * @param {x} x - The horizontal coordinate.
     * @param {y} y - The vertical coordinate.
     */
    repaintCell: function(x, y) {
        this.getRenderer().repaintCell(x, y);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {boolean} The user is currently dragging a column to reorder it.
     */
    isDraggingColumn: function() {
        return !!this.renderOverridesCache.dragger;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Scroll up one full page.
     * @returns {number}
     */
    pageUp: function() {
        var rowNum = this.getRenderer().getPageUpRow();
        this.setVScrollValue(rowNum);
        return rowNum;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Scroll down one full page.
     * @returns {number}
     */
    pageDown: function() {
        var rowNum = this.getRenderer().getPageDownRow();
        this.setVScrollValue(rowNum);
        return rowNum;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Not yet implemented.
     */
    pageLeft: function() {
        console.log('page left');
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Not yet implemented.
     */
    pageRight: function() {
        console.log('page right');
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {object[]} Objects with the values that were just rendered.
     */
    getRenderedData: function() {
        // assumes one row of headers
        var behavior = this.behavior,
            renderer = this.getRenderer(),
            colCount = this.getColumnCount(),
            rowCount = renderer.getVisibleRows(),
            headers = new Array(colCount),
            results = new Array(rowCount),
            row;

        headers.forEach(function(header, c) {
            headers[c] = behavior.getColumnId(c, 0);
        });

        results.forEach(function(result, r) {
            row = results[r] = {
                hierarchy: behavior.getFixedColumnValue(0, r)
            };
            headers.forEach(function(field, c) {
                row[field] = behavior.getValue(c, r);
            });
        });

        return results;
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {object} An object that represents the currently selection row.
     */
    getSelectedRow: function() {
        var sels = this.selectionModel.getSelections();
        if (sels.length) {
            var behavior = this.behavior,
                colCount = this.getColumnCount(),
                topRow = sels[0].origin.y,
                row = {
                    //hierarchy: behavior.getFixedColumnValue(0, topRow)
                };

            for (var c = 0; c < colCount; c++) {
                row[behavior.getColumnId(c, 0)] = behavior.getValue(c, topRow);
            }

            return row;
        }
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
        return this.canvas.dispatchEvent(clickEvent); //I wasn't cancelled
    },
    /**
     * @memberOf Hypergrid.prototype
     * @desc Synthesize and fire a fin-before-cell-edit event.
     * @param {Point} cell - The x,y coordinates.
     * @param {Object} value - The current value.
     */
    fireBeforeCellEdit: function(cell, oldValue, newValue, control) {
        var clickEvent = new CustomEvent('fin-before-cell-edit', {
            cancelable: true,
            detail: {
                oldValue: oldValue,
                newValue: newValue,
                gridCell: cell,
                time: Date.now(),
                input: control,
                row: this.getRow(cell.y)
            }
        });
        var proceed = this.canvas.dispatchEvent(clickEvent);
        return proceed; //I wasn't cancelled
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {Renderer} sub-component
     * @param {Point} cell - The x,y coordinates.
     * @param {Object} oldValue - The old value.
     * @param {Object} newValue - The new value.
     */
    fireAfterCellEdit: function(cell, oldValue, newValue, control) {
        var clickEvent = new CustomEvent('fin-after-cell-edit', {
            detail: {
                newValue: newValue,
                oldValue: oldValue,
                gridCell: cell,
                time: Date.now(),
                input: control,
                row: this.getRow(cell.y)
            }
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Autosize the column at colIndex for best fit.
     * @param {number} colIndex - The column index to modify at
     */
    autosizeColumn: function(colIndex) {
        var column = this.behavior.getColumn(colIndex);
        column.checkColumnAutosizing(true);
        this.computeCellsBounds();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Enable/disable if this component can receive the focus.
     * @param {boolean} - canReceiveFocus
     */
    setFocusable: function(canReceiveFocus) {
        this.getCanvas().setFocusable(canReceiveFocus);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The number of columns that were just rendered
     */
    getVisibleColumnsCount: function() {
        return this.getRenderer().getVisibleColumnsCount();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @returns {number} The number of rows that were just rendered
     */
    getVisibleRowsCount: function() {
        return this.getRenderer().getVisibleRowsCount();
    },

    /**
     * @memberOf Hypergrid.prototype
    update the size of the grid
     *
     * #### returns: integer
     */
    updateSize: function() {
        this.canvas.checksize();
    },


    /**
     * @memberOf Hypergrid.prototype
     * @desc Stop the global repainting flag thread.
     */
    stopPaintThread: function() {
        this.canvas.stopPaintThread();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Stop the global resize check flag thread.
     */
    stopResizeThread: function() {
        this.canvas.stopResizeThread();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Restart the global resize check flag thread.
     */
    restartResizeThread: function() {
        this.canvas.restartResizeThread();
    },

    /**
     * @memberOf Hypergrid.prototype
     * @desc Restart the global repainting check flag thread.
     */
    restartPaintThread: function() {
        this.canvas.restartPaintThread();
    },

    swapColumns: function(source, target) {
        this.behavior.swapColumns(source, target);
    },

    endDragColumnNotification: function() {
        this.behavior.endDragColumnNotification();
    },

    getFixedColumnsMaxWidth: function() {
        return this.behavior.getFixedColumnsMaxWidth();
    },

    isMouseDownInHeaderArea: function() {
        var numHeaderColumns = this.getHeaderColumnCount();
        var numHeaderRows = this.getHeaderRowCount();
        var mouseDown = this.getMouseDown();
        return mouseDown.x < numHeaderColumns || mouseDown.y < numHeaderRows;
    },

    isHeaderWrapping: function() {
        return this.resolveProperty('headerTextWrapping');
    },

    _getBoundsOfCell: function(x, y) {
        return this.getRenderer()._getBoundsOfCell(x, y);
    },

    getColumnProperties: function(columnIndex) {
        return this.behavior.getColumnProperties(columnIndex);
    },

    setColumnProperties: function(columnIndex, properties) {
        this.behavior.setColumnProperties(columnIndex, properties);
    },

    moveSingleSelect: function(x, y) {
        this.behavior.moveSingleSelect(this, x, y);
    },

    selectCell: function(x, y) {
        var dontClearRows = this.isCheckboxOnlyRowSelections();
        this.selectionModel.clear(dontClearRows);
        this.selectionModel.select(x, y, 0, 0);
    },

    getHeaderColumnCount: function() {
        return this.behavior.getHeaderColumnCount();
    },

    toggleSort: function(x, keys) {
        this.stopEditing();
        var behavior = this.behavior;
        var self = this;
        behavior.toggleSort(x, keys);

        setTimeout(function() {
            self.synchronizeScrollingBoundries();
            //self.behaviorChanged();
            if (self.isColumnAutosizing()) {
                behavior.autosizeAllColumns();
            }
            self.repaint();
        }, 10);
    },

    toggleSelectColumn: function(x, keys) {
        keys = keys || [];
        var model = this.selectionModel;
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
        //we can select the totals rows if they exist, but not rows above that
        if (y > this.getFilterRowIndex()) {
            keys = keys || [];

            var sm = this.selectionModel;
            var alreadySelected = sm.isRowSelected(y);
            var hasSHIFT = keys.indexOf('SHIFT') >= 0;

            if (alreadySelected) {
                sm.deselectRow(y);
            } else {
                this.singleSelect();
                sm.selectRow(y);
            }

            if (hasSHIFT) {
                sm.clear();
                sm.selectRow(this.lastEdgeSelection[1], y);
            }

            if (!alreadySelected && !hasSHIFT) {
                this.lastEdgeSelection[1] = y;
            }
            this.repaint();
        }
    },

    singleSelect: function() {
        var isCheckboxOnlyRowSelections = this.isCheckboxOnlyRowSelections(),
            isSingleRowSelectionMode = this.isSingleRowSelectionMode(),
            hasCTRL = false,
            result;

        if (this.mouseDownState){
            //triggered programmatically
            hasCTRL = this.mouseDownState.primitiveEvent.detail.primitiveEvent.ctrlKey;
        }

        result = (
            isCheckboxOnlyRowSelections && isSingleRowSelectionMode ||
            !isCheckboxOnlyRowSelections && (!hasCTRL || isSingleRowSelectionMode)
        );

        if (result) {
            this.selectionModel.clearRowSelection();
        }

        return result;
    },

    selectViewportCell: function(x, y) {
        var headerRowCount = this.getHeaderRowCount();
        var renderer = this.getRenderer();
        var realX = renderer.getVisibleColumns()[x];
        var realY = renderer.getVisibleRows()[y];
        this.clearSelections();
        this.select(realX, realY + headerRowCount, 0, 0);
        this.setMouseDown(this.newPoint(realX, realY + headerRowCount));
        this.setDragExtent(this.newPoint(0, 0));
        this.repaint();
    },

    selectToViewportCell: function(x, y) {
        var selections = this.getSelections();
        if (selections && selections.length) {
            var headerRowCount = this.getHeaderRowCount();
            var renderer = this.getRenderer();
            var realX = renderer.getVisibleColumns()[x];
            var realY = renderer.getVisibleRows()[y] + headerRowCount;
            var selection = selections[0];
            var origin = selection.origin;
            this.setDragExtent(this.newPoint(realX - origin.x, realY - origin.y));
            this.select(origin.x, origin.y, realX - origin.x, realY - origin.y);
            this.repaint();
        }
    },

    selectFinalCellOfCurrentRow: function() {
        var x = this.getColumnCount() - 1;
        var y = this.getSelectedRows()[0];
        var headerRowCount = this.getHeaderRowCount();
        this.clearSelections();
        this.scrollBy(this.getColumnCount(), 0);
        this.select(x, y + headerRowCount, 0, 0);
        this.setMouseDown(this.newPoint(x, y + headerRowCount));
        this.setDragExtent(this.newPoint(0, 0));
        this.repaint();
    },

    selectToFinalCellOfCurrentRow: function() {
        var selections = this.getSelections();
        if (selections && selections.length) {
            var selection = selections[0];
            var origin = selection.origin;
            var extent = selection.extent;
            var columnCount = this.getColumnCount();
            this.scrollBy(columnCount, 0);

            this.clearSelections();
            this.select(origin.x, origin.y, columnCount - origin.x - 1, extent.y);

            this.repaint();
        }
    },

    selectFirstCellOfCurrentRow: function() {
        var x = 0;
        var y = this.getSelectedRows()[0];
        var headerRowCount = this.getHeaderRowCount();
        this.clearSelections();
        this.setHScrollValue(0);
        this.select(x, y + headerRowCount, 0, 0);
        this.setMouseDown(this.newPoint(x, y + headerRowCount));
        this.setDragExtent(this.newPoint(0, 0));
        this.repaint();
    },

    selectToFirstCellOfCurrentRow: function() {
        var selections = this.getSelections();
        if (selections && selections.length) {
            var selection = selections[0];
            var origin = selection.origin;
            var extent = selection.extent;
            this.clearSelections();
            this.select(origin.x, origin.y, -origin.x, extent.y);
            this.setHScrollValue(0);
            this.repaint();
        }
    },

    selectFinalCell: function() {
        this.selectCell(this.getColumnCount() - 1, this.getRowCount() - 1);
        this.scrollBy(this.getColumnCount(), this.getRowCount());
        this.repaint();
    },

    selectToFinalCell: function() {
        var selections = this.getSelections();
        if (selections && selections.length) {
            var selection = selections[0];
            var origin = selection.origin;
            var columnCount = this.getColumnCount();
            var rowCount = this.getRowCount();

            this.clearSelections();
            this.select(origin.x, origin.y, columnCount - origin.x - 1, rowCount - origin.y - 1);
            this.scrollBy(columnCount, rowCount);
            this.repaint();
        }
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
        return this.behavior.getHeaderRowCount();
    },
    isFilterRow: function(y) {
        return y === this.getFilterRowIndex();
    },
    getFilterRowIndex: function() {
        return !this.isShowFilterRow() ? -1 : this.isShowHeaderRow() ? 1 : 0;
    },
    setGroups: function(arrayOfColumnIndexes) {
        this.behavior.setGroups(arrayOfColumnIndexes);
    },
    hasHierarchyColumn: function() {
        return this.behavior.hasHierarchyColumn();
    },
    isHierarchyColumn: function(x) {
        return this.hasHierarchyColumn() && x === 0;
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
        return this.selectionModel.isColumnOrRowSelected();
    },
    selectColumn: function(x1, x2) {
        this.selectionModel.selectColumn(x1, x2);
    },
    selectRow: function(y1, y2) {
        var sm = this.selectionModel;
        var selectionEdge = this.getFilterRowIndex() + 1;

        if (this.singleSelect()) {
            y1 = y2;
        } else {
            // multiple row selection
            y2 = y2 || y1;
        }
        var min = Math.min(y1, y2);
        if (min >= selectionEdge) {
            var max = Math.max(y1, y2);
            sm.selectRow(min, max);
        }
    },
    isRowNumberAutosizing: function() {
        return this.resolveProperty('rowNumberAutosizing');
    },
    isRowSelected: function(r) {
        return this.selectionModel.isRowSelected(r);
    },
    isColumnSelected: function(c) {
        return this.selectionModel.isColumnSelected(c);
    },
    lookupFeature: function(key) {
        return this.behavior.lookupFeature(key);
    },
    getRow: function(y) {
        return this.behavior.getRow(y);
    },
    getFieldName: function(index) {
        return this.behavior.getFieldName(index);
    },

    getColumnIndex: function(fieldName) {
        return this.behavior.getColumnIndex(fieldName);
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
        return this.behavior.getComputedRow(y);
    },
    isColumnAutosizing: function() {
        return this.resolveProperty('columnAutosizing') === true;
    },
    getGlobalFilter: function() {
        return this.behavior.getGlobalFilter();
    },
    setGlobalFilter: function(filterOrOptions) {
        this.behavior.setGlobalFilter(filterOrOptions);
    },
    setGlobalFilterCaseSensitivity: function(isSensitive) {
        // this setting affects all grids
        this.behavior.dataModel.setGlobalFilterCaseSensitivity(isSensitive);
    },
    selectRowsFromCells: function() {
        if (!this.isCheckboxOnlyRowSelections()) {
            var last,
                hasCTRL = this.mouseDownState.primitiveEvent.detail.primitiveEvent.ctrlKey;

            if (hasCTRL && !this.isSingleRowSelectionMode()) {
                this.selectionModel.selectRowsFromCells(0, hasCTRL);
            } else if ((last = this.selectionModel.getLastSelection())) {
                this.selectRow(null, last.corner.y);
            } else {
                this.clearRowSelection();
            }
        }
    },
    selectColumnsFromCells: function() {
        this.selectionModel.selectColumnsFromCells();
    },
    getSelectedRows: function() {
        return this.behavior.getSelectedRows();
    },
    getSelectedColumns: function() {
        return this.behavior.getSelectedColumns();
    },
    getSelections: function() {
        return this.behavior.getSelections();
    },
    getLastSelectionType: function() {
        return this.selectionModel.getLastSelectionType();
    },
    isCellSelected: function(x, y) {
        return this.selectionModel.isCellSelected(x, y);
    },
    isInCurrentSelectionRectangle: function(x, y) {
        return this.selectionModel.isInCurrentSelectionRectangle(x, y);
    },
    selectAllRows: function() {
        this.selectionModel.selectAllRows();
    },
    areAllRowsSelected: function() {
        return this.selectionModel.areAllRowsSelected();
    },
    toggleSelectAllRows: function() {
        if (this.areAllRowsSelected()) {
            this.selectionModel.clear();
        } else {
            this.selectAllRows();
        }
        this.repaint();
    },
    getField: function(x) {
        return this.behavior.getField(x);
    },
    isSingleRowSelectionMode: function() {
        return this.resolveProperty('singleRowSelectionMode');
    },
    newPoint: function(x, y) {
        return new Point(x, y);
    },
    newRectangle: function(x, y, width, height) {
        return new Rectangle(x, y, width, height);
    },
    getFormattedValue: function(x, y) {
        y = y + this.getHeaderRowCount();
        var formatType = this.getColumnProperties(x).format;
        var value = this.getValue(x, y);
        var formatter = this.getFormatter(formatType);
        return formatter(value);
    },

    openDialog: function(dialogName, options) {
        this.dialog = this.behavior.openDialog(dialogName, options);
    },

    // although you can have multiple dialogs open at the same time, the following enforces one at time (for now)
    toggleDialog: function(newDialogName, options) {
        var dialog = this.dialog,
            oldDialogName = dialog && dialog.$$CLASS_NAME;
        if (!dialog || !this.dialog.close() && oldDialogName !== newDialogName) {
            options.terminate = function() { // when about-to-be-opened dialog is eventually closed
                delete this.dialog;
            }.bind(this);
            if (!dialog) {
                // open new dialog now
                this.openDialog(newDialogName, options);
            } else {
                // open new dialog when already-opened dialog finishes closing due to .closeDialog() above
                dialog.terminate = this.openDialog.bind(this, newDialogName, options);
            }
        }
    }
};

/**
 * @summary Update deep properties with new values.
 * @desc This function is a recursive property setter which updates a deep property in a destination object with the value of a congruent property in a source object.
 *
 * > Terminology: A deep property is a "terminal node" (primitive value) nested at some depth (i.e., depth > 1) inside a complex object (an object containing nested objects). A congruent property is a property in another object with the same name and at the same level of nesting.
 *
 * This function is simple and elegant. I recommend you study the code, which nonetheless implies all of the following:
 *
 * * If the deep property is _not_ found in `destination`, it will be created.
 * * If the deep property is found in `destination` _and_ is a primitive type, it will be modified (overwritten with the value from `source`).
 * * If the deep property is found in `destination` _but_ is not a primitive type (i.e., is a nested object), it will _also_ be overwritten with the (primitive) value from `source`.
 * * If the nested object the deep property inhabits in `source` is not found in `destination`, it will be created.
 * * If the nested object the deep property inhabits in `source` is found in `destination` but is not in fact an object (i.e., it is a primitive value), it will be overwritten with a reference to that object.
 * * If the primitive value is `undefined`, the destination property is deleted.
 * * `source` may contain multiple properties to update.
 *
 * That one rule is simply this: If both the source _and_ the destination properties are objects, then recurse; else overwrite the destination property with the source property.
 *
 * > Caveat: This is _not_ equivalent to a deep extend function. While both a deep extend and this function will recurse over a complex object, they are fundamentally different: A deep extend clones the nested objects as it finds them; this function merely updates them (or creates them where they don't exist).
 *
 * @param {object} destination - An object to update with new or modified property values
 * @param {object} source - A congruent object continaly (only) the new or modified property values.
 * @returns {object} Always returns `destination`.
 */
function addDeepProperties(destination, source) {
    _(source).each(function(property, key) {
        if (typeof destination[key] === 'object' && typeof property === 'object') {
            addDeepProperties(destination[key], property);
        } else if (property === undefined) {
            delete destination[key];
        } else {
            destination[key] = property;
        }
    });
    return destination;
}

function normalizeRect(rect) {
    var o = rect.origin;
    var c = rect.corner;

    var ox = Math.min(o.x, c.x);
    var oy = Math.min(o.y, c.y);

    var cx = Math.max(o.x, c.x);
    var cy = Math.max(o.y, c.y);

    var result = new Rectangle(ox, oy, cx - ox, cy - oy);

    return result;
}

function buildPolymerTheme() {
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
}

function clearObjectProperties(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            delete obj[prop];
        }
    }
}

function valOrFunc(vf) {
    var result = (typeof vf)[0] === 'f' ? vf() : vf;
    return result || result === 0 ? result : '';
}

module.exports = Hypergrid;
