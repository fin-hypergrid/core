
var CellRenderer = require('./CellRenderer');
var simpleCell = require('./SimpleCell.js');

/**
 * Renders a tree group cell.
 * @constructor
 * @extends CellRenderer
 */
// @ts-ignore TODO use classes

var drillDown = '\u25bc';
var drillRight = '\u25b6';
var space = '    ';
var error = 'value is not valid treeInfo';

var TreeGroupCell = CellRenderer.extend('TreeGroupCell', {
    paint: function(gc, config) {
        config.value = createDisplayValue(config.value);
        config.halign = 'left';

        simpleCell.prototype.paint(gc, config);
    }
});

function createDisplayValue(treeGroup) {
    if (typeof treeGroup.level !== 'number' || !treeGroup.groupName) {
        return error;
    }

    if (treeGroup.isLeaf) {
        return whitespace(treeGroup.level + 1) + ' ' + treeGroup.groupName;
    } else if (treeGroup.isExpanded) {
        return whitespace(treeGroup.level) + ' ' + drillDown + ' ' + treeGroup.groupName;
    } else {
        return whitespace(treeGroup.level) + ' ' + drillRight + ' ' + treeGroup.groupName;
    }
}

function whitespace(count) {
    return space.repeat(count - 1);
}

module.exports = TreeGroupCell;
