import Base from '../Base'
import Localization from '../lib/Localization';
import effects from '../lib/DOM/effects'

export abstract class CellEditor extends Base {
    public grid: any
    public input: any

    protected event: any
    protected localizer: any = Localization.prototype.null
    protected template: string = ''

    private initialValue: any
    private el: any
    private checkEditorPositionFlag: boolean = false
    private errors: any



    private specialKeyups: any = {
        //0x08: 'clearStopEditing', // backspace
        0x09: 'stopEditing', // tab
        0x0d: 'stopEditing', // return/enter
        0x1b: 'cancelEditing' // escape
    }

    /**
     *
     */
    constructor(grid: any, options: any) {
        super();
        this.initProps()

        this.grid = grid
        this.grid.cellEditor = this

        this.event = options
        var localizer = this.grid.localization.get(options.format); // try to get named localizer
        if (!(localizer === Localization.prototype.string || options.format === 'string')) {
            this.localizer = localizer;
        }

        this.initialValue = options.value;

        var container = document.createElement('DIV');
        container.innerHTML = this.grid.modules.templater.render(this.template, this);
        this.el = container.firstChild;
        this.input = this.el;
        this.errors = 0;

        var self = this;
        this.el.addEventListener('keyup', this.keyUp.bind(this));
        this.el.addEventListener('keydown', function (e) {
            if (e.keyCode === 9) {
                // prevent TAB from leaving input control
                e.preventDefault();
            }
            grid.fireSyntheticEditorKeyDownEvent(self, e);
        });
        this.el.addEventListener('keypress', function (e) {
            grid.fireSyntheticEditorKeyPressEvent(self, e);
        });
        this.el.addEventListener('mousedown', this.onMouseDown.bind(this));
    }

    protected abstract initProps()

    onMouseDown(event: any) {
        event.stopPropagation();
    }

    keyUp(event: any) {
        var grid = this.grid,
            cellProps = this.event.properties,
            feedbackCount = cellProps.feedbackCount,
            keyChar = grid.canvas.getKeyChar(event),
            specialKeyup,
            stopped;

        // STEP 1: Call the special key handler as needed
        if (
            (specialKeyup = this.specialKeyups[event.keyCode]) &&
            (stopped = this[specialKeyup](feedbackCount))
        ) {
            grid.repaint();
        }

        // STEP 2: If this is a possible "nav key" consumable by CellSelection#handleKeyDown, try to stop editing and send it along
        if (cellProps.mappedNavKey(keyChar, event.ctrlKey)) {
            if (
                !specialKeyup &&
                // We didn't try to stop editing above so try to stop it now
                (stopped = this.stopEditing(feedbackCount))
            ) {
                grid.repaint();
            }

            if (stopped) {
                // Editing successfully stopped
                // -> send the event down the feature chain
                var finEvent = grid.canvas.newEvent(event, 'fin-editor-keydown', {
                    grid: grid,
                    alt: event.altKey,
                    ctrl: event.ctrlKey,
                    char: keyChar,
                    legacyChar: event.legacyKey, // decorated by getKeyChar
                    code: event.charCode,
                    key: event.keyCode,
                    meta: event.metaKey,
                    shift: event.shiftKey,
                    identifier: event.key,
                    editor: this
                });
                grid.delegateKeyDown(finEvent);
            }
        }

        this.grid.fireSyntheticEditorKeyUpEvent(this, event);

        return stopped;
    }

    gridRenderedNotification() {
        this.checkEditor();
    }

    scrollValueChangedNotification() {
        this.checkEditorPositionFlag = true;
    }

    moveEditor() {
        this.setBounds(this.event.bounds);
    }

    beginEditing() {
        if (this.grid.fireRequestCellEdit(this.event, this.initialValue)) {
            this.checkEditorPositionFlag = true;
            this.checkEditor();
        }
    }

    setEditorValue(value: any) {
        this.input.value = this.localizer.format(value);
    }

    showEditor() {
        this.el.style.display = 'inline';
    }

    hideEditor() {
        this.el.style.display = 'none';
    }

    stopEditing(feedback: any) {
        var str = this.input.value;

        try {
            var error = this.validateEditorValue(str);
            if (!error) {
                var value = this.getEditorValue(str);
            }
        } catch (err) {
            error = err;
        }

        if (!error && this.grid.fireSyntheticEditorDataChangeEvent(this, this.initialValue, value)) {
            try {
                this.saveEditorValue(value);
            } catch (err) {
                error = err;
            }
        }

        if (!error) {
            this.hideEditor();
            this.grid.cellEditor = null;
            this.el.remove();
        } else if (feedback >= 0) { // false when `feedback` undefined
            this.errorEffectBegin(++this.errors % feedback === 0 && error);
        } else { // invalid but no feedback
            this.cancelEditing();
        }

        return !error;
    }

    cancelEditing(): boolean {
        this.setEditorValue(this.initialValue);
        this.hideEditor();
        this.grid.cellEditor = null;
        this.el.remove();
        this.grid.takeFocus();

        return true;
    }

    private effecting: any
    private effects: any

    errorEffectBegin(error: any) {
        if (this.effecting) {
            return;
        }

        var spec = this.grid.properties.feedbackEffect, // spec may e a string or an object with name and options props
            effect = effects[spec.name || spec]; // if spec is a string, spec.name will be undefined

        if (effect) {
            var options = Object.assign({}, spec.options); // if spec is a string, spec.options will be undefined
            options.callback = this.errorEffectEnd.bind(this, error);
            this.effecting = true;
            effect.call(this, options);
        }
    }

    errorEffectEnd(error: any, options: any) {
        if (error) {
            var msg =
                'Invalid value. To resolve, do one of the following:\n\n' +
                '   * Correct the error and try again.\n' +
                '         - or -\n' +
                '   * Cancel editing by pressing the "esc" (escape) key.';

            error = error.message || error;

            if (typeof error !== 'string') {
                error = '';
            }

            if (this.localizer.expectation) {
                error = error ? error + '\n' + this.localizer.expectation : this.localizer.expectation;
            }

            if (error) {
                if (/[\n\r]/.test(error)) {
                    error = '\n' + error;
                    error = error.replace(/[\n\r]+/g, '\n\n   * ');
                }
                msg += '\n\nAdditional information about this error: ' + error;
            }

            setTimeout(function () { // allow animation to complete
                alert(msg); // eslint-disable-line no-alert
            });
        }
        this.effecting = false;
    }

    saveEditorValue(value: any): boolean {
        var save = (
            !(value && value === this.initialValue) && // data changed
            this.grid.fireBeforeCellEdit(this.event.gridCell, this.initialValue, value, this) // proceed
        );

        if (save) {
            this.event.value = value;
            this.grid.fireAfterCellEdit(this.event.gridCell, this.initialValue, value, this);
        }

        return save;
    }

    getEditorValue(str: any) {
        return this.localizer.parse(str || this.input.value);
    }

    validateEditorValue(str: any) {
        return this.localizer.invalid && this.localizer.invalid(str || this.input.value);
    }

    takeFocus() {
        var el = this.el,
            leftWas = el.style.left,
            topWas = el.style.top;

        el.style.left = el.style.top = 0; // work-around: move to upper left

        var x = window.scrollX, y = window.scrollY;
        this.input.focus();
        window.scrollTo(x, y);
        this.selectAll();

        el.style.left = leftWas;
        el.style.top = topWas;
    }

    selectAll = nullPattern

    setBounds(cellBounds: any) {
        var style = this.el.style;

        style.left = px(cellBounds.x);
        style.top = px(cellBounds.y);
        style.width = px(cellBounds.width);
        style.height = px(cellBounds.height);
    }

    checkEditor() {
        if (this.checkEditorPositionFlag) {
            this.checkEditorPositionFlag = false;
            if (this.event.isCellVisible) {
                this.setEditorValue(this.initialValue);
                this.attachEditor();
                this.moveEditor();
                this.showEditor();
                this.takeFocus();
            } else {
                this.hideEditor();
            }
        }
    }

    attachEditor() {
        this.grid.div.appendChild(this.el);
    }
}


function nullPattern() { }
function px(n) { return n + 'px'; }
