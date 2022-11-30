import Column from "../behaviors/Column";
import { FeatureBase } from "./FeatureBase";

export class ColumnResizing extends FeatureBase {

    private dragColumn?: Column
    private nextColumn?: Column
    private nextStartWidth: number

    /**
     * the pixel location of the where the drag was initiated
     * @type {number}
     * @default
     * @memberOf ColumnResizing.prototype
     */
    private dragStart: -1

    /**
     * the starting width/height of the row/column we are dragging
     * @type {number}
     * @default -1
     * @memberOf ColumnResizing.prototype
     */
    private dragStartWidth: -1

    /**
     * @memberOf ColumnResizing.prototype
     * @this ColumnResizingType
     * @desc get the mouse x,y coordinate
     * @returns {number}
     * @param {MouseEvent} event - the mouse event to query
     */
    getMouseValue(event) {
        // @ts-ignore
        return event.primitiveEvent.detail.mouse.x;
    }

    /**
     * @memberOf ColumnResizing.prototype
     * @desc returns the index of which divider I'm over
     * @returns {boolean}
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    overAreaDivider(grid, event) {
        var leftMostColumnIndex = grid.behavior.leftMostColIndex;
        return event.gridCell.x !== leftMostColumnIndex && event.mousePoint.x <= 3 ||
            event.mousePoint.x >= event.bounds.width - 3;
    }

    /**
     * @memberOf ColumnResizing.prototype
     * @desc return the cursor name
     * @returns {string}
     */
    getCursorName() {
        return 'col-resize';
    }

    /**
     * @memberOf ColumnResizing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag(grid, event) {
        if (this.dragColumn) {
            var delta = this.getMouseValue(event) - this.dragStart,
                dragWidth = this.dragStartWidth + delta,
                nextWidth = this.nextStartWidth - delta;
            if (!this.nextColumn) { // nextColumn et al instance vars defined when resizeColumnInPlace (by handleMouseDown)
                grid.behavior.setColumnWidth(this.dragColumn, dragWidth);
            } else {
                var np = this.nextColumn.properties, dp = this.dragColumn.properties;
                if (
                    0 < delta && delta <= (this.nextStartWidth - np.minimumColumnWidth) &&
                    (!dp.maximumColumnWidth || dragWidth <= dp.maximumColumnWidth)
                    ||
                    0 > delta && delta >= -(this.dragStartWidth - dp.minimumColumnWidth) &&
                    (!np.maximumColumnWidth || nextWidth < np.maximumColumnWidth)
                ) {
                    grid.behavior.setColumnWidth(this.dragColumn, dragWidth);
                    grid.behavior.setColumnWidth(this.nextColumn, nextWidth);
                }
            }
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    }

    /**
     * @memberOf ColumnResizing.prototype
     * @this ColumnResizingType
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown(grid, event) {
        if (event.isHeaderRow && this.overAreaDivider(grid, event)) {
            var gridColumnIndex = event.gridCell.x;

            if (event.mousePoint.x <= 3) {
                gridColumnIndex -= 1;
                var ac = grid.behavior.getActiveColumn(gridColumnIndex)
                    || grid.behavior.getActiveColumn(gridColumnIndex - 1); // get row number column if tree column undefined
                if (ac) {
                    this.dragColumn = ac;
                    this.dragStartWidth = ac.properties.width;
                } else {
                    return; // can't drag left-most column boundary
                }
            } else {
                this.dragColumn = event.column;
                this.dragStartWidth = event.bounds.width;
            }

            this.dragStart = this.getMouseValue(event);

            if (this.dragColumn.properties.resizeColumnInPlace) {
                gridColumnIndex += 1;
                ac = grid.behavior.getActiveColumn(gridColumnIndex)
                    || grid.behavior.getActiveColumn(gridColumnIndex + 1); // get first data column if tree column undefined;
                if (ac) {
                    this.nextColumn = ac;
                    this.nextStartWidth = this.nextColumn.getWidth();
                } else {
                    this.nextColumn = undefined;
                }
            } else {
                this.nextColumn = undefined; // in case resizeColumnInPlace was previously on but is now off
            }
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    }

    /**
     * @memberOf ColumnResizing.prototype
     * @this ColumnResizingType
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp(grid, event) {
        if (this.dragColumn) {

            if(this.dragStartWidth !== this.dragColumn.getWidth()) {
                grid.fireSyntheticColumnResizedEvent(this.dragColumn, this.dragStartWidth)
            }
            if(this.nextColumn && this.nextStartWidth !== this.nextColumn.getWidth()) {
                grid.fireSyntheticColumnResizedEvent(this.nextColumn, this.nextStartWidth)
            }

            this.cursor = null;
            this.dragColumn = undefined;

            event.primitiveEvent.stopPropagation();
            //delay here to give other events a chance to be dropped
            grid.behaviorShapeChanged();
        } else if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    }

    /**
     * @memberOf ColumnResizing.prototype
     * @this ColumnResizingType
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseMove(grid, event) {
        if (!this.dragColumn) {
            this.cursor = null;

            if (this.next) {
                this.next.handleMouseMove(grid, event);
            }

            this.cursor = event.isHeaderRow && this.overAreaDivider(grid, event) ? this.getCursorName() : null;
        }
    }

    /**
     * @param {Hypergrid} grid
     * @param {CellEvent} cellEvent
     * @memberOf ColumnResizing.prototype
     */
    handleDoubleClick(grid, event) {
        if (event.isHeaderRow && this.overAreaDivider(grid, event)) {
            var column = event.mousePoint.x <= 3
                ? grid.behavior.getActiveColumn(event.gridCell.x - 1)
                : event.column;
            column.addProperties({
                columnAutosizing: true,
                columnAutosized: false // todo: columnAutosizing should be a setter that automatically resets columnAutosized on state change to true
            });
            setTimeout(function() { // do after next render, which measures text now that auto-sizing is on
                grid.autosizeColumn(column);
            });
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    }

}
