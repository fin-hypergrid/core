(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var SummarySubgrid = require('./js/SummarySubgrid');

var totalsToolkit = {
    preinstall: function(HypergridPrototype, BehaviorPrototype) {

        HypergridPrototype.mixIn(require('./mix-ins/grid'));
        BehaviorPrototype.mixIn(require('./mix-ins/behavior'));

        if (!BehaviorPrototype.dataModels.SummarySubgrid) {

            // Register in case a subgrid list is included in state object
            BehaviorPrototype.dataModels.SummarySubgrid = SummarySubgrid;

            // Add to default subgrid list in case no subgrid list is included in state object
            var specs = BehaviorPrototype.defaultSubgridSpecs;
            specs.splice(specs.indexOf('data'), 0, [SummarySubgrid, { name: 'topTotals' }]);
            specs.splice(specs.indexOf('data') + 1, 0, [SummarySubgrid, { name: 'bottomTotals' }]);

        }

    }
};

window.fin.Hypergrid.totalsToolkit = totalsToolkit;

},{"./js/SummarySubgrid":2,"./mix-ins/behavior":3,"./mix-ins/grid":4}],2:[function(require,module,exports){
'use strict';

/**
 * @implements dataModelAPI
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {string} [options.name]
 * @constructor
 */
function SummarySubgrid(grid, options) {
    this.behavior = grid.behavior;

    /**
     * @type {Array<Array>}
     */
    this.data = [];

    if (options && options.name) {
        this.name = options.name;
    }
}

SummarySubgrid.prototype = {
    constructor: SummarySubgrid.prototype.constructor,

    type: 'summary',

    hasOwnData: true, // do not call setData implicitly

    getRowCount: function() {
        return this.getData().length;
    },

    getData: function() {
        var data = this.data;

        if (!data.length) {
            data = this.behavior.dataModel.dataSource.getGrandTotals() || data;
        }

        return data;
    },

    /**
     * @summary Set summary data rows.
     * @desc Set to an array of data row objects.
     * @param {Array<Array>} data - `[]` defers to data source's grand totals.
     */
    setData: function(data, schema) {
        this.data = data;
    },

    getValue: function(x, y) {
        var row = this.getRow(y);
        return row[x];
    },

    /**
     * @summary Set a value in a summary row.
     * @desc Setting a value on a non-extant row creates the row.
     * @param x
     * @param y
     * @param value
     */
    setValue: function(x, y, value) {
        var row = this.data[y] = this.data[y] || Array(this.behavior.getActiveColumnCount());
        row[x] = value;
    },

    getRow: function(y) {
        return this.getData()[y];
    }
};

module.exports = SummarySubgrid;

},{}],3:[function(require,module,exports){
'use strict';

module.exports = {

    /** @typedef {Array} valueList
     * @desc One of:
     * * `activeColumnsList` falsy - Array of row values semantically congruent to `this.columns`.
     * * `activeColumnsList` truthy - Array of row values semantically congruent to `this.allColumns`.
     */

    /**
     * @param {number} x - Column index. If you have an "active" column index, you can translate it with `this.getActiveColumn(x).index`.
     * @param {number} y - Totals row index, local to the totals area.
     * @param value
     * @param {string|string[]} [areas=['top', 'bottom']] - may include `'top'` and/or `'bottom'`
     * @memberOf Behavior.prototype
     */
    setTotalsValue: function(x, y, value, areas) {
        if (!areas) {
            areas = [];
            if (this.subgrids.lookup.topTotals) { areas.push('top'); }
            if (this.subgrids.lookup.bottomTotal) { areas.push('bottom'); }
        } else if (!Array.isArray(areas)) {
            areas = [areas];
        }
        areas.forEach(function(area) {
            this.getTotals(area)[y][x] = value;
        }, this);
        this.grid.setTotalsValueNotification(x, y, value, areas);
    },

    /**
     * @summary Set the top total row(s).
     * @param {valueList[]} [rows] - Array of 0 or more rows containing summary data. Omit to set to empty array.
     * @param {boolean} [activeColumnsList=false]
     * @memberOf Behavior.prototype
     */
    setTopTotals: function(rows, activeColumnsList) {
        return this.setTotals('top', rows, activeColumnsList);
    },

    /**
     * @summary Get the top total row(s).
     * @returns {valueList[]}
     * @param {boolean} [activeColumnsList=false]
     * @returns {valueList|Array} Full data row object, or object containing just the "active" columns, per `activeColumnsList`.
     * @memberOf Behavior.prototype
     */
    getTopTotals: function(activeColumnsList) {
        return this.getTotals('top', activeColumnsList);
    },

    /**
     * @summary Set the bottom totals.
     * @param {valueList[]} rows - Array of 0 or more rows containing summary data. Omit to set to empty array.
     * @param {boolean} [activeColumnsList=false] - If `true`, `rows` only contains active columns.
     * @memberOf Behavior.prototype
     */
    setBottomTotals: function(rows, activeColumnsList) {
        return this.setTotals('bottom', rows, activeColumnsList);
    },

    /**
     * @summary Get the bottom total row(s).
     * @param {boolean} [activeColumnsList=false]
     * @returns {valueList} Full data row object, or object containing just the "active" columns, per `activeColumnsList`.
     * @memberOf Behavior.prototype
     */
    getBottomTotals: function(activeColumnsList) {
        return this.getTotals('bottom', activeColumnsList);
    },

    /**
     *
     * @param {string} key
     * @param {valueList[]} rows
     * @param {boolean} [activeColumnsList=false]
     * @returns {valueList[]}
     * @returns {*}
     * @memberOf Behavior.prototype
     */
    setTotals: function(key, rows, activeColumnsList) {
        key += 'Totals';

        var totals = this.subgrids.lookup[key];

        if (!totals) {
            throw new this.HypergridError('Expected subgrids.' + key + '.');
        }

        if (!Array.isArray(rows)) {
            // if not an array, fail silently
            rows = [];
        } else if (rows.length && !Array.isArray(rows[0])) {
            // if an unnested array representing a single row, nest it
            rows = [rows];
        }

        if (activeColumnsList) {
            rows.forEach(function(row, i, rows) {
                rows[i] = this.expandActiveRowToDataRow(row);
            }, this);
        }

        var newRowCount = rows.length,
            oldRowCount = totals.getRowCount();

        totals.setData(rows);

        if (newRowCount === oldRowCount) {
            this.grid.repaint();
        } else {
            this.grid.behavior.shapeChanged();
        }

        return rows;
    },

    /**
     *
     * @param key
     * @param {boolean} [activeColumnsList=false]
     * @returns {valueList} Full data row object, or object containing just the "active" columns, per `activeColumnsList`.
     * @memberOf Behavior.prototype
     */
    getTotals: function(key, activeColumnsList) {
        key += 'Totals';

        var rows = this.subgrids.lookup[key];
        rows = rows ? rows.getData() : [];

        if (activeColumnsList) {
            rows.forEach(function(row, i, rows) {
                rows[i] = this.collapseDataRowToActiveRow(row);
            }, this);
        }

        return rows;
    },

    /**
     * @param {boolean} [activeColumnsList=false]
     * @returns {valueList}
     * @memberOf Behavior.prototype
     */
    expandActiveRowToDataRow: function(activeColumnValues) {
        var dataRow = Array(this.allColumns.length);

        this.columns.forEach(function(column, i) {
            if (activeColumnValues[i] !== undefined) {
                dataRow[column.index] = activeColumnValues[i];
            }
        });

        return dataRow;
    },

    /**
     * @param {boolean} [activeColumnsList=false]
     * @returns {valueList}
     * @memberOf Behavior.prototype
     */
    collapseDataRowToActiveRow: function(allColumnValues) {
        var dataRow = Array(this.columns.length);

        this.columns.forEach(function(column, i) {
            if (allColumnValues[column.index] !== undefined) {
                dataRow[i] = allColumnValues[column.index];
            }
        });

        return dataRow;
    }

};

},{}],4:[function(require,module,exports){
/* eslint-env browser */

'use strict';

module.exports = {

    /**
     * @memberOf Hypergrid.prototype
     * @param {number} x - column index
     * @param {number} y - totals row index local to the totals area
     * @param value
     * @param {string[]} [areas=['top', 'bottom']] - may include `'top'` and/or `'bottom'`
     */
    setTotalsValueNotification: function(x, y, value, areas) {
        this.fireSyntheticSetTotalsValue(x, y, value, areas);
    },

    /**
     * @memberOf Hypergrid.prototype
     * @param {number} x - column index
     * @param {number} y - totals row index local to the totals area
     * @param value
     * @param {string[]} [areas=['top', 'bottom']] - may include `'top'` and/or `'bottom'`
     */
    fireSyntheticSetTotalsValue: function(x, y, value, areas) {
        var clickEvent = new CustomEvent('fin-set-totals-value', {
            detail: {
                x: x,
                y: y,
                value: value,
                areas: areas
            }
        });
        this.canvas.dispatchEvent(clickEvent);
    }

};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9hZGQtb25zL3RvdGFscy10b29sa2l0L2Zha2VfZjkxMWIwNzEuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9hZGQtb25zL3RvdGFscy10b29sa2l0L2pzL1N1bW1hcnlTdWJncmlkLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvYWRkLW9ucy90b3RhbHMtdG9vbGtpdC9taXgtaW5zL2JlaGF2aW9yLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvYWRkLW9ucy90b3RhbHMtdG9vbGtpdC9taXgtaW5zL2dyaWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIFN1bW1hcnlTdWJncmlkID0gcmVxdWlyZSgnLi9qcy9TdW1tYXJ5U3ViZ3JpZCcpO1xuXG52YXIgdG90YWxzVG9vbGtpdCA9IHtcbiAgICBwcmVpbnN0YWxsOiBmdW5jdGlvbihIeXBlcmdyaWRQcm90b3R5cGUsIEJlaGF2aW9yUHJvdG90eXBlKSB7XG5cbiAgICAgICAgSHlwZXJncmlkUHJvdG90eXBlLm1peEluKHJlcXVpcmUoJy4vbWl4LWlucy9ncmlkJykpO1xuICAgICAgICBCZWhhdmlvclByb3RvdHlwZS5taXhJbihyZXF1aXJlKCcuL21peC1pbnMvYmVoYXZpb3InKSk7XG5cbiAgICAgICAgaWYgKCFCZWhhdmlvclByb3RvdHlwZS5kYXRhTW9kZWxzLlN1bW1hcnlTdWJncmlkKSB7XG5cbiAgICAgICAgICAgIC8vIFJlZ2lzdGVyIGluIGNhc2UgYSBzdWJncmlkIGxpc3QgaXMgaW5jbHVkZWQgaW4gc3RhdGUgb2JqZWN0XG4gICAgICAgICAgICBCZWhhdmlvclByb3RvdHlwZS5kYXRhTW9kZWxzLlN1bW1hcnlTdWJncmlkID0gU3VtbWFyeVN1YmdyaWQ7XG5cbiAgICAgICAgICAgIC8vIEFkZCB0byBkZWZhdWx0IHN1YmdyaWQgbGlzdCBpbiBjYXNlIG5vIHN1YmdyaWQgbGlzdCBpcyBpbmNsdWRlZCBpbiBzdGF0ZSBvYmplY3RcbiAgICAgICAgICAgIHZhciBzcGVjcyA9IEJlaGF2aW9yUHJvdG90eXBlLmRlZmF1bHRTdWJncmlkU3BlY3M7XG4gICAgICAgICAgICBzcGVjcy5zcGxpY2Uoc3BlY3MuaW5kZXhPZignZGF0YScpLCAwLCBbU3VtbWFyeVN1YmdyaWQsIHsgbmFtZTogJ3RvcFRvdGFscycgfV0pO1xuICAgICAgICAgICAgc3BlY3Muc3BsaWNlKHNwZWNzLmluZGV4T2YoJ2RhdGEnKSArIDEsIDAsIFtTdW1tYXJ5U3ViZ3JpZCwgeyBuYW1lOiAnYm90dG9tVG90YWxzJyB9XSk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB0b3RhbHNUb29sa2l0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBpbXBsZW1lbnRzIGRhdGFNb2RlbEFQSVxuICogQHBhcmFtIHtIeXBlcmdyaWR9IGdyaWRcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5uYW1lXVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFN1bW1hcnlTdWJncmlkKGdyaWQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmJlaGF2aW9yID0gZ3JpZC5iZWhhdmlvcjtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtBcnJheTxBcnJheT59XG4gICAgICovXG4gICAgdGhpcy5kYXRhID0gW107XG5cbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLm5hbWUpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgIH1cbn1cblxuU3VtbWFyeVN1YmdyaWQucHJvdG90eXBlID0ge1xuICAgIGNvbnN0cnVjdG9yOiBTdW1tYXJ5U3ViZ3JpZC5wcm90b3R5cGUuY29uc3RydWN0b3IsXG5cbiAgICB0eXBlOiAnc3VtbWFyeScsXG5cbiAgICBoYXNPd25EYXRhOiB0cnVlLCAvLyBkbyBub3QgY2FsbCBzZXREYXRhIGltcGxpY2l0bHlcblxuICAgIGdldFJvd0NvdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGF0YSgpLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5kYXRhO1xuXG4gICAgICAgIGlmICghZGF0YS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGRhdGEgPSB0aGlzLmJlaGF2aW9yLmRhdGFNb2RlbC5kYXRhU291cmNlLmdldEdyYW5kVG90YWxzKCkgfHwgZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBTZXQgc3VtbWFyeSBkYXRhIHJvd3MuXG4gICAgICogQGRlc2MgU2V0IHRvIGFuIGFycmF5IG9mIGRhdGEgcm93IG9iamVjdHMuXG4gICAgICogQHBhcmFtIHtBcnJheTxBcnJheT59IGRhdGEgLSBgW11gIGRlZmVycyB0byBkYXRhIHNvdXJjZSdzIGdyYW5kIHRvdGFscy5cbiAgICAgKi9cbiAgICBzZXREYXRhOiBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB9LFxuXG4gICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgdmFyIHJvdyA9IHRoaXMuZ2V0Um93KHkpO1xuICAgICAgICByZXR1cm4gcm93W3hdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBTZXQgYSB2YWx1ZSBpbiBhIHN1bW1hcnkgcm93LlxuICAgICAqIEBkZXNjIFNldHRpbmcgYSB2YWx1ZSBvbiBhIG5vbi1leHRhbnQgcm93IGNyZWF0ZXMgdGhlIHJvdy5cbiAgICAgKiBAcGFyYW0geFxuICAgICAqIEBwYXJhbSB5XG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICovXG4gICAgc2V0VmFsdWU6IGZ1bmN0aW9uKHgsIHksIHZhbHVlKSB7XG4gICAgICAgIHZhciByb3cgPSB0aGlzLmRhdGFbeV0gPSB0aGlzLmRhdGFbeV0gfHwgQXJyYXkodGhpcy5iZWhhdmlvci5nZXRBY3RpdmVDb2x1bW5Db3VudCgpKTtcbiAgICAgICAgcm93W3hdID0gdmFsdWU7XG4gICAgfSxcblxuICAgIGdldFJvdzogZnVuY3Rpb24oeSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXREYXRhKClbeV07XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdW1tYXJ5U3ViZ3JpZDtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAvKiogQHR5cGVkZWYge0FycmF5fSB2YWx1ZUxpc3RcbiAgICAgKiBAZGVzYyBPbmUgb2Y6XG4gICAgICogKiBgYWN0aXZlQ29sdW1uc0xpc3RgIGZhbHN5IC0gQXJyYXkgb2Ygcm93IHZhbHVlcyBzZW1hbnRpY2FsbHkgY29uZ3J1ZW50IHRvIGB0aGlzLmNvbHVtbnNgLlxuICAgICAqICogYGFjdGl2ZUNvbHVtbnNMaXN0YCB0cnV0aHkgLSBBcnJheSBvZiByb3cgdmFsdWVzIHNlbWFudGljYWxseSBjb25ncnVlbnQgdG8gYHRoaXMuYWxsQ29sdW1uc2AuXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIENvbHVtbiBpbmRleC4gSWYgeW91IGhhdmUgYW4gXCJhY3RpdmVcIiBjb2x1bW4gaW5kZXgsIHlvdSBjYW4gdHJhbnNsYXRlIGl0IHdpdGggYHRoaXMuZ2V0QWN0aXZlQ29sdW1uKHgpLmluZGV4YC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFRvdGFscyByb3cgaW5kZXgsIGxvY2FsIHRvIHRoZSB0b3RhbHMgYXJlYS5cbiAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gW2FyZWFzPVsndG9wJywgJ2JvdHRvbSddXSAtIG1heSBpbmNsdWRlIGAndG9wJ2AgYW5kL29yIGAnYm90dG9tJ2BcbiAgICAgKiBAbWVtYmVyT2YgQmVoYXZpb3IucHJvdG90eXBlXG4gICAgICovXG4gICAgc2V0VG90YWxzVmFsdWU6IGZ1bmN0aW9uKHgsIHksIHZhbHVlLCBhcmVhcykge1xuICAgICAgICBpZiAoIWFyZWFzKSB7XG4gICAgICAgICAgICBhcmVhcyA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMuc3ViZ3JpZHMubG9va3VwLnRvcFRvdGFscykgeyBhcmVhcy5wdXNoKCd0b3AnKTsgfVxuICAgICAgICAgICAgaWYgKHRoaXMuc3ViZ3JpZHMubG9va3VwLmJvdHRvbVRvdGFsKSB7IGFyZWFzLnB1c2goJ2JvdHRvbScpOyB9XG4gICAgICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkoYXJlYXMpKSB7XG4gICAgICAgICAgICBhcmVhcyA9IFthcmVhc107XG4gICAgICAgIH1cbiAgICAgICAgYXJlYXMuZm9yRWFjaChmdW5jdGlvbihhcmVhKSB7XG4gICAgICAgICAgICB0aGlzLmdldFRvdGFscyhhcmVhKVt5XVt4XSA9IHZhbHVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgdGhpcy5ncmlkLnNldFRvdGFsc1ZhbHVlTm90aWZpY2F0aW9uKHgsIHksIHZhbHVlLCBhcmVhcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IFNldCB0aGUgdG9wIHRvdGFsIHJvdyhzKS5cbiAgICAgKiBAcGFyYW0ge3ZhbHVlTGlzdFtdfSBbcm93c10gLSBBcnJheSBvZiAwIG9yIG1vcmUgcm93cyBjb250YWluaW5nIHN1bW1hcnkgZGF0YS4gT21pdCB0byBzZXQgdG8gZW1wdHkgYXJyYXkuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbYWN0aXZlQ29sdW1uc0xpc3Q9ZmFsc2VdXG4gICAgICogQG1lbWJlck9mIEJlaGF2aW9yLnByb3RvdHlwZVxuICAgICAqL1xuICAgIHNldFRvcFRvdGFsczogZnVuY3Rpb24ocm93cywgYWN0aXZlQ29sdW1uc0xpc3QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0VG90YWxzKCd0b3AnLCByb3dzLCBhY3RpdmVDb2x1bW5zTGlzdCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IEdldCB0aGUgdG9wIHRvdGFsIHJvdyhzKS5cbiAgICAgKiBAcmV0dXJucyB7dmFsdWVMaXN0W119XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbYWN0aXZlQ29sdW1uc0xpc3Q9ZmFsc2VdXG4gICAgICogQHJldHVybnMge3ZhbHVlTGlzdHxBcnJheX0gRnVsbCBkYXRhIHJvdyBvYmplY3QsIG9yIG9iamVjdCBjb250YWluaW5nIGp1c3QgdGhlIFwiYWN0aXZlXCIgY29sdW1ucywgcGVyIGBhY3RpdmVDb2x1bW5zTGlzdGAuXG4gICAgICogQG1lbWJlck9mIEJlaGF2aW9yLnByb3RvdHlwZVxuICAgICAqL1xuICAgIGdldFRvcFRvdGFsczogZnVuY3Rpb24oYWN0aXZlQ29sdW1uc0xpc3QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VG90YWxzKCd0b3AnLCBhY3RpdmVDb2x1bW5zTGlzdCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IFNldCB0aGUgYm90dG9tIHRvdGFscy5cbiAgICAgKiBAcGFyYW0ge3ZhbHVlTGlzdFtdfSByb3dzIC0gQXJyYXkgb2YgMCBvciBtb3JlIHJvd3MgY29udGFpbmluZyBzdW1tYXJ5IGRhdGEuIE9taXQgdG8gc2V0IHRvIGVtcHR5IGFycmF5LlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FjdGl2ZUNvbHVtbnNMaXN0PWZhbHNlXSAtIElmIGB0cnVlYCwgYHJvd3NgIG9ubHkgY29udGFpbnMgYWN0aXZlIGNvbHVtbnMuXG4gICAgICogQG1lbWJlck9mIEJlaGF2aW9yLnByb3RvdHlwZVxuICAgICAqL1xuICAgIHNldEJvdHRvbVRvdGFsczogZnVuY3Rpb24ocm93cywgYWN0aXZlQ29sdW1uc0xpc3QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0VG90YWxzKCdib3R0b20nLCByb3dzLCBhY3RpdmVDb2x1bW5zTGlzdCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IEdldCB0aGUgYm90dG9tIHRvdGFsIHJvdyhzKS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthY3RpdmVDb2x1bW5zTGlzdD1mYWxzZV1cbiAgICAgKiBAcmV0dXJucyB7dmFsdWVMaXN0fSBGdWxsIGRhdGEgcm93IG9iamVjdCwgb3Igb2JqZWN0IGNvbnRhaW5pbmcganVzdCB0aGUgXCJhY3RpdmVcIiBjb2x1bW5zLCBwZXIgYGFjdGl2ZUNvbHVtbnNMaXN0YC5cbiAgICAgKiBAbWVtYmVyT2YgQmVoYXZpb3IucHJvdG90eXBlXG4gICAgICovXG4gICAgZ2V0Qm90dG9tVG90YWxzOiBmdW5jdGlvbihhY3RpdmVDb2x1bW5zTGlzdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRUb3RhbHMoJ2JvdHRvbScsIGFjdGl2ZUNvbHVtbnNMaXN0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAgICogQHBhcmFtIHt2YWx1ZUxpc3RbXX0gcm93c1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FjdGl2ZUNvbHVtbnNMaXN0PWZhbHNlXVxuICAgICAqIEByZXR1cm5zIHt2YWx1ZUxpc3RbXX1cbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKiBAbWVtYmVyT2YgQmVoYXZpb3IucHJvdG90eXBlXG4gICAgICovXG4gICAgc2V0VG90YWxzOiBmdW5jdGlvbihrZXksIHJvd3MsIGFjdGl2ZUNvbHVtbnNMaXN0KSB7XG4gICAgICAgIGtleSArPSAnVG90YWxzJztcblxuICAgICAgICB2YXIgdG90YWxzID0gdGhpcy5zdWJncmlkcy5sb29rdXBba2V5XTtcblxuICAgICAgICBpZiAoIXRvdGFscykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IHRoaXMuSHlwZXJncmlkRXJyb3IoJ0V4cGVjdGVkIHN1YmdyaWRzLicgKyBrZXkgKyAnLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSB7XG4gICAgICAgICAgICAvLyBpZiBub3QgYW4gYXJyYXksIGZhaWwgc2lsZW50bHlcbiAgICAgICAgICAgIHJvd3MgPSBbXTtcbiAgICAgICAgfSBlbHNlIGlmIChyb3dzLmxlbmd0aCAmJiAhQXJyYXkuaXNBcnJheShyb3dzWzBdKSkge1xuICAgICAgICAgICAgLy8gaWYgYW4gdW5uZXN0ZWQgYXJyYXkgcmVwcmVzZW50aW5nIGEgc2luZ2xlIHJvdywgbmVzdCBpdFxuICAgICAgICAgICAgcm93cyA9IFtyb3dzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhY3RpdmVDb2x1bW5zTGlzdCkge1xuICAgICAgICAgICAgcm93cy5mb3JFYWNoKGZ1bmN0aW9uKHJvdywgaSwgcm93cykge1xuICAgICAgICAgICAgICAgIHJvd3NbaV0gPSB0aGlzLmV4cGFuZEFjdGl2ZVJvd1RvRGF0YVJvdyhyb3cpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbmV3Um93Q291bnQgPSByb3dzLmxlbmd0aCxcbiAgICAgICAgICAgIG9sZFJvd0NvdW50ID0gdG90YWxzLmdldFJvd0NvdW50KCk7XG5cbiAgICAgICAgdG90YWxzLnNldERhdGEocm93cyk7XG5cbiAgICAgICAgaWYgKG5ld1Jvd0NvdW50ID09PSBvbGRSb3dDb3VudCkge1xuICAgICAgICAgICAgdGhpcy5ncmlkLnJlcGFpbnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZC5iZWhhdmlvci5zaGFwZUNoYW5nZWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByb3dzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthY3RpdmVDb2x1bW5zTGlzdD1mYWxzZV1cbiAgICAgKiBAcmV0dXJucyB7dmFsdWVMaXN0fSBGdWxsIGRhdGEgcm93IG9iamVjdCwgb3Igb2JqZWN0IGNvbnRhaW5pbmcganVzdCB0aGUgXCJhY3RpdmVcIiBjb2x1bW5zLCBwZXIgYGFjdGl2ZUNvbHVtbnNMaXN0YC5cbiAgICAgKiBAbWVtYmVyT2YgQmVoYXZpb3IucHJvdG90eXBlXG4gICAgICovXG4gICAgZ2V0VG90YWxzOiBmdW5jdGlvbihrZXksIGFjdGl2ZUNvbHVtbnNMaXN0KSB7XG4gICAgICAgIGtleSArPSAnVG90YWxzJztcblxuICAgICAgICB2YXIgcm93cyA9IHRoaXMuc3ViZ3JpZHMubG9va3VwW2tleV07XG4gICAgICAgIHJvd3MgPSByb3dzID8gcm93cy5nZXREYXRhKCkgOiBbXTtcblxuICAgICAgICBpZiAoYWN0aXZlQ29sdW1uc0xpc3QpIHtcbiAgICAgICAgICAgIHJvd3MuZm9yRWFjaChmdW5jdGlvbihyb3csIGksIHJvd3MpIHtcbiAgICAgICAgICAgICAgICByb3dzW2ldID0gdGhpcy5jb2xsYXBzZURhdGFSb3dUb0FjdGl2ZVJvdyhyb3cpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcm93cztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbYWN0aXZlQ29sdW1uc0xpc3Q9ZmFsc2VdXG4gICAgICogQHJldHVybnMge3ZhbHVlTGlzdH1cbiAgICAgKiBAbWVtYmVyT2YgQmVoYXZpb3IucHJvdG90eXBlXG4gICAgICovXG4gICAgZXhwYW5kQWN0aXZlUm93VG9EYXRhUm93OiBmdW5jdGlvbihhY3RpdmVDb2x1bW5WYWx1ZXMpIHtcbiAgICAgICAgdmFyIGRhdGFSb3cgPSBBcnJheSh0aGlzLmFsbENvbHVtbnMubGVuZ3RoKTtcblxuICAgICAgICB0aGlzLmNvbHVtbnMuZm9yRWFjaChmdW5jdGlvbihjb2x1bW4sIGkpIHtcbiAgICAgICAgICAgIGlmIChhY3RpdmVDb2x1bW5WYWx1ZXNbaV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGRhdGFSb3dbY29sdW1uLmluZGV4XSA9IGFjdGl2ZUNvbHVtblZhbHVlc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGRhdGFSb3c7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FjdGl2ZUNvbHVtbnNMaXN0PWZhbHNlXVxuICAgICAqIEByZXR1cm5zIHt2YWx1ZUxpc3R9XG4gICAgICogQG1lbWJlck9mIEJlaGF2aW9yLnByb3RvdHlwZVxuICAgICAqL1xuICAgIGNvbGxhcHNlRGF0YVJvd1RvQWN0aXZlUm93OiBmdW5jdGlvbihhbGxDb2x1bW5WYWx1ZXMpIHtcbiAgICAgICAgdmFyIGRhdGFSb3cgPSBBcnJheSh0aGlzLmNvbHVtbnMubGVuZ3RoKTtcblxuICAgICAgICB0aGlzLmNvbHVtbnMuZm9yRWFjaChmdW5jdGlvbihjb2x1bW4sIGkpIHtcbiAgICAgICAgICAgIGlmIChhbGxDb2x1bW5WYWx1ZXNbY29sdW1uLmluZGV4XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZGF0YVJvd1tpXSA9IGFsbENvbHVtblZhbHVlc1tjb2x1bW4uaW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZGF0YVJvdztcbiAgICB9XG5cbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIEBtZW1iZXJPZiBIeXBlcmdyaWQucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBjb2x1bW4gaW5kZXhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIHRvdGFscyByb3cgaW5kZXggbG9jYWwgdG8gdGhlIHRvdGFscyBhcmVhXG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gW2FyZWFzPVsndG9wJywgJ2JvdHRvbSddXSAtIG1heSBpbmNsdWRlIGAndG9wJ2AgYW5kL29yIGAnYm90dG9tJ2BcbiAgICAgKi9cbiAgICBzZXRUb3RhbHNWYWx1ZU5vdGlmaWNhdGlvbjogZnVuY3Rpb24oeCwgeSwgdmFsdWUsIGFyZWFzKSB7XG4gICAgICAgIHRoaXMuZmlyZVN5bnRoZXRpY1NldFRvdGFsc1ZhbHVlKHgsIHksIHZhbHVlLCBhcmVhcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBtZW1iZXJPZiBIeXBlcmdyaWQucHJvdG90eXBlXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBjb2x1bW4gaW5kZXhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIHRvdGFscyByb3cgaW5kZXggbG9jYWwgdG8gdGhlIHRvdGFscyBhcmVhXG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gW2FyZWFzPVsndG9wJywgJ2JvdHRvbSddXSAtIG1heSBpbmNsdWRlIGAndG9wJ2AgYW5kL29yIGAnYm90dG9tJ2BcbiAgICAgKi9cbiAgICBmaXJlU3ludGhldGljU2V0VG90YWxzVmFsdWU6IGZ1bmN0aW9uKHgsIHksIHZhbHVlLCBhcmVhcykge1xuICAgICAgICB2YXIgY2xpY2tFdmVudCA9IG5ldyBDdXN0b21FdmVudCgnZmluLXNldC10b3RhbHMtdmFsdWUnLCB7XG4gICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFyZWFzOiBhcmVhc1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jYW52YXMuZGlzcGF0Y2hFdmVudChjbGlja0V2ZW50KTtcbiAgICB9XG5cbn07XG4iXX0=
