'use strict';

module.exports = Textfield.extend('(New)', {

});
// --- snip ---
'use strict';

var UP = '⬆', DN = '⬇';

module.exports = Textfield.extend('Trend', {
    template: [
        '<div class="hypergrid-textfield" style="text-align:right; white-space:nowrap;">',
        '  <input type="text" lang="{{locale}}" style="background-color:transparent; width:77%; text-align:right; border:0; padding:0; outline:0; font:inherit; margin-right: -1px;' +
        '{{style}}"><span>' + UP + '</span>',
        '</div>'
    ].join('\n'),

    initialize: function() {
        this.input = this.el.querySelector('input');
        this.trend = this.el.querySelector('span');

        // Flip arrow on any click
        this.trend.onclick = function() {
            this.trend.textContent = this.trend.textContent === UP ? DN : UP;
            this.input.focus(); // return focus to text field
        }.bind(this);

/*
        // Flip arrow on + and - keypresses
        this.input.onkeypress = function(e) {
            switch (e.key) {
                case '+':
                    this.trend.textContent = UP;
                    e.preventDefault();
                    break;
                case '-':
                    this.trend.textContent = DN;
                    e.preventDefault();
                    break;
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
        this.trend.textContent = value < 0 ? DN : UP;
        this.input.value = Math.abs(value).toFixed(2);
    },

    getEditorValue: function(value) {
        return this.super.getEditorValue.call(this, value + this.trend.textContent);
    },

    validateEditorValue: function(value) {
        return this.super.validateEditorValue.call(this, value + this.trend.textContent);
    }

});