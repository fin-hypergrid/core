'use strict';

var expect = require('chai').expect;

var instance = [
    {
        name:'grid',
        type: 'object'
    },
    {
        name:'topTotals',
        type: 'object'
    },
    {
        name:'bottomTotals',
        type: 'object'
    },
    {
        name:'selectedData',
        type: 'object'
    },
    {
        name:'sources',
        type: 'object'
    },
    {
        name:'source',
        type: 'object'
    },
    {
        name:'dataSource',
        type: 'object'
    },
    {
        name:'pipelineSchemaStash',
        type: 'object'
    },
    {
        name:'defaultPipelineSchema',
        type: 'object'
    },
    {
        name:'initialize',
        type: 'function'
    },
    {
        name:'reset',
        type: 'function'
    },
    {
        name:'resetSources',
        type: 'function'
    },
    {
        name:'clearSelectedData',
        type: 'function'
    },
    {
        name:'getData',
        type: 'function'
    },
    {
        name:'getFilteredData',
        type: 'function'
    },
    {
        name:'getValue',
        type: 'function'
    },
    {
        name:'getDataIndex',
        type: 'function'
    },
    {
        name:'getHeaderRowValue',
        type: 'function'
    },
    {
        name:'setValue',
        type: 'function'
    },
    {
        name:'setHeaderRowValue',
        type: 'function'
    },

    {
        name:'getColumnProperties',
        type: 'function'
    },

    {
        name:'getColumnCount',
        type: 'function'
    },

    {
        name:'getRowCount',
        type: 'function'
    },
    {
        name:'getHeaders',
        type: 'function'
    },

    {
        name:'setHeaders',
        type: 'function'
    },
    {
        name:'setFields',
        type: 'function'
    },
    {
        name:'getFields',
        type: 'function'
    },
    {
        name:'getCalculators',
        type: 'function'
    },
    {
        name:'applyAnalytics',
        type: 'function'
    },
    {
        name:'setPipeline',
        type: 'function'
    },
    {
        name:'setData',
        type: 'function'
    },
    {
        name:'getPipelineSchemaStash',
        type: 'function'
    },
    {
        name:'unstashPipeline',
        type: 'function'
    },
    {
        name:'truncatePipeline',
        type: 'function'
    },
    {
        name:'isDrillDown',
        type: 'function'
    },
    {
        name:'setTopTotals',
        type: 'function'
    },
    {
        name:'getTopTotals',
        type: 'function'
    },
    {
        name:'setBottomTotals',
        type: 'function'
    },
    {
        name:'getBottomTotals',
        type: 'function'
    },
    {
        name:'getActiveColumns',
        type: 'function'
    },
    {
        name:'getVisibleColumns',
        type: 'function'
    },
    {
        name:'hasHierarchyColumn',
        type: 'function'
    },
    {
        name:'getSortedColumnIndexes',
        type: 'function'
    },
    {
        name:'getSortImageForColumn',
        type: 'function'
    },
    {
        name:'cellClicked',
        type: 'function'
    },
    {
        name:'toggleRow',
        type: 'function'
    },
    {
        name:'getRow',
        type: 'function'
    },
    {
        name:'getUnfilteredValue',
        type: 'function'
    },
    {
        name:'getUnfilteredRowCount',
        type: 'function'
    },
    {
        name:'addRow',
        type: 'function'
    }
];

var mockData = [
    {first: 'Bobby', last: 'Sinclair'},
    {first: 'George', last: 'Michaels'},
    {first: 'Eric', last: 'Clapton'}
];

//TODO: sinon mock object perhaps...
function mockGrid(){
    return {
        _getProperties: function() { return {}; },
        getHeaderRowCount: function() {
            return 0;
        },
        selectionModel: {
            hasRowSelections: function(){return false;}
        }
    };
}

var DataSourceBase = require('../src/dataSources/DataSourceBase');
var mockFilter = DataSourceBase.extend('DataSourceFilter', {
    initialize: function(ds) {
      this.dataSource = ds;
    },
    //Simulating a filter for "Eric"
    apply: function() {
        this.getRow = function(r) {
            if (r === 0) {
                return this.dataSource.getRow(2);
            }
        };
    },
    filterTest: function() {return true;},
    set: function() {}
});

describe('Datamodels JSON', function(){

    describe('Module expected shape', function(){
        it('Should have the instance shape', function(){
            var DM = require('../src/dataModels/JSON');
            var myMockGrid = mockGrid();
            var dataModel = new DM(myMockGrid);

            instance.forEach(function(key){
                //console.log(key);
                expect(typeof(dataModel[key.name])).to.equal(key.type);
            });
        });
    });

    describe('Set Pipeline', function(){
        it('Should correctly return correct row before and after using external filter', function(){
            var DM = require('../src/dataModels/JSON');
            var myMockGrid = mockGrid();
            var dataModel = new DM(myMockGrid);
            dataModel.setData(mockData);
            expect(dataModel.getRow(0)).to.equal(mockData[0]);

            //Set Pipeline
            dataModel.setPipeline([mockFilter]);
            dataModel.applyAnalytics();
            expect(dataModel.getRow(0)).to.equal(mockData[2]);
        });
    });

});
