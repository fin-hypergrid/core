module.exports = function (grid) {

    var idx = grid.behavior.columnEnum,
        behavior = grid.behavior;


    var state = {
        columnIndexes: [
            idx.LAST_NAME,
            idx.TOTAL_NUMBER_OF_PETS_OWNED,
            idx.HEIGHT,
            idx.BIRTH_DATE,
            idx.BIRTH_TIME,
            idx.BIRTH_STATE,
            // idx.RESIDENCE_STATE,
            idx.EMPLOYED,
            // idx.FIRST_NAME,
            idx.INCOME,
            idx.TRAVEL,
            // idx.SQUARE_OF_INCOME
        ],

        noDataMessage: 'No Data to Display',
        backgroundColor: 'white',
        font: 'normal small garamond',
        rowProperties: [
            undefined,
            undefined,
            undefined,
            { color: '#116611', backgroundColor: '#e8ffe8', font: 'italic small garamond' },
            { color: '#116611', backgroundColor: '#e8ffe8', font: 'italic small garamond' },
            { color: '#116611', backgroundColor: '#e8ffe8', font: 'italic small garamond' }
        ],

        fixedColumnCount: 1,
        fixedRowCount: 2,

        showRowNumbers: true,
        showHeaderRow: true,
        columnAutosizing: false,
        headerTextWrapping: true,

        // filteringMode: 'immediate', // 'immediate' for every key press vs. 'onCommit' to wait till RETURN
        // filterDefaultColumnFilterOperator: '<>',
        cellSelection: true,
        columnSelection: true,
        rowSelection: true,

        halign: 'left'
    };

    grid.setState(state);

    grid.setRowHeight(0, 40, behavior.subgrids.lookup.header);


    grid.setColumnProperties(2, {
        backgroundColor: 'maroon',
        color: 'green'
    });

    grid.addProperties({
        readOnly: false,
        renderFalsy: true
    });

    behavior.setFixedRowCount(2);

    // decorate "Height" cell in 17th row
    var rowIndex = 17 - 1;
    behavior.setCellProperties(idx.HEIGHT, rowIndex, {
        font: '10pt Tahoma',
        color: 'lightblue',
        backgroundColor: 'red',
        halign: 'left',
        reapplyCellProperties: true
    });

    grid.addProperties({
        scrollbarHoverOff: 'visible',
        scrollbarHoverOver: 'visible',
        columnHeaderBackgroundColor: 'pink',
        repaintIntervalRate: 60
    });

    grid.addProperties({
        fixedRowCount: 4,
        showRowNumbers: true,
        checkboxOnlyRowSelections: true,
        autoSelectRows: true
    });
    // properties that can be set
    // use a function or a value

    // font
    // color
    // backgroundColor
    // foregroundSelectionColor
    // backgroundSelectionColor

    // columnHeaderFont
    // columnHeaderColor
    // columnHeaderBackgroundColor
    // columnHeaderForegroundSelectionColor
    // columnHeaderBackgroundSelectionColor

    // rowHeaderFont
    // rowHeaderColor
    // rowHeaderBackgroundColor
    // rowHeaderForegroundSelectionColor
    // rowHeaderBackgroundSelectionColor

    //                behavior.setCellProperties(idx.TOTAL_NUMBER_OF_PETS_OWNED, 0,
    //                    {
    //                        font: '10pt Tahoma',
    //                        color: 'red',
    //                        backgroundColor: 'lightblue',
    //                        halign: 'left'
    //                    });

    behavior.setColumnProperties(idx.LAST_NAME, {
        columnHeaderBackgroundColor: '#142B6F', //dark blue
        columnHeaderColor: 'white'
    });

    behavior.setColumnProperties(idx.LAST_NAME, {
        columnHeaderHalign: 'left',
        rightIcon: 'down-rectangle',
        link: true
    });

    behavior.setColumnProperties(idx.FIRST_NAME, {

    });

    behavior.setColumnProperties(idx.TOTAL_NUMBER_OF_PETS_OWNED, {
        renderFalsy: true,
        halign: 'center',
        format: 'number'
    });

    behavior.setColumnProperties(idx.HEIGHT, {
        halign: 'right',
        format: 'foot'
    });

    behavior.setColumnProperties(idx.BIRTH_DATE, {
        format: 'singdate',
        rightIcon: 'calendar',
        //strikeThrough: true
    });

    behavior.setColumnProperties(idx.BIRTH_TIME, {
        halign: 'right',
        editor: 'time',
        format: 'hhmm'
    });

    behavior.setColumnProperties(idx.BIRTH_STATE, {
        editor: 'colortext',
        rightIcon: 'down-rectangle'
    });

    behavior.setColumnProperties(idx.RESIDENCE_STATE, {
        rightIcon: 'down-rectangle'
    });

    behavior.setColumnProperties(idx.EMPLOYED, {
        halign: 'right',
        renderer: 'button',
        backgroundColor: 'white'
    });

    behavior.setColumnProperties(idx.INCOME, {
        halign: 'right',
        format: 'pounds'
    });

    behavior.setColumnProperties(idx.TRAVEL, {
        halign: 'right',
        format: 'francs'
    });

    console.log('visible rows = ' + grid.renderer.visibleRows.map(function(vr){
            return vr.subgrid.type[0] + vr.rowIndex;
        }));
    console.log('visible columns = ' + grid.renderer.visibleColumns.map(function(vc){
            return vc.columnIndex;
        }));

    //see myThemes.js file for how to create a theme
    //grid.addProperties(myThemes.one);
    //grid.addProperties(myThemes.two);
    //grid.addProperties(myThemes.three);

    grid.takeFocus();
};
