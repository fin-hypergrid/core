'use strict';
/**
 *
 * @module cell-editors\choice
 *
 */

var Simple = require('./Simple.js');

function Choice() {
    Simple.call(this);
}

Choice.prototype = new Simple();

Choice.prototype.constructor = Choice;

/**
 * @property {string} alias - my lookup alias
 * @instance
 */
Choice.prototype.alias = 'choice';

/**
 * @property {Array} items - the list of items to pick from
 * @instance
 */
Choice.prototype.items = ['a','b','c'];

Choice.prototype.template = function() {/*
    <select id="editor">
        {{#items}}
            <option value="{{.}}">{{.}}</option>
        {{/items}}
    </select>
*/
};
//no events are fired while the dropdown is open
//see http://jsfiddle.net/m4tndtu4/6/
Choice.prototype.showEditor = function() {
    var self = this;
    this.input.style.display = 'inline';
    setTimeout(function() {
        self.showDropdown(self.input);
    }, 50);
};

Choice.prototype.setItems = function(items) {
    this.items = items;
    this.updateView();
};

Choice.prototype.initializeInput = function(input) {
    var self = this;
    Simple.prototype.initializeInput(input);
    input.onchange = function() {
        self.stopEditing();
    };
};

module.exports = Choice;
