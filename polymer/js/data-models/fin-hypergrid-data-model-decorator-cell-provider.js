'use strict';

(function() {

    Polymer('fin-hypergrid-data-model-decorator-cell-provider', { /* jshint ignore:line  */

        getCellRenderer: function(config, x, y, untranslatedX, untranslatedY) {
            var renderer;
            var behavior = this.getBehavior();
            var provider = this.getCellProvider();
            var rowHeaderCount = behavior.getHeaderColumnCount();
            var colHeaderCount = behavior.getHeaderRowCount();

            config.x = x;
            config.y = y;
            config.untranslatedX = untranslatedX;
            config.untranslatedY = untranslatedY;

            if (config.untranslatedX < rowHeaderCount || config.untranslatedY < colHeaderCount) {
                renderer = provider.cellCache.simpleCellRenderer;
            } else {
                renderer = provider.getCell(config);
            }
            renderer.config = config;
            return renderer;
        },

    });

})();
