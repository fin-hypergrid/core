/* eslint-env browser */

/* globals fin */

'use strict';

/*
Following demonstrates setting a property to a getter.

Usage: `require('addDynamicProps')(grid);`

The getter's context is the renderer's config object.
In this example, we make every other header's font color green.

A setter is not shown in these examples, but generally you would also define a setter -- unless property is meant to be read-only. If you don't need the ability to set the value, you could use a "deflate" pattern: I.e., define a setter that, if invoked, replaces the getter/setter with a simple value. (To do this you would also need to include `configurable: true`.

*/


function Method1() {
    /*
     Add to `require('fin-hypergrid/lib/dynamicProperties)` (available in build file as `fin.Hypergrid.lib.dynamicPropertyDescriptors`).

     This method:
     * Is the recommended method.
     * Affects all grid instances.
     * Has the advantage of keeping the definition in `defaults` intact, which can then serve as an actual default.
     * Does not demonstrate the backing store, `this.var`, but see dynamicProperties.js for details.
     */
    Object.defineProperties(fin.Hypergrid.lib.dynamicPropertyDescriptors, {
        columnHeaderColor: {
            get: function() {
                return this.gridCell.x & 1 ? fin.Hypergrid.defaults.columnHeaderColor : 'green';
            }
        }
    });
}


// By way of illustration, we also include examples for two other methods:


function Method2() { // eslint-disable-line no-unused-vars
    // Override default property by defining the getter in `defaults`. This method affects all grid instances.
    Object.defineProperties(fin.Hypergrid.defaults, {
        columnHeaderColor: {
            get: function() {
                return this.gridCell.x & 1 ? 'red' : 'green';
            }
        }
    });
}


function Method3(grid) { // eslint-disable-line no-unused-vars
    // Define in `grid.properties` layer, which also has access to the default value, but which affects only the one instance. (This would actually need to be placed _after_ the grid instantiation, hence the eslint directive just to get this to pass linter.)
    Object.defineProperties(grid.properties, {
        columnHeaderColor: {
            get: function() {
                return this.gridCell.x & 1 ? fin.Hypergrid.defaults.columnHeaderColor : 'green';
            }
        }
    });
}


module.exports = Method1; // set to whichever method you wish to demonstrate
