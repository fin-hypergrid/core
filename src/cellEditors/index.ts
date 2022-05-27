import Registry from "../lib/Registry";
import { Color } from "./Color";
import { Number } from './Number'
import { Slider } from "./Slider";
import { Spinner } from "./Spinner";
import { Textfield } from './Textfield';
import { Date } from './Date'

export class CellEditors extends Registry {

    /**
     *
     */
    constructor() {
        super();
        super.add(Number)
        super.add(Textfield)
        super.add(Color)
        super.add(Date)
        super.add(Slider)
        super.add(Spinner)
    }

    get(name: string): any {
        var cellEditor = undefined
        if (name && name.toLowerCase() === 'celleditor') {
            console.warn('grid.cellEditors.get("' + name + '") method call has been deprecated as of v2.1.0 in favor of grid.cellEditors.BaseClass property. (Will be removed in a future release.)');
            return undefined
        }
        try {
            cellEditor = super.get(name)
        } catch (err) {
            // fail silently
        }
        return cellEditor
    }
}

