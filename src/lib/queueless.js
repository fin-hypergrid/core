'use strict';

function Queueless(element, context) {
    this.element = element;
    this.context = context;
    this.state = false;
}

Queueless.prototype.begin = function(callback) {
    var self = this;

    this.state = true;

    this.element.addEventListener('transitionend', function end(transEvent) {
        self.element.removeEventListener('transitionend', end);

        if (callback) {
            callback.call(this, transEvent, self);
        }

        self.state = false;
    });
};

module.exports = Queueless;
