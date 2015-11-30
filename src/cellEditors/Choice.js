'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Choice = Simple.extend('Choice', {

    /**
     * my lookup alias
     * @type {string}
     * @memberOf Choice.prototype
     */
    alias: 'choice',

    /**
     * the list of items to pick from
     * @type {Array}
     * @memberOf Choice.prototype
     */
    items: ['a', 'b', 'c'],

    template: function() {
        /*
                <select id="editor">
                    {{#items}}
                        <option value="{{.}}">{{.}}</option>
                    {{/items}}
                </select>
            */
    },

    //no events are fired while the dropdown is open
    //see http://jsfiddle.net/m4tndtu4/6/

    /**
     * @memberOf Choice.prototype
     */
    showEditor: function() {
        var self = this;
        this.input.style.display = 'inline';
        setTimeout(function() {
            self.showDropdown(self.input);
        }, 50);
    },

    /**
     * @memberOf Choice.prototype
     * @param items
     */
    setItems: function(items) {
        this.items = items;
        this.updateView();
    },

    /**
     * @memberOf Choice.prototype
     * @param input
     */
    initializeInput: function(input) {
        var self = this;
        Simple.prototype.initializeInput(input);
        input.onchange = function() {
            self.stopEditing();
        };
    }

});

module.exports = Choice;
