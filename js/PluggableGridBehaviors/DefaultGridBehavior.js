'use strict';
//### Pluggable Grid Behaviors

//The OFGrid design makes no assumptions about the data you wish to view which allows for external data sources and external manipulation and analytics.  Manipulations such as sorting, aggregation, and grouping can be achieved using best of breed high-performant real time tools designed for such purposes. All the code that impacts these operations has been factored into an Object called PluggableGridBehavior. A PluggableGridBehavior can be thought of as a traditional tablemodel but with a liitle more responsibility.  The Three Pluggable Grid Behavior objects can be found in the src/scripts/PluggableGridBehaviors subdirectory

(function() {
    var root = this;

    var DefaultCellProvider = root.fin.wc.hypergrid.DefaultCellProvider;

    var noop = function() {};

    // DefaultGridBehavior is the base class for the GridBehavior role in the design of the OpenFin grid.  Not only does it accomodate the interface getData(x,y) and setData(x,y) of a traditional table model, it encapsulates the behavior that allows its implementation to determine what happens on various click events. This allows for external data analytics tools to do sorting, drilling down, aggregation etc.

    function DefaultGridBehavior() {
        Object.call(this);
        this.constants = root.fin.wc.hypergrid.constants;
        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.renderedWidth = 30;
        this.renderedHeight = 60;
        this.values = {}; //for overriding with edit values;
        var cellProvider = this.createCellProvider();
        this.getCellProvider = function() {
            return cellProvider;
        };
    }

    var proto = DefaultGridBehavior.prototype = Object.create(Object.prototype);

    proto.constructor = DefaultGridBehavior;

    //override this function on your GridBehavior to have custom cell renderering
    //<br>see [QGridBehavior.createCellProvider()](QGridBehavior.html) for an example
    proto.createCellProvider = function() {
        return new DefaultCellProvider();
    };

    //provide the data at the x,y coordinate in the grid
    //<br>this function should be overridden by you
    proto.getValue = function(x, y) {
        var override = this.values['p_' + x + '_' + y];
        if (override) {
            return override;
        }
        return '(' + x + ', ' + y + ')';
    };

    //set the data at the x, y
    //<br>this function should be overridden by you
    proto.setValue = function(x, y, value) {
        this.values['p_' + x + '_' + y] = value;
    };

    //fixed rows are the static rows at the top of the grid that don't scroll up or down
    //<br>they can be arbitary width by height in size
    //<br>here we just return an excel-ish base-26 alpha value
    proto.getFixedRowValue = function(x /*, y*/ ) {
        return this.alphaFor(x);
    };

    //fixed cols are the static cols at the left of the grid that don't scroll up or down
    //<br>they can be arbitary width by height in size
    //<br>here we just return an excel-ish base-26 alpha value
    proto.getFixedColValue = function(x, y) {
        return this.alphaFor(y);
    };

    //can be dynamic if your data set changes size
    proto.getRowCount = function() {
        return 5000;
    };

    //can be dynamic if your data set changes size
    proto.getColCount = function() {
        return 300;
    };

    //can be dynamic for supporting "floating" fixed rows
    //<br>floating rows are rows that become fixed if you
    //<br>scroll past them
    proto.getFixedRowCount = function() {
        return 1;
    };

    //pixel height of the fixed rows area
    proto.getFixedRowsHeight = function() {
        var count = this.getFixedRowCount();
        var total = 0;
        for (var i = 0; i < count; i++) {
            total = total + this.getFixedRowHeight(i);
        }
        return total;
    };

    //the height of the specific fixed row
    proto.getFixedRowHeight = function(r) {
        noop(r);
        return this.constants.rowHeight;
    };

    //the potential maximum height of the fixed row area
    //<br>TODO: move this logic into the OFGrid itself
    //<br>there should only be getFixedRows, and getMaxFixedRows
    proto.getFixedRowsMaxHeight = function() {
        var height = (0 + this.getFixedRowCount()) * (this.constants.rowHeight);
        return height;
    };

    //can be dynamic for supporting "floating" fixed cols
    //<br>floating cols are cols that become fixed if you
    //<br>scroll past them
    proto.getFixedColCount = function() {
        return 1;
    };

    //pixel width of the fixed cols area
    proto.getFixedColsWidth = function() {
        var count = this.getFixedColCount();
        var total = 0;
        for (var i = 0; i < count; i++) {
            total = total + this.getFixedColWidth(i);
        }
        return total;
    };

    //the potential maximum width of the fixed col area
    //<br>TODO: move this logic into the OFGrid itself
    //<br>there should only be getFixedCols, and getMaxFixedCols
    proto.getFixedColsMaxWidth = function() {
        var width = (0 + this.getFixedColCount()) * (this.constants.colWidth);
        return width;
    };

    //the width of the specific fixed col
    proto.getFixedColWidth = function(c) {
        noop(c);
        var width = this.constants.colWidth;
        return width;
    };

    //this is here just to provide an example of arbitrary
    //column widths<br>heights could be done the same way
    //<br>TODO: this colwidth example should be pushed into
    //<br>InMemoryGridBehavior
    var widths = [100, 100, 80, 90, 80, 150, 100, 80, 80, 100];

    //can be dynamic if we wish to allow users to resize
    //<br>or driven by data, etc...
    proto.getRowHeight = function( /* rowNum */ ) {
        return this.constants.rowHeight;
    };

    //can be dynamic if we wish to allow users to resize
    //<br>or driven by data, etc...
    //<br>this implementation is driven by modulo
    //<br>TODO: move this example into InMemoryGridBehavior
    proto.getColWidth = function(colNumber) {
        //return this.constants.colWidth;
        return widths[colNumber % 10];
    };

    //this is set by OFGrid on scroll
    //<br>this allows for fast scrolling through rows of very large external data sets
    //<br>this is ignored by in memory GridBehaviors
    proto.setScrollTop = function(y) {
        this.scrollTop = y;
        this.changed();
    };

    //this is set by OFGrid on scroll
    //<br>this allows for fast scrolling through cols of very large external data sets
    //<br>this is ignored by in memory GridBehaviors
    proto.setScrollLeft = function(x) {
        this.scrollLeft = x;
        this.changed();
    };

    //the number of viewable columns we just rendered
    //<br>set by OFGrid on every repaint
    proto.setRenderedWidth = function(width) {
        this.renderedWidth = width;
    };

    //the number of viewable rows we just rendered
    //<br>set by OFGrid on every repaint
    proto.setRenderedHeight = function(height) {
        this.renderedHeight = height;
    };

    //answers the default col alignment for the main data area of the grid
    //<br>TODO:provide uniform mechanism for the fixed areas like this
    proto.getColAlignment = function( /* x */ ) {
        return 'center';
    };

    //this is called by OFGrid when a fixed row cell is clicked
    //<br>see DefaultGridBehavior.delegateClick() below
    //<br>this is where we can hook in external data manipulation such as linking,
    //<br>drilling down on rows, etc...
    proto.fixedRowClicked = function(grid, mouse) {
        console.log('fixed row clicked: ' + mouse.cell.x, mouse);
    };

    //this is called by OFGrid when a fixed col cell is clicked
    //<br>see DefaultGridBehavior.delegateClick() below
    //<br>this is where we can hook in external data manipulation such as sorting,
    //<br>hiding/showing columns, etc...
    proto.fixedColClicked = function(grid, mouse) {
        console.log('fixed col clicked: ' + mouse.cell.y, mouse);
    };

    //this is called by OFGrid when a fixed cell is clicked
    proto.delegateClick = function(grid, mouse) {
        if (mouse.cell.y < this.getFixedRowCount()) {
            this.fixedRowClicked(grid, mouse);
        } else if (mouse.cell.x < this.getFixedColCount()) {
            this.fixedColClicked(grid, mouse);
        }
    };

    //this is called by OFGrid when a fixed cell is clicked
    //<br>TODO:edit functionality needs to be abstracted out
    proto.delegateDoubleClick = function(grid, mouse) {
        grid.editAt(mouse);
    };

    //this is a helper function for generating fixed col/row data
    proto.alphaFor = function(i) {
        // Name the column headers in A, .., AA, AB, AC, .., AZ format
        // quotient/remainder
        //var quo = Math.floor(col/27);
        var quo = Math.floor((i) / 26);
        var rem = (i) % 26;
        var code = '';
        if (quo > 0) {
            code += String.fromCharCode('A'.charCodeAt(0) + quo - 1);
        }
        code += String.fromCharCode('A'.charCodeAt(0) + rem);
        return code;
    };

    //changed function is overridden by the OFGrid when we set this as
    //<br>it's behavior
    //<br>TODO:we should be using event emitter or some other real observer mechanism here
    proto.changed = function() {};

    //set the constructor as the module
    //<br>also set it on window for now
    //<br>determine an of namespace to place the global constructor on
    root.fin = root.fin || {};
    root.fin.wc = root.fin.wc || {};
    root.fin.wc.hypergrid = root.fin.wc.hypergrid || {};
    root.fin.wc.hypergrid.DefaultGridBehavior = DefaultGridBehavior;

}).call(this); /* jslint ignore:line */
