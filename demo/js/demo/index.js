/* eslint-env browser */

/* globals fin, people1 */

/* eslint-disable no-alert*/

'use strict';

window.onload = function() {

    var demo = window.demo = {
        set vent(start) { window.grid[start ? 'logStart' : 'logStop'](); },
        reset: reset,
        setData: setData,
        toggleEmptyData: toggleEmptyData,
        resetData: resetData
    };

    var Hypergrid = fin.Hypergrid,
        initState = require('./setState'),
        initCellRenderers = require('./cellrenderers'),
        initFormatters = require('./formatters'),
        initCellEditors = require('./celleditors'),
        initDashboard = require('./dashboard'),
        initEvents = require('./events');

    document.getElementById('version').innerText = Hypergrid.prototype.version;

    var schema = Hypergrid.lib.fields.getSchema(people1);

    // as of v2.1.6, column properties can also be initialized from custom schema (as well as from a grid state object).
    // The following demonstrates this. Note that demo/setState.js also sets props of 'height' column. The setState
    // call therein was changed to addState to accommodate (else schema props defined here would have been cleared).
    Object.assign(schema.find(function(columnSchema) { return columnSchema.name === 'height'; }), {
        halign: 'right',
        // format: 'foot' --- for demo purposes, this prop being set in setState.js (see)
    });

    var gridOptions = {
            // Because v3 defaults to use datasaur-local (which is still included in the build),
            // specifying it here is still optional, but may be required for v4.
            // Uncomment one of the following 2 lines to specify ("bring your own") data source:

            // dataModel: new (Hypergrid.require('datasaur-local'))(people1, getSchema(people1)),
            // DataModel: Hypergrid.require('datasaur-local'),

            data: people1,
            margin: { bottom: '17px', right: '17px' },
            plugins: require('fin-hypergrid-event-logger'),
            // canvasContextAttributes: { alpha: false },
            schema: schema,
            state: { color: 'orange' }
        },
        grid = new Hypergrid('div#json-example', gridOptions),
        behavior = grid.behavior,
        dataModel = behavior.dataModel;

    window.g = window.grid = grid;
    window.p = grid.properties;

    Object.defineProperties(window, {
        b: { get: function() { return behavior; } },
        m: { get: function() { return dataModel; } }
    });

    console.log('schema', behavior.schema);

    function setData(data, options) {
        options = Object.assign({}, options);
        options.schema = options.schema || [];
        grid.setData(data, options);
    }

    function reset() {
        grid.reset();
        initEvents(demo, grid);
    }

    var oldData;
    function toggleEmptyData() {
        if (!oldData) {
            oldData = {
                data: dataModel.data,
                schema: behavior.schema,
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
    }

    function resetData() {
        setData(people1);
        initState(demo, grid);
    }

    initCellRenderers(demo, grid);
    initFormatters(demo, grid);
    initCellEditors(demo, grid);
    initEvents(demo, grid);
    initDashboard(demo, grid);
    initState(demo, grid);

    // Following would be needed for row height changes made in data model subrows POC:
    // setTimeout(function() { grid.behaviorStateChanged(); });
};
