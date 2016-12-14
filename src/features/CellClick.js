'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var CellClick = Feature.extend('CellClick', {

    handleMouseMove: function(grid, event) {
        var link = event.properties.link,
            isLink = link && typeof link === 'string' || link instanceof Array;

        this.cursor = isLink ? 'pointer' : null;
    },

    /**
     * @param {Hypergrid} grid
     * @param {CellEvent} event - the event details
     * @memberOf CellClick#
     */
    handleClick: function(grid, event) {
        var consumed = event.isDataCell && (
            this.openLink(grid, event) !== undefined ||
            grid.cellClicked(event)
        );

        if (!consumed && this.next) {
            this.next.handleClick(grid, event);
        }
    },

    /**
     * @summary Open the cell's URL.
     *
     * @desc The URL is found in the cell's `link` property, which serves two functions:
     * 1. **Renders as a link.** When truthy causes {@link SimpleCell} cell renderer to render the cell underlined with {@link module:defaults.linkColor|linkColor}. (See also {@link module:defaults.linkOnHover|linkOnHover} and {@link module:defaults.linkColorOnHover|linkColorOnHover}.) Therefore, setting this property to `true` will render as a link, although clicking on it will have no effect. This may be useful if you wish to handle the click yourself by attaching a `'fin-click'` listener to your hypergrid.
     * 2. **Opens the link.** When a string or an array with at least one element, {@link Hypergrid#windowOpen|grid.windowOpen} is called to display it:
     *    1. The value is executed when it is a function (or it has a `calculator` property that is function).
     *    2. The cell name (_i.e.,_ the data column name) and cell value are merged into the URL wherever the respective substrings `'%name'` and `'%value'` are found. For example, if the column name is "age" and the cell value is 6 (or a function returning 6), and the link is `'http://www.abc.com?%name=%value'`, then the actual link (first argument given to `grid.windowOpen`) would be `'http://www.abc.com?age=6'`.
     *    3. If `link` is an array, it is "applied" to `grid.windowOpen` in its entirety; otherwise, `grid.windowOpen` is called with the link as the first argument and {@link module:defaults.linkTarget|linkTarget} as the second.

     * @param {Hypergrid} grid
     * @param {CellEvent} event - the event details
     *
     * @returns {boolean|window|null|undefined} One of:
     *
     * | Value | Meaning |
     * | :---- | :------ |
     * | `undefined` | no link to open |
     * | `null` | `grid.windowOpen` failed to open a window |
     * | _otherwise_ | A `window` reference returned by a successful call to `grid.windowOpen`. |
     *
     * @memberOf CellClick#
     */
    openLink: function(grid, cellEvent) {
        var result,
            link = cellEvent.properties.link;

        if (typeof link === 'string') {
            if (link) {
                result = grid.windowOpen(dressLink(link), cellEvent.properties.linkTarget);
            }
        } else if (link instanceof Array) {
            if (link.length) {
                link = link.slice();
                link[0] = dressLink(link[0]);
                result = grid.windowOpen.apply(grid, link);
            } else {
                result = null;
            }
        }

        if (result) {
            cellEvent.setCellProperty('linkColor', grid.properties.linkVisitedColor);
        }

        function dressLink(link) {
            var dataRowDescriptor = { value: cellEvent.dataRow },
                descriptors = { dataRow: dataRowDescriptor },
                config = Object.create(cellEvent.properties, descriptors),
                value = config.exec.call(config, cellEvent.value);

            return link.replace(/%name/g, config.name).replace(/%value/g, value);
        }

        return result;
    }

});

module.exports = CellClick;
