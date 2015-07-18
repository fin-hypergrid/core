'use strict';

(function() {

    Polymer('fin-hypergrid-data-model-decorator-cell-provider', { /* jshint ignore:line  */

        getCellRenderer: function(x, y, untranslatedX, untranslatedY) {
            return this.getComponent().getCellRenderer(x, y, untranslatedX, untranslatedY);
        }

    });

})();
