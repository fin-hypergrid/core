'use strict';

var Simple = require('./Simple');
var Map = require('../Mappy');

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

    autopopulate: function() {
        var grid = this.getGrid();
        var behavior = grid.getBehavior();
        var point = this.getEditorPoint();
        var colProps = grid.getColumnProperties(point.x);
        if (!colProps.autopopulateEditor) {
            return;
        }
        var headerCount = grid.getHeaderRowCount();
        var rowCount = grid.getRowCount() - headerCount;
        var column = point.x;
        var map = new Map();
        for (var r = 0; r < rowCount; r++) {
            var each = behavior.getRawValue(column, r);
            map.set(each, each);
        }
        var values = map.values;
        values.sort();

        if (values.length > 0 && values[0].length > 0) {
            values.unsshift('');
        }

        this.setItems(values);
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

    preShowEditorNotification: function() {
        this.autopopulate();
        this.setEditorValue(this.initialValue);
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
        Simple.prototype.initializeInput.apply(this, [input]);
        input.onchange = function() {
            self.stopEditing();
        };
    }

});

module.exports = Choice;
