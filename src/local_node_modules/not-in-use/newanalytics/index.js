'use strict';

module.exports = {
    JSDataSource: require('./DataSource'),
    DataSourceSorter: require('./DataSourceSorter'),
    DataSourceSorterComposite: require('./DataSourceSorterComposite'),
    DataSourceFilter: require('./DataSourceFilter'),
    DataSourceGlobalFilter: require('./DataSourceGlobalFilter'),
    DataSourceAggregator: require('./DataSourceAggregator'),
    util: {
        aggregations: require('./util/aggregations')
    }
};