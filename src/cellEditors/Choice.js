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
 * @function
 * @instance
 * @description
 polymer lifecycle event
 */
Choice.prototype.ready = function() {
    var self = this;
    this.readyInit();
    this.input.onchange = function() {
        self.stopEditing();
    };
};
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
    <form>
      <input list="fin-datalist" id="editor">
      <datalist id="fin-datalist">
        {{#items}}
            <option value="{{.}}">{{.}}</option>
        {{/items}}
      </datalist>
    </form>
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

module.exports = Choice;
