(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* eslint-env browser */

'use strict';

module.exports = function(demo, grid) {

    var idx = grid.behavior.columnEnum;

    var CellEditor = grid.cellEditors.get('celleditor');
    var Textfield = grid.cellEditors.get('textfield');

    var ColorText = Textfield.extend('colorText', {
        template: '<input type="text" lang="{{locale}}" style="color:{{textColor}}">'
    });

    grid.cellEditors.add(ColorText);

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
                value += demo.NOON;
            }
            return value;
        }
    });

    grid.cellEditors.add(Time);

    // Used by the cellProvider.
    // `null` means column's data cells are not editable.
    var editorTypes = [
        null,
        'textfield',
        'textfield',
        'textfield',
        null,
        'time',
        'choice',
        'choice',
        'choice',
        'textfield',
        'textfield',
        'textfield'
    ];

    // Override to assign the the cell editors.
    grid.behavior.dataModel.getCellEditorAt = function(x, y, declaredEditorName, cellEvent) {
        var editorName = declaredEditorName || editorTypes[x % editorTypes.length];

        switch (x) {
            case idx.birthState:
                cellEvent.textColor = 'red';
                break;
        }

        var cellEditor = grid.cellEditors.create(editorName, cellEvent);

        if (cellEditor) {
            switch (x) {
                case idx.employed:
                    cellEditor = null;
                    break;

                case idx.totalNumberOfPetsOwned:
                    cellEditor.input.setAttribute('min', 0);
                    cellEditor.input.setAttribute('max', 10);
                    cellEditor.input.setAttribute('step', 0.01);
                    break;
            }
        }

        return cellEditor;
    };
};

},{}],2:[function(require,module,exports){
/* eslint-env browser */

'use strict';

module.exports = function(demo, grid) {

    var idx = grid.behavior.columnEnum;

    //GET CELL
    //all formatting and rendering per cell can be overridden in here
    grid.behavior.dataModel.getCell = function(config, rendererName) {
        if (config.isUserDataArea) {
            var n, hex, travel,
                colIndex = config.dataCell.x,
                rowIndex = config.dataCell.y;

            if (demo.styleRowsFromData) {
                n = grid.behavior.getColumn(idx.totalNumberOfPetsOwned).getValue(rowIndex);
                hex = (155 + 10 * (n % 11)).toString(16);
                config.backgroundColor = '#' + hex + hex + hex;
            }

            switch (colIndex) {
                case idx.lastName:
                    config.color = config.value != null && (config.value + '')[0] === 'S' ? 'red' : '#191919';
                    config.link = true;
                    break;

                case idx.income:
                    travel = 60;
                    break;

                case idx.travel:
                    travel = 105;
                    break;
            }

            if (travel) {
                travel += Math.round(config.value * 150 / 100000);
                config.backgroundColor = '#00' + travel.toString(16) + '00';
                config.color = '#FFFFFF';
            }

            //Testing
            if (colIndex === idx.totalNumberOfPetsOwned) {
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

        return grid.cellRenderers.get(rendererName);
    };

    //END OF GET CELL


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
            // bgColor = config.isSelected ? (options.bgSelColor || config.bgSelColor) : (options.bgColor || config.bgColor),
            fgColor = config.isSelected ? (options.fgSelColor || config.fgSelColor) : (options.fgColor || config.fgColor),
            shadowColor = options.shadowColor || config.shadowColor || 'transparent',
            // font = options.font || config.font || '11px verdana',
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
    return grid;
};

},{}],3:[function(require,module,exports){
/* eslint-env browser */

/* globals people1, people2 */

/* eslint-disable no-alert */

'use strict';

// Some DOM support functions...
// Besides the canvas, this test harness only has a handful of buttons and checkboxes.
// The following functions service these controls.

module.exports = function(demo, grid) {

    // make buttons div absolute so buttons width of 100% doesn't stretch to width of dashboard
    var ctrlGroups = document.getElementById('ctrl-groups'),
        dashboard = document.getElementById('dashboard'),
        buttons = document.getElementById('buttons');

    ctrlGroups.style.top = ctrlGroups.getBoundingClientRect().top + 'px';
    //buttons.style.position = 'absolute';
    dashboard.style.display = 'none';

    function toggleRowStylingMethod() {
        demo.styleRowsFromData = !demo.styleRowsFromData;
    }

    // List of properties to show as checkboxes in this demo's "dashboard"
    var toggleProps = [
        {
            label: 'Row styling',
            ctrls: [
                {name: '(Global setting)', label: 'base on data', setter: toggleRowStylingMethod}
            ]
        },
        {
            label: 'Column header rows',
            ctrls: [
                {name: 'showHeaderRow', label: 'header'}, // default "setter" is `setProp`
            ]
        },
        {
            label: 'Hover highlights',
            ctrls: [
                {name: 'hoverCellHighlight.enabled', label: 'cell'},
                {name: 'hoverRowHighlight.enabled', label: 'row'},
                {name: 'hoverColumnHighlight.enabled', label: 'column'}
            ]
        },
        {
            label: 'Link style',
            ctrls: [
                {name: 'linkOnHover', label: 'on hover'},
                {name: 'linkColor', type: 'text', label: 'color'},
                {name: 'linkColorOnHover', label: 'color on hover'}
            ]
        }, {
            label: 'Cell editing',
            ctrls: [
                {name: 'editable'},
                {name: 'editOnDoubleClick', label: 'requires double-click'},
                {name: 'editOnKeydown', label: 'type to edit'}
            ]
        }, {
            label: 'Selection',
            ctrls: [
                {
                    name: 'checkboxOnlyRowSelections', label: 'by row handles only', setter: setSelectionProp,
                    tooltip: 'Note that when this property is active, autoSelectRows will not work.'
                },
                {name: 'singleRowSelectionMode', label: 'one row at a time', setter: setSelectionProp},
                {
                    name: '!multipleSelections',
                    label: 'one cell region at a time',
                    setter: setSelectionProp,
                    checked: true
                },
                {
                    name: 'autoSelectRows', label: 'auto-select rows', setter: setSelectionProp,
                    tooltip: 'Notes:\n' +
                    '1. Requires that checkboxOnlyRowSelections be set to false (so checking this box automatically unchecks that one).\n' +
                    '2. Set singleRowSelectionMode to false to allow auto-select of multiple rows.'
                },
                {name: 'autoSelectColumns', label: 'auto-select columns', setter: setSelectionProp}
            ]
        }
    ];


    toggleProps.forEach(function(prop) {
        addToggle(prop);
    });


    [
        {label: 'Toggle Empty Data', onclick: demo.toggleEmptyData},
        {
            label: 'Set Data', onclick: function() {
            demo.resetData();
            }
        },
        {
            label: 'Set Data 1 (5000 rows)', onclick: function() {
            demo.setData(people1);
            }
        },
        {
            label: 'Set Data 2 (10000 rows)', onclick: function() {
            demo.setData(people2);
            }
        },
        {label: 'Reset Grid', onclick: demo.reset}

    ].forEach(function(item) {
        var button = document.createElement('button');
        button.innerHTML = item.label;
        button.onclick = item.onclick;
        if (item.title) {
            button.title = item.title;
        }
        buttons.appendChild(button);
    });


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
                    input.value = ctrl.value || getProperty(ctrl.name) || '';
                    input.style.width = '25px';
                    input.style.marginLeft = '4px';
                    input.style.marginRight = '4px';
                    referenceElement = input; // label goes after input
                    break;
                case 'checkbox':
                case 'radio':
                    input.checked = 'checked' in ctrl
                        ? ctrl.checked
                        : getProperty(ctrl.name);
                    referenceElement = null; // label goes before input
                    break;
            }

            input.onchange = function(event) {
                handleRadioClick.call(this, ctrl.setter || setProp, event);
            };

            label = document.createElement('label');
            label.title = tooltip;
            label.appendChild(input);
            label.insertBefore(
                document.createTextNode(' ' + (ctrl.label || ctrl.name)),
                referenceElement
            );

            choices.appendChild(label);

            if (ctrl.name === 'treeview') {
                label.onmousedown = input.onmousedown = function(event) {
                    if (!input.checked && grid.behavior.dataModel.source.data !== demo.treeData) {
                        alert('Load tree data first ("Set Data 3" button).');
                        event.preventDefault();
                    }
                };
            }
        });

        ctrlGroups.appendChild(container);
    }

    // reset dashboard checkboxes and radio buttons to match current values of grid properties
    demo.resetDashboard = function() {
        toggleProps.forEach(function(prop) {
            prop.ctrls.forEach(function(ctrl) {
                if (ctrl) {
                    switch (ctrl.setter) {
                        case setSelectionProp:
                        case setProp:
                        case undefined:
                            switch (ctrl.type) {
                                case 'radio':
                                case 'checkbox':
                                case undefined:
                                    var id = ctrl.name,
                                        polarity = (id[0] === '!');
                                    document.getElementById(id).checked = getProperty(id) ^ polarity;
                            }
                    }
                }
            });
        });
    };

    function getProperty(key) {
        var keys = key.split('.');
        var prop = grid.properties;

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
        setTimeout(function() {
            this.innerHTML = label;
        }.bind(this), 1500);
    });

    document.getElementById('dashboard').addEventListener('click', function(event) {
        var ctrl = event.target;
        if (ctrl.classList.contains('twister')) {
            ctrl.nextElementSibling.style.display = ctrl.classList.toggle('open') ? 'block' : 'none';
            grid.div.style.marginLeft = Math.max(180, event.currentTarget.getBoundingClientRect().right + 8) + 'px';
        }
    });


    var radioGroup = {};

    function handleRadioClick(handler, event) {
        if (this.type === 'radio') {
            var lastRadio = radioGroup[this.name];
            if (lastRadio) {
                lastRadio.handler.call(lastRadio.ctrl);
            }
            radioGroup[this.name] = {ctrl: this, handler: handler};
        }
        handler.call(this, event);
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

        while (keys.length > 1) {
            depth = depth[keys.shift()] = {};
        }

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
        var ctrl;

        grid.selectionModel.clear();
        grid.behavior.dataModel.clearSelectedData();

        setProp.call(this);

        if (this.checked) {
            if (
                this.id === 'checkboxOnlyRowSelections' &&
                (ctrl = document.getElementById('autoSelectRows')).checked
            ) {
                alert('Note that autoSelectRows is ineffectual when checkboxOnlyRowSelections is on.');
            } else if (this.id === 'autoSelectRows') {
                if (
                    (ctrl = document.getElementById('checkboxOnlyRowSelections')).checked &&
                    confirm('Note that autoSelectRows is ineffectual when checkboxOnlyRowSelections is on.\n\nTurn off checkboxOnlyRowSelections?')
                ) {
                    ctrl.checked = false;
                    setProp.call(ctrl);
                }

                if (
                    (ctrl = document.getElementById('singleRowSelectionMode')).checked &&
                    confirm('Note that auto-selecting a range of rows by selecting a range of cells (with click + drag or shift + click) is not possible with singleRowSelectionMode is on.\n\nTurn off singleRowSelectionMode?')
                ) {
                    ctrl.checked = false;
                    setProp.call(ctrl);
                }
            }
        }
    }
};


},{}],4:[function(require,module,exports){
'use strict';

module.exports = function(demo, grid) {

    grid.addEventListener('fin-click', function(e) {
        var cell = e.detail.gridCell;
        if (demo.vent) { console.log('fin-click cell:', cell); }
    });

    grid.addEventListener('fin-double-click', function(e) {
        var rowContext = e.detail.dataRow;
        if (demo.vent) { console.log('fin-double-click row-context:', rowContext); }
    });

    grid.addEventListener('fin-button-pressed', function(e) {
        var cellEvent = e.detail;
        cellEvent.value = !cellEvent.value;
    });

    grid.addEventListener('fin-scroll-x', function(e) {
        if (demo.vent) { console.log('fin-scroll-x ', e.detail.value); }
    });

    grid.addEventListener('fin-scroll-y', function(e) {
        if (demo.vent) { console.log('fin-scroll-y', e.detail.value); }
    });

    grid.addEventListener('fin-cell-enter', function(e) {
        var cellEvent = e.detail;

        //if (demo.vent) { console.log('fin-cell-enter', cell.x, cell.y); }

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

    grid.addEventListener('fin-filter-applied', function(e) {
        if (demo.vent) { console.log('fin-filter-applied', e); }
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

        if (demo.vent) {
            console.log('fin-selection-changed', grid.getSelectedRows(), grid.getSelectedColumns(), grid.getSelections());
        }

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

        if (demo.vent) { console.log('fin-row-selection-changed', detail); }

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
        if (demo.vent) { console.log('fin-column-selection-changed', e.detail); }

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
        if (demo.vent) { console.log('fin-editor-data-change', e.detail); }

    });

    grid.addEventListener('fin-request-cell-edit', function(e) {
        if (demo.vent) { console.log('fin-request-cell-edit', e); }
        //e.preventDefault(); //uncomment to cancel editor popping up
    });

    grid.addEventListener('fin-before-cell-edit', function(e) {
        if (demo.vent) { console.log('fin-before-cell-edit', e); }
        //e.preventDefault(); //uncomment to cancel updating the model with the new data
    });

    grid.addEventListener('fin-after-cell-edit', function(e) {
        if (demo.vent) { console.log('fin-after-cell-edit', e); }
    });

    grid.addEventListener('fin-editor-keyup', function(e) {
        if (demo.vent) { console.log('fin-editor-keyup', e.detail); }
    });

    grid.addEventListener('fin-editor-keypress', function(e) {
        if (demo.vent) { console.log('fin-editor-keypress', e.detail); }
    });

    grid.addEventListener('fin-editor-keydown', function(e) {
        if (demo.vent) { console.log('fin-editor-keydown', e.detail); }
    });

    grid.addEventListener('fin-groups-changed', function(e) {
        if (demo.vent) { console.log('fin-groups-changed', e.detail); }
    });

    grid.addEventListener('fin-context-menu', function(e) {
        var modelPoint = e.detail.gridCell;
        if (demo.vent) { console.log('fin-context-menu(' + modelPoint.x + ', ' + modelPoint.y + ')'); }
    });

};

},{}],5:[function(require,module,exports){
/* eslint-env browser */

/* globals fin, people1 */

/* eslint-disable no-alert*/

'use strict';

window.onload = function() {

    var demo = window.demo = {
        vent: false,
        reset: reset,
        setData: setData,
        toggleEmptyData: toggleEmptyData,
        resetData: resetData
    };

    var Hypergrid = fin.Hypergrid,
        initState = require('./setState'),
        initCellRenderers = require('./cellrenderers'),
        initFormatters = require('./formatters'),
        initCellEditors = require('./cellEditors'),
        initDashboard = require('./dashboard'),
        initEvents = require('./events');

    // convert field names containing underscore to camel case by overriding column enum decorator
    Hypergrid.behaviors.JSON.prototype.columnEnumKey = Hypergrid.behaviors.JSON.columnEnumDecorators.toCamelCase;

    var gridOptions = {
            data: people1,
            margin: { bottom: '17px', right: '17px'},
            schema: Hypergrid.lib.fields.getSchema(people1),
            state: { color: 'orange' }
        },
        grid = window.grid = window.g = new Hypergrid('div#json-example', gridOptions),
        behavior = window.b = grid.behavior,
        dataModel = window.m = behavior.dataModel,
        initial = true,
        idx = behavior.columnEnum;


    console.log('Fields:');  console.dir(behavior.dataModel.schema.map(function(cs) { return cs.name; }));
    console.log('Headers:'); console.dir(behavior.dataModel.schema.map(function(cs) { return cs.header; }));
    console.log('Indexes:'); console.dir(idx);

    function setData(data, options) {
        options = !data.length ? undefined : options || {
            schema: Hypergrid.lib.fields.getSchema(data)
        };
        grid.setData(data, options);
        behavior.reindex();
    }

    function reset() {
        grid.reset();
        initEvents(demo, grid);
    }

    var oldData;
    function toggleEmptyData() {
        if (!oldData) {
            oldData = {
                data: dataModel.getData(),
                schema: dataModel.schema,
                activeColumns: behavior.getActiveColumns().map(function(column) { return column.index; })
            };
            //important to set top totals first
            setData([]);
        } else {
            //important to set top totals first
            setData(oldData.data, oldData.schema);
            behavior.setColumnIndexes(oldData.activeColumns);
            oldData = undefined;
        }
    }

    function resetData() {
        setData(people1);
        if (initial) {
            initDashboard(demo, grid);
            initial = false;
        }
        setTimeout(function() { initState(demo, grid); }, 50);
    }

    resetData();

    initCellRenderers(demo, grid);
    initFormatters(demo, grid);
    initCellEditors(demo, grid);
    initEvents(demo, grid);
};

},{"./cellEditors":1,"./cellrenderers":2,"./dashboard":3,"./events":4,"./formatters":6,"./setState":7}],6:[function(require,module,exports){
/* eslint-env browser */

'use strict';

module.exports = function(demo, grid) {

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

    grid.localization.add({
        name: 'hhmm', // alternative to having to hame localizer in `grid.localization.add`

        // returns formatted string from number
        format: function(mins) {
            var hh = Math.floor(mins / 60) % 12 || 12, // modulo 12 hrs with 0 becoming 12
                mm = (mins % 60 + 100 + '').substr(1, 2),
                AmPm = mins < demo.NOON ? 'AM' : 'PM';
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

    return grid;

};

},{}],7:[function(require,module,exports){
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

},{}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9kZW1vL2pzL2RlbW8vY2VsbEVkaXRvcnMuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9kZW1vL2pzL2RlbW8vY2VsbHJlbmRlcmVycy5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL2RlbW8vanMvZGVtby9kYXNoYm9hcmQuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9kZW1vL2pzL2RlbW8vZXZlbnRzLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvZGVtby9qcy9kZW1vL2Zha2VfMjM4ODJlNWMuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9kZW1vL2pzL2RlbW8vZm9ybWF0dGVycy5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL2RlbW8vanMvZGVtby9zZXRTdGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIHZhciBpZHggPSBncmlkLmJlaGF2aW9yLmNvbHVtbkVudW07XG5cbiAgICB2YXIgQ2VsbEVkaXRvciA9IGdyaWQuY2VsbEVkaXRvcnMuZ2V0KCdjZWxsZWRpdG9yJyk7XG4gICAgdmFyIFRleHRmaWVsZCA9IGdyaWQuY2VsbEVkaXRvcnMuZ2V0KCd0ZXh0ZmllbGQnKTtcblxuICAgIHZhciBDb2xvclRleHQgPSBUZXh0ZmllbGQuZXh0ZW5kKCdjb2xvclRleHQnLCB7XG4gICAgICAgIHRlbXBsYXRlOiAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgbGFuZz1cInt7bG9jYWxlfX1cIiBzdHlsZT1cImNvbG9yOnt7dGV4dENvbG9yfX1cIj4nXG4gICAgfSk7XG5cbiAgICBncmlkLmNlbGxFZGl0b3JzLmFkZChDb2xvclRleHQpO1xuXG4gICAgdmFyIFRpbWUgPSBUZXh0ZmllbGQuZXh0ZW5kKCdUaW1lJywge1xuICAgICAgICB0ZW1wbGF0ZTogW1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJoeXBlcmdyaWQtdGV4dGZpZWxkXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0O1wiPicsXG4gICAgICAgICAgICAnICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGxhbmc9XCJ7e2xvY2FsZX19XCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50OyB3aWR0aDo3NSU7IHRleHQtYWxpZ246cmlnaHQ7IGJvcmRlcjowOyBwYWRkaW5nOjA7IG91dGxpbmU6MDsgZm9udC1zaXplOmluaGVyaXQ7IGZvbnQtd2VpZ2h0OmluaGVyaXQ7JyArXG4gICAgICAgICAgICAne3tzdHlsZX19XCI+JyxcbiAgICAgICAgICAgICcgICAgPHNwYW4+QU08L3NwYW4+JyxcbiAgICAgICAgICAgICc8L2Rpdj4nXG4gICAgICAgIF0uam9pbignXFxuJyksXG5cbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0ID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xuICAgICAgICAgICAgdGhpcy5tZXJpZGlhbiA9IHRoaXMuZWwucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuXG4gICAgICAgICAgICAvLyBGbGlwIEFNL1BNIG9uIGFueSBjbGlja1xuICAgICAgICAgICAgdGhpcy5lbC5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tZXJpZGlhbi50ZXh0Q29udGVudCA9IHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQgPT09ICdBTScgPyAnUE0nIDogJ0FNJztcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpOyAvLyBpZ25vcmUgY2xpY2tzIGluIHRoZSB0ZXh0IGZpZWxkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5vbmZvY3VzID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgICAgICAgICB0aGlzLmVsLnN0eWxlLm91dGxpbmUgPSB0aGlzLm91dGxpbmUgPSB0aGlzLm91dGxpbmUgfHwgd2luZG93LmdldENvbXB1dGVkU3R5bGUodGFyZ2V0KS5vdXRsaW5lO1xuICAgICAgICAgICAgICAgIHRhcmdldC5zdHlsZS5vdXRsaW5lID0gMDtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQub25ibHVyID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwuc3R5bGUub3V0bGluZSA9IDA7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0RWRpdG9yVmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBDZWxsRWRpdG9yLnByb3RvdHlwZS5zZXRFZGl0b3JWYWx1ZS5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHRoaXMuaW5wdXQudmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQudmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgICAgICAgIHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQgPSBwYXJ0c1sxXTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRFZGl0b3JWYWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHZhbHVlID0gQ2VsbEVkaXRvci5wcm90b3R5cGUuZ2V0RWRpdG9yVmFsdWUuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICBpZiAodGhpcy5tZXJpZGlhbi50ZXh0Q29udGVudCA9PT0gJ1BNJykge1xuICAgICAgICAgICAgICAgIHZhbHVlICs9IGRlbW8uTk9PTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZ3JpZC5jZWxsRWRpdG9ycy5hZGQoVGltZSk7XG5cbiAgICAvLyBVc2VkIGJ5IHRoZSBjZWxsUHJvdmlkZXIuXG4gICAgLy8gYG51bGxgIG1lYW5zIGNvbHVtbidzIGRhdGEgY2VsbHMgYXJlIG5vdCBlZGl0YWJsZS5cbiAgICB2YXIgZWRpdG9yVHlwZXMgPSBbXG4gICAgICAgIG51bGwsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgJ3RleHRmaWVsZCcsXG4gICAgICAgIG51bGwsXG4gICAgICAgICd0aW1lJyxcbiAgICAgICAgJ2Nob2ljZScsXG4gICAgICAgICdjaG9pY2UnLFxuICAgICAgICAnY2hvaWNlJyxcbiAgICAgICAgJ3RleHRmaWVsZCcsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICAndGV4dGZpZWxkJ1xuICAgIF07XG5cbiAgICAvLyBPdmVycmlkZSB0byBhc3NpZ24gdGhlIHRoZSBjZWxsIGVkaXRvcnMuXG4gICAgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuZ2V0Q2VsbEVkaXRvckF0ID0gZnVuY3Rpb24oeCwgeSwgZGVjbGFyZWRFZGl0b3JOYW1lLCBjZWxsRXZlbnQpIHtcbiAgICAgICAgdmFyIGVkaXRvck5hbWUgPSBkZWNsYXJlZEVkaXRvck5hbWUgfHwgZWRpdG9yVHlwZXNbeCAlIGVkaXRvclR5cGVzLmxlbmd0aF07XG5cbiAgICAgICAgc3dpdGNoICh4KSB7XG4gICAgICAgICAgICBjYXNlIGlkeC5iaXJ0aFN0YXRlOlxuICAgICAgICAgICAgICAgIGNlbGxFdmVudC50ZXh0Q29sb3IgPSAncmVkJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjZWxsRWRpdG9yID0gZ3JpZC5jZWxsRWRpdG9ycy5jcmVhdGUoZWRpdG9yTmFtZSwgY2VsbEV2ZW50KTtcblxuICAgICAgICBpZiAoY2VsbEVkaXRvcikge1xuICAgICAgICAgICAgc3dpdGNoICh4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBpZHguZW1wbG95ZWQ6XG4gICAgICAgICAgICAgICAgICAgIGNlbGxFZGl0b3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgaWR4LnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQ6XG4gICAgICAgICAgICAgICAgICAgIGNlbGxFZGl0b3IuaW5wdXQuc2V0QXR0cmlidXRlKCdtaW4nLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgY2VsbEVkaXRvci5pbnB1dC5zZXRBdHRyaWJ1dGUoJ21heCcsIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgY2VsbEVkaXRvci5pbnB1dC5zZXRBdHRyaWJ1dGUoJ3N0ZXAnLCAwLjAxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2VsbEVkaXRvcjtcbiAgICB9O1xufTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVtbywgZ3JpZCkge1xuXG4gICAgdmFyIGlkeCA9IGdyaWQuYmVoYXZpb3IuY29sdW1uRW51bTtcblxuICAgIC8vR0VUIENFTExcbiAgICAvL2FsbCBmb3JtYXR0aW5nIGFuZCByZW5kZXJpbmcgcGVyIGNlbGwgY2FuIGJlIG92ZXJyaWRkZW4gaW4gaGVyZVxuICAgIGdyaWQuYmVoYXZpb3IuZGF0YU1vZGVsLmdldENlbGwgPSBmdW5jdGlvbihjb25maWcsIHJlbmRlcmVyTmFtZSkge1xuICAgICAgICBpZiAoY29uZmlnLmlzVXNlckRhdGFBcmVhKSB7XG4gICAgICAgICAgICB2YXIgbiwgaGV4LCB0cmF2ZWwsXG4gICAgICAgICAgICAgICAgY29sSW5kZXggPSBjb25maWcuZGF0YUNlbGwueCxcbiAgICAgICAgICAgICAgICByb3dJbmRleCA9IGNvbmZpZy5kYXRhQ2VsbC55O1xuXG4gICAgICAgICAgICBpZiAoZGVtby5zdHlsZVJvd3NGcm9tRGF0YSkge1xuICAgICAgICAgICAgICAgIG4gPSBncmlkLmJlaGF2aW9yLmdldENvbHVtbihpZHgudG90YWxOdW1iZXJPZlBldHNPd25lZCkuZ2V0VmFsdWUocm93SW5kZXgpO1xuICAgICAgICAgICAgICAgIGhleCA9ICgxNTUgKyAxMCAqIChuICUgMTEpKS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgY29uZmlnLmJhY2tncm91bmRDb2xvciA9ICcjJyArIGhleCArIGhleCArIGhleDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3dpdGNoIChjb2xJbmRleCkge1xuICAgICAgICAgICAgICAgIGNhc2UgaWR4Lmxhc3ROYW1lOlxuICAgICAgICAgICAgICAgICAgICBjb25maWcuY29sb3IgPSBjb25maWcudmFsdWUgIT0gbnVsbCAmJiAoY29uZmlnLnZhbHVlICsgJycpWzBdID09PSAnUycgPyAncmVkJyA6ICcjMTkxOTE5JztcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLmxpbmsgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgaWR4LmluY29tZTpcbiAgICAgICAgICAgICAgICAgICAgdHJhdmVsID0gNjA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBpZHgudHJhdmVsOlxuICAgICAgICAgICAgICAgICAgICB0cmF2ZWwgPSAxMDU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHJhdmVsKSB7XG4gICAgICAgICAgICAgICAgdHJhdmVsICs9IE1hdGgucm91bmQoY29uZmlnLnZhbHVlICogMTUwIC8gMTAwMDAwKTtcbiAgICAgICAgICAgICAgICBjb25maWcuYmFja2dyb3VuZENvbG9yID0gJyMwMCcgKyB0cmF2ZWwudG9TdHJpbmcoMTYpICsgJzAwJztcbiAgICAgICAgICAgICAgICBjb25maWcuY29sb3IgPSAnI0ZGRkZGRic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vVGVzdGluZ1xuICAgICAgICAgICAgaWYgKGNvbEluZGV4ID09PSBpZHgudG90YWxOdW1iZXJPZlBldHNPd25lZCkge1xuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogQmUgc3VyZSB0byBhZGp1c3QgdGhlIGRhdGEgc2V0IHRvIHRoZSBhcHByb3ByaWF0ZSB0eXBlIGFuZCBzaGFwZSBpbiB3aWRlZGF0YS5qc1xuICAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gc2ltcGxlQ2VsbDsgLy9XT1JLU1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuIGVtcHR5Q2VsbDsgLy9XT1JLU1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuIGJ1dHRvbkNlbGw7IC8vV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBlcnJvckNlbGw7IC8vV09SS1M6IE5vdGVkIHRoYXQgYW55IGVycm9yIGluIHRoaXMgZnVuY3Rpb24gc3RlYWxzIHRoZSBtYWluIHRocmVhZCBieSByZWN1cnNpb25cbiAgICAgICAgICAgICAgICAvL3JldHVybiBzcGFya0xpbmVDZWxsOyAvLyBXT1JLU1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHNwYXJrQmFyQ2VsbDsgLy9XT1JLU1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHNsaWRlckNlbGw7IC8vV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiB0cmVlQ2VsbDsgLy9OZWVkIHRvIGZpZ3VyZSBvdXQgZGF0YSBzaGFwZSB0byB0ZXN0XG5cblxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogVGVzdCBvZiBDdXN0b21pemVkIFJlbmRlcmVyXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgLy8gaWYgKHN0YXJyeSl7XG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5kb21haW4gPSA1OyAvLyBkZWZhdWx0IGlzIDEwMFxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuc2l6ZUZhY3RvciA9ICAwLjY1OyAvLyBkZWZhdWx0IGlzIDAuNjU7IHNpemUgb2Ygc3RhcnMgYXMgZnJhY3Rpb24gb2YgaGVpZ2h0IG9mIGNlbGxcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmRhcmtlbkZhY3RvciA9IDAuNzU7IC8vIGRlZmF1bHQgaXMgMC43NTsgc3RhciBzdHJva2UgY29sb3IgYXMgZnJhY3Rpb24gb2Ygc3RhciBmaWxsIGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5jb2xvciA9ICdnb2xkJzsgLy8gZGVmYXVsdCBpcyAnZ29sZCc7IHN0YXIgZmlsbCBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuZmdDb2xvciA9ICAnZ3JleSc7IC8vIGRlZmF1bHQgaXMgJ3RyYW5zcGFyZW50JyAobm90IHJlbmRlcmVkKTsgdGV4dCBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuZmdTZWxDb2xvciA9ICd5ZWxsb3cnOyAvLyBkZWZhdWx0IGlzICd0cmFuc3BhcmVudCcgKG5vdCByZW5kZXJlZCk7IHRleHQgc2VsZWN0aW9uIGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5iZ0NvbG9yID0gJyM0MDQwNDAnOyAvLyBkZWZhdWx0IGlzICd0cmFuc3BhcmVudCcgKG5vdCByZW5kZXJlZCk7IGJhY2tncm91bmQgY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmJnU2VsQ29sb3IgPSAnZ3JleSc7IC8vIGRlZmF1bHQgaXMgJ3RyYW5zcGFyZW50JyAobm90IHJlbmRlcmVkKTsgYmFja2dyb3VuZCBzZWxlY3Rpb24gY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLnNoYWRvd0NvbG9yID0gJ3RyYW5zcGFyZW50JzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnXG4gICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBzdGFycnk7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdyaWQuY2VsbFJlbmRlcmVycy5nZXQocmVuZGVyZXJOYW1lKTtcbiAgICB9O1xuXG4gICAgLy9FTkQgT0YgR0VUIENFTExcblxuXG4gICAgLy8gQ1VTVE9NIENFTEwgUkVOREVSRVJcblxuICAgIHZhciBSRUdFWFBfQ1NTX0hFWDYgPSAvXiMoLi4pKC4uKSguLikkLyxcbiAgICAgICAgUkVHRVhQX0NTU19SR0IgPSAvXnJnYmFcXCgoXFxkKyksKFxcZCspLChcXGQrKSxcXGQrXFwpJC87XG5cbiAgICBmdW5jdGlvbiBwYWludFNwYXJrUmF0aW5nKGdjLCBjb25maWcpIHtcbiAgICAgICAgdmFyIHggPSBjb25maWcuYm91bmRzLngsXG4gICAgICAgICAgICB5ID0gY29uZmlnLmJvdW5kcy55LFxuICAgICAgICAgICAgd2lkdGggPSBjb25maWcuYm91bmRzLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0ID0gY29uZmlnLmJvdW5kcy5oZWlnaHQsXG4gICAgICAgICAgICBvcHRpb25zID0gY29uZmlnLnZhbHVlLFxuICAgICAgICAgICAgZG9tYWluID0gb3B0aW9ucy5kb21haW4gfHwgY29uZmlnLmRvbWFpbiB8fCAxMDAsXG4gICAgICAgICAgICBzaXplRmFjdG9yID0gb3B0aW9ucy5zaXplRmFjdG9yIHx8IGNvbmZpZy5zaXplRmFjdG9yIHx8IDAuNjUsXG4gICAgICAgICAgICBkYXJrZW5GYWN0b3IgPSBvcHRpb25zLmRhcmtlbkZhY3RvciB8fCBjb25maWcuZGFya2VuRmFjdG9yIHx8IDAuNzUsXG4gICAgICAgICAgICBjb2xvciA9IG9wdGlvbnMuY29sb3IgfHwgY29uZmlnLmNvbG9yIHx8ICdnb2xkJyxcbiAgICAgICAgICAgIHN0cm9rZSA9IHRoaXMuc3Ryb2tlID0gY29sb3IgPT09IHRoaXMuY29sb3IgPyB0aGlzLnN0cm9rZSA6IGdldERhcmtlbmVkQ29sb3IoZ2MsIHRoaXMuY29sb3IgPSBjb2xvciwgZGFya2VuRmFjdG9yKSxcbiAgICAgICAgICAgIC8vIGJnQ29sb3IgPSBjb25maWcuaXNTZWxlY3RlZCA/IChvcHRpb25zLmJnU2VsQ29sb3IgfHwgY29uZmlnLmJnU2VsQ29sb3IpIDogKG9wdGlvbnMuYmdDb2xvciB8fCBjb25maWcuYmdDb2xvciksXG4gICAgICAgICAgICBmZ0NvbG9yID0gY29uZmlnLmlzU2VsZWN0ZWQgPyAob3B0aW9ucy5mZ1NlbENvbG9yIHx8IGNvbmZpZy5mZ1NlbENvbG9yKSA6IChvcHRpb25zLmZnQ29sb3IgfHwgY29uZmlnLmZnQ29sb3IpLFxuICAgICAgICAgICAgc2hhZG93Q29sb3IgPSBvcHRpb25zLnNoYWRvd0NvbG9yIHx8IGNvbmZpZy5zaGFkb3dDb2xvciB8fCAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgLy8gZm9udCA9IG9wdGlvbnMuZm9udCB8fCBjb25maWcuZm9udCB8fCAnMTFweCB2ZXJkYW5hJyxcbiAgICAgICAgICAgIG1pZGRsZSA9IGhlaWdodCAvIDIsXG4gICAgICAgICAgICBkaWFtZXRlciA9IHNpemVGYWN0b3IgKiBoZWlnaHQsXG4gICAgICAgICAgICBvdXRlclJhZGl1cyA9IHNpemVGYWN0b3IgKiBtaWRkbGUsXG4gICAgICAgICAgICB2YWwgPSBOdW1iZXIob3B0aW9ucy52YWwpLFxuICAgICAgICAgICAgcG9pbnRzID0gdGhpcy5wb2ludHM7XG5cbiAgICAgICAgaWYgKCFwb2ludHMpIHtcbiAgICAgICAgICAgIHZhciBpbm5lclJhZGl1cyA9IDMgLyA3ICogb3V0ZXJSYWRpdXM7XG4gICAgICAgICAgICBwb2ludHMgPSB0aGlzLnBvaW50cyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDUsIHBpID0gTWF0aC5QSSAvIDIsIGluY3IgPSBNYXRoLlBJIC8gNTsgaTsgLS1pLCBwaSArPSBpbmNyKSB7XG4gICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiBvdXRlclJhZGl1cyAqIE1hdGguY29zKHBpKSxcbiAgICAgICAgICAgICAgICAgICAgeTogbWlkZGxlIC0gb3V0ZXJSYWRpdXMgKiBNYXRoLnNpbihwaSlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBwaSArPSBpbmNyO1xuICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgeDogaW5uZXJSYWRpdXMgKiBNYXRoLmNvcyhwaSksXG4gICAgICAgICAgICAgICAgICAgIHk6IG1pZGRsZSAtIGlubmVyUmFkaXVzICogTWF0aC5zaW4ocGkpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb2ludHMucHVzaChwb2ludHNbMF0pOyAvLyBjbG9zZSB0aGUgcGF0aFxuICAgICAgICB9XG5cbiAgICAgICAgZ2MuY2FjaGUuc2hhZG93Q29sb3IgPSAndHJhbnNwYXJlbnQnO1xuXG4gICAgICAgIGdjLmNhY2hlLmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICAgICAgZ2MuYmVnaW5QYXRoKCk7XG4gICAgICAgIGZvciAodmFyIGogPSA1LCBzeCA9IHggKyA1ICsgb3V0ZXJSYWRpdXM7IGo7IC0taiwgc3ggKz0gZGlhbWV0ZXIpIHtcbiAgICAgICAgICAgIHBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBvaW50LCBpbmRleCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICAgICAgZ2NbaW5kZXggPyAnbGluZVRvJyA6ICdtb3ZlVG8nXShzeCArIHBvaW50LngsIHkgKyBwb2ludC55KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgfSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgfVxuICAgICAgICBnYy5jbG9zZVBhdGgoKTtcblxuICAgICAgICB2YWwgPSB2YWwgLyBkb21haW4gKiA1O1xuXG4gICAgICAgIGdjLmNhY2hlLmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgICAgICBnYy5zYXZlKCk7XG4gICAgICAgIGdjLmNsaXAoKTtcbiAgICAgICAgZ2MuZmlsbFJlY3QoeCArIDUsIHksXG4gICAgICAgICAgICAoTWF0aC5mbG9vcih2YWwpICsgMC4yNSArIHZhbCAlIDEgKiAwLjUpICogZGlhbWV0ZXIsIC8vIGFkanVzdCB3aWR0aCB0byBza2lwIG92ZXIgc3RhciBvdXRsaW5lcyBhbmQganVzdCBtZXRlciB0aGVpciBpbnRlcmlvcnNcbiAgICAgICAgICAgIGhlaWdodCk7XG4gICAgICAgIGdjLnJlc3RvcmUoKTsgLy8gcmVtb3ZlIGNsaXBwaW5nIHJlZ2lvblxuXG4gICAgICAgIGdjLmNhY2hlLnN0cm9rZVN0eWxlID0gc3Ryb2tlO1xuICAgICAgICBnYy5jYWNoZS5saW5lV2lkdGggPSAxO1xuICAgICAgICBnYy5zdHJva2UoKTtcblxuICAgICAgICBpZiAoZmdDb2xvciAmJiBmZ0NvbG9yICE9PSAndHJhbnNwYXJlbnQnKSB7XG4gICAgICAgICAgICBnYy5jYWNoZS5maWxsU3R5bGUgPSBmZ0NvbG9yO1xuICAgICAgICAgICAgZ2MuY2FjaGUuZm9udCA9ICcxMXB4IHZlcmRhbmEnO1xuICAgICAgICAgICAgZ2MuY2FjaGUudGV4dEFsaWduID0gJ3JpZ2h0JztcbiAgICAgICAgICAgIGdjLmNhY2hlLnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xuICAgICAgICAgICAgZ2MuY2FjaGUuc2hhZG93Q29sb3IgPSBzaGFkb3dDb2xvcjtcbiAgICAgICAgICAgIGdjLmNhY2hlLnNoYWRvd09mZnNldFggPSBnYy5jYWNoZS5zaGFkb3dPZmZzZXRZID0gMTtcbiAgICAgICAgICAgIGdjLmZpbGxUZXh0KHZhbC50b0ZpeGVkKDEpLCB4ICsgd2lkdGggKyAxMCwgeSArIGhlaWdodCAvIDIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RGFya2VuZWRDb2xvcihnYywgY29sb3IsIGZhY3Rvcikge1xuICAgICAgICB2YXIgcmdiYSA9IGdldFJHQkEoZ2MsIGNvbG9yKTtcbiAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyBNYXRoLnJvdW5kKGZhY3RvciAqIHJnYmFbMF0pICsgJywnICsgTWF0aC5yb3VuZChmYWN0b3IgKiByZ2JhWzFdKSArICcsJyArIE1hdGgucm91bmQoZmFjdG9yICogcmdiYVsyXSkgKyAnLCcgKyAocmdiYVszXSB8fCAxKSArICcpJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRSR0JBKGdjLCBjb2xvclNwZWMpIHtcbiAgICAgICAgLy8gTm9ybWFsaXplIHZhcmlldHkgb2YgQ1NTIGNvbG9yIHNwZWMgc3ludGF4ZXMgdG8gb25lIG9mIHR3b1xuICAgICAgICBnYy5jYWNoZS5maWxsU3R5bGUgPSBjb2xvclNwZWM7XG5cbiAgICAgICAgdmFyIHJnYmEgPSBjb2xvclNwZWMubWF0Y2goUkVHRVhQX0NTU19IRVg2KTtcbiAgICAgICAgaWYgKHJnYmEpIHtcbiAgICAgICAgICAgIHJnYmEuc2hpZnQoKTsgLy8gcmVtb3ZlIHdob2xlIG1hdGNoXG4gICAgICAgICAgICByZ2JhLmZvckVhY2goZnVuY3Rpb24odmFsLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIHJnYmFbaW5kZXhdID0gcGFyc2VJbnQodmFsLCAxNik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJnYmEgPSBjb2xvclNwZWMubWF0Y2goUkVHRVhQX0NTU19SR0IpO1xuICAgICAgICAgICAgaWYgKCFyZ2JhKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ1VuZXhwZWN0ZWQgZm9ybWF0IGdldHRpbmcgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJELmZpbGxTdHlsZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZ2JhLnNoaWZ0KCk7IC8vIHJlbW92ZSB3aG9sZSBtYXRjaFxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJnYmE7XG4gICAgfVxuXG5cbiAgICAvL0V4dGVuZCBIeXBlckdyaWQncyBiYXNlIFJlbmRlcmVyXG4gICAgdmFyIHNwYXJrU3RhclJhdGluZ1JlbmRlcmVyID0gZ3JpZC5jZWxsUmVuZGVyZXJzLmdldCgnZW1wdHljZWxsJykuY29uc3RydWN0b3IuZXh0ZW5kKHtcbiAgICAgICAgcGFpbnQ6IHBhaW50U3BhcmtSYXRpbmdcbiAgICB9KTtcblxuICAgIC8vUmVnaXN0ZXIgeW91ciByZW5kZXJlclxuICAgIGdyaWQuY2VsbFJlbmRlcmVycy5hZGQoJ1N0YXJyeScsIHNwYXJrU3RhclJhdGluZ1JlbmRlcmVyKTtcblxuICAgIC8vIEVORCBPRiBDVVNUT00gQ0VMTCBSRU5ERVJFUlxuICAgIHJldHVybiBncmlkO1xufTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKiBnbG9iYWxzIHBlb3BsZTEsIHBlb3BsZTIgKi9cblxuLyogZXNsaW50LWRpc2FibGUgbm8tYWxlcnQgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBTb21lIERPTSBzdXBwb3J0IGZ1bmN0aW9ucy4uLlxuLy8gQmVzaWRlcyB0aGUgY2FudmFzLCB0aGlzIHRlc3QgaGFybmVzcyBvbmx5IGhhcyBhIGhhbmRmdWwgb2YgYnV0dG9ucyBhbmQgY2hlY2tib3hlcy5cbi8vIFRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIHNlcnZpY2UgdGhlc2UgY29udHJvbHMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVtbywgZ3JpZCkge1xuXG4gICAgLy8gbWFrZSBidXR0b25zIGRpdiBhYnNvbHV0ZSBzbyBidXR0b25zIHdpZHRoIG9mIDEwMCUgZG9lc24ndCBzdHJldGNoIHRvIHdpZHRoIG9mIGRhc2hib2FyZFxuICAgIHZhciBjdHJsR3JvdXBzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N0cmwtZ3JvdXBzJyksXG4gICAgICAgIGRhc2hib2FyZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkYXNoYm9hcmQnKSxcbiAgICAgICAgYnV0dG9ucyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidXR0b25zJyk7XG5cbiAgICBjdHJsR3JvdXBzLnN0eWxlLnRvcCA9IGN0cmxHcm91cHMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgJ3B4JztcbiAgICAvL2J1dHRvbnMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGRhc2hib2FyZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgZnVuY3Rpb24gdG9nZ2xlUm93U3R5bGluZ01ldGhvZCgpIHtcbiAgICAgICAgZGVtby5zdHlsZVJvd3NGcm9tRGF0YSA9ICFkZW1vLnN0eWxlUm93c0Zyb21EYXRhO1xuICAgIH1cblxuICAgIC8vIExpc3Qgb2YgcHJvcGVydGllcyB0byBzaG93IGFzIGNoZWNrYm94ZXMgaW4gdGhpcyBkZW1vJ3MgXCJkYXNoYm9hcmRcIlxuICAgIHZhciB0b2dnbGVQcm9wcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdSb3cgc3R5bGluZycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnKEdsb2JhbCBzZXR0aW5nKScsIGxhYmVsOiAnYmFzZSBvbiBkYXRhJywgc2V0dGVyOiB0b2dnbGVSb3dTdHlsaW5nTWV0aG9kfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ0NvbHVtbiBoZWFkZXIgcm93cycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnc2hvd0hlYWRlclJvdycsIGxhYmVsOiAnaGVhZGVyJ30sIC8vIGRlZmF1bHQgXCJzZXR0ZXJcIiBpcyBgc2V0UHJvcGBcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdIb3ZlciBoaWdobGlnaHRzJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge25hbWU6ICdob3ZlckNlbGxIaWdobGlnaHQuZW5hYmxlZCcsIGxhYmVsOiAnY2VsbCd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnaG92ZXJSb3dIaWdobGlnaHQuZW5hYmxlZCcsIGxhYmVsOiAncm93J30sXG4gICAgICAgICAgICAgICAge25hbWU6ICdob3ZlckNvbHVtbkhpZ2hsaWdodC5lbmFibGVkJywgbGFiZWw6ICdjb2x1bW4nfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ0xpbmsgc3R5bGUnLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2xpbmtPbkhvdmVyJywgbGFiZWw6ICdvbiBob3Zlcid9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnbGlua0NvbG9yJywgdHlwZTogJ3RleHQnLCBsYWJlbDogJ2NvbG9yJ30sXG4gICAgICAgICAgICAgICAge25hbWU6ICdsaW5rQ29sb3JPbkhvdmVyJywgbGFiZWw6ICdjb2xvciBvbiBob3Zlcid9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGxhYmVsOiAnQ2VsbCBlZGl0aW5nJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge25hbWU6ICdlZGl0YWJsZSd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnZWRpdE9uRG91YmxlQ2xpY2snLCBsYWJlbDogJ3JlcXVpcmVzIGRvdWJsZS1jbGljayd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnZWRpdE9uS2V5ZG93bicsIGxhYmVsOiAndHlwZSB0byBlZGl0J31cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbGFiZWw6ICdTZWxlY3Rpb24nLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zJywgbGFiZWw6ICdieSByb3cgaGFuZGxlcyBvbmx5Jywgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wLFxuICAgICAgICAgICAgICAgICAgICB0b29sdGlwOiAnTm90ZSB0aGF0IHdoZW4gdGhpcyBwcm9wZXJ0eSBpcyBhY3RpdmUsIGF1dG9TZWxlY3RSb3dzIHdpbGwgbm90IHdvcmsuJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge25hbWU6ICdzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlJywgbGFiZWw6ICdvbmUgcm93IGF0IGEgdGltZScsIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnIW11bHRpcGxlU2VsZWN0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnb25lIGNlbGwgcmVnaW9uIGF0IGEgdGltZScsXG4gICAgICAgICAgICAgICAgICAgIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcCxcbiAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnYXV0b1NlbGVjdFJvd3MnLCBsYWJlbDogJ2F1dG8tc2VsZWN0IHJvd3MnLCBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3AsXG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXA6ICdOb3RlczpcXG4nICtcbiAgICAgICAgICAgICAgICAgICAgJzEuIFJlcXVpcmVzIHRoYXQgY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucyBiZSBzZXQgdG8gZmFsc2UgKHNvIGNoZWNraW5nIHRoaXMgYm94IGF1dG9tYXRpY2FsbHkgdW5jaGVja3MgdGhhdCBvbmUpLlxcbicgK1xuICAgICAgICAgICAgICAgICAgICAnMi4gU2V0IHNpbmdsZVJvd1NlbGVjdGlvbk1vZGUgdG8gZmFsc2UgdG8gYWxsb3cgYXV0by1zZWxlY3Qgb2YgbXVsdGlwbGUgcm93cy4nXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2F1dG9TZWxlY3RDb2x1bW5zJywgbGFiZWw6ICdhdXRvLXNlbGVjdCBjb2x1bW5zJywgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wfVxuICAgICAgICAgICAgXVxuICAgICAgICB9XG4gICAgXTtcblxuXG4gICAgdG9nZ2xlUHJvcHMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgIGFkZFRvZ2dsZShwcm9wKTtcbiAgICB9KTtcblxuXG4gICAgW1xuICAgICAgICB7bGFiZWw6ICdUb2dnbGUgRW1wdHkgRGF0YScsIG9uY2xpY2s6IGRlbW8udG9nZ2xlRW1wdHlEYXRhfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdTZXQgRGF0YScsIG9uY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGVtby5yZXNldERhdGEoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdTZXQgRGF0YSAxICg1MDAwIHJvd3MpJywgb25jbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZW1vLnNldERhdGEocGVvcGxlMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnU2V0IERhdGEgMiAoMTAwMDAgcm93cyknLCBvbmNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRlbW8uc2V0RGF0YShwZW9wbGUyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge2xhYmVsOiAnUmVzZXQgR3JpZCcsIG9uY2xpY2s6IGRlbW8ucmVzZXR9XG5cbiAgICBdLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBpdGVtLmxhYmVsO1xuICAgICAgICBidXR0b24ub25jbGljayA9IGl0ZW0ub25jbGljaztcbiAgICAgICAgaWYgKGl0ZW0udGl0bGUpIHtcbiAgICAgICAgICAgIGJ1dHRvbi50aXRsZSA9IGl0ZW0udGl0bGU7XG4gICAgICAgIH1cbiAgICAgICAgYnV0dG9ucy5hcHBlbmRDaGlsZChidXR0b24pO1xuICAgIH0pO1xuXG5cbiAgICBmdW5jdGlvbiBhZGRUb2dnbGUoY3RybEdyb3VwKSB7XG4gICAgICAgIHZhciBpbnB1dCwgbGFiZWwsXG4gICAgICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gJ2N0cmwtZ3JvdXAnO1xuXG4gICAgICAgIGlmIChjdHJsR3JvdXAubGFiZWwpIHtcbiAgICAgICAgICAgIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBsYWJlbC5jbGFzc05hbWUgPSAndHdpc3Rlcic7XG4gICAgICAgICAgICBsYWJlbC5pbm5lckhUTUwgPSBjdHJsR3JvdXAubGFiZWw7XG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobGFiZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNob2ljZXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY2hvaWNlcy5jbGFzc05hbWUgPSAnY2hvaWNlcyc7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjaG9pY2VzKTtcblxuICAgICAgICBjdHJsR3JvdXAuY3RybHMuZm9yRWFjaChmdW5jdGlvbihjdHJsKSB7XG4gICAgICAgICAgICBpZiAoIWN0cmwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZWZlcmVuY2VFbGVtZW50LFxuICAgICAgICAgICAgICAgIHR5cGUgPSBjdHJsLnR5cGUgfHwgJ2NoZWNrYm94JyxcbiAgICAgICAgICAgICAgICB0b29sdGlwID0gJ1Byb3BlcnR5IG5hbWU6ICcgKyBjdHJsLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChjdHJsLnRvb2x0aXApIHtcbiAgICAgICAgICAgICAgICB0b29sdGlwICs9ICdcXG5cXG4nICsgY3RybC50b29sdGlwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICBpbnB1dC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgIGlucHV0LmlkID0gY3RybC5uYW1lO1xuICAgICAgICAgICAgaW5wdXQubmFtZSA9IGN0cmxHcm91cC5sYWJlbDtcblxuICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gY3RybC52YWx1ZSB8fCBnZXRQcm9wZXJ0eShjdHJsLm5hbWUpIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC5zdHlsZS53aWR0aCA9ICcyNXB4JztcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUubWFyZ2luTGVmdCA9ICc0cHgnO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC5zdHlsZS5tYXJnaW5SaWdodCA9ICc0cHgnO1xuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VFbGVtZW50ID0gaW5wdXQ7IC8vIGxhYmVsIGdvZXMgYWZ0ZXIgaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnY2hlY2tib3gnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3JhZGlvJzpcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuY2hlY2tlZCA9ICdjaGVja2VkJyBpbiBjdHJsXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGN0cmwuY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAgICAgOiBnZXRQcm9wZXJ0eShjdHJsLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VFbGVtZW50ID0gbnVsbDsgLy8gbGFiZWwgZ29lcyBiZWZvcmUgaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlucHV0Lm9uY2hhbmdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVSYWRpb0NsaWNrLmNhbGwodGhpcywgY3RybC5zZXR0ZXIgfHwgc2V0UHJvcCwgZXZlbnQpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgICAgICAgICAgbGFiZWwudGl0bGUgPSB0b29sdGlwO1xuICAgICAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgbGFiZWwuaW5zZXJ0QmVmb3JlKFxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcgJyArIChjdHJsLmxhYmVsIHx8IGN0cmwubmFtZSkpLFxuICAgICAgICAgICAgICAgIHJlZmVyZW5jZUVsZW1lbnRcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNob2ljZXMuYXBwZW5kQ2hpbGQobGFiZWwpO1xuXG4gICAgICAgICAgICBpZiAoY3RybC5uYW1lID09PSAndHJlZXZpZXcnKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwub25tb3VzZWRvd24gPSBpbnB1dC5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5wdXQuY2hlY2tlZCAmJiBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbC5zb3VyY2UuZGF0YSAhPT0gZGVtby50cmVlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0xvYWQgdHJlZSBkYXRhIGZpcnN0IChcIlNldCBEYXRhIDNcIiBidXR0b24pLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGN0cmxHcm91cHMuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICB9XG5cbiAgICAvLyByZXNldCBkYXNoYm9hcmQgY2hlY2tib3hlcyBhbmQgcmFkaW8gYnV0dG9ucyB0byBtYXRjaCBjdXJyZW50IHZhbHVlcyBvZiBncmlkIHByb3BlcnRpZXNcbiAgICBkZW1vLnJlc2V0RGFzaGJvYXJkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRvZ2dsZVByb3BzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICAgICAgcHJvcC5jdHJscy5mb3JFYWNoKGZ1bmN0aW9uKGN0cmwpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3RybCkge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGN0cmwuc2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHNldFNlbGVjdGlvblByb3A6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHNldFByb3A6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGN0cmwudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdyYWRpbyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSBjdHJsLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9sYXJpdHkgPSAoaWRbMF0gPT09ICchJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuY2hlY2tlZCA9IGdldFByb3BlcnR5KGlkKSBeIHBvbGFyaXR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZ2V0UHJvcGVydHkoa2V5KSB7XG4gICAgICAgIHZhciBrZXlzID0ga2V5LnNwbGl0KCcuJyk7XG4gICAgICAgIHZhciBwcm9wID0gZ3JpZC5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIHdoaWxlIChrZXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgcHJvcCA9IHByb3Bba2V5cy5zaGlmdCgpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm9wO1xuICAgIH1cblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWItZGFzaGJvYXJkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZGFzaGJvYXJkLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJykge1xuICAgICAgICAgICAgZGFzaGJvYXJkLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUudHJhbnNpdGlvbiA9ICdtYXJnaW4tbGVmdCAuNzVzJztcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLm1hcmdpbkxlZnQgPSBNYXRoLm1heCgxODAsIGRhc2hib2FyZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5yaWdodCArIDgpICsgJ3B4JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZGFzaGJvYXJkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9LCA4MDApO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUubWFyZ2luTGVmdCA9ICczMHB4JztcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGZwc1RpbWVyLCBzZWNzLCBmcmFtZXM7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi1mcHMnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXMsIHN0ID0gZWwuc3R5bGU7XG4gICAgICAgIGlmICgoZ3JpZC5wcm9wZXJ0aWVzLmVuYWJsZUNvbnRpbnVvdXNSZXBhaW50IF49IHRydWUpKSB7XG4gICAgICAgICAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSAnIzY2Nic7XG4gICAgICAgICAgICBzdC50ZXh0QWxpZ24gPSAnbGVmdCc7XG4gICAgICAgICAgICBzZWNzID0gZnJhbWVzID0gMDtcbiAgICAgICAgICAgIGNvZGUoKTtcbiAgICAgICAgICAgIGZwc1RpbWVyID0gc2V0SW50ZXJ2YWwoY29kZSwgMTAwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGZwc1RpbWVyKTtcbiAgICAgICAgICAgIHN0LmJhY2tncm91bmRDb2xvciA9IHN0LnRleHRBbGlnbiA9IG51bGw7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSAnRlBTJztcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBjb2RlKCkge1xuICAgICAgICAgICAgdmFyIGZwcyA9IGdyaWQuY2FudmFzLmN1cnJlbnRGUFMsXG4gICAgICAgICAgICAgICAgYmFycyA9IEFycmF5KE1hdGgucm91bmQoZnBzKSArIDEpLmpvaW4oJ0knKSxcbiAgICAgICAgICAgICAgICBzdWJyYW5nZSwgc3BhbjtcblxuICAgICAgICAgICAgLy8gZmlyc3Qgc3BhbiBob2xkcyB0aGUgMzAgYmFja2dyb3VuZCBiYXJzXG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSk7XG5cbiAgICAgICAgICAgIC8vIDJuZCBzcGFuIGhvbGRzIHRoZSBudW1lcmljXG4gICAgICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG4gICAgICAgICAgICBpZiAoc2Vjcykge1xuICAgICAgICAgICAgICAgIGZyYW1lcyArPSBmcHM7XG4gICAgICAgICAgICAgICAgc3Bhbi5pbm5lckhUTUwgPSBmcHMudG9GaXhlZCgxKTtcbiAgICAgICAgICAgICAgICBzcGFuLnRpdGxlID0gc2VjcyArICctc2Vjb25kIGF2ZXJhZ2UgPSAnICsgKGZyYW1lcyAvIHNlY3MpLnRvRml4ZWQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWNzICs9IDE7XG5cbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4pO1xuXG4gICAgICAgICAgICAvLyAwIHRvIDQgY29sb3IgcmFuZ2UgYmFyIHN1YnNldHM6IDEuLjEwOnJlZCwgMTE6MjA6eWVsbG93LCAyMTozMDpncmVlblxuICAgICAgICAgICAgd2hpbGUgKChzdWJyYW5nZSA9IGJhcnMuc3Vic3RyKDAsIDEyKSkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgICAgICBzcGFuLmlubmVySFRNTCA9IHN1YnJhbmdlO1xuICAgICAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICAgICAgICAgIGJhcnMgPSBiYXJzLnN1YnN0cigxMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBoZWlnaHQ7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi1ncm93LXNocmluaycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGxhYmVsO1xuICAgICAgICBpZiAoIWhlaWdodCkge1xuICAgICAgICAgICAgaGVpZ2h0ID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZ3JpZC5kaXYpLmhlaWdodDtcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLnRyYW5zaXRpb24gPSAnaGVpZ2h0IDEuNXMgbGluZWFyJztcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCArICdweCc7XG4gICAgICAgICAgICBsYWJlbCA9ICdTaHJpbmsnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgaGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGFiZWwgPSAnR3Jvdyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbm5lckhUTUwgKz0gJyAuLi4nO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBsYWJlbDtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAxNTAwKTtcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkYXNoYm9hcmQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBjdHJsID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICBpZiAoY3RybC5jbGFzc0xpc3QuY29udGFpbnMoJ3R3aXN0ZXInKSkge1xuICAgICAgICAgICAgY3RybC5uZXh0RWxlbWVudFNpYmxpbmcuc3R5bGUuZGlzcGxheSA9IGN0cmwuY2xhc3NMaXN0LnRvZ2dsZSgnb3BlbicpID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLm1hcmdpbkxlZnQgPSBNYXRoLm1heCgxODAsIGV2ZW50LmN1cnJlbnRUYXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHQgKyA4KSArICdweCc7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgdmFyIHJhZGlvR3JvdXAgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZVJhZGlvQ2xpY2soaGFuZGxlciwgZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ3JhZGlvJykge1xuICAgICAgICAgICAgdmFyIGxhc3RSYWRpbyA9IHJhZGlvR3JvdXBbdGhpcy5uYW1lXTtcbiAgICAgICAgICAgIGlmIChsYXN0UmFkaW8pIHtcbiAgICAgICAgICAgICAgICBsYXN0UmFkaW8uaGFuZGxlci5jYWxsKGxhc3RSYWRpby5jdHJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJhZGlvR3JvdXBbdGhpcy5uYW1lXSA9IHtjdHJsOiB0aGlzLCBoYW5kbGVyOiBoYW5kbGVyfTtcbiAgICAgICAgfVxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFByb3AoKSB7IC8vIHN0YW5kYXJkIGNoZWNrYm94IGNsaWNrIGhhbmRsZXJcbiAgICAgICAgdmFyIGhhc2ggPSB7fSwgZGVwdGggPSBoYXNoO1xuICAgICAgICB2YXIgaWQgPSB0aGlzLmlkO1xuICAgICAgICBpZiAoaWRbMF0gPT09ICchJykge1xuICAgICAgICAgICAgaWYgKHRoaXMudHlwZSAhPT0gJ2NoZWNrYm94Jykge1xuICAgICAgICAgICAgICAgIHRocm93ICdFeHBlY3RlZCBpbnZlcnNlIG9wZXJhdG9yICghKSBvbiBjaGVja2JveCBkYXNoYm9hcmQgY29udHJvbHMgb25seSBidXQgZm91bmQgb24gJyArIHRoaXMudHlwZSArICcuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkID0gaWQuc3Vic3RyKDEpO1xuICAgICAgICAgICAgdmFyIGludmVyc2UgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXlzID0gaWQuc3BsaXQoJy4nKTtcblxuICAgICAgICB3aGlsZSAoa2V5cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBkZXB0aCA9IGRlcHRoW2tleXMuc2hpZnQoKV0gPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgICAgICBkZXB0aFtrZXlzLnNoaWZ0KCldID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgICAgICAgICBkZXB0aFtrZXlzLnNoaWZ0KCldID0gaW52ZXJzZSA/ICF0aGlzLmNoZWNrZWQgOiB0aGlzLmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBncmlkLnRha2VGb2N1cygpO1xuICAgICAgICBncmlkLmFkZFByb3BlcnRpZXMoaGFzaCk7XG4gICAgICAgIGdyaWQuYmVoYXZpb3JDaGFuZ2VkKCk7XG4gICAgICAgIGdyaWQucmVwYWludCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFNlbGVjdGlvblByb3AoKSB7IC8vIGFsdGVybmF0ZSBjaGVja2JveCBjbGljayBoYW5kbGVyXG4gICAgICAgIHZhciBjdHJsO1xuXG4gICAgICAgIGdyaWQuc2VsZWN0aW9uTW9kZWwuY2xlYXIoKTtcbiAgICAgICAgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuY2xlYXJTZWxlY3RlZERhdGEoKTtcblxuICAgICAgICBzZXRQcm9wLmNhbGwodGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMuY2hlY2tlZCkge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHRoaXMuaWQgPT09ICdjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zJyAmJlxuICAgICAgICAgICAgICAgIChjdHJsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dG9TZWxlY3RSb3dzJykpLmNoZWNrZWRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCdOb3RlIHRoYXQgYXV0b1NlbGVjdFJvd3MgaXMgaW5lZmZlY3R1YWwgd2hlbiBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zIGlzIG9uLicpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlkID09PSAnYXV0b1NlbGVjdFJvd3MnKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAoY3RybCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zJykpLmNoZWNrZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgY29uZmlybSgnTm90ZSB0aGF0IGF1dG9TZWxlY3RSb3dzIGlzIGluZWZmZWN0dWFsIHdoZW4gY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucyBpcyBvbi5cXG5cXG5UdXJuIG9mZiBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zPycpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzZXRQcm9wLmNhbGwoY3RybCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAoY3RybCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlJykpLmNoZWNrZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgY29uZmlybSgnTm90ZSB0aGF0IGF1dG8tc2VsZWN0aW5nIGEgcmFuZ2Ugb2Ygcm93cyBieSBzZWxlY3RpbmcgYSByYW5nZSBvZiBjZWxscyAod2l0aCBjbGljayArIGRyYWcgb3Igc2hpZnQgKyBjbGljaykgaXMgbm90IHBvc3NpYmxlIHdpdGggc2luZ2xlUm93U2VsZWN0aW9uTW9kZSBpcyBvbi5cXG5cXG5UdXJuIG9mZiBzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlPycpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzZXRQcm9wLmNhbGwoY3RybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWNsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgY2VsbCA9IGUuZGV0YWlsLmdyaWRDZWxsO1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tY2xpY2sgY2VsbDonLCBjZWxsKTsgfVxuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tZG91YmxlLWNsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgcm93Q29udGV4dCA9IGUuZGV0YWlsLmRhdGFSb3c7XG4gICAgICAgIGlmIChkZW1vLnZlbnQpIHsgY29uc29sZS5sb2coJ2Zpbi1kb3VibGUtY2xpY2sgcm93LWNvbnRleHQ6Jywgcm93Q29udGV4dCk7IH1cbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWJ1dHRvbi1wcmVzc2VkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgY2VsbEV2ZW50ID0gZS5kZXRhaWw7XG4gICAgICAgIGNlbGxFdmVudC52YWx1ZSA9ICFjZWxsRXZlbnQudmFsdWU7XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1zY3JvbGwteCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGRlbW8udmVudCkgeyBjb25zb2xlLmxvZygnZmluLXNjcm9sbC14ICcsIGUuZGV0YWlsLnZhbHVlKTsgfVxuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tc2Nyb2xsLXknLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChkZW1vLnZlbnQpIHsgY29uc29sZS5sb2coJ2Zpbi1zY3JvbGwteScsIGUuZGV0YWlsLnZhbHVlKTsgfVxuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tY2VsbC1lbnRlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGNlbGxFdmVudCA9IGUuZGV0YWlsO1xuXG4gICAgICAgIC8vaWYgKGRlbW8udmVudCkgeyBjb25zb2xlLmxvZygnZmluLWNlbGwtZW50ZXInLCBjZWxsLngsIGNlbGwueSk7IH1cblxuICAgICAgICAvL2hvdyB0byBzZXQgdGhlIHRvb2x0aXAuLi4uXG4gICAgICAgIGdyaWQuc2V0QXR0cmlidXRlKCd0aXRsZScsICdldmVudCBuYW1lOiBcImZpbi1jZWxsLWVudGVyXCJcXG4nICtcbiAgICAgICAgICAgICdncmlkQ2VsbDogeyB4OiAnICsgY2VsbEV2ZW50LmdyaWRDZWxsLnggKyAnLCB5OiAnICsgY2VsbEV2ZW50LmdyaWRDZWxsLnkgKyAnIH1cXG4nICtcbiAgICAgICAgICAgICdkYXRhQ2VsbDogeyB4OiAnICsgY2VsbEV2ZW50LmRhdGFDZWxsLnggKyAnLCB5OiAnICsgY2VsbEV2ZW50LmRhdGFDZWxsLnkgKyAnIH1cXG4nICtcbiAgICAgICAgICAgICdzdWJncmlkIHR5cGU6IFwiJyArIGNlbGxFdmVudC5zdWJncmlkLnR5cGUgKyAnXCJcXG4nICtcbiAgICAgICAgICAgICdzdWJncmlkIG5hbWU6ICcgKyAoY2VsbEV2ZW50LnN1YmdyaWQubmFtZSA/ICdcIicgKyBjZWxsRXZlbnQuc3ViZ3JpZC5uYW1lICsgJ1wiJyA6ICd1bmRlZmluZWQnKVxuICAgICAgICApO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tc2V0LXRvdGFscy12YWx1ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGRldGFpbCA9IGUuZGV0YWlsLFxuICAgICAgICAgICAgYXJlYXMgPSBkZXRhaWwuYXJlYXMgfHwgWyd0b3AnLCAnYm90dG9tJ107XG5cbiAgICAgICAgYXJlYXMuZm9yRWFjaChmdW5jdGlvbihhcmVhKSB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kTmFtZSA9ICdnZXQnICsgYXJlYVswXS50b1VwcGVyQ2FzZSgpICsgYXJlYS5zdWJzdHIoMSkgKyAnVG90YWxzJyxcbiAgICAgICAgICAgICAgICB0b3RhbHNSb3cgPSBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbFttZXRob2ROYW1lXSgpO1xuXG4gICAgICAgICAgICB0b3RhbHNSb3dbZGV0YWlsLnldW2RldGFpbC54XSA9IGRldGFpbC52YWx1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1maWx0ZXItYXBwbGllZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGRlbW8udmVudCkgeyBjb25zb2xlLmxvZygnZmluLWZpbHRlci1hcHBsaWVkJywgZSk7IH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IExpc3RlbiBmb3IgY2VydGFpbiBrZXkgcHJlc3NlcyBmcm9tIGdyaWQgb3IgY2VsbCBlZGl0b3IuXG4gICAgICogQGRlc2MgTk9URTogZmluY2FudmFzJ3MgaW50ZXJuYWwgY2hhciBtYXAgeWllbGRzIG1peGVkIGNhc2Ugd2hpbGUgZmluLWVkaXRvci1rZXkqIGV2ZW50cyBkbyBub3QuXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gTm90IGhhbmRsZWQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaGFuZGxlQ3Vyc29yS2V5KGUpIHtcbiAgICAgICAgdmFyIGRldGFpbCA9IGUuZGV0YWlsLFxuICAgICAgICAgICAga2V5ID0gU3RyaW5nLmZyb21DaGFyQ29kZShkZXRhaWwua2V5KS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7IC8vIG1lYW5zIGV2ZW50IGhhbmRsZWQgaGVyZWluXG5cbiAgICAgICAgaWYgKGRldGFpbC5jdHJsKSB7XG4gICAgICAgICAgICBpZiAoZGV0YWlsLnNoaWZ0KSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnMCc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RUb1ZpZXdwb3J0Q2VsbCgwLCAwKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnOSc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RUb0ZpbmFsQ2VsbCgpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc4JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFRvRmluYWxDZWxsT2ZDdXJyZW50Um93KCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzcnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0VG9GaXJzdENlbGxPZkN1cnJlbnRSb3coKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzAnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0Vmlld3BvcnRDZWxsKDAsIDApOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc5JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdEZpbmFsQ2VsbCgpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc4JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdEZpbmFsQ2VsbE9mQ3VycmVudFJvdygpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc3JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdEZpcnN0Q2VsbE9mQ3VycmVudFJvdygpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4ta2V5ZG93bicsIGhhbmRsZUN1cnNvcktleSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1lZGl0b3Ita2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gdmFyIGRldGFpbCA9IGUuZGV0YWlsLFxuICAgICAgICAvLyAgICAga2UgPSBkZXRhaWwua2V5RXZlbnQ7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIC8vIG1vcmUgZGV0YWlsLCBwbGVhc2VcbiAgICAgICAgLy8gZGV0YWlsLnByaW1pdGl2ZUV2ZW50ID0ga2U7XG4gICAgICAgIC8vIGRldGFpbC5rZXkgPSBrZS5rZXlDb2RlO1xuICAgICAgICAvLyBkZXRhaWwuc2hpZnQgPSBrZS5zaGlmdEtleTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gaGFuZGxlQ3Vyc29yS2V5KGUpO1xuICAgIH0pO1xuXG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1zZWxlY3Rpb24tY2hhbmdlZCcsIGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICBpZiAoZGVtby52ZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZmluLXNlbGVjdGlvbi1jaGFuZ2VkJywgZ3JpZC5nZXRTZWxlY3RlZFJvd3MoKSwgZ3JpZC5nZXRTZWxlY3RlZENvbHVtbnMoKSwgZ3JpZC5nZXRTZWxlY3Rpb25zKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGUuZGV0YWlsLnNlbGVjdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbm8gc2VsZWN0aW9ucycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdG8gZ2V0IHRoZSBzZWxlY3RlZCByb3dzIHVuY29tbWVudCB0aGUgYmVsb3cuLi4uLlxuICAgICAgICAvLyBjb25zb2xlLmxvZyhncmlkLmdldFJvd1NlbGVjdGlvbk1hdHJpeCgpKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZ3JpZC5nZXRSb3dTZWxlY3Rpb24oKSk7XG5cbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLXJvdy1zZWxlY3Rpb24tY2hhbmdlZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGRldGFpbCA9IGUuZGV0YWlsO1xuXG4gICAgICAgIGlmIChkZW1vLnZlbnQpIHsgY29uc29sZS5sb2coJ2Zpbi1yb3ctc2VsZWN0aW9uLWNoYW5nZWQnLCBkZXRhaWwpOyB9XG5cbiAgICAgICAgLy8gTW92ZSBjZWxsIHNlbGVjdGlvbiB3aXRoIHJvdyBzZWxlY3Rpb25cbiAgICAgICAgdmFyIHJvd3MgPSBkZXRhaWwucm93cyxcbiAgICAgICAgICAgIHNlbGVjdGlvbnMgPSBkZXRhaWwuc2VsZWN0aW9ucztcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgZ3JpZC5wcm9wZXJ0aWVzLnNpbmdsZVJvd1NlbGVjdGlvbk1vZGUgJiYgLy8gbGV0J3Mgb25seSBhdHRlbXB0IHRoaXMgd2hlbiBpbiB0aGlzIG1vZGVcbiAgICAgICAgICAgICFncmlkLnByb3BlcnRpZXMubXVsdGlwbGVTZWxlY3Rpb25zICYmIC8vIGFuZCBvbmx5IHdoZW4gaW4gc2luZ2xlIHNlbGVjdGlvbiBtb2RlXG4gICAgICAgICAgICByb3dzLmxlbmd0aCAmJiAvLyB1c2VyIGp1c3Qgc2VsZWN0ZWQgYSByb3cgKG11c3QgYmUgc2luZ2xlIHJvdyBkdWUgdG8gbW9kZSB3ZSdyZSBpbilcbiAgICAgICAgICAgIHNlbGVjdGlvbnMubGVuZ3RoICAvLyB0aGVyZSB3YXMgYSBjZWxsIHJlZ2lvbiBzZWxlY3RlZCAobXVzdCBiZSB0aGUgb25seSBvbmUpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdmFyIHJlY3QgPSBncmlkLnNlbGVjdGlvbk1vZGVsLmdldExhc3RTZWxlY3Rpb24oKSwgLy8gdGhlIG9ubHkgY2VsbCBzZWxlY3Rpb25cbiAgICAgICAgICAgICAgICB4ID0gcmVjdC5sZWZ0LFxuICAgICAgICAgICAgICAgIHkgPSByb3dzWzBdLCAvLyB3ZSBrbm93IHRoZXJlJ3Mgb25seSAxIHJvdyBzZWxlY3RlZFxuICAgICAgICAgICAgICAgIHdpZHRoID0gcmVjdC5yaWdodCAtIHgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gMCwgLy8gY29sbGFwc2UgdGhlIG5ldyByZWdpb24gdG8gb2NjdXB5IGEgc2luZ2xlIHJvd1xuICAgICAgICAgICAgICAgIGZpcmVTZWxlY3Rpb25DaGFuZ2VkRXZlbnQgPSBmYWxzZTtcblxuICAgICAgICAgICAgZ3JpZC5zZWxlY3Rpb25Nb2RlbC5zZWxlY3QoeCwgeSwgd2lkdGgsIGhlaWdodCwgZmlyZVNlbGVjdGlvbkNoYW5nZWRFdmVudCk7XG4gICAgICAgICAgICBncmlkLnJlcGFpbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb3dzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIHJvd3Mgc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvL3dlIGhhdmUgYSBmdW5jdGlvbiBjYWxsIHRvIGNyZWF0ZSB0aGUgc2VsZWN0aW9uIG1hdHJpeCBiZWNhdXNlXG4gICAgICAgIC8vd2UgZG9uJ3Qgd2FudCB0byBjcmVhdGUgYWxvdCBvZiBuZWVkbGVzcyBnYXJiYWdlIGlmIHRoZSB1c2VyXG4gICAgICAgIC8vaXMganVzdCBuYXZpZ2F0aW5nIGFyb3VuZFxuICAgICAgICBjb25zb2xlLmxvZyhncmlkLmdldFJvd1NlbGVjdGlvbk1hdHJpeCgpKTtcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZC5nZXRSb3dTZWxlY3Rpb24oKSk7XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1jb2x1bW4tc2VsZWN0aW9uLWNoYW5nZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChkZW1vLnZlbnQpIHsgY29uc29sZS5sb2coJ2Zpbi1jb2x1bW4tc2VsZWN0aW9uLWNoYW5nZWQnLCBlLmRldGFpbCk7IH1cblxuICAgICAgICBpZiAoZS5kZXRhaWwuY29sdW1ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyByb3dzIHNlbGVjdGVkJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy93ZSBoYXZlIGEgZnVuY3Rpb24gY2FsbCB0byBjcmVhdGUgdGhlIHNlbGVjdGlvbiBtYXRyaXggYmVjYXVzZVxuICAgICAgICAvL3dlIGRvbid0IHdhbnQgdG8gY3JlYXRlIGFsb3Qgb2YgbmVlZGxlc3MgZ2FyYmFnZSBpZiB0aGUgdXNlclxuICAgICAgICAvL2lzIGp1c3QgbmF2aWdhdGluZyBhcm91bmRcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZC5nZXRDb2x1bW5TZWxlY3Rpb25NYXRyaXgoKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGdyaWQuZ2V0Q29sdW1uU2VsZWN0aW9uKCkpO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tZWRpdG9yLWRhdGEtY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tZWRpdG9yLWRhdGEtY2hhbmdlJywgZS5kZXRhaWwpOyB9XG5cbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLXJlcXVlc3QtY2VsbC1lZGl0JywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tcmVxdWVzdC1jZWxsLWVkaXQnLCBlKTsgfVxuICAgICAgICAvL2UucHJldmVudERlZmF1bHQoKTsgLy91bmNvbW1lbnQgdG8gY2FuY2VsIGVkaXRvciBwb3BwaW5nIHVwXG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1iZWZvcmUtY2VsbC1lZGl0JywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tYmVmb3JlLWNlbGwtZWRpdCcsIGUpOyB9XG4gICAgICAgIC8vZS5wcmV2ZW50RGVmYXVsdCgpOyAvL3VuY29tbWVudCB0byBjYW5jZWwgdXBkYXRpbmcgdGhlIG1vZGVsIHdpdGggdGhlIG5ldyBkYXRhXG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1hZnRlci1jZWxsLWVkaXQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChkZW1vLnZlbnQpIHsgY29uc29sZS5sb2coJ2Zpbi1hZnRlci1jZWxsLWVkaXQnLCBlKTsgfVxuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tZWRpdG9yLWtleXVwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tZWRpdG9yLWtleXVwJywgZS5kZXRhaWwpOyB9XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1lZGl0b3Ita2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChkZW1vLnZlbnQpIHsgY29uc29sZS5sb2coJ2Zpbi1lZGl0b3Ita2V5cHJlc3MnLCBlLmRldGFpbCk7IH1cbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWVkaXRvci1rZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tZWRpdG9yLWtleWRvd24nLCBlLmRldGFpbCk7IH1cbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWdyb3Vwcy1jaGFuZ2VkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tZ3JvdXBzLWNoYW5nZWQnLCBlLmRldGFpbCk7IH1cbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWNvbnRleHQtbWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIG1vZGVsUG9pbnQgPSBlLmRldGFpbC5ncmlkQ2VsbDtcbiAgICAgICAgaWYgKGRlbW8udmVudCkgeyBjb25zb2xlLmxvZygnZmluLWNvbnRleHQtbWVudSgnICsgbW9kZWxQb2ludC54ICsgJywgJyArIG1vZGVsUG9pbnQueSArICcpJyk7IH1cbiAgICB9KTtcblxufTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKiBnbG9iYWxzIGZpbiwgcGVvcGxlMSAqL1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1hbGVydCovXG5cbid1c2Ugc3RyaWN0Jztcblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGRlbW8gPSB3aW5kb3cuZGVtbyA9IHtcbiAgICAgICAgdmVudDogZmFsc2UsXG4gICAgICAgIHJlc2V0OiByZXNldCxcbiAgICAgICAgc2V0RGF0YTogc2V0RGF0YSxcbiAgICAgICAgdG9nZ2xlRW1wdHlEYXRhOiB0b2dnbGVFbXB0eURhdGEsXG4gICAgICAgIHJlc2V0RGF0YTogcmVzZXREYXRhXG4gICAgfTtcblxuICAgIHZhciBIeXBlcmdyaWQgPSBmaW4uSHlwZXJncmlkLFxuICAgICAgICBpbml0U3RhdGUgPSByZXF1aXJlKCcuL3NldFN0YXRlJyksXG4gICAgICAgIGluaXRDZWxsUmVuZGVyZXJzID0gcmVxdWlyZSgnLi9jZWxscmVuZGVyZXJzJyksXG4gICAgICAgIGluaXRGb3JtYXR0ZXJzID0gcmVxdWlyZSgnLi9mb3JtYXR0ZXJzJyksXG4gICAgICAgIGluaXRDZWxsRWRpdG9ycyA9IHJlcXVpcmUoJy4vY2VsbEVkaXRvcnMnKSxcbiAgICAgICAgaW5pdERhc2hib2FyZCA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkJyksXG4gICAgICAgIGluaXRFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG4gICAgLy8gY29udmVydCBmaWVsZCBuYW1lcyBjb250YWluaW5nIHVuZGVyc2NvcmUgdG8gY2FtZWwgY2FzZSBieSBvdmVycmlkaW5nIGNvbHVtbiBlbnVtIGRlY29yYXRvclxuICAgIEh5cGVyZ3JpZC5iZWhhdmlvcnMuSlNPTi5wcm90b3R5cGUuY29sdW1uRW51bUtleSA9IEh5cGVyZ3JpZC5iZWhhdmlvcnMuSlNPTi5jb2x1bW5FbnVtRGVjb3JhdG9ycy50b0NhbWVsQ2FzZTtcblxuICAgIHZhciBncmlkT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGRhdGE6IHBlb3BsZTEsXG4gICAgICAgICAgICBtYXJnaW46IHsgYm90dG9tOiAnMTdweCcsIHJpZ2h0OiAnMTdweCd9LFxuICAgICAgICAgICAgc2NoZW1hOiBIeXBlcmdyaWQubGliLmZpZWxkcy5nZXRTY2hlbWEocGVvcGxlMSksXG4gICAgICAgICAgICBzdGF0ZTogeyBjb2xvcjogJ29yYW5nZScgfVxuICAgICAgICB9LFxuICAgICAgICBncmlkID0gd2luZG93LmdyaWQgPSB3aW5kb3cuZyA9IG5ldyBIeXBlcmdyaWQoJ2RpdiNqc29uLWV4YW1wbGUnLCBncmlkT3B0aW9ucyksXG4gICAgICAgIGJlaGF2aW9yID0gd2luZG93LmIgPSBncmlkLmJlaGF2aW9yLFxuICAgICAgICBkYXRhTW9kZWwgPSB3aW5kb3cubSA9IGJlaGF2aW9yLmRhdGFNb2RlbCxcbiAgICAgICAgaW5pdGlhbCA9IHRydWUsXG4gICAgICAgIGlkeCA9IGJlaGF2aW9yLmNvbHVtbkVudW07XG5cblxuICAgIGNvbnNvbGUubG9nKCdGaWVsZHM6Jyk7ICBjb25zb2xlLmRpcihiZWhhdmlvci5kYXRhTW9kZWwuc2NoZW1hLm1hcChmdW5jdGlvbihjcykgeyByZXR1cm4gY3MubmFtZTsgfSkpO1xuICAgIGNvbnNvbGUubG9nKCdIZWFkZXJzOicpOyBjb25zb2xlLmRpcihiZWhhdmlvci5kYXRhTW9kZWwuc2NoZW1hLm1hcChmdW5jdGlvbihjcykgeyByZXR1cm4gY3MuaGVhZGVyOyB9KSk7XG4gICAgY29uc29sZS5sb2coJ0luZGV4ZXM6Jyk7IGNvbnNvbGUuZGlyKGlkeCk7XG5cbiAgICBmdW5jdGlvbiBzZXREYXRhKGRhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9ICFkYXRhLmxlbmd0aCA/IHVuZGVmaW5lZCA6IG9wdGlvbnMgfHwge1xuICAgICAgICAgICAgc2NoZW1hOiBIeXBlcmdyaWQubGliLmZpZWxkcy5nZXRTY2hlbWEoZGF0YSlcbiAgICAgICAgfTtcbiAgICAgICAgZ3JpZC5zZXREYXRhKGRhdGEsIG9wdGlvbnMpO1xuICAgICAgICBiZWhhdmlvci5yZWluZGV4KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIGdyaWQucmVzZXQoKTtcbiAgICAgICAgaW5pdEV2ZW50cyhkZW1vLCBncmlkKTtcbiAgICB9XG5cbiAgICB2YXIgb2xkRGF0YTtcbiAgICBmdW5jdGlvbiB0b2dnbGVFbXB0eURhdGEoKSB7XG4gICAgICAgIGlmICghb2xkRGF0YSkge1xuICAgICAgICAgICAgb2xkRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhTW9kZWwuZ2V0RGF0YSgpLFxuICAgICAgICAgICAgICAgIHNjaGVtYTogZGF0YU1vZGVsLnNjaGVtYSxcbiAgICAgICAgICAgICAgICBhY3RpdmVDb2x1bW5zOiBiZWhhdmlvci5nZXRBY3RpdmVDb2x1bW5zKCkubWFwKGZ1bmN0aW9uKGNvbHVtbikgeyByZXR1cm4gY29sdW1uLmluZGV4OyB9KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vaW1wb3J0YW50IHRvIHNldCB0b3AgdG90YWxzIGZpcnN0XG4gICAgICAgICAgICBzZXREYXRhKFtdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vaW1wb3J0YW50IHRvIHNldCB0b3AgdG90YWxzIGZpcnN0XG4gICAgICAgICAgICBzZXREYXRhKG9sZERhdGEuZGF0YSwgb2xkRGF0YS5zY2hlbWEpO1xuICAgICAgICAgICAgYmVoYXZpb3Iuc2V0Q29sdW1uSW5kZXhlcyhvbGREYXRhLmFjdGl2ZUNvbHVtbnMpO1xuICAgICAgICAgICAgb2xkRGF0YSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc2V0RGF0YSgpIHtcbiAgICAgICAgc2V0RGF0YShwZW9wbGUxKTtcbiAgICAgICAgaWYgKGluaXRpYWwpIHtcbiAgICAgICAgICAgIGluaXREYXNoYm9hcmQoZGVtbywgZ3JpZCk7XG4gICAgICAgICAgICBpbml0aWFsID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgaW5pdFN0YXRlKGRlbW8sIGdyaWQpOyB9LCA1MCk7XG4gICAgfVxuXG4gICAgcmVzZXREYXRhKCk7XG5cbiAgICBpbml0Q2VsbFJlbmRlcmVycyhkZW1vLCBncmlkKTtcbiAgICBpbml0Rm9ybWF0dGVycyhkZW1vLCBncmlkKTtcbiAgICBpbml0Q2VsbEVkaXRvcnMoZGVtbywgZ3JpZCk7XG4gICAgaW5pdEV2ZW50cyhkZW1vLCBncmlkKTtcbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIHZhciBmb290SW5jaFBhdHRlcm4gPSAvXlxccyooKCgoXFxkKyknKT9cXHMqKChcXGQrKVwiKT8pfFxcZCspXFxzKiQvO1xuXG4gICAgdmFyIGZvb3RJbmNoTG9jYWxpemVyID0ge1xuICAgICAgICBmb3JtYXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHZhciBmZWV0ID0gTWF0aC5mbG9vcih2YWx1ZSAvIDEyKTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IChmZWV0ID8gZmVldCArICdcXCcnIDogJycpICsgJyAnICsgKHZhbHVlICUgMTIpICsgJ1wiJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBwYXJzZTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgICAgICB2YXIgaW5jaGVzLCBmZWV0LFxuICAgICAgICAgICAgICAgIHBhcnRzID0gc3RyLm1hdGNoKGZvb3RJbmNoUGF0dGVybik7XG4gICAgICAgICAgICBpZiAocGFydHMpIHtcbiAgICAgICAgICAgICAgICBmZWV0ID0gcGFydHNbNF07XG4gICAgICAgICAgICAgICAgaW5jaGVzID0gcGFydHNbNl07XG4gICAgICAgICAgICAgICAgaWYgKGZlZXQgPT09IHVuZGVmaW5lZCAmJiBpbmNoZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBpbmNoZXMgPSBOdW1iZXIocGFydHNbMV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZlZXQgPSBOdW1iZXIoZmVldCB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaW5jaGVzID0gTnVtYmVyKGluY2hlcyB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaW5jaGVzID0gMTIgKiBmZWV0ICsgaW5jaGVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5jaGVzID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbmNoZXM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKCdmb290JywgZm9vdEluY2hMb2NhbGl6ZXIpO1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKCdzaW5nZGF0ZScsIG5ldyBncmlkLmxvY2FsaXphdGlvbi5EYXRlRm9ybWF0dGVyKCd6aC1TRycpKTtcblxuICAgIGdyaWQubG9jYWxpemF0aW9uLmFkZCgncG91bmRzJywgbmV3IGdyaWQubG9jYWxpemF0aW9uLk51bWJlckZvcm1hdHRlcignZW4tVVMnLCB7XG4gICAgICAgIHN0eWxlOiAnY3VycmVuY3knLFxuICAgICAgICBjdXJyZW5jeTogJ1VTRCdcbiAgICB9KSk7XG5cbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoJ2ZyYW5jcycsIG5ldyBncmlkLmxvY2FsaXphdGlvbi5OdW1iZXJGb3JtYXR0ZXIoJ2ZyLUZSJywge1xuICAgICAgICBzdHlsZTogJ2N1cnJlbmN5JyxcbiAgICAgICAgY3VycmVuY3k6ICdFVVInXG4gICAgfSkpO1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKHtcbiAgICAgICAgbmFtZTogJ2hobW0nLCAvLyBhbHRlcm5hdGl2ZSB0byBoYXZpbmcgdG8gaGFtZSBsb2NhbGl6ZXIgaW4gYGdyaWQubG9jYWxpemF0aW9uLmFkZGBcblxuICAgICAgICAvLyByZXR1cm5zIGZvcm1hdHRlZCBzdHJpbmcgZnJvbSBudW1iZXJcbiAgICAgICAgZm9ybWF0OiBmdW5jdGlvbihtaW5zKSB7XG4gICAgICAgICAgICB2YXIgaGggPSBNYXRoLmZsb29yKG1pbnMgLyA2MCkgJSAxMiB8fCAxMiwgLy8gbW9kdWxvIDEyIGhycyB3aXRoIDAgYmVjb21pbmcgMTJcbiAgICAgICAgICAgICAgICBtbSA9IChtaW5zICUgNjAgKyAxMDAgKyAnJykuc3Vic3RyKDEsIDIpLFxuICAgICAgICAgICAgICAgIEFtUG0gPSBtaW5zIDwgZGVtby5OT09OID8gJ0FNJyA6ICdQTSc7XG4gICAgICAgICAgICByZXR1cm4gaGggKyAnOicgKyBtbSArICcgJyArIEFtUG07XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52YWxpZDogZnVuY3Rpb24oaGhtbSkge1xuICAgICAgICAgICAgcmV0dXJuICEvXigwP1sxLTldfDFbMC0yXSk6WzAtNV1cXGQkLy50ZXN0KGhobW0pOyAvLyAxMjo1OSBtYXhcbiAgICAgICAgfSxcblxuICAgICAgICAvLyByZXR1cm5zIG51bWJlciBmcm9tIGZvcm1hdHRlZCBzdHJpbmdcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKGhobW0pIHtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IGhobW0ubWF0Y2goL14oXFxkKyk6KFxcZHsyfSkkLyk7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyKHBhcnRzWzFdKSAqIDYwICsgTnVtYmVyKHBhcnRzWzJdKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGdyaWQ7XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVtbywgZ3JpZCkge1xuXG4gICAgdmFyIGlkeCA9IGdyaWQuYmVoYXZpb3IuY29sdW1uRW51bTtcblxuICAgIHZhciBzdGF0ZSA9IHtcbiAgICAgICAgY29sdW1uSW5kZXhlczogW1xuICAgICAgICAgICAgaWR4Lmxhc3ROYW1lLFxuICAgICAgICAgICAgaWR4LnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQsXG4gICAgICAgICAgICBpZHguaGVpZ2h0LFxuICAgICAgICAgICAgaWR4LmJpcnRoRGF0ZSxcbiAgICAgICAgICAgIGlkeC5iaXJ0aFRpbWUsXG4gICAgICAgICAgICBpZHguYmlydGhTdGF0ZSxcbiAgICAgICAgICAgIC8vIGlkeC5yZXNpZGVuY2VTdGF0ZSxcbiAgICAgICAgICAgIGlkeC5lbXBsb3llZCxcbiAgICAgICAgICAgIC8vIGlkeC5maXJzdE5hbWUsXG4gICAgICAgICAgICBpZHguaW5jb21lLFxuICAgICAgICAgICAgaWR4LnRyYXZlbCxcbiAgICAgICAgICAgIC8vIGlkeC5zcXVhcmVPZkluY29tZVxuICAgICAgICBdLFxuXG4gICAgICAgIG5vRGF0YU1lc3NhZ2U6ICdObyBEYXRhIHRvIERpc3BsYXknLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd3aGl0ZScsXG4gICAgICAgIGZvbnQ6ICdub3JtYWwgc21hbGwgZ2FyYW1vbmQnLFxuICAgICAgICByb3dQcm9wZXJ0aWVzOiBbXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB7IGNvbG9yOiAnIzExNjYxMScsIGJhY2tncm91bmRDb2xvcjogJyNlOGZmZTgnLCBmb250OiAnaXRhbGljIHNtYWxsIGdhcmFtb25kJyB9LFxuICAgICAgICAgICAgeyBjb2xvcjogJyMxMTY2MTEnLCBiYWNrZ3JvdW5kQ29sb3I6ICcjZThmZmU4JywgZm9udDogJ2l0YWxpYyBzbWFsbCBnYXJhbW9uZCcgfSxcbiAgICAgICAgICAgIHsgY29sb3I6ICcjMTE2NjExJywgYmFja2dyb3VuZENvbG9yOiAnI2U4ZmZlOCcsIGZvbnQ6ICdpdGFsaWMgc21hbGwgZ2FyYW1vbmQnIH1cbiAgICAgICAgXSxcblxuICAgICAgICBmaXhlZENvbHVtbkNvdW50OiAxLFxuICAgICAgICBmaXhlZFJvd0NvdW50OiA0LFxuXG4gICAgICAgIGNvbHVtbkF1dG9zaXppbmc6IGZhbHNlLFxuICAgICAgICBoZWFkZXJUZXh0V3JhcHBpbmc6IHRydWUsXG5cbiAgICAgICAgaGFsaWduOiAnbGVmdCcsXG4gICAgICAgIHJlbmRlckZhbHN5OiB0cnVlLFxuXG4gICAgICAgIHNjcm9sbGJhckhvdmVyT2ZmOiAndmlzaWJsZScsXG4gICAgICAgIHNjcm9sbGJhckhvdmVyT3ZlcjogJ3Zpc2libGUnLFxuICAgICAgICBjb2x1bW5IZWFkZXJCYWNrZ3JvdW5kQ29sb3I6ICdwaW5rJyxcblxuICAgICAgICBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zOiB0cnVlLFxuXG4gICAgICAgIGF1dG9TZWxlY3RSb3dzOiB0cnVlLFxuXG4gICAgICAgIHJvd3M6IHtcbiAgICAgICAgICAgIGhlYWRlcjoge1xuICAgICAgICAgICAgICAgIDA6IHtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiA0MFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBjYWxjdWxhdG9yczoge1xuICAgICAgICAgICAgQWRkMTA6ICdmdW5jdGlvbihkYXRhUm93LGNvbHVtbk5hbWUpIHsgcmV0dXJuIGRhdGFSb3dbY29sdW1uTmFtZV0gKyAxMDsgfSdcbiAgICAgICAgfSxcblxuICAgICAgICBjb2x1bW5zOiB7XG4gICAgICAgICAgICBoZWlnaHQ6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnZm9vdCdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuICAgICAgICAgICAgbGFzdF9uYW1lOiB7XG4gICAgICAgICAgICAgICAgY29sdW1uSGVhZGVyQmFja2dyb3VuZENvbG9yOiAnIzE0MkI2RicsIC8vZGFyayBibHVlXG4gICAgICAgICAgICAgICAgY29sdW1uSGVhZGVyQ29sb3I6ICd3aGl0ZScsXG4gICAgICAgICAgICAgICAgY29sdW1uSGVhZGVySGFsaWduOiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgcmlnaHRJY29uOiAnZG93bi1yZWN0YW5nbGUnLFxuICAgICAgICAgICAgICAgIGxpbms6IHRydWVcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZpcnN0X25hbWU6IHtcblxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdG90YWxfbnVtYmVyX29mX3BldHNfb3duZWQ6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgY2FsY3VsYXRvcjogJ0FkZDEwJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2dyZWVuJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYmlydGhEYXRlOiB7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnc2luZ2RhdGUnLFxuICAgICAgICAgICAgICAgIHJpZ2h0SWNvbjogJ2NhbGVuZGFyJyxcbiAgICAgICAgICAgICAgICAvL3N0cmlrZVRocm91Z2g6IHRydWVcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGJpcnRoVGltZToge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICBlZGl0b3I6ICd0aW1lJyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdoaG1tJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYmlydGhTdGF0ZToge1xuICAgICAgICAgICAgICAgIGVkaXRvcjogJ2NvbG9ydGV4dCcsXG4gICAgICAgICAgICAgICAgcmlnaHRJY29uOiAnZG93bi1yZWN0YW5nbGUnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZXNpZGVuY2VTdGF0ZToge1xuICAgICAgICAgICAgICAgIHJpZ2h0SWNvbjogJ2Rvd24tcmVjdGFuZ2xlJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZW1wbG95ZWQ6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgcmVuZGVyZXI6ICdidXR0b24nLFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3doaXRlJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgaW5jb21lOiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3BvdW5kcydcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHRyYXZlbDoge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdmcmFuY3MnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gRm9sbG93aW5nIGBjZWxsc2AgZXhhbXBsZSBzZXRzIHByb3BlcnRpZXMgZm9yIGEgY2VsbCBpbiB0aGUgZGF0YSBzdWJncmlkLlxuICAgICAgICAvLyBTcGVjaWZ5aW5nIGNlbGwgcHJvcGVydGllcyBoZXJlIGluIGdyaWQgc3RhdGUgbWF5IGJlIHVzZWZ1bCBmb3Igc3RhdGljIGRhdGEgc3ViZ3JpZHNcbiAgICAgICAgLy8gd2hlcmUgY2VsbCBjb29yZGluYXRlcyBhcmUgcGVybWFuZW50bHkgYXNzaWduZWQuIE90aGVyd2lzZSwgZm9yIG15IGR5bmFtaWMgZ3JpZCBkYXRhLFxuICAgICAgICAvLyBjZWxsIHByb3BlcnRpZXMgbWlnaHQgbW9yZSBwcm9wZXJseSBhY2NvbXBhbnkgdGhlIGRhdGEgaXRzZWxmIGFzIG1ldGFkYXRhXG4gICAgICAgIC8vIChpLmUuLCBhcyBhIGhhc2ggaW4gZGF0YVJvdy5fX01FVEFbZmllbGROYW1lXSkuXG4gICAgICAgIGNlbGxzOiB7XG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgMTY6IHtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250OiAnMTBwdCBUYWhvbWEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICdsaWdodGJsdWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAncmVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGlnbjogJ2xlZnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVhcHBseUNlbGxQcm9wZXJ0aWVzOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ3JpZC5zZXRTdGF0ZShzdGF0ZSk7XG5cbiAgICAvLyBwcm9wZXJ0aWVzIHRoYXQgY2FuIGJlIHNldFxuICAgIC8vIHVzZSBhIGZ1bmN0aW9uIG9yIGEgdmFsdWVcblxuICAgIC8vIGZvbnRcbiAgICAvLyBjb2xvclxuICAgIC8vIGJhY2tncm91bmRDb2xvclxuICAgIC8vIGZvcmVncm91bmRTZWxlY3Rpb25Db2xvclxuICAgIC8vIGJhY2tncm91bmRTZWxlY3Rpb25Db2xvclxuXG4gICAgLy8gY29sdW1uSGVhZGVyRm9udFxuICAgIC8vIGNvbHVtbkhlYWRlckNvbG9yXG4gICAgLy8gY29sdW1uSGVhZGVyQmFja2dyb3VuZENvbG9yXG4gICAgLy8gY29sdW1uSGVhZGVyRm9yZWdyb3VuZFNlbGVjdGlvbkNvbG9yXG4gICAgLy8gY29sdW1uSGVhZGVyQmFja2dyb3VuZFNlbGVjdGlvbkNvbG9yXG5cbiAgICAvLyByb3dIZWFkZXJGb250XG4gICAgLy8gcm93SGVhZGVyQ29sb3JcbiAgICAvLyByb3dIZWFkZXJCYWNrZ3JvdW5kQ29sb3JcbiAgICAvLyByb3dIZWFkZXJGb3JlZ3JvdW5kU2VsZWN0aW9uQ29sb3JcbiAgICAvLyByb3dIZWFkZXJCYWNrZ3JvdW5kU2VsZWN0aW9uQ29sb3JcblxuICAgIC8vICAgICAgICAgICAgICAgIGJlaGF2aW9yLnNldENlbGxQcm9wZXJ0aWVzKGlkeC50b3RhbE51bWJlck9mUGV0c093bmVkLCAwLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICB7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICBmb250OiAnMTBwdCBUYWhvbWEnLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICdyZWQnLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnbGlnaHRibHVlJyxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIGhhbGlnbjogJ2xlZnQnXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJ3Zpc2libGUgcm93cyA9ICcgKyBncmlkLnJlbmRlcmVyLnZpc2libGVSb3dzLm1hcChmdW5jdGlvbih2cil7XG4gICAgICAgIHJldHVybiB2ci5zdWJncmlkLnR5cGVbMF0gKyB2ci5yb3dJbmRleDtcbiAgICB9KSk7XG4gICAgY29uc29sZS5sb2coJ3Zpc2libGUgY29sdW1ucyA9ICcgKyBncmlkLnJlbmRlcmVyLnZpc2libGVDb2x1bW5zLm1hcChmdW5jdGlvbih2Yyl7XG4gICAgICAgIHJldHVybiB2Yy5jb2x1bW5JbmRleDtcbiAgICB9KSk7XG5cbiAgICAvL3NlZSBteVRoZW1lcy5qcyBmaWxlIGZvciBob3cgdG8gY3JlYXRlIGEgdGhlbWVcbiAgICAvL2dyaWQuYWRkUHJvcGVydGllcyhteVRoZW1lcy5vbmUpO1xuICAgIC8vZ3JpZC5hZGRQcm9wZXJ0aWVzKG15VGhlbWVzLnR3byk7XG4gICAgLy9ncmlkLmFkZFByb3BlcnRpZXMobXlUaGVtZXMudGhyZWUpO1xuXG4gICAgZ3JpZC50YWtlRm9jdXMoKTtcblxuICAgIGRlbW8ucmVzZXREYXNoYm9hcmQoKTtcbn07XG4iXX0=
