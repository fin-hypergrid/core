'use strict';

module.exports = {

    /**
     * @summary The behaviors's sorter data controller.
     * @desc This getter/setter is syntactic sugar for calls to `getController` and `setController`.
     * @memberOf Hypergrid#
     */
    get sorter() {
        return this.getController('sorter');
    },
    set sorter(sorter) {
        this.setController('sorter', sorter);
    },

    /**
     * @memberOf Hypergrid#
     * @param event
     */
    toggleSort: function(event) {
        if (!this.abortEditing()) { return; }

        var behavior = this.behavior,
            self = this,
            c = event.detail.column,
            keys =  event.detail.keys;

        behavior.toggleSort(c, keys);

        setTimeout(function() {
            self.synchronizeScrollingBoundaries();
            behavior.autosizeAllColumns();
            self.repaint();
        }, 10);
    }

};
