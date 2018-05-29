'use strict';

module.exports = function(demo, grid) {

    grid.addEventListener('fin-button-pressed', function(e) {
        var cellEvent = e.detail.primitiveEvent;
        cellEvent.value = !cellEvent.value;
    });

    grid.addEventListener('fin-cell-enter', function(e) {
        var cellEvent = e.detail;

        //how to set the tooltip....
        grid.setAttribute('title', 'event name: "fin-cell-enter"\n' +
            'gridCell: { x: ' + cellEvent.gridCell.x + ', y: ' + cellEvent.gridCell.y + ' }\n' +
            'dataCell: { x: ' + cellEvent.dataCell.x + ', y: ' + cellEvent.dataCell.y + ' }\n' +
            'subgrid type: "' + cellEvent.subgrid.type + '"\n' +
            'subgrid name: ' + (cellEvent.subgrid.name ? '"' + cellEvent.subgrid.name + '"' : 'undefined')
        );
    });

    grid.addEventListener('fin-set-totals-value', function(e) {
        var detail = e.detail,
            areas = detail.areas || ['top', 'bottom'];

        areas.forEach(function(area) {
            var methodName = 'get' + area[0].toUpperCase() + area.substr(1) + 'Totals',
                totalsRow = grid.behavior.dataModel[methodName]();

            totalsRow[detail.y][detail.x] = detail.value;
        });

        grid.repaint();
    });

    /**
     * @summary Listen for certain key presses from grid or cell editor.
     * @desc NOTE: fincanvas's internal char map yields mixed case while fin-editor-key* events do not.
     * @return {boolean} Not handled.
     */
    function handleCursorKey(e) {
        var detail = e.detail,
            key = String.fromCharCode(detail.key).toUpperCase(),
            result = false; // means event handled herein

        if (detail.ctrl) {
            if (detail.shift) {
                switch (key) {
                    case '0': if (grid.stopEditing()) { grid.selectToViewportCell(0, 0); } break;
                    case '9': if (grid.stopEditing()) { grid.selectToFinalCell(); } break;
                    case '8': if (grid.stopEditing()) { grid.selectToFinalCellOfCurrentRow(); } break;
                    case '7': if (grid.stopEditing()) { grid.selectToFirstCellOfCurrentRow(); } break;
                    default: result = true;
                }
            } else {
                switch (key) {
                    case '0': if (grid.stopEditing()) { grid.selectViewportCell(0, 0); } break;
                    case '9': if (grid.stopEditing()) { grid.selectFinalCell(); } break;
                    case '8': if (grid.stopEditing()) { grid.selectFinalCellOfCurrentRow(); } break;
                    case '7': if (grid.stopEditing()) { grid.selectFirstCellOfCurrentRow(); } break;
                    default: result = true;
                }
            }
        }

        return result;
    }

    grid.addEventListener('fin-keydown', handleCursorKey);

    grid.addEventListener('fin-editor-keydown', function(e) {
        // var detail = e.detail,
        //     ke = detail.keyEvent;
        //
        // // more detail, please
        // detail.primitiveEvent = ke;
        // detail.key = ke.keyCode;
        // detail.shift = ke.shiftKey;
        //
        // handleCursorKey(e);
    });

    grid.addEventListener('fin-selection-changed', function(e) {

        if (e.detail.selections.length === 0) {
            console.log('no selections');
            return;
        }

        // to get the selected rows uncomment the below.....
        // console.log(grid.getRowSelectionMatrix());
        // console.log(grid.getRowSelection());

    });

    grid.addEventListener('fin-row-selection-changed', function(e) {
        var detail = e.detail;
        // Move cell selection with row selection
        var rows = detail.rows,
            selections = detail.selections;
        if (
            grid.properties.singleRowSelectionMode && // let's only attempt this when in this mode
            !grid.properties.multipleSelections && // and only when in single selection mode
            rows.length && // user just selected a row (must be single row due to mode we're in)
            selections.length  // there was a cell region selected (must be the only one)
        ) {
            var rect = grid.selectionModel.getLastSelection(), // the only cell selection
                x = rect.left,
                y = rows[0], // we know there's only 1 row selected
                width = rect.right - x,
                height = 0, // collapse the new region to occupy a single row
                fireSelectionChangedEvent = false;

            grid.selectionModel.select(x, y, width, height, fireSelectionChangedEvent);
            grid.repaint();
        }

        if (rows.length === 0) {
            console.log('no rows selected');
            return;
        }
        //we have a function call to create the selection matrix because
        //we don't want to create alot of needless garbage if the user
        //is just navigating around
        console.log(grid.getRowSelectionMatrix());
        console.log(grid.getRowSelection());
    });

    grid.addEventListener('fin-column-selection-changed', function(e) {
        if (e.detail.columns.length === 0) {
            console.log('no rows selected');
            return;
        }
        //we have a function call to create the selection matrix because
        //we don't want to create alot of needless garbage if the user
        //is just navigating around
        console.log(grid.getColumnSelectionMatrix());
        console.log(grid.getColumnSelection());
    });

    //uncomment to cancel editor popping up:
    // grid.addEventListener('fin-request-cell-edit', function(e) { e.preventDefault(); });

    //uncomment to cancel updating the model with the new data:
    // grid.addEventListener('fin-before-cell-edit', function(e) { e.preventDefault(); });
};
