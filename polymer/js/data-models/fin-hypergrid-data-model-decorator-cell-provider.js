'use strict';

(function() {

    Polymer('fin-hypergrid-data-model-decorator-cell-provider', { /* jshint ignore:line  */


        getCellRenderer: function(config, x, y /* , untranslatedX, untranslatedY */ ) {
            //this needs to be rethought
            var provider = this.getCellProvider();
            var grid = this.getGrid();
            if (x < 1) {
                config.font = config.fixedColumnFont;
                if (grid.isFixedColumnCellSelected(y)) {
                    config.backgroundColor = config.fixedColumnBGSelColor;
                    config.color = config.fixedColumnFGSelColor;
                } else {
                    config.color = config.fixedColumnColor;
                    config.backgroundColor = config.fixedColumnBackgroundColor;
                }
                return provider.getFixedColumnCell(config);
            } else if (y < 1) {
                config.font = config.fixedRowFont;
                if (grid.isFixedRowCellSelected(x)) {
                    config.backgroundColor = config.fixedRowBGSelColor;
                    config.color = config.fixedRowFGSelColor;
                } else {
                    config.color = config.fixedRowColor;
                    config.backgroundColor = config.fixedRowBackgroundColor;
                }
                return provider.getFixedRowCell(config);
            } else {
                delete config.font;
                delete config.color;
                delete config.backgroundColor;
                return provider.getCell(config);
            }
        },

    });

})();
