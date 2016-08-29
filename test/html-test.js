'use strict';

var expect = require('chai').expect;

var instance = [
    {
        name:'CQL',
        type:'string'
    },
    {
        name:'SQL',
        type:'string'
    },
    {
        name:'dialog',
        type:'string'
    },
    {
        name:'filterTrees',
        type:'string'
    }
];
describe('HTML', function() {

    describe('Module expected shape', function(){
        it('Should have strings keys', function(){
            var html = require('../html');

            instance.forEach(function(key){
                expect(typeof(html[key.name])).to.equal(key.type);
            });
        });

        it('Should not be empty', function() {
            var html = require('../html');

            instance.forEach(function(key){
                expect(html[key.name].trim()).to.not.equal('');
            });
        });
    });


});
