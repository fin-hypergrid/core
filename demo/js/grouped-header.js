/* eslint-env browser */

var grid;

window.onload = function() {

    // Create the grid and insert into the DOM
    grid = new fin.Hypergrid('div#example', { data: window.unitedStates });

    // Adds GroupedHeader cell renderer
    fin.Hypergrid.groupedHeader.mixInTo(grid);

    // New header definitions. This example has three levels of headers.
    // The idea here is that group headers are repeated for each column participating in the group.
    grid.behavior.setHeaders({
        areaTotalMi: 'Area|Total|miles', // The highest order group header is 'Area'
        areaTotalKm: 'Area|Total|km', // The nested group header is 'Total'

        areaLandMi: 'Area|Land|miles',
        areaLandKm: 'Area|Land|km',

        areaWaterMi: 'Area|Water|miles',
        areaWaterKm: 'Area|Water|km',

        // The rest are not necessary; we only need the grouped ones.
        name: 'State',
        code: 'Postal Code',
        capital: 'Capital',
        city: 'Largest City',
        founded: 'Statehood',
        population: 'Population',
        reps: 'House Seats'
    });

    // Must use the GroupedHeader cell renderer for the header cells with groups. For this example we're using it for all cells. This works because it only applies grouping logic to header cells, otherwise behaving like SimpleCell for non-header cells.
    grid.behavior.getPrivateState().renderer = 'GroupedHeader';

    // Format the numbers with thousands separated with commas.
    for (var i = grid.behavior.getActiveColumnCount() - 1; i >= 5; --i) {
        grid.behavior.setColumnProperties(i, { format: 'number' });
    }

};
