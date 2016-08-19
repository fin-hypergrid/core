'use strict';

var expect = require('chai').expect;

var instance = [{
    name:'extend',
    type: 'function'
}];

describe('Base', function(){
    describe('Module expected shape', function(){

        it('Should have the instance shape', function(){
            var base = require('../src/lib/Base');

            instance.forEach(function(key){
                expect(typeof(base[key.name])).to.equal(key.type);
            });
        });
    });

    describe('extend', function(){
        it('Should create a new constructor', function(){
            var base = require('../src/lib/Base');
            var myConstructor = base.extend('myConstructor', {a:'a'});

            expect(typeof(myConstructor)).to.equal('function');
        });

        it('Should extend with HypergridError', function() {
            var base = require('../src/lib/Base');
            var MyConstructor = base.extend('MyConstructor', {a:'a'});
            var myObject = new MyConstructor();

            expect(typeof(myObject.HypergridError)).to.equal('function');
        });

        it('Should extend with deprecated', function(){
            var base = require('../src/lib/Base');
            var MyConstructor = base.extend('MyConstructor', {a:'a'});
            var myObject = new MyConstructor();

            expect(typeof(myObject.deprecated)).to.not.be.an('undefined');
        });
    });

    describe('HypergridError', function(){
        it('should assign the message', function(){
            var base = require('../src/lib/Base');
            var message = 'this is the message';
            var MyConstructor = base.extend('MyConstructor', {a:'a'});
            var myObject = new MyConstructor();
            var myError = new myObject.HypergridError(message);

            expect(myError.message).to.equal(message);

        });
    });

});
