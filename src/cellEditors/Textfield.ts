import { CellEditor } from "./CellEditor";


export class Textfield extends CellEditor {
    /**
     *
     */
    constructor(grid: any, options: any) {
        super(grid, options);

        this.input.style.textAlign = this.event.properties.halign;
        this.input.style.font = this.event.properties.font;
    }

    protected initProps(): void {
        this.template = '<input type="text" lang="{{locale}}" class="hypergrid-textfield" style="{{style}}">'
    }

    selectAll: () => void = () => {
        this.input.setSelectionRange(0, this.input.value.length);
    }
}
