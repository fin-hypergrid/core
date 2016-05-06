/* eslint-env browser */

'use strict';

var mustache = require('mustache');

var Base = require('../lib/Base');
var localization = require('../lib/localization');

var extract = /\/\*\s*([^]+?)\s+\*\//; // finds the string inside the /* ... */; the (group) excludes the whitespace

/**
 * @constructor
 */
var CellEditor = Base.extend('CellEditor', {

    initialize: function(grid, localizer) {

        /**
         * my instance of hypergrid
         * @type {Hypergrid}
         * @memberOf CellEditor.prototype
         */
        this.grid = grid;

        if (localizer) {
            this.localizer = localizer;
        }

        this.editorPoint = {
            x: 0,
            y: 0
        };

        this.reset();

        var self = this;
        this.el.addEventListener('keyup', this.keyup.bind(this));
        this.el.addEventListener('keydown', function(e) { grid.fireSyntheticEditorKeyDownEvent(self, e); });
        this.el.addEventListener('keypress', function(e) { grid.fireSyntheticEditorKeyPressEvent(self, e); });
        this.el.onblur = function(e) { self.cancelEditing(); };
    },

    reset: function() {
        var container = document.createElement('DIV');
        container.innerHTML = this.getHTML();

        /**
         * This object's input control, one of:
         * * *input element* - an `HTMLElement` that has a `value` attribute, such as `HTMLInputElement`, `HTMLButtonElement`, etc.
         * * *container element* - an `HTMLElement` containing one or more input elements, only one of which contains the editor value.
         *
         * For access to the input control itself (which may or may not be the same as `this.el`), see `this.input`.
         *
         * @type {HTMLElement}
         * @default null
         * @memberOf CellEditor.prototype
         */
        this.el = container.firstChild;

        this.input = this.el;
    },

    specialKeyups: {
        //0x08: 'clearStopEditing', // backspace
        0x09: 'stopEditing', // tab
        0x0d: 'stopEditing', // return/enter
        0x1b: 'cancelEditing' // escape
    },

    keyup: function(e) {
        if (e) {
            var specialKeyup = this.specialKeyups[e.keyCode];

            if (specialKeyup) {
                e.preventDefault();
                this[specialKeyup]();
                this.grid.repaint();
                this.grid.takeFocus();
            }

            this.grid.fireSyntheticEditorKeyUpEvent(this, e);
        }
    },

    localizer: localization.get(null),

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

    /** @deprecated Use `.grid.behavior` property instead.
     * @memberOf CellEditor.prototype
     * @returns {Behavior} The behavior (model).
     */
    getBehavior: function() {
        return this.deprecated('grid.behavior', { since: '0.2' });
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
     * @desc turn on checkEditorPositionFlag boolean field
     * @memberOf CellEditor.prototype
     */
    setCheckEditorPositionFlag: function() {
        this.checkEditorPositionFlag = true;
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc move the editor to the current editor point
     */
    moveEditor: function() {
        var editorPoint = this.getEditorPoint();
        var cellBounds = this.grid._getBoundsOfCell(editorPoint.x, editorPoint.y);

        //hack to accommodate bootstrap margin issues...
        var xOffset =
            this.grid.div.getBoundingClientRect().left -
            this.grid.divCanvas.getBoundingClientRect().left;

        cellBounds.x -= xOffset;

        this.setBounds(cellBounds);
    },

    /**
     * @desc begin editing at location point
     * @param {Point} point - the location to start editing at
     * @memberOf CellEditor.prototype
     */
    beginEditAt: function(point) {
        if (!this.isAdded) {
            this.isAdded = true;
            this.attachEditor();
        }

        this.setEditorPoint(point);

        var value = this.grid.behavior.getValue(point.x, point.y);
        if (value instanceof Array) {
            value = value[1]; //it's a nested object
        }

        if (this.grid.fireRequestCellEdit(point, value)) {
            this.initialValue = value;
            this.setCheckEditorPositionFlag();
            this.checkEditor();
        }
    },

    /**
     * @desc put value into our editor
     * @param {object} value - whatever value we want to edit
     * @memberOf CellEditor.prototype
     */
    setEditorValue: function(value) {
        this.input.value = this.localizer.localize(value);
    },

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
    showEditor: function() {
        this.el.style.display = 'inline';
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc hide the editor
     */
    hideEditor: function() {
        this.el.style.display = 'none';
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc stop editing
     */
    stopEditing: function() {
        var value = this.getEditorValue();
        if (this.grid.fireSyntheticEditorDataChangeEvent(this, this.initialValue, value)) {
            this.saveEditorValue(value);
            this.hideEditor();
            this.grid.cellEditor = null;
            this.el.remove();
        }
    },

    cancelEditing: function() {
        if (this.grid.cellEditor) { // because stopEditing's .remove triggers blur which comes here
            this.setEditorValue(this.initialValue);
            this.hideEditor();
            this.grid.cellEditor = null;
            this.el.remove();
        }
    },

    /**
     * @desc save the new value into the behavior (model)
     * @memberOf CellEditor.prototype
     */
    saveEditorValue: function(value) {
        var point = this.getEditorPoint();

        if (
            !(value && value === this.initialValue) && // data changed
            this.grid.fireBeforeCellEdit(point, this.initialValue, value, this) // not aborting
        ) {
            this.grid.behavior.setValue(point.x, point.y, value);
            this.grid.fireAfterCellEdit(point, this.initialValue, value, this);
        }
    },

    /**
     * @desc return the current editor's value
     * @returns {object} the current editor's value
     * @memberOf CellEditor.prototype
     */
    getEditorValue: function() {
        return this.localizer.standardize(this.input.value);
    },

    /**
     * @summary Request focus for my input control.
     * @desc See GRID-95 "Scrollbar moves inward" for issue and work-around explanation.
     * @memberOf CellEditor.prototype
     */
    takeFocus: function() {
        var self = this;
        setTimeout(function() {
            var input = self.el,
                transformWas = input.style.transform;

            input.style.transform = 'translate(0,0)'; // work-around: move to upper left

            self.input.focus();
            self.selectAll();

            input.style.transform = transformWas;
        });
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc select everything
     */
    selectAll: nullPattern,

    /**
     * @memberOf CellEditor.prototype
     * @desc set the bounds of my input control
     * @param {rectangle} rectangle - the bounds to move to
     */
    setBounds: function(cellBounds) {
        var input = this.el;

        input.style.transform = translate(
            cellBounds.x - 1,
            cellBounds.y - 1
        );

        input.style.width = px(cellBounds.width + 2);
        input.style.height = px(cellBounds.height + 2);
    },

    /**
     * @desc check that the editor is in the correct location, and is showing/hidden appropriately
     * @memberOf CellEditor.prototype
     */
    checkEditor: function() {
        if (this.checkEditorPositionFlag) {
            this.checkEditorPositionFlag = false;
            var editorPoint = this.getEditorPoint();
            if (this.grid.isDataVisible(editorPoint.x, editorPoint.y)) {
                this.setEditorValue(this.initialValue);
                this.attachEditor();
                this.moveEditor();
                this.takeFocus();
                this.showEditor();
            } else {
                this.hideEditor();
            }
        }
    },

    attachEditor: function() {
        var input = this.el,
            div = this.grid.div,
            referenceNode = div.querySelectorAll('.finbar-horizontal, .finbar-vertical');

        div.insertBefore(input, referenceNode.length ? referenceNode[0] : null);
    },

    /** @deprecated Use `.grid` property instead. */
    getGrid: function() {
        return this.deprecated('grid', { since: '0.2' });
    },

    template: function() {/**/},

    getHTML: function() {
        var template = this.template.toString().match(extract)[1];
        return mustache.render(template, this);
    },

});

function nullPattern() {}
function px(n) { return n + 'px'; }
function translate(x, y) { return 'translate(' + px(x) + ',' + px(y) + ')'; }


CellEditor.abstract = true; // don't instantiate directly


module.exports = CellEditor;
