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
 * As of spring 2016:
 * Functions well in Chrome except no localization (day, month names; date format).
 * Unimplemented in Safari, Firefox, Internet Explorer.
 * This is a "snmart" control. It detects Chrome:
 * * If Chrome, uses chromeDate overrides format to that required by the value attribute, yyyy-mm-dd. (Note that this is not the format displayed in the control, which is always mm/dd/yyyy.)
 * * Otherwise uses localized date format _but_ falls back to a regular text box.
 * @constructor
 * @extends CellEditor
 */
var Date = CellEditor.extend('Date', {

    initialize: function(grid) {

        var localizerName,
            usesDateInputControl = isChrome;

        if (usesDateInputControl) {
            localizerName = 'chromeDate';
            this.template = '<input type="date">';
        } else {
            localizerName = 'date';
            this.template = '<input type="text" lang="{{locale}}">';

            this.selectAll = function() {
                var lastCharPlusOne = this.getEditorValue().length;
                this.input.setSelectionRange(0, lastCharPlusOne);
            };
        }

        this.localizer = grid.localization.get(localizerName);
    }
});


module.exports = Date;
