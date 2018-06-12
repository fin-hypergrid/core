/* eslint-env browser */

'use strict';

module.exports = function(demo, grid) {

    var footInchPattern = /^\s*((((\d+)')?\s*((\d+)")?)|\d+)\s*$/;

    var footInchLocalizer = {
        format: function(value) {
            if (value != null) {
                var feet = Math.floor(value / 12);
                value = (feet ? feet + '\'' : '') + ' ' + (value % 12) + '"';
            } else {
                value = null;
            }
            return value;
        },
        parse: function(str) {
            var inches, feet,
                parts = str.match(footInchPattern);
            if (parts) {
                feet = parts[4];
                inches = parts[6];
                if (feet === undefined && inches === undefined) {
                    inches = Number(parts[1]);
                } else {
                    feet = Number(feet || 0);
                    inches = Number(inches || 0);
                    inches = 12 * feet + inches;
                }
            } else {
                inches = 0;
            }
            return inches;
        }
    };

    grid.localization.add('foot', footInchLocalizer);

    grid.localization.add('singdate', new grid.localization.DateFormatter('zh-SG'));

    grid.localization.add('pounds', new grid.localization.NumberFormatter('en-US', {
        style: 'currency',
        currency: 'USD'
    }));

    grid.localization.add('francs', new grid.localization.NumberFormatter('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }));

    var NOON = 12 * 60;
    grid.localization.add({
        name: 'clock12', // alternative to having to hame localizer in `grid.localization.add`

        // returns formatted string from number of minutes
        format: function(mins) {
            var hh = Math.floor(mins / 60) % 12 || 12; // modulo 12 hrs with 0 becoming 12
            var mm = (mins % 60 + 100 + '').substr(1, 2);
            var AmPm = mins < NOON ? 'AM' : 'PM';
            return hh + ':' + mm + ' ' + AmPm;
        },

        invalid: function(hhmmAmPm) {
            return !/^(0?[1-9]|1[0-2]):[0-5]\d\s+(AM|PM)$/i.test(hhmmAmPm); // 12:59 max
        },

        // returns number of minutes from formatted string
        parse: function(hhmmAmPm) {
            var parts = hhmmAmPm.match(/^(\d+):(\d{2})\s+(AM|PM)$/i);
            var hours = parts[1] === '12' ? 0 : Number(parts[1]);
            var minutes = Number(parts[2]);
            var value = hours * 60 + minutes;
            var pm = parts[3].toUpperCase() === 'PM';
            if (pm) { value += NOON; }
            return value;
        }
    });

    return grid;

};
