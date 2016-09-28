'use strict';

function HypergridError(message) {
    this.message = message;
}
HypergridError.prototype = Object.create(Error.prototype);
HypergridError.prototype.name = 'HypergridError';

module.exports = HypergridError;
