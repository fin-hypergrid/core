'use strict';

var grid, tabBar, tutorial, callApi;

window.onload = getSmart.bind(null, {
    data: '../data/four-stocks.json',
    state: 'defaults/state.json',
    scrollbars: 'defaults/scrollbars.css;txt', // ;txt forces get as text rather than style element
    localizer: 'defaults/localizers.js;snippets', // ;snippets forces get as text snippets array rather excuted code
    editor: 'defaults/cell-editors.js;snippets',
    toc: 'defaults/table-of-contents.js',
    'reset-svg': 'img/reset.svg',
    'delete-svg': 'img/delete.svg'
}, function(defaults) {
    var NEW = '(New)';
    var isCamelCase = /[a-z][A-Z]/;
    var saveFuncs = {
        editor: saveCellEditor,
        localizer: saveLocalizer
    };

    // Append version numbers to <h1> header
    document.querySelector('body > h1:first-child').innerHTML += ' <sup>(rev. 13)</sup> — Hypergrid <sup>(v' + fin.Hypergrid.prototype.version + ')</sup>';

    function injectSVG(el, svg) {
        var svgElement = /<svg[^]*<\/svg>/;
        var match = svg.match(svgElement);
        if (match) {
            el.innerHTML = match[0];
        } else {
            console.warn('No <svg> markup found.');
        }
    }

    // Create inline <svg> elements rather than using <img> tag.
    // This allows us to set the <svg>'s fill and stroke colors with CSS.
    Object.keys(defaults).filter(function(key) { return /-svg$/.test(key); }).forEach(function(key) {
        var className = key.replace('svg', 'button');
        var els = document.getElementsByClassName(className);
        Array.prototype.forEach.call(els, function(el) {
            injectSVG(el, defaults[key]);
        });
    });

    tabBar = new CurvyTabs(document.getElementById('editors'));
    tabBar.paint();

    grid = new fin.Hypergrid();

    initLocalsButtons();

    var pagerOptions = {path: 'tutorial/', toc: []};

    // flatten the hierarchical defaults.toc into pagerOptions.toc
    walk(defaults.toc);
    function walk(list) {
        list.forEach(function (item) {
            if (Array.isArray(item)) {
                walk(item);
            } else {
                pagerOptions.toc.push(item);
            }
        });
    }

    // If there is a page number cookie value, use it!
    var match = location.search.match(/[?&]p=([^?&]+)/) || document.cookie.match(/\bp=([^?&]+)/);
    if (match) {
        pagerOptions.startPage = decodeURIComponent(match[1]);
    }

    tutorial = new CurvyTabsPager(
        document.getElementById('page-panel'),
        new CurvyTabs(document.getElementById('tutorial')),
        pagerOptions
    );

    callApi('data'); // inits both 'data' and 'state' editors
    callApi('scrollbars');

    initObjectEditor('localizer');
    initObjectEditor('editor');

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
        };
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

    function callApi(methodName, type, confirmation) {
        // When `methodName` is `undefined` or omitted promote 2nd and 3rd params
        if (!methodName || !isCamelCase.test(methodName)) {
            confirmation = type;
            type = methodName;
            methodName = 'set' + capitalize(type);
        }

        var textEl = document.getElementById(type); // tab editor's textarea element
        var resetEl = document.getElementById('reset-' + type);

        textEl.oninput = function() {
            resetEl.firstElementChild.classList.toggle('disabled', textEl.value === stringifyAndUnquoteKeys(defaults[type]));
        };

        if (textEl.value) {
            localStorage.setItem(type, textEl.value);
        } else if (!(textEl.value = localStorage.getItem(type))) {
            textEl.value = stringifyAndUnquoteKeys(defaults[type]);
            localStorage.setItem(type, textEl.value);
        }

        // We're using eval here instead of JSON.parse because we want to allow unquoted keys.
        switch (type) {
            case 'data':
                grid.setData(eval(textEl.value), {schema: []});
                callApi('state'); // reapply state after resetting schema (also inits state editor on first time called)
                break;
            case 'state':
                // Note: L-value must be inside eval because R-value beginning with '{' is eval'd as BEGIN block.
                var Lvalue;
                grid[methodName](eval('Lvalue =' + textEl.value));
                break;
            case 'scrollbars':
                injectCSS('custom', textEl.value);
                break;
        }

        if (confirmation) {
            feedback(textEl.parentElement, confirmation);
        }

        textEl.oninput();
        resetEl.onclick = resetTextEditor;
    }

    function resetTextEditor() {
        var type = this.id.replace(/^reset-/, '');
        if (confirm('Reset the ' + capitalize(type) + ' tab editor to its default?\n\nCAUTION: This is not an undo. It restores the editor content to the app\'s original built-in default value!')) {
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
            localStorage.removeItem(type + '_' + name);
            dropdown.options.remove(dropdown.selectedIndex);
            dropdown.selectedIndex = 0; // "(New)"
            dropdown.onchange();
        }
    }

    function isDisabled(el) {
        var svg = el.firstElementChild;
        return svg.classList.contains('disabled');
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

    function initObjectEditor(type) {
        var dropdownEl = document.getElementById(type + '-dropdown'),
            resetEl = document.getElementById('reset-' + type),
            deleteEl = document.getElementById('delete-' + type),
            scriptEl = document.getElementById(type + '-script'),
            addButtonEl = dropdownEl.parentElement.querySelector('.api'),
            prefix = type + '_',
            save = saveFuncs[type],
            newScript;

        // STEP 1: Save default scripts to local storage not previously saved
        defaults[type].map(extractName).sort().forEach(function(name) {
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
            name = dropdownEl.value;
            grid.repaint();
        };
    }

    function enableResetAndDeleteIcons(type, name) {
        var resetEl = document.getElementById('reset-' + type);
        var deleteEl = document.getElementById('delete-' + type);

        if (name) {
            var defaultScript = getDefaultScript(type, name);
            var editedScript = document.getElementById(type + '-script').value;
            var alteredFromDefault = defaultScript && defaultScript !== editedScript;
            resetEl.firstElementChild.classList.toggle('disabled', !alteredFromDefault);
            deleteEl.firstElementChild.classList.toggle('disabled', !!defaultScript);
        } else {
            resetEl.firstElementChild.classList.add('disabled');
            deleteEl.firstElementChild.classList.add('disabled');
        }
    }

    function getDefaultScript(type, name) {
        return defaults[type].find(isScriptByName.bind(null, name));
    }

    function isScriptByName(name, script) {
        return extractName(script) === name;
    }

    function extractName(script) {
        var match = script.match(/\.extend\('([^']+)'|\.extend\("([^"]+)"|\bname:\s*'([^']+)'|\bname:\s*"([^"]+)"/);
        return match[1] || match[2] || match[3] || match[4];
    }

    function stringifyAndUnquoteKeys(obj) {
       return typeof obj === 'object'
            ? JSON.stringify(obj, undefined, 2)
                .replace(/(  +)"([a-zA-Z$_]+)"(: )/g, '$1$2$3') // un-quote keys
            : obj;
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
            alert(err + '\n\nAvailable locals:\nmodule');
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

    function injectCSS(name, css) {
        var prefix = 'injected-stylesheet-finbar-';
        var id = prefix + name;
        var el = document.getElementById(id);

        if (!el) {
            el = document.createElement('style');
            el.setAttribute('id', id);
        }

        el.innerHTML = css;

        var baseEl = document.getElementById(prefix + 'base');
        baseEl.parentElement.insertBefore(el, baseEl.nextElementSibling);
    }

    window.callApi = callApi; // for access from index.html `onclick` handlers
});