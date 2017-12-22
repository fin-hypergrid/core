'use strict';

module.exports = function(demo, grid) {

    var idx = grid.behavior.columnEnum;

    var state = {
        columnIndexes: [
            idx.lastName,
            idx.totalNumberOfPetsOwned,
            idx.height,
            idx.birthDate,
            idx.birthTime,
            idx.birthState,
            // idx.residenceState,
            idx.employed,
            // idx.firstName,
            idx.income,
            idx.travel,
            // idx.squareOfIncome
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
        fixedRowCount: 4,

        columnAutosizing: false,
        headerTextWrapping: true,

        halign: 'left',
        renderFalsy: true,

        scrollbarHoverOff: 'visible',
        scrollbarHoverOver: 'visible',
        columnHeaderBackgroundColor: 'pink',

        checkboxOnlyRowSelections: true,

        autoSelectRows: true,

        calculators: {
            Add10: 'function(dataRow,columnName) { return dataRow[columnName] + 10; }'
        },

        columns: {
            height: {
                halign: 'right',
                format: 'foot'
            },

            /* eslint-disable camelcase */
            last_name: {
                columnHeaderBackgroundColor: '#142B6F', //dark blue
                columnHeaderColor: 'white',
                columnHeaderHalign: 'left',
                rightIcon: 'down-rectangle',
                link: true
            },

            first_name: {

            },

            total_number_of_pets_owned: {
                halign: 'center',
                format: 'number',
                calculator: 'Add10',
                color: 'green'
            },

            birthDate: {
                format: 'singdate',
                rightIcon: 'calendar',
                //strikeThrough: true
            },

            birthTime: {
                halign: 'right',
                editor: 'time',
                format: 'hhmm'
            },

            birthState: {
                editor: 'colortext',
                rightIcon: 'down-rectangle'
            },

            residenceState: {
                rightIcon: 'down-rectangle'
            },

            employed: {
                halign: 'right',
                renderer: 'button',
                backgroundColor: 'white'
            },

            income: {
                halign: 'right',
                format: 'pounds'
            },

            travel: {
                halign: 'right',
                format: 'francs'
            }
        },

        /* Following `rows` and `cells` examples shows how to set row and cell properties declaratively,
         * useful for static grids when cell coordinates are known ahead of time.
         *
         * (There are as well several equivalent programmatic methods for setting cells props, such as
         * `cell.setProperty`,
         * `cell.setProperties`,
         * `behavior.setCellProperty`,
         * `behavior.setCellProperties`,
         * _etc._)
         *
         * Caveat: For dynamic grid data, when cell coordinates are *not* known at start up (when state is
         * usually applied), loading row and cell properties _with the data_ (as metadata) has advantages
         * and is, preferred especially for frequently changing rows and cells. In this paradigm, row and
         * cell properties are omitted here and the state object only loads grid and column properties.
         * (Metadata is supported in the data source when it implements `getRowMetaData` and `setRowMetaData`.)
         */
        rows: {
            header: { // subgrid key
                0: { // row index
                    // row properties
                    height: 40 // (height is the only supported row property at the current time)
                }
            }
        },
        cells: { // cell properties
            data: { // subgrid key
                16: { // row index
                    height: { // column name
                        // cell properties:
                        font: '10pt Tahoma',
                        color: 'lightblue',
                        backgroundColor: 'red',
                        halign: 'left',
                        reapplyCellProperties: true
                    }
                }
            }
        }
    };

    grid.setState(state);

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

    //                behavior.setCellProperties(idx.totalNumberOfPetsOwned, 0,
    //                    {
    //                        font: '10pt Tahoma',
    //                        color: 'red',
    //                        backgroundColor: 'lightblue',
    //                        halign: 'left'
    //                    });

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

    demo.resetDashboard();
};
