/**
 * Created by jayarajw on 06/05/2015.
 */

/*global console:true */
/*global angular:true */
/*global Spinner:true */

//var console = window.console;
//var angular = window.angular;

(function () {

    'use strict';

    /* jshint ignore:start */
    Number.prototype.format = function (n, x) {
        var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
        return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
    };
    /* jshint ignore:end */


    var rgba = function (r, g, b, a) {
        // in .NET(configstore) Alpha is always 255 so param 'a' here has no meaning too...
        //return 'this.rgba(' + [(r || 0), (g || 0), (b || 0), (a || 1)].join(',') + ')';
        return 'rgb(' + [(r || 0), (g || 0), (b || 0)].join(',') + ')';
    };

    var gridFont = function font(size, family, style) {

        var configCellFont = '' + [(style || 'normal'), (size + 'px' || '13px'), (family || 'Geneva')].join(' ') + '';
        configCellFont = configCellFont.replace(",", " ");
        // return "italic bold 12px Verdana";
        return configCellFont + ", sans-serif";
    };

    var jsonGrid;

    Polymer('polymer-grid', {// jshint ignore:line

        // Global Variables
        columnConfigurations: { columnDefinitions: [], columnProperties: [] },
        defaultHeaders: {},
        pendingEdits: [], //{rowKey: xxx, cellx: x, celly: y, oldvalue: oval, newvalue: nval}

        rowKeyIdentifier: "", // Primary Key of the data table

        privatePropertiesofPolymerGrid: {
            'evenBackgroundColor': null,
            'oddBackgroundColor': null,
            'evenForeColor': null,
            'oddForeColor': null
        },

        defaultGridProperties: {
            fixedRowCount: 0,
            headerColumnCount: 0,
            headerRowCount: 1,
            rowHeights: { 0: 30, }, // header and filter row heights
            //defaultFixedRowHeight: 55, // not supported anymore by hypergrid
            defaultRowHeight: 30,

            editorActivationKeys: [], // disable the default column picker

            readOnly: false,
            editable: false, //wiltest

/*            scrollbarHoverOver: 'visible',
            scrollbarHoverOff: 'visible',
            scrollingEnabled: true,*/

            gridLinesH: true,
            gridLinesV: true,
            lineColor: 'rgb(255,255,255)',
            repaintIntervalRate: 40,
            //repaintImmediately: false,
            //columnHeaderBackgroundColor: 'rgb(192,192,192)',
            columnHeaderBackgroundColor: 'white',
            cellPadding: 5,
            fixedColumnCount: 0,

            showRowNumbers: true,
            showFilterRow: true,
            showHeaderRow: true,

            rowSelection: true,
            singleRowSelectionMode: false,

            columnAutosizing: false,

            rowResize: false
        },

        defaultGridState: {

        },

        isInitialized: false,

        gridData: [],

        properties: {

            /**
            * @namespace polymer-grid
            * @instance
            * @property {Boolean} ShowFilterRow - (true/false) Controls visibility of the filter row
            * @property {Boolean} ShowFilterIcon - (true/false) - Decides Filter icon visiblity on the Filter row
            * @property {Boolean} RowSelectionMode - Selection context when clicking on the grid.<br>
            true    :   selects the entire row.<br>
            false   :   selects the cell.
            * @property {String} RowIndicatorStyle - Determines the content on the Row Indicator<br>
              'empty' - (default) Empty Row Indicator cell.<br>
              'checkbox'       - A checkbox appears on the cell. To be used where we want to select rows using row indicator.<br>
              'number'         - Row numbers is displayed on the row indicator.<br>
              'all'            - Row Indicator cells show both a number and checkbox.<br>
            * @property {Boolean} IgnoreConfigColors - Should Panther grid ignores any colors being set using configData during initialization. And uses default colors instead.
            */
            ShowFilterRow: {
                type: Boolean,
                notify: true
            },

            /**

            */
            ShowFilterIcon: {
                type: Boolean,
                notify: true,
                value: true
            },

            /**

            */
            RowSelectionMode: {
                type: Boolean,
                notify: true
            },

            RowIndicatorStyle: {
                type: String,
                notify: true
            },

            /**
            * @property {Boolean} IgnoreConfigColors - (true/false) - Panther grid ignores any colors being set using configData during initialization. And uses default colors instead.
            */
            IgnoreConfigColors: {
                type: Boolean,
                notify: true
            }

        },

        getGridControl: function () {
            return jsonGrid;
        },

        render: function () {
            var self = this;
            var grd = this.$.jsongriddiv;
            var div = grd,
                bodyStyle = window.getComputedStyle(grd);

            var getContainer = function (grid) {
                return new fin.Hypergrid.behaviors.JSON(grid, []);
            };

            jsonGrid = new fin.Hypergrid(div, getContainer);

            //shadowDom holder will now represent focus
            jsonGrid.hasFocus = function() {
                return document.activeElement === self;
            }

            //shadowDom holder will now represent focus
            jsonGrid.canvas.hasFocus = function() {
                return document.activeElement === self;
            }
        },


        /**
         * @function
         * @instance
         * @description
         Grid Initialization - Client programs call this to load the Grid with data and configuration(optional) <br>
         Sets the default properties for Grid  <br>
         Configures the Columns and set column and header properties <br>
         Configures the filter and totals row <br>
         Subscribes to grid events <br>
         * @param {JSONArray} configData - Config used to configure the Grid as per pre-defined settings
         * @param {JSONArray} mydata - Actual Data to be displayed on the Grid.
         */
        initializeGrid: function (configData, mydata) {

            console.log("PolymerGrid InitializeGrid Called"); // jshint ignore:line

            // local variable initialization
            var table = this.getGridControl();
            var behavior = table.getBehavior();

            behavior.setData(mydata); // Bind the Data to the grid

            console.log("PerGrid InitializeGrid Finished");
        },

    });

})(); /* jslint ignore:line */

