/* eslint-env browser */

'use strict';

if (typeof window.CustomEvent !== 'function') {
    window.CustomEvent = function(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    };

    window.CustomEvent.prototype = window.Event.prototype;
}

var rectangular = require('rectangular');

var RESIZE_POLLING_INTERVAL = 200,
    paintables = [],
    resizables = [],
    paintLoopRunning = true,
    resizeLoopRunning = true,
    charMap = makeCharMap();

function Canvas(div, component) {
    var self = this;

    this.div = div;
    this.component = component;

    this.dragEndtime = Date.now();

    this.gc = getCachedContext(this.canvas = document.createElement('canvas'));
    this.bc = getCachedContext(this.buffer = document.createElement('canvas'));

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
    this.canvas.addEventListener('focus', function(e) {
        self.finfocusgained(e);
    });
    this.canvas.addEventListener('blur', function(e) {
        self.finfocuslost(e);
    });
    this.canvas.addEventListener('mousedown', function(e) {
        self.finmousedown(e);
    });
    this.canvas.addEventListener('mouseout', function(e) {
        self.hasMouse = false;
        self.finmouseout(e);
    });
    this.canvas.addEventListener('click', function(e) {
        self.finclick(e);
    });
    this.canvas.addEventListener('contextmenu', function(e) {
        self.fincontextmenu(e);
        e.preventDefault();
        return false;
    });

    this.canvas.setAttribute('tabindex', 0);
    this.canvas.contentEditable = true;

    this.resize();

    this.beginResizing();
    this.beginPainting();
}

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
    lastDoubleClickTime: 0,
    dragEndTime: 0,
    lastRepaintTime: 0,
    currentPaintCount: 0,
    currentFPS: 0,
    lastFPSComputeTime: 0,

    addEventListener: function(name, callback) {
        this.canvas.addEventListener(name, callback);
    },

    stopPaintLoop: function() {
        paintLoopRunning = false;
    },

    restartPaintLoop: function() {
        if (paintLoopRunning) {
            return; // already running
        }
        paintLoopRunning = true;
        requestAnimationFrame(paintLoopFunction);
    },

    stopResizeLoop: function() {
        resizeLoopRunning = false;
    },

    restartResizeLoop: function() {
        if (resizeLoopRunning) {
            return; // already running
        }
        resizeLoopRunning = true;
        setInterval(resizablesLoopFunction, 200);
    },

    detached: function() {
        this.stopPainting();
        this.stopResizing();
    },

    getCurrentFPS:function() {
        return this.currentFPS;
    },


    tickPaint: function(now) {
        var isContinuousRepaint = this.component.resolveProperty('enableContinuousRepaint'),
            fps = this.component.resolveProperty('repaintIntervalRate');
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

    beginPainting: function() {
        var self = this;
        this.dirty = true;
        this.tickPainter = function(now) {
            self.tickPaint(now);
        };
        paintables.push(this);
    },

    stopPainting: function() {
        paintables.splice(paintables.indexOf(this), 1);
    },

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

    checksize: function() {
        //this is expensive lets do it at some modulo
        var sizeNow = this.div.getBoundingClientRect();
        if (sizeNow.width !== this.size.width || sizeNow.height !== this.size.height) {
            this.sizeChangedNotification();
        }
    },

    sizeChangedNotification: function() {
        this.resize();
    },

    resize: function() {
        var box = this.size = this.div.getBoundingClientRect();

        this.width = box.width;
        this.height = box.height;

        //fix ala sir spinka, see
        //http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        //just add 'hdpi' as an attribute to the fin-canvas tag
        var ratio = 1;
        var isHIDPI = window.devicePixelRatio && this.component.resolveProperty('useHiDPI');
        if (isHIDPI) {
            var devicePixelRatio = window.devicePixelRatio || 1;
            var backingStoreRatio = this.gc.webkitBackingStorePixelRatio ||
                this.gc.mozBackingStorePixelRatio ||
                this.gc.msBackingStorePixelRatio ||
                this.gc.oBackingStorePixelRatio ||
                this.gc.backingStorePixelRatio || 1;

            ratio = devicePixelRatio / backingStoreRatio;
            //this.canvasCTX.scale(ratio, ratio);
        }

        this.buffer.width = this.canvas.width = this.width * ratio;
        this.buffer.height = this.canvas.height = this.height * ratio;

        this.canvas.style.width = this.buffer.style.width = this.width + 'px';
        this.canvas.style.height = this.buffer.style.height = this.height + 'px';

        this.bc.scale(ratio, ratio);
        if (isHIDPI && !this.component.resolveProperty('useBitBlit')) {
            this.gc.scale(ratio, ratio);
        }

        //this.origin = new rectangular.Point(Math.round(this.size.left), Math.round(this.size.top));
        this.bounds = new rectangular.Rectangle(0, 0, this.width, this.height);
        //setTimeout(function() {
        var comp = this.component;
        if (comp) {
            comp.setBounds(this.bounds);
        }
        this.resizeNotification();
        this.paintNow();
        //});
    },

    resizeNotification: function() {
        //to be overridden
    },

    getBounds: function() {
        return this.bounds;
    },

    paintNow: function() {
        var self = this;
        this.safePaintImmediately(function(gc) {
            gc.clearRect(0, 0, self.width, self.height);

            var comp = self.component;
            if (comp) {
                comp.paint(gc);
            }

            self.dirty = false;
        });
    },

    safePaintImmediately: function(paintFunction) {
        var useBitBlit = this.component.resolveProperty('useBitBlit'),
            gc = useBitBlit ? this.bc : this.gc;
        try {
            gc.cache.save();
            paintFunction(gc);
        } catch (e) {
            console.error(e);
        } finally {
            gc.cache.restore();
        }
        if (useBitBlit) {
            this.flushBuffer();
        }
    },

    flushBuffer: function() {
        if (this.buffer.width > 0 && this.buffer.height > 0) {
            this.gc.drawImage(this.buffer, 0, 0);
        }
    },

    dispatchNewEvent: function(event, name, detail) {
        detail = {
            detail: detail || {}
        };
        detail.detail.primitiveEvent = event;
        return this.canvas.dispatchEvent(new CustomEvent(name, detail));
    },

    dispatchNewMouseKeysEvent: function(event, name, detail) {
        detail = detail || {};
        detail.mouse = this.mouseLocation;
        detail.keys = this.currentKeys;
        return this.dispatchNewEvent(event, name, detail);
    },

    finmousemove: function(e) {
        if (!this.isDragging() && this.mousedown) {
            this.beDragging();
            this.dispatchNewMouseKeysEvent(e, 'fin-canvas-dragstart', {
                isRightClick: this.isRightClick(e)
            });
            this.dragstart = new rectangular.Point(this.mouseLocation.x, this.mouseLocation.y);
        }
        this.mouseLocation = this.getLocal(e);
        //console.log(this.mouseLocation);
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

    finmousedown: function(e) {
        this.mouseLocation = this.mouseDownLocation = this.getLocal(e);
        this.mousedown = true;

        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-mousedown', {
            isRightClick: this.isRightClick(e)
        });
        this.takeFocus();
    },

    finmouseup: function(e) {
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
            isRightClick: this.isRightClick(e)
        });
        //this.mouseLocation = new rectangular.Point(-1, -1);
    },

    finmouseout: function(e) {
        if (!this.mousedown) {
            this.mouseLocation = new rectangular.Point(-1, -1);
        }
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-mouseout');
    },

    finwheelmoved: function(e) {
        if (this.isDragging() || !this.hasFocus()) {
            return;
        }
        e.preventDefault();
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-wheelmoved', {
            isRightClick: this.isRightClick(e)
        });
    },

    finclick: function(e) {
        var delay = this.component.resolveProperty('doubleClickDelay');
        if (delay < 100) {
            dispatchClickEvent.call(this, e);
        } else if (this.doubleClickTimer && Date.now() - this.lastClickTime < delay) {
            //this is a double click...
            clearTimeout(this.doubleClickTimer); // prevent click event
            this.doubleClickTimer = undefined;
            this.findblclick(e);
        } else {
            this.lastClickTime = Date.now();
            this.doubleClickTimer = setTimeout(dispatchClickEvent.bind(this, e), delay);
        }
    },

    findblclick: function(e) {
        this.mouseLocation = this.getLocal(e);
        this.lastDoubleClickTime = Date.now();
        this.dispatchNewMouseKeysEvent(e, 'fin-canvas-dblclick', {
            isRightClick: this.isRightClick(e)
        });
        //console.log('dblclick', this.currentKeys);
    },

    getCharMap: function() { //TODO: This is static. Make it a property of the constructor.
        return charMap;
    },

    finkeydown: function(e) {
        if (!this.hasFocus()) {
            return;
        }

        //e.preventDefault();
        var keyChar = e.shiftKey ? charMap[e.keyCode][1] : charMap[e.keyCode][0];
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
        if (this.currentKeys.indexOf(keyChar) === -1) {
            this.currentKeys.push(keyChar);
        }
        //console.log(keyChar, e.keyCode);
        this.dispatchNewEvent(e, 'fin-canvas-keydown', {
            alt: e.altKey,
            ctrl: e.ctrlKey,
            char: keyChar,
            code: e.charCode,
            key: e.keyCode,
            meta: e.metaKey,
            repeatCount: this.repeatKeyCount,
            repeatStartTime: this.repeatKeyStartTime,
            shift: e.shiftKey,
            identifier: e.key,
            currentKeys: this.currentKeys.slice(0)
        });
    },

    finkeyup: function(e) {
        var keyChar = e.shiftKey ? charMap[e.keyCode][1] : charMap[e.keyCode][0];
        this.currentKeys.splice(this.currentKeys.indexOf(keyChar), 1);
        if (!this.hasFocus()) {
            return;
        }
        this.repeatKeyCount = 0;
        this.repeatKey = null;
        this.repeatKeyStartTime = 0;
        this.dispatchNewEvent(e, 'fin-canvas-keyup', {
            alt: e.altKey,
            ctrl: e.ctrlKey,
            char: keyChar,
            code: e.charCode,
            key: e.keyCode,
            meta: e.metaKey,
            repeat: e.repeat,
            shift: e.shiftKey,
            identifier: e.key,
            currentKeys: this.currentKeys.slice(0)
        });
    },

    finfocusgained: function(e) {
        this.dispatchNewEvent(e, 'fin-canvas-focus-gained');
    },

    finfocuslost: function(e) {
        this.dispatchNewEvent(e, 'fin-canvas-focus-lost');
    },

    fincontextmenu: function(e) {
        var delay = this.component.resolveProperty('doubleClickDelay');

        if (e.ctrlKey && this.currentKeys.indexOf('CTRL') === -1) {
            this.currentKeys.push('CTRL');
        }

        if (delay < 100) {
            dispatchContextMenuEvent.call(this, e);
        } else if (this.doubleRightClickTimer && Date.now() - this.lastClickTime < delay) {
            //this is a double click...
            clearTimeout(this.doubleRightClickTimer); // prevent context menu event
            this.doubleRightClickTimer = undefined;
            this.findblclick(e);
        } else {
            this.lastClickTime = Date.now();

            this.doubleRightClickTimer = setTimeout(dispatchContextMenuEvent.bind(this, e), delay);
        }
    },

    repaint: function() {
        this.dirty = true;
        if (!paintLoopRunning || this.component.resolveProperty('repaintIntervalRate') === 0) {
            this.paintNow();
        }
    },

    getMouseLocation: function() {
        return this.mouseLocation;
    },

    getOrigin: function() {
        var rect = this.canvas.getBoundingClientRect();
        var p = new rectangular.Point(rect.left, rect.top);
        return p;
    },

    getLocal: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var p = new rectangular.Point(e.clientX - rect.left, e.clientY - rect.top);
        return p;
    },

    hasFocus: function() {
        return document.activeElement === this.canvas;
    },

    takeFocus: function() {
        var self = this;
        if (!this.hasFocus()) {
            setTimeout(function() {
                self.canvas.focus();
            }, 10);
        }
    },

    beDragging: function() {
        this.dragging = true;
        this.disableDocumentElementSelection();
    },

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

    dispatchEvent: function(e) {
        return this.canvas.dispatchEvent(e);
    }
};

function dispatchClickEvent(e) {
    this.doubleClickTimer = undefined;
    this.mouseLocation = this.getLocal(e);
    this.dispatchNewMouseKeysEvent(e, 'fin-canvas-click', {
        isRightClick: this.isRightClick(e)
    });
}

function dispatchContextMenuEvent(e) {
    this.doubleRightClickTimer = undefined;
    this.dispatchNewMouseKeysEvent(e, 'fin-canvas-context-menu', {
        isRightClick: this.isRightClick(e)
    });
}

function paintLoopFunction(now) {
    if (!paintLoopRunning) {
        return;
    }
    for (var i = 0; i < paintables.length; i++) {
        try {
            paintables[i].tickPainter(now);
        } catch (e) {
            console.error(e);
        }
    }
    requestAnimationFrame(paintLoopFunction);
}
requestAnimationFrame(paintLoopFunction);

function resizablesLoopFunction(now) {
    if (!resizeLoopRunning) {
        return;
    }
    for (var i = 0; i < resizables.length; i++) {
        try {
            resizables[i].tickResizer(now);
        } catch (e) {
            console.error(e);
        }
    }
}
setInterval(resizablesLoopFunction, RESIZE_POLLING_INTERVAL);

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
    map[122] = ['F11', 'F1S1HIFT'];
    map[123] = ['F12', 'F121HIFT'];

    return map;
}

function getCachedContext(canvasElement, type) {
    var gc = canvasElement.getContext(type || '2d'),
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

    return Object.assign(gc, require('./graphics'));
}

module.exports = Canvas;
