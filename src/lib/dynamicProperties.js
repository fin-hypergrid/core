'use strict';

var warnedDoubleClickDelay;

/**
 * @summary Dynamic grid property getter/setters.
 * @desc  Dynamic grid properties can make use of a _backing store._
 * This backing store is created in the same layer (the grid properties layer) by {@link Hypergrid#clearState|clearState} and backs grid-only properties. We currently do not create one for descendant objects, such as column and cell properties objects.
 * The members of the backing store have the same names as the dynamic properties that utilize them.
 * They are initialized by {@link Hypergrid#clearState|clearState} to the default values from {@link module:defaults|defaults} object members, (also) of the same name.
 *
 * Note that dynamic properties must enumerable to be visible to {@link Hypergrid#saveState}.
 * @name dynamicPropertyDescriptors
 * @module
 */
var dynamicPropertyDescriptors = {
    /**
     * @returns {string|undefined|object} One of:
     * * **string:** When theme name is registered (except 'default').
     * * **undefined:** When theme layer is empty (or theme name is 'default').
     * * **object:** When theme name is not registered.
     * @memberOf module:dynamicPropertyDescriptors
     */
    theme: {
        enumerable: true,
        get: function() {
            return this.grid.getTheme();
        },
        set: function(theme) {
            this.grid.applyTheme(theme);
        }
    },

    /**
     * @memberOf module:dynamicPropertyDescriptors
     */
    subgrids: {
        enumerable: true,
        get: function() {
            return this.var.subgrids;
        },
        set: function(subgrids) {
            this.var.subgrids = subgrids;

            if (this.grid.behavior) {
                this.grid.behavior.subgrids = subgrids;
            }
        }
    },

    /**
     * @memberOf module:dynamicPropertyDescriptors
     */
    features: {
        enumerable: true,
        get: function() {
            return this.var.features;
        },
        set: function(features) {
            this.var.features = features;
            if (this.grid.behavior) {
                this.grid.behavior.initializeFeatureChain(features);
                this.grid.allowEvents(this.grid.getRowCount());
            }
        }
    },

    /**
     * @memberOf module:dynamicPropertyDescriptors
     */
    gridRenderer: {
        enumerable: true,
        get: function() {
            return this.var.gridRenderer;
        },
        set: function(rendererName) {
            this.var.gridRenderer = rendererName;
            this.grid.renderer.setGridRenderer(rendererName);
        }
    },

    /**
     * @memberOf module:dynamicPropertyDescriptors
     */
    columnIndexes: {
        enumerable: true,
        get: function() {
            return this.grid.behavior.getActiveColumns().map(function(column) {
                return column.index;
            });
        },
        set: function(columnIndexes) {
            this.grid.behavior.setColumnOrder(columnIndexes);
            this.grid.behavior.changed();
        }
    },

    /**
     * @memberOf module:dynamicPropertyDescriptors
     */
    columnNames: {
        enumerable: true,
        get: function() {
            return this.grid.behavior.getActiveColumns().map(function(column) {
                return column.name;
            });
        },
        set: function(columnNames) {
            this.grid.behavior.setColumnOrderByName(columnNames);
            this.grid.behavior.changed();
        }
    },

    /**
     * @memberOf module:dynamicPropertyDescriptors
     */
    rows: {
        enumerable: true,
        get: getRowPropertiesBySubgridAndRowIndex,
        set: function(rowsHash) {
            if (rowsHash) {
                setRowPropertiesBySubgridAndRowIndex.call(this, rowsHash);
                this.grid.behavior.changed();
            }
        }
    },

    /**
     * @memberOf module:dynamicPropertyDescriptors
     */
    columns: {
        enumerable: true,
        get: getColumnPropertiesByColumnName,
        set: function(columnsHash) {
            if (columnsHash) {
                setColumnPropertiesByColumnName.call(this, columnsHash);
                this.grid.behavior.changed();
            }
        }
    },

    /**
     * @memberOf module:dynamicPropertyDescriptors
     */
    cells: {
        enumerable: true,
        get: getCellPropertiesByColumnNameAndRowIndex,
        set: function(cellsHash) {
            if (cellsHash) {
                setCellPropertiesByColumnNameAndRowIndex.call(this, cellsHash);
                this.grid.behavior.changed();
            }
        }
    },

    /**
     * @memberOf module:dynamicPropertyDescriptors
     */
    rowHeaderFeatures: {
        enumerable: true,
        get: function() {
            return this.var.rowHeaderFeatures || // from defaults or as subsequently set by setter
                (this.var.rowHeaderFeatures = {}); // Init in case not in defaults
        },
        set: function(rowHeaderFeatures) {
            var grid = this.grid;
            var features = Object.assign({}, rowHeaderFeatures); // clone values in closure

            this.var.rowHeaderFeatures = rowHeaderFeatures; // override default

            Object.defineProperties(rowHeaderFeatures, { // add setters to reset column width
                checkboxes: {
                    get: function() {
                        return features.checkboxes;
                    },
                    set: function(checkboxes) {
                        features.checkboxes = checkboxes;
                        grid.renderer.resetHandleColumnWidth();
                    }
                },
                numbers: {
                    get: function() {
                        return features.numbers;
                    },
                    set: function(numbers) {
                        features.numbers = numbers;
                        grid.renderer.resetHandleColumnWidth();
                    }
                }
            });

            if (grid.renderer) {
                // reset column width using new `features` values
                grid.renderer.resetHandleColumnWidth();
            }
        }
    },

    /**
     * Legacy property; now points to both `rowHeaderFeatures` props.
     * @memberOf module:dynamicPropertyDescriptors
     */
    showRowNumbers: {
        enumerable: false,
        get: function() {
            return this.var.rowHeaderFeatures.checkboxes || this.var.rowHeaderFeatures.numbers;
        },
        set: function(enabled) {
            this.var.rowHeaderFeatures.checkboxes = this.var.rowHeaderFeatures.numbers = enabled;
        }
    },

    // remove to expire warning:
    doubleClickDelay: {
        enumerable: true,
        get: function() {
            return this.var.doubleClickDelay;
        },
        set: function(delay) {
            if (!warnedDoubleClickDelay) {
                warnedDoubleClickDelay = true;
                console.warn('The doubleClickDelay property has been deprecated as of v2.1.0. Setting this property no longer has any effect. Set double-click speed in your system\'s mouse preferences. (This warning will be removed in a future release.)');
            }
            this.var.doubleClickDelay = delay;
        }
    },

    // The following grid line props are now dynamic (as of v2.1.0).
    // They non-enumerable so they will not be output with `grid.saveState()`.
    // The `gridLines` prop (new, as of 2.1.0) they refer to is output instead.
    gridLinesH: {
        get: function() { return this.gridLines.horizontal.enabled; },
        set: function(enabled) { this.gridLines.horizontal.enabled = enabled; }
    },

    gridLinesV: {
        get: function() { return this.gridLines.vertical.enabled; },
        set: function(enabled) { this.gridLines.vertical.enabled = enabled; }
    },

    lineColor: {
        get: function() { return this.gridLines.horizontal.color; },
        set: function(color) { this.gridLines.horizontal.color = this.gridLines.vertical.color = color; }
    },

    lineWidth: {
        get: function() { return this.gridLines.horizontal.width; },
        set: function(width) { this.gridLines.horizontal.width = this.gridLines.vertical.width = width; }
    },

    gridBorder: getGridBorderDescriptor(),
    gridBorderLeft: getGridBorderDescriptor('Left'),
    gridBorderRight: getGridBorderDescriptor('Right'),
    gridBorderTop: getGridBorderDescriptor('Top'),
    gridBorderBottom: getGridBorderDescriptor('Bottom')
};

function getRowPropertiesBySubgridAndRowIndex() { // to be called with grid.properties as context
    var subgrids = {};
    var behavior = this.grid.behavior;
    behavior.subgrids.forEach(function(dataModel) {
        var key = dataModel.name || dataModel.type;
        for (var rowIndex = 0, rowCount = dataModel.getRowCount(); rowIndex < rowCount; ++rowIndex) {
            var rowProps = behavior.getRowProperties(rowIndex, dataModel);
            if (rowProps) {
                var subgrid = subgrids[key] = subgrids[key] || {};
                subgrid[rowIndex] = rowProps;
            }
        }
    });
    return subgrids;
}

function setRowPropertiesBySubgridAndRowIndex(rowsHash) { // to be called with grid.properties as context
    var behavior = this.grid.behavior;
    for (var subgridName in rowsHash) {
        if (rowsHash.hasOwnProperty(subgridName)) {
            var subgrid = behavior.subgrids.lookup[subgridName];
            if (subgrid) {
                var subgridHash = rowsHash[subgridName];
                for (var rowIndex in subgridHash) {
                    if (subgridHash.hasOwnProperty(rowIndex)) {
                        var properties = subgridHash[rowIndex];
                        for (var propName in properties) {
                            if (properties.hasOwnProperty(propName)) {
                                var propValue = properties[propName];
                                switch (propName) {
                                    case 'height':
                                        behavior.setRowHeight(rowIndex, Number(propValue), subgrid);
                                        break;
                                    default:
                                        console.warn('Unexpected row property "' + propName + '" ignored. (The only row property currently implemented is "height").');
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function getColumnPropertiesByColumnName() { // to be called with grid.properties as context
    var columns = this.grid.behavior.getColumns(),
        headerify = this.grid.headerify;
    return columns.reduce(function(obj, column) {
        var properties = Object.keys(column.properties).reduce(function(properties, key) {
            switch (key) {
                case 'preferredWidth': // not a public property
                    break;
                case 'header':
                    if (headerify && column.properties.header === headerify(column.properties.name)) {
                        break;
                    }
                    // fallthrough
                default:
                    var value = column.properties[key];
                    if (value !== undefined) {
                        properties[key] = value;
                    }
            }
            return properties;
        }, {});
        if (Object.keys(properties).length) {
            obj[column.name] = properties;
        }
        return obj;
    }, {});
}

function setColumnPropertiesByColumnName(columnsHash) { // to be called with grid.properties as context
    var columns = this.grid.behavior.getColumns();

    for (var columnName in columnsHash) {
        if (columnsHash.hasOwnProperty(columnName)) {
            var column = columns.find(nameMatches);
            if (column) {
                column.properties = columnsHash[columnName];
            }
        }
    }

    function nameMatches(column) {
        return column.name === columnName;
    }
}

function getCellPropertiesByColumnNameAndRowIndex() {
    var behavior = this.grid.behavior,
        columns = behavior.getColumns(),
        subgrids = {};

    behavior.subgrids.forEach(function(dataModel) {
        var key = dataModel.name || dataModel.type;

        for (var rowIndex = 0, rowCount = dataModel.getRowCount(); rowIndex < rowCount; ++rowIndex) {
            columns.forEach(copyCellOwnProperties);
        }

        function copyCellOwnProperties(column) {
            var properties = behavior.getCellOwnProperties(column.index, rowIndex, dataModel);
            if (properties) {
                var subgrid = subgrids[key] = subgrids[key] || {},
                    row = subgrid[rowIndex] = subgrid[rowIndex] = {};
                row[column.name] = Object.assign({}, properties);
            }
        }
    });

    return subgrids;
}

function setCellPropertiesByColumnNameAndRowIndex(cellsHash) { // to be called with grid.properties as context
    var subgrids = this.grid.behavior.subgrids,
        columns = this.grid.behavior.getColumns();

    for (var subgridName in cellsHash) {
        if (cellsHash.hasOwnProperty(subgridName)) {
            var subgrid = subgrids.lookup[subgridName];
            if (subgrid) {
                var subgridHash = cellsHash[subgridName];
                for (var rowIndex in subgridHash) {
                    if (subgridHash.hasOwnProperty(rowIndex)) {
                        var columnProps = subgridHash[rowIndex];
                        for (var columnName in columnProps) {
                            if (columnProps.hasOwnProperty(columnName)) {
                                var column = columns.find(nameMatches);
                                if (column) {
                                    var properties = columnProps[columnName];
                                    column.addCellProperties(rowIndex, properties, subgrid);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    function nameMatches(column) {
        return column.name === columnName;
    }
}

function getGridBorderDescriptor(edge) {
    edge = edge || '';

    var propName = 'gridBorder' + edge,
        styleName = 'border' + edge;

    return {
        enumerable: true,
        get: function() {
            return this.var[propName];
        },
        set: function(border) {
            this.var[propName] = border;
            if (!edge) {
                this.var.gridBorderLeft = this.var.gridBorderRight = this.var.gridBorderTop = this.var.gridBorderBottom = border;
            }
            switch (border) {
                case true:
                    border = this.lineWidth + 'px solid ' + this.lineColor;
                    break;
                case false:
                    border = null;
                    break;
            }
            this.grid.canvas.canvas.style[styleName] = border;
        }
    };
}

module.exports = dynamicPropertyDescriptors;
