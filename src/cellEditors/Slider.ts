import { CellEditor } from './CellEditor';

export class Slider extends CellEditor {
    /**
     *
     */
    constructor(grid: any, options: any) {
        super(grid, options);
    }

    protected initProps(props?: any): void {
        this.template = '<input type="range" lang="{{locale}}" style="{{style}}">'
    }
}
