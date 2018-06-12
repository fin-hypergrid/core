'use strict';

exports.editor = [

`module.exports = Textfield.extend('(New)', {

});`,

`module.exports = Textfield.extend('Trend', {
    template: [
      '<div class="hypergrid-textfield" style="text-align:right; white-space:nowrap;">',
      '  <input type="text" lang="{{locale}}" style="background-color:transparent; width:77%; text-align:right; border:0; padding:0; outline:0; font:inherit; margin-right: -1px;' +
      '{{style}}"><span>⬆</span>',
      '</div>'
    ].join('\\n'),

    initialize: function() {
      this.input = this.el.querySelector('input');
      this.trend = this.el.querySelector('span');

      // Flip AM/PM on any click
      this.trend.onclick = function() {
        this.trend.textContent = this.trend.textContent === '⬆' ? '⬇' : '⬆';
        this.input.focus(); // return focus to text field
      }.bind(this);

/*
      // Flip AM/PM on 'am' or 'pm' keypresses
      this.input.onkeypress = function(e) {
        switch (e.key) {
          case '+': this.trend.textContent = '⬆'; e.preventDefault(); break;
          case '-': this.trend.textContent = '⬇'; e.preventDefault(); break;
          default:
            // only allow digits, decimal point, and specials (ENTER, TAB, ESC)
            if ('0123456789.'.indexOf(e.key) < 0 && !this.specialKeyups[e.keyCode]) {
              this.errorEffectBegin(); // feedback for unexpected key press
              e.preventDefault();
            }
        }
      }.bind(this);
*/
    },

    setEditorValue: function(value) {
      this.super.setEditorValue.call(this, value);
      this.trend.textContent = value < 0 ? '⬇' : '⬆';
      this.input.value = Math.abs(value).toFixed(2);
    },

    getEditorValue: function(value) {
      return this.super.getEditorValue.call(this, value + this.trend.textContent);
    },
    
    validateEditorValue: function(value) {
      return this.super.validateEditorValue.call(this, value + this.trend.textContent);
    }

});`

];

exports.localizer = [

`module.exports = {
  name: '(New)',
  format: function(value) {
    var str;
    str = val; // replace this line with formatting logic
    return str;
  },
  parse: function(str) {
    var val;
    val = str; // replace this line with parse logic
    return val;
  },
  // invalid: function(value) {} // supply if \`parse\` expects clean syntax
  // expectation: 'optional string describing valid syntax displayed on error'
};`,

`module.exports = {
  name: 'trend',
  format: function(value) {
    return Math.abs(value).toFixed(2) + (value < 0 ? '⬇' : '⬆');
  },
  parse: function(str) {
    var value = parseFloat(str);
    
    // if (isNaN(value)) { throw new SyntaxError('Expected input to start with a floating point number representation optionally prefixed with a negative sign and/or ending with optional optional down-arrow.'); }
    
    if (/(^-|⬇$)/.test(str)) { value = -Math.abs(value); }
    
    return value; 
  },
  invalid: function(str) { return !/^(\\d+(\\.(\\d+)?)?|\\.\\d+)[⬇⬆]$/.test(str); }
};`,

`var footInchPattern = /^\s*((((\\d+)')?\\s*((\\d+)")?)|\\d+)\\s*$/;

module.exports = {
  name: 'ft-in',
  format: function(value) {
    value = Math.round(value);
    if (value != null) {
      var feet = Math.floor(value / 12);
      value = (feet ? feet + '\\'' : '') + ' ' + (value % 12) + '"';
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
};`,

`module.exports = {
  name: 'clock24',

  // returns formatted string from number of minutes
  format: function(mins) {
    var hh = Math.floor(mins / 60);
    var mm = (mins % 60 + 100 + '').substr(1, 2);
    return hh + ':' + mm;
  },

  invalid: function(hhmm) {
    return !/^([01]?[1-9]|2[0-3]):[0-5]\\d$/i.test(hhmm); // 23:59 max
  },

  // returns number of minutes from formatted string
  parse: function(hhmm) {
    var parts = hhmm.match(/^(\\d+):(\\d{2})$/i);
    var value = Number(parts[1]) * 60 + Number(parts[2]);
    return value;
  }
};`,

`var NOON = 12 * 60;

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
    return !/^(0?[1-9]|1[0-2]):[0-5]\\d\\s+(AM|PM)$/i.test(hhmmAmPm); // 12:59 max
  },

  // returns number of minutes from formatted string
  parse: function(hhmmAmPm) {
    var parts = hhmmAmPm.match(/^(\\d+):(\\d{2})\\s+(AM|PM)$/i);
    var hours = parts[1] === '12' ? 0 : Number(parts[1]);
    var minutes = Number(parts[2]);
    var value = hours * 60 + minutes;
    var pm = parts[3].toUpperCase() === 'PM';
    if (pm) { value += NOON; }
    return value;
  }
};`

];
