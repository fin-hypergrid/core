'use strict';

var Base = require('./Base.js');

function DecoratorBase() {
    Base.call(this);
};

DecoratorBase.prototype = Object.create(Base.prototype);

DecoratorBase.prototype.component = null,

DecoratorBase.prototype.setComponent = function(newComponent) {
    this.component = newComponent;
};

DecoratorBase.prototype.getComponent = function() {
    return this.component;
};

DecoratorBase.prototype.getValue = function(x, y) {
    return this.getComponent().getValue(x, y);
};

DecoratorBase.prototype.setValue = function(x, y, value) {
    this.getComponent().setValue(x, y, value);
};

DecoratorBase.prototype.getColumnCount = function() {
    return this.getComponent().getColumnCount();
};

DecoratorBase.prototype.getRowCount = function() {
    return this.getComponent().getRowCount();
};

DecoratorBase.prototype.getCellRenderer = function(config, x, y, untranslatedX, untranslatedY) {
    return this.getComponent().getCellRenderer(config, x, y, untranslatedX, untranslatedY);
};

DecoratorBase.prototype.getRowHeight = function(y) {
    return this.getComponent().getRowHeight(y);
};

DecoratorBase.prototype.getColumnEdge = function(x, renderer) {
    return this.getComponent().getColumnEdge(x, renderer);
};

DecoratorBase.prototype.getColumnWidth = function(x) {
    return this.getComponent().getColumnWidth(x);
};

DecoratorBase.prototype.setColumnWidth = function(x, width) {
    this.getComponent().setColumnWidth(x, width);
};

DecoratorBase.prototype.setGrid = function(newGrid) {
    this.grid = newGrid;
    this.getComponent().setGrid(newGrid);
};

DecoratorBase.prototype.toggleSort = function(x, keys) {
    this.getComponent().toggleSort(x, keys);
};

DecoratorBase.prototype.getCellEditorAt = function(x, y) {
    return this.getComponent().getCellEditorAt(x, y);
};

DecoratorBase.prototype.getColumnProperties = function(columnIndex) {
    return this.getComponent().getColumnProperties(columnIndex);
};

DecoratorBase.prototype.setColumnProperties = function(columnIndex, properties) {
    this.getComponent().setColumnProperties(columnIndex, properties);
};

DecoratorBase.prototype.getHeaders = function() {
    return this.getComponent().getHeaders();
};

DecoratorBase.prototype.getFields = function() {
    return this.getComponent().getFields();
};

DecoratorBase.prototype.setFields = function(fields) {
    this.getComponent().setFields(fields);
};

DecoratorBase.prototype.getCellProperties = function(x, y) {
    return this.getComponent().getCellProperties(x, y);
};

DecoratorBase.prototype.setCellProperties = function(x, y, value) {
    this.getComponent().setCellProperties(x, y, value);
};

DecoratorBase.prototype.getRow = function(y) {
    return this.getComponent().getRow(y);
};

DecoratorBase.prototype.getRowContextFunction = function(y) {
    return this.getComponent().getRowContextFunction(y);
};

DecoratorBase.prototype.setTopTotals = function(nestedArray) {
    this.getComponent().setTopTotals(nestedArray);
};

DecoratorBase.prototype.getTopTotals = function() {
    return this.getComponent().getTopTotals();
};

DecoratorBase.prototype.setData = function(y) {
    return this.getComponent().setData(y);
};

DecoratorBase.prototype.hasHierarchyColumn = function() {
    return this.getComponent().hasHierarchyColumn();
};

DecoratorBase.prototype.setHeaders = function(headerLabels) {
    return this.getComponent().setHeaders(headerLabels);
};

DecoratorBase.prototype.cellClicked = function(cell, event) {
    return this.getComponent().cellClicked(cell, event);
};

module.exports = DecoratorBase;
