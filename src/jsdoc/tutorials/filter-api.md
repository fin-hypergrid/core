### Background

A filter module defines an object representing a filter expression. The object should be able to:
* **Load state** for a complete expression, or modify state by adding, modifying, or deleting nodes in the expression tree.
* **Save state** to persist it for reload in subsequent sessions.
* **Filter local data** by supporting a `test()` method for testing data rows against the filter.
* **Filter remote data** by extracting the filter state, which is then sent to the remote data server, which in turn re-runs the query, creating a new result set, which it then sends back to the client for display.

#### What is an expression tree?

An expressions tree is a hierarchical arrangement of nodes. There are two types of nodes, roots/branches and leaves. A tree consists of a root node which may contain as its child nodes either other expressions (branches, or subexpressions, or subtrees) and/or conditional expressions (terminal nodes, or leaves).

The conditional expressions are terminal nodes, having no child nodes of their own. Each conditional expression node has a column name, relational operator, and a single operand. The operand may be either a literal value or another column name.

It may be helpful to think of subtrees as the parenthesized subexpressions in boolean algebra, or in a SQL [search condition]{@link https://msdn.microsoft.com/en-us/library/ms173545.aspx}. In fact, a useful feature of a filter module would be to generate SQL search condition expressions which can be used by a remote server to run a query.

### The API in a nutshell

Hypergrid models its filter module interface on the [filter-tree]{@link https://github.com/joneit/filter-tree} project.
(For more about filter-tree, a good place to start is its [Theory of Operation page]{@link http://joneit.github.io/filter-tree/doc/tutorial-TOP.html}).

The essential Application Programming Interface for a filter module is:

```javascript
var filter = new FilterTree(options);
filter.setState(state);
state = filter.getState();
filter.test(dataRow); // for local filtering
```

### Filter objects and filter modules

Instead of `FilterTree` in the above, you could use any object extended therefrom. You can also use another object entirely from any other filter module, so long as it supports the above essential API calls, instantiation, `setState`, `getState`, and the filter's main task, `test()`, which inspects each row in the result set, comparing it to the current filter expression (or "state") to determine if the row is to be included in the next grid render or not.

Hypergrid includes a default filter object, called {@link DefaultFilter}, extended from [FilterTree]{@link http://joneit.github.io/filter-tree/FilterTree.html}. Whenever you point your grid at some new data (such as upon instantiation a new {@link Hypergrid} object or on a subsequent call to {@link behaviors.JSON#setData}), a call is made to the {@link Behavior#getNewFilter} method to instantiate a new default filter object for you.

The application programmer has full control of the type of filter to use and how it is set up. You can override the `getNewFilter()` method to instantiate a `DefaultFilter` with your own specific options; or you may instantiate a different filter object entirely. Alternatively, you can instantiate a new filter at any time and hand it to the grid by way of the {@link Hypergrid#filter} setter.

### Hypergrid's filter

The `DefaultFilter` extension supports Hypergrid's filter requirements. Hypergrid adds some additional semantics to the generic filter expression, maintaining two trunks (nodes that may be empty) off the root node:
* **The left trunk** (`filter.children[0]` or `filter.columnFilters`) is for a general table filter that may contain arbitrarily complex hierarchy of subexpressions, referencing any columns.
* **The right trunk** (`filter.children[1]` or `filter.tableFilter`) is for the subexpressions in the column filter cells at the top of each column, under the header. This trunk only contains subexpressions, one for each column with something in its filter cell, and is only ever one level deep. That is, column filters cannot have subexpressions themselves.

### Filter schema

Filters should be instantiated with a column schema, an array of {@link http://joneit.github.io/pop-menu/global.html#menuItem|menuItem} objects. A column schema informs the filter of the names of the available columns and can be a simple as an array of strings. Or it can be an array of objects, or a mixture of strings and objects. The objects can contain additional column information such as alias (header) and type. A schema item can also be a nested schema array. The purpose of this is merely to create hierarchical drop-downs of column names. (Although note that only one level of nesting is generally supported by browsers.)

{@link Behavior#getNewFilter} crates a default column schema from the {@link Behavior#columns|columns} array.

### Filter integration with Hypergrid

In any case, after any call that sets state on the filter, all three of the following actions _must_ be performed before the next grid render or you will not see the results of the change of state:
1. **Filter validation** (`grid.filter.invalid()`).<br> In addition to validating the filter state, this method also sets some internal state for efficient subsequent execution of the critical `test()` method.
2. **Filter execution** (`grid.behavior.dataModel.applyAnalytics()`).<br> This is what calls the filter's `test()` method on every data row. This is expensive and should not be called more often than necessary!
3. **Update the grid canvas** (`grid.behaviorChanged()` which calls `.repaint()`).<br> Must be called at least once before the next animation frame in order to see the results of the filtering.

### Filter helper methods

The following Hypergrid convenience methods do some of these tasks for you.

This table is read from left to right. Each method calls the method to its right. The methods on the left represent the outer layer; they are higher level and do more than the methods on the right.

_NOTE: The "shy" hyphens that may appear in the identifiers below should not be taken literally._

module | Hypergrid | behavior | dataModel | DefaultFilter | hyper-analytics | filter-tree
--- | --- | --- | --- | --- | --- | ---
_file_ | Hypergrid.js | Behavior.js | dataModel/JSON.js | DefaultFilter.js | DataSource&shy;GlobalFilter.js | &mdash;
_prefix_ | `grid.` | `grid.behavior.` | `grid.behavior.dataModel.` | `grid.filter.` | &mdash; | `grid.filter.`
_set up_ | [filter]{@link Hypergrid#filter} | [filter]{@link Behavior#filter} | [filter]{@link dataModels.JSON#filter} | &mdash; | [get(filter)]{@link http://openfin.github.io/hyper-analytics/DataSourceGlobalFilter.html#get} | &mdash;
 | [filter]{@link Hypergrid#filter}<sup>1</sup> = filter | [filter]{@link Behavior#filter} = filter | [filter]{@link dataModels.JSON#filter}<sup>2</sup> = filter | &mdash; | [set(filter)]{@link http://openfin.github.io/hyper-analytics/DataSourceGlobalFilter.html#set} | &mdash;
_properties_ | [filterProp(&#x200b;'caseSensitiveData', isSensitive)]{@link Hypergrid#filterProp}<sup>1</sup> | [filterProp(&#x200b;'caseSensitiveData', isSensitive)]{@link Behavior#filterProp} | [filterProp(&#x200b;'caseSensitiveData', isSensitive)]{@link dataModels.JSON#filterProp} | [prop({ caseSensitiveData: isSensitive })]{@link DefaultFilter#filterProp}
_grid state_ | &mdash; | &mdash; | &mdash; | &mdash; | &mdash; | [getState(options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#getState}<sup>8</sup>
 | &mdash; | &mdash; | &mdash; | &mdash; | &mdash; | [setState(state, options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState}<sup>8</sup>
_column_ | [getFilter(&#x200b;columnIndexOrName, options)]{@link Hypergrid#getFilter} | [getFilter(&#x200b;columnIndexOrName, options)]{@link Behavior#getFilter} | [getFilter(&#x200b;columnIndexOrName, options)]{@link dataModels.JSON#getFilter}<sup>3</sup> | [getColumnFilterState(&#x200b;columnIndexOrName, options)]{@link DefaultFilter#getColumnFilterState}<sup><sup>4, 5</sup></sup> | &mdash; | [getState(options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#getState}<sup>8</sup>
 | [setFilter(&#x200b;columnIndexOrName, state, options)]{@link Hypergrid#setFilter}<sup>1, 9</sup> | [setFilter(&#x200b;columnIndexOrName, state, options)]{@link Behavior#setFilter} | [setFilter(&#x200b;columnIndexOrName, state, options)]{@link dataModels.JSON#setFilter}<sup><sup>2, 3</sup></sup> | [setColumnFilterState(&#x200b;columnIndexOrName, state, options)]{@link DefaultFilter#setColumnFilterState}<sup><sup>4, 5, 7</sup></sup> | &mdash; | [setState(state, options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState}<sup>8</sup>
_columns_ | [getFilters(options)]{@link Hypergrid#getFilters} | [getFilters(options)]{@link Behavior#getFilters} | [getFilters(options)]{@link dataModels.JSON#getFilters} | [getColumnFiltersState(&#x200b;options)]{@link DefaultFilter#getColumnFiltersState} | &mdash; | [getState(options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#getState}<sup>8</sup>
 | [setFilters(options)]{@link Hypergrid#setFilters}<sup>1, 9</sup> | [setFilters(options)]{@link Behavior#setFilters} | [setFilters(options)]{@link dataModels.JSON#setFilters}<sup>3</sup> | [setColumnFiltersState(&#x200b;state, options)]{@link DefaultFilter#setColumnFiltersState}<sup>7</sup> | &mdash; | [setState(state, options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState}<sup>8</sup>
_table_ | [getTableFilter(options)]{@link Hypergrid#getTableFilter} | [getTableFilter(options)]{@link Behavior#getTableFilter} | [getTableFilter(options)]{@link dataModels.JSON#getTableFilter} | [getTableFilterState(options)]{@link DefaultFilter#getTableFilterState}<sup>6</sup> | &mdash; | [getState(options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#getState}<sup>8</sup>
 | [setTableFilter(state, options)]{@link Hypergrid#setTableFilter}<sup>1</sup> | [setTableFilter(state, options)]{@link Behavior#setTableFilter} | [setTableFilter(state, options)]{@link dataModels.JSON#setTableFilter}<sup>2</sup> | [setTableFilterState(state, options)]{@link DefaultFilter#setTableFilterState}<sup>6, 7</sup> | &mdash; | [setState(state, options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState}<sup>8</sup>
_test_ | &mdash; | &mdash; | [applyAnalytics()]{@link dataModels.JSON#applyAnalytics} | &mdash; | [apply()]{@link http://openfin.github.io/hyper-analytics/DataSourceGlobalFilter.html#apply} | [test(dataRow)]{@link http://joneit.github.io/filter-tree/FilterTree.html#test}

<sup>1</sup> Updates the grid canvas (calls [behaviorChanged()]{@link Hypergrid#behaviorChanged}) after the set call.<br>
<sup>2</sup> Translates index to name before the set call.<br>
<sup>3</sup> Runs the filter (calls [applyAnalytics()]{@link Hypergrid#applyAnalytics}) after the set call.<br>
<sup>4</sup> `options.syntax` may also include `'CQL'` in addition to standard values.<sup>8</sup> `'CQL'` is the default syntax for these calls.<br>
<sup>5</sup> Creates/maintains a "flat" subexpression for each column in the right "trunk" with left operand bound to that column specifically.<br>
<sup>6</sup> Replaces left "trunk" with hierarchical subexpression.<br>
<sup>7</sup> Validates `state`.<br>
<sup>8</sup> `options.syntax` may be `'auto'`, `'object'`, `'JSON'`, or `'SQL'`.<br>
<sup>9</sup> Removes visible filter cell editor from the grid before proceeding.
 
#### Caveat

The convenience that these helper methods give you come at a cost. Running these follow-up tasks _whenever_ you make a change to the global filter is not always called for. In the case of `applyAnalytics`, in particular, it should _not_ be called more than be once due to the expense in doing so. Ideally, they should just be called one time, at the end of your event loop. Using the helper functions makes it easy to forget this. Therefore, use them sparingly and intelligently, calling the underlying methods instead when it makes sense to do so.

### Examples

