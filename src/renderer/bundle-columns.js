'use strict';

function bundleColumns(resetCellEvents) {
    var gridProps = this.grid.properties,
        vc, visibleColumns = this.visibleColumns,
        vr, visibleRows = this.visibleRows,
        c, C = visibleColumns.length, c0 = gridProps.showRowNumbers ? -1 : 0, Cn = C - 1,
        r, R = visibleRows.length,
        p, pool;

    if (resetCellEvents) {
        pool = this.cellEventPool;
        for (p = 0, c = c0; c < C; c++) {
            vc = visibleColumns[c];
            for (r = 0; r < R; r++, p++) {
                vr = visibleRows[r];
                if (!vr.subgrid.isInfo || c < 0) {
                    // reset pool member to reflect coordinates of cell in newly shaped grid
                    pool[p].reset(vc, vr);
                } else if (c === Cn) {
                    // reset pool member with coordinates of stretched cell
                    pool[p].reset(visibleColumns.info, vr);
                } else {
                    // disable pool member for cells that are under stretched cell
                    pool[p].disabled = true;
                }
            }
        }
    }

    var bundle,
        columnBundles = [],
        gridPrefillColor = gridProps.backgroundColor,
        backgroundColor;

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
