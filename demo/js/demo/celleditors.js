/* eslint-env browser */

'use strict';

module.exports = function(demo, grid) {

    var idx = grid.behavior.columnEnum;

    var CellEditor = grid.cellEditors.BaseClass;
    var Textfield = grid.cellEditors.get('textfield');

    var ColorText = Textfield.extend('colorText', {
        template: '<input type="text" lang="{{locale}}" style="color:{{textColor}}">'
    });

    grid.cellEditors.add(ColorText);

    var Time = Textfield.extend('Time', {
        template: [
            '<div class="hypergrid-textfield" style="text-align:right;">',
            '    <input type="text" lang="{{locale}}" style="background-color:transparent; width:60%; text-align:right; border:0; padding:0; outline:0; font:inherit;' +
            '{{style}}">',
            '    <span>AM</span>',
            '</div>'
        ].join('\n'),

        initialize: function() {
            this.input = this.el.querySelector('input');
            this.meridian = this.el.querySelector('span');

            // Flip AM/PM on any click
            this.el.onclick = function() {
                this.meridian.textContent = this.meridian.textContent === 'AM' ? 'PM' : 'AM';
                this.input.focus(); // return focus to text field
            }.bind(this);

            // Flip AM/PM on 'am' or 'pm' keypresses
            this.input.onkeypress = function(e) {
                switch (e.key) {
                    case 'a': case 'A': this.meridian.textContent = 'AM'; e.preventDefault(); break;
                    case 'p': case 'P': this.meridian.textContent = 'PM'; e.preventDefault(); break;
                    case 'm': case 'M':
                        if (/[ap]/i.test(this.previousKeypress)) { e.preventDefault(); break; }
                        // fall through to FSM when M NOT preceded by A or P
                    default:
                        // only allow digits and colon (besides A, P, M as above) and specials (ENTER, TAB, ESC)
                        if ('0123456789:'.indexOf(e.key) >= 0 || this.specialKeyups[e.keyCode]) {
                            break;
                        }
                        // FSM jam!
                        this.errorEffectBegin(); // feedback for unexpected key press
                        e.preventDefault();
                }
                this.previousKeypress = e.key;
            }.bind(this);
        },

        setEditorValue: function(value) {
            this.super.setEditorValue.call(this, value);
            var parts = this.input.value.split(' ');
            this.input.value = parts[0];
            this.meridian.textContent = parts[1];
        },

        getEditorValue: function(value) {
            delete this.previousKeypress;
            return this.super.getEditorValue.call(this, value + ' ' + this.meridian.textContent);
        },

        validateEditorValue: function(value) {
            return this.super.validateEditorValue.call(this, value + ' ' + this.meridian.textContent);
        }
    });

    grid.cellEditors.add(Time);

    // Used by the cellProvider.
    // `null` means column's data cells are not editable.
    var editorTypes = [
        null,
        'textfield',
        'textfield',
        'textfield',
        null,
        'time',
        'choice',
        'choice',
        'choice',
        'textfield',
        'textfield',
        'textfield'
    ];

    // Override to assign the the cell editors.
    grid.behavior.dataModel.getCellEditorAt = function(x, y, declaredEditorName, cellEvent) {
        var editorName = declaredEditorName || editorTypes[x % editorTypes.length];

        switch (x) {
            case idx.birthState:
                cellEvent.textColor = 'red';
                break;
        }

        var cellEditor = grid.cellEditors.create(editorName, cellEvent);

        if (cellEditor) {
            switch (x) {
                case idx.employed:
                    cellEditor = null;
                    break;

                case idx.totalNumberOfPetsOwned:
                    cellEditor.input.setAttribute('min', 0);
                    cellEditor.input.setAttribute('max', 10);
                    cellEditor.input.setAttribute('step', 0.01);
                    break;
            }
        }

        return cellEditor;
    };
};
