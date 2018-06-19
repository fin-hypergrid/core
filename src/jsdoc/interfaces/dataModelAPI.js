/**
 * @interface dataModelAPI
 * @summary Hypergrid 3 data model API.
 * @desc Hypergrid 3 data models have a minimal _required interface,_ as outlined below.
 *
 * #### TL;DR
 *
 * The only mandatory requirement is to implement the three methods, `getRowCount()`, `getSchema()`, and `getValue(x, y)`.
 *
 * #### Standard interface
 *
 * * {@link dataModelAPI#apply apply()}<sup>stubbed</sup>
 * * {@link dataModelAPI#click click()}<sup>stubbed-false</sup>
 * * {@link dataModelAPI#getCell getCell(config, rendererName)}<sup>injected, overridable</sup>
 * * {@link dataModelAPI#getCellEditorAt getCellEditorAt(columnIndex, rowIndex, editorName, cellEvent)}<sup>injected, overridable</sup>
 * * {@link dataModelAPI#getColumnCount getColumnCount()}<sup>injected</sup>
 * * {@link dataModelAPI#getData getData(metaDataFieldName)}<sup>injected</sup>
 * * {@link dataModelAPI#getMetadataStore getMetadataStore()}<sup>injected</sup>
 * * {@link dataModelAPI#getRowIndex getRowIndex(y)}<sup>injected</sup>
 * * {@link dataModelAPI#getRow getRow(y)}<sup>injected</sup><br>
 * * {@link dataModelAPI#getRowMetadata getRowMetadata(y, newRowMetadata)}<sup>injected</sup><br>
 * * {@link dataModelAPI#getRowCount getRowCount()}<sup>required!</sup>
 * * {@link dataModelAPI#getSchema getSchema()}<sup>required!</sup>
 * * {@link dataModelAPI#getValue getValue(x, y)}<sup>required!</sup>
 * * {@link dataModelAPI#isDrillDown isDrillDown()}<sup>stubbed-false</sup><br>
 * * {@link dataModelAPI#setMetadataStore setMetadataStore()}<sup>injected</sup>
 * * {@link dataModelAPI#setRowMetadata setRowMetadata(y, newRowMetadata)}<sup>injected</sup><br>
 * * {@link dataModelAPI#setSchema setSchema(newSchema)}<sup>optional, 1</sup><br>
 * * {@link dataModelAPI#setValue setValue(x, y, value)}<sup>optional, 2</sup><br>
 *
 * Footnotes:
 *
 * Superscript | Footnote
 * :-: | ---
 * required! | Method is required to be implemented by all data models.
 * stubbed | When not supported by the data model, to prevent calls from throwing an error, Hypergrid injects a stub with no return value.
 * stubbed-false | When not supported by the data model, Hypergrid injects a stub that specifically returns `false`.
 * injected | When not supported by the data model, Hypergrid injects a functional implementation. _**Caution:**_ These implementations may or may not be appropriate for your application (see [`fallbacks`](https://github.com/fin-hypergrid/core/blob/v3.0.0/src/behaviors/dataModel.js#L301)).
 * overridable | Called by Hypergrid; not intended to ever be called by the data model itself. The injected default is subject to being overridden by the application. Although a custom data model could in theory supply these, doing so would be very rare.
 * optional | Implementation required if and only if called by the application, either directly on the data model, or through a Hypergrid proxy (which may be a method, getter, or setter), or autonomously by Hypergrid itself when certain features are activated.
 * 1 | `setSchema` is only called when the application calls it directly (`dataModel.setSchema()`) or indirectly by invoking Hypergrid's `behavior.schema` setter.
 * 2 | `setValue` is only called on attempt to close a cell editor. Note that cells are editable by default; set the {@link module:defaults.editable editable} property to `false` to make cell(s) non-editable (_i.e.,_ read-only).
 *
 * #### Suggested interface
 *
 * The following methods are not required to be implemented. Implement at your own discretion, based on your application's specific needs.
 *
 * Because Hypergrid never calls any of these methods, these methods' specifications are theoretical. They are being put forward here so that data models might aim for some level of interoperability.
 *
 * * {@link dataModelAPI#addRow addRow(dataRow, y)}
 * * {@link dataModelAPI#delRow delRow(y, dataRow)}
 * * {@link dataModelAPI#setRow setRow(y, dataRow)}
 *
 * #### Utility methods
 *
 * Hypergrid only references the following utility methods when implemented. These are all implemented in `DataSourceBase`.
 *
 * * {@link dataModelAPI#DataSourceError DataSourceError(message)}
 * * {@link dataModelAPI#defineProperty defineProperty(key, descriptor}
 * * {@link dataModelAPI#definePropertyBubbler definePropertyBubbler(key, descriptor)}
 * * {@link dataModelAPI#drillDownCharMap drillDownCharMap}
 * * {@link dataModelAPI#getOwnerOf getOwnerOf(methodName)}
 * * {@link dataModelAPI#installProperties installProperties(object)}
 * * {@link dataModelAPI#installPropertyBubblers installPropertyBubblers(api)}
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
 * This above simple example is a plain object namespace.
 * Data models are more typically class instances (albeit not a requirement).
 *
 * #### Data model base class
 *
 * Data models typically extend from `DataSourceBase` (_i.e.,_ have as its prototype the prototype of `DataSourceBase`). (This is also not a requirement.)
 *
 * There are many ways to do this. For instance, to "extend" the above example:
```javascript
Object.setPrototypeOf(dataModel, DataSourceBase.prototype);
```
 * Or, for a hypothetical `DataModel` constructor:
```javascript
Object.setPrototypeOf(DataModel.prototype, DataSourceBase.prototype);
```
 * But the usual practice is to use `DataSourceBase.extend`. For example, `DataSourcelLocal`, the default data model that comes with Hypergrid, [does this](https://github.com/fin-hypergrid/datasaur-local/blob/master/index.js#L27). `DataSourceBase` supports data models with multi-stage data transformations and includes implementations of some utility methods. Extending from `DataSourceBase` is not a requirement, just so long as the data model conforms to the interface. `DataSourceBase` can be found in the [`datasaur-base`] module.
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
 * @param {string} eventName - Event string (name).
 * @param {object} [eventDetail={}] - Optional event object.
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
 * @desc Blah.
 * ##### Parameters:
 * @param {number} rowIndex
 * @returns {number|undefined} The data row with the given `rowIndex`; or `undefined` if no such row.
 */

/**
 * @method dataModelAPI#setRow
 * @desc Blah.
 * ##### Parameters:
 * @param {number} rowIndex
 * @param {dataRowObject} dataRow
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
 * Only called by Hypergrid when it receives the `data-prereindex` or `data-postreindex` events.
 * These events are typically triggered before and after data model remaps the rows (in its `apply` method).
 * @method dataModelAPI#getRowIndex
 * @returns {dataRowObject[]}
 */

/**
 * @method dataModelAPI#setRowMetadata
 * @desc Set the row's metadata object, which is a hash of cell properties objects, for those cells that have property overrides, keyed by column name; plus a row properties object with key `__ROW` when there are row properties.
 *
 * The default implementations of `getRowMetadata` and `setRowMetadata` store the metadata in an in-memory table. If this is not appropriate, override these methods to store the meta somewhere else (_e.g.,_ with the data in a hidden column, in another database table, in local storage, _etc._).
 *
 * ##### Parameters:
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
 * ##### Parameters:
 * @param [newMetadataStore] - New metadata store object. Omitted on data model reset.
 */

/**
 * @method dataModelAPI#getRowMetadata
 * @desc Get the row's metadata object, which is a hash of cell properties objects, for those cells that have property overrides, keyed by column name; plus a row properties object with key `__ROW` when there are row properties.
 *
 * The default implementations of `getRowMetadata` and `setRowMetadata` store the metadata in an in-memory table. If this is not appropriate, override these methods to store the meta somewhere else (_e.g.,_ with the data in a hidden column, in another database table, in local storage, _etc._).
 *
 * ##### Parameters:
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
 * @method dataModelAPI#installProperties
 * @returns {dataRowObject[]}
 */

/**
 * @method dataModelAPI#defineProperty
 * @summary Install a property.
 * @desc This method installs a property into the _bottom layer._
 * @see {@link dataModelAPI#definePropertyBubbler}
 * @param {string} [key] - Property name.
 * @param {object} [descriptor] - The property descriptor.
 * @returns {dataRowObject[]}
 */

/**
 * @method dataModelAPI#installPropertyBubblers
 * @returns {dataRowObject[]}
 */

/**
 * @method dataModelAPI#definePropertyBubbler
 * @desc Install a property bubbler.
 *
 * This method installs a _property bubbler_ into the _bottom layer._
 * It will not install instance variables; the property needs to be a getter, setter, or method.
 *
 * _Definition:_ A **property bubbler** is a getter, setter, or method that just "catches" an attempted invocation and fails _silently_ (meaining without throwing an error). It's called a bubbler because in data models that implement a multi-stage _transformation chain_ (a linked chain of of _data transformers,_ or _data sources_), the invocation is forwarded to each link in that chain before finally failing.
 *
 * @param {string} [key] - Property name.
 * @param {object} [descriptor] - The property descriptor.
 * @returns {boolean} Indicates if the property was installed.
 */

/**
 * @method dataModelAPI#getOwnerOf
 * @summary Get object that defines the member.
 * @dsc Searches the data source for the object that owns the named member.
 *
 * This will be somewhere in the prototype chain of the data source, _excluding the bottom and base layers._
 *
 * Useful for checking if a member implementation exists, or for overriding or deleting a member.
 *
 * Cannot find the synonyms defined below.
 * @param string {key}
 * @returns {object|undefined} The object that owns the found member or `undefined` if not found.
 * @returns {dataRowObject[]}
 */

/**
 * @method dataModelAPI#DataSourceError
 * @returns {dataRowObject[]}
 */

/**
 * @method dataModelAPI#drillDownCharMap
 * @returns {dataRowObject[]}
 */

/**
 * @method dataModelAPI#click
 * @returns {boolean} If the row had a drill down control and the click caused it's state to change.
 */

/**
 * Synonym for {@link dataModelAPI#isDrillDown isDrillDown}.
 * @method dataModelAPI#isTree
 * @returns {boolean} If the row had a drill down control and the click caused it's state to change.
 */

/**
 * Called whenever user clicks in a data cell.
 * Synonym for isDrillDown
 * @method dataModelAPI#isDrillDown
 * @returns {boolean} If the cell is in a drill-down column.
 */

/**
 * Synonym for getRowIndex
 * @method dataModelAPI#getDataIndex
 * @returns {number}
 */

/**
 * @method dataModelAPI#getData
 * ##### Parameters:
 * @param {string} [metadataFieldName] - If provided, the output will include the row metadata object in a "hidden" field with this name.
 * @returns {dataRowObject[]}
 */

/**
 * @method dataModelAPI#getSchema
 * @desc Get list of columns. The order of the columns in the list defines the column indexes.
 *
 * On initial call and again whenever the schema changes, the data model should dispatch the `data-schema-changed` event. This tells Hypergrid to {@link module:dataModel/schema.enrich enrich} the schema and recreate the column objects.
 * @returns {columnSchema[]}
 */

/**
 * @method dataModelAPI#setSchema
 * @desc Define column indexes. May include `header`, `type`, and `calculator` properties for each column.
 *
 * When the schema changes, the data model should dispatch the `data-schema-changed` event. This tells Hypergrid to {@link module:dataModel/schema.enrich enrich} the schema and recreate the column objects.
 *
 * It is not necessary to call on every data update when you expect to reuse the existing schema.
 * ##### Parameters:
 * @param {Array.<columnSchema|string>} [newSchema] - String elements are immediately converted (by `enrich`) to columnSchema objects.
 */

/**
 * @method dataModelAPI#addRow
 */

/**
 * @method dataModelAPI#delRow
 */

/**
 * @method dataModelAPI#getValue
 * @desc Get a cell's value given its column & row indexes.
 * ##### Parameters:
 * @param {number} columnIndex
 * @param {number} rowIndex
 * @returns {string|number|boolean|null} The member with the given `columnIndex` from the data row with the given `rowIndex`.
 */

/**
 * @method dataModelAPI#setValue
 * @desc Set a cell's value given its column & row indexes and a new value.
 * ##### Parameters:
 * @param {number} columnIndex
 * @param {number} rowIndex
 * @param {*} newValue
 */

/**
 * @method dataModelAPI#setData
 * @desc Blah.
 * ##### Parameters:
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
 * ##### Parameters:
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
