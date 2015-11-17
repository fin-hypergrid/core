'use strict';

var _ = require('object-iterators');

/** @summary Extends an existing constructor into a new constructor.
 *
 * @returns {function} A new constructor, extended from the given context, possibly iwth some prototype additions.
 *
 * @desc Extends "objects" (constructors), with optional additional code, optional prototype additions, and optional prototype member aliases.
 *
 * > CAVEAT: Not to be confused with Underscore-style .extend() which is something else entirely. I've used the name "extend" here because other packages (like Backbone.js) use it this way. You are free to call it whatever you want when you "require" it, such as `var inherits = require('extend')`.
 *
 * Provide a constructor as the context and any prototype additions you require in the first argument.
 *
 * For example, if you wish to extend `BaseConstructor` to a new constructor with prototype overrides and/or additions, usage is:
 * ```javascript
 * extend.call(BaseConstructor, prototypeAdditions);`
 * ```
 * More elegantly, you can mix it in:
 * ```javascript
 * BaseConstructor.extend = extend
 * ```
 * and call it like this:
 * ```javascript
 * var ExtendedConstructor = BaseConstructor.extend(prototypeAdditions);
 * ```
 * To make `ExtendedConstructor` itself extensible, give it too an `extend` property as above, or simply include the special property `extendable: true` (see below) in the prototype additions, which attaches the `extend` property to the constructor for you.
 *
 * @param {object} prototype - Object with members to copy to new constructor's prototype. Some have special meanings:
 * * `initialize: function() {...}` - Additional constructor code for new object. Gets passed new object as context + same args as constructor itself. Called on instantiation after similar function in all ancestors called with same signature.
 * * `initializeOwn: function() {...}` - Additional constructor code for new object. Gets passed new object as context + same args as constructor itself. Called on instantiation after (all) the `initialize` function(s).
 * * `extendable: true` - Adds this function (`extend()`) as a property `.extend()` of the new extended object constructor, essentially making the object constructor itself easily "extensible" (i.e, able to create new constructors that inherit form this constructor). (Alternatively, even without doing this, you can always extend from any constructor by calling `extend.call(ConstructorToInheritFrom, {...})`.) (Not added to prototype.)
 * * `aliases: {...}` - Hash of aliases for prototype members in form `{ key: 'member', ... }` where `key` is the name of an alieas and `'member'` is the name of an existing member in the prototype. Each such key is added to the prototype as a reference to the named member. (The `aliases` object itself is *not* added to prototype.) Alternatively:
 * * `key: '#xxx'` - Adds an alias `key` with same value as existing member `xxx`. Simpler though subtler.
 */
function extend(prototypeAdditions) {
    function Constructor() {
        initializePrototypeChain.apply(this, arguments);

        if (prototypeAdditions.initializeOwn) {
            prototypeAdditions.initializeOwn.apply(this, arguments);
        }
    }

    var prototype = Constructor.prototype = Object.create(this.prototype);
    prototype.constructor = Constructor;

    prototype.super = this.prototype;

    if (prototypeAdditions) {
        _(prototypeAdditions).each(function(value, key) {
            switch (key) {
                case 'initializeOwn':
                    // already called above; not needed in prototype
                    break;
                case 'extendable':
                    Constructor.extend = extend;
                    break;
                case 'aliases':
                    _(prototypeAdditions.aliases).each(makeAlias);
                    break;
                default:
                    if (typeof value === 'string' && value[0] === '#') {
                        makeAlias(value, key.substr(1));
                    } else {
                        prototype[key] = value;
                    }
            }
        });
    }

    return Constructor;

    function makeAlias(value, key) {
        prototype[key] = prototypeAdditions[value];
    }
}

/** @summary Call all `initialize` methods found in prototype chain.
 * @desc This recursive routine is called by the constructor.
 * 1. Walks back the prototype chain to `Object`'s prototype
 * 2. Walks forward to new object, calling any `initialize` methods it finds along the way with the same context and arguments with which the constructor was called.
 * @private
 */
function initializePrototypeChain() {
    var term = this,
        args = arguments;
    recur(term);

    function recur(obj) {
        var proto = Object.getPrototypeOf(obj);
        if (proto.constructor !== Object) {
            recur(proto);
            if (proto.initialize) {
                proto.initialize.apply(term, args);
            }
        }
    }
}

module.exports = extend;