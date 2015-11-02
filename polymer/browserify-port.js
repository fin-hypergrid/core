(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
;(function () { // closure for web browsers

if (typeof module === 'object' && module.exports) {
  module.exports = LRUCache
} else {
  // just set the global for non-node platforms.
  this.LRUCache = LRUCache
}

function hOP (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function naiveLength () { return 1 }

function LRUCache (options) {
  if (!(this instanceof LRUCache))
    return new LRUCache(options)

  if (typeof options === 'number')
    options = { max: options }

  if (!options)
    options = {}

  this._max = options.max
  // Kind of weird to have a default max of Infinity, but oh well.
  if (!this._max || !(typeof this._max === "number") || this._max <= 0 )
    this._max = Infinity

  this._lengthCalculator = options.length || naiveLength
  if (typeof this._lengthCalculator !== "function")
    this._lengthCalculator = naiveLength

  this._allowStale = options.stale || false
  this._maxAge = options.maxAge || null
  this._dispose = options.dispose
  this.reset()
}

// resize the cache when the max changes.
Object.defineProperty(LRUCache.prototype, "max",
  { set : function (mL) {
      if (!mL || !(typeof mL === "number") || mL <= 0 ) mL = Infinity
      this._max = mL
      if (this._length > this._max) trim(this)
    }
  , get : function () { return this._max }
  , enumerable : true
  })

// resize the cache when the lengthCalculator changes.
Object.defineProperty(LRUCache.prototype, "lengthCalculator",
  { set : function (lC) {
      if (typeof lC !== "function") {
        this._lengthCalculator = naiveLength
        this._length = this._itemCount
        for (var key in this._cache) {
          this._cache[key].length = 1
        }
      } else {
        this._lengthCalculator = lC
        this._length = 0
        for (var key in this._cache) {
          this._cache[key].length = this._lengthCalculator(this._cache[key].value)
          this._length += this._cache[key].length
        }
      }

      if (this._length > this._max) trim(this)
    }
  , get : function () { return this._lengthCalculator }
  , enumerable : true
  })

Object.defineProperty(LRUCache.prototype, "length",
  { get : function () { return this._length }
  , enumerable : true
  })


Object.defineProperty(LRUCache.prototype, "itemCount",
  { get : function () { return this._itemCount }
  , enumerable : true
  })

LRUCache.prototype.forEach = function (fn, thisp) {
  thisp = thisp || this
  var i = 0
  var itemCount = this._itemCount

  for (var k = this._mru - 1; k >= 0 && i < itemCount; k--) if (this._lruList[k]) {
    i++
    var hit = this._lruList[k]
    if (isStale(this, hit)) {
      del(this, hit)
      if (!this._allowStale) hit = undefined
    }
    if (hit) {
      fn.call(thisp, hit.value, hit.key, this)
    }
  }
}

LRUCache.prototype.keys = function () {
  var keys = new Array(this._itemCount)
  var i = 0
  for (var k = this._mru - 1; k >= 0 && i < this._itemCount; k--) if (this._lruList[k]) {
    var hit = this._lruList[k]
    keys[i++] = hit.key
  }
  return keys
}

LRUCache.prototype.values = function () {
  var values = new Array(this._itemCount)
  var i = 0
  for (var k = this._mru - 1; k >= 0 && i < this._itemCount; k--) if (this._lruList[k]) {
    var hit = this._lruList[k]
    values[i++] = hit.value
  }
  return values
}

LRUCache.prototype.reset = function () {
  if (this._dispose && this._cache) {
    for (var k in this._cache) {
      this._dispose(k, this._cache[k].value)
    }
  }

  this._cache = Object.create(null) // hash of items by key
  this._lruList = Object.create(null) // list of items in order of use recency
  this._mru = 0 // most recently used
  this._lru = 0 // least recently used
  this._length = 0 // number of items in the list
  this._itemCount = 0
}

LRUCache.prototype.dump = function () {
  var arr = []
  var i = 0

  for (var k = this._mru - 1; k >= 0 && i < this._itemCount; k--) if (this._lruList[k]) {
    var hit = this._lruList[k]
    if (!isStale(this, hit)) {
      //Do not store staled hits
      ++i
      arr.push({
        k: hit.key,
        v: hit.value,
        e: hit.now + (hit.maxAge || 0)
      });
    }
  }
  //arr has the most read first
  return arr
}

LRUCache.prototype.dumpLru = function () {
  return this._lruList
}

LRUCache.prototype.set = function (key, value, maxAge) {
  maxAge = maxAge || this._maxAge
  var now = maxAge ? Date.now() : 0
  var len = this._lengthCalculator(value)

  if (hOP(this._cache, key)) {
    if (len > this._max) {
      del(this, this._cache[key])
      return false
    }
    // dispose of the old one before overwriting
    if (this._dispose)
      this._dispose(key, this._cache[key].value)

    this._cache[key].now = now
    this._cache[key].maxAge = maxAge
    this._cache[key].value = value
    this._length += (len - this._cache[key].length)
    this._cache[key].length = len
    this.get(key)

    if (this._length > this._max)
      trim(this)

    return true
  }

  var hit = new Entry(key, value, this._mru++, len, now, maxAge)

  // oversized objects fall out of cache automatically.
  if (hit.length > this._max) {
    if (this._dispose) this._dispose(key, value)
    return false
  }

  this._length += hit.length
  this._lruList[hit.lu] = this._cache[key] = hit
  this._itemCount ++

  if (this._length > this._max)
    trim(this)

  return true
}

LRUCache.prototype.has = function (key) {
  if (!hOP(this._cache, key)) return false
  var hit = this._cache[key]
  if (isStale(this, hit)) {
    return false
  }
  return true
}

LRUCache.prototype.get = function (key) {
  return get(this, key, true)
}

LRUCache.prototype.peek = function (key) {
  return get(this, key, false)
}

LRUCache.prototype.pop = function () {
  var hit = this._lruList[this._lru]
  del(this, hit)
  return hit || null
}

LRUCache.prototype.del = function (key) {
  del(this, this._cache[key])
}

LRUCache.prototype.load = function (arr) {
  //reset the cache
  this.reset();

  var now = Date.now()
  //A previous serialized cache has the most recent items first
  for (var l = arr.length - 1; l >= 0; l-- ) {
    var hit = arr[l]
    var expiresAt = hit.e || 0
    if (expiresAt === 0) {
      //the item was created without expiration in a non aged cache
      this.set(hit.k, hit.v)
    } else {
      var maxAge = expiresAt - now
      //dont add already expired items
      if (maxAge > 0) this.set(hit.k, hit.v, maxAge)
    }
  }
}

function get (self, key, doUse) {
  var hit = self._cache[key]
  if (hit) {
    if (isStale(self, hit)) {
      del(self, hit)
      if (!self._allowStale) hit = undefined
    } else {
      if (doUse) use(self, hit)
    }
    if (hit) hit = hit.value
  }
  return hit
}

function isStale(self, hit) {
  if (!hit || (!hit.maxAge && !self._maxAge)) return false
  var stale = false;
  var diff = Date.now() - hit.now
  if (hit.maxAge) {
    stale = diff > hit.maxAge
  } else {
    stale = self._maxAge && (diff > self._maxAge)
  }
  return stale;
}

function use (self, hit) {
  shiftLU(self, hit)
  hit.lu = self._mru ++
  self._lruList[hit.lu] = hit
}

function trim (self) {
  while (self._lru < self._mru && self._length > self._max)
    del(self, self._lruList[self._lru])
}

function shiftLU (self, hit) {
  delete self._lruList[ hit.lu ]
  while (self._lru < self._mru && !self._lruList[self._lru]) self._lru ++
}

function del (self, hit) {
  if (hit) {
    if (self._dispose) self._dispose(hit.key, hit.value)
    self._length -= hit.length
    self._itemCount --
    delete self._cache[ hit.key ]
    shiftLU(self, hit)
  }
}

// classy, since V8 prefers predictable objects.
function Entry (key, value, lu, length, now, maxAge) {
  this.key = key
  this.value = value
  this.lu = lu
  this.length = length
  this.now = now
  if (maxAge) this.maxAge = maxAge
}

})()

},{}],2:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false Mustache: true*/

(function defineMustache (global, factory) {
  if (typeof exports === 'object' && exports && typeof exports.nodeName !== 'string') {
    factory(exports); // CommonJS
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], factory); // AMD
  } else {
    global.Mustache = {};
    factory(Mustache); // script, wsh, asp
  }
}(this, function mustacheFactory (mustache) {

  var objectToString = Object.prototype.toString;
  var isArray = Array.isArray || function isArrayPolyfill (object) {
    return objectToString.call(object) === '[object Array]';
  };

  function isFunction (object) {
    return typeof object === 'function';
  }

  /**
   * More correct typeof string handling array
   * which normally returns typeof 'object'
   */
  function typeStr (obj) {
    return isArray(obj) ? 'array' : typeof obj;
  }

  function escapeRegExp (string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
  }

  /**
   * Null safe way of checking whether or not an object,
   * including its prototype, has a given property
   */
  function hasProperty (obj, propName) {
    return obj != null && typeof obj === 'object' && (propName in obj);
  }

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var regExpTest = RegExp.prototype.test;
  function testRegExp (re, string) {
    return regExpTest.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace (string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };

  function escapeHtml (string) {
    return String(string).replace(/[&<>"'\/]/g, function fromEntityMap (s) {
      return entityMap[s];
    });
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate (template, tags) {
    if (!template)
      return [];

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace () {
      if (hasTag && !nonSpace) {
        while (spaces.length)
          delete tokens[spaces.pop()];
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var openingTagRe, closingTagRe, closingCurlyRe;
    function compileTags (tagsToCompile) {
      if (typeof tagsToCompile === 'string')
        tagsToCompile = tagsToCompile.split(spaceRe, 2);

      if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
        throw new Error('Invalid tags: ' + tagsToCompile);

      openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*');
      closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1]));
      closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1]));
    }

    compileTags(tags || mustache.tags);

    var scanner = new Scanner(template);

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(openingTagRe);

      if (value) {
        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push([ 'text', chr, start, start + 1 ]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n')
            stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(openingTagRe))
        break;

      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(closingTagRe);
      } else if (type === '{') {
        value = scanner.scanUntil(closingCurlyRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(closingTagRe);
        type = '&';
      } else {
        value = scanner.scanUntil(closingTagRe);
      }

      // Match the closing tag.
      if (!scanner.scan(closingTagRe))
        throw new Error('Unclosed tag at ' + scanner.pos);

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection)
          throw new Error('Unopened section "' + value + '" at ' + start);

        if (openSection[1] !== value)
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        compileTags(value);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();

    if (openSection)
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens (tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens (tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      switch (token[0]) {
      case '#':
      case '^':
        collector.push(token);
        sections.push(token);
        collector = token[4] = [];
        break;
      case '/':
        section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
        break;
      default:
        collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner (string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function eos () {
    return this.tail === '';
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function scan (re) {
    var match = this.tail.match(re);

    if (!match || match.index !== 0)
      return '';

    var string = match[0];

    this.tail = this.tail.substring(string.length);
    this.pos += string.length;

    return string;
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function scanUntil (re) {
    var index = this.tail.search(re), match;

    switch (index) {
    case -1:
      match = this.tail;
      this.tail = '';
      break;
    case 0:
      match = '';
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context (view, parentContext) {
    this.view = view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function push (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function lookup (name) {
    var cache = this.cache;

    var value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      var context = this, names, index, lookupHit = false;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;
          names = name.split('.');
          index = 0;

          /**
           * Using the dot notion path in `name`, we descend through the
           * nested objects.
           *
           * To be certain that the lookup has been successful, we have to
           * check if the last object in the path actually has the property
           * we are looking for. We store the result in `lookupHit`.
           *
           * This is specially necessary for when the value has been set to
           * `undefined` and we want to avoid looking up parent contexts.
           **/
          while (value != null && index < names.length) {
            if (index === names.length - 1)
              lookupHit = hasProperty(value, names[index]);

            value = value[names[index++]];
          }
        } else {
          value = context.view[name];
          lookupHit = hasProperty(context.view, name);
        }

        if (lookupHit)
          break;

        context = context.parent;
      }

      cache[name] = value;
    }

    if (isFunction(value))
      value = value.call(this.view);

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer () {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function clearCache () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function parse (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null)
      tokens = cache[template] = parseTemplate(template, tags);

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function render (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function renderTokens (tokens, context, partials, originalTemplate) {
    var buffer = '';

    var token, symbol, value;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined;
      token = tokens[i];
      symbol = token[0];

      if (symbol === '#') value = this.renderSection(token, context, partials, originalTemplate);
      else if (symbol === '^') value = this.renderInverted(token, context, partials, originalTemplate);
      else if (symbol === '>') value = this.renderPartial(token, context, partials, originalTemplate);
      else if (symbol === '&') value = this.unescapedValue(token, context);
      else if (symbol === 'name') value = this.escapedValue(token, context);
      else if (symbol === 'text') value = this.rawValue(token);

      if (value !== undefined)
        buffer += value;
    }

    return buffer;
  };

  Writer.prototype.renderSection = function renderSection (token, context, partials, originalTemplate) {
    var self = this;
    var buffer = '';
    var value = context.lookup(token[1]);

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    function subRender (template) {
      return self.render(template, context, partials);
    }

    if (!value) return;

    if (isArray(value)) {
      for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
      }
    } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== 'string')
        throw new Error('Cannot use higher-order sections without the original template');

      // Extract the portion of the original template that the section contains.
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

      if (value != null)
        buffer += value;
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate);
    }
    return buffer;
  };

  Writer.prototype.renderInverted = function renderInverted (token, context, partials, originalTemplate) {
    var value = context.lookup(token[1]);

    // Use JavaScript's definition of falsy. Include empty arrays.
    // See https://github.com/janl/mustache.js/issues/186
    if (!value || (isArray(value) && value.length === 0))
      return this.renderTokens(token[4], context, partials, originalTemplate);
  };

  Writer.prototype.renderPartial = function renderPartial (token, context, partials) {
    if (!partials) return;

    var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null)
      return this.renderTokens(this.parse(value), context, partials, value);
  };

  Writer.prototype.unescapedValue = function unescapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return value;
  };

  Writer.prototype.escapedValue = function escapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return mustache.escape(value);
  };

  Writer.prototype.rawValue = function rawValue (token) {
    return token[1];
  };

  mustache.name = 'mustache.js';
  mustache.version = '2.2.0';
  mustache.tags = [ '{{', '}}' ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function clearCache () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function parse (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function render (template, view, partials) {
    if (typeof template !== 'string') {
      throw new TypeError('Invalid template! Template should be a "string" ' +
                          'but "' + typeStr(template) + '" was given as the first ' +
                          'argument for mustache#render(template, view, partials)');
    }

    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.,
  /*eslint-disable */ // eslint wants camel cased function name
  mustache.to_html = function to_html (template, view, partials, send) {
    /*eslint-enable*/

    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

}));

},{}],3:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

function CellProvider() {
    this.cellCache = {};
    this.initializeCells();
};

CellProvider.prototype = {};

var noop = function() {};

var valueOrFunctionExecute = function(config, valueOrFunction) {
    var isFunction = (((typeof valueOrFunction)[0]) === 'f');
    var result = isFunction ? valueOrFunction(config) : valueOrFunction;
    if (!result && result !== 0) {
        return '';
    }
    return result;
};

var underline = function(config, gc, text, x, y, thickness) {
    var width = config.getTextWidth(gc, text);

    switch (gc.textAlign) {
        case 'center':
            x -= (width / 2);
            break;
        case 'right':
            x -= width;
            break;
    }

    //gc.beginPath();
    gc.lineWidth = thickness;
    gc.moveTo(x + 0.5, y + 0.5);
    gc.lineTo(x + width + 0.5, y + 0.5);
};

var roundRect = function(gc, x, y, width, height, radius, fill, stroke) {
    if (!stroke) {
        stroke = true;
    }
    if (!radius) {
        radius = 5;
    }
    gc.beginPath();
    gc.moveTo(x + radius, y);
    gc.lineTo(x + width - radius, y);
    gc.quadraticCurveTo(x + width, y, x + width, y + radius);
    gc.lineTo(x + width, y + height - radius);
    gc.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    gc.lineTo(x + radius, y + height);
    gc.quadraticCurveTo(x, y + height, x, y + height - radius);
    gc.lineTo(x, y + radius);
    gc.quadraticCurveTo(x, y, x + radius, y);
    gc.closePath();
    if (stroke) {
        gc.stroke();
    }
    if (fill) {
        gc.fill();
    }
    gc.closePath();
};

/**
 * @function
 * @description replace this function in on your instance of cellProvider
 * @returns cell
 * @param {object} config - an object with everything you might need for renderering a cell
 * @instance
 */
CellProvider.prototype.getCell = function(config) {
    var cell = this.cellCache.simpleCellRenderer;
    cell.config = config;
    return cell;
};

/**
 * @function
 * @description replace this function in on your instance of cellProvider
 * @returns cell
 * @param {object} config - an object with everything you might need for renderering a cell
 * @instance
 */
CellProvider.prototype.getColumnHeaderCell = function(config) {
    var cell = this.cellCache.simpleCellRenderer;
    cell.config = config;
    return cell;
};

/**
 * @function
 * @description replace this function in on your instance of cellProvider
 * @returns cell
 * @param {object} config - an object with everything you might need for renderering a cell
 * @instance
 */
CellProvider.prototype.getRowHeaderCell = function(config) {
    var cell = this.cellCache.simpleCellRenderer;
    cell.config = config;
    return cell;
};

CellProvider.prototype.paintButton = function(gc, config) {
    var val = config.value;
    var c = config.x;
    var r = config.y;
    var bounds = config.bounds;
    var x = bounds.x + 2;
    var y = bounds.y + 2;
    var width = bounds.width - 3;
    var height = bounds.height - 3;
    var radius = height / 2;
    var arcGradient = gc.createLinearGradient(x, y, x, y + height);
    if (config.mouseDown) {
        arcGradient.addColorStop(0, '#B5CBED');
        arcGradient.addColorStop(1, '#4d74ea');
    } else {
        arcGradient.addColorStop(0, '#ffffff');
        arcGradient.addColorStop(1, '#aaaaaa');
    }
    gc.fillStyle = arcGradient;
    gc.strokeStyle = '#000000';
    roundRect(gc, x, y, width, height, radius, arcGradient, true);

    var ox = (width - config.getTextWidth(gc, val)) / 2;
    var oy = (height - config.getTextHeight(gc.font).descent) / 2;

    if (gc.textBaseline !== 'middle') {
        gc.textBaseline = 'middle';
    }

    gc.fillStyle = '#000000';

    config.backgroundColor = 'rgba(0,0,0,0)';
    gc.fillText(val, x + ox, y + oy);

    //identify that we are a button
    config.buttonCells[c + ',' + r] = true;
};

/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {integer} x - the x screen coordinate of my origin
 * @param {integer} y - the y screen coordinate of my origin
 * @param {integer} width - the width I'm allowed to draw within
 * @param {integer} height - the height I'm allowed to draw within
 * @param {boolean} isLink - is this a hyperlink cell
 * @instance
 * @description
This is the default cell rendering function for rendering a vanilla cell. Great care was taken in crafting this function as it needs to perform extremely fast. Reads on the gc object are expensive but not quite as expensive as writes to it. We do our best to avoid writes, then avoid reads. Clipping bounds are not set here as this is also an expensive operation. Instead, we truncate overflowing text and content by filling a rectangle with background color column by column instead of cell by cell.  This column by column fill happens higher up on the stack in a calling function from fin-hypergrid-renderer.  Take note we do not do cell by cell border renderering as that is expensive.  Instead we render many fewer gridlines after all cells are rendered.
*/
CellProvider.prototype.defaultCellPaint = function(gc, config) {

    var isLink = isLink || false;
    var colHEdgeOffset = config.cellPadding,
        halignOffset = 0,
        valignOffset = config.voffset,
        halign = config.halign,
        isColumnHovered = config.isColumnHovered,
        isRowHovered = config.isRowHovered,
        val = config.value,
        x = config.bounds.x,
        y = config.bounds.y,
        width = config.bounds.width,
        height = config.bounds.height;

    var leftIcon, rightIcon, centerIcon, ixoffset, iyoffset;

    //setting gc properties are expensive, lets not do it unnecessarily

    if (val && val.constructor === Array) {
        leftIcon = val[0];
        rightIcon = val[2];
        val = val[1];
        if (typeof val === 'object') { // must be an image
            centerIcon = val;
            val = null;
        }
        if (leftIcon && leftIcon.nodeName !== 'IMG') {
            leftIcon = null;
        }
        if (rightIcon && rightIcon.nodeName !== 'IMG') {
            rightIcon = null;
        }
        if (centerIcon && centerIcon.nodeName !== 'IMG') {
            centerIcon = null;
        }
    }

    val = valueOrFunctionExecute(config, val);

    if (gc.font !== config.font) {
        gc.font = config.font;
    }
    if (gc.textAlign !== 'left') {
        gc.textAlign = 'left';
    }
    if (gc.textBaseline !== 'middle') {
        gc.textBaseline = 'middle';
    }

    var fontMetrics = config.getTextHeight(config.font);
    var textWidth = config.getTextWidth(gc, val);


    //we must set this in order to compute the minimum width
    //for column autosizing purposes
    config.minWidth = textWidth + (2 * colHEdgeOffset);

    if (halign === 'right') {
        //textWidth = config.getTextWidth(gc, config.value);
        halignOffset = width - colHEdgeOffset - textWidth;
    } else if (halign === 'center') {
        //textWidth = config.getTextWidth(gc, config.value);
        halignOffset = (width - textWidth) / 2;
    } else if (halign === 'left') {
        halignOffset = colHEdgeOffset;
    }

    halignOffset = Math.max(0, halignOffset);
    valignOffset = valignOffset + Math.ceil(height / 2);

    //fill background only if our bgColor is populated or we are a selected cell
    if (config.backgroundColor || config.isSelected) {
        gc.fillStyle = valueOrFunctionExecute(config, config.isSelected ? config.backgroundSelectionColor : config.backgroundColor);
        gc.fillRect(x, y, width, height);
    }

    //draw text
    var theColor = valueOrFunctionExecute(config, config.isSelected ? config.foregroundSelectionColor : config.color);
    if (gc.fillStyle !== theColor) {
        gc.fillStyle = theColor;
        gc.strokeStyle = theColor;
    }
    if (val !== null) {
        gc.fillText(val, x + halignOffset, y + valignOffset);

    }
    if (isColumnHovered && isRowHovered) {
        gc.beginPath();
        if (isLink) {
            underline(config, gc, val, x + halignOffset, y + valignOffset + Math.floor(fontMetrics.height / 2), 1);
            gc.stroke();
        }
        gc.closePath();
    }
    if (config.isInCurrentSelectionRectangle) {
        gc.fillStyle = 'rgba(0, 0, 0, 0.2)';
        gc.fillRect(x, y, width, height);
    }
    var iconWidth = 0;
    if (leftIcon) {
        iyoffset = Math.round((height - leftIcon.height) / 2);
        ixoffset = Math.round((halignOffset - leftIcon.width) / 2);
        gc.drawImage(leftIcon, x + ixoffset, y + iyoffset);
        iconWidth = Math.max(leftIcon.width + 2);
    }
    if (rightIcon) {
        iyoffset = Math.round((height - rightIcon.height) / 2);
        ixoffset = 0; //Math.round((halignOffset - rightIcon.width) / 2);
        gc.drawImage(rightIcon, x + width - ixoffset - rightIcon.width, y + iyoffset);
        iconWidth = Math.max(rightIcon.width + 2);
    }
    if (centerIcon) {
        iyoffset = Math.round((height - centerIcon.height) / 2);
        ixoffset = Math.round((width - centerIcon.width) / 2);
        gc.drawImage(centerIcon, x + width - ixoffset - centerIcon.width, y + iyoffset);
        iconWidth = Math.max(centerIcon.width + 2);
    }
    if (config.cellBorderThickness) {
        gc.beginPath();
        gc.rect(x, y, width, height);
        gc.lineWidth = config.cellBorderThickness;
        gc.strokeStyle = config.cellBorderStyle;

        // animate the dashed line a bit here for fun

        gc.stroke();
        gc.closePath();
    }
    config.minWidth = config.minWidth + 2 * (iconWidth);
};

/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {integer} x - the x screen coordinate of my origin
 * @param {integer} y - the y screen coordinate of my origin
 * @param {integer} width - the width I'm allowed to draw within
 * @param {integer} height - the height I'm allowed to draw within
 * @param {boolean} isLink - is this a hyperlink cell
 * @instance
 * @description emersons paint function for a slider button. currently the user cannot interact with it
 */
CellProvider.prototype.paintSlider = function( /* gc, x, y, width, height */ ) {
    // gc.strokeStyle = 'white';
    // var val = this.config.value;
    // var radius = height / 2;
    // var offset = width * val;
    // var bgColor = this.config.isSelected ? this.config.bgSelColor : '#333333';
    // var btnGradient = gc.createLinearGradient(x, y, x, y + height);
    // btnGradient.addColorStop(0, bgColor);
    // btnGradient.addColorStop(1, '#666666');
    // var arcGradient = gc.createLinearGradient(x, y, x, y + height);
    // arcGradient.addColorStop(0, '#aaaaaa');
    // arcGradient.addColorStop(1, '#777777');
    // gc.fillStyle = btnGradient;
    // roundRect(gc, x, y, width, height, radius, btnGradient);
    // if (val < 1.0) {
    //     gc.fillStyle = arcGradient;
    // } else {
    //     gc.fillStyle = '#eeeeee';
    // }
    // gc.beginPath();
    // gc.arc(x + Math.max(offset - radius, radius), y + radius, radius, 0, 2 * Math.PI);
    // gc.fill();
    // gc.closePath();
    // this.config.minWidth = 100;
};

/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {integer} x - the x screen coordinate of my origin
 * @param {integer} y - the y screen coordinate of my origin
 * @param {integer} width - the width I'm allowed to draw within
 * @param {integer} height - the height I'm allowed to draw within
 * @param {boolean} isLink - is this a hyperlink cell
 * @instance
 * @description
 simple implementation of a sparkline.  see [Edward Tufte sparkline](http://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR)
 */
CellProvider.prototype.paintSparkbar = function(gc, x, y, width, height) {
    gc.beginPath();
    var val = this.config.value;
    if (!val || !val.length) {
        return;
    }
    var count = val.length;
    var eWidth = width / count;
    var fgColor = this.config.isSelected ? this.config.fgSelColor : this.config.fgColor;
    if (this.config.bgColor || this.config.isSelected) {
        gc.fillStyle = this.config.isSelected ? this.config.bgSelColor : this.config.bgColor;
        gc.fillRect(x, y, width, height);
    }
    gc.fillStyle = fgColor;
    for (var i = 0; i < val.length; i++) {
        var barheight = val[i] / 110 * height;
        gc.fillRect(x + 5, y + height - barheight, eWidth * 0.6666, barheight);
        x = x + eWidth;
    }
    gc.closePath();
    this.config.minWidth = count * 10;

};


/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {integer} x - the x screen coordinate of my origin
 * @param {integer} y - the y screen coordinate of my origin
 * @param {integer} width - the width I'm allowed to draw within
 * @param {integer} height - the height I'm allowed to draw within
 * @param {boolean} isLink - is this a hyperlink cell
 * @instance
 * @description
simple implementation of a sparkline, because it's a barchart we've changed the name ;).  see [Edward Tufte sparkline](http://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR)
*/
CellProvider.prototype.paintSparkline = function(gc, x, y, width, height) {
    gc.beginPath();
    var val = this.config.value;
    if (!val || !val.length) {
        return;
    }
    var count = val.length;
    var eWidth = width / count;

    var fgColor = this.config.isSelected ? this.config.fgSelColor : this.config.fgColor;
    if (this.config.bgColor || this.config.isSelected) {
        gc.fillStyle = this.config.isSelected ? this.config.bgSelColor : this.config.bgColor;
        gc.fillRect(x, y, width, height);
    }
    gc.strokeStyle = fgColor;
    gc.fillStyle = fgColor;
    gc.beginPath();
    var prev;
    for (var i = 0; i < val.length; i++) {
        var barheight = val[i] / 110 * height;
        if (!prev) {
            prev = barheight;
        }
        gc.lineTo(x + 5, y + height - barheight);
        gc.arc(x + 5, y + height - barheight, 1, 0, 2 * Math.PI, false);
        x = x + eWidth;
    }
    this.config.minWidth = count * 10;
    gc.stroke();
    gc.closePath();
};

/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {integer} x - the x screen coordinate of my origin
 * @param {integer} y - the y screen coordinate of my origin
 * @param {integer} width - the width I'm allowed to draw within
 * @param {integer} height - the height I'm allowed to draw within
 * @param {boolean} isLink - is this a hyperlink cell
 * @instance
 * @description
 this is a simple implementation of a tree cell renderer for use mainly with the qtree
 */
CellProvider.prototype.treeCellRenderer = function(gc, x, y, width, height) {
    var val = this.config.value.data;
    var indent = this.config.value.indent;
    var icon = this.config.value.icon;

    //fill background only if our bgColor is populated or we are a selected cell
    if (this.config.bgColor || this.config.isSelected) {
        gc.fillStyle = this.config.isSelected ? this.config.bgSelColor : this.config.bgColor;
        gc.fillRect(x, y, width, height);
    }

    if (!val || !val.length) {
        return;
    }
    var valignOffset = Math.ceil(height / 2);

    gc.fillStyle = this.config.isSelected ? this.config.fgSelColor : this.config.fgColor;
    gc.fillText(icon + val, x + indent, y + valignOffset);

    var textWidth = this.config.getTextWidth(gc, icon + val);
    var minWidth = x + indent + textWidth + 10;
    this.config.minWidth = minWidth;
};

/**
 * @function
 * @param {CanvasGraphicsContext} gc - the "pen" in the mvc model, we issue drawing commands to
 * @param {integer} x - the x screen coordinate of my origin
 * @param {integer} y - the y screen coordinate of my origin
 * @param {integer} width - the width I'm allowed to draw within
 * @param {integer} height - the height I'm allowed to draw within
 * @instance
 * @param {boolean} isLink - is this a hyperlink cell
 * @description
 this is an empty implementation of a cell renderer, see [the null object pattern](http://c2.com/cgi/wiki?NullObject)
 */
CellProvider.prototype.emptyCellRenderer = function(gc, x, y, width, height) {
    noop(gc, x, y, width, height);
};

/**
 * @function
 * @instance
 * @private
 */
CellProvider.prototype.initializeCells = function() {
    var self = this;
    this.cellCache.simpleCellRenderer = {
        paint: this.defaultCellPaint
    };
    this.cellCache.sliderCellRenderer = {
        paint: this.paintSlider
    };
    this.cellCache.sparkbarCellRenderer = {
        paint: this.paintSparkbar
    };
    this.cellCache.sparklineCellRenderer = {
        paint: this.paintSparkline
    };
    this.cellCache.treeCellRenderer = {
        paint: this.treeCellRenderer
    };
    this.cellCache.emptyCellRenderer = {
        paint: this.emptyCellRenderer
    };
    this.cellCache.buttonRenderer = {
        paint: this.paintButton,
        defaultCellPaint: this.defaultCellPaint
    };
    this.cellCache.linkCellRenderer = {
        paint: function(gc, x, y, width, height) {
            self.config = this.config;
            self.defaultCellPaint(gc, x, y, width, height, true);
        },
    };
};

module.exports = CellProvider

},{}],4:[function(require,module,exports){
'use strict';
/**
 *
 * @module .\renderer
 * @description
fin-hypergrid-renderer is the canvas enabled top level sub component that handles the renderering of the Grid.

It relies on two other external subprojects

1. fin-canvas: a wrapper to provide a simpler interface to the HTML5 canvas component
2. fin-rectangles: a small library providing Point and Rectangle objects

The fin-hypergrid-renderer is in a unique position to provide critical functionality to the fin-hypergrid in a hightly performant manner.
Because it MUST iterate over all the visible cells it can store various bits of information that can be encapsulated as a service for consumption by the fin-hypergrid component.

Instances of this object have basically four main functions.

1. render fixed row headers
2. render fixed col headers
3. render main data cells
4. render grid lines

**/

function Renderer() {
    this.columnEdges = [];
    this.columnEdgesIndexMap = {};
    this.renderedColumnMinWidths = [];
    this.renderedHeight = 0;
    this.rowEdges = [];
    this.rowEdgesIndexMap = {};
    this.visibleColumns = [];
    this.visibleRows = [];
    this.insertionBounds = [];
};

Renderer.prototype = {};

var noop = function() {};

var merge = function(target, source) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
};


//the shared single item "pooled" cell object for drawing each cell
Renderer.prototype.cell = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
};

Renderer.prototype.scrollHeight = 0,
Renderer.prototype.viewHeight = 0,

//this function computes the grid coordinates used for extremely fast iteration over
//painting the grid cells. this function is very fast, for thousand rows X 100 columns
//on a modest machine taking usually 0ms and no more that 3 ms.
Renderer.prototype.computeCellsBounds = function() {

    //var startTime = Date.now();

    var grid = this.getGrid();
    var scrollTop = this.getScrollTop();
    var scrollLeft = this.getScrollLeft();

    var numColumns = this.getColumnCount();
    var numFixedColumns = this.getFixedColumnCount();

    var numRows = this.getRowCount();
    var numFixedRows = this.getFixedRowCount();

    var bounds = grid.getBoundingClientRect();
    var viewWidth = bounds.width;

    //we must be in bootstrap
    if (viewWidth === 0) {
        //viewWidth = grid.sbHScroller.getClientRects()[0].width;
        viewWidth = grid.canvas.width;
    }
    var viewHeight = bounds.height;

    var x, y, c, r, vx, vy, width, height;

    this.getColumnEdges().length = 0;
    this.rowEdges.length = 0;

    this.columnEdges[0] = 0;
    this.rowEdges[0] = 0;
    this.scrollHeight = 0;

    this.visibleColumns.length = 0;
    this.visibleRows.length = 0;
    this.columnEdgesIndexMap = {};
    this.rowEdgesIndexMap = {};

    this.insertionBounds = [];
    var insertionBoundsCursor = 0;
    var previousInsertionBoundsCursorValue = 0;

    x = 0;
    var start = 0;
    var firstVX, lastVX;
    var firstVY, lastVY;
    if (grid.isShowRowNumbers()) {
        start--;
        this.columnEdges[-1] = -1;
    }
    for (c = start; c < numColumns; c++) {
        vx = c;
        if (c >= numFixedColumns) {
            vx = vx + scrollLeft;
            if (firstVX === undefined) {
                firstVX = vx;
            }
            lastVX = vx;
        }
        if (x > viewWidth || numColumns <= vx) {
            break;
        }
        width = this.getColumnWidth(vx);
        x = x + width;
        this.columnEdges[c + 1] = Math.round(x);
        this.visibleColumns[c] = vx;
        this.columnEdgesIndexMap[vx] = c;

        insertionBoundsCursor = insertionBoundsCursor + Math.round(width / 2) + previousInsertionBoundsCursorValue;
        this.insertionBounds.push(insertionBoundsCursor);
        previousInsertionBoundsCursorValue = Math.round(width / 2);
    }

    y = 0;
    for (r = 0; r < numRows; r++) {
        vy = r;
        if (r >= numFixedRows) {
            vy = vy + scrollTop;
            if (firstVY === undefined) {
                firstVY = vy;
            }
            lastVY = vy;
        }
        if (y > viewHeight || numRows <= vy) {
            break;
        }
        height = this.getRowHeight(vy);
        y = y + height;
        this.rowEdges[r + 1] = Math.round(y);
        this.visibleRows[r] = vy;
        this.rowEdgesIndexMap[vy] = r;
    }
    this.viewHeight = viewHeight;
    this.dataWindow = grid.rectangles.rectangle.create(firstVX, firstVY, lastVX - firstVX, lastVY - firstVY);
};

/**
 * @function
 * @instance
 * @description
returns a property value at a key, delegates to the grid
 * #### returns: Object
 */
Renderer.prototype.resolveProperty = function(key) {
    return this.getGrid().resolveProperty(key);
};

/**
 * @function
 * @instance
 * @description
getter for the [fin-hypergrid](module-._fin-hypergrid.html)
 * #### returns: fin-hypergrid
 */
Renderer.prototype.getGrid = function() {
    return this.grid;
};

/**
 * @function
 * @instance
 * @description
setter for the [fin-hypergrid](module-._fin-hypergrid.html)
 *
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 */
Renderer.prototype.setGrid = function(grid) {
    var self = this;
    this.grid = grid;
    grid.canvas.getComponent = function() {
        return self;
    }
    //this.startAnimator();
    //lets make use of prototype inheritance for cell properties
};

/**
 * @function
 * @instance
 * @description
This is the entry point from fin-canvas.  Notify the fin-hypergrid everytime we've repainted.
 *
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 */
Renderer.prototype._paint = function(gc) {
    if (!this.grid) {
        return;
    }
    this.renderGrid(gc);
    this.getGrid().gridRenderedNotification();
};

/**
 * @function
 * @instance
 * @description
Answer how many rows we rendered
 * #### returns: integer
 */
Renderer.prototype.getVisibleRowsCount = function() {
    return this.visibleRows.length - 1;
};

Renderer.prototype.getVisibleScrollHeight = function() {
    var grid = this.getGrid();
    var frh = grid.getFixedRowsHeight();
    var height = this.viewHeight - frh;
    return height;
};

/**
 * @function
 * @instance
 * @description
Answer what rows we just rendered as an Array of integers
 * #### returns: Array
 */
Renderer.prototype.getVisibleRows = function() {
    return this.visibleRows;
};

/**
 * @function
 * @instance
 * @description
Answer how many columns we just rendered
 * #### returns: integer
 */
Renderer.prototype.getVisibleColumnsCount = function() {
    return this.visibleColumns.length - 1;
};

/**
 * @function
 * @instance
 * @description
Answer what columns we just rendered as an Array of indexes
 * #### returns: Array
 */
Renderer.prototype.getVisibleColumns = function() {
    return this.visibleColumns;
};

/**
 * @function
 * @instance
 * @description
answer with the column index if the mouseEvent coordinates are over a column divider
 * #### returns: integer
 */
Renderer.prototype.overColumnDivider = function(x) {
    x = Math.round(x);
    var edges = this.getColumnEdges();
    var whichCol = edges.indexOf(x - 1);
    if (whichCol < 0) {
        whichCol = edges.indexOf(x);
    }
    if (whichCol < 0) {
        whichCol = edges.indexOf(x - 2);
    }
    if (whichCol < 0) {
        whichCol = edges.indexOf(x + 1);
    }
    if (whichCol < 0) {
        whichCol = edges.indexOf(x - 3);
    }

    return whichCol;
};

/**
 * @function
 * @instance
 * @description
answer with the row index if the mouseEvent coordinates are over a row divider
 * #### returns: integer
 */
Renderer.prototype.overRowDivider = function(y) {
    y = Math.round(y);
    var which = this.rowEdges.indexOf(y + 1);
    if (which < 0) {
        which = this.rowEdges.indexOf(y);
    }
    if (which < 0) {
        which = this.rowEdges.indexOf(y - 1);
    }
    return which;
};

/**
 * @function
 * @instance
 * @description
answer with a rectangle the bounds of a specific cell
 *
 * @param {fin-rectangle.point} cell - [fin-rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
 * @description
 * #### returns: [fin-rectangle](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
 */
Renderer.prototype.getBoundsOfCell = function(cell) {
    return this._getBoundsOfCell(cell.x, cell.y);
};

/**
 * @function
 * @instance
 * @description
answer with a rectangle the bounds of a specific cell
 *
 * @param {integer} x - x coordinate
 * @param {integer} y - y coordinate
 *
 * @description
 * #### returns: [fin-rectangle](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
 */
Renderer.prototype._getBoundsOfCell = function(c, r) {
    var xOutside = false;
    var yOutside = false;
    var columnEdges = this.getColumnEdges();
    var rowEdges = this.getRowEdges();

    var x = this.columnEdgesIndexMap[c];
    var y = this.rowEdgesIndexMap[r];
    if (x === undefined) {
        x = this.columnEdgesIndexMap[c - 1];
        xOutside = true;
    }

    if (y === undefined) {
        y = this.rowEdgesIndexMap[r - 1];
        yOutside = true;
    }

    var ox = columnEdges[x],
        oy = rowEdges[y],
        cx = columnEdges[x + 1],
        cy = rowEdges[y + 1],
        ex = cx - ox,
        ey = cy - oy;

    var cell = this.cell;
    cell.x = xOutside ? cx : ox;
    cell.y = yOutside ? cy : oy;
    cell.width = xOutside ? 0 : ex;
    cell.height = yOutside ? 0 : ey;

    return cell;

};

/**
 * @function
 * @instance
 * @description
answer the column index under the coordinate at pixelX
 *
 * @param {pixelX} x - x coordinate
 * @description
 * #### returns: integer
 */
Renderer.prototype.getColumnFromPixelX = function(pixelX) {
    var width = 0;
    var grid = this.getGrid();
    var fixedColumnCount = this.getFixedColumnCount();
    var scrollLeft = grid.getHScrollValue();
    var c;
    var edges = this.getColumnEdges();
    for (c = 1; c < edges.length - 1; c++) {
        width = edges[c] - (edges[c] - edges[c - 1]) / 2;
        if (pixelX < width) {
            if (c > fixedColumnCount) {
                c = c + scrollLeft;
            }
            return c - 1;
        }
    }
    if (c > fixedColumnCount) {
        c = c + scrollLeft;
    }
    return c - 1;
};


/**
 * @function
 * @instance
 * @description
Answer specific data cell coordinates given mouse coordinates in pixels.
 *
 * @param {fin-rectangle.point} point - [fin-rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
 * @description
 * #### returns: Object
 */
Renderer.prototype.getGridCellFromMousePoint = function(point) {

    var grid = this.getGrid();
    var width = 0;
    var height = 0;
    var x, y, c, r;
    var previous = 0;
    var columnEdges = this.getColumnEdges();
    var fixedColumnCount = this.getFixedColumnCount(); // + gridSize;
    var fixedRowCount = this.getFixedRowCount();

    // var fixedColumnCount = this.getFixedColumnCount();
    // var fixedRowCount = this.getFixedRowCount();
    var scrollX = this.getScrollLeft();
    var scrollY = this.getScrollTop();

    for (c = 0; c < columnEdges.length; c++) {
        width = columnEdges[c];
        if (point.x < width) {
            x = Math.max(0, point.x - previous - 2);
            break;
        }
        previous = width;
    }
    c--;
    previous = 0;
    for (r = 0; r < this.rowEdges.length; r++) {
        height = this.rowEdges[r];
        if (point.y < height) {
            y = Math.max(0, point.y - previous - 2);
            break;
        }
        previous = height;
    }
    r--;
    if (point.x < 0) {
        c = -1;
    }
    if (point.y < 0) {
        r = -1;
    }

    var viewPoint = grid.newPoint(c, r);

    //compensate if we are scrolled
    if (c >= fixedColumnCount) {
        c = c + scrollX;
    }
    if (r >= fixedRowCount) {
        r = r + scrollY;
    }

    return {
        gridCell: grid.newPoint(c, r),
        mousePoint: grid.newPoint(x, y),
        viewPoint: viewPoint
    };
};

/**
 * @function
 * @instance
 * @description
Answer if a column is visible, must be fully visible
 *
 * @param {integer} colIndex - the column index
 * @description
 * #### returns: boolean
 */
Renderer.prototype.isColumnVisible = function(colIndex) {
    var isVisible = this.visibleColumns.indexOf(colIndex) !== -1;
    return isVisible;
};

/**
 * @function
 * @instance
 * @description
Answer the width x coordinate of the last rendered column
 * #### returns: integer
 */
Renderer.prototype.getFinalVisableColumnBoundry = function() {
    var isMaxX = this.isLastColumnVisible();
    var chop = isMaxX ? 2 : 1;
    var colWall = this.getColumnEdges()[this.getColumnEdges().length - chop];
    var result = Math.min(colWall, this.getBounds().width() - 200);
    return result;
};

/**
 * @function
 * @instance
 * @description
Answer if a row is visible, must be fully visible
 *
 * @param {integer} rowIndex - the row index
 *
 * @description
 * #### returns: boolean
 */
Renderer.prototype.isRowVisible = function(rowIndex) {
    var isVisible = this.visibleRows.indexOf(rowIndex) !== -1;
    return isVisible;
};

/**
 * @function
 * @instance
 * @description
Answer if a data cell is selected.
 *
 * @param {integer} x - the x cell coordinate
 * @param {integer} y - the y cell coordinate
 *
 * @description
 * #### returns: boolean
 */
Renderer.prototype.isSelected = function(x, y) {
    return this.getGrid().isSelected(x, y);
};

/**
 * @function
 * @instance
 * @description
This is the main forking of the renderering task.
 *
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 */
Renderer.prototype.renderGrid = function(gc) {
    gc.beginPath();

    this.paintCells(gc);
    this.paintGridlines(gc);
    //this.blankOutOverflow(gc); // no longer needed
    this.renderOverrides(gc);
    this.renderFocusCell(gc);
    gc.closePath();
};

focusLineStep: [
    [5, 5],
    [0, 1, 5, 4],
    [0, 2, 5, 3],
    [0, 3, 5, 2],
    [0, 4, 5, 1],
    [0, 5, 5, 0],
    [1, 5, 4, 0],
    [2, 5, 3, 0],
    [3, 5, 2, 0],
    [4, 5, 1, 0]
],

Renderer.prototype.renderFocusCell = function(gc) {
    gc.beginPath();
    this._renderFocusCell(gc);
    gc.closePath();
};

Renderer.prototype._renderFocusCell = function(gc) {
    var grid = this.getGrid();
    var selections = grid.getSelectionModel().getSelections();
    if (!selections || selections.length === 0) {
        return;
    }
    var selection = selections[selections.length - 1];
    var mouseDown = selection.origin;
    if (mouseDown.x === -1) {
        //no selected area, lets exit
        return;
    }

    var visibleColumns = this.getVisibleColumns();
    var visibleRows = this.getVisibleRows();
    var lastVisibleColumn = visibleColumns[visibleColumns.length - 1];
    var lastVisibleRow = visibleRows[visibleRows.length - 1];

    var extent = selection.extent;

    var dpOX = Math.min(mouseDown.x, mouseDown.x + extent.x);
    var dpOY = Math.min(mouseDown.y, mouseDown.y + extent.y);

    //lets check if our selection rectangle is scrolled outside of the visible area
    if (dpOX > lastVisibleColumn) {
        return; //the top of our rectangle is below visible
    }
    if (dpOY > lastVisibleRow) {
        return; //the left of our rectangle is to the right of being visible
    }

    var dpEX = Math.max(mouseDown.x, mouseDown.x + extent.x) + 1;
    dpEX = Math.min(dpEX, 1 + lastVisibleColumn);

    var dpEY = Math.max(mouseDown.y, mouseDown.y + extent.y) + 1;
    dpEY = Math.min(dpEY, 1 + lastVisibleRow);

    var o = this._getBoundsOfCell(dpOX, dpOY);
    var ox = Math.round((o.x === undefined) ? grid.getFixedColumnsWidth() : o.x);
    var oy = Math.round((o.y === undefined) ? grid.getFixedRowsHeight() : o.y);
    // var ow = o.width;
    // var oh = o.height;
    var e = this._getBoundsOfCell(dpEX, dpEY);
    var ex = Math.round((e.x === undefined) ? grid.getFixedColumnsWidth() : e.x);
    var ey = Math.round((e.y === undefined) ? grid.getFixedRowsHeight() : e.y);
    // var ew = e.width;
    // var eh = e.height;
    var x = Math.min(ox, ex);
    var y = Math.min(oy, ey);
    var width = 1 + ex - ox;
    var height = 1 + ey - oy;
    if (x === ex) {
        width = ox - ex;
    }
    if (y === ey) {
        height = oy - ey;
    }
    if (width * height < 1) {
        //if we are only a skinny line, don't render anything
        return;
    }

    gc.rect(x, y, width, height);
    gc.fillStyle = 'rgba(0, 0, 0, 0.2)';
    gc.fill();
    gc.lineWidth = 1;
    gc.strokeStyle = 'black';

    // animate the dashed line a bit here for fun

    gc.stroke();

    //gc.rect(x, y, width, height);

    //gc.strokeStyle = 'white';

    // animate the dashed line a bit here for fun
    //gc.setLineDash(this.focusLineStep[Math.floor(10 * (Date.now() / 300 % 1)) % this.focusLineStep.length]);

    gc.stroke();
};


/**
 * @function
 * @instance
 * @description
Paint the background color over the overflow from the final column paint
 *
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
*/
Renderer.prototype.blankOutOverflow = function(gc) {
    var isMaxX = this.isLastColumnVisible();
    var chop = isMaxX ? 1 : 0;
    var x = this.getColumnEdges()[this.getColumnEdges().length - chop];
    var bounds = this.getGrid().getBoundingClientRect();
    var width = bounds.width - x;
    var height = bounds.height;
    gc.fillStyle = this.resolveProperty('backgroundColor2');
    gc.fillRect(x + 1, 0, width, height);
};

/**
 * @function
 * @instance
 * @description
iterate the renderering overrides and manifest each
 *
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
*/
Renderer.prototype.renderOverrides = function(gc) {
    var grid = this.getGrid();
    var cache = grid.renderOverridesCache;
    for (var key in cache) {
        if (cache.hasOwnProperty(key)) {
            var override = cache[key];
            if (override) {
                this.renderOverride(gc, override);
            }
        }
    }
};

/**
 * @function
 * @instance
 * @description
copy each overrides specified area to it's target and blank out the source area
 *
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 * @param {OverrideObject} override - an object with details contain an area and a target context
*/
Renderer.prototype.renderOverride = function(gc, override) {
    //lets blank out the drag row
    var hdpiRatio = override.hdpiratio;
    //var edges = this.getColumnEdges();
    var startX = override.startX; //hdpiRatio * edges[override.columnIndex];
    var width = override.width + 1;
    var height = override.height;
    var targetCTX = override.ctx;
    var imgData = gc.getImageData(startX, 0, Math.round(width * hdpiRatio), Math.round(height * hdpiRatio));
    targetCTX.putImageData(imgData, 0, 0);
    gc.fillStyle = this.resolveProperty('backgroundColor2');
    gc.fillRect(Math.round(startX / hdpiRatio), 0, width, height);
};

/**
 * @function
 * @instance
 * @description
answers if x, y is currently being hovered over
 * #### returns: boolean
 * @param {integer} offsetX - x coordinate
 * @param {integer} offsetY - y coordinate
 *
*/
Renderer.prototype.isHovered = function(x, y) {
    return this.getGrid().isHovered(x, y);
};

/**
 * @function
 * @instance
 * @description
answers if row y is currently being hovered over
 * #### returns: boolean
 * @param {integer} offsetY - y coordinate
 *
*/
Renderer.prototype.isRowHovered = function(y) {
    return this.getGrid().isRowHovered(y);
};

/**
 * @function
 * @instance
 * @description
answers if column x is currently being hovered over
 * #### returns: boolean
 * @param {integer} offsetX - x coordinate
 *
*/
Renderer.prototype.isColumnHovered = function(x) {
    return this.getGrid().isColumnHovered(x);
};

/**
 * @function
 * @instance
 * @description
Protected render the main cells.  We snapshot the context to insure against its polution.
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
 *
*/
Renderer.prototype.paintCells = function(gc) {
    try {
        gc.save();
        this._paintCells(gc);
    } catch (e) {
        console.error(e);
    } finally {
        gc.restore();
    }
};

/**
 * @function
 * @instance
 * @description
answers if a specfic column in the fixed row area is selected
 * @param {integer} colIndex - column index
 *
*/
Renderer.prototype.isCellSelectedInRow = function(colIndex) {
    return this.getGrid().isCellSelectedInRow(colIndex);
};

/**
 * @function
 * @instance
 * @description
answers if a specfic row in the fixed column area is selected
 * @param {integer} rowIndex - column index
 *
*/
Renderer.prototype.isCellSelectedInColumn = function(rowIndex) {
    return this.getGrid().isCellSelectedInColumn(rowIndex);
};

/**
 * @function
 * @instance
 * @description
answers current vertical scroll value
 * #### returns: integer
*/
Renderer.prototype.getScrollTop = function() {
    var st = this.getGrid().getVScrollValue();
    return st;
};

/**
 * @function
 * @instance
 * @description
answers current horizontal scroll value
 * #### returns: integer
*/
Renderer.prototype.getScrollLeft = function() {
    var st = this.getGrid().getHScrollValue();
    return st;
};

/**
 * @function
 * @instance
 * @description
getter for my behavior (model)
 * #### returns: [fin-hypergrid-behavior-base](module-behaviors_base.html)
*/
Renderer.prototype.getBehavior = function() {
    return this.getGrid().getBehavior();
};

Renderer.prototype.getColumnEdges = function() {
    return this.columnEdges;
};

Renderer.prototype.getRowEdges = function() {
    return this.rowEdges;
};
/**
 * @function
 * @instance
 * @description
answers the row height of the row at index rowIndex
 * #### returns: integer
 * @param {integer} rowIndex - the row index
*/
Renderer.prototype.getRowHeight = function(rowIndex) {
    var height = this.getBehavior().getRowHeight(rowIndex);
    return height;
};

/**
 * @function
 * @instance
 * @description
answers the columnWidth of the column at index columnIndex
 * #### returns: integer
 * @param {integer} columnIndex - the row index
*/
Renderer.prototype.getColumnWidth = function(columnIndex) {
    var width = this.getGrid().getColumnWidth(columnIndex);
    return width;
};

/**
 * @function
 * @instance
 * @description
answer true if the last col was rendered (is visible)
 * #### returns: boolean
*/
Renderer.prototype.isLastColumnVisible = function() {
    var lastColumnIndex = this.getColumnCount() - 1;
    var isMax = this.visibleColumns.indexOf(lastColumnIndex) !== -1;
    return isMax;
};

/**
 * @function
 * @instance
 * @description
answer the rendered column width at index
 * #### returns: integer
*/
Renderer.prototype.getRenderedWidth = function(index) {
    return this.getColumnEdges()[index];
};

/**
 * @function
 * @instance
 * @description
answer the rendered row height at index
 * #### returns: integer
*/
Renderer.prototype.getRenderedHeight = function(index) {
    return this.rowEdges[index];
};

/**
 * @function
 * @instance
 * @description
getter for my [fin-canvas](https://github.com/stevewirts/fin-canvas)
 * #### returns: [fin-canvas](https://github.com/stevewirts/fin-canvas)
*/
Renderer.prototype.getCanvas = function() {
    return this.getGrid().getCanvas();
};

/**
 * @function
 * @instance
 * @description
answer if the user is currently dragging a column for reordering
 * #### returns: boolean
*/
Renderer.prototype.isDraggingColumn = function() {
    return this.getGrid().isDraggingColumn();
};

/**
 * @function
 * @instance
 * @description
answer the row to goto for a page up
 * #### returns: integer
*/
Renderer.prototype.getPageUpRow = function() {
    var behavior = this.getBehavior();
    var scrollHeight = this.getVisibleScrollHeight();
    var headerRows = this.getGrid().getFixedRowCount();
    var top = this.dataWindow.origin.y - headerRows;
    var scanHeight = 0;
    while (scanHeight < scrollHeight && top > -1) {
        scanHeight = scanHeight + behavior.getRowHeight(top);
        top--;
    }
    return top + 1;
};

/**
 * @function
 * @instance
 * @description
answer the row to goto for a page down
 * #### returns: integer
*/
Renderer.prototype.getPageDownRow = function() {
    var headerRows = this.getGrid().getFixedRowCount();
    var rowNum = this.dataWindow.corner.y - headerRows - 1;
    return rowNum;
};

/**
 * @function
 * @instance
 * @description
return the number of columns
 *
 * #### returns: integer
 */
Renderer.prototype.getColumnCount = function() {
    return this.getGrid().getColumnCount();
};

/**
 * @function
 * @instance
 * @description
return the number of rows
 *
 * #### returns: integer
 */
Renderer.prototype.getRowCount = function() {
    return this.getGrid().getRowCount();
};

/**
 * @function
 * @instance
 * @description
return the number of fixed columns
 *
 * #### returns: integer
 */
Renderer.prototype.getFixedColumnCount = function() {
    return this.getGrid().getFixedColumnCount();
};

/**
 * @function
 * @instance
 * @description
return the number of fixed rows
 *
 * #### returns: integer
 */
Renderer.prototype.getFixedRowCount = function() {
    return this.getGrid().getFixedRowCount();
};

/**
 * @function
 * @instance
 * @description
return the number of fixed rows
 *
 * #### returns: integer
 */
Renderer.prototype.getHeaderRowCount = function() {
    return this.getGrid().getHeaderRowCount();
};

/**
 * @function
 * @instance
 * @description
return the number of fixed rows
 *
 * #### returns: integer
 */
Renderer.prototype.getHeaderColumnCount = function() {
    return this.getGrid().getHeaderColumnCount();
};

/**
 * @function
 * @instance
 * @description
Unprotected rendering the fixed columns along the left side
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
 * @param {integer} numColumns - the max columns to iterate through
 * @param {integer} numRows - the max rows to iterate through
 *
*/
Renderer.prototype._paintCells = function(gc) {
    var x, y, c, r = 0;

    var columnEdges = this.getColumnEdges();
    var rowEdges = this.rowEdges;
    this.buttonCells = {};
    var visibleCols = this.getVisibleColumns();
    var visibleRows = this.getVisibleRows();

    var width = columnEdges[columnEdges.length - 1];
    var height = rowEdges[rowEdges.length - 1];

    gc.moveTo(0, 0);
    gc.rect(0, 0, width, height);
    gc.stroke();
    gc.clip();

    var loopLength = visibleCols.length;
    var loopStart = 0;

    if (this.getGrid().isShowRowNumbers()) {
        //loopLength++;
        loopStart--;
    }

    for (x = loopStart; x < loopLength; x++) {
        c = visibleCols[x];
        this.renderedColumnMinWidths[c] = 0;
        for (y = 0; y < visibleRows.length; y++) {
            r = visibleRows[y];
            this._paintCell(gc, c, r);
        }
    }

};

/**
 * @function
 * @instance
 * @description
We opted to not paint borders for each cell as that was extremely expensive.  Instead we draw gridlines here.  Also we record the widths and heights for later.
 *
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
Renderer.prototype.paintGridlines = function(gc) {
    var x, y, c, r = 0;

    var colWidths = this.getColumnEdges();
    var rowHeights = this.rowEdges;

    var viewWidth = colWidths[colWidths.length - 1];
    var viewHeight = rowHeights[rowHeights.length - 1];

    var drawThemH = this.resolveProperty('gridLinesH');
    var drawThemV = this.resolveProperty('gridLinesV');
    var lineColor = this.resolveProperty('lineColor');

    gc.beginPath();
    gc.strokeStyle = lineColor;
    gc.lineWidth = this.resolveProperty('lineWidth');
    gc.moveTo(0, 0);

    if (drawThemV) {
        for (c = 0; c < colWidths.length + 1; c++) {
            x = colWidths[c] + 0.5;
            gc.moveTo(x, 0);
            gc.lineTo(x, viewHeight);
        }
    }

    if (drawThemH) {
        for (r = 0; r < rowHeights.length; r++) {
            y = rowHeights[r] + 0.5;
            gc.moveTo(0, y);
            gc.lineTo(viewWidth, y);
        }
    }
    gc.stroke();
    gc.closePath();
};

Renderer.prototype.paintCell = function(gc, x, y) {
    var c, r = 0;
    var visibleCols = this.getVisibleColumns();
    var visibleRows = this.getVisibleRows();
    gc.moveTo(0, 0);
    c = visibleCols[x];
    r = visibleRows[y];
    if (!c) {
        return; // were not being viewed at at the moment, nothing to paint
    }
    this._paintCell(gc, c, r);
};

Renderer.prototype._paintCell = function(gc, c, r) {

    var grid = this.getGrid();
    var behavior = this.getBehavior();
    var baseProperties = behavior.getColumnProperties(c);
    var columnProperties = baseProperties;
    var headerRowCount = behavior.getHeaderRowCount();
    //var headerColumnCount = behavior.getHeaderColumnCount();

    var isShowRowNumbers = grid.isShowRowNumbers();
    var isHeaderRow = r < headerRowCount;
    //var isHeaderColumn = c < headerColumnCount;
    var isFilterRow = grid.isFilterRow(r);
    var isHierarchyColumn = grid.isHierarchyColumn(c);
    var isRowSelected = grid.isRowSelected(r);
    var isColumnSelected = grid.isColumnSelected(c);
    var isCellSelected = grid.isCellSelected(c, r);
    var isCellSelectedInColumn = grid.isCellSelectedInColumn(c);
    var isCellSelectedInRow = grid.isCellSelectedInRow(r);
    var areAllRowsSelected = grid.areAllRowsSelected();

    var cellProperties;

    if ((isShowRowNumbers && c === -1) || (!isShowRowNumbers && c === 0)) {
        if (isRowSelected) {
            baseProperties = baseProperties.rowHeaderRowSelection;
            cellProperties = Object.create(baseProperties);
            cellProperties.isSelected = true;
        } else {
            baseProperties = baseProperties.rowHeader;
            cellProperties = Object.create(baseProperties);
            cellProperties.isSelected = isCellSelectedInRow;
        }
        cellProperties.isUserDataArea = false;
    } else if (isHeaderRow) {
        if (isFilterRow) {
            baseProperties = baseProperties.filterProperties;
            cellProperties = Object.create(baseProperties);
            cellProperties.isSelected = false;
        } else if (isColumnSelected) {
            baseProperties = baseProperties.columnHeaderColumnSelection;
            cellProperties = Object.create(baseProperties);
            cellProperties.isSelected = true;
        } else {
            baseProperties = baseProperties.columnHeader;
            cellProperties = Object.create(baseProperties);
            cellProperties.isSelected = isCellSelectedInColumn;
        }
        cellProperties.isUserDataArea = false;
    } else if (isHierarchyColumn) {
        baseProperties = baseProperties.rowHeader;
        cellProperties = Object.create(baseProperties);
        cellProperties.isSelected = isCellSelectedInRow;
    } else {
        cellProperties = Object.create(baseProperties);
        cellProperties.isSelected = isCellSelected || isRowSelected || isColumnSelected;
        cellProperties.isUserDataArea = true;
    }

    var rowNum = r - headerRowCount + 1;

    if (c === -1) {
        var checkedImage = isRowSelected ? 'checked' : 'unchecked';
        cellProperties.value = isHeaderRow ? '' : [behavior.getImage(checkedImage), rowNum, null];
        if (r === 0) {
            checkedImage = areAllRowsSelected ? 'checked' : 'unchecked';
            cellProperties.value = [behavior.getImage(checkedImage), '', null];
        } else if (isFilterRow) {
            cellProperties.value = [behavior.getImage('filter-off'), '', null];

        }
    } else {
        cellProperties.value = grid.getValue(c, r);
    }
    cellProperties.halign = grid.getColumnAlignment(c);
    cellProperties.isColumnHovered = this.isRowHovered(c, r);
    cellProperties.isRowHovered = this.isColumnHovered(c, r);
    cellProperties.bounds = this._getBoundsOfCell(c, r);
    cellProperties.isCellSelected = isCellSelected;
    cellProperties.isRowSelected = isRowSelected;
    cellProperties.isColumnSelected = isColumnSelected;
    cellProperties.isInCurrentSelectionRectangle = grid.isInCurrentSelectionRectangle(c, r);

    var mouseDownState = grid.mouseDownState;
    if (mouseDownState) {
        var point = mouseDownState.gridCell;
        cellProperties.mouseDown = point.x === c && point.y === r;
    }

    cellProperties.x = c;
    cellProperties.y = r;

    behavior.cellPropertiesPrePaintNotification(cellProperties);

    var cell = behavior.getCellRenderer(cellProperties, c, r);
    var overrides = behavior.getCellProperties(c, r);

    //declarative cell properties
    if (overrides) {
        merge(cellProperties, overrides);
    }

    //allow the renderer to identify itself if it's a button
    cellProperties.buttonCells = this.buttonCells;

    cell.paint(gc, cellProperties);

    this.renderedColumnMinWidths[c] = Math.max(cellProperties.minWidth || 0, this.renderedColumnMinWidths[c]);
    columnProperties.preferredWidth = this.renderedColumnMinWidths[c];
};
Renderer.prototype.isViewableButton = function(c, r) {
    var key = c + ',' + r;
    return this.buttonCells[key] === true;
};
Renderer.prototype.getRowNumbersWidth = function() {
    var colEdges = this.getColumnEdges();
    if (colEdges.length === 0) {
        return 0;
    }
    return colEdges[0];
};
Renderer.prototype.startAnimator = function() {
    var animate;
    var self = this;
    animate = function() {
        self.animate();
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
};
Renderer.prototype.animate = function() {
    var ctx = this.getCanvas().canvasCTX;
    ctx.beginPath();
    ctx.save();
    this.renderFocusCell(ctx);
    ctx.restore();
    ctx.closePath();
};

Renderer.prototype.setBounds = function(bounds) {
    this.bounds = bounds;
};

module.exports = Renderer;

},{}],5:[function(require,module,exports){
/* global RangeSelectionModel */
'use strict';

/**
 *
 * @module .\selection-model
 * @description
 We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains.  This is how we know to highlight the fixed regions on the edges of the grid.
 */

function SelectionModel() {
    this.selections = [];
    this.flattenedX = [];
    this.flattenedY = [];
    this.rowSelectionModel = new RangeSelectionModel();
    this.columnSelectionModel = new RangeSelectionModel();
    this.setLastSelectionType('');
    this.allRowsSelected = false;
};

SelectionModel.prototype = {};

/**
 *
 * @property {Array} selections - an array containing the selection rectangles
 * @instance
 */
SelectionModel.prototype.selections = null;

/**
 *
 * @property {Array} flattenedX - an array containing the selection rectangles flattend in the x dimension
 * @instance
 */
SelectionModel.prototype.flattenedX = null;

/**
 *
 * @property {Array} flattenedY - an array containing the selection rectangles flattend in the y dimension
 * @instance
 */
SelectionModel.prototype.flattenedY = null;

SelectionModel.prototype.rowSelectionModel = null;

SelectionModel.prototype.columnSelectionModel = null;

SelectionModel.prototype.allRowsSelected = false;


/**
 * @function
 * @instance
 * @description
getter for the [fin-hypergrid](module-._fin-hypergrid.html)
 * #### returns: fin-hypergrid
 */
SelectionModel.prototype.getGrid = function() {
    return null;
};
SelectionModel.prototype.getLastSelection = function() {
    var sels = this.getSelections();
    var sel = sels[sels.length - 1];
    return sel;
};

SelectionModel.prototype.getLastSelectionType = function() {
    return this.lastSelectionType;
};
SelectionModel.prototype.setLastSelectionType = function(type) {
    this.lastSelectionType = type;
};
/**
 * @function
 * @instance
 * @description
select a region given an origin x,y and extent x,y
 *
 * @param {integer} ox - origin x coordinate
 * @param {integer} oy - origin y coordinate
 * @param {integer} ex - extent x coordinate
 * @param {integer} ey - extent y coordinate
 */
SelectionModel.prototype.select = function(ox, oy, ex, ey) {
    var newSelection = this.getGrid().newRectangle(ox, oy, ex, ey);
    this.selections.push(newSelection);
    this.flattenedX.push(newSelection.flattenXAt(0));
    this.flattenedY.push(newSelection.flattenYAt(0));
    this.setLastSelectionType('cell');
    this.getGrid().selectionChanged();
};

SelectionModel.prototype.toggleSelect = function(ox, oy, ex, ey) {

    var selections = this.getSelections();

    for (var i = 0; i < selections.length; i++) {
        var each = selections[i];
        if (each.origin.x === ox && each.origin.y === oy && each.extent.x === ex && each.extent.y === ey) {
            selections.splice(i, 1);
            this.flattenedX.splice(i, 1);
            this.flattenedY.splice(i, 1);
            this.getGrid().selectionChanged();
            return;
        }
    }

    this.select(ox, oy, ex, ey);

};

/**
 * @function
 * @instance
 * @description
remove the last selection that was created
 */
SelectionModel.prototype.clearMostRecentSelection = function() {
    this.allRowsSelected = false;
    this.selections.length = Math.max(0, this.selections.length - 1);
    this.flattenedX.length = Math.max(0, this.flattenedX.length - 1);
    this.flattenedY.length = Math.max(0, this.flattenedY.length - 1);
    //this.getGrid().selectionChanged();
};

SelectionModel.prototype.clearMostRecentColumnSelection = function() {
    this.columnSelectionModel.clearMostRecentSelection();
    this.setLastSelectionType('column');
};

SelectionModel.prototype.clearMostRecentRowSelection = function() {
    this.rowSelectionModel.clearMostRecentSelection();
    this.setLastSelectionType('row');
};

SelectionModel.prototype.clearRowSelection = function() {
    this.rowSelectionModel.clear();
    this.setLastSelectionType('row');
};

SelectionModel.prototype.getSelections = function() {
    return this.selections;
};

/**
 * @function
 * @instance
 * @description
answer if I have any selections
 *
 * #### returns: boolean
 */
SelectionModel.prototype.hasSelections = function() {
    return this.selections.length !== 0;
};

SelectionModel.prototype.hasRowSelections = function() {
    return !this.rowSelectionModel.isEmpty();
};

SelectionModel.prototype.hasColumnSelections = function() {
    return !this.columnSelectionModel.isEmpty();
};

/**
 * @function
 * @instance
 * @description
answer coordinate x, y is selected
 * #### returns: boolean
 * @param {integer} x - column index
 * @param {integer} y - row index
 */
SelectionModel.prototype.isSelected = function(x, y) {
    return this._isSelected(this.selections, x, y);
};

/**
 * @function
 * @instance
 * @description
answer if we have a selection covering a specific column
 * #### returns: boolean
 * @param {integer} col - column index
 */
SelectionModel.prototype.isCellSelectedInRow = function(r) {
    return this._isCellSelected(this.flattenedX, 0, r);
};

/**
 * @function
 * @instance
 * @description
answer if we have a selection covering a specific row
 * #### returns: boolean
 * @param {integer} row - row index
 */
SelectionModel.prototype.isCellSelectedInColumn = function(c) {
    return this._isCellSelected(this.flattenedY, c, 0);
};

/**
 * @function
 * @instance
 * @description
general selection query function
 *
 * @param {Array} selections - array of selection rectangles to search through
 * @param {integer} x - x coordinate
 * @param {integer} y - y coordinate
 */
SelectionModel.prototype._isSelected = function(selections, x, y) {
    if (this.isColumnSelected(x) || this.isRowSelected(y)) {
        return true;
    }
    return this._isCellSelected(selections, x, y);
};

SelectionModel.prototype.isCellSelected = function(x, y) {
    return this._isCellSelected(this.getSelections(), x, y);
};

SelectionModel.prototype._isCellSelected = function(selections, x, y) {
    for (var i = 0; i < selections.length; i++) {
        var each = selections[i];
        if (this.getGrid().rectangles.rectangle.contains(each, x, y)) {
            return true;
        }
    }
    return false;
};
/**
 * @function
 * @instance
 * @description
empty out all our state
 *
 */
SelectionModel.prototype.clear = function() {
    this.allRowsSelected = false;
    this.selections.length = 0;
    this.flattenedX.length = 0;
    this.flattenedY.length = 0;
    this.rowSelectionModel.clear();
    this.columnSelectionModel.clear();
    //this.getGrid().selectionChanged();
};

SelectionModel.prototype.isRectangleSelected = function(ox, oy, ex, ey) {
    var selections = this.getSelections();
    for (var i = 0; i < selections.length; i++) {
        var each = selections[i];
        if (each.origin.x === ox && each.origin.y === oy && each.extent.x === ex && each.extent.y === ey) {
            return true;
        }
    }
    return false;
};

SelectionModel.prototype.isColumnSelected = function(x) {
    return this.columnSelectionModel.isSelected(x);
};

SelectionModel.prototype.isRowSelected = function(y) {
    return this.allRowsSelected || this.rowSelectionModel.isSelected(y);
};

SelectionModel.prototype.selectColumn = function(x1, x2) {
    this.columnSelectionModel.select(x1, x2);
    this.setLastSelectionType('column');
};

SelectionModel.prototype.selectAllRows = function() {
    this.clear();
    this.allRowsSelected = true;
};

SelectionModel.prototype.areAllRowsSelected = function() {
    return this.allRowsSelected;
};

SelectionModel.prototype.selectRow = function(y1, y2) {
    this.rowSelectionModel.select(y1, y2);
    this.setLastSelectionType('row');
};

SelectionModel.prototype.deselectColumn = function(x1, x2) {
    this.columnSelectionModel.deselect(x1, x2);
    this.setLastSelectionType('column');
};

SelectionModel.prototype.deselectRow = function(y1, y2) {
    this.rowSelectionModel.deselect(y1, y2);
    this.setLastSelectionType('row');
};

SelectionModel.prototype.getSelectedRows = function() {
    return this.rowSelectionModel.getSelections();
};

SelectionModel.prototype.getSelectedColumns = function() {
    return this.columnSelectionModel.getSelections();
};

SelectionModel.prototype.isColumnOrRowSelected = function() {
    return !this.columnSelectionModel.isEmpty() || !this.rowSelectionModel.isEmpty();
};
SelectionModel.prototype.getFlattenedYs = function() {
    var result = [];
    var set = {};
    for (var i = 0; i < this.selections.length; i++) {
        var each = this.selections[i];
        var top = each.origin.y;
        var size = each.extent.y + 1;
        for (var r = 0; r < size; r++) {
            var ti = r + top;
            if (!set[ti]) {
                result.push(ti);
                set[ti] = true;
            }
        }

    }
    result.sort(function(x, y) {
        return x - y;
    });
    return result;
};

SelectionModel.prototype.selectRowsFromCells = function(offset) {
    this.allRowsSelected = false;
    offset = offset || 0;
    var sm = this.rowSelectionModel;
    sm.clear();
    for (var i = 0; i < this.selections.length; i++) {
        var each = this.selections[i];
        var top = each.origin.y;
        var size = each.extent.y;
        sm.select(top + offset, top + size + offset);
    }
};

SelectionModel.prototype.selectColumnsFromCells = function(offset) {
    offset = offset || 0;
    var sm = this.columnSelectionModel;
    sm.clear();
    for (var i = 0; i < this.selections.length; i++) {
        var each = this.selections[i];
        var top = each.origin.x;
        var size = each.extent.x;
        sm.select(top + offset, top + size + offset);
    }
};

SelectionModel.prototype.isInCurrentSelectionRectangle = function(x, y) {
    var last = this.selections[this.selections.length - 1];
    if (last) {
        return this.getGrid().rectangles.rectangle.contains(last, x, y);
    }
    return false;
};

module.exports = SelectionModel;

},{}],6:[function(require,module,exports){
'use strict';

module.exports = {
    //CellClick: require('./CellClick.js');
};

},{}],7:[function(require,module,exports){
'use strict';

var mustache = require('mustache');

function Base() {
    Object.call(this);
}

Base.prototype = new Object();
Base.prototype.constructor = Base;
/**
 * @property {boolean} isEditing - am I currently editing
 * @instance
 */
Base.prototype.isEditing = false,

/**
 * @property {rectangle.point} editorPoint - the point that I am editing at right now
 * @instance
 */
Base.prototype.editorPoint = null,

/**
 * @property {boolean} checkEditorPositionFlag - if true, check that the editor is in the right location
 * @instance
 */
Base.prototype.checkEditorPositionFlag = false,

/**
 * @property {HTMLElement} input - my main input control
 * @instance
 */
Base.prototype.input = null,

/**
 * @property {string} alias - my look up name
 * @instance
 */
Base.prototype.alias = 'base',

/**
 * @property {fin-hypergrid} grid - my instance of hypergrid
 * @instance
 */
Base.prototype.grid = null,

/**
 * @property {type} initialValue - the value before editing
 * @instance
 */
Base.prototype.initialValue = null,


/**
 * @function
 * @instance
 * @description
 return the behavior (model)
 *
 * #### returns:[fin-hypergrid-behavior-base](module-behaviors_base.html)
 */
Base.prototype.getBehavior = function() {
    return this.grid.getBehavior();
};

/**
 * @function
 * @instance
 * @description
 This function is a callback from the fin-hypergrid.   It is called after each paint of the canvas.
 *
 */
Base.prototype.gridRenderedNotification = function() {
    this.checkEditor();
};

/**
 * @function
 * @instance
 * @description
scroll values have changed, we've been notified
 */
Base.prototype.scrollValueChangedNotification = function() {
    this.setCheckEditorPositionFlag();
};

/**
* @function
* @instance
* @description
turn on checkEditorPositionFlag boolean field
*/
Base.prototype.setCheckEditorPositionFlag = function() {
    this.checkEditorPositionFlag = true;
};

/**
* @function
* @instance
* @description
begin editing at location point
* @param {rectangle.point} point - the location to start editing at
*/
Base.prototype.beginEditAt = function(point) {
    this.setEditorPoint(point);
    var model = this.getBehavior();
    var value = model.getValue(point.x, point.y);
    if (value.constructor.name === 'Array') {
        value = value[1]; //it's a nested object
    }
    var proceed = this.grid.fireRequestCellEdit(point, value);
    if (!proceed) {
        //we were cancelled
        return;
    }
    this.initialValue = value;
    this.setEditorValue(value);
    this.isEditing = true;
    this.setCheckEditorPositionFlag();
    this.checkEditor();
};

/**
* @function
* @instance
* @description
put value into our editor
* @param {object} value - whatever value we want to edit
*/
Base.prototype.setEditorValue = function(value) {
    noop(value);
};

/**
* @function
* @instance
* @description
returns the point at which we are currently editing
* #### returns: rectangle.point
*/
Base.prototype.getEditorPoint = function() {
    return this.editorPoint;
};

/**
* @function
* @instance
* @description
set the current editor location
* @param {rectangle.point} point - the data location of the current editor
*/
Base.prototype.setEditorPoint = function(point) {
    this.editorPoint = point;
    this.modelPoint = this.getGrid().convertViewPointToDataPoint(point);
};

/**
* @function
* @instance
* @description
display the editor
*/
Base.prototype.showEditor = function() {};

/**
* @function
* @instance
* @description
hide the editor
*/
Base.prototype.hideEditor = function() {};

/**
* @function
* @instance
* @description
stop editing
*/
Base.prototype.stopEditing = function() {
    if (!this.isEditing) {
        return;
    }
    var proceed = this.getGrid().fireSyntheticEditorDataChangeEvent(this, this.initialValue, this.getEditorValue, this);
    if (!proceed) {
        return;
    }
    this.saveEditorValue();
    this.isEditing = false;
    this.hideEditor();
};

Base.prototype.cancelEditing = function() {
    if (!this.isEditing) {
        return;
    }
    this.isEditing = false;
    this.hideEditor();
};

/**
* @function
* @instance
* @description
save the new value into the behavior(model)
*/
Base.prototype.saveEditorValue = function() {
    var point = this.getEditorPoint();
    var value = this.getEditorValue();
    if (value === this.initialValue) {
        return; //data didn't change do nothing
    }
    var continued = this.getGrid().fireBeforeCellEdit(point, this.initialValue, value, this);
    if (!continued) {
        return;
    }
    this.getBehavior().setValue(point.x, point.y, value);
    this.getGrid().fireAfterCellEdit(point, this.initialValue, value, this);
};

/**
* @function
* @instance
* @description
return the current editor's value
* #### returns: Object
*/
Base.prototype.getEditorValue = function() {

};

/**
* @function
* @instance
* @description
request focus for my input control
*/
Base.prototype.takeFocus = function() {

};

/**
* @function
* @instance
* @description
move the editor to the current editor point
*/
Base.prototype._moveEditor = function() {
    var grid = this.getGrid();
    var editorPoint = this.getEditorPoint();
    var cellBounds = grid._getBoundsOfCell(editorPoint.x, editorPoint.y);

    //hack to accomodate bootstrap margin issues...
    var xOffset = grid.getBoundingClientRect().left - grid.canvas.getBoundingClientRect().left;
    cellBounds.x = cellBounds.x - xOffset;

    this.setBounds(cellBounds);
};

Base.prototype.moveEditor = function() {
    this._moveEditor();
    this.takeFocus();
};

/**
* @function
* @instance
* @description
set the bounds of my input control
* @param {rectangle} rectangle - the bounds to move to
*/
Base.prototype.setBounds = function(rectangle) {
    noop(rectangle);
};

/**
* @function
* @instance
* @description
check that the editor is in the correct location, and is showing/hidden appropriately
*/
Base.prototype.checkEditor = function() {
    if (!this.checkEditorPositionFlag) {
        return;
    } else {
        this.checkEditorPositionFlag = false;
    }
    if (!this.isEditing) {
        return;
    }
    var editorPoint = this.getEditorPoint();
    if (this.grid.isDataVisible(editorPoint.x, editorPoint.y)) {
        this.moveEditor();
        this.showEditor();
    } else {
        this.hideEditor();
    }
};

Base.prototype.getGrid = function() {
    return this.grid;
};

Base.prototype.template = function() {/*
*/
};

Base.prototype.getHTML = function() {
    var string = this.template.toString().split('\n');
    string.shift();
    string.length = string.length - 2;
    string = string.join('\n').trim();
    var html = mustache.render(string, this);
    return html;
};

Base.prototype.showDropdown = function(element) {
    var event;
    event = document.createEvent('MouseEvents');
    event.initMouseEvent('mousedown', true, true, window);
    element.dispatchEvent(event);
};

module.exports = Base;

},{"mustache":2}],8:[function(require,module,exports){
'use strict';
/**
 *
 * @module cell-editors\choice
 *
 */

var Simple = require('./Simple.js');

function Choice() {
    Simple.call(this);
}

Choice.prototype = new Simple();

Choice.prototype.constructor = Choice;
/**
 * @function
 * @instance
 * @description
 polymer lifecycle event
 */
Choice.prototype.ready = function() {
    var self = this;
    this.readyInit();
    this.input.onchange = function() {
        self.stopEditing();
    };
};
/**
 * @property {string} alias - my lookup alias
 * @instance
 */
Choice.prototype.alias = 'choice';

/**
 * @property {Array} items - the list of items to pick from
 * @instance
 */
Choice.prototype.items = ['a','b','c'];

Choice.prototype.template = function() {/*
    <form>
      <input list="fin-datalist" id="editor">
      <datalist id="fin-datalist">
        {{#items}}
            <option value="{{.}}">{{.}}</option>
        {{/items}}
      </datalist>
    </form>
*/
};
//no events are fired while the dropdown is open
//see http://jsfiddle.net/m4tndtu4/6/
Choice.prototype.showEditor = function() {
    var self = this;
    this.input.style.display = 'inline';
    setTimeout(function() {
        self.showDropdown(self.input);
    }, 50);
};

module.exports = Choice;

},{"./Simple.js":9}],9:[function(require,module,exports){
'use strict';
/**
 *
 * @module cell-editors\simple
 *
 */

var Base = require('./Base.js');

function Simple() {
    Base.call(this);
    this.editorPoint = {x:0, y:0};
}

Simple.prototype = new Base();

Simple.prototype.constructor = Simple;
/**
 * @property {string} alias - my lookup alias
 * @instance
 */
Simple.prototype.alias ='simple';

/**
 * @function
 * @instance
 * @description
 the function to override for initialization
 */
Simple.prototype.readyInit = function() {
    var self = this;
    this.input = this.shadowRoot.querySelector('#editor');
    this.input.addEventListener('keyup', function(e) {
        if (e && (e.keyCode === 13 || e.keyCode === 27 || e.keyCode === 8)) {
            e.preventDefault();
            if (e.keyCode === 8) {
                self.clearStopEditing();
            } else if (e.keyCode === 27) {
                self.cancelEditing();
            } else {
                self.stopEditing();
            }
            self.getGrid().repaint();
            self.getGrid().takeFocus();
        }
        self.getGrid().fireSyntheticEditorKeyUpEvent(self, e);
    });
    this.input.addEventListener('keydown', function(e) {
        self.getGrid().fireSyntheticEditorKeyDownEvent(self, e);
    });
    this.input.addEventListener('keypress', function(e) {
        console.log('keypress', e.keyCode);
        self.getGrid().fireSyntheticEditorKeyPressEvent(self, e);
    });
    // this.input.addEventListener('focusout', function() {
    //     self.stopEditing();
    // });
    // this.input.addEventListener('blur', function() {
    //     self.stopEditing();
    // });
    this.input.style.position = 'absolute';
    this.input.style.display = 'none';
    this.input.style.border = 'solid 2px black';
    this.input.style.outline = 0;
    this.input.style.padding = 0;
    this.input.style.zIndex = 1000;
};

/**
* @function
* @instance
* @description
return the current editor's value
* #### returns: Object
*/
Simple.prototype.getEditorValue = function() {
    var value = this.input.value;
    return value;
};

/**
* @function
* @instance
* @description
save the new value into the behavior(model)
*/
Simple.prototype.setEditorValue = function(value) {
    this.input.value = value + '';
};

Simple.prototype.clearStopEditing = function() {
    this.setEditorValue('');
    this.stopEditing();
};

Simple.prototype.cancelEditing = function() {
    if (!this.isEditing) {
        return;
    }
    this.input.value = null;
    this.isEditing = false;
    this.hideEditor();
};

/**
* @function
* @instance
* @description
display the editor
*/
Simple.prototype.showEditor = function() {
    this.input.style.display = 'inline';
};

/**
* @function
* @instance
* @description
hide the editor
*/
Simple.prototype.hideEditor = function() {
    this.input.style.display = 'none';
};

/**
* @function
* @instance
* @description
request focus for my input control
*/
Simple.prototype.takeFocus = function() {
    var self = this;
    setTimeout(function() {
        self.input.focus();
        self.selectAll();
    }, 300);
};

/**
* @function
* @instance
* @description
select everything
*/
Simple.prototype.selectAll = function() {

};

/**
* @function
* @instance
* @description
how much should I offset my bounds from 0,0
*/
Simple.prototype.originOffset = function() {
    return [0, 0];
};

/**
* @function
* @instance
* @description
set the bounds of my input control
* @param {rectangle} rectangle - the bounds to move to
*/
Simple.prototype.setBounds = function(cellBounds) {
    var originOffset = this.originOffset();
    var translation = 'translate(' + (cellBounds.x + originOffset[0]) + 'px,' + (cellBounds.y + originOffset[1]) + 'px)';

    this.input.style.webkitTransform = translation;
    this.input.style.MozTransform = translation;
    this.input.style.msTransform = translation;
    this.input.style.OTransform = translation;

    // this.input.style.left = cellBounds.x + originOffset[0] + 'px';
    // this.input.style.top = cellBounds.y + originOffset[1] + 'px';

    this.input.style.width = (cellBounds.width - 2) + 'px';
    this.input.style.height = (cellBounds.height - 2) + 'px';
    //var xOffset = this.grid.canvas.getBoundingClientRect().left;
};

module.exports = Simple;

},{"./Base.js":7}],10:[function(require,module,exports){
'use strict';

module.exports = {
    Base: require('./Base.js'),
    Simple: require('./Simple.js'),
    Choice: require('./Choice.js'),
};

},{"./Base.js":7,"./Choice.js":8,"./Simple.js":9}],11:[function(require,module,exports){
'use strict';

function Base() {

};

Base.prototype = {};

Base.prototype.next = null;

Base.prototype.grid = null;

Base.prototype.setGrid = function(newGrid) {
    this.grid = newGrid;
};

Base.prototype.getGrid = function() {
    return this.grid;
};

Base.prototype.getBehavior = function() {
    return this.getGrid().getBehavior();
};

Base.prototype.changed = function() {
    this.getBehavior().changed();
};

Base.prototype.getPrivateState = function() {
    return this.getGrid().getPrivateState();
};

Base.prototype.applyState = function() {

};

module.exports = Base;



},{}],12:[function(require,module,exports){
'use strict';

var Base = require('./Base.js');

var alphaFor = function(i) {
    // Name the column headers in A, .., AA, AB, AC, .., AZ format
    // quotient/remainder
    //var quo = Math.floor(col/27);
    var quo = Math.floor((i) / 26);
    var rem = (i) % 26;
    var code = '';
    if (quo > 0) {
        code += String.fromCharCode('A'.charCodeAt(0) + quo - 1);
    }
    code += String.fromCharCode('A'.charCodeAt(0) + rem);
    return code;
};
//var noop = function() {};
var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function Default() {
    Base.call(this);
};

Default.prototype = Object.create(Base.prototype);

Default.prototype.dataUpdates = {};

/**
* @function
* @instance
* @description
this is the most important behavior function it returns each data point at x,y coordinates
* #### returns: Object
 * @param {integer} x - the x coordinate
 * @param {integer} x - the y coordinate
*/
Default.prototype.getValue = function(x, y) {
    var override = this.dataUpdates['p_' + x + '_' + y];
    if (override) {
        return override;
    }
    if (x === 0) {
        if (y === 0) {
            return '';
        }
        return y;
    }
    if (y === 0) {
        return alphaFor(x - 1);
    }
    return (x - 1) + ', ' + a[(y - 1) % 26];
};

Default.prototype.setValue = function(x, y, value) {
    this.dataUpdates['p_' + x + '_' + y] = value;
};

Default.prototype.getColumnCount = function() {
    return 27;
};

Default.prototype.getRowCount = function() {
    //jeepers batman a quadrillion rows!
    return 53;
};

module.exports = Default;

},{"./Base.js":11}],13:[function(require,module,exports){
'use strict';

var Base = require('./Base.js');

var alphaFor = function(i) {
    // Name the column headers in A, .., AA, AB, AC, .., AZ format
    // quotient/remainder
    //var quo = Math.floor(col/27);
    var quo = Math.floor((i) / 26);
    var rem = (i) % 26;
    var code = '';
    if (quo > 0) {
        code += String.fromCharCode('A'.charCodeAt(0) + quo - 1);
    }
    code += String.fromCharCode('A'.charCodeAt(0) + rem);
    return code;
};
//var noop = function() {};
var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function InMemory() {
    Base.call(this);
};

InMemory.prototype = Object.create(Base.prototype);

InMemory.prototype.dataUpdates = {};

/**
* @function
* @instance
* @description
this is the most important behavior function it returns each data point at x,y coordinates
* #### returns: Object
 * @param {integer} x - the x coordinate
 * @param {integer} x - the y coordinate
*/
InMemory.prototype.getValue = function(x, y) {
    var override = this.dataUpdates['p_' + x + '_' + y];
    if (override) {
        return override;
    }
    if (x === 0) {
        if (y === 0) {
            return '';
        }
        return y;
    }
    if (y === 0) {
        return alphaFor(x - 1);
    }
    return (x - 1) + ', ' + a[(y - 1) % 26];
};

InMemory.prototype.setValue = function(x, y, value) {
    this.dataUpdates['p_' + x + '_' + y] = value;
};

InMemory.prototype.getColumnCount = function() {
    return 27;
};

InMemory.prototype.getRowCount = function() {
    //jeepers batman a quadrillion rows!
    return 53;
};

module.exports = InMemory;

},{"./Base.js":11}],14:[function(require,module,exports){
'use strict';

var Base = require('./Base.js');

var alphaFor = function(i) {
    // Name the column headers in A, .., AA, AB, AC, .., AZ format
    // quotient/remainder
    //var quo = Math.floor(col/27);
    var quo = Math.floor((i) / 26);
    var rem = (i) % 26;
    var code = '';
    if (quo > 0) {
        code += String.fromCharCode('A'.charCodeAt(0) + quo - 1);
    }
    code += String.fromCharCode('A'.charCodeAt(0) + rem);
    return code;
};
//var noop = function() {};
var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function JSON() {
    Base.call(this);
};

JSON.prototype = Object.create(Base.prototype);

var valueOrFunctionExecute = function(valueOrFunction) {
    var isFunction = (((typeof valueOrFunction)[0]) === 'f');
    var result = isFunction ? valueOrFunction() : valueOrFunction;
    return result;
};

var textMatchFilter = function(string) {
    return function(each) {
        each = valueOrFunctionExecute(each);
        return (each + '').toLowerCase().search(string.toLowerCase()) === 0;
    };
};

var nullDataSource = {
    isNullObject: function() {
        return true;
    },
    getFields: function() {
        return [];
    },
    getHeaders: function() {
        return [];
    },
    getColumnCount: function() {
        return 0;
    },
    getRowCount: function() {
        return 0;
    },
    getGrandTotals: function() {
        return [];
    },
    hasAggregates: function() {
        return false;
    },
    hasGroups: function() {
        return false;
    },
    getRow: function() {
        return null;
    }
};


//null object pattern for the source object
JSON.prototype.source = nullDataSource,
JSON.prototype.preglobalfilter = nullDataSource,
JSON.prototype.prefilter = nullDataSource,
JSON.prototype.presorter = nullDataSource,
JSON.prototype.analytics = nullDataSource,
JSON.prototype.postfilter = nullDataSource,
JSON.prototype.postsorter = nullDataSource,
JSON.prototype.topTotals = [],

JSON.prototype.hasAggregates = function() {
    return this.analytics.hasAggregates();
};
JSON.prototype.hasGroups = function() {
    return this.analytics.hasGroups();
};
JSON.prototype.getDataSource = function() {
    var source = this.analytics; //this.hasAggregates() ? this.analytics : this.presorter;
    return source;
};
JSON.prototype.getFilterSource = function() {
    var source = this.prefilter; //this.hasAggregates() ? this.postfilter : this.prefilter;
    return source;
};
JSON.prototype.getSortingSource = function() {
    var source = this.presorter; //this.hasAggregates() ? this.postsorter : this.presorter;
    return source;
};
JSON.prototype.getValue = function(x, y) {
    var hasHierarchyColumn = this.hasHierarchyColumn();
    var grid = this.getGrid();
    var headerRowCount = grid.getHeaderRowCount();
    var value;
    if (hasHierarchyColumn && x === -2) {
        x = 0;
    }
    if (y < headerRowCount) {
        value = this.getHeaderRowValue(x, y);
        return value;
    }
    if (hasHierarchyColumn) {
        y += 1;
    }
    value = this.getDataSource().getValue(x, y - headerRowCount);
    return value;
};
JSON.prototype.getHeaderRowValue = function(x, y) {
    if (y === undefined) {
        return this.getHeaders()[Math.max(x, 0)];
    }
    var grid = this.getGrid();
    var behavior = grid.getBehavior();
    var isFilterRow = grid.isShowFilterRow();
    var isHeaderRow = grid.isShowHeaderRow();
    var isBoth = isFilterRow && isHeaderRow;
    var topTotalsOffset = (isFilterRow ? 1 : 0) + (isHeaderRow ? 1 : 0);
    if (y >= topTotalsOffset) {
        return this.getTopTotals()[y - topTotalsOffset][x];
    }
    var filter = this.getFilter(x);
    var image = filter.length === 0 ? 'filter-off' : 'filter-on';
    if (isBoth) {
        if (y === 0) {
            image = this.getSortImageForColumn(x);
            return [null, this.getHeaders()[x], image];
        } else {
            return [null, filter, behavior.getImage(image)];
        }
    } else if (isFilterRow) {
        return [null, filter, behavior.getImage(image)];
    } else {
        image = this.getSortImageForColumn(x);
        return [null, this.getHeaders()[x], image];
    }
    return '';
};
JSON.prototype.setValue = function(x, y, value) {
    var hasHierarchyColumn = this.hasHierarchyColumn();
    var grid = this.getGrid();
    var headerRowCount = grid.getHeaderRowCount();
    if (hasHierarchyColumn) {
        if (x === -2) {
            return;
        } else {
            x += 1;
        }
    }
    if (y < headerRowCount) {
        this.setHeaderRowValue(x, y, value);
    } else if (hasHierarchyColumn) {
        y += 1;
    } else {
        this.getDataSource().setValue(x, y - headerRowCount, value);
    }
    this.changed();
};
JSON.prototype.setHeaderRowValue = function(x, y, value) {
    if (value === undefined) {
        return this._setHeader(x, y); // y is really the value
    }
    var grid = this.getGrid();
    var isFilterRow = grid.isShowFilterRow();
    var isHeaderRow = grid.isShowHeaderRow();
    var isBoth = isFilterRow && isHeaderRow;
    var topTotalsOffset = (isFilterRow ? 1 : 0) + (isHeaderRow ? 1 : 0);
    if (y >= topTotalsOffset) {
        this.getTopTotals()[y - topTotalsOffset][x] = value;
    } else if (x === -1) {
        return; // can't change the row numbers
    } else if (isBoth) {
        if (y === 0) {
            return this._setHeader(x, value);
        } else {
            this.setFilter(x, value);
        }
    } else if (isFilterRow) {
        this.setFilter(x, value);
    } else {
        return this._setHeader(x, value);
    }
    return '';
};
JSON.prototype.getColumnProperties = function(x) {
    //access directly because we want it ordered
    var column = this.getBehavior().allColumns[x];
    if (column) {
        return column.getProperties();
    }
    return undefined;
};
JSON.prototype.getFilter = function(x) {
    var columnProperties = this.getColumnProperties(x);
    if (!columnProperties) {
        return '';
    }
    var filter = columnProperties.filter || '';
    return filter;
};
JSON.prototype.setFilter = function(x, value) {
    var columnProperties = this.getColumnProperties(x);
    columnProperties.filter = value;
    this.applyAnalytics();
};
JSON.prototype.getColumnCount = function() {
    var count = this.analytics.getColumnCount();
    return count;
};
JSON.prototype.getRowCount = function() {
    var grid = this.getGrid();
    var count = this.getDataSource().getRowCount();
    count += grid.getHeaderRowCount();
    return count;
};
JSON.prototype.getHeaders = function() {
    var headers = this.analytics.getHeaders();
    return headers;
};
JSON.prototype.getDefaultHeaders = function() {};
JSON.prototype.setHeaders = function(headers) {
    this.getDataSource().setHeaders(headers);
};
JSON.prototype.setFields = function(fields) {
    this.getDataSource().setFields(fields);
};
JSON.prototype.getFields = function() {
    var fields = this.getDataSource().getFields();
    return fields;
};
JSON.prototype.setData = function(arrayOfUniformObjects) {
    if (!this.analytics.isNullObject) {
        this.analytics.dataSource.setData(arrayOfUniformObjects);
    } else {
        this.source = new fin.analytics.JSDataSource(arrayOfUniformObjects); /* jshint ignore:line */
        this.preglobalfilter = new fin.analytics.DataSourceGlobalFilter(this.source); /* jshint ignore:line */
        this.prefilter = new fin.analytics.DataSourceFilter(this.preglobalfilter); /* jshint ignore:line */
        this.presorter = new fin.analytics.DataSourceSorterComposite(this.prefilter); /* jshint ignore:line */
        this.analytics = new fin.analytics.DataSourceAggregator(this.presorter); /* jshint ignore:line */
    }
    this.applyAnalytics();
    //this.postfilter = new fin.analytics.DataSourceFilter(this.analytics); /* jshint ignore:line */
    //this.postsorter = new fin.analytics.DataSourceSorterComposite(this.postfilter); /* jshint ignore:line */
};
JSON.prototype.getTopTotals = function() {
    if (!this.hasAggregates()) {
        return this.topTotals;
    }
    return this.getDataSource().getGrandTotals();
};
JSON.prototype.setTopTotals = function(nestedArray) {
    this.topTotals = nestedArray;
};
JSON.prototype.setGroups = function(groups) {
    this.analytics.setGroupBys(groups);
    this.applyAnalytics();
    this.getGrid().fireSyntheticGroupsChangedEvent(this.getGroups());
};
JSON.prototype.getGroups = function() {
    var headers = this.getHeaders().slice(0);
    var fields = this.getFields().slice(0);
    var groupBys = this.analytics.groupBys;
    var groups = [];
    for (var i = 0; i < groupBys.length; i++) {
        var field = headers[groupBys[i]];
        groups.push({
            id: groupBys[i],
            label: field,
            field: fields
        });
    }
    return groups;
};

JSON.prototype.getAvailableGroups = function() {
    var headers = this.source.getHeaders().slice(0);
    var groupBys = this.analytics.groupBys;
    var groups = [];
    for (var i = 0; i < headers.length; i++) {
        if (groupBys.indexOf(i) === -1) {
            var field = headers[i];
            groups.push({
                id: i,
                label: field,
                field: field
            });
        }
    }
    return groups;
};

JSON.prototype.getVisibleColumns = function() {
    var items = this.getBehavior().columns;
    items = items.filter(function(each) {
        return each.label !== 'Tree';
    });
    return items;
};

JSON.prototype.getHiddenColumns = function() {
    var visible = this.getBehavior().columns;
    var all = this.getBehavior().allColumns;
    var hidden = [];
    for (var i = 0; i < all.length; i++) {
        if (visible.indexOf(all[i]) === -1) {
            hidden.push(all[i]);
        }
    }
    hidden.sort(function(a, b) {
        return a.label < b.label;
    });
    return hidden;
};

JSON.prototype.setAggregates = function(aggregations) {
    this.quietlySetAggregates(aggregations);
    this.applyAnalytics();
};
JSON.prototype.quietlySetAggregates = function(aggregations) {
    this.analytics.setAggregates(aggregations);
};
JSON.prototype.hasHierarchyColumn = function() {
    return this.hasAggregates() && this.hasGroups();
};
JSON.prototype.applyAnalytics = function() {
    this.applyFilters();
    this.applySorts();
    this.applyGroupBysAndAggregations();
};
JSON.prototype.applyGroupBysAndAggregations = function() {
    if (this.analytics.aggregates.length === 0) {
        this.quietlySetAggregates({});
    }
    this.analytics.apply();
};
JSON.prototype.applyFilters = function() {
    this.preglobalfilter.applyFilters();
    var colCount = this.getColumnCount();
    var filterSource = this.getFilterSource();
    var groupOffset = this.hasAggregates() ? 1 : 0;
    filterSource.clearFilters();
    for (var i = 0; i < colCount; i++) {
        var filterText = this.getFilter(i);
        if (filterText.length > 0) {
            filterSource.addFilter(i - groupOffset, textMatchFilter(filterText));
        }
    }
    filterSource.applyFilters();
};
JSON.prototype.toggleSort = function(index, keys) {
    this.incrementSortState(index, keys);
    this.applyAnalytics();
};
JSON.prototype.incrementSortState = function(colIndex, keys) {
    colIndex++; //hack to get around 0 index
    var state = this.getPrivateState();
    var hasCTRL = keys.indexOf('CTRL') > -1;
    state.sorts = state.sorts || [];
    var already = state.sorts.indexOf(colIndex);
    if (already === -1) {
        already = state.sorts.indexOf(-1 * colIndex);
    }
    if (already > -1) {
        if (state.sorts[already] > 0) {
            state.sorts[already] = -1 * state.sorts[already];
        } else {
            state.sorts.splice(already, 1);
        }
    } else if (hasCTRL || state.sorts.length === 0) {
        state.sorts.unshift(colIndex);
    } else {
        state.sorts.length = 0;
        state.sorts.unshift(colIndex);
    }
    if (state.sorts.length > 3) {
        state.sorts.length = 3;
    }
};
JSON.prototype.applySorts = function() {
    var sortingSource = this.getSortingSource();
    var sorts = this.getPrivateState().sorts;
    var groupOffset = this.hasAggregates() ? 1 : 0;
    if (!sorts || sorts.length === 0) {
        sortingSource.clearSorts();
    } else {
        for (var i = 0; i < sorts.length; i++) {
            var colIndex = Math.abs(sorts[i]) - 1;
            var type = sorts[i] < 0 ? -1 : 1;
            sortingSource.sortOn(colIndex - groupOffset, type);
        }
    }
    sortingSource.applySorts();
};
JSON.prototype.getSortImageForColumn = function(index) {
    index++;
    var up = true;
    var sorts = this.getPrivateState().sorts;
    if (!sorts) {
        return null;
    }
    var position = sorts.indexOf(index);
    if (position < 0) {
        position = sorts.indexOf(-1 * index);
        up = false;
    }
    if (position < 0) {
        return null;
    }
    position++;
    var name = (1 + sorts.length - position) + (up ? '-up' : '-down');
    return this.getBehavior().getImage(name);
};
JSON.prototype.cellClicked = function(cell, event) {
    if (!this.hasAggregates()) {
        return;
    }
    if (event.gridCell.x !== 0) {
        return; // this wasn't a click on the hierarchy column
    }
    var grid = this.getGrid();
    var headerRowCount = grid.getHeaderRowCount();
    var y = event.gridCell.y - headerRowCount;
    this.analytics.click(y);
};
JSON.prototype.getRow = function(y) {
    var grid = this.getGrid();
    var headerRowCount = grid.getHeaderRowCount();
    if (y < headerRowCount && !this.hasAggregates()) {
        var topTotals = this.getTopTotals();
        return topTotals[y - (headerRowCount - topTotals.length)];
    }
    return this.getDataSource().getRow(y - headerRowCount);
};
JSON.prototype.buildRow = function(y) {
    var colCount = this.getColumnCount();
    var fields = [].concat(this.getFields());
    var result = {};
    if (this.hasAggregates()) {
        result.tree = this.getValue(-2, y);
        fields.shift();
    }
    for (var i = 0; i < colCount; i++) {
        result[fields[i]] = this.getValue(i, y);
    }
    return result;
};
JSON.prototype.getComputedRow = function(y) {
    var rcf = this.getRowContextFunction([y]);
    var fields = this.getFields();
    var row = {};
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        row[field] = rcf(field)[0];
    }
    return row;
};

JSON.prototype.getValueByField = function(fieldName, y) {
    var index = this.getFields().indexOf(fieldName);
    if (this.hasAggregates()) {
        y += 1;
    }
    return this.getDataSource().getValue(index, y);
};

JSON.prototype.setGlobalFilter = function(string) {
    if (!string || string.length === 0) {
        this.preglobalfilter.clearFilters();
    } else {
        this.preglobalfilter.setFilter(textMatchFilter(string));
    }
    this.applyAnalytics();
};
JSON.prototype.getCellRenderer = function(config, x, y, untranslatedX, untranslatedY) {
    var renderer;
    var provider = this.getGrid().getCellProvider();

    config.x = x;
    config.y = y;
    config.untranslatedX = untranslatedX;
    config.untranslatedY = untranslatedY;

    renderer = provider.getCell(config);
    renderer.config = config;

    return renderer;
};
JSON.prototype.applyState = function() {
    this.applyAnalytics();
};

module.exports = JSON;

},{"./Base.js":11}],15:[function(require,module,exports){
'use strict';

module.exports = {
    Default: require('./Default.js'),
    InMemory: require('./InMemory.js'),
    JSON: require('./JSON.js')
};

},{"./Default.js":12,"./InMemory.js":13,"./JSON.js":14}],16:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

function Base() {

};

Base.prototype = {};

/**
 * @property {fin-hypergrid-feature-base} next - the next feature to be given a chance to handle incoming events
 * @instance
 */
Base.prototype.next = null;

/**
 * @property {fin-hypergrid-feature-base} detached - a temporary holding field for my next feature when I'm in a disconnected state
 * @instance
 */
Base.prototype.detached = null;

/**
 * @property {string} cursor - the cursor I want to be displayed
 * @instance
 */
Base.prototype.cursor = null;

/**
 * @property {rectangle.point} currentHoverCell - the cell location where the cursor is currently
 * @instance
 */
Base.prototype.currentHoverCell = null;

/**
* @function
* @instance
* @description
set my next field, or if it's populated delegate to the feature in my next field
* @param {fin-hypergrid-feature-base} nextFeature - this is how we build the chain of responsibility
*/
Base.prototype.setNext = function(nextFeature) {
    if (this.next) {
        this.next.setNext(nextFeature);
    } else {
        this.next = nextFeature;
        this.detached = nextFeature;
    }
};

/**
* @function
* @instance
* @description
disconnect my child
*/
Base.prototype.detachChain = function() {
    this.next = null;
};

/**
* @function
* @instance
* @description
reattach my child from the detached reference
*/
Base.prototype.attachChain = function() {
    this.next = this.detached;
};

/**
* @function
* @instance
* @description
 handle mouse move down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseMove = function(grid, event) {
    if (this.next) {
        this.next.handleMouseMove(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseExit = function(grid, event) {
    if (this.next) {
        this.next.handleMouseExit(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseEnter = function(grid, event) {
    if (this.next) {
        this.next.handleMouseEnter(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseDown = function(grid, event) {
    if (this.next) {
        this.next.handleMouseDown(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseUp = function(grid, event) {
    if (this.next) {
        this.next.handleMouseUp(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleKeyDown = function(grid, event) {
    if (this.next) {
        this.next.handleKeyDown(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleKeyUp = function(grid, event) {
    if (this.next) {
        this.next.handleKeyUp(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleWheelMoved = function(grid, event) {
    if (this.next) {
        this.next.handleWheelMoved(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleDoubleClick = function(grid, event) {
    if (this.next) {
        this.next.handleDoubleClick(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleHoldPulse = function(grid, event) {
    if (this.next) {
        this.next.handleHoldPulse(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleTap = function(grid, event) {
    if (this.next) {
        this.next.handleTap(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleMouseDrag = function(grid, event) {
    if (this.next) {
        this.next.handleMouseDrag(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.handleContextMenu = function(grid, event) {
    if (this.next) {
        this.next.handleContextMenu(grid, event);
    }
};

/**
* @function
* @instance
* @description
 toggle the column picker
*/

Base.prototype.toggleColumnPicker = function(grid) {
    if (this.next) {
        this.next.toggleColumnPicker(grid);
    }
};


/**
* @function
* @instance
* @description
 toggle the column picker
*/

Base.prototype.moveSingleSelect = function(grid, x, y) {
    if (this.next) {
        this.next.moveSingleSelect(grid, x, y);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.isFixedRow = function(grid, event) {
    var gridCell = event.viewPoint;
    var isFixed = gridCell.y < grid.getFixedRowCount();
    return isFixed;
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.isFirstFixedRow = function(grid, event) {
    var gridCell = event.viewPoint;
    var isFixed = gridCell.y < 1;
    return isFixed;
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.isFixedColumn = function(grid, event) {
    var gridCell = event.viewPoint;
    var isFixed = gridCell.x < grid.getFixedColumnCount();
    return isFixed;
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.isFirstFixedColumn = function(grid, event) {
    var gridCell = event.viewPoint;
    var edge = grid.isShowRowNumbers() ? 0 : 1;
    var isFixed = gridCell.x < edge;
    return isFixed;
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.isTopLeft = function(grid, event) {
    var isTopLeft = this.isFixedRow(grid, event) && this.isFixedColumn(grid, event);
    return isTopLeft;
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.setCursor = function(grid) {
    if (this.next) {
        this.next.setCursor(grid);
    }
    if (this.cursor) {
        grid.beCursor(this.cursor);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Base.prototype.initializeOn = function(grid) {
    if (this.next) {
        this.next.initializeOn(grid);
    }
};


module.exports = Base;

},{}],17:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function CellClick() {
    Base.call(this);
    this.alias = 'CellClick';
};

CellClick.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellClick.prototype.handleTap = function(grid, event) {
    var gridCell = event.gridCell;
    var behavior = grid.getBehavior();
    var headerRowCount = behavior.getHeaderRowCount();
    var headerColumnCount = behavior.getHeaderColumnCount();
    if ((gridCell.y >= headerRowCount) &&
        (gridCell.x >= headerColumnCount)) {
        grid.cellClicked(event);
    } else if (this.next) {
        this.next.handleTap(grid, event);
    }
};

module.exports = CellClick;

},{"./Base.js":16}],18:[function(require,module,exports){
'use strict';

/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function CellEditing() {
    Base.call(this);
    this.alias = 'CellEditing';
};

CellEditing.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellEditing.prototype.handleDoubleClick = function(grid, event) {
    var behavior = grid.getBehavior();
    var headerRowCount = behavior.getHeaderRowCount();
    var headerColumnCount = behavior.getHeaderColumnCount();
    var gridCell = event.gridCell;
    if (gridCell.x >= headerColumnCount && gridCell.y >= headerRowCount) {
        grid._activateEditor(event);
    } else if (this.next) {
        this.next.handleDoubleClick(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellEditing.prototype.handleHoldPulse = function(grid, event) {
    var behavior = grid.getBehavior();
    var headerRowCount = behavior.getHeaderRowCount();
    var headerColumnCount = behavior.getHeaderColumnCount();
    var gridCell = event.gridCell;
    if (gridCell.x >= headerColumnCount && gridCell.y >= headerRowCount) {
        grid._activateEditor(event);
    } else if (this.next) {
        this.next.handleHoldPulse(grid, event);
    }
};

module.exports = CellEditing;

},{"./Base.js":16}],19:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function CellSelection() {
    Base.call(this);
    this.alias = 'CellSelection';
};

CellSelection.prototype = Object.create(Base.prototype);

/**
 * @property {fin-rectangle.point} currentDrag - currentDrag is the pixel location of the mouse pointer during a drag operation
 * @instance
 */
CellSelection.prototype.currentDrag = null;

/**
 * @property {Object} lastDragCell - lastDragCell is the cell coordinates of the where the mouse pointer is during a drag operation
 * @instance
 */
CellSelection.prototype.lastDragCell = null;

/**
 * @property {Number} sbLastAuto - sbLastAuto is a millisecond value representing the previous time an autoscroll started
 * @instance
 */
CellSelection.prototype.sbLastAuto = 0;

/**
 * @property {Number} sbAutoStart - sbAutoStart is a millisecond value representing the time the current autoscroll started
 * @instance
 */
CellSelection.prototype.sbAutoStart = 0;

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleMouseUp = function(grid, event) {
    if (this.dragging) {
        this.dragging = false;
    }
    if (this.next) {
        this.next.handleMouseUp(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleMouseDown = function(grid, event) {


    var isRightClick = event.primitiveEvent.detail.isRightClick;
    var behavior = grid.getBehavior();
    var cell = event.gridCell;
    var viewCell = event.viewPoint;
    var dx = cell.x;
    var dy = cell.y;
    var headerRowCount = behavior.getHeaderRowCount();
    var headerColumnCount = behavior.getHeaderColumnCount();

    var isHeader = dy < headerRowCount || dx < headerColumnCount;

    if (!grid.isCellSelection() || isRightClick || isHeader) {
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    } else {

        var numFixedColumns = grid.getFixedColumnCount();
        var numFixedRows = grid.getFixedRowCount();

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.x < numFixedColumns) {
            dx = viewCell.x;
        }

        if (viewCell.y < numFixedRows) {
            dy = viewCell.y;
        }

        var dCell = grid.newPoint(dx, dy);

        var primEvent = event.primitiveEvent;
        var keys = primEvent.detail.keys;
        this.dragging = true;
        this.extendSelection(grid, dCell, keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleMouseDrag = function(grid, event) {
    var isRightClick = event.primitiveEvent.detail.isRightClick;

    if (!grid.isCellSelection() || isRightClick || !this.dragging) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    } else {

        var numFixedColumns = grid.getFixedColumnCount();
        var numFixedRows = grid.getFixedRowCount();

        var cell = event.gridCell;
        var viewCell = event.viewPoint;
        var dx = cell.x;
        var dy = cell.y;

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.x < numFixedColumns) {
            dx = viewCell.x;
        }

        if (viewCell.y < numFixedRows) {
            dy = viewCell.y;
        }

        var dCell = grid.newPoint(dx, dy);

        var primEvent = event.primitiveEvent;
        this.currentDrag = primEvent.detail.mouse;
        this.lastDragCell = dCell;

        this.checkDragScroll(grid, this.currentDrag);
        this.handleMouseDragCellSelection(grid, dCell, primEvent.detail.keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleKeyDown = function(grid, event) {
    var command = 'handle' + event.detail.char;
    if (this[command]) {
        this[command].call(this, grid, event.detail);
    }
};

/**
* @function
* @instance
* @description
Handle a mousedrag selection
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
CellSelection.prototype.handleMouseDragCellSelection = function(grid, gridCell /* ,keys */ ) {

    var behavior = grid.getBehavior();
    var headerRowCount = behavior.getHeaderRowCount();
    var headerColumnCount = behavior.getHeaderColumnCount();
    var x = gridCell.x;
    var y = gridCell.y;
    x = Math.max(headerColumnCount, x);
    y = Math.max(headerRowCount, y);



    var previousDragExtent = grid.getDragExtent();
    var mouseDown = grid.getMouseDown();

    //var scrollingNow = grid.isScrollingNow();

    var newX = x - mouseDown.x;
    var newY = y - mouseDown.y;

    if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
        return;
    }

    grid.clearMostRecentSelection();

    grid.select(mouseDown.x, mouseDown.y, newX, newY);
    grid.setDragExtent(grid.newPoint(newX, newY));

    grid.repaint();
};

/**
* @function
* @instance
* @description
this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
*/
CellSelection.prototype.checkDragScroll = function(grid, mouse) {
    if (!grid.resolveProperty('scrollingEnabled')) {
        return;
    }
    var b = grid.getDataBounds();
    var inside = b.contains(mouse);
    if (inside) {
        if (grid.isScrollingNow()) {
            grid.setScrollingNow(false);
        }
    } else if (!grid.isScrollingNow()) {
        grid.setScrollingNow(true);
        this.scrollDrag(grid);
    }
};

/**
* @function
* @instance
* @description
this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
CellSelection.prototype.scrollDrag = function(grid) {

    if (!grid.isScrollingNow()) {
        return;
    }

    var dragStartedInHeaderArea = grid.isMouseDownInHeaderArea();
    var lastDragCell = this.lastDragCell;
    var b = grid.getDataBounds();
    var xOffset = 0;
    var yOffset = 0;

    var numFixedColumns = grid.getFixedColumnCount();
    var numFixedRows = grid.getFixedRowCount();

    var dragEndInFixedAreaX = lastDragCell.x < numFixedColumns;
    var dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

    if (!dragStartedInHeaderArea) {
        if (this.currentDrag.x < b.origin.x) {
            xOffset = -1;
        }
        if (this.currentDrag.y < b.origin.y) {
            yOffset = -1;
        }
    }
    if (this.currentDrag.x > b.origin.x + b.extent.x) {
        xOffset = 1;
    }
    if (this.currentDrag.y > b.origin.y + b.extent.y) {
        yOffset = 1;
    }

    var dragCellOffsetX = xOffset;
    var dragCellOffsetY = yOffset;

    if (dragEndInFixedAreaX) {
        dragCellOffsetX = 0;
    }

    if (dragEndInFixedAreaY) {
        dragCellOffsetY = 0;
    }

    this.lastDragCell = lastDragCell.plusXY(dragCellOffsetX, dragCellOffsetY);
    grid.scrollBy(xOffset, yOffset);
    this.handleMouseDragCellSelection(grid, lastDragCell, []); // update the selection
    grid.repaint();
    setTimeout(this.scrollDrag.bind(this, grid), 25);
};

/**
* @function
* @instance
* @description
extend a selection or create one if there isnt yet
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} gridCell - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
CellSelection.prototype.extendSelection = function(grid, gridCell, keys) {
    var hasCTRL = keys.indexOf('CTRL') !== -1;
    var hasSHIFT = keys.indexOf('SHIFT') !== -1;
    // var scrollTop = grid.getVScrollValue();
    // var scrollLeft = grid.getHScrollValue();

    // var numFixedColumns = 0;//grid.getFixedColumnCount();
    // var numFixedRows = 0;//grid.getFixedRowCount();

    var mousePoint = grid.getMouseDown();
    var x = gridCell.x; // - numFixedColumns + scrollLeft;
    var y = gridCell.y; // - numFixedRows + scrollTop;

    //were outside of the grid do nothing
    if (x < 0 || y < 0) {
        return;
    }

    //we have repeated a click in the same spot deslect the value from last time
    if (x === mousePoint.x && y === mousePoint.y) {
        grid.clearMostRecentSelection();
        grid.popMouseDown();
        grid.repaint();
        return;
    }

    if (!hasCTRL && !hasSHIFT) {
        grid.clearSelections();
    }

    if (hasSHIFT) {
        grid.clearMostRecentSelection();
        grid.select(mousePoint.x, mousePoint.y, x - mousePoint.x, y - mousePoint.y);
        grid.setDragExtent(grid.newPoint(x - mousePoint.x, y - mousePoint.y));
    } else {
        grid.select(x, y, 0, 0);
        grid.setMouseDown(grid.newPoint(x, y));
        grid.setDragExtent(grid.newPoint(0, 0));
    }
    grid.repaint();
};


/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
CellSelection.prototype.handleDOWNSHIFT = function(grid) {
    this.moveShiftSelect(grid, 0, 1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleUPSHIFT = function(grid) {
    this.moveShiftSelect(grid, 0, -1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleLEFTSHIFT = function(grid) {
    this.moveShiftSelect(grid, -1, 0);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleRIGHTSHIFT = function(grid) {
    this.moveShiftSelect(grid, 1, 0);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleDOWN = function(grid, event) {
    //keep the browser viewport from auto scrolling on key event
    event.primitiveEvent.preventDefault();

    var count = this.getAutoScrollAcceleration();
    this.moveSingleSelect(grid, 0, count);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleUP = function(grid, event) {
    //keep the browser viewport from auto scrolling on key event
    event.primitiveEvent.preventDefault();

    var count = this.getAutoScrollAcceleration();
    this.moveSingleSelect(grid, 0, -count);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleLEFT = function(grid) {
    this.moveSingleSelect(grid, -1, 0);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
CellSelection.prototype.handleRIGHT = function(grid) {
    this.moveSingleSelect(grid, 1, 0);
};

/**
* @function
* @instance
* @description
If we are holding down the same navigation key, accelerate the increment we scroll
* #### returns: integer
*/
CellSelection.prototype.getAutoScrollAcceleration = function() {
    var count = 1;
    var elapsed = this.getAutoScrollDuration() / 2000;
    count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
    return count;
};

/**
* @function
* @instance
* @description
set the start time to right now when we initiate an auto scroll
*/
CellSelection.prototype.setAutoScrollStartTime = function() {
    this.sbAutoStart = Date.now();
};

/**
* @function
* @instance
* @description
update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
*/
CellSelection.prototype.pingAutoScroll = function() {
    var now = Date.now();
    if (now - this.sbLastAuto > 500) {
        this.setAutoScrollStartTime();
    }
    this.sbLastAuto = Date.now();
};

/**
* @function
* @instance
* @description
answer how long we have been auto scrolling
* #### returns: integer
*/
CellSelection.prototype.getAutoScrollDuration = function() {
    if (Date.now() - this.sbLastAuto > 500) {
        return 0;
    }
    return Date.now() - this.sbAutoStart;
};

/**
* @function
* @instance
* @description
Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
CellSelection.prototype.moveShiftSelect = function(grid, offsetX, offsetY) {

    var maxColumns = grid.getColumnCount() - 1;
    var maxRows = grid.getRowCount() - 1;

    var maxViewableColumns = grid.getVisibleColumns() - 1;
    var maxViewableRows = grid.getVisibleRows() - 1;

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxColumns = Math.min(maxColumns, maxViewableColumns);
        maxRows = Math.min(maxRows, maxViewableRows);
    }

    var origin = grid.getMouseDown();
    var extent = grid.getDragExtent();

    var newX = extent.x + offsetX;
    var newY = extent.y + offsetY;

    newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));
    newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

    grid.clearMostRecentSelection();
    grid.select(origin.x, origin.y, newX, newY);

    grid.setDragExtent(grid.newPoint(newX, newY));

    if (grid.insureModelColIsVisible(newX + origin.x, offsetX)) {
        this.pingAutoScroll();
    }
    if (grid.insureModelRowIsVisible(newY + origin.y, offsetY)) {
        this.pingAutoScroll();
    }

    grid.repaint();

};

/**
* @function
* @instance
* @description
Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
CellSelection.prototype.moveSingleSelect = function(grid, offsetX, offsetY) {

    var maxColumns = grid.getColumnCount() - 1;
    var maxRows = grid.getRowCount() - 1;

    var maxViewableColumns = grid.getVisibleColumnsCount() - 1;
    var maxViewableRows = grid.getVisibleRowsCount() - 1;

    var minRows = grid.getHeaderRowCount();
    var minCols = grid.getHeaderColumnCount();

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxColumns = Math.min(maxColumns, maxViewableColumns);
        maxRows = Math.min(maxRows, maxViewableRows);
    }

    var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());

    var newX = mouseCorner.x + offsetX;
    var newY = mouseCorner.y + offsetY;

    newX = Math.min(maxColumns, Math.max(minCols, newX));
    newY = Math.min(maxRows, Math.max(minRows, newY));

    grid.clearSelections();
    grid.select(newX, newY, 0, 0);
    grid.setMouseDown(grid.newPoint(newX, newY));
    grid.setDragExtent(grid.newPoint(0, 0));

    if (grid.insureModelColIsVisible(newX, offsetX)) {
        this.pingAutoScroll();
    }
    if (grid.insureModelRowIsVisible(newY, offsetY)) {
        this.pingAutoScroll();
    }

    grid.repaint();

};


module.exports = CellSelection;

},{"./Base.js":16}],20:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function ColumnAutosizing() {
    Base.call(this);
    this.alias = 'ColumnAutosizing';
};

ColumnAutosizing.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnAutosizing.prototype.handleDoubleClick = function(grid, event) {
    var headerRowCount = grid.getHeaderRowCount();
    //var headerColCount = grid.getHeaderColumnCount();
    var gridCell = event.gridCell;
    if (gridCell.y <= headerRowCount) {
        grid.autosizeColumn(gridCell.x);
    } else if (this.next) {
        this.next.handleDoubleClick(grid, event);
    }
}


module.exports = ColumnAutosizing;

},{"./Base.js":16}],21:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\column-moving
 * @description
 this feature is responsible for column drag and drop reordering
 this object is a mess and desperately needs a complete rewrite.....
 *
 */
var Base = require('./Base.js');

function ColumnMoving() {
    Base.call(this);
    this.alias = 'ColumnMoving';
};

ColumnMoving.prototype = Object.create(Base.prototype);

var noop = function() {};

var columnAnimationTime = 150;
var dragger;
var draggerCTX;
var floatColumn;
var floatColumnCTX;

/**
 * @property {Array} floaterAnimationQueue - queue up the animations that need to play so they are done synchronously
 * @instance
 */
ColumnMoving.prototype.floaterAnimationQueue = [];

/**
 * @property {boolean} columnDragAutoScrollingRight - am I currently auto scrolling right
 * @instance
 */
ColumnMoving.prototype.columnDragAutoScrollingRight = false;

/**
 * @property {boolean} columnDragAutoScrollingLeft  - am I currently auto scrolling left
 * @instance
 */
ColumnMoving.prototype.columnDragAutoScrollingLeft = false;

/**
 * @property {boolean} dragArmed - is the drag mechanism currently enabled(armed)
 * @instance
 */
ColumnMoving.prototype.dragArmed = false;

/**
 * @property {boolean} dragging - am I dragging right now
 * @instance
 */
ColumnMoving.prototype.dragging = false;

/**
 * @property {integer} dragCol - return the column index of the currently dragged column
 * @instance
 */
ColumnMoving.prototype.dragCol = -1;

/**
 * @property {integer} dragOffset - an offset to position the dragged item from the cursor
 * @instance
 */
ColumnMoving.prototype.dragOffset = 0;

/**
* @function
* @instance
* @description
give me an opportunity to initialize stuff on the grid
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnMoving.prototype.initializeOn = function(grid) {
    this.isFloatingNow = false;
    this.initializeAnimationSupport(grid);
    if (this.next) {
        this.next.initializeOn(grid);
    }
};

/**
* @function
* @instance
* @description
initialize animation support on the grid
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnMoving.prototype.initializeAnimationSupport = function(grid) {
    noop(grid);
    if (!dragger) {
        dragger = document.createElement('canvas');
        dragger.setAttribute('width', '0px');
        dragger.setAttribute('height', '0px');

        document.body.appendChild(dragger);
        draggerCTX = dragger.getContext('2d');
    }
    if (!floatColumn) {
        floatColumn = document.createElement('canvas');
        floatColumn.setAttribute('width', '0px');
        floatColumn.setAttribute('height', '0px');

        document.body.appendChild(floatColumn);
        floatColumnCTX = floatColumn.getContext('2d');
    }

};

ColumnMoving.prototype.getCanDragCursorName = function() {
    return '-webkit-grab';
};

ColumnMoving.prototype.getDraggingCursorName = function() {
    return '-webkit-grabbing';
};
/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnMoving.prototype.handleMouseDrag = function(grid, event) {

    var gridCell = event.gridCell;
    var x, y;

    var distance = Math.abs(event.primitiveEvent.detail.dragstart.x - event.primitiveEvent.detail.mouse.x);

    if (distance < 10) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
        return;
    }

    if (this.isHeaderRow(grid, event) && this.dragArmed && !this.dragging) {
        this.dragging = true;
        this.dragCol = gridCell.x;
        this.dragOffset = event.mousePoint.x;
        this.detachChain();
        x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
        y = event.primitiveEvent.detail.mouse.y;
        this.createDragColumn(grid, x, this.dragCol);
    } else if (this.next) {
        this.next.handleMouseDrag(grid, event);
    }
    if (this.dragging) {
        x = event.primitiveEvent.detail.mouse.x - this.dragOffset;
        y = event.primitiveEvent.detail.mouse.y;
        this.dragColumn(grid, x);
    }
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnMoving.prototype.handleMouseDown = function(grid, event) {
    if (grid.getBehavior().isColumnReorderable()) {
        if (this.isHeaderRow(grid, event) && event.gridCell.x !== -1) {
            this.dragArmed = true;
            this.cursor = this.getDraggingCursorName();
            grid.clearSelections();
        }
    }
    if (this.next) {
        this.next.handleMouseDown(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnMoving.prototype.handleMouseUp = function(grid, event) {
    //var col = event.gridCell.x;
    if (this.dragging) {
        this.cursor = null;
        //delay here to give other events a chance to be dropped
        var self = this;
        this.endDragColumn(grid);
        setTimeout(function() {
            self.attachChain();
        }, 200);
    }
    this.dragCol = -1;
    this.dragging = false;
    this.dragArmed = false;
    this.cursor = null;
    grid.repaint();

    if (this.next) {
        this.next.handleMouseUp(grid, event);
    }

};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnMoving.prototype.handleMouseMove = function(grid, event) {

    if (!this.dragging && event.mousePoint.y < 5 && event.viewPoint.y === 0) {
        this.cursor = this.getCanDragCursorName();
    } else {
        this.cursor = null;
    }

    if (this.next) {
        this.next.handleMouseMove(grid, event);
    }

    if (this.isHeaderRow(grid, event) && this.dragging) {
        this.cursor = this.getDraggingCursorName(); //move';
    }
};

/**
* @function
* @instance
* @description
this is the main event handler that manages the dragging of the column
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {boolean} draggedToTheRight - are we moving to the right
*/
ColumnMoving.prototype.floatColumnTo = function(grid, draggedToTheRight) {
    this.floatingNow = true;

    var renderer = grid.getRenderer();
    var colEdges = renderer.getColumnEdges();
    //var behavior = grid.getBehavior();
    var scrollLeft = grid.getHScrollValue();
    var floaterIndex = grid.renderOverridesCache.floater.columnIndex;
    var draggerIndex = grid.renderOverridesCache.dragger.columnIndex;
    var hdpiratio = grid.renderOverridesCache.dragger.hdpiratio;

    var draggerStartX;
    var floaterStartX;
    var fixedColumnCount = grid.getFixedColumnCount();
    var draggerWidth = grid.getColumnWidth(draggerIndex);
    var floaterWidth = grid.getColumnWidth(floaterIndex);

    var max = grid.getVisibleColumnsCount();

    var doffset = 0;
    var foffset = 0;

    if (draggerIndex >= fixedColumnCount) {
        doffset = scrollLeft;
    }
    if (floaterIndex >= fixedColumnCount) {
        foffset = scrollLeft;
    }

    if (draggedToTheRight) {
        draggerStartX = colEdges[Math.min(max, draggerIndex - doffset)];
        floaterStartX = colEdges[Math.min(max, floaterIndex - foffset)];

        grid.renderOverridesCache.dragger.startX = (draggerStartX + floaterWidth) * hdpiratio;
        grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;

    } else {
        floaterStartX = colEdges[Math.min(max, floaterIndex - foffset)];
        draggerStartX = floaterStartX + draggerWidth;

        grid.renderOverridesCache.dragger.startX = floaterStartX * hdpiratio;
        grid.renderOverridesCache.floater.startX = draggerStartX * hdpiratio;
    }
    grid.swapColumns(draggerIndex, floaterIndex);
    grid.renderOverridesCache.dragger.columnIndex = floaterIndex;
    grid.renderOverridesCache.floater.columnIndex = draggerIndex;


    this.floaterAnimationQueue.unshift(this.doColumnMoveAnimation(grid, floaterStartX, draggerStartX));

    this.doFloaterAnimation(grid);

};

/**
* @function
* @instance
* @description
manifest the column drag and drop animation
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} floaterStartX - the x start coordinate of the column underneath that floats behind the dragged column
* @param {integer} draggerStartX - the x start coordinate of the dragged column
*/
ColumnMoving.prototype.doColumnMoveAnimation = function(grid, floaterStartX, draggerStartX) {
    var self = this;
    return function() {
        var d = floatColumn;
        d.style.display = 'inline';
        self.setCrossBrowserProperty(d, 'transform', 'translate(' + floaterStartX + 'px, ' + 0 + 'px)');

        //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';
        //d.style.webkit-webkit-Transform = 'translate(' + floaterStartX + 'px, ' + 0 + 'px)';

        window.requestAnimationFrame(function() {
            self.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + columnAnimationTime + 'ms ease');
            self.setCrossBrowserProperty(d, 'transform', 'translate(' + draggerStartX + 'px, ' + -2 + 'px)');
        });
        grid.repaint();
        //need to change this to key frames

        setTimeout(function() {
            self.setCrossBrowserProperty(d, 'transition', '');
            grid.renderOverridesCache.floater = null;
            grid.repaint();
            self.doFloaterAnimation(grid);
            requestAnimationFrame(function() {
                d.style.display = 'none';
                self.isFloatingNow = false;
            });
        }, columnAnimationTime + 50);
    };
};

/**
* @function
* @instance
* @description
manifest the floater animation
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnMoving.prototype.doFloaterAnimation = function(grid) {
    if (this.floaterAnimationQueue.length === 0) {
        this.floatingNow = false;
        grid.repaint();
        return;
    }
    var animation = this.floaterAnimationQueue.pop();
    animation();
};

/**
* @function
* @instance
* @description
create the float column at columnIndex underneath the dragged column
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} columnIndex - the index of the column that will be floating
*/
ColumnMoving.prototype.createFloatColumn = function(grid, columnIndex) {

    var fixedColumnCount = grid.getFixedColumnCount();
    var scrollLeft = grid.getHScrollValue();

    if (columnIndex < fixedColumnCount) {
        scrollLeft = 0;
    }

    var renderer = grid.getRenderer();
    var columnEdges = renderer.getColumnEdges();

    var columnWidth = grid.getColumnWidth(columnIndex);
    var colHeight = grid.clientHeight;
    var d = floatColumn;
    var style = d.style;
    var location = grid.getBoundingClientRect();

    style.top = (location.top - 2) + 'px';
    style.left = location.left + 'px';
    style.position = 'fixed';

    var hdpiRatio = grid.getHiDPI(floatColumnCTX);

    d.setAttribute('width', Math.round(columnWidth * hdpiRatio) + 'px');
    d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');
    style.boxShadow = '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';
    style.width = columnWidth + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
    style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';
    style.borderTop = '1px solid ' + renderer.resolveProperty('lineColor');
    style.backgroundColor = renderer.resolveProperty('backgroundColor');

    var startX = columnEdges[columnIndex - scrollLeft];
    startX = startX * hdpiRatio;

    floatColumnCTX.scale(hdpiRatio, hdpiRatio);

    grid.renderOverridesCache.floater = {
        columnIndex: columnIndex,
        ctx: floatColumnCTX,
        startX: startX,
        width: columnWidth,
        height: colHeight,
        hdpiratio: hdpiRatio
    };

    style.zIndex = '4';
    this.setCrossBrowserProperty(d, 'transform', 'translate(' + startX + 'px, ' + -2 + 'px)');
    style.cursor = this.getDraggingCursorName();
    grid.repaint();
};

/**
* @function
* @instance
* @description
utility function for setting cross browser css properties
* @param {HTMLElement} element - descripton
* @param {string} property - the property
* @param {string} value - the value to assign
*/
ColumnMoving.prototype.setCrossBrowserProperty = function(element, property, value) {
    var uProperty = property[0].toUpperCase() + property.substr(1);
    this.setProp(element, 'webkit' + uProperty, value);
    this.setProp(element, 'Moz' + uProperty, value);
    this.setProp(element, 'ms' + uProperty, value);
    this.setProp(element, 'O' + uProperty, value);
    this.setProp(element, property, value);
};

/**
* @function
* @instance
* @description
utility function for setting properties on HTMLElements
* @param {HTMLElement} element - descripton
* @param {string} property - the property
* @param {string} value - the value to assign
*/
ColumnMoving.prototype.setProp = function(element, property, value) {
    if (property in element.style) {
        element.style[property] = value;
    }
};

/**
* @function
* @instance
* @description
create the dragged column at columnIndex above the floated column
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} x - the start position
* @param {integer} columnIndex - the index of the column that will be floating
*/
ColumnMoving.prototype.createDragColumn = function(grid, x, columnIndex) {

    var fixedColumnCount = grid.getFixedColumnCount();
    var scrollLeft = grid.getHScrollValue();

    if (columnIndex < fixedColumnCount) {
        scrollLeft = 0;
    }

    var renderer = grid.getRenderer();
    var columnEdges = renderer.getColumnEdges();
    var hdpiRatio = grid.getHiDPI(draggerCTX);
    var columnWidth = grid.getColumnWidth(columnIndex);
    var colHeight = grid.clientHeight;
    var d = dragger;




    var location = grid.getBoundingClientRect();
    var style = d.style;

    style.top = location.top + 'px';
    style.left = location.left + 'px';
    style.position = 'fixed';
    style.opacity = 0.85;
    style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
    //style.zIndex = 100;
    style.borderTop = '1px solid ' + renderer.resolveProperty('lineColor');
    style.backgroundColor = grid.renderer.resolveProperty('backgroundColor');

    d.setAttribute('width', Math.round(columnWidth * hdpiRatio) + 'px');
    d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');

    style.width = columnWidth + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
    style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';

    var startX = columnEdges[columnIndex - scrollLeft];
    startX = startX * hdpiRatio;

    draggerCTX.scale(hdpiRatio, hdpiRatio);

    grid.renderOverridesCache.dragger = {
        columnIndex: columnIndex,
        ctx: draggerCTX,
        startX: startX,
        width: columnWidth,
        height: colHeight,
        hdpiratio: hdpiRatio
    };

    this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, -5px)');
    style.zIndex = '5';
    style.cursor = this.getDraggingCursorName();
    grid.repaint();
};

/**
* @function
* @instance
* @description
this function is the main dragging logic
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} x - the start position
*/
ColumnMoving.prototype.dragColumn = function(grid, x) {

    //TODO: this function is overly complex, refactor this in to something more reasonable
    var self = this;
    //var renderer = grid.getRenderer();
    //var columnEdges = renderer.getColumnEdges();

    var autoScrollingNow = this.columnDragAutoScrollingRight || this.columnDragAutoScrollingLeft;

    var hdpiRatio = grid.getHiDPI(draggerCTX);

    var dragColumnIndex = grid.renderOverridesCache.dragger.columnIndex;
    var columnWidth = grid.renderOverridesCache.dragger.width;

    var minX = 0; //grid.getFixedColumnsWidth();
    var maxX = grid.renderer.getFinalVisableColumnBoundry() - columnWidth;
    x = Math.min(x, maxX + 15);
    x = Math.max(minX - 15, x);

    //am I at my lower bound
    var atMin = x < minX && dragColumnIndex !== 0;

    //am I at my upper bound
    var atMax = x > maxX;

    var d = dragger;

    this.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + 0 + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');

    this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, ' + -10 + 'px)');
    requestAnimationFrame(function() {
        d.style.display = 'inline';
    });

    var overCol = grid.renderer.getColumnFromPixelX(x + (d.width / 2 / hdpiRatio));

    if (atMin) {
        overCol = 0;
    }

    if (atMax) {
        overCol = grid.getColumnCount() - 1;
    }

    var doAFloat = dragColumnIndex > overCol;
    doAFloat = doAFloat || (overCol - dragColumnIndex >= 1);

    if (doAFloat && !atMax && !autoScrollingNow) {
        var draggedToTheRight = dragColumnIndex < overCol;
        // if (draggedToTheRight) {
        //     overCol = overCol - 1;
        // }
        if (this.isFloatingNow) {
            return;
        }

        this.isFloatingNow = true;
        this.createFloatColumn(grid, overCol);
        this.floatColumnTo(grid, draggedToTheRight);
    } else {

        if (x < minX - 10) {
            this.checkAutoScrollToLeft(grid, x);
        }
        if (x > minX - 10) {
            this.columnDragAutoScrollingLeft = false;
        }
        //lets check for autoscroll to right if were up against it
        if (atMax || x > maxX + 10) {
            this.checkAutoScrollToRight(grid, x);
            return;
        }
        if (x < maxX + 10) {
            this.columnDragAutoScrollingRight = false;
        }
    }
};

/**
* @function
* @instance
* @description
autoscroll to the right if necessary
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} x - the start position
*/
ColumnMoving.prototype.checkAutoScrollToRight = function(grid, x) {
    if (this.columnDragAutoScrollingRight) {
        return;
    }
    this.columnDragAutoScrollingRight = true;
    this._checkAutoScrollToRight(grid, x);
};

ColumnMoving.prototype._checkAutoScrollToRight = function(grid, x) {
    if (!this.columnDragAutoScrollingRight) {
        return;
    }
    var scrollLeft = grid.getHScrollValue();
    if (!grid.dragging || scrollLeft > (grid.sbHScrollConfig.rangeStop - 2)) {
        return;
    }
    var draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
    grid.scrollBy(1, 0);
    var newIndex = draggedIndex + 1;
    console.log(newIndex, draggedIndex);
    grid.swapColumns(newIndex, draggedIndex);
    grid.renderOverridesCache.dragger.columnIndex = newIndex;

    setTimeout(this._checkAutoScrollToRight.bind(this, grid, x), 250);
};

/**
* @function
* @instance
* @description
autoscroll to the left if necessary
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} x - the start position
*/
ColumnMoving.prototype.checkAutoScrollToLeft = function(grid, x) {
    if (this.columnDragAutoScrollingLeft) {
        return;
    }
    this.columnDragAutoScrollingLeft = true;
    this._checkAutoScrollToLeft(grid, x);
};

ColumnMoving.prototype._checkAutoScrollToLeft = function(grid, x) {
    if (!this.columnDragAutoScrollingLeft) {
        return;
    }

    var scrollLeft = grid.getHScrollValue();
    if (!grid.dragging || scrollLeft < 1) {
        return;
    }
    var draggedIndex = grid.renderOverridesCache.dragger.columnIndex;
    grid.swapColumns(draggedIndex + scrollLeft, draggedIndex + scrollLeft - 1);
    grid.scrollBy(-1, 0);
    setTimeout(this._checkAutoScrollToLeft.bind(this, grid, x), 250);
};



/**
* @function
* @instance
* @description
a column drag has completed, update data and cleanup
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnMoving.prototype.endDragColumn = function(grid) {

    var fixedColumnCount = grid.getFixedColumnCount();
    var scrollLeft = grid.getHScrollValue();

    var columnIndex = grid.renderOverridesCache.dragger.columnIndex;

    if (columnIndex < fixedColumnCount) {
        scrollLeft = 0;
    }

    var renderer = grid.getRenderer();
    var columnEdges = renderer.getColumnEdges();
    var self = this;
    var startX = columnEdges[columnIndex - scrollLeft];
    var d = dragger;

    self.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + columnAnimationTime + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');
    self.setCrossBrowserProperty(d, 'transform', 'translate(' + startX + 'px, ' + -1 + 'px)');
    d.style.boxShadow = '0px 0px 0px #888888';

    setTimeout(function() {
        grid.renderOverridesCache.dragger = null;
        grid.repaint();
        requestAnimationFrame(function() {
            d.style.display = 'none';
            grid.endDragColumnNotification();
        });
    }, columnAnimationTime + 50);

};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnMoving.prototype.isHeaderRow = function(grid, event) {
    var gridCell = event.viewPoint;
    var isFixed = gridCell.y === 0;
    return isFixed;
};

module.exports = ColumnMoving;

},{"./Base.js":16}],22:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function ColumnResizing() {
    Base.call(this);
    this.alias = 'ColumnResizing';
};

ColumnResizing.prototype = Object.create(Base.prototype);

/**
 * @property {integer} dragIndex - the index of the column wall were currently dragging
 * @instance
 */
ColumnResizing.prototype.dragIndex = -2;

/**
 * @property {integer} dragStart - the pixel location of the where the drag was initiated
 * @instance
 */
ColumnResizing.prototype.dragStart = -1;

/**
 * @property {integer} dragIndexStartingSize - the starting width/height of the row/column we are dragging
 * @instance
 */
ColumnResizing.prototype.dragIndexStartingSize = -1;

/**
* @function
* @instance
* @description
get the mouse x,y coordinate
* #### returns: integer
* @param {MouseEvent} event - the mouse event to query
*/
ColumnResizing.prototype.getMouseValue = function(event) {
    return event.primitiveEvent.detail.mouse.x;
};

/**
* @function
* @instance
* @description
get the grid cell x,y coordinate
* #### returns: integer
* @param {rectangle.point} gridCell - [rectangle.point](https://github.com/stevewirts/fin-rectangle)
*/
ColumnResizing.prototype.getGridCellValue = function(gridCell) {
    return gridCell.y;
};

/**
* @function
* @instance
* @description
return the grids x,y scroll value
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnResizing.prototype.getScrollValue = function(grid) {
    return grid.getHScrollValue();
};

/**
* @function
* @instance
* @description
return the width/height of the row/column of interest
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
*/
ColumnResizing.prototype.getAreaSize = function(grid, index) {
    return grid.getColumnWidth(index);
};

/**
* @function
* @instance
* @description
set the width/height of the row/column at index
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
* @param {integer} value - the width/height to set to
*/
ColumnResizing.prototype.setAreaSize = function(grid, index, value) {
    grid.setColumnWidth(index, value);
};

/**
* @function
* @instance
* @description
return the recently rendered area's width/height
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
*/
ColumnResizing.prototype.getPreviousAbsoluteSize = function(grid, index) {
    return grid.getRenderedWidth(index);
};

/**
* @function
* @instance
* @description
returns the index of which divider I'm over
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnResizing.prototype.overAreaDivider = function(grid, event) {
    return grid.overColumnDivider(event);
};

/**
* @function
* @instance
* @description
am I over the column/row area
* #### returns: boolean
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnResizing.prototype.isFirstFixedOtherArea = function(grid, event) {
    return this.isFirstFixedRow(grid, event);
};

/**
* @function
* @instance
* @description
return the cursor name
* #### returns: string
*/
ColumnResizing.prototype.getCursorName = function() {
    return 'col-resize';
};

/**
* @function
* @instance
* @description
handle this event
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnResizing.prototype.handleMouseDrag = function(grid, event) {
    if (this.dragIndex > -2) {
        //var fixedAreaCount = this.getFixedAreaCount(grid);
        //var offset = this.getFixedAreaSize(grid, fixedAreaCount + areaIndex);
        var mouse = this.getMouseValue(event);
        var scrollValue = this.getScrollValue(grid);
        if (this.dragIndex < this.getFixedAreaCount(grid)) {
            scrollValue = 0;
        }
        var previous = this.getPreviousAbsoluteSize(grid, this.dragIndex - scrollValue);
        var distance = mouse - previous;
        this.setAreaSize(grid, this.dragIndex, distance);
    } else if (this.next) {
        this.next.handleMouseDrag(grid, event);
    }
};

/**
* @function
* @instance
* @description
get the width/height of a specific row/column
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} areaIndex - the row/column index of interest
*/
ColumnResizing.prototype.getSize = function(grid, areaIndex) {
    return this.getAreaSize(grid, areaIndex);
};

/**
* @function
* @instance
* @description
return the fixed area rows/columns count
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnResizing.prototype.getOtherFixedAreaCount = function(grid) {
    return grid.getFixedRowCount();
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnResizing.prototype.handleMouseDown = function(grid, event) {
    var isEnabled = this.isEnabled(grid);
    var overArea = this.overAreaDivider(grid, event);
    if (isEnabled && overArea > -1 && this.isFirstFixedOtherArea(grid, event)) {
        var scrollValue = this.getScrollValue(grid);
        if (overArea < this.getFixedAreaCount(grid)) {
            scrollValue = 0;
        }
        this.dragIndex = overArea - 1 + scrollValue;
        this.dragStart = this.getMouseValue(event);
        this.dragIndexStartingSize = 0;
        this.detachChain();
    } else if (this.next) {
        this.next.handleMouseDown(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnResizing.prototype.handleMouseUp = function(grid, event) {
    var isEnabled = this.isEnabled(grid);
    if (isEnabled && this.dragIndex > -2) {
        this.cursor = null;
        this.dragIndex = -2;

        event.primitiveEvent.stopPropagation();
        //delay here to give other events a chance to be dropped
        var self = this;
        grid.synchronizeScrollingBoundries();
        setTimeout(function() {
            self.attachChain();
        }, 200);
    } else if (this.next) {
        this.next.handleMouseUp(grid, event);
    }
};

/**
* @function
* @instance
* @description
handle this event down the feature chain of responsibility
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnResizing.prototype.handleMouseMove = function(grid, event) {
    if (this.dragIndex > -2) {
        return;
    }
    this.cursor = null;
    if (this.next) {
        this.next.handleMouseMove(grid, event);
    }
    this.checkForAreaResizeCursorChange(grid, event);
};

/**
* @function
* @instance
* @description
fill this in
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnResizing.prototype.checkForAreaResizeCursorChange = function(grid, event) {
    var isEnabled = this.isEnabled(grid);
    if (isEnabled && this.overAreaDivider(grid, event) > -1 && this.isFirstFixedOtherArea(grid, event)) {
        this.cursor = this.getCursorName();
    } else {
        this.cursor = null;
    }

};

ColumnResizing.prototype.getFixedAreaCount = function(grid) {
    var count = grid.getFixedColumnCount() + (grid.isShowRowNumbers() ? 1 : 0) + (grid.hasHierarchyColumn() ? 1 : 0);
    return count;
};

ColumnResizing.prototype.handleDoubleClick = function(grid, event) {
    var isEnabled = this.isEnabled(grid);
    var hasCursor = this.overAreaDivider(grid, event) > -1; //this.cursor !== null;
    var headerRowCount = grid.getHeaderRowCount();
    //var headerColCount = grid.getHeaderColumnCount();
    var gridCell = event.gridCell;
    if (isEnabled && hasCursor && (gridCell.y <= headerRowCount)) {
        grid.autosizeColumn(gridCell.x - 1);
    } else if (this.next) {
        this.next.handleDoubleClick(grid, event);
    }
};
ColumnResizing.prototype.isEnabled = function( /* grid */ ) {
    return true;
};


module.exports = ColumnResizing;

},{"./Base.js":16}],23:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function ColumnSelection() {
    Base.call(this);
    this.alias = 'ColumnSelection';
};

ColumnSelection.prototype = Object.create(Base.prototype);

/**
 * @property {fin-rectangle.point} currentDrag - currentDrag is the pixel location of the mouse pointer during a drag operation
 * @instance
 */
ColumnSelection.prototype.currentDrag = null,

/**
 * @property {Object} lastDragCell - lastDragCell is the cell coordinates of the where the mouse pointer is during a drag operation
 * @instance
 */
ColumnSelection.prototype.lastDragCell = null,

/**
 * @property {Number} sbLastAuto - sbLastAuto is a millisecond value representing the previous time an autoscroll started
 * @instance
 */
ColumnSelection.prototype.sbLastAuto = 0,

/**
 * @property {Number} sbAutoStart - sbAutoStart is a millisecond value representing the time the current autoscroll started
 * @instance
 */
ColumnSelection.prototype.sbAutoStart = 0,

/**
 * @property {fin-rectangle.point} rectangles - the util rectangles factory [fin-rectangles](https://github.com/stevewirts/fin-rectangle)
 * @instance
 */
ColumnSelection.prototype.rectangles = {};

/**
 * @function
 * @instance
 * @description
 the function to override for initialization
 */
ColumnSelection.prototype.createdInit = function() {

    this.rectangles = document.createElement('fin-rectangle');

};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleMouseUp = function(grid, event) {
    if (this.dragging) {
        this.dragging = false;
    }
    if (this.next) {
        this.next.handleMouseUp(grid, event);
        return;
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleMouseDown = function(grid, event) {

    if ((!grid.isColumnSelection() || event.mousePoint.y < 5) && this.next) {
        this.next.handleMouseDown(grid, event);
        return;
    }

    var isRightClick = event.primitiveEvent.detail.isRightClick;
    var cell = event.gridCell;
    var viewCell = event.viewPoint;
    var dx = cell.x;
    var dy = cell.y;

    var isHeader = grid.isShowHeaderRow() && dy === 0 && dx !== -1;

    if (isRightClick || !isHeader) {
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    } else {

        var numFixedColumns = grid.getFixedColumnCount();

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.x < numFixedColumns) {
            dx = viewCell.x;
        }

        var dCell = grid.rectangles.point.create(dx, 0);

        var primEvent = event.primitiveEvent;
        var keys = primEvent.detail.keys;
        this.dragging = true;
        this.extendSelection(grid, dCell, keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleMouseDrag = function(grid, event) {

    if ((!grid.isColumnSelection() || this.isColumnDragging(grid)) && this.next) {
        this.next.handleMouseDrag(grid, event);
        return;
    }

    var isRightClick = event.primitiveEvent.detail.isRightClick;

    if (isRightClick || !this.dragging) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    } else {

        var numFixedColumns = grid.getFixedColumnCount();

        var cell = event.gridCell;
        var viewCell = event.viewPoint;
        var dx = cell.x;
        var dy = cell.y;

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.x < numFixedColumns) {
            dx = viewCell.x;
        }

        var dCell = grid.rectangles.point.create(dx, dy);

        var primEvent = event.primitiveEvent;
        this.currentDrag = primEvent.detail.mouse;
        this.lastDragCell = dCell;

        this.checkDragScroll(grid, this.currentDrag);
        this.handleMouseDragCellSelection(grid, dCell, primEvent.detail.keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleKeyDown = function(grid, event) {
    if (grid.getLastSelectionType() !== 'column') {
        if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
        return;
    }
    var command = 'handle' + event.detail.char;
    if (this[command]) {
        this[command].call(this, grid, event.detail);
    }
};

/**
* @function
* @instance
* @description
Handle a mousedrag selection
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
ColumnSelection.prototype.handleMouseDragCellSelection = function(grid, gridCell /* ,keys */ ) {

    //var behavior = grid.getBehavior();
    var x = gridCell.x;
    //            var previousDragExtent = grid.getDragExtent();
    var mouseDown = grid.getMouseDown();

    var newX = x - mouseDown.x;
    //var newY = y - mouseDown.y;

    // if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
    //     return;
    // }

    grid.clearMostRecentColumnSelection();

    grid.selectColumn(mouseDown.x, x);
    grid.setDragExtent(this.rectangles.point.create(newX, 0));

    grid.repaint();
};

/**
* @function
* @instance
* @description
this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
*/
ColumnSelection.prototype.checkDragScroll = function(grid, mouse) {
    if (!grid.resolveProperty('scrollingEnabled')) {
        return;
    }
    var b = grid.getDataBounds();
    var inside = b.contains(mouse);
    if (inside) {
        if (grid.isScrollingNow()) {
            grid.setScrollingNow(false);
        }
    } else if (!grid.isScrollingNow()) {
        grid.setScrollingNow(true);
        this.scrollDrag(grid);
    }
};

/**
* @function
* @instance
* @description
this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnSelection.prototype.scrollDrag = function(grid) {

    if (!grid.isScrollingNow()) {
        return;
    }

    var lastDragCell = this.lastDragCell;
    var b = grid.getDataBounds();
    var xOffset = 0;
    var yOffset = 0;

    var numFixedColumns = grid.getFixedColumnCount();
    var numFixedRows = grid.getFixedRowCount();

    var dragEndInFixedAreaX = lastDragCell.x < numFixedColumns;
    var dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

    if (this.currentDrag.x < b.origin.x) {
        xOffset = -1;
    }

    if (this.currentDrag.x > b.origin.x + b.extent.x) {
        xOffset = 1;
    }

    var dragCellOffsetX = xOffset;
    var dragCellOffsetY = yOffset;

    if (dragEndInFixedAreaX) {
        dragCellOffsetX = 0;
    }

    if (dragEndInFixedAreaY) {
        dragCellOffsetY = 0;
    }

    this.lastDragCell = lastDragCell.plusXY(dragCellOffsetX, dragCellOffsetY);
    grid.scrollBy(xOffset, yOffset);
    this.handleMouseDragCellSelection(grid, lastDragCell, []); // update the selection
    grid.repaint();
    setTimeout(this.scrollDrag.bind(this, grid), 25);
};

/**
* @function
* @instance
* @description
extend a selection or create one if there isnt yet
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} gridCell - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
ColumnSelection.prototype.extendSelection = function(grid, gridCell, keys) {
    grid.stopEditing();
    //var hasCTRL = keys.indexOf('CTRL') !== -1;
    var hasSHIFT = keys.indexOf('SHIFT') !== -1;

    // var scrollTop = grid.getVScrollValue();
    // var scrollLeft = grid.getHScrollValue();

    // var numFixedColumns = 0;//grid.getFixedColumnCount();
    // var numFixedRows = 0;//grid.getFixedRowCount();

    var mousePoint = grid.getMouseDown();
    var x = gridCell.x; // - numFixedColumns + scrollLeft;
    var y = gridCell.y; // - numFixedRows + scrollTop;

    //were outside of the grid do nothing
    if (x < 0 || y < 0) {
        return;
    }

    //we have repeated a click in the same spot deslect the value from last time
    // if (mousePoint && x === mousePoint.x && y === mousePoint.y) {
    //     grid.clearSelections();
    //     grid.popMouseDown();
    //     grid.repaint();
    //     return;
    // }

    // if (!hasCTRL && !hasSHIFT) {
    //     grid.clearSelections();
    // }

    if (hasSHIFT) {
        grid.clearMostRecentColumnSelection();
        grid.selectColumn(x, mousePoint.x);
        grid.setDragExtent(this.rectangles.point.create(x - mousePoint.x, 0));
    } else {
        grid.toggleSelectColumn(x, keys);
        grid.setMouseDown(this.rectangles.point.create(x, y));
        grid.setDragExtent(this.rectangles.point.create(0, 0));
    }
    grid.repaint();
};


/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
ColumnSelection.prototype.handleDOWNSHIFT = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleUPSHIFT = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleLEFTSHIFT = function(grid) {
    this.moveShiftSelect(grid, -1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleRIGHTSHIFT = function(grid) {
    this.moveShiftSelect(grid, 1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleDOWN = function( /* grid */ ) {

    // var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());
    // var maxRows = grid.getRowCount() - 1;

    // var newX = mouseCorner.x;
    // var newY = grid.getHeaderRowCount() + grid.getVScrollValue();

    // newY = Math.min(maxRows, newY);

    // grid.clearSelections();
    // grid.select(newX, newY, 0, 0);
    // grid.setMouseDown(this.rectangles.point.create(newX, newY));
    // grid.setDragExtent(this.rectangles.point.create(0, 0));

    // grid.repaint();
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleUP = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleLEFT = function(grid) {
    this.moveSingleSelect(grid, -1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ColumnSelection.prototype.handleRIGHT = function(grid) {
    this.moveSingleSelect(grid, 1);
};

/**
* @function
* @instance
* @description
If we are holding down the same navigation key, accelerate the increment we scroll
* #### returns: integer
*/
ColumnSelection.prototype.getAutoScrollAcceleration = function() {
    var count = 1;
    var elapsed = this.getAutoScrollDuration() / 2000;
    count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
    return count;
};

/**
* @function
* @instance
* @description
set the start time to right now when we initiate an auto scroll
*/
ColumnSelection.prototype.setAutoScrollStartTime = function() {
    this.sbAutoStart = Date.now();
};

/**
* @function
* @instance
* @description
update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
*/
ColumnSelection.prototype.pingAutoScroll = function() {
    var now = Date.now();
    if (now - this.sbLastAuto > 500) {
        this.setAutoScrollStartTime();
    }
    this.sbLastAuto = Date.now();
};

/**
* @function
* @instance
* @description
answer how long we have been auto scrolling
* #### returns: integer
*/
ColumnSelection.prototype.getAutoScrollDuration = function() {
    if (Date.now() - this.sbLastAuto > 500) {
        return 0;
    }
    return Date.now() - this.sbAutoStart;
};

/**
* @function
* @instance
* @description
Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
ColumnSelection.prototype.moveShiftSelect = function(grid, offsetX) {

    var maxColumns = grid.getColumnCount() - 1;

    var maxViewableColumns = grid.getVisibleColumns() - 1;

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxColumns = Math.min(maxColumns, maxViewableColumns);
    }

    var origin = grid.getMouseDown();
    var extent = grid.getDragExtent();

    var newX = extent.x + offsetX;
    //var newY = grid.getRowCount();

    newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));

    grid.clearMostRecentColumnSelection();
    grid.selectColumn(origin.x, origin.x + newX);

    grid.setDragExtent(this.rectangles.point.create(newX, 0));

    if (grid.insureModelColIsVisible(newX + origin.x, offsetX)) {
        this.pingAutoScroll();
    }

    grid.repaint();

};

/**
* @function
* @instance
* @description
Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
ColumnSelection.prototype.moveSingleSelect = function(grid, offsetX) {

    var maxColumns = grid.getColumnCount() - 1;

    var maxViewableColumns = grid.getVisibleColumnsCount() - 1;

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxColumns = Math.min(maxColumns, maxViewableColumns);
    }

    var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());

    var newX = mouseCorner.x + offsetX;
    //var newY = grid.getRowCount();

    newX = Math.min(maxColumns, Math.max(0, newX));

    grid.clearSelections();
    grid.selectColumn(newX);
    grid.setMouseDown(this.rectangles.point.create(newX, 0));
    grid.setDragExtent(this.rectangles.point.create(0, 0));

    if (grid.insureModelColIsVisible(newX, offsetX)) {
        this.pingAutoScroll();
    }

    grid.repaint();

};

ColumnSelection.prototype.isColumnDragging = function(grid) {
    var dragger = grid.lookupFeature('ColumnMoving');
    if (!dragger) {
        return false;
    }
    var isActivated = dragger.dragging && !this.dragging;
    return isActivated;
};

module.exports = ColumnSelection;

},{"./Base.js":16}],24:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function ColumnSorting() {
    Base.call(this);
    this.alias = 'ColumnSorting';
};

ColumnSorting.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/

ColumnSorting.prototype.handleDoubleClick = function(grid, event) {
    var gridCell = event.gridCell;
    if (grid.isShowHeaderRow() && gridCell.y === 0 && gridCell.x !== -1) {
        var keys = event.primitiveEvent.detail.keys;
        grid.toggleSort(gridCell.x, keys);
    } else if (this.next) {
        this.next.handleDoubleClick(grid, event);
    }
};

/**
* @function
* @instance
* @description
handle this event down the feature chain of responsibility
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnSorting.prototype.handleMouseMove = function(grid, event) {
    var y = event.gridCell.y;
    if (this.isFixedRow(grid, event) && y < 1) {
        this.cursor = 'pointer';
    } else {
        this.cursor = null;
    }
    if (this.next) {
        this.next.handleMouseMove(grid, event);
    }
};


module.exports = ColumnSorting;

},{"./Base.js":16}],25:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function Filters() {
    Base.call(this);
    this.alias = 'Filters';
};

Filters.prototype = Object.create(Base.prototype);

Filters.prototype.handleTap = function(grid, event) {
    var gridCell = event.gridCell;
    if (grid.isFilterRow(gridCell.y) && gridCell.x !== -1) {
        grid.filterClicked(event);
    } else if (this.next) {
        this.next.handleTap(grid, event);
    }
};

module.exports = Filters;

},{"./Base.js":16}],26:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\key-paging
 *
 */
var Base = require('./Base.js');

var commands = {
    PAGEDOWN: function(grid) {
        grid.pageDown();
    },
    PAGEUP: function(grid) {
        grid.pageUp();
    },
    PAGELEFT: function(grid) {
        grid.pageLeft();
    },
    PAGERIGHT: function(grid) {
        grid.pageRight();
    }
};

/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function KeyPaging() {
    Base.call(this);
    this.alias = 'KeyPaging';
};

KeyPaging.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
KeyPaging.prototype.handleKeyDown = function(grid, event) {
    var detail = event.detail.char;
    var func = commands[detail];
    if (func) {
        func(grid);
    } else if (this.next) {
        this.next.handleKeyDown(grid, event);
    }
}

module.exports = KeyPaging;

},{"./Base.js":16}],27:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function OnHover() {
    Base.call(this);
    this.alias = 'OnHover';
};

OnHover.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
OnHover.prototype.handleMouseMove = function(grid, event) {
    var currentHoverCell = grid.getHoverCell();
    if (!event.gridCell.equals(currentHoverCell)) {
        if (currentHoverCell) {
            this.handleMouseExit(grid, currentHoverCell);
        }
        this.handleMouseEnter(grid, event);
        grid.setHoverCell(event.gridCell);
    } else {
        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    }
};

module.exports = OnHover;

},{"./Base.js":16}],28:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\overlay
 *
 */
var Base = require('./Base.js');
var noop = function() {};
var ANIMATION_TIME = 200;


function Overlay() {
    Base.call(this);
    this.alias = 'Overlay';
};

Overlay.prototype = Object.create(Base.prototype);

/**
 * @property {boolean} openEditor - is the editor open
 * @instance
 */
Overlay.prototype.openEditor = false,

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
Overlay.prototype.handleKeyUp = function(grid, event) {
    var key = event.detail.char.toLowerCase();
    var keys = grid.resolveProperty('editorActivationKeys');
    if (keys.indexOf(key) > -1) {
        this.toggleColumnPicker(grid);
    }
};

/**
* @function
* @instance
* @description
toggle the column picker on/off
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.toggleColumnPicker = function(grid) {
    if (this.isColumnPickerOpen(grid)) {
        this.closeColumnPicker(grid);
    } else {
        this.openColumnPicker(grid);
    }
};

/**
* @function
* @instance
* @description
returns true if the column picker is open
* #### returns: boolean
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.isColumnPickerOpen = function(grid) {
    noop(grid);
    return this.overlay.style.display !== 'none';
};

/**
* @function
* @instance
* @description
open the column picker
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.openColumnPicker = function(grid) {
    if (this.isColumnPickerOpen()) {
        return;
    }
    this.openEditor = true;
    if (grid.getBehavior().openEditor(this.overlay) === false) {
        return;
    }

    var self = this;
    this.overlay.style.backgroundColor = grid.resolveProperty('backgroundColor');

    this.overlay.style.top = '0%';
    this.overlay.style.right = '0%';
    this.overlay.style.bottom = '0%';
    this.overlay.style.left = '0%';

    this.overlay.style.marginTop = '15px';
    this.overlay.style.marginRight = '35px';
    this.overlay.style.marginBottom = '35px';
    this.overlay.style.marginLeft = '15px';

    self.overlay.style.display = '';


    if (!this._closer) {
        this._closer = function(e) {
            var key = self.getCharFor(grid, e.keyCode).toLowerCase();
            var keys = grid.resolveProperty('editorActivationKeys');
            if (keys.indexOf(key) > -1 || e.keyCode === 27) {
                e.preventDefault();
                self.closeColumnPicker(grid);
            }
        };
    }

    grid.setFocusable(false);
    requestAnimationFrame(function() {
        self.overlay.style.opacity = 0.95;
        document.addEventListener('keydown', self._closer, false);
    });
    setTimeout(function() {
        self.overlay.focus();
    }, 100);
};

/**
* @function
* @instance
* @description
close the column picker
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.closeColumnPicker = function(grid) {
    grid.setFocusable(true);

    if (!this.isColumnPickerOpen()) {
        return;
    }
    if (this.openEditor) {
        this.openEditor = false;
    } else {
        return;
    }
    if (grid.getBehavior().closeEditor(this.overlay) === false) {
        return;
    }

    document.removeEventListener('keydown', this._closer, false);

    var self = this;

    requestAnimationFrame(function() {
        self.overlay.style.opacity = 0;
    });

    setTimeout(function() {
        self.overlay.innerHTML = '';
        self.overlay.style.display = 'none';
        grid.takeFocus();
    }, ANIMATION_TIME);
};

/**
* @function
* @instance
* @description
initialize myself into the grid
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.initializeOn = function(grid) {
    this.initializeOverlaySurface(grid);
    if (this.next) {
        this.next.initializeOn(grid);
    }
};

/**
* @function
* @instance
* @description
initialize the overlay surface into the grid
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
Overlay.prototype.initializeOverlaySurface = function(grid) {
    this.overlay = document.createElement('div');
    this.overlay.setAttribute('tabindex', 0);
    this.overlay.style.outline = 'none';
    this.overlay.style.boxShadow = '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)';
    this.overlay.style.position = 'absolute';
    this.overlay.style.display = 'none';
    this.overlay.style.transition = 'opacity ' + ANIMATION_TIME + 'ms ease-in';
    this.overlay.style.opacity = 0;
    grid.appendChild(this.overlay);
    //document.body.appendChild(this.overlay);
};

/**
* @function
* @instance
* @description
get a human readable description of the key pressed from it's integer representation
* #### returns: string
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} integer - the integer we want the char for
*/
Overlay.prototype.getCharFor = function(grid, integer) {
    var charMap = grid.getCanvas().getCharMap();
    return charMap[integer][0];
};


module.exports = Overlay;

},{"./Base.js":16}],29:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var ColumnResizing = require('./ColumnResizing.js');

function RowResizing() {
    ColumnResizing.call(this);
    this.alias = 'RowResizing';
};

RowResizing.prototype = Object.create(ColumnResizing.prototype);

/**
 * @property {integer} dragArea - the index of the row/column we are dragging
 * @instance
 */
RowResizing.prototype.dragArea = -1,

/**
 * @property {integer} dragStart - the pixel location of the where the drag was initiated
 * @instance
 */
RowResizing.prototype.dragStart = -1,

/**
 * @property {integer} dragAreaStartingSize - the starting width/height of the row/column we are dragging
 * @instance
 */
RowResizing.prototype.dragAreaStartingSize = -1,

/**
* @function
* @instance
* @description
get the mouse x,y coordinate
* #### returns: integer
* @param {MouseEvent} event - the mouse event to query
*/
RowResizing.prototype.getMouseValue = function(event) {
    return event.primitiveEvent.detail.mouse.y;
};

/**
* @function
* @instance
* @description
get the grid cell x,y coordinate
* #### returns: integer
* @param {rectangle.point} gridCell - [rectangle.point](https://github.com/stevewirts/fin-rectangle)
*/
RowResizing.prototype.getGridCellValue = function(gridCell) {
    return gridCell.x;
};

/**
* @function
* @instance
* @description
return the grids x,y scroll value
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
RowResizing.prototype.getScrollValue = function(grid) {
    return grid.getVScrollValue();
};

/**
* @function
* @instance
* @description
return the width/height of the row/column of interest
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
*/
RowResizing.prototype.getAreaSize = function(grid, index) {
    return grid.getRowHeight(index);
};

/**
* @function
* @instance
* @description
set the width/height of the row/column at index
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
* @param {integer} value - the width/height to set to
*/
RowResizing.prototype.setAreaSize = function(grid, index, value) {
    grid.setRowHeight(index, value);
};

/**
* @function
* @instance
* @description
returns the index of which divider I'm over
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
RowResizing.prototype.overAreaDivider = function(grid, event) {
    return grid.overRowDivider(event);
};

/**
* @function
* @instance
* @description
am I over the column/row area
* #### returns: boolean
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
RowResizing.prototype.isFirstFixedOtherArea = function(grid, event) {
    return this.isFirstFixedColumn(grid, event);
};

/**
* @function
* @instance
* @description
return the cursor name
* #### returns: string
*/
RowResizing.prototype.getCursorName = function() {
    return 'row-resize';
};

/**
* @function
* @instance
* @description
return the recently rendered area's width/height
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {integer} index - the row/column index of interest
*/
RowResizing.prototype.getPreviousAbsoluteSize = function(grid, index) {
    return grid.getRenderedHeight(index);
};

/**
* @function
* @instance
* @description
return the fixed area rows/columns count
* #### returns: integer
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
RowResizing.prototype.getOtherFixedAreaCount = function(grid) {
    return grid.getFixedColumnCount();
};

RowResizing.prototype.getFixedAreaCount = function(grid) {
    return grid.getFixedRowCount() + grid.getHeaderRowCount();
};

RowResizing.prototype.isEnabled = function(grid) {
    return grid.isRowResizeable();
};

module.exports = RowResizing;

},{"./ColumnResizing.js":22}],30:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function RowSelection() {
    Base.call(this);
    this.alias = 'RowSelection';
};

RowSelection.prototype = Object.create(Base.prototype);

/**
 * @property {fin-rectangle.point} currentDrag - currentDrag is the pixel location of the mouse pointer during a drag operation
 * @instance
 */
RowSelection.prototype.currentDrag = null,

/**
 * @property {Object} lastDragCell - lastDragCell is the cell coordinates of the where the mouse pointer is during a drag operation
 * @instance
 */
RowSelection.prototype.lastDragCell = null,

/**
 * @property {Number} sbLastAuto - sbLastAuto is a millisecond value representing the previous time an autoscroll started
 * @instance
 */
RowSelection.prototype.sbLastAuto = 0,

/**
 * @property {Number} sbAutoStart - sbAutoStart is a millisecond value representing the time the current autoscroll started
 * @instance
 */
RowSelection.prototype.sbAutoStart = 0,

RowSelection.prototype.dragArmed = false,

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleMouseUp = function(grid, event) {
    if (this.dragArmed) {
        this.dragArmed = false;
        grid.fireSyntheticRowSelectionChangedEvent();
    } else if (this.dragging) {
        this.dragging = false;
        grid.fireSyntheticRowSelectionChangedEvent();
    } else if (this.next) {
        this.next.handleMouseUp(grid, event);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleMouseDown = function(grid, event) {

    var isRightClick = event.primitiveEvent.detail.isRightClick;
    var cell = event.gridCell;
    var viewCell = event.viewPoint;
    var dx = cell.x;
    var dy = cell.y;


    var isHeader = grid.isShowRowNumbers() && dx < 0;

    if (!grid.isRowSelection() || isRightClick || !isHeader) {
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    } else {

        var numFixedRows = grid.getFixedRowCount();

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.y < numFixedRows) {
            dy = viewCell.y;
        }

        var dCell = grid.newPoint(0, dy);

        var primEvent = event.primitiveEvent;
        var keys = primEvent.detail.keys;
        this.dragArmed = true;
        this.extendSelection(grid, dCell, keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleMouseDrag = function(grid, event) {
    var isRightClick = event.primitiveEvent.detail.isRightClick;

    if (!this.dragArmed || !grid.isRowSelection() || isRightClick) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    } else {
        this.dragging = true;
        var numFixedRows = grid.getFixedRowCount();

        var cell = event.gridCell;
        var viewCell = event.viewPoint;
        //var dx = cell.x;
        var dy = cell.y;

        //if we are in the fixed area do not apply the scroll values
        //check both x and y values independently
        if (viewCell.y < numFixedRows) {
            dy = viewCell.y;
        }

        var dCell = grid.newPoint(0, dy);

        var primEvent = event.primitiveEvent;
        this.currentDrag = primEvent.detail.mouse;
        this.lastDragCell = dCell;

        this.checkDragScroll(grid, this.currentDrag);
        this.handleMouseDragCellSelection(grid, dCell, primEvent.detail.keys);
    }
};

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleKeyDown = function(grid, event) {
    if (grid.getLastSelectionType() !== 'row') {
        if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
        return;
    }
    var command = 'handle' + event.detail.char;
    if (this[command]) {
        this[command].call(this, grid, event.detail);
    }
};

/**
* @function
* @instance
* @description
Handle a mousedrag selection
* #### returns: type
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
RowSelection.prototype.handleMouseDragCellSelection = function(grid, gridCell /* ,keys */ ) {

    //var behavior = grid.getBehavior();
    var y = gridCell.y;
    //            var previousDragExtent = grid.getDragExtent();
    var mouseDown = grid.getMouseDown();

    var newY = y - mouseDown.y;
    //var newY = y - mouseDown.y;

    // if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
    //     return;
    // }

    grid.clearMostRecentRowSelection();

    grid.selectRow(mouseDown.y, y);
    grid.setDragExtent(grid.newPoint(0, newY));

    grid.repaint();
};

/**
* @function
* @instance
* @description
this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} mouse - the event details
*/
RowSelection.prototype.checkDragScroll = function(grid, mouse) {
    if (!grid.resolveProperty('scrollingEnabled')) {
        return;
    }
    var b = grid.getDataBounds();
    var inside = b.contains(mouse);
    if (inside) {
        if (grid.isScrollingNow()) {
            grid.setScrollingNow(false);
        }
    } else if (!grid.isScrollingNow()) {
        grid.setScrollingNow(true);
        this.scrollDrag(grid);
    }
};

/**
* @function
* @instance
* @description
this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
RowSelection.prototype.scrollDrag = function(grid) {

    if (!grid.isScrollingNow()) {
        return;
    }

    var lastDragCell = this.lastDragCell;
    var b = grid.getDataBounds();
    var xOffset = 0;
    var yOffset = 0;

    var numFixedColumns = grid.getFixedColumnCount();
    var numFixedRows = grid.getFixedRowCount();

    var dragEndInFixedAreaX = lastDragCell.x < numFixedColumns;
    var dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

    if (this.currentDrag.y < b.origin.y) {
        yOffset = -1;
    }

    if (this.currentDrag.y > b.origin.y + b.extent.y) {
        yOffset = 1;
    }

    var dragCellOffsetX = xOffset;
    var dragCellOffsetY = yOffset;

    if (dragEndInFixedAreaX) {
        dragCellOffsetX = 0;
    }

    if (dragEndInFixedAreaY) {
        dragCellOffsetY = 0;
    }

    this.lastDragCell = lastDragCell.plusXY(dragCellOffsetX, dragCellOffsetY);
    grid.scrollBy(xOffset, yOffset);
    this.handleMouseDragCellSelection(grid, lastDragCell, []); // update the selection
    grid.repaint();
    setTimeout(this.scrollDrag.bind(this, grid), 25);
};

/**
* @function
* @instance
* @description
extend a selection or create one if there isnt yet
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} gridCell - the event details
* @param {Array} keys - array of the keys that are currently pressed down
*/
RowSelection.prototype.extendSelection = function(grid, gridCell, keys) {
    grid.stopEditing();
    //var hasCTRL = keys.indexOf('CTRL') !== -1;
    var hasSHIFT = keys.indexOf('SHIFT') !== -1;

    var mousePoint = grid.getMouseDown();
    var x = gridCell.x; // - numFixedColumns + scrollLeft;
    var y = gridCell.y; // - numFixedRows + scrollTop;

    //were outside of the grid do nothing
    if (x < 0 || y < 0) {
        return;
    }

    if (hasSHIFT) {
        grid.clearMostRecentRowSelection();
        grid.selectRow(y, mousePoint.y);
        grid.setDragExtent(grid.newPoint(0, y - mousePoint.y));
    } else {
        grid.toggleSelectRow(y, keys);
        grid.setMouseDown(grid.newPoint(x, y));
        grid.setDragExtent(grid.newPoint(0, 0));
    }
    grid.repaint();
};


/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
*/
RowSelection.prototype.handleDOWNSHIFT = function(grid) {
    this.moveShiftSelect(grid, 1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleUPSHIFT = function(grid) {
    this.moveShiftSelect(grid, -1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleLEFTSHIFT = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleRIGHTSHIFT = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleDOWN = function(grid) {
    this.moveSingleSelect(grid, 1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleUP = function(grid) {
    this.moveSingleSelect(grid, -1);
};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleLEFT = function( /* grid */ ) {};

/**
* @function
* @instance
* @description
 handle this event
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
RowSelection.prototype.handleRIGHT = function(grid) {

    var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());
    var maxColumns = grid.getColumnCount() - 1;

    var newX = grid.getHeaderColumnCount() + grid.getHScrollValue();
    var newY = mouseCorner.y;

    newX = Math.min(maxColumns, newX);

    grid.clearSelections();
    grid.select(newX, newY, 0, 0);
    grid.setMouseDown(grid.newPoint(newX, newY));
    grid.setDragExtent(grid.newPoint(0, 0));

    grid.repaint();
};

/**
* @function
* @instance
* @description
If we are holding down the same navigation key, accelerate the increment we scroll
* #### returns: integer
*/
RowSelection.prototype.getAutoScrollAcceleration = function() {
    var count = 1;
    var elapsed = this.getAutoScrollDuration() / 2000;
    count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
    return count;
};

/**
* @function
* @instance
* @description
set the start time to right now when we initiate an auto scroll
*/
RowSelection.prototype.setAutoScrollStartTime = function() {
    this.sbAutoStart = Date.now();
};

/**
* @function
* @instance
* @description
update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
*/
RowSelection.prototype.pingAutoScroll = function() {
    var now = Date.now();
    if (now - this.sbLastAuto > 500) {
        this.setAutoScrollStartTime();
    }
    this.sbLastAuto = Date.now();
};

/**
* @function
* @instance
* @description
answer how long we have been auto scrolling
* #### returns: integer
*/
RowSelection.prototype.getAutoScrollDuration = function() {
    if (Date.now() - this.sbLastAuto > 500) {
        return 0;
    }
    return Date.now() - this.sbAutoStart;
};

/**
* @function
* @instance
* @description
Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
RowSelection.prototype.moveShiftSelect = function(grid, offsetY) {

    var maxRows = grid.getRowCount() - 1;

    var maxViewableRows = grid.getVisibleRows() - 1;

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxRows = Math.min(maxRows, maxViewableRows);
    }

    var origin = grid.getMouseDown();
    var extent = grid.getDragExtent();

    var newY = extent.y + offsetY;
    //var newY = grid.getRowCount();

    newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

    grid.clearMostRecentRowSelection();
    grid.selectRow(origin.y, origin.y + newY);

    grid.setDragExtent(grid.newPoint(0, newY));

    if (grid.insureModelRowIsVisible(newY + origin.y, offsetY)) {
        this.pingAutoScroll();
    }

    grid.fireSyntheticRowSelectionChangedEvent();
    grid.repaint();

};

/**
* @function
* @instance
* @description
Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {integer} offsetX - x coordinate to start at
 * @param {integer} offsetY - y coordinate to start at
*/
RowSelection.prototype.moveSingleSelect = function(grid, offsetY) {

    var maxRows = grid.getRowCount() - 1;

    var maxViewableRows = grid.getVisibleRowsCount() - 1;

    if (!grid.resolveProperty('scrollingEnabled')) {
        maxRows = Math.min(maxRows, maxViewableRows);
    }

    var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());

    var newY = mouseCorner.y + offsetY;
    //var newY = grid.getRowCount();

    newY = Math.min(maxRows, Math.max(0, newY));

    grid.clearSelections();
    grid.selectRow(newY);
    grid.setMouseDown(grid.newPoint(0, newY));
    grid.setDragExtent(grid.newPoint(0, 0));

    if (grid.insureModelRowIsVisible(newY, offsetY)) {
        this.pingAutoScroll();
    }

    grid.fireSyntheticRowSelectionChangedEvent();
    grid.repaint();

};

RowSelection.prototype.isSingleRowSelection = function() {
    return true;
};

module.exports = RowSelection;

},{"./Base.js":16}],31:[function(require,module,exports){
'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function ThumbwheelScrolling() {
    Base.call(this);
    this.alias = 'ThumbwheelScrolling';
};

ThumbwheelScrolling.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/
ThumbwheelScrolling.handleWheelMoved = function(grid, e) {
    if (!grid.resolveProperty('scrollingEnabled')) {
        return;
    }
    var primEvent = e.primitiveEvent;
    var deltaY = primEvent.wheelDeltaY || -primEvent.deltaY;
    var deltaX = primEvent.wheelDeltaX || -primEvent.deltaX;
    if (deltaY > 0) {
        grid.scrollBy(0, -1);
    } else if (deltaY < -0) {
        grid.scrollBy(0, 1);
    } else if (deltaX > 0) {
        grid.scrollBy(-1, 0);
    } else if (deltaX < -0) {
        grid.scrollBy(1, 0);
    }
};


module.exports = ThumbwheelScrolling;

},{"./Base.js":16}],32:[function(require,module,exports){
'use strict';

module.exports = {
    CellClick: require('./CellClick.js'),
    CellEditing: require('./CellEditing.js'),
    CellSelection: require('./CellSelection.js'),
    ColumnAutosizing: require('./ColumnAutosizing.js'),
    ColumnMoving: require('./ColumnMoving.js'),
    ColumnResizing: require('./ColumnResizing.js'),
    ColumnSelection: require('./ColumnSelection.js'),
    ColumnSorting: require('./ColumnSorting.js'),
    Filters: require('./Filters.js'),
    KeyPaging: require('./KeyPaging.js'),
    OnHover: require('./OnHover.js'),
    Overlay: require('./Overlay.js'),
    RowResizing: require('./RowResizing.js'),
    RowSelection: require('./RowSelection.js'),
    ThumbwheelScrolling: require('./ThumbwheelScrolling.js')
};


},{"./CellClick.js":17,"./CellEditing.js":18,"./CellSelection.js":19,"./ColumnAutosizing.js":20,"./ColumnMoving.js":21,"./ColumnResizing.js":22,"./ColumnSelection.js":23,"./ColumnSorting.js":24,"./Filters.js":25,"./KeyPaging.js":26,"./OnHover.js":27,"./Overlay.js":28,"./RowResizing.js":29,"./RowSelection.js":30,"./ThumbwheelScrolling.js":31}],33:[function(require,module,exports){
/* eslint-env node, browser */
'use strict';

var ns = (window.fin = window.fin || {})
    .hypergrid = window.fin.hypergrid || {};

ns.behaviors = require('./behaviors/behaviors.js');
ns.cellEditors = require('./cellEditors/cellEditors.js');
ns.dataModels = require('./dataModels/dataModels.js');
ns.features = require('./features/features.js');
ns.CellProvider = require('./CellProvider');
ns.Renderer = require('./Renderer');
ns.SelectionModel = require('./SelectionModel');
ns.LRUCache = require('lru-cache');

},{"./CellProvider":3,"./Renderer":4,"./SelectionModel":5,"./behaviors/behaviors.js":6,"./cellEditors/cellEditors.js":10,"./dataModels/dataModels.js":15,"./features/features.js":32,"lru-cache":1}]},{},[33]);
