/* eslint-env browser */

'use strict';

var ListDragon = require('list-dragon');
var automat = require('automat');

var Dialog = require('./Dialog');
var stylesheets = require('../css/stylesheets.html');

/**
 * @constructor
 */
var ColumnPicker = Dialog.extend('ColumnPicker', {
    /**
     * @param {Hypergrid} grid
     * @param {object} [options] - May include `Dialog` options.
     */
    initialize: function(grid, options) {
        var behavior = this.behavior = grid.behavior;

        if (behavior.isColumnReorderable()) {
            var div = document.createElement('div');
            div.innerHTML = 'Re-ordable columns may not be changed.';
            this.append(div);
        } else {
            // grab the lists from the behavior
            this.selectedGroups = {
                title: 'Groups',
                models: behavior.getGroups()
            };

            this.availableGroups = {
                title: 'Available Groups',
                models: behavior.getAvailableGroups()
            };

            this.hiddenColumns = {
                title: 'Hidden Columns',
                models: behavior.getHiddenColumns()
            };

            this.visibleColumns = {
                title: 'Visible Columns',
                models: behavior.getVisibleColumns()
            };

            // create drag-and-drop sets from the lists
            var listOptions = { cssStylesheetReferenceElement: this.el.lastElementChild },
                listSets = [
                    new ListDragon([
                        this.selectedGroups,
                        this.availableGroups
                    ], listOptions),
                    new ListDragon([
                        this.hiddenColumns,
                        this.visibleColumns
                    ], listOptions)
                ];

            // add the drag-and-drop sets to the dialog
            listSets.forEach(function(listSet) {
                listSet.modelLists.forEach(function(list) {
                    this.append(list.container);
                }.bind(this));
            });

            // parse and add the drag-and-drop stylesheet addendum to the dialog as well
            automat.append(stylesheets['list-dragon'], this.el, this.el.lastElementChild);

            // add the dialog to the DOM
            this.open(options.container);
        }
    },

    onClosed: function() {
        var columns = this.behavior.columns,
            tree = columns[0];

        columns.length = 0;
        if (tree && tree.label === 'Tree') {
            columns.push(tree);
        }
        this.visibleColumns.forEach(function(column) {
            columns.push(column);
        });

        var groupBys = this.selectedGroups.map(function(e) {
            return e.id;
        });
        this.behavior.dataModel.setGroups(groupBys);

        this.behavior.changed();
    }
});


module.exports = ColumnPicker;
