/* eslint-env browser */

'use strict';

var ListDragon = require('list-dragon');

var Dialog = require('./Dialog');
var stylesheet = require('../lib/stylesheet');

/**
 * @constructor
 * @extends Dialog
 */
var ColumnPicker = Dialog.extend('ColumnPicker', {
    /**
     * @param {Hypergrid} grid
     * @param {object} [options] - May include `Dialog` options.
     */
    initialize: function(grid, options) {
        var behavior = grid.behavior;

        this.grid = grid;

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

            this.inactiveColumns = {
                title: 'Inactive Columns',
                models: behavior.getHiddenColumns().sort(compareByName)
            };

            this.activeColumns = {
                title: 'Active Columns',
                models: behavior.getActiveColumns()
            };

            this.sortOnHiddenColumns = this.wasSortOnHiddenColumns = grid.resolveProperty('sortOnHiddenColumns');

            // parse & add the drag-and-drop stylesheet addendum
            var stylesheetAddendum = stylesheet.inject('list-dragon-addendum');

            // create drag-and-drop sets from the lists
            var listSets = [
                new ListDragon([
                    this.selectedGroups,
                    this.availableGroups
                ], {
                    // add the list-dragon-base stylesheet right before the addendum
                    cssStylesheetReferenceElement: stylesheetAddendum
                }),
                new ListDragon([
                    this.inactiveColumns,
                    this.activeColumns
                ], {
                    // these models have a header property as their labels
                    label: '{header}'
                })
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

        // Add checkbox to control panel for sorting on hidden fields
        var label = document.createElement('label');
        label.innerHTML = '<input type="checkbox"> Allow sorting on hidden columns';
        label.style.fontWeight = 'normal';
        label.style.marginRight = '2em';

        var checkbox = label.querySelector('input');
        checkbox.checked = this.sortOnHiddenColumns;
        checkbox.addEventListener('click', function(e){
            self.sortOnHiddenColumns = checkbox.checked;
            e.stopPropagation();
        });

        var panel = this.el.querySelector('.hypergrid-dialog-control-panel');
        panel.insertBefore(label, panel.firstChild);

        // add the dialog to the DOM
        this.open(options.container);
    },

    onClosed: function() {
        if (this.activeColumns) {
            var behavior = this.grid.behavior,
                columns = behavior.columns,
                tree = columns[0];

            // TODO: breaking encapsulation; should be using setters and getters on the behavior
            columns.length = 0;
            if (tree && tree.label === 'Tree') {
                columns.push(tree);
            }
            this.activeColumns.models.forEach(function(column) {
                columns.push(column);
            });
            var groupBys = this.selectedGroups.models.map(function(e) {
                return e.id;
            });
            behavior.dataModel.setRelation(groupBys);

            if (this.sortOnHiddenColumns !== this.wasSortOnHiddenColumns) {
                this.grid.addProperties({ sortOnHiddenColumns: this.sortOnHiddenColumns });
                behavior.sortChanged(this.inactiveColumns.models);
            }

            behavior.changed();
        }
    }
});

function compareByName(a, b) {
    a = a.header.toString().toUpperCase();
    b = b.header.toString().toUpperCase();
    return a < b ? -1 : a > b ? +1 : 0;
}


module.exports = ColumnPicker;
