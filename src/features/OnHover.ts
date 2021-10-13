import { FeatureBase } from './FeatureBase';
import _ from "lodash";

export class OnHover extends FeatureBase {
    private throttledButtonHoverEvent: _.DebouncedFunc<()=>void>

    initializeOn(grid: any) {
        this.throttledButtonHoverEvent = _.throttle(()=> grid.repaint(), 100)
        this.next?.initializeOn(grid)
    }

    handleMouseMove(grid, event) {
        var hoverCell = grid.hoverCell;
        // VC-5715 this is added for quickly repaint the images incase the button is hovered
        if (event.mousePointInLeftClickRect || event.mousePointInRightClickRect) {
            this.throttledButtonHoverEvent()
        }
        if (!event.gridCell.equals(hoverCell)) {
            if (hoverCell) {
                this.handleMouseExit(grid, hoverCell);
            }
            this.handleMouseEnter(grid, event);
            grid.setHoverCell(event);
        } else if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    }
}