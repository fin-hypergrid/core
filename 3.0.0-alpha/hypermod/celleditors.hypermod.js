(function(require, module, exports, Hypergrid) {
/* eslint-env browser */

'use strict';

module.exports = function() {

    var demo = this,
        grid = demo.grid,
        schema = grid.behavior.schema,
        CellEditor = grid.cellEditors.BaseClass,
        Textfield = grid.cellEditors.get('textfield'),
        ColorText = Textfield.extend('colorText', {
            template: '<input type="text" lang="{{locale}}" style="color:{{textColor}}">'
        });

    grid.cellEditors.add(ColorText);

    var Time = Textfield.extend('Time', {
        template: [
            '<div class="hypergrid-textfield" style="text-align:right;">',
            '    <input type="text" lang="{{locale}}" style="background-color:transparent; width:75%; text-align:right; border:0; padding:0; outline:0; font-size:inherit; font-weight:inherit;' +
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
            }.bind(this);
            this.input.onclick = function(e) {
                e.stopPropagation(); // ignore clicks in the text field
            };
            this.input.onfocus = function(e) {
                var target = e.target;
                this.el.style.outline = this.outline = this.outline || window.getComputedStyle(target).outline;
                target.style.outline = 0;
            }.bind(this);
            this.input.onblur = function(e) {
                this.el.style.outline = 0;
            }.bind(this);
            this.input.onkeypress = function(e) {
                switch(e.key) {
                    case 'a': case 'A':
                        this.meridian.textContent = 'AM';
                        e.preventDefault();
                        break;
                    case 'p': case 'P':
                        this.meridian.textContent = 'PM';
                        e.preventDefault();
                        break;
                    case 'm': case 'M':
                        if (/[ap]/i.test(this.previousKeypress)) {
                            // just ignore M when preceded by A or P
                            e.preventDefault();
                            break;
                        }
                        // fall through when NOT preceded by A or P
                    default:
                        // only allow digits and colon (besides A, P, M as above)
                        if ('0123456789:'.indexOf(e.key) >= 0) {
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
            CellEditor.prototype.setEditorValue.call(this, value);
            var parts = this.input.value.split(' ');
            this.input.value = parts[0];
            this.meridian.textContent = parts[1];
        },

        getEditorValue: function(value) {
            delete this.previousKeypress;
            value = CellEditor.prototype.getEditorValue.call(this, value);
            if (this.meridian.textContent === 'PM') {
                value += demo.NOON;
            }
            return value;
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
            case schema.birthState.index:
                cellEvent.textColor = 'red';
                break;
        }

        var cellEditor = grid.cellEditors.create(editorName, cellEvent);

        if (cellEditor) {
            switch (x) {
                case schema.employed.index:
                    cellEditor = null;
                    break;

                case schema.totalNumberOfPetsOwned.index:
                    cellEditor.input.setAttribute('min', 0);
                    cellEditor.input.setAttribute('max', 10);
                    cellEditor.input.setAttribute('step', 0.01);
                    break;
            }
        }

        return cellEditor;
    };
};
})(fin.Hypergrid.require, fin.Hypergrid.modules, fin.$x = {}, fin.Hypergrid);
fin.Hypergrid.modules.celleditors = fin.$x;
delete fin.$x;
