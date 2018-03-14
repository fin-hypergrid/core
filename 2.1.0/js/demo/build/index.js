(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* eslint-env browser */

'use strict';

module.exports = function(demo, grid) {

    var idx = grid.behavior.columnEnum;

    var CellEditor = grid.cellEditors.BaseClass;
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
    var sparkStarRatingRenderer = grid.cellRenderers.BaseClass.extend({
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

    grid.addEventListener('fin-button-pressed', function(e) {
        var cellEvent = e.detail;
        cellEvent.value = !cellEvent.value;
    });

    grid.addEventListener('fin-cell-enter', function(e) {
        var cellEvent = e.detail;

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

    //uncomment to cancel editor popping up:
    // grid.addEventListener('fin-request-cell-edit', function(e) { e.preventDefault(); });

    //uncomment to cancel updating the model with the new data:
    // grid.addEventListener('fin-before-cell-edit', function(e) { e.preventDefault(); });
};

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
/* eslint-env browser */

/* globals fin, people1 */

/* eslint-disable no-alert*/

'use strict';

window.onload = function() {

    var demo = window.demo = {
        set vent(start) { window.grid[start ? 'logStart' : 'logStop'](); },
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
            plugins: require('fin-hypergrid-event-logger'),
            state: { color: 'orange' }
        },
        grid = window.grid = window.g = new Hypergrid('div#json-example', gridOptions),
        behavior = window.b = grid.behavior,
        dataModel = window.m = behavior.dataModel,
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
        initState(demo, grid);
    }

    initCellRenderers(demo, grid);
    initFormatters(demo, grid);
    initCellEditors(demo, grid);
    initEvents(demo, grid);
    initDashboard(demo, grid);
    initState(demo, grid);
};

},{"./cellEditors":1,"./cellrenderers":2,"./dashboard":3,"./events":4,"./formatters":5,"./setState":7,"fin-hypergrid-event-logger":10}],7:[function(require,module,exports){
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

    grid.takeFocus();

    demo.resetDashboard();
};

},{}],8:[function(require,module,exports){
'use strict';

var catalog = require('object-catalog');
var find = require('match-point');
var Greylist = require('greylist');


var isDOM = (
    typeof window === 'object' &&
    Object.prototype.toString.call(window) === '[object Window]' &&
    typeof window.Node === 'function'
);

var isDomNode = isDOM ? function(obj) { return obj instanceof window.Node } : function() {};


/**
 * @summary Search an object's code for pattern matches.
 * @desc Searches all code in the visible execution context using the provided regex pattern, returning the entire pattern match.
 *
 * If capture groups are specified in the pattern, returns the last capture group match, unless `options.captureGroup` is defined, in which case returns the group with that index where `0` means the entire pattern, _etc._ (per `String.prototype.match`).
 *
 * @param {string|RegExp} pattern - Search argument.
 * Don't use global flag on RegExp; it's unnecessary and suppresses submatches of capture groups.
 *
 * @param [options]
 * @param {number} [options.captureGroup] - Iff defined, index of a specific capture group to return for each match.
 * @param {boolean} [options.recurse] - Equivalent to setting both `recurseOwn` and `recurseAncestors`.
 * @param {boolean} [options.recurseOwn] - Recurse own subobjects.
 * @param {boolean} [options.recurseAncestors] - Recurse subobjects of objects of the entire prototype chain.
 * @param {object} [options.greylist] - https://github.com/joneit/greylist
 * @param [options.greylist.white] - If given, only listed matches are included in the results.
 * @param [options.greylist.black] - If given, listed matches are excluded from the results.
 *
 * @param {object} [options.catalog] - https://github.com/joneit/object-catalog
 * @param {boolean} [options.catalog.own] - Only search own object; otherwise search own + entire prototype chain.
 * @param {object} [options.catalog.greylist] - https://github.com/joneit/greylist
 * @param [options.catalog.greylist.white] - If given, only listed members are cataloged.
 * @param [options.catalog.greylist.black] - If given, listed members are *not* cataloged.
 *
 * @returns {string[]} Pattern matches.
 */
function match(pattern, options, byGreylist, matches, scanned) {
    var topLevelCall = !matches;

    if (topLevelCall) {
        // this is the top-level (non-recursed) call so intialize:
        var greylist = new Greylist(options && options.greylist);
        byGreylist = greylist.test.bind(greylist);
        options = options || {};
        matches = [];
        scanned = [];
    }

    var root = this;
    var members = catalog.call(root, options.catalog);

    scanned.push(root);

    Object.keys(members).forEach(function (key) {
        var obj = members[key];
        var descriptor = Object.getOwnPropertyDescriptor(obj, key);

        if (descriptor.value === match) {
            return; // don't catalog self when found to have been mixed in
        }

        Object.keys(descriptor).forEach(function (propName) {
            var hits, prop = descriptor[propName];

            if (typeof prop === 'function') {
                // propName must be `get` or `set` or `value`
                hits = find(prop.toString(), pattern, options.captureGroup).filter(byGreylist);
                hits.forEach(function(hit) { matches.push(hit); });
            } else if (
                (options.recurse || options.recurseOwn && obj === root || options.recurseChain && obj !== root) &&
                typeof prop === 'object' &&
                !isDomNode(prop) && // don't search DOM objects
                scanned.indexOf(prop) < 0 // don't recurse on objects already scanned
            ) {
                // propName must be `value`
                match.call(prop, pattern, options, byGreylist, matches, scanned);
            }
        });
    });

    if (topLevelCall) {
        matches.sort();
    }

    return matches;
}

module.exports = match;
},{"greylist":11,"match-point":12,"object-catalog":13}],9:[function(require,module,exports){
'use strict';

function logEventObject(e) {
    this.log(e.type, '::', e);
}

function logDetail(e) {
    this.log(e.type, '::', e.detail);
}

function logScroll(e) {
    this.log(e.type, '::', e.detail.value);
}

function logCell(e) {
    var gCell = e.detail.gridCell;
    var dCell = e.detail.dataCell;
    this.log(e.type, '::',
        'grid-cell:', { x: gCell.x, y: gCell.y },
        'data-cell:', { x: dCell.x, y: dCell.y });
}

function logSelection(e) {
    this.log(e.type, '::', e.detail.rows, e.detail.columns, e.detail.selections);
}

function logRow(e) {
    var rowContext = e.detail.primitiveEvent.dataRow;
    this.log(e.type, '::', 'row-context:', rowContext);
}

module.exports = {
    'fin-cell-enter': logCell,
    'fin-click': logCell,
    'fin-double-click': logRow,
    'fin-selection-changed': logSelection,
    'fin-context-menu': logCell,

    'fin-scroll-x': logScroll,
    'fin-scroll-y': logScroll,

    'fin-row-selection-changed': logDetail,
    'fin-column-selection-changed': logDetail,
    'fin-editor-data-change': logDetail,
    'fin-editor-keyup': logDetail,
    'fin-editor-keypress': logDetail,
    'fin-editor-keydown': logDetail,
    'fin-groups-changed': logDetail,

    'fin-filter-applied': logEventObject,
    'fin-request-cell-edit': logEventObject,
    'fin-before-cell-edit': logEventObject,
    'fin-after-cell-edit': logEventObject
};

},{}],10:[function(require,module,exports){
'use strict';

var StarLog = require('starlog');

var eventLoggerPlugin = {

    start: function(options)
    {
        if (options && this.starlog) {
            this.starlog.stop(); // stop the old one before redefining it with new options object
        }

        if (!this.starlog || options) {
            options = Object.assign({}, options);

            // search grid object for "Event('yada-yada'" or "Event.call(this, 'yada-yada'"
            options.select = options.select || this;
            options.pattern = options.pattern || /Event(\.call\(this, |\()'(fin-[a-z-]+)'/;
            options.targets = options.targets || this.canvas.canvas;

            // mix options.listenerDictionary on top of some custom listeners
            options.listenerDictionary = Object.assign({}, require('./custom-listeners'), options.listenerDictionary);

            // mix fin-tick on top of options.match.greylist.black
            var black = ['fin-tick'];
            options.match = options.match || {};
            options.match.greylist = options.match.greylist || {};
            options.match.greylist.black = options.match.greylist.black ? black.concat(options.match.greylist.black) : black;

            this.starlog = new StarLog(options);
        }

        this.starlog.start();
    },

    stop: function() {
        this.starlog.stop();
    }

};

// Non-enumerable methods are not themselves installed:
Object.defineProperties(eventLoggerPlugin, {
    preinstall: {
        value: function(HypergridPrototype, BehaviorPrototype, methodPrefix) {
            install.call(this, HypergridPrototype, methodPrefix);
        }
    },

    install: {
        value: function(grid, methodPrefix) {
            install.call(this, grid, methodPrefix);
        }
    }
});

function install(target, methodPrefix) {
    if (methodPrefix === undefined) {
        methodPrefix = 'log';
    }
    Object.keys(this).forEach(function (key) {
        target[prefix(methodPrefix, key)] = this[key];
    }, this);
}

function prefix(prefix, name) {
    var capitalize = prefix.length && prefix[prefix.length - 1] !== '_';
    if (capitalize) {
        name = name.substr(0, 1).toUpperCase() + name.substr(1);
    }
    return prefix + name;
}

module.exports = eventLoggerPlugin;

},{"./custom-listeners":9,"starlog":14}],11:[function(require,module,exports){
'use strict';

/** Creates an object with a `test` method from optional whitelist and/or blacklist
 * @constructor
 * @param {object} [options] - If neither `white` nor `black` are given, all strings pass `test`.
 * @param [options.white] - If given, only listed strings pass `test`.
 * @param [options.black] - If given, listed strings fail `test`.
 */
function GreyList(options) {
    this.white = getFlatArrayOfRegexAndOrString(options && options.white);
    this.black = getFlatArrayOfRegexAndOrString(options && options.black);
}

GreyList.prototype.test = function(string) {
    this.string = string; // for match() use
    return (
        !(this.white && !this.white.some(match, this)) &&
        !(this.black && this.black.some(match, this))
    );
};

function match(pattern) {
    return typeof pattern.test === 'function'
        ? pattern.test(this.string) // typically a regex but could be anything that implements `test`
        : this.string === pattern + ''; // convert pattern to string even for edge cases
}

function getFlatArrayOfRegexAndOrString(array, flat) {
    if (!flat) {
        // this is the top-level (non-recursed) call so intialize:

        // `undefined` passes through without being converted to an array
        if (array === undefined) {
            return;
        }

        // arrayify given scalar string, regex, or object
        if (!Array.isArray(array)) {
            array = [array];
        }

        // initialize flat
        flat = [];
    }

    array.forEach(function (item) {
        // make sure all elements are either string or RegExp
        switch (Object.prototype.toString.call(item)) {
            case '[object String]':
            case '[object RegExp]':
                flat.push(item);
                break;
            case '[object Object]':
                // recurse on complex item (when an object or array)
                if (!Array.isArray(item)) {
                    // convert object into an array (of it's enumerable keys, but only when not undefined)
                    item = Object.keys(item).filter(function (key) { return item[key] !== undefined; });
                }
                getFlatArrayOfRegexAndOrString(item, flat);
                break;
            default:
                flat.push(item + ''); // convert to string
        }
    });

    return flat;
}

module.exports = GreyList;
},{}],12:[function(require,module,exports){
'use strict';

/**
 * @summary Find all pattern matches, return specified capture group for each.
 * @returns {string[]} An array containing all the pattern matches found in `string`.
 * The entire pattern match is returned unless the pattern contains one or more subgroups in which case the portion of the pattern matched by the last subgroup is returned unless `captureGroup` is defined.
 * @param {string} string
 * @param {RegExp} regex - Don't use global flag; it's unnecessary and suppresses submatches of capture groups.
 * @param {number} [captureGroup] - Iff defined, index of a specific capture group to return.
 */
module.exports = function(string, regex, captureGroup) {
    var matches = [];

    for (var match, i = 0; (match = string.substr(i).match(regex)); i += match.index + match[0].length) {
        matches.push(match[captureGroup === undefined ? match.length - 1 : captureGroup]);
    }

    return matches;
};

},{}],13:[function(require,module,exports){
'use strict';

var Greylist = require('greylist');

/** @summary Catalog the execution context object.
 * @returns {object} An object containing a member for each member of the execution context object
 * visible in the prototype chain (back to but not including Object), per whitelist and blacklist.
 * Each member's value is the object in the prototype chain where found.
 * @param [options]
 * @param {boolean} [options.own] - Restrict search for event type strings to own methods rather than entire prototype chain.
 * @param [options.greylist]
 * @param [options.greylist.white] - If given, only listed members are cataloged.
 * @param [options.greylist.black] - If given, listed members are *not* cataloged.
 */
module.exports = function objectCatalog(options) {
    options = options || {};

    var obj,
        catalog = Object.create(null), // KISS no prototype needed
        walkPrototypeChain = !options.own,
        greylist = new Greylist(options.greylist);

    for (obj = this; obj && obj !== Object.prototype; obj = walkPrototypeChain && Object.getPrototypeOf(obj)) {
        Object.getOwnPropertyNames(obj).forEach(function(key) {
            if (
                !(key in catalog) && // not shadowed by a member of a descendant object
                greylist.test(key) &&
                Object.getOwnPropertyDescriptor(obj, key).value !== objectCatalog
            ) {
                catalog[key] = obj;
            }
        });
    }

    return catalog;
};
},{"greylist":11}],14:[function(require,module,exports){
'use strict';

var match = require('code-match');

/** @typedef {object} starlogger
 * @desc An event listener for logging purposes, paired with the target(s) to listen to.
 * Each member of a logger object has the event string as its key and an object as its value.
 * @property {function} listener - A handler that logs the event.
 * @property {object|object[]} targets - A target or list of targets to attach the listener to.
 */

/** @typedef {object|object[]} eventTargets
 * Event target object(s) that implement `addEventListener` and `removeEventListener`,
 * typically a DOM node, but by no means limited to such.
 */

/** @typedef {string} eventType */

/** @typedef {object} starlogOptions
 *
 * @desc Must define `loggers`, `events`, or `pattern` and `select`; else error is thrown.
 *
 * @param {Object.<eventType, starlogger>} [loggers] - Logger dictionary.
 * @param {string[]} [events] - List of event strings from which to build a logger dictionary.
 * @param {object|object[]} [select] - Object or list of objects in which to search with `pattern`.
 * @param {RegExp} [pattern] - Event string pattern to search for in all visible getters, setters, and methods.
 * The results of the search are used to build a logger dictionary.
 * Example: `/'(fin-[a-z-]+)'/` means find all strings like `'fin-*'`, returning only the part inside the quotes.
 * See the README for additional examples.
 *
 * @param {function} [log] - Override {@link Starlog#log}.
 * @param {function} [listener] - Override {@link Starlog#listener}.
 * @param {object} [targets] - Override {@link Starlog#targets}.
 *
 * @param {Object.<eventType, function>} [listenerDictionary={}] - Custom listeners to override default listener.
 * @param {Object.<eventType, eventTargets>} [targetsDictionary={}] - Custom event target object(s) to override default targets.
 *
 * @param {object} [match] - https://github.com/joneit/code-match
 * @param {number} [match.captureGroup] - Iff defined, index of a specific capture group to return for each match.
 * @param {object} [match.greylist] - https://github.com/joneit/greylist
 * @param [match.greylist.white] - If given, only listed matches are included in the results.
 * @param [match.greylist.black] - If given, listed matches are excluded from the results.
 *
 * @param {object} [match.catalog] - https://github.com/joneit/object-catalog
 * @param {boolean} [match.catalog.own] - Only search own methods for event strings; otherwise entire prototype chain.
 * @param {object} [match.catalog.greylist] - https://github.com/joneit/greylist
 * @param [match.catalog.greylist.white] - If given, only listed members are cataloged.
 * @param [match.catalog.greylist.black] - If given, listed members are *not* cataloged.
 */

/**
 * @constructor
 * @summary Instance a logger.
 * @desc Consumes `options`, creating a dictionary of event strings in `this.events`.
 *
 * Sources for loggers:
 * * If `options.loggers` dictionary object is defined, deep clone it and make sure all members are logger objects, defaulting any missing members.
 * * Else if `options.events` (list of event strings) is defined, create an object with those keys, listeners, and targets.
 * * Else if `options.pattern` is defined, code found in the execution context object is searched for event strings that match it (per `options.match`).
 *
 * Events specified with `options.events` and `options.pattern` log using the default listener and event targets:
 * * `StarLog.prototype.listener`, unless overridden, just calls `this.log()` with the event string, which is sufficient for casual usage.
 * Override it by defining `options.listener` or directly by reassigning to `StarLog.prototype.listener` before instantiation.
 * * `StarLog.prototype.targets`, unless overridden, is `window.document` (when available),
 * which is only really useful if the event is dispatched directly to (or is allowed to bubble up to) `document`.
 * Override it by defining `options.targets` or directly by reassigning to `StarLog.prototype.targets` before instantiation.
 *
 * Events specified with `options.loggers` can each specify their own listener and/or targets, but if not specified, they too will also use the above defaults.
 *
 * @param {starlogOptions} [options]
 */
function StarLog(options) {
    options = options || {};

    // Override prototype definitions if and only if supplied in options
    ['log', 'targets', 'listener'].forEach(function(key) {
        if (options[key]) { this[key] = options[key]; }
    }, this);

    var defaultTarget = options.targets || this.targets,
        defaultListener = options.listener || this.listener,
        listenerDictionary = options.listenerDictionary || {},
        targetsDictionary = options.targetsDictionary || {},
        loggers = options.loggers,
        eventStrings;

    if (loggers) {
        eventStrings = Object.keys(loggers);
    } else if (options.events) {
        loggers = {};
        eventStrings = options.events;
    } else if (options.pattern && options.select) {
        loggers = {};
        eventStrings = arrayify(options.select).reduce(function(matches, object) {
            match.call(object, options.pattern, options.match).forEach(function (match) {
                if (matches.indexOf(match) < 0) {
                    matches.push(match);
                }
            });
            return matches;
        }, []);
    } else {
        throw new Error('Expected `options.loggers`, `options.events`, or `options.pattern` and `options.select` to be defined.');
    }

    var starlog = this;

    /**
     * Dictionary of event strings with listener and target(s).
     * @type {Object.<eventType, starlogger>}
     */
    this.events = eventStrings.reduce(function(clone, eventString) {
        var logger = Object.assign({}, loggers[eventString]); // clone each logger

        // bind the listener to starlog for `this.log` access to Starlog#log from within listener
        logger.listener = (logger.listener || listenerDictionary[eventString] || defaultListener).bind(starlog);
        logger.targets = arrayify(logger.targets || targetsDictionary[eventString] || defaultTarget);

        clone[eventString] = logger;

        return clone;
    }, {});
}

StarLog.prototype = {
    constructor: StarLog.prototype.constructor,

    /**
     * @type {function}
     * @default console.log.bind(console)
     */
    log: console.log.bind(console),

    /**
     * @type {function}
     * @default function(e) { this.log(e.type); };
     */
    listener: function(e) {
        this.log(e.type);
    },

    /**
     * @type {object}
     * @default window.document
     */
    targets: typeof window === 'object' && window.document,

    /**
     * @method Starlog#start
     * @summary Start logging events.
     * @desc Add new event listeners for logging purposes.
     * Old event listeners, if any, are removed first, before adding new ones.
     */
    start: function () {
        this.stop();
        eventListener(this.events, 'add');
    },

    /**
     * @method Starlog#stop
     * @summary Stop logging events.
     * @desc Event listeners are removed from targets and deleted.
     */
    stop: function () {
        eventListener(this.events, 'remove');
    }
};

function eventListener(dictionary, methodPrefix) {
    if (!dictionary) {
        return;
    }

    var method = methodPrefix + 'EventListener';

    Object.keys(dictionary).forEach(function(eventType) {
        var eventLogger = dictionary[eventType];
        eventLogger.targets.forEach(function(target) {
            target[method](eventType, eventLogger.listener);
        });
    });
}

function arrayify(x) {
    return Array.isArray(x) ? x : [x];
}

module.exports = StarLog;
},{"code-match":8}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZW1vL2pzL2RlbW8vY2VsbEVkaXRvcnMuanMiLCJkZW1vL2pzL2RlbW8vY2VsbHJlbmRlcmVycy5qcyIsImRlbW8vanMvZGVtby9kYXNoYm9hcmQuanMiLCJkZW1vL2pzL2RlbW8vZXZlbnRzLmpzIiwiZGVtby9qcy9kZW1vL2Zvcm1hdHRlcnMuanMiLCJkZW1vL2pzL2RlbW8vaW5kZXguanMiLCJkZW1vL2pzL2RlbW8vc2V0U3RhdGUuanMiLCJub2RlX21vZHVsZXMvY29kZS1tYXRjaC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9maW4taHlwZXJncmlkLWV2ZW50LWxvZ2dlci9jdXN0b20tbGlzdGVuZXJzLmpzIiwibm9kZV9tb2R1bGVzL2Zpbi1oeXBlcmdyaWQtZXZlbnQtbG9nZ2VyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dyZXlsaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21hdGNoLXBvaW50L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1jYXRhbG9nL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N0YXJsb2cvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIHZhciBpZHggPSBncmlkLmJlaGF2aW9yLmNvbHVtbkVudW07XG5cbiAgICB2YXIgQ2VsbEVkaXRvciA9IGdyaWQuY2VsbEVkaXRvcnMuQmFzZUNsYXNzO1xuICAgIHZhciBUZXh0ZmllbGQgPSBncmlkLmNlbGxFZGl0b3JzLmdldCgndGV4dGZpZWxkJyk7XG5cbiAgICB2YXIgQ29sb3JUZXh0ID0gVGV4dGZpZWxkLmV4dGVuZCgnY29sb3JUZXh0Jywge1xuICAgICAgICB0ZW1wbGF0ZTogJzxpbnB1dCB0eXBlPVwidGV4dFwiIGxhbmc9XCJ7e2xvY2FsZX19XCIgc3R5bGU9XCJjb2xvcjp7e3RleHRDb2xvcn19XCI+J1xuICAgIH0pO1xuXG4gICAgZ3JpZC5jZWxsRWRpdG9ycy5hZGQoQ29sb3JUZXh0KTtcblxuICAgIHZhciBUaW1lID0gVGV4dGZpZWxkLmV4dGVuZCgnVGltZScsIHtcbiAgICAgICAgdGVtcGxhdGU6IFtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiaHlwZXJncmlkLXRleHRmaWVsZFwiIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodDtcIj4nLFxuICAgICAgICAgICAgJyAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBsYW5nPVwie3tsb2NhbGV9fVwiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDsgd2lkdGg6NzUlOyB0ZXh0LWFsaWduOnJpZ2h0OyBib3JkZXI6MDsgcGFkZGluZzowOyBvdXRsaW5lOjA7IGZvbnQtc2l6ZTppbmhlcml0OyBmb250LXdlaWdodDppbmhlcml0OycgK1xuICAgICAgICAgICAgJ3t7c3R5bGV9fVwiPicsXG4gICAgICAgICAgICAnICAgIDxzcGFuPkFNPC9zcGFuPicsXG4gICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICBdLmpvaW4oJ1xcbicpLFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dCA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcbiAgICAgICAgICAgIHRoaXMubWVyaWRpYW4gPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKTtcblxuICAgICAgICAgICAgLy8gRmxpcCBBTS9QTSBvbiBhbnkgY2xpY2tcbiAgICAgICAgICAgIHRoaXMuZWwub25jbGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQgPSB0aGlzLm1lcmlkaWFuLnRleHRDb250ZW50ID09PSAnQU0nID8gJ1BNJyA6ICdBTSc7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgICAgICB0aGlzLmlucHV0Lm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gaWdub3JlIGNsaWNrcyBpbiB0aGUgdGV4dCBmaWVsZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQub25mb2N1cyA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICAgICAgdGhpcy5lbC5zdHlsZS5vdXRsaW5lID0gdGhpcy5vdXRsaW5lID0gdGhpcy5vdXRsaW5lIHx8IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCkub3V0bGluZTtcbiAgICAgICAgICAgICAgICB0YXJnZXQuc3R5bGUub3V0bGluZSA9IDA7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgICAgICB0aGlzLmlucHV0Lm9uYmx1ciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsLnN0eWxlLm91dGxpbmUgPSAwO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldEVkaXRvclZhbHVlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgQ2VsbEVkaXRvci5wcm90b3R5cGUuc2V0RWRpdG9yVmFsdWUuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSB0aGlzLmlucHV0LnZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICAgICAgICB0aGlzLmlucHV0LnZhbHVlID0gcGFydHNbMF07XG4gICAgICAgICAgICB0aGlzLm1lcmlkaWFuLnRleHRDb250ZW50ID0gcGFydHNbMV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RWRpdG9yVmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IENlbGxFZGl0b3IucHJvdG90eXBlLmdldEVkaXRvclZhbHVlLmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICAgICAgaWYgKHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQgPT09ICdQTScpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSArPSBkZW1vLk5PT047XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGdyaWQuY2VsbEVkaXRvcnMuYWRkKFRpbWUpO1xuXG4gICAgLy8gVXNlZCBieSB0aGUgY2VsbFByb3ZpZGVyLlxuICAgIC8vIGBudWxsYCBtZWFucyBjb2x1bW4ncyBkYXRhIGNlbGxzIGFyZSBub3QgZWRpdGFibGUuXG4gICAgdmFyIGVkaXRvclR5cGVzID0gW1xuICAgICAgICBudWxsLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgJ3RleHRmaWVsZCcsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICBudWxsLFxuICAgICAgICAndGltZScsXG4gICAgICAgICdjaG9pY2UnLFxuICAgICAgICAnY2hvaWNlJyxcbiAgICAgICAgJ2Nob2ljZScsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgJ3RleHRmaWVsZCdcbiAgICBdO1xuXG4gICAgLy8gT3ZlcnJpZGUgdG8gYXNzaWduIHRoZSB0aGUgY2VsbCBlZGl0b3JzLlxuICAgIGdyaWQuYmVoYXZpb3IuZGF0YU1vZGVsLmdldENlbGxFZGl0b3JBdCA9IGZ1bmN0aW9uKHgsIHksIGRlY2xhcmVkRWRpdG9yTmFtZSwgY2VsbEV2ZW50KSB7XG4gICAgICAgIHZhciBlZGl0b3JOYW1lID0gZGVjbGFyZWRFZGl0b3JOYW1lIHx8IGVkaXRvclR5cGVzW3ggJSBlZGl0b3JUeXBlcy5sZW5ndGhdO1xuXG4gICAgICAgIHN3aXRjaCAoeCkge1xuICAgICAgICAgICAgY2FzZSBpZHguYmlydGhTdGF0ZTpcbiAgICAgICAgICAgICAgICBjZWxsRXZlbnQudGV4dENvbG9yID0gJ3JlZCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2VsbEVkaXRvciA9IGdyaWQuY2VsbEVkaXRvcnMuY3JlYXRlKGVkaXRvck5hbWUsIGNlbGxFdmVudCk7XG5cbiAgICAgICAgaWYgKGNlbGxFZGl0b3IpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoeCkge1xuICAgICAgICAgICAgICAgIGNhc2UgaWR4LmVtcGxveWVkOlxuICAgICAgICAgICAgICAgICAgICBjZWxsRWRpdG9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIGlkeC50b3RhbE51bWJlck9mUGV0c093bmVkOlxuICAgICAgICAgICAgICAgICAgICBjZWxsRWRpdG9yLmlucHV0LnNldEF0dHJpYnV0ZSgnbWluJywgMCk7XG4gICAgICAgICAgICAgICAgICAgIGNlbGxFZGl0b3IuaW5wdXQuc2V0QXR0cmlidXRlKCdtYXgnLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIGNlbGxFZGl0b3IuaW5wdXQuc2V0QXR0cmlidXRlKCdzdGVwJywgMC4wMSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNlbGxFZGl0b3I7XG4gICAgfTtcbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIHZhciBpZHggPSBncmlkLmJlaGF2aW9yLmNvbHVtbkVudW07XG5cbiAgICAvL0dFVCBDRUxMXG4gICAgLy9hbGwgZm9ybWF0dGluZyBhbmQgcmVuZGVyaW5nIHBlciBjZWxsIGNhbiBiZSBvdmVycmlkZGVuIGluIGhlcmVcbiAgICBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbC5nZXRDZWxsID0gZnVuY3Rpb24oY29uZmlnLCByZW5kZXJlck5hbWUpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5pc1VzZXJEYXRhQXJlYSkge1xuICAgICAgICAgICAgdmFyIG4sIGhleCwgdHJhdmVsLFxuICAgICAgICAgICAgICAgIGNvbEluZGV4ID0gY29uZmlnLmRhdGFDZWxsLngsXG4gICAgICAgICAgICAgICAgcm93SW5kZXggPSBjb25maWcuZGF0YUNlbGwueTtcblxuICAgICAgICAgICAgaWYgKGRlbW8uc3R5bGVSb3dzRnJvbURhdGEpIHtcbiAgICAgICAgICAgICAgICBuID0gZ3JpZC5iZWhhdmlvci5nZXRDb2x1bW4oaWR4LnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQpLmdldFZhbHVlKHJvd0luZGV4KTtcbiAgICAgICAgICAgICAgICBoZXggPSAoMTU1ICsgMTAgKiAobiAlIDExKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IgPSAnIycgKyBoZXggKyBoZXggKyBoZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAoY29sSW5kZXgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIGlkeC5sYXN0TmFtZTpcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLmNvbG9yID0gY29uZmlnLnZhbHVlICE9IG51bGwgJiYgKGNvbmZpZy52YWx1ZSArICcnKVswXSA9PT0gJ1MnID8gJ3JlZCcgOiAnIzE5MTkxOSc7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5saW5rID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIGlkeC5pbmNvbWU6XG4gICAgICAgICAgICAgICAgICAgIHRyYXZlbCA9IDYwO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgaWR4LnRyYXZlbDpcbiAgICAgICAgICAgICAgICAgICAgdHJhdmVsID0gMTA1O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRyYXZlbCkge1xuICAgICAgICAgICAgICAgIHRyYXZlbCArPSBNYXRoLnJvdW5kKGNvbmZpZy52YWx1ZSAqIDE1MCAvIDEwMDAwMCk7XG4gICAgICAgICAgICAgICAgY29uZmlnLmJhY2tncm91bmRDb2xvciA9ICcjMDAnICsgdHJhdmVsLnRvU3RyaW5nKDE2KSArICcwMCc7XG4gICAgICAgICAgICAgICAgY29uZmlnLmNvbG9yID0gJyNGRkZGRkYnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL1Rlc3RpbmdcbiAgICAgICAgICAgIGlmIChjb2xJbmRleCA9PT0gaWR4LnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQpIHtcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIEJlIHN1cmUgdG8gYWRqdXN0IHRoZSBkYXRhIHNldCB0byB0aGUgYXBwcm9wcmlhdGUgdHlwZSBhbmQgc2hhcGUgaW4gd2lkZWRhdGEuanNcbiAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHNpbXBsZUNlbGw7IC8vV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBlbXB0eUNlbGw7IC8vV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBidXR0b25DZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gZXJyb3JDZWxsOyAvL1dPUktTOiBOb3RlZCB0aGF0IGFueSBlcnJvciBpbiB0aGlzIGZ1bmN0aW9uIHN0ZWFscyB0aGUgbWFpbiB0aHJlYWQgYnkgcmVjdXJzaW9uXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gc3BhcmtMaW5lQ2VsbDsgLy8gV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBzcGFya0JhckNlbGw7IC8vV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBzbGlkZXJDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gdHJlZUNlbGw7IC8vTmVlZCB0byBmaWd1cmUgb3V0IGRhdGEgc2hhcGUgdG8gdGVzdFxuXG5cbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIFRlc3Qgb2YgQ3VzdG9taXplZCBSZW5kZXJlclxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIC8vIGlmIChzdGFycnkpe1xuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuZG9tYWluID0gNTsgLy8gZGVmYXVsdCBpcyAxMDBcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLnNpemVGYWN0b3IgPSAgMC42NTsgLy8gZGVmYXVsdCBpcyAwLjY1OyBzaXplIG9mIHN0YXJzIGFzIGZyYWN0aW9uIG9mIGhlaWdodCBvZiBjZWxsXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5kYXJrZW5GYWN0b3IgPSAwLjc1OyAvLyBkZWZhdWx0IGlzIDAuNzU7IHN0YXIgc3Ryb2tlIGNvbG9yIGFzIGZyYWN0aW9uIG9mIHN0YXIgZmlsbCBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuY29sb3IgPSAnZ29sZCc7IC8vIGRlZmF1bHQgaXMgJ2dvbGQnOyBzdGFyIGZpbGwgY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmZnQ29sb3IgPSAgJ2dyZXknOyAvLyBkZWZhdWx0IGlzICd0cmFuc3BhcmVudCcgKG5vdCByZW5kZXJlZCk7IHRleHQgY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmZnU2VsQ29sb3IgPSAneWVsbG93JzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyB0ZXh0IHNlbGVjdGlvbiBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuYmdDb2xvciA9ICcjNDA0MDQwJzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyBiYWNrZ3JvdW5kIGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5iZ1NlbENvbG9yID0gJ2dyZXknOyAvLyBkZWZhdWx0IGlzICd0cmFuc3BhcmVudCcgKG5vdCByZW5kZXJlZCk7IGJhY2tncm91bmQgc2VsZWN0aW9uIGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5zaGFkb3dDb2xvciA9ICd0cmFuc3BhcmVudCc7IC8vIGRlZmF1bHQgaXMgJ3RyYW5zcGFyZW50J1xuICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gc3RhcnJ5O1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBncmlkLmNlbGxSZW5kZXJlcnMuZ2V0KHJlbmRlcmVyTmFtZSk7XG4gICAgfTtcblxuICAgIC8vRU5EIE9GIEdFVCBDRUxMXG5cblxuICAgIC8vIENVU1RPTSBDRUxMIFJFTkRFUkVSXG5cbiAgICB2YXIgUkVHRVhQX0NTU19IRVg2ID0gL14jKC4uKSguLikoLi4pJC8sXG4gICAgICAgIFJFR0VYUF9DU1NfUkdCID0gL15yZ2JhXFwoKFxcZCspLChcXGQrKSwoXFxkKyksXFxkK1xcKSQvO1xuXG4gICAgZnVuY3Rpb24gcGFpbnRTcGFya1JhdGluZyhnYywgY29uZmlnKSB7XG4gICAgICAgIHZhciB4ID0gY29uZmlnLmJvdW5kcy54LFxuICAgICAgICAgICAgeSA9IGNvbmZpZy5ib3VuZHMueSxcbiAgICAgICAgICAgIHdpZHRoID0gY29uZmlnLmJvdW5kcy53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCA9IGNvbmZpZy5ib3VuZHMuaGVpZ2h0LFxuICAgICAgICAgICAgb3B0aW9ucyA9IGNvbmZpZy52YWx1ZSxcbiAgICAgICAgICAgIGRvbWFpbiA9IG9wdGlvbnMuZG9tYWluIHx8IGNvbmZpZy5kb21haW4gfHwgMTAwLFxuICAgICAgICAgICAgc2l6ZUZhY3RvciA9IG9wdGlvbnMuc2l6ZUZhY3RvciB8fCBjb25maWcuc2l6ZUZhY3RvciB8fCAwLjY1LFxuICAgICAgICAgICAgZGFya2VuRmFjdG9yID0gb3B0aW9ucy5kYXJrZW5GYWN0b3IgfHwgY29uZmlnLmRhcmtlbkZhY3RvciB8fCAwLjc1LFxuICAgICAgICAgICAgY29sb3IgPSBvcHRpb25zLmNvbG9yIHx8IGNvbmZpZy5jb2xvciB8fCAnZ29sZCcsXG4gICAgICAgICAgICBzdHJva2UgPSB0aGlzLnN0cm9rZSA9IGNvbG9yID09PSB0aGlzLmNvbG9yID8gdGhpcy5zdHJva2UgOiBnZXREYXJrZW5lZENvbG9yKGdjLCB0aGlzLmNvbG9yID0gY29sb3IsIGRhcmtlbkZhY3RvciksXG4gICAgICAgICAgICAvLyBiZ0NvbG9yID0gY29uZmlnLmlzU2VsZWN0ZWQgPyAob3B0aW9ucy5iZ1NlbENvbG9yIHx8IGNvbmZpZy5iZ1NlbENvbG9yKSA6IChvcHRpb25zLmJnQ29sb3IgfHwgY29uZmlnLmJnQ29sb3IpLFxuICAgICAgICAgICAgZmdDb2xvciA9IGNvbmZpZy5pc1NlbGVjdGVkID8gKG9wdGlvbnMuZmdTZWxDb2xvciB8fCBjb25maWcuZmdTZWxDb2xvcikgOiAob3B0aW9ucy5mZ0NvbG9yIHx8IGNvbmZpZy5mZ0NvbG9yKSxcbiAgICAgICAgICAgIHNoYWRvd0NvbG9yID0gb3B0aW9ucy5zaGFkb3dDb2xvciB8fCBjb25maWcuc2hhZG93Q29sb3IgfHwgJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgIC8vIGZvbnQgPSBvcHRpb25zLmZvbnQgfHwgY29uZmlnLmZvbnQgfHwgJzExcHggdmVyZGFuYScsXG4gICAgICAgICAgICBtaWRkbGUgPSBoZWlnaHQgLyAyLFxuICAgICAgICAgICAgZGlhbWV0ZXIgPSBzaXplRmFjdG9yICogaGVpZ2h0LFxuICAgICAgICAgICAgb3V0ZXJSYWRpdXMgPSBzaXplRmFjdG9yICogbWlkZGxlLFxuICAgICAgICAgICAgdmFsID0gTnVtYmVyKG9wdGlvbnMudmFsKSxcbiAgICAgICAgICAgIHBvaW50cyA9IHRoaXMucG9pbnRzO1xuXG4gICAgICAgIGlmICghcG9pbnRzKSB7XG4gICAgICAgICAgICB2YXIgaW5uZXJSYWRpdXMgPSAzIC8gNyAqIG91dGVyUmFkaXVzO1xuICAgICAgICAgICAgcG9pbnRzID0gdGhpcy5wb2ludHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSA1LCBwaSA9IE1hdGguUEkgLyAyLCBpbmNyID0gTWF0aC5QSSAvIDU7IGk7IC0taSwgcGkgKz0gaW5jcikge1xuICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgeDogb3V0ZXJSYWRpdXMgKiBNYXRoLmNvcyhwaSksXG4gICAgICAgICAgICAgICAgICAgIHk6IG1pZGRsZSAtIG91dGVyUmFkaXVzICogTWF0aC5zaW4ocGkpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcGkgKz0gaW5jcjtcbiAgICAgICAgICAgICAgICBwb2ludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHg6IGlubmVyUmFkaXVzICogTWF0aC5jb3MocGkpLFxuICAgICAgICAgICAgICAgICAgICB5OiBtaWRkbGUgLSBpbm5lclJhZGl1cyAqIE1hdGguc2luKHBpKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9pbnRzLnB1c2gocG9pbnRzWzBdKTsgLy8gY2xvc2UgdGhlIHBhdGhcbiAgICAgICAgfVxuXG4gICAgICAgIGdjLmNhY2hlLnNoYWRvd0NvbG9yID0gJ3RyYW5zcGFyZW50JztcblxuICAgICAgICBnYy5jYWNoZS5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgIGdjLmJlZ2luUGF0aCgpO1xuICAgICAgICBmb3IgKHZhciBqID0gNSwgc3ggPSB4ICsgNSArIG91dGVyUmFkaXVzOyBqOyAtLWosIHN4ICs9IGRpYW1ldGVyKSB7XG4gICAgICAgICAgICBwb2ludHMuZm9yRWFjaChmdW5jdGlvbihwb2ludCwgaW5kZXgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgICAgIGdjW2luZGV4ID8gJ2xpbmVUbycgOiAnbW92ZVRvJ10oc3ggKyBwb2ludC54LCB5ICsgcG9pbnQueSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgIH0pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgIH1cbiAgICAgICAgZ2MuY2xvc2VQYXRoKCk7XG5cbiAgICAgICAgdmFsID0gdmFsIC8gZG9tYWluICogNTtcblxuICAgICAgICBnYy5jYWNoZS5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgICAgZ2Muc2F2ZSgpO1xuICAgICAgICBnYy5jbGlwKCk7XG4gICAgICAgIGdjLmZpbGxSZWN0KHggKyA1LCB5LFxuICAgICAgICAgICAgKE1hdGguZmxvb3IodmFsKSArIDAuMjUgKyB2YWwgJSAxICogMC41KSAqIGRpYW1ldGVyLCAvLyBhZGp1c3Qgd2lkdGggdG8gc2tpcCBvdmVyIHN0YXIgb3V0bGluZXMgYW5kIGp1c3QgbWV0ZXIgdGhlaXIgaW50ZXJpb3JzXG4gICAgICAgICAgICBoZWlnaHQpO1xuICAgICAgICBnYy5yZXN0b3JlKCk7IC8vIHJlbW92ZSBjbGlwcGluZyByZWdpb25cblxuICAgICAgICBnYy5jYWNoZS5zdHJva2VTdHlsZSA9IHN0cm9rZTtcbiAgICAgICAgZ2MuY2FjaGUubGluZVdpZHRoID0gMTtcbiAgICAgICAgZ2Muc3Ryb2tlKCk7XG5cbiAgICAgICAgaWYgKGZnQ29sb3IgJiYgZmdDb2xvciAhPT0gJ3RyYW5zcGFyZW50Jykge1xuICAgICAgICAgICAgZ2MuY2FjaGUuZmlsbFN0eWxlID0gZmdDb2xvcjtcbiAgICAgICAgICAgIGdjLmNhY2hlLmZvbnQgPSAnMTFweCB2ZXJkYW5hJztcbiAgICAgICAgICAgIGdjLmNhY2hlLnRleHRBbGlnbiA9ICdyaWdodCc7XG4gICAgICAgICAgICBnYy5jYWNoZS50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICAgICAgICAgIGdjLmNhY2hlLnNoYWRvd0NvbG9yID0gc2hhZG93Q29sb3I7XG4gICAgICAgICAgICBnYy5jYWNoZS5zaGFkb3dPZmZzZXRYID0gZ2MuY2FjaGUuc2hhZG93T2Zmc2V0WSA9IDE7XG4gICAgICAgICAgICBnYy5maWxsVGV4dCh2YWwudG9GaXhlZCgxKSwgeCArIHdpZHRoICsgMTAsIHkgKyBoZWlnaHQgLyAyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldERhcmtlbmVkQ29sb3IoZ2MsIGNvbG9yLCBmYWN0b3IpIHtcbiAgICAgICAgdmFyIHJnYmEgPSBnZXRSR0JBKGdjLCBjb2xvcik7XG4gICAgICAgIHJldHVybiAncmdiYSgnICsgTWF0aC5yb3VuZChmYWN0b3IgKiByZ2JhWzBdKSArICcsJyArIE1hdGgucm91bmQoZmFjdG9yICogcmdiYVsxXSkgKyAnLCcgKyBNYXRoLnJvdW5kKGZhY3RvciAqIHJnYmFbMl0pICsgJywnICsgKHJnYmFbM10gfHwgMSkgKyAnKSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UkdCQShnYywgY29sb3JTcGVjKSB7XG4gICAgICAgIC8vIE5vcm1hbGl6ZSB2YXJpZXR5IG9mIENTUyBjb2xvciBzcGVjIHN5bnRheGVzIHRvIG9uZSBvZiB0d29cbiAgICAgICAgZ2MuY2FjaGUuZmlsbFN0eWxlID0gY29sb3JTcGVjO1xuXG4gICAgICAgIHZhciByZ2JhID0gY29sb3JTcGVjLm1hdGNoKFJFR0VYUF9DU1NfSEVYNik7XG4gICAgICAgIGlmIChyZ2JhKSB7XG4gICAgICAgICAgICByZ2JhLnNoaWZ0KCk7IC8vIHJlbW92ZSB3aG9sZSBtYXRjaFxuICAgICAgICAgICAgcmdiYS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZ2JhW2luZGV4XSA9IHBhcnNlSW50KHZhbCwgMTYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZ2JhID0gY29sb3JTcGVjLm1hdGNoKFJFR0VYUF9DU1NfUkdCKTtcbiAgICAgICAgICAgIGlmICghcmdiYSkge1xuICAgICAgICAgICAgICAgIHRocm93ICdVbmV4cGVjdGVkIGZvcm1hdCBnZXR0aW5nIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC5maWxsU3R5bGUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmdiYS5zaGlmdCgpOyAvLyByZW1vdmUgd2hvbGUgbWF0Y2hcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZ2JhO1xuICAgIH1cblxuXG4gICAgLy9FeHRlbmQgSHlwZXJHcmlkJ3MgYmFzZSBSZW5kZXJlclxuICAgIHZhciBzcGFya1N0YXJSYXRpbmdSZW5kZXJlciA9IGdyaWQuY2VsbFJlbmRlcmVycy5CYXNlQ2xhc3MuZXh0ZW5kKHtcbiAgICAgICAgcGFpbnQ6IHBhaW50U3BhcmtSYXRpbmdcbiAgICB9KTtcblxuICAgIC8vUmVnaXN0ZXIgeW91ciByZW5kZXJlclxuICAgIGdyaWQuY2VsbFJlbmRlcmVycy5hZGQoJ1N0YXJyeScsIHNwYXJrU3RhclJhdGluZ1JlbmRlcmVyKTtcblxuICAgIC8vIEVORCBPRiBDVVNUT00gQ0VMTCBSRU5ERVJFUlxuICAgIHJldHVybiBncmlkO1xufTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKiBnbG9iYWxzIHBlb3BsZTEsIHBlb3BsZTIgKi9cblxuLyogZXNsaW50LWRpc2FibGUgbm8tYWxlcnQgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBTb21lIERPTSBzdXBwb3J0IGZ1bmN0aW9ucy4uLlxuLy8gQmVzaWRlcyB0aGUgY2FudmFzLCB0aGlzIHRlc3QgaGFybmVzcyBvbmx5IGhhcyBhIGhhbmRmdWwgb2YgYnV0dG9ucyBhbmQgY2hlY2tib3hlcy5cbi8vIFRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIHNlcnZpY2UgdGhlc2UgY29udHJvbHMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVtbywgZ3JpZCkge1xuXG4gICAgLy8gbWFrZSBidXR0b25zIGRpdiBhYnNvbHV0ZSBzbyBidXR0b25zIHdpZHRoIG9mIDEwMCUgZG9lc24ndCBzdHJldGNoIHRvIHdpZHRoIG9mIGRhc2hib2FyZFxuICAgIHZhciBjdHJsR3JvdXBzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N0cmwtZ3JvdXBzJyksXG4gICAgICAgIGRhc2hib2FyZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkYXNoYm9hcmQnKSxcbiAgICAgICAgYnV0dG9ucyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidXR0b25zJyk7XG5cbiAgICBjdHJsR3JvdXBzLnN0eWxlLnRvcCA9IGN0cmxHcm91cHMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgJ3B4JztcbiAgICAvL2J1dHRvbnMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGRhc2hib2FyZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgZnVuY3Rpb24gdG9nZ2xlUm93U3R5bGluZ01ldGhvZCgpIHtcbiAgICAgICAgZGVtby5zdHlsZVJvd3NGcm9tRGF0YSA9ICFkZW1vLnN0eWxlUm93c0Zyb21EYXRhO1xuICAgIH1cblxuICAgIC8vIExpc3Qgb2YgcHJvcGVydGllcyB0byBzaG93IGFzIGNoZWNrYm94ZXMgaW4gdGhpcyBkZW1vJ3MgXCJkYXNoYm9hcmRcIlxuICAgIHZhciB0b2dnbGVQcm9wcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdSb3cgc3R5bGluZycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnKEdsb2JhbCBzZXR0aW5nKScsIGxhYmVsOiAnYmFzZSBvbiBkYXRhJywgc2V0dGVyOiB0b2dnbGVSb3dTdHlsaW5nTWV0aG9kfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ0NvbHVtbiBoZWFkZXIgcm93cycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnc2hvd0hlYWRlclJvdycsIGxhYmVsOiAnaGVhZGVyJ30sIC8vIGRlZmF1bHQgXCJzZXR0ZXJcIiBpcyBgc2V0UHJvcGBcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdIb3ZlciBoaWdobGlnaHRzJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge25hbWU6ICdob3ZlckNlbGxIaWdobGlnaHQuZW5hYmxlZCcsIGxhYmVsOiAnY2VsbCd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnaG92ZXJSb3dIaWdobGlnaHQuZW5hYmxlZCcsIGxhYmVsOiAncm93J30sXG4gICAgICAgICAgICAgICAge25hbWU6ICdob3ZlckNvbHVtbkhpZ2hsaWdodC5lbmFibGVkJywgbGFiZWw6ICdjb2x1bW4nfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ0xpbmsgc3R5bGUnLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2xpbmtPbkhvdmVyJywgbGFiZWw6ICdvbiBob3Zlcid9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnbGlua0NvbG9yJywgdHlwZTogJ3RleHQnLCBsYWJlbDogJ2NvbG9yJ30sXG4gICAgICAgICAgICAgICAge25hbWU6ICdsaW5rQ29sb3JPbkhvdmVyJywgbGFiZWw6ICdjb2xvciBvbiBob3Zlcid9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGxhYmVsOiAnQ2VsbCBlZGl0aW5nJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge25hbWU6ICdlZGl0YWJsZSd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnZWRpdE9uRG91YmxlQ2xpY2snLCBsYWJlbDogJ3JlcXVpcmVzIGRvdWJsZS1jbGljayd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnZWRpdE9uS2V5ZG93bicsIGxhYmVsOiAndHlwZSB0byBlZGl0J31cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbGFiZWw6ICdTZWxlY3Rpb24nLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zJywgbGFiZWw6ICdieSByb3cgaGFuZGxlcyBvbmx5Jywgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wLFxuICAgICAgICAgICAgICAgICAgICB0b29sdGlwOiAnTm90ZSB0aGF0IHdoZW4gdGhpcyBwcm9wZXJ0eSBpcyBhY3RpdmUsIGF1dG9TZWxlY3RSb3dzIHdpbGwgbm90IHdvcmsuJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge25hbWU6ICdzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlJywgbGFiZWw6ICdvbmUgcm93IGF0IGEgdGltZScsIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnIW11bHRpcGxlU2VsZWN0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnb25lIGNlbGwgcmVnaW9uIGF0IGEgdGltZScsXG4gICAgICAgICAgICAgICAgICAgIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcCxcbiAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnYXV0b1NlbGVjdFJvd3MnLCBsYWJlbDogJ2F1dG8tc2VsZWN0IHJvd3MnLCBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3AsXG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXA6ICdOb3RlczpcXG4nICtcbiAgICAgICAgICAgICAgICAgICAgJzEuIFJlcXVpcmVzIHRoYXQgY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucyBiZSBzZXQgdG8gZmFsc2UgKHNvIGNoZWNraW5nIHRoaXMgYm94IGF1dG9tYXRpY2FsbHkgdW5jaGVja3MgdGhhdCBvbmUpLlxcbicgK1xuICAgICAgICAgICAgICAgICAgICAnMi4gU2V0IHNpbmdsZVJvd1NlbGVjdGlvbk1vZGUgdG8gZmFsc2UgdG8gYWxsb3cgYXV0by1zZWxlY3Qgb2YgbXVsdGlwbGUgcm93cy4nXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2F1dG9TZWxlY3RDb2x1bW5zJywgbGFiZWw6ICdhdXRvLXNlbGVjdCBjb2x1bW5zJywgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wfVxuICAgICAgICAgICAgXVxuICAgICAgICB9XG4gICAgXTtcblxuXG4gICAgdG9nZ2xlUHJvcHMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgIGFkZFRvZ2dsZShwcm9wKTtcbiAgICB9KTtcblxuXG4gICAgW1xuICAgICAgICB7bGFiZWw6ICdUb2dnbGUgRW1wdHkgRGF0YScsIG9uY2xpY2s6IGRlbW8udG9nZ2xlRW1wdHlEYXRhfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdTZXQgRGF0YScsIG9uY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGVtby5yZXNldERhdGEoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdTZXQgRGF0YSAxICg1MDAwIHJvd3MpJywgb25jbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZW1vLnNldERhdGEocGVvcGxlMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnU2V0IERhdGEgMiAoMTAwMDAgcm93cyknLCBvbmNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRlbW8uc2V0RGF0YShwZW9wbGUyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge2xhYmVsOiAnUmVzZXQgR3JpZCcsIG9uY2xpY2s6IGRlbW8ucmVzZXR9XG5cbiAgICBdLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBpdGVtLmxhYmVsO1xuICAgICAgICBidXR0b24ub25jbGljayA9IGl0ZW0ub25jbGljaztcbiAgICAgICAgaWYgKGl0ZW0udGl0bGUpIHtcbiAgICAgICAgICAgIGJ1dHRvbi50aXRsZSA9IGl0ZW0udGl0bGU7XG4gICAgICAgIH1cbiAgICAgICAgYnV0dG9ucy5hcHBlbmRDaGlsZChidXR0b24pO1xuICAgIH0pO1xuXG5cbiAgICBmdW5jdGlvbiBhZGRUb2dnbGUoY3RybEdyb3VwKSB7XG4gICAgICAgIHZhciBpbnB1dCwgbGFiZWwsXG4gICAgICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gJ2N0cmwtZ3JvdXAnO1xuXG4gICAgICAgIGlmIChjdHJsR3JvdXAubGFiZWwpIHtcbiAgICAgICAgICAgIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBsYWJlbC5jbGFzc05hbWUgPSAndHdpc3Rlcic7XG4gICAgICAgICAgICBsYWJlbC5pbm5lckhUTUwgPSBjdHJsR3JvdXAubGFiZWw7XG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobGFiZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNob2ljZXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY2hvaWNlcy5jbGFzc05hbWUgPSAnY2hvaWNlcyc7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjaG9pY2VzKTtcblxuICAgICAgICBjdHJsR3JvdXAuY3RybHMuZm9yRWFjaChmdW5jdGlvbihjdHJsKSB7XG4gICAgICAgICAgICBpZiAoIWN0cmwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZWZlcmVuY2VFbGVtZW50LFxuICAgICAgICAgICAgICAgIHR5cGUgPSBjdHJsLnR5cGUgfHwgJ2NoZWNrYm94JyxcbiAgICAgICAgICAgICAgICB0b29sdGlwID0gJ1Byb3BlcnR5IG5hbWU6ICcgKyBjdHJsLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChjdHJsLnRvb2x0aXApIHtcbiAgICAgICAgICAgICAgICB0b29sdGlwICs9ICdcXG5cXG4nICsgY3RybC50b29sdGlwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICBpbnB1dC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgIGlucHV0LmlkID0gY3RybC5uYW1lO1xuICAgICAgICAgICAgaW5wdXQubmFtZSA9IGN0cmxHcm91cC5sYWJlbDtcblxuICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gY3RybC52YWx1ZSB8fCBnZXRQcm9wZXJ0eShjdHJsLm5hbWUpIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC5zdHlsZS53aWR0aCA9ICcyNXB4JztcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUubWFyZ2luTGVmdCA9ICc0cHgnO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC5zdHlsZS5tYXJnaW5SaWdodCA9ICc0cHgnO1xuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VFbGVtZW50ID0gaW5wdXQ7IC8vIGxhYmVsIGdvZXMgYWZ0ZXIgaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnY2hlY2tib3gnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3JhZGlvJzpcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuY2hlY2tlZCA9ICdjaGVja2VkJyBpbiBjdHJsXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGN0cmwuY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAgICAgOiBnZXRQcm9wZXJ0eShjdHJsLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VFbGVtZW50ID0gbnVsbDsgLy8gbGFiZWwgZ29lcyBiZWZvcmUgaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlucHV0Lm9uY2hhbmdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVSYWRpb0NsaWNrLmNhbGwodGhpcywgY3RybC5zZXR0ZXIgfHwgc2V0UHJvcCwgZXZlbnQpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgICAgICAgICAgbGFiZWwudGl0bGUgPSB0b29sdGlwO1xuICAgICAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgbGFiZWwuaW5zZXJ0QmVmb3JlKFxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcgJyArIChjdHJsLmxhYmVsIHx8IGN0cmwubmFtZSkpLFxuICAgICAgICAgICAgICAgIHJlZmVyZW5jZUVsZW1lbnRcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNob2ljZXMuYXBwZW5kQ2hpbGQobGFiZWwpO1xuXG4gICAgICAgICAgICBpZiAoY3RybC5uYW1lID09PSAndHJlZXZpZXcnKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwub25tb3VzZWRvd24gPSBpbnB1dC5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5wdXQuY2hlY2tlZCAmJiBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbC5zb3VyY2UuZGF0YSAhPT0gZGVtby50cmVlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0xvYWQgdHJlZSBkYXRhIGZpcnN0IChcIlNldCBEYXRhIDNcIiBidXR0b24pLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGN0cmxHcm91cHMuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICB9XG5cbiAgICAvLyByZXNldCBkYXNoYm9hcmQgY2hlY2tib3hlcyBhbmQgcmFkaW8gYnV0dG9ucyB0byBtYXRjaCBjdXJyZW50IHZhbHVlcyBvZiBncmlkIHByb3BlcnRpZXNcbiAgICBkZW1vLnJlc2V0RGFzaGJvYXJkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRvZ2dsZVByb3BzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICAgICAgcHJvcC5jdHJscy5mb3JFYWNoKGZ1bmN0aW9uKGN0cmwpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3RybCkge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGN0cmwuc2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHNldFNlbGVjdGlvblByb3A6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHNldFByb3A6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGN0cmwudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdyYWRpbyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSBjdHJsLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9sYXJpdHkgPSAoaWRbMF0gPT09ICchJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuY2hlY2tlZCA9IGdldFByb3BlcnR5KGlkKSBeIHBvbGFyaXR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZ2V0UHJvcGVydHkoa2V5KSB7XG4gICAgICAgIHZhciBrZXlzID0ga2V5LnNwbGl0KCcuJyk7XG4gICAgICAgIHZhciBwcm9wID0gZ3JpZC5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIHdoaWxlIChrZXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgcHJvcCA9IHByb3Bba2V5cy5zaGlmdCgpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm9wO1xuICAgIH1cblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWItZGFzaGJvYXJkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZGFzaGJvYXJkLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJykge1xuICAgICAgICAgICAgZGFzaGJvYXJkLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUudHJhbnNpdGlvbiA9ICdtYXJnaW4tbGVmdCAuNzVzJztcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLm1hcmdpbkxlZnQgPSBNYXRoLm1heCgxODAsIGRhc2hib2FyZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5yaWdodCArIDgpICsgJ3B4JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZGFzaGJvYXJkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9LCA4MDApO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUubWFyZ2luTGVmdCA9ICczMHB4JztcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGZwc1RpbWVyLCBzZWNzLCBmcmFtZXM7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi1mcHMnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXMsIHN0ID0gZWwuc3R5bGU7XG4gICAgICAgIGlmICgoZ3JpZC5wcm9wZXJ0aWVzLmVuYWJsZUNvbnRpbnVvdXNSZXBhaW50IF49IHRydWUpKSB7XG4gICAgICAgICAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSAnIzY2Nic7XG4gICAgICAgICAgICBzdC50ZXh0QWxpZ24gPSAnbGVmdCc7XG4gICAgICAgICAgICBzZWNzID0gZnJhbWVzID0gMDtcbiAgICAgICAgICAgIGNvZGUoKTtcbiAgICAgICAgICAgIGZwc1RpbWVyID0gc2V0SW50ZXJ2YWwoY29kZSwgMTAwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGZwc1RpbWVyKTtcbiAgICAgICAgICAgIHN0LmJhY2tncm91bmRDb2xvciA9IHN0LnRleHRBbGlnbiA9IG51bGw7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSAnRlBTJztcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBjb2RlKCkge1xuICAgICAgICAgICAgdmFyIGZwcyA9IGdyaWQuY2FudmFzLmN1cnJlbnRGUFMsXG4gICAgICAgICAgICAgICAgYmFycyA9IEFycmF5KE1hdGgucm91bmQoZnBzKSArIDEpLmpvaW4oJ0knKSxcbiAgICAgICAgICAgICAgICBzdWJyYW5nZSwgc3BhbjtcblxuICAgICAgICAgICAgLy8gZmlyc3Qgc3BhbiBob2xkcyB0aGUgMzAgYmFja2dyb3VuZCBiYXJzXG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSk7XG5cbiAgICAgICAgICAgIC8vIDJuZCBzcGFuIGhvbGRzIHRoZSBudW1lcmljXG4gICAgICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG4gICAgICAgICAgICBpZiAoc2Vjcykge1xuICAgICAgICAgICAgICAgIGZyYW1lcyArPSBmcHM7XG4gICAgICAgICAgICAgICAgc3Bhbi5pbm5lckhUTUwgPSBmcHMudG9GaXhlZCgxKTtcbiAgICAgICAgICAgICAgICBzcGFuLnRpdGxlID0gc2VjcyArICctc2Vjb25kIGF2ZXJhZ2UgPSAnICsgKGZyYW1lcyAvIHNlY3MpLnRvRml4ZWQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWNzICs9IDE7XG5cbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4pO1xuXG4gICAgICAgICAgICAvLyAwIHRvIDQgY29sb3IgcmFuZ2UgYmFyIHN1YnNldHM6IDEuLjEwOnJlZCwgMTE6MjA6eWVsbG93LCAyMTozMDpncmVlblxuICAgICAgICAgICAgd2hpbGUgKChzdWJyYW5nZSA9IGJhcnMuc3Vic3RyKDAsIDEyKSkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgICAgICBzcGFuLmlubmVySFRNTCA9IHN1YnJhbmdlO1xuICAgICAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICAgICAgICAgIGJhcnMgPSBiYXJzLnN1YnN0cigxMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBoZWlnaHQ7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi1ncm93LXNocmluaycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGxhYmVsO1xuICAgICAgICBpZiAoIWhlaWdodCkge1xuICAgICAgICAgICAgaGVpZ2h0ID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZ3JpZC5kaXYpLmhlaWdodDtcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLnRyYW5zaXRpb24gPSAnaGVpZ2h0IDEuNXMgbGluZWFyJztcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCArICdweCc7XG4gICAgICAgICAgICBsYWJlbCA9ICdTaHJpbmsnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgaGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGFiZWwgPSAnR3Jvdyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbm5lckhUTUwgKz0gJyAuLi4nO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBsYWJlbDtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAxNTAwKTtcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkYXNoYm9hcmQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBjdHJsID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICBpZiAoY3RybC5jbGFzc0xpc3QuY29udGFpbnMoJ3R3aXN0ZXInKSkge1xuICAgICAgICAgICAgY3RybC5uZXh0RWxlbWVudFNpYmxpbmcuc3R5bGUuZGlzcGxheSA9IGN0cmwuY2xhc3NMaXN0LnRvZ2dsZSgnb3BlbicpID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLm1hcmdpbkxlZnQgPSBNYXRoLm1heCgxODAsIGV2ZW50LmN1cnJlbnRUYXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHQgKyA4KSArICdweCc7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgdmFyIHJhZGlvR3JvdXAgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZVJhZGlvQ2xpY2soaGFuZGxlciwgZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ3JhZGlvJykge1xuICAgICAgICAgICAgdmFyIGxhc3RSYWRpbyA9IHJhZGlvR3JvdXBbdGhpcy5uYW1lXTtcbiAgICAgICAgICAgIGlmIChsYXN0UmFkaW8pIHtcbiAgICAgICAgICAgICAgICBsYXN0UmFkaW8uaGFuZGxlci5jYWxsKGxhc3RSYWRpby5jdHJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJhZGlvR3JvdXBbdGhpcy5uYW1lXSA9IHtjdHJsOiB0aGlzLCBoYW5kbGVyOiBoYW5kbGVyfTtcbiAgICAgICAgfVxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFByb3AoKSB7IC8vIHN0YW5kYXJkIGNoZWNrYm94IGNsaWNrIGhhbmRsZXJcbiAgICAgICAgdmFyIGhhc2ggPSB7fSwgZGVwdGggPSBoYXNoO1xuICAgICAgICB2YXIgaWQgPSB0aGlzLmlkO1xuICAgICAgICBpZiAoaWRbMF0gPT09ICchJykge1xuICAgICAgICAgICAgaWYgKHRoaXMudHlwZSAhPT0gJ2NoZWNrYm94Jykge1xuICAgICAgICAgICAgICAgIHRocm93ICdFeHBlY3RlZCBpbnZlcnNlIG9wZXJhdG9yICghKSBvbiBjaGVja2JveCBkYXNoYm9hcmQgY29udHJvbHMgb25seSBidXQgZm91bmQgb24gJyArIHRoaXMudHlwZSArICcuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkID0gaWQuc3Vic3RyKDEpO1xuICAgICAgICAgICAgdmFyIGludmVyc2UgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXlzID0gaWQuc3BsaXQoJy4nKTtcblxuICAgICAgICB3aGlsZSAoa2V5cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBkZXB0aCA9IGRlcHRoW2tleXMuc2hpZnQoKV0gPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgICAgICBkZXB0aFtrZXlzLnNoaWZ0KCldID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgICAgICAgICBkZXB0aFtrZXlzLnNoaWZ0KCldID0gaW52ZXJzZSA/ICF0aGlzLmNoZWNrZWQgOiB0aGlzLmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBncmlkLnRha2VGb2N1cygpO1xuICAgICAgICBncmlkLmFkZFByb3BlcnRpZXMoaGFzaCk7XG4gICAgICAgIGdyaWQuYmVoYXZpb3JDaGFuZ2VkKCk7XG4gICAgICAgIGdyaWQucmVwYWludCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFNlbGVjdGlvblByb3AoKSB7IC8vIGFsdGVybmF0ZSBjaGVja2JveCBjbGljayBoYW5kbGVyXG4gICAgICAgIHZhciBjdHJsO1xuXG4gICAgICAgIGdyaWQuc2VsZWN0aW9uTW9kZWwuY2xlYXIoKTtcbiAgICAgICAgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuY2xlYXJTZWxlY3RlZERhdGEoKTtcblxuICAgICAgICBzZXRQcm9wLmNhbGwodGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMuY2hlY2tlZCkge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHRoaXMuaWQgPT09ICdjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zJyAmJlxuICAgICAgICAgICAgICAgIChjdHJsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dG9TZWxlY3RSb3dzJykpLmNoZWNrZWRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCdOb3RlIHRoYXQgYXV0b1NlbGVjdFJvd3MgaXMgaW5lZmZlY3R1YWwgd2hlbiBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zIGlzIG9uLicpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlkID09PSAnYXV0b1NlbGVjdFJvd3MnKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAoY3RybCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zJykpLmNoZWNrZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgY29uZmlybSgnTm90ZSB0aGF0IGF1dG9TZWxlY3RSb3dzIGlzIGluZWZmZWN0dWFsIHdoZW4gY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucyBpcyBvbi5cXG5cXG5UdXJuIG9mZiBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zPycpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzZXRQcm9wLmNhbGwoY3RybCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAoY3RybCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlJykpLmNoZWNrZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgY29uZmlybSgnTm90ZSB0aGF0IGF1dG8tc2VsZWN0aW5nIGEgcmFuZ2Ugb2Ygcm93cyBieSBzZWxlY3RpbmcgYSByYW5nZSBvZiBjZWxscyAod2l0aCBjbGljayArIGRyYWcgb3Igc2hpZnQgKyBjbGljaykgaXMgbm90IHBvc3NpYmxlIHdpdGggc2luZ2xlUm93U2VsZWN0aW9uTW9kZSBpcyBvbi5cXG5cXG5UdXJuIG9mZiBzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlPycpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzZXRQcm9wLmNhbGwoY3RybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWJ1dHRvbi1wcmVzc2VkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgY2VsbEV2ZW50ID0gZS5kZXRhaWw7XG4gICAgICAgIGNlbGxFdmVudC52YWx1ZSA9ICFjZWxsRXZlbnQudmFsdWU7XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1jZWxsLWVudGVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgY2VsbEV2ZW50ID0gZS5kZXRhaWw7XG5cbiAgICAgICAgLy9ob3cgdG8gc2V0IHRoZSB0b29sdGlwLi4uLlxuICAgICAgICBncmlkLnNldEF0dHJpYnV0ZSgndGl0bGUnLCAnZXZlbnQgbmFtZTogXCJmaW4tY2VsbC1lbnRlclwiXFxuJyArXG4gICAgICAgICAgICAnZ3JpZENlbGw6IHsgeDogJyArIGNlbGxFdmVudC5ncmlkQ2VsbC54ICsgJywgeTogJyArIGNlbGxFdmVudC5ncmlkQ2VsbC55ICsgJyB9XFxuJyArXG4gICAgICAgICAgICAnZGF0YUNlbGw6IHsgeDogJyArIGNlbGxFdmVudC5kYXRhQ2VsbC54ICsgJywgeTogJyArIGNlbGxFdmVudC5kYXRhQ2VsbC55ICsgJyB9XFxuJyArXG4gICAgICAgICAgICAnc3ViZ3JpZCB0eXBlOiBcIicgKyBjZWxsRXZlbnQuc3ViZ3JpZC50eXBlICsgJ1wiXFxuJyArXG4gICAgICAgICAgICAnc3ViZ3JpZCBuYW1lOiAnICsgKGNlbGxFdmVudC5zdWJncmlkLm5hbWUgPyAnXCInICsgY2VsbEV2ZW50LnN1YmdyaWQubmFtZSArICdcIicgOiAndW5kZWZpbmVkJylcbiAgICAgICAgKTtcbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLXNldC10b3RhbHMtdmFsdWUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBkZXRhaWwgPSBlLmRldGFpbCxcbiAgICAgICAgICAgIGFyZWFzID0gZGV0YWlsLmFyZWFzIHx8IFsndG9wJywgJ2JvdHRvbSddO1xuXG4gICAgICAgIGFyZWFzLmZvckVhY2goZnVuY3Rpb24oYXJlYSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZE5hbWUgPSAnZ2V0JyArIGFyZWFbMF0udG9VcHBlckNhc2UoKSArIGFyZWEuc3Vic3RyKDEpICsgJ1RvdGFscycsXG4gICAgICAgICAgICAgICAgdG90YWxzUm93ID0gZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWxbbWV0aG9kTmFtZV0oKTtcblxuICAgICAgICAgICAgdG90YWxzUm93W2RldGFpbC55XVtkZXRhaWwueF0gPSBkZXRhaWwudmFsdWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGdyaWQucmVwYWludCgpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgTGlzdGVuIGZvciBjZXJ0YWluIGtleSBwcmVzc2VzIGZyb20gZ3JpZCBvciBjZWxsIGVkaXRvci5cbiAgICAgKiBAZGVzYyBOT1RFOiBmaW5jYW52YXMncyBpbnRlcm5hbCBjaGFyIG1hcCB5aWVsZHMgbWl4ZWQgY2FzZSB3aGlsZSBmaW4tZWRpdG9yLWtleSogZXZlbnRzIGRvIG5vdC5cbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBOb3QgaGFuZGxlZC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBoYW5kbGVDdXJzb3JLZXkoZSkge1xuICAgICAgICB2YXIgZGV0YWlsID0gZS5kZXRhaWwsXG4gICAgICAgICAgICBrZXkgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGRldGFpbC5rZXkpLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZTsgLy8gbWVhbnMgZXZlbnQgaGFuZGxlZCBoZXJlaW5cblxuICAgICAgICBpZiAoZGV0YWlsLmN0cmwpIHtcbiAgICAgICAgICAgIGlmIChkZXRhaWwuc2hpZnQpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICcwJzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFRvVmlld3BvcnRDZWxsKDAsIDApOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc5JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFRvRmluYWxDZWxsKCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzgnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0VG9GaW5hbENlbGxPZkN1cnJlbnRSb3coKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnNyc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RUb0ZpcnN0Q2VsbE9mQ3VycmVudFJvdygpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnMCc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RWaWV3cG9ydENlbGwoMCwgMCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzknOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0RmluYWxDZWxsKCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzgnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0RmluYWxDZWxsT2ZDdXJyZW50Um93KCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzcnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0Rmlyc3RDZWxsT2ZDdXJyZW50Um93KCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1rZXlkb3duJywgaGFuZGxlQ3Vyc29yS2V5KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWVkaXRvci1rZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyB2YXIgZGV0YWlsID0gZS5kZXRhaWwsXG4gICAgICAgIC8vICAgICBrZSA9IGRldGFpbC5rZXlFdmVudDtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gLy8gbW9yZSBkZXRhaWwsIHBsZWFzZVxuICAgICAgICAvLyBkZXRhaWwucHJpbWl0aXZlRXZlbnQgPSBrZTtcbiAgICAgICAgLy8gZGV0YWlsLmtleSA9IGtlLmtleUNvZGU7XG4gICAgICAgIC8vIGRldGFpbC5zaGlmdCA9IGtlLnNoaWZ0S2V5O1xuICAgICAgICAvL1xuICAgICAgICAvLyBoYW5kbGVDdXJzb3JLZXkoZSk7XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1zZWxlY3Rpb24tY2hhbmdlZCcsIGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICBpZiAoZS5kZXRhaWwuc2VsZWN0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyBzZWxlY3Rpb25zJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0byBnZXQgdGhlIHNlbGVjdGVkIHJvd3MgdW5jb21tZW50IHRoZSBiZWxvdy4uLi4uXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGdyaWQuZ2V0Um93U2VsZWN0aW9uTWF0cml4KCkpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhncmlkLmdldFJvd1NlbGVjdGlvbigpKTtcblxuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tcm93LXNlbGVjdGlvbi1jaGFuZ2VkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgZGV0YWlsID0gZS5kZXRhaWw7XG4gICAgICAgIC8vIE1vdmUgY2VsbCBzZWxlY3Rpb24gd2l0aCByb3cgc2VsZWN0aW9uXG4gICAgICAgIHZhciByb3dzID0gZGV0YWlsLnJvd3MsXG4gICAgICAgICAgICBzZWxlY3Rpb25zID0gZGV0YWlsLnNlbGVjdGlvbnM7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGdyaWQucHJvcGVydGllcy5zaW5nbGVSb3dTZWxlY3Rpb25Nb2RlICYmIC8vIGxldCdzIG9ubHkgYXR0ZW1wdCB0aGlzIHdoZW4gaW4gdGhpcyBtb2RlXG4gICAgICAgICAgICAhZ3JpZC5wcm9wZXJ0aWVzLm11bHRpcGxlU2VsZWN0aW9ucyAmJiAvLyBhbmQgb25seSB3aGVuIGluIHNpbmdsZSBzZWxlY3Rpb24gbW9kZVxuICAgICAgICAgICAgcm93cy5sZW5ndGggJiYgLy8gdXNlciBqdXN0IHNlbGVjdGVkIGEgcm93IChtdXN0IGJlIHNpbmdsZSByb3cgZHVlIHRvIG1vZGUgd2UncmUgaW4pXG4gICAgICAgICAgICBzZWxlY3Rpb25zLmxlbmd0aCAgLy8gdGhlcmUgd2FzIGEgY2VsbCByZWdpb24gc2VsZWN0ZWQgKG11c3QgYmUgdGhlIG9ubHkgb25lKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHZhciByZWN0ID0gZ3JpZC5zZWxlY3Rpb25Nb2RlbC5nZXRMYXN0U2VsZWN0aW9uKCksIC8vIHRoZSBvbmx5IGNlbGwgc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgeCA9IHJlY3QubGVmdCxcbiAgICAgICAgICAgICAgICB5ID0gcm93c1swXSwgLy8gd2Uga25vdyB0aGVyZSdzIG9ubHkgMSByb3cgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICB3aWR0aCA9IHJlY3QucmlnaHQgLSB4LFxuICAgICAgICAgICAgICAgIGhlaWdodCA9IDAsIC8vIGNvbGxhcHNlIHRoZSBuZXcgcmVnaW9uIHRvIG9jY3VweSBhIHNpbmdsZSByb3dcbiAgICAgICAgICAgICAgICBmaXJlU2VsZWN0aW9uQ2hhbmdlZEV2ZW50ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGdyaWQuc2VsZWN0aW9uTW9kZWwuc2VsZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQsIGZpcmVTZWxlY3Rpb25DaGFuZ2VkRXZlbnQpO1xuICAgICAgICAgICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocm93cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyByb3dzIHNlbGVjdGVkJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy93ZSBoYXZlIGEgZnVuY3Rpb24gY2FsbCB0byBjcmVhdGUgdGhlIHNlbGVjdGlvbiBtYXRyaXggYmVjYXVzZVxuICAgICAgICAvL3dlIGRvbid0IHdhbnQgdG8gY3JlYXRlIGFsb3Qgb2YgbmVlZGxlc3MgZ2FyYmFnZSBpZiB0aGUgdXNlclxuICAgICAgICAvL2lzIGp1c3QgbmF2aWdhdGluZyBhcm91bmRcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZC5nZXRSb3dTZWxlY3Rpb25NYXRyaXgoKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGdyaWQuZ2V0Um93U2VsZWN0aW9uKCkpO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tY29sdW1uLXNlbGVjdGlvbi1jaGFuZ2VkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS5kZXRhaWwuY29sdW1ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyByb3dzIHNlbGVjdGVkJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy93ZSBoYXZlIGEgZnVuY3Rpb24gY2FsbCB0byBjcmVhdGUgdGhlIHNlbGVjdGlvbiBtYXRyaXggYmVjYXVzZVxuICAgICAgICAvL3dlIGRvbid0IHdhbnQgdG8gY3JlYXRlIGFsb3Qgb2YgbmVlZGxlc3MgZ2FyYmFnZSBpZiB0aGUgdXNlclxuICAgICAgICAvL2lzIGp1c3QgbmF2aWdhdGluZyBhcm91bmRcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZC5nZXRDb2x1bW5TZWxlY3Rpb25NYXRyaXgoKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGdyaWQuZ2V0Q29sdW1uU2VsZWN0aW9uKCkpO1xuICAgIH0pO1xuXG4gICAgLy91bmNvbW1lbnQgdG8gY2FuY2VsIGVkaXRvciBwb3BwaW5nIHVwOlxuICAgIC8vIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLXJlcXVlc3QtY2VsbC1lZGl0JywgZnVuY3Rpb24oZSkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH0pO1xuXG4gICAgLy91bmNvbW1lbnQgdG8gY2FuY2VsIHVwZGF0aW5nIHRoZSBtb2RlbCB3aXRoIHRoZSBuZXcgZGF0YTpcbiAgICAvLyBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1iZWZvcmUtY2VsbC1lZGl0JywgZnVuY3Rpb24oZSkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH0pO1xufTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVtbywgZ3JpZCkge1xuXG4gICAgdmFyIGZvb3RJbmNoUGF0dGVybiA9IC9eXFxzKigoKChcXGQrKScpP1xccyooKFxcZCspXCIpPyl8XFxkKylcXHMqJC87XG5cbiAgICB2YXIgZm9vdEluY2hMb2NhbGl6ZXIgPSB7XG4gICAgICAgIGZvcm1hdDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZlZXQgPSBNYXRoLmZsb29yKHZhbHVlIC8gMTIpO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gKGZlZXQgPyBmZWV0ICsgJ1xcJycgOiAnJykgKyAnICcgKyAodmFsdWUgJSAxMikgKyAnXCInO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgICAgIHZhciBpbmNoZXMsIGZlZXQsXG4gICAgICAgICAgICAgICAgcGFydHMgPSBzdHIubWF0Y2goZm9vdEluY2hQYXR0ZXJuKTtcbiAgICAgICAgICAgIGlmIChwYXJ0cykge1xuICAgICAgICAgICAgICAgIGZlZXQgPSBwYXJ0c1s0XTtcbiAgICAgICAgICAgICAgICBpbmNoZXMgPSBwYXJ0c1s2XTtcbiAgICAgICAgICAgICAgICBpZiAoZmVldCA9PT0gdW5kZWZpbmVkICYmIGluY2hlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGluY2hlcyA9IE51bWJlcihwYXJ0c1sxXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZmVldCA9IE51bWJlcihmZWV0IHx8IDApO1xuICAgICAgICAgICAgICAgICAgICBpbmNoZXMgPSBOdW1iZXIoaW5jaGVzIHx8IDApO1xuICAgICAgICAgICAgICAgICAgICBpbmNoZXMgPSAxMiAqIGZlZXQgKyBpbmNoZXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmNoZXMgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluY2hlcztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoJ2Zvb3QnLCBmb290SW5jaExvY2FsaXplcik7XG5cbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoJ3NpbmdkYXRlJywgbmV3IGdyaWQubG9jYWxpemF0aW9uLkRhdGVGb3JtYXR0ZXIoJ3poLVNHJykpO1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKCdwb3VuZHMnLCBuZXcgZ3JpZC5sb2NhbGl6YXRpb24uTnVtYmVyRm9ybWF0dGVyKCdlbi1VUycsIHtcbiAgICAgICAgc3R5bGU6ICdjdXJyZW5jeScsXG4gICAgICAgIGN1cnJlbmN5OiAnVVNEJ1xuICAgIH0pKTtcblxuICAgIGdyaWQubG9jYWxpemF0aW9uLmFkZCgnZnJhbmNzJywgbmV3IGdyaWQubG9jYWxpemF0aW9uLk51bWJlckZvcm1hdHRlcignZnItRlInLCB7XG4gICAgICAgIHN0eWxlOiAnY3VycmVuY3knLFxuICAgICAgICBjdXJyZW5jeTogJ0VVUidcbiAgICB9KSk7XG5cbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoe1xuICAgICAgICBuYW1lOiAnaGhtbScsIC8vIGFsdGVybmF0aXZlIHRvIGhhdmluZyB0byBoYW1lIGxvY2FsaXplciBpbiBgZ3JpZC5sb2NhbGl6YXRpb24uYWRkYFxuXG4gICAgICAgIC8vIHJldHVybnMgZm9ybWF0dGVkIHN0cmluZyBmcm9tIG51bWJlclxuICAgICAgICBmb3JtYXQ6IGZ1bmN0aW9uKG1pbnMpIHtcbiAgICAgICAgICAgIHZhciBoaCA9IE1hdGguZmxvb3IobWlucyAvIDYwKSAlIDEyIHx8IDEyLCAvLyBtb2R1bG8gMTIgaHJzIHdpdGggMCBiZWNvbWluZyAxMlxuICAgICAgICAgICAgICAgIG1tID0gKG1pbnMgJSA2MCArIDEwMCArICcnKS5zdWJzdHIoMSwgMiksXG4gICAgICAgICAgICAgICAgQW1QbSA9IG1pbnMgPCBkZW1vLk5PT04gPyAnQU0nIDogJ1BNJztcbiAgICAgICAgICAgIHJldHVybiBoaCArICc6JyArIG1tICsgJyAnICsgQW1QbTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbnZhbGlkOiBmdW5jdGlvbihoaG1tKSB7XG4gICAgICAgICAgICByZXR1cm4gIS9eKDA/WzEtOV18MVswLTJdKTpbMC01XVxcZCQvLnRlc3QoaGhtbSk7IC8vIDEyOjU5IG1heFxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIHJldHVybnMgbnVtYmVyIGZyb20gZm9ybWF0dGVkIHN0cmluZ1xuICAgICAgICBwYXJzZTogZnVuY3Rpb24oaGhtbSkge1xuICAgICAgICAgICAgdmFyIHBhcnRzID0gaGhtbS5tYXRjaCgvXihcXGQrKTooXFxkezJ9KSQvKTtcbiAgICAgICAgICAgIHJldHVybiBOdW1iZXIocGFydHNbMV0pICogNjAgKyBOdW1iZXIocGFydHNbMl0pO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZ3JpZDtcblxufTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKiBnbG9iYWxzIGZpbiwgcGVvcGxlMSAqL1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1hbGVydCovXG5cbid1c2Ugc3RyaWN0Jztcblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGRlbW8gPSB3aW5kb3cuZGVtbyA9IHtcbiAgICAgICAgc2V0IHZlbnQoc3RhcnQpIHsgd2luZG93LmdyaWRbc3RhcnQgPyAnbG9nU3RhcnQnIDogJ2xvZ1N0b3AnXSgpOyB9LFxuICAgICAgICByZXNldDogcmVzZXQsXG4gICAgICAgIHNldERhdGE6IHNldERhdGEsXG4gICAgICAgIHRvZ2dsZUVtcHR5RGF0YTogdG9nZ2xlRW1wdHlEYXRhLFxuICAgICAgICByZXNldERhdGE6IHJlc2V0RGF0YVxuICAgIH07XG5cbiAgICB2YXIgSHlwZXJncmlkID0gZmluLkh5cGVyZ3JpZCxcbiAgICAgICAgaW5pdFN0YXRlID0gcmVxdWlyZSgnLi9zZXRTdGF0ZScpLFxuICAgICAgICBpbml0Q2VsbFJlbmRlcmVycyA9IHJlcXVpcmUoJy4vY2VsbHJlbmRlcmVycycpLFxuICAgICAgICBpbml0Rm9ybWF0dGVycyA9IHJlcXVpcmUoJy4vZm9ybWF0dGVycycpLFxuICAgICAgICBpbml0Q2VsbEVkaXRvcnMgPSByZXF1aXJlKCcuL2NlbGxFZGl0b3JzJyksXG4gICAgICAgIGluaXREYXNoYm9hcmQgPSByZXF1aXJlKCcuL2Rhc2hib2FyZCcpLFxuICAgICAgICBpbml0RXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxuICAgIC8vIGNvbnZlcnQgZmllbGQgbmFtZXMgY29udGFpbmluZyB1bmRlcnNjb3JlIHRvIGNhbWVsIGNhc2UgYnkgb3ZlcnJpZGluZyBjb2x1bW4gZW51bSBkZWNvcmF0b3JcbiAgICBIeXBlcmdyaWQuYmVoYXZpb3JzLkpTT04ucHJvdG90eXBlLmNvbHVtbkVudW1LZXkgPSBIeXBlcmdyaWQuYmVoYXZpb3JzLkpTT04uY29sdW1uRW51bURlY29yYXRvcnMudG9DYW1lbENhc2U7XG5cbiAgICB2YXIgZ3JpZE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXRhOiBwZW9wbGUxLFxuICAgICAgICAgICAgbWFyZ2luOiB7IGJvdHRvbTogJzE3cHgnLCByaWdodDogJzE3cHgnfSxcbiAgICAgICAgICAgIHNjaGVtYTogSHlwZXJncmlkLmxpYi5maWVsZHMuZ2V0U2NoZW1hKHBlb3BsZTEpLFxuICAgICAgICAgICAgcGx1Z2luczogcmVxdWlyZSgnZmluLWh5cGVyZ3JpZC1ldmVudC1sb2dnZXInKSxcbiAgICAgICAgICAgIHN0YXRlOiB7IGNvbG9yOiAnb3JhbmdlJyB9XG4gICAgICAgIH0sXG4gICAgICAgIGdyaWQgPSB3aW5kb3cuZ3JpZCA9IHdpbmRvdy5nID0gbmV3IEh5cGVyZ3JpZCgnZGl2I2pzb24tZXhhbXBsZScsIGdyaWRPcHRpb25zKSxcbiAgICAgICAgYmVoYXZpb3IgPSB3aW5kb3cuYiA9IGdyaWQuYmVoYXZpb3IsXG4gICAgICAgIGRhdGFNb2RlbCA9IHdpbmRvdy5tID0gYmVoYXZpb3IuZGF0YU1vZGVsLFxuICAgICAgICBpZHggPSBiZWhhdmlvci5jb2x1bW5FbnVtO1xuXG5cbiAgICBjb25zb2xlLmxvZygnRmllbGRzOicpOyAgY29uc29sZS5kaXIoYmVoYXZpb3IuZGF0YU1vZGVsLnNjaGVtYS5tYXAoZnVuY3Rpb24oY3MpIHsgcmV0dXJuIGNzLm5hbWU7IH0pKTtcbiAgICBjb25zb2xlLmxvZygnSGVhZGVyczonKTsgY29uc29sZS5kaXIoYmVoYXZpb3IuZGF0YU1vZGVsLnNjaGVtYS5tYXAoZnVuY3Rpb24oY3MpIHsgcmV0dXJuIGNzLmhlYWRlcjsgfSkpO1xuICAgIGNvbnNvbGUubG9nKCdJbmRleGVzOicpOyBjb25zb2xlLmRpcihpZHgpO1xuXG4gICAgZnVuY3Rpb24gc2V0RGF0YShkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSAhZGF0YS5sZW5ndGggPyB1bmRlZmluZWQgOiBvcHRpb25zIHx8IHtcbiAgICAgICAgICAgIHNjaGVtYTogSHlwZXJncmlkLmxpYi5maWVsZHMuZ2V0U2NoZW1hKGRhdGEpXG4gICAgICAgIH07XG4gICAgICAgIGdyaWQuc2V0RGF0YShkYXRhLCBvcHRpb25zKTtcbiAgICAgICAgYmVoYXZpb3IucmVpbmRleCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgICBncmlkLnJlc2V0KCk7XG4gICAgICAgIGluaXRFdmVudHMoZGVtbywgZ3JpZCk7XG4gICAgfVxuXG4gICAgdmFyIG9sZERhdGE7XG4gICAgZnVuY3Rpb24gdG9nZ2xlRW1wdHlEYXRhKCkge1xuICAgICAgICBpZiAoIW9sZERhdGEpIHtcbiAgICAgICAgICAgIG9sZERhdGEgPSB7XG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YU1vZGVsLmdldERhdGEoKSxcbiAgICAgICAgICAgICAgICBzY2hlbWE6IGRhdGFNb2RlbC5zY2hlbWEsXG4gICAgICAgICAgICAgICAgYWN0aXZlQ29sdW1uczogYmVoYXZpb3IuZ2V0QWN0aXZlQ29sdW1ucygpLm1hcChmdW5jdGlvbihjb2x1bW4pIHsgcmV0dXJuIGNvbHVtbi5pbmRleDsgfSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvL2ltcG9ydGFudCB0byBzZXQgdG9wIHRvdGFscyBmaXJzdFxuICAgICAgICAgICAgc2V0RGF0YShbXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL2ltcG9ydGFudCB0byBzZXQgdG9wIHRvdGFscyBmaXJzdFxuICAgICAgICAgICAgc2V0RGF0YShvbGREYXRhLmRhdGEsIG9sZERhdGEuc2NoZW1hKTtcbiAgICAgICAgICAgIGJlaGF2aW9yLnNldENvbHVtbkluZGV4ZXMob2xkRGF0YS5hY3RpdmVDb2x1bW5zKTtcbiAgICAgICAgICAgIG9sZERhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNldERhdGEoKSB7XG4gICAgICAgIHNldERhdGEocGVvcGxlMSk7XG4gICAgICAgIGluaXRTdGF0ZShkZW1vLCBncmlkKTtcbiAgICB9XG5cbiAgICBpbml0Q2VsbFJlbmRlcmVycyhkZW1vLCBncmlkKTtcbiAgICBpbml0Rm9ybWF0dGVycyhkZW1vLCBncmlkKTtcbiAgICBpbml0Q2VsbEVkaXRvcnMoZGVtbywgZ3JpZCk7XG4gICAgaW5pdEV2ZW50cyhkZW1vLCBncmlkKTtcbiAgICBpbml0RGFzaGJvYXJkKGRlbW8sIGdyaWQpO1xuICAgIGluaXRTdGF0ZShkZW1vLCBncmlkKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVtbywgZ3JpZCkge1xuXG4gICAgdmFyIGlkeCA9IGdyaWQuYmVoYXZpb3IuY29sdW1uRW51bTtcblxuICAgIHZhciBzdGF0ZSA9IHtcbiAgICAgICAgY29sdW1uSW5kZXhlczogW1xuICAgICAgICAgICAgaWR4Lmxhc3ROYW1lLFxuICAgICAgICAgICAgaWR4LnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQsXG4gICAgICAgICAgICBpZHguaGVpZ2h0LFxuICAgICAgICAgICAgaWR4LmJpcnRoRGF0ZSxcbiAgICAgICAgICAgIGlkeC5iaXJ0aFRpbWUsXG4gICAgICAgICAgICBpZHguYmlydGhTdGF0ZSxcbiAgICAgICAgICAgIC8vIGlkeC5yZXNpZGVuY2VTdGF0ZSxcbiAgICAgICAgICAgIGlkeC5lbXBsb3llZCxcbiAgICAgICAgICAgIC8vIGlkeC5maXJzdE5hbWUsXG4gICAgICAgICAgICBpZHguaW5jb21lLFxuICAgICAgICAgICAgaWR4LnRyYXZlbCxcbiAgICAgICAgICAgIC8vIGlkeC5zcXVhcmVPZkluY29tZVxuICAgICAgICBdLFxuXG4gICAgICAgIG5vRGF0YU1lc3NhZ2U6ICdObyBEYXRhIHRvIERpc3BsYXknLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd3aGl0ZScsXG4gICAgICAgIGZvbnQ6ICdub3JtYWwgc21hbGwgZ2FyYW1vbmQnLFxuICAgICAgICByb3dQcm9wZXJ0aWVzOiBbXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB7IGNvbG9yOiAnIzExNjYxMScsIGJhY2tncm91bmRDb2xvcjogJyNlOGZmZTgnLCBmb250OiAnaXRhbGljIHNtYWxsIGdhcmFtb25kJyB9LFxuICAgICAgICAgICAgeyBjb2xvcjogJyMxMTY2MTEnLCBiYWNrZ3JvdW5kQ29sb3I6ICcjZThmZmU4JywgZm9udDogJ2l0YWxpYyBzbWFsbCBnYXJhbW9uZCcgfSxcbiAgICAgICAgICAgIHsgY29sb3I6ICcjMTE2NjExJywgYmFja2dyb3VuZENvbG9yOiAnI2U4ZmZlOCcsIGZvbnQ6ICdpdGFsaWMgc21hbGwgZ2FyYW1vbmQnIH1cbiAgICAgICAgXSxcblxuICAgICAgICBmaXhlZENvbHVtbkNvdW50OiAxLFxuICAgICAgICBmaXhlZFJvd0NvdW50OiA0LFxuXG4gICAgICAgIGNvbHVtbkF1dG9zaXppbmc6IGZhbHNlLFxuICAgICAgICBoZWFkZXJUZXh0V3JhcHBpbmc6IHRydWUsXG5cbiAgICAgICAgaGFsaWduOiAnbGVmdCcsXG4gICAgICAgIHJlbmRlckZhbHN5OiB0cnVlLFxuXG4gICAgICAgIHNjcm9sbGJhckhvdmVyT2ZmOiAndmlzaWJsZScsXG4gICAgICAgIHNjcm9sbGJhckhvdmVyT3ZlcjogJ3Zpc2libGUnLFxuICAgICAgICBjb2x1bW5IZWFkZXJCYWNrZ3JvdW5kQ29sb3I6ICdwaW5rJyxcblxuICAgICAgICBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zOiB0cnVlLFxuXG4gICAgICAgIGF1dG9TZWxlY3RSb3dzOiB0cnVlLFxuXG4gICAgICAgIHJvd3M6IHtcbiAgICAgICAgICAgIGhlYWRlcjoge1xuICAgICAgICAgICAgICAgIDA6IHtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiA0MFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBjYWxjdWxhdG9yczoge1xuICAgICAgICAgICAgQWRkMTA6ICdmdW5jdGlvbihkYXRhUm93LGNvbHVtbk5hbWUpIHsgcmV0dXJuIGRhdGFSb3dbY29sdW1uTmFtZV0gKyAxMDsgfSdcbiAgICAgICAgfSxcblxuICAgICAgICBjb2x1bW5zOiB7XG4gICAgICAgICAgICBoZWlnaHQ6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnZm9vdCdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuICAgICAgICAgICAgbGFzdF9uYW1lOiB7XG4gICAgICAgICAgICAgICAgY29sdW1uSGVhZGVyQmFja2dyb3VuZENvbG9yOiAnIzE0MkI2RicsIC8vZGFyayBibHVlXG4gICAgICAgICAgICAgICAgY29sdW1uSGVhZGVyQ29sb3I6ICd3aGl0ZScsXG4gICAgICAgICAgICAgICAgY29sdW1uSGVhZGVySGFsaWduOiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgcmlnaHRJY29uOiAnZG93bi1yZWN0YW5nbGUnLFxuICAgICAgICAgICAgICAgIGxpbms6IHRydWVcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZpcnN0X25hbWU6IHtcblxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdG90YWxfbnVtYmVyX29mX3BldHNfb3duZWQ6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgY2FsY3VsYXRvcjogJ0FkZDEwJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2dyZWVuJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYmlydGhEYXRlOiB7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnc2luZ2RhdGUnLFxuICAgICAgICAgICAgICAgIHJpZ2h0SWNvbjogJ2NhbGVuZGFyJyxcbiAgICAgICAgICAgICAgICAvL3N0cmlrZVRocm91Z2g6IHRydWVcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGJpcnRoVGltZToge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICBlZGl0b3I6ICd0aW1lJyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdoaG1tJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYmlydGhTdGF0ZToge1xuICAgICAgICAgICAgICAgIGVkaXRvcjogJ2NvbG9ydGV4dCcsXG4gICAgICAgICAgICAgICAgcmlnaHRJY29uOiAnZG93bi1yZWN0YW5nbGUnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZXNpZGVuY2VTdGF0ZToge1xuICAgICAgICAgICAgICAgIHJpZ2h0SWNvbjogJ2Rvd24tcmVjdGFuZ2xlJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZW1wbG95ZWQ6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgcmVuZGVyZXI6ICdidXR0b24nLFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3doaXRlJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgaW5jb21lOiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3BvdW5kcydcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHRyYXZlbDoge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdmcmFuY3MnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gRm9sbG93aW5nIGBjZWxsc2AgZXhhbXBsZSBzZXRzIHByb3BlcnRpZXMgZm9yIGEgY2VsbCBpbiB0aGUgZGF0YSBzdWJncmlkLlxuICAgICAgICAvLyBTcGVjaWZ5aW5nIGNlbGwgcHJvcGVydGllcyBoZXJlIGluIGdyaWQgc3RhdGUgbWF5IGJlIHVzZWZ1bCBmb3Igc3RhdGljIGRhdGEgc3ViZ3JpZHNcbiAgICAgICAgLy8gd2hlcmUgY2VsbCBjb29yZGluYXRlcyBhcmUgcGVybWFuZW50bHkgYXNzaWduZWQuIE90aGVyd2lzZSwgZm9yIG15IGR5bmFtaWMgZ3JpZCBkYXRhLFxuICAgICAgICAvLyBjZWxsIHByb3BlcnRpZXMgbWlnaHQgbW9yZSBwcm9wZXJseSBhY2NvbXBhbnkgdGhlIGRhdGEgaXRzZWxmIGFzIG1ldGFkYXRhXG4gICAgICAgIC8vIChpLmUuLCBhcyBhIGhhc2ggaW4gZGF0YVJvdy5fX01FVEFbZmllbGROYW1lXSkuXG4gICAgICAgIGNlbGxzOiB7XG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgMTY6IHtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250OiAnMTBwdCBUYWhvbWEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICdsaWdodGJsdWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAncmVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGlnbjogJ2xlZnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVhcHBseUNlbGxQcm9wZXJ0aWVzOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ3JpZC5zZXRTdGF0ZShzdGF0ZSk7XG5cbiAgICBncmlkLnRha2VGb2N1cygpO1xuXG4gICAgZGVtby5yZXNldERhc2hib2FyZCgpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNhdGFsb2cgPSByZXF1aXJlKCdvYmplY3QtY2F0YWxvZycpO1xudmFyIGZpbmQgPSByZXF1aXJlKCdtYXRjaC1wb2ludCcpO1xudmFyIEdyZXlsaXN0ID0gcmVxdWlyZSgnZ3JleWxpc3QnKTtcblxuXG52YXIgaXNET00gPSAoXG4gICAgdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwod2luZG93KSA9PT0gJ1tvYmplY3QgV2luZG93XScgJiZcbiAgICB0eXBlb2Ygd2luZG93Lk5vZGUgPT09ICdmdW5jdGlvbidcbik7XG5cbnZhciBpc0RvbU5vZGUgPSBpc0RPTSA/IGZ1bmN0aW9uKG9iaikgeyByZXR1cm4gb2JqIGluc3RhbmNlb2Ygd2luZG93Lk5vZGUgfSA6IGZ1bmN0aW9uKCkge307XG5cblxuLyoqXG4gKiBAc3VtbWFyeSBTZWFyY2ggYW4gb2JqZWN0J3MgY29kZSBmb3IgcGF0dGVybiBtYXRjaGVzLlxuICogQGRlc2MgU2VhcmNoZXMgYWxsIGNvZGUgaW4gdGhlIHZpc2libGUgZXhlY3V0aW9uIGNvbnRleHQgdXNpbmcgdGhlIHByb3ZpZGVkIHJlZ2V4IHBhdHRlcm4sIHJldHVybmluZyB0aGUgZW50aXJlIHBhdHRlcm4gbWF0Y2guXG4gKlxuICogSWYgY2FwdHVyZSBncm91cHMgYXJlIHNwZWNpZmllZCBpbiB0aGUgcGF0dGVybiwgcmV0dXJucyB0aGUgbGFzdCBjYXB0dXJlIGdyb3VwIG1hdGNoLCB1bmxlc3MgYG9wdGlvbnMuY2FwdHVyZUdyb3VwYCBpcyBkZWZpbmVkLCBpbiB3aGljaCBjYXNlIHJldHVybnMgdGhlIGdyb3VwIHdpdGggdGhhdCBpbmRleCB3aGVyZSBgMGAgbWVhbnMgdGhlIGVudGlyZSBwYXR0ZXJuLCBfZXRjLl8gKHBlciBgU3RyaW5nLnByb3RvdHlwZS5tYXRjaGApLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gcGF0dGVybiAtIFNlYXJjaCBhcmd1bWVudC5cbiAqIERvbid0IHVzZSBnbG9iYWwgZmxhZyBvbiBSZWdFeHA7IGl0J3MgdW5uZWNlc3NhcnkgYW5kIHN1cHByZXNzZXMgc3VibWF0Y2hlcyBvZiBjYXB0dXJlIGdyb3Vwcy5cbiAqXG4gKiBAcGFyYW0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuY2FwdHVyZUdyb3VwXSAtIElmZiBkZWZpbmVkLCBpbmRleCBvZiBhIHNwZWNpZmljIGNhcHR1cmUgZ3JvdXAgdG8gcmV0dXJuIGZvciBlYWNoIG1hdGNoLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yZWN1cnNlXSAtIEVxdWl2YWxlbnQgdG8gc2V0dGluZyBib3RoIGByZWN1cnNlT3duYCBhbmQgYHJlY3Vyc2VBbmNlc3RvcnNgLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yZWN1cnNlT3duXSAtIFJlY3Vyc2Ugb3duIHN1Ym9iamVjdHMuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJlY3Vyc2VBbmNlc3RvcnNdIC0gUmVjdXJzZSBzdWJvYmplY3RzIG9mIG9iamVjdHMgb2YgdGhlIGVudGlyZSBwcm90b3R5cGUgY2hhaW4uXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuZ3JleWxpc3RdIC0gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC9ncmV5bGlzdFxuICogQHBhcmFtIFtvcHRpb25zLmdyZXlsaXN0LndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBtYXRjaGVzIGFyZSBpbmNsdWRlZCBpbiB0aGUgcmVzdWx0cy5cbiAqIEBwYXJhbSBbb3B0aW9ucy5ncmV5bGlzdC5ibGFja10gLSBJZiBnaXZlbiwgbGlzdGVkIG1hdGNoZXMgYXJlIGV4Y2x1ZGVkIGZyb20gdGhlIHJlc3VsdHMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLmNhdGFsb2ddIC0gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC9vYmplY3QtY2F0YWxvZ1xuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jYXRhbG9nLm93bl0gLSBPbmx5IHNlYXJjaCBvd24gb2JqZWN0OyBvdGhlcndpc2Ugc2VhcmNoIG93biArIGVudGlyZSBwcm90b3R5cGUgY2hhaW4uXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuY2F0YWxvZy5ncmV5bGlzdF0gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L2dyZXlsaXN0XG4gKiBAcGFyYW0gW29wdGlvbnMuY2F0YWxvZy5ncmV5bGlzdC53aGl0ZV0gLSBJZiBnaXZlbiwgb25seSBsaXN0ZWQgbWVtYmVycyBhcmUgY2F0YWxvZ2VkLlxuICogQHBhcmFtIFtvcHRpb25zLmNhdGFsb2cuZ3JleWxpc3QuYmxhY2tdIC0gSWYgZ2l2ZW4sIGxpc3RlZCBtZW1iZXJzIGFyZSAqbm90KiBjYXRhbG9nZWQuXG4gKlxuICogQHJldHVybnMge3N0cmluZ1tdfSBQYXR0ZXJuIG1hdGNoZXMuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoKHBhdHRlcm4sIG9wdGlvbnMsIGJ5R3JleWxpc3QsIG1hdGNoZXMsIHNjYW5uZWQpIHtcbiAgICB2YXIgdG9wTGV2ZWxDYWxsID0gIW1hdGNoZXM7XG5cbiAgICBpZiAodG9wTGV2ZWxDYWxsKSB7XG4gICAgICAgIC8vIHRoaXMgaXMgdGhlIHRvcC1sZXZlbCAobm9uLXJlY3Vyc2VkKSBjYWxsIHNvIGludGlhbGl6ZTpcbiAgICAgICAgdmFyIGdyZXlsaXN0ID0gbmV3IEdyZXlsaXN0KG9wdGlvbnMgJiYgb3B0aW9ucy5ncmV5bGlzdCk7XG4gICAgICAgIGJ5R3JleWxpc3QgPSBncmV5bGlzdC50ZXN0LmJpbmQoZ3JleWxpc3QpO1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgbWF0Y2hlcyA9IFtdO1xuICAgICAgICBzY2FubmVkID0gW107XG4gICAgfVxuXG4gICAgdmFyIHJvb3QgPSB0aGlzO1xuICAgIHZhciBtZW1iZXJzID0gY2F0YWxvZy5jYWxsKHJvb3QsIG9wdGlvbnMuY2F0YWxvZyk7XG5cbiAgICBzY2FubmVkLnB1c2gocm9vdCk7XG5cbiAgICBPYmplY3Qua2V5cyhtZW1iZXJzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdmFyIG9iaiA9IG1lbWJlcnNba2V5XTtcbiAgICAgICAgdmFyIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwga2V5KTtcblxuICAgICAgICBpZiAoZGVzY3JpcHRvci52YWx1ZSA9PT0gbWF0Y2gpIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gZG9uJ3QgY2F0YWxvZyBzZWxmIHdoZW4gZm91bmQgdG8gaGF2ZSBiZWVuIG1peGVkIGluXG4gICAgICAgIH1cblxuICAgICAgICBPYmplY3Qua2V5cyhkZXNjcmlwdG9yKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wTmFtZSkge1xuICAgICAgICAgICAgdmFyIGhpdHMsIHByb3AgPSBkZXNjcmlwdG9yW3Byb3BOYW1lXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9wID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvcE5hbWUgbXVzdCBiZSBgZ2V0YCBvciBgc2V0YCBvciBgdmFsdWVgXG4gICAgICAgICAgICAgICAgaGl0cyA9IGZpbmQocHJvcC50b1N0cmluZygpLCBwYXR0ZXJuLCBvcHRpb25zLmNhcHR1cmVHcm91cCkuZmlsdGVyKGJ5R3JleWxpc3QpO1xuICAgICAgICAgICAgICAgIGhpdHMuZm9yRWFjaChmdW5jdGlvbihoaXQpIHsgbWF0Y2hlcy5wdXNoKGhpdCk7IH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAob3B0aW9ucy5yZWN1cnNlIHx8IG9wdGlvbnMucmVjdXJzZU93biAmJiBvYmogPT09IHJvb3QgfHwgb3B0aW9ucy5yZWN1cnNlQ2hhaW4gJiYgb2JqICE9PSByb290KSAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBwcm9wID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgICAgICAgICFpc0RvbU5vZGUocHJvcCkgJiYgLy8gZG9uJ3Qgc2VhcmNoIERPTSBvYmplY3RzXG4gICAgICAgICAgICAgICAgc2Nhbm5lZC5pbmRleE9mKHByb3ApIDwgMCAvLyBkb24ndCByZWN1cnNlIG9uIG9iamVjdHMgYWxyZWFkeSBzY2FubmVkXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9wTmFtZSBtdXN0IGJlIGB2YWx1ZWBcbiAgICAgICAgICAgICAgICBtYXRjaC5jYWxsKHByb3AsIHBhdHRlcm4sIG9wdGlvbnMsIGJ5R3JleWxpc3QsIG1hdGNoZXMsIHNjYW5uZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGlmICh0b3BMZXZlbENhbGwpIHtcbiAgICAgICAgbWF0Y2hlcy5zb3J0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWF0Y2g7IiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBsb2dFdmVudE9iamVjdChlKSB7XG4gICAgdGhpcy5sb2coZS50eXBlLCAnOjonLCBlKTtcbn1cblxuZnVuY3Rpb24gbG9nRGV0YWlsKGUpIHtcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsIGUuZGV0YWlsKTtcbn1cblxuZnVuY3Rpb24gbG9nU2Nyb2xsKGUpIHtcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsIGUuZGV0YWlsLnZhbHVlKTtcbn1cblxuZnVuY3Rpb24gbG9nQ2VsbChlKSB7XG4gICAgdmFyIGdDZWxsID0gZS5kZXRhaWwuZ3JpZENlbGw7XG4gICAgdmFyIGRDZWxsID0gZS5kZXRhaWwuZGF0YUNlbGw7XG4gICAgdGhpcy5sb2coZS50eXBlLCAnOjonLFxuICAgICAgICAnZ3JpZC1jZWxsOicsIHsgeDogZ0NlbGwueCwgeTogZ0NlbGwueSB9LFxuICAgICAgICAnZGF0YS1jZWxsOicsIHsgeDogZENlbGwueCwgeTogZENlbGwueSB9KTtcbn1cblxuZnVuY3Rpb24gbG9nU2VsZWN0aW9uKGUpIHtcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsIGUuZGV0YWlsLnJvd3MsIGUuZGV0YWlsLmNvbHVtbnMsIGUuZGV0YWlsLnNlbGVjdGlvbnMpO1xufVxuXG5mdW5jdGlvbiBsb2dSb3coZSkge1xuICAgIHZhciByb3dDb250ZXh0ID0gZS5kZXRhaWwucHJpbWl0aXZlRXZlbnQuZGF0YVJvdztcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsICdyb3ctY29udGV4dDonLCByb3dDb250ZXh0KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ2Zpbi1jZWxsLWVudGVyJzogbG9nQ2VsbCxcbiAgICAnZmluLWNsaWNrJzogbG9nQ2VsbCxcbiAgICAnZmluLWRvdWJsZS1jbGljayc6IGxvZ1JvdyxcbiAgICAnZmluLXNlbGVjdGlvbi1jaGFuZ2VkJzogbG9nU2VsZWN0aW9uLFxuICAgICdmaW4tY29udGV4dC1tZW51JzogbG9nQ2VsbCxcblxuICAgICdmaW4tc2Nyb2xsLXgnOiBsb2dTY3JvbGwsXG4gICAgJ2Zpbi1zY3JvbGwteSc6IGxvZ1Njcm9sbCxcblxuICAgICdmaW4tcm93LXNlbGVjdGlvbi1jaGFuZ2VkJzogbG9nRGV0YWlsLFxuICAgICdmaW4tY29sdW1uLXNlbGVjdGlvbi1jaGFuZ2VkJzogbG9nRGV0YWlsLFxuICAgICdmaW4tZWRpdG9yLWRhdGEtY2hhbmdlJzogbG9nRGV0YWlsLFxuICAgICdmaW4tZWRpdG9yLWtleXVwJzogbG9nRGV0YWlsLFxuICAgICdmaW4tZWRpdG9yLWtleXByZXNzJzogbG9nRGV0YWlsLFxuICAgICdmaW4tZWRpdG9yLWtleWRvd24nOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1ncm91cHMtY2hhbmdlZCc6IGxvZ0RldGFpbCxcblxuICAgICdmaW4tZmlsdGVyLWFwcGxpZWQnOiBsb2dFdmVudE9iamVjdCxcbiAgICAnZmluLXJlcXVlc3QtY2VsbC1lZGl0JzogbG9nRXZlbnRPYmplY3QsXG4gICAgJ2Zpbi1iZWZvcmUtY2VsbC1lZGl0JzogbG9nRXZlbnRPYmplY3QsXG4gICAgJ2Zpbi1hZnRlci1jZWxsLWVkaXQnOiBsb2dFdmVudE9iamVjdFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFN0YXJMb2cgPSByZXF1aXJlKCdzdGFybG9nJyk7XG5cbnZhciBldmVudExvZ2dlclBsdWdpbiA9IHtcblxuICAgIHN0YXJ0OiBmdW5jdGlvbihvcHRpb25zKVxuICAgIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgdGhpcy5zdGFybG9nKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJsb2cuc3RvcCgpOyAvLyBzdG9wIHRoZSBvbGQgb25lIGJlZm9yZSByZWRlZmluaW5nIGl0IHdpdGggbmV3IG9wdGlvbnMgb2JqZWN0XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuc3RhcmxvZyB8fCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIC8vIHNlYXJjaCBncmlkIG9iamVjdCBmb3IgXCJFdmVudCgneWFkYS15YWRhJ1wiIG9yIFwiRXZlbnQuY2FsbCh0aGlzLCAneWFkYS15YWRhJ1wiXG4gICAgICAgICAgICBvcHRpb25zLnNlbGVjdCA9IG9wdGlvbnMuc2VsZWN0IHx8IHRoaXM7XG4gICAgICAgICAgICBvcHRpb25zLnBhdHRlcm4gPSBvcHRpb25zLnBhdHRlcm4gfHwgL0V2ZW50KFxcLmNhbGxcXCh0aGlzLCB8XFwoKScoZmluLVthLXotXSspJy87XG4gICAgICAgICAgICBvcHRpb25zLnRhcmdldHMgPSBvcHRpb25zLnRhcmdldHMgfHwgdGhpcy5jYW52YXMuY2FudmFzO1xuXG4gICAgICAgICAgICAvLyBtaXggb3B0aW9ucy5saXN0ZW5lckRpY3Rpb25hcnkgb24gdG9wIG9mIHNvbWUgY3VzdG9tIGxpc3RlbmVyc1xuICAgICAgICAgICAgb3B0aW9ucy5saXN0ZW5lckRpY3Rpb25hcnkgPSBPYmplY3QuYXNzaWduKHt9LCByZXF1aXJlKCcuL2N1c3RvbS1saXN0ZW5lcnMnKSwgb3B0aW9ucy5saXN0ZW5lckRpY3Rpb25hcnkpO1xuXG4gICAgICAgICAgICAvLyBtaXggZmluLXRpY2sgb24gdG9wIG9mIG9wdGlvbnMubWF0Y2guZ3JleWxpc3QuYmxhY2tcbiAgICAgICAgICAgIHZhciBibGFjayA9IFsnZmluLXRpY2snXTtcbiAgICAgICAgICAgIG9wdGlvbnMubWF0Y2ggPSBvcHRpb25zLm1hdGNoIHx8IHt9O1xuICAgICAgICAgICAgb3B0aW9ucy5tYXRjaC5ncmV5bGlzdCA9IG9wdGlvbnMubWF0Y2guZ3JleWxpc3QgfHwge307XG4gICAgICAgICAgICBvcHRpb25zLm1hdGNoLmdyZXlsaXN0LmJsYWNrID0gb3B0aW9ucy5tYXRjaC5ncmV5bGlzdC5ibGFjayA/IGJsYWNrLmNvbmNhdChvcHRpb25zLm1hdGNoLmdyZXlsaXN0LmJsYWNrKSA6IGJsYWNrO1xuXG4gICAgICAgICAgICB0aGlzLnN0YXJsb2cgPSBuZXcgU3RhckxvZyhvcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RhcmxvZy5zdGFydCgpO1xuICAgIH0sXG5cbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zdGFybG9nLnN0b3AoKTtcbiAgICB9XG5cbn07XG5cbi8vIE5vbi1lbnVtZXJhYmxlIG1ldGhvZHMgYXJlIG5vdCB0aGVtc2VsdmVzIGluc3RhbGxlZDpcbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGV2ZW50TG9nZ2VyUGx1Z2luLCB7XG4gICAgcHJlaW5zdGFsbDoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24oSHlwZXJncmlkUHJvdG90eXBlLCBCZWhhdmlvclByb3RvdHlwZSwgbWV0aG9kUHJlZml4KSB7XG4gICAgICAgICAgICBpbnN0YWxsLmNhbGwodGhpcywgSHlwZXJncmlkUHJvdG90eXBlLCBtZXRob2RQcmVmaXgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluc3RhbGw6IHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uKGdyaWQsIG1ldGhvZFByZWZpeCkge1xuICAgICAgICAgICAgaW5zdGFsbC5jYWxsKHRoaXMsIGdyaWQsIG1ldGhvZFByZWZpeCk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuZnVuY3Rpb24gaW5zdGFsbCh0YXJnZXQsIG1ldGhvZFByZWZpeCkge1xuICAgIGlmIChtZXRob2RQcmVmaXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtZXRob2RQcmVmaXggPSAnbG9nJztcbiAgICB9XG4gICAgT2JqZWN0LmtleXModGhpcykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHRhcmdldFtwcmVmaXgobWV0aG9kUHJlZml4LCBrZXkpXSA9IHRoaXNba2V5XTtcbiAgICB9LCB0aGlzKTtcbn1cblxuZnVuY3Rpb24gcHJlZml4KHByZWZpeCwgbmFtZSkge1xuICAgIHZhciBjYXBpdGFsaXplID0gcHJlZml4Lmxlbmd0aCAmJiBwcmVmaXhbcHJlZml4Lmxlbmd0aCAtIDFdICE9PSAnXyc7XG4gICAgaWYgKGNhcGl0YWxpemUpIHtcbiAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyBuYW1lLnN1YnN0cigxKTtcbiAgICB9XG4gICAgcmV0dXJuIHByZWZpeCArIG5hbWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRMb2dnZXJQbHVnaW47XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKiBDcmVhdGVzIGFuIG9iamVjdCB3aXRoIGEgYHRlc3RgIG1ldGhvZCBmcm9tIG9wdGlvbmFsIHdoaXRlbGlzdCBhbmQvb3IgYmxhY2tsaXN0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBJZiBuZWl0aGVyIGB3aGl0ZWAgbm9yIGBibGFja2AgYXJlIGdpdmVuLCBhbGwgc3RyaW5ncyBwYXNzIGB0ZXN0YC5cbiAqIEBwYXJhbSBbb3B0aW9ucy53aGl0ZV0gLSBJZiBnaXZlbiwgb25seSBsaXN0ZWQgc3RyaW5ncyBwYXNzIGB0ZXN0YC5cbiAqIEBwYXJhbSBbb3B0aW9ucy5ibGFja10gLSBJZiBnaXZlbiwgbGlzdGVkIHN0cmluZ3MgZmFpbCBgdGVzdGAuXG4gKi9cbmZ1bmN0aW9uIEdyZXlMaXN0KG9wdGlvbnMpIHtcbiAgICB0aGlzLndoaXRlID0gZ2V0RmxhdEFycmF5T2ZSZWdleEFuZE9yU3RyaW5nKG9wdGlvbnMgJiYgb3B0aW9ucy53aGl0ZSk7XG4gICAgdGhpcy5ibGFjayA9IGdldEZsYXRBcnJheU9mUmVnZXhBbmRPclN0cmluZyhvcHRpb25zICYmIG9wdGlvbnMuYmxhY2spO1xufVxuXG5HcmV5TGlzdC5wcm90b3R5cGUudGVzdCA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHRoaXMuc3RyaW5nID0gc3RyaW5nOyAvLyBmb3IgbWF0Y2goKSB1c2VcbiAgICByZXR1cm4gKFxuICAgICAgICAhKHRoaXMud2hpdGUgJiYgIXRoaXMud2hpdGUuc29tZShtYXRjaCwgdGhpcykpICYmXG4gICAgICAgICEodGhpcy5ibGFjayAmJiB0aGlzLmJsYWNrLnNvbWUobWF0Y2gsIHRoaXMpKVxuICAgICk7XG59O1xuXG5mdW5jdGlvbiBtYXRjaChwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBwYXR0ZXJuLnRlc3QgPT09ICdmdW5jdGlvbidcbiAgICAgICAgPyBwYXR0ZXJuLnRlc3QodGhpcy5zdHJpbmcpIC8vIHR5cGljYWxseSBhIHJlZ2V4IGJ1dCBjb3VsZCBiZSBhbnl0aGluZyB0aGF0IGltcGxlbWVudHMgYHRlc3RgXG4gICAgICAgIDogdGhpcy5zdHJpbmcgPT09IHBhdHRlcm4gKyAnJzsgLy8gY29udmVydCBwYXR0ZXJuIHRvIHN0cmluZyBldmVuIGZvciBlZGdlIGNhc2VzXG59XG5cbmZ1bmN0aW9uIGdldEZsYXRBcnJheU9mUmVnZXhBbmRPclN0cmluZyhhcnJheSwgZmxhdCkge1xuICAgIGlmICghZmxhdCkge1xuICAgICAgICAvLyB0aGlzIGlzIHRoZSB0b3AtbGV2ZWwgKG5vbi1yZWN1cnNlZCkgY2FsbCBzbyBpbnRpYWxpemU6XG5cbiAgICAgICAgLy8gYHVuZGVmaW5lZGAgcGFzc2VzIHRocm91Z2ggd2l0aG91dCBiZWluZyBjb252ZXJ0ZWQgdG8gYW4gYXJyYXlcbiAgICAgICAgaWYgKGFycmF5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFycmF5aWZ5IGdpdmVuIHNjYWxhciBzdHJpbmcsIHJlZ2V4LCBvciBvYmplY3RcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5KSkge1xuICAgICAgICAgICAgYXJyYXkgPSBbYXJyYXldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBmbGF0XG4gICAgICAgIGZsYXQgPSBbXTtcbiAgICB9XG5cbiAgICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIC8vIG1ha2Ugc3VyZSBhbGwgZWxlbWVudHMgYXJlIGVpdGhlciBzdHJpbmcgb3IgUmVnRXhwXG4gICAgICAgIHN3aXRjaCAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGl0ZW0pKSB7XG4gICAgICAgICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAgICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzpcbiAgICAgICAgICAgICAgICBmbGF0LnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdbb2JqZWN0IE9iamVjdF0nOlxuICAgICAgICAgICAgICAgIC8vIHJlY3Vyc2Ugb24gY29tcGxleCBpdGVtICh3aGVuIGFuIG9iamVjdCBvciBhcnJheSlcbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29udmVydCBvYmplY3QgaW50byBhbiBhcnJheSAob2YgaXQncyBlbnVtZXJhYmxlIGtleXMsIGJ1dCBvbmx5IHdoZW4gbm90IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5rZXlzKGl0ZW0pLmZpbHRlcihmdW5jdGlvbiAoa2V5KSB7IHJldHVybiBpdGVtW2tleV0gIT09IHVuZGVmaW5lZDsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGdldEZsYXRBcnJheU9mUmVnZXhBbmRPclN0cmluZyhpdGVtLCBmbGF0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgZmxhdC5wdXNoKGl0ZW0gKyAnJyk7IC8vIGNvbnZlcnQgdG8gc3RyaW5nXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBmbGF0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyZXlMaXN0OyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAc3VtbWFyeSBGaW5kIGFsbCBwYXR0ZXJuIG1hdGNoZXMsIHJldHVybiBzcGVjaWZpZWQgY2FwdHVyZSBncm91cCBmb3IgZWFjaC5cbiAqIEByZXR1cm5zIHtzdHJpbmdbXX0gQW4gYXJyYXkgY29udGFpbmluZyBhbGwgdGhlIHBhdHRlcm4gbWF0Y2hlcyBmb3VuZCBpbiBgc3RyaW5nYC5cbiAqIFRoZSBlbnRpcmUgcGF0dGVybiBtYXRjaCBpcyByZXR1cm5lZCB1bmxlc3MgdGhlIHBhdHRlcm4gY29udGFpbnMgb25lIG9yIG1vcmUgc3ViZ3JvdXBzIGluIHdoaWNoIGNhc2UgdGhlIHBvcnRpb24gb2YgdGhlIHBhdHRlcm4gbWF0Y2hlZCBieSB0aGUgbGFzdCBzdWJncm91cCBpcyByZXR1cm5lZCB1bmxlc3MgYGNhcHR1cmVHcm91cGAgaXMgZGVmaW5lZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmdcbiAqIEBwYXJhbSB7UmVnRXhwfSByZWdleCAtIERvbid0IHVzZSBnbG9iYWwgZmxhZzsgaXQncyB1bm5lY2Vzc2FyeSBhbmQgc3VwcHJlc3NlcyBzdWJtYXRjaGVzIG9mIGNhcHR1cmUgZ3JvdXBzLlxuICogQHBhcmFtIHtudW1iZXJ9IFtjYXB0dXJlR3JvdXBdIC0gSWZmIGRlZmluZWQsIGluZGV4IG9mIGEgc3BlY2lmaWMgY2FwdHVyZSBncm91cCB0byByZXR1cm4uXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyaW5nLCByZWdleCwgY2FwdHVyZUdyb3VwKSB7XG4gICAgdmFyIG1hdGNoZXMgPSBbXTtcblxuICAgIGZvciAodmFyIG1hdGNoLCBpID0gMDsgKG1hdGNoID0gc3RyaW5nLnN1YnN0cihpKS5tYXRjaChyZWdleCkpOyBpICs9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChtYXRjaFtjYXB0dXJlR3JvdXAgPT09IHVuZGVmaW5lZCA/IG1hdGNoLmxlbmd0aCAtIDEgOiBjYXB0dXJlR3JvdXBdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hlcztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBHcmV5bGlzdCA9IHJlcXVpcmUoJ2dyZXlsaXN0Jyk7XG5cbi8qKiBAc3VtbWFyeSBDYXRhbG9nIHRoZSBleGVjdXRpb24gY29udGV4dCBvYmplY3QuXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBBbiBvYmplY3QgY29udGFpbmluZyBhIG1lbWJlciBmb3IgZWFjaCBtZW1iZXIgb2YgdGhlIGV4ZWN1dGlvbiBjb250ZXh0IG9iamVjdFxuICogdmlzaWJsZSBpbiB0aGUgcHJvdG90eXBlIGNoYWluIChiYWNrIHRvIGJ1dCBub3QgaW5jbHVkaW5nIE9iamVjdCksIHBlciB3aGl0ZWxpc3QgYW5kIGJsYWNrbGlzdC5cbiAqIEVhY2ggbWVtYmVyJ3MgdmFsdWUgaXMgdGhlIG9iamVjdCBpbiB0aGUgcHJvdG90eXBlIGNoYWluIHdoZXJlIGZvdW5kLlxuICogQHBhcmFtIFtvcHRpb25zXVxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5vd25dIC0gUmVzdHJpY3Qgc2VhcmNoIGZvciBldmVudCB0eXBlIHN0cmluZ3MgdG8gb3duIG1ldGhvZHMgcmF0aGVyIHRoYW4gZW50aXJlIHByb3RvdHlwZSBjaGFpbi5cbiAqIEBwYXJhbSBbb3B0aW9ucy5ncmV5bGlzdF1cbiAqIEBwYXJhbSBbb3B0aW9ucy5ncmV5bGlzdC53aGl0ZV0gLSBJZiBnaXZlbiwgb25seSBsaXN0ZWQgbWVtYmVycyBhcmUgY2F0YWxvZ2VkLlxuICogQHBhcmFtIFtvcHRpb25zLmdyZXlsaXN0LmJsYWNrXSAtIElmIGdpdmVuLCBsaXN0ZWQgbWVtYmVycyBhcmUgKm5vdCogY2F0YWxvZ2VkLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG9iamVjdENhdGFsb2cob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgdmFyIG9iaixcbiAgICAgICAgY2F0YWxvZyA9IE9iamVjdC5jcmVhdGUobnVsbCksIC8vIEtJU1Mgbm8gcHJvdG90eXBlIG5lZWRlZFxuICAgICAgICB3YWxrUHJvdG90eXBlQ2hhaW4gPSAhb3B0aW9ucy5vd24sXG4gICAgICAgIGdyZXlsaXN0ID0gbmV3IEdyZXlsaXN0KG9wdGlvbnMuZ3JleWxpc3QpO1xuXG4gICAgZm9yIChvYmogPSB0aGlzOyBvYmogJiYgb2JqICE9PSBPYmplY3QucHJvdG90eXBlOyBvYmogPSB3YWxrUHJvdG90eXBlQ2hhaW4gJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikpIHtcbiAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICEoa2V5IGluIGNhdGFsb2cpICYmIC8vIG5vdCBzaGFkb3dlZCBieSBhIG1lbWJlciBvZiBhIGRlc2NlbmRhbnQgb2JqZWN0XG4gICAgICAgICAgICAgICAgZ3JleWxpc3QudGVzdChrZXkpICYmXG4gICAgICAgICAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSkudmFsdWUgIT09IG9iamVjdENhdGFsb2dcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGNhdGFsb2dba2V5XSA9IG9iajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhdGFsb2c7XG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1hdGNoID0gcmVxdWlyZSgnY29kZS1tYXRjaCcpO1xuXG4vKiogQHR5cGVkZWYge29iamVjdH0gc3RhcmxvZ2dlclxuICogQGRlc2MgQW4gZXZlbnQgbGlzdGVuZXIgZm9yIGxvZ2dpbmcgcHVycG9zZXMsIHBhaXJlZCB3aXRoIHRoZSB0YXJnZXQocykgdG8gbGlzdGVuIHRvLlxuICogRWFjaCBtZW1iZXIgb2YgYSBsb2dnZXIgb2JqZWN0IGhhcyB0aGUgZXZlbnQgc3RyaW5nIGFzIGl0cyBrZXkgYW5kIGFuIG9iamVjdCBhcyBpdHMgdmFsdWUuXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBsaXN0ZW5lciAtIEEgaGFuZGxlciB0aGF0IGxvZ3MgdGhlIGV2ZW50LlxuICogQHByb3BlcnR5IHtvYmplY3R8b2JqZWN0W119IHRhcmdldHMgLSBBIHRhcmdldCBvciBsaXN0IG9mIHRhcmdldHMgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cbiAqL1xuXG4vKiogQHR5cGVkZWYge29iamVjdHxvYmplY3RbXX0gZXZlbnRUYXJnZXRzXG4gKiBFdmVudCB0YXJnZXQgb2JqZWN0KHMpIHRoYXQgaW1wbGVtZW50IGBhZGRFdmVudExpc3RlbmVyYCBhbmQgYHJlbW92ZUV2ZW50TGlzdGVuZXJgLFxuICogdHlwaWNhbGx5IGEgRE9NIG5vZGUsIGJ1dCBieSBubyBtZWFucyBsaW1pdGVkIHRvIHN1Y2guXG4gKi9cblxuLyoqIEB0eXBlZGVmIHtzdHJpbmd9IGV2ZW50VHlwZSAqL1xuXG4vKiogQHR5cGVkZWYge29iamVjdH0gc3RhcmxvZ09wdGlvbnNcbiAqXG4gKiBAZGVzYyBNdXN0IGRlZmluZSBgbG9nZ2Vyc2AsIGBldmVudHNgLCBvciBgcGF0dGVybmAgYW5kIGBzZWxlY3RgOyBlbHNlIGVycm9yIGlzIHRocm93bi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdC48ZXZlbnRUeXBlLCBzdGFybG9nZ2VyPn0gW2xvZ2dlcnNdIC0gTG9nZ2VyIGRpY3Rpb25hcnkuXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBbZXZlbnRzXSAtIExpc3Qgb2YgZXZlbnQgc3RyaW5ncyBmcm9tIHdoaWNoIHRvIGJ1aWxkIGEgbG9nZ2VyIGRpY3Rpb25hcnkuXG4gKiBAcGFyYW0ge29iamVjdHxvYmplY3RbXX0gW3NlbGVjdF0gLSBPYmplY3Qgb3IgbGlzdCBvZiBvYmplY3RzIGluIHdoaWNoIHRvIHNlYXJjaCB3aXRoIGBwYXR0ZXJuYC5cbiAqIEBwYXJhbSB7UmVnRXhwfSBbcGF0dGVybl0gLSBFdmVudCBzdHJpbmcgcGF0dGVybiB0byBzZWFyY2ggZm9yIGluIGFsbCB2aXNpYmxlIGdldHRlcnMsIHNldHRlcnMsIGFuZCBtZXRob2RzLlxuICogVGhlIHJlc3VsdHMgb2YgdGhlIHNlYXJjaCBhcmUgdXNlZCB0byBidWlsZCBhIGxvZ2dlciBkaWN0aW9uYXJ5LlxuICogRXhhbXBsZTogYC8nKGZpbi1bYS16LV0rKScvYCBtZWFucyBmaW5kIGFsbCBzdHJpbmdzIGxpa2UgYCdmaW4tKidgLCByZXR1cm5pbmcgb25seSB0aGUgcGFydCBpbnNpZGUgdGhlIHF1b3Rlcy5cbiAqIFNlZSB0aGUgUkVBRE1FIGZvciBhZGRpdGlvbmFsIGV4YW1wbGVzLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtsb2ddIC0gT3ZlcnJpZGUge0BsaW5rIFN0YXJsb2cjbG9nfS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtsaXN0ZW5lcl0gLSBPdmVycmlkZSB7QGxpbmsgU3RhcmxvZyNsaXN0ZW5lcn0uXG4gKiBAcGFyYW0ge29iamVjdH0gW3RhcmdldHNdIC0gT3ZlcnJpZGUge0BsaW5rIFN0YXJsb2cjdGFyZ2V0c30uXG4gKlxuICogQHBhcmFtIHtPYmplY3QuPGV2ZW50VHlwZSwgZnVuY3Rpb24+fSBbbGlzdGVuZXJEaWN0aW9uYXJ5PXt9XSAtIEN1c3RvbSBsaXN0ZW5lcnMgdG8gb3ZlcnJpZGUgZGVmYXVsdCBsaXN0ZW5lci5cbiAqIEBwYXJhbSB7T2JqZWN0LjxldmVudFR5cGUsIGV2ZW50VGFyZ2V0cz59IFt0YXJnZXRzRGljdGlvbmFyeT17fV0gLSBDdXN0b20gZXZlbnQgdGFyZ2V0IG9iamVjdChzKSB0byBvdmVycmlkZSBkZWZhdWx0IHRhcmdldHMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IFttYXRjaF0gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L2NvZGUtbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBbbWF0Y2guY2FwdHVyZUdyb3VwXSAtIElmZiBkZWZpbmVkLCBpbmRleCBvZiBhIHNwZWNpZmljIGNhcHR1cmUgZ3JvdXAgdG8gcmV0dXJuIGZvciBlYWNoIG1hdGNoLlxuICogQHBhcmFtIHtvYmplY3R9IFttYXRjaC5ncmV5bGlzdF0gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L2dyZXlsaXN0XG4gKiBAcGFyYW0gW21hdGNoLmdyZXlsaXN0LndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBtYXRjaGVzIGFyZSBpbmNsdWRlZCBpbiB0aGUgcmVzdWx0cy5cbiAqIEBwYXJhbSBbbWF0Y2guZ3JleWxpc3QuYmxhY2tdIC0gSWYgZ2l2ZW4sIGxpc3RlZCBtYXRjaGVzIGFyZSBleGNsdWRlZCBmcm9tIHRoZSByZXN1bHRzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBbbWF0Y2guY2F0YWxvZ10gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L29iamVjdC1jYXRhbG9nXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFttYXRjaC5jYXRhbG9nLm93bl0gLSBPbmx5IHNlYXJjaCBvd24gbWV0aG9kcyBmb3IgZXZlbnQgc3RyaW5nczsgb3RoZXJ3aXNlIGVudGlyZSBwcm90b3R5cGUgY2hhaW4uXG4gKiBAcGFyYW0ge29iamVjdH0gW21hdGNoLmNhdGFsb2cuZ3JleWxpc3RdIC0gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC9ncmV5bGlzdFxuICogQHBhcmFtIFttYXRjaC5jYXRhbG9nLmdyZXlsaXN0LndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBtZW1iZXJzIGFyZSBjYXRhbG9nZWQuXG4gKiBAcGFyYW0gW21hdGNoLmNhdGFsb2cuZ3JleWxpc3QuYmxhY2tdIC0gSWYgZ2l2ZW4sIGxpc3RlZCBtZW1iZXJzIGFyZSAqbm90KiBjYXRhbG9nZWQuXG4gKi9cblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBzdW1tYXJ5IEluc3RhbmNlIGEgbG9nZ2VyLlxuICogQGRlc2MgQ29uc3VtZXMgYG9wdGlvbnNgLCBjcmVhdGluZyBhIGRpY3Rpb25hcnkgb2YgZXZlbnQgc3RyaW5ncyBpbiBgdGhpcy5ldmVudHNgLlxuICpcbiAqIFNvdXJjZXMgZm9yIGxvZ2dlcnM6XG4gKiAqIElmIGBvcHRpb25zLmxvZ2dlcnNgIGRpY3Rpb25hcnkgb2JqZWN0IGlzIGRlZmluZWQsIGRlZXAgY2xvbmUgaXQgYW5kIG1ha2Ugc3VyZSBhbGwgbWVtYmVycyBhcmUgbG9nZ2VyIG9iamVjdHMsIGRlZmF1bHRpbmcgYW55IG1pc3NpbmcgbWVtYmVycy5cbiAqICogRWxzZSBpZiBgb3B0aW9ucy5ldmVudHNgIChsaXN0IG9mIGV2ZW50IHN0cmluZ3MpIGlzIGRlZmluZWQsIGNyZWF0ZSBhbiBvYmplY3Qgd2l0aCB0aG9zZSBrZXlzLCBsaXN0ZW5lcnMsIGFuZCB0YXJnZXRzLlxuICogKiBFbHNlIGlmIGBvcHRpb25zLnBhdHRlcm5gIGlzIGRlZmluZWQsIGNvZGUgZm91bmQgaW4gdGhlIGV4ZWN1dGlvbiBjb250ZXh0IG9iamVjdCBpcyBzZWFyY2hlZCBmb3IgZXZlbnQgc3RyaW5ncyB0aGF0IG1hdGNoIGl0IChwZXIgYG9wdGlvbnMubWF0Y2hgKS5cbiAqXG4gKiBFdmVudHMgc3BlY2lmaWVkIHdpdGggYG9wdGlvbnMuZXZlbnRzYCBhbmQgYG9wdGlvbnMucGF0dGVybmAgbG9nIHVzaW5nIHRoZSBkZWZhdWx0IGxpc3RlbmVyIGFuZCBldmVudCB0YXJnZXRzOlxuICogKiBgU3RhckxvZy5wcm90b3R5cGUubGlzdGVuZXJgLCB1bmxlc3Mgb3ZlcnJpZGRlbiwganVzdCBjYWxscyBgdGhpcy5sb2coKWAgd2l0aCB0aGUgZXZlbnQgc3RyaW5nLCB3aGljaCBpcyBzdWZmaWNpZW50IGZvciBjYXN1YWwgdXNhZ2UuXG4gKiBPdmVycmlkZSBpdCBieSBkZWZpbmluZyBgb3B0aW9ucy5saXN0ZW5lcmAgb3IgZGlyZWN0bHkgYnkgcmVhc3NpZ25pbmcgdG8gYFN0YXJMb2cucHJvdG90eXBlLmxpc3RlbmVyYCBiZWZvcmUgaW5zdGFudGlhdGlvbi5cbiAqICogYFN0YXJMb2cucHJvdG90eXBlLnRhcmdldHNgLCB1bmxlc3Mgb3ZlcnJpZGRlbiwgaXMgYHdpbmRvdy5kb2N1bWVudGAgKHdoZW4gYXZhaWxhYmxlKSxcbiAqIHdoaWNoIGlzIG9ubHkgcmVhbGx5IHVzZWZ1bCBpZiB0aGUgZXZlbnQgaXMgZGlzcGF0Y2hlZCBkaXJlY3RseSB0byAob3IgaXMgYWxsb3dlZCB0byBidWJibGUgdXAgdG8pIGBkb2N1bWVudGAuXG4gKiBPdmVycmlkZSBpdCBieSBkZWZpbmluZyBgb3B0aW9ucy50YXJnZXRzYCBvciBkaXJlY3RseSBieSByZWFzc2lnbmluZyB0byBgU3RhckxvZy5wcm90b3R5cGUudGFyZ2V0c2AgYmVmb3JlIGluc3RhbnRpYXRpb24uXG4gKlxuICogRXZlbnRzIHNwZWNpZmllZCB3aXRoIGBvcHRpb25zLmxvZ2dlcnNgIGNhbiBlYWNoIHNwZWNpZnkgdGhlaXIgb3duIGxpc3RlbmVyIGFuZC9vciB0YXJnZXRzLCBidXQgaWYgbm90IHNwZWNpZmllZCwgdGhleSB0b28gd2lsbCBhbHNvIHVzZSB0aGUgYWJvdmUgZGVmYXVsdHMuXG4gKlxuICogQHBhcmFtIHtzdGFybG9nT3B0aW9uc30gW29wdGlvbnNdXG4gKi9cbmZ1bmN0aW9uIFN0YXJMb2cob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gT3ZlcnJpZGUgcHJvdG90eXBlIGRlZmluaXRpb25zIGlmIGFuZCBvbmx5IGlmIHN1cHBsaWVkIGluIG9wdGlvbnNcbiAgICBbJ2xvZycsICd0YXJnZXRzJywgJ2xpc3RlbmVyJ10uZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgaWYgKG9wdGlvbnNba2V5XSkgeyB0aGlzW2tleV0gPSBvcHRpb25zW2tleV07IH1cbiAgICB9LCB0aGlzKTtcblxuICAgIHZhciBkZWZhdWx0VGFyZ2V0ID0gb3B0aW9ucy50YXJnZXRzIHx8IHRoaXMudGFyZ2V0cyxcbiAgICAgICAgZGVmYXVsdExpc3RlbmVyID0gb3B0aW9ucy5saXN0ZW5lciB8fCB0aGlzLmxpc3RlbmVyLFxuICAgICAgICBsaXN0ZW5lckRpY3Rpb25hcnkgPSBvcHRpb25zLmxpc3RlbmVyRGljdGlvbmFyeSB8fCB7fSxcbiAgICAgICAgdGFyZ2V0c0RpY3Rpb25hcnkgPSBvcHRpb25zLnRhcmdldHNEaWN0aW9uYXJ5IHx8IHt9LFxuICAgICAgICBsb2dnZXJzID0gb3B0aW9ucy5sb2dnZXJzLFxuICAgICAgICBldmVudFN0cmluZ3M7XG5cbiAgICBpZiAobG9nZ2Vycykge1xuICAgICAgICBldmVudFN0cmluZ3MgPSBPYmplY3Qua2V5cyhsb2dnZXJzKTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZXZlbnRzKSB7XG4gICAgICAgIGxvZ2dlcnMgPSB7fTtcbiAgICAgICAgZXZlbnRTdHJpbmdzID0gb3B0aW9ucy5ldmVudHM7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLnBhdHRlcm4gJiYgb3B0aW9ucy5zZWxlY3QpIHtcbiAgICAgICAgbG9nZ2VycyA9IHt9O1xuICAgICAgICBldmVudFN0cmluZ3MgPSBhcnJheWlmeShvcHRpb25zLnNlbGVjdCkucmVkdWNlKGZ1bmN0aW9uKG1hdGNoZXMsIG9iamVjdCkge1xuICAgICAgICAgICAgbWF0Y2guY2FsbChvYmplY3QsIG9wdGlvbnMucGF0dGVybiwgb3B0aW9ucy5tYXRjaCkuZm9yRWFjaChmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcy5pbmRleE9mKG1hdGNoKSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKG1hdGNoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVzO1xuICAgICAgICB9LCBbXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBgb3B0aW9ucy5sb2dnZXJzYCwgYG9wdGlvbnMuZXZlbnRzYCwgb3IgYG9wdGlvbnMucGF0dGVybmAgYW5kIGBvcHRpb25zLnNlbGVjdGAgdG8gYmUgZGVmaW5lZC4nKTtcbiAgICB9XG5cbiAgICB2YXIgc3RhcmxvZyA9IHRoaXM7XG5cbiAgICAvKipcbiAgICAgKiBEaWN0aW9uYXJ5IG9mIGV2ZW50IHN0cmluZ3Mgd2l0aCBsaXN0ZW5lciBhbmQgdGFyZ2V0KHMpLlxuICAgICAqIEB0eXBlIHtPYmplY3QuPGV2ZW50VHlwZSwgc3RhcmxvZ2dlcj59XG4gICAgICovXG4gICAgdGhpcy5ldmVudHMgPSBldmVudFN0cmluZ3MucmVkdWNlKGZ1bmN0aW9uKGNsb25lLCBldmVudFN0cmluZykge1xuICAgICAgICB2YXIgbG9nZ2VyID0gT2JqZWN0LmFzc2lnbih7fSwgbG9nZ2Vyc1tldmVudFN0cmluZ10pOyAvLyBjbG9uZSBlYWNoIGxvZ2dlclxuXG4gICAgICAgIC8vIGJpbmQgdGhlIGxpc3RlbmVyIHRvIHN0YXJsb2cgZm9yIGB0aGlzLmxvZ2AgYWNjZXNzIHRvIFN0YXJsb2cjbG9nIGZyb20gd2l0aGluIGxpc3RlbmVyXG4gICAgICAgIGxvZ2dlci5saXN0ZW5lciA9IChsb2dnZXIubGlzdGVuZXIgfHwgbGlzdGVuZXJEaWN0aW9uYXJ5W2V2ZW50U3RyaW5nXSB8fCBkZWZhdWx0TGlzdGVuZXIpLmJpbmQoc3RhcmxvZyk7XG4gICAgICAgIGxvZ2dlci50YXJnZXRzID0gYXJyYXlpZnkobG9nZ2VyLnRhcmdldHMgfHwgdGFyZ2V0c0RpY3Rpb25hcnlbZXZlbnRTdHJpbmddIHx8IGRlZmF1bHRUYXJnZXQpO1xuXG4gICAgICAgIGNsb25lW2V2ZW50U3RyaW5nXSA9IGxvZ2dlcjtcblxuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfSwge30pO1xufVxuXG5TdGFyTG9nLnByb3RvdHlwZSA9IHtcbiAgICBjb25zdHJ1Y3RvcjogU3RhckxvZy5wcm90b3R5cGUuY29uc3RydWN0b3IsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICogQGRlZmF1bHQgY29uc29sZS5sb2cuYmluZChjb25zb2xlKVxuICAgICAqL1xuICAgIGxvZzogY29uc29sZS5sb2cuYmluZChjb25zb2xlKSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBmdW5jdGlvbihlKSB7IHRoaXMubG9nKGUudHlwZSk7IH07XG4gICAgICovXG4gICAgbGlzdGVuZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhpcy5sb2coZS50eXBlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge29iamVjdH1cbiAgICAgKiBAZGVmYXVsdCB3aW5kb3cuZG9jdW1lbnRcbiAgICAgKi9cbiAgICB0YXJnZXRzOiB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyAmJiB3aW5kb3cuZG9jdW1lbnQsXG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIFN0YXJsb2cjc3RhcnRcbiAgICAgKiBAc3VtbWFyeSBTdGFydCBsb2dnaW5nIGV2ZW50cy5cbiAgICAgKiBAZGVzYyBBZGQgbmV3IGV2ZW50IGxpc3RlbmVycyBmb3IgbG9nZ2luZyBwdXJwb3Nlcy5cbiAgICAgKiBPbGQgZXZlbnQgbGlzdGVuZXJzLCBpZiBhbnksIGFyZSByZW1vdmVkIGZpcnN0LCBiZWZvcmUgYWRkaW5nIG5ldyBvbmVzLlxuICAgICAqL1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICBldmVudExpc3RlbmVyKHRoaXMuZXZlbnRzLCAnYWRkJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgU3RhcmxvZyNzdG9wXG4gICAgICogQHN1bW1hcnkgU3RvcCBsb2dnaW5nIGV2ZW50cy5cbiAgICAgKiBAZGVzYyBFdmVudCBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQgZnJvbSB0YXJnZXRzIGFuZCBkZWxldGVkLlxuICAgICAqL1xuICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXZlbnRMaXN0ZW5lcih0aGlzLmV2ZW50cywgJ3JlbW92ZScpO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGV2ZW50TGlzdGVuZXIoZGljdGlvbmFyeSwgbWV0aG9kUHJlZml4KSB7XG4gICAgaWYgKCFkaWN0aW9uYXJ5KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbWV0aG9kID0gbWV0aG9kUHJlZml4ICsgJ0V2ZW50TGlzdGVuZXInO1xuXG4gICAgT2JqZWN0LmtleXMoZGljdGlvbmFyeSkuZm9yRWFjaChmdW5jdGlvbihldmVudFR5cGUpIHtcbiAgICAgICAgdmFyIGV2ZW50TG9nZ2VyID0gZGljdGlvbmFyeVtldmVudFR5cGVdO1xuICAgICAgICBldmVudExvZ2dlci50YXJnZXRzLmZvckVhY2goZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgICAgICB0YXJnZXRbbWV0aG9kXShldmVudFR5cGUsIGV2ZW50TG9nZ2VyLmxpc3RlbmVyKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGFycmF5aWZ5KHgpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh4KSA/IHggOiBbeF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhckxvZzsiXX0=
