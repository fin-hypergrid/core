(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZW1vL2pzL2RlbW8vY2VsbGVkaXRvcnMuanMiLCJkZW1vL2pzL2RlbW8vY2VsbHJlbmRlcmVycy5qcyIsImRlbW8vanMvZGVtby9kYXNoYm9hcmQuanMiLCJkZW1vL2pzL2RlbW8vZXZlbnRzLmpzIiwiZGVtby9qcy9kZW1vL2Zvcm1hdHRlcnMuanMiLCJkZW1vL2pzL2RlbW8vaW5kZXguanMiLCJkZW1vL2pzL2RlbW8vc2V0U3RhdGUuanMiLCJub2RlX21vZHVsZXMvY29kZS1tYXRjaC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9maW4taHlwZXJncmlkLWV2ZW50LWxvZ2dlci9jdXN0b20tbGlzdGVuZXJzLmpzIiwibm9kZV9tb2R1bGVzL2Zpbi1oeXBlcmdyaWQtZXZlbnQtbG9nZ2VyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dyZXlsaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21hdGNoLXBvaW50L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1jYXRhbG9nL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N0YXJsb2cvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIHZhciBpZHggPSBncmlkLmJlaGF2aW9yLmNvbHVtbkVudW07XG5cbiAgICB2YXIgQ2VsbEVkaXRvciA9IGdyaWQuY2VsbEVkaXRvcnMuQmFzZUNsYXNzO1xuICAgIHZhciBUZXh0ZmllbGQgPSBncmlkLmNlbGxFZGl0b3JzLmdldCgndGV4dGZpZWxkJyk7XG5cbiAgICB2YXIgQ29sb3JUZXh0ID0gVGV4dGZpZWxkLmV4dGVuZCgnY29sb3JUZXh0Jywge1xuICAgICAgICB0ZW1wbGF0ZTogJzxpbnB1dCB0eXBlPVwidGV4dFwiIGxhbmc9XCJ7e2xvY2FsZX19XCIgc3R5bGU9XCJjb2xvcjp7e3RleHRDb2xvcn19XCI+J1xuICAgIH0pO1xuXG4gICAgZ3JpZC5jZWxsRWRpdG9ycy5hZGQoQ29sb3JUZXh0KTtcblxuICAgIHZhciBUaW1lID0gVGV4dGZpZWxkLmV4dGVuZCgnVGltZScsIHtcbiAgICAgICAgdGVtcGxhdGU6IFtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiaHlwZXJncmlkLXRleHRmaWVsZFwiIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodDtcIj4nLFxuICAgICAgICAgICAgJyAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBsYW5nPVwie3tsb2NhbGV9fVwiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDsgd2lkdGg6NzUlOyB0ZXh0LWFsaWduOnJpZ2h0OyBib3JkZXI6MDsgcGFkZGluZzowOyBvdXRsaW5lOjA7IGZvbnQtc2l6ZTppbmhlcml0OyBmb250LXdlaWdodDppbmhlcml0OycgK1xuICAgICAgICAgICAgJ3t7c3R5bGV9fVwiPicsXG4gICAgICAgICAgICAnICAgIDxzcGFuPkFNPC9zcGFuPicsXG4gICAgICAgICAgICAnPC9kaXY+J1xuICAgICAgICBdLmpvaW4oJ1xcbicpLFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dCA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcbiAgICAgICAgICAgIHRoaXMubWVyaWRpYW4gPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKTtcblxuICAgICAgICAgICAgLy8gRmxpcCBBTS9QTSBvbiBhbnkgY2xpY2tcbiAgICAgICAgICAgIHRoaXMuZWwub25jbGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQgPSB0aGlzLm1lcmlkaWFuLnRleHRDb250ZW50ID09PSAnQU0nID8gJ1BNJyA6ICdBTSc7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgICAgICB0aGlzLmlucHV0Lm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gaWdub3JlIGNsaWNrcyBpbiB0aGUgdGV4dCBmaWVsZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQub25mb2N1cyA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICAgICAgdGhpcy5lbC5zdHlsZS5vdXRsaW5lID0gdGhpcy5vdXRsaW5lID0gdGhpcy5vdXRsaW5lIHx8IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCkub3V0bGluZTtcbiAgICAgICAgICAgICAgICB0YXJnZXQuc3R5bGUub3V0bGluZSA9IDA7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG4gICAgICAgICAgICB0aGlzLmlucHV0Lm9uYmx1ciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsLnN0eWxlLm91dGxpbmUgPSAwO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldEVkaXRvclZhbHVlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgQ2VsbEVkaXRvci5wcm90b3R5cGUuc2V0RWRpdG9yVmFsdWUuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSB0aGlzLmlucHV0LnZhbHVlLnNwbGl0KCcgJyk7XG4gICAgICAgICAgICB0aGlzLmlucHV0LnZhbHVlID0gcGFydHNbMF07XG4gICAgICAgICAgICB0aGlzLm1lcmlkaWFuLnRleHRDb250ZW50ID0gcGFydHNbMV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RWRpdG9yVmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IENlbGxFZGl0b3IucHJvdG90eXBlLmdldEVkaXRvclZhbHVlLmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICAgICAgaWYgKHRoaXMubWVyaWRpYW4udGV4dENvbnRlbnQgPT09ICdQTScpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSArPSBkZW1vLk5PT047XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGdyaWQuY2VsbEVkaXRvcnMuYWRkKFRpbWUpO1xuXG4gICAgLy8gVXNlZCBieSB0aGUgY2VsbFByb3ZpZGVyLlxuICAgIC8vIGBudWxsYCBtZWFucyBjb2x1bW4ncyBkYXRhIGNlbGxzIGFyZSBub3QgZWRpdGFibGUuXG4gICAgdmFyIGVkaXRvclR5cGVzID0gW1xuICAgICAgICBudWxsLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgJ3RleHRmaWVsZCcsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICBudWxsLFxuICAgICAgICAndGltZScsXG4gICAgICAgICdjaG9pY2UnLFxuICAgICAgICAnY2hvaWNlJyxcbiAgICAgICAgJ2Nob2ljZScsXG4gICAgICAgICd0ZXh0ZmllbGQnLFxuICAgICAgICAndGV4dGZpZWxkJyxcbiAgICAgICAgJ3RleHRmaWVsZCdcbiAgICBdO1xuXG4gICAgLy8gT3ZlcnJpZGUgdG8gYXNzaWduIHRoZSB0aGUgY2VsbCBlZGl0b3JzLlxuICAgIGdyaWQuYmVoYXZpb3IuZGF0YU1vZGVsLmdldENlbGxFZGl0b3JBdCA9IGZ1bmN0aW9uKHgsIHksIGRlY2xhcmVkRWRpdG9yTmFtZSwgY2VsbEV2ZW50KSB7XG4gICAgICAgIHZhciBlZGl0b3JOYW1lID0gZGVjbGFyZWRFZGl0b3JOYW1lIHx8IGVkaXRvclR5cGVzW3ggJSBlZGl0b3JUeXBlcy5sZW5ndGhdO1xuXG4gICAgICAgIHN3aXRjaCAoeCkge1xuICAgICAgICAgICAgY2FzZSBpZHguYmlydGhTdGF0ZTpcbiAgICAgICAgICAgICAgICBjZWxsRXZlbnQudGV4dENvbG9yID0gJ3JlZCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2VsbEVkaXRvciA9IGdyaWQuY2VsbEVkaXRvcnMuY3JlYXRlKGVkaXRvck5hbWUsIGNlbGxFdmVudCk7XG5cbiAgICAgICAgaWYgKGNlbGxFZGl0b3IpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoeCkge1xuICAgICAgICAgICAgICAgIGNhc2UgaWR4LmVtcGxveWVkOlxuICAgICAgICAgICAgICAgICAgICBjZWxsRWRpdG9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIGlkeC50b3RhbE51bWJlck9mUGV0c093bmVkOlxuICAgICAgICAgICAgICAgICAgICBjZWxsRWRpdG9yLmlucHV0LnNldEF0dHJpYnV0ZSgnbWluJywgMCk7XG4gICAgICAgICAgICAgICAgICAgIGNlbGxFZGl0b3IuaW5wdXQuc2V0QXR0cmlidXRlKCdtYXgnLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIGNlbGxFZGl0b3IuaW5wdXQuc2V0QXR0cmlidXRlKCdzdGVwJywgMC4wMSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNlbGxFZGl0b3I7XG4gICAgfTtcbn07XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIHZhciBpZHggPSBncmlkLmJlaGF2aW9yLmNvbHVtbkVudW07XG5cbiAgICAvL0dFVCBDRUxMXG4gICAgLy9hbGwgZm9ybWF0dGluZyBhbmQgcmVuZGVyaW5nIHBlciBjZWxsIGNhbiBiZSBvdmVycmlkZGVuIGluIGhlcmVcbiAgICBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbC5nZXRDZWxsID0gZnVuY3Rpb24oY29uZmlnLCByZW5kZXJlck5hbWUpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5pc1VzZXJEYXRhQXJlYSkge1xuICAgICAgICAgICAgdmFyIG4sIGhleCwgdHJhdmVsLFxuICAgICAgICAgICAgICAgIGNvbEluZGV4ID0gY29uZmlnLmRhdGFDZWxsLngsXG4gICAgICAgICAgICAgICAgcm93SW5kZXggPSBjb25maWcuZGF0YUNlbGwueTtcblxuICAgICAgICAgICAgaWYgKGRlbW8uc3R5bGVSb3dzRnJvbURhdGEpIHtcbiAgICAgICAgICAgICAgICBuID0gZ3JpZC5iZWhhdmlvci5nZXRDb2x1bW4oaWR4LnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQpLmdldFZhbHVlKHJvd0luZGV4KTtcbiAgICAgICAgICAgICAgICBoZXggPSAoMTU1ICsgMTAgKiAobiAlIDExKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgIGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IgPSAnIycgKyBoZXggKyBoZXggKyBoZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAoY29sSW5kZXgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIGlkeC5sYXN0TmFtZTpcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLmNvbG9yID0gY29uZmlnLnZhbHVlICE9IG51bGwgJiYgKGNvbmZpZy52YWx1ZSArICcnKVswXSA9PT0gJ1MnID8gJ3JlZCcgOiAnIzE5MTkxOSc7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5saW5rID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIGlkeC5pbmNvbWU6XG4gICAgICAgICAgICAgICAgICAgIHRyYXZlbCA9IDYwO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgaWR4LnRyYXZlbDpcbiAgICAgICAgICAgICAgICAgICAgdHJhdmVsID0gMTA1O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRyYXZlbCkge1xuICAgICAgICAgICAgICAgIHRyYXZlbCArPSBNYXRoLnJvdW5kKGNvbmZpZy52YWx1ZSAqIDE1MCAvIDEwMDAwMCk7XG4gICAgICAgICAgICAgICAgY29uZmlnLmJhY2tncm91bmRDb2xvciA9ICcjMDAnICsgdHJhdmVsLnRvU3RyaW5nKDE2KSArICcwMCc7XG4gICAgICAgICAgICAgICAgY29uZmlnLmNvbG9yID0gJyNGRkZGRkYnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL1Rlc3RpbmdcbiAgICAgICAgICAgIGlmIChjb2xJbmRleCA9PT0gaWR4LnRvdGFsTnVtYmVyT2ZQZXRzT3duZWQpIHtcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIEJlIHN1cmUgdG8gYWRqdXN0IHRoZSBkYXRhIHNldCB0byB0aGUgYXBwcm9wcmlhdGUgdHlwZSBhbmQgc2hhcGUgaW4gd2lkZWRhdGEuanNcbiAgICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgIC8vcmV0dXJuIHNpbXBsZUNlbGw7IC8vV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBlbXB0eUNlbGw7IC8vV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBidXR0b25DZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gZXJyb3JDZWxsOyAvL1dPUktTOiBOb3RlZCB0aGF0IGFueSBlcnJvciBpbiB0aGlzIGZ1bmN0aW9uIHN0ZWFscyB0aGUgbWFpbiB0aHJlYWQgYnkgcmVjdXJzaW9uXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gc3BhcmtMaW5lQ2VsbDsgLy8gV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBzcGFya0JhckNlbGw7IC8vV09SS1NcbiAgICAgICAgICAgICAgICAvL3JldHVybiBzbGlkZXJDZWxsOyAvL1dPUktTXG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gdHJlZUNlbGw7IC8vTmVlZCB0byBmaWd1cmUgb3V0IGRhdGEgc2hhcGUgdG8gdGVzdFxuXG5cbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIFRlc3Qgb2YgQ3VzdG9taXplZCBSZW5kZXJlclxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIC8vIGlmIChzdGFycnkpe1xuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuZG9tYWluID0gNTsgLy8gZGVmYXVsdCBpcyAxMDBcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLnNpemVGYWN0b3IgPSAgMC42NTsgLy8gZGVmYXVsdCBpcyAwLjY1OyBzaXplIG9mIHN0YXJzIGFzIGZyYWN0aW9uIG9mIGhlaWdodCBvZiBjZWxsXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5kYXJrZW5GYWN0b3IgPSAwLjc1OyAvLyBkZWZhdWx0IGlzIDAuNzU7IHN0YXIgc3Ryb2tlIGNvbG9yIGFzIGZyYWN0aW9uIG9mIHN0YXIgZmlsbCBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuY29sb3IgPSAnZ29sZCc7IC8vIGRlZmF1bHQgaXMgJ2dvbGQnOyBzdGFyIGZpbGwgY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmZnQ29sb3IgPSAgJ2dyZXknOyAvLyBkZWZhdWx0IGlzICd0cmFuc3BhcmVudCcgKG5vdCByZW5kZXJlZCk7IHRleHQgY29sb3JcbiAgICAgICAgICAgICAgICAvLyAgICAgY29uZmlnLmZnU2VsQ29sb3IgPSAneWVsbG93JzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyB0ZXh0IHNlbGVjdGlvbiBjb2xvclxuICAgICAgICAgICAgICAgIC8vICAgICBjb25maWcuYmdDb2xvciA9ICcjNDA0MDQwJzsgLy8gZGVmYXVsdCBpcyAndHJhbnNwYXJlbnQnIChub3QgcmVuZGVyZWQpOyBiYWNrZ3JvdW5kIGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5iZ1NlbENvbG9yID0gJ2dyZXknOyAvLyBkZWZhdWx0IGlzICd0cmFuc3BhcmVudCcgKG5vdCByZW5kZXJlZCk7IGJhY2tncm91bmQgc2VsZWN0aW9uIGNvbG9yXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbmZpZy5zaGFkb3dDb2xvciA9ICd0cmFuc3BhcmVudCc7IC8vIGRlZmF1bHQgaXMgJ3RyYW5zcGFyZW50J1xuICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gc3RhcnJ5O1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBncmlkLmNlbGxSZW5kZXJlcnMuZ2V0KHJlbmRlcmVyTmFtZSk7XG4gICAgfTtcblxuICAgIC8vRU5EIE9GIEdFVCBDRUxMXG5cblxuICAgIC8vIENVU1RPTSBDRUxMIFJFTkRFUkVSXG5cbiAgICB2YXIgUkVHRVhQX0NTU19IRVg2ID0gL14jKC4uKSguLikoLi4pJC8sXG4gICAgICAgIFJFR0VYUF9DU1NfUkdCID0gL15yZ2JhXFwoKFxcZCspLChcXGQrKSwoXFxkKyksXFxkK1xcKSQvO1xuXG4gICAgZnVuY3Rpb24gcGFpbnRTcGFya1JhdGluZyhnYywgY29uZmlnKSB7XG4gICAgICAgIHZhciB4ID0gY29uZmlnLmJvdW5kcy54LFxuICAgICAgICAgICAgeSA9IGNvbmZpZy5ib3VuZHMueSxcbiAgICAgICAgICAgIHdpZHRoID0gY29uZmlnLmJvdW5kcy53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCA9IGNvbmZpZy5ib3VuZHMuaGVpZ2h0LFxuICAgICAgICAgICAgb3B0aW9ucyA9IGNvbmZpZy52YWx1ZSxcbiAgICAgICAgICAgIGRvbWFpbiA9IG9wdGlvbnMuZG9tYWluIHx8IGNvbmZpZy5kb21haW4gfHwgMTAwLFxuICAgICAgICAgICAgc2l6ZUZhY3RvciA9IG9wdGlvbnMuc2l6ZUZhY3RvciB8fCBjb25maWcuc2l6ZUZhY3RvciB8fCAwLjY1LFxuICAgICAgICAgICAgZGFya2VuRmFjdG9yID0gb3B0aW9ucy5kYXJrZW5GYWN0b3IgfHwgY29uZmlnLmRhcmtlbkZhY3RvciB8fCAwLjc1LFxuICAgICAgICAgICAgY29sb3IgPSBvcHRpb25zLmNvbG9yIHx8IGNvbmZpZy5jb2xvciB8fCAnZ29sZCcsXG4gICAgICAgICAgICBzdHJva2UgPSB0aGlzLnN0cm9rZSA9IGNvbG9yID09PSB0aGlzLmNvbG9yID8gdGhpcy5zdHJva2UgOiBnZXREYXJrZW5lZENvbG9yKGdjLCB0aGlzLmNvbG9yID0gY29sb3IsIGRhcmtlbkZhY3RvciksXG4gICAgICAgICAgICAvLyBiZ0NvbG9yID0gY29uZmlnLmlzU2VsZWN0ZWQgPyAob3B0aW9ucy5iZ1NlbENvbG9yIHx8IGNvbmZpZy5iZ1NlbENvbG9yKSA6IChvcHRpb25zLmJnQ29sb3IgfHwgY29uZmlnLmJnQ29sb3IpLFxuICAgICAgICAgICAgZmdDb2xvciA9IGNvbmZpZy5pc1NlbGVjdGVkID8gKG9wdGlvbnMuZmdTZWxDb2xvciB8fCBjb25maWcuZmdTZWxDb2xvcikgOiAob3B0aW9ucy5mZ0NvbG9yIHx8IGNvbmZpZy5mZ0NvbG9yKSxcbiAgICAgICAgICAgIHNoYWRvd0NvbG9yID0gb3B0aW9ucy5zaGFkb3dDb2xvciB8fCBjb25maWcuc2hhZG93Q29sb3IgfHwgJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgIC8vIGZvbnQgPSBvcHRpb25zLmZvbnQgfHwgY29uZmlnLmZvbnQgfHwgJzExcHggdmVyZGFuYScsXG4gICAgICAgICAgICBtaWRkbGUgPSBoZWlnaHQgLyAyLFxuICAgICAgICAgICAgZGlhbWV0ZXIgPSBzaXplRmFjdG9yICogaGVpZ2h0LFxuICAgICAgICAgICAgb3V0ZXJSYWRpdXMgPSBzaXplRmFjdG9yICogbWlkZGxlLFxuICAgICAgICAgICAgdmFsID0gTnVtYmVyKG9wdGlvbnMudmFsKSxcbiAgICAgICAgICAgIHBvaW50cyA9IHRoaXMucG9pbnRzO1xuXG4gICAgICAgIGlmICghcG9pbnRzKSB7XG4gICAgICAgICAgICB2YXIgaW5uZXJSYWRpdXMgPSAzIC8gNyAqIG91dGVyUmFkaXVzO1xuICAgICAgICAgICAgcG9pbnRzID0gdGhpcy5wb2ludHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSA1LCBwaSA9IE1hdGguUEkgLyAyLCBpbmNyID0gTWF0aC5QSSAvIDU7IGk7IC0taSwgcGkgKz0gaW5jcikge1xuICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgeDogb3V0ZXJSYWRpdXMgKiBNYXRoLmNvcyhwaSksXG4gICAgICAgICAgICAgICAgICAgIHk6IG1pZGRsZSAtIG91dGVyUmFkaXVzICogTWF0aC5zaW4ocGkpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcGkgKz0gaW5jcjtcbiAgICAgICAgICAgICAgICBwb2ludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHg6IGlubmVyUmFkaXVzICogTWF0aC5jb3MocGkpLFxuICAgICAgICAgICAgICAgICAgICB5OiBtaWRkbGUgLSBpbm5lclJhZGl1cyAqIE1hdGguc2luKHBpKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9pbnRzLnB1c2gocG9pbnRzWzBdKTsgLy8gY2xvc2UgdGhlIHBhdGhcbiAgICAgICAgfVxuXG4gICAgICAgIGdjLmNhY2hlLnNoYWRvd0NvbG9yID0gJ3RyYW5zcGFyZW50JztcblxuICAgICAgICBnYy5jYWNoZS5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgIGdjLmJlZ2luUGF0aCgpO1xuICAgICAgICBmb3IgKHZhciBqID0gNSwgc3ggPSB4ICsgNSArIG91dGVyUmFkaXVzOyBqOyAtLWosIHN4ICs9IGRpYW1ldGVyKSB7XG4gICAgICAgICAgICBwb2ludHMuZm9yRWFjaChmdW5jdGlvbihwb2ludCwgaW5kZXgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgICAgIGdjW2luZGV4ID8gJ2xpbmVUbycgOiAnbW92ZVRvJ10oc3ggKyBwb2ludC54LCB5ICsgcG9pbnQueSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgIH0pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgIH1cbiAgICAgICAgZ2MuY2xvc2VQYXRoKCk7XG5cbiAgICAgICAgdmFsID0gdmFsIC8gZG9tYWluICogNTtcblxuICAgICAgICBnYy5jYWNoZS5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgICAgZ2Muc2F2ZSgpO1xuICAgICAgICBnYy5jbGlwKCk7XG4gICAgICAgIGdjLmZpbGxSZWN0KHggKyA1LCB5LFxuICAgICAgICAgICAgKE1hdGguZmxvb3IodmFsKSArIDAuMjUgKyB2YWwgJSAxICogMC41KSAqIGRpYW1ldGVyLCAvLyBhZGp1c3Qgd2lkdGggdG8gc2tpcCBvdmVyIHN0YXIgb3V0bGluZXMgYW5kIGp1c3QgbWV0ZXIgdGhlaXIgaW50ZXJpb3JzXG4gICAgICAgICAgICBoZWlnaHQpO1xuICAgICAgICBnYy5yZXN0b3JlKCk7IC8vIHJlbW92ZSBjbGlwcGluZyByZWdpb25cblxuICAgICAgICBnYy5jYWNoZS5zdHJva2VTdHlsZSA9IHN0cm9rZTtcbiAgICAgICAgZ2MuY2FjaGUubGluZVdpZHRoID0gMTtcbiAgICAgICAgZ2Muc3Ryb2tlKCk7XG5cbiAgICAgICAgaWYgKGZnQ29sb3IgJiYgZmdDb2xvciAhPT0gJ3RyYW5zcGFyZW50Jykge1xuICAgICAgICAgICAgZ2MuY2FjaGUuZmlsbFN0eWxlID0gZmdDb2xvcjtcbiAgICAgICAgICAgIGdjLmNhY2hlLmZvbnQgPSAnMTFweCB2ZXJkYW5hJztcbiAgICAgICAgICAgIGdjLmNhY2hlLnRleHRBbGlnbiA9ICdyaWdodCc7XG4gICAgICAgICAgICBnYy5jYWNoZS50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICAgICAgICAgIGdjLmNhY2hlLnNoYWRvd0NvbG9yID0gc2hhZG93Q29sb3I7XG4gICAgICAgICAgICBnYy5jYWNoZS5zaGFkb3dPZmZzZXRYID0gZ2MuY2FjaGUuc2hhZG93T2Zmc2V0WSA9IDE7XG4gICAgICAgICAgICBnYy5maWxsVGV4dCh2YWwudG9GaXhlZCgxKSwgeCArIHdpZHRoICsgMTAsIHkgKyBoZWlnaHQgLyAyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldERhcmtlbmVkQ29sb3IoZ2MsIGNvbG9yLCBmYWN0b3IpIHtcbiAgICAgICAgdmFyIHJnYmEgPSBnZXRSR0JBKGdjLCBjb2xvcik7XG4gICAgICAgIHJldHVybiAncmdiYSgnICsgTWF0aC5yb3VuZChmYWN0b3IgKiByZ2JhWzBdKSArICcsJyArIE1hdGgucm91bmQoZmFjdG9yICogcmdiYVsxXSkgKyAnLCcgKyBNYXRoLnJvdW5kKGZhY3RvciAqIHJnYmFbMl0pICsgJywnICsgKHJnYmFbM10gfHwgMSkgKyAnKSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UkdCQShnYywgY29sb3JTcGVjKSB7XG4gICAgICAgIC8vIE5vcm1hbGl6ZSB2YXJpZXR5IG9mIENTUyBjb2xvciBzcGVjIHN5bnRheGVzIHRvIG9uZSBvZiB0d29cbiAgICAgICAgZ2MuY2FjaGUuZmlsbFN0eWxlID0gY29sb3JTcGVjO1xuXG4gICAgICAgIHZhciByZ2JhID0gY29sb3JTcGVjLm1hdGNoKFJFR0VYUF9DU1NfSEVYNik7XG4gICAgICAgIGlmIChyZ2JhKSB7XG4gICAgICAgICAgICByZ2JhLnNoaWZ0KCk7IC8vIHJlbW92ZSB3aG9sZSBtYXRjaFxuICAgICAgICAgICAgcmdiYS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZ2JhW2luZGV4XSA9IHBhcnNlSW50KHZhbCwgMTYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZ2JhID0gY29sb3JTcGVjLm1hdGNoKFJFR0VYUF9DU1NfUkdCKTtcbiAgICAgICAgICAgIGlmICghcmdiYSkge1xuICAgICAgICAgICAgICAgIHRocm93ICdVbmV4cGVjdGVkIGZvcm1hdCBnZXR0aW5nIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC5maWxsU3R5bGUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmdiYS5zaGlmdCgpOyAvLyByZW1vdmUgd2hvbGUgbWF0Y2hcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZ2JhO1xuICAgIH1cblxuXG4gICAgLy9FeHRlbmQgSHlwZXJHcmlkJ3MgYmFzZSBSZW5kZXJlclxuICAgIHZhciBzcGFya1N0YXJSYXRpbmdSZW5kZXJlciA9IGdyaWQuY2VsbFJlbmRlcmVycy5CYXNlQ2xhc3MuZXh0ZW5kKHtcbiAgICAgICAgcGFpbnQ6IHBhaW50U3BhcmtSYXRpbmdcbiAgICB9KTtcblxuICAgIC8vUmVnaXN0ZXIgeW91ciByZW5kZXJlclxuICAgIGdyaWQuY2VsbFJlbmRlcmVycy5hZGQoJ1N0YXJyeScsIHNwYXJrU3RhclJhdGluZ1JlbmRlcmVyKTtcblxuICAgIC8vIEVORCBPRiBDVVNUT00gQ0VMTCBSRU5ERVJFUlxuICAgIHJldHVybiBncmlkO1xufTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKiBnbG9iYWxzIHBlb3BsZTEsIHBlb3BsZTIgKi9cblxuLyogZXNsaW50LWRpc2FibGUgbm8tYWxlcnQgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBTb21lIERPTSBzdXBwb3J0IGZ1bmN0aW9ucy4uLlxuLy8gQmVzaWRlcyB0aGUgY2FudmFzLCB0aGlzIHRlc3QgaGFybmVzcyBvbmx5IGhhcyBhIGhhbmRmdWwgb2YgYnV0dG9ucyBhbmQgY2hlY2tib3hlcy5cbi8vIFRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIHNlcnZpY2UgdGhlc2UgY29udHJvbHMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVtbywgZ3JpZCkge1xuXG4gICAgLy8gbWFrZSBidXR0b25zIGRpdiBhYnNvbHV0ZSBzbyBidXR0b25zIHdpZHRoIG9mIDEwMCUgZG9lc24ndCBzdHJldGNoIHRvIHdpZHRoIG9mIGRhc2hib2FyZFxuICAgIHZhciBjdHJsR3JvdXBzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N0cmwtZ3JvdXBzJyksXG4gICAgICAgIGRhc2hib2FyZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkYXNoYm9hcmQnKSxcbiAgICAgICAgYnV0dG9ucyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidXR0b25zJyk7XG5cbiAgICBjdHJsR3JvdXBzLnN0eWxlLnRvcCA9IGN0cmxHcm91cHMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgJ3B4JztcbiAgICAvL2J1dHRvbnMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGRhc2hib2FyZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgZnVuY3Rpb24gdG9nZ2xlUm93U3R5bGluZ01ldGhvZCgpIHtcbiAgICAgICAgZGVtby5zdHlsZVJvd3NGcm9tRGF0YSA9ICFkZW1vLnN0eWxlUm93c0Zyb21EYXRhO1xuICAgIH1cblxuICAgIC8vIExpc3Qgb2YgcHJvcGVydGllcyB0byBzaG93IGFzIGNoZWNrYm94ZXMgaW4gdGhpcyBkZW1vJ3MgXCJkYXNoYm9hcmRcIlxuICAgIHZhciB0b2dnbGVQcm9wcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdSb3cgc3R5bGluZycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnKEdsb2JhbCBzZXR0aW5nKScsIGxhYmVsOiAnYmFzZSBvbiBkYXRhJywgc2V0dGVyOiB0b2dnbGVSb3dTdHlsaW5nTWV0aG9kfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ0NvbHVtbiBoZWFkZXIgcm93cycsXG4gICAgICAgICAgICBjdHJsczogW1xuICAgICAgICAgICAgICAgIHtuYW1lOiAnc2hvd0hlYWRlclJvdycsIGxhYmVsOiAnaGVhZGVyJ30sIC8vIGRlZmF1bHQgXCJzZXR0ZXJcIiBpcyBgc2V0UHJvcGBcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdIb3ZlciBoaWdobGlnaHRzJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge25hbWU6ICdob3ZlckNlbGxIaWdobGlnaHQuZW5hYmxlZCcsIGxhYmVsOiAnY2VsbCd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnaG92ZXJSb3dIaWdobGlnaHQuZW5hYmxlZCcsIGxhYmVsOiAncm93J30sXG4gICAgICAgICAgICAgICAge25hbWU6ICdob3ZlckNvbHVtbkhpZ2hsaWdodC5lbmFibGVkJywgbGFiZWw6ICdjb2x1bW4nfVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ0xpbmsgc3R5bGUnLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2xpbmtPbkhvdmVyJywgbGFiZWw6ICdvbiBob3Zlcid9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnbGlua0NvbG9yJywgdHlwZTogJ3RleHQnLCBsYWJlbDogJ2NvbG9yJ30sXG4gICAgICAgICAgICAgICAge25hbWU6ICdsaW5rQ29sb3JPbkhvdmVyJywgbGFiZWw6ICdjb2xvciBvbiBob3Zlcid9XG4gICAgICAgICAgICBdXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGxhYmVsOiAnQ2VsbCBlZGl0aW5nJyxcbiAgICAgICAgICAgIGN0cmxzOiBbXG4gICAgICAgICAgICAgICAge25hbWU6ICdlZGl0YWJsZSd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnZWRpdE9uRG91YmxlQ2xpY2snLCBsYWJlbDogJ3JlcXVpcmVzIGRvdWJsZS1jbGljayd9LFxuICAgICAgICAgICAgICAgIHtuYW1lOiAnZWRpdE9uS2V5ZG93bicsIGxhYmVsOiAndHlwZSB0byBlZGl0J31cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbGFiZWw6ICdTZWxlY3Rpb24nLFxuICAgICAgICAgICAgY3RybHM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zJywgbGFiZWw6ICdieSByb3cgaGFuZGxlcyBvbmx5Jywgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wLFxuICAgICAgICAgICAgICAgICAgICB0b29sdGlwOiAnTm90ZSB0aGF0IHdoZW4gdGhpcyBwcm9wZXJ0eSBpcyBhY3RpdmUsIGF1dG9TZWxlY3RSb3dzIHdpbGwgbm90IHdvcmsuJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge25hbWU6ICdzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlJywgbGFiZWw6ICdvbmUgcm93IGF0IGEgdGltZScsIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnIW11bHRpcGxlU2VsZWN0aW9ucycsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnb25lIGNlbGwgcmVnaW9uIGF0IGEgdGltZScsXG4gICAgICAgICAgICAgICAgICAgIHNldHRlcjogc2V0U2VsZWN0aW9uUHJvcCxcbiAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnYXV0b1NlbGVjdFJvd3MnLCBsYWJlbDogJ2F1dG8tc2VsZWN0IHJvd3MnLCBzZXR0ZXI6IHNldFNlbGVjdGlvblByb3AsXG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXA6ICdOb3RlczpcXG4nICtcbiAgICAgICAgICAgICAgICAgICAgJzEuIFJlcXVpcmVzIHRoYXQgY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucyBiZSBzZXQgdG8gZmFsc2UgKHNvIGNoZWNraW5nIHRoaXMgYm94IGF1dG9tYXRpY2FsbHkgdW5jaGVja3MgdGhhdCBvbmUpLlxcbicgK1xuICAgICAgICAgICAgICAgICAgICAnMi4gU2V0IHNpbmdsZVJvd1NlbGVjdGlvbk1vZGUgdG8gZmFsc2UgdG8gYWxsb3cgYXV0by1zZWxlY3Qgb2YgbXVsdGlwbGUgcm93cy4nXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7bmFtZTogJ2F1dG9TZWxlY3RDb2x1bW5zJywgbGFiZWw6ICdhdXRvLXNlbGVjdCBjb2x1bW5zJywgc2V0dGVyOiBzZXRTZWxlY3Rpb25Qcm9wfVxuICAgICAgICAgICAgXVxuICAgICAgICB9XG4gICAgXTtcblxuXG4gICAgdG9nZ2xlUHJvcHMuZm9yRWFjaChmdW5jdGlvbihwcm9wKSB7XG4gICAgICAgIGFkZFRvZ2dsZShwcm9wKTtcbiAgICB9KTtcblxuXG4gICAgW1xuICAgICAgICB7bGFiZWw6ICdUb2dnbGUgRW1wdHkgRGF0YScsIG9uY2xpY2s6IGRlbW8udG9nZ2xlRW1wdHlEYXRhfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdTZXQgRGF0YScsIG9uY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGVtby5yZXNldERhdGEoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdTZXQgRGF0YSAxICg1MDAwIHJvd3MpJywgb25jbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZW1vLnNldERhdGEocGVvcGxlMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnU2V0IERhdGEgMiAoMTAwMDAgcm93cyknLCBvbmNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRlbW8uc2V0RGF0YShwZW9wbGUyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge2xhYmVsOiAnUmVzZXQgR3JpZCcsIG9uY2xpY2s6IGRlbW8ucmVzZXR9XG5cbiAgICBdLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICAgIGJ1dHRvbi5pbm5lckhUTUwgPSBpdGVtLmxhYmVsO1xuICAgICAgICBidXR0b24ub25jbGljayA9IGl0ZW0ub25jbGljaztcbiAgICAgICAgaWYgKGl0ZW0udGl0bGUpIHtcbiAgICAgICAgICAgIGJ1dHRvbi50aXRsZSA9IGl0ZW0udGl0bGU7XG4gICAgICAgIH1cbiAgICAgICAgYnV0dG9ucy5hcHBlbmRDaGlsZChidXR0b24pO1xuICAgIH0pO1xuXG5cbiAgICBmdW5jdGlvbiBhZGRUb2dnbGUoY3RybEdyb3VwKSB7XG4gICAgICAgIHZhciBpbnB1dCwgbGFiZWwsXG4gICAgICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gJ2N0cmwtZ3JvdXAnO1xuXG4gICAgICAgIGlmIChjdHJsR3JvdXAubGFiZWwpIHtcbiAgICAgICAgICAgIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBsYWJlbC5jbGFzc05hbWUgPSAndHdpc3Rlcic7XG4gICAgICAgICAgICBsYWJlbC5pbm5lckhUTUwgPSBjdHJsR3JvdXAubGFiZWw7XG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobGFiZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNob2ljZXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY2hvaWNlcy5jbGFzc05hbWUgPSAnY2hvaWNlcyc7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjaG9pY2VzKTtcblxuICAgICAgICBjdHJsR3JvdXAuY3RybHMuZm9yRWFjaChmdW5jdGlvbihjdHJsKSB7XG4gICAgICAgICAgICBpZiAoIWN0cmwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZWZlcmVuY2VFbGVtZW50LFxuICAgICAgICAgICAgICAgIHR5cGUgPSBjdHJsLnR5cGUgfHwgJ2NoZWNrYm94JyxcbiAgICAgICAgICAgICAgICB0b29sdGlwID0gJ1Byb3BlcnR5IG5hbWU6ICcgKyBjdHJsLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChjdHJsLnRvb2x0aXApIHtcbiAgICAgICAgICAgICAgICB0b29sdGlwICs9ICdcXG5cXG4nICsgY3RybC50b29sdGlwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICBpbnB1dC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgIGlucHV0LmlkID0gY3RybC5uYW1lO1xuICAgICAgICAgICAgaW5wdXQubmFtZSA9IGN0cmxHcm91cC5sYWJlbDtcblxuICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gY3RybC52YWx1ZSB8fCBnZXRQcm9wZXJ0eShjdHJsLm5hbWUpIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC5zdHlsZS53aWR0aCA9ICcyNXB4JztcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuc3R5bGUubWFyZ2luTGVmdCA9ICc0cHgnO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC5zdHlsZS5tYXJnaW5SaWdodCA9ICc0cHgnO1xuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VFbGVtZW50ID0gaW5wdXQ7IC8vIGxhYmVsIGdvZXMgYWZ0ZXIgaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnY2hlY2tib3gnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3JhZGlvJzpcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuY2hlY2tlZCA9ICdjaGVja2VkJyBpbiBjdHJsXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGN0cmwuY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICAgICAgOiBnZXRQcm9wZXJ0eShjdHJsLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2VFbGVtZW50ID0gbnVsbDsgLy8gbGFiZWwgZ29lcyBiZWZvcmUgaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlucHV0Lm9uY2hhbmdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVSYWRpb0NsaWNrLmNhbGwodGhpcywgY3RybC5zZXR0ZXIgfHwgc2V0UHJvcCwgZXZlbnQpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgICAgICAgICAgbGFiZWwudGl0bGUgPSB0b29sdGlwO1xuICAgICAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgbGFiZWwuaW5zZXJ0QmVmb3JlKFxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcgJyArIChjdHJsLmxhYmVsIHx8IGN0cmwubmFtZSkpLFxuICAgICAgICAgICAgICAgIHJlZmVyZW5jZUVsZW1lbnRcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNob2ljZXMuYXBwZW5kQ2hpbGQobGFiZWwpO1xuXG4gICAgICAgICAgICBpZiAoY3RybC5uYW1lID09PSAndHJlZXZpZXcnKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwub25tb3VzZWRvd24gPSBpbnB1dC5vbm1vdXNlZG93biA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaW5wdXQuY2hlY2tlZCAmJiBncmlkLmJlaGF2aW9yLmRhdGFNb2RlbC5zb3VyY2UuZGF0YSAhPT0gZGVtby50cmVlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0xvYWQgdHJlZSBkYXRhIGZpcnN0IChcIlNldCBEYXRhIDNcIiBidXR0b24pLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGN0cmxHcm91cHMuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICB9XG5cbiAgICAvLyByZXNldCBkYXNoYm9hcmQgY2hlY2tib3hlcyBhbmQgcmFkaW8gYnV0dG9ucyB0byBtYXRjaCBjdXJyZW50IHZhbHVlcyBvZiBncmlkIHByb3BlcnRpZXNcbiAgICBkZW1vLnJlc2V0RGFzaGJvYXJkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRvZ2dsZVByb3BzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgICAgICAgcHJvcC5jdHJscy5mb3JFYWNoKGZ1bmN0aW9uKGN0cmwpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3RybCkge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGN0cmwuc2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHNldFNlbGVjdGlvblByb3A6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHNldFByb3A6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGN0cmwudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdyYWRpbyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSBjdHJsLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9sYXJpdHkgPSAoaWRbMF0gPT09ICchJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuY2hlY2tlZCA9IGdldFByb3BlcnR5KGlkKSBeIHBvbGFyaXR5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZ2V0UHJvcGVydHkoa2V5KSB7XG4gICAgICAgIHZhciBrZXlzID0ga2V5LnNwbGl0KCcuJyk7XG4gICAgICAgIHZhciBwcm9wID0gZ3JpZC5wcm9wZXJ0aWVzO1xuXG4gICAgICAgIHdoaWxlIChrZXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgcHJvcCA9IHByb3Bba2V5cy5zaGlmdCgpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm9wO1xuICAgIH1cblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWItZGFzaGJvYXJkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZGFzaGJvYXJkLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJykge1xuICAgICAgICAgICAgZGFzaGJvYXJkLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUudHJhbnNpdGlvbiA9ICdtYXJnaW4tbGVmdCAuNzVzJztcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLm1hcmdpbkxlZnQgPSBNYXRoLm1heCgxODAsIGRhc2hib2FyZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5yaWdodCArIDgpICsgJ3B4JztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZGFzaGJvYXJkLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9LCA4MDApO1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUubWFyZ2luTGVmdCA9ICczMHB4JztcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGZwc1RpbWVyLCBzZWNzLCBmcmFtZXM7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi1mcHMnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXMsIHN0ID0gZWwuc3R5bGU7XG4gICAgICAgIGlmICgoZ3JpZC5wcm9wZXJ0aWVzLmVuYWJsZUNvbnRpbnVvdXNSZXBhaW50IF49IHRydWUpKSB7XG4gICAgICAgICAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSAnIzY2Nic7XG4gICAgICAgICAgICBzdC50ZXh0QWxpZ24gPSAnbGVmdCc7XG4gICAgICAgICAgICBzZWNzID0gZnJhbWVzID0gMDtcbiAgICAgICAgICAgIGNvZGUoKTtcbiAgICAgICAgICAgIGZwc1RpbWVyID0gc2V0SW50ZXJ2YWwoY29kZSwgMTAwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGZwc1RpbWVyKTtcbiAgICAgICAgICAgIHN0LmJhY2tncm91bmRDb2xvciA9IHN0LnRleHRBbGlnbiA9IG51bGw7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSAnRlBTJztcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBjb2RlKCkge1xuICAgICAgICAgICAgdmFyIGZwcyA9IGdyaWQuY2FudmFzLmN1cnJlbnRGUFMsXG4gICAgICAgICAgICAgICAgYmFycyA9IEFycmF5KE1hdGgucm91bmQoZnBzKSArIDEpLmpvaW4oJ0knKSxcbiAgICAgICAgICAgICAgICBzdWJyYW5nZSwgc3BhbjtcblxuICAgICAgICAgICAgLy8gZmlyc3Qgc3BhbiBob2xkcyB0aGUgMzAgYmFja2dyb3VuZCBiYXJzXG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSk7XG5cbiAgICAgICAgICAgIC8vIDJuZCBzcGFuIGhvbGRzIHRoZSBudW1lcmljXG4gICAgICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG4gICAgICAgICAgICBpZiAoc2Vjcykge1xuICAgICAgICAgICAgICAgIGZyYW1lcyArPSBmcHM7XG4gICAgICAgICAgICAgICAgc3Bhbi5pbm5lckhUTUwgPSBmcHMudG9GaXhlZCgxKTtcbiAgICAgICAgICAgICAgICBzcGFuLnRpdGxlID0gc2VjcyArICctc2Vjb25kIGF2ZXJhZ2UgPSAnICsgKGZyYW1lcyAvIHNlY3MpLnRvRml4ZWQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWNzICs9IDE7XG5cbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4pO1xuXG4gICAgICAgICAgICAvLyAwIHRvIDQgY29sb3IgcmFuZ2UgYmFyIHN1YnNldHM6IDEuLjEwOnJlZCwgMTE6MjA6eWVsbG93LCAyMTozMDpncmVlblxuICAgICAgICAgICAgd2hpbGUgKChzdWJyYW5nZSA9IGJhcnMuc3Vic3RyKDAsIDEyKSkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgICAgICBzcGFuLmlubmVySFRNTCA9IHN1YnJhbmdlO1xuICAgICAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICAgICAgICAgIGJhcnMgPSBiYXJzLnN1YnN0cigxMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBoZWlnaHQ7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYi1ncm93LXNocmluaycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGxhYmVsO1xuICAgICAgICBpZiAoIWhlaWdodCkge1xuICAgICAgICAgICAgaGVpZ2h0ID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZ3JpZC5kaXYpLmhlaWdodDtcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLnRyYW5zaXRpb24gPSAnaGVpZ2h0IDEuNXMgbGluZWFyJztcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCArICdweCc7XG4gICAgICAgICAgICBsYWJlbCA9ICdTaHJpbmsnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3JpZC5kaXYuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgaGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGFiZWwgPSAnR3Jvdyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbm5lckhUTUwgKz0gJyAuLi4nO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBsYWJlbDtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCAxNTAwKTtcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkYXNoYm9hcmQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBjdHJsID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICBpZiAoY3RybC5jbGFzc0xpc3QuY29udGFpbnMoJ3R3aXN0ZXInKSkge1xuICAgICAgICAgICAgY3RybC5uZXh0RWxlbWVudFNpYmxpbmcuc3R5bGUuZGlzcGxheSA9IGN0cmwuY2xhc3NMaXN0LnRvZ2dsZSgnb3BlbicpID8gJ2Jsb2NrJyA6ICdub25lJztcbiAgICAgICAgICAgIGdyaWQuZGl2LnN0eWxlLm1hcmdpbkxlZnQgPSBNYXRoLm1heCgxODAsIGV2ZW50LmN1cnJlbnRUYXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHQgKyA4KSArICdweCc7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgdmFyIHJhZGlvR3JvdXAgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZVJhZGlvQ2xpY2soaGFuZGxlciwgZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ3JhZGlvJykge1xuICAgICAgICAgICAgdmFyIGxhc3RSYWRpbyA9IHJhZGlvR3JvdXBbdGhpcy5uYW1lXTtcbiAgICAgICAgICAgIGlmIChsYXN0UmFkaW8pIHtcbiAgICAgICAgICAgICAgICBsYXN0UmFkaW8uaGFuZGxlci5jYWxsKGxhc3RSYWRpby5jdHJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJhZGlvR3JvdXBbdGhpcy5uYW1lXSA9IHtjdHJsOiB0aGlzLCBoYW5kbGVyOiBoYW5kbGVyfTtcbiAgICAgICAgfVxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFByb3AoKSB7IC8vIHN0YW5kYXJkIGNoZWNrYm94IGNsaWNrIGhhbmRsZXJcbiAgICAgICAgdmFyIGhhc2ggPSB7fSwgZGVwdGggPSBoYXNoO1xuICAgICAgICB2YXIgaWQgPSB0aGlzLmlkO1xuICAgICAgICBpZiAoaWRbMF0gPT09ICchJykge1xuICAgICAgICAgICAgaWYgKHRoaXMudHlwZSAhPT0gJ2NoZWNrYm94Jykge1xuICAgICAgICAgICAgICAgIHRocm93ICdFeHBlY3RlZCBpbnZlcnNlIG9wZXJhdG9yICghKSBvbiBjaGVja2JveCBkYXNoYm9hcmQgY29udHJvbHMgb25seSBidXQgZm91bmQgb24gJyArIHRoaXMudHlwZSArICcuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlkID0gaWQuc3Vic3RyKDEpO1xuICAgICAgICAgICAgdmFyIGludmVyc2UgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXlzID0gaWQuc3BsaXQoJy4nKTtcblxuICAgICAgICB3aGlsZSAoa2V5cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBkZXB0aCA9IGRlcHRoW2tleXMuc2hpZnQoKV0gPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgICAgICBkZXB0aFtrZXlzLnNoaWZ0KCldID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgICAgICAgICBkZXB0aFtrZXlzLnNoaWZ0KCldID0gaW52ZXJzZSA/ICF0aGlzLmNoZWNrZWQgOiB0aGlzLmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBncmlkLnRha2VGb2N1cygpO1xuICAgICAgICBncmlkLmFkZFByb3BlcnRpZXMoaGFzaCk7XG4gICAgICAgIGdyaWQuYmVoYXZpb3JDaGFuZ2VkKCk7XG4gICAgICAgIGdyaWQucmVwYWludCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFNlbGVjdGlvblByb3AoKSB7IC8vIGFsdGVybmF0ZSBjaGVja2JveCBjbGljayBoYW5kbGVyXG4gICAgICAgIHZhciBjdHJsO1xuXG4gICAgICAgIGdyaWQuc2VsZWN0aW9uTW9kZWwuY2xlYXIoKTtcbiAgICAgICAgZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWwuY2xlYXJTZWxlY3RlZERhdGEoKTtcblxuICAgICAgICBzZXRQcm9wLmNhbGwodGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMuY2hlY2tlZCkge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHRoaXMuaWQgPT09ICdjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zJyAmJlxuICAgICAgICAgICAgICAgIChjdHJsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dG9TZWxlY3RSb3dzJykpLmNoZWNrZWRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGFsZXJ0KCdOb3RlIHRoYXQgYXV0b1NlbGVjdFJvd3MgaXMgaW5lZmZlY3R1YWwgd2hlbiBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zIGlzIG9uLicpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlkID09PSAnYXV0b1NlbGVjdFJvd3MnKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAoY3RybCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zJykpLmNoZWNrZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgY29uZmlybSgnTm90ZSB0aGF0IGF1dG9TZWxlY3RSb3dzIGlzIGluZWZmZWN0dWFsIHdoZW4gY2hlY2tib3hPbmx5Um93U2VsZWN0aW9ucyBpcyBvbi5cXG5cXG5UdXJuIG9mZiBjaGVja2JveE9ubHlSb3dTZWxlY3Rpb25zPycpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzZXRQcm9wLmNhbGwoY3RybCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAoY3RybCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlJykpLmNoZWNrZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgY29uZmlybSgnTm90ZSB0aGF0IGF1dG8tc2VsZWN0aW5nIGEgcmFuZ2Ugb2Ygcm93cyBieSBzZWxlY3RpbmcgYSByYW5nZSBvZiBjZWxscyAod2l0aCBjbGljayArIGRyYWcgb3Igc2hpZnQgKyBjbGljaykgaXMgbm90IHBvc3NpYmxlIHdpdGggc2luZ2xlUm93U2VsZWN0aW9uTW9kZSBpcyBvbi5cXG5cXG5UdXJuIG9mZiBzaW5nbGVSb3dTZWxlY3Rpb25Nb2RlPycpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzZXRQcm9wLmNhbGwoY3RybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRlbW8sIGdyaWQpIHtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWJ1dHRvbi1wcmVzc2VkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgY2VsbEV2ZW50ID0gZS5kZXRhaWw7XG4gICAgICAgIGNlbGxFdmVudC52YWx1ZSA9ICFjZWxsRXZlbnQudmFsdWU7XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1jZWxsLWVudGVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgY2VsbEV2ZW50ID0gZS5kZXRhaWw7XG5cbiAgICAgICAgLy9ob3cgdG8gc2V0IHRoZSB0b29sdGlwLi4uLlxuICAgICAgICBncmlkLnNldEF0dHJpYnV0ZSgndGl0bGUnLCAnZXZlbnQgbmFtZTogXCJmaW4tY2VsbC1lbnRlclwiXFxuJyArXG4gICAgICAgICAgICAnZ3JpZENlbGw6IHsgeDogJyArIGNlbGxFdmVudC5ncmlkQ2VsbC54ICsgJywgeTogJyArIGNlbGxFdmVudC5ncmlkQ2VsbC55ICsgJyB9XFxuJyArXG4gICAgICAgICAgICAnZGF0YUNlbGw6IHsgeDogJyArIGNlbGxFdmVudC5kYXRhQ2VsbC54ICsgJywgeTogJyArIGNlbGxFdmVudC5kYXRhQ2VsbC55ICsgJyB9XFxuJyArXG4gICAgICAgICAgICAnc3ViZ3JpZCB0eXBlOiBcIicgKyBjZWxsRXZlbnQuc3ViZ3JpZC50eXBlICsgJ1wiXFxuJyArXG4gICAgICAgICAgICAnc3ViZ3JpZCBuYW1lOiAnICsgKGNlbGxFdmVudC5zdWJncmlkLm5hbWUgPyAnXCInICsgY2VsbEV2ZW50LnN1YmdyaWQubmFtZSArICdcIicgOiAndW5kZWZpbmVkJylcbiAgICAgICAgKTtcbiAgICB9KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLXNldC10b3RhbHMtdmFsdWUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBkZXRhaWwgPSBlLmRldGFpbCxcbiAgICAgICAgICAgIGFyZWFzID0gZGV0YWlsLmFyZWFzIHx8IFsndG9wJywgJ2JvdHRvbSddO1xuXG4gICAgICAgIGFyZWFzLmZvckVhY2goZnVuY3Rpb24oYXJlYSkge1xuICAgICAgICAgICAgdmFyIG1ldGhvZE5hbWUgPSAnZ2V0JyArIGFyZWFbMF0udG9VcHBlckNhc2UoKSArIGFyZWEuc3Vic3RyKDEpICsgJ1RvdGFscycsXG4gICAgICAgICAgICAgICAgdG90YWxzUm93ID0gZ3JpZC5iZWhhdmlvci5kYXRhTW9kZWxbbWV0aG9kTmFtZV0oKTtcblxuICAgICAgICAgICAgdG90YWxzUm93W2RldGFpbC55XVtkZXRhaWwueF0gPSBkZXRhaWwudmFsdWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGdyaWQucmVwYWludCgpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgTGlzdGVuIGZvciBjZXJ0YWluIGtleSBwcmVzc2VzIGZyb20gZ3JpZCBvciBjZWxsIGVkaXRvci5cbiAgICAgKiBAZGVzYyBOT1RFOiBmaW5jYW52YXMncyBpbnRlcm5hbCBjaGFyIG1hcCB5aWVsZHMgbWl4ZWQgY2FzZSB3aGlsZSBmaW4tZWRpdG9yLWtleSogZXZlbnRzIGRvIG5vdC5cbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBOb3QgaGFuZGxlZC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBoYW5kbGVDdXJzb3JLZXkoZSkge1xuICAgICAgICB2YXIgZGV0YWlsID0gZS5kZXRhaWwsXG4gICAgICAgICAgICBrZXkgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGRldGFpbC5rZXkpLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZTsgLy8gbWVhbnMgZXZlbnQgaGFuZGxlZCBoZXJlaW5cblxuICAgICAgICBpZiAoZGV0YWlsLmN0cmwpIHtcbiAgICAgICAgICAgIGlmIChkZXRhaWwuc2hpZnQpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICcwJzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFRvVmlld3BvcnRDZWxsKDAsIDApOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICc5JzogaWYgKGdyaWQuc3RvcEVkaXRpbmcoKSkgeyBncmlkLnNlbGVjdFRvRmluYWxDZWxsKCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzgnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0VG9GaW5hbENlbGxPZkN1cnJlbnRSb3coKTsgfSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnNyc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RUb0ZpcnN0Q2VsbE9mQ3VycmVudFJvdygpOyB9IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnMCc6IGlmIChncmlkLnN0b3BFZGl0aW5nKCkpIHsgZ3JpZC5zZWxlY3RWaWV3cG9ydENlbGwoMCwgMCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzknOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0RmluYWxDZWxsKCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzgnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0RmluYWxDZWxsT2ZDdXJyZW50Um93KCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJzcnOiBpZiAoZ3JpZC5zdG9wRWRpdGluZygpKSB7IGdyaWQuc2VsZWN0Rmlyc3RDZWxsT2ZDdXJyZW50Um93KCk7IH0gYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1rZXlkb3duJywgaGFuZGxlQ3Vyc29yS2V5KTtcblxuICAgIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLWVkaXRvci1rZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyB2YXIgZGV0YWlsID0gZS5kZXRhaWwsXG4gICAgICAgIC8vICAgICBrZSA9IGRldGFpbC5rZXlFdmVudDtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gLy8gbW9yZSBkZXRhaWwsIHBsZWFzZVxuICAgICAgICAvLyBkZXRhaWwucHJpbWl0aXZlRXZlbnQgPSBrZTtcbiAgICAgICAgLy8gZGV0YWlsLmtleSA9IGtlLmtleUNvZGU7XG4gICAgICAgIC8vIGRldGFpbC5zaGlmdCA9IGtlLnNoaWZ0S2V5O1xuICAgICAgICAvL1xuICAgICAgICAvLyBoYW5kbGVDdXJzb3JLZXkoZSk7XG4gICAgfSk7XG5cbiAgICBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1zZWxlY3Rpb24tY2hhbmdlZCcsIGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICBpZiAoZS5kZXRhaWwuc2VsZWN0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyBzZWxlY3Rpb25zJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0byBnZXQgdGhlIHNlbGVjdGVkIHJvd3MgdW5jb21tZW50IHRoZSBiZWxvdy4uLi4uXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGdyaWQuZ2V0Um93U2VsZWN0aW9uTWF0cml4KCkpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhncmlkLmdldFJvd1NlbGVjdGlvbigpKTtcblxuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tcm93LXNlbGVjdGlvbi1jaGFuZ2VkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgZGV0YWlsID0gZS5kZXRhaWw7XG4gICAgICAgIC8vIE1vdmUgY2VsbCBzZWxlY3Rpb24gd2l0aCByb3cgc2VsZWN0aW9uXG4gICAgICAgIHZhciByb3dzID0gZGV0YWlsLnJvd3MsXG4gICAgICAgICAgICBzZWxlY3Rpb25zID0gZGV0YWlsLnNlbGVjdGlvbnM7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGdyaWQucHJvcGVydGllcy5zaW5nbGVSb3dTZWxlY3Rpb25Nb2RlICYmIC8vIGxldCdzIG9ubHkgYXR0ZW1wdCB0aGlzIHdoZW4gaW4gdGhpcyBtb2RlXG4gICAgICAgICAgICAhZ3JpZC5wcm9wZXJ0aWVzLm11bHRpcGxlU2VsZWN0aW9ucyAmJiAvLyBhbmQgb25seSB3aGVuIGluIHNpbmdsZSBzZWxlY3Rpb24gbW9kZVxuICAgICAgICAgICAgcm93cy5sZW5ndGggJiYgLy8gdXNlciBqdXN0IHNlbGVjdGVkIGEgcm93IChtdXN0IGJlIHNpbmdsZSByb3cgZHVlIHRvIG1vZGUgd2UncmUgaW4pXG4gICAgICAgICAgICBzZWxlY3Rpb25zLmxlbmd0aCAgLy8gdGhlcmUgd2FzIGEgY2VsbCByZWdpb24gc2VsZWN0ZWQgKG11c3QgYmUgdGhlIG9ubHkgb25lKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHZhciByZWN0ID0gZ3JpZC5zZWxlY3Rpb25Nb2RlbC5nZXRMYXN0U2VsZWN0aW9uKCksIC8vIHRoZSBvbmx5IGNlbGwgc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgeCA9IHJlY3QubGVmdCxcbiAgICAgICAgICAgICAgICB5ID0gcm93c1swXSwgLy8gd2Uga25vdyB0aGVyZSdzIG9ubHkgMSByb3cgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICB3aWR0aCA9IHJlY3QucmlnaHQgLSB4LFxuICAgICAgICAgICAgICAgIGhlaWdodCA9IDAsIC8vIGNvbGxhcHNlIHRoZSBuZXcgcmVnaW9uIHRvIG9jY3VweSBhIHNpbmdsZSByb3dcbiAgICAgICAgICAgICAgICBmaXJlU2VsZWN0aW9uQ2hhbmdlZEV2ZW50ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGdyaWQuc2VsZWN0aW9uTW9kZWwuc2VsZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQsIGZpcmVTZWxlY3Rpb25DaGFuZ2VkRXZlbnQpO1xuICAgICAgICAgICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocm93cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyByb3dzIHNlbGVjdGVkJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy93ZSBoYXZlIGEgZnVuY3Rpb24gY2FsbCB0byBjcmVhdGUgdGhlIHNlbGVjdGlvbiBtYXRyaXggYmVjYXVzZVxuICAgICAgICAvL3dlIGRvbid0IHdhbnQgdG8gY3JlYXRlIGFsb3Qgb2YgbmVlZGxlc3MgZ2FyYmFnZSBpZiB0aGUgdXNlclxuICAgICAgICAvL2lzIGp1c3QgbmF2aWdhdGluZyBhcm91bmRcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZC5nZXRSb3dTZWxlY3Rpb25NYXRyaXgoKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGdyaWQuZ2V0Um93U2VsZWN0aW9uKCkpO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdmaW4tY29sdW1uLXNlbGVjdGlvbi1jaGFuZ2VkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS5kZXRhaWwuY29sdW1ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyByb3dzIHNlbGVjdGVkJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy93ZSBoYXZlIGEgZnVuY3Rpb24gY2FsbCB0byBjcmVhdGUgdGhlIHNlbGVjdGlvbiBtYXRyaXggYmVjYXVzZVxuICAgICAgICAvL3dlIGRvbid0IHdhbnQgdG8gY3JlYXRlIGFsb3Qgb2YgbmVlZGxlc3MgZ2FyYmFnZSBpZiB0aGUgdXNlclxuICAgICAgICAvL2lzIGp1c3QgbmF2aWdhdGluZyBhcm91bmRcbiAgICAgICAgY29uc29sZS5sb2coZ3JpZC5nZXRDb2x1bW5TZWxlY3Rpb25NYXRyaXgoKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGdyaWQuZ2V0Q29sdW1uU2VsZWN0aW9uKCkpO1xuICAgIH0pO1xuXG4gICAgLy91bmNvbW1lbnQgdG8gY2FuY2VsIGVkaXRvciBwb3BwaW5nIHVwOlxuICAgIC8vIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZmluLXJlcXVlc3QtY2VsbC1lZGl0JywgZnVuY3Rpb24oZSkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH0pO1xuXG4gICAgLy91bmNvbW1lbnQgdG8gY2FuY2VsIHVwZGF0aW5nIHRoZSBtb2RlbCB3aXRoIHRoZSBuZXcgZGF0YTpcbiAgICAvLyBncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2Zpbi1iZWZvcmUtY2VsbC1lZGl0JywgZnVuY3Rpb24oZSkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH0pO1xufTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGVtbywgZ3JpZCkge1xuXG4gICAgdmFyIGZvb3RJbmNoUGF0dGVybiA9IC9eXFxzKigoKChcXGQrKScpP1xccyooKFxcZCspXCIpPyl8XFxkKylcXHMqJC87XG5cbiAgICB2YXIgZm9vdEluY2hMb2NhbGl6ZXIgPSB7XG4gICAgICAgIGZvcm1hdDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZlZXQgPSBNYXRoLmZsb29yKHZhbHVlIC8gMTIpO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gKGZlZXQgPyBmZWV0ICsgJ1xcJycgOiAnJykgKyAnICcgKyAodmFsdWUgJSAxMikgKyAnXCInO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIHBhcnNlOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgICAgIHZhciBpbmNoZXMsIGZlZXQsXG4gICAgICAgICAgICAgICAgcGFydHMgPSBzdHIubWF0Y2goZm9vdEluY2hQYXR0ZXJuKTtcbiAgICAgICAgICAgIGlmIChwYXJ0cykge1xuICAgICAgICAgICAgICAgIGZlZXQgPSBwYXJ0c1s0XTtcbiAgICAgICAgICAgICAgICBpbmNoZXMgPSBwYXJ0c1s2XTtcbiAgICAgICAgICAgICAgICBpZiAoZmVldCA9PT0gdW5kZWZpbmVkICYmIGluY2hlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGluY2hlcyA9IE51bWJlcihwYXJ0c1sxXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZmVldCA9IE51bWJlcihmZWV0IHx8IDApO1xuICAgICAgICAgICAgICAgICAgICBpbmNoZXMgPSBOdW1iZXIoaW5jaGVzIHx8IDApO1xuICAgICAgICAgICAgICAgICAgICBpbmNoZXMgPSAxMiAqIGZlZXQgKyBpbmNoZXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmNoZXMgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluY2hlcztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoJ2Zvb3QnLCBmb290SW5jaExvY2FsaXplcik7XG5cbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoJ3NpbmdkYXRlJywgbmV3IGdyaWQubG9jYWxpemF0aW9uLkRhdGVGb3JtYXR0ZXIoJ3poLVNHJykpO1xuXG4gICAgZ3JpZC5sb2NhbGl6YXRpb24uYWRkKCdwb3VuZHMnLCBuZXcgZ3JpZC5sb2NhbGl6YXRpb24uTnVtYmVyRm9ybWF0dGVyKCdlbi1VUycsIHtcbiAgICAgICAgc3R5bGU6ICdjdXJyZW5jeScsXG4gICAgICAgIGN1cnJlbmN5OiAnVVNEJ1xuICAgIH0pKTtcblxuICAgIGdyaWQubG9jYWxpemF0aW9uLmFkZCgnZnJhbmNzJywgbmV3IGdyaWQubG9jYWxpemF0aW9uLk51bWJlckZvcm1hdHRlcignZnItRlInLCB7XG4gICAgICAgIHN0eWxlOiAnY3VycmVuY3knLFxuICAgICAgICBjdXJyZW5jeTogJ0VVUidcbiAgICB9KSk7XG5cbiAgICBncmlkLmxvY2FsaXphdGlvbi5hZGQoe1xuICAgICAgICBuYW1lOiAnaGhtbScsIC8vIGFsdGVybmF0aXZlIHRvIGhhdmluZyB0byBoYW1lIGxvY2FsaXplciBpbiBgZ3JpZC5sb2NhbGl6YXRpb24uYWRkYFxuXG4gICAgICAgIC8vIHJldHVybnMgZm9ybWF0dGVkIHN0cmluZyBmcm9tIG51bWJlclxuICAgICAgICBmb3JtYXQ6IGZ1bmN0aW9uKG1pbnMpIHtcbiAgICAgICAgICAgIHZhciBoaCA9IE1hdGguZmxvb3IobWlucyAvIDYwKSAlIDEyIHx8IDEyLCAvLyBtb2R1bG8gMTIgaHJzIHdpdGggMCBiZWNvbWluZyAxMlxuICAgICAgICAgICAgICAgIG1tID0gKG1pbnMgJSA2MCArIDEwMCArICcnKS5zdWJzdHIoMSwgMiksXG4gICAgICAgICAgICAgICAgQW1QbSA9IG1pbnMgPCBkZW1vLk5PT04gPyAnQU0nIDogJ1BNJztcbiAgICAgICAgICAgIHJldHVybiBoaCArICc6JyArIG1tICsgJyAnICsgQW1QbTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbnZhbGlkOiBmdW5jdGlvbihoaG1tKSB7XG4gICAgICAgICAgICByZXR1cm4gIS9eKDA/WzEtOV18MVswLTJdKTpbMC01XVxcZCQvLnRlc3QoaGhtbSk7IC8vIDEyOjU5IG1heFxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIHJldHVybnMgbnVtYmVyIGZyb20gZm9ybWF0dGVkIHN0cmluZ1xuICAgICAgICBwYXJzZTogZnVuY3Rpb24oaGhtbSkge1xuICAgICAgICAgICAgdmFyIHBhcnRzID0gaGhtbS5tYXRjaCgvXihcXGQrKTooXFxkezJ9KSQvKTtcbiAgICAgICAgICAgIHJldHVybiBOdW1iZXIocGFydHNbMV0pICogNjAgKyBOdW1iZXIocGFydHNbMl0pO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZ3JpZDtcblxufTtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKiBnbG9iYWxzIGZpbiwgcGVvcGxlMSAqL1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1hbGVydCovXG5cbid1c2Ugc3RyaWN0Jztcblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGRlbW8gPSB3aW5kb3cuZGVtbyA9IHtcbiAgICAgICAgc2V0IHZlbnQoc3RhcnQpIHsgd2luZG93LmdyaWRbc3RhcnQgPyAnbG9nU3RhcnQnIDogJ2xvZ1N0b3AnXSgpOyB9LFxuICAgICAgICByZXNldDogcmVzZXQsXG4gICAgICAgIHNldERhdGE6IHNldERhdGEsXG4gICAgICAgIHRvZ2dsZUVtcHR5RGF0YTogdG9nZ2xlRW1wdHlEYXRhLFxuICAgICAgICByZXNldERhdGE6IHJlc2V0RGF0YVxuICAgIH07XG5cbiAgICB2YXIgSHlwZXJncmlkID0gZmluLkh5cGVyZ3JpZCxcbiAgICAgICAgaW5pdFN0YXRlID0gcmVxdWlyZSgnLi9zZXRTdGF0ZScpLFxuICAgICAgICBpbml0Q2VsbFJlbmRlcmVycyA9IHJlcXVpcmUoJy4vY2VsbHJlbmRlcmVycycpLFxuICAgICAgICBpbml0Rm9ybWF0dGVycyA9IHJlcXVpcmUoJy4vZm9ybWF0dGVycycpLFxuICAgICAgICBpbml0Q2VsbEVkaXRvcnMgPSByZXF1aXJlKCcuL2NlbGxlZGl0b3JzJyksXG4gICAgICAgIGluaXREYXNoYm9hcmQgPSByZXF1aXJlKCcuL2Rhc2hib2FyZCcpLFxuICAgICAgICBpbml0RXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxuICAgIC8vIGNvbnZlcnQgZmllbGQgbmFtZXMgY29udGFpbmluZyB1bmRlcnNjb3JlIHRvIGNhbWVsIGNhc2UgYnkgb3ZlcnJpZGluZyBjb2x1bW4gZW51bSBkZWNvcmF0b3JcbiAgICBIeXBlcmdyaWQuYmVoYXZpb3JzLkpTT04ucHJvdG90eXBlLmNvbHVtbkVudW1LZXkgPSBIeXBlcmdyaWQuYmVoYXZpb3JzLkpTT04uY29sdW1uRW51bURlY29yYXRvcnMudG9DYW1lbENhc2U7XG5cbiAgICB2YXIgc2NoZW1hID0gSHlwZXJncmlkLmxpYi5maWVsZHMuZ2V0U2NoZW1hKHBlb3BsZTEpO1xuXG4gICAgLy8gYXMgb2YgdjIuMS42LCBjb2x1bW4gcHJvcGVydGllcyBjYW4gYWxzbyBiZSBpbml0aWFsaXplZCBmcm9tIGN1c3RvbSBzY2hlbWEgKGFzIHdlbGwgYXMgZnJvbSBhIGdyaWQgc3RhdGUgb2JqZWN0KS5cbiAgICAvLyBUaGUgZm9sbG93aW5nIGRlbW9uc3RyYXRlcyB0aGlzLiBOb3RlIHRoYXQgZGVtby9zZXRTdGF0ZS5qcyBhbHNvIHNldHMgcHJvcHMgb2YgJ2hlaWdodCcgY29sdW1uLiBUaGUgc2V0U3RhdGVcbiAgICAvLyBjYWxsIHRoZXJlaW4gd2FzIGNoYW5nZWQgdG8gYWRkU3RhdGUgdG8gYWNjb21tb2RhdGUgKGVsc2Ugc2NoZW1hIHByb3BzIGRlZmluZWQgaGVyZSB3b3VsZCBoYXZlIGJlZW4gY2xlYXJlZCkuXG4gICAgT2JqZWN0LmFzc2lnbihzY2hlbWEuZmluZChmdW5jdGlvbihjb2x1bW5TY2hlbWEpIHsgcmV0dXJuIGNvbHVtblNjaGVtYS5uYW1lID09PSAnaGVpZ2h0JzsgfSksIHtcbiAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAvLyBmb3JtYXQ6ICdmb290JyAtLS0gZm9yIGRlbW8gcHVycG9zZXMsIHRoaXMgcHJvcCBiZWluZyBzZXQgaW4gc2V0U3RhdGUuanMgKHNlZSlcbiAgICB9KTtcblxuICAgIHZhciBncmlkT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGRhdGE6IHBlb3BsZTEsXG4gICAgICAgICAgICBtYXJnaW46IHsgYm90dG9tOiAnMTdweCcsIHJpZ2h0OiAnMTdweCd9LFxuICAgICAgICAgICAgc2NoZW1hOiBzY2hlbWEsXG4gICAgICAgICAgICBwbHVnaW5zOiByZXF1aXJlKCdmaW4taHlwZXJncmlkLWV2ZW50LWxvZ2dlcicpLFxuICAgICAgICAgICAgc3RhdGU6IHsgY29sb3I6ICdvcmFuZ2UnIH1cbiAgICAgICAgfSxcbiAgICAgICAgZ3JpZCA9IHdpbmRvdy5ncmlkID0gd2luZG93LmcgPSBuZXcgSHlwZXJncmlkKCdkaXYjanNvbi1leGFtcGxlJywgZ3JpZE9wdGlvbnMpLFxuICAgICAgICBiZWhhdmlvciA9IHdpbmRvdy5iID0gZ3JpZC5iZWhhdmlvcixcbiAgICAgICAgZGF0YU1vZGVsID0gd2luZG93Lm0gPSBiZWhhdmlvci5kYXRhTW9kZWwsXG4gICAgICAgIGlkeCA9IGJlaGF2aW9yLmNvbHVtbkVudW07XG5cblxuICAgIGNvbnNvbGUubG9nKCdGaWVsZHM6Jyk7ICBjb25zb2xlLmRpcihiZWhhdmlvci5kYXRhTW9kZWwuc2NoZW1hLm1hcChmdW5jdGlvbihjcykgeyByZXR1cm4gY3MubmFtZTsgfSkpO1xuICAgIGNvbnNvbGUubG9nKCdIZWFkZXJzOicpOyBjb25zb2xlLmRpcihiZWhhdmlvci5kYXRhTW9kZWwuc2NoZW1hLm1hcChmdW5jdGlvbihjcykgeyByZXR1cm4gY3MuaGVhZGVyOyB9KSk7XG4gICAgY29uc29sZS5sb2coJ0luZGV4ZXM6Jyk7IGNvbnNvbGUuZGlyKGlkeCk7XG5cbiAgICBmdW5jdGlvbiBzZXREYXRhKGRhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuICAgICAgICBvcHRpb25zLnNjaGVtYSA9IG9wdGlvbnMuc2NoZW1hIHx8IFtdO1xuICAgICAgICBncmlkLnNldERhdGEoZGF0YSwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIGdyaWQucmVzZXQoKTtcbiAgICAgICAgaW5pdEV2ZW50cyhkZW1vLCBncmlkKTtcbiAgICB9XG5cbiAgICB2YXIgb2xkRGF0YTtcbiAgICBmdW5jdGlvbiB0b2dnbGVFbXB0eURhdGEoKSB7XG4gICAgICAgIGlmICghb2xkRGF0YSkge1xuICAgICAgICAgICAgb2xkRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhTW9kZWwuZ2V0RGF0YSgpLFxuICAgICAgICAgICAgICAgIHNjaGVtYTogZGF0YU1vZGVsLnNjaGVtYSxcbiAgICAgICAgICAgICAgICBhY3RpdmVDb2x1bW5zOiBiZWhhdmlvci5nZXRBY3RpdmVDb2x1bW5zKCkubWFwKGZ1bmN0aW9uKGNvbHVtbikgeyByZXR1cm4gY29sdW1uLmluZGV4OyB9KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vaW1wb3J0YW50IHRvIHNldCB0b3AgdG90YWxzIGZpcnN0XG4gICAgICAgICAgICBzZXREYXRhKFtdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vaW1wb3J0YW50IHRvIHNldCB0b3AgdG90YWxzIGZpcnN0XG4gICAgICAgICAgICBzZXREYXRhKG9sZERhdGEuZGF0YSwgb2xkRGF0YS5zY2hlbWEpO1xuICAgICAgICAgICAgYmVoYXZpb3Iuc2V0Q29sdW1uSW5kZXhlcyhvbGREYXRhLmFjdGl2ZUNvbHVtbnMpO1xuICAgICAgICAgICAgb2xkRGF0YSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc2V0RGF0YSgpIHtcbiAgICAgICAgc2V0RGF0YShwZW9wbGUxKTtcbiAgICAgICAgaW5pdFN0YXRlKGRlbW8sIGdyaWQpO1xuICAgIH1cblxuICAgIGluaXRDZWxsUmVuZGVyZXJzKGRlbW8sIGdyaWQpO1xuICAgIGluaXRGb3JtYXR0ZXJzKGRlbW8sIGdyaWQpO1xuICAgIGluaXRDZWxsRWRpdG9ycyhkZW1vLCBncmlkKTtcbiAgICBpbml0RXZlbnRzKGRlbW8sIGdyaWQpO1xuICAgIGluaXREYXNoYm9hcmQoZGVtbywgZ3JpZCk7XG4gICAgaW5pdFN0YXRlKGRlbW8sIGdyaWQpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkZW1vLCBncmlkKSB7XG5cbiAgICB2YXIgaWR4ID0gZ3JpZC5iZWhhdmlvci5jb2x1bW5FbnVtO1xuXG4gICAgdmFyIHN0YXRlID0ge1xuICAgICAgICBjb2x1bW5JbmRleGVzOiBbXG4gICAgICAgICAgICBpZHgubGFzdE5hbWUsXG4gICAgICAgICAgICBpZHgudG90YWxOdW1iZXJPZlBldHNPd25lZCxcbiAgICAgICAgICAgIGlkeC5oZWlnaHQsXG4gICAgICAgICAgICBpZHguYmlydGhEYXRlLFxuICAgICAgICAgICAgaWR4LmJpcnRoVGltZSxcbiAgICAgICAgICAgIGlkeC5iaXJ0aFN0YXRlLFxuICAgICAgICAgICAgLy8gaWR4LnJlc2lkZW5jZVN0YXRlLFxuICAgICAgICAgICAgaWR4LmVtcGxveWVkLFxuICAgICAgICAgICAgLy8gaWR4LmZpcnN0TmFtZSxcbiAgICAgICAgICAgIGlkeC5pbmNvbWUsXG4gICAgICAgICAgICBpZHgudHJhdmVsLFxuICAgICAgICAgICAgLy8gaWR4LnNxdWFyZU9mSW5jb21lXG4gICAgICAgIF0sXG5cbiAgICAgICAgbm9EYXRhTWVzc2FnZTogJ05vIERhdGEgdG8gRGlzcGxheScsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3doaXRlJyxcbiAgICAgICAgZm9udDogJ25vcm1hbCBzbWFsbCBnYXJhbW9uZCcsXG4gICAgICAgIHJvd1N0cmlwZXM6IFtcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHsgY29sb3I6ICcjMTE2NjExJywgYmFja2dyb3VuZENvbG9yOiAnI2U4ZmZlOCcsIGZvbnQ6ICdpdGFsaWMgc21hbGwgZ2FyYW1vbmQnIH0sXG4gICAgICAgICAgICB7IGNvbG9yOiAnIzExNjYxMScsIGJhY2tncm91bmRDb2xvcjogJyNlOGZmZTgnLCBmb250OiAnaXRhbGljIHNtYWxsIGdhcmFtb25kJyB9LFxuICAgICAgICAgICAgeyBjb2xvcjogJyMxMTY2MTEnLCBiYWNrZ3JvdW5kQ29sb3I6ICcjZThmZmU4JywgZm9udDogJ2l0YWxpYyBzbWFsbCBnYXJhbW9uZCcgfVxuICAgICAgICBdLFxuXG4gICAgICAgIGZpeGVkQ29sdW1uQ291bnQ6IDEsXG4gICAgICAgIGZpeGVkUm93Q291bnQ6IDQsXG5cbiAgICAgICAgY29sdW1uQXV0b3NpemluZzogZmFsc2UsXG4gICAgICAgIGhlYWRlclRleHRXcmFwcGluZzogdHJ1ZSxcblxuICAgICAgICBoYWxpZ246ICdsZWZ0JyxcbiAgICAgICAgcmVuZGVyRmFsc3k6IHRydWUsXG5cbiAgICAgICAgc2Nyb2xsYmFySG92ZXJPZmY6ICd2aXNpYmxlJyxcbiAgICAgICAgc2Nyb2xsYmFySG92ZXJPdmVyOiAndmlzaWJsZScsXG4gICAgICAgIGNvbHVtbkhlYWRlckJhY2tncm91bmRDb2xvcjogJ3BpbmsnLFxuXG4gICAgICAgIGNoZWNrYm94T25seVJvd1NlbGVjdGlvbnM6IHRydWUsXG5cbiAgICAgICAgYXV0b1NlbGVjdFJvd3M6IHRydWUsXG5cbiAgICAgICAgcm93czoge1xuICAgICAgICAgICAgaGVhZGVyOiB7XG4gICAgICAgICAgICAgICAgMDoge1xuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDQwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGNhbGN1bGF0b3JzOiB7XG4gICAgICAgICAgICBBZGQxMDogJ2Z1bmN0aW9uKGRhdGFSb3csY29sdW1uTmFtZSkgeyByZXR1cm4gZGF0YVJvd1tjb2x1bW5OYW1lXSArIDEwOyB9J1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEFOVEktUEFUVEVSTlMgRk9MTE9XXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFNldHRpbmcgY29sdW1uLCByb3csIGNlbGwgcHJvcHMgaGVyZSBpbiBhIHN0YXRlIG9iamVjdCBpcyBhIGxlZ2FjeSBmZWF0dXJlLlxuICAgICAgICAvLyBEZXZlbG9wZXJzIG1heSBmaW5kIGl0IG1vcmUgdXNlZnVsIHRvIHNldCBjb2x1bW4gcHJvcHMgaW4gY29sdW1uIHNjaGVtYSAoYXMgb2YgdjIuMS42KSxcbiAgICAgICAgLy8gcm93IHByb3BzIGluIHJvdyBtZXRhZGF0YSAoYXMgb2YgdjIuMS4wKSwgYW5kIGNlbGwgcHJvcHMgaW4gY29sdW1uIG1ldGFkYXRhIChhcyBvZiB2Mi4wLjIpLFxuICAgICAgICAvLyB3aGljaCB3b3VsZCB0aGVuIHBlcnNpc3QgYWNyb3NzIHNldFN0YXRlIGNhbGxzIHdoaWNoIGNsZWFyIHRoZXNlIHByb3BlcnRpZXMgb2JqZWN0c1xuICAgICAgICAvLyBiZWZvcmUgYXBwbHlpbmcgbmV3IHZhbHVlcy4gSW4gdGhpcyBkZW1vLCB3ZSBoYXZlIGNoYW5nZWQgdGhlIHNldFN0YXRlIGNhbGwgYmVsb3cgdG8gYWRkU3RhdGVcbiAgICAgICAgLy8gKHdoaWNoIGRvZXMgbm90IGNsZWFyIHRoZSBwcm9wZXJ0aWVzIG9iamVjdCBmaXJzdCkgdG8gc2hvdyBob3cgdG8gc2V0IGEgY29sdW1uIHByb3AgaGVyZSAqYW5kKlxuICAgICAgICAvLyBhIGRpZmZlcmVudCBwcm9wIG9uIHRoZSBzYW1lIGNvbHVtbiBpbiBzY2hlbWEgKGluIGluZGV4LmpzKS5cblxuICAgICAgICBjb2x1bW5zOiB7XG4gICAgICAgICAgICBoZWlnaHQ6IHtcbiAgICAgICAgICAgICAgICAvLyBoYWxpZ246ICdyaWdodCcsIC0tLSBmb3IgZGVtbyBwdXJwb3NlcywgdGhpcyBwcm9wIGJlaW5nIHNldCBpbiBpbmRleC5qcyAoc2VlKVxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ2Zvb3QnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBjYW1lbGNhc2UgKi9cbiAgICAgICAgICAgIGxhc3RfbmFtZToge1xuICAgICAgICAgICAgICAgIGNvbHVtbkhlYWRlckJhY2tncm91bmRDb2xvcjogJyMxNDJCNkYnLCAvL2RhcmsgYmx1ZVxuICAgICAgICAgICAgICAgIGNvbHVtbkhlYWRlckNvbG9yOiAnd2hpdGUnLFxuICAgICAgICAgICAgICAgIGNvbHVtbkhlYWRlckhhbGlnbjogJ2xlZnQnLFxuICAgICAgICAgICAgICAgIHJpZ2h0SWNvbjogJ2Rvd24tcmVjdGFuZ2xlJyxcbiAgICAgICAgICAgICAgICBsaW5rOiB0cnVlXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBmaXJzdF9uYW1lOiB7XG5cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHRvdGFsX251bWJlcl9vZl9wZXRzX293bmVkOiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgIGNhbGN1bGF0b3I6ICdBZGQxMCcsXG4gICAgICAgICAgICAgICAgY29sb3I6ICdncmVlbidcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGJpcnRoRGF0ZToge1xuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3NpbmdkYXRlJyxcbiAgICAgICAgICAgICAgICByaWdodEljb246ICdjYWxlbmRhcicsXG4gICAgICAgICAgICAgICAgLy9zdHJpa2VUaHJvdWdoOiB0cnVlXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBiaXJ0aFRpbWU6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgZWRpdG9yOiAndGltZScsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnaGhtbSdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGJpcnRoU3RhdGU6IHtcbiAgICAgICAgICAgICAgICBlZGl0b3I6ICdjb2xvcnRleHQnLFxuICAgICAgICAgICAgICAgIHJpZ2h0SWNvbjogJ2Rvd24tcmVjdGFuZ2xlJ1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVzaWRlbmNlU3RhdGU6IHtcbiAgICAgICAgICAgICAgICByaWdodEljb246ICdkb3duLXJlY3RhbmdsZSdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGVtcGxveWVkOiB7XG4gICAgICAgICAgICAgICAgaGFsaWduOiAncmlnaHQnLFxuICAgICAgICAgICAgICAgIHJlbmRlcmVyOiAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd3aGl0ZSdcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGluY29tZToge1xuICAgICAgICAgICAgICAgIGhhbGlnbjogJ3JpZ2h0JyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdwb3VuZHMnXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB0cmF2ZWw6IHtcbiAgICAgICAgICAgICAgICBoYWxpZ246ICdyaWdodCcsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnZnJhbmNzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEZvbGxvd2luZyBgY2VsbHNgIGV4YW1wbGUgc2V0cyBwcm9wZXJ0aWVzIGZvciBhIGNlbGwgaW4gdGhlIGRhdGEgc3ViZ3JpZC5cbiAgICAgICAgLy8gU3BlY2lmeWluZyBjZWxsIHByb3BlcnRpZXMgaGVyZSBpbiBncmlkIHN0YXRlIG1heSBiZSB1c2VmdWwgZm9yIHN0YXRpYyBkYXRhIHN1YmdyaWRzXG4gICAgICAgIC8vIHdoZXJlIGNlbGwgY29vcmRpbmF0ZXMgYXJlIHBlcm1hbmVudGx5IGFzc2lnbmVkLiBPdGhlcndpc2UsIGZvciBteSBkeW5hbWljIGdyaWQgZGF0YSxcbiAgICAgICAgLy8gY2VsbCBwcm9wZXJ0aWVzIG1pZ2h0IG1vcmUgcHJvcGVybHkgYWNjb21wYW55IHRoZSBkYXRhIGl0c2VsZiBhcyBtZXRhZGF0YVxuICAgICAgICAvLyAoaS5lLiwgYXMgYSBoYXNoIGluIGRhdGFSb3cuX19NRVRBW2ZpZWxkTmFtZV0pLlxuICAgICAgICBjZWxsczoge1xuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIDE2OiB7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udDogJzEwcHQgVGFob21hJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnbGlnaHRibHVlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBoYWxpZ246ICdsZWZ0J1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdyaWQuYWRkU3RhdGUoc3RhdGUpOyAvLyBjaGFuZ2VkIGZyb20gc2V0U3RhdGUgc28gJ2hlaWdodCcgcHJvcHMgc2V0IHdpdGggc2NoZW1hIGluIGluZGV4LmpzIHdvdWxkbid0IGJlIGNsZWFyZWRcblxuICAgIGdyaWQudGFrZUZvY3VzKCk7XG5cbiAgICBkZW1vLnJlc2V0RGFzaGJvYXJkKCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2F0YWxvZyA9IHJlcXVpcmUoJ29iamVjdC1jYXRhbG9nJyk7XG52YXIgZmluZCA9IHJlcXVpcmUoJ21hdGNoLXBvaW50Jyk7XG52YXIgR3JleWxpc3QgPSByZXF1aXJlKCdncmV5bGlzdCcpO1xuXG5cbnZhciBpc0RPTSA9IChcbiAgICB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyAmJlxuICAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh3aW5kb3cpID09PSAnW29iamVjdCBXaW5kb3ddJyAmJlxuICAgIHR5cGVvZiB3aW5kb3cuTm9kZSA9PT0gJ2Z1bmN0aW9uJ1xuKTtcblxudmFyIGlzRG9tTm9kZSA9IGlzRE9NID8gZnVuY3Rpb24ob2JqKSB7IHJldHVybiBvYmogaW5zdGFuY2VvZiB3aW5kb3cuTm9kZSB9IDogZnVuY3Rpb24oKSB7fTtcblxuXG4vKipcbiAqIEBzdW1tYXJ5IFNlYXJjaCBhbiBvYmplY3QncyBjb2RlIGZvciBwYXR0ZXJuIG1hdGNoZXMuXG4gKiBAZGVzYyBTZWFyY2hlcyBhbGwgY29kZSBpbiB0aGUgdmlzaWJsZSBleGVjdXRpb24gY29udGV4dCB1c2luZyB0aGUgcHJvdmlkZWQgcmVnZXggcGF0dGVybiwgcmV0dXJuaW5nIHRoZSBlbnRpcmUgcGF0dGVybiBtYXRjaC5cbiAqXG4gKiBJZiBjYXB0dXJlIGdyb3VwcyBhcmUgc3BlY2lmaWVkIGluIHRoZSBwYXR0ZXJuLCByZXR1cm5zIHRoZSBsYXN0IGNhcHR1cmUgZ3JvdXAgbWF0Y2gsIHVubGVzcyBgb3B0aW9ucy5jYXB0dXJlR3JvdXBgIGlzIGRlZmluZWQsIGluIHdoaWNoIGNhc2UgcmV0dXJucyB0aGUgZ3JvdXAgd2l0aCB0aGF0IGluZGV4IHdoZXJlIGAwYCBtZWFucyB0aGUgZW50aXJlIHBhdHRlcm4sIF9ldGMuXyAocGVyIGBTdHJpbmcucHJvdG90eXBlLm1hdGNoYCkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfSBwYXR0ZXJuIC0gU2VhcmNoIGFyZ3VtZW50LlxuICogRG9uJ3QgdXNlIGdsb2JhbCBmbGFnIG9uIFJlZ0V4cDsgaXQncyB1bm5lY2Vzc2FyeSBhbmQgc3VwcHJlc3NlcyBzdWJtYXRjaGVzIG9mIGNhcHR1cmUgZ3JvdXBzLlxuICpcbiAqIEBwYXJhbSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5jYXB0dXJlR3JvdXBdIC0gSWZmIGRlZmluZWQsIGluZGV4IG9mIGEgc3BlY2lmaWMgY2FwdHVyZSBncm91cCB0byByZXR1cm4gZm9yIGVhY2ggbWF0Y2guXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJlY3Vyc2VdIC0gRXF1aXZhbGVudCB0byBzZXR0aW5nIGJvdGggYHJlY3Vyc2VPd25gIGFuZCBgcmVjdXJzZUFuY2VzdG9yc2AuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJlY3Vyc2VPd25dIC0gUmVjdXJzZSBvd24gc3Vib2JqZWN0cy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmVjdXJzZUFuY2VzdG9yc10gLSBSZWN1cnNlIHN1Ym9iamVjdHMgb2Ygb2JqZWN0cyBvZiB0aGUgZW50aXJlIHByb3RvdHlwZSBjaGFpbi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5ncmV5bGlzdF0gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L2dyZXlsaXN0XG4gKiBAcGFyYW0gW29wdGlvbnMuZ3JleWxpc3Qud2hpdGVdIC0gSWYgZ2l2ZW4sIG9ubHkgbGlzdGVkIG1hdGNoZXMgYXJlIGluY2x1ZGVkIGluIHRoZSByZXN1bHRzLlxuICogQHBhcmFtIFtvcHRpb25zLmdyZXlsaXN0LmJsYWNrXSAtIElmIGdpdmVuLCBsaXN0ZWQgbWF0Y2hlcyBhcmUgZXhjbHVkZWQgZnJvbSB0aGUgcmVzdWx0cy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuY2F0YWxvZ10gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L29iamVjdC1jYXRhbG9nXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNhdGFsb2cub3duXSAtIE9ubHkgc2VhcmNoIG93biBvYmplY3Q7IG90aGVyd2lzZSBzZWFyY2ggb3duICsgZW50aXJlIHByb3RvdHlwZSBjaGFpbi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy5jYXRhbG9nLmdyZXlsaXN0XSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvZ3JleWxpc3RcbiAqIEBwYXJhbSBbb3B0aW9ucy5jYXRhbG9nLmdyZXlsaXN0LndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBtZW1iZXJzIGFyZSBjYXRhbG9nZWQuXG4gKiBAcGFyYW0gW29wdGlvbnMuY2F0YWxvZy5ncmV5bGlzdC5ibGFja10gLSBJZiBnaXZlbiwgbGlzdGVkIG1lbWJlcnMgYXJlICpub3QqIGNhdGFsb2dlZC5cbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nW119IFBhdHRlcm4gbWF0Y2hlcy5cbiAqL1xuZnVuY3Rpb24gbWF0Y2gocGF0dGVybiwgb3B0aW9ucywgYnlHcmV5bGlzdCwgbWF0Y2hlcywgc2Nhbm5lZCkge1xuICAgIHZhciB0b3BMZXZlbENhbGwgPSAhbWF0Y2hlcztcblxuICAgIGlmICh0b3BMZXZlbENhbGwpIHtcbiAgICAgICAgLy8gdGhpcyBpcyB0aGUgdG9wLWxldmVsIChub24tcmVjdXJzZWQpIGNhbGwgc28gaW50aWFsaXplOlxuICAgICAgICB2YXIgZ3JleWxpc3QgPSBuZXcgR3JleWxpc3Qob3B0aW9ucyAmJiBvcHRpb25zLmdyZXlsaXN0KTtcbiAgICAgICAgYnlHcmV5bGlzdCA9IGdyZXlsaXN0LnRlc3QuYmluZChncmV5bGlzdCk7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBtYXRjaGVzID0gW107XG4gICAgICAgIHNjYW5uZWQgPSBbXTtcbiAgICB9XG5cbiAgICB2YXIgcm9vdCA9IHRoaXM7XG4gICAgdmFyIG1lbWJlcnMgPSBjYXRhbG9nLmNhbGwocm9vdCwgb3B0aW9ucy5jYXRhbG9nKTtcblxuICAgIHNjYW5uZWQucHVzaChyb290KTtcblxuICAgIE9iamVjdC5rZXlzKG1lbWJlcnMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB2YXIgb2JqID0gbWVtYmVyc1trZXldO1xuICAgICAgICB2YXIgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpO1xuXG4gICAgICAgIGlmIChkZXNjcmlwdG9yLnZhbHVlID09PSBtYXRjaCkge1xuICAgICAgICAgICAgcmV0dXJuOyAvLyBkb24ndCBjYXRhbG9nIHNlbGYgd2hlbiBmb3VuZCB0byBoYXZlIGJlZW4gbWl4ZWQgaW5cbiAgICAgICAgfVxuXG4gICAgICAgIE9iamVjdC5rZXlzKGRlc2NyaXB0b3IpLmZvckVhY2goZnVuY3Rpb24gKHByb3BOYW1lKSB7XG4gICAgICAgICAgICB2YXIgaGl0cywgcHJvcCA9IGRlc2NyaXB0b3JbcHJvcE5hbWVdO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHByb3AgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9wTmFtZSBtdXN0IGJlIGBnZXRgIG9yIGBzZXRgIG9yIGB2YWx1ZWBcbiAgICAgICAgICAgICAgICBoaXRzID0gZmluZChwcm9wLnRvU3RyaW5nKCksIHBhdHRlcm4sIG9wdGlvbnMuY2FwdHVyZUdyb3VwKS5maWx0ZXIoYnlHcmV5bGlzdCk7XG4gICAgICAgICAgICAgICAgaGl0cy5mb3JFYWNoKGZ1bmN0aW9uKGhpdCkgeyBtYXRjaGVzLnB1c2goaGl0KTsgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgIChvcHRpb25zLnJlY3Vyc2UgfHwgb3B0aW9ucy5yZWN1cnNlT3duICYmIG9iaiA9PT0gcm9vdCB8fCBvcHRpb25zLnJlY3Vyc2VDaGFpbiAmJiBvYmogIT09IHJvb3QpICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIHByb3AgPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICAgICAgIWlzRG9tTm9kZShwcm9wKSAmJiAvLyBkb24ndCBzZWFyY2ggRE9NIG9iamVjdHNcbiAgICAgICAgICAgICAgICBzY2FubmVkLmluZGV4T2YocHJvcCkgPCAwIC8vIGRvbid0IHJlY3Vyc2Ugb24gb2JqZWN0cyBhbHJlYWR5IHNjYW5uZWRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIC8vIHByb3BOYW1lIG11c3QgYmUgYHZhbHVlYFxuICAgICAgICAgICAgICAgIG1hdGNoLmNhbGwocHJvcCwgcGF0dGVybiwgb3B0aW9ucywgYnlHcmV5bGlzdCwgbWF0Y2hlcywgc2Nhbm5lZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaWYgKHRvcExldmVsQ2FsbCkge1xuICAgICAgICBtYXRjaGVzLnNvcnQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hlcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtYXRjaDsiLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGxvZ0V2ZW50T2JqZWN0KGUpIHtcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsIGUpO1xufVxuXG5mdW5jdGlvbiBsb2dEZXRhaWwoZSkge1xuICAgIHRoaXMubG9nKGUudHlwZSwgJzo6JywgZS5kZXRhaWwpO1xufVxuXG5mdW5jdGlvbiBsb2dTY3JvbGwoZSkge1xuICAgIHRoaXMubG9nKGUudHlwZSwgJzo6JywgZS5kZXRhaWwudmFsdWUpO1xufVxuXG5mdW5jdGlvbiBsb2dDZWxsKGUpIHtcbiAgICB2YXIgZ0NlbGwgPSBlLmRldGFpbC5ncmlkQ2VsbDtcbiAgICB2YXIgZENlbGwgPSBlLmRldGFpbC5kYXRhQ2VsbDtcbiAgICB0aGlzLmxvZyhlLnR5cGUsICc6OicsXG4gICAgICAgICdncmlkLWNlbGw6JywgeyB4OiBnQ2VsbC54LCB5OiBnQ2VsbC55IH0sXG4gICAgICAgICdkYXRhLWNlbGw6JywgeyB4OiBkQ2VsbC54LCB5OiBkQ2VsbC55IH0pO1xufVxuXG5mdW5jdGlvbiBsb2dTZWxlY3Rpb24oZSkge1xuICAgIHRoaXMubG9nKGUudHlwZSwgJzo6JywgZS5kZXRhaWwucm93cywgZS5kZXRhaWwuY29sdW1ucywgZS5kZXRhaWwuc2VsZWN0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIGxvZ1JvdyhlKSB7XG4gICAgdmFyIHJvd0NvbnRleHQgPSBlLmRldGFpbC5wcmltaXRpdmVFdmVudC5kYXRhUm93O1xuICAgIHRoaXMubG9nKGUudHlwZSwgJzo6JywgJ3Jvdy1jb250ZXh0OicsIHJvd0NvbnRleHQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnZmluLWNlbGwtZW50ZXInOiBsb2dDZWxsLFxuICAgICdmaW4tY2xpY2snOiBsb2dDZWxsLFxuICAgICdmaW4tZG91YmxlLWNsaWNrJzogbG9nUm93LFxuICAgICdmaW4tc2VsZWN0aW9uLWNoYW5nZWQnOiBsb2dTZWxlY3Rpb24sXG4gICAgJ2Zpbi1jb250ZXh0LW1lbnUnOiBsb2dDZWxsLFxuXG4gICAgJ2Zpbi1zY3JvbGwteCc6IGxvZ1Njcm9sbCxcbiAgICAnZmluLXNjcm9sbC15JzogbG9nU2Nyb2xsLFxuXG4gICAgJ2Zpbi1yb3ctc2VsZWN0aW9uLWNoYW5nZWQnOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1jb2x1bW4tc2VsZWN0aW9uLWNoYW5nZWQnOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1lZGl0b3ItZGF0YS1jaGFuZ2UnOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1lZGl0b3Ita2V5dXAnOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1lZGl0b3Ita2V5cHJlc3MnOiBsb2dEZXRhaWwsXG4gICAgJ2Zpbi1lZGl0b3Ita2V5ZG93bic6IGxvZ0RldGFpbCxcbiAgICAnZmluLWdyb3Vwcy1jaGFuZ2VkJzogbG9nRGV0YWlsLFxuXG4gICAgJ2Zpbi1maWx0ZXItYXBwbGllZCc6IGxvZ0V2ZW50T2JqZWN0LFxuICAgICdmaW4tcmVxdWVzdC1jZWxsLWVkaXQnOiBsb2dFdmVudE9iamVjdCxcbiAgICAnZmluLWJlZm9yZS1jZWxsLWVkaXQnOiBsb2dFdmVudE9iamVjdCxcbiAgICAnZmluLWFmdGVyLWNlbGwtZWRpdCc6IGxvZ0V2ZW50T2JqZWN0XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgU3RhckxvZyA9IHJlcXVpcmUoJ3N0YXJsb2cnKTtcblxudmFyIGV2ZW50TG9nZ2VyUGx1Z2luID0ge1xuXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKG9wdGlvbnMpXG4gICAge1xuICAgICAgICBpZiAob3B0aW9ucyAmJiB0aGlzLnN0YXJsb2cpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcmxvZy5zdG9wKCk7IC8vIHN0b3AgdGhlIG9sZCBvbmUgYmVmb3JlIHJlZGVmaW5pbmcgaXQgd2l0aCBuZXcgb3B0aW9ucyBvYmplY3RcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5zdGFybG9nIHx8IG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKTtcblxuICAgICAgICAgICAgLy8gc2VhcmNoIGdyaWQgb2JqZWN0IGZvciBcIkV2ZW50KCd5YWRhLXlhZGEnXCIgb3IgXCJFdmVudC5jYWxsKHRoaXMsICd5YWRhLXlhZGEnXCJcbiAgICAgICAgICAgIG9wdGlvbnMuc2VsZWN0ID0gb3B0aW9ucy5zZWxlY3QgfHwgdGhpcztcbiAgICAgICAgICAgIG9wdGlvbnMucGF0dGVybiA9IG9wdGlvbnMucGF0dGVybiB8fCAvRXZlbnQoXFwuY2FsbFxcKHRoaXMsIHxcXCgpJyhmaW4tW2Etei1dKyknLztcbiAgICAgICAgICAgIG9wdGlvbnMudGFyZ2V0cyA9IG9wdGlvbnMudGFyZ2V0cyB8fCB0aGlzLmNhbnZhcy5jYW52YXM7XG5cbiAgICAgICAgICAgIC8vIG1peCBvcHRpb25zLmxpc3RlbmVyRGljdGlvbmFyeSBvbiB0b3Agb2Ygc29tZSBjdXN0b20gbGlzdGVuZXJzXG4gICAgICAgICAgICBvcHRpb25zLmxpc3RlbmVyRGljdGlvbmFyeSA9IE9iamVjdC5hc3NpZ24oe30sIHJlcXVpcmUoJy4vY3VzdG9tLWxpc3RlbmVycycpLCBvcHRpb25zLmxpc3RlbmVyRGljdGlvbmFyeSk7XG5cbiAgICAgICAgICAgIC8vIG1peCBmaW4tdGljayBvbiB0b3Agb2Ygb3B0aW9ucy5tYXRjaC5ncmV5bGlzdC5ibGFja1xuICAgICAgICAgICAgdmFyIGJsYWNrID0gWydmaW4tdGljayddO1xuICAgICAgICAgICAgb3B0aW9ucy5tYXRjaCA9IG9wdGlvbnMubWF0Y2ggfHwge307XG4gICAgICAgICAgICBvcHRpb25zLm1hdGNoLmdyZXlsaXN0ID0gb3B0aW9ucy5tYXRjaC5ncmV5bGlzdCB8fCB7fTtcbiAgICAgICAgICAgIG9wdGlvbnMubWF0Y2guZ3JleWxpc3QuYmxhY2sgPSBvcHRpb25zLm1hdGNoLmdyZXlsaXN0LmJsYWNrID8gYmxhY2suY29uY2F0KG9wdGlvbnMubWF0Y2guZ3JleWxpc3QuYmxhY2spIDogYmxhY2s7XG5cbiAgICAgICAgICAgIHRoaXMuc3RhcmxvZyA9IG5ldyBTdGFyTG9nKG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGFybG9nLnN0YXJ0KCk7XG4gICAgfSxcblxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnN0YXJsb2cuc3RvcCgpO1xuICAgIH1cblxufTtcblxuLy8gTm9uLWVudW1lcmFibGUgbWV0aG9kcyBhcmUgbm90IHRoZW1zZWx2ZXMgaW5zdGFsbGVkOlxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZXZlbnRMb2dnZXJQbHVnaW4sIHtcbiAgICBwcmVpbnN0YWxsOiB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbihIeXBlcmdyaWRQcm90b3R5cGUsIEJlaGF2aW9yUHJvdG90eXBlLCBtZXRob2RQcmVmaXgpIHtcbiAgICAgICAgICAgIGluc3RhbGwuY2FsbCh0aGlzLCBIeXBlcmdyaWRQcm90b3R5cGUsIG1ldGhvZFByZWZpeCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5zdGFsbDoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24oZ3JpZCwgbWV0aG9kUHJlZml4KSB7XG4gICAgICAgICAgICBpbnN0YWxsLmNhbGwodGhpcywgZ3JpZCwgbWV0aG9kUHJlZml4KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiBpbnN0YWxsKHRhcmdldCwgbWV0aG9kUHJlZml4KSB7XG4gICAgaWYgKG1ldGhvZFByZWZpeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG1ldGhvZFByZWZpeCA9ICdsb2cnO1xuICAgIH1cbiAgICBPYmplY3Qua2V5cyh0aGlzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdGFyZ2V0W3ByZWZpeChtZXRob2RQcmVmaXgsIGtleSldID0gdGhpc1trZXldO1xuICAgIH0sIHRoaXMpO1xufVxuXG5mdW5jdGlvbiBwcmVmaXgocHJlZml4LCBuYW1lKSB7XG4gICAgdmFyIGNhcGl0YWxpemUgPSBwcmVmaXgubGVuZ3RoICYmIHByZWZpeFtwcmVmaXgubGVuZ3RoIC0gMV0gIT09ICdfJztcbiAgICBpZiAoY2FwaXRhbGl6ZSkge1xuICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMCwgMSkudG9VcHBlckNhc2UoKSArIG5hbWUuc3Vic3RyKDEpO1xuICAgIH1cbiAgICByZXR1cm4gcHJlZml4ICsgbmFtZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBldmVudExvZ2dlclBsdWdpbjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqIENyZWF0ZXMgYW4gb2JqZWN0IHdpdGggYSBgdGVzdGAgbWV0aG9kIGZyb20gb3B0aW9uYWwgd2hpdGVsaXN0IGFuZC9vciBibGFja2xpc3RcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAtIElmIG5laXRoZXIgYHdoaXRlYCBub3IgYGJsYWNrYCBhcmUgZ2l2ZW4sIGFsbCBzdHJpbmdzIHBhc3MgYHRlc3RgLlxuICogQHBhcmFtIFtvcHRpb25zLndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBzdHJpbmdzIHBhc3MgYHRlc3RgLlxuICogQHBhcmFtIFtvcHRpb25zLmJsYWNrXSAtIElmIGdpdmVuLCBsaXN0ZWQgc3RyaW5ncyBmYWlsIGB0ZXN0YC5cbiAqL1xuZnVuY3Rpb24gR3JleUxpc3Qob3B0aW9ucykge1xuICAgIHRoaXMud2hpdGUgPSBnZXRGbGF0QXJyYXlPZlJlZ2V4QW5kT3JTdHJpbmcob3B0aW9ucyAmJiBvcHRpb25zLndoaXRlKTtcbiAgICB0aGlzLmJsYWNrID0gZ2V0RmxhdEFycmF5T2ZSZWdleEFuZE9yU3RyaW5nKG9wdGlvbnMgJiYgb3B0aW9ucy5ibGFjayk7XG59XG5cbkdyZXlMaXN0LnByb3RvdHlwZS50ZXN0ID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7IC8vIGZvciBtYXRjaCgpIHVzZVxuICAgIHJldHVybiAoXG4gICAgICAgICEodGhpcy53aGl0ZSAmJiAhdGhpcy53aGl0ZS5zb21lKG1hdGNoLCB0aGlzKSkgJiZcbiAgICAgICAgISh0aGlzLmJsYWNrICYmIHRoaXMuYmxhY2suc29tZShtYXRjaCwgdGhpcykpXG4gICAgKTtcbn07XG5cbmZ1bmN0aW9uIG1hdGNoKHBhdHRlcm4pIHtcbiAgICByZXR1cm4gdHlwZW9mIHBhdHRlcm4udGVzdCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICA/IHBhdHRlcm4udGVzdCh0aGlzLnN0cmluZykgLy8gdHlwaWNhbGx5IGEgcmVnZXggYnV0IGNvdWxkIGJlIGFueXRoaW5nIHRoYXQgaW1wbGVtZW50cyBgdGVzdGBcbiAgICAgICAgOiB0aGlzLnN0cmluZyA9PT0gcGF0dGVybiArICcnOyAvLyBjb252ZXJ0IHBhdHRlcm4gdG8gc3RyaW5nIGV2ZW4gZm9yIGVkZ2UgY2FzZXNcbn1cblxuZnVuY3Rpb24gZ2V0RmxhdEFycmF5T2ZSZWdleEFuZE9yU3RyaW5nKGFycmF5LCBmbGF0KSB7XG4gICAgaWYgKCFmbGF0KSB7XG4gICAgICAgIC8vIHRoaXMgaXMgdGhlIHRvcC1sZXZlbCAobm9uLXJlY3Vyc2VkKSBjYWxsIHNvIGludGlhbGl6ZTpcblxuICAgICAgICAvLyBgdW5kZWZpbmVkYCBwYXNzZXMgdGhyb3VnaCB3aXRob3V0IGJlaW5nIGNvbnZlcnRlZCB0byBhbiBhcnJheVxuICAgICAgICBpZiAoYXJyYXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYXJyYXlpZnkgZ2l2ZW4gc2NhbGFyIHN0cmluZywgcmVnZXgsIG9yIG9iamVjdFxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XG4gICAgICAgICAgICBhcnJheSA9IFthcnJheV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbml0aWFsaXplIGZsYXRcbiAgICAgICAgZmxhdCA9IFtdO1xuICAgIH1cblxuICAgIGFycmF5LmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgLy8gbWFrZSBzdXJlIGFsbCBlbGVtZW50cyBhcmUgZWl0aGVyIHN0cmluZyBvciBSZWdFeHBcbiAgICAgICAgc3dpdGNoIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaXRlbSkpIHtcbiAgICAgICAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgICAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOlxuICAgICAgICAgICAgICAgIGZsYXQucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ1tvYmplY3QgT2JqZWN0XSc6XG4gICAgICAgICAgICAgICAgLy8gcmVjdXJzZSBvbiBjb21wbGV4IGl0ZW0gKHdoZW4gYW4gb2JqZWN0IG9yIGFycmF5KVxuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb252ZXJ0IG9iamVjdCBpbnRvIGFuIGFycmF5IChvZiBpdCdzIGVudW1lcmFibGUga2V5cywgYnV0IG9ubHkgd2hlbiBub3QgdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgICBpdGVtID0gT2JqZWN0LmtleXMoaXRlbSkuZmlsdGVyKGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuIGl0ZW1ba2V5XSAhPT0gdW5kZWZpbmVkOyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZ2V0RmxhdEFycmF5T2ZSZWdleEFuZE9yU3RyaW5nKGl0ZW0sIGZsYXQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBmbGF0LnB1c2goaXRlbSArICcnKTsgLy8gY29udmVydCB0byBzdHJpbmdcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZsYXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3JleUxpc3Q7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBzdW1tYXJ5IEZpbmQgYWxsIHBhdHRlcm4gbWF0Y2hlcywgcmV0dXJuIHNwZWNpZmllZCBjYXB0dXJlIGdyb3VwIGZvciBlYWNoLlxuICogQHJldHVybnMge3N0cmluZ1tdfSBBbiBhcnJheSBjb250YWluaW5nIGFsbCB0aGUgcGF0dGVybiBtYXRjaGVzIGZvdW5kIGluIGBzdHJpbmdgLlxuICogVGhlIGVudGlyZSBwYXR0ZXJuIG1hdGNoIGlzIHJldHVybmVkIHVubGVzcyB0aGUgcGF0dGVybiBjb250YWlucyBvbmUgb3IgbW9yZSBzdWJncm91cHMgaW4gd2hpY2ggY2FzZSB0aGUgcG9ydGlvbiBvZiB0aGUgcGF0dGVybiBtYXRjaGVkIGJ5IHRoZSBsYXN0IHN1Ymdyb3VwIGlzIHJldHVybmVkIHVubGVzcyBgY2FwdHVyZUdyb3VwYCBpcyBkZWZpbmVkLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZ1xuICogQHBhcmFtIHtSZWdFeHB9IHJlZ2V4IC0gRG9uJ3QgdXNlIGdsb2JhbCBmbGFnOyBpdCdzIHVubmVjZXNzYXJ5IGFuZCBzdXBwcmVzc2VzIHN1Ym1hdGNoZXMgb2YgY2FwdHVyZSBncm91cHMuXG4gKiBAcGFyYW0ge251bWJlcn0gW2NhcHR1cmVHcm91cF0gLSBJZmYgZGVmaW5lZCwgaW5kZXggb2YgYSBzcGVjaWZpYyBjYXB0dXJlIGdyb3VwIHRvIHJldHVybi5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHJpbmcsIHJlZ2V4LCBjYXB0dXJlR3JvdXApIHtcbiAgICB2YXIgbWF0Y2hlcyA9IFtdO1xuXG4gICAgZm9yICh2YXIgbWF0Y2gsIGkgPSAwOyAobWF0Y2ggPSBzdHJpbmcuc3Vic3RyKGkpLm1hdGNoKHJlZ2V4KSk7IGkgKz0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG1hdGNoW2NhcHR1cmVHcm91cCA9PT0gdW5kZWZpbmVkID8gbWF0Y2gubGVuZ3RoIC0gMSA6IGNhcHR1cmVHcm91cF0pO1xuICAgIH1cblxuICAgIHJldHVybiBtYXRjaGVzO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEdyZXlsaXN0ID0gcmVxdWlyZSgnZ3JleWxpc3QnKTtcblxuLyoqIEBzdW1tYXJ5IENhdGFsb2cgdGhlIGV4ZWN1dGlvbiBjb250ZXh0IG9iamVjdC5cbiAqIEByZXR1cm5zIHtvYmplY3R9IEFuIG9iamVjdCBjb250YWluaW5nIGEgbWVtYmVyIGZvciBlYWNoIG1lbWJlciBvZiB0aGUgZXhlY3V0aW9uIGNvbnRleHQgb2JqZWN0XG4gKiB2aXNpYmxlIGluIHRoZSBwcm90b3R5cGUgY2hhaW4gKGJhY2sgdG8gYnV0IG5vdCBpbmNsdWRpbmcgT2JqZWN0KSwgcGVyIHdoaXRlbGlzdCBhbmQgYmxhY2tsaXN0LlxuICogRWFjaCBtZW1iZXIncyB2YWx1ZSBpcyB0aGUgb2JqZWN0IGluIHRoZSBwcm90b3R5cGUgY2hhaW4gd2hlcmUgZm91bmQuXG4gKiBAcGFyYW0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm93bl0gLSBSZXN0cmljdCBzZWFyY2ggZm9yIGV2ZW50IHR5cGUgc3RyaW5ncyB0byBvd24gbWV0aG9kcyByYXRoZXIgdGhhbiBlbnRpcmUgcHJvdG90eXBlIGNoYWluLlxuICogQHBhcmFtIFtvcHRpb25zLmdyZXlsaXN0XVxuICogQHBhcmFtIFtvcHRpb25zLmdyZXlsaXN0LndoaXRlXSAtIElmIGdpdmVuLCBvbmx5IGxpc3RlZCBtZW1iZXJzIGFyZSBjYXRhbG9nZWQuXG4gKiBAcGFyYW0gW29wdGlvbnMuZ3JleWxpc3QuYmxhY2tdIC0gSWYgZ2l2ZW4sIGxpc3RlZCBtZW1iZXJzIGFyZSAqbm90KiBjYXRhbG9nZWQuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gb2JqZWN0Q2F0YWxvZyhvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICB2YXIgb2JqLFxuICAgICAgICBjYXRhbG9nID0gT2JqZWN0LmNyZWF0ZShudWxsKSwgLy8gS0lTUyBubyBwcm90b3R5cGUgbmVlZGVkXG4gICAgICAgIHdhbGtQcm90b3R5cGVDaGFpbiA9ICFvcHRpb25zLm93bixcbiAgICAgICAgZ3JleWxpc3QgPSBuZXcgR3JleWxpc3Qob3B0aW9ucy5ncmV5bGlzdCk7XG5cbiAgICBmb3IgKG9iaiA9IHRoaXM7IG9iaiAmJiBvYmogIT09IE9iamVjdC5wcm90b3R5cGU7IG9iaiA9IHdhbGtQcm90b3R5cGVDaGFpbiAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKSkge1xuICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgIShrZXkgaW4gY2F0YWxvZykgJiYgLy8gbm90IHNoYWRvd2VkIGJ5IGEgbWVtYmVyIG9mIGEgZGVzY2VuZGFudCBvYmplY3RcbiAgICAgICAgICAgICAgICBncmV5bGlzdC50ZXN0KGtleSkgJiZcbiAgICAgICAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwga2V5KS52YWx1ZSAhPT0gb2JqZWN0Q2F0YWxvZ1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgY2F0YWxvZ1trZXldID0gb2JqO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2F0YWxvZztcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgbWF0Y2ggPSByZXF1aXJlKCdjb2RlLW1hdGNoJyk7XG5cbi8qKiBAdHlwZWRlZiB7b2JqZWN0fSBzdGFybG9nZ2VyXG4gKiBAZGVzYyBBbiBldmVudCBsaXN0ZW5lciBmb3IgbG9nZ2luZyBwdXJwb3NlcywgcGFpcmVkIHdpdGggdGhlIHRhcmdldChzKSB0byBsaXN0ZW4gdG8uXG4gKiBFYWNoIG1lbWJlciBvZiBhIGxvZ2dlciBvYmplY3QgaGFzIHRoZSBldmVudCBzdHJpbmcgYXMgaXRzIGtleSBhbmQgYW4gb2JqZWN0IGFzIGl0cyB2YWx1ZS5cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IGxpc3RlbmVyIC0gQSBoYW5kbGVyIHRoYXQgbG9ncyB0aGUgZXZlbnQuXG4gKiBAcHJvcGVydHkge29iamVjdHxvYmplY3RbXX0gdGFyZ2V0cyAtIEEgdGFyZ2V0IG9yIGxpc3Qgb2YgdGFyZ2V0cyB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuICovXG5cbi8qKiBAdHlwZWRlZiB7b2JqZWN0fG9iamVjdFtdfSBldmVudFRhcmdldHNcbiAqIEV2ZW50IHRhcmdldCBvYmplY3QocykgdGhhdCBpbXBsZW1lbnQgYGFkZEV2ZW50TGlzdGVuZXJgIGFuZCBgcmVtb3ZlRXZlbnRMaXN0ZW5lcmAsXG4gKiB0eXBpY2FsbHkgYSBET00gbm9kZSwgYnV0IGJ5IG5vIG1lYW5zIGxpbWl0ZWQgdG8gc3VjaC5cbiAqL1xuXG4vKiogQHR5cGVkZWYge3N0cmluZ30gZXZlbnRUeXBlICovXG5cbi8qKiBAdHlwZWRlZiB7b2JqZWN0fSBzdGFybG9nT3B0aW9uc1xuICpcbiAqIEBkZXNjIE11c3QgZGVmaW5lIGBsb2dnZXJzYCwgYGV2ZW50c2AsIG9yIGBwYXR0ZXJuYCBhbmQgYHNlbGVjdGA7IGVsc2UgZXJyb3IgaXMgdGhyb3duLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0LjxldmVudFR5cGUsIHN0YXJsb2dnZXI+fSBbbG9nZ2Vyc10gLSBMb2dnZXIgZGljdGlvbmFyeS5cbiAqIEBwYXJhbSB7c3RyaW5nW119IFtldmVudHNdIC0gTGlzdCBvZiBldmVudCBzdHJpbmdzIGZyb20gd2hpY2ggdG8gYnVpbGQgYSBsb2dnZXIgZGljdGlvbmFyeS5cbiAqIEBwYXJhbSB7b2JqZWN0fG9iamVjdFtdfSBbc2VsZWN0XSAtIE9iamVjdCBvciBsaXN0IG9mIG9iamVjdHMgaW4gd2hpY2ggdG8gc2VhcmNoIHdpdGggYHBhdHRlcm5gLlxuICogQHBhcmFtIHtSZWdFeHB9IFtwYXR0ZXJuXSAtIEV2ZW50IHN0cmluZyBwYXR0ZXJuIHRvIHNlYXJjaCBmb3IgaW4gYWxsIHZpc2libGUgZ2V0dGVycywgc2V0dGVycywgYW5kIG1ldGhvZHMuXG4gKiBUaGUgcmVzdWx0cyBvZiB0aGUgc2VhcmNoIGFyZSB1c2VkIHRvIGJ1aWxkIGEgbG9nZ2VyIGRpY3Rpb25hcnkuXG4gKiBFeGFtcGxlOiBgLycoZmluLVthLXotXSspJy9gIG1lYW5zIGZpbmQgYWxsIHN0cmluZ3MgbGlrZSBgJ2Zpbi0qJ2AsIHJldHVybmluZyBvbmx5IHRoZSBwYXJ0IGluc2lkZSB0aGUgcXVvdGVzLlxuICogU2VlIHRoZSBSRUFETUUgZm9yIGFkZGl0aW9uYWwgZXhhbXBsZXMuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2xvZ10gLSBPdmVycmlkZSB7QGxpbmsgU3RhcmxvZyNsb2d9LlxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2xpc3RlbmVyXSAtIE92ZXJyaWRlIHtAbGluayBTdGFybG9nI2xpc3RlbmVyfS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbdGFyZ2V0c10gLSBPdmVycmlkZSB7QGxpbmsgU3RhcmxvZyN0YXJnZXRzfS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdC48ZXZlbnRUeXBlLCBmdW5jdGlvbj59IFtsaXN0ZW5lckRpY3Rpb25hcnk9e31dIC0gQ3VzdG9tIGxpc3RlbmVycyB0byBvdmVycmlkZSBkZWZhdWx0IGxpc3RlbmVyLlxuICogQHBhcmFtIHtPYmplY3QuPGV2ZW50VHlwZSwgZXZlbnRUYXJnZXRzPn0gW3RhcmdldHNEaWN0aW9uYXJ5PXt9XSAtIEN1c3RvbSBldmVudCB0YXJnZXQgb2JqZWN0KHMpIHRvIG92ZXJyaWRlIGRlZmF1bHQgdGFyZ2V0cy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gW21hdGNoXSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvY29kZS1tYXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IFttYXRjaC5jYXB0dXJlR3JvdXBdIC0gSWZmIGRlZmluZWQsIGluZGV4IG9mIGEgc3BlY2lmaWMgY2FwdHVyZSBncm91cCB0byByZXR1cm4gZm9yIGVhY2ggbWF0Y2guXG4gKiBAcGFyYW0ge29iamVjdH0gW21hdGNoLmdyZXlsaXN0XSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvZ3JleWxpc3RcbiAqIEBwYXJhbSBbbWF0Y2guZ3JleWxpc3Qud2hpdGVdIC0gSWYgZ2l2ZW4sIG9ubHkgbGlzdGVkIG1hdGNoZXMgYXJlIGluY2x1ZGVkIGluIHRoZSByZXN1bHRzLlxuICogQHBhcmFtIFttYXRjaC5ncmV5bGlzdC5ibGFja10gLSBJZiBnaXZlbiwgbGlzdGVkIG1hdGNoZXMgYXJlIGV4Y2x1ZGVkIGZyb20gdGhlIHJlc3VsdHMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IFttYXRjaC5jYXRhbG9nXSAtIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvb2JqZWN0LWNhdGFsb2dcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW21hdGNoLmNhdGFsb2cub3duXSAtIE9ubHkgc2VhcmNoIG93biBtZXRob2RzIGZvciBldmVudCBzdHJpbmdzOyBvdGhlcndpc2UgZW50aXJlIHByb3RvdHlwZSBjaGFpbi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBbbWF0Y2guY2F0YWxvZy5ncmV5bGlzdF0gLSBodHRwczovL2dpdGh1Yi5jb20vam9uZWl0L2dyZXlsaXN0XG4gKiBAcGFyYW0gW21hdGNoLmNhdGFsb2cuZ3JleWxpc3Qud2hpdGVdIC0gSWYgZ2l2ZW4sIG9ubHkgbGlzdGVkIG1lbWJlcnMgYXJlIGNhdGFsb2dlZC5cbiAqIEBwYXJhbSBbbWF0Y2guY2F0YWxvZy5ncmV5bGlzdC5ibGFja10gLSBJZiBnaXZlbiwgbGlzdGVkIG1lbWJlcnMgYXJlICpub3QqIGNhdGFsb2dlZC5cbiAqL1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQHN1bW1hcnkgSW5zdGFuY2UgYSBsb2dnZXIuXG4gKiBAZGVzYyBDb25zdW1lcyBgb3B0aW9uc2AsIGNyZWF0aW5nIGEgZGljdGlvbmFyeSBvZiBldmVudCBzdHJpbmdzIGluIGB0aGlzLmV2ZW50c2AuXG4gKlxuICogU291cmNlcyBmb3IgbG9nZ2VyczpcbiAqICogSWYgYG9wdGlvbnMubG9nZ2Vyc2AgZGljdGlvbmFyeSBvYmplY3QgaXMgZGVmaW5lZCwgZGVlcCBjbG9uZSBpdCBhbmQgbWFrZSBzdXJlIGFsbCBtZW1iZXJzIGFyZSBsb2dnZXIgb2JqZWN0cywgZGVmYXVsdGluZyBhbnkgbWlzc2luZyBtZW1iZXJzLlxuICogKiBFbHNlIGlmIGBvcHRpb25zLmV2ZW50c2AgKGxpc3Qgb2YgZXZlbnQgc3RyaW5ncykgaXMgZGVmaW5lZCwgY3JlYXRlIGFuIG9iamVjdCB3aXRoIHRob3NlIGtleXMsIGxpc3RlbmVycywgYW5kIHRhcmdldHMuXG4gKiAqIEVsc2UgaWYgYG9wdGlvbnMucGF0dGVybmAgaXMgZGVmaW5lZCwgY29kZSBmb3VuZCBpbiB0aGUgZXhlY3V0aW9uIGNvbnRleHQgb2JqZWN0IGlzIHNlYXJjaGVkIGZvciBldmVudCBzdHJpbmdzIHRoYXQgbWF0Y2ggaXQgKHBlciBgb3B0aW9ucy5tYXRjaGApLlxuICpcbiAqIEV2ZW50cyBzcGVjaWZpZWQgd2l0aCBgb3B0aW9ucy5ldmVudHNgIGFuZCBgb3B0aW9ucy5wYXR0ZXJuYCBsb2cgdXNpbmcgdGhlIGRlZmF1bHQgbGlzdGVuZXIgYW5kIGV2ZW50IHRhcmdldHM6XG4gKiAqIGBTdGFyTG9nLnByb3RvdHlwZS5saXN0ZW5lcmAsIHVubGVzcyBvdmVycmlkZGVuLCBqdXN0IGNhbGxzIGB0aGlzLmxvZygpYCB3aXRoIHRoZSBldmVudCBzdHJpbmcsIHdoaWNoIGlzIHN1ZmZpY2llbnQgZm9yIGNhc3VhbCB1c2FnZS5cbiAqIE92ZXJyaWRlIGl0IGJ5IGRlZmluaW5nIGBvcHRpb25zLmxpc3RlbmVyYCBvciBkaXJlY3RseSBieSByZWFzc2lnbmluZyB0byBgU3RhckxvZy5wcm90b3R5cGUubGlzdGVuZXJgIGJlZm9yZSBpbnN0YW50aWF0aW9uLlxuICogKiBgU3RhckxvZy5wcm90b3R5cGUudGFyZ2V0c2AsIHVubGVzcyBvdmVycmlkZGVuLCBpcyBgd2luZG93LmRvY3VtZW50YCAod2hlbiBhdmFpbGFibGUpLFxuICogd2hpY2ggaXMgb25seSByZWFsbHkgdXNlZnVsIGlmIHRoZSBldmVudCBpcyBkaXNwYXRjaGVkIGRpcmVjdGx5IHRvIChvciBpcyBhbGxvd2VkIHRvIGJ1YmJsZSB1cCB0bykgYGRvY3VtZW50YC5cbiAqIE92ZXJyaWRlIGl0IGJ5IGRlZmluaW5nIGBvcHRpb25zLnRhcmdldHNgIG9yIGRpcmVjdGx5IGJ5IHJlYXNzaWduaW5nIHRvIGBTdGFyTG9nLnByb3RvdHlwZS50YXJnZXRzYCBiZWZvcmUgaW5zdGFudGlhdGlvbi5cbiAqXG4gKiBFdmVudHMgc3BlY2lmaWVkIHdpdGggYG9wdGlvbnMubG9nZ2Vyc2AgY2FuIGVhY2ggc3BlY2lmeSB0aGVpciBvd24gbGlzdGVuZXIgYW5kL29yIHRhcmdldHMsIGJ1dCBpZiBub3Qgc3BlY2lmaWVkLCB0aGV5IHRvbyB3aWxsIGFsc28gdXNlIHRoZSBhYm92ZSBkZWZhdWx0cy5cbiAqXG4gKiBAcGFyYW0ge3N0YXJsb2dPcHRpb25zfSBbb3B0aW9uc11cbiAqL1xuZnVuY3Rpb24gU3RhckxvZyhvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBPdmVycmlkZSBwcm90b3R5cGUgZGVmaW5pdGlvbnMgaWYgYW5kIG9ubHkgaWYgc3VwcGxpZWQgaW4gb3B0aW9uc1xuICAgIFsnbG9nJywgJ3RhcmdldHMnLCAnbGlzdGVuZXInXS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBpZiAob3B0aW9uc1trZXldKSB7IHRoaXNba2V5XSA9IG9wdGlvbnNba2V5XTsgfVxuICAgIH0sIHRoaXMpO1xuXG4gICAgdmFyIGRlZmF1bHRUYXJnZXQgPSBvcHRpb25zLnRhcmdldHMgfHwgdGhpcy50YXJnZXRzLFxuICAgICAgICBkZWZhdWx0TGlzdGVuZXIgPSBvcHRpb25zLmxpc3RlbmVyIHx8IHRoaXMubGlzdGVuZXIsXG4gICAgICAgIGxpc3RlbmVyRGljdGlvbmFyeSA9IG9wdGlvbnMubGlzdGVuZXJEaWN0aW9uYXJ5IHx8IHt9LFxuICAgICAgICB0YXJnZXRzRGljdGlvbmFyeSA9IG9wdGlvbnMudGFyZ2V0c0RpY3Rpb25hcnkgfHwge30sXG4gICAgICAgIGxvZ2dlcnMgPSBvcHRpb25zLmxvZ2dlcnMsXG4gICAgICAgIGV2ZW50U3RyaW5ncztcblxuICAgIGlmIChsb2dnZXJzKSB7XG4gICAgICAgIGV2ZW50U3RyaW5ncyA9IE9iamVjdC5rZXlzKGxvZ2dlcnMpO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5ldmVudHMpIHtcbiAgICAgICAgbG9nZ2VycyA9IHt9O1xuICAgICAgICBldmVudFN0cmluZ3MgPSBvcHRpb25zLmV2ZW50cztcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMucGF0dGVybiAmJiBvcHRpb25zLnNlbGVjdCkge1xuICAgICAgICBsb2dnZXJzID0ge307XG4gICAgICAgIGV2ZW50U3RyaW5ncyA9IGFycmF5aWZ5KG9wdGlvbnMuc2VsZWN0KS5yZWR1Y2UoZnVuY3Rpb24obWF0Y2hlcywgb2JqZWN0KSB7XG4gICAgICAgICAgICBtYXRjaC5jYWxsKG9iamVjdCwgb3B0aW9ucy5wYXR0ZXJuLCBvcHRpb25zLm1hdGNoKS5mb3JFYWNoKGZ1bmN0aW9uIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzLmluZGV4T2YobWF0Y2gpIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzLnB1c2gobWF0Y2gpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXM7XG4gICAgICAgIH0sIFtdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIGBvcHRpb25zLmxvZ2dlcnNgLCBgb3B0aW9ucy5ldmVudHNgLCBvciBgb3B0aW9ucy5wYXR0ZXJuYCBhbmQgYG9wdGlvbnMuc2VsZWN0YCB0byBiZSBkZWZpbmVkLicpO1xuICAgIH1cblxuICAgIHZhciBzdGFybG9nID0gdGhpcztcblxuICAgIC8qKlxuICAgICAqIERpY3Rpb25hcnkgb2YgZXZlbnQgc3RyaW5ncyB3aXRoIGxpc3RlbmVyIGFuZCB0YXJnZXQocykuXG4gICAgICogQHR5cGUge09iamVjdC48ZXZlbnRUeXBlLCBzdGFybG9nZ2VyPn1cbiAgICAgKi9cbiAgICB0aGlzLmV2ZW50cyA9IGV2ZW50U3RyaW5ncy5yZWR1Y2UoZnVuY3Rpb24oY2xvbmUsIGV2ZW50U3RyaW5nKSB7XG4gICAgICAgIHZhciBsb2dnZXIgPSBPYmplY3QuYXNzaWduKHt9LCBsb2dnZXJzW2V2ZW50U3RyaW5nXSk7IC8vIGNsb25lIGVhY2ggbG9nZ2VyXG5cbiAgICAgICAgLy8gYmluZCB0aGUgbGlzdGVuZXIgdG8gc3RhcmxvZyBmb3IgYHRoaXMubG9nYCBhY2Nlc3MgdG8gU3RhcmxvZyNsb2cgZnJvbSB3aXRoaW4gbGlzdGVuZXJcbiAgICAgICAgbG9nZ2VyLmxpc3RlbmVyID0gKGxvZ2dlci5saXN0ZW5lciB8fCBsaXN0ZW5lckRpY3Rpb25hcnlbZXZlbnRTdHJpbmddIHx8IGRlZmF1bHRMaXN0ZW5lcikuYmluZChzdGFybG9nKTtcbiAgICAgICAgbG9nZ2VyLnRhcmdldHMgPSBhcnJheWlmeShsb2dnZXIudGFyZ2V0cyB8fCB0YXJnZXRzRGljdGlvbmFyeVtldmVudFN0cmluZ10gfHwgZGVmYXVsdFRhcmdldCk7XG5cbiAgICAgICAgY2xvbmVbZXZlbnRTdHJpbmddID0gbG9nZ2VyO1xuXG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9LCB7fSk7XG59XG5cblN0YXJMb2cucHJvdG90eXBlID0ge1xuICAgIGNvbnN0cnVjdG9yOiBTdGFyTG9nLnByb3RvdHlwZS5jb25zdHJ1Y3RvcixcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgKiBAZGVmYXVsdCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpXG4gICAgICovXG4gICAgbG9nOiBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAqIEBkZWZhdWx0IGZ1bmN0aW9uKGUpIHsgdGhpcy5sb2coZS50eXBlKTsgfTtcbiAgICAgKi9cbiAgICBsaXN0ZW5lcjogZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLmxvZyhlLnR5cGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAqIEBkZWZhdWx0IHdpbmRvdy5kb2N1bWVudFxuICAgICAqL1xuICAgIHRhcmdldHM6IHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnICYmIHdpbmRvdy5kb2N1bWVudCxcblxuICAgIC8qKlxuICAgICAqIEBtZXRob2QgU3RhcmxvZyNzdGFydFxuICAgICAqIEBzdW1tYXJ5IFN0YXJ0IGxvZ2dpbmcgZXZlbnRzLlxuICAgICAqIEBkZXNjIEFkZCBuZXcgZXZlbnQgbGlzdGVuZXJzIGZvciBsb2dnaW5nIHB1cnBvc2VzLlxuICAgICAqIE9sZCBldmVudCBsaXN0ZW5lcnMsIGlmIGFueSwgYXJlIHJlbW92ZWQgZmlyc3QsIGJlZm9yZSBhZGRpbmcgbmV3IG9uZXMuXG4gICAgICovXG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIGV2ZW50TGlzdGVuZXIodGhpcy5ldmVudHMsICdhZGQnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQG1ldGhvZCBTdGFybG9nI3N0b3BcbiAgICAgKiBAc3VtbWFyeSBTdG9wIGxvZ2dpbmcgZXZlbnRzLlxuICAgICAqIEBkZXNjIEV2ZW50IGxpc3RlbmVycyBhcmUgcmVtb3ZlZCBmcm9tIHRhcmdldHMgYW5kIGRlbGV0ZWQuXG4gICAgICovXG4gICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICBldmVudExpc3RlbmVyKHRoaXMuZXZlbnRzLCAncmVtb3ZlJyk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gZXZlbnRMaXN0ZW5lcihkaWN0aW9uYXJ5LCBtZXRob2RQcmVmaXgpIHtcbiAgICBpZiAoIWRpY3Rpb25hcnkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBtZXRob2QgPSBtZXRob2RQcmVmaXggKyAnRXZlbnRMaXN0ZW5lcic7XG5cbiAgICBPYmplY3Qua2V5cyhkaWN0aW9uYXJ5KS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50VHlwZSkge1xuICAgICAgICB2YXIgZXZlbnRMb2dnZXIgPSBkaWN0aW9uYXJ5W2V2ZW50VHlwZV07XG4gICAgICAgIGV2ZW50TG9nZ2VyLnRhcmdldHMuZm9yRWFjaChmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgICAgIHRhcmdldFttZXRob2RdKGV2ZW50VHlwZSwgZXZlbnRMb2dnZXIubGlzdGVuZXIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYXJyYXlpZnkoeCkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHgpID8geCA6IFt4XTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGFyTG9nOyJdfQ==
