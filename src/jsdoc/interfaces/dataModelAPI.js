/**
 * @interface dataModelAPI
 * @summary Hypergrid 3 data model API.
 * @desc Hypergrid 3 data models have a minimal _required interface,_ as outlined below.
 *
 * ### TL;DR
 * The minimum interface is an object with three methods, `getRowCount()`, `getSchema()`, and `getValue(x, y)`.
 *
 * ### Interface
 * Data model interface requirements fall into the following categories
 * * Required API methods
 * * Optional API methods with default implementations
 * * Optional API without default implementations
 * * Proposed API
 * * Utility methods
 * * Error object
 *
 * #### Required API methods
 *
 * These methods are required to be implemented by all data models:
 *
 * _Click the links for API details:_
 * * {@link dataModelAPI#getRowCount getRowCount()}
 * * {@link dataModelAPI#getSchema getSchema()}
 * * {@link dataModelAPI#getValue getValue(x, y)}
 *
 * #### Optional API methods with default implementations
 *
 * The following API methods are optional. When the data model an application is using does not implement these natively, the applicaiton can implement them in a subclass of that data model.
 *
 * Failing this, Hypergrid injects "fallbacks" (default implementations) into the data model for all missing methods. Some of these merely fail silently, but most do something useful (though not necessarily smart or efficient).
 *
 * Another option for the application is to override these injected default implementations at run-time by assigning new definitions. This is functionally equivalent to subclassing the data model (as recommended above). That approach, however, can sometimes feel a bit heavy when, for example, the need is to override just a single method (such as `getCell`).
 *
 * _Click the links for API details:_
 * * {@link dataModelAPI#apply apply()} — Fails silently.
 * * {@link dataModelAPI#click click()} — Fails silently.
 * * {@link dataModelAPI#getCell getCell(config, rendererName)} — Overridable.
 * * {@link dataModelAPI#getCellEditorAt getCellEditorAt(columnIndex, rowIndex, editorName, cellEvent)} — Overridable.
 * * {@link dataModelAPI#getColumnCount getColumnCount()}
 * * {@link dataModelAPI#getData getData(metaDataFieldName)}
 * * {@link dataModelAPI#getMetadataStore getMetadataStore()}
 * * {@link dataModelAPI#getRowIndex getRowIndex(y)}
 * * {@link dataModelAPI#getRow getRow(y)}
 * * {@link dataModelAPI#getRowMetadata getRowMetadata(y, newRowMetadata)}
 * * {@link dataModelAPI#isDrillDown isDrillDown()} — Fails silently.
 * * {@link dataModelAPI#setMetadataStore setMetadataStore()}
 * * {@link dataModelAPI#setRowMetadata setRowMetadata(y, newRowMetadata)}
 *
 * `getCell` and `getCellEditorAt` require some special explanation: These are hooks called by Hypergrid at cell render time and cell edit time, respectively. The concerns of these methods have much less to do with the data model than they have to do with application logic. Nevertheless, they are historically situated on the data model, and are called with the data model as their execution context. They may be implemented on a data model, but this is rare and they are more typically overridden at run-time — which is why they are annotated above as "overridable" (although all methods are technically overridable).
 *
 * #### Optional API without default implementations
 *
 * The following API methods are optional. Hypergrid does _not_ inject fallbacks for these. If your application wants to call these directly, you must implement them. Note in the following the circumstances under which Hypergrid will call them:
 *
 * _Click the links for API details:_
 * * {@link dataModelAPI#setData setData(newData)}<br>
 *     Called by Hypergrid when the application specifies the `data` option.*
 * * {@link dataModelAPI#setSchema setSchema(newSchema)}<br>
 *     Called by Hypergrid when the application specifies the `schema` option.* (Invoking the `behavior.schema` setter also calls `setSchema`.)
 * * {@link dataModelAPI#setValue setValue(x, y, value)}<br>
 *     Called by Hypergrid when the user edits a cell. To prevent Hypergrid from calling this method, make all cells non-editable ({@link module:defaults.editable grid.properties.editable = false}).
 *
 * _\* These options are accepted by the `Hypergrid()` constructor, `grid.setData()`, and `behavior.setData()`._
 *
 * #### Proposed API
 *
 * _Click the links for proposed API details:_
 * * {@link dataModelAPI#addRow addRow(y=Infinity, dataRow)}
 * * {@link dataModelAPI#delRow delRow(y, rowCount=1)}
 * * {@link dataModelAPI#setRow setRow(y, dataRow=null)}
 *
 * #### Utility methods
 *
 * * {@link dataModelAPI#install install(api, options)}
 * * {@link dataModelAPI#addListener addListener(fn)}
 * * {@link dataModelAPI#removeListener removeListener(fn)}
 * * {@link dataModelAPI#dispatchEvent dispatchEvent(event)}
 * * {@link dataModelAPI#drillDownCharMap drillDownCharMap}
 *
 * #### `Error` object
 *
 * The following subclass of `Error` is available to data models when they need to throw an error:
 *
 * * {@link dataModelAPI#DataModelError DataModelError(message)}
 *
 * This helps identify the error as coming from the data model and not from Hypergrid (which uses its own `HypergridError`) or the application.
 *
 * #### Data events
 *
 * Hypergrid listens for the following events, which may be triggered from a data model using the {@link dataModelAPI#dispatchEvent dispatchEvent} method injected into data models by Hypergrid.
 *
 * On receipt, Hypergrid performs some internal actions before triggering grid event (actually on the grid's canvas element) with a similar event string (but with the addition of a `fin-` prefix). So for example, on receipt of the `data-changed` event from the data model, Hypergrid triggers `fin-data-changed` on the grid, which applications can listen for using {@link Hypergrid#addEventListener grid.addEventListener('fin-data-changed', handlerFunction)}.
 *
 * * {@link dataModelAPI#event:data-schema-changed data-schema-changed}
 * * {@link dataModelAPI#event:data-changed data-changed}
 * * {@link dataModelAPI#event:data-shape-changed data-shape-changed}
 * * {@link dataModelAPI#event:data-prereindex data-prereindex}
 * * {@link dataModelAPI#event:data-postreindex data-postreindex}
 *
 * #### Example
 *
 * The following is a custom data model with its own data and a minimum implementation.
```javascript
var data = [
     { symbol: 'APPL', name: 'Apple Inc.',                           prevclose:  93.13 },
     { symbol: 'MSFT', name: 'Microsoft Corporation',                prevclose:  51.91 },
     { symbol: 'TSLA', name: 'Tesla Motors Inc.',                    prevclose: 196.40 },
     { symbol: 'IBM',  name: 'International Business Machines Corp', prevclose: 155.35 }
 ];

 var schema = ['symbol', 'name', 'prevclose']; // or: `Object.keys(data)` although order not guaranteed

 dataModel = {
    getSchema: function() {
        if (!this.schema) {
            this.schema = schema;
            this.dispatchEvent('data-schema-changed');
        }
        return this.schema;
    },
    getValue: function(x, y) {
        return data[y][this.schema[x].name];
    },
    getRowCount: function() {
       return data.length;
    }
};
```
 * This simple example is a plain object namespace.
 *
 * #### Data model base class
 *
 * Although not a requirement, data models are more typically class instances, typically _extending_ from {@link https://github.com/fin-hypergrid/datasaur-base `datasaur-base`}. (The term "extending" refers to JavaScript prototypal inheritance, meaning that `datasaur-base` can be found at the end of the data model's prototype chain — typically the data model's prototype's prototype, although there could be additional prototypes inbetween.).
 *
 * Subclassing `datasaur-base` (also _not a requirement_) provides the following:
 * * Supports _flat_ or _concatenated_ (aka _stacked_) data model structures
 * * Implements utility methods (see below)
 * * Implements {@link dataModelAPI#DataModelError DataModelError} (subclass of {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error `Error`})
 *
 * If your data model does not subclass `datasaur-base` and…
 * * …does not implement `install`:
 *    * Hypergrid injects a rudimentary `install` method
 * * …does not implement `addListener`:
 *    * Hypergrid injects a `dispatchEvent` method bound to the grid instance
 *
 * There are many ways to "extend" a class do this. For instance, to "extend" the above example:
```javascript
Object.setPrototypeOf(dataModel, DatasaurBase.prototype);
```
 * Or, for a hypothetical `DataModel` constructor:
```javascript
Object.setPrototypeOf(DataModel.prototype, DatasaurBase.prototype);
```
 * But the usual practice is to use `DatasaurBase.extend`. For example, `DataSourcelLocal`, the default data model that comes with Hypergrid, [does this](https://github.com/fin-hypergrid/datasaur-local/blob/master/index.js#L24). `DatasaurBase` supports "stacked" data models (with multi-stage data transformations). It also includes an implementation of the `install` utility method.
 *
 * Because extending from `DatasaurBase` is not a requirement (just so long as the data model implements the required interface), a rudimentary version of `install` is injected into custom data models when they lack an implementation of their own.
 *
 * `DatasaurBase` can be found in the [`datasaur-base`] module.
 */

/** @typedef {object} columnSchema
 * @property {string} name
 * @property {string} [header=name]
 * @property {number} index
 * @property {string} [type]
 * @property {string} [calculator]
 */

/** @typedef {columnSchema|string} rawColumnSchema
 * Column schema may be expressed as a string primitive on input to {@link dataModelAPI#setData setData}.
 */

/** @typedef {object} dataRowObject
 * @desc A data row representation.
 * The properties of this object are the data fields.
 * The property keys are the column names.
 * All row objects should be congruent, meaning that each data row should have the same property keys.
 */

/** @typedef {object} DataModelEvent
 * Besides `type`, your event object can contain other event details.
 *
 * After calling the internal handler found in [src/behaviors/Local/events.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/events.js) matching the event name, Hypergrid then creates a {@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent `CustomEvent`} with the same name, sets its `detail` property to this object, and dispatches to the `<canvas>` element — to be picked up by any listeners previously attached with {@link Hypergrid#addEventListener}.
 * @param {object} event
 * @param {string} event.type - Event string (name).
 */

/** @typedef {function} DataModelListener
 * @this {Hypergrid}
 * @param {DataModelEvent} event
 */

/**
 * @method dataModelAPI#addListener
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link dataModelAPI#dispatchEvent dispatchEvent}, {@link dataModelAPI#removeListener removeListener}, and {@link dataModelAPI#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
 *
 * Hypergrid calls this method subscribe to data model events. The data model calls its own implementation of `dispatchEvent` to publish events to subscribers.
 *
 * Both the `addListener` polyfill as well as `datasaur-base`'s implementation service multiple listeners for the use case of multiple grid instances all using the same data model instance. To support this use case, your data model should service multiple listeners as well. (Doing so also lets the application add its own listener(s) to the data model.)
 *
 * @param {DataModelListener} handler - A reference to a function bound to a grid instance. The function is called whenever the data model calls its {@link dataModelAPI#dispatchEvent} method. The handler thus receives all data model events (in `event.type).
 */

/**
 * @method dataModelAPI#removeListener
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link dataModelAPI#addListener addListener}, {@link dataModelAPI#dispatchEvent dispatchEvent}, and {@link dataModelAPI#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
 *
 * Detaches the data model from a particular grid instance.
 *
 * This method is called by {@link Hypergrid#desctruct} to clean up memory.
 * Note: `destruct` is not called automatically by Hypergrid; applications must call it explicitly when disposing of a grid.
 *
 * @param {DataModelListener} handler - A reference to the handler originally provided to {@link dataModelAPI#addListener}.
 */

/**
 * @method dataModelAPI#removeAllListeners
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link dataModelAPI#addListener addListener}, {@link dataModelAPI#dispatchEvent dispatchEvent}, and {@link dataModelAPI#removeListener removeListener}, because they all work together and you don't want to mix native implementations with polyfills.
 *
 * Removes all data model event handlers, detaching the data model from all grid instances.
 *
 * This method is not called by Hypergrid but might be useful to applications for resetting a data model instance.
 */

/**
 * @method dataModelAPI#dispatchEvent
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link dataModelAPI#addListener addListener}, {@link dataModelAPI#removeListener removeListener}, and {@link dataModelAPI#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
 *
 * If `addListener` is not implemented, Hypergrid falls back to a simpler approach, injecting its own implementation of `dispatchEvent`, bound to the grid instance, into the data model. If the data model already has such an implementation, the assumption is that it was injected by another grid instance using the same data model. The newly injected implementation will call the original injected implementation, thus creating a chain. This is an inferior approach because grids cannot easily unsubscribe themselves. Applications can remove all subscribers in the chain by deleting the implementation of `dispatchEvent` (the end of the chain) from the data model.
 *
 * #### Parameters:
 * @param {DataModelEvent} event
 */

/** @event dataModelAPI#fin-hypergrid-schema-changed
 * @desc The data models should trigger this event on a schema change, typically from setSchema, or wherever schema is initialized. Hypergrid responds by normalizing and decorating the schema object and recreating the grid's column objects — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
 * ```js
 * grid.addEventListener('fin-hypergrid-schema-changed', myHandlerFunction);
 * ```
 * This event is not cancelable.
 * @see {@link module:fields.normalizeSchema normalizeSchema}
 * @see {@link module:fields.decorateSchema decorateSchema}
 * @see {@link module:fields.decorateColumnSchema decorateColumnSchema}
 */

/** @event dataModelAPI#fin-hypergrid-data-changed
 * @desc The data model should trigger this event when it changes the data on its own.
 * Hypergrid responds by calling {@link Hypergrid#repaint grid.repaint()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
 * ```js
 * grid.addEventListener('fin-hypergrid-data-changed', myHandlerFunction);
 * ```
 * This event is not cancelable.
 */

/** @event dataModelAPI#fin-hypergrid-data-shape-changed
 * @desc The data model should trigger this event when it changes the data rows (count, order, _etc._) on its own.
 * Hypergrid responds by calling {@link Hypergrid#behaviorChanged grid.behaviorChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
 * ```js
 * grid.addEventListener('fin-hypergrid-data-shape-changed', myHandlerFunction);
 * ``
 * This event is not cancelable.
 */

/** @event dataModelAPI#fin-hypergrid-data-prereindex
 * @desc The data models should trigger this event immediately before data model remaps the rows.
 * Hypergrid responds by saving the underlying row indices of currently selected rows — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
 * ```js
 * grid.addEventListener('fin-hypergrid-data-prereindex', myHandlerFunction);
 * ```
 * This event is not cancelable.
 */

/** @event dataModelAPI#fin-hypergrid-data-postreindex
 * @desc The data models should trigger this event immediately after data model remaps the rows.
 * Hypergrid responds by reselecting the remaining rows matching the indices previously saved in the `data-prereindex` event, and then calling {@link Hypergrid#behaviorShapeChanged grid.behaviorShapeChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
 * ```js
 * grid.addEventListener('fin-hypergrid-data-postreindex', myHandlerFunction);
 * ```
 * This event is not cancelable.
 */

/**
 * @method dataModelAPI#getRowCount
 * @returns {number} The number of data rows currently contained in the model.
 */

/**
 * @method dataModelAPI#getRow
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Get a row of data.
 *
 * The injected default implementation is an object of lazy getters.
 * #### Parameters:
 * @param {number} rowIndex
 * @returns {number|undefined} The data row corresponding to the given `rowIndex`; or `undefined` if no such row.
 */

/**
 * @method dataModelAPI#setRow
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Update or blank a row in place, without deleting the row (and without affecting succeeding rows' indexes).
 * #### Parameters:
 * @param {number} y
 * @param {object} [dataRow] - if omitted or otherwise falsy, row renders as blank
 */

/**
 * @method dataModelAPI#apply
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Transforms the data. All the rows are subject to change, including the row count.
 */

/**
 * @method dataModelAPI#getColumnCount
 * @desc Same as `getSchema().length`.
 * @returns {number} Number of columns in the schema.
 */

/**
 * @method dataModelAPI#setRowMetadata
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Set the row's metadata object, which is a hash of cell properties objects, for those cells that have property overrides, keyed by column name; plus a row properties object with key `__ROW` when there are row properties.
 *
 * The default implementations of `getRowMetadata` and `setRowMetadata` store the metadata in an in-memory table. If this is not appropriate, override these methods to store the meta somewhere else (_e.g.,_ with the data in a hidden column, in another database table, in local storage, _etc._).
 *
 * #### Parameters:
 * @param {number} y - Row index.
 * @param {object} [newMetadata] - When omitted, delete the row's metadata.
 */

/**
 * @method dataModelAPI#setMetadataStore
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Set the metadata store. The precise type of this object is implementation-dependent, so not defined here.
 *
 * `datasaur-base` supplies fallback implementations of this method as well as {@link dataModelAPI#getMetadataStore} which merely set and get `this.metadata` in support of {@link dataModelAPI#setRowMetadata} and {@link dataModelAPI#getRowMetadata}.
 *
 * Custom data models are not required to implement them if they don't need them.
 *
 * If implemented, Hypergrid makes a single call to `setMetadataStore` when data model is reset (see {@link Local#resetDataModel}) with no arguments. Therefore this method needs to expect a no-arg overload and handle it appropriately.
 *
 * Hypergrid never calls `getMetadataStore`.
 * #### Parameters:
 * @param [newMetadataStore] - New metadata store object. Omitted on data model reset.
 */

/**
 * @method dataModelAPI#getRowMetadata
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Get the row's metadata object, which is a hash of cell properties objects, for those cells that have property overrides, keyed by column name; plus a row properties object with key `__ROW` when there are row properties.
 *
 * The default implementations of `getRowMetadata` and `setRowMetadata` store the metadata in an in-memory table. If this is not appropriate, override these methods to store the meta somewhere else (_e.g.,_ with the data in a hidden column, in another database table, in local storage, _etc._).
 *
 * #### Parameters:
 * @param {number} y - Row index.
 * @param {object} [prototype] - When row found but no metadata found, set the row's metadata to new object created from this object when defined.
 * Typical defined value is `null`, which creates a plain object with no prototype, or `Object.prototype` for a more "natural" object.
 * @returns {undefined|false|object} One of:
 * * object - existing metadata object or new metadata object created from `prototype`; else
 * * `false` - row found but no existing metadata and `prototype` was not defined; else
 * * `undefined`  - no such row
 */

/**
 * @method dataModelAPI#getMetadataStore
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Get the metadata store. The precise type of this object is implementation-dependent so not defined here.
 *
 * `datasaur-base` supplies fallback implementations of this method as well as {@link dataModelAPI#setMetadataStore} which merely get and set `this.metadata` in support of {@link dataModelAPI#getRowMetadata} and {@link dataModelAPI#setRowMetadata}.
 *
 * Custom data models are not required to implement them if they don't need them.
 *
 * Hypergrid never calls `getMetadataStore` itself. If implemented, Hypergrid does make a single call to `setMetadataStore` when data model is reset (see {@link Local#resetDataModel}) with no arguments.
 *
 * @returns Metadata store object.
 */

/**
 * @method dataModelAPI#install
 * @summary Install methods into data model.
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js) and then uses it to install the other polyfills and fallbacks when no native implementations exist, thus ensuring there are implementations for Hypergrid to call.
 *
 * ### Catcher functions
 * Catcher functions catch calls made by Hypergrid to otherwise unimplemented functions so such calls fail silently rather than throw an error.
 * * When `api` is array: `install` injects catcher functions named for each string in the array.
 * * When `api` is an object: `install` injects catcher functions named for each key in the object. (Keys with non-function values are excluded.)
 *
 * Keys `constructor` and `initialize` are always excluded. In addition, the `install` method defined in `datasaur-base` will also exclude keys missing from whitelist (`api['!!keys']`) or included in blacklist (`api['!key']`).
 *
 * The type of _catcher function_ depends on the data model:
 * * Flat data model: Catcher functions are simple no-ops that fail silently.
 * * Stacked data model: Catcher functions forward calls down the stack to the first native implementation found. When no native implementation is found, the call then fails silently.
 *
 * ### Fallbacks methods
 * Instead of failing silently, Hypergrid can instead install fallback methods for missing implementations:
 *
 * When `options.inject` is truthy (and `api` is an object), `install` injects `api`'s fallback methods into the data model instead of simple catchers when no native implementation already exists (however see `options.force` below).
 *
 * For a stacked data model, the target for the injection is the bottom instance in the stack (the data source instance); and the forwarding mechanism is also installed so the call will find the fallback there.
 *
 * ### Forced installation
 * When `options.force` is truthy, the fallback methods are always installed regardless of whether or not a native implementation exists; _i.e.,_ the fallbacks override the native implementations.
 *
 * @param {object|string[]} api - Collection of methods or a list of method names.
 *
 * The following keys are however ignored:
 * * _When `api` is a hash:_
 *   * Keys defined as accessors (getters/setters)
 *   * Keys not defined as functions
 * * Keys named `initialize` or `constructor`
 * * Keys not named in `api['!!keys']` if defined (_i.e.,_ a whitelist)
 * * Keys named in `api['!keys']` if defined (_i.e.,_ a blacklist)
 *
 * @param {object} options
 * @param {boolean} [options.inject] - Injects `api` object's fallback methods for missing data model implementations. (Otherwise, just installs catchers based on the keys.)
 * @param {boolean} [options.force] - If `options.inject` also true, injects `api` object's fallback methods, even if data model already has an implementation.
 */

/**
 * @method dataModelAPI#DataModelError
 * @desc A direct descendent of `Error`.
 * @returns {dataRowObject[]}
 */

/**
 * @method dataModelAPI#drillDownCharMap
 * @desc Characters that can be used to construct cell values representing drill downs in a tree structure.
 *
 * A specialized cell renderer is often employed to produce better results using graphics instead of characters.
 * @returns {dataRowObject[]}
 */

/**
 * @method dataModelAPI#click
 * @summary Mouse was clicked on a grid row.
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * The data model may respond to clicks by adding/removing/decorating data rows (_e.g.,_ a drill-down).
 * If it does so, the click is considered to be "consumed."
 * When a click is consumed, data models should publish 'data-changed' to the grid; or 'data-prereindex' and 'data-postreindex', which in turn triggers a 'data-changed' event. Hypergrid takes appropriate actions on receipt of 'data-*' events before synthesizing and firing 'fin-data-*' events.
 * #### Parameters:
 * @param {CellEvent} event
 * @returns {boolean} - Click was consumed by the data model.
 */

/**
 * @method dataModelAPI#isTree
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Synonym for {@link dataModelAPI#isDrillDown isDrillDown}.
 * #### Parameters:
 * @param {number} y - Data row index.
 * @returns {boolean} The row has a drill down control.
 */

/**
 * @method dataModelAPI#isDrillDown
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Called by Hypergrid's CellClick feature whenever user clicks on the grid.
 * #### Parameters:
 * @param {number} y - Data row index.
 * @returns {boolean} The row has a drill down control.
 */

/**
 * @method dataModelAPI#getRowIndex
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Only called by Hypergrid when it receives the `data-prereindex` or `data-postreindex` events.
 * These events are typically triggered before and after data model remaps the rows (in its `apply` method).
 * #### Parameters:
 * @param {number} y - Transformed data row index.
 * @returns {number} Untransformed data row index.
 */

/**
 * @method dataModelAPI#getDataIndex
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Synonym for getRowIndex.
 * #### Parameters:
 * @param {number} y - Transformed data row index.
 * @returns {number} Untransformed data row index.
 */

/**
 * @method dataModelAPI#getData
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * All grid data.
 * #### Parameters:
 * @param {string} [metadataFieldName] - If provided, the output will include the row metadata object in a "hidden" field with this name.
 * @returns {dataRowObject[]} All the grid's data rows.
 */

/**
 * @method dataModelAPI#getSchema
 * @desc Get list of columns. The order of the columns in the list defines the column indexes.
 *
 * On initial call and again whenever the schema changes, the data model must dispatch the `data-schema-changed` event, which tells Hypergrid to {@link module:schema.decorate decorate} the schema and recreate the column objects.
 * @returns {columnSchema[]}
 */

/**
 * @method dataModelAPI#setSchema
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Define column indexes. May include `header`, `type`, and `calculator` properties for each column.
 *
 * When the schema changes, the data model should dispatch the `data-schema-changed` event, which tells Hypergrid to {@link module:schema.decorate decorate} the schema and recreate the column objects.
 *
 * It is not necessary to call on every data update when you expect to reuse the existing schema.
 * #### Parameters:
 * @param {Array.<columnSchema|string>} [newSchema] - String elements are immediately converted (by {@link module:schema.decorate decorate}) to columnSchema objects.
 */

/**
 * @method dataModelAPI#addRow
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Insert or append a new row.
 * #### Parameters:
 * @param {number} [y=Infinity] - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
 * @param {object} dataRow
 */

/**
 * @method dataModelAPI#delRow
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Rows are removed entirely and no longer render.
 * Indexes of all remaining rows are decreased by `rowCount`.
 * #### Parameters:
 * @param {number} y
 * @param {number} [rowCount=1]
 * @returns {dataRowObject[]}
 */

/**
 * @method dataModelAPI#getValue
 * @desc Get a cell's value given its column & row indexes.
 * #### Parameters:
 * @param {number} columnIndex
 * @param {number} rowIndex
 * @returns {string|number|boolean|null} The member with the given `columnIndex` from the data row with the given `rowIndex`.
 */

/**
 * @method dataModelAPI#setValue
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Set a cell's value given its column & row indexes and a new value.
 * #### Parameters:
 * @param {number} columnIndex
 * @param {number} rowIndex
 * @param {*} newValue
 */

/**
 * @method dataModelAPI#setData
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Blah.
 * #### Parameters:
 * @param {dataRowObject[]} data - An array of congruent raw data objects.
 * @param {rawColumnSchema[]} - Ordered array of column schema.
 */

/**
 * @method dataModelAPI#getCell
 * @summary Renderer configuration interceptor.
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation ({@link module:hooks.getCell}).
 *
 * #### Description
 *
 * This method is a hook called on every cell just prior to rendering and is intended to be overridden.
 *
 * The first parameter to this method, `config`, Please refer to the {@link renderConfig} object for details. Most of the properties on this object can be overridden programmatically in this method. Properties typically overridden include {@link module:defaults.renderer renderer}, {@link module:defaults.editor editor}, {@link module:defaults.format format}, and the various permutations of {@link module:defaults.font font}, {@link module:defaults.color color}, and {@link module:defaults.halign halign}.
 *
 * Your override will be called with the data model as it's execution context (the `this` value).
 *
 * The only requirement for this method (or its override) is to return a reference to an instantiated cell renderer, which is all the default implementation does. This is typically the renderer whose name is in the {@link module:defaults.renderer config.renderer}, property (assumed to be a "registered" cell renderer). It doesn't have to be that cell renderer, however; and any object with a `paint` method will do.
 *
 * #### IMPORTANT CAVEAT!!
 *
 * Although this hook was designed to be overridden, adding lots (or any, really) programmatic logic to be executed on every cell, on every render, is _expensive_ in terms of performance, and doing so should only be a last resort.
 *
 * As Hypergrid has evolved, many properties have been added including row and cell properties, which can accomplish much that was previously impossible without overrideing `getCell`. For example, you can now select a formatter and a renderer simply by setting a column's (or row's) (or cell's) `format` or `renderer` property.
 *
 * Overriding `getCell` still has great facility when the rendering needs to be a function of the data values, but other than that, every effort should be made to avoid overriding `getCell` whenever possible.
 *
 * #### Parameters:
 * @param {CellEditor#renderConfig} config
 * @param {string} rendererName - Same as `config.renderer`, the proposed cell renderer name.
 * @returns {CellRenderer} An instantiated cell renderer.
 */

/**
 * @method dataModelAPI#getCellEditorAt
 * @summary Instantiate a new cell editor.
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation ({@link module:hooks.getCellEditorAt}).
 *
 * #### Description
 *
 * The application developer may override this method to:
 * * Instantiate and return an arbitrary cell editor. The generic implementation here simply returns the declared cell editor. This is `undefined` when there was no such declaration, or if the named cell editor was not registered.
 * * Return `undefined` for no cell editor at all. The cell will not be editable.
 * * Set properties on the instance by passing them in the `options` object. These are applied to the new cell editor object after instantiation but before rendering.
 * * Manipulate the cell editor object (including its DOM elements) after rendering but before DOM insertion.
 *
 * Overriding this method with a null function (that always returns `undefined`) will have the effect of making all cells uneditable.
 *
 * The only requirement for this method (or its override) is to return a reference to an instantiated cell editor, which is all the default implementation does. This is typically the cell editor whose name is in the {@link module:defaults.editor config.editor} property (assumed to be a "registered" cell editor). It doesn't have to be that cell editor, however; any object conforming to the CellEditor interface will do.
 *
 * #### Parameters:
 *
 * @param {number} columnIndex - Absolute column index. I.e., the position of the column in the data source's original `fields` array, as echoed in `behavior.allColumns[]`.
 *
 * @param {number} rowIndex - Row index of the data row in the current list of rows, regardless of vertical scroll position, offset by the number of header rows (all the rows above the first data row including the filter row). I.e., after subtracting out the number of header rows, this is the position of the data row in the `index` array of the data source (i.e., the last data source pipeline).
 *
 * @param {string} editorName - The proposed cell editor name (from the render properties).
 *
 * @param {CellEvent} cellEvent - All enumerable properties of this object will be copied to the new cell editor object for two purposes:
 * * Used in cell editor logic.
 * * For access from the cell editor's HTML template (via mustache).
 *
 * Developer's override of this method may add custom properties, for the purposes listed above.
 *
 * Hypergrid adds the following properties, required by {@link CellEditor}:
 * * **`.format`** - The cell's `format` render prop (name of localizer to use to format the editor preload and parse the edited value). May be `undefined` (no formatting or parsing). Added by calling {@link Column#getCellEditorAt|getCellEditorAt} method. Developer's override is free to alter this property.
 * **`.column`** ({@link Column} object), the only enumerable property of the native `CellEvent` object. Read-only.
 *
 * > Note: The `editPoint` property formerly available to cell editors in version 1 has been deprecated in favor of `cellEvent.gridCell`.
 *
 * @returns {undefined|CellEditor} An object instantiated from the registered cell editor constructor named in `editorName`. A falsy return means the cell is not editable because the `editorName` was not registered.
 */
