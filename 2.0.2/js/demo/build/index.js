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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy90ZW1wL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy90ZW1wL2Zpbi1oeXBlcmdyaWQvZGVtby9qcy9kZW1vL2NlbGxFZGl0b3JzLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL3RlbXAvZmluLWh5cGVyZ3JpZC9kZW1vL2pzL2RlbW8vY2VsbHJlbmRlcmVycy5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy90ZW1wL2Zpbi1oeXBlcmdyaWQvZGVtby9qcy9kZW1vL2Rhc2hib2FyZC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy90ZW1wL2Zpbi1oeXBlcmdyaWQvZGVtby9qcy9kZW1vL2V2ZW50cy5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy90ZW1wL2Zpbi1oeXBlcmdyaWQvZGVtby9qcy9kZW1vL2Zha2VfOGE2YzQ0NzAuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvdGVtcC9maW4taHlwZXJncmlkL2RlbW8vanMvZGVtby9mb3JtYXR0ZXJzLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL3RlbXAvZmluLWh5cGVyZ3JpZC9kZW1vL2pzL2RlbW8vc2V0U3RhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkZW1vLCBncmlkKSB7XG5cbiAgICB2YXIgaWR4ID0gZ3JpZC5iZWhhdmlvci5jb2x1bW5FbnVtO1xuXG4gICAgdmFyIENlbGxFZGl0b3IgPSBncmlkLmNlbGxFZGl0b3JzLmdldCgnY2VsbGVkaXRvcicpO1xuICAgIHZhciBUZXh0ZmllbGQgPSBncmlkLmNlbGxFZGl0b3JzLmdldCgndGV4dGZpZWxkJyk7XG5cbiAgICB2YXIgQ29sb3JUZXh0ID0gVGV4dGZpZWxkLmV4dGVuZCgnY29sb3JUZXh0Jywge1xuICAgICAgICB0ZW1wbGF0ZTogJzxpbnB1dCB0eXBlPVwidGV4dFwiIGxhbmc9XCJ7e2xvY2FsZX19XCIgc3R5bGU9XCJjb2xvcjp7e3RleHRDb2xvcn19XCI+J1xuICAgIH0pO1xuXG4gICAgZ3JpZC5jZWxsRWRpdG9ycy5hZGQoQ29sb3JUZXh0KTtcblxuICAgIHZhciBUaW1lID0gVGV4dGZpZWxkLmV4dGVuZCgnVGltZScsIHtcbiAgICAgICAgdGVtcGxhdGU6IFtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiaHlwZXJncmlkLXRleHRmaWVsZFwiIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodDtcIj4nLFxuICAgICAgICAgICAgJyAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBsYW5nPVwie3tsb2NhbGV9fVwiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDsgd2lkdGg6NzUlOyB0ZXh0LWFsaWduOnJpZ2h0OyBib3JkZXI6MDsgcGFkZGluZzowOyBvdXRsaW5lOjA7IGZvbnQtc2l6ZTppbmhlcml0OyBmb250LXdlaWdodDppbmhlcml0OycgK1xuICAgICAgICAgICAgJ3t7c3R5bGV9fVwiPicsXG4gICAgICAgICAgICAnICAgIDxzcGFuPkFNPC9zcGFuPicsXG4gICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICBdLmpvaW4oJ1xcbicpLFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dCA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcbiAgICAgICAgICAgIHRoaXMubWVyaWRpYW4gPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKTtcblxuICAgICAgICAgICAgLy8gRmxpcCBBTS9QTSBvbiBhbnkgY2xpY2tcbiAgICAgICAgICAgIHRoaXMuZWwub25jbGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQgPSB0aGlzLm1lcmlkaWFuLnRleHRDb250ZW50ID09PSAnQU0nID8gJ1BNJyA6ICdBTSc7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgICAgICB0aGlzLmlucHV0Lm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gaWdub3JlIGNsaWNrcyBpbiB0aGUgdGV4dCBmaWVsZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQub25mb2N1cyA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICAgICAgdGhpcy5lbC5zdHlsZS5vdXRsaW5lID0gdGhpcy5vdXRsaW5lID0gdGhpcy5vdXRsaW5lIHx8IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCkub3V0bGluZTtcbiAgICAgICAgICAgICAgICB0YXJnZXQuc3R5bGUub3V0bGluZSA9IDA7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgICAgICB0aGlzLmlucHV0Lm9uYmx1ciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsLnN0eWxlLm91dGxpbmUgPSAwO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldEVkaXRvclZhbHVlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgQ2VsbEVkaXRvci5wcm90b3R5cGUuc2V0RWRpdG9yVmFsdWUuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSB0aGlzLmlucHV0LnZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICAgICAgICB0aGlzLmlucHV0LnZhbHVlID0gcGFydHNbMF07XG4gICAgICAgICAgICB0aGlzLm1lcmlkaWFuLnRleHRDb250ZW50ID0gcGFydHNbMV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RWRpdG9yVmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IENlbGxFZGl0b3IucHJvdG90eXBlLmdldEVkaXRvclZhbHVlLmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICAgICAgaWYgKHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQgPT09ICdQTScpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSArPSBkZW1vLk5PT047XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGdyaWQuY2VsbEVkaXRvcnMuYWRkKFRpbWUpO1xuXG4gICAgLy8gVXNlZCBieSB0aGUgY2VsbFByb3ZpZGVyLlxuICAgIC8vIGBudWxsYCBtZWFucyBjb2x1bW4ncyBkYXRhIGNlbGxzIGFyZSBub3QgZWRpdGFibGUuXG4gICAgdmFyIGVkaXRvclR5cGVzID0gW1xuICAgICAgICBudWxsLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgJ3RleHRmaWVsZCcsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICBudWxsLFxuICAgICAgICAndGltZScsXG4gICAgICAgICdjaG9pY2UnLFxuICAgICAgICAnY2hvaWNlJyxcbiAgICAgICAgJ2Nob2ljZScsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgJ3RleHRmaWVsZCdcbiAgICBdO1xuXG4gICAgLy8gT3ZlcnJpZGUgdG8gYXNzaWduIHRoZSB0aGUgY2VsbCBlZGl0b3JzLlxuICAgIGdyaWQuYmVoYXZpb3IuZGF0YU1vZGVsLmdldENlbGxFZGl0b3JBdCA9IGZ1bmN0aW9uKHgsIHksIGRlY2xhcmVkRWRpdG9yTmFtZSwgY2VsbEV2ZW50KSB7XG4gICAgICAgIHZhciBlZGl0b3JOYW1lID0gZGVjbGFyZWRFZGl0b3JOYW1lIHx8IGVkaXRvclR5cGVzW3ggJSBlZGl0b3JUeXBlcy5sZW5ndGhdO1xuXG4gICAgICAgIHN3aXRjaCAoeCkge1xuICAgICAgICAgICAgY2FzZSBpZHguYmlydGhTdGF0ZTpcbiAgICAgICAgICAgICAgICBjZWxsRXZlbnQudGV4dENvbG9yID0gJ3JlZCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2VsbEVkaXRvciA9IGdyaWQuY2VsbEVkaXRvcnMuY3JlYXRlKGVkaXRvck5hbWUsIGNlbGxFdmVudCk7XG5cbiAgICAgICAgaWYgKGNlbGxFZGl0b3IpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoeCkge1xuICAgICAgICAgICAgICAgIGNhc2UgaWR4LmVtcGxveWVkOlxuICAgICAgICAgICAgICAgICAgICBjZWxsRWRpdG9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIGlkeC50b3RhbE51bWJlck9mUGV0c093bmVkOlxuICAgICAgICAgICAgICAgICAgICBjZWxsRWRpdG9yLmlucHV0LnNldEF0dHJpYnV0ZSgnbWluJywgMCk7XG4gICAgICAgICAgICAgICAgICAgIGNlbGxFZGl0b3IuaW5wdXQuc2V0QXR0cmlidXRlKCdtYXgnLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIGNlbGxFZGl0b3IuaW5wdXQuc2V0QXR0cmlidXRlKCdzdGVwJywgMC4wMSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNlbGxFZGl0b3I7XG4gICAgfTtcbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIHZhciBpZHggPSBncmlkLmJlaGF2aW9yLmNvbHVtbkVudW07XG5cbiAgICAvL0dFVCBDRUxMXG4gICAgLy9hbGwgZm9ybWF0dGluZyBhbmQgcmVuZGVyaW5nIHBlciBjZWxsIGNhbiBiZSBvdmVycmlkZGVuIGluIGhlcmVcbiAgICBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbC5nZXRDZWxsID0gZnVuY3Rpb24oY29uZmlnLCByZW5kZXJlck5hbWUpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5pc1VzZXJEYXRhQXJlYSkge1xuICAgICAgICAgICAgdmFyIG4sIGhleCwgdHJhdmVsLFxuICAgICAgICAgICAgICAgIGNvbEluZGV4ID0gY29uZmlnLmRhdGFDZWxsLngsXG4gICAgICAgICAgICAgICAgcm93SW5kZXggPSBjb25maWcuZGF0YUNlbGwueTtcblxuICAgICAgICAgICAgaWYgKGRlbW8uc3R5bGVSb3dzRnJvbURhdGEpIHtcbiAgICAgICAgICAgICAgICBuID0gZ3JpZC5iZWhhdmlvci5nZXRDb2x1bW4oaWR4LnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQpLmdldFZhbHVlKHJvd0luZGV4KTtcbiAgICAgICAgICAgICAgICBoZXggPSAoMTU1ICsgMTAgKiAobiAlIDExKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IgPSAnIycgKyBoZXggKyBoZXggKyBoZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAoY29sSW5kZXgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIGlkeC5sYXN0TmFtZTpcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLmNvbG9yID0gY29uZmlnLnZhbHVlICE9IG51bGwgJiYgKGNvbmZpZy52YWx1ZSArICcnKVswXSA9PT0gJ1MnID8gJ3JlZCcgOiAnIzE5MTkxOSc7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5saW5rID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIGlkeC5pbmNvbWU6XG4gICAgICAgICAgICAgICAgICAgIHRyYXZlbCA9IDYwO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgaWR4LnRyYXZlbDpcbiAgICAgICAgICAgICAgICAgICAgdHJhdmVsID0gMTA1O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRyYXZlbCkge1xuICAgICAgICAgICAgICAgIHRyYXZlbCArPSBNYXRoLnJvdW5kKGNvbmZpZy52YWx1ZSAqIDE1MCAvIDEwMDAwMCk7XG4gICAgICAgICAgICAgICAgY29uZmlnLmJhY2tncm91bmRDb2xvciA9ICcjMDAnICsgdHJhdmVsLnRvU3RyaW5nKDE2KSArICcwMCc7XG4gICAgICAgICAgICAgICAgY29uZmlnLmNvbG9yID0gJyNGRkZGRkYnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL1Rlc3RpbmdcbiAgICAgICAgICAgIGlmIChjb2xJbmRleCA9PT0gaWR4LnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQpIHtcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIEJlIHN1cmUgdG8gYWRqdXN0IHRoZSBkYXRhIHNldCB0byB0aGUgYXBwcm9wcmlhdGUgdHlwZSBhbmQgc2hhcGUgaW4gd2lkZWRhdGEuanNcbiAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHNpbXBsZUNlbGw7IC8vV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBlbXB0eUNlbGw7IC8vV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBidXR0b25DZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gZXJyb3JDZWxsOyAvL1dPUktTOiBOb3RlZCB0aGF0IGFueSBlcnJvciBpbiB0aGlzIGZ1bmN0aW9uIHN0ZWFscyB0aGUgbWFpbiB0aHJlYWQgYnkgcmVjdXJzaW9uXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gc3BhcmtMaW5lQ2VsbDsgLy8gV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBzcGFya0JhckNlbGw7IC8vV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBzbGlkZXJDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gdHJlZUNlbGw7IC8vTmVlZCB0byBmaWd1cmUgb3V0IGRhdGEgc2hhcGUgdG8gdGVzdFxuXG5cbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIFRlc3Qgb2YgQ3VzdG9taXplZCBSZW5kZXJlclxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIC8vIGlmIChzdGFycnkpe1xuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuZG9tYWluID0gNTsgLy8gZGVmYXVsdCBpcyAxMDBcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLnNpemVGYWN0b3IgPSAgMC42NTsgLy8gZGVmYXVsdCBpcyAwLjY1OyBzaXplIG9mIHN0YXJzIGFzIGZyYWN0aW9uIG9mIGhlaWdodCBvZiBjZWxsXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5kYXJrZW5GYWN0b3IgPSAwLjc1OyAvLyBkZWZhdWx0IGlzIDAuNzU7IHN0YXIgc3Ryb2tlIGNvbG9yIGFzIGZyYWN0aW9uIG9mIHN0YXIgZmlsbCBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuY29sb3IgPSAnZ29sZCc7IC8vIGRlZmF1bHQgaXMgJ2dvbGQnOyBzdGFyIGZpbGwgY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmZnQ29sb3IgPSAgJ2dyZXknOyAvLyBkZWZhdWx0IGlzICd0cmFuc3BhcmVudCcgKG5vdCByZW5kZXJlZCk7IHRleHQgY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmZnU2VsQ29sb3IgPSAneWVsbG93JzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyB0ZXh0IHNlbGVjdGlvbiBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuYmdDb2xvciA9ICcjNDA0MDQwJzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyBiYWNrZ3JvdW5kIGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5iZ1NlbENvbG9yID0gJ2dyZXknOyAvLyBkZWZhdWx0IGlzICd0cmFuc3BhcmVudCcgKG5vdCByZW5kZXJlZCk7IGJhY2tncm91bmQgc2VsZWN0aW9uIGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5zaGFkb3dDb2xvciA9ICd0cmFuc3BhcmVudCc7IC8vIGRlZmF1bHQgaXMgJ3RyYW5zcGFyZW50J1xuICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gc3RhcnJ5O1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBncmlkLmNlbGxSZW5kZXJlcnMuZ2V0KHJlbmRlcmVyTmFtZSk7XG4gICAgfTtcblxuICAgIC8vRU5EIE9GIEdFVCBDRUxMXG5cblxuICAgIC8vIENVU1RPTSBDRUxMIFJFTkRFUkVSXG5cbiAgICB2YXIgUkVHRVhQX0NTU19IRVg2ID0gL14jKC4uKSguLikoLi4pJC8sXG4gICAgICAgIFJFR0VYUF9DU1NfUkdCID0gL15yZ2JhXFwoKFxcZCspLChcXGQrKSwoXFxkKyksXFxkK1xcKSQvO1xuXG4gICAgZnVuY3Rpb24gcGFpbnRTcGFya1JhdGluZyhnYywgY29uZmlnKSB7XG4gICAgICAgIHZhciB4ID0gY29uZmlnLmJvdW5kcy54LFxuICAgICAgICAgICAgeSA9IGNvbmZpZy5ib3VuZHMueSxcbiAgICAgICAgICAgIHdpZHRoID0gY29uZmlnLmJvdW5kcy53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCA9IGNvbmZpZy5ib3VuZHMuaGVpZ2h0LFxuICAgICAgICAgICAgb3B0aW9ucyA9IGNvbmZpZy52YWx1ZSxcbiAgICAgICAgICAgIGRvbWFpbiA9IG9wdGlvbnMuZG9tYWluIHx8IGNvbmZpZy5kb21haW4gfHwgMTAwLFxuICAgICAgICAgICAgc2l6ZUZhY3RvciA9IG9wdGlvbnMuc2l6ZUZhY3RvciB8fCBjb25maWcuc2l6ZUZhY3RvciB8fCAwLjY1LFxuICAgICAgICAgICAgZGFya2VuRmFjdG9yID0gb3B0aW9ucy5kYXJrZW5GYWN0b3IgfHwgY29uZmlnLmRhcmtlbkZhY3RvciB8fCAwLjc1LFxuICAgICAgICAgICAgY29sb3IgPSBvcHRpb25zLmNvbG9yIHx8IGNvbmZpZy5jb2xvciB8fCAnZ29sZCcsXG4gICAgICAgICAgICBzdHJva2UgPSB0aGlzLnN0cm9rZSA9IGNvbG9yID09PSB0aGlzLmNvbG9yID8gdGhpcy5zdHJva2UgOiBnZXREYXJrZW5lZENvbG9yKGdjLCB0aGlzLmNvbG9yID0gY29sb3IsIGRhcmtlbkZhY3RvciksXG4gICAgICAgICAgICAvLyBiZ0NvbG9yID0gY29uZmlnLmlzU2VsZWN0ZWQgPyAob3B0aW9ucy5iZ1NlbENvbG9yIHx8IGNvbmZpZy5iZ1NlbENvbG9yKSA6IChvcHRpb25zLmJnQ29sb3IgfHwgY29uZmlnLmJnQ29sb3IpLFxuICAgICAgICAgICAgZmdDb2xvciA9IGNvbmZpZy5pc1NlbGVjdGVkID8gKG9wdGlvbnMuZmdTZWxDb2xvciB8fCBjb25maWcuZmdTZWxDb2xvcikgOiAob3B0aW9ucy5mZ0NvbG9yIHx8IGNvbmZpZy5mZ0NvbG9yKSxcbiAgICAgICAgICAgIHNoYWRvd0NvbG9yID0gb3B0aW9ucy5zaGFkb3dDb2xvciB8fCBjb25maWcuc2hhZG93Q29sb3IgfHwgJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgIC8vIGZvbnQgPSBvcHRpb25zLmZvbnQgfHwgY29uZmlnLmZvbnQgfHwgJzExcHggdmVyZGFuYScsXG4gICAgICAgICAgICBtaWRkbGUgPSBoZWlnaHQgLyAyLFxuICAgICAgICAgICAgZGlhbWV0ZXIgPSBzaXplRmFjdG9yICogaGVpZ2h0LFxuICAgICAgICAgICAgb3V0ZXJSYWRpdXMgPSBzaXplRmFjdG9yICogbWlkZGxlLFxuICAgICAgICAgICAgdmFsID0gTnVtYmVyKG9wdGlvbnMudmFsKSxcbiAgICAgICAgICAgIHBvaW50cyA9IHRoaXMucG9pbnRzO1xuXG4gICAgICAgIGlmICghcG9pbnRzKSB7XG4gICAgICAgICAgICB2YXIgaW5uZXJSYWRpdXMgPSAzIC8gNyAqIG91dGVyUmFkaXVzO1xuICAgICAgICAgICAgcG9pbnRzID0gdGhpcy5wb2ludHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSA1LCBwaSA9IE1hdGguUEkgLyAyLCBpbmNyID0gTWF0aC5QSSAvIDU7IGk7IC0taSwgcGkgKz0gaW5jcikge1xuICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgeDogb3V0ZXJSYWRpdXMgKiBNYXRoLmNvcyhwaSksXG4gICAgICAgICAgICAgICAgICAgIHk6IG1pZGRsZSAtIG91dGVyUmFkaXVzICogTWF0aC5zaW4ocGkpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcGkgKz0gaW5jcjtcbiAgICAgICAgICAgICAgICBwb2ludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHg6IGlubmVyUmFkaXVzICogTWF0aC5jb3MocGkpLFxuICAgICAgICAgICAgICAgICAgICB5OiBtaWRkbGUgLSBpbm5lclJhZGl1cyAqIE1hdGguc2luKHBpKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9pbnRzLnB1c2gocG9pbnRzWzBdKTsgLy8gY2xvc2UgdGhlIHBhdGhcbiAgICAgICAgfVxuXG4gICAgICAgIGdjLmNhY2hlLnNoYWRvd0NvbG9yID0gJ3RyYW5zcGFyZW50JztcblxuICAgICAgICBnYy5jYWNoZS5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgIGdjLmJlZ2luUGF0aCgpO1xuICAgICAgICBmb3IgKHZhciBqID0gNSwgc3ggPSB4ICsgNSArIG91dGVyUmFkaXVzOyBqOyAtLWosIHN4ICs9IGRpYW1ldGVyKSB7XG4gICAgICAgICAgICBwb2ludHMuZm9yRWFjaChmdW5jdGlvbihwb2ludCwgaW5kZXgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgICAgIGdjW2luZGV4ID8gJ2xpbmVUbycgOiAnbW92ZVRvJ10oc3ggKyBwb2ludC54LCB5ICsgcG9pbnQueSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgIH0pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgIH1cbiAgICAgICAgZ2MuY2xvc2VQYXRoKCk7XG5cbiAgICAgICAgdmFsID0gdmFsIC8gZG9tYWluICogNTtcblxuICAgICAgICBnYy5jYWNoZS5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgICAgZ2Muc2F2ZSgpO1xuICAgICAgICBnYy5jbGlwKCk7XG4gICAgICAgIGdjLmZpbGxSZWN0KHggKyA1LCB5LFxuICAgICAgICAgICAgKE1hdGguZmxvb3IodmFsKSArIDAuMjUgKyB2YWwgJSAxICogMC41KSAqIGRpYW1ldGVyLCAvLyBhZGp1c3Qgd2lkdGggdG8gc2tpcCBvdmVyIHN0YXIgb3V0bGluZXMgYW5kIGp1c3QgbWV0ZXIgdGhlaXIgaW50ZXJpb3JzXG4gICAgICAgICAgICBoZWlnaHQpO1xuICAgICAgICBnYy5yZXN0b3JlKCk7IC8vIHJlbW92ZSBjbGlwcGluZyByZWdpb25cblxuICAgICAgICBnYy5jYWNoZS5zdHJva2VTdHlsZSA9IHN0cm9rZTtcbiAgICAgICAgZ2MuY2FjaGUubGluZVdpZHRoID0gMTtcbiAgICAgICAgZ2Muc3Ryb2tlKCk7XG5cbiAgICAgICAgaWYgKGZnQ29sb3IgJiYgZmdDb2xvciAhPT0gJ3RyYW5zcGFyZW50Jykge1xuICAgICAgICAgICAgZ2MuY2FjaGUuZmlsbFN0eWxlID0gZmdDb2xvcjtcbiAgICAgICAgICAgIGdjLmNhY2hlLmZvbnQgPSAnMTFweCB2ZXJkYW5hJztcbiAgICAgICAgICAgIGdjLmNhY2hlLnRleHRBbGlnbiA9ICdyaWdodCc7XG4gICAgICAgICAgICBnYy5jYWNoZS50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICAgICAgICAgIGdjLmNhY2hlLnNoYWRvd0NvbG9yID0gc2hhZG93Q29sb3I7XG4gICAgICAgICAgICBnYy5jYWNoZS5zaGFkb3dPZmZzZXRYID0gZ2MuY2FjaGUuc2hhZG93T2Zmc2V0WSA9IDE7XG4gICAgICAgICAgICBnYy5maWxsVGV4dCh2YWwudG9GaXhlZCgxKSwgeCArIHdpZHRoICsgMTAsIHkgKyBoZWlnaHQgLyAyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldERhcmtlbmVkQ29sb3IoZ2MsIGNvbG9yLCBmYWN0b3IpIHtcbiAgICAgICAgdmFyIHJnYmEgPSBnZXRSR0JBKGdjLCBjb2xvcik7XG4gICAgICAgIHJldHVybiAncmdiYSgnICsgTWF0aC5yb3VuZChmYWN0b3IgKiByZ2JhWzBdKSArICcsJyArIE1hdGgucm91bmQoZmFjdG9yICogcmdiYVsxXSkgKyAnLCcgKyBNYXRoLnJvdW5kKGZhY3RvciAqIHJnYmFbMl0pICsgJywnICsgKHJnYmFbM10gfHwgMSkgKyAnKSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UkdCQShnYywgY29sb3JTcGVjKSB7XG4gICAgICAgIC8vIE5vcm1hbGl6ZSB2YXJpZXR5IG9mIENTUyBjb2xvciBzcGVjIHN5bnRheGVzIHRvIG9uZSBvZiB0d29cbiAgICAgICAgZ2MuY2FjaGUuZmlsbFN0eWxlID0gY29sb3JTcGVjO1xuXG4gICAgICAgIHZhciByZ2JhID0gY29sb3JTcGVjLm1hdGNoKFJFR0VYUF9DU1NfSEVYNik7XG4gICAgICAgIGlmIChyZ2JhKSB7XG4gICAgICAgICAgICByZ2JhLnNoaWZ0KCk7IC8vIHJlbW92ZSB3aG9sZSBtYXRjaFxuICAgICAgICAgICAgcmdiYS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZ2JhW2luZGV4XSA9IHBhcnNlSW50KHZhbCwgMTYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZ2JhID0gY29sb3JTcGVjLm1hdGNoKFJFR0VYUF9DU1NfUkdCKTtcbiAgICAgICAgICAgIGlmICghcmdiYSkge1xuICAgICAgICAgICAgICAgIHRocm93ICdVbmV4cGVjdGVkIGZvcm1hdCBnZXR0aW5nIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC5maWxsU3R5bGUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmdiYS5zaGlmdCgpOyAvLyByZW1vdmUgd2hvbGUgbWF0Y2hcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZ2JhO1xuICAgIH1cblxuXG4gICAgLy9FeHRlbmQgSHlwZXJHcmlkJ3MgYmFzZSBSZW5kZXJlclxuICAgIHZhciBzcGFya1N0YXJSYXRpbmdSZW5kZXJlciA9IGdyaWQuY2VsbFJlbmRlcmVycy5nZXQoJ2VtcHR5Y2VsbCcpLmNvbnN0cnVjdG9yLmV4dGVuZCh7XG4gICAgICAgIHBhaW50OiBwYWludFNwYXJrUmF0aW5nXG4gICAgfSk7XG5cbiAgICAvL1JlZ2lzdGVyIHlvdXIgcmVuZGVyZXJcbiAgICBncmlkLmNlbGxSZW5kZXJlcnMuYWRkKCdTdGFycnknLCBzcGFya1N0YXJSYXRpbmdSZW5kZXJlcik7XG5cbiAgICAvLyBFTkQgT0YgQ1VTVE9NIENFTEwgUkVOREVSRVJcbiAgICByZXR1cm4gZ3JpZDtcbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuLyogZ2xvYmFscyBwZW9wbGUxLCBwZW9wbGUyICovXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWFsZXJ0ICovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gU29tZSBET00gc3VwcG9ydCBmdW5jdGlvbnMuLi5cbi8vIEJlc2lkZXMgdGhlIGNhbnZhcywgdGhpcyB0ZXN0IGhhcm5lc3Mgb25seSBoYXMgYSBoYW5kZnVsIG9mIGJ1dHRvbnMgYW5kIGNoZWNrYm94ZXMuXG4vLyBUaGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBzZXJ2aWNlIHRoZXNlIGNvbnRyb2xzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIC8vIG1ha2UgYnV0dG9ucyBkaXYgYWJzb2x1dGUgc28gYnV0dG9ucyB3aWR0aCBvZiAxMDAlIGRvZXNuJ3Qgc3RyZXRjaCB0byB3aWR0aCBvZiBkYXNoYm9hcmRcbiAgICB2YXIgY3RybEdyb3VwcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdHJsLWdyb3VwcycpLFxuICAgICAgICBkYXNoYm9hcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGFzaGJvYXJkJyksXG4gICAgICAgIGJ1dHRvbnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnV0dG9ucycpO1xuXG4gICAgY3RybEdyb3Vwcy5zdHlsZS50b3AgPSBjdHJsR3JvdXBzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICdweCc7XG4gICAgLy9idXR0b25zLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBkYXNoYm9hcmQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIGZ1bmN0aW9uIHRvZ2dsZVJvd1N0eWxpbmdNZXRob2QoKSB7XG4gICAgICAgIGRlbW8uc3R5bGVSb3dzRnJvbURhdGEgPSAhZGVtby5zdHlsZVJvd3NGcm9tRGF0YTtcbiAgICB9XG5cbiAgICAvLyBMaXN0IG9mIHByb3BlcnRpZXMgdG8gc2hvdyBhcyBjaGVja2JveGVzIGluIHRoaXMgZGVtbydzIFwiZGFzaGJvYXJkXCJcbiAgICB2YXIgdG9nZ2xlUHJvcHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnUm93IHN0eWxpbmcnLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJyhHbG9iYWwgc2V0dGluZyknLCBsYWJlbDogJ2Jhc2Ugb24gZGF0YScsIHNldHRlcjogdG9nZ2xlUm93U3R5bGluZ01ldGhvZH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdDb2x1bW4gaGVhZGVyIHJvd3MnLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJ3Nob3dIZWFkZXJSb3cnLCBsYWJlbDogJ2hlYWRlcid9LCAvLyBkZWZhdWx0IFwic2V0dGVyXCIgaXMgYHNldFByb3BgXG4gICAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnSG92ZXIgaGlnaGxpZ2h0cycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnaG92ZXJDZWxsSGlnaGxpZ2h0LmVuYWJsZWQnLCBsYWJlbDogJ2NlbGwnfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2hvdmVyUm93SGlnaGxpZ2h0LmVuYWJsZWQnLCBsYWJlbDogJ3Jvdyd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnaG92ZXJDb2x1bW5IaWdobGlnaHQuZW5hYmxlZCcsIGxhYmVsOiAnY29sdW1uJ31cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdMaW5rIHN0eWxlJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge25hbWU6ICdsaW5rT25Ib3ZlcicsIGxhYmVsOiAnb24gaG92ZXInfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2xpbmtDb2xvcicsIHR5cGU6ICd0ZXh0JywgbGFiZWw6ICdjb2xvcid9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnbGlua0NvbG9yT25Ib3ZlcicsIGxhYmVsOiAnY29sb3Igb24gaG92ZXInfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBsYWJlbDogJ0NlbGwgZWRpdGluZycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnZWRpdGFibGUnfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2VkaXRPbkRvdWJsZUNsaWNrJywgbGFiZWw6ICdyZXF1aXJlcyBkb3VibGUtY2xpY2snfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2VkaXRPbktleWRvd24nLCBsYWJlbDogJ3R5cGUgdG8gZWRpdCd9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGxhYmVsOiAnU2VsZWN0aW9uJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucycsIGxhYmVsOiAnYnkgcm93IGhhbmRsZXMgb25seScsIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcCxcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcDogJ05vdGUgdGhhdCB3aGVuIHRoaXMgcHJvcGVydHkgaXMgYWN0aXZlLCBhdXRvU2VsZWN0Um93cyB3aWxsIG5vdCB3b3JrLidcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnc2luZ2xlUm93U2VsZWN0aW9uTW9kZScsIGxhYmVsOiAnb25lIHJvdyBhdCBhIHRpbWUnLCBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3B9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJyFtdWx0aXBsZVNlbGVjdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ29uZSBjZWxsIHJlZ2lvbiBhdCBhIHRpbWUnLFxuICAgICAgICAgICAgICAgICAgICBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3AsXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IHRydWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2F1dG9TZWxlY3RSb3dzJywgbGFiZWw6ICdhdXRvLXNlbGVjdCByb3dzJywgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wLFxuICAgICAgICAgICAgICAgICAgICB0b29sdGlwOiAnTm90ZXM6XFxuJyArXG4gICAgICAgICAgICAgICAgICAgICcxLiBSZXF1aXJlcyB0aGF0IGNoZWNrYm94T25seVJvd1NlbGVjdGlvbnMgYmUgc2V0IHRvIGZhbHNlIChzbyBjaGVja2luZyB0aGlzIGJveCBhdXRvbWF0aWNhbGx5IHVuY2hlY2tzIHRoYXQgb25lKS5cXG4nICtcbiAgICAgICAgICAgICAgICAgICAgJzIuIFNldCBzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlIHRvIGZhbHNlIHRvIGFsbG93IGF1dG8tc2VsZWN0IG9mIG11bHRpcGxlIHJvd3MuJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge25hbWU6ICdhdXRvU2VsZWN0Q29sdW1ucycsIGxhYmVsOiAnYXV0by1zZWxlY3QgY29sdW1ucycsIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgIF07XG5cblxuICAgIHRvZ2dsZVByb3BzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICBhZGRUb2dnbGUocHJvcCk7XG4gICAgfSk7XG5cblxuICAgIFtcbiAgICAgICAge2xhYmVsOiAnVG9nZ2xlIEVtcHR5IERhdGEnLCBvbmNsaWNrOiBkZW1vLnRvZ2dsZUVtcHR5RGF0YX0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnU2V0IERhdGEnLCBvbmNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRlbW8ucmVzZXREYXRhKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnU2V0IERhdGEgMSAoNTAwMCByb3dzKScsIG9uY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGVtby5zZXREYXRhKHBlb3BsZTEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ1NldCBEYXRhIDIgKDEwMDAwIHJvd3MpJywgb25jbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZW1vLnNldERhdGEocGVvcGxlMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtsYWJlbDogJ1Jlc2V0IEdyaWQnLCBvbmNsaWNrOiBkZW1vLnJlc2V0fVxuXG4gICAgXS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgICBidXR0b24uaW5uZXJIVE1MID0gaXRlbS5sYWJlbDtcbiAgICAgICAgYnV0dG9uLm9uY2xpY2sgPSBpdGVtLm9uY2xpY2s7XG4gICAgICAgIGlmIChpdGVtLnRpdGxlKSB7XG4gICAgICAgICAgICBidXR0b24udGl0bGUgPSBpdGVtLnRpdGxlO1xuICAgICAgICB9XG4gICAgICAgIGJ1dHRvbnMuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgICB9KTtcblxuXG4gICAgZnVuY3Rpb24gYWRkVG9nZ2xlKGN0cmxHcm91cCkge1xuICAgICAgICB2YXIgaW5wdXQsIGxhYmVsLFxuICAgICAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9ICdjdHJsLWdyb3VwJztcblxuICAgICAgICBpZiAoY3RybEdyb3VwLmxhYmVsKSB7XG4gICAgICAgICAgICBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgbGFiZWwuY2xhc3NOYW1lID0gJ3R3aXN0ZXInO1xuICAgICAgICAgICAgbGFiZWwuaW5uZXJIVE1MID0gY3RybEdyb3VwLmxhYmVsO1xuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaG9pY2VzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGNob2ljZXMuY2xhc3NOYW1lID0gJ2Nob2ljZXMnO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2hvaWNlcyk7XG5cbiAgICAgICAgY3RybEdyb3VwLmN0cmxzLmZvckVhY2goZnVuY3Rpb24oY3RybCkge1xuICAgICAgICAgICAgaWYgKCFjdHJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmVmZXJlbmNlRWxlbWVudCxcbiAgICAgICAgICAgICAgICB0eXBlID0gY3RybC50eXBlIHx8ICdjaGVja2JveCcsXG4gICAgICAgICAgICAgICAgdG9vbHRpcCA9ICdQcm9wZXJ0eSBuYW1lOiAnICsgY3RybC5uYW1lO1xuXG4gICAgICAgICAgICBpZiAoY3RybC50b29sdGlwKSB7XG4gICAgICAgICAgICAgICAgdG9vbHRpcCArPSAnXFxuXFxuJyArIGN0cmwudG9vbHRpcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgaW5wdXQudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICBpbnB1dC5pZCA9IGN0cmwubmFtZTtcbiAgICAgICAgICAgIGlucHV0Lm5hbWUgPSBjdHJsR3JvdXAubGFiZWw7XG5cbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9IGN0cmwudmFsdWUgfHwgZ2V0UHJvcGVydHkoY3RybC5uYW1lKSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUud2lkdGggPSAnMjVweCc7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnN0eWxlLm1hcmdpbkxlZnQgPSAnNHB4JztcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUubWFyZ2luUmlnaHQgPSAnNHB4JztcbiAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlRWxlbWVudCA9IGlucHV0OyAvLyBsYWJlbCBnb2VzIGFmdGVyIGlucHV0XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgICAgICAgICBjYXNlICdyYWRpbyc6XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LmNoZWNrZWQgPSAnY2hlY2tlZCcgaW4gY3RybFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBjdHJsLmNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIDogZ2V0UHJvcGVydHkoY3RybC5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlRWxlbWVudCA9IG51bGw7IC8vIGxhYmVsIGdvZXMgYmVmb3JlIGlucHV0XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dC5vbmNoYW5nZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlUmFkaW9DbGljay5jYWxsKHRoaXMsIGN0cmwuc2V0dGVyIHx8IHNldFByb3AsIGV2ZW50KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICAgICAgICAgIGxhYmVsLnRpdGxlID0gdG9vbHRpcDtcbiAgICAgICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIGxhYmVsLmluc2VydEJlZm9yZShcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnICcgKyAoY3RybC5sYWJlbCB8fCBjdHJsLm5hbWUpKSxcbiAgICAgICAgICAgICAgICByZWZlcmVuY2VFbGVtZW50XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjaG9pY2VzLmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICAgICAgICAgICAgaWYgKGN0cmwubmFtZSA9PT0gJ3RyZWV2aWV3Jykge1xuICAgICAgICAgICAgICAgIGxhYmVsLm9ubW91c2Vkb3duID0gaW5wdXQub25tb3VzZWRvd24gPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlucHV0LmNoZWNrZWQgJiYgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuc291cmNlLmRhdGEgIT09IGRlbW8udHJlZURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdMb2FkIHRyZWUgZGF0YSBmaXJzdCAoXCJTZXQgRGF0YSAzXCIgYnV0dG9uKS4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjdHJsR3JvdXBzLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgfVxuXG4gICAgLy8gcmVzZXQgZGFzaGJvYXJkIGNoZWNrYm94ZXMgYW5kIHJhZGlvIGJ1dHRvbnMgdG8gbWF0Y2ggY3VycmVudCB2YWx1ZXMgb2YgZ3JpZCBwcm9wZXJ0aWVzXG4gICAgZGVtby5yZXNldERhc2hib2FyZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0b2dnbGVQcm9wcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgICAgICAgIHByb3AuY3RybHMuZm9yRWFjaChmdW5jdGlvbihjdHJsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN0cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjdHJsLnNldHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBzZXRTZWxlY3Rpb25Qcm9wOlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBzZXRQcm9wOlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjdHJsLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncmFkaW8nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkID0gY3RybC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvbGFyaXR5ID0gKGlkWzBdID09PSAnIScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpLmNoZWNrZWQgPSBnZXRQcm9wZXJ0eShpZCkgXiBwb2xhcml0eTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGdldFByb3BlcnR5KGtleSkge1xuICAgICAgICB2YXIga2V5cyA9IGtleS5zcGxpdCgnLicpO1xuICAgICAgICB2YXIgcHJvcCA9IGdyaWQucHJvcGVydGllcztcblxuICAgICAgICB3aGlsZSAoa2V5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHByb3AgPSBwcm9wW2tleXMuc2hpZnQoKV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvcDtcbiAgICB9XG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFiLWRhc2hib2FyZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGRhc2hib2FyZC5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScpIHtcbiAgICAgICAgICAgIGRhc2hib2FyZC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLnRyYW5zaXRpb24gPSAnbWFyZ2luLWxlZnQgLjc1cyc7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS5tYXJnaW5MZWZ0ID0gTWF0aC5tYXgoMTgwLCBkYXNoYm9hcmQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHQgKyA4KSArICdweCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGRhc2hib2FyZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfSwgODAwKTtcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLm1hcmdpbkxlZnQgPSAnMzBweCc7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBmcHNUaW1lciwgc2VjcywgZnJhbWVzO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWItZnBzJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgZWwgPSB0aGlzLCBzdCA9IGVsLnN0eWxlO1xuICAgICAgICBpZiAoKGdyaWQucHJvcGVydGllcy5lbmFibGVDb250aW51b3VzUmVwYWludCBePSB0cnVlKSkge1xuICAgICAgICAgICAgc3QuYmFja2dyb3VuZENvbG9yID0gJyM2NjYnO1xuICAgICAgICAgICAgc3QudGV4dEFsaWduID0gJ2xlZnQnO1xuICAgICAgICAgICAgc2VjcyA9IGZyYW1lcyA9IDA7XG4gICAgICAgICAgICBjb2RlKCk7XG4gICAgICAgICAgICBmcHNUaW1lciA9IHNldEludGVydmFsKGNvZGUsIDEwMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChmcHNUaW1lcik7XG4gICAgICAgICAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSBzdC50ZXh0QWxpZ24gPSBudWxsO1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gJ0ZQUyc7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gY29kZSgpIHtcbiAgICAgICAgICAgIHZhciBmcHMgPSBncmlkLmNhbnZhcy5jdXJyZW50RlBTLFxuICAgICAgICAgICAgICAgIGJhcnMgPSBBcnJheShNYXRoLnJvdW5kKGZwcykgKyAxKS5qb2luKCdJJyksXG4gICAgICAgICAgICAgICAgc3VicmFuZ2UsIHNwYW47XG5cbiAgICAgICAgICAgIC8vIGZpcnN0IHNwYW4gaG9sZHMgdGhlIDMwIGJhY2tncm91bmQgYmFyc1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJykpO1xuXG4gICAgICAgICAgICAvLyAybmQgc3BhbiBob2xkcyB0aGUgbnVtZXJpY1xuICAgICAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuICAgICAgICAgICAgaWYgKHNlY3MpIHtcbiAgICAgICAgICAgICAgICBmcmFtZXMgKz0gZnBzO1xuICAgICAgICAgICAgICAgIHNwYW4uaW5uZXJIVE1MID0gZnBzLnRvRml4ZWQoMSk7XG4gICAgICAgICAgICAgICAgc3Bhbi50aXRsZSA9IHNlY3MgKyAnLXNlY29uZCBhdmVyYWdlID0gJyArIChmcmFtZXMgLyBzZWNzKS50b0ZpeGVkKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VjcyArPSAxO1xuXG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChzcGFuKTtcblxuICAgICAgICAgICAgLy8gMCB0byA0IGNvbG9yIHJhbmdlIGJhciBzdWJzZXRzOiAxLi4xMDpyZWQsIDExOjIwOnllbGxvdywgMjE6MzA6Z3JlZW5cbiAgICAgICAgICAgIHdoaWxlICgoc3VicmFuZ2UgPSBiYXJzLnN1YnN0cigwLCAxMikpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICAgICAgc3Bhbi5pbm5lckhUTUwgPSBzdWJyYW5nZTtcbiAgICAgICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgICAgICAgICAgICBiYXJzID0gYmFycy5zdWJzdHIoMTIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgaGVpZ2h0O1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWItZ3Jvdy1zaHJpbmsnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBsYWJlbDtcbiAgICAgICAgaWYgKCFoZWlnaHQpIHtcbiAgICAgICAgICAgIGhlaWdodCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGdyaWQuZGl2KS5oZWlnaHQ7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS50cmFuc2l0aW9uID0gJ2hlaWdodCAxLjVzIGxpbmVhcic7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgbGFiZWwgPSAnU2hyaW5rJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgIGhlaWdodCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxhYmVsID0gJ0dyb3cnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5uZXJIVE1MICs9ICcgLi4uJztcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuaW5uZXJIVE1MID0gbGFiZWw7XG4gICAgICAgIH0uYmluZCh0aGlzKSwgMTUwMCk7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGFzaGJvYXJkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgY3RybCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgaWYgKGN0cmwuY2xhc3NMaXN0LmNvbnRhaW5zKCd0d2lzdGVyJykpIHtcbiAgICAgICAgICAgIGN0cmwubmV4dEVsZW1lbnRTaWJsaW5nLnN0eWxlLmRpc3BsYXkgPSBjdHJsLmNsYXNzTGlzdC50b2dnbGUoJ29wZW4nKSA/ICdibG9jaycgOiAnbm9uZSc7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS5tYXJnaW5MZWZ0ID0gTWF0aC5tYXgoMTgwLCBldmVudC5jdXJyZW50VGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0ICsgOCkgKyAncHgnO1xuICAgICAgICB9XG4gICAgfSk7XG5cblxuICAgIHZhciByYWRpb0dyb3VwID0ge307XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVSYWRpb0NsaWNrKGhhbmRsZXIsIGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdyYWRpbycpIHtcbiAgICAgICAgICAgIHZhciBsYXN0UmFkaW8gPSByYWRpb0dyb3VwW3RoaXMubmFtZV07XG4gICAgICAgICAgICBpZiAobGFzdFJhZGlvKSB7XG4gICAgICAgICAgICAgICAgbGFzdFJhZGlvLmhhbmRsZXIuY2FsbChsYXN0UmFkaW8uY3RybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByYWRpb0dyb3VwW3RoaXMubmFtZV0gPSB7Y3RybDogdGhpcywgaGFuZGxlcjogaGFuZGxlcn07XG4gICAgICAgIH1cbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRQcm9wKCkgeyAvLyBzdGFuZGFyZCBjaGVja2JveCBjbGljayBoYW5kbGVyXG4gICAgICAgIHZhciBoYXNoID0ge30sIGRlcHRoID0gaGFzaDtcbiAgICAgICAgdmFyIGlkID0gdGhpcy5pZDtcbiAgICAgICAgaWYgKGlkWzBdID09PSAnIScpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgIT09ICdjaGVja2JveCcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnRXhwZWN0ZWQgaW52ZXJzZSBvcGVyYXRvciAoISkgb24gY2hlY2tib3ggZGFzaGJvYXJkIGNvbnRyb2xzIG9ubHkgYnV0IGZvdW5kIG9uICcgKyB0aGlzLnR5cGUgKyAnLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZCA9IGlkLnN1YnN0cigxKTtcbiAgICAgICAgICAgIHZhciBpbnZlcnNlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIga2V5cyA9IGlkLnNwbGl0KCcuJyk7XG5cbiAgICAgICAgd2hpbGUgKGtleXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgZGVwdGggPSBkZXB0aFtrZXlzLnNoaWZ0KCldID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHRoaXMudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgICAgICAgICAgZGVwdGhba2V5cy5zaGlmdCgpXSA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgICAgICAgICAgZGVwdGhba2V5cy5zaGlmdCgpXSA9IGludmVyc2UgPyAhdGhpcy5jaGVja2VkIDogdGhpcy5jaGVja2VkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JpZC50YWtlRm9jdXMoKTtcbiAgICAgICAgZ3JpZC5hZGRQcm9wZXJ0aWVzKGhhc2gpO1xuICAgICAgICBncmlkLmJlaGF2aW9yQ2hhbmdlZCgpO1xuICAgICAgICBncmlkLnJlcGFpbnQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRTZWxlY3Rpb25Qcm9wKCkgeyAvLyBhbHRlcm5hdGUgY2hlY2tib3ggY2xpY2sgaGFuZGxlclxuICAgICAgICB2YXIgY3RybDtcblxuICAgICAgICBncmlkLnNlbGVjdGlvbk1vZGVsLmNsZWFyKCk7XG4gICAgICAgIGdyaWQuYmVoYXZpb3IuZGF0YU1vZGVsLmNsZWFyU2VsZWN0ZWREYXRhKCk7XG5cbiAgICAgICAgc2V0UHJvcC5jYWxsKHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLmNoZWNrZWQpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGlzLmlkID09PSAnY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucycgJiZcbiAgICAgICAgICAgICAgICAoY3RybCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRvU2VsZWN0Um93cycpKS5jaGVja2VkXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBhbGVydCgnTm90ZSB0aGF0IGF1dG9TZWxlY3RSb3dzIGlzIGluZWZmZWN0dWFsIHdoZW4gY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucyBpcyBvbi4nKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5pZCA9PT0gJ2F1dG9TZWxlY3RSb3dzJykge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgKGN0cmwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucycpKS5jaGVja2VkICYmXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpcm0oJ05vdGUgdGhhdCBhdXRvU2VsZWN0Um93cyBpcyBpbmVmZmVjdHVhbCB3aGVuIGNoZWNrYm94T25seVJvd1NlbGVjdGlvbnMgaXMgb24uXFxuXFxuVHVybiBvZmYgY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucz8nKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2V0UHJvcC5jYWxsKGN0cmwpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgKGN0cmwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2luZ2xlUm93U2VsZWN0aW9uTW9kZScpKS5jaGVja2VkICYmXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpcm0oJ05vdGUgdGhhdCBhdXRvLXNlbGVjdGluZyBhIHJhbmdlIG9mIHJvd3MgYnkgc2VsZWN0aW5nIGEgcmFuZ2Ugb2YgY2VsbHMgKHdpdGggY2xpY2sgKyBkcmFnIG9yIHNoaWZ0ICsgY2xpY2spIGlzIG5vdCBwb3NzaWJsZSB3aXRoIHNpbmdsZVJvd1NlbGVjdGlvbk1vZGUgaXMgb24uXFxuXFxuVHVybiBvZmYgc2luZ2xlUm93U2VsZWN0aW9uTW9kZT8nKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2V0UHJvcC5jYWxsKGN0cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkZW1vLCBncmlkKSB7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1jbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGNlbGwgPSBlLmRldGFpbC5ncmlkQ2VsbDtcbiAgICAgICAgaWYgKGRlbW8udmVudCkgeyBjb25zb2xlLmxvZygnZmluLWNsaWNrIGNlbGw6JywgY2VsbCk7IH1cbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWRvdWJsZS1jbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHJvd0NvbnRleHQgPSBlLmRldGFpbC5kYXRhUm93O1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tZG91YmxlLWNsaWNrIHJvdy1jb250ZXh0OicsIHJvd0NvbnRleHQpOyB9XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1idXR0b24tcHJlc3NlZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGNlbGxFdmVudCA9IGUuZGV0YWlsO1xuICAgICAgICBjZWxsRXZlbnQudmFsdWUgPSAhY2VsbEV2ZW50LnZhbHVlO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tc2Nyb2xsLXgnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChkZW1vLnZlbnQpIHsgY29uc29sZS5sb2coJ2Zpbi1zY3JvbGwteCAnLCBlLmRldGFpbC52YWx1ZSk7IH1cbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLXNjcm9sbC15JywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tc2Nyb2xsLXknLCBlLmRldGFpbC52YWx1ZSk7IH1cbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWNlbGwtZW50ZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBjZWxsRXZlbnQgPSBlLmRldGFpbDtcblxuICAgICAgICAvL2lmIChkZW1vLnZlbnQpIHsgY29uc29sZS5sb2coJ2Zpbi1jZWxsLWVudGVyJywgY2VsbC54LCBjZWxsLnkpOyB9XG5cbiAgICAgICAgLy9ob3cgdG8gc2V0IHRoZSB0b29sdGlwLi4uLlxuICAgICAgICBncmlkLnNldEF0dHJpYnV0ZSgndGl0bGUnLCAnZXZlbnQgbmFtZTogXCJmaW4tY2VsbC1lbnRlclwiXFxuJyArXG4gICAgICAgICAgICAnZ3JpZENlbGw6IHsgeDogJyArIGNlbGxFdmVudC5ncmlkQ2VsbC54ICsgJywgeTogJyArIGNlbGxFdmVudC5ncmlkQ2VsbC55ICsgJyB9XFxuJyArXG4gICAgICAgICAgICAnZGF0YUNlbGw6IHsgeDogJyArIGNlbGxFdmVudC5kYXRhQ2VsbC54ICsgJywgeTogJyArIGNlbGxFdmVudC5kYXRhQ2VsbC55ICsgJyB9XFxuJyArXG4gICAgICAgICAgICAnc3ViZ3JpZCB0eXBlOiBcIicgKyBjZWxsRXZlbnQuc3ViZ3JpZC50eXBlICsgJ1wiXFxuJyArXG4gICAgICAgICAgICAnc3ViZ3JpZCBuYW1lOiAnICsgKGNlbGxFdmVudC5zdWJncmlkLm5hbWUgPyAnXCInICsgY2VsbEV2ZW50LnN1YmdyaWQubmFtZSArICdcIicgOiAndW5kZWZpbmVkJylcbiAgICAgICAgKTtcbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLXNldC10b3RhbHMtdmFsdWUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBkZXRhaWwgPSBlLmRldGFpbCxcbiAgICAgICAgICAgIGFyZWFzID0gZGV0YWlsLmFyZWFzIHx8IFsndG9wJywgJ2JvdHRvbSddO1xuXG4gICAgICAgIGFyZWFzLmZvckVhY2goZnVuY3Rpb24oYXJlYSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZE5hbWUgPSAnZ2V0JyArIGFyZWFbMF0udG9VcHBlckNhc2UoKSArIGFyZWEuc3Vic3RyKDEpICsgJ1RvdGFscycsXG4gICAgICAgICAgICAgICAgdG90YWxzUm93ID0gZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWxbbWV0aG9kTmFtZV0oKTtcblxuICAgICAgICAgICAgdG90YWxzUm93W2RldGFpbC55XVtkZXRhaWwueF0gPSBkZXRhaWwudmFsdWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGdyaWQucmVwYWludCgpO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tZmlsdGVyLWFwcGxpZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChkZW1vLnZlbnQpIHsgY29uc29sZS5sb2coJ2Zpbi1maWx0ZXItYXBwbGllZCcsIGUpOyB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBMaXN0ZW4gZm9yIGNlcnRhaW4ga2V5IHByZXNzZXMgZnJvbSBncmlkIG9yIGNlbGwgZWRpdG9yLlxuICAgICAqIEBkZXNjIE5PVEU6IGZpbmNhbnZhcydzIGludGVybmFsIGNoYXIgbWFwIHlpZWxkcyBtaXhlZCBjYXNlIHdoaWxlIGZpbi1lZGl0b3Ita2V5KiBldmVudHMgZG8gbm90LlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IE5vdCBoYW5kbGVkLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGhhbmRsZUN1cnNvcktleShlKSB7XG4gICAgICAgIHZhciBkZXRhaWwgPSBlLmRldGFpbCxcbiAgICAgICAgICAgIGtleSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZGV0YWlsLmtleSkudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlOyAvLyBtZWFucyBldmVudCBoYW5kbGVkIGhlcmVpblxuXG4gICAgICAgIGlmIChkZXRhaWwuY3RybCkge1xuICAgICAgICAgICAgaWYgKGRldGFpbC5zaGlmdCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzAnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0VG9WaWV3cG9ydENlbGwoMCwgMCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzknOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0VG9GaW5hbENlbGwoKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnOCc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RUb0ZpbmFsQ2VsbE9mQ3VycmVudFJvdygpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc3JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFRvRmlyc3RDZWxsT2ZDdXJyZW50Um93KCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICcwJzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFZpZXdwb3J0Q2VsbCgwLCAwKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnOSc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RGaW5hbENlbGwoKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnOCc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RGaW5hbENlbGxPZkN1cnJlbnRSb3coKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnNyc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RGaXJzdENlbGxPZkN1cnJlbnRSb3coKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWtleWRvd24nLCBoYW5kbGVDdXJzb3JLZXkpO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tZWRpdG9yLWtleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIHZhciBkZXRhaWwgPSBlLmRldGFpbCxcbiAgICAgICAgLy8gICAgIGtlID0gZGV0YWlsLmtleUV2ZW50O1xuICAgICAgICAvL1xuICAgICAgICAvLyAvLyBtb3JlIGRldGFpbCwgcGxlYXNlXG4gICAgICAgIC8vIGRldGFpbC5wcmltaXRpdmVFdmVudCA9IGtlO1xuICAgICAgICAvLyBkZXRhaWwua2V5ID0ga2Uua2V5Q29kZTtcbiAgICAgICAgLy8gZGV0YWlsLnNoaWZ0ID0ga2Uuc2hpZnRLZXk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGhhbmRsZUN1cnNvcktleShlKTtcbiAgICB9KTtcblxuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tc2VsZWN0aW9uLWNoYW5nZWQnLCBmdW5jdGlvbihlKSB7XG5cbiAgICAgICAgaWYgKGRlbW8udmVudCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Zpbi1zZWxlY3Rpb24tY2hhbmdlZCcsIGdyaWQuZ2V0U2VsZWN0ZWRSb3dzKCksIGdyaWQuZ2V0U2VsZWN0ZWRDb2x1bW5zKCksIGdyaWQuZ2V0U2VsZWN0aW9ucygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlLmRldGFpbC5zZWxlY3Rpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIHNlbGVjdGlvbnMnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRvIGdldCB0aGUgc2VsZWN0ZWQgcm93cyB1bmNvbW1lbnQgdGhlIGJlbG93Li4uLi5cbiAgICAgICAgLy8gY29uc29sZS5sb2coZ3JpZC5nZXRSb3dTZWxlY3Rpb25NYXRyaXgoKSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGdyaWQuZ2V0Um93U2VsZWN0aW9uKCkpO1xuXG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1yb3ctc2VsZWN0aW9uLWNoYW5nZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBkZXRhaWwgPSBlLmRldGFpbDtcblxuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tcm93LXNlbGVjdGlvbi1jaGFuZ2VkJywgZGV0YWlsKTsgfVxuXG4gICAgICAgIC8vIE1vdmUgY2VsbCBzZWxlY3Rpb24gd2l0aCByb3cgc2VsZWN0aW9uXG4gICAgICAgIHZhciByb3dzID0gZGV0YWlsLnJvd3MsXG4gICAgICAgICAgICBzZWxlY3Rpb25zID0gZGV0YWlsLnNlbGVjdGlvbnM7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGdyaWQucHJvcGVydGllcy5zaW5nbGVSb3dTZWxlY3Rpb25Nb2RlICYmIC8vIGxldCdzIG9ubHkgYXR0ZW1wdCB0aGlzIHdoZW4gaW4gdGhpcyBtb2RlXG4gICAgICAgICAgICAhZ3JpZC5wcm9wZXJ0aWVzLm11bHRpcGxlU2VsZWN0aW9ucyAmJiAvLyBhbmQgb25seSB3aGVuIGluIHNpbmdsZSBzZWxlY3Rpb24gbW9kZVxuICAgICAgICAgICAgcm93cy5sZW5ndGggJiYgLy8gdXNlciBqdXN0IHNlbGVjdGVkIGEgcm93IChtdXN0IGJlIHNpbmdsZSByb3cgZHVlIHRvIG1vZGUgd2UncmUgaW4pXG4gICAgICAgICAgICBzZWxlY3Rpb25zLmxlbmd0aCAgLy8gdGhlcmUgd2FzIGEgY2VsbCByZWdpb24gc2VsZWN0ZWQgKG11c3QgYmUgdGhlIG9ubHkgb25lKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHZhciByZWN0ID0gZ3JpZC5zZWxlY3Rpb25Nb2RlbC5nZXRMYXN0U2VsZWN0aW9uKCksIC8vIHRoZSBvbmx5IGNlbGwgc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgeCA9IHJlY3QubGVmdCxcbiAgICAgICAgICAgICAgICB5ID0gcm93c1swXSwgLy8gd2Uga25vdyB0aGVyZSdzIG9ubHkgMSByb3cgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICB3aWR0aCA9IHJlY3QucmlnaHQgLSB4LFxuICAgICAgICAgICAgICAgIGhlaWdodCA9IDAsIC8vIGNvbGxhcHNlIHRoZSBuZXcgcmVnaW9uIHRvIG9jY3VweSBhIHNpbmdsZSByb3dcbiAgICAgICAgICAgICAgICBmaXJlU2VsZWN0aW9uQ2hhbmdlZEV2ZW50ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGdyaWQuc2VsZWN0aW9uTW9kZWwuc2VsZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQsIGZpcmVTZWxlY3Rpb25DaGFuZ2VkRXZlbnQpO1xuICAgICAgICAgICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocm93cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyByb3dzIHNlbGVjdGVkJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy93ZSBoYXZlIGEgZnVuY3Rpb24gY2FsbCB0byBjcmVhdGUgdGhlIHNlbGVjdGlvbiBtYXRyaXggYmVjYXVzZVxuICAgICAgICAvL3dlIGRvbid0IHdhbnQgdG8gY3JlYXRlIGFsb3Qgb2YgbmVlZGxlc3MgZ2FyYmFnZSBpZiB0aGUgdXNlclxuICAgICAgICAvL2lzIGp1c3QgbmF2aWdhdGluZyBhcm91bmRcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZC5nZXRSb3dTZWxlY3Rpb25NYXRyaXgoKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGdyaWQuZ2V0Um93U2VsZWN0aW9uKCkpO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tY29sdW1uLXNlbGVjdGlvbi1jaGFuZ2VkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tY29sdW1uLXNlbGVjdGlvbi1jaGFuZ2VkJywgZS5kZXRhaWwpOyB9XG5cbiAgICAgICAgaWYgKGUuZGV0YWlsLmNvbHVtbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbm8gcm93cyBzZWxlY3RlZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vd2UgaGF2ZSBhIGZ1bmN0aW9uIGNhbGwgdG8gY3JlYXRlIHRoZSBzZWxlY3Rpb24gbWF0cml4IGJlY2F1c2VcbiAgICAgICAgLy93ZSBkb24ndCB3YW50IHRvIGNyZWF0ZSBhbG90IG9mIG5lZWRsZXNzIGdhcmJhZ2UgaWYgdGhlIHVzZXJcbiAgICAgICAgLy9pcyBqdXN0IG5hdmlnYXRpbmcgYXJvdW5kXG4gICAgICAgIGNvbnNvbGUubG9nKGdyaWQuZ2V0Q29sdW1uU2VsZWN0aW9uTWF0cml4KCkpO1xuICAgICAgICBjb25zb2xlLmxvZyhncmlkLmdldENvbHVtblNlbGVjdGlvbigpKTtcbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWVkaXRvci1kYXRhLWNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGRlbW8udmVudCkgeyBjb25zb2xlLmxvZygnZmluLWVkaXRvci1kYXRhLWNoYW5nZScsIGUuZGV0YWlsKTsgfVxuXG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1yZXF1ZXN0LWNlbGwtZWRpdCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGRlbW8udmVudCkgeyBjb25zb2xlLmxvZygnZmluLXJlcXVlc3QtY2VsbC1lZGl0JywgZSk7IH1cbiAgICAgICAgLy9lLnByZXZlbnREZWZhdWx0KCk7IC8vdW5jb21tZW50IHRvIGNhbmNlbCBlZGl0b3IgcG9wcGluZyB1cFxuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tYmVmb3JlLWNlbGwtZWRpdCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGRlbW8udmVudCkgeyBjb25zb2xlLmxvZygnZmluLWJlZm9yZS1jZWxsLWVkaXQnLCBlKTsgfVxuICAgICAgICAvL2UucHJldmVudERlZmF1bHQoKTsgLy91bmNvbW1lbnQgdG8gY2FuY2VsIHVwZGF0aW5nIHRoZSBtb2RlbCB3aXRoIHRoZSBuZXcgZGF0YVxuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tYWZ0ZXItY2VsbC1lZGl0JywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tYWZ0ZXItY2VsbC1lZGl0JywgZSk7IH1cbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWVkaXRvci1rZXl1cCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGRlbW8udmVudCkgeyBjb25zb2xlLmxvZygnZmluLWVkaXRvci1rZXl1cCcsIGUuZGV0YWlsKTsgfVxuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tZWRpdG9yLWtleXByZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZGVtby52ZW50KSB7IGNvbnNvbGUubG9nKCdmaW4tZWRpdG9yLWtleXByZXNzJywgZS5kZXRhaWwpOyB9XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1lZGl0b3Ita2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGRlbW8udmVudCkgeyBjb25zb2xlLmxvZygnZmluLWVkaXRvci1rZXlkb3duJywgZS5kZXRhaWwpOyB9XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1ncm91cHMtY2hhbmdlZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGRlbW8udmVudCkgeyBjb25zb2xlLmxvZygnZmluLWdyb3Vwcy1jaGFuZ2VkJywgZS5kZXRhaWwpOyB9XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1jb250ZXh0LW1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBtb2RlbFBvaW50ID0gZS5kZXRhaWwuZ3JpZENlbGw7XG4gICAgICAgIGlmIChkZW1vLnZlbnQpIHsgY29uc29sZS5sb2coJ2Zpbi1jb250ZXh0LW1lbnUoJyArIG1vZGVsUG9pbnQueCArICcsICcgKyBtb2RlbFBvaW50LnkgKyAnKScpOyB9XG4gICAgfSk7XG5cbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuLyogZ2xvYmFscyBmaW4sIHBlb3BsZTEgKi9cblxuLyogZXNsaW50LWRpc2FibGUgbm8tYWxlcnQqL1xuXG4ndXNlIHN0cmljdCc7XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblxuICAgIHZhciBkZW1vID0gd2luZG93LmRlbW8gPSB7XG4gICAgICAgIHZlbnQ6IGZhbHNlLFxuICAgICAgICByZXNldDogcmVzZXQsXG4gICAgICAgIHNldERhdGE6IHNldERhdGEsXG4gICAgICAgIHRvZ2dsZUVtcHR5RGF0YTogdG9nZ2xlRW1wdHlEYXRhLFxuICAgICAgICByZXNldERhdGE6IHJlc2V0RGF0YVxuICAgIH07XG5cbiAgICB2YXIgSHlwZXJncmlkID0gZmluLkh5cGVyZ3JpZCxcbiAgICAgICAgaW5pdFN0YXRlID0gcmVxdWlyZSgnLi9zZXRTdGF0ZScpLFxuICAgICAgICBpbml0Q2VsbFJlbmRlcmVycyA9IHJlcXVpcmUoJy4vY2VsbHJlbmRlcmVycycpLFxuICAgICAgICBpbml0Rm9ybWF0dGVycyA9IHJlcXVpcmUoJy4vZm9ybWF0dGVycycpLFxuICAgICAgICBpbml0Q2VsbEVkaXRvcnMgPSByZXF1aXJlKCcuL2NlbGxFZGl0b3JzJyksXG4gICAgICAgIGluaXREYXNoYm9hcmQgPSByZXF1aXJlKCcuL2Rhc2hib2FyZCcpLFxuICAgICAgICBpbml0RXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxuICAgIC8vIGNvbnZlcnQgZmllbGQgbmFtZXMgY29udGFpbmluZyB1bmRlcnNjb3JlIHRvIGNhbWVsIGNhc2UgYnkgb3ZlcnJpZGluZyBjb2x1bW4gZW51bSBkZWNvcmF0b3JcbiAgICBIeXBlcmdyaWQuYmVoYXZpb3JzLkpTT04ucHJvdG90eXBlLmNvbHVtbkVudW1LZXkgPSBIeXBlcmdyaWQuYmVoYXZpb3JzLkpTT04uY29sdW1uRW51bURlY29yYXRvcnMudG9DYW1lbENhc2U7XG5cbiAgICB2YXIgZ3JpZE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXRhOiBwZW9wbGUxLFxuICAgICAgICAgICAgbWFyZ2luOiB7IGJvdHRvbTogJzE3cHgnLCByaWdodDogJzE3cHgnfSxcbiAgICAgICAgICAgIHNjaGVtYTogSHlwZXJncmlkLmxpYi5maWVsZHMuZ2V0U2NoZW1hKHBlb3BsZTEpLFxuICAgICAgICAgICAgc3RhdGU6IHsgY29sb3I6ICdvcmFuZ2UnIH1cbiAgICAgICAgfSxcbiAgICAgICAgZ3JpZCA9IHdpbmRvdy5ncmlkID0gd2luZG93LmcgPSBuZXcgSHlwZXJncmlkKCdkaXYjanNvbi1leGFtcGxlJywgZ3JpZE9wdGlvbnMpLFxuICAgICAgICBiZWhhdmlvciA9IHdpbmRvdy5iID0gZ3JpZC5iZWhhdmlvcixcbiAgICAgICAgZGF0YU1vZGVsID0gd2luZG93Lm0gPSBiZWhhdmlvci5kYXRhTW9kZWwsXG4gICAgICAgIGluaXRpYWwgPSB0cnVlLFxuICAgICAgICBpZHggPSBiZWhhdmlvci5jb2x1bW5FbnVtO1xuXG5cbiAgICBjb25zb2xlLmxvZygnRmllbGRzOicpOyAgY29uc29sZS5kaXIoYmVoYXZpb3IuZGF0YU1vZGVsLnNjaGVtYS5tYXAoZnVuY3Rpb24oY3MpIHsgcmV0dXJuIGNzLm5hbWU7IH0pKTtcbiAgICBjb25zb2xlLmxvZygnSGVhZGVyczonKTsgY29uc29sZS5kaXIoYmVoYXZpb3IuZGF0YU1vZGVsLnNjaGVtYS5tYXAoZnVuY3Rpb24oY3MpIHsgcmV0dXJuIGNzLmhlYWRlcjsgfSkpO1xuICAgIGNvbnNvbGUubG9nKCdJbmRleGVzOicpOyBjb25zb2xlLmRpcihpZHgpO1xuXG4gICAgZnVuY3Rpb24gc2V0RGF0YShkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSAhZGF0YS5sZW5ndGggPyB1bmRlZmluZWQgOiBvcHRpb25zIHx8IHtcbiAgICAgICAgICAgIHNjaGVtYTogSHlwZXJncmlkLmxpYi5maWVsZHMuZ2V0U2NoZW1hKGRhdGEpXG4gICAgICAgIH07XG4gICAgICAgIGdyaWQuc2V0RGF0YShkYXRhLCBvcHRpb25zKTtcbiAgICAgICAgYmVoYXZpb3IucmVpbmRleCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgICBncmlkLnJlc2V0KCk7XG4gICAgICAgIGluaXRFdmVudHMoZGVtbywgZ3JpZCk7XG4gICAgfVxuXG4gICAgdmFyIG9sZERhdGE7XG4gICAgZnVuY3Rpb24gdG9nZ2xlRW1wdHlEYXRhKCkge1xuICAgICAgICBpZiAoIW9sZERhdGEpIHtcbiAgICAgICAgICAgIG9sZERhdGEgPSB7XG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YU1vZGVsLmdldERhdGEoKSxcbiAgICAgICAgICAgICAgICBzY2hlbWE6IGRhdGFNb2RlbC5zY2hlbWEsXG4gICAgICAgICAgICAgICAgYWN0aXZlQ29sdW1uczogYmVoYXZpb3IuZ2V0QWN0aXZlQ29sdW1ucygpLm1hcChmdW5jdGlvbihjb2x1bW4pIHsgcmV0dXJuIGNvbHVtbi5pbmRleDsgfSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvL2ltcG9ydGFudCB0byBzZXQgdG9wIHRvdGFscyBmaXJzdFxuICAgICAgICAgICAgc2V0RGF0YShbXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL2ltcG9ydGFudCB0byBzZXQgdG9wIHRvdGFscyBmaXJzdFxuICAgICAgICAgICAgc2V0RGF0YShvbGREYXRhLmRhdGEsIG9sZERhdGEuc2NoZW1hKTtcbiAgICAgICAgICAgIGJlaGF2aW9yLnNldENvbHVtbkluZGV4ZXMob2xkRGF0YS5hY3RpdmVDb2x1bW5zKTtcbiAgICAgICAgICAgIG9sZERhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNldERhdGEoKSB7XG4gICAgICAgIHNldERhdGEocGVvcGxlMSk7XG4gICAgICAgIGlmIChpbml0aWFsKSB7XG4gICAgICAgICAgICBpbml0RGFzaGJvYXJkKGRlbW8sIGdyaWQpO1xuICAgICAgICAgICAgaW5pdGlhbCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGluaXRTdGF0ZShkZW1vLCBncmlkKTsgfSwgNTApO1xuICAgIH1cblxuICAgIHJlc2V0RGF0YSgpO1xuXG4gICAgaW5pdENlbGxSZW5kZXJlcnMoZGVtbywgZ3JpZCk7XG4gICAgaW5pdEZvcm1hdHRlcnMoZGVtbywgZ3JpZCk7XG4gICAgaW5pdENlbGxFZGl0b3JzKGRlbW8sIGdyaWQpO1xuICAgIGluaXRFdmVudHMoZGVtbywgZ3JpZCk7XG59O1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkZW1vLCBncmlkKSB7XG5cbiAgICB2YXIgZm9vdEluY2hQYXR0ZXJuID0gL15cXHMqKCgoKFxcZCspJyk/XFxzKigoXFxkKylcIik/KXxcXGQrKVxccyokLztcblxuICAgIHZhciBmb290SW5jaExvY2FsaXplciA9IHtcbiAgICAgICAgZm9ybWF0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmVldCA9IE1hdGguZmxvb3IodmFsdWUgLyAxMik7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSAoZmVldCA/IGZlZXQgKyAnXFwnJyA6ICcnKSArICcgJyArICh2YWx1ZSAlIDEyKSArICdcIic7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICAgICAgdmFyIGluY2hlcywgZmVldCxcbiAgICAgICAgICAgICAgICBwYXJ0cyA9IHN0ci5tYXRjaChmb290SW5jaFBhdHRlcm4pO1xuICAgICAgICAgICAgaWYgKHBhcnRzKSB7XG4gICAgICAgICAgICAgICAgZmVldCA9IHBhcnRzWzRdO1xuICAgICAgICAgICAgICAgIGluY2hlcyA9IHBhcnRzWzZdO1xuICAgICAgICAgICAgICAgIGlmIChmZWV0ID09PSB1bmRlZmluZWQgJiYgaW5jaGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5jaGVzID0gTnVtYmVyKHBhcnRzWzFdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmZWV0ID0gTnVtYmVyKGZlZXQgfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGluY2hlcyA9IE51bWJlcihpbmNoZXMgfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGluY2hlcyA9IDEyICogZmVldCArIGluY2hlcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGluY2hlcyA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW5jaGVzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdyaWQubG9jYWxpemF0aW9uLmFkZCgnZm9vdCcsIGZvb3RJbmNoTG9jYWxpemVyKTtcblxuICAgIGdyaWQubG9jYWxpemF0aW9uLmFkZCgnc2luZ2RhdGUnLCBuZXcgZ3JpZC5sb2NhbGl6YXRpb24uRGF0ZUZvcm1hdHRlcignemgtU0cnKSk7XG5cbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoJ3BvdW5kcycsIG5ldyBncmlkLmxvY2FsaXphdGlvbi5OdW1iZXJGb3JtYXR0ZXIoJ2VuLVVTJywge1xuICAgICAgICBzdHlsZTogJ2N1cnJlbmN5JyxcbiAgICAgICAgY3VycmVuY3k6ICdVU0QnXG4gICAgfSkpO1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKCdmcmFuY3MnLCBuZXcgZ3JpZC5sb2NhbGl6YXRpb24uTnVtYmVyRm9ybWF0dGVyKCdmci1GUicsIHtcbiAgICAgICAgc3R5bGU6ICdjdXJyZW5jeScsXG4gICAgICAgIGN1cnJlbmN5OiAnRVVSJ1xuICAgIH0pKTtcblxuICAgIGdyaWQubG9jYWxpemF0aW9uLmFkZCh7XG4gICAgICAgIG5hbWU6ICdoaG1tJywgLy8gYWx0ZXJuYXRpdmUgdG8gaGF2aW5nIHRvIGhhbWUgbG9jYWxpemVyIGluIGBncmlkLmxvY2FsaXphdGlvbi5hZGRgXG5cbiAgICAgICAgLy8gcmV0dXJucyBmb3JtYXR0ZWQgc3RyaW5nIGZyb20gbnVtYmVyXG4gICAgICAgIGZvcm1hdDogZnVuY3Rpb24obWlucykge1xuICAgICAgICAgICAgdmFyIGhoID0gTWF0aC5mbG9vcihtaW5zIC8gNjApICUgMTIgfHwgMTIsIC8vIG1vZHVsbyAxMiBocnMgd2l0aCAwIGJlY29taW5nIDEyXG4gICAgICAgICAgICAgICAgbW0gPSAobWlucyAlIDYwICsgMTAwICsgJycpLnN1YnN0cigxLCAyKSxcbiAgICAgICAgICAgICAgICBBbVBtID0gbWlucyA8IGRlbW8uTk9PTiA/ICdBTScgOiAnUE0nO1xuICAgICAgICAgICAgcmV0dXJuIGhoICsgJzonICsgbW0gKyAnICcgKyBBbVBtO1xuICAgICAgICB9LFxuXG4gICAgICAgIGludmFsaWQ6IGZ1bmN0aW9uKGhobW0pIHtcbiAgICAgICAgICAgIHJldHVybiAhL14oMD9bMS05XXwxWzAtMl0pOlswLTVdXFxkJC8udGVzdChoaG1tKTsgLy8gMTI6NTkgbWF4XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gcmV0dXJucyBudW1iZXIgZnJvbSBmb3JtYXR0ZWQgc3RyaW5nXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbihoaG1tKSB7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSBoaG1tLm1hdGNoKC9eKFxcZCspOihcXGR7Mn0pJC8pO1xuICAgICAgICAgICAgcmV0dXJuIE51bWJlcihwYXJ0c1sxXSkgKiA2MCArIE51bWJlcihwYXJ0c1syXSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBncmlkO1xuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIHZhciBpZHggPSBncmlkLmJlaGF2aW9yLmNvbHVtbkVudW07XG5cbiAgICB2YXIgc3RhdGUgPSB7XG4gICAgICAgIGNvbHVtbkluZGV4ZXM6IFtcbiAgICAgICAgICAgIGlkeC5sYXN0TmFtZSxcbiAgICAgICAgICAgIGlkeC50b3RhbE51bWJlck9mUGV0c093bmVkLFxuICAgICAgICAgICAgaWR4LmhlaWdodCxcbiAgICAgICAgICAgIGlkeC5iaXJ0aERhdGUsXG4gICAgICAgICAgICBpZHguYmlydGhUaW1lLFxuICAgICAgICAgICAgaWR4LmJpcnRoU3RhdGUsXG4gICAgICAgICAgICAvLyBpZHgucmVzaWRlbmNlU3RhdGUsXG4gICAgICAgICAgICBpZHguZW1wbG95ZWQsXG4gICAgICAgICAgICAvLyBpZHguZmlyc3ROYW1lLFxuICAgICAgICAgICAgaWR4LmluY29tZSxcbiAgICAgICAgICAgIGlkeC50cmF2ZWwsXG4gICAgICAgICAgICAvLyBpZHguc3F1YXJlT2ZJbmNvbWVcbiAgICAgICAgXSxcblxuICAgICAgICBub0RhdGFNZXNzYWdlOiAnTm8gRGF0YSB0byBEaXNwbGF5JyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnd2hpdGUnLFxuICAgICAgICBmb250OiAnbm9ybWFsIHNtYWxsIGdhcmFtb25kJyxcbiAgICAgICAgcm93UHJvcGVydGllczogW1xuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgeyBjb2xvcjogJyMxMTY2MTEnLCBiYWNrZ3JvdW5kQ29sb3I6ICcjZThmZmU4JywgZm9udDogJ2l0YWxpYyBzbWFsbCBnYXJhbW9uZCcgfSxcbiAgICAgICAgICAgIHsgY29sb3I6ICcjMTE2NjExJywgYmFja2dyb3VuZENvbG9yOiAnI2U4ZmZlOCcsIGZvbnQ6ICdpdGFsaWMgc21hbGwgZ2FyYW1vbmQnIH0sXG4gICAgICAgICAgICB7IGNvbG9yOiAnIzExNjYxMScsIGJhY2tncm91bmRDb2xvcjogJyNlOGZmZTgnLCBmb250OiAnaXRhbGljIHNtYWxsIGdhcmFtb25kJyB9XG4gICAgICAgIF0sXG5cbiAgICAgICAgZml4ZWRDb2x1bW5Db3VudDogMSxcbiAgICAgICAgZml4ZWRSb3dDb3VudDogNCxcblxuICAgICAgICBjb2x1bW5BdXRvc2l6aW5nOiBmYWxzZSxcbiAgICAgICAgaGVhZGVyVGV4dFdyYXBwaW5nOiB0cnVlLFxuXG4gICAgICAgIGhhbGlnbjogJ2xlZnQnLFxuICAgICAgICByZW5kZXJGYWxzeTogdHJ1ZSxcblxuICAgICAgICBzY3JvbGxiYXJIb3Zlck9mZjogJ3Zpc2libGUnLFxuICAgICAgICBzY3JvbGxiYXJIb3Zlck92ZXI6ICd2aXNpYmxlJyxcbiAgICAgICAgY29sdW1uSGVhZGVyQmFja2dyb3VuZENvbG9yOiAncGluaycsXG5cbiAgICAgICAgY2hlY2tib3hPbmx5Um93U2VsZWN0aW9uczogdHJ1ZSxcblxuICAgICAgICBhdXRvU2VsZWN0Um93czogdHJ1ZSxcblxuICAgICAgICByb3dzOiB7XG4gICAgICAgICAgICBoZWFkZXI6IHtcbiAgICAgICAgICAgICAgICAwOiB7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogNDBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsY3VsYXRvcnM6IHtcbiAgICAgICAgICAgIEFkZDEwOiAnZnVuY3Rpb24oZGF0YVJvdyxjb2x1bW5OYW1lKSB7IHJldHVybiBkYXRhUm93W2NvbHVtbk5hbWVdICsgMTA7IH0nXG4gICAgICAgIH0sXG5cbiAgICAgICAgY29sdW1uczoge1xuICAgICAgICAgICAgaGVpZ2h0OiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ2Zvb3QnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbiAgICAgICAgICAgIGxhc3RfbmFtZToge1xuICAgICAgICAgICAgICAgIGNvbHVtbkhlYWRlckJhY2tncm91bmRDb2xvcjogJyMxNDJCNkYnLCAvL2RhcmsgYmx1ZVxuICAgICAgICAgICAgICAgIGNvbHVtbkhlYWRlckNvbG9yOiAnd2hpdGUnLFxuICAgICAgICAgICAgICAgIGNvbHVtbkhlYWRlckhhbGlnbjogJ2xlZnQnLFxuICAgICAgICAgICAgICAgIHJpZ2h0SWNvbjogJ2Rvd24tcmVjdGFuZ2xlJyxcbiAgICAgICAgICAgICAgICBsaW5rOiB0cnVlXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBmaXJzdF9uYW1lOiB7XG5cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHRvdGFsX251bWJlcl9vZl9wZXRzX293bmVkOiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgIGNhbGN1bGF0b3I6ICdBZGQxMCcsXG4gICAgICAgICAgICAgICAgY29sb3I6ICdncmVlbidcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGJpcnRoRGF0ZToge1xuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3NpbmdkYXRlJyxcbiAgICAgICAgICAgICAgICByaWdodEljb246ICdjYWxlbmRhcicsXG4gICAgICAgICAgICAgICAgLy9zdHJpa2VUaHJvdWdoOiB0cnVlXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBiaXJ0aFRpbWU6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgZWRpdG9yOiAndGltZScsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnaGhtbSdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGJpcnRoU3RhdGU6IHtcbiAgICAgICAgICAgICAgICBlZGl0b3I6ICdjb2xvcnRleHQnLFxuICAgICAgICAgICAgICAgIHJpZ2h0SWNvbjogJ2Rvd24tcmVjdGFuZ2xlJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVzaWRlbmNlU3RhdGU6IHtcbiAgICAgICAgICAgICAgICByaWdodEljb246ICdkb3duLXJlY3RhbmdsZSdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGVtcGxveWVkOiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgICAgIHJlbmRlcmVyOiAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd3aGl0ZSdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGluY29tZToge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdwb3VuZHMnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB0cmF2ZWw6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnZnJhbmNzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEZvbGxvd2luZyBgY2VsbHNgIGV4YW1wbGUgc2V0cyBwcm9wZXJ0aWVzIGZvciBhIGNlbGwgaW4gdGhlIGRhdGEgc3ViZ3JpZC5cbiAgICAgICAgLy8gU3BlY2lmeWluZyBjZWxsIHByb3BlcnRpZXMgaGVyZSBpbiBncmlkIHN0YXRlIG1heSBiZSB1c2VmdWwgZm9yIHN0YXRpYyBkYXRhIHN1YmdyaWRzXG4gICAgICAgIC8vIHdoZXJlIGNlbGwgY29vcmRpbmF0ZXMgYXJlIHBlcm1hbmVudGx5IGFzc2lnbmVkLiBPdGhlcndpc2UsIGZvciBteSBkeW5hbWljIGdyaWQgZGF0YSxcbiAgICAgICAgLy8gY2VsbCBwcm9wZXJ0aWVzIG1pZ2h0IG1vcmUgcHJvcGVybHkgYWNjb21wYW55IHRoZSBkYXRhIGl0c2VsZiBhcyBtZXRhZGF0YVxuICAgICAgICAvLyAoaS5lLiwgYXMgYSBoYXNoIGluIGRhdGFSb3cuX19NRVRBW2ZpZWxkTmFtZV0pLlxuICAgICAgICBjZWxsczoge1xuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIDE2OiB7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udDogJzEwcHQgVGFob21hJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnbGlnaHRibHVlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBoYWxpZ246ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlYXBwbHlDZWxsUHJvcGVydGllczogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdyaWQuc2V0U3RhdGUoc3RhdGUpO1xuXG4gICAgLy8gcHJvcGVydGllcyB0aGF0IGNhbiBiZSBzZXRcbiAgICAvLyB1c2UgYSBmdW5jdGlvbiBvciBhIHZhbHVlXG5cbiAgICAvLyBmb250XG4gICAgLy8gY29sb3JcbiAgICAvLyBiYWNrZ3JvdW5kQ29sb3JcbiAgICAvLyBmb3JlZ3JvdW5kU2VsZWN0aW9uQ29sb3JcbiAgICAvLyBiYWNrZ3JvdW5kU2VsZWN0aW9uQ29sb3JcblxuICAgIC8vIGNvbHVtbkhlYWRlckZvbnRcbiAgICAvLyBjb2x1bW5IZWFkZXJDb2xvclxuICAgIC8vIGNvbHVtbkhlYWRlckJhY2tncm91bmRDb2xvclxuICAgIC8vIGNvbHVtbkhlYWRlckZvcmVncm91bmRTZWxlY3Rpb25Db2xvclxuICAgIC8vIGNvbHVtbkhlYWRlckJhY2tncm91bmRTZWxlY3Rpb25Db2xvclxuXG4gICAgLy8gcm93SGVhZGVyRm9udFxuICAgIC8vIHJvd0hlYWRlckNvbG9yXG4gICAgLy8gcm93SGVhZGVyQmFja2dyb3VuZENvbG9yXG4gICAgLy8gcm93SGVhZGVyRm9yZWdyb3VuZFNlbGVjdGlvbkNvbG9yXG4gICAgLy8gcm93SGVhZGVyQmFja2dyb3VuZFNlbGVjdGlvbkNvbG9yXG5cbiAgICAvLyAgICAgICAgICAgICAgICBiZWhhdmlvci5zZXRDZWxsUHJvcGVydGllcyhpZHgudG90YWxOdW1iZXJPZlBldHNPd25lZCwgMCxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAge1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgZm9udDogJzEwcHQgVGFob21hJyxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAncmVkJyxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ2xpZ2h0Ymx1ZScsXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICBoYWxpZ246ICdsZWZ0J1xuICAgIC8vICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKCd2aXNpYmxlIHJvd3MgPSAnICsgZ3JpZC5yZW5kZXJlci52aXNpYmxlUm93cy5tYXAoZnVuY3Rpb24odnIpe1xuICAgICAgICByZXR1cm4gdnIuc3ViZ3JpZC50eXBlWzBdICsgdnIucm93SW5kZXg7XG4gICAgfSkpO1xuICAgIGNvbnNvbGUubG9nKCd2aXNpYmxlIGNvbHVtbnMgPSAnICsgZ3JpZC5yZW5kZXJlci52aXNpYmxlQ29sdW1ucy5tYXAoZnVuY3Rpb24odmMpe1xuICAgICAgICByZXR1cm4gdmMuY29sdW1uSW5kZXg7XG4gICAgfSkpO1xuXG4gICAgLy9zZWUgbXlUaGVtZXMuanMgZmlsZSBmb3IgaG93IHRvIGNyZWF0ZSBhIHRoZW1lXG4gICAgLy9ncmlkLmFkZFByb3BlcnRpZXMobXlUaGVtZXMub25lKTtcbiAgICAvL2dyaWQuYWRkUHJvcGVydGllcyhteVRoZW1lcy50d28pO1xuICAgIC8vZ3JpZC5hZGRQcm9wZXJ0aWVzKG15VGhlbWVzLnRocmVlKTtcblxuICAgIGdyaWQudGFrZUZvY3VzKCk7XG5cbiAgICBkZW1vLnJlc2V0RGFzaGJvYXJkKCk7XG59O1xuIl19
