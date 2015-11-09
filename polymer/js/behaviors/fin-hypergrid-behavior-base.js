/* globals fin */

'use strict';
/**
 *
 * @module behaviors\base
 * @description
this is the base class for creating behaviors.  a behavior can be thought of as a model++.
it contains all code/data that's necessary for easily implementing a virtual data source and it's manipulation/analytics
 *
 */
(function() {

    var features = fin.hypergrid.features;
    var hypergrid = fin.hypergrid;

    function DataModelDecorator(grid, component) {
        this.setComponent(component);
        this.setGrid(grid);
    }

    DataModelDecorator.prototype = {

        component: null,
        grid: null,

        getGrid: function() {
            return this.grid;
        },

        setGrid: function(newGrid) {
            this.grid = newGrid;
            this.getComponent().setGrid(newGrid);
        },

        getBehavior: function() {
            return this.getGrid().getBehavior();
        },

        changed: function() {
            this.getBehavior().changed();
        },

        getPrivateState: function() {
            return this.getGrid().getPrivateState();
        },

        applyState: function() {

        },

        setComponent: function(newComponent) {
            this.component = newComponent;
        },

        getComponent: function() {
            return this.component;
        },

        setGlobalFilter: function(string) {
            return this.getComponent().setGlobalFilter(string);
        },

        getValue: function(x, y) {
            return this.getComponent().getValue(x, y);
        },

        setValue: function(x, y, value) {
            this.getComponent().setValue(x, y, value);
        },

        getColumnCount: function() {
            return this.getComponent().getColumnCount();
        },

        getRowCount: function() {
            return this.getComponent().getRowCount();
        },

        getCellRenderer: function(config, x, y, untranslatedX, untranslatedY) {
            return this.getComponent().getCellRenderer(config, x, y, untranslatedX, untranslatedY);
        },

        getRowHeight: function(y) {
            return this.getComponent().getRowHeight(y);
        },

        getColumnEdge: function(x, renderer) {
            return this.getComponent().getColumnEdge(x, renderer);
        },

        getColumnWidth: function(x) {
            return this.getComponent().getColumnWidth(x);
        },

        setColumnWidth: function(x, width) {
            this.getComponent().setColumnWidth(x, width);
        },

        toggleSort: function(x, keys) {
            this.getComponent().toggleSort(x, keys);
        },

        getColumnProperties: function(columnIndex) {
            return this.getComponent().getColumnProperties(columnIndex);
        },

        setColumnProperties: function(columnIndex, properties) {
            this.getComponent().setColumnProperties(columnIndex, properties);
        },

        getHeaders: function() {
            return this.getComponent().getHeaders();
        },

        getFields: function() {
            return this.getComponent().getFields();
        },

        setFields: function(fields) {
            this.getComponent().setFields(fields);
        },

        getCellProperties: function(x, y) {
            return this.getComponent().getCellProperties(x, y);
        },

        setCellProperties: function(x, y, value) {
            this.getComponent().setCellProperties(x, y, value);
        },

        getRow: function(y) {
            return this.getComponent().getRow(y);
        },

        setTopTotals: function(nestedArray) {
            this.getComponent().setTopTotals(nestedArray);
        },

        getTopTotals: function() {
            return this.getComponent().getTopTotals();
        },

        setData: function(y) {
            return this.getComponent().setData(y);
        },

        hasHierarchyColumn: function() {
            return this.getComponent().hasHierarchyColumn();
        },

        setHeaders: function(headerLabels) {
            return this.getComponent().setHeaders(headerLabels);
        },

        cellClicked: function(cell, event) {
            return this.getComponent().cellClicked(cell, event);
        },

        getAvailableGroups: function() {
            return this.getComponent().getAvailableGroups();
        },

        getGroups: function() {
            return this.getComponent().getGroups();
        },

        setGroups: function(groups) {
            this.getComponent().setGroups(groups);
        },

        getHiddenColumns: function() {
            return this.getComponent().getHiddenColumns();
        },

        getVisibleColumns: function() {
            return this.getComponent().getVisibleColumns();
        },

        setAggregates: function(aggregates) {
            return this.getComponent().setAggregates(aggregates);
        },
    };

    function Column(behavior, index, label) {
        this.behavior = behavior;
        this.dataModel = behavior.getDataModel();
        this.index = index;
        this.label = label;
    }

    Column.prototype = {
        getValue: function(y) {
            return this.dataModel.getValue(this.index, y);
        },
        setValue: function(y, value) {
            return this.dataModel.setValue(this.index, y, value);
        },
        getWidth: function() {
            var override = this.getProperties().width;
            if (override) {
                return override;
            }
            return this.behavior.resolveProperty('defaultColumnWidth');
        },
        setWidth: function(width) {
            this.getProperties().width = Math.max(5, width);
        },
        getCellRenderer: function(config, y) {
            return this.dataModel.getCellRenderer(config, this.index, y);
        },
        getCellProperties: function(y) {
            return this.behavior.getPrivateState().cellProperties[this.index + ',' + y];
        },
        setCellProperties: function(y, value) {
            this.behavior.getPrivateState().cellProperties[this.index + ',' + y] = value;
        },
        checkColumnAutosizing: function(force) {
            var properties = this.getProperties();
            var a, b, d;
            if (properties) {
                a = properties.width;
                b = properties.preferredWidth || properties.width;
                d = properties.columnAutosized && !force;
                if (a !== b || !d) {
                    properties.width = !d ? b : Math.max(a, b);
                    properties.columnAutosized = !isNaN(properties.width);
                }
            }
        },
        getProperties: function() {
            return this.behavior.getPrivateState().columnProperties[this.index];
        },
        setProperties: function(properties) {
            var current = this.behavior.getPrivateState().columnProperties[this.index];
            clearObjectProperties(current, noExportProperties);
            merge(current, properties);
        },
        toggleSort: function(keys) {
            this.dataModel.toggleSort(this.index, keys);
        },
        getCellEditorAt: function(x, y) {
            return this.dataModel.getCellEditorAt(this.index, y);
        },
        getHeader: function() {
            return this.label;
        },
        getField: function() {
            return this.dataModel.getFields()[this.index];
        }
    };

    var noop = function() {};

    var noExportProperties = [
        'columnHeader',
        'columnHeaderColumnSelection',
        'filterProperties',
        'rowHeader',
        'rowHeaderRowSelection',
        'rowNumbersProperties',
        'treeColumnProperties',
        'treeColumnPropertiesColumnSelection',
    ];

    var merge = function(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    };

    var clearObjectProperties = function(obj, except) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop) && (except.indexOf(prop) === -1)) {
                delete obj[prop];
            }
        }
    };

    var imageCache = {};


    // create these images with http://www.base64-image.de/
    var imgData = [
        ['1-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAFFJREFUKFNjQAL/oTTD////CWJkgFMjEAgD8Q4gLkMSgwOsGoGgDCQExcRrRFJImo1ICqmnEUSiYJgkMgYCrDYia8TQBFVIJ6cCAXJ0QDGDDQD67OYX9wdp0wAAAABJRU5ErkJggg=='],
        ['1-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAExJREFUKFPtjYEJACAIBN2hdZqr2dqu3tB8C5qghzPxlAQZJ4iWJ9E8DpACOmh7ZkLLwoWDNPJxSMONSwa5fzSBJy8z/9B6RpfVZaRO2oo/zJVRDvIAAAAASUVORK5CYII='],
        ['1-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGtJREFUKFOtjoEJgDAQA6uiC7iOc3U2t3sT6Uu+XxDBwFliEtoisnYWM3vFtQG6mWZQ2sEJqvy7tQC6FUzdqLaMpCH1OB1KcXgjBZ8HDhSHEuCIZeW/IcRvwEMFyjey7HjQA317KsvMIuW4AFTUEgvs+3wkAAAAAElFTkSuQmCC'],
        ['1-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAFBJREFUKFPtjdsNQCEIQ93BdZzL2dwOjw9CuV93AEmOJbYNxcw2DHL2P5wHcdR0mAoDuvxFyXHzBrp4UZQAEoUvTL4oBpLDyiveXVnh5WVKm6iPR8RbHxLhAAAAAElFTkSuQmCC'],

        ['2-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAH5JREFUKFOVkAsNgDAMROcBBxjAAEJwgAMcYGGmsIAGLJS7piE3FjJ2yRvpxus+SWLxTWbWRFOJyAgyuDgNDjD9EWewAzZgvElTVCJshLJfXED3jjwu77pG7UKBCvHTAPgwWeY8Kn5KLN4i81SyyOOdgHfzqMixQBb9FWvSdgNN871AHwblVAAAAABJRU5ErkJggg=='],
        ['2-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJVJREFUKFN9kAEVgzAMRPEwBzOAgQnBwRzgYBZqCgtowAL7l6VtILB77zc01yttB7SfQRr+0j8uAugJBTb5sMBoni/QYNSQ91/wAW0g2Sbu9VAlhisubcSUeTCscYdrgt8fg0HJgQrScXXXt82DQckBgR6ghymtF0zKMSBQC2nS+mEBJYV0vBV0N1PzwiJKCtorZob5Cy2RFvXFQAKlAAAAAElFTkSuQmCC'],
        ['2-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJtJREFUKFOFkAsNAjEQRAsXMIADDJwBhOAABzjAwpnCAhqwUN4s2zJQCJO8bGa3018x1ayl1vqXpi3IrWVsuIcF7mrDFWYPTiC3gZUFD3ABbSDFJh6UumtBJ6WNsB/BtugbqSM8T7QBZQw0kK6rt57C24AyBgTagT5msV687Y02zAU9JNP7OfwV0vVuoLeF+swWUV6h7MUvjpTzA6fM6SVV2CbgAAAAAElFTkSuQmCC'],
        ['2-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAIxJREFUKFOVkFsRgDAMBOsBBxjAAEJwgAMcYAFTWEADFspe+iDQH8jMcrSX6yvEGA0KSf9fSB+k8DBD6GGDUx7sMGTvDhVccIQVtIDKFjHPNSH3bm9yaSGG/4MT/N5Rx9VdZxs7A2kDgupAD7PVOWciz4CgakiDOu8akCak4x2gu1lVzzUhTdBesSUsF/uHHu110bZRAAAAAElFTkSuQmCC'],

        ['3-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJVJREFUKFONkQENhDAMRecBB2cAAyhAwTnAAQ6wgAa8nIXTcBbGf6NduiyEe8ljadlfOkiBbGvKOT8a6YLiJXf5oy2/8v1PcJKb5ABYJS+8LnTBqMFBFGOpjKfgIBl7t7pyGxQ+InecPcizMYZ8kzFLGnXUGLwLOTS5a6XuCqFFMib3A2p+Tfmq7GgMQU4+vC8/Vy+lEzGdowwHiWM2AAAAAElFTkSuQmCC'],
        ['3-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJtJREFUKFOFkQERwjAMResBBzOAgSmYAhzgAAdYmAa8YAENWID3SgM5soN/95om6e+lW0OPb5DLTz6bDQOaYIW7fbjBoffGAZdOmEZ9hjN4gTqBjZ6/TUE2B0NeZLLPDUI1BGgHjr32PDUI1SAoRvSNS6+lJqGaJGkBC/9H3ZDFOR8gFNMRHNP3KXN/zZQPEYrRr3ixN7i+aq09ARE7/LLO8L26AAAAAElFTkSuQmCC'],
        ['3-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAKdJREFUKFN1kQERwjAMRQscGMDBDGBgCqYABzjAARamAS9YQAMWyn8hodlt/Xfv0p80uXQrSdXjX7XWLqGTwO3NNQ1iFh9B/S2uufEgcEexI+EaxUMwAN0F98Kb2hjXxmoMwlzMuVRfviMjnQVrz+ZTQWHdAFKsyBsny6WiwroJkiZBwlblsKDTFCI5RrHXdBOsyfsQnl8z5EsKrclzfMUnNef1y5XyBYgdtwl+Lm+LAAAAAElFTkSuQmCC'],
        ['3-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAJpJREFUKFONkQsRwjAQBeMBBzWAgSqoAhzgAAdYqAa8YAENWAi7+cAx6UDfzPaae32ZS5pyzgVEqe97qA9K58tMaYIVnnrwgFPzPqFOCM5wBTdQF9CY4u7vwBZNbuTiGA3KGOigAzj2WtbBoIwBQX1Ez7iUXjApY0iCFrDxf9QN2ZzjB5QhdAbH9HzKtb/m960ib/Gm17jXXkov3zEEuQ7h10oAAAAASUVORK5CYII='],

        ['back', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAD8GlDQ1BJQ0MgUHJvZmlsZQAAOI2NVd1v21QUP4lvXKQWP6Cxjg4Vi69VU1u5GxqtxgZJk6XpQhq5zdgqpMl1bhpT1za2021Vn/YCbwz4A4CyBx6QeEIaDMT2su0BtElTQRXVJKQ9dNpAaJP2gqpwrq9Tu13GuJGvfznndz7v0TVAx1ea45hJGWDe8l01n5GPn5iWO1YhCc9BJ/RAp6Z7TrpcLgIuxoVH1sNfIcHeNwfa6/9zdVappwMknkJsVz19HvFpgJSpO64PIN5G+fAp30Hc8TziHS4miFhheJbjLMMzHB8POFPqKGKWi6TXtSriJcT9MzH5bAzzHIK1I08t6hq6zHpRdu2aYdJYuk9Q/881bzZa8Xrx6fLmJo/iu4/VXnfH1BB/rmu5ScQvI77m+BkmfxXxvcZcJY14L0DymZp7pML5yTcW61PvIN6JuGr4halQvmjNlCa4bXJ5zj6qhpxrujeKPYMXEd+q00KR5yNAlWZzrF+Ie+uNsdC/MO4tTOZafhbroyXuR3Df08bLiHsQf+ja6gTPWVimZl7l/oUrjl8OcxDWLbNU5D6JRL2gxkDu16fGuC054OMhclsyXTOOFEL+kmMGs4i5kfNuQ62EnBuam8tzP+Q+tSqhz9SuqpZlvR1EfBiOJTSgYMMM7jpYsAEyqJCHDL4dcFFTAwNMlFDUUpQYiadhDmXteeWAw3HEmA2s15k1RmnP4RHuhBybdBOF7MfnICmSQ2SYjIBM3iRvkcMki9IRcnDTthyLz2Ld2fTzPjTQK+Mdg8y5nkZfFO+se9LQr3/09xZr+5GcaSufeAfAww60mAPx+q8u/bAr8rFCLrx7s+vqEkw8qb+p26n11Aruq6m1iJH6PbWGv1VIY25mkNE8PkaQhxfLIF7DZXx80HD/A3l2jLclYs061xNpWCfoB6WHJTjbH0mV35Q/lRXlC+W8cndbl9t2SfhU+Fb4UfhO+F74GWThknBZ+Em4InwjXIyd1ePnY/Psg3pb1TJNu15TMKWMtFt6ScpKL0ivSMXIn9QtDUlj0h7U7N48t3i8eC0GnMC91dX2sTivgloDTgUVeEGHLTizbf5Da9JLhkhh29QOs1luMcScmBXTIIt7xRFxSBxnuJWfuAd1I7jntkyd/pgKaIwVr3MgmDo2q8x6IdB5QH162mcX7ajtnHGN2bov71OU1+U0fqqoXLD0wX5ZM005UHmySz3qLtDqILDvIL+iH6jB9y2x83ok898GOPQX3lk3Itl0A+BrD6D7tUjWh3fis58BXDigN9yF8M5PJH4B8Gr79/F/XRm8m241mw/wvur4BGDj42bzn+Vmc+NL9L8GcMn8F1kAcXgSteGGAAABUUlEQVQ4EWNgGLQgZY12e9oa/S/YHIgsx4JNQdwirXaG/4zljEyMjOjy6HJM6ArCJmr0CQjyVBgr2DH++fMXRRqbHIoLfOpU5nELMyfKCasy/Pv/h+H3d4QBuOTgLnDIkl/CI8aSqCCtyPDmywuGb78+Mfz6+g/sAnxyYBdYREs/4pNklRVX4Gd49u4Jw////xk4WTkZfn35x4BPDmQ62AW/f/y/+Pvbf4YfP38y/Prxh+HX9z8MX359ZvgJdAE+ObgBZ98+C3xx7dva+8c/MTCzMTL8+/ef4fvPbww/P/1hwCcHN4DhAMOf8xufh7y8/m3Vw2NfGFjYmRi+//gBDMT/DHjlgCagxMLFrS/C9f5I/Pz393+srCk3PBBBNuGSQzEApPDSzhdxmn8k/v37yxD/+wckFkDiIIBPDqICidR0EJ2t7y0J9AMmwCeHqZrWIgAZ4PYDxftGYgAAAABJRU5ErkJggg=='],
        ['expand', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAQ9JREFUOE9jcIoq/Y+MgYCBFAw2AMahmQEK7UL/kTGyHFFeAGkKOmoLxhgGIHNwYZCm0JMOYIzVACCAC2JzEUhTxFlnMCboAmRvIBsQc8kNjPG6AETjMiD+micYE+UCZAwSA2lKvuUDxnhdgIwLNqWDFcNw+n1/MEYWK9iYjqoJhGE2O8QU/FdplPsfesL+f9bjIBQMErOaqgtUjuYCEA1zNghbpyT815wgBbY570Xo/9znof/T7vn/V++X+N93sB2iB6YYhpENALFBCs2XqP0veB0OxiA2TDMIo2gGYZgXYBgkFrjQ7X/AAWsIXuAKFoNhFM34sN5Ehf8g/Pj9QyAXIY6iCB8GORvZ6RD8nwEA/ZSbmLCRhEoAAAAASUVORK5CYII='],
        ['forth', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAB3RJTUUH1wkbCxU7wwzUCQAAAAlwSFlzAAAewQAAHsEBw2lUUwAAAARnQU1BAACxjwv8YQUAAACcUExURQAAADhUH3CvOHa3O2igNDZRHl2OLzhUHztYIFF7Kj5dIUBgIkNlJEhtJXi4Pna2Oz1cIUNlJEhtJk94KVF8KlN/K1SBK1WCLFaELVqJLlyOL1+SMGOYMmmiNGmjNG+sN2+tN3GvOHKwOHKxOXOzOXS0OnS1OnW2O3e3PXi4Pn28RH+9RoC+R4bCUInDVJHHXpvMa5zNbqTReabSfVhfgkQAAAAQdFJOUwAEh4eOm56goqSprLPi9P64yPeoAAAAZklEQVQY043FRwKCMAAAwUVAqVYUpAjYY6P9/29eAuSmcxn4ba6rAWIxUQIu3dMYA/K2OU6HgEP9qTK7D0iru3glvgyI3+VJ7D0ZsHsUt8jVZMDmeg6dIWBdbq0xYBXMlIClqfaHL3HSC6GZKibEAAAAAElFTkSuQmCC'],
        ['up', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAD8GlDQ1BJQ0MgUHJvZmlsZQAAOI2NVd1v21QUP4lvXKQWP6Cxjg4Vi69VU1u5GxqtxgZJk6XpQhq5zdgqpMl1bhpT1za2021Vn/YCbwz4A4CyBx6QeEIaDMT2su0BtElTQRXVJKQ9dNpAaJP2gqpwrq9Tu13GuJGvfznndz7v0TVAx1ea45hJGWDe8l01n5GPn5iWO1YhCc9BJ/RAp6Z7TrpcLgIuxoVH1sNfIcHeNwfa6/9zdVappwMknkJsVz19HvFpgJSpO64PIN5G+fAp30Hc8TziHS4miFhheJbjLMMzHB8POFPqKGKWi6TXtSriJcT9MzH5bAzzHIK1I08t6hq6zHpRdu2aYdJYuk9Q/881bzZa8Xrx6fLmJo/iu4/VXnfH1BB/rmu5ScQvI77m+BkmfxXxvcZcJY14L0DymZp7pML5yTcW61PvIN6JuGr4halQvmjNlCa4bXJ5zj6qhpxrujeKPYMXEd+q00KR5yNAlWZzrF+Ie+uNsdC/MO4tTOZafhbroyXuR3Df08bLiHsQf+ja6gTPWVimZl7l/oUrjl8OcxDWLbNU5D6JRL2gxkDu16fGuC054OMhclsyXTOOFEL+kmMGs4i5kfNuQ62EnBuam8tzP+Q+tSqhz9SuqpZlvR1EfBiOJTSgYMMM7jpYsAEyqJCHDL4dcFFTAwNMlFDUUpQYiadhDmXteeWAw3HEmA2s15k1RmnP4RHuhBybdBOF7MfnICmSQ2SYjIBM3iRvkcMki9IRcnDTthyLz2Ld2fTzPjTQK+Mdg8y5nkZfFO+se9LQr3/09xZr+5GcaSufeAfAww60mAPx+q8u/bAr8rFCLrx7s+vqEkw8qb+p26n11Aruq6m1iJH6PbWGv1VIY25mkNE8PkaQhxfLIF7DZXx80HD/A3l2jLclYs061xNpWCfoB6WHJTjbH0mV35Q/lRXlC+W8cndbl9t2SfhU+Fb4UfhO+F74GWThknBZ+Em4InwjXIyd1ePnY/Psg3pb1TJNu15TMKWMtFt6ScpKL0ivSMXIn9QtDUlj0h7U7N48t3i8eC0GnMC91dX2sTivgloDTgUVeEGHLTizbf5Da9JLhkhh29QOs1luMcScmBXTIIt7xRFxSBxnuJWfuAd1I7jntkyd/pgKaIwVr3MgmDo2q8x6IdB5QH162mcX7ajtnHGN2bov71OU1+U0fqqoXLD0wX5ZM005UHmySz3qLtDqILDvIL+iH6jB9y2x83ok898GOPQX3lk3Itl0A+BrD6D7tUjWh3fis58BXDigN9yF8M5PJH4B8Gr79/F/XRm8m241mw/wvur4BGDj42bzn+Vmc+NL9L8GcMn8F1kAcXgSteGGAAABVUlEQVQ4EWNgoDWouVD5H58dTPgkHU7o/D/9YzM+JbjldLdI/T/6f8r/Bf8T/quvlsLpCkZsRqgtlPo/La6K4dSfLQzfv/1k4ORiZ1iw7BLDrfhnGOoxBCCaC4GajzF8+PYBbj47kLVy+Q2GWxnPUfSghIHhQlWgzYUMTxjuAm2GaP4PdAEI/wDi8EgNBu0Z8ijegZtmsdD4/8vvtxlYuVgZFNWEGOyNdcAuAGn+DrT9yPL7DO+/fwW7SJBTluFC0VWwXhaYG0/En4Ubxr2a57+yuSbD4W8HwNKcQPLL918MD6s/gdU8ZLgK08aA4gW46LffDN9/A+39+hOMQS5ghUuiMrAbAFbzneEHkAZhkEG/wAywBAqB1YBf3/8DAxGHDhTtDAzwMEAWZ+NkZPjO/YOBA+R2EACGHRsHhIlOYjXg8akvDBPvbGP4BTTgP8wQdJ2Dhg8A9SSD4ETIHK4AAAAASUVORK5CYII='],
        ['down', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAD8GlDQ1BJQ0MgUHJvZmlsZQAAOI2NVd1v21QUP4lvXKQWP6Cxjg4Vi69VU1u5GxqtxgZJk6XpQhq5zdgqpMl1bhpT1za2021Vn/YCbwz4A4CyBx6QeEIaDMT2su0BtElTQRXVJKQ9dNpAaJP2gqpwrq9Tu13GuJGvfznndz7v0TVAx1ea45hJGWDe8l01n5GPn5iWO1YhCc9BJ/RAp6Z7TrpcLgIuxoVH1sNfIcHeNwfa6/9zdVappwMknkJsVz19HvFpgJSpO64PIN5G+fAp30Hc8TziHS4miFhheJbjLMMzHB8POFPqKGKWi6TXtSriJcT9MzH5bAzzHIK1I08t6hq6zHpRdu2aYdJYuk9Q/881bzZa8Xrx6fLmJo/iu4/VXnfH1BB/rmu5ScQvI77m+BkmfxXxvcZcJY14L0DymZp7pML5yTcW61PvIN6JuGr4halQvmjNlCa4bXJ5zj6qhpxrujeKPYMXEd+q00KR5yNAlWZzrF+Ie+uNsdC/MO4tTOZafhbroyXuR3Df08bLiHsQf+ja6gTPWVimZl7l/oUrjl8OcxDWLbNU5D6JRL2gxkDu16fGuC054OMhclsyXTOOFEL+kmMGs4i5kfNuQ62EnBuam8tzP+Q+tSqhz9SuqpZlvR1EfBiOJTSgYMMM7jpYsAEyqJCHDL4dcFFTAwNMlFDUUpQYiadhDmXteeWAw3HEmA2s15k1RmnP4RHuhBybdBOF7MfnICmSQ2SYjIBM3iRvkcMki9IRcnDTthyLz2Ld2fTzPjTQK+Mdg8y5nkZfFO+se9LQr3/09xZr+5GcaSufeAfAww60mAPx+q8u/bAr8rFCLrx7s+vqEkw8qb+p26n11Aruq6m1iJH6PbWGv1VIY25mkNE8PkaQhxfLIF7DZXx80HD/A3l2jLclYs061xNpWCfoB6WHJTjbH0mV35Q/lRXlC+W8cndbl9t2SfhU+Fb4UfhO+F74GWThknBZ+Em4InwjXIyd1ePnY/Psg3pb1TJNu15TMKWMtFt6ScpKL0ivSMXIn9QtDUlj0h7U7N48t3i8eC0GnMC91dX2sTivgloDTgUVeEGHLTizbf5Da9JLhkhh29QOs1luMcScmBXTIIt7xRFxSBxnuJWfuAd1I7jntkyd/pgKaIwVr3MgmDo2q8x6IdB5QH162mcX7ajtnHGN2bov71OU1+U0fqqoXLD0wX5ZM005UHmySz3qLtDqILDvIL+iH6jB9y2x83ok898GOPQX3lk3Itl0A+BrD6D7tUjWh3fis58BXDigN9yF8M5PJH4B8Gr79/F/XRm8m241mw/wvur4BGDj42bzn+Vmc+NL9L8GcMn8F1kAcXgSteGGAAABV0lEQVQ4EWNgGGjAiM0BItl8/7mFGBh+fWdg+A/EMPBi6icM9SwwSWRa1oyHITbKjuHem9sQ4a8MDHtXPmB4gawIysZqwK/v/xk4v3Iw/ABqBAEOIP71A8zEIJgwRIACbJyMDJxcIG2EAVYXQLRxgm0Gs7nZGdhwmIfdAC5WBk5WTgYGoEYQALIYfoNZmATcAIuFxv9ffr/NwArULCbLxnD3z3UGLi52hv/ffjKAIoKHk41BvpXvP8gIQU5ZhgtFV8ExghIthgtV/3fHpTE8YbjLcPfTTYafQMUgA2CAA2jguuX3GK5mPITrgzNgitQWSv2fFlfIcOrPMYYP3z7AhBlAnlm5/AbDrYznKHowYuFW/DPGrEX9DGYszgwCQBtBGkH0yg03MTTDTcfG0N0i9f/o/yn/F/xP+K++Wgrsd2zq8Io5nND57w7EeBURkqy5UEmZAYQsAADbOWDTAxBmkQAAAABJRU5ErkJggg=='],
        ['pause', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB3klEQVQ4jX2Tz0sbURzE3wY8xH+j3i1evBSrUhpRQUwURfxZIirEEiF4k1iqYC/VFjwI4smYlBaClqIHqTFojKmmZq2godgWvejBQgV/RqZvNuERYtYHA8PM7Of0XSH4LFIeKZ/UXEb0rx7IC0XWK5XyC6vm14KWgHZlyG8JSlnlRzm5ls5rswFlBr3bFq7Ez9QW/qR+oCZsAzOqJlwlsz3ZbYMbI7fnAvxiyK33IHm3gV93OxjU3ZCZl6L/LTN2br2X+ZBwZAOepgEv9W7s3YaQTEXh0fvTgIDw0idTm7JbBTcGoCEPwJXoQvx6EbvXXzGQ6FMA+t2bFaNzJV6YA3q/t2H94iNilwvo33EqAH3s8jMiF5/AjSnAGW/G8r8ZhM5n0RdvVwD60LnP6LgxBXRu2TF/No4vfyfh3G5WAHpm82cT4MYU0Bqrhe/Ei8DJCDq+1SsA/YfTUdkNgxtTQFP0OaaO3Jg+9qAlWq0A9MzYcXMfkLkDR6Qcbw87MXHoRGPkmboDembsHJGKPHeQAdStPcHrAztGDxpRv1amAPTM2HGTHyDPs3jpEcb22/Bmvx2Pl4rUKdMzY8fN/VMuMQBWSQ5qAXFF0fMHM81tIud1SL2Tep8RveuBvCD92X9NeXkWOHF72gAAAABJRU5ErkJggg=='],
        ['play', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAANjr9RwUqgAAACBjSFJNAACHDwAAjA0AAPmTAACE5QAAe4IAAOt1AAA/tAAAIlh1a16cAAAD8GlDQ1BJQ0MgUHJvZmlsZQAASMeNVd1v21QUP4lvXKQWP6Cxjg4Vi69VU1u5GxqtxgZJk6XpQhq5zdgqpMl1bhpT1za2021Vn/YCbwz4A4CyBx6QeEIaDMT2su0BtElTQRXVJKQ9dNpAaJP2gqpwrq9Tu13GuJGvfznndz7v0TVAx1ea45hJGWDe8l01n5GPn5iWO1YhCc9BJ/RAp6Z7TrpcLgIuxoVH1sNfIcHeNwfa6/9zdVappwMknkJsVz19HvFpgJSpO64PIN5G+fAp30Hc8TziHS4miFhheJbjLMMzHB8POFPqKGKWi6TXtSriJcT9MzH5bAzzHIK1I08t6hq6zHpRdu2aYdJYuk9Q/881bzZa8Xrx6fLmJo/iu4/VXnfH1BB/rmu5ScQvI77m+BkmfxXxvcZcJY14L0DymZp7pML5yTcW61PvIN6JuGr4halQvmjNlCa4bXJ5zj6qhpxrujeKPYMXEd+q00KR5yNAlWZzrF+Ie+uNsdC/MO4tTOZafhbroyXuR3Df08bLiHsQf+ja6gTPWVimZl7l/oUrjl8OcxDWLbNU5D6JRL2gxkDu16fGuC054OMhclsyXTOOFEL+kmMGs4i5kfNuQ62EnBuam8tzP+Q+tSqhz9SuqpZlvR1EfBiOJTSgYMMM7jpYsAEyqJCHDL4dcFFTAwNMlFDUUpQYiadhDmXteeWAw3HEmA2s15k1RmnP4RHuhBybdBOF7MfnICmSQ2SYjIBM3iRvkcMki9IRcnDTthyLz2Ld2fTzPjTQK+Mdg8y5nkZfFO+se9LQr3/09xZr+5GcaSufeAfAww60mAPx+q8u/bAr8rFCLrx7s+vqEkw8qb+p26n11Aruq6m1iJH6PbWGv1VIY25mkNE8PkaQhxfLIF7DZXx80HD/A3l2jLclYs061xNpWCfoB6WHJTjbH0mV35Q/lRXlC+W8cndbl9t2SfhU+Fb4UfhO+F74GWThknBZ+Em4InwjXIyd1ePnY/Psg3pb1TJNu15TMKWMtFt6ScpKL0ivSMXIn9QtDUlj0h7U7N48t3i8eC0GnMC91dX2sTivgloDTgUVeEGHLTizbf5Da9JLhkhh29QOs1luMcScmBXTIIt7xRFxSBxnuJWfuAd1I7jntkyd/pgKaIwVr3MgmDo2q8x6IdB5QH162mcX7ajtnHGN2bov71OU1+U0fqqoXLD0wX5ZM005UHmySz3qLtDqILDvIL+iH6jB9y2x83ok898GOPQX3lk3Itl0A+BrD6D7tUjWh3fis58BXDigN9yF8M5PJH4B8Gr79/F/XRm8m241mw/wvur4BGDj42bzn+Vmc+NL9L8GcMn8F1kAcXhLu7iPAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjVlhTJlAAABPElEQVQ4T2MAgaoTYuJgBrmg+rhcXupCmf9Fe2TDoUKkgYpDChkgA+pOKf4v2il3qWC3pCZUijhQBjUg6Kjt/9CTDv+rDiv8z9skuzRhPgMHVAl+ULwX1YCIs87/Yy65/S/erfA/Z71MGVQZblC4SxarAfHXPP8n3/IBukbudfY6KVeockxQuBm/Aen3/f9nPQ76n7VK+nDGKmFpqDYEyNlInAG5z0P/F7wO/5+5VHomSvjkrJQmyYDURdJbY3eKc0O1MzCkLyfOgKT50rdSl0obQLUhANBEvAakLJD+mTRbIg6qHBMATcZqQMoimf+x0yX7oMpwg4RZkigGgNgxkyX3J0wVlYAqwQ8SZkAMSFsi8z96otSz2EkS9lAp4kDcNKncuKlS/8N7JPOhQqSB6ElCMm4lSNFCNGBgAAAY+v7rj5j+SgAAAABJRU5ErkJggg=='],
        ['swap', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAI9SURBVDjLpZNBS9RhEMZ/u60aZAdNSXdLrcxNS82DaRQVRBCUGngwwkOnvkB0yEt0qy/QKSrq5DUSQgLTSi01d80gcrXSTTdTViTU//+ded8ORihFYD4wl+FhYOY3T8A5x2YU3Ij54qOmp833zmX+14CWh431vm9OGs+8W9sPXOm49HsHqxarFhXbZ9W2EQxeECNnxUh0W2Y2kdwIcwtzJCbHY8+uvagBCAG0Vl3G4XDOYZ1jbPbj0ffJ0S6xQrT4AFszsxC1qFPycvJYXl45fOxG7ctXNweOB51zWBzW2V+l7MnbS21JLemFNBmhDIwIxhqMGowKxgjGNxkAISuWB2/uoqIE7Rb255dxMHKInO07CLkMxpMTpOZnmE7NEN4ZQUVITIyPDNyK1wEE1mJsud+QLUavl4cr2o5E64glhumJ9ag629TV1ttRd7VGNWQ/Dd6Ol/6VgguCDTjiYzGWvCWiReX4Pwxe2gPAX/Lx5rx1dAKt7c1OjCBGcOIoyC1kMb1IWTjKvqJSJqbGGR6Nk0gkOBitQMQyNDg0kmj/XA0QMr7hRPkp1ClqBbHKXNY88Q9xineVEC6IUFgQwZ62qFUsFm/Fq9p9Pvx66sl0XdD46y8sKiwuLZL6/o3nvd3Mp+cRJ4gVxCliFRFFjBqAQMOdM06MYHxB/FVEYqRPPG3z0/7qI/kazc/Pp7K6kuSXJEP9b2MznbM1f1D4l4oaI/Uq2qViJ1Ods9ENZ2Hy8dd+NdqtRivXUdhsnH8Cn6RstCM01H4AAAAASUVORK5CYII='],
        ['collapse', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAPNJREFUOE9jcIoq/Y+MGXCACUc6/4MwlIsAyJrwGaA3UeE/CEO5CECMAYEL3f4HHLCG4AWuqGpAmpAxVBgOQM42X6L2v+B1OBiD2H0H27FahAFAmjUnSP1Pv+//P/d5KBin3fP/r94vgREecA6ya/Q7lf+HnrD/n/U4CAWDxKym6mJ3BcwbhZsz/iu0C8ExyBUgjCxWsDEdbgiMgRIOMDZIcfItHzAGscGSuADM+TAMEgNpir/mCca4DMBrKkhTzCU3MCbbBRFnncGYkAvgmkAA2YDQkw5gTJQLoEwUA4KO2oIxUQYgY5AYSBMyBiscJICBAQCpROGZ6kqHfwAAAABJRU5ErkJggg=='],
        ['reset', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAL8SURBVDhPbZLZTxNRFMbnDzD65BsurC2tSFlENiG4EARBguzIGkBDwKAsIqA+EAIE45JgogaCxrdqgiQmxhAVjWIEpEioChRKUGmZTpeZaSlQ6OedoVYxnOSXe893vnPvzcml/o+V4WGJrbOmgm+tVLJN+UqeYL1Zp+TbLpy1qz7ud9m2D+u9tjq+qYTmLmbZuUvZIOsmNTnCauOvlWuX77dHuux/wzQ6sIvrbOziKrPBlqa64ZsrwF8u26Jxl4pg7WppxuSbHa52iuJry9rZgtOwZCdsUpgKC8nXtRqsDQ2SxgxY8pPddZbU2drSarHZdqsjxXTqqNl8MhYCXEkO1j59AFeeD6fFDMcXFazkQseECmxBuugROZMwtXKrQ0KxRdl95mPRMMdFgi3KxYZuEWtjn2FJT4HTTA4YHwN7rgTr8/PkkHFYUhNFrzkhjryssIgyRkWOmYKDYAoLxUr/MziNRmI6DUFzmkxwjI6Ie0tWJpwMA+5KA0whwaJmSkrqpgwSuZqRyGAMjyY3q2BXPgEjkRNkZAZarL56Le4FbfXlAGw9vTAGKETNKA1QUkxolJX28IEhOAJr4xOwPeiBkAswMSfAhMe6c/vTPtgePgbtLRdzY0o6Tem85WrdHl/opYFYffeevGIc+n1+ELR/ETTHt+/gWjug85SKGq0IU1K/5CFvf+71gwDXcQNO+wrMDVfF/F+4ztvYIPMxZOS6taX45BZKn5Z1d8HLf32BCAv+Clifv8A6TYO9cxd0TiEMBaWwkadvsBzY7l4s+MgheH/Igux0Wk4ixdTXe8wdDBvS7JdCYE4WDH1tA5aHR+AwMHDo9eDJ8HTnqzArVYgeAW1QhJKpur5T/EyWnkfHZ8mwpkhBYNpLhpkDIdAoDovMyIIw5envrs8eIcN90BsuNv+JxZor6dOHorWTPnKnmgxpO776HnBoYuJVS7e7ol1tW2O++JxsNiOvcTIkYlBNbp7w8seEtwzfImKhDjzUr8nMq14srtrtspOgqN9wa0YvcwzUuQAAAABJRU5ErkJggg=='],

        ['rectangle-spacer', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAA1JREFUGFdjGHSAgQEAAJQAAY8LvLEAAAAASUVORK5CYII='],
        ['add-column', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAPVJREFUOE9jUKtncAbi/0RgZwZsACQBUlDwOhwrJtqA3OehyIrBGE0MvwFZj4OwYqjmc9rN7Ft1mtknQ9WLQLUjDEi/749sGxiDxLSb2N6giwMNOwOkIYYAGTjDQLOR5RNME0wMxgcafAxIi+AMA3Q+ugFQ7Iw3DEDiMI3oGMMA9DCA8bFpBmGoOoQBybd8MDBUEYpByGJAjDAg/poniiSIDwzErzA+ugHazWwngDQiEGMuuWHFWk2sH2CaYBiYHs4BadRojDjrjKIITew8UNNO3RbOWUB2LRBjJqTQkw5YMUgOivEn5aCjtlgx0QYQgbEYwMAAAEqqlSGCjw+bAAAAAElFTkSuQmCC'],

        ['checked', 'iVBORw0KGgoAAAANSUhEUgAAAA0AAAAPCAYAAAA/I0V3AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAYJJREFUOE+NkstLglEQxf0fahG0iFrUxm2ElFDYLohCqCDaCAkWPaxIRbFFEJEaGEKLDCoMETRFUAMLyaIHBUG6sSKIMtKFqEhLT818ZUgmDhzu3DPn9z0uV1RrmUwmyGQyqNVqfFvViwBxu5RFPZuLSyGMKhz/qlEsRV19K8xm6y+w7bpBPFnAferjj3bdQX6DpHcAUwavAHUN2RGIZxBJZHH2mC/TUeydwwTZvBegLENNgw7sX6Wh1FswNmPEmjPCDyGRRwCtW9E3tMgdAtQw7GZjYcNX+gza2wJ3ZXsSZUuQ0vWCOV8SHfJJ/uluhbHUj1v8PKNMszIoQNRMHCShD6Wh8zyhrbOPwz8w+STKlCCJ7oRNUzQH63kBs5thBghePXxlj2aUoSxDPcuXPNiLAc5EEZ6HIkbmV2DYiXBPHs0o079+K0DTVj/s11mE00A0L+g4VcDp10qKZMAzytBhMaTRaPmYg885DlcSzSij0eoEiIouoUqlqqqaL2rlEok+Ad4vlfzPoVDsAAAAAElFTkSuQmCC'],
        ['unchecked', 'iVBORw0KGgoAAAANSUhEUgAAAA0AAAAPCAYAAAA/I0V3AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAARBJREFUOE+9krtug1AQRPldSio7FQ1tZImOkoKOBomGT0EURC5ino54yTw90WywQhTkIkVWGoF2zuxdrlD+t0zThKZpT0Vmxb8CQRCg6zr0fb8rer7vfwcPxxdcrx+YpgnzPGNZlh9ibxxHlGUJshLSdV0at9tNpg7DIBrX5+OkPM9BVkKGYSBJEtR1jbZrBdiqbVtUVYU0TUFWQq+nE+I4xvvlImGaW7FHjwxZCVmWhbfzGVmWoSgKWXUr9uiRISshx3FkEldomubXauzRI0NWQp7nyUR+NG/rfr/jUXxnjx5vmKyEbNuWox9Xvid6ZMhK6HA4wnVdhGGIKIp2RY8MWQmx+JuoqvpUZFb8L6UonyYL3uOtrFH+AAAAAElFTkSuQmCC'],

        ['up-rectangle', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAAHklEQVQYV2PAAv5DaZwApACGsQJkBVgVYlMAxQwMABOrD/GvP+EWAAAAAElFTkSuQmCC'],
        ['down-rectangle', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAABpJREFUGFdjgIL/eDAKIKgABggqgAE0BQwMAPTlD/Fpi0JfAAAAAElFTkSuQmCC'],
        ['sortable', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAAxSURBVChTY8AD/kNpkgBIEwwTDZA1Ea0ZmyYYHmQAmxNhmCAgSxMMkKUJBvBoYmAAAJCXH+FU1T8+AAAAAElFTkSuQmCC'],
        ['empty', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAANSURBVBhXY/j//z8DAAj8Av6IXwbgAAAAAElFTkSuQmCC'],
        ['filter-off', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAMCAYAAABSgIzaAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAChSURBVChTzZHBCoUgFET9TqEiskgyWoutQvRLRIr+cR7XQAjiJW/1BgZmMUevXsY5xy9OoDEGMcYiUzeB67qibVuwQjVNA6311V+WBeM4vsLDMEApde/1fY9pmtI453neHEKAlBJd1z0fXtc16PbjODK07zvmeUZVVd8nooc75zJIOX3Gm6i0bVsGKf8xKIRIuyJTLgJJ3nvQzsjW2geIsQ/pr9hMVrSncAAAAABJRU5ErkJggg=='],
        ['filter-on', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAMCAYAAABSgIzaAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAACoSURBVChTY3BqfP2fHAzWmDbj7f8p294RhVOBasEa02e+/e/VBmQQCTxaX/9PnvYGoj5ywpv/Qd2ENft3vv4f1gfVBAP+nW/+h/a+ATtn1q73KHjytvdgg3070DTBgHvL6/8g22fsQGiaDmSHA21xaybgIpDHixa8hWssnA8NDEIApCh3LkIjiD2INYJCL2X6W3B8gdhEaQQBUOCA4gyE8+e9xaKJgQEA/74BNE3cElkAAAAASUVORK5CYII='],
        ['up-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAYAAADUFP50AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGFJREFUOE+lkkEKQCEIRD2ZJ3Ph3iN4WD9GflpYhj0YYowpGgJmbikd3gjMDFokwbuT1iAiurG5nomgqo5QaPo9ERQRI6Jf7sfGjudy2je23+i0Wl2oQ85TOdlfrJQOazF8br+rqTXQKn0AAAAASUVORK5CYII='],
        ['up-down-spin', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAYAAADUFP50AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGJJREFUOE+lkwEKACEIBH2Zb/PnHsoGeaVJDUjGOgRRpKpkiIj+y4MME3eDR7kaKOVNsJyMNjIHzGy9YnW6J7qIcrriQimeCqORNABd0fpRTkt8uVUj7EsxC6vs/q3e/Q6iD2bwnByjPXHNAAAAAElFTkSuQmCC'],
        ['up-arrow', 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAKCAYAAAB8OZQwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAA9SURBVBhXbYvRCgAgCAOtqP//Y9tElw8NDrcDzd0DBCd7iSL3E0IvGOpf2fKXeZUFKDcYFMwBlDNWS76bXUM5P9In5AzyAAAAAElFTkSuQmCC'],
        ['down-arrow', 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAKCAYAAAB8OZQwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAA+SURBVBhXhYvRCgAgCAOtqP//4+WWhtBDB1duqBUQ/2W5LLtSMFyW020skuecwOGj6QzfkuExt1LlcqICgG3S7z/SL/jVpgAAAABJRU5ErkJggg==']
    ];


    (function() {
        var each, img;
        for (var i = 0; i < imgData.length; i++) {
            each = imgData[i];
            img = new Image();
            img.src = 'data:image/png;base64,' + each[1];
            imageCache[each[0]] = img;
        }
    })();

    Polymer('fin-hypergrid-behavior-base', { /* jslint ignore:line */

        /**
         * @property {object} tableState - memento for the user configured visual properties of the table
         * @instance
         */
        tableState: null,

        /**
         * @property {fin-hypergrid} grid - my instance of hypergrid
         * @instance
         */
        grid: null,

        /**
         * @property {array} editorTypes - list of default cell editor names
         * @instance
         */
        editorTypes: ['choice', 'textfield', 'color', 'slider', 'spinner', 'date'],

        /**
         * @property {object} featureChain - controller chain of command
         * @instance
         */
        featureChain: null,

        dataModel: null,
        baseModel: null,
        cellProviderDecorator: null,

        scrollPositionX: 0,
        scrollPositionY: 0,

        featureMap: {},
        allColumns: [],
        columns: [],

        DataModelDecorator: DataModelDecorator,

        clearColumns: function() {
            this.columns = [];
            this.allColumns = [];
            this.columns[-1] = this.newColumn(-1, '');
            this.columns[-2] = this.newColumn(-2, 'Tree');
            this.allColumns[-1] = this.columns[-1];
            this.allColumns[-2] = this.columns[-2];
        },

        getColumn: function(x) {
            return this.columns[x];
        },

        newColumn: function(index, label) {
            var properties = this.createColumnProperties();
            this.getPrivateState().columnProperties[index] = properties;
            return new Column(this, index, label);
        },

        addColumn: function(index, label) {
            var column = this.newColumn(index, label);
            this.columns.push(column);
            this.allColumns.push(column);
            return column;
        },

        createColumns: function() {
            //concrete implementation here
        },

        createColumnProperties: function() {
            var tableState = this.getPrivateState();
            var properties = Object.create(tableState);

            properties.rowNumbersProperties = Object.create(properties, {
                foregroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.columnHeaderForegroundSelectionColor;
                    },
                    set: function(value) {
                        this.columnHeaderForegroundSelectionColor = value;
                    }
                },
                backgroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.columnHeaderBackgroundSelectionColor;
                    },
                    set: function(value) {
                        this.columnHeaderBackgroundSelectionColor = value;
                    }
                }
            });

            properties.rowHeader = Object.create(properties, {
                font: {
                    configurable: true,
                    get: function() {
                        return this.rowHeaderFont;
                    },
                    set: function(value) {
                        this.rowHeaderFont = value;
                    }
                },
                color: {
                    configurable: true,
                    get: function() {
                        return this.rowHeaderColor;
                    },
                    set: function(value) {
                        this.rowHeaderColor = value;
                    }
                },
                backgroundColor: {
                    configurable: true,
                    get: function() {
                        return this.rowHeaderBackgroundColor;
                    },
                    set: function(value) {
                        this.rowHeaderBackgroundColor = value;
                    }
                },
                foregroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.rowHeaderForegroundSelectionColor;
                    },
                    set: function(value) {
                        this.rowHeaderForegroundSelectionColor = value;
                    }
                },
                backgroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.rowHeaderBackgroundSelectionColor;
                    },
                    set: function(value) {
                        this.rowHeaderBackgroundSelectionColor = value;
                    }
                }
            });

            properties.columnHeader = Object.create(properties, {
                font: {
                    configurable: true,
                    get: function() {
                        return this.columnHeaderFont;
                    },
                    set: function(value) {
                        this.columnHeaderFont = value;
                    }
                },
                color: {
                    configurable: true,
                    get: function() {
                        return this.columnHeaderColor;
                    },
                    set: function(value) {
                        this.columnHeaderColor = value;
                    }
                },
                backgroundColor: {
                    configurable: true,
                    get: function() {
                        return this.columnHeaderBackgroundColor;
                    },
                    set: function(value) {
                        this.columnHeaderBackgroundColor = value;
                    }
                },
                foregroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.columnHeaderForegroundSelectionColor;
                    },
                    set: function(value) {
                        this.columnHeaderForegroundSelectionColor = value;
                    }
                },
                backgroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.columnHeaderBackgroundSelectionColor;
                    },
                    set: function(value) {
                        this.columnHeaderBackgroundSelectionColor = value;
                    }
                }
            });

            properties.columnHeaderColumnSelection = Object.create(properties.columnHeader, {
                foregroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.columnHeaderForegroundColumnSelectionColor;
                    },
                    set: function(value) {
                        this.columnHeaderForegroundColumnSelectionColor = value;
                    }
                },
                backgroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.columnHeaderBackgroundColumnSelectionColor;
                    },
                    set: function(value) {
                        this.columnHeaderBackgroundColumnSelectionColor = value;
                    }
                }
            });

            properties.rowHeaderRowSelection = Object.create(properties.rowHeader, {
                foregroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.rowHeaderForegroundRowSelectionColor;
                    },
                    set: function(value) {
                        this.rowHeaderForegroundRowSelectionColor = value;
                    }
                },
                backgroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.rowHeaderBackgroundRowSelectionColor;
                    },
                    set: function(value) {
                        this.rowHeaderBackgroundRowSelectionColor = value;
                    }
                }
            });

            properties.filterProperties = Object.create(properties, {
                font: {
                    configurable: true,
                    get: function() {
                        return this.filterFont;
                    },
                    set: function(value) {
                        this.filterFont = value;
                    }
                },
                color: {
                    configurable: true,
                    get: function() {
                        return this.filterColor;
                    },
                    set: function(value) {
                        this.filterColor = value;
                    }
                },
                backgroundColor: {
                    configurable: true,
                    get: function() {
                        return this.filterBackgroundColor;
                    },
                    set: function(value) {
                        this.filterBackgroundColor = value;
                    }
                },
                foregroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.filterForegroundSelectionColor;
                    },
                    set: function(value) {
                        this.filterForegroundSelectionColor = value;
                    }
                },
                backgroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.filterBackgroundSelectionColor;
                    },
                    set: function(value) {
                        this.filterBackgroundSelectionColor = value;
                    }
                },
                cellBorderStyle: {
                    configurable: true,
                    get: function() {
                        return this.filterCellBorderStyle;
                    },
                    set: function(value) {
                        this.filterCellBorderStyle = value;
                    }
                },
                cellBorderThickness: {
                    configurable: true,
                    get: function() {
                        return this.filterCellBorderThickness;
                    },
                    set: function(value) {
                        this.filterCellBorderThickness = value;
                    }
                }
            });

            properties.treeColumnProperties = Object.create(properties, {
                font: {
                    configurable: true,
                    get: function() {
                        return this.treeColumnFont;
                    },
                    set: function(value) {
                        this.treeColumnFont = value;
                    }
                },
                color: {
                    configurable: true,
                    get: function() {
                        return this.treeColumnColor;
                    },
                    set: function(value) {
                        this.treeColumnColor = value;
                    }
                },
                backgroundColor: {
                    configurable: true,
                    get: function() {
                        return this.treeColumnBackgroundColor;
                    },
                    set: function(value) {
                        this.treeColumnBackgroundColor = value;
                    }
                },
                foregroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.treeColumnForegroundSelectionColor;
                    },
                    set: function(value) {
                        this.treeColumnForegroundSelectionColor = value;
                    }
                },
                backgroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.treeColumnBackgroundSelectionColor;
                    },
                    set: function(value) {
                        this.treeColumnBackgroundSelectionColor = value;
                    }
                }
            });

            properties.treeColumnPropertiesColumnSelection = Object.create(properties.treeColumnProperties, {
                foregroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.treeColumnForegroundColumnSelectionColor;
                    },
                    set: function(value) {
                        this.treeColumnForegroundColumnSelectionColor = value;
                    }
                },
                backgroundSelectionColor: {
                    configurable: true,
                    get: function() {
                        return this.treeColumnBackgroundColumnSelectionColor;
                    },
                    set: function(value) {
                        this.treeColumnBackgroundColumnSelectionColor = value;
                    }
                }
            });

            return properties;
        },

        getColumnWidth: function(x) {
            var col = this.getColumn(x);
            if (!col) {
                return this.resolveProperty('defaultColumnWidth');
            }
            var width = col.getWidth();
            return width;
        },

        setColumnWidth: function(x, width) {
            this.getColumn(x).setWidth(width);
            this.stateChanged();
        },

        getDataModel: function() {
            if (this.dataModel === null) {
                var dataModel = this.getDefaultDataModel();
                this.setDataModel(dataModel);
            }
            return this.dataModel;
        },

        getCellRenderer: function(config, x, y) {
            return this.getColumn(x).getCellRenderer(config, y);
        },

        setDataModel: function(newDataModel) {
            this.dataModel = newDataModel;
        },

        /**
         * @function
         * @instance
         * @description
         utility function to empty an object of its members
         * @param {Object} obj - the object to empty
         */
        clearObjectProperties: function(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    delete obj[prop];
                }
            }
        },

        /**
         * @function
         * @instance
         * @description
         polymer lifecycle event
         */
        ready: function() {
            this.readyInit();
        },

        /**
         * @function
         * @instance
         * @description
         the function to override for initialization
         */
        readyInit: function() {
            this.getDataModel();
            this.cellProvider = this.createCellProvider();
            this.renderedColumnCount = 30;
            this.renderedRowCount = 60;
            this.dataUpdates = {}; //for overriding with edit values;
        },

        /**
         * @function
         * @instance
         * @description
         getter for a [Memento](http://c2.com/cgi/wiki?MementoPattern) Object
         * #### returns: Object
         */
        getPrivateState: function() {
            if (!this.tableState) {
                this.tableState = this.getDefaultState();
            }
            return this.tableState;
        },

        //this is effectively a clone, with certain things removed....
        getState: function() {
            var copy = JSON.parse(JSON.stringify(this.getPrivateState()));

            //lets remove the column properties that
            //are not to be exported....
            noExportProperties.forEach(function(name) {
                copy.columnProperties.forEach(function(e) {
                    delete e[name];
                });

            });

            return copy;
        },
        /**
         * @function
         * @instance
         * @description
         clear all table state
         */
        clearState: function() {
            this.tableState = null;
        },

        /**
         * @function
         * @instance
         * @description
         create a default empty tablestate
         * #### returns: Object
         */
        getDefaultState: function() {
            var tableProperties = this.getGrid()._getProperties();
            var state = Object.create(tableProperties);

            merge(state, {
                rowHeights: {},
                cellProperties: {},
                columnProperties: []
            });

            return state;
        },

        /**
        * @function
        * @instance
        * @description
        return this table to a previous state. see the [memento pattern](http://c2.com/cgi/wiki?MementoPattern)
        * @param {Object} memento - an encapulated representation of table state
        */
        setState: function(memento) {

            //we don't want to clobber the column properties completely
            if (!memento.columnIndexes) {
                var fields = this.getFields();
                memento.columnIndexes = [];
                for (var i = 0; i < fields.length; i++) {
                    memento.columnIndexes[i] = i;
                }
            }
            var colProperties = memento.columnProperties;
            delete memento.columnProperties;
            this.tableState = null;
            var state = this.getPrivateState();
            this.createColumns();
            this.setColumnOrder(memento.columnIndexes);
            merge(state, memento);
            this.setAllColumnProperties(colProperties);
            memento.columnProperties = colProperties;
            //memento.columnProperties = colProperties;

            // this.getDataModel().setState(memento);
            // var self = this;
            // requestAnimationFrame(function() {
            //     self.applySorts();
            //     self.changed();
            //     self.stateChanged();
            // });

            //just to be close/ it's easier on the eyes
            this.setColumnWidth(-1, 24.193359375);
            this.getDataModel().applyState();
        },

        setAllColumnProperties: function(properties) {
            properties = properties || [];
            for (var i = 0; i < properties.length; i++) {
                var current = this.getPrivateState().columnProperties[i];
                clearObjectProperties(current, noExportProperties);
                merge(current, properties[i]);
            }
        },

        setColumnOrder: function(indexes) {
            if (!indexes) {
                this.columns.length = 0;
                return;
            }
            this.columns.length = indexes.length;
            for (var i = 0; i < indexes.length; i++) {
                this.columns[i] = this.allColumns[indexes[i]];
            }
        },

        applySorts: function() {
            //if I have sorts, apply them now//
        },

        /**
         * @function
         * @instance
         * @description
         fetch the value for a property key
         * #### returns: Object
         * @param {string} key - a property name
         */
        resolveProperty: function(key) {
            return this.grid.resolveProperty(key);
        },

        /**
         * @function
         * @instance
         * @description
         a specific cell was clicked, you've been notified
         * @param {rectangle.point} cell - point of cell coordinates
         * @param {Object} event - all event information
         */
        cellClicked: function(cell, event) {
            this.getDataModel().cellClicked(cell, event);
        },

        /**
         * @function
         * @instance
         * @description
         a specific cell was le doubclicked, you've been notified
         * @param {rectangle.point} cell - point of cell coordinates
         * @param {Object} event - all event information
         */
        cellDoubleClicked: function( /* cell, event */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         add nextFeature to me If I don't have a next node, otherwise pass it along
         * @param {fin-hypergrid-feature-base} nextFeature - [fin-hypergrid-feature-base](module-features_base.html)
         */
        setNextFeature: function(nextFeature) {
            this.featureMap[nextFeature.alias] = nextFeature;
            if (this.featureChain) {
                this.featureChain.setNext(nextFeature);
            } else {
                this.featureChain = nextFeature;
            }
        },

        lookupFeature: function(key) {
            return this.featureMap[key];
        },

        /**
         * @function
         * @instance
         * @description
         this is the callback for the plugin pattern of nested tags
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        installOn: function(grid) {
            grid.setBehavior(this);
            this.initializeFeatureChain(grid);
        },

        /**
         * @function
         * @instance
         * @description
         create the feature chain - this is the [chain of responsibility](http://c2.com/cgi/wiki?ChainOfResponsibilityPattern) pattern.
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        initializeFeatureChain: function(grid) {
            this.setNextFeature(new features.KeyPaging());
            this.setNextFeature(new features.Overlay());
            this.setNextFeature(new features.ColumnResizing());
            this.setNextFeature(new features.RowResizing());
            this.setNextFeature(new features.Filters());
            this.setNextFeature(new features.RowSelection());
            this.setNextFeature(new features.ColumnSelection());
            this.setNextFeature(new features.CellSelection());
            this.setNextFeature(new features.ColumnMoving());
            this.setNextFeature(new features.ColumnSorting());
            // this.setNextFeature(new features.ThumbwheelScrolling());
            this.setNextFeature(new features.CellEditing());
            this.setNextFeature(new features.CellClick());
            this.setNextFeature(new features.OnHover());
            //this.setNextFeature(new features.ColumnAutosizing());

            this.featureChain.initializeOn(grid);
        },

        /**
         * @function
         * @instance
         * @description
         getter for the cell provider
         * #### returns: [fin-hypergrid-cell-provider](module-._cell-provider.html)
         */
        getCellProvider: function() {
            return this.cellProvider;
        },

        /**
         * @function
         * @instance
         * @description
         setter for the hypergrid
         * @param {fin-hypergrid} finGrid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        setGrid: function(finGrid) {
            this.grid = finGrid;
            this.getDataModel().setGrid(finGrid);
            this.clearColumns();
        },

        /**
         * @function
         * @instance
         * @description
         getter for the hypergrid
         * #### returns: [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {type} varname - descripton
         */
        getGrid: function() {
            return this.grid;
        },

        /**
         * @function
         * @instance
         * @description
         you can override this function and substitute your own cell provider
         * #### returns: [fin-hypergrid-cell-provider](module-._cell-provider.html)
         */
        createCellProvider: function() {
            var provider = new hypergrid.CellProvider();
            return provider;
        },

        /**
         * @function
         * @instance
         * @description
         return the value at x,y for the top left section of the hypergrid, first check to see if something was overridden
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getValue: function(x, y) {
            var column = this.getColumn(x);
            if (!column) {
                return undefined;
            }
            var result = column.getValue(y);
            return result;
        },

        /**
         * @function
         * @instance
         * @description
         update the data at point x, y with value
         * #### returns: type
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         * @param {Object} value - the value to use
         */
        setValue: function(x, y, value) {
            var column = this.getColumn(x);
            if (!column) {
                return;
            }
            var result = column.setValue(y, value);
            return result;
        },

        getDataValue: function(x, y) {
            return this.getDataModel().getValue(x, y);
        },

        setDataValue: function(x, y, value) {
            this.getDataModel().setValue(x, y, value);
        },
        /**
         * @function
         * @instance
         * @description
         return the value at x,y for the top left section of the hypergrid, first check to see if something was overridden
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getCellProperties: function(x, y) {
            var col = this.getColumn(x);
            return col.getCellProperties(y);
        },

        /**
         * @function
         * @instance
         * @description
         update the data at point x, y with value
         * #### returns: type
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         * @param {Object} value - the value to use
         */
        setCellProperties: function(x, y, value) {
            var col = this.getColumn(x);
            if (col) {
                col.setCellProperties(y, value);
            }
        },
        /**
         * @function
         * @instance
         * @description
         return the number of rows
         * #### returns: integer
         */
        getRowCount: function() {
            return this.getDataModel().getRowCount();
        },

        /**
         * @function
         * @instance
         * @description
         return the height in pixels of the fixed rows area
         * #### returns: integer
         */
        getFixedRowsHeight: function() {
            var count = this.getFixedRowCount();
            var total = 0;
            for (var i = 0; i < count; i++) {
                total = total + this.getRowHeight(i);
            }
            return total;
        },

        /**
         * @function
         * @instance
         * @description
         get height in pixels of a specific row
         * #### returns: integer
         * @param {integer} rowNum - row index of interest
         */
        getRowHeight: function(rowNum) {
            var tableState = this.getPrivateState();
            if (tableState.rowHeights) {
                var override = tableState.rowHeights[rowNum];
                if (override) {
                    return override;
                }
            }
            return this.getDefaultRowHeight();
        },

        /**
         * @function
         * @instance
         * @description
         returns a lazily initialized value from the properties mechanism for 'defaultRowHeight', should be ~20px
         * #### returns: integer
         */
        getDefaultRowHeight: function() {
            if (!this.defaultRowHeight) {
                this.defaultRowHeight = this.resolveProperty('defaultRowHeight');
            }
            return this.defaultRowHeight;
        },

        /**
         * @function
         * @instance
         * @description
         set the pixel height of a specific row
         * @param {integer} rowNum - the row index of interest
         * @param {integer} height - pixel height
         */
        setRowHeight: function(rowNum, height) {
            var tableState = this.getPrivateState();
            tableState.rowHeights[rowNum] = Math.max(5, height);
            this.stateChanged();
        },

        /**
         * @function
         * @instance
         * @description
         return the potential maximum height of the fixed rows areas, this will allow 'floating' fixed rows
         * #### returns: integer
         */
        getFixedRowsMaxHeight: function() {
            var height = this.getFixedRowsHeight();
            return height;
        },

        /**
         * @function
         * @instance
         * @description
         return the width of the fixed column area
         * #### returns: integer
         */
        getFixedColumnsWidth: function() {
            var count = this.getFixedColumnCount();
            var total = 0;
            if (this.getGrid().isShowRowNumbers()) {
                total = this.getColumnWidth(-1);
            }
            for (var i = 0; i < count; i++) {
                total = total + this.getColumnWidth(i);
            }
            return total;
        },

        /**
         * @function
         * @instance
         * @description
         return the potential total width of the fixed columns area; this exists to support 'floating' columns
         * #### returns: integer
         */
        getFixedColumnsMaxWidth: function() {
            var width = this.getFixedColumnsWidth();
            return width;
        },

        /**
         * @function
         * @instance
         * @description
         set the scroll position in vertical dimension and notifiy listeners
         * @param {integer} y - the new y value
         */
        _setScrollPositionY: function(y) {
            this.setScrollPositionY(y);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         set the scroll position in horizontal dimension and notifiy listeners
         * @param {integer} x - the new x value
         */
        _setScrollPositionX: function(x) {
            this.setScrollPositionX(x);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         set the number of columns just rendered, includes partially rendered columns
         * @param {integer} count - how many columns were just rendered
         */
        setRenderedColumnCount: function(count) {
            this.renderedColumnCount = count;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of rows just rendered, includes partially rendered rows
         * @param {integer} count - how many rows were just rendered
         */
        setRenderedRowCount: function(count) {
            this.renderedRowCount = count;
        },


        /**
         * @function
         * @instance
         * @description
         the fixed row area has been clicked, massage the details and call the real function
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        _fixedRowClicked: function(grid, mouse) {
            var x = this.translateColumnIndex(this.getScrollPositionX() + mouse.gridCell.x - this.getFixedColumnCount());
            var translatedPoint = this.grid.rectangles.point.create(x, mouse.gridCell.y);
            mouse.gridCell = translatedPoint;
            this.fixedRowClicked(grid, mouse);
        },

        /**
         * @function
         * @instance
         * @description
         the fixed column area has been clicked, massage the details and call the real function
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
        */
        _fixedColumnClicked: function(grid, mouse) {
            var translatedPoint = this.grid.rectangles.point.create(mouse.gridCell.x, this.getScrollPositionY() + mouse.gridCell.y - this.getFixedRowCount());
            mouse.gridCell = translatedPoint;
            this.fixedColumnClicked(grid, mouse);
        },

        moveSingleSelect: function(grid, x, y) {
            if (this.featureChain) {
                this.featureChain.moveSingleSelect(grid, x, y);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate setting the cursor up the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        setCursor: function(grid) {
            grid.updateCursor();
            this.featureChain.setCursor(grid);
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse move to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onMouseMove: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseMove(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling tap to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onTap: function(grid, event) {

            //global row selection
            if (event.gridCell.x === -1 && event.gridCell.y === 0) {
                grid.toggleSelectAllRows();
            }

            if (this.featureChain) {
                this.featureChain.handleTap(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling tap to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onContextMenu: function(grid, event) {
            var proceed = grid.fireSyntheticContextMenuEvent(event);
            if (proceed && this.featureChain) {
                this.featureChain.handleContextMenu(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling wheel moved to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onWheelMoved: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleWheelMoved(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse up to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onMouseUp: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseUp(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse drag to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onMouseDrag: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseDrag(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling key down to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onKeyDown: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleKeyDown(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling key up to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onKeyUp: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleKeyUp(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling double click to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onDoubleClick: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleDoubleClick(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling hold pulse to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onHoldPulse: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleHoldPulse(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling double click to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        toggleColumnPicker: function() {
            if (this.featureChain) {
                this.featureChain.toggleColumnPicker(this.getGrid());
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse down to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        handleMouseDown: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseDown(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse exit to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        handleMouseExit: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseExit(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         this function is replaced by the grid on initialization and serves as the callback
         */
        changed: function() {},

        /**
         * @function
         * @instance
         * @description
         this function is replaced by the grid on initialization and serves as the callback
         */
        shapeChanged: function() {},

        /**
         * @function
         * @instance
         * @description
         return true if we can re-order columns
         * #### returns: boolean
         */
        isColumnReorderable: function() {
            return true;
        },

        /**
         * @function
         * @instance
         * @description
         return the properties for a specific column, these are used if no cell properties are specified
         * #### returns: Object
         * @param {index} columnIndex - the column index of interest
         */
        getColumnProperties: function(columnIndex) {
            var col = this.columns[columnIndex];
            if (!col) {
                return {
                    isNull: true
                };
            }
            var properties = col.getProperties();
            return properties;
        },
        setColumnProperties: function(columnIndex, properties) {
            var columnProperties = this.getColumnProperties(columnIndex);
            merge(columnProperties, properties);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         returns the list of labels to use for the column picker
         * #### returns: Array of strings
         */
        getColumnDescriptors: function() {
            //assumes there is one row....
            this.insureColumnIndexesAreInitialized();
            var tableState = this.getPrivateState();
            var columnCount = tableState.columnIndexes.length;
            var labels = [];
            for (var i = 0; i < columnCount; i++) {
                var id = tableState.columnIndexes[i];
                labels.push({
                    id: id,
                    label: this.getHeader(id),
                    field: this.getField(id)
                });
            }
            return labels;
        },

        /**
         * @function
         * @instance
         * @description
         return the field at colIndex
         * #### returns: string
         * @param {integer} colIndex - the column index of interest
         */
        getField: function(colIndex) {
            if (colIndex === -1) {
                return 'tree';
            }
            var col = this.getColumn(colIndex);
            return col.getField();
        },
        /**
         * @function
         * @instance
         * @description
         return the column heading at colIndex
         * #### returns: string
         * @param {integer} colIndex - the column index of interest
         */
        getHeader: function(colIndex) {
            if (colIndex === -1) {
                return 'Tree';
            }
            var col = this.getColumn(colIndex);
            return col.getHeader();
        },
        /**
         * @function
         * @instance
         * @description
         this is called by the column editor post closing; rebuild the column order indexes
         * @param {Array} list - list of column objects from the column editor
         */
        setColumnDescriptors: function(lists) {
            //assumes there is one row....
            var visible = lists.visible;
            var tableState = this.getPrivateState();

            var columnCount = visible.length;
            var indexes = [];
            var i;
            for (i = 0; i < columnCount; i++) {
                indexes.push(visible[i].id);
            }
            tableState.columnIndexes = indexes;
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         return an Array of strings of the column header labels that are currently hidden
         * #### returns: Array of strings
         */
        getHiddenColumnDescriptors: function() {
            var tableState = this.getPrivateState();
            var indexes = tableState.columnIndexes;
            var labels = [];
            var columnCount = this.getColumnCount();
            for (var i = 0; i < columnCount; i++) {
                if (indexes.indexOf(i) === -1) {
                    labels.push({
                        id: i,
                        label: this.getHeader(i),
                        field: this.getField(i)
                    });
                }
            }
            return labels;
        },

        /**
         * @function
         * @instance
         * @description
         hide columns that are specified by their indexes
         * @param {Array} arrayOfIndexes - an array of column indexes to hide
         */
        hideColumns: function(arrayOfIndexes) {
            var tableState = this.getPrivateState();
            var order = tableState.columnIndexes;
            for (var i = 0; i < arrayOfIndexes.length; i++) {
                var each = arrayOfIndexes[i];
                if (order.indexOf(each) !== -1) {
                    order.splice(order.indexOf(each), 1);
                }
            }
        },

        /**
         * @function
         * @instance
         * @description
         return the number of fixed columns
         * #### returns: integer
         */
        getFixedColumnCount: function() {
            var tableState = this.getPrivateState();
            return tableState.fixedColumnCount || 0;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of fixed columns
         * @param {integer} numberOfFixedColumns - the integer count of how many columns to be fixed
         */
        setFixedColumnCount: function(numberOfFixedColumns) {
            var tableState = this.getPrivateState();
            tableState.fixedColumnCount = numberOfFixedColumns;
        },

        /**
         * @function
         * @instance
         * @description
         return the count of fixed rows
         * #### returns: integer
         */
        getFixedRowCount: function() {
            if (!this.tableState) {
                return 0;
            }
            var usersSize = this.tableState.fixedRowCount || 0;
            var headers = this.getGrid().getHeaderRowCount();
            var total = usersSize + headers;
            return total;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of rows that are fixed
         * @param {integer} numberOfFixedRows - the count of rows to be set fixed
         */
        setFixedRowCount: function(numberOfFixedRows) {
            this.tableState.fixedRowCount = numberOfFixedRows;
        },

        /**
         * @function
         * @instance
         * @description
         return the count of fixed rows
         * #### returns: integer
         */
        getHeaderRowCount: function() {
            var grid = this.getGrid();
            var header = grid.isShowHeaderRow() ? 1 : 0;
            var filter = grid.isShowFilterRow() ? 1 : 0;
            var totals = this.getTopTotals().length;
            var count = header + filter + totals;
            return count;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of rows that are fixed
         * @param {integer} numberOfFixedRows - the count of rows to be set fixed
         */
        setHeaderRowCount: function(numberOfHeaderRows) {
            this.tableState.headerRowCount = numberOfHeaderRows;
        },

        /**
         * @function
         * @instance
         * @description
         return the count of fixed rows
         * #### returns: integer
         */
        getHeaderColumnCount: function() {
            var grid = this.getGrid();
            var count = grid.resolveProperty('headerColumnCount');
            return count;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of rows that are fixed
         * @param {integer} numberOfFixedRows - the count of rows to be set fixed
         */
        setHeaderColumnCount: function(numberOfHeaderColumns) {
            this.tableState.headerColumnCount = numberOfHeaderColumns;
        },
        /**
         * @function
         * @instance
         * @description
         build and open the editor within the container div argument, this function should return false if we don't want the editor to open
         * #### returns: boolean
         * @param {HTMLDivElement} div - the containing div element
         */
        openEditor: function(div) {
            var container = document.createElement('div');

            var hidden = document.createElement('fin-hypergrid-dnd-list');
            var visible = document.createElement('fin-hypergrid-dnd-list');

            container.appendChild(hidden);
            container.appendChild(visible);

            this.beColumnStyle(hidden.style);
            hidden.title = 'hidden columns';
            hidden.list = this.getHiddenColumnDescriptors();

            this.beColumnStyle(visible.style);
            visible.style.left = '50%';
            visible.title = 'visible columns';
            visible.list = this.getColumnDescriptors();

            div.lists = {
                hidden: hidden.list,
                visible: visible.list
            };
            div.appendChild(container);
            return true;
        },

        /**
         * @function
         * @instance
         * @description
         the editor is requesting close return true or false, and deal with the edits
         * @param {HTMLDivElement} div - the containing div element
         */
        closeEditor: function(div) {
            noop(div);
            var lists = div.lists;
            this.setColumnDescriptors(lists);
            return true;
        },

        /**
         * @function
         * @instance
         * @description
         a dnd column has just been dropped, we've been notified
         */
        endDragColumnNotification: function() {},

        /**
         * @function
         * @instance
         * @description
         bind column editor appropriate css values to arg style
         * @param {HTMLStyleElement} style - the style object to enhance
         */
        beColumnStyle: function(style) {
            style.top = '5%';
            style.position = 'absolute';
            style.width = '50%';
            style.height = '100%';
            style.whiteSpace = 'nowrap';
        },

        /**
         * @function
         * @instance
         * @description
         return the cursor at a specific x,y coordinate
         * #### returns: string
         * @param {integer} x - the x coordinate
         * @param {integer} y - the y coordinate
         */
        getCursorAt: function( /* x, y */ ) {
            return null;
        },

        /**
         * @function
         * @instance
         * @description
         return the total number of columns
         * #### returns: integer
         */
        getColumnCount: function() {
            return this.columns.length;
        },

        /**
         * @function
         * @instance
         * @description
         return the column alignment at column x
         * #### returns: string ['left','center','right']
         * @param {integer} x - the column index of interest
         */
        getColumnAlignment: function( /* x */ ) {
            return 'center';
        },

        /**
         * @function
         * @instance
         * @description
         quietly set the scroll position in the horizontal dimension
         * @param {integer} x - the position in pixels
         */
        setScrollPositionX: function(x) {
            this.scrollPositionX = x;
        },

        getScrollPositionX: function() {
            return this.scrollPositionX;
        },

        /**
         * @function
         * @instance
         * @description
         quietly set the scroll position in the horizontal dimension
         * #### returns: type
         * @param {integer} y - the position in pixels
         */
        setScrollPositionY: function(y) {
            this.scrollPositionY = y;
        },

        getScrollPositionY: function() {
            return this.scrollPositionY;
        },

        /**
         * @function
         * @instance
         * @description
         return the cell editor for coordinate x,y
         * #### returns: [fin-hypergrid-cell-editor-base](module-cell-editors_base.html)
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getCellEditorAt: function(x, y) {
            return this.getColumn(x).getCellEditorAt(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         fixed row has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        toggleSort: function(x, keys) {
            this.getColumn(x).toggleSort(keys);
        },

        /**
         * @function
         * @instance
         * @description
         returns true if we should highlight on hover
         * #### returns: boolean
         * @param {boolean} isColumnHovered - the column is hovered or not
         * @param {boolean} isRowHovered - the row is hovered or not
         */
        highlightCellOnHover: function(isColumnHovered, isRowHovered) {
            return isColumnHovered && isRowHovered;
        },

        /**
         * @function
         * @instance
         * @description
         return the columnId/label/fixedRowValue at x
         * #### returns: string
         * @param {integer} x - the view translated x index
         */
        getColumnId: function(x) {
            var col = this.getFixedRowValue(x, 0);
            return col;
        },

        /**
         * @function
         * @instance
         * @description
         return an HTMLImageElement given it's alias
         * #### returns: HTMLImageElement
         * @param {string} key - an image alias
         */
        getImage: function(key) {
            var image = imageCache[key];
            return image;
        },


        /**
         * @function
         * @instance
         * @description
         set the image for a specific alias
         * @param {string} key - an image alias
         * @param {HTMLImageElement} image - the image to cache
         */
        setImage: function(key, image) {
            imageCache[key] = image;
        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        cellPropertiesPrePaintNotification: function(cellProperties) {
            var row = this.getRow(cellProperties.y);
            var columnId = this.getHeader(cellProperties.x);
            cellProperties.row = row;
            cellProperties.columnId = columnId;
        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a fixed row cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        cellFixedRowPrePaintNotification: function( /* cell */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a fixed column cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
        */
        cellFixedColumnPrePaintNotification: function( /* cell */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a top left cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        cellTopLeftPrePaintNotification: function( /* cell */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         this function enhance the double click event just before it's broadcast to listeners
         * @param {Object} event - event to enhance
         */
        enhanceDoubleClickEvent: function( /* event */ ) {},

        /**
         * @function
         * @instance
         * @description
         swap src and tar columns
         * @param {integer} src - column index
         * @param {integer} tar - column index
         */
        swapColumns: function(source, target) {
            var columns = this.columns;
            var tmp = columns[source];
            columns[source] = columns[target];
            columns[target] = tmp;
            this.changed();
        },

        getColumnEdge: function(c, renderer) {
            return this.getDataModel().getColumnEdge(c, renderer);
        },

        setTotalsValue: function(x, y, value) {
            this.getGrid().setTotalsValueNotification(x, y, value);
        },

        /**
        * @function
        * @instance
        * @description
        return the object at y index
        * #### returns: Object
        * @param {integer} y - the row index of interest
        */
        getRow: function(y) {
            return this.getDataModel().getRow(y);
        },

        convertViewPointToDataPoint: function(viewPoint) {
            var newX = this.getColumn(viewPoint.x);
            var newPoint = this.getGrid().rectangles.point.create(newX, viewPoint.y);
            return newPoint;
        },

        setGroups: function(arrayOfColumnIndexes) {
            this.getDataModel().setGroups(arrayOfColumnIndexes);
            this.createColumns();
            this.changed();
        },

        setAggregates: function(mapOfKeysToFunctions) {
            var self = this;
            this.getDataModel().setAggregates(mapOfKeysToFunctions);
            this.createColumns();
            setTimeout(function() {
                self.changed();
            }, 100);
        },

        hasHierarchyColumn: function() {
            return false;
        },
        getRowContextFunction: function( /* selectedRows */ ) {
            return function() {
                return null;
            };
        },

        getSelectionMatrixFunction: function( /* selectedRows */ ) {
            return function() {
                return null;
            };
        },
        getFieldName: function(index) {
            return this.getFields()[index];
        },

        getColumnIndex: function(fieldName) {
            return this.getFields().indexOf(fieldName);
        },
        getComputedRow: function(y) {
            return this.getDataModel().getComputedRow(y);
        },
        autosizeAllColumns: function() {
            this.checkColumnAutosizing(true);
            this.changed();
        },
        checkColumnAutosizing: function(force) {
            force = force === true;
            this.allColumns[-2].checkColumnAutosizing(force);
            this.allColumns.forEach(function(column) {
                column.checkColumnAutosizing(force);
            });
        },
        autoSizeRowNumberColumn: function() {
            this.allColumns[-1].checkColumnAutosizing(true);
        },
        setGlobalFilter: function(string) {
            this.getDataModel().setGlobalFilter(string);
        },

        getSelectedRows: function() {
            return this.getGrid().getSelectionModel().getSelectedRows();
        },

        getSelectedColumns: function() {
            return this.getGrid().getSelectionModel().getSelectedColumns();
        },

        getSelections: function() {
            return this.getGrid().getSelectionModel().getSelections();
        },
    });
})();
