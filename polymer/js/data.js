'use strict';

var noop = function() {};

window.flashSort = (function() {
    /*jshint bitwise: false*/
    return function(indexVector, a) {
        var n = a.length;

        var i = 0,
            j = 0,
            k = 0,
            t;
        var m = ~~(n * 0.125);
        var anmin = a[indexVector[0]];
        var nmax = 0;
        var nmove = 0;

        var l = new Array(m);
        for (i = 0; i < m; i++) {
            l[i] = 0;
        }

        for (i = 1; i < n; ++i) {
            var ai = a[indexVector[i]];
            if (ai < anmin) {
                anmin = ai;
            }
            if (ai > a[indexVector[nmax]]) {
                nmax = i;
            }
        }

        var anmax = a[indexVector[nmax]];
        if (anmin === anmax) {
            return a;
        }
        var c1 = (m - 1) / (anmax - anmin);

        for (i = 0; i < n; ++i) {
            ++l[~~(c1 * (a[indexVector[i]] - anmin))];
        }

        for (k = 1; k < m; ++k) {
            l[k] += l[k - 1];
        }

        var hold = anmax;
        var hi = indexVector[nmax];
        indexVector[nmax] = indexVector[0];
        indexVector[0] = hi;

        var flash, fi;
        j = 0;
        k = m - 1;
        i = n - 1;

        while (nmove < i) {
            while (j > (l[k] - 1)) {
                k = ~~(c1 * (a[indexVector[++j]] - anmin));
            }
            // line below added 07/03/2013, ES
            if (k < 0) {
                break;
            }

            fi = indexVector[j];
            flash = a[fi];

            while (j !== l[k]) {
                k = ~~(c1 * (flash - anmin));
                t = --l[k];

                hold = a[indexVector[t]];
                hi = indexVector[t];
                indexVector[t] = fi;
                flash = hold;
                fi = hi;
                ++nmove;
            }
        }

        for (j = 1; j < n; ++j) {
            hold = a[indexVector[j]];
            hi = indexVector[j];
            i = j - 1;
            while (i >= 0 && a[indexVector[i]] > hold) {
                indexVector[i + 1] = indexVector[i--];
            }
            indexVector[i + 1] = hi;
        }

        return a;
    };
})();

window.dualPivotQuickSort = (function() {

    var dualPivotQS = {};

    dualPivotQS.sort = function(indexVector, arr, fromIndex, toIndex) {
        if (fromIndex === undefined && toIndex === undefined) {
            this.sort(indexVector, arr, 0, arr.length);
        } else {
            rangeCheck(indexVector, arr.length, fromIndex, toIndex);
            dualPivotQuicksort(indexVector, arr, fromIndex, toIndex - 1, 3);
        }
        return arr;
    };

    function rangeCheck(indexVector, length, fromIndex, toIndex) {
        if (fromIndex > toIndex) {
            console.error('fromIndex(' + fromIndex + ') > toIndex(' + toIndex + ')');
        }
        if (fromIndex < 0) {
            console.error(fromIndex);
        }
        if (toIndex > length) {
            console.error(toIndex);
        }
    }

    function swap(indexVector, arr, i, j) {
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    function dualPivotQuicksort(indexVector, arr, left, right, div) {
        var len = right - left;

        if (len < 27) { // insertion sort for tiny array
            for (var i = left + 1; i <= right; i++) {
                for (var j = i; j > left && arr[j] < arr[j - 1]; j--) {
                    swap(indexVector, arr, j, j - 1);
                }
            }
            return;
        }
        var third = Math.floor(len / div); //TODO: check if we need to round up or down or just nearest

        // 'medians'
        var m1 = left + third;
        var m2 = right - third;

        if (m1 <= left) {
            m1 = left + 1;
        }
        if (m2 >= right) {
            m2 = right - 1;
        }
        if (arr[m1] < arr[m2]) {
            swap(indexVector, arr, m1, left);
            swap(indexVector, arr, m2, right);
        } else {
            swap(indexVector, arr, m1, right);
            swap(indexVector, arr, m2, left);
        }
        // pivots
        var pivot1 = arr[left];
        var pivot2 = arr[right];

        // pointers
        var less = left + 1;
        var great = right - 1;
        var k;
        // sorting
        for (k = less; k <= great; k++) {
            if (arr[k] < pivot1) {
                swap(indexVector, arr, k, less++);
            } else if (arr[k] > pivot2) {
                while (k < great && arr[great] > pivot2) {
                    great--;
                }
                swap(indexVector, arr, k, great--);

                if (arr[k] < pivot1) {
                    swap(indexVector, arr, k, less++);
                }
            }
        }
        // swaps
        var dist = great - less;

        if (dist < 13) {
            div++;
        }
        swap(indexVector, arr, less - 1, left);
        swap(indexVector, arr, great + 1, right);

        // subarrays
        dualPivotQuicksort(indexVector, arr, left, less - 2, div);
        dualPivotQuicksort(indexVector, arr, great + 2, right, div);

        // equal            var k;elements
        if (dist > len - 13 && pivot1 !== pivot2) {
            for (k = less; k <= great; k++) {
                if (arr[k] === pivot1) {
                    swap(indexVector, arr, k, less++);
                } else if (arr[k] === pivot2) {
                    swap(indexVector, arr, k, great--);

                    if (arr[k] === pivot1) {
                        swap(indexVector, arr, k, less++);
                    }
                }
            }
        }
        // subarray
        if (pivot1 < pivot2) {
            dualPivotQuicksort(indexVector, arr, less, great, div);
        }
    }
    return dualPivotQS.sort;
}());

var SIZE = 1000;
var seed = 0;
var firstNames = ['Olivia', 'Sophia', 'Ava', 'Isabella', 'Boy', 'Liam', 'Noah', 'Ethan', 'Mason', 'Logan', 'Moe', 'Larry', 'Curly', 'Shemp', 'Groucho', 'Harpo', 'Chico', 'Zeppo', 'Stanley', 'Hardy'];
var lastNames = ['Wirts', 'Oneil', 'Smith', 'Barbarosa', 'Soprano', 'Gotti', 'Columbo', 'Luciano', 'Doerre', 'DePena'];
var states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
var randomFunc = function() {
    return Math.abs(Math.sin(seed++));
};
var data = new Array(SIZE);
var randomPerson = function() {
    var firstName = Math.round((firstNames.length - 1) * randomFunc());
    //var lastName = 'a' + randomFunc() + 'b';
    var lastName = Math.round((lastNames.length - 1) * randomFunc());
    var pets = Math.round(10 * randomFunc());
    // var birthyear = 1900 + Math.round(randomFunc() * 114);
    // var birthmonth = Math.round(randomFunc() * 11);
    // var birthday = Math.round(randomFunc() * 29);
    var birthstate = Math.round(randomFunc() * 49);
    var residencestate = Math.round(randomFunc() * 49);
    var travel = Number.parseFloat((randomFunc() * 1000).toFixed(2));
    var income = randomFunc() * 100000;
    var employed = Math.round(randomFunc());
    var person = {
        lastName: lastNames[lastName],
        firstName: firstNames[firstName],
        pets: pets,
        birthDate: new Date(randomFunc() * 1000),
        birthState: states[birthstate],
        residenceState: states[residencestate],
        employed: employed === 1,
        income: income,
        travel: travel
    };
    return person;
};

for (var i = 0; i < SIZE; i++) {
    data[i] = randomPerson();
}

var fields = [
    'lastName',
    'firstName',
    'pets',
    'birthDate',
    'birthState',
    'residenceState',
    'employed',
    'income',
    'travel'
];

//turn each field into a column
//is it an enumeration?
//is it a number
//for each column
var finanalytics = function(data, fields) {
    noop(data, fields);
    var that = {};
    var enumThreshold = 0.40;
    var initializers = {
        String: function(index, data, meta, value) {
            data[index] = value;
            meta.enum.add(value);
            meta.types.add('String');
            meta.sort = window.dualPivotQuickSort;
        },
        Number: function(index, data, meta, value) {
            data[index] = value;
            meta.enum.add(value);
            meta.types.add('Number');
        },
        Boolean: function(index, data, meta, value) {
            data[index] = value;
            meta.enum.add(value);
            meta.types.add('Boolean');
        },
        Date: function(index, data, meta, value) {
            data[index] = value.getTime();
            meta.enum.add(value);
            meta.types.add('Date');
            meta.sort = window.dualPivotQuickSort;
        }
    };
    that.initialize = function() {
        that.data = new Array(fields.length);
        that.meta = new Array(fields.length);
        that.index = new Array(data.length);
        var i, f = 0;
        var each;
        for (i = 0; i < fields.length; i++) {
            that.data[i] = new Array(data.length);
            that.meta[i] = {
                enum: new Set(),
                sort: window.flashSort,
                types: new Set(),
                get: function(array, index) {
                    return array[index];
                },
                /* jshint ignore:line */
                init: function( /* array, index */ ) {} /* jshint ignore:line */
            };
        }
        for (i = 0; i < data.length; i++) {
            //initialize our sort vector
            // var c = 0;
            that.index[i] = i;

            for (f = 0; f < fields.length; f++) {
                each = data[i][fields[f]];
                initializers[each.constructor.name](i, that.data[f], that.meta[f], each);
            }

            // inlined like this is 30% faster this needs to be generated
            // each = data[i].firstName;
            // initializers[each.constructor.name](i, that.data[c], that.meta[c++], each);

            // each = data[i].pets;
            // initializers[each.constructor.name](i, that.data[c], that.meta[c++], each);

            // each = data[i].birthDate;
            // initializers[each.constructor.name](i, that.data[c], that.meta[c++], each);

            // each = data[i].birthState;
            // initializers[each.constructor.name](i, that.data[c], that.meta[c++], each);

            // each = data[i].residenceState;
            // initializers[each.constructor.name](i, that.data[c], that.meta[c++], each);

            // each = data[i].employed;
            // initializers[each.constructor.name](i, that.data[c], that.meta[c++], each);

            // each = data[i].income;
            // initializers[each.constructor.name](i, that.data[c], that.meta[c++], each);

            // each = data[i].travel;
            // initializers[each.constructor.name](i, that.data[c], that.meta[c++], each);

        }

        for (f = 0; f < fields.length; f++) {
            each = that.meta[f];

            //lots of redundant data here, lets turn it into an enum
            if (each.enum.size < enumThreshold * that.data[f].length) {
                console.log('enum ' + fields[f]);
                var items = new Array(each.enum.size);
                i = 0;
                each.enum.forEach(function(e) {
                    items[i++] = e;
                }); /* jshint ignore:line */
                items.sort();
                each.enumMap = new Map();
                each.enum = items;
                for (i = 0; i < items.length; i++) {
                    each.enumMap.set(items[i], i);
                }
                each.get = function(array, index) {
                    return items[array[index]];
                }; /* jshint ignore:line */
                each.init = function(array, index) {
                    //lets swap out my real value for an integer
                    array[index] = each.enumMap.get(array[index]);
                }; /* jshint ignore:line */
                //now we can do a flash sort! super fast man!
                each.sort = window.flashSort;
            } else {
                //clear out our enum counter
                each.enum = null;
            }
        }

        //iterate through the data one more time and let
        //the column meta objects do what they want
        for (i = 0; i < data.length; i++) {
            for (f = 0; f < fields.length; f++) {
                each = that.meta[f];
                each.init(that.data[f], i);
            }
        }
    };
    that.getValue = function(x, y) {
        var value = that.meta[x].get(that.data[x], that.index[y]);
        return value;
    };
    that.sort = function(index) {
        var start = Date.now();
        that.meta[index].sort(that.index, that.data[index]);
        console.log('sort first col', Date.now() - start);
    };
    that.initialize();
    data = null;
    fields = null;
    return that;
};

var start = Date.now();
var fa = finanalytics(data, fields);
console.log('create', Date.now() - start);

fa.sort(3);
