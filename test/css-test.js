'use strict';

var expect = require('chai').expect;

var instance = [
    {
        name:'grid',
        type:'string'
    },
    {
        name:'list-dragon-addendum',
        type:'string'
    },
];

describe('CSS', function(){
    describe('Module expected shape', function() {

        it('Should have theinstance shape', function() {
            var css = require('../css');

            instance.forEach(function(key){
                expect(typeof(css[key.name])).to.equal(key.type);
            });
        });

        it('Should not be empty', function() {
            var css = require('../css');

            instance.forEach(function(key){
                expect(css[key.name].trim()).to.not.equal('');
            });
        });

    });
});
