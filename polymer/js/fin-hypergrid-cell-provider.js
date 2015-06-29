'use strict';
/**
 *
 * @module .\cell-provider
 * @description
##### fin-hypergrid-cell-provider is the cache for cell renderers.  A CellRenderer is an object with a single function 'paint'. There should only be a single reused CellRenderer object created for each type of CellRenderer. Custom CellRenderers can be attached to myCellProvider.cellCache and then referenced through the getCell function that is overridden in your implementation.  Make sure to attach the config argument to the cell renderer that is returned.
 */
var noop = function() {};

(function() {

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


    Polymer({ /* jslint ignore:line */

        /**
         * @function
         * @private
         * @instance
         */
        created: function() {
            this.cellCache = {};
            this.initializeCells();
        },

        /**
         * @function
         * @description replace this function in on your instance of cellProvider
         * @returns cell
         * @param {object} config - an object with everything you might need for renderering a cell
         * @instance
         */
        getCell: function(config) {
            var cell = this.cellCache.simpleCellRenderer;
            cell.config = config;
            return cell;
        },

        /**
         * @function
         * @description replace this function in on your instance of cellProvider
         * @returns cell
         * @param {object} config - an object with everything you might need for renderering a cell
         * @instance
         */
        getTopLeftCell: function(config) {
            var cell = this.cellCache.emptyCellRenderer;
            cell.config = config;
            return cell;
        },

        /**
         * @function
         * @description replace this function in on your instance of cellProvider
         * @returns cell
         * @param {object} config - an object with everything you might need for renderering a cell
         * @instance
         */
        getFixedColumnCell: function(config) {
            var cell = this.cellCache.simpleCellRenderer;
            cell.config = config;
            return cell;
        },

        /**
         * @function
         * @description replace this function in on your instance of cellProvider
         * @returns cell
         * @param {object} config - an object with everything you might need for renderering a cell
         * @instance
         */
        getFixedRowCell: function(config) {
            var cell = this.cellCache.simpleCellRenderer;
            cell.config = config;
            return cell;
        },

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
        defaultCellPaint: function(gc, x, y, width, height, isLink) {

            isLink = isLink || false;
            var colHEdgeOffset = this.config.properties.cellPadding,
                halignOffset = 0,
                valignOffset = this.config.voffset,
                halign = this.config.halign,
                isColumnHovered = this.config.isColumnHovered,
                isRowHovered = this.config.isRowHovered,
                val = this.config.value;

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

            if (gc.font !== this.config.font) {
                gc.font = this.config.font;
            }
            if (gc.textAlign !== 'left') {
                gc.textAlign = 'left';
            }
            if (gc.textBaseline !== 'middle') {
                gc.textBaseline = 'middle';
            }

            var fontMetrics = this.config.getTextHeight(this.config.font);
            var textWidth = this.config.getTextWidth(gc, val);


            //we must set this in order to compute the minimum width
            //for column autosizing purposes
            this.config.minWidth = textWidth + (2 * colHEdgeOffset);

            if (halign === 'right') {
                //textWidth = this.config.getTextWidth(gc, this.config.value);
                halignOffset = width - colHEdgeOffset - textWidth;
            } else if (halign === 'center') {
                //textWidth = this.config.getTextWidth(gc, this.config.value);
                halignOffset = (width - textWidth) / 2;
            } else if (halign === 'left') {
                halignOffset = colHEdgeOffset;
            }

            halignOffset = Math.max(0, halignOffset);
            valignOffset = valignOffset + Math.ceil(height / 2);

            //fill background only if our bgColor is populated or we are a selected cell
            if (this.config.bgColor || this.config.isSelected) {
                gc.fillStyle = this.config.isSelected ? this.config.bgSelColor : this.config.bgColor;
                gc.fillRect(x, y, width, height);
            }

            //draw text
            var theColor = this.config.isSelected ? this.config.fgSelColor : this.config.fgColor;
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
                    gc.beginPath();
                    underline(this.config, gc, val, x + halignOffset, y + valignOffset + Math.floor(fontMetrics.height / 2), 1);
                    gc.stroke();
                    gc.closePath();
                }
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
                ixoffset = Math.round((halignOffset - rightIcon.width) / 2);
                gc.drawImage(rightIcon, x + width - ixoffset - rightIcon.width, y + iyoffset);
                iconWidth = Math.max(rightIcon.width + 2);
            }
            if (centerIcon) {
                iyoffset = Math.round((height - centerIcon.height) / 2);
                ixoffset = Math.round((width - centerIcon.width) / 2);
                gc.drawImage(centerIcon, x + width - ixoffset - centerIcon.width, y + iyoffset);
                iconWidth = Math.max(centerIcon.width + 2);
            }
            this.config.minWidth = this.config.minWidth + 2 * (iconWidth);
        },

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
        paintSlider: function(gc, x, y, width, height) {
            gc.strokeStyle = 'white';
            var val = this.config.value;
            var radius = height / 2;
            var offset = width * val;
            var bgColor = this.config.isSelected ? this.config.bgSelColor : '#333333';
            var btnGradient = gc.createLinearGradient(x, y, x, y + height);
            btnGradient.addColorStop(0, bgColor);
            btnGradient.addColorStop(1, '#666666');
            var arcGradient = gc.createLinearGradient(x, y, x, y + height);
            arcGradient.addColorStop(0, '#aaaaaa');
            arcGradient.addColorStop(1, '#777777');
            gc.fillStyle = btnGradient;
            roundRect(gc, x, y, width, height, radius, btnGradient);
            if (val < 1.0) {
                gc.fillStyle = arcGradient;
            } else {
                gc.fillStyle = '#eeeeee';
            }
            gc.beginPath();
            gc.arc(x + Math.max(offset - radius, radius), y + radius, radius, 0, 2 * Math.PI);
            gc.fill();
            gc.closePath();
            this.config.minWidth = 100;
        },

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
        paintSparkbar: function(gc, x, y, width, height) {
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

        },


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
        paintSparkline: function(gc, x, y, width, height) {
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
        },

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
        treeCellRenderer: function(gc, x, y, width, height) {
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
        },

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
        emptyCellRenderer: function(gc, x, y, width, height) {
            noop(gc, x, y, width, height);
        },

        /**
         * @function
         * @instance
         * @private
         */
        initializeCells: function() {
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
            this.cellCache.linkCellRenderer = {
                paint: function(gc, x, y, width, height) {
                    self.config = this.config;
                    self.defaultCellPaint(gc, x, y, width, height, true);
                },
            };
        },

    });
})(); /* jslint ignore:line */
