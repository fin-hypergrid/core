/* eslint-env browser */


if (typeof window.CustomEvent !== 'function') {
    // @ts-ignore
    window.CustomEvent = function(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    };

    // @ts-ignore
    window.CustomEvent.prototype = window.Event.prototype;
}

var rectangular = require('rectangular');

var RESIZE_POLLING_INTERVAL = 200,
    paintables = [],
    resizables = [],
    paintRequest,
    resizeInterval,
    charMap = makeCharMap();

// We still support IE 11; we do NOT support older versions of IE (and we do NOT officially support Edge)
// https://stackoverflow.com/questions/21825157/internet-explorer-11-detection#answer-21825207
// @ts-ignore
var isIE11 = !!(window.MSInputMethodContext && document.documentMode);

/**
 * @param {HTMLDivElement} div
 * @param {any} component
 * @param {any} contextAttributes
 * @this {any} TODO
 */
function Canvas(div, component, contextAttributes) {
    var self = this;

    // create the containing <div>...</div>
    this.div = div;
    this.component = component;

    this.dragEndtime = Date.now();

    // create and append the info <div>...</div> (to be displayed when there are no data rows)
    this.infoDiv = document.createElement('div');
    this.infoDiv.className = 'info';
    this.div.appendChild(this.infoDiv);

    // create and append the canvas
    this.gc = getCachedContext(this.canvas = document.createElement('canvas'), contextAttributes);

    this.div.appendChild(this.canvas);

    this.canvas.style.outline = 'none';

    this.mouseLocation = new rectangular.Point(-1, -1);
    this.dragstart = new rectangular.Point(-1, -1);
    //this.origin = new rectangular.Point(0, 0);
    this.bounds = new rectangular.Rectangle(0, 0, 0, 0);
    this.hasMouse = false;

    document.addEventListener('mousemove', function(e) {
        if (self.hasMouse || self.isDragging()) {
            self.finmousemove(e);
        }
    });
    document.addEventListener('mouseup', function(e) {
        self.finmouseup(e);
    });
    document.addEventListener('wheel', function(e) {
        self.finwheelmoved(e);
    });
    document.addEventListener('keydown', function(e) {
        self.finkeydown(e);
    });
    document.addEventListener('keyup', function(e) {
        self.finkeyup(e);
    });

    this.canvas.onmouseover = function() {
        self.hasMouse = true;
    };
    this.addEventListener('focus', function(e) {
        self.finfocusgained(e);
    });
    this.addEventListener('blur', function(e) {
        self.finfocuslost(e);
    });
    this.addEventListener('mousedown', function(e) {
        self.finmousedown(e);
    });
    this.addEventListener('mouseout', function(e) {
        self.hasMouse = false;
        self.finmouseout(e);
    });
    this.addEventListener('click', function(e) {
        self.finclick(e);
    });
    this.addEventListener('dblclick', function(e) {
        self.findblclick(e);
    });
    this.addEventListener('contextmenu', function(e) {
        self.fincontextmenu(e);
        e.preventDefault();
        return false;
    });

    this.addEventListener('touchstart', function(e) {
        self.fintouchstart(e);
    });

    this.addEventListener('touchmove', function(e) {
        self.fintouchmove(e);
    });

    this.addEventListener('touchend', function(e) {
        self.fintouchend(e);
    });

    this.canvas.setAttribute('tabindex', 0);

    this.resetZoom();

    this.resize();

    this.beginResizing();
    this.beginPainting();
}

/**
 * @typedef {any} CanvasType TODO need to formalise this
 * @this {CanvasType}
 */
Canvas.prototype = {
    constructor: Canvas.prototype.constructor,
    div: null,
    component: null,
    canvas: null,
    focuser: null,
    buffer: null,
    ctx: null,
    mouseLocation: null,
    dragstart: null,
    origin: null,
    bounds: null,
    dirty: false,
    size: null,
    mousedown: false,
    dragging: false,
    repeatKeyCount: 0,
    repeatKey: null,
    repeatKeyStartTime: 0,
    currentKeys: [],
    hasMouse: false,
    dragEndTime: 0,
    lastRepaintTime: 0,
    currentPaintCount: 0,
    currentFPS: 0,
    lastFPSComputeTime: 0,

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    addEventListener: function(name, callback) {
        this.canvas.addEventListener(name, callback);
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    removeEventListener: function(name, callback) {
        this.canvas.removeEventListener(name, callback);
    },

    stopPaintLoop: stopPaintLoop,
    restartPaintLoop: restartPaintLoop,

    stopResizeLoop: stopResizeLoop,
    restartResizeLoop: restartResizeLoop,

    detached: function() {
        this.stopPainting();
        this.stopResizing();
    },

    getCurrentFPS:function() {
        return this.currentFPS;
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    tickPaint: function(now) {
        var isContinuousRepaint = this.component.properties.enableContinuousRepaint,
            fps = this.component.properties.repaintIntervalRate;
        if (fps === 0) {
            return;
        }
        var interval = 1000 / fps;

        var elapsed = now - this.lastRepaintTime;
        if (elapsed > interval && (isContinuousRepaint || this.dirty)) {
            this.paintNow();
            this.lastRepaintTime = now;
            /* - (elapsed % interval);*/
            if (isContinuousRepaint) {
                this.currentPaintCount++;
                if (now - this.lastFPSComputeTime >= 1000) {
                    this.currentFPS = (this.currentPaintCount * 1000) / (now - this.lastFPSComputeTime);
                    this.currentPaintCount = 0;
                    this.lastFPSComputeTime = now;
                }
            }
        }
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    beginPainting: function() {
        var self = this;
        this.requestRepaint();
        this.tickPainter = function(now) {
            self.tickPaint(now);
        };
        paintables.push(this);
    },

    stopPainting: function() {
        paintables.splice(paintables.indexOf(this), 1);
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    beginResizing: function() {
        var self = this;
        this.tickResizer = function() {
            self.checksize();
        };
        resizables.push(this);
    },

    stopResizing: function() {
        resizables.splice(resizables.indexOf(this), 1);
    },

    start: function() {
        this.beginPainting();
        this.beginResizing();
    },

    stop: function() {
        this.stopPainting();
        this.stopResizing();
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    getBoundingClientRect: function(el) {
        var rect = el.getBoundingClientRect();

        if (isIE11) {
            var r = 1 / this.bodyZoomFactor;
            var top = rect.top * r;
            var right = rect.right * r;
            var bottom = rect.bottom * r;
            var left = rect.left * r;

            rect = {
                top: top,
                right: right,
                bottom: bottom,
                left: left,
                width: right - left,
                height: bottom - top,
                x: left,
                y: top
            };
        }

        return rect;
    },

    getDivBoundingClientRect: function() {
        // Make sure our canvas has integral dimensions
        var rect = this.getBoundingClientRect(this.div);
        var top = Math.floor(rect.top),
            left = Math.floor(rect.left),
            width = Math.ceil(rect.width),
            height = Math.ceil(rect.height);

        return {
            top: top,
            right: left + width,
            bottom: top + height,
            left: left,
            width: width,
            height: height,
            x: rect.x,
            y: rect.y
        };
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    checksize: function() {
        var sizeNow = this.getDivBoundingClientRect();
        if (sizeNow.width !== this.size.width || sizeNow.height !== this.size.height) {
            this.resize(sizeNow);
        }
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    resize: function(box) {
        box = this.size = box || this.getDivBoundingClientRect();

        this.width = box.width;
        this.height = box.height;

        // http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        var isHIDPI = window.devicePixelRatio && this.component.properties.useHiDPI;
        var ratio = isHIDPI && window.devicePixelRatio || 1;

        this.devicePixelRatio = ratio *= this.bodyZoomFactor;

        this.canvas.width = Math.round(this.width * ratio);
        this.canvas.height = Math.round(this.height * ratio);

        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.gc.scale(ratio, ratio);

        this.bounds = new rectangular.Rectangle(0, 0, this.width, this.height);
        this.component.setBounds(this.bounds);
        this.resizeNotification();
        this.paintNow();
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    resizeNotification: function() {
        this.dispatchNewEvent(undefined, 'fin-canvas-resized', {
            width: this.width,
            height: this.height
        });
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    resetZoom: function() {
        var factor = 1;

        // IE11 bug: must use getPropertyValue because zoom is omitted from returned object
        var zoomProp = getComputedStyle(document.body).getPropertyValue('zoom');

        if (zoomProp) {
            // IE11: always returns percentage + percent sign (others return factor)
            var m = zoomProp.match(/^(.+?)(%)?$/);
            if (m) {
                var zoom = Number(m[1]);
                if (m[2]) {
                    zoom /= 100;
                }
                zoom = Number(zoom || 1);
                factor *= zoom;
            }
        }

        this.bodyZoomFactor = factor;

        this.resize();
    },

    getBounds: function() {
        return this.bounds;
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    paintNow: function() {
        try {
            this.gc.cache.save();
            this.dirty = false;
            this.component.paint(this.gc);
        } catch (e) {
            console.error(e);
        } finally {
            this.gc.cache.restore();
        }
    },

    // flushBuffer deprecated in 3.3.0
    flushBuffer: function() {},

    newEvent: function(primitiveEvent, name, detail) {
        var event = {
            detail: detail || {}
        };
        if (primitiveEvent) {
            event.detail.primitiveEvent = primitiveEvent;
        }
        return new CustomEvent(name, event);
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    dispatchNewEvent: function(primitiveEvent, name, detail) {
        return this.canvas.dispatchEvent(this.newEvent(primitiveEvent, name, detail));
    },

    dispatchNewMouseKeysEvent: function(event, name, detail) {
        detail = detail || {};
        detail.mouse = this.mouseLocation;
        defKeysProp.call(this, event, 'keys', detail);
        return this.dispatchNewEvent(event, name, detail);
    },

    dispatchNewTouchEvent: function(event, name, detail) {
        detail = detail || {};

        var touches = [].slice.call(event.changedTouches);
        detail.touches = touches.map(function(touch) {
            return this.getLocal(touch);
        }, this);

        return this.dispatchNewEvent(event, name, detail);
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    finmousemove: function(e) {
        if (!this.isDragging() && this.mousedown) {
            this.beDragging();
            this.dispatchNewMouseKeysEvent(e, 'fin-canvas-dragstart', {
                isRightClick: this.isRightClick(e),
                dragstart: this.dragstart
            });
            this.dragstart = new rectangular.Point(this.mouseLocation.x, this.mouseLocation.y);
        }
        this.mouseLocation = this.getLocal(e);
        if (this.isDragging()) {
            this.dispatchNewMouseKeysEvent(e, 'fin-canvas-drag', {
                dragstart: this.dragstart,
                isRightClick: this.isRightClick(e)
            });
        }
        if (this.bounds.contains(this.mouseLocation)) {
            this.dispatchNewMouseKeysEvent(e, 'fin-canvas-mousemove');
        }
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    finmousedown: function(e) {
        this.mouseLocation = this.mouseDownLocation = this.getLocal(e);
        this.mousedown = true;

        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-mousedown', {
            isRightClick: this.isRightClick(e)
        });
        this.takeFocus();
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    finmouseup: function(e) {
        if (!this.mousedown) {
            // ignore document:mouseup unless preceded by a canvas:mousedown
            return;
        }
        if (this.isDragging()) {
            this.dispatchNewMouseKeysEvent(e, 'fin-canvas-dragend', {
                dragstart: this.dragstart,
                isRightClick: this.isRightClick(e)
            });
            this.beNotDragging();
            this.dragEndtime = Date.now();
        }
        this.mousedown = false;
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-mouseup', {
            dragstart: this.dragstart,
            isRightClick: this.isRightClick(e)
        });
        //this.mouseLocation = new rectangular.Point(-1, -1);
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    finmouseout: function(e) {
        if (!this.mousedown) {
            this.mouseLocation = new rectangular.Point(-1, -1);
        }
        this.repaint();
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-mouseout', {
            dragstart: this.dragstart
        });
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    finwheelmoved: function(e) {
        if (this.isDragging() || !this.hasFocus()) {
            return;
        }
        e.preventDefault();
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-wheelmoved', {
            isRightClick: this.isRightClick(e)
        });
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    finclick: function(e) {
        this.mouseLocation = this.getLocal(e);
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-click', {
            isRightClick: this.isRightClick(e)
        });
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    findblclick: function(e) {
        this.mouseLocation = this.getLocal(e);
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-dblclick', {
            isRightClick: this.isRightClick(e)
        });
    },

    getCharMap: function() {
        return charMap;
    },

    getKeyChar: function(e) {
        var keyCode = e.keyCode || e.detail.key,
            shift = e.shiftKey || e.detail.shift,
            key = e.key;

        e.legacyKey = charMap[keyCode] && charMap[keyCode][shift ? 1 : 0];

        if (typeof key === 'string' && key.length === 1) {
            return key;
        }

        return (
            e.legacyKey || // legacy unprintable char string
            key // modern unprintable char string when no such legacy string
        );
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    finkeydown: function(e) {
        if (!this.hasFocus()) {
            return;
        }

        var keyChar = updateCurrentKeys.call(this, e, true);

        if (e.repeat) {
            if (this.repeatKey === keyChar) {
                this.repeatKeyCount++;
            } else {
                this.repeatKey = keyChar;
                this.repeatKeyStartTime = Date.now();
            }
        } else {
            this.repeatKey = null;
            this.repeatKeyCount = 0;
            this.repeatKeyStartTime = 0;
        }

        this.dispatchNewEvent(e, 'fin-canvas-keydown', defKeysProp.call(this, e, 'currentKeys', {
            alt: e.altKey,
            ctrl: e.ctrlKey,
            char: keyChar,
            legacyChar: e.legacyKey,
            code: e.charCode,
            key: e.keyCode,
            meta: e.metaKey,
            repeatCount: this.repeatKeyCount,
            repeatStartTime: this.repeatKeyStartTime,
            shift: e.shiftKey,
            identifier: e.key
        }));
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    finkeyup: function(e) {
        if (!this.hasFocus()) {
            return;
        }

        var keyChar = updateCurrentKeys.call(this, e, false);

        this.repeatKeyCount = 0;
        this.repeatKey = null;
        this.repeatKeyStartTime = 0;
        this.dispatchNewEvent(e, 'fin-canvas-keyup', defKeysProp.call(this, e, 'currentKeys', {
            alt: e.altKey,
            ctrl: e.ctrlKey,
            char: keyChar,
            legacyChar: e.legacyKey,
            code: e.charCode,
            key: e.keyCode,
            meta: e.metaKey,
            repeat: e.repeat,
            shift: e.shiftKey,
            identifier: e.key,
            currentKeys: this.currentKeys.slice(0)
        }));
    },

    finfocusgained: function(e) {
        this.dispatchNewEvent(e, 'fin-canvas-focus-gained');
    },

    finfocuslost: function(e) {
        this.dispatchNewEvent(e, 'fin-canvas-focus-lost');
    },

    fincontextmenu: function(e) {
        if (e.ctrlKey && this.currentKeys.indexOf('CTRL') === -1) {
            this.currentKeys.push('CTRL');
        }

        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-context-menu', {
            isRightClick: this.isRightClick(e)
        });
    },

    fintouchstart: function(e) {
        this.dispatchNewTouchEvent(e, 'fin-canvas-touchstart');
    },

    fintouchmove: function(e) {
        this.dispatchNewTouchEvent(e, 'fin-canvas-touchmove');
    },

    fintouchend: function(e) {
        this.dispatchNewTouchEvent(e, 'fin-canvas-touchend');
    },

    paintLoopRunning: function() {
        return !!paintRequest;
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    requestRepaint: function() {
        this.dirty = true;
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    repaint: function() {
        this.requestRepaint();
        if (!paintRequest || this.component.properties.repaintIntervalRate === 0) {
            this.paintNow();
        }
    },

    getMouseLocation: function() {
        return this.mouseLocation;
    },

    getOrigin: function() {
        var rect = this.getBoundingClientRect(this.canvas);
        var p = new rectangular.Point(rect.left, rect.top);
        return p;
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    getLocal: function(e) {
        var rect = this.getBoundingClientRect(this.canvas);

        var p = new rectangular.Point(
            e.clientX / this.bodyZoomFactor - rect.left,
            e.clientY / this.bodyZoomFactor - rect.top
        );

        return p;
    },

    hasFocus: function() {
        return document.activeElement === this.canvas;
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    takeFocus: function() {
        var self = this;
        if (!this.hasFocus()) {
            setTimeout(function() {
                self.canvas.focus();
            }, 10);
        }
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    beDragging: function() {
        this.dragging = true;
        this.disableDocumentElementSelection();
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    beNotDragging: function() {
        this.dragging = false;
        this.enableDocumentElementSelection();
    },

    isDragging: function() {
        return this.dragging;
    },

    disableDocumentElementSelection: function() {
        var style = document.body.style;
        style.cssText = style.cssText + '-webkit-user-select: none';
    },

    enableDocumentElementSelection: function() {
        var style = document.body.style;
        style.cssText = style.cssText.replace('-webkit-user-select: none', '');
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    setFocusable: function(truthy) {
        this.focuser.style.display = truthy ? '' : 'none';
    },

    isRightClick: function(e) {
        var isRightMB;
        e = e || window.event;

        if ('which' in e) { // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            isRightMB = e.which === 3;
        } else if ('button' in e) { // IE, Opera
            isRightMB = e.button === 2;
        }
        return isRightMB;
    },

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    dispatchEvent: function(e) {
        return this.canvas.dispatchEvent(e);
    },

    setInfo: function(message, width) {
        if (message) {
            if (width !== undefined) {
                if (width && !isNaN(Number(width))) {
                    width += 'px';
                }
                this.infoDiv.style.width = width;
            }

            if (message.indexOf('<')) {
                this.infoDiv.innerHTML = message;
            } else {
                this.infoDiv.innerText = message;
            }
        }

        this.infoDiv.style.display = message ? 'block' : 'none';
    }
};

function paintLoopFunction(now) {
    if (paintRequest) {
        paintables.forEach(function(paintable) {
            try {
                paintable.tickPainter(now);
            } catch (e) {
                console.error(e);
            }

            if (paintable.component.tickNotification) {
                paintable.component.tickNotification();
            }
        });
        paintRequest = requestAnimationFrame(paintLoopFunction);
    }
}
function restartPaintLoop() {
    paintRequest = paintRequest || requestAnimationFrame(paintLoopFunction);
}
function stopPaintLoop() {
    if (paintRequest) {
        cancelAnimationFrame(paintRequest);
        paintRequest = undefined;
    }
}
restartPaintLoop();

function resizablesLoopFunction(now) {
    if (resizeInterval) {
        for (var i = 0; i < resizables.length; i++) {
            try {
                resizables[i].tickResizer(now);
            } catch (e) {
                console.error(e);
            }
        }
    }
}
function restartResizeLoop() {
    resizeInterval = resizeInterval || setInterval(resizablesLoopFunction, RESIZE_POLLING_INTERVAL);
}
function stopResizeLoop() {
    if (resizeInterval) {
        clearInterval(resizeInterval);
        resizeInterval = undefined;
    }
}
restartResizeLoop();

function makeCharMap() {
    var map = [];

    var empty = ['', ''];

    for (var i = 0; i < 256; i++) {
        map[i] = empty;
    }

    map[27] = ['ESC', 'ESCSHIFT'];
    map[192] = ['`', '~'];
    map[49] = ['1', '!'];
    map[50] = ['2', '@'];
    map[51] = ['3', '#'];
    map[52] = ['4', '$'];
    map[53] = ['5', '%'];
    map[54] = ['6', '^'];
    map[55] = ['7', '&'];
    map[56] = ['8', '*'];
    map[57] = ['9', '('];
    map[48] = ['0', ')'];
    map[189] = ['-', '_'];
    map[187] = ['=', '+'];
    map[8] = ['BACKSPACE', 'BACKSPACESHIFT'];
    map[46] = ['DELETE', 'DELETESHIFT'];
    map[9] = ['TAB', 'TABSHIFT'];
    map[81] = ['q', 'Q'];
    map[87] = ['w', 'W'];
    map[69] = ['e', 'E'];
    map[82] = ['r', 'R'];
    map[84] = ['t', 'T'];
    map[89] = ['y', 'Y'];
    map[85] = ['u', 'U'];
    map[73] = ['i', 'I'];
    map[79] = ['o', 'O'];
    map[80] = ['p', 'P'];
    map[219] = ['[', '{'];
    map[221] = [']', '}'];
    map[220] = ['\\', '|'];
    map[220] = ['CAPSLOCK', 'CAPSLOCKSHIFT'];
    map[65] = ['a', 'A'];
    map[83] = ['s', 'S'];
    map[68] = ['d', 'D'];
    map[70] = ['f', 'F'];
    map[71] = ['g', 'G'];
    map[72] = ['h', 'H'];
    map[74] = ['j', 'J'];
    map[75] = ['k', 'K'];
    map[76] = ['l', 'L'];
    map[186] = [';', ':'];
    map[222] = ['\'', '|'];
    map[13] = ['RETURN', 'RETURNSHIFT'];
    map[16] = ['SHIFT', 'SHIFT'];
    map[90] = ['z', 'Z'];
    map[88] = ['x', 'X'];
    map[67] = ['c', 'C'];
    map[86] = ['v', 'V'];
    map[66] = ['b', 'B'];
    map[78] = ['n', 'N'];
    map[77] = ['m', 'M'];
    map[188] = [',', '<'];
    map[190] = ['.', '>'];
    map[191] = ['/', '?'];
    map[16] = ['SHIFT', 'SHIFT'];
    map[17] = ['CTRL', 'CTRLSHIFT'];
    map[18] = ['ALT', 'ALTSHIFT'];
    map[91] = ['COMMANDLEFT', 'COMMANDLEFTSHIFT'];
    map[32] = ['SPACE', 'SPACESHIFT'];
    map[93] = ['COMMANDRIGHT', 'COMMANDRIGHTSHIFT'];
    map[18] = ['ALT', 'ALTSHIFT'];
    map[38] = ['UP', 'UPSHIFT'];
    map[37] = ['LEFT', 'LEFTSHIFT'];
    map[40] = ['DOWN', 'DOWNSHIFT'];
    map[39] = ['RIGHT', 'RIGHTSHIFT'];

    map[33] = ['PAGEUP', 'PAGEUPSHIFT'];
    map[34] = ['PAGEDOWN', 'PAGEDOWNSHIFT'];
    map[35] = ['PAGERIGHT', 'PAGERIGHTSHIFT']; // END
    map[36] = ['PAGELEFT', 'PAGELEFTSHIFT']; // HOME

    map[112] = ['F1', 'F1SHIFT'];
    map[113] = ['F2', 'F2SHIFT'];
    map[114] = ['F3', 'F3SHIFT'];
    map[115] = ['F4', 'F4SHIFT'];
    map[116] = ['F5', 'F5SHIFT'];
    map[117] = ['F6', 'F6SHIFT'];
    map[118] = ['F7', 'F7SHIFT'];
    map[119] = ['F8', 'F8SHIFT'];
    map[120] = ['F9', 'F9SHIFT'];
    map[121] = ['F10', 'F10SHIFT'];
    map[122] = ['F11', 'F11SHIFT'];
    map[123] = ['F12', 'F12SHIFT'];

    return map;
}

function updateCurrentKeys(e, keydown) {
    var keyChar = this.getKeyChar(e);

    // prevent TAB from moving focus off the canvas element
    switch (keyChar) {
        case 'TAB':
        case 'TABSHIFT':
        case 'Tab':
            e.preventDefault();
    }

    fixCurrentKeys.call(this, keyChar, keydown);

    return keyChar;
}

function fixCurrentKeys(keyChar, keydown) {
    var index = this.currentKeys.indexOf(keyChar);

    if (!keydown && index >= 0) {
        this.currentKeys.splice(index, 1);
    }

    if (keyChar === 'SHIFT') {
        // on keydown, replace unshifted keys with shifted keys
        // on keyup, vice-versa
        this.currentKeys.forEach(function(key, index, currentKeys) {
            var pair = charMap.find(function(pair) {
                return pair[keydown ? 0 : 1] === key;
            });
            if (pair) {
                currentKeys[index] = pair[keydown ? 1 : 0];
            }
        });
    }

    if (keydown && index < 0) {
        this.currentKeys.push(keyChar);
    }
}

function defKeysProp(event, propName, object) {
    var canvas = this;
    Object.defineProperty(object, propName, {
        configurable: true,
        // @ts-ignore TODO this is a spelling mistake, need to check if it has any consequences when fixing
        ennumerable: true,
        get: function() {
            var shiftKey;
            if ('shiftKey' in event) {
                fixCurrentKeys.call(canvas, 'SHIFT', shiftKey = event.shiftKey);
            } else {
                shiftKey = canvas.currentKeys.indexOf('SHIFT') >= 0;
            }
            var SHIFT = shiftKey ? 'SHIFT' : '';
            if ('ctrlKey' in event) {
                fixCurrentKeys.call(canvas, 'CTRL' + SHIFT, event.ctrlKey);
            }
            if ('altKey' in event) {
                fixCurrentKeys.call(canvas, 'ALT' + SHIFT, event.altKey);
            }
            return canvas.currentKeys.slice();
        }
    });
    return object;
}

function getCachedContext(canvasElement, contextAttributes) {
    var gc = canvasElement.getContext('2d', contextAttributes),
        props = {},
        values = {};

    // Stub out all the prototype members of the canvas 2D graphics context:
    Object.keys(Object.getPrototypeOf(gc)).forEach(makeStub);

    // Some older browsers (e.g., Chrome 40) did not have all members of canvas
    // 2D graphics context in the prototype so we make this additional call:
    Object.keys(gc).forEach(makeStub);

    function makeStub(key) {
        if (
            !(key in props) &&
            !/^(webkit|moz|ms|o)[A-Z]/.test(key) &&
            typeof gc[key] !== 'function'
        ) {
            Object.defineProperty(props, key, {
                get: function() {
                    return (values[key] = values[key] || gc[key]);
                },
                set: function(value) {
                    if (value !== values[key]) {
                        gc[key] = values[key] = value;
                    }
                }
            });
        }
    }

    gc.cache = props;

    gc.cache.save = function() {
        gc.save();
        values = Object.create(values);
    };

    gc.cache.restore = function() {
        gc.restore();
        values = Object.getPrototypeOf(values);
    };

    gc.conditionalsStack = [];

    Object.getOwnPropertyNames(Canvas.graphicsContextAliases).forEach(function(alias) {
        gc[alias] = gc[Canvas.graphicsContextAliases[alias]];
    });

    return Object.assign(gc, require('./graphics'));
}

Canvas.graphicsContextAliases = {
    simpleText: 'fillText'
};


module.exports = Canvas;
