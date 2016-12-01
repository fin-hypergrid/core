'use strict';

/** @namespace src/dataModels */

var dataModels = {
    /**
     * Abstract base class.
     * @type {DataModel}
     * @see {DataModel}
     * @memberOf src/dataModels
     */
    DataModel: require('./DataModel'),

    /**
     * @see {@link dataModels.JSON}
     * @implements dataModelAPI
     * @memberOf src/dataModels
     */
    JSON: require('./JSON'),

    /**
     * A single-row data model for the column headers.
     * @see {@link HeaderSubgrid}
     * @implements dataModelAPI
     * @memberOf src/dataModels
     */
    HeaderSubgrid: require('./HeaderSubgrid'),

    /**
     * A single-row data model for the filter cells.
     * @see {@link FilterSubgrid}
     * @implements dataModelAPI
     * @memberOf src/dataModels
     */
    FilterSubgrid: require('./FilterSubgrid'),

    /**
     * A multi-row data model for arbitrary summary data.
     * @see {@link SummarySubgrid}
     * @implements dataModelAPI
     * @memberOf src/dataModels
     */
    SummarySubgrid: require('./SummarySubgrid'),

    /**
     * A single-row data model for  arbitrary summary data.
     * @see {@link InfoSubgrid}
     * @implements dataModelAPI
     * @memberOf src/dataModels
     */
    InfoSubgrid: require('./InfoSubgrid')
};

module.exports = dataModels;
