/* eslint-env browser */

/* globals fin, people1, people2, accounting, vent */

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
                { value: '(Global setting)', label: 'ignore case', setter: toggleCaseSensitivity }
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
    console.log(fin.Hypergrid.test.groups.equality.label);
    var jsonGrid = window.g = new fin.Hypergrid('div#json-example', {
            data: people1,
            margin: { bottom: '17px' }
        }),
        jsonModel = window.b = jsonGrid.behavior,
        dataModel = window.m = jsonModel.dataModel;

    setFilter();

    function setFilter() {
        if (jsonModel.columns.length) {
            // recreate the filter but with hierarchical schema organized by alias
            var CustomFilter = fin.Hypergrid.CustomFilter;
            var newSchema = CustomFilter.util.organizeByAlias(
                CustomFilter.util.getDefault(jsonModel),
                /^(one|two|three|four|five|six|seven|eight)/i
            );
            jsonGrid.setGlobalFilter(new CustomFilter({ schema: newSchema }));
        }
    }

    function setData(data) {
        jsonModel.setData(data);
        jsonModel.setColumnProperties(0, {
            autopopulateEditor: true,
        });
        setFilter();
    }

    [
        { label: 'Column Picker&hellip;', onclick: toggleDialog.bind(this, 'ColumnPicker') },
        { label: 'Manage Filters&hellip;', onclick: toggleDialog.bind(this, 'ManageFilters') },
        { label: 'toggle empty data', onclick: toggleEmptyData },
        { label: 'set data 1 (5000 rows)', onclick: setData.bind(this, people1) },
        { label: 'set data 2 (10000 rows)', onclick: setData.bind(this, people2) },
        { label: 'reset', onclick: jsonGrid.reset }

    ].forEach(function(item) {
        var button = document.createElement('button');
        button.innerHTML = item.label;
        button.onclick = item.onclick;
        document.getElementById('dashboard').appendChild(button);
    });

    // add a column filter subexpression containing a single condition purely for demo purposes
    if (false) { // eslint-disable-line no-constant-condition
        jsonGrid.getGlobalFilter().columnFilters.add({
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
        rollups = jsonModel.aggregations,
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
        jsonModel.setAggregates(this.checked ? aggregates : []);
    }

    var styleRowsFromData;
    function toggleRowStylingMethod() {
        styleRowsFromData = !styleRowsFromData;
    }

    function toggleCaseSensitivity() {
        jsonGrid.setGlobalFilterCaseSensitivity(!this.checked);
        dataModel.applyAnalytics();
    }

    function toggleDialog(dialogName, evt) {
        var options = {
            //container: document.getElementById('dialog-container'),
            settings: false
        };
        jsonGrid.toggleDialog(dialogName, options);
        evt.stopPropagation(); // todo: without this other browsers get the event.... HOW?
    }
/*
    var applyAggregates = document.querySelector('input[type=checkbox][value="Apply aggregates"]');

    window.toggleAutosortGrouping = function() {
        if (!applyAggregates.checked) {
            applyAggregates.dispatchEvent(new MouseEvent('click'));
        }
        jsonModel.setAggregates(aggregates);
        jsonModel.setGroups([1, 2, 3, 4, 5, 6, 7]);
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
            jsonModel.setTopTotals([]);
            jsonModel.setData([]);
            jsonModel.setBottomTotals([]);
        } else {
            //important to set top totals first
            jsonModel.setTopTotals(topTotals);
            jsonModel.setData(people1);
            jsonModel.setBottomTotals(bottomTotals);
        }
        setFilter();
    }

    setData(people1);

    jsonGrid.setColumnProperties(2, {
        backgroundColor: 'maroon',
        color: 'green'
    });

    //get the cell cellProvider for altering cell renderers
    var cellProvider = jsonModel.getCellProvider();

    //set the actual json row objects
    //setData(people); //see sampledata.js for the random data

    //make the first col fixed;
    //jsonModel.setFixedColumnCount(2);
    jsonModel.setFixedRowCount(2);

    // jsonModel.setHeaderColumnCount(1);
    // jsonModel.setHeaderRowCount(2);

    //jsonModel.setTopTotals(topTotals);
    //jsonModel.setBottomTotals(bottomTotals);

    jsonGrid.registerFormatter('USD', accounting.formatMoney);
    jsonGrid.registerFormatter('GBP', function(value) {
        return accounting.formatMoney(value, '€', 2, '.', ',');
    });

    // setInterval(function() {
    //     topTotals[1][5] = Math.round(Math.random()*100);
    //     jsonModel.changed();
    // }, 300);

    //lets set 2 rows of totals

    //sort ascending on the first column (first name)
    //jsonModel.toggleSort(0);

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

        if (!jsonGrid.isEditable()) {
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

// jsonModel.getCursorAt = function(x,y) {
//     if (x === 1) {
//         return 'pointer'
//     } else {
//         return null;
//     }
// };

    jsonGrid.addEventListener('fin-click', function(e) {
        var cell = e.detail.gridCell;
        if (vent) { console.log('fin-click cell:', cell); }
    });

    jsonGrid.addEventListener('fin-double-click', function(e) {
        var cell = e.detail.gridCell;
        var rowContext = jsonModel.getRow(cell.y);
        if (vent) { console.log('fin-double-click row-context:', rowContext); }
    });

    jsonGrid.addEventListener('fin-button-pressed', function(e) {
        var p = e.detail.gridCell;
        jsonModel.setValue(p.x, p.y, !jsonModel.getValue(p.x, p.y));
    });

    jsonGrid.addEventListener('fin-scroll-x', function(e) {
        if (vent) { console.log('fin-scroll-x ', e.detail.value); }
    });

    jsonGrid.addEventListener('fin-scroll-y', function(e) {
        if (vent) { console.log('fin-scroll-y', e.detail.value); }
    });

    jsonGrid.addProperties({
        readOnly: false
    });

    jsonGrid.addEventListener('fin-cell-enter', function(e) {
        var cell = e.detail.gridCell;
        //if (vent) { console.log('fin-cell-enter', cell.x, cell.y); }

        //how to set the tooltip....
        jsonGrid.setAttribute('title', 'fin-cell-enter(' + cell.x + ', ' + cell.y + ')');
    });

    jsonGrid.addEventListener('fin-set-totals-value', function(e) {
        var detail = e.detail,
            areas = detail.areas || ['top', 'bottom'];

        areas.forEach(function(area) {
            var methodName = 'get' + area[0].toUpperCase() + area.substr(1) + 'Totals',
                totalsRow = dataModel[methodName]();

            totalsRow[detail.y][detail.x] = detail.value;
        });

        jsonGrid.repaint();
    });

    jsonGrid.addEventListener('fin-filter-applied', function(e) {
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
                    case 'A': jsonGrid.selectToViewportCell(0, 0); break;
                    case 'S': jsonGrid.selectToFinalCell(); break;
                    case 'D': jsonGrid.selectToFinalCellOfCurrentRow(); break;
                    case 'F': jsonGrid.selectToFirstCellOfCurrentRow(); break;
                    default: return true;
                }
            } else {
                switch (key) {
                    case 'A': jsonGrid.selectViewportCell(0, 0); break;
                    case 'S': jsonGrid.selectFinalCell(); break;
                    case 'D': jsonGrid.selectFinalCellOfCurrentRow(); break;
                    case 'F': jsonGrid.selectFirstCellOfCurrentRow(); break;
                    default: return true;
                }
            }
            // break: switch statement handled it
            return false;
        } else {
            var dir = detail.shift ? -1 : +1;
            switch (key) {
                case '\t': jsonGrid.moveSingleSelect(dir, 0); break; // move LEFT one cell
                case '\r':
                case '\n': jsonGrid.moveSingleSelect(0, dir); break; // move UP one cell
                default: return true;
            }
            // break: switch statement handled it
            detail.primitiveEvent.preventDefault();  // prevent TAB from moving focus off the canvas element
            return false;
        }
        return true;
    }

    jsonGrid.addEventListener('fin-keydown', handleCursorKey);

    jsonGrid.addEventListener('fin-editor-keydown', function(e) {
        var detail = e.detail,
            ke = detail.keyEvent;

        // more detail, please
        detail.primitiveEvent = ke;
        detail.key = ke.keyCode;
        detail.shift = ke.shiftKey;

        handleCursorKey(e);
    });


    jsonGrid.addEventListener('fin-selection-changed', function(e) {

        //lets mirror the cell selection into the rows and or columns
        jsonGrid.selectRowsFromCells();
        //jsonGrid.selectColumnsFromCells();

        if (vent) { console.log('fin-selection-changed', jsonGrid.getSelectedRows(), jsonGrid.getSelectedColumns(), jsonGrid.getSelections()); }

        if (e.detail.selections.length === 0) {
            console.log('no selections');
            return;
        }

        console.log(jsonGrid.getSelectionMatrix());
        console.log(jsonGrid.getSelection());

        //to get the selected rows uncomment the below.....
        // console.log(jsonGrid.getRowSelectionMatrix());
        // console.log(jsonGrid.getRowSelection());

    });

    jsonGrid.addEventListener('fin-row-selection-changed', function(e) {
        if (vent) { console.log('fin-row-selection-changed', e.detail); }
        if (e.detail.rows.length === 0) {
            console.log('no rows selected');
            return;
        }
        //we have a function call to create the selection matrix because
        //we don't want to create alot of needless garbage if the user
        //is just navigating around
        console.log(jsonGrid.getRowSelectionMatrix());
        console.log(jsonGrid.getRowSelection());
    });

    jsonGrid.addEventListener('fin-column-selection-changed', function(e) {
        if (vent) { console.log('fin-column-selection-changed', e.detail); }

        if (e.detail.columns.length === 0) {
            console.log('no rows selected');
            return;
        }
        //we have a function call to create the selection matrix because
        //we don't want to create alot of needless garbage if the user
        //is just navigating around
        console.log(jsonGrid.getColumnSelectionMatrix());
        console.log(jsonGrid.getColumnSelection());
    });

    jsonGrid.addEventListener('fin-editor-data-change', function(e) {
        if (vent) { console.log('fin-editor-data-change', e.detail); }

    });

    jsonGrid.addEventListener('fin-request-cell-edit', function(e) {
        if (vent) { console.log('fin-request-cell-edit', e); }
        //e.preventDefault(); //uncomment to cancel editor popping up
    });

    jsonGrid.addEventListener('fin-before-cell-edit', function(e) {
        if (vent) { console.log('fin-before-cell-edit', e); }
        //e.preventDefault(); //uncomment to cancel updating the model with the new data
    });

    jsonGrid.addEventListener('fin-after-cell-edit', function(e) {
        if (vent) { console.log('fin-after-cell-edit', e); }
    });

    jsonGrid.addEventListener('fin-editor-keyup', function(e) {
        if (vent) { console.log('fin-editor-keyup', e.detail); }
    });

    jsonGrid.addEventListener('fin-editor-keypress', function(e) {
        if (vent) { console.log('fin-editor-keypress', e.detail); }
    });

    jsonGrid.addEventListener('fin-editor-keydown', function(e) {
        if (vent) { console.log('fin-editor-keydown', e.detail); }
    });

    jsonGrid.addEventListener('fin-groups-changed', function(e) {
        if (vent) { console.log('fin-groups-changed', e.detail); }
    });

    jsonGrid.addEventListener('fin-context-menu', function(e) {
        var modelPoint = e.detail.gridCell;
        var headerRowCount = jsonGrid.getHeaderRowCount();
        if (vent) { console.log('fin-context-menu(' + modelPoint.x + ', ' + (modelPoint.y - headerRowCount) + ')'); }
    });

    var fields = jsonModel.getFields();
    var headers = jsonModel.getHeaders();

    console.log(headers);
    console.log(fields);

    toggleProps.forEach(function(prop) { addToggle(prop); });

    //setTimeout(function() {
    //
    //    jsonModel.setFields(['employed', 'income', 'travel', 'squareOfIncome']);
    //    jsonModel.setHeaders(['one', 'two', 'three', 'four']);
    //
    //    console.log(jsonModel.getHeaders());
    //    console.log(jsonModel.getFields());
    //
    //    console.log('visible rows = ' + jsonGrid.getVisibleRows());
    //    console.log('visible columns = ' + jsonGrid.getVisibleColumns());


        setTimeout(function() {

            //jsonModel.setFields(fields);
            //jsonModel.setHeaders(headers);

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

                cellSelection: true,
                columnSelection: true,
                rowSelection: true
            };

            jsonGrid.setGroups([4, 0, 1]);

            jsonGrid.setState(state);

            jsonModel.setCellProperties(2, 16, {
                font: '10pt Tahoma',
                color: 'lightblue',
                backgroundColor: 'red',
                halign: 'left'
            });

            jsonGrid.addProperties({
                scrollbarHoverOff: 'visible',
                scrollbarHoverOver: 'visible',
                columnHeaderBackgroundColor: 'pink',
                repaintIntervalRate: 60
            });

            jsonGrid.addProperties({
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

//                jsonModel.setCellProperties(2,0,
//                    {
//                        font: '10pt Tahoma',
//                        color: 'red',
//                        backgroundColor: 'lightblue',
//                        halign: 'left'
//                    });

            jsonModel.setColumnProperties(0, {
                color: redIfStartsWithS,
                columnHeaderBackgroundColor: '#142B6F', //dark blue
                columnHeaderColor: 'white'
            });

            jsonModel.setColumnProperties(0, {
                autopopulateEditor: true,
                link: true
            });

            jsonModel.setColumnProperties(1, {
                autopopulateEditor: true
            });

            jsonModel.setColumnProperties(3, {
                format: 'date',
                strikeThrough: true
            });

            jsonModel.setColumnProperties(4, {
                autopopulateEditor: true
            });

            jsonModel.setColumnProperties(5, {
                autopopulateEditor: true
            });

            jsonModel.setColumnProperties(7, {
                format: 'USD'
            });

            jsonModel.setColumnProperties(8, {
                format: 'GBP'
            });

            console.log(jsonModel.getHeaders());
            console.log(jsonModel.getFields());

            console.log('visible rows = ' + jsonGrid.getVisibleRows());
            console.log('visible columns = ' + jsonGrid.getVisibleColumns());

            //see myThemes.js file for how to create a theme
            //jsonGrid.addProperties(myThemes.one);
            //jsonGrid.addProperties(myThemes.two);
            //jsonGrid.addProperties(myThemes.three);

            jsonGrid.takeFocus();

            // turn on aggregates as per checkbox default setting (see toggleProps[])
            if (document.querySelector('#aggregates').checked) {
                jsonModel.setAggregates(aggregates);
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
            input = document.createElement('input');
            input.type = 'checkbox';
            input.value = ctrl.value;
            input.id = ctrl.value;
            input.addEventListener('click', ctrl.setter || setProp);

            if ('checked' in ctrl) {
                input.checked = ctrl.checked;
            } else {
                input.checked = jsonGrid.resolveProperty(ctrl.value);
            }

            label = document.createElement('label');
            label.title = 'property name: ' + ctrl.value;
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

        jsonGrid.takeFocus();
        jsonGrid.addProperties(hash);
        jsonGrid.behaviorChanged();
        jsonGrid.repaint();
    }

    function setSelectionProp() { // alternate checkbox click handler
        jsonGrid.selectionModel.clear();
        dataModel.clearSelectedData();
        setProp.call(this);
    }

    function redIfStartsWithS(config) {
        //does the data start with an 'S'?
        return config.value[1][0] === 'S' ? 'red' : '#191919';
    }

};
