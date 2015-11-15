'use strict';

function stabilize(comparator, descending, arr1, arr2) { // eslint-disable-line no-shadow
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
}

function ascendingNumbers(x, y) {
    return x - y;
}

function descendingNumbers(x, y) {
    return y - x;
}

function ascendingAllOthers(x, y) {
    return x < y ? -1 : 1;
}

function descendingAllOthers(x, y) {
    return y < x ? -1 : 1;
}

function ascending(typeOfData) {
    return stabilize.bind(this, typeOfData === 'number' ? ascendingNumbers : ascendingAllOthers, false);
}

function descending(typeOfData) {
    return stabilize.bind(this, typeOfData === 'number' ? descendingNumbers : descendingAllOthers, true);
}

function sort(index, getValue, direction) {

    var compare, i;

    // apply defaults
    if (direction === undefined) {
        direction = 1;
    }

    if (index.length) { // something to do
        switch (direction) {
            case 0:
                return; // bail: nothing to sort

            case 1:
                compare = ascending(typeof getValue(0));
                break;

            case -1:
                compare = descending(typeof getValue(0));
                break;

            default:
                throw 'Unexpected sort direction value.';
        }

        // set up the sort.....
        var tmp = new Array(index.length);

        // add the index for "stability"
        for (i = 0; i < index.length; i++) {
            tmp[i] = [getValue(i), i];
        }

        // do the actual sort
        tmp.sort(compare);

        // copy the sorted values into our index vector
        for (i = 0; i < index.length; i++) {
            index[i] = tmp[i][1];
        }
    }

}

exports.sort = sort;