'use strict';
/**
 *
 * @module behaviors\default
 * @description
 this is the simplest example of a behavior
 *
 */
(function() {

    Polymer({ /* jslint ignore:line */

        getDefaultDataModel: function() {
            var model = document.createElement('fin-hypergrid-data-model-default');
            return model;
        },

        /**
        * @function
        * @instance
        * @description
        return the total number of fixed columns
        * #### returns: integer
        */
        getFixedColumnCount: function() {
            return 1;
        },

    });

})(); /* jslint ignore:line */
