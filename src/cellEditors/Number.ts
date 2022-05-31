import { Textfield } from "./Textfield";


export class Number extends Textfield {
    /**
     *
     */
    constructor(grid: any, options: any) {
        super(grid, options);

        this.localizer = grid.localization.get('number');
    }
}
