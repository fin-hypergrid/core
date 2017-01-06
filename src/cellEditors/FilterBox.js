/* eslint-env browser */

'use strict';

var popMenu = require('pop-menu');

var ComboBox = require('./ComboBox');
var CellEditor = require('./CellEditor');


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
 * @extends ComboBox
 */
var FilterBox = ComboBox.extend('FilterBox', {

    initialize: function() {

        // look in the filter, under column filters, for a column filter for this column
        var root = this.grid.behavior.filter,
            columnFilters = root && root.columnFilters;

        if (!columnFilters) {
            throw 'Column filters not available.';
        }

        var columnName = this.column.name,
            columnFilterSubtree = root.getColumnFilter(columnName) || {},
            columnSchema = root.schema.lookup(columnName) || {};


        // get the operator list from the node, schema, typeOpMap, or root:
        // (This mimics the code in FilterLeaf.js's `getOpMenu` function because the node may not exist yet.)
        this.opMenu =

            // pull operator list from column schema if available
            columnSchema.opMenu ||

            // operator list for the column's type if available
            root.typeOpMap && root.typeOpMap[columnSchema.type || columnFilterSubtree.type] ||

            // default operator list (which itself defaults to `Conditionals.defaultOpMenu`)
            root.opMenu;


        // get the column filter's `menuModes` object -- contains the states of the drop-down option icons:
        this.menuModesSource =

            // first try proxy from last time (because editing may have ended without a column filter to put in the filter tree)
            this.column.menuModes ||

            // ELSE try column filter's `menuModes` WHEN available
            columnFilterSubtree.menuModes ||

            // try use column schema's `menuModes` when defined
            columnSchema.menuModes ||

            // ELSE try the filter default (which itself defaults to operators ON, others OFF; see definition at top of DefaultFilter.js)
            columnFilters.menuModes;

    },

    abortEditing: CellEditor.prototype.cancelEditing,

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
                    var opMenuGroups = this.grid.behavior.filter.opMenuGroups;
                    popMenu.build(dropdown, this.opMenu, {
                        group: function(groupName) {
                            return opMenuGroups[groupName];
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
            tooltip: '(Hold down alt/option key while clicking to include hidden column names.)',
            symbol: 'A',
            backgroundColor: '#eff',
            appendOptions: function(optgroup) {
                var columns = window.event.altKey ? this.grid.behavior.allColumns : this.grid.behavior.columns,
                    x = this.event.gridCell.x;

                while (optgroup.firstElementChild) {
                    optgroup.firstElementChild.remove();
                }

                columns.forEach(function(column, index) {
                    if (index !== x) {
                        var name = column.name,
                            option = new Option(name);
                        option.title = '[' + name + ']\r"' + column.header + '"';
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
        var filter = this.grid.behavior.filter,
            columnName = this.column.name,
            columnFilterSubtree = filter.getColumnFilter(columnName);

        if (columnFilterSubtree) {
            // write back to filter-tree node for persisting with getState
            columnFilterSubtree.menuModes = this.menuModes;
        }

        this.column.menuModes = this.menuModes;

        ComboBox.prototype.hideEditor.call(this);
    },

    keyup: function(event) {
        if (
            !CellEditor.prototype.keyup.call(this, event, true) &&
            this.grid.properties.filteringMode === 'immediate'
        ) {
            this.saveEditorValue(this.getEditorValue());
        }
    },

    insertText: function(e) {
        var start = this.selectionStart,
            end = this.selectionEnd,
            dropdown = this.dropdown,
            operator = dropdown.value,
            option = dropdown.options[dropdown.selectedIndex],
            optgroup = option.parentElement,
            isOperator = !(optgroup.tagName === 'OPTGROUP' && optgroup.className);

        this.input.focus();

        if (start === end && isOperator) {
            var parser = this.grid.behavior.filter.parserCQL,
                cql = this.input.value,
                position = parser.getOperatorPosition(cql, this.selectionStart, operator);

            start = position.start;
            end = position.end;

            // prepend space to operator as needed
            if (
                start > 0 && // not at very beginning? and...
                !/\s/.test(cql[start - 1]) // no white space before operator?
            ) {
                operator = ' ' + operator;
            }

            // append space to operator as needed
            if (
                end === cql.length || // at very end? or...
                !/\s/.test(cql[end]) // no white space after operator?
            ) {
                operator += ' ';
            }
        }

        // insert the drop-down text at the insertion point or over the selected text
        this.input.setRangeText(operator, start, end, 'end');

        // close the drop-down
        this.toggleDropDown();
    },

    saveEditorValue: function(value) {
        CellEditor.prototype.saveEditorValue.call(this, value);
        this.grid.behavior.reindex();
    },

    stopEditing: function(feedbackCount) {
        var result = CellEditor.prototype.stopEditing.call(this, feedbackCount);

        if (result) {
            this.grid.clearSelections();
        }

        return result;
    }

});

module.exports = FilterBox;
