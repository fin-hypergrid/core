'use strict';

module.exports = {
    Feature: require('./Feature'), // abstract base class
    CellClick: require('./CellClick'),
    CellEditing: require('./CellEditing'),
    CellSelection: require('./CellSelection'),
    ColumnMoving: require('./ColumnMoving'),
    ColumnResizing: require('./ColumnResizing'),
    ColumnSelection: require('./ColumnSelection'),
    ColumnSorting: require('./ColumnSorting'),
    Filters: require('./Filters'),
    KeyPaging: require('./KeyPaging'),
    OnHover: require('./OnHover'),
    // RowResizing: require('./RowResizing'),
    RowSelection: require('./RowSelection'),
    ThumbwheelScrolling: require('./ThumbwheelScrolling')
};
