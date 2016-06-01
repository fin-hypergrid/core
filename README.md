**fin-hypergrid** is an ultra-fast HTML5 grid presentation layer, achieving its speed by rendering (in a canvas tag) only the currently visible portion of your (virtual) grid, thus avoiding the latency and life-cycle issues of building, walking, and maintaining a complex DOM structure.
<img src="images/README/gridshot04.gif">

### Release 1.0

This version replaces last year's [prototype version](https://github.com/openfin/fin-hypergrid/tree/polymer-prototype), which was built around Polymer. It is now completely "de-polymerized" and is being made available as:
* An [npm module](https://www.npmjs.com/package/fin-hypergrid) for use with browserify.
* A single JavaScript file ([dev](https://openfin.github.io/fin-hypergrid/build/fin-hypergrid.js) at 2.7 MB or [min](https://openfin.github.io/fin-hypergrid/build/fin-hypergrid.min.js) at 325 KB) you can reference in a `<script>` tag.

### Demos

See the version 1.0 [demo](https://openfin.github.io/fin-hypergrid).

The prototype version's [demos](http://openfin.github.io/fin-hypergrid-polymer-demo/components/fin-hypergrid/demo.html) had some nice applications you may wish to look at for inspiration of what you can do with hypergrid and to give you some idea of the speed and responsiveness of the engine.

### Features

* Any number of rows and columns
* Grid, column, row, and cell styling
* User-resizeable columns, column-dragging, column picking
* Plug-in-able cell formatters and editors
* Smooth scrolling on both axes with the use of custom scrollbars
    * Hypergrid utilizes a custom scrollbar component so as to not be limited to tables of 33MM pixels in width or height.   In addition to the custom scrollbar, The OpenFin hypergrid utilizes row and column cell scrolling, not pixel scrolling.  This has many benefits that become apparent over time.
    <img src="images/README/gridshot03.png" alt="screenshot">

* Supports local (client-side) as well as remote (server-side) data hosting
* Events for all UI manipulations including mouse, keyboard, and programmatic UI changes
* Tree-view (drill-downs) presentation for pre-aggregated local data


##### Future development

* Tree-view presentation for remotely aggregated data

###### The Filtering & Analytics (sorting & aggregation) modules provided will be broken out of Hypergrid

* We are currently working on expanding the API to enable application developers to easily provide their own functionality
 * Hypergrid will have no opinion on how the underlying data should be pivoted, but will remain capable of presenting pivoted data
* The current filtering and analytics modules will become separate npm modules/JavaScript files that can be forked and further developed

### Documentation

Essential documentation and examples will be added to this page in the near future.

We are also maintaining [online API documentation](http://openfin.github.io/fin-hypergrid/doc/Hypergrid.html) for all public objects and modules. This documentation is necessarily a on-going work-in-progress.

* Cell Editors information can be found [here](http://openfin.github.io/fin-hypergrid/doc/tutorial-cell-editors.html)

* Cell Rendering information can be found [here](http://openfin.github.io/fin-hypergrid/doc/tutorial-cell-renderer.html)
    * There are four areas that have distinct cell renderering override capabilities.  <img src="images/README/grid-regions.png" alt="screenshot">
    * Here is an example of of using a custom renderer: <img src="images/README/customrenderer.png" alt="screenshot">

* Hypergrid configuration can be found [here](http://openfin.github.io/fin-hypergrid/doc/module-defaults.html)
    * Modifying various hypergrid features and property defaults
    * Many of the hypergrid default values and properties can be set through property overriding functions `addGlobalProperties` and `addProperties`.  The current list is:
