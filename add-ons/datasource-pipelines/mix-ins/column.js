'use strict';

module.exports = {
    set header(headerText) {
        this.dataModel.schema[this.index].header = headerText;
        this.dataModel.prop(null, this.index, 'header', headerText);
        this.behavior.grid.repaint();
    },
    set type(type) {
        this._type = type;
        //TODO: This is calling reindex for every column during grid init. Maybe defer all reindex calls until after an grid 'ready' event
        this.dataModel.prop(null, this.index, 'type', type);
        this.behavior.reindex();
    },
    set calculator(calculator) {
        var schema = this.dataModel.schema;
        if (calculator !== schema[this.index].calculator) {
            if (calculator === undefined) {
                delete schema[this.index].calculator;
            } else {
                schema[this.index].calculator = calculator;
            }
            this.behavior.prop(null, this.index, 'calculator', calculator);
            this.behavior.applyAnalytics();
        }
    },
};

