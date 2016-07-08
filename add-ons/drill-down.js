'use strict';

/**
 * Methods for programmatic drill-down manipulation.
 *
 * Intended to be mixed into Hypergrid's in-memory data model object (./src/dataModels/JSON.js).
 *
 * _Do not use directly._
 *
 * *Glossary*
 * * _collapsed (rows)_ - Rows whose drill-down control is "closed" (leftwards-facing triangle).
 * * _collapsable (rows)_ - See _expandable_.
 * * _expanded (rows)_ - Rows whose drill-down control is "open" (downwards-facing triangle).
 * * _expandable (rows)_ - Rows that can be expanded and collapsed; rows with drill-down controls.
 * * _revealed (rows)_ - Rows not currently hidden inside of containing rows.
 * * _unrevealed (rows)_ - Rows currently hidden inside of collapsed containing rows.
 *
 * @mixin
 */
var drillDown = {

    /**
     * @summary Toggle all revealed rows with drill-down controls.
     * @desc Operates only on rows that meet _bvoth_ of the following criteria (see _Glossary_ above):
     * * Expandable rows
     * * Revealed rows
     * @param {boolean} [expand] - One of:
     * * `true` - Expand all rows that are currently collapsed.
     * * `false` - Collapse all rows that are currently expanded.
     * * `undefined` (or omitted) - Expand all currently collapsed rows; collapse all currently expanded rows.
     * @param {number} [depth=Infinity] - One of:
     * * number > 0 - Apply only to rows above the given depth.
     * * number <= 0 - Apply only to rows at or below the given depth.
     * @param {boolean} [smartApply=false] - One of:
     * * `true` - Apply and repaint if and only if a change was detected.
     * * `false` - Always apply and repaint.
     * * `undefined` - Never apply and repaint.
     * @returns {boolean|undefined} If any rows expanded or collapsed; `undefined` means no rows had drill-down controls.
     */
    toggleAllRows: function(expand, depth, smartApply) {
        var changed = false;
        if (this.isDrillDown()) {
            var initial, limit = this.dataSource.getRowCount(), increment;
            if (expand) {
                // work down from top
                initial = 0;
                increment = +1;
            } else {
                // work up from bottom
                initial = limit - 1;
                limit = increment = -1;
            }
            for (var y = initial; y !== limit; y += increment) {
                if (this.dataSource.click(y, expand, depth)) {
                    changed = true;
                }
            }
            if (smartApply === false || changed && smartApply) {
                this.applyAnalytics(true);
                this.changed();
            }
        }
        return changed;
    },

    /**
     * @summary Expand all rows to the given depth.
     * @desc When called with a depth < Infinity, expands those rows but does not collapse deeper rows. In such a case, consider calling {@link drillDown.expandAndCollapseRows|expandAndCollapseRows} with that depth instead.
     * @param {number} [depth=Infinity] - See {@link drillDown.toggleAllRows|toggleAllRows}.
     * @param {boolean} [smartApply=false] - One of:
     * * `true` - Apply and repaint if and only if a change was detected.
     * * `false` - Always apply and repaint.
     * * `undefined` - Never apply and repaint.
     * @returns {boolean|undefined} If any rows expanded; `undefined` means no rows had drill-down controls.
     */
    expandRowsToDepth: function(depth, smartApply) {
        var changed = false;
        while (this.toggleAllRows(true, depth || Infinity)) {
            this.applyAnalytics(true);
            changed = true;
        }
        if (smartApply === false || changed && smartApply) {
            this.changed();
        }
        return changed;
    },

    /**
     * @summary Convenience function to expand all rows.
     * @param {boolean} [smartApply=false] - One of:
     * * `true` - Apply and repaint if and only if a change was detected.
     * * `false` - Always apply and repaint.
     * * `undefined` - Never apply and repaint.
     * @returns {boolean|undefined} If any rows expanded; `undefined` means no rows had drill-down controls.
     */
    expandAllRows: function(smartApply) {
        return this.expandRowsToDepth(Infinity, smartApply);
    },

    /**
     * @summary Convenience function to collapse all rows.
     * @param {boolean} [includeHidden] - Include those rows that may be expanded even though "unrevealed" (see _Glossary_ above).
     * @param {boolean} [smartApply=false] - One of:
     * * `true` - Apply and repaint if and only if a change was detected.
     * * `false` - Always apply and repaint.
     * * `undefined` - Never apply and repaint.
     */
    collapseAllRows: function(includeHidden, smartApply) {
        if (includeHidden) {
            this.expandAndCollapseRows(0, smartApply);
        } else {
            this.collapseRowsFromDepth(0, smartApply);
        }
    },

    /**
     * @summary Collapse rows deeper than (or equal to) the given depth.
     * @desc Only affects _revealed rows_ (those rows not hidden inside of currently collapsed rows); to affect _all rows,_ call {@link drillDown.expandAndCollapseRows|expandAndCollapseRows} instead.
     * @param {number} [depth=0]
     * @param {boolean} [smartApply=false] - One of:
     * * `true` - Apply and repaint if and only if rows were collapsed.
     * * `false` - Always apply and repaint.
     * * `undefined` - Never apply and repaint.
     * @returns {boolean|undefined} If any rows collapsed; `undefined` means no rows had drill-down controls.
     */
    collapseRowsFromDepth: function(depth, smartApply) {
        return this.toggleAllRows(false, -depth || 0, smartApply);
    },

    /**
     * @summary Expand all rows to the given depth and collapse all other rows.
     * @desc Call without a `depth` to collapse all rows, including those that may be expanded even though "unrevealed" (see _Glossary_ above).
     * @param {number} [depth=0]
     * @param {boolean} [apply=false] - One of:
     * * `true` - Always apply and repaint. (Note that this logic differs from those methods that take `smartApply`.)
     * * `false` - Always apply and repaint.
     * * `undefined` - Never apply and repaint.
     * @returns {boolean} Always returns `true`.
     */
    expandAndCollapseRows: function(depth, apply) {
        this.expandAllRows();
        this.collapseRowsFromDepth(depth, apply);
        return true;
    },

    /**
     * @summary Expand nested drill-downs containing this row.
     * @param ID - The unique row ID.
     * @returns {boolean} If any rows expanded.
     */
    revealRowByID: function(ID, smartApply) {
        var changed;

        if (this.isTreeview()) {
            changed = this.sources.treeview.revealRow(ID);
            if (smartApply === false || changed && smartApply) {
                this.applyAnalytics(true);
                this.changed();
            }
        }

        return changed;
    }

};

Object.defineProperty(drillDown, 'mixInTo', {  // defined here just to make it non-enumerable
    value: function(target) {
        Object.keys(this).forEach(function(key) {
            target[key] = this[key];
        }.bind(this));
    }
});

module.exports = drillDown;
