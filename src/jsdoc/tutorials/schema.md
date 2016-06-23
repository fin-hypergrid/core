Filter-tree does require a schema to function. There are several options for this I will discuss below.

In keeping with our new Hypergrid architecture goals, we plan very soon to "deconstruct" the Hypergrid instantiation. The "options" approach was intended to simplify instantiation to get up and running quickly but seems instead to have confused people by hiding the mechanics (so they don't really understand what's going on) and forcing them to do things in a certain (limited) way. (It was also a work-around for the chicken-or-egg problem of referencing the data source's fields array which doesn't exist yet, because the behavior doesn't exist yet, because the grid doesn't exist yet...)

So in the future, if you want filtering, you will instantiate your filter separately and point the grid at it. (Could be filter-tree or some other filter API.) If you don't there will simply be no filter row.

But for now, as you must supply a schema, but it's pretty easy. Let's consider the available solutions:

#### Simple solution

The schema can be as simple as a list of fields:

```javascript
var schema = [ 'item', 'price', ... ];
```

List all the columns you want the filter to be aware of. The order of this list can be arbitrary. (Unlike the behavior.columns array, the filter's column schema's order does not need to match the data source's fields array. This is because the filter accesses columns only by name, not index.)

Even simpler solution. If you don't have a schema prepared, even simpler might be to just use the data source's fields array. This is a bit of a chicken-or-egg problem because the data source doesn't exist yet (because the behavior doesn't exist yet (because the grid doesn't exist yet...)). An easy way to work around this is to set the schema to a callback function (called with behavior as "this" context):

```javascript
var schema = function() {
    return this.dataModel.getFields();
}
```

#### Columns array

Or you could derive the schema from the behavior.columns array which has (inferred) type information. For convenience the callback is called with the array as its first parameter (even though it is readily available as this.columns):

```javascript
var schema = function(columns) {
    return columns.map(function(column) {
    return {
        name: column.name,
        alias: column.header,
        type: column.getType()
    };

};}
```

#### ColumnSchemaFactory

Deriving the schema from the behavior.columns array is precisely the idea behind the ColumnSchemaFactory! Despite it's fancy name, if you look in ColumnSchemaFactory.js, all it is doing is looping through behavior.columns as shown above! (It also offers some methods for organizing the schema into a hierarchy, sorting it, etc., but those are just extras and you don't have to use these methods.) So the above becomes even easier:

```javascript
var schema = function(columns) {
    return new fin.Hypergrid.ColumnSchemaFactory(columns).schema;
}
```

#### Persisted schema

Probably the best approach is a robust custom schema which you can persist on your data store, including headers and types when you know them:

```javascript
var schema = [
    { name: 'item', header: 'Description' },
    { name: 'price', header: 'Unit Cost', type: 'number' }
];
```

You can also supply some filter options such as a default operator or an operator list:

```javascript
var schema = [
    { name: 'item', header: 'Description', defaultOp: 'contains' },
    { name: 'price', header: 'Unit Cost', type: 'number', opMenu = ['>', '<'] }
];
```

Nested schema. The list can include a hierarchy which the filter can use to show the columns organized into folders, such as the way filter-tree renders its Qurery Builder drop-downs:

```javascript
var schema = ['item', [ 'wholesale', 'MSRP' ] ];
```

To give the nested group a name:

```javascript
var pricing = [ 'wholesale', 'MSRP' ];
pricing.label = 'Pricing';
var schema = ['item', pricing ];
```

Or:

```javascript
var schema = [
    'item',
    {
        label: 'Pricing',
        submenu: [ 'wholesale', 'MSRP' ]
    }
];
```

Caveat: Be aware that most browsers only render one level of nesting in drop-downs.
