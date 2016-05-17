**fin-hypergrid** is an ultra-fast HTML5 grid presentation layer, achieving its speed by rendering (in a canvas tag) only the currently visible portion of your (virtual) grid, thus avoiding the latency and life-cycle issues of building, walking, and maintaining a complex DOM structure.

### Release 1.0

This version replaces last year's [prototype version](https://github.com/openfin/fin-hypergrid/tree/polymer-prototype), which was built around Polymer. It is now completely "de-polymerized" and is being made available as:
* An [npm module](https://www.npmjs.com/package/fin-hypergrid) for use with browserify.
* A single JavaScript file [fin-hypergrid.js](https://openfin.github.io/fin-hypergrid/build/fin-hypergrid.js) you can reference in a `<script>` tag.

### Demos

See the version 1.0 [demo](https://openfin.github.io/fin-hypergrid).

The prototype version's [demos](http://openfin.github.io/fin-hypergrid-polymer-demo/components/fin-hypergrid/) had some nice applications you may wish to look at for inspiration of what you can do with hypergrid and to give you some idea of the speed and responsiveness of the engine.

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

Essential documenation and examples will be added to this page in the near future.

We are also maintaining [online API documentation](http://openfin.github.io/fin-hypergrid/doc/Hypergrid.html) for all public objects and modules. This documentation is necessarily a on-going work-in-progress.

(Cell editor information can be found [here](http://openfin.github.io/fin-hypergrid/doc/tutorial-cell-editors.html).)
