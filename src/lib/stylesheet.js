/* eslint-env browser */

'use strict';

var automat = require('automat');

var css = require('../../css');

// note the position of the  first "natural" stylesheet. We will insert our stylesheets before this node.
var head = document.querySelector('head');
var refNode = Array.prototype.slice.call(head.children).find(function(child) {
    return child.tagName === 'STYLE' ||
        child.tagName === 'LINK' &&
        child.getAttribute('rel') === 'stylesheet' &&
        child.getAttribute('type') === 'text/css';
});

exports.prefix = 'injected-stylesheet-';

exports.inject = function(id, overrideDir) {
    var stylesheet = document.querySelector('#' + this.prefix + id);
    var repo = overrideDir || css;

    if (!stylesheet) {
        stylesheet = repo[id];
        stylesheet = '<style>\n' + stylesheet + '\n</style>\n';
        var args = [stylesheet, head, refNode].concat(Array.prototype.slice.call(arguments, 1));
        stylesheet = automat.append.apply(null, args)[0];
        stylesheet.id = this.prefix + id;
    }

    return stylesheet;
};
