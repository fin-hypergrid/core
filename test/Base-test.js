'use strict';

var expect = require('chai').expect;

var instance = [{
    name:'extend',
    type: 'function'
}];

describe('Base', function(){
    describe('Module expected shape', function(){

        it('Should have the instance shape', function(){
            var base = require('../src/Base');

            instance.forEach(function(key){
                expect(typeof(base[key.name])).to.equal(key.type);
            });
        });
    });

    describe('extend', function(){
        it('Should create a new constructor', function(){
            var base = require('../src/Base');
            var myConstructor = base.extend('myConstructor', {a:'a'});

            expect(typeof(myConstructor)).to.equal('function');
        });

        describe('Should extend with', function() {
            var base, MyConstructor, myObject;
            beforeEach(function() {
                base = require('../src/Base');
                MyConstructor = base.extend('MyConstructor', {a:'a'});
                myObject = new MyConstructor();
            });

            it('Should extend with HypergridError', function() {
                expect(typeof(myObject.HypergridError)).to.equal('function');
            });

            it('Should extend with deprecated', function(){
                expect(typeof(myObject.deprecated)).to.equal('function');
            });

            it('Should extend with unwrap', function(){
                expect(typeof(myObject.unwrap)).to.equal('function');
            });
        });

    });

    describe('HypergridError', function(){
        it('should assign the message', function(){
            var base = require('../src/Base');
            var message = 'this is the message';
            var MyConstructor = base.extend('MyConstructor', {a:'a'});
            var myObject = new MyConstructor();
            var myError = new myObject.HypergridError(message);

            expect(myError.message).to.equal(message);

        });
    });

});
