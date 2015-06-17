'use strict';
/**
 *
 * @module behaviors\base
 * @description
this is the base class for creating behaviors.  a behavior can be thought of as a model++.
it contains all code/data that's necessary for easily implementing a virtual data source and it's manipulation/analytics
 *
 */
(function() {

    var noop = function() {};

    var imageCache = {};


    // create these images with http://www.base64-image.de/
    var imgData = [
        ['1-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAFFJREFUKFNjQAL/oTTD////CWJkgFMjEAgD8Q4gLkMSgwOsGoGgDCQExcRrRFJImo1ICqmnEUSiYJgkMgYCrDYia8TQBFVIJ6cCAXJ0QDGDDQD67OYX9wdp0wAAAABJRU5ErkJggg=='],
        ['1-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAExJREFUKFPtjYEJACAIBN2hdZqr2dqu3tB8C5qghzPxlAQZJ4iWJ9E8DpACOmh7ZkLLwoWDNPJxSMONSwa5fzSBJy8z/9B6RpfVZaRO2oo/zJVRDvIAAAAASUVORK5CYII='],
        ['1-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGtJREFUKFOtjoEJgDAQA6uiC7iOc3U2t3sT6Uu+XxDBwFliEtoisnYWM3vFtQG6mWZQ2sEJqvy7tQC6FUzdqLaMpCH1OB1KcXgjBZ8HDhSHEuCIZeW/IcRvwEMFyjey7HjQA317KsvMIuW4AFTUEgvs+3wkAAAAAElFTkSuQmCC'],
        ['1-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAFBJREFUKFPtjdsNQCEIQ93BdZzL2dwOjw9CuV93AEmOJbYNxcw2DHL2P5wHcdR0mAoDuvxFyXHzBrp4UZQAEoUvTL4oBpLDyiveXVnh5WVKm6iPR8RbHxLhAAAAAElFTkSuQmCC'],

        ['2-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAH5JREFUKFOVkAsNgDAMROcBBxjAAEJwgAMcYGGmsIAGLJS7piE3FjJ2yRvpxus+SWLxTWbWRFOJyAgyuDgNDjD9EWewAzZgvElTVCJshLJfXED3jjwu77pG7UKBCvHTAPgwWeY8Kn5KLN4i81SyyOOdgHfzqMixQBb9FWvSdgNN871AHwblVAAAAABJRU5ErkJggg=='],
        ['2-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJVJREFUKFN9kAEVgzAMRPEwBzOAgQnBwRzgYBZqCgtowAL7l6VtILB77zc01yttB7SfQRr+0j8uAugJBTb5sMBoni/QYNSQ91/wAW0g2Sbu9VAlhisubcSUeTCscYdrgt8fg0HJgQrScXXXt82DQckBgR6ghymtF0zKMSBQC2nS+mEBJYV0vBV0N1PzwiJKCtorZob5Cy2RFvXFQAKlAAAAAElFTkSuQmCC'],
        ['2-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJtJREFUKFOFkAsNAjEQRAsXMIADDJwBhOAABzjAwpnCAhqwUN4s2zJQCJO8bGa3018x1ayl1vqXpi3IrWVsuIcF7mrDFWYPTiC3gZUFD3ABbSDFJh6UumtBJ6WNsB/BtugbqSM8T7QBZQw0kK6rt57C24AyBgTagT5msV687Y02zAU9JNP7OfwV0vVuoLeF+swWUV6h7MUvjpTzA6fM6SVV2CbgAAAAAElFTkSuQmCC'],
        ['2-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAIxJREFUKFOVkFsRgDAMBOsBBxjAAEJwgAMcYAFTWEADFspe+iDQH8jMcrSX6yvEGA0KSf9fSB+k8DBD6GGDUx7sMGTvDhVccIQVtIDKFjHPNSH3bm9yaSGG/4MT/N5Rx9VdZxs7A2kDgupAD7PVOWciz4CgakiDOu8akCak4x2gu1lVzzUhTdBesSUsF/uHHu110bZRAAAAAElFTkSuQmCC'],

        ['3-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJVJREFUKFONkQENhDAMRecBB2cAAyhAwTnAAQ6wgAa8nIXTcBbGf6NduiyEe8ljadlfOkiBbGvKOT8a6YLiJXf5oy2/8v1PcJKb5ABYJS+8LnTBqMFBFGOpjKfgIBl7t7pyGxQ+InecPcizMYZ8kzFLGnXUGLwLOTS5a6XuCqFFMib3A2p+Tfmq7GgMQU4+vC8/Vy+lEzGdowwHiWM2AAAAAElFTkSuQmCC'],
        ['3-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJtJREFUKFOFkQERwjAMResBBzOAgSmYAhzgAAdYmAa8YAENWID3SgM5soN/95om6e+lW0OPb5DLTz6bDQOaYIW7fbjBoffGAZdOmEZ9hjN4gTqBjZ6/TUE2B0NeZLLPDUI1BGgHjr32PDUI1SAoRvSNS6+lJqGaJGkBC/9H3ZDFOR8gFNMRHNP3KXN/zZQPEYrRr3ixN7i+aq09ARE7/LLO8L26AAAAAElFTkSuQmCC'],
        ['3-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAKdJREFUKFN1kQERwjAMRQscGMDBDGBgCqYABzjAARamAS9YQAMWyn8hodlt/Xfv0p80uXQrSdXjX7XWLqGTwO3NNQ1iFh9B/S2uufEgcEexI+EaxUMwAN0F98Kb2hjXxmoMwlzMuVRfviMjnQVrz+ZTQWHdAFKsyBsny6WiwroJkiZBwlblsKDTFCI5RrHXdBOsyfsQnl8z5EsKrclzfMUnNef1y5XyBYgdtwl+Lm+LAAAAAElFTkSuQmCC'],
        ['3-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAJpJREFUKFONkQsRwjAQBeMBBzWAgSqoAhzgAAdYqAa8YAENWAi7+cAx6UDfzPaae32ZS5pyzgVEqe97qA9K58tMaYIVnnrwgFPzPqFOCM5wBTdQF9CY4u7vwBZNbuTiGA3KGOigAzj2WtbBoIwBQX1Ez7iUXjApY0iCFrDxf9QN2ZzjB5QhdAbH9HzKtb/m960ib/Gm17jXXkov3zEEuQ7h10oAAAAASUVORK5CYII='],

        ['up-rectangle', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAAHklEQVQYV2PAAv5DaZwApACGsQJkBVgVYlMAxQwMABOrD/GvP+EWAAAAAElFTkSuQmCC'],
        ['down-rectangle', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAABpJREFUGFdjgIL/eDAKIKgABggqgAE0BQwMAPTlD/Fpi0JfAAAAAElFTkSuQmCC'],
        ['rectangle-spacer', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAA1JREFUGFdjGHSAgQEAAJQAAY8LvLEAAAAASUVORK5CYII='],

        ['expand-all', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAExSURBVDhPY3CKKv2PjP+TCBhAms8/+grGIDapAGzA1ksfwBiXAQrtQv+RMbIlYAMIeQGkOeioLRiD2CgGEONkkKbQkw5gjNUABgYGuDnYXATSFHHWGYwJugBboII0xVxyA2O8LgC5BFuggjTFX/MEY6JcgB6oIE3Jt3zAmGAYwAKjYFM6StSl3/f/D8LI0VmwMf0/IvSgOmG2O8QU/FdplPsfesL+f9bjIBQMErOaqvv/04+PEANgsQALA1jKtE5J+K85QQpsc96L0P+5z0P/p93z/6/eL/H/zONTYCuxugA5ZU440vnffIna/4LX4WAMYvcdbIdHO04vwLzy99/f/4EL3f4HHLCG4AWu///8/Y3bAGwp8+nHx//1JiqA8eP3D0lPyiAd66+s+r/u0goM8wHtCSnFKywCAAAAAABJRU5ErkJggg=='],
        ['collapse-all', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEvSURBVDhPY3CKKv2PjP/jAOuvrPq/7tIKDFkGkObzj76CMYiNDTz9+Pi/3kQFMH78/iGKErABWy99AGNsBvz99/d/4EK3/wEHrCF4gev/P39/ww0BG4DPCxOOdP43X6L2v+B1OBiD2H0H2xEG4PIzSPzckzP/NSdI/U+/7/8/93koGKfd8/+v3i/x/8zjU2CtDCBi5qxZcHNAbBCeNHPyf/1O5f+hJ+z/Zz0OQsEgMaupuv8//fgIMQAZwAwr3JzxX6FdCI5BrgBhZLGCjemoLoDZDjMQZhhIU/ItHzAGsZEBVhfADEI2IP6a538QxmoAchhgC1SQpphLbmBMtgsizjr/B2G8LsAXBqEnHf6DMFEuwBaIQUdt/4MwUQZgC0Tk6MMbC/hSJjY5jGgk1QAASC9JvTamTUkAAAAASUVORK5CYII='],
        ['sortable', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAAxSURBVChTY8AD/kNpkgBIEwwTDZA1Ea0ZmyYYHmQAmxNhmCAgSxMMkKUJBvBoYmAAAJCXH+FU1T8+AAAAAElFTkSuQmCC'],
        ['up-arrow', 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAKCAYAAAB8OZQwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAA9SURBVBhXbYvRCgAgCAOtqP//Y9tElw8NDrcDzd0DBCd7iSL3E0IvGOpf2fKXeZUFKDcYFMwBlDNWS76bXUM5P9In5AzyAAAAAElFTkSuQmCC'],
        ['down-arrow', 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAKCAYAAAB8OZQwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAA+SURBVBhXhYvRCgAgCAOtqP//4+WWhtBDB1duqBUQ/2W5LLtSMFyW020skuecwOGj6QzfkuExt1LlcqICgG3S7z/SL/jVpgAAAABJRU5ErkJggg==']
    ];

    (function() {
        var each, img;
        for (var i = 0; i < imgData.length; i++) {
            each = imgData[i];
            img = new Image();
            img.src = 'data:image/png;base64,' + each[1];
            imageCache[each[0]] = img;
        }
    })();

    Polymer('fin-hypergrid-behavior-base', { /* jslint ignore:line */

        /**
         * @property {object} tableState - memento for the user configured visual properties of the table
         * @instance
         */
        tableState: null,

        /**
         * @property {fin-hypergrid} grid - my instance of hypergrid
         * @instance
         */
        grid: null,

        /**
         * @property {array} editorTypes - list of default cell editor names
         * @instance
         */
        editorTypes: ['choice', 'textfield', 'color', 'slider', 'spinner', 'date'],

        /**
         * @property {object} featureChain - controller chain of command
         * @instance
         */
        featureChain: null,

        /**
         * @function
         * @instance
         * @description
         utility function to empty an object of its members
         * @param {Object} obj - the object to empty
         */
        clearObjectProperties: function(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    delete obj[prop];
                }
            }
        },

        /**
         * @function
         * @instance
         * @description
         polymer lifecycle event
         */
        ready: function() {
            this.readyInit();
        },

        /**
         * @function
         * @instance
         * @description
         the function to override for initialization
         */
        readyInit: function() {
            this.cellProvider = this.createCellProvider();
            this.scrollPositionX = 0;
            this.scrollPositionY = 0;
            this.renderedColumnCount = 30;
            this.renderedRowCount = 60;
            this.dataUpdates = {}; //for overriding with edit values;
            //this.initColumnIndexes();
        },

        /**
         * @function
         * @instance
         * @description
         getter for a [Memento](http://c2.com/cgi/wiki?MementoPattern) Object
         * #### returns: Object
         */
        getState: function() {
            if (!this.tableState) {
                this.tableState = this.getDefaultState();
                this.initColumnIndexes(this.tableState);
            }
            return this.tableState;
        },

        /**
         * @function
         * @instance
         * @description
         clear all table state
         */
        clearState: function() {
            this.tableState = null;
        },

        /**
         * @function
         * @instance
         * @description
         create a default empty tablestate
         * #### returns: Object
         */
        getDefaultState: function() {
            return {
                columnIndexes: [],
                fixedColumnIndexes: [],
                hiddenColumns: [],

                columnWidths: [],
                fixedColumnWidths: [],
                fixedColumnAutosized: [],

                rowHeights: {},
                fixedRowHeights: {},
                columnProperties: [],
                columnAutosized: [],

                fixedColumnCount: 0,
                fixedRowCount: 1,
            };
        },

        /**
         * @function
         * @instance
         * @description
         setter for a [Memento](http://c2.com/cgi/wiki?MementoPattern) Object
         * @param {Object} state - [Memento](http://c2.com/cgi/wiki?MementoPattern) Object
         */
        setState: function(state) {
            var tableState = this.getState();
            for (var key in state) {
                if (state.hasOwnProperty(key)) {
                    tableState[key] = state[key];
                }
            }
        },

        /**
         * @function
         * @instance
         * @description
         fetch the value for a property key
         * #### returns: Object
         * @param {string} key - a property name
         */
        resolveProperty: function(key) {
            return this.grid.resolveProperty(key);
        },

        /**
         * @function
         * @instance
         * @description
         a specific cell was clicked, you've been notified
         * @param {rectangle.point} cell - point of cell coordinates
         * @param {Object} event - all event information
         */
        cellClicked: function( /* cell, event */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         a specific cell was le doubclicked, you've been notified
         * @param {rectangle.point} cell - point of cell coordinates
         * @param {Object} event - all event information
         */
        cellDoubleClicked: function( /* cell, event */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         reset both fixed and normal column indexes, this is will cause columns to display in their true order
         */
        initColumnIndexes: function(tableState) {
            var columnCount = this.getColumnCount();
            var fixedColumnCount = this.getState().fixedColumnCount;
            var i;
            for (i = 0; i < columnCount; i++) {
                tableState.columnIndexes[i] = i;
            }
            for (i = 0; i < fixedColumnCount; i++) {
                tableState.fixedColumnIndexes[i] = i;
            }
        },

        /**
         * @function
         * @instance
         * @description
         make sure the column indexes are initialized
         */
        insureColumnIndexesAreInitialized: function() {
            this.swapColumns(0, 0);
        },

        /**
         * @function
         * @instance
         * @description
         swap src and tar columns
         * @param {integer} src - column index
         * @param {integer} tar - column index
         */
        swapColumns: function(src, tar) {
            var tableState = this.getState();
            var fixedColumnCount = this.getState().fixedColumnCount;
            var indexes = tableState.columnIndexes;
            if (indexes.length === 0) {
                this.initColumnIndexes(tableState);
                indexes = tableState.columnIndexes;
            }
            var tmp = indexes[src + fixedColumnCount];
            indexes[src + fixedColumnCount] = indexes[tar + fixedColumnCount];
            indexes[tar + fixedColumnCount] = tmp;
        },

        /**
         * @function
         * @instance
         * @description
         translate the viewed index to the real index
         * #### returns: integer
         * @param {integer} x - viewed index
         */
        translateColumnIndex: function(x) {
            var tableState = this.getState();
            var fixedColumnCount = tableState.fixedColumnCount;
            var indexes = tableState.columnIndexes;
            if (indexes.length === 0) {
                return x;
            }
            return indexes[x + fixedColumnCount];
        },

        /**
         * @function
         * @instance
         * @description
         translate the real index to the viewed index
         * #### returns: integer
         * @param {integer} x - the real index
         */
        unTranslateColumnIndex: function(x) {
            var tableState = this.getState();
            return tableState.columnIndexes.indexOf(x);
        },

        /**
         * @function
         * @instance
         * @description
         add nextFeature to me If I don't have a next node, otherwise pass it along
         * @param {fin-hypergrid-feature-base} nextFeature - [fin-hypergrid-feature-base](module-features_base.html)
         */
        setNextFeature: function(nextFeature) {
            if (this.featureChain) {
                this.featureChain.setNext(nextFeature);
            } else {
                this.featureChain = nextFeature;
            }
        },

        /**
         * @function
         * @instance
         * @description
         this is the callback for the plugin pattern of nested tags
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        installOn: function(grid) {
            grid.setBehavior(this);
            this.initializeFeatureChain(grid);
        },

        /**
         * @function
         * @instance
         * @description
         create the feature chain - this is the [chain of responsibility](http://c2.com/cgi/wiki?ChainOfResponsibilityPattern) pattern.
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        initializeFeatureChain: function(grid) {
            this.setNextFeature(document.createElement('fin-hypergrid-feature-key-paging'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-click'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-overlay'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-resizing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-row-resizing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-selection'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-moving'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-thumbwheel-scrolling'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-editing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-sorting'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-on-hover'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-autosizing'));

            this.featureChain.initializeOn(grid);
        },

        /**
         * @function
         * @instance
         * @description
         getter for the cell provider
         * #### returns: [fin-hypergrid-cell-provider](module-._cell-provider.html)
         */
        getCellProvider: function() {
            return this.cellProvider;
        },

        /**
         * @function
         * @instance
         * @description
         setter for the hypergrid
         * @param {fin-hypergrid} finGrid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        setGrid: function(finGrid) {
            this.grid = finGrid;
        },

        /**
         * @function
         * @instance
         * @description
         getter for the hypergrid
         * #### returns: [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {type} varname - descripton
         */
        getGrid: function() {
            return this.grid;
        },

        /**
         * @function
         * @instance
         * @description
         you can override this function and substitute your own cell provider
         * #### returns: [fin-hypergrid-cell-provider](module-._cell-provider.html)
         */
        createCellProvider: function() {
            var provider = document.createElement('fin-hypergrid-cell-provider');
            return provider;
        },

        /**
         * @function
         * @instance
         * @description
         return the value at x,y for the top left section of the hypergrid
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getTopLeftValue: function( /* x, y */ ) {
            return '';
        },

        /**
         * @function
         * @instance
         * @description
         return the value at x,y for the top left section of the hypergrid, first check to see if something was overridden
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        _getValue: function(x, y) {
            x = this.translateColumnIndex(x);
            var override = this.dataUpdates['p_' + x + '_' + y];
            if (override) {
                return override;
            }
            return this.getValue(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         update the data at point x, y with value
         * #### returns: type
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         * @param {Object} value - the value to use
         */
        _setValue: function(x, y, value) {
            x = this.translateColumnIndex(x);
            this.setValue(x, y, value);
        },

        /**
         * @function
         * @instance
         * @description
         return the view translated value at x,y for the fixed row area
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        _getFixedRowValue: function(x, y) {
            x = this.translateColumnIndex(x);
            return this.getFixedRowValue(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         return the value at x,y for the fixed row area
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getFixedColumnValue: function(x, y) {
            //x = this.fixedtranslateColumnIndex(x);
            return y + 1;
        },

        /**
         * @function
         * @instance
         * @description
         return the number of rows
         * #### returns: integer
         */
        getRowCount: function() {
            //jeepers batman a quadrillion rows!
            return 1000000000000000;
        },

        /**
         * @function
         * @instance
         * @description
         return the total number of columns adjusted for hidden columns
         * #### returns: integer
         */
        _getColumnCount: function() {
            var tableState = this.getState();
            var fixedColumnCount = this.getState().fixedColumnCount;
            return this.getColumnCount() - tableState.hiddenColumns.length - fixedColumnCount;
        },

        /**
         * @function
         * @instance
         * @description
         return the height in pixels of the fixed rows area
         * #### returns: integer
         */
        getFixedRowsHeight: function() {
            var count = this.getFixedRowCount();
            var total = 0;
            for (var i = 0; i < count; i++) {
                total = total + this.getFixedRowHeight(i);
            }
            return total;
        },

        /**
         * @function
         * @instance
         * @description
         return the pixel height of a specific row in the fixed row area
         * #### returns: integer
         * @param {integer} rowNum - the row index of interest
         */
        getFixedRowHeight: function(rowNum) {
            var tableState = this.getState();
            if (tableState.fixedRowHeights) {
                var override = tableState.fixedRowHeights[rowNum];
                if (override) {
                    return override;
                }
            }
            return this.resolveProperty('defaultFixedRowHeight');
        },

        /**
         * @function
         * @instance
         * @description
         set the height of a specific row in the fixed row area
         * @param {integer} rowNum - the row integer to affect
         * @param {integer} height - the pixel height to set it to
         */
        setFixedRowHeight: function(rowNum, height) {
            //console.log(rowNum + ' ' + height);
            var tableState = this.getState();
            tableState.fixedRowHeights[rowNum] = Math.max(5, height);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         get height in pixels of a specific row
         * #### returns: integer
         * @param {integer} rowNum - row index of interest
         */
        getRowHeight: function(rowNum) {
            var tableState = this.getState();
            if (tableState.rowHeights) {
                var override = tableState.rowHeights[rowNum];
                if (override) {
                    return override;
                }
            }
            return this.getDefaultRowHeight();
        },

        /**
         * @function
         * @instance
         * @description
         returns a lazily initialized value from the properties mechanism for 'defaultRowHeight', should be ~20px
         * #### returns: integer
         */
        getDefaultRowHeight: function() {
            if (!this.defaultRowHeight) {
                this.defaultRowHeight = this.resolveProperty('defaultRowHeight');
            }
            return this.defaultRowHeight;
        },

        /**
         * @function
         * @instance
         * @description
         set the pixel height of a specific row
         * @param {integer} rowNum - the row index of interest
         * @param {integer} height - pixel height
         */
        setRowHeight: function(rowNum, height) {
            var tableState = this.getState();
            tableState.rowHeights[rowNum] = Math.max(5, height);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         return the potential maximum height of the fixed rows areas, this will allow 'floating' fixed rows
         * #### returns: integer
         */
        getFixedRowsMaxHeight: function() {
            var height = this.getFixedRowsHeight();
            return height;
        },

        /**
         * @function
         * @instance
         * @description
         return the width of the fixed column area
         * #### returns: integer
         */
        getFixedColumnsWidth: function() {
            var count = this.getFixedColumnCount();
            var total = 0;
            for (var i = 0; i < count; i++) {
                total = total + this.getFixedColumnWidth(i);
            }
            return total;
        },

        /**
         * @function
         * @instance
         * @description
         set the width of a specific column in the fixed column area
         * @param {integer} colNumber - the column index of interest
         * @param {integer} width - the width in pixels
         */
        setFixedColumnWidth: function(colNumber, width) {
            var tableState = this.getState();
            tableState.fixedColumnWidths[colNumber] = Math.max(5, width);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         return the potential total width of the fixed columns area; this exists to support 'floating' columns
         * #### returns: integer
         */
        getFixedColumnsMaxWidth: function() {
            var width = this.getFixedColumnsWidth();
            return width;
        },

        /**
         * @function
         * @instance
         * @description
         return the width of a specific column in the fixed column area
         * #### returns: integer
         * @param {integer} colNumber - the column index of interest
         */
        getFixedColumnWidth: function(colNumber) {
            var tableState = this.getState();
            var override = tableState.fixedColumnWidths[colNumber];
            if (override) {
                return override;
            }
            return this.resolveProperty('defaultFixedColumnWidth');
        },

        /**
         * @function
         * @instance
         * @description
         return the behavior column width of specific column given a view column index
         * #### returns: integer
         * @param {integer} x - the view column index
         */
        _getColumnWidth: function(x) {
            x = this.translateColumnIndex(x);
            return this.getColumnWidth(x);
        },

        /**
         * @function
         * @instance
         * @description
         set the width of a specific column in the model given a view column index
         * @param {integer} x - the view column index
         * @param {integer} width - the width in pixels
         */
        _setColumnWidth: function(x, width) {
            x = this.translateColumnIndex(x);
            this.setColumnWidth(x, width);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         set the scroll position in vertical dimension and notifiy listeners
         * @param {integer} y - the new y value
         */
        _setScrollPositionY: function(y) {
            this.setScrollPositionY(y);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         set the scroll position in horizontal dimension and notifiy listeners
         * @param {integer} x - the new x value
         */
        _setScrollPositionX: function(x) {
            this.setScrollPositionX(x);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         set the number of columns just rendered, includes partially rendered columns
         * @param {integer} count - how many columns were just rendered
         */
        setRenderedColumnCount: function(count) {
            this.renderedColumnCount = count;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of rows just rendered, includes partially rendered rows
         * @param {integer} count - how many rows were just rendered
         */
        setRenderedRowCount: function(count) {
            this.renderedRowCount = count;
        },

        /**
         * @function
         * @instance
         * @description
         return the view translated alignment for column x
         * #### returns: string ['left','center','right']
         * @param {integer} x - the column index of interest
         */
        _getColumnAlignment: function(x) {
            x = this.translateColumnIndex(x);
            return this.getColumnAlignment(x);
        },

        /**
         * @function
         * @instance
         * @description
         return the alignment at x,y of the top left area
         * #### returns: string ['left','center','right']
         * @param {integer} x - the x coordinate
         * @param {integer} x - the y coordinate
         */
        getTopLeftAlignment: function( /* x, y */ ) {
            return 'center';
        },

        /**
         * @function
         * @instance
         * @description
         return the alignment at x for the fixed column area
         * #### returns: string ['left','center','right']
         * @param {integer} x - the fixed column index of interest
         */
        getFixedColumnAlignment: function( /* x */ ) {
            return this.resolveProperty('fixedColumnAlign');
        },

        /**
         * @function
         * @instance
         * @description
         return the view translated alignment at x,y in the fixed row area
         * #### returns: string ['left','center','right']
         * @param {integer} x - the fixed column index of interest
         * @param {integer} y - the fixed row index of interest
         */
        _getFixedRowAlignment: function(x, y) {
            x = this.translateColumnIndex(x);
            return this.getFixedRowAlignment(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         the top left area has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        topLeftClicked: function(grid, mouse) {
            if (mouse.gridCell.x < this.getState().fixedColumnCount) {
                this.fixedRowClicked(grid, mouse);
            } else {
                console.log('top Left clicked: ' + mouse.gridCell.x, mouse);
            }
        },

        /**
         * @function
         * @instance
         * @description
         the fixed row area has been clicked, massage the details and call the real function
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        _fixedRowClicked: function(grid, mouse) {
            var x = this.translateColumnIndex(mouse.gridCell.x - this.getFixedColumnCount());
            var translatedPoint = this.grid.rectangles.point.create(this.scrollPositionX + x, mouse.gridCell.y);
            mouse.gridCell = translatedPoint;
            this.fixedRowClicked(grid, mouse);
        },

        /**
         * @function
         * @instance
         * @description
         the fixed column area has been clicked, massage the details and call the real function
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
        */
        _fixedColumnClicked: function(grid, mouse) {
            var translatedPoint = this.grid.rectangles.point.create(mouse.gridCell.x, this.scrollPositionY + mouse.gridCell.y - this.getFixedRowCount());
            mouse.gridCell = translatedPoint;
            this.fixedColumnClicked(grid, mouse);
        },

        /**
         * @function
         * @instance
         * @description
         delegate setting the cursor up the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        setCursor: function(grid) {
            grid.updateCursor();
            this.featureChain.setCursor(grid);
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse move to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onMouseMove: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseMove(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling tap to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onTap: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleTap(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling wheel moved to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onWheelMoved: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleWheelMoved(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse up to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onMouseUp: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseUp(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse drag to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onMouseDrag: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseDrag(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling key down to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onKeyDown: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleKeyDown(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling key up to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onKeyUp: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleKeyUp(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling double click to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onDoubleClick: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleDoubleClick(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling hold pulse to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onHoldPulse: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleHoldPulse(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse down to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        handleMouseDown: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseDown(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse exit to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        handleMouseExit: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseExit(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         return the cell editor for cell at x,y
         * #### returns: [fin-hypergrid-cell-editor-base](module-cell-editors_base.html)
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        _getCellEditorAt: function(x, y) {
            noop(y);
            x = this.translateColumnIndex(x);
            return this.getCellEditorAt(x);
        },

        /**
         * @function
         * @instance
         * @description
         this function is replaced by the grid on initialization and serves as the callback
         */
        changed: function() {},

        /**
         * @function
         * @instance
         * @description
         this function is replaced by the grid on initialization and serves as the callback
         */
        shapeChanged: function() {},

        /**
         * @function
         * @instance
         * @description
         return true if we can re-order columns
         * #### returns: boolean
         */
        isColumnReorderable: function() {
            return true;
        },

        /**
         * @function
         * @instance
         * @description
         return the properties for a specific column, these are used if no cell properties are specified
         * #### returns: Object
         * @param {index} columnIndex - the column index of interest
         */
        getColumnProperties: function(columnIndex) {
            //if no cell properties are supplied these properties are used
            //this probably should be moved into it's own object
            // this.clearObjectProperties(this.columnProperties);
            // if (columnIndex === 4) {
            //     this.columnProperties.bgColor = 'maroon';
            //     this.columnProperties.fgColor = 'white';
            // }
            var tableState = this.getState();
            var properties = tableState.columnProperties[columnIndex];
            if (!properties) {
                properties = {};
                tableState.columnProperties[columnIndex] = properties;
            }
            return properties;
        },

        setColumnProperty: function(columnIndex, key, value) {
            var properties = this.getColumnProperties(columnIndex);
            properties[key] = value;
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         returns the list of labels to use for the column picker
         * #### returns: Array of strings
         */
        getColumnDescriptors: function() {
            //assumes there is one row....
            this.insureColumnIndexesAreInitialized();
            var tableState = this.getState();
            var columnCount = tableState.columnIndexes.length;
            var fixedColumnCount = this.getState().fixedColumnCount;
            var labels = [];
            for (var i = 0; i < columnCount; i++) {
                var id = tableState.columnIndexes[i];
                if (id >= fixedColumnCount) {
                    labels.push({
                        id: id,
                        label: this.getHeader(id),
                        field: this.getField(id)
                    });
                }
            }
            return labels;
        },

        /**
         * @function
         * @instance
         * @description
         return the field at colIndex
         * #### returns: string
         * @param {integer} colIndex - the column index of interest
         */
        getField: function(colIndex) {
            return colIndex;
        },

        /**
         * @function
         * @instance
         * @description
         return the column heading at colIndex
         * #### returns: string
         * @param {integer} colIndex - the column index of interest
         */
        getHeader: function(colIndex) {
            return this.getFixedRowValue(colIndex, 0);
        },

        /**
         * @function
         * @instance
         * @description
         this is called by the column editor post closing; rebuild the column order indexes
         * @param {Array} list - list of column objects from the column editor
         */
        setColumnDescriptors: function(list) {
            //assumes there is one row....
            var tableState = this.getState();
            var fixedColumnCount = this.getState().fixedColumnCount;

            var columnCount = list.length;
            var indexes = [];
            var i;
            for (i = 0; i < fixedColumnCount; i++) {
                indexes.push(i);
            }
            for (i = 0; i < columnCount; i++) {
                indexes.push(list[i].id);
            }
            tableState.columnIndexes = indexes;
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         return an Array of strings of the column header labels that are currently hidden
         * #### returns: Array of strings
         */
        getHiddenColumnDescriptors: function() {
            var tableState = this.getState();
            var indexes = tableState.hiddenColumns;
            var labels = new Array(indexes.length);
            for (var i = 0; i < labels.length; i++) {
                var id = indexes[i];
                labels[i] = {
                    id: id,
                    label: this.getHeader(id),
                    field: this.getField(id)
                };
            }
            return labels;
        },

        /**
         * @function
         * @instance
         * @description
         set which column are hidden post column editor close
         * @param {Array} list - the list column descriptors
         */
        setHiddenColumnDescriptors: function(list) {
            //assumes there is one row....
            var columnCount = list.length;
            var indexes = new Array(columnCount);
            for (var i = 0; i < columnCount; i++) {
                indexes[i] = list[i].id;
            }
            var tableState = this.getState();
            tableState.hiddenColumns = indexes;
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         hide columns that are specified by their indexes
         * @param {Array} arrayOfIndexes - an array of column indexes to hide
         */
        hideColumns: function(arrayOfIndexes) {
            var tableState = this.getState();
            var indexes = tableState.hiddenColumns;
            var order = tableState.columnIndexes;
            for (var i = 0; i < arrayOfIndexes.length; i++) {
                var each = arrayOfIndexes[i];
                if (indexes.indexOf(each) === -1) {
                    indexes.push(each);
                    order.splice(order.indexOf(each), 1);
                }
            }
        },

        /**
         * @function
         * @instance
         * @description
         return the number of fixed columns
         * #### returns: integer
         */
        getFixedColumnCount: function() {
            var tableState = this.getState();
            return tableState.fixedColumnCount || 0;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of fixed columns
         * @param {integer} numberOfFixedColumns - the integer count of how many columns to be fixed
         */
        setFixedColumnCount: function(numberOfFixedColumns) {
            var tableState = this.getState();
            tableState.fixedColumnCount = numberOfFixedColumns;
        },

        /**
         * @function
         * @instance
         * @description
         return the count of fixed rows
         * #### returns: integer
         */
        getFixedRowCount: function() {
            return this.tableState.fixedRowCount || 0;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of rows that are fixed
         * @param {integer} numberOfFixedRows - the count of rows to be set fixed
         */
        setFixedRowCount: function(numberOfFixedRows) {
            this.tableState.fixedRowCount = numberOfFixedRows;
        },

        /**
         * @function
         * @instance
         * @description
         build and open the editor within the container div argument, this function should return false if we don't want the editor to open
         * #### returns: boolean
         * @param {HTMLDivElement} div - the containing div element
         */
        openEditor: function(div) {
            var container = document.createElement('div');

            var hidden = document.createElement('fin-hypergrid-dnd-list');
            var visible = document.createElement('fin-hypergrid-dnd-list');

            container.appendChild(hidden);
            container.appendChild(visible);

            this.beColumnStyle(hidden.style);
            hidden.title = 'hidden columns';
            hidden.list = this.getHiddenColumnDescriptors();

            this.beColumnStyle(visible.style);
            visible.style.left = '50%';
            visible.title = 'visible columns';
            visible.list = this.getColumnDescriptors();

            div.lists = {
                hidden: hidden.list,
                visible: visible.list
            };
            div.appendChild(container);
            return true;
        },

        /**
         * @function
         * @instance
         * @description
         the editor is requesting close return true or false, and deal with the edits
         * @param {HTMLDivElement} div - the containing div element
         */
        closeEditor: function(div) {
            noop(div);
            var lists = div.lists;
            this.setColumnDescriptors(lists.visible);
            this.setHiddenColumnDescriptors(lists.hidden);
            return true;
        },

        /**
         * @function
         * @instance
         * @description
         a dnd column has just been dropped, we've been notified
         */
        endDragColumnNotification: function() {},

        /**
         * @function
         * @instance
         * @description
         bind column editor appropriate css values to arg style
         * @param {HTMLStyleElement} style - the style object to enhance
         */
        beColumnStyle: function(style) {
            style.top = '5%';
            style.position = 'absolute';
            style.width = '50%';
            style.height = '99%';
            style.whiteSpace = 'nowrap';
        },

        /**
         * @function
         * @instance
         * @description
         return the cursor at a specific x,y coordinate
         * #### returns: string
         * @param {integer} x - the x coordinate
         * @param {integer} y - the y coordinate
         */
        getCursorAt: function( /* x, y */ ) {
            return null;
        },

        /**
         * @function
         * @instance
         * @description
         return the data value at coordinates x,y.  this is the main "model" function that allows for virtualization
         * #### returns: Object
         * @param {integer} x - the x coordinate
         * @param {integer} y - the y coordinate
         */
        getValue: function(x, y) {
            return x + ', ' + y;
        },

        /**
         * @function
         * @instance
         * @description
         set the data value at coordinates x,y
         * @param {integer} x - the x coordinate
         * @param {integer} y - the y coordinate
         */
        setValue: function(x, y, value) {
            this.dataUpdates['p_' + x + '_' + y] = value;
        },

        /**
         * @function
         * @instance
         * @description
         return the total number of columns
         * #### returns: integer
         */
        getColumnCount: function() {
            return 300;
        },

        /**
         * @function
         * @instance
         * @description
         return the column width at index x
         * #### returns: integer
         * @param {integer} x - the column index of interest
         */
        getColumnWidth: function(x) {
            var tableState = this.getState();
            var override = tableState.columnWidths[x];
            if (override) {
                return override;
            }
            return this.resolveProperty('defaultColumnWidth');
        },

        /**
         * @function
         * @instance
         * @description
         set the column width at column x
         * @param {integer} x - the column index of interest
         * @param {integer} width - the width in pixels
         */
        setColumnWidth: function(x, width) {
            var tableState = this.getState();
            tableState.columnWidths[x] = Math.max(5, width);
        },

        /**
         * @function
         * @instance
         * @description
         return the column alignment at column x
         * #### returns: string ['left','center','right']
         * @param {integer} x - the column index of interest
         */
        getColumnAlignment: function( /* x */ ) {
            return 'center';
        },

        /**
         * @function
         * @instance
         * @description
         quietly set the scroll position in the horizontal dimension
         * @param {integer} x - the position in pixels
         */
        setScrollPositionX: function(x) {
            this.scrollPositionX = x;
        },

        /**
         * @function
         * @instance
         * @description
         quietly set the scroll position in the horizontal dimension
         * #### returns: type
         * @param {integer} y - the position in pixels
         */
        setScrollPositionY: function(y) {
            this.scrollPositionY = y;
        },

        /**
         * @function
         * @instance
         * @description
         get the view translated alignment at x,y in the fixed row area
         * #### returns: string ['left','center','right']
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getFixedRowAlignment: function(x, y) {
            noop(x, y);
            return this.resolveProperty('fixedRowAlign');
        },

        /**
         * @function
         * @instance
         * @description
         return the data value at point x,y
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getFixedRowValue: function(x /*, y*/ ) {
            return x;
        },

        /**
         * @function
         * @instance
         * @description
         return the cell editor for coordinate x,y
         * #### returns: [fin-hypergrid-cell-editor-base](module-cell-editors_base.html)
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getCellEditorAt: function(x, y) {
            noop(x, y);
            var cellEditor = this.grid.resolveCellEditor('textfield');
            return cellEditor;
        },

        /**
         * @function
         * @instance
         * @description
         fixed row has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        fixedRowClicked: function(grid, mouse) {
            this.toggleSort(mouse.gridCell.x);
        },

        /**
         * @function
         * @instance
         * @description
         toggle the sort at colIndex to it's next state
         * @param {integer} colIndex - the column index of interest
         */
        toggleSort: function(colIndex) {
            console.log('toggleSort(' + colIndex + ')');
        },

        /**
         * @function
         * @instance
         * @description
         fixed column has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        fixedColumnClicked: function(grid, mouse) {
            console.log('fixedColumnClicked(' + mouse.gridCell.x + ', ' + mouse.gridCell.y + ')');
        },

        /**
         * @function
         * @instance
         * @description
         returns true if we should highlight on hover
         * #### returns: boolean
         * @param {boolean} isColumnHovered - the column is hovered or not
         * @param {boolean} isRowHovered - the row is hovered or not
         */
        highlightCellOnHover: function(isColumnHovered, isRowHovered) {
            return isColumnHovered && isRowHovered;
        },

        /**
         * @function
         * @instance
         * @description
         return the columnId/label/fixedRowValue at x
         * #### returns: string
         * @param {integer} x - the view translated x index
         */
        getColumnId: function(x) {
            x = this.translateColumnIndex(x);
            var col = this.getFixedRowValue(x, 0);
            return col;
        },

        /**
         * @function
         * @instance
         * @description
         return an HTMLImageElement given it's alias
         * #### returns: HTMLImageElement
         * @param {string} key - an image alias
         */
        getImage: function(key) {
            var image = imageCache[key];
            return image;
        },


        /**
         * @function
         * @instance
         * @description
         set the image for a specific alias
         * @param {string} key - an image alias
         * @param {HTMLImageElement} image - the image to cache
         */
        setImage: function(key, image) {
            imageCache[key] = image;
        },

        /**
         * @function
         * @instance
         * @description
         check to see that columns are at their minimum width to display all data
         * @param {Array} fixedMinWidths - the minimum sizes to fit all data for each column in the fixed area
         * @param {Array} minWidths - the minimum sizes to fit all data for each column in the data area
         */
        checkColumnAutosizing: function(fixedMinWidths, minWidths) {
            var self = this;
            var tableState = this.getState();
            var myFixed = tableState.fixedColumnWidths;
            var myWidths = tableState.columnWidths;
            var repaint = false;
            var a, b, c, d = 0;
            for (c = 0; c < fixedMinWidths.length; c++) {
                a = myFixed[c];
                b = fixedMinWidths[c];
                d = tableState.fixedColumnAutosized[c];
                if (a !== b || !d) {
                    myFixed[c] = !d ? b : Math.max(a, b);
                    tableState.fixedColumnAutosized[c] = true;
                    repaint = true;
                }
            }
            for (c = 0; c < minWidths.length; c++) {
                var ti = this.translateColumnIndex(c);
                a = myWidths[ti];
                b = minWidths[c];
                d = tableState.columnAutosized[c];
                if (a !== b || !d) {
                    myWidths[ti] = !d ? b : Math.max(a, b);
                    tableState.columnAutosized[c] = true;
                    repaint = true;
                }
            }
            if (repaint) {
                setTimeout(function() {
                    self.shapeChanged();
                });
            }
        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        cellPrePaintNotification: function( /* cell */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a fixed row cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        cellFixedRowPrePaintNotification: function( /* cell */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a fixed column cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
        */
        cellFixedColumnPrePaintNotification: function( /* cell */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a top left cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        cellTopLeftPrePaintNotification: function( /* cell */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         this function enhance the double click event just before it's broadcast to listeners
         * @param {Object} event - event to enhance
         */
        enhanceDoubleClickEvent: function( /* event */ ) {},

    });
})();
