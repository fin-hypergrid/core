import { CellEditor } from "../cellEditors/CellEditor";
import { FeatureBase } from "./FeatureBase";

export class CellEditing extends FeatureBase {

    handleClick(grid: any, event: any): void {

        var enable = false
        switch (event.cellEditorMode) {
            case 'CtrlClick':
                enable = event.keys.includes('CTRL')
                break;
            case 'SingleClick':
                enable = true
                break;
            default:
                break;
        }
        this.edit(grid, event, enable)

        if (this.next) {
            this.next.handleClick(grid, event);
        }
    }

    handleDoubleClick(grid: any, event: any): void {
        var enable = false
        switch (event.cellEditorMode) {
            case 'DoubleClick':
                enable = true
                break;
            default:
                break;
        }
        this.edit(grid, event, enable)

        if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    }

    // key down
    handleKeyDown(grid: any, event: any): boolean {
        var char, isVisibleChar, isDeleteChar, editor, cellEvent;

        if (
            (cellEvent = grid.getGridCellFromLastSelection()) &&
            cellEvent.properties.editOnKeydown &&
            !grid.cellEditor &&
            (
                (char = event.detail.char) === 'F2' ||
                (isVisibleChar = char.length === 1 && !(event.detail.meta || event.detail.ctrl)) ||
                (isDeleteChar = char === 'DELETE' || char === 'BACKSPACE')
            )
        ) {
            editor = grid.onEditorActivate(cellEvent);

            if (editor instanceof CellEditor) {
                if (isVisibleChar) {
                    editor.input.value = char;
                } else if (isDeleteChar) {
                    editor.setEditorValue('');
                }
                event.detail.primitiveEvent.preventDefault();
            }
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }

        return undefined
    }

    private edit(grid: any, event: any, activate: boolean): any {
        if (event.isDataCell && activate) {
            grid.onEditorActivate(event)
        }
    }
}
