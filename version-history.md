### 1.0.8 - 8 August 2016

* Wrapped column headers no longer overflow bottom of cell. Overflow is clipped.
* Clicking to right of last column no longer throws an error.
* Zooming out (e.g., 80%) now properly clears the grid before repainting.
* Tree-view add-on improvements:
    * *Now sorts properly* and maintains a sorted state:
        * On any column sort, applies a _group sorter_ which sorts the column as usual but then automatically stable-sorts each level of group starting with deepest and working up to the top level. (_Stable sorting_ from lowest to highest level grouping is an efficient means of sorting nested data, equivalent to starting with the highest groups and recursing down the tree to each lowest group.)
        * Because raw data order is assumed to be undefined _and_ grouping structure requires that groups be sorted, automatically applies an initial _default sort_ to the "tree" column (name or index specified in `treeColumn` option passed to `TreeView` constructor; defaults to `'name'`). If a default sort column is defined (name or index specified in `defaultSortColumn` option; defaults to the tree column), the initial sort is applied to that column instead.
        * Automatically _reapplies_ the default sort when user removes the sort. User can _change_ the sort to some other column or columns, but if user _removes_ the current sort (whatever that may be), tree column sort is added back. This guarantees that the groups will always be sorted so the drill-downs work as expected.
        * Demo: [`tree-view.html`](http://openfin.github.io/fin-hypergrid/tree-view.html)
    * *Stand-alone tree column.* To put the drill-down controls in a column of its own, do all of the following steps:
        * Add a blank column to your data which will be your tree column to hold just the drill-down controls.
        * Specify the name of your blank column to the `TreeView` constructor in `options.treeColumn`. Alternatively, call it `'name'` (the default).
        * Set the new `unsortable` property for your tree column to `true` so it cannot be sorted. As it is all blank, there is nothing to sort.
        * Set the active column order (via the grid's `columnIndexes` property). You want your blank column to appear first (_i.e.,_ on the left). Exclude the `ID` and `parentID` columns (unless you want these to appear).
        * Make the blank column (now the left-most column) a fixed column (via the grid's `fixedColumnCount` property).
        * Specify some other column for the initial sort (in `option.defaultSortColumn`). This will typically be the column that identifies the group.
        * Demo: [`tree-view-separate-drill-down.html`](http://openfin.github.io/fin-hypergrid/tree-view-separate-drill-down.html)
* *Grouped column headers* add-on (`add-ons/grouped-columns.js`):
    * Include: `<script src="http://openfin.github.io/fin-hypergrid/build/add-ons/grouped-header.js"></script>`
    * Install: `fin.Hypergrid.groupedHeader.mixInTo(grid)`
    * Usage, for example: `grid.behavior.setHeaders({ lat: 'Coords|Lat.', long: 'Coords|Long.' })`
    * The shared option `GroupedHeader.delimiter` specifies the delimiter; the default value is the vertical bar character: `'|'`
    * `setHeaders` is a convenience function that simply updates the headers of the named columns while increasing the header row height to accommodate the maximum level of grouping. The above example has only a single level of grouping; the group label is  "Coords".
    * Demo: [`grouped-header.html`](http://openfin.github.io/fin-hypergrid/grouped-header.html)
* Calculated columns are defined by assigning a "calculator" function to the column's `calculator` property. All cells in the column become calculated values.
    * Data for the column's cells may be undefined; but if defined, it is available to the calculator function, but otherwise ignored.
    * If the cell value is a function, however, legacy behavior is maintained: This function takes priority over the column function.
* Upon selecting a new operator from a column filter cell's dropdown, rather than inserting the new operator at the cursor position, the old operator is now _replaced_ by the new one the operator. If the column filter cell contains several expressions (_i.e.,_ concatenated with `and`, `or`, or `nor`), the operator in the expression under the cursor is replaced.
* Group view
    * [More notes needed.]

### 1.0.7 - 18 July 2016

* Fixed `deprecated()` calls that were discarding their results instead of returning. (So the warning was logged, but then the code would fail.)
* Rendering
    * New members added to renderer's `config` object:
        * `config.untranslatedX` - Index into full column list. (The existing `config.x` is the index into the active column list.)
        * `config.normalizedY` - Row index less an offset such that the first data row is now `0`.
        * `config.dataRow` - So can be passed to calculator function as 1st parameter.
        * `config.columnName` - So can be passed to calculator function as 2nd parameter.
    * Default renderer (SimpleCell.js)
        * Now renders `false` data primitive as "false" instead of blank.
        * Adjusted clipping region so wrapped hdr txt does not overflow y.
* Tree-view
    * Tree column is set to uneditable (while joined).
    * Moved tree-view code out of Hypergrid core, making it a small API for installing and invoking tree-view on proper data. Can be found in the new _add-ons_ folder: `./add-ons/tree-view.js` 
    * Updated "Big Pink" demo (demo/index.html and demo/js/demoj.js) and the tree-view demo (demo/tree-view.js and demo/js/tree-view.js) to use the and the API.
    * Created a drill-down API for use with aggregate view, tree view, and group view. Can also be found in the new _add-ons_ folder: `./add-ons/drill-down.js` This is a mix-in. Just included it and call it's `mixInTo` method with your data model.
* Aggregate data view
    * Reversed the order in which each column of a multi-column sort is sorted, which was backwards.
* Calculated values
    * Added parameters to cell calculator function:
        * Param #1: `dataRow` - Access to the row's other columns' raw data.
        * Param #1: `columnName` - The column name of the current column being rendered.
    * Note that cell calculator functions are called on render, on COPY operation (applied to selected rows, columns, cells, or cell regions), on sorting, and on filtering (was commented out on filter previously).
    * Note that you can also set the following cell properties to functions, which will be called with the same parameters above:
        * `color`
        * `backgroundColor`
        * `foregroundSelectionColor`
        * `backgroundSelectionColor`
* Deprecated methods
    * `dataModel.getDataSource()` &#x2192; `dataModel.dataSource`
    * `grid.getColumnSortState(columnIndex)` _(removed)_
    * `grid.removeColumnSortState(columnIndex, sortPosition)` _(removed)_
* Edits to documentation, especially to:
    * [Cell editors](http://openfin.github.io/fin-hypergrid/doc/tutorial-cell-editors.html) tutorial.
    * [Cell renderers](http://openfin.github.io/fin-hypergrid/doc/tutorial-cell-renderers.html) tutorial.

### 1.0.6 - 23 June 2016

* Added [fin-hypergrid.min.js](https://openfin.github.io/fin-hypergrid/build/fin-hypergrid.min.js) which was omitted from original release due to a technical issue.
* Added "treeview" support for self-joined tables:
    * Self-joined tables have both a primary key column and a foreign key column that refers to a "parent" record in the same table.
    * The default names for these columns are "ID" and "parentID" but alternate names can be specified.
    * One column is specified as the "tree" column and is displayed as an interactive drill-down with right or down triangles.
    * The default name for the tree column is "name" but an alternate name can be specified.
    * Implemented as a new "data source" in hyper-analytics module.
    * Tree view is switch on and off by calling a new method: `behavior.setRelation(options)` &mdash; where `options` specifies the alternate column names.
* Updated all "dependencies" in package.json to exact version numbers. Specifically, npm's default version numbers use the semver "^" operator. This operator has been removed in favor of the (implied) "=" operator.
* Fixed cell editor's error feedback count; error explanation now appears after every third failed attempt to save.
* Active column interface methods have been renamed to more accurately describe their function ("VisibleColumns" was already in use in Renderer.js to mean something different) (old methods retained for now with deprecation warnings):
    * `behavior.getVisibleColumn(index)` &#x2192; `behavior.getActiveColumn(index)`
    * `behavior.getColumnCount(index)` &#x2192; `behavior.getActiveColumnCount(index)`
    * `behavior.getVisibleColumns()` &#x2192; `behavior.getActiveColumns()`
    * `dataModel.getVisibleColumns()` &#x2192; `dataModel.getActiveColumns()`
* Changed calling signature (old signature retained for now as an overload but with a deprecation warning):
    * `grid.editAt(cellEditor, editPoint)` &#x2192; `grid.editAt(editPoint)`
* Some extraneous methods have been removed (old methods have generally retained for now with deprecation warnings):
    * Removed `behavior.getVisibleColumnName(index)` &#x2192; `behavior.getActiveColumn(index).name`
    * Removed `behavior.getColumnId(index)` &#x2192; `behavior.getActiveColumn(index).header`
    * Removed `behavior.getHeader(index)` &#x2192; `behavior.getActiveColumn(index).header`
    * Removed `grid.registerCellEditor(Constructor, name)` &#x2192; `grid.cellEditors.add(name, Constructor)`
    * Removed `grid.createCellEditor(name)` &#x2192; `grid.cellEditors.create(name)`
    * Removed `grid.getCellProvider().xxxx` &#x2192; `grid.cellRenderers.get('xxxx')`
    * Removed `behavior.getCellProvider().xxxx` &#x2192; `grid.cellRenderers.get('xxxx')`
    * Removed `behavior.getCellProvider().xxxx` &#x2192; `grid.cellRenderers.get('xxxx')`
    * Removed `behavior.createCellProvider()`. No replacement; do not call. Previously called by `Behavior` constructor; `new CellRenderers()` is now called by `Hypergrid` constructor instead.
    * Removed `grid.registerLocalizer` &#x2192; `grid.localization.add(name, localizer)`
    * NOTE: First parameter `name` for `cellEditors.add`, `cellRenderers.add`, `localization.add` is now _optional_, deferring to the class name in the constructor supplied as the second parameter (now the first).
* Changed some labels in Column Picker to reflect our actual terminology:
    * Hidden Columns &#x2192; Inactive Columns
    * Visible Columns &#x2192; Active Columns
* `Column.prototype.getCellProperties()` now returns `{}` (empty object) rather than `undefined` if there were no cell properties.
* Fixed a defect in the validator generated by the `localization.DateFormatter()` factory function that was preventing successful editing of dates using such localizers.
* Made `column.header` into a getter/setter (local property: `_header`) so that _setting_ the header here will update the actual header displayed in the grid, as expected.
* Changed the default `'number'` formatter's maximum fractional digits to 0 instead of 3 (`Intl.NumberFormat`'s default).
* Rather than suppressing formatting all together when you don't like the default, best practice is to define your own grid-wide standard (default) format using the localization option on grid instantiation (or redefining the defaults in `Hypergrid.localization`).
* Fixed the "row styling" example (demo dashboard checkbox).
* Fixed the "Reset" function (demo dashboard button).
* Removed the overly "opinionated" editor/renderer/type render property name cascade. Specifically:
    * Render property 'editor' no longer defaults to render property 'format'; you can add this logic to your `dataModel.getCellEditorAt` override if you want it.
    * Render property 'format' no longer defaults to render property 'type'; you can add this logic to your `dataModel.getCell` override if you want it.
* The `autoPopulate` render property is deprecated; use `{ editor: 'combobox' }` instead.
* Added "hh:mm" localizer example to *demo.js*.
* Added new column `birthTime` to *widedata.js*.
* Expanded [cell editors tutorial](http://openfin.github.io/fin-hypergrid/doc/tutorial-cell-editors.html).

#### Cell renderers and editors

Refactored cell renderer interface calls to parallel the cell editor model:
* Each grid instantiation instantiates:
    * a new `CellRenderers` object as `grid.cellRenderers` &mdash; gets its own registry initialized with standard renderers
    * a new `CellEditors` object as `gird.cellEditors` &mdash; gets its own registry initialized with standard editors
* These instances get their own registry, initialized with the standard renderers and editors, respectively.
* While both `grid.cellRenderers.add()` and `grid.cellEditors.add()` take a constructor as an argument, note the following conceptual difference between the cell editor and cell renderer registries:
    * Cell editors objects remain as constructors used to create the current cell renderer only when needed.
    * Cell renderer objects are instantiated singleton instances.
* Added a new `renderer` render property so cell renderers can now be set declaratively like cell editors (in addition to programmatically). The default value (at the grid level) is 'SimpleCell'.
* Moved the overrideable `cellProvider.getCell()` (for programmatically selecting cell renderers) to `dataModel.getCell()` in parallel with cell editor's `dataModel.getCellEditorAt()`.
* "Cell provider" has been broken up. The API is now instanced by each grid from `CellRenderers`.
* Cell renderers are now separate files; all extend from the `CellRenderer` base class.
* Renamed `editorPoint` to `editPoint` wherever it appeared inside of `CellEditor.prototype` for naming consistency.
* Cleared cruft, simplifying the internal implementations of:
    * `Hypergrid.prototype.onEditorActivate`
    * `Hypergrid.prototype.editAt`
    * `CellEditor.prototype.beginEditing` (formerly `beginEditAt`)

##### `getCellEditorAt`

The overrideable `dataModel.getCellEditorAt()` method for programmatically selecting cell editors is now called with two new additional parameters:
* `declaredEditorName` - Your override of this method may choose to respect or replace this name. It then is expected to either use it to access a cell renderer constructor from the cell renderer registry _or_ use some other constructor. In any case, it must instantiate and return a cell editor.
* `options` - See the [getCellEditorAt](http://localhost:63342/fin-hypergrid/doc/DataModel.html#getCellEditorAt) API entry for details.

#### `getCell`

The overrideable `dataModel.getCell()` (formerly `dataModel.getCellEditorAt()`) method for programmatically selecting cell renderers is now called with an additional parameter:
* `declaredRendererName` - Your override of this method may choose to respect or update this name. It then is expected to use it to fetch and return a cell renderer singleton from the cell renderer registry.

#### Localizers:
* New: `grid.localization` &#x2192; a grid-specific instance of `Localization`
* Renamed (old method retained for now with deprecation warning): `localization.set` &#x2192; `localization.add`
* New: `Hypergrid.localization` &#x2192; a shared defaults for `locale`, `numberOptions`, and `dateOptions` if constructor's `options.localization` object is missing or is missing any of those individual properties.
* Renamed [localizer](http://openfin.github.io/fin-hypergrid/doc/localizerInterface.html) methods so they are more descriptive of their actual functions:
    * `.localize(value)` &#x2192; `.format(value)`
    * `.standardize(value)` &#x2192; `.parse(value)`
* A cell editor's localizer is no longer overridden with 'null' on instantiation, allowing the inherited localizer to be seen. There is now a default localizer 'null' for text cell editors in Textfield.prototype.localizer which simply invokes `toString()` for both `.format()` and `.parse()`.)

#### Filter plug-in:
* Fixed `grid.setTableFilter()`.
* CQL (Column Query Language, the filter cell syntax) now accepts optional quotation marks and parentheses around operands. Quotation character is escaped by doubleing it. The actual quotation character a shared prop (default is double-quote character).
* CQL now considers operators to be reserved words. User is now warned when operand is missing or an (unquoted/unparenthesized) operand contains additional operators.
* Updated `behavior.setData(data)` &#x2192; `behavior.setData(data, schema)` where the new `schema` parameter is optional. If you don't supply it, it will be derived from the fields list. This parallels the current grid instantiation logic when supplying `data` and `schema` in the options object for the first implicit `setData` call. (The current options object is under review and may be altered substantially in the next sprint.)
* Manage Filters: Fixed some bugs with the CQL and SQL tabs
* Internally, restored `conditionals` formal parameter to filter-tree's `FilterLeaf.prototype.getSyntax` because removing it broke SQL generator. Restored actual parameter in `DefaultFilter`'s call.
* Known issue: Filter does currently searches "formulas" (unformatted data). It does not search "values" (formatted data). (These terms are from Excel.) Searching formatted data would require formatting all the data on every search which is super-expensive. Normally, only visible data needs to be formatted -- a very small manageable number of rows.


### 1.0.3 - 27 May 2016

_Initial release._
