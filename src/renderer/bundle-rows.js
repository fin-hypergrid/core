'use strict';

function bundleRows(resetCellEvents) {
    var gridProps = this.grid.properties,
        vr, visibleRows = this.visibleRows,
        r, R = visibleRows.length,
        p, pool;

    if (resetCellEvents) {
        pool = this.cellEventPool;
        for (p = 0, r = 0; r < R; r++) {
            vr = visibleRows[r];
            this.visibleColumns.forEachWithNeg(function(vc) { // eslint-disable-line no-loop-func
                p++;
                // reset pool member to reflect coordinates of cell in newly shaped grid
                pool[p].reset(vc, vr);
            });
        }
    }

    var bundle, rowBundles = [],
        gridPrefillColor = gridProps.backgroundColor,
        rowStripes = gridProps.rowStripes,
        rowPrefillColors = Array(R),
        stripe, backgroundColor;

    for (r = 0; r < R; r++) {
        vr = visibleRows[r]; // first cell in row r
        stripe = vr.subgrid.isData && rowStripes && rowStripes[vr.rowIndex % rowStripes.length];
        backgroundColor = rowPrefillColors[r] = stripe && stripe.backgroundColor || gridPrefillColor;
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
