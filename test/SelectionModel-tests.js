'use strict';

var expect = require('chai').expect;

var instance = [
    {
        name:'grid',
        type: 'object'
    },
    {
        name:'selections',
        type: 'object'
    },
    {
        name:'flattenedX',
        type: 'object'
    },
    {
        name:'flattenedY',
        type: 'object'
    },
    {
        name:'rowSelectionModel',
        type: 'object'
    },
    {
        name:'columnSelectionModel',
        type: 'object'
    },
    {
        name:'lastSelectionType',
        type: 'string'
    },
    {name:'allRowsSelected', type:'boolean'},
    {name:'areAllRowsSelected', type:'function'},
    {name:'clear', type:'function'},
    {name:'clearMostRecentColumnSelection', type:'function'},
    {name:'clearMostRecentRowSelection', type:'function'},
    {name:'clearMostRecentSelection', type:'function'},
    {name:'clearRowSelection', type:'function'},
    {name:'deselectColumn', type:'function'},
    {name:'deselectRow', type:'function'},
    {name:'getFlattenedYs', type:'function'},
    {name:'getLastSelection', type:'function'},
    {name:'getLastSelectionType', type:'function'},
    {name:'getSelectedColumns', type:'function'},
    {name:'getSelectedRows', type:'function'},
    {name:'getSelections', type:'function'},
    {name:'hasColumnSelections', type:'function'},
    {name:'hasRowSelections', type:'function'},
    {name:'hasSelections', type:'function'},
    {name:'isCellSelected', type:'function'},
    {name:'isCellSelectedInColumn', type:'function'},
    {name:'isCellSelectedInRow', type:'function'},
    {name:'isColumnOrRowSelected', type:'function'},
    {name:'isColumnSelected', type:'function'},
    {name:'isInCurrentSelectionRectangle', type:'function'},
    {name:'isRectangleSelected', type:'function'},
    {name:'isRowSelected', type:'function'},
    {name:'isSelected', type:'function'},
    {name:'rectangleContains', type:'function'},
    {name:'select', type:'function'},
    {name:'selectAllRows', type:'function'},
    {name:'selectColumn', type:'function'},
    {name:'selectColumnsFromCells', type:'function'},
    {name:'selectRow', type:'function'},
    {name:'selectRowsFromCells', type:'function'},
    {name:'setAllRowsSelected', type:'function'},
    {name:'setLastSelectionType', type:'function'},
    {name:'toggleSelect', type:'function'}
];

//TODO: sinon mock object perhaps...
function mockGrid(){
    return {
        properties: {}
    };
}

describe('SelectionModel', function(){

    describe('Module expected shape', function(){
        it('Should have the instance shape', function(){
            var SelectionModel = require('../src/lib/SelectionModel');
            var myMockGrid = mockGrid();
            var selectionModel = new SelectionModel(myMockGrid);

            instance.forEach(function(key){
                expect(typeof(selectionModel[key.name])).to.equal(key.type);
            });
        });
    });

});
