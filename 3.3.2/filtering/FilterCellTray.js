'use strict';

fin.Hypergrid.src.cellEditors.make({
    name: 'FilterCellTray',

    template:
        '<div class="filter-cell-box">\n' +
        '  <input type="text" class="hypergrid-textfield filter-icon-search">\n' +
        '  <div class="filter-icon-unfiltered"></div>\n' +
        '</div>',

    initialize: function(left, top, originalItems, options) {
        this.left = left;
        this.top = top;

        options = options || {};

        this.keyMap = Object.assign(defaulKeymap, options.keyMap || {});

        this.create();
        this.reset(
            this.originalItems = originalItems,
            options.groupOption || 1,
            options.showHeader === undefined || options.showHeader
        );
    },

    create: function() {
        var el = this.el = document.createElement('div');
        el.className = 'filter-cell-tray';
        el.style.left = this.left + 'px';
        el.style.top = this.top + 'px';
        el.innerHTML = '<div><div class="filter-cell-pill"></div></div><div></div><div></div>';
        document.body.appendChild(el);

        this.pill = el.children[0].firstElementChild;
        this.header = el.children[1];
        this.footer = el.children[2];
    },

    adjust: function(showHeader) {
        this.header.style.display = showHeader ? 'block' : 'none';

        var previousVisibleSibling = showHeader ? this.header : this.pill.parentElement;
        var top = previousVisibleSibling.getBoundingClientRect().bottom;
        this.footer.style.top = top - this.top - 1 + 'px';
    },

    reset: function(items, groupOption, showHeader) {
        // inject Select All, items, and (per groupOption) groups

        this.items = items;

        if (groupOption === undefined) {
            groupOption = this.groupOption;
        } else {
            this.groupOption = groupOption;
        }

        this.groups = [];

        var left = {
                icon: icon.UNCHECKED,
                text: 'Select All',
                toolTip: 'Select all'
            },
            right = {
                icon: icon.SETTINGS,
                toolTip: 'Currently showing group option #' + groupOption + '.\n' +
                    'Click to rotate to group option #' + ((groupOption % 3) + 1) + '.'
            },
            el = makeItemEl(left, right);

        this.selectAllGroup = { el: el, items: this.items };

        this.header.innerHTML = '';
        this.footer.innerHTML = '';

        if (groupOption === 2 || groupOption === 3) {
            var groupKey = this.keyMap.group;
            var groups = this.items.reduce(function(groups, item) {
                var group = item[groupKey];
                if (!groups[group]) { groups[group] = []; }
                groups[group].push(item);
                return groups;
            }, {});

            Object.keys(groups).forEach(function(key) {
                var left = {
                    icon: icon.UNCHECKED,
                    text: key,
                    toolTip: key
                };

                if (groupOption === 2) {
                    var right = {
                        icon: icon.EXPANDER,
                        transform: FilterCellTray.groupClosed[key] && 'rotate(-90deg)'
                    };
                }

                this.groups.push({
                    name: key,
                    el: makeItemEl(left, right),
                    items: groups[key]
                });
            }, this);

            this.groups.sort(function(a, b) {
                return a.name < b.name ? -1 : 1;
            });
        }

        this.groups.unshift(this.selectAllGroup);

        this.groups.forEach(function(group) {
            var section = group === this.selectAllGroup || groupOption === 3 ? this.header : this.footer;
            section.appendChild(group.el);
            group.div = document.createElement('div');
            this.footer.appendChild(group.div);
        }, this);

        this.adjust(showHeader === undefined || showHeader);

        (groupOption === 2 ? this.groups.slice(1) : this.groups.slice(0, 1)).forEach(function(group) {
            group.items.forEach(function(item) {
                var iconName = item.selected ? icon.CHECKED : icon.UNCHECKED;
                var left = {
                    icon: iconName,
                    text: item[this.keyMap.value],
                    toolTip: item[this.keyMap.tooltip]
                };
                item.el = makeItemEl(left);
                group.div.appendChild(item.el);
                this.checkGroups(item);
            }, this);

            var height = group.div.getBoundingClientRect().height + 'px';
            group.div.setAttribute('data-height', height);
            group.closed = FilterCellTray.groupClosed[group.name]; // restore state from `before reset
            group.div.style.height = groupOption === 2 && group.closed ? '0' : height;
            group.div.addEventListener('click', this.handleItemClick.bind(this, group));
        }, this);

        this.groups.forEach(function(group) {
            group.el.addEventListener('click', this.handleGroupClick.bind(this, group));
        }, this);
    },

    handleItemClick: function(group, e) {
        var el = getItemEl(e);
        var textKey = this.keyMap.text;
        var item = group.items.find(function(item) { return item[textKey] === el.textContent; });

        item.selected = !item.selected;
        setCheckbox(el, getCheckboxClassName(item.selected));

        this.checkGroups(item);

        this.setInputToCheckedItems();

        e.stopPropagation();
    },

    handleGroupClick: function(group, e) {
        switch (e.target.className) {
            case icon.EXPANDER:
                group.closed = !group.closed;
                FilterCellTray.groupClosed[group.name] = group.closed; // remember across reset calls
                e.target.style.transform = group.closed ? 'rotate(-90deg)' : null;
                group.div.style.height = group.closed ? '0' : group.div.getAttribute('data-height');
                break;
            case icon.SETTINGS:
                this.reset(this.items, (this.groupOption % 3) + 1);
                break;
            default:
                var count = group.items.filter(selected).length;
                var newState = count !== group.items.length;
                var className = getCheckboxClassName(newState);
                setCheckbox(group.el, className);
                group.items.forEach(function(item) {
                    item.selected = newState;
                    setCheckbox(item.el, className);
                });
                if (group === this.selectAllGroup) {
                    this.groups.slice(1).forEach(function(group) {
                        setCheckbox(group.el, className);
                    });
                } else {
                    checkGroup(this.selectAllGroup);
                }

                this.setInputToCheckedItems();
        }

        e.stopPropagation();
    },

    setInputToCheckedItems: function() {
        var filteredItems = this.originalItems.filter(selected);

        var valueKey = this.keyMap.value;
        var values = filteredItems.map(function(item) { return item[valueKey]; });

        var textKey = this.keyMap.text;
        var texts = filteredItems.map(function(item) { return item[textKey]; }).sort();
        var more = texts.length - 3;
        var text = texts.slice(0, 3).join(', ');
        if (more > 0) {
            text += ', +' + more + ' more';
        }
        this.pill.textContent = text;
        this.pill.style.display = text.length ? 'block' : 'none';

        this.el.dispatchEvent(new CustomEvent('filter-cell-changed', { detail: values }));
    },

    checkGroups: function(item) {
        this.groups.filter(function(group) {
            return group.items.find(function(groupItem) {
                return groupItem === item;
            });
        }).forEach(checkGroup);
    }
});

function checkGroup(group) {
    var className;
    var count = group.items.filter(selected).length;
    switch (count) {
        case 0: className = icon.UNCHECKED; break;
        case group.items.length: className = icon.CHECKED; break;
        default: className = icon.SEMICHECKED;
    }
    group.el.firstElementChild.className = className;
}

function makeItemEl(left, right) {
    const div = document.createElement('div');
    div.className = icon.ITEM;

    var child = document.createElement('div');
    child.className = left.icon;
    div.appendChild(child);

    child = document.createElement('span');
    child.textContent = left.text;
    child.setAttribute('title', left.toolTip);
    div.appendChild(child);

    if (right) {
        child = document.createElement('div');
        if (right.toolTip) {
            child.setAttribute('title', right.toolTip);
        }
        if (right.transform) {
            child.style.transform = right.transform;
        }
        child.className = right.icon;
        div.appendChild(child);
    }

    return div;
}

function selected(item) {
    return item.selected;
}

function setCheckbox(el, className) {
    return el.firstElementChild.className = className;
}

function getCheckboxClassName(checked) {
    return checked ? icon.CHECKED : icon.UNCHECKED;
}

function getItemEl(e) {
    for (var el = e.target; !el.classList.contains(icon.ITEM); el = el.parentElement );
    return el;
}

var defaulKeymap = {
    value: 'value', // item.value returned in 'changed' event (CSV)
    text: 'text', // item.text displayed in item list and pill
    tooltip: 'tooltip', // item.tooltip displayed in tooltip
    group: 'group' // item.group displayed in group list
};

var icon = {
    ITEM: 'filter-cell-item',
    SETTINGS: 'filter-icon-settings',
    EXPANDER: 'filter-icon-expander',
    UNCHECKED: 'filter-icon-unchecked',
    CHECKED: 'filter-icon-checked',
    SEMICHECKED: 'filter-icon-semichecked'
};

FilterCellTray.groupClosed = {};

module.exports = FilterCellTray;
