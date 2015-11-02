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
        //defaultCellPaint: this.defaultCellPaint
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

    var bounds = this.getBounds();
    var viewWidth = bounds.width();

    //we must be in bootstrap
    if (viewWidth === 0) {
        //viewWidth = grid.sbHScroller.getClientRects()[0].width;
        viewWidth = grid.canvas.width;
    }
    var viewHeight = bounds.height();

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
    var behavior = grid.getBehavior();
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

    var column = behavior.getColumn(c);
    var translatedIndex = column.index;

    return {
        gridCell: grid.newPoint(c, r),
        mousePoint: grid.newPoint(x, y),
        viewPoint: viewPoint,
        dataCell: grid.newPoint(translatedIndex, r),
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
    var bounds = this.getBounds();
    var width = bounds.width() - 200 - x;
    var height = bounds.height();
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

Renderer.prototype.getBounds = function() {
    return this.bounds;
};

Renderer.prototype.setBounds = function(bounds) {
    return this.bounds = bounds;
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

Base.prototype.getInput = function() {
    if (!this.input) {
        this.input = this.getDefaultInput();
    }
    return this.input;
};

Base.prototype.getDefaultInput = function() {
    var div = document.createElement('DIV');
    div.innerHTML = this.getHTML();
    var input = div.firstChild;
    this.initializeInput(input);
    return input;
};

Base.prototype.updateView = function() {
    var oldGuy = this.getInput();
    var parent = oldGuy.parentNode;
    var newGuy = this.getDefaultInput();
    this.input = newGuy;
    parent.replaceChild(newGuy, oldGuy);
};

Base.prototype.initializeInput = function(input) {
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
    <select id="editor">
        {{#items}}
            <option value="{{.}}">{{.}}</option>
        {{/items}}
    </select>
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

Choice.prototype.setItems = function(items) {
    this.items = items;
    this.updateView();
};

Choice.prototype.initializeInput = function(input) {
    var self = this;
    Simple.prototype.initializeInput(input);
    input.onchange = function() {
        self.stopEditing();
    };
};

module.exports = Choice;

},{"./Simple.js":11}],9:[function(require,module,exports){
'use strict';
/**
 *
 * @module cell-editors\Color
 *
 */

var Simple = require('./Simple.js');

function Color() {
    Simple.call(this);
}

Color.prototype = new Simple();

Color.prototype.constructor = Color;

Color.prototype.alias = 'color';

Color.prototype.template = function() {/*
    <input id="editor" type="color">
*/
};


module.exports = Color;

},{"./Simple.js":11}],10:[function(require,module,exports){
'use strict';
/**
 *
 * @module cell-editors\Date
 *
 */

var Simple = require('./Simple.js');

function Date() {
    Simple.call(this);
}

Date.prototype = new Simple();

Date.prototype.constructor = Date;

Date.prototype.alias = 'date';

Date.prototype.template = function() {/*
    <input id="editor" type="date">
*/
};


module.exports = Date;

},{"./Simple.js":11}],11:[function(require,module,exports){
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
Simple.prototype.initializeInput = function(input) {
    var self = this;
    input.addEventListener('keyup', function(e) {
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
    input.addEventListener('keydown', function(e) {
        self.getGrid().fireSyntheticEditorKeyDownEvent(self, e);
    });
    input.addEventListener('keypress', function(e) {
        console.log('keypress', e.keyCode);
        self.getGrid().fireSyntheticEditorKeyPressEvent(self, e);
    });
    // input.addEventListener('focusout', function() {
    //     self.stopEditing();
    // });
    // input.addEventListener('blur', function() {
    //     self.stopEditing();
    // });
    input.style.position = 'absolute';
    input.style.display = 'none';
    input.style.border = 'solid 2px black';
    input.style.outline = 0;
    input.style.padding = 0;
    input.style.zIndex = 1000;
};

/**
* @function
* @instance
* @description
return the current editor's value
* #### returns: Object
*/
Simple.prototype.getEditorValue = function() {
    var value = this.getInput().value;
    return value;
};

/**
* @function
* @instance
* @description
save the new value into the behavior(model)
*/
Simple.prototype.setEditorValue = function(value) {
    this.getInput().value = value + '';
};

Simple.prototype.clearStopEditing = function() {
    this.setEditorValue('');
    this.stopEditing();
};

Simple.prototype.cancelEditing = function() {
    if (!this.isEditing) {
        return;
    }
    this.getInput().value = null;
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
    this.getInput().style.display = 'inline';
};

/**
* @function
* @instance
* @description
hide the editor
*/
Simple.prototype.hideEditor = function() {
    this.getInput().style.display = 'none';
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

    this.getInput().style.webkitTransform = translation;
    this.getInput().style.MozTransform = translation;
    this.getInput().style.msTransform = translation;
    this.getInput().style.OTransform = translation;

    // this.getInput().style.left = cellBounds.x + originOffset[0] + 'px';
    // this.getInput().style.top = cellBounds.y + originOffset[1] + 'px';

    this.getInput().style.width = (cellBounds.width) + 'px';
    this.getInput().style.height = (cellBounds.height - 2) + 'px';
    //var xOffset = this.grid.canvas.getBoundingClientRect().left;
};

module.exports = Simple;

},{"./Base.js":7}],12:[function(require,module,exports){
'use strict';
/**
 *
 * @module cell-editors\Slider
 *
 */

var Simple = require('./Simple.js');

function Slider() {
    Simple.call(this);
}

Slider.prototype = new Simple();

Slider.prototype.constructor = Slider;

Slider.prototype.alias = 'slider';

Slider.prototype.template = function() {/*
    <input id="editor" type="range">
*/
};


module.exports = Slider;

},{"./Simple.js":11}],13:[function(require,module,exports){
'use strict';
/**
 *
 * @module cell-editors\Spinner
 *
 */

var Simple = require('./Simple.js');

function Spinner() {
    Simple.call(this);
}

Spinner.prototype = new Simple();

Spinner.prototype.constructor = Spinner;

Spinner.prototype.alias = 'spinner';

Spinner.prototype.template = function() {/*
    <input id="editor" type="number">
*/
};


module.exports = Spinner;

},{"./Simple.js":11}],14:[function(require,module,exports){
'use strict';
/**
 *
 * @module cell-editors\Textfield
 *
 */

var Simple = require('./Simple.js');

function Textfield() {
    Simple.call(this);
}

Textfield.prototype = new Simple();

Textfield.prototype.constructor = Textfield;

Textfield.prototype.alias = 'textfield';

Textfield.prototype.template = function() {/*
    <input id="editor">
*/
};

Textfield.prototype.selectAll = function() {
    this.input.setSelectionRange(0, this.input.value.length);
};

module.exports = Textfield;



},{"./Simple.js":11}],15:[function(require,module,exports){
'use strict';

module.exports = {
    Base: require('./Base.js'),
    Simple: require('./Simple.js'),
    Choice: require('./Choice.js'),
    Color: require('./Color.js'),
    //Combo: require('./Combo.js'),
    Date: require('./Date.js'),
    Slider: require('./Slider.js'),
    Spinner: require('./Spinner.js'),
    Textfield: require('./Textfield.js'),
};

},{"./Base.js":7,"./Choice.js":8,"./Color.js":9,"./Date.js":10,"./Simple.js":11,"./Slider.js":12,"./Spinner.js":13,"./Textfield.js":14}],16:[function(require,module,exports){
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



},{}],17:[function(require,module,exports){
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

},{"./Base.js":16}],18:[function(require,module,exports){
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

},{"./Base.js":16}],19:[function(require,module,exports){
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
    var y = event.gridCell.y - headerRowCount + 1;
    this.analytics.click(y);
    this.changed();
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

},{"./Base.js":16}],20:[function(require,module,exports){
'use strict';

module.exports = {
    Default: require('./Default.js'),
    InMemory: require('./InMemory.js'),
    JSON: require('./JSON.js')
};

},{"./Default.js":17,"./InMemory.js":18,"./JSON.js":19}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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

},{"./Base.js":21}],23:[function(require,module,exports){
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

},{"./Base.js":21}],24:[function(require,module,exports){
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

},{"./Base.js":21}],25:[function(require,module,exports){
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

},{"./Base.js":21}],26:[function(require,module,exports){
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

},{"./Base.js":21}],27:[function(require,module,exports){
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

},{"./Base.js":21}],28:[function(require,module,exports){
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
    grid.setDragExtent(grid.rectangles.point.create(newX, 0));

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
        grid.setDragExtent(grid.rectangles.point.create(x - mousePoint.x, 0));
    } else {
        grid.toggleSelectColumn(x, keys);
        grid.setMouseDown(grid.rectangles.point.create(x, y));
        grid.setDragExtent(grid.rectangles.point.create(0, 0));
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
    // grid.setMouseDown(grid.rectangles.point.create(newX, newY));
    // grid.setDragExtent(grid.rectangles.point.create(0, 0));

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

    grid.setDragExtent(grid.rectangles.point.create(newX, 0));

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
    grid.setMouseDown(grid.rectangles.point.create(newX, 0));
    grid.setDragExtent(grid.rectangles.point.create(0, 0));

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

},{"./Base.js":21}],29:[function(require,module,exports){
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

},{"./Base.js":21}],30:[function(require,module,exports){
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

},{"./Base.js":21}],31:[function(require,module,exports){
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

},{"./Base.js":21}],32:[function(require,module,exports){
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

},{"./Base.js":21}],33:[function(require,module,exports){
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

},{"./Base.js":21}],34:[function(require,module,exports){
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

},{"./ColumnResizing.js":27}],35:[function(require,module,exports){
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

},{"./Base.js":21}],36:[function(require,module,exports){
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

},{"./Base.js":21}],37:[function(require,module,exports){
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


},{"./CellClick.js":22,"./CellEditing.js":23,"./CellSelection.js":24,"./ColumnAutosizing.js":25,"./ColumnMoving.js":26,"./ColumnResizing.js":27,"./ColumnSelection.js":28,"./ColumnSorting.js":29,"./Filters.js":30,"./KeyPaging.js":31,"./OnHover.js":32,"./Overlay.js":33,"./RowResizing.js":34,"./RowSelection.js":35,"./ThumbwheelScrolling.js":36}],38:[function(require,module,exports){
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

},{"./CellProvider":3,"./Renderer":4,"./SelectionModel":5,"./behaviors/behaviors.js":6,"./cellEditors/cellEditors.js":15,"./dataModels/dataModels.js":20,"./features/features.js":37,"lru-cache":1}]},{},[38])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvbHJ1LWNhY2hlL2xpYi9scnUtY2FjaGUuanMiLCJub2RlX21vZHVsZXMvbXVzdGFjaGUvbXVzdGFjaGUuanMiLCJzcmMvQ2VsbFByb3ZpZGVyLmpzIiwic3JjL1JlbmRlcmVyLmpzIiwic3JjL1NlbGVjdGlvbk1vZGVsLmpzIiwic3JjL2JlaGF2aW9ycy9iZWhhdmlvcnMuanMiLCJzcmMvY2VsbEVkaXRvcnMvQmFzZS5qcyIsInNyYy9jZWxsRWRpdG9ycy9DaG9pY2UuanMiLCJzcmMvY2VsbEVkaXRvcnMvQ29sb3IuanMiLCJzcmMvY2VsbEVkaXRvcnMvRGF0ZS5qcyIsInNyYy9jZWxsRWRpdG9ycy9TaW1wbGUuanMiLCJzcmMvY2VsbEVkaXRvcnMvU2xpZGVyLmpzIiwic3JjL2NlbGxFZGl0b3JzL1NwaW5uZXIuanMiLCJzcmMvY2VsbEVkaXRvcnMvVGV4dGZpZWxkLmpzIiwic3JjL2NlbGxFZGl0b3JzL2NlbGxFZGl0b3JzLmpzIiwic3JjL2RhdGFNb2RlbHMvQmFzZS5qcyIsInNyYy9kYXRhTW9kZWxzL0RlZmF1bHQuanMiLCJzcmMvZGF0YU1vZGVscy9Jbk1lbW9yeS5qcyIsInNyYy9kYXRhTW9kZWxzL0pTT04uanMiLCJzcmMvZGF0YU1vZGVscy9kYXRhTW9kZWxzLmpzIiwic3JjL2ZlYXR1cmVzL0Jhc2UuanMiLCJzcmMvZmVhdHVyZXMvQ2VsbENsaWNrLmpzIiwic3JjL2ZlYXR1cmVzL0NlbGxFZGl0aW5nLmpzIiwic3JjL2ZlYXR1cmVzL0NlbGxTZWxlY3Rpb24uanMiLCJzcmMvZmVhdHVyZXMvQ29sdW1uQXV0b3NpemluZy5qcyIsInNyYy9mZWF0dXJlcy9Db2x1bW5Nb3ZpbmcuanMiLCJzcmMvZmVhdHVyZXMvQ29sdW1uUmVzaXppbmcuanMiLCJzcmMvZmVhdHVyZXMvQ29sdW1uU2VsZWN0aW9uLmpzIiwic3JjL2ZlYXR1cmVzL0NvbHVtblNvcnRpbmcuanMiLCJzcmMvZmVhdHVyZXMvRmlsdGVycy5qcyIsInNyYy9mZWF0dXJlcy9LZXlQYWdpbmcuanMiLCJzcmMvZmVhdHVyZXMvT25Ib3Zlci5qcyIsInNyYy9mZWF0dXJlcy9PdmVybGF5LmpzIiwic3JjL2ZlYXR1cmVzL1Jvd1Jlc2l6aW5nLmpzIiwic3JjL2ZlYXR1cmVzL1Jvd1NlbGVjdGlvbi5qcyIsInNyYy9mZWF0dXJlcy9UaHVtYndoZWVsU2Nyb2xsaW5nLmpzIiwic3JjL2ZlYXR1cmVzL2ZlYXR1cmVzLmpzIiwic3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbm5CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2bEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL3NCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCI7KGZ1bmN0aW9uICgpIHsgLy8gY2xvc3VyZSBmb3Igd2ViIGJyb3dzZXJzXG5cbmlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICBtb2R1bGUuZXhwb3J0cyA9IExSVUNhY2hlXG59IGVsc2Uge1xuICAvLyBqdXN0IHNldCB0aGUgZ2xvYmFsIGZvciBub24tbm9kZSBwbGF0Zm9ybXMuXG4gIHRoaXMuTFJVQ2FjaGUgPSBMUlVDYWNoZVxufVxuXG5mdW5jdGlvbiBoT1AgKG9iaiwga2V5KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpXG59XG5cbmZ1bmN0aW9uIG5haXZlTGVuZ3RoICgpIHsgcmV0dXJuIDEgfVxuXG5mdW5jdGlvbiBMUlVDYWNoZSAob3B0aW9ucykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTFJVQ2FjaGUpKVxuICAgIHJldHVybiBuZXcgTFJVQ2FjaGUob3B0aW9ucylcblxuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdudW1iZXInKVxuICAgIG9wdGlvbnMgPSB7IG1heDogb3B0aW9ucyB9XG5cbiAgaWYgKCFvcHRpb25zKVxuICAgIG9wdGlvbnMgPSB7fVxuXG4gIHRoaXMuX21heCA9IG9wdGlvbnMubWF4XG4gIC8vIEtpbmQgb2Ygd2VpcmQgdG8gaGF2ZSBhIGRlZmF1bHQgbWF4IG9mIEluZmluaXR5LCBidXQgb2ggd2VsbC5cbiAgaWYgKCF0aGlzLl9tYXggfHwgISh0eXBlb2YgdGhpcy5fbWF4ID09PSBcIm51bWJlclwiKSB8fCB0aGlzLl9tYXggPD0gMCApXG4gICAgdGhpcy5fbWF4ID0gSW5maW5pdHlcblxuICB0aGlzLl9sZW5ndGhDYWxjdWxhdG9yID0gb3B0aW9ucy5sZW5ndGggfHwgbmFpdmVMZW5ndGhcbiAgaWYgKHR5cGVvZiB0aGlzLl9sZW5ndGhDYWxjdWxhdG9yICE9PSBcImZ1bmN0aW9uXCIpXG4gICAgdGhpcy5fbGVuZ3RoQ2FsY3VsYXRvciA9IG5haXZlTGVuZ3RoXG5cbiAgdGhpcy5fYWxsb3dTdGFsZSA9IG9wdGlvbnMuc3RhbGUgfHwgZmFsc2VcbiAgdGhpcy5fbWF4QWdlID0gb3B0aW9ucy5tYXhBZ2UgfHwgbnVsbFxuICB0aGlzLl9kaXNwb3NlID0gb3B0aW9ucy5kaXNwb3NlXG4gIHRoaXMucmVzZXQoKVxufVxuXG4vLyByZXNpemUgdGhlIGNhY2hlIHdoZW4gdGhlIG1heCBjaGFuZ2VzLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KExSVUNhY2hlLnByb3RvdHlwZSwgXCJtYXhcIixcbiAgeyBzZXQgOiBmdW5jdGlvbiAobUwpIHtcbiAgICAgIGlmICghbUwgfHwgISh0eXBlb2YgbUwgPT09IFwibnVtYmVyXCIpIHx8IG1MIDw9IDAgKSBtTCA9IEluZmluaXR5XG4gICAgICB0aGlzLl9tYXggPSBtTFxuICAgICAgaWYgKHRoaXMuX2xlbmd0aCA+IHRoaXMuX21heCkgdHJpbSh0aGlzKVxuICAgIH1cbiAgLCBnZXQgOiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9tYXggfVxuICAsIGVudW1lcmFibGUgOiB0cnVlXG4gIH0pXG5cbi8vIHJlc2l6ZSB0aGUgY2FjaGUgd2hlbiB0aGUgbGVuZ3RoQ2FsY3VsYXRvciBjaGFuZ2VzLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KExSVUNhY2hlLnByb3RvdHlwZSwgXCJsZW5ndGhDYWxjdWxhdG9yXCIsXG4gIHsgc2V0IDogZnVuY3Rpb24gKGxDKSB7XG4gICAgICBpZiAodHlwZW9mIGxDICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhpcy5fbGVuZ3RoQ2FsY3VsYXRvciA9IG5haXZlTGVuZ3RoXG4gICAgICAgIHRoaXMuX2xlbmd0aCA9IHRoaXMuX2l0ZW1Db3VudFxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fY2FjaGUpIHtcbiAgICAgICAgICB0aGlzLl9jYWNoZVtrZXldLmxlbmd0aCA9IDFcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbGVuZ3RoQ2FsY3VsYXRvciA9IGxDXG4gICAgICAgIHRoaXMuX2xlbmd0aCA9IDBcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2NhY2hlKSB7XG4gICAgICAgICAgdGhpcy5fY2FjaGVba2V5XS5sZW5ndGggPSB0aGlzLl9sZW5ndGhDYWxjdWxhdG9yKHRoaXMuX2NhY2hlW2tleV0udmFsdWUpXG4gICAgICAgICAgdGhpcy5fbGVuZ3RoICs9IHRoaXMuX2NhY2hlW2tleV0ubGVuZ3RoXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX2xlbmd0aCA+IHRoaXMuX21heCkgdHJpbSh0aGlzKVxuICAgIH1cbiAgLCBnZXQgOiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9sZW5ndGhDYWxjdWxhdG9yIH1cbiAgLCBlbnVtZXJhYmxlIDogdHJ1ZVxuICB9KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoTFJVQ2FjaGUucHJvdG90eXBlLCBcImxlbmd0aFwiLFxuICB7IGdldCA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX2xlbmd0aCB9XG4gICwgZW51bWVyYWJsZSA6IHRydWVcbiAgfSlcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoTFJVQ2FjaGUucHJvdG90eXBlLCBcIml0ZW1Db3VudFwiLFxuICB7IGdldCA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX2l0ZW1Db3VudCB9XG4gICwgZW51bWVyYWJsZSA6IHRydWVcbiAgfSlcblxuTFJVQ2FjaGUucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoZm4sIHRoaXNwKSB7XG4gIHRoaXNwID0gdGhpc3AgfHwgdGhpc1xuICB2YXIgaSA9IDBcbiAgdmFyIGl0ZW1Db3VudCA9IHRoaXMuX2l0ZW1Db3VudFxuXG4gIGZvciAodmFyIGsgPSB0aGlzLl9tcnUgLSAxOyBrID49IDAgJiYgaSA8IGl0ZW1Db3VudDsgay0tKSBpZiAodGhpcy5fbHJ1TGlzdFtrXSkge1xuICAgIGkrK1xuICAgIHZhciBoaXQgPSB0aGlzLl9scnVMaXN0W2tdXG4gICAgaWYgKGlzU3RhbGUodGhpcywgaGl0KSkge1xuICAgICAgZGVsKHRoaXMsIGhpdClcbiAgICAgIGlmICghdGhpcy5fYWxsb3dTdGFsZSkgaGl0ID0gdW5kZWZpbmVkXG4gICAgfVxuICAgIGlmIChoaXQpIHtcbiAgICAgIGZuLmNhbGwodGhpc3AsIGhpdC52YWx1ZSwgaGl0LmtleSwgdGhpcylcbiAgICB9XG4gIH1cbn1cblxuTFJVQ2FjaGUucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBrZXlzID0gbmV3IEFycmF5KHRoaXMuX2l0ZW1Db3VudClcbiAgdmFyIGkgPSAwXG4gIGZvciAodmFyIGsgPSB0aGlzLl9tcnUgLSAxOyBrID49IDAgJiYgaSA8IHRoaXMuX2l0ZW1Db3VudDsgay0tKSBpZiAodGhpcy5fbHJ1TGlzdFtrXSkge1xuICAgIHZhciBoaXQgPSB0aGlzLl9scnVMaXN0W2tdXG4gICAga2V5c1tpKytdID0gaGl0LmtleVxuICB9XG4gIHJldHVybiBrZXlzXG59XG5cbkxSVUNhY2hlLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB2YWx1ZXMgPSBuZXcgQXJyYXkodGhpcy5faXRlbUNvdW50KVxuICB2YXIgaSA9IDBcbiAgZm9yICh2YXIgayA9IHRoaXMuX21ydSAtIDE7IGsgPj0gMCAmJiBpIDwgdGhpcy5faXRlbUNvdW50OyBrLS0pIGlmICh0aGlzLl9scnVMaXN0W2tdKSB7XG4gICAgdmFyIGhpdCA9IHRoaXMuX2xydUxpc3Rba11cbiAgICB2YWx1ZXNbaSsrXSA9IGhpdC52YWx1ZVxuICB9XG4gIHJldHVybiB2YWx1ZXNcbn1cblxuTFJVQ2FjaGUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5fZGlzcG9zZSAmJiB0aGlzLl9jYWNoZSkge1xuICAgIGZvciAodmFyIGsgaW4gdGhpcy5fY2FjaGUpIHtcbiAgICAgIHRoaXMuX2Rpc3Bvc2UoaywgdGhpcy5fY2FjaGVba10udmFsdWUpXG4gICAgfVxuICB9XG5cbiAgdGhpcy5fY2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpIC8vIGhhc2ggb2YgaXRlbXMgYnkga2V5XG4gIHRoaXMuX2xydUxpc3QgPSBPYmplY3QuY3JlYXRlKG51bGwpIC8vIGxpc3Qgb2YgaXRlbXMgaW4gb3JkZXIgb2YgdXNlIHJlY2VuY3lcbiAgdGhpcy5fbXJ1ID0gMCAvLyBtb3N0IHJlY2VudGx5IHVzZWRcbiAgdGhpcy5fbHJ1ID0gMCAvLyBsZWFzdCByZWNlbnRseSB1c2VkXG4gIHRoaXMuX2xlbmd0aCA9IDAgLy8gbnVtYmVyIG9mIGl0ZW1zIGluIHRoZSBsaXN0XG4gIHRoaXMuX2l0ZW1Db3VudCA9IDBcbn1cblxuTFJVQ2FjaGUucHJvdG90eXBlLmR1bXAgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBhcnIgPSBbXVxuICB2YXIgaSA9IDBcblxuICBmb3IgKHZhciBrID0gdGhpcy5fbXJ1IC0gMTsgayA+PSAwICYmIGkgPCB0aGlzLl9pdGVtQ291bnQ7IGstLSkgaWYgKHRoaXMuX2xydUxpc3Rba10pIHtcbiAgICB2YXIgaGl0ID0gdGhpcy5fbHJ1TGlzdFtrXVxuICAgIGlmICghaXNTdGFsZSh0aGlzLCBoaXQpKSB7XG4gICAgICAvL0RvIG5vdCBzdG9yZSBzdGFsZWQgaGl0c1xuICAgICAgKytpXG4gICAgICBhcnIucHVzaCh7XG4gICAgICAgIGs6IGhpdC5rZXksXG4gICAgICAgIHY6IGhpdC52YWx1ZSxcbiAgICAgICAgZTogaGl0Lm5vdyArIChoaXQubWF4QWdlIHx8IDApXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgLy9hcnIgaGFzIHRoZSBtb3N0IHJlYWQgZmlyc3RcbiAgcmV0dXJuIGFyclxufVxuXG5MUlVDYWNoZS5wcm90b3R5cGUuZHVtcExydSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX2xydUxpc3Rcbn1cblxuTFJVQ2FjaGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBtYXhBZ2UpIHtcbiAgbWF4QWdlID0gbWF4QWdlIHx8IHRoaXMuX21heEFnZVxuICB2YXIgbm93ID0gbWF4QWdlID8gRGF0ZS5ub3coKSA6IDBcbiAgdmFyIGxlbiA9IHRoaXMuX2xlbmd0aENhbGN1bGF0b3IodmFsdWUpXG5cbiAgaWYgKGhPUCh0aGlzLl9jYWNoZSwga2V5KSkge1xuICAgIGlmIChsZW4gPiB0aGlzLl9tYXgpIHtcbiAgICAgIGRlbCh0aGlzLCB0aGlzLl9jYWNoZVtrZXldKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIC8vIGRpc3Bvc2Ugb2YgdGhlIG9sZCBvbmUgYmVmb3JlIG92ZXJ3cml0aW5nXG4gICAgaWYgKHRoaXMuX2Rpc3Bvc2UpXG4gICAgICB0aGlzLl9kaXNwb3NlKGtleSwgdGhpcy5fY2FjaGVba2V5XS52YWx1ZSlcblxuICAgIHRoaXMuX2NhY2hlW2tleV0ubm93ID0gbm93XG4gICAgdGhpcy5fY2FjaGVba2V5XS5tYXhBZ2UgPSBtYXhBZ2VcbiAgICB0aGlzLl9jYWNoZVtrZXldLnZhbHVlID0gdmFsdWVcbiAgICB0aGlzLl9sZW5ndGggKz0gKGxlbiAtIHRoaXMuX2NhY2hlW2tleV0ubGVuZ3RoKVxuICAgIHRoaXMuX2NhY2hlW2tleV0ubGVuZ3RoID0gbGVuXG4gICAgdGhpcy5nZXQoa2V5KVxuXG4gICAgaWYgKHRoaXMuX2xlbmd0aCA+IHRoaXMuX21heClcbiAgICAgIHRyaW0odGhpcylcblxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICB2YXIgaGl0ID0gbmV3IEVudHJ5KGtleSwgdmFsdWUsIHRoaXMuX21ydSsrLCBsZW4sIG5vdywgbWF4QWdlKVxuXG4gIC8vIG92ZXJzaXplZCBvYmplY3RzIGZhbGwgb3V0IG9mIGNhY2hlIGF1dG9tYXRpY2FsbHkuXG4gIGlmIChoaXQubGVuZ3RoID4gdGhpcy5fbWF4KSB7XG4gICAgaWYgKHRoaXMuX2Rpc3Bvc2UpIHRoaXMuX2Rpc3Bvc2Uoa2V5LCB2YWx1ZSlcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHRoaXMuX2xlbmd0aCArPSBoaXQubGVuZ3RoXG4gIHRoaXMuX2xydUxpc3RbaGl0Lmx1XSA9IHRoaXMuX2NhY2hlW2tleV0gPSBoaXRcbiAgdGhpcy5faXRlbUNvdW50ICsrXG5cbiAgaWYgKHRoaXMuX2xlbmd0aCA+IHRoaXMuX21heClcbiAgICB0cmltKHRoaXMpXG5cbiAgcmV0dXJuIHRydWVcbn1cblxuTFJVQ2FjaGUucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKCFoT1AodGhpcy5fY2FjaGUsIGtleSkpIHJldHVybiBmYWxzZVxuICB2YXIgaGl0ID0gdGhpcy5fY2FjaGVba2V5XVxuICBpZiAoaXNTdGFsZSh0aGlzLCBoaXQpKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxuTFJVQ2FjaGUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgcmV0dXJuIGdldCh0aGlzLCBrZXksIHRydWUpXG59XG5cbkxSVUNhY2hlLnByb3RvdHlwZS5wZWVrID0gZnVuY3Rpb24gKGtleSkge1xuICByZXR1cm4gZ2V0KHRoaXMsIGtleSwgZmFsc2UpXG59XG5cbkxSVUNhY2hlLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBoaXQgPSB0aGlzLl9scnVMaXN0W3RoaXMuX2xydV1cbiAgZGVsKHRoaXMsIGhpdClcbiAgcmV0dXJuIGhpdCB8fCBudWxsXG59XG5cbkxSVUNhY2hlLnByb3RvdHlwZS5kZWwgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIGRlbCh0aGlzLCB0aGlzLl9jYWNoZVtrZXldKVxufVxuXG5MUlVDYWNoZS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgLy9yZXNldCB0aGUgY2FjaGVcbiAgdGhpcy5yZXNldCgpO1xuXG4gIHZhciBub3cgPSBEYXRlLm5vdygpXG4gIC8vQSBwcmV2aW91cyBzZXJpYWxpemVkIGNhY2hlIGhhcyB0aGUgbW9zdCByZWNlbnQgaXRlbXMgZmlyc3RcbiAgZm9yICh2YXIgbCA9IGFyci5sZW5ndGggLSAxOyBsID49IDA7IGwtLSApIHtcbiAgICB2YXIgaGl0ID0gYXJyW2xdXG4gICAgdmFyIGV4cGlyZXNBdCA9IGhpdC5lIHx8IDBcbiAgICBpZiAoZXhwaXJlc0F0ID09PSAwKSB7XG4gICAgICAvL3RoZSBpdGVtIHdhcyBjcmVhdGVkIHdpdGhvdXQgZXhwaXJhdGlvbiBpbiBhIG5vbiBhZ2VkIGNhY2hlXG4gICAgICB0aGlzLnNldChoaXQuaywgaGl0LnYpXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBtYXhBZ2UgPSBleHBpcmVzQXQgLSBub3dcbiAgICAgIC8vZG9udCBhZGQgYWxyZWFkeSBleHBpcmVkIGl0ZW1zXG4gICAgICBpZiAobWF4QWdlID4gMCkgdGhpcy5zZXQoaGl0LmssIGhpdC52LCBtYXhBZ2UpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldCAoc2VsZiwga2V5LCBkb1VzZSkge1xuICB2YXIgaGl0ID0gc2VsZi5fY2FjaGVba2V5XVxuICBpZiAoaGl0KSB7XG4gICAgaWYgKGlzU3RhbGUoc2VsZiwgaGl0KSkge1xuICAgICAgZGVsKHNlbGYsIGhpdClcbiAgICAgIGlmICghc2VsZi5fYWxsb3dTdGFsZSkgaGl0ID0gdW5kZWZpbmVkXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChkb1VzZSkgdXNlKHNlbGYsIGhpdClcbiAgICB9XG4gICAgaWYgKGhpdCkgaGl0ID0gaGl0LnZhbHVlXG4gIH1cbiAgcmV0dXJuIGhpdFxufVxuXG5mdW5jdGlvbiBpc1N0YWxlKHNlbGYsIGhpdCkge1xuICBpZiAoIWhpdCB8fCAoIWhpdC5tYXhBZ2UgJiYgIXNlbGYuX21heEFnZSkpIHJldHVybiBmYWxzZVxuICB2YXIgc3RhbGUgPSBmYWxzZTtcbiAgdmFyIGRpZmYgPSBEYXRlLm5vdygpIC0gaGl0Lm5vd1xuICBpZiAoaGl0Lm1heEFnZSkge1xuICAgIHN0YWxlID0gZGlmZiA+IGhpdC5tYXhBZ2VcbiAgfSBlbHNlIHtcbiAgICBzdGFsZSA9IHNlbGYuX21heEFnZSAmJiAoZGlmZiA+IHNlbGYuX21heEFnZSlcbiAgfVxuICByZXR1cm4gc3RhbGU7XG59XG5cbmZ1bmN0aW9uIHVzZSAoc2VsZiwgaGl0KSB7XG4gIHNoaWZ0TFUoc2VsZiwgaGl0KVxuICBoaXQubHUgPSBzZWxmLl9tcnUgKytcbiAgc2VsZi5fbHJ1TGlzdFtoaXQubHVdID0gaGl0XG59XG5cbmZ1bmN0aW9uIHRyaW0gKHNlbGYpIHtcbiAgd2hpbGUgKHNlbGYuX2xydSA8IHNlbGYuX21ydSAmJiBzZWxmLl9sZW5ndGggPiBzZWxmLl9tYXgpXG4gICAgZGVsKHNlbGYsIHNlbGYuX2xydUxpc3Rbc2VsZi5fbHJ1XSlcbn1cblxuZnVuY3Rpb24gc2hpZnRMVSAoc2VsZiwgaGl0KSB7XG4gIGRlbGV0ZSBzZWxmLl9scnVMaXN0WyBoaXQubHUgXVxuICB3aGlsZSAoc2VsZi5fbHJ1IDwgc2VsZi5fbXJ1ICYmICFzZWxmLl9scnVMaXN0W3NlbGYuX2xydV0pIHNlbGYuX2xydSArK1xufVxuXG5mdW5jdGlvbiBkZWwgKHNlbGYsIGhpdCkge1xuICBpZiAoaGl0KSB7XG4gICAgaWYgKHNlbGYuX2Rpc3Bvc2UpIHNlbGYuX2Rpc3Bvc2UoaGl0LmtleSwgaGl0LnZhbHVlKVxuICAgIHNlbGYuX2xlbmd0aCAtPSBoaXQubGVuZ3RoXG4gICAgc2VsZi5faXRlbUNvdW50IC0tXG4gICAgZGVsZXRlIHNlbGYuX2NhY2hlWyBoaXQua2V5IF1cbiAgICBzaGlmdExVKHNlbGYsIGhpdClcbiAgfVxufVxuXG4vLyBjbGFzc3ksIHNpbmNlIFY4IHByZWZlcnMgcHJlZGljdGFibGUgb2JqZWN0cy5cbmZ1bmN0aW9uIEVudHJ5IChrZXksIHZhbHVlLCBsdSwgbGVuZ3RoLCBub3csIG1heEFnZSkge1xuICB0aGlzLmtleSA9IGtleVxuICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgdGhpcy5sdSA9IGx1XG4gIHRoaXMubGVuZ3RoID0gbGVuZ3RoXG4gIHRoaXMubm93ID0gbm93XG4gIGlmIChtYXhBZ2UpIHRoaXMubWF4QWdlID0gbWF4QWdlXG59XG5cbn0pKClcbiIsIi8qIVxuICogbXVzdGFjaGUuanMgLSBMb2dpYy1sZXNzIHt7bXVzdGFjaGV9fSB0ZW1wbGF0ZXMgd2l0aCBKYXZhU2NyaXB0XG4gKiBodHRwOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzXG4gKi9cblxuLypnbG9iYWwgZGVmaW5lOiBmYWxzZSBNdXN0YWNoZTogdHJ1ZSovXG5cbihmdW5jdGlvbiBkZWZpbmVNdXN0YWNoZSAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgZXhwb3J0cyAmJiB0eXBlb2YgZXhwb3J0cy5ub2RlTmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICBmYWN0b3J5KGV4cG9ydHMpOyAvLyBDb21tb25KU1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSk7IC8vIEFNRFxuICB9IGVsc2Uge1xuICAgIGdsb2JhbC5NdXN0YWNoZSA9IHt9O1xuICAgIGZhY3RvcnkoTXVzdGFjaGUpOyAvLyBzY3JpcHQsIHdzaCwgYXNwXG4gIH1cbn0odGhpcywgZnVuY3Rpb24gbXVzdGFjaGVGYWN0b3J5IChtdXN0YWNoZSkge1xuXG4gIHZhciBvYmplY3RUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiBpc0FycmF5UG9seWZpbGwgKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3RUb1N0cmluZy5jYWxsKG9iamVjdCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbiAgZnVuY3Rpb24gaXNGdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvYmplY3QgPT09ICdmdW5jdGlvbic7XG4gIH1cblxuICAvKipcbiAgICogTW9yZSBjb3JyZWN0IHR5cGVvZiBzdHJpbmcgaGFuZGxpbmcgYXJyYXlcbiAgICogd2hpY2ggbm9ybWFsbHkgcmV0dXJucyB0eXBlb2YgJ29iamVjdCdcbiAgICovXG4gIGZ1bmN0aW9uIHR5cGVTdHIgKG9iaikge1xuICAgIHJldHVybiBpc0FycmF5KG9iaikgPyAnYXJyYXknIDogdHlwZW9mIG9iajtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVzY2FwZVJlZ0V4cCAoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bXFwtXFxbXFxde30oKSorPy4sXFxcXFxcXiR8I1xcc10vZywgJ1xcXFwkJicpO1xuICB9XG5cbiAgLyoqXG4gICAqIE51bGwgc2FmZSB3YXkgb2YgY2hlY2tpbmcgd2hldGhlciBvciBub3QgYW4gb2JqZWN0LFxuICAgKiBpbmNsdWRpbmcgaXRzIHByb3RvdHlwZSwgaGFzIGEgZ2l2ZW4gcHJvcGVydHlcbiAgICovXG4gIGZ1bmN0aW9uIGhhc1Byb3BlcnR5IChvYmosIHByb3BOYW1lKSB7XG4gICAgcmV0dXJuIG9iaiAhPSBudWxsICYmIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIChwcm9wTmFtZSBpbiBvYmopO1xuICB9XG5cbiAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9pc3N1ZXMuYXBhY2hlLm9yZy9qaXJhL2Jyb3dzZS9DT1VDSERCLTU3N1xuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2phbmwvbXVzdGFjaGUuanMvaXNzdWVzLzE4OVxuICB2YXIgcmVnRXhwVGVzdCA9IFJlZ0V4cC5wcm90b3R5cGUudGVzdDtcbiAgZnVuY3Rpb24gdGVzdFJlZ0V4cCAocmUsIHN0cmluZykge1xuICAgIHJldHVybiByZWdFeHBUZXN0LmNhbGwocmUsIHN0cmluZyk7XG4gIH1cblxuICB2YXIgbm9uU3BhY2VSZSA9IC9cXFMvO1xuICBmdW5jdGlvbiBpc1doaXRlc3BhY2UgKHN0cmluZykge1xuICAgIHJldHVybiAhdGVzdFJlZ0V4cChub25TcGFjZVJlLCBzdHJpbmcpO1xuICB9XG5cbiAgdmFyIGVudGl0eU1hcCA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmIzM5OycsXG4gICAgJy8nOiAnJiN4MkY7J1xuICB9O1xuXG4gIGZ1bmN0aW9uIGVzY2FwZUh0bWwgKHN0cmluZykge1xuICAgIHJldHVybiBTdHJpbmcoc3RyaW5nKS5yZXBsYWNlKC9bJjw+XCInXFwvXS9nLCBmdW5jdGlvbiBmcm9tRW50aXR5TWFwIChzKSB7XG4gICAgICByZXR1cm4gZW50aXR5TWFwW3NdO1xuICAgIH0pO1xuICB9XG5cbiAgdmFyIHdoaXRlUmUgPSAvXFxzKi87XG4gIHZhciBzcGFjZVJlID0gL1xccysvO1xuICB2YXIgZXF1YWxzUmUgPSAvXFxzKj0vO1xuICB2YXIgY3VybHlSZSA9IC9cXHMqXFx9LztcbiAgdmFyIHRhZ1JlID0gLyN8XFxefFxcL3w+fFxce3wmfD18IS87XG5cbiAgLyoqXG4gICAqIEJyZWFrcyB1cCB0aGUgZ2l2ZW4gYHRlbXBsYXRlYCBzdHJpbmcgaW50byBhIHRyZWUgb2YgdG9rZW5zLiBJZiB0aGUgYHRhZ3NgXG4gICAqIGFyZ3VtZW50IGlzIGdpdmVuIGhlcmUgaXQgbXVzdCBiZSBhbiBhcnJheSB3aXRoIHR3byBzdHJpbmcgdmFsdWVzOiB0aGVcbiAgICogb3BlbmluZyBhbmQgY2xvc2luZyB0YWdzIHVzZWQgaW4gdGhlIHRlbXBsYXRlIChlLmcuIFsgXCI8JVwiLCBcIiU+XCIgXSkuIE9mXG4gICAqIGNvdXJzZSwgdGhlIGRlZmF1bHQgaXMgdG8gdXNlIG11c3RhY2hlcyAoaS5lLiBtdXN0YWNoZS50YWdzKS5cbiAgICpcbiAgICogQSB0b2tlbiBpcyBhbiBhcnJheSB3aXRoIGF0IGxlYXN0IDQgZWxlbWVudHMuIFRoZSBmaXJzdCBlbGVtZW50IGlzIHRoZVxuICAgKiBtdXN0YWNoZSBzeW1ib2wgdGhhdCB3YXMgdXNlZCBpbnNpZGUgdGhlIHRhZywgZS5nLiBcIiNcIiBvciBcIiZcIi4gSWYgdGhlIHRhZ1xuICAgKiBkaWQgbm90IGNvbnRhaW4gYSBzeW1ib2wgKGkuZS4ge3tteVZhbHVlfX0pIHRoaXMgZWxlbWVudCBpcyBcIm5hbWVcIi4gRm9yXG4gICAqIGFsbCB0ZXh0IHRoYXQgYXBwZWFycyBvdXRzaWRlIGEgc3ltYm9sIHRoaXMgZWxlbWVudCBpcyBcInRleHRcIi5cbiAgICpcbiAgICogVGhlIHNlY29uZCBlbGVtZW50IG9mIGEgdG9rZW4gaXMgaXRzIFwidmFsdWVcIi4gRm9yIG11c3RhY2hlIHRhZ3MgdGhpcyBpc1xuICAgKiB3aGF0ZXZlciBlbHNlIHdhcyBpbnNpZGUgdGhlIHRhZyBiZXNpZGVzIHRoZSBvcGVuaW5nIHN5bWJvbC4gRm9yIHRleHQgdG9rZW5zXG4gICAqIHRoaXMgaXMgdGhlIHRleHQgaXRzZWxmLlxuICAgKlxuICAgKiBUaGUgdGhpcmQgYW5kIGZvdXJ0aCBlbGVtZW50cyBvZiB0aGUgdG9rZW4gYXJlIHRoZSBzdGFydCBhbmQgZW5kIGluZGljZXMsXG4gICAqIHJlc3BlY3RpdmVseSwgb2YgdGhlIHRva2VuIGluIHRoZSBvcmlnaW5hbCB0ZW1wbGF0ZS5cbiAgICpcbiAgICogVG9rZW5zIHRoYXQgYXJlIHRoZSByb290IG5vZGUgb2YgYSBzdWJ0cmVlIGNvbnRhaW4gdHdvIG1vcmUgZWxlbWVudHM6IDEpIGFuXG4gICAqIGFycmF5IG9mIHRva2VucyBpbiB0aGUgc3VidHJlZSBhbmQgMikgdGhlIGluZGV4IGluIHRoZSBvcmlnaW5hbCB0ZW1wbGF0ZSBhdFxuICAgKiB3aGljaCB0aGUgY2xvc2luZyB0YWcgZm9yIHRoYXQgc2VjdGlvbiBiZWdpbnMuXG4gICAqL1xuICBmdW5jdGlvbiBwYXJzZVRlbXBsYXRlICh0ZW1wbGF0ZSwgdGFncykge1xuICAgIGlmICghdGVtcGxhdGUpXG4gICAgICByZXR1cm4gW107XG5cbiAgICB2YXIgc2VjdGlvbnMgPSBbXTsgICAgIC8vIFN0YWNrIHRvIGhvbGQgc2VjdGlvbiB0b2tlbnNcbiAgICB2YXIgdG9rZW5zID0gW107ICAgICAgIC8vIEJ1ZmZlciB0byBob2xkIHRoZSB0b2tlbnNcbiAgICB2YXIgc3BhY2VzID0gW107ICAgICAgIC8vIEluZGljZXMgb2Ygd2hpdGVzcGFjZSB0b2tlbnMgb24gdGhlIGN1cnJlbnQgbGluZVxuICAgIHZhciBoYXNUYWcgPSBmYWxzZTsgICAgLy8gSXMgdGhlcmUgYSB7e3RhZ319IG9uIHRoZSBjdXJyZW50IGxpbmU/XG4gICAgdmFyIG5vblNwYWNlID0gZmFsc2U7ICAvLyBJcyB0aGVyZSBhIG5vbi1zcGFjZSBjaGFyIG9uIHRoZSBjdXJyZW50IGxpbmU/XG5cbiAgICAvLyBTdHJpcHMgYWxsIHdoaXRlc3BhY2UgdG9rZW5zIGFycmF5IGZvciB0aGUgY3VycmVudCBsaW5lXG4gICAgLy8gaWYgdGhlcmUgd2FzIGEge3sjdGFnfX0gb24gaXQgYW5kIG90aGVyd2lzZSBvbmx5IHNwYWNlLlxuICAgIGZ1bmN0aW9uIHN0cmlwU3BhY2UgKCkge1xuICAgICAgaWYgKGhhc1RhZyAmJiAhbm9uU3BhY2UpIHtcbiAgICAgICAgd2hpbGUgKHNwYWNlcy5sZW5ndGgpXG4gICAgICAgICAgZGVsZXRlIHRva2Vuc1tzcGFjZXMucG9wKCldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3BhY2VzID0gW107XG4gICAgICB9XG5cbiAgICAgIGhhc1RhZyA9IGZhbHNlO1xuICAgICAgbm9uU3BhY2UgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgb3BlbmluZ1RhZ1JlLCBjbG9zaW5nVGFnUmUsIGNsb3NpbmdDdXJseVJlO1xuICAgIGZ1bmN0aW9uIGNvbXBpbGVUYWdzICh0YWdzVG9Db21waWxlKSB7XG4gICAgICBpZiAodHlwZW9mIHRhZ3NUb0NvbXBpbGUgPT09ICdzdHJpbmcnKVxuICAgICAgICB0YWdzVG9Db21waWxlID0gdGFnc1RvQ29tcGlsZS5zcGxpdChzcGFjZVJlLCAyKTtcblxuICAgICAgaWYgKCFpc0FycmF5KHRhZ3NUb0NvbXBpbGUpIHx8IHRhZ3NUb0NvbXBpbGUubGVuZ3RoICE9PSAyKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdGFnczogJyArIHRhZ3NUb0NvbXBpbGUpO1xuXG4gICAgICBvcGVuaW5nVGFnUmUgPSBuZXcgUmVnRXhwKGVzY2FwZVJlZ0V4cCh0YWdzVG9Db21waWxlWzBdKSArICdcXFxccyonKTtcbiAgICAgIGNsb3NpbmdUYWdSZSA9IG5ldyBSZWdFeHAoJ1xcXFxzKicgKyBlc2NhcGVSZWdFeHAodGFnc1RvQ29tcGlsZVsxXSkpO1xuICAgICAgY2xvc2luZ0N1cmx5UmUgPSBuZXcgUmVnRXhwKCdcXFxccyonICsgZXNjYXBlUmVnRXhwKCd9JyArIHRhZ3NUb0NvbXBpbGVbMV0pKTtcbiAgICB9XG5cbiAgICBjb21waWxlVGFncyh0YWdzIHx8IG11c3RhY2hlLnRhZ3MpO1xuXG4gICAgdmFyIHNjYW5uZXIgPSBuZXcgU2Nhbm5lcih0ZW1wbGF0ZSk7XG5cbiAgICB2YXIgc3RhcnQsIHR5cGUsIHZhbHVlLCBjaHIsIHRva2VuLCBvcGVuU2VjdGlvbjtcbiAgICB3aGlsZSAoIXNjYW5uZXIuZW9zKCkpIHtcbiAgICAgIHN0YXJ0ID0gc2Nhbm5lci5wb3M7XG5cbiAgICAgIC8vIE1hdGNoIGFueSB0ZXh0IGJldHdlZW4gdGFncy5cbiAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwob3BlbmluZ1RhZ1JlKTtcblxuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCB2YWx1ZUxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgaSA8IHZhbHVlTGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBjaHIgPSB2YWx1ZS5jaGFyQXQoaSk7XG5cbiAgICAgICAgICBpZiAoaXNXaGl0ZXNwYWNlKGNocikpIHtcbiAgICAgICAgICAgIHNwYWNlcy5wdXNoKHRva2Vucy5sZW5ndGgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub25TcGFjZSA9IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdG9rZW5zLnB1c2goWyAndGV4dCcsIGNociwgc3RhcnQsIHN0YXJ0ICsgMSBdKTtcbiAgICAgICAgICBzdGFydCArPSAxO1xuXG4gICAgICAgICAgLy8gQ2hlY2sgZm9yIHdoaXRlc3BhY2Ugb24gdGhlIGN1cnJlbnQgbGluZS5cbiAgICAgICAgICBpZiAoY2hyID09PSAnXFxuJylcbiAgICAgICAgICAgIHN0cmlwU3BhY2UoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNYXRjaCB0aGUgb3BlbmluZyB0YWcuXG4gICAgICBpZiAoIXNjYW5uZXIuc2NhbihvcGVuaW5nVGFnUmUpKVxuICAgICAgICBicmVhaztcblxuICAgICAgaGFzVGFnID0gdHJ1ZTtcblxuICAgICAgLy8gR2V0IHRoZSB0YWcgdHlwZS5cbiAgICAgIHR5cGUgPSBzY2FubmVyLnNjYW4odGFnUmUpIHx8ICduYW1lJztcbiAgICAgIHNjYW5uZXIuc2Nhbih3aGl0ZVJlKTtcblxuICAgICAgLy8gR2V0IHRoZSB0YWcgdmFsdWUuXG4gICAgICBpZiAodHlwZSA9PT0gJz0nKSB7XG4gICAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwoZXF1YWxzUmUpO1xuICAgICAgICBzY2FubmVyLnNjYW4oZXF1YWxzUmUpO1xuICAgICAgICBzY2FubmVyLnNjYW5VbnRpbChjbG9zaW5nVGFnUmUpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAneycpIHtcbiAgICAgICAgdmFsdWUgPSBzY2FubmVyLnNjYW5VbnRpbChjbG9zaW5nQ3VybHlSZSk7XG4gICAgICAgIHNjYW5uZXIuc2NhbihjdXJseVJlKTtcbiAgICAgICAgc2Nhbm5lci5zY2FuVW50aWwoY2xvc2luZ1RhZ1JlKTtcbiAgICAgICAgdHlwZSA9ICcmJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwoY2xvc2luZ1RhZ1JlKTtcbiAgICAgIH1cblxuICAgICAgLy8gTWF0Y2ggdGhlIGNsb3NpbmcgdGFnLlxuICAgICAgaWYgKCFzY2FubmVyLnNjYW4oY2xvc2luZ1RhZ1JlKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmNsb3NlZCB0YWcgYXQgJyArIHNjYW5uZXIucG9zKTtcblxuICAgICAgdG9rZW4gPSBbIHR5cGUsIHZhbHVlLCBzdGFydCwgc2Nhbm5lci5wb3MgXTtcbiAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcblxuICAgICAgaWYgKHR5cGUgPT09ICcjJyB8fCB0eXBlID09PSAnXicpIHtcbiAgICAgICAgc2VjdGlvbnMucHVzaCh0b2tlbik7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICcvJykge1xuICAgICAgICAvLyBDaGVjayBzZWN0aW9uIG5lc3RpbmcuXG4gICAgICAgIG9wZW5TZWN0aW9uID0gc2VjdGlvbnMucG9wKCk7XG5cbiAgICAgICAgaWYgKCFvcGVuU2VjdGlvbilcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vub3BlbmVkIHNlY3Rpb24gXCInICsgdmFsdWUgKyAnXCIgYXQgJyArIHN0YXJ0KTtcblxuICAgICAgICBpZiAob3BlblNlY3Rpb25bMV0gIT09IHZhbHVlKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5jbG9zZWQgc2VjdGlvbiBcIicgKyBvcGVuU2VjdGlvblsxXSArICdcIiBhdCAnICsgc3RhcnQpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnbmFtZScgfHwgdHlwZSA9PT0gJ3snIHx8IHR5cGUgPT09ICcmJykge1xuICAgICAgICBub25TcGFjZSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICc9Jykge1xuICAgICAgICAvLyBTZXQgdGhlIHRhZ3MgZm9yIHRoZSBuZXh0IHRpbWUgYXJvdW5kLlxuICAgICAgICBjb21waWxlVGFncyh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIHRoZXJlIGFyZSBubyBvcGVuIHNlY3Rpb25zIHdoZW4gd2UncmUgZG9uZS5cbiAgICBvcGVuU2VjdGlvbiA9IHNlY3Rpb25zLnBvcCgpO1xuXG4gICAgaWYgKG9wZW5TZWN0aW9uKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmNsb3NlZCBzZWN0aW9uIFwiJyArIG9wZW5TZWN0aW9uWzFdICsgJ1wiIGF0ICcgKyBzY2FubmVyLnBvcyk7XG5cbiAgICByZXR1cm4gbmVzdFRva2VucyhzcXVhc2hUb2tlbnModG9rZW5zKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29tYmluZXMgdGhlIHZhbHVlcyBvZiBjb25zZWN1dGl2ZSB0ZXh0IHRva2VucyBpbiB0aGUgZ2l2ZW4gYHRva2Vuc2AgYXJyYXlcbiAgICogdG8gYSBzaW5nbGUgdG9rZW4uXG4gICAqL1xuICBmdW5jdGlvbiBzcXVhc2hUb2tlbnMgKHRva2Vucykge1xuICAgIHZhciBzcXVhc2hlZFRva2VucyA9IFtdO1xuXG4gICAgdmFyIHRva2VuLCBsYXN0VG9rZW47XG4gICAgZm9yICh2YXIgaSA9IDAsIG51bVRva2VucyA9IHRva2Vucy5sZW5ndGg7IGkgPCBudW1Ub2tlbnM7ICsraSkge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG5cbiAgICAgIGlmICh0b2tlbikge1xuICAgICAgICBpZiAodG9rZW5bMF0gPT09ICd0ZXh0JyAmJiBsYXN0VG9rZW4gJiYgbGFzdFRva2VuWzBdID09PSAndGV4dCcpIHtcbiAgICAgICAgICBsYXN0VG9rZW5bMV0gKz0gdG9rZW5bMV07XG4gICAgICAgICAgbGFzdFRva2VuWzNdID0gdG9rZW5bM107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3F1YXNoZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgbGFzdFRva2VuID0gdG9rZW47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3F1YXNoZWRUb2tlbnM7XG4gIH1cblxuICAvKipcbiAgICogRm9ybXMgdGhlIGdpdmVuIGFycmF5IG9mIGB0b2tlbnNgIGludG8gYSBuZXN0ZWQgdHJlZSBzdHJ1Y3R1cmUgd2hlcmVcbiAgICogdG9rZW5zIHRoYXQgcmVwcmVzZW50IGEgc2VjdGlvbiBoYXZlIHR3byBhZGRpdGlvbmFsIGl0ZW1zOiAxKSBhbiBhcnJheSBvZlxuICAgKiBhbGwgdG9rZW5zIHRoYXQgYXBwZWFyIGluIHRoYXQgc2VjdGlvbiBhbmQgMikgdGhlIGluZGV4IGluIHRoZSBvcmlnaW5hbFxuICAgKiB0ZW1wbGF0ZSB0aGF0IHJlcHJlc2VudHMgdGhlIGVuZCBvZiB0aGF0IHNlY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBuZXN0VG9rZW5zICh0b2tlbnMpIHtcbiAgICB2YXIgbmVzdGVkVG9rZW5zID0gW107XG4gICAgdmFyIGNvbGxlY3RvciA9IG5lc3RlZFRva2VucztcbiAgICB2YXIgc2VjdGlvbnMgPSBbXTtcblxuICAgIHZhciB0b2tlbiwgc2VjdGlvbjtcbiAgICBmb3IgKHZhciBpID0gMCwgbnVtVG9rZW5zID0gdG9rZW5zLmxlbmd0aDsgaSA8IG51bVRva2VuczsgKytpKSB7XG4gICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcblxuICAgICAgc3dpdGNoICh0b2tlblswXSkge1xuICAgICAgY2FzZSAnIyc6XG4gICAgICBjYXNlICdeJzpcbiAgICAgICAgY29sbGVjdG9yLnB1c2godG9rZW4pO1xuICAgICAgICBzZWN0aW9ucy5wdXNoKHRva2VuKTtcbiAgICAgICAgY29sbGVjdG9yID0gdG9rZW5bNF0gPSBbXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICcvJzpcbiAgICAgICAgc2VjdGlvbiA9IHNlY3Rpb25zLnBvcCgpO1xuICAgICAgICBzZWN0aW9uWzVdID0gdG9rZW5bMl07XG4gICAgICAgIGNvbGxlY3RvciA9IHNlY3Rpb25zLmxlbmd0aCA+IDAgPyBzZWN0aW9uc1tzZWN0aW9ucy5sZW5ndGggLSAxXVs0XSA6IG5lc3RlZFRva2VucztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb2xsZWN0b3IucHVzaCh0b2tlbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5lc3RlZFRva2VucztcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHNpbXBsZSBzdHJpbmcgc2Nhbm5lciB0aGF0IGlzIHVzZWQgYnkgdGhlIHRlbXBsYXRlIHBhcnNlciB0byBmaW5kXG4gICAqIHRva2VucyBpbiB0ZW1wbGF0ZSBzdHJpbmdzLlxuICAgKi9cbiAgZnVuY3Rpb24gU2Nhbm5lciAoc3RyaW5nKSB7XG4gICAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7XG4gICAgdGhpcy50YWlsID0gc3RyaW5nO1xuICAgIHRoaXMucG9zID0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdGFpbCBpcyBlbXB0eSAoZW5kIG9mIHN0cmluZykuXG4gICAqL1xuICBTY2FubmVyLnByb3RvdHlwZS5lb3MgPSBmdW5jdGlvbiBlb3MgKCkge1xuICAgIHJldHVybiB0aGlzLnRhaWwgPT09ICcnO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUcmllcyB0byBtYXRjaCB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgKiBSZXR1cm5zIHRoZSBtYXRjaGVkIHRleHQgaWYgaXQgY2FuIG1hdGNoLCB0aGUgZW1wdHkgc3RyaW5nIG90aGVyd2lzZS5cbiAgICovXG4gIFNjYW5uZXIucHJvdG90eXBlLnNjYW4gPSBmdW5jdGlvbiBzY2FuIChyZSkge1xuICAgIHZhciBtYXRjaCA9IHRoaXMudGFpbC5tYXRjaChyZSk7XG5cbiAgICBpZiAoIW1hdGNoIHx8IG1hdGNoLmluZGV4ICE9PSAwKVxuICAgICAgcmV0dXJuICcnO1xuXG4gICAgdmFyIHN0cmluZyA9IG1hdGNoWzBdO1xuXG4gICAgdGhpcy50YWlsID0gdGhpcy50YWlsLnN1YnN0cmluZyhzdHJpbmcubGVuZ3RoKTtcbiAgICB0aGlzLnBvcyArPSBzdHJpbmcubGVuZ3RoO1xuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfTtcblxuICAvKipcbiAgICogU2tpcHMgYWxsIHRleHQgdW50aWwgdGhlIGdpdmVuIHJlZ3VsYXIgZXhwcmVzc2lvbiBjYW4gYmUgbWF0Y2hlZC4gUmV0dXJuc1xuICAgKiB0aGUgc2tpcHBlZCBzdHJpbmcsIHdoaWNoIGlzIHRoZSBlbnRpcmUgdGFpbCBpZiBubyBtYXRjaCBjYW4gYmUgbWFkZS5cbiAgICovXG4gIFNjYW5uZXIucHJvdG90eXBlLnNjYW5VbnRpbCA9IGZ1bmN0aW9uIHNjYW5VbnRpbCAocmUpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnRhaWwuc2VhcmNoKHJlKSwgbWF0Y2g7XG5cbiAgICBzd2l0Y2ggKGluZGV4KSB7XG4gICAgY2FzZSAtMTpcbiAgICAgIG1hdGNoID0gdGhpcy50YWlsO1xuICAgICAgdGhpcy50YWlsID0gJyc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDA6XG4gICAgICBtYXRjaCA9ICcnO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIG1hdGNoID0gdGhpcy50YWlsLnN1YnN0cmluZygwLCBpbmRleCk7XG4gICAgICB0aGlzLnRhaWwgPSB0aGlzLnRhaWwuc3Vic3RyaW5nKGluZGV4KTtcbiAgICB9XG5cbiAgICB0aGlzLnBvcyArPSBtYXRjaC5sZW5ndGg7XG5cbiAgICByZXR1cm4gbWF0Y2g7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlcHJlc2VudHMgYSByZW5kZXJpbmcgY29udGV4dCBieSB3cmFwcGluZyBhIHZpZXcgb2JqZWN0IGFuZFxuICAgKiBtYWludGFpbmluZyBhIHJlZmVyZW5jZSB0byB0aGUgcGFyZW50IGNvbnRleHQuXG4gICAqL1xuICBmdW5jdGlvbiBDb250ZXh0ICh2aWV3LCBwYXJlbnRDb250ZXh0KSB7XG4gICAgdGhpcy52aWV3ID0gdmlldztcbiAgICB0aGlzLmNhY2hlID0geyAnLic6IHRoaXMudmlldyB9O1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50Q29udGV4dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNvbnRleHQgdXNpbmcgdGhlIGdpdmVuIHZpZXcgd2l0aCB0aGlzIGNvbnRleHRcbiAgICogYXMgdGhlIHBhcmVudC5cbiAgICovXG4gIENvbnRleHQucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiBwdXNoICh2aWV3KSB7XG4gICAgcmV0dXJuIG5ldyBDb250ZXh0KHZpZXcsIHRoaXMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gbmFtZSBpbiB0aGlzIGNvbnRleHQsIHRyYXZlcnNpbmdcbiAgICogdXAgdGhlIGNvbnRleHQgaGllcmFyY2h5IGlmIHRoZSB2YWx1ZSBpcyBhYnNlbnQgaW4gdGhpcyBjb250ZXh0J3Mgdmlldy5cbiAgICovXG4gIENvbnRleHQucHJvdG90eXBlLmxvb2t1cCA9IGZ1bmN0aW9uIGxvb2t1cCAobmFtZSkge1xuICAgIHZhciBjYWNoZSA9IHRoaXMuY2FjaGU7XG5cbiAgICB2YXIgdmFsdWU7XG4gICAgaWYgKGNhY2hlLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICB2YWx1ZSA9IGNhY2hlW25hbWVdO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgY29udGV4dCA9IHRoaXMsIG5hbWVzLCBpbmRleCwgbG9va3VwSGl0ID0gZmFsc2U7XG5cbiAgICAgIHdoaWxlIChjb250ZXh0KSB7XG4gICAgICAgIGlmIChuYW1lLmluZGV4T2YoJy4nKSA+IDApIHtcbiAgICAgICAgICB2YWx1ZSA9IGNvbnRleHQudmlldztcbiAgICAgICAgICBuYW1lcyA9IG5hbWUuc3BsaXQoJy4nKTtcbiAgICAgICAgICBpbmRleCA9IDA7XG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBVc2luZyB0aGUgZG90IG5vdGlvbiBwYXRoIGluIGBuYW1lYCwgd2UgZGVzY2VuZCB0aHJvdWdoIHRoZVxuICAgICAgICAgICAqIG5lc3RlZCBvYmplY3RzLlxuICAgICAgICAgICAqXG4gICAgICAgICAgICogVG8gYmUgY2VydGFpbiB0aGF0IHRoZSBsb29rdXAgaGFzIGJlZW4gc3VjY2Vzc2Z1bCwgd2UgaGF2ZSB0b1xuICAgICAgICAgICAqIGNoZWNrIGlmIHRoZSBsYXN0IG9iamVjdCBpbiB0aGUgcGF0aCBhY3R1YWxseSBoYXMgdGhlIHByb3BlcnR5XG4gICAgICAgICAgICogd2UgYXJlIGxvb2tpbmcgZm9yLiBXZSBzdG9yZSB0aGUgcmVzdWx0IGluIGBsb29rdXBIaXRgLlxuICAgICAgICAgICAqXG4gICAgICAgICAgICogVGhpcyBpcyBzcGVjaWFsbHkgbmVjZXNzYXJ5IGZvciB3aGVuIHRoZSB2YWx1ZSBoYXMgYmVlbiBzZXQgdG9cbiAgICAgICAgICAgKiBgdW5kZWZpbmVkYCBhbmQgd2Ugd2FudCB0byBhdm9pZCBsb29raW5nIHVwIHBhcmVudCBjb250ZXh0cy5cbiAgICAgICAgICAgKiovXG4gICAgICAgICAgd2hpbGUgKHZhbHVlICE9IG51bGwgJiYgaW5kZXggPCBuYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gbmFtZXMubGVuZ3RoIC0gMSlcbiAgICAgICAgICAgICAgbG9va3VwSGl0ID0gaGFzUHJvcGVydHkodmFsdWUsIG5hbWVzW2luZGV4XSk7XG5cbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWVbbmFtZXNbaW5kZXgrK11dO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA9IGNvbnRleHQudmlld1tuYW1lXTtcbiAgICAgICAgICBsb29rdXBIaXQgPSBoYXNQcm9wZXJ0eShjb250ZXh0LnZpZXcsIG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxvb2t1cEhpdClcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjb250ZXh0ID0gY29udGV4dC5wYXJlbnQ7XG4gICAgICB9XG5cbiAgICAgIGNhY2hlW25hbWVdID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKVxuICAgICAgdmFsdWUgPSB2YWx1ZS5jYWxsKHRoaXMudmlldyk7XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIEEgV3JpdGVyIGtub3dzIGhvdyB0byB0YWtlIGEgc3RyZWFtIG9mIHRva2VucyBhbmQgcmVuZGVyIHRoZW0gdG8gYVxuICAgKiBzdHJpbmcsIGdpdmVuIGEgY29udGV4dC4gSXQgYWxzbyBtYWludGFpbnMgYSBjYWNoZSBvZiB0ZW1wbGF0ZXMgdG9cbiAgICogYXZvaWQgdGhlIG5lZWQgdG8gcGFyc2UgdGhlIHNhbWUgdGVtcGxhdGUgdHdpY2UuXG4gICAqL1xuICBmdW5jdGlvbiBXcml0ZXIgKCkge1xuICAgIHRoaXMuY2FjaGUgPSB7fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIGNhY2hlZCB0ZW1wbGF0ZXMgaW4gdGhpcyB3cml0ZXIuXG4gICAqL1xuICBXcml0ZXIucHJvdG90eXBlLmNsZWFyQ2FjaGUgPSBmdW5jdGlvbiBjbGVhckNhY2hlICgpIHtcbiAgICB0aGlzLmNhY2hlID0ge307XG4gIH07XG5cbiAgLyoqXG4gICAqIFBhcnNlcyBhbmQgY2FjaGVzIHRoZSBnaXZlbiBgdGVtcGxhdGVgIGFuZCByZXR1cm5zIHRoZSBhcnJheSBvZiB0b2tlbnNcbiAgICogdGhhdCBpcyBnZW5lcmF0ZWQgZnJvbSB0aGUgcGFyc2UuXG4gICAqL1xuICBXcml0ZXIucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gcGFyc2UgKHRlbXBsYXRlLCB0YWdzKSB7XG4gICAgdmFyIGNhY2hlID0gdGhpcy5jYWNoZTtcbiAgICB2YXIgdG9rZW5zID0gY2FjaGVbdGVtcGxhdGVdO1xuXG4gICAgaWYgKHRva2VucyA9PSBudWxsKVxuICAgICAgdG9rZW5zID0gY2FjaGVbdGVtcGxhdGVdID0gcGFyc2VUZW1wbGF0ZSh0ZW1wbGF0ZSwgdGFncyk7XG5cbiAgICByZXR1cm4gdG9rZW5zO1xuICB9O1xuXG4gIC8qKlxuICAgKiBIaWdoLWxldmVsIG1ldGhvZCB0aGF0IGlzIHVzZWQgdG8gcmVuZGVyIHRoZSBnaXZlbiBgdGVtcGxhdGVgIHdpdGhcbiAgICogdGhlIGdpdmVuIGB2aWV3YC5cbiAgICpcbiAgICogVGhlIG9wdGlvbmFsIGBwYXJ0aWFsc2AgYXJndW1lbnQgbWF5IGJlIGFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIHRoZVxuICAgKiBuYW1lcyBhbmQgdGVtcGxhdGVzIG9mIHBhcnRpYWxzIHRoYXQgYXJlIHVzZWQgaW4gdGhlIHRlbXBsYXRlLiBJdCBtYXlcbiAgICogYWxzbyBiZSBhIGZ1bmN0aW9uIHRoYXQgaXMgdXNlZCB0byBsb2FkIHBhcnRpYWwgdGVtcGxhdGVzIG9uIHRoZSBmbHlcbiAgICogdGhhdCB0YWtlcyBhIHNpbmdsZSBhcmd1bWVudDogdGhlIG5hbWUgb2YgdGhlIHBhcnRpYWwuXG4gICAqL1xuICBXcml0ZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlciAodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKSB7XG4gICAgdmFyIHRva2VucyA9IHRoaXMucGFyc2UodGVtcGxhdGUpO1xuICAgIHZhciBjb250ZXh0ID0gKHZpZXcgaW5zdGFuY2VvZiBDb250ZXh0KSA/IHZpZXcgOiBuZXcgQ29udGV4dCh2aWV3KTtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXJUb2tlbnModG9rZW5zLCBjb250ZXh0LCBwYXJ0aWFscywgdGVtcGxhdGUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBMb3ctbGV2ZWwgbWV0aG9kIHRoYXQgcmVuZGVycyB0aGUgZ2l2ZW4gYXJyYXkgb2YgYHRva2Vuc2AgdXNpbmdcbiAgICogdGhlIGdpdmVuIGBjb250ZXh0YCBhbmQgYHBhcnRpYWxzYC5cbiAgICpcbiAgICogTm90ZTogVGhlIGBvcmlnaW5hbFRlbXBsYXRlYCBpcyBvbmx5IGV2ZXIgdXNlZCB0byBleHRyYWN0IHRoZSBwb3J0aW9uXG4gICAqIG9mIHRoZSBvcmlnaW5hbCB0ZW1wbGF0ZSB0aGF0IHdhcyBjb250YWluZWQgaW4gYSBoaWdoZXItb3JkZXIgc2VjdGlvbi5cbiAgICogSWYgdGhlIHRlbXBsYXRlIGRvZXNuJ3QgdXNlIGhpZ2hlci1vcmRlciBzZWN0aW9ucywgdGhpcyBhcmd1bWVudCBtYXlcbiAgICogYmUgb21pdHRlZC5cbiAgICovXG4gIFdyaXRlci5wcm90b3R5cGUucmVuZGVyVG9rZW5zID0gZnVuY3Rpb24gcmVuZGVyVG9rZW5zICh0b2tlbnMsIGNvbnRleHQsIHBhcnRpYWxzLCBvcmlnaW5hbFRlbXBsYXRlKSB7XG4gICAgdmFyIGJ1ZmZlciA9ICcnO1xuXG4gICAgdmFyIHRva2VuLCBzeW1ib2wsIHZhbHVlO1xuICAgIGZvciAodmFyIGkgPSAwLCBudW1Ub2tlbnMgPSB0b2tlbnMubGVuZ3RoOyBpIDwgbnVtVG9rZW5zOyArK2kpIHtcbiAgICAgIHZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICBzeW1ib2wgPSB0b2tlblswXTtcblxuICAgICAgaWYgKHN5bWJvbCA9PT0gJyMnKSB2YWx1ZSA9IHRoaXMucmVuZGVyU2VjdGlvbih0b2tlbiwgY29udGV4dCwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpO1xuICAgICAgZWxzZSBpZiAoc3ltYm9sID09PSAnXicpIHZhbHVlID0gdGhpcy5yZW5kZXJJbnZlcnRlZCh0b2tlbiwgY29udGV4dCwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpO1xuICAgICAgZWxzZSBpZiAoc3ltYm9sID09PSAnPicpIHZhbHVlID0gdGhpcy5yZW5kZXJQYXJ0aWFsKHRva2VuLCBjb250ZXh0LCBwYXJ0aWFscywgb3JpZ2luYWxUZW1wbGF0ZSk7XG4gICAgICBlbHNlIGlmIChzeW1ib2wgPT09ICcmJykgdmFsdWUgPSB0aGlzLnVuZXNjYXBlZFZhbHVlKHRva2VuLCBjb250ZXh0KTtcbiAgICAgIGVsc2UgaWYgKHN5bWJvbCA9PT0gJ25hbWUnKSB2YWx1ZSA9IHRoaXMuZXNjYXBlZFZhbHVlKHRva2VuLCBjb250ZXh0KTtcbiAgICAgIGVsc2UgaWYgKHN5bWJvbCA9PT0gJ3RleHQnKSB2YWx1ZSA9IHRoaXMucmF3VmFsdWUodG9rZW4pO1xuXG4gICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZClcbiAgICAgICAgYnVmZmVyICs9IHZhbHVlO1xuICAgIH1cblxuICAgIHJldHVybiBidWZmZXI7XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5yZW5kZXJTZWN0aW9uID0gZnVuY3Rpb24gcmVuZGVyU2VjdGlvbiAodG9rZW4sIGNvbnRleHQsIHBhcnRpYWxzLCBvcmlnaW5hbFRlbXBsYXRlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBidWZmZXIgPSAnJztcbiAgICB2YXIgdmFsdWUgPSBjb250ZXh0Lmxvb2t1cCh0b2tlblsxXSk7XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gcmVuZGVyIGFuIGFyYml0cmFyeSB0ZW1wbGF0ZVxuICAgIC8vIGluIHRoZSBjdXJyZW50IGNvbnRleHQgYnkgaGlnaGVyLW9yZGVyIHNlY3Rpb25zLlxuICAgIGZ1bmN0aW9uIHN1YlJlbmRlciAodGVtcGxhdGUpIHtcbiAgICAgIHJldHVybiBzZWxmLnJlbmRlcih0ZW1wbGF0ZSwgY29udGV4dCwgcGFydGlhbHMpO1xuICAgIH1cblxuICAgIGlmICghdmFsdWUpIHJldHVybjtcblxuICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgZm9yICh2YXIgaiA9IDAsIHZhbHVlTGVuZ3RoID0gdmFsdWUubGVuZ3RoOyBqIDwgdmFsdWVMZW5ndGg7ICsraikge1xuICAgICAgICBidWZmZXIgKz0gdGhpcy5yZW5kZXJUb2tlbnModG9rZW5bNF0sIGNvbnRleHQucHVzaCh2YWx1ZVtqXSksIHBhcnRpYWxzLCBvcmlnaW5hbFRlbXBsYXRlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICBidWZmZXIgKz0gdGhpcy5yZW5kZXJUb2tlbnModG9rZW5bNF0sIGNvbnRleHQucHVzaCh2YWx1ZSksIHBhcnRpYWxzLCBvcmlnaW5hbFRlbXBsYXRlKTtcbiAgICB9IGVsc2UgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICBpZiAodHlwZW9mIG9yaWdpbmFsVGVtcGxhdGUgIT09ICdzdHJpbmcnKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCB1c2UgaGlnaGVyLW9yZGVyIHNlY3Rpb25zIHdpdGhvdXQgdGhlIG9yaWdpbmFsIHRlbXBsYXRlJyk7XG5cbiAgICAgIC8vIEV4dHJhY3QgdGhlIHBvcnRpb24gb2YgdGhlIG9yaWdpbmFsIHRlbXBsYXRlIHRoYXQgdGhlIHNlY3Rpb24gY29udGFpbnMuXG4gICAgICB2YWx1ZSA9IHZhbHVlLmNhbGwoY29udGV4dC52aWV3LCBvcmlnaW5hbFRlbXBsYXRlLnNsaWNlKHRva2VuWzNdLCB0b2tlbls1XSksIHN1YlJlbmRlcik7XG5cbiAgICAgIGlmICh2YWx1ZSAhPSBudWxsKVxuICAgICAgICBidWZmZXIgKz0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ1ZmZlciArPSB0aGlzLnJlbmRlclRva2Vucyh0b2tlbls0XSwgY29udGV4dCwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpO1xuICAgIH1cbiAgICByZXR1cm4gYnVmZmVyO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUucmVuZGVySW52ZXJ0ZWQgPSBmdW5jdGlvbiByZW5kZXJJbnZlcnRlZCAodG9rZW4sIGNvbnRleHQsIHBhcnRpYWxzLCBvcmlnaW5hbFRlbXBsYXRlKSB7XG4gICAgdmFyIHZhbHVlID0gY29udGV4dC5sb29rdXAodG9rZW5bMV0pO1xuXG4gICAgLy8gVXNlIEphdmFTY3JpcHQncyBkZWZpbml0aW9uIG9mIGZhbHN5LiBJbmNsdWRlIGVtcHR5IGFycmF5cy5cbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2phbmwvbXVzdGFjaGUuanMvaXNzdWVzLzE4NlxuICAgIGlmICghdmFsdWUgfHwgKGlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCkpXG4gICAgICByZXR1cm4gdGhpcy5yZW5kZXJUb2tlbnModG9rZW5bNF0sIGNvbnRleHQsIHBhcnRpYWxzLCBvcmlnaW5hbFRlbXBsYXRlKTtcbiAgfTtcblxuICBXcml0ZXIucHJvdG90eXBlLnJlbmRlclBhcnRpYWwgPSBmdW5jdGlvbiByZW5kZXJQYXJ0aWFsICh0b2tlbiwgY29udGV4dCwgcGFydGlhbHMpIHtcbiAgICBpZiAoIXBhcnRpYWxzKSByZXR1cm47XG5cbiAgICB2YXIgdmFsdWUgPSBpc0Z1bmN0aW9uKHBhcnRpYWxzKSA/IHBhcnRpYWxzKHRva2VuWzFdKSA6IHBhcnRpYWxzW3Rva2VuWzFdXTtcbiAgICBpZiAodmFsdWUgIT0gbnVsbClcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlclRva2Vucyh0aGlzLnBhcnNlKHZhbHVlKSwgY29udGV4dCwgcGFydGlhbHMsIHZhbHVlKTtcbiAgfTtcblxuICBXcml0ZXIucHJvdG90eXBlLnVuZXNjYXBlZFZhbHVlID0gZnVuY3Rpb24gdW5lc2NhcGVkVmFsdWUgKHRva2VuLCBjb250ZXh0KSB7XG4gICAgdmFyIHZhbHVlID0gY29udGV4dC5sb29rdXAodG9rZW5bMV0pO1xuICAgIGlmICh2YWx1ZSAhPSBudWxsKVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuZXNjYXBlZFZhbHVlID0gZnVuY3Rpb24gZXNjYXBlZFZhbHVlICh0b2tlbiwgY29udGV4dCkge1xuICAgIHZhciB2YWx1ZSA9IGNvbnRleHQubG9va3VwKHRva2VuWzFdKTtcbiAgICBpZiAodmFsdWUgIT0gbnVsbClcbiAgICAgIHJldHVybiBtdXN0YWNoZS5lc2NhcGUodmFsdWUpO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUucmF3VmFsdWUgPSBmdW5jdGlvbiByYXdWYWx1ZSAodG9rZW4pIHtcbiAgICByZXR1cm4gdG9rZW5bMV07XG4gIH07XG5cbiAgbXVzdGFjaGUubmFtZSA9ICdtdXN0YWNoZS5qcyc7XG4gIG11c3RhY2hlLnZlcnNpb24gPSAnMi4yLjAnO1xuICBtdXN0YWNoZS50YWdzID0gWyAne3snLCAnfX0nIF07XG5cbiAgLy8gQWxsIGhpZ2gtbGV2ZWwgbXVzdGFjaGUuKiBmdW5jdGlvbnMgdXNlIHRoaXMgd3JpdGVyLlxuICB2YXIgZGVmYXVsdFdyaXRlciA9IG5ldyBXcml0ZXIoKTtcblxuICAvKipcbiAgICogQ2xlYXJzIGFsbCBjYWNoZWQgdGVtcGxhdGVzIGluIHRoZSBkZWZhdWx0IHdyaXRlci5cbiAgICovXG4gIG11c3RhY2hlLmNsZWFyQ2FjaGUgPSBmdW5jdGlvbiBjbGVhckNhY2hlICgpIHtcbiAgICByZXR1cm4gZGVmYXVsdFdyaXRlci5jbGVhckNhY2hlKCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFBhcnNlcyBhbmQgY2FjaGVzIHRoZSBnaXZlbiB0ZW1wbGF0ZSBpbiB0aGUgZGVmYXVsdCB3cml0ZXIgYW5kIHJldHVybnMgdGhlXG4gICAqIGFycmF5IG9mIHRva2VucyBpdCBjb250YWlucy4gRG9pbmcgdGhpcyBhaGVhZCBvZiB0aW1lIGF2b2lkcyB0aGUgbmVlZCB0b1xuICAgKiBwYXJzZSB0ZW1wbGF0ZXMgb24gdGhlIGZseSBhcyB0aGV5IGFyZSByZW5kZXJlZC5cbiAgICovXG4gIG11c3RhY2hlLnBhcnNlID0gZnVuY3Rpb24gcGFyc2UgKHRlbXBsYXRlLCB0YWdzKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRXcml0ZXIucGFyc2UodGVtcGxhdGUsIHRhZ3MpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW5kZXJzIHRoZSBgdGVtcGxhdGVgIHdpdGggdGhlIGdpdmVuIGB2aWV3YCBhbmQgYHBhcnRpYWxzYCB1c2luZyB0aGVcbiAgICogZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBtdXN0YWNoZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIgKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscykge1xuICAgIGlmICh0eXBlb2YgdGVtcGxhdGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIHRlbXBsYXRlISBUZW1wbGF0ZSBzaG91bGQgYmUgYSBcInN0cmluZ1wiICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAnYnV0IFwiJyArIHR5cGVTdHIodGVtcGxhdGUpICsgJ1wiIHdhcyBnaXZlbiBhcyB0aGUgZmlyc3QgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdhcmd1bWVudCBmb3IgbXVzdGFjaGUjcmVuZGVyKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscyknKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVmYXVsdFdyaXRlci5yZW5kZXIodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKTtcbiAgfTtcblxuICAvLyBUaGlzIGlzIGhlcmUgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGggMC40LnguLFxuICAvKmVzbGludC1kaXNhYmxlICovIC8vIGVzbGludCB3YW50cyBjYW1lbCBjYXNlZCBmdW5jdGlvbiBuYW1lXG4gIG11c3RhY2hlLnRvX2h0bWwgPSBmdW5jdGlvbiB0b19odG1sICh0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMsIHNlbmQpIHtcbiAgICAvKmVzbGludC1lbmFibGUqL1xuXG4gICAgdmFyIHJlc3VsdCA9IG11c3RhY2hlLnJlbmRlcih0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMpO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oc2VuZCkpIHtcbiAgICAgIHNlbmQocmVzdWx0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH07XG5cbiAgLy8gRXhwb3J0IHRoZSBlc2NhcGluZyBmdW5jdGlvbiBzbyB0aGF0IHRoZSB1c2VyIG1heSBvdmVycmlkZSBpdC5cbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzL2lzc3Vlcy8yNDRcbiAgbXVzdGFjaGUuZXNjYXBlID0gZXNjYXBlSHRtbDtcblxuICAvLyBFeHBvcnQgdGhlc2UgbWFpbmx5IGZvciB0ZXN0aW5nLCBidXQgYWxzbyBmb3IgYWR2YW5jZWQgdXNhZ2UuXG4gIG11c3RhY2hlLlNjYW5uZXIgPSBTY2FubmVyO1xuICBtdXN0YWNoZS5Db250ZXh0ID0gQ29udGV4dDtcbiAgbXVzdGFjaGUuV3JpdGVyID0gV3JpdGVyO1xuXG59KSk7XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqXG4gKiBAbW9kdWxlIGZlYXR1cmVzXFxiYXNlXG4gKiBAZGVzY3JpcHRpb25cbiBpbnN0YW5jZXMgb2YgZmVhdHVyZXMgYXJlIGNvbm5lY3RlZCB0byBvbmUgYW5vdGhlciB0byBtYWtlIGEgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHkgZm9yIGhhbmRsaW5nIGFsbCB0aGUgaW5wdXQgdG8gdGhlIGh5cGVyZ3JpZC5cbiAqXG4gKi9cblxuZnVuY3Rpb24gQ2VsbFByb3ZpZGVyKCkge1xuICAgIHRoaXMuY2VsbENhY2hlID0ge307XG4gICAgdGhpcy5pbml0aWFsaXplQ2VsbHMoKTtcbn07XG5cbkNlbGxQcm92aWRlci5wcm90b3R5cGUgPSB7fTtcblxudmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9O1xuXG52YXIgdmFsdWVPckZ1bmN0aW9uRXhlY3V0ZSA9IGZ1bmN0aW9uKGNvbmZpZywgdmFsdWVPckZ1bmN0aW9uKSB7XG4gICAgdmFyIGlzRnVuY3Rpb24gPSAoKCh0eXBlb2YgdmFsdWVPckZ1bmN0aW9uKVswXSkgPT09ICdmJyk7XG4gICAgdmFyIHJlc3VsdCA9IGlzRnVuY3Rpb24gPyB2YWx1ZU9yRnVuY3Rpb24oY29uZmlnKSA6IHZhbHVlT3JGdW5jdGlvbjtcbiAgICBpZiAoIXJlc3VsdCAmJiByZXN1bHQgIT09IDApIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxudmFyIHVuZGVybGluZSA9IGZ1bmN0aW9uKGNvbmZpZywgZ2MsIHRleHQsIHgsIHksIHRoaWNrbmVzcykge1xuICAgIHZhciB3aWR0aCA9IGNvbmZpZy5nZXRUZXh0V2lkdGgoZ2MsIHRleHQpO1xuXG4gICAgc3dpdGNoIChnYy50ZXh0QWxpZ24pIHtcbiAgICAgICAgY2FzZSAnY2VudGVyJzpcbiAgICAgICAgICAgIHggLT0gKHdpZHRoIC8gMik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgICAgeCAtPSB3aWR0aDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vZ2MuYmVnaW5QYXRoKCk7XG4gICAgZ2MubGluZVdpZHRoID0gdGhpY2tuZXNzO1xuICAgIGdjLm1vdmVUbyh4ICsgMC41LCB5ICsgMC41KTtcbiAgICBnYy5saW5lVG8oeCArIHdpZHRoICsgMC41LCB5ICsgMC41KTtcbn07XG5cbnZhciByb3VuZFJlY3QgPSBmdW5jdGlvbihnYywgeCwgeSwgd2lkdGgsIGhlaWdodCwgcmFkaXVzLCBmaWxsLCBzdHJva2UpIHtcbiAgICBpZiAoIXN0cm9rZSkge1xuICAgICAgICBzdHJva2UgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoIXJhZGl1cykge1xuICAgICAgICByYWRpdXMgPSA1O1xuICAgIH1cbiAgICBnYy5iZWdpblBhdGgoKTtcbiAgICBnYy5tb3ZlVG8oeCArIHJhZGl1cywgeSk7XG4gICAgZ2MubGluZVRvKHggKyB3aWR0aCAtIHJhZGl1cywgeSk7XG4gICAgZ2MucXVhZHJhdGljQ3VydmVUbyh4ICsgd2lkdGgsIHksIHggKyB3aWR0aCwgeSArIHJhZGl1cyk7XG4gICAgZ2MubGluZVRvKHggKyB3aWR0aCwgeSArIGhlaWdodCAtIHJhZGl1cyk7XG4gICAgZ2MucXVhZHJhdGljQ3VydmVUbyh4ICsgd2lkdGgsIHkgKyBoZWlnaHQsIHggKyB3aWR0aCAtIHJhZGl1cywgeSArIGhlaWdodCk7XG4gICAgZ2MubGluZVRvKHggKyByYWRpdXMsIHkgKyBoZWlnaHQpO1xuICAgIGdjLnF1YWRyYXRpY0N1cnZlVG8oeCwgeSArIGhlaWdodCwgeCwgeSArIGhlaWdodCAtIHJhZGl1cyk7XG4gICAgZ2MubGluZVRvKHgsIHkgKyByYWRpdXMpO1xuICAgIGdjLnF1YWRyYXRpY0N1cnZlVG8oeCwgeSwgeCArIHJhZGl1cywgeSk7XG4gICAgZ2MuY2xvc2VQYXRoKCk7XG4gICAgaWYgKHN0cm9rZSkge1xuICAgICAgICBnYy5zdHJva2UoKTtcbiAgICB9XG4gICAgaWYgKGZpbGwpIHtcbiAgICAgICAgZ2MuZmlsbCgpO1xuICAgIH1cbiAgICBnYy5jbG9zZVBhdGgoKTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAZGVzY3JpcHRpb24gcmVwbGFjZSB0aGlzIGZ1bmN0aW9uIGluIG9uIHlvdXIgaW5zdGFuY2Ugb2YgY2VsbFByb3ZpZGVyXG4gKiBAcmV0dXJucyBjZWxsXG4gKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIC0gYW4gb2JqZWN0IHdpdGggZXZlcnl0aGluZyB5b3UgbWlnaHQgbmVlZCBmb3IgcmVuZGVyZXJpbmcgYSBjZWxsXG4gKiBAaW5zdGFuY2VcbiAqL1xuQ2VsbFByb3ZpZGVyLnByb3RvdHlwZS5nZXRDZWxsID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgdmFyIGNlbGwgPSB0aGlzLmNlbGxDYWNoZS5zaW1wbGVDZWxsUmVuZGVyZXI7XG4gICAgY2VsbC5jb25maWcgPSBjb25maWc7XG4gICAgcmV0dXJuIGNlbGw7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGRlc2NyaXB0aW9uIHJlcGxhY2UgdGhpcyBmdW5jdGlvbiBpbiBvbiB5b3VyIGluc3RhbmNlIG9mIGNlbGxQcm92aWRlclxuICogQHJldHVybnMgY2VsbFxuICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZyAtIGFuIG9iamVjdCB3aXRoIGV2ZXJ5dGhpbmcgeW91IG1pZ2h0IG5lZWQgZm9yIHJlbmRlcmVyaW5nIGEgY2VsbFxuICogQGluc3RhbmNlXG4gKi9cbkNlbGxQcm92aWRlci5wcm90b3R5cGUuZ2V0Q29sdW1uSGVhZGVyQ2VsbCA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHZhciBjZWxsID0gdGhpcy5jZWxsQ2FjaGUuc2ltcGxlQ2VsbFJlbmRlcmVyO1xuICAgIGNlbGwuY29uZmlnID0gY29uZmlnO1xuICAgIHJldHVybiBjZWxsO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBkZXNjcmlwdGlvbiByZXBsYWNlIHRoaXMgZnVuY3Rpb24gaW4gb24geW91ciBpbnN0YW5jZSBvZiBjZWxsUHJvdmlkZXJcbiAqIEByZXR1cm5zIGNlbGxcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgLSBhbiBvYmplY3Qgd2l0aCBldmVyeXRoaW5nIHlvdSBtaWdodCBuZWVkIGZvciByZW5kZXJlcmluZyBhIGNlbGxcbiAqIEBpbnN0YW5jZVxuICovXG5DZWxsUHJvdmlkZXIucHJvdG90eXBlLmdldFJvd0hlYWRlckNlbGwgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbENhY2hlLnNpbXBsZUNlbGxSZW5kZXJlcjtcbiAgICBjZWxsLmNvbmZpZyA9IGNvbmZpZztcbiAgICByZXR1cm4gY2VsbDtcbn07XG5cbkNlbGxQcm92aWRlci5wcm90b3R5cGUucGFpbnRCdXR0b24gPSBmdW5jdGlvbihnYywgY29uZmlnKSB7XG4gICAgdmFyIHZhbCA9IGNvbmZpZy52YWx1ZTtcbiAgICB2YXIgYyA9IGNvbmZpZy54O1xuICAgIHZhciByID0gY29uZmlnLnk7XG4gICAgdmFyIGJvdW5kcyA9IGNvbmZpZy5ib3VuZHM7XG4gICAgdmFyIHggPSBib3VuZHMueCArIDI7XG4gICAgdmFyIHkgPSBib3VuZHMueSArIDI7XG4gICAgdmFyIHdpZHRoID0gYm91bmRzLndpZHRoIC0gMztcbiAgICB2YXIgaGVpZ2h0ID0gYm91bmRzLmhlaWdodCAtIDM7XG4gICAgdmFyIHJhZGl1cyA9IGhlaWdodCAvIDI7XG4gICAgdmFyIGFyY0dyYWRpZW50ID0gZ2MuY3JlYXRlTGluZWFyR3JhZGllbnQoeCwgeSwgeCwgeSArIGhlaWdodCk7XG4gICAgaWYgKGNvbmZpZy5tb3VzZURvd24pIHtcbiAgICAgICAgYXJjR3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsICcjQjVDQkVEJyk7XG4gICAgICAgIGFyY0dyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAnIzRkNzRlYScpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFyY0dyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAnI2ZmZmZmZicpO1xuICAgICAgICBhcmNHcmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJyNhYWFhYWEnKTtcbiAgICB9XG4gICAgZ2MuZmlsbFN0eWxlID0gYXJjR3JhZGllbnQ7XG4gICAgZ2Muc3Ryb2tlU3R5bGUgPSAnIzAwMDAwMCc7XG4gICAgcm91bmRSZWN0KGdjLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCByYWRpdXMsIGFyY0dyYWRpZW50LCB0cnVlKTtcblxuICAgIHZhciBveCA9ICh3aWR0aCAtIGNvbmZpZy5nZXRUZXh0V2lkdGgoZ2MsIHZhbCkpIC8gMjtcbiAgICB2YXIgb3kgPSAoaGVpZ2h0IC0gY29uZmlnLmdldFRleHRIZWlnaHQoZ2MuZm9udCkuZGVzY2VudCkgLyAyO1xuXG4gICAgaWYgKGdjLnRleHRCYXNlbGluZSAhPT0gJ21pZGRsZScpIHtcbiAgICAgICAgZ2MudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XG4gICAgfVxuXG4gICAgZ2MuZmlsbFN0eWxlID0gJyMwMDAwMDAnO1xuXG4gICAgY29uZmlnLmJhY2tncm91bmRDb2xvciA9ICdyZ2JhKDAsMCwwLDApJztcbiAgICBnYy5maWxsVGV4dCh2YWwsIHggKyBveCwgeSArIG95KTtcblxuICAgIC8vaWRlbnRpZnkgdGhhdCB3ZSBhcmUgYSBidXR0b25cbiAgICBjb25maWcuYnV0dG9uQ2VsbHNbYyArICcsJyArIHJdID0gdHJ1ZTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0NhbnZhc0dyYXBoaWNzQ29udGV4dH0gZ2MgLSB0aGUgXCJwZW5cIiBpbiB0aGUgbXZjIG1vZGVsLCB3ZSBpc3N1ZSBkcmF3aW5nIGNvbW1hbmRzIHRvXG4gKiBAcGFyYW0ge2ludGVnZXJ9IHggLSB0aGUgeCBzY3JlZW4gY29vcmRpbmF0ZSBvZiBteSBvcmlnaW5cbiAqIEBwYXJhbSB7aW50ZWdlcn0geSAtIHRoZSB5IHNjcmVlbiBjb29yZGluYXRlIG9mIG15IG9yaWdpblxuICogQHBhcmFtIHtpbnRlZ2VyfSB3aWR0aCAtIHRoZSB3aWR0aCBJJ20gYWxsb3dlZCB0byBkcmF3IHdpdGhpblxuICogQHBhcmFtIHtpbnRlZ2VyfSBoZWlnaHQgLSB0aGUgaGVpZ2h0IEknbSBhbGxvd2VkIHRvIGRyYXcgd2l0aGluXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGlzTGluayAtIGlzIHRoaXMgYSBoeXBlcmxpbmsgY2VsbFxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cblRoaXMgaXMgdGhlIGRlZmF1bHQgY2VsbCByZW5kZXJpbmcgZnVuY3Rpb24gZm9yIHJlbmRlcmluZyBhIHZhbmlsbGEgY2VsbC4gR3JlYXQgY2FyZSB3YXMgdGFrZW4gaW4gY3JhZnRpbmcgdGhpcyBmdW5jdGlvbiBhcyBpdCBuZWVkcyB0byBwZXJmb3JtIGV4dHJlbWVseSBmYXN0LiBSZWFkcyBvbiB0aGUgZ2Mgb2JqZWN0IGFyZSBleHBlbnNpdmUgYnV0IG5vdCBxdWl0ZSBhcyBleHBlbnNpdmUgYXMgd3JpdGVzIHRvIGl0LiBXZSBkbyBvdXIgYmVzdCB0byBhdm9pZCB3cml0ZXMsIHRoZW4gYXZvaWQgcmVhZHMuIENsaXBwaW5nIGJvdW5kcyBhcmUgbm90IHNldCBoZXJlIGFzIHRoaXMgaXMgYWxzbyBhbiBleHBlbnNpdmUgb3BlcmF0aW9uLiBJbnN0ZWFkLCB3ZSB0cnVuY2F0ZSBvdmVyZmxvd2luZyB0ZXh0IGFuZCBjb250ZW50IGJ5IGZpbGxpbmcgYSByZWN0YW5nbGUgd2l0aCBiYWNrZ3JvdW5kIGNvbG9yIGNvbHVtbiBieSBjb2x1bW4gaW5zdGVhZCBvZiBjZWxsIGJ5IGNlbGwuICBUaGlzIGNvbHVtbiBieSBjb2x1bW4gZmlsbCBoYXBwZW5zIGhpZ2hlciB1cCBvbiB0aGUgc3RhY2sgaW4gYSBjYWxsaW5nIGZ1bmN0aW9uIGZyb20gZmluLWh5cGVyZ3JpZC1yZW5kZXJlci4gIFRha2Ugbm90ZSB3ZSBkbyBub3QgZG8gY2VsbCBieSBjZWxsIGJvcmRlciByZW5kZXJlcmluZyBhcyB0aGF0IGlzIGV4cGVuc2l2ZS4gIEluc3RlYWQgd2UgcmVuZGVyIG1hbnkgZmV3ZXIgZ3JpZGxpbmVzIGFmdGVyIGFsbCBjZWxscyBhcmUgcmVuZGVyZWQuXG4qL1xuQ2VsbFByb3ZpZGVyLnByb3RvdHlwZS5kZWZhdWx0Q2VsbFBhaW50ID0gZnVuY3Rpb24oZ2MsIGNvbmZpZykge1xuXG4gICAgdmFyIGlzTGluayA9IGlzTGluayB8fCBmYWxzZTtcbiAgICB2YXIgY29sSEVkZ2VPZmZzZXQgPSBjb25maWcuY2VsbFBhZGRpbmcsXG4gICAgICAgIGhhbGlnbk9mZnNldCA9IDAsXG4gICAgICAgIHZhbGlnbk9mZnNldCA9IGNvbmZpZy52b2Zmc2V0LFxuICAgICAgICBoYWxpZ24gPSBjb25maWcuaGFsaWduLFxuICAgICAgICBpc0NvbHVtbkhvdmVyZWQgPSBjb25maWcuaXNDb2x1bW5Ib3ZlcmVkLFxuICAgICAgICBpc1Jvd0hvdmVyZWQgPSBjb25maWcuaXNSb3dIb3ZlcmVkLFxuICAgICAgICB2YWwgPSBjb25maWcudmFsdWUsXG4gICAgICAgIHggPSBjb25maWcuYm91bmRzLngsXG4gICAgICAgIHkgPSBjb25maWcuYm91bmRzLnksXG4gICAgICAgIHdpZHRoID0gY29uZmlnLmJvdW5kcy53aWR0aCxcbiAgICAgICAgaGVpZ2h0ID0gY29uZmlnLmJvdW5kcy5oZWlnaHQ7XG5cbiAgICB2YXIgbGVmdEljb24sIHJpZ2h0SWNvbiwgY2VudGVySWNvbiwgaXhvZmZzZXQsIGl5b2Zmc2V0O1xuXG4gICAgLy9zZXR0aW5nIGdjIHByb3BlcnRpZXMgYXJlIGV4cGVuc2l2ZSwgbGV0cyBub3QgZG8gaXQgdW5uZWNlc3NhcmlseVxuXG4gICAgaWYgKHZhbCAmJiB2YWwuY29uc3RydWN0b3IgPT09IEFycmF5KSB7XG4gICAgICAgIGxlZnRJY29uID0gdmFsWzBdO1xuICAgICAgICByaWdodEljb24gPSB2YWxbMl07XG4gICAgICAgIHZhbCA9IHZhbFsxXTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnKSB7IC8vIG11c3QgYmUgYW4gaW1hZ2VcbiAgICAgICAgICAgIGNlbnRlckljb24gPSB2YWw7XG4gICAgICAgICAgICB2YWwgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZWZ0SWNvbiAmJiBsZWZ0SWNvbi5ub2RlTmFtZSAhPT0gJ0lNRycpIHtcbiAgICAgICAgICAgIGxlZnRJY29uID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmlnaHRJY29uICYmIHJpZ2h0SWNvbi5ub2RlTmFtZSAhPT0gJ0lNRycpIHtcbiAgICAgICAgICAgIHJpZ2h0SWNvbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNlbnRlckljb24gJiYgY2VudGVySWNvbi5ub2RlTmFtZSAhPT0gJ0lNRycpIHtcbiAgICAgICAgICAgIGNlbnRlckljb24gPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFsID0gdmFsdWVPckZ1bmN0aW9uRXhlY3V0ZShjb25maWcsIHZhbCk7XG5cbiAgICBpZiAoZ2MuZm9udCAhPT0gY29uZmlnLmZvbnQpIHtcbiAgICAgICAgZ2MuZm9udCA9IGNvbmZpZy5mb250O1xuICAgIH1cbiAgICBpZiAoZ2MudGV4dEFsaWduICE9PSAnbGVmdCcpIHtcbiAgICAgICAgZ2MudGV4dEFsaWduID0gJ2xlZnQnO1xuICAgIH1cbiAgICBpZiAoZ2MudGV4dEJhc2VsaW5lICE9PSAnbWlkZGxlJykge1xuICAgICAgICBnYy50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcbiAgICB9XG5cbiAgICB2YXIgZm9udE1ldHJpY3MgPSBjb25maWcuZ2V0VGV4dEhlaWdodChjb25maWcuZm9udCk7XG4gICAgdmFyIHRleHRXaWR0aCA9IGNvbmZpZy5nZXRUZXh0V2lkdGgoZ2MsIHZhbCk7XG5cblxuICAgIC8vd2UgbXVzdCBzZXQgdGhpcyBpbiBvcmRlciB0byBjb21wdXRlIHRoZSBtaW5pbXVtIHdpZHRoXG4gICAgLy9mb3IgY29sdW1uIGF1dG9zaXppbmcgcHVycG9zZXNcbiAgICBjb25maWcubWluV2lkdGggPSB0ZXh0V2lkdGggKyAoMiAqIGNvbEhFZGdlT2Zmc2V0KTtcblxuICAgIGlmIChoYWxpZ24gPT09ICdyaWdodCcpIHtcbiAgICAgICAgLy90ZXh0V2lkdGggPSBjb25maWcuZ2V0VGV4dFdpZHRoKGdjLCBjb25maWcudmFsdWUpO1xuICAgICAgICBoYWxpZ25PZmZzZXQgPSB3aWR0aCAtIGNvbEhFZGdlT2Zmc2V0IC0gdGV4dFdpZHRoO1xuICAgIH0gZWxzZSBpZiAoaGFsaWduID09PSAnY2VudGVyJykge1xuICAgICAgICAvL3RleHRXaWR0aCA9IGNvbmZpZy5nZXRUZXh0V2lkdGgoZ2MsIGNvbmZpZy52YWx1ZSk7XG4gICAgICAgIGhhbGlnbk9mZnNldCA9ICh3aWR0aCAtIHRleHRXaWR0aCkgLyAyO1xuICAgIH0gZWxzZSBpZiAoaGFsaWduID09PSAnbGVmdCcpIHtcbiAgICAgICAgaGFsaWduT2Zmc2V0ID0gY29sSEVkZ2VPZmZzZXQ7XG4gICAgfVxuXG4gICAgaGFsaWduT2Zmc2V0ID0gTWF0aC5tYXgoMCwgaGFsaWduT2Zmc2V0KTtcbiAgICB2YWxpZ25PZmZzZXQgPSB2YWxpZ25PZmZzZXQgKyBNYXRoLmNlaWwoaGVpZ2h0IC8gMik7XG5cbiAgICAvL2ZpbGwgYmFja2dyb3VuZCBvbmx5IGlmIG91ciBiZ0NvbG9yIGlzIHBvcHVsYXRlZCBvciB3ZSBhcmUgYSBzZWxlY3RlZCBjZWxsXG4gICAgaWYgKGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IgfHwgY29uZmlnLmlzU2VsZWN0ZWQpIHtcbiAgICAgICAgZ2MuZmlsbFN0eWxlID0gdmFsdWVPckZ1bmN0aW9uRXhlY3V0ZShjb25maWcsIGNvbmZpZy5pc1NlbGVjdGVkID8gY29uZmlnLmJhY2tncm91bmRTZWxlY3Rpb25Db2xvciA6IGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IpO1xuICAgICAgICBnYy5maWxsUmVjdCh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICB9XG5cbiAgICAvL2RyYXcgdGV4dFxuICAgIHZhciB0aGVDb2xvciA9IHZhbHVlT3JGdW5jdGlvbkV4ZWN1dGUoY29uZmlnLCBjb25maWcuaXNTZWxlY3RlZCA/IGNvbmZpZy5mb3JlZ3JvdW5kU2VsZWN0aW9uQ29sb3IgOiBjb25maWcuY29sb3IpO1xuICAgIGlmIChnYy5maWxsU3R5bGUgIT09IHRoZUNvbG9yKSB7XG4gICAgICAgIGdjLmZpbGxTdHlsZSA9IHRoZUNvbG9yO1xuICAgICAgICBnYy5zdHJva2VTdHlsZSA9IHRoZUNvbG9yO1xuICAgIH1cbiAgICBpZiAodmFsICE9PSBudWxsKSB7XG4gICAgICAgIGdjLmZpbGxUZXh0KHZhbCwgeCArIGhhbGlnbk9mZnNldCwgeSArIHZhbGlnbk9mZnNldCk7XG5cbiAgICB9XG4gICAgaWYgKGlzQ29sdW1uSG92ZXJlZCAmJiBpc1Jvd0hvdmVyZWQpIHtcbiAgICAgICAgZ2MuYmVnaW5QYXRoKCk7XG4gICAgICAgIGlmIChpc0xpbmspIHtcbiAgICAgICAgICAgIHVuZGVybGluZShjb25maWcsIGdjLCB2YWwsIHggKyBoYWxpZ25PZmZzZXQsIHkgKyB2YWxpZ25PZmZzZXQgKyBNYXRoLmZsb29yKGZvbnRNZXRyaWNzLmhlaWdodCAvIDIpLCAxKTtcbiAgICAgICAgICAgIGdjLnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgICAgIGdjLmNsb3NlUGF0aCgpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnLmlzSW5DdXJyZW50U2VsZWN0aW9uUmVjdGFuZ2xlKSB7XG4gICAgICAgIGdjLmZpbGxTdHlsZSA9ICdyZ2JhKDAsIDAsIDAsIDAuMiknO1xuICAgICAgICBnYy5maWxsUmVjdCh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICB9XG4gICAgdmFyIGljb25XaWR0aCA9IDA7XG4gICAgaWYgKGxlZnRJY29uKSB7XG4gICAgICAgIGl5b2Zmc2V0ID0gTWF0aC5yb3VuZCgoaGVpZ2h0IC0gbGVmdEljb24uaGVpZ2h0KSAvIDIpO1xuICAgICAgICBpeG9mZnNldCA9IE1hdGgucm91bmQoKGhhbGlnbk9mZnNldCAtIGxlZnRJY29uLndpZHRoKSAvIDIpO1xuICAgICAgICBnYy5kcmF3SW1hZ2UobGVmdEljb24sIHggKyBpeG9mZnNldCwgeSArIGl5b2Zmc2V0KTtcbiAgICAgICAgaWNvbldpZHRoID0gTWF0aC5tYXgobGVmdEljb24ud2lkdGggKyAyKTtcbiAgICB9XG4gICAgaWYgKHJpZ2h0SWNvbikge1xuICAgICAgICBpeW9mZnNldCA9IE1hdGgucm91bmQoKGhlaWdodCAtIHJpZ2h0SWNvbi5oZWlnaHQpIC8gMik7XG4gICAgICAgIGl4b2Zmc2V0ID0gMDsgLy9NYXRoLnJvdW5kKChoYWxpZ25PZmZzZXQgLSByaWdodEljb24ud2lkdGgpIC8gMik7XG4gICAgICAgIGdjLmRyYXdJbWFnZShyaWdodEljb24sIHggKyB3aWR0aCAtIGl4b2Zmc2V0IC0gcmlnaHRJY29uLndpZHRoLCB5ICsgaXlvZmZzZXQpO1xuICAgICAgICBpY29uV2lkdGggPSBNYXRoLm1heChyaWdodEljb24ud2lkdGggKyAyKTtcbiAgICB9XG4gICAgaWYgKGNlbnRlckljb24pIHtcbiAgICAgICAgaXlvZmZzZXQgPSBNYXRoLnJvdW5kKChoZWlnaHQgLSBjZW50ZXJJY29uLmhlaWdodCkgLyAyKTtcbiAgICAgICAgaXhvZmZzZXQgPSBNYXRoLnJvdW5kKCh3aWR0aCAtIGNlbnRlckljb24ud2lkdGgpIC8gMik7XG4gICAgICAgIGdjLmRyYXdJbWFnZShjZW50ZXJJY29uLCB4ICsgd2lkdGggLSBpeG9mZnNldCAtIGNlbnRlckljb24ud2lkdGgsIHkgKyBpeW9mZnNldCk7XG4gICAgICAgIGljb25XaWR0aCA9IE1hdGgubWF4KGNlbnRlckljb24ud2lkdGggKyAyKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5jZWxsQm9yZGVyVGhpY2tuZXNzKSB7XG4gICAgICAgIGdjLmJlZ2luUGF0aCgpO1xuICAgICAgICBnYy5yZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICBnYy5saW5lV2lkdGggPSBjb25maWcuY2VsbEJvcmRlclRoaWNrbmVzcztcbiAgICAgICAgZ2Muc3Ryb2tlU3R5bGUgPSBjb25maWcuY2VsbEJvcmRlclN0eWxlO1xuXG4gICAgICAgIC8vIGFuaW1hdGUgdGhlIGRhc2hlZCBsaW5lIGEgYml0IGhlcmUgZm9yIGZ1blxuXG4gICAgICAgIGdjLnN0cm9rZSgpO1xuICAgICAgICBnYy5jbG9zZVBhdGgoKTtcbiAgICB9XG4gICAgY29uZmlnLm1pbldpZHRoID0gY29uZmlnLm1pbldpZHRoICsgMiAqIChpY29uV2lkdGgpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7Q2FudmFzR3JhcGhpY3NDb250ZXh0fSBnYyAtIHRoZSBcInBlblwiIGluIHRoZSBtdmMgbW9kZWwsIHdlIGlzc3VlIGRyYXdpbmcgY29tbWFuZHMgdG9cbiAqIEBwYXJhbSB7aW50ZWdlcn0geCAtIHRoZSB4IHNjcmVlbiBjb29yZGluYXRlIG9mIG15IG9yaWdpblxuICogQHBhcmFtIHtpbnRlZ2VyfSB5IC0gdGhlIHkgc2NyZWVuIGNvb3JkaW5hdGUgb2YgbXkgb3JpZ2luXG4gKiBAcGFyYW0ge2ludGVnZXJ9IHdpZHRoIC0gdGhlIHdpZHRoIEknbSBhbGxvd2VkIHRvIGRyYXcgd2l0aGluXG4gKiBAcGFyYW0ge2ludGVnZXJ9IGhlaWdodCAtIHRoZSBoZWlnaHQgSSdtIGFsbG93ZWQgdG8gZHJhdyB3aXRoaW5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNMaW5rIC0gaXMgdGhpcyBhIGh5cGVybGluayBjZWxsXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvbiBlbWVyc29ucyBwYWludCBmdW5jdGlvbiBmb3IgYSBzbGlkZXIgYnV0dG9uLiBjdXJyZW50bHkgdGhlIHVzZXIgY2Fubm90IGludGVyYWN0IHdpdGggaXRcbiAqL1xuQ2VsbFByb3ZpZGVyLnByb3RvdHlwZS5wYWludFNsaWRlciA9IGZ1bmN0aW9uKCAvKiBnYywgeCwgeSwgd2lkdGgsIGhlaWdodCAqLyApIHtcbiAgICAvLyBnYy5zdHJva2VTdHlsZSA9ICd3aGl0ZSc7XG4gICAgLy8gdmFyIHZhbCA9IHRoaXMuY29uZmlnLnZhbHVlO1xuICAgIC8vIHZhciByYWRpdXMgPSBoZWlnaHQgLyAyO1xuICAgIC8vIHZhciBvZmZzZXQgPSB3aWR0aCAqIHZhbDtcbiAgICAvLyB2YXIgYmdDb2xvciA9IHRoaXMuY29uZmlnLmlzU2VsZWN0ZWQgPyB0aGlzLmNvbmZpZy5iZ1NlbENvbG9yIDogJyMzMzMzMzMnO1xuICAgIC8vIHZhciBidG5HcmFkaWVudCA9IGdjLmNyZWF0ZUxpbmVhckdyYWRpZW50KHgsIHksIHgsIHkgKyBoZWlnaHQpO1xuICAgIC8vIGJ0bkdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCBiZ0NvbG9yKTtcbiAgICAvLyBidG5HcmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJyM2NjY2NjYnKTtcbiAgICAvLyB2YXIgYXJjR3JhZGllbnQgPSBnYy5jcmVhdGVMaW5lYXJHcmFkaWVudCh4LCB5LCB4LCB5ICsgaGVpZ2h0KTtcbiAgICAvLyBhcmNHcmFkaWVudC5hZGRDb2xvclN0b3AoMCwgJyNhYWFhYWEnKTtcbiAgICAvLyBhcmNHcmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJyM3Nzc3NzcnKTtcbiAgICAvLyBnYy5maWxsU3R5bGUgPSBidG5HcmFkaWVudDtcbiAgICAvLyByb3VuZFJlY3QoZ2MsIHgsIHksIHdpZHRoLCBoZWlnaHQsIHJhZGl1cywgYnRuR3JhZGllbnQpO1xuICAgIC8vIGlmICh2YWwgPCAxLjApIHtcbiAgICAvLyAgICAgZ2MuZmlsbFN0eWxlID0gYXJjR3JhZGllbnQ7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgICAgZ2MuZmlsbFN0eWxlID0gJyNlZWVlZWUnO1xuICAgIC8vIH1cbiAgICAvLyBnYy5iZWdpblBhdGgoKTtcbiAgICAvLyBnYy5hcmMoeCArIE1hdGgubWF4KG9mZnNldCAtIHJhZGl1cywgcmFkaXVzKSwgeSArIHJhZGl1cywgcmFkaXVzLCAwLCAyICogTWF0aC5QSSk7XG4gICAgLy8gZ2MuZmlsbCgpO1xuICAgIC8vIGdjLmNsb3NlUGF0aCgpO1xuICAgIC8vIHRoaXMuY29uZmlnLm1pbldpZHRoID0gMTAwO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7Q2FudmFzR3JhcGhpY3NDb250ZXh0fSBnYyAtIHRoZSBcInBlblwiIGluIHRoZSBtdmMgbW9kZWwsIHdlIGlzc3VlIGRyYXdpbmcgY29tbWFuZHMgdG9cbiAqIEBwYXJhbSB7aW50ZWdlcn0geCAtIHRoZSB4IHNjcmVlbiBjb29yZGluYXRlIG9mIG15IG9yaWdpblxuICogQHBhcmFtIHtpbnRlZ2VyfSB5IC0gdGhlIHkgc2NyZWVuIGNvb3JkaW5hdGUgb2YgbXkgb3JpZ2luXG4gKiBAcGFyYW0ge2ludGVnZXJ9IHdpZHRoIC0gdGhlIHdpZHRoIEknbSBhbGxvd2VkIHRvIGRyYXcgd2l0aGluXG4gKiBAcGFyYW0ge2ludGVnZXJ9IGhlaWdodCAtIHRoZSBoZWlnaHQgSSdtIGFsbG93ZWQgdG8gZHJhdyB3aXRoaW5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNMaW5rIC0gaXMgdGhpcyBhIGh5cGVybGluayBjZWxsXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuIHNpbXBsZSBpbXBsZW1lbnRhdGlvbiBvZiBhIHNwYXJrbGluZS4gIHNlZSBbRWR3YXJkIFR1ZnRlIHNwYXJrbGluZV0oaHR0cDovL3d3dy5lZHdhcmR0dWZ0ZS5jb20vYmJvYXJkL3EtYW5kLWEtZmV0Y2gtbXNnP21zZ19pZD0wMDAxT1IpXG4gKi9cbkNlbGxQcm92aWRlci5wcm90b3R5cGUucGFpbnRTcGFya2JhciA9IGZ1bmN0aW9uKGdjLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgZ2MuYmVnaW5QYXRoKCk7XG4gICAgdmFyIHZhbCA9IHRoaXMuY29uZmlnLnZhbHVlO1xuICAgIGlmICghdmFsIHx8ICF2YWwubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGNvdW50ID0gdmFsLmxlbmd0aDtcbiAgICB2YXIgZVdpZHRoID0gd2lkdGggLyBjb3VudDtcbiAgICB2YXIgZmdDb2xvciA9IHRoaXMuY29uZmlnLmlzU2VsZWN0ZWQgPyB0aGlzLmNvbmZpZy5mZ1NlbENvbG9yIDogdGhpcy5jb25maWcuZmdDb2xvcjtcbiAgICBpZiAodGhpcy5jb25maWcuYmdDb2xvciB8fCB0aGlzLmNvbmZpZy5pc1NlbGVjdGVkKSB7XG4gICAgICAgIGdjLmZpbGxTdHlsZSA9IHRoaXMuY29uZmlnLmlzU2VsZWN0ZWQgPyB0aGlzLmNvbmZpZy5iZ1NlbENvbG9yIDogdGhpcy5jb25maWcuYmdDb2xvcjtcbiAgICAgICAgZ2MuZmlsbFJlY3QoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgfVxuICAgIGdjLmZpbGxTdHlsZSA9IGZnQ29sb3I7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGJhcmhlaWdodCA9IHZhbFtpXSAvIDExMCAqIGhlaWdodDtcbiAgICAgICAgZ2MuZmlsbFJlY3QoeCArIDUsIHkgKyBoZWlnaHQgLSBiYXJoZWlnaHQsIGVXaWR0aCAqIDAuNjY2NiwgYmFyaGVpZ2h0KTtcbiAgICAgICAgeCA9IHggKyBlV2lkdGg7XG4gICAgfVxuICAgIGdjLmNsb3NlUGF0aCgpO1xuICAgIHRoaXMuY29uZmlnLm1pbldpZHRoID0gY291bnQgKiAxMDtcblxufTtcblxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtDYW52YXNHcmFwaGljc0NvbnRleHR9IGdjIC0gdGhlIFwicGVuXCIgaW4gdGhlIG12YyBtb2RlbCwgd2UgaXNzdWUgZHJhd2luZyBjb21tYW5kcyB0b1xuICogQHBhcmFtIHtpbnRlZ2VyfSB4IC0gdGhlIHggc2NyZWVuIGNvb3JkaW5hdGUgb2YgbXkgb3JpZ2luXG4gKiBAcGFyYW0ge2ludGVnZXJ9IHkgLSB0aGUgeSBzY3JlZW4gY29vcmRpbmF0ZSBvZiBteSBvcmlnaW5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gd2lkdGggLSB0aGUgd2lkdGggSSdtIGFsbG93ZWQgdG8gZHJhdyB3aXRoaW5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gaGVpZ2h0IC0gdGhlIGhlaWdodCBJJ20gYWxsb3dlZCB0byBkcmF3IHdpdGhpblxuICogQHBhcmFtIHtib29sZWFufSBpc0xpbmsgLSBpcyB0aGlzIGEgaHlwZXJsaW5rIGNlbGxcbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5zaW1wbGUgaW1wbGVtZW50YXRpb24gb2YgYSBzcGFya2xpbmUsIGJlY2F1c2UgaXQncyBhIGJhcmNoYXJ0IHdlJ3ZlIGNoYW5nZWQgdGhlIG5hbWUgOykuICBzZWUgW0Vkd2FyZCBUdWZ0ZSBzcGFya2xpbmVdKGh0dHA6Ly93d3cuZWR3YXJkdHVmdGUuY29tL2Jib2FyZC9xLWFuZC1hLWZldGNoLW1zZz9tc2dfaWQ9MDAwMU9SKVxuKi9cbkNlbGxQcm92aWRlci5wcm90b3R5cGUucGFpbnRTcGFya2xpbmUgPSBmdW5jdGlvbihnYywgeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgIGdjLmJlZ2luUGF0aCgpO1xuICAgIHZhciB2YWwgPSB0aGlzLmNvbmZpZy52YWx1ZTtcbiAgICBpZiAoIXZhbCB8fCAhdmFsLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjb3VudCA9IHZhbC5sZW5ndGg7XG4gICAgdmFyIGVXaWR0aCA9IHdpZHRoIC8gY291bnQ7XG5cbiAgICB2YXIgZmdDb2xvciA9IHRoaXMuY29uZmlnLmlzU2VsZWN0ZWQgPyB0aGlzLmNvbmZpZy5mZ1NlbENvbG9yIDogdGhpcy5jb25maWcuZmdDb2xvcjtcbiAgICBpZiAodGhpcy5jb25maWcuYmdDb2xvciB8fCB0aGlzLmNvbmZpZy5pc1NlbGVjdGVkKSB7XG4gICAgICAgIGdjLmZpbGxTdHlsZSA9IHRoaXMuY29uZmlnLmlzU2VsZWN0ZWQgPyB0aGlzLmNvbmZpZy5iZ1NlbENvbG9yIDogdGhpcy5jb25maWcuYmdDb2xvcjtcbiAgICAgICAgZ2MuZmlsbFJlY3QoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgfVxuICAgIGdjLnN0cm9rZVN0eWxlID0gZmdDb2xvcjtcbiAgICBnYy5maWxsU3R5bGUgPSBmZ0NvbG9yO1xuICAgIGdjLmJlZ2luUGF0aCgpO1xuICAgIHZhciBwcmV2O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBiYXJoZWlnaHQgPSB2YWxbaV0gLyAxMTAgKiBoZWlnaHQ7XG4gICAgICAgIGlmICghcHJldikge1xuICAgICAgICAgICAgcHJldiA9IGJhcmhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBnYy5saW5lVG8oeCArIDUsIHkgKyBoZWlnaHQgLSBiYXJoZWlnaHQpO1xuICAgICAgICBnYy5hcmMoeCArIDUsIHkgKyBoZWlnaHQgLSBiYXJoZWlnaHQsIDEsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgIHggPSB4ICsgZVdpZHRoO1xuICAgIH1cbiAgICB0aGlzLmNvbmZpZy5taW5XaWR0aCA9IGNvdW50ICogMTA7XG4gICAgZ2Muc3Ryb2tlKCk7XG4gICAgZ2MuY2xvc2VQYXRoKCk7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtDYW52YXNHcmFwaGljc0NvbnRleHR9IGdjIC0gdGhlIFwicGVuXCIgaW4gdGhlIG12YyBtb2RlbCwgd2UgaXNzdWUgZHJhd2luZyBjb21tYW5kcyB0b1xuICogQHBhcmFtIHtpbnRlZ2VyfSB4IC0gdGhlIHggc2NyZWVuIGNvb3JkaW5hdGUgb2YgbXkgb3JpZ2luXG4gKiBAcGFyYW0ge2ludGVnZXJ9IHkgLSB0aGUgeSBzY3JlZW4gY29vcmRpbmF0ZSBvZiBteSBvcmlnaW5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gd2lkdGggLSB0aGUgd2lkdGggSSdtIGFsbG93ZWQgdG8gZHJhdyB3aXRoaW5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gaGVpZ2h0IC0gdGhlIGhlaWdodCBJJ20gYWxsb3dlZCB0byBkcmF3IHdpdGhpblxuICogQHBhcmFtIHtib29sZWFufSBpc0xpbmsgLSBpcyB0aGlzIGEgaHlwZXJsaW5rIGNlbGxcbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG4gdGhpcyBpcyBhIHNpbXBsZSBpbXBsZW1lbnRhdGlvbiBvZiBhIHRyZWUgY2VsbCByZW5kZXJlciBmb3IgdXNlIG1haW5seSB3aXRoIHRoZSBxdHJlZVxuICovXG5DZWxsUHJvdmlkZXIucHJvdG90eXBlLnRyZWVDZWxsUmVuZGVyZXIgPSBmdW5jdGlvbihnYywgeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgIHZhciB2YWwgPSB0aGlzLmNvbmZpZy52YWx1ZS5kYXRhO1xuICAgIHZhciBpbmRlbnQgPSB0aGlzLmNvbmZpZy52YWx1ZS5pbmRlbnQ7XG4gICAgdmFyIGljb24gPSB0aGlzLmNvbmZpZy52YWx1ZS5pY29uO1xuXG4gICAgLy9maWxsIGJhY2tncm91bmQgb25seSBpZiBvdXIgYmdDb2xvciBpcyBwb3B1bGF0ZWQgb3Igd2UgYXJlIGEgc2VsZWN0ZWQgY2VsbFxuICAgIGlmICh0aGlzLmNvbmZpZy5iZ0NvbG9yIHx8IHRoaXMuY29uZmlnLmlzU2VsZWN0ZWQpIHtcbiAgICAgICAgZ2MuZmlsbFN0eWxlID0gdGhpcy5jb25maWcuaXNTZWxlY3RlZCA/IHRoaXMuY29uZmlnLmJnU2VsQ29sb3IgOiB0aGlzLmNvbmZpZy5iZ0NvbG9yO1xuICAgICAgICBnYy5maWxsUmVjdCh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICB9XG5cbiAgICBpZiAoIXZhbCB8fCAhdmFsLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB2YWxpZ25PZmZzZXQgPSBNYXRoLmNlaWwoaGVpZ2h0IC8gMik7XG5cbiAgICBnYy5maWxsU3R5bGUgPSB0aGlzLmNvbmZpZy5pc1NlbGVjdGVkID8gdGhpcy5jb25maWcuZmdTZWxDb2xvciA6IHRoaXMuY29uZmlnLmZnQ29sb3I7XG4gICAgZ2MuZmlsbFRleHQoaWNvbiArIHZhbCwgeCArIGluZGVudCwgeSArIHZhbGlnbk9mZnNldCk7XG5cbiAgICB2YXIgdGV4dFdpZHRoID0gdGhpcy5jb25maWcuZ2V0VGV4dFdpZHRoKGdjLCBpY29uICsgdmFsKTtcbiAgICB2YXIgbWluV2lkdGggPSB4ICsgaW5kZW50ICsgdGV4dFdpZHRoICsgMTA7XG4gICAgdGhpcy5jb25maWcubWluV2lkdGggPSBtaW5XaWR0aDtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0NhbnZhc0dyYXBoaWNzQ29udGV4dH0gZ2MgLSB0aGUgXCJwZW5cIiBpbiB0aGUgbXZjIG1vZGVsLCB3ZSBpc3N1ZSBkcmF3aW5nIGNvbW1hbmRzIHRvXG4gKiBAcGFyYW0ge2ludGVnZXJ9IHggLSB0aGUgeCBzY3JlZW4gY29vcmRpbmF0ZSBvZiBteSBvcmlnaW5cbiAqIEBwYXJhbSB7aW50ZWdlcn0geSAtIHRoZSB5IHNjcmVlbiBjb29yZGluYXRlIG9mIG15IG9yaWdpblxuICogQHBhcmFtIHtpbnRlZ2VyfSB3aWR0aCAtIHRoZSB3aWR0aCBJJ20gYWxsb3dlZCB0byBkcmF3IHdpdGhpblxuICogQHBhcmFtIHtpbnRlZ2VyfSBoZWlnaHQgLSB0aGUgaGVpZ2h0IEknbSBhbGxvd2VkIHRvIGRyYXcgd2l0aGluXG4gKiBAaW5zdGFuY2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNMaW5rIC0gaXMgdGhpcyBhIGh5cGVybGluayBjZWxsXG4gKiBAZGVzY3JpcHRpb25cbiB0aGlzIGlzIGFuIGVtcHR5IGltcGxlbWVudGF0aW9uIG9mIGEgY2VsbCByZW5kZXJlciwgc2VlIFt0aGUgbnVsbCBvYmplY3QgcGF0dGVybl0oaHR0cDovL2MyLmNvbS9jZ2kvd2lraT9OdWxsT2JqZWN0KVxuICovXG5DZWxsUHJvdmlkZXIucHJvdG90eXBlLmVtcHR5Q2VsbFJlbmRlcmVyID0gZnVuY3Rpb24oZ2MsIHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICBub29wKGdjLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBwcml2YXRlXG4gKi9cbkNlbGxQcm92aWRlci5wcm90b3R5cGUuaW5pdGlhbGl6ZUNlbGxzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuY2VsbENhY2hlLnNpbXBsZUNlbGxSZW5kZXJlciA9IHtcbiAgICAgICAgcGFpbnQ6IHRoaXMuZGVmYXVsdENlbGxQYWludFxuICAgIH07XG4gICAgdGhpcy5jZWxsQ2FjaGUuc2xpZGVyQ2VsbFJlbmRlcmVyID0ge1xuICAgICAgICBwYWludDogdGhpcy5wYWludFNsaWRlclxuICAgIH07XG4gICAgdGhpcy5jZWxsQ2FjaGUuc3BhcmtiYXJDZWxsUmVuZGVyZXIgPSB7XG4gICAgICAgIHBhaW50OiB0aGlzLnBhaW50U3BhcmtiYXJcbiAgICB9O1xuICAgIHRoaXMuY2VsbENhY2hlLnNwYXJrbGluZUNlbGxSZW5kZXJlciA9IHtcbiAgICAgICAgcGFpbnQ6IHRoaXMucGFpbnRTcGFya2xpbmVcbiAgICB9O1xuICAgIHRoaXMuY2VsbENhY2hlLnRyZWVDZWxsUmVuZGVyZXIgPSB7XG4gICAgICAgIHBhaW50OiB0aGlzLnRyZWVDZWxsUmVuZGVyZXJcbiAgICB9O1xuICAgIHRoaXMuY2VsbENhY2hlLmVtcHR5Q2VsbFJlbmRlcmVyID0ge1xuICAgICAgICBwYWludDogdGhpcy5lbXB0eUNlbGxSZW5kZXJlclxuICAgIH07XG4gICAgdGhpcy5jZWxsQ2FjaGUuYnV0dG9uUmVuZGVyZXIgPSB7XG4gICAgICAgIHBhaW50OiB0aGlzLnBhaW50QnV0dG9uLFxuICAgICAgICAvL2RlZmF1bHRDZWxsUGFpbnQ6IHRoaXMuZGVmYXVsdENlbGxQYWludFxuICAgIH07XG4gICAgdGhpcy5jZWxsQ2FjaGUubGlua0NlbGxSZW5kZXJlciA9IHtcbiAgICAgICAgcGFpbnQ6IGZ1bmN0aW9uKGdjLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgICAgICBzZWxmLmNvbmZpZyA9IHRoaXMuY29uZmlnO1xuICAgICAgICAgICAgc2VsZi5kZWZhdWx0Q2VsbFBhaW50KGdjLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCB0cnVlKTtcbiAgICAgICAgfSxcbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDZWxsUHJvdmlkZXJcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICpcbiAqIEBtb2R1bGUgLlxccmVuZGVyZXJcbiAqIEBkZXNjcmlwdGlvblxuZmluLWh5cGVyZ3JpZC1yZW5kZXJlciBpcyB0aGUgY2FudmFzIGVuYWJsZWQgdG9wIGxldmVsIHN1YiBjb21wb25lbnQgdGhhdCBoYW5kbGVzIHRoZSByZW5kZXJlcmluZyBvZiB0aGUgR3JpZC5cblxuSXQgcmVsaWVzIG9uIHR3byBvdGhlciBleHRlcm5hbCBzdWJwcm9qZWN0c1xuXG4xLiBmaW4tY2FudmFzOiBhIHdyYXBwZXIgdG8gcHJvdmlkZSBhIHNpbXBsZXIgaW50ZXJmYWNlIHRvIHRoZSBIVE1MNSBjYW52YXMgY29tcG9uZW50XG4yLiBmaW4tcmVjdGFuZ2xlczogYSBzbWFsbCBsaWJyYXJ5IHByb3ZpZGluZyBQb2ludCBhbmQgUmVjdGFuZ2xlIG9iamVjdHNcblxuVGhlIGZpbi1oeXBlcmdyaWQtcmVuZGVyZXIgaXMgaW4gYSB1bmlxdWUgcG9zaXRpb24gdG8gcHJvdmlkZSBjcml0aWNhbCBmdW5jdGlvbmFsaXR5IHRvIHRoZSBmaW4taHlwZXJncmlkIGluIGEgaGlnaHRseSBwZXJmb3JtYW50IG1hbm5lci5cbkJlY2F1c2UgaXQgTVVTVCBpdGVyYXRlIG92ZXIgYWxsIHRoZSB2aXNpYmxlIGNlbGxzIGl0IGNhbiBzdG9yZSB2YXJpb3VzIGJpdHMgb2YgaW5mb3JtYXRpb24gdGhhdCBjYW4gYmUgZW5jYXBzdWxhdGVkIGFzIGEgc2VydmljZSBmb3IgY29uc3VtcHRpb24gYnkgdGhlIGZpbi1oeXBlcmdyaWQgY29tcG9uZW50LlxuXG5JbnN0YW5jZXMgb2YgdGhpcyBvYmplY3QgaGF2ZSBiYXNpY2FsbHkgZm91ciBtYWluIGZ1bmN0aW9ucy5cblxuMS4gcmVuZGVyIGZpeGVkIHJvdyBoZWFkZXJzXG4yLiByZW5kZXIgZml4ZWQgY29sIGhlYWRlcnNcbjMuIHJlbmRlciBtYWluIGRhdGEgY2VsbHNcbjQuIHJlbmRlciBncmlkIGxpbmVzXG5cbioqL1xuXG5mdW5jdGlvbiBSZW5kZXJlcigpIHtcbiAgICB0aGlzLmNvbHVtbkVkZ2VzID0gW107XG4gICAgdGhpcy5jb2x1bW5FZGdlc0luZGV4TWFwID0ge307XG4gICAgdGhpcy5yZW5kZXJlZENvbHVtbk1pbldpZHRocyA9IFtdO1xuICAgIHRoaXMucmVuZGVyZWRIZWlnaHQgPSAwO1xuICAgIHRoaXMucm93RWRnZXMgPSBbXTtcbiAgICB0aGlzLnJvd0VkZ2VzSW5kZXhNYXAgPSB7fTtcbiAgICB0aGlzLnZpc2libGVDb2x1bW5zID0gW107XG4gICAgdGhpcy52aXNpYmxlUm93cyA9IFtdO1xuICAgIHRoaXMuaW5zZXJ0aW9uQm91bmRzID0gW107XG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUgPSB7fTtcblxudmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9O1xuXG52YXIgbWVyZ2UgPSBmdW5jdGlvbih0YXJnZXQsIHNvdXJjZSkge1xuICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuXG4vL3RoZSBzaGFyZWQgc2luZ2xlIGl0ZW0gXCJwb29sZWRcIiBjZWxsIG9iamVjdCBmb3IgZHJhd2luZyBlYWNoIGNlbGxcblJlbmRlcmVyLnByb3RvdHlwZS5jZWxsID0ge1xuICAgIHg6IDAsXG4gICAgeTogMCxcbiAgICB3aWR0aDogMCxcbiAgICBoZWlnaHQ6IDBcbn07XG5cblJlbmRlcmVyLnByb3RvdHlwZS5zY3JvbGxIZWlnaHQgPSAwLFxuUmVuZGVyZXIucHJvdG90eXBlLnZpZXdIZWlnaHQgPSAwLFxuXG4vL3RoaXMgZnVuY3Rpb24gY29tcHV0ZXMgdGhlIGdyaWQgY29vcmRpbmF0ZXMgdXNlZCBmb3IgZXh0cmVtZWx5IGZhc3QgaXRlcmF0aW9uIG92ZXJcbi8vcGFpbnRpbmcgdGhlIGdyaWQgY2VsbHMuIHRoaXMgZnVuY3Rpb24gaXMgdmVyeSBmYXN0LCBmb3IgdGhvdXNhbmQgcm93cyBYIDEwMCBjb2x1bW5zXG4vL29uIGEgbW9kZXN0IG1hY2hpbmUgdGFraW5nIHVzdWFsbHkgMG1zIGFuZCBubyBtb3JlIHRoYXQgMyBtcy5cblJlbmRlcmVyLnByb3RvdHlwZS5jb21wdXRlQ2VsbHNCb3VuZHMgPSBmdW5jdGlvbigpIHtcblxuICAgIC8vdmFyIHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICB2YXIgZ3JpZCA9IHRoaXMuZ2V0R3JpZCgpO1xuICAgIHZhciBzY3JvbGxUb3AgPSB0aGlzLmdldFNjcm9sbFRvcCgpO1xuICAgIHZhciBzY3JvbGxMZWZ0ID0gdGhpcy5nZXRTY3JvbGxMZWZ0KCk7XG5cbiAgICB2YXIgbnVtQ29sdW1ucyA9IHRoaXMuZ2V0Q29sdW1uQ291bnQoKTtcbiAgICB2YXIgbnVtRml4ZWRDb2x1bW5zID0gdGhpcy5nZXRGaXhlZENvbHVtbkNvdW50KCk7XG5cbiAgICB2YXIgbnVtUm93cyA9IHRoaXMuZ2V0Um93Q291bnQoKTtcbiAgICB2YXIgbnVtRml4ZWRSb3dzID0gdGhpcy5nZXRGaXhlZFJvd0NvdW50KCk7XG5cbiAgICB2YXIgYm91bmRzID0gdGhpcy5nZXRCb3VuZHMoKTtcbiAgICB2YXIgdmlld1dpZHRoID0gYm91bmRzLndpZHRoKCk7XG5cbiAgICAvL3dlIG11c3QgYmUgaW4gYm9vdHN0cmFwXG4gICAgaWYgKHZpZXdXaWR0aCA9PT0gMCkge1xuICAgICAgICAvL3ZpZXdXaWR0aCA9IGdyaWQuc2JIU2Nyb2xsZXIuZ2V0Q2xpZW50UmVjdHMoKVswXS53aWR0aDtcbiAgICAgICAgdmlld1dpZHRoID0gZ3JpZC5jYW52YXMud2lkdGg7XG4gICAgfVxuICAgIHZhciB2aWV3SGVpZ2h0ID0gYm91bmRzLmhlaWdodCgpO1xuXG4gICAgdmFyIHgsIHksIGMsIHIsIHZ4LCB2eSwgd2lkdGgsIGhlaWdodDtcblxuICAgIHRoaXMuZ2V0Q29sdW1uRWRnZXMoKS5sZW5ndGggPSAwO1xuICAgIHRoaXMucm93RWRnZXMubGVuZ3RoID0gMDtcblxuICAgIHRoaXMuY29sdW1uRWRnZXNbMF0gPSAwO1xuICAgIHRoaXMucm93RWRnZXNbMF0gPSAwO1xuICAgIHRoaXMuc2Nyb2xsSGVpZ2h0ID0gMDtcblxuICAgIHRoaXMudmlzaWJsZUNvbHVtbnMubGVuZ3RoID0gMDtcbiAgICB0aGlzLnZpc2libGVSb3dzLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5jb2x1bW5FZGdlc0luZGV4TWFwID0ge307XG4gICAgdGhpcy5yb3dFZGdlc0luZGV4TWFwID0ge307XG5cbiAgICB0aGlzLmluc2VydGlvbkJvdW5kcyA9IFtdO1xuICAgIHZhciBpbnNlcnRpb25Cb3VuZHNDdXJzb3IgPSAwO1xuICAgIHZhciBwcmV2aW91c0luc2VydGlvbkJvdW5kc0N1cnNvclZhbHVlID0gMDtcblxuICAgIHggPSAwO1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgdmFyIGZpcnN0VlgsIGxhc3RWWDtcbiAgICB2YXIgZmlyc3RWWSwgbGFzdFZZO1xuICAgIGlmIChncmlkLmlzU2hvd1Jvd051bWJlcnMoKSkge1xuICAgICAgICBzdGFydC0tO1xuICAgICAgICB0aGlzLmNvbHVtbkVkZ2VzWy0xXSA9IC0xO1xuICAgIH1cbiAgICBmb3IgKGMgPSBzdGFydDsgYyA8IG51bUNvbHVtbnM7IGMrKykge1xuICAgICAgICB2eCA9IGM7XG4gICAgICAgIGlmIChjID49IG51bUZpeGVkQ29sdW1ucykge1xuICAgICAgICAgICAgdnggPSB2eCArIHNjcm9sbExlZnQ7XG4gICAgICAgICAgICBpZiAoZmlyc3RWWCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZmlyc3RWWCA9IHZ4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFzdFZYID0gdng7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHggPiB2aWV3V2lkdGggfHwgbnVtQ29sdW1ucyA8PSB2eCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgd2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKHZ4KTtcbiAgICAgICAgeCA9IHggKyB3aWR0aDtcbiAgICAgICAgdGhpcy5jb2x1bW5FZGdlc1tjICsgMV0gPSBNYXRoLnJvdW5kKHgpO1xuICAgICAgICB0aGlzLnZpc2libGVDb2x1bW5zW2NdID0gdng7XG4gICAgICAgIHRoaXMuY29sdW1uRWRnZXNJbmRleE1hcFt2eF0gPSBjO1xuXG4gICAgICAgIGluc2VydGlvbkJvdW5kc0N1cnNvciA9IGluc2VydGlvbkJvdW5kc0N1cnNvciArIE1hdGgucm91bmQod2lkdGggLyAyKSArIHByZXZpb3VzSW5zZXJ0aW9uQm91bmRzQ3Vyc29yVmFsdWU7XG4gICAgICAgIHRoaXMuaW5zZXJ0aW9uQm91bmRzLnB1c2goaW5zZXJ0aW9uQm91bmRzQ3Vyc29yKTtcbiAgICAgICAgcHJldmlvdXNJbnNlcnRpb25Cb3VuZHNDdXJzb3JWYWx1ZSA9IE1hdGgucm91bmQod2lkdGggLyAyKTtcbiAgICB9XG5cbiAgICB5ID0gMDtcbiAgICBmb3IgKHIgPSAwOyByIDwgbnVtUm93czsgcisrKSB7XG4gICAgICAgIHZ5ID0gcjtcbiAgICAgICAgaWYgKHIgPj0gbnVtRml4ZWRSb3dzKSB7XG4gICAgICAgICAgICB2eSA9IHZ5ICsgc2Nyb2xsVG9wO1xuICAgICAgICAgICAgaWYgKGZpcnN0VlkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGZpcnN0VlkgPSB2eTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3RWWSA9IHZ5O1xuICAgICAgICB9XG4gICAgICAgIGlmICh5ID4gdmlld0hlaWdodCB8fCBudW1Sb3dzIDw9IHZ5KSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBoZWlnaHQgPSB0aGlzLmdldFJvd0hlaWdodCh2eSk7XG4gICAgICAgIHkgPSB5ICsgaGVpZ2h0O1xuICAgICAgICB0aGlzLnJvd0VkZ2VzW3IgKyAxXSA9IE1hdGgucm91bmQoeSk7XG4gICAgICAgIHRoaXMudmlzaWJsZVJvd3Nbcl0gPSB2eTtcbiAgICAgICAgdGhpcy5yb3dFZGdlc0luZGV4TWFwW3Z5XSA9IHI7XG4gICAgfVxuICAgIHRoaXMudmlld0hlaWdodCA9IHZpZXdIZWlnaHQ7XG4gICAgdGhpcy5kYXRhV2luZG93ID0gZ3JpZC5yZWN0YW5nbGVzLnJlY3RhbmdsZS5jcmVhdGUoZmlyc3RWWCwgZmlyc3RWWSwgbGFzdFZYIC0gZmlyc3RWWCwgbGFzdFZZIC0gZmlyc3RWWSk7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbnJldHVybnMgYSBwcm9wZXJ0eSB2YWx1ZSBhdCBhIGtleSwgZGVsZWdhdGVzIHRvIHRoZSBncmlkXG4gKiAjIyMjIHJldHVybnM6IE9iamVjdFxuICovXG5SZW5kZXJlci5wcm90b3R5cGUucmVzb2x2ZVByb3BlcnR5ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0R3JpZCgpLnJlc29sdmVQcm9wZXJ0eShrZXkpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5nZXR0ZXIgZm9yIHRoZSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogIyMjIyByZXR1cm5zOiBmaW4taHlwZXJncmlkXG4gKi9cblJlbmRlcmVyLnByb3RvdHlwZS5nZXRHcmlkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZ3JpZDtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuc2V0dGVyIGZvciB0aGUgW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqXG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICovXG5SZW5kZXJlci5wcm90b3R5cGUuc2V0R3JpZCA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5ncmlkID0gZ3JpZDtcbiAgICBncmlkLmNhbnZhcy5nZXRDb21wb25lbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuICAgIC8vdGhpcy5zdGFydEFuaW1hdG9yKCk7XG4gICAgLy9sZXRzIG1ha2UgdXNlIG9mIHByb3RvdHlwZSBpbmhlcml0YW5jZSBmb3IgY2VsbCBwcm9wZXJ0aWVzXG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cblRoaXMgaXMgdGhlIGVudHJ5IHBvaW50IGZyb20gZmluLWNhbnZhcy4gIE5vdGlmeSB0aGUgZmluLWh5cGVyZ3JpZCBldmVyeXRpbWUgd2UndmUgcmVwYWludGVkLlxuICpcbiAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBnYyAtIFtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpXG4gKi9cblJlbmRlcmVyLnByb3RvdHlwZS5fcGFpbnQgPSBmdW5jdGlvbihnYykge1xuICAgIGlmICghdGhpcy5ncmlkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXJHcmlkKGdjKTtcbiAgICB0aGlzLmdldEdyaWQoKS5ncmlkUmVuZGVyZWROb3RpZmljYXRpb24oKTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuQW5zd2VyIGhvdyBtYW55IHJvd3Mgd2UgcmVuZGVyZWRcbiAqICMjIyMgcmV0dXJuczogaW50ZWdlclxuICovXG5SZW5kZXJlci5wcm90b3R5cGUuZ2V0VmlzaWJsZVJvd3NDb3VudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnZpc2libGVSb3dzLmxlbmd0aCAtIDE7XG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUuZ2V0VmlzaWJsZVNjcm9sbEhlaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBncmlkID0gdGhpcy5nZXRHcmlkKCk7XG4gICAgdmFyIGZyaCA9IGdyaWQuZ2V0Rml4ZWRSb3dzSGVpZ2h0KCk7XG4gICAgdmFyIGhlaWdodCA9IHRoaXMudmlld0hlaWdodCAtIGZyaDtcbiAgICByZXR1cm4gaGVpZ2h0O1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5BbnN3ZXIgd2hhdCByb3dzIHdlIGp1c3QgcmVuZGVyZWQgYXMgYW4gQXJyYXkgb2YgaW50ZWdlcnNcbiAqICMjIyMgcmV0dXJuczogQXJyYXlcbiAqL1xuUmVuZGVyZXIucHJvdG90eXBlLmdldFZpc2libGVSb3dzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudmlzaWJsZVJvd3M7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbkFuc3dlciBob3cgbWFueSBjb2x1bW5zIHdlIGp1c3QgcmVuZGVyZWRcbiAqICMjIyMgcmV0dXJuczogaW50ZWdlclxuICovXG5SZW5kZXJlci5wcm90b3R5cGUuZ2V0VmlzaWJsZUNvbHVtbnNDb3VudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnZpc2libGVDb2x1bW5zLmxlbmd0aCAtIDE7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbkFuc3dlciB3aGF0IGNvbHVtbnMgd2UganVzdCByZW5kZXJlZCBhcyBhbiBBcnJheSBvZiBpbmRleGVzXG4gKiAjIyMjIHJldHVybnM6IEFycmF5XG4gKi9cblJlbmRlcmVyLnByb3RvdHlwZS5nZXRWaXNpYmxlQ29sdW1ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnZpc2libGVDb2x1bW5zO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5hbnN3ZXIgd2l0aCB0aGUgY29sdW1uIGluZGV4IGlmIHRoZSBtb3VzZUV2ZW50IGNvb3JkaW5hdGVzIGFyZSBvdmVyIGEgY29sdW1uIGRpdmlkZXJcbiAqICMjIyMgcmV0dXJuczogaW50ZWdlclxuICovXG5SZW5kZXJlci5wcm90b3R5cGUub3ZlckNvbHVtbkRpdmlkZXIgPSBmdW5jdGlvbih4KSB7XG4gICAgeCA9IE1hdGgucm91bmQoeCk7XG4gICAgdmFyIGVkZ2VzID0gdGhpcy5nZXRDb2x1bW5FZGdlcygpO1xuICAgIHZhciB3aGljaENvbCA9IGVkZ2VzLmluZGV4T2YoeCAtIDEpO1xuICAgIGlmICh3aGljaENvbCA8IDApIHtcbiAgICAgICAgd2hpY2hDb2wgPSBlZGdlcy5pbmRleE9mKHgpO1xuICAgIH1cbiAgICBpZiAod2hpY2hDb2wgPCAwKSB7XG4gICAgICAgIHdoaWNoQ29sID0gZWRnZXMuaW5kZXhPZih4IC0gMik7XG4gICAgfVxuICAgIGlmICh3aGljaENvbCA8IDApIHtcbiAgICAgICAgd2hpY2hDb2wgPSBlZGdlcy5pbmRleE9mKHggKyAxKTtcbiAgICB9XG4gICAgaWYgKHdoaWNoQ29sIDwgMCkge1xuICAgICAgICB3aGljaENvbCA9IGVkZ2VzLmluZGV4T2YoeCAtIDMpO1xuICAgIH1cblxuICAgIHJldHVybiB3aGljaENvbDtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuYW5zd2VyIHdpdGggdGhlIHJvdyBpbmRleCBpZiB0aGUgbW91c2VFdmVudCBjb29yZGluYXRlcyBhcmUgb3ZlciBhIHJvdyBkaXZpZGVyXG4gKiAjIyMjIHJldHVybnM6IGludGVnZXJcbiAqL1xuUmVuZGVyZXIucHJvdG90eXBlLm92ZXJSb3dEaXZpZGVyID0gZnVuY3Rpb24oeSkge1xuICAgIHkgPSBNYXRoLnJvdW5kKHkpO1xuICAgIHZhciB3aGljaCA9IHRoaXMucm93RWRnZXMuaW5kZXhPZih5ICsgMSk7XG4gICAgaWYgKHdoaWNoIDwgMCkge1xuICAgICAgICB3aGljaCA9IHRoaXMucm93RWRnZXMuaW5kZXhPZih5KTtcbiAgICB9XG4gICAgaWYgKHdoaWNoIDwgMCkge1xuICAgICAgICB3aGljaCA9IHRoaXMucm93RWRnZXMuaW5kZXhPZih5IC0gMSk7XG4gICAgfVxuICAgIHJldHVybiB3aGljaDtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuYW5zd2VyIHdpdGggYSByZWN0YW5nbGUgdGhlIGJvdW5kcyBvZiBhIHNwZWNpZmljIGNlbGxcbiAqXG4gKiBAcGFyYW0ge2Zpbi1yZWN0YW5nbGUucG9pbnR9IGNlbGwgLSBbZmluLXJlY3RhbmdsZS5wb2ludF0oaHR0cDovL3N0ZXZld2lydHMuZ2l0aHViLmlvL2Zpbi1yZWN0YW5nbGUvY29tcG9uZW50cy9maW4tcmVjdGFuZ2xlLylcbiAqIEBkZXNjcmlwdGlvblxuICogIyMjIyByZXR1cm5zOiBbZmluLXJlY3RhbmdsZV0oaHR0cDovL3N0ZXZld2lydHMuZ2l0aHViLmlvL2Zpbi1yZWN0YW5nbGUvY29tcG9uZW50cy9maW4tcmVjdGFuZ2xlLylcbiAqL1xuUmVuZGVyZXIucHJvdG90eXBlLmdldEJvdW5kc09mQ2VsbCA9IGZ1bmN0aW9uKGNlbGwpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0Qm91bmRzT2ZDZWxsKGNlbGwueCwgY2VsbC55KTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuYW5zd2VyIHdpdGggYSByZWN0YW5nbGUgdGhlIGJvdW5kcyBvZiBhIHNwZWNpZmljIGNlbGxcbiAqXG4gKiBAcGFyYW0ge2ludGVnZXJ9IHggLSB4IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7aW50ZWdlcn0geSAtIHkgY29vcmRpbmF0ZVxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogIyMjIyByZXR1cm5zOiBbZmluLXJlY3RhbmdsZV0oaHR0cDovL3N0ZXZld2lydHMuZ2l0aHViLmlvL2Zpbi1yZWN0YW5nbGUvY29tcG9uZW50cy9maW4tcmVjdGFuZ2xlLylcbiAqL1xuUmVuZGVyZXIucHJvdG90eXBlLl9nZXRCb3VuZHNPZkNlbGwgPSBmdW5jdGlvbihjLCByKSB7XG4gICAgdmFyIHhPdXRzaWRlID0gZmFsc2U7XG4gICAgdmFyIHlPdXRzaWRlID0gZmFsc2U7XG4gICAgdmFyIGNvbHVtbkVkZ2VzID0gdGhpcy5nZXRDb2x1bW5FZGdlcygpO1xuICAgIHZhciByb3dFZGdlcyA9IHRoaXMuZ2V0Um93RWRnZXMoKTtcblxuICAgIHZhciB4ID0gdGhpcy5jb2x1bW5FZGdlc0luZGV4TWFwW2NdO1xuICAgIHZhciB5ID0gdGhpcy5yb3dFZGdlc0luZGV4TWFwW3JdO1xuICAgIGlmICh4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgeCA9IHRoaXMuY29sdW1uRWRnZXNJbmRleE1hcFtjIC0gMV07XG4gICAgICAgIHhPdXRzaWRlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHkgPSB0aGlzLnJvd0VkZ2VzSW5kZXhNYXBbciAtIDFdO1xuICAgICAgICB5T3V0c2lkZSA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIG94ID0gY29sdW1uRWRnZXNbeF0sXG4gICAgICAgIG95ID0gcm93RWRnZXNbeV0sXG4gICAgICAgIGN4ID0gY29sdW1uRWRnZXNbeCArIDFdLFxuICAgICAgICBjeSA9IHJvd0VkZ2VzW3kgKyAxXSxcbiAgICAgICAgZXggPSBjeCAtIG94LFxuICAgICAgICBleSA9IGN5IC0gb3k7XG5cbiAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbDtcbiAgICBjZWxsLnggPSB4T3V0c2lkZSA/IGN4IDogb3g7XG4gICAgY2VsbC55ID0geU91dHNpZGUgPyBjeSA6IG95O1xuICAgIGNlbGwud2lkdGggPSB4T3V0c2lkZSA/IDAgOiBleDtcbiAgICBjZWxsLmhlaWdodCA9IHlPdXRzaWRlID8gMCA6IGV5O1xuXG4gICAgcmV0dXJuIGNlbGw7XG5cbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuYW5zd2VyIHRoZSBjb2x1bW4gaW5kZXggdW5kZXIgdGhlIGNvb3JkaW5hdGUgYXQgcGl4ZWxYXG4gKlxuICogQHBhcmFtIHtwaXhlbFh9IHggLSB4IGNvb3JkaW5hdGVcbiAqIEBkZXNjcmlwdGlvblxuICogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4gKi9cblJlbmRlcmVyLnByb3RvdHlwZS5nZXRDb2x1bW5Gcm9tUGl4ZWxYID0gZnVuY3Rpb24ocGl4ZWxYKSB7XG4gICAgdmFyIHdpZHRoID0gMDtcbiAgICB2YXIgZ3JpZCA9IHRoaXMuZ2V0R3JpZCgpO1xuICAgIHZhciBmaXhlZENvbHVtbkNvdW50ID0gdGhpcy5nZXRGaXhlZENvbHVtbkNvdW50KCk7XG4gICAgdmFyIHNjcm9sbExlZnQgPSBncmlkLmdldEhTY3JvbGxWYWx1ZSgpO1xuICAgIHZhciBjO1xuICAgIHZhciBlZGdlcyA9IHRoaXMuZ2V0Q29sdW1uRWRnZXMoKTtcbiAgICBmb3IgKGMgPSAxOyBjIDwgZWRnZXMubGVuZ3RoIC0gMTsgYysrKSB7XG4gICAgICAgIHdpZHRoID0gZWRnZXNbY10gLSAoZWRnZXNbY10gLSBlZGdlc1tjIC0gMV0pIC8gMjtcbiAgICAgICAgaWYgKHBpeGVsWCA8IHdpZHRoKSB7XG4gICAgICAgICAgICBpZiAoYyA+IGZpeGVkQ29sdW1uQ291bnQpIHtcbiAgICAgICAgICAgICAgICBjID0gYyArIHNjcm9sbExlZnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYyAtIDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGMgPiBmaXhlZENvbHVtbkNvdW50KSB7XG4gICAgICAgIGMgPSBjICsgc2Nyb2xsTGVmdDtcbiAgICB9XG4gICAgcmV0dXJuIGMgLSAxO1xufTtcblxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbkFuc3dlciBzcGVjaWZpYyBkYXRhIGNlbGwgY29vcmRpbmF0ZXMgZ2l2ZW4gbW91c2UgY29vcmRpbmF0ZXMgaW4gcGl4ZWxzLlxuICpcbiAqIEBwYXJhbSB7ZmluLXJlY3RhbmdsZS5wb2ludH0gcG9pbnQgLSBbZmluLXJlY3RhbmdsZS5wb2ludF0oaHR0cDovL3N0ZXZld2lydHMuZ2l0aHViLmlvL2Zpbi1yZWN0YW5nbGUvY29tcG9uZW50cy9maW4tcmVjdGFuZ2xlLylcbiAqIEBkZXNjcmlwdGlvblxuICogIyMjIyByZXR1cm5zOiBPYmplY3RcbiAqL1xuUmVuZGVyZXIucHJvdG90eXBlLmdldEdyaWRDZWxsRnJvbU1vdXNlUG9pbnQgPSBmdW5jdGlvbihwb2ludCkge1xuXG4gICAgdmFyIGdyaWQgPSB0aGlzLmdldEdyaWQoKTtcbiAgICB2YXIgYmVoYXZpb3IgPSBncmlkLmdldEJlaGF2aW9yKCk7XG4gICAgdmFyIHdpZHRoID0gMDtcbiAgICB2YXIgaGVpZ2h0ID0gMDtcbiAgICB2YXIgeCwgeSwgYywgcjtcbiAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgIHZhciBjb2x1bW5FZGdlcyA9IHRoaXMuZ2V0Q29sdW1uRWRnZXMoKTtcbiAgICB2YXIgZml4ZWRDb2x1bW5Db3VudCA9IHRoaXMuZ2V0Rml4ZWRDb2x1bW5Db3VudCgpOyAvLyArIGdyaWRTaXplO1xuICAgIHZhciBmaXhlZFJvd0NvdW50ID0gdGhpcy5nZXRGaXhlZFJvd0NvdW50KCk7XG5cbiAgICAvLyB2YXIgZml4ZWRDb2x1bW5Db3VudCA9IHRoaXMuZ2V0Rml4ZWRDb2x1bW5Db3VudCgpO1xuICAgIC8vIHZhciBmaXhlZFJvd0NvdW50ID0gdGhpcy5nZXRGaXhlZFJvd0NvdW50KCk7XG4gICAgdmFyIHNjcm9sbFggPSB0aGlzLmdldFNjcm9sbExlZnQoKTtcbiAgICB2YXIgc2Nyb2xsWSA9IHRoaXMuZ2V0U2Nyb2xsVG9wKCk7XG5cbiAgICBmb3IgKGMgPSAwOyBjIDwgY29sdW1uRWRnZXMubGVuZ3RoOyBjKyspIHtcbiAgICAgICAgd2lkdGggPSBjb2x1bW5FZGdlc1tjXTtcbiAgICAgICAgaWYgKHBvaW50LnggPCB3aWR0aCkge1xuICAgICAgICAgICAgeCA9IE1hdGgubWF4KDAsIHBvaW50LnggLSBwcmV2aW91cyAtIDIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcHJldmlvdXMgPSB3aWR0aDtcbiAgICB9XG4gICAgYy0tO1xuICAgIHByZXZpb3VzID0gMDtcbiAgICBmb3IgKHIgPSAwOyByIDwgdGhpcy5yb3dFZGdlcy5sZW5ndGg7IHIrKykge1xuICAgICAgICBoZWlnaHQgPSB0aGlzLnJvd0VkZ2VzW3JdO1xuICAgICAgICBpZiAocG9pbnQueSA8IGhlaWdodCkge1xuICAgICAgICAgICAgeSA9IE1hdGgubWF4KDAsIHBvaW50LnkgLSBwcmV2aW91cyAtIDIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcHJldmlvdXMgPSBoZWlnaHQ7XG4gICAgfVxuICAgIHItLTtcbiAgICBpZiAocG9pbnQueCA8IDApIHtcbiAgICAgICAgYyA9IC0xO1xuICAgIH1cbiAgICBpZiAocG9pbnQueSA8IDApIHtcbiAgICAgICAgciA9IC0xO1xuICAgIH1cblxuICAgIHZhciB2aWV3UG9pbnQgPSBncmlkLm5ld1BvaW50KGMsIHIpO1xuXG4gICAgLy9jb21wZW5zYXRlIGlmIHdlIGFyZSBzY3JvbGxlZFxuICAgIGlmIChjID49IGZpeGVkQ29sdW1uQ291bnQpIHtcbiAgICAgICAgYyA9IGMgKyBzY3JvbGxYO1xuICAgIH1cbiAgICBpZiAociA+PSBmaXhlZFJvd0NvdW50KSB7XG4gICAgICAgIHIgPSByICsgc2Nyb2xsWTtcbiAgICB9XG5cbiAgICB2YXIgY29sdW1uID0gYmVoYXZpb3IuZ2V0Q29sdW1uKGMpO1xuICAgIHZhciB0cmFuc2xhdGVkSW5kZXggPSBjb2x1bW4uaW5kZXg7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmlkQ2VsbDogZ3JpZC5uZXdQb2ludChjLCByKSxcbiAgICAgICAgbW91c2VQb2ludDogZ3JpZC5uZXdQb2ludCh4LCB5KSxcbiAgICAgICAgdmlld1BvaW50OiB2aWV3UG9pbnQsXG4gICAgICAgIGRhdGFDZWxsOiBncmlkLm5ld1BvaW50KHRyYW5zbGF0ZWRJbmRleCwgciksXG4gICAgfTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuQW5zd2VyIGlmIGEgY29sdW1uIGlzIHZpc2libGUsIG11c3QgYmUgZnVsbHkgdmlzaWJsZVxuICpcbiAqIEBwYXJhbSB7aW50ZWdlcn0gY29sSW5kZXggLSB0aGUgY29sdW1uIGluZGV4XG4gKiBAZGVzY3JpcHRpb25cbiAqICMjIyMgcmV0dXJuczogYm9vbGVhblxuICovXG5SZW5kZXJlci5wcm90b3R5cGUuaXNDb2x1bW5WaXNpYmxlID0gZnVuY3Rpb24oY29sSW5kZXgpIHtcbiAgICB2YXIgaXNWaXNpYmxlID0gdGhpcy52aXNpYmxlQ29sdW1ucy5pbmRleE9mKGNvbEluZGV4KSAhPT0gLTE7XG4gICAgcmV0dXJuIGlzVmlzaWJsZTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuQW5zd2VyIHRoZSB3aWR0aCB4IGNvb3JkaW5hdGUgb2YgdGhlIGxhc3QgcmVuZGVyZWQgY29sdW1uXG4gKiAjIyMjIHJldHVybnM6IGludGVnZXJcbiAqL1xuUmVuZGVyZXIucHJvdG90eXBlLmdldEZpbmFsVmlzYWJsZUNvbHVtbkJvdW5kcnkgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNNYXhYID0gdGhpcy5pc0xhc3RDb2x1bW5WaXNpYmxlKCk7XG4gICAgdmFyIGNob3AgPSBpc01heFggPyAyIDogMTtcbiAgICB2YXIgY29sV2FsbCA9IHRoaXMuZ2V0Q29sdW1uRWRnZXMoKVt0aGlzLmdldENvbHVtbkVkZ2VzKCkubGVuZ3RoIC0gY2hvcF07XG4gICAgdmFyIHJlc3VsdCA9IE1hdGgubWluKGNvbFdhbGwsIHRoaXMuZ2V0Qm91bmRzKCkud2lkdGgoKSAtIDIwMCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuQW5zd2VyIGlmIGEgcm93IGlzIHZpc2libGUsIG11c3QgYmUgZnVsbHkgdmlzaWJsZVxuICpcbiAqIEBwYXJhbSB7aW50ZWdlcn0gcm93SW5kZXggLSB0aGUgcm93IGluZGV4XG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiAjIyMjIHJldHVybnM6IGJvb2xlYW5cbiAqL1xuUmVuZGVyZXIucHJvdG90eXBlLmlzUm93VmlzaWJsZSA9IGZ1bmN0aW9uKHJvd0luZGV4KSB7XG4gICAgdmFyIGlzVmlzaWJsZSA9IHRoaXMudmlzaWJsZVJvd3MuaW5kZXhPZihyb3dJbmRleCkgIT09IC0xO1xuICAgIHJldHVybiBpc1Zpc2libGU7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbkFuc3dlciBpZiBhIGRhdGEgY2VsbCBpcyBzZWxlY3RlZC5cbiAqXG4gKiBAcGFyYW0ge2ludGVnZXJ9IHggLSB0aGUgeCBjZWxsIGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7aW50ZWdlcn0geSAtIHRoZSB5IGNlbGwgY29vcmRpbmF0ZVxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogIyMjIyByZXR1cm5zOiBib29sZWFuXG4gKi9cblJlbmRlcmVyLnByb3RvdHlwZS5pc1NlbGVjdGVkID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHJldHVybiB0aGlzLmdldEdyaWQoKS5pc1NlbGVjdGVkKHgsIHkpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5UaGlzIGlzIHRoZSBtYWluIGZvcmtpbmcgb2YgdGhlIHJlbmRlcmVyaW5nIHRhc2suXG4gKlxuICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGdjIC0gW0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRClcbiAqL1xuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlckdyaWQgPSBmdW5jdGlvbihnYykge1xuICAgIGdjLmJlZ2luUGF0aCgpO1xuXG4gICAgdGhpcy5wYWludENlbGxzKGdjKTtcbiAgICB0aGlzLnBhaW50R3JpZGxpbmVzKGdjKTtcbiAgICAvL3RoaXMuYmxhbmtPdXRPdmVyZmxvdyhnYyk7IC8vIG5vIGxvbmdlciBuZWVkZWRcbiAgICB0aGlzLnJlbmRlck92ZXJyaWRlcyhnYyk7XG4gICAgdGhpcy5yZW5kZXJGb2N1c0NlbGwoZ2MpO1xuICAgIGdjLmNsb3NlUGF0aCgpO1xufTtcblxuZm9jdXNMaW5lU3RlcDogW1xuICAgIFs1LCA1XSxcbiAgICBbMCwgMSwgNSwgNF0sXG4gICAgWzAsIDIsIDUsIDNdLFxuICAgIFswLCAzLCA1LCAyXSxcbiAgICBbMCwgNCwgNSwgMV0sXG4gICAgWzAsIDUsIDUsIDBdLFxuICAgIFsxLCA1LCA0LCAwXSxcbiAgICBbMiwgNSwgMywgMF0sXG4gICAgWzMsIDUsIDIsIDBdLFxuICAgIFs0LCA1LCAxLCAwXVxuXSxcblxuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlckZvY3VzQ2VsbCA9IGZ1bmN0aW9uKGdjKSB7XG4gICAgZ2MuYmVnaW5QYXRoKCk7XG4gICAgdGhpcy5fcmVuZGVyRm9jdXNDZWxsKGdjKTtcbiAgICBnYy5jbG9zZVBhdGgoKTtcbn07XG5cblJlbmRlcmVyLnByb3RvdHlwZS5fcmVuZGVyRm9jdXNDZWxsID0gZnVuY3Rpb24oZ2MpIHtcbiAgICB2YXIgZ3JpZCA9IHRoaXMuZ2V0R3JpZCgpO1xuICAgIHZhciBzZWxlY3Rpb25zID0gZ3JpZC5nZXRTZWxlY3Rpb25Nb2RlbCgpLmdldFNlbGVjdGlvbnMoKTtcbiAgICBpZiAoIXNlbGVjdGlvbnMgfHwgc2VsZWN0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgc2VsZWN0aW9uID0gc2VsZWN0aW9uc1tzZWxlY3Rpb25zLmxlbmd0aCAtIDFdO1xuICAgIHZhciBtb3VzZURvd24gPSBzZWxlY3Rpb24ub3JpZ2luO1xuICAgIGlmIChtb3VzZURvd24ueCA9PT0gLTEpIHtcbiAgICAgICAgLy9ubyBzZWxlY3RlZCBhcmVhLCBsZXRzIGV4aXRcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB2aXNpYmxlQ29sdW1ucyA9IHRoaXMuZ2V0VmlzaWJsZUNvbHVtbnMoKTtcbiAgICB2YXIgdmlzaWJsZVJvd3MgPSB0aGlzLmdldFZpc2libGVSb3dzKCk7XG4gICAgdmFyIGxhc3RWaXNpYmxlQ29sdW1uID0gdmlzaWJsZUNvbHVtbnNbdmlzaWJsZUNvbHVtbnMubGVuZ3RoIC0gMV07XG4gICAgdmFyIGxhc3RWaXNpYmxlUm93ID0gdmlzaWJsZVJvd3NbdmlzaWJsZVJvd3MubGVuZ3RoIC0gMV07XG5cbiAgICB2YXIgZXh0ZW50ID0gc2VsZWN0aW9uLmV4dGVudDtcblxuICAgIHZhciBkcE9YID0gTWF0aC5taW4obW91c2VEb3duLngsIG1vdXNlRG93bi54ICsgZXh0ZW50LngpO1xuICAgIHZhciBkcE9ZID0gTWF0aC5taW4obW91c2VEb3duLnksIG1vdXNlRG93bi55ICsgZXh0ZW50LnkpO1xuXG4gICAgLy9sZXRzIGNoZWNrIGlmIG91ciBzZWxlY3Rpb24gcmVjdGFuZ2xlIGlzIHNjcm9sbGVkIG91dHNpZGUgb2YgdGhlIHZpc2libGUgYXJlYVxuICAgIGlmIChkcE9YID4gbGFzdFZpc2libGVDb2x1bW4pIHtcbiAgICAgICAgcmV0dXJuOyAvL3RoZSB0b3Agb2Ygb3VyIHJlY3RhbmdsZSBpcyBiZWxvdyB2aXNpYmxlXG4gICAgfVxuICAgIGlmIChkcE9ZID4gbGFzdFZpc2libGVSb3cpIHtcbiAgICAgICAgcmV0dXJuOyAvL3RoZSBsZWZ0IG9mIG91ciByZWN0YW5nbGUgaXMgdG8gdGhlIHJpZ2h0IG9mIGJlaW5nIHZpc2libGVcbiAgICB9XG5cbiAgICB2YXIgZHBFWCA9IE1hdGgubWF4KG1vdXNlRG93bi54LCBtb3VzZURvd24ueCArIGV4dGVudC54KSArIDE7XG4gICAgZHBFWCA9IE1hdGgubWluKGRwRVgsIDEgKyBsYXN0VmlzaWJsZUNvbHVtbik7XG5cbiAgICB2YXIgZHBFWSA9IE1hdGgubWF4KG1vdXNlRG93bi55LCBtb3VzZURvd24ueSArIGV4dGVudC55KSArIDE7XG4gICAgZHBFWSA9IE1hdGgubWluKGRwRVksIDEgKyBsYXN0VmlzaWJsZVJvdyk7XG5cbiAgICB2YXIgbyA9IHRoaXMuX2dldEJvdW5kc09mQ2VsbChkcE9YLCBkcE9ZKTtcbiAgICB2YXIgb3ggPSBNYXRoLnJvdW5kKChvLnggPT09IHVuZGVmaW5lZCkgPyBncmlkLmdldEZpeGVkQ29sdW1uc1dpZHRoKCkgOiBvLngpO1xuICAgIHZhciBveSA9IE1hdGgucm91bmQoKG8ueSA9PT0gdW5kZWZpbmVkKSA/IGdyaWQuZ2V0Rml4ZWRSb3dzSGVpZ2h0KCkgOiBvLnkpO1xuICAgIC8vIHZhciBvdyA9IG8ud2lkdGg7XG4gICAgLy8gdmFyIG9oID0gby5oZWlnaHQ7XG4gICAgdmFyIGUgPSB0aGlzLl9nZXRCb3VuZHNPZkNlbGwoZHBFWCwgZHBFWSk7XG4gICAgdmFyIGV4ID0gTWF0aC5yb3VuZCgoZS54ID09PSB1bmRlZmluZWQpID8gZ3JpZC5nZXRGaXhlZENvbHVtbnNXaWR0aCgpIDogZS54KTtcbiAgICB2YXIgZXkgPSBNYXRoLnJvdW5kKChlLnkgPT09IHVuZGVmaW5lZCkgPyBncmlkLmdldEZpeGVkUm93c0hlaWdodCgpIDogZS55KTtcbiAgICAvLyB2YXIgZXcgPSBlLndpZHRoO1xuICAgIC8vIHZhciBlaCA9IGUuaGVpZ2h0O1xuICAgIHZhciB4ID0gTWF0aC5taW4ob3gsIGV4KTtcbiAgICB2YXIgeSA9IE1hdGgubWluKG95LCBleSk7XG4gICAgdmFyIHdpZHRoID0gMSArIGV4IC0gb3g7XG4gICAgdmFyIGhlaWdodCA9IDEgKyBleSAtIG95O1xuICAgIGlmICh4ID09PSBleCkge1xuICAgICAgICB3aWR0aCA9IG94IC0gZXg7XG4gICAgfVxuICAgIGlmICh5ID09PSBleSkge1xuICAgICAgICBoZWlnaHQgPSBveSAtIGV5O1xuICAgIH1cbiAgICBpZiAod2lkdGggKiBoZWlnaHQgPCAxKSB7XG4gICAgICAgIC8vaWYgd2UgYXJlIG9ubHkgYSBza2lubnkgbGluZSwgZG9uJ3QgcmVuZGVyIGFueXRoaW5nXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBnYy5yZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgIGdjLmZpbGxTdHlsZSA9ICdyZ2JhKDAsIDAsIDAsIDAuMiknO1xuICAgIGdjLmZpbGwoKTtcbiAgICBnYy5saW5lV2lkdGggPSAxO1xuICAgIGdjLnN0cm9rZVN0eWxlID0gJ2JsYWNrJztcblxuICAgIC8vIGFuaW1hdGUgdGhlIGRhc2hlZCBsaW5lIGEgYml0IGhlcmUgZm9yIGZ1blxuXG4gICAgZ2Muc3Ryb2tlKCk7XG5cbiAgICAvL2djLnJlY3QoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG5cbiAgICAvL2djLnN0cm9rZVN0eWxlID0gJ3doaXRlJztcblxuICAgIC8vIGFuaW1hdGUgdGhlIGRhc2hlZCBsaW5lIGEgYml0IGhlcmUgZm9yIGZ1blxuICAgIC8vZ2Muc2V0TGluZURhc2godGhpcy5mb2N1c0xpbmVTdGVwW01hdGguZmxvb3IoMTAgKiAoRGF0ZS5ub3coKSAvIDMwMCAlIDEpKSAlIHRoaXMuZm9jdXNMaW5lU3RlcC5sZW5ndGhdKTtcblxuICAgIGdjLnN0cm9rZSgpO1xufTtcblxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cblBhaW50IHRoZSBiYWNrZ3JvdW5kIGNvbG9yIG92ZXIgdGhlIG92ZXJmbG93IGZyb20gdGhlIGZpbmFsIGNvbHVtbiBwYWludFxuICpcbiAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBnYyAtIFtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpXG4qL1xuUmVuZGVyZXIucHJvdG90eXBlLmJsYW5rT3V0T3ZlcmZsb3cgPSBmdW5jdGlvbihnYykge1xuICAgIHZhciBpc01heFggPSB0aGlzLmlzTGFzdENvbHVtblZpc2libGUoKTtcbiAgICB2YXIgY2hvcCA9IGlzTWF4WCA/IDEgOiAwO1xuICAgIHZhciB4ID0gdGhpcy5nZXRDb2x1bW5FZGdlcygpW3RoaXMuZ2V0Q29sdW1uRWRnZXMoKS5sZW5ndGggLSBjaG9wXTtcbiAgICB2YXIgYm91bmRzID0gdGhpcy5nZXRCb3VuZHMoKTtcbiAgICB2YXIgd2lkdGggPSBib3VuZHMud2lkdGgoKSAtIDIwMCAtIHg7XG4gICAgdmFyIGhlaWdodCA9IGJvdW5kcy5oZWlnaHQoKTtcbiAgICBnYy5maWxsU3R5bGUgPSB0aGlzLnJlc29sdmVQcm9wZXJ0eSgnYmFja2dyb3VuZENvbG9yMicpO1xuICAgIGdjLmZpbGxSZWN0KHggKyAxLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuaXRlcmF0ZSB0aGUgcmVuZGVyZXJpbmcgb3ZlcnJpZGVzIGFuZCBtYW5pZmVzdCBlYWNoXG4gKlxuICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGdjIC0gW0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRClcbiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyT3ZlcnJpZGVzID0gZnVuY3Rpb24oZ2MpIHtcbiAgICB2YXIgZ3JpZCA9IHRoaXMuZ2V0R3JpZCgpO1xuICAgIHZhciBjYWNoZSA9IGdyaWQucmVuZGVyT3ZlcnJpZGVzQ2FjaGU7XG4gICAgZm9yICh2YXIga2V5IGluIGNhY2hlKSB7XG4gICAgICAgIGlmIChjYWNoZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICB2YXIgb3ZlcnJpZGUgPSBjYWNoZVtrZXldO1xuICAgICAgICAgICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJPdmVycmlkZShnYywgb3ZlcnJpZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5jb3B5IGVhY2ggb3ZlcnJpZGVzIHNwZWNpZmllZCBhcmVhIHRvIGl0J3MgdGFyZ2V0IGFuZCBibGFuayBvdXQgdGhlIHNvdXJjZSBhcmVhXG4gKlxuICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGdjIC0gW0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRClcbiAqIEBwYXJhbSB7T3ZlcnJpZGVPYmplY3R9IG92ZXJyaWRlIC0gYW4gb2JqZWN0IHdpdGggZGV0YWlscyBjb250YWluIGFuIGFyZWEgYW5kIGEgdGFyZ2V0IGNvbnRleHRcbiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyT3ZlcnJpZGUgPSBmdW5jdGlvbihnYywgb3ZlcnJpZGUpIHtcbiAgICAvL2xldHMgYmxhbmsgb3V0IHRoZSBkcmFnIHJvd1xuICAgIHZhciBoZHBpUmF0aW8gPSBvdmVycmlkZS5oZHBpcmF0aW87XG4gICAgLy92YXIgZWRnZXMgPSB0aGlzLmdldENvbHVtbkVkZ2VzKCk7XG4gICAgdmFyIHN0YXJ0WCA9IG92ZXJyaWRlLnN0YXJ0WDsgLy9oZHBpUmF0aW8gKiBlZGdlc1tvdmVycmlkZS5jb2x1bW5JbmRleF07XG4gICAgdmFyIHdpZHRoID0gb3ZlcnJpZGUud2lkdGggKyAxO1xuICAgIHZhciBoZWlnaHQgPSBvdmVycmlkZS5oZWlnaHQ7XG4gICAgdmFyIHRhcmdldENUWCA9IG92ZXJyaWRlLmN0eDtcbiAgICB2YXIgaW1nRGF0YSA9IGdjLmdldEltYWdlRGF0YShzdGFydFgsIDAsIE1hdGgucm91bmQod2lkdGggKiBoZHBpUmF0aW8pLCBNYXRoLnJvdW5kKGhlaWdodCAqIGhkcGlSYXRpbykpO1xuICAgIHRhcmdldENUWC5wdXRJbWFnZURhdGEoaW1nRGF0YSwgMCwgMCk7XG4gICAgZ2MuZmlsbFN0eWxlID0gdGhpcy5yZXNvbHZlUHJvcGVydHkoJ2JhY2tncm91bmRDb2xvcjInKTtcbiAgICBnYy5maWxsUmVjdChNYXRoLnJvdW5kKHN0YXJ0WCAvIGhkcGlSYXRpbyksIDAsIHdpZHRoLCBoZWlnaHQpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5hbnN3ZXJzIGlmIHgsIHkgaXMgY3VycmVudGx5IGJlaW5nIGhvdmVyZWQgb3ZlclxuICogIyMjIyByZXR1cm5zOiBib29sZWFuXG4gKiBAcGFyYW0ge2ludGVnZXJ9IG9mZnNldFggLSB4IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7aW50ZWdlcn0gb2Zmc2V0WSAtIHkgY29vcmRpbmF0ZVxuICpcbiovXG5SZW5kZXJlci5wcm90b3R5cGUuaXNIb3ZlcmVkID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHJldHVybiB0aGlzLmdldEdyaWQoKS5pc0hvdmVyZWQoeCwgeSk7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbmFuc3dlcnMgaWYgcm93IHkgaXMgY3VycmVudGx5IGJlaW5nIGhvdmVyZWQgb3ZlclxuICogIyMjIyByZXR1cm5zOiBib29sZWFuXG4gKiBAcGFyYW0ge2ludGVnZXJ9IG9mZnNldFkgLSB5IGNvb3JkaW5hdGVcbiAqXG4qL1xuUmVuZGVyZXIucHJvdG90eXBlLmlzUm93SG92ZXJlZCA9IGZ1bmN0aW9uKHkpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHcmlkKCkuaXNSb3dIb3ZlcmVkKHkpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5hbnN3ZXJzIGlmIGNvbHVtbiB4IGlzIGN1cnJlbnRseSBiZWluZyBob3ZlcmVkIG92ZXJcbiAqICMjIyMgcmV0dXJuczogYm9vbGVhblxuICogQHBhcmFtIHtpbnRlZ2VyfSBvZmZzZXRYIC0geCBjb29yZGluYXRlXG4gKlxuKi9cblJlbmRlcmVyLnByb3RvdHlwZS5pc0NvbHVtbkhvdmVyZWQgPSBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0R3JpZCgpLmlzQ29sdW1uSG92ZXJlZCh4KTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuUHJvdGVjdGVkIHJlbmRlciB0aGUgbWFpbiBjZWxscy4gIFdlIHNuYXBzaG90IHRoZSBjb250ZXh0IHRvIGluc3VyZSBhZ2FpbnN0IGl0cyBwb2x1dGlvbi5cbiAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBnYyAtIFtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpXG4gKiBAcGFyYW0ge2ludGVnZXJ9IG9mZnNldFggLSB4IGNvb3JkaW5hdGUgdG8gc3RhcnQgYXRcbiAqIEBwYXJhbSB7aW50ZWdlcn0gb2Zmc2V0WSAtIHkgY29vcmRpbmF0ZSB0byBzdGFydCBhdFxuICpcbiovXG5SZW5kZXJlci5wcm90b3R5cGUucGFpbnRDZWxscyA9IGZ1bmN0aW9uKGdjKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgZ2Muc2F2ZSgpO1xuICAgICAgICB0aGlzLl9wYWludENlbGxzKGdjKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgZ2MucmVzdG9yZSgpO1xuICAgIH1cbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuYW5zd2VycyBpZiBhIHNwZWNmaWMgY29sdW1uIGluIHRoZSBmaXhlZCByb3cgYXJlYSBpcyBzZWxlY3RlZFxuICogQHBhcmFtIHtpbnRlZ2VyfSBjb2xJbmRleCAtIGNvbHVtbiBpbmRleFxuICpcbiovXG5SZW5kZXJlci5wcm90b3R5cGUuaXNDZWxsU2VsZWN0ZWRJblJvdyA9IGZ1bmN0aW9uKGNvbEluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0R3JpZCgpLmlzQ2VsbFNlbGVjdGVkSW5Sb3coY29sSW5kZXgpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5hbnN3ZXJzIGlmIGEgc3BlY2ZpYyByb3cgaW4gdGhlIGZpeGVkIGNvbHVtbiBhcmVhIGlzIHNlbGVjdGVkXG4gKiBAcGFyYW0ge2ludGVnZXJ9IHJvd0luZGV4IC0gY29sdW1uIGluZGV4XG4gKlxuKi9cblJlbmRlcmVyLnByb3RvdHlwZS5pc0NlbGxTZWxlY3RlZEluQ29sdW1uID0gZnVuY3Rpb24ocm93SW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHcmlkKCkuaXNDZWxsU2VsZWN0ZWRJbkNvbHVtbihyb3dJbmRleCk7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbmFuc3dlcnMgY3VycmVudCB2ZXJ0aWNhbCBzY3JvbGwgdmFsdWVcbiAqICMjIyMgcmV0dXJuczogaW50ZWdlclxuKi9cblJlbmRlcmVyLnByb3RvdHlwZS5nZXRTY3JvbGxUb3AgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3QgPSB0aGlzLmdldEdyaWQoKS5nZXRWU2Nyb2xsVmFsdWUoKTtcbiAgICByZXR1cm4gc3Q7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbmFuc3dlcnMgY3VycmVudCBob3Jpem9udGFsIHNjcm9sbCB2YWx1ZVxuICogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4qL1xuUmVuZGVyZXIucHJvdG90eXBlLmdldFNjcm9sbExlZnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3QgPSB0aGlzLmdldEdyaWQoKS5nZXRIU2Nyb2xsVmFsdWUoKTtcbiAgICByZXR1cm4gc3Q7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbmdldHRlciBmb3IgbXkgYmVoYXZpb3IgKG1vZGVsKVxuICogIyMjIyByZXR1cm5zOiBbZmluLWh5cGVyZ3JpZC1iZWhhdmlvci1iYXNlXShtb2R1bGUtYmVoYXZpb3JzX2Jhc2UuaHRtbClcbiovXG5SZW5kZXJlci5wcm90b3R5cGUuZ2V0QmVoYXZpb3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHcmlkKCkuZ2V0QmVoYXZpb3IoKTtcbn07XG5cblJlbmRlcmVyLnByb3RvdHlwZS5nZXRDb2x1bW5FZGdlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmNvbHVtbkVkZ2VzO1xufTtcblxuUmVuZGVyZXIucHJvdG90eXBlLmdldFJvd0VkZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucm93RWRnZXM7XG59O1xuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5hbnN3ZXJzIHRoZSByb3cgaGVpZ2h0IG9mIHRoZSByb3cgYXQgaW5kZXggcm93SW5kZXhcbiAqICMjIyMgcmV0dXJuczogaW50ZWdlclxuICogQHBhcmFtIHtpbnRlZ2VyfSByb3dJbmRleCAtIHRoZSByb3cgaW5kZXhcbiovXG5SZW5kZXJlci5wcm90b3R5cGUuZ2V0Um93SGVpZ2h0ID0gZnVuY3Rpb24ocm93SW5kZXgpIHtcbiAgICB2YXIgaGVpZ2h0ID0gdGhpcy5nZXRCZWhhdmlvcigpLmdldFJvd0hlaWdodChyb3dJbmRleCk7XG4gICAgcmV0dXJuIGhlaWdodDtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuYW5zd2VycyB0aGUgY29sdW1uV2lkdGggb2YgdGhlIGNvbHVtbiBhdCBpbmRleCBjb2x1bW5JbmRleFxuICogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4gKiBAcGFyYW0ge2ludGVnZXJ9IGNvbHVtbkluZGV4IC0gdGhlIHJvdyBpbmRleFxuKi9cblJlbmRlcmVyLnByb3RvdHlwZS5nZXRDb2x1bW5XaWR0aCA9IGZ1bmN0aW9uKGNvbHVtbkluZGV4KSB7XG4gICAgdmFyIHdpZHRoID0gdGhpcy5nZXRHcmlkKCkuZ2V0Q29sdW1uV2lkdGgoY29sdW1uSW5kZXgpO1xuICAgIHJldHVybiB3aWR0aDtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuYW5zd2VyIHRydWUgaWYgdGhlIGxhc3QgY29sIHdhcyByZW5kZXJlZCAoaXMgdmlzaWJsZSlcbiAqICMjIyMgcmV0dXJuczogYm9vbGVhblxuKi9cblJlbmRlcmVyLnByb3RvdHlwZS5pc0xhc3RDb2x1bW5WaXNpYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhc3RDb2x1bW5JbmRleCA9IHRoaXMuZ2V0Q29sdW1uQ291bnQoKSAtIDE7XG4gICAgdmFyIGlzTWF4ID0gdGhpcy52aXNpYmxlQ29sdW1ucy5pbmRleE9mKGxhc3RDb2x1bW5JbmRleCkgIT09IC0xO1xuICAgIHJldHVybiBpc01heDtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuYW5zd2VyIHRoZSByZW5kZXJlZCBjb2x1bW4gd2lkdGggYXQgaW5kZXhcbiAqICMjIyMgcmV0dXJuczogaW50ZWdlclxuKi9cblJlbmRlcmVyLnByb3RvdHlwZS5nZXRSZW5kZXJlZFdpZHRoID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDb2x1bW5FZGdlcygpW2luZGV4XTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuYW5zd2VyIHRoZSByZW5kZXJlZCByb3cgaGVpZ2h0IGF0IGluZGV4XG4gKiAjIyMjIHJldHVybnM6IGludGVnZXJcbiovXG5SZW5kZXJlci5wcm90b3R5cGUuZ2V0UmVuZGVyZWRIZWlnaHQgPSBmdW5jdGlvbihpbmRleCkge1xuICAgIHJldHVybiB0aGlzLnJvd0VkZ2VzW2luZGV4XTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuZ2V0dGVyIGZvciBteSBbZmluLWNhbnZhc10oaHR0cHM6Ly9naXRodWIuY29tL3N0ZXZld2lydHMvZmluLWNhbnZhcylcbiAqICMjIyMgcmV0dXJuczogW2Zpbi1jYW52YXNdKGh0dHBzOi8vZ2l0aHViLmNvbS9zdGV2ZXdpcnRzL2Zpbi1jYW52YXMpXG4qL1xuUmVuZGVyZXIucHJvdG90eXBlLmdldENhbnZhcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmdldEdyaWQoKS5nZXRDYW52YXMoKTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuYW5zd2VyIGlmIHRoZSB1c2VyIGlzIGN1cnJlbnRseSBkcmFnZ2luZyBhIGNvbHVtbiBmb3IgcmVvcmRlcmluZ1xuICogIyMjIyByZXR1cm5zOiBib29sZWFuXG4qL1xuUmVuZGVyZXIucHJvdG90eXBlLmlzRHJhZ2dpbmdDb2x1bW4gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHcmlkKCkuaXNEcmFnZ2luZ0NvbHVtbigpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5hbnN3ZXIgdGhlIHJvdyB0byBnb3RvIGZvciBhIHBhZ2UgdXBcbiAqICMjIyMgcmV0dXJuczogaW50ZWdlclxuKi9cblJlbmRlcmVyLnByb3RvdHlwZS5nZXRQYWdlVXBSb3cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYmVoYXZpb3IgPSB0aGlzLmdldEJlaGF2aW9yKCk7XG4gICAgdmFyIHNjcm9sbEhlaWdodCA9IHRoaXMuZ2V0VmlzaWJsZVNjcm9sbEhlaWdodCgpO1xuICAgIHZhciBoZWFkZXJSb3dzID0gdGhpcy5nZXRHcmlkKCkuZ2V0Rml4ZWRSb3dDb3VudCgpO1xuICAgIHZhciB0b3AgPSB0aGlzLmRhdGFXaW5kb3cub3JpZ2luLnkgLSBoZWFkZXJSb3dzO1xuICAgIHZhciBzY2FuSGVpZ2h0ID0gMDtcbiAgICB3aGlsZSAoc2NhbkhlaWdodCA8IHNjcm9sbEhlaWdodCAmJiB0b3AgPiAtMSkge1xuICAgICAgICBzY2FuSGVpZ2h0ID0gc2NhbkhlaWdodCArIGJlaGF2aW9yLmdldFJvd0hlaWdodCh0b3ApO1xuICAgICAgICB0b3AtLTtcbiAgICB9XG4gICAgcmV0dXJuIHRvcCArIDE7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbmFuc3dlciB0aGUgcm93IHRvIGdvdG8gZm9yIGEgcGFnZSBkb3duXG4gKiAjIyMjIHJldHVybnM6IGludGVnZXJcbiovXG5SZW5kZXJlci5wcm90b3R5cGUuZ2V0UGFnZURvd25Sb3cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGVhZGVyUm93cyA9IHRoaXMuZ2V0R3JpZCgpLmdldEZpeGVkUm93Q291bnQoKTtcbiAgICB2YXIgcm93TnVtID0gdGhpcy5kYXRhV2luZG93LmNvcm5lci55IC0gaGVhZGVyUm93cyAtIDE7XG4gICAgcmV0dXJuIHJvd051bTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSBudW1iZXIgb2YgY29sdW1uc1xuICpcbiAqICMjIyMgcmV0dXJuczogaW50ZWdlclxuICovXG5SZW5kZXJlci5wcm90b3R5cGUuZ2V0Q29sdW1uQ291bnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHcmlkKCkuZ2V0Q29sdW1uQ291bnQoKTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSBudW1iZXIgb2Ygcm93c1xuICpcbiAqICMjIyMgcmV0dXJuczogaW50ZWdlclxuICovXG5SZW5kZXJlci5wcm90b3R5cGUuZ2V0Um93Q291bnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHcmlkKCkuZ2V0Um93Q291bnQoKTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSBudW1iZXIgb2YgZml4ZWQgY29sdW1uc1xuICpcbiAqICMjIyMgcmV0dXJuczogaW50ZWdlclxuICovXG5SZW5kZXJlci5wcm90b3R5cGUuZ2V0Rml4ZWRDb2x1bW5Db3VudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmdldEdyaWQoKS5nZXRGaXhlZENvbHVtbkNvdW50KCk7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbnJldHVybiB0aGUgbnVtYmVyIG9mIGZpeGVkIHJvd3NcbiAqXG4gKiAjIyMjIHJldHVybnM6IGludGVnZXJcbiAqL1xuUmVuZGVyZXIucHJvdG90eXBlLmdldEZpeGVkUm93Q291bnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHcmlkKCkuZ2V0Rml4ZWRSb3dDb3VudCgpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5yZXR1cm4gdGhlIG51bWJlciBvZiBmaXhlZCByb3dzXG4gKlxuICogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4gKi9cblJlbmRlcmVyLnByb3RvdHlwZS5nZXRIZWFkZXJSb3dDb3VudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmdldEdyaWQoKS5nZXRIZWFkZXJSb3dDb3VudCgpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5yZXR1cm4gdGhlIG51bWJlciBvZiBmaXhlZCByb3dzXG4gKlxuICogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4gKi9cblJlbmRlcmVyLnByb3RvdHlwZS5nZXRIZWFkZXJDb2x1bW5Db3VudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmdldEdyaWQoKS5nZXRIZWFkZXJDb2x1bW5Db3VudCgpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5VbnByb3RlY3RlZCByZW5kZXJpbmcgdGhlIGZpeGVkIGNvbHVtbnMgYWxvbmcgdGhlIGxlZnQgc2lkZVxuICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGdjIC0gW0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRClcbiAqIEBwYXJhbSB7aW50ZWdlcn0gb2Zmc2V0WCAtIHggY29vcmRpbmF0ZSB0byBzdGFydCBhdFxuICogQHBhcmFtIHtpbnRlZ2VyfSBvZmZzZXRZIC0geSBjb29yZGluYXRlIHRvIHN0YXJ0IGF0XG4gKiBAcGFyYW0ge2ludGVnZXJ9IG51bUNvbHVtbnMgLSB0aGUgbWF4IGNvbHVtbnMgdG8gaXRlcmF0ZSB0aHJvdWdoXG4gKiBAcGFyYW0ge2ludGVnZXJ9IG51bVJvd3MgLSB0aGUgbWF4IHJvd3MgdG8gaXRlcmF0ZSB0aHJvdWdoXG4gKlxuKi9cblJlbmRlcmVyLnByb3RvdHlwZS5fcGFpbnRDZWxscyA9IGZ1bmN0aW9uKGdjKSB7XG4gICAgdmFyIHgsIHksIGMsIHIgPSAwO1xuXG4gICAgdmFyIGNvbHVtbkVkZ2VzID0gdGhpcy5nZXRDb2x1bW5FZGdlcygpO1xuICAgIHZhciByb3dFZGdlcyA9IHRoaXMucm93RWRnZXM7XG4gICAgdGhpcy5idXR0b25DZWxscyA9IHt9O1xuICAgIHZhciB2aXNpYmxlQ29scyA9IHRoaXMuZ2V0VmlzaWJsZUNvbHVtbnMoKTtcbiAgICB2YXIgdmlzaWJsZVJvd3MgPSB0aGlzLmdldFZpc2libGVSb3dzKCk7XG5cbiAgICB2YXIgd2lkdGggPSBjb2x1bW5FZGdlc1tjb2x1bW5FZGdlcy5sZW5ndGggLSAxXTtcbiAgICB2YXIgaGVpZ2h0ID0gcm93RWRnZXNbcm93RWRnZXMubGVuZ3RoIC0gMV07XG5cbiAgICBnYy5tb3ZlVG8oMCwgMCk7XG4gICAgZ2MucmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICBnYy5zdHJva2UoKTtcbiAgICBnYy5jbGlwKCk7XG5cbiAgICB2YXIgbG9vcExlbmd0aCA9IHZpc2libGVDb2xzLmxlbmd0aDtcbiAgICB2YXIgbG9vcFN0YXJ0ID0gMDtcblxuICAgIGlmICh0aGlzLmdldEdyaWQoKS5pc1Nob3dSb3dOdW1iZXJzKCkpIHtcbiAgICAgICAgLy9sb29wTGVuZ3RoKys7XG4gICAgICAgIGxvb3BTdGFydC0tO1xuICAgIH1cblxuICAgIGZvciAoeCA9IGxvb3BTdGFydDsgeCA8IGxvb3BMZW5ndGg7IHgrKykge1xuICAgICAgICBjID0gdmlzaWJsZUNvbHNbeF07XG4gICAgICAgIHRoaXMucmVuZGVyZWRDb2x1bW5NaW5XaWR0aHNbY10gPSAwO1xuICAgICAgICBmb3IgKHkgPSAwOyB5IDwgdmlzaWJsZVJvd3MubGVuZ3RoOyB5KyspIHtcbiAgICAgICAgICAgIHIgPSB2aXNpYmxlUm93c1t5XTtcbiAgICAgICAgICAgIHRoaXMuX3BhaW50Q2VsbChnYywgYywgcik7XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuV2Ugb3B0ZWQgdG8gbm90IHBhaW50IGJvcmRlcnMgZm9yIGVhY2ggY2VsbCBhcyB0aGF0IHdhcyBleHRyZW1lbHkgZXhwZW5zaXZlLiAgSW5zdGVhZCB3ZSBkcmF3IGdyaWRsaW5lcyBoZXJlLiAgQWxzbyB3ZSByZWNvcmQgdGhlIHdpZHRocyBhbmQgaGVpZ2h0cyBmb3IgbGF0ZXIuXG4gKlxuICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGdjIC0gW0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRClcbiAqIEBwYXJhbSB7aW50ZWdlcn0gb2Zmc2V0WCAtIHggY29vcmRpbmF0ZSB0byBzdGFydCBhdFxuICogQHBhcmFtIHtpbnRlZ2VyfSBvZmZzZXRZIC0geSBjb29yZGluYXRlIHRvIHN0YXJ0IGF0XG4qL1xuUmVuZGVyZXIucHJvdG90eXBlLnBhaW50R3JpZGxpbmVzID0gZnVuY3Rpb24oZ2MpIHtcbiAgICB2YXIgeCwgeSwgYywgciA9IDA7XG5cbiAgICB2YXIgY29sV2lkdGhzID0gdGhpcy5nZXRDb2x1bW5FZGdlcygpO1xuICAgIHZhciByb3dIZWlnaHRzID0gdGhpcy5yb3dFZGdlcztcblxuICAgIHZhciB2aWV3V2lkdGggPSBjb2xXaWR0aHNbY29sV2lkdGhzLmxlbmd0aCAtIDFdO1xuICAgIHZhciB2aWV3SGVpZ2h0ID0gcm93SGVpZ2h0c1tyb3dIZWlnaHRzLmxlbmd0aCAtIDFdO1xuXG4gICAgdmFyIGRyYXdUaGVtSCA9IHRoaXMucmVzb2x2ZVByb3BlcnR5KCdncmlkTGluZXNIJyk7XG4gICAgdmFyIGRyYXdUaGVtViA9IHRoaXMucmVzb2x2ZVByb3BlcnR5KCdncmlkTGluZXNWJyk7XG4gICAgdmFyIGxpbmVDb2xvciA9IHRoaXMucmVzb2x2ZVByb3BlcnR5KCdsaW5lQ29sb3InKTtcblxuICAgIGdjLmJlZ2luUGF0aCgpO1xuICAgIGdjLnN0cm9rZVN0eWxlID0gbGluZUNvbG9yO1xuICAgIGdjLmxpbmVXaWR0aCA9IHRoaXMucmVzb2x2ZVByb3BlcnR5KCdsaW5lV2lkdGgnKTtcbiAgICBnYy5tb3ZlVG8oMCwgMCk7XG5cbiAgICBpZiAoZHJhd1RoZW1WKSB7XG4gICAgICAgIGZvciAoYyA9IDA7IGMgPCBjb2xXaWR0aHMubGVuZ3RoICsgMTsgYysrKSB7XG4gICAgICAgICAgICB4ID0gY29sV2lkdGhzW2NdICsgMC41O1xuICAgICAgICAgICAgZ2MubW92ZVRvKHgsIDApO1xuICAgICAgICAgICAgZ2MubGluZVRvKHgsIHZpZXdIZWlnaHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRyYXdUaGVtSCkge1xuICAgICAgICBmb3IgKHIgPSAwOyByIDwgcm93SGVpZ2h0cy5sZW5ndGg7IHIrKykge1xuICAgICAgICAgICAgeSA9IHJvd0hlaWdodHNbcl0gKyAwLjU7XG4gICAgICAgICAgICBnYy5tb3ZlVG8oMCwgeSk7XG4gICAgICAgICAgICBnYy5saW5lVG8odmlld1dpZHRoLCB5KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnYy5zdHJva2UoKTtcbiAgICBnYy5jbG9zZVBhdGgoKTtcbn07XG5cblJlbmRlcmVyLnByb3RvdHlwZS5wYWludENlbGwgPSBmdW5jdGlvbihnYywgeCwgeSkge1xuICAgIHZhciBjLCByID0gMDtcbiAgICB2YXIgdmlzaWJsZUNvbHMgPSB0aGlzLmdldFZpc2libGVDb2x1bW5zKCk7XG4gICAgdmFyIHZpc2libGVSb3dzID0gdGhpcy5nZXRWaXNpYmxlUm93cygpO1xuICAgIGdjLm1vdmVUbygwLCAwKTtcbiAgICBjID0gdmlzaWJsZUNvbHNbeF07XG4gICAgciA9IHZpc2libGVSb3dzW3ldO1xuICAgIGlmICghYykge1xuICAgICAgICByZXR1cm47IC8vIHdlcmUgbm90IGJlaW5nIHZpZXdlZCBhdCBhdCB0aGUgbW9tZW50LCBub3RoaW5nIHRvIHBhaW50XG4gICAgfVxuICAgIHRoaXMuX3BhaW50Q2VsbChnYywgYywgcik7XG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUuX3BhaW50Q2VsbCA9IGZ1bmN0aW9uKGdjLCBjLCByKSB7XG5cbiAgICB2YXIgZ3JpZCA9IHRoaXMuZ2V0R3JpZCgpO1xuICAgIHZhciBiZWhhdmlvciA9IHRoaXMuZ2V0QmVoYXZpb3IoKTtcbiAgICB2YXIgYmFzZVByb3BlcnRpZXMgPSBiZWhhdmlvci5nZXRDb2x1bW5Qcm9wZXJ0aWVzKGMpO1xuICAgIHZhciBjb2x1bW5Qcm9wZXJ0aWVzID0gYmFzZVByb3BlcnRpZXM7XG4gICAgdmFyIGhlYWRlclJvd0NvdW50ID0gYmVoYXZpb3IuZ2V0SGVhZGVyUm93Q291bnQoKTtcbiAgICAvL3ZhciBoZWFkZXJDb2x1bW5Db3VudCA9IGJlaGF2aW9yLmdldEhlYWRlckNvbHVtbkNvdW50KCk7XG5cbiAgICB2YXIgaXNTaG93Um93TnVtYmVycyA9IGdyaWQuaXNTaG93Um93TnVtYmVycygpO1xuICAgIHZhciBpc0hlYWRlclJvdyA9IHIgPCBoZWFkZXJSb3dDb3VudDtcbiAgICAvL3ZhciBpc0hlYWRlckNvbHVtbiA9IGMgPCBoZWFkZXJDb2x1bW5Db3VudDtcbiAgICB2YXIgaXNGaWx0ZXJSb3cgPSBncmlkLmlzRmlsdGVyUm93KHIpO1xuICAgIHZhciBpc0hpZXJhcmNoeUNvbHVtbiA9IGdyaWQuaXNIaWVyYXJjaHlDb2x1bW4oYyk7XG4gICAgdmFyIGlzUm93U2VsZWN0ZWQgPSBncmlkLmlzUm93U2VsZWN0ZWQocik7XG4gICAgdmFyIGlzQ29sdW1uU2VsZWN0ZWQgPSBncmlkLmlzQ29sdW1uU2VsZWN0ZWQoYyk7XG4gICAgdmFyIGlzQ2VsbFNlbGVjdGVkID0gZ3JpZC5pc0NlbGxTZWxlY3RlZChjLCByKTtcbiAgICB2YXIgaXNDZWxsU2VsZWN0ZWRJbkNvbHVtbiA9IGdyaWQuaXNDZWxsU2VsZWN0ZWRJbkNvbHVtbihjKTtcbiAgICB2YXIgaXNDZWxsU2VsZWN0ZWRJblJvdyA9IGdyaWQuaXNDZWxsU2VsZWN0ZWRJblJvdyhyKTtcbiAgICB2YXIgYXJlQWxsUm93c1NlbGVjdGVkID0gZ3JpZC5hcmVBbGxSb3dzU2VsZWN0ZWQoKTtcblxuICAgIHZhciBjZWxsUHJvcGVydGllcztcblxuICAgIGlmICgoaXNTaG93Um93TnVtYmVycyAmJiBjID09PSAtMSkgfHwgKCFpc1Nob3dSb3dOdW1iZXJzICYmIGMgPT09IDApKSB7XG4gICAgICAgIGlmIChpc1Jvd1NlbGVjdGVkKSB7XG4gICAgICAgICAgICBiYXNlUHJvcGVydGllcyA9IGJhc2VQcm9wZXJ0aWVzLnJvd0hlYWRlclJvd1NlbGVjdGlvbjtcbiAgICAgICAgICAgIGNlbGxQcm9wZXJ0aWVzID0gT2JqZWN0LmNyZWF0ZShiYXNlUHJvcGVydGllcyk7XG4gICAgICAgICAgICBjZWxsUHJvcGVydGllcy5pc1NlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJhc2VQcm9wZXJ0aWVzID0gYmFzZVByb3BlcnRpZXMucm93SGVhZGVyO1xuICAgICAgICAgICAgY2VsbFByb3BlcnRpZXMgPSBPYmplY3QuY3JlYXRlKGJhc2VQcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgIGNlbGxQcm9wZXJ0aWVzLmlzU2VsZWN0ZWQgPSBpc0NlbGxTZWxlY3RlZEluUm93O1xuICAgICAgICB9XG4gICAgICAgIGNlbGxQcm9wZXJ0aWVzLmlzVXNlckRhdGFBcmVhID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChpc0hlYWRlclJvdykge1xuICAgICAgICBpZiAoaXNGaWx0ZXJSb3cpIHtcbiAgICAgICAgICAgIGJhc2VQcm9wZXJ0aWVzID0gYmFzZVByb3BlcnRpZXMuZmlsdGVyUHJvcGVydGllcztcbiAgICAgICAgICAgIGNlbGxQcm9wZXJ0aWVzID0gT2JqZWN0LmNyZWF0ZShiYXNlUHJvcGVydGllcyk7XG4gICAgICAgICAgICBjZWxsUHJvcGVydGllcy5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNDb2x1bW5TZWxlY3RlZCkge1xuICAgICAgICAgICAgYmFzZVByb3BlcnRpZXMgPSBiYXNlUHJvcGVydGllcy5jb2x1bW5IZWFkZXJDb2x1bW5TZWxlY3Rpb247XG4gICAgICAgICAgICBjZWxsUHJvcGVydGllcyA9IE9iamVjdC5jcmVhdGUoYmFzZVByb3BlcnRpZXMpO1xuICAgICAgICAgICAgY2VsbFByb3BlcnRpZXMuaXNTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBiYXNlUHJvcGVydGllcyA9IGJhc2VQcm9wZXJ0aWVzLmNvbHVtbkhlYWRlcjtcbiAgICAgICAgICAgIGNlbGxQcm9wZXJ0aWVzID0gT2JqZWN0LmNyZWF0ZShiYXNlUHJvcGVydGllcyk7XG4gICAgICAgICAgICBjZWxsUHJvcGVydGllcy5pc1NlbGVjdGVkID0gaXNDZWxsU2VsZWN0ZWRJbkNvbHVtbjtcbiAgICAgICAgfVxuICAgICAgICBjZWxsUHJvcGVydGllcy5pc1VzZXJEYXRhQXJlYSA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoaXNIaWVyYXJjaHlDb2x1bW4pIHtcbiAgICAgICAgYmFzZVByb3BlcnRpZXMgPSBiYXNlUHJvcGVydGllcy5yb3dIZWFkZXI7XG4gICAgICAgIGNlbGxQcm9wZXJ0aWVzID0gT2JqZWN0LmNyZWF0ZShiYXNlUHJvcGVydGllcyk7XG4gICAgICAgIGNlbGxQcm9wZXJ0aWVzLmlzU2VsZWN0ZWQgPSBpc0NlbGxTZWxlY3RlZEluUm93O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNlbGxQcm9wZXJ0aWVzID0gT2JqZWN0LmNyZWF0ZShiYXNlUHJvcGVydGllcyk7XG4gICAgICAgIGNlbGxQcm9wZXJ0aWVzLmlzU2VsZWN0ZWQgPSBpc0NlbGxTZWxlY3RlZCB8fCBpc1Jvd1NlbGVjdGVkIHx8IGlzQ29sdW1uU2VsZWN0ZWQ7XG4gICAgICAgIGNlbGxQcm9wZXJ0aWVzLmlzVXNlckRhdGFBcmVhID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB2YXIgcm93TnVtID0gciAtIGhlYWRlclJvd0NvdW50ICsgMTtcblxuICAgIGlmIChjID09PSAtMSkge1xuICAgICAgICB2YXIgY2hlY2tlZEltYWdlID0gaXNSb3dTZWxlY3RlZCA/ICdjaGVja2VkJyA6ICd1bmNoZWNrZWQnO1xuICAgICAgICBjZWxsUHJvcGVydGllcy52YWx1ZSA9IGlzSGVhZGVyUm93ID8gJycgOiBbYmVoYXZpb3IuZ2V0SW1hZ2UoY2hlY2tlZEltYWdlKSwgcm93TnVtLCBudWxsXTtcbiAgICAgICAgaWYgKHIgPT09IDApIHtcbiAgICAgICAgICAgIGNoZWNrZWRJbWFnZSA9IGFyZUFsbFJvd3NTZWxlY3RlZCA/ICdjaGVja2VkJyA6ICd1bmNoZWNrZWQnO1xuICAgICAgICAgICAgY2VsbFByb3BlcnRpZXMudmFsdWUgPSBbYmVoYXZpb3IuZ2V0SW1hZ2UoY2hlY2tlZEltYWdlKSwgJycsIG51bGxdO1xuICAgICAgICB9IGVsc2UgaWYgKGlzRmlsdGVyUm93KSB7XG4gICAgICAgICAgICBjZWxsUHJvcGVydGllcy52YWx1ZSA9IFtiZWhhdmlvci5nZXRJbWFnZSgnZmlsdGVyLW9mZicpLCAnJywgbnVsbF07XG5cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNlbGxQcm9wZXJ0aWVzLnZhbHVlID0gZ3JpZC5nZXRWYWx1ZShjLCByKTtcbiAgICB9XG4gICAgY2VsbFByb3BlcnRpZXMuaGFsaWduID0gZ3JpZC5nZXRDb2x1bW5BbGlnbm1lbnQoYyk7XG4gICAgY2VsbFByb3BlcnRpZXMuaXNDb2x1bW5Ib3ZlcmVkID0gdGhpcy5pc1Jvd0hvdmVyZWQoYywgcik7XG4gICAgY2VsbFByb3BlcnRpZXMuaXNSb3dIb3ZlcmVkID0gdGhpcy5pc0NvbHVtbkhvdmVyZWQoYywgcik7XG4gICAgY2VsbFByb3BlcnRpZXMuYm91bmRzID0gdGhpcy5fZ2V0Qm91bmRzT2ZDZWxsKGMsIHIpO1xuICAgIGNlbGxQcm9wZXJ0aWVzLmlzQ2VsbFNlbGVjdGVkID0gaXNDZWxsU2VsZWN0ZWQ7XG4gICAgY2VsbFByb3BlcnRpZXMuaXNSb3dTZWxlY3RlZCA9IGlzUm93U2VsZWN0ZWQ7XG4gICAgY2VsbFByb3BlcnRpZXMuaXNDb2x1bW5TZWxlY3RlZCA9IGlzQ29sdW1uU2VsZWN0ZWQ7XG4gICAgY2VsbFByb3BlcnRpZXMuaXNJbkN1cnJlbnRTZWxlY3Rpb25SZWN0YW5nbGUgPSBncmlkLmlzSW5DdXJyZW50U2VsZWN0aW9uUmVjdGFuZ2xlKGMsIHIpO1xuXG4gICAgdmFyIG1vdXNlRG93blN0YXRlID0gZ3JpZC5tb3VzZURvd25TdGF0ZTtcbiAgICBpZiAobW91c2VEb3duU3RhdGUpIHtcbiAgICAgICAgdmFyIHBvaW50ID0gbW91c2VEb3duU3RhdGUuZ3JpZENlbGw7XG4gICAgICAgIGNlbGxQcm9wZXJ0aWVzLm1vdXNlRG93biA9IHBvaW50LnggPT09IGMgJiYgcG9pbnQueSA9PT0gcjtcbiAgICB9XG5cbiAgICBjZWxsUHJvcGVydGllcy54ID0gYztcbiAgICBjZWxsUHJvcGVydGllcy55ID0gcjtcblxuICAgIGJlaGF2aW9yLmNlbGxQcm9wZXJ0aWVzUHJlUGFpbnROb3RpZmljYXRpb24oY2VsbFByb3BlcnRpZXMpO1xuXG4gICAgdmFyIGNlbGwgPSBiZWhhdmlvci5nZXRDZWxsUmVuZGVyZXIoY2VsbFByb3BlcnRpZXMsIGMsIHIpO1xuICAgIHZhciBvdmVycmlkZXMgPSBiZWhhdmlvci5nZXRDZWxsUHJvcGVydGllcyhjLCByKTtcblxuICAgIC8vZGVjbGFyYXRpdmUgY2VsbCBwcm9wZXJ0aWVzXG4gICAgaWYgKG92ZXJyaWRlcykge1xuICAgICAgICBtZXJnZShjZWxsUHJvcGVydGllcywgb3ZlcnJpZGVzKTtcbiAgICB9XG5cbiAgICAvL2FsbG93IHRoZSByZW5kZXJlciB0byBpZGVudGlmeSBpdHNlbGYgaWYgaXQncyBhIGJ1dHRvblxuICAgIGNlbGxQcm9wZXJ0aWVzLmJ1dHRvbkNlbGxzID0gdGhpcy5idXR0b25DZWxscztcblxuICAgIGNlbGwucGFpbnQoZ2MsIGNlbGxQcm9wZXJ0aWVzKTtcblxuICAgIHRoaXMucmVuZGVyZWRDb2x1bW5NaW5XaWR0aHNbY10gPSBNYXRoLm1heChjZWxsUHJvcGVydGllcy5taW5XaWR0aCB8fCAwLCB0aGlzLnJlbmRlcmVkQ29sdW1uTWluV2lkdGhzW2NdKTtcbiAgICBjb2x1bW5Qcm9wZXJ0aWVzLnByZWZlcnJlZFdpZHRoID0gdGhpcy5yZW5kZXJlZENvbHVtbk1pbldpZHRoc1tjXTtcbn07XG5SZW5kZXJlci5wcm90b3R5cGUuaXNWaWV3YWJsZUJ1dHRvbiA9IGZ1bmN0aW9uKGMsIHIpIHtcbiAgICB2YXIga2V5ID0gYyArICcsJyArIHI7XG4gICAgcmV0dXJuIHRoaXMuYnV0dG9uQ2VsbHNba2V5XSA9PT0gdHJ1ZTtcbn07XG5SZW5kZXJlci5wcm90b3R5cGUuZ2V0Um93TnVtYmVyc1dpZHRoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvbEVkZ2VzID0gdGhpcy5nZXRDb2x1bW5FZGdlcygpO1xuICAgIGlmIChjb2xFZGdlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiBjb2xFZGdlc1swXTtcbn07XG5SZW5kZXJlci5wcm90b3R5cGUuc3RhcnRBbmltYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhbmltYXRlO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBhbmltYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYuYW5pbWF0ZSgpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7XG4gICAgfTtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7XG59O1xuUmVuZGVyZXIucHJvdG90eXBlLmFuaW1hdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY3R4ID0gdGhpcy5nZXRDYW52YXMoKS5jYW52YXNDVFg7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5zYXZlKCk7XG4gICAgdGhpcy5yZW5kZXJGb2N1c0NlbGwoY3R4KTtcbiAgICBjdHgucmVzdG9yZSgpO1xuICAgIGN0eC5jbG9zZVBhdGgoKTtcbn07XG5cblJlbmRlcmVyLnByb3RvdHlwZS5nZXRCb3VuZHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5ib3VuZHM7XG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUuc2V0Qm91bmRzID0gZnVuY3Rpb24oYm91bmRzKSB7XG4gICAgcmV0dXJuIHRoaXMuYm91bmRzID0gYm91bmRzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjtcbiIsIi8qIGdsb2JhbCBSYW5nZVNlbGVjdGlvbk1vZGVsICovXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICpcbiAqIEBtb2R1bGUgLlxcc2VsZWN0aW9uLW1vZGVsXG4gKiBAZGVzY3JpcHRpb25cbiBXZSByZXByZXNlbnQgc2VsZWN0aW9ucyBhcyBhIGxpc3Qgb2YgcmVjdGFuZ2xlcyBiZWNhdXNlIGxhcmdlIGFyZWFzIGNhbiBiZSByZXByZXNlbnRlZCBhbmQgdGVzdGVkIGFnYWluc3QgcXVpY2tseSB3aXRoIGEgbWluaW1hbCBhbW91bnQgb2YgbWVtb3J5IHVzYWdlLiBBbHNvIHdlIG5lZWQgdG8gbWFpbnRhaW4gdGhlIHNlbGVjdGlvbiByZWN0YW5nbGVzIGZsYXR0ZW5lZCBjb3VudGVyIHBhcnRzIHNvIHdlIGNhbiB0ZXN0IGZvciBzaW5nbGUgZGltZW5zaW9uIGNvbnRhaW5zLiAgVGhpcyBpcyBob3cgd2Uga25vdyB0byBoaWdobGlnaHQgdGhlIGZpeGVkIHJlZ2lvbnMgb24gdGhlIGVkZ2VzIG9mIHRoZSBncmlkLlxuICovXG5cbmZ1bmN0aW9uIFNlbGVjdGlvbk1vZGVsKCkge1xuICAgIHRoaXMuc2VsZWN0aW9ucyA9IFtdO1xuICAgIHRoaXMuZmxhdHRlbmVkWCA9IFtdO1xuICAgIHRoaXMuZmxhdHRlbmVkWSA9IFtdO1xuICAgIHRoaXMucm93U2VsZWN0aW9uTW9kZWwgPSBuZXcgUmFuZ2VTZWxlY3Rpb25Nb2RlbCgpO1xuICAgIHRoaXMuY29sdW1uU2VsZWN0aW9uTW9kZWwgPSBuZXcgUmFuZ2VTZWxlY3Rpb25Nb2RlbCgpO1xuICAgIHRoaXMuc2V0TGFzdFNlbGVjdGlvblR5cGUoJycpO1xuICAgIHRoaXMuYWxsUm93c1NlbGVjdGVkID0gZmFsc2U7XG59O1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUgPSB7fTtcblxuLyoqXG4gKlxuICogQHByb3BlcnR5IHtBcnJheX0gc2VsZWN0aW9ucyAtIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIHNlbGVjdGlvbiByZWN0YW5nbGVzXG4gKiBAaW5zdGFuY2VcbiAqL1xuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLnNlbGVjdGlvbnMgPSBudWxsO1xuXG4vKipcbiAqXG4gKiBAcHJvcGVydHkge0FycmF5fSBmbGF0dGVuZWRYIC0gYW4gYXJyYXkgY29udGFpbmluZyB0aGUgc2VsZWN0aW9uIHJlY3RhbmdsZXMgZmxhdHRlbmQgaW4gdGhlIHggZGltZW5zaW9uXG4gKiBAaW5zdGFuY2VcbiAqL1xuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLmZsYXR0ZW5lZFggPSBudWxsO1xuXG4vKipcbiAqXG4gKiBAcHJvcGVydHkge0FycmF5fSBmbGF0dGVuZWRZIC0gYW4gYXJyYXkgY29udGFpbmluZyB0aGUgc2VsZWN0aW9uIHJlY3RhbmdsZXMgZmxhdHRlbmQgaW4gdGhlIHkgZGltZW5zaW9uXG4gKiBAaW5zdGFuY2VcbiAqL1xuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLmZsYXR0ZW5lZFkgPSBudWxsO1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUucm93U2VsZWN0aW9uTW9kZWwgPSBudWxsO1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUuY29sdW1uU2VsZWN0aW9uTW9kZWwgPSBudWxsO1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUuYWxsUm93c1NlbGVjdGVkID0gZmFsc2U7XG5cblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5nZXR0ZXIgZm9yIHRoZSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogIyMjIyByZXR1cm5zOiBmaW4taHlwZXJncmlkXG4gKi9cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5nZXRHcmlkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG51bGw7XG59O1xuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLmdldExhc3RTZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VscyA9IHRoaXMuZ2V0U2VsZWN0aW9ucygpO1xuICAgIHZhciBzZWwgPSBzZWxzW3NlbHMubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIHNlbDtcbn07XG5cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5nZXRMYXN0U2VsZWN0aW9uVHlwZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmxhc3RTZWxlY3Rpb25UeXBlO1xufTtcblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5zZXRMYXN0U2VsZWN0aW9uVHlwZSA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICB0aGlzLmxhc3RTZWxlY3Rpb25UeXBlID0gdHlwZTtcbn07XG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbnNlbGVjdCBhIHJlZ2lvbiBnaXZlbiBhbiBvcmlnaW4geCx5IGFuZCBleHRlbnQgeCx5XG4gKlxuICogQHBhcmFtIHtpbnRlZ2VyfSBveCAtIG9yaWdpbiB4IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7aW50ZWdlcn0gb3kgLSBvcmlnaW4geSBjb29yZGluYXRlXG4gKiBAcGFyYW0ge2ludGVnZXJ9IGV4IC0gZXh0ZW50IHggY29vcmRpbmF0ZVxuICogQHBhcmFtIHtpbnRlZ2VyfSBleSAtIGV4dGVudCB5IGNvb3JkaW5hdGVcbiAqL1xuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uKG94LCBveSwgZXgsIGV5KSB7XG4gICAgdmFyIG5ld1NlbGVjdGlvbiA9IHRoaXMuZ2V0R3JpZCgpLm5ld1JlY3RhbmdsZShveCwgb3ksIGV4LCBleSk7XG4gICAgdGhpcy5zZWxlY3Rpb25zLnB1c2gobmV3U2VsZWN0aW9uKTtcbiAgICB0aGlzLmZsYXR0ZW5lZFgucHVzaChuZXdTZWxlY3Rpb24uZmxhdHRlblhBdCgwKSk7XG4gICAgdGhpcy5mbGF0dGVuZWRZLnB1c2gobmV3U2VsZWN0aW9uLmZsYXR0ZW5ZQXQoMCkpO1xuICAgIHRoaXMuc2V0TGFzdFNlbGVjdGlvblR5cGUoJ2NlbGwnKTtcbiAgICB0aGlzLmdldEdyaWQoKS5zZWxlY3Rpb25DaGFuZ2VkKCk7XG59O1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUudG9nZ2xlU2VsZWN0ID0gZnVuY3Rpb24ob3gsIG95LCBleCwgZXkpIHtcblxuICAgIHZhciBzZWxlY3Rpb25zID0gdGhpcy5nZXRTZWxlY3Rpb25zKCk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGVhY2ggPSBzZWxlY3Rpb25zW2ldO1xuICAgICAgICBpZiAoZWFjaC5vcmlnaW4ueCA9PT0gb3ggJiYgZWFjaC5vcmlnaW4ueSA9PT0gb3kgJiYgZWFjaC5leHRlbnQueCA9PT0gZXggJiYgZWFjaC5leHRlbnQueSA9PT0gZXkpIHtcbiAgICAgICAgICAgIHNlbGVjdGlvbnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgdGhpcy5mbGF0dGVuZWRYLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIHRoaXMuZmxhdHRlbmVkWS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB0aGlzLmdldEdyaWQoKS5zZWxlY3Rpb25DaGFuZ2VkKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNlbGVjdChveCwgb3ksIGV4LCBleSk7XG5cbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxucmVtb3ZlIHRoZSBsYXN0IHNlbGVjdGlvbiB0aGF0IHdhcyBjcmVhdGVkXG4gKi9cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5jbGVhck1vc3RSZWNlbnRTZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmFsbFJvd3NTZWxlY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuc2VsZWN0aW9ucy5sZW5ndGggPSBNYXRoLm1heCgwLCB0aGlzLnNlbGVjdGlvbnMubGVuZ3RoIC0gMSk7XG4gICAgdGhpcy5mbGF0dGVuZWRYLmxlbmd0aCA9IE1hdGgubWF4KDAsIHRoaXMuZmxhdHRlbmVkWC5sZW5ndGggLSAxKTtcbiAgICB0aGlzLmZsYXR0ZW5lZFkubGVuZ3RoID0gTWF0aC5tYXgoMCwgdGhpcy5mbGF0dGVuZWRZLmxlbmd0aCAtIDEpO1xuICAgIC8vdGhpcy5nZXRHcmlkKCkuc2VsZWN0aW9uQ2hhbmdlZCgpO1xufTtcblxuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLmNsZWFyTW9zdFJlY2VudENvbHVtblNlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY29sdW1uU2VsZWN0aW9uTW9kZWwuY2xlYXJNb3N0UmVjZW50U2VsZWN0aW9uKCk7XG4gICAgdGhpcy5zZXRMYXN0U2VsZWN0aW9uVHlwZSgnY29sdW1uJyk7XG59O1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUuY2xlYXJNb3N0UmVjZW50Um93U2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yb3dTZWxlY3Rpb25Nb2RlbC5jbGVhck1vc3RSZWNlbnRTZWxlY3Rpb24oKTtcbiAgICB0aGlzLnNldExhc3RTZWxlY3Rpb25UeXBlKCdyb3cnKTtcbn07XG5cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5jbGVhclJvd1NlbGVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucm93U2VsZWN0aW9uTW9kZWwuY2xlYXIoKTtcbiAgICB0aGlzLnNldExhc3RTZWxlY3Rpb25UeXBlKCdyb3cnKTtcbn07XG5cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5nZXRTZWxlY3Rpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9ucztcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuYW5zd2VyIGlmIEkgaGF2ZSBhbnkgc2VsZWN0aW9uc1xuICpcbiAqICMjIyMgcmV0dXJuczogYm9vbGVhblxuICovXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUuaGFzU2VsZWN0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNlbGVjdGlvbnMubGVuZ3RoICE9PSAwO1xufTtcblxuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLmhhc1Jvd1NlbGVjdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gIXRoaXMucm93U2VsZWN0aW9uTW9kZWwuaXNFbXB0eSgpO1xufTtcblxuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLmhhc0NvbHVtblNlbGVjdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gIXRoaXMuY29sdW1uU2VsZWN0aW9uTW9kZWwuaXNFbXB0eSgpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5hbnN3ZXIgY29vcmRpbmF0ZSB4LCB5IGlzIHNlbGVjdGVkXG4gKiAjIyMjIHJldHVybnM6IGJvb2xlYW5cbiAqIEBwYXJhbSB7aW50ZWdlcn0geCAtIGNvbHVtbiBpbmRleFxuICogQHBhcmFtIHtpbnRlZ2VyfSB5IC0gcm93IGluZGV4XG4gKi9cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5pc1NlbGVjdGVkID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHJldHVybiB0aGlzLl9pc1NlbGVjdGVkKHRoaXMuc2VsZWN0aW9ucywgeCwgeSk7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbmFuc3dlciBpZiB3ZSBoYXZlIGEgc2VsZWN0aW9uIGNvdmVyaW5nIGEgc3BlY2lmaWMgY29sdW1uXG4gKiAjIyMjIHJldHVybnM6IGJvb2xlYW5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gY29sIC0gY29sdW1uIGluZGV4XG4gKi9cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5pc0NlbGxTZWxlY3RlZEluUm93ID0gZnVuY3Rpb24ocikge1xuICAgIHJldHVybiB0aGlzLl9pc0NlbGxTZWxlY3RlZCh0aGlzLmZsYXR0ZW5lZFgsIDAsIHIpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG5hbnN3ZXIgaWYgd2UgaGF2ZSBhIHNlbGVjdGlvbiBjb3ZlcmluZyBhIHNwZWNpZmljIHJvd1xuICogIyMjIyByZXR1cm5zOiBib29sZWFuXG4gKiBAcGFyYW0ge2ludGVnZXJ9IHJvdyAtIHJvdyBpbmRleFxuICovXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUuaXNDZWxsU2VsZWN0ZWRJbkNvbHVtbiA9IGZ1bmN0aW9uKGMpIHtcbiAgICByZXR1cm4gdGhpcy5faXNDZWxsU2VsZWN0ZWQodGhpcy5mbGF0dGVuZWRZLCBjLCAwKTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuZ2VuZXJhbCBzZWxlY3Rpb24gcXVlcnkgZnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBzZWxlY3Rpb25zIC0gYXJyYXkgb2Ygc2VsZWN0aW9uIHJlY3RhbmdsZXMgdG8gc2VhcmNoIHRocm91Z2hcbiAqIEBwYXJhbSB7aW50ZWdlcn0geCAtIHggY29vcmRpbmF0ZVxuICogQHBhcmFtIHtpbnRlZ2VyfSB5IC0geSBjb29yZGluYXRlXG4gKi9cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5faXNTZWxlY3RlZCA9IGZ1bmN0aW9uKHNlbGVjdGlvbnMsIHgsIHkpIHtcbiAgICBpZiAodGhpcy5pc0NvbHVtblNlbGVjdGVkKHgpIHx8IHRoaXMuaXNSb3dTZWxlY3RlZCh5KSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2lzQ2VsbFNlbGVjdGVkKHNlbGVjdGlvbnMsIHgsIHkpO1xufTtcblxuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLmlzQ2VsbFNlbGVjdGVkID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHJldHVybiB0aGlzLl9pc0NlbGxTZWxlY3RlZCh0aGlzLmdldFNlbGVjdGlvbnMoKSwgeCwgeSk7XG59O1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUuX2lzQ2VsbFNlbGVjdGVkID0gZnVuY3Rpb24oc2VsZWN0aW9ucywgeCwgeSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZWFjaCA9IHNlbGVjdGlvbnNbaV07XG4gICAgICAgIGlmICh0aGlzLmdldEdyaWQoKS5yZWN0YW5nbGVzLnJlY3RhbmdsZS5jb250YWlucyhlYWNoLCB4LCB5KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuZW1wdHkgb3V0IGFsbCBvdXIgc3RhdGVcbiAqXG4gKi9cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYWxsUm93c1NlbGVjdGVkID0gZmFsc2U7XG4gICAgdGhpcy5zZWxlY3Rpb25zLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5mbGF0dGVuZWRYLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5mbGF0dGVuZWRZLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5yb3dTZWxlY3Rpb25Nb2RlbC5jbGVhcigpO1xuICAgIHRoaXMuY29sdW1uU2VsZWN0aW9uTW9kZWwuY2xlYXIoKTtcbiAgICAvL3RoaXMuZ2V0R3JpZCgpLnNlbGVjdGlvbkNoYW5nZWQoKTtcbn07XG5cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5pc1JlY3RhbmdsZVNlbGVjdGVkID0gZnVuY3Rpb24ob3gsIG95LCBleCwgZXkpIHtcbiAgICB2YXIgc2VsZWN0aW9ucyA9IHRoaXMuZ2V0U2VsZWN0aW9ucygpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZWFjaCA9IHNlbGVjdGlvbnNbaV07XG4gICAgICAgIGlmIChlYWNoLm9yaWdpbi54ID09PSBveCAmJiBlYWNoLm9yaWdpbi55ID09PSBveSAmJiBlYWNoLmV4dGVudC54ID09PSBleCAmJiBlYWNoLmV4dGVudC55ID09PSBleSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLmlzQ29sdW1uU2VsZWN0ZWQgPSBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuIHRoaXMuY29sdW1uU2VsZWN0aW9uTW9kZWwuaXNTZWxlY3RlZCh4KTtcbn07XG5cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5pc1Jvd1NlbGVjdGVkID0gZnVuY3Rpb24oeSkge1xuICAgIHJldHVybiB0aGlzLmFsbFJvd3NTZWxlY3RlZCB8fCB0aGlzLnJvd1NlbGVjdGlvbk1vZGVsLmlzU2VsZWN0ZWQoeSk7XG59O1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUuc2VsZWN0Q29sdW1uID0gZnVuY3Rpb24oeDEsIHgyKSB7XG4gICAgdGhpcy5jb2x1bW5TZWxlY3Rpb25Nb2RlbC5zZWxlY3QoeDEsIHgyKTtcbiAgICB0aGlzLnNldExhc3RTZWxlY3Rpb25UeXBlKCdjb2x1bW4nKTtcbn07XG5cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5zZWxlY3RBbGxSb3dzID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMuYWxsUm93c1NlbGVjdGVkID0gdHJ1ZTtcbn07XG5cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5hcmVBbGxSb3dzU2VsZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5hbGxSb3dzU2VsZWN0ZWQ7XG59O1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUuc2VsZWN0Um93ID0gZnVuY3Rpb24oeTEsIHkyKSB7XG4gICAgdGhpcy5yb3dTZWxlY3Rpb25Nb2RlbC5zZWxlY3QoeTEsIHkyKTtcbiAgICB0aGlzLnNldExhc3RTZWxlY3Rpb25UeXBlKCdyb3cnKTtcbn07XG5cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5kZXNlbGVjdENvbHVtbiA9IGZ1bmN0aW9uKHgxLCB4Mikge1xuICAgIHRoaXMuY29sdW1uU2VsZWN0aW9uTW9kZWwuZGVzZWxlY3QoeDEsIHgyKTtcbiAgICB0aGlzLnNldExhc3RTZWxlY3Rpb25UeXBlKCdjb2x1bW4nKTtcbn07XG5cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5kZXNlbGVjdFJvdyA9IGZ1bmN0aW9uKHkxLCB5Mikge1xuICAgIHRoaXMucm93U2VsZWN0aW9uTW9kZWwuZGVzZWxlY3QoeTEsIHkyKTtcbiAgICB0aGlzLnNldExhc3RTZWxlY3Rpb25UeXBlKCdyb3cnKTtcbn07XG5cblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5nZXRTZWxlY3RlZFJvd3MgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5yb3dTZWxlY3Rpb25Nb2RlbC5nZXRTZWxlY3Rpb25zKCk7XG59O1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUuZ2V0U2VsZWN0ZWRDb2x1bW5zID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuY29sdW1uU2VsZWN0aW9uTW9kZWwuZ2V0U2VsZWN0aW9ucygpO1xufTtcblxuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLmlzQ29sdW1uT3JSb3dTZWxlY3RlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAhdGhpcy5jb2x1bW5TZWxlY3Rpb25Nb2RlbC5pc0VtcHR5KCkgfHwgIXRoaXMucm93U2VsZWN0aW9uTW9kZWwuaXNFbXB0eSgpO1xufTtcblNlbGVjdGlvbk1vZGVsLnByb3RvdHlwZS5nZXRGbGF0dGVuZWRZcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgc2V0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNlbGVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGVhY2ggPSB0aGlzLnNlbGVjdGlvbnNbaV07XG4gICAgICAgIHZhciB0b3AgPSBlYWNoLm9yaWdpbi55O1xuICAgICAgICB2YXIgc2l6ZSA9IGVhY2guZXh0ZW50LnkgKyAxO1xuICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IHNpemU7IHIrKykge1xuICAgICAgICAgICAgdmFyIHRpID0gciArIHRvcDtcbiAgICAgICAgICAgIGlmICghc2V0W3RpXSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRpKTtcbiAgICAgICAgICAgICAgICBzZXRbdGldID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfVxuICAgIHJlc3VsdC5zb3J0KGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHggLSB5O1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUuc2VsZWN0Um93c0Zyb21DZWxscyA9IGZ1bmN0aW9uKG9mZnNldCkge1xuICAgIHRoaXMuYWxsUm93c1NlbGVjdGVkID0gZmFsc2U7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0IHx8IDA7XG4gICAgdmFyIHNtID0gdGhpcy5yb3dTZWxlY3Rpb25Nb2RlbDtcbiAgICBzbS5jbGVhcigpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zZWxlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBlYWNoID0gdGhpcy5zZWxlY3Rpb25zW2ldO1xuICAgICAgICB2YXIgdG9wID0gZWFjaC5vcmlnaW4ueTtcbiAgICAgICAgdmFyIHNpemUgPSBlYWNoLmV4dGVudC55O1xuICAgICAgICBzbS5zZWxlY3QodG9wICsgb2Zmc2V0LCB0b3AgKyBzaXplICsgb2Zmc2V0KTtcbiAgICB9XG59O1xuXG5TZWxlY3Rpb25Nb2RlbC5wcm90b3R5cGUuc2VsZWN0Q29sdW1uc0Zyb21DZWxscyA9IGZ1bmN0aW9uKG9mZnNldCkge1xuICAgIG9mZnNldCA9IG9mZnNldCB8fCAwO1xuICAgIHZhciBzbSA9IHRoaXMuY29sdW1uU2VsZWN0aW9uTW9kZWw7XG4gICAgc20uY2xlYXIoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VsZWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZWFjaCA9IHRoaXMuc2VsZWN0aW9uc1tpXTtcbiAgICAgICAgdmFyIHRvcCA9IGVhY2gub3JpZ2luLng7XG4gICAgICAgIHZhciBzaXplID0gZWFjaC5leHRlbnQueDtcbiAgICAgICAgc20uc2VsZWN0KHRvcCArIG9mZnNldCwgdG9wICsgc2l6ZSArIG9mZnNldCk7XG4gICAgfVxufTtcblxuU2VsZWN0aW9uTW9kZWwucHJvdG90eXBlLmlzSW5DdXJyZW50U2VsZWN0aW9uUmVjdGFuZ2xlID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHZhciBsYXN0ID0gdGhpcy5zZWxlY3Rpb25zW3RoaXMuc2VsZWN0aW9ucy5sZW5ndGggLSAxXTtcbiAgICBpZiAobGFzdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRHcmlkKCkucmVjdGFuZ2xlcy5yZWN0YW5nbGUuY29udGFpbnMobGFzdCwgeCwgeSk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0aW9uTW9kZWw7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8vQ2VsbENsaWNrOiByZXF1aXJlKCcuL0NlbGxDbGljay5qcycpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG11c3RhY2hlID0gcmVxdWlyZSgnbXVzdGFjaGUnKTtcblxuZnVuY3Rpb24gQmFzZSgpIHtcbiAgICBPYmplY3QuY2FsbCh0aGlzKTtcbn1cblxuQmFzZS5wcm90b3R5cGUgPSBuZXcgT2JqZWN0KCk7XG5CYXNlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJhc2U7XG4vKipcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gaXNFZGl0aW5nIC0gYW0gSSBjdXJyZW50bHkgZWRpdGluZ1xuICogQGluc3RhbmNlXG4gKi9cbkJhc2UucHJvdG90eXBlLmlzRWRpdGluZyA9IGZhbHNlLFxuXG4vKipcbiAqIEBwcm9wZXJ0eSB7cmVjdGFuZ2xlLnBvaW50fSBlZGl0b3JQb2ludCAtIHRoZSBwb2ludCB0aGF0IEkgYW0gZWRpdGluZyBhdCByaWdodCBub3dcbiAqIEBpbnN0YW5jZVxuICovXG5CYXNlLnByb3RvdHlwZS5lZGl0b3JQb2ludCA9IG51bGwsXG5cbi8qKlxuICogQHByb3BlcnR5IHtib29sZWFufSBjaGVja0VkaXRvclBvc2l0aW9uRmxhZyAtIGlmIHRydWUsIGNoZWNrIHRoYXQgdGhlIGVkaXRvciBpcyBpbiB0aGUgcmlnaHQgbG9jYXRpb25cbiAqIEBpbnN0YW5jZVxuICovXG5CYXNlLnByb3RvdHlwZS5jaGVja0VkaXRvclBvc2l0aW9uRmxhZyA9IGZhbHNlLFxuXG4vKipcbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IGlucHV0IC0gbXkgbWFpbiBpbnB1dCBjb250cm9sXG4gKiBAaW5zdGFuY2VcbiAqL1xuQmFzZS5wcm90b3R5cGUuaW5wdXQgPSBudWxsLFxuXG4vKipcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBhbGlhcyAtIG15IGxvb2sgdXAgbmFtZVxuICogQGluc3RhbmNlXG4gKi9cbkJhc2UucHJvdG90eXBlLmFsaWFzID0gJ2Jhc2UnLFxuXG4vKipcbiAqIEBwcm9wZXJ0eSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIG15IGluc3RhbmNlIG9mIGh5cGVyZ3JpZFxuICogQGluc3RhbmNlXG4gKi9cbkJhc2UucHJvdG90eXBlLmdyaWQgPSBudWxsLFxuXG4vKipcbiAqIEBwcm9wZXJ0eSB7dHlwZX0gaW5pdGlhbFZhbHVlIC0gdGhlIHZhbHVlIGJlZm9yZSBlZGl0aW5nXG4gKiBAaW5zdGFuY2VcbiAqL1xuQmFzZS5wcm90b3R5cGUuaW5pdGlhbFZhbHVlID0gbnVsbCxcblxuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQGluc3RhbmNlXG4gKiBAZGVzY3JpcHRpb25cbiByZXR1cm4gdGhlIGJlaGF2aW9yIChtb2RlbClcbiAqXG4gKiAjIyMjIHJldHVybnM6W2Zpbi1oeXBlcmdyaWQtYmVoYXZpb3ItYmFzZV0obW9kdWxlLWJlaGF2aW9yc19iYXNlLmh0bWwpXG4gKi9cbkJhc2UucHJvdG90eXBlLmdldEJlaGF2aW9yID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZ3JpZC5nZXRCZWhhdmlvcigpO1xufTtcblxuLyoqXG4gKiBAZnVuY3Rpb25cbiAqIEBpbnN0YW5jZVxuICogQGRlc2NyaXB0aW9uXG4gVGhpcyBmdW5jdGlvbiBpcyBhIGNhbGxiYWNrIGZyb20gdGhlIGZpbi1oeXBlcmdyaWQuICAgSXQgaXMgY2FsbGVkIGFmdGVyIGVhY2ggcGFpbnQgb2YgdGhlIGNhbnZhcy5cbiAqXG4gKi9cbkJhc2UucHJvdG90eXBlLmdyaWRSZW5kZXJlZE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2hlY2tFZGl0b3IoKTtcbn07XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuc2Nyb2xsIHZhbHVlcyBoYXZlIGNoYW5nZWQsIHdlJ3ZlIGJlZW4gbm90aWZpZWRcbiAqL1xuQmFzZS5wcm90b3R5cGUuc2Nyb2xsVmFsdWVDaGFuZ2VkTm90aWZpY2F0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRDaGVja0VkaXRvclBvc2l0aW9uRmxhZygpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG50dXJuIG9uIGNoZWNrRWRpdG9yUG9zaXRpb25GbGFnIGJvb2xlYW4gZmllbGRcbiovXG5CYXNlLnByb3RvdHlwZS5zZXRDaGVja0VkaXRvclBvc2l0aW9uRmxhZyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2hlY2tFZGl0b3JQb3NpdGlvbkZsYWcgPSB0cnVlO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5iZWdpbiBlZGl0aW5nIGF0IGxvY2F0aW9uIHBvaW50XG4qIEBwYXJhbSB7cmVjdGFuZ2xlLnBvaW50fSBwb2ludCAtIHRoZSBsb2NhdGlvbiB0byBzdGFydCBlZGl0aW5nIGF0XG4qL1xuQmFzZS5wcm90b3R5cGUuYmVnaW5FZGl0QXQgPSBmdW5jdGlvbihwb2ludCkge1xuICAgIHRoaXMuc2V0RWRpdG9yUG9pbnQocG9pbnQpO1xuICAgIHZhciBtb2RlbCA9IHRoaXMuZ2V0QmVoYXZpb3IoKTtcbiAgICB2YXIgdmFsdWUgPSBtb2RlbC5nZXRWYWx1ZShwb2ludC54LCBwb2ludC55KTtcbiAgICBpZiAodmFsdWUuY29uc3RydWN0b3IubmFtZSA9PT0gJ0FycmF5Jykge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlWzFdOyAvL2l0J3MgYSBuZXN0ZWQgb2JqZWN0XG4gICAgfVxuICAgIHZhciBwcm9jZWVkID0gdGhpcy5ncmlkLmZpcmVSZXF1ZXN0Q2VsbEVkaXQocG9pbnQsIHZhbHVlKTtcbiAgICBpZiAoIXByb2NlZWQpIHtcbiAgICAgICAgLy93ZSB3ZXJlIGNhbmNlbGxlZFxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuaW5pdGlhbFZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5zZXRFZGl0b3JWYWx1ZSh2YWx1ZSk7XG4gICAgdGhpcy5pc0VkaXRpbmcgPSB0cnVlO1xuICAgIHRoaXMuc2V0Q2hlY2tFZGl0b3JQb3NpdGlvbkZsYWcoKTtcbiAgICB0aGlzLmNoZWNrRWRpdG9yKCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbnB1dCB2YWx1ZSBpbnRvIG91ciBlZGl0b3JcbiogQHBhcmFtIHtvYmplY3R9IHZhbHVlIC0gd2hhdGV2ZXIgdmFsdWUgd2Ugd2FudCB0byBlZGl0XG4qL1xuQmFzZS5wcm90b3R5cGUuc2V0RWRpdG9yVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIG5vb3AodmFsdWUpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5yZXR1cm5zIHRoZSBwb2ludCBhdCB3aGljaCB3ZSBhcmUgY3VycmVudGx5IGVkaXRpbmdcbiogIyMjIyByZXR1cm5zOiByZWN0YW5nbGUucG9pbnRcbiovXG5CYXNlLnByb3RvdHlwZS5nZXRFZGl0b3JQb2ludCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVkaXRvclBvaW50O1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5zZXQgdGhlIGN1cnJlbnQgZWRpdG9yIGxvY2F0aW9uXG4qIEBwYXJhbSB7cmVjdGFuZ2xlLnBvaW50fSBwb2ludCAtIHRoZSBkYXRhIGxvY2F0aW9uIG9mIHRoZSBjdXJyZW50IGVkaXRvclxuKi9cbkJhc2UucHJvdG90eXBlLnNldEVkaXRvclBvaW50ID0gZnVuY3Rpb24ocG9pbnQpIHtcbiAgICB0aGlzLmVkaXRvclBvaW50ID0gcG9pbnQ7XG4gICAgdGhpcy5tb2RlbFBvaW50ID0gdGhpcy5nZXRHcmlkKCkuY29udmVydFZpZXdQb2ludFRvRGF0YVBvaW50KHBvaW50KTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuZGlzcGxheSB0aGUgZWRpdG9yXG4qL1xuQmFzZS5wcm90b3R5cGUuc2hvd0VkaXRvciA9IGZ1bmN0aW9uKCkge307XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuaGlkZSB0aGUgZWRpdG9yXG4qL1xuQmFzZS5wcm90b3R5cGUuaGlkZUVkaXRvciA9IGZ1bmN0aW9uKCkge307XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuc3RvcCBlZGl0aW5nXG4qL1xuQmFzZS5wcm90b3R5cGUuc3RvcEVkaXRpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuaXNFZGl0aW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHByb2NlZWQgPSB0aGlzLmdldEdyaWQoKS5maXJlU3ludGhldGljRWRpdG9yRGF0YUNoYW5nZUV2ZW50KHRoaXMsIHRoaXMuaW5pdGlhbFZhbHVlLCB0aGlzLmdldEVkaXRvclZhbHVlLCB0aGlzKTtcbiAgICBpZiAoIXByb2NlZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNhdmVFZGl0b3JWYWx1ZSgpO1xuICAgIHRoaXMuaXNFZGl0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5oaWRlRWRpdG9yKCk7XG59O1xuXG5CYXNlLnByb3RvdHlwZS5jYW5jZWxFZGl0aW5nID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLmlzRWRpdGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuaXNFZGl0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5oaWRlRWRpdG9yKCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbnNhdmUgdGhlIG5ldyB2YWx1ZSBpbnRvIHRoZSBiZWhhdmlvcihtb2RlbClcbiovXG5CYXNlLnByb3RvdHlwZS5zYXZlRWRpdG9yVmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcG9pbnQgPSB0aGlzLmdldEVkaXRvclBvaW50KCk7XG4gICAgdmFyIHZhbHVlID0gdGhpcy5nZXRFZGl0b3JWYWx1ZSgpO1xuICAgIGlmICh2YWx1ZSA9PT0gdGhpcy5pbml0aWFsVmFsdWUpIHtcbiAgICAgICAgcmV0dXJuOyAvL2RhdGEgZGlkbid0IGNoYW5nZSBkbyBub3RoaW5nXG4gICAgfVxuICAgIHZhciBjb250aW51ZWQgPSB0aGlzLmdldEdyaWQoKS5maXJlQmVmb3JlQ2VsbEVkaXQocG9pbnQsIHRoaXMuaW5pdGlhbFZhbHVlLCB2YWx1ZSwgdGhpcyk7XG4gICAgaWYgKCFjb250aW51ZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmdldEJlaGF2aW9yKCkuc2V0VmFsdWUocG9pbnQueCwgcG9pbnQueSwgdmFsdWUpO1xuICAgIHRoaXMuZ2V0R3JpZCgpLmZpcmVBZnRlckNlbGxFZGl0KHBvaW50LCB0aGlzLmluaXRpYWxWYWx1ZSwgdmFsdWUsIHRoaXMpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5yZXR1cm4gdGhlIGN1cnJlbnQgZWRpdG9yJ3MgdmFsdWVcbiogIyMjIyByZXR1cm5zOiBPYmplY3RcbiovXG5CYXNlLnByb3RvdHlwZS5nZXRFZGl0b3JWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbnJlcXVlc3QgZm9jdXMgZm9yIG15IGlucHV0IGNvbnRyb2xcbiovXG5CYXNlLnByb3RvdHlwZS50YWtlRm9jdXMgPSBmdW5jdGlvbigpIHtcblxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5tb3ZlIHRoZSBlZGl0b3IgdG8gdGhlIGN1cnJlbnQgZWRpdG9yIHBvaW50XG4qL1xuQmFzZS5wcm90b3R5cGUuX21vdmVFZGl0b3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZ3JpZCA9IHRoaXMuZ2V0R3JpZCgpO1xuICAgIHZhciBlZGl0b3JQb2ludCA9IHRoaXMuZ2V0RWRpdG9yUG9pbnQoKTtcbiAgICB2YXIgY2VsbEJvdW5kcyA9IGdyaWQuX2dldEJvdW5kc09mQ2VsbChlZGl0b3JQb2ludC54LCBlZGl0b3JQb2ludC55KTtcblxuICAgIC8vaGFjayB0byBhY2NvbW9kYXRlIGJvb3RzdHJhcCBtYXJnaW4gaXNzdWVzLi4uXG4gICAgdmFyIHhPZmZzZXQgPSBncmlkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQgLSBncmlkLmNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0O1xuICAgIGNlbGxCb3VuZHMueCA9IGNlbGxCb3VuZHMueCAtIHhPZmZzZXQ7XG5cbiAgICB0aGlzLnNldEJvdW5kcyhjZWxsQm91bmRzKTtcbn07XG5cbkJhc2UucHJvdG90eXBlLm1vdmVFZGl0b3IgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9tb3ZlRWRpdG9yKCk7XG4gICAgdGhpcy50YWtlRm9jdXMoKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuc2V0IHRoZSBib3VuZHMgb2YgbXkgaW5wdXQgY29udHJvbFxuKiBAcGFyYW0ge3JlY3RhbmdsZX0gcmVjdGFuZ2xlIC0gdGhlIGJvdW5kcyB0byBtb3ZlIHRvXG4qL1xuQmFzZS5wcm90b3R5cGUuc2V0Qm91bmRzID0gZnVuY3Rpb24ocmVjdGFuZ2xlKSB7XG4gICAgbm9vcChyZWN0YW5nbGUpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5jaGVjayB0aGF0IHRoZSBlZGl0b3IgaXMgaW4gdGhlIGNvcnJlY3QgbG9jYXRpb24sIGFuZCBpcyBzaG93aW5nL2hpZGRlbiBhcHByb3ByaWF0ZWx5XG4qL1xuQmFzZS5wcm90b3R5cGUuY2hlY2tFZGl0b3IgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuY2hlY2tFZGl0b3JQb3NpdGlvbkZsYWcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2hlY2tFZGl0b3JQb3NpdGlvbkZsYWcgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmlzRWRpdGluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBlZGl0b3JQb2ludCA9IHRoaXMuZ2V0RWRpdG9yUG9pbnQoKTtcbiAgICBpZiAodGhpcy5ncmlkLmlzRGF0YVZpc2libGUoZWRpdG9yUG9pbnQueCwgZWRpdG9yUG9pbnQueSkpIHtcbiAgICAgICAgdGhpcy5tb3ZlRWRpdG9yKCk7XG4gICAgICAgIHRoaXMuc2hvd0VkaXRvcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaGlkZUVkaXRvcigpO1xuICAgIH1cbn07XG5cbkJhc2UucHJvdG90eXBlLmdldEdyaWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5ncmlkO1xufTtcblxuQmFzZS5wcm90b3R5cGUudGVtcGxhdGUgPSBmdW5jdGlvbigpIHsvKlxuKi9cbn07XG5cbkJhc2UucHJvdG90eXBlLmdldEhUTUwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RyaW5nID0gdGhpcy50ZW1wbGF0ZS50b1N0cmluZygpLnNwbGl0KCdcXG4nKTtcbiAgICBzdHJpbmcuc2hpZnQoKTtcbiAgICBzdHJpbmcubGVuZ3RoID0gc3RyaW5nLmxlbmd0aCAtIDI7XG4gICAgc3RyaW5nID0gc3RyaW5nLmpvaW4oJ1xcbicpLnRyaW0oKTtcbiAgICB2YXIgaHRtbCA9IG11c3RhY2hlLnJlbmRlcihzdHJpbmcsIHRoaXMpO1xuICAgIHJldHVybiBodG1sO1xufTtcblxuQmFzZS5wcm90b3R5cGUuZ2V0SW5wdXQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dCA9IHRoaXMuZ2V0RGVmYXVsdElucHV0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmlucHV0O1xufTtcblxuQmFzZS5wcm90b3R5cGUuZ2V0RGVmYXVsdElucHV0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0RJVicpO1xuICAgIGRpdi5pbm5lckhUTUwgPSB0aGlzLmdldEhUTUwoKTtcbiAgICB2YXIgaW5wdXQgPSBkaXYuZmlyc3RDaGlsZDtcbiAgICB0aGlzLmluaXRpYWxpemVJbnB1dChpbnB1dCk7XG4gICAgcmV0dXJuIGlucHV0O1xufTtcblxuQmFzZS5wcm90b3R5cGUudXBkYXRlVmlldyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvbGRHdXkgPSB0aGlzLmdldElucHV0KCk7XG4gICAgdmFyIHBhcmVudCA9IG9sZEd1eS5wYXJlbnROb2RlO1xuICAgIHZhciBuZXdHdXkgPSB0aGlzLmdldERlZmF1bHRJbnB1dCgpO1xuICAgIHRoaXMuaW5wdXQgPSBuZXdHdXk7XG4gICAgcGFyZW50LnJlcGxhY2VDaGlsZChuZXdHdXksIG9sZEd1eSk7XG59O1xuXG5CYXNlLnByb3RvdHlwZS5pbml0aWFsaXplSW5wdXQgPSBmdW5jdGlvbihpbnB1dCkge1xufTtcblxuQmFzZS5wcm90b3R5cGUuc2hvd0Ryb3Bkb3duID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHZhciBldmVudDtcbiAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50cycpO1xuICAgIGV2ZW50LmluaXRNb3VzZUV2ZW50KCdtb3VzZWRvd24nLCB0cnVlLCB0cnVlLCB3aW5kb3cpO1xuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2U7XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqXG4gKiBAbW9kdWxlIGNlbGwtZWRpdG9yc1xcY2hvaWNlXG4gKlxuICovXG5cbnZhciBTaW1wbGUgPSByZXF1aXJlKCcuL1NpbXBsZS5qcycpO1xuXG5mdW5jdGlvbiBDaG9pY2UoKSB7XG4gICAgU2ltcGxlLmNhbGwodGhpcyk7XG59XG5cbkNob2ljZS5wcm90b3R5cGUgPSBuZXcgU2ltcGxlKCk7XG5cbkNob2ljZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDaG9pY2U7XG5cbi8qKlxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFsaWFzIC0gbXkgbG9va3VwIGFsaWFzXG4gKiBAaW5zdGFuY2VcbiAqL1xuQ2hvaWNlLnByb3RvdHlwZS5hbGlhcyA9ICdjaG9pY2UnO1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7QXJyYXl9IGl0ZW1zIC0gdGhlIGxpc3Qgb2YgaXRlbXMgdG8gcGljayBmcm9tXG4gKiBAaW5zdGFuY2VcbiAqL1xuQ2hvaWNlLnByb3RvdHlwZS5pdGVtcyA9IFsnYScsJ2InLCdjJ107XG5cbkNob2ljZS5wcm90b3R5cGUudGVtcGxhdGUgPSBmdW5jdGlvbigpIHsvKlxuICAgIDxzZWxlY3QgaWQ9XCJlZGl0b3JcIj5cbiAgICAgICAge3sjaXRlbXN9fVxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInt7Ln19XCI+e3sufX08L29wdGlvbj5cbiAgICAgICAge3svaXRlbXN9fVxuICAgIDwvc2VsZWN0PlxuKi9cbn07XG4vL25vIGV2ZW50cyBhcmUgZmlyZWQgd2hpbGUgdGhlIGRyb3Bkb3duIGlzIG9wZW5cbi8vc2VlIGh0dHA6Ly9qc2ZpZGRsZS5uZXQvbTR0bmR0dTQvNi9cbkNob2ljZS5wcm90b3R5cGUuc2hvd0VkaXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLmlucHV0LnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJztcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLnNob3dEcm9wZG93bihzZWxmLmlucHV0KTtcbiAgICB9LCA1MCk7XG59O1xuXG5DaG9pY2UucHJvdG90eXBlLnNldEl0ZW1zID0gZnVuY3Rpb24oaXRlbXMpIHtcbiAgICB0aGlzLml0ZW1zID0gaXRlbXM7XG4gICAgdGhpcy51cGRhdGVWaWV3KCk7XG59O1xuXG5DaG9pY2UucHJvdG90eXBlLmluaXRpYWxpemVJbnB1dCA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIFNpbXBsZS5wcm90b3R5cGUuaW5pdGlhbGl6ZUlucHV0KGlucHV0KTtcbiAgICBpbnB1dC5vbmNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLnN0b3BFZGl0aW5nKCk7XG4gICAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hvaWNlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKlxuICogQG1vZHVsZSBjZWxsLWVkaXRvcnNcXENvbG9yXG4gKlxuICovXG5cbnZhciBTaW1wbGUgPSByZXF1aXJlKCcuL1NpbXBsZS5qcycpO1xuXG5mdW5jdGlvbiBDb2xvcigpIHtcbiAgICBTaW1wbGUuY2FsbCh0aGlzKTtcbn1cblxuQ29sb3IucHJvdG90eXBlID0gbmV3IFNpbXBsZSgpO1xuXG5Db2xvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDb2xvcjtcblxuQ29sb3IucHJvdG90eXBlLmFsaWFzID0gJ2NvbG9yJztcblxuQ29sb3IucHJvdG90eXBlLnRlbXBsYXRlID0gZnVuY3Rpb24oKSB7LypcbiAgICA8aW5wdXQgaWQ9XCJlZGl0b3JcIiB0eXBlPVwiY29sb3JcIj5cbiovXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3I7XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqXG4gKiBAbW9kdWxlIGNlbGwtZWRpdG9yc1xcRGF0ZVxuICpcbiAqL1xuXG52YXIgU2ltcGxlID0gcmVxdWlyZSgnLi9TaW1wbGUuanMnKTtcblxuZnVuY3Rpb24gRGF0ZSgpIHtcbiAgICBTaW1wbGUuY2FsbCh0aGlzKTtcbn1cblxuRGF0ZS5wcm90b3R5cGUgPSBuZXcgU2ltcGxlKCk7XG5cbkRhdGUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGF0ZTtcblxuRGF0ZS5wcm90b3R5cGUuYWxpYXMgPSAnZGF0ZSc7XG5cbkRhdGUucHJvdG90eXBlLnRlbXBsYXRlID0gZnVuY3Rpb24oKSB7LypcbiAgICA8aW5wdXQgaWQ9XCJlZGl0b3JcIiB0eXBlPVwiZGF0ZVwiPlxuKi9cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBEYXRlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKlxuICogQG1vZHVsZSBjZWxsLWVkaXRvcnNcXHNpbXBsZVxuICpcbiAqL1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZS5qcycpO1xuXG5mdW5jdGlvbiBTaW1wbGUoKSB7XG4gICAgQmFzZS5jYWxsKHRoaXMpO1xuICAgIHRoaXMuZWRpdG9yUG9pbnQgPSB7eDowLCB5OjB9O1xufVxuXG5TaW1wbGUucHJvdG90eXBlID0gbmV3IEJhc2UoKTtcblxuU2ltcGxlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFNpbXBsZTtcbi8qKlxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFsaWFzIC0gbXkgbG9va3VwIGFsaWFzXG4gKiBAaW5zdGFuY2VcbiAqL1xuU2ltcGxlLnByb3RvdHlwZS5hbGlhcyA9J3NpbXBsZSc7XG5cbi8qKlxuICogQGZ1bmN0aW9uXG4gKiBAaW5zdGFuY2VcbiAqIEBkZXNjcmlwdGlvblxuIHRoZSBmdW5jdGlvbiB0byBvdmVycmlkZSBmb3IgaW5pdGlhbGl6YXRpb25cbiAqL1xuU2ltcGxlLnByb3RvdHlwZS5pbml0aWFsaXplSW5wdXQgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUgJiYgKGUua2V5Q29kZSA9PT0gMTMgfHwgZS5rZXlDb2RlID09PSAyNyB8fCBlLmtleUNvZGUgPT09IDgpKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSA4KSB7XG4gICAgICAgICAgICAgICAgc2VsZi5jbGVhclN0b3BFZGl0aW5nKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmNhbmNlbEVkaXRpbmcoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5zdG9wRWRpdGluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5nZXRHcmlkKCkucmVwYWludCgpO1xuICAgICAgICAgICAgc2VsZi5nZXRHcmlkKCkudGFrZUZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5nZXRHcmlkKCkuZmlyZVN5bnRoZXRpY0VkaXRvcktleVVwRXZlbnQoc2VsZiwgZSk7XG4gICAgfSk7XG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgc2VsZi5nZXRHcmlkKCkuZmlyZVN5bnRoZXRpY0VkaXRvcktleURvd25FdmVudChzZWxmLCBlKTtcbiAgICB9KTtcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2tleXByZXNzJywgZS5rZXlDb2RlKTtcbiAgICAgICAgc2VsZi5nZXRHcmlkKCkuZmlyZVN5bnRoZXRpY0VkaXRvcktleVByZXNzRXZlbnQoc2VsZiwgZSk7XG4gICAgfSk7XG4gICAgLy8gaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXNvdXQnLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgc2VsZi5zdG9wRWRpdGluZygpO1xuICAgIC8vIH0pO1xuICAgIC8vIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgc2VsZi5zdG9wRWRpdGluZygpO1xuICAgIC8vIH0pO1xuICAgIGlucHV0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBpbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGlucHV0LnN0eWxlLmJvcmRlciA9ICdzb2xpZCAycHggYmxhY2snO1xuICAgIGlucHV0LnN0eWxlLm91dGxpbmUgPSAwO1xuICAgIGlucHV0LnN0eWxlLnBhZGRpbmcgPSAwO1xuICAgIGlucHV0LnN0eWxlLnpJbmRleCA9IDEwMDA7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbnJldHVybiB0aGUgY3VycmVudCBlZGl0b3IncyB2YWx1ZVxuKiAjIyMjIHJldHVybnM6IE9iamVjdFxuKi9cblNpbXBsZS5wcm90b3R5cGUuZ2V0RWRpdG9yVmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLmdldElucHV0KCkudmFsdWU7XG4gICAgcmV0dXJuIHZhbHVlO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5zYXZlIHRoZSBuZXcgdmFsdWUgaW50byB0aGUgYmVoYXZpb3IobW9kZWwpXG4qL1xuU2ltcGxlLnByb3RvdHlwZS5zZXRFZGl0b3JWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdGhpcy5nZXRJbnB1dCgpLnZhbHVlID0gdmFsdWUgKyAnJztcbn07XG5cblNpbXBsZS5wcm90b3R5cGUuY2xlYXJTdG9wRWRpdGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2V0RWRpdG9yVmFsdWUoJycpO1xuICAgIHRoaXMuc3RvcEVkaXRpbmcoKTtcbn07XG5cblNpbXBsZS5wcm90b3R5cGUuY2FuY2VsRWRpdGluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5pc0VkaXRpbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmdldElucHV0KCkudmFsdWUgPSBudWxsO1xuICAgIHRoaXMuaXNFZGl0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5oaWRlRWRpdG9yKCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmRpc3BsYXkgdGhlIGVkaXRvclxuKi9cblNpbXBsZS5wcm90b3R5cGUuc2hvd0VkaXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZ2V0SW5wdXQoKS5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSc7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmhpZGUgdGhlIGVkaXRvclxuKi9cblNpbXBsZS5wcm90b3R5cGUuaGlkZUVkaXRvciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZ2V0SW5wdXQoKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5yZXF1ZXN0IGZvY3VzIGZvciBteSBpbnB1dCBjb250cm9sXG4qL1xuU2ltcGxlLnByb3RvdHlwZS50YWtlRm9jdXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5pbnB1dC5mb2N1cygpO1xuICAgICAgICBzZWxmLnNlbGVjdEFsbCgpO1xuICAgIH0sIDMwMCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbnNlbGVjdCBldmVyeXRoaW5nXG4qL1xuU2ltcGxlLnByb3RvdHlwZS5zZWxlY3RBbGwgPSBmdW5jdGlvbigpIHtcblxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5ob3cgbXVjaCBzaG91bGQgSSBvZmZzZXQgbXkgYm91bmRzIGZyb20gMCwwXG4qL1xuU2ltcGxlLnByb3RvdHlwZS5vcmlnaW5PZmZzZXQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gWzAsIDBdO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5zZXQgdGhlIGJvdW5kcyBvZiBteSBpbnB1dCBjb250cm9sXG4qIEBwYXJhbSB7cmVjdGFuZ2xlfSByZWN0YW5nbGUgLSB0aGUgYm91bmRzIHRvIG1vdmUgdG9cbiovXG5TaW1wbGUucHJvdG90eXBlLnNldEJvdW5kcyA9IGZ1bmN0aW9uKGNlbGxCb3VuZHMpIHtcbiAgICB2YXIgb3JpZ2luT2Zmc2V0ID0gdGhpcy5vcmlnaW5PZmZzZXQoKTtcbiAgICB2YXIgdHJhbnNsYXRpb24gPSAndHJhbnNsYXRlKCcgKyAoY2VsbEJvdW5kcy54ICsgb3JpZ2luT2Zmc2V0WzBdKSArICdweCwnICsgKGNlbGxCb3VuZHMueSArIG9yaWdpbk9mZnNldFsxXSkgKyAncHgpJztcblxuICAgIHRoaXMuZ2V0SW5wdXQoKS5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSB0cmFuc2xhdGlvbjtcbiAgICB0aGlzLmdldElucHV0KCkuc3R5bGUuTW96VHJhbnNmb3JtID0gdHJhbnNsYXRpb247XG4gICAgdGhpcy5nZXRJbnB1dCgpLnN0eWxlLm1zVHJhbnNmb3JtID0gdHJhbnNsYXRpb247XG4gICAgdGhpcy5nZXRJbnB1dCgpLnN0eWxlLk9UcmFuc2Zvcm0gPSB0cmFuc2xhdGlvbjtcblxuICAgIC8vIHRoaXMuZ2V0SW5wdXQoKS5zdHlsZS5sZWZ0ID0gY2VsbEJvdW5kcy54ICsgb3JpZ2luT2Zmc2V0WzBdICsgJ3B4JztcbiAgICAvLyB0aGlzLmdldElucHV0KCkuc3R5bGUudG9wID0gY2VsbEJvdW5kcy55ICsgb3JpZ2luT2Zmc2V0WzFdICsgJ3B4JztcblxuICAgIHRoaXMuZ2V0SW5wdXQoKS5zdHlsZS53aWR0aCA9IChjZWxsQm91bmRzLndpZHRoKSArICdweCc7XG4gICAgdGhpcy5nZXRJbnB1dCgpLnN0eWxlLmhlaWdodCA9IChjZWxsQm91bmRzLmhlaWdodCAtIDIpICsgJ3B4JztcbiAgICAvL3ZhciB4T2Zmc2V0ID0gdGhpcy5ncmlkLmNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGU7XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqXG4gKiBAbW9kdWxlIGNlbGwtZWRpdG9yc1xcU2xpZGVyXG4gKlxuICovXG5cbnZhciBTaW1wbGUgPSByZXF1aXJlKCcuL1NpbXBsZS5qcycpO1xuXG5mdW5jdGlvbiBTbGlkZXIoKSB7XG4gICAgU2ltcGxlLmNhbGwodGhpcyk7XG59XG5cblNsaWRlci5wcm90b3R5cGUgPSBuZXcgU2ltcGxlKCk7XG5cblNsaWRlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTbGlkZXI7XG5cblNsaWRlci5wcm90b3R5cGUuYWxpYXMgPSAnc2xpZGVyJztcblxuU2xpZGVyLnByb3RvdHlwZS50ZW1wbGF0ZSA9IGZ1bmN0aW9uKCkgey8qXG4gICAgPGlucHV0IGlkPVwiZWRpdG9yXCIgdHlwZT1cInJhbmdlXCI+XG4qL1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFNsaWRlcjtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICpcbiAqIEBtb2R1bGUgY2VsbC1lZGl0b3JzXFxTcGlubmVyXG4gKlxuICovXG5cbnZhciBTaW1wbGUgPSByZXF1aXJlKCcuL1NpbXBsZS5qcycpO1xuXG5mdW5jdGlvbiBTcGlubmVyKCkge1xuICAgIFNpbXBsZS5jYWxsKHRoaXMpO1xufVxuXG5TcGlubmVyLnByb3RvdHlwZSA9IG5ldyBTaW1wbGUoKTtcblxuU3Bpbm5lci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTcGlubmVyO1xuXG5TcGlubmVyLnByb3RvdHlwZS5hbGlhcyA9ICdzcGlubmVyJztcblxuU3Bpbm5lci5wcm90b3R5cGUudGVtcGxhdGUgPSBmdW5jdGlvbigpIHsvKlxuICAgIDxpbnB1dCBpZD1cImVkaXRvclwiIHR5cGU9XCJudW1iZXJcIj5cbiovXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU3Bpbm5lcjtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICpcbiAqIEBtb2R1bGUgY2VsbC1lZGl0b3JzXFxUZXh0ZmllbGRcbiAqXG4gKi9cblxudmFyIFNpbXBsZSA9IHJlcXVpcmUoJy4vU2ltcGxlLmpzJyk7XG5cbmZ1bmN0aW9uIFRleHRmaWVsZCgpIHtcbiAgICBTaW1wbGUuY2FsbCh0aGlzKTtcbn1cblxuVGV4dGZpZWxkLnByb3RvdHlwZSA9IG5ldyBTaW1wbGUoKTtcblxuVGV4dGZpZWxkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRleHRmaWVsZDtcblxuVGV4dGZpZWxkLnByb3RvdHlwZS5hbGlhcyA9ICd0ZXh0ZmllbGQnO1xuXG5UZXh0ZmllbGQucHJvdG90eXBlLnRlbXBsYXRlID0gZnVuY3Rpb24oKSB7LypcbiAgICA8aW5wdXQgaWQ9XCJlZGl0b3JcIj5cbiovXG59O1xuXG5UZXh0ZmllbGQucHJvdG90eXBlLnNlbGVjdEFsbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW5wdXQuc2V0U2VsZWN0aW9uUmFuZ2UoMCwgdGhpcy5pbnB1dC52YWx1ZS5sZW5ndGgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUZXh0ZmllbGQ7XG5cblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBCYXNlOiByZXF1aXJlKCcuL0Jhc2UuanMnKSxcbiAgICBTaW1wbGU6IHJlcXVpcmUoJy4vU2ltcGxlLmpzJyksXG4gICAgQ2hvaWNlOiByZXF1aXJlKCcuL0Nob2ljZS5qcycpLFxuICAgIENvbG9yOiByZXF1aXJlKCcuL0NvbG9yLmpzJyksXG4gICAgLy9Db21ibzogcmVxdWlyZSgnLi9Db21iby5qcycpLFxuICAgIERhdGU6IHJlcXVpcmUoJy4vRGF0ZS5qcycpLFxuICAgIFNsaWRlcjogcmVxdWlyZSgnLi9TbGlkZXIuanMnKSxcbiAgICBTcGlubmVyOiByZXF1aXJlKCcuL1NwaW5uZXIuanMnKSxcbiAgICBUZXh0ZmllbGQ6IHJlcXVpcmUoJy4vVGV4dGZpZWxkLmpzJyksXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBCYXNlKCkge1xuXG59O1xuXG5CYXNlLnByb3RvdHlwZSA9IHt9O1xuXG5CYXNlLnByb3RvdHlwZS5uZXh0ID0gbnVsbDtcblxuQmFzZS5wcm90b3R5cGUuZ3JpZCA9IG51bGw7XG5cbkJhc2UucHJvdG90eXBlLnNldEdyaWQgPSBmdW5jdGlvbihuZXdHcmlkKSB7XG4gICAgdGhpcy5ncmlkID0gbmV3R3JpZDtcbn07XG5cbkJhc2UucHJvdG90eXBlLmdldEdyaWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5ncmlkO1xufTtcblxuQmFzZS5wcm90b3R5cGUuZ2V0QmVoYXZpb3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRHcmlkKCkuZ2V0QmVoYXZpb3IoKTtcbn07XG5cbkJhc2UucHJvdG90eXBlLmNoYW5nZWQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmdldEJlaGF2aW9yKCkuY2hhbmdlZCgpO1xufTtcblxuQmFzZS5wcm90b3R5cGUuZ2V0UHJpdmF0ZVN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0R3JpZCgpLmdldFByaXZhdGVTdGF0ZSgpO1xufTtcblxuQmFzZS5wcm90b3R5cGUuYXBwbHlTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2U7XG5cblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZS5qcycpO1xuXG52YXIgYWxwaGFGb3IgPSBmdW5jdGlvbihpKSB7XG4gICAgLy8gTmFtZSB0aGUgY29sdW1uIGhlYWRlcnMgaW4gQSwgLi4sIEFBLCBBQiwgQUMsIC4uLCBBWiBmb3JtYXRcbiAgICAvLyBxdW90aWVudC9yZW1haW5kZXJcbiAgICAvL3ZhciBxdW8gPSBNYXRoLmZsb29yKGNvbC8yNyk7XG4gICAgdmFyIHF1byA9IE1hdGguZmxvb3IoKGkpIC8gMjYpO1xuICAgIHZhciByZW0gPSAoaSkgJSAyNjtcbiAgICB2YXIgY29kZSA9ICcnO1xuICAgIGlmIChxdW8gPiAwKSB7XG4gICAgICAgIGNvZGUgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgnQScuY2hhckNvZGVBdCgwKSArIHF1byAtIDEpO1xuICAgIH1cbiAgICBjb2RlICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoJ0EnLmNoYXJDb2RlQXQoMCkgKyByZW0pO1xuICAgIHJldHVybiBjb2RlO1xufTtcbi8vdmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9O1xudmFyIGEgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonO1xuXG5mdW5jdGlvbiBEZWZhdWx0KCkge1xuICAgIEJhc2UuY2FsbCh0aGlzKTtcbn07XG5cbkRlZmF1bHQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlLnByb3RvdHlwZSk7XG5cbkRlZmF1bHQucHJvdG90eXBlLmRhdGFVcGRhdGVzID0ge307XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxudGhpcyBpcyB0aGUgbW9zdCBpbXBvcnRhbnQgYmVoYXZpb3IgZnVuY3Rpb24gaXQgcmV0dXJucyBlYWNoIGRhdGEgcG9pbnQgYXQgeCx5IGNvb3JkaW5hdGVzXG4qICMjIyMgcmV0dXJuczogT2JqZWN0XG4gKiBAcGFyYW0ge2ludGVnZXJ9IHggLSB0aGUgeCBjb29yZGluYXRlXG4gKiBAcGFyYW0ge2ludGVnZXJ9IHggLSB0aGUgeSBjb29yZGluYXRlXG4qL1xuRGVmYXVsdC5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdmFyIG92ZXJyaWRlID0gdGhpcy5kYXRhVXBkYXRlc1sncF8nICsgeCArICdfJyArIHldO1xuICAgIGlmIChvdmVycmlkZSkge1xuICAgICAgICByZXR1cm4gb3ZlcnJpZGU7XG4gICAgfVxuICAgIGlmICh4ID09PSAwKSB7XG4gICAgICAgIGlmICh5ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHk7XG4gICAgfVxuICAgIGlmICh5ID09PSAwKSB7XG4gICAgICAgIHJldHVybiBhbHBoYUZvcih4IC0gMSk7XG4gICAgfVxuICAgIHJldHVybiAoeCAtIDEpICsgJywgJyArIGFbKHkgLSAxKSAlIDI2XTtcbn07XG5cbkRlZmF1bHQucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24oeCwgeSwgdmFsdWUpIHtcbiAgICB0aGlzLmRhdGFVcGRhdGVzWydwXycgKyB4ICsgJ18nICsgeV0gPSB2YWx1ZTtcbn07XG5cbkRlZmF1bHQucHJvdG90eXBlLmdldENvbHVtbkNvdW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIDI3O1xufTtcblxuRGVmYXVsdC5wcm90b3R5cGUuZ2V0Um93Q291bnQgPSBmdW5jdGlvbigpIHtcbiAgICAvL2plZXBlcnMgYmF0bWFuIGEgcXVhZHJpbGxpb24gcm93cyFcbiAgICByZXR1cm4gNTM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlZmF1bHQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlLmpzJyk7XG5cbnZhciBhbHBoYUZvciA9IGZ1bmN0aW9uKGkpIHtcbiAgICAvLyBOYW1lIHRoZSBjb2x1bW4gaGVhZGVycyBpbiBBLCAuLiwgQUEsIEFCLCBBQywgLi4sIEFaIGZvcm1hdFxuICAgIC8vIHF1b3RpZW50L3JlbWFpbmRlclxuICAgIC8vdmFyIHF1byA9IE1hdGguZmxvb3IoY29sLzI3KTtcbiAgICB2YXIgcXVvID0gTWF0aC5mbG9vcigoaSkgLyAyNik7XG4gICAgdmFyIHJlbSA9IChpKSAlIDI2O1xuICAgIHZhciBjb2RlID0gJyc7XG4gICAgaWYgKHF1byA+IDApIHtcbiAgICAgICAgY29kZSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCdBJy5jaGFyQ29kZUF0KDApICsgcXVvIC0gMSk7XG4gICAgfVxuICAgIGNvZGUgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgnQScuY2hhckNvZGVBdCgwKSArIHJlbSk7XG4gICAgcmV0dXJuIGNvZGU7XG59O1xuLy92YXIgbm9vcCA9IGZ1bmN0aW9uKCkge307XG52YXIgYSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWic7XG5cbmZ1bmN0aW9uIEluTWVtb3J5KCkge1xuICAgIEJhc2UuY2FsbCh0aGlzKTtcbn07XG5cbkluTWVtb3J5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZS5wcm90b3R5cGUpO1xuXG5Jbk1lbW9yeS5wcm90b3R5cGUuZGF0YVVwZGF0ZXMgPSB7fTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG50aGlzIGlzIHRoZSBtb3N0IGltcG9ydGFudCBiZWhhdmlvciBmdW5jdGlvbiBpdCByZXR1cm5zIGVhY2ggZGF0YSBwb2ludCBhdCB4LHkgY29vcmRpbmF0ZXNcbiogIyMjIyByZXR1cm5zOiBPYmplY3RcbiAqIEBwYXJhbSB7aW50ZWdlcn0geCAtIHRoZSB4IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7aW50ZWdlcn0geCAtIHRoZSB5IGNvb3JkaW5hdGVcbiovXG5Jbk1lbW9yeS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdmFyIG92ZXJyaWRlID0gdGhpcy5kYXRhVXBkYXRlc1sncF8nICsgeCArICdfJyArIHldO1xuICAgIGlmIChvdmVycmlkZSkge1xuICAgICAgICByZXR1cm4gb3ZlcnJpZGU7XG4gICAgfVxuICAgIGlmICh4ID09PSAwKSB7XG4gICAgICAgIGlmICh5ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHk7XG4gICAgfVxuICAgIGlmICh5ID09PSAwKSB7XG4gICAgICAgIHJldHVybiBhbHBoYUZvcih4IC0gMSk7XG4gICAgfVxuICAgIHJldHVybiAoeCAtIDEpICsgJywgJyArIGFbKHkgLSAxKSAlIDI2XTtcbn07XG5cbkluTWVtb3J5LnByb3RvdHlwZS5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHgsIHksIHZhbHVlKSB7XG4gICAgdGhpcy5kYXRhVXBkYXRlc1sncF8nICsgeCArICdfJyArIHldID0gdmFsdWU7XG59O1xuXG5Jbk1lbW9yeS5wcm90b3R5cGUuZ2V0Q29sdW1uQ291bnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gMjc7XG59O1xuXG5Jbk1lbW9yeS5wcm90b3R5cGUuZ2V0Um93Q291bnQgPSBmdW5jdGlvbigpIHtcbiAgICAvL2plZXBlcnMgYmF0bWFuIGEgcXVhZHJpbGxpb24gcm93cyFcbiAgICByZXR1cm4gNTM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEluTWVtb3J5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZS5qcycpO1xuXG52YXIgYWxwaGFGb3IgPSBmdW5jdGlvbihpKSB7XG4gICAgLy8gTmFtZSB0aGUgY29sdW1uIGhlYWRlcnMgaW4gQSwgLi4sIEFBLCBBQiwgQUMsIC4uLCBBWiBmb3JtYXRcbiAgICAvLyBxdW90aWVudC9yZW1haW5kZXJcbiAgICAvL3ZhciBxdW8gPSBNYXRoLmZsb29yKGNvbC8yNyk7XG4gICAgdmFyIHF1byA9IE1hdGguZmxvb3IoKGkpIC8gMjYpO1xuICAgIHZhciByZW0gPSAoaSkgJSAyNjtcbiAgICB2YXIgY29kZSA9ICcnO1xuICAgIGlmIChxdW8gPiAwKSB7XG4gICAgICAgIGNvZGUgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgnQScuY2hhckNvZGVBdCgwKSArIHF1byAtIDEpO1xuICAgIH1cbiAgICBjb2RlICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoJ0EnLmNoYXJDb2RlQXQoMCkgKyByZW0pO1xuICAgIHJldHVybiBjb2RlO1xufTtcbi8vdmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9O1xudmFyIGEgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonO1xuXG5mdW5jdGlvbiBKU09OKCkge1xuICAgIEJhc2UuY2FsbCh0aGlzKTtcbn07XG5cbkpTT04ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlLnByb3RvdHlwZSk7XG5cbnZhciB2YWx1ZU9yRnVuY3Rpb25FeGVjdXRlID0gZnVuY3Rpb24odmFsdWVPckZ1bmN0aW9uKSB7XG4gICAgdmFyIGlzRnVuY3Rpb24gPSAoKCh0eXBlb2YgdmFsdWVPckZ1bmN0aW9uKVswXSkgPT09ICdmJyk7XG4gICAgdmFyIHJlc3VsdCA9IGlzRnVuY3Rpb24gPyB2YWx1ZU9yRnVuY3Rpb24oKSA6IHZhbHVlT3JGdW5jdGlvbjtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxudmFyIHRleHRNYXRjaEZpbHRlciA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHJldHVybiBmdW5jdGlvbihlYWNoKSB7XG4gICAgICAgIGVhY2ggPSB2YWx1ZU9yRnVuY3Rpb25FeGVjdXRlKGVhY2gpO1xuICAgICAgICByZXR1cm4gKGVhY2ggKyAnJykudG9Mb3dlckNhc2UoKS5zZWFyY2goc3RyaW5nLnRvTG93ZXJDYXNlKCkpID09PSAwO1xuICAgIH07XG59O1xuXG52YXIgbnVsbERhdGFTb3VyY2UgPSB7XG4gICAgaXNOdWxsT2JqZWN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICBnZXRGaWVsZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfSxcbiAgICBnZXRIZWFkZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH0sXG4gICAgZ2V0Q29sdW1uQ291bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9LFxuICAgIGdldFJvd0NvdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfSxcbiAgICBnZXRHcmFuZFRvdGFsczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9LFxuICAgIGhhc0FnZ3JlZ2F0ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICBoYXNHcm91cHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICBnZXRSb3c6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5cbi8vbnVsbCBvYmplY3QgcGF0dGVybiBmb3IgdGhlIHNvdXJjZSBvYmplY3RcbkpTT04ucHJvdG90eXBlLnNvdXJjZSA9IG51bGxEYXRhU291cmNlLFxuSlNPTi5wcm90b3R5cGUucHJlZ2xvYmFsZmlsdGVyID0gbnVsbERhdGFTb3VyY2UsXG5KU09OLnByb3RvdHlwZS5wcmVmaWx0ZXIgPSBudWxsRGF0YVNvdXJjZSxcbkpTT04ucHJvdG90eXBlLnByZXNvcnRlciA9IG51bGxEYXRhU291cmNlLFxuSlNPTi5wcm90b3R5cGUuYW5hbHl0aWNzID0gbnVsbERhdGFTb3VyY2UsXG5KU09OLnByb3RvdHlwZS5wb3N0ZmlsdGVyID0gbnVsbERhdGFTb3VyY2UsXG5KU09OLnByb3RvdHlwZS5wb3N0c29ydGVyID0gbnVsbERhdGFTb3VyY2UsXG5KU09OLnByb3RvdHlwZS50b3BUb3RhbHMgPSBbXSxcblxuSlNPTi5wcm90b3R5cGUuaGFzQWdncmVnYXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmFuYWx5dGljcy5oYXNBZ2dyZWdhdGVzKCk7XG59O1xuSlNPTi5wcm90b3R5cGUuaGFzR3JvdXBzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuYW5hbHl0aWNzLmhhc0dyb3VwcygpO1xufTtcbkpTT04ucHJvdG90eXBlLmdldERhdGFTb3VyY2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc291cmNlID0gdGhpcy5hbmFseXRpY3M7IC8vdGhpcy5oYXNBZ2dyZWdhdGVzKCkgPyB0aGlzLmFuYWx5dGljcyA6IHRoaXMucHJlc29ydGVyO1xuICAgIHJldHVybiBzb3VyY2U7XG59O1xuSlNPTi5wcm90b3R5cGUuZ2V0RmlsdGVyU291cmNlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNvdXJjZSA9IHRoaXMucHJlZmlsdGVyOyAvL3RoaXMuaGFzQWdncmVnYXRlcygpID8gdGhpcy5wb3N0ZmlsdGVyIDogdGhpcy5wcmVmaWx0ZXI7XG4gICAgcmV0dXJuIHNvdXJjZTtcbn07XG5KU09OLnByb3RvdHlwZS5nZXRTb3J0aW5nU291cmNlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNvdXJjZSA9IHRoaXMucHJlc29ydGVyOyAvL3RoaXMuaGFzQWdncmVnYXRlcygpID8gdGhpcy5wb3N0c29ydGVyIDogdGhpcy5wcmVzb3J0ZXI7XG4gICAgcmV0dXJuIHNvdXJjZTtcbn07XG5KU09OLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB2YXIgaGFzSGllcmFyY2h5Q29sdW1uID0gdGhpcy5oYXNIaWVyYXJjaHlDb2x1bW4oKTtcbiAgICB2YXIgZ3JpZCA9IHRoaXMuZ2V0R3JpZCgpO1xuICAgIHZhciBoZWFkZXJSb3dDb3VudCA9IGdyaWQuZ2V0SGVhZGVyUm93Q291bnQoKTtcbiAgICB2YXIgdmFsdWU7XG4gICAgaWYgKGhhc0hpZXJhcmNoeUNvbHVtbiAmJiB4ID09PSAtMikge1xuICAgICAgICB4ID0gMDtcbiAgICB9XG4gICAgaWYgKHkgPCBoZWFkZXJSb3dDb3VudCkge1xuICAgICAgICB2YWx1ZSA9IHRoaXMuZ2V0SGVhZGVyUm93VmFsdWUoeCwgeSk7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgaWYgKGhhc0hpZXJhcmNoeUNvbHVtbikge1xuICAgICAgICB5ICs9IDE7XG4gICAgfVxuICAgIHZhbHVlID0gdGhpcy5nZXREYXRhU291cmNlKCkuZ2V0VmFsdWUoeCwgeSAtIGhlYWRlclJvd0NvdW50KTtcbiAgICByZXR1cm4gdmFsdWU7XG59O1xuSlNPTi5wcm90b3R5cGUuZ2V0SGVhZGVyUm93VmFsdWUgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgaWYgKHkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRIZWFkZXJzKClbTWF0aC5tYXgoeCwgMCldO1xuICAgIH1cbiAgICB2YXIgZ3JpZCA9IHRoaXMuZ2V0R3JpZCgpO1xuICAgIHZhciBiZWhhdmlvciA9IGdyaWQuZ2V0QmVoYXZpb3IoKTtcbiAgICB2YXIgaXNGaWx0ZXJSb3cgPSBncmlkLmlzU2hvd0ZpbHRlclJvdygpO1xuICAgIHZhciBpc0hlYWRlclJvdyA9IGdyaWQuaXNTaG93SGVhZGVyUm93KCk7XG4gICAgdmFyIGlzQm90aCA9IGlzRmlsdGVyUm93ICYmIGlzSGVhZGVyUm93O1xuICAgIHZhciB0b3BUb3RhbHNPZmZzZXQgPSAoaXNGaWx0ZXJSb3cgPyAxIDogMCkgKyAoaXNIZWFkZXJSb3cgPyAxIDogMCk7XG4gICAgaWYgKHkgPj0gdG9wVG90YWxzT2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFRvcFRvdGFscygpW3kgLSB0b3BUb3RhbHNPZmZzZXRdW3hdO1xuICAgIH1cbiAgICB2YXIgZmlsdGVyID0gdGhpcy5nZXRGaWx0ZXIoeCk7XG4gICAgdmFyIGltYWdlID0gZmlsdGVyLmxlbmd0aCA9PT0gMCA/ICdmaWx0ZXItb2ZmJyA6ICdmaWx0ZXItb24nO1xuICAgIGlmIChpc0JvdGgpIHtcbiAgICAgICAgaWYgKHkgPT09IDApIHtcbiAgICAgICAgICAgIGltYWdlID0gdGhpcy5nZXRTb3J0SW1hZ2VGb3JDb2x1bW4oeCk7XG4gICAgICAgICAgICByZXR1cm4gW251bGwsIHRoaXMuZ2V0SGVhZGVycygpW3hdLCBpbWFnZV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW251bGwsIGZpbHRlciwgYmVoYXZpb3IuZ2V0SW1hZ2UoaW1hZ2UpXTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNGaWx0ZXJSb3cpIHtcbiAgICAgICAgcmV0dXJuIFtudWxsLCBmaWx0ZXIsIGJlaGF2aW9yLmdldEltYWdlKGltYWdlKV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW1hZ2UgPSB0aGlzLmdldFNvcnRJbWFnZUZvckNvbHVtbih4KTtcbiAgICAgICAgcmV0dXJuIFtudWxsLCB0aGlzLmdldEhlYWRlcnMoKVt4XSwgaW1hZ2VdO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59O1xuSlNPTi5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbih4LCB5LCB2YWx1ZSkge1xuICAgIHZhciBoYXNIaWVyYXJjaHlDb2x1bW4gPSB0aGlzLmhhc0hpZXJhcmNoeUNvbHVtbigpO1xuICAgIHZhciBncmlkID0gdGhpcy5nZXRHcmlkKCk7XG4gICAgdmFyIGhlYWRlclJvd0NvdW50ID0gZ3JpZC5nZXRIZWFkZXJSb3dDb3VudCgpO1xuICAgIGlmIChoYXNIaWVyYXJjaHlDb2x1bW4pIHtcbiAgICAgICAgaWYgKHggPT09IC0yKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB4ICs9IDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHkgPCBoZWFkZXJSb3dDb3VudCkge1xuICAgICAgICB0aGlzLnNldEhlYWRlclJvd1ZhbHVlKHgsIHksIHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKGhhc0hpZXJhcmNoeUNvbHVtbikge1xuICAgICAgICB5ICs9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5nZXREYXRhU291cmNlKCkuc2V0VmFsdWUoeCwgeSAtIGhlYWRlclJvd0NvdW50LCB2YWx1ZSk7XG4gICAgfVxuICAgIHRoaXMuY2hhbmdlZCgpO1xufTtcbkpTT04ucHJvdG90eXBlLnNldEhlYWRlclJvd1ZhbHVlID0gZnVuY3Rpb24oeCwgeSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2V0SGVhZGVyKHgsIHkpOyAvLyB5IGlzIHJlYWxseSB0aGUgdmFsdWVcbiAgICB9XG4gICAgdmFyIGdyaWQgPSB0aGlzLmdldEdyaWQoKTtcbiAgICB2YXIgaXNGaWx0ZXJSb3cgPSBncmlkLmlzU2hvd0ZpbHRlclJvdygpO1xuICAgIHZhciBpc0hlYWRlclJvdyA9IGdyaWQuaXNTaG93SGVhZGVyUm93KCk7XG4gICAgdmFyIGlzQm90aCA9IGlzRmlsdGVyUm93ICYmIGlzSGVhZGVyUm93O1xuICAgIHZhciB0b3BUb3RhbHNPZmZzZXQgPSAoaXNGaWx0ZXJSb3cgPyAxIDogMCkgKyAoaXNIZWFkZXJSb3cgPyAxIDogMCk7XG4gICAgaWYgKHkgPj0gdG9wVG90YWxzT2Zmc2V0KSB7XG4gICAgICAgIHRoaXMuZ2V0VG9wVG90YWxzKClbeSAtIHRvcFRvdGFsc09mZnNldF1beF0gPSB2YWx1ZTtcbiAgICB9IGVsc2UgaWYgKHggPT09IC0xKSB7XG4gICAgICAgIHJldHVybjsgLy8gY2FuJ3QgY2hhbmdlIHRoZSByb3cgbnVtYmVyc1xuICAgIH0gZWxzZSBpZiAoaXNCb3RoKSB7XG4gICAgICAgIGlmICh5ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc2V0SGVhZGVyKHgsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RmlsdGVyKHgsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNGaWx0ZXJSb3cpIHtcbiAgICAgICAgdGhpcy5zZXRGaWx0ZXIoeCwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZXRIZWFkZXIoeCwgdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG59O1xuSlNPTi5wcm90b3R5cGUuZ2V0Q29sdW1uUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICAvL2FjY2VzcyBkaXJlY3RseSBiZWNhdXNlIHdlIHdhbnQgaXQgb3JkZXJlZFxuICAgIHZhciBjb2x1bW4gPSB0aGlzLmdldEJlaGF2aW9yKCkuYWxsQ29sdW1uc1t4XTtcbiAgICBpZiAoY29sdW1uKSB7XG4gICAgICAgIHJldHVybiBjb2x1bW4uZ2V0UHJvcGVydGllcygpO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufTtcbkpTT04ucHJvdG90eXBlLmdldEZpbHRlciA9IGZ1bmN0aW9uKHgpIHtcbiAgICB2YXIgY29sdW1uUHJvcGVydGllcyA9IHRoaXMuZ2V0Q29sdW1uUHJvcGVydGllcyh4KTtcbiAgICBpZiAoIWNvbHVtblByb3BlcnRpZXMpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICB2YXIgZmlsdGVyID0gY29sdW1uUHJvcGVydGllcy5maWx0ZXIgfHwgJyc7XG4gICAgcmV0dXJuIGZpbHRlcjtcbn07XG5KU09OLnByb3RvdHlwZS5zZXRGaWx0ZXIgPSBmdW5jdGlvbih4LCB2YWx1ZSkge1xuICAgIHZhciBjb2x1bW5Qcm9wZXJ0aWVzID0gdGhpcy5nZXRDb2x1bW5Qcm9wZXJ0aWVzKHgpO1xuICAgIGNvbHVtblByb3BlcnRpZXMuZmlsdGVyID0gdmFsdWU7XG4gICAgdGhpcy5hcHBseUFuYWx5dGljcygpO1xufTtcbkpTT04ucHJvdG90eXBlLmdldENvbHVtbkNvdW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvdW50ID0gdGhpcy5hbmFseXRpY3MuZ2V0Q29sdW1uQ291bnQoKTtcbiAgICByZXR1cm4gY291bnQ7XG59O1xuSlNPTi5wcm90b3R5cGUuZ2V0Um93Q291bnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZ3JpZCA9IHRoaXMuZ2V0R3JpZCgpO1xuICAgIHZhciBjb3VudCA9IHRoaXMuZ2V0RGF0YVNvdXJjZSgpLmdldFJvd0NvdW50KCk7XG4gICAgY291bnQgKz0gZ3JpZC5nZXRIZWFkZXJSb3dDb3VudCgpO1xuICAgIHJldHVybiBjb3VudDtcbn07XG5KU09OLnByb3RvdHlwZS5nZXRIZWFkZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGhlYWRlcnMgPSB0aGlzLmFuYWx5dGljcy5nZXRIZWFkZXJzKCk7XG4gICAgcmV0dXJuIGhlYWRlcnM7XG59O1xuSlNPTi5wcm90b3R5cGUuZ2V0RGVmYXVsdEhlYWRlcnMgPSBmdW5jdGlvbigpIHt9O1xuSlNPTi5wcm90b3R5cGUuc2V0SGVhZGVycyA9IGZ1bmN0aW9uKGhlYWRlcnMpIHtcbiAgICB0aGlzLmdldERhdGFTb3VyY2UoKS5zZXRIZWFkZXJzKGhlYWRlcnMpO1xufTtcbkpTT04ucHJvdG90eXBlLnNldEZpZWxkcyA9IGZ1bmN0aW9uKGZpZWxkcykge1xuICAgIHRoaXMuZ2V0RGF0YVNvdXJjZSgpLnNldEZpZWxkcyhmaWVsZHMpO1xufTtcbkpTT04ucHJvdG90eXBlLmdldEZpZWxkcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmaWVsZHMgPSB0aGlzLmdldERhdGFTb3VyY2UoKS5nZXRGaWVsZHMoKTtcbiAgICByZXR1cm4gZmllbGRzO1xufTtcbkpTT04ucHJvdG90eXBlLnNldERhdGEgPSBmdW5jdGlvbihhcnJheU9mVW5pZm9ybU9iamVjdHMpIHtcbiAgICBpZiAoIXRoaXMuYW5hbHl0aWNzLmlzTnVsbE9iamVjdCkge1xuICAgICAgICB0aGlzLmFuYWx5dGljcy5kYXRhU291cmNlLnNldERhdGEoYXJyYXlPZlVuaWZvcm1PYmplY3RzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNvdXJjZSA9IG5ldyBmaW4uYW5hbHl0aWNzLkpTRGF0YVNvdXJjZShhcnJheU9mVW5pZm9ybU9iamVjdHMpOyAvKiBqc2hpbnQgaWdub3JlOmxpbmUgKi9cbiAgICAgICAgdGhpcy5wcmVnbG9iYWxmaWx0ZXIgPSBuZXcgZmluLmFuYWx5dGljcy5EYXRhU291cmNlR2xvYmFsRmlsdGVyKHRoaXMuc291cmNlKTsgLyoganNoaW50IGlnbm9yZTpsaW5lICovXG4gICAgICAgIHRoaXMucHJlZmlsdGVyID0gbmV3IGZpbi5hbmFseXRpY3MuRGF0YVNvdXJjZUZpbHRlcih0aGlzLnByZWdsb2JhbGZpbHRlcik7IC8qIGpzaGludCBpZ25vcmU6bGluZSAqL1xuICAgICAgICB0aGlzLnByZXNvcnRlciA9IG5ldyBmaW4uYW5hbHl0aWNzLkRhdGFTb3VyY2VTb3J0ZXJDb21wb3NpdGUodGhpcy5wcmVmaWx0ZXIpOyAvKiBqc2hpbnQgaWdub3JlOmxpbmUgKi9cbiAgICAgICAgdGhpcy5hbmFseXRpY3MgPSBuZXcgZmluLmFuYWx5dGljcy5EYXRhU291cmNlQWdncmVnYXRvcih0aGlzLnByZXNvcnRlcik7IC8qIGpzaGludCBpZ25vcmU6bGluZSAqL1xuICAgIH1cbiAgICB0aGlzLmFwcGx5QW5hbHl0aWNzKCk7XG4gICAgLy90aGlzLnBvc3RmaWx0ZXIgPSBuZXcgZmluLmFuYWx5dGljcy5EYXRhU291cmNlRmlsdGVyKHRoaXMuYW5hbHl0aWNzKTsgLyoganNoaW50IGlnbm9yZTpsaW5lICovXG4gICAgLy90aGlzLnBvc3Rzb3J0ZXIgPSBuZXcgZmluLmFuYWx5dGljcy5EYXRhU291cmNlU29ydGVyQ29tcG9zaXRlKHRoaXMucG9zdGZpbHRlcik7IC8qIGpzaGludCBpZ25vcmU6bGluZSAqL1xufTtcbkpTT04ucHJvdG90eXBlLmdldFRvcFRvdGFscyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5oYXNBZ2dyZWdhdGVzKCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9wVG90YWxzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXREYXRhU291cmNlKCkuZ2V0R3JhbmRUb3RhbHMoKTtcbn07XG5KU09OLnByb3RvdHlwZS5zZXRUb3BUb3RhbHMgPSBmdW5jdGlvbihuZXN0ZWRBcnJheSkge1xuICAgIHRoaXMudG9wVG90YWxzID0gbmVzdGVkQXJyYXk7XG59O1xuSlNPTi5wcm90b3R5cGUuc2V0R3JvdXBzID0gZnVuY3Rpb24oZ3JvdXBzKSB7XG4gICAgdGhpcy5hbmFseXRpY3Muc2V0R3JvdXBCeXMoZ3JvdXBzKTtcbiAgICB0aGlzLmFwcGx5QW5hbHl0aWNzKCk7XG4gICAgdGhpcy5nZXRHcmlkKCkuZmlyZVN5bnRoZXRpY0dyb3Vwc0NoYW5nZWRFdmVudCh0aGlzLmdldEdyb3VwcygpKTtcbn07XG5KU09OLnByb3RvdHlwZS5nZXRHcm91cHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaGVhZGVycyA9IHRoaXMuZ2V0SGVhZGVycygpLnNsaWNlKDApO1xuICAgIHZhciBmaWVsZHMgPSB0aGlzLmdldEZpZWxkcygpLnNsaWNlKDApO1xuICAgIHZhciBncm91cEJ5cyA9IHRoaXMuYW5hbHl0aWNzLmdyb3VwQnlzO1xuICAgIHZhciBncm91cHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyb3VwQnlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBmaWVsZCA9IGhlYWRlcnNbZ3JvdXBCeXNbaV1dO1xuICAgICAgICBncm91cHMucHVzaCh7XG4gICAgICAgICAgICBpZDogZ3JvdXBCeXNbaV0sXG4gICAgICAgICAgICBsYWJlbDogZmllbGQsXG4gICAgICAgICAgICBmaWVsZDogZmllbGRzXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZ3JvdXBzO1xufTtcblxuSlNPTi5wcm90b3R5cGUuZ2V0QXZhaWxhYmxlR3JvdXBzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGhlYWRlcnMgPSB0aGlzLnNvdXJjZS5nZXRIZWFkZXJzKCkuc2xpY2UoMCk7XG4gICAgdmFyIGdyb3VwQnlzID0gdGhpcy5hbmFseXRpY3MuZ3JvdXBCeXM7XG4gICAgdmFyIGdyb3VwcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGVhZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZ3JvdXBCeXMuaW5kZXhPZihpKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHZhciBmaWVsZCA9IGhlYWRlcnNbaV07XG4gICAgICAgICAgICBncm91cHMucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQ6IGksXG4gICAgICAgICAgICAgICAgbGFiZWw6IGZpZWxkLFxuICAgICAgICAgICAgICAgIGZpZWxkOiBmaWVsZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGdyb3Vwcztcbn07XG5cbkpTT04ucHJvdG90eXBlLmdldFZpc2libGVDb2x1bW5zID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gdGhpcy5nZXRCZWhhdmlvcigpLmNvbHVtbnM7XG4gICAgaXRlbXMgPSBpdGVtcy5maWx0ZXIoZnVuY3Rpb24oZWFjaCkge1xuICAgICAgICByZXR1cm4gZWFjaC5sYWJlbCAhPT0gJ1RyZWUnO1xuICAgIH0pO1xuICAgIHJldHVybiBpdGVtcztcbn07XG5cbkpTT04ucHJvdG90eXBlLmdldEhpZGRlbkNvbHVtbnMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmlzaWJsZSA9IHRoaXMuZ2V0QmVoYXZpb3IoKS5jb2x1bW5zO1xuICAgIHZhciBhbGwgPSB0aGlzLmdldEJlaGF2aW9yKCkuYWxsQ29sdW1ucztcbiAgICB2YXIgaGlkZGVuID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHZpc2libGUuaW5kZXhPZihhbGxbaV0pID09PSAtMSkge1xuICAgICAgICAgICAgaGlkZGVuLnB1c2goYWxsW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBoaWRkZW4uc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHJldHVybiBhLmxhYmVsIDwgYi5sYWJlbDtcbiAgICB9KTtcbiAgICByZXR1cm4gaGlkZGVuO1xufTtcblxuSlNPTi5wcm90b3R5cGUuc2V0QWdncmVnYXRlcyA9IGZ1bmN0aW9uKGFnZ3JlZ2F0aW9ucykge1xuICAgIHRoaXMucXVpZXRseVNldEFnZ3JlZ2F0ZXMoYWdncmVnYXRpb25zKTtcbiAgICB0aGlzLmFwcGx5QW5hbHl0aWNzKCk7XG59O1xuSlNPTi5wcm90b3R5cGUucXVpZXRseVNldEFnZ3JlZ2F0ZXMgPSBmdW5jdGlvbihhZ2dyZWdhdGlvbnMpIHtcbiAgICB0aGlzLmFuYWx5dGljcy5zZXRBZ2dyZWdhdGVzKGFnZ3JlZ2F0aW9ucyk7XG59O1xuSlNPTi5wcm90b3R5cGUuaGFzSGllcmFyY2h5Q29sdW1uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaGFzQWdncmVnYXRlcygpICYmIHRoaXMuaGFzR3JvdXBzKCk7XG59O1xuSlNPTi5wcm90b3R5cGUuYXBwbHlBbmFseXRpY3MgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmFwcGx5RmlsdGVycygpO1xuICAgIHRoaXMuYXBwbHlTb3J0cygpO1xuICAgIHRoaXMuYXBwbHlHcm91cEJ5c0FuZEFnZ3JlZ2F0aW9ucygpO1xufTtcbkpTT04ucHJvdG90eXBlLmFwcGx5R3JvdXBCeXNBbmRBZ2dyZWdhdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5hbmFseXRpY3MuYWdncmVnYXRlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy5xdWlldGx5U2V0QWdncmVnYXRlcyh7fSk7XG4gICAgfVxuICAgIHRoaXMuYW5hbHl0aWNzLmFwcGx5KCk7XG59O1xuSlNPTi5wcm90b3R5cGUuYXBwbHlGaWx0ZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5wcmVnbG9iYWxmaWx0ZXIuYXBwbHlGaWx0ZXJzKCk7XG4gICAgdmFyIGNvbENvdW50ID0gdGhpcy5nZXRDb2x1bW5Db3VudCgpO1xuICAgIHZhciBmaWx0ZXJTb3VyY2UgPSB0aGlzLmdldEZpbHRlclNvdXJjZSgpO1xuICAgIHZhciBncm91cE9mZnNldCA9IHRoaXMuaGFzQWdncmVnYXRlcygpID8gMSA6IDA7XG4gICAgZmlsdGVyU291cmNlLmNsZWFyRmlsdGVycygpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sQ291bnQ7IGkrKykge1xuICAgICAgICB2YXIgZmlsdGVyVGV4dCA9IHRoaXMuZ2V0RmlsdGVyKGkpO1xuICAgICAgICBpZiAoZmlsdGVyVGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmaWx0ZXJTb3VyY2UuYWRkRmlsdGVyKGkgLSBncm91cE9mZnNldCwgdGV4dE1hdGNoRmlsdGVyKGZpbHRlclRleHQpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmaWx0ZXJTb3VyY2UuYXBwbHlGaWx0ZXJzKCk7XG59O1xuSlNPTi5wcm90b3R5cGUudG9nZ2xlU29ydCA9IGZ1bmN0aW9uKGluZGV4LCBrZXlzKSB7XG4gICAgdGhpcy5pbmNyZW1lbnRTb3J0U3RhdGUoaW5kZXgsIGtleXMpO1xuICAgIHRoaXMuYXBwbHlBbmFseXRpY3MoKTtcbn07XG5KU09OLnByb3RvdHlwZS5pbmNyZW1lbnRTb3J0U3RhdGUgPSBmdW5jdGlvbihjb2xJbmRleCwga2V5cykge1xuICAgIGNvbEluZGV4Kys7IC8vaGFjayB0byBnZXQgYXJvdW5kIDAgaW5kZXhcbiAgICB2YXIgc3RhdGUgPSB0aGlzLmdldFByaXZhdGVTdGF0ZSgpO1xuICAgIHZhciBoYXNDVFJMID0ga2V5cy5pbmRleE9mKCdDVFJMJykgPiAtMTtcbiAgICBzdGF0ZS5zb3J0cyA9IHN0YXRlLnNvcnRzIHx8IFtdO1xuICAgIHZhciBhbHJlYWR5ID0gc3RhdGUuc29ydHMuaW5kZXhPZihjb2xJbmRleCk7XG4gICAgaWYgKGFscmVhZHkgPT09IC0xKSB7XG4gICAgICAgIGFscmVhZHkgPSBzdGF0ZS5zb3J0cy5pbmRleE9mKC0xICogY29sSW5kZXgpO1xuICAgIH1cbiAgICBpZiAoYWxyZWFkeSA+IC0xKSB7XG4gICAgICAgIGlmIChzdGF0ZS5zb3J0c1thbHJlYWR5XSA+IDApIHtcbiAgICAgICAgICAgIHN0YXRlLnNvcnRzW2FscmVhZHldID0gLTEgKiBzdGF0ZS5zb3J0c1thbHJlYWR5XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0YXRlLnNvcnRzLnNwbGljZShhbHJlYWR5LCAxKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaGFzQ1RSTCB8fCBzdGF0ZS5zb3J0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgc3RhdGUuc29ydHMudW5zaGlmdChjb2xJbmRleCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUuc29ydHMubGVuZ3RoID0gMDtcbiAgICAgICAgc3RhdGUuc29ydHMudW5zaGlmdChjb2xJbmRleCk7XG4gICAgfVxuICAgIGlmIChzdGF0ZS5zb3J0cy5sZW5ndGggPiAzKSB7XG4gICAgICAgIHN0YXRlLnNvcnRzLmxlbmd0aCA9IDM7XG4gICAgfVxufTtcbkpTT04ucHJvdG90eXBlLmFwcGx5U29ydHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc29ydGluZ1NvdXJjZSA9IHRoaXMuZ2V0U29ydGluZ1NvdXJjZSgpO1xuICAgIHZhciBzb3J0cyA9IHRoaXMuZ2V0UHJpdmF0ZVN0YXRlKCkuc29ydHM7XG4gICAgdmFyIGdyb3VwT2Zmc2V0ID0gdGhpcy5oYXNBZ2dyZWdhdGVzKCkgPyAxIDogMDtcbiAgICBpZiAoIXNvcnRzIHx8IHNvcnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBzb3J0aW5nU291cmNlLmNsZWFyU29ydHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY29sSW5kZXggPSBNYXRoLmFicyhzb3J0c1tpXSkgLSAxO1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBzb3J0c1tpXSA8IDAgPyAtMSA6IDE7XG4gICAgICAgICAgICBzb3J0aW5nU291cmNlLnNvcnRPbihjb2xJbmRleCAtIGdyb3VwT2Zmc2V0LCB0eXBlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzb3J0aW5nU291cmNlLmFwcGx5U29ydHMoKTtcbn07XG5KU09OLnByb3RvdHlwZS5nZXRTb3J0SW1hZ2VGb3JDb2x1bW4gPSBmdW5jdGlvbihpbmRleCkge1xuICAgIGluZGV4Kys7XG4gICAgdmFyIHVwID0gdHJ1ZTtcbiAgICB2YXIgc29ydHMgPSB0aGlzLmdldFByaXZhdGVTdGF0ZSgpLnNvcnRzO1xuICAgIGlmICghc29ydHMpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBwb3NpdGlvbiA9IHNvcnRzLmluZGV4T2YoaW5kZXgpO1xuICAgIGlmIChwb3NpdGlvbiA8IDApIHtcbiAgICAgICAgcG9zaXRpb24gPSBzb3J0cy5pbmRleE9mKC0xICogaW5kZXgpO1xuICAgICAgICB1cCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAocG9zaXRpb24gPCAwKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBwb3NpdGlvbisrO1xuICAgIHZhciBuYW1lID0gKDEgKyBzb3J0cy5sZW5ndGggLSBwb3NpdGlvbikgKyAodXAgPyAnLXVwJyA6ICctZG93bicpO1xuICAgIHJldHVybiB0aGlzLmdldEJlaGF2aW9yKCkuZ2V0SW1hZ2UobmFtZSk7XG59O1xuSlNPTi5wcm90b3R5cGUuY2VsbENsaWNrZWQgPSBmdW5jdGlvbihjZWxsLCBldmVudCkge1xuICAgIGlmICghdGhpcy5oYXNBZ2dyZWdhdGVzKCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXZlbnQuZ3JpZENlbGwueCAhPT0gMCkge1xuICAgICAgICByZXR1cm47IC8vIHRoaXMgd2Fzbid0IGEgY2xpY2sgb24gdGhlIGhpZXJhcmNoeSBjb2x1bW5cbiAgICB9XG4gICAgdmFyIGdyaWQgPSB0aGlzLmdldEdyaWQoKTtcbiAgICB2YXIgaGVhZGVyUm93Q291bnQgPSBncmlkLmdldEhlYWRlclJvd0NvdW50KCk7XG4gICAgdmFyIHkgPSBldmVudC5ncmlkQ2VsbC55IC0gaGVhZGVyUm93Q291bnQgKyAxO1xuICAgIHRoaXMuYW5hbHl0aWNzLmNsaWNrKHkpO1xuICAgIHRoaXMuY2hhbmdlZCgpO1xufTtcbkpTT04ucHJvdG90eXBlLmdldFJvdyA9IGZ1bmN0aW9uKHkpIHtcbiAgICB2YXIgZ3JpZCA9IHRoaXMuZ2V0R3JpZCgpO1xuICAgIHZhciBoZWFkZXJSb3dDb3VudCA9IGdyaWQuZ2V0SGVhZGVyUm93Q291bnQoKTtcbiAgICBpZiAoeSA8IGhlYWRlclJvd0NvdW50ICYmICF0aGlzLmhhc0FnZ3JlZ2F0ZXMoKSkge1xuICAgICAgICB2YXIgdG9wVG90YWxzID0gdGhpcy5nZXRUb3BUb3RhbHMoKTtcbiAgICAgICAgcmV0dXJuIHRvcFRvdGFsc1t5IC0gKGhlYWRlclJvd0NvdW50IC0gdG9wVG90YWxzLmxlbmd0aCldO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXREYXRhU291cmNlKCkuZ2V0Um93KHkgLSBoZWFkZXJSb3dDb3VudCk7XG59O1xuSlNPTi5wcm90b3R5cGUuYnVpbGRSb3cgPSBmdW5jdGlvbih5KSB7XG4gICAgdmFyIGNvbENvdW50ID0gdGhpcy5nZXRDb2x1bW5Db3VudCgpO1xuICAgIHZhciBmaWVsZHMgPSBbXS5jb25jYXQodGhpcy5nZXRGaWVsZHMoKSk7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGlmICh0aGlzLmhhc0FnZ3JlZ2F0ZXMoKSkge1xuICAgICAgICByZXN1bHQudHJlZSA9IHRoaXMuZ2V0VmFsdWUoLTIsIHkpO1xuICAgICAgICBmaWVsZHMuc2hpZnQoKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xDb3VudDsgaSsrKSB7XG4gICAgICAgIHJlc3VsdFtmaWVsZHNbaV1dID0gdGhpcy5nZXRWYWx1ZShpLCB5KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5KU09OLnByb3RvdHlwZS5nZXRDb21wdXRlZFJvdyA9IGZ1bmN0aW9uKHkpIHtcbiAgICB2YXIgcmNmID0gdGhpcy5nZXRSb3dDb250ZXh0RnVuY3Rpb24oW3ldKTtcbiAgICB2YXIgZmllbGRzID0gdGhpcy5nZXRGaWVsZHMoKTtcbiAgICB2YXIgcm93ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGZpZWxkID0gZmllbGRzW2ldO1xuICAgICAgICByb3dbZmllbGRdID0gcmNmKGZpZWxkKVswXTtcbiAgICB9XG4gICAgcmV0dXJuIHJvdztcbn07XG5cbkpTT04ucHJvdG90eXBlLmdldFZhbHVlQnlGaWVsZCA9IGZ1bmN0aW9uKGZpZWxkTmFtZSwgeSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0RmllbGRzKCkuaW5kZXhPZihmaWVsZE5hbWUpO1xuICAgIGlmICh0aGlzLmhhc0FnZ3JlZ2F0ZXMoKSkge1xuICAgICAgICB5ICs9IDE7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmdldERhdGFTb3VyY2UoKS5nZXRWYWx1ZShpbmRleCwgeSk7XG59O1xuXG5KU09OLnByb3RvdHlwZS5zZXRHbG9iYWxGaWx0ZXIgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICBpZiAoIXN0cmluZyB8fCBzdHJpbmcubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMucHJlZ2xvYmFsZmlsdGVyLmNsZWFyRmlsdGVycygpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucHJlZ2xvYmFsZmlsdGVyLnNldEZpbHRlcih0ZXh0TWF0Y2hGaWx0ZXIoc3RyaW5nKSk7XG4gICAgfVxuICAgIHRoaXMuYXBwbHlBbmFseXRpY3MoKTtcbn07XG5KU09OLnByb3RvdHlwZS5nZXRDZWxsUmVuZGVyZXIgPSBmdW5jdGlvbihjb25maWcsIHgsIHksIHVudHJhbnNsYXRlZFgsIHVudHJhbnNsYXRlZFkpIHtcbiAgICB2YXIgcmVuZGVyZXI7XG4gICAgdmFyIHByb3ZpZGVyID0gdGhpcy5nZXRHcmlkKCkuZ2V0Q2VsbFByb3ZpZGVyKCk7XG5cbiAgICBjb25maWcueCA9IHg7XG4gICAgY29uZmlnLnkgPSB5O1xuICAgIGNvbmZpZy51bnRyYW5zbGF0ZWRYID0gdW50cmFuc2xhdGVkWDtcbiAgICBjb25maWcudW50cmFuc2xhdGVkWSA9IHVudHJhbnNsYXRlZFk7XG5cbiAgICByZW5kZXJlciA9IHByb3ZpZGVyLmdldENlbGwoY29uZmlnKTtcbiAgICByZW5kZXJlci5jb25maWcgPSBjb25maWc7XG5cbiAgICByZXR1cm4gcmVuZGVyZXI7XG59O1xuSlNPTi5wcm90b3R5cGUuYXBwbHlTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYXBwbHlBbmFseXRpY3MoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSlNPTjtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgRGVmYXVsdDogcmVxdWlyZSgnLi9EZWZhdWx0LmpzJyksXG4gICAgSW5NZW1vcnk6IHJlcXVpcmUoJy4vSW5NZW1vcnkuanMnKSxcbiAgICBKU09OOiByZXF1aXJlKCcuL0pTT04uanMnKVxufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICpcbiAqIEBtb2R1bGUgZmVhdHVyZXNcXGJhc2VcbiAqIEBkZXNjcmlwdGlvblxuIGluc3RhbmNlcyBvZiBmZWF0dXJlcyBhcmUgY29ubmVjdGVkIHRvIG9uZSBhbm90aGVyIHRvIG1ha2UgYSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eSBmb3IgaGFuZGxpbmcgYWxsIHRoZSBpbnB1dCB0byB0aGUgaHlwZXJncmlkLlxuICpcbiAqL1xuXG5mdW5jdGlvbiBCYXNlKCkge1xuXG59O1xuXG5CYXNlLnByb3RvdHlwZSA9IHt9O1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7ZmluLWh5cGVyZ3JpZC1mZWF0dXJlLWJhc2V9IG5leHQgLSB0aGUgbmV4dCBmZWF0dXJlIHRvIGJlIGdpdmVuIGEgY2hhbmNlIHRvIGhhbmRsZSBpbmNvbWluZyBldmVudHNcbiAqIEBpbnN0YW5jZVxuICovXG5CYXNlLnByb3RvdHlwZS5uZXh0ID0gbnVsbDtcblxuLyoqXG4gKiBAcHJvcGVydHkge2Zpbi1oeXBlcmdyaWQtZmVhdHVyZS1iYXNlfSBkZXRhY2hlZCAtIGEgdGVtcG9yYXJ5IGhvbGRpbmcgZmllbGQgZm9yIG15IG5leHQgZmVhdHVyZSB3aGVuIEknbSBpbiBhIGRpc2Nvbm5lY3RlZCBzdGF0ZVxuICogQGluc3RhbmNlXG4gKi9cbkJhc2UucHJvdG90eXBlLmRldGFjaGVkID0gbnVsbDtcblxuLyoqXG4gKiBAcHJvcGVydHkge3N0cmluZ30gY3Vyc29yIC0gdGhlIGN1cnNvciBJIHdhbnQgdG8gYmUgZGlzcGxheWVkXG4gKiBAaW5zdGFuY2VcbiAqL1xuQmFzZS5wcm90b3R5cGUuY3Vyc29yID0gbnVsbDtcblxuLyoqXG4gKiBAcHJvcGVydHkge3JlY3RhbmdsZS5wb2ludH0gY3VycmVudEhvdmVyQ2VsbCAtIHRoZSBjZWxsIGxvY2F0aW9uIHdoZXJlIHRoZSBjdXJzb3IgaXMgY3VycmVudGx5XG4gKiBAaW5zdGFuY2VcbiAqL1xuQmFzZS5wcm90b3R5cGUuY3VycmVudEhvdmVyQ2VsbCA9IG51bGw7XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuc2V0IG15IG5leHQgZmllbGQsIG9yIGlmIGl0J3MgcG9wdWxhdGVkIGRlbGVnYXRlIHRvIHRoZSBmZWF0dXJlIGluIG15IG5leHQgZmllbGRcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkLWZlYXR1cmUtYmFzZX0gbmV4dEZlYXR1cmUgLSB0aGlzIGlzIGhvdyB3ZSBidWlsZCB0aGUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiovXG5CYXNlLnByb3RvdHlwZS5zZXROZXh0ID0gZnVuY3Rpb24obmV4dEZlYXR1cmUpIHtcbiAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5zZXROZXh0KG5leHRGZWF0dXJlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm5leHQgPSBuZXh0RmVhdHVyZTtcbiAgICAgICAgdGhpcy5kZXRhY2hlZCA9IG5leHRGZWF0dXJlO1xuICAgIH1cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuZGlzY29ubmVjdCBteSBjaGlsZFxuKi9cbkJhc2UucHJvdG90eXBlLmRldGFjaENoYWluID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5uZXh0ID0gbnVsbDtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmVhdHRhY2ggbXkgY2hpbGQgZnJvbSB0aGUgZGV0YWNoZWQgcmVmZXJlbmNlXG4qL1xuQmFzZS5wcm90b3R5cGUuYXR0YWNoQ2hhaW4gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLm5leHQgPSB0aGlzLmRldGFjaGVkO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIG1vdXNlIG1vdmUgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQmFzZS5wcm90b3R5cGUuaGFuZGxlTW91c2VNb3ZlID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5oYW5kbGVNb3VzZU1vdmUoZ3JpZCwgZXZlbnQpO1xuICAgIH1cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50IGRvd24gdGhlIGZlYXR1cmUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkJhc2UucHJvdG90eXBlLmhhbmRsZU1vdXNlRXhpdCA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VFeGl0KGdyaWQsIGV2ZW50KTtcbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5CYXNlLnByb3RvdHlwZS5oYW5kbGVNb3VzZUVudGVyID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5oYW5kbGVNb3VzZUVudGVyKGdyaWQsIGV2ZW50KTtcbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5CYXNlLnByb3RvdHlwZS5oYW5kbGVNb3VzZURvd24gPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIGlmICh0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0LmhhbmRsZU1vdXNlRG93bihncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQmFzZS5wcm90b3R5cGUuaGFuZGxlTW91c2VVcCA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VVcChncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQmFzZS5wcm90b3R5cGUuaGFuZGxlS2V5RG93biA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlS2V5RG93bihncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQmFzZS5wcm90b3R5cGUuaGFuZGxlS2V5VXAgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIGlmICh0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0LmhhbmRsZUtleVVwKGdyaWQsIGV2ZW50KTtcbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5CYXNlLnByb3RvdHlwZS5oYW5kbGVXaGVlbE1vdmVkID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5oYW5kbGVXaGVlbE1vdmVkKGdyaWQsIGV2ZW50KTtcbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5CYXNlLnByb3RvdHlwZS5oYW5kbGVEb3VibGVDbGljayA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlRG91YmxlQ2xpY2soZ3JpZCwgZXZlbnQpO1xuICAgIH1cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50IGRvd24gdGhlIGZlYXR1cmUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkJhc2UucHJvdG90eXBlLmhhbmRsZUhvbGRQdWxzZSA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlSG9sZFB1bHNlKGdyaWQsIGV2ZW50KTtcbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5CYXNlLnByb3RvdHlwZS5oYW5kbGVUYXAgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIGlmICh0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0LmhhbmRsZVRhcChncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQmFzZS5wcm90b3R5cGUuaGFuZGxlTW91c2VEcmFnID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5oYW5kbGVNb3VzZURyYWcoZ3JpZCwgZXZlbnQpO1xuICAgIH1cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50IGRvd24gdGhlIGZlYXR1cmUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkJhc2UucHJvdG90eXBlLmhhbmRsZUNvbnRleHRNZW51ID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5oYW5kbGVDb250ZXh0TWVudShncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gdG9nZ2xlIHRoZSBjb2x1bW4gcGlja2VyXG4qL1xuXG5CYXNlLnByb3RvdHlwZS50b2dnbGVDb2x1bW5QaWNrZXIgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQudG9nZ2xlQ29sdW1uUGlja2VyKGdyaWQpO1xuICAgIH1cbn07XG5cblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gdG9nZ2xlIHRoZSBjb2x1bW4gcGlja2VyXG4qL1xuXG5CYXNlLnByb3RvdHlwZS5tb3ZlU2luZ2xlU2VsZWN0ID0gZnVuY3Rpb24oZ3JpZCwgeCwgeSkge1xuICAgIGlmICh0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0Lm1vdmVTaW5nbGVTZWxlY3QoZ3JpZCwgeCwgeSk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQmFzZS5wcm90b3R5cGUuaXNGaXhlZFJvdyA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgdmFyIGdyaWRDZWxsID0gZXZlbnQudmlld1BvaW50O1xuICAgIHZhciBpc0ZpeGVkID0gZ3JpZENlbGwueSA8IGdyaWQuZ2V0Rml4ZWRSb3dDb3VudCgpO1xuICAgIHJldHVybiBpc0ZpeGVkO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQmFzZS5wcm90b3R5cGUuaXNGaXJzdEZpeGVkUm93ID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICB2YXIgZ3JpZENlbGwgPSBldmVudC52aWV3UG9pbnQ7XG4gICAgdmFyIGlzRml4ZWQgPSBncmlkQ2VsbC55IDwgMTtcbiAgICByZXR1cm4gaXNGaXhlZDtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50IGRvd24gdGhlIGZlYXR1cmUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkJhc2UucHJvdG90eXBlLmlzRml4ZWRDb2x1bW4gPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIHZhciBncmlkQ2VsbCA9IGV2ZW50LnZpZXdQb2ludDtcbiAgICB2YXIgaXNGaXhlZCA9IGdyaWRDZWxsLnggPCBncmlkLmdldEZpeGVkQ29sdW1uQ291bnQoKTtcbiAgICByZXR1cm4gaXNGaXhlZDtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50IGRvd24gdGhlIGZlYXR1cmUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkJhc2UucHJvdG90eXBlLmlzRmlyc3RGaXhlZENvbHVtbiA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgdmFyIGdyaWRDZWxsID0gZXZlbnQudmlld1BvaW50O1xuICAgIHZhciBlZGdlID0gZ3JpZC5pc1Nob3dSb3dOdW1iZXJzKCkgPyAwIDogMTtcbiAgICB2YXIgaXNGaXhlZCA9IGdyaWRDZWxsLnggPCBlZGdlO1xuICAgIHJldHVybiBpc0ZpeGVkO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQmFzZS5wcm90b3R5cGUuaXNUb3BMZWZ0ID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICB2YXIgaXNUb3BMZWZ0ID0gdGhpcy5pc0ZpeGVkUm93KGdyaWQsIGV2ZW50KSAmJiB0aGlzLmlzRml4ZWRDb2x1bW4oZ3JpZCwgZXZlbnQpO1xuICAgIHJldHVybiBpc1RvcExlZnQ7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5CYXNlLnByb3RvdHlwZS5zZXRDdXJzb3IgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuc2V0Q3Vyc29yKGdyaWQpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jdXJzb3IpIHtcbiAgICAgICAgZ3JpZC5iZUN1cnNvcih0aGlzLmN1cnNvcik7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQmFzZS5wcm90b3R5cGUuaW5pdGlhbGl6ZU9uID0gZnVuY3Rpb24oZ3JpZCkge1xuICAgIGlmICh0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0LmluaXRpYWxpemVPbihncmlkKTtcbiAgICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICpcbiAqIEBtb2R1bGUgZmVhdHVyZXNcXGJhc2VcbiAqIEBkZXNjcmlwdGlvblxuIGluc3RhbmNlcyBvZiBmZWF0dXJlcyBhcmUgY29ubmVjdGVkIHRvIG9uZSBhbm90aGVyIHRvIG1ha2UgYSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eSBmb3IgaGFuZGxpbmcgYWxsIHRoZSBpbnB1dCB0byB0aGUgaHlwZXJncmlkLlxuICpcbiAqL1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZS5qcycpO1xuXG5mdW5jdGlvbiBDZWxsQ2xpY2soKSB7XG4gICAgQmFzZS5jYWxsKHRoaXMpO1xuICAgIHRoaXMuYWxpYXMgPSAnQ2VsbENsaWNrJztcbn07XG5cbkNlbGxDbGljay5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2UucHJvdG90eXBlKTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ2VsbENsaWNrLnByb3RvdHlwZS5oYW5kbGVUYXAgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIHZhciBncmlkQ2VsbCA9IGV2ZW50LmdyaWRDZWxsO1xuICAgIHZhciBiZWhhdmlvciA9IGdyaWQuZ2V0QmVoYXZpb3IoKTtcbiAgICB2YXIgaGVhZGVyUm93Q291bnQgPSBiZWhhdmlvci5nZXRIZWFkZXJSb3dDb3VudCgpO1xuICAgIHZhciBoZWFkZXJDb2x1bW5Db3VudCA9IGJlaGF2aW9yLmdldEhlYWRlckNvbHVtbkNvdW50KCk7XG4gICAgaWYgKChncmlkQ2VsbC55ID49IGhlYWRlclJvd0NvdW50KSAmJlxuICAgICAgICAoZ3JpZENlbGwueCA+PSBoZWFkZXJDb2x1bW5Db3VudCkpIHtcbiAgICAgICAgZ3JpZC5jZWxsQ2xpY2tlZChldmVudCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0LmhhbmRsZVRhcChncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDZWxsQ2xpY2s7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICpcbiAqIEBtb2R1bGUgZmVhdHVyZXNcXGJhc2VcbiAqIEBkZXNjcmlwdGlvblxuIGluc3RhbmNlcyBvZiBmZWF0dXJlcyBhcmUgY29ubmVjdGVkIHRvIG9uZSBhbm90aGVyIHRvIG1ha2UgYSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eSBmb3IgaGFuZGxpbmcgYWxsIHRoZSBpbnB1dCB0byB0aGUgaHlwZXJncmlkLlxuICpcbiAqL1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZS5qcycpO1xuXG5mdW5jdGlvbiBDZWxsRWRpdGluZygpIHtcbiAgICBCYXNlLmNhbGwodGhpcyk7XG4gICAgdGhpcy5hbGlhcyA9ICdDZWxsRWRpdGluZyc7XG59O1xuXG5DZWxsRWRpdGluZy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2UucHJvdG90eXBlKTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ2VsbEVkaXRpbmcucHJvdG90eXBlLmhhbmRsZURvdWJsZUNsaWNrID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICB2YXIgYmVoYXZpb3IgPSBncmlkLmdldEJlaGF2aW9yKCk7XG4gICAgdmFyIGhlYWRlclJvd0NvdW50ID0gYmVoYXZpb3IuZ2V0SGVhZGVyUm93Q291bnQoKTtcbiAgICB2YXIgaGVhZGVyQ29sdW1uQ291bnQgPSBiZWhhdmlvci5nZXRIZWFkZXJDb2x1bW5Db3VudCgpO1xuICAgIHZhciBncmlkQ2VsbCA9IGV2ZW50LmdyaWRDZWxsO1xuICAgIGlmIChncmlkQ2VsbC54ID49IGhlYWRlckNvbHVtbkNvdW50ICYmIGdyaWRDZWxsLnkgPj0gaGVhZGVyUm93Q291bnQpIHtcbiAgICAgICAgZ3JpZC5fYWN0aXZhdGVFZGl0b3IoZXZlbnQpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5oYW5kbGVEb3VibGVDbGljayhncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ2VsbEVkaXRpbmcucHJvdG90eXBlLmhhbmRsZUhvbGRQdWxzZSA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgdmFyIGJlaGF2aW9yID0gZ3JpZC5nZXRCZWhhdmlvcigpO1xuICAgIHZhciBoZWFkZXJSb3dDb3VudCA9IGJlaGF2aW9yLmdldEhlYWRlclJvd0NvdW50KCk7XG4gICAgdmFyIGhlYWRlckNvbHVtbkNvdW50ID0gYmVoYXZpb3IuZ2V0SGVhZGVyQ29sdW1uQ291bnQoKTtcbiAgICB2YXIgZ3JpZENlbGwgPSBldmVudC5ncmlkQ2VsbDtcbiAgICBpZiAoZ3JpZENlbGwueCA+PSBoZWFkZXJDb2x1bW5Db3VudCAmJiBncmlkQ2VsbC55ID49IGhlYWRlclJvd0NvdW50KSB7XG4gICAgICAgIGdyaWQuX2FjdGl2YXRlRWRpdG9yKGV2ZW50KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlSG9sZFB1bHNlKGdyaWQsIGV2ZW50KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENlbGxFZGl0aW5nO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKlxuICogQG1vZHVsZSBmZWF0dXJlc1xcYmFzZVxuICogQGRlc2NyaXB0aW9uXG4gaW5zdGFuY2VzIG9mIGZlYXR1cmVzIGFyZSBjb25uZWN0ZWQgdG8gb25lIGFub3RoZXIgdG8gbWFrZSBhIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5IGZvciBoYW5kbGluZyBhbGwgdGhlIGlucHV0IHRvIHRoZSBoeXBlcmdyaWQuXG4gKlxuICovXG5cbnZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlLmpzJyk7XG5cbmZ1bmN0aW9uIENlbGxTZWxlY3Rpb24oKSB7XG4gICAgQmFzZS5jYWxsKHRoaXMpO1xuICAgIHRoaXMuYWxpYXMgPSAnQ2VsbFNlbGVjdGlvbic7XG59O1xuXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZS5wcm90b3R5cGUpO1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7ZmluLXJlY3RhbmdsZS5wb2ludH0gY3VycmVudERyYWcgLSBjdXJyZW50RHJhZyBpcyB0aGUgcGl4ZWwgbG9jYXRpb24gb2YgdGhlIG1vdXNlIHBvaW50ZXIgZHVyaW5nIGEgZHJhZyBvcGVyYXRpb25cbiAqIEBpbnN0YW5jZVxuICovXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZS5jdXJyZW50RHJhZyA9IG51bGw7XG5cbi8qKlxuICogQHByb3BlcnR5IHtPYmplY3R9IGxhc3REcmFnQ2VsbCAtIGxhc3REcmFnQ2VsbCBpcyB0aGUgY2VsbCBjb29yZGluYXRlcyBvZiB0aGUgd2hlcmUgdGhlIG1vdXNlIHBvaW50ZXIgaXMgZHVyaW5nIGEgZHJhZyBvcGVyYXRpb25cbiAqIEBpbnN0YW5jZVxuICovXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZS5sYXN0RHJhZ0NlbGwgPSBudWxsO1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBzYkxhc3RBdXRvIC0gc2JMYXN0QXV0byBpcyBhIG1pbGxpc2Vjb25kIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgcHJldmlvdXMgdGltZSBhbiBhdXRvc2Nyb2xsIHN0YXJ0ZWRcbiAqIEBpbnN0YW5jZVxuICovXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZS5zYkxhc3RBdXRvID0gMDtcblxuLyoqXG4gKiBAcHJvcGVydHkge051bWJlcn0gc2JBdXRvU3RhcnQgLSBzYkF1dG9TdGFydCBpcyBhIG1pbGxpc2Vjb25kIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgdGltZSB0aGUgY3VycmVudCBhdXRvc2Nyb2xsIHN0YXJ0ZWRcbiAqIEBpbnN0YW5jZVxuICovXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZS5zYkF1dG9TdGFydCA9IDA7XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50IGRvd24gdGhlIGZlYXR1cmUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNlbGxTZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZU1vdXNlVXAgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIGlmICh0aGlzLmRyYWdnaW5nKSB7XG4gICAgICAgIHRoaXMuZHJhZ2dpbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VVcChncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ2VsbFNlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlTW91c2VEb3duID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcblxuXG4gICAgdmFyIGlzUmlnaHRDbGljayA9IGV2ZW50LnByaW1pdGl2ZUV2ZW50LmRldGFpbC5pc1JpZ2h0Q2xpY2s7XG4gICAgdmFyIGJlaGF2aW9yID0gZ3JpZC5nZXRCZWhhdmlvcigpO1xuICAgIHZhciBjZWxsID0gZXZlbnQuZ3JpZENlbGw7XG4gICAgdmFyIHZpZXdDZWxsID0gZXZlbnQudmlld1BvaW50O1xuICAgIHZhciBkeCA9IGNlbGwueDtcbiAgICB2YXIgZHkgPSBjZWxsLnk7XG4gICAgdmFyIGhlYWRlclJvd0NvdW50ID0gYmVoYXZpb3IuZ2V0SGVhZGVyUm93Q291bnQoKTtcbiAgICB2YXIgaGVhZGVyQ29sdW1uQ291bnQgPSBiZWhhdmlvci5nZXRIZWFkZXJDb2x1bW5Db3VudCgpO1xuXG4gICAgdmFyIGlzSGVhZGVyID0gZHkgPCBoZWFkZXJSb3dDb3VudCB8fCBkeCA8IGhlYWRlckNvbHVtbkNvdW50O1xuXG4gICAgaWYgKCFncmlkLmlzQ2VsbFNlbGVjdGlvbigpIHx8IGlzUmlnaHRDbGljayB8fCBpc0hlYWRlcikge1xuICAgICAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VEb3duKGdyaWQsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdmFyIG51bUZpeGVkQ29sdW1ucyA9IGdyaWQuZ2V0Rml4ZWRDb2x1bW5Db3VudCgpO1xuICAgICAgICB2YXIgbnVtRml4ZWRSb3dzID0gZ3JpZC5nZXRGaXhlZFJvd0NvdW50KCk7XG5cbiAgICAgICAgLy9pZiB3ZSBhcmUgaW4gdGhlIGZpeGVkIGFyZWEgZG8gbm90IGFwcGx5IHRoZSBzY3JvbGwgdmFsdWVzXG4gICAgICAgIC8vY2hlY2sgYm90aCB4IGFuZCB5IHZhbHVlcyBpbmRlcGVuZGVudGx5XG4gICAgICAgIGlmICh2aWV3Q2VsbC54IDwgbnVtRml4ZWRDb2x1bW5zKSB7XG4gICAgICAgICAgICBkeCA9IHZpZXdDZWxsLng7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmlld0NlbGwueSA8IG51bUZpeGVkUm93cykge1xuICAgICAgICAgICAgZHkgPSB2aWV3Q2VsbC55O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRDZWxsID0gZ3JpZC5uZXdQb2ludChkeCwgZHkpO1xuXG4gICAgICAgIHZhciBwcmltRXZlbnQgPSBldmVudC5wcmltaXRpdmVFdmVudDtcbiAgICAgICAgdmFyIGtleXMgPSBwcmltRXZlbnQuZGV0YWlsLmtleXM7XG4gICAgICAgIHRoaXMuZHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmV4dGVuZFNlbGVjdGlvbihncmlkLCBkQ2VsbCwga2V5cyk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ2VsbFNlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlTW91c2VEcmFnID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICB2YXIgaXNSaWdodENsaWNrID0gZXZlbnQucHJpbWl0aXZlRXZlbnQuZGV0YWlsLmlzUmlnaHRDbGljaztcblxuICAgIGlmICghZ3JpZC5pc0NlbGxTZWxlY3Rpb24oKSB8fCBpc1JpZ2h0Q2xpY2sgfHwgIXRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICAgICAgdGhpcy5uZXh0LmhhbmRsZU1vdXNlRHJhZyhncmlkLCBldmVudCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIHZhciBudW1GaXhlZENvbHVtbnMgPSBncmlkLmdldEZpeGVkQ29sdW1uQ291bnQoKTtcbiAgICAgICAgdmFyIG51bUZpeGVkUm93cyA9IGdyaWQuZ2V0Rml4ZWRSb3dDb3VudCgpO1xuXG4gICAgICAgIHZhciBjZWxsID0gZXZlbnQuZ3JpZENlbGw7XG4gICAgICAgIHZhciB2aWV3Q2VsbCA9IGV2ZW50LnZpZXdQb2ludDtcbiAgICAgICAgdmFyIGR4ID0gY2VsbC54O1xuICAgICAgICB2YXIgZHkgPSBjZWxsLnk7XG5cbiAgICAgICAgLy9pZiB3ZSBhcmUgaW4gdGhlIGZpeGVkIGFyZWEgZG8gbm90IGFwcGx5IHRoZSBzY3JvbGwgdmFsdWVzXG4gICAgICAgIC8vY2hlY2sgYm90aCB4IGFuZCB5IHZhbHVlcyBpbmRlcGVuZGVudGx5XG4gICAgICAgIGlmICh2aWV3Q2VsbC54IDwgbnVtRml4ZWRDb2x1bW5zKSB7XG4gICAgICAgICAgICBkeCA9IHZpZXdDZWxsLng7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmlld0NlbGwueSA8IG51bUZpeGVkUm93cykge1xuICAgICAgICAgICAgZHkgPSB2aWV3Q2VsbC55O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRDZWxsID0gZ3JpZC5uZXdQb2ludChkeCwgZHkpO1xuXG4gICAgICAgIHZhciBwcmltRXZlbnQgPSBldmVudC5wcmltaXRpdmVFdmVudDtcbiAgICAgICAgdGhpcy5jdXJyZW50RHJhZyA9IHByaW1FdmVudC5kZXRhaWwubW91c2U7XG4gICAgICAgIHRoaXMubGFzdERyYWdDZWxsID0gZENlbGw7XG5cbiAgICAgICAgdGhpcy5jaGVja0RyYWdTY3JvbGwoZ3JpZCwgdGhpcy5jdXJyZW50RHJhZyk7XG4gICAgICAgIHRoaXMuaGFuZGxlTW91c2VEcmFnQ2VsbFNlbGVjdGlvbihncmlkLCBkQ2VsbCwgcHJpbUV2ZW50LmRldGFpbC5rZXlzKTtcbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVLZXlEb3duID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICB2YXIgY29tbWFuZCA9ICdoYW5kbGUnICsgZXZlbnQuZGV0YWlsLmNoYXI7XG4gICAgaWYgKHRoaXNbY29tbWFuZF0pIHtcbiAgICAgICAgdGhpc1tjb21tYW5kXS5jYWxsKHRoaXMsIGdyaWQsIGV2ZW50LmRldGFpbCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5IYW5kbGUgYSBtb3VzZWRyYWcgc2VsZWN0aW9uXG4qICMjIyMgcmV0dXJuczogdHlwZVxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKiBAcGFyYW0ge09iamVjdH0gbW91c2UgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKiBAcGFyYW0ge0FycmF5fSBrZXlzIC0gYXJyYXkgb2YgdGhlIGtleXMgdGhhdCBhcmUgY3VycmVudGx5IHByZXNzZWQgZG93blxuKi9cbkNlbGxTZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZU1vdXNlRHJhZ0NlbGxTZWxlY3Rpb24gPSBmdW5jdGlvbihncmlkLCBncmlkQ2VsbCAvKiAsa2V5cyAqLyApIHtcblxuICAgIHZhciBiZWhhdmlvciA9IGdyaWQuZ2V0QmVoYXZpb3IoKTtcbiAgICB2YXIgaGVhZGVyUm93Q291bnQgPSBiZWhhdmlvci5nZXRIZWFkZXJSb3dDb3VudCgpO1xuICAgIHZhciBoZWFkZXJDb2x1bW5Db3VudCA9IGJlaGF2aW9yLmdldEhlYWRlckNvbHVtbkNvdW50KCk7XG4gICAgdmFyIHggPSBncmlkQ2VsbC54O1xuICAgIHZhciB5ID0gZ3JpZENlbGwueTtcbiAgICB4ID0gTWF0aC5tYXgoaGVhZGVyQ29sdW1uQ291bnQsIHgpO1xuICAgIHkgPSBNYXRoLm1heChoZWFkZXJSb3dDb3VudCwgeSk7XG5cblxuXG4gICAgdmFyIHByZXZpb3VzRHJhZ0V4dGVudCA9IGdyaWQuZ2V0RHJhZ0V4dGVudCgpO1xuICAgIHZhciBtb3VzZURvd24gPSBncmlkLmdldE1vdXNlRG93bigpO1xuXG4gICAgLy92YXIgc2Nyb2xsaW5nTm93ID0gZ3JpZC5pc1Njcm9sbGluZ05vdygpO1xuXG4gICAgdmFyIG5ld1ggPSB4IC0gbW91c2VEb3duLng7XG4gICAgdmFyIG5ld1kgPSB5IC0gbW91c2VEb3duLnk7XG5cbiAgICBpZiAocHJldmlvdXNEcmFnRXh0ZW50LnggPT09IG5ld1ggJiYgcHJldmlvdXNEcmFnRXh0ZW50LnkgPT09IG5ld1kpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGdyaWQuY2xlYXJNb3N0UmVjZW50U2VsZWN0aW9uKCk7XG5cbiAgICBncmlkLnNlbGVjdChtb3VzZURvd24ueCwgbW91c2VEb3duLnksIG5ld1gsIG5ld1kpO1xuICAgIGdyaWQuc2V0RHJhZ0V4dGVudChncmlkLm5ld1BvaW50KG5ld1gsIG5ld1kpKTtcblxuICAgIGdyaWQucmVwYWludCgpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG50aGlzIGNoZWNrcyB3aGlsZSB3ZXJlIGRyYWdnaW5nIGlmIHdlIGdvIG91dHNpZGUgdGhlIHZpc2libGUgYm91bmRzLCBpZiBzbywga2ljayBvZmYgdGhlIGV4dGVybmFsIGF1dG9zY3JvbGwgY2hlY2sgZnVuY3Rpb24gKGFib3ZlKVxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKiBAcGFyYW0ge09iamVjdH0gbW91c2UgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNlbGxTZWxlY3Rpb24ucHJvdG90eXBlLmNoZWNrRHJhZ1Njcm9sbCA9IGZ1bmN0aW9uKGdyaWQsIG1vdXNlKSB7XG4gICAgaWYgKCFncmlkLnJlc29sdmVQcm9wZXJ0eSgnc2Nyb2xsaW5nRW5hYmxlZCcpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGIgPSBncmlkLmdldERhdGFCb3VuZHMoKTtcbiAgICB2YXIgaW5zaWRlID0gYi5jb250YWlucyhtb3VzZSk7XG4gICAgaWYgKGluc2lkZSkge1xuICAgICAgICBpZiAoZ3JpZC5pc1Njcm9sbGluZ05vdygpKSB7XG4gICAgICAgICAgICBncmlkLnNldFNjcm9sbGluZ05vdyhmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFncmlkLmlzU2Nyb2xsaW5nTm93KCkpIHtcbiAgICAgICAgZ3JpZC5zZXRTY3JvbGxpbmdOb3codHJ1ZSk7XG4gICAgICAgIHRoaXMuc2Nyb2xsRHJhZyhncmlkKTtcbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbnRoaXMgZnVuY3Rpb24gbWFrZXMgc3VyZSB0aGF0IHdoaWxlIHdlIGFyZSBkcmFnZ2luZyBvdXRzaWRlIG9mIHRoZSBncmlkIHZpc2libGUgYm91bmRzLCB3ZSBzcmNyb2xsIGFjY29yZGluZ2x5XG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qL1xuQ2VsbFNlbGVjdGlvbi5wcm90b3R5cGUuc2Nyb2xsRHJhZyA9IGZ1bmN0aW9uKGdyaWQpIHtcblxuICAgIGlmICghZ3JpZC5pc1Njcm9sbGluZ05vdygpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZHJhZ1N0YXJ0ZWRJbkhlYWRlckFyZWEgPSBncmlkLmlzTW91c2VEb3duSW5IZWFkZXJBcmVhKCk7XG4gICAgdmFyIGxhc3REcmFnQ2VsbCA9IHRoaXMubGFzdERyYWdDZWxsO1xuICAgIHZhciBiID0gZ3JpZC5nZXREYXRhQm91bmRzKCk7XG4gICAgdmFyIHhPZmZzZXQgPSAwO1xuICAgIHZhciB5T2Zmc2V0ID0gMDtcblxuICAgIHZhciBudW1GaXhlZENvbHVtbnMgPSBncmlkLmdldEZpeGVkQ29sdW1uQ291bnQoKTtcbiAgICB2YXIgbnVtRml4ZWRSb3dzID0gZ3JpZC5nZXRGaXhlZFJvd0NvdW50KCk7XG5cbiAgICB2YXIgZHJhZ0VuZEluRml4ZWRBcmVhWCA9IGxhc3REcmFnQ2VsbC54IDwgbnVtRml4ZWRDb2x1bW5zO1xuICAgIHZhciBkcmFnRW5kSW5GaXhlZEFyZWFZID0gbGFzdERyYWdDZWxsLnkgPCBudW1GaXhlZFJvd3M7XG5cbiAgICBpZiAoIWRyYWdTdGFydGVkSW5IZWFkZXJBcmVhKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnREcmFnLnggPCBiLm9yaWdpbi54KSB7XG4gICAgICAgICAgICB4T2Zmc2V0ID0gLTE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudERyYWcueSA8IGIub3JpZ2luLnkpIHtcbiAgICAgICAgICAgIHlPZmZzZXQgPSAtMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5jdXJyZW50RHJhZy54ID4gYi5vcmlnaW4ueCArIGIuZXh0ZW50LngpIHtcbiAgICAgICAgeE9mZnNldCA9IDE7XG4gICAgfVxuICAgIGlmICh0aGlzLmN1cnJlbnREcmFnLnkgPiBiLm9yaWdpbi55ICsgYi5leHRlbnQueSkge1xuICAgICAgICB5T2Zmc2V0ID0gMTtcbiAgICB9XG5cbiAgICB2YXIgZHJhZ0NlbGxPZmZzZXRYID0geE9mZnNldDtcbiAgICB2YXIgZHJhZ0NlbGxPZmZzZXRZID0geU9mZnNldDtcblxuICAgIGlmIChkcmFnRW5kSW5GaXhlZEFyZWFYKSB7XG4gICAgICAgIGRyYWdDZWxsT2Zmc2V0WCA9IDA7XG4gICAgfVxuXG4gICAgaWYgKGRyYWdFbmRJbkZpeGVkQXJlYVkpIHtcbiAgICAgICAgZHJhZ0NlbGxPZmZzZXRZID0gMDtcbiAgICB9XG5cbiAgICB0aGlzLmxhc3REcmFnQ2VsbCA9IGxhc3REcmFnQ2VsbC5wbHVzWFkoZHJhZ0NlbGxPZmZzZXRYLCBkcmFnQ2VsbE9mZnNldFkpO1xuICAgIGdyaWQuc2Nyb2xsQnkoeE9mZnNldCwgeU9mZnNldCk7XG4gICAgdGhpcy5oYW5kbGVNb3VzZURyYWdDZWxsU2VsZWN0aW9uKGdyaWQsIGxhc3REcmFnQ2VsbCwgW10pOyAvLyB1cGRhdGUgdGhlIHNlbGVjdGlvblxuICAgIGdyaWQucmVwYWludCgpO1xuICAgIHNldFRpbWVvdXQodGhpcy5zY3JvbGxEcmFnLmJpbmQodGhpcywgZ3JpZCksIDI1KTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuZXh0ZW5kIGEgc2VsZWN0aW9uIG9yIGNyZWF0ZSBvbmUgaWYgdGhlcmUgaXNudCB5ZXRcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiogQHBhcmFtIHtPYmplY3R9IGdyaWRDZWxsIC0gdGhlIGV2ZW50IGRldGFpbHNcbiogQHBhcmFtIHtBcnJheX0ga2V5cyAtIGFycmF5IG9mIHRoZSBrZXlzIHRoYXQgYXJlIGN1cnJlbnRseSBwcmVzc2VkIGRvd25cbiovXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZS5leHRlbmRTZWxlY3Rpb24gPSBmdW5jdGlvbihncmlkLCBncmlkQ2VsbCwga2V5cykge1xuICAgIHZhciBoYXNDVFJMID0ga2V5cy5pbmRleE9mKCdDVFJMJykgIT09IC0xO1xuICAgIHZhciBoYXNTSElGVCA9IGtleXMuaW5kZXhPZignU0hJRlQnKSAhPT0gLTE7XG4gICAgLy8gdmFyIHNjcm9sbFRvcCA9IGdyaWQuZ2V0VlNjcm9sbFZhbHVlKCk7XG4gICAgLy8gdmFyIHNjcm9sbExlZnQgPSBncmlkLmdldEhTY3JvbGxWYWx1ZSgpO1xuXG4gICAgLy8gdmFyIG51bUZpeGVkQ29sdW1ucyA9IDA7Ly9ncmlkLmdldEZpeGVkQ29sdW1uQ291bnQoKTtcbiAgICAvLyB2YXIgbnVtRml4ZWRSb3dzID0gMDsvL2dyaWQuZ2V0Rml4ZWRSb3dDb3VudCgpO1xuXG4gICAgdmFyIG1vdXNlUG9pbnQgPSBncmlkLmdldE1vdXNlRG93bigpO1xuICAgIHZhciB4ID0gZ3JpZENlbGwueDsgLy8gLSBudW1GaXhlZENvbHVtbnMgKyBzY3JvbGxMZWZ0O1xuICAgIHZhciB5ID0gZ3JpZENlbGwueTsgLy8gLSBudW1GaXhlZFJvd3MgKyBzY3JvbGxUb3A7XG5cbiAgICAvL3dlcmUgb3V0c2lkZSBvZiB0aGUgZ3JpZCBkbyBub3RoaW5nXG4gICAgaWYgKHggPCAwIHx8IHkgPCAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvL3dlIGhhdmUgcmVwZWF0ZWQgYSBjbGljayBpbiB0aGUgc2FtZSBzcG90IGRlc2xlY3QgdGhlIHZhbHVlIGZyb20gbGFzdCB0aW1lXG4gICAgaWYgKHggPT09IG1vdXNlUG9pbnQueCAmJiB5ID09PSBtb3VzZVBvaW50LnkpIHtcbiAgICAgICAgZ3JpZC5jbGVhck1vc3RSZWNlbnRTZWxlY3Rpb24oKTtcbiAgICAgICAgZ3JpZC5wb3BNb3VzZURvd24oKTtcbiAgICAgICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIWhhc0NUUkwgJiYgIWhhc1NISUZUKSB7XG4gICAgICAgIGdyaWQuY2xlYXJTZWxlY3Rpb25zKCk7XG4gICAgfVxuXG4gICAgaWYgKGhhc1NISUZUKSB7XG4gICAgICAgIGdyaWQuY2xlYXJNb3N0UmVjZW50U2VsZWN0aW9uKCk7XG4gICAgICAgIGdyaWQuc2VsZWN0KG1vdXNlUG9pbnQueCwgbW91c2VQb2ludC55LCB4IC0gbW91c2VQb2ludC54LCB5IC0gbW91c2VQb2ludC55KTtcbiAgICAgICAgZ3JpZC5zZXREcmFnRXh0ZW50KGdyaWQubmV3UG9pbnQoeCAtIG1vdXNlUG9pbnQueCwgeSAtIG1vdXNlUG9pbnQueSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGdyaWQuc2VsZWN0KHgsIHksIDAsIDApO1xuICAgICAgICBncmlkLnNldE1vdXNlRG93bihncmlkLm5ld1BvaW50KHgsIHkpKTtcbiAgICAgICAgZ3JpZC5zZXREcmFnRXh0ZW50KGdyaWQubmV3UG9pbnQoMCwgMCkpO1xuICAgIH1cbiAgICBncmlkLnJlcGFpbnQoKTtcbn07XG5cblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnRcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qL1xuQ2VsbFNlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlRE9XTlNISUZUID0gZnVuY3Rpb24oZ3JpZCkge1xuICAgIHRoaXMubW92ZVNoaWZ0U2VsZWN0KGdyaWQsIDAsIDEpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnRcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNlbGxTZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZVVQU0hJRlQgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgdGhpcy5tb3ZlU2hpZnRTZWxlY3QoZ3JpZCwgMCwgLTEpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnRcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNlbGxTZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZUxFRlRTSElGVCA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICB0aGlzLm1vdmVTaGlmdFNlbGVjdChncmlkLCAtMSwgMCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudFxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ2VsbFNlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlUklHSFRTSElGVCA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICB0aGlzLm1vdmVTaGlmdFNlbGVjdChncmlkLCAxLCAwKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVET1dOID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICAvL2tlZXAgdGhlIGJyb3dzZXIgdmlld3BvcnQgZnJvbSBhdXRvIHNjcm9sbGluZyBvbiBrZXkgZXZlbnRcbiAgICBldmVudC5wcmltaXRpdmVFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIGNvdW50ID0gdGhpcy5nZXRBdXRvU2Nyb2xsQWNjZWxlcmF0aW9uKCk7XG4gICAgdGhpcy5tb3ZlU2luZ2xlU2VsZWN0KGdyaWQsIDAsIGNvdW50KTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVVUCA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgLy9rZWVwIHRoZSBicm93c2VyIHZpZXdwb3J0IGZyb20gYXV0byBzY3JvbGxpbmcgb24ga2V5IGV2ZW50XG4gICAgZXZlbnQucHJpbWl0aXZlRXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBjb3VudCA9IHRoaXMuZ2V0QXV0b1Njcm9sbEFjY2VsZXJhdGlvbigpO1xuICAgIHRoaXMubW92ZVNpbmdsZVNlbGVjdChncmlkLCAwLCAtY291bnQpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnRcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNlbGxTZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZUxFRlQgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgdGhpcy5tb3ZlU2luZ2xlU2VsZWN0KGdyaWQsIC0xLCAwKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVSSUdIVCA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICB0aGlzLm1vdmVTaW5nbGVTZWxlY3QoZ3JpZCwgMSwgMCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbklmIHdlIGFyZSBob2xkaW5nIGRvd24gdGhlIHNhbWUgbmF2aWdhdGlvbiBrZXksIGFjY2VsZXJhdGUgdGhlIGluY3JlbWVudCB3ZSBzY3JvbGxcbiogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4qL1xuQ2VsbFNlbGVjdGlvbi5wcm90b3R5cGUuZ2V0QXV0b1Njcm9sbEFjY2VsZXJhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb3VudCA9IDE7XG4gICAgdmFyIGVsYXBzZWQgPSB0aGlzLmdldEF1dG9TY3JvbGxEdXJhdGlvbigpIC8gMjAwMDtcbiAgICBjb3VudCA9IE1hdGgubWF4KDEsIE1hdGguZmxvb3IoZWxhcHNlZCAqIGVsYXBzZWQgKiBlbGFwc2VkICogZWxhcHNlZCkpO1xuICAgIHJldHVybiBjb3VudDtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuc2V0IHRoZSBzdGFydCB0aW1lIHRvIHJpZ2h0IG5vdyB3aGVuIHdlIGluaXRpYXRlIGFuIGF1dG8gc2Nyb2xsXG4qL1xuQ2VsbFNlbGVjdGlvbi5wcm90b3R5cGUuc2V0QXV0b1Njcm9sbFN0YXJ0VGltZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2JBdXRvU3RhcnQgPSBEYXRlLm5vdygpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG51cGRhdGUgdGhlIGF1dG9zY3JvbGwgc3RhcnQgdGltZSBpZiB3ZSBoYXZlbid0IGF1dG9zY3JvbGxlZCB3aXRoaW4gdGhlIGxhc3QgNTAwbXMgb3RoZXJ3aXNlIHVwZGF0ZSB0aGUgY3VycmVudCBhdXRvc2Nyb2xsIHRpbWVcbiovXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZS5waW5nQXV0b1Njcm9sbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSB0aGlzLnNiTGFzdEF1dG8gPiA1MDApIHtcbiAgICAgICAgdGhpcy5zZXRBdXRvU2Nyb2xsU3RhcnRUaW1lKCk7XG4gICAgfVxuICAgIHRoaXMuc2JMYXN0QXV0byA9IERhdGUubm93KCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmFuc3dlciBob3cgbG9uZyB3ZSBoYXZlIGJlZW4gYXV0byBzY3JvbGxpbmdcbiogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4qL1xuQ2VsbFNlbGVjdGlvbi5wcm90b3R5cGUuZ2V0QXV0b1Njcm9sbER1cmF0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKERhdGUubm93KCkgLSB0aGlzLnNiTGFzdEF1dG8gPiA1MDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zYkF1dG9TdGFydDtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuQXVnbWVudCB0aGUgbW9zdCByZWNlbnQgc2VsZWN0aW9uIGV4dGVudCBieSAob2Zmc2V0WCxvZmZzZXRZKSBhbmQgc2Nyb2xsIGlmIG5lY2Vzc2FyeS5cbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge2ludGVnZXJ9IG9mZnNldFggLSB4IGNvb3JkaW5hdGUgdG8gc3RhcnQgYXRcbiAqIEBwYXJhbSB7aW50ZWdlcn0gb2Zmc2V0WSAtIHkgY29vcmRpbmF0ZSB0byBzdGFydCBhdFxuKi9cbkNlbGxTZWxlY3Rpb24ucHJvdG90eXBlLm1vdmVTaGlmdFNlbGVjdCA9IGZ1bmN0aW9uKGdyaWQsIG9mZnNldFgsIG9mZnNldFkpIHtcblxuICAgIHZhciBtYXhDb2x1bW5zID0gZ3JpZC5nZXRDb2x1bW5Db3VudCgpIC0gMTtcbiAgICB2YXIgbWF4Um93cyA9IGdyaWQuZ2V0Um93Q291bnQoKSAtIDE7XG5cbiAgICB2YXIgbWF4Vmlld2FibGVDb2x1bW5zID0gZ3JpZC5nZXRWaXNpYmxlQ29sdW1ucygpIC0gMTtcbiAgICB2YXIgbWF4Vmlld2FibGVSb3dzID0gZ3JpZC5nZXRWaXNpYmxlUm93cygpIC0gMTtcblxuICAgIGlmICghZ3JpZC5yZXNvbHZlUHJvcGVydHkoJ3Njcm9sbGluZ0VuYWJsZWQnKSkge1xuICAgICAgICBtYXhDb2x1bW5zID0gTWF0aC5taW4obWF4Q29sdW1ucywgbWF4Vmlld2FibGVDb2x1bW5zKTtcbiAgICAgICAgbWF4Um93cyA9IE1hdGgubWluKG1heFJvd3MsIG1heFZpZXdhYmxlUm93cyk7XG4gICAgfVxuXG4gICAgdmFyIG9yaWdpbiA9IGdyaWQuZ2V0TW91c2VEb3duKCk7XG4gICAgdmFyIGV4dGVudCA9IGdyaWQuZ2V0RHJhZ0V4dGVudCgpO1xuXG4gICAgdmFyIG5ld1ggPSBleHRlbnQueCArIG9mZnNldFg7XG4gICAgdmFyIG5ld1kgPSBleHRlbnQueSArIG9mZnNldFk7XG5cbiAgICBuZXdYID0gTWF0aC5taW4obWF4Q29sdW1ucyAtIG9yaWdpbi54LCBNYXRoLm1heCgtb3JpZ2luLngsIG5ld1gpKTtcbiAgICBuZXdZID0gTWF0aC5taW4obWF4Um93cyAtIG9yaWdpbi55LCBNYXRoLm1heCgtb3JpZ2luLnksIG5ld1kpKTtcblxuICAgIGdyaWQuY2xlYXJNb3N0UmVjZW50U2VsZWN0aW9uKCk7XG4gICAgZ3JpZC5zZWxlY3Qob3JpZ2luLngsIG9yaWdpbi55LCBuZXdYLCBuZXdZKTtcblxuICAgIGdyaWQuc2V0RHJhZ0V4dGVudChncmlkLm5ld1BvaW50KG5ld1gsIG5ld1kpKTtcblxuICAgIGlmIChncmlkLmluc3VyZU1vZGVsQ29sSXNWaXNpYmxlKG5ld1ggKyBvcmlnaW4ueCwgb2Zmc2V0WCkpIHtcbiAgICAgICAgdGhpcy5waW5nQXV0b1Njcm9sbCgpO1xuICAgIH1cbiAgICBpZiAoZ3JpZC5pbnN1cmVNb2RlbFJvd0lzVmlzaWJsZShuZXdZICsgb3JpZ2luLnksIG9mZnNldFkpKSB7XG4gICAgICAgIHRoaXMucGluZ0F1dG9TY3JvbGwoKTtcbiAgICB9XG5cbiAgICBncmlkLnJlcGFpbnQoKTtcblxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5SZXBsYWNlIHRoZSBtb3N0IHJlY2VudCBzZWxlY3Rpb24gd2l0aCBhIHNpbmdsZSBjZWxsIHNlbGVjdGlvbiB0aGF0IGlzIG1vdmVkIChvZmZzZXRYLG9mZnNldFkpIGZyb20gdGhlIHByZXZpb3VzIHNlbGVjdGlvbiBleHRlbnQuXG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtpbnRlZ2VyfSBvZmZzZXRYIC0geCBjb29yZGluYXRlIHRvIHN0YXJ0IGF0XG4gKiBAcGFyYW0ge2ludGVnZXJ9IG9mZnNldFkgLSB5IGNvb3JkaW5hdGUgdG8gc3RhcnQgYXRcbiovXG5DZWxsU2VsZWN0aW9uLnByb3RvdHlwZS5tb3ZlU2luZ2xlU2VsZWN0ID0gZnVuY3Rpb24oZ3JpZCwgb2Zmc2V0WCwgb2Zmc2V0WSkge1xuXG4gICAgdmFyIG1heENvbHVtbnMgPSBncmlkLmdldENvbHVtbkNvdW50KCkgLSAxO1xuICAgIHZhciBtYXhSb3dzID0gZ3JpZC5nZXRSb3dDb3VudCgpIC0gMTtcblxuICAgIHZhciBtYXhWaWV3YWJsZUNvbHVtbnMgPSBncmlkLmdldFZpc2libGVDb2x1bW5zQ291bnQoKSAtIDE7XG4gICAgdmFyIG1heFZpZXdhYmxlUm93cyA9IGdyaWQuZ2V0VmlzaWJsZVJvd3NDb3VudCgpIC0gMTtcblxuICAgIHZhciBtaW5Sb3dzID0gZ3JpZC5nZXRIZWFkZXJSb3dDb3VudCgpO1xuICAgIHZhciBtaW5Db2xzID0gZ3JpZC5nZXRIZWFkZXJDb2x1bW5Db3VudCgpO1xuXG4gICAgaWYgKCFncmlkLnJlc29sdmVQcm9wZXJ0eSgnc2Nyb2xsaW5nRW5hYmxlZCcpKSB7XG4gICAgICAgIG1heENvbHVtbnMgPSBNYXRoLm1pbihtYXhDb2x1bW5zLCBtYXhWaWV3YWJsZUNvbHVtbnMpO1xuICAgICAgICBtYXhSb3dzID0gTWF0aC5taW4obWF4Um93cywgbWF4Vmlld2FibGVSb3dzKTtcbiAgICB9XG5cbiAgICB2YXIgbW91c2VDb3JuZXIgPSBncmlkLmdldE1vdXNlRG93bigpLnBsdXMoZ3JpZC5nZXREcmFnRXh0ZW50KCkpO1xuXG4gICAgdmFyIG5ld1ggPSBtb3VzZUNvcm5lci54ICsgb2Zmc2V0WDtcbiAgICB2YXIgbmV3WSA9IG1vdXNlQ29ybmVyLnkgKyBvZmZzZXRZO1xuXG4gICAgbmV3WCA9IE1hdGgubWluKG1heENvbHVtbnMsIE1hdGgubWF4KG1pbkNvbHMsIG5ld1gpKTtcbiAgICBuZXdZID0gTWF0aC5taW4obWF4Um93cywgTWF0aC5tYXgobWluUm93cywgbmV3WSkpO1xuXG4gICAgZ3JpZC5jbGVhclNlbGVjdGlvbnMoKTtcbiAgICBncmlkLnNlbGVjdChuZXdYLCBuZXdZLCAwLCAwKTtcbiAgICBncmlkLnNldE1vdXNlRG93bihncmlkLm5ld1BvaW50KG5ld1gsIG5ld1kpKTtcbiAgICBncmlkLnNldERyYWdFeHRlbnQoZ3JpZC5uZXdQb2ludCgwLCAwKSk7XG5cbiAgICBpZiAoZ3JpZC5pbnN1cmVNb2RlbENvbElzVmlzaWJsZShuZXdYLCBvZmZzZXRYKSkge1xuICAgICAgICB0aGlzLnBpbmdBdXRvU2Nyb2xsKCk7XG4gICAgfVxuICAgIGlmIChncmlkLmluc3VyZU1vZGVsUm93SXNWaXNpYmxlKG5ld1ksIG9mZnNldFkpKSB7XG4gICAgICAgIHRoaXMucGluZ0F1dG9TY3JvbGwoKTtcbiAgICB9XG5cbiAgICBncmlkLnJlcGFpbnQoKTtcblxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENlbGxTZWxlY3Rpb247XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqXG4gKiBAbW9kdWxlIGZlYXR1cmVzXFxiYXNlXG4gKiBAZGVzY3JpcHRpb25cbiBpbnN0YW5jZXMgb2YgZmVhdHVyZXMgYXJlIGNvbm5lY3RlZCB0byBvbmUgYW5vdGhlciB0byBtYWtlIGEgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHkgZm9yIGhhbmRsaW5nIGFsbCB0aGUgaW5wdXQgdG8gdGhlIGh5cGVyZ3JpZC5cbiAqXG4gKi9cblxudmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UuanMnKTtcblxuZnVuY3Rpb24gQ29sdW1uQXV0b3NpemluZygpIHtcbiAgICBCYXNlLmNhbGwodGhpcyk7XG4gICAgdGhpcy5hbGlhcyA9ICdDb2x1bW5BdXRvc2l6aW5nJztcbn07XG5cbkNvbHVtbkF1dG9zaXppbmcucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlLnByb3RvdHlwZSk7XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50IGRvd24gdGhlIGZlYXR1cmUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNvbHVtbkF1dG9zaXppbmcucHJvdG90eXBlLmhhbmRsZURvdWJsZUNsaWNrID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICB2YXIgaGVhZGVyUm93Q291bnQgPSBncmlkLmdldEhlYWRlclJvd0NvdW50KCk7XG4gICAgLy92YXIgaGVhZGVyQ29sQ291bnQgPSBncmlkLmdldEhlYWRlckNvbHVtbkNvdW50KCk7XG4gICAgdmFyIGdyaWRDZWxsID0gZXZlbnQuZ3JpZENlbGw7XG4gICAgaWYgKGdyaWRDZWxsLnkgPD0gaGVhZGVyUm93Q291bnQpIHtcbiAgICAgICAgZ3JpZC5hdXRvc2l6ZUNvbHVtbihncmlkQ2VsbC54KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlRG91YmxlQ2xpY2soZ3JpZCwgZXZlbnQpO1xuICAgIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbHVtbkF1dG9zaXppbmc7XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqXG4gKiBAbW9kdWxlIGZlYXR1cmVzXFxjb2x1bW4tbW92aW5nXG4gKiBAZGVzY3JpcHRpb25cbiB0aGlzIGZlYXR1cmUgaXMgcmVzcG9uc2libGUgZm9yIGNvbHVtbiBkcmFnIGFuZCBkcm9wIHJlb3JkZXJpbmdcbiB0aGlzIG9iamVjdCBpcyBhIG1lc3MgYW5kIGRlc3BlcmF0ZWx5IG5lZWRzIGEgY29tcGxldGUgcmV3cml0ZS4uLi4uXG4gKlxuICovXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZS5qcycpO1xuXG5mdW5jdGlvbiBDb2x1bW5Nb3ZpbmcoKSB7XG4gICAgQmFzZS5jYWxsKHRoaXMpO1xuICAgIHRoaXMuYWxpYXMgPSAnQ29sdW1uTW92aW5nJztcbn07XG5cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2UucHJvdG90eXBlKTtcblxudmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9O1xuXG52YXIgY29sdW1uQW5pbWF0aW9uVGltZSA9IDE1MDtcbnZhciBkcmFnZ2VyO1xudmFyIGRyYWdnZXJDVFg7XG52YXIgZmxvYXRDb2x1bW47XG52YXIgZmxvYXRDb2x1bW5DVFg7XG5cbi8qKlxuICogQHByb3BlcnR5IHtBcnJheX0gZmxvYXRlckFuaW1hdGlvblF1ZXVlIC0gcXVldWUgdXAgdGhlIGFuaW1hdGlvbnMgdGhhdCBuZWVkIHRvIHBsYXkgc28gdGhleSBhcmUgZG9uZSBzeW5jaHJvbm91c2x5XG4gKiBAaW5zdGFuY2VcbiAqL1xuQ29sdW1uTW92aW5nLnByb3RvdHlwZS5mbG9hdGVyQW5pbWF0aW9uUXVldWUgPSBbXTtcblxuLyoqXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGNvbHVtbkRyYWdBdXRvU2Nyb2xsaW5nUmlnaHQgLSBhbSBJIGN1cnJlbnRseSBhdXRvIHNjcm9sbGluZyByaWdodFxuICogQGluc3RhbmNlXG4gKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuY29sdW1uRHJhZ0F1dG9TY3JvbGxpbmdSaWdodCA9IGZhbHNlO1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gY29sdW1uRHJhZ0F1dG9TY3JvbGxpbmdMZWZ0ICAtIGFtIEkgY3VycmVudGx5IGF1dG8gc2Nyb2xsaW5nIGxlZnRcbiAqIEBpbnN0YW5jZVxuICovXG5Db2x1bW5Nb3ZpbmcucHJvdG90eXBlLmNvbHVtbkRyYWdBdXRvU2Nyb2xsaW5nTGVmdCA9IGZhbHNlO1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZHJhZ0FybWVkIC0gaXMgdGhlIGRyYWcgbWVjaGFuaXNtIGN1cnJlbnRseSBlbmFibGVkKGFybWVkKVxuICogQGluc3RhbmNlXG4gKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuZHJhZ0FybWVkID0gZmFsc2U7XG5cbi8qKlxuICogQHByb3BlcnR5IHtib29sZWFufSBkcmFnZ2luZyAtIGFtIEkgZHJhZ2dpbmcgcmlnaHQgbm93XG4gKiBAaW5zdGFuY2VcbiAqL1xuQ29sdW1uTW92aW5nLnByb3RvdHlwZS5kcmFnZ2luZyA9IGZhbHNlO1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7aW50ZWdlcn0gZHJhZ0NvbCAtIHJldHVybiB0aGUgY29sdW1uIGluZGV4IG9mIHRoZSBjdXJyZW50bHkgZHJhZ2dlZCBjb2x1bW5cbiAqIEBpbnN0YW5jZVxuICovXG5Db2x1bW5Nb3ZpbmcucHJvdG90eXBlLmRyYWdDb2wgPSAtMTtcblxuLyoqXG4gKiBAcHJvcGVydHkge2ludGVnZXJ9IGRyYWdPZmZzZXQgLSBhbiBvZmZzZXQgdG8gcG9zaXRpb24gdGhlIGRyYWdnZWQgaXRlbSBmcm9tIHRoZSBjdXJzb3JcbiAqIEBpbnN0YW5jZVxuICovXG5Db2x1bW5Nb3ZpbmcucHJvdG90eXBlLmRyYWdPZmZzZXQgPSAwO1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmdpdmUgbWUgYW4gb3Bwb3J0dW5pdHkgdG8gaW5pdGlhbGl6ZSBzdHVmZiBvbiB0aGUgZ3JpZFxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuaW5pdGlhbGl6ZU9uID0gZnVuY3Rpb24oZ3JpZCkge1xuICAgIHRoaXMuaXNGbG9hdGluZ05vdyA9IGZhbHNlO1xuICAgIHRoaXMuaW5pdGlhbGl6ZUFuaW1hdGlvblN1cHBvcnQoZ3JpZCk7XG4gICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaW5pdGlhbGl6ZU9uKGdyaWQpO1xuICAgIH1cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuaW5pdGlhbGl6ZSBhbmltYXRpb24gc3VwcG9ydCBvbiB0aGUgZ3JpZFxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuaW5pdGlhbGl6ZUFuaW1hdGlvblN1cHBvcnQgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgbm9vcChncmlkKTtcbiAgICBpZiAoIWRyYWdnZXIpIHtcbiAgICAgICAgZHJhZ2dlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBkcmFnZ2VyLnNldEF0dHJpYnV0ZSgnd2lkdGgnLCAnMHB4Jyk7XG4gICAgICAgIGRyYWdnZXIuc2V0QXR0cmlidXRlKCdoZWlnaHQnLCAnMHB4Jyk7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkcmFnZ2VyKTtcbiAgICAgICAgZHJhZ2dlckNUWCA9IGRyYWdnZXIuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB9XG4gICAgaWYgKCFmbG9hdENvbHVtbikge1xuICAgICAgICBmbG9hdENvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBmbG9hdENvbHVtbi5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgJzBweCcpO1xuICAgICAgICBmbG9hdENvbHVtbi5zZXRBdHRyaWJ1dGUoJ2hlaWdodCcsICcwcHgnKTtcblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGZsb2F0Q29sdW1uKTtcbiAgICAgICAgZmxvYXRDb2x1bW5DVFggPSBmbG9hdENvbHVtbi5nZXRDb250ZXh0KCcyZCcpO1xuICAgIH1cblxufTtcblxuQ29sdW1uTW92aW5nLnByb3RvdHlwZS5nZXRDYW5EcmFnQ3Vyc29yTmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnLXdlYmtpdC1ncmFiJztcbn07XG5cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuZ2V0RHJhZ2dpbmdDdXJzb3JOYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICctd2Via2l0LWdyYWJiaW5nJztcbn07XG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudFxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ29sdW1uTW92aW5nLnByb3RvdHlwZS5oYW5kbGVNb3VzZURyYWcgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuXG4gICAgdmFyIGdyaWRDZWxsID0gZXZlbnQuZ3JpZENlbGw7XG4gICAgdmFyIHgsIHk7XG5cbiAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLmFicyhldmVudC5wcmltaXRpdmVFdmVudC5kZXRhaWwuZHJhZ3N0YXJ0LnggLSBldmVudC5wcmltaXRpdmVFdmVudC5kZXRhaWwubW91c2UueCk7XG5cbiAgICBpZiAoZGlzdGFuY2UgPCAxMCkge1xuICAgICAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VEcmFnKGdyaWQsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNIZWFkZXJSb3coZ3JpZCwgZXZlbnQpICYmIHRoaXMuZHJhZ0FybWVkICYmICF0aGlzLmRyYWdnaW5nKSB7XG4gICAgICAgIHRoaXMuZHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmRyYWdDb2wgPSBncmlkQ2VsbC54O1xuICAgICAgICB0aGlzLmRyYWdPZmZzZXQgPSBldmVudC5tb3VzZVBvaW50Lng7XG4gICAgICAgIHRoaXMuZGV0YWNoQ2hhaW4oKTtcbiAgICAgICAgeCA9IGV2ZW50LnByaW1pdGl2ZUV2ZW50LmRldGFpbC5tb3VzZS54IC0gdGhpcy5kcmFnT2Zmc2V0O1xuICAgICAgICB5ID0gZXZlbnQucHJpbWl0aXZlRXZlbnQuZGV0YWlsLm1vdXNlLnk7XG4gICAgICAgIHRoaXMuY3JlYXRlRHJhZ0NvbHVtbihncmlkLCB4LCB0aGlzLmRyYWdDb2wpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5oYW5kbGVNb3VzZURyYWcoZ3JpZCwgZXZlbnQpO1xuICAgIH1cbiAgICBpZiAodGhpcy5kcmFnZ2luZykge1xuICAgICAgICB4ID0gZXZlbnQucHJpbWl0aXZlRXZlbnQuZGV0YWlsLm1vdXNlLnggLSB0aGlzLmRyYWdPZmZzZXQ7XG4gICAgICAgIHkgPSBldmVudC5wcmltaXRpdmVFdmVudC5kZXRhaWwubW91c2UueTtcbiAgICAgICAgdGhpcy5kcmFnQ29sdW1uKGdyaWQsIHgpO1xuICAgIH1cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Db2x1bW5Nb3ZpbmcucHJvdG90eXBlLmhhbmRsZU1vdXNlRG93biA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgaWYgKGdyaWQuZ2V0QmVoYXZpb3IoKS5pc0NvbHVtblJlb3JkZXJhYmxlKCkpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNIZWFkZXJSb3coZ3JpZCwgZXZlbnQpICYmIGV2ZW50LmdyaWRDZWxsLnggIT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmRyYWdBcm1lZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmN1cnNvciA9IHRoaXMuZ2V0RHJhZ2dpbmdDdXJzb3JOYW1lKCk7XG4gICAgICAgICAgICBncmlkLmNsZWFyU2VsZWN0aW9ucygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0LmhhbmRsZU1vdXNlRG93bihncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnRcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuaGFuZGxlTW91c2VVcCA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgLy92YXIgY29sID0gZXZlbnQuZ3JpZENlbGwueDtcbiAgICBpZiAodGhpcy5kcmFnZ2luZykge1xuICAgICAgICB0aGlzLmN1cnNvciA9IG51bGw7XG4gICAgICAgIC8vZGVsYXkgaGVyZSB0byBnaXZlIG90aGVyIGV2ZW50cyBhIGNoYW5jZSB0byBiZSBkcm9wcGVkXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5lbmREcmFnQ29sdW1uKGdyaWQpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5hdHRhY2hDaGFpbigpO1xuICAgICAgICB9LCAyMDApO1xuICAgIH1cbiAgICB0aGlzLmRyYWdDb2wgPSAtMTtcbiAgICB0aGlzLmRyYWdnaW5nID0gZmFsc2U7XG4gICAgdGhpcy5kcmFnQXJtZWQgPSBmYWxzZTtcbiAgICB0aGlzLmN1cnNvciA9IG51bGw7XG4gICAgZ3JpZC5yZXBhaW50KCk7XG5cbiAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5oYW5kbGVNb3VzZVVwKGdyaWQsIGV2ZW50KTtcbiAgICB9XG5cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Db2x1bW5Nb3ZpbmcucHJvdG90eXBlLmhhbmRsZU1vdXNlTW92ZSA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG5cbiAgICBpZiAoIXRoaXMuZHJhZ2dpbmcgJiYgZXZlbnQubW91c2VQb2ludC55IDwgNSAmJiBldmVudC52aWV3UG9pbnQueSA9PT0gMCkge1xuICAgICAgICB0aGlzLmN1cnNvciA9IHRoaXMuZ2V0Q2FuRHJhZ0N1cnNvck5hbWUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmN1cnNvciA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VNb3ZlKGdyaWQsIGV2ZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0hlYWRlclJvdyhncmlkLCBldmVudCkgJiYgdGhpcy5kcmFnZ2luZykge1xuICAgICAgICB0aGlzLmN1cnNvciA9IHRoaXMuZ2V0RHJhZ2dpbmdDdXJzb3JOYW1lKCk7IC8vbW92ZSc7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG50aGlzIGlzIHRoZSBtYWluIGV2ZW50IGhhbmRsZXIgdGhhdCBtYW5hZ2VzIHRoZSBkcmFnZ2luZyBvZiB0aGUgY29sdW1uXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7Ym9vbGVhbn0gZHJhZ2dlZFRvVGhlUmlnaHQgLSBhcmUgd2UgbW92aW5nIHRvIHRoZSByaWdodFxuKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuZmxvYXRDb2x1bW5UbyA9IGZ1bmN0aW9uKGdyaWQsIGRyYWdnZWRUb1RoZVJpZ2h0KSB7XG4gICAgdGhpcy5mbG9hdGluZ05vdyA9IHRydWU7XG5cbiAgICB2YXIgcmVuZGVyZXIgPSBncmlkLmdldFJlbmRlcmVyKCk7XG4gICAgdmFyIGNvbEVkZ2VzID0gcmVuZGVyZXIuZ2V0Q29sdW1uRWRnZXMoKTtcbiAgICAvL3ZhciBiZWhhdmlvciA9IGdyaWQuZ2V0QmVoYXZpb3IoKTtcbiAgICB2YXIgc2Nyb2xsTGVmdCA9IGdyaWQuZ2V0SFNjcm9sbFZhbHVlKCk7XG4gICAgdmFyIGZsb2F0ZXJJbmRleCA9IGdyaWQucmVuZGVyT3ZlcnJpZGVzQ2FjaGUuZmxvYXRlci5jb2x1bW5JbmRleDtcbiAgICB2YXIgZHJhZ2dlckluZGV4ID0gZ3JpZC5yZW5kZXJPdmVycmlkZXNDYWNoZS5kcmFnZ2VyLmNvbHVtbkluZGV4O1xuICAgIHZhciBoZHBpcmF0aW8gPSBncmlkLnJlbmRlck92ZXJyaWRlc0NhY2hlLmRyYWdnZXIuaGRwaXJhdGlvO1xuXG4gICAgdmFyIGRyYWdnZXJTdGFydFg7XG4gICAgdmFyIGZsb2F0ZXJTdGFydFg7XG4gICAgdmFyIGZpeGVkQ29sdW1uQ291bnQgPSBncmlkLmdldEZpeGVkQ29sdW1uQ291bnQoKTtcbiAgICB2YXIgZHJhZ2dlcldpZHRoID0gZ3JpZC5nZXRDb2x1bW5XaWR0aChkcmFnZ2VySW5kZXgpO1xuICAgIHZhciBmbG9hdGVyV2lkdGggPSBncmlkLmdldENvbHVtbldpZHRoKGZsb2F0ZXJJbmRleCk7XG5cbiAgICB2YXIgbWF4ID0gZ3JpZC5nZXRWaXNpYmxlQ29sdW1uc0NvdW50KCk7XG5cbiAgICB2YXIgZG9mZnNldCA9IDA7XG4gICAgdmFyIGZvZmZzZXQgPSAwO1xuXG4gICAgaWYgKGRyYWdnZXJJbmRleCA+PSBmaXhlZENvbHVtbkNvdW50KSB7XG4gICAgICAgIGRvZmZzZXQgPSBzY3JvbGxMZWZ0O1xuICAgIH1cbiAgICBpZiAoZmxvYXRlckluZGV4ID49IGZpeGVkQ29sdW1uQ291bnQpIHtcbiAgICAgICAgZm9mZnNldCA9IHNjcm9sbExlZnQ7XG4gICAgfVxuXG4gICAgaWYgKGRyYWdnZWRUb1RoZVJpZ2h0KSB7XG4gICAgICAgIGRyYWdnZXJTdGFydFggPSBjb2xFZGdlc1tNYXRoLm1pbihtYXgsIGRyYWdnZXJJbmRleCAtIGRvZmZzZXQpXTtcbiAgICAgICAgZmxvYXRlclN0YXJ0WCA9IGNvbEVkZ2VzW01hdGgubWluKG1heCwgZmxvYXRlckluZGV4IC0gZm9mZnNldCldO1xuXG4gICAgICAgIGdyaWQucmVuZGVyT3ZlcnJpZGVzQ2FjaGUuZHJhZ2dlci5zdGFydFggPSAoZHJhZ2dlclN0YXJ0WCArIGZsb2F0ZXJXaWR0aCkgKiBoZHBpcmF0aW87XG4gICAgICAgIGdyaWQucmVuZGVyT3ZlcnJpZGVzQ2FjaGUuZmxvYXRlci5zdGFydFggPSBkcmFnZ2VyU3RhcnRYICogaGRwaXJhdGlvO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmxvYXRlclN0YXJ0WCA9IGNvbEVkZ2VzW01hdGgubWluKG1heCwgZmxvYXRlckluZGV4IC0gZm9mZnNldCldO1xuICAgICAgICBkcmFnZ2VyU3RhcnRYID0gZmxvYXRlclN0YXJ0WCArIGRyYWdnZXJXaWR0aDtcblxuICAgICAgICBncmlkLnJlbmRlck92ZXJyaWRlc0NhY2hlLmRyYWdnZXIuc3RhcnRYID0gZmxvYXRlclN0YXJ0WCAqIGhkcGlyYXRpbztcbiAgICAgICAgZ3JpZC5yZW5kZXJPdmVycmlkZXNDYWNoZS5mbG9hdGVyLnN0YXJ0WCA9IGRyYWdnZXJTdGFydFggKiBoZHBpcmF0aW87XG4gICAgfVxuICAgIGdyaWQuc3dhcENvbHVtbnMoZHJhZ2dlckluZGV4LCBmbG9hdGVySW5kZXgpO1xuICAgIGdyaWQucmVuZGVyT3ZlcnJpZGVzQ2FjaGUuZHJhZ2dlci5jb2x1bW5JbmRleCA9IGZsb2F0ZXJJbmRleDtcbiAgICBncmlkLnJlbmRlck92ZXJyaWRlc0NhY2hlLmZsb2F0ZXIuY29sdW1uSW5kZXggPSBkcmFnZ2VySW5kZXg7XG5cblxuICAgIHRoaXMuZmxvYXRlckFuaW1hdGlvblF1ZXVlLnVuc2hpZnQodGhpcy5kb0NvbHVtbk1vdmVBbmltYXRpb24oZ3JpZCwgZmxvYXRlclN0YXJ0WCwgZHJhZ2dlclN0YXJ0WCkpO1xuXG4gICAgdGhpcy5kb0Zsb2F0ZXJBbmltYXRpb24oZ3JpZCk7XG5cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxubWFuaWZlc3QgdGhlIGNvbHVtbiBkcmFnIGFuZCBkcm9wIGFuaW1hdGlvblxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKiBAcGFyYW0ge2ludGVnZXJ9IGZsb2F0ZXJTdGFydFggLSB0aGUgeCBzdGFydCBjb29yZGluYXRlIG9mIHRoZSBjb2x1bW4gdW5kZXJuZWF0aCB0aGF0IGZsb2F0cyBiZWhpbmQgdGhlIGRyYWdnZWQgY29sdW1uXG4qIEBwYXJhbSB7aW50ZWdlcn0gZHJhZ2dlclN0YXJ0WCAtIHRoZSB4IHN0YXJ0IGNvb3JkaW5hdGUgb2YgdGhlIGRyYWdnZWQgY29sdW1uXG4qL1xuQ29sdW1uTW92aW5nLnByb3RvdHlwZS5kb0NvbHVtbk1vdmVBbmltYXRpb24gPSBmdW5jdGlvbihncmlkLCBmbG9hdGVyU3RhcnRYLCBkcmFnZ2VyU3RhcnRYKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGQgPSBmbG9hdENvbHVtbjtcbiAgICAgICAgZC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSc7XG4gICAgICAgIHNlbGYuc2V0Q3Jvc3NCcm93c2VyUHJvcGVydHkoZCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIGZsb2F0ZXJTdGFydFggKyAncHgsICcgKyAwICsgJ3B4KScpO1xuXG4gICAgICAgIC8vZC5zdHlsZS53ZWJraXQtd2Via2l0LVRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoJyArIGZsb2F0ZXJTdGFydFggKyAncHgsICcgKyAwICsgJ3B4KSc7XG4gICAgICAgIC8vZC5zdHlsZS53ZWJraXQtd2Via2l0LVRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoJyArIGZsb2F0ZXJTdGFydFggKyAncHgsICcgKyAwICsgJ3B4KSc7XG5cbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuc2V0Q3Jvc3NCcm93c2VyUHJvcGVydHkoZCwgJ3RyYW5zaXRpb24nLCAoc2VsZi5pc1dlYmtpdCA/ICctd2Via2l0LScgOiAnJykgKyAndHJhbnNmb3JtICcgKyBjb2x1bW5BbmltYXRpb25UaW1lICsgJ21zIGVhc2UnKTtcbiAgICAgICAgICAgIHNlbGYuc2V0Q3Jvc3NCcm93c2VyUHJvcGVydHkoZCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIGRyYWdnZXJTdGFydFggKyAncHgsICcgKyAtMiArICdweCknKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGdyaWQucmVwYWludCgpO1xuICAgICAgICAvL25lZWQgdG8gY2hhbmdlIHRoaXMgdG8ga2V5IGZyYW1lc1xuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLnNldENyb3NzQnJvd3NlclByb3BlcnR5KGQsICd0cmFuc2l0aW9uJywgJycpO1xuICAgICAgICAgICAgZ3JpZC5yZW5kZXJPdmVycmlkZXNDYWNoZS5mbG9hdGVyID0gbnVsbDtcbiAgICAgICAgICAgIGdyaWQucmVwYWludCgpO1xuICAgICAgICAgICAgc2VsZi5kb0Zsb2F0ZXJBbmltYXRpb24oZ3JpZCk7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIHNlbGYuaXNGbG9hdGluZ05vdyA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGNvbHVtbkFuaW1hdGlvblRpbWUgKyA1MCk7XG4gICAgfTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxubWFuaWZlc3QgdGhlIGZsb2F0ZXIgYW5pbWF0aW9uXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qL1xuQ29sdW1uTW92aW5nLnByb3RvdHlwZS5kb0Zsb2F0ZXJBbmltYXRpb24gPSBmdW5jdGlvbihncmlkKSB7XG4gICAgaWYgKHRoaXMuZmxvYXRlckFuaW1hdGlvblF1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLmZsb2F0aW5nTm93ID0gZmFsc2U7XG4gICAgICAgIGdyaWQucmVwYWludCgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBhbmltYXRpb24gPSB0aGlzLmZsb2F0ZXJBbmltYXRpb25RdWV1ZS5wb3AoKTtcbiAgICBhbmltYXRpb24oKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuY3JlYXRlIHRoZSBmbG9hdCBjb2x1bW4gYXQgY29sdW1uSW5kZXggdW5kZXJuZWF0aCB0aGUgZHJhZ2dlZCBjb2x1bW5cbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiogQHBhcmFtIHtpbnRlZ2VyfSBjb2x1bW5JbmRleCAtIHRoZSBpbmRleCBvZiB0aGUgY29sdW1uIHRoYXQgd2lsbCBiZSBmbG9hdGluZ1xuKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuY3JlYXRlRmxvYXRDb2x1bW4gPSBmdW5jdGlvbihncmlkLCBjb2x1bW5JbmRleCkge1xuXG4gICAgdmFyIGZpeGVkQ29sdW1uQ291bnQgPSBncmlkLmdldEZpeGVkQ29sdW1uQ291bnQoKTtcbiAgICB2YXIgc2Nyb2xsTGVmdCA9IGdyaWQuZ2V0SFNjcm9sbFZhbHVlKCk7XG5cbiAgICBpZiAoY29sdW1uSW5kZXggPCBmaXhlZENvbHVtbkNvdW50KSB7XG4gICAgICAgIHNjcm9sbExlZnQgPSAwO1xuICAgIH1cblxuICAgIHZhciByZW5kZXJlciA9IGdyaWQuZ2V0UmVuZGVyZXIoKTtcbiAgICB2YXIgY29sdW1uRWRnZXMgPSByZW5kZXJlci5nZXRDb2x1bW5FZGdlcygpO1xuXG4gICAgdmFyIGNvbHVtbldpZHRoID0gZ3JpZC5nZXRDb2x1bW5XaWR0aChjb2x1bW5JbmRleCk7XG4gICAgdmFyIGNvbEhlaWdodCA9IGdyaWQuY2xpZW50SGVpZ2h0O1xuICAgIHZhciBkID0gZmxvYXRDb2x1bW47XG4gICAgdmFyIHN0eWxlID0gZC5zdHlsZTtcbiAgICB2YXIgbG9jYXRpb24gPSBncmlkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgc3R5bGUudG9wID0gKGxvY2F0aW9uLnRvcCAtIDIpICsgJ3B4JztcbiAgICBzdHlsZS5sZWZ0ID0gbG9jYXRpb24ubGVmdCArICdweCc7XG4gICAgc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuXG4gICAgdmFyIGhkcGlSYXRpbyA9IGdyaWQuZ2V0SGlEUEkoZmxvYXRDb2x1bW5DVFgpO1xuXG4gICAgZC5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgTWF0aC5yb3VuZChjb2x1bW5XaWR0aCAqIGhkcGlSYXRpbykgKyAncHgnKTtcbiAgICBkLnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgTWF0aC5yb3VuZChjb2xIZWlnaHQgKiBoZHBpUmF0aW8pICsgJ3B4Jyk7XG4gICAgc3R5bGUuYm94U2hhZG93ID0gJzAgMTBweCAyMHB4IHJnYmEoMCwwLDAsMC4xOSksIDAgNnB4IDZweCByZ2JhKDAsMCwwLDAuMjMpJztcbiAgICBzdHlsZS53aWR0aCA9IGNvbHVtbldpZHRoICsgJ3B4JzsgLy9NYXRoLnJvdW5kKGNvbHVtbldpZHRoIC8gaGRwaVJhdGlvKSArICdweCc7XG4gICAgc3R5bGUuaGVpZ2h0ID0gY29sSGVpZ2h0ICsgJ3B4JzsgLy9NYXRoLnJvdW5kKGNvbEhlaWdodCAvIGhkcGlSYXRpbykgKyAncHgnO1xuICAgIHN0eWxlLmJvcmRlclRvcCA9ICcxcHggc29saWQgJyArIHJlbmRlcmVyLnJlc29sdmVQcm9wZXJ0eSgnbGluZUNvbG9yJyk7XG4gICAgc3R5bGUuYmFja2dyb3VuZENvbG9yID0gcmVuZGVyZXIucmVzb2x2ZVByb3BlcnR5KCdiYWNrZ3JvdW5kQ29sb3InKTtcblxuICAgIHZhciBzdGFydFggPSBjb2x1bW5FZGdlc1tjb2x1bW5JbmRleCAtIHNjcm9sbExlZnRdO1xuICAgIHN0YXJ0WCA9IHN0YXJ0WCAqIGhkcGlSYXRpbztcblxuICAgIGZsb2F0Q29sdW1uQ1RYLnNjYWxlKGhkcGlSYXRpbywgaGRwaVJhdGlvKTtcblxuICAgIGdyaWQucmVuZGVyT3ZlcnJpZGVzQ2FjaGUuZmxvYXRlciA9IHtcbiAgICAgICAgY29sdW1uSW5kZXg6IGNvbHVtbkluZGV4LFxuICAgICAgICBjdHg6IGZsb2F0Q29sdW1uQ1RYLFxuICAgICAgICBzdGFydFg6IHN0YXJ0WCxcbiAgICAgICAgd2lkdGg6IGNvbHVtbldpZHRoLFxuICAgICAgICBoZWlnaHQ6IGNvbEhlaWdodCxcbiAgICAgICAgaGRwaXJhdGlvOiBoZHBpUmF0aW9cbiAgICB9O1xuXG4gICAgc3R5bGUuekluZGV4ID0gJzQnO1xuICAgIHRoaXMuc2V0Q3Jvc3NCcm93c2VyUHJvcGVydHkoZCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHN0YXJ0WCArICdweCwgJyArIC0yICsgJ3B4KScpO1xuICAgIHN0eWxlLmN1cnNvciA9IHRoaXMuZ2V0RHJhZ2dpbmdDdXJzb3JOYW1lKCk7XG4gICAgZ3JpZC5yZXBhaW50KCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbnV0aWxpdHkgZnVuY3Rpb24gZm9yIHNldHRpbmcgY3Jvc3MgYnJvd3NlciBjc3MgcHJvcGVydGllc1xuKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gZGVzY3JpcHRvblxuKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgLSB0aGUgcHJvcGVydHlcbiogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gdGhlIHZhbHVlIHRvIGFzc2lnblxuKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuc2V0Q3Jvc3NCcm93c2VyUHJvcGVydHkgPSBmdW5jdGlvbihlbGVtZW50LCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICB2YXIgdVByb3BlcnR5ID0gcHJvcGVydHlbMF0udG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnN1YnN0cigxKTtcbiAgICB0aGlzLnNldFByb3AoZWxlbWVudCwgJ3dlYmtpdCcgKyB1UHJvcGVydHksIHZhbHVlKTtcbiAgICB0aGlzLnNldFByb3AoZWxlbWVudCwgJ01veicgKyB1UHJvcGVydHksIHZhbHVlKTtcbiAgICB0aGlzLnNldFByb3AoZWxlbWVudCwgJ21zJyArIHVQcm9wZXJ0eSwgdmFsdWUpO1xuICAgIHRoaXMuc2V0UHJvcChlbGVtZW50LCAnTycgKyB1UHJvcGVydHksIHZhbHVlKTtcbiAgICB0aGlzLnNldFByb3AoZWxlbWVudCwgcHJvcGVydHksIHZhbHVlKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxudXRpbGl0eSBmdW5jdGlvbiBmb3Igc2V0dGluZyBwcm9wZXJ0aWVzIG9uIEhUTUxFbGVtZW50c1xuKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gZGVzY3JpcHRvblxuKiBAcGFyYW0ge3N0cmluZ30gcHJvcGVydHkgLSB0aGUgcHJvcGVydHlcbiogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gdGhlIHZhbHVlIHRvIGFzc2lnblxuKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuc2V0UHJvcCA9IGZ1bmN0aW9uKGVsZW1lbnQsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgIGlmIChwcm9wZXJ0eSBpbiBlbGVtZW50LnN0eWxlKSB7XG4gICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcGVydHldID0gdmFsdWU7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5jcmVhdGUgdGhlIGRyYWdnZWQgY29sdW1uIGF0IGNvbHVtbkluZGV4IGFib3ZlIHRoZSBmbG9hdGVkIGNvbHVtblxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKiBAcGFyYW0ge2ludGVnZXJ9IHggLSB0aGUgc3RhcnQgcG9zaXRpb25cbiogQHBhcmFtIHtpbnRlZ2VyfSBjb2x1bW5JbmRleCAtIHRoZSBpbmRleCBvZiB0aGUgY29sdW1uIHRoYXQgd2lsbCBiZSBmbG9hdGluZ1xuKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuY3JlYXRlRHJhZ0NvbHVtbiA9IGZ1bmN0aW9uKGdyaWQsIHgsIGNvbHVtbkluZGV4KSB7XG5cbiAgICB2YXIgZml4ZWRDb2x1bW5Db3VudCA9IGdyaWQuZ2V0Rml4ZWRDb2x1bW5Db3VudCgpO1xuICAgIHZhciBzY3JvbGxMZWZ0ID0gZ3JpZC5nZXRIU2Nyb2xsVmFsdWUoKTtcblxuICAgIGlmIChjb2x1bW5JbmRleCA8IGZpeGVkQ29sdW1uQ291bnQpIHtcbiAgICAgICAgc2Nyb2xsTGVmdCA9IDA7XG4gICAgfVxuXG4gICAgdmFyIHJlbmRlcmVyID0gZ3JpZC5nZXRSZW5kZXJlcigpO1xuICAgIHZhciBjb2x1bW5FZGdlcyA9IHJlbmRlcmVyLmdldENvbHVtbkVkZ2VzKCk7XG4gICAgdmFyIGhkcGlSYXRpbyA9IGdyaWQuZ2V0SGlEUEkoZHJhZ2dlckNUWCk7XG4gICAgdmFyIGNvbHVtbldpZHRoID0gZ3JpZC5nZXRDb2x1bW5XaWR0aChjb2x1bW5JbmRleCk7XG4gICAgdmFyIGNvbEhlaWdodCA9IGdyaWQuY2xpZW50SGVpZ2h0O1xuICAgIHZhciBkID0gZHJhZ2dlcjtcblxuXG5cblxuICAgIHZhciBsb2NhdGlvbiA9IGdyaWQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdmFyIHN0eWxlID0gZC5zdHlsZTtcblxuICAgIHN0eWxlLnRvcCA9IGxvY2F0aW9uLnRvcCArICdweCc7XG4gICAgc3R5bGUubGVmdCA9IGxvY2F0aW9uLmxlZnQgKyAncHgnO1xuICAgIHN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICBzdHlsZS5vcGFjaXR5ID0gMC44NTtcbiAgICBzdHlsZS5ib3hTaGFkb3cgPSAnMCAxOXB4IDM4cHggcmdiYSgwLDAsMCwwLjMwKSwgMCAxNXB4IDEycHggcmdiYSgwLDAsMCwwLjIyKSc7XG4gICAgLy9zdHlsZS56SW5kZXggPSAxMDA7XG4gICAgc3R5bGUuYm9yZGVyVG9wID0gJzFweCBzb2xpZCAnICsgcmVuZGVyZXIucmVzb2x2ZVByb3BlcnR5KCdsaW5lQ29sb3InKTtcbiAgICBzdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBncmlkLnJlbmRlcmVyLnJlc29sdmVQcm9wZXJ0eSgnYmFja2dyb3VuZENvbG9yJyk7XG5cbiAgICBkLnNldEF0dHJpYnV0ZSgnd2lkdGgnLCBNYXRoLnJvdW5kKGNvbHVtbldpZHRoICogaGRwaVJhdGlvKSArICdweCcpO1xuICAgIGQuc2V0QXR0cmlidXRlKCdoZWlnaHQnLCBNYXRoLnJvdW5kKGNvbEhlaWdodCAqIGhkcGlSYXRpbykgKyAncHgnKTtcblxuICAgIHN0eWxlLndpZHRoID0gY29sdW1uV2lkdGggKyAncHgnOyAvL01hdGgucm91bmQoY29sdW1uV2lkdGggLyBoZHBpUmF0aW8pICsgJ3B4JztcbiAgICBzdHlsZS5oZWlnaHQgPSBjb2xIZWlnaHQgKyAncHgnOyAvL01hdGgucm91bmQoY29sSGVpZ2h0IC8gaGRwaVJhdGlvKSArICdweCc7XG5cbiAgICB2YXIgc3RhcnRYID0gY29sdW1uRWRnZXNbY29sdW1uSW5kZXggLSBzY3JvbGxMZWZ0XTtcbiAgICBzdGFydFggPSBzdGFydFggKiBoZHBpUmF0aW87XG5cbiAgICBkcmFnZ2VyQ1RYLnNjYWxlKGhkcGlSYXRpbywgaGRwaVJhdGlvKTtcblxuICAgIGdyaWQucmVuZGVyT3ZlcnJpZGVzQ2FjaGUuZHJhZ2dlciA9IHtcbiAgICAgICAgY29sdW1uSW5kZXg6IGNvbHVtbkluZGV4LFxuICAgICAgICBjdHg6IGRyYWdnZXJDVFgsXG4gICAgICAgIHN0YXJ0WDogc3RhcnRYLFxuICAgICAgICB3aWR0aDogY29sdW1uV2lkdGgsXG4gICAgICAgIGhlaWdodDogY29sSGVpZ2h0LFxuICAgICAgICBoZHBpcmF0aW86IGhkcGlSYXRpb1xuICAgIH07XG5cbiAgICB0aGlzLnNldENyb3NzQnJvd3NlclByb3BlcnR5KGQsICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB4ICsgJ3B4LCAtNXB4KScpO1xuICAgIHN0eWxlLnpJbmRleCA9ICc1JztcbiAgICBzdHlsZS5jdXJzb3IgPSB0aGlzLmdldERyYWdnaW5nQ3Vyc29yTmFtZSgpO1xuICAgIGdyaWQucmVwYWludCgpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG50aGlzIGZ1bmN0aW9uIGlzIHRoZSBtYWluIGRyYWdnaW5nIGxvZ2ljXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7aW50ZWdlcn0geCAtIHRoZSBzdGFydCBwb3NpdGlvblxuKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuZHJhZ0NvbHVtbiA9IGZ1bmN0aW9uKGdyaWQsIHgpIHtcblxuICAgIC8vVE9ETzogdGhpcyBmdW5jdGlvbiBpcyBvdmVybHkgY29tcGxleCwgcmVmYWN0b3IgdGhpcyBpbiB0byBzb21ldGhpbmcgbW9yZSByZWFzb25hYmxlXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vdmFyIHJlbmRlcmVyID0gZ3JpZC5nZXRSZW5kZXJlcigpO1xuICAgIC8vdmFyIGNvbHVtbkVkZ2VzID0gcmVuZGVyZXIuZ2V0Q29sdW1uRWRnZXMoKTtcblxuICAgIHZhciBhdXRvU2Nyb2xsaW5nTm93ID0gdGhpcy5jb2x1bW5EcmFnQXV0b1Njcm9sbGluZ1JpZ2h0IHx8IHRoaXMuY29sdW1uRHJhZ0F1dG9TY3JvbGxpbmdMZWZ0O1xuXG4gICAgdmFyIGhkcGlSYXRpbyA9IGdyaWQuZ2V0SGlEUEkoZHJhZ2dlckNUWCk7XG5cbiAgICB2YXIgZHJhZ0NvbHVtbkluZGV4ID0gZ3JpZC5yZW5kZXJPdmVycmlkZXNDYWNoZS5kcmFnZ2VyLmNvbHVtbkluZGV4O1xuICAgIHZhciBjb2x1bW5XaWR0aCA9IGdyaWQucmVuZGVyT3ZlcnJpZGVzQ2FjaGUuZHJhZ2dlci53aWR0aDtcblxuICAgIHZhciBtaW5YID0gMDsgLy9ncmlkLmdldEZpeGVkQ29sdW1uc1dpZHRoKCk7XG4gICAgdmFyIG1heFggPSBncmlkLnJlbmRlcmVyLmdldEZpbmFsVmlzYWJsZUNvbHVtbkJvdW5kcnkoKSAtIGNvbHVtbldpZHRoO1xuICAgIHggPSBNYXRoLm1pbih4LCBtYXhYICsgMTUpO1xuICAgIHggPSBNYXRoLm1heChtaW5YIC0gMTUsIHgpO1xuXG4gICAgLy9hbSBJIGF0IG15IGxvd2VyIGJvdW5kXG4gICAgdmFyIGF0TWluID0geCA8IG1pblggJiYgZHJhZ0NvbHVtbkluZGV4ICE9PSAwO1xuXG4gICAgLy9hbSBJIGF0IG15IHVwcGVyIGJvdW5kXG4gICAgdmFyIGF0TWF4ID0geCA+IG1heFg7XG5cbiAgICB2YXIgZCA9IGRyYWdnZXI7XG5cbiAgICB0aGlzLnNldENyb3NzQnJvd3NlclByb3BlcnR5KGQsICd0cmFuc2l0aW9uJywgKHNlbGYuaXNXZWJraXQgPyAnLXdlYmtpdC0nIDogJycpICsgJ3RyYW5zZm9ybSAnICsgMCArICdtcyBlYXNlLCBib3gtc2hhZG93ICcgKyBjb2x1bW5BbmltYXRpb25UaW1lICsgJ21zIGVhc2UnKTtcblxuICAgIHRoaXMuc2V0Q3Jvc3NCcm93c2VyUHJvcGVydHkoZCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHggKyAncHgsICcgKyAtMTAgKyAncHgpJyk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgICAgICBkLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJztcbiAgICB9KTtcblxuICAgIHZhciBvdmVyQ29sID0gZ3JpZC5yZW5kZXJlci5nZXRDb2x1bW5Gcm9tUGl4ZWxYKHggKyAoZC53aWR0aCAvIDIgLyBoZHBpUmF0aW8pKTtcblxuICAgIGlmIChhdE1pbikge1xuICAgICAgICBvdmVyQ29sID0gMDtcbiAgICB9XG5cbiAgICBpZiAoYXRNYXgpIHtcbiAgICAgICAgb3ZlckNvbCA9IGdyaWQuZ2V0Q29sdW1uQ291bnQoKSAtIDE7XG4gICAgfVxuXG4gICAgdmFyIGRvQUZsb2F0ID0gZHJhZ0NvbHVtbkluZGV4ID4gb3ZlckNvbDtcbiAgICBkb0FGbG9hdCA9IGRvQUZsb2F0IHx8IChvdmVyQ29sIC0gZHJhZ0NvbHVtbkluZGV4ID49IDEpO1xuXG4gICAgaWYgKGRvQUZsb2F0ICYmICFhdE1heCAmJiAhYXV0b1Njcm9sbGluZ05vdykge1xuICAgICAgICB2YXIgZHJhZ2dlZFRvVGhlUmlnaHQgPSBkcmFnQ29sdW1uSW5kZXggPCBvdmVyQ29sO1xuICAgICAgICAvLyBpZiAoZHJhZ2dlZFRvVGhlUmlnaHQpIHtcbiAgICAgICAgLy8gICAgIG92ZXJDb2wgPSBvdmVyQ29sIC0gMTtcbiAgICAgICAgLy8gfVxuICAgICAgICBpZiAodGhpcy5pc0Zsb2F0aW5nTm93KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzRmxvYXRpbmdOb3cgPSB0cnVlO1xuICAgICAgICB0aGlzLmNyZWF0ZUZsb2F0Q29sdW1uKGdyaWQsIG92ZXJDb2wpO1xuICAgICAgICB0aGlzLmZsb2F0Q29sdW1uVG8oZ3JpZCwgZHJhZ2dlZFRvVGhlUmlnaHQpO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgaWYgKHggPCBtaW5YIC0gMTApIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tBdXRvU2Nyb2xsVG9MZWZ0KGdyaWQsIHgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4ID4gbWluWCAtIDEwKSB7XG4gICAgICAgICAgICB0aGlzLmNvbHVtbkRyYWdBdXRvU2Nyb2xsaW5nTGVmdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vbGV0cyBjaGVjayBmb3IgYXV0b3Njcm9sbCB0byByaWdodCBpZiB3ZXJlIHVwIGFnYWluc3QgaXRcbiAgICAgICAgaWYgKGF0TWF4IHx8IHggPiBtYXhYICsgMTApIHtcbiAgICAgICAgICAgIHRoaXMuY2hlY2tBdXRvU2Nyb2xsVG9SaWdodChncmlkLCB4KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeCA8IG1heFggKyAxMCkge1xuICAgICAgICAgICAgdGhpcy5jb2x1bW5EcmFnQXV0b1Njcm9sbGluZ1JpZ2h0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmF1dG9zY3JvbGwgdG8gdGhlIHJpZ2h0IGlmIG5lY2Vzc2FyeVxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKiBAcGFyYW0ge2ludGVnZXJ9IHggLSB0aGUgc3RhcnQgcG9zaXRpb25cbiovXG5Db2x1bW5Nb3ZpbmcucHJvdG90eXBlLmNoZWNrQXV0b1Njcm9sbFRvUmlnaHQgPSBmdW5jdGlvbihncmlkLCB4KSB7XG4gICAgaWYgKHRoaXMuY29sdW1uRHJhZ0F1dG9TY3JvbGxpbmdSaWdodCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY29sdW1uRHJhZ0F1dG9TY3JvbGxpbmdSaWdodCA9IHRydWU7XG4gICAgdGhpcy5fY2hlY2tBdXRvU2Nyb2xsVG9SaWdodChncmlkLCB4KTtcbn07XG5cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuX2NoZWNrQXV0b1Njcm9sbFRvUmlnaHQgPSBmdW5jdGlvbihncmlkLCB4KSB7XG4gICAgaWYgKCF0aGlzLmNvbHVtbkRyYWdBdXRvU2Nyb2xsaW5nUmlnaHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgc2Nyb2xsTGVmdCA9IGdyaWQuZ2V0SFNjcm9sbFZhbHVlKCk7XG4gICAgaWYgKCFncmlkLmRyYWdnaW5nIHx8IHNjcm9sbExlZnQgPiAoZ3JpZC5zYkhTY3JvbGxDb25maWcucmFuZ2VTdG9wIC0gMikpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZHJhZ2dlZEluZGV4ID0gZ3JpZC5yZW5kZXJPdmVycmlkZXNDYWNoZS5kcmFnZ2VyLmNvbHVtbkluZGV4O1xuICAgIGdyaWQuc2Nyb2xsQnkoMSwgMCk7XG4gICAgdmFyIG5ld0luZGV4ID0gZHJhZ2dlZEluZGV4ICsgMTtcbiAgICBjb25zb2xlLmxvZyhuZXdJbmRleCwgZHJhZ2dlZEluZGV4KTtcbiAgICBncmlkLnN3YXBDb2x1bW5zKG5ld0luZGV4LCBkcmFnZ2VkSW5kZXgpO1xuICAgIGdyaWQucmVuZGVyT3ZlcnJpZGVzQ2FjaGUuZHJhZ2dlci5jb2x1bW5JbmRleCA9IG5ld0luZGV4O1xuXG4gICAgc2V0VGltZW91dCh0aGlzLl9jaGVja0F1dG9TY3JvbGxUb1JpZ2h0LmJpbmQodGhpcywgZ3JpZCwgeCksIDI1MCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmF1dG9zY3JvbGwgdG8gdGhlIGxlZnQgaWYgbmVjZXNzYXJ5XG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7aW50ZWdlcn0geCAtIHRoZSBzdGFydCBwb3NpdGlvblxuKi9cbkNvbHVtbk1vdmluZy5wcm90b3R5cGUuY2hlY2tBdXRvU2Nyb2xsVG9MZWZ0ID0gZnVuY3Rpb24oZ3JpZCwgeCkge1xuICAgIGlmICh0aGlzLmNvbHVtbkRyYWdBdXRvU2Nyb2xsaW5nTGVmdCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY29sdW1uRHJhZ0F1dG9TY3JvbGxpbmdMZWZ0ID0gdHJ1ZTtcbiAgICB0aGlzLl9jaGVja0F1dG9TY3JvbGxUb0xlZnQoZ3JpZCwgeCk7XG59O1xuXG5Db2x1bW5Nb3ZpbmcucHJvdG90eXBlLl9jaGVja0F1dG9TY3JvbGxUb0xlZnQgPSBmdW5jdGlvbihncmlkLCB4KSB7XG4gICAgaWYgKCF0aGlzLmNvbHVtbkRyYWdBdXRvU2Nyb2xsaW5nTGVmdCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNjcm9sbExlZnQgPSBncmlkLmdldEhTY3JvbGxWYWx1ZSgpO1xuICAgIGlmICghZ3JpZC5kcmFnZ2luZyB8fCBzY3JvbGxMZWZ0IDwgMSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBkcmFnZ2VkSW5kZXggPSBncmlkLnJlbmRlck92ZXJyaWRlc0NhY2hlLmRyYWdnZXIuY29sdW1uSW5kZXg7XG4gICAgZ3JpZC5zd2FwQ29sdW1ucyhkcmFnZ2VkSW5kZXggKyBzY3JvbGxMZWZ0LCBkcmFnZ2VkSW5kZXggKyBzY3JvbGxMZWZ0IC0gMSk7XG4gICAgZ3JpZC5zY3JvbGxCeSgtMSwgMCk7XG4gICAgc2V0VGltZW91dCh0aGlzLl9jaGVja0F1dG9TY3JvbGxUb0xlZnQuYmluZCh0aGlzLCBncmlkLCB4KSwgMjUwKTtcbn07XG5cblxuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmEgY29sdW1uIGRyYWcgaGFzIGNvbXBsZXRlZCwgdXBkYXRlIGRhdGEgYW5kIGNsZWFudXBcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiovXG5Db2x1bW5Nb3ZpbmcucHJvdG90eXBlLmVuZERyYWdDb2x1bW4gPSBmdW5jdGlvbihncmlkKSB7XG5cbiAgICB2YXIgZml4ZWRDb2x1bW5Db3VudCA9IGdyaWQuZ2V0Rml4ZWRDb2x1bW5Db3VudCgpO1xuICAgIHZhciBzY3JvbGxMZWZ0ID0gZ3JpZC5nZXRIU2Nyb2xsVmFsdWUoKTtcblxuICAgIHZhciBjb2x1bW5JbmRleCA9IGdyaWQucmVuZGVyT3ZlcnJpZGVzQ2FjaGUuZHJhZ2dlci5jb2x1bW5JbmRleDtcblxuICAgIGlmIChjb2x1bW5JbmRleCA8IGZpeGVkQ29sdW1uQ291bnQpIHtcbiAgICAgICAgc2Nyb2xsTGVmdCA9IDA7XG4gICAgfVxuXG4gICAgdmFyIHJlbmRlcmVyID0gZ3JpZC5nZXRSZW5kZXJlcigpO1xuICAgIHZhciBjb2x1bW5FZGdlcyA9IHJlbmRlcmVyLmdldENvbHVtbkVkZ2VzKCk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBzdGFydFggPSBjb2x1bW5FZGdlc1tjb2x1bW5JbmRleCAtIHNjcm9sbExlZnRdO1xuICAgIHZhciBkID0gZHJhZ2dlcjtcblxuICAgIHNlbGYuc2V0Q3Jvc3NCcm93c2VyUHJvcGVydHkoZCwgJ3RyYW5zaXRpb24nLCAoc2VsZi5pc1dlYmtpdCA/ICctd2Via2l0LScgOiAnJykgKyAndHJhbnNmb3JtICcgKyBjb2x1bW5BbmltYXRpb25UaW1lICsgJ21zIGVhc2UsIGJveC1zaGFkb3cgJyArIGNvbHVtbkFuaW1hdGlvblRpbWUgKyAnbXMgZWFzZScpO1xuICAgIHNlbGYuc2V0Q3Jvc3NCcm93c2VyUHJvcGVydHkoZCwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHN0YXJ0WCArICdweCwgJyArIC0xICsgJ3B4KScpO1xuICAgIGQuc3R5bGUuYm94U2hhZG93ID0gJzBweCAwcHggMHB4ICM4ODg4ODgnO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgZ3JpZC5yZW5kZXJPdmVycmlkZXNDYWNoZS5kcmFnZ2VyID0gbnVsbDtcbiAgICAgICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIGdyaWQuZW5kRHJhZ0NvbHVtbk5vdGlmaWNhdGlvbigpO1xuICAgICAgICB9KTtcbiAgICB9LCBjb2x1bW5BbmltYXRpb25UaW1lICsgNTApO1xuXG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Db2x1bW5Nb3ZpbmcucHJvdG90eXBlLmlzSGVhZGVyUm93ID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICB2YXIgZ3JpZENlbGwgPSBldmVudC52aWV3UG9pbnQ7XG4gICAgdmFyIGlzRml4ZWQgPSBncmlkQ2VsbC55ID09PSAwO1xuICAgIHJldHVybiBpc0ZpeGVkO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5Nb3Zpbmc7XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqXG4gKiBAbW9kdWxlIGZlYXR1cmVzXFxiYXNlXG4gKiBAZGVzY3JpcHRpb25cbiBpbnN0YW5jZXMgb2YgZmVhdHVyZXMgYXJlIGNvbm5lY3RlZCB0byBvbmUgYW5vdGhlciB0byBtYWtlIGEgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHkgZm9yIGhhbmRsaW5nIGFsbCB0aGUgaW5wdXQgdG8gdGhlIGh5cGVyZ3JpZC5cbiAqXG4gKi9cblxudmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UuanMnKTtcblxuZnVuY3Rpb24gQ29sdW1uUmVzaXppbmcoKSB7XG4gICAgQmFzZS5jYWxsKHRoaXMpO1xuICAgIHRoaXMuYWxpYXMgPSAnQ29sdW1uUmVzaXppbmcnO1xufTtcblxuQ29sdW1uUmVzaXppbmcucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlLnByb3RvdHlwZSk7XG5cbi8qKlxuICogQHByb3BlcnR5IHtpbnRlZ2VyfSBkcmFnSW5kZXggLSB0aGUgaW5kZXggb2YgdGhlIGNvbHVtbiB3YWxsIHdlcmUgY3VycmVudGx5IGRyYWdnaW5nXG4gKiBAaW5zdGFuY2VcbiAqL1xuQ29sdW1uUmVzaXppbmcucHJvdG90eXBlLmRyYWdJbmRleCA9IC0yO1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7aW50ZWdlcn0gZHJhZ1N0YXJ0IC0gdGhlIHBpeGVsIGxvY2F0aW9uIG9mIHRoZSB3aGVyZSB0aGUgZHJhZyB3YXMgaW5pdGlhdGVkXG4gKiBAaW5zdGFuY2VcbiAqL1xuQ29sdW1uUmVzaXppbmcucHJvdG90eXBlLmRyYWdTdGFydCA9IC0xO1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7aW50ZWdlcn0gZHJhZ0luZGV4U3RhcnRpbmdTaXplIC0gdGhlIHN0YXJ0aW5nIHdpZHRoL2hlaWdodCBvZiB0aGUgcm93L2NvbHVtbiB3ZSBhcmUgZHJhZ2dpbmdcbiAqIEBpbnN0YW5jZVxuICovXG5Db2x1bW5SZXNpemluZy5wcm90b3R5cGUuZHJhZ0luZGV4U3RhcnRpbmdTaXplID0gLTE7XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuZ2V0IHRoZSBtb3VzZSB4LHkgY29vcmRpbmF0ZVxuKiAjIyMjIHJldHVybnM6IGludGVnZXJcbiogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIHRoZSBtb3VzZSBldmVudCB0byBxdWVyeVxuKi9cbkNvbHVtblJlc2l6aW5nLnByb3RvdHlwZS5nZXRNb3VzZVZhbHVlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICByZXR1cm4gZXZlbnQucHJpbWl0aXZlRXZlbnQuZGV0YWlsLm1vdXNlLng7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmdldCB0aGUgZ3JpZCBjZWxsIHgseSBjb29yZGluYXRlXG4qICMjIyMgcmV0dXJuczogaW50ZWdlclxuKiBAcGFyYW0ge3JlY3RhbmdsZS5wb2ludH0gZ3JpZENlbGwgLSBbcmVjdGFuZ2xlLnBvaW50XShodHRwczovL2dpdGh1Yi5jb20vc3RldmV3aXJ0cy9maW4tcmVjdGFuZ2xlKVxuKi9cbkNvbHVtblJlc2l6aW5nLnByb3RvdHlwZS5nZXRHcmlkQ2VsbFZhbHVlID0gZnVuY3Rpb24oZ3JpZENlbGwpIHtcbiAgICByZXR1cm4gZ3JpZENlbGwueTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSBncmlkcyB4LHkgc2Nyb2xsIHZhbHVlXG4qICMjIyMgcmV0dXJuczogaW50ZWdlclxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKi9cbkNvbHVtblJlc2l6aW5nLnByb3RvdHlwZS5nZXRTY3JvbGxWYWx1ZSA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICByZXR1cm4gZ3JpZC5nZXRIU2Nyb2xsVmFsdWUoKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSB3aWR0aC9oZWlnaHQgb2YgdGhlIHJvdy9jb2x1bW4gb2YgaW50ZXJlc3RcbiogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7aW50ZWdlcn0gaW5kZXggLSB0aGUgcm93L2NvbHVtbiBpbmRleCBvZiBpbnRlcmVzdFxuKi9cbkNvbHVtblJlc2l6aW5nLnByb3RvdHlwZS5nZXRBcmVhU2l6ZSA9IGZ1bmN0aW9uKGdyaWQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGdyaWQuZ2V0Q29sdW1uV2lkdGgoaW5kZXgpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5zZXQgdGhlIHdpZHRoL2hlaWdodCBvZiB0aGUgcm93L2NvbHVtbiBhdCBpbmRleFxuKiAjIyMjIHJldHVybnM6IGludGVnZXJcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiogQHBhcmFtIHtpbnRlZ2VyfSBpbmRleCAtIHRoZSByb3cvY29sdW1uIGluZGV4IG9mIGludGVyZXN0XG4qIEBwYXJhbSB7aW50ZWdlcn0gdmFsdWUgLSB0aGUgd2lkdGgvaGVpZ2h0IHRvIHNldCB0b1xuKi9cbkNvbHVtblJlc2l6aW5nLnByb3RvdHlwZS5zZXRBcmVhU2l6ZSA9IGZ1bmN0aW9uKGdyaWQsIGluZGV4LCB2YWx1ZSkge1xuICAgIGdyaWQuc2V0Q29sdW1uV2lkdGgoaW5kZXgsIHZhbHVlKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSByZWNlbnRseSByZW5kZXJlZCBhcmVhJ3Mgd2lkdGgvaGVpZ2h0XG4qICMjIyMgcmV0dXJuczogaW50ZWdlclxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKiBAcGFyYW0ge2ludGVnZXJ9IGluZGV4IC0gdGhlIHJvdy9jb2x1bW4gaW5kZXggb2YgaW50ZXJlc3RcbiovXG5Db2x1bW5SZXNpemluZy5wcm90b3R5cGUuZ2V0UHJldmlvdXNBYnNvbHV0ZVNpemUgPSBmdW5jdGlvbihncmlkLCBpbmRleCkge1xuICAgIHJldHVybiBncmlkLmdldFJlbmRlcmVkV2lkdGgoaW5kZXgpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5yZXR1cm5zIHRoZSBpbmRleCBvZiB3aGljaCBkaXZpZGVyIEknbSBvdmVyXG4qICMjIyMgcmV0dXJuczogaW50ZWdlclxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNvbHVtblJlc2l6aW5nLnByb3RvdHlwZS5vdmVyQXJlYURpdmlkZXIgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIHJldHVybiBncmlkLm92ZXJDb2x1bW5EaXZpZGVyKGV2ZW50KTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuYW0gSSBvdmVyIHRoZSBjb2x1bW4vcm93IGFyZWFcbiogIyMjIyByZXR1cm5zOiBib29sZWFuXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ29sdW1uUmVzaXppbmcucHJvdG90eXBlLmlzRmlyc3RGaXhlZE90aGVyQXJlYSA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgcmV0dXJuIHRoaXMuaXNGaXJzdEZpeGVkUm93KGdyaWQsIGV2ZW50KTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSBjdXJzb3IgbmFtZVxuKiAjIyMjIHJldHVybnM6IHN0cmluZ1xuKi9cbkNvbHVtblJlc2l6aW5nLnByb3RvdHlwZS5nZXRDdXJzb3JOYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICdjb2wtcmVzaXplJztcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuaGFuZGxlIHRoaXMgZXZlbnRcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Db2x1bW5SZXNpemluZy5wcm90b3R5cGUuaGFuZGxlTW91c2VEcmFnID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICBpZiAodGhpcy5kcmFnSW5kZXggPiAtMikge1xuICAgICAgICAvL3ZhciBmaXhlZEFyZWFDb3VudCA9IHRoaXMuZ2V0Rml4ZWRBcmVhQ291bnQoZ3JpZCk7XG4gICAgICAgIC8vdmFyIG9mZnNldCA9IHRoaXMuZ2V0Rml4ZWRBcmVhU2l6ZShncmlkLCBmaXhlZEFyZWFDb3VudCArIGFyZWFJbmRleCk7XG4gICAgICAgIHZhciBtb3VzZSA9IHRoaXMuZ2V0TW91c2VWYWx1ZShldmVudCk7XG4gICAgICAgIHZhciBzY3JvbGxWYWx1ZSA9IHRoaXMuZ2V0U2Nyb2xsVmFsdWUoZ3JpZCk7XG4gICAgICAgIGlmICh0aGlzLmRyYWdJbmRleCA8IHRoaXMuZ2V0Rml4ZWRBcmVhQ291bnQoZ3JpZCkpIHtcbiAgICAgICAgICAgIHNjcm9sbFZhbHVlID0gMDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHJldmlvdXMgPSB0aGlzLmdldFByZXZpb3VzQWJzb2x1dGVTaXplKGdyaWQsIHRoaXMuZHJhZ0luZGV4IC0gc2Nyb2xsVmFsdWUpO1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBtb3VzZSAtIHByZXZpb3VzO1xuICAgICAgICB0aGlzLnNldEFyZWFTaXplKGdyaWQsIHRoaXMuZHJhZ0luZGV4LCBkaXN0YW5jZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0LmhhbmRsZU1vdXNlRHJhZyhncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5nZXQgdGhlIHdpZHRoL2hlaWdodCBvZiBhIHNwZWNpZmljIHJvdy9jb2x1bW5cbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiogQHBhcmFtIHtpbnRlZ2VyfSBhcmVhSW5kZXggLSB0aGUgcm93L2NvbHVtbiBpbmRleCBvZiBpbnRlcmVzdFxuKi9cbkNvbHVtblJlc2l6aW5nLnByb3RvdHlwZS5nZXRTaXplID0gZnVuY3Rpb24oZ3JpZCwgYXJlYUluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXJlYVNpemUoZ3JpZCwgYXJlYUluZGV4KTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSBmaXhlZCBhcmVhIHJvd3MvY29sdW1ucyBjb3VudFxuKiAjIyMjIHJldHVybnM6IGludGVnZXJcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiovXG5Db2x1bW5SZXNpemluZy5wcm90b3R5cGUuZ2V0T3RoZXJGaXhlZEFyZWFDb3VudCA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICByZXR1cm4gZ3JpZC5nZXRGaXhlZFJvd0NvdW50KCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Db2x1bW5SZXNpemluZy5wcm90b3R5cGUuaGFuZGxlTW91c2VEb3duID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICB2YXIgaXNFbmFibGVkID0gdGhpcy5pc0VuYWJsZWQoZ3JpZCk7XG4gICAgdmFyIG92ZXJBcmVhID0gdGhpcy5vdmVyQXJlYURpdmlkZXIoZ3JpZCwgZXZlbnQpO1xuICAgIGlmIChpc0VuYWJsZWQgJiYgb3ZlckFyZWEgPiAtMSAmJiB0aGlzLmlzRmlyc3RGaXhlZE90aGVyQXJlYShncmlkLCBldmVudCkpIHtcbiAgICAgICAgdmFyIHNjcm9sbFZhbHVlID0gdGhpcy5nZXRTY3JvbGxWYWx1ZShncmlkKTtcbiAgICAgICAgaWYgKG92ZXJBcmVhIDwgdGhpcy5nZXRGaXhlZEFyZWFDb3VudChncmlkKSkge1xuICAgICAgICAgICAgc2Nyb2xsVmFsdWUgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZHJhZ0luZGV4ID0gb3ZlckFyZWEgLSAxICsgc2Nyb2xsVmFsdWU7XG4gICAgICAgIHRoaXMuZHJhZ1N0YXJ0ID0gdGhpcy5nZXRNb3VzZVZhbHVlKGV2ZW50KTtcbiAgICAgICAgdGhpcy5kcmFnSW5kZXhTdGFydGluZ1NpemUgPSAwO1xuICAgICAgICB0aGlzLmRldGFjaENoYWluKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0LmhhbmRsZU1vdXNlRG93bihncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ29sdW1uUmVzaXppbmcucHJvdG90eXBlLmhhbmRsZU1vdXNlVXAgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIHZhciBpc0VuYWJsZWQgPSB0aGlzLmlzRW5hYmxlZChncmlkKTtcbiAgICBpZiAoaXNFbmFibGVkICYmIHRoaXMuZHJhZ0luZGV4ID4gLTIpIHtcbiAgICAgICAgdGhpcy5jdXJzb3IgPSBudWxsO1xuICAgICAgICB0aGlzLmRyYWdJbmRleCA9IC0yO1xuXG4gICAgICAgIGV2ZW50LnByaW1pdGl2ZUV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAvL2RlbGF5IGhlcmUgdG8gZ2l2ZSBvdGhlciBldmVudHMgYSBjaGFuY2UgdG8gYmUgZHJvcHBlZFxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGdyaWQuc3luY2hyb25pemVTY3JvbGxpbmdCb3VuZHJpZXMoKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuYXR0YWNoQ2hhaW4oKTtcbiAgICAgICAgfSwgMjAwKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VVcChncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5oYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ29sdW1uUmVzaXppbmcucHJvdG90eXBlLmhhbmRsZU1vdXNlTW92ZSA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgaWYgKHRoaXMuZHJhZ0luZGV4ID4gLTIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmN1cnNvciA9IG51bGw7XG4gICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VNb3ZlKGdyaWQsIGV2ZW50KTtcbiAgICB9XG4gICAgdGhpcy5jaGVja0ZvckFyZWFSZXNpemVDdXJzb3JDaGFuZ2UoZ3JpZCwgZXZlbnQpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5maWxsIHRoaXMgaW5cbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Db2x1bW5SZXNpemluZy5wcm90b3R5cGUuY2hlY2tGb3JBcmVhUmVzaXplQ3Vyc29yQ2hhbmdlID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICB2YXIgaXNFbmFibGVkID0gdGhpcy5pc0VuYWJsZWQoZ3JpZCk7XG4gICAgaWYgKGlzRW5hYmxlZCAmJiB0aGlzLm92ZXJBcmVhRGl2aWRlcihncmlkLCBldmVudCkgPiAtMSAmJiB0aGlzLmlzRmlyc3RGaXhlZE90aGVyQXJlYShncmlkLCBldmVudCkpIHtcbiAgICAgICAgdGhpcy5jdXJzb3IgPSB0aGlzLmdldEN1cnNvck5hbWUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmN1cnNvciA9IG51bGw7XG4gICAgfVxuXG59O1xuXG5Db2x1bW5SZXNpemluZy5wcm90b3R5cGUuZ2V0Rml4ZWRBcmVhQ291bnQgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgdmFyIGNvdW50ID0gZ3JpZC5nZXRGaXhlZENvbHVtbkNvdW50KCkgKyAoZ3JpZC5pc1Nob3dSb3dOdW1iZXJzKCkgPyAxIDogMCkgKyAoZ3JpZC5oYXNIaWVyYXJjaHlDb2x1bW4oKSA/IDEgOiAwKTtcbiAgICByZXR1cm4gY291bnQ7XG59O1xuXG5Db2x1bW5SZXNpemluZy5wcm90b3R5cGUuaGFuZGxlRG91YmxlQ2xpY2sgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIHZhciBpc0VuYWJsZWQgPSB0aGlzLmlzRW5hYmxlZChncmlkKTtcbiAgICB2YXIgaGFzQ3Vyc29yID0gdGhpcy5vdmVyQXJlYURpdmlkZXIoZ3JpZCwgZXZlbnQpID4gLTE7IC8vdGhpcy5jdXJzb3IgIT09IG51bGw7XG4gICAgdmFyIGhlYWRlclJvd0NvdW50ID0gZ3JpZC5nZXRIZWFkZXJSb3dDb3VudCgpO1xuICAgIC8vdmFyIGhlYWRlckNvbENvdW50ID0gZ3JpZC5nZXRIZWFkZXJDb2x1bW5Db3VudCgpO1xuICAgIHZhciBncmlkQ2VsbCA9IGV2ZW50LmdyaWRDZWxsO1xuICAgIGlmIChpc0VuYWJsZWQgJiYgaGFzQ3Vyc29yICYmIChncmlkQ2VsbC55IDw9IGhlYWRlclJvd0NvdW50KSkge1xuICAgICAgICBncmlkLmF1dG9zaXplQ29sdW1uKGdyaWRDZWxsLnggLSAxKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlRG91YmxlQ2xpY2soZ3JpZCwgZXZlbnQpO1xuICAgIH1cbn07XG5Db2x1bW5SZXNpemluZy5wcm90b3R5cGUuaXNFbmFibGVkID0gZnVuY3Rpb24oIC8qIGdyaWQgKi8gKSB7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQ29sdW1uUmVzaXppbmc7XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqXG4gKiBAbW9kdWxlIGZlYXR1cmVzXFxiYXNlXG4gKiBAZGVzY3JpcHRpb25cbiBpbnN0YW5jZXMgb2YgZmVhdHVyZXMgYXJlIGNvbm5lY3RlZCB0byBvbmUgYW5vdGhlciB0byBtYWtlIGEgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHkgZm9yIGhhbmRsaW5nIGFsbCB0aGUgaW5wdXQgdG8gdGhlIGh5cGVyZ3JpZC5cbiAqXG4gKi9cblxudmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UuanMnKTtcblxuZnVuY3Rpb24gQ29sdW1uU2VsZWN0aW9uKCkge1xuICAgIEJhc2UuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmFsaWFzID0gJ0NvbHVtblNlbGVjdGlvbic7XG59O1xuXG5Db2x1bW5TZWxlY3Rpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlLnByb3RvdHlwZSk7XG5cbi8qKlxuICogQHByb3BlcnR5IHtmaW4tcmVjdGFuZ2xlLnBvaW50fSBjdXJyZW50RHJhZyAtIGN1cnJlbnREcmFnIGlzIHRoZSBwaXhlbCBsb2NhdGlvbiBvZiB0aGUgbW91c2UgcG9pbnRlciBkdXJpbmcgYSBkcmFnIG9wZXJhdGlvblxuICogQGluc3RhbmNlXG4gKi9cbkNvbHVtblNlbGVjdGlvbi5wcm90b3R5cGUuY3VycmVudERyYWcgPSBudWxsLFxuXG4vKipcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBsYXN0RHJhZ0NlbGwgLSBsYXN0RHJhZ0NlbGwgaXMgdGhlIGNlbGwgY29vcmRpbmF0ZXMgb2YgdGhlIHdoZXJlIHRoZSBtb3VzZSBwb2ludGVyIGlzIGR1cmluZyBhIGRyYWcgb3BlcmF0aW9uXG4gKiBAaW5zdGFuY2VcbiAqL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5sYXN0RHJhZ0NlbGwgPSBudWxsLFxuXG4vKipcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBzYkxhc3RBdXRvIC0gc2JMYXN0QXV0byBpcyBhIG1pbGxpc2Vjb25kIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgcHJldmlvdXMgdGltZSBhbiBhdXRvc2Nyb2xsIHN0YXJ0ZWRcbiAqIEBpbnN0YW5jZVxuICovXG5Db2x1bW5TZWxlY3Rpb24ucHJvdG90eXBlLnNiTGFzdEF1dG8gPSAwLFxuXG4vKipcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBzYkF1dG9TdGFydCAtIHNiQXV0b1N0YXJ0IGlzIGEgbWlsbGlzZWNvbmQgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSB0aW1lIHRoZSBjdXJyZW50IGF1dG9zY3JvbGwgc3RhcnRlZFxuICogQGluc3RhbmNlXG4gKi9cbkNvbHVtblNlbGVjdGlvbi5wcm90b3R5cGUuc2JBdXRvU3RhcnQgPSAwLFxuXG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50IGRvd24gdGhlIGZlYXR1cmUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNvbHVtblNlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlTW91c2VVcCA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgaWYgKHRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgICAgdGhpcy5kcmFnZ2luZyA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5oYW5kbGVNb3VzZVVwKGdyaWQsIGV2ZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50IGRvd24gdGhlIGZlYXR1cmUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNvbHVtblNlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlTW91c2VEb3duID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcblxuICAgIGlmICgoIWdyaWQuaXNDb2x1bW5TZWxlY3Rpb24oKSB8fCBldmVudC5tb3VzZVBvaW50LnkgPCA1KSAmJiB0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0LmhhbmRsZU1vdXNlRG93bihncmlkLCBldmVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaXNSaWdodENsaWNrID0gZXZlbnQucHJpbWl0aXZlRXZlbnQuZGV0YWlsLmlzUmlnaHRDbGljaztcbiAgICB2YXIgY2VsbCA9IGV2ZW50LmdyaWRDZWxsO1xuICAgIHZhciB2aWV3Q2VsbCA9IGV2ZW50LnZpZXdQb2ludDtcbiAgICB2YXIgZHggPSBjZWxsLng7XG4gICAgdmFyIGR5ID0gY2VsbC55O1xuXG4gICAgdmFyIGlzSGVhZGVyID0gZ3JpZC5pc1Nob3dIZWFkZXJSb3coKSAmJiBkeSA9PT0gMCAmJiBkeCAhPT0gLTE7XG5cbiAgICBpZiAoaXNSaWdodENsaWNrIHx8ICFpc0hlYWRlcikge1xuICAgICAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VEb3duKGdyaWQsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdmFyIG51bUZpeGVkQ29sdW1ucyA9IGdyaWQuZ2V0Rml4ZWRDb2x1bW5Db3VudCgpO1xuXG4gICAgICAgIC8vaWYgd2UgYXJlIGluIHRoZSBmaXhlZCBhcmVhIGRvIG5vdCBhcHBseSB0aGUgc2Nyb2xsIHZhbHVlc1xuICAgICAgICAvL2NoZWNrIGJvdGggeCBhbmQgeSB2YWx1ZXMgaW5kZXBlbmRlbnRseVxuICAgICAgICBpZiAodmlld0NlbGwueCA8IG51bUZpeGVkQ29sdW1ucykge1xuICAgICAgICAgICAgZHggPSB2aWV3Q2VsbC54O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRDZWxsID0gZ3JpZC5yZWN0YW5nbGVzLnBvaW50LmNyZWF0ZShkeCwgMCk7XG5cbiAgICAgICAgdmFyIHByaW1FdmVudCA9IGV2ZW50LnByaW1pdGl2ZUV2ZW50O1xuICAgICAgICB2YXIga2V5cyA9IHByaW1FdmVudC5kZXRhaWwua2V5cztcbiAgICAgICAgdGhpcy5kcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIHRoaXMuZXh0ZW5kU2VsZWN0aW9uKGdyaWQsIGRDZWxsLCBrZXlzKTtcbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Db2x1bW5TZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZU1vdXNlRHJhZyA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG5cbiAgICBpZiAoKCFncmlkLmlzQ29sdW1uU2VsZWN0aW9uKCkgfHwgdGhpcy5pc0NvbHVtbkRyYWdnaW5nKGdyaWQpKSAmJiB0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0LmhhbmRsZU1vdXNlRHJhZyhncmlkLCBldmVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaXNSaWdodENsaWNrID0gZXZlbnQucHJpbWl0aXZlRXZlbnQuZGV0YWlsLmlzUmlnaHRDbGljaztcblxuICAgIGlmIChpc1JpZ2h0Q2xpY2sgfHwgIXRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICAgICAgdGhpcy5uZXh0LmhhbmRsZU1vdXNlRHJhZyhncmlkLCBldmVudCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIHZhciBudW1GaXhlZENvbHVtbnMgPSBncmlkLmdldEZpeGVkQ29sdW1uQ291bnQoKTtcblxuICAgICAgICB2YXIgY2VsbCA9IGV2ZW50LmdyaWRDZWxsO1xuICAgICAgICB2YXIgdmlld0NlbGwgPSBldmVudC52aWV3UG9pbnQ7XG4gICAgICAgIHZhciBkeCA9IGNlbGwueDtcbiAgICAgICAgdmFyIGR5ID0gY2VsbC55O1xuXG4gICAgICAgIC8vaWYgd2UgYXJlIGluIHRoZSBmaXhlZCBhcmVhIGRvIG5vdCBhcHBseSB0aGUgc2Nyb2xsIHZhbHVlc1xuICAgICAgICAvL2NoZWNrIGJvdGggeCBhbmQgeSB2YWx1ZXMgaW5kZXBlbmRlbnRseVxuICAgICAgICBpZiAodmlld0NlbGwueCA8IG51bUZpeGVkQ29sdW1ucykge1xuICAgICAgICAgICAgZHggPSB2aWV3Q2VsbC54O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRDZWxsID0gZ3JpZC5yZWN0YW5nbGVzLnBvaW50LmNyZWF0ZShkeCwgZHkpO1xuXG4gICAgICAgIHZhciBwcmltRXZlbnQgPSBldmVudC5wcmltaXRpdmVFdmVudDtcbiAgICAgICAgdGhpcy5jdXJyZW50RHJhZyA9IHByaW1FdmVudC5kZXRhaWwubW91c2U7XG4gICAgICAgIHRoaXMubGFzdERyYWdDZWxsID0gZENlbGw7XG5cbiAgICAgICAgdGhpcy5jaGVja0RyYWdTY3JvbGwoZ3JpZCwgdGhpcy5jdXJyZW50RHJhZyk7XG4gICAgICAgIHRoaXMuaGFuZGxlTW91c2VEcmFnQ2VsbFNlbGVjdGlvbihncmlkLCBkQ2VsbCwgcHJpbUV2ZW50LmRldGFpbC5rZXlzKTtcbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Db2x1bW5TZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZUtleURvd24gPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIGlmIChncmlkLmdldExhc3RTZWxlY3Rpb25UeXBlKCkgIT09ICdjb2x1bW4nKSB7XG4gICAgICAgIGlmICh0aGlzLm5leHQpIHtcbiAgICAgICAgICAgIHRoaXMubmV4dC5oYW5kbGVLZXlEb3duKGdyaWQsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBjb21tYW5kID0gJ2hhbmRsZScgKyBldmVudC5kZXRhaWwuY2hhcjtcbiAgICBpZiAodGhpc1tjb21tYW5kXSkge1xuICAgICAgICB0aGlzW2NvbW1hbmRdLmNhbGwodGhpcywgZ3JpZCwgZXZlbnQuZGV0YWlsKTtcbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbkhhbmRsZSBhIG1vdXNlZHJhZyBzZWxlY3Rpb25cbiogIyMjIyByZXR1cm5zOiB0eXBlXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7T2JqZWN0fSBtb3VzZSAtIHRoZSBldmVudCBkZXRhaWxzXG4qIEBwYXJhbSB7QXJyYXl9IGtleXMgLSBhcnJheSBvZiB0aGUga2V5cyB0aGF0IGFyZSBjdXJyZW50bHkgcHJlc3NlZCBkb3duXG4qL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVNb3VzZURyYWdDZWxsU2VsZWN0aW9uID0gZnVuY3Rpb24oZ3JpZCwgZ3JpZENlbGwgLyogLGtleXMgKi8gKSB7XG5cbiAgICAvL3ZhciBiZWhhdmlvciA9IGdyaWQuZ2V0QmVoYXZpb3IoKTtcbiAgICB2YXIgeCA9IGdyaWRDZWxsLng7XG4gICAgLy8gICAgICAgICAgICB2YXIgcHJldmlvdXNEcmFnRXh0ZW50ID0gZ3JpZC5nZXREcmFnRXh0ZW50KCk7XG4gICAgdmFyIG1vdXNlRG93biA9IGdyaWQuZ2V0TW91c2VEb3duKCk7XG5cbiAgICB2YXIgbmV3WCA9IHggLSBtb3VzZURvd24ueDtcbiAgICAvL3ZhciBuZXdZID0geSAtIG1vdXNlRG93bi55O1xuXG4gICAgLy8gaWYgKHByZXZpb3VzRHJhZ0V4dGVudC54ID09PSBuZXdYICYmIHByZXZpb3VzRHJhZ0V4dGVudC55ID09PSBuZXdZKSB7XG4gICAgLy8gICAgIHJldHVybjtcbiAgICAvLyB9XG5cbiAgICBncmlkLmNsZWFyTW9zdFJlY2VudENvbHVtblNlbGVjdGlvbigpO1xuXG4gICAgZ3JpZC5zZWxlY3RDb2x1bW4obW91c2VEb3duLngsIHgpO1xuICAgIGdyaWQuc2V0RHJhZ0V4dGVudChncmlkLnJlY3RhbmdsZXMucG9pbnQuY3JlYXRlKG5ld1gsIDApKTtcblxuICAgIGdyaWQucmVwYWludCgpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG50aGlzIGNoZWNrcyB3aGlsZSB3ZXJlIGRyYWdnaW5nIGlmIHdlIGdvIG91dHNpZGUgdGhlIHZpc2libGUgYm91bmRzLCBpZiBzbywga2ljayBvZmYgdGhlIGV4dGVybmFsIGF1dG9zY3JvbGwgY2hlY2sgZnVuY3Rpb24gKGFib3ZlKVxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKiBAcGFyYW0ge09iamVjdH0gbW91c2UgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNvbHVtblNlbGVjdGlvbi5wcm90b3R5cGUuY2hlY2tEcmFnU2Nyb2xsID0gZnVuY3Rpb24oZ3JpZCwgbW91c2UpIHtcbiAgICBpZiAoIWdyaWQucmVzb2x2ZVByb3BlcnR5KCdzY3JvbGxpbmdFbmFibGVkJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgYiA9IGdyaWQuZ2V0RGF0YUJvdW5kcygpO1xuICAgIHZhciBpbnNpZGUgPSBiLmNvbnRhaW5zKG1vdXNlKTtcbiAgICBpZiAoaW5zaWRlKSB7XG4gICAgICAgIGlmIChncmlkLmlzU2Nyb2xsaW5nTm93KCkpIHtcbiAgICAgICAgICAgIGdyaWQuc2V0U2Nyb2xsaW5nTm93KGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWdyaWQuaXNTY3JvbGxpbmdOb3coKSkge1xuICAgICAgICBncmlkLnNldFNjcm9sbGluZ05vdyh0cnVlKTtcbiAgICAgICAgdGhpcy5zY3JvbGxEcmFnKGdyaWQpO1xuICAgIH1cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxudGhpcyBmdW5jdGlvbiBtYWtlcyBzdXJlIHRoYXQgd2hpbGUgd2UgYXJlIGRyYWdnaW5nIG91dHNpZGUgb2YgdGhlIGdyaWQgdmlzaWJsZSBib3VuZHMsIHdlIHNyY3JvbGwgYWNjb3JkaW5nbHlcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiovXG5Db2x1bW5TZWxlY3Rpb24ucHJvdG90eXBlLnNjcm9sbERyYWcgPSBmdW5jdGlvbihncmlkKSB7XG5cbiAgICBpZiAoIWdyaWQuaXNTY3JvbGxpbmdOb3coKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGxhc3REcmFnQ2VsbCA9IHRoaXMubGFzdERyYWdDZWxsO1xuICAgIHZhciBiID0gZ3JpZC5nZXREYXRhQm91bmRzKCk7XG4gICAgdmFyIHhPZmZzZXQgPSAwO1xuICAgIHZhciB5T2Zmc2V0ID0gMDtcblxuICAgIHZhciBudW1GaXhlZENvbHVtbnMgPSBncmlkLmdldEZpeGVkQ29sdW1uQ291bnQoKTtcbiAgICB2YXIgbnVtRml4ZWRSb3dzID0gZ3JpZC5nZXRGaXhlZFJvd0NvdW50KCk7XG5cbiAgICB2YXIgZHJhZ0VuZEluRml4ZWRBcmVhWCA9IGxhc3REcmFnQ2VsbC54IDwgbnVtRml4ZWRDb2x1bW5zO1xuICAgIHZhciBkcmFnRW5kSW5GaXhlZEFyZWFZID0gbGFzdERyYWdDZWxsLnkgPCBudW1GaXhlZFJvd3M7XG5cbiAgICBpZiAodGhpcy5jdXJyZW50RHJhZy54IDwgYi5vcmlnaW4ueCkge1xuICAgICAgICB4T2Zmc2V0ID0gLTE7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY3VycmVudERyYWcueCA+IGIub3JpZ2luLnggKyBiLmV4dGVudC54KSB7XG4gICAgICAgIHhPZmZzZXQgPSAxO1xuICAgIH1cblxuICAgIHZhciBkcmFnQ2VsbE9mZnNldFggPSB4T2Zmc2V0O1xuICAgIHZhciBkcmFnQ2VsbE9mZnNldFkgPSB5T2Zmc2V0O1xuXG4gICAgaWYgKGRyYWdFbmRJbkZpeGVkQXJlYVgpIHtcbiAgICAgICAgZHJhZ0NlbGxPZmZzZXRYID0gMDtcbiAgICB9XG5cbiAgICBpZiAoZHJhZ0VuZEluRml4ZWRBcmVhWSkge1xuICAgICAgICBkcmFnQ2VsbE9mZnNldFkgPSAwO1xuICAgIH1cblxuICAgIHRoaXMubGFzdERyYWdDZWxsID0gbGFzdERyYWdDZWxsLnBsdXNYWShkcmFnQ2VsbE9mZnNldFgsIGRyYWdDZWxsT2Zmc2V0WSk7XG4gICAgZ3JpZC5zY3JvbGxCeSh4T2Zmc2V0LCB5T2Zmc2V0KTtcbiAgICB0aGlzLmhhbmRsZU1vdXNlRHJhZ0NlbGxTZWxlY3Rpb24oZ3JpZCwgbGFzdERyYWdDZWxsLCBbXSk7IC8vIHVwZGF0ZSB0aGUgc2VsZWN0aW9uXG4gICAgZ3JpZC5yZXBhaW50KCk7XG4gICAgc2V0VGltZW91dCh0aGlzLnNjcm9sbERyYWcuYmluZCh0aGlzLCBncmlkKSwgMjUpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5leHRlbmQgYSBzZWxlY3Rpb24gb3IgY3JlYXRlIG9uZSBpZiB0aGVyZSBpc250IHlldFxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKiBAcGFyYW0ge09iamVjdH0gZ3JpZENlbGwgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKiBAcGFyYW0ge0FycmF5fSBrZXlzIC0gYXJyYXkgb2YgdGhlIGtleXMgdGhhdCBhcmUgY3VycmVudGx5IHByZXNzZWQgZG93blxuKi9cbkNvbHVtblNlbGVjdGlvbi5wcm90b3R5cGUuZXh0ZW5kU2VsZWN0aW9uID0gZnVuY3Rpb24oZ3JpZCwgZ3JpZENlbGwsIGtleXMpIHtcbiAgICBncmlkLnN0b3BFZGl0aW5nKCk7XG4gICAgLy92YXIgaGFzQ1RSTCA9IGtleXMuaW5kZXhPZignQ1RSTCcpICE9PSAtMTtcbiAgICB2YXIgaGFzU0hJRlQgPSBrZXlzLmluZGV4T2YoJ1NISUZUJykgIT09IC0xO1xuXG4gICAgLy8gdmFyIHNjcm9sbFRvcCA9IGdyaWQuZ2V0VlNjcm9sbFZhbHVlKCk7XG4gICAgLy8gdmFyIHNjcm9sbExlZnQgPSBncmlkLmdldEhTY3JvbGxWYWx1ZSgpO1xuXG4gICAgLy8gdmFyIG51bUZpeGVkQ29sdW1ucyA9IDA7Ly9ncmlkLmdldEZpeGVkQ29sdW1uQ291bnQoKTtcbiAgICAvLyB2YXIgbnVtRml4ZWRSb3dzID0gMDsvL2dyaWQuZ2V0Rml4ZWRSb3dDb3VudCgpO1xuXG4gICAgdmFyIG1vdXNlUG9pbnQgPSBncmlkLmdldE1vdXNlRG93bigpO1xuICAgIHZhciB4ID0gZ3JpZENlbGwueDsgLy8gLSBudW1GaXhlZENvbHVtbnMgKyBzY3JvbGxMZWZ0O1xuICAgIHZhciB5ID0gZ3JpZENlbGwueTsgLy8gLSBudW1GaXhlZFJvd3MgKyBzY3JvbGxUb3A7XG5cbiAgICAvL3dlcmUgb3V0c2lkZSBvZiB0aGUgZ3JpZCBkbyBub3RoaW5nXG4gICAgaWYgKHggPCAwIHx8IHkgPCAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvL3dlIGhhdmUgcmVwZWF0ZWQgYSBjbGljayBpbiB0aGUgc2FtZSBzcG90IGRlc2xlY3QgdGhlIHZhbHVlIGZyb20gbGFzdCB0aW1lXG4gICAgLy8gaWYgKG1vdXNlUG9pbnQgJiYgeCA9PT0gbW91c2VQb2ludC54ICYmIHkgPT09IG1vdXNlUG9pbnQueSkge1xuICAgIC8vICAgICBncmlkLmNsZWFyU2VsZWN0aW9ucygpO1xuICAgIC8vICAgICBncmlkLnBvcE1vdXNlRG93bigpO1xuICAgIC8vICAgICBncmlkLnJlcGFpbnQoKTtcbiAgICAvLyAgICAgcmV0dXJuO1xuICAgIC8vIH1cblxuICAgIC8vIGlmICghaGFzQ1RSTCAmJiAhaGFzU0hJRlQpIHtcbiAgICAvLyAgICAgZ3JpZC5jbGVhclNlbGVjdGlvbnMoKTtcbiAgICAvLyB9XG5cbiAgICBpZiAoaGFzU0hJRlQpIHtcbiAgICAgICAgZ3JpZC5jbGVhck1vc3RSZWNlbnRDb2x1bW5TZWxlY3Rpb24oKTtcbiAgICAgICAgZ3JpZC5zZWxlY3RDb2x1bW4oeCwgbW91c2VQb2ludC54KTtcbiAgICAgICAgZ3JpZC5zZXREcmFnRXh0ZW50KGdyaWQucmVjdGFuZ2xlcy5wb2ludC5jcmVhdGUoeCAtIG1vdXNlUG9pbnQueCwgMCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGdyaWQudG9nZ2xlU2VsZWN0Q29sdW1uKHgsIGtleXMpO1xuICAgICAgICBncmlkLnNldE1vdXNlRG93bihncmlkLnJlY3RhbmdsZXMucG9pbnQuY3JlYXRlKHgsIHkpKTtcbiAgICAgICAgZ3JpZC5zZXREcmFnRXh0ZW50KGdyaWQucmVjdGFuZ2xlcy5wb2ludC5jcmVhdGUoMCwgMCkpO1xuICAgIH1cbiAgICBncmlkLnJlcGFpbnQoKTtcbn07XG5cblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnRcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVET1dOU0hJRlQgPSBmdW5jdGlvbiggLyogZ3JpZCAqLyApIHt9O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudFxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVVUFNISUZUID0gZnVuY3Rpb24oIC8qIGdyaWQgKi8gKSB7fTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnRcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNvbHVtblNlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlTEVGVFNISUZUID0gZnVuY3Rpb24oZ3JpZCkge1xuICAgIHRoaXMubW92ZVNoaWZ0U2VsZWN0KGdyaWQsIC0xKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Db2x1bW5TZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZVJJR0hUU0hJRlQgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgdGhpcy5tb3ZlU2hpZnRTZWxlY3QoZ3JpZCwgMSk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudFxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVET1dOID0gZnVuY3Rpb24oIC8qIGdyaWQgKi8gKSB7XG5cbiAgICAvLyB2YXIgbW91c2VDb3JuZXIgPSBncmlkLmdldE1vdXNlRG93bigpLnBsdXMoZ3JpZC5nZXREcmFnRXh0ZW50KCkpO1xuICAgIC8vIHZhciBtYXhSb3dzID0gZ3JpZC5nZXRSb3dDb3VudCgpIC0gMTtcblxuICAgIC8vIHZhciBuZXdYID0gbW91c2VDb3JuZXIueDtcbiAgICAvLyB2YXIgbmV3WSA9IGdyaWQuZ2V0SGVhZGVyUm93Q291bnQoKSArIGdyaWQuZ2V0VlNjcm9sbFZhbHVlKCk7XG5cbiAgICAvLyBuZXdZID0gTWF0aC5taW4obWF4Um93cywgbmV3WSk7XG5cbiAgICAvLyBncmlkLmNsZWFyU2VsZWN0aW9ucygpO1xuICAgIC8vIGdyaWQuc2VsZWN0KG5ld1gsIG5ld1ksIDAsIDApO1xuICAgIC8vIGdyaWQuc2V0TW91c2VEb3duKGdyaWQucmVjdGFuZ2xlcy5wb2ludC5jcmVhdGUobmV3WCwgbmV3WSkpO1xuICAgIC8vIGdyaWQuc2V0RHJhZ0V4dGVudChncmlkLnJlY3RhbmdsZXMucG9pbnQuY3JlYXRlKDAsIDApKTtcblxuICAgIC8vIGdyaWQucmVwYWludCgpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnRcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cbkNvbHVtblNlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlVVAgPSBmdW5jdGlvbiggLyogZ3JpZCAqLyApIHt9O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudFxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVMRUZUID0gZnVuY3Rpb24oZ3JpZCkge1xuICAgIHRoaXMubW92ZVNpbmdsZVNlbGVjdChncmlkLCAtMSk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudFxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVSSUdIVCA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICB0aGlzLm1vdmVTaW5nbGVTZWxlY3QoZ3JpZCwgMSk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbklmIHdlIGFyZSBob2xkaW5nIGRvd24gdGhlIHNhbWUgbmF2aWdhdGlvbiBrZXksIGFjY2VsZXJhdGUgdGhlIGluY3JlbWVudCB3ZSBzY3JvbGxcbiogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4qL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5nZXRBdXRvU2Nyb2xsQWNjZWxlcmF0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvdW50ID0gMTtcbiAgICB2YXIgZWxhcHNlZCA9IHRoaXMuZ2V0QXV0b1Njcm9sbER1cmF0aW9uKCkgLyAyMDAwO1xuICAgIGNvdW50ID0gTWF0aC5tYXgoMSwgTWF0aC5mbG9vcihlbGFwc2VkICogZWxhcHNlZCAqIGVsYXBzZWQgKiBlbGFwc2VkKSk7XG4gICAgcmV0dXJuIGNvdW50O1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5zZXQgdGhlIHN0YXJ0IHRpbWUgdG8gcmlnaHQgbm93IHdoZW4gd2UgaW5pdGlhdGUgYW4gYXV0byBzY3JvbGxcbiovXG5Db2x1bW5TZWxlY3Rpb24ucHJvdG90eXBlLnNldEF1dG9TY3JvbGxTdGFydFRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNiQXV0b1N0YXJ0ID0gRGF0ZS5ub3coKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxudXBkYXRlIHRoZSBhdXRvc2Nyb2xsIHN0YXJ0IHRpbWUgaWYgd2UgaGF2ZW4ndCBhdXRvc2Nyb2xsZWQgd2l0aGluIHRoZSBsYXN0IDUwMG1zIG90aGVyd2lzZSB1cGRhdGUgdGhlIGN1cnJlbnQgYXV0b3Njcm9sbCB0aW1lXG4qL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5waW5nQXV0b1Njcm9sbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSB0aGlzLnNiTGFzdEF1dG8gPiA1MDApIHtcbiAgICAgICAgdGhpcy5zZXRBdXRvU2Nyb2xsU3RhcnRUaW1lKCk7XG4gICAgfVxuICAgIHRoaXMuc2JMYXN0QXV0byA9IERhdGUubm93KCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmFuc3dlciBob3cgbG9uZyB3ZSBoYXZlIGJlZW4gYXV0byBzY3JvbGxpbmdcbiogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4qL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5nZXRBdXRvU2Nyb2xsRHVyYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMuc2JMYXN0QXV0byA+IDUwMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLnNiQXV0b1N0YXJ0O1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5BdWdtZW50IHRoZSBtb3N0IHJlY2VudCBzZWxlY3Rpb24gZXh0ZW50IGJ5IChvZmZzZXRYLG9mZnNldFkpIGFuZCBzY3JvbGwgaWYgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7aW50ZWdlcn0gb2Zmc2V0WCAtIHggY29vcmRpbmF0ZSB0byBzdGFydCBhdFxuICogQHBhcmFtIHtpbnRlZ2VyfSBvZmZzZXRZIC0geSBjb29yZGluYXRlIHRvIHN0YXJ0IGF0XG4qL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5tb3ZlU2hpZnRTZWxlY3QgPSBmdW5jdGlvbihncmlkLCBvZmZzZXRYKSB7XG5cbiAgICB2YXIgbWF4Q29sdW1ucyA9IGdyaWQuZ2V0Q29sdW1uQ291bnQoKSAtIDE7XG5cbiAgICB2YXIgbWF4Vmlld2FibGVDb2x1bW5zID0gZ3JpZC5nZXRWaXNpYmxlQ29sdW1ucygpIC0gMTtcblxuICAgIGlmICghZ3JpZC5yZXNvbHZlUHJvcGVydHkoJ3Njcm9sbGluZ0VuYWJsZWQnKSkge1xuICAgICAgICBtYXhDb2x1bW5zID0gTWF0aC5taW4obWF4Q29sdW1ucywgbWF4Vmlld2FibGVDb2x1bW5zKTtcbiAgICB9XG5cbiAgICB2YXIgb3JpZ2luID0gZ3JpZC5nZXRNb3VzZURvd24oKTtcbiAgICB2YXIgZXh0ZW50ID0gZ3JpZC5nZXREcmFnRXh0ZW50KCk7XG5cbiAgICB2YXIgbmV3WCA9IGV4dGVudC54ICsgb2Zmc2V0WDtcbiAgICAvL3ZhciBuZXdZID0gZ3JpZC5nZXRSb3dDb3VudCgpO1xuXG4gICAgbmV3WCA9IE1hdGgubWluKG1heENvbHVtbnMgLSBvcmlnaW4ueCwgTWF0aC5tYXgoLW9yaWdpbi54LCBuZXdYKSk7XG5cbiAgICBncmlkLmNsZWFyTW9zdFJlY2VudENvbHVtblNlbGVjdGlvbigpO1xuICAgIGdyaWQuc2VsZWN0Q29sdW1uKG9yaWdpbi54LCBvcmlnaW4ueCArIG5ld1gpO1xuXG4gICAgZ3JpZC5zZXREcmFnRXh0ZW50KGdyaWQucmVjdGFuZ2xlcy5wb2ludC5jcmVhdGUobmV3WCwgMCkpO1xuXG4gICAgaWYgKGdyaWQuaW5zdXJlTW9kZWxDb2xJc1Zpc2libGUobmV3WCArIG9yaWdpbi54LCBvZmZzZXRYKSkge1xuICAgICAgICB0aGlzLnBpbmdBdXRvU2Nyb2xsKCk7XG4gICAgfVxuXG4gICAgZ3JpZC5yZXBhaW50KCk7XG5cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuUmVwbGFjZSB0aGUgbW9zdCByZWNlbnQgc2VsZWN0aW9uIHdpdGggYSBzaW5nbGUgY2VsbCBzZWxlY3Rpb24gdGhhdCBpcyBtb3ZlZCAob2Zmc2V0WCxvZmZzZXRZKSBmcm9tIHRoZSBwcmV2aW91cyBzZWxlY3Rpb24gZXh0ZW50LlxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7aW50ZWdlcn0gb2Zmc2V0WCAtIHggY29vcmRpbmF0ZSB0byBzdGFydCBhdFxuICogQHBhcmFtIHtpbnRlZ2VyfSBvZmZzZXRZIC0geSBjb29yZGluYXRlIHRvIHN0YXJ0IGF0XG4qL1xuQ29sdW1uU2VsZWN0aW9uLnByb3RvdHlwZS5tb3ZlU2luZ2xlU2VsZWN0ID0gZnVuY3Rpb24oZ3JpZCwgb2Zmc2V0WCkge1xuXG4gICAgdmFyIG1heENvbHVtbnMgPSBncmlkLmdldENvbHVtbkNvdW50KCkgLSAxO1xuXG4gICAgdmFyIG1heFZpZXdhYmxlQ29sdW1ucyA9IGdyaWQuZ2V0VmlzaWJsZUNvbHVtbnNDb3VudCgpIC0gMTtcblxuICAgIGlmICghZ3JpZC5yZXNvbHZlUHJvcGVydHkoJ3Njcm9sbGluZ0VuYWJsZWQnKSkge1xuICAgICAgICBtYXhDb2x1bW5zID0gTWF0aC5taW4obWF4Q29sdW1ucywgbWF4Vmlld2FibGVDb2x1bW5zKTtcbiAgICB9XG5cbiAgICB2YXIgbW91c2VDb3JuZXIgPSBncmlkLmdldE1vdXNlRG93bigpLnBsdXMoZ3JpZC5nZXREcmFnRXh0ZW50KCkpO1xuXG4gICAgdmFyIG5ld1ggPSBtb3VzZUNvcm5lci54ICsgb2Zmc2V0WDtcbiAgICAvL3ZhciBuZXdZID0gZ3JpZC5nZXRSb3dDb3VudCgpO1xuXG4gICAgbmV3WCA9IE1hdGgubWluKG1heENvbHVtbnMsIE1hdGgubWF4KDAsIG5ld1gpKTtcblxuICAgIGdyaWQuY2xlYXJTZWxlY3Rpb25zKCk7XG4gICAgZ3JpZC5zZWxlY3RDb2x1bW4obmV3WCk7XG4gICAgZ3JpZC5zZXRNb3VzZURvd24oZ3JpZC5yZWN0YW5nbGVzLnBvaW50LmNyZWF0ZShuZXdYLCAwKSk7XG4gICAgZ3JpZC5zZXREcmFnRXh0ZW50KGdyaWQucmVjdGFuZ2xlcy5wb2ludC5jcmVhdGUoMCwgMCkpO1xuXG4gICAgaWYgKGdyaWQuaW5zdXJlTW9kZWxDb2xJc1Zpc2libGUobmV3WCwgb2Zmc2V0WCkpIHtcbiAgICAgICAgdGhpcy5waW5nQXV0b1Njcm9sbCgpO1xuICAgIH1cblxuICAgIGdyaWQucmVwYWludCgpO1xuXG59O1xuXG5Db2x1bW5TZWxlY3Rpb24ucHJvdG90eXBlLmlzQ29sdW1uRHJhZ2dpbmcgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgdmFyIGRyYWdnZXIgPSBncmlkLmxvb2t1cEZlYXR1cmUoJ0NvbHVtbk1vdmluZycpO1xuICAgIGlmICghZHJhZ2dlcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBpc0FjdGl2YXRlZCA9IGRyYWdnZXIuZHJhZ2dpbmcgJiYgIXRoaXMuZHJhZ2dpbmc7XG4gICAgcmV0dXJuIGlzQWN0aXZhdGVkO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5TZWxlY3Rpb247XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqXG4gKiBAbW9kdWxlIGZlYXR1cmVzXFxiYXNlXG4gKiBAZGVzY3JpcHRpb25cbiBpbnN0YW5jZXMgb2YgZmVhdHVyZXMgYXJlIGNvbm5lY3RlZCB0byBvbmUgYW5vdGhlciB0byBtYWtlIGEgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHkgZm9yIGhhbmRsaW5nIGFsbCB0aGUgaW5wdXQgdG8gdGhlIGh5cGVyZ3JpZC5cbiAqXG4gKi9cblxudmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UuanMnKTtcblxuZnVuY3Rpb24gQ29sdW1uU29ydGluZygpIHtcbiAgICBCYXNlLmNhbGwodGhpcyk7XG4gICAgdGhpcy5hbGlhcyA9ICdDb2x1bW5Tb3J0aW5nJztcbn07XG5cbkNvbHVtblNvcnRpbmcucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlLnByb3RvdHlwZSk7XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50IGRvd24gdGhlIGZlYXR1cmUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cblxuQ29sdW1uU29ydGluZy5wcm90b3R5cGUuaGFuZGxlRG91YmxlQ2xpY2sgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIHZhciBncmlkQ2VsbCA9IGV2ZW50LmdyaWRDZWxsO1xuICAgIGlmIChncmlkLmlzU2hvd0hlYWRlclJvdygpICYmIGdyaWRDZWxsLnkgPT09IDAgJiYgZ3JpZENlbGwueCAhPT0gLTEpIHtcbiAgICAgICAgdmFyIGtleXMgPSBldmVudC5wcmltaXRpdmVFdmVudC5kZXRhaWwua2V5cztcbiAgICAgICAgZ3JpZC50b2dnbGVTb3J0KGdyaWRDZWxsLngsIGtleXMpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5oYW5kbGVEb3VibGVDbGljayhncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5oYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuQ29sdW1uU29ydGluZy5wcm90b3R5cGUuaGFuZGxlTW91c2VNb3ZlID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICB2YXIgeSA9IGV2ZW50LmdyaWRDZWxsLnk7XG4gICAgaWYgKHRoaXMuaXNGaXhlZFJvdyhncmlkLCBldmVudCkgJiYgeSA8IDEpIHtcbiAgICAgICAgdGhpcy5jdXJzb3IgPSAncG9pbnRlcic7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jdXJzb3IgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5oYW5kbGVNb3VzZU1vdmUoZ3JpZCwgZXZlbnQpO1xuICAgIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5Tb3J0aW5nO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKlxuICogQG1vZHVsZSBmZWF0dXJlc1xcYmFzZVxuICogQGRlc2NyaXB0aW9uXG4gaW5zdGFuY2VzIG9mIGZlYXR1cmVzIGFyZSBjb25uZWN0ZWQgdG8gb25lIGFub3RoZXIgdG8gbWFrZSBhIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5IGZvciBoYW5kbGluZyBhbGwgdGhlIGlucHV0IHRvIHRoZSBoeXBlcmdyaWQuXG4gKlxuICovXG5cbnZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlLmpzJyk7XG5cbmZ1bmN0aW9uIEZpbHRlcnMoKSB7XG4gICAgQmFzZS5jYWxsKHRoaXMpO1xuICAgIHRoaXMuYWxpYXMgPSAnRmlsdGVycyc7XG59O1xuXG5GaWx0ZXJzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZS5wcm90b3R5cGUpO1xuXG5GaWx0ZXJzLnByb3RvdHlwZS5oYW5kbGVUYXAgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIHZhciBncmlkQ2VsbCA9IGV2ZW50LmdyaWRDZWxsO1xuICAgIGlmIChncmlkLmlzRmlsdGVyUm93KGdyaWRDZWxsLnkpICYmIGdyaWRDZWxsLnggIT09IC0xKSB7XG4gICAgICAgIGdyaWQuZmlsdGVyQ2xpY2tlZChldmVudCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm5leHQpIHtcbiAgICAgICAgdGhpcy5uZXh0LmhhbmRsZVRhcChncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4gKlxuICogQG1vZHVsZSBmZWF0dXJlc1xca2V5LXBhZ2luZ1xuICpcbiAqL1xudmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UuanMnKTtcblxudmFyIGNvbW1hbmRzID0ge1xuICAgIFBBR0VET1dOOiBmdW5jdGlvbihncmlkKSB7XG4gICAgICAgIGdyaWQucGFnZURvd24oKTtcbiAgICB9LFxuICAgIFBBR0VVUDogZnVuY3Rpb24oZ3JpZCkge1xuICAgICAgICBncmlkLnBhZ2VVcCgpO1xuICAgIH0sXG4gICAgUEFHRUxFRlQ6IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICAgICAgZ3JpZC5wYWdlTGVmdCgpO1xuICAgIH0sXG4gICAgUEFHRVJJR0hUOiBmdW5jdGlvbihncmlkKSB7XG4gICAgICAgIGdyaWQucGFnZVJpZ2h0KCk7XG4gICAgfVxufTtcblxuLyoqXG4gKlxuICogQG1vZHVsZSBmZWF0dXJlc1xcYmFzZVxuICogQGRlc2NyaXB0aW9uXG4gaW5zdGFuY2VzIG9mIGZlYXR1cmVzIGFyZSBjb25uZWN0ZWQgdG8gb25lIGFub3RoZXIgdG8gbWFrZSBhIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5IGZvciBoYW5kbGluZyBhbGwgdGhlIGlucHV0IHRvIHRoZSBoeXBlcmdyaWQuXG4gKlxuICovXG5cbnZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlLmpzJyk7XG5cbmZ1bmN0aW9uIEtleVBhZ2luZygpIHtcbiAgICBCYXNlLmNhbGwodGhpcyk7XG4gICAgdGhpcy5hbGlhcyA9ICdLZXlQYWdpbmcnO1xufTtcblxuS2V5UGFnaW5nLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZS5wcm90b3R5cGUpO1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5LZXlQYWdpbmcucHJvdG90eXBlLmhhbmRsZUtleURvd24gPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIHZhciBkZXRhaWwgPSBldmVudC5kZXRhaWwuY2hhcjtcbiAgICB2YXIgZnVuYyA9IGNvbW1hbmRzW2RldGFpbF07XG4gICAgaWYgKGZ1bmMpIHtcbiAgICAgICAgZnVuYyhncmlkKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlS2V5RG93bihncmlkLCBldmVudCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEtleVBhZ2luZztcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICpcbiAqIEBtb2R1bGUgZmVhdHVyZXNcXGJhc2VcbiAqIEBkZXNjcmlwdGlvblxuIGluc3RhbmNlcyBvZiBmZWF0dXJlcyBhcmUgY29ubmVjdGVkIHRvIG9uZSBhbm90aGVyIHRvIG1ha2UgYSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eSBmb3IgaGFuZGxpbmcgYWxsIHRoZSBpbnB1dCB0byB0aGUgaHlwZXJncmlkLlxuICpcbiAqL1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZS5qcycpO1xuXG5mdW5jdGlvbiBPbkhvdmVyKCkge1xuICAgIEJhc2UuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmFsaWFzID0gJ09uSG92ZXInO1xufTtcblxuT25Ib3Zlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2UucHJvdG90eXBlKTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuT25Ib3Zlci5wcm90b3R5cGUuaGFuZGxlTW91c2VNb3ZlID0gZnVuY3Rpb24oZ3JpZCwgZXZlbnQpIHtcbiAgICB2YXIgY3VycmVudEhvdmVyQ2VsbCA9IGdyaWQuZ2V0SG92ZXJDZWxsKCk7XG4gICAgaWYgKCFldmVudC5ncmlkQ2VsbC5lcXVhbHMoY3VycmVudEhvdmVyQ2VsbCkpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRIb3ZlckNlbGwpIHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlTW91c2VFeGl0KGdyaWQsIGN1cnJlbnRIb3ZlckNlbGwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGFuZGxlTW91c2VFbnRlcihncmlkLCBldmVudCk7XG4gICAgICAgIGdyaWQuc2V0SG92ZXJDZWxsKGV2ZW50LmdyaWRDZWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VNb3ZlKGdyaWQsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gT25Ib3ZlcjtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICpcbiAqIEBtb2R1bGUgZmVhdHVyZXNcXG92ZXJsYXlcbiAqXG4gKi9cbnZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlLmpzJyk7XG52YXIgbm9vcCA9IGZ1bmN0aW9uKCkge307XG52YXIgQU5JTUFUSU9OX1RJTUUgPSAyMDA7XG5cblxuZnVuY3Rpb24gT3ZlcmxheSgpIHtcbiAgICBCYXNlLmNhbGwodGhpcyk7XG4gICAgdGhpcy5hbGlhcyA9ICdPdmVybGF5Jztcbn07XG5cbk92ZXJsYXkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlLnByb3RvdHlwZSk7XG5cbi8qKlxuICogQHByb3BlcnR5IHtib29sZWFufSBvcGVuRWRpdG9yIC0gaXMgdGhlIGVkaXRvciBvcGVuXG4gKiBAaW5zdGFuY2VcbiAqL1xuT3ZlcmxheS5wcm90b3R5cGUub3BlbkVkaXRvciA9IGZhbHNlLFxuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5PdmVybGF5LnByb3RvdHlwZS5oYW5kbGVLZXlVcCA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgdmFyIGtleSA9IGV2ZW50LmRldGFpbC5jaGFyLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIGtleXMgPSBncmlkLnJlc29sdmVQcm9wZXJ0eSgnZWRpdG9yQWN0aXZhdGlvbktleXMnKTtcbiAgICBpZiAoa2V5cy5pbmRleE9mKGtleSkgPiAtMSkge1xuICAgICAgICB0aGlzLnRvZ2dsZUNvbHVtblBpY2tlcihncmlkKTtcbiAgICB9XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbnRvZ2dsZSB0aGUgY29sdW1uIHBpY2tlciBvbi9vZmZcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiovXG5PdmVybGF5LnByb3RvdHlwZS50b2dnbGVDb2x1bW5QaWNrZXIgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgaWYgKHRoaXMuaXNDb2x1bW5QaWNrZXJPcGVuKGdyaWQpKSB7XG4gICAgICAgIHRoaXMuY2xvc2VDb2x1bW5QaWNrZXIoZ3JpZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vcGVuQ29sdW1uUGlja2VyKGdyaWQpO1xuICAgIH1cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmV0dXJucyB0cnVlIGlmIHRoZSBjb2x1bW4gcGlja2VyIGlzIG9wZW5cbiogIyMjIyByZXR1cm5zOiBib29sZWFuXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qL1xuT3ZlcmxheS5wcm90b3R5cGUuaXNDb2x1bW5QaWNrZXJPcGVuID0gZnVuY3Rpb24oZ3JpZCkge1xuICAgIG5vb3AoZ3JpZCk7XG4gICAgcmV0dXJuIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ICE9PSAnbm9uZSc7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbm9wZW4gdGhlIGNvbHVtbiBwaWNrZXJcbiogIyMjIyByZXR1cm5zOiB0eXBlXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qL1xuT3ZlcmxheS5wcm90b3R5cGUub3BlbkNvbHVtblBpY2tlciA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICBpZiAodGhpcy5pc0NvbHVtblBpY2tlck9wZW4oKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMub3BlbkVkaXRvciA9IHRydWU7XG4gICAgaWYgKGdyaWQuZ2V0QmVoYXZpb3IoKS5vcGVuRWRpdG9yKHRoaXMub3ZlcmxheSkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5vdmVybGF5LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGdyaWQucmVzb2x2ZVByb3BlcnR5KCdiYWNrZ3JvdW5kQ29sb3InKTtcblxuICAgIHRoaXMub3ZlcmxheS5zdHlsZS50b3AgPSAnMCUnO1xuICAgIHRoaXMub3ZlcmxheS5zdHlsZS5yaWdodCA9ICcwJSc7XG4gICAgdGhpcy5vdmVybGF5LnN0eWxlLmJvdHRvbSA9ICcwJSc7XG4gICAgdGhpcy5vdmVybGF5LnN0eWxlLmxlZnQgPSAnMCUnO1xuXG4gICAgdGhpcy5vdmVybGF5LnN0eWxlLm1hcmdpblRvcCA9ICcxNXB4JztcbiAgICB0aGlzLm92ZXJsYXkuc3R5bGUubWFyZ2luUmlnaHQgPSAnMzVweCc7XG4gICAgdGhpcy5vdmVybGF5LnN0eWxlLm1hcmdpbkJvdHRvbSA9ICczNXB4JztcbiAgICB0aGlzLm92ZXJsYXkuc3R5bGUubWFyZ2luTGVmdCA9ICcxNXB4JztcblxuICAgIHNlbGYub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJyc7XG5cblxuICAgIGlmICghdGhpcy5fY2xvc2VyKSB7XG4gICAgICAgIHRoaXMuX2Nsb3NlciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBzZWxmLmdldENoYXJGb3IoZ3JpZCwgZS5rZXlDb2RlKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIGtleXMgPSBncmlkLnJlc29sdmVQcm9wZXJ0eSgnZWRpdG9yQWN0aXZhdGlvbktleXMnKTtcbiAgICAgICAgICAgIGlmIChrZXlzLmluZGV4T2Yoa2V5KSA+IC0xIHx8IGUua2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jbG9zZUNvbHVtblBpY2tlcihncmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBncmlkLnNldEZvY3VzYWJsZShmYWxzZSk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLm92ZXJsYXkuc3R5bGUub3BhY2l0eSA9IDAuOTU7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBzZWxmLl9jbG9zZXIsIGZhbHNlKTtcbiAgICB9KTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLm92ZXJsYXkuZm9jdXMoKTtcbiAgICB9LCAxMDApO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5jbG9zZSB0aGUgY29sdW1uIHBpY2tlclxuKiAjIyMjIHJldHVybnM6IHR5cGVcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiovXG5PdmVybGF5LnByb3RvdHlwZS5jbG9zZUNvbHVtblBpY2tlciA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICBncmlkLnNldEZvY3VzYWJsZSh0cnVlKTtcblxuICAgIGlmICghdGhpcy5pc0NvbHVtblBpY2tlck9wZW4oKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLm9wZW5FZGl0b3IpIHtcbiAgICAgICAgdGhpcy5vcGVuRWRpdG9yID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZ3JpZC5nZXRCZWhhdmlvcigpLmNsb3NlRWRpdG9yKHRoaXMub3ZlcmxheSkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fY2xvc2VyLCBmYWxzZSk7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYub3ZlcmxheS5zdHlsZS5vcGFjaXR5ID0gMDtcbiAgICB9KTtcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYub3ZlcmxheS5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgc2VsZi5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGdyaWQudGFrZUZvY3VzKCk7XG4gICAgfSwgQU5JTUFUSU9OX1RJTUUpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5pbml0aWFsaXplIG15c2VsZiBpbnRvIHRoZSBncmlkXG4qICMjIyMgcmV0dXJuczogdHlwZVxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKi9cbk92ZXJsYXkucHJvdG90eXBlLmluaXRpYWxpemVPbiA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICB0aGlzLmluaXRpYWxpemVPdmVybGF5U3VyZmFjZShncmlkKTtcbiAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC5pbml0aWFsaXplT24oZ3JpZCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5pbml0aWFsaXplIHRoZSBvdmVybGF5IHN1cmZhY2UgaW50byB0aGUgZ3JpZFxuKiAjIyMjIHJldHVybnM6IHR5cGVcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiovXG5PdmVybGF5LnByb3RvdHlwZS5pbml0aWFsaXplT3ZlcmxheVN1cmZhY2UgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgdGhpcy5vdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5vdmVybGF5LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAwKTtcbiAgICB0aGlzLm92ZXJsYXkuc3R5bGUub3V0bGluZSA9ICdub25lJztcbiAgICB0aGlzLm92ZXJsYXkuc3R5bGUuYm94U2hhZG93ID0gJzAgMTlweCAzOHB4IHJnYmEoMCwwLDAsMC4zMCksIDAgMTVweCAxMnB4IHJnYmEoMCwwLDAsMC4yMiknO1xuICAgIHRoaXMub3ZlcmxheS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgdGhpcy5vdmVybGF5LnN0eWxlLnRyYW5zaXRpb24gPSAnb3BhY2l0eSAnICsgQU5JTUFUSU9OX1RJTUUgKyAnbXMgZWFzZS1pbic7XG4gICAgdGhpcy5vdmVybGF5LnN0eWxlLm9wYWNpdHkgPSAwO1xuICAgIGdyaWQuYXBwZW5kQ2hpbGQodGhpcy5vdmVybGF5KTtcbiAgICAvL2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5vdmVybGF5KTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuZ2V0IGEgaHVtYW4gcmVhZGFibGUgZGVzY3JpcHRpb24gb2YgdGhlIGtleSBwcmVzc2VkIGZyb20gaXQncyBpbnRlZ2VyIHJlcHJlc2VudGF0aW9uXG4qICMjIyMgcmV0dXJuczogc3RyaW5nXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7aW50ZWdlcn0gaW50ZWdlciAtIHRoZSBpbnRlZ2VyIHdlIHdhbnQgdGhlIGNoYXIgZm9yXG4qL1xuT3ZlcmxheS5wcm90b3R5cGUuZ2V0Q2hhckZvciA9IGZ1bmN0aW9uKGdyaWQsIGludGVnZXIpIHtcbiAgICB2YXIgY2hhck1hcCA9IGdyaWQuZ2V0Q2FudmFzKCkuZ2V0Q2hhck1hcCgpO1xuICAgIHJldHVybiBjaGFyTWFwW2ludGVnZXJdWzBdO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE92ZXJsYXk7XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqXG4gKiBAbW9kdWxlIGZlYXR1cmVzXFxiYXNlXG4gKiBAZGVzY3JpcHRpb25cbiBpbnN0YW5jZXMgb2YgZmVhdHVyZXMgYXJlIGNvbm5lY3RlZCB0byBvbmUgYW5vdGhlciB0byBtYWtlIGEgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHkgZm9yIGhhbmRsaW5nIGFsbCB0aGUgaW5wdXQgdG8gdGhlIGh5cGVyZ3JpZC5cbiAqXG4gKi9cblxudmFyIENvbHVtblJlc2l6aW5nID0gcmVxdWlyZSgnLi9Db2x1bW5SZXNpemluZy5qcycpO1xuXG5mdW5jdGlvbiBSb3dSZXNpemluZygpIHtcbiAgICBDb2x1bW5SZXNpemluZy5jYWxsKHRoaXMpO1xuICAgIHRoaXMuYWxpYXMgPSAnUm93UmVzaXppbmcnO1xufTtcblxuUm93UmVzaXppbmcucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDb2x1bW5SZXNpemluZy5wcm90b3R5cGUpO1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7aW50ZWdlcn0gZHJhZ0FyZWEgLSB0aGUgaW5kZXggb2YgdGhlIHJvdy9jb2x1bW4gd2UgYXJlIGRyYWdnaW5nXG4gKiBAaW5zdGFuY2VcbiAqL1xuUm93UmVzaXppbmcucHJvdG90eXBlLmRyYWdBcmVhID0gLTEsXG5cbi8qKlxuICogQHByb3BlcnR5IHtpbnRlZ2VyfSBkcmFnU3RhcnQgLSB0aGUgcGl4ZWwgbG9jYXRpb24gb2YgdGhlIHdoZXJlIHRoZSBkcmFnIHdhcyBpbml0aWF0ZWRcbiAqIEBpbnN0YW5jZVxuICovXG5Sb3dSZXNpemluZy5wcm90b3R5cGUuZHJhZ1N0YXJ0ID0gLTEsXG5cbi8qKlxuICogQHByb3BlcnR5IHtpbnRlZ2VyfSBkcmFnQXJlYVN0YXJ0aW5nU2l6ZSAtIHRoZSBzdGFydGluZyB3aWR0aC9oZWlnaHQgb2YgdGhlIHJvdy9jb2x1bW4gd2UgYXJlIGRyYWdnaW5nXG4gKiBAaW5zdGFuY2VcbiAqL1xuUm93UmVzaXppbmcucHJvdG90eXBlLmRyYWdBcmVhU3RhcnRpbmdTaXplID0gLTEsXG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuZ2V0IHRoZSBtb3VzZSB4LHkgY29vcmRpbmF0ZVxuKiAjIyMjIHJldHVybnM6IGludGVnZXJcbiogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCAtIHRoZSBtb3VzZSBldmVudCB0byBxdWVyeVxuKi9cblJvd1Jlc2l6aW5nLnByb3RvdHlwZS5nZXRNb3VzZVZhbHVlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICByZXR1cm4gZXZlbnQucHJpbWl0aXZlRXZlbnQuZGV0YWlsLm1vdXNlLnk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmdldCB0aGUgZ3JpZCBjZWxsIHgseSBjb29yZGluYXRlXG4qICMjIyMgcmV0dXJuczogaW50ZWdlclxuKiBAcGFyYW0ge3JlY3RhbmdsZS5wb2ludH0gZ3JpZENlbGwgLSBbcmVjdGFuZ2xlLnBvaW50XShodHRwczovL2dpdGh1Yi5jb20vc3RldmV3aXJ0cy9maW4tcmVjdGFuZ2xlKVxuKi9cblJvd1Jlc2l6aW5nLnByb3RvdHlwZS5nZXRHcmlkQ2VsbFZhbHVlID0gZnVuY3Rpb24oZ3JpZENlbGwpIHtcbiAgICByZXR1cm4gZ3JpZENlbGwueDtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSBncmlkcyB4LHkgc2Nyb2xsIHZhbHVlXG4qICMjIyMgcmV0dXJuczogaW50ZWdlclxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKi9cblJvd1Jlc2l6aW5nLnByb3RvdHlwZS5nZXRTY3JvbGxWYWx1ZSA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICByZXR1cm4gZ3JpZC5nZXRWU2Nyb2xsVmFsdWUoKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSB3aWR0aC9oZWlnaHQgb2YgdGhlIHJvdy9jb2x1bW4gb2YgaW50ZXJlc3RcbiogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7aW50ZWdlcn0gaW5kZXggLSB0aGUgcm93L2NvbHVtbiBpbmRleCBvZiBpbnRlcmVzdFxuKi9cblJvd1Jlc2l6aW5nLnByb3RvdHlwZS5nZXRBcmVhU2l6ZSA9IGZ1bmN0aW9uKGdyaWQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGdyaWQuZ2V0Um93SGVpZ2h0KGluZGV4KTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuc2V0IHRoZSB3aWR0aC9oZWlnaHQgb2YgdGhlIHJvdy9jb2x1bW4gYXQgaW5kZXhcbiogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7aW50ZWdlcn0gaW5kZXggLSB0aGUgcm93L2NvbHVtbiBpbmRleCBvZiBpbnRlcmVzdFxuKiBAcGFyYW0ge2ludGVnZXJ9IHZhbHVlIC0gdGhlIHdpZHRoL2hlaWdodCB0byBzZXQgdG9cbiovXG5Sb3dSZXNpemluZy5wcm90b3R5cGUuc2V0QXJlYVNpemUgPSBmdW5jdGlvbihncmlkLCBpbmRleCwgdmFsdWUpIHtcbiAgICBncmlkLnNldFJvd0hlaWdodChpbmRleCwgdmFsdWUpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5yZXR1cm5zIHRoZSBpbmRleCBvZiB3aGljaCBkaXZpZGVyIEknbSBvdmVyXG4qICMjIyMgcmV0dXJuczogaW50ZWdlclxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cblJvd1Jlc2l6aW5nLnByb3RvdHlwZS5vdmVyQXJlYURpdmlkZXIgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIHJldHVybiBncmlkLm92ZXJSb3dEaXZpZGVyKGV2ZW50KTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuYW0gSSBvdmVyIHRoZSBjb2x1bW4vcm93IGFyZWFcbiogIyMjIyByZXR1cm5zOiBib29sZWFuXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuUm93UmVzaXppbmcucHJvdG90eXBlLmlzRmlyc3RGaXhlZE90aGVyQXJlYSA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgcmV0dXJuIHRoaXMuaXNGaXJzdEZpeGVkQ29sdW1uKGdyaWQsIGV2ZW50KTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSBjdXJzb3IgbmFtZVxuKiAjIyMjIHJldHVybnM6IHN0cmluZ1xuKi9cblJvd1Jlc2l6aW5nLnByb3RvdHlwZS5nZXRDdXJzb3JOYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICdyb3ctcmVzaXplJztcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSByZWNlbnRseSByZW5kZXJlZCBhcmVhJ3Mgd2lkdGgvaGVpZ2h0XG4qICMjIyMgcmV0dXJuczogaW50ZWdlclxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKiBAcGFyYW0ge2ludGVnZXJ9IGluZGV4IC0gdGhlIHJvdy9jb2x1bW4gaW5kZXggb2YgaW50ZXJlc3RcbiovXG5Sb3dSZXNpemluZy5wcm90b3R5cGUuZ2V0UHJldmlvdXNBYnNvbHV0ZVNpemUgPSBmdW5jdGlvbihncmlkLCBpbmRleCkge1xuICAgIHJldHVybiBncmlkLmdldFJlbmRlcmVkSGVpZ2h0KGluZGV4KTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxucmV0dXJuIHRoZSBmaXhlZCBhcmVhIHJvd3MvY29sdW1ucyBjb3VudFxuKiAjIyMjIHJldHVybnM6IGludGVnZXJcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiovXG5Sb3dSZXNpemluZy5wcm90b3R5cGUuZ2V0T3RoZXJGaXhlZEFyZWFDb3VudCA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICByZXR1cm4gZ3JpZC5nZXRGaXhlZENvbHVtbkNvdW50KCk7XG59O1xuXG5Sb3dSZXNpemluZy5wcm90b3R5cGUuZ2V0Rml4ZWRBcmVhQ291bnQgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgcmV0dXJuIGdyaWQuZ2V0Rml4ZWRSb3dDb3VudCgpICsgZ3JpZC5nZXRIZWFkZXJSb3dDb3VudCgpO1xufTtcblxuUm93UmVzaXppbmcucHJvdG90eXBlLmlzRW5hYmxlZCA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICByZXR1cm4gZ3JpZC5pc1Jvd1Jlc2l6ZWFibGUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUm93UmVzaXppbmc7XG4iLCIndXNlIHN0cmljdCc7XG4vKipcbiAqXG4gKiBAbW9kdWxlIGZlYXR1cmVzXFxiYXNlXG4gKiBAZGVzY3JpcHRpb25cbiBpbnN0YW5jZXMgb2YgZmVhdHVyZXMgYXJlIGNvbm5lY3RlZCB0byBvbmUgYW5vdGhlciB0byBtYWtlIGEgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHkgZm9yIGhhbmRsaW5nIGFsbCB0aGUgaW5wdXQgdG8gdGhlIGh5cGVyZ3JpZC5cbiAqXG4gKi9cblxudmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UuanMnKTtcblxuZnVuY3Rpb24gUm93U2VsZWN0aW9uKCkge1xuICAgIEJhc2UuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmFsaWFzID0gJ1Jvd1NlbGVjdGlvbic7XG59O1xuXG5Sb3dTZWxlY3Rpb24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlLnByb3RvdHlwZSk7XG5cbi8qKlxuICogQHByb3BlcnR5IHtmaW4tcmVjdGFuZ2xlLnBvaW50fSBjdXJyZW50RHJhZyAtIGN1cnJlbnREcmFnIGlzIHRoZSBwaXhlbCBsb2NhdGlvbiBvZiB0aGUgbW91c2UgcG9pbnRlciBkdXJpbmcgYSBkcmFnIG9wZXJhdGlvblxuICogQGluc3RhbmNlXG4gKi9cblJvd1NlbGVjdGlvbi5wcm90b3R5cGUuY3VycmVudERyYWcgPSBudWxsLFxuXG4vKipcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBsYXN0RHJhZ0NlbGwgLSBsYXN0RHJhZ0NlbGwgaXMgdGhlIGNlbGwgY29vcmRpbmF0ZXMgb2YgdGhlIHdoZXJlIHRoZSBtb3VzZSBwb2ludGVyIGlzIGR1cmluZyBhIGRyYWcgb3BlcmF0aW9uXG4gKiBAaW5zdGFuY2VcbiAqL1xuUm93U2VsZWN0aW9uLnByb3RvdHlwZS5sYXN0RHJhZ0NlbGwgPSBudWxsLFxuXG4vKipcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBzYkxhc3RBdXRvIC0gc2JMYXN0QXV0byBpcyBhIG1pbGxpc2Vjb25kIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgcHJldmlvdXMgdGltZSBhbiBhdXRvc2Nyb2xsIHN0YXJ0ZWRcbiAqIEBpbnN0YW5jZVxuICovXG5Sb3dTZWxlY3Rpb24ucHJvdG90eXBlLnNiTGFzdEF1dG8gPSAwLFxuXG4vKipcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBzYkF1dG9TdGFydCAtIHNiQXV0b1N0YXJ0IGlzIGEgbWlsbGlzZWNvbmQgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSB0aW1lIHRoZSBjdXJyZW50IGF1dG9zY3JvbGwgc3RhcnRlZFxuICogQGluc3RhbmNlXG4gKi9cblJvd1NlbGVjdGlvbi5wcm90b3R5cGUuc2JBdXRvU3RhcnQgPSAwLFxuXG5Sb3dTZWxlY3Rpb24ucHJvdG90eXBlLmRyYWdBcm1lZCA9IGZhbHNlLFxuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudCBkb3duIHRoZSBmZWF0dXJlIGNoYWluIG9mIHJlc3BvbnNpYmlsaXR5XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Sb3dTZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZU1vdXNlVXAgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIGlmICh0aGlzLmRyYWdBcm1lZCkge1xuICAgICAgICB0aGlzLmRyYWdBcm1lZCA9IGZhbHNlO1xuICAgICAgICBncmlkLmZpcmVTeW50aGV0aWNSb3dTZWxlY3Rpb25DaGFuZ2VkRXZlbnQoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHJhZ2dpbmcpIHtcbiAgICAgICAgdGhpcy5kcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgICBncmlkLmZpcmVTeW50aGV0aWNSb3dTZWxlY3Rpb25DaGFuZ2VkRXZlbnQoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VVcChncmlkLCBldmVudCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuUm93U2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVNb3VzZURvd24gPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuXG4gICAgdmFyIGlzUmlnaHRDbGljayA9IGV2ZW50LnByaW1pdGl2ZUV2ZW50LmRldGFpbC5pc1JpZ2h0Q2xpY2s7XG4gICAgdmFyIGNlbGwgPSBldmVudC5ncmlkQ2VsbDtcbiAgICB2YXIgdmlld0NlbGwgPSBldmVudC52aWV3UG9pbnQ7XG4gICAgdmFyIGR4ID0gY2VsbC54O1xuICAgIHZhciBkeSA9IGNlbGwueTtcblxuXG4gICAgdmFyIGlzSGVhZGVyID0gZ3JpZC5pc1Nob3dSb3dOdW1iZXJzKCkgJiYgZHggPCAwO1xuXG4gICAgaWYgKCFncmlkLmlzUm93U2VsZWN0aW9uKCkgfHwgaXNSaWdodENsaWNrIHx8ICFpc0hlYWRlcikge1xuICAgICAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VEb3duKGdyaWQsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdmFyIG51bUZpeGVkUm93cyA9IGdyaWQuZ2V0Rml4ZWRSb3dDb3VudCgpO1xuXG4gICAgICAgIC8vaWYgd2UgYXJlIGluIHRoZSBmaXhlZCBhcmVhIGRvIG5vdCBhcHBseSB0aGUgc2Nyb2xsIHZhbHVlc1xuICAgICAgICAvL2NoZWNrIGJvdGggeCBhbmQgeSB2YWx1ZXMgaW5kZXBlbmRlbnRseVxuICAgICAgICBpZiAodmlld0NlbGwueSA8IG51bUZpeGVkUm93cykge1xuICAgICAgICAgICAgZHkgPSB2aWV3Q2VsbC55O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRDZWxsID0gZ3JpZC5uZXdQb2ludCgwLCBkeSk7XG5cbiAgICAgICAgdmFyIHByaW1FdmVudCA9IGV2ZW50LnByaW1pdGl2ZUV2ZW50O1xuICAgICAgICB2YXIga2V5cyA9IHByaW1FdmVudC5kZXRhaWwua2V5cztcbiAgICAgICAgdGhpcy5kcmFnQXJtZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmV4dGVuZFNlbGVjdGlvbihncmlkLCBkQ2VsbCwga2V5cyk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuUm93U2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVNb3VzZURyYWcgPSBmdW5jdGlvbihncmlkLCBldmVudCkge1xuICAgIHZhciBpc1JpZ2h0Q2xpY2sgPSBldmVudC5wcmltaXRpdmVFdmVudC5kZXRhaWwuaXNSaWdodENsaWNrO1xuXG4gICAgaWYgKCF0aGlzLmRyYWdBcm1lZCB8fCAhZ3JpZC5pc1Jvd1NlbGVjdGlvbigpIHx8IGlzUmlnaHRDbGljaykge1xuICAgICAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgICAgICB0aGlzLm5leHQuaGFuZGxlTW91c2VEcmFnKGdyaWQsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICB2YXIgbnVtRml4ZWRSb3dzID0gZ3JpZC5nZXRGaXhlZFJvd0NvdW50KCk7XG5cbiAgICAgICAgdmFyIGNlbGwgPSBldmVudC5ncmlkQ2VsbDtcbiAgICAgICAgdmFyIHZpZXdDZWxsID0gZXZlbnQudmlld1BvaW50O1xuICAgICAgICAvL3ZhciBkeCA9IGNlbGwueDtcbiAgICAgICAgdmFyIGR5ID0gY2VsbC55O1xuXG4gICAgICAgIC8vaWYgd2UgYXJlIGluIHRoZSBmaXhlZCBhcmVhIGRvIG5vdCBhcHBseSB0aGUgc2Nyb2xsIHZhbHVlc1xuICAgICAgICAvL2NoZWNrIGJvdGggeCBhbmQgeSB2YWx1ZXMgaW5kZXBlbmRlbnRseVxuICAgICAgICBpZiAodmlld0NlbGwueSA8IG51bUZpeGVkUm93cykge1xuICAgICAgICAgICAgZHkgPSB2aWV3Q2VsbC55O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRDZWxsID0gZ3JpZC5uZXdQb2ludCgwLCBkeSk7XG5cbiAgICAgICAgdmFyIHByaW1FdmVudCA9IGV2ZW50LnByaW1pdGl2ZUV2ZW50O1xuICAgICAgICB0aGlzLmN1cnJlbnREcmFnID0gcHJpbUV2ZW50LmRldGFpbC5tb3VzZTtcbiAgICAgICAgdGhpcy5sYXN0RHJhZ0NlbGwgPSBkQ2VsbDtcblxuICAgICAgICB0aGlzLmNoZWNrRHJhZ1Njcm9sbChncmlkLCB0aGlzLmN1cnJlbnREcmFnKTtcbiAgICAgICAgdGhpcy5oYW5kbGVNb3VzZURyYWdDZWxsU2VsZWN0aW9uKGdyaWQsIGRDZWxsLCBwcmltRXZlbnQuZGV0YWlsLmtleXMpO1xuICAgIH1cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50IGRvd24gdGhlIGZlYXR1cmUgY2hhaW4gb2YgcmVzcG9uc2liaWxpdHlcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cblJvd1NlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlS2V5RG93biA9IGZ1bmN0aW9uKGdyaWQsIGV2ZW50KSB7XG4gICAgaWYgKGdyaWQuZ2V0TGFzdFNlbGVjdGlvblR5cGUoKSAhPT0gJ3JvdycpIHtcbiAgICAgICAgaWYgKHRoaXMubmV4dCkge1xuICAgICAgICAgICAgdGhpcy5uZXh0LmhhbmRsZUtleURvd24oZ3JpZCwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGNvbW1hbmQgPSAnaGFuZGxlJyArIGV2ZW50LmRldGFpbC5jaGFyO1xuICAgIGlmICh0aGlzW2NvbW1hbmRdKSB7XG4gICAgICAgIHRoaXNbY29tbWFuZF0uY2FsbCh0aGlzLCBncmlkLCBldmVudC5kZXRhaWwpO1xuICAgIH1cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuSGFuZGxlIGEgbW91c2VkcmFnIHNlbGVjdGlvblxuKiAjIyMjIHJldHVybnM6IHR5cGVcbiogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiogQHBhcmFtIHtPYmplY3R9IG1vdXNlIC0gdGhlIGV2ZW50IGRldGFpbHNcbiogQHBhcmFtIHtBcnJheX0ga2V5cyAtIGFycmF5IG9mIHRoZSBrZXlzIHRoYXQgYXJlIGN1cnJlbnRseSBwcmVzc2VkIGRvd25cbiovXG5Sb3dTZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZU1vdXNlRHJhZ0NlbGxTZWxlY3Rpb24gPSBmdW5jdGlvbihncmlkLCBncmlkQ2VsbCAvKiAsa2V5cyAqLyApIHtcblxuICAgIC8vdmFyIGJlaGF2aW9yID0gZ3JpZC5nZXRCZWhhdmlvcigpO1xuICAgIHZhciB5ID0gZ3JpZENlbGwueTtcbiAgICAvLyAgICAgICAgICAgIHZhciBwcmV2aW91c0RyYWdFeHRlbnQgPSBncmlkLmdldERyYWdFeHRlbnQoKTtcbiAgICB2YXIgbW91c2VEb3duID0gZ3JpZC5nZXRNb3VzZURvd24oKTtcblxuICAgIHZhciBuZXdZID0geSAtIG1vdXNlRG93bi55O1xuICAgIC8vdmFyIG5ld1kgPSB5IC0gbW91c2VEb3duLnk7XG5cbiAgICAvLyBpZiAocHJldmlvdXNEcmFnRXh0ZW50LnggPT09IG5ld1ggJiYgcHJldmlvdXNEcmFnRXh0ZW50LnkgPT09IG5ld1kpIHtcbiAgICAvLyAgICAgcmV0dXJuO1xuICAgIC8vIH1cblxuICAgIGdyaWQuY2xlYXJNb3N0UmVjZW50Um93U2VsZWN0aW9uKCk7XG5cbiAgICBncmlkLnNlbGVjdFJvdyhtb3VzZURvd24ueSwgeSk7XG4gICAgZ3JpZC5zZXREcmFnRXh0ZW50KGdyaWQubmV3UG9pbnQoMCwgbmV3WSkpO1xuXG4gICAgZ3JpZC5yZXBhaW50KCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbnRoaXMgY2hlY2tzIHdoaWxlIHdlcmUgZHJhZ2dpbmcgaWYgd2UgZ28gb3V0c2lkZSB0aGUgdmlzaWJsZSBib3VuZHMsIGlmIHNvLCBraWNrIG9mZiB0aGUgZXh0ZXJuYWwgYXV0b3Njcm9sbCBjaGVjayBmdW5jdGlvbiAoYWJvdmUpXG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7T2JqZWN0fSBtb3VzZSAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuUm93U2VsZWN0aW9uLnByb3RvdHlwZS5jaGVja0RyYWdTY3JvbGwgPSBmdW5jdGlvbihncmlkLCBtb3VzZSkge1xuICAgIGlmICghZ3JpZC5yZXNvbHZlUHJvcGVydHkoJ3Njcm9sbGluZ0VuYWJsZWQnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBiID0gZ3JpZC5nZXREYXRhQm91bmRzKCk7XG4gICAgdmFyIGluc2lkZSA9IGIuY29udGFpbnMobW91c2UpO1xuICAgIGlmIChpbnNpZGUpIHtcbiAgICAgICAgaWYgKGdyaWQuaXNTY3JvbGxpbmdOb3coKSkge1xuICAgICAgICAgICAgZ3JpZC5zZXRTY3JvbGxpbmdOb3coZmFsc2UpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICghZ3JpZC5pc1Njcm9sbGluZ05vdygpKSB7XG4gICAgICAgIGdyaWQuc2V0U2Nyb2xsaW5nTm93KHRydWUpO1xuICAgICAgICB0aGlzLnNjcm9sbERyYWcoZ3JpZCk7XG4gICAgfVxufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG50aGlzIGZ1bmN0aW9uIG1ha2VzIHN1cmUgdGhhdCB3aGlsZSB3ZSBhcmUgZHJhZ2dpbmcgb3V0c2lkZSBvZiB0aGUgZ3JpZCB2aXNpYmxlIGJvdW5kcywgd2Ugc3Jjcm9sbCBhY2NvcmRpbmdseVxuKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuKi9cblJvd1NlbGVjdGlvbi5wcm90b3R5cGUuc2Nyb2xsRHJhZyA9IGZ1bmN0aW9uKGdyaWQpIHtcblxuICAgIGlmICghZ3JpZC5pc1Njcm9sbGluZ05vdygpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbGFzdERyYWdDZWxsID0gdGhpcy5sYXN0RHJhZ0NlbGw7XG4gICAgdmFyIGIgPSBncmlkLmdldERhdGFCb3VuZHMoKTtcbiAgICB2YXIgeE9mZnNldCA9IDA7XG4gICAgdmFyIHlPZmZzZXQgPSAwO1xuXG4gICAgdmFyIG51bUZpeGVkQ29sdW1ucyA9IGdyaWQuZ2V0Rml4ZWRDb2x1bW5Db3VudCgpO1xuICAgIHZhciBudW1GaXhlZFJvd3MgPSBncmlkLmdldEZpeGVkUm93Q291bnQoKTtcblxuICAgIHZhciBkcmFnRW5kSW5GaXhlZEFyZWFYID0gbGFzdERyYWdDZWxsLnggPCBudW1GaXhlZENvbHVtbnM7XG4gICAgdmFyIGRyYWdFbmRJbkZpeGVkQXJlYVkgPSBsYXN0RHJhZ0NlbGwueSA8IG51bUZpeGVkUm93cztcblxuICAgIGlmICh0aGlzLmN1cnJlbnREcmFnLnkgPCBiLm9yaWdpbi55KSB7XG4gICAgICAgIHlPZmZzZXQgPSAtMTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jdXJyZW50RHJhZy55ID4gYi5vcmlnaW4ueSArIGIuZXh0ZW50LnkpIHtcbiAgICAgICAgeU9mZnNldCA9IDE7XG4gICAgfVxuXG4gICAgdmFyIGRyYWdDZWxsT2Zmc2V0WCA9IHhPZmZzZXQ7XG4gICAgdmFyIGRyYWdDZWxsT2Zmc2V0WSA9IHlPZmZzZXQ7XG5cbiAgICBpZiAoZHJhZ0VuZEluRml4ZWRBcmVhWCkge1xuICAgICAgICBkcmFnQ2VsbE9mZnNldFggPSAwO1xuICAgIH1cblxuICAgIGlmIChkcmFnRW5kSW5GaXhlZEFyZWFZKSB7XG4gICAgICAgIGRyYWdDZWxsT2Zmc2V0WSA9IDA7XG4gICAgfVxuXG4gICAgdGhpcy5sYXN0RHJhZ0NlbGwgPSBsYXN0RHJhZ0NlbGwucGx1c1hZKGRyYWdDZWxsT2Zmc2V0WCwgZHJhZ0NlbGxPZmZzZXRZKTtcbiAgICBncmlkLnNjcm9sbEJ5KHhPZmZzZXQsIHlPZmZzZXQpO1xuICAgIHRoaXMuaGFuZGxlTW91c2VEcmFnQ2VsbFNlbGVjdGlvbihncmlkLCBsYXN0RHJhZ0NlbGwsIFtdKTsgLy8gdXBkYXRlIHRoZSBzZWxlY3Rpb25cbiAgICBncmlkLnJlcGFpbnQoKTtcbiAgICBzZXRUaW1lb3V0KHRoaXMuc2Nyb2xsRHJhZy5iaW5kKHRoaXMsIGdyaWQpLCAyNSk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmV4dGVuZCBhIHNlbGVjdGlvbiBvciBjcmVhdGUgb25lIGlmIHRoZXJlIGlzbnQgeWV0XG4qIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4qIEBwYXJhbSB7T2JqZWN0fSBncmlkQ2VsbCAtIHRoZSBldmVudCBkZXRhaWxzXG4qIEBwYXJhbSB7QXJyYXl9IGtleXMgLSBhcnJheSBvZiB0aGUga2V5cyB0aGF0IGFyZSBjdXJyZW50bHkgcHJlc3NlZCBkb3duXG4qL1xuUm93U2VsZWN0aW9uLnByb3RvdHlwZS5leHRlbmRTZWxlY3Rpb24gPSBmdW5jdGlvbihncmlkLCBncmlkQ2VsbCwga2V5cykge1xuICAgIGdyaWQuc3RvcEVkaXRpbmcoKTtcbiAgICAvL3ZhciBoYXNDVFJMID0ga2V5cy5pbmRleE9mKCdDVFJMJykgIT09IC0xO1xuICAgIHZhciBoYXNTSElGVCA9IGtleXMuaW5kZXhPZignU0hJRlQnKSAhPT0gLTE7XG5cbiAgICB2YXIgbW91c2VQb2ludCA9IGdyaWQuZ2V0TW91c2VEb3duKCk7XG4gICAgdmFyIHggPSBncmlkQ2VsbC54OyAvLyAtIG51bUZpeGVkQ29sdW1ucyArIHNjcm9sbExlZnQ7XG4gICAgdmFyIHkgPSBncmlkQ2VsbC55OyAvLyAtIG51bUZpeGVkUm93cyArIHNjcm9sbFRvcDtcblxuICAgIC8vd2VyZSBvdXRzaWRlIG9mIHRoZSBncmlkIGRvIG5vdGhpbmdcbiAgICBpZiAoeCA8IDAgfHwgeSA8IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChoYXNTSElGVCkge1xuICAgICAgICBncmlkLmNsZWFyTW9zdFJlY2VudFJvd1NlbGVjdGlvbigpO1xuICAgICAgICBncmlkLnNlbGVjdFJvdyh5LCBtb3VzZVBvaW50LnkpO1xuICAgICAgICBncmlkLnNldERyYWdFeHRlbnQoZ3JpZC5uZXdQb2ludCgwLCB5IC0gbW91c2VQb2ludC55KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ3JpZC50b2dnbGVTZWxlY3RSb3coeSwga2V5cyk7XG4gICAgICAgIGdyaWQuc2V0TW91c2VEb3duKGdyaWQubmV3UG9pbnQoeCwgeSkpO1xuICAgICAgICBncmlkLnNldERyYWdFeHRlbnQoZ3JpZC5uZXdQb2ludCgwLCAwKSk7XG4gICAgfVxuICAgIGdyaWQucmVwYWludCgpO1xufTtcblxuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudFxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiovXG5Sb3dTZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZURPV05TSElGVCA9IGZ1bmN0aW9uKGdyaWQpIHtcbiAgICB0aGlzLm1vdmVTaGlmdFNlbGVjdChncmlkLCAxKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Sb3dTZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZVVQU0hJRlQgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgdGhpcy5tb3ZlU2hpZnRTZWxlY3QoZ3JpZCwgLTEpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnRcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cblJvd1NlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlTEVGVFNISUZUID0gZnVuY3Rpb24oIC8qIGdyaWQgKi8gKSB7fTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnRcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cblJvd1NlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlUklHSFRTSElGVCA9IGZ1bmN0aW9uKCAvKiBncmlkICovICkge307XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Sb3dTZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZURPV04gPSBmdW5jdGlvbihncmlkKSB7XG4gICAgdGhpcy5tb3ZlU2luZ2xlU2VsZWN0KGdyaWQsIDEpO1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnRcbiAqIEBwYXJhbSB7ZmluLWh5cGVyZ3JpZH0gZ3JpZCAtIFtmaW4taHlwZXJncmlkXShtb2R1bGUtLl9maW4taHlwZXJncmlkLmh0bWwpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSB0aGUgZXZlbnQgZGV0YWlsc1xuKi9cblJvd1NlbGVjdGlvbi5wcm90b3R5cGUuaGFuZGxlVVAgPSBmdW5jdGlvbihncmlkKSB7XG4gICAgdGhpcy5tb3ZlU2luZ2xlU2VsZWN0KGdyaWQsIC0xKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuIGhhbmRsZSB0aGlzIGV2ZW50XG4gKiBAcGFyYW0ge2Zpbi1oeXBlcmdyaWR9IGdyaWQgLSBbZmluLWh5cGVyZ3JpZF0obW9kdWxlLS5fZmluLWh5cGVyZ3JpZC5odG1sKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gdGhlIGV2ZW50IGRldGFpbHNcbiovXG5Sb3dTZWxlY3Rpb24ucHJvdG90eXBlLmhhbmRsZUxFRlQgPSBmdW5jdGlvbiggLyogZ3JpZCAqLyApIHt9O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbiBoYW5kbGUgdGhpcyBldmVudFxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuUm93U2VsZWN0aW9uLnByb3RvdHlwZS5oYW5kbGVSSUdIVCA9IGZ1bmN0aW9uKGdyaWQpIHtcblxuICAgIHZhciBtb3VzZUNvcm5lciA9IGdyaWQuZ2V0TW91c2VEb3duKCkucGx1cyhncmlkLmdldERyYWdFeHRlbnQoKSk7XG4gICAgdmFyIG1heENvbHVtbnMgPSBncmlkLmdldENvbHVtbkNvdW50KCkgLSAxO1xuXG4gICAgdmFyIG5ld1ggPSBncmlkLmdldEhlYWRlckNvbHVtbkNvdW50KCkgKyBncmlkLmdldEhTY3JvbGxWYWx1ZSgpO1xuICAgIHZhciBuZXdZID0gbW91c2VDb3JuZXIueTtcblxuICAgIG5ld1ggPSBNYXRoLm1pbihtYXhDb2x1bW5zLCBuZXdYKTtcblxuICAgIGdyaWQuY2xlYXJTZWxlY3Rpb25zKCk7XG4gICAgZ3JpZC5zZWxlY3QobmV3WCwgbmV3WSwgMCwgMCk7XG4gICAgZ3JpZC5zZXRNb3VzZURvd24oZ3JpZC5uZXdQb2ludChuZXdYLCBuZXdZKSk7XG4gICAgZ3JpZC5zZXREcmFnRXh0ZW50KGdyaWQubmV3UG9pbnQoMCwgMCkpO1xuXG4gICAgZ3JpZC5yZXBhaW50KCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbklmIHdlIGFyZSBob2xkaW5nIGRvd24gdGhlIHNhbWUgbmF2aWdhdGlvbiBrZXksIGFjY2VsZXJhdGUgdGhlIGluY3JlbWVudCB3ZSBzY3JvbGxcbiogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4qL1xuUm93U2VsZWN0aW9uLnByb3RvdHlwZS5nZXRBdXRvU2Nyb2xsQWNjZWxlcmF0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvdW50ID0gMTtcbiAgICB2YXIgZWxhcHNlZCA9IHRoaXMuZ2V0QXV0b1Njcm9sbER1cmF0aW9uKCkgLyAyMDAwO1xuICAgIGNvdW50ID0gTWF0aC5tYXgoMSwgTWF0aC5mbG9vcihlbGFwc2VkICogZWxhcHNlZCAqIGVsYXBzZWQgKiBlbGFwc2VkKSk7XG4gICAgcmV0dXJuIGNvdW50O1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5zZXQgdGhlIHN0YXJ0IHRpbWUgdG8gcmlnaHQgbm93IHdoZW4gd2UgaW5pdGlhdGUgYW4gYXV0byBzY3JvbGxcbiovXG5Sb3dTZWxlY3Rpb24ucHJvdG90eXBlLnNldEF1dG9TY3JvbGxTdGFydFRpbWUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNiQXV0b1N0YXJ0ID0gRGF0ZS5ub3coKTtcbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxudXBkYXRlIHRoZSBhdXRvc2Nyb2xsIHN0YXJ0IHRpbWUgaWYgd2UgaGF2ZW4ndCBhdXRvc2Nyb2xsZWQgd2l0aGluIHRoZSBsYXN0IDUwMG1zIG90aGVyd2lzZSB1cGRhdGUgdGhlIGN1cnJlbnQgYXV0b3Njcm9sbCB0aW1lXG4qL1xuUm93U2VsZWN0aW9uLnByb3RvdHlwZS5waW5nQXV0b1Njcm9sbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSB0aGlzLnNiTGFzdEF1dG8gPiA1MDApIHtcbiAgICAgICAgdGhpcy5zZXRBdXRvU2Nyb2xsU3RhcnRUaW1lKCk7XG4gICAgfVxuICAgIHRoaXMuc2JMYXN0QXV0byA9IERhdGUubm93KCk7XG59O1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBpbnN0YW5jZVxuKiBAZGVzY3JpcHRpb25cbmFuc3dlciBob3cgbG9uZyB3ZSBoYXZlIGJlZW4gYXV0byBzY3JvbGxpbmdcbiogIyMjIyByZXR1cm5zOiBpbnRlZ2VyXG4qL1xuUm93U2VsZWN0aW9uLnByb3RvdHlwZS5nZXRBdXRvU2Nyb2xsRHVyYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMuc2JMYXN0QXV0byA+IDUwMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLnNiQXV0b1N0YXJ0O1xufTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG5BdWdtZW50IHRoZSBtb3N0IHJlY2VudCBzZWxlY3Rpb24gZXh0ZW50IGJ5IChvZmZzZXRYLG9mZnNldFkpIGFuZCBzY3JvbGwgaWYgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7aW50ZWdlcn0gb2Zmc2V0WCAtIHggY29vcmRpbmF0ZSB0byBzdGFydCBhdFxuICogQHBhcmFtIHtpbnRlZ2VyfSBvZmZzZXRZIC0geSBjb29yZGluYXRlIHRvIHN0YXJ0IGF0XG4qL1xuUm93U2VsZWN0aW9uLnByb3RvdHlwZS5tb3ZlU2hpZnRTZWxlY3QgPSBmdW5jdGlvbihncmlkLCBvZmZzZXRZKSB7XG5cbiAgICB2YXIgbWF4Um93cyA9IGdyaWQuZ2V0Um93Q291bnQoKSAtIDE7XG5cbiAgICB2YXIgbWF4Vmlld2FibGVSb3dzID0gZ3JpZC5nZXRWaXNpYmxlUm93cygpIC0gMTtcblxuICAgIGlmICghZ3JpZC5yZXNvbHZlUHJvcGVydHkoJ3Njcm9sbGluZ0VuYWJsZWQnKSkge1xuICAgICAgICBtYXhSb3dzID0gTWF0aC5taW4obWF4Um93cywgbWF4Vmlld2FibGVSb3dzKTtcbiAgICB9XG5cbiAgICB2YXIgb3JpZ2luID0gZ3JpZC5nZXRNb3VzZURvd24oKTtcbiAgICB2YXIgZXh0ZW50ID0gZ3JpZC5nZXREcmFnRXh0ZW50KCk7XG5cbiAgICB2YXIgbmV3WSA9IGV4dGVudC55ICsgb2Zmc2V0WTtcbiAgICAvL3ZhciBuZXdZID0gZ3JpZC5nZXRSb3dDb3VudCgpO1xuXG4gICAgbmV3WSA9IE1hdGgubWluKG1heFJvd3MgLSBvcmlnaW4ueSwgTWF0aC5tYXgoLW9yaWdpbi55LCBuZXdZKSk7XG5cbiAgICBncmlkLmNsZWFyTW9zdFJlY2VudFJvd1NlbGVjdGlvbigpO1xuICAgIGdyaWQuc2VsZWN0Um93KG9yaWdpbi55LCBvcmlnaW4ueSArIG5ld1kpO1xuXG4gICAgZ3JpZC5zZXREcmFnRXh0ZW50KGdyaWQubmV3UG9pbnQoMCwgbmV3WSkpO1xuXG4gICAgaWYgKGdyaWQuaW5zdXJlTW9kZWxSb3dJc1Zpc2libGUobmV3WSArIG9yaWdpbi55LCBvZmZzZXRZKSkge1xuICAgICAgICB0aGlzLnBpbmdBdXRvU2Nyb2xsKCk7XG4gICAgfVxuXG4gICAgZ3JpZC5maXJlU3ludGhldGljUm93U2VsZWN0aW9uQ2hhbmdlZEV2ZW50KCk7XG4gICAgZ3JpZC5yZXBhaW50KCk7XG5cbn07XG5cbi8qKlxuKiBAZnVuY3Rpb25cbiogQGluc3RhbmNlXG4qIEBkZXNjcmlwdGlvblxuUmVwbGFjZSB0aGUgbW9zdCByZWNlbnQgc2VsZWN0aW9uIHdpdGggYSBzaW5nbGUgY2VsbCBzZWxlY3Rpb24gdGhhdCBpcyBtb3ZlZCAob2Zmc2V0WCxvZmZzZXRZKSBmcm9tIHRoZSBwcmV2aW91cyBzZWxlY3Rpb24gZXh0ZW50LlxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7aW50ZWdlcn0gb2Zmc2V0WCAtIHggY29vcmRpbmF0ZSB0byBzdGFydCBhdFxuICogQHBhcmFtIHtpbnRlZ2VyfSBvZmZzZXRZIC0geSBjb29yZGluYXRlIHRvIHN0YXJ0IGF0XG4qL1xuUm93U2VsZWN0aW9uLnByb3RvdHlwZS5tb3ZlU2luZ2xlU2VsZWN0ID0gZnVuY3Rpb24oZ3JpZCwgb2Zmc2V0WSkge1xuXG4gICAgdmFyIG1heFJvd3MgPSBncmlkLmdldFJvd0NvdW50KCkgLSAxO1xuXG4gICAgdmFyIG1heFZpZXdhYmxlUm93cyA9IGdyaWQuZ2V0VmlzaWJsZVJvd3NDb3VudCgpIC0gMTtcblxuICAgIGlmICghZ3JpZC5yZXNvbHZlUHJvcGVydHkoJ3Njcm9sbGluZ0VuYWJsZWQnKSkge1xuICAgICAgICBtYXhSb3dzID0gTWF0aC5taW4obWF4Um93cywgbWF4Vmlld2FibGVSb3dzKTtcbiAgICB9XG5cbiAgICB2YXIgbW91c2VDb3JuZXIgPSBncmlkLmdldE1vdXNlRG93bigpLnBsdXMoZ3JpZC5nZXREcmFnRXh0ZW50KCkpO1xuXG4gICAgdmFyIG5ld1kgPSBtb3VzZUNvcm5lci55ICsgb2Zmc2V0WTtcbiAgICAvL3ZhciBuZXdZID0gZ3JpZC5nZXRSb3dDb3VudCgpO1xuXG4gICAgbmV3WSA9IE1hdGgubWluKG1heFJvd3MsIE1hdGgubWF4KDAsIG5ld1kpKTtcblxuICAgIGdyaWQuY2xlYXJTZWxlY3Rpb25zKCk7XG4gICAgZ3JpZC5zZWxlY3RSb3cobmV3WSk7XG4gICAgZ3JpZC5zZXRNb3VzZURvd24oZ3JpZC5uZXdQb2ludCgwLCBuZXdZKSk7XG4gICAgZ3JpZC5zZXREcmFnRXh0ZW50KGdyaWQubmV3UG9pbnQoMCwgMCkpO1xuXG4gICAgaWYgKGdyaWQuaW5zdXJlTW9kZWxSb3dJc1Zpc2libGUobmV3WSwgb2Zmc2V0WSkpIHtcbiAgICAgICAgdGhpcy5waW5nQXV0b1Njcm9sbCgpO1xuICAgIH1cblxuICAgIGdyaWQuZmlyZVN5bnRoZXRpY1Jvd1NlbGVjdGlvbkNoYW5nZWRFdmVudCgpO1xuICAgIGdyaWQucmVwYWludCgpO1xuXG59O1xuXG5Sb3dTZWxlY3Rpb24ucHJvdG90eXBlLmlzU2luZ2xlUm93U2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJvd1NlbGVjdGlvbjtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICpcbiAqIEBtb2R1bGUgZmVhdHVyZXNcXGJhc2VcbiAqIEBkZXNjcmlwdGlvblxuIGluc3RhbmNlcyBvZiBmZWF0dXJlcyBhcmUgY29ubmVjdGVkIHRvIG9uZSBhbm90aGVyIHRvIG1ha2UgYSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eSBmb3IgaGFuZGxpbmcgYWxsIHRoZSBpbnB1dCB0byB0aGUgaHlwZXJncmlkLlxuICpcbiAqL1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZS5qcycpO1xuXG5mdW5jdGlvbiBUaHVtYndoZWVsU2Nyb2xsaW5nKCkge1xuICAgIEJhc2UuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmFsaWFzID0gJ1RodW1id2hlZWxTY3JvbGxpbmcnO1xufTtcblxuVGh1bWJ3aGVlbFNjcm9sbGluZy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2UucHJvdG90eXBlKTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAaW5zdGFuY2VcbiogQGRlc2NyaXB0aW9uXG4gaGFuZGxlIHRoaXMgZXZlbnQgZG93biB0aGUgZmVhdHVyZSBjaGFpbiBvZiByZXNwb25zaWJpbGl0eVxuICogQHBhcmFtIHtmaW4taHlwZXJncmlkfSBncmlkIC0gW2Zpbi1oeXBlcmdyaWRdKG1vZHVsZS0uX2Zpbi1oeXBlcmdyaWQuaHRtbClcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIHRoZSBldmVudCBkZXRhaWxzXG4qL1xuVGh1bWJ3aGVlbFNjcm9sbGluZy5oYW5kbGVXaGVlbE1vdmVkID0gZnVuY3Rpb24oZ3JpZCwgZSkge1xuICAgIGlmICghZ3JpZC5yZXNvbHZlUHJvcGVydHkoJ3Njcm9sbGluZ0VuYWJsZWQnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBwcmltRXZlbnQgPSBlLnByaW1pdGl2ZUV2ZW50O1xuICAgIHZhciBkZWx0YVkgPSBwcmltRXZlbnQud2hlZWxEZWx0YVkgfHwgLXByaW1FdmVudC5kZWx0YVk7XG4gICAgdmFyIGRlbHRhWCA9IHByaW1FdmVudC53aGVlbERlbHRhWCB8fCAtcHJpbUV2ZW50LmRlbHRhWDtcbiAgICBpZiAoZGVsdGFZID4gMCkge1xuICAgICAgICBncmlkLnNjcm9sbEJ5KDAsIC0xKTtcbiAgICB9IGVsc2UgaWYgKGRlbHRhWSA8IC0wKSB7XG4gICAgICAgIGdyaWQuc2Nyb2xsQnkoMCwgMSk7XG4gICAgfSBlbHNlIGlmIChkZWx0YVggPiAwKSB7XG4gICAgICAgIGdyaWQuc2Nyb2xsQnkoLTEsIDApO1xuICAgIH0gZWxzZSBpZiAoZGVsdGFYIDwgLTApIHtcbiAgICAgICAgZ3JpZC5zY3JvbGxCeSgxLCAwKTtcbiAgICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gVGh1bWJ3aGVlbFNjcm9sbGluZztcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgQ2VsbENsaWNrOiByZXF1aXJlKCcuL0NlbGxDbGljay5qcycpLFxuICAgIENlbGxFZGl0aW5nOiByZXF1aXJlKCcuL0NlbGxFZGl0aW5nLmpzJyksXG4gICAgQ2VsbFNlbGVjdGlvbjogcmVxdWlyZSgnLi9DZWxsU2VsZWN0aW9uLmpzJyksXG4gICAgQ29sdW1uQXV0b3NpemluZzogcmVxdWlyZSgnLi9Db2x1bW5BdXRvc2l6aW5nLmpzJyksXG4gICAgQ29sdW1uTW92aW5nOiByZXF1aXJlKCcuL0NvbHVtbk1vdmluZy5qcycpLFxuICAgIENvbHVtblJlc2l6aW5nOiByZXF1aXJlKCcuL0NvbHVtblJlc2l6aW5nLmpzJyksXG4gICAgQ29sdW1uU2VsZWN0aW9uOiByZXF1aXJlKCcuL0NvbHVtblNlbGVjdGlvbi5qcycpLFxuICAgIENvbHVtblNvcnRpbmc6IHJlcXVpcmUoJy4vQ29sdW1uU29ydGluZy5qcycpLFxuICAgIEZpbHRlcnM6IHJlcXVpcmUoJy4vRmlsdGVycy5qcycpLFxuICAgIEtleVBhZ2luZzogcmVxdWlyZSgnLi9LZXlQYWdpbmcuanMnKSxcbiAgICBPbkhvdmVyOiByZXF1aXJlKCcuL09uSG92ZXIuanMnKSxcbiAgICBPdmVybGF5OiByZXF1aXJlKCcuL092ZXJsYXkuanMnKSxcbiAgICBSb3dSZXNpemluZzogcmVxdWlyZSgnLi9Sb3dSZXNpemluZy5qcycpLFxuICAgIFJvd1NlbGVjdGlvbjogcmVxdWlyZSgnLi9Sb3dTZWxlY3Rpb24uanMnKSxcbiAgICBUaHVtYndoZWVsU2Nyb2xsaW5nOiByZXF1aXJlKCcuL1RodW1id2hlZWxTY3JvbGxpbmcuanMnKVxufTtcblxuIiwiLyogZXNsaW50LWVudiBub2RlLCBicm93c2VyICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBucyA9ICh3aW5kb3cuZmluID0gd2luZG93LmZpbiB8fCB7fSlcbiAgICAuaHlwZXJncmlkID0gd2luZG93LmZpbi5oeXBlcmdyaWQgfHwge307XG5cbm5zLmJlaGF2aW9ycyA9IHJlcXVpcmUoJy4vYmVoYXZpb3JzL2JlaGF2aW9ycy5qcycpO1xubnMuY2VsbEVkaXRvcnMgPSByZXF1aXJlKCcuL2NlbGxFZGl0b3JzL2NlbGxFZGl0b3JzLmpzJyk7XG5ucy5kYXRhTW9kZWxzID0gcmVxdWlyZSgnLi9kYXRhTW9kZWxzL2RhdGFNb2RlbHMuanMnKTtcbm5zLmZlYXR1cmVzID0gcmVxdWlyZSgnLi9mZWF0dXJlcy9mZWF0dXJlcy5qcycpO1xubnMuQ2VsbFByb3ZpZGVyID0gcmVxdWlyZSgnLi9DZWxsUHJvdmlkZXInKTtcbm5zLlJlbmRlcmVyID0gcmVxdWlyZSgnLi9SZW5kZXJlcicpO1xubnMuU2VsZWN0aW9uTW9kZWwgPSByZXF1aXJlKCcuL1NlbGVjdGlvbk1vZGVsJyk7XG5ucy5MUlVDYWNoZSA9IHJlcXVpcmUoJ2xydS1jYWNoZScpO1xuIl19
