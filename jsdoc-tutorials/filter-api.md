The essential Application Programming Interface for a filter module is:

```javascript
var filter = new DefaultFilter();
filter.setState(state);
state = filter.getState();
filter.test(dataRow);
```

When used with Hypergrid, setting filter state should always be followed by:
1. Filter validation (`grid.getGlobalFilter().invalid()`).
2. Filter execution (`grid.behavior.dataModel.applyAnalytics()`).
3. Update the grid canvas (`grid.repaint()`).

The following helper methods do these tasks for you. However, the convenience comes at the cost of running these follow-up tasks _whenever_ you make a change to the global filter when in fact they should only be once, at the end of your event loop. Using the helper functions makes it easy to forget this.

_NOTE: The "shy" hyphens that may appear in the identifiers below should not be taken literally._

module | Hypergrid | behavior | dataModel | DefaultFilter | hyper-analytics | filter-tree
--- | --- | --- | --- | --- | --- | ---
_file_ | Hypergrid.js | Behavior.js | dataModel/JSON.js | DefaultFilter.js | DataSource&shy;GlobalFilter.js | &mdash;
_prefix_ | `grid.` | `grid.behavior.` | `grid.behavior.dataModel.` | `grid.getGlobalFilter().` | &mdash; | `grid.getGlobalFilter().`
_set up_ | [getGlobalFilter()]{@link Hypergrid#getGlobalFilter} | [getGlobalFilter()]{@link Behavior#getGlobalFilter} | [getGlobalFilter()]{@link dataModels.JSON#getGlobalFilter} | &mdash; | [get(filter)]{@link http://openfin.github.io/hyper-analytics/DataSourceGlobalFilter.html#get} | &mdash;
 | [setGlobalFilter(filter)]{@link Hypergrid#setGlobalFilter}<sup>1</sup> | [setGlobalFilter(filter)]{@link Behavior#setGlobalFilter} | [setGlobalFilter(filter)]{@link Hypergrid#setGlobalFilter}<sup>2</sup> | &mdash; | [set(filter)]{@link http://openfin.github.io/hyper-analytics/DataSourceGlobalFilter.html#set} | &mdash;
_properties_ | [setGlobalFilter&shy;CaseSensitivity(&#x200b;isSensitive)]{@link Hypergrid#setGlobalFilterCaseSensitivity}<sup>1</sup> | [setGlobalFilter&shy;CaseSensitivity(&#x200b;isSensitive)]{@link Behavior#setGlobalFilterCaseSensitivity} | [setGlobalFilter&shy;CaseSensitivity(&#x200b;isSensitive)]{@link dataModels.JSON#setGlobalFilterCaseSensitivity} | &mdash; | &mdash; | [setCaseSensitivity(&#x200b;isSensitive)]{@link http://joneit.github.io/filter-tree/FilterTree.html#setCaseSensitivity}
_grid state_ | &mdash; | &mdash; | &mdash; | &mdash; | &mdash; | [getState(options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#getState}<sup>8</sup>
 | &mdash; | &mdash; | &mdash; | &mdash; | &mdash; | [setState(state, options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState}<sup>8</sup>
_column_ | [getFilter(&#x200b;columnIndexOrName, options)]{@link Hypergrid#getFilter} | [getFilter(&#x200b;columnIndexOrName, options)]{@link Behavior#getFilter} | [getFilter(&#x200b;columnIndexOrName, options)]{@link dataModels.JSON#getFilter}<sup>3</sup> | [getColumnFilterState(&#x200b;columnIndexOrName, options)]{@link DefaultFilter#getColumnFilterState}<sup><sup>4, 5</sup></sup> | &mdash; | [getState(options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#getState}<sup>8</sup>
 | [setFilter(&#x200b;columnIndexOrName, state, options)]{@link Hypergrid#setFilter}<sup>1</sup> | [setFilter(&#x200b;columnIndexOrName, state, options)]{@link Behavior#setFilter} | [setFilter(&#x200b;columnIndexOrName, state, options)]{@link dataModels.JSON#setFilter}<sup><sup>2, 3</sup></sup> | [setColumnFilterState(&#x200b;columnIndexOrName, state, options)]{@link DefaultFilter#setColumnFilterState}<sup><sup>4, 5, 7</sup></sup> | &mdash; | [setState(state, options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState}<sup>8</sup>
_columns_ | [getFilters(options)]{@link Hypergrid#getFilters} | [getFilters(options)]{@link Behavior#getFilters} | [getFilters(options)]{@link dataModels.JSON#getFilters} | [getColumnFiltersState(&#x200b;options)]{@link DefaultFilter#getColumnFiltersState} | &mdash; | [getState(options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#getState}<sup>8</sup>
 | [setFilters(options)]{@link Hypergrid#setFilters}<sup>1</sup> | [setFilters(options)]{@link Behavior#setFilters} | [setFilters(options)]{@link dataModels.JSON#setFilters}<sup>3</sup> | [setColumnFiltersState(&#x200b;state, options)]{@link DefaultFilter#setColumnFiltersState}<sup>7</sup> | &mdash; | [setState(state, options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState}<sup>8</sup>
_table_ | [getTableFilter(options)]{@link Hypergrid#getTableFilter} | [getTableFilter(options)]{@link Behavior#getTableFilter} | [getTableFilter(options)]{@link dataModels.JSON#getTableFilter} | [getTableFilterState(options)]{@link DefaultFilter#getTableFilterState}<sup>6</sup> | &mdash; | [getState(options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#getState}<sup>8</sup>
 | [setTableFilter(state, options)]{@link Hypergrid#setTableFilter}<sup>1</sup> | [setTableFilter(state, options)]{@link Behavior#setTableFilter} | [setTableFilter(state, options)]{@link dataModels.JSON#setTableFilter}<sup>2</sup> | [setTableFilterState(state, options)]{@link DefaultFilter#setTableFilterState}<sup>6, 7</sup> | &mdash; | [setState(state, options)]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState}<sup>8</sup>
_test_ | &mdash; | &mdash; | [applyAnalytics()]{@link dataModels.JSON#applyAnalytics} | &mdash; | [apply()]{@link http://openfin.github.io/hyper-analytics/DataSourceGlobalFilter.html#apply} | [test(dataRow)]{@link http://joneit.github.io/filter-tree/FilterTree.html#test}

<sup>1</sup> Updates the grid canvas (calls [repaint()]{@link Hypergrid#repaint}) after the set call.<br>
<sup>2</sup> Translates index to name before the set call.<br>
<sup>3</sup> Runs the filter (calls [applyAnalytics()]{@link Hypergrid#applyAnalytics}) after the set call.<br>
<sup>4</sup> `options.syntax` may also include `'CQL'` in addition to standard values.<sup>8</sup> `'CQL'` is the default syntax for these calls.<br>
<sup>5</sup> Creates/maintains a "flat" subexpression for each column in the right "trunk" with left operand bound to that column specifically.<br>
<sup>6</sup> Replaces left "trunk" with hierarchical subexpression.<br>
<sup>7</sup> Validates `state`.<br>
<sup>8</sup> `options.syntax` may be `'auto'`, `'object'`, `'JSON'`, or `'SQL'`.
