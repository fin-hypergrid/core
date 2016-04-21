/* eslint-env browser */

/* globals fin, people1, people2, accounting, vent */

/* eslint-disable no-alert */

'use strict';

window.onload = function() {

    // List of properties to show as checkboxes in this demo's "dashboard"
    var toggleProps = [
        {
            label: 'Row styling',
            ctrls: [
                { value: '(Global setting)', label: 'base on data', setter: toggleRowStylingMethod }
            ]
        }, {
            label: 'Grouping',
            ctrls: [
                { value: 'aggregates', checked: false, setter: toggleAggregates }
            ]
        }, {
            label: 'Column header rows',
            ctrls: [
                { value: 'showHeaderRow', label: 'header' }, // default "setter" is `setProp`
                { value: 'showFilterRow', label: 'filter' }
            ]
        }, {
            label: 'Hover highlights',
            ctrls: [
                { value: 'hoverCellHighlight.enabled', label: 'cell' },
                { value: 'hoverRowHighlight.enabled', label: 'row' },
                { value: 'hoverColumnHighlight.enabled', label: 'column' }
            ]
        }, {
            label: 'Cell editing',
            ctrls: [
                { value: 'editable' },
                { value: 'editOnDoubleClick', label: 'requires double-click' },
                { value: 'editOnKeydown', label: 'type to edit' }
            ]
        }, {
            label: 'Row selection',
            ctrls: [
                { value: 'checkboxOnlyRowSelections', label: 'by row handles only', setter: setSelectionProp },
                { value: 'singleRowSelectionMode', label: 'one row at a time', setter: setSelectionProp }
            ]
        }, {
            label: 'Filtering',
            ctrls: [
                {
                    value: '(Global setting)',
                    label: 'case-sensitive operand',
                    checked: true,
                    tooltip: 'Check to match case of operand and data in string comparisons. This is a shared property and instantly affects all grids.',
                    setter: toggleCaseSensitivity
                },
                {
                    value: 'filterCaseSensitiveColumnNames',
                    label: 'case-sensitive schema',
                    tooltip: 'Check to match case of filter column names. Resets filter.',
                    setter: resetFilter
                },
                {
                    value: 'filterResolveAliases',
                    label: 'resolve aliases',
                    tooltip: 'Check to allow column headers to be used in filters in addition to column names. Resets filter.',
                    setter: resetFilter
                },
            ]
        }
    ];

    //used by the cellProvider, `null` means column not editable (except filter row)
    var editorTypes = [
        'choice',
        'textfield',
        'spinner',
        'date',
        'choice',
        'choice',
        'choice',
        'textfield',
        'textfield',
        'textfield'
    ];

    /* You can redefine `getNewFilter` to return a new instance of another filter module.
     * Here we're just overriding some options and proceeding with the original `getNewFilter`
     * which adds some more options. Alternatively we could have instantiated the default filter
     * directly using its constructor, `fin.Hypergrid.DefaultFilter`.
     */
    var protoGetDefaultFilter = fin.Hypergrid.behaviors.Behavior.prototype.getNewFilter;
    fin.Hypergrid.behaviors.Behavior.prototype.getNewFilter = function() {
        // create a hierarchical schema organized by alias
        var factory = new fin.Hypergrid.ColumnSchemaFactory(this.columns);
        factory.organize(/^(one|two|three|four|five|six|seven|eight)/i, { key: 'alias' });
        factory.lookup('last_name').defaultOp = 'IN';
        var options = { schema: factory.schema };
        return protoGetDefaultFilter.call(this, options);
    };

    var gridOptions = {
            data: people1,
            margin: { bottom: '17px' }
        },
        grid = window.g = new fin.Hypergrid('div#json-example', gridOptions),
        behavior = window.b = grid.behavior,
        dataModel = window.m = behavior.dataModel;

    // Preset a default dialog options object. Used by call to toggleDialog('ColumnPicker') from features/ColumnPicker.js and by toggleDialog() defined herein.
    grid.setDialogOptions({
        //container: document.getElementById('dialog-container'),
        settings: false
    });

    [
        { label: 'Column Picker&hellip;', onclick: toggleDialog.bind(this, 'ColumnPicker') },
        { label: 'Manage Filters&hellip;', onclick: toggleDialog.bind(this, 'ManageFilters') },
        { label: 'toggle empty data', onclick: toggleEmptyData },
        { label: 'set data 1 (5000 rows)', onclick: behavior.setData.bind(behavior, people1) },
        { label: 'set data 2 (10000 rows)', onclick: behavior.setData.bind(behavior, people2) },
        { label: 'reset', onclick: grid.reset }

    ].forEach(function(item) {
        var button = document.createElement('button');
        button.innerHTML = item.label;
        button.onclick = item.onclick;
        button.title = item.title;
        document.getElementById('dashboard').appendChild(button);
    });

    // add a column filter subexpression containing a single condition purely for demo purposes
    if (false) { // eslint-disable-line no-constant-condition
        grid.getGlobalFilter().columnFilters.add({
            children: [{
                column: 'total_number_of_pets_owned',
                operator: '=',
                operand: '3'
            }],
            type: 'columnFilter'
        });
    }

    window.vent = false;

    //functions for showing the grouping/rollup capbilities
    var doAggregates = false,
        rollups = behavior.aggregations,
        aggregates = {
            totalPets: rollups.sum(2),
            averagePets: rollups.avg(2),
            maxPets: rollups.max(2),
            minPets: rollups.min(2),
            firstPet: rollups.first(2),
            lastPet: rollups.last(2),
            stdDevPets: rollups.stddev(2)
        };

    function toggleAggregates() {
        behavior.setAggregates(this.checked ? aggregates : []);
    }

    var styleRowsFromData;
    function toggleRowStylingMethod() {
        styleRowsFromData = !styleRowsFromData;
    }

    function toggleCaseSensitivity() {
        grid.setGlobalFilterCaseSensitivity(this.checked);
    }

    function toggleDialog(dialogName, evt) {
        grid.toggleDialog(dialogName);
        evt.stopPropagation(); // todo: without this other browsers get the event.... HOW?
    }
/*
    var applyAggregates = document.querySelector('input[type=checkbox][value="Apply aggregates"]');

    window.toggleAutosortGrouping = function() {
        if (!applyAggregates.checked) {
            applyAggregates.dispatchEvent(new MouseEvent('click'));
        }
        behavior.setAggregates(aggregates);
        behavior.setGroups([1, 2, 3, 4, 5, 6, 7]);
    };
*/

    var topTotals = [
            ['one', 'two', '3', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
            ['ten', 'nine', '8', 'seven', 'six', 'five', 'four', 'three', 'two', 'one']
        ],
        bottomTotals = [
            ['ONE', 'TWO', '3', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'],
            ['TEN', 'NINE', '8', 'SEVEN', 'SIX', 'FIVE', 'FOUR', 'THREE', 'TWO', 'ONE']
        ];

    var emptyData = false;
    function toggleEmptyData() {
        if ((emptyData = !emptyData)) {
            //important to set top totals first
            behavior.setTopTotals([]);
            behavior.setData([]);
            behavior.setBottomTotals([]);
        } else {
            //important to set top totals first
            behavior.setTopTotals(topTotals);
            behavior.setData(people1);
            behavior.setBottomTotals(bottomTotals);
        }
    }

    behavior.setData(people1);

    grid.setColumnProperties(2, {
        backgroundColor: 'maroon',
        color: 'green'
    });

    //get the cell cellProvider for altering cell renderers
    var cellProvider = behavior.getCellProvider();

    //set the actual json row objects
    //setData(people); //see sampledata.js for the random data

    //make the first col fixed;
    //behavior.setFixedColumnCount(2);
    behavior.setFixedRowCount(2);

    // behavior.setHeaderColumnCount(1);
    // behavior.setHeaderRowCount(2);

    //behavior.setTopTotals(topTotals);
    //behavior.setBottomTotals(bottomTotals);

    grid.registerFormatter('USD', accounting.formatMoney);
    grid.registerFormatter('GBP', function(value) {
        return accounting.formatMoney(value, '€', 2, '.', ',');
    });

    // setInterval(function() {
    //     topTotals[1][5] = Math.round(Math.random()*100);
    //     behavior.changed();
    // }, 300);

    //lets set 2 rows of totals

    //sort ascending on the first column (first name)
    //behavior.toggleSort(0);

    var upDown = fin.Hypergrid.images['down-rectangle'];
    var upDownSpin = fin.Hypergrid.images['up-down-spin'];
    var downArrow = fin.Hypergrid.images.calendar;

    //all formatting and rendering per cell can be overridden in here
    cellProvider.getCell = function(config) {
        var renderer = cellProvider.cellCache.simpleCellRenderer;

        if (!config.isUserDataArea) {
            return renderer;
        }
        var x = config.x;
        var y = config.y;

        var upDownIMG = upDown;
        var upDownSpinIMG = upDownSpin;
        var downArrowIMG = downArrow;

        if (!grid.isEditable()) {
            upDownIMG = null;
            upDownSpinIMG = null;
            downArrowIMG = null;
        }

        var travel;

        config.halign = 'left';

        if (styleRowsFromData) {
            var hex = (155 + 10 * config.row.total_number_of_pets_owned).toString(16);
            config.backgroundColor = '#' + hex + hex + hex;
        } else {
            switch (y % 6) {
                case 5:
                case 0:
                case 1:
                    config.backgroundColor = '#e8ffe8';
                    config.font = 'italic x-small verdana';
                    if (config.color !== redIfStartsWithS) {
                        config.color = '#070';
                    }
                    break;

                case 2:
                case 3:
                case 4:
                    config.backgroundColor = 'white';
                    config.font = 'normal small garamond';
                    break;
            }
        }

        switch (x) {
            case 0:
            case 1:
            case 4:
            case 5:
                //we are a dropdown, lets provide a visual queue
                config.value = [null, config.value, upDownIMG];
        }

        switch (x) {
            case 1:
                renderer = cellProvider.cellCache.linkCellRenderer;
                break;

            case 2:
                config.halign = 'left';
                config.value = [null, config.value, upDownSpinIMG];
                break;

            case 3:
                if (!doAggregates) {
                    config.halign = 'left';
                    config.value = [null, config.value, downArrowIMG];
                }
                break;

            case 6:
                renderer = cellProvider.cellCache.buttonRenderer;
                break;

            case 7:
                travel = 60 + Math.round(config.value * 150 / 100000);
                config.backgroundColor = '#00' + travel.toString(16) + '00';
                config.color = '#FFFFFF';
                config.halign = 'right';
                break;

            case 8:
                travel = 105 + Math.round(config.value * 150 / 1000);
                config.backgroundColor = '#' + travel.toString(16) + '0000';
                config.color = '#FFFFFF';
                config.halign = 'right';
                break;
        }

        return renderer;
    };

    //lets override the cell editors, and configure the drop down lists
    function myCellEditors(x) {
        var editorType = editorTypes[x % editorTypes.length],
            cellEditor;

        if (editorType) {
            //cellEditor = this.grid.cellEditors[editorType];
            cellEditor = this.grid.createCellEditor(editorType);

            switch (x) {
                case 6:
                    cellEditor = null;
                    break;

                case 2:
                    cellEditor.input.setAttribute('min', 0);
                    cellEditor.input.setAttribute('max', 10);
                    cellEditor.input.setAttribute('step', 0.01);
                    break;
            }
        }

        return cellEditor;
    }

    dataModel.getCellEditorAt = myCellEditors;

// behavior.getCursorAt = function(x,y) {
//     if (x === 1) {
//         return 'pointer'
//     } else {
//         return null;
//     }
// };

    grid.addEventListener('fin-click', function(e) {
        var cell = e.detail.gridCell;
        if (vent) { console.log('fin-click cell:', cell); }
    });

    grid.addEventListener('fin-double-click', function(e) {
        var cell = e.detail.gridCell;
        var rowContext = behavior.getRow(cell.y);
        if (vent) { console.log('fin-double-click row-context:', rowContext); }
    });

    grid.addEventListener('fin-button-pressed', function(e) {
        var p = e.detail.gridCell;
        behavior.setValue(p.x, p.y, !behavior.getValue(p.x, p.y));
    });

    grid.addEventListener('fin-scroll-x', function(e) {
        if (vent) { console.log('fin-scroll-x ', e.detail.value); }
    });

    grid.addEventListener('fin-scroll-y', function(e) {
        if (vent) { console.log('fin-scroll-y', e.detail.value); }
    });

    grid.addProperties({
        readOnly: false
    });

    grid.addEventListener('fin-cell-enter', function(e) {
        var cell = e.detail.gridCell;
        //if (vent) { console.log('fin-cell-enter', cell.x, cell.y); }

        //how to set the tooltip....
        grid.setAttribute('title', 'fin-cell-enter(' + cell.x + ', ' + cell.y + ')');
    });

    grid.addEventListener('fin-set-totals-value', function(e) {
        var detail = e.detail,
            areas = detail.areas || ['top', 'bottom'];

        areas.forEach(function(area) {
            var methodName = 'get' + area[0].toUpperCase() + area.substr(1) + 'Totals',
                totalsRow = dataModel[methodName]();

            totalsRow[detail.y][detail.x] = detail.value;
        });

        grid.repaint();
    });

    grid.addEventListener('fin-filter-applied', function(e) {
        if (vent) { console.log('fin-filter-applied', e); }
    });

    /**
     * @summary Listen for certain key presses from grid or cell editor.
     * @desc NOTE: fincanvas's internal char map yields mixed case while fin-editor-key* events do not.
     * @return {boolean} Not handled.
     */
    function handleCursorKey(e) {
        var detail = e.detail;
        var key = String.fromCharCode(detail.key).toUpperCase();
        if (detail.ctrl) {
            if (detail.shift) {
                switch (key) {
                    case 'A': grid.selectToViewportCell(0, 0); break;
                    case 'S': grid.selectToFinalCell(); break;
                    case 'D': grid.selectToFinalCellOfCurrentRow(); break;
                    case 'F': grid.selectToFirstCellOfCurrentRow(); break;
                    default: return true;
                }
            } else {
                switch (key) {
                    case 'A': grid.selectViewportCell(0, 0); break;
                    case 'S': grid.selectFinalCell(); break;
                    case 'D': grid.selectFinalCellOfCurrentRow(); break;
                    case 'F': grid.selectFirstCellOfCurrentRow(); break;
                    default: return true;
                }
            }
            // break: switch statement handled it
            return false;
        } else {
            var dir = detail.shift ? -1 : +1;
            switch (key) {
                case '\t': grid.moveSingleSelect(dir, 0); break; // move LEFT one cell
                case '\r':
                case '\n': grid.moveSingleSelect(0, dir); break; // move UP one cell
                default: return true;
            }
            // break: switch statement handled it
            detail.primitiveEvent.preventDefault();  // prevent TAB from moving focus off the canvas element
            return false;
        }
        return true;
    }

    grid.addEventListener('fin-keydown', handleCursorKey);

    grid.addEventListener('fin-editor-keydown', function(e) {
        var detail = e.detail,
            ke = detail.keyEvent;

        // more detail, please
        detail.primitiveEvent = ke;
        detail.key = ke.keyCode;
        detail.shift = ke.shiftKey;

        handleCursorKey(e);
    });


    grid.addEventListener('fin-selection-changed', function(e) {

        //lets mirror the cell selection into the rows and or columns
        grid.selectRowsFromCells();
        //jsonGrid.selectColumnsFromCells();

        if (vent) { console.log('fin-selection-changed', grid.getSelectedRows(), grid.getSelectedColumns(), grid.getSelections()); }

        if (e.detail.selections.length === 0) {
            console.log('no selections');
            return;
        }

        console.log(grid.getSelectionMatrix());
        console.log(grid.getSelection());

        //to get the selected rows uncomment the below.....
        // console.log(jsonGrid.getRowSelectionMatrix());
        // console.log(jsonGrid.getRowSelection());

    });

    grid.addEventListener('fin-row-selection-changed', function(e) {
        if (vent) { console.log('fin-row-selection-changed', e.detail); }
        if (e.detail.rows.length === 0) {
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
        if (vent) { console.log('fin-column-selection-changed', e.detail); }

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

    grid.addEventListener('fin-editor-data-change', function(e) {
        if (vent) { console.log('fin-editor-data-change', e.detail); }

    });

    grid.addEventListener('fin-request-cell-edit', function(e) {
        if (vent) { console.log('fin-request-cell-edit', e); }
        //e.preventDefault(); //uncomment to cancel editor popping up
    });

    grid.addEventListener('fin-before-cell-edit', function(e) {
        if (vent) { console.log('fin-before-cell-edit', e); }
        //e.preventDefault(); //uncomment to cancel updating the model with the new data
    });

    grid.addEventListener('fin-after-cell-edit', function(e) {
        if (vent) { console.log('fin-after-cell-edit', e); }
    });

    grid.addEventListener('fin-editor-keyup', function(e) {
        if (vent) { console.log('fin-editor-keyup', e.detail); }
    });

    grid.addEventListener('fin-editor-keypress', function(e) {
        if (vent) { console.log('fin-editor-keypress', e.detail); }
    });

    grid.addEventListener('fin-editor-keydown', function(e) {
        if (vent) { console.log('fin-editor-keydown', e.detail); }
    });

    grid.addEventListener('fin-groups-changed', function(e) {
        if (vent) { console.log('fin-groups-changed', e.detail); }
    });

    grid.addEventListener('fin-context-menu', function(e) {
        var modelPoint = e.detail.gridCell;
        var headerRowCount = grid.getHeaderRowCount();
        if (vent) { console.log('fin-context-menu(' + modelPoint.x + ', ' + (modelPoint.y - headerRowCount) + ')'); }
    });

    var fields = behavior.getFields();
    var headers = behavior.getHeaders();

    console.log(headers);
    console.log(fields);

    toggleProps.forEach(function(prop) { addToggle(prop); });

    //setTimeout(function() {
    //
    //    behavior.setFields(['employed', 'income', 'travel', 'squareOfIncome']);
    //    behavior.setHeaders(['one', 'two', 'three', 'four']);
    //
    //    console.log(behavior.getHeaders());
    //    console.log(behavior.getFields());
    //
    //    console.log('visible rows = ' + jsonGrid.getVisibleRows());
    //    console.log('visible columns = ' + jsonGrid.getVisibleColumns());


        setTimeout(function() {

            //behavior.setFields(fields);
            //behavior.setHeaders(headers);

            console.log('mapping between indexes and column names');
            var fieldsMap = {};
            for (var i = 0; i < fields.length; i++) {
                fieldsMap[fields[i]] = i;
                console.log(i + ' <> ' + fields[i]);
            }

            var state = {
                columnIndexes: [
                    fieldsMap.last_name,
                    fieldsMap.total_number_of_pets_owned,
                    fieldsMap.birthDate,
                    fieldsMap.birthState,
                    // fieldsMap.residenceState,
                    fieldsMap.employed,
                    // fieldsMap.first_name,
                    fieldsMap.income,
                    fieldsMap.travel,
                    // fieldsMap.squareOfIncome
                ],

                rowHeights:{ 0: 40 },
                fixedColumnCount: 1,
                fixedRowCount: 2,

                showRowNumbers: true,
                showHeaderRow: true,
                showFilterRow: true,
                columnAutosizing: false,
                headerTextWrapping: true,

                filteringMode: 'onCommit', // vs. 'immediate' for every key press

                cellSelection: true,
                columnSelection: true,
                rowSelection: true
            };

            grid.setGroups([4, 0, 1]);

            grid.setState(state);

            behavior.setCellProperties(2, 16, {
                font: '10pt Tahoma',
                color: 'lightblue',
                backgroundColor: 'red',
                halign: 'left'
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
                singleRowSelectionMode: false,
                checkboxOnlyRowSelections: true
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

//                behavior.setCellProperties(2,0,
//                    {
//                        font: '10pt Tahoma',
//                        color: 'red',
//                        backgroundColor: 'lightblue',
//                        halign: 'left'
//                    });

            behavior.setColumnProperties(0, {
                color: redIfStartsWithS,
                columnHeaderBackgroundColor: '#142B6F', //dark blue
                columnHeaderColor: 'white'
            });

            behavior.setColumnProperties(0, {
                autopopulateEditor: true,
                link: true
            });

            behavior.setColumnProperties(1, {
                autopopulateEditor: true
            });

            behavior.setColumnProperties(3, {
                format: 'date',
                strikeThrough: true
            });

            behavior.setColumnProperties(4, {
                autopopulateEditor: true
            });

            behavior.setColumnProperties(5, {
                autopopulateEditor: true
            });

            behavior.setColumnProperties(7, {
                format: 'USD'
            });

            behavior.setColumnProperties(8, {
                format: 'GBP'
            });

            console.log(behavior.getHeaders());
            console.log(behavior.getFields());

            console.log('visible rows = ' + grid.getVisibleRows());
            console.log('visible columns = ' + grid.getVisibleColumns());

            //see myThemes.js file for how to create a theme
            //jsonGrid.addProperties(myThemes.one);
            //jsonGrid.addProperties(myThemes.two);
            //jsonGrid.addProperties(myThemes.three);

            grid.takeFocus();

            // turn on aggregates as per checkbox default setting (see toggleProps[])
            if (document.querySelector('#aggregates').checked) {
                behavior.setAggregates(aggregates);
            }

            window.a = dataModel.analytics;

        }, 50);

    //});

// var eventNames = [
//     'dragstart',
//     'drag',
//     'mousemove',
//     'mousedown',
//     'dragend',
//     'mouseup',
//     'mouseout',
//     'wheelmoved',
//     'click',
//     'release',
//     'flick',
//     'trackstart',
//     'track',
//     'trackend',
//     'hold',
//     'holdpulse',
//     'tap',
//     'dblclick',
//     'keydown',
//     'keyup',
//     'focus-gained',
//     'focus-lost',
//     'context-menu'
// ];

// eventNames.forEach(function(name) {
//     jsonGrid.canvas.addEventListener('fin-canvas-' + name, function(e) {
//         console.log(e.type);
//     });
// });

// Some DOM support functions...
// Besides the canvas, this test harness only has a handful of buttons and checkboxes.
// The following functions service these controls.

    function addToggle(ctrlGroup) {
        var input, label,
            dashboard = document.getElementById('dashboard'),
            container = document.createElement('div');

        container.className = 'ctrl-group';

        if (ctrlGroup.label) {
            label = document.createElement('span');
            label.innerHTML = ctrlGroup.label;
            container.appendChild(label);
        }

        ctrlGroup.ctrls.forEach(function(ctrl) {
            var tooltip = 'Property name: ' + ctrl.value;
            if (ctrl.tooltip) { tooltip += '\n\n' + ctrl.tooltip; }

            input = document.createElement('input');
            input.type = 'checkbox';
            input.value = ctrl.value;
            input.id = ctrl.value;
            input.addEventListener('click', ctrl.setter || setProp);

            if ('checked' in ctrl) {
                input.checked = ctrl.checked;
            } else {
                input.checked = grid.resolveProperty(ctrl.value);
            }

            label = document.createElement('label');
            label.title = tooltip;
            label.appendChild(input);
            label.appendChild(document.createTextNode(' ' + (ctrl.label || ctrl.value)));

            container.appendChild(label);
        });

        dashboard.appendChild(container);
    }

    function setProp() { // standard checkbox click handler
        var hash = {}, depth = hash;
        var keys = this.value.split('.');

        while (keys.length > 1) { depth = depth[keys.shift()] = {}; }
        depth[keys.shift()] = this.checked;

        grid.takeFocus();
        grid.addProperties(hash);
        grid.behaviorChanged();
        grid.repaint();
    }

    function setSelectionProp() { // alternate checkbox click handler
        grid.selectionModel.clear();
        dataModel.clearSelectedData();
        setProp.call(this);
    }

    function resetFilter() {
        if (confirm('Filter reset required...')) {
            setProp.call(this);
            grid.setGlobalFilter(fin.Hypergrid.behaviors.Behavior.prototype.getNewFilter.call(grid.behavior));
        } else {
            this.checked = !this.checked; // user canceled so put checkbox back
        }
    }

    function redIfStartsWithS(config) {
        //does the data start with an 'S'?
        var data = config.value[1];
        return data && data[0] === 'S' ? 'red' : '#191919';
    }
};
