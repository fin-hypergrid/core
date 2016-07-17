A cell editor is an input control superimposed on the grid.

### API

For detailed functional descriptions of overrideable methods, see {@link CellEditor}.

### Usage

The following examples require a grid object:

```javascript
var grid = new Hypergrid(...);
var behavior = grid.behavior;
var dataModel = behavior.dataModel;
```

#### Assignment

Cells are only editable when assigned (associated with) a cell editor. There are two ways of making such an assignment:
* **Declaratively** at setup time
* **Programmatically** at render time

**Declarative cell editor assignment.** Define the `editor` render property at setup time:
  
```javascript
behavior.setColumnProperties(columnIndex, {
    editor: 'textfield' // case-insensitive
});
```

**NOTE:** There is no preset grid default for `editor` so if you make an explicit declaration (above) and you don't make a programmatic assignment (below), the cell will not be editable.

**Programmatic cell editor assignment.** Override the declared assignment at render time by overriding `dataModel.getCellEditorAt`:

```javascript
dataModel.getCellEditorAt = function(columnIndex, rowIndex, declaredEditorName, options) {
    var editorName = declaredEditorName;
    if (...) {
        editorName = 'textfield'; // case-insensitive
    }
    return grid.cellEditors.create(editorName, options);
}
```

Notes:
1. See {@link DataModel#getCellEditorAt|getCellEditorAt} for parameter details.
2. The method override above pertains to this grid instance. To affect all instances, override the prototype's definition.
3. The ellipsis (...) in the sample code above selects a specific cell (or column). Otherwise the assignment would affect all cells in the grid which is usually not what we want to do.

#### Text Format

Cell editors that present data in text form will respect the cell's `format` render property (used primarily by the cell renderer):
  
```javascript
behavior.setColumnProperties(columnIndex, {
    editor: 'textfield',
    format: 'number' // also case-insensitive
});
```

<a id="getCellEditorAt-1"></a>At render time, override _or_ ignore the declared format (available in `options.format`):

```javascript
dataModel.getCellEditorAt = function(columnIndex, rowIndex, declaredEditorName, options) {
    if (...) {
        options.format = 'number'; // override
        // or:
        options.format = undefined; // ignore (falsy defers to cell editor's localizer)
    }
    return grid.cellEditors.create(declaredEditorName, options);
}
```

#### Templates

All cell editors (textual or graphical) create their DOM node from a template, typically defined on the cell editor object's prototype. We will learn more about creating custom cell editors later on. For now, just consider the following template of a hypothetical cell editor called `Checkbox`:

```javascript
var Checkbox = CellEditor.extend('Checkbox', {
    template: '<input type="checkbox" {{chkattr}}>'
};
grid.cellEditors.add(Checkbox);
```

A word about {@link https://mustache.github.io|mustache} data merge variables. These are useful for decorating the cell editor's markup with state. For example, `{{chkattr}}` in the above is such a variable, intended as a placeholder for a `checked` attribute in the `<input>` tag. Mustache variables are defined on the instantiation `options` object at grid render time:

```javascript
dataModel.getCellEditorAt = function(columnIndex, rowIndex, declaredEditorName, options) {
    if (columnIndex === behavior.columnEnum.CITIZEN ) {
        options.chkattr = this.getValue(columnIndex, rowIndex) ? 'checked="checked"' : '';
    }
    
    return grid.cellEditors.create(declaredEditorName, options);
}
```

Members of `options` will add (or override) instance members. On instantiation, the template is processed by Mustache to merge in the `checked` object property and the template will be rendered like this:

```html
<input type="checkbox" checked="checked">
```

A better approach puts the logic on the cell editor object in a `chkattr` getter:

```javascript
grid.cellEditors.add(CellEditor.extend('Checkbox', {
    template: '<input type="checkbox" {{chkattr}}>',
    getEditorValue: function() {
        return this.input.checked;
    },
    //setEditorValue: function(value) {
    //    this.input.checked = value;
    //},
    chkattr: {
        get: function() { 
            return this.initialValue ? 'checked="checked"' : ''; 
        } 
    }
}));
```

Custom cell editors are generally easy to create. The above example is more complicated than usual because it uses a `defineProperty` {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty|accessor descriptor}, necessary to define a getter. (You cannot use getter/setter literal syntax here as you can in a true prototype object.) See _Create a custom cell editor_ below for more information.

Tip: Best practice is to define custom cell editors when feasible rather than using the `options` instantiation parameter to override instance members.

#### Object access

Sometimes templates do not provide enough flexibility. Or some developers simply prefer the programmatic over the declarative approach. (Both approaches have their pros and cons.) In these cases, the cell editor object and its generated DOM elements can be manipulated _after_ instantiation:

```javascript
<a id="getCellEditorAt-2"/>></a>dataModel.getCellEditorAt = function(columnIndex, rowIndex, declaredEditorName, options) {
    var cellEditor = grid.cellEditors.create(declaredEditorName, options);
    
    if (columnIndex === behavior.columnEnum.CITIZEN && this.getValue(columnIndex, rowIndex)) {
        cellEditor.input.setAttribute('checked', 'checked');
    }
    
    return cellEditor;
}
```

_**NOTE:**_ The `create` call will return `undefined` if the named editor was unregistered. This would throw an error in the above example. To ignore such an error (and simply make the cell uneditable), check `cellEditor` before trying to access it:

```javascript
    if (cellEditor && ...) { ... }
```

#### Data coordinates in `getCellEditorAt`

`columnIndex` is the position of the column in the `fields` array. As this array is typically derived from the data source, its order is undefined. The `behavior.columnEnum` hash maps column names to indices. Keys are all upper case with underscores inserted between "camelCase" words ("CAMEL_CASE"). Although syntactically convenient and efficient, be aware that `columnEnum` is recreated on every call to `behavior.createColumns()` (called by `behavior.setData()`) so any local references to the hash must be updated at that time.

As an alternative to dealing with `columnIndex` at all, `options.column.name` contains the actual column name.
 
`rowIndex` is the position in the data row, offset by the number of header rows -- which is all the rows above the first data row, including the filter row.

See the full {@link DataModel#getCellEditorAt|getCellEditorAt} API.

### Preregistered Cell Editors

The following cell editors are preregistered in `grid.cellEditors`. See each for its template and notes on browser limitations.

* {@link http://openfin.github.io/fin-hypergrid/doc/Color.html|Color}
* {@link http://openfin.github.io/fin-hypergrid/doc/ComboBox.html|ComboBox}
* {@link http://openfin.github.io/fin-hypergrid/doc/Date.html|Date}
* {@link http://openfin.github.io/fin-hypergrid/doc/Number.html|Number}
* {@link http://openfin.github.io/fin-hypergrid/doc/Slider.html|Slider}
* {@link http://openfin.github.io/fin-hypergrid/doc/Spinner.html|Spinner}
* {@link http://openfin.github.io/fin-hypergrid/doc/Textfield.html|Textfield}

### Development

Custom cell editor development falls into two broad classes:
* General (graphical) editors &mdash; extend from {@link CellEditor}
* Text editors &mdash; extend from {@link Textfield} (which itself extends from `CellEditor`)

Development of **text-based cell editors** is relatively simple because they consist of a single `<input>` element and use localizers (formatters/de-formatters) to do the heavy lifting.

#### Get the {@link Textfield} base class

All custom text cell editors extend from the {@link Textfield} constructor. {@link Textfield} is preregistered in `grid.cellEditors`, making it is accessible via `get`:

```javascript
var Textfield = grid.cellEditors.get('textfield');
```

You don't have to use `get`; it merely looks in the registry and returns a reference to the constructor. Registering modules by name allows string references which are easy to persist. If you're not interesting in persisting these mappings, you can reference your cell editor constructors directly. For example, if you're using the npm module with Browserify, you can also do:

```javascript
var Textfield = require('fin-hypergrid/src/cellEditors/Textfield');
```

#### Create a custom cell editor

Cell editors are "classes" that extend from `CellEditor` (or a descendant thereof). Here's a simple extension of {@link Textfield} that limits input to 5 chars (for _hh:mm_) by modifying the template:

```javascript
var template = Textfield.prototype.template.replace(' ', ' maxlength="5" ');

var Time = Textfield.extend('Time', {
    template: template
});
```

The above creates a custom "class" `Time` using _prototypal inheritance_ to extend (inherit from) `Textfield` (which itself was extended from `CellEditor`). See {@link http://github.com/joneit/extend-me} for details on this `extend` function. In a nutshell:
* The object literal contains the new constructor's prototype members (which may include overrides of members on the base class's prototype).
* On instantiation, the `initialize` method is called on every ancestor prototype first, from most senior to most recent, before our prototype's version is called._
* The optional class name (`'Time'`, in this case) aids in debugging.

#### Registration

Register your new cell editor to make it accessible by name for easy assignment (as discussed above):

```javascript
grid.cellEditors.add(Time); // omitting name uses class name
grid.cellEditors.add('Time', Time); // specify a name if class was not named
```

#### Localizers/Formatters

Formatters are contained within localizers which are objects that are languistically and regionally sensitive to alphabet, numbering systems, notation for numbers and date, etc. Localizers know how to:
 * Format primitive types into human-friendly form.
 * De-format (parse) edited values back into primitive types.
 * Optional: Validate edits that they conform to the format.

Localizers are APIs (not instantiated objects) with both `format` and `parse` methods. Cell editors use both these methods. (Cell renderers also use localizers, but only the `format` method.)

To load and edit the data in the _hh:mm_ format, we will use the `hhmm` localizer. (See the example in the full _{@tutorial localization}_ tutorial.) First make sure to register it (so it can be referenced by name):

```javascript
grid.localization.add('hh:mm', hhmm); // name may be omitted when included in localizer
```

If we can guarantee our custom `Time` cell editor will only be used on columns that already render data in the _hh:mm_ format, then we're done because the cell editor will by default import the column's format. In this case the following is sufficient:
  
```javascript
grid.behavior.setColumnProperties(columnIndex, {
    editor: 'time',
    format: 'hh:mm' // used by both cell renderer and cell editor
});
```

Cell render format and edit format do not have to match, however. For example, to render the raw data without formatting (total minutes) but still edit in _hh:mm_ format:

```javascript
grid.behavior.setColumnProperties(columnIndex, {
    editor: 'time'
});

var Time = Textfield.extend({
    localizer: 'hh:mm',
    template: template
});
```

Or you can specify distinct formatters for rendering _vs._ editing:

```javascript
grid.behavior.setColumnProperties(columnIndex, {
    editor: 'time',
    format: '00h00m' // used only by cell renderer
});

var Time = Textfield.extend({
    localizer: 'hhmm',
    format: null, // lock localizer from being overwritten with 00h00m
    template: template
});
```

#### Validation

Without validation, data may be saved incorrectly or not at all. With validation, the user is informed of the problem and has the opportunity to correct it.

Validation is provided by the localizer in an {@link localizerInterface#invalid|invalid} method. See `hhmm`'s implementation of `invalid()` for an example.

The localizer's `invalid` method is called automatically by the cell editor's {@link CellEditor#validateEditorValue|validateEditorValue} method, returning `true` or an error message on validation failure.

Alternatively, you can override `validateEditorValue` with your own logic that doesn't depend on the localizer.

#### Feedback

Validation failure triggers an _error effect,_ giving the user the opportunity to re-edit the value instead of just discarding it and closing.

Specifically, the cell editor its {@link CellEditor#errorEffectBegin|errorEffectBegin} method with the error message. This in turn calls the error effect function in {@link CellEditor#errorEffect|errorEffect} which is {@link module:effects.shaker|shaker} by default.

After every third failure in an editing session, an alert is displayed:

<pre style="font-family:monospace;margin:0 3em;padding:1em;border:1px solid grey;background:#DDD">
Invalid value. To resolve, do one of the following:

    * Correct the error and try again.
        - or -
    * Cancel editing by pressing the "esc" (escape) key.
</pre>

If an error message was returned by `invalid` and/or the localizer has a defined {@link localizerInterface#expectation|expectation} message, they will be included in the alert:

<pre style="font-family:monospace;margin:0 3em;padding:1em;border:1px solid grey;background:#DDD">
Additional information about this error:

    * Error message (if there is one) would go here.

    * Expectation message (if defined) would go here.
</pre>

Note that multiple lines become separate bullet points.

### Complex cell editors

Cell editors can be arbitrarily complex. Instead of a simple `<input>` element, the cell editor's template can be a container element, which can contain any kind of GUI you can imagine &mdash; with or without text input.
 
There are two design paradigms for a complex cell editor with a text box differ in whether or not they modify the text being edited:
* **Dynamic Paradigm:** User interactions with the graphical elements during editing instantaneously update the text being edited. On save, the text element can be editable or it can be read-only. As the text element contains all the information, it is validated and parsed as usual.
* **Delayed Paradigm:** User interactions with the graphical elements during editing do not affect the text. On save, the information from the state of the graphical elements is combined with the text data before parsing or transforms the primitive data after parsing.

We shall now further develop our `Time` cell editor example:
* We're going to show the time as 12-hour time with AM and PM rather than as 24-hour time.
* Rather than typing AM or PM, user will click on it to toggle it.

_NOTE: This is just an example for illustrative purposes. I'm not suggesting it's a practical user interface._

We keep the text input element and add an AM/PM indicator to it's right that toggles on a mouse click. This example uses the _Delayed Paradigm_ outlined above: The text input element holds just the time in 12-hour mode; the AM/PM indicator is not part of the text and clicking it has no effect on the text.

The following markup for a complex cell editor consists of a `<div>` containing an `<input>` element along with some text: 

```html
<div style="background-color:white; text-align:right; font-size:10px; padding-right:4px; font-weight:bold; border:1px solid black">
    <input type="text" lang="{{locale}}" style="background-color:transparent; width:80%; height:100%; float:left; border:0; padding:0; font-family:monospace; font-size:11px; text-align:right; {{style}}">
    AM
</div>
```

_NOTE: In practice, a CSS class is preferred over in-line styles. Regardless, always preserve the mustache variables, including `{{style}}` as shown._

Because this cell editor includes a text box, we continue to extend from `Textfield`:

```javascript
var Time = Textfield.extend({
    template: '<div> ... </div>'; // above markup
});
```

Complex cell editors need to know the element that holds the value (because unlike as in a simple cell editor, the actual input element `input` and the root DOM element `el` _are no longer the same_):

```javascript
var Time = Textfield.extend({
    template: template,
    
    initialize: function() {
        this.input = this.el.querySelector('input'); // needed by various CellEditor methods
    }
});
```

We will also need...
1. **Event handlers** &mdash; to flip AM/PM on a mouse click.
2. **Method overrides** &mdash; additional logic to combine AM/PM with the 12-hour time in the text box.

#### Add an event handler

Listen for the mouseclick and toggle the graphic (AM -> PM -> AM ...):

```javascript
var Time = Textfield.extend({
    template: template,
    
    initialize: function() {
        this.input = this.el.querySelector('input');
        this.meridian = this.el.querySelector('span'); // optional; just for our convenience 
        
        // Flip AM/PM on any click
        this.el.onclick = function() {
            this.meridian.textContent = this.meridian.textContent === 'AM' ? 'PM' : 'AM';  field
        }.bind(this);
        this.input.onclick = function(e) {
            e.stopPropagation(); // ignore clicks in the text FIELD
        };
        
        // nice-to-have: show outline on `el` rather than `input`
        // alternatively, set `outline:0` on the input style and forget about it
        this.input.onfocus = function(e) {
            var target = e.target;
            this.el.style.outline = this.outline = this.outline || window.getComputedStyle(target).outline;
            target.style.outline = 0;
        }.bind(this);
        this.input.onblur = function(e) {
            this.el.style.outline = 0;
        }.bind(this);
    }
});
```



#### Update the localizer to 12-hour time

Compare the following to the 24-hour time version in the _{@tutorial localization}_ tutorial:

```javascript
var hhmm = {
    // returns formatted string from number
    format: function(mins) {
        var hh = Math.floor(mins / 60) % 12 || 12, // modulo 12 hrs with 0 becoming 12
            mm = (mins % 60 + 100 + '').substr(1, 2);
        return hh + ':' + mm;
    },
    
    invalid: function(hhmm) {
        return !/^(0?[1-9]|1[0-2]):[0-5]\d$/.test(hhmm); // 12:59 max
    },
    
    // returns number from formatted string
    parse: function(hhmm) {
        var parts = hhmm.match(/^(\d+):(\d{2})$/);
        return Number(parts[1]) * 60 + Number(parts[2]);
    }
};
```

#### Loading GUI state

The state of the graphical elements needs to be loaded (set) at the beginning of an edit session, as implied by the primitive data. In this example, the only GUI element is the AM/PM toggle, set based on the time's relation to noon.

GUI elements are initialized by overriding the {@link CellEditor#setEditorValue|setEditorValue} method:

```javascript
var NOON = 12 * 60;

Time.prototype.setEditorValue = function(value) {
    this.input.value = this.localizer.format(value); // pasted in from base class implementation
    this.el.textContent = value < NOON ? 'AM' : 'PM';
};
```

#### Saving GUI state: Delayed Paradigm

For the _Delayed Paradigm_ only, GUI state needs to be saved at the conclusion of an edit session but before saving. This is done by overriding the {@link CellEditor#setEditorValue|setEditorValue} method.

The GUI state is inspected and used used to either:
1. **Decorate the text** input before it is run through the parser; or
2. **Transform the data** primitive coming out of the parser.

This example uses the _Delayed Paradigm_ so the state of the AM/PM toggle is saved at the conclusion of editing by transforming the data. Specifically, 12 hours is added for afternoon values only:
    
```javascript
Time.prototype.getEditorValue = function(value) {
    value = this.localizer.parse(this.input.value); // pasted in from base class implementation
    if (this.el.textContent === 'PM') {
        value += NOON;
    }
    return value;
};
```

NOTE: Code pasted in above was for illustrative purposes. In practice, you might make direct calls to the base class methods instead:

```javascript
var CellEditor = grid.cellEditors.get('celleditor');
```

and replace commented lines above with:

```javascript
    CellEditor.prototype.setEditorValue.call(this, value);
```

and

```javascript
    value = CellEditor.prototype.getEditorValue.call(this, value);
```

respectively.

#### Saving GUI state: Dynamic Paradigm

The _Dynamic Paradigm_ as outlined above means that the GUI elements hold state that is always reflected in the contents of the text element.

For our `Time` cell editor, this means that the AM or PM would be inside the text element. The user can edit it as text, or he could click the control to toggle it.
 
_NOTE: On a practical level, the GUI should no longer be a piece of text because the AM or PM would appear doubled (once in the text box and again to its right). Perhaps a checkbox to indicate afternoon/evening instead._

For this to work correctly requires _two-way binding_ between the GUI elements and text, meaning that:
1. User's changes to the GUI state instantaneously affect the text; and
2. User's edits to the text instantaneously affect the GUI state.
 
This requires adding logic as needed to your GUI element event handlers or listeners to express the element's state in the text. For example, we could add the following line to the end of the GUI handler developed above:

```javascript
this.input.value.replace(/(AM|PM)$/i, this.meridian.textContent);
```

You could obviously get much more elaborate than this, maintaining models and view-controllers for each GUI element, _etc.;_ if it were anything more complex than this, that might be a good idea.
 
The base class is already listening for `keyup` events on the text element. To bind the text edit events to the GUI state, we could just add our code there. For example, we could say:

```javascript
Time.prototype.keyup = function(e) {
    CellEditor.prototype.keyup.call(this, e);
    
    var meridian = this.input.value.match(/(AM|PM)$/i);
    if (meridian) {
        this.meridian = meridian[0].toUpperCase();
    }
}
```

This would also require changing `hhmm.invalid` and `hhmm.parse` to accept AM or PM.

Finally, for some good news: We can discard the `setEditorValue` and `getEditorValue` overrides.

### Graphical editors

Purely graphical editors (with no text box) would descend directly from `CellEditor`.

One thing to keep in mind about these is that while the dimensions of the container element are automatically constrained to those of the cell, the child GUI elements can nonetheless be rendered by the browser _outside_ the div. This is useful when your GUI cannot all fit inside the cell boundaries. Just make sure the {@link https://developer.mozilla.org/en-US/docs/Web/CSS/overflow|overflow} CSS property is set to `visible` (which is the default). 
