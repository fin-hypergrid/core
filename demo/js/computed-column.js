/* eslint-env browser */
/* globals fin */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid;

    grid = new Hypergrid('div#example', {
        data: [
            { value: 3 },
            { value: 4 },
            { value: -4 },
            { value: 5 }
        ]
    });

    grid.behavior.schema.push({
        name: 'squared',
        calculator: square
    });

    // recreate to include new column
    grid.behavior.createColumns();

    // force type of new column to 'number' because current auto-detect does not know about calculated columns
    grid.behavior.getColumn(1).type = 'number';

    grid.repaint();

    function square(dataRow, columnName) {
        return dataRow.value * dataRow.value;
    }
};

