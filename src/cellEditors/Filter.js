/* eslint-env browser */
'use strict';

var CellEditor = require('./CellEditor');

/**
 * @constructor
 */
var Filter = CellEditor.extend('Filter', {

    initialize: function() {
        var data = document.createElement('div');
        var style = data.style;
        style.position = 'absolute';
        style.top = style.bottom = '44px';
        style.right = style.left = '1em';
        style.overflowY = 'scroll';

        var table = document.createElement('table');
        data.appendChild(table);

        style = table.style;
        style.width = style.height = '100%';

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
        style.top = style.left = style.right = style.bottom = 0;
        style.whiteSpace = 'nowrap';

        style = this.title.style;
        style.position = 'absolute';
        style.top = style.left = style.right = 0;
        style.height = '44px';
        style.whiteSpace = 'nowrap';
        style.textAlign = 'center';
        style.padding = '11px';

        style = this.buttons.style;
        style.position = 'absolute';
        style.left = style.right = style.bottom = 0;
        style.height = '44px';
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
        var dialog = this.grid.dialog;
        dialog.onOkPressed();
    },

    cancelPressed: function() {
        var dialog = this.grid.dialog;
        dialog.onCancelPressed();
    },

    deletePressed: function() {
        var dialog = this.grid.dialog;
        dialog.onDeletePressed();
    },

    resetPressed: function() {
        var dialog = this.grid.dialog;
        dialog.onResetPressed();
    },

    beginEditAt: function(editorPoint) {
        var behavior = this.grid.behavior;
        var dialog = this.grid.dialog;

        var columnIndex = editorPoint.x;
        //var title = behavior.getColumnId(columnIndex);
        //var field = behavior.getField(columnIndex);
        //var type = behavior.getColumn(columnIndex).getType();

        this.title.innerHTML = 'Manage Filters';
        var filter = behavior.getGlobalFilter();
        //var self = this;
        if (dialog.isOpen()) {
            dialog.close();
        } else {
            var self = this;

            dialog.clear();
            dialog.overlay.appendChild(this.dialog);

            filter.initializeDialog();

            dialog.onOkPressed = function() {
                if (filter.onOk && filter.onOk()) { // onOK() truthy result means abort; falsy means proceed
                    return;
                }
                self.tearDown();
                //behavior.setComplexFilter(columnIndex, {
                //    //type: filter.alias,
                //    state: filter.getState()
                //});
                dialog.close();
                behavior.applyAnalytics();
                behavior.changed();
            };

            dialog.onCancelPressed = function() {
                if (filter.onCancel && filter.onCancel()) {
                    return;
                }
                self.tearDown();
                dialog.close();
                filter = undefined;
            };

            dialog.onDeletePressed = function() {
                if (filter.onDelete && filter.onDelete()) {
                    return;
                }
                self.tearDown();
                //behavior.setComplexFilter(columnIndex, undefined);
                dialog.close();
                behavior.applyAnalytics();
                behavior.changed();
            };

            dialog.onResetPressed = function() {
                if (filter.onReset && filter.onReset()) {
                    return;
                }
                self.tearDown();
                filter.initializeDialog(dialog);
                if (filter.onShow) {
                    filter.onShow(self.content);
                }
            };

            var cellBounds = this.grid._getBoundsOfCell(columnIndex, editorPoint.y);

            //hack to accomodate bootstrap margin issues...
            var xOffset =
                this.grid.div.getBoundingClientRect().left -
                this.grid.divCanvas.getBoundingClientRect().left;
            cellBounds.x = cellBounds.x - xOffset;
            dialog.openFrom(cellBounds);

            setTimeout(function() {
                if (filter.onShow) {
                    filter.onShow(self.content);
                }
            }, dialog.getAnimationTime() + 10);
        }
    },

});

module.exports = Filter;
