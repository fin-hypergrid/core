'use strict';

module.exports = {
    cellEventFactory: require('./cellEventFactory'),
    dynamicPropertyDescriptors: require('./dynamicProperties'),
    fields: require('./fields'),
    graphics: require('./graphics'),
    Canvas: require('./Canvas'),
    InclusiveRectangle: require('./InclusiveRectangle')
};

var warned = {};

Object.defineProperty(module.exports, 'fields', {
    get: function() {
        if (!warned.fields) {
            console.warn('The `Hypergrid.lib.fields` module has been "externalized" as of v3.0.0. This reference will break in a future release. Use `require(\'fin-hypergrid-field-tools\')` instead.');
            warned.fields = true;
        }
        return require('fin-hypergrid-field-tools');
    }
});

Object.defineProperty(module.exports, 'DataSourceOrigin', {
    get: function() {
        if (!warned.DataSourceOrigin) {
            console.warn('The `DataSourceOrigin` module has been retired as of v3.0.0. A new data model, `datasaur-local`, is now bundled with the Hypergrid build and used as the default. However, it may be removed from the build in a future release. Developers are advised to provide their own data model going forward. For example: `new Hypergrid({ DataSource: require(\'datasaur-local\') })`. Or provide a data model instance in the `dataSource` (small "d") option.');
            warned.DataSourceOrigin = true;
        }
        return require('datasaur-local');
    }
});
