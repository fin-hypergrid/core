/* eslint-env browser */

'use strict';

var CellEditor = require('./CellEditor');

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

    initialize: function(grid) {

        var localizerName,
            usesDateInputControl = isChrome;

        if (usesDateInputControl) {
            localizerName = 'chromeDate';

            this.template = function() {
                /*
                 <input id="editor" type="date">
                 */
            };
        } else {
            localizerName = 'date';

            this.template = {
                /*
                 <input type="text">
                 */
            };

            this.selectAll = function() {
                var lastCharPlusOne = this.getEditorValue().length;
                this.input.setSelectionRange(0, lastCharPlusOne);
            };

        }

        this.localizer = grid.localization.get(localizerName);
    }
});


module.exports = Date;
