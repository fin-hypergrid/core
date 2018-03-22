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
        initCellEditors = require('./celleditors'),
        initDashboard = require('./dashboard'),
        initEvents = require('./events');

    // convert field names containing underscore to camel case by overriding column enum decorator
    Hypergrid.behaviors.JSON.prototype.columnEnumKey = Hypergrid.behaviors.JSON.columnEnumDecorators.toCamelCase;

    var schema = Hypergrid.lib.fields.getSchema(people1);

    // as of v2.1.6, column properties can also be initialized from custom schema (as well as from a grid state object).
    // The following demonstrates this. Note that demo/setState.js also sets props of 'height' column. The setState
    // call therein was changed to addState to accommodate (else schema props defined here would have been cleared).
    Object.assign(schema.find(function(columnSchema) { return columnSchema.name === 'height'; }), {
        halign: 'right',
        // format: 'foot' --- for demo purposes, this prop being set in setState.js (see)
    });

    var gridOptions = {
            data: people1,
            margin: { bottom: '17px', right: '17px'},
            schema: schema,
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
        options = Object.assign({}, options);
        options.schema = options.schema || [];
        grid.setData(data, options);
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

},{"./celleditors":1,"./cellrenderers":2,"./dashboard":3,"./events":4,"./formatters":5,"./setState":7,"fin-hypergrid-event-logger":10}],7:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZW1vL2pzL2RlbW8vY2VsbGVkaXRvcnMuanMiLCJkZW1vL2pzL2RlbW8vY2VsbHJlbmRlcmVycy5qcyIsImRlbW8vanMvZGVtby9kYXNoYm9hcmQuanMiLCJkZW1vL2pzL2RlbW8vZXZlbnRzLmpzIiwiZGVtby9qcy9kZW1vL2Zvcm1hdHRlcnMuanMiLCJkZW1vL2pzL2RlbW8vaW5kZXguanMiLCJkZW1vL2pzL2RlbW8vc2V0U3RhdGUuanMiLCJub2RlX21vZHVsZXMvY29kZS1tYXRjaC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9maW4taHlwZXJncmlkLWV2ZW50LWxvZ2dlci9jdXN0b20tbGlzdGVuZXJzLmpzIiwibm9kZV9tb2R1bGVzL2Zpbi1oeXBlcmdyaWQtZXZlbnQtbG9nZ2VyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dyZXlsaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21hdGNoLXBvaW50L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1jYXRhbG9nL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N0YXJsb2cvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkZW1vLCBncmlkKSB7XG5cbiAgICB2YXIgaWR4ID0gZ3JpZC5iZWhhdmlvci5jb2x1bW5FbnVtO1xuXG4gICAgdmFyIENlbGxFZGl0b3IgPSBncmlkLmNlbGxFZGl0b3JzLkJhc2VDbGFzcztcbiAgICB2YXIgVGV4dGZpZWxkID0gZ3JpZC5jZWxsRWRpdG9ycy5nZXQoJ3RleHRmaWVsZCcpO1xuXG4gICAgdmFyIENvbG9yVGV4dCA9IFRleHRmaWVsZC5leHRlbmQoJ2NvbG9yVGV4dCcsIHtcbiAgICAgICAgdGVtcGxhdGU6ICc8aW5wdXQgdHlwZT1cInRleHRcIiBsYW5nPVwie3tsb2NhbGV9fVwiIHN0eWxlPVwiY29sb3I6e3t0ZXh0Q29sb3J9fVwiPidcbiAgICB9KTtcblxuICAgIGdyaWQuY2VsbEVkaXRvcnMuYWRkKENvbG9yVGV4dCk7XG5cbiAgICB2YXIgVGltZSA9IFRleHRmaWVsZC5leHRlbmQoJ1RpbWUnLCB7XG4gICAgICAgIHRlbXBsYXRlOiBbXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImh5cGVyZ3JpZC10ZXh0ZmllbGRcIiBzdHlsZT1cInRleHQtYWxpZ246cmlnaHQ7XCI+JyxcbiAgICAgICAgICAgICcgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgbGFuZz1cInt7bG9jYWxlfX1cIiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7IHdpZHRoOjc1JTsgdGV4dC1hbGlnbjpyaWdodDsgYm9yZGVyOjA7IHBhZGRpbmc6MDsgb3V0bGluZTowOyBmb250LXNpemU6aW5oZXJpdDsgZm9udC13ZWlnaHQ6aW5oZXJpdDsnICtcbiAgICAgICAgICAgICd7e3N0eWxlfX1cIj4nLFxuICAgICAgICAgICAgJyAgICA8c3Bhbj5BTTwvc3Bhbj4nLFxuICAgICAgICAgICAgJzwvZGl2PidcbiAgICAgICAgXS5qb2luKCdcXG4nKSxcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG4gICAgICAgICAgICB0aGlzLm1lcmlkaWFuID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XG5cbiAgICAgICAgICAgIC8vIEZsaXAgQU0vUE0gb24gYW55IGNsaWNrXG4gICAgICAgICAgICB0aGlzLmVsLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1lcmlkaWFuLnRleHRDb250ZW50ID0gdGhpcy5tZXJpZGlhbi50ZXh0Q29udGVudCA9PT0gJ0FNJyA/ICdQTScgOiAnQU0nO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5vbmNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7IC8vIGlnbm9yZSBjbGlja3MgaW4gdGhlIHRleHQgZmllbGRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmlucHV0Lm9uZm9jdXMgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICAgICAgICAgIHRoaXMuZWwuc3R5bGUub3V0bGluZSA9IHRoaXMub3V0bGluZSA9IHRoaXMub3V0bGluZSB8fCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpLm91dGxpbmU7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LnN0eWxlLm91dGxpbmUgPSAwO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5vbmJsdXIgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbC5zdHlsZS5vdXRsaW5lID0gMDtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRFZGl0b3JWYWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIENlbGxFZGl0b3IucHJvdG90eXBlLnNldEVkaXRvclZhbHVlLmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICAgICAgdmFyIHBhcnRzID0gdGhpcy5pbnB1dC52YWx1ZS5zcGxpdCgnICcpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC52YWx1ZSA9IHBhcnRzWzBdO1xuICAgICAgICAgICAgdGhpcy5tZXJpZGlhbi50ZXh0Q29udGVudCA9IHBhcnRzWzFdO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEVkaXRvclZhbHVlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgdmFsdWUgPSBDZWxsRWRpdG9yLnByb3RvdHlwZS5nZXRFZGl0b3JWYWx1ZS5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgICAgIGlmICh0aGlzLm1lcmlkaWFuLnRleHRDb250ZW50ID09PSAnUE0nKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgKz0gZGVtby5OT09OO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBncmlkLmNlbGxFZGl0b3JzLmFkZChUaW1lKTtcblxuICAgIC8vIFVzZWQgYnkgdGhlIGNlbGxQcm92aWRlci5cbiAgICAvLyBgbnVsbGAgbWVhbnMgY29sdW1uJ3MgZGF0YSBjZWxscyBhcmUgbm90IGVkaXRhYmxlLlxuICAgIHZhciBlZGl0b3JUeXBlcyA9IFtcbiAgICAgICAgbnVsbCxcbiAgICAgICAgJ3RleHRmaWVsZCcsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgJ3RpbWUnLFxuICAgICAgICAnY2hvaWNlJyxcbiAgICAgICAgJ2Nob2ljZScsXG4gICAgICAgICdjaG9pY2UnLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgJ3RleHRmaWVsZCcsXG4gICAgICAgICd0ZXh0ZmllbGQnXG4gICAgXTtcblxuICAgIC8vIE92ZXJyaWRlIHRvIGFzc2lnbiB0aGUgdGhlIGNlbGwgZWRpdG9ycy5cbiAgICBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbC5nZXRDZWxsRWRpdG9yQXQgPSBmdW5jdGlvbih4LCB5LCBkZWNsYXJlZEVkaXRvck5hbWUsIGNlbGxFdmVudCkge1xuICAgICAgICB2YXIgZWRpdG9yTmFtZSA9IGRlY2xhcmVkRWRpdG9yTmFtZSB8fCBlZGl0b3JUeXBlc1t4ICUgZWRpdG9yVHlwZXMubGVuZ3RoXTtcblxuICAgICAgICBzd2l0Y2ggKHgpIHtcbiAgICAgICAgICAgIGNhc2UgaWR4LmJpcnRoU3RhdGU6XG4gICAgICAgICAgICAgICAgY2VsbEV2ZW50LnRleHRDb2xvciA9ICdyZWQnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNlbGxFZGl0b3IgPSBncmlkLmNlbGxFZGl0b3JzLmNyZWF0ZShlZGl0b3JOYW1lLCBjZWxsRXZlbnQpO1xuXG4gICAgICAgIGlmIChjZWxsRWRpdG9yKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIGlkeC5lbXBsb3llZDpcbiAgICAgICAgICAgICAgICAgICAgY2VsbEVkaXRvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBpZHgudG90YWxOdW1iZXJPZlBldHNPd25lZDpcbiAgICAgICAgICAgICAgICAgICAgY2VsbEVkaXRvci5pbnB1dC5zZXRBdHRyaWJ1dGUoJ21pbicsIDApO1xuICAgICAgICAgICAgICAgICAgICBjZWxsRWRpdG9yLmlucHV0LnNldEF0dHJpYnV0ZSgnbWF4JywgMTApO1xuICAgICAgICAgICAgICAgICAgICBjZWxsRWRpdG9yLmlucHV0LnNldEF0dHJpYnV0ZSgnc3RlcCcsIDAuMDEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjZWxsRWRpdG9yO1xuICAgIH07XG59O1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkZW1vLCBncmlkKSB7XG5cbiAgICB2YXIgaWR4ID0gZ3JpZC5iZWhhdmlvci5jb2x1bW5FbnVtO1xuXG4gICAgLy9HRVQgQ0VMTFxuICAgIC8vYWxsIGZvcm1hdHRpbmcgYW5kIHJlbmRlcmluZyBwZXIgY2VsbCBjYW4gYmUgb3ZlcnJpZGRlbiBpbiBoZXJlXG4gICAgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuZ2V0Q2VsbCA9IGZ1bmN0aW9uKGNvbmZpZywgcmVuZGVyZXJOYW1lKSB7XG4gICAgICAgIGlmIChjb25maWcuaXNVc2VyRGF0YUFyZWEpIHtcbiAgICAgICAgICAgIHZhciBuLCBoZXgsIHRyYXZlbCxcbiAgICAgICAgICAgICAgICBjb2xJbmRleCA9IGNvbmZpZy5kYXRhQ2VsbC54LFxuICAgICAgICAgICAgICAgIHJvd0luZGV4ID0gY29uZmlnLmRhdGFDZWxsLnk7XG5cbiAgICAgICAgICAgIGlmIChkZW1vLnN0eWxlUm93c0Zyb21EYXRhKSB7XG4gICAgICAgICAgICAgICAgbiA9IGdyaWQuYmVoYXZpb3IuZ2V0Q29sdW1uKGlkeC50b3RhbE51bWJlck9mUGV0c093bmVkKS5nZXRWYWx1ZShyb3dJbmRleCk7XG4gICAgICAgICAgICAgICAgaGV4ID0gKDE1NSArIDEwICogKG4gJSAxMSkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICBjb25maWcuYmFja2dyb3VuZENvbG9yID0gJyMnICsgaGV4ICsgaGV4ICsgaGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzd2l0Y2ggKGNvbEluZGV4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBpZHgubGFzdE5hbWU6XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5jb2xvciA9IGNvbmZpZy52YWx1ZSAhPSBudWxsICYmIChjb25maWcudmFsdWUgKyAnJylbMF0gPT09ICdTJyA/ICdyZWQnIDogJyMxOTE5MTknO1xuICAgICAgICAgICAgICAgICAgICBjb25maWcubGluayA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBpZHguaW5jb21lOlxuICAgICAgICAgICAgICAgICAgICB0cmF2ZWwgPSA2MDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIGlkeC50cmF2ZWw6XG4gICAgICAgICAgICAgICAgICAgIHRyYXZlbCA9IDEwNTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0cmF2ZWwpIHtcbiAgICAgICAgICAgICAgICB0cmF2ZWwgKz0gTWF0aC5yb3VuZChjb25maWcudmFsdWUgKiAxNTAgLyAxMDAwMDApO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IgPSAnIzAwJyArIHRyYXZlbC50b1N0cmluZygxNikgKyAnMDAnO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5jb2xvciA9ICcjRkZGRkZGJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9UZXN0aW5nXG4gICAgICAgICAgICBpZiAoY29sSW5kZXggPT09IGlkeC50b3RhbE51bWJlck9mUGV0c093bmVkKSB7XG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBCZSBzdXJlIHRvIGFkanVzdCB0aGUgZGF0YSBzZXQgdG8gdGhlIGFwcHJvcHJpYXRlIHR5cGUgYW5kIHNoYXBlIGluIHdpZGVkYXRhLmpzXG4gICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICAvL3JldHVybiBzaW1wbGVDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gZW1wdHlDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gYnV0dG9uQ2VsbDsgLy9XT1JLU1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuIGVycm9yQ2VsbDsgLy9XT1JLUzogTm90ZWQgdGhhdCBhbnkgZXJyb3IgaW4gdGhpcyBmdW5jdGlvbiBzdGVhbHMgdGhlIG1haW4gdGhyZWFkIGJ5IHJlY3Vyc2lvblxuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHNwYXJrTGluZUNlbGw7IC8vIFdPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gc3BhcmtCYXJDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gc2xpZGVyQ2VsbDsgLy9XT1JLU1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHRyZWVDZWxsOyAvL05lZWQgdG8gZmlndXJlIG91dCBkYXRhIHNoYXBlIHRvIHRlc3RcblxuXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBUZXN0IG9mIEN1c3RvbWl6ZWQgUmVuZGVyZXJcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAvLyBpZiAoc3RhcnJ5KXtcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmRvbWFpbiA9IDU7IC8vIGRlZmF1bHQgaXMgMTAwXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5zaXplRmFjdG9yID0gIDAuNjU7IC8vIGRlZmF1bHQgaXMgMC42NTsgc2l6ZSBvZiBzdGFycyBhcyBmcmFjdGlvbiBvZiBoZWlnaHQgb2YgY2VsbFxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuZGFya2VuRmFjdG9yID0gMC43NTsgLy8gZGVmYXVsdCBpcyAwLjc1OyBzdGFyIHN0cm9rZSBjb2xvciBhcyBmcmFjdGlvbiBvZiBzdGFyIGZpbGwgY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmNvbG9yID0gJ2dvbGQnOyAvLyBkZWZhdWx0IGlzICdnb2xkJzsgc3RhciBmaWxsIGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5mZ0NvbG9yID0gICdncmV5JzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyB0ZXh0IGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5mZ1NlbENvbG9yID0gJ3llbGxvdyc7IC8vIGRlZmF1bHQgaXMgJ3RyYW5zcGFyZW50JyAobm90IHJlbmRlcmVkKTsgdGV4dCBzZWxlY3Rpb24gY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmJnQ29sb3IgPSAnIzQwNDA0MCc7IC8vIGRlZmF1bHQgaXMgJ3RyYW5zcGFyZW50JyAobm90IHJlbmRlcmVkKTsgYmFja2dyb3VuZCBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuYmdTZWxDb2xvciA9ICdncmV5JzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyBiYWNrZ3JvdW5kIHNlbGVjdGlvbiBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuc2hhZG93Q29sb3IgPSAndHJhbnNwYXJlbnQnOyAvLyBkZWZhdWx0IGlzICd0cmFuc3BhcmVudCdcbiAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIHN0YXJyeTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ3JpZC5jZWxsUmVuZGVyZXJzLmdldChyZW5kZXJlck5hbWUpO1xuICAgIH07XG5cbiAgICAvL0VORCBPRiBHRVQgQ0VMTFxuXG5cbiAgICAvLyBDVVNUT00gQ0VMTCBSRU5ERVJFUlxuXG4gICAgdmFyIFJFR0VYUF9DU1NfSEVYNiA9IC9eIyguLikoLi4pKC4uKSQvLFxuICAgICAgICBSRUdFWFBfQ1NTX1JHQiA9IC9ecmdiYVxcKChcXGQrKSwoXFxkKyksKFxcZCspLFxcZCtcXCkkLztcblxuICAgIGZ1bmN0aW9uIHBhaW50U3BhcmtSYXRpbmcoZ2MsIGNvbmZpZykge1xuICAgICAgICB2YXIgeCA9IGNvbmZpZy5ib3VuZHMueCxcbiAgICAgICAgICAgIHkgPSBjb25maWcuYm91bmRzLnksXG4gICAgICAgICAgICB3aWR0aCA9IGNvbmZpZy5ib3VuZHMud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQgPSBjb25maWcuYm91bmRzLmhlaWdodCxcbiAgICAgICAgICAgIG9wdGlvbnMgPSBjb25maWcudmFsdWUsXG4gICAgICAgICAgICBkb21haW4gPSBvcHRpb25zLmRvbWFpbiB8fCBjb25maWcuZG9tYWluIHx8IDEwMCxcbiAgICAgICAgICAgIHNpemVGYWN0b3IgPSBvcHRpb25zLnNpemVGYWN0b3IgfHwgY29uZmlnLnNpemVGYWN0b3IgfHwgMC42NSxcbiAgICAgICAgICAgIGRhcmtlbkZhY3RvciA9IG9wdGlvbnMuZGFya2VuRmFjdG9yIHx8IGNvbmZpZy5kYXJrZW5GYWN0b3IgfHwgMC43NSxcbiAgICAgICAgICAgIGNvbG9yID0gb3B0aW9ucy5jb2xvciB8fCBjb25maWcuY29sb3IgfHwgJ2dvbGQnLFxuICAgICAgICAgICAgc3Ryb2tlID0gdGhpcy5zdHJva2UgPSBjb2xvciA9PT0gdGhpcy5jb2xvciA/IHRoaXMuc3Ryb2tlIDogZ2V0RGFya2VuZWRDb2xvcihnYywgdGhpcy5jb2xvciA9IGNvbG9yLCBkYXJrZW5GYWN0b3IpLFxuICAgICAgICAgICAgLy8gYmdDb2xvciA9IGNvbmZpZy5pc1NlbGVjdGVkID8gKG9wdGlvbnMuYmdTZWxDb2xvciB8fCBjb25maWcuYmdTZWxDb2xvcikgOiAob3B0aW9ucy5iZ0NvbG9yIHx8IGNvbmZpZy5iZ0NvbG9yKSxcbiAgICAgICAgICAgIGZnQ29sb3IgPSBjb25maWcuaXNTZWxlY3RlZCA/IChvcHRpb25zLmZnU2VsQ29sb3IgfHwgY29uZmlnLmZnU2VsQ29sb3IpIDogKG9wdGlvbnMuZmdDb2xvciB8fCBjb25maWcuZmdDb2xvciksXG4gICAgICAgICAgICBzaGFkb3dDb2xvciA9IG9wdGlvbnMuc2hhZG93Q29sb3IgfHwgY29uZmlnLnNoYWRvd0NvbG9yIHx8ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAvLyBmb250ID0gb3B0aW9ucy5mb250IHx8IGNvbmZpZy5mb250IHx8ICcxMXB4IHZlcmRhbmEnLFxuICAgICAgICAgICAgbWlkZGxlID0gaGVpZ2h0IC8gMixcbiAgICAgICAgICAgIGRpYW1ldGVyID0gc2l6ZUZhY3RvciAqIGhlaWdodCxcbiAgICAgICAgICAgIG91dGVyUmFkaXVzID0gc2l6ZUZhY3RvciAqIG1pZGRsZSxcbiAgICAgICAgICAgIHZhbCA9IE51bWJlcihvcHRpb25zLnZhbCksXG4gICAgICAgICAgICBwb2ludHMgPSB0aGlzLnBvaW50cztcblxuICAgICAgICBpZiAoIXBvaW50cykge1xuICAgICAgICAgICAgdmFyIGlubmVyUmFkaXVzID0gMyAvIDcgKiBvdXRlclJhZGl1cztcbiAgICAgICAgICAgIHBvaW50cyA9IHRoaXMucG9pbnRzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gNSwgcGkgPSBNYXRoLlBJIC8gMiwgaW5jciA9IE1hdGguUEkgLyA1OyBpOyAtLWksIHBpICs9IGluY3IpIHtcbiAgICAgICAgICAgICAgICBwb2ludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHg6IG91dGVyUmFkaXVzICogTWF0aC5jb3MocGkpLFxuICAgICAgICAgICAgICAgICAgICB5OiBtaWRkbGUgLSBvdXRlclJhZGl1cyAqIE1hdGguc2luKHBpKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHBpICs9IGluY3I7XG4gICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiBpbm5lclJhZGl1cyAqIE1hdGguY29zKHBpKSxcbiAgICAgICAgICAgICAgICAgICAgeTogbWlkZGxlIC0gaW5uZXJSYWRpdXMgKiBNYXRoLnNpbihwaSlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvaW50cy5wdXNoKHBvaW50c1swXSk7IC8vIGNsb3NlIHRoZSBwYXRoXG4gICAgICAgIH1cblxuICAgICAgICBnYy5jYWNoZS5zaGFkb3dDb2xvciA9ICd0cmFuc3BhcmVudCc7XG5cbiAgICAgICAgZ2MuY2FjaGUubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgICBnYy5iZWdpblBhdGgoKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDUsIHN4ID0geCArIDUgKyBvdXRlclJhZGl1czsgajsgLS1qLCBzeCArPSBkaWFtZXRlcikge1xuICAgICAgICAgICAgcG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocG9pbnQsIGluZGV4KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgICAgICBnY1tpbmRleCA/ICdsaW5lVG8nIDogJ21vdmVUbyddKHN4ICsgcG9pbnQueCwgeSArIHBvaW50LnkpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICB9KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICB9XG4gICAgICAgIGdjLmNsb3NlUGF0aCgpO1xuXG4gICAgICAgIHZhbCA9IHZhbCAvIGRvbWFpbiAqIDU7XG5cbiAgICAgICAgZ2MuY2FjaGUuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgICAgIGdjLnNhdmUoKTtcbiAgICAgICAgZ2MuY2xpcCgpO1xuICAgICAgICBnYy5maWxsUmVjdCh4ICsgNSwgeSxcbiAgICAgICAgICAgIChNYXRoLmZsb29yKHZhbCkgKyAwLjI1ICsgdmFsICUgMSAqIDAuNSkgKiBkaWFtZXRlciwgLy8gYWRqdXN0IHdpZHRoIHRvIHNraXAgb3ZlciBzdGFyIG91dGxpbmVzIGFuZCBqdXN0IG1ldGVyIHRoZWlyIGludGVyaW9yc1xuICAgICAgICAgICAgaGVpZ2h0KTtcbiAgICAgICAgZ2MucmVzdG9yZSgpOyAvLyByZW1vdmUgY2xpcHBpbmcgcmVnaW9uXG5cbiAgICAgICAgZ2MuY2FjaGUuc3Ryb2tlU3R5bGUgPSBzdHJva2U7XG4gICAgICAgIGdjLmNhY2hlLmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIGdjLnN0cm9rZSgpO1xuXG4gICAgICAgIGlmIChmZ0NvbG9yICYmIGZnQ29sb3IgIT09ICd0cmFuc3BhcmVudCcpIHtcbiAgICAgICAgICAgIGdjLmNhY2hlLmZpbGxTdHlsZSA9IGZnQ29sb3I7XG4gICAgICAgICAgICBnYy5jYWNoZS5mb250ID0gJzExcHggdmVyZGFuYSc7XG4gICAgICAgICAgICBnYy5jYWNoZS50ZXh0QWxpZ24gPSAncmlnaHQnO1xuICAgICAgICAgICAgZ2MuY2FjaGUudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XG4gICAgICAgICAgICBnYy5jYWNoZS5zaGFkb3dDb2xvciA9IHNoYWRvd0NvbG9yO1xuICAgICAgICAgICAgZ2MuY2FjaGUuc2hhZG93T2Zmc2V0WCA9IGdjLmNhY2hlLnNoYWRvd09mZnNldFkgPSAxO1xuICAgICAgICAgICAgZ2MuZmlsbFRleHQodmFsLnRvRml4ZWQoMSksIHggKyB3aWR0aCArIDEwLCB5ICsgaGVpZ2h0IC8gMik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXREYXJrZW5lZENvbG9yKGdjLCBjb2xvciwgZmFjdG9yKSB7XG4gICAgICAgIHZhciByZ2JhID0gZ2V0UkdCQShnYywgY29sb3IpO1xuICAgICAgICByZXR1cm4gJ3JnYmEoJyArIE1hdGgucm91bmQoZmFjdG9yICogcmdiYVswXSkgKyAnLCcgKyBNYXRoLnJvdW5kKGZhY3RvciAqIHJnYmFbMV0pICsgJywnICsgTWF0aC5yb3VuZChmYWN0b3IgKiByZ2JhWzJdKSArICcsJyArIChyZ2JhWzNdIHx8IDEpICsgJyknO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFJHQkEoZ2MsIGNvbG9yU3BlYykge1xuICAgICAgICAvLyBOb3JtYWxpemUgdmFyaWV0eSBvZiBDU1MgY29sb3Igc3BlYyBzeW50YXhlcyB0byBvbmUgb2YgdHdvXG4gICAgICAgIGdjLmNhY2hlLmZpbGxTdHlsZSA9IGNvbG9yU3BlYztcblxuICAgICAgICB2YXIgcmdiYSA9IGNvbG9yU3BlYy5tYXRjaChSRUdFWFBfQ1NTX0hFWDYpO1xuICAgICAgICBpZiAocmdiYSkge1xuICAgICAgICAgICAgcmdiYS5zaGlmdCgpOyAvLyByZW1vdmUgd2hvbGUgbWF0Y2hcbiAgICAgICAgICAgIHJnYmEuZm9yRWFjaChmdW5jdGlvbih2YWwsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmdiYVtpbmRleF0gPSBwYXJzZUludCh2YWwsIDE2KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmdiYSA9IGNvbG9yU3BlYy5tYXRjaChSRUdFWFBfQ1NTX1JHQik7XG4gICAgICAgICAgICBpZiAoIXJnYmEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnVW5leHBlY3RlZCBmb3JtYXQgZ2V0dGluZyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQuZmlsbFN0eWxlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJnYmEuc2hpZnQoKTsgLy8gcmVtb3ZlIHdob2xlIG1hdGNoXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmdiYTtcbiAgICB9XG5cblxuICAgIC8vRXh0ZW5kIEh5cGVyR3JpZCdzIGJhc2UgUmVuZGVyZXJcbiAgICB2YXIgc3BhcmtTdGFyUmF0aW5nUmVuZGVyZXIgPSBncmlkLmNlbGxSZW5kZXJlcnMuQmFzZUNsYXNzLmV4dGVuZCh7XG4gICAgICAgIHBhaW50OiBwYWludFNwYXJrUmF0aW5nXG4gICAgfSk7XG5cbiAgICAvL1JlZ2lzdGVyIHlvdXIgcmVuZGVyZXJcbiAgICBncmlkLmNlbGxSZW5kZXJlcnMuYWRkKCdTdGFycnknLCBzcGFya1N0YXJSYXRpbmdSZW5kZXJlcik7XG5cbiAgICAvLyBFTkQgT0YgQ1VTVE9NIENFTEwgUkVOREVSRVJcbiAgICByZXR1cm4gZ3JpZDtcbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuLyogZ2xvYmFscyBwZW9wbGUxLCBwZW9wbGUyICovXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWFsZXJ0ICovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gU29tZSBET00gc3VwcG9ydCBmdW5jdGlvbnMuLi5cbi8vIEJlc2lkZXMgdGhlIGNhbnZhcywgdGhpcyB0ZXN0IGhhcm5lc3Mgb25seSBoYXMgYSBoYW5kZnVsIG9mIGJ1dHRvbnMgYW5kIGNoZWNrYm94ZXMuXG4vLyBUaGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBzZXJ2aWNlIHRoZXNlIGNvbnRyb2xzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIC8vIG1ha2UgYnV0dG9ucyBkaXYgYWJzb2x1dGUgc28gYnV0dG9ucyB3aWR0aCBvZiAxMDAlIGRvZXNuJ3Qgc3RyZXRjaCB0byB3aWR0aCBvZiBkYXNoYm9hcmRcbiAgICB2YXIgY3RybEdyb3VwcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdHJsLWdyb3VwcycpLFxuICAgICAgICBkYXNoYm9hcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGFzaGJvYXJkJyksXG4gICAgICAgIGJ1dHRvbnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnV0dG9ucycpO1xuXG4gICAgY3RybEdyb3Vwcy5zdHlsZS50b3AgPSBjdHJsR3JvdXBzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICdweCc7XG4gICAgLy9idXR0b25zLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBkYXNoYm9hcmQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIGZ1bmN0aW9uIHRvZ2dsZVJvd1N0eWxpbmdNZXRob2QoKSB7XG4gICAgICAgIGRlbW8uc3R5bGVSb3dzRnJvbURhdGEgPSAhZGVtby5zdHlsZVJvd3NGcm9tRGF0YTtcbiAgICB9XG5cbiAgICAvLyBMaXN0IG9mIHByb3BlcnRpZXMgdG8gc2hvdyBhcyBjaGVja2JveGVzIGluIHRoaXMgZGVtbydzIFwiZGFzaGJvYXJkXCJcbiAgICB2YXIgdG9nZ2xlUHJvcHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnUm93IHN0eWxpbmcnLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJyhHbG9iYWwgc2V0dGluZyknLCBsYWJlbDogJ2Jhc2Ugb24gZGF0YScsIHNldHRlcjogdG9nZ2xlUm93U3R5bGluZ01ldGhvZH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdDb2x1bW4gaGVhZGVyIHJvd3MnLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJ3Nob3dIZWFkZXJSb3cnLCBsYWJlbDogJ2hlYWRlcid9LCAvLyBkZWZhdWx0IFwic2V0dGVyXCIgaXMgYHNldFByb3BgXG4gICAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnSG92ZXIgaGlnaGxpZ2h0cycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnaG92ZXJDZWxsSGlnaGxpZ2h0LmVuYWJsZWQnLCBsYWJlbDogJ2NlbGwnfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2hvdmVyUm93SGlnaGxpZ2h0LmVuYWJsZWQnLCBsYWJlbDogJ3Jvdyd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnaG92ZXJDb2x1bW5IaWdobGlnaHQuZW5hYmxlZCcsIGxhYmVsOiAnY29sdW1uJ31cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdMaW5rIHN0eWxlJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge25hbWU6ICdsaW5rT25Ib3ZlcicsIGxhYmVsOiAnb24gaG92ZXInfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2xpbmtDb2xvcicsIHR5cGU6ICd0ZXh0JywgbGFiZWw6ICdjb2xvcid9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnbGlua0NvbG9yT25Ib3ZlcicsIGxhYmVsOiAnY29sb3Igb24gaG92ZXInfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBsYWJlbDogJ0NlbGwgZWRpdGluZycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnZWRpdGFibGUnfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2VkaXRPbkRvdWJsZUNsaWNrJywgbGFiZWw6ICdyZXF1aXJlcyBkb3VibGUtY2xpY2snfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2VkaXRPbktleWRvd24nLCBsYWJlbDogJ3R5cGUgdG8gZWRpdCd9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGxhYmVsOiAnU2VsZWN0aW9uJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucycsIGxhYmVsOiAnYnkgcm93IGhhbmRsZXMgb25seScsIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcCxcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcDogJ05vdGUgdGhhdCB3aGVuIHRoaXMgcHJvcGVydHkgaXMgYWN0aXZlLCBhdXRvU2VsZWN0Um93cyB3aWxsIG5vdCB3b3JrLidcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnc2luZ2xlUm93U2VsZWN0aW9uTW9kZScsIGxhYmVsOiAnb25lIHJvdyBhdCBhIHRpbWUnLCBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3B9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJyFtdWx0aXBsZVNlbGVjdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ29uZSBjZWxsIHJlZ2lvbiBhdCBhIHRpbWUnLFxuICAgICAgICAgICAgICAgICAgICBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3AsXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IHRydWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2F1dG9TZWxlY3RSb3dzJywgbGFiZWw6ICdhdXRvLXNlbGVjdCByb3dzJywgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wLFxuICAgICAgICAgICAgICAgICAgICB0b29sdGlwOiAnTm90ZXM6XFxuJyArXG4gICAgICAgICAgICAgICAgICAgICcxLiBSZXF1aXJlcyB0aGF0IGNoZWNrYm94T25seVJvd1NlbGVjdGlvbnMgYmUgc2V0IHRvIGZhbHNlIChzbyBjaGVja2luZyB0aGlzIGJveCBhdXRvbWF0aWNhbGx5IHVuY2hlY2tzIHRoYXQgb25lKS5cXG4nICtcbiAgICAgICAgICAgICAgICAgICAgJzIuIFNldCBzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlIHRvIGZhbHNlIHRvIGFsbG93IGF1dG8tc2VsZWN0IG9mIG11bHRpcGxlIHJvd3MuJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge25hbWU6ICdhdXRvU2VsZWN0Q29sdW1ucycsIGxhYmVsOiAnYXV0by1zZWxlY3QgY29sdW1ucycsIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgIF07XG5cblxuICAgIHRvZ2dsZVByb3BzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICBhZGRUb2dnbGUocHJvcCk7XG4gICAgfSk7XG5cblxuICAgIFtcbiAgICAgICAge2xhYmVsOiAnVG9nZ2xlIEVtcHR5IERhdGEnLCBvbmNsaWNrOiBkZW1vLnRvZ2dsZUVtcHR5RGF0YX0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnU2V0IERhdGEnLCBvbmNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRlbW8ucmVzZXREYXRhKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnU2V0IERhdGEgMSAoNTAwMCByb3dzKScsIG9uY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGVtby5zZXREYXRhKHBlb3BsZTEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ1NldCBEYXRhIDIgKDEwMDAwIHJvd3MpJywgb25jbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZW1vLnNldERhdGEocGVvcGxlMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtsYWJlbDogJ1Jlc2V0IEdyaWQnLCBvbmNsaWNrOiBkZW1vLnJlc2V0fVxuXG4gICAgXS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgICBidXR0b24uaW5uZXJIVE1MID0gaXRlbS5sYWJlbDtcbiAgICAgICAgYnV0dG9uLm9uY2xpY2sgPSBpdGVtLm9uY2xpY2s7XG4gICAgICAgIGlmIChpdGVtLnRpdGxlKSB7XG4gICAgICAgICAgICBidXR0b24udGl0bGUgPSBpdGVtLnRpdGxlO1xuICAgICAgICB9XG4gICAgICAgIGJ1dHRvbnMuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgICB9KTtcblxuXG4gICAgZnVuY3Rpb24gYWRkVG9nZ2xlKGN0cmxHcm91cCkge1xuICAgICAgICB2YXIgaW5wdXQsIGxhYmVsLFxuICAgICAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAgICAgY29udGFpbmVyLmNsYXNzTmFtZSA9ICdjdHJsLWdyb3VwJztcblxuICAgICAgICBpZiAoY3RybEdyb3VwLmxhYmVsKSB7XG4gICAgICAgICAgICBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgbGFiZWwuY2xhc3NOYW1lID0gJ3R3aXN0ZXInO1xuICAgICAgICAgICAgbGFiZWwuaW5uZXJIVE1MID0gY3RybEdyb3VwLmxhYmVsO1xuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaG9pY2VzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGNob2ljZXMuY2xhc3NOYW1lID0gJ2Nob2ljZXMnO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2hvaWNlcyk7XG5cbiAgICAgICAgY3RybEdyb3VwLmN0cmxzLmZvckVhY2goZnVuY3Rpb24oY3RybCkge1xuICAgICAgICAgICAgaWYgKCFjdHJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmVmZXJlbmNlRWxlbWVudCxcbiAgICAgICAgICAgICAgICB0eXBlID0gY3RybC50eXBlIHx8ICdjaGVja2JveCcsXG4gICAgICAgICAgICAgICAgdG9vbHRpcCA9ICdQcm9wZXJ0eSBuYW1lOiAnICsgY3RybC5uYW1lO1xuXG4gICAgICAgICAgICBpZiAoY3RybC50b29sdGlwKSB7XG4gICAgICAgICAgICAgICAgdG9vbHRpcCArPSAnXFxuXFxuJyArIGN0cmwudG9vbHRpcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgaW5wdXQudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICBpbnB1dC5pZCA9IGN0cmwubmFtZTtcbiAgICAgICAgICAgIGlucHV0Lm5hbWUgPSBjdHJsR3JvdXAubGFiZWw7XG5cbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9IGN0cmwudmFsdWUgfHwgZ2V0UHJvcGVydHkoY3RybC5uYW1lKSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUud2lkdGggPSAnMjVweCc7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnN0eWxlLm1hcmdpbkxlZnQgPSAnNHB4JztcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUubWFyZ2luUmlnaHQgPSAnNHB4JztcbiAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlRWxlbWVudCA9IGlucHV0OyAvLyBsYWJlbCBnb2VzIGFmdGVyIGlucHV0XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgICAgICAgICBjYXNlICdyYWRpbyc6XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LmNoZWNrZWQgPSAnY2hlY2tlZCcgaW4gY3RybFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBjdHJsLmNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIDogZ2V0UHJvcGVydHkoY3RybC5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlRWxlbWVudCA9IG51bGw7IC8vIGxhYmVsIGdvZXMgYmVmb3JlIGlucHV0XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dC5vbmNoYW5nZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlUmFkaW9DbGljay5jYWxsKHRoaXMsIGN0cmwuc2V0dGVyIHx8IHNldFByb3AsIGV2ZW50KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgICAgICAgICAgIGxhYmVsLnRpdGxlID0gdG9vbHRpcDtcbiAgICAgICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIGxhYmVsLmluc2VydEJlZm9yZShcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnICcgKyAoY3RybC5sYWJlbCB8fCBjdHJsLm5hbWUpKSxcbiAgICAgICAgICAgICAgICByZWZlcmVuY2VFbGVtZW50XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjaG9pY2VzLmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICAgICAgICAgICAgaWYgKGN0cmwubmFtZSA9PT0gJ3RyZWV2aWV3Jykge1xuICAgICAgICAgICAgICAgIGxhYmVsLm9ubW91c2Vkb3duID0gaW5wdXQub25tb3VzZWRvd24gPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlucHV0LmNoZWNrZWQgJiYgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuc291cmNlLmRhdGEgIT09IGRlbW8udHJlZURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdMb2FkIHRyZWUgZGF0YSBmaXJzdCAoXCJTZXQgRGF0YSAzXCIgYnV0dG9uKS4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjdHJsR3JvdXBzLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgfVxuXG4gICAgLy8gcmVzZXQgZGFzaGJvYXJkIGNoZWNrYm94ZXMgYW5kIHJhZGlvIGJ1dHRvbnMgdG8gbWF0Y2ggY3VycmVudCB2YWx1ZXMgb2YgZ3JpZCBwcm9wZXJ0aWVzXG4gICAgZGVtby5yZXNldERhc2hib2FyZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0b2dnbGVQcm9wcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgICAgICAgIHByb3AuY3RybHMuZm9yRWFjaChmdW5jdGlvbihjdHJsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN0cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjdHJsLnNldHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBzZXRTZWxlY3Rpb25Qcm9wOlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBzZXRQcm9wOlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjdHJsLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncmFkaW8nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkID0gY3RybC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvbGFyaXR5ID0gKGlkWzBdID09PSAnIScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpLmNoZWNrZWQgPSBnZXRQcm9wZXJ0eShpZCkgXiBwb2xhcml0eTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGdldFByb3BlcnR5KGtleSkge1xuICAgICAgICB2YXIga2V5cyA9IGtleS5zcGxpdCgnLicpO1xuICAgICAgICB2YXIgcHJvcCA9IGdyaWQucHJvcGVydGllcztcblxuICAgICAgICB3aGlsZSAoa2V5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHByb3AgPSBwcm9wW2tleXMuc2hpZnQoKV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvcDtcbiAgICB9XG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFiLWRhc2hib2FyZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGRhc2hib2FyZC5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScpIHtcbiAgICAgICAgICAgIGRhc2hib2FyZC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLnRyYW5zaXRpb24gPSAnbWFyZ2luLWxlZnQgLjc1cyc7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS5tYXJnaW5MZWZ0ID0gTWF0aC5tYXgoMTgwLCBkYXNoYm9hcmQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHQgKyA4KSArICdweCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGRhc2hib2FyZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfSwgODAwKTtcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLm1hcmdpbkxlZnQgPSAnMzBweCc7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBmcHNUaW1lciwgc2VjcywgZnJhbWVzO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWItZnBzJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgZWwgPSB0aGlzLCBzdCA9IGVsLnN0eWxlO1xuICAgICAgICBpZiAoKGdyaWQucHJvcGVydGllcy5lbmFibGVDb250aW51b3VzUmVwYWludCBePSB0cnVlKSkge1xuICAgICAgICAgICAgc3QuYmFja2dyb3VuZENvbG9yID0gJyM2NjYnO1xuICAgICAgICAgICAgc3QudGV4dEFsaWduID0gJ2xlZnQnO1xuICAgICAgICAgICAgc2VjcyA9IGZyYW1lcyA9IDA7XG4gICAgICAgICAgICBjb2RlKCk7XG4gICAgICAgICAgICBmcHNUaW1lciA9IHNldEludGVydmFsKGNvZGUsIDEwMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChmcHNUaW1lcik7XG4gICAgICAgICAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSBzdC50ZXh0QWxpZ24gPSBudWxsO1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gJ0ZQUyc7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gY29kZSgpIHtcbiAgICAgICAgICAgIHZhciBmcHMgPSBncmlkLmNhbnZhcy5jdXJyZW50RlBTLFxuICAgICAgICAgICAgICAgIGJhcnMgPSBBcnJheShNYXRoLnJvdW5kKGZwcykgKyAxKS5qb2luKCdJJyksXG4gICAgICAgICAgICAgICAgc3VicmFuZ2UsIHNwYW47XG5cbiAgICAgICAgICAgIC8vIGZpcnN0IHNwYW4gaG9sZHMgdGhlIDMwIGJhY2tncm91bmQgYmFyc1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJykpO1xuXG4gICAgICAgICAgICAvLyAybmQgc3BhbiBob2xkcyB0aGUgbnVtZXJpY1xuICAgICAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuICAgICAgICAgICAgaWYgKHNlY3MpIHtcbiAgICAgICAgICAgICAgICBmcmFtZXMgKz0gZnBzO1xuICAgICAgICAgICAgICAgIHNwYW4uaW5uZXJIVE1MID0gZnBzLnRvRml4ZWQoMSk7XG4gICAgICAgICAgICAgICAgc3Bhbi50aXRsZSA9IHNlY3MgKyAnLXNlY29uZCBhdmVyYWdlID0gJyArIChmcmFtZXMgLyBzZWNzKS50b0ZpeGVkKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VjcyArPSAxO1xuXG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChzcGFuKTtcblxuICAgICAgICAgICAgLy8gMCB0byA0IGNvbG9yIHJhbmdlIGJhciBzdWJzZXRzOiAxLi4xMDpyZWQsIDExOjIwOnllbGxvdywgMjE6MzA6Z3JlZW5cbiAgICAgICAgICAgIHdoaWxlICgoc3VicmFuZ2UgPSBiYXJzLnN1YnN0cigwLCAxMikpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICAgICAgc3Bhbi5pbm5lckhUTUwgPSBzdWJyYW5nZTtcbiAgICAgICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgICAgICAgICAgICBiYXJzID0gYmFycy5zdWJzdHIoMTIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgaGVpZ2h0O1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWItZ3Jvdy1zaHJpbmsnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBsYWJlbDtcbiAgICAgICAgaWYgKCFoZWlnaHQpIHtcbiAgICAgICAgICAgIGhlaWdodCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGdyaWQuZGl2KS5oZWlnaHQ7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS50cmFuc2l0aW9uID0gJ2hlaWdodCAxLjVzIGxpbmVhcic7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgbGFiZWwgPSAnU2hyaW5rJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgIGhlaWdodCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxhYmVsID0gJ0dyb3cnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5uZXJIVE1MICs9ICcgLi4uJztcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuaW5uZXJIVE1MID0gbGFiZWw7XG4gICAgICAgIH0uYmluZCh0aGlzKSwgMTUwMCk7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGFzaGJvYXJkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgY3RybCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgaWYgKGN0cmwuY2xhc3NMaXN0LmNvbnRhaW5zKCd0d2lzdGVyJykpIHtcbiAgICAgICAgICAgIGN0cmwubmV4dEVsZW1lbnRTaWJsaW5nLnN0eWxlLmRpc3BsYXkgPSBjdHJsLmNsYXNzTGlzdC50b2dnbGUoJ29wZW4nKSA/ICdibG9jaycgOiAnbm9uZSc7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS5tYXJnaW5MZWZ0ID0gTWF0aC5tYXgoMTgwLCBldmVudC5jdXJyZW50VGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0ICsgOCkgKyAncHgnO1xuICAgICAgICB9XG4gICAgfSk7XG5cblxuICAgIHZhciByYWRpb0dyb3VwID0ge307XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVSYWRpb0NsaWNrKGhhbmRsZXIsIGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdyYWRpbycpIHtcbiAgICAgICAgICAgIHZhciBsYXN0UmFkaW8gPSByYWRpb0dyb3VwW3RoaXMubmFtZV07XG4gICAgICAgICAgICBpZiAobGFzdFJhZGlvKSB7XG4gICAgICAgICAgICAgICAgbGFzdFJhZGlvLmhhbmRsZXIuY2FsbChsYXN0UmFkaW8uY3RybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByYWRpb0dyb3VwW3RoaXMubmFtZV0gPSB7Y3RybDogdGhpcywgaGFuZGxlcjogaGFuZGxlcn07XG4gICAgICAgIH1cbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRQcm9wKCkgeyAvLyBzdGFuZGFyZCBjaGVja2JveCBjbGljayBoYW5kbGVyXG4gICAgICAgIHZhciBoYXNoID0ge30sIGRlcHRoID0gaGFzaDtcbiAgICAgICAgdmFyIGlkID0gdGhpcy5pZDtcbiAgICAgICAgaWYgKGlkWzBdID09PSAnIScpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgIT09ICdjaGVja2JveCcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnRXhwZWN0ZWQgaW52ZXJzZSBvcGVyYXRvciAoISkgb24gY2hlY2tib3ggZGFzaGJvYXJkIGNvbnRyb2xzIG9ubHkgYnV0IGZvdW5kIG9uICcgKyB0aGlzLnR5cGUgKyAnLic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZCA9IGlkLnN1YnN0cigxKTtcbiAgICAgICAgICAgIHZhciBpbnZlcnNlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIga2V5cyA9IGlkLnNwbGl0KCcuJyk7XG5cbiAgICAgICAgd2hpbGUgKGtleXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgZGVwdGggPSBkZXB0aFtrZXlzLnNoaWZ0KCldID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHRoaXMudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgICAgICAgICAgZGVwdGhba2V5cy5zaGlmdCgpXSA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgICAgICAgICAgZGVwdGhba2V5cy5zaGlmdCgpXSA9IGludmVyc2UgPyAhdGhpcy5jaGVja2VkIDogdGhpcy5jaGVja2VkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JpZC50YWtlRm9jdXMoKTtcbiAgICAgICAgZ3JpZC5hZGRQcm9wZXJ0aWVzKGhhc2gpO1xuICAgICAgICBncmlkLmJlaGF2aW9yQ2hhbmdlZCgpO1xuICAgICAgICBncmlkLnJlcGFpbnQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRTZWxlY3Rpb25Qcm9wKCkgeyAvLyBhbHRlcm5hdGUgY2hlY2tib3ggY2xpY2sgaGFuZGxlclxuICAgICAgICB2YXIgY3RybDtcblxuICAgICAgICBncmlkLnNlbGVjdGlvbk1vZGVsLmNsZWFyKCk7XG4gICAgICAgIGdyaWQuYmVoYXZpb3IuZGF0YU1vZGVsLmNsZWFyU2VsZWN0ZWREYXRhKCk7XG5cbiAgICAgICAgc2V0UHJvcC5jYWxsKHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLmNoZWNrZWQpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGlzLmlkID09PSAnY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucycgJiZcbiAgICAgICAgICAgICAgICAoY3RybCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdXRvU2VsZWN0Um93cycpKS5jaGVja2VkXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBhbGVydCgnTm90ZSB0aGF0IGF1dG9TZWxlY3RSb3dzIGlzIGluZWZmZWN0dWFsIHdoZW4gY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucyBpcyBvbi4nKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5pZCA9PT0gJ2F1dG9TZWxlY3RSb3dzJykge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgKGN0cmwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucycpKS5jaGVja2VkICYmXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpcm0oJ05vdGUgdGhhdCBhdXRvU2VsZWN0Um93cyBpcyBpbmVmZmVjdHVhbCB3aGVuIGNoZWNrYm94T25seVJvd1NlbGVjdGlvbnMgaXMgb24uXFxuXFxuVHVybiBvZmYgY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucz8nKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2V0UHJvcC5jYWxsKGN0cmwpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgKGN0cmwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2luZ2xlUm93U2VsZWN0aW9uTW9kZScpKS5jaGVja2VkICYmXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpcm0oJ05vdGUgdGhhdCBhdXRvLXNlbGVjdGluZyBhIHJhbmdlIG9mIHJvd3MgYnkgc2VsZWN0aW5nIGEgcmFuZ2Ugb2YgY2VsbHMgKHdpdGggY2xpY2sgKyBkcmFnIG9yIHNoaWZ0ICsgY2xpY2spIGlzIG5vdCBwb3NzaWJsZSB3aXRoIHNpbmdsZVJvd1NlbGVjdGlvbk1vZGUgaXMgb24uXFxuXFxuVHVybiBvZmYgc2luZ2xlUm93U2VsZWN0aW9uTW9kZT8nKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2V0UHJvcC5jYWxsKGN0cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkZW1vLCBncmlkKSB7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1idXR0b24tcHJlc3NlZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGNlbGxFdmVudCA9IGUuZGV0YWlsO1xuICAgICAgICBjZWxsRXZlbnQudmFsdWUgPSAhY2VsbEV2ZW50LnZhbHVlO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tY2VsbC1lbnRlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGNlbGxFdmVudCA9IGUuZGV0YWlsO1xuXG4gICAgICAgIC8vaG93IHRvIHNldCB0aGUgdG9vbHRpcC4uLi5cbiAgICAgICAgZ3JpZC5zZXRBdHRyaWJ1dGUoJ3RpdGxlJywgJ2V2ZW50IG5hbWU6IFwiZmluLWNlbGwtZW50ZXJcIlxcbicgK1xuICAgICAgICAgICAgJ2dyaWRDZWxsOiB7IHg6ICcgKyBjZWxsRXZlbnQuZ3JpZENlbGwueCArICcsIHk6ICcgKyBjZWxsRXZlbnQuZ3JpZENlbGwueSArICcgfVxcbicgK1xuICAgICAgICAgICAgJ2RhdGFDZWxsOiB7IHg6ICcgKyBjZWxsRXZlbnQuZGF0YUNlbGwueCArICcsIHk6ICcgKyBjZWxsRXZlbnQuZGF0YUNlbGwueSArICcgfVxcbicgK1xuICAgICAgICAgICAgJ3N1YmdyaWQgdHlwZTogXCInICsgY2VsbEV2ZW50LnN1YmdyaWQudHlwZSArICdcIlxcbicgK1xuICAgICAgICAgICAgJ3N1YmdyaWQgbmFtZTogJyArIChjZWxsRXZlbnQuc3ViZ3JpZC5uYW1lID8gJ1wiJyArIGNlbGxFdmVudC5zdWJncmlkLm5hbWUgKyAnXCInIDogJ3VuZGVmaW5lZCcpXG4gICAgICAgICk7XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1zZXQtdG90YWxzLXZhbHVlJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgZGV0YWlsID0gZS5kZXRhaWwsXG4gICAgICAgICAgICBhcmVhcyA9IGRldGFpbC5hcmVhcyB8fCBbJ3RvcCcsICdib3R0b20nXTtcblxuICAgICAgICBhcmVhcy5mb3JFYWNoKGZ1bmN0aW9uKGFyZWEpIHtcbiAgICAgICAgICAgIHZhciBtZXRob2ROYW1lID0gJ2dldCcgKyBhcmVhWzBdLnRvVXBwZXJDYXNlKCkgKyBhcmVhLnN1YnN0cigxKSArICdUb3RhbHMnLFxuICAgICAgICAgICAgICAgIHRvdGFsc1JvdyA9IGdyaWQuYmVoYXZpb3IuZGF0YU1vZGVsW21ldGhvZE5hbWVdKCk7XG5cbiAgICAgICAgICAgIHRvdGFsc1Jvd1tkZXRhaWwueV1bZGV0YWlsLnhdID0gZGV0YWlsLnZhbHVlO1xuICAgICAgICB9KTtcblxuICAgICAgICBncmlkLnJlcGFpbnQoKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IExpc3RlbiBmb3IgY2VydGFpbiBrZXkgcHJlc3NlcyBmcm9tIGdyaWQgb3IgY2VsbCBlZGl0b3IuXG4gICAgICogQGRlc2MgTk9URTogZmluY2FudmFzJ3MgaW50ZXJuYWwgY2hhciBtYXAgeWllbGRzIG1peGVkIGNhc2Ugd2hpbGUgZmluLWVkaXRvci1rZXkqIGV2ZW50cyBkbyBub3QuXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gTm90IGhhbmRsZWQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaGFuZGxlQ3Vyc29yS2V5KGUpIHtcbiAgICAgICAgdmFyIGRldGFpbCA9IGUuZGV0YWlsLFxuICAgICAgICAgICAga2V5ID0gU3RyaW5nLmZyb21DaGFyQ29kZShkZXRhaWwua2V5KS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7IC8vIG1lYW5zIGV2ZW50IGhhbmRsZWQgaGVyZWluXG5cbiAgICAgICAgaWYgKGRldGFpbC5jdHJsKSB7XG4gICAgICAgICAgICBpZiAoZGV0YWlsLnNoaWZ0KSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnMCc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RUb1ZpZXdwb3J0Q2VsbCgwLCAwKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnOSc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RUb0ZpbmFsQ2VsbCgpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc4JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFRvRmluYWxDZWxsT2ZDdXJyZW50Um93KCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzcnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0VG9GaXJzdENlbGxPZkN1cnJlbnRSb3coKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzAnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0Vmlld3BvcnRDZWxsKDAsIDApOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc5JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdEZpbmFsQ2VsbCgpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc4JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdEZpbmFsQ2VsbE9mQ3VycmVudFJvdygpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc3JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdEZpcnN0Q2VsbE9mQ3VycmVudFJvdygpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4ta2V5ZG93bicsIGhhbmRsZUN1cnNvcktleSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1lZGl0b3Ita2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gdmFyIGRldGFpbCA9IGUuZGV0YWlsLFxuICAgICAgICAvLyAgICAga2UgPSBkZXRhaWwua2V5RXZlbnQ7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIC8vIG1vcmUgZGV0YWlsLCBwbGVhc2VcbiAgICAgICAgLy8gZGV0YWlsLnByaW1pdGl2ZUV2ZW50ID0ga2U7XG4gICAgICAgIC8vIGRldGFpbC5rZXkgPSBrZS5rZXlDb2RlO1xuICAgICAgICAvLyBkZXRhaWwuc2hpZnQgPSBrZS5zaGlmdEtleTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gaGFuZGxlQ3Vyc29yS2V5KGUpO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tc2VsZWN0aW9uLWNoYW5nZWQnLCBmdW5jdGlvbihlKSB7XG5cbiAgICAgICAgaWYgKGUuZGV0YWlsLnNlbGVjdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbm8gc2VsZWN0aW9ucycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdG8gZ2V0IHRoZSBzZWxlY3RlZCByb3dzIHVuY29tbWVudCB0aGUgYmVsb3cuLi4uLlxuICAgICAgICAvLyBjb25zb2xlLmxvZyhncmlkLmdldFJvd1NlbGVjdGlvbk1hdHJpeCgpKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZ3JpZC5nZXRSb3dTZWxlY3Rpb24oKSk7XG5cbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLXJvdy1zZWxlY3Rpb24tY2hhbmdlZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGRldGFpbCA9IGUuZGV0YWlsO1xuICAgICAgICAvLyBNb3ZlIGNlbGwgc2VsZWN0aW9uIHdpdGggcm93IHNlbGVjdGlvblxuICAgICAgICB2YXIgcm93cyA9IGRldGFpbC5yb3dzLFxuICAgICAgICAgICAgc2VsZWN0aW9ucyA9IGRldGFpbC5zZWxlY3Rpb25zO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBncmlkLnByb3BlcnRpZXMuc2luZ2xlUm93U2VsZWN0aW9uTW9kZSAmJiAvLyBsZXQncyBvbmx5IGF0dGVtcHQgdGhpcyB3aGVuIGluIHRoaXMgbW9kZVxuICAgICAgICAgICAgIWdyaWQucHJvcGVydGllcy5tdWx0aXBsZVNlbGVjdGlvbnMgJiYgLy8gYW5kIG9ubHkgd2hlbiBpbiBzaW5nbGUgc2VsZWN0aW9uIG1vZGVcbiAgICAgICAgICAgIHJvd3MubGVuZ3RoICYmIC8vIHVzZXIganVzdCBzZWxlY3RlZCBhIHJvdyAobXVzdCBiZSBzaW5nbGUgcm93IGR1ZSB0byBtb2RlIHdlJ3JlIGluKVxuICAgICAgICAgICAgc2VsZWN0aW9ucy5sZW5ndGggIC8vIHRoZXJlIHdhcyBhIGNlbGwgcmVnaW9uIHNlbGVjdGVkIChtdXN0IGJlIHRoZSBvbmx5IG9uZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB2YXIgcmVjdCA9IGdyaWQuc2VsZWN0aW9uTW9kZWwuZ2V0TGFzdFNlbGVjdGlvbigpLCAvLyB0aGUgb25seSBjZWxsIHNlbGVjdGlvblxuICAgICAgICAgICAgICAgIHggPSByZWN0LmxlZnQsXG4gICAgICAgICAgICAgICAgeSA9IHJvd3NbMF0sIC8vIHdlIGtub3cgdGhlcmUncyBvbmx5IDEgcm93IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgd2lkdGggPSByZWN0LnJpZ2h0IC0geCxcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSAwLCAvLyBjb2xsYXBzZSB0aGUgbmV3IHJlZ2lvbiB0byBvY2N1cHkgYSBzaW5nbGUgcm93XG4gICAgICAgICAgICAgICAgZmlyZVNlbGVjdGlvbkNoYW5nZWRFdmVudCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBncmlkLnNlbGVjdGlvbk1vZGVsLnNlbGVjdCh4LCB5LCB3aWR0aCwgaGVpZ2h0LCBmaXJlU2VsZWN0aW9uQ2hhbmdlZEV2ZW50KTtcbiAgICAgICAgICAgIGdyaWQucmVwYWludCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJvd3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbm8gcm93cyBzZWxlY3RlZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vd2UgaGF2ZSBhIGZ1bmN0aW9uIGNhbGwgdG8gY3JlYXRlIHRoZSBzZWxlY3Rpb24gbWF0cml4IGJlY2F1c2VcbiAgICAgICAgLy93ZSBkb24ndCB3YW50IHRvIGNyZWF0ZSBhbG90IG9mIG5lZWRsZXNzIGdhcmJhZ2UgaWYgdGhlIHVzZXJcbiAgICAgICAgLy9pcyBqdXN0IG5hdmlnYXRpbmcgYXJvdW5kXG4gICAgICAgIGNvbnNvbGUubG9nKGdyaWQuZ2V0Um93U2VsZWN0aW9uTWF0cml4KCkpO1xuICAgICAgICBjb25zb2xlLmxvZyhncmlkLmdldFJvd1NlbGVjdGlvbigpKTtcbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWNvbHVtbi1zZWxlY3Rpb24tY2hhbmdlZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUuZGV0YWlsLmNvbHVtbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbm8gcm93cyBzZWxlY3RlZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vd2UgaGF2ZSBhIGZ1bmN0aW9uIGNhbGwgdG8gY3JlYXRlIHRoZSBzZWxlY3Rpb24gbWF0cml4IGJlY2F1c2VcbiAgICAgICAgLy93ZSBkb24ndCB3YW50IHRvIGNyZWF0ZSBhbG90IG9mIG5lZWRsZXNzIGdhcmJhZ2UgaWYgdGhlIHVzZXJcbiAgICAgICAgLy9pcyBqdXN0IG5hdmlnYXRpbmcgYXJvdW5kXG4gICAgICAgIGNvbnNvbGUubG9nKGdyaWQuZ2V0Q29sdW1uU2VsZWN0aW9uTWF0cml4KCkpO1xuICAgICAgICBjb25zb2xlLmxvZyhncmlkLmdldENvbHVtblNlbGVjdGlvbigpKTtcbiAgICB9KTtcblxuICAgIC8vdW5jb21tZW50IHRvIGNhbmNlbCBlZGl0b3IgcG9wcGluZyB1cDpcbiAgICAvLyBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1yZXF1ZXN0LWNlbGwtZWRpdCcsIGZ1bmN0aW9uKGUpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyB9KTtcblxuICAgIC8vdW5jb21tZW50IHRvIGNhbmNlbCB1cGRhdGluZyB0aGUgbW9kZWwgd2l0aCB0aGUgbmV3IGRhdGE6XG4gICAgLy8gZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tYmVmb3JlLWNlbGwtZWRpdCcsIGZ1bmN0aW9uKGUpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyB9KTtcbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIHZhciBmb290SW5jaFBhdHRlcm4gPSAvXlxccyooKCgoXFxkKyknKT9cXHMqKChcXGQrKVwiKT8pfFxcZCspXFxzKiQvO1xuXG4gICAgdmFyIGZvb3RJbmNoTG9jYWxpemVyID0ge1xuICAgICAgICBmb3JtYXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHZhciBmZWV0ID0gTWF0aC5mbG9vcih2YWx1ZSAvIDEyKTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IChmZWV0ID8gZmVldCArICdcXCcnIDogJycpICsgJyAnICsgKHZhbHVlICUgMTIpICsgJ1wiJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBwYXJzZTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgICAgICB2YXIgaW5jaGVzLCBmZWV0LFxuICAgICAgICAgICAgICAgIHBhcnRzID0gc3RyLm1hdGNoKGZvb3RJbmNoUGF0dGVybik7XG4gICAgICAgICAgICBpZiAocGFydHMpIHtcbiAgICAgICAgICAgICAgICBmZWV0ID0gcGFydHNbNF07XG4gICAgICAgICAgICAgICAgaW5jaGVzID0gcGFydHNbNl07XG4gICAgICAgICAgICAgICAgaWYgKGZlZXQgPT09IHVuZGVmaW5lZCAmJiBpbmNoZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBpbmNoZXMgPSBOdW1iZXIocGFydHNbMV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZlZXQgPSBOdW1iZXIoZmVldCB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaW5jaGVzID0gTnVtYmVyKGluY2hlcyB8fCAwKTtcbiAgICAgICAgICAgICAgICAgICAgaW5jaGVzID0gMTIgKiBmZWV0ICsgaW5jaGVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5jaGVzID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbmNoZXM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKCdmb290JywgZm9vdEluY2hMb2NhbGl6ZXIpO1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKCdzaW5nZGF0ZScsIG5ldyBncmlkLmxvY2FsaXphdGlvbi5EYXRlRm9ybWF0dGVyKCd6aC1TRycpKTtcblxuICAgIGdyaWQubG9jYWxpemF0aW9uLmFkZCgncG91bmRzJywgbmV3IGdyaWQubG9jYWxpemF0aW9uLk51bWJlckZvcm1hdHRlcignZW4tVVMnLCB7XG4gICAgICAgIHN0eWxlOiAnY3VycmVuY3knLFxuICAgICAgICBjdXJyZW5jeTogJ1VTRCdcbiAgICB9KSk7XG5cbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoJ2ZyYW5jcycsIG5ldyBncmlkLmxvY2FsaXphdGlvbi5OdW1iZXJGb3JtYXR0ZXIoJ2ZyLUZSJywge1xuICAgICAgICBzdHlsZTogJ2N1cnJlbmN5JyxcbiAgICAgICAgY3VycmVuY3k6ICdFVVInXG4gICAgfSkpO1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKHtcbiAgICAgICAgbmFtZTogJ2hobW0nLCAvLyBhbHRlcm5hdGl2ZSB0byBoYXZpbmcgdG8gaGFtZSBsb2NhbGl6ZXIgaW4gYGdyaWQubG9jYWxpemF0aW9uLmFkZGBcblxuICAgICAgICAvLyByZXR1cm5zIGZvcm1hdHRlZCBzdHJpbmcgZnJvbSBudW1iZXJcbiAgICAgICAgZm9ybWF0OiBmdW5jdGlvbihtaW5zKSB7XG4gICAgICAgICAgICB2YXIgaGggPSBNYXRoLmZsb29yKG1pbnMgLyA2MCkgJSAxMiB8fCAxMiwgLy8gbW9kdWxvIDEyIGhycyB3aXRoIDAgYmVjb21pbmcgMTJcbiAgICAgICAgICAgICAgICBtbSA9IChtaW5zICUgNjAgKyAxMDAgKyAnJykuc3Vic3RyKDEsIDIpLFxuICAgICAgICAgICAgICAgIEFtUG0gPSBtaW5zIDwgZGVtby5OT09OID8gJ0FNJyA6ICdQTSc7XG4gICAgICAgICAgICByZXR1cm4gaGggKyAnOicgKyBtbSArICcgJyArIEFtUG07XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52YWxpZDogZnVuY3Rpb24oaGhtbSkge1xuICAgICAgICAgICAgcmV0dXJuICEvXigwP1sxLTldfDFbMC0yXSk6WzAtNV1cXGQkLy50ZXN0KGhobW0pOyAvLyAxMjo1OSBtYXhcbiAgICAgICAgfSxcblxuICAgICAgICAvLyByZXR1cm5zIG51bWJlciBmcm9tIGZvcm1hdHRlZCBzdHJpbmdcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKGhobW0pIHtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IGhobW0ubWF0Y2goL14oXFxkKyk6KFxcZHsyfSkkLyk7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyKHBhcnRzWzFdKSAqIDYwICsgTnVtYmVyKHBhcnRzWzJdKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGdyaWQ7XG5cbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuLyogZ2xvYmFscyBmaW4sIHBlb3BsZTEgKi9cblxuLyogZXNsaW50LWRpc2FibGUgbm8tYWxlcnQqL1xuXG4ndXNlIHN0cmljdCc7XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblxuICAgIHZhciBkZW1vID0gd2luZG93LmRlbW8gPSB7XG4gICAgICAgIHNldCB2ZW50KHN0YXJ0KSB7IHdpbmRvdy5ncmlkW3N0YXJ0ID8gJ2xvZ1N0YXJ0JyA6ICdsb2dTdG9wJ10oKTsgfSxcbiAgICAgICAgcmVzZXQ6IHJlc2V0LFxuICAgICAgICBzZXREYXRhOiBzZXREYXRhLFxuICAgICAgICB0b2dnbGVFbXB0eURhdGE6IHRvZ2dsZUVtcHR5RGF0YSxcbiAgICAgICAgcmVzZXREYXRhOiByZXNldERhdGFcbiAgICB9O1xuXG4gICAgdmFyIEh5cGVyZ3JpZCA9IGZpbi5IeXBlcmdyaWQsXG4gICAgICAgIGluaXRTdGF0ZSA9IHJlcXVpcmUoJy4vc2V0U3RhdGUnKSxcbiAgICAgICAgaW5pdENlbGxSZW5kZXJlcnMgPSByZXF1aXJlKCcuL2NlbGxyZW5kZXJlcnMnKSxcbiAgICAgICAgaW5pdEZvcm1hdHRlcnMgPSByZXF1aXJlKCcuL2Zvcm1hdHRlcnMnKSxcbiAgICAgICAgaW5pdENlbGxFZGl0b3JzID0gcmVxdWlyZSgnLi9jZWxsZWRpdG9ycycpLFxuICAgICAgICBpbml0RGFzaGJvYXJkID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQnKSxcbiAgICAgICAgaW5pdEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbiAgICAvLyBjb252ZXJ0IGZpZWxkIG5hbWVzIGNvbnRhaW5pbmcgdW5kZXJzY29yZSB0byBjYW1lbCBjYXNlIGJ5IG92ZXJyaWRpbmcgY29sdW1uIGVudW0gZGVjb3JhdG9yXG4gICAgSHlwZXJncmlkLmJlaGF2aW9ycy5KU09OLnByb3RvdHlwZS5jb2x1bW5FbnVtS2V5ID0gSHlwZXJncmlkLmJlaGF2aW9ycy5KU09OLmNvbHVtbkVudW1EZWNvcmF0b3JzLnRvQ2FtZWxDYXNlO1xuXG4gICAgdmFyIHNjaGVtYSA9IEh5cGVyZ3JpZC5saWIuZmllbGRzLmdldFNjaGVtYShwZW9wbGUxKTtcblxuICAgIC8vIGFzIG9mIHYyLjEuNiwgY29sdW1uIHByb3BlcnRpZXMgY2FuIGFsc28gYmUgaW5pdGlhbGl6ZWQgZnJvbSBjdXN0b20gc2NoZW1hIChhcyB3ZWxsIGFzIGZyb20gYSBncmlkIHN0YXRlIG9iamVjdCkuXG4gICAgLy8gVGhlIGZvbGxvd2luZyBkZW1vbnN0cmF0ZXMgdGhpcy4gTm90ZSB0aGF0IGRlbW8vc2V0U3RhdGUuanMgYWxzbyBzZXRzIHByb3BzIG9mICdoZWlnaHQnIGNvbHVtbi4gVGhlIHNldFN0YXRlXG4gICAgLy8gY2FsbCB0aGVyZWluIHdhcyBjaGFuZ2VkIHRvIGFkZFN0YXRlIHRvIGFjY29tbW9kYXRlIChlbHNlIHNjaGVtYSBwcm9wcyBkZWZpbmVkIGhlcmUgd291bGQgaGF2ZSBiZWVuIGNsZWFyZWQpLlxuICAgIE9iamVjdC5hc3NpZ24oc2NoZW1hLmZpbmQoZnVuY3Rpb24oY29sdW1uU2NoZW1hKSB7IHJldHVybiBjb2x1bW5TY2hlbWEubmFtZSA9PT0gJ2hlaWdodCc7IH0pLCB7XG4gICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgLy8gZm9ybWF0OiAnZm9vdCcgLS0tIGZvciBkZW1vIHB1cnBvc2VzLCB0aGlzIHByb3AgYmVpbmcgc2V0IGluIHNldFN0YXRlLmpzIChzZWUpXG4gICAgfSk7XG5cbiAgICB2YXIgZ3JpZE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXRhOiBwZW9wbGUxLFxuICAgICAgICAgICAgbWFyZ2luOiB7IGJvdHRvbTogJzE3cHgnLCByaWdodDogJzE3cHgnfSxcbiAgICAgICAgICAgIHNjaGVtYTogc2NoZW1hLFxuICAgICAgICAgICAgcGx1Z2luczogcmVxdWlyZSgnZmluLWh5cGVyZ3JpZC1ldmVudC1sb2dnZXInKSxcbiAgICAgICAgICAgIHN0YXRlOiB7IGNvbG9yOiAnb3JhbmdlJyB9XG4gICAgICAgIH0sXG4gICAgICAgIGdyaWQgPSB3aW5kb3cuZ3JpZCA9IHdpbmRvdy5nID0gbmV3IEh5cGVyZ3JpZCgnZGl2I2pzb24tZXhhbXBsZScsIGdyaWRPcHRpb25zKSxcbiAgICAgICAgYmVoYXZpb3IgPSB3aW5kb3cuYiA9IGdyaWQuYmVoYXZpb3IsXG4gICAgICAgIGRhdGFNb2RlbCA9IHdpbmRvdy5tID0gYmVoYXZpb3IuZGF0YU1vZGVsLFxuICAgICAgICBpZHggPSBiZWhhdmlvci5jb2x1bW5FbnVtO1xuXG5cbiAgICBjb25zb2xlLmxvZygnRmllbGRzOicpOyAgY29uc29sZS5kaXIoYmVoYXZpb3IuZGF0YU1vZGVsLnNjaGVtYS5tYXAoZnVuY3Rpb24oY3MpIHsgcmV0dXJuIGNzLm5hbWU7IH0pKTtcbiAgICBjb25zb2xlLmxvZygnSGVhZGVyczonKTsgY29uc29sZS5kaXIoYmVoYXZpb3IuZGF0YU1vZGVsLnNjaGVtYS5tYXAoZnVuY3Rpb24oY3MpIHsgcmV0dXJuIGNzLmhlYWRlcjsgfSkpO1xuICAgIGNvbnNvbGUubG9nKCdJbmRleGVzOicpOyBjb25zb2xlLmRpcihpZHgpO1xuXG4gICAgZnVuY3Rpb24gc2V0RGF0YShkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKTtcbiAgICAgICAgb3B0aW9ucy5zY2hlbWEgPSBvcHRpb25zLnNjaGVtYSB8fCBbXTtcbiAgICAgICAgZ3JpZC5zZXREYXRhKGRhdGEsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgICBncmlkLnJlc2V0KCk7XG4gICAgICAgIGluaXRFdmVudHMoZGVtbywgZ3JpZCk7XG4gICAgfVxuXG4gICAgdmFyIG9sZERhdGE7XG4gICAgZnVuY3Rpb24gdG9nZ2xlRW1wdHlEYXRhKCkge1xuICAgICAgICBpZiAoIW9sZERhdGEpIHtcbiAgICAgICAgICAgIG9sZERhdGEgPSB7XG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YU1vZGVsLmdldERhdGEoKSxcbiAgICAgICAgICAgICAgICBzY2hlbWE6IGRhdGFNb2RlbC5zY2hlbWEsXG4gICAgICAgICAgICAgICAgYWN0aXZlQ29sdW1uczogYmVoYXZpb3IuZ2V0QWN0aXZlQ29sdW1ucygpLm1hcChmdW5jdGlvbihjb2x1bW4pIHsgcmV0dXJuIGNvbHVtbi5pbmRleDsgfSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvL2ltcG9ydGFudCB0byBzZXQgdG9wIHRvdGFscyBmaXJzdFxuICAgICAgICAgICAgc2V0RGF0YShbXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL2ltcG9ydGFudCB0byBzZXQgdG9wIHRvdGFscyBmaXJzdFxuICAgICAgICAgICAgc2V0RGF0YShvbGREYXRhLmRhdGEsIG9sZERhdGEuc2NoZW1hKTtcbiAgICAgICAgICAgIGJlaGF2aW9yLnNldENvbHVtbkluZGV4ZXMob2xkRGF0YS5hY3RpdmVDb2x1bW5zKTtcbiAgICAgICAgICAgIG9sZERhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNldERhdGEoKSB7XG4gICAgICAgIHNldERhdGEocGVvcGxlMSk7XG4gICAgICAgIGluaXRTdGF0ZShkZW1vLCBncmlkKTtcbiAgICB9XG5cbiAgICBpbml0Q2VsbFJlbmRlcmVycyhkZW1vLCBncmlkKTtcbiAgICBpbml0Rm9ybWF0dGVycyhkZW1vLCBncmlkKTtcbiAgICBpbml0Q2VsbEVkaXRvcnMoZGVtbywgZ3JpZCk7XG4gICAgaW5pdEV2ZW50cyhkZW1vLCBncmlkKTtcbiAgICBpbml0RGFzaGJvYXJkKGRlbW8sIGdyaWQpO1xuICAgIGluaXRTdGF0ZShkZW1vLCBncmlkKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVtbywgZ3JpZCkge1xuXG4gICAgdmFyIGlkeCA9IGdyaWQuYmVoYXZpb3IuY29sdW1uRW51bTtcblxuICAgIHZhciBzdGF0ZSA9IHtcbiAgICAgICAgY29sdW1uSW5kZXhlczogW1xuICAgICAgICAgICAgaWR4Lmxhc3ROYW1lLFxuICAgICAgICAgICAgaWR4LnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQsXG4gICAgICAgICAgICBpZHguaGVpZ2h0LFxuICAgICAgICAgICAgaWR4LmJpcnRoRGF0ZSxcbiAgICAgICAgICAgIGlkeC5iaXJ0aFRpbWUsXG4gICAgICAgICAgICBpZHguYmlydGhTdGF0ZSxcbiAgICAgICAgICAgIC8vIGlkeC5yZXNpZGVuY2VTdGF0ZSxcbiAgICAgICAgICAgIGlkeC5lbXBsb3llZCxcbiAgICAgICAgICAgIC8vIGlkeC5maXJzdE5hbWUsXG4gICAgICAgICAgICBpZHguaW5jb21lLFxuICAgICAgICAgICAgaWR4LnRyYXZlbCxcbiAgICAgICAgICAgIC8vIGlkeC5zcXVhcmVPZkluY29tZVxuICAgICAgICBdLFxuXG4gICAgICAgIG5vRGF0YU1lc3NhZ2U6ICdObyBEYXRhIHRvIERpc3BsYXknLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd3aGl0ZScsXG4gICAgICAgIGZvbnQ6ICdub3JtYWwgc21hbGwgZ2FyYW1vbmQnLFxuICAgICAgICByb3dTdHJpcGVzOiBbXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICB7IGNvbG9yOiAnIzExNjYxMScsIGJhY2tncm91bmRDb2xvcjogJyNlOGZmZTgnLCBmb250OiAnaXRhbGljIHNtYWxsIGdhcmFtb25kJyB9LFxuICAgICAgICAgICAgeyBjb2xvcjogJyMxMTY2MTEnLCBiYWNrZ3JvdW5kQ29sb3I6ICcjZThmZmU4JywgZm9udDogJ2l0YWxpYyBzbWFsbCBnYXJhbW9uZCcgfSxcbiAgICAgICAgICAgIHsgY29sb3I6ICcjMTE2NjExJywgYmFja2dyb3VuZENvbG9yOiAnI2U4ZmZlOCcsIGZvbnQ6ICdpdGFsaWMgc21hbGwgZ2FyYW1vbmQnIH1cbiAgICAgICAgXSxcblxuICAgICAgICBmaXhlZENvbHVtbkNvdW50OiAxLFxuICAgICAgICBmaXhlZFJvd0NvdW50OiA0LFxuXG4gICAgICAgIGNvbHVtbkF1dG9zaXppbmc6IGZhbHNlLFxuICAgICAgICBoZWFkZXJUZXh0V3JhcHBpbmc6IHRydWUsXG5cbiAgICAgICAgaGFsaWduOiAnbGVmdCcsXG4gICAgICAgIHJlbmRlckZhbHN5OiB0cnVlLFxuXG4gICAgICAgIHNjcm9sbGJhckhvdmVyT2ZmOiAndmlzaWJsZScsXG4gICAgICAgIHNjcm9sbGJhckhvdmVyT3ZlcjogJ3Zpc2libGUnLFxuICAgICAgICBjb2x1bW5IZWFkZXJCYWNrZ3JvdW5kQ29sb3I6ICdwaW5rJyxcblxuICAgICAgICBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zOiB0cnVlLFxuXG4gICAgICAgIGF1dG9TZWxlY3RSb3dzOiB0cnVlLFxuXG4gICAgICAgIHJvd3M6IHtcbiAgICAgICAgICAgIGhlYWRlcjoge1xuICAgICAgICAgICAgICAgIDA6IHtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiA0MFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBjYWxjdWxhdG9yczoge1xuICAgICAgICAgICAgQWRkMTA6ICdmdW5jdGlvbihkYXRhUm93LGNvbHVtbk5hbWUpIHsgcmV0dXJuIGRhdGFSb3dbY29sdW1uTmFtZV0gKyAxMDsgfSdcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBBTlRJLVBBVFRFUk5TIEZPTExPV1xuICAgICAgICAvL1xuICAgICAgICAvLyBTZXR0aW5nIGNvbHVtbiwgcm93LCBjZWxsIHByb3BzIGhlcmUgaW4gYSBzdGF0ZSBvYmplY3QgaXMgYSBsZWdhY3kgZmVhdHVyZS5cbiAgICAgICAgLy8gRGV2ZWxvcGVycyBtYXkgZmluZCBpdCBtb3JlIHVzZWZ1bCB0byBzZXQgY29sdW1uIHByb3BzIGluIGNvbHVtbiBzY2hlbWEgKGFzIG9mIHYyLjEuNiksXG4gICAgICAgIC8vIHJvdyBwcm9wcyBpbiByb3cgbWV0YWRhdGEgKGFzIG9mIHYyLjEuMCksIGFuZCBjZWxsIHByb3BzIGluIGNvbHVtbiBtZXRhZGF0YSAoYXMgb2YgdjIuMC4yKSxcbiAgICAgICAgLy8gd2hpY2ggd291bGQgdGhlbiBwZXJzaXN0IGFjcm9zcyBzZXRTdGF0ZSBjYWxscyB3aGljaCBjbGVhciB0aGVzZSBwcm9wZXJ0aWVzIG9iamVjdHNcbiAgICAgICAgLy8gYmVmb3JlIGFwcGx5aW5nIG5ldyB2YWx1ZXMuIEluIHRoaXMgZGVtbywgd2UgaGF2ZSBjaGFuZ2VkIHRoZSBzZXRTdGF0ZSBjYWxsIGJlbG93IHRvIGFkZFN0YXRlXG4gICAgICAgIC8vICh3aGljaCBkb2VzIG5vdCBjbGVhciB0aGUgcHJvcGVydGllcyBvYmplY3QgZmlyc3QpIHRvIHNob3cgaG93IHRvIHNldCBhIGNvbHVtbiBwcm9wIGhlcmUgKmFuZCpcbiAgICAgICAgLy8gYSBkaWZmZXJlbnQgcHJvcCBvbiB0aGUgc2FtZSBjb2x1bW4gaW4gc2NoZW1hIChpbiBpbmRleC5qcykuXG5cbiAgICAgICAgY29sdW1uczoge1xuICAgICAgICAgICAgaGVpZ2h0OiB7XG4gICAgICAgICAgICAgICAgLy8gaGFsaWduOiAncmlnaHQnLCAtLS0gZm9yIGRlbW8gcHVycG9zZXMsIHRoaXMgcHJvcCBiZWluZyBzZXQgaW4gaW5kZXguanMgKHNlZSlcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdmb290J1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG4gICAgICAgICAgICBsYXN0X25hbWU6IHtcbiAgICAgICAgICAgICAgICBjb2x1bW5IZWFkZXJCYWNrZ3JvdW5kQ29sb3I6ICcjMTQyQjZGJywgLy9kYXJrIGJsdWVcbiAgICAgICAgICAgICAgICBjb2x1bW5IZWFkZXJDb2xvcjogJ3doaXRlJyxcbiAgICAgICAgICAgICAgICBjb2x1bW5IZWFkZXJIYWxpZ246ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICByaWdodEljb246ICdkb3duLXJlY3RhbmdsZScsXG4gICAgICAgICAgICAgICAgbGluazogdHJ1ZVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZmlyc3RfbmFtZToge1xuXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB0b3RhbF9udW1iZXJfb2ZfcGV0c19vd25lZDoge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICBjYWxjdWxhdG9yOiAnQWRkMTAnLFxuICAgICAgICAgICAgICAgIGNvbG9yOiAnZ3JlZW4nXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBiaXJ0aERhdGU6IHtcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdzaW5nZGF0ZScsXG4gICAgICAgICAgICAgICAgcmlnaHRJY29uOiAnY2FsZW5kYXInLFxuICAgICAgICAgICAgICAgIC8vc3RyaWtlVGhyb3VnaDogdHJ1ZVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYmlydGhUaW1lOiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgICAgIGVkaXRvcjogJ3RpbWUnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ2hobW0nXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBiaXJ0aFN0YXRlOiB7XG4gICAgICAgICAgICAgICAgZWRpdG9yOiAnY29sb3J0ZXh0JyxcbiAgICAgICAgICAgICAgICByaWdodEljb246ICdkb3duLXJlY3RhbmdsZSdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlc2lkZW5jZVN0YXRlOiB7XG4gICAgICAgICAgICAgICAgcmlnaHRJY29uOiAnZG93bi1yZWN0YW5nbGUnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBlbXBsb3llZDoge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICByZW5kZXJlcjogJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnd2hpdGUnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBpbmNvbWU6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAncG91bmRzJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdHJhdmVsOiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ2ZyYW5jcydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvLyBGb2xsb3dpbmcgYGNlbGxzYCBleGFtcGxlIHNldHMgcHJvcGVydGllcyBmb3IgYSBjZWxsIGluIHRoZSBkYXRhIHN1YmdyaWQuXG4gICAgICAgIC8vIFNwZWNpZnlpbmcgY2VsbCBwcm9wZXJ0aWVzIGhlcmUgaW4gZ3JpZCBzdGF0ZSBtYXkgYmUgdXNlZnVsIGZvciBzdGF0aWMgZGF0YSBzdWJncmlkc1xuICAgICAgICAvLyB3aGVyZSBjZWxsIGNvb3JkaW5hdGVzIGFyZSBwZXJtYW5lbnRseSBhc3NpZ25lZC4gT3RoZXJ3aXNlLCBmb3IgbXkgZHluYW1pYyBncmlkIGRhdGEsXG4gICAgICAgIC8vIGNlbGwgcHJvcGVydGllcyBtaWdodCBtb3JlIHByb3Blcmx5IGFjY29tcGFueSB0aGUgZGF0YSBpdHNlbGYgYXMgbWV0YWRhdGFcbiAgICAgICAgLy8gKGkuZS4sIGFzIGEgaGFzaCBpbiBkYXRhUm93Ll9fTUVUQVtmaWVsZE5hbWVdKS5cbiAgICAgICAgY2VsbHM6IHtcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAxNjoge1xuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQ6ICcxMHB0IFRhaG9tYScsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ2xpZ2h0Ymx1ZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGFsaWduOiAnbGVmdCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBncmlkLmFkZFN0YXRlKHN0YXRlKTsgLy8gY2hhbmdlZCBmcm9tIHNldFN0YXRlIHNvICdoZWlnaHQnIHByb3BzIHNldCB3aXRoIHNjaGVtYSBpbiBpbmRleC5qcyB3b3VsZG4ndCBiZSBjbGVhcmVkXG5cbiAgICBncmlkLnRha2VGb2N1cygpO1xuXG4gICAgZGVtby5yZXNldERhc2hib2FyZCgpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNhdGFsb2cgPSByZXF1aXJlKCdvYmplY3QtY2F0YWxvZycpO1xudmFyIGZpbmQgPSByZXF1aXJlKCdtYXRjaC1wb2ludCcpO1xudmFyIEdyZXlsaXN0ID0gcmVxdWlyZSgnZ3JleWxpc3QnKTtcblxuXG52YXIgaXNET00gPSAoXG4gICAgdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwod2luZG93KSA9PT0gJ1tvYmplY3QgV2luZG93XScgJiZcbiAgICB0eXBlb2Ygd2luZG93Lk5vZGUgPT09ICdmdW5jdGlvbidcbik7XG5cbnZhciBpc0RvbU5vZGUgPSBpc0RPTSA/IGZ1bmN0aW9uKG9iaikgeyByZXR1cm4gb2JqIGluc3RhbmNlb2Ygd2luZG93Lk5vZGUgfSA6IGZ1bmN0aW9uKCkge307XG5cblxuLyoqXG4gKiBAc3VtbWFyeSBTZWFyY2ggYW4gb2JqZWN0J3MgY29kZSBmb3IgcGF0dGVybiBtYXRjaGVzLlxuICogQGRlc2MgU2VhcmNoZXMgYWxsIGNvZGUgaW4gdGhlIHZpc2libGUgZXhlY3V0aW9uIGNvbnRleHQgdXNpbmcgdGhlIHByb3ZpZGVkIHJlZ2V4IHBhdHRlcm4sIHJldHVybmluZyB0aGUgZW50aXJlIHBhdHRlcm4gbWF0Y2guXG4gKlxuICogSWYgY2FwdHVyZSBncm91cHMgYXJlIHNwZWNpZmllZCBpbiB0aGUgcGF0dGVybiwgcmV0dXJucyB0aGUgbGFzdCBjYXB0dXJlIGdyb3VwIG1hdGNoLCB1bmxlc3MgYG9wdGlvbnMuY2FwdHVyZUdyb3VwYCBpcyBkZWZpbmVkLCBpbiB3aGljaCBjYXNlIHJldHVybnMgdGhlIGdyb3VwIHdpdGggdGhhdCBpbmRleCB3aGVyZSBgMGAgbWVhbnMgdGhlIGVudGlyZSBwYXR0ZXJuLCBfZXRjLl8gKHBlciBgU3RyaW5nLnByb3RvdHlwZS5tYXRjaGApLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cH0gcGF0dGVybiAtIFNlYXJjaCBhcmd1bWVudC5cbiAqIERvbid0IHVzZSBnbG9iYWwgZmxhZyBvbiBSZWdFeHA7IGl0J3MgdW5uZWNlc3NhcnkgYW5kIHN1cHByZXNzZXMgc3VibWF0Y2hlcyBvZiBjYXB0dXJlIGdyb3Vwcy5cbiAqXG4gKiBAcGFyYW0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuY2FwdHVyZUdyb3VwXSAtIElmZiBkZWZpbmVkLCBpbmRleCBvZiBhIHNwZWNpZmljIGNhcHR1cmUgZ3JvdXAgdG8gcmV0dXJuIGZvciBlYWNoIG1hdGNoLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yZWN1cnNlXSAtIEVxdWl2YWxlbnQgdG8gc2V0dGluZyBib3RoIGByZWN1cnNlT3duYCBhbmQgYHJlY3Vyc2VBbmNlc3RvcnNgLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yZWN1cnNlT3duXSAtIFJlY3Vyc2Ugb3duIHN1Ym9iamVjdHMuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJlY3Vyc2VBbmNlc3RvcnNdIC0gUmVjdXJzZSBzdWJvYmplY3RzIG9mIG9iamVjdHMgb2YgdGhlIGVudGlyZSBwcm90b3R5cGUgY2hhaW4uXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuZ3JleWxpc3RdIC0gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC9ncmV5bGlzdFxuICogQHBhcmFtIFtvcHRpb25zLmdyZXlsaXN0LndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBtYXRjaGVzIGFyZSBpbmNsdWRlZCBpbiB0aGUgcmVzdWx0cy5cbiAqIEBwYXJhbSBbb3B0aW9ucy5ncmV5bGlzdC5ibGFja10gLSBJZiBnaXZlbiwgbGlzdGVkIG1hdGNoZXMgYXJlIGV4Y2x1ZGVkIGZyb20gdGhlIHJlc3VsdHMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLmNhdGFsb2ddIC0gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC9vYmplY3QtY2F0YWxvZ1xuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jYXRhbG9nLm93bl0gLSBPbmx5IHNlYXJjaCBvd24gb2JqZWN0OyBvdGhlcndpc2Ugc2VhcmNoIG93biArIGVudGlyZSBwcm90b3R5cGUgY2hhaW4uXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuY2F0YWxvZy5ncmV5bGlzdF0gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L2dyZXlsaXN0XG4gKiBAcGFyYW0gW29wdGlvbnMuY2F0YWxvZy5ncmV5bGlzdC53aGl0ZV0gLSBJZiBnaXZlbiwgb25seSBsaXN0ZWQgbWVtYmVycyBhcmUgY2F0YWxvZ2VkLlxuICogQHBhcmFtIFtvcHRpb25zLmNhdGFsb2cuZ3JleWxpc3QuYmxhY2tdIC0gSWYgZ2l2ZW4sIGxpc3RlZCBtZW1iZXJzIGFyZSAqbm90KiBjYXRhbG9nZWQuXG4gKlxuICogQHJldHVybnMge3N0cmluZ1tdfSBQYXR0ZXJuIG1hdGNoZXMuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoKHBhdHRlcm4sIG9wdGlvbnMsIGJ5R3JleWxpc3QsIG1hdGNoZXMsIHNjYW5uZWQpIHtcbiAgICB2YXIgdG9wTGV2ZWxDYWxsID0gIW1hdGNoZXM7XG5cbiAgICBpZiAodG9wTGV2ZWxDYWxsKSB7XG4gICAgICAgIC8vIHRoaXMgaXMgdGhlIHRvcC1sZXZlbCAobm9uLXJlY3Vyc2VkKSBjYWxsIHNvIGludGlhbGl6ZTpcbiAgICAgICAgdmFyIGdyZXlsaXN0ID0gbmV3IEdyZXlsaXN0KG9wdGlvbnMgJiYgb3B0aW9ucy5ncmV5bGlzdCk7XG4gICAgICAgIGJ5R3JleWxpc3QgPSBncmV5bGlzdC50ZXN0LmJpbmQoZ3JleWxpc3QpO1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgbWF0Y2hlcyA9IFtdO1xuICAgICAgICBzY2FubmVkID0gW107XG4gICAgfVxuXG4gICAgdmFyIHJvb3QgPSB0aGlzO1xuICAgIHZhciBtZW1iZXJzID0gY2F0YWxvZy5jYWxsKHJvb3QsIG9wdGlvbnMuY2F0YWxvZyk7XG5cbiAgICBzY2FubmVkLnB1c2gocm9vdCk7XG5cbiAgICBPYmplY3Qua2V5cyhtZW1iZXJzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdmFyIG9iaiA9IG1lbWJlcnNba2V5XTtcbiAgICAgICAgdmFyIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwga2V5KTtcblxuICAgICAgICBpZiAoZGVzY3JpcHRvci52YWx1ZSA9PT0gbWF0Y2gpIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gZG9uJ3QgY2F0YWxvZyBzZWxmIHdoZW4gZm91bmQgdG8gaGF2ZSBiZWVuIG1peGVkIGluXG4gICAgICAgIH1cblxuICAgICAgICBPYmplY3Qua2V5cyhkZXNjcmlwdG9yKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wTmFtZSkge1xuICAgICAgICAgICAgdmFyIGhpdHMsIHByb3AgPSBkZXNjcmlwdG9yW3Byb3BOYW1lXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9wID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvcE5hbWUgbXVzdCBiZSBgZ2V0YCBvciBgc2V0YCBvciBgdmFsdWVgXG4gICAgICAgICAgICAgICAgaGl0cyA9IGZpbmQocHJvcC50b1N0cmluZygpLCBwYXR0ZXJuLCBvcHRpb25zLmNhcHR1cmVHcm91cCkuZmlsdGVyKGJ5R3JleWxpc3QpO1xuICAgICAgICAgICAgICAgIGhpdHMuZm9yRWFjaChmdW5jdGlvbihoaXQpIHsgbWF0Y2hlcy5wdXNoKGhpdCk7IH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAob3B0aW9ucy5yZWN1cnNlIHx8IG9wdGlvbnMucmVjdXJzZU93biAmJiBvYmogPT09IHJvb3QgfHwgb3B0aW9ucy5yZWN1cnNlQ2hhaW4gJiYgb2JqICE9PSByb290KSAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBwcm9wID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgICAgICAgICFpc0RvbU5vZGUocHJvcCkgJiYgLy8gZG9uJ3Qgc2VhcmNoIERPTSBvYmplY3RzXG4gICAgICAgICAgICAgICAgc2Nhbm5lZC5pbmRleE9mKHByb3ApIDwgMCAvLyBkb24ndCByZWN1cnNlIG9uIG9iamVjdHMgYWxyZWFkeSBzY2FubmVkXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9wTmFtZSBtdXN0IGJlIGB2YWx1ZWBcbiAgICAgICAgICAgICAgICBtYXRjaC5jYWxsKHByb3AsIHBhdHRlcm4sIG9wdGlvbnMsIGJ5R3JleWxpc3QsIG1hdGNoZXMsIHNjYW5uZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGlmICh0b3BMZXZlbENhbGwpIHtcbiAgICAgICAgbWF0Y2hlcy5zb3J0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoZXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWF0Y2g7IiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBsb2dFdmVudE9iamVjdChlKSB7XG4gICAgdGhpcy5sb2coZS50eXBlLCAnOjonLCBlKTtcbn1cblxuZnVuY3Rpb24gbG9nRGV0YWlsKGUpIHtcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsIGUuZGV0YWlsKTtcbn1cblxuZnVuY3Rpb24gbG9nU2Nyb2xsKGUpIHtcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsIGUuZGV0YWlsLnZhbHVlKTtcbn1cblxuZnVuY3Rpb24gbG9nQ2VsbChlKSB7XG4gICAgdmFyIGdDZWxsID0gZS5kZXRhaWwuZ3JpZENlbGw7XG4gICAgdmFyIGRDZWxsID0gZS5kZXRhaWwuZGF0YUNlbGw7XG4gICAgdGhpcy5sb2coZS50eXBlLCAnOjonLFxuICAgICAgICAnZ3JpZC1jZWxsOicsIHsgeDogZ0NlbGwueCwgeTogZ0NlbGwueSB9LFxuICAgICAgICAnZGF0YS1jZWxsOicsIHsgeDogZENlbGwueCwgeTogZENlbGwueSB9KTtcbn1cblxuZnVuY3Rpb24gbG9nU2VsZWN0aW9uKGUpIHtcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsIGUuZGV0YWlsLnJvd3MsIGUuZGV0YWlsLmNvbHVtbnMsIGUuZGV0YWlsLnNlbGVjdGlvbnMpO1xufVxuXG5mdW5jdGlvbiBsb2dSb3coZSkge1xuICAgIHZhciByb3dDb250ZXh0ID0gZS5kZXRhaWwucHJpbWl0aXZlRXZlbnQuZGF0YVJvdztcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsICdyb3ctY29udGV4dDonLCByb3dDb250ZXh0KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ2Zpbi1jZWxsLWVudGVyJzogbG9nQ2VsbCxcbiAgICAnZmluLWNsaWNrJzogbG9nQ2VsbCxcbiAgICAnZmluLWRvdWJsZS1jbGljayc6IGxvZ1JvdyxcbiAgICAnZmluLXNlbGVjdGlvbi1jaGFuZ2VkJzogbG9nU2VsZWN0aW9uLFxuICAgICdmaW4tY29udGV4dC1tZW51JzogbG9nQ2VsbCxcblxuICAgICdmaW4tc2Nyb2xsLXgnOiBsb2dTY3JvbGwsXG4gICAgJ2Zpbi1zY3JvbGwteSc6IGxvZ1Njcm9sbCxcblxuICAgICdmaW4tcm93LXNlbGVjdGlvbi1jaGFuZ2VkJzogbG9nRGV0YWlsLFxuICAgICdmaW4tY29sdW1uLXNlbGVjdGlvbi1jaGFuZ2VkJzogbG9nRGV0YWlsLFxuICAgICdmaW4tZWRpdG9yLWRhdGEtY2hhbmdlJzogbG9nRGV0YWlsLFxuICAgICdmaW4tZWRpdG9yLWtleXVwJzogbG9nRGV0YWlsLFxuICAgICdmaW4tZWRpdG9yLWtleXByZXNzJzogbG9nRGV0YWlsLFxuICAgICdmaW4tZWRpdG9yLWtleWRvd24nOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1ncm91cHMtY2hhbmdlZCc6IGxvZ0RldGFpbCxcblxuICAgICdmaW4tZmlsdGVyLWFwcGxpZWQnOiBsb2dFdmVudE9iamVjdCxcbiAgICAnZmluLXJlcXVlc3QtY2VsbC1lZGl0JzogbG9nRXZlbnRPYmplY3QsXG4gICAgJ2Zpbi1iZWZvcmUtY2VsbC1lZGl0JzogbG9nRXZlbnRPYmplY3QsXG4gICAgJ2Zpbi1hZnRlci1jZWxsLWVkaXQnOiBsb2dFdmVudE9iamVjdFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFN0YXJMb2cgPSByZXF1aXJlKCdzdGFybG9nJyk7XG5cbnZhciBldmVudExvZ2dlclBsdWdpbiA9IHtcblxuICAgIHN0YXJ0OiBmdW5jdGlvbihvcHRpb25zKVxuICAgIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgdGhpcy5zdGFybG9nKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJsb2cuc3RvcCgpOyAvLyBzdG9wIHRoZSBvbGQgb25lIGJlZm9yZSByZWRlZmluaW5nIGl0IHdpdGggbmV3IG9wdGlvbnMgb2JqZWN0XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuc3RhcmxvZyB8fCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIC8vIHNlYXJjaCBncmlkIG9iamVjdCBmb3IgXCJFdmVudCgneWFkYS15YWRhJ1wiIG9yIFwiRXZlbnQuY2FsbCh0aGlzLCAneWFkYS15YWRhJ1wiXG4gICAgICAgICAgICBvcHRpb25zLnNlbGVjdCA9IG9wdGlvbnMuc2VsZWN0IHx8IHRoaXM7XG4gICAgICAgICAgICBvcHRpb25zLnBhdHRlcm4gPSBvcHRpb25zLnBhdHRlcm4gfHwgL0V2ZW50KFxcLmNhbGxcXCh0aGlzLCB8XFwoKScoZmluLVthLXotXSspJy87XG4gICAgICAgICAgICBvcHRpb25zLnRhcmdldHMgPSBvcHRpb25zLnRhcmdldHMgfHwgdGhpcy5jYW52YXMuY2FudmFzO1xuXG4gICAgICAgICAgICAvLyBtaXggb3B0aW9ucy5saXN0ZW5lckRpY3Rpb25hcnkgb24gdG9wIG9mIHNvbWUgY3VzdG9tIGxpc3RlbmVyc1xuICAgICAgICAgICAgb3B0aW9ucy5saXN0ZW5lckRpY3Rpb25hcnkgPSBPYmplY3QuYXNzaWduKHt9LCByZXF1aXJlKCcuL2N1c3RvbS1saXN0ZW5lcnMnKSwgb3B0aW9ucy5saXN0ZW5lckRpY3Rpb25hcnkpO1xuXG4gICAgICAgICAgICAvLyBtaXggZmluLXRpY2sgb24gdG9wIG9mIG9wdGlvbnMubWF0Y2guZ3JleWxpc3QuYmxhY2tcbiAgICAgICAgICAgIHZhciBibGFjayA9IFsnZmluLXRpY2snXTtcbiAgICAgICAgICAgIG9wdGlvbnMubWF0Y2ggPSBvcHRpb25zLm1hdGNoIHx8IHt9O1xuICAgICAgICAgICAgb3B0aW9ucy5tYXRjaC5ncmV5bGlzdCA9IG9wdGlvbnMubWF0Y2guZ3JleWxpc3QgfHwge307XG4gICAgICAgICAgICBvcHRpb25zLm1hdGNoLmdyZXlsaXN0LmJsYWNrID0gb3B0aW9ucy5tYXRjaC5ncmV5bGlzdC5ibGFjayA/IGJsYWNrLmNvbmNhdChvcHRpb25zLm1hdGNoLmdyZXlsaXN0LmJsYWNrKSA6IGJsYWNrO1xuXG4gICAgICAgICAgICB0aGlzLnN0YXJsb2cgPSBuZXcgU3RhckxvZyhvcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RhcmxvZy5zdGFydCgpO1xuICAgIH0sXG5cbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zdGFybG9nLnN0b3AoKTtcbiAgICB9XG5cbn07XG5cbi8vIE5vbi1lbnVtZXJhYmxlIG1ldGhvZHMgYXJlIG5vdCB0aGVtc2VsdmVzIGluc3RhbGxlZDpcbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGV2ZW50TG9nZ2VyUGx1Z2luLCB7XG4gICAgcHJlaW5zdGFsbDoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24oSHlwZXJncmlkUHJvdG90eXBlLCBCZWhhdmlvclByb3RvdHlwZSwgbWV0aG9kUHJlZml4KSB7XG4gICAgICAgICAgICBpbnN0YWxsLmNhbGwodGhpcywgSHlwZXJncmlkUHJvdG90eXBlLCBtZXRob2RQcmVmaXgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluc3RhbGw6IHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uKGdyaWQsIG1ldGhvZFByZWZpeCkge1xuICAgICAgICAgICAgaW5zdGFsbC5jYWxsKHRoaXMsIGdyaWQsIG1ldGhvZFByZWZpeCk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuZnVuY3Rpb24gaW5zdGFsbCh0YXJnZXQsIG1ldGhvZFByZWZpeCkge1xuICAgIGlmIChtZXRob2RQcmVmaXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtZXRob2RQcmVmaXggPSAnbG9nJztcbiAgICB9XG4gICAgT2JqZWN0LmtleXModGhpcykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHRhcmdldFtwcmVmaXgobWV0aG9kUHJlZml4LCBrZXkpXSA9IHRoaXNba2V5XTtcbiAgICB9LCB0aGlzKTtcbn1cblxuZnVuY3Rpb24gcHJlZml4KHByZWZpeCwgbmFtZSkge1xuICAgIHZhciBjYXBpdGFsaXplID0gcHJlZml4Lmxlbmd0aCAmJiBwcmVmaXhbcHJlZml4Lmxlbmd0aCAtIDFdICE9PSAnXyc7XG4gICAgaWYgKGNhcGl0YWxpemUpIHtcbiAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyBuYW1lLnN1YnN0cigxKTtcbiAgICB9XG4gICAgcmV0dXJuIHByZWZpeCArIG5hbWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRMb2dnZXJQbHVnaW47XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKiBDcmVhdGVzIGFuIG9iamVjdCB3aXRoIGEgYHRlc3RgIG1ldGhvZCBmcm9tIG9wdGlvbmFsIHdoaXRlbGlzdCBhbmQvb3IgYmxhY2tsaXN0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBJZiBuZWl0aGVyIGB3aGl0ZWAgbm9yIGBibGFja2AgYXJlIGdpdmVuLCBhbGwgc3RyaW5ncyBwYXNzIGB0ZXN0YC5cbiAqIEBwYXJhbSBbb3B0aW9ucy53aGl0ZV0gLSBJZiBnaXZlbiwgb25seSBsaXN0ZWQgc3RyaW5ncyBwYXNzIGB0ZXN0YC5cbiAqIEBwYXJhbSBbb3B0aW9ucy5ibGFja10gLSBJZiBnaXZlbiwgbGlzdGVkIHN0cmluZ3MgZmFpbCBgdGVzdGAuXG4gKi9cbmZ1bmN0aW9uIEdyZXlMaXN0KG9wdGlvbnMpIHtcbiAgICB0aGlzLndoaXRlID0gZ2V0RmxhdEFycmF5T2ZSZWdleEFuZE9yU3RyaW5nKG9wdGlvbnMgJiYgb3B0aW9ucy53aGl0ZSk7XG4gICAgdGhpcy5ibGFjayA9IGdldEZsYXRBcnJheU9mUmVnZXhBbmRPclN0cmluZyhvcHRpb25zICYmIG9wdGlvbnMuYmxhY2spO1xufVxuXG5HcmV5TGlzdC5wcm90b3R5cGUudGVzdCA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHRoaXMuc3RyaW5nID0gc3RyaW5nOyAvLyBmb3IgbWF0Y2goKSB1c2VcbiAgICByZXR1cm4gKFxuICAgICAgICAhKHRoaXMud2hpdGUgJiYgIXRoaXMud2hpdGUuc29tZShtYXRjaCwgdGhpcykpICYmXG4gICAgICAgICEodGhpcy5ibGFjayAmJiB0aGlzLmJsYWNrLnNvbWUobWF0Y2gsIHRoaXMpKVxuICAgICk7XG59O1xuXG5mdW5jdGlvbiBtYXRjaChwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBwYXR0ZXJuLnRlc3QgPT09ICdmdW5jdGlvbidcbiAgICAgICAgPyBwYXR0ZXJuLnRlc3QodGhpcy5zdHJpbmcpIC8vIHR5cGljYWxseSBhIHJlZ2V4IGJ1dCBjb3VsZCBiZSBhbnl0aGluZyB0aGF0IGltcGxlbWVudHMgYHRlc3RgXG4gICAgICAgIDogdGhpcy5zdHJpbmcgPT09IHBhdHRlcm4gKyAnJzsgLy8gY29udmVydCBwYXR0ZXJuIHRvIHN0cmluZyBldmVuIGZvciBlZGdlIGNhc2VzXG59XG5cbmZ1bmN0aW9uIGdldEZsYXRBcnJheU9mUmVnZXhBbmRPclN0cmluZyhhcnJheSwgZmxhdCkge1xuICAgIGlmICghZmxhdCkge1xuICAgICAgICAvLyB0aGlzIGlzIHRoZSB0b3AtbGV2ZWwgKG5vbi1yZWN1cnNlZCkgY2FsbCBzbyBpbnRpYWxpemU6XG5cbiAgICAgICAgLy8gYHVuZGVmaW5lZGAgcGFzc2VzIHRocm91Z2ggd2l0aG91dCBiZWluZyBjb252ZXJ0ZWQgdG8gYW4gYXJyYXlcbiAgICAgICAgaWYgKGFycmF5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFycmF5aWZ5IGdpdmVuIHNjYWxhciBzdHJpbmcsIHJlZ2V4LCBvciBvYmplY3RcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5KSkge1xuICAgICAgICAgICAgYXJyYXkgPSBbYXJyYXldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBmbGF0XG4gICAgICAgIGZsYXQgPSBbXTtcbiAgICB9XG5cbiAgICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIC8vIG1ha2Ugc3VyZSBhbGwgZWxlbWVudHMgYXJlIGVpdGhlciBzdHJpbmcgb3IgUmVnRXhwXG4gICAgICAgIHN3aXRjaCAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGl0ZW0pKSB7XG4gICAgICAgICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAgICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzpcbiAgICAgICAgICAgICAgICBmbGF0LnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdbb2JqZWN0IE9iamVjdF0nOlxuICAgICAgICAgICAgICAgIC8vIHJlY3Vyc2Ugb24gY29tcGxleCBpdGVtICh3aGVuIGFuIG9iamVjdCBvciBhcnJheSlcbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29udmVydCBvYmplY3QgaW50byBhbiBhcnJheSAob2YgaXQncyBlbnVtZXJhYmxlIGtleXMsIGJ1dCBvbmx5IHdoZW4gbm90IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IE9iamVjdC5rZXlzKGl0ZW0pLmZpbHRlcihmdW5jdGlvbiAoa2V5KSB7IHJldHVybiBpdGVtW2tleV0gIT09IHVuZGVmaW5lZDsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGdldEZsYXRBcnJheU9mUmVnZXhBbmRPclN0cmluZyhpdGVtLCBmbGF0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgZmxhdC5wdXNoKGl0ZW0gKyAnJyk7IC8vIGNvbnZlcnQgdG8gc3RyaW5nXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBmbGF0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyZXlMaXN0OyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAc3VtbWFyeSBGaW5kIGFsbCBwYXR0ZXJuIG1hdGNoZXMsIHJldHVybiBzcGVjaWZpZWQgY2FwdHVyZSBncm91cCBmb3IgZWFjaC5cbiAqIEByZXR1cm5zIHtzdHJpbmdbXX0gQW4gYXJyYXkgY29udGFpbmluZyBhbGwgdGhlIHBhdHRlcm4gbWF0Y2hlcyBmb3VuZCBpbiBgc3RyaW5nYC5cbiAqIFRoZSBlbnRpcmUgcGF0dGVybiBtYXRjaCBpcyByZXR1cm5lZCB1bmxlc3MgdGhlIHBhdHRlcm4gY29udGFpbnMgb25lIG9yIG1vcmUgc3ViZ3JvdXBzIGluIHdoaWNoIGNhc2UgdGhlIHBvcnRpb24gb2YgdGhlIHBhdHRlcm4gbWF0Y2hlZCBieSB0aGUgbGFzdCBzdWJncm91cCBpcyByZXR1cm5lZCB1bmxlc3MgYGNhcHR1cmVHcm91cGAgaXMgZGVmaW5lZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmdcbiAqIEBwYXJhbSB7UmVnRXhwfSByZWdleCAtIERvbid0IHVzZSBnbG9iYWwgZmxhZzsgaXQncyB1bm5lY2Vzc2FyeSBhbmQgc3VwcHJlc3NlcyBzdWJtYXRjaGVzIG9mIGNhcHR1cmUgZ3JvdXBzLlxuICogQHBhcmFtIHtudW1iZXJ9IFtjYXB0dXJlR3JvdXBdIC0gSWZmIGRlZmluZWQsIGluZGV4IG9mIGEgc3BlY2lmaWMgY2FwdHVyZSBncm91cCB0byByZXR1cm4uXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyaW5nLCByZWdleCwgY2FwdHVyZUdyb3VwKSB7XG4gICAgdmFyIG1hdGNoZXMgPSBbXTtcblxuICAgIGZvciAodmFyIG1hdGNoLCBpID0gMDsgKG1hdGNoID0gc3RyaW5nLnN1YnN0cihpKS5tYXRjaChyZWdleCkpOyBpICs9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChtYXRjaFtjYXB0dXJlR3JvdXAgPT09IHVuZGVmaW5lZCA/IG1hdGNoLmxlbmd0aCAtIDEgOiBjYXB0dXJlR3JvdXBdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hlcztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBHcmV5bGlzdCA9IHJlcXVpcmUoJ2dyZXlsaXN0Jyk7XG5cbi8qKiBAc3VtbWFyeSBDYXRhbG9nIHRoZSBleGVjdXRpb24gY29udGV4dCBvYmplY3QuXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBBbiBvYmplY3QgY29udGFpbmluZyBhIG1lbWJlciBmb3IgZWFjaCBtZW1iZXIgb2YgdGhlIGV4ZWN1dGlvbiBjb250ZXh0IG9iamVjdFxuICogdmlzaWJsZSBpbiB0aGUgcHJvdG90eXBlIGNoYWluIChiYWNrIHRvIGJ1dCBub3QgaW5jbHVkaW5nIE9iamVjdCksIHBlciB3aGl0ZWxpc3QgYW5kIGJsYWNrbGlzdC5cbiAqIEVhY2ggbWVtYmVyJ3MgdmFsdWUgaXMgdGhlIG9iamVjdCBpbiB0aGUgcHJvdG90eXBlIGNoYWluIHdoZXJlIGZvdW5kLlxuICogQHBhcmFtIFtvcHRpb25zXVxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5vd25dIC0gUmVzdHJpY3Qgc2VhcmNoIGZvciBldmVudCB0eXBlIHN0cmluZ3MgdG8gb3duIG1ldGhvZHMgcmF0aGVyIHRoYW4gZW50aXJlIHByb3RvdHlwZSBjaGFpbi5cbiAqIEBwYXJhbSBbb3B0aW9ucy5ncmV5bGlzdF1cbiAqIEBwYXJhbSBbb3B0aW9ucy5ncmV5bGlzdC53aGl0ZV0gLSBJZiBnaXZlbiwgb25seSBsaXN0ZWQgbWVtYmVycyBhcmUgY2F0YWxvZ2VkLlxuICogQHBhcmFtIFtvcHRpb25zLmdyZXlsaXN0LmJsYWNrXSAtIElmIGdpdmVuLCBsaXN0ZWQgbWVtYmVycyBhcmUgKm5vdCogY2F0YWxvZ2VkLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG9iamVjdENhdGFsb2cob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgdmFyIG9iaixcbiAgICAgICAgY2F0YWxvZyA9IE9iamVjdC5jcmVhdGUobnVsbCksIC8vIEtJU1Mgbm8gcHJvdG90eXBlIG5lZWRlZFxuICAgICAgICB3YWxrUHJvdG90eXBlQ2hhaW4gPSAhb3B0aW9ucy5vd24sXG4gICAgICAgIGdyZXlsaXN0ID0gbmV3IEdyZXlsaXN0KG9wdGlvbnMuZ3JleWxpc3QpO1xuXG4gICAgZm9yIChvYmogPSB0aGlzOyBvYmogJiYgb2JqICE9PSBPYmplY3QucHJvdG90eXBlOyBvYmogPSB3YWxrUHJvdG90eXBlQ2hhaW4gJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikpIHtcbiAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICEoa2V5IGluIGNhdGFsb2cpICYmIC8vIG5vdCBzaGFkb3dlZCBieSBhIG1lbWJlciBvZiBhIGRlc2NlbmRhbnQgb2JqZWN0XG4gICAgICAgICAgICAgICAgZ3JleWxpc3QudGVzdChrZXkpICYmXG4gICAgICAgICAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSkudmFsdWUgIT09IG9iamVjdENhdGFsb2dcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGNhdGFsb2dba2V5XSA9IG9iajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhdGFsb2c7XG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIG1hdGNoID0gcmVxdWlyZSgnY29kZS1tYXRjaCcpO1xuXG4vKiogQHR5cGVkZWYge29iamVjdH0gc3RhcmxvZ2dlclxuICogQGRlc2MgQW4gZXZlbnQgbGlzdGVuZXIgZm9yIGxvZ2dpbmcgcHVycG9zZXMsIHBhaXJlZCB3aXRoIHRoZSB0YXJnZXQocykgdG8gbGlzdGVuIHRvLlxuICogRWFjaCBtZW1iZXIgb2YgYSBsb2dnZXIgb2JqZWN0IGhhcyB0aGUgZXZlbnQgc3RyaW5nIGFzIGl0cyBrZXkgYW5kIGFuIG9iamVjdCBhcyBpdHMgdmFsdWUuXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBsaXN0ZW5lciAtIEEgaGFuZGxlciB0aGF0IGxvZ3MgdGhlIGV2ZW50LlxuICogQHByb3BlcnR5IHtvYmplY3R8b2JqZWN0W119IHRhcmdldHMgLSBBIHRhcmdldCBvciBsaXN0IG9mIHRhcmdldHMgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cbiAqL1xuXG4vKiogQHR5cGVkZWYge29iamVjdHxvYmplY3RbXX0gZXZlbnRUYXJnZXRzXG4gKiBFdmVudCB0YXJnZXQgb2JqZWN0KHMpIHRoYXQgaW1wbGVtZW50IGBhZGRFdmVudExpc3RlbmVyYCBhbmQgYHJlbW92ZUV2ZW50TGlzdGVuZXJgLFxuICogdHlwaWNhbGx5IGEgRE9NIG5vZGUsIGJ1dCBieSBubyBtZWFucyBsaW1pdGVkIHRvIHN1Y2guXG4gKi9cblxuLyoqIEB0eXBlZGVmIHtzdHJpbmd9IGV2ZW50VHlwZSAqL1xuXG4vKiogQHR5cGVkZWYge29iamVjdH0gc3RhcmxvZ09wdGlvbnNcbiAqXG4gKiBAZGVzYyBNdXN0IGRlZmluZSBgbG9nZ2Vyc2AsIGBldmVudHNgLCBvciBgcGF0dGVybmAgYW5kIGBzZWxlY3RgOyBlbHNlIGVycm9yIGlzIHRocm93bi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdC48ZXZlbnRUeXBlLCBzdGFybG9nZ2VyPn0gW2xvZ2dlcnNdIC0gTG9nZ2VyIGRpY3Rpb25hcnkuXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBbZXZlbnRzXSAtIExpc3Qgb2YgZXZlbnQgc3RyaW5ncyBmcm9tIHdoaWNoIHRvIGJ1aWxkIGEgbG9nZ2VyIGRpY3Rpb25hcnkuXG4gKiBAcGFyYW0ge29iamVjdHxvYmplY3RbXX0gW3NlbGVjdF0gLSBPYmplY3Qgb3IgbGlzdCBvZiBvYmplY3RzIGluIHdoaWNoIHRvIHNlYXJjaCB3aXRoIGBwYXR0ZXJuYC5cbiAqIEBwYXJhbSB7UmVnRXhwfSBbcGF0dGVybl0gLSBFdmVudCBzdHJpbmcgcGF0dGVybiB0byBzZWFyY2ggZm9yIGluIGFsbCB2aXNpYmxlIGdldHRlcnMsIHNldHRlcnMsIGFuZCBtZXRob2RzLlxuICogVGhlIHJlc3VsdHMgb2YgdGhlIHNlYXJjaCBhcmUgdXNlZCB0byBidWlsZCBhIGxvZ2dlciBkaWN0aW9uYXJ5LlxuICogRXhhbXBsZTogYC8nKGZpbi1bYS16LV0rKScvYCBtZWFucyBmaW5kIGFsbCBzdHJpbmdzIGxpa2UgYCdmaW4tKidgLCByZXR1cm5pbmcgb25seSB0aGUgcGFydCBpbnNpZGUgdGhlIHF1b3Rlcy5cbiAqIFNlZSB0aGUgUkVBRE1FIGZvciBhZGRpdGlvbmFsIGV4YW1wbGVzLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtsb2ddIC0gT3ZlcnJpZGUge0BsaW5rIFN0YXJsb2cjbG9nfS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtsaXN0ZW5lcl0gLSBPdmVycmlkZSB7QGxpbmsgU3RhcmxvZyNsaXN0ZW5lcn0uXG4gKiBAcGFyYW0ge29iamVjdH0gW3RhcmdldHNdIC0gT3ZlcnJpZGUge0BsaW5rIFN0YXJsb2cjdGFyZ2V0c30uXG4gKlxuICogQHBhcmFtIHtPYmplY3QuPGV2ZW50VHlwZSwgZnVuY3Rpb24+fSBbbGlzdGVuZXJEaWN0aW9uYXJ5PXt9XSAtIEN1c3RvbSBsaXN0ZW5lcnMgdG8gb3ZlcnJpZGUgZGVmYXVsdCBsaXN0ZW5lci5cbiAqIEBwYXJhbSB7T2JqZWN0LjxldmVudFR5cGUsIGV2ZW50VGFyZ2V0cz59IFt0YXJnZXRzRGljdGlvbmFyeT17fV0gLSBDdXN0b20gZXZlbnQgdGFyZ2V0IG9iamVjdChzKSB0byBvdmVycmlkZSBkZWZhdWx0IHRhcmdldHMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IFttYXRjaF0gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L2NvZGUtbWF0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSBbbWF0Y2guY2FwdHVyZUdyb3VwXSAtIElmZiBkZWZpbmVkLCBpbmRleCBvZiBhIHNwZWNpZmljIGNhcHR1cmUgZ3JvdXAgdG8gcmV0dXJuIGZvciBlYWNoIG1hdGNoLlxuICogQHBhcmFtIHtvYmplY3R9IFttYXRjaC5ncmV5bGlzdF0gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L2dyZXlsaXN0XG4gKiBAcGFyYW0gW21hdGNoLmdyZXlsaXN0LndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBtYXRjaGVzIGFyZSBpbmNsdWRlZCBpbiB0aGUgcmVzdWx0cy5cbiAqIEBwYXJhbSBbbWF0Y2guZ3JleWxpc3QuYmxhY2tdIC0gSWYgZ2l2ZW4sIGxpc3RlZCBtYXRjaGVzIGFyZSBleGNsdWRlZCBmcm9tIHRoZSByZXN1bHRzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBbbWF0Y2guY2F0YWxvZ10gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L29iamVjdC1jYXRhbG9nXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFttYXRjaC5jYXRhbG9nLm93bl0gLSBPbmx5IHNlYXJjaCBvd24gbWV0aG9kcyBmb3IgZXZlbnQgc3RyaW5nczsgb3RoZXJ3aXNlIGVudGlyZSBwcm90b3R5cGUgY2hhaW4uXG4gKiBAcGFyYW0ge29iamVjdH0gW21hdGNoLmNhdGFsb2cuZ3JleWxpc3RdIC0gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC9ncmV5bGlzdFxuICogQHBhcmFtIFttYXRjaC5jYXRhbG9nLmdyZXlsaXN0LndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBtZW1iZXJzIGFyZSBjYXRhbG9nZWQuXG4gKiBAcGFyYW0gW21hdGNoLmNhdGFsb2cuZ3JleWxpc3QuYmxhY2tdIC0gSWYgZ2l2ZW4sIGxpc3RlZCBtZW1iZXJzIGFyZSAqbm90KiBjYXRhbG9nZWQuXG4gKi9cblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBzdW1tYXJ5IEluc3RhbmNlIGEgbG9nZ2VyLlxuICogQGRlc2MgQ29uc3VtZXMgYG9wdGlvbnNgLCBjcmVhdGluZyBhIGRpY3Rpb25hcnkgb2YgZXZlbnQgc3RyaW5ncyBpbiBgdGhpcy5ldmVudHNgLlxuICpcbiAqIFNvdXJjZXMgZm9yIGxvZ2dlcnM6XG4gKiAqIElmIGBvcHRpb25zLmxvZ2dlcnNgIGRpY3Rpb25hcnkgb2JqZWN0IGlzIGRlZmluZWQsIGRlZXAgY2xvbmUgaXQgYW5kIG1ha2Ugc3VyZSBhbGwgbWVtYmVycyBhcmUgbG9nZ2VyIG9iamVjdHMsIGRlZmF1bHRpbmcgYW55IG1pc3NpbmcgbWVtYmVycy5cbiAqICogRWxzZSBpZiBgb3B0aW9ucy5ldmVudHNgIChsaXN0IG9mIGV2ZW50IHN0cmluZ3MpIGlzIGRlZmluZWQsIGNyZWF0ZSBhbiBvYmplY3Qgd2l0aCB0aG9zZSBrZXlzLCBsaXN0ZW5lcnMsIGFuZCB0YXJnZXRzLlxuICogKiBFbHNlIGlmIGBvcHRpb25zLnBhdHRlcm5gIGlzIGRlZmluZWQsIGNvZGUgZm91bmQgaW4gdGhlIGV4ZWN1dGlvbiBjb250ZXh0IG9iamVjdCBpcyBzZWFyY2hlZCBmb3IgZXZlbnQgc3RyaW5ncyB0aGF0IG1hdGNoIGl0IChwZXIgYG9wdGlvbnMubWF0Y2hgKS5cbiAqXG4gKiBFdmVudHMgc3BlY2lmaWVkIHdpdGggYG9wdGlvbnMuZXZlbnRzYCBhbmQgYG9wdGlvbnMucGF0dGVybmAgbG9nIHVzaW5nIHRoZSBkZWZhdWx0IGxpc3RlbmVyIGFuZCBldmVudCB0YXJnZXRzOlxuICogKiBgU3RhckxvZy5wcm90b3R5cGUubGlzdGVuZXJgLCB1bmxlc3Mgb3ZlcnJpZGRlbiwganVzdCBjYWxscyBgdGhpcy5sb2coKWAgd2l0aCB0aGUgZXZlbnQgc3RyaW5nLCB3aGljaCBpcyBzdWZmaWNpZW50IGZvciBjYXN1YWwgdXNhZ2UuXG4gKiBPdmVycmlkZSBpdCBieSBkZWZpbmluZyBgb3B0aW9ucy5saXN0ZW5lcmAgb3IgZGlyZWN0bHkgYnkgcmVhc3NpZ25pbmcgdG8gYFN0YXJMb2cucHJvdG90eXBlLmxpc3RlbmVyYCBiZWZvcmUgaW5zdGFudGlhdGlvbi5cbiAqICogYFN0YXJMb2cucHJvdG90eXBlLnRhcmdldHNgLCB1bmxlc3Mgb3ZlcnJpZGRlbiwgaXMgYHdpbmRvdy5kb2N1bWVudGAgKHdoZW4gYXZhaWxhYmxlKSxcbiAqIHdoaWNoIGlzIG9ubHkgcmVhbGx5IHVzZWZ1bCBpZiB0aGUgZXZlbnQgaXMgZGlzcGF0Y2hlZCBkaXJlY3RseSB0byAob3IgaXMgYWxsb3dlZCB0byBidWJibGUgdXAgdG8pIGBkb2N1bWVudGAuXG4gKiBPdmVycmlkZSBpdCBieSBkZWZpbmluZyBgb3B0aW9ucy50YXJnZXRzYCBvciBkaXJlY3RseSBieSByZWFzc2lnbmluZyB0byBgU3RhckxvZy5wcm90b3R5cGUudGFyZ2V0c2AgYmVmb3JlIGluc3RhbnRpYXRpb24uXG4gKlxuICogRXZlbnRzIHNwZWNpZmllZCB3aXRoIGBvcHRpb25zLmxvZ2dlcnNgIGNhbiBlYWNoIHNwZWNpZnkgdGhlaXIgb3duIGxpc3RlbmVyIGFuZC9vciB0YXJnZXRzLCBidXQgaWYgbm90IHNwZWNpZmllZCwgdGhleSB0b28gd2lsbCBhbHNvIHVzZSB0aGUgYWJvdmUgZGVmYXVsdHMuXG4gKlxuICogQHBhcmFtIHtzdGFybG9nT3B0aW9uc30gW29wdGlvbnNdXG4gKi9cbmZ1bmN0aW9uIFN0YXJMb2cob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgLy8gT3ZlcnJpZGUgcHJvdG90eXBlIGRlZmluaXRpb25zIGlmIGFuZCBvbmx5IGlmIHN1cHBsaWVkIGluIG9wdGlvbnNcbiAgICBbJ2xvZycsICd0YXJnZXRzJywgJ2xpc3RlbmVyJ10uZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgaWYgKG9wdGlvbnNba2V5XSkgeyB0aGlzW2tleV0gPSBvcHRpb25zW2tleV07IH1cbiAgICB9LCB0aGlzKTtcblxuICAgIHZhciBkZWZhdWx0VGFyZ2V0ID0gb3B0aW9ucy50YXJnZXRzIHx8IHRoaXMudGFyZ2V0cyxcbiAgICAgICAgZGVmYXVsdExpc3RlbmVyID0gb3B0aW9ucy5saXN0ZW5lciB8fCB0aGlzLmxpc3RlbmVyLFxuICAgICAgICBsaXN0ZW5lckRpY3Rpb25hcnkgPSBvcHRpb25zLmxpc3RlbmVyRGljdGlvbmFyeSB8fCB7fSxcbiAgICAgICAgdGFyZ2V0c0RpY3Rpb25hcnkgPSBvcHRpb25zLnRhcmdldHNEaWN0aW9uYXJ5IHx8IHt9LFxuICAgICAgICBsb2dnZXJzID0gb3B0aW9ucy5sb2dnZXJzLFxuICAgICAgICBldmVudFN0cmluZ3M7XG5cbiAgICBpZiAobG9nZ2Vycykge1xuICAgICAgICBldmVudFN0cmluZ3MgPSBPYmplY3Qua2V5cyhsb2dnZXJzKTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZXZlbnRzKSB7XG4gICAgICAgIGxvZ2dlcnMgPSB7fTtcbiAgICAgICAgZXZlbnRTdHJpbmdzID0gb3B0aW9ucy5ldmVudHM7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLnBhdHRlcm4gJiYgb3B0aW9ucy5zZWxlY3QpIHtcbiAgICAgICAgbG9nZ2VycyA9IHt9O1xuICAgICAgICBldmVudFN0cmluZ3MgPSBhcnJheWlmeShvcHRpb25zLnNlbGVjdCkucmVkdWNlKGZ1bmN0aW9uKG1hdGNoZXMsIG9iamVjdCkge1xuICAgICAgICAgICAgbWF0Y2guY2FsbChvYmplY3QsIG9wdGlvbnMucGF0dGVybiwgb3B0aW9ucy5tYXRjaCkuZm9yRWFjaChmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcy5pbmRleE9mKG1hdGNoKSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKG1hdGNoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVzO1xuICAgICAgICB9LCBbXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBgb3B0aW9ucy5sb2dnZXJzYCwgYG9wdGlvbnMuZXZlbnRzYCwgb3IgYG9wdGlvbnMucGF0dGVybmAgYW5kIGBvcHRpb25zLnNlbGVjdGAgdG8gYmUgZGVmaW5lZC4nKTtcbiAgICB9XG5cbiAgICB2YXIgc3RhcmxvZyA9IHRoaXM7XG5cbiAgICAvKipcbiAgICAgKiBEaWN0aW9uYXJ5IG9mIGV2ZW50IHN0cmluZ3Mgd2l0aCBsaXN0ZW5lciBhbmQgdGFyZ2V0KHMpLlxuICAgICAqIEB0eXBlIHtPYmplY3QuPGV2ZW50VHlwZSwgc3RhcmxvZ2dlcj59XG4gICAgICovXG4gICAgdGhpcy5ldmVudHMgPSBldmVudFN0cmluZ3MucmVkdWNlKGZ1bmN0aW9uKGNsb25lLCBldmVudFN0cmluZykge1xuICAgICAgICB2YXIgbG9nZ2VyID0gT2JqZWN0LmFzc2lnbih7fSwgbG9nZ2Vyc1tldmVudFN0cmluZ10pOyAvLyBjbG9uZSBlYWNoIGxvZ2dlclxuXG4gICAgICAgIC8vIGJpbmQgdGhlIGxpc3RlbmVyIHRvIHN0YXJsb2cgZm9yIGB0aGlzLmxvZ2AgYWNjZXNzIHRvIFN0YXJsb2cjbG9nIGZyb20gd2l0aGluIGxpc3RlbmVyXG4gICAgICAgIGxvZ2dlci5saXN0ZW5lciA9IChsb2dnZXIubGlzdGVuZXIgfHwgbGlzdGVuZXJEaWN0aW9uYXJ5W2V2ZW50U3RyaW5nXSB8fCBkZWZhdWx0TGlzdGVuZXIpLmJpbmQoc3RhcmxvZyk7XG4gICAgICAgIGxvZ2dlci50YXJnZXRzID0gYXJyYXlpZnkobG9nZ2VyLnRhcmdldHMgfHwgdGFyZ2V0c0RpY3Rpb25hcnlbZXZlbnRTdHJpbmddIHx8IGRlZmF1bHRUYXJnZXQpO1xuXG4gICAgICAgIGNsb25lW2V2ZW50U3RyaW5nXSA9IGxvZ2dlcjtcblxuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfSwge30pO1xufVxuXG5TdGFyTG9nLnByb3RvdHlwZSA9IHtcbiAgICBjb25zdHJ1Y3RvcjogU3RhckxvZy5wcm90b3R5cGUuY29uc3RydWN0b3IsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICogQGRlZmF1bHQgY29uc29sZS5sb2cuYmluZChjb25zb2xlKVxuICAgICAqL1xuICAgIGxvZzogY29uc29sZS5sb2cuYmluZChjb25zb2xlKSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBmdW5jdGlvbihlKSB7IHRoaXMubG9nKGUudHlwZSk7IH07XG4gICAgICovXG4gICAgbGlzdGVuZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhpcy5sb2coZS50eXBlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge29iamVjdH1cbiAgICAgKiBAZGVmYXVsdCB3aW5kb3cuZG9jdW1lbnRcbiAgICAgKi9cbiAgICB0YXJnZXRzOiB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyAmJiB3aW5kb3cuZG9jdW1lbnQsXG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIFN0YXJsb2cjc3RhcnRcbiAgICAgKiBAc3VtbWFyeSBTdGFydCBsb2dnaW5nIGV2ZW50cy5cbiAgICAgKiBAZGVzYyBBZGQgbmV3IGV2ZW50IGxpc3RlbmVycyBmb3IgbG9nZ2luZyBwdXJwb3Nlcy5cbiAgICAgKiBPbGQgZXZlbnQgbGlzdGVuZXJzLCBpZiBhbnksIGFyZSByZW1vdmVkIGZpcnN0LCBiZWZvcmUgYWRkaW5nIG5ldyBvbmVzLlxuICAgICAqL1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICBldmVudExpc3RlbmVyKHRoaXMuZXZlbnRzLCAnYWRkJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgU3RhcmxvZyNzdG9wXG4gICAgICogQHN1bW1hcnkgU3RvcCBsb2dnaW5nIGV2ZW50cy5cbiAgICAgKiBAZGVzYyBFdmVudCBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQgZnJvbSB0YXJnZXRzIGFuZCBkZWxldGVkLlxuICAgICAqL1xuICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXZlbnRMaXN0ZW5lcih0aGlzLmV2ZW50cywgJ3JlbW92ZScpO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGV2ZW50TGlzdGVuZXIoZGljdGlvbmFyeSwgbWV0aG9kUHJlZml4KSB7XG4gICAgaWYgKCFkaWN0aW9uYXJ5KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbWV0aG9kID0gbWV0aG9kUHJlZml4ICsgJ0V2ZW50TGlzdGVuZXInO1xuXG4gICAgT2JqZWN0LmtleXMoZGljdGlvbmFyeSkuZm9yRWFjaChmdW5jdGlvbihldmVudFR5cGUpIHtcbiAgICAgICAgdmFyIGV2ZW50TG9nZ2VyID0gZGljdGlvbmFyeVtldmVudFR5cGVdO1xuICAgICAgICBldmVudExvZ2dlci50YXJnZXRzLmZvckVhY2goZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgICAgICAgICB0YXJnZXRbbWV0aG9kXShldmVudFR5cGUsIGV2ZW50TG9nZ2VyLmxpc3RlbmVyKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGFycmF5aWZ5KHgpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh4KSA/IHggOiBbeF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhckxvZzsiXX0=
