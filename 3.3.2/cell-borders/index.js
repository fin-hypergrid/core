window.addEventListener('load', function() {

    document.querySelector('body > div:first-child > span').textContent = fin.Hypergrid.prototype.version;

    var data = [
        { symbol: 'APPL', prevclose: 93.13, name: 'Apple Inc.' },
        { symbol: 'MSFT', prevclose: 51.91, name: 'Microsoft Corporation' },
        { symbol: 'TSLA', prevclose: 196.40, name: 'Tesla Motors Inc.' },
        { symbol: 'IBM', prevclose: 155.35, name: 'International Business Machines Corp' }
    ];

    function cloneData(data) { return data.map(function(row) { return Object.assign({}, row); }); }

    var containers = document.getElementsByClassName('hypergrid-container');

    var RED = 'red', GREY = '#bbb';
    var renderer = ['SimpleCell', 'Borders'];
    var rect = { // cell properties for use with Borders cell renderer
        data: { // subgrid key
            1: { // row index
                prevclose: { borderLeft: RED, borderTop: RED },
                name: { borderTop: RED, borderRight: RED }
            },
            2: { // row index
                prevclose: { borderLeft: RED, borderBottom: RED },
                name: { borderBottom: RED, borderRight: RED }
            }
        }
    };
    var opaqueRect = { // cell properties for use with OpaqueBorders cell renderer
        data: { // subgrid key
            1: { // row index
                prevclose: { border: { left: RED, top: RED } },
                name: { border: { top: RED, right: RED } }
            },
            2: { // row index
                prevclose: { border: { left: RED, bottom: RED } },
                name: { border: { bottom: RED, right: RED } }
            }
        }
    };

    var grid = new fin.Hypergrid(containers[0]);
    grid.setData(data);
    grid.addProperties({
        showRowNumbers: false
    });

    var grid1 = new fin.Hypergrid(containers[1]);
    grid1.setData(cloneData(data));
    grid1.addProperties({
        showRowNumbers: false,
        gridLinesH: false,
        gridLinesV: false,
        renderer: renderer,
        columnHeaderRenderer: renderer,
        borderBottom: GREY, borderRight: GREY
    });

    var grid2 = new fin.Hypergrid(containers[2]);
    grid2.setData(cloneData(data));
    grid2.addProperties({
        showRowNumbers: false,
        gridLinesH: false,
        gridLinesV: false,
        renderer: renderer,
        cells: rect
    });

    var grid3 = new fin.Hypergrid(containers[3]);
    grid3.setData(cloneData(data));
    grid3.addProperties({
        showRowNumbers: false,
        gridLinesH: false,
        gridLinesV: false,
        renderer: renderer,
        columnHeaderRenderer: renderer,
        borderBottom: GREY, borderRight: GREY,
        cells: rect
    });

    var grid4 = new fin.Hypergrid(containers[4]);
    grid4.setData(cloneData(data));
    renderer = ['SimpleCell', 'OpaqueBorders'];
    grid4.addProperties({
        showRowNumbers: false,
        gridLinesH: false,
        gridLinesV: false,
        renderer: renderer,
        columnHeaderRenderer: renderer,
        border: { bottom: GREY, right: GREY },
        cells: opaqueRect
    });

});
