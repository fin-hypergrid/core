'use strict';

module.exports = {
    cellEventFactory: require('./cellEventFactory'),
    dynamicPropertyDescriptors: require('./dynamicProperties'),
    graphics: require('./graphics'),
    Canvas: require('./Canvas')
};

var warned = {};

Object.defineProperty(module.exports, 'fields', {
    get: function() {
        if (!warned.fields) {
            console.warn('The `Hypergrid.lib.fields` module has been externalized as of v3.0.0 (along with the data source modules, for use therein). ' +
                'This reference will break in a future release and should be changed to `Hypergrid.require(\'fin-hypergrid-field-tools\')`. ');
            warned.fields = true;
        }
        return require('fin-hypergrid-field-tools');
    }
});

Object.defineProperty(module.exports, 'DataSourceOrigin', {
    get: function() {
        if (!warned.DataSourceOrigin) {
            console.warn('The `DataSourceOrigin` module has been retired as of v3.0.0. ' +
                'A new local data source module, `datasaur-local` is available. ' +
                'For the time being, this module will be included in the Hypergrid build and used by default. ' +
                'However, it will be removed in a future release and to be prepared developers should start loading ' +
                'it explictly now and supplying a reference to it in the `DataSource` instantiation option.');
            warned.DataSourceOrigin = true;
        }
        return require('datasaur-local');
    }
});
