/**
 * @interface dataModelAPI
 * @summary Hypergrid 3 data model API.
 * @desc Hypergrid 3 data models have a minimal _required interface,_ as outlined below.
 *
 * #### Standard interface
 *
 * TL;DR — The only mandatory requirement is to implement the three methods, `getRowCount()`, `getSchema()`, and `getValue(x, y)`.
 *
 * Method | Required | Optional | Injected | Notes
 * --- | :-: | :-: | :-: | ---
 * {@link dataModelAPI#addRow addRow(dataRow, y)} | | `•` | | Proposed interface.
 * {@link dataModelAPI#apply apply()} | | | `•` | No-op implementation.
 * {@link dataModelAPI#click click()} | | | `•` | No-op implementation that returns `false`.
 * {@link dataModelAPI#delRow delRow(y, dataRow)} | | `•` | | Proposed interface.
 * {@link dataModelAPI#getCell getCell(config, rendererName)} | | | `•` | Overridable.
 * {@link dataModelAPI#getCellEditorAt getCellEditorAt(columnIndex, rowIndex, editorName, cellEvent)} | | | `•` | Overridable.
 * {@link dataModelAPI#getColumnCount getColumnCount()} | | | `•` |
 * {@link dataModelAPI#getData getData(metaDataFieldName)} | | | `•` |
 * {@link dataModelAPI#getMetadataStore getMetadataStore()} | | | `•` |
 * {@link dataModelAPI#getRowIndex getRowIndex(y)} | | | `•` |
 * {@link dataModelAPI#getRow getRow(y)} | | | `•` |
 * {@link dataModelAPI#getRowMetadata getRowMetadata(y, newRowMetadata)} | | | `•` |
 * {@link dataModelAPI#getRowCount getRowCount()} | `•` | | |
 * {@link dataModelAPI#getSchema getSchema()} | `•` | | |
 * {@link dataModelAPI#getValue getValue(x, y)} | `•` | | |
 * {@link dataModelAPI#isDrillDown isDrillDown()} | | | `•` | No-op implementation that returns `false`.
 * {@link dataModelAPI#setMetadataStore setMetadataStore()} | | | `•` |
 * {@link dataModelAPI#setRow setRow(y, dataRow)} | | `•` | | Proposed interface.
 * {@link dataModelAPI#setRowMetadata setRowMetadata(y, newRowMetadata)} | | | `•` |
 * {@link dataModelAPI#setSchema setSchema(newSchema)} | | `•` | | Only called when the application calls it directly (`dataModel.setSchema()`) or indirectly by invoking Hypergrid's `behavior.schema` setter.
 * {@link dataModelAPI#setValue setValue(x, y, value)} | | `•` | | Only called on attempt to close a cell editor. Note that cells are editable by default; set the {@link module:defaults.editable editable} property to `false` to make cell(s) non-editable (_i.e.,_ read-only) so this method will never be called.
 *
 * Definitions:
 * * Implementation **Required** — The method is required to be implemented by all data models.
 * * Fallback **Injected** — When not supported by the data model, Hypergrid injects a functional implementation. _**Caution:**_ These implementations may or may not be appropriate for your application. Check the code!
 * * Implementation **Optional** — Required only if the application intends to call it, either directly on the data model, or through a Hypergrid proxy method; or autonomously by Hypergrid itself when certain features are activated.
 * * **No-op implementation** — Fails silently when called.
 * * **Overridable** — Called by Hypergrid; not intended to ever be called by the data model itself. The injected default is subject to being overridden by the application. Although a custom data model could in theory supply these, doing so would be very rare.
 * * **Proposed interface** — These specifications are theoretical. Hypergrid never calls any of these methods. They are being put forward here just so that data models might aim for some level of interoperability. Implement at your own discretion, based on your application's specific needs.
 *
 * #### Utility methods
 *
 * Hypergrid only references the following when implemented (as they are in `DataSourceBase`).
 *
 * * {@link dataModelAPI#install install(api, injectFallbacks)}
 * * {@link dataModelAPI#drillDownCharMap drillDownCharMap}
 *
 * #### `Error` implementation
 *
 * Hypergrid never uses this but data models should always do so when they need to throw an error:
 *
 * * {@link dataModelAPI#DataSourceError DataSourceError(message)}
 *
 * This helps identify the error as coming from the data model and not from Hypergrid (which always uses its own `HypergridError`) or the application.
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
 * Although not a requirement, data models are more typically class instances, typically extending from `DataSourceBase` (_i.e.,_ have as its prototype the prototype of `DataSourceBase`).
 *
 * There are many ways to "extend" a class do this. For instance, to "extend" the above example:
```javascript
Object.setPrototypeOf(dataModel, DataSourceBase.prototype);
```
 * Or, for a hypothetical `DataModel` constructor:
```javascript
Object.setPrototypeOf(DataModel.prototype, DataSourceBase.prototype);
```
 * But the usual practice is to use `DataSourceBase.extend`. For example, `DataSourcelLocal`, the default data model that comes with Hypergrid, [does this](https://github.com/fin-hypergrid/datasaur-local/blob/master/index.js#L27). `DataSourceBase` supports "stacked" data models (with multi-stage data transformations). It also includes an implementation of the `install` utility method.
 *
 * But again, extending from `DataSourceBase` is not a requirement, just so long as the data model conforms to the interface. And for that reason, a rudimentary version of `install` is injected into custom data models when they lack an implementation of their own.
 *
 * `DataSourceBase` can be found in the [`datasaur-base`] module.
 */

/** @typdef {object} columnSchema
 * @property {string} name
 * @property {string} [header=name]
 * @property {number} index
 * @property {string} [type]
 * @property {string} [calculator]
 */

/** @typedef {object} dataRowObject
 * @desc A data row representation.
 * The properties of this object are the data fields.
 * The property keys are the column names.
 * All row objects should be congruent, meaning that each data row should have the same property keys.
 */

/**
 * @method dataModelAPI#dispatchEvent
 * @desc This method must be injected by Hypergrid; it should not be overridden.
 * #### Parameters:
 * @param {string} eventName - Event string (name).
 * @param {object} [eventDetail={}] - Optional event detail data.
 */

/** @event dataModelAPI#data-schema-changed
 * @desc The data models should trigger this event on a schema change, typically from setSchema, or wherever schema is initialized. Hypergrid responds by enriching the schema object — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener grid.addEventListener('fin-data-schema-changed', myHandlerFunction)}.
 * @see {@link module:dataModel/schema.enrich enrich}
 */

/** @event dataModelAPI#data-changed
 * @desc The data model should trigger this event when it changes the data on its own.
 * Hypergrid responds by calling {@link Hypergrid#repaint grid.repaint()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener grid.addEventListener('fin-data-changed', myHandlerFunction)}.
 */

/** @event dataModelAPI#data-shape-changed
 * @desc The data model should trigger this event when it changes the data rows (count, order, _etc._) on its own.
 * Hypergrid responds by calling {@link Hypergrid#behaviorChanged grid.behaviorChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener('fin-data-shape-changed', myHandlerFunction)}.
 */

/** @event dataModelAPI#data-prereindex
 * @desc The data models should trigger this event immediately before data model remaps the rows.
 * Hypergrid responds by saving the underlying row indices of currently selected rows — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener('fin-data-prereindex', myHandlerFunction)}.
 */

/** @event dataModelAPI#data-postreindex
 * @desc The data models should trigger this event immediately after data model remaps the rows.
 * Hypergrid responds by reselecting the remaining rows matching the indices previously saved in the `data-prereindex` event, and then calling {@link Hypergrid#behaviorShapeChanged grid.behaviorShapeChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener('fin-data-postreindex', myHandlerFunction)}.
 */

/**
 * @method dataModelAPI#getRowCount
 * @returns {number} The number of data rows currently contained in the model.
 */

/**
 * @method dataModelAPI#getRow
 * @desc Get a row of data.
 *
 * The injected default implementation is an object of lazy getters.
 * #### Parameters:
 * @param {number} rowIndex
 * @returns {number|undefined} The data row corresponding to the given `rowIndex`; or `undefined` if no such row.
 */

/**
 * @method dataModelAPI#setRow
 * @desc Update or blank row in place.
 *
 * _Note parameter order is the reverse of `addRow`._
 * #### Parameters:
 * @param {number} y
 * @param {object} [dataRow] - if omitted or otherwise falsy, row renders as blank
 */

/**
 * @method dataModelAPI#apply
 * @desc Transforms the data. All the rows are subject to change, including the row count.
 */

/**
 * @method dataModelAPI#getColumnCount
 * @desc Same as `getSchema().length`.
 * @returns {number} Number of columns in the schema.
 */

/**
 * @method dataModelAPI#setRowMetadata
 * @desc Set the row's metadata object, which is a hash of cell properties objects, for those cells that have property overrides, keyed by column name; plus a row properties object with key `__ROW` when there are row properties.
 *
 * The default implementations of `getRowMetadata` and `setRowMetadata` store the metadata in an in-memory table. If this is not appropriate, override these methods to store the meta somewhere else (_e.g.,_ with the data in a hidden column, in another database table, in local storage, _etc._).
 *
 * #### Parameters:
 * @param {number} y - Row index.
 * @param {object} [newMetadata] - When omitted, delete the row's metadata.
 */

/**
 * @method dataModelAPI#setMetadataStore
 * @desc Set the metadata store. The precise type of this object is implementation-dependent, so not defined here.
 *
 * `DataSourceBase` supplies fallback implementations of this method as well as {@link dataModelAPI#getMetadataStore} which merely set and get `this.metadata` in support of {@link dataModelAPI#setRowMetadata} and {@link dataModelAPI#getRowMetadata}.
 *
 * Custom data models are not required to implement them if they don't need them.
 *
 * If implemented, Hypergrid makes a single call to `setMetadataStore` when data model is reset (see {@link Behavior#resetDataModel}) with no arguments. Therefore this method needs to expect a no-arg overload and handle it appropriately.
 *
 * Hypergrid never calls `getMetadataStore`.
 * #### Parameters:
 * @param [newMetadataStore] - New metadata store object. Omitted on data model reset.
 */

/**
 * @method dataModelAPI#getRowMetadata
 * @desc Get the row's metadata object, which is a hash of cell properties objects, for those cells that have property overrides, keyed by column name; plus a row properties object with key `__ROW` when there are row properties.
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
 * @desc Get the metadata store. The precise type of this object is implementation-dependent so not defined here.
 *
 * `DataSourceBase` supplies fallback implementations of this method as well as {@link dataModelAPI#setMetadataStore} which merely get and set `this.metadata` in support of {@link dataModelAPI#getRowMetadata} and {@link dataModelAPI#setRowMetadata}.
 *
 * Custom data models are not required to implement them if they don't need them.
 *
 * Hypergrid never calls `getMetadataStore` itself. If implemented, Hypergrid does make a single call to `setMetadataStore` when data model is reset (see {@link Behavior#resetDataModel}) with no arguments.
 *
 * @returns Metadata store object.
 */

/**
 * @method dataModelAPI#install
 * @summary Install methods into data model.
 * @desc Injects default implementations of the methods named in the 1st param (`api`) into the data model's prototype that are no-ops. This allows _ad hoc_ calls to unimplemented functions to fail silently.
 *
 * When the data model is _stacked_ (_i.e.,_ a linked list of _data transformers,_ linked one to the next with a `next` property, ending with a _data source_ (with no `next` property), these default implementations will forward a call made on an upper layer to the nearest lower layer with an actual implementation.
 *
 * When the 2nd param (`injectFallbacks`) is truthy _and_ `api` is a hash, assigns the contained fallback method implementations to the final (data source) layer.
 *
 * @param {object|string[]} [api=this] - Collection of methods or a list of method names.
 *
 * The following keys are however ignored:
 * * _When `api` is a hash:_
 *   * Keys defined as accessors (getters/setters)
 *   * Keys not defined as functions
 * * Keys named `initialize` or `constructor`
 * * Keys not named in `api['!!keys']` if defined (_i.e.,_ a whitelist)
 * * Keys named in `api['!keys']` if defined (_i.e.,_ a blacklist)
 *
 * @param {boolean} [injectFallbacks=false] - Installs the method. (Otherwise, just installs the bubbler.)
 */

/**
 * @method dataModelAPI#DataSourceError
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
 * @desc The data model may respond to clicks by adding/removing/decorating data rows (_e.g.,_ a drill-down).
 * If it does so, the click is considered to be "consumed."
 * When a click is consumed, data models should publish 'data-changed' to the grid; or 'data-prereindex' and 'data-postreindex', which in turn triggers a 'data-changed' event. Hypergrid takes appropriate actions on receipt of 'data-*' events before synthesizing and firing 'fin-data-*' events.
 * #### Parameters:
 * @param {CellEvent} event
 * @returns {boolean} - Click was consumed by the data model.
 */

/**
 * @method dataModelAPI#isTree
 * @desc Synonym for {@link dataModelAPI#isDrillDown isDrillDown}.
 * #### Parameters:
 * @param {number} y - Data row index.
 * @returns {boolean} The row has a drill down control.
 */

/**
 * @method dataModelAPI#isDrillDown
 * @desc Called by Hypergrid's CellClick feature whenever user clicks on the grid.
 * #### Parameters:
 * @param {number} y - Data row index.
 * @returns {boolean} The row has a drill down control.
 */

/**
 * @method dataModelAPI#getRowIndex
 * @desc Only called by Hypergrid when it receives the `data-prereindex` or `data-postreindex` events.
 * These events are typically triggered before and after data model remaps the rows (in its `apply` method).
 * #### Parameters:
 * @param {number} y - Transformed data row index.
 * @returns {number} Untransformed data row index.
 */

/**
 * @method dataModelAPI#getDataIndex
 * @desc Synonym for getRowIndex.
 * #### Parameters:
 * @param {number} y - Transformed data row index.
 * @returns {number} Untransformed data row index.
 */

/**
 * @method dataModelAPI#getData
 * @desc All grid data.
 * #### Parameters:
 * @param {string} [metadataFieldName] - If provided, the output will include the row metadata object in a "hidden" field with this name.
 * @returns {dataRowObject[]} All the grid's data rows.
 */

/**
 * @method dataModelAPI#getSchema
 * @desc Get list of columns. The order of the columns in the list defines the column indexes.
 *
 * On initial call and again whenever the schema changes, the data model must dispatch the `data-schema-changed` event, which tells Hypergrid to {@link module:dataModel/schema.enrich enrich} the schema and recreate the column objects.
 * @returns {columnSchema[]}
 */

/**
 * @method dataModelAPI#setSchema
 * @desc Define column indexes. May include `header`, `type`, and `calculator` properties for each column.
 *
 * When the schema changes, the data model should dispatch the `data-schema-changed` event, which tells Hypergrid to {@link module:dataModel/schema.enrich enrich} the schema and recreate the column objects.
 *
 * It is not necessary to call on every data update when you expect to reuse the existing schema.
 * #### Parameters:
 * @param {Array.<columnSchema|string>} [newSchema] - String elements are immediately converted (by `enrich`) to columnSchema objects.
 */

/**
 * @method dataModelAPI#addRow
 * @desc Insert or append a new row.
 *
 * _Note parameter order is the reverse of `setRow`._
 * #### Parameters:
 * @param {object} dataRow
 * @param {number} [y=Infinity] - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
 */

/**
 * @method dataModelAPI#delRow
 * @desc Rows are removed entirely and no longer render.
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
 * @desc Set a cell's value given its column & row indexes and a new value.
 * #### Parameters:
 * @param {number} columnIndex
 * @param {number} rowIndex
 * @param {*} newValue
 */

/**
 * @method dataModelAPI#setData
 * @desc Blah.
 * #### Parameters:
 * @param {dataRowObject[]} data - An array of congruent raw data objects.
 * @param {columnSchema[]} - Ordered array of column schema.
 */

/**
 * @method dataModelAPI#getCell
 * @summary Renderer configuration interceptor.
 * @desc #### IMPLEMENTATION: Optional
 *
 * If your data model does not supply a custom `getCell` method, {@link Behavior#reset} adds the default implementation ({@link module:dataModel.getCell}).
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
 * @desc #### IMPLEMENTATION: Optional
 *
 * If your data model does not supply a custom `getCellEditorAt` method, {@link Behavior#reset} adds the default implementation ({@link module:dataModel.getCellEditorAt}).
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
