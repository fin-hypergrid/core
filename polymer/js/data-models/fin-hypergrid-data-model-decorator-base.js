'use strict';

(function() {

    Polymer('fin-hypergrid-data-model-decorator-base', { /* jshint ignore:line  */

        component: null,

        setComponent: function(newComponent) {
            this.component = newComponent;
        },

        getComponent: function() {
            return this.component;
        },

        getValue: function(x, y) {
            return this.getComponent().getValue(x, y);
        },

        setValue: function(x, y, value) {
            this.getComponent().setValue(x, y, value);
        },

        getColumnCount: function() {
            return this.getComponent().getColumnCount();
        },

        getRowCount: function() {
            return this.getComponent().getRowCount();
        },

        getCellRenderer: function(config, x, y, untranslatedX, untranslatedY) {
            return this.getComponent().getCellRenderer(config, x, y, untranslatedX, untranslatedY);
        },

        getColumnWidth: function(x) {
            return this.getComponent().getColumnWidth(x);
        },

        getRowHeight: function(y) {
            return this.getComponent().getRowHeight(y);
        }

    });

})();
