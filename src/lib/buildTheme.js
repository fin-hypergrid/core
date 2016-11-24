/* eslint-env browser */

'use strict';

function buildTheme(theme) {
    clearObjectProperties(theme);
    var pb = document.createElement('paper-button'); // styles were based on old polymer theme

    pb.style.display = 'none';
    pb.setAttribute('disabled', true);
    document.body.appendChild(pb);
    var p = window.getComputedStyle(pb);

    var section = document.createElement('section');
    section.style.display = 'none';
    section.setAttribute('hero', true);
    document.body.appendChild(section);

    var h = window.getComputedStyle(document.querySelector('html'));
    var hb = window.getComputedStyle(document.querySelector('html, body'));
    var s = window.getComputedStyle(section);

    theme.columnHeaderBackgroundColor = p.color;
    theme.rowHeaderBackgroundColor = p.color;
    theme.topLeftBackgroundColor = p.color;
    theme.lineColor = p.backgroundColor;

    theme.backgroundColor2 = hb.backgroundColor;

    theme.color = h.color;
    theme.fontFamily = h.fontFamily;
    theme.backgroundColor = s.backgroundColor;

    pb.setAttribute('disabled', false);
    pb.setAttribute('secondary', true);
    pb.setAttribute('raised', true);
    p = window.getComputedStyle(pb);

    theme.columnHeaderColor = p.color;
    theme.rowHeaderColor = p.color;
    theme.topLeftColor = p.color;


    theme.backgroundSelectionColor = p.backgroundColor;
    theme.foregroundSelectionColor = p.color;

    pb.setAttribute('secondary', false);
    pb.setAttribute('warning', true);

    theme.columnHeaderForegroundSelectionColor = p.color;
    theme.columnHeaderBackgroundSelectionColor = p.backgroundColor;
    theme.rowHeaderForegroundSelectionColor = p.color;
    theme.fixedColumnBackgroundSelectionColor = p.backgroundColor;

    //check if there is actually a theme loaded if not, clear out all bogus values
    //from my cache
    if (theme.columnHeaderBackgroundSelectionColor === 'rgba(0, 0, 0, 0)' ||
        theme.lineColor === 'transparent') {
        clearObjectProperties(theme);
    }

    document.body.removeChild(pb);
    document.body.removeChild(section);

    return theme;
}

function clearObjectProperties(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            delete obj[prop];
        }
    }
}

module.exports = buildTheme;
