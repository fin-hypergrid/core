
function silent() {}

module.exports = {
    install: function(api) {
        if (!api) {
            return;
        }

        var isArray = Array.isArray(api),
            keys = isArray ? api : Object.keys(api).filter(function(key) {
                return typeof api[key] === 'function' &&
                    key !== 'constructor' &&
                    key !== 'initialize';
            });

        keys.forEach(function(key) {
            if (!this[key]) {
                this[key] = isArray ? silent : api[key];
            }
        }, this);
    },

    dispatchEvent: function(nameOrEvent) {
        if (this.handlers) {
            this.handlers.forEach(function(handler) {
                handler.call(this, nameOrEvent);
            }, this);
        }
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     */
    addListener: function(handler) {
        if (!this.handlers) {
            this.handlers = [handler];
        // @ts-ignore
        } else if (this.handlers.indexOf(handler) < 0) {
            // @ts-ignore
            this.handlers.push(handler);
        }
    },

    removeListener: function(handler) {
        if (this.handlers && this.handlers.length) {
            var index = this.handlers.indexOf(handler);
            if (index >= 0) {
                delete this.handlers[index];
            }
        }
    },

    removeAllListeners: function() {
        if (this.handlers) {
            this.handlers.length = 0;
        }
    }
};
