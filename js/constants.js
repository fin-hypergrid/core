'use strict';
(function() {

    var root = this;

    var constants = {
        defaultFont: '13px Tahoma, Geneva, sans-serif',
        foregroundColor: '#010126',
        backgroundColor: '#FFFFFF',
        foregroundSelColor: '#010126',
        backgroundSelColor: '#B7DBFF',
        fixedColBGColor: '#DFE3E8',
        fixedRowBGColor: '#DFE3E8',
        fixedColFGSelColor: '#010126',
        fixedRowFGSelColor: '#010126',
        fixedColBGSelColor: '#FFDC61',
        fixedRowBGSelColor: '#FFDC61',
        lineColor: '#C7C7C7',
        fixedRowAlign: 'center',
        fixedColAlign: 'center',
        cellPadding: 5,
        rowHeight: 20,
        colWidth: 100,
        topLeftHeaderBGColor: '#DFE3E8',
        repaintIntervalRate: 15
    };

    root.fin = root.fin || {};
    root.fin.wc = root.fin.wc || {};
    root.fin.wc.hypergrid = root.fin.wc.hypergrid || {};
    root.fin.wc.hypergrid.constants = constants;

}).call(this); /* jshint ignore:line */
