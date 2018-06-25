/* eslint-env browser */

'use strict';

require('./lib/polyfills'); // Installs misc. polyfills into global objects, as needed

var Point = require('rectangular').Point;
var Rectangle = require('rectangular').Rectangle;
var _ = require('object-iterators'); // fyi: installs the Array.prototype.find polyfill, as needed
var injectCSS = require('inject-stylesheet-template').bind(require('../css'));

var Base = require('./Base');
var themes = require('./themes');
var defaults = require('./defaults');
var dynamicPropertyDescriptors = require('./lib/dynamicProperties');
var Canvas = require('./lib/Canvas');
var Renderer = require('./renderer');
var SelectionModel = require('./lib/SelectionModel');
var Localization = require('./lib/Localization');
var Behavior = require('./behaviors/Behavior');
var behaviorJSON = require('./behaviors/JSON');
var cellRenderers = require('./cellRenderers');
var cellEditors = require('./cellEditors');

var EDGE_STYLES = ['top', 'bottom', 'left', 'right'],
    RECT_STYLES = EDGE_STYLES.concat(['width', 'height', 'position']);

/**
 * @mixes scrolling.mixin
 * @mixes events.mixin
 * @mixes selection.mixin
 * @mixes themes.mixin
 * @mixes themes.sharedMixin
 * @constructor
 * @param {string|Element} [container] - CSS selector or Element
 * @param {object} [options]
 * @param {function} [options.Behavior=behaviors.JSON] - A grid behavior constructor (extended from {@link Behavior}).
 * @param {function[]} [options.pipeline] - A list function constructors to use for passing data through a series of transforms to occur on reindex call
 * @param {function|object[]} [options.data] - Passed to behavior constructor. May be:
 * * An array of congruent raw data objects
 * * A function returning same
 * @param {function|menuItem[]} [options.schema=derivedSchema] - Passed to behavior constructor. May be:
 * * A schema array
 * * A function returning a schema array. Called at filter reset time with behavior as context.
 * * Omit to generate a basic schema from `this.behavior.columns`.
 *
 * @param {pluginSpec|pluginSpec[]} [options.plugins]
 *
 * @param {subgridSpec[]} [options.subgrids]
 *
 * @param {object} [options.state]
 *
 * @param {string|Element} [options.container] - CSS selector or Element
 *
 * @param {string} [options.localization=Hypergrid.localization]
 * @param {string|string[]} [options.localization.locale=Hypergrid.localization.locale] - The default locale to use when an explicit `locale` is omitted from localizer constructor calls. Passed to Intl.NumberFomrat` and `Intl.DateFomrat`. See {@ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation|Locale identification and negotiation} for more information.
 * @param {string} [options.localization.numberOptions=Hypergrid.localization.numberOptions] - Options passed to `Intl.NumberFormat` for creating the basic "number" localizer.
 * @param {string} [options.localization.dateOptions=Hypergrid.localization.dateOptions] - Options passed to `Intl.DateFomrat` for creating the basic "date" localizer.
 *
 * @param {object} [options.schema]
 *
 * @param {object} [options.margin] - Optional canvas "margins" applied to containing div as .left, .top, .right, .bottom. (Default values actually derive from 'grid' stylesheet's `.hypergrid-container` rule.)
 * @param {string} [options.margin.top='0px']
 * @param {string} [options.margin.right='0px']
 * @param {string} [options.margin.bottom='0px']
 * @param {string} [options.margin.left='0px']
 *
 * @param {object} [options.boundingRect] - Optional grid container size & position. (Default values actually derive from 'grid' stylesheet's `.hypergrid-container > div:first-child` rule.)
 * @param {string} [options.boundingRect.height='500px']
 * @param {string} [options.boundingRect.width='auto']
 * @param {string} [options.boundingRect.left='auto']
 * @param {string} [options.boundingRect.top='auto']
 * @param {string} [options.boundingRect.right='auto']
 * @param {string} [options.boundingRect.bottom='auto']
 * @param {string} [options.boundingRect.position='relative']
 */
var Hypergrid = Base.extend('Hypergrid', {
    initialize: function(container, options) {
        this.selectionInitialize();

        //Optional container argument
        if (!(typeof container === 'string') && !(container instanceof HTMLElement)) {
            options = container;
            container = null;
        }

        this.options = options = options || {};

        this.clearState();

        //Set up the container for a grid instance
        this.setContainer(
            container ||
            options.container ||
            findOrCreateContainer(options.boundingRect)
        );

        // Install shared plug-ins (those with a `preinstall` method)
        Hypergrid.prototype.installPlugins(options.plugins);

        this.lastEdgeSelection = [0, 0];
        this.isWebkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1;
        this.selectionModel = new SelectionModel(this);
        this.renderOverridesCache = {};
        this.allowEventHandlers = true;
        this.dragExtent = new Point(0, 0);
        this.numRows = 0;
        this.numColumns = 0;
        this.clearMouseDown();
        this.setFormatter(options.localization);
        this.listeners = {};

        /**
         * @name cellRenderers
         * @type {Registry}
         * @memberOf Hypergrid#
         */
        this.cellRenderers = cellRenderers;

        /**
         * Private version of cell editors registry with a bound `create` method for use by `getCellEditorAt`.
         * @name cellEditors
         * @type {Registry}
         * @memberOf Hypergrid#
         */
        this.cellEditors = Object.create(cellEditors);
        Object.defineProperty(this.cellEditors, 'create', { value: createCellEditor.bind(this) });

        this.initCanvas();

        if (this.options.Behavior) {
            this.setBehavior(this.options); // also sets this.options.pipeline and this.options.data
        } else if (this.options.data) {
            this.setData(this.options.data, this.options); // if no behavior has yet been set, `setData` sets a default behavior and this.options.pipeline
        }

        if (this.options.state) {
            this.loadState(this.options.state);
        }

        /**
         * @name plugins
         * @summary Dictionary of named instance plug-ins.
         * @desc See examples for how to reference (albeit there is normally no need to reference plugins directly).
         *
         * For the dictionary of _shared_ plugins, see {@link Hypergrid.plugins|plugins} (a property of the constructor).
         * @example
         * var instancePlugins = myGrid.plugins;
         * var instancePlugins = this.plugins; // internal use
         * var myInstancePlugin = myGrid.plugins.myInstancePlugin;
         * @type {object}
         * @memberOf Hypergrid#
         */
        this.plugins = {};

        // Install instance plug-ins (those that are constructors OR have an `install` method)
        this.installPlugins(options.plugins);

        // Listen for propagated mouseclicks. Used for aborting edit mode.
        document.addEventListener('mousedown', this.mouseCatcher = function() {
            this.abortEditing();
        }.bind(this));

        setTimeout(this.repaint.bind(this));

        Hypergrid.grids.push(this);

        this.resetGridBorder('Top');
        this.resetGridBorder('Right');
        this.resetGridBorder('Bottom');
        this.resetGridBorder('Left');
    },

    terminate: function() {
        document.removeEventListener('mousedown', this.mouseCatcher);
        this.canvas.stop();
        Hypergrid.grids.splice(this.grids.indexOf(this), 1);
    },


    resetGridBorder: function(edge) {
        edge = edge || '';

        var propName = 'gridBorder' + edge,
            styleName = 'border' + edge,
            props = this.properties,
            border = props[propName];

        switch (border) {
            case true:
                border = props.lineWidth + 'px solid ' + props.lineColor;
                break;
            case false:
                border = null;
                break;
        }
        this.canvas.canvas.style[styleName] = border;
    },

    registerCellEditor: function(Constructor, name) {
        return this.deprecated('registerCellEditor(Constructor, name)', 'cellEditors.add(name, Constructor)', '1.0.6', arguments);
    },
    createCellEditor: function(name) {
        return this.deprecated('createCellEditor(name)', 'cellEditors.create(name)', '1.0.6', arguments);
    },
    getCellProvider: function(name) {
        return this.deprecated('getCellProvider()', 'cellRenderers', '1.0.6', arguments);
    },
    registerLocalizer: function(name, localizer, baseClassName, newClassName) {
        return this.deprecated('registerLocalizer(name, localizer, baseClassName, newClassName)', 'localization.add(name, localizer)', '1.0.6', arguments,
            'STRUCTURAL CHANGE: No longer supports deriving and registering a new cell editor class. Use .cellEditors.get(baseClassName).extend(newClassName || name, {...}) for that.');
    },
    getRenderer: function() {
        return this.deprecated('getRenderer()', 'renderer', '1.1.0');
    },

    /**
     * A null object behavior serves as a place holder.
     * @type {object}
     * @memberOf Hypergrid#
     */
    behavior: null,

    /**
     * Cached result of webkit test.
     * @type {boolean}
     * @memberOf Hypergrid#
     */
    isWebkit: true,

    /**
     * The pixel location of an initial mousedown click, either for editing a cell or for dragging a selection.
     * @type {Point}
     * @memberOf Hypergrid#
     */
    mouseDown: [],

    /**
     * The extent from the mousedown point during a drag operation.
     * @type {Point}
     * @memberOf Hypergrid#
     */
    dragExtent: null,

    /**
     * The instance of the grid's selection model.
     * May or may not contain any cell, row, and/or column selections.
     * @type {SelectionModel}
     * @memberOf Hypergrid#
     */
    selectionModel: null,

    /**
     * The instance of the currently active cell editor.
     * Will be `null` when not editing.
     * @type {CellEditor}
     * @memberOf Hypergrid#
     */
    cellEditor: null,

    /**
     * Non-`null` members represent additional things to render, after rendering the grid, such as the column being dragged.
     * @type {object}
     * @memberOf Hypergrid#
     */
    renderOverridesCache: {},

    /**
     * The pixel location of the current hovered cell.
     * @todo Need to detect hovering over bottom totals.
     * @type {Point}
     * @memberOf Hypergrid#
     */
    hoverCell: null,

    lastEdgeSelection: null,

    /**
     * @memberOf Hypergrid#
     */
    setAttribute: function(attribute, value) {
        this.div.setAttribute(attribute, value);
    },

    /**
     * @memberOf Hypergrid#
     */
    clearState: function() {
        /**
         * @name properties
         * @type {object}
         * @summary Object containing the properties of the grid.
         * @desc Grid properties objects have the following structure:
         * 1. User-configured properties and dynamic properties are in the "own" layer.
         * 2. Extends from the theme object.
         * 3. The theme object in turn extends from the {@link module:defaults|defaults} object.
         *
         * Note: Any changes the application developer may wish to make to the {@link module:defaults|defaults} object should be made _before_ reaching this point (_i.e.,_ prior to any grid instantiations).
         * @memberOf Hypergrid#
         */
        this.properties = Object.defineProperties(this.initThemeLayer(), {
            grid: { value: this },
            var: { value: new Var() }
        });

        // For all default props of object type, if a dynamic prop, invoke setter; else deep clone it so changes
        // made to inner props won't go to object on theme or defaults layers which are shared by other instances.
        Object.keys(defaults).forEach(function(key) {
            var value = defaults[key];
            if (typeof value === 'object') {
                if (dynamicPropertyDescriptors[key]) {
                    this[key] = value; // invoke dynamic prop setter
                } else {
                    this[key] = deepClone(value); // just a plain object
                }
            }
        }, this.properties);
    },

    /**
     * @desc Clear out all state settings, data (rows), and schema (columns) of a grid instance.
     * @param {object} [options]
     * @param {object} [options.subgrids] - Consumed by {@link Behavior#reset}.
     * If omitted, previously established subgrids list is reused.
     * @param {object} [options.pipeline] - Consumed by {@link dataModels.JSON#reset}.
     * If omitted, previously established pipeline is reused.
     * @param {object} [options.controllers] - Consumed by {@link dataModels.JSON#reset}.
     * If omitted, previously established controllers list is reused.
     * @memberOf Hypergrid#
     */
    reset: function(options) {
        this.clearState();

        this.removeAllEventListeners();

        this.lastEdgeSelection = [0, 0];
        this.selectionModel.reset();
        this.renderOverridesCache = {};
        this.clearMouseDown();
        this.dragExtent = new Point(0, 0);

        this.numRows = 0;
        this.numColumns = 0;

        this.vScrollValue = 0;
        this.hScrollValue = 0;

        this.cancelEditing();

        this.sbPrevVScrollValue = null;
        this.sbPrevHScrollValue = null;

        this.hoverCell = null;
        this.scrollingNow = false;
        this.lastEdgeSelection = [0, 0];

        options = options || {};
        this.behavior.reset({
            subgrids: options.subgrids,
            pipeline: options.pipeline,
            controllers: options.controllers
        });

        this.renderer.reset();
        this.canvas.resize();
        this.behaviorChanged();

        this.refreshProperties();
    },

    /** @typedef {object|function|Array} pluginSpec
     * @desc One of:
     * * simple API - a plain object with an `install` method
     * * object API - an object constructor
     * * array:
     *    * first element is an optional name for the API or the newly instantiated object
     *    * next element (or first element when not a string) is the simple or object API
     *    * remaining arguments are optional arguments for the object constructor
     * * falsy value such as `undefined` - ignored
     *
     * The API may have a `name` or `$$CLASS_NAME` property.
     */
    /**
     * @summary Install plugins.
     * @desc Plugin installation:
     * * Each simple API is installed by calling it's `install` method with `this` as first arg + any additional args listed in the `pluginSpec` (when it is an array).
     * * Each object API is installed by instantiating it's constructor with `this` as first arg + any additional args listed in the `pluginSpec` (when it is an array).
     *
     * The resulting plain object or instantiated objects may be named by (in priority order):
     * 1. if `pluginSpec` contains an array and first element is a string
     * 2. object has a `name` property
     * 3. object has a `$$CLASS_NAME` property
     *
     * If named, a reference to each object is saved in `this.plugins`. If the plug-in is unnamed, no reference is kept.
     *
     * There are two types of plugin installations:
     * * Preinstalled plugins which are installed on the prototype. These are simple API plugins with a `preinstall` method called with the `installPlugins` calling context as the first argument. Preinstallations are automatically performed whenever a grid is instantiated (at the beginning of the constructor), by calling `installPlugins` with `Hypergrid.prototype` as the calling context.
     * * Regular plugins which are installed on the instance. These are simple API plugins with an `install` method, as well as all object API plugins (constructors), called with the `installPlugins` calling context as the first argument. These installations are automatically performed whenever a grid is instantiated (at the end of the constructor), called with the new grid instance as the calling context.
     *
     * The "`installPlugins` calling context" means either the grid instance or its prototype, depending on how this method is called.
     *
     * Plugins may have both `preinstall` _and_ `install` methods, in which case both will be called. However, note that in any case, `install` methods on object API plugins are ignored.
     * @param {pluginSpec|pluginSpec[]} [plugins] - The plugins to install. If omitted, the call is a no-op.
     * @memberOf Hypergrid#
     */
    installPlugins: function(plugins) {
        var shared = this === Hypergrid.prototype; // Do shared ("preinstalled") plugins (if any)

        if (!plugins) {
            return;
        } else if (!Array.isArray(plugins)) {
            plugins = [plugins];
        }

        plugins.forEach(function(plugin) {
            var name, args, hash;

            if (!plugin) {
                return; // ignore falsy plugin spec
            }

            // set first arg of constructor to `this` (the grid instance)
            // set first arg of `install` method to `this` (the grid instance)
            // set first two args of `preinstall` method to `this` (the Hypergrid prototype) and the Behavior prototype
            args = [this];
            if (shared) {
                args.push(Behavior.prototype);
            }

            if (Array.isArray(plugin)) {
                if (!plugin.length) {
                    plugin = undefined;
                } else if (typeof plugin[0] !== 'string') {
                    args = args.concat(plugin.slice(1));
                    plugin = plugin[0];
                } else if (plugin.length >= 2) {
                    args = args.concat(plugin.slice(2));
                    name = plugin[0];
                    plugin = plugin[1];
                } else {
                    plugin = undefined;
                }
            }

            if (!plugin) {
                return; // ignore empty array or array with single string element
            }

            // Derive API name if not given in pluginSpec
            name = name || plugin.name || plugin.$$CLASS_NAME;
            if (name) {
                // Translate first character to lower case
                name = name.substr(0, 1).toLowerCase() + name.substr(1);
            }

            if (shared) {
                // Execute the `preinstall` method
                hash = this.constructor.plugins;
                if (plugin.preinstall && !hash[name]) {
                    plugin.preinstall.apply(plugin, args);
                }
            } else { // instance plug-ins:
                hash = this.plugins;
                if (typeof plugin === 'function') {
                    // Install "object API" by instantiating
                    plugin = this.createApply(plugin, args);
                } else if (plugin.install) {
                    // Install "simple API" by calling its `install` method
                    plugin.install.apply(plugin, args);
                } else if (!plugin.preinstall) {
                    throw new Base.prototype.HypergridError('Expected plugin (a constructor; or an API with a `preinstall` method and/or an `install` method).');
                }
            }

            if (name) {
                hash[name] = plugin;
            }

        }, this);
    },

    /**
     * @summary Uninstall all uninstallable plugins or just named plugins.
     * @desc Calls `uninstall` on plugins that define such a method.
     *
     * To uninstall "preinstalled" plugins, call with `Hypergrid.prototype` as context.
     *
     * For convenience, the following args are passed to the call:
     * * `this` - the plugin to be uninstalled
     * * `grid` - the hypergrid object
     * * `key` - name of the plugin to be uninstalled (_i.e.,_ key in `plugins`)
     * * `plugins` - the plugins hash (a.k.a. `grid.plugins`)
     * @param {string|stirng[]} [pluginNames] If provided, limit uninstall to the named plugin (string) or plugins (string[]).
     * @memberOf Hypergrid#
     */
    uninstallPlugins: function(pluginNames) {
        if (!pluginNames) {
            pluginNames = [];
        } else if (!Array.isArray(pluginNames)) {
            pluginNames = [pluginNames];
        }
        _(this.plugins).each(function(plugin, key, plugins) {
            if (
                plugins.hasOwnProperty(key) &&
                pluginNames.indexOf(key) >= 0 &&
                plugin.uninstall
            ) {
                plugin.uninstall(this, key, plugins);
            }
        }, this);
    },

    getProperties: function() {
        return this.deprecated('getProperties()', 'properties', '1.2.0');
    },

    computeCellsBounds: function() {
        this.renderer.computeCellsBounds();
    },

    setFormatter: function(options) {
        options = options || {};
        this.localization = new Localization(
            options.locale || Hypergrid.localization.locale,
            options.numberOptions || Hypergrid.localization.numberOptions,
            options.dateOptions || Hypergrid.localization.dateOptions
        );
    },

    getFormatter: function(localizerName) {
        return this.localization.get(localizerName).format;
    },

    formatValue: function(localizerName, value) {
        var formatter = this.getFormatter(localizerName);
        return formatter(value);
    },

    isRowResizeable: function() {
        return this.deprecated('isRowResizeable()', 'properties.rowResize', 'v1.2.10');
    },

    isCheckboxOnlyRowSelections: function() {
        return this.deprecated('isCheckboxOnlyRowSelections()', 'properties.checkboxOnlyRowSelections', 'v1.2.10');
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Point} The cell over which the cursor is hovering.
     */
    getHoverCell: function() {
        return this.deprecated('getHoverCell()', 'hoverCell', 'v1.2.0');
    },


    /**
     * @memberOf Hypergrid#
     * @desc Set the cell under the cursor.
     * @param {CellEvent} cellEvent
     */
    setHoverCell: function(cellEvent) {
        var hoverCell = this.hoverCell;
        if (!hoverCell || !hoverCell.equals(cellEvent.gridCell)) {
            this.hoverCell = cellEvent.gridCell;
            if (hoverCell) {
                this.fireSyntheticOnCellExitEvent(cellEvent);
            }
            this.fireSyntheticOnCellEnterEvent(cellEvent);
            this.repaint();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Amend properties for this hypergrid only.
     * @param {object} moreProperties - A simple properties hash.
     */
    addProperties: function(properties) {
        Object.assign(this.properties, properties);
        this.refreshProperties();
    },

    /**
     * @todo deprecate this in favor of making properties dynamic instead (for those that need to be)
     * @memberOf Hypergrid#
     * @desc Utility function to push out properties if we change them.
     * @param {object} properties - An object of various key value pairs.
     */
    refreshProperties: function() {
        this.behaviorShapeChanged();
        this.behavior.defaultRowHeight = null;
        this.behavior.autosizeAllColumns();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {object} The state object for remembering our state.
     * @see [Memento pattern](http://en.wikipedia.org/wiki/Memento_pattern)
     */
    getPrivateState: function() {
        return this.deprecated('getPrivateState()', 'properties', '1.2.0');
    },

    /**
     * @memberOf Hypergrid#
     * @desc Set the state object to return to the given user configuration.
     * @param {object} state - A memento object.
     * @see [Memento pattern](http://en.wikipedia.org/wiki/Memento_pattern)
     */
    setState: function(state) {
        this.addState(state, true);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Add to the state object.
     * @param {object} state
     */
    addState: function(state, settingState) {
        this.behavior.addState(state, settingState);
        this.refreshProperties();
        this.behaviorChanged();
    },

    getState: function() {
        return this.behavior.getState();
    },

    loadState: function(state) {
        this.behavior.setState(state);
    },

    /**
     * @todo Only output values when they differ from defaults (deep compare needed).
     * @param {object} [options]
     * @param {string[]} [options.blacklist] - List of grid properties to exclude. Pertains to grid own properties only.
     * @param {boolean} [options.compact] - Run garbage collection first. The only property this current affects is `properties.calculators` (removes unused calculators).
     * @param {number|string} [options.space='\t'] - For no space, give `0`. (See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify|JSON.stringify}'s `space` param other options.)
     * @param {function} [options.headerify] - If your headers were generated by a function (taking column name as a parameter), give a reference to that function here to avoid persisting headers that match the generated string.
     * @memberOf Hypergrid#
     */
    saveState: function(options) {
        options = options || {};

        var space = options.space === undefined ? '\t' : options.space,
            properties = this.properties,
            calculators = properties.calculators,
            blacklist = options.blacklist = options.blacklist || [];

        blacklist.push('columnProperties'); // Never output this synonym of 'columns'

        if (calculators) {
            if (options.compact) {
                var columns = this.behavior.getColumns();
                Object.keys(calculators).forEach(function(key) {
                    if (!columns.find(function(column) { return column.properties.calculator === calculators[key]; })) {
                        delete calculators[key];
                    }
                });
            }
            calculators.toJSON = stringifyFunctions;
        }

        // Temporarily copy the given headerify function for access by columns getter
        this.headerify = options.headerify;

        var json = JSON.stringify(properties, function(key, value) {
            if (this === properties && options.blacklist.indexOf(key) >= 0) {
                value = undefined; // JSON.stringify ignores undefined props
            } else if (key === 'calculator') {
                if (calculators) {
                    // convert function reference to registry key
                    value = Object.keys(calculators).find(function(key) {
                        return calculators[key] === value;
                    });
                } else {
                    // registry may not exist if Column.calculator setter was used directly so just save as is
                    value = value.toString();
                }
            }
            return value;
        }, space);

        // Remove the temporary copy
        delete this.headerify;

        return json;
    },

    /**
     * @memberOf Hypergrid#
     * @returns {object} The initial mouse position on a mouse down event for cell editing or a drag operation.
     * @memberOf Hypergrid#
     */
    getMouseDown: function() {
        if (this.mouseDown.length) {
            return this.mouseDown[this.mouseDown.length - 1];
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Remove the last item from the mouse down stack.
     */
    popMouseDown: function() {
        var result;
        if (this.mouseDown.length) {
            result = this.mouseDown.pop();
        }
        return result;
    },

    /**
     * @memberOf Hypergrid#
     * @desc Empty out the mouse down stack.
     */
    clearMouseDown: function() {
        this.mouseDown = [new Point(-1, -1)];
        this.dragExtent = null;
    },

    /**
     * Set the mouse point that initiated a cell edit or drag operation.
     * @param {Point} point
     * @memberOf Hypergrid#
     */
    setMouseDown: function(point) {
        this.mouseDown.push(point);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Point} The extent point of the current drag selection rectangle.
     */
    getDragExtent: function() {
        return this.dragExtent;
    },

    /**
     * @memberOf Hypergrid#
     * @summary Set the extent point of the current drag selection operation.
     * @param {Point} point
     */
    setDragExtent: function(point) {
        this.dragExtent = point;
    },

    /**
     * @memberOf Hypergrid#
     * @desc This function is a callback from the HypergridRenderer sub-component. It is called after each paint of the canvas.
     */
    gridRenderedNotification: function() {
        if (this.cellEditor) {
            this.cellEditor.gridRenderedNotification();
        }

        // Grid render also calculates mix width for each column.
        // Check here to see if there was a change and if so immediately re-render
        // before end-of-thread so user sees only the results of the 2nd render.
        // Mostly important on first render after setData. Note that stack overflow
        // will not happen because this will only be called once per data change.
        if (this.checkColumnAutosizing()) {
            this.paintNow();
        }

        this.fireSyntheticGridRenderedEvent();
    },

    tickNotification: function() {
        this.fireSyntheticTickEvent();
    },

    /**
     * @memberOf Hypergrid#
     * @desc The grid has just been rendered, make sure the column widths are optimal.
     */
    checkColumnAutosizing: function() {
        var autoSized = this.behavior.checkColumnAutosizing(false);
        if (autoSized) {
            this.behaviorShapeChanged();
        }
        return autoSized;
    },

    /**
     * @memberOf Hypergrid#
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
     * @memberOf Hypergrid#
     * @returns {boolean} We have focus.
     */
    hasFocus: function() {
        return this.canvas.hasFocus();
    },

    /**
     * @memberOf Hypergrid#
     * @summary Set the Behavior (model) object for this grid control.
     * @desc This can be done dynamically.
     * @param {object} options - _(See {@link behaviors.JSON#setData}.)_
     * @param {Behavior} [options.behavior=behaviors.JSON] - The behavior (model) can be either a constructor or an instance.
     * @param {dataRowObject[]} [options.data] - _(See {@link behaviors.JSON#setData}.)_
     * @param {pipelineSchema} [options.pipeline] - New pipeline description.
     */
    setBehavior: function(options) {
        if (!this.behavior) {
            // If we get here it means:
            // 1. Called from constructor because behavior included in options object.
            // 2. Called from `setData` _and_ wasn't called explicitly since instantiation
            var Behavior = options.Behavior || behaviorJSON;
            this.behavior = new Behavior(this, options);
            this.initScrollbars();
            this.refreshProperties();
            this.behavior.reindex();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @summary Set the underlying datasource.
     * @desc This can be done dynamically.
     * @param {function|object[]} dataRows - May be:
     * * An array of congruent raw data objects.
     * * A function returning same.
     * @param {object} [options] - _(See {@link behaviors.JSON#setData}.)_
     */
    setData: function(dataRows, options) {
        // Call `setBehavior` here just in case not previously set by constructor _or_ explicitly since instantiation
        this.setBehavior({
            pipeline: this.options.pipeline
        });
        this.behavior.setData(dataRows, options);
        this.setInfo(dataRows.length ? '' : this.properties.noDataMessage);
        this.behavior.shapeChanged();
    },

    setInfo: function(messages) {
        this.renderer.setInfo(messages);
    },

    /**
     * @memberOf Behavior#
     */
    reindex: function() {
        if (paintLoopRunning.call(this)) {
            this.needsReindex = true;
        } else {
            this.behavior.reindex();
        }
        this.behaviorShapeChanged();
    },

    /**
     * @memberOf Hypergrid#
     * @summary _(See {@link Hypergrid.prototype#setData}.)_
     * @desc Binds the data and reshapes the grid (new column objects created)
     * @param {function|object[]} dataRows - May be:
     * * An array of congruent raw data objects.
     * * A function returning same.
     * @param {object} [options]
     */
    updateData: function(dataRows, options){
        this.deprecated('updateData(dataRows, options)', 'setData(dataRows, options)', 'v1.2.10', arguments,
            'To update data without changing column definitions, call setData _without a schema._');
    },

    /**
     * @memberOf Hypergrid#
     * @param {object} [pipelines] - New pipeline description. _(See {@link dataModels.JSON#setPipeline}.)_
     * @param {object} [options] - _(See {@link dataModels.JSON#setPipeline}.)_
     */
    setPipeline: function(DataSources, options){
        this.behavior.setPipeline(DataSources, options);
    },

    /**
     * @memberOf Hypergrid#
     * @desc I've been notified that the behavior has changed.
     */
    behaviorChanged: function() {
        if (this.divCanvas) {
            if (this.numColumns !== this.getColumnCount() || this.numRows !== this.getRowCount()) {
                this.numColumns = this.getColumnCount();
                this.numRows = this.getRowCount();
                this.behaviorShapeChanged();
            } else {
                this.behaviorStateChanged();
            }
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    behaviorShapeChanged: function() {
        if (paintLoopRunning.call(this)) {
            this.needsShapeChanged = true;
            this.canvas.requestRepaint();
        } else if (this.divCanvas) {
            this.synchronizeScrollingBoundaries(); // calls computeCellsBounds
            this.repaint();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    behaviorStateChanged: function() {
        if (paintLoopRunning.call(this)) {
            this.needsStateChanged = true;
            this.canvas.requestRepaint();
        } else if (this.divCanvas) {
            this.computeCellsBounds();
            this.repaint();
        }
    },

    /**
     * Called from renderer/index.js
     */
    deferredBehaviorChange: function() {
        if (this.needsReindex) {
            this.behavior.reindex();
            this.needsReindex = false;
        }

        if (this.needsShapeChanged) {
            if (this.divCanvas) {
                this.synchronizeScrollingBoundaries(); // calls computeCellsBounds
            }
        } else if (this.needsStateChanged) {
            if (this.divCanvas) {
                this.computeCellsBounds();
            }
        }

        this.needsShapeChanged = this.needsStateChanged = false;
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Rectangle} My bounds.
     */
    getBounds: function() {
        return this.renderer.getBounds();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {string} The value of a lnf property.
     * @param {string} key - A look-and-feel key.
     */
    resolveProperty: function(key) {
        // todo: when we remove this method, also remove forwards from Behavior.js and Renderer.js
        this.deprecated('resolveProperty', '.resolveProperty(key) deprecated as of v1.2.0 in favor of .properties dereferenced by [key]. (Will be removed in a future version.)');
        return this.properties[key];
    },

    repaint: function() {
        var canvas = this.canvas;
        if (canvas) {
            if (this.properties.repaintImmediately) {
                canvas.paintNow();
            } else {
                canvas.repaint();
            }
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Paint immediately in this microtask.
     */
    paintNow: function() {
        this.canvas.paintNow();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} In HiDPI mode (has an attribute as such).
     */
    useHiDPI: function() {
        return this.deprecated('useHiDPI()', 'properties.useHiDPI', 'v1.2.10');
    },

    /**
     * @memberOf Hypergrid#
     * @summary Set the container for a grid instance
     * @private
     */
    setContainer: function(div) {
        this.initContainer(div);
        this.initRenderer();
        // injectGridElements.call(this);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Initialize container
     * @private
     */
    initContainer: function(div) {
        if (typeof div === 'string') {
            div = document.querySelector(div);
        }

        //Default Position and height to ensure DnD works
        if (!div.style.position) {
            div.style.position = null; // revert to stylesheet value
        }

        if (div.clientHeight < 1) {
            div.style.height = null; // revert to stylesheet value
        }

        injectCSS('grid');

        //prevent the default context menu for appearing
        div.oncontextmenu = function(event) {
            event.stopPropagation();
            event.preventDefault();
            return false;
        };

        div.removeAttribute('tabindex');

        div.classList.add('hypergrid-container');
        div.id = div.id || 'hypergrid' + (document.querySelectorAll('.hypergrid-container').length - 1 || '');

        this.div = div;
    },

    /**
     * @memberOf Hypergrid#
     * @summary Initialize drawing surface.
     * @private
     */
    initCanvas: function() {
        if (!this.divCanvas) {
            var divCanvas = document.createElement('div');

            setStyles(divCanvas, this.options.margin, EDGE_STYLES);

            this.div.appendChild(divCanvas);

            var canvas = new Canvas(divCanvas, this.renderer, this.options.canvas);
            canvas.canvas.classList.add('hypergrid');

            this.divCanvas = divCanvas;
            this.canvas = canvas;

            this.delegateCanvasEvents();
        }
    },

    convertViewPointToDataPoint: function(unscrolled) {
        return this.behavior.convertViewPointToDataPoint(unscrolled);
    },

    convertDataPointToViewPoint: function(dataPoint) {
        return this.behavior.convertDataPointToViewPoint(dataPoint);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Switch the cursor for a grid instance.
     * @param {string|string[]} cursorName - A well know cursor name.
     * @see [cursor names](http://www.javascripter.net/faq/stylesc.htm)
     */
    beCursor: function(cursorName) {
        if (!cursorName) {
            cursorName = ['default'];
        } else if (!Array.isArray(cursorName)) {
            cursorName = [cursorName];
        }
        cursorName.forEach(function(name) { this.cursor = name; }, this.div.style);
    },

    /**
     * @summary Shut down the current cell editor and save the edited value.
     * @returns {boolean} One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     * @memberOf Hypergrid#
     */
    stopEditing: function() {
        return !this.cellEditor || this.cellEditor.stopEditing();
    },

    /**
     * @summary Shut down the current cell editor without saving the edited val
     * @returns {boolean} One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     * @memberOf Hypergrid#
     */
    cancelEditing: function() {
        return !this.cellEditor || this.cellEditor.cancelEditing();
    },

    /**
     * @summary Give cell editor opportunity to cancel (or something) instead of stop .
     * @returns {boolean} One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     * @memberOf Hypergrid#
     */
    abortEditing: function() {
        return !this.cellEditor || (
            this.cellEditor.abortEditing ? this.cellEditor.abortEditing() : this.cellEditor.stopEditing()
        );
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Rectangle} The pixel coordinates of just the center 'main" data area.
     */
    getDataBounds: function() {
        var b = this.canvas.bounds;
        return new Rectangle(0, 0, b.origin.x + b.extent.x, b.origin.y + b.extent.y);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Canvas} Our fin-canvas instance.
     */
    getCanvas: function() {
        return this.deprecated('getCanvas()', 'canvas', '1.2.2');
    },

    /**
     * @memberOf Hypergrid#
     * @summary Open the cell-editor for the cell at the given coordinates.
     * @param {CellEvent} event - Coordinates of "edit point" (gridCell.x, dataCell.y).
     * @return {undefined|CellEditor} The cellEditor determined from the cell's render properties, which may be modified by logic added by overriding {@link DataModel#getCellEditorAt|getCellEditorAt}.
     */
    editAt: function(event) {
        var cellEditor;

        if (arguments.length === 2) {
            return this.deprecated('editAt(cellEditor, event)', 'editAt(event)', '1.0.6', arguments);
        }

        this.abortEditing(); // if another editor is open, close it first

        if (
            event.isDataColumn &&
            event.properties[event.isDataRow ? 'editable' : 'filterable'] &&
            (cellEditor = this.getCellEditorAt(event))
        ) {
            cellEditor.beginEditing();
        }

        return cellEditor;
    },

    /**
     * @memberOf Hypergrid#
     * @param {number} columnIndex - The column index in question.
     * @returns {boolean} The given column is fully visible.
     */
    isColumnVisible: function(columnIndex) {
        return this.renderer.isColumnVisible(columnIndex);
    },

    /**
     * @memberOf Hypergrid#
     * @param {number} r - The raw row index in question.
     * @returns {boolean} The given row is fully visible.
     */
    isDataRowVisible: function(r) {
        return this.renderer.isDataRowVisible(r);
    },

    /**
     * @memberOf Hypergrid#
     * @param {number} c - The column index in question.
     * @param {number} rn - The grid row index in question.
     * @returns {boolean} The given cell is fully is visible.
     */
    isDataVisible: function(c, rn) {
        return this.isDataRowVisible(rn) && this.isColumnVisible(c);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll in the `offsetX` direction if column index `colIndex` is not visible.
     * @param {number} colIndex - The column index in question.
     * @param {number} offsetX - The direction and magnitude to scroll if we need to.
     * @return {boolean} Column is visible.
     */
    insureModelColIsVisible: function(colIndex, offsetX) {
        var maxCols = this.getColumnCount() - 1, // -1 excludes partially visible columns
            indexToCheck = colIndex + Math.sign(offsetX),
            visible = !this.isColumnVisible(indexToCheck) || colIndex === maxCols;

        if (visible) {
            //the scroll position is the leftmost column
            this.scrollBy(offsetX, 0);
        }

        return visible;
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll in the `offsetY` direction if column index c is not visible.
     * @param {number} rowIndex - The column index in question.
     * @param {number} offsetX - The direction and magnitude to scroll if we need to.
     * @return {boolean} Row is visible.
     */
    insureModelRowIsVisible: function(rowIndex, offsetY) {
        var maxRows = this.getRowCount() - 1, // -1 excludes partially visible rows
            scrollOffset = (offsetY > -1) ? 1 : 0, // 1 to keep one blank line below active cell, 0 to keep zero lines above active cell
            indexToCheck = rowIndex + scrollOffset,
            visible = !this.isDataRowVisible(indexToCheck) || rowIndex === maxRows;

        if (visible) {
            //the scroll position is the topmost row
            this.scrollBy(0, offsetY);
        }

        return visible;
    },

    /**
     * @memberOf Hypergrid#
     * @summary Answer which data cell is under a pixel value mouse point.
     * @param {mousePoint} mouse - The mouse point to interrogate.
     */

    getGridCellFromMousePoint: function(mouse) {
        return this.renderer.getGridCellFromMousePoint(mouse);
    },

    /**
     * @param {Point} gridCell - The pixel location of the mouse in physical grid coordinates.
     * @returns {Rectangle} The pixel based bounds rectangle given a data cell point.
     * @memberOf Hypergrid#
     */
    getBoundsOfCell: function(gridCell) {
        var b = this.renderer.getBoundsOfCell(gridCell.x, gridCell.y);

        //convert to a proper rectangle
        return new Rectangle(b.x, b.y, b.width, b.height);
    },

    /**
     * @memberOf Hypergrid#
     * @desc This is called by the fin-canvas when a resize occurs.
     */
    resized: function() {
        this.behaviorShapeChanged();
    },

    /**
     * @memberOf Hypergrid#
     * @summary A click event occurred.
     * @desc Determine the cell and delegate to the behavior (model).
     * @param {MouseEvent} event - The mouse event to interrogate.
     * @returns {boolean|undefined} Changed. Specifically, one of:
     * * `undefined` row had no drill-down control
     * * `true` drill-down changed
     * * `false` drill-down unchanged (was already in requested state)
     */
    cellClicked: function(event) {
        var result = this.behavior.cellClicked(event);

        if (result !== undefined) {
            this.behavior.changed();
        }

        return result;
    },

    /**
     * To intercept link clicks, override this method (either on the prototype to apply to all grid instances or on an instance to apply to a specific grid instance).
     * @memberOf Hypergrid#
     */
    windowOpen: function(url, name, features, replace) {
        return window.open.apply(window, arguments);
    },

    /**
     * @param {number} [begin]
     * @param {nubmer} [end]
     * * @returns {Column[]} A copy of the all columns array by passing the params to `Array.prototype.slice`.
     */
    getColumns: function(begin, end) {
        var columns = this.behavior.getColumns();
        return columns.slice.apply(columns, arguments);
    },

    /**
     * @param {number} [begin]
     * @param {nubmer} [end]
     * * @returns {Column[]} A copy of the active columns array by passing the params to `Array.prototype.slice`.
     */
    getActiveColumns: function(begin, end) {
        var columns = this.behavior.getActiveColumns();
        return columns.slice.apply(columns, arguments);
    },

    getHiddenColumns: function(){
        //A non in-memory behavior will be more troublesome
        return this.behavior.getHiddenColumns();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Request input focus.
     */
    takeFocus: function() {
        var wasCellEditor = this.cellEditor;
        this.stopEditing();
        if (!wasCellEditor) {
            this.canvas.takeFocus();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Request focus for our cell editor.
     */
    editorTakeFocus: function() {
        if (this.cellEditor) {
            return this.cellEditor.takeFocus();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @summary Get data value at given cell.
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     */
    getValue: function(x, y) {
        return this.behavior.getValue.apply(this.behavior, arguments); // must use .apply (see this.behavior.getValue)
    },

    /**
     * @memberOf Hypergrid#
     * @summary Set a data value of a given cell.
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     * @param {*} value - New cell value.
     */
    setValue: function(x, y, value) {
        this.behavior.setValue.apply(this.behavior, arguments); // must use .apply (see this.behavior.setValue)
    },

    /**
     * @memberOf Hypergrid#
     * @desc Note that "viewable rows" includes any partially viewable rows.
     * @returns {number} The number of viewable rows.
     */
    getVisibleRows: function() {
        return this.renderer.getVisibleRows();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Note that "viewable columns" includes any partially viewable columns.
     * @returns {number} The number of viewable columns.
     */
    getVisibleColumns: function() {
        return this.renderer.getVisibleColumns();
    },

    /**
     * @memberOf Hypergrid#
     * @summary Initialize the renderer sub-component.
     */
    initRenderer: function() {
        this.renderer = this.renderer || new Renderer(this);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The width of the given column.
     * @param {number} columnIndex - The untranslated column index.
     */
    getColumnWidth: function(columnIndex) {
        return this.behavior.getColumnWidth(columnIndex);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Set the width of the given column.
     * @param {number} columnIndex - The untranslated column index.
     * @param {number} columnWidth - The width in pixels.
     */
    setColumnWidth: function(columnIndex, columnWidth) {
        if (this.abortEditing()) {
            this.behavior.setColumnWidth(columnIndex, columnWidth);
        }
    },

    getColumnEdge: function(c) {
        return this.behavior.getColumnEdge(c, this.getRenderer());
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The total width of all the fixed columns.
     */
    getFixedColumnsWidth: function() {
        return this.behavior.getFixedColumnsWidth();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The height of the given row
     * @param {number} rowIndex - The untranslated fixed column index.
     */
    getRowHeight: function(rowIndex, dataModel) {
        return this.behavior.getRowHeight(rowIndex, dataModel);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Set the height of the given row.
     * @param {number} rowIndex - The row index.
     * @param {number} rowHeight - The width in pixels.
     */
    setRowHeight: function(rowIndex, rowHeight, dataModel) {
        if (this.abortEditing()) {
            this.behavior.setRowHeight(rowIndex, rowHeight, dataModel);
        }
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The total fixed rows height
     */
    getFixedRowsHeight: function() {
        return this.behavior.getFixedRowsHeight();
    },

    /**
     * Number of _visible_ columns.
     * @memberOf Hypergrid#
     * @returns {number} The number of columns.
     */
    getColumnCount: function() {
        return this.behavior.getActiveColumnCount();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The number of rows.
     */
    getRowCount: function() {
        return this.behavior.getRowCount();
    },

    getUnfilteredRowCount: function() {
        return this.deprecated('getUnfilteredRowCount()', '', '1.2.0', arguments, 'No longer supported');
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The number of fixed columns.
     */
    getFixedColumnCount: function() {
        return this.behavior.getFixedColumnCount();
    },

    /**
     * @memberOf Hypergrid#
     * @returns The number of fixed rows.
     */
    getFixedRowCount: function() {
        return this.behavior.getFixedRowCount();
    },

    /**
     * @memberOf Hypergrid#
     * @summary The top left area has been clicked on
     * @desc Delegates to the behavior.
     * @param {event} mouse - The event details.
     */
    topLeftClicked: function(mouse) {
        this.behavior.topLeftClicked(this, mouse);
    },

    /**
     * @memberOf Hypergrid#
     * @summary A fixed row has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    rowHeaderClicked: function(mouse) {
        this.behavior.rowHeaderClicked(this, mouse);
    },

    /**
     * @memberOf Hypergrid#
     * @summary A fixed column has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    columnHeaderClicked: function(mouse) {
        this.behavior.columnHeaderClicked(this, mouse);
    },

    /**
     * @memberOf Hypergrid#
     * @desc An edit event has occurred. Activate the editor at the given coordinates.
     * @param {number} event.gridCell.x - The horizontal coordinate.
     * @param {number} event.gridCell.y - The vertical coordinate.
     * @param {boolean} [event.primitiveEvent.type]
     * @returns {undefined|CellEditor} The editor object or `undefined` if no editor or editor already open.
     */
    onEditorActivate: function(event) {
        return this.editAt(event);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Get the cell editor.
     * @desc Delegates to the behavior.
     * @returns The cell editor at the given coordinates.
     * @param {Point} cellEvent - The grid cell coordinates.
     */
    getCellEditorAt: function(event) {
        return this.behavior.getCellEditorAt(event);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Toggle HiDPI support.
     * @desc HiDPI support is now *on* by default.
     * > There used to be a bug in Chrome that caused severe slow down on bit blit of large images, so this HiDPI needed to be optional.
     */
    toggleHiDPI: function() {
        if (this.properties.useHiDPI) {
            this.removeAttribute('hidpi');
        } else {
            this.setAttribute('hidpi', null);
        }
        this.canvas.resize();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The HiDPI ratio.
     */
    getHiDPI: function(ctx) {
        if (window.devicePixelRatio && this.properties.useHiDPI) {
            var devicePixelRatio = window.devicePixelRatio || 1,
                backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio || 1,
                result = devicePixelRatio / backingStoreRatio;
        } else {
            result = 1;
        }
        return result;
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The width of the given (recently rendered) column.
     * @param {number} colIndex - The column index.
     */
    getRenderedWidth: function(colIndex) {
        return this.renderer.getRenderedWidth(colIndex);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The height of the given (recently rendered) row.
     * @param {number} rowIndex - The row index.
     */
    getRenderedHeight: function(rowIndex) {
        return this.renderer.getRenderedHeight(rowIndex);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Update the cursor under the hover cell.
     */
    updateCursor: function() {
        var cursor = this.behavior.getCursorAt(-1, -1);
        var hoverCell = this.hoverCell;
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
     * @memberOf Hypergrid#
     * @desc Repaint the given cell.
     * @param {x} x - The horizontal coordinate.
     * @param {y} y - The vertical coordinate.
     */
    repaintCell: function(x, y) {
        this.renderer.repaintCell(x, y);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} The user is currently dragging a column to reorder it.
     */
    isDraggingColumn: function() {
        return !!this.renderOverridesCache.dragger;
    },

    /**
     * @memberOf Hypergrid#
     * @returns {object[]} Objects with the values that were just rendered.
     */
    getRenderedData: function() {
        // assumes one row of headers
        var behavior = this.behavior,
            colCount = this.getColumnCount().length,
            rowCount = this.renderer.visibleRows.length,
            headers = new Array(colCount),
            results = new Array(rowCount),
            row;

        headers.forEach(function(header, c) {
            headers[c] = behavior.getActiveColumn(c).header;
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
     * @summary Autosize a column for best fit.
     * @param {Column|number} columnOrIndex - The column or active column index.
     * @memberOf Hypergrid#
     */
    autosizeColumn: function(columnOrIndex) {
        var column = columnOrIndex >= -2 ? this.behavior.getActiveColumn(columnOrIndex) : columnOrIndex;
        column.checkColumnAutosizing(true);
        this.computeCellsBounds();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Enable/disable if this component can receive the focus.
     * @param {boolean} - canReceiveFocus
     */
    setFocusable: function(canReceiveFocus) {
        this.canvas.setFocusable(canReceiveFocus);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The number of columns that were just rendered
     */
    getVisibleColumnsCount: function() {
        return this.renderer.getVisibleColumnsCount();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {number} The number of rows that were just rendered
     */
    getVisibleRowsCount: function() {
        return this.renderer.getVisibleRowsCount();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Update the size of a grid instance.
     */
    updateSize: function() {
        this.canvas.checksize();
    },


    /**
     * @memberOf Hypergrid#
     * @desc Stop the global repainting flag thread.
     */
    stopPaintThread: function() {
        this.canvas.stopPaintThread();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Stop the global resize check flag thread.
     */
    stopResizeThread: function() {
        this.canvas.stopResizeThread();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Restart the global resize check flag thread.
     */
    restartResizeThread: function() {
        this.canvas.restartResizeThread();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Restart the global repainting check flag thread.
     */
    restartPaintThread: function() {
        this.canvas.restartPaintThread();
    },

    swapColumns: function(source, target) {
        //Turns out this is called during dragged 'i.e' when the floater column is reshuffled
        //by the currently dragged column. The column positions are constantly reshuffled
        this.behavior.swapColumns(source, target);
    },

    endDragColumnNotification: function() {
        this.behavior.endDragColumnNotification();
    },

    getFixedColumnsMaxWidth: function() {
        return this.behavior.getFixedColumnsMaxWidth();
    },

    isMouseDownInHeaderArea: function() {
        var headerRowCount = this.getHeaderRowCount();
        var mouseDown = this.getMouseDown();
        return mouseDown.x < 0 || mouseDown.y < headerRowCount;
    },

    _getBoundsOfCell: function(x, y) {
        return this.deprecated('_getBoundsOfCell()', 'getBoundsOfCell()', '1.2.0', arguments);
    },

    /**
     * @param {index} x - Data x coordinate.
     * @return {Object} The properties for a specific column.
     * @memberOf Hypergrid#
     */
    getColumnProperties: function(x) {
        return this.behavior.getColumnProperties(x);
    },

    /**
     * @param {index} x - Data x coordinate.
     * @return {Object} The properties for a specific column.
     * @memberOf Hypergrid#
     */
    setColumnProperties: function(x, properties) {
        this.behavior.setColumnProperties(x, properties);
    },

    /**
     * Clears all cell properties of given column or of all columns.
     * @param {number} [x] - Omit for all columns.
     * @memberOf Behavior#
     */
    clearAllCellProperties: function(x) {
        this.behavior.clearAllCellProperties(x);
        this.renderer.resetAllCellPropertiesCaches();
    },

    isShowRowNumbers: function() {
        return this.deprecated('isShowRowNumbers()', 'properties.showRowNumbers', 'v1.2.10');
    },
    isEditable: function() {
        return this.deprecated('isEditable()', 'properties.editable', 'v1.2.10');
    },

    /**
     * @param {integerRowIndex|sectionPoint} rn
     * @returns {boolean}
     * @memberOf Hypergrid#
     */
    isGridRow: function(y) {
        return new this.behavior.CellEvent(0, y).isDataRow;
    },

    isShowHeaderRow: function() {
        return this.deprecated('isShowHeaderRow()', 'properties.showHeaderRow', 'v1.2.10');
    },

    /**
     * @returns {number} The total number of rows of all subgrids preceding the data subgrid.
     * @memberOf Hypergrid#
     */
    getHeaderRowCount: function() {
        return this.behavior.getHeaderRowCount();
    },

    /**
     * @returns {number} The total number of rows of all subgrids following the data subgrid.
     * @memberOf Hypergrid#
     */
    getFooterRowCount: function() {
        return this.behavior.getFooterRowCount();
    },

    /**
     * @returns {number} The total number of logical rows of all subgrids.
     * @memberOf Hypergrid#
     */
    getLogicalRowCount: function() {
        return this.behavior.getLogicalRowCount();
    },

    isShowFilterRow: function() {
        return this.deprecated('isShowFilterRow()', 'properties.showFilterRow', 'v1.2.10');
    },

    hasTreeColumn: function() {
        return this.behavior.hasTreeColumn();
    },
    isHierarchyColumn: function(x) {
        return this.deprecated('isHierarchyColumn(x)', '', 'v1.3.3');
    },
    isRowNumberAutosizing: function() {
        return this.deprecated('isRowNumberAutosizing()', 'properties.rowNumberAutosizing', 'v1.2.10');
    },
    lookupFeature: function(key) {
        return this.behavior.lookupFeature(key);
    },
    getRow: function(y) {
        return this.behavior.getRow(y);
    },

    isColumnAutosizing: function() {
        return this.deprecated('isColumnAutosizing()', 'columnAutosizing', 'v1.2.2', arguments, 'Note however that as of v1.2.2 columnAutosizing grid property no longer has the global meaning it had previously and should no longer be referred to directly. Refer to each column\'s `columnAutosizing` property instead.');
    },

    newPoint: function(x, y) {
        return new Point(x, y);
    },
    newRectangle: function(x, y, width, height) {
        return new Rectangle(x, y, width, height);
    },

    /**
     * @summary Get the given data controller.
     * @param {string} type
     * @returns {null|undefined|*} The data controller or:
     * * `null` means unknown data controller.
     * * `undefined` means the data source handles this data controller but the data controller is undefined.
     * @memberOf Hypergrid#
     */
    getController: function(type) {
        return this.behavior.getController(type);
    },

    /**
     * @summary Set the given data controller(s).
     * @desc The data model needs to be able to accept the specified data controller type(s). If it fails to accept the specified data controller(s), an error condition is raised.
     *
     * (To ignore the error, place the call in a `try...catch`. From there you could call {@link Base#notify|notify} to report it as a warning or an alert instead.)
     *
     * Setting data controller(s) triggers a shape change.
     * @param {string} typeOrHashOfTypes - One of:
     * * **object** - Hash of multiple data controllers, by type.
     * * **string** - Type of the single data controller given in `controller`.
     * @param {dataControlInterface} [controller] - Only required when 'hash' is a string; omit when `hash` is an object.
     * @returns {object} - Hash of all results, by type. Each member will be:
     * * The given data controller for that type when defined.
     * * A new "null" data controller, generated by the data model when the given data controller for that type was `undefined`.
     * * `undefined` - The data controller was unknown to the data model.
     * @memberOf Hypergrid#
     */
    setController: function(typeOrHashOfTypes, controller) {
        var results = this.behavior.setController(typeOrHashOfTypes, controller),
            rejections = Object.keys(results).filter(function(name) {
                return !results[name];
            }).toString();

        if (rejections) {
            throw 'Unexpected data controller(s): ' + rejections;
        }

        return results;
    },

    prop: function(type, columnIndex, keyOrHash, value) {
        return this.behavior.prop.apply(this.behavior, arguments);
    },

    get charMap() {
        return this.behavior.charMap;
    },
});


function paintLoopRunning() {
    return !this.properties.repaintImmediately && this.canvas.paintLoopRunning();
}


/**
 * Creates an instance variable backer for use by the getters and setters described in {@link dynamicPropertyDescriptors}.
 * @constructor
 * @memberOf Hypergrid~
 * @private
 */
function Var() {
    this.gridRenderer = defaults.gridRenderer;
    this.rowHeaderCheckboxes = defaults.rowHeaderCheckboxes;
    this.rowHeaderNumbers = defaults.rowHeaderNumbers;
    this.gridBorder = defaults.gridBorder;
    this.gridBorderTop = defaults.gridBorderTop;
    this.gridBorderRight = defaults.gridBorderRight;
    this.gridBorderBottom = defaults.gridBorderBottom;
    this.gridBorderLeft = defaults.gridBorderLeft;
}

function findOrCreateContainer(boundingRect) {
    var div = document.getElementById('hypergrid'),
        used = div && !div.firstElementChild;

    if (!used) {
        div = document.createElement('div');
        setStyles(div, boundingRect, RECT_STYLES);
        document.body.appendChild(div);
    }

    return div;
}

function setStyles(el, style, keys) {
    if (style) {
        var elStyle = el.style;
        keys.forEach(function(key) {
            if (style[key] !== undefined) {
                elStyle[key] = style[key];
            }
        });
    }
}

function stringifyFunctions() {
    var self = this;
    return Object.keys(this).reduce(function(obj, key) {
        if (key !== 'toJSON') {
            obj[key] = /^function /.test(key)
                ? null // anon func: no point in saving because key itself is already the stringified function
                : self[key].toString() // stringify the function
                    .replace(/^function anonymous\(/, 'function(') // clean up Chromium artifact
                    .replace('\n/*``*/)', ')'); // clean up Chromium artifact
        }
        return obj;
    }, {});
}

function clone(value) {
    if (Array.isArray(value)) {
        return value.slice(); // clone array
    } else if (typeof value === 'object') {
        return Object.defineProperties({}, Object.getOwnPropertyDescriptors(value));
    } else {
        return value;
    }
}

function deepClone(object) {
    var result = clone(object);
    Object.keys(result).forEach(function(key) {
        var descriptor = Object.getOwnPropertyDescriptor(result, key);
        if (typeof descriptor.value === 'object') {
            result[key] = deepClone(descriptor.value);
        }
    });
    return result;
}

function createCellEditor(name, props) {
    var CellEditor = cellEditors.get(name);
    if (CellEditor) {
        return new CellEditor(this, props);
    }
}

/**
 * @name plugins
 * @memberOf Hypergrid
 * @type {object}
 * @summary Hash of references to shared plug-ins.
 * @desc Dictionary of shared (pre-installed) plug-ins. Used internally, primarily to avoid reinstallations. See examples for how to reference (albeit there is normally no need to reference plugins directly).
 *
 * For the dictionary of _instance_ plugins, see {@link Hypergrid#plugins|plugins} (defined in the {@link Hypergrid#intialize|Hypergrid constructor}).
 *
 * To force reinstallation of a shared plugin delete it first:
 * ```javascript
 * delete Hypergrid.plugins.mySharedPlugin;
 * ```
 * To force reinstallation of all shared plugins:
 * ```javascript
 * Hypergrid.plugins = {};
 * ```
 * @example
 * var allSharedPlugins = Hypergrid.plugins;
 * var mySharedPlugin = Hypergrid.plugins.mySharedPlugin;
 */
Hypergrid.plugins = {};

/**
 * @name localization
 * @memberOf Hypergrid
 * @type {object}
 * @summary Shared localization defaults for all grid instances.
 * @desc These property values are overridden by those supplied in the `Hypergrid` constructor's `options.localization`.
 * @property {string|string[]} [locale] - The default locale to use when an explicit `locale` is omitted from localizer constructor calls. Passed to Intl.NumberFormat` and `Intl.DateFormat`. See {@ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation|Locale identification and negotiation} for more information. Omitting will use the runtime's local language and region.
 * @property {object} [numberOptions] - Options passed to `Intl.NumberFormat` for creating the basic "number" localizer.
 * @property {object} [dateOptions] - Options passed to `Intl.DateFormat` for creating the basic "date" localizer.
 */
Hypergrid.localization = {
    locale: 'en-US',
    numberOptions: { maximumFractionDigits: 0 }
};


Hypergrid.prototype.setController.onerror = 'warn';

Hypergrid.mixIn = Hypergrid.prototype.mixIn;

Hypergrid.prototype.mixIn(require('./lib/events'));
Hypergrid.prototype.mixIn(require('./lib/selection'));
Hypergrid.prototype.mixIn(require('./lib/scrolling').mixin);

Hypergrid.prototype.mixIn(themes.mixin);
Hypergrid.mixIn(themes.sharedMixin);

/**
 * @summary List of grid instances.
 * @desc Added in {@link Hypergrid constructor}; removed in {@link Hypergrid#terminate terminate()}.
 * Used in themes.js.
 * @type {Hypergrid[]}
 */
Hypergrid.grids = [];

/** @name defaults
 * @memberOf Hypergrid
 * @type {object}
 * @summary The `defaults` layer of the Hypergrid properties hierarchy.
 * @desc Default values for all Hypergrid properties, including grid-level properties and column property defaults.
 *
 * Properties are divided broadly into two categories:
 * * Style (a.k.a. "lnf" for "look'n'feel") properties
 * * All other properties.
 */
Hypergrid.defaults = defaults;

/** @name properties
 * @memberOf Hypergrid[
 * @type {object}
 * @summary Synonym for {@link Hypergrid.defaults}.
 */
Hypergrid.properties = defaults;

/** @name dataModels
 * @memberOf Hypergrid
 * @type {object}
 * @summary Registry of data models.
 * @see {@link dataModels}
 */
Hypergrid.dataModels = require('./dataModels');

Hypergrid.modules = require('./lib/modules');


module.exports = Hypergrid;
