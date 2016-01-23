'use strict';

var FilterTree = require('filter-tree');

/** @typedef {function} fieldsProviderFunc
 * @returns {fieldOption[]} see jsdoc typedef in filter-tree/js/FillerLeaf.js
 */

var validateQuietlyOptions = {
    alert: false,
    focus: false
};

/** @constructor
 */
function CustomFilter() {
    this.getDisplayString = function() { // TODO: What the heck is this? (not in use)
        return '< ' + this.value;
    };

    // Following methods service dialog during which `this.filterTree` is valid
    this.initialize = function(fieldsProvider) {
        /** @type {fieldsProviderFunc}
         */
        this.fieldsProvider = fieldsProvider;
        this.filterTree = new FilterTree({
            fields: fieldsProvider()
        });
        delete this.filter; // forces this.create to recreate the filter function
    };

    this.onShow = function(container) {
        container.appendChild(this.filterTree.el);
    };

    this.onOk = function() {
        return this.filterTree.validate();
    };

    this.getState = function() {
        var state = JSON.parse(JSON.stringify(this.filterTree)); // calls toJSON functions as needed
        delete this.filterTree;
        return state;
    };

    this.onReset = function() {

    };

    this.onDelete = function() {
        delete this.filter;
        delete this.filterTree;
    };

    this.onCancel = function() {
        delete this.filterTree;
    };

    // Following methods called with `state` are independent of dialog; `this.filterTree` is undefined
    this.create = function(state) {
        if (!this.filter) {
            var filterTree = this.setState(state);
            var dataRow = {};
            var fieldOption = this.fieldsProvider()[0],
                fieldName = fieldOption.name || fieldOption;

            if (!filterTree.validate(validateQuietlyOptions)) {
                // `validate()` returned `undefined` meaning valid (returns error string when invalid)
                this.filter = function(data) {
                    dataRow[fieldName] = data;
                    return filterTree.test(dataRow);
                };
            }
        }
        return this.filter;
    };

    this.setState = function(state) {
        return (
            this.filterTree = new FilterTree({
                state: state,
                fields: this.fieldsProvider()
            })
        );
    };
}

module.exports = CustomFilter;
