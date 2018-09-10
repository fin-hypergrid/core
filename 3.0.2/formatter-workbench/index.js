'use strict';

var grid, tabBar, tutorial, callApi;

var tutTOC = [
    'Table of Contents.html',
    'Welcome.html',
    'The Workench Interface.html',
    [
        'The Hypergrid Section.html',
        'The Editor Section.html',
        'The Tutorial Section.html'
    ],
    'The Data Tab.html',
    [
        'Editing grid cells (Activity 1).html',
        'Editing the data object (Activity 2).html',
        'Add a new row to the data object (Activity 3).html'
    ],
    'The State Tab.html',
    [
        'Setting grid state (Activity 4).html',
        'Setting column properties via grid state.html',
        'Setting row and cell properties via grid state.html',
        'The Properties Cascade.html',
        'Edit a column property (Activity 5).html'
    ],
    'The Localizers Tab.html',
    [
        'Bind a cell to a localizer (Activity 6).html',
        'Adding a new localizer.html',
        'Create a Localizer (Activity 7).html'
    ],
    'The Cell Editors Tab (Activity 8).html',
    [
        'Activity 9.html'
    ],
    'Validation.html',
    [
        'The parse() method.html',
        'The invalid() method.html',
        'Activity 10 - Returning parsing errors.html'
    ]
];

var svg = {
    'svg-reset': '<svg viewBox="0 0 32 32" version="1.1" width="22" height="22"><path d="M 15.5 2.09375 L 14.09375 3.5 L 16.59375 6.03125 C 16.394531 6.019531 16.203125 6 16 6 C 10.5 6 6 10.5 6 16 C 6 17.5 6.304688 18.894531 6.90625 20.09375 L 8.40625 18.59375 C 8.207031 17.792969 8 16.898438 8 16 C 8 11.601563 11.601563 8 16 8 C 16.175781 8 16.359375 8.019531 16.53125 8.03125 L 14.09375 10.5 L 15.5 11.90625 L 19.71875 7.71875 L 20.40625 7 L 19.71875 6.28125 Z M 25.09375 11.90625 L 23.59375 13.40625 C 23.894531 14.207031 24 15.101563 24 16 C 24 20.398438 20.398438 24 16 24 C 15.824219 24 15.640625 23.980469 15.46875 23.96875 L 17.90625 21.5 L 16.5 20.09375 L 12.28125 24.28125 L 11.59375 25 L 12.28125 25.71875 L 16.5 29.90625 L 17.90625 28.5 L 15.40625 25.96875 C 15.601563 25.980469 15.804688 26 16 26 C 21.5 26 26 21.5 26 16 C 26 14.5 25.695313 13.105469 25.09375 11.90625 Z "></path></svg>',
    'svg-delete': '<svg viewBox="0 0 12 16" version="1.1" width="12" height="16" class="dangerous-button"><path fill-rule="evenodd" d="M11 2H9c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1H2c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1v9c0 .55.45 1 1 1h7c.55 0 1-.45 1-1V5c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 12H3V5h1v8h1V5h1v8h1V5h1v8h1V5h1v9zm1-10H2V3h9v1z"></path></svg>'
};

window.onload = function() {
    var NEW = '(New)';
    var isCamelCase = /[a-z][A-Z]/;
    var saveFuncs = {
        editor: saveCellEditor,
        localizer: saveLocalizer
    };
    var defaults = {
        data: [
            { symbol: 'APPL', name: 'Apple Inc.', prevclose: 93.13, change: -.0725 },
            { symbol: 'MSFT', name: 'Microsoft Corporation', prevclose: 51.91, change: .0125 },
            { symbol: 'TSLA', name: 'Tesla Motors Inc.', prevclose: 196.40, change: .08 },
            { symbol: 'IBM', name: 'International Business Machines Corp', prevclose: 155.35, change: -.02375 }
        ],
        state: {
            showRowNumbers: false, // override the default (true)
            editable: true, // included here for clarity; this is the default value
            editor: 'Textfield', // override the default (undefined)
            columns: {
                prevclose: {
                    halign: 'right'
                }
            }
        }
    }

    // Append version numbers to <h1> header
    document.querySelector('body > h1:first-child').innerHTML += ' <sup>(rev. 11)</sup> — Hypergrid <sup>(v' + fin.Hypergrid.prototype.version + ')</sup>';

    cloneSvgEls();

    grid = new fin.Hypergrid();

    tabBar = new CurvyTabs(document.getElementById('tab-bar-editors'));
    tabBar.paint();

    tutorial = new CurvyTabsPager(
        document.getElementById('page-panel'),
        new CurvyTabs(document.getElementById('tab-bar-tutorial')),
        'tutorial/',
        flatten(tutTOC)
    );

    callApi('data'); // inits both 'data' and 'state' editors

    initLocalsButtons();

    var scripts = {
        editor: undefined,
        localizer: undefined
    };
    Object.keys(scripts).forEach(function(type) {
        ajax(type + 's.js', initObjectEditor.bind(null, type));
    });

    document.getElementById('reset-all').onclick = function() {
        if (confirm('Clear localStorage and reload?\n\nThis will reset all tabs to their default values, removing all edits, including new custom localizers and custom cell editors.')) {
            localStorage.clear();
            location.reload();
        }
    };

    grid.addEventListener('fin-after-cell-edit', function(e) {
        document.getElementById('data').value = stringifyAndUnquoteKeys(grid.behavior.getData());
    });

    var dragger, divider = document.querySelector('.divider');
    divider.addEventListener('mousedown', function(e) {
        dragger = {
            delta: e.clientY - divider.getBoundingClientRect().top,
            gridHeight: grid.div.getBoundingClientRect().height,
            tabHeight: tabBar.container.getBoundingClientRect().height
        }
        e.stopPropagation(); // no other element needs to handle
    });
    document.addEventListener('mousemove', function(e) {
        if (dragger) {
            var newDividerTop = e.clientY - dragger.delta,
                oldDividerTop = divider.getBoundingClientRect().top,
                topDelta = newDividerTop - oldDividerTop,
                newGridHeight = dragger.gridHeight + topDelta,
                newTabHeight = dragger.tabHeight - topDelta;

            if (newGridHeight >= 65 && newTabHeight >= 130) {
                divider.style.borderTopStyle = divider.style.borderTopColor = null; // revert to :active style
                divider.style.top = newDividerTop + 'px';
                grid.div.style.height = (dragger.gridHeight = newGridHeight) + 'px';
                tabBar.container.style.height = (dragger.tabHeight = newTabHeight) + 'px';
            } else {
                // force :hover style when out of range even though dragging (i.e., :active)
                divider.style.borderTopStyle = 'double';
                divider.style.borderTopColor = '#444';
            }

            e.stopPropagation(); // no other element needs to handle
            e.preventDefault(); // no other drag effects, please
        }
    });
    document.addEventListener('mouseup', function(e) {
        dragger = undefined;
    });

    // Inject svg element into elements with svg-wildcard class name
    function cloneSvgEls() {
        querySelectorEach('[class*="svg-"]', function (el) {
            el.innerHTML = svg[el.className.match(/\bsvg-[\w-]+/)[0]];
        });
    }

    function querySelectorEach(selector, iterator, context) {
        var els = document.querySelectorAll(selector);
        if (els.forEach) {
            els.forEach(iterator, context);
        } else {
            Array.prototype.forEach.call(els, iterator, context);
        }
    }

    function flatten(arr) {
        var result = [];
        walk(tutTOC);
        function walk(list) {
            list.forEach(function(item) {
                if (Array.isArray(item)) {
                    walk(item);
                } else {
                    result.push(item);
                }
            });
        }
        return result;
    }

    function ajax(url, callback) {
        var httpRequest = new XMLHttpRequest();

        httpRequest.open('GET', url);

        httpRequest.onreadystatechange = function() {
            if (
                httpRequest.readyState === 4 && // HTTP_STATE_DONE
                httpRequest.status === 200 // HTTP_STATUS_OK
            ) {
                callback(httpRequest.responseText);
            }
        };

        httpRequest.send();
    }

    function callApi(methodName, type, confirmation) {
        // When `methodName` is `undefined` or omitted promote 2nd and 3rd params
        if (!methodName || !isCamelCase.test(methodName)) {
            confirmation = type;
            type = methodName;
            methodName = 'set' + capitalize(type);
        }

        var texEl = document.getElementById(type); // tab editor's textarea element
        if (!texEl.value && !(texEl.value = localStorage.getItem(type))) {
            localStorage.setItem(type, texEl.value = stringifyAndUnquoteKeys(defaults[type]));
        }
        texEl.oninput = function() {
            resetEl.classList.toggle('disabled', texEl.value === localStorage.getItem(type));
        };

        // We're using eval here instead of JSON.parse because we want to allow unquoted keys.
        // Note: L-value must be inside eval because R-value beginning with '{' is eval'd as BEGIN block.
        var value;
        eval('value =' + texEl.value);

        if (methodName === 'setData') {
            grid.setData(value, { schema: [] });
            callApi('state'); // reapply state after resetting schema (also inits state editor on first time called)
        } else {
            grid[methodName](value);
        }

        if (confirmation) {
            feedback(texEl.parentElement, confirmation);
        }

        var resetEl = document.getElementById('reset-' + type);
        texEl.oninput();
        resetEl.onclick = resetTextEditor;

    }

    function resetTextEditor() {
        var type = this.id.replace(/^reset-/, '');
        if (!isDisabled(this) && confirm('Reset the ' + capitalize(type) + ' tab editor to its default?')) {
            document.getElementById(type).value = '';
            localStorage.removeItem(type);
            callApi(type);
        }
    }

    function resetObject() {
        var type = this.id.replace(/^reset-/, '');
        var name = document.getElementById(type + '-dropdown').value;
        if (!isDisabled(this) && confirm('Reset the "' + name + '" ' + type + ' to its default?')) {
            var script = getDefaultScript(type, name);
            if (name !== NEW) {
                localStorage.setItem(type + '_' + name, script);
            }
            document.getElementById(type + '-script').value = script;
            enableResetAndDeleteIcons(type, name);
        }
    }

    function deleteObject() {
        var type = this.id.replace(/^delete-/, '');
        var dropdown = document.getElementById(type + '-dropdown');
        var name = dropdown.value;
        if (!isDisabled(this) && confirm('Delete the "' + name + '" ' + type + '?')) {
            dropdown.options.remove(dropdown.selectedIndex);
            dropdown.selectedIndex = 0; // "(New)"
            dropdown.onchange();
            localStorage.removeItem(type + '_' + name);
        }
    }

    function isDisabled(el) {
        return el.classList.contains('disabled');
    }

    function capitalize(str) {
        return str[0].toUpperCase() + str.substr(1);
    }

    function initLocalsButton(type, locals) {
        var el = document.getElementById(type + '-dropdown').parentElement.querySelector('.locals');
        locals = locals.sort();
        el.title = locals.join('\n');
        el.onclick = function() {
            alert('Local variables: ' + locals.join(', '));
        };
    }

    function initLocalsButtons() {
        initLocalsButton('editor', ['module', 'exports', 'CellEditor'].concat(Object.keys(grid.cellEditors.items)));
        initLocalsButton('localizer', ['module', 'exports']);
    }

    function initObjectEditor(type, data) {
        var typedScripts = scripts[type] = data.split(/\s*\/\* ✂ \*\/\s*/),
            dropdownEl = document.getElementById(type + '-dropdown'),
            resetEl = document.getElementById('reset-' + type),
            deleteEl = document.getElementById('delete-' + type),
            scriptEl = document.getElementById(type + '-script'),
            addButtonEl = dropdownEl.parentElement.querySelector('.api'),
            prefix = type + '_',
            save = saveFuncs[type],
            newScript;

        // STEP 1: Save default scripts to local storage not previously saved
        typedScripts.map(extractName).sort().forEach(function(name) {
            var script = getDefaultScript(type, name);
            if (name === NEW) {
                dropdownEl.add(new Option(name));
                newScript = scriptEl.value = script;
            } else if (!localStorage.getItem(prefix + name)) {
                localStorage.setItem(prefix + name, script);
            }
        });

        // STEP 2: Load scripts from local storage, re-saving each which adds it to drop-down
        for (var i = 0; i < localStorage.length; ++i) {
            var key = localStorage.key(i);
            if (key.substr(0, prefix.length) === prefix) {
                save(localStorage.getItem(key), dropdownEl);
            }
        }

        // STEP 3: Reset drop-down to first item: "(New)"
        dropdownEl.selectedIndex = 0;
        enableResetAndDeleteIcons(type, NEW);

        // STEP 4: Assign handlers
        resetEl.onclick = resetObject;
        deleteEl.onclick = deleteObject;

        var name = NEW;
        dropdownEl.onchange = function() {
            var newName = this.value;
            var savedScript = localStorage.getItem(prefix + name) || getDefaultScript(type, name);
            var editedScript = document.getElementById(type + '-script').value;

            if (!savedScript || savedScript === editedScript || confirm('Discard unsaved changes?')) {
                name = newName;
                if (name === NEW) {
                    scriptEl.value = newScript;
                    enableResetAndDeleteIcons(type);
                } else {
                    scriptEl.value = localStorage.getItem(prefix + name);
                    enableResetAndDeleteIcons(type, name);
                }
            } else if (savedScript) {
                this.value = name;
            }
        };

        scriptEl.oninput = function() {
            enableResetAndDeleteIcons(type, dropdownEl.value);
        };

        addButtonEl.onclick = function() {
            save(scriptEl.value, dropdownEl);
            grid.repaint();
        };
    }

    function enableResetAndDeleteIcons(type, name) {
        var resetEl = document.getElementById('reset-' + type);
        var deleteEl = document.getElementById('delete-' + type);

        if (name) {
            var defaultScript = name && getDefaultScript(type, name);
            var editedScript = document.getElementById(type + '-script').value;
            var alteredFromDefault = defaultScript && defaultScript !== editedScript;

            resetEl.classList.toggle('disabled', !alteredFromDefault);
            deleteEl.classList.toggle('disabled', !name || defaultScript);
        }
    }

    function getDefaultScript(type, name) {
        return scripts[type].find(isScriptByName.bind(null, name));
    }

    function isScriptByName(name, script) {
        return extractName(script) === name;
    }

    function extractName(script) {
        var match = script.match(/\.extend\('([^']+)'|\.extend\("([^"]+)"|\bname:\s*'([^']+)'|\bname:\s*"([^"]+)"/);
        return match[1] || match[2] || match[3] || match[4];
    }

    function stringifyAndUnquoteKeys(json) {
        return JSON.stringify(json, undefined, 2)
            .replace(/(  +)"([a-zA-Z$_]+)"(: )/g, '$1$2$3'); // un-quote keys
    }

    function saveCellEditor(script, select) {
        var cellEditors = grid.cellEditors;
        var editorNames = Object.keys(cellEditors.items);
        var editors = editorNames.map(function(name) {
            return cellEditors.items[name];
        });
        var exports = {}, module = { exports: exports };
        var formalArgs = [null, 'module', 'exports', 'CellEditor'] // null is for bind's thisArg
            .concat(editorNames) // additional params
            .concat(script); // function body
        var actualArgs = [module, exports, cellEditors.BaseClass]
            .concat(editors);

        try {
            var closure = new (Function.prototype.bind.apply(Function, formalArgs)); // calls Function constructor using .apply
            closure.apply(null, actualArgs);
            var Editor = module.exports;
            var name = Editor.prototype.$$CLASS_NAME;
            if (!(Editor.prototype instanceof cellEditors.BaseClass)) {
                throw 'Cannot save cell editor "' + name + '" because it is not a subclass of CellEditor (aka grid.cellEditors.BaseClass).';
            }
            if (!name || name === NEW) {
                throw 'Cannot save cell editor. A name other than "(New)" is required.';
            }
        } catch (err) {
            console.error(err);
            alert(err + '\n\nAvailable locals: ' + formalArgs.slice(1, formalArgs.length - 1).join(', ') +
                '\n\nNOTE: Cell editors that extend directly from CellEditor must define a `template` property.');
            return;
        }

        cellEditors.add(Editor);

        localStorage.setItem('editor_' + name, script);

        addOptionInAlphaOrder(select, name);

        enableResetAndDeleteIcons('editor', name);

        if (select) {
            feedback(select.parentElement);
        }

        initLocalsButtons();
    }

    function saveLocalizer(script, select) {
        var module = {};

        try {
            var closure = new Function('module', script);
            closure(module);
            var localizer = module.exports;
            var name = localizer.name;
            if (!name || name === NEW) {
                throw 'Cannot save localizer. A `name` property with a value other than "(New)" is required.';
            }
            grid.localization.add(localizer);
        } catch (err) {
            console.error(err);
            alert(err + '\n\nAvailable locals:\n\tmodule');
            return;
        }

        localStorage.setItem('localizer_' + name, script);

        addOptionInAlphaOrder(select, name);

        enableResetAndDeleteIcons('localizer', name);

        if (select) {
            feedback(select.parentElement);
        }
    }

    function addOptionInAlphaOrder(el, text, value) {
        if (!el) {
            return;
        }

        var optionEls = Array.prototype.slice.call(el.options);

        var index = optionEls.findIndex(function(optionEl) {
            return optionEl.textContent === text;
        });
        if (index >= 0) {
            el.selectedIndex = index;
            return; // already in dropdown
        }

        var firstOptionGreaterThan = optionEls.find(function(optionEl) {
            return optionEl.textContent > text;
        });

        el.value = name;
        if (el.selectedIndex === -1) {
            el.add(new Option(text, value), firstOptionGreaterThan);
            el.value = value || text;
        }
    }

    function feedback(content, confirmation) {
        var el = content.querySelector('span.feedback');
        if (!confirmation) {
            confirmation = 'Saved';
        }
        el.innerText = confirmation;
        el.style.display = 'inline';
        setTimeout(function() {
            el.style.display = 'none';
        }, 750 + 50 * confirmation.length);
    }

    window.callApi = callApi; // for access from index.html `onclick` handlers
};