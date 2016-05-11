*fin-hypergrid* is an ultra-fast HTML5 grid presentation layer, achieving its speed by rendering (in a canvas tag) only the currently visible portion of your (virtual) grid, thus avoiding the latency and life-cycle issues of building, walking, and maintaining a complex DOM structure.

 ### Release 1.0

 This version replaces last year's prototype, which was built around Polymer. It is now completely "de-polymerized" and is being made available as:
 * An [npm module](https://www.npmjs.com/package/fin-hypergrid) on npmpjs.org for use with browserify.
 * JavaScript files ([dev](https://openfin.github.io/fin-hypergrid/build/fin-hypergrid.js), [min](https://openfin.github.io/fin-hypergrid/build/fin-hypergrid.min.js)) on github.io for reference in a `<script>` tag.

 ### Features

 * Any number of rows and columns
 * Grid, column, row, and cell styling
 * User-resizeable columns, column-dragging, column picking
 * Plug-in-able cell formatters and editors
 * Smooth scrolling on both axes
 * Supports local (client-side) as well as remote (server-side) data hosting
 * Comes with default "analytics" modules (sorting, filtering, aggregation)
 * Events for all UI manipulations including mouse, keyboard, and programmatic UI changes
 * Tree-view (drill-downs) support for aggregated local data

 ##### Future development

 * The analytics modules will be plug-in-replaceable in a future release (at which point the default modules will be broken out into separate npm modules/JavaScript files)
 * Tree-view support for remotely aggregated data

 ### Documentation

 Essentials will be added to this page in the near future, with examples.

 We are also maintaining [online API documentation](http://openfin.github.io/fin-hypergrid/doc/Hypergrid.html) for all public objects and modules. Note that this documentation is a on-going work-in-progress.

 (Cell editor information can be found [here](http://openfin.github.io/fin-hypergrid/doc/cell-editors.html).)
