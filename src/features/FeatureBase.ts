import { IFeature } from "./IFeature";


export class FeatureBase implements IFeature {

    /** A temporary holding field for my next feature when I'm in a disconnected state */
    private detached: IFeature | null;

    public next: IFeature = null;
    public cursor: string | string[] = null;
    public currentHoverCell: Point = null;

    setNext(nextFeature: IFeature) {
        if (this.next) {
            // @ts-ignore TODO
            this.next.setNext(nextFeature);
        } else {
            this.next = nextFeature;
            this.detached = nextFeature;
        }
    }

    detachChain() {
        this.next = null;
    }

    attachChain() {
        this.next = this.detached;
    }

    handleMouseMove(grid, event) {
        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    }

    handleMouseExit(grid, event) {
        if (this.next) {
            this.next.handleMouseExit(grid, event);
        }
    }

    handleMouseEnter(grid, event) {
        if (this.next) {
            this.next.handleMouseEnter(grid, event);
        }
    }

    handleMouseDown(grid, event) {
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    }


    handleMouseUp(grid, event) {
        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    }

    handleKeyDown(grid, event) {
        if (this.next) {
            this.next.handleKeyDown(grid, event);
        } else {
            return true;
        }
    }

    handleKeyUp(grid, event) {
        if (this.next) {
            this.next.handleKeyUp(grid, event);
        }
    }

    handleWheelMoved(grid, event) {
        if (this.next) {
            this.next.handleWheelMoved(grid, event);
        }
    }

    handleDoubleClick(grid, event) {
        if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    }

    handleClick(grid, event) {
        if (this.next) {
            this.next.handleClick(grid, event);
        }
    }

    handleMouseDrag(grid, event) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    }

    handleContextMenu(grid, event) {
        if (this.next) {
            this.next.handleContextMenu(grid, event);
        }
    }

    handleTouchStart(grid, event) {
        if (this.next) {
            this.next.handleTouchStart(grid, event);
        }
    }

    handleTouchMove(grid, event) {
        if (this.next) {
            this.next.handleTouchMove(grid, event);
        }
    }

    handleTouchEnd(grid, event) {
        if (this.next) {
            this.next.handleTouchEnd(grid, event);
        }
    }

    moveSingleSelect(grid, x, y) {
        if (this.next) {
            this.next.moveSingleSelect(grid, x, y);
        }
    }

    isFirstFixedRow(grid, event) {
        return event.gridCell.y < 1;
    }

    isFirstFixedColumn(grid, event) {
        return event.gridCell.x === 0;
    }

    setCursor(grid) {
        if (this.next) {
            this.next.setCursor(grid);
        }
        if (this.cursor) {
            grid.beCursor(this.cursor);
        }
    }

    initializeOn(grid) {
        if (this.next) {
            this.next.initializeOn(grid);
        }
    }

    getClassName() {
        return this.constructor.name
    }
}
