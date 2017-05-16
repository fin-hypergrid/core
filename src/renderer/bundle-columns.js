'use strict';

function bundleColumns(resetCellEvents) {
    var gridProps = this.grid.properties,
        vr, visibleRows = this.visibleRows,
        r, R = visibleRows.length, pool;

    if (resetCellEvents) {
        pool = this.cellEventPool;
        var p = 0;
        this.visibleColumns.forEachWithNeg(function(vc) {
            for (r = 0; r < R; r++, p++) {
                vr = visibleRows[r];
                // reset pool member to reflect coordinates of cell in newly shaped grid
                pool[p].reset(vc, vr);
            }
        });
    }

    var bundle,
        columnBundles = [],
        gridPrefillColor = gridProps.backgroundColor,
        backgroundColor;

    this.visibleColumns.forEachWithNeg(function(vc) {
        backgroundColor = vc.column.properties.backgroundColor;
        if (bundle && bundle.backgroundColor === backgroundColor) {
            bundle.right = vc.right;
        } else if (backgroundColor === gridPrefillColor) {
            bundle = undefined;
        } else {
            bundle = {
                backgroundColor: backgroundColor,
                left: vc.left,
                right: vc.right
            };
            columnBundles.push(bundle);
        }
    });

    this.columnBundles = columnBundles;
}

module.exports = bundleColumns;
