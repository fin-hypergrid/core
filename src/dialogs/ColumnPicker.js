/* eslint-env browser */

'use strict';

var ListDragon = require('list-dragon');

var Dialog = require('./Dialog');
var css = require('../css');

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

            // parse & add the drag-and-drop stylesheet addendum
            var stylesheetAddendum = css.inject('list-dragon-addendum');

            // create drag-and-drop sets from the lists
            var listOptions = {
                // add the list-dragon-base stylesheet right before the addendum
                cssStylesheetReferenceElement: stylesheetAddendum
            },
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
            var self = this;
            listSets.forEach(function(listSet) {
                listSet.modelLists.forEach(function(list) {
                    self.append(list.container);
                });
            });
            //Listen to the visible column changes
            listSets[1].modelLists[1].element.addEventListener('listchanged', function(e){
                grid.fireSyntheticOnColumnsChangedEvent();
            });

            this.sortOnHiddenColumns = this.grid.resolveProperty('sortOnHiddenColumns');
        } else {
            var div = document.createElement('div');
            div.style.textAlign = 'center';
            div.style.marginTop = '2em';
            div.innerHTML = 'The selection of visible columns in the grid may not be changed.';
            this.append(div);
        }

        // add the dialog to the DOM
        this.open(options.container);
    },

    onClosed: function() {
        if (this.visibleColumns) {
            var columns = this.behavior.columns,
                tree = columns[0];
            //breaking encapsulation
            //Should be using setters and getters on the behavior
            columns.length = 0;
            if (tree && tree.label === 'Tree') {
                columns.push(tree);
            }
            this.visibleColumns.models.forEach(function(column) {
                columns.push(column);
            });
            var groupBys = this.selectedGroups.models.map(function(e) {
                return e.id;
            });
            this.behavior.dataModel.setGroups(groupBys);

            this.behavior.changed();
            if (!this.sortOnHiddenColumns) {
                this.behavior.sortChanged(this.hiddenColumns.models);
            }
        }
    }
});


module.exports = ColumnPicker;
