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
        initCellEditors = require('./cellEditors'),
        initDashboard = require('./dashboard'),
        initEvents = require('./events');

    // convert field names containing underscore to camel case by overriding column enum decorator
    Hypergrid.behaviors.JSON.prototype.columnEnumKey = Hypergrid.behaviors.JSON.columnEnumDecorators.toCamelCase;

    var gridOptions = {
            data: people1,
            margin: { bottom: '17px', right: '17px'},
            schema: Hypergrid.lib.fields.getSchema(people1),
            plugins: require('fin-hypergrid-event-logger'),
            state: { color: 'orange' }
        },
        grid = window.grid = window.g = new Hypergrid('div#json-example', gridOptions),
        behavior = window.b = grid.behavior,
        dataModel = window.m = behavior.dataModel,
        initial = true,
        idx = behavior.columnEnum;


    console.log('Fields:');  console.dir(behavior.dataModel.schema.map(function(cs) { return cs.name; }));
    console.log('Headers:'); console.dir(behavior.dataModel.schema.map(function(cs) { return cs.header; }));
    console.log('Indexes:'); console.dir(idx);

    function setData(data, options) {
        options = !data.length ? undefined : options || {
            schema: Hypergrid.lib.fields.getSchema(data)
        };
        grid.setData(data, options);
        behavior.reindex();
    }

    function reset() {
        grid.reset();
        initEvents(demo, grid);
    }

    var oldData;
    function toggleEmptyData() {
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
    }

    function resetData() {
        setData(people1);
        if (initial) {
            initDashboard(demo, grid);
            initial = false;
        }
        setTimeout(function() { initState(demo, grid); }, 50);
    }

    resetData();

    initCellRenderers(demo, grid);
    initFormatters(demo, grid);
    initCellEditors(demo, grid);
    initEvents(demo, grid);
};
