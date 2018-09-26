/* eslint-env browser */

'use strict';

var Base = require('../Base');
var effects = require('../lib/DOM/effects');
var Localization = require('../lib/Localization');

/**
 * @constructor
 * @desc Displays a cell editor and handles cell editor interactions.
 *
 * > This constructor (actually `initialize`) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 *
 * Instances of `CellEditor` are used to render an HTML element on top of the grid exactly within the bound of a cell for purposes of editing the cell value.
 *
 * Extend this base class to implement your own cell editor.
 *
 * @param {Hypergrid} grid
 * @param {object} options - Properties listed below + arbitrary mustache "variables" for merging into template.
 * @param {Point} options.editPoint - Deprecated; use `options.gridCell`.
 * @param {string} [options.format] - Name of a localizer with which to override prototype's `localizer` property.
 */
var CellEditor = Base.extend('CellEditor', {

    initialize: function(grid, options) {
        // Mix in all enumerable properties for mustache use, typically `column` and `format`.
        for (var key in options) {
            this[key] = options[key];
        }

        this.event = options;

        var value = this.event.value;
        if (value instanceof Array) {
            value = value[1]; //it's a nested object
        }

        /**
         * my instance of hypergrid
         * @type {Hypergrid}
         * @memberOf CellEditor.prototype
         */
        this.grid = grid;

        this.grid.cellEditor = this;

        this.locale = grid.localization.locale; // for template's `lang` attribute

        // Only override cell editor's default 'null' localizer if the custom localizer lookup succeeds.
        // Failure is when it returns the default ('string') localizer when 'string' is not what was requested.
        var localizer = this.grid.localization.get(options.format); // try to get named localizer
        if (!(localizer === Localization.prototype.string || options.format === 'string')) {
            this.localizer = localizer;
        }

        this.initialValue = value;

        var container = document.createElement('DIV');
        container.innerHTML = this.grid.modules.templater.render(this.template, this);

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

        var self = this;
        this.el.addEventListener('keyup', this.keyup.bind(this));
        this.el.addEventListener('keydown', function(e) {
            if (e.keyCode === 9) {
                // prevent TAB from leaving input control
                e.preventDefault();
            }
            grid.fireSyntheticEditorKeyDownEvent(self, e);
        });
        this.el.addEventListener('keypress', function(e) {
            grid.fireSyntheticEditorKeyPressEvent(self, e);
        });
        this.el.addEventListener('mousedown', function(e) {
            self.onmousedown(e);
        });
    },

    // If you override this method, be sure to call it as a final step (or call stopPropagation yourself).
    onmousedown: function(event) {
        event.stopPropagation(); // Catch mousedown here before it gets to the document listener defined in Hypergrid().
    },

    localizer: Localization.prototype.null,

    specialKeyups: {
        //0x08: 'clearStopEditing', // backspace
        0x09: 'stopEditing', // tab
        0x0d: 'stopEditing', // return/enter
        0x1b: 'cancelEditing' // escape
    },

    keyup: function(e) {
        var grid = this.grid,
            cellProps = this.event.properties,
            feedbackCount = cellProps.feedbackCount,
            keyChar = grid.canvas.getKeyChar(e),
            specialKeyup,
            stopped;

        // STEP 1: Call the special key handler as needed
        if (
            (specialKeyup = this.specialKeyups[e.keyCode]) &&
            (stopped = this[specialKeyup](feedbackCount))
        ) {
            grid.repaint();
        }

        // STEP 2: If this is a possible "nav key" consumable by CellSelection#handleKeyDown, try to stop editing and send it along
        if (cellProps.mappedNavKey(keyChar, e.ctrlKey)) {
            if (
                !specialKeyup &&
                // We didn't try to stop editing above so try to stop it now
                (stopped = this.stopEditing(feedbackCount))
            ) {
                grid.repaint();
            }

            if (stopped) {
                // Editing successfully stopped
                // -> send the event down the feature chain
                var finEvent = grid.canvas.newEvent(e, 'fin-editor-keydown', {
                    grid: grid,
                    alt: e.altKey,
                    ctrl: e.ctrlKey,
                    char: keyChar,
                    legacyChar: e.legacyKey, // decorated by getKeyChar
                    code: e.charCode,
                    key: e.keyCode,
                    meta: e.metaKey,
                    shift: e.shiftKey,
                    identifier: e.key,
                    editor: this
                });
                grid.delegateKeyDown(finEvent);
            }
        }

        this.grid.fireSyntheticEditorKeyUpEvent(this, e);

        return stopped;
    },

    /**
     * if true, check that the editor is in the right location
     * @type {boolean}
     * @default false
     * @memberOf CellEditor.prototype
     */
    checkEditorPositionFlag: false,

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
        this.checkEditorPositionFlag = true;
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc move the editor to the current editor point
     */
    moveEditor: function() {
        this.setBounds(this.event.bounds);
    },

    beginEditing: function() {
        if (this.grid.fireRequestCellEdit(this.event, this.initialValue)) {
            this.checkEditorPositionFlag = true;
            this.checkEditor();
        }
    },

    /**
     * @summary Put the value into our editor.
     * @desc Formats the value and displays it.
     * The localizer's {@link localizerInterface#format|format} method will be called.
     *
     * Override this method if your editor has additional or alternative GUI elements.
     *
     * @param {object} value - The raw unformatted value from the data source that we want to edit.
     * @memberOf CellEditor.prototype
     */
    setEditorValue: function(value) {
        this.input.value = this.localizer.format(value);
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
     * @param {number} [feedback] What to do on validation failure. One of:
     * * **`undefined`** - Do not show the error effect or the end effect. Just discard the value and close the editor (as if `ESC` had been typed).
     * * **`0`** - Just shows the error effect (see the {@link CellEditor#errorEffect|errorEffect} property).
     * * **`1`** - Shows the error feedback effect followed by the detailed explanation.
     * * `2` or more:
     *   1. Shows the error feedback effect
     *   2. On every `feedback` tries, shows the detailed explanation.
     * * If `undefined` (omitted), simply cancels editing without saving edited value.
     * * If 0, shows the error feedback effect (see the {@link CellEditor#errorEffect|errorEffect} property).
     * * If > 0, shows the error feedback effect _and_ calls the {@link CellEditor#errorEffectEnd|errorEffectEnd} method) every `feedback` call(s) to `stopEditing`.
     * @returns {boolean} Truthy means successful stop. Falsy means syntax error prevented stop. Note that editing is canceled when no feedback requested and successful stop includes (successful) cancel.
     * @memberOf CellEditor.prototype
     */
    stopEditing: function(feedback) {
        var str = this.input.value;

        try {
            var error = this.validateEditorValue(str);
            if (!error) {
                var value = this.getEditorValue(str);
            }
        } catch (err) {
            error = err;
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
        } else if (feedback >= 0) { // false when `feedback` undefined
            this.errorEffectBegin(++this.errors % feedback === 0 && error);
        } else { // invalid but no feedback
            this.cancelEditing();
        }

        return !error;
    },

    /** @summary Cancels editing.
     * @returns {boolean} Successful. (Cancel is always successful.)
     */
    cancelEditing: function() {
        this.setEditorValue(this.initialValue);
        this.hideEditor();
        this.grid.cellEditor = null;
        this.el.remove();
        this.grid.takeFocus();

        return true;
    },

    /**
     * Calls the effect function indicated in the {@link module:defaults.feedbackEffect|feedbackEffect} property, which triggers a series of CSS transitions.
     * @param {boolean|string|Error} [error] - If defined, call the {@link CellEditor#errorEffectEnd|errorEffectEnd} method at the end of the last effect transition with this error.
     * @memberOf CellEditor.prototype
     */
    errorEffectBegin: function(error) {
        if (this.effecting) {
            return;
        }

        var spec = this.grid.properties.feedbackEffect, // spec may e a string or an object with name and options props
            effect = effects[spec.name || spec]; // if spec is a string, spec.name will be undefined

        if (effect) {
            var options = Object.assign({}, spec.options); // if spec is a string, spec.options will be undefined
            options.callback = this.errorEffectEnd.bind(this, error);
            this.effecting = true;
            effect.call(this, options);
        }
    },

    /**
     * This function expects to be passed an error. There is no point in calling this function if there is no error. Nevertheless, if called with a falsy `error`, returns without doing anything.
     * @this {CellEditor}
     * @param {boolean|string|Error} [error]
     */
    errorEffectEnd: function(error, options) {
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
                if (/[\n\r]/.test(error)) {
                    error = '\n' + error;
                    error = error.replace(/[\n\r]+/g, '\n\n   * ');
                }
                msg += '\n\nAdditional information about this error: ' + error;
            }

            setTimeout(function() { // allow animation to complete
                alert(msg); // eslint-disable-line no-alert
            });
        }
        this.effecting = false;
    },

    /**
     * @desc save the new value into the behavior (model)
     * @returns {boolean} Data changed and pre-cell-edit event was not canceled.
     * @memberOf CellEditor.prototype
     */
    saveEditorValue: function(value) {
        var save = (
            !(value && value === this.initialValue) && // data changed
            this.grid.fireBeforeCellEdit(this.event.gridCell, this.initialValue, value, this) // proceed
        );

        if (save) {
            this.event.value = value;
            this.grid.fireAfterCellEdit(this.event.gridCell, this.initialValue, value, this);
        }

        return save;
    },

    /**
     * @summary Extract the edited value from the editor.
     * @desc De-format the edited string back into a primitive value.
     *
     * The localizer's {@link localizerInterface#parse|parse} method will be called on the text box contents.
     *
     * Override this method if your editor has additional or alternative GUI elements. The GUI elements will influence the primitive value, either by altering the edited string before it is parsed, or by transforming the parsed value before returning it.
     * @param {string} str - current editors input string
     * @returns {object} the current editor's value
     * @throws {boolean|string|Error} Throws an error on parse failure. If the error's `message` is defined, the message will eventually be displayed (every `feedbackCount`th attempt).
     * @memberOf CellEditor.prototype
     */
    getEditorValue: function(str) {
        return this.localizer.parse(str || this.input.value);
    },

    /**
     * If there is no validator on the localizer, returns falsy (not invalid; possibly valid).
     * @param {string} str - current editors input string
     * @returns {boolean|string} Truthy value means invalid. If a string, this will be an error message. If not a string, it merely indicates a generic invalid result.
     * @throws {boolean|string|Error} May throw an error on syntax failure as an alternative to returning truthy. Define the error's `message` field as an alternative to returning string.
     * @memberOf CellEditor.prototype
     */
    validateEditorValue: function(str) {
        return this.localizer.invalid && this.localizer.invalid(str || this.input.value);
    },

    /**
     * @summary Request focus for my input control.
     * @desc See GRID-95 "Scrollbar moves inward" for issue and work-around explanation.
     * @memberOf CellEditor.prototype
     */
    takeFocus: function() {
        var el = this.el,
            leftWas = el.style.left,
            topWas = el.style.top;

        el.style.left = el.style.top = 0; // work-around: move to upper left

        var x = window.scrollX, y = window.scrollY;
        this.input.focus();
        window.scrollTo(x, y);
        this.selectAll();

        el.style.left = leftWas;
        el.style.top = topWas;
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
        var style = this.el.style;

        style.left = px(cellBounds.x);
        style.top = px(cellBounds.y);
        style.width = px(cellBounds.width);
        style.height = px(cellBounds.height);
    },

    /**
     * @desc check that the editor is in the correct location, and is showing/hidden appropriately
     * @memberOf CellEditor.prototype
     */
    checkEditor: function() {
        if (this.checkEditorPositionFlag) {
            this.checkEditorPositionFlag = false;
            if (this.event.isCellVisible) {
                this.setEditorValue(this.initialValue);
                this.attachEditor();
                this.moveEditor();
                this.showEditor();
                this.takeFocus();
            } else {
                this.hideEditor();
            }
        }
    },

    attachEditor: function() {
        this.grid.div.appendChild(this.el);
    },

    template: ''

});

function nullPattern() {}
function px(n) { return n + 'px'; }


module.exports = CellEditor;
