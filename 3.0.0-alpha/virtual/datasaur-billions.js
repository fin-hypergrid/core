(function(Hypergrid) {
    var COLUMNS = 1000, // Math.pow(26, 1) + Math.pow(26, 2), // A..ZZ
        ROWS = 5000;

    Hypergrid.modules.DatasaurMillions = Hypergrid.require('datasaur-local').extend('DatasaurMillions',  {

        initialize: function(datasaur, options) {
            this.cachedRowCount = 0;
            this.clearCache = true;
        },

        fetchData: function(rectangles, callback) {
            var data = this.data, schema = this.schema;
            if (this.clearCache) {
                data = this.data = [];
                this.cachedRowCount = 0;
            }
            var acc = 0;
            rectangles.forEach(function(rectangle) {
                for (var y = rectangle.origin.y, Y = rectangle.corner.y; y < Y; ++y) {
                    var dataRow = data[y];
                    if (!dataRow) {
                        dataRow = data[y] = {};
                        acc += 1;
                    }
                    for (var x = rectangle.origin.x, X = rectangle.corner.x; x < X; ++x) {
                        var name = schema[x].name;
                        dataRow[name] = name + ':' + y;
                    }
                }
            });
            document.getElementById('cached-rows-count').innerHTML = this.cachedRowCount += acc;
            if (callback && Math.random() > parseInt('0' + document.getElementById('failure-rate').value) / 100) {
                var latency = parseInt('0' + document.getElementById('latency').value);
                if (latency) {
                    setTimeout(callback.bind(this), latency);
                } else {
                    callback.call(this);
                }
            }
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

    var BASE = 26, A = 'A'.charCodeAt();

    function excelColumnName(x) {
        var result = '';
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