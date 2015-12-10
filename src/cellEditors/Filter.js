/* eslint-env browser */
'use strict';

var CellEditor = require('./CellEditor');

/**
 * @constructor
 */
var Filter = CellEditor.extend('Filter', {

    /**
     * my lookup alias
     * @type {string}
     * @memberOf Textfield.prototype
     */
    alias: 'filter',

    initialize: function() {
        this.dialog = document.createElement('div');
        this.content = document.createElement('div');
        this.buttons = document.createElement('div');

        var style = this.dialog.style;
        style.top = '0%';
        style.position = 'absolute';
        style.top = 0;
        style.left = 0;
        style.right = 0;
        style.bottom = 0;
        style.whiteSpace = 'nowrap';

        style = this.content.style;
        style.top = '0%';
        style.position = 'absolute';
        style.top = 0;
        style.left = 0;
        style.right = 0;
        style.bottom = 0;
        style.marginBottom = '44px';
        style.whiteSpace = 'nowrap';

        style = this.buttons.style;
        style.top = '0%';
        style.position = 'absolute';
        style.top = '100%';
        style.left = 0;
        style.right = 0;
        style.bottom = 0;
        style.marginTop = '-44px';
        style.whiteSpace = 'nowrap';
        style.textAlign = 'center';
        style.padding = '8px';

        this.dialog.appendChild(this.content);
        this.dialog.appendChild(this.buttons);

        this.ok = document.createElement('button');
        this.ok.style.borderRadius = '2px';

        this.cancel = document.createElement('button');
        this.cancel.style.marginLeft = '5px';
        this.cancel.style.borderRadius = '2px';

        this.ok.innerHTML = 'ok';
        this.cancel.innerHTML = 'cancel';

        this.buttons.appendChild(this.ok);
        this.buttons.appendChild(this.cancel);

        var self = this;
        this.ok.onclick = function() {
            self.okPressed();
        };
        this.cancel.onclick = function() {
            self.cancelPressed();
        };

    },

    okPressed: function() {
        var dialog = this.getGrid().dialog;
        dialog.close();
        dialog.clear();
    },

    cancelPressed: function() {
        var dialog = this.getGrid().dialog;
        dialog.close();
        dialog.clear();
    },

    template: function() {
        /*
            <input id="editor">
        */
    },

    beginEditAt: function(point) {
        var dialog = this.getGrid().dialog;
        //var self = this;
        if (dialog.isOpen()) {
            dialog.close();
            dialog.clear();
        } else {
            this.buildContent(dialog.overlay);
            dialog.onClose = function() {
                //self.updateFromColumnPicker(dialog.overlay);
            };
            dialog.open();
        }
    },

    buildContent: function(div) {
        div.appendChild(this.dialog);
    },

});

module.exports = Filter;
