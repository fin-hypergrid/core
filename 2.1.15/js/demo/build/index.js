(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* eslint-env browser */

'use strict';

module.exports = function(demo, grid) {

    var idx = grid.behavior.columnEnum;

    var Textfield = grid.cellEditors.get('textfield');

    var ColorText = Textfield.extend('colorText', {
        template: '<input type="text" lang="{{locale}}" style="color:{{textColor}}">'
    });

    grid.cellEditors.add(ColorText);

    var Time = Textfield.extend('Time', {
        template: [
            '<div class="hypergrid-textfield" style="text-align:right;">',
            '    <input type="text" lang="{{locale}}" style="background-color:transparent; width:60%; text-align:right; border:0; padding:0; outline:0; font:inherit;' +
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
                this.input.focus(); // return focus to text field
            }.bind(this);

            // Flip AM/PM on 'am' or 'pm' keypresses
            this.input.onkeypress = function(e) {
                switch (e.key) {
                    case 'a': case 'A': this.meridian.textContent = 'AM'; e.preventDefault(); break;
                    case 'p': case 'P': this.meridian.textContent = 'PM'; e.preventDefault(); break;
                    case 'm': case 'M':
                        if (/[ap]/i.test(this.previousKeypress)) { e.preventDefault(); break; }
                        // fall through to FSM when M NOT preceded by A or P
                    default:
                        // only allow digits and colon (besides A, P, M as above) and specials (ENTER, TAB, ESC)
                        if ('0123456789:'.indexOf(e.key) >= 0 || this.specialKeyups[e.keyCode]) {
                            break;
                        }
                        // FSM jam!
                        this.errorEffectBegin(); // feedback for unexpected key press
                        e.preventDefault();
                }
                this.previousKeypress = e.key;
            }.bind(this);
        },

        setEditorValue: function(value) {
            this.super.setEditorValue.call(this, value);
            var parts = this.input.value.split(' ');
            this.input.value = parts[0];
            this.meridian.textContent = parts[1];
        },

        getEditorValue: function(value) {
            delete this.previousKeypress;
            return this.super.getEditorValue.call(this, value + ' ' + this.meridian.textContent);
        },

        validateEditorValue: function(value) {
            return this.super.validateEditorValue.call(this, value + ' ' + this.meridian.textContent);
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
                    name: 'cellSelection',
                    label: 'cells',
                    weight: 'bold',
                    tooltip: 'Basic cell selectability.',
                    setter: setSelectionProp
                },
                {
                    name: '!multipleSelections',
                    label: 'one cell region at a time',
                    setter: setSelectionProp,
                    checked: true
                },
                {
                    name: 'collapseCellSelections',
                    label: 'collapse cell selections',
                    setter: setSelectionProp,
                    tooltip: 'Cell selections are projected onto subsequently selected rows.\n\n' +
                    'Requires singleRowSelectionMode && !multipleSelections.'
                },
                {
                    name: 'rowSelection',
                    label: 'rows',
                    weight: 'bold',
                    tooltip: 'Basic row selectability.',
                    setter: setSelectionProp
                },
                {
                    name: 'autoSelectRows', label: 'auto-select rows', setter: setSelectionProp,
                    tooltip: 'Notes:\n' +
                    '1. Requires that checkboxOnlyRowSelections be set to false (so checking this box automatically unchecks that one).\n' +
                    '2. Set singleRowSelectionMode to false to allow auto-select of multiple rows.'
                },
                {
                    name: 'checkboxOnlyRowSelections', label: 'by row handles only', setter: setSelectionProp,
                    tooltip: 'Note that when this property is active, autoSelectRows will not work.'
                },
                {
                    name: 'singleRowSelectionMode',
                    label: 'one row at a time',
                    setter: setSelectionProp
                },
                {
                    name: 'columnSelection',
                    label: 'columns',
                    weight: 'bold',
                    tooltip: 'Basic column selectability.',
                    setter: setSelectionProp
                },
                {
                    name: 'autoSelectColumns',
                    label: 'auto-select columns',
                    setter: setSelectionProp
                }
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
            label.style.fontWeight = ctrl.weight;
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
        var cellEvent = e.detail.primitiveEvent;
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

    var NOON = 12 * 60;
    grid.localization.add({
        name: 'clock12', // alternative to having to hame localizer in `grid.localization.add`

        // returns formatted string from number of minutes
        format: function(mins) {
            var hh = Math.floor(mins / 60) % 12 || 12; // modulo 12 hrs with 0 becoming 12
            var mm = (mins % 60 + 100 + '').substr(1, 2);
            var AmPm = mins < NOON ? 'AM' : 'PM';
            return hh + ':' + mm + ' ' + AmPm;
        },

        invalid: function(hhmmAmPm) {
            return !/^(0?[1-9]|1[0-2]):[0-5]\d\s+(AM|PM)$/i.test(hhmmAmPm); // 12:59 max
        },

        // returns number of minutes from formatted string
        parse: function(hhmmAmPm) {
            var parts = hhmmAmPm.match(/^(\d+):(\d{2})\s+(AM|PM)$/i);
            var hours = parts[1] === '12' ? 0 : Number(parts[1]);
            var minutes = Number(parts[2]);
            var value = hours * 60 + minutes;
            var pm = parts[3].toUpperCase() === 'PM';
            if (pm) { value += NOON; }
            return value;
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
            // canvasContextAttributes: { alpha: false },
            state: { color: 'orange' }
        },
        grid = new Hypergrid('div#json-example', gridOptions),
        behavior = grid.behavior,
        dataModel = behavior.dataModel,
        idx = behavior.columnEnum;

    window.g = window.grid = grid;
    window.p = grid.properties;
    window.b = behavior;
    window.m = dataModel;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZW1vL2pzL2RlbW8vY2VsbGVkaXRvcnMuanMiLCJkZW1vL2pzL2RlbW8vY2VsbHJlbmRlcmVycy5qcyIsImRlbW8vanMvZGVtby9kYXNoYm9hcmQuanMiLCJkZW1vL2pzL2RlbW8vZXZlbnRzLmpzIiwiZGVtby9qcy9kZW1vL2Zvcm1hdHRlcnMuanMiLCJkZW1vL2pzL2RlbW8vaW5kZXguanMiLCJkZW1vL2pzL2RlbW8vc2V0U3RhdGUuanMiLCJub2RlX21vZHVsZXMvY29kZS1tYXRjaC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9maW4taHlwZXJncmlkLWV2ZW50LWxvZ2dlci9jdXN0b20tbGlzdGVuZXJzLmpzIiwibm9kZV9tb2R1bGVzL2Zpbi1oeXBlcmdyaWQtZXZlbnQtbG9nZ2VyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dyZXlsaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21hdGNoLXBvaW50L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1jYXRhbG9nL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N0YXJsb2cvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVtbywgZ3JpZCkge1xuXG4gICAgdmFyIGlkeCA9IGdyaWQuYmVoYXZpb3IuY29sdW1uRW51bTtcblxuICAgIHZhciBUZXh0ZmllbGQgPSBncmlkLmNlbGxFZGl0b3JzLmdldCgndGV4dGZpZWxkJyk7XG5cbiAgICB2YXIgQ29sb3JUZXh0ID0gVGV4dGZpZWxkLmV4dGVuZCgnY29sb3JUZXh0Jywge1xuICAgICAgICB0ZW1wbGF0ZTogJzxpbnB1dCB0eXBlPVwidGV4dFwiIGxhbmc9XCJ7e2xvY2FsZX19XCIgc3R5bGU9XCJjb2xvcjp7e3RleHRDb2xvcn19XCI+J1xuICAgIH0pO1xuXG4gICAgZ3JpZC5jZWxsRWRpdG9ycy5hZGQoQ29sb3JUZXh0KTtcblxuICAgIHZhciBUaW1lID0gVGV4dGZpZWxkLmV4dGVuZCgnVGltZScsIHtcbiAgICAgICAgdGVtcGxhdGU6IFtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiaHlwZXJncmlkLXRleHRmaWVsZFwiIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodDtcIj4nLFxuICAgICAgICAgICAgJyAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBsYW5nPVwie3tsb2NhbGV9fVwiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDsgd2lkdGg6NjAlOyB0ZXh0LWFsaWduOnJpZ2h0OyBib3JkZXI6MDsgcGFkZGluZzowOyBvdXRsaW5lOjA7IGZvbnQ6aW5oZXJpdDsnICtcbiAgICAgICAgICAgICd7e3N0eWxlfX1cIj4nLFxuICAgICAgICAgICAgJyAgICA8c3Bhbj5BTTwvc3Bhbj4nLFxuICAgICAgICAgICAgJzwvZGl2PidcbiAgICAgICAgXS5qb2luKCdcXG4nKSxcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG4gICAgICAgICAgICB0aGlzLm1lcmlkaWFuID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XG5cbiAgICAgICAgICAgIC8vIEZsaXAgQU0vUE0gb24gYW55IGNsaWNrXG4gICAgICAgICAgICB0aGlzLmVsLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1lcmlkaWFuLnRleHRDb250ZW50ID0gdGhpcy5tZXJpZGlhbi50ZXh0Q29udGVudCA9PT0gJ0FNJyA/ICdQTScgOiAnQU0nO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXQuZm9jdXMoKTsgLy8gcmV0dXJuIGZvY3VzIHRvIHRleHQgZmllbGRcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgLy8gRmxpcCBBTS9QTSBvbiAnYW0nIG9yICdwbScga2V5cHJlc3Nlc1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5vbmtleXByZXNzID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZS5rZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYSc6IGNhc2UgJ0EnOiB0aGlzLm1lcmlkaWFuLnRleHRDb250ZW50ID0gJ0FNJzsgZS5wcmV2ZW50RGVmYXVsdCgpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncCc6IGNhc2UgJ1AnOiB0aGlzLm1lcmlkaWFuLnRleHRDb250ZW50ID0gJ1BNJzsgZS5wcmV2ZW50RGVmYXVsdCgpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbSc6IGNhc2UgJ00nOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9bYXBdL2kudGVzdCh0aGlzLnByZXZpb3VzS2V5cHJlc3MpKSB7IGUucHJldmVudERlZmF1bHQoKTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZhbGwgdGhyb3VnaCB0byBGU00gd2hlbiBNIE5PVCBwcmVjZWRlZCBieSBBIG9yIFBcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgYWxsb3cgZGlnaXRzIGFuZCBjb2xvbiAoYmVzaWRlcyBBLCBQLCBNIGFzIGFib3ZlKSBhbmQgc3BlY2lhbHMgKEVOVEVSLCBUQUIsIEVTQylcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnMDEyMzQ1Njc4OTonLmluZGV4T2YoZS5rZXkpID49IDAgfHwgdGhpcy5zcGVjaWFsS2V5dXBzW2Uua2V5Q29kZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZTTSBqYW0hXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yRWZmZWN0QmVnaW4oKTsgLy8gZmVlZGJhY2sgZm9yIHVuZXhwZWN0ZWQga2V5IHByZXNzXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucHJldmlvdXNLZXlwcmVzcyA9IGUua2V5O1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldEVkaXRvclZhbHVlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5zdXBlci5zZXRFZGl0b3JWYWx1ZS5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHRoaXMuaW5wdXQudmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQudmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgICAgICAgIHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQgPSBwYXJ0c1sxXTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRFZGl0b3JWYWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnByZXZpb3VzS2V5cHJlc3M7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdXBlci5nZXRFZGl0b3JWYWx1ZS5jYWxsKHRoaXMsIHZhbHVlICsgJyAnICsgdGhpcy5tZXJpZGlhbi50ZXh0Q29udGVudCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsaWRhdGVFZGl0b3JWYWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1cGVyLnZhbGlkYXRlRWRpdG9yVmFsdWUuY2FsbCh0aGlzLCB2YWx1ZSArICcgJyArIHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBncmlkLmNlbGxFZGl0b3JzLmFkZChUaW1lKTtcblxuICAgIC8vIFVzZWQgYnkgdGhlIGNlbGxQcm92aWRlci5cbiAgICAvLyBgbnVsbGAgbWVhbnMgY29sdW1uJ3MgZGF0YSBjZWxscyBhcmUgbm90IGVkaXRhYmxlLlxuICAgIHZhciBlZGl0b3JUeXBlcyA9IFtcbiAgICAgICAgbnVsbCxcbiAgICAgICAgJ3RleHRmaWVsZCcsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgJ3RpbWUnLFxuICAgICAgICAnY2hvaWNlJyxcbiAgICAgICAgJ2Nob2ljZScsXG4gICAgICAgICdjaG9pY2UnLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgJ3RleHRmaWVsZCcsXG4gICAgICAgICd0ZXh0ZmllbGQnXG4gICAgXTtcblxuICAgIC8vIE92ZXJyaWRlIHRvIGFzc2lnbiB0aGUgdGhlIGNlbGwgZWRpdG9ycy5cbiAgICBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbC5nZXRDZWxsRWRpdG9yQXQgPSBmdW5jdGlvbih4LCB5LCBkZWNsYXJlZEVkaXRvck5hbWUsIGNlbGxFdmVudCkge1xuICAgICAgICB2YXIgZWRpdG9yTmFtZSA9IGRlY2xhcmVkRWRpdG9yTmFtZSB8fCBlZGl0b3JUeXBlc1t4ICUgZWRpdG9yVHlwZXMubGVuZ3RoXTtcblxuICAgICAgICBzd2l0Y2ggKHgpIHtcbiAgICAgICAgICAgIGNhc2UgaWR4LmJpcnRoU3RhdGU6XG4gICAgICAgICAgICAgICAgY2VsbEV2ZW50LnRleHRDb2xvciA9ICdyZWQnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNlbGxFZGl0b3IgPSBncmlkLmNlbGxFZGl0b3JzLmNyZWF0ZShlZGl0b3JOYW1lLCBjZWxsRXZlbnQpO1xuXG4gICAgICAgIGlmIChjZWxsRWRpdG9yKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIGlkeC5lbXBsb3llZDpcbiAgICAgICAgICAgICAgICAgICAgY2VsbEVkaXRvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBpZHgudG90YWxOdW1iZXJPZlBldHNPd25lZDpcbiAgICAgICAgICAgICAgICAgICAgY2VsbEVkaXRvci5pbnB1dC5zZXRBdHRyaWJ1dGUoJ21pbicsIDApO1xuICAgICAgICAgICAgICAgICAgICBjZWxsRWRpdG9yLmlucHV0LnNldEF0dHJpYnV0ZSgnbWF4JywgMTApO1xuICAgICAgICAgICAgICAgICAgICBjZWxsRWRpdG9yLmlucHV0LnNldEF0dHJpYnV0ZSgnc3RlcCcsIDAuMDEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjZWxsRWRpdG9yO1xuICAgIH07XG59O1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkZW1vLCBncmlkKSB7XG5cbiAgICB2YXIgaWR4ID0gZ3JpZC5iZWhhdmlvci5jb2x1bW5FbnVtO1xuXG4gICAgLy9HRVQgQ0VMTFxuICAgIC8vYWxsIGZvcm1hdHRpbmcgYW5kIHJlbmRlcmluZyBwZXIgY2VsbCBjYW4gYmUgb3ZlcnJpZGRlbiBpbiBoZXJlXG4gICAgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuZ2V0Q2VsbCA9IGZ1bmN0aW9uKGNvbmZpZywgcmVuZGVyZXJOYW1lKSB7XG4gICAgICAgIGlmIChjb25maWcuaXNVc2VyRGF0YUFyZWEpIHtcbiAgICAgICAgICAgIHZhciBuLCBoZXgsIHRyYXZlbCxcbiAgICAgICAgICAgICAgICBjb2xJbmRleCA9IGNvbmZpZy5kYXRhQ2VsbC54LFxuICAgICAgICAgICAgICAgIHJvd0luZGV4ID0gY29uZmlnLmRhdGFDZWxsLnk7XG5cbiAgICAgICAgICAgIGlmIChkZW1vLnN0eWxlUm93c0Zyb21EYXRhKSB7XG4gICAgICAgICAgICAgICAgbiA9IGdyaWQuYmVoYXZpb3IuZ2V0Q29sdW1uKGlkeC50b3RhbE51bWJlck9mUGV0c093bmVkKS5nZXRWYWx1ZShyb3dJbmRleCk7XG4gICAgICAgICAgICAgICAgaGV4ID0gKDE1NSArIDEwICogKG4gJSAxMSkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICBjb25maWcuYmFja2dyb3VuZENvbG9yID0gJyMnICsgaGV4ICsgaGV4ICsgaGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzd2l0Y2ggKGNvbEluZGV4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBpZHgubGFzdE5hbWU6XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5jb2xvciA9IGNvbmZpZy52YWx1ZSAhPSBudWxsICYmIChjb25maWcudmFsdWUgKyAnJylbMF0gPT09ICdTJyA/ICdyZWQnIDogJyMxOTE5MTknO1xuICAgICAgICAgICAgICAgICAgICBjb25maWcubGluayA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBpZHguaW5jb21lOlxuICAgICAgICAgICAgICAgICAgICB0cmF2ZWwgPSA2MDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIGlkeC50cmF2ZWw6XG4gICAgICAgICAgICAgICAgICAgIHRyYXZlbCA9IDEwNTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0cmF2ZWwpIHtcbiAgICAgICAgICAgICAgICB0cmF2ZWwgKz0gTWF0aC5yb3VuZChjb25maWcudmFsdWUgKiAxNTAgLyAxMDAwMDApO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IgPSAnIzAwJyArIHRyYXZlbC50b1N0cmluZygxNikgKyAnMDAnO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5jb2xvciA9ICcjRkZGRkZGJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9UZXN0aW5nXG4gICAgICAgICAgICBpZiAoY29sSW5kZXggPT09IGlkeC50b3RhbE51bWJlck9mUGV0c093bmVkKSB7XG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBCZSBzdXJlIHRvIGFkanVzdCB0aGUgZGF0YSBzZXQgdG8gdGhlIGFwcHJvcHJpYXRlIHR5cGUgYW5kIHNoYXBlIGluIHdpZGVkYXRhLmpzXG4gICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICAvL3JldHVybiBzaW1wbGVDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gZW1wdHlDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gYnV0dG9uQ2VsbDsgLy9XT1JLU1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuIGVycm9yQ2VsbDsgLy9XT1JLUzogTm90ZWQgdGhhdCBhbnkgZXJyb3IgaW4gdGhpcyBmdW5jdGlvbiBzdGVhbHMgdGhlIG1haW4gdGhyZWFkIGJ5IHJlY3Vyc2lvblxuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHNwYXJrTGluZUNlbGw7IC8vIFdPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gc3BhcmtCYXJDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gc2xpZGVyQ2VsbDsgLy9XT1JLU1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHRyZWVDZWxsOyAvL05lZWQgdG8gZmlndXJlIG91dCBkYXRhIHNoYXBlIHRvIHRlc3RcblxuXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBUZXN0IG9mIEN1c3RvbWl6ZWQgUmVuZGVyZXJcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAvLyBpZiAoc3RhcnJ5KXtcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmRvbWFpbiA9IDU7IC8vIGRlZmF1bHQgaXMgMTAwXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5zaXplRmFjdG9yID0gIDAuNjU7IC8vIGRlZmF1bHQgaXMgMC42NTsgc2l6ZSBvZiBzdGFycyBhcyBmcmFjdGlvbiBvZiBoZWlnaHQgb2YgY2VsbFxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuZGFya2VuRmFjdG9yID0gMC43NTsgLy8gZGVmYXVsdCBpcyAwLjc1OyBzdGFyIHN0cm9rZSBjb2xvciBhcyBmcmFjdGlvbiBvZiBzdGFyIGZpbGwgY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmNvbG9yID0gJ2dvbGQnOyAvLyBkZWZhdWx0IGlzICdnb2xkJzsgc3RhciBmaWxsIGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5mZ0NvbG9yID0gICdncmV5JzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyB0ZXh0IGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5mZ1NlbENvbG9yID0gJ3llbGxvdyc7IC8vIGRlZmF1bHQgaXMgJ3RyYW5zcGFyZW50JyAobm90IHJlbmRlcmVkKTsgdGV4dCBzZWxlY3Rpb24gY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmJnQ29sb3IgPSAnIzQwNDA0MCc7IC8vIGRlZmF1bHQgaXMgJ3RyYW5zcGFyZW50JyAobm90IHJlbmRlcmVkKTsgYmFja2dyb3VuZCBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuYmdTZWxDb2xvciA9ICdncmV5JzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyBiYWNrZ3JvdW5kIHNlbGVjdGlvbiBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuc2hhZG93Q29sb3IgPSAndHJhbnNwYXJlbnQnOyAvLyBkZWZhdWx0IGlzICd0cmFuc3BhcmVudCdcbiAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIHN0YXJyeTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ3JpZC5jZWxsUmVuZGVyZXJzLmdldChyZW5kZXJlck5hbWUpO1xuICAgIH07XG5cbiAgICAvL0VORCBPRiBHRVQgQ0VMTFxuXG5cbiAgICAvLyBDVVNUT00gQ0VMTCBSRU5ERVJFUlxuXG4gICAgdmFyIFJFR0VYUF9DU1NfSEVYNiA9IC9eIyguLikoLi4pKC4uKSQvLFxuICAgICAgICBSRUdFWFBfQ1NTX1JHQiA9IC9ecmdiYVxcKChcXGQrKSwoXFxkKyksKFxcZCspLFxcZCtcXCkkLztcblxuICAgIGZ1bmN0aW9uIHBhaW50U3BhcmtSYXRpbmcoZ2MsIGNvbmZpZykge1xuICAgICAgICB2YXIgeCA9IGNvbmZpZy5ib3VuZHMueCxcbiAgICAgICAgICAgIHkgPSBjb25maWcuYm91bmRzLnksXG4gICAgICAgICAgICB3aWR0aCA9IGNvbmZpZy5ib3VuZHMud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQgPSBjb25maWcuYm91bmRzLmhlaWdodCxcbiAgICAgICAgICAgIG9wdGlvbnMgPSBjb25maWcudmFsdWUsXG4gICAgICAgICAgICBkb21haW4gPSBvcHRpb25zLmRvbWFpbiB8fCBjb25maWcuZG9tYWluIHx8IDEwMCxcbiAgICAgICAgICAgIHNpemVGYWN0b3IgPSBvcHRpb25zLnNpemVGYWN0b3IgfHwgY29uZmlnLnNpemVGYWN0b3IgfHwgMC42NSxcbiAgICAgICAgICAgIGRhcmtlbkZhY3RvciA9IG9wdGlvbnMuZGFya2VuRmFjdG9yIHx8IGNvbmZpZy5kYXJrZW5GYWN0b3IgfHwgMC43NSxcbiAgICAgICAgICAgIGNvbG9yID0gb3B0aW9ucy5jb2xvciB8fCBjb25maWcuY29sb3IgfHwgJ2dvbGQnLFxuICAgICAgICAgICAgc3Ryb2tlID0gdGhpcy5zdHJva2UgPSBjb2xvciA9PT0gdGhpcy5jb2xvciA/IHRoaXMuc3Ryb2tlIDogZ2V0RGFya2VuZWRDb2xvcihnYywgdGhpcy5jb2xvciA9IGNvbG9yLCBkYXJrZW5GYWN0b3IpLFxuICAgICAgICAgICAgLy8gYmdDb2xvciA9IGNvbmZpZy5pc1NlbGVjdGVkID8gKG9wdGlvbnMuYmdTZWxDb2xvciB8fCBjb25maWcuYmdTZWxDb2xvcikgOiAob3B0aW9ucy5iZ0NvbG9yIHx8IGNvbmZpZy5iZ0NvbG9yKSxcbiAgICAgICAgICAgIGZnQ29sb3IgPSBjb25maWcuaXNTZWxlY3RlZCA/IChvcHRpb25zLmZnU2VsQ29sb3IgfHwgY29uZmlnLmZnU2VsQ29sb3IpIDogKG9wdGlvbnMuZmdDb2xvciB8fCBjb25maWcuZmdDb2xvciksXG4gICAgICAgICAgICBzaGFkb3dDb2xvciA9IG9wdGlvbnMuc2hhZG93Q29sb3IgfHwgY29uZmlnLnNoYWRvd0NvbG9yIHx8ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAvLyBmb250ID0gb3B0aW9ucy5mb250IHx8IGNvbmZpZy5mb250IHx8ICcxMXB4IHZlcmRhbmEnLFxuICAgICAgICAgICAgbWlkZGxlID0gaGVpZ2h0IC8gMixcbiAgICAgICAgICAgIGRpYW1ldGVyID0gc2l6ZUZhY3RvciAqIGhlaWdodCxcbiAgICAgICAgICAgIG91dGVyUmFkaXVzID0gc2l6ZUZhY3RvciAqIG1pZGRsZSxcbiAgICAgICAgICAgIHZhbCA9IE51bWJlcihvcHRpb25zLnZhbCksXG4gICAgICAgICAgICBwb2ludHMgPSB0aGlzLnBvaW50cztcblxuICAgICAgICBpZiAoIXBvaW50cykge1xuICAgICAgICAgICAgdmFyIGlubmVyUmFkaXVzID0gMyAvIDcgKiBvdXRlclJhZGl1cztcbiAgICAgICAgICAgIHBvaW50cyA9IHRoaXMucG9pbnRzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gNSwgcGkgPSBNYXRoLlBJIC8gMiwgaW5jciA9IE1hdGguUEkgLyA1OyBpOyAtLWksIHBpICs9IGluY3IpIHtcbiAgICAgICAgICAgICAgICBwb2ludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHg6IG91dGVyUmFkaXVzICogTWF0aC5jb3MocGkpLFxuICAgICAgICAgICAgICAgICAgICB5OiBtaWRkbGUgLSBvdXRlclJhZGl1cyAqIE1hdGguc2luKHBpKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHBpICs9IGluY3I7XG4gICAgICAgICAgICAgICAgcG9pbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB4OiBpbm5lclJhZGl1cyAqIE1hdGguY29zKHBpKSxcbiAgICAgICAgICAgICAgICAgICAgeTogbWlkZGxlIC0gaW5uZXJSYWRpdXMgKiBNYXRoLnNpbihwaSlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvaW50cy5wdXNoKHBvaW50c1swXSk7IC8vIGNsb3NlIHRoZSBwYXRoXG4gICAgICAgIH1cblxuICAgICAgICBnYy5jYWNoZS5zaGFkb3dDb2xvciA9ICd0cmFuc3BhcmVudCc7XG5cbiAgICAgICAgZ2MuY2FjaGUubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgICBnYy5iZWdpblBhdGgoKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDUsIHN4ID0geCArIDUgKyBvdXRlclJhZGl1czsgajsgLS1qLCBzeCArPSBkaWFtZXRlcikge1xuICAgICAgICAgICAgcG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocG9pbnQsIGluZGV4KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgICAgICBnY1tpbmRleCA/ICdsaW5lVG8nIDogJ21vdmVUbyddKHN4ICsgcG9pbnQueCwgeSArIHBvaW50LnkpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICB9KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICB9XG4gICAgICAgIGdjLmNsb3NlUGF0aCgpO1xuXG4gICAgICAgIHZhbCA9IHZhbCAvIGRvbWFpbiAqIDU7XG5cbiAgICAgICAgZ2MuY2FjaGUuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgICAgIGdjLnNhdmUoKTtcbiAgICAgICAgZ2MuY2xpcCgpO1xuICAgICAgICBnYy5maWxsUmVjdCh4ICsgNSwgeSxcbiAgICAgICAgICAgIChNYXRoLmZsb29yKHZhbCkgKyAwLjI1ICsgdmFsICUgMSAqIDAuNSkgKiBkaWFtZXRlciwgLy8gYWRqdXN0IHdpZHRoIHRvIHNraXAgb3ZlciBzdGFyIG91dGxpbmVzIGFuZCBqdXN0IG1ldGVyIHRoZWlyIGludGVyaW9yc1xuICAgICAgICAgICAgaGVpZ2h0KTtcbiAgICAgICAgZ2MucmVzdG9yZSgpOyAvLyByZW1vdmUgY2xpcHBpbmcgcmVnaW9uXG5cbiAgICAgICAgZ2MuY2FjaGUuc3Ryb2tlU3R5bGUgPSBzdHJva2U7XG4gICAgICAgIGdjLmNhY2hlLmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIGdjLnN0cm9rZSgpO1xuXG4gICAgICAgIGlmIChmZ0NvbG9yICYmIGZnQ29sb3IgIT09ICd0cmFuc3BhcmVudCcpIHtcbiAgICAgICAgICAgIGdjLmNhY2hlLmZpbGxTdHlsZSA9IGZnQ29sb3I7XG4gICAgICAgICAgICBnYy5jYWNoZS5mb250ID0gJzExcHggdmVyZGFuYSc7XG4gICAgICAgICAgICBnYy5jYWNoZS50ZXh0QWxpZ24gPSAncmlnaHQnO1xuICAgICAgICAgICAgZ2MuY2FjaGUudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XG4gICAgICAgICAgICBnYy5jYWNoZS5zaGFkb3dDb2xvciA9IHNoYWRvd0NvbG9yO1xuICAgICAgICAgICAgZ2MuY2FjaGUuc2hhZG93T2Zmc2V0WCA9IGdjLmNhY2hlLnNoYWRvd09mZnNldFkgPSAxO1xuICAgICAgICAgICAgZ2MuZmlsbFRleHQodmFsLnRvRml4ZWQoMSksIHggKyB3aWR0aCArIDEwLCB5ICsgaGVpZ2h0IC8gMik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXREYXJrZW5lZENvbG9yKGdjLCBjb2xvciwgZmFjdG9yKSB7XG4gICAgICAgIHZhciByZ2JhID0gZ2V0UkdCQShnYywgY29sb3IpO1xuICAgICAgICByZXR1cm4gJ3JnYmEoJyArIE1hdGgucm91bmQoZmFjdG9yICogcmdiYVswXSkgKyAnLCcgKyBNYXRoLnJvdW5kKGZhY3RvciAqIHJnYmFbMV0pICsgJywnICsgTWF0aC5yb3VuZChmYWN0b3IgKiByZ2JhWzJdKSArICcsJyArIChyZ2JhWzNdIHx8IDEpICsgJyknO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFJHQkEoZ2MsIGNvbG9yU3BlYykge1xuICAgICAgICAvLyBOb3JtYWxpemUgdmFyaWV0eSBvZiBDU1MgY29sb3Igc3BlYyBzeW50YXhlcyB0byBvbmUgb2YgdHdvXG4gICAgICAgIGdjLmNhY2hlLmZpbGxTdHlsZSA9IGNvbG9yU3BlYztcblxuICAgICAgICB2YXIgcmdiYSA9IGNvbG9yU3BlYy5tYXRjaChSRUdFWFBfQ1NTX0hFWDYpO1xuICAgICAgICBpZiAocmdiYSkge1xuICAgICAgICAgICAgcmdiYS5zaGlmdCgpOyAvLyByZW1vdmUgd2hvbGUgbWF0Y2hcbiAgICAgICAgICAgIHJnYmEuZm9yRWFjaChmdW5jdGlvbih2YWwsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmdiYVtpbmRleF0gPSBwYXJzZUludCh2YWwsIDE2KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmdiYSA9IGNvbG9yU3BlYy5tYXRjaChSRUdFWFBfQ1NTX1JHQik7XG4gICAgICAgICAgICBpZiAoIXJnYmEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnVW5leHBlY3RlZCBmb3JtYXQgZ2V0dGluZyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQuZmlsbFN0eWxlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJnYmEuc2hpZnQoKTsgLy8gcmVtb3ZlIHdob2xlIG1hdGNoXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmdiYTtcbiAgICB9XG5cblxuICAgIC8vRXh0ZW5kIEh5cGVyR3JpZCdzIGJhc2UgUmVuZGVyZXJcbiAgICB2YXIgc3BhcmtTdGFyUmF0aW5nUmVuZGVyZXIgPSBncmlkLmNlbGxSZW5kZXJlcnMuQmFzZUNsYXNzLmV4dGVuZCh7XG4gICAgICAgIHBhaW50OiBwYWludFNwYXJrUmF0aW5nXG4gICAgfSk7XG5cbiAgICAvL1JlZ2lzdGVyIHlvdXIgcmVuZGVyZXJcbiAgICBncmlkLmNlbGxSZW5kZXJlcnMuYWRkKCdTdGFycnknLCBzcGFya1N0YXJSYXRpbmdSZW5kZXJlcik7XG5cbiAgICAvLyBFTkQgT0YgQ1VTVE9NIENFTEwgUkVOREVSRVJcbiAgICByZXR1cm4gZ3JpZDtcbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuLyogZ2xvYmFscyBwZW9wbGUxLCBwZW9wbGUyICovXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWFsZXJ0ICovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gU29tZSBET00gc3VwcG9ydCBmdW5jdGlvbnMuLi5cbi8vIEJlc2lkZXMgdGhlIGNhbnZhcywgdGhpcyB0ZXN0IGhhcm5lc3Mgb25seSBoYXMgYSBoYW5kZnVsIG9mIGJ1dHRvbnMgYW5kIGNoZWNrYm94ZXMuXG4vLyBUaGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBzZXJ2aWNlIHRoZXNlIGNvbnRyb2xzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIC8vIG1ha2UgYnV0dG9ucyBkaXYgYWJzb2x1dGUgc28gYnV0dG9ucyB3aWR0aCBvZiAxMDAlIGRvZXNuJ3Qgc3RyZXRjaCB0byB3aWR0aCBvZiBkYXNoYm9hcmRcbiAgICB2YXIgY3RybEdyb3VwcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdHJsLWdyb3VwcycpLFxuICAgICAgICBkYXNoYm9hcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGFzaGJvYXJkJyksXG4gICAgICAgIGJ1dHRvbnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnV0dG9ucycpO1xuXG4gICAgY3RybEdyb3Vwcy5zdHlsZS50b3AgPSBjdHJsR3JvdXBzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArICdweCc7XG4gICAgLy9idXR0b25zLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBkYXNoYm9hcmQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIGZ1bmN0aW9uIHRvZ2dsZVJvd1N0eWxpbmdNZXRob2QoKSB7XG4gICAgICAgIGRlbW8uc3R5bGVSb3dzRnJvbURhdGEgPSAhZGVtby5zdHlsZVJvd3NGcm9tRGF0YTtcbiAgICB9XG5cbiAgICAvLyBMaXN0IG9mIHByb3BlcnRpZXMgdG8gc2hvdyBhcyBjaGVja2JveGVzIGluIHRoaXMgZGVtbydzIFwiZGFzaGJvYXJkXCJcbiAgICB2YXIgdG9nZ2xlUHJvcHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnUm93IHN0eWxpbmcnLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJyhHbG9iYWwgc2V0dGluZyknLCBsYWJlbDogJ2Jhc2Ugb24gZGF0YScsIHNldHRlcjogdG9nZ2xlUm93U3R5bGluZ01ldGhvZH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdDb2x1bW4gaGVhZGVyIHJvd3MnLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJ3Nob3dIZWFkZXJSb3cnLCBsYWJlbDogJ2hlYWRlcid9LCAvLyBkZWZhdWx0IFwic2V0dGVyXCIgaXMgYHNldFByb3BgXG4gICAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnSG92ZXIgaGlnaGxpZ2h0cycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnaG92ZXJDZWxsSGlnaGxpZ2h0LmVuYWJsZWQnLCBsYWJlbDogJ2NlbGwnfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2hvdmVyUm93SGlnaGxpZ2h0LmVuYWJsZWQnLCBsYWJlbDogJ3Jvdyd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnaG92ZXJDb2x1bW5IaWdobGlnaHQuZW5hYmxlZCcsIGxhYmVsOiAnY29sdW1uJ31cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdMaW5rIHN0eWxlJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge25hbWU6ICdsaW5rT25Ib3ZlcicsIGxhYmVsOiAnb24gaG92ZXInfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2xpbmtDb2xvcicsIHR5cGU6ICd0ZXh0JywgbGFiZWw6ICdjb2xvcid9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnbGlua0NvbG9yT25Ib3ZlcicsIGxhYmVsOiAnY29sb3Igb24gaG92ZXInfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBsYWJlbDogJ0NlbGwgZWRpdGluZycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnZWRpdGFibGUnfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2VkaXRPbkRvdWJsZUNsaWNrJywgbGFiZWw6ICdyZXF1aXJlcyBkb3VibGUtY2xpY2snfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2VkaXRPbktleWRvd24nLCBsYWJlbDogJ3R5cGUgdG8gZWRpdCd9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGxhYmVsOiAnU2VsZWN0aW9uJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY2VsbFNlbGVjdGlvbicsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnY2VsbHMnLFxuICAgICAgICAgICAgICAgICAgICB3ZWlnaHQ6ICdib2xkJyxcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcDogJ0Jhc2ljIGNlbGwgc2VsZWN0YWJpbGl0eS4nLFxuICAgICAgICAgICAgICAgICAgICBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3BcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJyFtdWx0aXBsZVNlbGVjdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ29uZSBjZWxsIHJlZ2lvbiBhdCBhIHRpbWUnLFxuICAgICAgICAgICAgICAgICAgICBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3AsXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IHRydWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2NvbGxhcHNlQ2VsbFNlbGVjdGlvbnMnLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2NvbGxhcHNlIGNlbGwgc2VsZWN0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcCxcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcDogJ0NlbGwgc2VsZWN0aW9ucyBhcmUgcHJvamVjdGVkIG9udG8gc3Vic2VxdWVudGx5IHNlbGVjdGVkIHJvd3MuXFxuXFxuJyArXG4gICAgICAgICAgICAgICAgICAgICdSZXF1aXJlcyBzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlICYmICFtdWx0aXBsZVNlbGVjdGlvbnMuJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAncm93U2VsZWN0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdyb3dzJyxcbiAgICAgICAgICAgICAgICAgICAgd2VpZ2h0OiAnYm9sZCcsXG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXA6ICdCYXNpYyByb3cgc2VsZWN0YWJpbGl0eS4nLFxuICAgICAgICAgICAgICAgICAgICBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3BcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2F1dG9TZWxlY3RSb3dzJywgbGFiZWw6ICdhdXRvLXNlbGVjdCByb3dzJywgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wLFxuICAgICAgICAgICAgICAgICAgICB0b29sdGlwOiAnTm90ZXM6XFxuJyArXG4gICAgICAgICAgICAgICAgICAgICcxLiBSZXF1aXJlcyB0aGF0IGNoZWNrYm94T25seVJvd1NlbGVjdGlvbnMgYmUgc2V0IHRvIGZhbHNlIChzbyBjaGVja2luZyB0aGlzIGJveCBhdXRvbWF0aWNhbGx5IHVuY2hlY2tzIHRoYXQgb25lKS5cXG4nICtcbiAgICAgICAgICAgICAgICAgICAgJzIuIFNldCBzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlIHRvIGZhbHNlIHRvIGFsbG93IGF1dG8tc2VsZWN0IG9mIG11bHRpcGxlIHJvd3MuJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucycsIGxhYmVsOiAnYnkgcm93IGhhbmRsZXMgb25seScsIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcCxcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcDogJ05vdGUgdGhhdCB3aGVuIHRoaXMgcHJvcGVydHkgaXMgYWN0aXZlLCBhdXRvU2VsZWN0Um93cyB3aWxsIG5vdCB3b3JrLidcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3NpbmdsZVJvd1NlbGVjdGlvbk1vZGUnLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ29uZSByb3cgYXQgYSB0aW1lJyxcbiAgICAgICAgICAgICAgICAgICAgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdjb2x1bW5TZWxlY3Rpb24nLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2NvbHVtbnMnLFxuICAgICAgICAgICAgICAgICAgICB3ZWlnaHQ6ICdib2xkJyxcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcDogJ0Jhc2ljIGNvbHVtbiBzZWxlY3RhYmlsaXR5LicsXG4gICAgICAgICAgICAgICAgICAgIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnYXV0b1NlbGVjdENvbHVtbnMnLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2F1dG8tc2VsZWN0IGNvbHVtbnMnLFxuICAgICAgICAgICAgICAgICAgICBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3BcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICBdO1xuXG5cbiAgICB0b2dnbGVQcm9wcy5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApIHtcbiAgICAgICAgYWRkVG9nZ2xlKHByb3ApO1xuICAgIH0pO1xuXG5cbiAgICBbXG4gICAgICAgIHtsYWJlbDogJ1RvZ2dsZSBFbXB0eSBEYXRhJywgb25jbGljazogZGVtby50b2dnbGVFbXB0eURhdGF9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ1NldCBEYXRhJywgb25jbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZW1vLnJlc2V0RGF0YSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ1NldCBEYXRhIDEgKDUwMDAgcm93cyknLCBvbmNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRlbW8uc2V0RGF0YShwZW9wbGUxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdTZXQgRGF0YSAyICgxMDAwMCByb3dzKScsIG9uY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGVtby5zZXREYXRhKHBlb3BsZTIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7bGFiZWw6ICdSZXNldCBHcmlkJywgb25jbGljazogZGVtby5yZXNldH1cblxuICAgIF0uZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgICAgYnV0dG9uLmlubmVySFRNTCA9IGl0ZW0ubGFiZWw7XG4gICAgICAgIGJ1dHRvbi5vbmNsaWNrID0gaXRlbS5vbmNsaWNrO1xuICAgICAgICBpZiAoaXRlbS50aXRsZSkge1xuICAgICAgICAgICAgYnV0dG9uLnRpdGxlID0gaXRlbS50aXRsZTtcbiAgICAgICAgfVxuICAgICAgICBidXR0b25zLmFwcGVuZENoaWxkKGJ1dHRvbik7XG4gICAgfSk7XG5cblxuICAgIGZ1bmN0aW9uIGFkZFRvZ2dsZShjdHJsR3JvdXApIHtcbiAgICAgICAgdmFyIGlucHV0LCBsYWJlbCxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgICAgIGNvbnRhaW5lci5jbGFzc05hbWUgPSAnY3RybC1ncm91cCc7XG5cbiAgICAgICAgaWYgKGN0cmxHcm91cC5sYWJlbCkge1xuICAgICAgICAgICAgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIGxhYmVsLmNsYXNzTmFtZSA9ICd0d2lzdGVyJztcbiAgICAgICAgICAgIGxhYmVsLmlubmVySFRNTCA9IGN0cmxHcm91cC5sYWJlbDtcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChsYWJlbCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hvaWNlcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjaG9pY2VzLmNsYXNzTmFtZSA9ICdjaG9pY2VzJztcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNob2ljZXMpO1xuXG4gICAgICAgIGN0cmxHcm91cC5jdHJscy5mb3JFYWNoKGZ1bmN0aW9uKGN0cmwpIHtcbiAgICAgICAgICAgIGlmICghY3RybCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHJlZmVyZW5jZUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgdHlwZSA9IGN0cmwudHlwZSB8fCAnY2hlY2tib3gnLFxuICAgICAgICAgICAgICAgIHRvb2x0aXAgPSAnUHJvcGVydHkgbmFtZTogJyArIGN0cmwubmFtZTtcblxuICAgICAgICAgICAgaWYgKGN0cmwudG9vbHRpcCkge1xuICAgICAgICAgICAgICAgIHRvb2x0aXAgKz0gJ1xcblxcbicgKyBjdHJsLnRvb2x0aXA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgIGlucHV0LnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgaW5wdXQuaWQgPSBjdHJsLm5hbWU7XG4gICAgICAgICAgICBpbnB1dC5uYW1lID0gY3RybEdyb3VwLmxhYmVsO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQudmFsdWUgPSBjdHJsLnZhbHVlIHx8IGdldFByb3BlcnR5KGN0cmwubmFtZSkgfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnN0eWxlLndpZHRoID0gJzI1cHgnO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC5zdHlsZS5tYXJnaW5MZWZ0ID0gJzRweCc7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnN0eWxlLm1hcmdpblJpZ2h0ID0gJzRweCc7XG4gICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZUVsZW1lbnQgPSBpbnB1dDsgLy8gbGFiZWwgZ29lcyBhZnRlciBpbnB1dFxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgICAgICAgICAgY2FzZSAncmFkaW8nOlxuICAgICAgICAgICAgICAgICAgICBpbnB1dC5jaGVja2VkID0gJ2NoZWNrZWQnIGluIGN0cmxcbiAgICAgICAgICAgICAgICAgICAgICAgID8gY3RybC5jaGVja2VkXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGdldFByb3BlcnR5KGN0cmwubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZUVsZW1lbnQgPSBudWxsOyAvLyBsYWJlbCBnb2VzIGJlZm9yZSBpbnB1dFxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5wdXQub25jaGFuZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIGhhbmRsZVJhZGlvQ2xpY2suY2FsbCh0aGlzLCBjdHJsLnNldHRlciB8fCBzZXRQcm9wLCBldmVudCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XG4gICAgICAgICAgICBsYWJlbC50aXRsZSA9IHRvb2x0aXA7XG4gICAgICAgICAgICBsYWJlbC5zdHlsZS5mb250V2VpZ2h0ID0gY3RybC53ZWlnaHQ7XG4gICAgICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICBsYWJlbC5pbnNlcnRCZWZvcmUoXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJyAnICsgKGN0cmwubGFiZWwgfHwgY3RybC5uYW1lKSksXG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlRWxlbWVudFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY2hvaWNlcy5hcHBlbmRDaGlsZChsYWJlbCk7XG5cbiAgICAgICAgICAgIGlmIChjdHJsLm5hbWUgPT09ICd0cmVldmlldycpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5vbm1vdXNlZG93biA9IGlucHV0Lm9ubW91c2Vkb3duID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbnB1dC5jaGVja2VkICYmIGdyaWQuYmVoYXZpb3IuZGF0YU1vZGVsLnNvdXJjZS5kYXRhICE9PSBkZW1vLnRyZWVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnTG9hZCB0cmVlIGRhdGEgZmlyc3QgKFwiU2V0IERhdGEgM1wiIGJ1dHRvbikuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY3RybEdyb3Vwcy5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgIH1cblxuICAgIC8vIHJlc2V0IGRhc2hib2FyZCBjaGVja2JveGVzIGFuZCByYWRpbyBidXR0b25zIHRvIG1hdGNoIGN1cnJlbnQgdmFsdWVzIG9mIGdyaWQgcHJvcGVydGllc1xuICAgIGRlbW8ucmVzZXREYXNoYm9hcmQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdG9nZ2xlUHJvcHMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgICAgICBwcm9wLmN0cmxzLmZvckVhY2goZnVuY3Rpb24oY3RybCkge1xuICAgICAgICAgICAgICAgIGlmIChjdHJsKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY3RybC5zZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2Ugc2V0U2VsZWN0aW9uUHJvcDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2Ugc2V0UHJvcDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY3RybC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3JhZGlvJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY2hlY2tib3gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZCA9IGN0cmwubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2xhcml0eSA9IChpZFswXSA9PT0gJyEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKS5jaGVja2VkID0gZ2V0UHJvcGVydHkoaWQpIF4gcG9sYXJpdHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBnZXRQcm9wZXJ0eShrZXkpIHtcbiAgICAgICAgdmFyIGtleXMgPSBrZXkuc3BsaXQoJy4nKTtcbiAgICAgICAgdmFyIHByb3AgPSBncmlkLnByb3BlcnRpZXM7XG5cbiAgICAgICAgd2hpbGUgKGtleXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBwcm9wID0gcHJvcFtrZXlzLnNoaWZ0KCldO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgfVxuXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi1kYXNoYm9hcmQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChkYXNoYm9hcmQuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnKSB7XG4gICAgICAgICAgICBkYXNoYm9hcmQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS50cmFuc2l0aW9uID0gJ21hcmdpbi1sZWZ0IC43NXMnO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUubWFyZ2luTGVmdCA9IE1hdGgubWF4KDE4MCwgZGFzaGJvYXJkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0ICsgOCkgKyAncHgnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBkYXNoYm9hcmQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIH0sIDgwMCk7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS5tYXJnaW5MZWZ0ID0gJzMwcHgnO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgZnBzVGltZXIsIHNlY3MsIGZyYW1lcztcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFiLWZwcycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGVsID0gdGhpcywgc3QgPSBlbC5zdHlsZTtcbiAgICAgICAgaWYgKChncmlkLnByb3BlcnRpZXMuZW5hYmxlQ29udGludW91c1JlcGFpbnQgXj0gdHJ1ZSkpIHtcbiAgICAgICAgICAgIHN0LmJhY2tncm91bmRDb2xvciA9ICcjNjY2JztcbiAgICAgICAgICAgIHN0LnRleHRBbGlnbiA9ICdsZWZ0JztcbiAgICAgICAgICAgIHNlY3MgPSBmcmFtZXMgPSAwO1xuICAgICAgICAgICAgY29kZSgpO1xuICAgICAgICAgICAgZnBzVGltZXIgPSBzZXRJbnRlcnZhbChjb2RlLCAxMDAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoZnBzVGltZXIpO1xuICAgICAgICAgICAgc3QuYmFja2dyb3VuZENvbG9yID0gc3QudGV4dEFsaWduID0gbnVsbDtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9ICdGUFMnO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGNvZGUoKSB7XG4gICAgICAgICAgICB2YXIgZnBzID0gZ3JpZC5jYW52YXMuY3VycmVudEZQUyxcbiAgICAgICAgICAgICAgICBiYXJzID0gQXJyYXkoTWF0aC5yb3VuZChmcHMpICsgMSkuam9pbignSScpLFxuICAgICAgICAgICAgICAgIHN1YnJhbmdlLCBzcGFuO1xuXG4gICAgICAgICAgICAvLyBmaXJzdCBzcGFuIGhvbGRzIHRoZSAzMCBiYWNrZ3JvdW5kIGJhcnNcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpKTtcblxuICAgICAgICAgICAgLy8gMm5kIHNwYW4gaG9sZHMgdGhlIG51bWVyaWNcbiAgICAgICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cbiAgICAgICAgICAgIGlmIChzZWNzKSB7XG4gICAgICAgICAgICAgICAgZnJhbWVzICs9IGZwcztcbiAgICAgICAgICAgICAgICBzcGFuLmlubmVySFRNTCA9IGZwcy50b0ZpeGVkKDEpO1xuICAgICAgICAgICAgICAgIHNwYW4udGl0bGUgPSBzZWNzICsgJy1zZWNvbmQgYXZlcmFnZSA9ICcgKyAoZnJhbWVzIC8gc2VjcykudG9GaXhlZCgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlY3MgKz0gMTtcblxuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbik7XG5cbiAgICAgICAgICAgIC8vIDAgdG8gNCBjb2xvciByYW5nZSBiYXIgc3Vic2V0czogMS4uMTA6cmVkLCAxMToyMDp5ZWxsb3csIDIxOjMwOmdyZWVuXG4gICAgICAgICAgICB3aGlsZSAoKHN1YnJhbmdlID0gYmFycy5zdWJzdHIoMCwgMTIpKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgICAgIHNwYW4uaW5uZXJIVE1MID0gc3VicmFuZ2U7XG4gICAgICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICAgICAgICAgICAgYmFycyA9IGJhcnMuc3Vic3RyKDEyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGhlaWdodDtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFiLWdyb3ctc2hyaW5rJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgbGFiZWw7XG4gICAgICAgIGlmICghaGVpZ2h0KSB7XG4gICAgICAgICAgICBoZWlnaHQgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShncmlkLmRpdikuaGVpZ2h0O1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUudHJhbnNpdGlvbiA9ICdoZWlnaHQgMS41cyBsaW5lYXInO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgIGxhYmVsID0gJ1Nocmluayc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBncmlkLmRpdi5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICBoZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsYWJlbCA9ICdHcm93JztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlubmVySFRNTCArPSAnIC4uLic7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmlubmVySFRNTCA9IGxhYmVsO1xuICAgICAgICB9LmJpbmQodGhpcyksIDE1MDApO1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Rhc2hib2FyZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGN0cmwgPSBldmVudC50YXJnZXQ7XG4gICAgICAgIGlmIChjdHJsLmNsYXNzTGlzdC5jb250YWlucygndHdpc3RlcicpKSB7XG4gICAgICAgICAgICBjdHJsLm5leHRFbGVtZW50U2libGluZy5zdHlsZS5kaXNwbGF5ID0gY3RybC5jbGFzc0xpc3QudG9nZ2xlKCdvcGVuJykgPyAnYmxvY2snIDogJ25vbmUnO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUubWFyZ2luTGVmdCA9IE1hdGgubWF4KDE4MCwgZXZlbnQuY3VycmVudFRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5yaWdodCArIDgpICsgJ3B4JztcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICB2YXIgcmFkaW9Hcm91cCA9IHt9O1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlUmFkaW9DbGljayhoYW5kbGVyLCBldmVudCkge1xuICAgICAgICBpZiAodGhpcy50eXBlID09PSAncmFkaW8nKSB7XG4gICAgICAgICAgICB2YXIgbGFzdFJhZGlvID0gcmFkaW9Hcm91cFt0aGlzLm5hbWVdO1xuICAgICAgICAgICAgaWYgKGxhc3RSYWRpbykge1xuICAgICAgICAgICAgICAgIGxhc3RSYWRpby5oYW5kbGVyLmNhbGwobGFzdFJhZGlvLmN0cmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmFkaW9Hcm91cFt0aGlzLm5hbWVdID0ge2N0cmw6IHRoaXMsIGhhbmRsZXI6IGhhbmRsZXJ9O1xuICAgICAgICB9XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0UHJvcCgpIHsgLy8gc3RhbmRhcmQgY2hlY2tib3ggY2xpY2sgaGFuZGxlclxuICAgICAgICB2YXIgaGFzaCA9IHt9LCBkZXB0aCA9IGhhc2g7XG4gICAgICAgIHZhciBpZCA9IHRoaXMuaWQ7XG4gICAgICAgIGlmIChpZFswXSA9PT0gJyEnKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50eXBlICE9PSAnY2hlY2tib3gnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0V4cGVjdGVkIGludmVyc2Ugb3BlcmF0b3IgKCEpIG9uIGNoZWNrYm94IGRhc2hib2FyZCBjb250cm9scyBvbmx5IGJ1dCBmb3VuZCBvbiAnICsgdGhpcy50eXBlICsgJy4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWQgPSBpZC5zdWJzdHIoMSk7XG4gICAgICAgICAgICB2YXIgaW52ZXJzZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleXMgPSBpZC5zcGxpdCgnLicpO1xuXG4gICAgICAgIHdoaWxlIChrZXlzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGRlcHRoID0gZGVwdGhba2V5cy5zaGlmdCgpXSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgICAgIGRlcHRoW2tleXMuc2hpZnQoKV0gPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY2hlY2tib3gnOlxuICAgICAgICAgICAgICAgIGRlcHRoW2tleXMuc2hpZnQoKV0gPSBpbnZlcnNlID8gIXRoaXMuY2hlY2tlZCA6IHRoaXMuY2hlY2tlZDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGdyaWQudGFrZUZvY3VzKCk7XG4gICAgICAgIGdyaWQuYWRkUHJvcGVydGllcyhoYXNoKTtcbiAgICAgICAgZ3JpZC5iZWhhdmlvckNoYW5nZWQoKTtcbiAgICAgICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0U2VsZWN0aW9uUHJvcCgpIHsgLy8gYWx0ZXJuYXRlIGNoZWNrYm94IGNsaWNrIGhhbmRsZXJcbiAgICAgICAgdmFyIGN0cmw7XG5cbiAgICAgICAgZ3JpZC5zZWxlY3Rpb25Nb2RlbC5jbGVhcigpO1xuXG4gICAgICAgIHNldFByb3AuY2FsbCh0aGlzKTtcblxuICAgICAgICBpZiAodGhpcy5jaGVja2VkKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgdGhpcy5pZCA9PT0gJ2NoZWNrYm94T25seVJvd1NlbGVjdGlvbnMnICYmXG4gICAgICAgICAgICAgICAgKGN0cmwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXV0b1NlbGVjdFJvd3MnKSkuY2hlY2tlZFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQoJ05vdGUgdGhhdCBhdXRvU2VsZWN0Um93cyBpcyBpbmVmZmVjdHVhbCB3aGVuIGNoZWNrYm94T25seVJvd1NlbGVjdGlvbnMgaXMgb24uJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaWQgPT09ICdhdXRvU2VsZWN0Um93cycpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIChjdHJsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoZWNrYm94T25seVJvd1NlbGVjdGlvbnMnKSkuY2hlY2tlZCAmJlxuICAgICAgICAgICAgICAgICAgICBjb25maXJtKCdOb3RlIHRoYXQgYXV0b1NlbGVjdFJvd3MgaXMgaW5lZmZlY3R1YWwgd2hlbiBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zIGlzIG9uLlxcblxcblR1cm4gb2ZmIGNoZWNrYm94T25seVJvd1NlbGVjdGlvbnM/JylcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHNldFByb3AuY2FsbChjdHJsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIChjdHJsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpbmdsZVJvd1NlbGVjdGlvbk1vZGUnKSkuY2hlY2tlZCAmJlxuICAgICAgICAgICAgICAgICAgICBjb25maXJtKCdOb3RlIHRoYXQgYXV0by1zZWxlY3RpbmcgYSByYW5nZSBvZiByb3dzIGJ5IHNlbGVjdGluZyBhIHJhbmdlIG9mIGNlbGxzICh3aXRoIGNsaWNrICsgZHJhZyBvciBzaGlmdCArIGNsaWNrKSBpcyBub3QgcG9zc2libGUgd2l0aCBzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlIGlzIG9uLlxcblxcblR1cm4gb2ZmIHNpbmdsZVJvd1NlbGVjdGlvbk1vZGU/JylcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHNldFByb3AuY2FsbChjdHJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVtbywgZ3JpZCkge1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tYnV0dG9uLXByZXNzZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBjZWxsRXZlbnQgPSBlLmRldGFpbC5wcmltaXRpdmVFdmVudDtcbiAgICAgICAgY2VsbEV2ZW50LnZhbHVlID0gIWNlbGxFdmVudC52YWx1ZTtcbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWNlbGwtZW50ZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBjZWxsRXZlbnQgPSBlLmRldGFpbDtcblxuICAgICAgICAvL2hvdyB0byBzZXQgdGhlIHRvb2x0aXAuLi4uXG4gICAgICAgIGdyaWQuc2V0QXR0cmlidXRlKCd0aXRsZScsICdldmVudCBuYW1lOiBcImZpbi1jZWxsLWVudGVyXCJcXG4nICtcbiAgICAgICAgICAgICdncmlkQ2VsbDogeyB4OiAnICsgY2VsbEV2ZW50LmdyaWRDZWxsLnggKyAnLCB5OiAnICsgY2VsbEV2ZW50LmdyaWRDZWxsLnkgKyAnIH1cXG4nICtcbiAgICAgICAgICAgICdkYXRhQ2VsbDogeyB4OiAnICsgY2VsbEV2ZW50LmRhdGFDZWxsLnggKyAnLCB5OiAnICsgY2VsbEV2ZW50LmRhdGFDZWxsLnkgKyAnIH1cXG4nICtcbiAgICAgICAgICAgICdzdWJncmlkIHR5cGU6IFwiJyArIGNlbGxFdmVudC5zdWJncmlkLnR5cGUgKyAnXCJcXG4nICtcbiAgICAgICAgICAgICdzdWJncmlkIG5hbWU6ICcgKyAoY2VsbEV2ZW50LnN1YmdyaWQubmFtZSA/ICdcIicgKyBjZWxsRXZlbnQuc3ViZ3JpZC5uYW1lICsgJ1wiJyA6ICd1bmRlZmluZWQnKVxuICAgICAgICApO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tc2V0LXRvdGFscy12YWx1ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGRldGFpbCA9IGUuZGV0YWlsLFxuICAgICAgICAgICAgYXJlYXMgPSBkZXRhaWwuYXJlYXMgfHwgWyd0b3AnLCAnYm90dG9tJ107XG5cbiAgICAgICAgYXJlYXMuZm9yRWFjaChmdW5jdGlvbihhcmVhKSB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kTmFtZSA9ICdnZXQnICsgYXJlYVswXS50b1VwcGVyQ2FzZSgpICsgYXJlYS5zdWJzdHIoMSkgKyAnVG90YWxzJyxcbiAgICAgICAgICAgICAgICB0b3RhbHNSb3cgPSBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbFttZXRob2ROYW1lXSgpO1xuXG4gICAgICAgICAgICB0b3RhbHNSb3dbZGV0YWlsLnldW2RldGFpbC54XSA9IGRldGFpbC52YWx1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBMaXN0ZW4gZm9yIGNlcnRhaW4ga2V5IHByZXNzZXMgZnJvbSBncmlkIG9yIGNlbGwgZWRpdG9yLlxuICAgICAqIEBkZXNjIE5PVEU6IGZpbmNhbnZhcydzIGludGVybmFsIGNoYXIgbWFwIHlpZWxkcyBtaXhlZCBjYXNlIHdoaWxlIGZpbi1lZGl0b3Ita2V5KiBldmVudHMgZG8gbm90LlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IE5vdCBoYW5kbGVkLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGhhbmRsZUN1cnNvcktleShlKSB7XG4gICAgICAgIHZhciBkZXRhaWwgPSBlLmRldGFpbCxcbiAgICAgICAgICAgIGtleSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZGV0YWlsLmtleSkudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlOyAvLyBtZWFucyBldmVudCBoYW5kbGVkIGhlcmVpblxuXG4gICAgICAgIGlmIChkZXRhaWwuY3RybCkge1xuICAgICAgICAgICAgaWYgKGRldGFpbC5zaGlmdCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzAnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0VG9WaWV3cG9ydENlbGwoMCwgMCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzknOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0VG9GaW5hbENlbGwoKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnOCc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RUb0ZpbmFsQ2VsbE9mQ3VycmVudFJvdygpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc3JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFRvRmlyc3RDZWxsT2ZDdXJyZW50Um93KCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICcwJzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFZpZXdwb3J0Q2VsbCgwLCAwKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnOSc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RGaW5hbENlbGwoKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnOCc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RGaW5hbENlbGxPZkN1cnJlbnRSb3coKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnNyc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RGaXJzdENlbGxPZkN1cnJlbnRSb3coKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWtleWRvd24nLCBoYW5kbGVDdXJzb3JLZXkpO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tZWRpdG9yLWtleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIHZhciBkZXRhaWwgPSBlLmRldGFpbCxcbiAgICAgICAgLy8gICAgIGtlID0gZGV0YWlsLmtleUV2ZW50O1xuICAgICAgICAvL1xuICAgICAgICAvLyAvLyBtb3JlIGRldGFpbCwgcGxlYXNlXG4gICAgICAgIC8vIGRldGFpbC5wcmltaXRpdmVFdmVudCA9IGtlO1xuICAgICAgICAvLyBkZXRhaWwua2V5ID0ga2Uua2V5Q29kZTtcbiAgICAgICAgLy8gZGV0YWlsLnNoaWZ0ID0ga2Uuc2hpZnRLZXk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGhhbmRsZUN1cnNvcktleShlKTtcbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLXNlbGVjdGlvbi1jaGFuZ2VkJywgZnVuY3Rpb24oZSkge1xuXG4gICAgICAgIGlmIChlLmRldGFpbC5zZWxlY3Rpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIHNlbGVjdGlvbnMnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRvIGdldCB0aGUgc2VsZWN0ZWQgcm93cyB1bmNvbW1lbnQgdGhlIGJlbG93Li4uLi5cbiAgICAgICAgLy8gY29uc29sZS5sb2coZ3JpZC5nZXRSb3dTZWxlY3Rpb25NYXRyaXgoKSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGdyaWQuZ2V0Um93U2VsZWN0aW9uKCkpO1xuXG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1yb3ctc2VsZWN0aW9uLWNoYW5nZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChlLmRldGFpbC5yb3dzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIHJvd3Mgc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvL3dlIGhhdmUgYSBmdW5jdGlvbiBjYWxsIHRvIGNyZWF0ZSB0aGUgc2VsZWN0aW9uIG1hdHJpeCBiZWNhdXNlXG4gICAgICAgIC8vd2UgZG9uJ3Qgd2FudCB0byBjcmVhdGUgYWxvdCBvZiBuZWVkbGVzcyBnYXJiYWdlIGlmIHRoZSB1c2VyXG4gICAgICAgIC8vaXMganVzdCBuYXZpZ2F0aW5nIGFyb3VuZFxuICAgICAgICBjb25zb2xlLmxvZyhncmlkLmdldFJvd1NlbGVjdGlvbk1hdHJpeCgpKTtcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZC5nZXRSb3dTZWxlY3Rpb24oKSk7XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1jb2x1bW4tc2VsZWN0aW9uLWNoYW5nZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChlLmRldGFpbC5jb2x1bW5zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIHJvd3Mgc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvL3dlIGhhdmUgYSBmdW5jdGlvbiBjYWxsIHRvIGNyZWF0ZSB0aGUgc2VsZWN0aW9uIG1hdHJpeCBiZWNhdXNlXG4gICAgICAgIC8vd2UgZG9uJ3Qgd2FudCB0byBjcmVhdGUgYWxvdCBvZiBuZWVkbGVzcyBnYXJiYWdlIGlmIHRoZSB1c2VyXG4gICAgICAgIC8vaXMganVzdCBuYXZpZ2F0aW5nIGFyb3VuZFxuICAgICAgICBjb25zb2xlLmxvZyhncmlkLmdldENvbHVtblNlbGVjdGlvbk1hdHJpeCgpKTtcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZC5nZXRDb2x1bW5TZWxlY3Rpb24oKSk7XG4gICAgfSk7XG5cbiAgICAvL3VuY29tbWVudCB0byBjYW5jZWwgZWRpdG9yIHBvcHBpbmcgdXA6XG4gICAgLy8gZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tcmVxdWVzdC1jZWxsLWVkaXQnLCBmdW5jdGlvbihlKSB7IGUucHJldmVudERlZmF1bHQoKTsgfSk7XG5cbiAgICAvL3VuY29tbWVudCB0byBjYW5jZWwgdXBkYXRpbmcgdGhlIG1vZGVsIHdpdGggdGhlIG5ldyBkYXRhOlxuICAgIC8vIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWJlZm9yZS1jZWxsLWVkaXQnLCBmdW5jdGlvbihlKSB7IGUucHJldmVudERlZmF1bHQoKTsgfSk7XG59O1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkZW1vLCBncmlkKSB7XG5cbiAgICB2YXIgZm9vdEluY2hQYXR0ZXJuID0gL15cXHMqKCgoKFxcZCspJyk/XFxzKigoXFxkKylcIik/KXxcXGQrKVxccyokLztcblxuICAgIHZhciBmb290SW5jaExvY2FsaXplciA9IHtcbiAgICAgICAgZm9ybWF0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmVldCA9IE1hdGguZmxvb3IodmFsdWUgLyAxMik7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSAoZmVldCA/IGZlZXQgKyAnXFwnJyA6ICcnKSArICcgJyArICh2YWx1ZSAlIDEyKSArICdcIic7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICAgICAgdmFyIGluY2hlcywgZmVldCxcbiAgICAgICAgICAgICAgICBwYXJ0cyA9IHN0ci5tYXRjaChmb290SW5jaFBhdHRlcm4pO1xuICAgICAgICAgICAgaWYgKHBhcnRzKSB7XG4gICAgICAgICAgICAgICAgZmVldCA9IHBhcnRzWzRdO1xuICAgICAgICAgICAgICAgIGluY2hlcyA9IHBhcnRzWzZdO1xuICAgICAgICAgICAgICAgIGlmIChmZWV0ID09PSB1bmRlZmluZWQgJiYgaW5jaGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5jaGVzID0gTnVtYmVyKHBhcnRzWzFdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmZWV0ID0gTnVtYmVyKGZlZXQgfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGluY2hlcyA9IE51bWJlcihpbmNoZXMgfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGluY2hlcyA9IDEyICogZmVldCArIGluY2hlcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGluY2hlcyA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW5jaGVzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdyaWQubG9jYWxpemF0aW9uLmFkZCgnZm9vdCcsIGZvb3RJbmNoTG9jYWxpemVyKTtcblxuICAgIGdyaWQubG9jYWxpemF0aW9uLmFkZCgnc2luZ2RhdGUnLCBuZXcgZ3JpZC5sb2NhbGl6YXRpb24uRGF0ZUZvcm1hdHRlcignemgtU0cnKSk7XG5cbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoJ3BvdW5kcycsIG5ldyBncmlkLmxvY2FsaXphdGlvbi5OdW1iZXJGb3JtYXR0ZXIoJ2VuLVVTJywge1xuICAgICAgICBzdHlsZTogJ2N1cnJlbmN5JyxcbiAgICAgICAgY3VycmVuY3k6ICdVU0QnXG4gICAgfSkpO1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKCdmcmFuY3MnLCBuZXcgZ3JpZC5sb2NhbGl6YXRpb24uTnVtYmVyRm9ybWF0dGVyKCdmci1GUicsIHtcbiAgICAgICAgc3R5bGU6ICdjdXJyZW5jeScsXG4gICAgICAgIGN1cnJlbmN5OiAnRVVSJ1xuICAgIH0pKTtcblxuICAgIHZhciBOT09OID0gMTIgKiA2MDtcbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoe1xuICAgICAgICBuYW1lOiAnY2xvY2sxMicsIC8vIGFsdGVybmF0aXZlIHRvIGhhdmluZyB0byBoYW1lIGxvY2FsaXplciBpbiBgZ3JpZC5sb2NhbGl6YXRpb24uYWRkYFxuXG4gICAgICAgIC8vIHJldHVybnMgZm9ybWF0dGVkIHN0cmluZyBmcm9tIG51bWJlciBvZiBtaW51dGVzXG4gICAgICAgIGZvcm1hdDogZnVuY3Rpb24obWlucykge1xuICAgICAgICAgICAgdmFyIGhoID0gTWF0aC5mbG9vcihtaW5zIC8gNjApICUgMTIgfHwgMTI7IC8vIG1vZHVsbyAxMiBocnMgd2l0aCAwIGJlY29taW5nIDEyXG4gICAgICAgICAgICB2YXIgbW0gPSAobWlucyAlIDYwICsgMTAwICsgJycpLnN1YnN0cigxLCAyKTtcbiAgICAgICAgICAgIHZhciBBbVBtID0gbWlucyA8IE5PT04gPyAnQU0nIDogJ1BNJztcbiAgICAgICAgICAgIHJldHVybiBoaCArICc6JyArIG1tICsgJyAnICsgQW1QbTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbnZhbGlkOiBmdW5jdGlvbihoaG1tQW1QbSkge1xuICAgICAgICAgICAgcmV0dXJuICEvXigwP1sxLTldfDFbMC0yXSk6WzAtNV1cXGRcXHMrKEFNfFBNKSQvaS50ZXN0KGhobW1BbVBtKTsgLy8gMTI6NTkgbWF4XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gcmV0dXJucyBudW1iZXIgb2YgbWludXRlcyBmcm9tIGZvcm1hdHRlZCBzdHJpbmdcbiAgICAgICAgcGFyc2U6IGZ1bmN0aW9uKGhobW1BbVBtKSB7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSBoaG1tQW1QbS5tYXRjaCgvXihcXGQrKTooXFxkezJ9KVxccysoQU18UE0pJC9pKTtcbiAgICAgICAgICAgIHZhciBob3VycyA9IHBhcnRzWzFdID09PSAnMTInID8gMCA6IE51bWJlcihwYXJ0c1sxXSk7XG4gICAgICAgICAgICB2YXIgbWludXRlcyA9IE51bWJlcihwYXJ0c1syXSk7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBob3VycyAqIDYwICsgbWludXRlcztcbiAgICAgICAgICAgIHZhciBwbSA9IHBhcnRzWzNdLnRvVXBwZXJDYXNlKCkgPT09ICdQTSc7XG4gICAgICAgICAgICBpZiAocG0pIHsgdmFsdWUgKz0gTk9PTjsgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZ3JpZDtcblxufTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKiBnbG9iYWxzIGZpbiwgcGVvcGxlMSAqL1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1hbGVydCovXG5cbid1c2Ugc3RyaWN0Jztcblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGRlbW8gPSB3aW5kb3cuZGVtbyA9IHtcbiAgICAgICAgc2V0IHZlbnQoc3RhcnQpIHsgd2luZG93LmdyaWRbc3RhcnQgPyAnbG9nU3RhcnQnIDogJ2xvZ1N0b3AnXSgpOyB9LFxuICAgICAgICByZXNldDogcmVzZXQsXG4gICAgICAgIHNldERhdGE6IHNldERhdGEsXG4gICAgICAgIHRvZ2dsZUVtcHR5RGF0YTogdG9nZ2xlRW1wdHlEYXRhLFxuICAgICAgICByZXNldERhdGE6IHJlc2V0RGF0YVxuICAgIH07XG5cbiAgICB2YXIgSHlwZXJncmlkID0gZmluLkh5cGVyZ3JpZCxcbiAgICAgICAgaW5pdFN0YXRlID0gcmVxdWlyZSgnLi9zZXRTdGF0ZScpLFxuICAgICAgICBpbml0Q2VsbFJlbmRlcmVycyA9IHJlcXVpcmUoJy4vY2VsbHJlbmRlcmVycycpLFxuICAgICAgICBpbml0Rm9ybWF0dGVycyA9IHJlcXVpcmUoJy4vZm9ybWF0dGVycycpLFxuICAgICAgICBpbml0Q2VsbEVkaXRvcnMgPSByZXF1aXJlKCcuL2NlbGxlZGl0b3JzJyksXG4gICAgICAgIGluaXREYXNoYm9hcmQgPSByZXF1aXJlKCcuL2Rhc2hib2FyZCcpLFxuICAgICAgICBpbml0RXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxuICAgIC8vIGNvbnZlcnQgZmllbGQgbmFtZXMgY29udGFpbmluZyB1bmRlcnNjb3JlIHRvIGNhbWVsIGNhc2UgYnkgb3ZlcnJpZGluZyBjb2x1bW4gZW51bSBkZWNvcmF0b3JcbiAgICBIeXBlcmdyaWQuYmVoYXZpb3JzLkpTT04ucHJvdG90eXBlLmNvbHVtbkVudW1LZXkgPSBIeXBlcmdyaWQuYmVoYXZpb3JzLkpTT04uY29sdW1uRW51bURlY29yYXRvcnMudG9DYW1lbENhc2U7XG5cbiAgICB2YXIgc2NoZW1hID0gSHlwZXJncmlkLmxpYi5maWVsZHMuZ2V0U2NoZW1hKHBlb3BsZTEpO1xuXG4gICAgLy8gYXMgb2YgdjIuMS42LCBjb2x1bW4gcHJvcGVydGllcyBjYW4gYWxzbyBiZSBpbml0aWFsaXplZCBmcm9tIGN1c3RvbSBzY2hlbWEgKGFzIHdlbGwgYXMgZnJvbSBhIGdyaWQgc3RhdGUgb2JqZWN0KS5cbiAgICAvLyBUaGUgZm9sbG93aW5nIGRlbW9uc3RyYXRlcyB0aGlzLiBOb3RlIHRoYXQgZGVtby9zZXRTdGF0ZS5qcyBhbHNvIHNldHMgcHJvcHMgb2YgJ2hlaWdodCcgY29sdW1uLiBUaGUgc2V0U3RhdGVcbiAgICAvLyBjYWxsIHRoZXJlaW4gd2FzIGNoYW5nZWQgdG8gYWRkU3RhdGUgdG8gYWNjb21tb2RhdGUgKGVsc2Ugc2NoZW1hIHByb3BzIGRlZmluZWQgaGVyZSB3b3VsZCBoYXZlIGJlZW4gY2xlYXJlZCkuXG4gICAgT2JqZWN0LmFzc2lnbihzY2hlbWEuZmluZChmdW5jdGlvbihjb2x1bW5TY2hlbWEpIHsgcmV0dXJuIGNvbHVtblNjaGVtYS5uYW1lID09PSAnaGVpZ2h0JzsgfSksIHtcbiAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAvLyBmb3JtYXQ6ICdmb290JyAtLS0gZm9yIGRlbW8gcHVycG9zZXMsIHRoaXMgcHJvcCBiZWluZyBzZXQgaW4gc2V0U3RhdGUuanMgKHNlZSlcbiAgICB9KTtcblxuICAgIHZhciBncmlkT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGRhdGE6IHBlb3BsZTEsXG4gICAgICAgICAgICBtYXJnaW46IHsgYm90dG9tOiAnMTdweCcsIHJpZ2h0OiAnMTdweCd9LFxuICAgICAgICAgICAgc2NoZW1hOiBzY2hlbWEsXG4gICAgICAgICAgICBwbHVnaW5zOiByZXF1aXJlKCdmaW4taHlwZXJncmlkLWV2ZW50LWxvZ2dlcicpLFxuICAgICAgICAgICAgLy8gY2FudmFzQ29udGV4dEF0dHJpYnV0ZXM6IHsgYWxwaGE6IGZhbHNlIH0sXG4gICAgICAgICAgICBzdGF0ZTogeyBjb2xvcjogJ29yYW5nZScgfVxuICAgICAgICB9LFxuICAgICAgICBncmlkID0gbmV3IEh5cGVyZ3JpZCgnZGl2I2pzb24tZXhhbXBsZScsIGdyaWRPcHRpb25zKSxcbiAgICAgICAgYmVoYXZpb3IgPSBncmlkLmJlaGF2aW9yLFxuICAgICAgICBkYXRhTW9kZWwgPSBiZWhhdmlvci5kYXRhTW9kZWwsXG4gICAgICAgIGlkeCA9IGJlaGF2aW9yLmNvbHVtbkVudW07XG5cbiAgICB3aW5kb3cuZyA9IHdpbmRvdy5ncmlkID0gZ3JpZDtcbiAgICB3aW5kb3cucCA9IGdyaWQucHJvcGVydGllcztcbiAgICB3aW5kb3cuYiA9IGJlaGF2aW9yO1xuICAgIHdpbmRvdy5tID0gZGF0YU1vZGVsO1xuXG4gICAgY29uc29sZS5sb2coJ0ZpZWxkczonKTsgIGNvbnNvbGUuZGlyKGJlaGF2aW9yLmRhdGFNb2RlbC5zY2hlbWEubWFwKGZ1bmN0aW9uKGNzKSB7IHJldHVybiBjcy5uYW1lOyB9KSk7XG4gICAgY29uc29sZS5sb2coJ0hlYWRlcnM6Jyk7IGNvbnNvbGUuZGlyKGJlaGF2aW9yLmRhdGFNb2RlbC5zY2hlbWEubWFwKGZ1bmN0aW9uKGNzKSB7IHJldHVybiBjcy5oZWFkZXI7IH0pKTtcbiAgICBjb25zb2xlLmxvZygnSW5kZXhlczonKTsgY29uc29sZS5kaXIoaWR4KTtcblxuICAgIGZ1bmN0aW9uIHNldERhdGEoZGF0YSwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG4gICAgICAgIG9wdGlvbnMuc2NoZW1hID0gb3B0aW9ucy5zY2hlbWEgfHwgW107XG4gICAgICAgIGdyaWQuc2V0RGF0YShkYXRhLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgZ3JpZC5yZXNldCgpO1xuICAgICAgICBpbml0RXZlbnRzKGRlbW8sIGdyaWQpO1xuICAgIH1cblxuICAgIHZhciBvbGREYXRhO1xuICAgIGZ1bmN0aW9uIHRvZ2dsZUVtcHR5RGF0YSgpIHtcbiAgICAgICAgaWYgKCFvbGREYXRhKSB7XG4gICAgICAgICAgICBvbGREYXRhID0ge1xuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFNb2RlbC5nZXREYXRhKCksXG4gICAgICAgICAgICAgICAgc2NoZW1hOiBkYXRhTW9kZWwuc2NoZW1hLFxuICAgICAgICAgICAgICAgIGFjdGl2ZUNvbHVtbnM6IGJlaGF2aW9yLmdldEFjdGl2ZUNvbHVtbnMoKS5tYXAoZnVuY3Rpb24oY29sdW1uKSB7IHJldHVybiBjb2x1bW4uaW5kZXg7IH0pXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy9pbXBvcnRhbnQgdG8gc2V0IHRvcCB0b3RhbHMgZmlyc3RcbiAgICAgICAgICAgIHNldERhdGEoW10pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9pbXBvcnRhbnQgdG8gc2V0IHRvcCB0b3RhbHMgZmlyc3RcbiAgICAgICAgICAgIHNldERhdGEob2xkRGF0YS5kYXRhLCBvbGREYXRhLnNjaGVtYSk7XG4gICAgICAgICAgICBiZWhhdmlvci5zZXRDb2x1bW5JbmRleGVzKG9sZERhdGEuYWN0aXZlQ29sdW1ucyk7XG4gICAgICAgICAgICBvbGREYXRhID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzZXREYXRhKCkge1xuICAgICAgICBzZXREYXRhKHBlb3BsZTEpO1xuICAgICAgICBpbml0U3RhdGUoZGVtbywgZ3JpZCk7XG4gICAgfVxuXG4gICAgaW5pdENlbGxSZW5kZXJlcnMoZGVtbywgZ3JpZCk7XG4gICAgaW5pdEZvcm1hdHRlcnMoZGVtbywgZ3JpZCk7XG4gICAgaW5pdENlbGxFZGl0b3JzKGRlbW8sIGdyaWQpO1xuICAgIGluaXRFdmVudHMoZGVtbywgZ3JpZCk7XG4gICAgaW5pdERhc2hib2FyZChkZW1vLCBncmlkKTtcbiAgICBpbml0U3RhdGUoZGVtbywgZ3JpZCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIHZhciBpZHggPSBncmlkLmJlaGF2aW9yLmNvbHVtbkVudW07XG5cbiAgICB2YXIgc3RhdGUgPSB7XG4gICAgICAgIGNvbHVtbkluZGV4ZXM6IFtcbiAgICAgICAgICAgIGlkeC5sYXN0TmFtZSxcbiAgICAgICAgICAgIGlkeC50b3RhbE51bWJlck9mUGV0c093bmVkLFxuICAgICAgICAgICAgaWR4LmhlaWdodCxcbiAgICAgICAgICAgIGlkeC5iaXJ0aERhdGUsXG4gICAgICAgICAgICBpZHguYmlydGhUaW1lLFxuICAgICAgICAgICAgaWR4LmJpcnRoU3RhdGUsXG4gICAgICAgICAgICAvLyBpZHgucmVzaWRlbmNlU3RhdGUsXG4gICAgICAgICAgICBpZHguZW1wbG95ZWQsXG4gICAgICAgICAgICAvLyBpZHguZmlyc3ROYW1lLFxuICAgICAgICAgICAgaWR4LmluY29tZSxcbiAgICAgICAgICAgIGlkeC50cmF2ZWwsXG4gICAgICAgICAgICAvLyBpZHguc3F1YXJlT2ZJbmNvbWVcbiAgICAgICAgXSxcblxuICAgICAgICBub0RhdGFNZXNzYWdlOiAnTm8gRGF0YSB0byBEaXNwbGF5JyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnd2hpdGUnLFxuICAgICAgICBmb250OiAnbm9ybWFsIHNtYWxsIGdhcmFtb25kJyxcbiAgICAgICAgcm93U3RyaXBlczogW1xuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgeyBjb2xvcjogJyMxMTY2MTEnLCBiYWNrZ3JvdW5kQ29sb3I6ICcjZThmZmU4JywgZm9udDogJ2l0YWxpYyBzbWFsbCBnYXJhbW9uZCcgfSxcbiAgICAgICAgICAgIHsgY29sb3I6ICcjMTE2NjExJywgYmFja2dyb3VuZENvbG9yOiAnI2U4ZmZlOCcsIGZvbnQ6ICdpdGFsaWMgc21hbGwgZ2FyYW1vbmQnIH0sXG4gICAgICAgICAgICB7IGNvbG9yOiAnIzExNjYxMScsIGJhY2tncm91bmRDb2xvcjogJyNlOGZmZTgnLCBmb250OiAnaXRhbGljIHNtYWxsIGdhcmFtb25kJyB9XG4gICAgICAgIF0sXG5cbiAgICAgICAgZml4ZWRDb2x1bW5Db3VudDogMSxcbiAgICAgICAgZml4ZWRSb3dDb3VudDogNCxcblxuICAgICAgICBjb2x1bW5BdXRvc2l6aW5nOiBmYWxzZSxcbiAgICAgICAgaGVhZGVyVGV4dFdyYXBwaW5nOiB0cnVlLFxuXG4gICAgICAgIGhhbGlnbjogJ2xlZnQnLFxuICAgICAgICByZW5kZXJGYWxzeTogdHJ1ZSxcblxuICAgICAgICBzY3JvbGxiYXJIb3Zlck9mZjogJ3Zpc2libGUnLFxuICAgICAgICBzY3JvbGxiYXJIb3Zlck92ZXI6ICd2aXNpYmxlJyxcbiAgICAgICAgY29sdW1uSGVhZGVyQmFja2dyb3VuZENvbG9yOiAncGluaycsXG5cbiAgICAgICAgY2hlY2tib3hPbmx5Um93U2VsZWN0aW9uczogdHJ1ZSxcblxuICAgICAgICByb3dzOiB7XG4gICAgICAgICAgICBoZWFkZXI6IHtcbiAgICAgICAgICAgICAgICAwOiB7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogNDBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsY3VsYXRvcnM6IHtcbiAgICAgICAgICAgIEFkZDEwOiAnZnVuY3Rpb24oZGF0YVJvdyxjb2x1bW5OYW1lKSB7IHJldHVybiBkYXRhUm93W2NvbHVtbk5hbWVdICsgMTA7IH0nXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gQU5USS1QQVRURVJOUyBGT0xMT1dcbiAgICAgICAgLy9cbiAgICAgICAgLy8gU2V0dGluZyBjb2x1bW4sIHJvdywgY2VsbCBwcm9wcyBoZXJlIGluIGEgc3RhdGUgb2JqZWN0IGlzIGEgbGVnYWN5IGZlYXR1cmUuXG4gICAgICAgIC8vIERldmVsb3BlcnMgbWF5IGZpbmQgaXQgbW9yZSB1c2VmdWwgdG8gc2V0IGNvbHVtbiBwcm9wcyBpbiBjb2x1bW4gc2NoZW1hIChhcyBvZiB2Mi4xLjYpLFxuICAgICAgICAvLyByb3cgcHJvcHMgaW4gcm93IG1ldGFkYXRhIChhcyBvZiB2Mi4xLjApLCBhbmQgY2VsbCBwcm9wcyBpbiBjb2x1bW4gbWV0YWRhdGEgKGFzIG9mIHYyLjAuMiksXG4gICAgICAgIC8vIHdoaWNoIHdvdWxkIHRoZW4gcGVyc2lzdCBhY3Jvc3Mgc2V0U3RhdGUgY2FsbHMgd2hpY2ggY2xlYXIgdGhlc2UgcHJvcGVydGllcyBvYmplY3RzXG4gICAgICAgIC8vIGJlZm9yZSBhcHBseWluZyBuZXcgdmFsdWVzLiBJbiB0aGlzIGRlbW8sIHdlIGhhdmUgY2hhbmdlZCB0aGUgc2V0U3RhdGUgY2FsbCBiZWxvdyB0byBhZGRTdGF0ZVxuICAgICAgICAvLyAod2hpY2ggZG9lcyBub3QgY2xlYXIgdGhlIHByb3BlcnRpZXMgb2JqZWN0IGZpcnN0KSB0byBzaG93IGhvdyB0byBzZXQgYSBjb2x1bW4gcHJvcCBoZXJlICphbmQqXG4gICAgICAgIC8vIGEgZGlmZmVyZW50IHByb3Agb24gdGhlIHNhbWUgY29sdW1uIGluIHNjaGVtYSAoaW4gaW5kZXguanMpLlxuXG4gICAgICAgIGNvbHVtbnM6IHtcbiAgICAgICAgICAgIGhlaWdodDoge1xuICAgICAgICAgICAgICAgIC8vIGhhbGlnbjogJ3JpZ2h0JywgLS0tIGZvciBkZW1vIHB1cnBvc2VzLCB0aGlzIHByb3AgYmVpbmcgc2V0IGluIGluZGV4LmpzIChzZWUpXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnZm9vdCdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuICAgICAgICAgICAgbGFzdF9uYW1lOiB7XG4gICAgICAgICAgICAgICAgY29sdW1uSGVhZGVyQmFja2dyb3VuZENvbG9yOiAnIzE0MkI2RicsIC8vZGFyayBibHVlXG4gICAgICAgICAgICAgICAgY29sdW1uSGVhZGVyQ29sb3I6ICd3aGl0ZScsXG4gICAgICAgICAgICAgICAgY29sdW1uSGVhZGVySGFsaWduOiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgcmlnaHRJY29uOiAnZG93bi1yZWN0YW5nbGUnLFxuICAgICAgICAgICAgICAgIGxpbms6IHRydWVcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZpcnN0X25hbWU6IHtcblxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdG90YWxfbnVtYmVyX29mX3BldHNfb3duZWQ6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdjZW50ZXInLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgY2FsY3VsYXRvcjogJ0FkZDEwJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogJ2dyZWVuJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYmlydGhEYXRlOiB7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnc2luZ2RhdGUnLFxuICAgICAgICAgICAgICAgIHJpZ2h0SWNvbjogJ2NhbGVuZGFyJyxcbiAgICAgICAgICAgICAgICAvL3N0cmlrZVRocm91Z2g6IHRydWVcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGJpcnRoVGltZToge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICBlZGl0b3I6ICd0aW1lJyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdjbG9jazEyJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYmlydGhTdGF0ZToge1xuICAgICAgICAgICAgICAgIGVkaXRvcjogJ2NvbG9ydGV4dCcsXG4gICAgICAgICAgICAgICAgcmlnaHRJY29uOiAnZG93bi1yZWN0YW5nbGUnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZXNpZGVuY2VTdGF0ZToge1xuICAgICAgICAgICAgICAgIHJpZ2h0SWNvbjogJ2Rvd24tcmVjdGFuZ2xlJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZW1wbG95ZWQ6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgcmVuZGVyZXI6ICdidXR0b24nLFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3doaXRlJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgaW5jb21lOiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3BvdW5kcydcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHRyYXZlbDoge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdmcmFuY3MnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gRm9sbG93aW5nIGBjZWxsc2AgZXhhbXBsZSBzZXRzIHByb3BlcnRpZXMgZm9yIGEgY2VsbCBpbiB0aGUgZGF0YSBzdWJncmlkLlxuICAgICAgICAvLyBTcGVjaWZ5aW5nIGNlbGwgcHJvcGVydGllcyBoZXJlIGluIGdyaWQgc3RhdGUgbWF5IGJlIHVzZWZ1bCBmb3Igc3RhdGljIGRhdGEgc3ViZ3JpZHNcbiAgICAgICAgLy8gd2hlcmUgY2VsbCBjb29yZGluYXRlcyBhcmUgcGVybWFuZW50bHkgYXNzaWduZWQuIE90aGVyd2lzZSwgZm9yIG15IGR5bmFtaWMgZ3JpZCBkYXRhLFxuICAgICAgICAvLyBjZWxsIHByb3BlcnRpZXMgbWlnaHQgbW9yZSBwcm9wZXJseSBhY2NvbXBhbnkgdGhlIGRhdGEgaXRzZWxmIGFzIG1ldGFkYXRhXG4gICAgICAgIC8vIChpLmUuLCBhcyBhIGhhc2ggaW4gZGF0YVJvdy5fX01FVEFbZmllbGROYW1lXSkuXG4gICAgICAgIGNlbGxzOiB7XG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgMTY6IHtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250OiAnMTBwdCBUYWhvbWEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICdsaWdodGJsdWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAncmVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGlnbjogJ2xlZnQnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ3JpZC5hZGRTdGF0ZShzdGF0ZSk7IC8vIGNoYW5nZWQgZnJvbSBzZXRTdGF0ZSBzbyAnaGVpZ2h0JyBwcm9wcyBzZXQgd2l0aCBzY2hlbWEgaW4gaW5kZXguanMgd291bGRuJ3QgYmUgY2xlYXJlZFxuXG4gICAgZ3JpZC50YWtlRm9jdXMoKTtcblxuICAgIGRlbW8ucmVzZXREYXNoYm9hcmQoKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjYXRhbG9nID0gcmVxdWlyZSgnb2JqZWN0LWNhdGFsb2cnKTtcbnZhciBmaW5kID0gcmVxdWlyZSgnbWF0Y2gtcG9pbnQnKTtcbnZhciBHcmV5bGlzdCA9IHJlcXVpcmUoJ2dyZXlsaXN0Jyk7XG5cblxudmFyIGlzRE9NID0gKFxuICAgIHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnICYmXG4gICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHdpbmRvdykgPT09ICdbb2JqZWN0IFdpbmRvd10nICYmXG4gICAgdHlwZW9mIHdpbmRvdy5Ob2RlID09PSAnZnVuY3Rpb24nXG4pO1xuXG52YXIgaXNEb21Ob2RlID0gaXNET00gPyBmdW5jdGlvbihvYmopIHsgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIHdpbmRvdy5Ob2RlIH0gOiBmdW5jdGlvbigpIHt9O1xuXG5cbi8qKlxuICogQHN1bW1hcnkgU2VhcmNoIGFuIG9iamVjdCdzIGNvZGUgZm9yIHBhdHRlcm4gbWF0Y2hlcy5cbiAqIEBkZXNjIFNlYXJjaGVzIGFsbCBjb2RlIGluIHRoZSB2aXNpYmxlIGV4ZWN1dGlvbiBjb250ZXh0IHVzaW5nIHRoZSBwcm92aWRlZCByZWdleCBwYXR0ZXJuLCByZXR1cm5pbmcgdGhlIGVudGlyZSBwYXR0ZXJuIG1hdGNoLlxuICpcbiAqIElmIGNhcHR1cmUgZ3JvdXBzIGFyZSBzcGVjaWZpZWQgaW4gdGhlIHBhdHRlcm4sIHJldHVybnMgdGhlIGxhc3QgY2FwdHVyZSBncm91cCBtYXRjaCwgdW5sZXNzIGBvcHRpb25zLmNhcHR1cmVHcm91cGAgaXMgZGVmaW5lZCwgaW4gd2hpY2ggY2FzZSByZXR1cm5zIHRoZSBncm91cCB3aXRoIHRoYXQgaW5kZXggd2hlcmUgYDBgIG1lYW5zIHRoZSBlbnRpcmUgcGF0dGVybiwgX2V0Yy5fIChwZXIgYFN0cmluZy5wcm90b3R5cGUubWF0Y2hgKS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB9IHBhdHRlcm4gLSBTZWFyY2ggYXJndW1lbnQuXG4gKiBEb24ndCB1c2UgZ2xvYmFsIGZsYWcgb24gUmVnRXhwOyBpdCdzIHVubmVjZXNzYXJ5IGFuZCBzdXBwcmVzc2VzIHN1Ym1hdGNoZXMgb2YgY2FwdHVyZSBncm91cHMuXG4gKlxuICogQHBhcmFtIFtvcHRpb25zXVxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLmNhcHR1cmVHcm91cF0gLSBJZmYgZGVmaW5lZCwgaW5kZXggb2YgYSBzcGVjaWZpYyBjYXB0dXJlIGdyb3VwIHRvIHJldHVybiBmb3IgZWFjaCBtYXRjaC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmVjdXJzZV0gLSBFcXVpdmFsZW50IHRvIHNldHRpbmcgYm90aCBgcmVjdXJzZU93bmAgYW5kIGByZWN1cnNlQW5jZXN0b3JzYC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmVjdXJzZU93bl0gLSBSZWN1cnNlIG93biBzdWJvYmplY3RzLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yZWN1cnNlQW5jZXN0b3JzXSAtIFJlY3Vyc2Ugc3Vib2JqZWN0cyBvZiBvYmplY3RzIG9mIHRoZSBlbnRpcmUgcHJvdG90eXBlIGNoYWluLlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLmdyZXlsaXN0XSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvZ3JleWxpc3RcbiAqIEBwYXJhbSBbb3B0aW9ucy5ncmV5bGlzdC53aGl0ZV0gLSBJZiBnaXZlbiwgb25seSBsaXN0ZWQgbWF0Y2hlcyBhcmUgaW5jbHVkZWQgaW4gdGhlIHJlc3VsdHMuXG4gKiBAcGFyYW0gW29wdGlvbnMuZ3JleWxpc3QuYmxhY2tdIC0gSWYgZ2l2ZW4sIGxpc3RlZCBtYXRjaGVzIGFyZSBleGNsdWRlZCBmcm9tIHRoZSByZXN1bHRzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5jYXRhbG9nXSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvb2JqZWN0LWNhdGFsb2dcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuY2F0YWxvZy5vd25dIC0gT25seSBzZWFyY2ggb3duIG9iamVjdDsgb3RoZXJ3aXNlIHNlYXJjaCBvd24gKyBlbnRpcmUgcHJvdG90eXBlIGNoYWluLlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLmNhdGFsb2cuZ3JleWxpc3RdIC0gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC9ncmV5bGlzdFxuICogQHBhcmFtIFtvcHRpb25zLmNhdGFsb2cuZ3JleWxpc3Qud2hpdGVdIC0gSWYgZ2l2ZW4sIG9ubHkgbGlzdGVkIG1lbWJlcnMgYXJlIGNhdGFsb2dlZC5cbiAqIEBwYXJhbSBbb3B0aW9ucy5jYXRhbG9nLmdyZXlsaXN0LmJsYWNrXSAtIElmIGdpdmVuLCBsaXN0ZWQgbWVtYmVycyBhcmUgKm5vdCogY2F0YWxvZ2VkLlxuICpcbiAqIEByZXR1cm5zIHtzdHJpbmdbXX0gUGF0dGVybiBtYXRjaGVzLlxuICovXG5mdW5jdGlvbiBtYXRjaChwYXR0ZXJuLCBvcHRpb25zLCBieUdyZXlsaXN0LCBtYXRjaGVzLCBzY2FubmVkKSB7XG4gICAgdmFyIHRvcExldmVsQ2FsbCA9ICFtYXRjaGVzO1xuXG4gICAgaWYgKHRvcExldmVsQ2FsbCkge1xuICAgICAgICAvLyB0aGlzIGlzIHRoZSB0b3AtbGV2ZWwgKG5vbi1yZWN1cnNlZCkgY2FsbCBzbyBpbnRpYWxpemU6XG4gICAgICAgIHZhciBncmV5bGlzdCA9IG5ldyBHcmV5bGlzdChvcHRpb25zICYmIG9wdGlvbnMuZ3JleWxpc3QpO1xuICAgICAgICBieUdyZXlsaXN0ID0gZ3JleWxpc3QudGVzdC5iaW5kKGdyZXlsaXN0KTtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIG1hdGNoZXMgPSBbXTtcbiAgICAgICAgc2Nhbm5lZCA9IFtdO1xuICAgIH1cblxuICAgIHZhciByb290ID0gdGhpcztcbiAgICB2YXIgbWVtYmVycyA9IGNhdGFsb2cuY2FsbChyb290LCBvcHRpb25zLmNhdGFsb2cpO1xuXG4gICAgc2Nhbm5lZC5wdXNoKHJvb3QpO1xuXG4gICAgT2JqZWN0LmtleXMobWVtYmVycykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHZhciBvYmogPSBtZW1iZXJzW2tleV07XG4gICAgICAgIHZhciBkZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSk7XG5cbiAgICAgICAgaWYgKGRlc2NyaXB0b3IudmFsdWUgPT09IG1hdGNoKSB7XG4gICAgICAgICAgICByZXR1cm47IC8vIGRvbid0IGNhdGFsb2cgc2VsZiB3aGVuIGZvdW5kIHRvIGhhdmUgYmVlbiBtaXhlZCBpblxuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmtleXMoZGVzY3JpcHRvcikuZm9yRWFjaChmdW5jdGlvbiAocHJvcE5hbWUpIHtcbiAgICAgICAgICAgIHZhciBoaXRzLCBwcm9wID0gZGVzY3JpcHRvcltwcm9wTmFtZV07XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcHJvcCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIC8vIHByb3BOYW1lIG11c3QgYmUgYGdldGAgb3IgYHNldGAgb3IgYHZhbHVlYFxuICAgICAgICAgICAgICAgIGhpdHMgPSBmaW5kKHByb3AudG9TdHJpbmcoKSwgcGF0dGVybiwgb3B0aW9ucy5jYXB0dXJlR3JvdXApLmZpbHRlcihieUdyZXlsaXN0KTtcbiAgICAgICAgICAgICAgICBoaXRzLmZvckVhY2goZnVuY3Rpb24oaGl0KSB7IG1hdGNoZXMucHVzaChoaXQpOyB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgKG9wdGlvbnMucmVjdXJzZSB8fCBvcHRpb25zLnJlY3Vyc2VPd24gJiYgb2JqID09PSByb290IHx8IG9wdGlvbnMucmVjdXJzZUNoYWluICYmIG9iaiAhPT0gcm9vdCkgJiZcbiAgICAgICAgICAgICAgICB0eXBlb2YgcHJvcCA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICAgICAgICAhaXNEb21Ob2RlKHByb3ApICYmIC8vIGRvbid0IHNlYXJjaCBET00gb2JqZWN0c1xuICAgICAgICAgICAgICAgIHNjYW5uZWQuaW5kZXhPZihwcm9wKSA8IDAgLy8gZG9uJ3QgcmVjdXJzZSBvbiBvYmplY3RzIGFscmVhZHkgc2Nhbm5lZFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvcE5hbWUgbXVzdCBiZSBgdmFsdWVgXG4gICAgICAgICAgICAgICAgbWF0Y2guY2FsbChwcm9wLCBwYXR0ZXJuLCBvcHRpb25zLCBieUdyZXlsaXN0LCBtYXRjaGVzLCBzY2FubmVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAodG9wTGV2ZWxDYWxsKSB7XG4gICAgICAgIG1hdGNoZXMuc29ydCgpO1xuICAgIH1cblxuICAgIHJldHVybiBtYXRjaGVzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGNoOyIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gbG9nRXZlbnRPYmplY3QoZSkge1xuICAgIHRoaXMubG9nKGUudHlwZSwgJzo6JywgZSk7XG59XG5cbmZ1bmN0aW9uIGxvZ0RldGFpbChlKSB7XG4gICAgdGhpcy5sb2coZS50eXBlLCAnOjonLCBlLmRldGFpbCk7XG59XG5cbmZ1bmN0aW9uIGxvZ1Njcm9sbChlKSB7XG4gICAgdGhpcy5sb2coZS50eXBlLCAnOjonLCBlLmRldGFpbC52YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGxvZ0NlbGwoZSkge1xuICAgIHZhciBnQ2VsbCA9IGUuZGV0YWlsLmdyaWRDZWxsO1xuICAgIHZhciBkQ2VsbCA9IGUuZGV0YWlsLmRhdGFDZWxsO1xuICAgIHRoaXMubG9nKGUudHlwZSwgJzo6JyxcbiAgICAgICAgJ2dyaWQtY2VsbDonLCB7IHg6IGdDZWxsLngsIHk6IGdDZWxsLnkgfSxcbiAgICAgICAgJ2RhdGEtY2VsbDonLCB7IHg6IGRDZWxsLngsIHk6IGRDZWxsLnkgfSk7XG59XG5cbmZ1bmN0aW9uIGxvZ1NlbGVjdGlvbihlKSB7XG4gICAgdGhpcy5sb2coZS50eXBlLCAnOjonLCBlLmRldGFpbC5yb3dzLCBlLmRldGFpbC5jb2x1bW5zLCBlLmRldGFpbC5zZWxlY3Rpb25zKTtcbn1cblxuZnVuY3Rpb24gbG9nUm93KGUpIHtcbiAgICB2YXIgcm93Q29udGV4dCA9IGUuZGV0YWlsLnByaW1pdGl2ZUV2ZW50LmRhdGFSb3c7XG4gICAgdGhpcy5sb2coZS50eXBlLCAnOjonLCAncm93LWNvbnRleHQ6Jywgcm93Q29udGV4dCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdmaW4tY2VsbC1lbnRlcic6IGxvZ0NlbGwsXG4gICAgJ2Zpbi1jbGljayc6IGxvZ0NlbGwsXG4gICAgJ2Zpbi1kb3VibGUtY2xpY2snOiBsb2dSb3csXG4gICAgJ2Zpbi1zZWxlY3Rpb24tY2hhbmdlZCc6IGxvZ1NlbGVjdGlvbixcbiAgICAnZmluLWNvbnRleHQtbWVudSc6IGxvZ0NlbGwsXG5cbiAgICAnZmluLXNjcm9sbC14JzogbG9nU2Nyb2xsLFxuICAgICdmaW4tc2Nyb2xsLXknOiBsb2dTY3JvbGwsXG5cbiAgICAnZmluLXJvdy1zZWxlY3Rpb24tY2hhbmdlZCc6IGxvZ0RldGFpbCxcbiAgICAnZmluLWNvbHVtbi1zZWxlY3Rpb24tY2hhbmdlZCc6IGxvZ0RldGFpbCxcbiAgICAnZmluLWVkaXRvci1kYXRhLWNoYW5nZSc6IGxvZ0RldGFpbCxcbiAgICAnZmluLWVkaXRvci1rZXl1cCc6IGxvZ0RldGFpbCxcbiAgICAnZmluLWVkaXRvci1rZXlwcmVzcyc6IGxvZ0RldGFpbCxcbiAgICAnZmluLWVkaXRvci1rZXlkb3duJzogbG9nRGV0YWlsLFxuICAgICdmaW4tZ3JvdXBzLWNoYW5nZWQnOiBsb2dEZXRhaWwsXG5cbiAgICAnZmluLWZpbHRlci1hcHBsaWVkJzogbG9nRXZlbnRPYmplY3QsXG4gICAgJ2Zpbi1yZXF1ZXN0LWNlbGwtZWRpdCc6IGxvZ0V2ZW50T2JqZWN0LFxuICAgICdmaW4tYmVmb3JlLWNlbGwtZWRpdCc6IGxvZ0V2ZW50T2JqZWN0LFxuICAgICdmaW4tYWZ0ZXItY2VsbC1lZGl0JzogbG9nRXZlbnRPYmplY3Rcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBTdGFyTG9nID0gcmVxdWlyZSgnc3RhcmxvZycpO1xuXG52YXIgZXZlbnRMb2dnZXJQbHVnaW4gPSB7XG5cbiAgICBzdGFydDogZnVuY3Rpb24ob3B0aW9ucylcbiAgICB7XG4gICAgICAgIGlmIChvcHRpb25zICYmIHRoaXMuc3RhcmxvZykge1xuICAgICAgICAgICAgdGhpcy5zdGFybG9nLnN0b3AoKTsgLy8gc3RvcCB0aGUgb2xkIG9uZSBiZWZvcmUgcmVkZWZpbmluZyBpdCB3aXRoIG5ldyBvcHRpb25zIG9iamVjdFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnN0YXJsb2cgfHwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICAvLyBzZWFyY2ggZ3JpZCBvYmplY3QgZm9yIFwiRXZlbnQoJ3lhZGEteWFkYSdcIiBvciBcIkV2ZW50LmNhbGwodGhpcywgJ3lhZGEteWFkYSdcIlxuICAgICAgICAgICAgb3B0aW9ucy5zZWxlY3QgPSBvcHRpb25zLnNlbGVjdCB8fCB0aGlzO1xuICAgICAgICAgICAgb3B0aW9ucy5wYXR0ZXJuID0gb3B0aW9ucy5wYXR0ZXJuIHx8IC9FdmVudChcXC5jYWxsXFwodGhpcywgfFxcKCknKGZpbi1bYS16LV0rKScvO1xuICAgICAgICAgICAgb3B0aW9ucy50YXJnZXRzID0gb3B0aW9ucy50YXJnZXRzIHx8IHRoaXMuY2FudmFzLmNhbnZhcztcblxuICAgICAgICAgICAgLy8gbWl4IG9wdGlvbnMubGlzdGVuZXJEaWN0aW9uYXJ5IG9uIHRvcCBvZiBzb21lIGN1c3RvbSBsaXN0ZW5lcnNcbiAgICAgICAgICAgIG9wdGlvbnMubGlzdGVuZXJEaWN0aW9uYXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcmVxdWlyZSgnLi9jdXN0b20tbGlzdGVuZXJzJyksIG9wdGlvbnMubGlzdGVuZXJEaWN0aW9uYXJ5KTtcblxuICAgICAgICAgICAgLy8gbWl4IGZpbi10aWNrIG9uIHRvcCBvZiBvcHRpb25zLm1hdGNoLmdyZXlsaXN0LmJsYWNrXG4gICAgICAgICAgICB2YXIgYmxhY2sgPSBbJ2Zpbi10aWNrJ107XG4gICAgICAgICAgICBvcHRpb25zLm1hdGNoID0gb3B0aW9ucy5tYXRjaCB8fCB7fTtcbiAgICAgICAgICAgIG9wdGlvbnMubWF0Y2guZ3JleWxpc3QgPSBvcHRpb25zLm1hdGNoLmdyZXlsaXN0IHx8IHt9O1xuICAgICAgICAgICAgb3B0aW9ucy5tYXRjaC5ncmV5bGlzdC5ibGFjayA9IG9wdGlvbnMubWF0Y2guZ3JleWxpc3QuYmxhY2sgPyBibGFjay5jb25jYXQob3B0aW9ucy5tYXRjaC5ncmV5bGlzdC5ibGFjaykgOiBibGFjaztcblxuICAgICAgICAgICAgdGhpcy5zdGFybG9nID0gbmV3IFN0YXJMb2cob3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXJsb2cuc3RhcnQoKTtcbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc3RhcmxvZy5zdG9wKCk7XG4gICAgfVxuXG59O1xuXG4vLyBOb24tZW51bWVyYWJsZSBtZXRob2RzIGFyZSBub3QgdGhlbXNlbHZlcyBpbnN0YWxsZWQ6XG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhldmVudExvZ2dlclBsdWdpbiwge1xuICAgIHByZWluc3RhbGw6IHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uKEh5cGVyZ3JpZFByb3RvdHlwZSwgQmVoYXZpb3JQcm90b3R5cGUsIG1ldGhvZFByZWZpeCkge1xuICAgICAgICAgICAgaW5zdGFsbC5jYWxsKHRoaXMsIEh5cGVyZ3JpZFByb3RvdHlwZSwgbWV0aG9kUHJlZml4KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbnN0YWxsOiB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbihncmlkLCBtZXRob2RQcmVmaXgpIHtcbiAgICAgICAgICAgIGluc3RhbGwuY2FsbCh0aGlzLCBncmlkLCBtZXRob2RQcmVmaXgpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbmZ1bmN0aW9uIGluc3RhbGwodGFyZ2V0LCBtZXRob2RQcmVmaXgpIHtcbiAgICBpZiAobWV0aG9kUHJlZml4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbWV0aG9kUHJlZml4ID0gJ2xvZyc7XG4gICAgfVxuICAgIE9iamVjdC5rZXlzKHRoaXMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB0YXJnZXRbcHJlZml4KG1ldGhvZFByZWZpeCwga2V5KV0gPSB0aGlzW2tleV07XG4gICAgfSwgdGhpcyk7XG59XG5cbmZ1bmN0aW9uIHByZWZpeChwcmVmaXgsIG5hbWUpIHtcbiAgICB2YXIgY2FwaXRhbGl6ZSA9IHByZWZpeC5sZW5ndGggJiYgcHJlZml4W3ByZWZpeC5sZW5ndGggLSAxXSAhPT0gJ18nO1xuICAgIGlmIChjYXBpdGFsaXplKSB7XG4gICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigwLCAxKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zdWJzdHIoMSk7XG4gICAgfVxuICAgIHJldHVybiBwcmVmaXggKyBuYW1lO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50TG9nZ2VyUGx1Z2luO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiogQ3JlYXRlcyBhbiBvYmplY3Qgd2l0aCBhIGB0ZXN0YCBtZXRob2QgZnJvbSBvcHRpb25hbCB3aGl0ZWxpc3QgYW5kL29yIGJsYWNrbGlzdFxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdIC0gSWYgbmVpdGhlciBgd2hpdGVgIG5vciBgYmxhY2tgIGFyZSBnaXZlbiwgYWxsIHN0cmluZ3MgcGFzcyBgdGVzdGAuXG4gKiBAcGFyYW0gW29wdGlvbnMud2hpdGVdIC0gSWYgZ2l2ZW4sIG9ubHkgbGlzdGVkIHN0cmluZ3MgcGFzcyBgdGVzdGAuXG4gKiBAcGFyYW0gW29wdGlvbnMuYmxhY2tdIC0gSWYgZ2l2ZW4sIGxpc3RlZCBzdHJpbmdzIGZhaWwgYHRlc3RgLlxuICovXG5mdW5jdGlvbiBHcmV5TGlzdChvcHRpb25zKSB7XG4gICAgdGhpcy53aGl0ZSA9IGdldEZsYXRBcnJheU9mUmVnZXhBbmRPclN0cmluZyhvcHRpb25zICYmIG9wdGlvbnMud2hpdGUpO1xuICAgIHRoaXMuYmxhY2sgPSBnZXRGbGF0QXJyYXlPZlJlZ2V4QW5kT3JTdHJpbmcob3B0aW9ucyAmJiBvcHRpb25zLmJsYWNrKTtcbn1cblxuR3JleUxpc3QucHJvdG90eXBlLnRlc3QgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICB0aGlzLnN0cmluZyA9IHN0cmluZzsgLy8gZm9yIG1hdGNoKCkgdXNlXG4gICAgcmV0dXJuIChcbiAgICAgICAgISh0aGlzLndoaXRlICYmICF0aGlzLndoaXRlLnNvbWUobWF0Y2gsIHRoaXMpKSAmJlxuICAgICAgICAhKHRoaXMuYmxhY2sgJiYgdGhpcy5ibGFjay5zb21lKG1hdGNoLCB0aGlzKSlcbiAgICApO1xufTtcblxuZnVuY3Rpb24gbWF0Y2gocGF0dGVybikge1xuICAgIHJldHVybiB0eXBlb2YgcGF0dGVybi50ZXN0ID09PSAnZnVuY3Rpb24nXG4gICAgICAgID8gcGF0dGVybi50ZXN0KHRoaXMuc3RyaW5nKSAvLyB0eXBpY2FsbHkgYSByZWdleCBidXQgY291bGQgYmUgYW55dGhpbmcgdGhhdCBpbXBsZW1lbnRzIGB0ZXN0YFxuICAgICAgICA6IHRoaXMuc3RyaW5nID09PSBwYXR0ZXJuICsgJyc7IC8vIGNvbnZlcnQgcGF0dGVybiB0byBzdHJpbmcgZXZlbiBmb3IgZWRnZSBjYXNlc1xufVxuXG5mdW5jdGlvbiBnZXRGbGF0QXJyYXlPZlJlZ2V4QW5kT3JTdHJpbmcoYXJyYXksIGZsYXQpIHtcbiAgICBpZiAoIWZsYXQpIHtcbiAgICAgICAgLy8gdGhpcyBpcyB0aGUgdG9wLWxldmVsIChub24tcmVjdXJzZWQpIGNhbGwgc28gaW50aWFsaXplOlxuXG4gICAgICAgIC8vIGB1bmRlZmluZWRgIHBhc3NlcyB0aHJvdWdoIHdpdGhvdXQgYmVpbmcgY29udmVydGVkIHRvIGFuIGFycmF5XG4gICAgICAgIGlmIChhcnJheSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhcnJheWlmeSBnaXZlbiBzY2FsYXIgc3RyaW5nLCByZWdleCwgb3Igb2JqZWN0XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhcnJheSkpIHtcbiAgICAgICAgICAgIGFycmF5ID0gW2FycmF5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGluaXRpYWxpemUgZmxhdFxuICAgICAgICBmbGF0ID0gW107XG4gICAgfVxuXG4gICAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAvLyBtYWtlIHN1cmUgYWxsIGVsZW1lbnRzIGFyZSBlaXRoZXIgc3RyaW5nIG9yIFJlZ0V4cFxuICAgICAgICBzd2l0Y2ggKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpdGVtKSkge1xuICAgICAgICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAgICAgICAgICAgZmxhdC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnW29iamVjdCBPYmplY3RdJzpcbiAgICAgICAgICAgICAgICAvLyByZWN1cnNlIG9uIGNvbXBsZXggaXRlbSAod2hlbiBhbiBvYmplY3Qgb3IgYXJyYXkpXG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnZlcnQgb2JqZWN0IGludG8gYW4gYXJyYXkgKG9mIGl0J3MgZW51bWVyYWJsZSBrZXlzLCBidXQgb25seSB3aGVuIG5vdCB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBPYmplY3Qua2V5cyhpdGVtKS5maWx0ZXIoZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gaXRlbVtrZXldICE9PSB1bmRlZmluZWQ7IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBnZXRGbGF0QXJyYXlPZlJlZ2V4QW5kT3JTdHJpbmcoaXRlbSwgZmxhdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGZsYXQucHVzaChpdGVtICsgJycpOyAvLyBjb252ZXJ0IHRvIHN0cmluZ1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmxhdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcmV5TGlzdDsiLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQHN1bW1hcnkgRmluZCBhbGwgcGF0dGVybiBtYXRjaGVzLCByZXR1cm4gc3BlY2lmaWVkIGNhcHR1cmUgZ3JvdXAgZm9yIGVhY2guXG4gKiBAcmV0dXJucyB7c3RyaW5nW119IEFuIGFycmF5IGNvbnRhaW5pbmcgYWxsIHRoZSBwYXR0ZXJuIG1hdGNoZXMgZm91bmQgaW4gYHN0cmluZ2AuXG4gKiBUaGUgZW50aXJlIHBhdHRlcm4gbWF0Y2ggaXMgcmV0dXJuZWQgdW5sZXNzIHRoZSBwYXR0ZXJuIGNvbnRhaW5zIG9uZSBvciBtb3JlIHN1Ymdyb3VwcyBpbiB3aGljaCBjYXNlIHRoZSBwb3J0aW9uIG9mIHRoZSBwYXR0ZXJuIG1hdGNoZWQgYnkgdGhlIGxhc3Qgc3ViZ3JvdXAgaXMgcmV0dXJuZWQgdW5sZXNzIGBjYXB0dXJlR3JvdXBgIGlzIGRlZmluZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nXG4gKiBAcGFyYW0ge1JlZ0V4cH0gcmVnZXggLSBEb24ndCB1c2UgZ2xvYmFsIGZsYWc7IGl0J3MgdW5uZWNlc3NhcnkgYW5kIHN1cHByZXNzZXMgc3VibWF0Y2hlcyBvZiBjYXB0dXJlIGdyb3Vwcy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbY2FwdHVyZUdyb3VwXSAtIElmZiBkZWZpbmVkLCBpbmRleCBvZiBhIHNwZWNpZmljIGNhcHR1cmUgZ3JvdXAgdG8gcmV0dXJuLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cmluZywgcmVnZXgsIGNhcHR1cmVHcm91cCkge1xuICAgIHZhciBtYXRjaGVzID0gW107XG5cbiAgICBmb3IgKHZhciBtYXRjaCwgaSA9IDA7IChtYXRjaCA9IHN0cmluZy5zdWJzdHIoaSkubWF0Y2gocmVnZXgpKTsgaSArPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobWF0Y2hbY2FwdHVyZUdyb3VwID09PSB1bmRlZmluZWQgPyBtYXRjaC5sZW5ndGggLSAxIDogY2FwdHVyZUdyb3VwXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoZXM7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR3JleWxpc3QgPSByZXF1aXJlKCdncmV5bGlzdCcpO1xuXG4vKiogQHN1bW1hcnkgQ2F0YWxvZyB0aGUgZXhlY3V0aW9uIGNvbnRleHQgb2JqZWN0LlxuICogQHJldHVybnMge29iamVjdH0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgYSBtZW1iZXIgZm9yIGVhY2ggbWVtYmVyIG9mIHRoZSBleGVjdXRpb24gY29udGV4dCBvYmplY3RcbiAqIHZpc2libGUgaW4gdGhlIHByb3RvdHlwZSBjaGFpbiAoYmFjayB0byBidXQgbm90IGluY2x1ZGluZyBPYmplY3QpLCBwZXIgd2hpdGVsaXN0IGFuZCBibGFja2xpc3QuXG4gKiBFYWNoIG1lbWJlcidzIHZhbHVlIGlzIHRoZSBvYmplY3QgaW4gdGhlIHByb3RvdHlwZSBjaGFpbiB3aGVyZSBmb3VuZC5cbiAqIEBwYXJhbSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMub3duXSAtIFJlc3RyaWN0IHNlYXJjaCBmb3IgZXZlbnQgdHlwZSBzdHJpbmdzIHRvIG93biBtZXRob2RzIHJhdGhlciB0aGFuIGVudGlyZSBwcm90b3R5cGUgY2hhaW4uXG4gKiBAcGFyYW0gW29wdGlvbnMuZ3JleWxpc3RdXG4gKiBAcGFyYW0gW29wdGlvbnMuZ3JleWxpc3Qud2hpdGVdIC0gSWYgZ2l2ZW4sIG9ubHkgbGlzdGVkIG1lbWJlcnMgYXJlIGNhdGFsb2dlZC5cbiAqIEBwYXJhbSBbb3B0aW9ucy5ncmV5bGlzdC5ibGFja10gLSBJZiBnaXZlbiwgbGlzdGVkIG1lbWJlcnMgYXJlICpub3QqIGNhdGFsb2dlZC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBvYmplY3RDYXRhbG9nKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHZhciBvYmosXG4gICAgICAgIGNhdGFsb2cgPSBPYmplY3QuY3JlYXRlKG51bGwpLCAvLyBLSVNTIG5vIHByb3RvdHlwZSBuZWVkZWRcbiAgICAgICAgd2Fsa1Byb3RvdHlwZUNoYWluID0gIW9wdGlvbnMub3duLFxuICAgICAgICBncmV5bGlzdCA9IG5ldyBHcmV5bGlzdChvcHRpb25zLmdyZXlsaXN0KTtcblxuICAgIGZvciAob2JqID0gdGhpczsgb2JqICYmIG9iaiAhPT0gT2JqZWN0LnByb3RvdHlwZTsgb2JqID0gd2Fsa1Byb3RvdHlwZUNoYWluICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopKSB7XG4gICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAhKGtleSBpbiBjYXRhbG9nKSAmJiAvLyBub3Qgc2hhZG93ZWQgYnkgYSBtZW1iZXIgb2YgYSBkZXNjZW5kYW50IG9iamVjdFxuICAgICAgICAgICAgICAgIGdyZXlsaXN0LnRlc3Qoa2V5KSAmJlxuICAgICAgICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpLnZhbHVlICE9PSBvYmplY3RDYXRhbG9nXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBjYXRhbG9nW2tleV0gPSBvYmo7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBjYXRhbG9nO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBtYXRjaCA9IHJlcXVpcmUoJ2NvZGUtbWF0Y2gnKTtcblxuLyoqIEB0eXBlZGVmIHtvYmplY3R9IHN0YXJsb2dnZXJcbiAqIEBkZXNjIEFuIGV2ZW50IGxpc3RlbmVyIGZvciBsb2dnaW5nIHB1cnBvc2VzLCBwYWlyZWQgd2l0aCB0aGUgdGFyZ2V0KHMpIHRvIGxpc3RlbiB0by5cbiAqIEVhY2ggbWVtYmVyIG9mIGEgbG9nZ2VyIG9iamVjdCBoYXMgdGhlIGV2ZW50IHN0cmluZyBhcyBpdHMga2V5IGFuZCBhbiBvYmplY3QgYXMgaXRzIHZhbHVlLlxuICogQHByb3BlcnR5IHtmdW5jdGlvbn0gbGlzdGVuZXIgLSBBIGhhbmRsZXIgdGhhdCBsb2dzIHRoZSBldmVudC5cbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fG9iamVjdFtdfSB0YXJnZXRzIC0gQSB0YXJnZXQgb3IgbGlzdCBvZiB0YXJnZXRzIHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG4gKi9cblxuLyoqIEB0eXBlZGVmIHtvYmplY3R8b2JqZWN0W119IGV2ZW50VGFyZ2V0c1xuICogRXZlbnQgdGFyZ2V0IG9iamVjdChzKSB0aGF0IGltcGxlbWVudCBgYWRkRXZlbnRMaXN0ZW5lcmAgYW5kIGByZW1vdmVFdmVudExpc3RlbmVyYCxcbiAqIHR5cGljYWxseSBhIERPTSBub2RlLCBidXQgYnkgbm8gbWVhbnMgbGltaXRlZCB0byBzdWNoLlxuICovXG5cbi8qKiBAdHlwZWRlZiB7c3RyaW5nfSBldmVudFR5cGUgKi9cblxuLyoqIEB0eXBlZGVmIHtvYmplY3R9IHN0YXJsb2dPcHRpb25zXG4gKlxuICogQGRlc2MgTXVzdCBkZWZpbmUgYGxvZ2dlcnNgLCBgZXZlbnRzYCwgb3IgYHBhdHRlcm5gIGFuZCBgc2VsZWN0YDsgZWxzZSBlcnJvciBpcyB0aHJvd24uXG4gKlxuICogQHBhcmFtIHtPYmplY3QuPGV2ZW50VHlwZSwgc3RhcmxvZ2dlcj59IFtsb2dnZXJzXSAtIExvZ2dlciBkaWN0aW9uYXJ5LlxuICogQHBhcmFtIHtzdHJpbmdbXX0gW2V2ZW50c10gLSBMaXN0IG9mIGV2ZW50IHN0cmluZ3MgZnJvbSB3aGljaCB0byBidWlsZCBhIGxvZ2dlciBkaWN0aW9uYXJ5LlxuICogQHBhcmFtIHtvYmplY3R8b2JqZWN0W119IFtzZWxlY3RdIC0gT2JqZWN0IG9yIGxpc3Qgb2Ygb2JqZWN0cyBpbiB3aGljaCB0byBzZWFyY2ggd2l0aCBgcGF0dGVybmAuXG4gKiBAcGFyYW0ge1JlZ0V4cH0gW3BhdHRlcm5dIC0gRXZlbnQgc3RyaW5nIHBhdHRlcm4gdG8gc2VhcmNoIGZvciBpbiBhbGwgdmlzaWJsZSBnZXR0ZXJzLCBzZXR0ZXJzLCBhbmQgbWV0aG9kcy5cbiAqIFRoZSByZXN1bHRzIG9mIHRoZSBzZWFyY2ggYXJlIHVzZWQgdG8gYnVpbGQgYSBsb2dnZXIgZGljdGlvbmFyeS5cbiAqIEV4YW1wbGU6IGAvJyhmaW4tW2Etei1dKyknL2AgbWVhbnMgZmluZCBhbGwgc3RyaW5ncyBsaWtlIGAnZmluLSonYCwgcmV0dXJuaW5nIG9ubHkgdGhlIHBhcnQgaW5zaWRlIHRoZSBxdW90ZXMuXG4gKiBTZWUgdGhlIFJFQURNRSBmb3IgYWRkaXRpb25hbCBleGFtcGxlcy5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbbG9nXSAtIE92ZXJyaWRlIHtAbGluayBTdGFybG9nI2xvZ30uXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbbGlzdGVuZXJdIC0gT3ZlcnJpZGUge0BsaW5rIFN0YXJsb2cjbGlzdGVuZXJ9LlxuICogQHBhcmFtIHtvYmplY3R9IFt0YXJnZXRzXSAtIE92ZXJyaWRlIHtAbGluayBTdGFybG9nI3RhcmdldHN9LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0LjxldmVudFR5cGUsIGZ1bmN0aW9uPn0gW2xpc3RlbmVyRGljdGlvbmFyeT17fV0gLSBDdXN0b20gbGlzdGVuZXJzIHRvIG92ZXJyaWRlIGRlZmF1bHQgbGlzdGVuZXIuXG4gKiBAcGFyYW0ge09iamVjdC48ZXZlbnRUeXBlLCBldmVudFRhcmdldHM+fSBbdGFyZ2V0c0RpY3Rpb25hcnk9e31dIC0gQ3VzdG9tIGV2ZW50IHRhcmdldCBvYmplY3QocykgdG8gb3ZlcnJpZGUgZGVmYXVsdCB0YXJnZXRzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBbbWF0Y2hdIC0gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC9jb2RlLW1hdGNoXG4gKiBAcGFyYW0ge251bWJlcn0gW21hdGNoLmNhcHR1cmVHcm91cF0gLSBJZmYgZGVmaW5lZCwgaW5kZXggb2YgYSBzcGVjaWZpYyBjYXB0dXJlIGdyb3VwIHRvIHJldHVybiBmb3IgZWFjaCBtYXRjaC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbbWF0Y2guZ3JleWxpc3RdIC0gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC9ncmV5bGlzdFxuICogQHBhcmFtIFttYXRjaC5ncmV5bGlzdC53aGl0ZV0gLSBJZiBnaXZlbiwgb25seSBsaXN0ZWQgbWF0Y2hlcyBhcmUgaW5jbHVkZWQgaW4gdGhlIHJlc3VsdHMuXG4gKiBAcGFyYW0gW21hdGNoLmdyZXlsaXN0LmJsYWNrXSAtIElmIGdpdmVuLCBsaXN0ZWQgbWF0Y2hlcyBhcmUgZXhjbHVkZWQgZnJvbSB0aGUgcmVzdWx0cy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gW21hdGNoLmNhdGFsb2ddIC0gaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC9vYmplY3QtY2F0YWxvZ1xuICogQHBhcmFtIHtib29sZWFufSBbbWF0Y2guY2F0YWxvZy5vd25dIC0gT25seSBzZWFyY2ggb3duIG1ldGhvZHMgZm9yIGV2ZW50IHN0cmluZ3M7IG90aGVyd2lzZSBlbnRpcmUgcHJvdG90eXBlIGNoYWluLlxuICogQHBhcmFtIHtvYmplY3R9IFttYXRjaC5jYXRhbG9nLmdyZXlsaXN0XSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvZ3JleWxpc3RcbiAqIEBwYXJhbSBbbWF0Y2guY2F0YWxvZy5ncmV5bGlzdC53aGl0ZV0gLSBJZiBnaXZlbiwgb25seSBsaXN0ZWQgbWVtYmVycyBhcmUgY2F0YWxvZ2VkLlxuICogQHBhcmFtIFttYXRjaC5jYXRhbG9nLmdyZXlsaXN0LmJsYWNrXSAtIElmIGdpdmVuLCBsaXN0ZWQgbWVtYmVycyBhcmUgKm5vdCogY2F0YWxvZ2VkLlxuICovXG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAc3VtbWFyeSBJbnN0YW5jZSBhIGxvZ2dlci5cbiAqIEBkZXNjIENvbnN1bWVzIGBvcHRpb25zYCwgY3JlYXRpbmcgYSBkaWN0aW9uYXJ5IG9mIGV2ZW50IHN0cmluZ3MgaW4gYHRoaXMuZXZlbnRzYC5cbiAqXG4gKiBTb3VyY2VzIGZvciBsb2dnZXJzOlxuICogKiBJZiBgb3B0aW9ucy5sb2dnZXJzYCBkaWN0aW9uYXJ5IG9iamVjdCBpcyBkZWZpbmVkLCBkZWVwIGNsb25lIGl0IGFuZCBtYWtlIHN1cmUgYWxsIG1lbWJlcnMgYXJlIGxvZ2dlciBvYmplY3RzLCBkZWZhdWx0aW5nIGFueSBtaXNzaW5nIG1lbWJlcnMuXG4gKiAqIEVsc2UgaWYgYG9wdGlvbnMuZXZlbnRzYCAobGlzdCBvZiBldmVudCBzdHJpbmdzKSBpcyBkZWZpbmVkLCBjcmVhdGUgYW4gb2JqZWN0IHdpdGggdGhvc2Uga2V5cywgbGlzdGVuZXJzLCBhbmQgdGFyZ2V0cy5cbiAqICogRWxzZSBpZiBgb3B0aW9ucy5wYXR0ZXJuYCBpcyBkZWZpbmVkLCBjb2RlIGZvdW5kIGluIHRoZSBleGVjdXRpb24gY29udGV4dCBvYmplY3QgaXMgc2VhcmNoZWQgZm9yIGV2ZW50IHN0cmluZ3MgdGhhdCBtYXRjaCBpdCAocGVyIGBvcHRpb25zLm1hdGNoYCkuXG4gKlxuICogRXZlbnRzIHNwZWNpZmllZCB3aXRoIGBvcHRpb25zLmV2ZW50c2AgYW5kIGBvcHRpb25zLnBhdHRlcm5gIGxvZyB1c2luZyB0aGUgZGVmYXVsdCBsaXN0ZW5lciBhbmQgZXZlbnQgdGFyZ2V0czpcbiAqICogYFN0YXJMb2cucHJvdG90eXBlLmxpc3RlbmVyYCwgdW5sZXNzIG92ZXJyaWRkZW4sIGp1c3QgY2FsbHMgYHRoaXMubG9nKClgIHdpdGggdGhlIGV2ZW50IHN0cmluZywgd2hpY2ggaXMgc3VmZmljaWVudCBmb3IgY2FzdWFsIHVzYWdlLlxuICogT3ZlcnJpZGUgaXQgYnkgZGVmaW5pbmcgYG9wdGlvbnMubGlzdGVuZXJgIG9yIGRpcmVjdGx5IGJ5IHJlYXNzaWduaW5nIHRvIGBTdGFyTG9nLnByb3RvdHlwZS5saXN0ZW5lcmAgYmVmb3JlIGluc3RhbnRpYXRpb24uXG4gKiAqIGBTdGFyTG9nLnByb3RvdHlwZS50YXJnZXRzYCwgdW5sZXNzIG92ZXJyaWRkZW4sIGlzIGB3aW5kb3cuZG9jdW1lbnRgICh3aGVuIGF2YWlsYWJsZSksXG4gKiB3aGljaCBpcyBvbmx5IHJlYWxseSB1c2VmdWwgaWYgdGhlIGV2ZW50IGlzIGRpc3BhdGNoZWQgZGlyZWN0bHkgdG8gKG9yIGlzIGFsbG93ZWQgdG8gYnViYmxlIHVwIHRvKSBgZG9jdW1lbnRgLlxuICogT3ZlcnJpZGUgaXQgYnkgZGVmaW5pbmcgYG9wdGlvbnMudGFyZ2V0c2Agb3IgZGlyZWN0bHkgYnkgcmVhc3NpZ25pbmcgdG8gYFN0YXJMb2cucHJvdG90eXBlLnRhcmdldHNgIGJlZm9yZSBpbnN0YW50aWF0aW9uLlxuICpcbiAqIEV2ZW50cyBzcGVjaWZpZWQgd2l0aCBgb3B0aW9ucy5sb2dnZXJzYCBjYW4gZWFjaCBzcGVjaWZ5IHRoZWlyIG93biBsaXN0ZW5lciBhbmQvb3IgdGFyZ2V0cywgYnV0IGlmIG5vdCBzcGVjaWZpZWQsIHRoZXkgdG9vIHdpbGwgYWxzbyB1c2UgdGhlIGFib3ZlIGRlZmF1bHRzLlxuICpcbiAqIEBwYXJhbSB7c3RhcmxvZ09wdGlvbnN9IFtvcHRpb25zXVxuICovXG5mdW5jdGlvbiBTdGFyTG9nKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIE92ZXJyaWRlIHByb3RvdHlwZSBkZWZpbml0aW9ucyBpZiBhbmQgb25seSBpZiBzdXBwbGllZCBpbiBvcHRpb25zXG4gICAgWydsb2cnLCAndGFyZ2V0cycsICdsaXN0ZW5lciddLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIGlmIChvcHRpb25zW2tleV0pIHsgdGhpc1trZXldID0gb3B0aW9uc1trZXldOyB9XG4gICAgfSwgdGhpcyk7XG5cbiAgICB2YXIgZGVmYXVsdFRhcmdldCA9IG9wdGlvbnMudGFyZ2V0cyB8fCB0aGlzLnRhcmdldHMsXG4gICAgICAgIGRlZmF1bHRMaXN0ZW5lciA9IG9wdGlvbnMubGlzdGVuZXIgfHwgdGhpcy5saXN0ZW5lcixcbiAgICAgICAgbGlzdGVuZXJEaWN0aW9uYXJ5ID0gb3B0aW9ucy5saXN0ZW5lckRpY3Rpb25hcnkgfHwge30sXG4gICAgICAgIHRhcmdldHNEaWN0aW9uYXJ5ID0gb3B0aW9ucy50YXJnZXRzRGljdGlvbmFyeSB8fCB7fSxcbiAgICAgICAgbG9nZ2VycyA9IG9wdGlvbnMubG9nZ2VycyxcbiAgICAgICAgZXZlbnRTdHJpbmdzO1xuXG4gICAgaWYgKGxvZ2dlcnMpIHtcbiAgICAgICAgZXZlbnRTdHJpbmdzID0gT2JqZWN0LmtleXMobG9nZ2Vycyk7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmV2ZW50cykge1xuICAgICAgICBsb2dnZXJzID0ge307XG4gICAgICAgIGV2ZW50U3RyaW5ncyA9IG9wdGlvbnMuZXZlbnRzO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5wYXR0ZXJuICYmIG9wdGlvbnMuc2VsZWN0KSB7XG4gICAgICAgIGxvZ2dlcnMgPSB7fTtcbiAgICAgICAgZXZlbnRTdHJpbmdzID0gYXJyYXlpZnkob3B0aW9ucy5zZWxlY3QpLnJlZHVjZShmdW5jdGlvbihtYXRjaGVzLCBvYmplY3QpIHtcbiAgICAgICAgICAgIG1hdGNoLmNhbGwob2JqZWN0LCBvcHRpb25zLnBhdHRlcm4sIG9wdGlvbnMubWF0Y2gpLmZvckVhY2goZnVuY3Rpb24gKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoZXMuaW5kZXhPZihtYXRjaCkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMucHVzaChtYXRjaCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcztcbiAgICAgICAgfSwgW10pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgYG9wdGlvbnMubG9nZ2Vyc2AsIGBvcHRpb25zLmV2ZW50c2AsIG9yIGBvcHRpb25zLnBhdHRlcm5gIGFuZCBgb3B0aW9ucy5zZWxlY3RgIHRvIGJlIGRlZmluZWQuJyk7XG4gICAgfVxuXG4gICAgdmFyIHN0YXJsb2cgPSB0aGlzO1xuXG4gICAgLyoqXG4gICAgICogRGljdGlvbmFyeSBvZiBldmVudCBzdHJpbmdzIHdpdGggbGlzdGVuZXIgYW5kIHRhcmdldChzKS5cbiAgICAgKiBAdHlwZSB7T2JqZWN0LjxldmVudFR5cGUsIHN0YXJsb2dnZXI+fVxuICAgICAqL1xuICAgIHRoaXMuZXZlbnRzID0gZXZlbnRTdHJpbmdzLnJlZHVjZShmdW5jdGlvbihjbG9uZSwgZXZlbnRTdHJpbmcpIHtcbiAgICAgICAgdmFyIGxvZ2dlciA9IE9iamVjdC5hc3NpZ24oe30sIGxvZ2dlcnNbZXZlbnRTdHJpbmddKTsgLy8gY2xvbmUgZWFjaCBsb2dnZXJcblxuICAgICAgICAvLyBiaW5kIHRoZSBsaXN0ZW5lciB0byBzdGFybG9nIGZvciBgdGhpcy5sb2dgIGFjY2VzcyB0byBTdGFybG9nI2xvZyBmcm9tIHdpdGhpbiBsaXN0ZW5lclxuICAgICAgICBsb2dnZXIubGlzdGVuZXIgPSAobG9nZ2VyLmxpc3RlbmVyIHx8IGxpc3RlbmVyRGljdGlvbmFyeVtldmVudFN0cmluZ10gfHwgZGVmYXVsdExpc3RlbmVyKS5iaW5kKHN0YXJsb2cpO1xuICAgICAgICBsb2dnZXIudGFyZ2V0cyA9IGFycmF5aWZ5KGxvZ2dlci50YXJnZXRzIHx8IHRhcmdldHNEaWN0aW9uYXJ5W2V2ZW50U3RyaW5nXSB8fCBkZWZhdWx0VGFyZ2V0KTtcblxuICAgICAgICBjbG9uZVtldmVudFN0cmluZ10gPSBsb2dnZXI7XG5cbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH0sIHt9KTtcbn1cblxuU3RhckxvZy5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IFN0YXJMb2cucHJvdG90eXBlLmNvbnN0cnVjdG9yLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAqIEBkZWZhdWx0IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSlcbiAgICAgKi9cbiAgICBsb2c6IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSksXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICogQGRlZmF1bHQgZnVuY3Rpb24oZSkgeyB0aGlzLmxvZyhlLnR5cGUpOyB9O1xuICAgICAqL1xuICAgIGxpc3RlbmVyOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMubG9nKGUudHlwZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICogQGRlZmF1bHQgd2luZG93LmRvY3VtZW50XG4gICAgICovXG4gICAgdGFyZ2V0czogdHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgd2luZG93LmRvY3VtZW50LFxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCBTdGFybG9nI3N0YXJ0XG4gICAgICogQHN1bW1hcnkgU3RhcnQgbG9nZ2luZyBldmVudHMuXG4gICAgICogQGRlc2MgQWRkIG5ldyBldmVudCBsaXN0ZW5lcnMgZm9yIGxvZ2dpbmcgcHVycG9zZXMuXG4gICAgICogT2xkIGV2ZW50IGxpc3RlbmVycywgaWYgYW55LCBhcmUgcmVtb3ZlZCBmaXJzdCwgYmVmb3JlIGFkZGluZyBuZXcgb25lcy5cbiAgICAgKi9cbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgZXZlbnRMaXN0ZW5lcih0aGlzLmV2ZW50cywgJ2FkZCcpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAbWV0aG9kIFN0YXJsb2cjc3RvcFxuICAgICAqIEBzdW1tYXJ5IFN0b3AgbG9nZ2luZyBldmVudHMuXG4gICAgICogQGRlc2MgRXZlbnQgbGlzdGVuZXJzIGFyZSByZW1vdmVkIGZyb20gdGFyZ2V0cyBhbmQgZGVsZXRlZC5cbiAgICAgKi9cbiAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV2ZW50TGlzdGVuZXIodGhpcy5ldmVudHMsICdyZW1vdmUnKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBldmVudExpc3RlbmVyKGRpY3Rpb25hcnksIG1ldGhvZFByZWZpeCkge1xuICAgIGlmICghZGljdGlvbmFyeSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG1ldGhvZCA9IG1ldGhvZFByZWZpeCArICdFdmVudExpc3RlbmVyJztcblxuICAgIE9iamVjdC5rZXlzKGRpY3Rpb25hcnkpLmZvckVhY2goZnVuY3Rpb24oZXZlbnRUeXBlKSB7XG4gICAgICAgIHZhciBldmVudExvZ2dlciA9IGRpY3Rpb25hcnlbZXZlbnRUeXBlXTtcbiAgICAgICAgZXZlbnRMb2dnZXIudGFyZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICAgICAgdGFyZ2V0W21ldGhvZF0oZXZlbnRUeXBlLCBldmVudExvZ2dlci5saXN0ZW5lcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBhcnJheWlmeSh4KSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoeCkgPyB4IDogW3hdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXJMb2c7Il19
