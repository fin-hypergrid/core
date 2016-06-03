This document describes the Cell Renderer interface. This information is useful to the application developer to better understand what cell renderers are, how to use them, and how they may be customized 

### What is a cell renderer?

A cell renderer is custom rendering logic meant to be confined to the bounding region of a cell. Special care should be taken when creating a custom cell renderer to ensure good performance. On every grid repaint, this code will be called repeatedly for all cells that reference it.

Cell renderers have access to the 2D graphics context of the Hypergrid canvas element and can be used to draw anything the user can imagine (again, with considerations for speed).


### Which cells can have a renderer?

All cells in the grid from headers to data, etc., require cell renderers.

### Default Renderers Available

The [CellRenderer Base Class](http://openfin.github.io/fin-hypergrid/doc/CellRenderer.html) is the object that provides a empty cell.
The following cell renderers are available for you to use declaratively. They have been extended from the CellRenderer base.
 
Cell Renderer | Description
------------- | -----------
`simpleCell` | Is the normal cell renderer operation which accommodates for images/fonts/text.They will be centered vertical and be placed on horizontally aligned left, right or middle
`emptyCell` | Paints a blank cell. Provided with the base CellRenderer class
`treeCell` | Paints a tree cell that accommodates nested data
`errorCell` | Renderer for *any* cell considered to be in an error state 
`button` | Paints a button dependent on mousedown state
`lastSeletion` | Renderer for painting a selection rectangle on top of cells 
`linkCellRenderer` | Simple Cell with the link option set. Paint text in a cell that is underline
`sparklineCell` | Paints an implementation of https://en.wikipedia.org/wiki/Sparkline. Requires a list of values to be useful.
`sparkbarCell` | A tiny bar chart. Requires a list of values to be useful.
     

#### Programmatic cell editor association

`behavior.cellRenderers` (the collection of cell renderers) `getCell` method is called when HyperGrid will check which renderer to provide the selected *data* cell. 
For programmatic cell renderer association, you can override it, keep in mind that `getCell` needs to always return a CellRenderer.

It is recommended to first set a default, such as `simpleCell`, to be returned if not otherwise overridden by your custom logic.

You can optionally set additional properties on config which includes internal properties about the cell in question. This will get passed to your renderer paint function later.

```javascript
yourGrid.behavior.cellRenderers.getCell = function(config) {
    //A renderer should always be provided that has a paint function
    var renderer = behavior.cellRenderers.get('SimpleCell');

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
            //Turn Simple Cell into a link
            config.link = true;
            break;

        case 4: 
            config.halign = 'center';
            renderer = behavior.cellRenderers.get('TreeCell')
            break;
            

        case 5:
            config.halign = 'right';
            break;

        case 6:
            travel = 60 + Math.round(config.value * 150 / 100000);
            config.backgroundColor = '#00' + travel.toString(16) + '00';
            config.color = '#FFFFFF';
            config.halign = 'right';
            renderer = behavior.cellRenderers.get('SparkBar')
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


Parameter                       | Description
------------------------------  | :---:
`backgroundColor`               | Color of the background
`backgroundSelectionColor`      | Color of the background when its selected
`bounds`                        | The region which the renderer's paint function should confine itself to
`buttonCells`                   | Allowing button cells to identify themselves
`color`                         | 
`Defaults`                      | Based on whether its a Header, Filter or tree cell. The appropriate fields will be loaded from [defaults.js](http://openfin.github.io/fin-hypergrid/doc/module-defaults.html)
`font`                          | Font
`foregroundSelectionColor`      | Color of foreground when its selected
`foregroundSelectionFont`       | Color of the font when selected
`formatValue`                   | Allow a localization of data
`halign`                        | Whether to horizontally align 'left', 'right', or 'center'
`isCellHovered`                 | If the cell is hovered by mouse
`isCellSelected`                | If the cell was selected specifically
`isColumnHovered`               | If the column the cell is is in is hovered
`isColumnSelected`              | If the column the cell is in is selected
`isGridColumn`                  | If its a header Column
`isGridRow`                     | If its a header row
`isInCurrentSelectionRectangle` | If the cell is in the current selection matrix
`isRowHovered`                  | If the row the cell is is in is hovered
`isRowSelected`                 | If the row the cell is is in is selected
`isUserDataArea`                | If the cell holds actual user data
`mouseDown`                     | If the mouse is down on the cell
`preferredWidth`                | Minimum recommended width for the cell's containing column
`untranslatedX`                 | 
`untranslatedY`                 |
`value`                         | an untyped field that represents contextual information for the cell to present. I.e. for a text cell value you may used this represent stringified data
`x`                             | The _absolute_ column index. 
`y`                             | The row index.

__________________
+This _absolute_ column index is the column's index into the full column list (both `grid.behavior.allColumns[]` and the data source's `fields[]` array upon which it is based). By comparison, the _active_ column index refers to the list of columns current active in the grid (`grid.behavior.columns[]`), representing the position of the column in the grid. This list is a subset of of the full list because "hidden" columns are excluded and the remaining columns can be re-ordered at any time via the UI or programmatically.
 
All renderers will have access to the context of your [HyperGrid](http://openfin.github.io/fin-hypergrid/doc/Hypergrid.html) object as `this.grid`and hence can make use of function calls like `YourGrid.resolveProperty` to read your defaults.



### Creating your own renderer
You can create your own renderer by extending [CellRenderer Base Class](http://openfin.github.io/fin-hypergrid/doc/CellRenderer.html)  
and overriding the `paint` method that expects a `2D graphics context` and a config object (described above).

You would then need to register your new cell renderer on the grid with `YourGrid.registerCellRenderer`

#### Here's an example use the Star Rating as the inspiration 
[Reference](https://openclipart.org/image/2400px/svg_to_png/117079/5-Star-Rating-System-20110205103828.png)


```javascript


/*
   Define your rendering logic
*/

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
    stroke = this.stroke = color === this.color ? this.stroke : getDarkenedColor(this.color = color, darkenFactor),
    bgColor = config.isSelected ? (options.bgSelColor || config.bgSelColor) : (options.bgColor || config.bgColor),
    fgColor = config.isSelected ? (options.fgSelColor || config.fgSelColor) : (options.fgColor || config.fgColor),
    shadowColor = options.shadowColor || config.shadowColor || 'transparent',
    font = options.font || config.font || '11px verdana',
    middle = height / 2,
    diameter = sizeFactor * height,
    outerRadius = sizeFactor * middle,
    val = Number(options.val),
    points = this.points;

  if (!points) {
    var innerRadius = 3 / 7 * outerRadius;
    points = this.points = [];
    for (var i = 5, θ = Math.PI / 2, incr = Math.PI / 5; i; --i, θ += incr) {
      points.push({
        x: outerRadius * Math.cos(θ),
        y: middle - outerRadius * Math.sin(θ)
      });
      θ += incr;
      points.push({
        x: innerRadius * Math.cos(θ),
        y: middle - innerRadius * Math.sin(θ)
      });
    }
    points.push(points[0]); // close the path
  }

  gc.shadowColor = 'transparent';

  gc.lineJoin = 'round';
  gc.beginPath();
  for (var i = 5, sx = x + 5 + outerRadius; i; --i, sx += diameter) {
    points.forEach(function(point, index) {
      gc[index ? 'lineTo' : 'moveTo'](sx + point.x, y + point.y);
    });
  }
  gc.closePath();

  val = val / domain * 5;

  gc.fillStyle = color;
  gc.save();
  gc.clip();
  gc.fillRect(x + 5, y,
    (Math.floor(val) + 0.25 + val % 1 * 0.5) * diameter, // adjust width to skip over star outlines and just meter their interiors
    height);
  gc.restore(); // remove clipping region

  gc.strokeStyle = stroke;
  gc.lineWidth = 1;
  gc.stroke();

  if (fgColor && fgColor !== 'transparent') {
    gc.fillStyle = fgColor;
    gc.font = '11px verdana';
    gc.textAlign = 'right';
    gc.textBaseline = 'middle';
    gc.shadowColor = shadowColor;
    gc.shadowOffsetX = gc.shadowOffsetY = 1;
    gc.fillText(val.toFixed(1), x + width + 10, y + height / 2);
  }
}

function getDarkenedColor(color, factor) {
  var rgba = getRGBA(color);
  return 'rgba(' + Math.round(factor * rgba[0]) + ',' + Math.round(factor * rgba[1]) + ',' + Math.round(factor * rgba[2]) + ',' + (rgba[3] || 1) + ')';
}

function getRGBA(colorSpec) {
  // Normalize variety of CSS color spec syntaxes to one of two
  gc.fillStyle = colorSpec, colorSpec = gc.fillStyle;

  var rgba = colorSpec.match(REGEXP_CSS_HEX6);
  if (rgba) {
    rgba.shift(); // remove whole match
    rgba.forEach(function(val, idx) {
      rgba[idx] = parseInt(val, 16);
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
var sparkStarRatingRenderer = YourGrid.cellRendererBase.extend({
    paint: paintSparkRating
});

//Register your renderer
YourGrid.registerCellRenderer(sparkStarRatingRenderer, "Starry");

//Retrieve the Singleton
var starry = behavior.cellRenderers.get('Starry');


// Using your new render
yourGrid.behavior.cellRenderers.getCell = function(config) {
  var defaultRenderer = behavior.cellRenderers.get('SimpleCell'),
    idxOfStarColumn = 5;

  if (config.x === idxOfStarColumn){
    config.domain= 100; // default is 100
    config.sizeFactor =  0.65; // default is 0.65; size of stars as fraction of height of cell
    config.darkenFactor = 0.75; // default is 0.75; star stroke color as fraction of star fill color
    config.color = 'gold'; // default is 'gold'; star fill color
    return starry;
  } 
  
  return defaultRenderer;
};
```


### Rendering in HyperGrid

Note that HyperGrid...
- is lazy in regards to rendering. It relies on explicit calls to `YourGrid.repaint()` (sometimes made on your behalf), to request a redraw of the canvas. 
- throttles multiple calls to `repaint` to 60 FPS.
- every re-render is a complete re-render; there is no partial re-rendering.
- for efficiency reasons, the grid lines that divide cells and establish their boundaries and painted separately and not part of the individual cell renders.


### Animating Renderers
When wanting to do an animation within a cell renderer, you will need to set your own animation interval for calling  `repaint`
You can additionally check for grid repaint events by listening on the `fin-grid-rendered` event like so 

```javascript
    YourGrid.addEventListener('fin-grid-rendered', function(e) {
       //Do something 
    });
```


### Cells as Links
Hypergrid supports clickable link cells, to achieve this you need to...

* register a listener to the table for 'fin-cell-click'
```javascript
jsonGrid.addFinEventListener('fin-cell-click', function(e){
    var cell = e.detail.cell;
    if (cell.x !== 0) {
        return;
    }
    alert('fin-cell-click at (' + cell.x + ', ' + cell.y + ')');
});
```
* override the getCursorAt method on behavior to be a function that returns the string of the name of the cursor for the column with the links
```javascript
behavior.getCursorAt = function(x,y) {
    if (x === 0) {
        return 'pointer'
    } else {
        return null;
    }
};
```
* override the cell-provider to return the linkRenderer for the desired link columns and set `config.link = true`
```javascript
behavior.cellRenderers.getCell = function(config) {
    config.link = true;
    var renderer = behavior.cellRenderers.get('SimpleCell');
    config.halign = 'left';
    var x = config.x;
    if (x === 0) {
        config.link = true;
    } else if (x === 2) {
    ...
    ...
    ...
}
```



