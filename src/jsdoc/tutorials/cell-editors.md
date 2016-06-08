This document describes the Cell Editor interface. This information is useful to the application developer to better understand what cell editors are, how to use them, and how to create custom cell editors.

#### Definition

A **cell editor** is a JavaScript object, descended from `CellEditor`, which serves as a basic _view-controller_, placing DOM elements on top of the Hypergrid `<canvas>` element, positioned precisely over the particular grid cell the user wants to edit.

#### Hypergrid

The reader should be familiar with Hypergrid basics. In particular, that the Hypergrid runtime defines an object (or "class") called a `Hypergrid`. The application developer instantiates one or more of these grids, each of which inserts itself into the DOM as a single `<canvas>` element + two `<div>` elements for the horizontal and vertical scrollbars.

For the purposes of this tutorial, we shall define a variable `grid` refer to a single instance of a Hypergrid object:

Hypergrid is available as an npm module:
```javascript
var Hypergrid = require('fin-hypergrid');
var grid = new Hypergrid();
```

Hypergrid is also available as an include file:

```html
<script src="openfin.github.io/fin-hypergrid/build/hypergrid.min.js">
```

```javascript
var grid = new fin.Hypergrid();
```

#### `grid.editor` property

Each grid instance has an `editor` property which holds a reference to its open cell editor. Only one cell editor object will exist for each grid at any one time, and only while in actual use (instantiated late; disposed of early). This `editor` property is `undefined` at all other times. Therefore this property can be tested to determine if a grid's editor is open. At the end of an editing session, the object disposes of itself by setting this property to `undefined`.

#### Cell rendering

Hypergrid's basic function is to render data in rows and columns. Each cell is a visualization of a chunk of data.

Currently, Hypergrid operates on an array of uniform data objects. Each object represents rows in the grid; the properties of each object represent each cell (column) in the row. How the data gets into this array is up to the application developer. Typically, it will come from a database as serialized text data (JSON, XML). This will be parsed into JavaScript primitive values (string, number, boolean, null). The application developer may further process the data into more exotic types (objects such as Date).

Because Hypergrid renders the data into a `<canvas>` element, the various primitives and objects can be presented in any form that can be projected onto a two dimensional surface. A lot of data is typically presented simply as text, which requires serializing the data back into text form. Other data, however, may better be presented in graphical form.

#### Cell editing

How cell editors display and edit data is independent from how the same data is rendered into the canvas before and after editing. For text data, the editor may offer a text editor, typically utilizing an HTML `<input>` element. For example, simple numeric data are often best edited as numbers in text form.

On the other hand, cell editors do not have to match the modality of the data. Even if rendered into the grid as text, some data is better edited in a non-text graphical user interface. For example, a date might be rendered as text but its cell editor might show a calendar picker control.
 
Or vice-versa: A cell might render its data in non-text form, but the cell editor might edit it in text form. For example, a cell might render as an analog clock face but its cell editor might just ask the user to edit the time in the familiar text form of number of hours and number of minutes.

For dates, times, and other data familiarly represented by a number or a set of numbers (_e.g.,_ colors), _hybrid_ "picker" controls are popular alternatives. Such controls have a text entry section _and_ a GUI section. Editing one instantaneously updates the other. (Hypergrid includes a `ComboBox` cell editor object that sports a text box like a regular text editor but also slides open a GUI. Developers can extend this object to create their own custom hypbrid controls.)
 
#### Text cell editors

It is typical to see grids with a lot of text cells. This is because there are many types of text data: Numbers, dates, currency, dates, coordinates, measurements, not to mention string data. Basically this comes down to formatting. All text cell editors extend from the `Textfield` cell editor, with the only difference being which formatter they reference. Actually, cell editors reference an object called a _localizer_. A localizer includes both a formatter (`format`) as well as a de-formatter (`parse`). Cell editors need to know how to do both these operations.

For example, if the cell data is number of minutes and we want to edit in the form _hh:mm_, we'll need a formatter to format the data for editing, and a de-formatter to remove the formatting after editing. We wrap these in a _localizer_ API as `format` and `parse`:

```javascript
var hhmm = {
    format: function(mins) { return ...; }, // returns formatted string from number
    parse: function(syntax) { return ...; } // returns number from formatted string
}
```

For a cell editor we will also need a de-formatter:

```javascript
var regexHHMM = /^(\d+):([0-5]\d)$/;
function hhmm_deformatter(hhmm) {
    var parts = hhmm.match(regexHHMM);
    return Number(parts[1]) * 60 + Number(parts[2]);
}
```
```javascript
function hhmm_formatter(mins) {
    return Math.floor(mins / 60)+ ':' + (mins % 60 + 100 + '').substr(1, 2);
}
```

We can use this localizer to create a new text cell editor:

```javascript
var cellEditors = require('fin-hypergrid/src/cellEditors');
var Textfield = cellEditors.get('textfield'),
    HoursMinutes = TextField.extend({ localizer: localizer });
cellEditors.register(HoursMinutes, 'hhmm');
```

#### Syntax errors and error feedback

What happens when the user enters a value with an invalid syntax?

The short answer is: The value is ignored; the user looses his edit. This will quickly prove frustrating for the user.

The long answer: Better would be to provide some sort of error alert and let the user correct the edit before losing it.

If you define an `invalid()` method on your localizer, your text cell editor will automatically provide feedback to the user on a syntax error:

```javascript
hhmm.isValid = function(hoursAndMinutes) { return ...; } // returns true for valid
```

When the edited text is invalid, an error effect is triggered. Every third time the effect is triggered is followed by an alert message explaining the situation:

<pre style="font-family:monospace;margin:0 3em;padding:1em;border:1px solid grey;background:#DDD">
Invalid value. To resolve, do one of the following:

    * Correct the error and try again.
        - or -
    * Cancel editing by pressing the "esc" (escape) key.
</pre>

You can add a custom message by also defining an `expectation` property:

```javascript
hhmm.expectation = 'Expected a time signature in the format hh:mm.'
```

This will expand the alert message:

<pre style="font-family:monospace;margin:0 3em;padding:1em;border:1px solid grey;background:#DDD">
Invalid value. To resolve, do one of the following:

    * Correct the error and try again.
        - or -
    * Cancel editing by pressing the "esc" (escape) key.
    
Additional information about this error:

    * Expected a time signature in the format hh:mm.
</pre>

You can control which effect is used to signal the negative feedback and when to show the alert message:

#### Which cells are editable?

Only _filter cells_ and _data cells_ can use cell editors. Column headers and row handles are also cells but these cannot be edited. In addition, cells in summary rows, and cells in drill-down columns are not editable.

Filter cells are automatically assigned to the `filterbox` cell editor. For a data cell to be editable however, it must have a cell editor _assigned_ to it. In most cases default assignments are made automatically. (See _Assigning a cell editor,_ below.)

### Lifecycle of a cell editor

All cell editors go through the following steps (step 6 is skipped when the editing session is abandoned):

1. **Generate a _view,_** a graphical user interface consisting of either:
   * A single interactive DOM element that holds the control's value, typically in its `value` attribute. Referenced by both the view's `el` and `input` properties.
   * A containing element (`el`) with nested sub-elements, one of which (`input`) is designated to hold the control's value.
2. **Fetch the cell value** from the data store and incorporate it into the view.
3. **Insert the view** into the DOM at the start of a cell editing session.
4. **Control the view** by listening for events and responding by manipulating the view.
5. **Remove the view** from the DOM at the conclusion (or abandonment) of the cell editing session.
6. **Save the new value:**
   a. **Extract the edited value** from the `input` element.
   b. **Parse the edited value** from its presentational (formatted) form back into its data form.
   c. **Convert the parsed value** to type as needed.
   d. **Store the new value** into the underlying data store.
7. **Dispose of the view.**

#### Instantiation

As noted, the cell's assigned cell editor object is instantiated one at a time and only as needed. The new object is assigned to your grid's `editor` property; and this property is undefined when the object is disposed of.

#### Standard cell editors

Hypergrid comes with a set of standard cell editors. (See _What's in the box?_ below.) Most of these are simple implementations of various types of the HTML `<input>` element (text, date, color, etc.). However, like cell renderers, cell editors can take any form and are not restricted to the use of the `<input>` element.

#### Invoking a cell editor

Cell editors are typically invoked through user interaction, although they may also be invoked programmatically.

##### Beginning editing
   
The user initiates a cell editing session:
* *On a filter cell* with a single (or double) mouse click; or
* *On a data cell* with a double mouse click.

The application developer can begin a session programmatically on a particular cell as follows:
```javascript
var Point = require('rectangular').Point;
yourGrid.onEditorActivate({ gridCell: new Point(columnIndex, rowIndex) };
```

If the cell has no cell editor class assigned to it, nothing will happen. But if there is a cell editor, the following happens:
1. A cell editor object is instantiated from the assigned class. This object serves as a view controller.
2. The cell editor is used to create a view, consisting of DOM `Node`s and event handlers.
3. The view is inserted into the DOM on top of the grid's `<canvas>` element, positioned precisely over the cell's image in the canvas.
4. During this time, canvas scrolling is suppressed.

The user can now interact with the control to "edit" the data in the cell. Eventually, the user either saves or cancels the editing session.

##### Concluding editing (save)

The new value is accepted by pressing the *_enter_* (aka *_return_*) key or the *_tab_* key; or by "clicking away" from (clicking or double-clicking outside of) the control (including a click that would initiate editing of another cell).

Or programmatically:
```javascript
yourGrid.stopEditing();
```

The DOM element(s) are removed from the DOM; and the cell editor (view controller object) is disposed of.

##### Aborting editing (cancel)

The edit can be aborted by pressing the *_esc_* ("escape") key on the keyboard; or by scrolling the grid via the mouse-wheel or trackpad gesture.

Or programmatically:
```javascript
yourGrid.cancelEditing();
```

The DOM element(s) are removed from the DOM; and the cell editor (view controller object) is disposed of.

### Assigning a cell editor

As described above, a cell editor class must be assigned to the grid cell in order for an editing session to begin. This assignment may be made _declaratively_ and/or _programmatically_ (see below). If both methods are applied to a cell, the programmatic assignment can inspect and override the declarative assignment. If no assignment is established by either method, the cell will not be editable. However, read the declarative assignment rules carefully, and there are several fallback strategies before the the declaration will truly yield no assignment.

Note that column filter cells are automatically assigned to the `FilterBox` cell editor. This assignment can however be overridden programmatically. (The only practical override for a filter cell editor would presumably be no editor at all, should you want to suppress filter cell editing on a column.)
 
#### Declarative cell editor assignment

By _declarative,_ we mean statements that (typically) use JavaScript object literals to supply _render property_ values to Hypergrid's various _set properties_ methods. These values are necessarily static; they won't change frequently or at all.

Assign a cell editor to a cell explicitly in a declarative statement by referencing them by name:

```javascript
behavior.setColumnProperties(COLUMN_INDEX_SALARY, {
    editor: 'number',
    format: 'number'
});
```
              
This declaration assigns assigns the `'number'` cell editor as the editor to use for all the cells in a particular column; and the `'number'` localizer as the localizer to use to format all the column's cells for display.

Declarations refer to objects by name. In order for the above declaration to work, the name of the cell editor ("number") must have been previously registered in the `cellEditors` API; and the name of the localizer must have been previously registered in the `localization` API.

It is typical to declare a cell editor for all the cells in a column. It would be rare a specific cell (_i.e.,_ in a specific row) to have a cell editor assignment that differs from the other cells in its column.

In the above, the column is referenced by its _absolute_ index, its position within the data model's `fields[]` array. (See the {@tutorial columns} tutorial for more information.)

#### Render properties

Hypergrid maintains special _render property objects_ for the grid, for each column, and optionally for individual cells. The term _render property_ refers to properties of these special objects. The resolution of a render property cascades through these objects from most specific to most general. For example, the resolution of the `editor` render property looks like this:
1. Check for an `editor` cell render property; if undefined then...
2. Check for an `editor` column render property; if still undefined then...
3. Check for an `editor` grid render property.

By "undefined" in the above we mean not either not defined at all (missing from the object), or defined with the `undefined` value. Any other value is considered to be "defined" and will halt the cascade. This includes other falsy values such as `null`. Therefore, `null` can be used to stop the cascade with a falsy value which the code generally interprets as "do not apply the property" (although for certain properties the code may take other default actions).

#### Name resolution

Both localizers and cell editors have defaults. That is, the declarative strategies for both assignments has been extended beyond the usual cascade of a single render property (as listed above) to include the following fallback strategies: 
1. If `format` fails to resolve to a localizer name, the algorithm will look for a formatter with a name that matches the column's `type` name (unless `format` as `null`). That is, if the application developer fails to specify a formatter, but the column has a defined type, we (usually) want to use the default formatter for that type. To avoid this, we can specify `null` for `format`.
2. If `editor` fails to resolve to a cell editor name, the algorithm will look for a cell editor with a name that matches the format as resolved in strategy #1 above. That is, at the beginning of a cell editing session we (usually) want to apply the same formatting to the value initially loaded into the cell editor as was applied when the value was rendered into the grid cell. To avoid this, we can specify `null` for `editor`.

As you can see, the two are interrelated: The localizer strategy is applied first. The cell editor strategy as applied depends on the results of the localizer strategy. The end result being that the cell editor name falls back first to the format name and then to the type name.

In practical terms, when the cell editor name and the formatter name are the same, as in the above example, the `editor` render property can be omitted. As this is usually the case (we usually want the the cell editor session to begin with a value formatted in exactly the same way as the value was rendered into the grid cell), the `editor` render property can be omitted most of the time. Only when we want to use a different cell editor do we need to specify it's name (or `null`).

This scheme requires some clarification because cell editor names, localizer names, and type names belong to entirely separate and unrelated namespaces. Nevertheless, by strategically naming our localizers and cell editors (as they are registered), including creating synonyms, we create a deliberate convergence between the two namespaces. This allows the cascading effect to work for us most of the time.

Note that the `type` property is not a render property that can exist at the cell, column, and grid levels. Rather, it is a regular property on the column object. Therefore, only the column is checked for `type`.

In summary, the full strategy for cell editor resolution cascades as follows:
1. `editor` cell render property
2. `editor` column render property
3. `editor` grid render property
4. `format` cell render property
5. `format` column render property
6. `format` grid render property
7. `type` column object property
 
##### Reference by name

Hypergrid's cell editors are "classes" extended from `CellEditor`. When the user begins cell editing, a cell editor object is automatically instantiated from one of these classes. This is the "active" cell editor. When the user closes the cell editor, the instance is destroyed. Since you can only edit one grid cell at a time, at most only a single cell editor is ever active at any given time. For declarative purposes, each cell editor has a name, generally the name of the object's constructor, although any name can be used.
 
 Internally, the name is stored in all lower case. This supports case-insensitivity in that references to the names are converted to all lower case before dereferencing is attempted. It does mean however that distinct cell editor names must differ by more than case alone.

##### Assignments

The default method assigns cell editors based on the following declarations:

1. The cell's `editor` property is an explicit reference-by-name to a registered cell editor. (Stop.)
2. The cell's `format` property is an explicit reference-by-name to a registered localizer. If the cell's `editor` property is undefined, this name will be used to attempt to resolve the cell editor. (Stop.)
3. The column object's `type` property is the (name of the) primitive data type of all the cells in the column. If the cell's `format` property is undefined, this name will be used to attempt to resolve the cell localizer; and if the cell's `editor` property is also undefined, this name will in turn be used to attempt to resolve the cell editor as well. (Stop.)
4. If the column is untyped, the cell will have to declared localizer nor cell editor.

Specifically, when the user initiates cell editing on a data cell, the data model's `getCellEditorAt` method is invoked with the cell coordinates. Unless overridden, `DataModel.prototype.getCellEditorAt` looks for a cell editor name as described above. If found _and_ it was the name (or synonym) of a registered cell editor, the cell editor is assigned to the cell. Otherwise, the cell will be _non-editable_ unless a cell editor is assigned programmatically at run-time, as described in the following section.
 
##### The `format` property

For data to be presented as text, cells and cell editors both use _localizers_ to format the data primitives into human-readable form. (See the {@tutorial Localizers} tutorial for more information.)

The application developer can specify a cell's format by declaring a localizer name using the `format` cell property. This can be specified at the cell level, the column level, or the grid label. Note that the default value for the `format` property (as defined in ./defaults.js) is `undefined` (meaning non-editable).

A cell editor also declares a localizer, but internally, in its prototype's `localizer` property; and rather than using a registered localizer name, this declaraction consists of a direct references to a {@link localizerInterface|localizer object}. The default value for the `localizer` property (as defined in ./cellEditors/CellEditor.js) is a reference to the "null" localizer (essentially `toString()` function).

Cell editors also use localizers to parse a formatted value back into a data primitive after editing is complete (`cellEditor.localizer.standardize()`).
 
The cell and its editor will generally use the same localizer (although they don't have to). This is why the above cascading assignment rules are often useful: Usually, you only need to specify `editor` if it differs from `format`; and you only really need to specify `format` if the format differs from the column type (or if the column is untyped)

To support this mechanism, localizer synonyms may be registered for for type names; and cell editor synonyms may be registered for localizer names. In this sense, the namespaces overlap. 

#### Programmatic cell editor assignment

This data model's `getCellEditorAt` method is called when the user attempts to open a cell editor. For programmatic cell editor assignment, override it:
 
```javascript
yourGrid.behavior.dataModel.getCellEditorAt = function(x, y) {
    // required: decide which cell editor to use
    var Constructor;
    switch (x) {
        case idx.BIRTH_WEIGHT:
            Constructor = metricWeightCellEditor;
            
        default:
    }
    
    // required: instantiate a new cell editor
    var cellEditor = new cellEditors(this.grid);
    
    // optional: set properties
    cellEditor.property = value;                      

    // optional: set container element's attributes
    if (new Date().getMonth() === 12 - 1) {
        cellEditor.el.classList.add('candycane'); 
    }

    // optional: set input element's attributes
    cellEditor.input.setAttribute('maxlength', '5');  
    
    return cellEditor; // reaquired
};
```

As you can see, the requirements for any implementation of this method is to decide upon a cell editor, instantiate it, and return the new instance.

`getCellEditorAt` is called with the cell coordinates:
Parameter | Description
`x` | The _untranslated_ column index. The _translated" means that this does not refer to the column currently visible in the grid at this position. Columns can be hidden or re-ordered via the UI or programmatically. which is its position in `yourGrid.behavior.columns` (built from `yourGrid.behavior.dataSource.source.fields`). This means that  which means that the column coordinate 

__________________
<sup>*</sup> Alternatively, you can create a custom class extended from `DataModel` with your your implementation of `getCellEditorAt` in its prototype; but you will have to overload `yourGrid.behavior.getNewDataModel` in order to use it.



 
### What's in the box?

Hypergrid comes with several _standard_ cell editors, each represented by a file in the cellEditors folder (./src/cellEditors/).

Note however the two files in that folder which do _not_ represent actual cell editors: *CellEditor.js* is the abstract base class (`CellEditor`) from which all cell editors _extend_ (or _inherit); and *index.js* bundles all the cell editors into a single local npm module.

### Cell editors for HTML5 `<input>` controls

Most of the standard cell editors simply generate one of the HTML `<input>` type UI controls. See the {@link https://www.w3.org/TR/html5/forms.html|W3C Recommendation} or the {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input|Mozilla pae} for more information.

> *Note:* The implementation of these controls across browsers is uneven at best; and none are localizable as they should be. Presumably, these features (including full localization) will come in time to all browsers. But for now, the decision to use these controls should be made carefully, considering how it is implemented on each of the browsers your users are likely to use.

File         | Object    | Markup                  | Cr | Sf | FF | IE | Description
------------ | --------- |------------------------ | -- | -- | -- | -- | -----------
Color.js     | Color     | `<input type="color">`  | +  | -  | +  | ?  | Color picker.
Date.js      | Date      | `<input type="date">`   | +  | -  | -  | -  | Calendar control.
Spinner.js   | Spinner   | `<input type="number">` | +  | +  | +  | -  | Number input with elevator buttons for incrementing/decrementing. With optional clamping (`min`, `max`) and `step` precision attributes.<sup>1,&nbsp;2</sup>
Slider.js    | Slider    | `<input type="range">`  | +  | +  | +  | +  | Sliding range control with optional `min` and `max` attributes.<sup>2</sup>
Textfield.js | Textfield | `<input type="text">`   | +  | +  | +  | +  | Simple text box.

<sup>1</sup> Chrome accepts only characters valid in standard numbers, making this control unusable for fancy formatted numbers (e.g., with thousands separators because commas are not valid characters in standard JavaScript numbers) or for localized numbers (because Chinese numerals for example are not valid characters in standard JavaScript numbers).
<sup>2</sup> See HTML5 documentation for more information on the various attributes of the `input` tag. Values for these attributes can be set in various ways; see section below. 

### Other standard cell editors

The following are the remaining standard cell editors. These do _not_ simply reflect HTML `<input>` controls; they are complex controls comprised of multiple HTML elements. (Sort of like .Net _user controls_.)

File | Object | Markup | Description
---- | ------ | ------ | -----------
ComboBox.js | ComboBox | `<div>`...`</div>` | Combines a text box (`<input type="text">` UI control) with a drop-down (`<select>...</select>` UI control) which appears when the user clicks an arrow icon (`▾`). The user may type into the text box and/or select an item from the drop-down.

### Setting cell editor attributes

To set cell editor attributes (such as `min` and `max` mentioned above), you must override the `myGrid.behavior.dataModel.getCellEditorAt(x, y)` method. The formal parameters `x` and `y` are the cell coordinates.
 
Cell editor attributes may be actual HTML element attributes; or they may be attributes on the cell editor object.
 
#### HTML element attributes

If you know what kind of HTML control you are dealing with, you can set attributes directly on the HTML element using the cell editor's `input` property which references the element:

```javascript
myGrid.behavior.dataModel.getCellEditorAt = function(x, y) {
    if (x === 5) {
        myCellEditor.input.min = -5;
        myCellEditor.input.max = +5;
    }
};
```

You can also 
For styling, you can set the `class` and/or `style` attributes (keeping in mind that the latter overrides any style attributes set by the former). Here's an example that sets both:

```javascript
myGrid.behavior.dataModel.getCellEditorAt = function(x, y) {
    if (x === 5) {
        myCellEditor.input.classList.add('birth-date');
        myCellEditor.input.style.color = 'red';
    }
};

For the above example to work, you would add a CSS stylesheet with a `birth-date` selector:

```css
input.birth-date { font-weight: bold }
```

#### Cell editor object attributes

Another approach is to set attributes as properties on the cell editor object itself. The cell editor can then use these properties during its render process. In particular, these properties are all available to the cell editor's template, as discussed in the following section.

This approach is more appropriate for custom controls when you don't want to know (or care) what kind of HTML elements make it up.

### Cell editor templates

All cell editors have HTML templates. These 


### Custom controls

Custom controls are complex controls made up several HTML input controls. Specifically, a custom control will consist of a container element (referenced with the `el` property) plus 2 or more input controls. The `el` property references the container element. One of the controls inside the container holds the actual cell value and is referenced (as above) with the `input` property. The other controls fill supporting roles and may or may not have referencing properties. (For simple cell editors, `el` and `input` both refer to its single HTML control element.)
 
 Note that setting attributes on the container (`el` property) other than `class` and `style` is probwably not going to be too useful. It is generally more appropriate (dpending of course on the design of the custom control) to set properties on the cell editor object itself, as described above.



Values for the  attributes can be set directly on the cell editor objects. 
``
