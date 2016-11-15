'use strict';

var expect = require('chai').expect;

var instance = [
    {
        name:'grid',
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
        name:'reindex',
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
        name:'isDrillDown',
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
