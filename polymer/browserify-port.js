(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = {
    //CellClick: require('./CellClick.js');
};

},{}],2:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],3:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{"./Base.js":4}],6:[function(require,module,exports){
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

},{"./Base.js":4}],7:[function(require,module,exports){
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

},{"./Base.js":4}],8:[function(require,module,exports){
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

},{"./Base.js":4}],9:[function(require,module,exports){
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

},{"./Base.js":4}],10:[function(require,module,exports){
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

},{"./Base.js":4}],11:[function(require,module,exports){
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

},{"./Base.js":4}],12:[function(require,module,exports){
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

},{"./Base.js":4}],13:[function(require,module,exports){
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

},{"./Base.js":4}],14:[function(require,module,exports){
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

},{"./ColumnResizing.js":9}],15:[function(require,module,exports){
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

},{"./Base.js":4}],16:[function(require,module,exports){
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

},{"./Base.js":4}],17:[function(require,module,exports){
'use strict';

module.exports = {
    CellClick: require('./CellClick.js'),
    CellEditing: require('./CellEditing.js'),
    CellSelection: require('./CellSelection.js'),
    ColumnAutosizing: require('./ColumnAutosizing.js'),
    //ColumnMoving: require('./ColumnMoving.js'),
    ColumnResizing: require('./ColumnResizing.js'),
    ColumnSelection: require('./ColumnSelection.js'),
    ColumnSorting: require('./ColumnSorting.js'),
    Filters: require('./Filters.js'),
    //KeyPaging: require('./KeyPaging.js'),
    OnHover: require('./OnHover.js'),
    //Overlay: require('./Overlay.js'),
    RowResizing: require('./RowResizing.js'),
    RowSelection: require('./RowSelection.js'),
    ThumbwheelScrolling: require('./ThumbwheelScrolling.js')
};


},{"./CellClick.js":5,"./CellEditing.js":6,"./CellSelection.js":7,"./ColumnAutosizing.js":8,"./ColumnResizing.js":9,"./ColumnSelection.js":10,"./ColumnSorting.js":11,"./Filters.js":12,"./OnHover.js":13,"./RowResizing.js":14,"./RowSelection.js":15,"./ThumbwheelScrolling.js":16}],18:[function(require,module,exports){
/* eslint-env node, browser */
'use strict';

var ns = (window.fin = window.fin || {})
    .hypergrid = window.fin.hypergrid || {};

ns.behaviors = require('./behaviors/behaviors.js');
ns.cellEditors = require('./cellEditors/cellEditors.js');
ns.dataModels = require('./dataModels/dataModels.js');
ns.features = require('./features/features.js');

},{"./behaviors/behaviors.js":1,"./cellEditors/cellEditors.js":2,"./dataModels/dataModels.js":3,"./features/features.js":17}]},{},[18]);
