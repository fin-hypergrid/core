
var CellRenderer = require('./CellRenderer');
var simpleCell = require('./SimpleCell.js')

/**
 * Renders a tree group cell.
 * @constructor
 * @extends CellRenderer
 */
// @ts-ignore TODO use classes

const drillDown = '\u25bc'
const drillRight = '\u25b6'
const space = '    '
const error = 'value is not valid treeInfo'

const CreateDisplayValue = (treeGroup) => {
    if (typeof treeGroup.level !== 'number' || !treeGroup.groupName) {
        return error
    }

    if (treeGroup.isLeaf) {
        return `${whitespace(treeGroup.level + 1)} ${treeGroup.groupName}`
    } else if (treeGroup.isExpanded) {
        return `${whitespace(treeGroup.level)} ${drillDown} ${treeGroup.groupName}`
    } else {
        return `${whitespace(treeGroup.level)} ${drillRight} ${treeGroup.groupName}`
    }
}

const whitespace = (count) => {
    return space.repeat(count - 1)
}

var TreeGroupCell = CellRenderer.extend('TreeGroupCell', {
    paint: function (gc, config) {
        config.value = CreateDisplayValue(config.value)
        config.halign = 'left'

        simpleCell.prototype.paint(gc, config)
    }
});

module.exports = TreeGroupCell;
