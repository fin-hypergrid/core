(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                throw new Error("Cannot find module '" + o + "'")
            }
            var f = n[o] = {
                exports: {}
            };
            t[o][0].call(f.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, f, f.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
})({
    1: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            /*!
             * The buffer module from node.js, for the browser.
             *
             * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
             * @license  MIT
             */

            var base64 = require('base64-js')
            var ieee754 = require('ieee754')

            exports.Buffer = Buffer
            exports.SlowBuffer = Buffer
            exports.INSPECT_MAX_BYTES = 50
            Buffer.poolSize = 8192

            /**
             * If `Buffer._useTypedArrays`:
             *   === true    Use Uint8Array implementation (fastest)
             *   === false   Use Object implementation (compatible down to IE6)
             */
            Buffer._useTypedArrays = (function() {
                // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
                // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
                // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
                // because we need to be able to add all the node Buffer API methods. This is an issue
                // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
                try {
                    var buf = new ArrayBuffer(0)
                    var arr = new Uint8Array(buf)
                    arr.foo = function() {
                        return 42
                    }
                    return 42 === arr.foo() &&
                        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
                } catch (e) {
                    return false
                }
            })()

            /**
             * Class: Buffer
             * =============
             *
             * The Buffer constructor returns instances of `Uint8Array` that are augmented
             * with function properties for all the node `Buffer` API functions. We use
             * `Uint8Array` so that square bracket notation works as expected -- it returns
             * a single octet.
             *
             * By augmenting the instances, we can avoid modifying the `Uint8Array`
             * prototype.
             */
            function Buffer(subject, encoding, noZero) {
                if (!(this instanceof Buffer))
                    return new Buffer(subject, encoding, noZero)

                var type = typeof subject

                // Workaround: node's base64 implementation allows for non-padded strings
                // while base64-js does not.
                if (encoding === 'base64' && type === 'string') {
                    subject = stringtrim(subject)
                    while (subject.length % 4 !== 0) {
                        subject = subject + '='
                    }
                }

                // Find the length
                var length
                if (type === 'number')
                    length = coerce(subject)
                else if (type === 'string')
                    length = Buffer.byteLength(subject, encoding)
                else if (type === 'object')
                    length = coerce(subject.length) // assume that object is array-like
                else
                    throw new Error('First argument needs to be a number, array or string.')

                var buf
                if (Buffer._useTypedArrays) {
                    // Preferred: Return an augmented `Uint8Array` instance for best performance
                    buf = Buffer._augment(new Uint8Array(length))
                } else {
                    // Fallback: Return THIS instance of Buffer (created by `new`)
                    buf = this
                    buf.length = length
                    buf._isBuffer = true
                }

                var i
                if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
                    // Speed optimization -- use set if we're copying from a typed array
                    buf._set(subject)
                } else if (isArrayish(subject)) {
                    // Treat array-ish objects as a byte array
                    for (i = 0; i < length; i++) {
                        if (Buffer.isBuffer(subject))
                            buf[i] = subject.readUInt8(i)
                        else
                            buf[i] = subject[i]
                    }
                } else if (type === 'string') {
                    buf.write(subject, 0, encoding)
                } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
                    for (i = 0; i < length; i++) {
                        buf[i] = 0
                    }
                }

                return buf
            }

            // STATIC METHODS
            // ==============

            Buffer.isEncoding = function(encoding) {
                switch (String(encoding).toLowerCase()) {
                    case 'hex':
                    case 'utf8':
                    case 'utf-8':
                    case 'ascii':
                    case 'binary':
                    case 'base64':
                    case 'raw':
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                        return true
                    default:
                        return false
                }
            }

            Buffer.isBuffer = function(b) {
                return !!(b !== null && b !== undefined && b._isBuffer)
            }

            Buffer.byteLength = function(str, encoding) {
                var ret
                str = str + ''
                switch (encoding || 'utf8') {
                    case 'hex':
                        ret = str.length / 2
                        break
                    case 'utf8':
                    case 'utf-8':
                        ret = utf8ToBytes(str).length
                        break
                    case 'ascii':
                    case 'binary':
                    case 'raw':
                        ret = str.length
                        break
                    case 'base64':
                        ret = base64ToBytes(str).length
                        break
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                        ret = str.length * 2
                        break
                    default:
                        throw new Error('Unknown encoding')
                }
                return ret
            }

            Buffer.concat = function(list, totalLength) {
                assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
                    'list should be an Array.')

                if (list.length === 0) {
                    return new Buffer(0)
                } else if (list.length === 1) {
                    return list[0]
                }

                var i
                if (typeof totalLength !== 'number') {
                    totalLength = 0
                    for (i = 0; i < list.length; i++) {
                        totalLength += list[i].length
                    }
                }

                var buf = new Buffer(totalLength)
                var pos = 0
                for (i = 0; i < list.length; i++) {
                    var item = list[i]
                    item.copy(buf, pos)
                    pos += item.length
                }
                return buf
            }

            // BUFFER INSTANCE METHODS
            // =======================

            function _hexWrite(buf, string, offset, length) {
                offset = Number(offset) || 0
                var remaining = buf.length - offset
                if (!length) {
                    length = remaining
                } else {
                    length = Number(length)
                    if (length > remaining) {
                        length = remaining
                    }
                }

                // must be an even number of digits
                var strLen = string.length
                assert(strLen % 2 === 0, 'Invalid hex string')

                if (length > strLen / 2) {
                    length = strLen / 2
                }
                for (var i = 0; i < length; i++) {
                    var byte = parseInt(string.substr(i * 2, 2), 16)
                    assert(!isNaN(byte), 'Invalid hex string')
                    buf[offset + i] = byte
                }
                Buffer._charsWritten = i * 2
                return i
            }

            function _utf8Write(buf, string, offset, length) {
                var charsWritten = Buffer._charsWritten =
                    blitBuffer(utf8ToBytes(string), buf, offset, length)
                return charsWritten
            }

            function _asciiWrite(buf, string, offset, length) {
                var charsWritten = Buffer._charsWritten =
                    blitBuffer(asciiToBytes(string), buf, offset, length)
                return charsWritten
            }

            function _binaryWrite(buf, string, offset, length) {
                return _asciiWrite(buf, string, offset, length)
            }

            function _base64Write(buf, string, offset, length) {
                var charsWritten = Buffer._charsWritten =
                    blitBuffer(base64ToBytes(string), buf, offset, length)
                return charsWritten
            }

            function _utf16leWrite(buf, string, offset, length) {
                var charsWritten = Buffer._charsWritten =
                    blitBuffer(utf16leToBytes(string), buf, offset, length)
                return charsWritten
            }

            Buffer.prototype.write = function(string, offset, length, encoding) {
                // Support both (string, offset, length, encoding)
                // and the legacy (string, encoding, offset, length)
                if (isFinite(offset)) {
                    if (!isFinite(length)) {
                        encoding = length
                        length = undefined
                    }
                } else { // legacy
                    var swap = encoding
                    encoding = offset
                    offset = length
                    length = swap
                }

                offset = Number(offset) || 0
                var remaining = this.length - offset
                if (!length) {
                    length = remaining
                } else {
                    length = Number(length)
                    if (length > remaining) {
                        length = remaining
                    }
                }
                encoding = String(encoding || 'utf8').toLowerCase()

                var ret
                switch (encoding) {
                    case 'hex':
                        ret = _hexWrite(this, string, offset, length)
                        break
                    case 'utf8':
                    case 'utf-8':
                        ret = _utf8Write(this, string, offset, length)
                        break
                    case 'ascii':
                        ret = _asciiWrite(this, string, offset, length)
                        break
                    case 'binary':
                        ret = _binaryWrite(this, string, offset, length)
                        break
                    case 'base64':
                        ret = _base64Write(this, string, offset, length)
                        break
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                        ret = _utf16leWrite(this, string, offset, length)
                        break
                    default:
                        throw new Error('Unknown encoding')
                }
                return ret
            }

            Buffer.prototype.toString = function(encoding, start, end) {
                var self = this

                encoding = String(encoding || 'utf8').toLowerCase()
                start = Number(start) || 0
                end = (end !== undefined) ? Number(end) : end = self.length

                // Fastpath empty strings
                if (end === start)
                    return ''

                var ret
                switch (encoding) {
                    case 'hex':
                        ret = _hexSlice(self, start, end)
                        break
                    case 'utf8':
                    case 'utf-8':
                        ret = _utf8Slice(self, start, end)
                        break
                    case 'ascii':
                        ret = _asciiSlice(self, start, end)
                        break
                    case 'binary':
                        ret = _binarySlice(self, start, end)
                        break
                    case 'base64':
                        ret = _base64Slice(self, start, end)
                        break
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                        ret = _utf16leSlice(self, start, end)
                        break
                    default:
                        throw new Error('Unknown encoding')
                }
                return ret
            }

            Buffer.prototype.toJSON = function() {
                return {
                    type: 'Buffer',
                    data: Array.prototype.slice.call(this._arr || this, 0)
                }
            }

            // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
            Buffer.prototype.copy = function(target, target_start, start, end) {
                var source = this

                if (!start) start = 0
                if (!end && end !== 0) end = this.length
                if (!target_start) target_start = 0

                // Copy 0 bytes; we're done
                if (end === start) return
                if (target.length === 0 || source.length === 0) return

                // Fatal error conditions
                assert(end >= start, 'sourceEnd < sourceStart')
                assert(target_start >= 0 && target_start < target.length,
                    'targetStart out of bounds')
                assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
                assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

                // Are we oob?
                if (end > this.length)
                    end = this.length
                if (target.length - target_start < end - start)
                    end = target.length - target_start + start

                var len = end - start

                if (len < 100 || !Buffer._useTypedArrays) {
                    for (var i = 0; i < len; i++)
                        target[i + target_start] = this[i + start]
                } else {
                    target._set(this.subarray(start, start + len), target_start)
                }
            }

            function _base64Slice(buf, start, end) {
                if (start === 0 && end === buf.length) {
                    return base64.fromByteArray(buf)
                } else {
                    return base64.fromByteArray(buf.slice(start, end))
                }
            }

            function _utf8Slice(buf, start, end) {
                var res = ''
                var tmp = ''
                end = Math.min(buf.length, end)

                for (var i = start; i < end; i++) {
                    if (buf[i] <= 0x7F) {
                        res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
                        tmp = ''
                    } else {
                        tmp += '%' + buf[i].toString(16)
                    }
                }

                return res + decodeUtf8Char(tmp)
            }

            function _asciiSlice(buf, start, end) {
                var ret = ''
                end = Math.min(buf.length, end)

                for (var i = start; i < end; i++)
                    ret += String.fromCharCode(buf[i])
                return ret
            }

            function _binarySlice(buf, start, end) {
                return _asciiSlice(buf, start, end)
            }

            function _hexSlice(buf, start, end) {
                var len = buf.length

                if (!start || start < 0) start = 0
                if (!end || end < 0 || end > len) end = len

                var out = ''
                for (var i = start; i < end; i++) {
                    out += toHex(buf[i])
                }
                return out
            }

            function _utf16leSlice(buf, start, end) {
                var bytes = buf.slice(start, end)
                var res = ''
                for (var i = 0; i < bytes.length; i += 2) {
                    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
                }
                return res
            }

            Buffer.prototype.slice = function(start, end) {
                var len = this.length
                start = clamp(start, len, 0)
                end = clamp(end, len, len)

                if (Buffer._useTypedArrays) {
                    return Buffer._augment(this.subarray(start, end))
                } else {
                    var sliceLen = end - start
                    var newBuf = new Buffer(sliceLen, undefined, true)
                    for (var i = 0; i < sliceLen; i++) {
                        newBuf[i] = this[i + start]
                    }
                    return newBuf
                }
            }

            // `get` will be removed in Node 0.13+
            Buffer.prototype.get = function(offset) {
                console.log('.get() is deprecated. Access using array indexes instead.')
                return this.readUInt8(offset)
            }

            // `set` will be removed in Node 0.13+
            Buffer.prototype.set = function(v, offset) {
                console.log('.set() is deprecated. Access using array indexes instead.')
                return this.writeUInt8(v, offset)
            }

            Buffer.prototype.readUInt8 = function(offset, noAssert) {
                if (!noAssert) {
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset < this.length, 'Trying to read beyond buffer length')
                }

                if (offset >= this.length)
                    return

                return this[offset]
            }

            function _readUInt16(buf, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
                }

                var len = buf.length
                if (offset >= len)
                    return

                var val
                if (littleEndian) {
                    val = buf[offset]
                    if (offset + 1 < len)
                        val |= buf[offset + 1] << 8
                } else {
                    val = buf[offset] << 8
                    if (offset + 1 < len)
                        val |= buf[offset + 1]
                }
                return val
            }

            Buffer.prototype.readUInt16LE = function(offset, noAssert) {
                return _readUInt16(this, offset, true, noAssert)
            }

            Buffer.prototype.readUInt16BE = function(offset, noAssert) {
                return _readUInt16(this, offset, false, noAssert)
            }

            function _readUInt32(buf, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
                }

                var len = buf.length
                if (offset >= len)
                    return

                var val
                if (littleEndian) {
                    if (offset + 2 < len)
                        val = buf[offset + 2] << 16
                    if (offset + 1 < len)
                        val |= buf[offset + 1] << 8
                    val |= buf[offset]
                    if (offset + 3 < len)
                        val = val + (buf[offset + 3] << 24 >>> 0)
                } else {
                    if (offset + 1 < len)
                        val = buf[offset + 1] << 16
                    if (offset + 2 < len)
                        val |= buf[offset + 2] << 8
                    if (offset + 3 < len)
                        val |= buf[offset + 3]
                    val = val + (buf[offset] << 24 >>> 0)
                }
                return val
            }

            Buffer.prototype.readUInt32LE = function(offset, noAssert) {
                return _readUInt32(this, offset, true, noAssert)
            }

            Buffer.prototype.readUInt32BE = function(offset, noAssert) {
                return _readUInt32(this, offset, false, noAssert)
            }

            Buffer.prototype.readInt8 = function(offset, noAssert) {
                if (!noAssert) {
                    assert(offset !== undefined && offset !== null,
                        'missing offset')
                    assert(offset < this.length, 'Trying to read beyond buffer length')
                }

                if (offset >= this.length)
                    return

                var neg = this[offset] & 0x80
                if (neg)
                    return (0xff - this[offset] + 1) * -1
                else
                    return this[offset]
            }

            function _readInt16(buf, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
                }

                var len = buf.length
                if (offset >= len)
                    return

                var val = _readUInt16(buf, offset, littleEndian, true)
                var neg = val & 0x8000
                if (neg)
                    return (0xffff - val + 1) * -1
                else
                    return val
            }

            Buffer.prototype.readInt16LE = function(offset, noAssert) {
                return _readInt16(this, offset, true, noAssert)
            }

            Buffer.prototype.readInt16BE = function(offset, noAssert) {
                return _readInt16(this, offset, false, noAssert)
            }

            function _readInt32(buf, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
                }

                var len = buf.length
                if (offset >= len)
                    return

                var val = _readUInt32(buf, offset, littleEndian, true)
                var neg = val & 0x80000000
                if (neg)
                    return (0xffffffff - val + 1) * -1
                else
                    return val
            }

            Buffer.prototype.readInt32LE = function(offset, noAssert) {
                return _readInt32(this, offset, true, noAssert)
            }

            Buffer.prototype.readInt32BE = function(offset, noAssert) {
                return _readInt32(this, offset, false, noAssert)
            }

            function _readFloat(buf, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
                }

                return ieee754.read(buf, offset, littleEndian, 23, 4)
            }

            Buffer.prototype.readFloatLE = function(offset, noAssert) {
                return _readFloat(this, offset, true, noAssert)
            }

            Buffer.prototype.readFloatBE = function(offset, noAssert) {
                return _readFloat(this, offset, false, noAssert)
            }

            function _readDouble(buf, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
                }

                return ieee754.read(buf, offset, littleEndian, 52, 8)
            }

            Buffer.prototype.readDoubleLE = function(offset, noAssert) {
                return _readDouble(this, offset, true, noAssert)
            }

            Buffer.prototype.readDoubleBE = function(offset, noAssert) {
                return _readDouble(this, offset, false, noAssert)
            }

            Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
                if (!noAssert) {
                    assert(value !== undefined && value !== null, 'missing value')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset < this.length, 'trying to write beyond buffer length')
                    verifuint(value, 0xff)
                }

                if (offset >= this.length) return

                this[offset] = value
            }

            function _writeUInt16(buf, value, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(value !== undefined && value !== null, 'missing value')
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
                    verifuint(value, 0xffff)
                }

                var len = buf.length
                if (offset >= len)
                    return

                for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
                    buf[offset + i] =
                        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
                        (littleEndian ? i : 1 - i) * 8
                }
            }

            Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
                _writeUInt16(this, value, offset, true, noAssert)
            }

            Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
                _writeUInt16(this, value, offset, false, noAssert)
            }

            function _writeUInt32(buf, value, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(value !== undefined && value !== null, 'missing value')
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
                    verifuint(value, 0xffffffff)
                }

                var len = buf.length
                if (offset >= len)
                    return

                for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
                    buf[offset + i] =
                        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
                }
            }

            Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
                _writeUInt32(this, value, offset, true, noAssert)
            }

            Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
                _writeUInt32(this, value, offset, false, noAssert)
            }

            Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
                if (!noAssert) {
                    assert(value !== undefined && value !== null, 'missing value')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset < this.length, 'Trying to write beyond buffer length')
                    verifsint(value, 0x7f, -0x80)
                }

                if (offset >= this.length)
                    return

                if (value >= 0)
                    this.writeUInt8(value, offset, noAssert)
                else
                    this.writeUInt8(0xff + value + 1, offset, noAssert)
            }

            function _writeInt16(buf, value, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(value !== undefined && value !== null, 'missing value')
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
                    verifsint(value, 0x7fff, -0x8000)
                }

                var len = buf.length
                if (offset >= len)
                    return

                if (value >= 0)
                    _writeUInt16(buf, value, offset, littleEndian, noAssert)
                else
                    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
            }

            Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
                _writeInt16(this, value, offset, true, noAssert)
            }

            Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
                _writeInt16(this, value, offset, false, noAssert)
            }

            function _writeInt32(buf, value, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(value !== undefined && value !== null, 'missing value')
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
                    verifsint(value, 0x7fffffff, -0x80000000)
                }

                var len = buf.length
                if (offset >= len)
                    return

                if (value >= 0)
                    _writeUInt32(buf, value, offset, littleEndian, noAssert)
                else
                    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
            }

            Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
                _writeInt32(this, value, offset, true, noAssert)
            }

            Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
                _writeInt32(this, value, offset, false, noAssert)
            }

            function _writeFloat(buf, value, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(value !== undefined && value !== null, 'missing value')
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
                    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
                }

                var len = buf.length
                if (offset >= len)
                    return

                ieee754.write(buf, value, offset, littleEndian, 23, 4)
            }

            Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
                _writeFloat(this, value, offset, true, noAssert)
            }

            Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
                _writeFloat(this, value, offset, false, noAssert)
            }

            function _writeDouble(buf, value, offset, littleEndian, noAssert) {
                if (!noAssert) {
                    assert(value !== undefined && value !== null, 'missing value')
                    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
                    assert(offset !== undefined && offset !== null, 'missing offset')
                    assert(offset + 7 < buf.length,
                        'Trying to write beyond buffer length')
                    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
                }

                var len = buf.length
                if (offset >= len)
                    return

                ieee754.write(buf, value, offset, littleEndian, 52, 8)
            }

            Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
                _writeDouble(this, value, offset, true, noAssert)
            }

            Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
                _writeDouble(this, value, offset, false, noAssert)
            }

            // fill(value, start=0, end=buffer.length)
            Buffer.prototype.fill = function(value, start, end) {
                if (!value) value = 0
                if (!start) start = 0
                if (!end) end = this.length

                if (typeof value === 'string') {
                    value = value.charCodeAt(0)
                }

                assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
                assert(end >= start, 'end < start')

                // Fill 0 bytes; we're done
                if (end === start) return
                if (this.length === 0) return

                assert(start >= 0 && start < this.length, 'start out of bounds')
                assert(end >= 0 && end <= this.length, 'end out of bounds')

                for (var i = start; i < end; i++) {
                    this[i] = value
                }
            }

            Buffer.prototype.inspect = function() {
                var out = []
                var len = this.length
                for (var i = 0; i < len; i++) {
                    out[i] = toHex(this[i])
                    if (i === exports.INSPECT_MAX_BYTES) {
                        out[i + 1] = '...'
                        break
                    }
                }
                return '<Buffer ' + out.join(' ') + '>'
            }

            /**
             * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
             * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
             */
            Buffer.prototype.toArrayBuffer = function() {
                if (typeof Uint8Array !== 'undefined') {
                    if (Buffer._useTypedArrays) {
                        return (new Buffer(this)).buffer
                    } else {
                        var buf = new Uint8Array(this.length)
                        for (var i = 0, len = buf.length; i < len; i += 1)
                            buf[i] = this[i]
                        return buf.buffer
                    }
                } else {
                    throw new Error('Buffer.toArrayBuffer not supported in this browser')
                }
            }

            // HELPER FUNCTIONS
            // ================

            function stringtrim(str) {
                if (str.trim) return str.trim()
                return str.replace(/^\s+|\s+$/g, '')
            }

            var BP = Buffer.prototype

            /**
             * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
             */
            Buffer._augment = function(arr) {
                arr._isBuffer = true

                // save reference to original Uint8Array get/set methods before overwriting
                arr._get = arr.get
                arr._set = arr.set

                // deprecated, will be removed in node 0.13+
                arr.get = BP.get
                arr.set = BP.set

                arr.write = BP.write
                arr.toString = BP.toString
                arr.toLocaleString = BP.toString
                arr.toJSON = BP.toJSON
                arr.copy = BP.copy
                arr.slice = BP.slice
                arr.readUInt8 = BP.readUInt8
                arr.readUInt16LE = BP.readUInt16LE
                arr.readUInt16BE = BP.readUInt16BE
                arr.readUInt32LE = BP.readUInt32LE
                arr.readUInt32BE = BP.readUInt32BE
                arr.readInt8 = BP.readInt8
                arr.readInt16LE = BP.readInt16LE
                arr.readInt16BE = BP.readInt16BE
                arr.readInt32LE = BP.readInt32LE
                arr.readInt32BE = BP.readInt32BE
                arr.readFloatLE = BP.readFloatLE
                arr.readFloatBE = BP.readFloatBE
                arr.readDoubleLE = BP.readDoubleLE
                arr.readDoubleBE = BP.readDoubleBE
                arr.writeUInt8 = BP.writeUInt8
                arr.writeUInt16LE = BP.writeUInt16LE
                arr.writeUInt16BE = BP.writeUInt16BE
                arr.writeUInt32LE = BP.writeUInt32LE
                arr.writeUInt32BE = BP.writeUInt32BE
                arr.writeInt8 = BP.writeInt8
                arr.writeInt16LE = BP.writeInt16LE
                arr.writeInt16BE = BP.writeInt16BE
                arr.writeInt32LE = BP.writeInt32LE
                arr.writeInt32BE = BP.writeInt32BE
                arr.writeFloatLE = BP.writeFloatLE
                arr.writeFloatBE = BP.writeFloatBE
                arr.writeDoubleLE = BP.writeDoubleLE
                arr.writeDoubleBE = BP.writeDoubleBE
                arr.fill = BP.fill
                arr.inspect = BP.inspect
                arr.toArrayBuffer = BP.toArrayBuffer

                return arr
            }

            // slice(start, end)
            function clamp(index, len, defaultValue) {
                if (typeof index !== 'number') return defaultValue
                index = ~~index; // Coerce to integer.
                if (index >= len) return len
                if (index >= 0) return index
                index += len
                if (index >= 0) return index
                return 0
            }

            function coerce(length) {
                // Coerce length to a number (possibly NaN), round up
                // in case it's fractional (e.g. 123.456) then do a
                // double negate to coerce a NaN to 0. Easy, right?
                length = ~~Math.ceil(+length)
                return length < 0 ? 0 : length
            }

            function isArray(subject) {
                return (Array.isArray || function(subject) {
                    return Object.prototype.toString.call(subject) === '[object Array]'
                })(subject)
            }

            function isArrayish(subject) {
                return isArray(subject) || Buffer.isBuffer(subject) ||
                    subject && typeof subject === 'object' &&
                    typeof subject.length === 'number'
            }

            function toHex(n) {
                if (n < 16) return '0' + n.toString(16)
                return n.toString(16)
            }

            function utf8ToBytes(str) {
                var byteArray = []
                for (var i = 0; i < str.length; i++) {
                    var b = str.charCodeAt(i)
                    if (b <= 0x7F)
                        byteArray.push(str.charCodeAt(i))
                    else {
                        var start = i
                        if (b >= 0xD800 && b <= 0xDFFF) i++
                            var h = encodeURIComponent(str.slice(start, i + 1)).substr(1).split('%')
                        for (var j = 0; j < h.length; j++)
                            byteArray.push(parseInt(h[j], 16))
                    }
                }
                return byteArray
            }

            function asciiToBytes(str) {
                var byteArray = []
                for (var i = 0; i < str.length; i++) {
                    // Node's code seems to be doing this and not & 0x7F..
                    byteArray.push(str.charCodeAt(i) & 0xFF)
                }
                return byteArray
            }

            function utf16leToBytes(str) {
                var c, hi, lo
                var byteArray = []
                for (var i = 0; i < str.length; i++) {
                    c = str.charCodeAt(i)
                    hi = c >> 8
                    lo = c % 256
                    byteArray.push(lo)
                    byteArray.push(hi)
                }

                return byteArray
            }

            function base64ToBytes(str) {
                return base64.toByteArray(str)
            }

            function blitBuffer(src, dst, offset, length) {
                var pos
                for (var i = 0; i < length; i++) {
                    if ((i + offset >= dst.length) || (i >= src.length))
                        break
                    dst[i + offset] = src[i]
                }
                return i
            }

            function decodeUtf8Char(str) {
                try {
                    return decodeURIComponent(str)
                } catch (err) {
                    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
                }
            }

            /*
             * We have to make sure that the value is a valid integer. This means that it
             * is non-negative. It has no fractional component and that it does not
             * exceed the maximum allowed value.
             */
            function verifuint(value, max) {
                assert(typeof value === 'number', 'cannot write a non-number as a number')
                assert(value >= 0, 'specified a negative value for writing an unsigned value')
                assert(value <= max, 'value is larger than maximum value for type')
                assert(Math.floor(value) === value, 'value has a fractional component')
            }

            function verifsint(value, max, min) {
                assert(typeof value === 'number', 'cannot write a non-number as a number')
                assert(value <= max, 'value larger than maximum allowed value')
                assert(value >= min, 'value smaller than minimum allowed value')
                assert(Math.floor(value) === value, 'value has a fractional component')
            }

            function verifIEEE754(value, max, min) {
                assert(typeof value === 'number', 'cannot write a non-number as a number')
                assert(value <= max, 'value larger than maximum allowed value')
                assert(value >= min, 'value smaller than minimum allowed value')
            }

            function assert(test, message) {
                if (!test) throw new Error(message || 'Failed assertion')
            }

        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/index.js", "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer")
    }, {
        "base64-js": 2,
        "buffer": 1,
        "ieee754": 3,
        "oMfpAn": 4
    }],
    2: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

            ;
            (function(exports) {
                'use strict';

                var Arr = (typeof Uint8Array !== 'undefined') ? Uint8Array : Array

                var PLUS = '+'.charCodeAt(0)
                var SLASH = '/'.charCodeAt(0)
                var NUMBER = '0'.charCodeAt(0)
                var LOWER = 'a'.charCodeAt(0)
                var UPPER = 'A'.charCodeAt(0)
                var PLUS_URL_SAFE = '-'.charCodeAt(0)
                var SLASH_URL_SAFE = '_'.charCodeAt(0)

                function decode(elt) {
                    var code = elt.charCodeAt(0)
                    if (code === PLUS ||
                        code === PLUS_URL_SAFE)
                        return 62 // '+'
                    if (code === SLASH ||
                        code === SLASH_URL_SAFE)
                        return 63 // '/'
                    if (code < NUMBER)
                        return -1 //no match
                    if (code < NUMBER + 10)
                        return code - NUMBER + 26 + 26
                    if (code < UPPER + 26)
                        return code - UPPER
                    if (code < LOWER + 26)
                        return code - LOWER + 26
                }

                function b64ToByteArray(b64) {
                    var i, j, l, tmp, placeHolders, arr

                    if (b64.length % 4 > 0) {
                        throw new Error('Invalid string. Length must be a multiple of 4')
                    }

                    // the number of equal signs (place holders)
                    // if there are two placeholders, than the two characters before it
                    // represent one byte
                    // if there is only one, then the three characters before it represent 2 bytes
                    // this is just a cheap hack to not do indexOf twice
                    var len = b64.length
                    placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

                    // base64 is 4/3 + up to two characters of the original data
                    arr = new Arr(b64.length * 3 / 4 - placeHolders)

                    // if there are placeholders, only get up to the last complete 4 chars
                    l = placeHolders > 0 ? b64.length - 4 : b64.length

                    var L = 0

                    function push(v) {
                        arr[L++] = v
                    }

                    for (i = 0, j = 0; i < l; i += 4, j += 3) {
                        tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
                        push((tmp & 0xFF0000) >> 16)
                        push((tmp & 0xFF00) >> 8)
                        push(tmp & 0xFF)
                    }

                    if (placeHolders === 2) {
                        tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
                        push(tmp & 0xFF)
                    } else if (placeHolders === 1) {
                        tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
                        push((tmp >> 8) & 0xFF)
                        push(tmp & 0xFF)
                    }

                    return arr
                }

                function uint8ToBase64(uint8) {
                    var i,
                        extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
                        output = "",
                        temp, length

                    function encode(num) {
                        return lookup.charAt(num)
                    }

                    function tripletToBase64(num) {
                        return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
                    }

                    // go through the array every three bytes, we'll deal with trailing stuff later
                    for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
                        temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
                        output += tripletToBase64(temp)
                    }

                    // pad the end with zeros, but make sure to not forget the extra bytes
                    switch (extraBytes) {
                        case 1:
                            temp = uint8[uint8.length - 1]
                            output += encode(temp >> 2)
                            output += encode((temp << 4) & 0x3F)
                            output += '=='
                            break
                        case 2:
                            temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
                            output += encode(temp >> 10)
                            output += encode((temp >> 4) & 0x3F)
                            output += encode((temp << 2) & 0x3F)
                            output += '='
                            break
                    }

                    return output
                }

                exports.toByteArray = b64ToByteArray
                exports.fromByteArray = uint8ToBase64
            }(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js", "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib")
    }, {
        "buffer": 1,
        "oMfpAn": 4
    }],
    3: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            exports.read = function(buffer, offset, isLE, mLen, nBytes) {
                var e, m
                var eLen = nBytes * 8 - mLen - 1
                var eMax = (1 << eLen) - 1
                var eBias = eMax >> 1
                var nBits = -7
                var i = isLE ? (nBytes - 1) : 0
                var d = isLE ? -1 : 1
                var s = buffer[offset + i]

                i += d

                e = s & ((1 << (-nBits)) - 1)
                s >>= (-nBits)
                nBits += eLen
                for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

                m = e & ((1 << (-nBits)) - 1)
                e >>= (-nBits)
                nBits += mLen
                for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

                if (e === 0) {
                    e = 1 - eBias
                } else if (e === eMax) {
                    return m ? NaN : ((s ? -1 : 1) * Infinity)
                } else {
                    m = m + Math.pow(2, mLen)
                    e = e - eBias
                }
                return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
            }

            exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
                var e, m, c
                var eLen = nBytes * 8 - mLen - 1
                var eMax = (1 << eLen) - 1
                var eBias = eMax >> 1
                var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
                var i = isLE ? 0 : (nBytes - 1)
                var d = isLE ? 1 : -1
                var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

                value = Math.abs(value)

                if (isNaN(value) || value === Infinity) {
                    m = isNaN(value) ? 1 : 0
                    e = eMax
                } else {
                    e = Math.floor(Math.log(value) / Math.LN2)
                    if (value * (c = Math.pow(2, -e)) < 1) {
                        e--
                        c *= 2
                    }
                    if (e + eBias >= 1) {
                        value += rt / c
                    } else {
                        value += rt * Math.pow(2, 1 - eBias)
                    }
                    if (value * c >= 2) {
                        e++
                        c /= 2
                    }

                    if (e + eBias >= eMax) {
                        m = 0
                        e = eMax
                    } else if (e + eBias >= 1) {
                        m = (value * c - 1) * Math.pow(2, mLen)
                        e = e + eBias
                    } else {
                        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
                        e = 0
                    }
                }

                for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

                e = (e << mLen) | m
                eLen += mLen
                for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

                buffer[offset + i - d] |= s * 128
            }

        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js", "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754")
    }, {
        "buffer": 1,
        "oMfpAn": 4
    }],
    4: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            // shim for using process in browser

            var process = module.exports = {};

            process.nextTick = (function() {
                var canSetImmediate = typeof window !== 'undefined' && window.setImmediate;
                var canPost = typeof window !== 'undefined' && window.postMessage && window.addEventListener;

                if (canSetImmediate) {
                    return function(f) {
                        return window.setImmediate(f)
                    };
                }

                if (canPost) {
                    var queue = [];
                    window.addEventListener('message', function(ev) {
                        var source = ev.source;
                        if ((source === window || source === null) && ev.data === 'process-tick') {
                            ev.stopPropagation();
                            if (queue.length > 0) {
                                var fn = queue.shift();
                                fn();
                            }
                        }
                    }, true);

                    return function nextTick(fn) {
                        queue.push(fn);
                        window.postMessage('process-tick', '*');
                    };
                }

                return function nextTick(fn) {
                    setTimeout(fn, 0);
                };
            })();

            process.title = 'browser';
            process.browser = true;
            process.env = {};
            process.argv = [];

            function noop() {}

            process.on = noop;
            process.addListener = noop;
            process.once = noop;
            process.off = noop;
            process.removeListener = noop;
            process.removeAllListeners = noop;
            process.emit = noop;

            process.binding = function(name) {
                throw new Error('process.binding is not supported');
            }

            // TODO(shtylman)
            process.cwd = function() {
                return '/'
            };
            process.chdir = function(dir) {
                throw new Error('process.chdir is not supported');
            };

        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/process/browser.js", "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/process")
    }, {
        "buffer": 1,
        "oMfpAn": 4
    }],
    5: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            /*!
             * Object.observe polyfill - v0.2.4
             * by Massimo Artizzu (MaxArt2501)
             * 
             * https://github.com/MaxArt2501/object-observe
             * 
             * Licensed under the MIT License
             * See LICENSE for details
             */

            // Some type definitions
            /**
             * This represents the data relative to an observed object
             * @typedef  {Object}                     ObjectData
             * @property {Map<Handler, HandlerData>}  handlers
             * @property {String[]}                   properties
             * @property {*[]}                        values
             * @property {Descriptor[]}               descriptors
             * @property {Notifier}                   notifier
             * @property {Boolean}                    frozen
             * @property {Boolean}                    extensible
             * @property {Object}                     proto
             */
            /**
             * Function definition of a handler
             * @callback Handler
             * @param {ChangeRecord[]}                changes
             */
            /**
             * This represents the data relative to an observed object and one of its
             * handlers
             * @typedef  {Object}                     HandlerData
             * @property {Map<Object, ObservedData>}  observed
             * @property {ChangeRecord[]}             changeRecords
             */
            /**
             * @typedef  {Object}                     ObservedData
             * @property {String[]}                   acceptList
             * @property {ObjectData}                 data
             */
            /**
             * Type definition for a change. Any other property can be added using
             * the notify() or performChange() methods of the notifier.
             * @typedef  {Object}                     ChangeRecord
             * @property {String}                     type
             * @property {Object}                     object
             * @property {String}                     [name]
             * @property {*}                          [oldValue]
             * @property {Number}                     [index]
             */
            /**
             * Type definition for a notifier (what Object.getNotifier returns)
             * @typedef  {Object}                     Notifier
             * @property {Function}                   notify
             * @property {Function}                   performChange
             */
            /**
             * Function called with Notifier.performChange. It may optionally return a
             * ChangeRecord that gets automatically notified, but `type` and `object`
             * properties are overridden.
             * @callback Performer
             * @returns {ChangeRecord|undefined}
             */

            Object.observe || (function(O, A, root) {
                "use strict";

                /**
                 * Relates observed objects and their data
                 * @type {Map<Object, ObjectData}
                 */
                var observed,
                    /**
                     * List of handlers and their data
                     * @type {Map<Handler, Map<Object, HandlerData>>}
                     */
                    handlers,

                    defaultAcceptList = ["add", "update", "delete", "reconfigure", "setPrototype", "preventExtensions"];

                // Functions for internal usage

                /**
                 * Checks if the argument is an Array object. Polyfills Array.isArray.
                 * @function isArray
                 * @param {?*} object
                 * @returns {Boolean}
                 */
                var isArray = A.isArray || (function(toString) {
                        return function(object) {
                            return toString.call(object) === "[object Array]";
                        };
                    })(O.prototype.toString),

                    /**
                     * Returns the index of an item in a collection, or -1 if not found.
                     * Uses the generic Array.indexOf or Array.prototype.indexOf if available.
                     * @function inArray
                     * @param {Array} array
                     * @param {*} pivot           Item to look for
                     * @param {Number} [start=0]  Index to start from
                     * @returns {Number}
                     */
                    inArray = A.prototype.indexOf ? A.indexOf || function(array, pivot, start) {
                        return A.prototype.indexOf.call(array, pivot, start);
                    } : function(array, pivot, start) {
                        for (var i = start || 0; i < array.length; i++)
                            if (array[i] === pivot)
                                return i;
                        return -1;
                    },

                    /**
                     * Returns an instance of Map, or a Map-like object is Map is not
                     * supported or doesn't support forEach()
                     * @function createMap
                     * @returns {Map}
                     */
                    createMap = typeof root.Map === "undefined" || !Map.prototype.forEach ? function() {
                        // Lightweight shim of Map. Lacks clear(), entries(), keys() and
                        // values() (the last 3 not supported by IE11, so can't use them),
                        // it doesn't handle the constructor's argument (like IE11) and of
                        // course it doesn't support for...of.
                        // Chrome 31-35 and Firefox 13-24 have a basic support of Map, but
                        // they lack forEach(), so their native implementation is bad for
                        // this polyfill. (Chrome 36+ supports Object.observe.)
                        var keys = [],
                            values = [];

                        return {
                            size: 0,
                            has: function(key) {
                                return inArray(keys, key) > -1;
                            },
                            get: function(key) {
                                return values[inArray(keys, key)];
                            },
                            set: function(key, value) {
                                var i = inArray(keys, key);
                                if (i === -1) {
                                    keys.push(key);
                                    values.push(value);
                                    this.size++;
                                } else values[i] = value;
                            },
                            "delete": function(key) {
                                var i = inArray(keys, key);
                                if (i > -1) {
                                    keys.splice(i, 1);
                                    values.splice(i, 1);
                                    this.size--;
                                }
                            },
                            forEach: function(callback /*, thisObj*/ ) {
                                for (var i = 0; i < keys.length; i++)
                                    callback.call(arguments[1], values[i], keys[i], this);
                            }
                        };
                    } : function() {
                        return new Map();
                    },

                    /**
                     * Simple shim for Object.getOwnPropertyNames when is not available
                     * Misses checks on object, don't use as a replacement of Object.keys/getOwnPropertyNames
                     * @function getProps
                     * @param {Object} object
                     * @returns {String[]}
                     */
                    getProps = O.getOwnPropertyNames ? (function() {
                        var func = O.getOwnPropertyNames;
                        try {
                            arguments.callee;
                        } catch (e) {
                            // Strict mode is supported

                            // In strict mode, we can't access to "arguments", "caller" and
                            // "callee" properties of functions. Object.getOwnPropertyNames
                            // returns [ "prototype", "length", "name" ] in Firefox; it returns
                            // "caller" and "arguments" too in Chrome and in Internet
                            // Explorer, so those values must be filtered.
                            var avoid = (func(inArray).join(" ") + " ").replace(/prototype |length |name /g, "").slice(0, -1).split(" ");
                            if (avoid.length) func = function(object) {
                                var props = O.getOwnPropertyNames(object);
                                if (typeof object === "function")
                                    for (var i = 0, j; i < avoid.length;)
                                        if ((j = inArray(props, avoid[i++])) > -1)
                                            props.splice(j, 1);

                                return props;
                            };
                        }
                        return func;
                    })() : function(object) {
                        // Poor-mouth version with for...in (IE8-)
                        var props = [],
                            prop, hop;
                        if ("hasOwnProperty" in object) {
                            for (prop in object)
                                if (object.hasOwnProperty(prop))
                                    props.push(prop);
                        } else {
                            hop = O.hasOwnProperty;
                            for (prop in object)
                                if (hop.call(object, prop))
                                    props.push(prop);
                        }

                        // Inserting a common non-enumerable property of arrays
                        if (isArray(object))
                            props.push("length");

                        return props;
                    },

                    /**
                     * Return the prototype of the object... if defined.
                     * @function getPrototype
                     * @param {Object} object
                     * @returns {Object}
                     */
                    getPrototype = O.getPrototypeOf,

                    /**
                     * Return the descriptor of the object... if defined.
                     * IE8 supports a (useless) Object.getOwnPropertyDescriptor for DOM
                     * nodes only, so defineProperties is checked instead.
                     * @function getDescriptor
                     * @param {Object} object
                     * @param {String} property
                     * @returns {Descriptor}
                     */
                    getDescriptor = O.defineProperties && O.getOwnPropertyDescriptor,

                    /**
                     * Sets up the next check and delivering iteration, using
                     * requestAnimationFrame or a (close) polyfill.
                     * @function nextFrame
                     * @param {function} func
                     * @returns {number}
                     */
                    nextFrame = root.requestAnimationFrame || root.webkitRequestAnimationFrame || (function() {
                        var initial = +new Date,
                            last = initial;
                        return function(func) {
                            return setTimeout(function() {
                                func((last = +new Date) - initial);
                            }, 17);
                        };
                    })(),

                    /**
                     * Sets up the observation of an object
                     * @function doObserve
                     * @param {Object} object
                     * @param {Handler} handler
                     * @param {String[]} [acceptList]
                     */
                    doObserve = function(object, handler, acceptList) {

                        var data = observed.get(object);

                        if (data)
                            setHandler(object, data, handler, acceptList);
                        else {
                            data = createObjectData(object);
                            setHandler(object, data, handler, acceptList);

                            if (observed.size === 1)
                            // Let the observation begin!
                                nextFrame(runGlobalLoop);
                        }
                    },

                    /**
                     * Creates the initial data for an observed object
                     * @function createObjectData
                     * @param {Object} object
                     */
                    createObjectData = function(object, data) {
                        var props = getProps(object),
                            values = [],
                            descs, i = 0,
                            data = {
                                handlers: createMap(),
                                frozen: O.isFrozen ? O.isFrozen(object) : false,
                                extensible: O.isExtensible ? O.isExtensible(object) : true,
                                proto: getPrototype && getPrototype(object),
                                properties: props,
                                values: values,
                                notifier: retrieveNotifier(object, data)
                            };

                        if (getDescriptor) {
                            descs = data.descriptors = [];
                            while (i < props.length) {
                                descs[i] = getDescriptor(object, props[i]);
                                values[i] = object[props[i++]];
                            }
                        } else
                            while (i < props.length)
                                values[i] = object[props[i++]];

                        observed.set(object, data);

                        return data;
                    },

                    /**
                     * Performs basic property value change checks on an observed object
                     * @function performPropertyChecks
                     * @param {ObjectData} data
                     * @param {Object} object
                     * @param {String} [except]  Doesn't deliver the changes to the
                     *                           handlers that accept this type
                     */
                    performPropertyChecks = (function() {
                        var updateCheck = getDescriptor ? function(object, data, idx, except, descr) {
                            var key = data.properties[idx],
                                value = object[key],
                                ovalue = data.values[idx],
                                odesc = data.descriptors[idx];

                            if ("value" in descr && (ovalue === value ? ovalue === 0 && 1 / ovalue !== 1 / value : ovalue === ovalue || value === value)) {
                                addChangeRecord(object, data, {
                                    name: key,
                                    type: "update",
                                    object: object,
                                    oldValue: ovalue
                                }, except);
                                data.values[idx] = value;
                            }
                            if (odesc.configurable && (!descr.configurable || descr.writable !== odesc.writable || descr.enumerable !== odesc.enumerable || descr.get !== odesc.get || descr.set !== odesc.set)) {
                                addChangeRecord(object, data, {
                                    name: key,
                                    type: "reconfigure",
                                    object: object,
                                    oldValue: ovalue
                                }, except);
                                data.descriptors[idx] = descr;
                            }
                        } : function(object, data, idx, except) {
                            var key = data.properties[idx],
                                value = object[key],
                                ovalue = data.values[idx];

                            if (ovalue === value ? ovalue === 0 && 1 / ovalue !== 1 / value : ovalue === ovalue || value === value) {
                                addChangeRecord(object, data, {
                                    name: key,
                                    type: "update",
                                    object: object,
                                    oldValue: ovalue
                                }, except);
                                data.values[idx] = value;
                            }
                        };

                        // Checks if some property has been deleted
                        var deletionCheck = getDescriptor ? function(object, props, proplen, data, except) {
                            var i = props.length,
                                descr;
                            while (proplen && i--) {
                                if (props[i] !== null) {
                                    descr = getDescriptor(object, props[i]);
                                    proplen--;

                                    // If there's no descriptor, the property has really
                                    // been deleted; otherwise, it's been reconfigured so
                                    // that's not enumerable anymore
                                    if (descr) updateCheck(object, data, i, except, descr);
                                    else {
                                        addChangeRecord(object, data, {
                                            name: props[i],
                                            type: "delete",
                                            object: object,
                                            oldValue: data.values[i]
                                        }, except);
                                        data.properties.splice(i, 1);
                                        data.values.splice(i, 1);
                                        data.descriptors.splice(i, 1);
                                    }
                                }
                            }
                        } : function(object, props, proplen, data, except) {
                            var i = props.length;
                            while (proplen && i--)
                                if (props[i] !== null) {
                                    addChangeRecord(object, data, {
                                        name: props[i],
                                        type: "delete",
                                        object: object,
                                        oldValue: data.values[i]
                                    }, except);
                                    data.properties.splice(i, 1);
                                    data.values.splice(i, 1);
                                    proplen--;
                                }
                        };

                        return function(data, object, except) {
                            if (!data.handlers.size || data.frozen) return;

                            var props, proplen, keys,
                                values = data.values,
                                descs = data.descriptors,
                                i = 0,
                                idx,
                                key, value,
                                proto, descr;

                            // If the object isn't extensible, we don't need to check for new
                            // or deleted properties
                            if (data.extensible) {

                                props = data.properties.slice();
                                proplen = props.length;
                                keys = getProps(object);

                                if (descs) {
                                    while (i < keys.length) {
                                        key = keys[i++];
                                        idx = inArray(props, key);
                                        descr = getDescriptor(object, key);

                                        if (idx === -1) {
                                            addChangeRecord(object, data, {
                                                name: key,
                                                type: "add",
                                                object: object
                                            }, except);
                                            data.properties.push(key);
                                            values.push(object[key]);
                                            descs.push(descr);
                                        } else {
                                            props[idx] = null;
                                            proplen--;
                                            updateCheck(object, data, idx, except, descr);
                                        }
                                    }
                                    deletionCheck(object, props, proplen, data, except);

                                    if (!O.isExtensible(object)) {
                                        data.extensible = false;
                                        addChangeRecord(object, data, {
                                            type: "preventExtensions",
                                            object: object
                                        }, except);

                                        data.frozen = O.isFrozen(object);
                                    }
                                } else {
                                    while (i < keys.length) {
                                        key = keys[i++];
                                        idx = inArray(props, key);
                                        value = object[key];

                                        if (idx === -1) {
                                            addChangeRecord(object, data, {
                                                name: key,
                                                type: "add",
                                                object: object
                                            }, except);
                                            data.properties.push(key);
                                            values.push(value);
                                        } else {
                                            props[idx] = null;
                                            proplen--;
                                            updateCheck(object, data, idx, except);
                                        }
                                    }
                                    deletionCheck(object, props, proplen, data, except);
                                }

                            } else if (!data.frozen) {

                                // If the object is not extensible, but not frozen, we just have
                                // to check for value changes
                                for (; i < props.length; i++) {
                                    key = props[i];
                                    updateCheck(object, data, i, except, getDescriptor(object, key));
                                }

                                if (O.isFrozen(object))
                                    data.frozen = true;
                            }

                            if (getPrototype) {
                                proto = getPrototype(object);
                                if (proto !== data.proto) {
                                    addChangeRecord(object, data, {
                                        type: "setPrototype",
                                        name: "__proto__",
                                        object: object,
                                        oldValue: data.proto
                                    });
                                    data.proto = proto;
                                }
                            }
                        };
                    })(),

                    /**
                     * Sets up the main loop for object observation and change notification
                     * It stops if no object is observed.
                     * @function runGlobalLoop
                     */
                    runGlobalLoop = function() {
                        if (observed.size) {
                            observed.forEach(performPropertyChecks);
                            handlers.forEach(deliverHandlerRecords);
                            nextFrame(runGlobalLoop);
                        }
                    },

                    /**
                     * Deliver the change records relative to a certain handler, and resets
                     * the record list.
                     * @param {HandlerData} hdata
                     * @param {Handler} handler
                     */
                    deliverHandlerRecords = function(hdata, handler) {
                        if (hdata.changeRecords.length) {
                            handler(hdata.changeRecords);
                            hdata.changeRecords = [];
                        }
                    },

                    /**
                     * Returns the notifier for an object - whether it's observed or not
                     * @function retrieveNotifier
                     * @param {Object} object
                     * @param {ObjectData} [data]
                     * @returns {Notifier}
                     */
                    retrieveNotifier = function(object, data) {
                        if (arguments.length < 2)
                            data = observed.get(object);

                        /** @type {Notifier} */
                        return data && data.notifier || {
                            /**
                             * @method notify
                             * @see http://arv.github.io/ecmascript-object-observe/#notifierprototype._notify
                             * @memberof Notifier
                             * @param {ChangeRecord} changeRecord
                             */
                            notify: function(changeRecord) {
                                changeRecord.type; // Just to check the property is there...

                                // If there's no data, the object has been unobserved
                                var data = observed.get(object);
                                if (data) {
                                    var recordCopy = {
                                            object: object
                                        },
                                        prop;
                                    for (prop in changeRecord)
                                        if (prop !== "object")
                                            recordCopy[prop] = changeRecord[prop];
                                    addChangeRecord(object, data, recordCopy);
                                }
                            },

                            /**
                             * @method performChange
                             * @see http://arv.github.io/ecmascript-object-observe/#notifierprototype_.performchange
                             * @memberof Notifier
                             * @param {String} changeType
                             * @param {Performer} func     The task performer
                             * @param {*} [thisObj]        Used to set `this` when calling func
                             */
                            performChange: function(changeType, func /*, thisObj*/ ) {
                                if (typeof changeType !== "string")
                                    throw new TypeError("Invalid non-string changeType");

                                if (typeof func !== "function")
                                    throw new TypeError("Cannot perform non-function");

                                // If there's no data, the object has been unobserved
                                var data = observed.get(object),
                                    prop, changeRecord,
                                    result = func.call(arguments[2]);

                                data && performPropertyChecks(data, object, changeType);

                                // If there's no data, the object has been unobserved
                                if (data && result && typeof result === "object") {
                                    changeRecord = {
                                        object: object,
                                        type: changeType
                                    };
                                    for (prop in result)
                                        if (prop !== "object" && prop !== "type")
                                            changeRecord[prop] = result[prop];
                                    addChangeRecord(object, data, changeRecord);
                                }
                            }
                        };
                    },

                    /**
                     * Register (or redefines) an handler in the collection for a given
                     * object and a given type accept list.
                     * @function setHandler
                     * @param {Object} object
                     * @param {ObjectData} data
                     * @param {Handler} handler
                     * @param {String[]} acceptList
                     */
                    setHandler = function(object, data, handler, acceptList) {
                        var hdata = handlers.get(handler);
                        if (!hdata)
                            handlers.set(handler, hdata = {
                                observed: createMap(),
                                changeRecords: []
                            });
                        hdata.observed.set(object, {
                            acceptList: acceptList.slice(),
                            data: data
                        });
                        data.handlers.set(handler, hdata);
                    },

                    /**
                     * Adds a change record in a given ObjectData
                     * @function addChangeRecord
                     * @param {Object} object
                     * @param {ObjectData} data
                     * @param {ChangeRecord} changeRecord
                     * @param {String} [except]
                     */
                    addChangeRecord = function(object, data, changeRecord, except) {
                        data.handlers.forEach(function(hdata) {
                            var acceptList = hdata.observed.get(object).acceptList;
                            // If except is defined, Notifier.performChange has been
                            // called, with except as the type.
                            // All the handlers that accepts that type are skipped.
                            if ((typeof except !== "string" || inArray(acceptList, except) === -1) && inArray(acceptList, changeRecord.type) > -1)
                                hdata.changeRecords.push(changeRecord);
                        });
                    };

                observed = createMap();
                handlers = createMap();

                /**
                 * @function Object.observe
                 * @see http://arv.github.io/ecmascript-object-observe/#Object.observe
                 * @param {Object} object
                 * @param {Handler} handler
                 * @param {String[]} [acceptList]
                 * @throws {TypeError}
                 * @returns {Object}               The observed object
                 */
                O.observe = function observe(object, handler, acceptList) {
                    if (!object || typeof object !== "object" && typeof object !== "function")
                        throw new TypeError("Object.observe cannot observe non-object");

                    if (typeof handler !== "function")
                        throw new TypeError("Object.observe cannot deliver to non-function");

                    if (O.isFrozen && O.isFrozen(handler))
                        throw new TypeError("Object.observe cannot deliver to a frozen function object");

                    if (typeof acceptList === "undefined")
                        acceptList = defaultAcceptList;
                    else if (!acceptList || typeof acceptList !== "object")
                        throw new TypeError("Third argument to Object.observe must be an array of strings.");

                    doObserve(object, handler, acceptList);

                    return object;
                };

                /**
                 * @function Object.unobserve
                 * @see http://arv.github.io/ecmascript-object-observe/#Object.unobserve
                 * @param {Object} object
                 * @param {Handler} handler
                 * @throws {TypeError}
                 * @returns {Object}         The given object
                 */
                O.unobserve = function unobserve(object, handler) {
                    if (object === null || typeof object !== "object" && typeof object !== "function")
                        throw new TypeError("Object.unobserve cannot unobserve non-object");

                    if (typeof handler !== "function")
                        throw new TypeError("Object.unobserve cannot deliver to non-function");

                    var hdata = handlers.get(handler),
                        odata;

                    if (hdata && (odata = hdata.observed.get(object))) {
                        hdata.observed.forEach(function(odata, object) {
                            performPropertyChecks(odata.data, object);
                        });
                        nextFrame(function() {
                            deliverHandlerRecords(hdata, handler);
                        });

                        // In Firefox 13-18, size is a function, but createMap should fall
                        // back to the shim for those versions
                        if (hdata.observed.size === 1 && hdata.observed.has(object))
                            handlers["delete"](handler);
                        else hdata.observed["delete"](object);

                        if (odata.data.handlers.size === 1)
                            observed["delete"](object);
                        else odata.data.handlers["delete"](handler);
                    }

                    return object;
                };

                /**
                 * @function Object.getNotifier
                 * @see http://arv.github.io/ecmascript-object-observe/#GetNotifier
                 * @param {Object} object
                 * @throws {TypeError}
                 * @returns {Notifier}
                 */
                O.getNotifier = function getNotifier(object) {
                    if (object === null || typeof object !== "object" && typeof object !== "function")
                        throw new TypeError("Object.getNotifier cannot getNotifier non-object");

                    if (O.isFrozen && O.isFrozen(object)) return null;

                    return retrieveNotifier(object);
                };

                /**
                 * @function Object.deliverChangeRecords
                 * @see http://arv.github.io/ecmascript-object-observe/#Object.deliverChangeRecords
                 * @see http://arv.github.io/ecmascript-object-observe/#DeliverChangeRecords
                 * @param {Handler} handler
                 * @throws {TypeError}
                 */
                O.deliverChangeRecords = function deliverChangeRecords(handler) {
                    if (typeof handler !== "function")
                        throw new TypeError("Object.deliverChangeRecords cannot deliver to non-function");

                    var hdata = handlers.get(handler);
                    if (hdata) {
                        hdata.observed.forEach(function(odata, object) {
                            performPropertyChecks(odata.data, object);
                        });
                        deliverHandlerRecords(hdata, handler);
                    }
                };

            })(Object, Array, this);
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/../../node_modules/object.observe/dist/object-observe.js", "/../../node_modules/object.observe/dist")
    }, {
        "buffer": 1,
        "oMfpAn": 4
    }],
    6: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            module.exports = (function() {

                var depthString = '                                                                                ';

                function DataNodeBase(key) {
                    this.label = key;
                    this.data = [''];
                    this.rowIndexes = [];
                    this.hasChildren = false;
                    this.depth = 0;
                    this.height = 1;
                    this.expanded = false;
                }

                DataNodeBase.prototype.isNullObject = false;

                DataNodeBase.prototype.getValue = function(x) {
                    return this.data[x];
                };

                DataNodeBase.prototype.prune = function(depth) {
                    this.depth = depth;
                    this.data[0] = this.computeDepthString();
                };

                DataNodeBase.prototype.computeDepthString = function() {
                    var string = depthString.substring(0, 2 + (this.depth * 3)) + this.label;
                    return string;
                };

                DataNodeBase.prototype.computeHeight = function() {
                    return 1;
                };

                DataNodeBase.prototype.getAllRowIndexes = function() {
                    return this.rowIndexes;
                };

                DataNodeBase.prototype.computeAggregates = function(aggregator) {
                    this.applyAggregates(aggregator);
                };

                DataNodeBase.prototype.applyAggregates = function(aggregator) {
                    var hasGroupsOffset = aggregator.hasGroups() ? 1 : 0;
                    var indexes = this.getAllRowIndexes();
                    if (indexes.length === 0) {
                        return; // no data to rollup on
                    }
                    var aggregates = aggregator.aggregates;
                    var data = this.data;
                    data.length = aggregates.length + hasGroupsOffset;

                    var sorter = aggregator.sorterInstance;
                    sorter.indexes = indexes;

                    for (var i = 0; i < aggregates.length; i++) {
                        var aggregate = aggregates[i];
                        data[i + hasGroupsOffset] = aggregate(sorter);
                    }

                    this.data = data;
                };

                DataNodeBase.prototype.buildView = function(aggregator) {
                    aggregator.view.push(this);
                };

                DataNodeBase.prototype.toggleExpansionState = function() { /* aggregator */
                    //do nothing by default
                };

                return DataNodeBase;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataNodeBase.js", "/")
    }, {
        "buffer": 1,
        "oMfpAn": 4
    }],
    7: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            var Map = require('./Map');
            var DataNodeBase = require('./DataNodeBase');

            module.exports = (function() {

                var ExpandedMap = {
                    true: '▾',
                    false: '▸'
                };
                var depthString = '                                                                                ';

                function DataNodeGroup(key) {
                    DataNodeBase.call(this, key);
                    this.children = new Map();
                }

                DataNodeGroup.prototype = Object.create(DataNodeBase.prototype);

                DataNodeGroup.prototype.prune = function(depth) {
                    this.depth = depth;
                    this.children = this.children.values;
                    for (var i = 0; i < this.children.length; i++) {
                        var child = this.children[i];
                        child.prune(this.depth + 1);
                    }
                    this.data[0] = this.computeDepthString();
                };

                DataNodeGroup.prototype.computeDepthString = function() {
                    var icon = ExpandedMap[this.expanded + ''];
                    var string = depthString.substring(0, this.depth * 3) + icon + ' ' + this.label;
                    return string;
                };

                DataNodeGroup.prototype.getAllRowIndexes = function() {
                    if (this.rowIndexes.length === 0) {
                        this.rowIndexes = this.computeAllRowIndexes();
                    }
                    return this.rowIndexes;
                };

                DataNodeGroup.prototype.computeAllRowIndexes = function() {
                    var result = [];
                    for (var i = 0; i < this.children.length; i++) {
                        var child = this.children[i];
                        var childIndexes = child.getAllRowIndexes();
                        Array.prototype.splice.apply(result, [result.length, 0].concat(childIndexes));
                    }
                    return result;
                };

                DataNodeGroup.prototype.toggleExpansionState = function(aggregator) { /* aggregator */
                    this.expanded = !this.expanded;
                    this.data[0] = this.computeDepthString();
                    if (this.expanded) {
                        this.computeAggregates(aggregator);
                    }
                };

                DataNodeGroup.prototype.computeAggregates = function(aggregator) {
                    this.applyAggregates(aggregator);
                    if (!this.expanded) {
                        return; // were not being viewed, don't have child nodes do computation;
                    }
                    for (var i = 0; i < this.children.length; i++) {
                        this.children[i].computeAggregates(aggregator);
                    }
                };

                DataNodeGroup.prototype.buildView = function(aggregator) {
                    aggregator.view.push(this);
                    if (this.expanded) {
                        for (var i = 0; i < this.children.length; i++) {
                            var child = this.children[i];
                            child.buildView(aggregator);
                        }
                    }
                };

                DataNodeGroup.prototype.computeHeight = function() {
                    var height = 1; //I'm 1 high
                    if (!this.expanded) {
                        this.height = 1;
                    } else {
                        for (var i = 0; i < this.children.length; i++) {
                            height = height + this.children[i].computeHeight();
                        }
                        this.height = height;
                    }
                    return this.height;
                };

                return DataNodeGroup;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataNodeGroup.js", "/")
    }, {
        "./DataNodeBase": 6,
        "./Map": 17,
        "buffer": 1,
        "oMfpAn": 4
    }],
    8: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            var DataNodeBase = require('./DataNodeBase');

            module.exports = (function() {

                function DataNodeLeaf(key) {
                    DataNodeBase.call(this, key);
                }

                DataNodeLeaf.prototype = Object.create(DataNodeBase.prototype);

                DataNodeLeaf.prototype.prune = function(depth) {
                    this.depth = depth;
                    this.data[0] = this.computeDepthString();
                };

                DataNodeLeaf.prototype.computeHeight = function() {
                    return 1;
                };

                DataNodeLeaf.prototype.getAllRowIndexes = function() {
                    return this.rowIndexes;
                };

                DataNodeLeaf.prototype.computeAggregates = function(aggregator) {
                    this.applyAggregates(aggregator);
                };

                DataNodeLeaf.prototype.buildView = function(aggregator) {
                    aggregator.view.push(this);
                };

                return DataNodeLeaf;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataNodeLeaf.js", "/")
    }, {
        "./DataNodeBase": 6,
        "buffer": 1,
        "oMfpAn": 4
    }],
    9: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            var DataNodeGroup = require('./DataNodeGroup');

            module.exports = (function() {

                function DataNodeTree(key) {
                    DataNodeGroup.call(this, key);
                    this.height = 0;
                    this.expanded = true;
                }

                DataNodeTree.prototype = Object.create(DataNodeGroup.prototype);

                DataNodeTree.prototype.prune = function() {
                    this.children = this.children.values;
                    for (var i = 0; i < this.children.length; i++) {
                        var child = this.children[i];
                        child.prune(0);
                    }
                };

                DataNodeTree.prototype.buildView = function(aggregator) {
                    for (var i = 0; i < this.children.length; i++) {
                        var child = this.children[i];
                        child.buildView(aggregator);
                    }
                };

                DataNodeTree.prototype.computeHeight = function() {
                    var height = 1;
                    for (var i = 0; i < this.children.length; i++) {
                        height = height + this.children[i].computeHeight();
                    }
                    this.height = height;

                    return this.height;
                };


                return DataNodeTree;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataNodeTree.js", "/")
    }, {
        "./DataNodeGroup": 7,
        "buffer": 1,
        "oMfpAn": 4
    }],
    10: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            var DataSourceSorter = require('./DataSourceSorter');
            var DataNodeTree = require('./DataNodeTree');
            var DataNodeGroup = require('./DataNodeGroup');
            var DataNodeLeaf = require('./DataNodeLeaf');

            module.exports = (function() {

                var headerify = function(string) {
                    var pieces = string.replace(/[_-]/g, ' ').replace(/[A-Z]/g, ' $&').split(' ').map(function(s) {
                        return (s.charAt(0).toUpperCase() + s.slice(1)).trim();
                    });
                    pieces = pieces.filter(function(e) {
                        return e.length !== 0;
                    });
                    return pieces.join(' ').trim();
                };

                //?[t,c,b,a]
                // t is a dataSource,
                // a is a dicitionary of aggregates,  columnName:function
                // b is a dicitionary of groupbys, columnName:sourceColumnName
                // c is a list of constraints,

                function DataSourceAggregator(dataSource) {
                    this.tree = new DataNodeTree('Totals');
                    this.indexes = [];
                    this.dataSource = dataSource;
                    this.aggregates = [];
                    this.headers = [];
                    this.groupBys = [];
                    this.view = [];
                    this.sorterInstance = {};
                    this.presortGroups = true;
                    this.lastAggregate = {};
                    this.setAggregates({});
                }

                DataSourceAggregator.prototype.isNullObject = false;

                DataSourceAggregator.prototype.setAggregates = function(aggregations) {
                    this.lastAggregate = aggregations;
                    var props = [];
                    var i;
                    this.clearAggregations();
                    this.headers.length = 0;

                    for (var key in aggregations) {
                        props.push([key, aggregations[key]]);
                    }

                    // if (props.length === 0) {
                    //     var fields = [].concat(this.dataSource.getFields());
                    //     for (i = 0; i < fields.length; i++) {
                    //         props.push([fields[i], Aggregations.first(i)]); /* jshint ignore:line */
                    //     }
                    // }
                    if (this.hasGroups()) {
                        this.headers.push('Tree');
                    }

                    for (i = 0; i < props.length; i++) {
                        var agg = props[i];
                        this.addAggregate(agg[0], agg[1]);
                    }
                };

                DataSourceAggregator.prototype.addAggregate = function(label, func) {
                    this.headers.push(headerify(label));
                    this.aggregates.push(func);
                };

                DataSourceAggregator.prototype.setGroupBys = function(columnIndexArray) {
                    this.groupBys.length = 0;
                    for (var i = 0; i < columnIndexArray.length; i++) {
                        this.groupBys.push(columnIndexArray[i]);
                    }
                    this.setAggregates(this.lastAggregate);
                };

                DataSourceAggregator.prototype.addGroupBy = function(index) {
                    this.groupBys.push(index);
                };

                DataSourceAggregator.prototype.hasGroups = function() {
                    return this.groupBys.length > 0;
                };

                DataSourceAggregator.prototype.hasAggregates = function() {
                    return this.aggregates.length > 0;
                };

                DataSourceAggregator.prototype.apply = function() {
                    this.buildGroupTree();
                };

                DataSourceAggregator.prototype.clearGroups = function() {
                    this.groupBys.length = 0;
                };

                DataSourceAggregator.prototype.clearAggregations = function() {
                    this.aggregates.length = 0;
                    this.headers.length = 0;
                };

                DataSourceAggregator.prototype.buildGroupTree = function() {
                    var c, r, g, value, createFunc;
                    var createBranch = function(key, map) {
                        value = new DataNodeGroup(key);
                        map.set(key, value);
                        return value;
                    };
                    var createLeaf = function(key, map) {
                        value = new DataNodeLeaf(key);
                        map.set(key, value);
                        return value;
                    };
                    var groupBys = this.groupBys;
                    var source = this.dataSource;
                    var rowCount = source.getRowCount();

                    // lets sort our data first....
                    if (this.presortGroups) {
                        for (c = 0; c < groupBys.length; c++) {
                            g = groupBys[groupBys.length - c - 1];
                            source = new DataSourceSorter(source);
                            source.sortOn(g);
                        }
                    }

                    var tree = this.tree = new DataNodeTree('Totals');
                    var path = tree;
                    var leafDepth = groupBys.length - 1;
                    for (r = 0; r < rowCount; r++) {
                        for (c = 0; c < groupBys.length; c++) {
                            g = groupBys[c];
                            value = source.getValue(g, r);

                            //test that I'm not a leaf
                            createFunc = (c === leafDepth) ? createLeaf : createBranch;
                            path = path.children.getIfAbsent(value, createFunc);
                        }
                        path.rowIndexes.push(r);
                        path = tree;
                    }
                    this.sorterInstance = new DataSourceSorter(source);
                    tree.prune();
                    this.tree.computeAggregates(this);
                    this.buildView();
                };

                DataSourceAggregator.prototype.buildView = function() {
                    this.view.length = 0;
                    this.tree.computeHeight();
                    this.tree.buildView(this);
                };

                DataSourceAggregator.prototype.viewMakesSense = function() {
                    return this.hasAggregates();
                };

                DataSourceAggregator.prototype.getValue = function(x, y) {
                    if (!this.viewMakesSense()) {
                        return this.dataSource.getValue(x, y);
                    }
                    var row = this.view[y];
                    if (!row) {
                        return null;
                    }
                    return row.getValue(x);
                };

                DataSourceAggregator.prototype.setValue = function(x, y, value) {
                    if (!this.viewMakesSense()) {
                        return this.dataSource.setValue(x, y, value);
                    }
                };

                DataSourceAggregator.prototype.getColumnCount = function() {
                    if (!this.viewMakesSense()) {
                        return this.dataSource.getColumnCount();
                    }
                    var colCount = this.getHeaders().length;
                    return colCount;
                };

                DataSourceAggregator.prototype.getRowCount = function() {
                    if (!this.viewMakesSense()) {
                        return this.dataSource.getRowCount();
                    }
                    return this.view.length; //header column
                };

                DataSourceAggregator.prototype.click = function(y) {
                    var group = this.view[y];
                    group.toggleExpansionState(this);
                    this.buildView();
                };

                DataSourceAggregator.prototype.getHeaders = function() {
                    if (!this.viewMakesSense()) {
                        return this.dataSource.getHeaders();
                    }
                    return this.headers;
                };

                DataSourceAggregator.prototype.setHeaders = function(headers) {
                    this.dataSource.setHeaders(headers);
                };

                DataSourceAggregator.prototype.getFields = function() {
                    return this.dataSource.getFields();
                };

                DataSourceAggregator.prototype.setFields = function(fields) {
                    return this.dataSource.setFields(fields);
                };

                DataSourceAggregator.prototype.getGrandTotals = function() {
                    var view = this.tree;
                    return [view.data];
                };

                DataSourceAggregator.prototype.getRow = function(y) {

                    if (!this.viewMakesSense()) {
                        return this.dataSource.getRow(y);
                    }

                    var rollups = this.view[y];
                    if (!rollups) {
                        return this.tree;
                    }

                    return rollups;
                };

                DataSourceAggregator.prototype.setData = function(arrayOfUniformObjects) {
                    this.dataSource.setData(arrayOfUniformObjects);
                    this.apply();
                };

                return DataSourceAggregator;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataSourceAggregator.js", "/")
    }, {
        "./DataNodeGroup": 7,
        "./DataNodeLeaf": 8,
        "./DataNodeTree": 9,
        "./DataSourceSorter": 14,
        "buffer": 1,
        "oMfpAn": 4
    }],
    11: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            module.exports = (function() {

                function DataSourceDecorator(dataSource) {
                    this.dataSource = dataSource;
                    this.indexes = [];
                }

                DataSourceDecorator.prototype.isNullObject = false;

                DataSourceDecorator.prototype.transposeY = function(y) {
                    if (this.indexes.length !== 0) {
                        return this.indexes[y];
                    }
                    return y;
                };

                DataSourceDecorator.prototype.getValue = function(x, y) {
                    var value = this.dataSource.getValue(x, this.transposeY(y));
                    return value;
                };

                DataSourceDecorator.prototype.getRow = function(y) {

                    return this.dataSource.getRow(this.transposeY(y));
                };

                DataSourceDecorator.prototype.setValue = function(x, y, value) {

                    this.dataSource.setValue(x, this.transposeY(y), value);
                };

                DataSourceDecorator.prototype.getColumnCount = function() {

                    return this.dataSource.getColumnCount();
                };

                DataSourceDecorator.prototype.getFields = function() {

                    return this.dataSource.getFields();
                };

                DataSourceDecorator.prototype.setFields = function(fields) {

                    return this.dataSource.setFields(fields);
                };

                DataSourceDecorator.prototype.getRowCount = function() {
                    if (this.indexes.length !== 0) {
                        return this.indexes.length;
                    }
                    return this.dataSource.getRowCount();
                };

                DataSourceDecorator.prototype.setHeaders = function(headers) {
                    return this.dataSource.setHeaders(headers);
                };

                DataSourceDecorator.prototype.getHeaders = function() {

                    return this.dataSource.getHeaders();
                };

                DataSourceDecorator.prototype.getGrandTotals = function() {
                    //nothing here
                    return;
                };

                DataSourceDecorator.prototype.initializeIndexVector = function() {
                    var rowCount = this.dataSource.getRowCount();
                    var indexVector = new Array(rowCount);
                    for (var r = 0; r < rowCount; r++) {
                        indexVector[r] = r;
                    }
                    this.indexes = indexVector;
                };

                DataSourceDecorator.prototype.setData = function(arrayOfUniformObjects) {
                    this.dataSource.setData(arrayOfUniformObjects);
                };

                return DataSourceDecorator;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataSourceDecorator.js", "/")
    }, {
        "buffer": 1,
        "oMfpAn": 4
    }],
    12: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            var DataSourceDecorator = require('./DataSourceDecorator');

            module.exports = (function() {

                function DataSourceFilter(dataSource) {
                    DataSourceDecorator.call(this, dataSource, false);
                    this.filters = [];
                }

                DataSourceFilter.prototype = Object.create(DataSourceDecorator.prototype);

                DataSourceFilter.prototype.addFilter = function(columnIndex, filter) {
                    filter.columnIndex = columnIndex;
                    this.filters.push(filter);
                };
                DataSourceFilter.prototype.setFilter = function(columnIndex, filter) {
                    filter.columnIndex = columnIndex;
                    this.filters.push(filter);
                };

                DataSourceFilter.prototype.clearFilters = function() { /* filter */
                    this.filters.length = 0;
                    this.indexes.length = 0;
                };

                DataSourceFilter.prototype.applyFilters = function() {
                    if (this.filters.length === 0) {
                        this.indexes.length = 0;
                        return;
                    }
                    var indexes = this.indexes;
                    indexes.length = 0;
                    var count = this.dataSource.getRowCount();
                    for (var r = 0; r < count; r++) {
                        if (this.applyFiltersTo(r)) {
                            indexes.push(r);
                        }
                    }
                };

                DataSourceFilter.prototype.applyFiltersTo = function(r) {
                    var filters = this.filters;
                    var isFiltered = true;
                    for (var f = 0; f < filters.length; f++) {
                        var filter = filters[f];
                        var rowObject = this.dataSource.getRow(r);
                        isFiltered = isFiltered && filter(this.dataSource.getValue(filter.columnIndex, r), rowObject, r);
                    }
                    return isFiltered;
                };

                DataSourceFilter.prototype.getRowCount = function() {
                    if (this.indexes.length !== 0) {
                        return this.indexes.length;
                    }
                    //our filter matched nothing....
                    if (this.filters.length !== 0) {
                        return 0;
                    }
                    return this.dataSource.getRowCount();
                };

                return DataSourceFilter;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataSourceFilter.js", "/")
    }, {
        "./DataSourceDecorator": 11,
        "buffer": 1,
        "oMfpAn": 4
    }],
    13: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            var DataSourceDecorator = require('./DataSourceDecorator');

            module.exports = (function() {

                function DataSourceGlobalFilter(dataSource) {
                    DataSourceDecorator.call(this, dataSource, false);
                    this.filter = null;
                }

                DataSourceGlobalFilter.prototype = Object.create(DataSourceDecorator.prototype);

                DataSourceGlobalFilter.prototype.setFilter = function(filter) {
                    this.filter = filter;
                };

                DataSourceGlobalFilter.prototype.clearFilters = function() { /* filter */
                    this.filter = null;
                    this.indexes.length = 0;
                };

                DataSourceGlobalFilter.prototype.getRowCount = function() {
                    if (this.indexes.length !== 0) {
                        return this.indexes.length;
                    }
                    //our filter matched nothing....
                    if (this.filter) {
                        return 0;
                    }
                    return this.dataSource.getRowCount();
                };

                DataSourceGlobalFilter.prototype.applyFilters = function() {
                    if (!this.filter) {
                        this.indexes.length = 0;
                        return;
                    }
                    var indexes = this.indexes;
                    indexes.length = 0;
                    var count = this.dataSource.getRowCount();
                    for (var r = 0; r < count; r++) {
                        if (this.applyFilterTo(r)) {
                            indexes.push(r);
                        }
                    }
                };

                DataSourceGlobalFilter.prototype.applyFilterTo = function(r) {
                    var isFiltered = false;
                    var filter = this.filter;
                    var colCount = this.getColumnCount();
                    var rowObject = this.dataSource.getRow(r);
                    for (var i = 0; i < colCount; i++) {
                        isFiltered = isFiltered || filter(this.dataSource.getValue(i, r), rowObject, r);
                        if (isFiltered) {
                            return true;
                        }
                    }
                    return false;
                };

                return DataSourceGlobalFilter;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataSourceGlobalFilter.js", "/")
    }, {
        "./DataSourceDecorator": 11,
        "buffer": 1,
        "oMfpAn": 4
    }],
    14: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            var Utils = require('./Utils.js');
            var DataSourceDecorator = require('./DataSourceDecorator');
            var valueOrFunctionExecute = function(valueOrFunction) {
                var isFunction = (((typeof valueOrFunction)[0]) === 'f');
                var result = isFunction ? valueOrFunction() : valueOrFunction;
                return result;
            };

            module.exports = (function() {

                function DataSourceSorter(dataSource) {
                    DataSourceDecorator.call(this, dataSource);
                    this.descendingSort = false;
                }

                DataSourceSorter.prototype = Object.create(DataSourceDecorator.prototype);

                DataSourceSorter.prototype.sortOn = function(columnIndex, sortType) {
                    if (sortType === 0) {
                        this.indexes.length = 0;
                        return;
                    }
                    this.initializeIndexVector();
                    var self = this;
                    Utils.stableSort(this.indexes, function(index) {
                        var val = self.dataSource.getValue(columnIndex, index);
                        val = valueOrFunctionExecute(val);
                        return val;
                    }, sortType);
                };

                return DataSourceSorter;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataSourceSorter.js", "/")
    }, {
        "./DataSourceDecorator": 11,
        "./Utils.js": 18,
        "buffer": 1,
        "oMfpAn": 4
    }],
    15: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            var DataSourceDecorator = require('./DataSourceDecorator');
            var DataSourceSorter = require('./DataSourceSorter');

            module.exports = (function() {

                function DataSourceSorterComposite(dataSource) {
                    DataSourceDecorator.call(this, dataSource);
                    this.sorts = [];
                    this.last = this.dataSource;
                }

                DataSourceSorterComposite.prototype = Object.create(DataSourceDecorator.prototype);

                DataSourceSorterComposite.prototype.sortOn = function(columnIndex, sortType) {
                    this.sorts.push([columnIndex, sortType]);
                };

                DataSourceSorterComposite.prototype.applySorts = function() {
                    var sorts = this.sorts;
                    var each = this.dataSource;
                    for (var i = 0; i < sorts.length; i++) {
                        var sort = sorts[i];
                        each = new DataSourceSorter(each);
                        each.sortOn(sort[0], sort[1]);
                    }
                    this.last = each;
                };

                DataSourceSorterComposite.prototype.clearSorts = function() {
                    this.sorts.length = 0;
                    this.last = this.dataSource;
                };

                DataSourceSorterComposite.prototype.getValue = function(x, y) {
                    return this.last.getValue(x, y);
                };

                DataSourceSorterComposite.prototype.setValue = function(x, y, value) {
                    this.last.setValue(x, y, value);
                };

                return DataSourceSorterComposite;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataSourceSorterComposite.js", "/")
    }, {
        "./DataSourceDecorator": 11,
        "./DataSourceSorter": 14,
        "buffer": 1,
        "oMfpAn": 4
    }],
    16: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            module.exports = (function() {

                var headerify = function(string) {
                    var pieces = string.replace(/[_-]/g, ' ').replace(/[A-Z]/g, ' $&').split(' ').map(function(s) {
                        return s.charAt(0).toUpperCase() + s.slice(1);
                    });
                    return pieces.join(' ');
                };

                var computeFieldNames = function(object) {
                    if (!object) {
                        return [];
                    }
                    var fields = [].concat(Object.getOwnPropertyNames(object).filter(function(e) {
                        return e.substr(0, 2) !== '__';
                    }));
                    return fields;
                };

                function JSDataSource(data, fields) {
                    this.fields = fields || computeFieldNames(data[0]);
                    this.headers = [];
                    this.data = data;
                }

                JSDataSource.prototype.isNullObject = false;

                JSDataSource.prototype.getValue = function(x, y) {
                    var row = this.data[y];
                    if (!row) {
                        return null;
                    }
                    var value = row[this.fields[x]];
                    return value;
                };

                JSDataSource.prototype.getRow = function(y) {

                    return this.data[y];
                };

                JSDataSource.prototype.setValue = function(x, y, value) {

                    this.data[y][this.fields[x]] = value;
                };

                JSDataSource.prototype.getColumnCount = function() {

                    return this.getFields().length;
                };

                JSDataSource.prototype.getRowCount = function() {

                    return this.data.length;
                };

                JSDataSource.prototype.getFields = function() {

                    return this.fields;
                };

                JSDataSource.prototype.getHeaders = function() {
                    if (!this.headers || this.headers.length === 0) {
                        this.headers = this.getDefaultHeaders().map(function(each) {
                            return headerify(each);
                        });
                    }
                    return this.headers;
                };

                JSDataSource.prototype.getDefaultHeaders = function() {

                    return this.getFields();
                };

                JSDataSource.prototype.setFields = function(fields) {

                    this.fields = fields;
                };

                JSDataSource.prototype.setHeaders = function(headers) {

                    this.headers = headers;
                };

                JSDataSource.prototype.getGrandTotals = function() {
                    //nothing here
                    return;
                };

                JSDataSource.prototype.setData = function(arrayOfUniformObjects) {
                    this.data = arrayOfUniformObjects;
                };

                return JSDataSource;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/JSDataSource.js", "/")
    }, {
        "buffer": 1,
        "oMfpAn": 4
    }],
    17: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            module.exports = (function() {

                var oidPrefix = '.~.#%_'; //this should be something we never will see at the begining of a string
                var counter = 0;

                var hash = function(key) {
                    var typeOf = typeof key;
                    switch (typeOf) {
                        case 'number':
                            return oidPrefix + typeOf + '_' + key;
                        case 'string':
                            return oidPrefix + typeOf + '_' + key;
                        case 'boolean':
                            return oidPrefix + typeOf + '_' + key;
                        case 'symbol':
                            return oidPrefix + typeOf + '_' + key;
                        case 'undefined':
                            return oidPrefix + 'undefined';
                        case 'object':
                            /*eslint-disable */
                            if (key.___finhash) {
                                return key.___finhash;
                            }
                            key.___finhash = oidPrefix + counter++;
                            return key.___finhash;
                        case 'function':
                            if (key.___finhash) {
                                return key.___finhash;
                            }
                            key.___finhash = oidPrefix + counter++;
                            return key.___finhash; /*eslint-enable */
                    }
                };

                // Object.is polyfill, courtesy of @WebReflection
                var is = Object.is ||
                    function(a, b) {
                        return a === b ? a !== 0 || 1 / a == 1 / b : a != a && b != b; // eslint-disable-line
                    };

                // More reliable indexOf, courtesy of @WebReflection
                var betterIndexOf = function(arr, value) {
                    if (value != value || value === 0) { // eslint-disable-line
                        for (var i = arr.length; i-- && !is(arr[i], value);) { // eslint-disable-line
                        }
                    } else {
                        i = [].indexOf.call(arr, value);
                    }
                    return i;
                };

                function Mappy() {
                    this.keys = [];
                    this.data = {};
                    this.values = [];
                }

                Mappy.prototype.set = function(key, value) {
                    var hashCode = hash(key);
                    if (this.data[hashCode] === undefined) {
                        this.keys.push(key);
                        this.values.push(value);
                    }
                    this.data[hashCode] = value;
                };

                Mappy.prototype.get = function(key) {
                    var hashCode = hash(key);
                    return this.data[hashCode];
                };

                Mappy.prototype.getIfAbsent = function(key, ifAbsentFunc) {
                    var value = this.get(key);
                    if (value === undefined) {
                        value = ifAbsentFunc(key, this);
                    }
                    return value;
                };

                Mappy.prototype.size = function() {
                    return this.keys.length;
                };

                Mappy.prototype.clear = function() {
                    this.keys.length = 0;
                    this.data = {};
                };

                Mappy.prototype.delete = function(key) {
                    var hashCode = hash(key);
                    if (this.data[hashCode] === undefined) {
                        return;
                    }
                    var index = betterIndexOf(this.keys, key);
                    this.keys.splice(index, 1);
                    this.values.splice(index, 1);
                    delete this.data[hashCode];
                };

                Mappy.prototype.forEach = function(func) {
                    var keys = this.keys;
                    for (var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        var value = this.get(key);
                        func(value, key, this);
                    }
                };

                Mappy.prototype.map = function(func) {
                    var keys = this.keys;
                    var newMap = new Mappy();
                    for (var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        var value = this.get(key);
                        var transformed = func(value, key, this);
                        newMap.set(key, transformed);
                    }
                    return newMap;
                };

                Mappy.prototype.copy = function() {
                    var keys = this.keys;
                    var newMap = new Mappy();
                    for (var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        var value = this.get(key);
                        newMap.set(key, value);
                    }
                    return newMap;
                };

                return Mappy;

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/Map.js", "/")
    }, {
        "buffer": 1,
        "oMfpAn": 4
    }],
    18: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            var stableSort = require('./stableSort.js');
            var Map = require('./Map.js');

            module.exports = (function() {

                return {
                    stableSort: stableSort,
                    Map: Map
                };

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/Utils.js", "/")
    }, {
        "./Map.js": 17,
        "./stableSort.js": 22,
        "buffer": 1,
        "oMfpAn": 4
    }],
    19: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            module.exports = (function() {

                return {

                    count: function() { /* columIndex */
                        return function(group) {
                            var rows = group.getRowCount();
                            return rows;
                        };
                    },

                    sum: function(columIndex) {
                        return function(group) {
                            var sum = 0;
                            var rows = group.getRowCount();
                            for (var r = 0; r < rows; r++) {
                                sum = sum + group.getValue(columIndex, r);
                            }
                            return sum;
                        };
                    },

                    min: function(columIndex) {
                        return function(group) {
                            var min = 0;
                            var rows = group.getRowCount();
                            for (var r = 0; r < rows; r++) {
                                min = Math.min(min, group.getValue(columIndex, r));
                            }
                            return min;
                        };
                    },


                    max: function(columIndex) {
                        return function(group) {
                            var max = 0;
                            var rows = group.getRowCount();
                            for (var r = 0; r < rows; r++) {
                                max = Math.max(max, group.getValue(columIndex, r));
                            }
                            return max;
                        };
                    },

                    avg: function(columIndex) {
                        return function(group) {
                            var sum = 0;
                            var rows = group.getRowCount();
                            for (var r = 0; r < rows; r++) {
                                sum = sum + group.getValue(columIndex, r);
                            }
                            return sum / rows;
                        };
                    },

                    first: function(columIndex) {
                        return function(group) {
                            return group.getValue(columIndex, 0);
                        };
                    },

                    last: function(columIndex) {
                        return function(group) {
                            var rows = group.getRowCount();
                            return group.getValue(columIndex, rows - 1);
                        };
                    },

                    stddev: function(columIndex) {
                        return function(group) {
                            var r;
                            var sum = 0;
                            var rows = group.getRowCount();
                            for (r = 0; r < rows; r++) {
                                sum = sum + group.getValue(columIndex, r);
                            }
                            var mean = sum / rows;
                            var variance = 0;
                            for (r = 0; r < rows; r++) {
                                var dev = (group.getValue(columIndex, r) - mean);
                                variance = variance + (dev * dev);
                            }
                            var stddev = Math.sqrt(variance / rows);
                            return stddev;
                        };
                    }
                };

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/aggregations.js", "/")
    }, {
        "buffer": 1,
        "oMfpAn": 4
    }],
    20: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            var JSDataSource = require('./JSDataSource');
            var DataSourceSorter = require('./DataSourceSorter');
            var DataSourceSorterComposite = require('./DataSourceSorterComposite');
            var DataSourceFilter = require('./DataSourceFilter');
            var DataSourceGlobalFilter = require('./DataSourceGlobalFilter');
            var DataSourceAggregator = require('./DataSourceAggregator');
            var aggregations = require('./aggregations');

            module.exports = (function() {

                return {
                    JSDataSource: JSDataSource,
                    DataSourceSorter: DataSourceSorter,
                    DataSourceSorterComposite: DataSourceSorterComposite,
                    DataSourceFilter: DataSourceFilter,
                    DataSourceGlobalFilter: DataSourceGlobalFilter,
                    DataSourceAggregator: DataSourceAggregator,
                    aggregations: aggregations
                };

            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/analytics.js", "/")
    }, {
        "./DataSourceAggregator": 10,
        "./DataSourceFilter": 12,
        "./DataSourceGlobalFilter": 13,
        "./DataSourceSorter": 14,
        "./DataSourceSorterComposite": 15,
        "./JSDataSource": 16,
        "./aggregations": 19,
        "buffer": 1,
        "oMfpAn": 4
    }],
    21: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            /* eslint-env node, browser */
            'use strict';

            var noop = function() {};

            var oo = require('object.observe');
            var analytics = require('./analytics.js');

            noop(oo);

            if (!window.fin) {
                window.fin = {};
            }
            if (!window.fin.analytics) {
                window.fin.analytics = analytics;
            }
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/fake_c248631d.js", "/")
    }, {
        "./analytics.js": 20,
        "buffer": 1,
        "oMfpAn": 4,
        "object.observe": 5
    }],
    22: [function(require, module, exports) {
        (function(process, global, Buffer, __argument0, __argument1, __argument2, __argument3, __filename, __dirname) {
            'use strict';

            var stabilize = function(comparator, descending) {
                return function(arr1, arr2) {
                    var x = arr1[0];
                    var y = arr2[0];
                    if (x === y) {
                        x = descending ? arr2[1] : arr1[1];
                        y = descending ? arr1[1] : arr2[1];
                    } else {
                        if (y === null) {
                            return -1;
                        }
                        if (x === null) {
                            return 1;
                        }
                    }
                    return comparator(x, y);
                };
            };


            var ascendingNumbers = function(x, y) {
                return x - y;
            };

            var descendingNumbers = function(x, y) {
                return y - x;
            };

            var ascendingAllOthers = function(x, y) {
                return x < y ? -1 : 1;
            };

            var descendingAllOthers = function(x, y) {
                return y < x ? -1 : 1;
            };

            var ascending = function(typeOfData) {
                if (typeOfData === 'number') {
                    return stabilize(ascendingNumbers, false);
                }
                return stabilize(ascendingAllOthers, false);
            };

            var descending = function(typeOfData) {
                if (typeOfData === 'number') {
                    return stabilize(descendingNumbers, true);
                }
                return stabilize(descendingAllOthers, true);
            };

            module.exports = (function() {

                function sort(indexVector, dataSource, sortType) {

                    var compare, i;

                    if (indexVector.length === 0) {
                        return; //nothing to do;
                    }

                    if (sortType === undefined) {
                        sortType = 1;
                    }

                    if (sortType === 0) {
                        return; // nothing to sort here;
                    }

                    var typeOfData = typeof dataSource(0);

                    compare = (sortType === 1) ? ascending(typeOfData) : descending(typeOfData);

                    //start the actually sorting.....
                    var tmp = new Array(indexVector.length);

                    //lets add the index for stability
                    for (i = 0; i < indexVector.length; i++) {
                        tmp[i] = [dataSource(i), i];
                    }

                    tmp.sort(compare);

                    //copy the sorted values into our index vector
                    for (i = 0; i < indexVector.length; i++) {
                        indexVector[i] = tmp[i][1];
                    }
                }

                return sort;
            })();
        }).call(this, require("oMfpAn"), typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/stableSort.js", "/")
    }, {
        "buffer": 1,
        "oMfpAn": 4
    }]
}, {}, [21])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZXdpcnRzL1Byb2plY3RzL2ZpbmFuYWx5dGljcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3RldmV3aXJ0cy9Qcm9qZWN0cy9maW5hbmFseXRpY3Mvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiL1VzZXJzL3N0ZXZld2lydHMvUHJvamVjdHMvZmluYW5hbHl0aWNzL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIvVXNlcnMvc3RldmV3aXJ0cy9Qcm9qZWN0cy9maW5hbmFseXRpY3Mvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiL1VzZXJzL3N0ZXZld2lydHMvUHJvamVjdHMvZmluYW5hbHl0aWNzL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9zdGV2ZXdpcnRzL1Byb2plY3RzL2ZpbmFuYWx5dGljcy9ub2RlX21vZHVsZXMvb2JqZWN0Lm9ic2VydmUvZGlzdC9vYmplY3Qtb2JzZXJ2ZS5qcyIsIi9Vc2Vycy9zdGV2ZXdpcnRzL1Byb2plY3RzL2ZpbmFuYWx5dGljcy9zcmMvanMvRGF0YU5vZGVCYXNlLmpzIiwiL1VzZXJzL3N0ZXZld2lydHMvUHJvamVjdHMvZmluYW5hbHl0aWNzL3NyYy9qcy9EYXRhTm9kZUdyb3VwLmpzIiwiL1VzZXJzL3N0ZXZld2lydHMvUHJvamVjdHMvZmluYW5hbHl0aWNzL3NyYy9qcy9EYXRhTm9kZUxlYWYuanMiLCIvVXNlcnMvc3RldmV3aXJ0cy9Qcm9qZWN0cy9maW5hbmFseXRpY3Mvc3JjL2pzL0RhdGFOb2RlVHJlZS5qcyIsIi9Vc2Vycy9zdGV2ZXdpcnRzL1Byb2plY3RzL2ZpbmFuYWx5dGljcy9zcmMvanMvRGF0YVNvdXJjZUFnZ3JlZ2F0b3IuanMiLCIvVXNlcnMvc3RldmV3aXJ0cy9Qcm9qZWN0cy9maW5hbmFseXRpY3Mvc3JjL2pzL0RhdGFTb3VyY2VEZWNvcmF0b3IuanMiLCIvVXNlcnMvc3RldmV3aXJ0cy9Qcm9qZWN0cy9maW5hbmFseXRpY3Mvc3JjL2pzL0RhdGFTb3VyY2VGaWx0ZXIuanMiLCIvVXNlcnMvc3RldmV3aXJ0cy9Qcm9qZWN0cy9maW5hbmFseXRpY3Mvc3JjL2pzL0RhdGFTb3VyY2VHbG9iYWxGaWx0ZXIuanMiLCIvVXNlcnMvc3RldmV3aXJ0cy9Qcm9qZWN0cy9maW5hbmFseXRpY3Mvc3JjL2pzL0RhdGFTb3VyY2VTb3J0ZXIuanMiLCIvVXNlcnMvc3RldmV3aXJ0cy9Qcm9qZWN0cy9maW5hbmFseXRpY3Mvc3JjL2pzL0RhdGFTb3VyY2VTb3J0ZXJDb21wb3NpdGUuanMiLCIvVXNlcnMvc3RldmV3aXJ0cy9Qcm9qZWN0cy9maW5hbmFseXRpY3Mvc3JjL2pzL0pTRGF0YVNvdXJjZS5qcyIsIi9Vc2Vycy9zdGV2ZXdpcnRzL1Byb2plY3RzL2ZpbmFuYWx5dGljcy9zcmMvanMvTWFwLmpzIiwiL1VzZXJzL3N0ZXZld2lydHMvUHJvamVjdHMvZmluYW5hbHl0aWNzL3NyYy9qcy9VdGlscy5qcyIsIi9Vc2Vycy9zdGV2ZXdpcnRzL1Byb2plY3RzL2ZpbmFuYWx5dGljcy9zcmMvanMvYWdncmVnYXRpb25zLmpzIiwiL1VzZXJzL3N0ZXZld2lydHMvUHJvamVjdHMvZmluYW5hbHl0aWNzL3NyYy9qcy9hbmFseXRpY3MuanMiLCIvVXNlcnMvc3RldmV3aXJ0cy9Qcm9qZWN0cy9maW5hbmFseXRpY3Mvc3JjL2pzL2Zha2VfYzI0ODYzMWQuanMiLCIvVXNlcnMvc3RldmV3aXJ0cy9Qcm9qZWN0cy9maW5hbmFseXRpY3Mvc3JjL2pzL3N0YWJsZVNvcnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcHVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTJcblxuLyoqXG4gKiBJZiBgQnVmZmVyLl91c2VUeXBlZEFycmF5c2A6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChjb21wYXRpYmxlIGRvd24gdG8gSUU2KVxuICovXG5CdWZmZXIuX3VzZVR5cGVkQXJyYXlzID0gKGZ1bmN0aW9uICgpIHtcbiAgLy8gRGV0ZWN0IGlmIGJyb3dzZXIgc3VwcG9ydHMgVHlwZWQgQXJyYXlzLiBTdXBwb3J0ZWQgYnJvd3NlcnMgYXJlIElFIDEwKywgRmlyZWZveCA0KyxcbiAgLy8gQ2hyb21lIDcrLCBTYWZhcmkgNS4xKywgT3BlcmEgMTEuNissIGlPUyA0LjIrLiBJZiB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGFkZGluZ1xuICAvLyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMsIHRoZW4gdGhhdCdzIHRoZSBzYW1lIGFzIG5vIGBVaW50OEFycmF5YCBzdXBwb3J0XG4gIC8vIGJlY2F1c2Ugd2UgbmVlZCB0byBiZSBhYmxlIHRvIGFkZCBhbGwgdGhlIG5vZGUgQnVmZmVyIEFQSSBtZXRob2RzLiBUaGlzIGlzIGFuIGlzc3VlXG4gIC8vIGluIEZpcmVmb3ggNC0yOS4gTm93IGZpeGVkOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzhcbiAgdHJ5IHtcbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDApXG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KGJ1ZilcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIHJldHVybiA0MiA9PT0gYXJyLmZvbygpICYmXG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgLy8gQ2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pXG5cbiAgdmFyIHR5cGUgPSB0eXBlb2Ygc3ViamVjdFxuXG4gIC8vIFdvcmthcm91bmQ6IG5vZGUncyBiYXNlNjQgaW1wbGVtZW50YXRpb24gYWxsb3dzIGZvciBub24tcGFkZGVkIHN0cmluZ3NcbiAgLy8gd2hpbGUgYmFzZTY0LWpzIGRvZXMgbm90LlxuICBpZiAoZW5jb2RpbmcgPT09ICdiYXNlNjQnICYmIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgc3ViamVjdCA9IHN0cmluZ3RyaW0oc3ViamVjdClcbiAgICB3aGlsZSAoc3ViamVjdC5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgICBzdWJqZWN0ID0gc3ViamVjdCArICc9J1xuICAgIH1cbiAgfVxuXG4gIC8vIEZpbmQgdGhlIGxlbmd0aFxuICB2YXIgbGVuZ3RoXG4gIGlmICh0eXBlID09PSAnbnVtYmVyJylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdClcbiAgZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpXG4gICAgbGVuZ3RoID0gQnVmZmVyLmJ5dGVMZW5ndGgoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKVxuICAgIGxlbmd0aCA9IGNvZXJjZShzdWJqZWN0Lmxlbmd0aCkgLy8gYXNzdW1lIHRoYXQgb2JqZWN0IGlzIGFycmF5LWxpa2VcbiAgZWxzZVxuICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgbmVlZHMgdG8gYmUgYSBudW1iZXIsIGFycmF5IG9yIHN0cmluZy4nKVxuXG4gIHZhciBidWZcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICAvLyBQcmVmZXJyZWQ6IFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgYnVmID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBUSElTIGluc3RhbmNlIG9mIEJ1ZmZlciAoY3JlYXRlZCBieSBgbmV3YClcbiAgICBidWYgPSB0aGlzXG4gICAgYnVmLmxlbmd0aCA9IGxlbmd0aFxuICAgIGJ1Zi5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgaVxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiB0eXBlb2Ygc3ViamVjdC5ieXRlTGVuZ3RoID09PSAnbnVtYmVyJykge1xuICAgIC8vIFNwZWVkIG9wdGltaXphdGlvbiAtLSB1c2Ugc2V0IGlmIHdlJ3JlIGNvcHlpbmcgZnJvbSBhIHR5cGVkIGFycmF5XG4gICAgYnVmLl9zZXQoc3ViamVjdClcbiAgfSBlbHNlIGlmIChpc0FycmF5aXNoKHN1YmplY3QpKSB7XG4gICAgLy8gVHJlYXQgYXJyYXktaXNoIG9iamVjdHMgYXMgYSBieXRlIGFycmF5XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpKVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0LnJlYWRVSW50OChpKVxuICAgICAgZWxzZVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0W2ldXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgYnVmLndyaXRlKHN1YmplY3QsIDAsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzICYmICFub1plcm8pIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGJ1ZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbi8vIFNUQVRJQyBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKGIpIHtcbiAgcmV0dXJuICEhKGIgIT09IG51bGwgJiYgYiAhPT0gdW5kZWZpbmVkICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGZ1bmN0aW9uIChzdHIsIGVuY29kaW5nKSB7XG4gIHZhciByZXRcbiAgc3RyID0gc3RyICsgJydcbiAgc3dpdGNoIChlbmNvZGluZyB8fCAndXRmOCcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCAvIDJcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAncmF3JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggKiAyXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZW5jb2RpbmcnKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIChsaXN0LCB0b3RhbExlbmd0aCkge1xuICBhc3NlcnQoaXNBcnJheShsaXN0KSwgJ1VzYWdlOiBCdWZmZXIuY29uY2F0KGxpc3QsIFt0b3RhbExlbmd0aF0pXFxuJyArXG4gICAgICAnbGlzdCBzaG91bGQgYmUgYW4gQXJyYXkuJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9IGVsc2UgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGxpc3RbMF1cbiAgfVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdG90YWxMZW5ndGggIT09ICdudW1iZXInKSB7XG4gICAgdG90YWxMZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRvdGFsTGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIodG90YWxMZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuLy8gQlVGRkVSIElOU1RBTkNFIE1FVEhPRFNcbi8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIF9oZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGFzc2VydChzdHJMZW4gJSAyID09PSAwLCAnSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJ5dGUgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgYXNzZXJ0KCFpc05hTihieXRlKSwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gYnl0ZVxuICB9XG4gIEJ1ZmZlci5fY2hhcnNXcml0dGVuID0gaSAqIDJcbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gX3V0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9hc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IEJ1ZmZlci5fY2hhcnNXcml0dGVuID1cbiAgICBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBfYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gX3V0ZjE2bGVXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gU3VwcG9ydCBib3RoIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZylcbiAgLy8gYW5kIHRoZSBsZWdhY3kgKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIGlmICghaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHsgIC8vIGxlZ2FjeVxuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG4gIHN0YXJ0ID0gTnVtYmVyKHN0YXJ0KSB8fCAwXG4gIGVuZCA9IChlbmQgIT09IHVuZGVmaW5lZClcbiAgICA/IE51bWJlcihlbmQpXG4gICAgOiBlbmQgPSBzZWxmLmxlbmd0aFxuXG4gIC8vIEZhc3RwYXRoIGVtcHR5IHN0cmluZ3NcbiAgaWYgKGVuZCA9PT0gc3RhcnQpXG4gICAgcmV0dXJuICcnXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uICh0YXJnZXQsIHRhcmdldF9zdGFydCwgc3RhcnQsIGVuZCkge1xuICB2YXIgc291cmNlID0gdGhpc1xuXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICghdGFyZ2V0X3N0YXJ0KSB0YXJnZXRfc3RhcnQgPSAwXG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgc291cmNlLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnc291cmNlRW5kIDwgc291cmNlU3RhcnQnKVxuICBhc3NlcnQodGFyZ2V0X3N0YXJ0ID49IDAgJiYgdGFyZ2V0X3N0YXJ0IDwgdGFyZ2V0Lmxlbmd0aCxcbiAgICAgICd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCBzb3VyY2UubGVuZ3RoLCAnc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gc291cmNlLmxlbmd0aCwgJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpXG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgPCBlbmQgLSBzdGFydClcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc3RhcnRcblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAobGVuIDwgMTAwIHx8ICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0X3N0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0X3N0YXJ0KVxuICB9XG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gX3V0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXMgPSAnJ1xuICB2YXIgdG1wID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgaWYgKGJ1ZltpXSA8PSAweDdGKSB7XG4gICAgICByZXMgKz0gZGVjb2RlVXRmOENoYXIodG1wKSArIFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICAgICAgdG1wID0gJydcbiAgICB9IGVsc2Uge1xuICAgICAgdG1wICs9ICclJyArIGJ1ZltpXS50b1N0cmluZygxNilcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzICsgZGVjb2RlVXRmOENoYXIodG1wKVxufVxuXG5mdW5jdGlvbiBfYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspXG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHJldHVybiBfYXNjaWlTbGljZShidWYsIHN0YXJ0LCBlbmQpXG59XG5cbmZ1bmN0aW9uIF9oZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIF91dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2krMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gY2xhbXAoc3RhcnQsIGxlbiwgMClcbiAgZW5kID0gY2xhbXAoZW5kLCBsZW4sIGxlbilcblxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIHJldHVybiBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIHZhciBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQsIHRydWUpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gICAgcmV0dXJuIG5ld0J1ZlxuICB9XG59XG5cbi8vIGBnZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiBfcmVhZFVJbnQxNiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWxcbiAgaWYgKGxpdHRsZUVuZGlhbikge1xuICAgIHZhbCA9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdIDw8IDhcbiAgfSBlbHNlIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRVSW50MzIgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICBpZiAob2Zmc2V0ICsgMiA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAyXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gICAgdmFsIHw9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldCArIDNdIDw8IDI0ID4+PiAwKVxuICB9IGVsc2Uge1xuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsID0gYnVmW29mZnNldCArIDFdIDw8IDE2XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDJdIDw8IDhcbiAgICBpZiAob2Zmc2V0ICsgMyA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgM11cbiAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldF0gPDwgMjQgPj4+IDApXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgdmFyIG5lZyA9IHRoaXNbb2Zmc2V0XSAmIDB4ODBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbmZ1bmN0aW9uIF9yZWFkSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsID0gX3JlYWRVSW50MTYoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgdHJ1ZSlcbiAgdmFyIG5lZyA9IHZhbCAmIDB4ODAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDE2KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZEludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IF9yZWFkVUludDMyKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDAwMDAwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmZmZmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDMyKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZEZsb2F0IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRGbG9hdCh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRmxvYXQodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkRG91YmxlIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyA3IDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZilcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpIHJldHVyblxuXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG59XG5cbmZ1bmN0aW9uIF93cml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmYpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGxlbiAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPVxuICAgICAgICAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmZmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmLCAtMHg4MClcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgdGhpcy53cml0ZVVJbnQ4KHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgdGhpcy53cml0ZVVJbnQ4KDB4ZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZiwgLTB4ODAwMClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIF93cml0ZVVJbnQxNihidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICBfd3JpdGVVSW50MTYoYnVmLCAweGZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICBfd3JpdGVVSW50MzIoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgX3dyaXRlVUludDMyKGJ1ZiwgMHhmZmZmZmZmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZJRUVFNzU0KHZhbHVlLCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gZmlsbCh2YWx1ZSwgc3RhcnQ9MCwgZW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHZhbHVlID0gdmFsdWUuY2hhckNvZGVBdCgwKVxuICB9XG5cbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgIWlzTmFOKHZhbHVlKSwgJ3ZhbHVlIGlzIG5vdCBhIG51bWJlcicpXG4gIGFzc2VydChlbmQgPj0gc3RhcnQsICdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBhc3NlcnQoc3RhcnQgPj0gMCAmJiBzdGFydCA8IHRoaXMubGVuZ3RoLCAnc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gdGhpcy5sZW5ndGgsICdlbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICB0aGlzW2ldID0gdmFsdWVcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBvdXQgPSBbXVxuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIG91dFtpXSA9IHRvSGV4KHRoaXNbaV0pXG4gICAgaWYgKGkgPT09IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMpIHtcbiAgICAgIG91dFtpICsgMV0gPSAnLi4uJ1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBvdXQuam9pbignICcpICsgJz4nXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKVxuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IGdldC9zZXQgbWV0aG9kcyBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9nZXQgPSBhcnIuZ2V0XG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbi8vIHNsaWNlKHN0YXJ0LCBlbmQpXG5mdW5jdGlvbiBjbGFtcCAoaW5kZXgsIGxlbiwgZGVmYXVsdFZhbHVlKSB7XG4gIGlmICh0eXBlb2YgaW5kZXggIT09ICdudW1iZXInKSByZXR1cm4gZGVmYXVsdFZhbHVlXG4gIGluZGV4ID0gfn5pbmRleDsgIC8vIENvZXJjZSB0byBpbnRlZ2VyLlxuICBpZiAoaW5kZXggPj0gbGVuKSByZXR1cm4gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgaW5kZXggKz0gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgcmV0dXJuIDBcbn1cblxuZnVuY3Rpb24gY29lcmNlIChsZW5ndGgpIHtcbiAgLy8gQ29lcmNlIGxlbmd0aCB0byBhIG51bWJlciAocG9zc2libHkgTmFOKSwgcm91bmQgdXBcbiAgLy8gaW4gY2FzZSBpdCdzIGZyYWN0aW9uYWwgKGUuZy4gMTIzLjQ1NikgdGhlbiBkbyBhXG4gIC8vIGRvdWJsZSBuZWdhdGUgdG8gY29lcmNlIGEgTmFOIHRvIDAuIEVhc3ksIHJpZ2h0P1xuICBsZW5ndGggPSB+fk1hdGguY2VpbCgrbGVuZ3RoKVxuICByZXR1cm4gbGVuZ3RoIDwgMCA/IDAgOiBsZW5ndGhcbn1cblxuZnVuY3Rpb24gaXNBcnJheSAoc3ViamVjdCkge1xuICByZXR1cm4gKEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHN1YmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN1YmplY3QpID09PSAnW29iamVjdCBBcnJheV0nXG4gIH0pKHN1YmplY3QpXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXlpc2ggKHN1YmplY3QpIHtcbiAgcmV0dXJuIGlzQXJyYXkoc3ViamVjdCkgfHwgQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpIHx8XG4gICAgICBzdWJqZWN0ICYmIHR5cGVvZiBzdWJqZWN0ID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mIHN1YmplY3QubGVuZ3RoID09PSAnbnVtYmVyJ1xufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGIgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGlmIChiIDw9IDB4N0YpXG4gICAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSlcbiAgICBlbHNlIHtcbiAgICAgIHZhciBzdGFydCA9IGlcbiAgICAgIGlmIChiID49IDB4RDgwMCAmJiBiIDw9IDB4REZGRikgaSsrXG4gICAgICB2YXIgaCA9IGVuY29kZVVSSUNvbXBvbmVudChzdHIuc2xpY2Uoc3RhcnQsIGkrMSkpLnN1YnN0cigxKS5zcGxpdCgnJScpXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGgubGVuZ3RoOyBqKyspXG4gICAgICAgIGJ5dGVBcnJheS5wdXNoKHBhcnNlSW50KGhbal0sIDE2KSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoc3RyKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIHBvc1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKVxuICAgICAgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBkZWNvZGVVdGY4Q2hhciAoc3RyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCkgLy8gVVRGIDggaW52YWxpZCBjaGFyXG4gIH1cbn1cblxuLypcbiAqIFdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHZhbHVlIGlzIGEgdmFsaWQgaW50ZWdlci4gVGhpcyBtZWFucyB0aGF0IGl0XG4gKiBpcyBub24tbmVnYXRpdmUuIEl0IGhhcyBubyBmcmFjdGlvbmFsIGNvbXBvbmVudCBhbmQgdGhhdCBpdCBkb2VzIG5vdFxuICogZXhjZWVkIHRoZSBtYXhpbXVtIGFsbG93ZWQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHZlcmlmdWludCAodmFsdWUsIG1heCkge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPj0gMCwgJ3NwZWNpZmllZCBhIG5lZ2F0aXZlIHZhbHVlIGZvciB3cml0aW5nIGFuIHVuc2lnbmVkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGlzIGxhcmdlciB0aGFuIG1heGltdW0gdmFsdWUgZm9yIHR5cGUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZnNpbnQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZklFRUU3NTQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxufVxuXG5mdW5jdGlvbiBhc3NlcnQgKHRlc3QsIG1lc3NhZ2UpIHtcbiAgaWYgKCF0ZXN0KSB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSB8fCAnRmFpbGVkIGFzc2VydGlvbicpXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzXCIsXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFBMVVNfVVJMX1NBRkUgPSAnLScuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0hfVVJMX1NBRkUgPSAnXycuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTIHx8XG5cdFx0ICAgIGNvZGUgPT09IFBMVVNfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIIHx8XG5cdFx0ICAgIGNvZGUgPT09IFNMQVNIX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbmV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3NcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKiFcclxuICogT2JqZWN0Lm9ic2VydmUgcG9seWZpbGwgLSB2MC4yLjRcclxuICogYnkgTWFzc2ltbyBBcnRpenp1IChNYXhBcnQyNTAxKVxyXG4gKiBcclxuICogaHR0cHM6Ly9naXRodWIuY29tL01heEFydDI1MDEvb2JqZWN0LW9ic2VydmVcclxuICogXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZVxyXG4gKiBTZWUgTElDRU5TRSBmb3IgZGV0YWlsc1xyXG4gKi9cclxuXHJcbi8vIFNvbWUgdHlwZSBkZWZpbml0aW9uc1xyXG4vKipcclxuICogVGhpcyByZXByZXNlbnRzIHRoZSBkYXRhIHJlbGF0aXZlIHRvIGFuIG9ic2VydmVkIG9iamVjdFxyXG4gKiBAdHlwZWRlZiAge09iamVjdH0gICAgICAgICAgICAgICAgICAgICBPYmplY3REYXRhXHJcbiAqIEBwcm9wZXJ0eSB7TWFwPEhhbmRsZXIsIEhhbmRsZXJEYXRhPn0gIGhhbmRsZXJzXHJcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nW119ICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXNcclxuICogQHByb3BlcnR5IHsqW119ICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzXHJcbiAqIEBwcm9wZXJ0eSB7RGVzY3JpcHRvcltdfSAgICAgICAgICAgICAgIGRlc2NyaXB0b3JzXHJcbiAqIEBwcm9wZXJ0eSB7Tm90aWZpZXJ9ICAgICAgICAgICAgICAgICAgIG5vdGlmaWVyXHJcbiAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gICAgICAgICAgICAgICAgICAgIGZyb3plblxyXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICBleHRlbnNpYmxlXHJcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgIHByb3RvXHJcbiAqL1xyXG4vKipcclxuICogRnVuY3Rpb24gZGVmaW5pdGlvbiBvZiBhIGhhbmRsZXJcclxuICogQGNhbGxiYWNrIEhhbmRsZXJcclxuICogQHBhcmFtIHtDaGFuZ2VSZWNvcmRbXX0gICAgICAgICAgICAgICAgY2hhbmdlc1xyXG4qL1xyXG4vKipcclxuICogVGhpcyByZXByZXNlbnRzIHRoZSBkYXRhIHJlbGF0aXZlIHRvIGFuIG9ic2VydmVkIG9iamVjdCBhbmQgb25lIG9mIGl0c1xyXG4gKiBoYW5kbGVyc1xyXG4gKiBAdHlwZWRlZiAge09iamVjdH0gICAgICAgICAgICAgICAgICAgICBIYW5kbGVyRGF0YVxyXG4gKiBAcHJvcGVydHkge01hcDxPYmplY3QsIE9ic2VydmVkRGF0YT59ICBvYnNlcnZlZFxyXG4gKiBAcHJvcGVydHkge0NoYW5nZVJlY29yZFtdfSAgICAgICAgICAgICBjaGFuZ2VSZWNvcmRzXHJcbiAqL1xyXG4vKipcclxuICogQHR5cGVkZWYgIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgT2JzZXJ2ZWREYXRhXHJcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nW119ICAgICAgICAgICAgICAgICAgIGFjY2VwdExpc3RcclxuICogQHByb3BlcnR5IHtPYmplY3REYXRhfSAgICAgICAgICAgICAgICAgZGF0YVxyXG4qL1xyXG4vKipcclxuICogVHlwZSBkZWZpbml0aW9uIGZvciBhIGNoYW5nZS4gQW55IG90aGVyIHByb3BlcnR5IGNhbiBiZSBhZGRlZCB1c2luZ1xyXG4gKiB0aGUgbm90aWZ5KCkgb3IgcGVyZm9ybUNoYW5nZSgpIG1ldGhvZHMgb2YgdGhlIG5vdGlmaWVyLlxyXG4gKiBAdHlwZWRlZiAge09iamVjdH0gICAgICAgICAgICAgICAgICAgICBDaGFuZ2VSZWNvcmRcclxuICogQHByb3BlcnR5IHtTdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgdHlwZVxyXG4gKiBAcHJvcGVydHkge09iamVjdH0gICAgICAgICAgICAgICAgICAgICBvYmplY3RcclxuICogQHByb3BlcnR5IHtTdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgW25hbWVdXHJcbiAqIEBwcm9wZXJ0eSB7Kn0gICAgICAgICAgICAgICAgICAgICAgICAgIFtvbGRWYWx1ZV1cclxuICogQHByb3BlcnR5IHtOdW1iZXJ9ICAgICAgICAgICAgICAgICAgICAgW2luZGV4XVxyXG4gKi9cclxuLyoqXHJcbiAqIFR5cGUgZGVmaW5pdGlvbiBmb3IgYSBub3RpZmllciAod2hhdCBPYmplY3QuZ2V0Tm90aWZpZXIgcmV0dXJucylcclxuICogQHR5cGVkZWYgIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgTm90aWZpZXJcclxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gICAgICAgICAgICAgICAgICAgbm90aWZ5XHJcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259ICAgICAgICAgICAgICAgICAgIHBlcmZvcm1DaGFuZ2VcclxuICovXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiBjYWxsZWQgd2l0aCBOb3RpZmllci5wZXJmb3JtQ2hhbmdlLiBJdCBtYXkgb3B0aW9uYWxseSByZXR1cm4gYVxyXG4gKiBDaGFuZ2VSZWNvcmQgdGhhdCBnZXRzIGF1dG9tYXRpY2FsbHkgbm90aWZpZWQsIGJ1dCBgdHlwZWAgYW5kIGBvYmplY3RgXHJcbiAqIHByb3BlcnRpZXMgYXJlIG92ZXJyaWRkZW4uXHJcbiAqIEBjYWxsYmFjayBQZXJmb3JtZXJcclxuICogQHJldHVybnMge0NoYW5nZVJlY29yZHx1bmRlZmluZWR9XHJcbiAqL1xyXG5cclxuT2JqZWN0Lm9ic2VydmUgfHwgKGZ1bmN0aW9uKE8sIEEsIHJvb3QpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZWxhdGVzIG9ic2VydmVkIG9iamVjdHMgYW5kIHRoZWlyIGRhdGFcclxuICAgICAgICAgKiBAdHlwZSB7TWFwPE9iamVjdCwgT2JqZWN0RGF0YX1cclxuICAgICAgICAgKi9cclxuICAgIHZhciBvYnNlcnZlZCxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBMaXN0IG9mIGhhbmRsZXJzIGFuZCB0aGVpciBkYXRhXHJcbiAgICAgICAgICogQHR5cGUge01hcDxIYW5kbGVyLCBNYXA8T2JqZWN0LCBIYW5kbGVyRGF0YT4+fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGhhbmRsZXJzLFxyXG5cclxuICAgICAgICBkZWZhdWx0QWNjZXB0TGlzdCA9IFsgXCJhZGRcIiwgXCJ1cGRhdGVcIiwgXCJkZWxldGVcIiwgXCJyZWNvbmZpZ3VyZVwiLCBcInNldFByb3RvdHlwZVwiLCBcInByZXZlbnRFeHRlbnNpb25zXCIgXTtcclxuXHJcbiAgICAvLyBGdW5jdGlvbnMgZm9yIGludGVybmFsIHVzYWdlXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENoZWNrcyBpZiB0aGUgYXJndW1lbnQgaXMgYW4gQXJyYXkgb2JqZWN0LiBQb2x5ZmlsbHMgQXJyYXkuaXNBcnJheS5cclxuICAgICAgICAgKiBAZnVuY3Rpb24gaXNBcnJheVxyXG4gICAgICAgICAqIEBwYXJhbSB7Pyp9IG9iamVjdFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtCb29sZWFufVxyXG4gICAgICAgICAqL1xyXG4gICAgdmFyIGlzQXJyYXkgPSBBLmlzQXJyYXkgfHwgKGZ1bmN0aW9uKHRvU3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0KSB7IHJldHVybiB0b1N0cmluZy5jYWxsKG9iamVjdCkgPT09IFwiW29iamVjdCBBcnJheV1cIjsgfTtcclxuICAgICAgICB9KShPLnByb3RvdHlwZS50b1N0cmluZyksXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgdGhlIGluZGV4IG9mIGFuIGl0ZW0gaW4gYSBjb2xsZWN0aW9uLCBvciAtMSBpZiBub3QgZm91bmQuXHJcbiAgICAgICAgICogVXNlcyB0aGUgZ2VuZXJpYyBBcnJheS5pbmRleE9mIG9yIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIGlmIGF2YWlsYWJsZS5cclxuICAgICAgICAgKiBAZnVuY3Rpb24gaW5BcnJheVxyXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5XHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBwaXZvdCAgICAgICAgICAgSXRlbSB0byBsb29rIGZvclxyXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbc3RhcnQ9MF0gIEluZGV4IHRvIHN0YXJ0IGZyb21cclxuICAgICAgICAgKiBAcmV0dXJucyB7TnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGluQXJyYXkgPSBBLnByb3RvdHlwZS5pbmRleE9mID8gQS5pbmRleE9mIHx8IGZ1bmN0aW9uKGFycmF5LCBwaXZvdCwgc3RhcnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEEucHJvdG90eXBlLmluZGV4T2YuY2FsbChhcnJheSwgcGl2b3QsIHN0YXJ0KTtcclxuICAgICAgICB9IDogZnVuY3Rpb24oYXJyYXksIHBpdm90LCBzdGFydCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQgfHwgMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgaWYgKGFycmF5W2ldID09PSBwaXZvdClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgTWFwLCBvciBhIE1hcC1saWtlIG9iamVjdCBpcyBNYXAgaXMgbm90XHJcbiAgICAgICAgICogc3VwcG9ydGVkIG9yIGRvZXNuJ3Qgc3VwcG9ydCBmb3JFYWNoKClcclxuICAgICAgICAgKiBAZnVuY3Rpb24gY3JlYXRlTWFwXHJcbiAgICAgICAgICogQHJldHVybnMge01hcH1cclxuICAgICAgICAgKi9cclxuICAgICAgICBjcmVhdGVNYXAgPSB0eXBlb2Ygcm9vdC5NYXAgPT09IFwidW5kZWZpbmVkXCIgfHwgIU1hcC5wcm90b3R5cGUuZm9yRWFjaCA/IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyBMaWdodHdlaWdodCBzaGltIG9mIE1hcC4gTGFja3MgY2xlYXIoKSwgZW50cmllcygpLCBrZXlzKCkgYW5kXHJcbiAgICAgICAgICAgIC8vIHZhbHVlcygpICh0aGUgbGFzdCAzIG5vdCBzdXBwb3J0ZWQgYnkgSUUxMSwgc28gY2FuJ3QgdXNlIHRoZW0pLFxyXG4gICAgICAgICAgICAvLyBpdCBkb2Vzbid0IGhhbmRsZSB0aGUgY29uc3RydWN0b3IncyBhcmd1bWVudCAobGlrZSBJRTExKSBhbmQgb2ZcclxuICAgICAgICAgICAgLy8gY291cnNlIGl0IGRvZXNuJ3Qgc3VwcG9ydCBmb3IuLi5vZi5cclxuICAgICAgICAgICAgLy8gQ2hyb21lIDMxLTM1IGFuZCBGaXJlZm94IDEzLTI0IGhhdmUgYSBiYXNpYyBzdXBwb3J0IG9mIE1hcCwgYnV0XHJcbiAgICAgICAgICAgIC8vIHRoZXkgbGFjayBmb3JFYWNoKCksIHNvIHRoZWlyIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiBpcyBiYWQgZm9yXHJcbiAgICAgICAgICAgIC8vIHRoaXMgcG9seWZpbGwuIChDaHJvbWUgMzYrIHN1cHBvcnRzIE9iamVjdC5vYnNlcnZlLilcclxuICAgICAgICAgICAgdmFyIGtleXMgPSBbXSwgdmFsdWVzID0gW107XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc2l6ZTogMCxcclxuICAgICAgICAgICAgICAgIGhhczogZnVuY3Rpb24oa2V5KSB7IHJldHVybiBpbkFycmF5KGtleXMsIGtleSkgPiAtMTsgfSxcclxuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZXNbaW5BcnJheShrZXlzLCBrZXkpXTsgfSxcclxuICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gaW5BcnJheShrZXlzLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpemUrKztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgdmFsdWVzW2ldID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgXCJkZWxldGVcIjogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBpbkFycmF5KGtleXMsIGtleSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaXplLS07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGZvckVhY2g6IGZ1bmN0aW9uKGNhbGxiYWNrLyosIHRoaXNPYmoqLykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChhcmd1bWVudHNbMV0sIHZhbHVlc1tpXSwga2V5c1tpXSwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IE1hcCgpOyB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTaW1wbGUgc2hpbSBmb3IgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgd2hlbiBpcyBub3QgYXZhaWxhYmxlXHJcbiAgICAgICAgICogTWlzc2VzIGNoZWNrcyBvbiBvYmplY3QsIGRvbid0IHVzZSBhcyBhIHJlcGxhY2VtZW50IG9mIE9iamVjdC5rZXlzL2dldE93blByb3BlcnR5TmFtZXNcclxuICAgICAgICAgKiBAZnVuY3Rpb24gZ2V0UHJvcHNcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XHJcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ1tdfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGdldFByb3BzID0gTy5nZXRPd25Qcm9wZXJ0eU5hbWVzID8gKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgZnVuYyA9IE8uZ2V0T3duUHJvcGVydHlOYW1lcztcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGFyZ3VtZW50cy5jYWxsZWU7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIFN0cmljdCBtb2RlIGlzIHN1cHBvcnRlZFxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEluIHN0cmljdCBtb2RlLCB3ZSBjYW4ndCBhY2Nlc3MgdG8gXCJhcmd1bWVudHNcIiwgXCJjYWxsZXJcIiBhbmRcclxuICAgICAgICAgICAgICAgIC8vIFwiY2FsbGVlXCIgcHJvcGVydGllcyBvZiBmdW5jdGlvbnMuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzXHJcbiAgICAgICAgICAgICAgICAvLyByZXR1cm5zIFsgXCJwcm90b3R5cGVcIiwgXCJsZW5ndGhcIiwgXCJuYW1lXCIgXSBpbiBGaXJlZm94OyBpdCByZXR1cm5zXHJcbiAgICAgICAgICAgICAgICAvLyBcImNhbGxlclwiIGFuZCBcImFyZ3VtZW50c1wiIHRvbyBpbiBDaHJvbWUgYW5kIGluIEludGVybmV0XHJcbiAgICAgICAgICAgICAgICAvLyBFeHBsb3Jlciwgc28gdGhvc2UgdmFsdWVzIG11c3QgYmUgZmlsdGVyZWQuXHJcbiAgICAgICAgICAgICAgICB2YXIgYXZvaWQgPSAoZnVuYyhpbkFycmF5KS5qb2luKFwiIFwiKSArIFwiIFwiKS5yZXBsYWNlKC9wcm90b3R5cGUgfGxlbmd0aCB8bmFtZSAvZywgXCJcIikuc2xpY2UoMCwgLTEpLnNwbGl0KFwiIFwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChhdm9pZC5sZW5ndGgpIGZ1bmMgPSBmdW5jdGlvbihvYmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcHMgPSBPLmdldE93blByb3BlcnR5TmFtZXMob2JqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdCA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgajsgaSA8IGF2b2lkLmxlbmd0aDspXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGogPSBpbkFycmF5KHByb3BzLCBhdm9pZFtpKytdKSkgPiAtMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5zcGxpY2UoaiwgMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wcztcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmM7XHJcbiAgICAgICAgfSkoKSA6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG4gICAgICAgICAgICAvLyBQb29yLW1vdXRoIHZlcnNpb24gd2l0aCBmb3IuLi5pbiAoSUU4LSlcclxuICAgICAgICAgICAgdmFyIHByb3BzID0gW10sIHByb3AsIGhvcDtcclxuICAgICAgICAgICAgaWYgKFwiaGFzT3duUHJvcGVydHlcIiBpbiBvYmplY3QpIHtcclxuICAgICAgICAgICAgICAgIGZvciAocHJvcCBpbiBvYmplY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShwcm9wKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMucHVzaChwcm9wKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGhvcCA9IE8uaGFzT3duUHJvcGVydHk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHByb3AgaW4gb2JqZWN0KVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChob3AuY2FsbChvYmplY3QsIHByb3ApKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5wdXNoKHByb3ApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBJbnNlcnRpbmcgYSBjb21tb24gbm9uLWVudW1lcmFibGUgcHJvcGVydHkgb2YgYXJyYXlzXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KG9iamVjdCkpXHJcbiAgICAgICAgICAgICAgICBwcm9wcy5wdXNoKFwibGVuZ3RoXCIpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHByb3BzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybiB0aGUgcHJvdG90eXBlIG9mIHRoZSBvYmplY3QuLi4gaWYgZGVmaW5lZC5cclxuICAgICAgICAgKiBAZnVuY3Rpb24gZ2V0UHJvdG90eXBlXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZ2V0UHJvdG90eXBlID0gTy5nZXRQcm90b3R5cGVPZixcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJuIHRoZSBkZXNjcmlwdG9yIG9mIHRoZSBvYmplY3QuLi4gaWYgZGVmaW5lZC5cclxuICAgICAgICAgKiBJRTggc3VwcG9ydHMgYSAodXNlbGVzcykgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciBmb3IgRE9NXHJcbiAgICAgICAgICogbm9kZXMgb25seSwgc28gZGVmaW5lUHJvcGVydGllcyBpcyBjaGVja2VkIGluc3RlYWQuXHJcbiAgICAgICAgICogQGZ1bmN0aW9uIGdldERlc2NyaXB0b3JcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5XHJcbiAgICAgICAgICogQHJldHVybnMge0Rlc2NyaXB0b3J9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZ2V0RGVzY3JpcHRvciA9IE8uZGVmaW5lUHJvcGVydGllcyAmJiBPLmdldE93blByb3BlcnR5RGVzY3JpcHRvcixcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU2V0cyB1cCB0aGUgbmV4dCBjaGVjayBhbmQgZGVsaXZlcmluZyBpdGVyYXRpb24sIHVzaW5nXHJcbiAgICAgICAgICogcmVxdWVzdEFuaW1hdGlvbkZyYW1lIG9yIGEgKGNsb3NlKSBwb2x5ZmlsbC5cclxuICAgICAgICAgKiBAZnVuY3Rpb24gbmV4dEZyYW1lXHJcbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZnVuY1xyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgbmV4dEZyYW1lID0gcm9vdC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgcm9vdC53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgaW5pdGlhbCA9ICtuZXcgRGF0ZSxcclxuICAgICAgICAgICAgICAgIGxhc3QgPSBpbml0aWFsO1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZnVuYykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnVuYygobGFzdCA9ICtuZXcgRGF0ZSkgLSBpbml0aWFsKTtcclxuICAgICAgICAgICAgICAgIH0sIDE3KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KSgpLFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTZXRzIHVwIHRoZSBvYnNlcnZhdGlvbiBvZiBhbiBvYmplY3RcclxuICAgICAgICAgKiBAZnVuY3Rpb24gZG9PYnNlcnZlXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxyXG4gICAgICAgICAqIEBwYXJhbSB7SGFuZGxlcn0gaGFuZGxlclxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nW119IFthY2NlcHRMaXN0XVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGRvT2JzZXJ2ZSA9IGZ1bmN0aW9uKG9iamVjdCwgaGFuZGxlciwgYWNjZXB0TGlzdCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBvYnNlcnZlZC5nZXQob2JqZWN0KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhKVxyXG4gICAgICAgICAgICAgICAgc2V0SGFuZGxlcihvYmplY3QsIGRhdGEsIGhhbmRsZXIsIGFjY2VwdExpc3QpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSBjcmVhdGVPYmplY3REYXRhKG9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICBzZXRIYW5kbGVyKG9iamVjdCwgZGF0YSwgaGFuZGxlciwgYWNjZXB0TGlzdCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmIChvYnNlcnZlZC5zaXplID09PSAxKVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIExldCB0aGUgb2JzZXJ2YXRpb24gYmVnaW4hXHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dEZyYW1lKHJ1bkdsb2JhbExvb3ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ3JlYXRlcyB0aGUgaW5pdGlhbCBkYXRhIGZvciBhbiBvYnNlcnZlZCBvYmplY3RcclxuICAgICAgICAgKiBAZnVuY3Rpb24gY3JlYXRlT2JqZWN0RGF0YVxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RcclxuICAgICAgICAgKi9cclxuICAgICAgICBjcmVhdGVPYmplY3REYXRhID0gZnVuY3Rpb24ob2JqZWN0LCBkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBwcm9wcyA9IGdldFByb3BzKG9iamVjdCksXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbXSwgZGVzY3MsIGkgPSAwLFxyXG4gICAgICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyczogY3JlYXRlTWFwKCksXHJcbiAgICAgICAgICAgICAgICAgICAgZnJvemVuOiBPLmlzRnJvemVuID8gTy5pc0Zyb3plbihvYmplY3QpIDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaWJsZTogTy5pc0V4dGVuc2libGUgPyBPLmlzRXh0ZW5zaWJsZShvYmplY3QpIDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBwcm90bzogZ2V0UHJvdG90eXBlICYmIGdldFByb3RvdHlwZShvYmplY3QpLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHByb3BzLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlczogdmFsdWVzLFxyXG4gICAgICAgICAgICAgICAgICAgIG5vdGlmaWVyOiByZXRyaWV2ZU5vdGlmaWVyKG9iamVjdCwgZGF0YSlcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAoZ2V0RGVzY3JpcHRvcikge1xyXG4gICAgICAgICAgICAgICAgZGVzY3MgPSBkYXRhLmRlc2NyaXB0b3JzID0gW107XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IHByb3BzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlc2NzW2ldID0gZ2V0RGVzY3JpcHRvcihvYmplY3QsIHByb3BzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNbaV0gPSBvYmplY3RbcHJvcHNbaSsrXV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB3aGlsZSAoaSA8IHByb3BzLmxlbmd0aClcclxuICAgICAgICAgICAgICAgIHZhbHVlc1tpXSA9IG9iamVjdFtwcm9wc1tpKytdXTtcclxuXHJcbiAgICAgICAgICAgIG9ic2VydmVkLnNldChvYmplY3QsIGRhdGEpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUGVyZm9ybXMgYmFzaWMgcHJvcGVydHkgdmFsdWUgY2hhbmdlIGNoZWNrcyBvbiBhbiBvYnNlcnZlZCBvYmplY3RcclxuICAgICAgICAgKiBAZnVuY3Rpb24gcGVyZm9ybVByb3BlcnR5Q2hlY2tzXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3REYXRhfSBkYXRhXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbZXhjZXB0XSAgRG9lc24ndCBkZWxpdmVyIHRoZSBjaGFuZ2VzIHRvIHRoZVxyXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlcnMgdGhhdCBhY2NlcHQgdGhpcyB0eXBlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcGVyZm9ybVByb3BlcnR5Q2hlY2tzID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgdXBkYXRlQ2hlY2sgPSBnZXREZXNjcmlwdG9yID8gZnVuY3Rpb24ob2JqZWN0LCBkYXRhLCBpZHgsIGV4Y2VwdCwgZGVzY3IpIHtcclxuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBkYXRhLnByb3BlcnRpZXNbaWR4XSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG9iamVjdFtrZXldLFxyXG4gICAgICAgICAgICAgICAgICAgIG92YWx1ZSA9IGRhdGEudmFsdWVzW2lkeF0sXHJcbiAgICAgICAgICAgICAgICAgICAgb2Rlc2MgPSBkYXRhLmRlc2NyaXB0b3JzW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKFwidmFsdWVcIiBpbiBkZXNjciAmJiAob3ZhbHVlID09PSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA/IG92YWx1ZSA9PT0gMCAmJiAxL292YWx1ZSAhPT0gMS92YWx1ZSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgOiBvdmFsdWUgPT09IG92YWx1ZSB8fCB2YWx1ZSA9PT0gdmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWRkQ2hhbmdlUmVjb3JkKG9iamVjdCwgZGF0YSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwidXBkYXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRWYWx1ZTogb3ZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSwgZXhjZXB0KTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLnZhbHVlc1tpZHhdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAob2Rlc2MuY29uZmlndXJhYmxlICYmICghZGVzY3IuY29uZmlndXJhYmxlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IGRlc2NyLndyaXRhYmxlICE9PSBvZGVzYy53cml0YWJsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCBkZXNjci5lbnVtZXJhYmxlICE9PSBvZGVzYy5lbnVtZXJhYmxlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IGRlc2NyLmdldCAhPT0gb2Rlc2MuZ2V0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IGRlc2NyLnNldCAhPT0gb2Rlc2Muc2V0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFkZENoYW5nZVJlY29yZChvYmplY3QsIGRhdGEsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZToga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInJlY29uZmlndXJlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRWYWx1ZTogb3ZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSwgZXhjZXB0KTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLmRlc2NyaXB0b3JzW2lkeF0gPSBkZXNjcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSA6IGZ1bmN0aW9uKG9iamVjdCwgZGF0YSwgaWR4LCBleGNlcHQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBkYXRhLnByb3BlcnRpZXNbaWR4XSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG9iamVjdFtrZXldLFxyXG4gICAgICAgICAgICAgICAgICAgIG92YWx1ZSA9IGRhdGEudmFsdWVzW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG92YWx1ZSA9PT0gdmFsdWUgPyBvdmFsdWUgPT09IDAgJiYgMS9vdmFsdWUgIT09IDEvdmFsdWUgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogb3ZhbHVlID09PSBvdmFsdWUgfHwgdmFsdWUgPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWRkQ2hhbmdlUmVjb3JkKG9iamVjdCwgZGF0YSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwidXBkYXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRWYWx1ZTogb3ZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSwgZXhjZXB0KTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLnZhbHVlc1tpZHhdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVja3MgaWYgc29tZSBwcm9wZXJ0eSBoYXMgYmVlbiBkZWxldGVkXHJcbiAgICAgICAgICAgIHZhciBkZWxldGlvbkNoZWNrID0gZ2V0RGVzY3JpcHRvciA/IGZ1bmN0aW9uKG9iamVjdCwgcHJvcHMsIHByb3BsZW4sIGRhdGEsIGV4Y2VwdCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGkgPSBwcm9wcy5sZW5ndGgsIGRlc2NyO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHByb3BsZW4gJiYgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BzW2ldICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyID0gZ2V0RGVzY3JpcHRvcihvYmplY3QsIHByb3BzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGxlbi0tO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUncyBubyBkZXNjcmlwdG9yLCB0aGUgcHJvcGVydHkgaGFzIHJlYWxseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBiZWVuIGRlbGV0ZWQ7IG90aGVyd2lzZSwgaXQncyBiZWVuIHJlY29uZmlndXJlZCBzb1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGF0J3Mgbm90IGVudW1lcmFibGUgYW55bW9yZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVzY3IpIHVwZGF0ZUNoZWNrKG9iamVjdCwgZGF0YSwgaSwgZXhjZXB0LCBkZXNjcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ2hhbmdlUmVjb3JkKG9iamVjdCwgZGF0YSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb3BzW2ldLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiZGVsZXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWU6IGRhdGEudmFsdWVzW2ldXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBleGNlcHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5wcm9wZXJ0aWVzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudmFsdWVzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEuZGVzY3JpcHRvcnMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IDogZnVuY3Rpb24ob2JqZWN0LCBwcm9wcywgcHJvcGxlbiwgZGF0YSwgZXhjZXB0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaSA9IHByb3BzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChwcm9wbGVuICYmIGktLSlcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcHNbaV0gIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ2hhbmdlUmVjb3JkKG9iamVjdCwgZGF0YSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvcHNbaV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImRlbGV0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRWYWx1ZTogZGF0YS52YWx1ZXNbaV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZXhjZXB0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5wcm9wZXJ0aWVzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS52YWx1ZXMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wbGVuLS07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEsIG9iamVjdCwgZXhjZXB0KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWRhdGEuaGFuZGxlcnMuc2l6ZSB8fCBkYXRhLmZyb3plbikgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBwcm9wcywgcHJvcGxlbiwga2V5cyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBkYXRhLnZhbHVlcyxcclxuICAgICAgICAgICAgICAgICAgICBkZXNjcyA9IGRhdGEuZGVzY3JpcHRvcnMsXHJcbiAgICAgICAgICAgICAgICAgICAgaSA9IDAsIGlkeCxcclxuICAgICAgICAgICAgICAgICAgICBrZXksIHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3RvLCBkZXNjcjtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgb2JqZWN0IGlzbid0IGV4dGVuc2libGUsIHdlIGRvbid0IG5lZWQgdG8gY2hlY2sgZm9yIG5ld1xyXG4gICAgICAgICAgICAgICAgLy8gb3IgZGVsZXRlZCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5leHRlbnNpYmxlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BzID0gZGF0YS5wcm9wZXJ0aWVzLnNsaWNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGxlbiA9IHByb3BzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBrZXlzID0gZ2V0UHJvcHMob2JqZWN0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlc2NzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChpIDwga2V5cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9IGtleXNbaSsrXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkeCA9IGluQXJyYXkocHJvcHMsIGtleSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjciA9IGdldERlc2NyaXB0b3Iob2JqZWN0LCBrZXkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZHggPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ2hhbmdlUmVjb3JkKG9iamVjdCwgZGF0YSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYWRkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZXhjZXB0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnByb3BlcnRpZXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKG9iamVjdFtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcy5wdXNoKGRlc2NyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHNbaWR4XSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGxlbi0tO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUNoZWNrKG9iamVjdCwgZGF0YSwgaWR4LCBleGNlcHQsIGRlc2NyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGlvbkNoZWNrKG9iamVjdCwgcHJvcHMsIHByb3BsZW4sIGRhdGEsIGV4Y2VwdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIU8uaXNFeHRlbnNpYmxlKG9iamVjdCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEuZXh0ZW5zaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ2hhbmdlUmVjb3JkKG9iamVjdCwgZGF0YSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwicHJldmVudEV4dGVuc2lvbnNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZXhjZXB0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLmZyb3plbiA9IE8uaXNGcm96ZW4ob2JqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChpIDwga2V5cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9IGtleXNbaSsrXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkeCA9IGluQXJyYXkocHJvcHMsIGtleSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG9iamVjdFtrZXldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZHggPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ2hhbmdlUmVjb3JkKG9iamVjdCwgZGF0YSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYWRkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZXhjZXB0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnByb3BlcnRpZXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHNbaWR4XSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGxlbi0tO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUNoZWNrKG9iamVjdCwgZGF0YSwgaWR4LCBleGNlcHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0aW9uQ2hlY2sob2JqZWN0LCBwcm9wcywgcHJvcGxlbiwgZGF0YSwgZXhjZXB0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghZGF0YS5mcm96ZW4pIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIG9iamVjdCBpcyBub3QgZXh0ZW5zaWJsZSwgYnV0IG5vdCBmcm96ZW4sIHdlIGp1c3QgaGF2ZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGNoZWNrIGZvciB2YWx1ZSBjaGFuZ2VzXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICg7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXkgPSBwcm9wc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlQ2hlY2sob2JqZWN0LCBkYXRhLCBpLCBleGNlcHQsIGdldERlc2NyaXB0b3Iob2JqZWN0LCBrZXkpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChPLmlzRnJvemVuKG9iamVjdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEuZnJvemVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZ2V0UHJvdG90eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvdG8gPSBnZXRQcm90b3R5cGUob2JqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvdG8gIT09IGRhdGEucHJvdG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkQ2hhbmdlUmVjb3JkKG9iamVjdCwgZGF0YSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJzZXRQcm90b3R5cGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiX19wcm90b19fXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFZhbHVlOiBkYXRhLnByb3RvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnByb3RvID0gcHJvdG87XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pKCksXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFNldHMgdXAgdGhlIG1haW4gbG9vcCBmb3Igb2JqZWN0IG9ic2VydmF0aW9uIGFuZCBjaGFuZ2Ugbm90aWZpY2F0aW9uXHJcbiAgICAgICAgICogSXQgc3RvcHMgaWYgbm8gb2JqZWN0IGlzIG9ic2VydmVkLlxyXG4gICAgICAgICAqIEBmdW5jdGlvbiBydW5HbG9iYWxMb29wXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcnVuR2xvYmFsTG9vcCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAob2JzZXJ2ZWQuc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgb2JzZXJ2ZWQuZm9yRWFjaChwZXJmb3JtUHJvcGVydHlDaGVja3MpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlcnMuZm9yRWFjaChkZWxpdmVySGFuZGxlclJlY29yZHMpO1xyXG4gICAgICAgICAgICAgICAgbmV4dEZyYW1lKHJ1bkdsb2JhbExvb3ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVsaXZlciB0aGUgY2hhbmdlIHJlY29yZHMgcmVsYXRpdmUgdG8gYSBjZXJ0YWluIGhhbmRsZXIsIGFuZCByZXNldHNcclxuICAgICAgICAgKiB0aGUgcmVjb3JkIGxpc3QuXHJcbiAgICAgICAgICogQHBhcmFtIHtIYW5kbGVyRGF0YX0gaGRhdGFcclxuICAgICAgICAgKiBAcGFyYW0ge0hhbmRsZXJ9IGhhbmRsZXJcclxuICAgICAgICAgKi9cclxuICAgICAgICBkZWxpdmVySGFuZGxlclJlY29yZHMgPSBmdW5jdGlvbihoZGF0YSwgaGFuZGxlcikge1xyXG4gICAgICAgICAgICBpZiAoaGRhdGEuY2hhbmdlUmVjb3Jkcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZXIoaGRhdGEuY2hhbmdlUmVjb3Jkcyk7XHJcbiAgICAgICAgICAgICAgICBoZGF0YS5jaGFuZ2VSZWNvcmRzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBub3RpZmllciBmb3IgYW4gb2JqZWN0IC0gd2hldGhlciBpdCdzIG9ic2VydmVkIG9yIG5vdFxyXG4gICAgICAgICAqIEBmdW5jdGlvbiByZXRyaWV2ZU5vdGlmaWVyXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0RGF0YX0gW2RhdGFdXHJcbiAgICAgICAgICogQHJldHVybnMge05vdGlmaWVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHJldHJpZXZlTm90aWZpZXIgPSBmdW5jdGlvbihvYmplY3QsIGRhdGEpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKVxyXG4gICAgICAgICAgICAgICAgZGF0YSA9IG9ic2VydmVkLmdldChvYmplY3QpO1xyXG5cclxuICAgICAgICAgICAgLyoqIEB0eXBlIHtOb3RpZmllcn0gKi9cclxuICAgICAgICAgICAgcmV0dXJuIGRhdGEgJiYgZGF0YS5ub3RpZmllciB8fCB7XHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIEBtZXRob2Qgbm90aWZ5XHJcbiAgICAgICAgICAgICAgICAgKiBAc2VlIGh0dHA6Ly9hcnYuZ2l0aHViLmlvL2VjbWFzY3JpcHQtb2JqZWN0LW9ic2VydmUvI25vdGlmaWVycHJvdG90eXBlLl9ub3RpZnlcclxuICAgICAgICAgICAgICAgICAqIEBtZW1iZXJvZiBOb3RpZmllclxyXG4gICAgICAgICAgICAgICAgICogQHBhcmFtIHtDaGFuZ2VSZWNvcmR9IGNoYW5nZVJlY29yZFxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICBub3RpZnk6IGZ1bmN0aW9uKGNoYW5nZVJlY29yZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZVJlY29yZC50eXBlOyAvLyBKdXN0IHRvIGNoZWNrIHRoZSBwcm9wZXJ0eSBpcyB0aGVyZS4uLlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIGRhdGEsIHRoZSBvYmplY3QgaGFzIGJlZW4gdW5vYnNlcnZlZFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gb2JzZXJ2ZWQuZ2V0KG9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlY29yZENvcHkgPSB7IG9iamVjdDogb2JqZWN0IH0sIHByb3A7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAocHJvcCBpbiBjaGFuZ2VSZWNvcmQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcCAhPT0gXCJvYmplY3RcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNvcmRDb3B5W3Byb3BdID0gY2hhbmdlUmVjb3JkW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRDaGFuZ2VSZWNvcmQob2JqZWN0LCBkYXRhLCByZWNvcmRDb3B5KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICogQG1ldGhvZCBwZXJmb3JtQ2hhbmdlXHJcbiAgICAgICAgICAgICAgICAgKiBAc2VlIGh0dHA6Ly9hcnYuZ2l0aHViLmlvL2VjbWFzY3JpcHQtb2JqZWN0LW9ic2VydmUvI25vdGlmaWVycHJvdG90eXBlXy5wZXJmb3JtY2hhbmdlXHJcbiAgICAgICAgICAgICAgICAgKiBAbWVtYmVyb2YgTm90aWZpZXJcclxuICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjaGFuZ2VUeXBlXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0ge1BlcmZvcm1lcn0gZnVuYyAgICAgVGhlIHRhc2sgcGVyZm9ybWVyXHJcbiAgICAgICAgICAgICAgICAgKiBAcGFyYW0geyp9IFt0aGlzT2JqXSAgICAgICAgVXNlZCB0byBzZXQgYHRoaXNgIHdoZW4gY2FsbGluZyBmdW5jXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIHBlcmZvcm1DaGFuZ2U6IGZ1bmN0aW9uKGNoYW5nZVR5cGUsIGZ1bmMvKiwgdGhpc09iaiovKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGFuZ2VUeXBlICE9PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBub24tc3RyaW5nIGNoYW5nZVR5cGVcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHBlcmZvcm0gbm9uLWZ1bmN0aW9uXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIGRhdGEsIHRoZSBvYmplY3QgaGFzIGJlZW4gdW5vYnNlcnZlZFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gb2JzZXJ2ZWQuZ2V0KG9iamVjdCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3AsIGNoYW5nZVJlY29yZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5jYWxsKGFyZ3VtZW50c1syXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgJiYgcGVyZm9ybVByb3BlcnR5Q2hlY2tzKGRhdGEsIG9iamVjdCwgY2hhbmdlVHlwZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gZGF0YSwgdGhlIG9iamVjdCBoYXMgYmVlbiB1bm9ic2VydmVkXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgcmVzdWx0ICYmIHR5cGVvZiByZXN1bHQgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlUmVjb3JkID0geyBvYmplY3Q6IG9iamVjdCwgdHlwZTogY2hhbmdlVHlwZSB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHByb3AgaW4gcmVzdWx0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3AgIT09IFwib2JqZWN0XCIgJiYgcHJvcCAhPT0gXCJ0eXBlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlUmVjb3JkW3Byb3BdID0gcmVzdWx0W3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRDaGFuZ2VSZWNvcmQob2JqZWN0LCBkYXRhLCBjaGFuZ2VSZWNvcmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZWdpc3RlciAob3IgcmVkZWZpbmVzKSBhbiBoYW5kbGVyIGluIHRoZSBjb2xsZWN0aW9uIGZvciBhIGdpdmVuXHJcbiAgICAgICAgICogb2JqZWN0IGFuZCBhIGdpdmVuIHR5cGUgYWNjZXB0IGxpc3QuXHJcbiAgICAgICAgICogQGZ1bmN0aW9uIHNldEhhbmRsZXJcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3REYXRhfSBkYXRhXHJcbiAgICAgICAgICogQHBhcmFtIHtIYW5kbGVyfSBoYW5kbGVyXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmdbXX0gYWNjZXB0TGlzdFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNldEhhbmRsZXIgPSBmdW5jdGlvbihvYmplY3QsIGRhdGEsIGhhbmRsZXIsIGFjY2VwdExpc3QpIHtcclxuICAgICAgICAgICAgdmFyIGhkYXRhID0gaGFuZGxlcnMuZ2V0KGhhbmRsZXIpO1xyXG4gICAgICAgICAgICBpZiAoIWhkYXRhKVxyXG4gICAgICAgICAgICAgICAgaGFuZGxlcnMuc2V0KGhhbmRsZXIsIGhkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ic2VydmVkOiBjcmVhdGVNYXAoKSxcclxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VSZWNvcmRzOiBbXVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGhkYXRhLm9ic2VydmVkLnNldChvYmplY3QsIHtcclxuICAgICAgICAgICAgICAgIGFjY2VwdExpc3Q6IGFjY2VwdExpc3Quc2xpY2UoKSxcclxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGRhdGEuaGFuZGxlcnMuc2V0KGhhbmRsZXIsIGhkYXRhKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBZGRzIGEgY2hhbmdlIHJlY29yZCBpbiBhIGdpdmVuIE9iamVjdERhdGFcclxuICAgICAgICAgKiBAZnVuY3Rpb24gYWRkQ2hhbmdlUmVjb3JkXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0RGF0YX0gZGF0YVxyXG4gICAgICAgICAqIEBwYXJhbSB7Q2hhbmdlUmVjb3JkfSBjaGFuZ2VSZWNvcmRcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2V4Y2VwdF1cclxuICAgICAgICAgKi9cclxuICAgICAgICBhZGRDaGFuZ2VSZWNvcmQgPSBmdW5jdGlvbihvYmplY3QsIGRhdGEsIGNoYW5nZVJlY29yZCwgZXhjZXB0KSB7XHJcbiAgICAgICAgICAgIGRhdGEuaGFuZGxlcnMuZm9yRWFjaChmdW5jdGlvbihoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjY2VwdExpc3QgPSBoZGF0YS5vYnNlcnZlZC5nZXQob2JqZWN0KS5hY2NlcHRMaXN0O1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgZXhjZXB0IGlzIGRlZmluZWQsIE5vdGlmaWVyLnBlcmZvcm1DaGFuZ2UgaGFzIGJlZW5cclxuICAgICAgICAgICAgICAgIC8vIGNhbGxlZCwgd2l0aCBleGNlcHQgYXMgdGhlIHR5cGUuXHJcbiAgICAgICAgICAgICAgICAvLyBBbGwgdGhlIGhhbmRsZXJzIHRoYXQgYWNjZXB0cyB0aGF0IHR5cGUgYXJlIHNraXBwZWQuXHJcbiAgICAgICAgICAgICAgICBpZiAoKHR5cGVvZiBleGNlcHQgIT09IFwic3RyaW5nXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgaW5BcnJheShhY2NlcHRMaXN0LCBleGNlcHQpID09PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgaW5BcnJheShhY2NlcHRMaXN0LCBjaGFuZ2VSZWNvcmQudHlwZSkgPiAtMSlcclxuICAgICAgICAgICAgICAgICAgICBoZGF0YS5jaGFuZ2VSZWNvcmRzLnB1c2goY2hhbmdlUmVjb3JkKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICBvYnNlcnZlZCA9IGNyZWF0ZU1hcCgpO1xyXG4gICAgaGFuZGxlcnMgPSBjcmVhdGVNYXAoKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBmdW5jdGlvbiBPYmplY3Qub2JzZXJ2ZVxyXG4gICAgICogQHNlZSBodHRwOi8vYXJ2LmdpdGh1Yi5pby9lY21hc2NyaXB0LW9iamVjdC1vYnNlcnZlLyNPYmplY3Qub2JzZXJ2ZVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxyXG4gICAgICogQHBhcmFtIHtIYW5kbGVyfSBoYW5kbGVyXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ1tdfSBbYWNjZXB0TGlzdF1cclxuICAgICAqIEB0aHJvd3Mge1R5cGVFcnJvcn1cclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9ICAgICAgICAgICAgICAgVGhlIG9ic2VydmVkIG9iamVjdFxyXG4gICAgICovXHJcbiAgICBPLm9ic2VydmUgPSBmdW5jdGlvbiBvYnNlcnZlKG9iamVjdCwgaGFuZGxlciwgYWNjZXB0TGlzdCkge1xyXG4gICAgICAgIGlmICghb2JqZWN0IHx8IHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG9iamVjdCAhPT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0Lm9ic2VydmUgY2Fubm90IG9ic2VydmUgbm9uLW9iamVjdFwiKTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyICE9PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3Qub2JzZXJ2ZSBjYW5ub3QgZGVsaXZlciB0byBub24tZnVuY3Rpb25cIik7XHJcblxyXG4gICAgICAgIGlmIChPLmlzRnJvemVuICYmIE8uaXNGcm96ZW4oaGFuZGxlcikpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3Qub2JzZXJ2ZSBjYW5ub3QgZGVsaXZlciB0byBhIGZyb3plbiBmdW5jdGlvbiBvYmplY3RcIik7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgYWNjZXB0TGlzdCA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgYWNjZXB0TGlzdCA9IGRlZmF1bHRBY2NlcHRMaXN0O1xyXG4gICAgICAgIGVsc2UgaWYgKCFhY2NlcHRMaXN0IHx8IHR5cGVvZiBhY2NlcHRMaXN0ICE9PSBcIm9iamVjdFwiKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiVGhpcmQgYXJndW1lbnQgdG8gT2JqZWN0Lm9ic2VydmUgbXVzdCBiZSBhbiBhcnJheSBvZiBzdHJpbmdzLlwiKTtcclxuXHJcbiAgICAgICAgZG9PYnNlcnZlKG9iamVjdCwgaGFuZGxlciwgYWNjZXB0TGlzdCk7XHJcblxyXG4gICAgICAgIHJldHVybiBvYmplY3Q7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQGZ1bmN0aW9uIE9iamVjdC51bm9ic2VydmVcclxuICAgICAqIEBzZWUgaHR0cDovL2Fydi5naXRodWIuaW8vZWNtYXNjcmlwdC1vYmplY3Qtb2JzZXJ2ZS8jT2JqZWN0LnVub2JzZXJ2ZVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxyXG4gICAgICogQHBhcmFtIHtIYW5kbGVyfSBoYW5kbGVyXHJcbiAgICAgKiBAdGhyb3dzIHtUeXBlRXJyb3J9XHJcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSAgICAgICAgIFRoZSBnaXZlbiBvYmplY3RcclxuICAgICAqL1xyXG4gICAgTy51bm9ic2VydmUgPSBmdW5jdGlvbiB1bm9ic2VydmUob2JqZWN0LCBoYW5kbGVyKSB7XHJcbiAgICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCB8fCB0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiBvYmplY3QgIT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdC51bm9ic2VydmUgY2Fubm90IHVub2JzZXJ2ZSBub24tb2JqZWN0XCIpO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgIT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdC51bm9ic2VydmUgY2Fubm90IGRlbGl2ZXIgdG8gbm9uLWZ1bmN0aW9uXCIpO1xyXG5cclxuICAgICAgICB2YXIgaGRhdGEgPSBoYW5kbGVycy5nZXQoaGFuZGxlciksIG9kYXRhO1xyXG5cclxuICAgICAgICBpZiAoaGRhdGEgJiYgKG9kYXRhID0gaGRhdGEub2JzZXJ2ZWQuZ2V0KG9iamVjdCkpKSB7XHJcbiAgICAgICAgICAgIGhkYXRhLm9ic2VydmVkLmZvckVhY2goZnVuY3Rpb24ob2RhdGEsIG9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgcGVyZm9ybVByb3BlcnR5Q2hlY2tzKG9kYXRhLmRhdGEsIG9iamVjdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBuZXh0RnJhbWUoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBkZWxpdmVySGFuZGxlclJlY29yZHMoaGRhdGEsIGhhbmRsZXIpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEluIEZpcmVmb3ggMTMtMTgsIHNpemUgaXMgYSBmdW5jdGlvbiwgYnV0IGNyZWF0ZU1hcCBzaG91bGQgZmFsbFxyXG4gICAgICAgICAgICAvLyBiYWNrIHRvIHRoZSBzaGltIGZvciB0aG9zZSB2ZXJzaW9uc1xyXG4gICAgICAgICAgICBpZiAoaGRhdGEub2JzZXJ2ZWQuc2l6ZSA9PT0gMSAmJiBoZGF0YS5vYnNlcnZlZC5oYXMob2JqZWN0KSlcclxuICAgICAgICAgICAgICAgIGhhbmRsZXJzW1wiZGVsZXRlXCJdKGhhbmRsZXIpO1xyXG4gICAgICAgICAgICBlbHNlIGhkYXRhLm9ic2VydmVkW1wiZGVsZXRlXCJdKG9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICBpZiAob2RhdGEuZGF0YS5oYW5kbGVycy5zaXplID09PSAxKVxyXG4gICAgICAgICAgICAgICAgb2JzZXJ2ZWRbXCJkZWxldGVcIl0ob2JqZWN0KTtcclxuICAgICAgICAgICAgZWxzZSBvZGF0YS5kYXRhLmhhbmRsZXJzW1wiZGVsZXRlXCJdKGhhbmRsZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAZnVuY3Rpb24gT2JqZWN0LmdldE5vdGlmaWVyXHJcbiAgICAgKiBAc2VlIGh0dHA6Ly9hcnYuZ2l0aHViLmlvL2VjbWFzY3JpcHQtb2JqZWN0LW9ic2VydmUvI0dldE5vdGlmaWVyXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XHJcbiAgICAgKiBAdGhyb3dzIHtUeXBlRXJyb3J9XHJcbiAgICAgKiBAcmV0dXJucyB7Tm90aWZpZXJ9XHJcbiAgICAgKi9cclxuICAgIE8uZ2V0Tm90aWZpZXIgPSBmdW5jdGlvbiBnZXROb3RpZmllcihvYmplY3QpIHtcclxuICAgICAgICBpZiAob2JqZWN0ID09PSBudWxsIHx8IHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG9iamVjdCAhPT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0LmdldE5vdGlmaWVyIGNhbm5vdCBnZXROb3RpZmllciBub24tb2JqZWN0XCIpO1xyXG5cclxuICAgICAgICBpZiAoTy5pc0Zyb3plbiAmJiBPLmlzRnJvemVuKG9iamVjdCkpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICByZXR1cm4gcmV0cmlldmVOb3RpZmllcihvYmplY3QpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBmdW5jdGlvbiBPYmplY3QuZGVsaXZlckNoYW5nZVJlY29yZHNcclxuICAgICAqIEBzZWUgaHR0cDovL2Fydi5naXRodWIuaW8vZWNtYXNjcmlwdC1vYmplY3Qtb2JzZXJ2ZS8jT2JqZWN0LmRlbGl2ZXJDaGFuZ2VSZWNvcmRzXHJcbiAgICAgKiBAc2VlIGh0dHA6Ly9hcnYuZ2l0aHViLmlvL2VjbWFzY3JpcHQtb2JqZWN0LW9ic2VydmUvI0RlbGl2ZXJDaGFuZ2VSZWNvcmRzXHJcbiAgICAgKiBAcGFyYW0ge0hhbmRsZXJ9IGhhbmRsZXJcclxuICAgICAqIEB0aHJvd3Mge1R5cGVFcnJvcn1cclxuICAgICAqL1xyXG4gICAgTy5kZWxpdmVyQ2hhbmdlUmVjb3JkcyA9IGZ1bmN0aW9uIGRlbGl2ZXJDaGFuZ2VSZWNvcmRzKGhhbmRsZXIpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgIT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdC5kZWxpdmVyQ2hhbmdlUmVjb3JkcyBjYW5ub3QgZGVsaXZlciB0byBub24tZnVuY3Rpb25cIik7XHJcblxyXG4gICAgICAgIHZhciBoZGF0YSA9IGhhbmRsZXJzLmdldChoYW5kbGVyKTtcclxuICAgICAgICBpZiAoaGRhdGEpIHtcclxuICAgICAgICAgICAgaGRhdGEub2JzZXJ2ZWQuZm9yRWFjaChmdW5jdGlvbihvZGF0YSwgb2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBwZXJmb3JtUHJvcGVydHlDaGVja3Mob2RhdGEuZGF0YSwgb2JqZWN0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGRlbGl2ZXJIYW5kbGVyUmVjb3JkcyhoZGF0YSwgaGFuZGxlcik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn0pKE9iamVjdCwgQXJyYXksIHRoaXMpO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLi8uLi9ub2RlX21vZHVsZXMvb2JqZWN0Lm9ic2VydmUvZGlzdC9vYmplY3Qtb2JzZXJ2ZS5qc1wiLFwiLy4uLy4uL25vZGVfbW9kdWxlcy9vYmplY3Qub2JzZXJ2ZS9kaXN0XCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcblxuICAgIHZhciBkZXB0aFN0cmluZyA9ICcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc7XG5cbiAgICBmdW5jdGlvbiBEYXRhTm9kZUJhc2Uoa2V5KSB7XG4gICAgICAgIHRoaXMubGFiZWwgPSBrZXk7XG4gICAgICAgIHRoaXMuZGF0YSA9IFsnJ107XG4gICAgICAgIHRoaXMucm93SW5kZXhlcyA9IFtdO1xuICAgICAgICB0aGlzLmhhc0NoaWxkcmVuID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZGVwdGggPSAwO1xuICAgICAgICB0aGlzLmhlaWdodCA9IDE7XG4gICAgICAgIHRoaXMuZXhwYW5kZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBEYXRhTm9kZUJhc2UucHJvdG90eXBlLmlzTnVsbE9iamVjdCA9IGZhbHNlO1xuXG4gICAgRGF0YU5vZGVCYXNlLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVt4XTtcbiAgICB9O1xuXG4gICAgRGF0YU5vZGVCYXNlLnByb3RvdHlwZS5wcnVuZSA9IGZ1bmN0aW9uKGRlcHRoKSB7XG4gICAgICAgIHRoaXMuZGVwdGggPSBkZXB0aDtcbiAgICAgICAgdGhpcy5kYXRhWzBdID0gdGhpcy5jb21wdXRlRGVwdGhTdHJpbmcoKTtcbiAgICB9O1xuXG4gICAgRGF0YU5vZGVCYXNlLnByb3RvdHlwZS5jb21wdXRlRGVwdGhTdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0cmluZyA9IGRlcHRoU3RyaW5nLnN1YnN0cmluZygwLCAyICsgKHRoaXMuZGVwdGggKiAzKSkgKyB0aGlzLmxhYmVsO1xuICAgICAgICByZXR1cm4gc3RyaW5nO1xuICAgIH07XG5cbiAgICBEYXRhTm9kZUJhc2UucHJvdG90eXBlLmNvbXB1dGVIZWlnaHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfTtcblxuICAgIERhdGFOb2RlQmFzZS5wcm90b3R5cGUuZ2V0QWxsUm93SW5kZXhlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yb3dJbmRleGVzO1xuICAgIH07XG5cbiAgICBEYXRhTm9kZUJhc2UucHJvdG90eXBlLmNvbXB1dGVBZ2dyZWdhdGVzID0gZnVuY3Rpb24oYWdncmVnYXRvcikge1xuICAgICAgICB0aGlzLmFwcGx5QWdncmVnYXRlcyhhZ2dyZWdhdG9yKTtcbiAgICB9O1xuXG4gICAgRGF0YU5vZGVCYXNlLnByb3RvdHlwZS5hcHBseUFnZ3JlZ2F0ZXMgPSBmdW5jdGlvbihhZ2dyZWdhdG9yKSB7XG4gICAgICAgIHZhciBoYXNHcm91cHNPZmZzZXQgPSBhZ2dyZWdhdG9yLmhhc0dyb3VwcygpID8gMSA6IDA7XG4gICAgICAgIHZhciBpbmRleGVzID0gdGhpcy5nZXRBbGxSb3dJbmRleGVzKCk7XG4gICAgICAgIGlmIChpbmRleGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuOyAvLyBubyBkYXRhIHRvIHJvbGx1cCBvblxuICAgICAgICB9XG4gICAgICAgIHZhciBhZ2dyZWdhdGVzID0gYWdncmVnYXRvci5hZ2dyZWdhdGVzO1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMuZGF0YTtcbiAgICAgICAgZGF0YS5sZW5ndGggPSBhZ2dyZWdhdGVzLmxlbmd0aCArIGhhc0dyb3Vwc09mZnNldDtcblxuICAgICAgICB2YXIgc29ydGVyID0gYWdncmVnYXRvci5zb3J0ZXJJbnN0YW5jZTtcbiAgICAgICAgc29ydGVyLmluZGV4ZXMgPSBpbmRleGVzO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWdncmVnYXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGFnZ3JlZ2F0ZSA9IGFnZ3JlZ2F0ZXNbaV07XG4gICAgICAgICAgICBkYXRhW2kgKyBoYXNHcm91cHNPZmZzZXRdID0gYWdncmVnYXRlKHNvcnRlcik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIH07XG5cbiAgICBEYXRhTm9kZUJhc2UucHJvdG90eXBlLmJ1aWxkVmlldyA9IGZ1bmN0aW9uKGFnZ3JlZ2F0b3IpIHtcbiAgICAgICAgYWdncmVnYXRvci52aWV3LnB1c2godGhpcyk7XG4gICAgfTtcblxuICAgIERhdGFOb2RlQmFzZS5wcm90b3R5cGUudG9nZ2xlRXhwYW5zaW9uU3RhdGUgPSBmdW5jdGlvbigpIHsgLyogYWdncmVnYXRvciAqL1xuICAgICAgICAvL2RvIG5vdGhpbmcgYnkgZGVmYXVsdFxuICAgIH07XG5cbiAgICByZXR1cm4gRGF0YU5vZGVCYXNlO1xuXG59KSgpO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9EYXRhTm9kZUJhc2UuanNcIixcIi9cIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBNYXAgPSByZXF1aXJlKCcuL01hcCcpO1xudmFyIERhdGFOb2RlQmFzZSA9IHJlcXVpcmUoJy4vRGF0YU5vZGVCYXNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIEV4cGFuZGVkTWFwID0ge1xuICAgICAgICB0cnVlOiAn4pa+JyxcbiAgICAgICAgZmFsc2U6ICfilrgnXG4gICAgfTtcbiAgICB2YXIgZGVwdGhTdHJpbmcgPSAnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnO1xuXG4gICAgZnVuY3Rpb24gRGF0YU5vZGVHcm91cChrZXkpIHtcbiAgICAgICAgRGF0YU5vZGVCYXNlLmNhbGwodGhpcywga2V5KTtcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBEYXRhTm9kZUdyb3VwLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGF0YU5vZGVCYXNlLnByb3RvdHlwZSk7XG5cbiAgICBEYXRhTm9kZUdyb3VwLnByb3RvdHlwZS5wcnVuZSA9IGZ1bmN0aW9uKGRlcHRoKSB7XG4gICAgICAgIHRoaXMuZGVwdGggPSBkZXB0aDtcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW4udmFsdWVzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV07XG4gICAgICAgICAgICBjaGlsZC5wcnVuZSh0aGlzLmRlcHRoICsgMSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kYXRhWzBdID0gdGhpcy5jb21wdXRlRGVwdGhTdHJpbmcoKTtcbiAgICB9O1xuXG4gICAgRGF0YU5vZGVHcm91cC5wcm90b3R5cGUuY29tcHV0ZURlcHRoU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpY29uID0gRXhwYW5kZWRNYXBbdGhpcy5leHBhbmRlZCArICcnXTtcbiAgICAgICAgdmFyIHN0cmluZyA9IGRlcHRoU3RyaW5nLnN1YnN0cmluZygwLCB0aGlzLmRlcHRoICogMykgKyBpY29uICsgJyAnICsgdGhpcy5sYWJlbDtcbiAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICB9O1xuXG4gICAgRGF0YU5vZGVHcm91cC5wcm90b3R5cGUuZ2V0QWxsUm93SW5kZXhlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5yb3dJbmRleGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5yb3dJbmRleGVzID0gdGhpcy5jb21wdXRlQWxsUm93SW5kZXhlcygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJvd0luZGV4ZXM7XG4gICAgfTtcblxuICAgIERhdGFOb2RlR3JvdXAucHJvdG90eXBlLmNvbXB1dGVBbGxSb3dJbmRleGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgdmFyIGNoaWxkSW5kZXhlcyA9IGNoaWxkLmdldEFsbFJvd0luZGV4ZXMoKTtcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkocmVzdWx0LCBbcmVzdWx0Lmxlbmd0aCwgMF0uY29uY2F0KGNoaWxkSW5kZXhlcykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIERhdGFOb2RlR3JvdXAucHJvdG90eXBlLnRvZ2dsZUV4cGFuc2lvblN0YXRlID0gZnVuY3Rpb24oYWdncmVnYXRvcikgeyAvKiBhZ2dyZWdhdG9yICovXG4gICAgICAgIHRoaXMuZXhwYW5kZWQgPSAhdGhpcy5leHBhbmRlZDtcbiAgICAgICAgdGhpcy5kYXRhWzBdID0gdGhpcy5jb21wdXRlRGVwdGhTdHJpbmcoKTtcbiAgICAgICAgaWYgKHRoaXMuZXhwYW5kZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY29tcHV0ZUFnZ3JlZ2F0ZXMoYWdncmVnYXRvcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgRGF0YU5vZGVHcm91cC5wcm90b3R5cGUuY29tcHV0ZUFnZ3JlZ2F0ZXMgPSBmdW5jdGlvbihhZ2dyZWdhdG9yKSB7XG4gICAgICAgIHRoaXMuYXBwbHlBZ2dyZWdhdGVzKGFnZ3JlZ2F0b3IpO1xuICAgICAgICBpZiAoIXRoaXMuZXhwYW5kZWQpIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gd2VyZSBub3QgYmVpbmcgdmlld2VkLCBkb24ndCBoYXZlIGNoaWxkIG5vZGVzIGRvIGNvbXB1dGF0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltpXS5jb21wdXRlQWdncmVnYXRlcyhhZ2dyZWdhdG9yKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBEYXRhTm9kZUdyb3VwLnByb3RvdHlwZS5idWlsZFZpZXcgPSBmdW5jdGlvbihhZ2dyZWdhdG9yKSB7XG4gICAgICAgIGFnZ3JlZ2F0b3Iudmlldy5wdXNoKHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5leHBhbmRlZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBjaGlsZC5idWlsZFZpZXcoYWdncmVnYXRvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgRGF0YU5vZGVHcm91cC5wcm90b3R5cGUuY29tcHV0ZUhlaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaGVpZ2h0ID0gMTsgLy9JJ20gMSBoaWdoXG4gICAgICAgIGlmICghdGhpcy5leHBhbmRlZCkge1xuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gaGVpZ2h0ICsgdGhpcy5jaGlsZHJlbltpXS5jb21wdXRlSGVpZ2h0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5oZWlnaHQ7XG4gICAgfTtcblxuICAgIHJldHVybiBEYXRhTm9kZUdyb3VwO1xuXG59KSgpO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9EYXRhTm9kZUdyb3VwLmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRGF0YU5vZGVCYXNlID0gcmVxdWlyZSgnLi9EYXRhTm9kZUJhc2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICBmdW5jdGlvbiBEYXRhTm9kZUxlYWYoa2V5KSB7XG4gICAgICAgIERhdGFOb2RlQmFzZS5jYWxsKHRoaXMsIGtleSk7XG4gICAgfVxuXG4gICAgRGF0YU5vZGVMZWFmLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGF0YU5vZGVCYXNlLnByb3RvdHlwZSk7XG5cbiAgICBEYXRhTm9kZUxlYWYucHJvdG90eXBlLnBydW5lID0gZnVuY3Rpb24oZGVwdGgpIHtcbiAgICAgICAgdGhpcy5kZXB0aCA9IGRlcHRoO1xuICAgICAgICB0aGlzLmRhdGFbMF0gPSB0aGlzLmNvbXB1dGVEZXB0aFN0cmluZygpO1xuICAgIH07XG5cbiAgICBEYXRhTm9kZUxlYWYucHJvdG90eXBlLmNvbXB1dGVIZWlnaHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfTtcblxuICAgIERhdGFOb2RlTGVhZi5wcm90b3R5cGUuZ2V0QWxsUm93SW5kZXhlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yb3dJbmRleGVzO1xuICAgIH07XG5cbiAgICBEYXRhTm9kZUxlYWYucHJvdG90eXBlLmNvbXB1dGVBZ2dyZWdhdGVzID0gZnVuY3Rpb24oYWdncmVnYXRvcikge1xuICAgICAgICB0aGlzLmFwcGx5QWdncmVnYXRlcyhhZ2dyZWdhdG9yKTtcbiAgICB9O1xuXG4gICAgRGF0YU5vZGVMZWFmLnByb3RvdHlwZS5idWlsZFZpZXcgPSBmdW5jdGlvbihhZ2dyZWdhdG9yKSB7XG4gICAgICAgIGFnZ3JlZ2F0b3Iudmlldy5wdXNoKHRoaXMpO1xuICAgIH07XG5cbiAgICByZXR1cm4gRGF0YU5vZGVMZWFmO1xuXG59KSgpO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9EYXRhTm9kZUxlYWYuanNcIixcIi9cIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBEYXRhTm9kZUdyb3VwID0gcmVxdWlyZSgnLi9EYXRhTm9kZUdyb3VwJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgZnVuY3Rpb24gRGF0YU5vZGVUcmVlKGtleSkge1xuICAgICAgICBEYXRhTm9kZUdyb3VwLmNhbGwodGhpcywga2V5KTtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSAwO1xuICAgICAgICB0aGlzLmV4cGFuZGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBEYXRhTm9kZVRyZWUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShEYXRhTm9kZUdyb3VwLnByb3RvdHlwZSk7XG5cbiAgICBEYXRhTm9kZVRyZWUucHJvdG90eXBlLnBydW5lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuLnZhbHVlcztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgY2hpbGQucHJ1bmUoMCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgRGF0YU5vZGVUcmVlLnByb3RvdHlwZS5idWlsZFZpZXcgPSBmdW5jdGlvbihhZ2dyZWdhdG9yKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgIGNoaWxkLmJ1aWxkVmlldyhhZ2dyZWdhdG9yKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBEYXRhTm9kZVRyZWUucHJvdG90eXBlLmNvbXB1dGVIZWlnaHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGhlaWdodCA9IDE7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaGVpZ2h0ID0gaGVpZ2h0ICsgdGhpcy5jaGlsZHJlbltpXS5jb21wdXRlSGVpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaGVpZ2h0O1xuICAgIH07XG5cblxuICAgIHJldHVybiBEYXRhTm9kZVRyZWU7XG5cbn0pKCk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL0RhdGFOb2RlVHJlZS5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIERhdGFTb3VyY2VTb3J0ZXIgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2VTb3J0ZXInKTtcbnZhciBEYXRhTm9kZVRyZWUgPSByZXF1aXJlKCcuL0RhdGFOb2RlVHJlZScpO1xudmFyIERhdGFOb2RlR3JvdXAgPSByZXF1aXJlKCcuL0RhdGFOb2RlR3JvdXAnKTtcbnZhciBEYXRhTm9kZUxlYWYgPSByZXF1aXJlKCcuL0RhdGFOb2RlTGVhZicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcblxuICAgIHZhciBoZWFkZXJpZnkgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgICAgdmFyIHBpZWNlcyA9IHN0cmluZy5yZXBsYWNlKC9bXy1dL2csICcgJykucmVwbGFjZSgvW0EtWl0vZywgJyAkJicpLnNwbGl0KCcgJykubWFwKGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICAgIHJldHVybiAocy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHMuc2xpY2UoMSkpLnRyaW0oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHBpZWNlcyA9IHBpZWNlcy5maWx0ZXIoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUubGVuZ3RoICE9PSAwO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHBpZWNlcy5qb2luKCcgJykudHJpbSgpO1xuICAgIH07XG5cbiAgICAvLz9bdCxjLGIsYV1cbiAgICAvLyB0IGlzIGEgZGF0YVNvdXJjZSxcbiAgICAvLyBhIGlzIGEgZGljaXRpb25hcnkgb2YgYWdncmVnYXRlcywgIGNvbHVtbk5hbWU6ZnVuY3Rpb25cbiAgICAvLyBiIGlzIGEgZGljaXRpb25hcnkgb2YgZ3JvdXBieXMsIGNvbHVtbk5hbWU6c291cmNlQ29sdW1uTmFtZVxuICAgIC8vIGMgaXMgYSBsaXN0IG9mIGNvbnN0cmFpbnRzLFxuXG4gICAgZnVuY3Rpb24gRGF0YVNvdXJjZUFnZ3JlZ2F0b3IoZGF0YVNvdXJjZSkge1xuICAgICAgICB0aGlzLnRyZWUgPSBuZXcgRGF0YU5vZGVUcmVlKCdUb3RhbHMnKTtcbiAgICAgICAgdGhpcy5pbmRleGVzID0gW107XG4gICAgICAgIHRoaXMuZGF0YVNvdXJjZSA9IGRhdGFTb3VyY2U7XG4gICAgICAgIHRoaXMuYWdncmVnYXRlcyA9IFtdO1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5ncm91cEJ5cyA9IFtdO1xuICAgICAgICB0aGlzLnZpZXcgPSBbXTtcbiAgICAgICAgdGhpcy5zb3J0ZXJJbnN0YW5jZSA9IHt9O1xuICAgICAgICB0aGlzLnByZXNvcnRHcm91cHMgPSB0cnVlO1xuICAgICAgICB0aGlzLmxhc3RBZ2dyZWdhdGUgPSB7fTtcbiAgICAgICAgdGhpcy5zZXRBZ2dyZWdhdGVzKHt9KTtcbiAgICB9XG5cbiAgICBEYXRhU291cmNlQWdncmVnYXRvci5wcm90b3R5cGUuaXNOdWxsT2JqZWN0ID0gZmFsc2U7XG5cbiAgICBEYXRhU291cmNlQWdncmVnYXRvci5wcm90b3R5cGUuc2V0QWdncmVnYXRlcyA9IGZ1bmN0aW9uKGFnZ3JlZ2F0aW9ucykge1xuICAgICAgICB0aGlzLmxhc3RBZ2dyZWdhdGUgPSBhZ2dyZWdhdGlvbnM7XG4gICAgICAgIHZhciBwcm9wcyA9IFtdO1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgdGhpcy5jbGVhckFnZ3JlZ2F0aW9ucygpO1xuICAgICAgICB0aGlzLmhlYWRlcnMubGVuZ3RoID0gMDtcblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gYWdncmVnYXRpb25zKSB7XG4gICAgICAgICAgICBwcm9wcy5wdXNoKFtrZXksIGFnZ3JlZ2F0aW9uc1trZXldXSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiAocHJvcHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vICAgICB2YXIgZmllbGRzID0gW10uY29uY2F0KHRoaXMuZGF0YVNvdXJjZS5nZXRGaWVsZHMoKSk7XG4gICAgICAgIC8vICAgICBmb3IgKGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vICAgICAgICAgcHJvcHMucHVzaChbZmllbGRzW2ldLCBBZ2dyZWdhdGlvbnMuZmlyc3QoaSldKTsgLyoganNoaW50IGlnbm9yZTpsaW5lICovXG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKHRoaXMuaGFzR3JvdXBzKCkpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVycy5wdXNoKCdUcmVlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhZ2cgPSBwcm9wc1tpXTtcbiAgICAgICAgICAgIHRoaXMuYWRkQWdncmVnYXRlKGFnZ1swXSwgYWdnWzFdKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBEYXRhU291cmNlQWdncmVnYXRvci5wcm90b3R5cGUuYWRkQWdncmVnYXRlID0gZnVuY3Rpb24obGFiZWwsIGZ1bmMpIHtcbiAgICAgICAgdGhpcy5oZWFkZXJzLnB1c2goaGVhZGVyaWZ5KGxhYmVsKSk7XG4gICAgICAgIHRoaXMuYWdncmVnYXRlcy5wdXNoKGZ1bmMpO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlQWdncmVnYXRvci5wcm90b3R5cGUuc2V0R3JvdXBCeXMgPSBmdW5jdGlvbihjb2x1bW5JbmRleEFycmF5KSB7XG4gICAgICAgIHRoaXMuZ3JvdXBCeXMubGVuZ3RoID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2x1bW5JbmRleEFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdyb3VwQnlzLnB1c2goY29sdW1uSW5kZXhBcnJheVtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRBZ2dyZWdhdGVzKHRoaXMubGFzdEFnZ3JlZ2F0ZSk7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VBZ2dyZWdhdG9yLnByb3RvdHlwZS5hZGRHcm91cEJ5ID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgdGhpcy5ncm91cEJ5cy5wdXNoKGluZGV4KTtcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZUFnZ3JlZ2F0b3IucHJvdG90eXBlLmhhc0dyb3VwcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ncm91cEJ5cy5sZW5ndGggPiAwO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlQWdncmVnYXRvci5wcm90b3R5cGUuaGFzQWdncmVnYXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hZ2dyZWdhdGVzLmxlbmd0aCA+IDA7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VBZ2dyZWdhdG9yLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmJ1aWxkR3JvdXBUcmVlKCk7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VBZ2dyZWdhdG9yLnByb3RvdHlwZS5jbGVhckdyb3VwcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmdyb3VwQnlzLmxlbmd0aCA9IDA7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VBZ2dyZWdhdG9yLnByb3RvdHlwZS5jbGVhckFnZ3JlZ2F0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmFnZ3JlZ2F0ZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5oZWFkZXJzLmxlbmd0aCA9IDA7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VBZ2dyZWdhdG9yLnByb3RvdHlwZS5idWlsZEdyb3VwVHJlZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYywgciwgZywgdmFsdWUsIGNyZWF0ZUZ1bmM7XG4gICAgICAgIHZhciBjcmVhdGVCcmFuY2ggPSBmdW5jdGlvbihrZXksIG1hcCkge1xuICAgICAgICAgICAgdmFsdWUgPSBuZXcgRGF0YU5vZGVHcm91cChrZXkpO1xuICAgICAgICAgICAgbWFwLnNldChrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGNyZWF0ZUxlYWYgPSBmdW5jdGlvbihrZXksIG1hcCkge1xuICAgICAgICAgICAgdmFsdWUgPSBuZXcgRGF0YU5vZGVMZWFmKGtleSk7XG4gICAgICAgICAgICBtYXAuc2V0KGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZ3JvdXBCeXMgPSB0aGlzLmdyb3VwQnlzO1xuICAgICAgICB2YXIgc291cmNlID0gdGhpcy5kYXRhU291cmNlO1xuICAgICAgICB2YXIgcm93Q291bnQgPSBzb3VyY2UuZ2V0Um93Q291bnQoKTtcblxuICAgICAgICAvLyBsZXRzIHNvcnQgb3VyIGRhdGEgZmlyc3QuLi4uXG4gICAgICAgIGlmICh0aGlzLnByZXNvcnRHcm91cHMpIHtcbiAgICAgICAgICAgIGZvciAoYyA9IDA7IGMgPCBncm91cEJ5cy5sZW5ndGg7IGMrKykge1xuICAgICAgICAgICAgICAgIGcgPSBncm91cEJ5c1tncm91cEJ5cy5sZW5ndGggLSBjIC0gMV07XG4gICAgICAgICAgICAgICAgc291cmNlID0gbmV3IERhdGFTb3VyY2VTb3J0ZXIoc291cmNlKTtcbiAgICAgICAgICAgICAgICBzb3VyY2Uuc29ydE9uKGcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLnRyZWUgPSBuZXcgRGF0YU5vZGVUcmVlKCdUb3RhbHMnKTtcbiAgICAgICAgdmFyIHBhdGggPSB0cmVlO1xuICAgICAgICB2YXIgbGVhZkRlcHRoID0gZ3JvdXBCeXMubGVuZ3RoIC0gMTtcbiAgICAgICAgZm9yIChyID0gMDsgciA8IHJvd0NvdW50OyByKyspIHtcbiAgICAgICAgICAgIGZvciAoYyA9IDA7IGMgPCBncm91cEJ5cy5sZW5ndGg7IGMrKykge1xuICAgICAgICAgICAgICAgIGcgPSBncm91cEJ5c1tjXTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHNvdXJjZS5nZXRWYWx1ZShnLCByKTtcblxuICAgICAgICAgICAgICAgIC8vdGVzdCB0aGF0IEknbSBub3QgYSBsZWFmXG4gICAgICAgICAgICAgICAgY3JlYXRlRnVuYyA9IChjID09PSBsZWFmRGVwdGgpID8gY3JlYXRlTGVhZiA6IGNyZWF0ZUJyYW5jaDtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5jaGlsZHJlbi5nZXRJZkFic2VudCh2YWx1ZSwgY3JlYXRlRnVuYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXRoLnJvd0luZGV4ZXMucHVzaChyKTtcbiAgICAgICAgICAgIHBhdGggPSB0cmVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc29ydGVySW5zdGFuY2UgPSBuZXcgRGF0YVNvdXJjZVNvcnRlcihzb3VyY2UpO1xuICAgICAgICB0cmVlLnBydW5lKCk7XG4gICAgICAgIHRoaXMudHJlZS5jb21wdXRlQWdncmVnYXRlcyh0aGlzKTtcbiAgICAgICAgdGhpcy5idWlsZFZpZXcoKTtcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZUFnZ3JlZ2F0b3IucHJvdG90eXBlLmJ1aWxkVmlldyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnZpZXcubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy50cmVlLmNvbXB1dGVIZWlnaHQoKTtcbiAgICAgICAgdGhpcy50cmVlLmJ1aWxkVmlldyh0aGlzKTtcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZUFnZ3JlZ2F0b3IucHJvdG90eXBlLnZpZXdNYWtlc1NlbnNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhc0FnZ3JlZ2F0ZXMoKTtcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZUFnZ3JlZ2F0b3IucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICBpZiAoIXRoaXMudmlld01ha2VzU2Vuc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVNvdXJjZS5nZXRWYWx1ZSh4LCB5KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcm93ID0gdGhpcy52aWV3W3ldO1xuICAgICAgICBpZiAoIXJvdykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJvdy5nZXRWYWx1ZSh4KTtcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZUFnZ3JlZ2F0b3IucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24oeCwgeSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZpZXdNYWtlc1NlbnNlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGFTb3VyY2Uuc2V0VmFsdWUoeCwgeSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VBZ2dyZWdhdG9yLnByb3RvdHlwZS5nZXRDb2x1bW5Db3VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMudmlld01ha2VzU2Vuc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVNvdXJjZS5nZXRDb2x1bW5Db3VudCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjb2xDb3VudCA9IHRoaXMuZ2V0SGVhZGVycygpLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGNvbENvdW50O1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlQWdncmVnYXRvci5wcm90b3R5cGUuZ2V0Um93Q291bnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZpZXdNYWtlc1NlbnNlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGFTb3VyY2UuZ2V0Um93Q291bnQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy52aWV3Lmxlbmd0aDsgLy9oZWFkZXIgY29sdW1uXG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VBZ2dyZWdhdG9yLnByb3RvdHlwZS5jbGljayA9IGZ1bmN0aW9uKHkpIHtcbiAgICAgICAgdmFyIGdyb3VwID0gdGhpcy52aWV3W3ldO1xuICAgICAgICBncm91cC50b2dnbGVFeHBhbnNpb25TdGF0ZSh0aGlzKTtcbiAgICAgICAgdGhpcy5idWlsZFZpZXcoKTtcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZUFnZ3JlZ2F0b3IucHJvdG90eXBlLmdldEhlYWRlcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZpZXdNYWtlc1NlbnNlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGFTb3VyY2UuZ2V0SGVhZGVycygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmhlYWRlcnM7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VBZ2dyZWdhdG9yLnByb3RvdHlwZS5zZXRIZWFkZXJzID0gZnVuY3Rpb24oaGVhZGVycykge1xuICAgICAgICB0aGlzLmRhdGFTb3VyY2Uuc2V0SGVhZGVycyhoZWFkZXJzKTtcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZUFnZ3JlZ2F0b3IucHJvdG90eXBlLmdldEZpZWxkcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhU291cmNlLmdldEZpZWxkcygpO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlQWdncmVnYXRvci5wcm90b3R5cGUuc2V0RmllbGRzID0gZnVuY3Rpb24oZmllbGRzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFTb3VyY2Uuc2V0RmllbGRzKGZpZWxkcyk7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VBZ2dyZWdhdG9yLnByb3RvdHlwZS5nZXRHcmFuZFRvdGFscyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmlldyA9IHRoaXMudHJlZTtcbiAgICAgICAgcmV0dXJuIFt2aWV3LmRhdGFdO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlQWdncmVnYXRvci5wcm90b3R5cGUuZ2V0Um93ID0gZnVuY3Rpb24oeSkge1xuXG4gICAgICAgIGlmICghdGhpcy52aWV3TWFrZXNTZW5zZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYXRhU291cmNlLmdldFJvdyh5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb2xsdXBzID0gdGhpcy52aWV3W3ldO1xuICAgICAgICBpZiAoIXJvbGx1cHMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRyZWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcm9sbHVwcztcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZUFnZ3JlZ2F0b3IucHJvdG90eXBlLnNldERhdGEgPSBmdW5jdGlvbihhcnJheU9mVW5pZm9ybU9iamVjdHMpIHtcbiAgICAgICAgdGhpcy5kYXRhU291cmNlLnNldERhdGEoYXJyYXlPZlVuaWZvcm1PYmplY3RzKTtcbiAgICAgICAgdGhpcy5hcHBseSgpO1xuICAgIH07XG5cbiAgICByZXR1cm4gRGF0YVNvdXJjZUFnZ3JlZ2F0b3I7XG5cbn0pKCk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL0RhdGFTb3VyY2VBZ2dyZWdhdG9yLmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcblxuICAgIGZ1bmN0aW9uIERhdGFTb3VyY2VEZWNvcmF0b3IoZGF0YVNvdXJjZSkge1xuICAgICAgICB0aGlzLmRhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICAgICAgICB0aGlzLmluZGV4ZXMgPSBbXTtcbiAgICB9XG5cbiAgICBEYXRhU291cmNlRGVjb3JhdG9yLnByb3RvdHlwZS5pc051bGxPYmplY3QgPSBmYWxzZTtcblxuICAgIERhdGFTb3VyY2VEZWNvcmF0b3IucHJvdG90eXBlLnRyYW5zcG9zZVkgPSBmdW5jdGlvbih5KSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ZXMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleGVzW3ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB5O1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlRGVjb3JhdG9yLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5kYXRhU291cmNlLmdldFZhbHVlKHgsIHRoaXMudHJhbnNwb3NlWSh5KSk7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZURlY29yYXRvci5wcm90b3R5cGUuZ2V0Um93ID0gZnVuY3Rpb24oeSkge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFTb3VyY2UuZ2V0Um93KHRoaXMudHJhbnNwb3NlWSh5KSk7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VEZWNvcmF0b3IucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24oeCwgeSwgdmFsdWUpIHtcblxuICAgICAgICB0aGlzLmRhdGFTb3VyY2Uuc2V0VmFsdWUoeCwgdGhpcy50cmFuc3Bvc2VZKHkpLCB2YWx1ZSk7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VEZWNvcmF0b3IucHJvdG90eXBlLmdldENvbHVtbkNvdW50ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVNvdXJjZS5nZXRDb2x1bW5Db3VudCgpO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlRGVjb3JhdG9yLnByb3RvdHlwZS5nZXRGaWVsZHMgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhU291cmNlLmdldEZpZWxkcygpO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlRGVjb3JhdG9yLnByb3RvdHlwZS5zZXRGaWVsZHMgPSBmdW5jdGlvbihmaWVsZHMpIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhU291cmNlLnNldEZpZWxkcyhmaWVsZHMpO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlRGVjb3JhdG9yLnByb3RvdHlwZS5nZXRSb3dDb3VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pbmRleGVzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhlcy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVNvdXJjZS5nZXRSb3dDb3VudCgpO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlRGVjb3JhdG9yLnByb3RvdHlwZS5zZXRIZWFkZXJzID0gZnVuY3Rpb24oaGVhZGVycykge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhU291cmNlLnNldEhlYWRlcnMoaGVhZGVycyk7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VEZWNvcmF0b3IucHJvdG90eXBlLmdldEhlYWRlcnMgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhU291cmNlLmdldEhlYWRlcnMoKTtcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZURlY29yYXRvci5wcm90b3R5cGUuZ2V0R3JhbmRUb3RhbHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy9ub3RoaW5nIGhlcmVcbiAgICAgICAgcmV0dXJuO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlRGVjb3JhdG9yLnByb3RvdHlwZS5pbml0aWFsaXplSW5kZXhWZWN0b3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJvd0NvdW50ID0gdGhpcy5kYXRhU291cmNlLmdldFJvd0NvdW50KCk7XG4gICAgICAgIHZhciBpbmRleFZlY3RvciA9IG5ldyBBcnJheShyb3dDb3VudCk7XG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgcm93Q291bnQ7IHIrKykge1xuICAgICAgICAgICAgaW5kZXhWZWN0b3Jbcl0gPSByO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5kZXhlcyA9IGluZGV4VmVjdG9yO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlRGVjb3JhdG9yLnByb3RvdHlwZS5zZXREYXRhID0gZnVuY3Rpb24oYXJyYXlPZlVuaWZvcm1PYmplY3RzKSB7XG4gICAgICAgIHRoaXMuZGF0YVNvdXJjZS5zZXREYXRhKGFycmF5T2ZVbmlmb3JtT2JqZWN0cyk7XG4gICAgfTtcblxuICAgIHJldHVybiBEYXRhU291cmNlRGVjb3JhdG9yO1xuXG59KSgpO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9EYXRhU291cmNlRGVjb3JhdG9yLmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRGF0YVNvdXJjZURlY29yYXRvciA9IHJlcXVpcmUoJy4vRGF0YVNvdXJjZURlY29yYXRvcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcblxuICAgIGZ1bmN0aW9uIERhdGFTb3VyY2VGaWx0ZXIoZGF0YVNvdXJjZSkge1xuICAgICAgICBEYXRhU291cmNlRGVjb3JhdG9yLmNhbGwodGhpcywgZGF0YVNvdXJjZSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmZpbHRlcnMgPSBbXTtcbiAgICB9XG5cbiAgICBEYXRhU291cmNlRmlsdGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGF0YVNvdXJjZURlY29yYXRvci5wcm90b3R5cGUpO1xuXG4gICAgRGF0YVNvdXJjZUZpbHRlci5wcm90b3R5cGUuYWRkRmlsdGVyID0gZnVuY3Rpb24oY29sdW1uSW5kZXgsIGZpbHRlcikge1xuICAgICAgICBmaWx0ZXIuY29sdW1uSW5kZXggPSBjb2x1bW5JbmRleDtcbiAgICAgICAgdGhpcy5maWx0ZXJzLnB1c2goZmlsdGVyKTtcbiAgICB9O1xuICAgIERhdGFTb3VyY2VGaWx0ZXIucHJvdG90eXBlLnNldEZpbHRlciA9IGZ1bmN0aW9uKGNvbHVtbkluZGV4LCBmaWx0ZXIpIHtcbiAgICAgICAgZmlsdGVyLmNvbHVtbkluZGV4ID0gY29sdW1uSW5kZXg7XG4gICAgICAgIHRoaXMuZmlsdGVycy5wdXNoKGZpbHRlcik7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VGaWx0ZXIucHJvdG90eXBlLmNsZWFyRmlsdGVycyA9IGZ1bmN0aW9uKCkgeyAvKiBmaWx0ZXIgKi9cbiAgICAgICAgdGhpcy5maWx0ZXJzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuaW5kZXhlcy5sZW5ndGggPSAwO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlRmlsdGVyLnByb3RvdHlwZS5hcHBseUZpbHRlcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuZmlsdGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuaW5kZXhlcy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbmRleGVzID0gdGhpcy5pbmRleGVzO1xuICAgICAgICBpbmRleGVzLmxlbmd0aCA9IDA7XG4gICAgICAgIHZhciBjb3VudCA9IHRoaXMuZGF0YVNvdXJjZS5nZXRSb3dDb3VudCgpO1xuICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IGNvdW50OyByKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmFwcGx5RmlsdGVyc1RvKHIpKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhlcy5wdXNoKHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VGaWx0ZXIucHJvdG90eXBlLmFwcGx5RmlsdGVyc1RvID0gZnVuY3Rpb24ocikge1xuICAgICAgICB2YXIgZmlsdGVycyA9IHRoaXMuZmlsdGVycztcbiAgICAgICAgdmFyIGlzRmlsdGVyZWQgPSB0cnVlO1xuICAgICAgICBmb3IgKHZhciBmID0gMDsgZiA8IGZpbHRlcnMubGVuZ3RoOyBmKyspIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXIgPSBmaWx0ZXJzW2ZdO1xuICAgICAgICAgICAgdmFyIHJvd09iamVjdCA9IHRoaXMuZGF0YVNvdXJjZS5nZXRSb3cocik7XG4gICAgICAgICAgICBpc0ZpbHRlcmVkID0gaXNGaWx0ZXJlZCAmJiBmaWx0ZXIodGhpcy5kYXRhU291cmNlLmdldFZhbHVlKGZpbHRlci5jb2x1bW5JbmRleCwgciksIHJvd09iamVjdCwgcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlzRmlsdGVyZWQ7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VGaWx0ZXIucHJvdG90eXBlLmdldFJvd0NvdW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ZXMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleGVzLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICAvL291ciBmaWx0ZXIgbWF0Y2hlZCBub3RoaW5nLi4uLlxuICAgICAgICBpZiAodGhpcy5maWx0ZXJzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVNvdXJjZS5nZXRSb3dDb3VudCgpO1xuICAgIH07XG5cbiAgICByZXR1cm4gRGF0YVNvdXJjZUZpbHRlcjtcblxufSkoKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvRGF0YVNvdXJjZUZpbHRlci5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIERhdGFTb3VyY2VEZWNvcmF0b3IgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2VEZWNvcmF0b3InKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICBmdW5jdGlvbiBEYXRhU291cmNlR2xvYmFsRmlsdGVyKGRhdGFTb3VyY2UpIHtcbiAgICAgICAgRGF0YVNvdXJjZURlY29yYXRvci5jYWxsKHRoaXMsIGRhdGFTb3VyY2UsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBudWxsO1xuICAgIH1cblxuICAgIERhdGFTb3VyY2VHbG9iYWxGaWx0ZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShEYXRhU291cmNlRGVjb3JhdG9yLnByb3RvdHlwZSk7XG5cbiAgICBEYXRhU291cmNlR2xvYmFsRmlsdGVyLnByb3RvdHlwZS5zZXRGaWx0ZXIgPSBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VHbG9iYWxGaWx0ZXIucHJvdG90eXBlLmNsZWFyRmlsdGVycyA9IGZ1bmN0aW9uKCkgeyAvKiBmaWx0ZXIgKi9cbiAgICAgICAgdGhpcy5maWx0ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmluZGV4ZXMubGVuZ3RoID0gMDtcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZUdsb2JhbEZpbHRlci5wcm90b3R5cGUuZ2V0Um93Q291bnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXhlcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4ZXMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIC8vb3VyIGZpbHRlciBtYXRjaGVkIG5vdGhpbmcuLi4uXG4gICAgICAgIGlmICh0aGlzLmZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVNvdXJjZS5nZXRSb3dDb3VudCgpO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlR2xvYmFsRmlsdGVyLnByb3RvdHlwZS5hcHBseUZpbHRlcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZpbHRlcikge1xuICAgICAgICAgICAgdGhpcy5pbmRleGVzLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGluZGV4ZXMgPSB0aGlzLmluZGV4ZXM7XG4gICAgICAgIGluZGV4ZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdmFyIGNvdW50ID0gdGhpcy5kYXRhU291cmNlLmdldFJvd0NvdW50KCk7XG4gICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgY291bnQ7IHIrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuYXBwbHlGaWx0ZXJUbyhyKSkge1xuICAgICAgICAgICAgICAgIGluZGV4ZXMucHVzaChyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBEYXRhU291cmNlR2xvYmFsRmlsdGVyLnByb3RvdHlwZS5hcHBseUZpbHRlclRvID0gZnVuY3Rpb24ocikge1xuICAgICAgICB2YXIgaXNGaWx0ZXJlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgZmlsdGVyID0gdGhpcy5maWx0ZXI7XG4gICAgICAgIHZhciBjb2xDb3VudCA9IHRoaXMuZ2V0Q29sdW1uQ291bnQoKTtcbiAgICAgICAgdmFyIHJvd09iamVjdCA9IHRoaXMuZGF0YVNvdXJjZS5nZXRSb3cocik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgaXNGaWx0ZXJlZCA9IGlzRmlsdGVyZWQgfHwgZmlsdGVyKHRoaXMuZGF0YVNvdXJjZS5nZXRWYWx1ZShpLCByKSwgcm93T2JqZWN0LCByKTtcbiAgICAgICAgICAgIGlmIChpc0ZpbHRlcmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICByZXR1cm4gRGF0YVNvdXJjZUdsb2JhbEZpbHRlcjtcblxufSkoKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvRGF0YVNvdXJjZUdsb2JhbEZpbHRlci5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIFV0aWxzID0gcmVxdWlyZSgnLi9VdGlscy5qcycpO1xudmFyIERhdGFTb3VyY2VEZWNvcmF0b3IgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2VEZWNvcmF0b3InKTtcbnZhciB2YWx1ZU9yRnVuY3Rpb25FeGVjdXRlID0gZnVuY3Rpb24odmFsdWVPckZ1bmN0aW9uKSB7XG4gICAgdmFyIGlzRnVuY3Rpb24gPSAoKCh0eXBlb2YgdmFsdWVPckZ1bmN0aW9uKVswXSkgPT09ICdmJyk7XG4gICAgdmFyIHJlc3VsdCA9IGlzRnVuY3Rpb24gPyB2YWx1ZU9yRnVuY3Rpb24oKSA6IHZhbHVlT3JGdW5jdGlvbjtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICBmdW5jdGlvbiBEYXRhU291cmNlU29ydGVyKGRhdGFTb3VyY2UpIHtcbiAgICAgICAgRGF0YVNvdXJjZURlY29yYXRvci5jYWxsKHRoaXMsIGRhdGFTb3VyY2UpO1xuICAgICAgICB0aGlzLmRlc2NlbmRpbmdTb3J0ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgRGF0YVNvdXJjZVNvcnRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKERhdGFTb3VyY2VEZWNvcmF0b3IucHJvdG90eXBlKTtcblxuICAgIERhdGFTb3VyY2VTb3J0ZXIucHJvdG90eXBlLnNvcnRPbiA9IGZ1bmN0aW9uKGNvbHVtbkluZGV4LCBzb3J0VHlwZSkge1xuICAgICAgICBpZiAoc29ydFR5cGUgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuaW5kZXhlcy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUluZGV4VmVjdG9yKCk7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgVXRpbHMuc3RhYmxlU29ydCh0aGlzLmluZGV4ZXMsIGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gc2VsZi5kYXRhU291cmNlLmdldFZhbHVlKGNvbHVtbkluZGV4LCBpbmRleCk7XG4gICAgICAgICAgICB2YWwgPSB2YWx1ZU9yRnVuY3Rpb25FeGVjdXRlKHZhbCk7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9LCBzb3J0VHlwZSk7XG4gICAgfTtcblxuICAgIHJldHVybiBEYXRhU291cmNlU29ydGVyO1xuXG59KSgpO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9EYXRhU291cmNlU29ydGVyLmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRGF0YVNvdXJjZURlY29yYXRvciA9IHJlcXVpcmUoJy4vRGF0YVNvdXJjZURlY29yYXRvcicpO1xudmFyIERhdGFTb3VyY2VTb3J0ZXIgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2VTb3J0ZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICBmdW5jdGlvbiBEYXRhU291cmNlU29ydGVyQ29tcG9zaXRlKGRhdGFTb3VyY2UpIHtcbiAgICAgICAgRGF0YVNvdXJjZURlY29yYXRvci5jYWxsKHRoaXMsIGRhdGFTb3VyY2UpO1xuICAgICAgICB0aGlzLnNvcnRzID0gW107XG4gICAgICAgIHRoaXMubGFzdCA9IHRoaXMuZGF0YVNvdXJjZTtcbiAgICB9XG5cbiAgICBEYXRhU291cmNlU29ydGVyQ29tcG9zaXRlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGF0YVNvdXJjZURlY29yYXRvci5wcm90b3R5cGUpO1xuXG4gICAgRGF0YVNvdXJjZVNvcnRlckNvbXBvc2l0ZS5wcm90b3R5cGUuc29ydE9uID0gZnVuY3Rpb24oY29sdW1uSW5kZXgsIHNvcnRUeXBlKSB7XG4gICAgICAgIHRoaXMuc29ydHMucHVzaChbY29sdW1uSW5kZXgsIHNvcnRUeXBlXSk7XG4gICAgfTtcblxuICAgIERhdGFTb3VyY2VTb3J0ZXJDb21wb3NpdGUucHJvdG90eXBlLmFwcGx5U29ydHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNvcnRzID0gdGhpcy5zb3J0cztcbiAgICAgICAgdmFyIGVhY2ggPSB0aGlzLmRhdGFTb3VyY2U7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzb3J0ID0gc29ydHNbaV07XG4gICAgICAgICAgICBlYWNoID0gbmV3IERhdGFTb3VyY2VTb3J0ZXIoZWFjaCk7XG4gICAgICAgICAgICBlYWNoLnNvcnRPbihzb3J0WzBdLCBzb3J0WzFdKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxhc3QgPSBlYWNoO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlU29ydGVyQ29tcG9zaXRlLnByb3RvdHlwZS5jbGVhclNvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc29ydHMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5sYXN0ID0gdGhpcy5kYXRhU291cmNlO1xuICAgIH07XG5cbiAgICBEYXRhU291cmNlU29ydGVyQ29tcG9zaXRlLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdC5nZXRWYWx1ZSh4LCB5KTtcbiAgICB9O1xuXG4gICAgRGF0YVNvdXJjZVNvcnRlckNvbXBvc2l0ZS5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbih4LCB5LCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmxhc3Quc2V0VmFsdWUoeCwgeSwgdmFsdWUpO1xuICAgIH07XG5cbiAgICByZXR1cm4gRGF0YVNvdXJjZVNvcnRlckNvbXBvc2l0ZTtcblxufSkoKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvRGF0YVNvdXJjZVNvcnRlckNvbXBvc2l0ZS5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgaGVhZGVyaWZ5ID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICAgIHZhciBwaWVjZXMgPSBzdHJpbmcucmVwbGFjZSgvW18tXS9nLCAnICcpLnJlcGxhY2UoL1tBLVpdL2csICcgJCYnKS5zcGxpdCgnICcpLm1hcChmdW5jdGlvbihzKSB7XG4gICAgICAgICAgICByZXR1cm4gcy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHMuc2xpY2UoMSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcGllY2VzLmpvaW4oJyAnKTtcbiAgICB9O1xuXG4gICAgdmFyIGNvbXB1dGVGaWVsZE5hbWVzID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZpZWxkcyA9IFtdLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpLmZpbHRlcihmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICByZXR1cm4gZS5zdWJzdHIoMCwgMikgIT09ICdfXyc7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIGZpZWxkcztcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gSlNEYXRhU291cmNlKGRhdGEsIGZpZWxkcykge1xuICAgICAgICB0aGlzLmZpZWxkcyA9IGZpZWxkcyB8fCBjb21wdXRlRmllbGROYW1lcyhkYXRhWzBdKTtcbiAgICAgICAgdGhpcy5oZWFkZXJzID0gW107XG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgfVxuXG4gICAgSlNEYXRhU291cmNlLnByb3RvdHlwZS5pc051bGxPYmplY3QgPSBmYWxzZTtcblxuICAgIEpTRGF0YVNvdXJjZS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHZhciByb3cgPSB0aGlzLmRhdGFbeV07XG4gICAgICAgIGlmICghcm93KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdmFsdWUgPSByb3dbdGhpcy5maWVsZHNbeF1dO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIEpTRGF0YVNvdXJjZS5wcm90b3R5cGUuZ2V0Um93ID0gZnVuY3Rpb24oeSkge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbeV07XG4gICAgfTtcblxuICAgIEpTRGF0YVNvdXJjZS5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbih4LCB5LCB2YWx1ZSkge1xuXG4gICAgICAgIHRoaXMuZGF0YVt5XVt0aGlzLmZpZWxkc1t4XV0gPSB2YWx1ZTtcbiAgICB9O1xuXG4gICAgSlNEYXRhU291cmNlLnByb3RvdHlwZS5nZXRDb2x1bW5Db3VudCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEZpZWxkcygpLmxlbmd0aDtcbiAgICB9O1xuXG4gICAgSlNEYXRhU291cmNlLnByb3RvdHlwZS5nZXRSb3dDb3VudCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGEubGVuZ3RoO1xuICAgIH07XG5cbiAgICBKU0RhdGFTb3VyY2UucHJvdG90eXBlLmdldEZpZWxkcyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmZpZWxkcztcbiAgICB9O1xuXG4gICAgSlNEYXRhU291cmNlLnByb3RvdHlwZS5nZXRIZWFkZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5oZWFkZXJzIHx8IHRoaXMuaGVhZGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVycyA9IHRoaXMuZ2V0RGVmYXVsdEhlYWRlcnMoKS5tYXAoZnVuY3Rpb24oZWFjaCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBoZWFkZXJpZnkoZWFjaCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5oZWFkZXJzO1xuICAgIH07XG5cbiAgICBKU0RhdGFTb3VyY2UucHJvdG90eXBlLmdldERlZmF1bHRIZWFkZXJzID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RmllbGRzKCk7XG4gICAgfTtcblxuICAgIEpTRGF0YVNvdXJjZS5wcm90b3R5cGUuc2V0RmllbGRzID0gZnVuY3Rpb24oZmllbGRzKSB7XG5cbiAgICAgICAgdGhpcy5maWVsZHMgPSBmaWVsZHM7XG4gICAgfTtcblxuICAgIEpTRGF0YVNvdXJjZS5wcm90b3R5cGUuc2V0SGVhZGVycyA9IGZ1bmN0aW9uKGhlYWRlcnMpIHtcblxuICAgICAgICB0aGlzLmhlYWRlcnMgPSBoZWFkZXJzO1xuICAgIH07XG5cbiAgICBKU0RhdGFTb3VyY2UucHJvdG90eXBlLmdldEdyYW5kVG90YWxzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vbm90aGluZyBoZXJlXG4gICAgICAgIHJldHVybjtcbiAgICB9O1xuXG4gICAgSlNEYXRhU291cmNlLnByb3RvdHlwZS5zZXREYXRhID0gZnVuY3Rpb24oYXJyYXlPZlVuaWZvcm1PYmplY3RzKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGFycmF5T2ZVbmlmb3JtT2JqZWN0cztcbiAgICB9O1xuXG4gICAgcmV0dXJuIEpTRGF0YVNvdXJjZTtcblxufSkoKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvSlNEYXRhU291cmNlLmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcblxuICAgIHZhciBvaWRQcmVmaXggPSAnLn4uIyVfJzsgLy90aGlzIHNob3VsZCBiZSBzb21ldGhpbmcgd2UgbmV2ZXIgd2lsbCBzZWUgYXQgdGhlIGJlZ2luaW5nIG9mIGEgc3RyaW5nXG4gICAgdmFyIGNvdW50ZXIgPSAwO1xuXG4gICAgdmFyIGhhc2ggPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIHR5cGVPZiA9IHR5cGVvZiBrZXk7XG4gICAgICAgIHN3aXRjaCAodHlwZU9mKSB7XG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgIHJldHVybiBvaWRQcmVmaXggKyB0eXBlT2YgKyAnXycgKyBrZXk7XG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgIHJldHVybiBvaWRQcmVmaXggKyB0eXBlT2YgKyAnXycgKyBrZXk7XG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gb2lkUHJlZml4ICsgdHlwZU9mICsgJ18nICsga2V5O1xuICAgICAgICAgICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gb2lkUHJlZml4ICsgdHlwZU9mICsgJ18nICsga2V5O1xuICAgICAgICAgICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gb2lkUHJlZml4ICsgJ3VuZGVmaW5lZCc7XG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgICAgICAgIC8qZXNsaW50LWRpc2FibGUgKi9cbiAgICAgICAgICAgICAgICBpZiAoa2V5Ll9fX2Zpbmhhc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleS5fX19maW5oYXNoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBrZXkuX19fZmluaGFzaCA9IG9pZFByZWZpeCArIGNvdW50ZXIrKztcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5Ll9fX2Zpbmhhc2g7XG4gICAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgICAgaWYgKGtleS5fX19maW5oYXNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXkuX19fZmluaGFzaDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAga2V5Ll9fX2Zpbmhhc2ggPSBvaWRQcmVmaXggKyBjb3VudGVyKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleS5fX19maW5oYXNoOyAvKmVzbGludC1lbmFibGUgKi9cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBPYmplY3QuaXMgcG9seWZpbGwsIGNvdXJ0ZXN5IG9mIEBXZWJSZWZsZWN0aW9uXG4gICAgdmFyIGlzID0gT2JqZWN0LmlzIHx8XG4gICAgICAgIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhID09PSBiID8gYSAhPT0gMCB8fCAxIC8gYSA9PSAxIC8gYiA6IGEgIT0gYSAmJiBiICE9IGI7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgfTtcblxuICAgIC8vIE1vcmUgcmVsaWFibGUgaW5kZXhPZiwgY291cnRlc3kgb2YgQFdlYlJlZmxlY3Rpb25cbiAgICB2YXIgYmV0dGVySW5kZXhPZiA9IGZ1bmN0aW9uKGFyciwgdmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlICE9IHZhbHVlIHx8IHZhbHVlID09PSAwKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBhcnIubGVuZ3RoOyBpLS0gJiYgIWlzKGFycltpXSwgdmFsdWUpOykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpID0gW10uaW5kZXhPZi5jYWxsKGFyciwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBNYXBweSgpIHtcbiAgICAgICAgdGhpcy5rZXlzID0gW107XG4gICAgICAgIHRoaXMuZGF0YSA9IHt9O1xuICAgICAgICB0aGlzLnZhbHVlcyA9IFtdO1xuICAgIH1cblxuICAgIE1hcHB5LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgIHZhciBoYXNoQ29kZSA9IGhhc2goa2V5KTtcbiAgICAgICAgaWYgKHRoaXMuZGF0YVtoYXNoQ29kZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5rZXlzLnB1c2goa2V5KTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVzLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGF0YVtoYXNoQ29kZV0gPSB2YWx1ZTtcbiAgICB9O1xuXG4gICAgTWFwcHkucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgaGFzaENvZGUgPSBoYXNoKGtleSk7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbaGFzaENvZGVdO1xuICAgIH07XG5cbiAgICBNYXBweS5wcm90b3R5cGUuZ2V0SWZBYnNlbnQgPSBmdW5jdGlvbihrZXksIGlmQWJzZW50RnVuYykge1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLmdldChrZXkpO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFsdWUgPSBpZkFic2VudEZ1bmMoa2V5LCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIE1hcHB5LnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmtleXMubGVuZ3RoO1xuICAgIH07XG5cbiAgICBNYXBweS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5rZXlzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuZGF0YSA9IHt9O1xuICAgIH07XG5cbiAgICBNYXBweS5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIHZhciBoYXNoQ29kZSA9IGhhc2goa2V5KTtcbiAgICAgICAgaWYgKHRoaXMuZGF0YVtoYXNoQ29kZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbmRleCA9IGJldHRlckluZGV4T2YodGhpcy5rZXlzLCBrZXkpO1xuICAgICAgICB0aGlzLmtleXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgdGhpcy52YWx1ZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuZGF0YVtoYXNoQ29kZV07XG4gICAgfTtcblxuICAgIE1hcHB5LnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICB2YXIga2V5cyA9IHRoaXMua2V5cztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgICAgICAgICBmdW5jKHZhbHVlLCBrZXksIHRoaXMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIE1hcHB5LnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgIHZhciBrZXlzID0gdGhpcy5rZXlzO1xuICAgICAgICB2YXIgbmV3TWFwID0gbmV3IE1hcHB5KCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLmdldChrZXkpO1xuICAgICAgICAgICAgdmFyIHRyYW5zZm9ybWVkID0gZnVuYyh2YWx1ZSwga2V5LCB0aGlzKTtcbiAgICAgICAgICAgIG5ld01hcC5zZXQoa2V5LCB0cmFuc2Zvcm1lZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld01hcDtcbiAgICB9O1xuXG4gICAgTWFwcHkucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGtleXMgPSB0aGlzLmtleXM7XG4gICAgICAgIHZhciBuZXdNYXAgPSBuZXcgTWFwcHkoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgICAgICAgICBuZXdNYXAuc2V0KGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdNYXA7XG4gICAgfTtcblxuICAgIHJldHVybiBNYXBweTtcblxufSkoKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwib01mcEFuXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvTWFwLmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RhYmxlU29ydCA9IHJlcXVpcmUoJy4vc3RhYmxlU29ydC5qcycpO1xudmFyIE1hcCA9IHJlcXVpcmUoJy4vTWFwLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhYmxlU29ydDogc3RhYmxlU29ydCxcbiAgICAgICAgTWFwOiBNYXBcbiAgICB9O1xuXG59KSgpO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9VdGlscy5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIGNvdW50OiBmdW5jdGlvbigpIHsgLyogY29sdW1JbmRleCAqL1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJvd3MgPSBncm91cC5nZXRSb3dDb3VudCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiByb3dzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBzdW06IGZ1bmN0aW9uKGNvbHVtSW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihncm91cCkge1xuICAgICAgICAgICAgICAgIHZhciBzdW0gPSAwO1xuICAgICAgICAgICAgICAgIHZhciByb3dzID0gZ3JvdXAuZ2V0Um93Q291bnQoKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IHJvd3M7IHIrKykge1xuICAgICAgICAgICAgICAgICAgICBzdW0gPSBzdW0gKyBncm91cC5nZXRWYWx1ZShjb2x1bUluZGV4LCByKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1bTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgbWluOiBmdW5jdGlvbihjb2x1bUluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZ3JvdXApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWluID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgcm93cyA9IGdyb3VwLmdldFJvd0NvdW50KCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgciA9IDA7IHIgPCByb3dzOyByKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbWluID0gTWF0aC5taW4obWluLCBncm91cC5nZXRWYWx1ZShjb2x1bUluZGV4LCByKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBtaW47XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgbWF4OiBmdW5jdGlvbihjb2x1bUluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZ3JvdXApIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF4ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgcm93cyA9IGdyb3VwLmdldFJvd0NvdW50KCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgciA9IDA7IHIgPCByb3dzOyByKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gTWF0aC5tYXgobWF4LCBncm91cC5nZXRWYWx1ZShjb2x1bUluZGV4LCByKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBtYXg7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGF2ZzogZnVuY3Rpb24oY29sdW1JbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1bSA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIHJvd3MgPSBncm91cC5nZXRSb3dDb3VudCgpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgcm93czsgcisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1bSA9IHN1bSArIGdyb3VwLmdldFZhbHVlKGNvbHVtSW5kZXgsIHIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gc3VtIC8gcm93cztcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmlyc3Q6IGZ1bmN0aW9uKGNvbHVtSW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihncm91cCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBncm91cC5nZXRWYWx1ZShjb2x1bUluZGV4LCAwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgbGFzdDogZnVuY3Rpb24oY29sdW1JbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJvd3MgPSBncm91cC5nZXRSb3dDb3VudCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBncm91cC5nZXRWYWx1ZShjb2x1bUluZGV4LCByb3dzIC0gMSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0ZGRldjogZnVuY3Rpb24oY29sdW1JbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHI7XG4gICAgICAgICAgICAgICAgdmFyIHN1bSA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIHJvd3MgPSBncm91cC5nZXRSb3dDb3VudCgpO1xuICAgICAgICAgICAgICAgIGZvciAociA9IDA7IHIgPCByb3dzOyByKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtID0gc3VtICsgZ3JvdXAuZ2V0VmFsdWUoY29sdW1JbmRleCwgcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBtZWFuID0gc3VtIC8gcm93cztcbiAgICAgICAgICAgICAgICB2YXIgdmFyaWFuY2UgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAociA9IDA7IHIgPCByb3dzOyByKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRldiA9IChncm91cC5nZXRWYWx1ZShjb2x1bUluZGV4LCByKSAtIG1lYW4pO1xuICAgICAgICAgICAgICAgICAgICB2YXJpYW5jZSA9IHZhcmlhbmNlICsgKGRldiAqIGRldik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBzdGRkZXYgPSBNYXRoLnNxcnQodmFyaWFuY2UgLyByb3dzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RkZGV2O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pKCk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2FnZ3JlZ2F0aW9ucy5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIEpTRGF0YVNvdXJjZSA9IHJlcXVpcmUoJy4vSlNEYXRhU291cmNlJyk7XG52YXIgRGF0YVNvdXJjZVNvcnRlciA9IHJlcXVpcmUoJy4vRGF0YVNvdXJjZVNvcnRlcicpO1xudmFyIERhdGFTb3VyY2VTb3J0ZXJDb21wb3NpdGUgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2VTb3J0ZXJDb21wb3NpdGUnKTtcbnZhciBEYXRhU291cmNlRmlsdGVyID0gcmVxdWlyZSgnLi9EYXRhU291cmNlRmlsdGVyJyk7XG52YXIgRGF0YVNvdXJjZUdsb2JhbEZpbHRlciA9IHJlcXVpcmUoJy4vRGF0YVNvdXJjZUdsb2JhbEZpbHRlcicpO1xudmFyIERhdGFTb3VyY2VBZ2dyZWdhdG9yID0gcmVxdWlyZSgnLi9EYXRhU291cmNlQWdncmVnYXRvcicpO1xudmFyIGFnZ3JlZ2F0aW9ucyA9IHJlcXVpcmUoJy4vYWdncmVnYXRpb25zJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgSlNEYXRhU291cmNlOiBKU0RhdGFTb3VyY2UsXG4gICAgICAgIERhdGFTb3VyY2VTb3J0ZXI6IERhdGFTb3VyY2VTb3J0ZXIsXG4gICAgICAgIERhdGFTb3VyY2VTb3J0ZXJDb21wb3NpdGU6IERhdGFTb3VyY2VTb3J0ZXJDb21wb3NpdGUsXG4gICAgICAgIERhdGFTb3VyY2VGaWx0ZXI6IERhdGFTb3VyY2VGaWx0ZXIsXG4gICAgICAgIERhdGFTb3VyY2VHbG9iYWxGaWx0ZXI6IERhdGFTb3VyY2VHbG9iYWxGaWx0ZXIsXG4gICAgICAgIERhdGFTb3VyY2VBZ2dyZWdhdG9yOiBEYXRhU291cmNlQWdncmVnYXRvcixcbiAgICAgICAgYWdncmVnYXRpb25zOiBhZ2dyZWdhdGlvbnNcbiAgICB9O1xuXG59KSgpO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJvTWZwQW5cIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9hbmFseXRpY3MuanNcIixcIi9cIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKiBlc2xpbnQtZW52IG5vZGUsIGJyb3dzZXIgKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9O1xuXG52YXIgb28gPSByZXF1aXJlKCdvYmplY3Qub2JzZXJ2ZScpO1xudmFyIGFuYWx5dGljcyA9IHJlcXVpcmUoJy4vYW5hbHl0aWNzLmpzJyk7XG5cbm5vb3Aob28pO1xuXG5pZiAoIXdpbmRvdy5maW4pIHtcbiAgICB3aW5kb3cuZmluID0ge307XG59XG5pZiAoIXdpbmRvdy5maW4uYW5hbHl0aWNzKSB7XG4gICAgd2luZG93LmZpbi5hbmFseXRpY3MgPSBhbmFseXRpY3M7XG59XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2Zha2VfYzI0ODYzMWQuanNcIixcIi9cIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBzdGFiaWxpemUgPSBmdW5jdGlvbihjb21wYXJhdG9yLCBkZXNjZW5kaW5nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFycjEsIGFycjIpIHtcbiAgICAgICAgdmFyIHggPSBhcnIxWzBdO1xuICAgICAgICB2YXIgeSA9IGFycjJbMF07XG4gICAgICAgIGlmICh4ID09PSB5KSB7XG4gICAgICAgICAgICB4ID0gZGVzY2VuZGluZyA/IGFycjJbMV0gOiBhcnIxWzFdO1xuICAgICAgICAgICAgeSA9IGRlc2NlbmRpbmcgPyBhcnIxWzFdIDogYXJyMlsxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29tcGFyYXRvcih4LCB5KTtcbiAgICB9O1xufTtcblxuXG52YXIgYXNjZW5kaW5nTnVtYmVycyA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICByZXR1cm4geCAtIHk7XG59O1xuXG52YXIgZGVzY2VuZGluZ051bWJlcnMgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgcmV0dXJuIHkgLSB4O1xufTtcblxudmFyIGFzY2VuZGluZ0FsbE90aGVycyA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICByZXR1cm4geCA8IHkgPyAtMSA6IDE7XG59O1xuXG52YXIgZGVzY2VuZGluZ0FsbE90aGVycyA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICByZXR1cm4geSA8IHggPyAtMSA6IDE7XG59O1xuXG52YXIgYXNjZW5kaW5nID0gZnVuY3Rpb24odHlwZU9mRGF0YSkge1xuICAgIGlmICh0eXBlT2ZEYXRhID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gc3RhYmlsaXplKGFzY2VuZGluZ051bWJlcnMsIGZhbHNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YWJpbGl6ZShhc2NlbmRpbmdBbGxPdGhlcnMsIGZhbHNlKTtcbn07XG5cbnZhciBkZXNjZW5kaW5nID0gZnVuY3Rpb24odHlwZU9mRGF0YSkge1xuICAgIGlmICh0eXBlT2ZEYXRhID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gc3RhYmlsaXplKGRlc2NlbmRpbmdOdW1iZXJzLCB0cnVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YWJpbGl6ZShkZXNjZW5kaW5nQWxsT3RoZXJzLCB0cnVlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgZnVuY3Rpb24gc29ydChpbmRleFZlY3RvciwgZGF0YVNvdXJjZSwgc29ydFR5cGUpIHtcblxuICAgICAgICB2YXIgY29tcGFyZSwgaTtcblxuICAgICAgICBpZiAoaW5kZXhWZWN0b3IubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47IC8vbm90aGluZyB0byBkbztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzb3J0VHlwZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzb3J0VHlwZSA9IDE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc29ydFR5cGUgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gbm90aGluZyB0byBzb3J0IGhlcmU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdHlwZU9mRGF0YSA9IHR5cGVvZiBkYXRhU291cmNlKDApO1xuXG4gICAgICAgIGNvbXBhcmUgPSAoc29ydFR5cGUgPT09IDEpID8gYXNjZW5kaW5nKHR5cGVPZkRhdGEpIDogZGVzY2VuZGluZyh0eXBlT2ZEYXRhKTtcblxuICAgICAgICAvL3N0YXJ0IHRoZSBhY3R1YWxseSBzb3J0aW5nLi4uLi5cbiAgICAgICAgdmFyIHRtcCA9IG5ldyBBcnJheShpbmRleFZlY3Rvci5sZW5ndGgpO1xuXG4gICAgICAgIC8vbGV0cyBhZGQgdGhlIGluZGV4IGZvciBzdGFiaWxpdHlcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGluZGV4VmVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0bXBbaV0gPSBbZGF0YVNvdXJjZShpKSwgaV07XG4gICAgICAgIH1cblxuICAgICAgICB0bXAuc29ydChjb21wYXJlKTtcblxuICAgICAgICAvL2NvcHkgdGhlIHNvcnRlZCB2YWx1ZXMgaW50byBvdXIgaW5kZXggdmVjdG9yXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbmRleFZlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaW5kZXhWZWN0b3JbaV0gPSB0bXBbaV1bMV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc29ydDtcbn0pKCk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm9NZnBBblwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL3N0YWJsZVNvcnQuanNcIixcIi9cIikiXX0=
