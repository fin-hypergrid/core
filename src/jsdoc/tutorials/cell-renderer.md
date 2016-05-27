This document describes the Cell Renderer interface. This information is useful to the application developer to better understand what cell renderers are, how to use them, and how they may be customized 

### What is a cell renderer?

A cell renderer is custom rendering logic meant to be confined to the bounding region of a cell. It should be noted that special care should be taken to ensure good performance of any custom cell renderer as it is called during any repaint where said cell is visible

Cell renderer have access to the 2D graphics context of the Hypergrid and can be used to draw anything the user can imagine (with considerations for speed)

There is also the notion of a renderCellError which has a default renderer for *any* cell considered to be in an error state. RenderCellError is further explained below

### Which cells can have a renderer?

Kind of cell       | Can use a<br>cell renderer
------------------ | :---:
Column header      | Yes
*Column filter*    | Yes
Row handle         | Yes
Tree (drill-down)  | Yes
*Data*             | Yes
Top & bottom total | Yes
 

### Default Renderers Available

The [CellProvider Singleton](http://openfin.github.io/fin-hypergrid/doc/CellProvider.html) is the default object that provides cell rendering capability.
It can be replaced by overriding [behavior](http://openfin.github.io/fin-hypergrid/doc/Behavior.html) createCellProvider
It comes with defaults
 
 #### simpleCellRenderer
    Is the normal cell renderer operation which accomodates for images/fonts/text that will be centered vertical and be placed on horizontally aligned left, right or middle

 #### emptyCellRenderer
    Paints a blank cell
    
 #### treeCellRenderer
    Paints a tree cell 
    
 #### buttonRenderer
    Paints a button dependent on mousedown state
    
 #### linkCellRenderer
    Paint text in a cell that is underline
    
 #### sparkBarRenderer
    Paints an implementation of [this](https://en.wikipedia.org/wiki/Sparkline)
    

#### Programmatic cell editor association

The Cell Provider's `getCell` method is called when the cell is selected to get rendered needs a renderer. For programmatic cell renderer association, override it:
Here is where you decide which renderer object to use for that cell.
You can set  fields on config which includes internal properties about the cell in question. This will get passed to your renderer paint function later
```javascript
yourGrid.behavior.cellProvider.getCell = function(config) {
    //A renderer should always be provided that has a paint function
    var renderer = cellProvider.cellCache.simpleCellRenderer;

    var x = config.x;
    var y = config.y;
    
    var IMG = 'Your IMAGE';
    var styleRowsFromData = true;
    
    config.halign = 'left';

    switch (y) {
        case 5:
        case 0:
        case 1:
            config.backgroundColor = '#e8ffe8';
            config.font = 'italic x-small verdana';
            config.color = '#070';
            break;

        case 2:
        case 3:
        case 4:
            config.backgroundColor = 'white';
            config.font = 'normal small garamond';
            break;
    }

    //Render conditionally based on column position of cell
    switch (x) {
        case 1:
        case 2:
        case 3:
        case 8:
            //we are a dropdown, lets provide a visual queue
            config.value = [null, config.value, upDownIMG];
    }

    switch (x) {
        case 3:
            renderer = cellProvider.cellCache.linkCellRenderer;
            break;

        case 4: 
            config.halign = 'center';
            //config.value = [null, config.value, upDownSpinIMG];
            break;

        case 5:
            config.halign = 'right';
            break;

        case 6:
            travel = 60 + Math.round(config.value * 150 / 100000);
            config.backgroundColor = '#00' + travel.toString(16) + '00';
            config.color = '#FFFFFF';
            config.halign = 'right';
            break;

        case 7:
            travel = 105 + Math.round(config.value * 150 / 1000);
            config.backgroundColor = '#' + travel.toString(16) + '0000';
            config.color = '#FFFFFF';
            config.halign = 'right';
            break;
    }

    return renderer;
```


`getCell` is called with the config object providing stateful information about the cell:

Parameter | Description
`x` | The _untranslated_ column index. The _translated" means that this does not refer to the column currently visible in the grid at this position. Columns can be hidden or re-ordered via the UI or programmatically. which is its position in `yourGrid.behavior.columns` (built from `yourGrid.behavior.dataSource.source.fields`). This means that  which means that the column coordinate 
`y` | The row index.
`value` | an untyped field that represents contextual information for the cell to present. I.e. for a text cell value you may used this represent stringified data
`halign` | whether to horizontally align 'left', 'right', or 'center'
`bounds`| The region which the renderer's paint function should confine itself to
`isCellSelected` | If the cell was selected specifically
`isCellHovered` | If the cell is hovered by mouse
`isColumnSelected` | If the column the cell is in is selected
`isColumnHovered` | If the column the cell is is in is hovered
`isRowHovered` | If the row the cell is is in is hovered
`isRowSelected` | If the row the cell is is in is selected
`isInCurrentSelectionRectangle` | If the cell is in the current selection matrix
`mouseDown` | If the mouse is down on the cell
`buttonCells` | Allowing button cells to identify themselves
`isUserDataArea` | If the cell holds actual user data
`formatValue` | Allow a localization of data
`preferredWidth` | Minimum recommended width for the cell's containing column
`Defaults` | Based on whether its a Header, Filter or tree cell. The appropriate fields will be loaded from [defaults.js](http://openfin.github.io/fin-hypergrid/doc/module-defaults.html)
__________________

 
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


