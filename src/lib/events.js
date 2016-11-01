/* eslint-env browser */

'use strict';

module.exports = {
    /**
     * @memberOf Hypergrid#
     * @param {number} c - grid column index.
     * @param {string[]} keys
     */
    fireSyntheticColumnSortEvent: function(c, keys) {
        var event = new CustomEvent('fin-column-sort', {
            detail: {
                column: c,
                keys: keys
            }
        });
        this.canvas.dispatchEvent(event);
    },

    fireSyntheticEditorKeyUpEvent: function(inputControl, keyEvent) {
        var clickEvent = new CustomEvent('fin-editor-keyup', {
            detail: {
                input: inputControl,
                keyEvent: keyEvent,
                char: this.canvas.getCharMap()[keyEvent.keyCode][keyEvent.shiftKey ? 1 : 0]
            }
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    fireSyntheticEditorKeyDownEvent: function(inputControl, keyEvent) {
        var clickEvent = new CustomEvent('fin-editor-keydown', {
            detail: {
                input: inputControl,
                keyEvent: keyEvent,
                char: this.canvas.getCharMap()[keyEvent.keyCode][keyEvent.shiftKey ? 1 : 0]
            }
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    fireSyntheticEditorKeyPressEvent: function(inputControl, keyEvent) {
        var clickEvent = new CustomEvent('fin-editor-keypress', {
            detail: {
                input: inputControl,
                keyEvent: keyEvent,
                char: this.canvas.getCharMap()[keyEvent.keyCode][keyEvent.shiftKey ? 1 : 0]
            }
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    fireSyntheticEditorDataChangeEvent: function(inputControl, oldValue, newValue) {
        var clickEvent = new CustomEvent('fin-editor-data-change', {
            detail: {
                input: inputControl,
                oldValue: oldValue,
                newValue: newValue
            },
            cancelable: true
        });
        return this.canvas.dispatchEvent(clickEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-row-selection-changed` event.
     */
    fireSyntheticRowSelectionChangedEvent: function() {
        var selectionEvent = new CustomEvent('fin-row-selection-changed', {
            detail: {
                rows: this.getSelectedRows(),
                columns: this.getSelectedColumns(),
                selections: this.selectionModel.getSelections(),
            }
        });
        this.canvas.dispatchEvent(selectionEvent);
    },

    fireSyntheticColumnSelectionChangedEvent: function() {
        var selectionEvent = new CustomEvent('fin-column-selection-changed', {
            detail: {
                rows: this.getSelectedRows(),
                columns: this.getSelectedColumns(),
                selections: this.selectionModel.getSelections()
            }
        });
        this.canvas.dispatchEvent(selectionEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-context-menu` event
     * @param {keyEvent} event - The canvas event.
     */
    fireSyntheticContextMenuEvent: function(event) {
        event.rows = this.getSelectedRows();
        event.columns = this.getSelectedColumns();
        event.selections = this.selectionModel.getSelections();
        this.canvas.dispatchEvent(
            new CustomEvent('fin-context-menu', { detail: event })
        );
    },

    fireSyntheticMouseUpEvent: function(event) {
        event.rows = this.getSelectedRows();
        event.columns = this.getSelectedColumns();
        event.selections = this.selectionModel.getSelections();
        this.canvas.dispatchEvent(
            new CustomEvent('fin-mouseup', { detail: event })
        );
    },

    fireSyntheticMouseDownEvent: function(event) {
        event.rows = this.getSelectedRows();
        event.columns = this.getSelectedColumns();
        event.selections = this.selectionModel.getSelections();
        this.canvas.dispatchEvent(
            new CustomEvent('fin-mousedown', { detail: event })
        );
    },

    fireSyntheticButtonPressedEvent: function(event) {
        if (this.isViewableButton(event.dataCell.x, event.gridCell.y)) {
            this.canvas.dispatchEvent(
                new CustomEvent('fin-button-pressed', { detail: event })
            );
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-column-drag-start` event.
     */
    fireSyntheticOnColumnsChangedEvent: function() {
        var detail = {
            time: Date.now(),
            grid: this
        };
        var cEvent = new CustomEvent('fin-column-changed-event', {
            detail: detail
        });
        this.canvas.dispatchEvent(cEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-keydown` event.
     * @param {keyEvent} event - The canvas event.
     */
    fireSyntheticKeydownEvent: function(keyEvent) {
        var clickEvent = new CustomEvent('fin-keydown', {
            detail: keyEvent.detail
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-keyup` event.
     * @param {keyEvent} event - The canvas event.
     */
    fireSyntheticKeyupEvent: function(keyEvent) {
        var clickEvent = new CustomEvent('fin-keyup', {
            detail: keyEvent.detail
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    fireSyntheticFilterAppliedEvent: function() {
        var filterEvent = new CustomEvent('fin-filter-applied');
        this.canvas.dispatchEvent(filterEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-enter` event
     * @param {Point} cell - The pixel location of the cell in which the click event occurred.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticOnCellEnterEvent: function(cell) {
        var detail = {
            gridCell: cell,
            time: Date.now(),
            grid: this
        };
        var clickEvent = new CustomEvent('fin-cell-enter', {
            detail: detail
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-exit` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticOnCellExitEvent: function(cell) {
        var detail = {
            gridCell: cell,
            time: Date.now(),
            grid: this
        };
        var clickEvent = new CustomEvent('fin-cell-exit', {
            detail: detail
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-cell-click` event.
     * @param {Point} cell - The pixel location of the cell in which the click event occured.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticClickEvent: function(mouseEvent) {
        var cell = mouseEvent.gridCell;
        var detail = {
            gridCell: cell,
            mousePoint: mouseEvent.mousePoint,
            keys: mouseEvent.keys,
            primitiveEvent: mouseEvent,
            time: Date.now(),
            grid: this
        };
        this.behavior.enhanceDoubleClickEvent(detail);
        var clickEvent = new CustomEvent('fin-click', {
            detail: detail
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-double-click` event.
     * @param {MouseEvent} event - The system mouse event.
     */
    fireSyntheticDoubleClickEvent: function(mouseEvent) {
        if (!this.abortEditing()) { return; }
        var cell = mouseEvent.gridCell;
        var detail = {
            gridCell: cell,
            mousePoint: mouseEvent.mousePoint,
            time: Date.now(),
            grid: this
        };
        this.behavior.enhanceDoubleClickEvent(mouseEvent);
        var clickEvent = new CustomEvent('fin-double-click', {
            detail: detail
        });
        this.behavior.cellDoubleClicked(cell, mouseEvent);
        this.canvas.dispatchEvent(clickEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a rendered event.
     */
    fireSyntheticGridRenderedEvent: function() {
        var event = new CustomEvent('fin-grid-rendered', {
            detail: {
                source: this,
                time: Date.now()
            }
        });
        if (this.canvas) {
            this.canvas.dispatchEvent(event);
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a scroll event.
     * @param {string} type - Should be either `fin-scroll-x` or `fin-scroll-y`.
     * @param {number} oldValue - The old scroll value.
     * @param {number} newValue - The new scroll value.
     */
    fireScrollEvent: function(type, oldValue, newValue) {
        var event = new CustomEvent(type, {
            detail: {
                oldValue: oldValue,
                value: newValue,
                time: Date.now()
            }
        });
        this.canvas.dispatchEvent(event);

    },

    fireRequestCellEdit: function(cell, value) {
        var clickEvent = new CustomEvent('fin-request-cell-edit', {
            cancelable: true,
            detail: {
                value: value,
                gridCell: cell,
                time: Date.now()
            }
        });
        return this.canvas.dispatchEvent(clickEvent); //I wasn't cancelled
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-before-cell-edit event.
     * @param {Point} cell - The x,y coordinates.
     * @param {Object} value - The current value.
     * @returns {boolean} Proceed (don't cancel).
     */
    fireBeforeCellEdit: function(cell, oldValue, newValue, control) {
        var clickEvent = new CustomEvent('fin-before-cell-edit', {
            cancelable: true,
            detail: {
                oldValue: oldValue,
                newValue: newValue,
                gridCell: cell,
                time: Date.now(),
                input: control,
                row: this.getRow(cell.y)
            }
        });
        return this.canvas.dispatchEvent(clickEvent);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {Renderer} sub-component
     * @param {Point} cell - The x,y coordinates.
     * @param {Object} oldValue - The old value.
     * @param {Object} newValue - The new value.
     */
    fireAfterCellEdit: function(cell, oldValue, newValue, control) {
        var clickEvent = new CustomEvent('fin-after-cell-edit', {
            detail: {
                newValue: newValue,
                oldValue: oldValue,
                gridCell: cell,
                time: Date.now(),
                input: control,
                row: this.getRow(cell.y)
            }
        });
        this.canvas.dispatchEvent(clickEvent);
    },

    delegateCanvasEvents: function() {
        var self = this;

        function getMouseEvent(e) {
            return Object.defineProperty(
                self.getGridCellFromMousePoint(e.detail.mouse),
                'primitiveEvent',
                {
                    value: e,
                    enumerable: false,
                    configurable: true,
                    writable: true
                }
            );
        }

        this.canvas.resizeNotification = function() {
            self.resized();
        };

        this.addEventListener('fin-canvas-mousemove', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            self.delegateMouseMove(getMouseEvent(e));
        });

        this.addEventListener('fin-canvas-mousedown', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            if (!self.abortEditing()) {
                event.stopPropagation();
                return;
            }
            var mouseEvent = getMouseEvent(e);
            mouseEvent.keys = e.detail.keys;
            self.mouseDownState = mouseEvent;
            self.delegateMouseDown(mouseEvent);
            self.fireSyntheticMouseDownEvent(mouseEvent);
            self.repaint();
        });

        this.addEventListener('fin-canvas-click', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            var mouseEvent = getMouseEvent(e);
            mouseEvent.keys = e.detail.keys; // todo: this was in fin-tap but wasn't here
            self.fireSyntheticClickEvent(mouseEvent);
            self.delegateClick(mouseEvent);
        });

        this.addEventListener('fin-canvas-mouseup', function(e) {
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
            var mouseEvent = getMouseEvent(e);
            self.delegateMouseUp(mouseEvent);
            if (self.mouseDownState) {
                self.fireSyntheticButtonPressedEvent(self.mouseDownState);
            }
            self.mouseDownState = null;
            self.fireSyntheticMouseUpEvent(mouseEvent);
        });

        this.addEventListener('fin-canvas-dblclick', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            var mouseEvent = getMouseEvent(e);
            self.fireSyntheticDoubleClickEvent(mouseEvent, e);
            self.delegateDoubleClick(mouseEvent);
        });

        this.addEventListener('fin-canvas-drag', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            self.dragging = true;
            self.delegateMouseDrag(getMouseEvent(e));
        });

        this.addEventListener('fin-canvas-keydown', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            self.fireSyntheticKeydownEvent(e);
            self.delegateKeyDown(e);
        });

        this.addEventListener('fin-canvas-keyup', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            self.fireSyntheticKeyupEvent(e);
            self.delegateKeyUp(e);
        });

        this.addEventListener('fin-canvas-wheelmoved', function(e) {
            self.delegateWheelMoved(getMouseEvent(e));
        });

        this.addEventListener('fin-canvas-mouseout', function(e) {
            if (self.properties.readOnly) {
                return;
            }
            self.delegateMouseExit(getMouseEvent(e));
        });

        this.addEventListener('fin-canvas-context-menu', function(e) {
            self.delegateContextMenu(getMouseEvent(e));
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
