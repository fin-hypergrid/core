'use strict';

var callbackOrdinal = 0;

(function(Hypergrid) {
    var COLUMNS = 1000, // Math.pow(26, 1) + Math.pow(26, 2), // A..ZZ
        ROWS = 5000;

    Hypergrid.modules.DatasaurBillions = Hypergrid.require('datasaur-local').extend('DatasaurBillions',  {

        initialize: function(datasaur, options) {
            this.cachedRowCount = 0;
            this.clearCache = true;
        },

        fetchData: function(rectangles, callback) {
            if (this.clearCache) {
                this.data = [];
                this.cachedRowCount = 0;
                this.lastSuccessfullyFetchedRects = false;
            }

            fetchData.call(this, rectangles, callback);
        },

        // return true for all data fetched, false if any data missing
        gotData: function(rects) {
            if (
                this.lastSuccessfullyFetchedRects &&
                this.lastSuccessfullyFetchedRects.length === rects.length &&
                this.lastSuccessfullyFetchedRects.every(function(oldRect, i) {
                    return (
                        oldRect.origin.equals(rects[i].origin) &&
                        oldRect.corner.equals(rects[i].corner)
                    );
                })
            ) {
                return true; // shortcut when requested rects same as last successfully fetched rects
            }

            var data = this.data,
                schema = this.schema;

            // for better performance, we first
            // (1) check all rects for any missing rows before
            // (2) checking rows for any missing cells
            return !(
                rects.find(function(rect) { // (1)
                    for (var y = rect.origin.y, Y = rect.corner.y; y < Y; ++y) {
                        var dataRow = data[y];
                        if (!dataRow) {
                            return true;
                        }
                    }
                })
                ||
                rects.find(function(rect) { // (2)
                    for (var y = rect.origin.y, Y = rect.corner.y; y < Y; ++y) {
                        var dataRow = data[y];
                        for (var x = rect.origin.x, X = rect.corner.x; x < X; ++x) {
                            if (!(schema[x].name in dataRow)) {
                                return true;
                            }
                        }
                    }
                })
            );
        },


        setSchema: function(newSchema){
            if (!newSchema.length) {
                var schema = this.schema = Array(COLUMNS);
                for (var i = 0; i < COLUMNS; i++) {
                    var name = excelColumnName(i);
                    schema[i] = { name: name, header: name };
                }
            }

            this.dispatchEvent('fin-hypergrid-schema-loaded');
        },


        /**
         * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowCount}
         * @memberOf DatasaurLocal#
         */
        getRowCount: function() {
            return ROWS;
        },

        /**
         * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getColumnCount}
         * @memberOf DatasaurLocal#
         */
        getColumnCount: function() {
            return COLUMNS;
        }
    });

    function fetchData(rectangles, callback) {
        var latency = this.latency,
            fillAndCall = function(ordinal) {
                if (!latency || Math.random() > this.failureRate) {
                    // case 1: no latency (always succeeds)
                    // case 2.1: lazy success
                    fillRects.call(this, rectangles);
                    this.lastSuccessfullyFetchedRects = rectangles;
                    if (this.trace) { console.log(ordinal + ' callback'); } // observe non-deterministic order of callbacks
                    if (callback) { callback(false); } // falsy means success (Hypergrid currently not using this value)
                } else if (this.autoRetry) {
                    // case 2.2: lazy retry
                    if (this.trace) { console.log(ordinal + ' retry'); }
                    setTimeout(fetchData.bind(this, rectangles, callback),
                        Math.random() < .2 ? 5 * latency : latency); // simulate a data server timeout (5 x latency) as cause of failure 20% of the time;
                } else {
                    // case 2.3: lazy failure
                    if (this.trace) { console.log(ordinal + ' failure'); }
                    if (callback) { callback(true); } // truthy means error (Hypergrid currently not using this value)
                }
            };

        if (latency) {
            // apply latency fudge factor
            var randomFactor = Math.random(),
                direction = Math.random() > .5 ? 1 : -1;

            latency += direction * randomFactor * latency * this.latencyDeviation;

            // case 2: lazy with latency ± a randomly factored latency deviation
            setTimeout(fillAndCall.bind(this, ++callbackOrdinal), latency);
        } else {
            // case 1: no latency
            fillAndCall.call(this, ++callbackOrdinal);
        }
    }

    function fillRects(rects) {
        var data = this.data,
            schema = this.schema,
            rows = 0;

        rects.forEach(function(rect) {
            for (var y = rect.origin.y, Y = Math.min(rect.corner.y, ROWS); y < Y; ++y) {
                var dataRow = data[y];
                if (!dataRow) {
                    dataRow = data[y] = {};
                    rows += 1;
                }
                for (var x = rect.origin.x, X = rect.corner.x; x < X; ++x) {
                    var name = schema[x].name;
                    dataRow[name] = name + ':' + (y + 1);
                }
            }
        });

        document.getElementById('cached-row-count').innerHTML = this.cachedRowCount += rows;
    }

    function parseTextInput(id) {
        return parseInt('0' + document.getElementById(id).value, 10);
    }

    // https://www.johndcook.com/blog/2010/04/29/simple-approximation-to-normal-distribution/
    // Input: -3 <= stdDev <= +3
    // Output: 0.0 <= value <= 1.0
    // This rough approximation of a bell curve is NOT asymptotic.
    // It is 2π wide so the x input conveniently gives rough standard deviations so I've called it stdDev rather than x.
    function approxBellCurve(stdDev) {
        return (1 + Math.cos(stdDev)) / (2 * Math.PI) * Math.PI;
    }

    var BASE = 26, A = 'A'.charCodeAt();

    function excelColumnName(x) {
        var result = '', digits;
        for (var n = 1, range = 0, base = 0; true; n++, base = range) {
            range += Math.pow(BASE, n);
            if (x < range) {
                digits = n;
                x -= base;
                break;
            }
        }

        for (var i = 0; i < digits; ++i) {
            result = String.fromCharCode(A + x % 26) + result;
            x = Math.floor(x / 26);
        }

        return result;
    }
})(fin.Hypergrid);