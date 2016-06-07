'use strict';

var Textfield = require('./Textfield');

/**
 * @constructor
 */
var Number = Textfield.extend('Number', {

    initialize: function(grid) {
        this.localizer = grid.localization.get('number');
    }

});

module.exports = Number;
