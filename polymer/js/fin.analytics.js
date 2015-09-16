! function t(e, n, r) {
    function o(u, s) {
        if (!n[u]) {
            if (!e[u]) {
                var a = "function" == typeof require && require;
                if (!s && a) return a(u, !0);
                if (i) return i(u, !0);
                throw new Error("Cannot find module '" + u + "'")
            }
            var f = n[u] = {
                exports: {}
            };
            e[u][0].call(f.exports, function(t) {
                var n = e[u][1][t];
                return o(n ? n : t)
            }, f, f.exports, t, e, n, r)
        }
        return n[u].exports
    }
    for (var i = "function" == typeof require && require, u = 0; u < r.length; u++) o(r[u]);
    return o
}({
    1: [function(t, e, n) {
        (function(e, r, o, i, u, s, a, f, l) {
            function o(t, e, n) {
                if (!(this instanceof o)) return new o(t, e, n);
                var r = typeof t;
                if ("base64" === e && "string" === r)
                    for (t = k(t); t.length % 4 !== 0;) t += "=";
                var i;
                if ("number" === r) i = V(t);
                else if ("string" === r) i = o.byteLength(t, e);
                else {
                    if ("object" !== r) throw new Error("First argument needs to be a number, array or string.");
                    i = V(t.length)
                }
                var u;
                o._useTypedArrays ? u = o._augment(new Uint8Array(i)) : (u = this, u.length = i, u._isBuffer = !0);
                var s;
                if (o._useTypedArrays && "number" == typeof t.byteLength) u._set(t);
                else if (R(t))
                    for (s = 0; i > s; s++) o.isBuffer(t) ? u[s] = t.readUInt8(s) : u[s] = t[s];
                else if ("string" === r) u.write(t, 0, e);
                else if ("number" === r && !o._useTypedArrays && !n)
                    for (s = 0; i > s; s++) u[s] = 0;
                return u
            }

            function c(t, e, n, r) {
                n = Number(n) || 0;
                var i = t.length - n;
                r ? (r = Number(r), r > i && (r = i)) : r = i;
                var u = e.length;
                K(u % 2 === 0, "Invalid hex string"), r > u / 2 && (r = u / 2);
                for (var s = 0; r > s; s++) {
                    var a = parseInt(e.substr(2 * s, 2), 16);
                    K(!isNaN(a), "Invalid hex string"), t[n + s] = a
                }
                return o._charsWritten = 2 * s, s
            }

            function h(t, e, n, r) {
                var i = o._charsWritten = q(G(e), t, n, r);
                return i
            }

            function d(t, e, n, r) {
                var i = o._charsWritten = q(H(e), t, n, r);
                return i
            }

            function p(t, e, n, r) {
                return d(t, e, n, r)
            }

            function g(t, e, n, r) {
                var i = o._charsWritten = q(Y(e), t, n, r);
                return i
            }

            function y(t, e, n, r) {
                var i = o._charsWritten = q(J(e), t, n, r);
                return i
            }

            function w(t, e, n) {
                return 0 === e && n === t.length ? Q.fromByteArray(t) : Q.fromByteArray(t.slice(e, n))
            }

            function m(t, e, n) {
                var r = "",
                    o = "";
                n = Math.min(t.length, n);
                for (var i = e; n > i; i++) t[i] <= 127 ? (r += z(o) + String.fromCharCode(t[i]), o = "") : o += "%" + t[i].toString(16);
                return r + z(o)
            }

            function v(t, e, n) {
                var r = "";
                n = Math.min(t.length, n);
                for (var o = e; n > o; o++) r += String.fromCharCode(t[o]);
                return r
            }

            function b(t, e, n) {
                return v(t, e, n)
            }

            function A(t, e, n) {
                var r = t.length;
                (!e || 0 > e) && (e = 0), (!n || 0 > n || n > r) && (n = r);
                for (var o = "", i = e; n > i; i++) o += O(t[i]);
                return o
            }

            function I(t, e, n) {
                for (var r = t.slice(e, n), o = "", i = 0; i < r.length; i += 2) o += String.fromCharCode(r[i] + 256 * r[i + 1]);
                return o
            }

            function E(t, e, n, r) {
                r || (K("boolean" == typeof n, "missing or invalid endian"), K(void 0 !== e && null !== e, "missing offset"), K(e + 1 < t.length, "Trying to read beyond buffer length"));
                var o = t.length;
                if (!(e >= o)) {
                    var i;
                    return n ? (i = t[e], o > e + 1 && (i |= t[e + 1] << 8)) : (i = t[e] << 8, o > e + 1 && (i |= t[e + 1])), i
                }
            }

            function B(t, e, n, r) {
                r || (K("boolean" == typeof n, "missing or invalid endian"), K(void 0 !== e && null !== e, "missing offset"), K(e + 3 < t.length, "Trying to read beyond buffer length"));
                var o = t.length;
                if (!(e >= o)) {
                    var i;
                    return n ? (o > e + 2 && (i = t[e + 2] << 16), o > e + 1 && (i |= t[e + 1] << 8), i |= t[e], o > e + 3 && (i += t[e + 3] << 24 >>> 0)) : (o > e + 1 && (i = t[e + 1] << 16), o > e + 2 && (i |= t[e + 2] << 8), o > e + 3 && (i |= t[e + 3]), i += t[e] << 24 >>> 0), i
                }
            }

            function S(t, e, n, r) {
                r || (K("boolean" == typeof n, "missing or invalid endian"), K(void 0 !== e && null !== e, "missing offset"), K(e + 1 < t.length, "Trying to read beyond buffer length"));
                var o = t.length;
                if (!(e >= o)) {
                    var i = E(t, e, n, !0),
                        u = 32768 & i;
                    return u ? -1 * (65535 - i + 1) : i
                }
            }

            function _(t, e, n, r) {
                r || (K("boolean" == typeof n, "missing or invalid endian"), K(void 0 !== e && null !== e, "missing offset"), K(e + 3 < t.length, "Trying to read beyond buffer length"));
                var o = t.length;
                if (!(e >= o)) {
                    var i = B(t, e, n, !0),
                        u = 2147483648 & i;
                    return u ? -1 * (4294967295 - i + 1) : i
                }
            }

            function x(t, e, n, r) {
                return r || (K("boolean" == typeof n, "missing or invalid endian"), K(e + 3 < t.length, "Trying to read beyond buffer length")), Z.read(t, e, n, 23, 4)
            }

            function M(t, e, n, r) {
                return r || (K("boolean" == typeof n, "missing or invalid endian"), K(e + 7 < t.length, "Trying to read beyond buffer length")), Z.read(t, e, n, 52, 8)
            }

            function D(t, e, n, r, o) {
                o || (K(void 0 !== e && null !== e, "missing value"), K("boolean" == typeof r, "missing or invalid endian"), K(void 0 !== n && null !== n, "missing offset"), K(n + 1 < t.length, "trying to write beyond buffer length"), W(e, 65535));
                var i = t.length;
                if (!(n >= i))
                    for (var u = 0, s = Math.min(i - n, 2); s > u; u++) t[n + u] = (e & 255 << 8 * (r ? u : 1 - u)) >>> 8 * (r ? u : 1 - u)
            }

            function L(t, e, n, r, o) {
                o || (K(void 0 !== e && null !== e, "missing value"), K("boolean" == typeof r, "missing or invalid endian"), K(void 0 !== n && null !== n, "missing offset"), K(n + 3 < t.length, "trying to write beyond buffer length"), W(e, 4294967295));
                var i = t.length;
                if (!(n >= i))
                    for (var u = 0, s = Math.min(i - n, 4); s > u; u++) t[n + u] = e >>> 8 * (r ? u : 3 - u) & 255
            }

            function C(t, e, n, r, o) {
                o || (K(void 0 !== e && null !== e, "missing value"), K("boolean" == typeof r, "missing or invalid endian"), K(void 0 !== n && null !== n, "missing offset"), K(n + 1 < t.length, "Trying to write beyond buffer length"), P(e, 32767, -32768));
                var i = t.length;
                n >= i || (e >= 0 ? D(t, e, n, r, o) : D(t, 65535 + e + 1, n, r, o))
            }

            function U(t, e, n, r, o) {
                o || (K(void 0 !== e && null !== e, "missing value"), K("boolean" == typeof r, "missing or invalid endian"), K(void 0 !== n && null !== n, "missing offset"), K(n + 3 < t.length, "Trying to write beyond buffer length"), P(e, 2147483647, -2147483648));
                var i = t.length;
                n >= i || (e >= 0 ? L(t, e, n, r, o) : L(t, 4294967295 + e + 1, n, r, o))
            }

            function j(t, e, n, r, o) {
                o || (K(void 0 !== e && null !== e, "missing value"), K("boolean" == typeof r, "missing or invalid endian"), K(void 0 !== n && null !== n, "missing offset"), K(n + 3 < t.length, "Trying to write beyond buffer length"), X(e, 3.4028234663852886e38, -3.4028234663852886e38));
                var i = t.length;
                n >= i || Z.write(t, e, n, r, 23, 4)
            }

            function N(t, e, n, r, o) {
                o || (K(void 0 !== e && null !== e, "missing value"), K("boolean" == typeof r, "missing or invalid endian"), K(void 0 !== n && null !== n, "missing offset"), K(n + 7 < t.length, "Trying to write beyond buffer length"), X(e, 1.7976931348623157e308, -1.7976931348623157e308));
                var i = t.length;
                n >= i || Z.write(t, e, n, r, 52, 8)
            }

            function k(t) {
                return t.trim ? t.trim() : t.replace(/^\s+|\s+$/g, "")
            }

            function T(t, e, n) {
                return "number" != typeof t ? n : (t = ~~t, t >= e ? e : t >= 0 ? t : (t += e, t >= 0 ? t : 0))
            }

            function V(t) {
                return t = ~~Math.ceil(+t), 0 > t ? 0 : t
            }

            function F(t) {
                return (Array.isArray || function(t) {
                    return "[object Array]" === Object.prototype.toString.call(t)
                })(t)
            }

            function R(t) {
                return F(t) || o.isBuffer(t) || t && "object" == typeof t && "number" == typeof t.length
            }

            function O(t) {
                return 16 > t ? "0" + t.toString(16) : t.toString(16)
            }

            function G(t) {
                for (var e = [], n = 0; n < t.length; n++) {
                    var r = t.charCodeAt(n);
                    if (127 >= r) e.push(t.charCodeAt(n));
                    else {
                        var o = n;
                        r >= 55296 && 57343 >= r && n++;
                        for (var i = encodeURIComponent(t.slice(o, n + 1)).substr(1).split("%"), u = 0; u < i.length; u++) e.push(parseInt(i[u], 16))
                    }
                }
                return e
            }

            function H(t) {
                for (var e = [], n = 0; n < t.length; n++) e.push(255 & t.charCodeAt(n));
                return e
            }

            function J(t) {
                for (var e, n, r, o = [], i = 0; i < t.length; i++) e = t.charCodeAt(i), n = e >> 8, r = e % 256, o.push(r), o.push(n);
                return o
            }

            function Y(t) {
                return Q.toByteArray(t)
            }

            function q(t, e, n, r) {
                for (var o = 0; r > o && !(o + n >= e.length || o >= t.length); o++) e[o + n] = t[o];
                return o
            }

            function z(t) {
                try {
                    return decodeURIComponent(t)
                } catch (e) {
                    return String.fromCharCode(65533)
                }
            }

            function W(t, e) {
                K("number" == typeof t, "cannot write a non-number as a number"), K(t >= 0, "specified a negative value for writing an unsigned value"), K(e >= t, "value is larger than maximum value for type"), K(Math.floor(t) === t, "value has a fractional component")
            }

            function P(t, e, n) {
                K("number" == typeof t, "cannot write a non-number as a number"), K(e >= t, "value larger than maximum allowed value"), K(t >= n, "value smaller than minimum allowed value"), K(Math.floor(t) === t, "value has a fractional component")
            }

            function X(t, e, n) {
                K("number" == typeof t, "cannot write a non-number as a number"), K(e >= t, "value larger than maximum allowed value"), K(t >= n, "value smaller than minimum allowed value")
            }

            function K(t, e) {
                if (!t) throw new Error(e || "Failed assertion")
            }
            var Q = t("base64-js"),
                Z = t("ieee754");
            n.Buffer = o, n.SlowBuffer = o, n.INSPECT_MAX_BYTES = 50, o.poolSize = 8192, o._useTypedArrays = function() {
                try {
                    var t = new ArrayBuffer(0),
                        e = new Uint8Array(t);
                    return e.foo = function() {
                        return 42
                    }, 42 === e.foo() && "function" == typeof e.subarray
                } catch (n) {
                    return !1
                }
            }(), o.isEncoding = function(t) {
                switch (String(t).toLowerCase()) {
                    case "hex":
                    case "utf8":
                    case "utf-8":
                    case "ascii":
                    case "binary":
                    case "base64":
                    case "raw":
                    case "ucs2":
                    case "ucs-2":
                    case "utf16le":
                    case "utf-16le":
                        return !0;
                    default:
                        return !1
                }
            }, o.isBuffer = function(t) {
                return !(null === t || void 0 === t || !t._isBuffer)
            }, o.byteLength = function(t, e) {
                var n;
                switch (t += "", e || "utf8") {
                    case "hex":
                        n = t.length / 2;
                        break;
                    case "utf8":
                    case "utf-8":
                        n = G(t).length;
                        break;
                    case "ascii":
                    case "binary":
                    case "raw":
                        n = t.length;
                        break;
                    case "base64":
                        n = Y(t).length;
                        break;
                    case "ucs2":
                    case "ucs-2":
                    case "utf16le":
                    case "utf-16le":
                        n = 2 * t.length;
                        break;
                    default:
                        throw new Error("Unknown encoding")
                }
                return n
            }, o.concat = function(t, e) {
                if (K(F(t), "Usage: Buffer.concat(list, [totalLength])\nlist should be an Array."), 0 === t.length) return new o(0);
                if (1 === t.length) return t[0];
                var n;
                if ("number" != typeof e)
                    for (e = 0, n = 0; n < t.length; n++) e += t[n].length;
                var r = new o(e),
                    i = 0;
                for (n = 0; n < t.length; n++) {
                    var u = t[n];
                    u.copy(r, i), i += u.length
                }
                return r
            }, o.prototype.write = function(t, e, n, r) {
                if (isFinite(e)) isFinite(n) || (r = n, n = void 0);
                else {
                    var o = r;
                    r = e, e = n, n = o
                }
                e = Number(e) || 0;
                var i = this.length - e;
                n ? (n = Number(n), n > i && (n = i)) : n = i, r = String(r || "utf8").toLowerCase();
                var u;
                switch (r) {
                    case "hex":
                        u = c(this, t, e, n);
                        break;
                    case "utf8":
                    case "utf-8":
                        u = h(this, t, e, n);
                        break;
                    case "ascii":
                        u = d(this, t, e, n);
                        break;
                    case "binary":
                        u = p(this, t, e, n);
                        break;
                    case "base64":
                        u = g(this, t, e, n);
                        break;
                    case "ucs2":
                    case "ucs-2":
                    case "utf16le":
                    case "utf-16le":
                        u = y(this, t, e, n);
                        break;
                    default:
                        throw new Error("Unknown encoding")
                }
                return u
            }, o.prototype.toString = function(t, e, n) {
                var r = this;
                if (t = String(t || "utf8").toLowerCase(), e = Number(e) || 0, n = void 0 !== n ? Number(n) : n = r.length, n === e) return "";
                var o;
                switch (t) {
                    case "hex":
                        o = A(r, e, n);
                        break;
                    case "utf8":
                    case "utf-8":
                        o = m(r, e, n);
                        break;
                    case "ascii":
                        o = v(r, e, n);
                        break;
                    case "binary":
                        o = b(r, e, n);
                        break;
                    case "base64":
                        o = w(r, e, n);
                        break;
                    case "ucs2":
                    case "ucs-2":
                    case "utf16le":
                    case "utf-16le":
                        o = I(r, e, n);
                        break;
                    default:
                        throw new Error("Unknown encoding")
                }
                return o
            }, o.prototype.toJSON = function() {
                return {
                    type: "Buffer",
                    data: Array.prototype.slice.call(this._arr || this, 0)
                }
            }, o.prototype.copy = function(t, e, n, r) {
                var i = this;
                if (n || (n = 0), r || 0 === r || (r = this.length), e || (e = 0), r !== n && 0 !== t.length && 0 !== i.length) {
                    K(r >= n, "sourceEnd < sourceStart"), K(e >= 0 && e < t.length, "targetStart out of bounds"), K(n >= 0 && n < i.length, "sourceStart out of bounds"), K(r >= 0 && r <= i.length, "sourceEnd out of bounds"), r > this.length && (r = this.length), t.length - e < r - n && (r = t.length - e + n);
                    var u = r - n;
                    if (100 > u || !o._useTypedArrays)
                        for (var s = 0; u > s; s++) t[s + e] = this[s + n];
                    else t._set(this.subarray(n, n + u), e)
                }
            }, o.prototype.slice = function(t, e) {
                var n = this.length;
                if (t = T(t, n, 0), e = T(e, n, n), o._useTypedArrays) return o._augment(this.subarray(t, e));
                for (var r = e - t, i = new o(r, void 0, !0), u = 0; r > u; u++) i[u] = this[u + t];
                return i
            }, o.prototype.get = function(t) {
                return console.log(".get() is deprecated. Access using array indexes instead."), this.readUInt8(t)
            }, o.prototype.set = function(t, e) {
                return console.log(".set() is deprecated. Access using array indexes instead."), this.writeUInt8(t, e)
            }, o.prototype.readUInt8 = function(t, e) {
                return e || (K(void 0 !== t && null !== t, "missing offset"), K(t < this.length, "Trying to read beyond buffer length")), t >= this.length ? void 0 : this[t]
            }, o.prototype.readUInt16LE = function(t, e) {
                return E(this, t, !0, e)
            }, o.prototype.readUInt16BE = function(t, e) {
                return E(this, t, !1, e)
            }, o.prototype.readUInt32LE = function(t, e) {
                return B(this, t, !0, e)
            }, o.prototype.readUInt32BE = function(t, e) {
                return B(this, t, !1, e)
            }, o.prototype.readInt8 = function(t, e) {
                if (e || (K(void 0 !== t && null !== t, "missing offset"), K(t < this.length, "Trying to read beyond buffer length")), !(t >= this.length)) {
                    var n = 128 & this[t];
                    return n ? -1 * (255 - this[t] + 1) : this[t]
                }
            }, o.prototype.readInt16LE = function(t, e) {
                return S(this, t, !0, e)
            }, o.prototype.readInt16BE = function(t, e) {
                return S(this, t, !1, e)
            }, o.prototype.readInt32LE = function(t, e) {
                return _(this, t, !0, e)
            }, o.prototype.readInt32BE = function(t, e) {
                return _(this, t, !1, e)
            }, o.prototype.readFloatLE = function(t, e) {
                return x(this, t, !0, e)
            }, o.prototype.readFloatBE = function(t, e) {
                return x(this, t, !1, e)
            }, o.prototype.readDoubleLE = function(t, e) {
                return M(this, t, !0, e)
            }, o.prototype.readDoubleBE = function(t, e) {
                return M(this, t, !1, e)
            }, o.prototype.writeUInt8 = function(t, e, n) {
                n || (K(void 0 !== t && null !== t, "missing value"), K(void 0 !== e && null !== e, "missing offset"), K(e < this.length, "trying to write beyond buffer length"), W(t, 255)), e >= this.length || (this[e] = t)
            }, o.prototype.writeUInt16LE = function(t, e, n) {
                D(this, t, e, !0, n)
            }, o.prototype.writeUInt16BE = function(t, e, n) {
                D(this, t, e, !1, n)
            }, o.prototype.writeUInt32LE = function(t, e, n) {
                L(this, t, e, !0, n)
            }, o.prototype.writeUInt32BE = function(t, e, n) {
                L(this, t, e, !1, n)
            }, o.prototype.writeInt8 = function(t, e, n) {
                n || (K(void 0 !== t && null !== t, "missing value"), K(void 0 !== e && null !== e, "missing offset"), K(e < this.length, "Trying to write beyond buffer length"), P(t, 127, -128)), e >= this.length || (t >= 0 ? this.writeUInt8(t, e, n) : this.writeUInt8(255 + t + 1, e, n))
            }, o.prototype.writeInt16LE = function(t, e, n) {
                C(this, t, e, !0, n)
            }, o.prototype.writeInt16BE = function(t, e, n) {
                C(this, t, e, !1, n)
            }, o.prototype.writeInt32LE = function(t, e, n) {
                U(this, t, e, !0, n)
            }, o.prototype.writeInt32BE = function(t, e, n) {
                U(this, t, e, !1, n)
            }, o.prototype.writeFloatLE = function(t, e, n) {
                j(this, t, e, !0, n)
            }, o.prototype.writeFloatBE = function(t, e, n) {
                j(this, t, e, !1, n)
            }, o.prototype.writeDoubleLE = function(t, e, n) {
                N(this, t, e, !0, n)
            }, o.prototype.writeDoubleBE = function(t, e, n) {
                N(this, t, e, !1, n)
            }, o.prototype.fill = function(t, e, n) {
                if (t || (t = 0), e || (e = 0), n || (n = this.length), "string" == typeof t && (t = t.charCodeAt(0)), K("number" == typeof t && !isNaN(t), "value is not a number"), K(n >= e, "end < start"), n !== e && 0 !== this.length) {
                    K(e >= 0 && e < this.length, "start out of bounds"), K(n >= 0 && n <= this.length, "end out of bounds");
                    for (var r = e; n > r; r++) this[r] = t
                }
            }, o.prototype.inspect = function() {
                for (var t = [], e = this.length, r = 0; e > r; r++)
                    if (t[r] = O(this[r]), r === n.INSPECT_MAX_BYTES) {
                        t[r + 1] = "...";
                        break
                    }
                return "<Buffer " + t.join(" ") + ">"
            }, o.prototype.toArrayBuffer = function() {
                if ("undefined" != typeof Uint8Array) {
                    if (o._useTypedArrays) return new o(this).buffer;
                    for (var t = new Uint8Array(this.length), e = 0, n = t.length; n > e; e += 1) t[e] = this[e];
                    return t.buffer
                }
                throw new Error("Buffer.toArrayBuffer not supported in this browser")
            };
            var $ = o.prototype;
            o._augment = function(t) {
                return t._isBuffer = !0, t._get = t.get, t._set = t.set, t.get = $.get, t.set = $.set, t.write = $.write, t.toString = $.toString, t.toLocaleString = $.toString, t.toJSON = $.toJSON, t.copy = $.copy, t.slice = $.slice, t.readUInt8 = $.readUInt8, t.readUInt16LE = $.readUInt16LE, t.readUInt16BE = $.readUInt16BE, t.readUInt32LE = $.readUInt32LE, t.readUInt32BE = $.readUInt32BE, t.readInt8 = $.readInt8, t.readInt16LE = $.readInt16LE, t.readInt16BE = $.readInt16BE, t.readInt32LE = $.readInt32LE, t.readInt32BE = $.readInt32BE, t.readFloatLE = $.readFloatLE, t.readFloatBE = $.readFloatBE, t.readDoubleLE = $.readDoubleLE, t.readDoubleBE = $.readDoubleBE, t.writeUInt8 = $.writeUInt8, t.writeUInt16LE = $.writeUInt16LE, t.writeUInt16BE = $.writeUInt16BE, t.writeUInt32LE = $.writeUInt32LE, t.writeUInt32BE = $.writeUInt32BE, t.writeInt8 = $.writeInt8, t.writeInt16LE = $.writeInt16LE, t.writeInt16BE = $.writeInt16BE, t.writeInt32LE = $.writeInt32LE, t.writeInt32BE = $.writeInt32BE, t.writeFloatLE = $.writeFloatLE, t.writeFloatBE = $.writeFloatBE, t.writeDoubleLE = $.writeDoubleLE, t.writeDoubleBE = $.writeDoubleBE, t.fill = $.fill, t.inspect = $.inspect, t.toArrayBuffer = $.toArrayBuffer, t
            }
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/index.js", "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer")
    }, {
        "base64-js": 2,
        buffer: 1,
        ieee754: 3,
        oMfpAn: 4
    }],
    2: [function(t, e, n) {
        (function(t, e, r, o, i, u, s, a, f) {
            var l = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            ! function(t) {
                "use strict";

                function e(t) {
                    var e = t.charCodeAt(0);
                    return e === i || e === c ? 62 : e === u || e === h ? 63 : s > e ? -1 : s + 10 > e ? e - s + 26 + 26 : f + 26 > e ? e - f : a + 26 > e ? e - a + 26 : void 0
                }

                function n(t) {
                    function n(t) {
                        f[c++] = t
                    }
                    var r, i, u, s, a, f;
                    if (t.length % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
                    var l = t.length;
                    a = "=" === t.charAt(l - 2) ? 2 : "=" === t.charAt(l - 1) ? 1 : 0, f = new o(3 * t.length / 4 - a), u = a > 0 ? t.length - 4 : t.length;
                    var c = 0;
                    for (r = 0, i = 0; u > r; r += 4, i += 3) s = e(t.charAt(r)) << 18 | e(t.charAt(r + 1)) << 12 | e(t.charAt(r + 2)) << 6 | e(t.charAt(r + 3)), n((16711680 & s) >> 16), n((65280 & s) >> 8), n(255 & s);
                    return 2 === a ? (s = e(t.charAt(r)) << 2 | e(t.charAt(r + 1)) >> 4, n(255 & s)) : 1 === a && (s = e(t.charAt(r)) << 10 | e(t.charAt(r + 1)) << 4 | e(t.charAt(r + 2)) >> 2, n(s >> 8 & 255), n(255 & s)), f
                }

                function r(t) {
                    function e(t) {
                        return l.charAt(t)
                    }

                    function n(t) {
                        return e(t >> 18 & 63) + e(t >> 12 & 63) + e(t >> 6 & 63) + e(63 & t)
                    }
                    var r, o, i, u = t.length % 3,
                        s = "";
                    for (r = 0, i = t.length - u; i > r; r += 3) o = (t[r] << 16) + (t[r + 1] << 8) + t[r + 2], s += n(o);
                    switch (u) {
                        case 1:
                            o = t[t.length - 1], s += e(o >> 2), s += e(o << 4 & 63), s += "==";
                            break;
                        case 2:
                            o = (t[t.length - 2] << 8) + t[t.length - 1], s += e(o >> 10), s += e(o >> 4 & 63), s += e(o << 2 & 63), s += "="
                    }
                    return s
                }
                var o = "undefined" != typeof Uint8Array ? Uint8Array : Array,
                    i = "+".charCodeAt(0),
                    u = "/".charCodeAt(0),
                    s = "0".charCodeAt(0),
                    a = "a".charCodeAt(0),
                    f = "A".charCodeAt(0),
                    c = "-".charCodeAt(0),
                    h = "_".charCodeAt(0);
                t.toByteArray = n, t.fromByteArray = r
            }("undefined" == typeof n ? this.base64js = {} : n)
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js", "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib")
    }, {
        buffer: 1,
        oMfpAn: 4
    }],
    3: [function(t, e, n) {
        (function(t, e, r, o, i, u, s, a, f) {
            n.read = function(t, e, n, r, o) {
                var i, u, s = 8 * o - r - 1,
                    a = (1 << s) - 1,
                    f = a >> 1,
                    l = -7,
                    c = n ? o - 1 : 0,
                    h = n ? -1 : 1,
                    d = t[e + c];
                for (c += h, i = d & (1 << -l) - 1, d >>= -l, l += s; l > 0; i = 256 * i + t[e + c], c += h, l -= 8);
                for (u = i & (1 << -l) - 1, i >>= -l, l += r; l > 0; u = 256 * u + t[e + c], c += h, l -= 8);
                if (0 === i) i = 1 - f;
                else {
                    if (i === a) return u ? NaN : (d ? -1 : 1) * (1 / 0);
                    u += Math.pow(2, r), i -= f
                }
                return (d ? -1 : 1) * u * Math.pow(2, i - r)
            }, n.write = function(t, e, n, r, o, i) {
                var u, s, a, f = 8 * i - o - 1,
                    l = (1 << f) - 1,
                    c = l >> 1,
                    h = 23 === o ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
                    d = r ? 0 : i - 1,
                    p = r ? 1 : -1,
                    g = 0 > e || 0 === e && 0 > 1 / e ? 1 : 0;
                for (e = Math.abs(e), isNaN(e) || e === 1 / 0 ? (s = isNaN(e) ? 1 : 0, u = l) : (u = Math.floor(Math.log(e) / Math.LN2), e * (a = Math.pow(2, -u)) < 1 && (u--, a *= 2), e += u + c >= 1 ? h / a : h * Math.pow(2, 1 - c), e * a >= 2 && (u++, a /= 2), u + c >= l ? (s = 0, u = l) : u + c >= 1 ? (s = (e * a - 1) * Math.pow(2, o), u += c) : (s = e * Math.pow(2, c - 1) * Math.pow(2, o), u = 0)); o >= 8; t[n + d] = 255 & s, d += p, s /= 256, o -= 8);
                for (u = u << o | s, f += o; f > 0; t[n + d] = 255 & u, d += p, u /= 256, f -= 8);
                t[n + d - p] |= 128 * g
            }
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js", "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754")
    }, {
        buffer: 1,
        oMfpAn: 4
    }],
    4: [function(t, e, n) {
        (function(t, n, r, o, i, u, s, a, f) {
            function l() {}
            var t = e.exports = {};
            t.nextTick = function() {
                var t = "undefined" != typeof window && window.setImmediate,
                    e = "undefined" != typeof window && window.postMessage && window.addEventListener;
                if (t) return function(t) {
                    return window.setImmediate(t)
                };
                if (e) {
                    var n = [];
                    return window.addEventListener("message", function(t) {
                            var e = t.source;
                            if ((e === window || null === e) && "process-tick" === t.data && (t.stopPropagation(), n.length > 0)) {
                                var r = n.shift();
                                r()
                            }
                        }, !0),
                        function(t) {
                            n.push(t), window.postMessage("process-tick", "*")
                        }
                }
                return function(t) {
                    setTimeout(t, 0)
                }
            }(), t.title = "browser", t.browser = !0, t.env = {}, t.argv = [], t.on = l, t.addListener = l, t.once = l, t.off = l, t.removeListener = l, t.removeAllListeners = l, t.emit = l, t.binding = function(t) {
                throw new Error("process.binding is not supported")
            }, t.cwd = function() {
                return "/"
            }, t.chdir = function(t) {
                throw new Error("process.chdir is not supported")
            }
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/process/browser.js", "/../../node_modules/gulp-browserify/node_modules/browserify/node_modules/process")
    }, {
        buffer: 1,
        oMfpAn: 4
    }],
    5: [function(t, e, n) {
        (function(t, n, r, o, i, u, s, a, f) {
            "use strict";
            e.exports = function() {
                function t(t) {
                    this.label = t, this.data = [""], this.rowIndexes = [], this.hasChildren = !1, this.depth = 0, this.height = 1, this.expanded = !1
                }
                var e = "                                                                                ";
                return t.prototype.getValue = function(t) {
                    return this.data[t]
                }, t.prototype.prune = function(t) {
                    this.depth = t, this.data[0] = this.computeDepthString()
                }, t.prototype.computeDepthString = function() {
                    var t = e.substring(0, 3 * this.depth) + this.label + "     |";
                    return t
                }, t.prototype.computeHeight = function() {
                    return 1
                }, t.prototype.getAllRowIndexes = function() {
                    return this.rowIndexes
                }, t.prototype.computeAggregates = function(t) {
                    this.applyAggregates(t)
                }, t.prototype.applyAggregates = function(t) {
                    var e = t.aggregates,
                        n = this.data;
                    n.length = e.length + 1;
                    var r = this.getAllRowIndexes(),
                        o = t.sorterInstance;
                    o.indexes = r;
                    for (var i = 0; i < e.length; i++) {
                        var u = e[i];
                        n[i + 1] = u(o)
                    }
                    this.data = n
                }, t.prototype.buildView = function(t) {
                    t.view.push(this)
                }, t
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataNodeBase.js", "/")
    }, {
        buffer: 1,
        oMfpAn: 4
    }],
    6: [function(t, e, n) {
        (function(n, r, o, i, u, s, a, f, l) {
            "use strict";
            var c = t("./Map"),
                h = t("./DataNodeBase");
            e.exports = function() {
                function t(t) {
                    h.call(this, t), this.children = new c
                }
                var e = {
                        "true": "▾",
                        "false": "▸"
                    },
                    n = "                                                                                ";
                return t.prototype = Object.create(h.prototype), t.prototype.prune = function(t) {
                    this.depth = t, this.children = this.children.values;
                    for (var e = 0; e < this.children.length; e++) {
                        var n = this.children[e];
                        n.prune(this.depth + 1)
                    }
                    this.data[0] = this.computeDepthString()
                }, t.prototype.computeDepthString = function() {
                    var t = e[this.expanded + ""],
                        r = n.substring(0, 3 * this.depth) + t + " " + this.label + "     |";
                    return r
                }, t.prototype.getAllRowIndexes = function() {
                    return 0 === this.rowIndexes.length && (this.rowIndexes = this.computeAllRowIndexes()), this.rowIndexes
                }, t.prototype.computeAllRowIndexes = function() {
                    for (var t = [], e = 0; e < this.children.length; e++) {
                        var n = this.children[e],
                            r = n.getAllRowIndexes();
                        Array.prototype.splice.apply(t, [t.length, 0].concat(r))
                    }
                    return t
                }, t.prototype.toggleExpansionState = function() {
                    this.expanded = !this.expanded, this.data[0] = this.computeDepthString()
                }, t.prototype.computeAggregates = function(t) {
                    this.applyAggregates(t);
                    for (var e = 0; e < this.children.length; e++) this.children[e].computeAggregates(t)
                }, t.prototype.buildView = function(t) {
                    if (t.view.push(this), this.expanded)
                        for (var e = 0; e < this.children.length; e++) {
                            var n = this.children[e];
                            n.buildView(t)
                        }
                }, t.prototype.computeHeight = function() {
                    var t = 1;
                    if (this.expanded) {
                        for (var e = 0; e < this.children.length; e++) t += this.children[e].computeHeight();
                        this.height = t
                    } else this.height = 1;
                    return this.height
                }, t
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataNodeGroup.js", "/")
    }, {
        "./DataNodeBase": 5,
        "./Map": 14,
        buffer: 1,
        oMfpAn: 4
    }],
    7: [function(t, e, n) {
        (function(n, r, o, i, u, s, a, f, l) {
            "use strict";
            var c = t("./DataNodeBase");
            e.exports = function() {
                function t(t) {
                    c.call(this, t)
                }
                return t.prototype = Object.create(c.prototype), t.prototype.prune = function(t) {
                    this.depth = t, this.data[0] = this.computeDepthString()
                }, t.prototype.computeHeight = function() {
                    return 1
                }, t.prototype.getAllRowIndexes = function() {
                    return this.rowIndexes
                }, t.prototype.computeAggregates = function(t) {
                    this.applyAggregates(t)
                }, t.prototype.buildView = function(t) {
                    t.view.push(this)
                }, t
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataNodeLeaf.js", "/")
    }, {
        "./DataNodeBase": 5,
        buffer: 1,
        oMfpAn: 4
    }],
    8: [function(t, e, n) {
        (function(n, r, o, i, u, s, a, f, l) {
            "use strict";
            var c = t("./DataNodeGroup");
            e.exports = function() {
                function t(t) {
                    c.call(this, t)
                }
                return t.prototype = Object.create(c.prototype), t.prototype.prune = function() {
                    this.children = this.children.values;
                    for (var t = 0; t < this.children.length; t++) {
                        var e = this.children[t];
                        e.prune(0)
                    }
                }, t.prototype.buildView = function(t) {
                    for (var e = 0; e < this.children.length; e++) {
                        var n = this.children[e];
                        n.buildView(t)
                    }
                }, t.prototype.computeHeight = function() {
                    for (var t = 0, e = 0; e < this.children.length; e++) t += this.children[e].computeHeight();
                    return this.height = t, this.height
                }, t
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataNodeTree.js", "/")
    }, {
        "./DataNodeGroup": 6,
        buffer: 1,
        oMfpAn: 4
    }],
    9: [function(t, e, n) {
        (function(n, r, o, i, u, s, a, f, l) {
            "use strict";
            var c = t("./DataSourceSorter"),
                h = t("./DataNodeTree"),
                d = t("./DataNodeGroup"),
                p = t("./DataNodeLeaf");
            e.exports = function() {
                function t(t) {
                    this.dataSource = t, this.aggregates = [], this.groupBys = [], this.view = [], this.sorterInstance = {}
                }
                return t.prototype.addAggregate = function(t, e) {
                    e.columnName = t, this.aggregates.push(e)
                }, t.prototype.addGroupBy = function(t) {
                    this.groupBys.push(t)
                }, t.prototype.build = function() {
                    this.buildGroupTree()
                }, t.prototype.buildGroupTree = function() {
                    var t, e, n, r, o, i = function(t, e) {
                            return r = new d(t), e.set(t, r), r
                        },
                        u = function(t, e) {
                            return r = new p(t), e.set(t, r), r
                        },
                        s = this.groupBys,
                        a = this.dataSource;
                    for (t = 0; t < s.length; t++) n = s[s.length - t - 1], a = new c(a), a.sortOn(n);
                    var f = a.getRowCount(),
                        l = new h("root"),
                        g = l,
                        y = s.length - 1;
                    for (e = 0; f > e; e++) {
                        for (t = 0; t < s.length; t++) n = s[t], r = a.getValue(n, e), o = t === y ? u : i, g = g.children.getIfAbsent(r, o);
                        g.rowIndexes.push(e), g = l
                    }
                    this.sorterInstance = new c(a), l.prune(), this.tree = l, this.tree.computeAggregates(this), this.buildView()
                }, t.prototype.buildView = function() {
                    this.view.length = 0, this.tree.computeHeight(), this.tree.buildView(this)
                }, t.prototype.getValue = function(t, e) {
                    return 0 === e ? 0 === t ? "hierarchy     |" : this.aggregates[t - 1].columnName : this.view[e - 1].getValue(t)
                }, t.prototype.getColumnCount = function() {
                    return this.aggregates.length + 1
                }, t.prototype.getRowCount = function() {
                    return this.tree.height + 1
                }, t.prototype.click = function(t) {
                    var e = this.view[t];
                    e.toggleExpansionState(), this.buildView()
                }, t
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataSourceAggregator.js", "/")
    }, {
        "./DataNodeGroup": 6,
        "./DataNodeLeaf": 7,
        "./DataNodeTree": 8,
        "./DataSourceSorter": 12,
        buffer: 1,
        oMfpAn: 4
    }],
    10: [function(t, e, n) {
        (function(t, n, r, o, i, u, s, a, f) {
            "use strict";
            e.exports = function() {
                function t(t) {
                    this.dataSource = t, this.initializeIndexVector()
                }
                return t.prototype.transposeY = function(t) {
                    return 0 !== this.indexes.length ? this.indexes[t] : t
                }, t.prototype.getValue = function(t, e) {
                    var n = this.dataSource.getValue(t, this.transposeY(e));
                    return n
                }, t.prototype.getRow = function(t) {
                    return this.dataSource.getRow(this.transposeY(t))
                }, t.prototype.setValue = function(t, e, n) {
                    this.dataSource.setValue(t, this.transposeY(e), n)
                }, t.prototype.getColumnCount = function() {
                    return this.dataSource.getColumnCount()
                }, t.prototype.getRowCount = function() {
                    return this.indexes.length
                }, t.prototype.initializeIndexVector = function() {
                    for (var t = this.dataSource.getRowCount(), e = new Array(t), n = 0; t > n; n++) e[n] = n;
                    this.indexes = e
                }, t
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataSourceDecorator.js", "/")
    }, {
        buffer: 1,
        oMfpAn: 4
    }],
    11: [function(t, e, n) {
        (function(n, r, o, i, u, s, a, f, l) {
            "use strict";
            var c = t("./DataSourceDecorator");
            e.exports = function() {
                function t(t) {
                    c.call(this, t), this.filters = []
                }
                return t.prototype = Object.create(c.prototype), t.prototype.getRowCount = function() {
                    return 0 === this.filters.length ? this.dataSource.getRowCount() : this.indexes.length
                }, t.prototype.addFilter = function(t, e) {
                    e.columnIndex = t, this.filters.push(e), this.applyFilters()
                }, t.prototype.clearFilters = function() {
                    this.filters.length = 0, this.indexes.length = 0
                }, t.prototype.applyFilters = function() {
                    var t = this.indexes;
                    t.length = 0;
                    for (var e = this.dataSource.getRowCount(), n = 0; e > n; n++) this.applyFiltersTo(n) && t.push(n)
                }, t.prototype.applyFiltersTo = function(t) {
                    for (var e = this.filters, n = 0; n < e.length; n++) {
                        var r = e[n],
                            o = this.dataSource.getRow(t);
                        if (r(this.dataSource.getValue(r.columnIndex, t), o, t)) return !0
                    }
                    return !1
                }, t
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataSourceFilter.js", "/")
    }, {
        "./DataSourceDecorator": 10,
        buffer: 1,
        oMfpAn: 4
    }],
    12: [function(t, e, n) {
        (function(n, r, o, i, u, s, a, f, l) {
            "use strict";
            var c = t("./Utils.js"),
                h = t("./DataSourceDecorator");
            e.exports = function() {
                function t(t) {
                    h.call(this, t), this.descendingSort = !1
                }
                return t.prototype = Object.create(h.prototype), t.prototype.sortOn = function(t, e) {
                    if (0 === e) return void(this.indexes.length = 0);
                    this.initializeIndexVector();
                    var n = this;
                    c.stableSort(this.indexes, function(e) {
                        return n.dataSource.getValue(t, e)
                    }, e)
                }, t
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/DataSourceSorter.js", "/")
    }, {
        "./DataSourceDecorator": 10,
        "./Utils.js": 15,
        buffer: 1,
        oMfpAn: 4
    }],
    13: [function(t, e, n) {
        (function(t, n, r, o, i, u, s, a, f) {
            "use strict";
            e.exports = function() {
                function t(t, n) {
                    this.fields = n || e(t[0]), this.data = t
                }
                var e = function(t) {
                    var e = [].concat(Object.getOwnPropertyNames(t).filter(function(t) {
                        return "__" !== t.substr(0, 2)
                    }));
                    return e
                };
                return t.prototype.getValue = function(t, e) {
                    if (-1 === t) return e;
                    var n = this.data[e][this.fields[t]];
                    return n
                }, t.prototype.getRow = function(t) {
                    return this.data[t]
                }, t.prototype.setValue = function(t, e, n) {
                    this.data[e][this.fields[t]] = n
                }, t.prototype.getColumnCount = function() {
                    return this.fields.length
                }, t.prototype.getRowCount = function() {
                    return this.data.length
                }, t.prototype.getFields = function() {
                    return this.fields
                }, t.prototype.setFields = function(t) {
                    this.fields = t
                }, t
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/JSDataSource.js", "/")
    }, {
        buffer: 1,
        oMfpAn: 4
    }],
    14: [function(t, e, n) {
        (function(t, n, r, o, i, u, s, a, f) {
            "use strict";
            e.exports = function() {
                function t() {
                    this.keys = [], this.data = {}, this.values = []
                }
                var e = ".~.#%_",
                    n = 0,
                    r = function(t) {
                        var r = typeof t;
                        switch (r) {
                            case "number":
                                return e + r + "_" + t;
                            case "string":
                                return e + r + "_" + t;
                            case "boolean":
                                return e + r + "_" + t;
                            case "symbol":
                                return e + r + "_" + t;
                            case "undefined":
                                return e + "undefined";
                            case "object":
                                return t.___finhash ? t.___finhash : (t.___finhash = e + n++, t.___finhash);
                            case "function":
                                return t.___finhash ? t.___finhash : (t.___finhash = e + n++, t.___finhash)
                        }
                    },
                    o = Object.is || function(t, e) {
                        return t === e ? 0 !== t || 1 / t == 1 / e : t != t && e != e
                    },
                    i = function(t, e) {
                        if (e != e || 0 === e)
                            for (var n = t.length; n-- && !o(t[n], e););
                        else n = [].indexOf.call(t, e);
                        return n
                    };
                return t.prototype.set = function(t, e) {
                    var n = r(t);
                    void 0 === this.data[n] && (this.keys.push(t), this.values.push(e)), this.data[n] = e
                }, t.prototype.get = function(t) {
                    var e = r(t);
                    return this.data[e]
                }, t.prototype.getIfAbsent = function(t, e) {
                    var n = this.get(t);
                    return void 0 === n && (n = e(t, this)), n
                }, t.prototype.size = function() {
                    return this.keys.length
                }, t.prototype.clear = function() {
                    this.keys.length = 0, this.data = {}
                }, t.prototype["delete"] = function(t) {
                    var e = r(t);
                    if (void 0 !== this.data[e]) {
                        var n = i(this.keys, t);
                        this.keys.splice(n, 1), this.values.splice(n, 1), delete this.data[e]
                    }
                }, t.prototype.forEach = function(t) {
                    for (var e = this.keys, n = 0; n < e.length; n++) {
                        var r = e[n],
                            o = this.get(r);
                        t(o, r, this)
                    }
                }, t.prototype.map = function(e) {
                    for (var n = this.keys, r = new t, o = 0; o < n.length; o++) {
                        var i = n[o],
                            u = this.get(i),
                            s = e(u, i, this);
                        r.set(i, s)
                    }
                    return r
                }, t.prototype.copy = function() {
                    for (var e = this.keys, n = new t, r = 0; r < e.length; r++) {
                        var o = e[r],
                            i = this.get(o);
                        n.set(o, i)
                    }
                    return n
                }, t
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/Map.js", "/")
    }, {
        buffer: 1,
        oMfpAn: 4
    }],
    15: [function(t, e, n) {
        (function(n, r, o, i, u, s, a, f, l) {
            "use strict";
            var c = t("./stableSort.js"),
                h = t("./Map.js");
            e.exports = function() {
                return {
                    stableSort: c,
                    Map: h
                }
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/Utils.js", "/");
    }, {
        "./Map.js": 14,
        "./stableSort.js": 19,
        buffer: 1,
        oMfpAn: 4
    }],
    16: [function(t, e, n) {
        (function(t, n, r, o, i, u, s, a, f) {
            "use strict";
            e.exports = function() {
                return {
                    count: function() {
                        return function(t) {
                            var e = t.getRowCount();
                            return e
                        }
                    },
                    sum: function(t) {
                        return function(e) {
                            for (var n = 0, r = e.getRowCount(), o = 0; r > o; o++) n += e.getValue(t, o);
                            return n
                        }
                    },
                    min: function(t) {
                        return function(e) {
                            for (var n = 0, r = e.getRowCount(), o = 0; r > o; o++) n = Math.min(n, e.getValue(t, o));
                            return n
                        }
                    },
                    max: function(t) {
                        return function(e) {
                            for (var n = 0, r = e.getRowCount(), o = 0; r > o; o++) n = Math.max(n, e.getValue(t, o));
                            return n
                        }
                    },
                    avg: function(t) {
                        return function(e) {
                            for (var n = 0, r = e.getRowCount(), o = 0; r > o; o++) n += e.getValue(t, o);
                            return n / r
                        }
                    },
                    first: function(t) {
                        return function(e) {
                            return e.getValue(t, 0)
                        }
                    },
                    last: function(t) {
                        return function(e) {
                            var n = e.getRowCount();
                            return e.getValue(t, n - 1)
                        }
                    },
                    stddev: function(t) {
                        return function(e) {
                            var n, r = 0,
                                o = e.getRowCount();
                            for (n = 0; o > n; n++) r += e.getValue(t, n);
                            var i = r / o,
                                u = 0;
                            for (n = 0; o > n; n++) {
                                var s = e.getValue(t, n) - i;
                                u += s * s
                            }
                            var a = Math.sqrt(u / o);
                            return a
                        }
                    }
                }
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/aggregations.js", "/")
    }, {
        buffer: 1,
        oMfpAn: 4
    }],
    17: [function(t, e, n) {
        (function(n, r, o, i, u, s, a, f, l) {
            "use strict";
            var c = t("./JSDataSource"),
                h = t("./DataSourceSorter"),
                d = t("./DataSourceFilter"),
                p = t("./DataSourceAggregator"),
                g = t("./aggregations");
            e.exports = function() {
                return {
                    JSDataSource: c,
                    DataSourceSorter: h,
                    DataSourceFilter: d,
                    DataSourceAggregator: p,
                    aggregations: g
                }
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/analytics.js", "/")
    }, {
        "./DataSourceAggregator": 9,
        "./DataSourceFilter": 11,
        "./DataSourceSorter": 12,
        "./JSDataSource": 13,
        "./aggregations": 16,
        buffer: 1,
        oMfpAn: 4
    }],
    18: [function(t, e, n) {
        (function(e, n, r, o, i, u, s, a, f) {
            "use strict";
            var l = t("./analytics.js");
            window.fin || (window.fin = {}), window.fin.analytics || (window.fin.analytics = l)
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/fake_e70c7ead.js", "/")
    }, {
        "./analytics.js": 17,
        buffer: 1,
        oMfpAn: 4
    }],
    19: [function(t, e, n) {
        (function(t, n, r, o, i, u, s, a, f) {
            "use strict";
            var l = function(t, e) {
                    return function(n, r) {
                        var o = n[0],
                            i = r[0];
                        if (o === i) o = e ? r[1] : n[1], i = e ? n[1] : r[1];
                        else {
                            if (null === i) return -1;
                            if (null === o) return 1
                        }
                        return t(o, i)
                    }
                },
                c = function(t, e) {
                    return t - e
                },
                h = function(t, e) {
                    return e - t
                },
                d = function(t, e) {
                    return e > t ? -1 : 1
                },
                p = function(t, e) {
                    return t > e ? -1 : 1
                },
                g = function(t) {
                    return "number" === t ? l(c, !1) : l(d, !1)
                },
                y = function(t) {
                    return "number" === t ? l(h, !0) : l(p, !0)
                };
            e.exports = function() {
                function t(t, e, n) {
                    var r, o;
                    if (0 !== t.length && (void 0 === n && (n = 1), 0 !== n)) {
                        var i = typeof e(0);
                        r = 1 === n ? g(i) : y(i);
                        var u = new Array(t.length);
                        for (o = 0; o < t.length; o++) u[o] = [e(o), o];
                        for (u.sort(r), o = 0; o < t.length; o++) t[o] = u[o][1]
                    }
                }
                return t
            }()
        }).call(this, t("oMfpAn"), "undefined" != typeof self ? self : "undefined" != typeof window ? window : {}, t("buffer").Buffer, arguments[3], arguments[4], arguments[5], arguments[6], "/stableSort.js", "/")
    }, {
        buffer: 1,
        oMfpAn: 4
    }]
}, {}, [18]);
