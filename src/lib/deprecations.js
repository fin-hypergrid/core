'use strict';

var warned = {};

module.exports = {

    get DataSourceOrigin() {
        if (!warned.DataSourceOrigin) {
            console.warn('The `DataSourceOrigin` module has been retired as of v3.0.0. The new default data model, `datasaur-local`, will be returned instead. Note, however, that it may be removed from the build in a future release. Developers are advised and encouraged to provide their own data model going forward. For example: `new Hypergrid({ DataSource: require(\'datasaur-local\') })`; or provide a live data model instance in the `dataSource` (small "d") option.');
            warned.DataSourceOrigin = true;
        }
        return require('datasaur-local');
    },

    get dynamicPropertyDescriptors() {
        if (!warned.dynamicPropertyDescriptors) {
            console.warn('The `dynamicPropertyDescriptors` module has been renamed as of v3.0.0 to `dynamicProperties`. (This legacy name will be removed in a future version.)');
            warned.dynamicPropertyDescriptors = true;
        }
        return require('./dynamicProperties');
    }

};
