/* eslint-env browser */

'use strict';

var mustache = require('mustache');
var _ = require('object-iterators');

var Base = require('../lib/Base');
var effects = require('../lib/effects');
var Localization = require('../lib/Localization');

/**
 * @constructor
 */
var CellEditor = Base.extend('CellEditor', {

    /**
     * @param grid
     * @param {string} [options] - Properties to copy to the new cell editor primarily for mustache's use.
     */
    initialize: function(grid, options) {

        if (options) {
            for (var key in options) {
                if (options.hasOwnProperty(key) && this[key] !== null) {
                    this[key] = options[key];
                }
            }
        }

        /**
         * my instance of hypergrid
         * @type {Hypergrid}
         * @memberOf CellEditor.prototype
         */
        this.grid = grid;

        this.locale = grid.localization.locale; // for template's `lang` attribute

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

    localizer: Localization.prototype.null,

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

        this.errors = 0;
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
                if (this[specialKeyup](3)) {
                    this.grid.repaint();
                    this.grid.takeFocus();
                }
            }

            this.grid.fireSyntheticEditorKeyUpEvent(this, e);
        }
    },

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

        // override native localizer with localizer named in format if defined (from instantiation options)
        if (this.format) {
            this.localizer = this.grid.localization.get(this.format);
        }

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
        this.input.value = this.localizer.format(value);
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

    /** @summary Stops editing.
     * @desc Before saving, validates the edited value in two phases as follows:
     * 1. Call `validateEditorValue`. (Calls the localizer's `invalid()` function, if available.)
     * 2. Catch any errors thrown by the {@link CellEditor#getEditorValue|getEditorValue} method.
     *
     * **If the edited value passes both phases of the validation:**
     * Saves the edited value by calling the {@link CellEditor#saveEditorValue|saveEditorValue} method.
     *
     * **On validation failure:**
     * 1. If `feedback` was omitted, cancels editing, discarding the edited value.
     * 2. If `feedback` was provided, gives the user some feedback (see `feedback`, below).
     *
     * @param {number} [feedback] What to do on validation failure:
     * * If omitted, simply cancels editing without saving edited value.
     * * If 0, shows the error feedback effect (see the {@link CellEditor#errorEffect|errorEffect} property).
     * * If > 0, shows the error feedback effect _and_ calls the {@link CellEditor#errorEffectEnd|errorEffectEnd} method) every `feedback` call(s) to `stopEditing`.
     * @returns {boolean} Truthy means successful stop. Falsy means syntax error prevented stop. Note that editing is canceled when no feedback requested and successful stop includes (successful) cancel.
     * @memberOf CellEditor.prototype
     */
    stopEditing: function(feedback) {
        /**
         * @type {boolean|string|Error}
         */
        var error = this.validateEditorValue();

        if (!error) {
            try {
                var value = this.getEditorValue();
            } catch (err) {
                error = err;
            }
        }

        if (!error && this.grid.fireSyntheticEditorDataChangeEvent(this, this.initialValue, value)) {
            try {
                this.saveEditorValue(value);
            } catch (err) {
                error = err;
            }
        }

        if (!error) {
            this.hideEditor();
            this.grid.cellEditor = null;
            this.el.remove();
        } else if (feedback >= 0) { // never true when `feedback` undefined
            var point = this.getEditorPoint();
            this.grid.selectViewportCell(point.x, point.y - this.grid.getHeaderRowCount());
            this.errorEffectBegin(++this.errors % feedback === 0 && error);
        } else { // invalid but no feedback
            return this.cancelEditing();
        }

        return !error;
    },

    /** @summary Cancels editing.
     * @returns {boolean} Successful. (Cancel is always successful.)
     */
    cancelEditing: function() {
        if (this.grid.cellEditor) { // because stopEditing's .remove triggers blur which comes here
            this.setEditorValue(this.initialValue);
            this.hideEditor();
            this.grid.cellEditor = null;
            this.el.remove();
        }
        return true;
    },

    /**
     * Calls the effect function indicated in the {@link CellEditor#errorEffect|errorEffect} property which triggers a series of CSS transitions.
     * @param {boolean|string|Error} [error] - If defined, call the {@link CellEditor#errorEffectEnd|errorEffectEnd} method at the end of the last effect transition with this error.
     * @memberOf CellEditor.prototype
     */
    errorEffectBegin: function(error) {
        var options = { callback: error && this.errorEffectEnd.bind(this, error) },
            effect = this.errorEffect;

        if (typeof effect === 'string') {
            effect = this.errorEffects[effect];
        }

        if (typeof effect === 'object') {
            _(options).extendOwn(effect.options);
            effect = effect.effector;
        }

        if (typeof effect === 'function') {
            effect.call(this, options);
        } else {
            throw 'Expected `this.errorEffect` to resolve to an error effect function.';
        }
    },

    /**
     * This function expects to be passed an error. There is no point in calling this function if there is no error. Nevertheless, if called with a falsy `error`, returns without doing anything.
     * @this {CellEditor}
     * @param {boolean|string|Error} [error]
     */
    errorEffectEnd: function(error) {
        if (error) {
            var msg =
                'Invalid value. To resolve, do one of the following:\n\n' +
                '   * Correct the error and try again.\n' +
                '         - or -\n' +
                '   * Cancel editing by pressing the "esc" (escape) key.';

            error = error.message || error;

            if (typeof error !== 'string') {
                error = '';
            }

            if (this.localizer.expectation) {
                error = error ? error + '\n' + this.localizer.expectation : this.localizer.expectation;
            }

            if (error) {
                error = '\n' + error;
                error = error.replace(/[\n\r]+/g, '\n\n   * ');
                msg += '\n\nAdditional information about this error:' + error;
            }

            alert(msg); // eslint-disable-line no-alert
        }
    },

    /** @typedef effectObject
     * @property {effectFunction} effector
     * @property {object} [options] - An options object with which to call the function.
     */
    /**
     * May be one of:
     * * **string** - Name of registered error effect.
     * * **effectFunction** - Reference to an effect function.
     * * **effectObject** - Reference to an effectObject containing an {@link effectFunction} and an `options` object with which to call the function.
     * @type {string|effectFunction|effectObject}
     * @memberOf CellEditor.prototype
     */
    errorEffect: 'shaker',

    /**
     * Hash of registered {@link effectFunction}s or {@link effectObject}s.
     * @memberOf CellEditor.prototype
     */
    errorEffects: {
        shaker: effects.shaker,
        glower: effects.glower
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
        return this.localizer.parse(this.input.value);
    },

    /**
     * If there is no validator on the localizer, returns falsy (not invalid; possibly valid).
     * @returns {boolean|string} Truthy value means invalid. If a string, this will be an error message. If not a string, it merely indicates a generic invalid result.
     */
    validateEditorValue: function() {
        return this.localizer.invalid && this.localizer.invalid(this.input.value);
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
                leftWas = input.style.left,
                topWas = input.style.top;

            input.style.left = input.style.top = 0; // work-around: move to upper left

            self.input.focus();
            self.selectAll();

            input.style.left = leftWas;
            input.style.top = topWas;
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

        input.style.position = 'absolute';
        input.style.left = px(cellBounds.x - 1);
        input.style.top = px(cellBounds.y - 1);
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

    template: '',

    getHTML: function() {
        return mustache.render(this.template, this);
    },

});

function nullPattern() {}
function px(n) { return n + 'px'; }


CellEditor.abstract = true; // don't instantiate directly


module.exports = CellEditor;
