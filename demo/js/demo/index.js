/* eslint-env browser */

/* globals fin, people1, people2, vent */

/* eslint-disable no-alert*/

'use strict';

window.onload = function() {

    var Hypergrid = fin.Hypergrid,
        state = require('./setState'),
        cellRenderers = require('./cellrenderers'),
        formatters = require('./formatters'),
        cellEditors = require('./cellEditors'),
        dom = require('./DOM'),
        events = require('./events');

    // convert field names containing underscore to camel case by overriding column enum decorator
    Hypergrid.behaviors.JSON.prototype.columnEnumKey = Hypergrid.behaviors.JSON.columnEnumDecorators.toCamelCase;

    if (false) { // eslint-disable-line no-constant-condition
        // Following demonstrates setting a property to a getter.
        // The getter's context is the renderer's config object.

        // Note: Getters have access to a backing store, `this.var`, not demonstrated here, but see dynamicProperties.js for details.

        // Method #1: Override default property by defining the getter in `defaults`. This method affects all grid instances.
        Object.defineProperty(Hypergrid.defaults, 'columnHeaderColor', {
            get: function() {
                return this.gridCell.x & 1 ? 'red' : 'green';
            }
        });

        // Method #2: Define more formally in `fin.Hypergrid.lib.dynamicPropertyDescriptors`. This method affects all grid instances. Has the advantage of keeping the definition in `defaults` intact (to serve as an actual default). A setter is not shown here, but generally you would also define a setter -- unless property is meant to be read-only. Or you could use a "deflate" pattern: I.e., define a setter that, if invoked, replaces the getter/setter with a simple value. (To do this you would also need to include `configurable: true`.)
        Object.defineProperty(Hypergrid.lib.dynamicPropertyDescriptors, 'columnHeaderColor', {
            get: function() {
                return this.gridCell.x & 1 ? Hypergrid.defaults.columnHeaderColor : 'green';
            }
        });

        // Method #3: Define in `grid.properties` layer, which also has access to the default value, but which affects only the one instance. (This would actually need to be placed _after_ the grid instantiation, hence the eslint directive just to get this to pass linter.)
        Object.defineProperty(grid.properties, 'columnHeaderColor', { // eslint-disable-line no-use-before-define
            get: function() {
                return this.gridCell.x & 1 ? Hypergrid.defaults.columnHeaderColor : 'green';
            }
        });
    }

    var gridOptions = {
            data: people1,
            margin: { bottom: '17px', right: '17px'},
            schema: Hypergrid.lib.fields.getSchema(people1)
        },
        grid = window.grid = window.g = new Hypergrid('div#json-example', gridOptions),
        behavior = window.b = grid.behavior,
        dataModel = window.m = behavior.dataModel,
        initial = true,
        idx = behavior.columnEnum;


    console.log('Fields:');  console.dir(behavior.dataModel.schema.map(function(cs) { return cs.name; }));
    console.log('Headers:'); console.dir(behavior.dataModel.schema.map(function(cs) { return cs.header; }));
    console.log('Indexes:'); console.dir(idx);

    window.setData = function (data, options) {
        options = !data.length ? undefined : options || {
            schema: Hypergrid.lib.fields.getSchema(data)
        };
        grid.setData(data, options);
        behavior.reindex();
    };

    window.reset = function() {
        grid.reset();
        events(grid);
    };

    window.vent = false;
    var oldData;
    window.toggleEmptyData = function() {
        if (!oldData) {
            oldData = {
                data: dataModel.getData(),
                schema: dataModel.schema,
                activeColumns: behavior.getActiveColumns().map(function(column) { return column.index; })
            };
            //important to set top totals first
            setData([]);
        } else {
            //important to set top totals first
            setData(oldData.data, oldData.schema);
            behavior.setColumnIndexes(oldData.activeColumns);
            oldData = undefined;
        }
    };

    window.resetData = function () {
        setData(people1);
        if (initial) {
            dom(grid);
            initial = false;
        }
        setTimeout(function () {state(grid)}, 50);
    };

    window.NOON = 12 * 60;
    window.styleRowsFromData;

    resetData();
    cellRenderers(grid);
    formatters(grid);
    cellEditors(grid);
    events(grid);

};
