'use strict';

var grid, tabBars, tutorial;

window.onload = function() {
    var NEW = '(New)';
    var saveFuncs = {
        editor: saveCellEditor,
        localizer: saveLocalizer
    };
    var defaults = {
        data: data,
        state: {
            backgroundColor: 'white',
            columnHeaderBackgroundColor: 'ivory',
            rowHeaderBackgroundColor: 'ivory',
            columns: {
                name: { header: 'State' },
                population: { format: 'number', halign: 'right' },
                area: { format: 'number', halign: 'right' },
                reps: { format: 'number', halign: 'right' },
            }
        }
    };

    window.callApi = callApi;

    grid = new fin.Hypergrid();

    tabBars = document.querySelectorAll('.curvy-tabs-container');

    var tabBar = new CurvyTabs(tabBars[0]);
    tabBar.paint();

    tutorial = new Tutorial(tabBars[1], 'tutorial/', 19);

    initTextEditor('data');
    initTextEditor('state');
    initLocalsButtons();

    Object.keys(scripts).forEach(function (key) {
        initObjectEditor(key);
    });

    document.getElementById('reset-all').onclick = function () {
        if (confirm('Clear localStorage and reload?')) {
            localStorage.clear();
            location.reload();
        }
    };

    grid.addEventListener('fin-after-cell-edit', function (e) {
        putJSON('data', grid.behavior.getData());
    });

    function initTextEditor(type) {
        document.getElementById(type).value = localStorage.getItem(type);
        if (!document.getElementById(type).value) {
            putJSON(type, defaults[type]);
        }
        var apiMethodName = 'set' + capitalize(type);
        callApi(apiMethodName, type);

        document.getElementById('reset-' + type).onclick = resetTextEditor;
    }

    function resetTextEditor() {
        var type = this.id.replace(/^reset-/, '');
        if (confirm('Reset the ' + capitalize(type) + ' tab editor to its default?')) {
            localStorage.removeItem(type);
            initTextEditor(type);
        }
    }

    function resetObjectEditor() {
        var type = this.id.replace(/^reset-/, '');
        var key = document.getElementById(type + '-dropdown').value;
        if (confirm('Reset the "' + key + '" ' + type + ' to its default?')) {
            var script = scripts[type].find(isScriptByName.bind(null, key));
            localStorage.setItem(type + '_' + key, script);
            document.getElementById(type + '-script').value = script;
        }
    }

    function capitalize(str) {
        return str[0].toUpperCase() + str.substr(1);
    }

    function initLocalsButton(type, locals) {
        var el = document.getElementById(type + '-dropdown').parentElement.querySelector('.locals');
        locals = locals.sort();
        el.title = locals.join('\n');
        el.onclick = function () {
            alert('Local variables: ' + locals.join(', '));
        };
    }

    function initLocalsButtons() {
        initLocalsButton('editor', ['module', 'exports', 'CellEditor'].concat(Object.keys(grid.cellEditors.items)));
        initLocalsButton('localizer', ['module', 'exports']);
    }

    function initObjectEditor(type) {
        var scriptList = scripts[type],
            dropdownEl = document.getElementById(type + '-dropdown'),
            resetEl = dropdownEl.nextElementSibling,
            scriptEl = document.getElementById(type + '-script'),
            addButtonEl = dropdownEl.parentElement.querySelector('.api'),
            prefix = type + '_',
            save = saveFuncs[type],
            newScript;

        // STEP 1: Save default scripts to local storage not previously saved
        scriptList.map(extractName).sort().forEach(function (key) {
            var script = scriptList.find(isScriptByName.bind(null, key));
            if (key === NEW) {
                dropdownEl.add(new Option(key));
                newScript = scriptEl.value = script;
            } else if (!localStorage.getItem(prefix + key)) {
                localStorage.setItem(prefix + key, script);
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
        resetEl.style.display = 'none';

        resetEl.onclick = resetObjectEditor;

        dropdownEl.onchange = function () {
            var name = this.value;

            if (name === NEW) {
                scriptEl.value = newScript;
                resettable(type);
            } else {
                scriptEl.value = localStorage.getItem(prefix + name);
                resettable(type, name);
            }
        };

        addButtonEl.onclick = function () {
            save(scriptEl.value, dropdownEl);
        };
    }

    function resettable(type, name) {
        var hasDefaultScript = name && !!scripts[type].find(isScriptByName.bind(null, name));
        document.getElementById('reset-' + type).style.display = hasDefaultScript ? null : 'none'; // null reveals start value
    }

    function isScriptByName(name, script) {
        return extractName(script) === name;
    }

    function extractName(script) {
        var match = script.match(/\.extend\('([^']+)'|\.extend\("([^"]+)"|\bname:\s*'([^']+)'|\bname:\s*"([^"]+)"/);
        return match[1] || match[2] || match[3] || match[4];
    }

    function putJSON(key, json) {
        document.getElementById(key).value = JSON.stringify(json, undefined, 2)
            .replace(/(  +)"([a-zA-Z$_]+)"(: )/g, '$1$2$3'); // un-quote keys
    }

    function callApi(methodName, id, confirmation) {
        var jsonEl = document.getElementById(id), value = jsonEl.value;

        localStorage.setItem(id, value);

        // L-value must be inside eval because R-value beginning with '{' is eval'd as BEGIN block
        // used eval because JSON.parse rejects unquoted keys
        eval('value =' + value);

        var params = [value];
        if (methodName === 'setData') {
            params.push({ schema: [] });
        }

        grid[methodName].apply(grid, params);

        if (confirmation) {
            feedback(jsonEl.parentElement, confirmation);
        }
    }

    function saveCellEditor(script, select) {
        var cellEditors = grid.cellEditors;
        var editorNames = Object.keys(cellEditors.items);
        var editors = editorNames.map(function (name) {
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

        resettable('editor', name);

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

        resettable('localizer', name);

        if (select) {
            feedback(select.parentElement);
        }
    }

    function addOptionInAlphaOrder(el, text, value) {
        if (!el) {
            return;
        }

        var optionEls = Array.prototype.slice.call(el.options);

        var index = optionEls.findIndex(function (optionEl) {
            return optionEl.textContent === text;
        });
        if (index >= 0) {
            el.selectedIndex = index;
            return; // already in dropdown
        }

        var firstOptionGreaterThan = optionEls.find(function (optionEl) {
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
        setTimeout(function () {
            el.style.display = 'none';
        }, 750 + 50 * confirmation.length);
    }

};