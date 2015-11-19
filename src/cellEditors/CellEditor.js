/* eslint-env browser */

'use strict';

var mustache = require('mustache');

var extend = require('extend-me');

function CellEditor() {
    // nothing to do here
}

CellEditor.extend = extend;

CellEditor.prototype = {

    constructor: CellEditor.prototype.constructor,

    /**
     * @property {boolean} isEditing - am I currently editing
     * @instance
     */
    isEditing: false,

    /**
     * @property {rectangle.point} editorPoint - the point that I am editing at right now
     * @instance
     */
    editorPoint: null,

    /**
     * @property {boolean} checkEditorPositionFlag - if true, check that the editor is in the right location
     * @instance
     */
    checkEditorPositionFlag: false,

    /**
     * @property {HTMLElement} input - my main input control
     * @instance
     */
    input: null,

    /**
     * @property {string} alias - my look up name
     * @instance
     */
    alias: 'base',

    /**
     * @property {fin-hypergrid} grid - my instance of hypergrid
     * @instance
     */
    grid: null,

    /**
     * @property {type} initialValue - the value before editing
     * @instance
     */
    initialValue: null,


    /**
     * @function
     * @instance
     * @desc return the behavior (model)
     *
     * #### returns:[fin-hypergrid-behavior-base](module-behaviors_base.html)
     */
    getBehavior: function() {
        return this.grid.getBehavior();
    },

    /**
     * @function
     * @instance
     * @desc This function is a callback from the fin-hypergrid.   It is called after each paint of the canvas.
     *
     */
    gridRenderedNotification: function() {
        this.checkEditor();
    },

    /**
     * @function
     * @instance
     * @desc scroll values have changed, we've been notified
     */
    scrollValueChangedNotification: function() {
        this.setCheckEditorPositionFlag();
    },

    /**
     * @function
     * @instance
     * @desc turn on checkEditorPositionFlag boolean field
     */
    setCheckEditorPositionFlag: function() {
        this.checkEditorPositionFlag = true;
    },

    /**
     * @function
     * @instance
     * @desc begin editing at location point
     * @param {rectangle.point} point - the location to start editing at
     */
    beginEditAt: function(point) {
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
    },

    /**
     * @function
     * @instance
     * @desc put value into our editor
     * @param {object} value - whatever value we want to edit
     */
    setEditorValue: function(value) {},

    /**
     * @function
     * @instance
     * @desc returns the point at which we are currently editing
     * #### returns: rectangle.point
     */
    getEditorPoint: function() {
        return this.editorPoint;
    },

    /**
     * @function
     * @instance
     * @desc set the current editor location
     * @param {rectangle.point} point - the data location of the current editor
     */
    setEditorPoint: function(point) {
        this.editorPoint = point;
        this.modelPoint = this.getGrid().convertViewPointToDataPoint(point);
    },

    /**
     * @function
     * @instance
     * @desc display the editor
     */
    showEditor: function() {},

    /**
     * @function
     * @instance
     * @desc hide the editor
     */
    hideEditor: function() {},

    /**
     * @function
     * @instance
     * @desc stop editing
     */
    stopEditing: function() {
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
    },

    cancelEditing: function() {
        if (!this.isEditing) {
            return;
        }
        this.isEditing = false;
        this.hideEditor();
    },

    /**
     * @function
     * @instance
     * @desc save the new value into the behavior(model)
     */
    saveEditorValue: function() {
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
    },

    /**
     * @function
     * @instance
     * @desc return the current editor's value
     * #### returns: Object
     */
    getEditorValue: function() {

    },

    /**
     * @function
     * @instance
     * @desc request focus for my input control
     */
    takeFocus: function() {

    },

    /**
     * @function
     * @instance
     * @desc move the editor to the current editor point
     */
    _moveEditor: function() {
        var grid = this.getGrid();
        var editorPoint = this.getEditorPoint();
        var cellBounds = grid._getBoundsOfCell(editorPoint.x, editorPoint.y);

        //hack to accomodate bootstrap margin issues...
        var xOffset = grid.div.getBoundingClientRect().left - grid.divCanvas.getBoundingClientRect().left;
        cellBounds.x = cellBounds.x - xOffset;

        this.setBounds(cellBounds);
    },

    moveEditor: function() {
        this._moveEditor();
        this.takeFocus();
    },

    /**
     * @function
     * @instance
     * @desc set the bounds of my input control
     * @param {rectangle} rectangle - the bounds to move to
     */
    setBounds: function(rectangle) {},

    /**
     * @function
     * @instance
     * @desc check that the editor is in the correct location, and is showing/hidden appropriately
     */
    checkEditor: function() {
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
    },

    getGrid: function() {
        return this.grid;
    },

    template: function() {
        /*
         */
    },

    getHTML: function() {
        var string = this.template.toString().split('\n');
        string.shift();
        string.shift();
        string.length = string.length - 2;
        string = string.join('\n').trim();
        var html = mustache.render(string, this);
        return html;
    },

    getInput: function() {
        if (!this.input) {
            this.input = this.getDefaultInput();
        }
        return this.input;
    },

    getDefaultInput: function() {
        var div = document.createElement('DIV');
        div.innerHTML = this.getHTML();
        var input = div.firstChild;
        this.initializeInput(input);
        return input;
    },

    updateView: function() {
        var oldGuy = this.getInput();
        var parent = oldGuy.parentNode;
        var newGuy = this.getDefaultInput();
        this.input = newGuy;
        parent.replaceChild(newGuy, oldGuy);
    },

    initializeInput: function(input) {},

    showDropdown: function(element) {
        var event;
        event = document.createEvent('MouseEvents');
        event.initMouseEvent('mousedown', true, true, window);
        element.dispatchEvent(event);
    }

};

module.exports = CellEditor;
