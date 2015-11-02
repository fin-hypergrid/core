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
