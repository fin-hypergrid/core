'use strict';

exports.stylesheets = [

`/* new.css */
`,

`/* off-the-grid.css - this stylesheet just shows how to move bottom and right scroll bars "off the grid" */

.hypergrid-container > div:first-child {
    right: 17px;
    bottom: 17px;
}
`,

`/* chunky-bars.css - plain rectangular scrollbars positioned off the content */

/* vertical-specific styles */
div.finbar-vertical {
    margin: 0px;
    width: 17px;
    background-color: rgba(237, 237, 237, 1);
    box-shadow: 0 0 0px #000, 0 0 0px #000, 0 0 0px #000;
}
div.finbar-vertical div.thumb {
    margin: 2px 0px 17px 0px;
    width: 11px;
    background-color: rgba(158, 158, 158, 1);
    box-shadow: 0 0 0px #000, 0 0 0px #000, 0 0 0px #000;
    border-radius: 0px;
    border: 1px solid rgba(132, 132, 132, 1);
    right: 3px;
}

/* horizontal-specific styles */
div.finbar-horizontal {
    margin: 0px;
    height: 17px;
    background-color: rgba(237, 237, 237, 1);
    box-shadow: 0 0 0px #000, 0 0 0px #000, 0 0 0px #000;
}
div.finbar-horizontal div.thumb {
    margin: 0px 2px;
    height: 11px;
    background-color: rgba(158, 158, 158, 1);
    box-shadow: 0 0 0px #000, 0 0 0px #000, 0 0 0px #000;
    border-radius: 0px;
    border: 1px solid rgba(132, 132, 132, 1);
    bottom: 3px;
}
`

];
