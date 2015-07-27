'use strict';

(function() {

    Polymer('fin-hypergrid-data-model-decorator-cell-provider', { /* jshint ignore:line  */


        getCellRenderer: function(config /*, x, y, untranslatedX, untranslatedY */ ) {
            var provider = this.getCellProvider();
            return provider.getCell(config);
        },

        getCellRendererX: function(config, x, y /* , untranslatedX, untranslatedY */ ) {
            //this needs to be rethought
            var grid = this.getGrid();
            var provider = this.getCellProvider();
            var behavior = grid.getBehavior();
            var headerRowCount = behavior.getHeaderRowCount();
            var headerColumnCount = behavior.getHeaderColumnCount();

            if (x < headerColumnCount) {
                config.font = config.fixedColumnFont;
                if (grid.isFixedColumnCellSelected(y)) {
                    config.backgroundColor = config.fixedColumnBGSelColor;
                    config.color = config.fixedColumnFGSelColor;
                } else {
                    config.color = config.fixedColumnColor;
                    config.backgroundColor = config.fixedColumnBackgroundColor;
                }
                return provider.getFixedColumnCell(config);
            } else if (y < headerRowCount) {
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
