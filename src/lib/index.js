'use strict';

module.exports = {
    cellEventFactory: require('./cellEventFactory'),
    dynamicPropertyDescriptors: require('./dynamicProperties'),
    fields: require('./fields'),
    graphics: require('./graphics'),
    Canvas: require('./Canvas')
};

var warned;

Object.defineProperty(module.exports, 'DataSourceOrigin', {
    get: function() {
        if (!warned) {
            console.warn('The `DataSourceOrigin` module has been retired as of v3.0.0. The new default data model, `datasaur-local`, will be returned instead. Note, however, that it may be removed from the build in a future release. Developers are advised and encouraged to provide their own data model going forward. For example: `new Hypergrid({ DataSource: require(\'datasaur-local\') })`; or provide a live data model instance in the `dataSource` (small "d") option.');
            warned = true;
        }
        return require('datasaur-local');
    }
});
