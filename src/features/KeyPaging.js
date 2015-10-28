'use strict';
/**
 *
 * @module features\key-paging
 *
 */
var Base = require('./Base.js');

var commands = {
    PAGEDOWN: function(grid) {
        grid.pageDown();
    },
    PAGEUP: function(grid) {
        grid.pageUp();
    },
    PAGELEFT: function(grid) {
        grid.pageLeft();
    },
    PAGERIGHT: function(grid) {
        grid.pageRight();
    }
};

/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function KeyPaging() {
    Base.call(this);
    this.alias = 'KeyPaging';
};

KeyPaging.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
KeyPaging.prototype.handleKeyDown = function(grid, event) {
    var detail = event.detail.char;
    var func = commands[detail];
    if (func) {
        func(grid);
    } else if (this.next) {
        this.next.handleKeyDown(grid, event);
    }
}

module.exports = KeyPaging;
