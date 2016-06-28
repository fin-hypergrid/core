## Your First HyperGrid
 Awesome! So your ready to make your first Hypergrid.

## Simplest possible example
 The following examples demonstrate setting up a Hypergrid that you can embed. Keep in mind that you can have
 multiple grids on a page.
 
### Initialize the Grid and Binding data
 Initializing the grid is as simple as providing the CSS selector for HTML element to contain the grid.
 Binding data is as simple as providing a congruent array of objects
 The full list of options that can be passed to the constructor can be found [here](http://openfin.github.io/fin-hypergrid/doc/Hypergrid.html)
 In addition, while not necessary, we have introduced our first api call addProperties (a member of [the Hypergrid singleton](http://openfin.github.io/fin-hypergrid/doc/Hypergrid.html)),
 which directly affect the grid [properties](http://openfin.github.io/fin-hypergrid/doc/module-defaults.html), the majority of which are related to its rendering.
 
```html
 <!doctype html>
 <html>
 <head>
     <meta http-equiv="Content-Type" content="text/html;charset=utf-8" >
 </head>
 <body>
     <div id="fin-grid"></div>
 
     <script src="https://openfin.github.io/fin-hypergrid/build/fin-hypergrid.js"></script>
     <script>
         var grid = new fin.Hypergrid('#fin-grid', {
             data: [
                 { 'symbol':'APPL', 'name':'Apple Inc.', 'prevclose':'93.13' },
                 { 'symbol':'MSFT', 'name':'Microsoft Corporation', 'prevclose':'51.91' },
                 { 'symbol':'TSLA', 'name':'Tesla Motors Inc.', 'prevclose':'196.40' },
                 { 'symbol':'IBM', 'name':'International Business Machines Corp', 'prevclose':'155.35' }
             ]
         });
         
        grid.addProperties({
             noDataMessage: "", // Message to show if the grid is bound to an empty list 
             columnAutosizing: false, //Whether to resize the columns automatically
             showRowNumbers:false, //Show the row numbers
             showFilterRow:false, // Display of row dedicated to filtering by text input
             cellSelection:false, // Ability to select and copy cells
             rowSelection: false, // Ability to select and copy rows
             columnSelection:false // Ability to select and copy rows
         });
     </script>
 </body>
 </html>
```
Click [here](http://openfin.github.io/fin-hypergrid/demo/minimal.html) to see the live demo.
and That's it!

## Updating Data and rebinding
 Once you are able to bind static data. The next point of interest would be the ability to update the data.
 Here you see the use of an ajax call to fetch some `data` which is then bounded with `setData`
```html
<!DOCTYPE html>

<html>
<head>
    <title>simple hypergrid demo</title>
    <script src="build/fin-hypergrid.js"></script>
    <script>
        window.onload = function() {
            fin.Hypergrid.JSON.get('data/basic.json', function(data) {
                var div = document.querySelector('div#json-example'),
                    grid = new fin.Hypergrid(div, { data: data });

                grid.addProperties({
                    noDataMessage: "", // Message to show if the grid is bound to an empty list 
                    columnAutosizing: false, //Whether to resize the columns automatically
                    showRowNumbers:false, //Show the row numbers
                    showFilterRow:false, // Display of row dedicated to filtering by text input
                    cellSelection:false, // Ability to select and copy cells
                    rowSelection: false, // Ability to select and copy rows
                    columnSelection:false // Ability to select and copy rows
                });

                grid.behavior.setData(data);
            });
        };
    </script>
</head>
<body>
<p> JSON example using AJAX.<br/>
        Put your JSON in:<b><code> ./data/simple.json</code></b>
    </p>
    <div id="json-example" style="position:relative; width:600px; height:100px"></div>
    <p><small><em>Note: AJAX does not work with the <b><code>file://</code></b> protocol. To serve locally, try <a href="https://www.npmjs.com/package/http-server">http-server</a>.</em></samll></p>
</body>
</html>
```
Click [here](http://openfin.github.io/fin-hypergrid/demo/basic-AJAX.html) to see the live demo
