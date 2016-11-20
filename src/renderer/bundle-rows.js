'use strict';

function bundleRows(resetCellEvents) {
    var bundle, rowBundles = [],
        gridProps = this.grid.properties,
        gridPrefillColor = gridProps.backgroundColor,
        rowPropsList = gridProps.rowProperties,
        visibleColumns = this.visibleColumns,
        vr, visibleRows = this.visibleRows,
        c, C = visibleColumns.length, c0 = this.grid.isShowRowNumbers() ? -1 : 0,
        r, R = visibleRows.length,
        rowPrefillColors = Array(R),
        p, pool, rowProperties, backgroundColor;

    if (resetCellEvents) {
        pool = this.cellEventPool;
        for (p = 0, r = 0; r < R; r++) {
            for (c = c0; c < C; c++, p++) {
                // reset pool members to reflect coordinates of cells in newly shaped grid
                pool[p].reset(visibleColumns[c], visibleRows[r]);
            }
        }
    }

    for (r = 0; r < R; r++) {
        vr = visibleRows[r]; // first cell in row r
        rowProperties = !vr.subgrid.type && rowPropsList && rowPropsList[vr.rowIndex % rowPropsList.length];
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
