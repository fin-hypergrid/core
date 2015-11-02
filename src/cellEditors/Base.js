'use strict';

var mustache = require('mustache');

function Base() {
    Object.call(this);
}

Base.prototype = new Object();
Base.prototype.constructor = Base;
/**
 * @property {boolean} isEditing - am I currently editing
 * @instance
 */
Base.prototype.isEditing = false,

/**
 * @property {rectangle.point} editorPoint - the point that I am editing at right now
 * @instance
 */
Base.prototype.editorPoint = null,

/**
 * @property {boolean} checkEditorPositionFlag - if true, check that the editor is in the right location
 * @instance
 */
Base.prototype.checkEditorPositionFlag = false,

/**
 * @property {HTMLElement} input - my main input control
 * @instance
 */
Base.prototype.input = null,

/**
 * @property {string} alias - my look up name
 * @instance
 */
Base.prototype.alias = 'base',

/**
 * @property {fin-hypergrid} grid - my instance of hypergrid
 * @instance
 */
Base.prototype.grid = null,

/**
 * @property {type} initialValue - the value before editing
 * @instance
 */
Base.prototype.initialValue = null,


/**
 * @function
 * @instance
 * @description
 return the behavior (model)
 *
 * #### returns:[fin-hypergrid-behavior-base](module-behaviors_base.html)
 */
Base.prototype.getBehavior = function() {
    return this.grid.getBehavior();
};

/**
 * @function
 * @instance
 * @description
 This function is a callback from the fin-hypergrid.   It is called after each paint of the canvas.
 *
 */
Base.prototype.gridRenderedNotification = function() {
    this.checkEditor();
};

/**
 * @function
 * @instance
 * @description
scroll values have changed, we've been notified
 */
Base.prototype.scrollValueChangedNotification = function() {
    this.setCheckEditorPositionFlag();
};

/**
* @function
* @instance
* @description
turn on checkEditorPositionFlag boolean field
*/
Base.prototype.setCheckEditorPositionFlag = function() {
    this.checkEditorPositionFlag = true;
};

/**
* @function
* @instance
* @description
begin editing at location point
* @param {rectangle.point} point - the location to start editing at
*/
Base.prototype.beginEditAt = function(point) {
    this.setEditorPoint(point);
    var model = this.getBehavior();
    var value = model.getValue(point.x, point.y);
    if (value.constructor.name === 'Array') {
        value = value[1]; //it's a nested object
    }
    var proceed = this.grid.fireRequestCellEdit(point, value);
    if (!proceed) {
        //we were cancelled
        return;
    }
    this.initialValue = value;
    this.setEditorValue(value);
    this.isEditing = true;
    this.setCheckEditorPositionFlag();
    this.checkEditor();
};

/**
* @function
* @instance
* @description
put value into our editor
* @param {object} value - whatever value we want to edit
*/
Base.prototype.setEditorValue = function(value) {
    noop(value);
};

/**
* @function
* @instance
* @description
returns the point at which we are currently editing
* #### returns: rectangle.point
*/
Base.prototype.getEditorPoint = function() {
    return this.editorPoint;
};

/**
* @function
* @instance
* @description
set the current editor location
* @param {rectangle.point} point - the data location of the current editor
*/
Base.prototype.setEditorPoint = function(point) {
    this.editorPoint = point;
    this.modelPoint = this.getGrid().convertViewPointToDataPoint(point);
};

/**
* @function
* @instance
* @description
display the editor
*/
Base.prototype.showEditor = function() {};

/**
* @function
* @instance
* @description
hide the editor
*/
Base.prototype.hideEditor = function() {};

/**
* @function
* @instance
* @description
stop editing
*/
Base.prototype.stopEditing = function() {
    if (!this.isEditing) {
        return;
    }
    var proceed = this.getGrid().fireSyntheticEditorDataChangeEvent(this, this.initialValue, this.getEditorValue, this);
    if (!proceed) {
        return;
    }
    this.saveEditorValue();
    this.isEditing = false;
    this.hideEditor();
};

Base.prototype.cancelEditing = function() {
    if (!this.isEditing) {
        return;
    }
    this.isEditing = false;
    this.hideEditor();
};

/**
* @function
* @instance
* @description
save the new value into the behavior(model)
*/
Base.prototype.saveEditorValue = function() {
    var point = this.getEditorPoint();
    var value = this.getEditorValue();
    if (value === this.initialValue) {
        return; //data didn't change do nothing
    }
    var continued = this.getGrid().fireBeforeCellEdit(point, this.initialValue, value, this);
    if (!continued) {
        return;
    }
    this.getBehavior().setValue(point.x, point.y, value);
    this.getGrid().fireAfterCellEdit(point, this.initialValue, value, this);
};

/**
* @function
* @instance
* @description
return the current editor's value
* #### returns: Object
*/
Base.prototype.getEditorValue = function() {

};

/**
* @function
* @instance
* @description
request focus for my input control
*/
Base.prototype.takeFocus = function() {

};

/**
* @function
* @instance
* @description
move the editor to the current editor point
*/
Base.prototype._moveEditor = function() {
    var grid = this.getGrid();
    var editorPoint = this.getEditorPoint();
    var cellBounds = grid._getBoundsOfCell(editorPoint.x, editorPoint.y);

    //hack to accomodate bootstrap margin issues...
    var xOffset = grid.getBoundingClientRect().left - grid.canvas.getBoundingClientRect().left;
    cellBounds.x = cellBounds.x - xOffset;

    this.setBounds(cellBounds);
};

Base.prototype.moveEditor = function() {
    this._moveEditor();
    this.takeFocus();
};

/**
* @function
* @instance
* @description
set the bounds of my input control
* @param {rectangle} rectangle - the bounds to move to
*/
Base.prototype.setBounds = function(rectangle) {
    noop(rectangle);
};

/**
* @function
* @instance
* @description
check that the editor is in the correct location, and is showing/hidden appropriately
*/
Base.prototype.checkEditor = function() {
    if (!this.checkEditorPositionFlag) {
        return;
    } else {
        this.checkEditorPositionFlag = false;
    }
    if (!this.isEditing) {
        return;
    }
    var editorPoint = this.getEditorPoint();
    if (this.grid.isDataVisible(editorPoint.x, editorPoint.y)) {
        this.moveEditor();
        this.showEditor();
    } else {
        this.hideEditor();
    }
};

Base.prototype.getGrid = function() {
    return this.grid;
};

Base.prototype.template = function() {/*
*/
};

Base.prototype.getHTML = function() {
    var string = this.template.toString().split('\n');
    string.shift();
    string.length = string.length - 2;
    string = string.join('\n').trim();
    var html = mustache.render(string, this);
    return html;
};

Base.prototype.getInput = function() {
    if (!this.input) {
        this.input = this.getDefaultInput();
    }
    return this.input;
};

Base.prototype.getDefaultInput = function() {
    var div = document.createElement('DIV');
    div.innerHTML = this.getHTML();
    var input = div.firstChild;
    this.initializeInput(input);
    return input;
};

Base.prototype.updateView = function() {
    var oldGuy = this.getInput();
    var parent = oldGuy.parentNode;
    var newGuy = this.getDefaultInput();
    this.input = newGuy;
    parent.replaceChild(newGuy, oldGuy);
};

Base.prototype.initializeInput = function(input) {
};

Base.prototype.showDropdown = function(element) {
    var event;
    event = document.createEvent('MouseEvents');
    event.initMouseEvent('mousedown', true, true, window);
    element.dispatchEvent(event);
};

module.exports = Base;
