'use strict';

var assert = require('assert');

var instance = [{
    name:'extend',
    type: 'function'
}];

describe('Base', function(){
    describe('Module expected shape', function(){

        it('Should have the instance shape', function(){
            var base = require('../src/Base');

            instance.forEach(function(key){
                assert.equal(typeof(base[key.name]), key.type);
            });
        });
    });

    describe('extend', function(){
        it('Should create a new constructor', function(){
            var base = require('../src/Base');
            var myConstructor = base.extend('myConstructor', {a:'a'});

            assert.equal(typeof(myConstructor), 'function');
        });

        describe('Should extend with', function() {
            var base, MyConstructor, myObject;
            beforeEach(function() {
                base = require('../src/Base');
                MyConstructor = base.extend('MyConstructor', {a:'a'});
                myObject = new MyConstructor();
            });

            it('Should extend with HypergridError', function() {
                assert.equal(typeof(myObject.HypergridError), 'function');
            });

            it('Should extend with deprecated', function(){
                assert.equal(typeof(myObject.deprecated), 'function');
            });

            it('Should extend with unwrap', function(){
                assert.equal(typeof(myObject.unwrap), 'function');
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

            assert.equal(myError.message, message);

        });
    });

});
