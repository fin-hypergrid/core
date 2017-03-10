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
        idx = behavior.columnEnum;
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
                topTotals: behavior.getTopTotals(),
                bottomTotals: behavior.getBottomTotals(),
                data: dataModel.getData(),
                schema: dataModel.schema,
                activeColumns: behavior.getActiveColumns().map(function(column) { return column.index; })
            };
            //important to set top totals first
            behavior.setTopTotals([]);
            setData([]);
            behavior.setBottomTotals([]);
        } else {
            //important to set top totals first
            behavior.setTopTotals(oldData.topTotals);
            setData(oldData.data, oldData.schema);
            behavior.setColumnIndexes(oldData.activeColumns);
            behavior.setBottomTotals(oldData.bottomTotals);
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
