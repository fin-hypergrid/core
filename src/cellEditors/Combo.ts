import { CellEditor } from './CellEditor';

/**
 * @constructor
 * @extends CellEditor
 */
// @ts-ignore TODO use classes

export class Combo extends CellEditor {
    /**
     *
     */
    public items: any[] = []

    constructor(grid: any, options: any) {
        super(grid, options);
    }

    protected initProps() { }

    takeFocus(): void {
        var self = this;
        setTimeout(function () {
            //self.input.focus();
            self.selectAll();
        }, 300);
    }

    selectAll: () => void = () => {
        var lastCharPlusOne = this.getEditorValue(undefined).length;
        this.input.setSelectionRange(0, lastCharPlusOne);
    };
}
