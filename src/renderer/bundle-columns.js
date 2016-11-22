'use strict';

function bundleColumns(resetCellEvents) {
    var bundle, columnBundles = [],
        gridProps = this.grid.properties,
        gridPrefillColor = gridProps.backgroundColor,
        vc, visibleColumns = this.visibleColumns,
        visibleRows = this.visibleRows,
        c, C = visibleColumns.length, c0 = gridProps.showRowNumbers ? -1 : 0,
        r, R = visibleRows.length,
        p, pool, backgroundColor;

    if (resetCellEvents) {
        pool = this.cellEventPool;
        for (p = 0, c = c0; c < C; c++) {
            for (r = 0; r < R; r++, p++) {
                // reset pool members to reflect coordinates of cells in newly shaped grid
                pool[p].reset(visibleColumns[c], visibleRows[r]);
            }
        }
    }

    for (c = c0; c < C; c++) {
        vc = visibleColumns[c];
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
    }

    this.columnBundles = columnBundles;
}

module.exports = bundleColumns;
