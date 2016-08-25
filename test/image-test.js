'use strict';

var expect = require('chai').expect;

var instance = [
    {
        name:'calendar',
        type:'object'
    },
    {
        name:'checked',
        type:'object'
    },
    {
        name:'dialog',
        type:'object'
    },
    {
        name:'down-rectangle',
        type:'object'
    },
    {
        name:'filter-off',
        type:'object'
    },
    {
        name:'filter-on',
        type:'object'
    },
    {
        name:'unchecked',
        type:'object'
    },
    {
        name:'up-down-spin',
        type:'object'
    },
    {
        name:'up-down',
        type:'object'
    },
    {
        name:'checkbox',
        type:'function'
    },
    {
        name:'filter',
        type:'function'
    }
];

describe('Image', function() {

    beforeEach(function() {
        global.Image = function(){
            return {};
};
    });

    afterEach(function() {
        delete global.image;
    });

    describe('Module expected shape', function() {

        it('Should have the instance shape', function() {
            var images = require('../images');
            instance.forEach(function(key) {
                expect(typeof(images[key.name])).to.equal(key.type);
            });
});

        it('Image Objects have src properties', function(){
            var images = require('../images');
            instance.forEach(function(key) {
                if (typeof(images[key.name]) === 'object') {
                    expect(typeof(images[key.name].src)).to.equal('string');
}
            });
});
    });

    describe('checkbox', function() {
        it('Should return the checked image', function() {
            var images = require('../images');
            var image = images.checkbox(true);
            expect(image).to.equal(images.checked);
});

        it('Should return the unchecked image', function() {
            var images = require('../images');
            var image = images.checkbox(false);
            expect(image).to.equal(images.unchecked);
});
    });

    describe('filter', function() {
        it('Should return the filter-on image',  function() {
            var images = require('../images');
            var image = images.filter(true);
            expect(image).to.equal(images['filter-on']);
        });

        it('Should return the unchecked image', function() {
            var images = require('../images');
            var image = images.filter(false);
            expect(image).to.equal(images['filter-off']);
        });
    });
});
