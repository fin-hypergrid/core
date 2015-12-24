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
        var data = document.createElement('div');
        var style = data.style;
        style.position = 'absolute';
        style.top = 0;
        style.left = 0;
        style.right = 0;
        style.bottom = 0;
        style.marginTop = '44px';
        style.marginBottom = '44px';

        var table = document.createElement('table');
        data.appendChild(table);

        style = table.style;
        style.position = 'absolute';
        style.width = '100%';
        style.height = '100%';

        var tr = document.createElement('tr');
        var td = document.createElement('td');
        table.appendChild(tr);
        tr.appendChild(td);

        this.title = document.createElement('div');
        this.title.innerHTML = 'Filter Editor';

        this.dialog = document.createElement('div');

        this.content = td;
        this.buttons = document.createElement('div');

        style = this.dialog.style;
        style.position = 'absolute';
        style.top = 0;
        style.left = 0;
        style.right = 0;
        style.bottom = 0;
        style.whiteSpace = 'nowrap';

        style = this.title.style;
        style.position = 'absolute';
        style.top = 0;
        style.left = 0;
        style.right = 0;
        style.bottom = '100%';
        style.marginBottom = '-44px';
        style.whiteSpace = 'nowrap';
        style.textAlign = 'center';
        style.padding = '11px';

        style = this.content.style;
        style.padding = '0 1em';

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

        this.dialog.appendChild(this.title);
        this.dialog.appendChild(data);
        this.dialog.appendChild(this.buttons);

        this.ok = document.createElement('button');
        this.ok.style.borderRadius = '8px';
        this.ok.style.width = '5.5em';

        this.cancel = document.createElement('button');
        this.cancel.style.marginLeft = '2em';
        this.cancel.style.borderRadius = '8px';
        this.cancel.style.width = '5.5em';

        this.delete = document.createElement('button');
        this.delete.style.marginLeft = '2em';
        this.delete.style.borderRadius = '8px';
        this.delete.style.width = '5.5em';

        this.reset = document.createElement('button');
        this.reset.style.marginLeft = '2em';
        this.reset.style.borderRadius = '8px';
        this.reset.style.width = '5.5em';

        this.ok.innerHTML = 'ok';
        this.cancel.innerHTML = 'cancel';
        this.delete.innerHTML = 'delete';
        this.reset.innerHTML = 'reset';

        this.buttons.appendChild(this.ok);
        this.buttons.appendChild(this.reset);
        this.buttons.appendChild(this.delete);
        this.buttons.appendChild(this.cancel);

        var self = this;
        this.ok.onclick = function() {
            self.okPressed();
        };
        this.cancel.onclick = function() {
            self.cancelPressed();
        };
        this.delete.onclick = function() {
            self.deletePressed();
        };
        this.reset.onclick = function() {
            self.resetPressed();
        };
    },

    tearDown: function() {
        this.content.innerHTML = '';
    },

    okPressed: function() {
        var dialog = this.getGrid().dialog;
        dialog.onOkPressed();
    },

    cancelPressed: function() {
        var dialog = this.getGrid().dialog;
        dialog.onCancelPressed();
    },

    deletePressed: function() {
        var dialog = this.getGrid().dialog;
        dialog.onDeletePressed();
    },

    resetPressed: function() {
        var dialog = this.getGrid().dialog;
        dialog.onResetPressed();
    },

    beginEditAt: function(editorPoint) {
        var grid = this.getGrid();
        var behavior = grid.getBehavior();
        var dialog = grid.dialog;
        var title = behavior.getColumnId(editorPoint.x);
        dialog.fields = [{
            value: behavior.getField(editorPoint.x),
            text: title
        }];
        this.title.innerHTML = 'filter for <strong>' + title + '</strong> column';
        var filter = grid.getFilterFor(editorPoint.x);
        //var self = this;
        if (dialog.isOpen()) {
            dialog.close();
        } else {
            var self = this;

            dialog.clear();
            dialog.overlay.appendChild(this.dialog);

            filter.initialize(dialog);

            dialog.onOkPressed = function() {
                filter.onOk(dialog);
                self.tearDown();
                behavior.setComplexFilter(editorPoint.x, {
                    type: filter.alias,
                    state: filter.getState()
                });
                dialog.close();
                behavior.applyFilters();
                behavior.changed();
            };

            dialog.onCancelPressed = function() {
                if (filter.onCancel && filter.onCancel(dialog)) {
                    return;
                }
                self.tearDown();
                dialog.close();
                filter = undefined;
            };

            dialog.onDeletePressed = function() {
                if (filter.onDelete && filter.onDelete(dialog)) {
                    return;
                }
                self.tearDown();
                behavior.setComplexFilter(editorPoint.x, undefined);
                dialog.close();
                behavior.applyFilters();
                behavior.changed();
            };

            dialog.onResetPressed = function() {
                if (filter.onReset && filter.onReset(dialog)) {
                    return;
                }
                self.tearDown();
                filter.initialize(dialog);
                if (filter.onShow) {
                    filter.onShow(dialog, self.content);
                }
            };

            var cellBounds = grid._getBoundsOfCell(editorPoint.x, editorPoint.y);

            //hack to accomodate bootstrap margin issues...
            var xOffset = grid.div.getBoundingClientRect().left - grid.divCanvas.getBoundingClientRect().left;
            cellBounds.x = cellBounds.x - xOffset;
            dialog.openFrom(cellBounds);
            var previousState = behavior.getComplexFilter(editorPoint.x);
            if (previousState) {
                filter.setState(previousState.state);
            }
            setTimeout(function() {
                if (filter.onShow) {
                    filter.onShow(dialog, self.content);
                }
            }, dialog.getAnimationTime() + 10);
        }
    },

});

module.exports = Filter;
