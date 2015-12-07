/* eslint-env browser */

'use strict';

var mustache = require('mustache');
var Base = require('extend-me').Base;

/**
 * @constructor
 */
var CellEditor = Base.extend('CellEditor', {

    alias: 'base',

    /**
     * am I currently editing (i.e., between calls to `beginEditAt` and either `stopEditing` or `cancelEditing`)
     * @type {boolean}
     * @default false
     * @memberOf CellEditor.prototype
     */
    isEditing: false,

    /**
     * the point that I am editing at right now
     * @type {Point}
     * @default null
     * @memberOf CellEditor.prototype
     */
    editorPoint: null,

    /**
     * if true, check that the editor is in the right location
     * @type {boolean}
     * @default false
     * @memberOf CellEditor.prototype
     */
    checkEditorPositionFlag: false,

    /**
     * my main input control
     * @type {Element}
     * @default null
     * @memberOf CellEditor.prototype
     */
    input: null,

    /**
     * my instance of hypergrid
     * @type {Hypergrid}
     * @default null
     * @memberOf CellEditor.prototype
     */
    grid: null,

    /**
     * the value before editing
     * @type {type}
     * @default null
     * @memberOf CellEditor.prototype
     */
    initialValue: null,

    /**
     * @memberOf CellEditor.prototype
     * @desc return the behavior (model)
     * @returns {Behavior} The behavior (model).
     */
    getBehavior: function() {
        return this.grid.getBehavior();
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc This function is a callback from the fin-hypergrid.   It is called after each paint of the canvas.
     */
    gridRenderedNotification: function() {
        this.checkEditor();
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc scroll values have changed, we've been notified
     */
    scrollValueChangedNotification: function() {
        this.setCheckEditorPositionFlag();
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc turn on checkEditorPositionFlag boolean field
     */
    setCheckEditorPositionFlag: function() {
        this.checkEditorPositionFlag = true;
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc begin editing at location point
     * @param {Point} point - the location to start editing at
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
     * @memberOf CellEditor.prototype
     * @desc put value into our editor
     * @param {object} value - whatever value we want to edit
     */
    setEditorValue: function(value) {},

    /**
     * @memberOf CellEditor.prototype
     * @desc returns the point at which we are currently editing
     * @returns {Point}
     */
    getEditorPoint: function() {
        return this.editorPoint;
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc set the current editor location
     * @param {Point} point - the data location of the current editor
     */
    setEditorPoint: function(point) {
        this.editorPoint = point;
        this.modelPoint = this.getGrid().convertViewPointToDataPoint(point);
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc display the editor
     */
    showEditor: function() {},

    /**
     * @memberOf CellEditor.prototype
     * @desc hide the editor
     */
    hideEditor: function() {},

    /**
     * @memberOf CellEditor.prototype
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
     * @memberOf CellEditor.prototype
     * @desc save the new value into the behavior(model)
     */
    saveEditorValue: function() {
        var point = this.getEditorPoint();
        var value = this.getEditorValue();
        if (value === this.initialValue) {
            return; //data didn't change do nothing
        }
        if (parseFloat(this.initialValue) === this.initialValue) { // I'm a number
            value = parseFloat(value);
        }
        var continued = this.getGrid().fireBeforeCellEdit(point, this.initialValue, value, this);
        if (!continued) {
            return;
        }
        this.getBehavior().setValue(point.x, point.y, value);
        this.getGrid().fireAfterCellEdit(point, this.initialValue, value, this);
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc return the current editor's value
     */
    getEditorValue: function() {},

    /**
     * @memberOf CellEditor.prototype
     * @desc request focus for my input control
     */
    takeFocus: function() {},

    /**
     * @memberOf CellEditor.prototype
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
     * @memberOf CellEditor.prototype
     * @desc set the bounds of my input control
     * @param {Rectangle} the bounds to move to
     */
    setBounds: function(rectangle) {},

    /**
     * @memberOf CellEditor.prototype
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
        return mustache.render(string, this);
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

});

module.exports = CellEditor;
