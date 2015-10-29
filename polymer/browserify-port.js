(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = {
    //CellClick: require('./CellClick.js');
};

},{}],2:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],3:[function(require,module,exports){
'use strict';

function Base() {

};

Base.prototype = {};

Base.prototype.next = null;

Base.prototype.grid = null;

Base.prototype.setGrid = function(newGrid) {
    this.grid = newGrid;
};

Base.prototype.getGrid = function() {
    return this.grid;
};

Base.prototype.getBehavior = function() {
    return this.getGrid().getBehavior();
};

Base.prototype.changed = function() {
    this.getBehavior().changed();
};

Base.prototype.getPrivateState = function() {
    return this.getGrid().getPrivateState();
};

Base.prototype.applyState = function() {

};

module.exports = Base;



},{}],4:[function(require,module,exports){
'use strict';

var Base = require('./Base.js');

var alphaFor = function(i) {
    // Name the column headers in A, .., AA, AB, AC, .., AZ format
    // quotient/remainder
    //var quo = Math.floor(col/27);
    var quo = Math.floor((i) / 26);
    var rem = (i) % 26;
    var code = '';
    if (quo > 0) {
        code += String.fromCharCode('A'.charCodeAt(0) + quo - 1);
    }
    code += String.fromCharCode('A'.charCodeAt(0) + rem);
    return code;
};
//var noop = function() {};
var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function Default() {
    Base.call(this);
};

Default.prototype = Object.create(Base.prototype);

Default.prototype.dataUpdates = {};

/**
* @function
* @instance
* @description
this is the most important behavior function it returns each data point at x,y coordinates
* #### returns: Object
 * @param {integer} x - the x coordinate
 * @param {integer} x - the y coordinate
*/
Default.prototype.getValue = function(x, y) {
    var override = this.dataUpdates['p_' + x + '_' + y];
    if (override) {
        return override;
    }
    if (x === 0) {
        if (y === 0) {
            return '';
        }
        return y;
    }
    if (y === 0) {
        return alphaFor(x - 1);
    }
    return (x - 1) + ', ' + a[(y - 1) % 26];
};

Default.prototype.setValue = function(x, y, value) {
    this.dataUpdates['p_' + x + '_' + y] = value;
};

Default.prototype.getColumnCount = function() {
    return 27;
};

Default.prototype.getRowCount = function() {
    //jeepers batman a quadrillion rows!
    return 53;
};

module.exports = Default;

},{"./Base.js":3}],5:[function(require,module,exports){
'use strict';

var Base = require('./Base.js');

var alphaFor = function(i) {
    // Name the column headers in A, .., AA, AB, AC, .., AZ format
    // quotient/remainder
    //var quo = Math.floor(col/27);
    var quo = Math.floor((i) / 26);
    var rem = (i) % 26;
    var code = '';
    if (quo > 0) {
        code += String.fromCharCode('A'.charCodeAt(0) + quo - 1);
    }
    code += String.fromCharCode('A'.charCodeAt(0) + rem);
    return code;
};
//var noop = function() {};
var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function InMemory() {
    Base.call(this);
};

InMemory.prototype = Object.create(Base.prototype);

InMemory.prototype.dataUpdates = {};

/**
* @function
* @instance
* @description
this is the most important behavior function it returns each data point at x,y coordinates
* #### returns: Object
 * @param {integer} x - the x coordinate
 * @param {integer} x - the y coordinate
*/
InMemory.prototype.getValue = function(x, y) {
    var override = this.dataUpdates['p_' + x + '_' + y];
    if (override) {
        return override;
    }
    if (x === 0) {
        if (y === 0) {
            return '';
        }
        return y;
    }
    if (y === 0) {
        return alphaFor(x - 1);
    }
    return (x - 1) + ', ' + a[(y - 1) % 26];
};

InMemory.prototype.setValue = function(x, y, value) {
    this.dataUpdates['p_' + x + '_' + y] = value;
};

InMemory.prototype.getColumnCount = function() {
    return 27;
};

InMemory.prototype.getRowCount = function() {
    //jeepers batman a quadrillion rows!
    return 53;
};

module.exports = InMemory;

},{"./Base.js":3}],6:[function(require,module,exports){
'use strict';

var Base = require('./Base.js');

var alphaFor = function(i) {
    // Name the column headers in A, .., AA, AB, AC, .., AZ format
    // quotient/remainder
    //var quo = Math.floor(col/27);
    var quo = Math.floor((i) / 26);
    var rem = (i) % 26;
    var code = '';
    if (quo > 0) {
        code += String.fromCharCode('A'.charCodeAt(0) + quo - 1);
    }
    code += String.fromCharCode('A'.charCodeAt(0) + rem);
    return code;
};
//var noop = function() {};
var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function JSON() {
    Base.call(this);
};

JSON.prototype = Object.create(Base.prototype);

var valueOrFunctionExecute = function(valueOrFunction) {
    var isFunction = (((typeof valueOrFunction)[0]) === 'f');
    var result = isFunction ? valueOrFunction() : valueOrFunction;
    return result;
};

var textMatchFilter = function(string) {
    return function(each) {
        each = valueOrFunctionExecute(each);
        return (each + '').toLowerCase().search(string.toLowerCase()) === 0;
    };
};

var nullDataSource = {
    isNullObject: function() {
        return true;
    },
    getFields: function() {
        return [];
    },
    getHeaders: function() {
        return [];
    },
    getColumnCount: function() {
        return 0;
    },
    getRowCount: function() {
        return 0;
    },
    getGrandTotals: function() {
        return [];
    },
    hasAggregates: function() {
        return false;
    },
    hasGroups: function() {
        return false;
    },
    getRow: function() {
        return null;
    }
};


//null object pattern for the source object
JSON.prototype.source = nullDataSource,
JSON.prototype.preglobalfilter = nullDataSource,
JSON.prototype.prefilter = nullDataSource,
JSON.prototype.presorter = nullDataSource,
JSON.prototype.analytics = nullDataSource,
JSON.prototype.postfilter = nullDataSource,
JSON.prototype.postsorter = nullDataSource,
JSON.prototype.topTotals = [],

JSON.prototype.hasAggregates = function() {
    return this.analytics.hasAggregates();
};
JSON.prototype.hasGroups = function() {
    return this.analytics.hasGroups();
};
JSON.prototype.getDataSource = function() {
    var source = this.analytics; //this.hasAggregates() ? this.analytics : this.presorter;
    return source;
};
JSON.prototype.getFilterSource = function() {
    var source = this.prefilter; //this.hasAggregates() ? this.postfilter : this.prefilter;
    return source;
};
JSON.prototype.getSortingSource = function() {
    var source = this.presorter; //this.hasAggregates() ? this.postsorter : this.presorter;
    return source;
};
JSON.prototype.getValue = function(x, y) {
    var hasHierarchyColumn = this.hasHierarchyColumn();
    var grid = this.getGrid();
    var headerRowCount = grid.getHeaderRowCount();
    var value;
    if (hasHierarchyColumn && x === -2) {
        x = 0;
    }
    if (y < headerRowCount) {
        value = this.getHeaderRowValue(x, y);
        return value;
    }
    if (hasHierarchyColumn) {
        y += 1;
    }
    value = this.getDataSource().getValue(x, y - headerRowCount);
    return value;
};
JSON.prototype.getHeaderRowValue = function(x, y) {
    if (y === undefined) {
        return this.getHeaders()[Math.max(x, 0)];
    }
    var grid = this.getGrid();
    var behavior = grid.getBehavior();
    var isFilterRow = grid.isShowFilterRow();
    var isHeaderRow = grid.isShowHeaderRow();
    var isBoth = isFilterRow && isHeaderRow;
    var topTotalsOffset = (isFilterRow ? 1 : 0) + (isHeaderRow ? 1 : 0);
    if (y >= topTotalsOffset) {
        return this.getTopTotals()[y - topTotalsOffset][x];
    }
    var filter = this.getFilter(x);
    var image = filter.length === 0 ? 'filter-off' : 'filter-on';
    if (isBoth) {
        if (y === 0) {
            image = this.getSortImageForColumn(x);
            return [null, this.getHeaders()[x], image];
        } else {
            return [null, filter, behavior.getImage(image)];
        }
    } else if (isFilterRow) {
        return [null, filter, behavior.getImage(image)];
    } else {
        image = this.getSortImageForColumn(x);
        return [null, this.getHeaders()[x], image];
    }
    return '';
};
JSON.prototype.setValue = function(x, y, value) {
    var hasHierarchyColumn = this.hasHierarchyColumn();
    var grid = this.getGrid();
    var headerRowCount = grid.getHeaderRowCount();
    if (hasHierarchyColumn) {
        if (x === -2) {
            return;
        } else {
            x += 1;
        }
    }
    if (y < headerRowCount) {
        this.setHeaderRowValue(x, y, value);
    } else if (hasHierarchyColumn) {
        y += 1;
    } else {
        this.getDataSource().setValue(x, y - headerRowCount, value);
    }
    this.changed();
};
JSON.prototype.setHeaderRowValue = function(x, y, value) {
    if (value === undefined) {
        return this._setHeader(x, y); // y is really the value
    }
    var grid = this.getGrid();
    var isFilterRow = grid.isShowFilterRow();
    var isHeaderRow = grid.isShowHeaderRow();
    var isBoth = isFilterRow && isHeaderRow;
    var topTotalsOffset = (isFilterRow ? 1 : 0) + (isHeaderRow ? 1 : 0);
    if (y >= topTotalsOffset) {
        this.getTopTotals()[y - topTotalsOffset][x] = value;
    } else if (x === -1) {
        return; // can't change the row numbers
    } else if (isBoth) {
        if (y === 0) {
            return this._setHeader(x, value);
        } else {
            this.setFilter(x, value);
        }
    } else if (isFilterRow) {
        this.setFilter(x, value);
    } else {
        return this._setHeader(x, value);
    }
    return '';
};
JSON.prototype.getColumnProperties = function(x) {
    //access directly because we want it ordered
    var column = this.getBehavior().allColumns[x];
    if (column) {
        return column.getProperties();
    }
    return undefined;
};
JSON.prototype.getFilter = function(x) {
    var columnProperties = this.getColumnProperties(x);
    if (!columnProperties) {
        return '';
    }
    var filter = columnProperties.filter || '';
    return filter;
};
JSON.prototype.setFilter = function(x, value) {
    var columnProperties = this.getColumnProperties(x);
    columnProperties.filter = value;
    this.applyAnalytics();
};
JSON.prototype.getColumnCount = function() {
    var count = this.analytics.getColumnCount();
    return count;
};
JSON.prototype.getRowCount = function() {
    var grid = this.getGrid();
    var count = this.getDataSource().getRowCount();
    count += grid.getHeaderRowCount();
    return count;
};
JSON.prototype.getHeaders = function() {
    var headers = this.analytics.getHeaders();
    return headers;
};
JSON.prototype.getDefaultHeaders = function() {};
JSON.prototype.setHeaders = function(headers) {
    this.getDataSource().setHeaders(headers);
};
JSON.prototype.setFields = function(fields) {
    this.getDataSource().setFields(fields);
};
JSON.prototype.getFields = function() {
    var fields = this.getDataSource().getFields();
    return fields;
};
JSON.prototype.setData = function(arrayOfUniformObjects) {
    if (!this.analytics.isNullObject) {
        this.analytics.dataSource.setData(arrayOfUniformObjects);
    } else {
        this.source = new fin.analytics.JSDataSource(arrayOfUniformObjects); /* jshint ignore:line */
        this.preglobalfilter = new fin.analytics.DataSourceGlobalFilter(this.source); /* jshint ignore:line */
        this.prefilter = new fin.analytics.DataSourceFilter(this.preglobalfilter); /* jshint ignore:line */
        this.presorter = new fin.analytics.DataSourceSorterComposite(this.prefilter); /* jshint ignore:line */
        this.analytics = new fin.analytics.DataSourceAggregator(this.presorter); /* jshint ignore:line */
    }
    this.applyAnalytics();
    //this.postfilter = new fin.analytics.DataSourceFilter(this.analytics); /* jshint ignore:line */
    //this.postsorter = new fin.analytics.DataSourceSorterComposite(this.postfilter); /* jshint ignore:line */
};
JSON.prototype.getTopTotals = function() {
    if (!this.hasAggregates()) {
        return this.topTotals;
    }
    return this.getDataSource().getGrandTotals();
};
JSON.prototype.setTopTotals = function(nestedArray) {
    this.topTotals = nestedArray;
};
JSON.prototype.setGroups = function(groups) {
    this.analytics.setGroupBys(groups);
    this.applyAnalytics();
    this.getGrid().fireSyntheticGroupsChangedEvent(this.getGroups());
};
JSON.prototype.getGroups = function() {
    var headers = this.getHeaders().slice(0);
    var fields = this.getFields().slice(0);
    var groupBys = this.analytics.groupBys;
    var groups = [];
    for (var i = 0; i < groupBys.length; i++) {
        var field = headers[groupBys[i]];
        groups.push({
            id: groupBys[i],
            label: field,
            field: fields
        });
    }
    return groups;
};

JSON.prototype.getAvailableGroups = function() {
    var headers = this.source.getHeaders().slice(0);
    var groupBys = this.analytics.groupBys;
    var groups = [];
    for (var i = 0; i < headers.length; i++) {
        if (groupBys.indexOf(i) === -1) {
            var field = headers[i];
            groups.push({
                id: i,
                label: field,
                field: field
            });
        }
    }
    return groups;
};

JSON.prototype.getVisibleColumns = function() {
    var items = this.getBehavior().columns;
    items = items.filter(function(each) {
        return each.label !== 'Tree';
    });
    return items;
};

JSON.prototype.getHiddenColumns = function() {
    var visible = this.getBehavior().columns;
    var all = this.getBehavior().allColumns;
    var hidden = [];
    for (var i = 0; i < all.length; i++) {
        if (visible.indexOf(all[i]) === -1) {
            hidden.push(all[i]);
        }
    }
    hidden.sort(function(a, b) {
        return a.label < b.label;
    });
    return hidden;
};

JSON.prototype.setAggregates = function(aggregations) {
    this.quietlySetAggregates(aggregations);
    this.applyAnalytics();
};
JSON.prototype.quietlySetAggregates = function(aggregations) {
    this.analytics.setAggregates(aggregations);
};
JSON.prototype.hasHierarchyColumn = function() {
    return this.hasAggregates() && this.hasGroups();
};
JSON.prototype.applyAnalytics = function() {
    this.applyFilters();
    this.applySorts();
    this.applyGroupBysAndAggregations();
};
JSON.prototype.applyGroupBysAndAggregations = function() {
    if (this.analytics.aggregates.length === 0) {
        this.quietlySetAggregates({});
    }
    this.analytics.apply();
};
JSON.prototype.applyFilters = function() {
    this.preglobalfilter.applyFilters();
    var colCount = this.getColumnCount();
    var filterSource = this.getFilterSource();
    var groupOffset = this.hasAggregates() ? 1 : 0;
    filterSource.clearFilters();
    for (var i = 0; i < colCount; i++) {
        var filterText = this.getFilter(i);
        if (filterText.length > 0) {
            filterSource.addFilter(i - groupOffset, textMatchFilter(filterText));
        }
    }
    filterSource.applyFilters();
};
JSON.prototype.toggleSort = function(index, keys) {
    this.incrementSortState(index, keys);
    this.applyAnalytics();
};
JSON.prototype.incrementSortState = function(colIndex, keys) {
    colIndex++; //hack to get around 0 index
    var state = this.getPrivateState();
    var hasCTRL = keys.indexOf('CTRL') > -1;
    state.sorts = state.sorts || [];
    var already = state.sorts.indexOf(colIndex);
    if (already === -1) {
        already = state.sorts.indexOf(-1 * colIndex);
    }
    if (already > -1) {
        if (state.sorts[already] > 0) {
            state.sorts[already] = -1 * state.sorts[already];
        } else {
            state.sorts.splice(already, 1);
        }
    } else if (hasCTRL || state.sorts.length === 0) {
        state.sorts.unshift(colIndex);
    } else {
        state.sorts.length = 0;
        state.sorts.unshift(colIndex);
    }
    if (state.sorts.length > 3) {
        state.sorts.length = 3;
    }
};
JSON.prototype.applySorts = function() {
    var sortingSource = this.getSortingSource();
    var sorts = this.getPrivateState().sorts;
    var groupOffset = this.hasAggregates() ? 1 : 0;
    if (!sorts || sorts.length === 0) {
        sortingSource.clearSorts();
    } else {
        for (var i = 0; i < sorts.length; i++) {
            var colIndex = Math.abs(sorts[i]) - 1;
            var type = sorts[i] < 0 ? -1 : 1;
            sortingSource.sortOn(colIndex - groupOffset, type);
        }
    }
    sortingSource.applySorts();
};
JSON.prototype.getSortImageForColumn = function(index) {
    index++;
    var up = true;
    var sorts = this.getPrivateState().sorts;
    if (!sorts) {
        return null;
    }
    var position = sorts.indexOf(index);
    if (position < 0) {
        position = sorts.indexOf(-1 * index);
        up = false;
    }
    if (position < 0) {
        return null;
    }
    position++;
    var name = (1 + sorts.length - position) + (up ? '-up' : '-down');
    return this.getBehavior().getImage(name);
};
JSON.prototype.cellClicked = function(cell, event) {
    if (!this.hasAggregates()) {
        return;
    }
    if (event.gridCell.x !== 0) {
        return; // this wasn't a click on the hierarchy column
    }
    var grid = this.getGrid();
    var headerRowCount = grid.getHeaderRowCount();
    var y = event.gridCell.y - headerRowCount;
    this.analytics.click(y);
};
JSON.prototype.getRow = function(y) {
    var grid = this.getGrid();
    var headerRowCount = grid.getHeaderRowCount();
    if (y < headerRowCount && !this.hasAggregates()) {
        var topTotals = this.getTopTotals();
        return topTotals[y - (headerRowCount - topTotals.length)];
    }
    return this.getDataSource().getRow(y - headerRowCount);
};
JSON.prototype.buildRow = function(y) {
    var colCount = this.getColumnCount();
    var fields = [].concat(this.getFields());
    var result = {};
    if (this.hasAggregates()) {
        result.tree = this.getValue(-2, y);
        fields.shift();
    }
    for (var i = 0; i < colCount; i++) {
        result[fields[i]] = this.getValue(i, y);
    }
    return result;
};
JSON.prototype.getComputedRow = function(y) {
    var rcf = this.getRowContextFunction([y]);
    var fields = this.getFields();
    var row = {};
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        row[field] = rcf(field)[0];
    }
    return row;
};

JSON.prototype.getValueByField = function(fieldName, y) {
    var index = this.getFields().indexOf(fieldName);
    if (this.hasAggregates()) {
        y += 1;
    }
    return this.getDataSource().getValue(index, y);
};

JSON.prototype.setGlobalFilter = function(string) {
    if (!string || string.length === 0) {
        this.preglobalfilter.clearFilters();
    } else {
        this.preglobalfilter.setFilter(textMatchFilter(string));
    }
    this.applyAnalytics();
};
JSON.prototype.getCellRenderer = function(config, x, y, untranslatedX, untranslatedY) {
    var renderer;
    var provider = this.getGrid().getCellProvider();

    config.x = x;
    config.y = y;
    config.untranslatedX = untranslatedX;
    config.untranslatedY = untranslatedY;

    renderer = provider.getCell(config);
    renderer.config = config;

    return renderer;
};
JSON.prototype.applyState = function() {
    this.applyAnalytics();
};

module.exports = JSON;

},{"./Base.js":3}],7:[function(require,module,exports){
'use strict';

module.exports = {
    Default: require('./Default.js'),
    InMemory: require('./InMemory.js'),
    JSON: require('./JSON.js')
};

},{"./Default.js":4,"./InMemory.js":5,"./JSON.js":6}],8:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

function Base() {

};

Base.prototype = {};

/**
 * @property {fin-hypergrid-feature-base} next - the next feature to be given a chance to handle incoming events
 * @instance
 */
Base.prototype.next = null;

/**
 * @property {fin-hypergrid-feature-base} detached - a temporary holding field for my next feature when I'm in a disconnected state
 * @instance
 */
Base.prototype.detached = null;

/**
 * @property {string} cursor - the cursor I want to be displayed
 * @instance
 */
Base.prototype.cursor = null;

/**
 * @property {rectangle.point} currentHoverCell - the cell location where the cursor is currently
 * @instance
 */
Base.prototype.currentHoverCell = null;

/**
* @function
* @instance
* @description
set my next field, or if it's populated delegate to the feature in my next field
* @param {fin-hypergrid-feature-base} nextFeature - this is how we build the chain of responsibility
*/
Base.prototype.setNext = function(nextFeature) {
    if (this.next) {
        this.next.setNext(nextFeature);
    } else {
        this.next = nextFeature;
        this.detached = nextFeature;
    }
};

/**
* @function
* @instance
* @description
disconnect my child
*/
Base.prototype.detachChain = function() {
    this.next = null;
};

/**
* @function
* @instance
* @description
reattach my child from the detached reference
*/
Base.prototype.attachChain = function() {
    this.next = this.detached;
};

/**
* @function
* @instance
* @description
 handle mouse move down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseMove = function(grid, event) {
    if (this.next) {
        this.next.handleMouseMove(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseExit = function(grid, event) {
    if (this.next) {
        this.next.handleMouseExit(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseEnter = function(grid, event) {
    if (this.next) {
        this.next.handleMouseEnter(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseDown = function(grid, event) {
    if (this.next) {
        this.next.handleMouseDown(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseUp = function(grid, event) {
    if (this.next) {
        this.next.handleMouseUp(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleKeyDown = function(grid, event) {
    if (this.next) {
        this.next.handleKeyDown(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleKeyUp = function(grid, event) {
    if (this.next) {
        this.next.handleKeyUp(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleWheelMoved = function(grid, event) {
    if (this.next) {
        this.next.handleWheelMoved(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleDoubleClick = function(grid, event) {
    if (this.next) {
        this.next.handleDoubleClick(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleHoldPulse = function(grid, event) {
    if (this.next) {
        this.next.handleHoldPulse(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleTap = function(grid, event) {
    if (this.next) {
        this.next.handleTap(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseDrag = function(grid, event) {
    if (this.next) {
        this.next.handleMouseDrag(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleContextMenu = function(grid, event) {
    if (this.next) {
        this.next.handleContextMenu(grid, event);
    }
};

/**
* @function
* @instance
* @description
 toggle the column picker
*/

Base.prototype.toggleColumnPicker = function(grid) {
    if (this.next) {
        this.next.toggleColumnPicker(grid);
    }
};


/**
* @function
* @instance
* @description
 toggle the column picker
*/

Base.prototype.moveSingleSelect = function(grid, x, y) {
    if (this.next) {
        this.next.moveSingleSelect(grid, x, y);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.isFixedRow = function(grid, event) {
    var gridCell = event.viewPoint;
    var isFixed = gridCell.y < grid.getFixedRowCount();
    return isFixed;
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.isFirstFixedRow = function(grid, event) {
    var gridCell = event.viewPoint;
    var isFixed = gridCell.y < 1;
    return isFixed;
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.isFixedColumn = function(grid, event) {
    var gridCell = event.viewPoint;
    var isFixed = gridCell.x < grid.getFixedColumnCount();
    return isFixed;
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.isFirstFixedColumn = function(grid, event) {
    var gridCell = event.viewPoint;
    var edge = grid.isShowRowNumbers() ? 0 : 1;
    var isFixed = gridCell.x < edge;
    return isFixed;
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.isTopLeft = function(grid, event) {
    var isTopLeft = this.isFixedRow(grid, event) && this.isFixedColumn(grid, event);
    return isTopLeft;
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.setCursor = function(grid) {
    if (this.next) {
        this.next.setCursor(grid);
    }
    if (this.cursor) {
        grid.beCursor(this.cursor);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.initializeOn = function(grid) {
    if (this.next) {
        this.next.initializeOn(grid);
    }
};


module.exports = Base;

},{}],9:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function CellClick() {
    Base.call(this);
    this.alias = 'CellClick';
};

CellClick.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellClick.prototype.handleTap = function(grid, event) {
    var gridCell = event.gridCell;
    var behavior = grid.getBehavior();
    var headerRowCount = behavior.getHeaderRowCount();
    var headerColumnCount = behavior.getHeaderColumnCount();
    if ((gridCell.y >= headerRowCount) &&
        (gridCell.x >= headerColumnCount)) {
        grid.cellClicked(event);
    } else if (this.next) {
        this.next.handleTap(grid, event);
    }
};

module.exports = CellClick;

},{"./Base.js":8}],10:[function(require,module,exports){
'use strict';

/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function CellEditing() {
    Base.call(this);
    this.alias = 'CellEditing';
};

CellEditing.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellEditing.prototype.handleDoubleClick = function(grid, event) {
    var behavior = grid.getBehavior();
    var headerRowCount = behavior.getHeaderRowCount();
    var headerColumnCount = behavior.getHeaderColumnCount();
    var gridCell = event.gridCell;
    if (gridCell.x >= headerColumnCount && gridCell.y >= headerRowCount) {
        grid._activateEditor(event);
    } else if (this.next) {
        this.next.handleDoubleClick(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellEditing.prototype.handleHoldPulse = function(grid, event) {
    var behavior = grid.getBehavior();
    var headerRowCount = behavior.getHeaderRowCount();
    var headerColumnCount = behavior.getHeaderColumnCount();
    var gridCell = event.gridCell;
    if (gridCell.x >= headerColumnCount && gridCell.y >= headerRowCount) {
        grid._activateEditor(event);
    } else if (this.next) {
        this.next.handleHoldPulse(grid, event);
    }
};

module.exports = CellEditing;

},{"./Base.js":8}],11:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function CellSelection() {
    Base.call(this);
    this.alias = 'CellSelection';
};

CellSelection.prototype = Object.create(Base.prototype);

/**
 * @property {fin-rectangle.point} currentDrag - currentDrag is the pixel location of the mouse pointer during a drag operation
 * @instance
 */
CellSelection.prototype.currentDrag = null;

/**
 * @property {Object} lastDragCell - lastDragCell is the cell coordinates of the where the mouse pointer is during a drag operation
 * @instance
 */
CellSelection.prototype.lastDragCell = null;

/**
 * @property {Number} sbLastAuto - sbLastAuto is a millisecond value representing the previous time an autoscroll started
 * @instance
 */
CellSelection.prototype.sbLastAuto = 0;

/**
 * @property {Number} sbAutoStart - sbAutoStart is a millisecond value representing the time the current autoscroll started
 * @instance
 */
CellSelection.prototype.sbAutoStart = 0;

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleMouseUp = function(grid, event) {
    if (this.dragging) {
        this.dragging = false;
    }
    if (this.next) {
        this.next.handleMouseUp(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleMouseDown = function(grid, event) {


    var isRightClick = event.primitiveEvent.detail.isRightClick;
    var behavior = grid.getBehavior();
    var cell = event.gridCell;
    var viewCell = event.viewPoint;
    var dx = cell.x;
    var dy = cell.y;
    var headerRowCount = behavior.getHeaderRowCount();
    var headerColumnCount = behavior.getHeaderColumnCount();

    var isHeader = dy < headerRowCount || dx < headerColumnCount;

    if (!grid.isCellSelection() || isRightClick || isHeader) {
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    } else {

        var numFixedColumns = grid.getFixedColumnCount();
        var numFixedRows = grid.getFixedRowCount();

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.x < numFixedColumns) {
            dx = viewCell.x;
        }

        if (viewCell.y < numFixedRows) {
            dy = viewCell.y;
        }

        var dCell = grid.newPoint(dx, dy);

        var primEvent = event.primitiveEvent;
        var keys = primEvent.detail.keys;
        this.dragging = true;
        this.extendSelection(grid, dCell, keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleMouseDrag = function(grid, event) {
    var isRightClick = event.primitiveEvent.detail.isRightClick;

    if (!grid.isCellSelection() || isRightClick || !this.dragging) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    } else {

        var numFixedColumns = grid.getFixedColumnCount();
        var numFixedRows = grid.getFixedRowCount();

        var cell = event.gridCell;
        var viewCell = event.viewPoint;
        var dx = cell.x;
        var dy = cell.y;

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.x < numFixedColumns) {
            dx = viewCell.x;
        }

        if (viewCell.y < numFixedRows) {
            dy = viewCell.y;
        }

        var dCell = grid.newPoint(dx, dy);

        var primEvent = event.primitiveEvent;
        this.currentDrag = primEvent.detail.mouse;
        this.lastDragCell = dCell;

        this.checkDragScroll(grid, this.currentDrag);
        this.handleMouseDragCellSelection(grid, dCell, primEvent.detail.keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleKeyDown = function(grid, event) {
    var command = 'handle' + event.detail.char;
    if (this[command]) {
        this[command].call(this, grid, event.detail);
    }
};

/**
* @function
* @instance
* @description
Handle a mousedrag selection
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
CellSelection.prototype.handleMouseDragCellSelection = function(grid, gridCell /* ,keys */ ) {

    var behavior = grid.getBehavior();
    var headerRowCount = behavior.getHeaderRowCount();
    var headerColumnCount = behavior.getHeaderColumnCount();
    var x = gridCell.x;
    var y = gridCell.y;
    x = Math.max(headerColumnCount, x);
    y = Math.max(headerRowCount, y);



    var previousDragExtent = grid.getDragExtent();
    var mouseDown = grid.getMouseDown();

    //var scrollingNow = grid.isScrollingNow();

    var newX = x - mouseDown.x;
    var newY = y - mouseDown.y;

    if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
        return;
    }

    grid.clearMostRecentSelection();

    grid.select(mouseDown.x, mouseDown.y, newX, newY);
    grid.setDragExtent(grid.newPoint(newX, newY));

    grid.repaint();
};

/**
* @function
* @instance
* @description
this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
*/
CellSelection.prototype.checkDragScroll = function(grid, mouse) {
    if (!grid.resolveProperty('scrollingEnabled')) {
        return;
    }
    var b = grid.getDataBounds();
    var inside = b.contains(mouse);
    if (inside) {
        if (grid.isScrollingNow()) {
            grid.setScrollingNow(false);
        }
    } else if (!grid.isScrollingNow()) {
        grid.setScrollingNow(true);
        this.scrollDrag(grid);
    }
};

/**
* @function
* @instance
* @description
this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
CellSelection.prototype.scrollDrag = function(grid) {

    if (!grid.isScrollingNow()) {
        return;
    }

    var dragStartedInHeaderArea = grid.isMouseDownInHeaderArea();
    var lastDragCell = this.lastDragCell;
    var b = grid.getDataBounds();
    var xOffset = 0;
    var yOffset = 0;

    var numFixedColumns = grid.getFixedColumnCount();
    var numFixedRows = grid.getFixedRowCount();

    var dragEndInFixedAreaX = lastDragCell.x < numFixedColumns;
    var dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

    if (!dragStartedInHeaderArea) {
        if (this.currentDrag.x < b.origin.x) {
            xOffset = -1;
        }
        if (this.currentDrag.y < b.origin.y) {
            yOffset = -1;
        }
    }
    if (this.currentDrag.x > b.origin.x + b.extent.x) {
        xOffset = 1;
    }
    if (this.currentDrag.y > b.origin.y + b.extent.y) {
        yOffset = 1;
    }

    var dragCellOffsetX = xOffset;
    var dragCellOffsetY = yOffset;

    if (dragEndInFixedAreaX) {
        dragCellOffsetX = 0;
    }

    if (dragEndInFixedAreaY) {
        dragCellOffsetY = 0;
    }

    this.lastDragCell = lastDragCell.plusXY(dragCellOffsetX, dragCellOffsetY);
    grid.scrollBy(xOffset, yOffset);
    this.handleMouseDragCellSelection(grid, lastDragCell, []); // update the selection
    grid.repaint();
    setTimeout(this.scrollDrag.bind(this, grid), 25);
};

/**
* @function
* @instance
* @description
extend a selection or create one if there isnt yet
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} gridCell - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
CellSelection.prototype.extendSelection = function(grid, gridCell, keys) {
    var hasCTRL = keys.indexOf('CTRL') !== -1;
    var hasSHIFT = keys.indexOf('SHIFT') !== -1;
    // var scrollTop = grid.getVScrollValue();
    // var scrollLeft = grid.getHScrollValue();

    // var numFixedColumns = 0;//grid.getFixedColumnCount();
    // var numFixedRows = 0;//grid.getFixedRowCount();

    var mousePoint = grid.getMouseDown();
    var x = gridCell.x; // - numFixedColumns + scrollLeft;
    var y = gridCell.y; // - numFixedRows + scrollTop;

    //were outside of the grid do nothing
    if (x < 0 || y < 0) {
        return;
    }

    //we have repeated a click in the same spot deslect the value from last time
    if (x === mousePoint.x && y === mousePoint.y) {
        grid.clearMostRecentSelection();
        grid.popMouseDown();
        grid.repaint();
        return;
    }

    if (!hasCTRL && !hasSHIFT) {
        grid.clearSelections();
    }

    if (hasSHIFT) {
        grid.clearMostRecentSelection();
        grid.select(mousePoint.x, mousePoint.y, x - mousePoint.x, y - mousePoint.y);
        grid.setDragExtent(grid.newPoint(x - mousePoint.x, y - mousePoint.y));
    } else {
        grid.select(x, y, 0, 0);
        grid.setMouseDown(grid.newPoint(x, y));
        grid.setDragExtent(grid.newPoint(0, 0));
    }
    grid.repaint();
};


/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
CellSelection.prototype.handleDOWNSHIFT = function(grid) {
    this.moveShiftSelect(grid, 0, 1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleUPSHIFT = function(grid) {
    this.moveShiftSelect(grid, 0, -1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleLEFTSHIFT = function(grid) {
    this.moveShiftSelect(grid, -1, 0);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleRIGHTSHIFT = function(grid) {
    this.moveShiftSelect(grid, 1, 0);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleDOWN = function(grid, event) {
    //keep the browser viewport from auto scrolling on key event
    event.primitiveEvent.preventDefault();

    var count = this.getAutoScrollAcceleration();
    this.moveSingleSelect(grid, 0, count);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleUP = function(grid, event) {
    //keep the browser viewport from auto scrolling on key event
    event.primitiveEvent.preventDefault();

    var count = this.getAutoScrollAcceleration();
    this.moveSingleSelect(grid, 0, -count);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleLEFT = function(grid) {
    this.moveSingleSelect(grid, -1, 0);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleRIGHT = function(grid) {
    this.moveSingleSelect(grid, 1, 0);
};

/**
* @function
* @instance
* @description
If we are holding down the same navigation key, accelerate the increment we scroll
* #### returns: integer
*/
CellSelection.prototype.getAutoScrollAcceleration = function() {
    var count = 1;
    var elapsed = this.getAutoScrollDuration() / 2000;
    count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
    return count;
};

/**
* @function
* @instance
* @description
set the start time to right now when we initiate an auto scroll
*/
CellSelection.prototype.setAutoScrollStartTime = function() {
    this.sbAutoStart = Date.now();
};

/**
* @function
* @instance
* @description
update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
*/
CellSelection.prototype.pingAutoScroll = function() {
    var now = Date.now();
    if (now - this.sbLastAuto > 500) {
        this.setAutoScrollStartTime();
    }
    this.sbLastAuto = Date.now();
};

/**
* @function
* @instance
* @description
answer how long we have been auto scrolling
* #### returns: integer
*/
CellSelection.prototype.getAutoScrollDuration = function() {
    if (Date.now() - this.sbLastAuto > 500) {
        return 0;
    }
    return Date.now() - this.sbAutoStart;
};

/**
* @function
* @instance
* @description
Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
CellSelection.prototype.moveShiftSelect = function(grid, offsetX, offsetY) {

    var maxColumns = grid.getColumnCount() - 1;
    var maxRows = grid.getRowCount() - 1;

    var maxViewableColumns = grid.getVisibleColumns() - 1;
    var maxViewableRows = grid.getVisibleRows() - 1;

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxColumns = Math.min(maxColumns, maxViewableColumns);
        maxRows = Math.min(maxRows, maxViewableRows);
    }

    var origin = grid.getMouseDown();
    var extent = grid.getDragExtent();

    var newX = extent.x + offsetX;
    var newY = extent.y + offsetY;

    newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));
    newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

    grid.clearMostRecentSelection();
    grid.select(origin.x, origin.y, newX, newY);

    grid.setDragExtent(grid.newPoint(newX, newY));

    if (grid.insureModelColIsVisible(newX + origin.x, offsetX)) {
        this.pingAutoScroll();
    }
    if (grid.insureModelRowIsVisible(newY + origin.y, offsetY)) {
        this.pingAutoScroll();
    }

    grid.repaint();

};

/**
* @function
* @instance
* @description
Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
CellSelection.prototype.moveSingleSelect = function(grid, offsetX, offsetY) {

    var maxColumns = grid.getColumnCount() - 1;
    var maxRows = grid.getRowCount() - 1;

    var maxViewableColumns = grid.getVisibleColumnsCount() - 1;
    var maxViewableRows = grid.getVisibleRowsCount() - 1;

    var minRows = grid.getHeaderRowCount();
    var minCols = grid.getHeaderColumnCount();

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxColumns = Math.min(maxColumns, maxViewableColumns);
        maxRows = Math.min(maxRows, maxViewableRows);
    }

    var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());

    var newX = mouseCorner.x + offsetX;
    var newY = mouseCorner.y + offsetY;

    newX = Math.min(maxColumns, Math.max(minCols, newX));
    newY = Math.min(maxRows, Math.max(minRows, newY));

    grid.clearSelections();
    grid.select(newX, newY, 0, 0);
    grid.setMouseDown(grid.newPoint(newX, newY));
    grid.setDragExtent(grid.newPoint(0, 0));

    if (grid.insureModelColIsVisible(newX, offsetX)) {
        this.pingAutoScroll();
    }
    if (grid.insureModelRowIsVisible(newY, offsetY)) {
        this.pingAutoScroll();
    }

    grid.repaint();

};


module.exports = CellSelection;

},{"./Base.js":8}],12:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function ColumnAutosizing() {
    Base.call(this);
    this.alias = 'ColumnAutosizing';
};

ColumnAutosizing.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnAutosizing.prototype.handleDoubleClick = function(grid, event) {
    var headerRowCount = grid.getHeaderRowCount();
    //var headerColCount = grid.getHeaderColumnCount();
    var gridCell = event.gridCell;
    if (gridCell.y <= headerRowCount) {
        grid.autosizeColumn(gridCell.x);
    } else if (this.next) {
        this.next.handleDoubleClick(grid, event);
    }
}


module.exports = ColumnAutosizing;

},{"./Base.js":8}],13:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\column-moving
 * @description
 this feature is responsible for column drag and drop reordering
 this object is a mess and desperately needs a complete rewrite.....
 *
 */
var Base = require('./Base.js');

function ColumnMoving() {
    Base.call(this);
    this.alias = 'ColumnMoving';
};

ColumnMoving.prototype = Object.create(Base.prototype);

var noop = function() {};

var columnAnimationTime = 150;
var dragger;
var draggerCTX;
var floatColumn;
var floatColumnCTX;

/**
 * @property {Array} floaterAnimationQueue - queue up the animations that need to play so they are done synchronously
 * @instance
 */
ColumnMoving.prototype.floaterAnimationQueue = [];

/**
 * @property {boolean} columnDragAutoScrollingRight - am I currently auto scrolling right
 * @instance
 */
ColumnMoving.prototype.columnDragAutoScrollingRight = false;

/**
 * @property {boolean} columnDragAutoScrollingLeft  - am I currently auto scrolling left
 * @instance
 */
ColumnMoving.prototype.columnDragAutoScrollingLeft = false;

/**
 * @property {boolean} dragArmed - is the drag mechanism currently enabled(armed)
 * @instance
 */
ColumnMoving.prototype.dragArmed = false;

/**
 * @property {boolean} dragging - am I dragging right now
 * @instance
 */
ColumnMoving.prototype.dragging = false;

/**
 * @property {integer} dragCol - return the column index of the currently dragged column
 * @instance
 */
ColumnMoving.prototype.dragCol = -1;

/**
 * @property {integer} dragOffset - an offset to position the dragged item from the cursor
 * @instance
 */
ColumnMoving.prototype.dragOffset = 0;

/**
* @function
* @instance
* @description
give me an opportunity to initialize stuff on the grid
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnMoving.prototype.initializeOn = function(grid) {
    this.isFloatingNow = false;
    this.initializeAnimationSupport(grid);
    if (this.next) {
        this.next.initializeOn(grid);
    }
};

/**
* @function
* @instance
* @description
initialize animation support on the grid
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnMoving.prototype.initializeAnimationSupport = function(grid) {
    noop(grid);
    if (!dragger) {
        dragger = document.createElement('canvas');
        dragger.setAttribute('width', '0px');
        dragger.setAttribute('height', '0px');

        document.body.appendChild(dragger);
        draggerCTX = dragger.getContext('2d');
    }
    if (!floatColumn) {
        floatColumn = document.createElement('canvas');
        floatColumn.setAttribute('width', '0px');
        floatColumn.setAttribute('height', '0px');

        document.body.appendChild(floatColumn);
        floatColumnCTX = floatColumn.getContext('2d');
    }

};

ColumnMoving.prototype.getCanDragCursorName = function() {
    return '-webkit-grab';
};

ColumnMoving.prototype.getDraggingCursorName = function() {
    return '-webkit-grabbing';
};
/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnMoving.prototype.handleMouseDrag = function(grid, event) {

    var gridCell = event.gridCell;
    var x, y;

    var distance = Math.abs(event.primitiveEvent.detail.dragstart.x - event.primitiveEvent.detail.mouse.x);

    if (distance < 10) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
        return;
    }

    if (this.isHeaderRow(grid, event) && this.dragArmed && !this.dragging) {
        this.dragging = true;
        this.dragCol = gridCell.x;
        this.dragOffset = event.mousePoint.x;
        this.detachChain();
        x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
        y = event.primitiveEvent.detail.mouse.y;
        this.createDragColumn(grid, x, this.dragCol);
    } else if (this.next) {
        this.next.handleMouseDrag(grid, event);
    }
    if (this.dragging) {
        x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
        y = event.primitiveEvent.detail.mouse.y;
        this.dragColumn(grid, x);
    }
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnMoving.prototype.handleMouseDown = function(grid, event) {
    if (grid.getBehavior().isColumnReorderable()) {
        if (this.isHeaderRow(grid, event) && event.gridCell.x !== -1) {
            this.dragArmed = true;
            this.cursor = this.getDraggingCursorName();
            grid.clearSelections();
        }
    }
    if (this.next) {
        this.next.handleMouseDown(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnMoving.prototype.handleMouseUp = function(grid, event) {
    //var col = event.gridCell.x;
    if (this.dragging) {
        this.cursor = null;
        //delay here to give other events a chance to be dropped
        var self = this;
        this.endDragColumn(grid);
        setTimeout(function() {
            self.attachChain();
        }, 200);
    }
    this.dragCol = -1;
    this.dragging = false;
    this.dragArmed = false;
    this.cursor = null;
    grid.repaint();

    if (this.next) {
        this.next.handleMouseUp(grid, event);
    }

};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnMoving.prototype.handleMouseMove = function(grid, event) {

    if (!this.dragging && event.mousePoint.y < 5 && event.viewPoint.y === 0) {
        this.cursor = this.getCanDragCursorName();
    } else {
        this.cursor = null;
    }

    if (this.next) {
        this.next.handleMouseMove(grid, event);
    }

    if (this.isHeaderRow(grid, event) && this.dragging) {
        this.cursor = this.getDraggingCursorName(); //move';
    }
};

/**
* @function
* @instance
* @description
this is the main event handler that manages the dragging of the column
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {boolean} draggedToTheRight - are we moving to the right
*/
ColumnMoving.prototype.floatColumnTo = function(grid, draggedToTheRight) {
    this.floatingNow = true;

    var renderer = grid.getRenderer();
    var colEdges = renderer.getColumnEdges();
    //var behavior = grid.getBehavior();
    var scrollLeft = grid.getHScrollValue();
    var floaterIndex = grid.renderOverridesCache.floater.columnIndex;
    var draggerIndex = grid.renderOverridesCache.dragger.columnIndex;
    var hdpiratio = grid.renderOverridesCache.dragger.hdpiratio;

    var draggerStartX;
    var floaterStartX;
    var fixedColumnCount = grid.getFixedColumnCount();
    var draggerWidth = grid.getColumnWidth(draggerIndex);
    var floaterWidth = grid.getColumnWidth(floaterIndex);

    var max = grid.getVisibleColumnsCount();

    var doffset = 0;
    var foffset = 0;

    if (draggerIndex >= fixedColumnCount) {
        doffset = scrollLeft;
    }
    if (floaterIndex >= fixedColumnCount) {
        foffset = scrollLeft;
    }

    if (draggedToTheRight) {
        draggerStartX = colEdges[Math.min(max, draggerIndex - doffset)];
        floaterStartX = colEdges[Math.min(max, floaterIndex - foffset)];

        grid.renderOverridesCache.dragger.startX = (draggerStartX + floaterWidth) * hdpiratio;
        grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;

    } else {
        floaterStartX = colEdges[Math.min(max, floaterIndex - foffset)];
        draggerStartX = floaterStartX + draggerWidth;

        grid.renderOverridesCache.dragger.startX = floaterStartX * hdpiratio;
        grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;
    }
    grid.swapColumns(draggerIndex, floaterIndex);
    grid.renderOverridesCache.dragger.columnIndex = floaterIndex;
    grid.renderOverridesCache.floater.columnIndex = draggerIndex;


    this.floaterAnimationQueue.unshift(this.doColumnMoveAnimation(grid, floaterStartX, draggerStartX));

    this.doFloaterAnimation(grid);

};

/**
* @function
* @instance
* @description
manifest the column drag and drop animation
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} floaterStartX - the x start coordinate of the column underneath that floats behind the dragged column
* @param {integer} draggerStartX - the x start coordinate of the dragged column
*/
ColumnMoving.prototype.doColumnMoveAnimation = function(grid, floaterStartX, draggerStartX) {
    var self = this;
    return function() {
        var d = floatColumn;
        d.style.display = 'inline';
        self.setCrossBrowserProperty(d, 'transform', 'translate(' + floaterStartX + 'px, ' + 0 + 'px)');

        //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';
        //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';

        window.requestAnimationFrame(function() {
            self.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + columnAnimationTime + 'ms ease');
            self.setCrossBrowserProperty(d, 'transform', 'translate(' + draggerStartX + 'px, ' + -2 + 'px)');
        });
        grid.repaint();
        //need to change this to key frames

        setTimeout(function() {
            self.setCrossBrowserProperty(d, 'transition', '');
            grid.renderOverridesCache.floater = null;
            grid.repaint();
            self.doFloaterAnimation(grid);
            requestAnimationFrame(function() {
                d.style.display = 'none';
                self.isFloatingNow = false;
            });
        }, columnAnimationTime + 50);
    };
};

/**
* @function
* @instance
* @description
manifest the floater animation
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnMoving.prototype.doFloaterAnimation = function(grid) {
    if (this.floaterAnimationQueue.length === 0) {
        this.floatingNow = false;
        grid.repaint();
        return;
    }
    var animation = this.floaterAnimationQueue.pop();
    animation();
};

/**
* @function
* @instance
* @description
create the float column at columnIndex underneath the dragged column
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} columnIndex - the index of the column that will be floating
*/
ColumnMoving.prototype.createFloatColumn = function(grid, columnIndex) {

    var fixedColumnCount = grid.getFixedColumnCount();
    var scrollLeft = grid.getHScrollValue();

    if (columnIndex < fixedColumnCount) {
        scrollLeft = 0;
    }

    var renderer = grid.getRenderer();
    var columnEdges = renderer.getColumnEdges();

    var columnWidth = grid.getColumnWidth(columnIndex);
    var colHeight = grid.clientHeight;
    var d = floatColumn;
    var style = d.style;
    var location = grid.getBoundingClientRect();

    style.top = (location.top - 2) + 'px';
    style.left = location.left + 'px';
    style.position = 'fixed';

    var hdpiRatio = grid.getHiDPI(floatColumnCTX);

    d.setAttribute('width', Math.round(columnWidth * hdpiRatio) + 'px');
    d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');
    style.boxShadow = '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';
    style.width = columnWidth + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
    style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';
    style.borderTop = '1px solid ' + renderer.resolveProperty('lineColor');
    style.backgroundColor = renderer.resolveProperty('backgroundColor');

    var startX = columnEdges[columnIndex - scrollLeft];
    startX = startX * hdpiRatio;

    floatColumnCTX.scale(hdpiRatio, hdpiRatio);

    grid.renderOverridesCache.floater = {
        columnIndex: columnIndex,
        ctx: floatColumnCTX,
        startX: startX,
        width: columnWidth,
        height: colHeight,
        hdpiratio: hdpiRatio
    };

    style.zIndex = '4';
    this.setCrossBrowserProperty(d, 'transform', 'translate(' + startX + 'px, ' + -2 + 'px)');
    style.cursor = this.getDraggingCursorName();
    grid.repaint();
};

/**
* @function
* @instance
* @description
utility function for setting cross browser css properties
* @param {HTMLElement} element - descripton
* @param {string} property - the property
* @param {string} value - the value to assign
*/
ColumnMoving.prototype.setCrossBrowserProperty = function(element, property, value) {
    var uProperty = property[0].toUpperCase() + property.substr(1);
    this.setProp(element, 'webkit' + uProperty, value);
    this.setProp(element, 'Moz' + uProperty, value);
    this.setProp(element, 'ms' + uProperty, value);
    this.setProp(element, 'O' + uProperty, value);
    this.setProp(element, property, value);
};

/**
* @function
* @instance
* @description
utility function for setting properties on HTMLElements
* @param {HTMLElement} element - descripton
* @param {string} property - the property
* @param {string} value - the value to assign
*/
ColumnMoving.prototype.setProp = function(element, property, value) {
    if (property in element.style) {
        element.style[property] = value;
    }
};

/**
* @function
* @instance
* @description
create the dragged column at columnIndex above the floated column
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} x - the start position
* @param {integer} columnIndex - the index of the column that will be floating
*/
ColumnMoving.prototype.createDragColumn = function(grid, x, columnIndex) {

    var fixedColumnCount = grid.getFixedColumnCount();
    var scrollLeft = grid.getHScrollValue();

    if (columnIndex < fixedColumnCount) {
        scrollLeft = 0;
    }

    var renderer = grid.getRenderer();
    var columnEdges = renderer.getColumnEdges();
    var hdpiRatio = grid.getHiDPI(draggerCTX);
    var columnWidth = grid.getColumnWidth(columnIndex);
    var colHeight = grid.clientHeight;
    var d = dragger;




    var location = grid.getBoundingClientRect();
    var style = d.style;

    style.top = location.top + 'px';
    style.left = location.left + 'px';
    style.position = 'fixed';
    style.opacity = 0.85;
    style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
    //style.zIndex = 100;
    style.borderTop = '1px solid ' + renderer.resolveProperty('lineColor');
    style.backgroundColor = grid.renderer.resolveProperty('backgroundColor');

    d.setAttribute('width', Math.round(columnWidth * hdpiRatio) + 'px');
    d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');

    style.width = columnWidth + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
    style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';

    var startX = columnEdges[columnIndex - scrollLeft];
    startX = startX * hdpiRatio;

    draggerCTX.scale(hdpiRatio, hdpiRatio);

    grid.renderOverridesCache.dragger = {
        columnIndex: columnIndex,
        ctx: draggerCTX,
        startX: startX,
        width: columnWidth,
        height: colHeight,
        hdpiratio: hdpiRatio
    };

    this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, -5px)');
    style.zIndex = '5';
    style.cursor = this.getDraggingCursorName();
    grid.repaint();
};

/**
* @function
* @instance
* @description
this function is the main dragging logic
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} x - the start position
*/
ColumnMoving.prototype.dragColumn = function(grid, x) {

    //TODO: this function is overly complex, refactor this in to something more reasonable
    var self = this;
    //var renderer = grid.getRenderer();
    //var columnEdges = renderer.getColumnEdges();

    var autoScrollingNow = this.columnDragAutoScrollingRight || this.columnDragAutoScrollingLeft;

    var hdpiRatio = grid.getHiDPI(draggerCTX);

    var dragColumnIndex = grid.renderOverridesCache.dragger.columnIndex;
    var columnWidth = grid.renderOverridesCache.dragger.width;

    var minX = 0; //grid.getFixedColumnsWidth();
    var maxX = grid.renderer.getFinalVisableColumnBoundry() - columnWidth;
    x = Math.min(x, maxX + 15);
    x = Math.max(minX - 15, x);

    //am I at my lower bound
    var atMin = x < minX && dragColumnIndex !== 0;

    //am I at my upper bound
    var atMax = x > maxX;

    var d = dragger;

    this.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + 0 + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');

    this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, ' + -10 + 'px)');
    requestAnimationFrame(function() {
        d.style.display = 'inline';
    });

    var overCol = grid.renderer.getColumnFromPixelX(x + (d.width / 2 / hdpiRatio));

    if (atMin) {
        overCol = 0;
    }

    if (atMax) {
        overCol = grid.getColumnCount() - 1;
    }

    var doAFloat = dragColumnIndex > overCol;
    doAFloat = doAFloat || (overCol - dragColumnIndex >= 1);

    if (doAFloat && !atMax && !autoScrollingNow) {
        var draggedToTheRight = dragColumnIndex < overCol;
        // if (draggedToTheRight) {
        //     overCol = overCol - 1;
        // }
        if (this.isFloatingNow) {
            return;
        }

        this.isFloatingNow = true;
        this.createFloatColumn(grid, overCol);
        this.floatColumnTo(grid, draggedToTheRight);
    } else {

        if (x < minX - 10) {
            this.checkAutoScrollToLeft(grid, x);
        }
        if (x > minX - 10) {
            this.columnDragAutoScrollingLeft = false;
        }
        //lets check for autoscroll to right if were up against it
        if (atMax || x > maxX + 10) {
            this.checkAutoScrollToRight(grid, x);
            return;
        }
        if (x < maxX + 10) {
            this.columnDragAutoScrollingRight = false;
        }
    }
};

/**
* @function
* @instance
* @description
autoscroll to the right if necessary
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} x - the start position
*/
ColumnMoving.prototype.checkAutoScrollToRight = function(grid, x) {
    if (this.columnDragAutoScrollingRight) {
        return;
    }
    this.columnDragAutoScrollingRight = true;
    this._checkAutoScrollToRight(grid, x);
};

ColumnMoving.prototype._checkAutoScrollToRight = function(grid, x) {
    if (!this.columnDragAutoScrollingRight) {
        return;
    }
    var scrollLeft = grid.getHScrollValue();
    if (!grid.dragging || scrollLeft > (grid.sbHScrollConfig.rangeStop - 2)) {
        return;
    }
    var draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
    grid.scrollBy(1, 0);
    var newIndex = draggedIndex + 1;
    console.log(newIndex, draggedIndex);
    grid.swapColumns(newIndex, draggedIndex);
    grid.renderOverridesCache.dragger.columnIndex = newIndex;

    setTimeout(this._checkAutoScrollToRight.bind(this, grid, x), 250);
};

/**
* @function
* @instance
* @description
autoscroll to the left if necessary
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} x - the start position
*/
ColumnMoving.prototype.checkAutoScrollToLeft = function(grid, x) {
    if (this.columnDragAutoScrollingLeft) {
        return;
    }
    this.columnDragAutoScrollingLeft = true;
    this._checkAutoScrollToLeft(grid, x);
};

ColumnMoving.prototype._checkAutoScrollToLeft = function(grid, x) {
    if (!this.columnDragAutoScrollingLeft) {
        return;
    }

    var scrollLeft = grid.getHScrollValue();
    if (!grid.dragging || scrollLeft < 1) {
        return;
    }
    var draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
    grid.swapColumns(draggedIndex + scrollLeft, draggedIndex + scrollLeft - 1);
    grid.scrollBy(-1, 0);
    setTimeout(this._checkAutoScrollToLeft.bind(this, grid, x), 250);
};



/**
* @function
* @instance
* @description
a column drag has completed, update data and cleanup
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnMoving.prototype.endDragColumn = function(grid) {

    var fixedColumnCount = grid.getFixedColumnCount();
    var scrollLeft = grid.getHScrollValue();

    var columnIndex = grid.renderOverridesCache.dragger.columnIndex;

    if (columnIndex < fixedColumnCount) {
        scrollLeft = 0;
    }

    var renderer = grid.getRenderer();
    var columnEdges = renderer.getColumnEdges();
    var self = this;
    var startX = columnEdges[columnIndex - scrollLeft];
    var d = dragger;

    self.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + columnAnimationTime + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');
    self.setCrossBrowserProperty(d, 'transform', 'translate(' + startX + 'px, ' + -1 + 'px)');
    d.style.boxShadow = '0px 0px 0px #888888';

    setTimeout(function() {
        grid.renderOverridesCache.dragger = null;
        grid.repaint();
        requestAnimationFrame(function() {
            d.style.display = 'none';
            grid.endDragColumnNotification();
        });
    }, columnAnimationTime + 50);

};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnMoving.prototype.isHeaderRow = function(grid, event) {
    var gridCell = event.viewPoint;
    var isFixed = gridCell.y === 0;
    return isFixed;
};

module.exports = ColumnMoving;

},{"./Base.js":8}],14:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function ColumnResizing() {
    Base.call(this);
    this.alias = 'ColumnResizing';
};

ColumnResizing.prototype = Object.create(Base.prototype);

/**
 * @property {integer} dragIndex - the index of the column wall were currently dragging
 * @instance
 */
ColumnResizing.prototype.dragIndex = -2;

/**
 * @property {integer} dragStart - the pixel location of the where the drag was initiated
 * @instance
 */
ColumnResizing.prototype.dragStart = -1;

/**
 * @property {integer} dragIndexStartingSize - the starting width/height of the row/column we are dragging
 * @instance
 */
ColumnResizing.prototype.dragIndexStartingSize = -1;

/**
* @function
* @instance
* @description
get the mouse x,y coordinate
* #### returns: integer
* @param {MouseEvent} event - the mouse event to query
*/
ColumnResizing.prototype.getMouseValue = function(event) {
    return event.primitiveEvent.detail.mouse.x;
};

/**
* @function
* @instance
* @description
get the grid cell x,y coordinate
* #### returns: integer
* @param {rectangle.point} gridCell - [rectangle.point](https://github.com/stevewirts/fin-rectangle)
*/
ColumnResizing.prototype.getGridCellValue = function(gridCell) {
    return gridCell.y;
};

/**
* @function
* @instance
* @description
return the grids x,y scroll value
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnResizing.prototype.getScrollValue = function(grid) {
    return grid.getHScrollValue();
};

/**
* @function
* @instance
* @description
return the width/height of the row/column of interest
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
*/
ColumnResizing.prototype.getAreaSize = function(grid, index) {
    return grid.getColumnWidth(index);
};

/**
* @function
* @instance
* @description
set the width/height of the row/column at index
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
* @param {integer} value - the width/height to set to
*/
ColumnResizing.prototype.setAreaSize = function(grid, index, value) {
    grid.setColumnWidth(index, value);
};

/**
* @function
* @instance
* @description
return the recently rendered area's width/height
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
*/
ColumnResizing.prototype.getPreviousAbsoluteSize = function(grid, index) {
    return grid.getRenderedWidth(index);
};

/**
* @function
* @instance
* @description
returns the index of which divider I'm over
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnResizing.prototype.overAreaDivider = function(grid, event) {
    return grid.overColumnDivider(event);
};

/**
* @function
* @instance
* @description
am I over the column/row area
* #### returns: boolean
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnResizing.prototype.isFirstFixedOtherArea = function(grid, event) {
    return this.isFirstFixedRow(grid, event);
};

/**
* @function
* @instance
* @description
return the cursor name
* #### returns: string
*/
ColumnResizing.prototype.getCursorName = function() {
    return 'col-resize';
};

/**
* @function
* @instance
* @description
handle this event
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnResizing.prototype.handleMouseDrag = function(grid, event) {
    if (this.dragIndex > -2) {
        //var fixedAreaCount = this.getFixedAreaCount(grid);
        //var offset = this.getFixedAreaSize(grid, fixedAreaCount + areaIndex);
        var mouse = this.getMouseValue(event);
        var scrollValue = this.getScrollValue(grid);
        if (this.dragIndex < this.getFixedAreaCount(grid)) {
            scrollValue = 0;
        }
        var previous = this.getPreviousAbsoluteSize(grid, this.dragIndex - scrollValue);
        var distance = mouse - previous;
        this.setAreaSize(grid, this.dragIndex, distance);
    } else if (this.next) {
        this.next.handleMouseDrag(grid, event);
    }
};

/**
* @function
* @instance
* @description
get the width/height of a specific row/column
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} areaIndex - the row/column index of interest
*/
ColumnResizing.prototype.getSize = function(grid, areaIndex) {
    return this.getAreaSize(grid, areaIndex);
};

/**
* @function
* @instance
* @description
return the fixed area rows/columns count
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnResizing.prototype.getOtherFixedAreaCount = function(grid) {
    return grid.getFixedRowCount();
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnResizing.prototype.handleMouseDown = function(grid, event) {
    var isEnabled = this.isEnabled(grid);
    var overArea = this.overAreaDivider(grid, event);
    if (isEnabled && overArea > -1 && this.isFirstFixedOtherArea(grid, event)) {
        var scrollValue = this.getScrollValue(grid);
        if (overArea < this.getFixedAreaCount(grid)) {
            scrollValue = 0;
        }
        this.dragIndex = overArea - 1 + scrollValue;
        this.dragStart = this.getMouseValue(event);
        this.dragIndexStartingSize = 0;
        this.detachChain();
    } else if (this.next) {
        this.next.handleMouseDown(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnResizing.prototype.handleMouseUp = function(grid, event) {
    var isEnabled = this.isEnabled(grid);
    if (isEnabled && this.dragIndex > -2) {
        this.cursor = null;
        this.dragIndex = -2;

        event.primitiveEvent.stopPropagation();
        //delay here to give other events a chance to be dropped
        var self = this;
        grid.synchronizeScrollingBoundries();
        setTimeout(function() {
            self.attachChain();
        }, 200);
    } else if (this.next) {
        this.next.handleMouseUp(grid, event);
    }
};

/**
* @function
* @instance
* @description
handle this event down the feature chain of responsibility
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnResizing.prototype.handleMouseMove = function(grid, event) {
    if (this.dragIndex > -2) {
        return;
    }
    this.cursor = null;
    if (this.next) {
        this.next.handleMouseMove(grid, event);
    }
    this.checkForAreaResizeCursorChange(grid, event);
};

/**
* @function
* @instance
* @description
fill this in
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnResizing.prototype.checkForAreaResizeCursorChange = function(grid, event) {
    var isEnabled = this.isEnabled(grid);
    if (isEnabled && this.overAreaDivider(grid, event) > -1 && this.isFirstFixedOtherArea(grid, event)) {
        this.cursor = this.getCursorName();
    } else {
        this.cursor = null;
    }

};

ColumnResizing.prototype.getFixedAreaCount = function(grid) {
    var count = grid.getFixedColumnCount() + (grid.isShowRowNumbers() ? 1 : 0) + (grid.hasHierarchyColumn() ? 1 : 0);
    return count;
};

ColumnResizing.prototype.handleDoubleClick = function(grid, event) {
    var isEnabled = this.isEnabled(grid);
    var hasCursor = this.overAreaDivider(grid, event) > -1; //this.cursor !== null;
    var headerRowCount = grid.getHeaderRowCount();
    //var headerColCount = grid.getHeaderColumnCount();
    var gridCell = event.gridCell;
    if (isEnabled && hasCursor && (gridCell.y <= headerRowCount)) {
        grid.autosizeColumn(gridCell.x - 1);
    } else if (this.next) {
        this.next.handleDoubleClick(grid, event);
    }
};
ColumnResizing.prototype.isEnabled = function( /* grid */ ) {
    return true;
};


module.exports = ColumnResizing;

},{"./Base.js":8}],15:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function ColumnSelection() {
    Base.call(this);
    this.alias = 'ColumnSelection';
};

ColumnSelection.prototype = Object.create(Base.prototype);

/**
 * @property {fin-rectangle.point} currentDrag - currentDrag is the pixel location of the mouse pointer during a drag operation
 * @instance
 */
ColumnSelection.prototype.currentDrag = null,

/**
 * @property {Object} lastDragCell - lastDragCell is the cell coordinates of the where the mouse pointer is during a drag operation
 * @instance
 */
ColumnSelection.prototype.lastDragCell = null,

/**
 * @property {Number} sbLastAuto - sbLastAuto is a millisecond value representing the previous time an autoscroll started
 * @instance
 */
ColumnSelection.prototype.sbLastAuto = 0,

/**
 * @property {Number} sbAutoStart - sbAutoStart is a millisecond value representing the time the current autoscroll started
 * @instance
 */
ColumnSelection.prototype.sbAutoStart = 0,

/**
 * @property {fin-rectangle.point} rectangles - the util rectangles factory [fin-rectangles](https://github.com/stevewirts/fin-rectangle)
 * @instance
 */
ColumnSelection.prototype.rectangles = {};

/**
 * @function
 * @instance
 * @description
 the function to override for initialization
 */
ColumnSelection.prototype.createdInit = function() {

    this.rectangles = document.createElement('fin-rectangle');

};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleMouseUp = function(grid, event) {
    if (this.dragging) {
        this.dragging = false;
    }
    if (this.next) {
        this.next.handleMouseUp(grid, event);
        return;
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleMouseDown = function(grid, event) {

    if ((!grid.isColumnSelection() || event.mousePoint.y < 5) && this.next) {
        this.next.handleMouseDown(grid, event);
        return;
    }

    var isRightClick = event.primitiveEvent.detail.isRightClick;
    var cell = event.gridCell;
    var viewCell = event.viewPoint;
    var dx = cell.x;
    var dy = cell.y;

    var isHeader = grid.isShowHeaderRow() && dy === 0 && dx !== -1;

    if (isRightClick || !isHeader) {
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    } else {

        var numFixedColumns = grid.getFixedColumnCount();

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.x < numFixedColumns) {
            dx = viewCell.x;
        }

        var dCell = grid.rectangles.point.create(dx, 0);

        var primEvent = event.primitiveEvent;
        var keys = primEvent.detail.keys;
        this.dragging = true;
        this.extendSelection(grid, dCell, keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleMouseDrag = function(grid, event) {

    if ((!grid.isColumnSelection() || this.isColumnDragging(grid)) && this.next) {
        this.next.handleMouseDrag(grid, event);
        return;
    }

    var isRightClick = event.primitiveEvent.detail.isRightClick;

    if (isRightClick || !this.dragging) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    } else {

        var numFixedColumns = grid.getFixedColumnCount();

        var cell = event.gridCell;
        var viewCell = event.viewPoint;
        var dx = cell.x;
        var dy = cell.y;

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.x < numFixedColumns) {
            dx = viewCell.x;
        }

        var dCell = grid.rectangles.point.create(dx, dy);

        var primEvent = event.primitiveEvent;
        this.currentDrag = primEvent.detail.mouse;
        this.lastDragCell = dCell;

        this.checkDragScroll(grid, this.currentDrag);
        this.handleMouseDragCellSelection(grid, dCell, primEvent.detail.keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleKeyDown = function(grid, event) {
    if (grid.getLastSelectionType() !== 'column') {
        if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
        return;
    }
    var command = 'handle' + event.detail.char;
    if (this[command]) {
        this[command].call(this, grid, event.detail);
    }
};

/**
* @function
* @instance
* @description
Handle a mousedrag selection
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
ColumnSelection.prototype.handleMouseDragCellSelection = function(grid, gridCell /* ,keys */ ) {

    //var behavior = grid.getBehavior();
    var x = gridCell.x;
    //            var previousDragExtent = grid.getDragExtent();
    var mouseDown = grid.getMouseDown();

    var newX = x - mouseDown.x;
    //var newY = y - mouseDown.y;

    // if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
    //     return;
    // }

    grid.clearMostRecentColumnSelection();

    grid.selectColumn(mouseDown.x, x);
    grid.setDragExtent(this.rectangles.point.create(newX, 0));

    grid.repaint();
};

/**
* @function
* @instance
* @description
this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
*/
ColumnSelection.prototype.checkDragScroll = function(grid, mouse) {
    if (!grid.resolveProperty('scrollingEnabled')) {
        return;
    }
    var b = grid.getDataBounds();
    var inside = b.contains(mouse);
    if (inside) {
        if (grid.isScrollingNow()) {
            grid.setScrollingNow(false);
        }
    } else if (!grid.isScrollingNow()) {
        grid.setScrollingNow(true);
        this.scrollDrag(grid);
    }
};

/**
* @function
* @instance
* @description
this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnSelection.prototype.scrollDrag = function(grid) {

    if (!grid.isScrollingNow()) {
        return;
    }

    var lastDragCell = this.lastDragCell;
    var b = grid.getDataBounds();
    var xOffset = 0;
    var yOffset = 0;

    var numFixedColumns = grid.getFixedColumnCount();
    var numFixedRows = grid.getFixedRowCount();

    var dragEndInFixedAreaX = lastDragCell.x < numFixedColumns;
    var dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

    if (this.currentDrag.x < b.origin.x) {
        xOffset = -1;
    }

    if (this.currentDrag.x > b.origin.x + b.extent.x) {
        xOffset = 1;
    }

    var dragCellOffsetX = xOffset;
    var dragCellOffsetY = yOffset;

    if (dragEndInFixedAreaX) {
        dragCellOffsetX = 0;
    }

    if (dragEndInFixedAreaY) {
        dragCellOffsetY = 0;
    }

    this.lastDragCell = lastDragCell.plusXY(dragCellOffsetX, dragCellOffsetY);
    grid.scrollBy(xOffset, yOffset);
    this.handleMouseDragCellSelection(grid, lastDragCell, []); // update the selection
    grid.repaint();
    setTimeout(this.scrollDrag.bind(this, grid), 25);
};

/**
* @function
* @instance
* @description
extend a selection or create one if there isnt yet
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} gridCell - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
ColumnSelection.prototype.extendSelection = function(grid, gridCell, keys) {
    grid.stopEditing();
    //var hasCTRL = keys.indexOf('CTRL') !== -1;
    var hasSHIFT = keys.indexOf('SHIFT') !== -1;

    // var scrollTop = grid.getVScrollValue();
    // var scrollLeft = grid.getHScrollValue();

    // var numFixedColumns = 0;//grid.getFixedColumnCount();
    // var numFixedRows = 0;//grid.getFixedRowCount();

    var mousePoint = grid.getMouseDown();
    var x = gridCell.x; // - numFixedColumns + scrollLeft;
    var y = gridCell.y; // - numFixedRows + scrollTop;

    //were outside of the grid do nothing
    if (x < 0 || y < 0) {
        return;
    }

    //we have repeated a click in the same spot deslect the value from last time
    // if (mousePoint && x === mousePoint.x && y === mousePoint.y) {
    //     grid.clearSelections();
    //     grid.popMouseDown();
    //     grid.repaint();
    //     return;
    // }

    // if (!hasCTRL && !hasSHIFT) {
    //     grid.clearSelections();
    // }

    if (hasSHIFT) {
        grid.clearMostRecentColumnSelection();
        grid.selectColumn(x, mousePoint.x);
        grid.setDragExtent(this.rectangles.point.create(x - mousePoint.x, 0));
    } else {
        grid.toggleSelectColumn(x, keys);
        grid.setMouseDown(this.rectangles.point.create(x, y));
        grid.setDragExtent(this.rectangles.point.create(0, 0));
    }
    grid.repaint();
};


/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnSelection.prototype.handleDOWNSHIFT = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleUPSHIFT = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleLEFTSHIFT = function(grid) {
    this.moveShiftSelect(grid, -1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleRIGHTSHIFT = function(grid) {
    this.moveShiftSelect(grid, 1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleDOWN = function( /* grid */ ) {

    // var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());
    // var maxRows = grid.getRowCount() - 1;

    // var newX = mouseCorner.x;
    // var newY = grid.getHeaderRowCount() + grid.getVScrollValue();

    // newY = Math.min(maxRows, newY);

    // grid.clearSelections();
    // grid.select(newX, newY, 0, 0);
    // grid.setMouseDown(this.rectangles.point.create(newX, newY));
    // grid.setDragExtent(this.rectangles.point.create(0, 0));

    // grid.repaint();
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleUP = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleLEFT = function(grid) {
    this.moveSingleSelect(grid, -1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleRIGHT = function(grid) {
    this.moveSingleSelect(grid, 1);
};

/**
* @function
* @instance
* @description
If we are holding down the same navigation key, accelerate the increment we scroll
* #### returns: integer
*/
ColumnSelection.prototype.getAutoScrollAcceleration = function() {
    var count = 1;
    var elapsed = this.getAutoScrollDuration() / 2000;
    count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
    return count;
};

/**
* @function
* @instance
* @description
set the start time to right now when we initiate an auto scroll
*/
ColumnSelection.prototype.setAutoScrollStartTime = function() {
    this.sbAutoStart = Date.now();
};

/**
* @function
* @instance
* @description
update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
*/
ColumnSelection.prototype.pingAutoScroll = function() {
    var now = Date.now();
    if (now - this.sbLastAuto > 500) {
        this.setAutoScrollStartTime();
    }
    this.sbLastAuto = Date.now();
};

/**
* @function
* @instance
* @description
answer how long we have been auto scrolling
* #### returns: integer
*/
ColumnSelection.prototype.getAutoScrollDuration = function() {
    if (Date.now() - this.sbLastAuto > 500) {
        return 0;
    }
    return Date.now() - this.sbAutoStart;
};

/**
* @function
* @instance
* @description
Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
ColumnSelection.prototype.moveShiftSelect = function(grid, offsetX) {

    var maxColumns = grid.getColumnCount() - 1;

    var maxViewableColumns = grid.getVisibleColumns() - 1;

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxColumns = Math.min(maxColumns, maxViewableColumns);
    }

    var origin = grid.getMouseDown();
    var extent = grid.getDragExtent();

    var newX = extent.x + offsetX;
    //var newY = grid.getRowCount();

    newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));

    grid.clearMostRecentColumnSelection();
    grid.selectColumn(origin.x, origin.x + newX);

    grid.setDragExtent(this.rectangles.point.create(newX, 0));

    if (grid.insureModelColIsVisible(newX + origin.x, offsetX)) {
        this.pingAutoScroll();
    }

    grid.repaint();

};

/**
* @function
* @instance
* @description
Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
ColumnSelection.prototype.moveSingleSelect = function(grid, offsetX) {

    var maxColumns = grid.getColumnCount() - 1;

    var maxViewableColumns = grid.getVisibleColumnsCount() - 1;

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxColumns = Math.min(maxColumns, maxViewableColumns);
    }

    var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());

    var newX = mouseCorner.x + offsetX;
    //var newY = grid.getRowCount();

    newX = Math.min(maxColumns, Math.max(0, newX));

    grid.clearSelections();
    grid.selectColumn(newX);
    grid.setMouseDown(this.rectangles.point.create(newX, 0));
    grid.setDragExtent(this.rectangles.point.create(0, 0));

    if (grid.insureModelColIsVisible(newX, offsetX)) {
        this.pingAutoScroll();
    }

    grid.repaint();

};

ColumnSelection.prototype.isColumnDragging = function(grid) {
    var dragger = grid.lookupFeature('ColumnMoving');
    if (!dragger) {
        return false;
    }
    var isActivated = dragger.dragging && !this.dragging;
    return isActivated;
};

module.exports = ColumnSelection;

},{"./Base.js":8}],16:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function ColumnSorting() {
    Base.call(this);
    this.alias = 'ColumnSorting';
};

ColumnSorting.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/

ColumnSorting.prototype.handleDoubleClick = function(grid, event) {
    var gridCell = event.gridCell;
    if (grid.isShowHeaderRow() && gridCell.y === 0 && gridCell.x !== -1) {
        var keys = event.primitiveEvent.detail.keys;
        grid.toggleSort(gridCell.x, keys);
    } else if (this.next) {
        this.next.handleDoubleClick(grid, event);
    }
};

/**
* @function
* @instance
* @description
handle this event down the feature chain of responsibility
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnSorting.prototype.handleMouseMove = function(grid, event) {
    var y = event.gridCell.y;
    if (this.isFixedRow(grid, event) && y < 1) {
        this.cursor = 'pointer';
    } else {
        this.cursor = null;
    }
    if (this.next) {
        this.next.handleMouseMove(grid, event);
    }
};


module.exports = ColumnSorting;

},{"./Base.js":8}],17:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function Filters() {
    Base.call(this);
    this.alias = 'Filters';
};

Filters.prototype = Object.create(Base.prototype);

Filters.prototype.handleTap = function(grid, event) {
    var gridCell = event.gridCell;
    if (grid.isFilterRow(gridCell.y) && gridCell.x !== -1) {
        grid.filterClicked(event);
    } else if (this.next) {
        this.next.handleTap(grid, event);
    }
};

module.exports = Filters;

},{"./Base.js":8}],18:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\key-paging
 *
 */
var Base = require('./Base.js');

var commands = {
    PAGEDOWN: function(grid) {
        grid.pageDown();
    },
    PAGEUP: function(grid) {
        grid.pageUp();
    },
    PAGELEFT: function(grid) {
        grid.pageLeft();
    },
    PAGERIGHT: function(grid) {
        grid.pageRight();
    }
};

/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function KeyPaging() {
    Base.call(this);
    this.alias = 'KeyPaging';
};

KeyPaging.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
KeyPaging.prototype.handleKeyDown = function(grid, event) {
    var detail = event.detail.char;
    var func = commands[detail];
    if (func) {
        func(grid);
    } else if (this.next) {
        this.next.handleKeyDown(grid, event);
    }
}

module.exports = KeyPaging;

},{"./Base.js":8}],19:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function OnHover() {
    Base.call(this);
    this.alias = 'OnHover';
};

OnHover.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
OnHover.prototype.handleMouseMove = function(grid, event) {
    var currentHoverCell = grid.getHoverCell();
    if (!event.gridCell.equals(currentHoverCell)) {
        if (currentHoverCell) {
            this.handleMouseExit(grid, currentHoverCell);
        }
        this.handleMouseEnter(grid, event);
        grid.setHoverCell(event.gridCell);
    } else {
        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    }
};

module.exports = OnHover;

},{"./Base.js":8}],20:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\overlay
 *
 */
var Base = require('./Base.js');
var noop = function() {};
var ANIMATION_TIME = 200;


function Overlay() {
    Base.call(this);
    this.alias = 'Overlay';
};

Overlay.prototype = Object.create(Base.prototype);

/**
 * @property {boolean} openEditor - is the editor open
 * @instance
 */
Overlay.prototype.openEditor = false,

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Overlay.prototype.handleKeyUp = function(grid, event) {
    var key = event.detail.char.toLowerCase();
    var keys = grid.resolveProperty('editorActivationKeys');
    if (keys.indexOf(key) > -1) {
        this.toggleColumnPicker(grid);
    }
};

/**
* @function
* @instance
* @description
toggle the column picker on/off
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.toggleColumnPicker = function(grid) {
    if (this.isColumnPickerOpen(grid)) {
        this.closeColumnPicker(grid);
    } else {
        this.openColumnPicker(grid);
    }
};

/**
* @function
* @instance
* @description
returns true if the column picker is open
* #### returns: boolean
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.isColumnPickerOpen = function(grid) {
    noop(grid);
    return this.overlay.style.display !== 'none';
};

/**
* @function
* @instance
* @description
open the column picker
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.openColumnPicker = function(grid) {
    if (this.isColumnPickerOpen()) {
        return;
    }
    this.openEditor = true;
    if (grid.getBehavior().openEditor(this.overlay) === false) {
        return;
    }

    var self = this;
    this.overlay.style.backgroundColor = grid.resolveProperty('backgroundColor');

    this.overlay.style.top = '0%';
    this.overlay.style.right = '0%';
    this.overlay.style.bottom = '0%';
    this.overlay.style.left = '0%';

    this.overlay.style.marginTop = '15px';
    this.overlay.style.marginRight = '35px';
    this.overlay.style.marginBottom = '35px';
    this.overlay.style.marginLeft = '15px';

    self.overlay.style.display = '';


    if (!this._closer) {
        this._closer = function(e) {
            var key = self.getCharFor(grid, e.keyCode).toLowerCase();
            var keys = grid.resolveProperty('editorActivationKeys');
            if (keys.indexOf(key) > -1 || e.keyCode === 27) {
                e.preventDefault();
                self.closeColumnPicker(grid);
            }
        };
    }

    grid.setFocusable(false);
    requestAnimationFrame(function() {
        self.overlay.style.opacity = 0.95;
        document.addEventListener('keydown', self._closer, false);
    });
    setTimeout(function() {
        self.overlay.focus();
    }, 100);
};

/**
* @function
* @instance
* @description
close the column picker
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.closeColumnPicker = function(grid) {
    grid.setFocusable(true);

    if (!this.isColumnPickerOpen()) {
        return;
    }
    if (this.openEditor) {
        this.openEditor = false;
    } else {
        return;
    }
    if (grid.getBehavior().closeEditor(this.overlay) === false) {
        return;
    }

    document.removeEventListener('keydown', this._closer, false);

    var self = this;

    requestAnimationFrame(function() {
        self.overlay.style.opacity = 0;
    });

    setTimeout(function() {
        self.overlay.innerHTML = '';
        self.overlay.style.display = 'none';
        grid.takeFocus();
    }, ANIMATION_TIME);
};

/**
* @function
* @instance
* @description
initialize myself into the grid
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.initializeOn = function(grid) {
    this.initializeOverlaySurface(grid);
    if (this.next) {
        this.next.initializeOn(grid);
    }
};

/**
* @function
* @instance
* @description
initialize the overlay surface into the grid
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.initializeOverlaySurface = function(grid) {
    this.overlay = document.createElement('div');
    this.overlay.setAttribute('tabindex', 0);
    this.overlay.style.outline = 'none';
    this.overlay.style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
    this.overlay.style.position = 'absolute';
    this.overlay.style.display = 'none';
    this.overlay.style.transition = 'opacity ' + ANIMATION_TIME + 'ms ease-in';
    this.overlay.style.opacity = 0;
    grid.appendChild(this.overlay);
    //document.body.appendChild(this.overlay);
};

/**
* @function
* @instance
* @description
get a human readable description of the key pressed from it's integer representation
* #### returns: string
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} integer - the integer we want the char for
*/
Overlay.prototype.getCharFor = function(grid, integer) {
    var charMap = grid.getCanvas().getCharMap();
    return charMap[integer][0];
};


module.exports = Overlay;

},{"./Base.js":8}],21:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var ColumnResizing = require('./ColumnResizing.js');

function RowResizing() {
    ColumnResizing.call(this);
    this.alias = 'RowResizing';
};

RowResizing.prototype = Object.create(ColumnResizing.prototype);

/**
 * @property {integer} dragArea - the index of the row/column we are dragging
 * @instance
 */
RowResizing.prototype.dragArea = -1,

/**
 * @property {integer} dragStart - the pixel location of the where the drag was initiated
 * @instance
 */
RowResizing.prototype.dragStart = -1,

/**
 * @property {integer} dragAreaStartingSize - the starting width/height of the row/column we are dragging
 * @instance
 */
RowResizing.prototype.dragAreaStartingSize = -1,

/**
* @function
* @instance
* @description
get the mouse x,y coordinate
* #### returns: integer
* @param {MouseEvent} event - the mouse event to query
*/
RowResizing.prototype.getMouseValue = function(event) {
    return event.primitiveEvent.detail.mouse.y;
};

/**
* @function
* @instance
* @description
get the grid cell x,y coordinate
* #### returns: integer
* @param {rectangle.point} gridCell - [rectangle.point](https://github.com/stevewirts/fin-rectangle)
*/
RowResizing.prototype.getGridCellValue = function(gridCell) {
    return gridCell.x;
};

/**
* @function
* @instance
* @description
return the grids x,y scroll value
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
RowResizing.prototype.getScrollValue = function(grid) {
    return grid.getVScrollValue();
};

/**
* @function
* @instance
* @description
return the width/height of the row/column of interest
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
*/
RowResizing.prototype.getAreaSize = function(grid, index) {
    return grid.getRowHeight(index);
};

/**
* @function
* @instance
* @description
set the width/height of the row/column at index
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
* @param {integer} value - the width/height to set to
*/
RowResizing.prototype.setAreaSize = function(grid, index, value) {
    grid.setRowHeight(index, value);
};

/**
* @function
* @instance
* @description
returns the index of which divider I'm over
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
RowResizing.prototype.overAreaDivider = function(grid, event) {
    return grid.overRowDivider(event);
};

/**
* @function
* @instance
* @description
am I over the column/row area
* #### returns: boolean
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
RowResizing.prototype.isFirstFixedOtherArea = function(grid, event) {
    return this.isFirstFixedColumn(grid, event);
};

/**
* @function
* @instance
* @description
return the cursor name
* #### returns: string
*/
RowResizing.prototype.getCursorName = function() {
    return 'row-resize';
};

/**
* @function
* @instance
* @description
return the recently rendered area's width/height
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
*/
RowResizing.prototype.getPreviousAbsoluteSize = function(grid, index) {
    return grid.getRenderedHeight(index);
};

/**
* @function
* @instance
* @description
return the fixed area rows/columns count
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
RowResizing.prototype.getOtherFixedAreaCount = function(grid) {
    return grid.getFixedColumnCount();
};

RowResizing.prototype.getFixedAreaCount = function(grid) {
    return grid.getFixedRowCount() + grid.getHeaderRowCount();
};

RowResizing.prototype.isEnabled = function(grid) {
    return grid.isRowResizeable();
};

module.exports = RowResizing;

},{"./ColumnResizing.js":14}],22:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function RowSelection() {
    Base.call(this);
    this.alias = 'RowSelection';
};

RowSelection.prototype = Object.create(Base.prototype);

/**
 * @property {fin-rectangle.point} currentDrag - currentDrag is the pixel location of the mouse pointer during a drag operation
 * @instance
 */
RowSelection.prototype.currentDrag = null,

/**
 * @property {Object} lastDragCell - lastDragCell is the cell coordinates of the where the mouse pointer is during a drag operation
 * @instance
 */
RowSelection.prototype.lastDragCell = null,

/**
 * @property {Number} sbLastAuto - sbLastAuto is a millisecond value representing the previous time an autoscroll started
 * @instance
 */
RowSelection.prototype.sbLastAuto = 0,

/**
 * @property {Number} sbAutoStart - sbAutoStart is a millisecond value representing the time the current autoscroll started
 * @instance
 */
RowSelection.prototype.sbAutoStart = 0,

RowSelection.prototype.dragArmed = false,

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleMouseUp = function(grid, event) {
    if (this.dragArmed) {
        this.dragArmed = false;
        grid.fireSyntheticRowSelectionChangedEvent();
    } else if (this.dragging) {
        this.dragging = false;
        grid.fireSyntheticRowSelectionChangedEvent();
    } else if (this.next) {
        this.next.handleMouseUp(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleMouseDown = function(grid, event) {

    var isRightClick = event.primitiveEvent.detail.isRightClick;
    var cell = event.gridCell;
    var viewCell = event.viewPoint;
    var dx = cell.x;
    var dy = cell.y;


    var isHeader = grid.isShowRowNumbers() && dx < 0;

    if (!grid.isRowSelection() || isRightClick || !isHeader) {
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    } else {

        var numFixedRows = grid.getFixedRowCount();

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.y < numFixedRows) {
            dy = viewCell.y;
        }

        var dCell = grid.newPoint(0, dy);

        var primEvent = event.primitiveEvent;
        var keys = primEvent.detail.keys;
        this.dragArmed = true;
        this.extendSelection(grid, dCell, keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleMouseDrag = function(grid, event) {
    var isRightClick = event.primitiveEvent.detail.isRightClick;

    if (!this.dragArmed || !grid.isRowSelection() || isRightClick) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    } else {
        this.dragging = true;
        var numFixedRows = grid.getFixedRowCount();

        var cell = event.gridCell;
        var viewCell = event.viewPoint;
        //var dx = cell.x;
        var dy = cell.y;

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.y < numFixedRows) {
            dy = viewCell.y;
        }

        var dCell = grid.newPoint(0, dy);

        var primEvent = event.primitiveEvent;
        this.currentDrag = primEvent.detail.mouse;
        this.lastDragCell = dCell;

        this.checkDragScroll(grid, this.currentDrag);
        this.handleMouseDragCellSelection(grid, dCell, primEvent.detail.keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleKeyDown = function(grid, event) {
    if (grid.getLastSelectionType() !== 'row') {
        if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
        return;
    }
    var command = 'handle' + event.detail.char;
    if (this[command]) {
        this[command].call(this, grid, event.detail);
    }
};

/**
* @function
* @instance
* @description
Handle a mousedrag selection
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
RowSelection.prototype.handleMouseDragCellSelection = function(grid, gridCell /* ,keys */ ) {

    //var behavior = grid.getBehavior();
    var y = gridCell.y;
    //            var previousDragExtent = grid.getDragExtent();
    var mouseDown = grid.getMouseDown();

    var newY = y - mouseDown.y;
    //var newY = y - mouseDown.y;

    // if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
    //     return;
    // }

    grid.clearMostRecentRowSelection();

    grid.selectRow(mouseDown.y, y);
    grid.setDragExtent(grid.newPoint(0, newY));

    grid.repaint();
};

/**
* @function
* @instance
* @description
this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
*/
RowSelection.prototype.checkDragScroll = function(grid, mouse) {
    if (!grid.resolveProperty('scrollingEnabled')) {
        return;
    }
    var b = grid.getDataBounds();
    var inside = b.contains(mouse);
    if (inside) {
        if (grid.isScrollingNow()) {
            grid.setScrollingNow(false);
        }
    } else if (!grid.isScrollingNow()) {
        grid.setScrollingNow(true);
        this.scrollDrag(grid);
    }
};

/**
* @function
* @instance
* @description
this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
RowSelection.prototype.scrollDrag = function(grid) {

    if (!grid.isScrollingNow()) {
        return;
    }

    var lastDragCell = this.lastDragCell;
    var b = grid.getDataBounds();
    var xOffset = 0;
    var yOffset = 0;

    var numFixedColumns = grid.getFixedColumnCount();
    var numFixedRows = grid.getFixedRowCount();

    var dragEndInFixedAreaX = lastDragCell.x < numFixedColumns;
    var dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

    if (this.currentDrag.y < b.origin.y) {
        yOffset = -1;
    }

    if (this.currentDrag.y > b.origin.y + b.extent.y) {
        yOffset = 1;
    }

    var dragCellOffsetX = xOffset;
    var dragCellOffsetY = yOffset;

    if (dragEndInFixedAreaX) {
        dragCellOffsetX = 0;
    }

    if (dragEndInFixedAreaY) {
        dragCellOffsetY = 0;
    }

    this.lastDragCell = lastDragCell.plusXY(dragCellOffsetX, dragCellOffsetY);
    grid.scrollBy(xOffset, yOffset);
    this.handleMouseDragCellSelection(grid, lastDragCell, []); // update the selection
    grid.repaint();
    setTimeout(this.scrollDrag.bind(this, grid), 25);
};

/**
* @function
* @instance
* @description
extend a selection or create one if there isnt yet
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} gridCell - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
RowSelection.prototype.extendSelection = function(grid, gridCell, keys) {
    grid.stopEditing();
    //var hasCTRL = keys.indexOf('CTRL') !== -1;
    var hasSHIFT = keys.indexOf('SHIFT') !== -1;

    var mousePoint = grid.getMouseDown();
    var x = gridCell.x; // - numFixedColumns + scrollLeft;
    var y = gridCell.y; // - numFixedRows + scrollTop;

    //were outside of the grid do nothing
    if (x < 0 || y < 0) {
        return;
    }

    if (hasSHIFT) {
        grid.clearMostRecentRowSelection();
        grid.selectRow(y, mousePoint.y);
        grid.setDragExtent(grid.newPoint(0, y - mousePoint.y));
    } else {
        grid.toggleSelectRow(y, keys);
        grid.setMouseDown(grid.newPoint(x, y));
        grid.setDragExtent(grid.newPoint(0, 0));
    }
    grid.repaint();
};


/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
RowSelection.prototype.handleDOWNSHIFT = function(grid) {
    this.moveShiftSelect(grid, 1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleUPSHIFT = function(grid) {
    this.moveShiftSelect(grid, -1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleLEFTSHIFT = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleRIGHTSHIFT = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleDOWN = function(grid) {
    this.moveSingleSelect(grid, 1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleUP = function(grid) {
    this.moveSingleSelect(grid, -1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleLEFT = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleRIGHT = function(grid) {

    var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());
    var maxColumns = grid.getColumnCount() - 1;

    var newX = grid.getHeaderColumnCount() + grid.getHScrollValue();
    var newY = mouseCorner.y;

    newX = Math.min(maxColumns, newX);

    grid.clearSelections();
    grid.select(newX, newY, 0, 0);
    grid.setMouseDown(grid.newPoint(newX, newY));
    grid.setDragExtent(grid.newPoint(0, 0));

    grid.repaint();
};

/**
* @function
* @instance
* @description
If we are holding down the same navigation key, accelerate the increment we scroll
* #### returns: integer
*/
RowSelection.prototype.getAutoScrollAcceleration = function() {
    var count = 1;
    var elapsed = this.getAutoScrollDuration() / 2000;
    count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
    return count;
};

/**
* @function
* @instance
* @description
set the start time to right now when we initiate an auto scroll
*/
RowSelection.prototype.setAutoScrollStartTime = function() {
    this.sbAutoStart = Date.now();
};

/**
* @function
* @instance
* @description
update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
*/
RowSelection.prototype.pingAutoScroll = function() {
    var now = Date.now();
    if (now - this.sbLastAuto > 500) {
        this.setAutoScrollStartTime();
    }
    this.sbLastAuto = Date.now();
};

/**
* @function
* @instance
* @description
answer how long we have been auto scrolling
* #### returns: integer
*/
RowSelection.prototype.getAutoScrollDuration = function() {
    if (Date.now() - this.sbLastAuto > 500) {
        return 0;
    }
    return Date.now() - this.sbAutoStart;
};

/**
* @function
* @instance
* @description
Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
RowSelection.prototype.moveShiftSelect = function(grid, offsetY) {

    var maxRows = grid.getRowCount() - 1;

    var maxViewableRows = grid.getVisibleRows() - 1;

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxRows = Math.min(maxRows, maxViewableRows);
    }

    var origin = grid.getMouseDown();
    var extent = grid.getDragExtent();

    var newY = extent.y + offsetY;
    //var newY = grid.getRowCount();

    newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

    grid.clearMostRecentRowSelection();
    grid.selectRow(origin.y, origin.y + newY);

    grid.setDragExtent(grid.newPoint(0, newY));

    if (grid.insureModelRowIsVisible(newY + origin.y, offsetY)) {
        this.pingAutoScroll();
    }

    grid.fireSyntheticRowSelectionChangedEvent();
    grid.repaint();

};

/**
* @function
* @instance
* @description
Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
RowSelection.prototype.moveSingleSelect = function(grid, offsetY) {

    var maxRows = grid.getRowCount() - 1;

    var maxViewableRows = grid.getVisibleRowsCount() - 1;

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxRows = Math.min(maxRows, maxViewableRows);
    }

    var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());

    var newY = mouseCorner.y + offsetY;
    //var newY = grid.getRowCount();

    newY = Math.min(maxRows, Math.max(0, newY));

    grid.clearSelections();
    grid.selectRow(newY);
    grid.setMouseDown(grid.newPoint(0, newY));
    grid.setDragExtent(grid.newPoint(0, 0));

    if (grid.insureModelRowIsVisible(newY, offsetY)) {
        this.pingAutoScroll();
    }

    grid.fireSyntheticRowSelectionChangedEvent();
    grid.repaint();

};

RowSelection.prototype.isSingleRowSelection = function() {
    return true;
};

module.exports = RowSelection;

},{"./Base.js":8}],23:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function ThumbwheelScrolling() {
    Base.call(this);
    this.alias = 'ThumbwheelScrolling';
};

ThumbwheelScrolling.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ThumbwheelScrolling.handleWheelMoved = function(grid, e) {
    if (!grid.resolveProperty('scrollingEnabled')) {
        return;
    }
    var primEvent = e.primitiveEvent;
    var deltaY = primEvent.wheelDeltaY || -primEvent.deltaY;
    var deltaX = primEvent.wheelDeltaX || -primEvent.deltaX;
    if (deltaY > 0) {
        grid.scrollBy(0, -1);
    } else if (deltaY < -0) {
        grid.scrollBy(0, 1);
    } else if (deltaX > 0) {
        grid.scrollBy(-1, 0);
    } else if (deltaX < -0) {
        grid.scrollBy(1, 0);
    }
};


module.exports = ThumbwheelScrolling;

},{"./Base.js":8}],24:[function(require,module,exports){
'use strict';

module.exports = {
    CellClick: require('./CellClick.js'),
    CellEditing: require('./CellEditing.js'),
    CellSelection: require('./CellSelection.js'),
    ColumnAutosizing: require('./ColumnAutosizing.js'),
    ColumnMoving: require('./ColumnMoving.js'),
    ColumnResizing: require('./ColumnResizing.js'),
    ColumnSelection: require('./ColumnSelection.js'),
    ColumnSorting: require('./ColumnSorting.js'),
    Filters: require('./Filters.js'),
    KeyPaging: require('./KeyPaging.js'),
    OnHover: require('./OnHover.js'),
    Overlay: require('./Overlay.js'),
    RowResizing: require('./RowResizing.js'),
    RowSelection: require('./RowSelection.js'),
    ThumbwheelScrolling: require('./ThumbwheelScrolling.js')
};


},{"./CellClick.js":9,"./CellEditing.js":10,"./CellSelection.js":11,"./ColumnAutosizing.js":12,"./ColumnMoving.js":13,"./ColumnResizing.js":14,"./ColumnSelection.js":15,"./ColumnSorting.js":16,"./Filters.js":17,"./KeyPaging.js":18,"./OnHover.js":19,"./Overlay.js":20,"./RowResizing.js":21,"./RowSelection.js":22,"./ThumbwheelScrolling.js":23}],25:[function(require,module,exports){
/* eslint-env node, browser */
'use strict';

var ns = (window.fin = window.fin || {})
    .hypergrid = window.fin.hypergrid || {};

ns.behaviors = require('./behaviors/behaviors.js');
ns.cellEditors = require('./cellEditors/cellEditors.js');
ns.dataModels = require('./dataModels/dataModels.js');
ns.features = require('./features/features.js');

},{"./behaviors/behaviors.js":1,"./cellEditors/cellEditors.js":2,"./dataModels/dataModels.js":7,"./features/features.js":24}]},{},[25]);
