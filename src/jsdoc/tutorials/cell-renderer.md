This document describes the Cell Renderer interface. This information is useful to the application developer to better understand what cell renderers are, how to use them, and how they may be customized 

### What is a cell renderer?

A cell renderer is custom rendering logic meant to be confined to the bounding region of a cell. It should be noted that special care should be taken to ensure good performance of any custom cell renderer as it is called during any repaint where said cell is visible.

Cell renderers have access to the 2D graphics context of the Hypergrid and can be used to draw anything the user can imagine (with considerations for speed).


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
It can be replaced by overriding [behavior](http://openfin.github.io/fin-hypergrid/doc/Behavior.html) `createCellProvider`.
It comes with the following defaults that you can use declaratively.
 
 #### simpleCellRenderer
    Is the normal cell renderer operation which accomodates for images/fonts/text.
    They will be centered vertical and be placed on horizontally aligned left, right or middle

 #### emptyCellRenderer
    Paints a blank cell
    
 #### treeCellRenderer
    Paints a tree cell that accomodates nested data
     
 #### errorCellRenderer
    Renderer for *any* cell considered to be in an error state 
    
 #### buttonRenderer
    Paints a button dependent on mousedown state
    
 #### linkCellRenderer
    Paint text in a cell that is underline
    
 #### sparkBarRenderer
    Paints an implementation of https://en.wikipedia.org/wiki/Sparkline
    

#### Programmatic cell editor association

The Cell Provider's `getCell` method is called when HyperGrid will check which renderer to provide the selected *data* cell. 
The process is the same for `getColumnHeaderCell` for the fixed columns and `getRowHeaderCell` for the fixed rows
For programmatic cell renderer association, you can override it:
`getCell` needs to return an object with a `paint` method that expects a `2D graphics context` and a config object (described below).

You can optionally set additional fields on config which includes internal properties about the cell in question. This will get passed to your renderer paint function later

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


Parameter                       | Description
------------------------------  | :---:
`x`                             | The _untranslated_ column index. The _translated" means that this does not refer to the column currently visible in the grid at this position. Columns can be hidden or re-ordered via the UI or programmatically. which is its position in `yourGrid.behavior.columns` (built from `yourGrid.behavior.dataSource.source.fields`). This means that  which means that the column coordinate 
`y`                             | The row index.
`value`                         | an untyped field that represents contextual information for the cell to present. I.e. for a text cell value you may used this represent stringified data
`halign`                        | whether to horizontally align 'left', 'right', or 'center'
`bounds`                        | The region which the renderer's paint function should confine itself to
`isCellSelected`                | If the cell was selected specifically
`isCellHovered`                 |  If the cell is hovered by mouse
`isColumnSelected`              | If the column the cell is in is selected
`isColumnHovered`               | If the column the cell is is in is hovered
`isRowHovered`                  | If the row the cell is is in is hovered
`isRowSelected`                 | If the row the cell is is in is selected
`isInCurrentSelectionRectangle` | If the cell is in the current selection matrix
`mouseDown`                     | If the mouse is down on the cell
`buttonCells`                   | Allowing button cells to identify themselves
`isUserDataArea`                | If the cell holds actual user data
`formatValue`                   | Allow a localization of data
`preferredWidth`                | Minimum recommended width for the cell's containing column
`Defaults`                      | Based on whether its a Header, Filter or tree cell. The appropriate fields will be loaded from [defaults.js](http://openfin.github.io/fin-hypergrid/doc/module-defaults.html)

__________________

 
### Rendering in HyperGrid

Note that HyperGrid...
 - is lazy in regards to rendering. It relies on explicit calls to `YourGrid.repaint()` (which is sometimes called on your behalf), to redraw the canvas. 
 - that multiple calls to `repaint`get throttled to 60 FPS.
 - HyperGrid and canvas does not enable partial re-rendering in the 2D context. Every re-render is a complete re-render.
 - The Gridlines that divide cells and establish their boundaries and painted separately and not apart of an individual cell render.


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
cellProvider.getCell = function(config) {
    config.link = true;
    var renderer = cellProvider.cellCache.simpleCellRenderer;
    config.halign = 'left';
    var x = config.x;
    if (x === 0) {
        renderer = cellProvider.cellCache.linkCellRenderer;
    } else if (x === 2) {
    ...
    ...
    ...
}
```




### Further Examples
The following examples are not apart of the HyperGrid defaults but as exploratory pieces. Note the main emphasis is that the renderers would be used by the Cell Provider's `getCell`. Reminder that all renderers
are expected to have a `paint`

#### Star Rating Renderer Sample Implementation
[Reference](https://openclipart.org/image/2400px/svg_to_png/117079/5-Star-Rating-System-20110205103828.png)

```javascript
var REGEXP_CSS_HEX6 = /^#(..)(..)(..)$/,
  REGEXP_CSS_RGB = /^rgba\((\d+),(\d+),(\d+),\d+\)$/;


var config = {
  // these are the important star rating parameters:
  domain: 100, // default is 100
  sizeFactor: 0.65, // default is 0.65; size of stars as fraction of height of cell
  darkenFactor: 0.75, // default is 0.75; star stroke color as fraction of star fill color
  color: 'gold', // default is 'gold'; star fill color
  bounds: {
    x: 50,
    y: 50,
    width: 100,
    height: 24
  },
  // these are generally inherited:
  fgColor: 'grey', // default is 'transparent' (not rendered); text color
  fgSelColor: 'yellow', // default is 'transparent' (not rendered); text selection color
  bgColor: '#404040', // default is 'transparent' (not rendered); background color
  bgSelColor: 'grey', // default is 'transparent' (not rendered); background selection color
  shadowColor: 'transparent' // default is 'transparent'
}

var sparkStarRatingRenderer = {
  paint: paintSparkRating,
};


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



for (var index = 0; index < 10; ++index) {
  config.value = {
    val: Math.floor(Math.random() * 100 + 0.5)
  };
  config.bounds.y = config.bounds.y + index * 25;
  sparkStarRatingRenderer.paint(gc, config);
}


```

