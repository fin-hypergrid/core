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
        style.textAlign = 'center';

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
        this.ok.style.borderRadius = '2px';

        this.cancel = document.createElement('button');
        this.cancel.style.marginLeft = '5px';
        this.cancel.style.borderRadius = '2px';

        this.clear = document.createElement('button');
        this.clear.style.marginLeft = '5px';
        this.clear.style.borderRadius = '2px';

        this.ok.innerHTML = 'ok';
        this.cancel.innerHTML = 'cancel';
        this.clear.innerHTML = 'clear';

        this.buttons.appendChild(this.ok);
        this.buttons.appendChild(this.cancel);
        this.buttons.appendChild(this.clear);

        var self = this;
        this.ok.onclick = function() {
            self.okPressed();
        };
        this.cancel.onclick = function() {
            self.cancelPressed();
        };
        this.clear.onclick = function() {
            self.clearPressed();
        };
    },

    okPressed: function() {
        var dialog = this.getGrid().dialog;
        dialog.onOkPressed();
    },

    cancelPressed: function() {
        var dialog = this.getGrid().dialog;
        dialog.onCancelPressed();
    },

    clearPressed: function() {
        var dialog = this.getGrid().dialog;
        dialog.onClearPressed();
    },

    beginEditAt: function(editorPoint) {
        var grid = this.getGrid();
        var behavior = grid.getBehavior();
        var dialog = grid.dialog;
        var title = behavior.getColumnId(editorPoint.x);
        this.title.innerHTML = 'filter for \'' + title + '\' column';
        var filter = grid.getFilterFor(editorPoint.x);
        //var self = this;
        if (dialog.isOpen()) {
            dialog.close();
        } else {
            dialog.clear();
            dialog.overlay.appendChild(this.dialog);
            this.template = filter.template + '';
            var html = this.getHTML();
            this.content.innerHTML = html;

            dialog.onOkPressed = function() {
                filter.onOk(dialog);
                behavior.setComplexFilter(editorPoint.x, {
                    type: filter.alias,
                    state: filter.getState()
                });
                dialog.close();
                behavior.applyFilters();
                behavior.changed();
            };

            dialog.onCancelPressed = function() {
                if (filter.onCancel) {
                    filter.onCancel(dialog);
                }
                dialog.close();
                filter = undefined;
            };

            dialog.onClearPressed = function() {
                if (filter.onClear) {
                    filter.onClear(dialog);
                }
                behavior.setComplexFilter(editorPoint.x, undefined);
                dialog.close();
                behavior.applyFilters();
                behavior.changed();
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
                    filter.onShow(dialog);

                }
            }, dialog.getAnimationTime() + 10);
        }
    },

});

module.exports = Filter;
