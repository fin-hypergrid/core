/* eslint-env browser */

'use strict';

var popMenu = require('pop-menu');
var Conditionals = require('filter-tree').Conditionals;

var ComboBox = require('./ComboBox');
var prototype = require('./CellEditor').prototype;


/**
 * The select list consists of the following sets of drop-down items:
 * * `operators` (icon *&lt;*) The particular selection of operators for this column. Comes from the filter tree.
 * * `distinctValues` (icon *#*) List of distinct column values. Calculated from inspection of column values on _and_ on icon click.
 * * `columnNames` (icon *T*) List other column names. Calculated from inspection of column values on _and_ on icon click.
 *
 * The control area reflects the `this.modes` array (above). It is modeled by a 'menuModes` object, a hash with boolean properties representing the state of each of the sets of menu items outlined above. Missing properties are falsy by implication. The state semantics are:
 *   * `1` or `true` means adds CSS class `active` to icon _and_ shows set's items in drop-down.
 *   * `0` or `false` means removes (CSS class `active` from icon _and_ hides set's items in drop-down.
 *
 * *Persisting changes:* The only change this UI supports (besides the filter text itself) is the menu mode states, which are expected to be "sticky." That is, they are "persisted" (written back) to the filter. However, there is a problem: When the column filter is blank it doesn't actually exist yet in the filter, so there is nowhere to save it. The solution is to read the `menuModes` hash _from_ the filter tree but don't modify it until end of editing. Reading it from the filter tree picks up previous setting if there was an extant column filter or the default if there was not. But then, rather than modifying this structure (because it might be the default and we don't want to overwrite that), we hang a proxy copy off the behavior's column object for this column. This will persist it for the duration of the app session. At end of editing, if and only if there is now a column filter (text is not blank), we copy it to the column filter's subtree node in the filter tree.
 *
 * @constructor
 */
var FilterBox = ComboBox.extend('FilterBox', {

    beginEditAt: function(point) {

        // look in the filter, under column filters, for a column filter for this column
        var filter = this.grid.getGlobalFilter(),
            column = this.column = this.grid.behavior.columns[point.x],
            columnName = column.getField(),
            columnFilters = this.grid.getGlobalFilter().columnFilters,
            columnFilterSubtree = filter.getColumnFilter(columnName),
            columnSchema = filter.schema.lookup(columnName);


        this.opMenu = // get the operator list from the node, schema, typeOpMap, or root:

            columnFilterSubtree && columnFilterSubtree.opMenu || // first try column filter node's `operator` list, if any

            columnSchema && ( // ELSE as column filter may not yet exist, try it's schema for `opMenu` or `type`
                columnSchema.opMenu || // pull operator list from column schema if it has one; IF it doesn't...
                columnSchema.type &&  // BUT it has a type...
                filter.typeOpMap && // AND the filter has a defined type-operator map...
                filter.typeOpMap[columnSchema.type] // THEN use the operator list for the column's type if there is one
            ) ||

            filter.opMenu; // ELSE try the default operator list (which itself defaults to `Conditionals.defaultOpMenu`)


        this.menuModesSource = // get the column filter's `menuModes` object -- contains the states of the drop-down option icons:

            column.menuModes || // first try proxy from last time (because editing may have ended without a column filter to put in the filter tree)

            columnFilterSubtree && columnFilterSubtree.menuModes || // ELSE try column filter's `menuModes` WHEN available

            columnSchema && columnSchema.menuModes || // try use column schema's `menuModes` when defined

            columnFilters.menuModes; // ELSE try the filter default (which itself defaults to operators ON, others OFF; see definition at top of DefaultFilter.js)


        prototype.beginEditAt.call(this, point);
    },


    /**
     * When there's only one mode defined here, the control area portion of the UI is hidden.
     */
    modes: [
        {
            name: 'operators',
            symbol: '<',
            appendOptions: function(dropdown) {
                if (!dropdown.length) {
                    // Various  operator options and/or optgroups vary per column based on `opMenu`.
                    popMenu.build(dropdown, this.opMenu, {
                        group: function(groupName) {
                            return Conditionals.groups[groupName];
                        },
                        prompt: null
                    });
                    // This list of conjunctions is an extra and is for all columns. All operator optgroups are classless.
                    var optgroup = document.createElement('optgroup');
                    optgroup.label = 'Conjunctions';
                    optgroup.appendChild(new Option('and', ' and '));
                    optgroup.appendChild(new Option('or', ' or '));
                    optgroup.appendChild(new Option('nor', ' nor '));
                }
            }
        }, {
            name: 'columnNames',
            label: 'Column Names',
            selector: 'optgroup.submenu-columnNames',
            symbol: 'A',
            backgroundColor: '#eff',
            appendOptions: function(optgroup) {
                var columns = this.grid.behavior.columns,
                    x = this.editorPoint.x;

                while (optgroup.firstElementChild) {
                    optgroup.firstElementChild.remove();
                }

                columns.forEach(function(column, index) {
                    if (index !== x) {
                        var name = column.getField(),
                            option = new Option(name);
                        option.title = '[' + name + ']\r"' + column.getHeader() + '"';
                        optgroup.appendChild(option);
                    }
                });
                return columns.length;
            }
        }, {
            name: 'distinctValues',
            label: 'Distinct Values',
            selector: 'optgroup.submenu-distinctValues',
            symbol: '#',
            backgroundColor: '#fef',
            appendOptions: ComboBox.prototype.modes[0].appendOptions
        }
    ],

    /**
     * Write the `menuModes` proxy to the filter tree's column filter subtree node.
     * We look up the node again here because it might be new; or may have been deleted & recreated during editing.
     */
    hideEditor: function() {
        // look in the filter, under column filters, for a column filter for this column
        var filter = this.grid.getGlobalFilter(),
            columnName = this.column.getField(),
            columnFilterSubtree = filter.getColumnFilter(columnName);

        if (columnFilterSubtree) {
            // write back to filter-tree node for persisting with getState
            columnFilterSubtree.menuModes = this.menuModes;
        }

        this.column.menuModes = this.menuModes;

        ComboBox.prototype.hideEditor.call(this);
    },

    keyup: function(e) {
        if (e) {
            prototype.keyup.call(this, e);

            if (this.grid.resolveProperty('filteringMode') === 'immediate') {
                this.saveEditorValue(this.getEditorValue());
                this.moveEditor();
            }
        }
    },

    insertText: function(e) {
        // insert the drop-downb text at the insertion point or over the selected text
        this.input.focus();
        this.input.setRangeText(this.dropdown.value, this.selectionStart, this.selectionEnd, 'end');

        // close the drop-down
        this.toggleDropDown();
    }

});


module.exports = FilterBox;
