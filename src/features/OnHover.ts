import { Subject } from 'rxjs';
import { bufferTime } from 'rxjs/operators';
import { FeatureBase } from './FeatureBase';

export class OnHover extends FeatureBase {
    private hoverButtonSource = new Subject()

    initializeOn(grid: any) {
        this.hoverButtonSource
            .pipe(bufferTime(100))
            .subscribe(_ => grid.repaint())
        this.next?.initializeOn(grid)
    }

    handleMouseMove(grid, event) {
        var hoverCell = grid.hoverCell;
        // VC-5715 this is added for quickly repaint the images incase the button is hovered
        if (event.mousePointInLeftClickRect || event.mousePointInRightClickRect) {
            this.hoverButtonSource.next(null)
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