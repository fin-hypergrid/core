'use strict';

// NOTE: gulpfile.js's 'add-ons' task copies this file, altering the final line, to /demo/build/add-ons/, along with a minified version. Both files are eventually deployed to http://openfin.github.io/fin-hypergrid/add-ons/.

/**
 * Methods for programmatic drill-down manipulation.
 *
 * Intended to be mixed into Hypergrid's in-memory data model object (./src/dataModels/JSON.js) using the included {@link drillDown.mixInTo}
 * _Do not use directly._
 *
 * For example, you can mix it into the data model prototype like this:
 *
 * ```html
 * <script src="https://openfin.github.io/fin-hypergrid/build/fin-hypergrid.min.js"></script>
 * <script src="https://openfin.github.io/fin-hypergrid/build/fin-hypergrid-drilldown.min.js"></script>
 * ```
 * ```javascript
 * fin.Hypergrid.drillDown.mixInTo(fin.Hypergrid.dataModels.JSON.prototype);
 * var grid = new fin.Hypergrid(element, options);
 * ```
 *
 * Or like this:
 *
 * ```javascript
 * var grid1 = new fin.Hypergrid(element, options);
 * var grid2 = new fin.Hypergrid(element, options);
 * fin.Hypergrid.drillDown.mixInTo(Object.getPrototypeOf(grid1.behavior.dataModel));
 * ```
 *
 * Or into s specific instance:
 *
 * ```javascript
 * var grid1 = new fin.Hypergrid(element, options);
 * var grid2 = new fin.Hypergrid(element, options);
 * fin.Hypergrid.drillDown.mixInTo(grid1.behavior.dataModel);
 * ```
 *
 * In this example, the mixed in methods will be available to `grid1` but not `grid2`.
 *
 * Using the npm modules, the above would look like this:
 *
 * ```javascript
 * var Hypergrid = require('fin-hypergrid');
 * var drillDown = require('fin-hypergrid-drill-down');
 * var grid = new fin.Hypergrid(element, options);
 * drillDown.mixInTo(grid.behavior.dataModel);
 * ```
 *
 * And this:
 *
 * ```javascript
 * var Hypergrid = require('fin-hypergrid');
 * var dataModelPrototype = require('fin-hypergrid/dataModels.JSON').prototype;
 * var drillDown = require('fin-hypergrid-drill-down');
 * drillDown.mixInTo(dataModelPrototype);
 * var grid = new fin.Hypergrid(element, options);
 * ```
 *
 * **Glossary**
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
        if (this.dataSource.isDrillDown()) {
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
                this.reindex({rowClick: true});
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
            this.reindex({rowClick: true});
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
            changed = this.dataSource.revealRow(ID);
            if (smartApply === false || changed && smartApply) {
                this.reindex({rowClick: true});
                this.changed();
            }
        }

        return changed;
    }

};

Object.defineProperties(drillDown, { // These objects are defined here so they will be non-enumerable to avoid being mixed in.
    /**
     * @name install
     * @summary Installer for plugin.
     * @desc Required by {@link Hypergrid#installPlugins}
     * @function
     * @param {object} target - Your data model instance or its prototype.
     * @memberOf rowById
     */
    install: {
        value: function(grid, target) {
            mixInTo.call(this, target || Object.getPrototypeOf(grid.behavior.dataModel));
        }
    },

    /**
     * @name mixInTo
     * @summary Mix all the other members into the given target object.
     * @desc The target object is intended to be Hypergrid's in-memory data model object ({@link dataModels.JSON}).
     * @function
     * @param {object} target - Your data model instance or its prototype.
     * @memberOf rowById
     */
    mixInTo: {
        value: function(target) {
            console.warn('drillDown.mixInTo(target) deprecated as of Hypergrid 1.10.0 in favor of grid.installPlugins([[drillDown, target]]) where target defaults to grid\'s dataModel prototype. (Will be removed in a future release.)');
            mixInTo.call(this, target);
        }
    }
});

function mixInTo(target) {
    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(this, key));
        }
    }
}

module.exports = drillDown;
