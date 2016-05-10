/* eslint-env browser */

'use strict';

var CellEditor = require('./CellEditor');
var localization = require('../lib/localization');

var isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf('OPR') > -1,
    isIEedge = winNav.userAgent.indexOf('Edge') > -1,
    isIOSChrome = winNav.userAgent.match('CriOS'),
    isChrome = !isIOSChrome &&
        isChromium !== null &&
        isChromium !== undefined &&
        vendorName === 'Google Inc.' &&
        isOpera == false && isIEedge == false; // eslint-disable-line eqeqeq

    /**
 * @constructor
 */
var Date = CellEditor.extend('Date', {

    initialize: function(grid, localizer) {

        var usesDateInputControl = isChrome;

        if (!usesDateInputControl) {
            this.template = {
                /*
                 <input type="text">
                 */
            };

            this.selectAll = function() {
                var lastCharPlusOne = this.getEditorValue().length;
                this.input.setSelectionRange(0, lastCharPlusOne);
            };

            this.localizer = localization.get('date');
        }
    },

    template: function() {
        /*
            <input id="editor" type="date">
        */
    },

    localizer: localization.get('chromeDate')
});


module.exports = Date;
