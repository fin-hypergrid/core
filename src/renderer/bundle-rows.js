'use strict';

function bundleRows(resetCellEvents) {
    var gridProps = this.grid.properties,
        vc, visibleColumns = this.visibleColumns,
        vr, visibleRows = this.visibleRows,
        c, C = visibleColumns.length, c0 = gridProps.showRowNumbers ? -1 : 0, Cn = C - 1,
        r, R = visibleRows.length,
        p, pool;

    if (resetCellEvents) {
        pool = this.cellEventPool;
        for (p = 0, r = 0; r < R; r++) {
            vr = visibleRows[r];
            for (c = c0; c < C; c++, p++) {
                vc = visibleColumns[c];
                if (!vr.subgrid.isInfo || c < 0) {
                    // reset pool member to reflect coordinates of cell in newly shaped grid
                    pool[p].reset(vc, vr);
                } else if (c === Cn) {
                    // reset pool member with coordinates of stretched cell
                    pool[p].reset(visibleColumns.info, vr);
                } else if (c >= 0) {
                    // disable pool member for cells that are under stretched cell
                    pool[p].disabled = true;
                }
            }
        }
    }

    var bundle, rowBundles = [],
        gridPrefillColor = gridProps.backgroundColor,
        rowPropsList = gridProps.rowProperties,
        rowPrefillColors = Array(R),
        rowProperties, backgroundColor;

    for (r = 0; r < R; r++) {
        vr = visibleRows[r]; // first cell in row r
        rowProperties = vr.subgrid.isData && rowPropsList && rowPropsList[vr.rowIndex % rowPropsList.length];
        backgroundColor = rowPrefillColors[r] = rowProperties && rowProperties.backgroundColor || gridPrefillColor;
        if (bundle && bundle.backgroundColor === backgroundColor) {
            bundle.bottom = vr.bottom;
        } else if (backgroundColor === gridPrefillColor) {
            bundle = undefined;
        } else {
            bundle = {
                backgroundColor: backgroundColor,
                top: vr.top,
                bottom: vr.bottom
            };
            rowBundles.push(bundle);
        }
    }

    this.rowBundles = rowBundles;
    this.rowPrefillColors = rowPrefillColors;
}

module.exports = bundleRows;
