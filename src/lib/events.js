/* eslint-env browser */

'use strict';

var _ = require('object-iterators');

var Behavior = require('../behaviors/Behavior');

module.exports = {

    /**
     * @summary Add an event listener to me.
     * @desc Listeners added by this method should only be removed by {@link Hypergrid#removeEventListener|grid.removeEventListener} (or {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners}).
     * @param {string} eventName - The type of event we are interested in.
     * @param {function} listener - The event handler.
     * @param {boolean} [internal=false] - Used by {@link Hypergrid#addInternalEventListener|grid.addInternalEventListener} (see).
     * @memberOf Hypergrid#
     */
    addEventListener: function(eventName, listener, internal) {
        var self = this,
            listeners = this.listeners[eventName] = this.listeners[eventName] || [],
            alreadyAttached = listeners.find(function(info) { return info.listener === listener; });

        if (!alreadyAttached) {
            var info = {
                internal: internal,
                listener: listener,
                decorator: function(e) {
                    if (self.allowEventHandlers) {
                        listener(e);
                    }
                }
            };
            listeners.push(info);
            this.canvas.addEventListener(eventName, info.decorator);
        }
    },

    /**
     * @summary Add an internal event listener to me.
     * @desc The new listener is flagged as "internal." Internal listeners are removed as usual by {@link Hypergrid#removeEventListener|grid.removeEventListener}. However, they are ignored by {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners()} (as called by {@link Hypergrid#reset|reset}). (But see {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners(true)}.)
     *
     * Listeners added by this method should only be removed by {@link Hypergrid#removeEventListener|grid.removeEventListener} (or {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners(true)}).
     * @param {string} eventName - The type of event we are interested in.
     * @param {function} listener - The event handler.
     * @memberOf Hypergrid#
     */
    addInternalEventListener: function(eventName, listener) {
        this.addEventListener(eventName, listener, true);
    },

    /**
     * @summary Remove an event listeners.
     * @desc Removes the event listener with matching name and function that was added by {@link Hypergrid#addEventListener|grid.addEventListener}.
     *
     * NOTE: This method cannot remove event listeners added by other means.
     * @memberOf Hypergrid#
     */
    removeEventListener: function(eventName, listener) {
        var listenerList = this.listeners[eventName];

        if (listenerList) {
            listenerList.find(function(info, index) {
                if (info.listener === listener) {
                    if (listenerList.length === 1) {
                        delete this.listeners[eventName];
                    } else {
                        listenerList.splice(index, 1); // remove it from the list
                    }
                    this.canvas.removeEventListener(eventName, info.decorator);
                    return true;
                }
            }, this);
        }
    },

    /**
     * @summary Remove all event listeners.
     * @desc Removes all event listeners added with {@link Hypergrid#addEventListener|grid.addEventListener} except those added as "internal."
     * @param {boolean} [internal=false] - Include internal listeners.
     * @memberOf Hypergrid#
     */
    removeAllEventListeners: function(internal) {
        _(this.listeners).each(function(listenerList, key) {
            listenerList.slice().forEach(function(info) {
                if (internal || !info.internal) {
                    this.removeEventListener(key, info.listener);
                }
            }, this);
        }, this);
    },

    allowEvents: function(allow){
        this.allowEventHandlers = !!allow;

        if (this.behavior.featureChain) {
            if (allow){
                this.behavior.featureChain.attachChain();
            } else {
                this.behavior.featureChain.detachChain();
            }
        }

        this.behavior.changed();
    },

    /**
     * @memberOf Hypergrid#
     * @param {number} c - grid column index.
     * @param {string[]} keys
     */
    fireSyntheticColumnSortEvent: function(c, keys) {
        return dispatchEvent.call(this, 'fin-column-sort', {
            column: c,
            keys: keys
        });
    },

    fireSyntheticEditorKeyUpEvent: function(inputControl, keyEvent) {
        return dispatchEvent.call(this, 'fin-editor-keyup', {
            input: inputControl,
            keyEvent: keyEvent,
            char: this.canvas.getKeyChar(keyEvent),
            legacyChar: keyEvent.legacyKey // decorated by getKeyChar
        });
    },

    fireSyntheticEditorKeyDownEvent: function(inputControl, keyEvent) {
        return dispatchEvent.call(this, 'fin-editor-keydown', {
            input: inputControl,
            keyEvent: keyEvent,
            char: this.canvas.getKeyChar(keyEvent),
            legacyChar: keyEvent.legacyKey // decorated by getKeyChar
        });
    },

    fireSyntheticEditorKeyPressEvent: function(inputControl, keyEvent) {
        return dispatchEvent.call(this, 'fin-editor-keypress', {
            input: inputControl,
            keyEvent: keyEvent,
            char: this.canvas.getKeyChar(keyEvent),
            legacyChar: keyEvent.legacyKey // decorated by getKeyChar
        });
    },

    fireSyntheticEditorDataChangeEvent: function(inputControl, oldValue, newValue) {
        return dispatchEvent.call(this, 'fin-editor-data-change', true, {
            input: inputControl,
            oldValue: oldValue,
            newValue: newValue
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-row-selection-changed` event.
     */
    fireSyntheticRowSelectionChangedEvent: function() {
        return dispatchEvent.call(this, 'fin-row-selection-changed', this.selectionDetailGetters);
    },

    fireSyntheticColumnSelectionChangedEvent: function() {
        return dispatchEvent.call(this, 'fin-column-selection-changed', this.selectionDetailGetters);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-context-menu` event
     * @param {keyEvent} event - The canvas event.
     */
    fireSyntheticContextMenuEvent: function(event) {
        Object.defineProperties(event, this.selectionDetailGetterDescriptors);
        return dispatchEvent.call(this, 'fin-context-menu', {}, event);
    },

    fireSyntheticMouseUpEvent: function(event) {
        Object.defineProperties(event, this.selectionDetailGetterDescriptors);
        return dispatchEvent.call(this, 'fin-mouseup', {}, event);
    },

    fireSyntheticMouseDownEvent: function(event) {
        Object.defineProperties(event, this.selectionDetailGetterDescriptors);
        return dispatchEvent.call(this, 'fin-mousedown', {}, event);
    },

    fireSyntheticMouseMoveEvent: function(event) {
        return dispatchEvent.call(this, 'fin-mousemove', {}, event);
    },

    fireSyntheticButtonPressedEvent: function(event) {
        if (event.properties.renderer === 'button') {
            return dispatchEvent.call(this, 'fin-button-pressed', {}, event);
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-column-drag-start` event.
     */
    fireSyntheticOnColumnsChangedEvent: function() {
        return dispatchEvent.call(this, 'fin-column-changed-event', {});
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-keydown` event.
     * @param {keyEvent} event - The canvas event.
     */
    fireSyntheticKeydownEvent: function(keyEvent) {
        return dispatchEvent.call(this, 'fin-keydown', keyEvent.detail);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-keyup` event.
     * @param {keyEvent} event - The canvas event.
     */
    fireSyntheticKeyupEvent: function(keyEvent) {
        return dispatchEvent.call(this, 'fin-keyup', keyEvent.detail);
    },

    fireSyntheticFilterAppliedEvent: function() {
        return dispatchEvent.call(this, 'fin-filter-applied', {});
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-enter` event
     * @param {Point} cell - The pixel location of the cell in which the click event occurred.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticOnCellEnterEvent: function(cellEvent) {
        return dispatchEvent.call(this, 'fin-cell-enter', cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-exit` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticOnCellExitEvent: function(cellEvent) {
        return dispatchEvent.call(this, 'fin-cell-exit', cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-click` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticClickEvent: function(cellEvent) {
        return dispatchEvent.call(this, 'fin-click', {}, cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-double-click` event.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticDoubleClickEvent: function(cellEvent) {
        if (!this.abortEditing()) { return; }

        if (this.behavior.cellDoubleClicked !== Behavior.prototype.cellDoubleClicked) {
            this.deprecated('fin-double-click', 'behavior.cellDoubleClicked(gridCell, cellEvent) has been deprecated as of v1.2.6 in favor of handling in a \'fin-double-click\' event (event.detail.gridCell, event.primitiveEvent) and will be removed in a future release.');
        }
        // to deprecate, remove above warning + following line + abstract implementation in Behavior.js
        this.behavior.cellDoubleClicked(cellEvent.gridCell, cellEvent);

        return dispatchEvent.call(this, 'fin-double-click', {}, cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a rendered event.
     */
    fireSyntheticGridRenderedEvent: function() {
       return dispatchEvent.call(this, 'fin-grid-rendered', { source: this });
    },

    fireSyntheticTickEvent: function() {
        return dispatchEvent.call(this, 'fin-tick', { source: this });
    },

    fireSyntheticGridResizedEvent: function(e) {
        return dispatchEvent.call(this, 'fin-grid-resized', e);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a scroll event.
     * @param {string} type - Should be either `fin-scroll-x` or `fin-scroll-y`.
     * @param {number} oldValue - The old scroll value.
     * @param {number} newValue - The new scroll value.
     */
    fireScrollEvent: function(eventName, oldValue, newValue) {
        return dispatchEvent.call(this, eventName, {
            oldValue: oldValue,
            value: newValue
        });
    },

    fireRequestCellEdit: function(cellEvent, value) {
        return dispatchEvent.call(this, 'fin-request-cell-edit', true, { value: value }, cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-before-cell-edit event.
     * @param {Point} cell - The x,y coordinates.
     * @param {Object} value - The current value.
     * @returns {boolean} Proceed (don't cancel).
     */
    fireBeforeCellEdit: function(cellEvent, oldValue, newValue, control) {
        return dispatchEvent.call(this, 'fin-before-cell-edit', true, {
            oldValue: oldValue,
            newValue: newValue,
            input: control
        }, cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Renderer} sub-component
     * @param {Point} cell - The x,y coordinates.
     * @param {Object} oldValue - The old value.
     * @param {Object} newValue - The new value.
     */
    fireAfterCellEdit: function(cellEvent, oldValue, newValue, control) {
        return dispatchEvent.call(this, 'fin-after-cell-edit', {
            newValue: newValue,
            oldValue: oldValue,
            input: control
        }, cellEvent);
    },

    delegateCanvasEvents: function() {
        var self = this;

        function handleMouseEvent(e, cb) {
            if (self.getLogicalRowCount() === 0) {
                return;
            }

            var c = self.getGridCellFromMousePoint(e.detail.mouse),
                primitiveEvent,
                decoratedEvent;

            // No events on the whitespace of the grid unless they're drag events
            if (!c.fake || e.detail.dragstart) {
                primitiveEvent = c.cellEvent;
            }

            if (primitiveEvent) {
                decoratedEvent = Object.defineProperty(
                    primitiveEvent,
                    'primitiveEvent',
                    {
                        value: e,
                        enumerable: false,
                        configurable: true,
                        writable: true
                    }
                );
                cb.call(self, decoratedEvent);
            }
        }

        this.addInternalEventListener('fin-canvas-resized', function(e) {
            self.resized();
            self.fireSyntheticGridResizedEvent(e);
        });

        this.addInternalEventListener('fin-canvas-mousemove', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, function(mouseEvent) {
                this.delegateMouseMove(mouseEvent);
                this.fireSyntheticMouseMoveEvent(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-mousedown', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            if (!self.abortEditing()) {
                event.stopPropagation();
                return;
            }

            handleMouseEvent(e, function(mouseEvent) {
                mouseEvent.keys = e.detail.keys;
                this.mouseDownState = mouseEvent;
                this.delegateMouseDown(mouseEvent);
                this.fireSyntheticMouseDownEvent(mouseEvent);
                this.repaint();
            });
        });

        this.addInternalEventListener('fin-canvas-click', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, function(mouseEvent) {
                mouseEvent.keys = e.detail.keys; // todo: this was in fin-tap but wasn't here
                this.fireSyntheticClickEvent(mouseEvent);
                this.delegateClick(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-mouseup', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            self.dragging = false;
            if (self.isScrollingNow()) {
                self.setScrollingNow(false);
            }
            if (self.columnDragAutoScrolling) {
                self.columnDragAutoScrolling = false;
            }
            handleMouseEvent(e, function(mouseEvent) {
                this.delegateMouseUp(mouseEvent);
                if (self.mouseDownState) {
                    self.fireSyntheticButtonPressedEvent(self.mouseDownState);
                }
                this.mouseDownState = null;
                this.fireSyntheticMouseUpEvent(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-dblclick', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, function(mouseEvent) {
                this.fireSyntheticDoubleClickEvent(mouseEvent, e);
                this.delegateDoubleClick(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-drag', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            self.dragging = true;
            handleMouseEvent(e, self.delegateMouseDrag);
        });

        this.addInternalEventListener('fin-canvas-keydown', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            self.fireSyntheticKeydownEvent(e);
            self.delegateKeyDown(e);
        });

        this.addInternalEventListener('fin-canvas-keyup', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            self.fireSyntheticKeyupEvent(e);
            self.delegateKeyUp(e);
        });

        this.addInternalEventListener('fin-canvas-wheelmoved', function(e) {
            handleMouseEvent(e, self.delegateWheelMoved);
        });

        this.addInternalEventListener('fin-canvas-mouseout', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, self.delegateMouseExit);
        });

        this.addInternalEventListener('fin-canvas-context-menu', function(e) {
            handleMouseEvent(e, function(mouseEvent){
                self.delegateContextMenu(mouseEvent);
                self.fireSyntheticContextMenuEvent(mouseEvent);
            });
        });

        //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
        document.body.addEventListener('copy', function(evt) {
            self.checkClipboardCopy(evt);
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
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseMove: function(mouseDetails) {
        this.behavior.onMouseMove(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate mousedown to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseDown: function(mouseDetails) {
        this.behavior.handleMouseDown(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate mouseup to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseUp: function(mouseDetails) {
        this.behavior.onMouseUp(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate click to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateClick: function(mouseDetails) {
        this.behavior.onClick(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate mouseDrag to the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateMouseDrag: function(mouseDetails) {
        this.behavior.onMouseDrag(this, mouseDetails);
    },

    /**
     * @memberOf Hypergrid#
     * @desc We've been doubleclicked on. Delegate through the behavior (model).
     * @param {mouseDetails} mouseDetails - An enriched mouse event from fin-canvas.
     */
    delegateDoubleClick: function(mouseDetails) {
        this.behavior.onDoubleClick(this, mouseDetails);
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

var details = [
    'gridCell',
    'dataCell',
    'mousePoint',
    'keys',
    'row'
];

/**
 *
 * @param {string} eventName
 * @param {boolean} [cancelable=false]
 * @param {object} event
 * @param {CellEvent|MouseEvent|KeyboardEvent|object} [primitiveEvent]
 * @returns {undefined|boolean}
 */
function dispatchEvent(eventName, cancelable, event, primitiveEvent) {
    var detail, result;

    if (typeof cancelable !== 'boolean') {
        primitiveEvent = event; // propmote primitiveEvent to 3rd position
        event = cancelable; // promote event to 2nd position
        cancelable = false; // default when omitted
    }

    if (!event.detail) {
        event = { detail: event };
    }

    detail = event.detail;

    if (!detail.grid) { // CellEvent objects already have a (read-only) `grid` prop
        detail.grid = this;
    }

    detail.time = Date.now();

    if (primitiveEvent) {
        if (!detail.primitiveEvent) {
            detail.primitiveEvent = primitiveEvent;
        }
        details.forEach(function(key) {
            if (key in primitiveEvent && !(key in detail)) {
                detail[key] = primitiveEvent[key];
            }
        });
        if ('dataRow' in primitiveEvent) {
            // reference (without invoking) cellEvent's `dataRow` getter when available
            Object.defineProperty(detail, 'row', { get: function() { return primitiveEvent.dataRow; } });
        }
    }

    if (cancelable) {
        event.cancelable = true;
    }

    result = this.canvas.dispatchEvent(new CustomEvent(eventName, event));

    if (cancelable) {
        return result;
    }
}
