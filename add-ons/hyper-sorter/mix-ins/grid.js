'use strict';

module.exports = {

    /**
     * @memberOf Hypergrid.prototype
     * @param {number} c - grid column index.
     * @param {string[]} keys
     */
    toggleSort: function(c, keys) {
        this.stopEditing();
        var behavior = this.behavior;
        var self = this;
        behavior.toggleSort(c, keys);

        setTimeout(function() {
            self.synchronizeScrollingBoundries();
            //self.behaviorChanged();
            if (self.isColumnAutosizing()) {
                behavior.autosizeAllColumns();
            }
            self.repaint();
        }, 10);
    }

};
