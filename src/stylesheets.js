/* eslint-env browser */

'use strict';

/**
 *
 * @param {string} name - Name of stylesheet to insert
 * @param {boolean} [insert=false] - Insert at beginning of `<head>...</head>` element rather than end.
 */

function add(name, insert) {
    var sheet = styleSheets[name];
    if (sheet) {
        delete styleSheets[name];

        var elt = document.createElement('style'),
            head = document.head || document.getElementsByTagName('head')[0];

        elt.type = 'text/css';
        elt.id = 'injected-stylesheet-' + name;

        sheet = sheet.join('\n');

        if (elt.styleSheet) {
            elt.styleSheet.cssText = sheet;
        } else {
            elt.appendChild(document.createTextNode(sheet));
        }

        if (insert) {
            head.insertBefore(elt, head.firstElementChild);
        } else {
            head.appendChild(elt);
        }
    }
}

var styleSheets = {
    grid: [
        'div#grid-container {',
        '    position: relative;',
        '    display: inline-block;',
        '    -webkit-user-select: none;',
        '    -moz-user-select: none;',
        '    -ms-user-select: none;',
        '    -o-user-select: none;',
        '    user-select: none;',
        '    overflow: hidden; }',
        'visible { opacity: 0.75; }',
        'hidden { opacity: 0.0; }',
        'editor {',
        '    position: absolute;',
        '    display: none;',
        '    border: solid 2px black;',
        '    outline: 0;',
        '    padding: 0;',
        '    z-index: 1000; }'
    ],
    dnd: [
        'div.dragon-list, li.dragon-pop {',
        '    font-family: Roboto, sans-serif;',
        '    text-transform: capitalize; }',
        'div.dragon-list {',
        '    position: absolute;',
        '    top: 4%;',
        '    left: 4%;',
        '    height: 92%;',
        '    width: 20%; }',
        'div.dragon-list:nth-child(2) { left: 28%; }',
        'div.dragon-list:nth-child(3) { left: 52%; }',
        'div.dragon-list:nth-child(4) { left: 76%; }',
        'div.dragon-list > div, div.dragon-list > ul > li, li.dragon-pop { line-height: 46px; }',
        'div.dragon-list > ul { top: 46px; }',
        'div.dragon-list > ul > li:not(:last-child)::before, li.dragon-pop::before {',
        '    content: \'\\2b24\';', // BLACK LARGE CIRCLE
        '    color: #b6b6b6;',
        '    font-size: 30px;',
        '    margin: 8px 14px 8px 8px; }',
        'li.dragon-pop { opacity:.8; }'
    ],
    finbars: [
        'div.finbar-horizontal, div.finbar-vertical {',
        'z-index: 5;',
        '   background-color: rgba(255, 255, 255, 0.5);',
        '   box-shadow: 0 0 3px #000, 0 0 3px #000, 0 0 3px #000; }',
        'div.finbar-horizontal>.thumb, div.finbar-vertical>.thumb {',
        'opacity: .85;',
        'box-shadow: 0 0 3px #000, 0 0 3px #000, 0 0 3px #000; }'
    ]
};

module.exports = add;
