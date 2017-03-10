'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var CellClick = Feature.extend('CellClick', {

    handleMouseMove: function(grid, event) {
        var link = event.properties.link,
            isActionableLink = link && typeof link !== 'boolean'; // actionable with truthy other than `true`

        this.cursor = isActionableLink ? 'pointer' : null;

        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    },

    /**
     * @param {Hypergrid} grid
     * @param {CellEvent} event - the event details
     * @memberOf CellClick#
     */
    handleClick: function(grid, event) {
        var consumed = (event.isDataCell || event.isTreeColumn) && (
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
     * @desc The URL is found in the cell's {@link module:defaults.link|link} property, which serves two functions:
     * 1. **Renders as a link.** When truthy causes {@link SimpleCell} cell renderer to render the cell underlined with {@link module:defaults.linkColor|linkColor}. (See also {@link module:defaults.linkOnHover|linkOnHover} and {@link module:defaults.linkColorOnHover|linkColorOnHover}.) Therefore, setting this property to `true` will render as a link, although clicking on it will have no effect. This is useful if you wish to handle the click yourself by attaching a `'fin-click'` listener to your hypergrid.
     * 2. **Fetch the URL.** The value of the link property is interpreted as per {@link module:defaults.link|link}.
     * 3. **Decorate the URL.** The cell name (_i.e.,_ the data column name) and cell value are merged into the URL wherever the respective substrings `'%name'` and `'%value'` are found. For example, if the column name is "age" and the cell value is 6 (or a function returning 25), and the link is `'http://www.abc.com?%name=%value'`, then the actual link (first argument given to `grid.windowOpen`) would be `'http://www.abc.com?age=25'`.
     * 4. **Open the URL.** The link is then opened by {@link Hypergrid#windowOpen|grid.windowOpen}. If `link` is an array, it is "applied" to `grid.windowOpen` in its entirety; otherwise, `grid.windowOpen` is called with the link as the first argument and {@link module:defaults.linkTarget|linkTarget} as the second.
     * 5. **Decorate the link.** On successful return from `windowOpen()`, the text is colored as "visited" as per the cell's {@link module:defaults.linkVisitedColor|linkVisitedColor} property (by setting the cell's `linkColor` property to its `linkVisitedColor` property).

     * @param {Hypergrid} grid
     * @param {CellEvent} cellEvent - Event details.
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
        var result, url,
            dataRow = cellEvent.dataRow,
            config = Object.create(cellEvent.properties, { dataRow: { value: dataRow } }),
            value = config.exec(cellEvent.value),
            linkProp = cellEvent.properties.link,
            isArray = linkProp instanceof Array,
            link = isArray ? linkProp[0] : linkProp;

        // STEP 2: Fetch the URL
        switch (typeof link) {
            case 'string':
                if (link === '*') {
                    url = value;
                } else if (/^\w+$/.test(link)) {
                    url = dataRow[link];
                }
                break;

            case 'function':
                url = link(cellEvent);
                break;
        }

        if (url) {
            // STEP 3: Decorate the URL
            url = url.toString().replace(/%name/g, config.name).replace(/%value/g, value);

            // STEP 4: Open the URL
            if (isArray) {
                linkProp = linkProp.slice();
                linkProp[0] = url;
                result = grid.windowOpen.apply(grid, linkProp);
            } else {
                result = grid.windowOpen(url, cellEvent.properties.linkTarget);
            }
        }

        // STEP 5: Decorate the link as "visited"
        if (result) {
            cellEvent.setCellProperty('linkColor', grid.properties.linkVisitedColor);
            grid.renderer.resetCellPropertiesCache(cellEvent);
            grid.repaint();
        }

        return result;
    }

});

module.exports = CellClick;
