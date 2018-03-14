(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var Column = window.fin.Hypergrid.behaviors.Column; // try require('fin-hypergrid/src/behaviors/Column') when externalized

function Hypersorter(grid, targets) {
    this.grid = grid;

    this.install(targets);

    this.sorts = [];

    grid.behavior.dataModel.charMap.mixIn({
        ASC: '\u25b2', // UPWARDS_BLACK_ARROW, aka '▲'
        DESC: '\u25bc' // DOWNWARDS_BLACK_ARROW, aka '▼'
    });

    grid.addInternalEventListener('fin-column-sort', function(c, keys){
        grid.toggleSort(c, keys);
    });
}

Hypersorter.prototype.name = 'Hypersorter';

Hypersorter.prototype.install = function(targets) {
    var Hypergrid = this.grid.constructor;
    Hypergrid.defaults.mixIn(require('./mix-ins/defaults'));
    Hypergrid.prototype.mixIn(require('./mix-ins/grid'));
    targets = targets || {};
    (targets.Behavior && targets.Behavior.prototype || Object.getPrototypeOf(this.grid.behavior)).mixIn(require('./mix-ins/behavior'));
    (targets.Column || Column).prototype.mixIn(require('./mix-ins/column'));
    (targets.DataModel && targets.DataModel.prototype || Object.getPrototypeOf(this.grid.behavior.dataModel)).mixIn(require('./mix-ins/dataModel'));
};

/** @typedef {object} sortSpecInterface
 * @property {number} columnIndex
 * @property {number} direction
 * @property {string} [type]
 */

/**
 * @implements dataControlInterface#properties
 * @desc See {@link sortSpecInterface} for available sort properties.
 * @memberOf Hypersorter.prototype
 */
Hypersorter.prototype.properties = function(properties) {
    var result, value,
        columnSort = this.grid.behavior.dataModel.getColumnSortState(properties.COLUMN.index);

    if (columnSort) {
        if (properties.GETTER) {
            result = columnSort[properties.GETTER];
            if (result === undefined) {
                result = null;
            }
        } else {
            for (var key in properties) {
                value = properties[key];
                columnSort[key] = typeof value === 'function' ? value() : value;
            }
        }
    }

    return result;
};

window.fin.Hypergrid.Hypersorter = Hypersorter;

},{"./mix-ins/behavior":2,"./mix-ins/column":3,"./mix-ins/dataModel":4,"./mix-ins/defaults":5,"./mix-ins/grid":6}],2:[function(require,module,exports){
'use strict';

module.exports = {

    /**
     * @summary The behaviors's sorter data controller.
     * @desc This getter/setter is syntactic sugar for calls to `getController` and `setController`.
     * @memberOf Behavior#
     */
    get sorter() {
        return this.getController('sorter');
    },
    set sorter(sorter) {
        this.setController('sorter', sorter);
    },

    /**
     * @memberOf Behavior.prototype
     * @param {number} c - grid column index.
     * @param {string[]} keys
     */
    toggleSort: function(c, keys) {
        var column = this.getActiveColumn(c);
        if (column) {
            column.toggleSort(keys);
        }
    },
    sortChanged: function(hiddenColumns){
        if (removeHiddenColumns(
                this.sorter.sorts,
                hiddenColumns || this.getHiddenColumns()
        )) {
            this.reindex();
        }
    }

};
//Logic to moved to adapter layer outside of Hypergrid Core
function removeHiddenColumns(oldSorted, hiddenColumns){
    var dirty = false;
    oldSorted.forEach(function(i) {
        var j = 0,
            colIndex;
        while (j < hiddenColumns.length) {
            colIndex = hiddenColumns[j].index + 1; //hack to get around 0 index
            if (colIndex === i) {
                hiddenColumns[j].unSort();
                dirty = true;
                break;
            }
            j++;
        }
    });
    return dirty;
}

},{}],3:[function(require,module,exports){
'use strict';

module.exports = {
    toggleSort: function(keys) {
        this.dataModel.toggleSort(this, keys);
    },

    unSort: function(deferred) {
        this.dataModel.unSortColumn(this, deferred);
    }
};

},{}],4:[function(require,module,exports){
'use strict';

module.exports = {

    /**
     * @summary The behaviors's sorter data controller.
     * @desc This getter/setter is syntactic sugar for calls to `getController` and `setController`.
     * @param {dataControlInterface|undefined|null} sorter
     * @memberOf Behavior#
     */
    get sorter() {
        return this.getController('sorter');
    },
    set sorter(sorter) {
        this.setController('sorter', sorter);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param column
     * @param keys
     */
    toggleSort: function(column, keys) {
        this.incrementSortState(column, keys);
        this.serializeSortState();
        this.reindex();
    },
    /**
     * @memberOf dataModels.JSON.prototype
     * @param column
     * @param {boolean} deferred
     */
    unSortColumn: function(column, deferred) {
        var sortSpec = this.getColumnSortState(column.index);

        if (sortSpec) {
            this.sorter.sorts.splice(sortSpec.rank, 1); //Removed from sorts
            if (!deferred) {
                this.reindex();
            }
        }

        this.serializeSortState();
    },

    /**
     * @param {number} columnIndex
     * @returns {sortSpecInterface}
     */
    getColumnSortState: function(columnIndex){
        var rank,
            sort = this.sorter.sorts.find(function(sort, index) {
                rank = index;
                return sort.columnIndex === columnIndex;
            });

        return sort && { sort: sort, rank: rank };
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param column
     * @param {string[]} keys
     * @return {object[]} sorts
     */
    incrementSortState: function(column, keys) {
        var sorts = this.sorter.sorts,
            columnIndex = column.index,
            columnSchema = this.schema[columnIndex],
            sortSpec = this.getColumnSortState(columnIndex);

        if (!sortSpec) { // was unsorted
            if (keys.indexOf('CTRL') < 0) {
                sorts.length = 0;
            }
            sorts.unshift({
                columnIndex: columnIndex, // so define and...
                direction: 1, // ...make ascending
                type: columnSchema.type
            });
        } else if (sortSpec.sort.direction > 0) { // was ascending
            sortSpec.sort.direction = -1; // so make descending
        } else { // was descending
            this.unSortColumn(column, true); // so make unsorted
        }

        //Minor improvement, but this check can happen earlier and terminate earlier
        sorts.length = Math.min(sorts.length, this.grid.properties.maxSortColumns);
    },

    serializeSortState: function(){
        this.grid.properties.sorts = this.sorter.sorts;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param index
     * @param returnAsString
     * @desc Provides the unicode character used to denote visually if a column is a sorted state
     * @returns {*}
     */
    getSortImageForColumn: function(columnIndex) {
        var sorts = this.sorter.sorts,
            sortSpec = this.getColumnSortState(columnIndex),
            result, rank;

        if (sortSpec) {
            var directionKey = sortSpec.sort.direction > 0 ? 'ASC' : 'DESC',
                arrow = this.charMap[directionKey];

            result = arrow + ' ';

            if (sorts.length > 1) {
                rank = sorts.length - sortSpec.rank;
                result = rank + result;
            }
        }

        return result;
    }
};

},{}],5:[function(require,module,exports){
'use strict';

exports.maxSortColumns = 3;

},{}],6:[function(require,module,exports){
'use strict';

module.exports = {

    /**
     * @summary The behaviors's sorter data controller.
     * @desc This getter/setter is syntactic sugar for calls to `getController` and `setController`.
     * @memberOf Hypergrid#
     */
    get sorter() {
        return this.getController('sorter');
    },
    set sorter(sorter) {
        this.setController('sorter', sorter);
    },

    /**
     * @memberOf Hypergrid#
     * @param event
     */
    toggleSort: function(event) {
        if (!this.abortEditing()) { return; }

        var behavior = this.behavior,
            self = this,
            c = event.detail.column,
            keys =  event.detail.keys;

        behavior.toggleSort(c, keys);

        setTimeout(function() {
            self.synchronizeScrollingBoundaries();
            behavior.autosizeAllColumns();
            self.repaint();
        }, 10);
    }

};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9hZGQtb25zL2h5cGVyLXNvcnRlci9mYWtlXzRiNzZjZjdjLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvYWRkLW9ucy9oeXBlci1zb3J0ZXIvbWl4LWlucy9iZWhhdmlvci5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL2FkZC1vbnMvaHlwZXItc29ydGVyL21peC1pbnMvY29sdW1uLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvYWRkLW9ucy9oeXBlci1zb3J0ZXIvbWl4LWlucy9kYXRhTW9kZWwuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9hZGQtb25zL2h5cGVyLXNvcnRlci9taXgtaW5zL2RlZmF1bHRzLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvYWRkLW9ucy9oeXBlci1zb3J0ZXIvbWl4LWlucy9ncmlkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb2x1bW4gPSB3aW5kb3cuZmluLkh5cGVyZ3JpZC5iZWhhdmlvcnMuQ29sdW1uOyAvLyB0cnkgcmVxdWlyZSgnZmluLWh5cGVyZ3JpZC9zcmMvYmVoYXZpb3JzL0NvbHVtbicpIHdoZW4gZXh0ZXJuYWxpemVkXG5cbmZ1bmN0aW9uIEh5cGVyc29ydGVyKGdyaWQsIHRhcmdldHMpIHtcbiAgICB0aGlzLmdyaWQgPSBncmlkO1xuXG4gICAgdGhpcy5pbnN0YWxsKHRhcmdldHMpO1xuXG4gICAgdGhpcy5zb3J0cyA9IFtdO1xuXG4gICAgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuY2hhck1hcC5taXhJbih7XG4gICAgICAgIEFTQzogJ1xcdTI1YjInLCAvLyBVUFdBUkRTX0JMQUNLX0FSUk9XLCBha2EgJ+KWsidcbiAgICAgICAgREVTQzogJ1xcdTI1YmMnIC8vIERPV05XQVJEU19CTEFDS19BUlJPVywgYWthICfilrwnXG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEludGVybmFsRXZlbnRMaXN0ZW5lcignZmluLWNvbHVtbi1zb3J0JywgZnVuY3Rpb24oYywga2V5cyl7XG4gICAgICAgIGdyaWQudG9nZ2xlU29ydChjLCBrZXlzKTtcbiAgICB9KTtcbn1cblxuSHlwZXJzb3J0ZXIucHJvdG90eXBlLm5hbWUgPSAnSHlwZXJzb3J0ZXInO1xuXG5IeXBlcnNvcnRlci5wcm90b3R5cGUuaW5zdGFsbCA9IGZ1bmN0aW9uKHRhcmdldHMpIHtcbiAgICB2YXIgSHlwZXJncmlkID0gdGhpcy5ncmlkLmNvbnN0cnVjdG9yO1xuICAgIEh5cGVyZ3JpZC5kZWZhdWx0cy5taXhJbihyZXF1aXJlKCcuL21peC1pbnMvZGVmYXVsdHMnKSk7XG4gICAgSHlwZXJncmlkLnByb3RvdHlwZS5taXhJbihyZXF1aXJlKCcuL21peC1pbnMvZ3JpZCcpKTtcbiAgICB0YXJnZXRzID0gdGFyZ2V0cyB8fCB7fTtcbiAgICAodGFyZ2V0cy5CZWhhdmlvciAmJiB0YXJnZXRzLkJlaGF2aW9yLnByb3RvdHlwZSB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcy5ncmlkLmJlaGF2aW9yKSkubWl4SW4ocmVxdWlyZSgnLi9taXgtaW5zL2JlaGF2aW9yJykpO1xuICAgICh0YXJnZXRzLkNvbHVtbiB8fCBDb2x1bW4pLnByb3RvdHlwZS5taXhJbihyZXF1aXJlKCcuL21peC1pbnMvY29sdW1uJykpO1xuICAgICh0YXJnZXRzLkRhdGFNb2RlbCAmJiB0YXJnZXRzLkRhdGFNb2RlbC5wcm90b3R5cGUgfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMuZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwpKS5taXhJbihyZXF1aXJlKCcuL21peC1pbnMvZGF0YU1vZGVsJykpO1xufTtcblxuLyoqIEB0eXBlZGVmIHtvYmplY3R9IHNvcnRTcGVjSW50ZXJmYWNlXG4gKiBAcHJvcGVydHkge251bWJlcn0gY29sdW1uSW5kZXhcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBkaXJlY3Rpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbdHlwZV1cbiAqL1xuXG4vKipcbiAqIEBpbXBsZW1lbnRzIGRhdGFDb250cm9sSW50ZXJmYWNlI3Byb3BlcnRpZXNcbiAqIEBkZXNjIFNlZSB7QGxpbmsgc29ydFNwZWNJbnRlcmZhY2V9IGZvciBhdmFpbGFibGUgc29ydCBwcm9wZXJ0aWVzLlxuICogQG1lbWJlck9mIEh5cGVyc29ydGVyLnByb3RvdHlwZVxuICovXG5IeXBlcnNvcnRlci5wcm90b3R5cGUucHJvcGVydGllcyA9IGZ1bmN0aW9uKHByb3BlcnRpZXMpIHtcbiAgICB2YXIgcmVzdWx0LCB2YWx1ZSxcbiAgICAgICAgY29sdW1uU29ydCA9IHRoaXMuZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuZ2V0Q29sdW1uU29ydFN0YXRlKHByb3BlcnRpZXMuQ09MVU1OLmluZGV4KTtcblxuICAgIGlmIChjb2x1bW5Tb3J0KSB7XG4gICAgICAgIGlmIChwcm9wZXJ0aWVzLkdFVFRFUikge1xuICAgICAgICAgICAgcmVzdWx0ID0gY29sdW1uU29ydFtwcm9wZXJ0aWVzLkdFVFRFUl07XG4gICAgICAgICAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHByb3BlcnRpZXNba2V5XTtcbiAgICAgICAgICAgICAgICBjb2x1bW5Tb3J0W2tleV0gPSB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgPyB2YWx1ZSgpIDogdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIeXBlcnNvcnRlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBUaGUgYmVoYXZpb3JzJ3Mgc29ydGVyIGRhdGEgY29udHJvbGxlci5cbiAgICAgKiBAZGVzYyBUaGlzIGdldHRlci9zZXR0ZXIgaXMgc3ludGFjdGljIHN1Z2FyIGZvciBjYWxscyB0byBgZ2V0Q29udHJvbGxlcmAgYW5kIGBzZXRDb250cm9sbGVyYC5cbiAgICAgKiBAbWVtYmVyT2YgQmVoYXZpb3IjXG4gICAgICovXG4gICAgZ2V0IHNvcnRlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29udHJvbGxlcignc29ydGVyJyk7XG4gICAgfSxcbiAgICBzZXQgc29ydGVyKHNvcnRlcikge1xuICAgICAgICB0aGlzLnNldENvbnRyb2xsZXIoJ3NvcnRlcicsIHNvcnRlcik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBtZW1iZXJPZiBCZWhhdmlvci5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYyAtIGdyaWQgY29sdW1uIGluZGV4LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nW119IGtleXNcbiAgICAgKi9cbiAgICB0b2dnbGVTb3J0OiBmdW5jdGlvbihjLCBrZXlzKSB7XG4gICAgICAgIHZhciBjb2x1bW4gPSB0aGlzLmdldEFjdGl2ZUNvbHVtbihjKTtcbiAgICAgICAgaWYgKGNvbHVtbikge1xuICAgICAgICAgICAgY29sdW1uLnRvZ2dsZVNvcnQoa2V5cyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNvcnRDaGFuZ2VkOiBmdW5jdGlvbihoaWRkZW5Db2x1bW5zKXtcbiAgICAgICAgaWYgKHJlbW92ZUhpZGRlbkNvbHVtbnMoXG4gICAgICAgICAgICAgICAgdGhpcy5zb3J0ZXIuc29ydHMsXG4gICAgICAgICAgICAgICAgaGlkZGVuQ29sdW1ucyB8fCB0aGlzLmdldEhpZGRlbkNvbHVtbnMoKVxuICAgICAgICApKSB7XG4gICAgICAgICAgICB0aGlzLnJlaW5kZXgoKTtcbiAgICAgICAgfVxuICAgIH1cblxufTtcbi8vTG9naWMgdG8gbW92ZWQgdG8gYWRhcHRlciBsYXllciBvdXRzaWRlIG9mIEh5cGVyZ3JpZCBDb3JlXG5mdW5jdGlvbiByZW1vdmVIaWRkZW5Db2x1bW5zKG9sZFNvcnRlZCwgaGlkZGVuQ29sdW1ucyl7XG4gICAgdmFyIGRpcnR5ID0gZmFsc2U7XG4gICAgb2xkU29ydGVkLmZvckVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICB2YXIgaiA9IDAsXG4gICAgICAgICAgICBjb2xJbmRleDtcbiAgICAgICAgd2hpbGUgKGogPCBoaWRkZW5Db2x1bW5zLmxlbmd0aCkge1xuICAgICAgICAgICAgY29sSW5kZXggPSBoaWRkZW5Db2x1bW5zW2pdLmluZGV4ICsgMTsgLy9oYWNrIHRvIGdldCBhcm91bmQgMCBpbmRleFxuICAgICAgICAgICAgaWYgKGNvbEluZGV4ID09PSBpKSB7XG4gICAgICAgICAgICAgICAgaGlkZGVuQ29sdW1uc1tqXS51blNvcnQoKTtcbiAgICAgICAgICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqKys7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGlydHk7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHRvZ2dsZVNvcnQ6IGZ1bmN0aW9uKGtleXMpIHtcbiAgICAgICAgdGhpcy5kYXRhTW9kZWwudG9nZ2xlU29ydCh0aGlzLCBrZXlzKTtcbiAgICB9LFxuXG4gICAgdW5Tb3J0OiBmdW5jdGlvbihkZWZlcnJlZCkge1xuICAgICAgICB0aGlzLmRhdGFNb2RlbC51blNvcnRDb2x1bW4odGhpcywgZGVmZXJyZWQpO1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgVGhlIGJlaGF2aW9ycydzIHNvcnRlciBkYXRhIGNvbnRyb2xsZXIuXG4gICAgICogQGRlc2MgVGhpcyBnZXR0ZXIvc2V0dGVyIGlzIHN5bnRhY3RpYyBzdWdhciBmb3IgY2FsbHMgdG8gYGdldENvbnRyb2xsZXJgIGFuZCBgc2V0Q29udHJvbGxlcmAuXG4gICAgICogQHBhcmFtIHtkYXRhQ29udHJvbEludGVyZmFjZXx1bmRlZmluZWR8bnVsbH0gc29ydGVyXG4gICAgICogQG1lbWJlck9mIEJlaGF2aW9yI1xuICAgICAqL1xuICAgIGdldCBzb3J0ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbnRyb2xsZXIoJ3NvcnRlcicpO1xuICAgIH0sXG4gICAgc2V0IHNvcnRlcihzb3J0ZXIpIHtcbiAgICAgICAgdGhpcy5zZXRDb250cm9sbGVyKCdzb3J0ZXInLCBzb3J0ZXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAbWVtYmVyT2YgZGF0YU1vZGVscy5KU09OLnByb3RvdHlwZVxuICAgICAqIEBwYXJhbSBjb2x1bW5cbiAgICAgKiBAcGFyYW0ga2V5c1xuICAgICAqL1xuICAgIHRvZ2dsZVNvcnQ6IGZ1bmN0aW9uKGNvbHVtbiwga2V5cykge1xuICAgICAgICB0aGlzLmluY3JlbWVudFNvcnRTdGF0ZShjb2x1bW4sIGtleXMpO1xuICAgICAgICB0aGlzLnNlcmlhbGl6ZVNvcnRTdGF0ZSgpO1xuICAgICAgICB0aGlzLnJlaW5kZXgoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEBtZW1iZXJPZiBkYXRhTW9kZWxzLkpTT04ucHJvdG90eXBlXG4gICAgICogQHBhcmFtIGNvbHVtblxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gZGVmZXJyZWRcbiAgICAgKi9cbiAgICB1blNvcnRDb2x1bW46IGZ1bmN0aW9uKGNvbHVtbiwgZGVmZXJyZWQpIHtcbiAgICAgICAgdmFyIHNvcnRTcGVjID0gdGhpcy5nZXRDb2x1bW5Tb3J0U3RhdGUoY29sdW1uLmluZGV4KTtcblxuICAgICAgICBpZiAoc29ydFNwZWMpIHtcbiAgICAgICAgICAgIHRoaXMuc29ydGVyLnNvcnRzLnNwbGljZShzb3J0U3BlYy5yYW5rLCAxKTsgLy9SZW1vdmVkIGZyb20gc29ydHNcbiAgICAgICAgICAgIGlmICghZGVmZXJyZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlaW5kZXgoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2VyaWFsaXplU29ydFN0YXRlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb2x1bW5JbmRleFxuICAgICAqIEByZXR1cm5zIHtzb3J0U3BlY0ludGVyZmFjZX1cbiAgICAgKi9cbiAgICBnZXRDb2x1bW5Tb3J0U3RhdGU6IGZ1bmN0aW9uKGNvbHVtbkluZGV4KXtcbiAgICAgICAgdmFyIHJhbmssXG4gICAgICAgICAgICBzb3J0ID0gdGhpcy5zb3J0ZXIuc29ydHMuZmluZChmdW5jdGlvbihzb3J0LCBpbmRleCkge1xuICAgICAgICAgICAgICAgIHJhbmsgPSBpbmRleDtcbiAgICAgICAgICAgICAgICByZXR1cm4gc29ydC5jb2x1bW5JbmRleCA9PT0gY29sdW1uSW5kZXg7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc29ydCAmJiB7IHNvcnQ6IHNvcnQsIHJhbms6IHJhbmsgfTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQG1lbWJlck9mIGRhdGFNb2RlbHMuSlNPTi5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0gY29sdW1uXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0ga2V5c1xuICAgICAqIEByZXR1cm4ge29iamVjdFtdfSBzb3J0c1xuICAgICAqL1xuICAgIGluY3JlbWVudFNvcnRTdGF0ZTogZnVuY3Rpb24oY29sdW1uLCBrZXlzKSB7XG4gICAgICAgIHZhciBzb3J0cyA9IHRoaXMuc29ydGVyLnNvcnRzLFxuICAgICAgICAgICAgY29sdW1uSW5kZXggPSBjb2x1bW4uaW5kZXgsXG4gICAgICAgICAgICBjb2x1bW5TY2hlbWEgPSB0aGlzLnNjaGVtYVtjb2x1bW5JbmRleF0sXG4gICAgICAgICAgICBzb3J0U3BlYyA9IHRoaXMuZ2V0Q29sdW1uU29ydFN0YXRlKGNvbHVtbkluZGV4KTtcblxuICAgICAgICBpZiAoIXNvcnRTcGVjKSB7IC8vIHdhcyB1bnNvcnRlZFxuICAgICAgICAgICAgaWYgKGtleXMuaW5kZXhPZignQ1RSTCcpIDwgMCkge1xuICAgICAgICAgICAgICAgIHNvcnRzLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3J0cy51bnNoaWZ0KHtcbiAgICAgICAgICAgICAgICBjb2x1bW5JbmRleDogY29sdW1uSW5kZXgsIC8vIHNvIGRlZmluZSBhbmQuLi5cbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IDEsIC8vIC4uLm1ha2UgYXNjZW5kaW5nXG4gICAgICAgICAgICAgICAgdHlwZTogY29sdW1uU2NoZW1hLnR5cGVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHNvcnRTcGVjLnNvcnQuZGlyZWN0aW9uID4gMCkgeyAvLyB3YXMgYXNjZW5kaW5nXG4gICAgICAgICAgICBzb3J0U3BlYy5zb3J0LmRpcmVjdGlvbiA9IC0xOyAvLyBzbyBtYWtlIGRlc2NlbmRpbmdcbiAgICAgICAgfSBlbHNlIHsgLy8gd2FzIGRlc2NlbmRpbmdcbiAgICAgICAgICAgIHRoaXMudW5Tb3J0Q29sdW1uKGNvbHVtbiwgdHJ1ZSk7IC8vIHNvIG1ha2UgdW5zb3J0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIC8vTWlub3IgaW1wcm92ZW1lbnQsIGJ1dCB0aGlzIGNoZWNrIGNhbiBoYXBwZW4gZWFybGllciBhbmQgdGVybWluYXRlIGVhcmxpZXJcbiAgICAgICAgc29ydHMubGVuZ3RoID0gTWF0aC5taW4oc29ydHMubGVuZ3RoLCB0aGlzLmdyaWQucHJvcGVydGllcy5tYXhTb3J0Q29sdW1ucyk7XG4gICAgfSxcblxuICAgIHNlcmlhbGl6ZVNvcnRTdGF0ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5ncmlkLnByb3BlcnRpZXMuc29ydHMgPSB0aGlzLnNvcnRlci5zb3J0cztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQG1lbWJlck9mIGRhdGFNb2RlbHMuSlNPTi5wcm90b3R5cGVcbiAgICAgKiBAcGFyYW0gaW5kZXhcbiAgICAgKiBAcGFyYW0gcmV0dXJuQXNTdHJpbmdcbiAgICAgKiBAZGVzYyBQcm92aWRlcyB0aGUgdW5pY29kZSBjaGFyYWN0ZXIgdXNlZCB0byBkZW5vdGUgdmlzdWFsbHkgaWYgYSBjb2x1bW4gaXMgYSBzb3J0ZWQgc3RhdGVcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBnZXRTb3J0SW1hZ2VGb3JDb2x1bW46IGZ1bmN0aW9uKGNvbHVtbkluZGV4KSB7XG4gICAgICAgIHZhciBzb3J0cyA9IHRoaXMuc29ydGVyLnNvcnRzLFxuICAgICAgICAgICAgc29ydFNwZWMgPSB0aGlzLmdldENvbHVtblNvcnRTdGF0ZShjb2x1bW5JbmRleCksXG4gICAgICAgICAgICByZXN1bHQsIHJhbms7XG5cbiAgICAgICAgaWYgKHNvcnRTcGVjKSB7XG4gICAgICAgICAgICB2YXIgZGlyZWN0aW9uS2V5ID0gc29ydFNwZWMuc29ydC5kaXJlY3Rpb24gPiAwID8gJ0FTQycgOiAnREVTQycsXG4gICAgICAgICAgICAgICAgYXJyb3cgPSB0aGlzLmNoYXJNYXBbZGlyZWN0aW9uS2V5XTtcblxuICAgICAgICAgICAgcmVzdWx0ID0gYXJyb3cgKyAnICc7XG5cbiAgICAgICAgICAgIGlmIChzb3J0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgcmFuayA9IHNvcnRzLmxlbmd0aCAtIHNvcnRTcGVjLnJhbms7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmFuayArIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5tYXhTb3J0Q29sdW1ucyA9IDM7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgVGhlIGJlaGF2aW9ycydzIHNvcnRlciBkYXRhIGNvbnRyb2xsZXIuXG4gICAgICogQGRlc2MgVGhpcyBnZXR0ZXIvc2V0dGVyIGlzIHN5bnRhY3RpYyBzdWdhciBmb3IgY2FsbHMgdG8gYGdldENvbnRyb2xsZXJgIGFuZCBgc2V0Q29udHJvbGxlcmAuXG4gICAgICogQG1lbWJlck9mIEh5cGVyZ3JpZCNcbiAgICAgKi9cbiAgICBnZXQgc29ydGVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb250cm9sbGVyKCdzb3J0ZXInKTtcbiAgICB9LFxuICAgIHNldCBzb3J0ZXIoc29ydGVyKSB7XG4gICAgICAgIHRoaXMuc2V0Q29udHJvbGxlcignc29ydGVyJywgc29ydGVyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQG1lbWJlck9mIEh5cGVyZ3JpZCNcbiAgICAgKiBAcGFyYW0gZXZlbnRcbiAgICAgKi9cbiAgICB0b2dnbGVTb3J0OiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIXRoaXMuYWJvcnRFZGl0aW5nKCkpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgdmFyIGJlaGF2aW9yID0gdGhpcy5iZWhhdmlvcixcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgYyA9IGV2ZW50LmRldGFpbC5jb2x1bW4sXG4gICAgICAgICAgICBrZXlzID0gIGV2ZW50LmRldGFpbC5rZXlzO1xuXG4gICAgICAgIGJlaGF2aW9yLnRvZ2dsZVNvcnQoYywga2V5cyk7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuc3luY2hyb25pemVTY3JvbGxpbmdCb3VuZGFyaWVzKCk7XG4gICAgICAgICAgICBiZWhhdmlvci5hdXRvc2l6ZUFsbENvbHVtbnMoKTtcbiAgICAgICAgICAgIHNlbGYucmVwYWludCgpO1xuICAgICAgICB9LCAxMCk7XG4gICAgfVxuXG59O1xuIl19
