A cell editor is an input control superimposed on the grid.

### Usage

The following examples require a grid object:

```javascript
var grid = new Hypergrid(...);
var behavior = grid.behavior;
var dataModel = behavior.dataModel;
```

#### Assignment

Cells are only editable when assigned a cell editor.

Declaratively, by defining the `editor` render property at setup time:
  
```javascript
behavior.setColumnProperties(columnIndex, {
    editor: 'textfield' // case-insensitive
});
```

**NOTE:** There is no preset grid default for `editor`.

Programmatically, by overriding the declared assignment at render time:

```javascript
dataModel.getCellEditorAt = function(columnIndex, rowIndex, declaredEditorName, options) {
    var editorName = declaredEditorName;
    if (...) {
        editorName = 'textfield';
    }
    return grid.createCellEditor(editorName, options);
}
```

See the full {@link DataModel#getCellEditorAt|getCellEditorAt} API.

#### Text Format

Cell editors that present data in text form will respect the cell's `format` render property:
  
```javascript
behavior.setColumnProperties(columnIndex, {
    editor: 'textfield',
    format: 'number' // case-insensitive; primarily used by cell renderer
});
```

To override or ignore the declared format (`options.format`) at render time:

```javascript
dataModel.getCellEditorAt = function(columnIndex, rowIndex, declaredEditorName, options) {
    if (...) {
        options.format = 'number';  // override
        options.format = undefined; // ignore
    }
    return grid.createCellEditor(declaredEditorName, options);
}
```

#### Templates

Cell editors create their DOM node from a template which uses {@link https://mustache.github.io|mustache} to merge in variables defined at render time:

```javascript
dataModel.getCellEditorAt = function(columnIndex, rowIndex, declaredEditorName, options) {
    if (...) {
        options.variable1 = 'yada';
        options.vairable2 = 'blah';
    }
    return grid.createCellEditor(declaredEditorName, options);
}
```

#### Object access

After instantiation, object and its generated DOM elements are accessible as shown below. Useful if template doesn't provide enough flexibility through variable merge.

```javascript
dataModel.getCellEditorAt = function(columnIndex, rowIndex, declaredEditorName, options) {
    var cellEditor = grid.createCellEditor(declaredEditorName, options);
    if (cellEditor && columnIndex === behavior.columnEnum.BIRTH_DATE) { // defined cell editors only!
        cellEditor.input.setAttribute('style', '...'); // actual input control
        cellEditor.el.setAttribute('title', '...'); // container (input control if no container)
    }
    return cellEditor;
}
```

**NOTE:** Always check the return value from `createCellEditor` in case the editor name was unregistered.

#### Data coordinates in `getCellEditorAt`

`columnIndex` is the position of the column in the `fields` array, which is derived from the data source. As such its order is undefined. Compare against members of the `behavior.columnEnum` map as illustrated above. Keys in this enum are all upper case with underscores inserted between camelCase words ("CAMEL_CASE"). (Although syntactically convenient and efficient, be aware that `columnEnum` is recreated on every call to `behavior.createColumns()` which is called by `behavior.setData()`. Local references will need to be updated at that time.)

`options.column.name` contains the actual (case-sensitive) column name and is a convenient (though less efficient) alternative to dealing with `columnIndex` at all.
 
`rowIndex` is the position of data row, offset by the number of header rows (which includes the filter row).

### Predefined Cell Editors

See each for its template and notes on browser limitations.

{@link http://openfin.github.io/fin-hypergrid/doc/Color.html|Color},    
{@link http://openfin.github.io/fin-hypergrid/doc/ComboBox.html|ComboBox}, 
{@link http://openfin.github.io/fin-hypergrid/doc/Date.html|Date},  
{@link http://openfin.github.io/fin-hypergrid/doc/Number.html|Number},
{@link http://openfin.github.io/fin-hypergrid/doc/Slider.html|Slider},
{@link http://openfin.github.io/fin-hypergrid/doc/Spinner.html|Spinner},  
{@link http://openfin.github.io/fin-hypergrid/doc/Textfield.html|Textfield}.

### Custom Cell Editors

All cell editors extend `CellEditor`.

_-- to be continued --_
