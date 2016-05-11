This document describes the Cell Editor interface. This information allows the application developer to create custom cell editors.

### What is a cell editor?

Certain cells in the grid can be edited while others cannot. Specifically, filter cells (the cells below the column headers) and data cells are editable; column and row headers, drill-downs, and top and bottom column total cellss cannot.
 
#### Starting editing

The user initiates cell editing on a filter cell with a single (or double) mouse click; or on a data cell with a double mouse click. An input control appears positioned precisely over the cell. The user interacts with the control to change the data in the cell.

#### Ending editing

The new value is accepted by pressing the Enter (aka Return) key, the Tab key, or any of the four arrow keys on the keyboard; or by "clicking away" (clicking outside of) the control (including initiating editing on another cell).

#### Aborting editing

The edit can be aborted by pressing the ESC (aka "escape") key on the keyboard; or by scrolling the grid via the mouse-wheel (or equivalent trackpad gesture).

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

File | Object | Description
---- | ------ | -----------
ComboBox.js | ComboBox | Combines a text box (`<input type="text">` UI control) with a drop-down (`<select>...</select>` UI control) which appears when the user clicks an arrow icon (`▾`). The user may type into the text box and/or select an item from the drop-down.

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
