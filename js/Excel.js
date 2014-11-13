/* global fin */

'use strict';

var createExcelDataFromSelections = function(grid) {
    //only use the data from the last selection
    var selectionModel = grid.getSelectionModel();
    var selections = selectionModel.getSelections();
    if (selections.length === 0) {
        return;
    }
    var behavior = grid.getBehavior();
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
                var data = behavior.getValue(x, y);
                eachData.push(data + '');
            }
        }
        obj = {
            region: [ystart, xstart, ystop - 1, xstop - 1],
            values: eachData
        };
        collector.push(obj);
    }
    obj = {
        now: new Date().getTime(),
        selection: collector
    };
    return obj;
};

var publish = function(grid) {

    if (!grid.hasSelections()) {
        return;
    }

    var excelMessage = createExcelDataFromSelections(grid);
    fin.desktop.InterApplicationBus.publish('onSelect', excelMessage);

    console.log('push to excel', excelMessage);
};

var subscribe = function(grid) {
    var sm = grid.getSelectionModel();
    fin.desktop.InterApplicationBus.subscribe('*', 'onExcelChange', function(data) {
        console.log(JSON.stringify(data));
        if (data.cells && data.cells.length > 0) {
            data.cells.forEach(function(cell) {
                if (cell.value && !sm.isSelected(cell.row, cell.column)) {
                    grid.setValue(cell.column, cell.row, cell.value);
                }
            });
        }
    });

    fin.desktop.InterApplicationBus.subscribe('*', 'ExcelError', function(data) {
        console.log(JSON.stringify(data));
    });
};

var excel = function(grid) {
    // Entry point to the App Desktop
    if (!fin) {
        console.error('Excel integration only works within the OpenFin Runtime');
        return;
    }
    fin.desktop.main(function() {
        fin.desktop.Application.getCurrent();

        // This should be the same interval as the cells layer
        setInterval(function() {
            publish(grid);
        }, 1000 / 2);

        subscribe(grid);
    });
};

module.exports = {
    on: excel
};

if (window) { //jshint ignore:line
    window.Excel = module.exports; //jshint ignore:line
    if (!window.fin) { //jshint ignore:line
        //if openfin isn't present we should do nothing
        module.exports.on = function() {};
    }
}
