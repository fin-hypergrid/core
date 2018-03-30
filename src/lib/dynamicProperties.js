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
 * @module dynamicProperties
 */
var dynamicPropertyDescriptors = {
    /**
     * @returns {string|undefined|object} One of:
     * * **string:** When theme name is registered (except 'default').
     * * **undefined:** When theme layer is empty (or theme name is 'default').
     * * **object:** When theme name is not registered.
     * @memberOf module:dynamicProperties
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

    wheelHFactor: {
        enumerable: true,
        get: function() {
            return this.grid.sbHScroller.deltaXFactor;
        },
        set: function(factor) {
            this.grid.sbHScroller.deltaXFactor = factor;
        }
    },

    wheelVFactor: {
        enumerable: true,
        get: function() {
            return this.grid.sbVScroller.deltaYFactor;
        },
        set: function(factor) {
            this.grid.sbVScroller.deltaYFactor = factor;
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    subgrids: {
        enumerable: true,
        get: function() {
            return this.var.subgrids;
        },
        set: function(subgrids) {
            this.var.subgrids = subgrids.slice();

            if (this.grid.behavior) {
                this.grid.behavior.subgrids = subgrids;
            }
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    features: {
        enumerable: true,
        get: function() {
            return this.var.features;
        },
        set: function(features) {
            this.var.features = features.slice();
            if (this.grid.behavior) {
                this.grid.behavior.initializeFeatureChain(features);
                this.grid.allowEvents(this.grid.getRowCount());
            }
        }
    },

    /**
     * @memberOf module:dynamicProperties
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
     * @memberOf module:dynamicProperties
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
     * @memberOf module:dynamicProperties
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
     * @memberOf module:dynamicProperties
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
     * @memberOf module:dynamicProperties
     */
    columns: {
        enumerable: true,
        get: getColumnPropertiesByColumnIndexOrName,
        set: function(columnsHash) {
            if (columnsHash) {
                setColumnPropertiesByColumnIndexOrName.call(this, columnsHash);
                this.grid.behavior.changed();
            }
        }
    },

    /**
     * @memberOf module:dynamicProperties
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
     * @memberOf module:dynamicProperties
     */
    rowHeaderCheckboxes: {
        enumerable: true,
        get: function() {
            return this.var.rowHeaderCheckboxes;
        },
        set: function(enabled) {
            this.var.rowHeaderCheckboxes = enabled;
            this.grid.renderer.resetRowHeaderColumnWidth();
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    rowHeaderNumbers: {
        enumerable: true,
        get: function() {
            return this.var.rowHeaderNumbers;
        },
        set: function(enabled) {
            this.var.rowHeaderNumbers = enabled;
            this.grid.renderer.resetRowHeaderColumnWidth();
        }
    },

    /**
     * Legacy property; now points to both `rowHeaderFeatures` props.
     * @memberOf module:dynamicProperties
     */
    showRowNumbers: {
        enumerable: false,
        get: function() {
            return this.rowHeaderCheckboxes || this.rowHeaderNumbers;
        },
        set: function(enabled) {
            this.rowHeaderCheckboxes = this.rowHeaderNumbers = enabled;
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

    /** @summary Grid line color.
     * @desc This is a Legacy property. It is now implemented as a dynamic property accessor:
     * * Getting its value returns the current value of the new (as of 2.1.0) {@link module:defaults.gridLinesHColor gridLinesHColor} property.
     * * Setting its value sets {@link module:defaults.gridLinesHColor gridLinesHColor} and {@link module:defaults.gridLinesVColor gridLinesVColor}.
     * * It is non-enumerable; it is not output with `grid.saveState()`; the accessed properties are output instead.
     * @memberOf module:dynamicProperties
     */
    lineColor: {
        get: function() { return this.gridLinesHColor; },
        set: function(color) { this.gridLinesHColor = this.gridLinesVColor = color; }
    },

    /** @summary Grid line width.
     * @desc This is a Legacy property. It is now implemented as a dynamic property accessor:
     * * Getting its value returns the current value of the new (as of 2.1.0) {@link module:defaults.gridLinesHColor gridLinesHColor} property.
     * * Setting its value sets {@link module:defaults.gridLinesHColor gridLinesHColor} and {@link module:defaults.gridLinesVColor gridLinesVColor}.
     * * It is non-enumerable; it is not output with `grid.saveState()`; the accessed properties are output instead.
     * @memberOf module:dynamicProperties
     */
    lineWidth: {
        get: function() { return this.gridLinesHWidth; },
        set: function(width) { this.gridLinesHWidth = this.gridLinesVWidth = width; }
    },

    gridBorder: getGridBorderDescriptor(),
    gridBorderLeft: getGridBorderDescriptor('Left'),
    gridBorderRight: getGridBorderDescriptor('Right'),
    gridBorderTop: getGridBorderDescriptor('Top'),
    gridBorderBottom: getGridBorderDescriptor('Bottom')
};

/**
 * @name module:dynamicProperties.columnProperties
 */
dynamicPropertyDescriptors.columnProperties = dynamicPropertyDescriptors.columns;


function getRowPropertiesBySubgridAndRowIndex() { // to be called with grid.properties as context
    var subgrids = {};
    var behavior = this.grid.behavior;
    var defaultRowHeight = this.grid.properties.defaultRowHeight;
    behavior.subgrids.forEach(function(dataModel) {
        var key = dataModel.name || dataModel.type;
        for (var rowIndex = 0, rowCount = dataModel.getRowCount(); rowIndex < rowCount; ++rowIndex) {
            var rowProps = behavior.getRowProperties(rowIndex, undefined, dataModel);
            if (rowProps) {
                // create height mixin by invoking `height` getter
                var height = { height: rowProps.height };
                if (height.height === defaultRowHeight) {
                    height = undefined;
                }

                // clone it and mix in height
                rowProps = Object.assign({}, rowProps, height);

                // only include if at least one defined prop
                if (Object.getOwnPropertyNames(rowProps).find(definedProp)) {
                    var subgrid = subgrids[key] || (subgrids[key] = {});
                    subgrid[rowIndex] = rowProps;
                }
            }
        }
        function definedProp(key) { return rowProps[key] !== undefined; }
    });
    return subgrids;
}

function setRowPropertiesBySubgridAndRowIndex(rowsHash) { // to be called with grid.properties as context
    var behavior = this.grid.behavior,
        methodName = this.settingState ? 'setRowProperties' : 'addRowProperties';

    Object.keys(rowsHash).forEach(function(subgridName) {
        var subgrid = behavior.subgrids.lookup[subgridName];
        if (subgrid) {
            var subgridHash = rowsHash[subgridName];
            Object.keys(subgridHash).forEach(function(rowIndex) {
                var properties = subgridHash[rowIndex];
                behavior[methodName](rowIndex, properties, subgrid);
            });
        }
    });
}

function getColumnPropertiesByColumnIndexOrName() { // to be called with grid.properties as context
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
                    properties[key] = column.properties[key];
            }
            return properties;
        }, {});
        if (Object.keys(properties).length) {
            obj[column.name] = properties;
        }
        return obj;
    }, {});
}

function setColumnPropertiesByColumnIndexOrName(columnsHash) { // to be called with grid.properties as context
    this.grid.behavior.addAllColumnProperties(columnsHash, this.settingState);
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
        columns = this.grid.behavior.getColumns(),
        methodName = this.settingState ? 'setCellProperties' : 'addCellProperties';

    Object.keys(cellsHash).forEach(function(subgridName) {
        var subgrid = subgrids.lookup[subgridName];
        if (subgrid) {
            var subgridHash = cellsHash[subgridName];
            Object.keys(subgridHash).forEach(function(rowIndex) {
                var columnProps = subgridHash[rowIndex];
                Object.keys(columnProps).forEach(function(columnName) {
                    var properties = columnProps[columnName];
                    if (properties) {
                        var column = columns.find(function(column) {
                            return column.name === columnName;
                        });
                        if (column) {
                            column[methodName](rowIndex, properties, subgrid);
                        }
                    }
                });
            });
        }
    });
}

function getGridBorderDescriptor(edge) {
    var propName = 'gridBorder' + (edge || '');

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

            this.grid.resetGridBorder(edge);
        }
    };
}

module.exports = dynamicPropertyDescriptors;
