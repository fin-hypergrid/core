'use strict';

(function() {
    var root = this;


    //tester is here only to serve as a template for the testing of points being within a rectangle without the need to create a new point for each test.
    //<br>TODO:create a MutablePoint type in the rectangles project and use that here instead
    var tester = {
        isContainedWithinRectangle: function(rect) {
            var result =
                this.x >= rect.origin.x &&
                this.y >= rect.origin.y &&
                this.x <= rect.origin.x + rect.extent.x &&
                this.y <= rect.origin.y + rect.extent.y;

            return result;
        },
        x: 0,
        y: 0
    };

    //We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains.  This is how we know to highlight the fixed regions on the edges of the grid.
    function DefaultSelectionModel(ofgrid) {

        this.rectangles = document.createElement('fin-rectangle');
        Object.call(this);
        this.getGrid = function() {
            return ofgrid;
        };
        this.selections = [];
        this.flattenedX = [];
        this.flattenedY = [];
    }

    var proto = DefaultSelectionModel.prototype = Object.create(Object.prototype);

    //select a rectangle
    proto.select = function(ox, oy, ex, ey) {

        //this is very hacky, we swap the origin and extent if the extents are negative
        //<br>TODO:fix rectangle package to implement high performant contains with negative extents
        var tmp;
        if (ex < 0) {
            tmp = ex;
            ox = ox + ex;
            ex = -tmp;
        }

        if (ey < 0) {
            tmp = ey;
            oy = oy + ey;
            ey = -tmp;
        }

        var newSelection = this.rectangles.rectangle.create(ox, oy, ex, ey);
        this.selections.push(newSelection);
        this.flattenedX.push(newSelection.flattenXAt(0));
        this.flattenedY.push(newSelection.flattenYAt(0));
    };

    //remove the last selection that was created
    proto.clearMostRecentSelection = function() {
        this.selections.length = Math.max(0, this.selections.length - 1);
        this.flattenedX.length = Math.max(0, this.flattenedX.length - 1);
        this.flattenedY.length = Math.max(0, this.flattenedY.length - 1);
    };

    proto.getSelections = function() {
        return this.selections;
    };

    proto.hasSelections = function() {
        return this.selections.length !== 0;
    };

    //answer if a point is selected
    proto.isSelected = function(x, y) {
        return this._isSelected(this.selections, x, y);
    };

    //answer if we have a selection covering a specific column
    proto.isFixedRowCellSelected = function(col) {
        return this._isSelected(this.flattenedY, col, 0);
    };

    //answer if we have a selection covering a specific row
    proto.isFixedColCellSelected = function(row) {
        return this._isSelected(this.flattenedX, 0, row);
    };

    //general selection query function
    proto._isSelected = function(selections, x, y) {
        for (var i = 0; i < selections.length; i++) {
            var each = selections[i];
            tester.x = x;
            tester.y = y;
            if (each.contains(tester)) {
                return true;
            }
        }
        return false;
    };

    //empty out all our state
    proto.clear = function() {
        this.selections.length = 0;
        this.flattenedX.length = 0;
        this.flattenedY.length = 0;
    };

    root.fin = root.fin || {};
    root.fin.wc = root.fin.wc || {};
    root.fin.wc.hypergrid = root.fin.wc.hypergrid || {};
    root.fin.wc.hypergrid.DefaultSelectionModel = DefaultSelectionModel;

}).call(this); /* jslint ignore:line */
