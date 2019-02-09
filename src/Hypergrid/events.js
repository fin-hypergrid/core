/* eslint-env browser */

'use strict';

var dispatchGridEvent = require('../lib/dispatchGridEvent');
var Button = require('../cellRenderers/Button');

/**
 * @summary Grid event support.
 * @desc Additions to `Hypergrid.prototype` for handling and firing events.
 *
 * All members are documented on the {@link Hypergrid} page.
 * @mixin events.mixin
 */
exports.mixin = {

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
        Object.keys(this.listeners).forEach(function(key) {
            this.listeners[key].slice().forEach(function(info) {
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
     * @desc Synthesize and fire a `fin-column-sort` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticColumnSortEvent: function(c, keys) {
        return dispatchGridEvent.call(this, 'fin-column-sort', {
            column: c,
            keys: keys
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-editor-keyup` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorKeyUpEvent: function(inputControl, keyEvent) {
        return dispatchGridEvent.call(this, 'fin-editor-keyup', {
            input: inputControl,
            keyEvent: keyEvent,
            char: this.canvas.getKeyChar(keyEvent),
            legacyChar: keyEvent.legacyKey // decorated by getKeyChar
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-editor-keydown` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorKeyDownEvent: function(inputControl, keyEvent) {
        return dispatchGridEvent.call(this, 'fin-editor-keydown', {
            input: inputControl,
            keyEvent: keyEvent,
            char: this.canvas.getKeyChar(keyEvent),
            legacyChar: keyEvent.legacyKey // decorated by getKeyChar
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-editor-keypress` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorKeyPressEvent: function(inputControl, keyEvent) {
        return dispatchGridEvent.call(this, 'fin-editor-keypress', {
            input: inputControl,
            keyEvent: keyEvent,
            char: this.canvas.getKeyChar(keyEvent),
            legacyChar: keyEvent.legacyKey // decorated by getKeyChar
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-editor-data-change` event.
     *
     * This event is cancelable.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorDataChangeEvent: function(inputControl, oldValue, newValue) {
        return dispatchGridEvent.call(this, 'fin-editor-data-change', true, {
            input: inputControl,
            oldValue: oldValue,
            newValue: newValue
        });
    },

    fireSyntheticRowHeaderClickedEvent: function(event) {
        return dispatchGridEvent.call(this, 'fin-row-header-clicked', true, {}, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-row-selection-changed` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticRowSelectionChangedEvent: function() {
        return dispatchGridEvent.call(this, 'fin-row-selection-changed', this.selectionDetailGetters);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-column-selection-changed` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticColumnSelectionChangedEvent: function() {
        return dispatchGridEvent.call(this, 'fin-column-selection-changed', this.selectionDetailGetters);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-context-menu` event
     * @param {keyEvent} event - The canvas event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticContextMenuEvent: function(event) {
        Object.defineProperties(event, this.selectionDetailGetterDescriptors);
        return dispatchGridEvent.call(this, 'fin-context-menu', {}, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-mouseup` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticMouseUpEvent: function(event) {
        Object.defineProperties(event, this.selectionDetailGetterDescriptors);
        return dispatchGridEvent.call(this, 'fin-mouseup', {}, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-mousedown` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticMouseDownEvent: function(event) {
        Object.defineProperties(event, this.selectionDetailGetterDescriptors);
        return dispatchGridEvent.call(this, 'fin-mousedown', {}, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-mousemove` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticMouseMoveEvent: function(event) {
        return dispatchGridEvent.call(this, 'fin-mousemove', {}, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-button-pressed` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticButtonPressedEvent: function(event) {
        if (event.cellRenderer instanceof Button) { // Button or subclass thereof?
            if (event.value && event.value.subrows) {
                var y = event.primitiveEvent.detail.mouse.y - event.bounds.y,
                    subheight = event.bounds.height / event.value.subrows;
                event.subrow = Math.floor(y / subheight);
            }
            return dispatchGridEvent.call(this, 'fin-button-pressed', {}, event);
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-column-drag-start` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticOnColumnsChangedEvent: function() {
        return dispatchGridEvent.call(this, 'fin-column-changed-event', {});
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-keydown` event.
     * @param {keyEvent} event - The canvas event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticKeydownEvent: function(keyEvent) {
        return dispatchGridEvent.call(this, 'fin-keydown', keyEvent.detail);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-keyup` event.
     * @param {keyEvent} event - The canvas event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticKeyupEvent: function(keyEvent) {
        return dispatchGridEvent.call(this, 'fin-keyup', keyEvent.detail);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-filter-applied event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticFilterAppliedEvent: function() {
        return dispatchGridEvent.call(this, 'fin-filter-applied', {});
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-enter` event
     * @param {Point} cell - The pixel location of the cell in which the click event occurred.
     * @param {MouseEvent} event - The system mouse event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticOnCellEnterEvent: function(cellEvent) {
        return dispatchGridEvent.call(this, 'fin-cell-enter', cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-exit` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} event - The system mouse event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticOnCellExitEvent: function(cellEvent) {
        return dispatchGridEvent.call(this, 'fin-cell-exit', cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-click` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} event - The system mouse event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticClickEvent: function(cellEvent) {
        return dispatchGridEvent.call(this, 'fin-click', {}, cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-double-click` event.
     * @param {MouseEvent} event - The system mouse event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticDoubleClickEvent: function(cellEvent) {
        if (!this.abortEditing()) { return; }

        return dispatchGridEvent.call(this, 'fin-double-click', {}, cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-grid-rendered event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticGridRenderedEvent: function() {
       return dispatchGridEvent.call(this, 'fin-grid-rendered', { source: this });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-tick event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTickEvent: function() {
        return dispatchGridEvent.call(this, 'fin-tick', { source: this });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-grid-resized event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticGridResizedEvent: function(e) {
        return dispatchGridEvent.call(this, 'fin-grid-resized', e);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-touchstart` event.
     * @param {CustomEvent} e - The canvas event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTouchStartEvent: function(e) {
        return dispatchGridEvent.call(this, 'fin-touchstart', e);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-touchmove` event.
     * @param {CustomEvent} e - The canvas event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTouchMoveEvent: function(e) {
        return dispatchGridEvent.call(this, 'fin-touchmove', e);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-touchend` event.
     * @param {CustomEvent} e - The canvas event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTouchEndEvent: function(e) {
        return dispatchGridEvent.call(this, 'fin-touchend', e);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a scroll event.
     * @param {string} type - Should be either `fin-scroll-x` or `fin-scroll-y`.
     * @param {number} oldValue - The old scroll value.
     * @param {number} newValue - The new scroll value.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireScrollEvent: function(eventName, oldValue, newValue) {
        return dispatchGridEvent.call(this, eventName, {
            oldValue: oldValue,
            value: newValue
        });
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-request-cell-edit event.
     *
     * This event is cancelable.
     * @param {CellEvent} cellEvent
     * @param {*} value
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireRequestCellEdit: function(cellEvent, value) {
        return dispatchGridEvent.call(this, 'fin-request-cell-edit', true, { value: value }, cellEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-before-cell-edit event.
     *
     * This event is cancelable.
     * @param {Point} cell - The x,y coordinates.
     * @param {Object} value - The current value.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireBeforeCellEdit: function(cellEvent, oldValue, newValue, control) {
        return dispatchGridEvent.call(this, 'fin-before-cell-edit', true, {
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
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireAfterCellEdit: function(cellEvent, oldValue, newValue, control) {
        return dispatchGridEvent.call(this, 'fin-after-cell-edit', {
            newValue: newValue,
            oldValue: oldValue,
            input: control
        }, cellEvent);
    },

    delegateCanvasEvents: function() {
        var grid = this;

        function handleMouseEvent(e, cb) {
            if (grid.getLogicalRowCount() === 0) {
                return;
            }

            var c = grid.getGridCellFromMousePoint(e.detail.mouse),
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

                // add some interesting mouse offsets
                var drilldown;
                if ((drilldown = primitiveEvent.primitiveEvent && primitiveEvent.primitiveEvent.detail)) {
                    decoratedEvent.gridPoint = drilldown.mouse;
                    if ((drilldown = drilldown.primitiveEvent)) {
                        decoratedEvent.clientPoint = {
                            x: drilldown.clientX,
                            y: drilldown.clientY
                        };
                        decoratedEvent.pagePoint = {
                            x: drilldown.clientX + window.scrollX,
                            y: drilldown.clientY + window.scrollY
                        };
                    }
                }

                cb.call(grid, decoratedEvent);
            }
        }

        this.addInternalEventListener('fin-canvas-resized', function(e) {
            grid.resized();
            grid.fireSyntheticGridResizedEvent(e);
        });

        this.addInternalEventListener('fin-canvas-mousemove', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, function(mouseEvent) {
                this.delegateMouseMove(mouseEvent);
                this.fireSyntheticMouseMoveEvent(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-mousedown', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            if (!grid.abortEditing()) {
                e.stopPropagation();
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
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, function(mouseEvent) {
                var isMouseDownCell = this.mouseDownState && this.mouseDownState.gridCell.equals(mouseEvent.gridCell);
                if (isMouseDownCell && mouseEvent.mousePointInClickRect) {
                    mouseEvent.keys = e.detail.keys; // todo: this was in fin-tap but wasn't here
                    if (this.mouseDownState) {
                        this.fireSyntheticButtonPressedEvent(this.mouseDownState);
                    }
                    this.fireSyntheticClickEvent(mouseEvent);
                    this.delegateClick(mouseEvent);
                }
                this.mouseDownState = null;
            });
        });

        this.addInternalEventListener('fin-canvas-mouseup', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            grid.dragging = false;
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
            if (grid.columnDragAutoScrolling) {
                grid.columnDragAutoScrolling = false;
            }
            handleMouseEvent(e, function(mouseEvent) {
                this.delegateMouseUp(mouseEvent);
                this.fireSyntheticMouseUpEvent(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-dblclick', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, function(mouseEvent) {
                this.fireSyntheticDoubleClickEvent(mouseEvent, e);
                this.delegateDoubleClick(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-drag', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            grid.dragging = true;
            handleMouseEvent(e, grid.delegateMouseDrag);
        });

        this.addInternalEventListener('fin-canvas-keydown', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            grid.fireSyntheticKeydownEvent(e);
            grid.delegateKeyDown(e);
        });

        this.addInternalEventListener('fin-canvas-keyup', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            grid.fireSyntheticKeyupEvent(e);
            grid.delegateKeyUp(e);
        });

        this.addInternalEventListener('fin-canvas-wheelmoved', function(e) {
            handleMouseEvent(e, grid.delegateWheelMoved);
        });

        this.addInternalEventListener('fin-canvas-mouseout', function(e) {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e, grid.delegateMouseExit);
        });

        this.addInternalEventListener('fin-canvas-context-menu', function(e) {
            handleMouseEvent(e, function(mouseEvent) {
                grid.delegateContextMenu(mouseEvent);
                grid.fireSyntheticContextMenuEvent(mouseEvent);
            });
        });

        this.addInternalEventListener('fin-canvas-touchstart', function(e) {
            grid.delegateTouchStart(e);
            grid.fireSyntheticTouchStartEvent(e);
        });

        this.addInternalEventListener('fin-canvas-touchmove', function(e) {
            grid.delegateTouchMove(e);
            grid.fireSyntheticTouchMoveEvent(e);
        });

        this.addInternalEventListener('fin-canvas-touchend', function(e) {
            grid.delegateTouchEnd(e);
            grid.fireSyntheticTouchEndEvent(e);
        });

        //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
        document.body.addEventListener('copy', function(evt) {
            grid.checkClipboardCopy(evt);
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

    /**
     * @memberOf Hypergrid#
     * @desc Delegate touchstart to the Behavior model.
     * @param {CustomEvent} event - The pertinent event.
     */
    delegateTouchStart: function(event) {
        this.behavior.onTouchStart(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate touchmove to the Behavior model.
     * @param {CustomEvent} event - The pertinent event.
     */
    delegateTouchMove: function(event) {
        this.behavior.onTouchMove(this, event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Delegate touchend to the Behavior model.
     * @param {CustomEvent} event - The pertinent event.
     */
    delegateTouchEnd: function(event) {
        this.behavior.onTouchEnd(this, event);
    }
};
