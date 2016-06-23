/* eslint-env browser */

/* globals fin, people1, people2, treedata, vent */

/* eslint-disable no-alert, no-unused-vars */

'use strict';

window.onload = function() {

    // List of properties to show as checkboxes in this demo's "dashboard"
    var toggleProps = [
        {
            label: 'Row styling',
            ctrls: [
                { name: '(Global setting)', label: 'base on data', setter: toggleRowStylingMethod }
            ]
        }, {
            label: 'Grouping',
            ctrls: [
                { name: 'treeview', checked: false, setter: toggleTreeview },
                { name: 'aggregates', checked: false, setter: toggleAggregates }
            ]
        }, {
            label: 'Column header rows',
            ctrls: [
                { name: 'showHeaderRow', label: 'header' }, // default "setter" is `setProp`
                { name: 'showFilterRow', label: 'filter' }
            ]
        },
        {
            label: 'Hover highlights',
            ctrls: [
                { name: 'hoverCellHighlight.enabled', label: 'cell' },
                { name: 'hoverRowHighlight.enabled', label: 'row' },
                { name: 'hoverColumnHighlight.enabled', label: 'column' }
            ]
        }, {
            label: 'Cell editing',
            ctrls: [
                { name: 'editable' },
                { name: 'editOnDoubleClick', label: 'requires double-click' },
                { name: 'editOnKeydown', label: 'type to edit' }
            ]
        }, {
            label: 'Row selection',
            ctrls: [
                { name: 'checkboxOnlyRowSelections', label: 'by row handles only', setter: setSelectionProp },
                { name: 'singleRowSelectionMode', label: 'one row at a time', setter: setSelectionProp }
            ]
        }, {
            label: 'Filtering',
            ctrls: [
                {
                    name: '(Global setting)',
                    label: 'case-sensitive operand',
                    checked: true,
                    tooltip: 'Check to match case of operand and data in string comparisons. This is a shared property and instantly affects all grids.',
                    setter: toggleCaseSensitivity
                },
                {
                    name: 'filterCaseSensitiveColumnNames',
                    label: 'case-sensitive schema',
                    tooltip: 'Check to match case of filter column names. Resets filter.',
                    setter: resetFilterWithNewPropValue
                },
                {
                    name: 'filterResolveAliases',
                    label: 'resolve aliases',
                    tooltip: 'Check to allow column headers to be used in filters in addition to column names. Resets filter.',
                    setter: resetFilterWithNewPropValue
                },
                {
                    type: 'text',
                    name: 'filterDefaultColumnFilterOperator',
                    label: 'Default column filter operator:',
                    tooltip: 'May be overridden by column schema\'s `defaultOp`. Blank means use the fall-back default ("=").',
                    setter: resetFilterWithNewPropValue
                }
            ]
        }
    ];

    // restore previous "opinionated" headerify behavior
    var headerify = fin.Hypergrid.analytics.util.headerify;
    headerify.transform = headerify.capitalize;

    function derivedPeopleSchema(columns) {
        // create a hierarchical schema organized by alias
        var factory = new fin.Hypergrid.ColumnSchemaFactory(columns);
        factory.organize(/^(one|two|three|four|five|six|seven|eight)/i, { key: 'alias' });
        var columnSchema = factory.lookup('last_name');
        if (columnSchema) {
            columnSchema.defaultOp = 'IN';
        }
        //factory.lookup('birthState').opMenu = ['>', '<'];
        return factory.schema;
    }

    var customSchema = [
        { name: 'last_name', type: 'number', opMenu: ['=', '<', '>'] },
        { name: 'total_number_of_pets_owned', type: 'number' },
        'height',
        'birthDate',
        'birthState',
        'employed',
        'income',
        'travel'
    ];

    var peopleSchema = customSchema;  // or try setting to derivedPeopleSchema

    var gridOptions = {
            data: people1,
            schema: peopleSchema,
            margin: { bottom: '17px' }
        },
        grid = window.g = new fin.Hypergrid('div#json-example', gridOptions),
        behavior = window.b = grid.behavior,
        dataModel = window.m = behavior.dataModel,
        idx = behavior.columnEnum;

    console.log('Fields:');  console.dir(behavior.dataModel.getFields());
    console.log('Headers:'); console.dir(behavior.dataModel.getHeaders());
    console.log('Indexes:'); console.dir(idx);

    // Preset a default dialog options object. Used by call to toggleDialog('ColumnPicker') from features/ColumnPicker.js and by toggleDialog() defined herein.
    grid.setDialogOptions({
        //container: document.getElementById('dialog-container'),
        settings: false
    });

    [
        { label: 'Column Picker&hellip;', onclick: toggleDialog.bind(this, 'ColumnPicker') },
        { label: 'Manage Filters&hellip;', onclick: toggleDialog.bind(this, 'ManageFilters') },
        { label: 'toggle empty data', onclick: toggleEmptyData },
        { label: 'set data 1 (5000 rows)', onclick: setData.bind(null, people1) },
        { label: 'set data 2 (10000 rows)', onclick: setData.bind(null, people2) },
        { label: 'set data 3 (treedata)', onclick: function() {
            // Optional: Clone the default pipeline. If you don't do this, the mutated pipeline will be shared among all grid instances
            dataModel.pipeline = Object.getPrototypeOf(dataModel).pipeline.slice();

            // Insert the treeview after source
            var pipe = { type: 'DataSourceTreeview' };
            dataModel.addPipe(pipe, 'JSDataSource');

            // Reset the pipeline, pointing at some tree (self-joined) data
            setData(treedata);

            // Only show the data columns; don't show the ID and parentID columns
            grid.setState({ columnIndexes: [ idx.STATE, idx.LATITUDE, idx.LONGITUDE ], checkboxOnlyRowSelections: true });
        } },
        { label: 'reset', onclick: grid.reset.bind(grid)}

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

    //functions for showing the grouping/rollup capabilities
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

    function toggleTreeview() {
        var treeViewOptions = this.checked && { treeColumnName: 'State'};
        behavior.setRelation(treeViewOptions);
    }

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

    var dataset;

    function setData(data, options) {
        options = options || {};
        if (data === people1 || data === people2) {
            options.schema = peopleSchema;
        }
        dataset = data;
        behavior.setData(data, options);
        idx = behavior.columnEnum;
    }

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
        emptyData = !emptyData;
        if (emptyData) {
            //important to set top totals first
            behavior.setTopTotals([]);
            setData([]);
            behavior.setBottomTotals([]);
        } else {
            //important to set top totals first
            behavior.setTopTotals(topTotals);
            setData(people1);
            behavior.setBottomTotals(bottomTotals);
        }
    }

    setData(people1);

    grid.setColumnProperties(2, {
        backgroundColor: 'maroon',
        color: 'green'
    });

    //set the actual json row objects
    //setData(people); //see sampledata.js for the random data

    //make the first col fixed;
    //behavior.setFixedColumnCount(2);
    behavior.setFixedRowCount(2);

    // behavior.setHeaderColumnCount(1);
    // behavior.setHeaderRowCount(2);

    //behavior.setTopTotals(topTotals);
    //behavior.setBottomTotals(bottomTotals);

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

    // CUSTOM CELL RENDERER
    var REGEXP_CSS_HEX6 = /^#(..)(..)(..)$/,
        REGEXP_CSS_RGB = /^rgba\((\d+),(\d+),(\d+),\d+\)$/;

    function paintSparkRating(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height,
            options = config.value,
            domain = options.domain || config.domain || 100,
            sizeFactor = options.sizeFactor || config.sizeFactor || 0.65,
            darkenFactor = options.darkenFactor || config.darkenFactor || 0.75,
            color = options.color || config.color || 'gold',
            stroke = this.stroke = color === this.color ? this.stroke : getDarkenedColor(gc, this.color = color, darkenFactor),
            bgColor = config.isSelected ? (options.bgSelColor || config.bgSelColor) : (options.bgColor || config.bgColor),
            fgColor = config.isSelected ? (options.fgSelColor || config.fgSelColor) : (options.fgColor || config.fgColor),
            shadowColor = options.shadowColor || config.shadowColor || 'transparent',
            font = options.font || config.font || '11px verdana',
            middle = height / 2,
            diameter = sizeFactor * height,
            outerRadius = sizeFactor * middle,
            val = Number(options.val),
            points = this.points;

        if (!points) {
            var innerRadius = 3 / 7 * outerRadius;
            points = this.points = [];
            for (var i = 5, pi = Math.PI / 2, incr = Math.PI / 5; i; --i, pi += incr) {
                points.push({
                    x: outerRadius * Math.cos(pi),
                    y: middle - outerRadius * Math.sin(pi)
                });
                pi += incr;
                points.push({
                    x: innerRadius * Math.cos(pi),
                    y: middle - innerRadius * Math.sin(pi)
                });
            }
            points.push(points[0]); // close the path
        }

        gc.shadowColor = 'transparent';

        gc.lineJoin = 'round';
        gc.beginPath();
        for (var j = 5, sx = x + 5 + outerRadius; j; --j, sx += diameter) {
            points.forEach(function(point, index) { // eslint-disable-line
                gc[index ? 'lineTo' : 'moveTo'](sx + point.x, y + point.y); // eslint-disable-line
            }); // eslint-disable-line
        }
        gc.closePath();

        val = val / domain * 5;

        gc.fillStyle = color;
        gc.save();
        gc.clip();
        gc.fillRect(x + 5, y,
            (Math.floor(val) + 0.25 + val % 1 * 0.5) * diameter, // adjust width to skip over star outlines and just meter their interiors
            height);
        gc.restore(); // remove clipping region

        gc.strokeStyle = stroke;
        gc.lineWidth = 1;
        gc.stroke();

        if (fgColor && fgColor !== 'transparent') {
            gc.fillStyle = fgColor;
            gc.font = '11px verdana';
            gc.textAlign = 'right';
            gc.textBaseline = 'middle';
            gc.shadowColor = shadowColor;
            gc.shadowOffsetX = gc.shadowOffsetY = 1;
            gc.fillText(val.toFixed(1), x + width + 10, y + height / 2);
        }
    }

    function getDarkenedColor(gc, color, factor) {
        var rgba = getRGBA(gc, color);
        return 'rgba(' + Math.round(factor * rgba[0]) + ',' + Math.round(factor * rgba[1]) + ',' + Math.round(factor * rgba[2]) + ',' + (rgba[3] || 1) + ')';
    }

    function getRGBA(gc, colorSpec) {
        // Normalize variety of CSS color spec syntaxes to one of two
        gc.fillStyle = colorSpec;

        var rgba = colorSpec.match(REGEXP_CSS_HEX6);
        if (rgba) {
            rgba.shift(); // remove whole match
            rgba.forEach(function(val, index) {
                rgba[index] = parseInt(val, 16);
            });
        } else {
            rgba = colorSpec.match(REGEXP_CSS_RGB);
            if (!rgba) {
                throw 'Unexpected format getting CanvasRenderingContext2D.fillStyle';
            }
            rgba.shift(); // remove whole match
        }

        return rgba;
    }


    //Extend HyperGrid's base Renderer
    var sparkStarRatingRenderer = grid.cellRenderers.get('emptycell').constructor.extend({
        paint: paintSparkRating
    });

    //Register your renderer
    grid.cellRenderers.add('Starry', sparkStarRatingRenderer);

    // END OF CUSTOM CELL RENDERER

    //all formatting and rendering per cell can be overridden in here
    dataModel.getCell = function(config, rendererName) {
        if (config.isUserDataArea) {
            var n, hex;
            var x = config.x;
            var y = config.y;

            config.halign = 'left';

            if (dataset === treedata) {
                n = behavior.getRow(y).__DEPTH;
                hex = n ? (105 + 75 * n).toString(16) : '00';
                config.backgroundColor = '#' + hex + hex + hex;
                config.color = n ? 'black' : 'white';
            } else {
                var upDownIMG = upDown;
                var upDownSpinIMG = upDownSpin;
                var downArrowIMG = downArrow;

                if (!grid.isEditable()) {
                    upDownIMG = null;
                    upDownSpinIMG = null;
                    downArrowIMG = null;
                }

                var travel;

                if (styleRowsFromData) {
                    n = behavior.getColumn(idx.TOTAL_NUMBER_OF_PETS_OWNED).getValue(y);
                    hex = (155 + 10 * (n % 11)).toString(16);
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
                    case idx.LAST_NAME:
                    case idx.FIRST_NAME:
                    case idx.BIRTH_STATE:
                    case idx.RESIDENCE_STATE:
                        //we are a dropdown, lets provide a visual queue
                        config.value = [null, config.value, upDownIMG];
                }

                switch (x) {
                    case idx.LAST_NAME:
                        config.link = true;
                        break;

                    case idx.TOTAL_NUMBER_OF_PETS_OWNED:
                        config.halign = 'center';
                        //config.value = [null, config.value, upDownSpinIMG];
                        break;

                    case idx.BIRTH_TIME:
                    case idx.HEIGHT:
                        config.halign = 'right';
                        break;

                    case idx.BIRTH_DATE:
                        if (!doAggregates) {
                            config.halign = 'left';
                            config.value = [null, config.value, downArrowIMG];
                        }
                        break;

                    case idx.EMPLOYED:
                        rendererName = 'button';
                        break;

                    case idx.INCOME:
                        travel = 60 + Math.round(config.value * 150 / 100000);
                        config.backgroundColor = '#00' + travel.toString(16) + '00';
                        config.color = '#FFFFFF';
                        config.halign = 'right';
                        break;

                    case idx.TRAVEL:
                        travel = 105 + Math.round(config.value * 150 / 1000);
                        config.backgroundColor = '#' + travel.toString(16) + '0000';
                        config.color = '#FFFFFF';
                        config.halign = 'right';
                        break;
                }

                //Testing
                if (x === idx.TOTAL_NUMBER_OF_PETS_OWNED) {
                    /*
                     * Be sure to adjust the dataset to the appropriate type and shape in widedata.js
                     */

                    //return simpleCell; //WORKS
                    //return emptyCell; //WORKS
                    //return buttonCell; //WORKS
                    //return errorCell; //WORKS: Noted that any error in this function steals the main thread by recursion
                    //return sparkLineCell; // WORKS
                    //return sparkBarCell; //WORKS
                    //return sliderCell; //WORKS
                    //return treeCell; //Need to figure out data shape to test


                    /*
                     * Test of Customized Renderer
                     */
                    // if (starry){
                    //     config.domain = 5; // default is 100
                    //     config.sizeFactor =  0.65; // default is 0.65; size of stars as fraction of height of cell
                    //     config.darkenFactor = 0.75; // default is 0.75; star stroke color as fraction of star fill color
                    //     config.color = 'gold'; // default is 'gold'; star fill color
                    //     config.fgColor =  'grey'; // default is 'transparent' (not rendered); text color
                    //     config.fgSelColor = 'yellow'; // default is 'transparent' (not rendered); text selection color
                    //     config.bgColor = '#404040'; // default is 'transparent' (not rendered); background color
                    //     config.bgSelColor = 'grey'; // default is 'transparent' (not rendered); background selection color
                    //     config.shadowColor = 'transparent'; // default is 'transparent'
                    //     return starry;
                    // }
                }
            }
        }

        return grid.cellRenderers.get(rendererName);
    };

    var footInchPattern = /^\s*((((\d+)')?\s*((\d+)")?)|\d+)\s*$/;
    var footInchLocalizer = {
        format: function(value) {
            if (value != null) {
                var feet = Math.floor(value / 12);
                value = (feet ? feet + '\'' : '') + ' ' + (value % 12) + '"';
            } else {
                value = null;
            }
            return value;
        },
        parse: function(str) {
            var inches, feet,
                parts = str.match(footInchPattern);
            if (parts) {
                feet = parts[4];
                inches = parts[6];
                if (feet === undefined && inches === undefined) {
                    inches = Number(parts[1]);
                } else {
                    feet = Number(feet || 0);
                    inches = Number(inches || 0);
                    inches = 12 * feet + inches;
                }
            } else {
                inches = 0;
            }
            return inches;
        }
    };

    grid.localization.add('foot', footInchLocalizer);

    grid.localization.add('singdate', new grid.localization.DateFormatter('zh-SG'));

    grid.localization.add('pounds', new grid.localization.NumberFormatter('en-US', {
        style: 'currency',
        currency: 'USD'
    }));

    grid.localization.add('francs', new grid.localization.NumberFormatter('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }));

    var CellEditor = grid.cellEditors.get('celleditor');
    var Textfield = grid.cellEditors.get('textfield');

    var ColorText = Textfield.extend('colorText', {
        template: '<input type="text" style="color:{{textColor}}">'
    });

    grid.cellEditors.add(ColorText);

    var NOON = 12 * 60;

    var Time = Textfield.extend('Time', {
        template: [
'<div style="background-color:white; text-align:right; font-size:10px; padding-right:4px; font-weight:bold; border:1px solid black">',
'    <input type="text" lang="{{locale}}" style="background-color:transparent; width:80%; height:100%; float:left; border:0; padding:0; font-family:monospace; font-size:11px; text-align:right; ' +
'{{style}}">',
'    <span>AM</span>',
'</div>'
        ].join('\n'),

        initialize: function() {
            this.input = this.el.querySelector('input');
            this.meridian = this.el.querySelector('span');

            // Flip AM/PM on any click
            this.el.onclick = function() {
                this.meridian.textContent = this.meridian.textContent === 'AM' ? 'PM' : 'AM';
            }.bind(this);
            this.input.onclick = function(e) {
                e.stopPropagation(); // ignore clicks in the text field
            };
            this.input.onfocus = function(e) {
                var target = e.target;
                this.el.style.outline = this.outline = this.outline || window.getComputedStyle(target).outline;
                target.style.outline = 0;
            }.bind(this);
            this.input.onblur = function(e) {
                this.el.style.outline = 0;
            }.bind(this);
        },

        setEditorValue: function(value) {
            CellEditor.prototype.setEditorValue.call(this, value);
            var parts = this.input.value.split(' ');
            this.input.value = parts[0];
            this.meridian.textContent = parts[1];
        },

        getEditorValue: function(value) {
            value = CellEditor.prototype.getEditorValue.call(this, value);
            if (this.meridian.textContent === 'PM') {
                value += NOON;
            }
            return value;
        }
    });

    grid.cellEditors.add(Time);

    grid.localization.add({
        name: 'hhmm', // alternative to having to hame localizer in `grid.localization.add`

        // returns formatted string from number
        format: function(mins) {
            var hh = Math.floor(mins / 60) % 12 || 12, // modulo 12 hrs with 0 becoming 12
                mm = (mins % 60 + 100 + '').substr(1, 2),
                AmPm = mins < NOON ? 'AM' : 'PM';
            return hh + ':' + mm + ' ' + AmPm;
        },

        invalid: function(hhmm) {
            return !/^(0?[1-9]|1[0-2]):[0-5]\d$/.test(hhmm); // 12:59 max
        },

        // returns number from formatted string
        parse: function(hhmm) {
            var parts = hhmm.match(/^(\d+):(\d{2})$/);
            return Number(parts[1]) * 60 + Number(parts[2]);
        }
    });


    // Used by the cellProvider.
    // `null` means column's data cells are not editable.
    var editorTypes = [
        'combobox',
        'textfield',
        'textfield',
        'textfield',
        'combobox',
        'time',
        'choice',
        'choice',
        'choice',
        'textfield',
        'textfield',
        'textfield'
    ];

    var lastEditPoint;

    grid.addEventListener('fin-editor-keyup', function(e) {
        switch (e.detail.char) {
            case 'UP': grid.editAt(lastEditPoint.plusXY(0, -1)); break;
            case 'DOWN': grid.editAt(lastEditPoint.plusXY(0, +1)); break;
        }
    });

    // Override to assign the the cell editors.
    dataModel.getCellEditorAt = function(x, y, declaredEditorName, options) {
        var editorName = declaredEditorName || editorTypes[x % editorTypes.length];

        lastEditPoint = options.editPoint;

        switch (x) {
            case idx.BIRTH_STATE:
                options.textColor = 'red';
                break;
        }

        var cellEditor = grid.cellEditors.create(editorName, options);

        if (cellEditor) {
            switch (x) {
                case idx.EMPLOYED:
                    cellEditor = null;
                    break;

                case idx.TOTAL_NUMBER_OF_PETS_OWNED:
                    cellEditor.input.setAttribute('min', 0);
                    cellEditor.input.setAttribute('max', 10);
                    cellEditor.input.setAttribute('step', 0.01);
                    break;
            }
        }

        return cellEditor;
    };

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
        //grid.selectColumnsFromCells();

        if (vent) { console.log('fin-selection-changed', grid.getSelectedRows(), grid.getSelectedColumns(), grid.getSelections()); }

        if (e.detail.selections.length === 0) {
            console.log('no selections');
            return;
        }

        // to get the selected rows uncomment the below.....
        // console.log(grid.getRowSelectionMatrix());
        // console.log(grid.getRowSelection());

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

    toggleProps.forEach(function(prop) { addToggle(prop); });

    //setTimeout(function() {
    //
    //    behavior.setFields(['employed', 'income', 'travel', 'squareOfIncome']);
    //    behavior.setHeaders(['one', 'two', 'three', 'four']);
    //
    //    console.log(behavior.getHeaders());
    //    console.log(behavior.getFields());
    //
    //    console.log('visible rows = ' + grid.getVisibleRows());
    //    console.log('visible columns = ' + grid.getVisibleColumns());


        setTimeout(function() {

            //behavior.setFields(fields);
            //behavior.setHeaders(headers);

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

                rowHeights: { 0: 40 },
                fixedColumnCount: 1,
                fixedRowCount: 2,

                showRowNumbers: true,
                showHeaderRow: true,
                showFilterRow: true,
                columnAutosizing: false,
                headerTextWrapping: true,

                filteringMode: 'onCommit', // vs. 'immediate' for every key press
                //filterDefaultColumnFilterOperator: '<>',

                cellSelection: true,
                columnSelection: true,
                rowSelection: true
            };

            grid.setGroups([idx.BIRTH_STATE, idx.LAST_NAME, idx.FIRST_NAME]);

            grid.setState(state);

            behavior.setCellProperties(idx.HEIGHT, 16, {
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

            //                behavior.setCellProperties(idx.TOTAL_NUMBER_OF_PETS_OWNED, 0,
            //                    {
            //                        font: '10pt Tahoma',
            //                        color: 'red',
            //                        backgroundColor: 'lightblue',
            //                        halign: 'left'
            //                    });

            behavior.setColumnProperties(idx.LAST_NAME, {
                color: redIfStartsWithS,
                columnHeaderBackgroundColor: '#142B6F', //dark blue
                columnHeaderColor: 'white'
            });

            behavior.setColumnProperties(idx.LAST_NAME, {
                link: true
            });

            behavior.setColumnProperties(idx.FIRST_NAME, {

            });

            behavior.setColumnProperties(idx.TOTAL_NUMBER_OF_PETS_OWNED, {
                format: 'number'
            });

            behavior.setColumnProperties(idx.HEIGHT, {
                format: 'foot'
            });

            behavior.setColumnProperties(idx.BIRTH_DATE, {
                format: 'singdate',
                //strikeThrough: true
            });

            behavior.setColumnProperties(idx.BIRTH_TIME, {
                editor: 'time',
                format: 'hhmm'
            });

            behavior.setColumnProperties(idx.BIRTH_STATE, {
                editor: 'colortext'
            });

            behavior.setColumnProperties(idx.EMPLOYED, {

            });

            behavior.setColumnProperties(idx.INCOME, {
                format: 'pounds'
            });

            behavior.setColumnProperties(idx.TRAVEL, {
                format: 'francs'
            });

            resetFilter(); // re-instantiate filter using new property settings

            console.log('visible rows = ' + grid.getVisibleRows());
            console.log('visible columns = ' + grid.getVisibleColumns());

            //see myThemes.js file for how to create a theme
            //grid.addProperties(myThemes.one);
            //grid.addProperties(myThemes.two);
            //grid.addProperties(myThemes.three);

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
    //     'dblclick',
    //     'keydown',
    //     'keyup',
    //     'focus-gained',
    //     'focus-lost',
    //     'context-menu'
    // ];

    // eventNames.forEach(function(name) {
    //     grid.canvas.addEventListener('fin-canvas-' + name, function(e) {
    //         console.log(e.type);
    //     });
    // });

    // Some DOM support functions...
    // Besides the canvas, this test harness only has a handful of buttons and checkboxes.
    // The following functions service these controls.

    function addToggle(ctrlGroup) {
        var input, label, eventName,
            dashboard = document.getElementById('dashboard'),
            container = document.createElement('div');

        container.className = 'ctrl-group';

        if (ctrlGroup.label) {
            label = document.createElement('span');
            label.innerHTML = ctrlGroup.label;
            container.appendChild(label);
        }

        ctrlGroup.ctrls.forEach(function(ctrl) {
            var type = ctrl.type || 'checkbox',
                tooltip = 'Property name: ' + ctrl.name;
            if (ctrl.tooltip) {
                tooltip += '\n\n' + ctrl.tooltip;
            }

            input = document.createElement('input');
            input.type = type;
            input.id = ctrl.name;

            switch (type) {
                case 'text':
                    input.value = ctrl.value || '';
                    eventName = 'change';
                    input.style.width = '40px';
                    input.style.marginLeft = '4px';
                    break;
                case 'checkbox':
                    eventName = 'click';
                    input.checked = 'checked' in ctrl
                        ? ctrl.checked
                        : grid.resolveProperty(ctrl.name);
                    break;
            }

            input.addEventListener(eventName, ctrl.setter || setProp);

            label = document.createElement('label');
            label.title = tooltip;
            label.appendChild(input);
            label.insertBefore(
                document.createTextNode(' ' + (ctrl.label || ctrl.name)),
                type !== 'checkbox' ? input : null // label goes before : after input
            );

            container.appendChild(label);
        });

        dashboard.appendChild(container);
    }

    function setProp() { // standard checkbox click handler
        var hash = {}, depth = hash;
        var keys = this.id.split('.');

        while (keys.length > 1) { depth = depth[keys.shift()] = {}; }

        switch (this.type) {
            case 'text':
                depth[keys.shift()] = this.value;
                break;
            case 'checkbox':
                depth[keys.shift()] = this.checked;
                break;
        }

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

    function resetFilterWithNewPropValue() {
        if (confirm('Filter reset required...')) {
            setProp.call(this);
            resetFilter();
        } else {
            switch (this.type) {
                case 'text':
                    this.value = this['data-was']; // user canceled so put data back
                    this.blur();
                    break;
                case 'checkbox':
                    this.checked = !this.checked; // user canceled so put checkbox back
                    break;
            }
        }
    }

    function resetFilter() {
        grid.setGlobalFilter(fin.Hypergrid.behaviors.Behavior.prototype.getNewFilter.call(grid.behavior));
    }

    function redIfStartsWithS(config) {
        //does the data start with an 'S'?
        var data = config.value[1];
        return data && data[0] === 'S' ? 'red' : '#191919';
    }
};
