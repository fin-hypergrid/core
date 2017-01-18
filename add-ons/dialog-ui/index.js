'use strict';

var overrider = require('overrider');

/**
 * @param {Hypergrid} grid
 * @param {object} [targets] - Hash of mixin targets. These are typically prototype objects. If not given or any targets are missing, defaults to current grid's various prototypes.
 * @constructor
 */
function DialogUI(grid, targets) {
    this.grid = grid;
    targets = targets || {};

    var Hypergrid = this.grid.constructor;
    Hypergrid.defaults.mixIn(require('./mix-ins/defaults'));

    mixInTo('Hypergrid', grid, require('./mix-ins/grid'));
    mixInTo('Behavior', grid.behavior, require('./mix-ins/behavior'));

    grid.addEventListener('fin-keyup', function(e) {
        var charPressed = e.detail.char;
        grid.properties.editorActivationKeys.find(function(activationKey) {
            var isActivationKey = charPressed === activationKey.toUpperCase();
            if (isActivationKey) {
                grid.toggleDialog('ColumnPicker');
            }
            return isActivationKey;
        });
    });

    function mixInTo(target, instance, mixin) {
        var object = targets[target];
        var prototype = object && object.prototype || Object.getPrototypeOf(instance);

        overrider(prototype, mixin);
    }
}

DialogUI.prototype = {
    constructor: DialogUI.prototype.constructor,
    $$CLASS_NAME: 'DialogUI'
};

module.exports = DialogUI;
