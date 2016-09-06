/* eslint-env browser */

'use strict';

var HTTP_STATE_DONE = 4,
    HTTP_STATUS_OK = 200;

exports.get = function(url, callback) {
    var httpRequest = new XMLHttpRequest();

    httpRequest.open('GET', url, true);

    httpRequest.onreadystatechange = function() {
        if (
            httpRequest.readyState === HTTP_STATE_DONE &&
            httpRequest.status === HTTP_STATUS_OK
        ) {
            callback(JSON.parse(httpRequest.responseText));
        }
    };

    httpRequest.send(null);
};
