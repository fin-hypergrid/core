/* eslint-env browser */

'use strict';

var paths = {
	normal: {
		analytics: require('hyper-analytics')
	},
	jonathan: {
		analytics: require('hyper-analytics')
	},
	steve: {
		analytics: require('../../hyper-analytics/src/index.js')
	}
};
module.exports = {
	analytics: paths.normal.analytics
};
