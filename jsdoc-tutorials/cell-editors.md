# P R E L I M I N A R Y &nbsp; D O C U M E N T A T I O N 

*THIS DOCUMENT IS INCOMPLETE BUT OFFERED AS IS IN LIEU OF NOTHING.<br>NEXT UPDATE PLANNED FOR EOD 5/16/2016.*

This document describes the Cell Editor interface. This information is useful to the application developer to better understand what cell editors are, how to use them, and how to create custom cell editors.

### What is a cell editor?

A cell editor is graphical user interface overlaid on top of the grid that permits the user to edit the value in a particular grid cell.

Cell editors can take any form. The basic cell editors are simple text input boxes. Cell editors know how to format the raw datum similar to the way it is presented in the grid; they also know how to "de-format" the data back into it's "raw" (primitive) form before storing it back into the data model.

Certain kinds of grid cells can be made _editable_ (can make use of a cell editor), while others cannot:
 
Kind of cell       | Can use a<br>cell editor
------------------ | :---:
Column header      | no
*Column filter*    | *yes*
Row handle         | no
Tree (drill-down)  | no
*Data*             | *yes*
Top & bottom total | no
 
Furthermore, to actually be editable by the user, the cell must have a cell editor associated with it. (See _Associating a cell editor,_ below.)

#### Beginning editing

The user initiates cell editing on a filter cell with a single (or double) mouse click; or on a data cell with a double mouse click.

Providing the cell has a cell editor associated with it, an input control appears positioned precisely over the cell. The user interacts with the control to change the data in the cell.

#### Concluding editing

The new value is accepted by pressing the *_enter_* (aka *_return_*) key, the *_tab_* key, or any of the four arrow keys on the keyboard; or by "clicking away" (clicking outside of) the control (including initiating editing on another cell).

#### Aborting editing

The edit can be aborted by pressing the *_esc_* ("escape") key on the keyboard; or by scrolling the grid via the mouse-wheel or trackpad gesture.


### Associating a cell editor with a cell

*Column filter cells* are automatically associated with the `FilterBox` cell editor, although this can be overridden. (The only practical override for a filter cell editor would probably be no editor at all, should you want to suppress filter cell editing on a column.)
 
*Data cells* may be associated with cell editors _declaratively_ or _programmatically_. Both these methods are explained below. Note that a declaratively association can be overridden programmatically.

Failure to associate a cell editor with a data cell means that the cell will not be editable.
 
#### Declarative cell editor association

*Definition.* By _declarative,_ we mean statements involving JavaScript object literals. Although technically such literals are executed at run-time, they mimic compile-time literal (constant) _declarations_ in other programming languages. These object literals supply property values to Hypergrid's various _set properties_ methods.

*String referects.* Cell editor references in these declarations are always given in string form. That is, rather than a direct reference to a cell editor "class," we use a string containing the name of the constructor function. This facilitates persisting declarative data because such references are pre-_stringified._ It also allows format names to be used to reference cell editors (more on this below).
 
NOTE: Cell editor string references are _case insensitive._ For example, `'textfield'` and `'TextField'` both refer to the `Textfield` cell editor. While this may help simplify things for the application developer, the real reason for this relaxation in the naming rules is, again, to facilitate the use of format names to refer to cell editors.

For declarative cell editor association, there are two such properties of interest, `format` and `editor`. A simple algorithm (in `DataModel.prototype.getCellEditorAt`) searches for a cell editor name as follows:

1. Cell property `editor`; _if undefined, then..._
2. Column property `editor`; _if undefined, then..._
3. Grid property `editor`; _if undefined, then..._
4. Cell property `format`; _if undefined, then..._
5. Column property `format`; _if undefined, then..._
6. Grid property `format`; _if undefined, then..._
7. Cell editor is undefined.
 
If a cell editor value could not be determnined, it remains `undefined` and the cell will be _non-editable..._ Unless, that is, a cell editor is associated programmatically at run-time, as described in the next section.

#### Programmatic cell editor association

This data model's `getCellEditorAt` method is called when the user attempts to open a cell editor. For programmatic cell editor association, override it:
 
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

> *Note:* The implementation of these controls across browsers is uneven at best; and none are localizable as they should be. Presumably, these features (including full localization) will come in time to all browsers. But for now, the decision to use these controls should be made carefully, considering how it is implemented on the browsers your users are likely to be using.

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
