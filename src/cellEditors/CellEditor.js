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
    editorPoint: {
        x: -1,
        y: -1
    },

    /**
     * if true, check that the editor is in the right location
     * @type {boolean}
     * @default false
     * @memberOf CellEditor.prototype
     */
    checkEditorPositionFlag: false,

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
        this.editorPoint = point;
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
        this.modelPoint = this.grid.convertViewPointToDataPoint(point);
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
        var proceed = this.grid.fireSyntheticEditorDataChangeEvent(this, this.initialValue, this.getEditorValue, this);
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
    saveEditorValue: function() {},

    /**
     * @memberOf CellEditor.prototype
     * @desc return the current editor's value
     */
    getEditorValue: function() {},

    /**
     * @memberOf CellEditor.prototype
     * @desc request focus
     */
    takeFocus: function() {},


    /**
     * @memberOf CellEditor.prototype
     * @desc check that the editor is in the correct location, and is showing/hidden appropriately
     */
    checkEditor: function() {
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

});

module.exports = CellEditor;
