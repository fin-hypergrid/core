/* eslint-env browser */

'use strict';

var LRUCache = require('lru-cache');


/**
 * This module lists the properties that can be set on a {@link Hypergrid} along with their default values.
 * Edit this file to override the defaults.
 * @module defaults
 */

module.exports = {

    /**
     * The font for data cells.
     * @default
     * @type {string}
     * @instance
     */
    noDataMessage: '',


    /**
     * The font for data cells.
     * @default
     * @type {cssFont}
     * @instance
     */
    font: '13px Tahoma, Geneva, sans-serif',

    /**
     * Font color for data cells.
     * @default
     * @type {string}
     * @instance
     */
    color: 'rgb(25, 25, 25)',

    /**
     * Background color for data cells.
     * @default
     * @type {string}
     * @instance
     */
    backgroundColor: 'rgb(241, 241, 241)',

    /**
     * Font style for selected cell(s).
     * @default
     * @type {string}
     * @instance
     */
    foregroundSelectionFont: 'bold 13px Tahoma, Geneva, sans-serif',

    /**
     * Font color for selected cell(s).
     * @default
     * @type {string}
     * @instance
     */
    foregroundSelectionColor: 'rgb(0, 0, 128)',
    /**
     * @default
     * @type {boolean}
     * @instance
     */
    sortOnHiddenColumns: true,
    /**
     * Background color for selected cell(s).
     * @default
     * @type {string}
     * @instance
     */
    backgroundSelectionColor: 'rgba(147, 185, 255, 0.625)',


    /********** SECTION: COLUMN HEADER COLORS **********/

    // IMPORTANT CAVEAT: The code is inconsistent regarding the terminology. Is the "column header" section _the row_ of cells at the top (that act as headers for each column) or is it _the column_ of cells (that act as headers for each row)? Oh my.

    /**
     * @default
     * @type {cssFont}
     * @instance
     */
    columnHeaderFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    columnHeaderColor: 'rgb(25, 25, 25)',

    /**
     * Font style for selected columns' headers.
     * @default
     * @type {string}
     * @instance
     */
    columnHeaderForegroundSelectionFont: 'bold 12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    columnHeaderBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    columnHeaderForegroundSelectionColor: 'rgb(80, 80, 80)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    columnHeaderBackgroundSelectionColor: 'rgba(255, 220, 97, 0.45)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    columnHeaderForegroundColumnSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    columnHeaderBackgroundColumnSelectionColor: 'rgb(255, 180, 0)',

    /**
     * @default
     * @type {string}
     * @instance
     */
    columnHeaderHalign: 'center',


    /********** SECTION: ROW HEADER COLORS **********/

    /**
     * @default
     * @type {cssFont}
     * @instance
     */
    rowHeaderFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    rowHeaderColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    rowHeaderBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    rowHeaderForegroundSelectionColor: 'rgb(80, 80, 80)',

    /**
     * Font style for selected rows' headers.
     * @default
     * @type {string}
     * @instance
     */
    rowHeaderForegroundSelectionFont: 'bold 12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    rowHeaderBackgroundSelectionColor: 'rgba(255, 220, 97, 0.45)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    rowHeaderForegroundRowSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    rowHeaderBackgroundRowSelectionColor: 'rgb(255, 180, 0)',


    /********** SECTION: FILTER ROW COLORS **********/

    /**
     * @default
     * @type {cssFont}
     * @instance
     */
    filterFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    filterColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    filterBackgroundColor: 'white',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    filterForegroundSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    filterBackgroundSelectionColor: 'rgb(255, 220, 97)',

    /**
     * @default
     * @type {string}
     * @instance
     */
    filterHalign: 'center',


    /********** SECTION: TREE COLUMN COLORS **********/
    // The "tree column" contains the hierarchical drill-down controls.

    /**
     * @default
     * @type {cssFont}
     * @instance
     */
    treeColumnFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    treeColumnColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    treeColumnBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    treeColumnForegroundSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    treeColumnBackgroundSelectionColor: 'rgba(255, 220, 97, 0.45)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    treeColumnForegroundColumnSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    treeColumnBackgroundColumnSelectionColor: 'rgb(255, 180, 0)',

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    backgroundColor2: 'rgb(201, 201, 201)',

    /**
     * @default
     * @type {number}
     * @instance
     */
    voffset: 0,

    /**
     * @default
     * @type {string}
     * @instance
     */
    scrollbarHoverOver: 'visible',

    /**
     * @default
     * @type {string}
     * @instance
     */
    scrollbarHoverOff: 'hidden',

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    scrollingEnabled: true,

    /**
     * @default
     * @type {string}
     * @instance
     */
    vScrollbarClassPrefix: '',

    /**
     * @default
     * @type {string}
     * @instance
     */
    hScrollbarClassPrefix: '',

    //these used to be in the constants element

    /**
     * @default
     * @type {string}
     * @instance
     */
    fixedRowAlign: 'center',

    /**
     * @default
     * @type {string}
     * @instance
     */
    fixedColAlign: 'center',
    /**
     * @default
     * @type {string}
     * @instance
     */
    halign: 'center',

    /**
     * @default
     * @type {number}
     * @instance
     */
    cellPadding: 5,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    gridLinesH: true,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    gridLinesV: true,
    /**
     * @default
     * @type {boolean}
     * @instance
     */
    gridLinesVOverflow: false,

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    lineColor: 'rgb(199, 199, 199)',

    /**
     * @default
     * @type {number}
     * @instance
     */
    lineWidth: 1,


    /**
     * @default
     * @type {number}
     * @instance
     */
    defaultRowHeight: 15,

    /**
     * @default
     * @type {number}
     * @instance
     */
    defaultColumnWidth: 100,

    //for immediate painting, set these values to 0, true respectively

    /**
     * @default
     * @type {number}
     * @instance
     */
    repaintIntervalRate: 60,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    repaintImmediately: false,

    //enable or disable double buffering

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    useBitBlit: false,


    /**
     * @default
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
     * @default
     * @type {boolean}
     * @instance
     */
    readOnly: false,

    // inherited by cell renderers

    /**
     * @default `getTextWidth`
     * @type {function}
     * @instance
     */
    getTextWidth: getTextWidth,

    /**
     * @default `getTextHeight`
     * @type {function}
     * @instance
     */
    getTextHeight: getTextHeight,


    /**
     * @default
     * @type {number}
     * @instance
     */
    fixedColumnCount: 0,

    /**
     * @default
     * @type {number}
     * @instance
     */
    fixedRowCount: 0,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    showRowNumbers: true,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    showTreeColumn: true,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    showHeaderRow: true,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    showFilterRow: false,


    /** Clicking in a cell "selects" it; it is added to the select region and repainted with "cell selection" colors.
     * @default
     * @type {boolean}
     * @instance
     */
    cellSelection: true,

    /** Clicking in a column header (top row) "selects" the column; the entire column is added to the select region and repainted with "column selection" colors.
     * @default
     * @type {boolean}
     * @instance
     */
    columnSelection: true,

    /** Clicking in a row header (leftmost column) "selects" the row; the entire row is added to the select region and repainted with "row selection" colors.
     * @default
     * @type {boolean}
     * @instance
     */
    rowSelection: true,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    singleRowSelectionMode: true,

    /**
     * @default
     * @type {cssColor}
     * @instance
     */
    selectionRegionOverlayColor: 'rgba(0, 0, 48, 0.2)',

    /**
     * @default
     * @type {string}
     * @instance
     */
    selectionRegionOutlineColor: 'rgb(69, 69, 69)',

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    columnAutosizing: true,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    rowNumberAutosizing: true,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    headerTextWrapping: false,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    rowResize: false,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    editable: true,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    filterable: true,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    editOnDoubleClick: true,

    /**
     * @default
     * @type {number}
     * @instance
     */
    doubleClickDelay: 325,

    /**
     * Grid-level property.
     * When user presses a printable character key _or_ BACKSPACE _or_ DELETE:
     * 1. Activate cell editor on current cell (i.e., origin of most recent selection).
     * 2. If cell editor is a text editor:
     *    1. Replace current value with the character the user typed; or
     *    2. Clear it on BACKSPACE, DELETE, or other invalid character (_e.g._ when user types a letter but the cell editor only accepts digits).
     *
     * > In invoked, user has the option to back out by pressing the ESCAPE key.
     *
     * @default
     * @type {boolean}
     * @instance
     */
    editOnKeydown: true,

    /**
     * @default
     * @type {boolean}
     * @instance
     */
    checkboxOnlyRowSelections: false,

    /** @summary Name of a formatter for cell text.
     * @desc The default (`undefined`) falls back to `column.type`.
     * The value `null` does no formatting.
     * @default undefined
     * @type {undefined|null|string}
     * @instance
     * @tutorial localization
     */
    format: undefined,

    /** @summary Name of a cell editor from the {@link module:cellEditors|cellEditors API}..
     * @desc Not editable if named editor is does not exist.
     * @default undefined
     * @type {undefined|null|string}
     * @instance
     * @tutorial cell-editors
     */
    editor: undefined,

    /**
     * Name of cell renderer from the {@link module:cellRenderers|cellRenderers API}.
     * @default
     * @type {string}
     * @instance
     */
    renderer: 'SimpleCell',

    /********** HOVER COLORS **********/

    /** @typedef hoverColors
     * @property {boolean} [enable=false] - `false` means not hilite on hover
     * @property {cssColor} backgroundColor - cell, row, or column background color. Alpha channel will be respected and if given will be painted over the cells predetermined color.
     * @property {cssColor} [header.backgroundColor=backgroundColor] - for columns and rows, this is the background color of the column or row "handle" (header rows or columns, respectively). (Not used for cells.)
     */

    /** On mouse hover, whether to repaint the cell background and how.
     * @type {hoverColors}
     * @default '{ enabled: true, background: rgba(160, 160, 40, 0.30) }'
     * @instance
     */
    hoverCellHighlight: {
        enabled: true,
        backgroundColor: 'rgba(160, 160, 40, 0.45)'
    },

    /** On mouse hover, whether to repaint the row background and how.
     * @type {hoverColors}
     * @default '{ enabled: true, background: rgba(100, 100, 25, 0.15) }'
     * @instance
     */
    hoverRowHighlight: {
        enabled: true,
        backgroundColor: 'rgba(100, 100, 25, 0.30)'

    },

    /** On mouse hover, whether to repaint the column background and how.
     * @type {hoverColors}
     * @default '{ enabled: true, background: rgba(60, 60, 15, 0.15) }'
     * @instance
     */
    hoverColumnHighlight: {
        enabled: true,
        backgroundColor: 'rgba(60, 60, 15, 0.15)'
    },


    /** Display cell font with under-score line drawn over it.
     * > Implementation of links right now is not automatic; you must attach a 'fin-click' listener to the hypergrid object, etc.
     * @type {boolean}
     * @default
     * @instance
     */
    link: false,

    /** Display cell font with strike-through line drawn over it.
     * @type {boolean}
     * @default
     * @instance
     */
    strikeThrough: false,

    /** Ignore sort interaction (double-click).
     * @type {boolean}
     * @default
     * @instance
     */
    unsortable: false,

    /** Allow multiple cell region selections.
     * @type {boolean}
     * @default
     * @instance
     */
    multipleSelections: false,

    /** @summary Re-render grid at maximum speed.
     * @desc In this mode:
     * * The "dirty" flag, set by calling `grid.repaint()`, is ignored.
     * * `grid.getCanvas().currentFPS` is a measure of the number times the grid is being re-rendered each second.
     * * The Hypergrid renderer gobbles up CPU time even when the grid appears idle (the very scenario `repaint()` is designed to avoid). For this reason, we emphatically advise against shipping applications using this mode.
     * @type {boolean}
     * @default
     * @instance
     */
    enableContinuousRepaint: false,

    /** @summary Allow user to move columns .
     * @desc Columns can be reordered through either of two interfaces:
     * * Column Dragging feature
     * * Column Picker dialog
     * @type {boolean}
     * @default
     * @instance
     */
    columnsReorderable: true,

    /** @summary Apply cell properties before `getCell`.
     * @type {boolean}
     * @default
     * @instance
     */
    applyCellProperties: true,

    /** @summary Reapply cell properties after `getCell`.
     * @type {boolean}
     * @default
     * @instance
     */
    reapplyCellProperties: false,

    /** @summary Column grab within this number of pixels from top of cell.
     * @type {number}
     * @default
     * @instance
     */
    columnGrabMargin: 5
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
    string += '';
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
