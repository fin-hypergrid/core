/* eslint-env browser */

'use strict';

var LRUCache = require('lru-cache');

var renderCellError = require('./renderCellError');

/**
 * This module lists the properties that can be set on a {@link Hypergrid} along with their default values.
 * Edit this file to override the defaults.
 * @module defaults
 */

module.exports = {

    //these are for the theme


    /**
     * The font for data cells.
     * @default '13px Tahoma, Geneva, sans-serif'
     * @type {cssFont}
     * @instance
     */
    font: '13px Tahoma, Geneva, sans-serif',

    /**
     * Font color for data cells.
     * @default 'rgb(25, 25, 25)'
     * @type {string}
     * @instance
     */
    color: 'rgb(25, 25, 25)',

    /**
     * Background color for data cells.
     * @default 'rgb(241, 241, 241)'
     * @type {string}
     * @instance
     */
    backgroundColor: 'rgb(241, 241, 241)',

    /**
     * Font color for selected cell(s).
     * @default 'rgb(25, 25, 25)'
     * @type {string}
     * @instance
     */
    foregroundSelectionColor: 'rgb(25, 25, 25)',

    /**
     * Background color for selected cell(s).
     * @default 'rgb(183, 219, 255)'
     * @type {string}
     * @instance
     */
    backgroundSelectionColor: 'rgb(183, 219, 255)',


    /********** SECTION: COLUMN HEADER COLORS **********/

    // IMPORTANT CAVEAT: The code is inconsistent regarding the terminology. Is the "column header" section _the row_ of cells at the top (that act as headers for each column) or is it _the column_ of cells (that act as headers for each row)? Oh my.

    /**
     * @default '12px Tahoma, Geneva, sans-serif'
     * @type {cssFont}
     * @instance
     */
    columnHeaderFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default 'rgb(25, 25, 25)'
     * @type {cssColor}
     * @instance
     */
    columnHeaderColor: 'rgb(25, 25, 25)',

    /**
     * @default 'rgb(223, 227, 232)'
     * @type {cssColor}
     * @instance
     */
    columnHeaderBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default 'rgb(25, 25, 25)'
     * @type {cssColor}
     * @instance
     */
    columnHeaderForegroundSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default 'rgb(255, 220, 97)'
     * @type {cssColor}
     * @instance
     */
    columnHeaderBackgroundSelectionColor: 'rgb(255, 220, 97)',

    /**
     * @default 'rgb(25, 25, 25)'
     * @type {cssColor}
     * @instance
     */
    columnHeaderForegroundColumnSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default 'rgb(255, 180, 0)'
     * @type {cssColor}
     * @instance
     */
    columnHeaderBackgroundColumnSelectionColor: 'rgb(255, 180, 0)',


    /********** SECTION: ROW HEADER COLORS **********/

    /**
     * @default '12px Tahoma, Geneva, sans-serif'
     * @type {cssFont}
     * @instance
     */
    rowHeaderFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default 'rgb(25, 25, 25)'
     * @type {cssColor}
     * @instance
     */
    rowHeaderColor: 'rgb(25, 25, 25)',

    /**
     * @default 'rgb(223, 227, 232)'
     * @type {cssColor}
     * @instance
     */
    rowHeaderBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default 'rgb(25, 25, 25)'
     * @type {cssColor}
     * @instance
     */
    rowHeaderForegroundSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default 'rgb(255, 220, 97)'
     * @type {cssColor}
     * @instance
     */
    rowHeaderBackgroundSelectionColor: 'rgb(255, 220, 97)',

    /**
     * @default 'rgb(25, 25, 25)'
     * @type {cssColor}
     * @instance
     */
    rowHeaderForegroundRowSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default 'rgb(255, 180, 0)'
     * @type {cssColor}
     * @instance
     */
    rowHeaderBackgroundRowSelectionColor: 'rgb(255, 180, 0)',


    /********** SECTION: FILTER ROW COLORS **********/

    /**
     * @default '12px Tahoma, Geneva, sans-serif'
     * @type {cssFont}
     * @instance
     */
    filterFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default 'rgb(25, 25, 25)'
     * @type {cssColor}
     * @instance
     */
    filterColor: 'rgb(25, 25, 25)',

    /**
     * @default 'white'
     * @type {cssColor}
     * @instance
     */
    filterBackgroundColor: 'white',

    /**
     * @default 'rgb(25, 25, 25)'
     * @type {cssColor}
     * @instance
     */
    filterForegroundSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default 'rgb(255, 220, 97)'
     * @type {cssColor}
     * @instance
     */
    filterBackgroundSelectionColor: 'rgb(255, 220, 97)',

    /**
     * @default 'rgba(0,0,0,0.8)'
     * @type {cssColor}
     * @instance
     */
    filterCellBorderStyle: 'rgba(0,0,0,0.8)',

    /**
     * @default 0.4
     * @type {number}
     * @instance
     */
    filterCellBorderThickness: 0.4,


    /********** SECTION: TREE COLUMN COLORS **********/
    // The "tree column" contains the hierarchical drill-down controls.

    /**
     * @default '12px Tahoma, Geneva, sans-serif'
     * @type {cssFont}
     * @instance
     */
    treeColumnFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default 'rgb(25, 25, 25)'
     * @type {cssColor}
     * @instance
     */
    treeColumnColor: 'rgb(25, 25, 25)',

    /**
     * @default 'rgb(223, 227, 232)'
     * @type {cssColor}
     * @instance
     */
    treeColumnBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default 'rgb(25, 25, 25)'
     * @type {cssColor}
     * @instance
     */
    treeColumnForegroundSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default 'rgb(255, 220, 97)'
     * @type {cssColor}
     * @instance
     */
    treeColumnBackgroundSelectionColor: 'rgb(255, 220, 97)',

    /**
     * @default 'rgb(25, 25, 25)'
     * @type {cssColor}
     * @instance
     */
    treeColumnForegroundColumnSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default 'rgb(255, 180, 0)'
     * @type {cssColor}
     * @instance
     */
    treeColumnBackgroundColumnSelectionColor: 'rgb(255, 180, 0)',

    /**
     * @default 'rgb(201, 201, 201)'
     * @type {cssColor}
     * @instance
     */
    backgroundColor2: 'rgb(201, 201, 201)',

    /**
     * @default 0
     * @type {number}
     * @instance
     */
    voffset: 0,

    /**
     * @default 'visible'
     * @type {string}
     * @instance
     */
    scrollbarHoverOver: 'visible',

    /**
     * @default 'hidden'
     * @type {string}
     * @instance
     */
    scrollbarHoverOff: 'hidden',

    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    scrollingEnabled: true,

    /**
     * @default ''
     * @type {string}
     * @instance
     */
    vScrollbarClassPrefix: '',

    /**
     * @default ''
     * @type {string}
     * @instance
     */
    hScrollbarClassPrefix: '',

    //these used to be in the constants element

    /**
     * @default 'center'
     * @type {string}
     * @instance
     */
    fixedRowAlign: 'center',

    /**
     * @default 'center'
     * @type {string}
     * @instance
     */
    fixedColAlign: 'center',

    /**
     * @default 5
     * @type {number}
     * @instance
     */
    cellPadding: 5,

    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    gridLinesH: true,

    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    gridLinesV: true,

    /**
     * @default 'rgb(199, 199 199)'
     * @type {cssColor}
     * @instance
     */
    lineColor: 'rgb(199, 199, 199)',

    /**
     * @default 0.4
     * @type {number}
     * @instance
     */
    lineWidth: 0.4,


    /**
     * @default 15
     * @type {number}
     * @instance
     */
    defaultRowHeight: 15,

    /**
     * @default 100
     * @type {number}
     * @instance
     */
    defaultColumnWidth: 100,

    //for immediate painting, set these values to 0, true respectively

    /**
     * @default 60
     * @type {number}
     * @instance
     */
    repaintIntervalRate: 60,

    /**
     *
     * @instance
     */
    repaintImmediately: false,

    //enable or disable double buffering

    /**
     * @default false
     * @type {boolean}
     * @instance
     */
    useBitBlit: false,


    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    useHiDPI: true,

    /**
     * @default ['alt', 'esc']
     * @type {string}
     * @instance
     */
    editorActivationKeys: ['alt', 'esc'],

    /**
     * @default false
     * @type {boolean}
     * @instance
     */
    readOnly: false,

    // inherited by cell renderers

    /**
     * @default getTextWidth
     * @type {function}
     * @instance
     */
    getTextWidth: getTextWidth,

    /**
     * @default getTextHeight
     * @type {function}
     * @instance
     */
    getTextHeight: getTextHeight,


    /**
     * @default 0
     * @type {number}
     * @instance
     */
    fixedColumnCount: 0,

    /**
     * @default 0
     * @type {number}
     * @instance
     */
    fixedRowCount: 0,

    /**
     * @default 0
     * @type {number}
     * @instance
     */
    headerColumnCount: 0,


    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    showRowNumbers: true,

    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    showTreeColumn: true,

    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    showHeaderRow: true,

    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    showFilterRow: true,


    /** Clicking in a cell "selects" it; it is added to the select region and repainted with "cell selection" colors.
     * @default true
     * @type {boolean}
     * @instance
     */
    cellSelection: true,

    /** Clicking in a row header (leftmost column) "selects" the row; the entire row is added to the select region and repainted with "row selection" colors.
     * @default true
     * @type {boolean}
     * @instance
     */
    columnSelection: true,

    /** Clicking in a column header (top row) "selects" the column; the entire column is added to the select region and repainted with "column selection" colors.
     * @default true
     * @type {boolean}
     * @instance
     */
    rowSelection: true,

    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    singleRowSelectionMode: true,

    /**
     * @default 'rgba(0, 0, 0, 0.2)'
     * @type {cssColor}
     * @instance
     */
    selectionRegionOverlayColor: 'rgba(0, 0, 0, 0.2)',

    /**
     * @default 'black'
     * @type {string}
     * @instance
     */
    selectionRegionOutlineColor: 'black',

    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    columnAutosizing: true,

    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    rowNumberAutosizing: true,

    /**
     * @default false
     * @type {boolean}
     * @instance
     */
    headerTextWrapping: false,

    /**
     * @default false
     * @type {boolean}
     * @instance
     */
    rowResize: false,

    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    editable: true,

    /**
     * @default true
     * @type {boolean}
     * @instance
     */
    editOnDoubleClick: true,

    /**
     * @default renderCellError
     * @type {function}
     */
    renderCellError: renderCellError,

    /**
     * @default false
     * @type {boolean}
     */
    checkboxOnlyRowSelections: false,

    /** Name of a formatters for cell text.
     * @see /src/Formatters.js
     */
    format: 'default',

    /********** HOVER COLORS **********/

    /** On mouse hover, repaint the cell background with `hoverCellColor`.
     * @type {boolean}
     * @default `true`
     */
    hoverCellHighlight: true,

    /** Background color of cell on mouse hover when `hoverCellHighlight`.
     * @type {cssColor}
     * @default `'lightgray'`
     */
    hoverCellColor: 'lightgray',

    /** On mouse hover, repaint the row background with `hoverRowColor` and `hoverRowHeaderColor`.
     * @type {boolean}
     * @default `true`
     */
    hoverRowHighlight: true,

    /** Background color of row on mouse hover when `hoverRowHighlight`.
     * @type {cssColor}
     * @default `'gray'`
     */
    hoverRowColor: 'gray',
    hoverRowHeaderColor: 'lightgray',

    /** On mouse hover, repaint the column background with `hoverColumnColor` and `hoverColumnHeaderColor`.
     * @type {boolean}
     * @default `true`
     */
    hoverColumnHighlight: true,

    /** Background color of column on mouse hover when `hoverColumnHighlight`.
     * @type {cssColor}
     * @default `'gray'`
     */
    hoverColumnColor: 'gray',
    hoverColumnHeaderColor: 'lightgray',

    /** Display cell font with under-score line drawn over it.
     * > Implementation of links right now is not automatic; you must attach a 'fin-click' listener to the hypergrid object, etc.
     * @type {boolean}
     * @default `false`
     */
    link: false,

    /** Display cell font with strike-through line drawn over it.
     * @type {boolean}
     * @default `false`
     */
    strikeThrough: false,

};

/** @typedef {string} cssColor
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
 */
/** @typedef {string} cssFont
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/font
 */

var textWidthCache = new LRUCache(2000);

function getTextWidth(gc, string) {
    if (string === null || string === undefined) {
        return 0;
    }
    string = string + '';
    if (string.length === 0) {
        return 0;
    }
    var key = gc.font + string;
    var width = textWidthCache.get(key);
    if (!width) {
        width = gc.measureText(string).width;
        textWidthCache.set(key, width);
    }
    return width;
}

var fontData = {};

function getTextHeight(font) {
    var result = fontData[font];

    if (!result) {
        result = {};

        var text = document.createElement('span');
        text.textContent = 'Hg';
        text.style.font = font;

        var block = document.createElement('div');
        block.style.display = 'inline-block';
        block.style.width = '1px';
        block.style.height = '0px';

        var div = document.createElement('div');
        div.appendChild(text);
        div.appendChild(block);

        div.style.position = 'absolute';
        document.body.appendChild(div);

        try {

            block.style.verticalAlign = 'baseline';

            var blockRect = block.getBoundingClientRect();
            var textRect = text.getBoundingClientRect();

            result.ascent = blockRect.top - textRect.top;

            block.style.verticalAlign = 'bottom';
            result.height = blockRect.top - textRect.top;

            result.descent = result.height - result.ascent;

        } finally {
            document.body.removeChild(div);
        }
        if (result.height !== 0) {
            fontData[font] = result;
        }
    }

    return result;
}
