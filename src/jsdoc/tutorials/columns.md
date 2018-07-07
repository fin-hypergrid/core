# Column models

This tutorial discusses grid columns, specifically:
* The various column arrays and how to access them
* Column objects and how they are generated
* How to override column properties
* How to define which columns to display
* What is a column schema and how to define one
  
### The `fields[]` array

The `hyper-analytics` npm module's interface maintains the following three arrays [source: hyper-analytics/js/DataSource.js]. These are the low-level column representations.
 
Property | set fn | get fn | Description
-------- | ------ | ------ | -----------
`fields[]` | `setFields(f)` <br> where `f` is the new fields array | `getFields()` | Defines the column indexes. Contains an ordered list of column names. These names must match the keys in the data row hash.
`headers[]` | `setHeaders(h)` <br> where `h` is the new headers array | `getHeaders()` | Defines the column headers, the strings shown at the top of each column. This array must coordinate with the `fields[]` array.
`data[]` | `setData(d)` <br> where `d` is the new data row array | `getData()` | Each row is a data hash. All row hashes are uniform (have the same keys). Only the keys listed in the `fields[]` array will be used.

Notes:
1. In the above, "fields" is synonymous with "columns."
2. The `fields[]` array can be explicitly specified when the data source is instantiated. If not specified, the `fields[]` array is automatically derived from the keys of the first data row's hash (`data[0]`). This ensures that the `fields[]` array will always be defined.
3. When automatically derived from the data, the order of the columns should be considered arbitrary, and not necessarily reflecting the order of the columns in the result set coming from the database. The reason for this is that the order of the members of a hash in JavaScript is inherently undefined.
4. Hypergrid does not in fact specify an array on instantiation (see `setData()` in dataModels/Local.js). Therefore, Hypergrid uses the derived list.
5. The `fields[]` array can also be explicitly (re)set later with `setFields()`, although again, this is not used by Hypergrid and is not needed. The only reason for specifying a `fields[]` array would be to specify an ordered subset of the columns in the data rows. However, Hypergrid now accomplishes this function at a higher level, so the order of the columns in the low-level `fields[]` array is simply unimportant.

### Column object arrays

Hypergrid maintains several column arrays in its `behavior` object. The elements of these arrays are objects that map to the `fields[]` and `headers[]` arrays, and are described in the next section.

Column array properties of `grid.behavior` include [source: hypergrid/src/behaviors/Behavior.js]:

Property | get fn | count fn | Description
-------- | ------ | -------- | -----------
`allColumns[]` | `getColumn(i)` <br> where `i` is the column index | `getColumnCount()` | Array of column objects derived from the data source's `fields[]` array, thus having the same number of elements in the same order.
`columns[]` | `getActiveColumn(j)` <br> where `j` is the active column index | `getActiveColumnCount()` | Array of column objects defining which columns to display on the grid and in what order. This array will always be a subset of the `allColumns[]` array.

#### Column order

In addition to defining which columns are active in the grid, the `columns[]` array defines the current left-to-right order of columns in the grid. The index to this array is the column's position in the grid.

Changing the order of the elements in this array effectively changes the order in which they are displayed on the grid. The "Column Picker" user interface alters this array.

Note that not all the "active" columns in the `columns[]` array will necessarily be visible at any given time due to limited horizontal space. Unless the grid is wide enough to show all the active columns, some will necessarily be (horizontally) scrolled out of view.

#### Absolute index _vs._ Active index

A column's _absolute index_ is its position within the `allColumns[]` array.
A column's _active index_ is its position in the `columns[]` array (and hence the grid).

### Column objects

There is one `Column` for each column. Each one contains denormalized data from parallel elements of the `fields[]` and `headers[]` arrays, including the array index, as follows [source: hypergrid/src/behaviors/Columns.js]:

Property | Description
-------- | -----------
`index` | The position of the column in the `fields[]` array.
`name` | The column name from the `fields[]` array; an actual database field name; a key in the data row hashes.
`header` | The column alias. Can be set explicitly or can be derived from `name`.
`type` | The data type of the column. Can be set explicitly or can be derived by inspection of the column data.

### Column schema

Column schema is a serialized hierarchical datagram that can be loaded and saved. You will need a column schema if you intend to use the **filter-tree** data filter module. Even if you do not need it for filter-tree, it is still useful standard way to define column metadata for saving and reloading.
 
The hierarchical design is optional; flat schema are perfectly valid. Arranging columns into a hierarchy is purely for display purposes. This allows users of grids with large numbers of columns to organize their data more efficiently. For example, nested columns could be shown in drop-down lists or as grouped columns with a group header above them. The number of levels of nesting is up to the app designer, although it should be pointed out that most browsers will not render drop-down groups more than one level deep. (This does not preclude writing custom drop-down controls that could do this.)

