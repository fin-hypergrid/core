'use strict';

var DataModel = require('./DataModel');

/**
 * @constructor
 */
var DecoratorBase = DataModel.extend('DecoratorBase', {

    component: null,

    setComponent: function(newComponent) {
        this.component = newComponent;
    },

    getComponent: function() {
        return this.component;
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

    getUnfilteredRowCount: function() {
        return this.getComponent().getUnfilteredRowCount();
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

    setGrid: function(newGrid) {
        this.grid = newGrid;
        this.getComponent().setGrid(newGrid);
    },

    toggleSort: function(x, keys) {
        this.getComponent().toggleSort(x, keys);
    },

    getCellEditorAt: function(x, y) {
        return this.getComponent().getCellEditorAt(x, y);
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

    getRowContextFunction: function(y) {
        return this.getComponent().getRowContextFunction(y);
    },

    setTopTotals: function(totalRows) {
        this.getComponent().setTopTotals(totalRows);
    },

    getTopTotals: function() {
        return this.getComponent().getTopTotals();
    },

    setBottomTotals: function(totalRows) {
        this.getComponent().setBottomTotals(totalRows);
    },

    getBottomTotals: function() {
        return this.getComponent().getBottomTotals();
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

    reset: function() {
        this.getComponent().reset();
    },

});

module.exports = DecoratorBase;
