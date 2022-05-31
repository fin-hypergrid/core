import { CellEditor } from './CellEditor';


export class Spinner extends CellEditor {
    /**
     *
     */
    constructor(grid: any, options: any) {
        super(grid, options);
    }

    protected initProps() {
        this.template = '<input type="number" lang="{{locale}}" style="{{style}}">'
    }
}
