/* eslint-env browser */

'use strict';

var CellEditor = require('./CellEditor.js');

/**
 * @constructor
 */
var Simple = CellEditor.extend('Simple', {

    /**
     * my main input control
     * @type {Element}
     * @default null
     * @memberOf CellEditor.prototype
     */
    input: null,

    /**
     * @memberOf Simple.prototype
     */
    initialize: function() {
        this.editorPoint = {
            x: 0,
            y: 0
        };
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

    /**
     * @memberOf Simple.prototype
     * @desc  the function to override for initialization
     */
    initializeInput: function(input) {
        var self = this;
        input.addEventListener('keyup', this.keyup.bind(this));
        input.addEventListener('keydown', function(e) {
            self.grid.fireSyntheticEditorKeyDownEvent(self, e);
        });
        input.addEventListener('keypress', function(e) {
            self.grid.fireSyntheticEditorKeyPressEvent(self, e);
        });
        input.onblur = function(e) {
            self.cancelEditing();
        };

        // input.addEventListener('focusout', function() {
        //     self.stopEditing();
        // });
        // input.addEventListener('blur', function() {
        //     self.stopEditing();
        // });

        input.style.position = 'absolute';
        input.style.display = 'none';
        input.style.border = 'solid 2px black';
        input.style.outline = 0;
        input.style.padding = 0;
        input.style.boxShadow = 'white 0px 0px 1px 1px';
    },

    /**
     * @memberOf Simple.prototype
     * @returns {object} the current editor's value
     */
    getEditorValue: function() {
        var value = this.getInput().value;
        return value;
    },

    /**
     * @memberOf Simple.prototype
     * @desc save the new value into the behavior(model)
     */
    setEditorValue: function(value) {
        this.getInput().value = value;
    },

    clearStopEditing: function() {
        this.setEditorValue('');
        this.stopEditing();
    },

    cancelEditing: function() {
        if (!this.isEditing) {
            return;
        }
        this.getInput().value = null;
        this.isEditing = false;
        this.hideEditor();
    },

    /**
     * @memberOf Simple.prototype
     * @desc display the editor
     */
    showEditor: function() {
        this.getInput().style.display = 'inline';
    },

    /**
     * @memberOf Simple.prototype
     * @desc hide the editor
     */
    hideEditor: function() {
        this.getInput().style.display = 'none';
    },

    /**
     * @summary Request focus for my input control.
     * @desc See GRID-95 "Scrollbar moves inward" for issue and work-around explanation.
     * @memberOf Simple.prototype
     */
    takeFocus: function() {
        var self = this;
        setTimeout(function() {
            var transformWas = self.input.style.transform;
            self.input.style.transform = 'translate(0,0)'; // work-around: move to upper left

            self.input.focus();
            self.selectAll();

            self.input.style.transform = transformWas;
        });
    },

    /**
     * @memberOf Simple.prototype
     * @desc select everything
     */
    selectAll: function() {

    },

    /**
     * @memberOf Simple.prototype
     * @desc how much should I offset my bounds from 0,0
     */
    originOffset: function() {
        return [0, 0];
    },

    /**
     * @memberOf Simple.prototype
     * @desc set the bounds of my input control
     * @param {rectangle} rectangle - the bounds to move to
     */
    setBounds: function(cellBounds) {
        var originOffset = this.originOffset();
        var translation = 'translate('
            + (cellBounds.x - 1 + originOffset[0]) + 'px,'
            + (cellBounds.y - 1 + originOffset[1]) + 'px)';

        var input = this.getInput();

        input.style.boxSizing = 'border-box';

        input.style.webkitTransform = translation;
        input.style.MozTransform = translation;
        input.style.msTransform = translation;
        input.style.OTransform = translation;

        // TODO: Obviously this was changed at some point from left,top to trnasform:translation. Wondering why this was necessary...?

        // input.style.left = cellBounds.x + originOffset[0] + 'px';
        // input.style.top = cellBounds.y + originOffset[1] + 'px';

        input.style.width = (cellBounds.width + 2) + 'px';
        input.style.height = (cellBounds.height + 2) + 'px';
        //var xOffset = this.grid.canvas.getBoundingClientRect().left;
    },

    saveEditorValue: function() {
        var point = this.getEditorPoint();
        var value = this.getEditorValue();
        if (value === this.initialValue) {
            return; //data didn't change do nothing
        }
        if (parseFloat(this.initialValue) === this.initialValue) { // I'm a number
            value = parseFloat(value);
        }
        var continued = this.grid.fireBeforeCellEdit(point, this.initialValue, value, this);
        if (!continued) {
            return;
        }
        this.grid.behavior.setValue(point.x, point.y, value);
        this.grid.fireAfterCellEdit(point, this.initialValue, value, this);
    },

    /**
     * @memberOf CellEditor.prototype
     * @desc move the editor to the current editor point
     */
    _moveEditor: function() {
        var editorPoint = this.getEditorPoint();
        var cellBounds = this.grid._getBoundsOfCell(editorPoint.x, editorPoint.y);

        //hack to accommodate bootstrap margin issues...
        var xOffset =
            this.grid.div.getBoundingClientRect().left -
            this.grid.divCanvas.getBoundingClientRect().left;
        cellBounds.x = cellBounds.x - xOffset;

        this.setBounds(cellBounds);
    },

    moveEditor: function() {
        this._moveEditor();
        this.takeFocus();
    },

    beginEditAt: function(point) {

        if (!this.isAdded) {
            this.isAdded = true;
            this.attachEditor();
        }

        this.setEditorPoint(point);
        var value = this.grid.behavior.getValue(point.x, point.y);
        if (value.constructor.name === 'Array') {
            value = value[1]; //it's a nested object
        }
        var proceed = this.grid.fireRequestCellEdit(point, value);
        if (!proceed) {
            //we were cancelled
            return;
        }
        this.initialValue = value;
        this.isEditing = true;
        this.setCheckEditorPositionFlag();
        this.checkEditor();
    },

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
            this.preShowEditorNotification();
            this.attachEditor();
            this.moveEditor();
            this.showEditor();
        } else {
            this.hideEditor();
        }
    },

    attachEditor: function() {
        var input = this.getInput(),
            div = this.grid.div,
            referenceNode = div.querySelectorAll('.finbar-horizontal, .finbar-vertical');

        div.insertBefore(input, referenceNode.length ? referenceNode[0] : null);
    },

    preShowEditorNotification: function() {
        this.setEditorValue(this.initialValue);
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

    showDropdown: function(element) {
        var event;
        event = document.createEvent('MouseEvents');
        event.initMouseEvent('mousedown', true, true, window);
        element.dispatchEvent(event);
    }
});

module.exports = Simple;
