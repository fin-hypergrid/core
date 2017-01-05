/* eslint-env browser */

'use strict';

var _ = require('object-iterators');

var Behavior = require('../behaviors/Behavior');

module.exports = {

    /**
     * @summary Add an event listener to me.
     * @param {string} eventName - The type of event we are interested in.
     * @param {function} listener - The event handler.
     * @param {boolean} [internal=false] - Internal listeners can be removed as usual by {@link Hypergrid#removeEventListener|grid.removeEventListener}. However, they are ignored by {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners} (called on {@link Hypergrid#reset|reset}).
     * @memberOf Hypergrid#
     */
    addEventListener: function(eventName, listener, internal) {
        var self = this,
            listeners = this.listeners[eventName] = this.listeners[eventName] || [],
            info = listeners.find(function(info) { return info.listener === listener; });

        if (!info) {
            info = {
                internal: internal,
                listener: listener,
                decorator: function(e) {
                    if (self.allowEventHandlers){
                        listener(e);
                    }
                }
            };
            listeners.push(info);
            this.canvas.addEventListener(eventName, info.decorator);
        }
    },

    removeEventListener: function(eventName, listener) {
        var listenerList = this.listeners[eventName];

        if (listenerList) {
            listenerList.find(function(info, index) {
                if (info.listener === listener) {
                    listenerList.splice(index, 1); // remove it from the list
                    this.canvas.removeEventListener(eventName, info.decorator);
                    return true;
                }
            }, this);
        }
    },

    removeAllEventListeners: function() {
        _(this.listeners).each(function(listenerList, key) {
            listenerList.forEach(function(info) {
                if (!info.internal) {
                    this.removeEventListener(key, info.listener);
                }
            });
        });
    },

    /**
     *
     * @param {string} eventName
     * @param {boolean} [options.cancelable=false]
     * @param {cellEvent} [options.cellEvent]
     * @param {CustomEvent} [options.primitiveEvent]
     * @param {object} [options.detail]
     * @param {boolean} [options.mouseEvent=false]
     * @returns {undefined|CustomEvent}
     * @memberOf Hypergrid#
     * @notes
     *  CustomEvent.detail||cellEvent.primitiveEvent
     */
    dispatchEvent: function(eventName, options) {
        options = options || {};
        var canvasEvent,
            payload = {},
            detail = options.detail || {},
            cancelable = options.cancelable || false,
            cellEvent = options.cellEvent || {},
            primitiveEvent = options.primitiveEvent;

        payload.detail = Object.assign(cellEvent, detail);
        payload.detail.primitiveEvent = payload.detail.primitiveEvent || primitiveEvent;

        if (!payload.detail.grid) {
            payload.detail.grid = this;
        }
        detail = payload.detail;
        detail.time = Date.now();

        if (cancelable) {
            payload.cancelable = true;
        }

        canvasEvent = new CustomEvent(eventName, payload);
        this.canvas.dispatchEvent(canvasEvent);

        if (cancelable) {
            return canvasEvent;
        }
    },

    allowEvents: function(allow){
        if ((this.allowEventHandlers = !!allow)){
            this.behavior.featureChain.attachChain();
        } else {
            this.behavior.featureChain.detachChain();
        }

        this.behavior.changed();
    },

    /**
     * @memberOf Hypergrid#
     * @param {number} c - grid column index.
     * @param {string[]} keys
     */
    fireSyntheticColumnSortEvent: function(c, keys) {
        return this.dispatchEvent('fin-column-sort', {
            detail: {
                column: c,
                keys: keys

            }
        });
    },

    fireSyntheticEditorKeyUpEvent: function(keyEvent, inputControl) {
        return this.dispatchEvent('fin-editor-keyup', {
            detail: {
                input: inputControl,
                keyEvent: keyEvent,
                char: this.canvas.getCharMap()[keyEvent.keyCode][keyEvent.shiftKey ? 1 : 0],
            },
            primitiveEvent: keyEvent
        });
    },
    fireSyntheticEditorKeyDownEvent: function(keyEvent, inputControl, cancelable, additional) {
        var detail = {
                input: inputControl,
                keyEvent: keyEvent,
                char: this.canvas.getCharMap()[keyEvent.keyCode][keyEvent.shiftKey ? 1 : 0]
            };

        if (additional){
            detail = Object.assign(detail, additional);
        }
        return this.dispatchEvent('fin-editor-keydown', {
            detail: detail,
            cancelable: cancelable,
            primitiveEvent: keyEvent
        });
    },

    fireSyntheticEditorKeyPressEvent: function(keyEvent, inputControl) {
        return this.dispatchEvent('fin-editor-keypress', {
            detail: {
                input: inputControl,
                keyEvent: keyEvent,
                char: this.canvas.getCharMap()[keyEvent.keyCode][keyEvent.shiftKey ? 1 : 0],
            },
            primitiveEvent: keyEvent
        });
    },

    fireSyntheticEditorDataChangeEvent: function(keyEvent, inputControl, oldValue, newValue) {
        return this.dispatchEvent('fin-editor-data-change', {
            cancelable: true,
            detail: {
                input: inputControl,
                oldValue: oldValue,
                newValue: newValue,
                keyEvent: keyEvent
            },
            primitiveEvent: keyEvent
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-row-selection-changed` event.
     */
    fireSyntheticRowSelectionChangedEvent: function() {
        return this.dispatchEvent('fin-row-selection-changed', {
            detail: {
                rows: this.getSelectedRows(),
                columns: this.getSelectedColumns(),
                selections: this.selectionModel.getSelections(),
            }
        });
   },

    fireSyntheticSelectionChangedEvent: function() {
        return this.dispatchEvent('fin-selection-changed', {
            detail: {
                rows: this.getSelectedRows(),
                columns: this.getSelectedColumns(),
                selections: this.selectionModel.getSelections(),
            }
        });
    },

    fireSyntheticColumnSelectionChangedEvent: function() {
        return this.dispatchEvent('fin-column-selection-changed', {
            detail: {
                rows: this.getSelectedRows(),
                columns: this.getSelectedColumns(),
                selections: this.selectionModel.getSelections(),
            }
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-context-menu` event
     * @param {keyEvent} primitiveEvent - The canvas event.
     */
    fireSyntheticContextMenuEvent: function(primitiveEvent, detail) {
        detail.rows = this.getSelectedRows();
        detail.columns = this.getSelectedColumns();
        detail.selections = this.selectionModel.getSelections(detail);
        return decorateMouseEvent.call(this, primitiveEvent, detail, function(options) {
            return this.dispatchEvent('fin-context-menu', options);
        });
    },

    fireSyntheticMouseUpEvent: function(primitiveEvent, detail) {
        if (this.properties.readOnly) {
            return;
        }
        this.dragging = false;
        if (this.isScrollingNow()) {
            this.setScrollingNow(false);
        }
        if (this.columnDragAutoScrolling) {
            this.columnDragAutoScrolling = false;
        }

        if (this.mouseDownState) {
            this.fireSyntheticButtonPressedEvent(this.mouseDownState);
            this.mouseDownState = null;
        }

        detail.rows = this.getSelectedRows();
        detail.columns = this.getSelectedColumns();
        detail.selections = this.selectionModel.getSelections();
        return decorateMouseEvent.call(this, primitiveEvent, detail, function(options){
            return this.dispatchEvent('fin-mouseup', options);
        });

    },

    fireSyntheticMouseDownEvent: function(primitiveEvent, detail) {
        if (this.properties.readOnly) {
            return;
        }
        if (!this.abortEditing()) {
            event.stopPropagation();
            return;
        }

        detail.rows = this.getSelectedRows();
        detail.columns = this.getSelectedColumns();
        detail.selections = this.selectionModel.getSelections();
        return decorateMouseEvent.call(this, primitiveEvent, detail, function(options){
            return this.dispatchEvent('fin-mousedown', options);
        });

    },
    fireSyntheticButtonPressedEvent: function(cellEvent) {
        if (this.isViewableButton(cellEvent.dataCell.x, cellEvent.gridCell.y)) {
            return this.dispatchEvent('fin-button-pressed', { cellEvent: cellEvent });
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-column-changed-event` event.
     */
    fireSyntheticOnColumnsChangedEvent: function() {
        return this.dispatchEvent('fin-column-changed-event');
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-keydown` event.
     * @param {keyEvent} primitiveEvent - The canvas event.
     */
    fireSyntheticKeydownEvent: function(primitiveEvent, detail) {
        if (this.properties.readOnly) {
            return;
        }
        return this.dispatchEvent('fin-keydown', { primitiveEvent: primitiveEvent, detail: detail });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-keyup` event.
     * @param {keyEvent} primitiveEvent - The canvas event.
     */
    fireSyntheticKeyupEvent: function(primitiveEvent, detail) {
        if (this.properties.readOnly) {
            return;
        }

        return this.dispatchEvent('fin-keyup', { primitiveEvent: primitiveEvent, detail: detail });
    },

    fireSyntheticFilterAppliedEvent: function() {
        return this.dispatchEvent('fin-filter-applied');
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-enter` event
     * @param {Point} cell - The pixel location of the cell in which the click event occurred.
     * @param {MouseEvent} primitiveEvent - The system mouse event.
     */
    fireSyntheticOnCellEnterEvent: function(cellEvent) {
        return this.dispatchEvent('fin-cell-enter', { cellEvent: cellEvent });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-exit` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticOnCellExitEvent: function(cellEvent) {
        return this.dispatchEvent('fin-cell-exit', { cellEvent: cellEvent });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-click` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} primitiveEvent - The system mouse event.
     */
    fireSyntheticClickEvent: function(primitiveEvent, detail) {
        if (this.properties.readOnly) {
            return;
        }

        return decorateMouseEvent.call(this, primitiveEvent, detail, function(options){
            return this.dispatchEvent('fin-click', options);
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-double-click` event.
     * @param {MouseEvent} primitiveEvent - The system mouse event.
     */
    fireSyntheticDoubleClickEvent: function(primitiveEvent, detail) {
        if (this.properties.readOnly) {
            return;
        }

        if (!this.abortEditing()) { return; }

        if (this.behavior.cellDoubleClicked !== Behavior.prototype.cellDoubleClicked) {
            this.deprecated('fin-double-click', 'behavior.cellDoubleClicked(gridCell, cellEvent) has been deprecated as of v1.2.6 in favor of handling in a \'fin-double-click\' event (event.detail.gridCell, event.primitiveEvent) and will be removed in a future release.');
        }
        return decorateMouseEvent.call(this, primitiveEvent, detail, function(options){
            return this.dispatchEvent('fin-dblclick', options);
        });

    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a rendered event.
     */
    fireSyntheticGridRenderedEvent: function() {
       return this.dispatchEvent('fin-grid-rendered');
    },

    fireSyntheticGridFocusEvent: function(primitiveEvent) {
        return this.dispatchEvent('fin-focus', { primitiveEvent: primitiveEvent });
    },

    fireSyntheticGridBlurEvent: function(primitiveEvent) {
        return this.dispatchEvent('fin-blur', { primitiveEvent: primitiveEvent });
    },

    fireSyntheticGridResizedEvent: function(primitiveEvent, detail) {
        return this.dispatchEvent('fin-grid-resized', { primitiveEvent: primitiveEvent, detail: detail });
    },

    fireSyntheticDragStartEvent: function(primitiveEvent, detail) {
        return this.dispatchEvent('fin-dragstart', { primitiveEvent: primitiveEvent, detail: detail });
    },

    fireSyntheticDragEndEvent: function(primitiveEvent, detail) {
        return this.dispatchEvent('fin-dragsend', { primitiveEvent: primitiveEvent, detail: detail });
    },

    fireSyntheticTickEvent: function() {
        return this.dispatchEvent('fin-tick');
    },

    fireSyntheticMouseMoveEvent: function(primitiveEvent, detail) {
        if (this.properties.readOnly) {
            return;
        }

        return decorateMouseEvent.call(this, primitiveEvent, detail, function(options){
            return this.dispatchEvent('fin-mousemove', options);
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a scroll event.
     * @param {string} type - Should be either `fin-scroll-x` or `fin-scroll-y`.
     * @param {number} oldValue - The old scroll value.
     * @param {number} newValue - The new scroll value.
     */
    fireScrollEvent: function(eventName, oldValue, newValue) {
        return this.dispatchEvent(eventName, {
            detail : {
                oldValue: oldValue,
                value: newValue
            }
        });
    },

    fireSyntheticWheelMovedEvent: function(primitiveEvent, detail) {
        if (this.properties.readOnly) {
            return;
        }

        return decorateMouseEvent.call(this, primitiveEvent, detail, function(options){
            return this.dispatchEvent('fin-wheelmoved', options);
        });

    },

    fireRequestCellEdit: function(cellEvent, value) {
        return this.dispatchEvent('fin-request-cell-edit', { cancelable: true, detail: { value: value }, cellEvent: cellEvent });
    },


    fireSyntheticMouseDrag: function(primitiveEvent, detail) {
        if (this.properties.readOnly) {
            return;
        }

        return decorateMouseEvent.call(this, primitiveEvent, detail, function(options){
            this.dragging = true;
            return this.dispatchEvent('fin-mousedrag', options);

        });
    },

    fireSyntheticMouseOut: function(primitiveEvent, detail) {
        if (this.properties.readOnly) {
            return;
        }

        return decorateMouseEvent.call(this, primitiveEvent, detail, function(options){
            return this.dispatchEvent('fin-mouseout', options);

        });
    },


    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-before-cell-edit event.
     * @param {Point} cell - The x,y coordinates.
     * @param {Object} value - The current value.
     * @returns {boolean} Proceed (don't cancel).
     */
    fireBeforeCellEdit: function(cellEvent, oldValue, newValue, control) {
        return this.dispatchEvent('fin-before-cell-edit', true, {
            detail: {
                oldValue: oldValue,
                newValue: newValue,
                input: control
            },
            cellEvent: cellEvent
        });
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Renderer} sub-component
     * @param {Point} cell - The x,y coordinates.
     * @param {Object} oldValue - The old value.
     * @param {Object} newValue - The new value.
     */
    fireAfterCellEdit: function(cellEvent, oldValue, newValue, control) {
        return this.dispatchEvent('fin-after-cell-edit', {
            detail: {
                oldValue: oldValue,
                newValue: newValue,
                input: control
            },
            cellEvent: cellEvent
        });
    },

    delegateCanvasEvents: function() {
        var self = this;


        this.addEventListener('fin-grid-resized', function(e) {
            self.resized();
        });

        this.addEventListener('fin-mousemove', function(e) {
            self.delegateMouseMove(e);

        });

        this.addEventListener('fin-mousedown', function(e) {
            e.keys = e.detail.keys;
            self.mouseDownState = e.detail.cellEvent;
            self.delegateMouseDown(e);
            self.repaint();
        });

        this.addEventListener('fin-click', function(e) {
            e.keys = e.detail.keys; // todo: this was in fin-tap but wasn't here
            self.delegateClick(e);
        });

        this.addEventListener('fin-mouseup', function(e) {
            self.delegateMouseUp(e);
        });

        this.addEventListener('fin-dblclick', function(e) {
            self.delegateDoubleClick(e);
        });

        this.addEventListener('fin-mousedrag', function(e) {
             self.delegateMouseDrag(e);
        });

        this.addEventListener('fin-keydown', function(e) {
            self.delegateKeyDown(e);
        });

        this.addEventListener('fin-keyup', function(e) {
            self.delegateKeyUp(e);
        });

        this.addEventListener('fin-wheelmoved', function(e) {
            self.delegateWheelMoved(e);
        });

        this.addEventListener('fin-mouseout', function(e) {
            self.delegateMouseExit(e);
        });

        this.addEventListener('fin-context-menu', function(e) {
            self.delegateContextMenu(e);
        });

        //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
        document.body.addEventListener('copy', function(e) {
            self.checkClipboardCopy(e);
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate the wheel moved event to the behavior.
     * @param {Event} event - The pertinent event.
     */
    delegateWheelMoved: function(event) {
        this.behavior.onWheelMoved(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate MouseExit to the behavior (model).
     * @param {Event} event - The pertinent event.
     */
    delegateMouseExit: function(event) {
        this.behavior.handleMouseExit(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate MouseExit to the behavior (model).
     * @param {Event} event - The pertinent event.
     */
    delegateContextMenu: function(event) {
        this.behavior.onContextMenu(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate MouseMove to the behavior (model).
     * @param event - The pertinent event.
     */
    delegateMouseMove: function(event) {
        this.behavior.onMouseMove(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate mousedown to the behavior (model).
     * @param event - The pertinent event.
     */
    delegateMouseDown: function(event) {
        this.behavior.handleMouseDown(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate mouseup to the behavior (model).
     * @param event - The pertinent event.
     */
    delegateMouseUp: function(event) {
        this.behavior.onMouseUp(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate click to the behavior (model).
     * @param event - The pertinent event.
     */
    delegateClick: function(event) {
        this.behavior.onClick(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate mouseDrag to the behavior (model).
     * @param event - The pertinent event.
     */
    delegateMouseDrag: function(event) {
        this.behavior.onMouseDrag(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc We've been doubleclicked on. Delegate through the behavior (model).
     * @param event - The pertinent event.
     */
    delegateDoubleClick: function(event) {
        this.behavior.onDoubleClick(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Generate a function name and call it on self.
     * @desc This should also be delegated through Behavior keeping the default implementation here though.
     * @param {event} event - The pertinent event.
     */
    delegateKeyDown: function(event) {
        this.behavior.onKeyDown(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Generate a function name and call it on self.
     * @desc This should also be delegated through Behavior keeping the default implementation here though.
     * @param {event} event - The pertinent event.
     */
    delegateKeyUp: function(event) {
        this.behavior.onKeyUp(this, event);
    },
};

/**
 *
 * @param {object} primitiveEvent
 * @param {object} detail
 * @param {function} dispatcher
 * @returns {undefined|CustomEvent}
 */
function decorateMouseEvent(primitiveEvent, detail, dispatcher) {
    var result = this.getGridCellFromMousePoint(detail.mouse);

    // No events on the whitespace of the grid unless they're drag events
    if (!result.fake || detail.dragstart) {
        return dispatcher.call(this, {cellEvent: result.point, primitiveEvent: primitiveEvent, detail: detail});
    }
}


