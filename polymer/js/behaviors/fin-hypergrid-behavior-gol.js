'use strict';
/**
 *
 * @module behaviors\gol
 *
 */
(function() {

    var noop = function() {};

    var patterns = [
        [
            [false, true, true, true, false],
            [true, false, true, false, true],
            [false, false, true, false, false]
        ],
        [
            [false, true, false],
            [true, false, false],
            [true, true, true]
        ]
    ];
    var colors = ['#ffffff', '#ffffff', '#efefef', '#00e7e7', '#00dfdf', '#00d7d7', '#00cfcf', '#00c7c7'];

    Polymer({ /* jslint ignore:line */

        /**
         * @property {integer} rows - the number of rows
         * @instance
         */
        rows: 45,

        /**
         * @property {integer} columns - the number of columns
         * @instance
         */
        columns: 75,

        /**
         * @property {Array} data - the matrix of data
         * @instance
         */
        data: [],

        /**
         * @property {Array} buffer - double buffer the data
         * @instance
         */
        buffer: [],

        /**
         * @property {boolean} running - flag if were running or not
         * @instance
         */
        running: false,

        /**
        * @function
        * @instance
        * @description
        polymer lifecycle event
        */
        ready: function() {
            this.readyInit();
            this.rows = this.getAttribute('rows') || this.rows;
            this.columns = this.getAttribute('columns') || this.columns;
            this.resetPetriDish();
            this.running = false;
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
            provider.cellCache.simpleCellRenderer.paint = function(gc, x, y, width, height) {
                var weight = this.config.value[1];
                if (weight === 0) {
                    return;
                }
                var color = colors[weight];
                if (this.config.value[0]) {
                    color = this.config.fgColor;
                }

                gc.fillStyle = color;
                gc.fillRect(x, y, width, height);
            };
            return provider;
        },

        /**
        * @function
        * @instance
        * @description
        reset the gamegrid
        */
        resetPetriDish: function() {
            this.data = [];
            this.buffer = [];
            this.initializeData(this.data);
            this.initializeData(this.buffer);
            this.populate();
            this.changed();
        },

        /**
        * @function
        * @instance
        * @description
        fill the gamegrid with random valued well known gol templates
        */
        populate: function() {
            var x = 0;
            var y = 0;
            for (var i = 0; i < 15; i++) {
                y = Math.round(Math.random() * this.rows * 0.60);
                x = Math.round(Math.random() * this.columns * 0.60);
                this.applyPatternAt(this.data, x, y, patterns[i % 2], i % 4);
            }
        },

        /**
        * @function
        * @instance
        * @description
        initialize a gamegrid with empty data
        * @param {Array} array2D - a 2d matrix gamegrid
        */
        initializeData: function(array2D) {
            for (var c = 0; c < this.columns; c++) {
                var col = [];
                array2D.push(col);
                for (var r = 0; r < this.rows; r++) {
                    col.push([false, 0]);
                }
            }
        },

        /**
        * @function
        * @instance
        * @description
        turn gol on/off
        */
        toggleRunning: function() {
            this.running = !this.running;
            if (this.running) {
                this.startLife();
            }
        },

        /**
        * @function
        * @instance
        * @description
        start gol
        */
        startLife: function() {
            if (!this.running) {
                return;
            }
            for (var c = 1; c < this.columns - 2; c++) {
                for (var r = 1; r < this.rows - 2; r++) {
                    this.computeLifeAt(c, r);
                }
            }
            var temp = this.buffer;
            this.buffer = this.data;
            this.data = temp;
            this.changed();
            setTimeout(this.startLife.bind(this), 125);
        },

        /**
        * @function
        * @instance
        * @description
        apply the gol rules at a specific point
        */
        computeLifeAt: function(x, y) {
            var me = this._getValue(x, y);
            var total = this.getNeighborCount(x, y);
            me[1] = total;
            if (me[0]) {
                // Any live cell with fewer than two live neighbours dies, as if caused by under-population.
                // Any live cell with two or three live neighbours lives on to the next generation.
                // Any live cell with more than three live neighbours dies, as if by overcrowding.
                if (total < 2) {
                    this.buffer[x][y] = [false, 0];
                } else if (total < 4) {
                    this.buffer[x][y] = [true, 1];
                } else {
                    this.buffer[x][y] = [false, 0];
                }
            } else {
                // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                this.buffer[x][y] = [(total === 3), total];
            }

        },

        /**
        * @function
        * @instance
        * @description
        return the total weight around point x,y
        * #### returns: float
        * @param {integer} x - x coordinate
        * @param {integer} y - y coordinate
        */
        getNeighborCount: function(x, y) {
            var data = this.data;
            var total = 0;
            if (data[x - 1][y - 1][0]) {
                total++;
            }
            if (data[x - 1][y][0]) {
                total++;
            }
            if (data[x - 1][y + 1][0]) {
                total++;
            }

            if (data[x][y - 1][0]) {
                total++;
            }
            if (data[x][y + 1][0]) {
                total++;
            }

            if (data[x + 1][y - 1][0]) {
                total++;
            }
            if (data[x + 1][y][0]) {
                total++;
            }
            if (data[x + 1][y + 1][0]) {
                total++;
            }

            return total;
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
            return this.data[x][y];
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
            this.data[x][y] = value;
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
            return y;
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
        getFixedRowValue: function(x, y) {
            noop(x, y);
            return '';
        },

        /**
         * @function
         * @instance
         * @description
         return the number of fixed columns
         * #### returns: integer
         */
        getFixedColumnCount: function() {
            return 0;
        },

        /**
         * @function
         * @instance
         * @description
         return the count of fixed rows
         * #### returns: integer
         */
        getFixedRowCount: function() {
            return 0;
        },

        /**
         * @function
         * @instance
         * @description
         return the total number of columns
         * #### returns: integer
         */
        getColumnCount: function() {
            return this.data.length;
        },

        /**
         * @function
         * @instance
         * @description
         return the number of rows
         * #### returns: integer
         */
        getRowCount: function() {
            return this.data[0].length;
        },

        /**
         * @function
         * @instance
         * @description
         get height in pixels of a specific row
         * #### returns: integer
         * @param {integer} rowNum - row index of interest
         */
        getRowHeight: function(y) {
            noop(y);
            return 10;
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
            noop(x);
            return 10;
        },

        /**
        * @function
        * @instance
        * @description
        provide the label for the toggle state
        * #### returns: string
        */
        getNextState: function() {
            if (this.running) {
                return 'pause';
            } else {
                return 'play';
            }
        },
        /**
         * @function
         * @instance
         * @description
         toggle the value at position specified by the mouse point
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onTap: function(grid, mouse) {

            var mX = this.getScrollPositionX() + mouse.gridCell.x;
            var mY = this.getScrollPositionY() + mouse.gridCell.y;

            var v = this._getValue(mX, mY)[0];
            this._setValue(mX, mY, [!v, 1]);
            this.changed();
        },

        /**
        * @function
        * @instance
        * @description
        apply the gol well known template at x,y
        * @param {Array} array - an array2D gamegrid to modifiy
        * @param {integer} c - column coordinate
        * @param {integer} r - row coordinate
        * @param {Array} pattern - a 2d matrix of a well known gol template
        * @param {integer} dir - direction to rotate the pattern
        */
        applyPatternAt: function(array, c, r, pattern, dir) {
            var w = pattern.length;
            var h = pattern[0].length;
            var x = 0;
            var y = 0;
            if (dir === 0) {
                for (x = 0; x < w; x++) {
                    for (y = 0; y < h; y++) {
                        array[x + c][y + r] = [pattern[w - x - 1][y], 1];
                    }
                }
            } else if (dir === 1) {
                for (x = 0; x < w; x++) {
                    for (y = 0; y < h; y++) {
                        array[x + c][y + r] = [pattern[x][y], 1];
                    }
                }
            } else if (dir === 2) {
                for (x = 0; x < w; x++) {
                    for (y = 0; y < h; y++) {
                        array[y + c][x + r] = [pattern[x][y], 1];
                    }
                }
            } else {
                for (x = 0; x < w; x++) {
                    for (y = 0; y < h; y++) {
                        array[y + c][x + r] = [pattern[w - x - 1][y], 1];
                    }
                }
            }
        }

    });

})(); /* jslint ignore:line */
