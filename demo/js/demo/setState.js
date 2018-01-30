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
        rowStripes: [
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

        rows: {
            header: {
                0: {
                    height: 40
                }
            }
        },

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

        // Following `cells` example sets properties for a cell in the data subgrid.
        // Specifying cell properties here in grid state may be useful for static data subgrids
        // where cell coordinates are permanently assigned. Otherwise, for my dynamic grid data,
        // cell properties might more properly accompany the data itself as metadata
        // (i.e., as a hash in dataRow.__META[fieldName]).
        cells: {
            data: {
                16: {
                    height: {
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

    grid.takeFocus();

    demo.resetDashboard();
};
