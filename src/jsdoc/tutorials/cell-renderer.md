This document describes the Cell Renderer interface. This information is useful to the application developer to better understand what cell renderers are, how to use them, and how they may be customized 

### What is a cell renderer?

A cell renderer is custom rendering logic meant to be confined to the bounding region of a cell. It should be noted that special care should be taken to ensure good performance of any custom cell renderer as it is called during any repaint where said cell is visible

Cell renderer have access to the 2D graphics context of the Hypergrid and can be used to draw anything the user can imagine (with considerations for speed)


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
     
 #### errorCellRenderer
    Renderer for *any* cell considered to be in an error state 
    
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

 
### Rendering in HyperGrid

Note that Hypergrid is lazy in regards to rendering. It relies on explicit calls to `YourGrid.repaint()` (which is sometimes called on your behalf), to redraw the canvas. Also note that multiple calls to `repaint`
get throttled to 60 FPS. Additionally, Hypergrid and canvas that powers it, does not enable partial re-rendering in the 2D context. Every re-render is a complete re-render.
Keep this under consideration when wanting to do an animation within a cell renderer as you will need to set your animation interval for calling  `repaint`


