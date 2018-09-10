'use strict';

module.exports = {
  name: '(New)',
  format: function(val) {
    var str;
    str = val; // replace this line with formatting logic
    return str;
  },
  parse: function(str) {
    var val;
    val = str; // replace this line with parse logic
    return val;
  },
  // invalid: function(value) {} // supply if `parse` expects clean syntax
  // expectation: 'optional string describing valid syntax displayed on error'
};
/* ✂ */
'use strict';

module.exports = {
  name: 'trend',
  format: function(value) {
    return Math.abs(value).toFixed(2) + (value < 0 ? '⬇' : '⬆');
  },
  parse: function(str) {
    var m = str.match(/^((\+?|-)(\d+(\.(\d+)?)?|\.\d+)(⬆?|⬇))$/);

    if (m) {
        switch (m[2] + m[6]) {
          case '-': case '⬇':
            return -m[3];
          case '+': case '⬆': case '':
            return +m[3];
        }
    }

    throw new SyntaxError('Expected a floating point number, optionally prefixed with a sign or suffixed with an arrow.');
  }
};
/* ✂ */
'use strict';

var footInchPattern = /^\s*((((\d+)')?\s*((\d+)")?)|\d+)\s*$/;

module.exports = {
  name: 'ft-in',
  format: function(value) {
    value = Math.round(value);
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
/* ✂ */
'use strict';

module.exports = {
  name: 'clock24',

  // returns formatted string from number of minutes
  format: function(mins) {
    var hh = Math.floor(mins / 60);
    var mm = (mins % 60 + 100 + '').substr(1, 2);
    return hh + ':' + mm;
  },

  invalid: function(hhmm) {
    return !/^([01]?[1-9]|2[0-3]):[0-5]\d$/i.test(hhmm); // 23:59 max
  },

  // returns number of minutes from formatted string
  parse: function(hhmm) {
    var parts = hhmm.match(/^(\d+):(\d{2})$/i);
    var value = Number(parts[1]) * 60 + Number(parts[2]);
    return value;
  }
};
/* ✂ */
'use strict';

var NOON = 12 * 60;

module.exports = {
  name: 'clock12',

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
};