'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 */
var Master = Feature.extend('Master', {

    /**
     * @memberOf Master.prototype
     * @desc Handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    pause: function(){
        console.log('Features paused');
        this.detachChain();
    },
    resume: function(){
        console.log('Features resumed');
        this.attachChain();
    }
});

module.exports = Master;
