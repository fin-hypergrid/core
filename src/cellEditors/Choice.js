'use strict';

var Simple = require('./Simple');

var Choice = Simple.extend({

    /**
     * @property {string} alias - my lookup alias
     * @instance
     */
    alias: 'choice',

    /**
     * @property {Array} items - the list of items to pick from
     * @instance
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

    showEditor: function() {
        var self = this;
        this.input.style.display = 'inline';
        setTimeout(function() {
            self.showDropdown(self.input);
        }, 50);
    },

    setItems: function(items) {
        this.items = items;
        this.updateView();
    },

    initializeInput: function(input) {
        var self = this;
        Simple.prototype.initializeInput(input);
        input.onchange = function() {
            self.stopEditing();
        };
    }

});

module.exports = Choice;