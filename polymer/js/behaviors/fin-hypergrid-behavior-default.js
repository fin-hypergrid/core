'use strict';
/**
 *
 * @module behaviors\default
 * @description
 this is the simplest example of a behavior
 *
 */
(function() {

    var dataModels = fin.hypergrid.dataModels;

    Polymer({ /* jslint ignore:line */

        getDefaultDataModel: function() {
            var model = new dataModels.Default();
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
            return 3;
        },

        getFixedRowCount: function() {
            return 3;
        },
    });

})(); /* jslint ignore:line */
