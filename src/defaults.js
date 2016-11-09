'use strict';

var graphics = require('./lib/graphics');

var warned = {};

/**
 * This module lists the properties that can be set on a {@link Hypergrid} along with their default values.
 * Edit this file to override the defaults.
 * @module defaults
 */

var defaults = {

    /**
     * The font for data cells.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    noDataMessage: '',


    /**
     * The font for data cells.
     * @default
     * @type {cssFont}
     * @memberOf module:defaults
     */
    font: '13px Tahoma, Geneva, sans-serif',

    /**
     * Font color for data cells.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    color: 'rgb(25, 25, 25)',

    /**
     * Background color for data cells.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    backgroundColor: 'rgb(241, 241, 241)',

    /**
     * Font style for selected cell(s).
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    foregroundSelectionFont: 'bold 13px Tahoma, Geneva, sans-serif',

    /**
     * Font color for selected cell(s).
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    foregroundSelectionColor: 'rgb(0, 0, 128)',
    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    sortOnHiddenColumns: true,
    /**
     * Background color for selected cell(s).
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    backgroundSelectionColor: 'rgba(147, 185, 255, 0.625)',


    /********** SECTION: COLUMN HEADER COLORS **********/

    // IMPORTANT CAVEAT: The code is inconsistent regarding the terminology. Is the "column header" section _the row_ of cells at the top (that act as headers for each column) or is it _the column_ of cells (that act as headers for each row)? Oh my.

    /**
     * @default
     * @type {cssFont}
     * @memberOf module:defaults
     */
    columnHeaderFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    columnHeaderColor: 'rgb(25, 25, 25)',

    /**
     * Font style for selected columns' headers.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    columnHeaderForegroundSelectionFont: 'bold 12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    columnHeaderBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    columnHeaderForegroundSelectionColor: 'rgb(80, 80, 80)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    columnHeaderBackgroundSelectionColor: 'rgba(255, 220, 97, 0.45)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    columnHeaderForegroundColumnSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    columnHeaderBackgroundColumnSelectionColor: 'rgb(255, 180, 0)',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    columnHeaderHalign: 'center',


    /********** SECTION: ROW HEADER COLORS **********/

    /**
     * @default
     * @type {cssFont}
     * @memberOf module:defaults
     */
    rowHeaderFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    rowHeaderColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    rowHeaderBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    rowHeaderForegroundSelectionColor: 'rgb(80, 80, 80)',

    /**
     * Font style for selected rows' headers.
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    rowHeaderForegroundSelectionFont: 'bold 12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    rowHeaderBackgroundSelectionColor: 'rgba(255, 220, 97, 0.45)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    rowHeaderForegroundRowSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    rowHeaderBackgroundRowSelectionColor: 'rgb(255, 180, 0)',


    /********** SECTION: FILTER ROW COLORS **********/

    /**
     * @default
     * @type {cssFont}
     * @memberOf module:defaults
     */
    filterFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    filterColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    filterBackgroundColor: 'white',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    filterForegroundSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    filterBackgroundSelectionColor: 'rgb(255, 220, 97)',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    filterHalign: 'center',


    /********** SECTION: TREE COLUMN COLORS **********/
    // The "tree column" contains the hierarchical drill-down controls.

    /**
     * @default
     * @type {cssFont}
     * @memberOf module:defaults
     */
    treeColumnFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    treeColumnColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    treeColumnBackgroundColor: 'rgb(223, 227, 232)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    treeColumnForegroundSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    treeColumnBackgroundSelectionColor: 'rgba(255, 220, 97, 0.45)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    treeColumnForegroundColumnSelectionColor: 'rgb(25, 25, 25)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    treeColumnBackgroundColumnSelectionColor: 'rgb(255, 180, 0)',

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    backgroundColor2: 'rgb(201, 201, 201)',

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    voffset: 0,

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    scrollbarHoverOver: 'visible',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    scrollbarHoverOff: 'hidden',

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    scrollingEnabled: true,

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    vScrollbarClassPrefix: '',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    hScrollbarClassPrefix: '',

    //these used to be in the constants element

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    fixedRowAlign: 'center',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    fixedColAlign: 'center',
    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    halign: 'center',

    /**
     * Padding to left and right of cell value.
     *
     * NOTE: Right padding may not be visible if column is not sized wide enough.
     *
     * See also {@link module:defaults.iconPadding|iconPadding}.
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    cellPadding: 5,

    /**
     * Padding to left and right of cell icons.
     *
     * Overrides {@link module:defaults.cellPadding|cellPadding}:
     * * Left icon + `iconPadding` overrides left `cellPdding`.
     * * Right icon + `iconPadding` overrides right `cellPaddin`.
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    iconPadding: 3,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    gridLinesH: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    gridLinesV: true,
    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    gridLinesVOverflow: false,

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    lineColor: 'rgb(199, 199, 199)',

    /**
     * Caveat: `lineWidth` should be an integer (whole pixel)
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    lineWidth: 1,


    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    defaultRowHeight: 15,

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    defaultColumnWidth: 100,

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    minimumColumnWidth: 5,

    //for immediate painting, set these values to 0, true respectively

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    repaintIntervalRate: 60,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    repaintImmediately: false,

    //enable or disable double buffering

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    useBitBlit: false,


    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    useHiDPI: true,

    /**
     * @default ['alt', 'esc']
     * @type {string}
     * @memberOf module:defaults
     */
    editorActivationKeys: ['alt', 'esc'],

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    readOnly: false,

    // inherited by cell renderers

    /**
     * This function is referenced here so it will be available to the renderer and cell renderers.
     * @default {@link module:defaults.getTextWidth|getTextWidth}
     * @type {function}
     * @memberOf module:defaults
     */
    getTextWidth: function(gc, string) {
        if (!warned.getTextWidth) {
            warned.getTextWidth = true;
            console.warn('getTextWidth(gc, string) has been deprecated on the properties (or config) object as of v1.2.4 in favor of the graphics context (aka gc) object and will be removed from the properties object in a future release. Please change your calling context to gc.getTextWidth(string), excluding the first parameter (gc) from your call.');
        }
        return graphics.getTextWidth.apply(gc, string);
    },

    /**
     * This function is referenced here so it will be available to the renderer and cell renderers.
     * @default {@link module:defaults.getTextHeight|getTextHeight}
     * @type {function}
     * @memberOf module:defaults
     */
    getTextHeight: function(font) {
        if (!warned.getTextHeight) {
            warned.getTextHeight = true;
            console.warn('getTextHeight(font) has been deprecated on the properties (or config) object as of v1.2.4 in favor of the graphics context (aka gc) object and will be removed from the properties object in a future release. Please change your calling context to gc.getTextHeight(font).');
        }
        return graphics.getTextHeight(font);
    },

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    fixedColumnCount: 0,

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
     */
    fixedRowCount: 0,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    showRowNumbers: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    showTreeColumn: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    showHeaderRow: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    showFilterRow: false,


    /** Clicking in a cell "selects" it; it is added to the select region and repainted with "cell selection" colors.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    cellSelection: true,

    /** Clicking in a column header (top row) "selects" the column; the entire column is added to the select region and repainted with "column selection" colors.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    columnSelection: true,

    /** Clicking in a row header (leftmost column) "selects" the row; the entire row is added to the select region and repainted with "row selection" colors.
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    rowSelection: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    singleRowSelectionMode: true,

    /**
     * @default
     * @type {cssColor}
     * @memberOf module:defaults
     */
    selectionRegionOverlayColor: 'rgba(0, 0, 48, 0.2)',

    /**
     * @default
     * @type {string}
     * @memberOf module:defaults
     */
    selectionRegionOutlineColor: 'rgb(69, 69, 69)',

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    columnAutosizing: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    rowNumberAutosizing: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    headerTextWrapping: false,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    rowResize: false,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    editable: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    filterable: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    editOnDoubleClick: true,

    /**
     * @default
     * @type {number}
     * @memberOf module:defaults
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
     * @memberOf module:defaults
     */
    editOnKeydown: true,

    /**
     * @default
     * @type {boolean}
     * @memberOf module:defaults
     */
    checkboxOnlyRowSelections: false,

    /** @summary Name of a formatter for cell text.
     * @desc The default (`undefined`) falls back to `column.type`.
     * The value `null` does no formatting.
     * @default undefined
     * @type {undefined|null|string}
     * @memberOf module:defaults
     * @tutorial localization
     */
    format: undefined,

    /** @summary Name of a cell editor from the {@link module:cellEditors|cellEditors API}..
     * @desc Not editable if named editor is does not exist.
     * @default undefined
     * @type {undefined|null|string}
     * @memberOf module:defaults
     * @tutorial cell-editors
     */
    editor: undefined,

    /**
     * Name of cell renderer from the {@link module:cellRenderers|cellRenderers API}.
     * @default
     * @type {string}
     * @memberOf module:defaults
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
     * @memberOf module:defaults
     */
    hoverCellHighlight: {
        enabled: true,
        backgroundColor: 'rgba(160, 160, 40, 0.45)'
    },

    /** On mouse hover, whether to repaint the row background and how.
     * @type {hoverColors}
     * @default '{ enabled: true, background: rgba(100, 100, 25, 0.15) }'
     * @memberOf module:defaults
     */
    hoverRowHighlight: {
        enabled: true,
        backgroundColor: 'rgba(100, 100, 25, 0.30)'

    },

    /** On mouse hover, whether to repaint the column background and how.
     * @type {hoverColors}
     * @default '{ enabled: true, background: rgba(60, 60, 15, 0.15) }'
     * @memberOf module:defaults
     */
    hoverColumnHighlight: {
        enabled: true,
        backgroundColor: 'rgba(60, 60, 15, 0.15)'
    },


    /** Display cell font with under-score line drawn over it.
     * > Implementation of links right now is not automatic; you must attach a 'fin-click' listener to the hypergrid object, etc.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    link: false,

    /** Display cell font with strike-through line drawn over it.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    strikeThrough: false,

    /** Ignore sort interaction (double-click).
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    unsortable: false,

    /** Allow multiple cell region selections.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    multipleSelections: false,

    /** @summary Re-render grid at maximum speed.
     * @desc In this mode:
     * * The "dirty" flag, set by calling `grid.repaint()`, is ignored.
     * * `grid.getCanvas().currentFPS` is a measure of the number times the grid is being re-rendered each second.
     * * The Hypergrid renderer gobbles up CPU time even when the grid appears idle (the very scenario `repaint()` is designed to avoid). For this reason, we emphatically advise against shipping applications using this mode.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    enableContinuousRepaint: false,

    /** @summary Allow user to move columns .
     * @desc Columns can be reordered through either of two interfaces:
     * * Column Dragging feature
     * * Column Picker dialog
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    columnsReorderable: true,

    /** @summary Apply cell properties before `getCell`.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    applyCellProperties: true,

    /** @summary Reapply cell properties after `getCell`.
     * @type {boolean}
     * @default
     * @memberOf module:defaults
     */
    reapplyCellProperties: false,

    /** @summary Column grab within this number of pixels from top of cell.
     * @type {number}
     * @default
     * @memberOf module:defaults
     */
    columnGrabMargin: 5,

    /** @summary Set up a clipping region around each column before painting cells.
     * @desc One of:
     * * `true` - Clip column.
     * * `false` - Do not clip column.
     * * `null` - Clip iff last active column.
     *
     * Clipping prevents text that overflows to the right of the cell from being rendered.
     * If you can guarantee that none of your text will overflow, turn column clipping off
     * for better performance. If not, you may still be able to get away without clipping.
     * If the background color of the next column is opaque, you don't really need to clip,
     * although text can leak out to the right of the last column. Clipping the last column
     * only can help this but not solve it since the leaked text from (say) the column before
     * the last column could stretch across the entire last column and leak out anyway.
     * The solution to this is to clip the rendered string so at most only a partial character
     * will overflow.
     * @type {boolean|undefined}
     * @default
     * @memberOf module:defaults
     */
    columnClip: true,

    /**
     * @summary Repeating pattern of property overrides for grid rows.
     * @desc Notes:
     * * "Grid row" refers to data rows.
     * * Row index modulo is applied when dereferencing this array. In other words, this array represents a _repeating pattern_ of properties to be applied to the data rows.
     * * For no row properties, specify a falsy value in place of the array.
     * * Do not specify an empty array (will throw an error).
     * * Each element of the array may be either:
     *   * An object containing property overrides to be applied to every cell of the row; or
     *   * A falsy value signifying that there are no row properties for this specific row.
     * * Caveat: Row properties use `Object.assign()` to copy properties and therefore are not as performant as column properties which use prototype chain.
     * * `Object.assign()` is a polyfill in older versions of Chrome (<45) and in all Internet Explorer (through 11).
     * @type {undefined|object[]}
     * @default
     * @memberOf module:defaults
     */
    rowProperties: undefined,
};

/** @typedef {string} cssColor
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
 */
/** @typedef {string} cssFont
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/font
 */

module.exports = defaults;
