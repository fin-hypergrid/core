'use strict';

var Textfield = require('./Textfield');

/**
 * Functions well in Chrome, Safari, Firefox, and Internet Explorer.
 * @constructor
 * @extends Textfield
 */
var Number = Textfield.extend('Number', {

    initialize: function(grid) {
        this.localizer = grid.localization.get('number');
    }

});

module.exports = Number;
