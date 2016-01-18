'use strict';

function DataModelDecorator(grid, component) {
    this.setComponent(component);
    this.setGrid(grid);
}

DataModelDecorator.prototype = {
    constructor: DataModelDecorator.prototype.constructor,

    component: null,
    grid: null,

    setGrid: function(newGrid) {
        this.grid = newGrid;
        this.getComponent().setGrid(newGrid);
    },

    getBehavior: function() {
        return this.grid.getBehavior();
    },

    changed: function() {
        this.getBehavior().changed();
    },

    getPrivateState: function() {
        return this.grid.getPrivateState();
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

    getData: function() {
        return this.getComponent().getData();
    },

    getFilteredData: function() {
        return this.getComponent().getFilteredData();
    },

    getValue: function(x, y) {
        return this.getComponent().getValue(x, y);
    },

    getUnfilteredValue: function(x, y) {
        return this.getComponent().getUnfilteredValue(x, y);
    },

    setValue: function(x, y, value) {
        this.getComponent().setValue(x, y, value);
    },

    getColumnCount: function() {
        return this.getComponent().getColumnCount();
    },

    applyFilters: function() {
        return this.getComponent().applyFilters();
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

    getTopTotals: function() {
        return this.getComponent().getTopTotals();
    },

    setTopTotals: function(totalRows) {
        this.getComponent().setTopTotals(totalRows);
    },

    getBottomTotals: function() {
        return this.getComponent().getBottomTotals();
    },

    setBottomTotals: function(totalRows) {
        this.getComponent().setBottomTotals(totalRows);
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

    reset: function() {
        this.getComponent().reset();
    },

    getCellEditorAt: function(x, y) {
        return this.getComponent().getCellEditorAt(x, y);
    },

    getUnfilteredRowCount: function() {
        return this.getComponent().getUnfilteredRowCount();
    }
};

module.exports = DataModelDecorator;
