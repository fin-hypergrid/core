/**
 * @typedef {any} CellEditor TODO
 * @typedef {any} CellEvent TODO
 */


/**
 * @interface DataModel
 * @desc Hypergrid 3 data models have a minimal required interface, as outlined on the [Data Model API](https://github.com/fin-hypergrid/core/wiki/Data-Model-API) wiki page.

 #### TL;DR
 The minimum interface is an object with just three methods: {@link DataModel#getRowCount getRowCount()} {@link DataModel#getSchema getSchema()} and {@link DataModel#getValue getValue(x, y)}.
 */

/** @typedef {Record<string, any>} columnSchema
 * @property {string} name
 * @property {string} [header=name]
 * @property {number} index
 * @property {string} [type]
 * @property {string} [calculator]
 */

/** @typedef {columnSchema} rawColumnSchema
 * Column schema may be expressed as a string primitive on input to {@link DataModel#setData setData}.
 */

/** @typedef {object} dataRowObject
 * @desc A data row representation.
 * The properties of this object are the data fields.
 * The property keys are the column names
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
 * @method DataModel#addListener
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#dispatchEvent dispatchEvent}, {@link DataModel#removeListener removeListener}, and {@link DataModel#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
 *
 * Hypergrid calls this method subscribe to data model events. The data model calls its own implementation of `dispatchEvent` to publish events to subscribers.
 *
 * Both the `addListener` polyfill as well as `datasaur-base`'s implementation service multiple listeners for the use case of multiple grid instances all using the same data model instance. To support this use case, your data model should service multiple listeners as well. (Doing so also lets the application add its own listener(s) to the data model.)
 *
 * @param {DataModelListener} handler - A reference to a function bound to a grid instance. The function is called whenever the data model calls its {@link DataModel#dispatchEvent} method. The handler thus receives all data model events (in `event.type).
 */

/**
 * @method DataModel#removeListener
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#addListener addListener}, {@link DataModel#dispatchEvent dispatchEvent}, and {@link DataModel#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
 *
 * Detaches the data model from a particular grid instance.
 *
 * This method is called by {@link Hypergrid#desctruct} to clean up memory.
 * Note: `destruct` is not called automatically by Hypergrid; applications must call it explicitly when disposing of a grid.
 *
 * @param {DataModelListener} handler - A reference to the handler originally provided to {@link DataModel#addListener}.
 */

/**
 * @method DataModel#removeAllListeners
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#addListener addListener}, {@link DataModel#dispatchEvent dispatchEvent}, and {@link DataModel#removeListener removeListener}, because they all work together and you don't want to mix native implementations with polyfills.
 *
 * Removes all data model event handlers, detaching the data model from all grid instances.
 *
 * This method is not called by Hypergrid but might be useful to applications for resetting a data model instance.
 */

/**
 * @method DataModel#dispatchEvent
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#addListener addListener}, {@link DataModel#removeListener removeListener}, and {@link DataModel#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
 *
 * If `addListener` is not implemented, Hypergrid falls back to a simpler approach, injecting its own implementation of `dispatchEvent`, bound to the grid instance, into the data model. If the data model already has such an implementation, the assumption is that it was injected by another grid instance using the same data model. The newly injected implementation will call the original injected implementation, thus creating a chain. This is an inferior approach because grids cannot easily unsubscribe themselves. Applications can remove all subscribers in the chain by deleting the implementation of `dispatchEvent` (the end of the chain) from the data model.
 *
 * #### Parameters:
 * @param {DataModelEvent} event
 */

/** @event DataModel#fin-hypergrid-schema-loaded
 * @desc The data models should trigger this event on a schema change, typically from setSchema, or wherever schema is initialized. Hypergrid responds by normalizing and decorating the schema object and recreating the grid's column objects — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
 * ```js
 * grid.addEventListener('fin-hypergrid-schema-loaded', myHandlerFunction);
 * ```
 * This event is not cancelable.
 * @see {@link module:fields.normalizeSchema normalizeSchema}
 * @see {@link module:fields.decorateSchema decorateSchema}
 * @see {@link module:fields.decorateColumnSchema decorateColumnSchema}
 */

/** @event DataModel#fin-hypergrid-data-loaded
 * @desc The data model should trigger this event when it changes the data on its own.
 * Hypergrid responds by calling {@link Hypergrid#repaint grid.repaint()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
 * ```js
 * grid.addEventListener('fin-hypergrid-data-loaded', myHandlerFunction);
 * ```
 * This event is not cancelable.
 */

/** @event DataModel#fin-hypergrid-data-shape-changed
 * @desc The data model should trigger this event when it changes the data rows (count, order, _etc._) on its own.
 * Hypergrid responds by calling {@link Hypergrid#behaviorChanged grid.behaviorChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
 * ```js
 * grid.addEventListener('fin-hypergrid-data-shape-changed', myHandlerFunction);
 * ``
 * This event is not cancelable.
 */

/** @event DataModel#fin-hypergrid-data-prereindex
 * @desc The data models should trigger this event immediately before data model remaps the rows.
 * Hypergrid responds by saving the underlying row indices of currently selected rows — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
 * ```js
 * grid.addEventListener('fin-hypergrid-data-prereindex', myHandlerFunction);
 * ```
 * This event is not cancelable.
 */

/** @event DataModel#fin-hypergrid-data-postreindex
 * @desc The data models should trigger this event immediately after data model remaps the rows.
 * Hypergrid responds by reselecting the remaining rows matching the indices previously saved in the `data-prereindex` event, and then calling {@link Hypergrid#behaviorShapeChanged grid.behaviorShapeChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
 * ```js
 * grid.addEventListener('fin-hypergrid-data-postreindex', myHandlerFunction);
 * ```
 * This event is not cancelable.
 */

/**
 * @method DataModel#getRowCount
 * @returns {number} The number of data rows currently contained in the model.
 */

/**
 * @method DataModel#getRow
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
 * @method DataModel#setRow
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Update or blank a row in place, without deleting the row (and without affecting succeeding rows' indexes).
 * #### Parameters:
 * @param {number} y
 * @param {object} [dataRow] - if omitted or otherwise falsy, row renders as blank
 */

/**
 * @method DataModel#apply
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Transforms the data. All the rows are subject to change, including the row count.
 */

/**
 * @method DataModel#getColumnCount
 * @desc Same as `getSchema().length`.
 * @returns {number} Number of columns in the schema.
 */

/**
 * @method DataModel#setRowMetadata
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
 * @method DataModel#setMetadataStore
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Set the metadata store. The precise type of this object is implementation-dependent, so not defined here.
 *
 * `datasaur-base` supplies fallback implementations of this method as well as {@link DataModel#getMetadataStore} which merely set and get `this.metadata` in support of {@link DataModel#setRowMetadata} and {@link DataModel#getRowMetadata}.
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
 * @method DataModel#getRowMetadata
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
 * @method DataModel#getMetadataStore
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Get the metadata store. The precise type of this object is implementation-dependent so not defined here.
 *
 * `datasaur-base` supplies fallback implementations of this method as well as {@link DataModel#setMetadataStore} which merely get and set `this.metadata` in support of {@link DataModel#getRowMetadata} and {@link DataModel#setRowMetadata}.
 *
 * Custom data models are not required to implement them if they don't need them.
 *
 * Hypergrid never calls `getMetadataStore` itself. If implemented, Hypergrid does make a single call to `setMetadataStore` when data model is reset (see {@link Local#resetDataModel}) with no arguments.
 *
 * @returns Metadata store object.
 */

/**
 * @method DataModel#install
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
 * @method DataModel#DataModelError
 * @desc A direct descendent of `Error`.
 * @returns {dataRowObject[]}
 */

/**
 * @method DataModel#drillDownCharMap
 * @desc Characters that can be used to construct cell values representing drill downs in a tree structure.
 *
 * A specialized cell renderer is often employed to produce better results using graphics instead of characters.
 * @returns {dataRowObject[]}
 */

/**
 * @method DataModel#toggleRow
 * @summary Mouse was clicked on a grid row.
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Hypergrid calls this method from one place, {@link Local#cellClicked behavior.cellClicked}, which is called from src/features/CellClick when user clicks on a tree or data cell.
 *
 * The data model may consume or ignore the click.
 *
 * If the data model consumes the click by modifying some data in the existing data set, it should dispatch the 'fin-hypergrid-data-loaded` data event to the grid, which causes a grid "repaint" (which re-renders rows and columns in place).
 *
 * If the data model consumes the click by transforming the data, it should dispatch the following data events to the grid:
 *    * 'fin-hypergrid-data-prereindex' before transforming the data
 *    * 'fin-hypergrid-data-postreindex' after transforming the data
 *
 * This causes Hypergrid to save the current row and/or column selections before and then attempt to restore them after, before a "shape change" (which recalculates row and column bounding rects and then re-renders them).
 *
 * "Transforming the data" means altering the data set (by adding/removing rows, _etc._). The typical use case for this is a click on a cell containing a drill-down control.
 *
 * After rerendering, Hypergrid dispatches a DOM event with the same _type_ (same event string) to the grid's `<canvas>` element for the benefit of any application listeners.
 *
 * #### Parameters:
 *
 * @param {number} rowIndex
 *
 * @param {number} [columnIndex] - For the drill-down control use case, implementations should call `this.isTreeCol(columnIndex)` if they want to restrict the response to clicks in the tree column (rather than any column). Although defined in Hypergrid's call, implementations should not depend on it, which may be useful for testing purposes.
 *
 * @param {boolean} [toggle] - One of:
 * * `undefined` (or omitted) - Toggle row.
 * * `true` - Expand row iff currently collapsed.
 * * `false` - Collapse row iff currently expanded.
 * > NOTE: Implementation of this parameter is optional. It may be useful for testing purposes but Hypergrid does not define actual parameter in its call in {@link Hypergrid#cellClicked}.
 *
 * @returns {boolean|undefined} If click was consumed by the data model:
 * * `undefined` Not consumed: Row had no drill-down control.
 * * `true` Consumed: Row had a drill-down control which was toggled.
 * * `false` Not consumed: Row had a drill-down control but it was already in requested state.
 * > NOTE: Implementation of a return value is optional as of version v3.0.0. It may be useful for testing purposes but {@link Hypergrid#cellClicked} no longer uses the return value (depending instead on the implementation dispatching data events), so implementations no longer need to support it. Therefore, in general, applications should no depend on a return value. For particular requirements, however, an applications may make a private contract with a data model implementation for a return value (that may or may not follow the above definition. Regardless of the implementation, the return value of this method is propagated through the return values of {@link Local#cellClicked} -> {@link Hypergrid#cellClicked} -> the application.
 */

/**
 * @method DataModel#isTree
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL. It is only required for data models that support tree views._
 * @returns {boolean} The grid view is a tree (presumably has a tree column).
 */

/**
 * @method DataModel#isTreeCol
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL. It is only required for data models that support tree views._
 * #### Parameters:
 * @param {number} columnIndex
 * @returns {boolean} This column is the tree column (displays tree structure; may or may not be an interactive drill-down control).
 */

/**
 * @method DataModel#getRowIndex
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Only called by Hypergrid when it receives the `data-prereindex` or `data-postreindex` events.
 * These events are typically triggered before and after data model remaps the rows (in its `apply` method).
 * #### Parameters:
 * @param {number} y - Transformed data row index.
 * @returns {number} Untransformed data row index.
 */

/**
 * @method DataModel#getDataIndex
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Synonym for getRowIndex.
 * #### Parameters:
 * @param {number} y - Transformed data row index.
 * @returns {number} Untransformed data row index.
 */

/**
 * @method DataModel#getData
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * All grid data.
 * #### Parameters:
 * @param {string} [metadataFieldName] - If provided, the output will include the row metadata object in a "hidden" field with this name.
 * @returns {dataRowObject[]} All the grid's data rows.
 */

/**
 * @method DataModel#fetchData
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Tells dataModel what cells will be needed by subsequent calls to {@link DataModel#getValue getValue()}. This helps remote or virtualized data models fetch and cache data. If your data model doesn't need to know this, don't implement it.
 * #### Parameters:
 * @param {Rectangle[]} rectangles - Unordered list of rectangular regions of cells to fetch in a single (atomic) operation.
 * @returns {function} [callback] - Optional callback. If provided, implementation calls it with `false` on success (requested data fully fetched) or `true` on failure.
 */

/**
 * @method DataModel#getSchema
 * @desc Get list of columns. The order of the columns in the list defines the column indexes.
 *
 * On initial call and again whenever the schema changes, the data model must dispatch the `fin-hypergrid-schema-loaded` event, which tells Hypergrid to {@link module:schema.decorate decorate} the schema and recreate the column objects.
 * @returns {columnSchema[]}
 */

/**
 * @method DataModel#setSchema
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Define column indexes. May include `header`, `type`, and `calculator` properties for each column.
 *
 * When the schema changes, the data model should dispatch the `fin-hypergrid-schema-loaded` event, which tells Hypergrid to {@link module:schema.decorate decorate} the schema and recreate the column objects.
 *
 * It is not necessary to call on every data update when you expect to reuse the existing schema.
 * #### Parameters:
 * @param {Array.<columnSchema|string>} [newSchema] - String elements are immediately converted (by {@link module:schema.decorate decorate}) to columnSchema objects.
 */

/**
 * @method DataModel#addRow
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Insert or append a new row.
 * #### Parameters:
 * @param {number} [y=Infinity] - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
 * @param {object} dataRow
 */

/**
 * @method DataModel#delRow
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
 * @method DataModel#getValue
 * @desc Get a cell's value given its column & row indexes.
 * #### Parameters:
 * @param {number} columnIndex
 * @param {number} rowIndex
 * @returns {string|number|boolean|null} The member with the given `columnIndex` from the data row with the given `rowIndex`.
 */

/**
 * @method DataModel#setValue
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Set a cell's value given its column & row indexes and a new value.
 * #### Parameters:
 * @param {number} columnIndex
 * @param {number} rowIndex
 * @param {*} newValue
 */

/**
 * @method DataModel#setData
 * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
 *
 * Blah.
 * #### Parameters:
 * @param {dataRowObject[]} data - An array of congruent raw data objects.
 * @param {rawColumnSchema[]} schema - Ordered array of column schema.
 */

/**
 * @method DataModel#getCell
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
 * @param {CellEditor["renderConfig"]} config
 * @param {string} rendererName - Same as `config.renderer`, the proposed cell renderer name.
 * @returns {CellRenderer} An instantiated cell renderer.
 */

/**
 * @method DataModel#getCellEditorAt
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
