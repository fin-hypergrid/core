'use strict';

/**
 * Mix into your data model for get/modify/delete access to rows by single- or multi-column ID.
 *
 * These functions are all basically wrappers for the heavily overloaded {@link http://openfin.github.io/hyper-analytics/DataSource.html#findRow|DataSource.prototype.findRow} method.
 *
 * ### Usage
 *
 * ##### Client-side install with `<script>` tag
 * 1. In `<head>...</head>` element, include <u>only one or the other</u> of the following (after including Hypergrid itself):
 * ```html
 * <script src="build/add-ons/row-by-id.js"></script>
 * <script src="build/add-ons/row-by-id.min.js"></script>
 * ```
 * 2. In a `<script>...</script>` element:
 * ```javascript
 * rowById.mixInTo(MyDataModel.prototype);
 * ```
 *
 * ##### Browserify integration with `require()`
 * ```javascript
 * var rowById = require('./add-ons/rowById');
 * ...
 * robById.mixInTo(myGrid.behavior.dataModel);
 * ```
 *
 * ##### Note
 *
 * The above code access methodologies reference two different files:
 * * The built version comes from ./build/add-ons and the API is assigned to `window.fin.Hypergrid.rowById`
 * * The repo version comes from ./add-ons and the API is assigned to `module.exports`
 *
 * ### Examples
 *
 * _Instructions:_ You can try the examples below by going to [row-by-id.html](http://openfin.github.io/fin-hypergrid/row-by-id.html). This page is identical to [example.html](http://openfin.github.io/fin-hypergrid/example.html) _except_ with the addition of the above client-side install and mix-in lines. Then copy & paste each of the following code blocks into Chrome's developer console and hit the return key, observing the changes to the grid as you do so.
 *
 * 1. Set up some variables:
 * ```javascript
 * var behavior = grid.behavior;
 * var dataModel = behavior.dataModel;
 * var findKey = "symbol";
 * var findVal = 'FB';
 * ```
 * 2. Add a new row:
 * ```javascript
 * var newDataRow = {};
 * newDataRow[findKey] = findVal;
 * newDataRow.name = 'Facebook';
 * newDataRow.prevclose = 125.08;
 * dataModel.addRow(newDataRow);
 * // To see the new row you must (eventually) call:
 * behavior.reindex();
 * grid.behaviorChanged();
 * ```
 * 3. Modify an existing row:
 * ```javascript
 * var modKey = 'name';
 * var modVal = 'Facebook, Inc.';
 * var dataRow = dataModel.modifyRowById(findKey, findVal, modKey, modVal);
 * // To see the modified cells you must (eventually) call:
 * behavior.reindex();
 * grid.repaint();
 * ```
 * 4. Delete (remove) a row:
 * ```javascript
 * var oldRow = dataModel.deleteRowById(findKey, findVal);
 * // To see the row disappear you must (eventually) call:
 * behavior.reindex();
 * grid.behaviorChanged();
 * ```
 * 5. Replace an existing row:
 * ```javascript
 * findVal = 'MSFT';
 * var newRow = {symbol: "ABC", name: "Google", prevclose: 666};
 * var oldRow = dataModel.replaceRowById(findKey, findVal, newRow);
 * // To see the row change you must (eventually) call:
 * behavior.reindex();
 * grid.repaint();
 * ```
 * This replaces the row with the new row object, returning but otherwise discarding the old row object. That is, the new row object takes on the ordinal of the old row object. By contrast, modifyDataRow keeps the existing row object, updating it in place.
 *
 * 6. Fetch a row (find the row and return the row object):
 * ```javascript
 * findVal = 'ABC';
 * var dataRow = dataModel.getRowById(findKey, findVal);
 * ```
 * 7. Get a row's index (find the row and return its ordinal) (for use with Hypergrid's various grid coordinate methods):
 * ```javascript
 * var rowIndex = dataModel.getRowIndexById(findKey, findVal);
 * ```
 * 8. Erase (blank) a row:
 * ```javascript
 * var oldRow = dataModel.eraseRowById(findKey, findVal);
 * // To see the row blank you must (eventually) call:
 * grid.behavior.reindex();
 * grid.repaint();
 * ```
 *
 * ### Notes
 *
 * ##### Updating the rendered grid
 *
 * The following calls should be made sparingly as they can be expensive. The good news is that they only need to be called at the very end of a batch grid data changes.
 *    1. Call `grid.behavior.reindex()`. This call does nothing when the data source pipeline is empty. Otherwise, applies each data source transformations (filter, sort) in the pipeline. Needed when adding, deleting, or modifying rows.
 *    2. Call `grid.behaviorChanged()` when the number of rows (or columns) changes as a result of the data alteration.
 *    3. Call `grid.repaint()` when cells are updated in place. Note that `behaviorChanged` calls `repaint` for you so you only need to call one or the other.
 *
 * ##### Search key hash option
 *
 * Search key(s) may be provided in a single hash parameter instead of in two distinct parameters (_à la_ underscore.js)
 *
 * For any of the methods above that take a search key, the first two arguments (`findkey` and `findVal`) may be replaced with a single argument `findHash`, a hash of key:value pairs, optionally followed by a 2nd argument `findList`, a _whitelist_ (an array) of which keys in `findHash` to use. These overloads allow for searching based on multiple columns:
 *
 * ###### Example 1
 * Single-column primary key:
 * ```javascript
 * behavior.getRow({ symbol: 'FB' });
 * ```
 * ###### Example 2
 * Multi-column primary key (target row must match all keys):
 * ```javascript
 * behavior.getRow({ symbol: 'FB', name: 'Facebook' });
 * ```
 * ###### Example 3
 * Limit the column(s) that comprise the primary key with `findList`, an array of allowable search keys:
 * ```javascript
 * var findWhiteList = ['symbol'];
 * behavior.getRow({ symbol: 'FB', name: 'the facebook' }, findKeyList);
 * ```
 * In the above example, name is ignored because it is absent from the key list. This example is therefore functionally equivalent to example 2.a.
 *
 * ##### Modifications hash option
 *
 * Field(s) to modify may be provided in a hash instead (_à la_ jQuery.js)
 *
 * This overload allows for updating multiple columns of a row with a single method call:
 * ```javascript
 * var modHash = { name: 'Facebook, Inc.', prevclose: 125};
 * dataModel.modifyRowById('symbol', 'FB', modHash);
 * ```
 * The above is equivalent to the following separate calls which each update a specific field in the same row:
 * ```javascript
 * dataModel.modifyRowById('symbol', 'FB', 'name', 'Facebook, Inc.');
 * dataModel.modifyRowById('symbol', 'FB', 'prevclose', 125);
 * ```
 * Normally all included fields will be modified. As in `findList` (described above), you can limit which fields to actually modify by providing an additional parameter `modList`, an array of fields to modify. The following example modifies the "prevClose" field but not the "name" field:
 * ```javascript
 * var modWhiteList = ['prevclose'];
 * dataModel.modifyRowById('symbol', 'FB', modHash, modWhiteList);
 * ```
 *
 * ##### Summary
 *
 * The overloads discussed above in _Search key hash option_ and _Modifier hash option_ may be combined. For example, the full list of overloads for {@link rowById.modifyRowById} is:
 *
 * ```javascript
 * behavior.modifyRowById(findKey, findVal, modKey, modVal);
 * behavior.modifyRowById(findKey, findVal, modHash);
 * behavior.modifyRowById(findKey, findVal, modHash, modWhiteList);
 * behavior.modifyRowById(findHash, modKey, modVal);
 * behavior.modifyRowById(findHash, modHash);
 * behavior.modifyRowById(findHash, modHash, modWhiteList);
 * behavior.modifyRowById(findHash, findWhiteList, modKey, modVal);
 * behavior.modifyRowById(findHash, findWhiteList, modHash);
 * behavior.modifyRowById(findHash, findWhiteList, modHash, modWhiteList);
 * ```
 *
 * @mixin
 */
var rowById = {
    /**
     * @summary Remove the ID'd data row object from the data store.
     * @desc If data source pipeline in use, to see the deletion in the grid, you must eventually call:
     * ```javascript
     * this.grid.behavior.reindex();
     * this.grid.behaviorChanged();
     * ```
     * Caveat: The row indexes of all rows following the deleted row will now be one less than they were!
     * @param {object|string} keyOrHash - One of:
     * * _string_ - Column name.
     * * _object_ - Hash of 0 or more key-value pairs to search for.
     * @param {*|string[]} [valOrList] - One of:
     * _omitted_ - When `keyOrHash` is a hash and you want to search all its keys.
     * _string[]_ - When `keyOrHash` is a hash but you only want to search certain keys.
     * _otherwise_ - When `keyOrHash` is a string. Value to search for.
     * @returns {object} The deleted row object.
     */
    deleteRowById: function(keyOrHash, valOrList) {
        return this.source.findRow.apply(this.source, getByIdArgs(keyOrHash, valOrList).concat([null]));
    },

    /**
     * @summary Undefine the ID'd row object in place.
     * @desc Similar to {@link rowById.deleteRowById|deleteRowById} except leave an `undefined` in place of data row object. This renders as a blank row in the grid.
     *
     * If data source pipeline in use, to see the deletion in the grid, you must eventually call:
     * ```javascript
     * this.grid.behavior.reindex();
     * this.grid.behaviorChanged();
     * ```
     * @param {object|string} keyOrHash - One of:
     * * _string_ - Column name.
     * * _object_ - Hash of 0 or more key-value pairs to search for.
     * @param {*|string[]} [valOrList] - One of:
     * _omitted_ - When `keyOrHash` is a hash and you want to search all its keys.
     * _string[]_ - When `keyOrHash` is a hash but you only want to search certain keys.
     * _otherwise_ - When `keyOrHash` is a string. Value to search for.
     * @returns {object} The deleted row object.
     */
    eraseRowById: function(keyOrHash, valOrList) {
        return this.source.findRow.apply(this.source, getByIdArgs(keyOrHash, valOrList).concat([undefined]));
    },

    /**
     * @param {object|string} keyOrHash - One of:
     * * _string_ - Column name.
     * * _object_ - Hash of 0 or more key-value pairs to search for.
     * @param {*|string[]} [valOrList] - One of:
     * _omitted_ - When `keyOrHash` is a hash and you want to search all its keys.
     * _string[]_ - When `keyOrHash` is a hash but you only want to search certain keys.
     * _otherwise_ - When `keyOrHash` is a string. Value to search for.
     * @returns {number}
     */
    getRowIndexById: function(keyOrHash, valOrList) {
        this.source.findRow.apply(this.source, arguments);
        return this.source.getProperty('foundRowIndex');
    },

    /**
     * @param {object|string} keyOrHash - One of:
     * * _string_ - Column name.
     * * _object_ - Hash of 0 or more key-value pairs to search for.
     * @param {*|string[]} [valOrList] - One of:
     * _omitted_ - When `keyOrHash` is a hash and you want to search all its keys.
     * _string[]_ - When `keyOrHash` is a hash but you only want to search certain keys.
     * _otherwise_ - When `keyOrHash` is a string. Value to search for.
     * @returns {object}
     */
    getRowById: function(keyOrHash, valOrList) {
        return this.source.findRow.apply(this.source, arguments);
    },

    /**
     * @summary Update selected columns in existing data row.
     * @desc If data source pipeline in use, to see the deletion in the grid, you must eventually call:
     * ```javascript
     * this.grid.behavior.reindex();
     * this.grid.repaint();
     * ```
     * @param {object|string} findKeyOrHash - One of:
     * * _string_ - Column name.
     * * _object_ - Hash of zero or more key-value pairs to search for.
     * @param {*|string[]} [findValOrList] - One of:
     * _omitted_ - When `findKeyOrHash` is a hash and you want to search all its keys.
     * _string[]_ - When `findKeyOrHash` is a hash but you only want to search certain keys.
     * _otherwise_ - When `findKeyOrHash` is a string. Value to search for.
     * @param {object|string} modKeyOrHash - One of:
     * * _string_ - Column name.
     * * _object_ - Hash of zero or more key-value pairs to modify.
     * @param {*|string[]} [modValOrList] - One of:
     * _omitted_ - When `modKeyOrHash` is a hash and you want to modify all its keys.
     * _string[]_ - When `modKeyOrHash` is a hash but you only want to modify certain keys.
     * _otherwise_ - When `modKeyOrHash` is a string. The modified value.
     * @returns {object} The modified row object.
     */
    modifyRowById: function(findKeyOrHash, findValOrList, modKeyOrHash, modValOrList) {
        var dataRow, keys, columnName;

        if (typeof findKeyOrHash !== 'object' || findValOrList instanceof Array) {
            dataRow = this.source.findRow(findKeyOrHash, findValOrList);
        } else {
            dataRow = this.source.findRow(findKeyOrHash);
            modValOrList = modKeyOrHash; // promote
            modKeyOrHash = findValOrList; // promote
        }

        if (dataRow) {
            if (typeof modKeyOrHash !== 'object') {
                dataRow[modKeyOrHash] = modValOrList;
            } else {
                keys = modValOrList instanceof Array ? modValOrList : Object.keys(modKeyOrHash);
                for (var key in keys) {
                    columnName = keys[key];
                    dataRow[columnName] = modKeyOrHash[columnName];
                }
            }
        }

        return dataRow;
    },

    /**
     * @summary Replace entire ID'd row object with another.
     * @desc The replacement may have (but does not have to have) the same ID as the row object being replaced.
     *
     * If data source pipeline in use, to see the replaced row in the grid, you must eventually call:
     * ```javascript
     * this.grid.behavior.reindex();
     * this.grid.behaviorChanged();
     * ```
     * @param {object|string} keyOrHash - One of:
     * * _string_ - Column name.
     * * _object_ - Hash of zero or more key-value pairs to search for.
     * @param {*|string[]} [valOrList] - One of:
     * _omitted_ - When `keyOrHash` is a hash and you want to search all its keys.
     * _string[]_ - When `keyOrHash` is a hash but you only want to search certain keys.
     * _otherwise_ - When `keyOrHash` is a string. Value to search for.
     * @param {object} replacement
     * @returns {object} The replaced row object.
     */
    replaceRowById: function(keyOrHash, valOrList, replacement) {
        if (typeof keyOrHash === 'object' && !(valOrList instanceof Array)) {
            replacement = valOrList; // promote
        }
        if (typeof replacement !== 'object') {
            throw 'Expected an object for replacement but found ' + typeof replacement + '.';
        }
        return this.source.findRow.apply(this.source, arguments);
    }
};

function getByIdArgs(keyOrHash, valOrList) {
    var length = typeof keyOrHash !== 'object' || valOrList instanceof Array ? 2 : 1;
    return Array.prototype.slice.call(arguments, 0, length);
}

Object.defineProperties(rowById, { // These objects are defined here so they will be non-enumerable to avoid being mixed in.
    /**
     * @name install
     * @summary Installer for plugin.
     * @desc Required by {@link Hypergrid#installPlugins}
     * @function
     * @param {object} target - Your data model instance or its prototype.
     * @memberOf rowById
     */
    install: {
        value: function(grid, target) {
            mixInTo.call(this, target || Object.getPrototypeOf(grid.behavior.dataModel));
        }
    },

    /**
     * @name mixInTo
     * @summary Mix all the other members into the given target object.
     * @desc The target object is intended to be Hypergrid's in-memory data model object ({@link dataModels.JSON}).
     * @function
     * @param {object} target - Your data model instance or its prototype.
     * @memberOf rowById
     */
    mixInTo: {
        value: function(target) {
            console.warn('rowById.mixInTo(target) deprecated as of Hypergrid 1.10.0 in favor of grid.installPlugins([[rowById, target]]) where target defaults to grid\'s dataModel prototype. (Will be removed in a future release.)');
            mixInTo.call(this, target);
        }
    }
});

function mixInTo(target) {
    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(this, key));
        }
    }
}

module.exports = rowById;
