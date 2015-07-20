'use strict';

(function() {

    Polymer('fin-hypergrid-data-model-decorator-cell-provider', { /* jshint ignore:line  */

        cellProvider: null,

        setCellProvider: function(newCellProvider) {
            this.cellProvider = newCellProvider;
        },

        getCellProvider: function() {
            return this.cellProvider;
        },

        getCellRenderer: function(config, x, y, untranslatedX, untranslatedY) {
            var provider = this.getCellProvider();
            if (x < 1) {
                config.font = config.fixedColumnFont;
                config.backgroundColor = config.fixedColumnBackgroundColor;
                return provider.getFixedColumnCell(config);
            } else if (y < 1) {
                config.font = config.fixedRowFont;
                config.backgroundColor = config.fixedRowBackgroundColor;
                return provider.getFixedRowCell(config)
            } else {
                config.backgroundColor = 'white';
                return provider.getCell(config);
            }
        },

    });

})();
