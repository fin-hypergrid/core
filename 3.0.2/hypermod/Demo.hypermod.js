(function(require, module, exports, Hypergrid) {
/* eslint-env browser */

'use strict';

var Hypergrid = require('fin-hypergrid');

function Demo() {
    var version = document.getElementById('version'),
        titleElement = document.querySelector('title');

    version.innerText = Hypergrid.prototype.version;
    titleElement.innerText = version.parentElement.innerText;

    var fields = require('fin-hypergrid/src/lib/fields'),
        schema = fields.getSchema(this.data.people1);

    // as of v2.1.6, column properties can also be initialized from custom schema (as well as from a grid state object).
    // The following demonstrates this. Note that demo/setState.js also sets props of 'height' column. The setState
    // call therein was changed to addState to accommodate (else schema props defined here would have been cleared).
    Object.assign(schema.height, {
        halign: 'right',
        // format: 'foot' --- for demo purposes, this prop being set in setState.js (see)
    });

    // var DataModel = require('datasaur-local');
    // var dataModel = new DataModel;
    // optional additional stages:
    // dataModel = new (require('datasaur-indexed'))(dataModel); // must be added to package and installed
    // dataModel = new (require('datasaur-simple-sort'))(dataModel); // must be added to package and installed
    // or shorthand:
    // var DataModel = [require('datasaur-local'), require('datasaur-indexed'), require('datasaur-simple-sort')];

    var gridOptions = {
        // Because v3 defaults to use datasaur-local (which is still included in the build),
        // specifying it here is still optional, but may be required for v4.
        // Uncomment one of the following 2 lines to specify ("bring your own") data source:

        // dataModel: dataModel,
        // DataModel: DataModel,

        data: this.data.people1,
        schema: schema,

        margin: { bottom: '17px', right: '17px' },
        plugins: this.plugins,
        state: { color: 'orange' }
    };

    var grid = new Hypergrid('div#hypergrid-example', gridOptions);

    Object.defineProperties(window, {
        grid: { get: function() { return grid; } },
        g: { get: function() { return grid; } },
        p: { get: function() { return grid.properties; }},
        b: { get: function() { return grid.behavior; } },
        m: { get: function() { return grid.behavior.dataModel; } }
    });

    this.grid = grid;

    console.log('schema', grid.behavior.schema);

    this.initCellRenderers();
    this.initFormatters();
    this.initCellEditors();
    this.initEvents();
    this.initDashboard();
    this.initState();
}

Demo.prototype = {
    data: require('../demo/data/widedata'),
    initCellRenderers: require('./cellrenderers'),
    initFormatters: require('./formatters'),
    initCellEditors: require('./celleditors'),
    initEvents: require('./events'),
    initDashboard: require('./dashboard'),
    initState: require('./setState'),

    plugins: require('fin-hypergrid-event-logger'),

    reset: function() {
        this.grid.reset();
        this.initEvents();
    },

    setData: function(data, options) {
        options = Object.assign({}, options);
        options.schema = options.schema || [];
        this.grid.setData(data, options);
    },

    toggleEmptyData: function toggleEmptyData() {
        var behavior = this.grid.behavior;

        if (!this.oldData) {
            this.oldData = {
                data: behavior.dataModel.data,
                schema: behavior.schema,
                activeColumns: behavior.getActiveColumns().map(function(column) { return column.index; })
            };
            //important to set top totals first
            setData([]);
        } else {
            //important to set top totals first
            this.setData(this.oldData.data, this.oldData.schema);
            behavior.setColumnIndexes(this.oldData.activeColumns);
            delete this.oldData;
        }
    },

    resetData: function() {
        this.setData(this.data.people1);
        this.initState();
    },

    set vent(start) {
        if (start) {
            this.grid.logStart();
        } else {
            this.grid.logStop();
        }
    }
};

module.exports = Demo;
})(fin.Hypergrid.require, fin.$$ = { exports: {} }, fin.$$.exports, fin.Hypergrid);
fin.Hypergrid.modules.Demo = fin.$$.exports;
delete fin.$$;
