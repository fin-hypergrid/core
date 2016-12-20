/* eslint-env browser */

/* globals fin, people1, people2, treeData, vent */

/* eslint-disable no-alert, no-unused-vars */

'use strict';

window.onload = function() {

    var Hypergrid = fin.Hypergrid;
    var filterOptions = Hypergrid.Hyperfilter.prototype;
    var INCLUDE_SORTER = true;
    var INCLUDE_FILTER = true;

    Hypergrid.properties.showFilterRow = INCLUDE_FILTER;

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
                { name: 'none',       type: 'radio', checked: true, setter: function() {} },
                { name: 'treeview',   type: 'radio', checked: false, setter: toggleTreeview },
                { name: 'aggregates', type: 'radio', checked: false, setter: toggleAggregates },
                Hypergrid.GroupView && { name: 'grouping',   type: 'radio', checked: false, setter: toggleGrouping}
            ]
        }, {
            label: 'Column header rows',
            ctrls: [
                { name: 'showHeaderRow', label: 'header' }, // default "setter" is `setProp`
                INCLUDE_FILTER && { name: 'showFilterRow', label: 'filter' }
            ]
        },
        {
            label: 'Hover highlights',
            ctrls: [
                { name: 'hoverCellHighlight.enabled', label: 'cell' },
                { name: 'hoverRowHighlight.enabled', label: 'row' },
                { name: 'hoverColumnHighlight.enabled', label: 'column' }
            ]
        },
        {
            label: 'Link style',
            ctrls: [
                { name: 'linkOnHover', label: 'on hover' },
                { name: 'linkColor', type: 'text', label: 'color' },
                { name: 'linkColorOnHover', label: 'color on hover' }
            ]
        }, {
            label: 'Cell editing',
            ctrls: [
                { name: 'editable' },
                { name: 'editOnDoubleClick', label: 'requires double-click' },
                { name: 'editOnKeydown', label: 'type to edit' }
            ]
        }, {
            label: 'Selection',
            ctrls: [
                { name: 'checkboxOnlyRowSelections', label: 'by row handles only', setter: setSelectionProp },
                { name: 'singleRowSelectionMode', label: 'one row at a time', setter: setSelectionProp },
                { name: '!multipleSelections', label: 'one cell region at a time', setter: setSelectionProp, checked: true }
            ]
        }, {
            label: 'Filtering',
            ctrls: [
                {
                    name: 'filterOptions.caseSensitiveData',
                    label: 'case-sensitive operand',
                    checked: filterOptions.caseSensitiveData,
                    tooltip: 'Check to match case of operand and data in string comparisons. This is a shared dynamic property that instantly affects all grids.',
                    setter: toggleCaseSensitivity
                },
                {
                    name: 'filterOptions.caseSensitiveColumnNames',
                    label: 'case-sensitive schema',
                    checked: filterOptions.caseSensitiveColumnNames,
                    tooltip: 'Check to match case of filter column names. Resets filter.',
                    setter: resetFilterWithNewPropValue
                },
                {
                    name: 'filterOptions.resolveAliases',
                    label: 'resolve aliases',
                    checked: filterOptions.resolveAliases,
                    tooltip: 'Check to allow column headers to be used in filters in addition to column names. Resets filter.',
                    setter: resetFilterWithNewPropValue
                },
                {
                    type: 'text',
                    name: 'filterOptions.defaultColumnFilterOperator',
                    label: 'Default column filter operator:',
                    checked: filterOptions.defaultColumnFilterOperator,
                    tooltip: 'May be overridden by column schema\'s `defaultOp`. Blank means use the default ("=").',
                    setter: resetFilterWithNewPropValue
                }
            ]
        }
    ];

    var plugins = [
        Hypergrid.drillDown,
        Hypergrid.totalsToolkit,
        [Hypergrid.TreeView, {
            treeColumn: 'State',
            includeSorter: true,
            includeFilter: true,
            hideIdColumns: true
        }],
        [Hypergrid.GroupView, {
            includeSorter: true,
            includeFilter: true
        }],
        [Hypergrid.AggregationsView, {
            includeSorter: true,
            includeFilter: true
        }],
        INCLUDE_FILTER && Hypergrid.Hyperfilter,
        INCLUDE_SORTER && [Hypergrid.hypersorter, {Column: Hypergrid.behaviors.Column}]
    ];

    // restore previous "opinionated" headerify behavior
    var headerify = Hypergrid.analytics.util.headerify;
    headerify.transform = headerify.capitalize;

    function derivedPeopleSchema(columns) {
        // create a hierarchical schema organized by alias
        var factory = new Hypergrid.ColumnSchemaFactory(columns);
        factory.organize(/^(one|two|three|four|five|six|seven|eight)/i, { key: 'alias' });
        var columnSchema = factory.lookup('last_name');
        if (columnSchema) {
            columnSchema.defaultOp = 'IN';
        }
        //factory.lookup('birthState').opMenu = ['>', '<'];
        return factory.schema;
    }

    var customSchema = [
        { name: 'last_name', type: 'number', opMenu: ['=', '<', '>'], opMustBeInMenu: true },
        { name: 'total_number_of_pets_owned', type: 'number' },
        { name: 'height', type: 'number' },
        'birthDate',
        'birthState',
        'employed',
        { name: 'income', type: 'number' },
        { name: 'travel', type: 'number' }
    ];

    var peopleSchema = customSchema;  // or try setting to derivedPeopleSchema

    function capitalize(string) {
        return (/[a-z]/.test(string) ? string : string.toLowerCase())
            .replace(/[\s\-_]*([^\s\-_])([^\s\-_]+)/g, replacer)
            .replace(/[A-Z]/g, ' $&')
            .trim();
    }

    function replacer(a, b, c) {
        return b.toUpperCase() + c;
    }

    function getSchema(data){
        var schema = [],
            firstRow = Array.isArray(data) && data[0];

        firstRow = (typeof firstRow === 'object') ? firstRow : {};
        for (var p in firstRow) {
            if (firstRow.hasOwnProperty(p)){
                schema.push({name: p, header: capitalize(p)});
            }
        }
        return schema;
    }

    var gridOptions = {
            data: people1,
            margin: { bottom: '17px' },
            schema: getSchema(people1),
            plugins: plugins
        },
        grid = window.g = new Hypergrid('div#json-example', gridOptions),
        behavior = window.b = grid.behavior,
        dataModel = window.m = behavior.dataModel,
        idx = behavior.columnEnum,
        dashboard = document.getElementById('dashboard'),
        ctrlGroups = document.getElementById('ctrl-groups'),
        buttons = document.getElementById('buttons');

    // Install the sorter and Filter data sources (optional).
    // These modules are for EXAMPLE purposes only
    grid.setPipeline([
        INCLUDE_FILTER && window.datasaur.filter,
        INCLUDE_SORTER && window.datasaur.sorter
    ]);
    setGlobalSorter();
    resetGlobalFilter(people1);

    console.log('Fields:');  console.dir(behavior.dataModel.schema.map(function(cs) { return cs.name; }));
    console.log('Headers:'); console.dir(behavior.dataModel.schema.map(function(cs) { return cs.header; }));
    console.log('Indexes:'); console.dir(idx);

    function setData(data, options) {
        options = !data.length ? undefined : options || {
            schema: getSchema(data)
        };
        grid.setData(data, options);
        resetGlobalFilter(data);
        idx = behavior.columnEnum;
        behavior.reindex();
    }

    // Preset a default dialog options object. Used by call to toggleDialog('ColumnPicker') from features/ColumnPicker.js and by toggleDialog() defined herein.
    grid.setDialogOptions({
        //container: document.getElementById('dialog-container'),
        settings: false
    });

    [
        { label: 'Column Picker&hellip;', onclick: toggleDialog.bind(this, 'ColumnPicker') },
        { label: 'Manage Filters&hellip;', onclick: toggleDialog.bind(this, 'ManageFilters') },
        { label: 'Toggle Empty Data', onclick: toggleEmptyData },
        { label: 'Set Data', onclick: function() { resetData(); } },
        { label: 'Set Data 1 (5000 rows)', onclick: function() { setData(people1); } },
        { label: 'Set Data 2 (10000 rows)', onclick: function() { setData(people2); } },
        { label: 'Set Data 3 (tree data)', onclick: function() { setData(treeData); } },
        { label: 'Reset Grid', onclick: function() { grid.reset(); } },
        { label: 'Toggle all drill-downs', onclick: toggleAllCtrlGroups }

    ].forEach(function(item) {
        var button = document.createElement('button');
        button.innerHTML = item.label;
        button.onclick = item.onclick;
        if (item.title) { button.title = item.title; }
        buttons.appendChild(button);
    });

    window.vent = false;

    //functions for showing the grouping/rollup capabilities
    var rollups = Hypergrid.analytics.util.aggregations,
        aggregates = {
            totalPets: rollups.sum(2),
            averagePets: rollups.avg(2),
            maxPets: rollups.max(2),
            minPets: rollups.min(2),
            firstPet: rollups.first(2),
            lastPet: rollups.last(2),
            stdDevPets: rollups.stddev(2)
        },
        groups = [idx.BIRTH_STATE, idx.LAST_NAME, idx.FIRST_NAME];

    function toggleAggregates() {
        grid.plugins.aggregationsView.setAggregateGroups(
            this.checked ? aggregates : [],
            this.checked ? groups : []
        );
    }

    var treeViewing;
    function toggleTreeview() {
        treeViewing = grid.plugins.treeView.setRelation(this.checked);
    }

    function toggleGrouping() {
        grid.plugins.groupView.setGroups(this.checked ? groups : []);
    }

    var styleRowsFromData;
    function toggleRowStylingMethod() {
        styleRowsFromData = !styleRowsFromData;
    }

    function toggleCaseSensitivity() {
        grid.prop('filter', 'caseSensitiveData', this.checked);
        this.applyAnalytics();
        this.behaviorChanged();
    }

    function toggleDialog(dialogName, evt) {
        grid.toggleDialog(dialogName);
        evt.stopPropagation(); // todo: without this other browsers get the event.... HOW?
    }

    var topTotals = [
            ['one', 'two', '3', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
            ['ten', 'nine', '8', 'seven', 'six', 'five', 'four', 'three', 'two', 'one']
        ],
        bottomTotals = [
            ['ONE', 'TWO', '3', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'],
            ['TEN', 'NINE', '8', 'SEVEN', 'SIX', 'FIVE', 'FOUR', 'THREE', 'TWO', 'ONE']
        ];

    var oldData;
    function toggleEmptyData() {
        if (!oldData) {
            oldData = {
                topTotals: behavior.getTopTotals(),
                bottomTotals: behavior.getBottomTotals(),
                data: dataModel.getData(),
                schema: dataModel.schema,
                activeColumns: behavior.columns.map(function(column) { return column.index; })
            };
            //important to set top totals first
            behavior.setTopTotals([]);
            setData([]);
            behavior.setBottomTotals([]);
        } else {
            //important to set top totals first
            behavior.setTopTotals(oldData.topTotals);
            setData(oldData.data, oldData.schema);
            behavior.setColumnIndexes(oldData.activeColumns);
            behavior.setBottomTotals(oldData.bottomTotals);
            oldData = undefined;
        }
    }

    grid.setColumnProperties(2, {
        backgroundColor: 'maroon',
        color: 'green'
    });

    behavior.setFixedRowCount(2);

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

        gc.cache.shadowColor = 'transparent';

        gc.cache.lineJoin = 'round';
        gc.beginPath();
        for (var j = 5, sx = x + 5 + outerRadius; j; --j, sx += diameter) {
            points.forEach(function(point, index) { // eslint-disable-line
                gc[index ? 'lineTo' : 'moveTo'](sx + point.x, y + point.y); // eslint-disable-line
            }); // eslint-disable-line
        }
        gc.closePath();

        val = val / domain * 5;

        gc.cache.fillStyle = color;
        gc.save();
        gc.clip();
        gc.fillRect(x + 5, y,
            (Math.floor(val) + 0.25 + val % 1 * 0.5) * diameter, // adjust width to skip over star outlines and just meter their interiors
            height);
        gc.restore(); // remove clipping region

        gc.cache.strokeStyle = stroke;
        gc.cache.lineWidth = 1;
        gc.stroke();

        if (fgColor && fgColor !== 'transparent') {
            gc.cache.fillStyle = fgColor;
            gc.cache.font = '11px verdana';
            gc.cache.textAlign = 'right';
            gc.cache.textBaseline = 'middle';
            gc.cache.shadowColor = shadowColor;
            gc.cache.shadowOffsetX = gc.cache.shadowOffsetY = 1;
            gc.fillText(val.toFixed(1), x + width + 10, y + height / 2);
        }
    }

    function getDarkenedColor(gc, color, factor) {
        var rgba = getRGBA(gc, color);
        return 'rgba(' + Math.round(factor * rgba[0]) + ',' + Math.round(factor * rgba[1]) + ',' + Math.round(factor * rgba[2]) + ',' + (rgba[3] || 1) + ')';
    }

    function getRGBA(gc, colorSpec) {
        // Normalize variety of CSS color spec syntaxes to one of two
        gc.cache.fillStyle = colorSpec;

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
            var n, hex, travel,
                colIndex = config.dataCell.x,
                rowIndex = config.dataCell.y;

            if (treeViewing) {
                n = config.dataRow.__DEPTH;
                hex = n ? (105 + 75 * n).toString(16) : '00';
                config.backgroundColor = '#' + hex + hex + hex;
                config.color = n ? 'black' : 'white';
            } else {
                if (styleRowsFromData) {
                    n = behavior.getColumn(idx.TOTAL_NUMBER_OF_PETS_OWNED).getValue(rowIndex);
                    hex = (155 + 10 * (n % 11)).toString(16);
                    config.backgroundColor = '#' + hex + hex + hex;
                }

                switch (colIndex) {
                    case idx.LAST_NAME:
                        config.color = config.value != null && (config.value + '')[0] === 'S' ? 'red' : '#191919';
                        config.link = true;
                        break;

                    case idx.INCOME:
                        travel = 60;
                        break;

                    case idx.TRAVEL:
                        travel = 105;
                        break;
                }

                if (travel) {
                    travel += Math.round(config.value * 150 / 100000);
                    config.backgroundColor = '#00' + travel.toString(16) + '00';
                    config.color = '#FFFFFF';
                }

                //Testing
                if (colIndex === idx.TOTAL_NUMBER_OF_PETS_OWNED) {
                    /*
                     * Be sure to adjust the data set to the appropriate type and shape in widedata.js
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
        template: '<input type="text" lang="{{locale}}" style="color:{{textColor}}">'
    });

    grid.cellEditors.add(ColorText);

    var NOON = 12 * 60;

    var Time = Textfield.extend('Time', {
        template: [
'<div class="hypergrid-textfield" style="text-align:right;">',
'    <input type="text" lang="{{locale}}" style="background-color:transparent; width:75%; text-align:right; border:0; padding:0; outline:0; font-size:inherit; font-weight:inherit;' +
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

    var editorCellEvent;

    // Override to assign the the cell editors.
    dataModel.getCellEditorAt = function(x, y, declaredEditorName, cellEvent) {
        var editorName = declaredEditorName || editorTypes[x % editorTypes.length];

        editorCellEvent = cellEvent;

        switch (x) {
            case idx.BIRTH_STATE:
                cellEvent.textColor = 'red';
                break;
        }

        var cellEditor = grid.cellEditors.create(editorName, cellEvent);

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
        var rowContext = e.detail.dataRow;
        if (vent) { console.log('fin-double-click row-context:', rowContext); }
    });

    grid.addEventListener('fin-button-pressed', function(e) {
        var cellEvent = e.detail;
        cellEvent.value = !cellEvent.value;
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
        var detail = e.detail,
            key = String.fromCharCode(detail.key).toUpperCase(),
            result = false; // means event handled herein

        if (detail.input instanceof grid.cellEditors.editors.filterbox) { // or: detail.input.$$CLASS_NAME === 'FilterBox'
            // skip "select" calls if editing a filter cell
        } else if (detail.shift) {
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
        var detail = e.detail;

        if (vent) { console.log('fin-row-selection-changed', detail); }

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

    // make buttons div absolute so buttons width of 100% doesn't stretch to width of dashboard
    ctrlGroups.style.top = ctrlGroups.getBoundingClientRect().top + 'px';
    buttons.style.position = 'absolute';
    dashboard.style.display = 'none';

    toggleProps.forEach(function(prop) { addToggle(prop); });


    function resetData() {

        setData(people1);

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

        // turn on grouping as per checkbox default setting (see toggleProps[])
        if (Hypergrid.GroupView && document.querySelector('#grouping').checked) {
            grid.setGroups(groups);
        }

        // turn on aggregates as per checkbox default setting (see toggleProps[])
        if (document.querySelector('#aggregates').checked) {
            behavior.setAggregates(aggregates, [idx.BIRTH_STATE, idx.LAST_NAME, idx.FIRST_NAME]);
        }

    }

    setTimeout(resetData, 50);

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
        var input, label,
            container = document.createElement('div');

        container.className = 'ctrl-group';

        if (ctrlGroup.label) {
            label = document.createElement('div');
            label.className = 'twister';
            label.innerHTML = ctrlGroup.label;
            container.appendChild(label);
        }

        var choices = document.createElement('div');
        choices.className = 'choices';
        container.appendChild(choices);

        ctrlGroup.ctrls.forEach(function(ctrl) {
            if (!ctrl) {
                return;
            }

            var referenceElement,
                type = ctrl.type || 'checkbox',
                tooltip = 'Property name: ' + ctrl.name;

            if (ctrl.tooltip) {
                tooltip += '\n\n' + ctrl.tooltip;
            }

            input = document.createElement('input');
            input.type = type;
            input.id = ctrl.name;
            input.name = ctrlGroup.label;

            switch (type) {
                case 'text':
                    input.value = ctrl.value || globalProperty(ctrl.name) || '';
                    input.style.width = '25px';
                    input.style.marginLeft = '4px';
                    input.style.marginRight = '4px';
                    referenceElement = input; // label goes after input
                    break;
                case 'checkbox':
                case 'radio':
                    input.checked = 'checked' in ctrl
                        ? ctrl.checked
                        : globalProperty(ctrl.name);
                    referenceElement = null; // label goes before input
                    break;
            }

            input.onchange = function() {
                handleRadioClick.call(this, ctrl.setter || setProp);
            };

            label = document.createElement('label');
            label.title = tooltip;
            label.appendChild(input);
            label.insertBefore(
                document.createTextNode(' ' + (ctrl.label || ctrl.name)),
                referenceElement
            );

            choices.appendChild(label);
        });

        ctrlGroups.appendChild(container);
    }

    function globalProperty(key) {
        var keys = key.split('.');
        var prop;

        if (keys[0] === 'filterOptions') {
            keys.shift();
            prop = filterOptions;
        } else {
            prop = Hypergrid.properties;
        }

        while (keys.length) {
            prop = prop[keys.shift()];
        }

        return prop;
    }

    document.getElementById('tab-dashboard').addEventListener('click', function(event) {
        if (dashboard.style.display === 'none') {
            dashboard.style.display = 'block';
            grid.div.style.transition = 'margin-left .75s';
            grid.div.style.marginLeft = Math.max(180, dashboard.getBoundingClientRect().right + 8) + 'px';
        } else {
            setTimeout(function() {
                dashboard.style.display = 'none';
            }, 800);
            grid.div.style.marginLeft = '30px';
        }
    });

    var fpsTimer, secs, frames;
    document.getElementById('tab-fps').addEventListener('click', function(event) {
        var el = this, st = el.style;
        if ((grid.properties.enableContinuousRepaint ^= true)) {
            st.backgroundColor = '#666';
            st.textAlign = 'left';
            secs = frames = 0;
            code();
            fpsTimer = setInterval(code, 1000);
        } else {
            clearInterval(fpsTimer);
            st.backgroundColor = st.textAlign = null;
            el.innerHTML = 'FPS';
        }
        function code() {
            var fps = grid.canvas.currentFPS,
                bars = Array(Math.round(fps) + 1).join('I'),
                subrange, span;

            // first span holds the 30 background bars
            el.innerHTML = '';
            el.appendChild(document.createElement('span'));

            // 2nd span holds the numeric
            span = document.createElement('span');

            if (secs) {
                frames += fps;
                span.innerHTML = fps.toFixed(1);
                span.title = secs + '-second average = ' + (frames / secs).toFixed(1);
            }
            secs += 1;

            el.appendChild(span);

            // 0 to 4 color range bar subsets: 1..10:red, 11:20:yellow, 21:30:green
            while ((subrange = bars.substr(0, 12)).length) {
                span = document.createElement('span');
                span.innerHTML = subrange;
                el.appendChild(span);
                bars = bars.substr(12);
            }
        }
    });

    var height;
    document.getElementById('tab-grow-shrink').addEventListener('click', function(event) {
        var label;
        if (!height) {
            height = window.getComputedStyle(grid.div).height;
            grid.div.style.transition = 'height 1.5s linear';
            grid.div.style.height = window.innerHeight + 'px';
            label = 'Shrink';
        } else {
            grid.div.style.height = height;
            height = undefined;
            label = 'Grow';
        }
        this.innerHTML += ' ...';
        setTimeout(function() { this.innerHTML = label; }.bind(this), 1500);
    });

    document.getElementById('dashboard').addEventListener('click', function(event) {
        var ctrl = event.target;
        if (ctrl.classList.contains('twister')) {
            ctrl.nextElementSibling.style.display = ctrl.classList.toggle('open') ? 'block' : 'none';
            grid.div.style.marginLeft = Math.max(180, event.currentTarget.getBoundingClientRect().right + 8) + 'px';
        }
    });

    function toggleAllCtrlGroups() {
        var twisters = Array.prototype.slice.call(document.querySelectorAll('.twister')),
            open = twisters[0].classList.contains('open') ? 'add' : 'remove';

        twisters.forEach(function(twister) {
            twister.classList[open]('open');
            twister.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
    }

    var radioGroup = {};

    function handleRadioClick(handler) {
        if (this.type === 'radio') {
            var lastRadio = radioGroup[this.name];
            if (lastRadio) {
                lastRadio.handler.call(lastRadio.ctrl);
            }
            radioGroup[this.name] = { ctrl: this, handler: handler };
        }
        handler.call(this);
    }

    function setProp() { // standard checkbox click handler
        var hash = {}, depth = hash;
        var id = this.id;
        if (id[0] === '!') {
            if (this.type !== 'checkbox') {
                throw 'Expected inverse operator (!) on checkbox dashboard controls only but found on ' + this.type + '.';
            }
            id = id.substr(1);
            var inverse = true;
        }
        var keys = id.split('.');

        while (keys.length > 1) { depth = depth[keys.shift()] = {}; }

        switch (this.type) {
            case 'text':
                depth[keys.shift()] = this.value;
                break;
            case 'checkbox':
                depth[keys.shift()] = inverse ? !this.checked : this.checked;
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
        var confirmed = confirm('Filter reset required...'),
            value;

        if (confirmed) {
            switch (this.type) {
                case 'text':
                    value = this.value;
                    this['data-was'] = value; // save for possible future user cancel
                    break;
                case 'checkbox':
                    value = this.checked;
                    break;
            }
            filterOptions[this.id] = value;
            resetGlobalFilter();
            grid.behaviorChanged();
            grid.repaint();
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

    function resetGlobalFilter(data) {
        if (grid.plugins.hyperfilter) {
            // Inform data model of external filter data controller. (This data controller is for EXAMPLE purposes only.)
            var schema = (data === people1 || data === people2) && peopleSchema;
            grid.filter = grid.plugins.hyperfilter.create(schema); // new filter with new derived column schema
        }
    }

    function setGlobalSorter() {
        if (grid.plugins.hypersorter) {
            // Inform data model of external sorter data controller. (This data controller is for EXAMPLE purposes only.)
            grid.sorter = grid.plugins.hypersorter;
        }
    }
};
