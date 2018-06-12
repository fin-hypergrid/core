(function(require, module, exports, Hypergrid) {
'use strict';

module.exports = function() {

    var demo = this,
        grid = demo.grid,
        schema = grid.behavior.schema,
        greenland = { color: '#116611', backgroundColor: '#e8ffe8', font: 'italic small garamond' };

    var state = {
        columnIndexes: [
            schema.lastName.index,
            schema.totalNumberOfPetsOwned.index,
            schema.height.index,
            schema.birthDate.index,
            schema.birthTime.index,
            schema.birthState.index,
            // schema.residenceState.index,
            schema.employed.index,
            // schema.firstName.index,
            schema.income.index,
            schema.travel.index,
            // schema.squareOfIncome.index
        ],

        noDataMessage: 'No Data to Display',
        backgroundColor: 'white',
        font: 'normal small garamond',
        rowStripes: [
            undefined,
            undefined,
            undefined,
            greenland,
            greenland,
            greenland
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

        calculators: {
            Add10: add10.toString()
        },

        // ANTI-PATTERNS FOLLOW
        //
        // Setting column, row, cell props here in a state object is a legacy feature.
        // Developers may find it more useful to set column props in column schema (as of v2.1.6),
        // row props in row metadata (as of v2.1.0), and cell props in column metadata (as of v2.0.2),
        // which would then persist across setState calls which clear these properties objects
        // before applying new values. In this demo, we have changed the setState call below to addState
        // (which does not clear the properties object first) to show how to set a column prop here *and*
        // a different prop on the same column in schema (in index.js).

        columns: {
            height: {
                // halign: 'right', --- for demo purposes, this prop being set in index.js (see)
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
                format: 'clock12'
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
            },
            data: {
                10: {
                    backgroundColor: 'lime'
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
                        halign: 'left'
                    }
                }
            }
        }
    };

    grid.addState(state); // changed from setState so 'height' props set with schema in index.js wouldn't be cleared

    grid.takeFocus();

    demo.resetDashboard();
};

function add10(dataRow, columnName, subrow) {
    var val = dataRow[columnName];
    if (val.constructor === Array) { val = val[subrow]; }
    return val + 10;
}
})(fin.Hypergrid.require, fin.Hypergrid.modules, fin.$x = {}, fin.Hypergrid);
fin.Hypergrid.modules.setState = fin.$x;
delete fin.$x;
