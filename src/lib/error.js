'use strict';

function HypergridError(message) {
    this.message = message;
}

// extend from `Error`
HypergridError.prototype = Object.create(Error.prototype);

// override error name displayed in console
HypergridError.prototype.name = 'HypergridError';

module.exports = HypergridError;
