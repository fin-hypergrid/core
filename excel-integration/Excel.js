/* eslint-env browser */
/* global Polymer, fin */
'use strict';

/**
 * A plugin for hypergrid that provides integration with excel.
 * @module excel
 */

(function() {

    var excelOriginOffset = 1;

    Polymer({ // eslint-disable-line new-cap

        /**
         * @property {object} grid - The {@link Hypergrid} I'm installed into.
         * @instance
         */
        grid: {},

        /**
         * @property {object} running - Am I currently running (polling for changes to push to excel).
         * @instance
         */
        running: false,

        /**
         * @property {object} publish - Default configuration values.
         * @instance
         */
        publish: {
            publish: 'onSelect',
            subscribe: 'onExcelChange',
            interval: 500,
            logging: false
        },

        /**
         * @instance
         * @desc this is called as the hook for the nested tag plugin pattern. this is how this excel component is installed into the hypergrid.
         * @param {Hypergrid} grid
         */
        installOn: function(grid) {
            var self = this;
            this.grid = grid;
            // Entry point to the App Desktop
            if (!window.fin) {
                if (this.logging) {
                    console.log('Excel integration only works within the OpenFin Runtime');
                }
                return;
            }
            fin.desktop.main(function() {
                fin.desktop.Application.getCurrent();
                self.start();
            });
        },


        /**
         * @instance
         * @desc Start polling for pushes to excel.
         */
        start: function() {
            var self = this;
            // This should be the same interval as the cells layer
            if (this.running) {
                return;
            }
            this.running = true;
            setInterval(function() {
                if (!self.running) {
                    //were done lets exit
                    return;
                }
                self.publishToBus();
            }, self.interval);

            self.subscribeToBus();
        },

        /**
         * @instance
         * @desc Stop polling for pushes to excel.
         */
        stop: function() {
            this.running = false;
            this.unSubscribeToBus();
        },

        /**
         * @instance
         * @desc Create a blob appropriate to send to excel.
         * @returns {undefined|object}
         */
        createExcelDataFromSelections: function() {
            //only use the data from the last selection
            var selectionModel = this.grid.selectionModel;
            var selections = selectionModel.getSelections();
            if (selections.length === 0) {
                return;
            }

            var collector = [];
            var obj;
            for (var i = 0; i < selections.length; i++) {
                var each = selections[i];
                var eachData = [];
                var xstart = each.origin.x;
                var xstop = each.origin.x + each.extent.x + 1;
                var ystart = each.origin.y;
                var ystop = each.origin.y + each.extent.y + 1;
                for (var y = ystart; y < ystop; y++) {
                    for (var x = xstart; x < xstop; x++) {
                        var data = this.grid.getValue(x, y);
                        eachData.push(data + '');
                    }
                }
                obj = {
                    region: [excelOriginOffset + ystart, excelOriginOffset + xstart, ystop, xstop],
                    values: eachData
                };
                collector.push(obj);
            }
            obj = {
                now: new Date().getTime(),
                selection: collector
            };
            return obj;
        },

        /**
         * @instance
         * @desc Create and send a blob of the current selection to excel.
         */
        publishToBus: function() {

            if (!this.grid.hasSelections()) {
                return;
            }

            var excelMessage = this.createExcelDataFromSelections(this.grid);
            fin.desktop.InterApplicationBus.publish(this.publish, excelMessage);

            if (this.logging) {
                console.log('push to excel', excelMessage);
            }
        },

        /**
         * @instance
         * @desc Subscribe to excel.
         */
        subscribeToBus: function() {
            fin.desktop.InterApplicationBus.subscribe('*', this.subscribe, this.subscriptionCallback.bind(this));
            fin.desktop.InterApplicationBus.subscribe('*', 'ExcelError', this.errorCallback.bind(this));
        },

        /**
         * @instance
         * @desc Unsubscribe to excel.
         */
        unSubscribeToBus: function() {
            fin.desktop.InterApplicationBus.unsubscribe('*', this.subscribe, this.subscriptionCallback.bind(this));
            fin.desktop.InterApplicationBus.unsubscribe('*', 'ExcelError', this.errorCallback.bind(this));
        },

        /**
         * @instance
         * @desc Handle the data that comes from excel.
         * @param {object} data
         */
        subscriptionCallback: function(data) {
            var self = this;
            var sm = this.grid.selectionModel;
            if (this.logging) {
                console.log(JSON.stringify(data));
            }
            if (data.cells && data.cells.length > 0) {
                data.cells.forEach(function(cell) {
                    if (cell.value && !sm.isSelected(cell.row, cell.column)) {
                        self.grid.setValue(cell.column - excelOriginOffset, cell.row - excelOriginOffset, cell.value);
                    }
                });
            }
        },

        /**
         * @instance
         * @desc Handle any errors excel might publish to the bus.
         * @param {object} data
         */
        errorCallback: function(data) {
            if (this.logging) {
                console.error(JSON.stringify(data));
            }
        }
    });

})();
